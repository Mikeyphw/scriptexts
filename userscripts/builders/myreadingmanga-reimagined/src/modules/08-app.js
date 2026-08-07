MRM.app = (() => {
  const removeNoise = () => {
    document.querySelectorAll("ins[data-zoneid], .eas6a97888e38, [id^='ad-'], .advertisement, .before-footer-widgets").forEach((node) => node.remove());
  };

  const normalizeHref = (href) => {
    try {
      const url = new URL(href, location.href);
      return `${url.origin}${url.pathname.replace(/\/$/, "") || "/"}${url.search}`;
    } catch { return ""; }
  };

  const currentLink = (href) => {
    try {
      const target = new URL(href, location.href);
      if (target.hostname !== location.hostname) return false;
      if (target.searchParams.get("ep_sort") === "rand") return new URL(location.href).searchParams.get("ep_sort") === "rand";
      const targetPath = target.pathname.replace(/\/$/, "") || "/";
      const currentPath = location.pathname.replace(/\/$/, "") || "/";
      if (targetPath === "/") return currentPath === "/" && !location.search;
      return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
    } catch { return false; }
  };

  const collectNavigationLinks = (nativeNav) => {
    const seen = new Set();
    return MRM.util.qa("a[href]", nativeNav || document).map((anchor) => ({
      href: anchor.href,
      label: MRM.util.text(anchor.textContent || anchor.title),
      title: MRM.util.text(anchor.title),
      rel: anchor.rel,
    })).filter((item) => {
      if (!item.href || !item.label || /^mrm$/i.test(item.label)) return false;
      const key = normalizeHref(item.href);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const navigationAnchor = (item) => {
    const anchor = MRM.util.create("a", { text: item.label, attrs: { href: item.href, title: item.title || item.label } });
    if (item.rel) anchor.rel = item.rel;
    if (currentLink(item.href)) anchor.setAttribute("aria-current", "page");
    return anchor;
  };

  const installToolbarMotion = (toolbar) => {
    let previousY = Math.max(0, window.scrollY);
    let frame = 0;
    const sync = () => {
      frame = 0;
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - previousY;
      const blocked = document.documentElement.classList.contains("mrm-reader-open") || MRM.runtime.panelOpen || MRM.runtime.facetModalOpen;
      if (blocked || currentY < 120 || delta < -5) toolbar.classList.remove("mrm-site-toolbar-hidden");
      else if (delta > 7 && currentY > 180) toolbar.classList.add("mrm-site-toolbar-hidden");
      document.documentElement.classList.toggle("mrm-header-hidden", toolbar.classList.contains("mrm-site-toolbar-hidden"));
      previousY = currentY;
    };
    window.addEventListener("scroll", () => {
      if (!frame) frame = requestAnimationFrame(sync);
    }, { passive: true });
    toolbar.addEventListener("focusin", () => {
      toolbar.classList.remove("mrm-site-toolbar-hidden");
      document.documentElement.classList.remove("mrm-header-hidden");
    });
  };

  const enhanceSiteChrome = () => {
    if (MRM.util.q("#mrm-site-toolbar")) return;
    const nativeNav = MRM.util.q(".nav-primary");
    const nativeHeader = MRM.util.q(".site-header");
    if (!nativeNav && !nativeHeader) return;
    const toolbar = MRM.util.create("header", { className: "mrm-site-toolbar", attrs: { id: "mrm-site-toolbar" } });
    const mainTarget = MRM.util.q("main, .site-inner .content, .content");
    if (mainTarget && !mainTarget.id) mainTarget.id = "mrm-main-content";
    const skip = MRM.util.create("a", { className: "mrm-skip-link", text: "Skip to content", attrs: { href: `#${mainTarget?.id || "mrm-main-content"}` } });
    const inner = MRM.util.create("div", { className: "mrm-site-toolbar-inner" });
    const homeHref = MRM.util.q(".menu-item-home a[href]", nativeNav || document)?.href || new URL("/", location.href).href;
    const brand = MRM.util.create("a", { className: "mrm-site-brand", attrs: { href: homeHref, "aria-label": "MyReadingManga home" } });
    if (location.pathname === "/" && !location.search) brand.setAttribute("aria-current", "page");
    brand.innerHTML = '<span class="mrm-site-brand-mark" aria-hidden="true">MRM</span><span class="mrm-site-brand-copy"><strong>MyReadingManga</strong><small>Reimagined</small></span>';

    const nav = MRM.util.create("nav", { className: "mrm-site-nav", attrs: { "aria-label": "Main navigation" } });
    const menu = MRM.util.create("ul", { className: "mrm-site-menu" });
    const links = collectNavigationLinks(nativeNav);
    const primary = links.slice(0, 5);
    const overflow = links.slice(5);
    for (const item of primary) {
      const li = MRM.util.create("li");
      li.append(navigationAnchor(item));
      menu.append(li);
    }
    if (overflow.length) {
      const li = MRM.util.create("li", { className: "mrm-site-more-item" });
      const details = MRM.util.create("details", { className: "mrm-site-more" });
      const summary = MRM.util.create("summary", { text: "More" });
      const popup = MRM.util.create("div", { className: "mrm-site-more-menu" });
      for (const item of overflow) popup.append(navigationAnchor(item));
      details.append(summary, popup);
      details.addEventListener("toggle", () => {
        if (details.open) requestAnimationFrame(() => popup.querySelector("a")?.focus({ preventScroll: true }));
      });
      document.addEventListener("pointerdown", (event) => {
        if (details.open && !details.contains(event.target)) details.open = false;
      }, true);
      li.append(details);
      menu.append(li);
    }
    nav.append(menu);

    const archiveOwnsSearch = MRM.runtime.page === "archive" || MRM.runtime.page === "search";
    if (archiveOwnsSearch) toolbar.classList.add("mrm-site-toolbar-no-search");
    inner.append(brand, nav);
    if (!archiveOwnsSearch) {
      const sourceSearch = MRM.util.q("form.search-form", nativeHeader || document);
      const search = MRM.util.create("form", { className: "mrm-site-search", attrs: { role: "search", action: sourceSearch?.action || homeHref, method: "get" } });
      const query = MRM.util.create("input", { attrs: { type: "search", name: "s", value: sourceSearch?.querySelector("input[name='s']")?.value || "", placeholder: "Search MyReadingManga", autocomplete: "off", "aria-label": "Search MyReadingManga" } });
      const submit = MRM.util.create("button", { text: "Search", attrs: { type: "submit" } });
      search.append(query, submit);
      inner.append(search);
    }
    toolbar.append(skip, inner);
    (nativeNav || nativeHeader).before(toolbar);
    installToolbarMotion(toolbar);
  };

  const uniqueClones = (nodes, limit = Infinity) => {
    const seen = new Set();
    const out = [];
    for (const node of nodes) {
      const anchor = node.matches?.("a[href]") ? node : node.querySelector?.("a[href]");
      const key = normalizeHref(anchor?.href || "") || MRM.util.normalize(node.textContent);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const clone = node.cloneNode(true);
      clone.querySelectorAll?.("script, iframe, form").forEach((child) => child.remove());
      clone.querySelectorAll?.("[id]").forEach((child) => child.removeAttribute("id"));
      if (clone.id) clone.removeAttribute("id");
      out.push(clone);
      if (out.length >= limit) break;
    }
    return out;
  };

  const appendOverflow = (host, nodes, visibleCount, label) => {
    nodes.slice(0, visibleCount).forEach((node) => host.append(node));
    if (nodes.length <= visibleCount) return;
    const details = MRM.util.create("details", { className: "mrm-compact-footer-overflow" });
    const summary = MRM.util.create("summary", { text: `${label} (${nodes.length - visibleCount})` });
    const content = MRM.util.create("div", { className: "mrm-compact-footer-overflow-content" });
    nodes.slice(visibleCount).forEach((node) => content.append(node));
    details.append(summary, content);
    host.append(details);
  };

  const footerSection = (title, kind) => {
    const details = MRM.util.create("details", { className: `mrm-compact-footer-section mrm-footer-${kind}` });
    if (!matchMedia("(max-width: 760px)").matches) details.open = true;
    const summary = MRM.util.create("summary");
    summary.innerHTML = `<span>${MRM.util.escapeHtml(title)}</span><span class="mrm-footer-chevron" aria-hidden="true">⌄</span>`;
    const body = MRM.util.create("div", { className: "mrm-compact-footer-body" });
    details.append(summary, body);
    return { details, body };
  };

  const enhanceFooter = () => {
    if (MRM.util.q("#mrm-compact-footer")) return;
    const nativeFooter = MRM.util.q(".site-footer");
    const beforeFooter = MRM.util.q(".before-footer");
    const widgetFooter = MRM.util.q(".footer-widgets");
    if (!nativeFooter && !beforeFooter && !widgetFooter) return;

    const shell = MRM.util.create("footer", { className: "mrm-compact-footer", attrs: { id: "mrm-compact-footer", "aria-label": "MyReadingManga footer" } });
    const grid = MRM.util.create("div", { className: "mrm-compact-footer-grid" });

    const comments = uniqueClones(MRM.util.qa("#recentcomments > li", beforeFooter || document), 12);
    if (comments.length) {
      const section = footerSection("Recent comments", "comments");
      const list = MRM.util.create("ul", { className: "mrm-compact-comments" });
      appendOverflow(list, comments, 4, "More comments");
      section.body.append(list);
      grid.append(section.details);
    }

    const browseLinks = uniqueClones(MRM.util.qa(".footer-widgets .tagcloud > a", widgetFooter || document), 80);
    if (browseLinks.length) {
      const section = footerSection("Browse", "browse");
      const links = MRM.util.create("div", { className: "mrm-compact-link-cloud" });
      appendOverflow(links, browseLinks, 14, "Browse all");
      section.body.append(links);
      grid.append(section.details);
    }

    const siteLinkSources = [
      ...MRM.util.qa(".nav-primary a[href]"),
      ...MRM.util.qa(".site-footer .nav-secondary a[href], .site-footer a[href]", nativeFooter || document),
    ];
    const siteLinks = uniqueClones(siteLinkSources, 20).filter((node) => MRM.util.normalize(node.textContent) !== "mrm");
    if (siteLinks.length) {
      const section = footerSection("Site links", "links");
      const links = MRM.util.create("nav", { className: "mrm-compact-site-links", attrs: { "aria-label": "Footer links" } });
      siteLinks.forEach((node) => links.append(node));
      section.body.append(links);
      grid.append(section.details);
    }

    shell.append(grid);
    const copyrightSource = MRM.util.q(".copyright, .site-footer p", nativeFooter || document);
    if (copyrightSource) {
      const copyright = MRM.util.create("div", { className: "mrm-compact-copyright" });
      const clone = copyrightSource.cloneNode(true);
      clone.querySelectorAll?.("script, iframe, form").forEach((node) => node.remove());
      copyright.append(clone);
      shell.append(copyright);
    }
    (nativeFooter || widgetFooter || beforeFooter).before(shell);
    document.documentElement.classList.add("mrm-compact-footer-ready");
  };

  const initPost = () => {
    document.body.classList.add("mrm-post-page");
    MRM.settings.installRecoveryButton();
    MRM.reader.installPostButtons();
    removeNoise();
  };
  const initArchive = () => {
    MRM.facets.syncFromUrl();
    MRM.settings.init();
    MRM.archive.init();
    removeNoise();
  };
  const start = () => {
    if (!MRM.config.hostnames.includes(location.hostname)) return;
    MRM.theme.install();
    MRM.runtime.page = MRM.site.detectPage();
    document.documentElement.dataset.mrmPage = MRM.runtime.page;
    enhanceSiteChrome();
    enhanceFooter();
    if (MRM.runtime.page === "post") initPost();
    else if (MRM.runtime.page === "archive" || MRM.runtime.page === "search") initArchive();
    else MRM.settings.init();
  };
  return { start };
})();

MRM.app.start();
