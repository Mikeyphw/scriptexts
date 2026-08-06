MRM.reader = (() => {
  const state = {
    modal: null,
    document: null,
    url: "",
    title: "",
    pages: [],
    pageIndex: 0,
    sequence: [],
    abort: null,
    commentsVisible: false,
    toolbarHidden: false,
  };
  const renderShell = () => {
    if (state.modal) return state.modal;
    const modal = MRM.util.create("section", { className: "mrm-reader-modal", attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-reader-title", hidden: true } });
    modal.innerHTML = `
      <div class="mrm-reader-toolbar">
        <div class="mrm-reader-toolbar-primary">
          <button type="button" data-reader-action="close" aria-label="Close reader">×</button>
          <button type="button" data-reader-action="previous-post" aria-label="Previous post">‹ Post</button>
          <h2 id="mrm-reader-title">Reader</h2>
          <span id="mrm-reader-page-count" aria-live="polite">0 / 0</span>
          <button type="button" data-reader-action="next-post" aria-label="Next post">Post ›</button>
        </div>
        <div class="mrm-reader-toolbar-secondary">
          <button type="button" data-reader-action="cycle-view" title="Cycle view (C)">Strip</button>
          <button type="button" data-reader-action="width" title="Toggle width (W)">Comfort</button>
          <button type="button" data-reader-action="fit" title="Toggle fit (M)">Fit width</button>
          <button type="button" data-reader-action="direction" title="Toggle direction (R)">LTR</button>
          <button type="button" data-reader-action="thumbnails" title="Toggle thumbnails (T)">Thumbs</button>
          <button type="button" data-reader-action="comments">Comments</button>
          <button type="button" data-reader-action="open-tab">Open post</button>
          <button type="button" data-reader-action="fullscreen" title="Fullscreen (F)">Fullscreen</button>
        </div>
      </div>
      <div class="mrm-reader-progress"><input id="mrm-reader-scrubber" type="range" min="1" max="1" value="1" aria-label="Reader page"></div>
      <div class="mrm-reader-body">
        <aside class="mrm-reader-thumbnails" aria-label="Page thumbnails"></aside>
        <main class="mrm-reader-stage" tabindex="0"></main>
        <section class="mrm-reader-comments" hidden></section>
      </div>
      <div class="mrm-reader-mobile-zones" aria-hidden="true">
        <button type="button" data-reader-action="previous-page" tabindex="-1"></button>
        <button type="button" data-reader-action="toolbar" tabindex="-1"></button>
        <button type="button" data-reader-action="next-page" tabindex="-1"></button>
      </div>
      <nav class="mrm-reader-footer" aria-label="Reader navigation">
        <button type="button" data-reader-action="first-page">First</button>
        <button type="button" data-reader-action="previous-page">Previous</button>
        <button type="button" data-reader-action="next-page">Next</button>
        <button type="button" data-reader-action="last-page">Last</button>
      </nav>`;
    document.body.append(modal);
    modal.addEventListener("click", onClick);
    modal.addEventListener("keydown", (event) => MRM.util.trapFocus(event, modal));
    modal.querySelector("#mrm-reader-scrubber").addEventListener("input", (event) => goTo(Number(event.target.value) - 1));
    modal.querySelector(".mrm-reader-stage").addEventListener("scroll", MRM.util.throttle(onScroll, 80));
    state.modal = modal;
    MRM.runtime.reader = state;
    return modal;
  };
  const actionButton = (action) => state.modal?.querySelector(`[data-reader-action='${action}']`);
  const actionButtons = (action) => state.modal ? Array.from(state.modal.querySelectorAll(`[data-reader-action='${action}']`)) : [];
  const setLoading = (loading, message = "Loading reader…") => {
    const stage = state.modal.querySelector(".mrm-reader-stage");
    stage.toggleAttribute("aria-busy", loading);
    if (loading) stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status", text: message, attrs: { role: "status" } }));
  };
  const collectPost = async (url) => {
    if (MRM.util.canonicalUrl(url) === MRM.util.canonicalUrl(location.href) && MRM.runtime.page === "post") return document;
    state.abort?.abort();
    state.abort = new AbortController();
    return MRM.util.safeFetchDocument(url, state.abort.signal);
  };
  const waitForPages = async (doc) => {
    const attempts = doc === document ? 12 : 3;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const pages = MRM.site.extractImages(doc);
      if (pages.length) return pages;
      await new Promise((resolve) => window.setTimeout(resolve, 125));
    }
    return [];
  };
  const open = async (url, options = {}) => {
    renderShell();
    MRM.runtime.lastFocused = options.trigger || document.activeElement;
    state.sequence = options.sequence || state.sequence;
    state.modal.hidden = false;
    document.documentElement.classList.add("mrm-reader-open");
    setLoading(true);
    actionButton("close").focus();
    try {
      const normalizedUrl = MRM.util.canonicalUrl(url);
      let doc = null;
      let pages = [];
      let loadError = null;
      try {
        doc = await collectPost(url);
        pages = await waitForPages(doc);
      } catch (error) { loadError = error; }
      const cached = !pages.length ? MRM.storage.getReaderCache(normalizedUrl) : null;
      if (!pages.length && cached) {
        doc = document.implementation.createHTMLDocument(cached.title || "Cached reader");
        pages = cached.pages;
      }
      if (!pages.length) throw loadError || new Error("No manga pages were detected on this post.");
      state.document = doc;
      state.url = normalizedUrl;
      state.title = MRM.util.pageTitle(doc) || cached?.title || "Reader";
      state.pages = pages;
      MRM.storage.setReaderCache(state.url, state.title, state.pages);
      state.pageIndex = 0;
      state.commentsVisible = false;
      MRM.storage.markRead(state.url, state.title);
      render();
      prefetchAdjacent();
    } catch (error) {
      const stage = state.modal.querySelector(".mrm-reader-stage");
      stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status mrm-reader-error", text: error.message || "Reader could not open this post.", attrs: { role: "alert" } }));
    }
  };
  const updateNavigation = () => {
    const atFirst = state.pageIndex <= 0;
    const atLast = state.pageIndex >= Math.max(0, state.pages.length - 1);
    for (const action of ["first-page", "previous-page"]) for (const button of actionButtons(action)) button.disabled = atFirst;
    for (const action of ["next-page", "last-page"]) for (const button of actionButtons(action)) button.disabled = atLast;
    const previousPost = actionButton("previous-post");
    const nextPost = actionButton("next-post");
    if (previousPost) previousPost.disabled = !sequenceTarget(-1);
    if (nextPost) nextPost.disabled = !sequenceTarget(1);
  };
  const render = () => {
    const prefs = MRM.storage.preferences.reader;
    state.modal.dataset.view = prefs.view;
    state.modal.dataset.width = prefs.width;
    state.modal.dataset.fit = prefs.fit;
    state.modal.dataset.direction = prefs.direction;
    state.modal.dataset.thumbnails = prefs.thumbnails ? "on" : "off";
    state.modal.querySelector("#mrm-reader-title").textContent = state.title;
    actionButton("cycle-view").textContent = prefs.view === "strip" ? "Strip" : prefs.view === "strip-gaps" ? "Strip + gaps" : "Paged";
    actionButton("width").textContent = prefs.width === "comfort" ? "Comfort" : "Wide";
    actionButton("fit").textContent = prefs.fit === "width" ? "Fit width" : "Fit height";
    actionButton("direction").textContent = prefs.direction.toUpperCase();
    const comments = MRM.site.commentsCount(state.document);
    actionButton("comments").textContent = comments == null ? "Comments" : `Comments (${comments})`;
    renderPages();
    renderThumbnails();
    setPageIndex(state.pageIndex);
    updateNavigation();
  };
  const renderPages = () => {
    const stage = state.modal.querySelector(".mrm-reader-stage");
    stage.replaceChildren();
    state.pages.forEach((page, index) => {
      const figure = MRM.util.create("figure", { className: "mrm-reader-page", dataset: { index } });
      const img = MRM.util.create("img", { attrs: { src: page.src, alt: page.alt, loading: index < 2 ? "eager" : "lazy", decoding: "async" } });
      const captionText = () => `${index + 1} / ${state.pages.length}${page.width && page.height ? ` · ${page.width}×${page.height}` : ""}`;
      const caption = MRM.util.create("figcaption", { text: captionText() });
      img.addEventListener("load", () => {
        if ((!page.width || !page.height) && img.naturalWidth && img.naturalHeight) {
          page.width = img.naturalWidth;
          page.height = img.naturalHeight;
          caption.textContent = captionText();
          MRM.storage.setReaderCache(state.url, state.title, state.pages);
        }
      }, { once: true });
      figure.append(img, caption);
      stage.append(figure);
    });
    if (MRM.storage.preferences.reader.view === "paged") goTo(state.pageIndex, false);
    else observePages();
  };
  const renderThumbnails = () => {
    const host = state.modal.querySelector(".mrm-reader-thumbnails");
    host.replaceChildren();
    state.pages.forEach((page, index) => {
      const button = MRM.util.create("button", { className: "mrm-reader-thumbnail", attrs: { type: "button", "aria-label": `Go to page ${index + 1}` }, dataset: { index } });
      button.append(MRM.util.create("img", { attrs: { src: page.src, alt: "", loading: "lazy" } }), MRM.util.create("span", { text: String(index + 1) }));
      button.addEventListener("click", () => goTo(index));
      host.append(button);
    });
  };
  const observePages = () => {
    state.readerObserver?.disconnect?.();
    MRM.runtime.readerObserver?.disconnect();
    MRM.runtime.readerObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setPageIndex(Number(visible.target.dataset.index));
    }, { root: state.modal.querySelector(".mrm-reader-stage"), threshold: [0.2, 0.5, 0.8] });
    state.modal.querySelectorAll(".mrm-reader-page").forEach((page) => MRM.runtime.readerObserver.observe(page));
  };
  const setPageIndex = (index) => {
    state.pageIndex = MRM.util.clamp(index, 0, Math.max(0, state.pages.length - 1));
    state.modal.querySelector("#mrm-reader-page-count").textContent = `${state.pageIndex + 1} / ${state.pages.length}`;
    const scrubber = state.modal.querySelector("#mrm-reader-scrubber");
    scrubber.max = String(Math.max(1, state.pages.length));
    scrubber.value = String(state.pageIndex + 1);
    state.modal.querySelectorAll(".mrm-reader-thumbnail").forEach((button, i) => button.classList.toggle("is-active", i === state.pageIndex));
    updateNavigation();
  };
  const goTo = (index, smooth = true) => {
    setPageIndex(index);
    const target = state.modal.querySelector(`.mrm-reader-page[data-index='${state.pageIndex}']`);
    if (!target) return;
    if (MRM.storage.preferences.reader.view === "paged") {
      state.modal.querySelectorAll(".mrm-reader-page").forEach((page, i) => page.hidden = i !== state.pageIndex);
      target.hidden = false;
      state.modal.querySelector(".mrm-reader-stage").scrollTop = 0;
    } else target.scrollIntoView({ block: "start", behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
  };
  const movePage = (delta) => goTo(state.pageIndex + delta);
  const sequenceTarget = (delta) => {
    const index = state.sequence.indexOf(state.url);
    if (index >= 0) return state.sequence[index + delta] || "";
    const adjacent = MRM.site.adjacentLinks(state.document);
    return delta < 0 ? adjacent.prev : adjacent.next;
  };
  const movePost = (delta) => {
    const target = sequenceTarget(delta);
    if (target) open(target, { sequence: state.sequence, trigger: state.modal.querySelector(`[data-reader-action='${delta < 0 ? "previous-post" : "next-post"}']`) });
    else MRM.util.announce("No adjacent post available");
  };
  const prefetchAdjacent = () => MRM.util.idle(() => {
    for (const target of [sequenceTarget(-1), sequenceTarget(1)]) if (target) fetch(target, { credentials: "include", priority: "low" }).catch(() => {});
  });
  const showComments = () => {
    const commentsHost = state.modal.querySelector(".mrm-reader-comments");
    const stage = state.modal.querySelector(".mrm-reader-stage");
    const source = MRM.util.q(MRM.selectors.comments, state.document);
    state.commentsVisible = !state.commentsVisible;
    commentsHost.hidden = !state.commentsVisible;
    stage.hidden = state.commentsVisible;
    state.modal.querySelector(".mrm-reader-thumbnails").hidden = state.commentsVisible;
    actionButton("comments").textContent = state.commentsVisible ? "Back to reader" : "Comments";
    if (state.commentsVisible) {
      commentsHost.replaceChildren();
      if (source) {
        const clone = source.cloneNode(true);
        clone.querySelectorAll("script, iframe, form").forEach((node) => node.remove());
        commentsHost.append(clone);
      } else commentsHost.append(MRM.util.create("p", { text: "Comments are not present in the fetched page." }));
      commentsHost.focus?.();
    }
  };
  const togglePreference = (patch) => MRM.storage.update({ reader: { ...MRM.storage.preferences.reader, ...patch } });
  const cycleView = () => {
    const modes = ["strip", "strip-gaps", "paged"];
    const current = MRM.storage.preferences.reader.view;
    togglePreference({ view: modes[(modes.indexOf(current) + 1) % modes.length] });
    render();
  };
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else state.modal.requestFullscreen?.();
  };
  const close = () => {
    state.abort?.abort();
    MRM.runtime.readerObserver?.disconnect();
    state.modal.hidden = true;
    document.documentElement.classList.remove("mrm-reader-open");
    MRM.runtime.lastFocused?.focus?.();
  };
  const onClick = (event) => {
    const button = event.target.closest("[data-reader-action]");
    if (!button) {
      if (event.target === state.modal) close();
      return;
    }
    const action = button.dataset.readerAction;
    const map = {
      close,
      "previous-post": () => movePost(-1),
      "next-post": () => movePost(1),
      "previous-page": () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? 1 : -1),
      "next-page": () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? -1 : 1),
      "first-page": () => goTo(0),
      "last-page": () => goTo(state.pages.length - 1),
      "cycle-view": cycleView,
      width: () => { togglePreference({ width: MRM.storage.preferences.reader.width === "comfort" ? "wide" : "comfort" }); render(); },
      fit: () => { togglePreference({ fit: MRM.storage.preferences.reader.fit === "width" ? "height" : "width" }); render(); },
      direction: () => { togglePreference({ direction: MRM.storage.preferences.reader.direction === "ltr" ? "rtl" : "ltr" }); render(); },
      thumbnails: () => { togglePreference({ thumbnails: !MRM.storage.preferences.reader.thumbnails }); render(); },
      comments: showComments,
      "open-tab": () => window.open(state.url, "_blank", "noopener"),
      fullscreen,
      toolbar: () => state.modal.classList.toggle("is-toolbar-hidden"),
    };
    map[action]?.();
  };
  const onScroll = () => {
    if (!MRM.storage.preferences.reader.autoHideToolbar || MRM.storage.preferences.reader.view === "paged") return;
    const stage = state.modal.querySelector(".mrm-reader-stage");
    state.modal.classList.toggle("is-toolbar-hidden", stage.scrollTop > 120 && stage.scrollTop > (state.lastScrollTop || 0));
    state.lastScrollTop = stage.scrollTop;
  };
  const onKeydown = (event) => {
    if (!state.modal || state.modal.hidden) return;
    const target = event.target;
    if (target.matches("input, textarea, select") && event.key !== "Escape") return;
    const key = event.key.toLocaleLowerCase();
    const handlers = {
      escape: close,
      f: fullscreen,
      w: () => actionButton("width").click(),
      m: () => actionButton("fit").click(),
      c: cycleView,
      r: () => actionButton("direction").click(),
      t: () => actionButton("thumbnails").click(),
      home: () => goTo(0),
      end: () => goTo(state.pages.length - 1),
      arrowleft: () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? 1 : -1),
      pageup: () => movePage(-1),
      arrowright: () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? -1 : 1),
      pagedown: () => movePage(1),
    };
    if (event.altKey && (key === "arrowleft" || key === "arrowright")) {
      event.preventDefault(); movePost(key === "arrowleft" ? -1 : 1); return;
    }
    if (handlers[key]) { event.preventDefault(); handlers[key](); }
  };
  const installPostButtons = () => {
    const article = MRM.util.q(MRM.selectors.postArticle);
    const title = MRM.util.q(".entry-title", article || document);
    if (!title || MRM.util.q("#mrm-post-actions")) return;
    const actions = MRM.util.create("div", { attrs: { id: "mrm-post-actions" }, className: "mrm-post-actions" });
    const reader = MRM.util.create("button", { className: "mrm-primary-action", text: "Open Reader", attrs: { type: "button" } });
    const count = MRM.site.commentsCount(document);
    const comments = MRM.util.create("button", { text: count == null ? "Comments" : `Comments (${count})`, attrs: { type: "button" } });
    reader.addEventListener("click", () => open(location.href, { trigger: reader }));
    comments.addEventListener("click", () => MRM.util.q(MRM.selectors.comments)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    actions.append(reader, comments);
    if (article) {
      const taxonomies = MRM.site.taxonomiesFromClasses(article);
      const chips = MRM.util.create("div", { className: "mrm-post-taxonomies", attrs: { "aria-label": "Post metadata" } });
      for (const type of ["lang", "category", "genre", "artist", "group", "pairing", "status", "tag"]) {
        for (const slug of (taxonomies[type] || []).slice(0, type === "tag" ? 12 : 5)) {
          chips.append(MRM.util.create("span", { className: "mrm-taxonomy-chip", text: MRM.util.slugLabel(slug), attrs: { title: MRM.site.facetPrefixes[type] } }));
        }
      }
      if (chips.childElementCount) actions.append(chips);
    }
    title.insertAdjacentElement("afterend", actions);
    MRM.storage.markRead(location.href, title.textContent);
  };
  document.addEventListener("keydown", onKeydown, true);
  MRM.events.addEventListener("preferences", () => { if (state.modal && !state.modal.hidden && state.pages.length) render(); });
  return { open, close, installPostButtons, goTo };
})();
