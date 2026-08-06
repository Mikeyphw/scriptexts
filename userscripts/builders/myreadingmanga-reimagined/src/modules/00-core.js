MRM.events = new EventTarget();
MRM.runtime = {
  page: null,
  cards: [],
  panelOpen: false,
  facetModalOpen: false,
  reader: null,
  archiveObserver: null,
  readerObserver: null,
  refreshTimer: 0,
  lastFocused: null,
};

MRM.selectors = Object.freeze({
  archiveCards: "article.post.entry:has(.entry-title-link)",
  titleLink: ".entry-title-link",
  coverImage: ".entry-image, .post-image",
  postArticle: "body.single-post article.post.entry, body.wp-singular article.post.entry",
  postContent: "article.post.entry > .entry-content, .single-post .entry-content",
  mangaImages: ".entry-content img.img-myreadingmanga, .entry-content img[class*='myreadingmanga']",
  comments: "#comments, #wpdcom, .wpdiscuz-comments",
  commentsCount: ".entry-comments-link, .wpd-thread-head .wpd-thread-info, [class*='comment-count']",
  nativeFacets: ".ep-filter-widget.widget_ep-facet, .widget_ep-facet",
  nativeFacetTitle: ".ep-filter-title",
  nativeFacetTerm: ".term[data-term-slug]",
  mainContent: ".content, main, .site-inner",
  pagination: ".pagination, .archive-pagination, .entry-pagination",
});

MRM.util = (() => {
  const text = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const normalize = (value) => text(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const slugLabel = (value) => text(value).replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const create = (tag, options = {}) => {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.html !== undefined) node.innerHTML = options.html;
    if (options.attrs) for (const [name, value] of Object.entries(options.attrs)) {
      if (value === false || value == null) continue;
      if (value === true) node.setAttribute(name, "");
      else node.setAttribute(name, String(value));
    }
    if (options.dataset) for (const [name, value] of Object.entries(options.dataset)) node.dataset[name] = String(value);
    return node;
  };
  const debounce = (fn, delay = 120) => {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  };
  const throttle = (fn, delay = 120) => {
    let pending = false;
    let latest = null;
    return (...args) => {
      latest = args;
      if (pending) return;
      pending = true;
      window.setTimeout(() => {
        pending = false;
        fn(...latest);
      }, delay);
    };
  };
  const idle = (fn, timeout = 600) => {
    if ("requestIdleCallback" in window) return window.requestIdleCallback(fn, { timeout });
    return window.setTimeout(fn, 1);
  };
  const canonicalUrl = (raw) => {
    try {
      const url = new URL(raw, location.href);
      url.hash = "";
      url.searchParams.delete("output");
      return url.href.replace(/\/$/, "") + "/";
    } catch {
      return "";
    }
  };
  const bestSrcset = (srcset) => {
    const candidates = String(srcset || "").split(",").map((part) => {
      const [url, descriptor = "0w"] = part.trim().split(/\s+/);
      const score = Number.parseFloat(descriptor) || 0;
      return { url, score };
    }).filter((item) => item.url);
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.url || "";
  };
  const imageSource = (img) => {
    if (!img) return "";
    const srcset = img.getAttribute("data-srcset") || img.getAttribute("data-lazy-srcset") || img.getAttribute("srcset");
    const candidates = [
      bestSrcset(srcset),
      img.getAttribute("data-lazy-src"),
      img.getAttribute("data-src"),
      img.getAttribute("data-original"),
      img.currentSrc,
      img.getAttribute("src"),
    ].filter(Boolean);
    return candidates.find((src) => !/^data:,$/.test(src) && !/^data:image\/svg\+xml/i.test(src)) || "";
  };
  const safeFetchDocument = async (url, signal) => {
    const target = new URL(url, location.href);
    if (target.hostname !== location.hostname) throw new Error("Cross-origin reader fetch blocked");
    const response = await fetch(target.href, { credentials: "include", signal, headers: { Accept: "text/html" } });
    if (!response.ok) throw new Error(`Reader fetch failed (${response.status})`);
    const html = await response.text();
    return new DOMParser().parseFromString(html, "text/html");
  };
  const unique = (items, keyFn = (item) => item) => {
    const seen = new Set();
    return items.filter((item) => {
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char]);
  const announce = (message) => {
    let region = q("#mrm-live-region");
    if (!region) {
      region = create("div", { attrs: { id: "mrm-live-region", role: "status", "aria-live": "polite" }, className: "mrm-sr-only" });
      document.body.append(region);
    }
    region.textContent = "";
    requestAnimationFrame(() => { region.textContent = message; });
  };
  const focusable = (root) => qa("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])", root)
    .filter((node) => !node.hidden && node.getClientRects().length);
  const trapFocus = (event, root) => {
    if (event.key !== "Tab") return;
    const nodes = focusable(root);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  };
  const pageTitle = (doc = document) => text(q("article.post.entry .entry-title", doc)?.textContent || doc.title);
  return { text, normalize, slugLabel, clamp, q, qa, create, debounce, throttle, idle, canonicalUrl, imageSource, safeFetchDocument, unique, escapeHtml, announce, focusable, trapFocus, pageTitle };
})();
