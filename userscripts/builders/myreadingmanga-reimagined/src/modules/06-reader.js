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
    focusMode: false,
    returnTarget: null,
    returnScrollY: 0,
    pointerStart: null,
  };
  const readerPrefs = () => MRM.storage.readerPreferences();
  const constrainedConnection = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return Boolean(connection?.saveData || /(?:^|-)2g$/i.test(connection?.effectiveType || "") || /slow-2g/i.test(connection?.effectiveType || ""));
  };
  const pagedPrefetchRadius = () => constrainedConnection() ? 1 : 2;
  const hydratePagedWindow = () => {
    if (!state.modal || readerPrefs().view !== "paged") return;
    const radius = pagedPrefetchRadius();
    state.modal.querySelectorAll(".mrm-reader-page img[data-mrm-src]").forEach((img) => {
      const index = Number(img.closest(".mrm-reader-page")?.dataset.index || 0);
      if (Math.abs(index - state.pageIndex) <= radius && !img.getAttribute("src")) img.src = img.dataset.mrmSrc;
    });
  };
  const renderShell = () => {
    if (state.modal) return state.modal;
    const modal = MRM.util.create("section", { className: "mrm-reader-modal", attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-reader-title", hidden: true } });
    modal.innerHTML = `
      <div class="mrm-reader-toolbar">
        <div class="mrm-reader-toolbar-primary">
          <button type="button" data-reader-action="close" aria-label="Close reader">×</button>
          <button type="button" data-reader-action="back-archive" class="mrm-reader-back-archive" hidden>Back to archive</button>
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
          <button type="button" data-reader-action="save" aria-pressed="false" title="Save for later (S)">☆ Save</button>
          <button type="button" data-reader-action="focus" title="Distraction-free reading (D)">Focus</button>
          <button type="button" data-reader-action="open-tab">Open post</button>
          <button type="button" data-reader-action="fullscreen" title="Fullscreen (F)">Fullscreen</button>
        </div>
      </div>
      <div class="mrm-reader-progress">
        <progress id="mrm-reader-progress-meter" max="100" value="0" aria-label="Reading progress"></progress>
        <div class="mrm-reader-progress-controls">
          <span id="mrm-reader-progress-label">Page 0 of 0 · 0%</span>
          <input id="mrm-reader-scrubber" type="range" min="1" max="1" value="1" aria-label="Reader page">
        </div>
      </div>
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
      <button type="button" class="mrm-reader-focus-exit" data-reader-action="focus" hidden>Exit focus</button>
      <nav class="mrm-reader-mobile-controls" aria-label="Mobile reader navigation">
        <button type="button" data-reader-action="previous-page">Previous</button>
        <span id="mrm-reader-mobile-page-count" aria-live="polite">0 / 0</span>
        <button type="button" data-reader-action="next-page">Next</button>
      </nav>
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
    const stage = modal.querySelector(".mrm-reader-stage");
    stage.addEventListener("scroll", MRM.util.throttle(onScroll, 80));
    stage.addEventListener("pointerdown", onPointerDown, { passive: true });
    stage.addEventListener("pointerup", onPointerUp, { passive: true });
    stage.addEventListener("dblclick", onDoubleClick);
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
    const requestedUrl = MRM.util.canonicalUrl(url);
    state.returnTarget = options.trigger?.closest?.(".mrm-card") || MRM.runtime.cards.find((item) => item.url === requestedUrl)?.article || null;
    state.returnScrollY = window.scrollY;
    state.focusMode = false;
    state.modal.classList.remove("is-focus-mode", "is-image-zoomed");
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
      const savedProgress = MRM.storage.getReaderProgress(state.url);
      state.pageIndex = savedProgress && !savedProgress.completed ? MRM.util.clamp(savedProgress.pageIndex, 0, state.pages.length - 1) : 0;
      state.commentsVisible = false;
      render();
      const resumed = Boolean(savedProgress && !savedProgress.completed && savedProgress.pageIndex > 0);
      if (resumed) MRM.util.announce(`Resuming ${state.title} at page ${state.pageIndex + 1} of ${state.pages.length}`);
      requestAnimationFrame(() => goTo(state.pageIndex, false));
      prefetchAdjacent();
    } catch (error) {
      const stage = state.modal.querySelector(".mrm-reader-stage");
      stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status mrm-reader-error", text: error.message || "Reader could not open this post.", attrs: { role: "alert" } }));
    }
  };
  const sequenceInfo = (delta) => {
    const index = state.sequence.indexOf(state.url);
    if (index >= 0) {
      const url = state.sequence[index + delta] || "";
      const card = MRM.runtime.cards.find((item) => item.url === url);
      return { url, title: card?.title || "" };
    }
    const selectors = delta < 0
      ? "a[rel~='prev'], .previous a, .pagination-previous a, .adjacent-entry-pagination .previous a"
      : "a[rel~='next'], .next a, .pagination-next a, .adjacent-entry-pagination .next a";
    const anchor = MRM.util.q(selectors, state.document);
    return { url: anchor?.href || "", title: MRM.util.text(anchor?.textContent || anchor?.title) };
  };
  const updateNavigation = () => {
    const atFirst = state.pageIndex <= 0;
    const atLast = state.pageIndex >= Math.max(0, state.pages.length - 1);
    for (const action of ["first-page", "previous-page"]) for (const button of actionButtons(action)) button.disabled = atFirst;
    for (const action of ["next-page", "last-page"]) for (const button of actionButtons(action)) button.disabled = atLast;
    const previousInfo = sequenceInfo(-1);
    const nextInfo = sequenceInfo(1);
    const previousPost = actionButton("previous-post");
    const nextPost = actionButton("next-post");
    if (previousPost) {
      previousPost.disabled = !previousInfo.url;
      previousPost.textContent = previousInfo.url ? `‹ ${previousInfo.title || "Previous post"}` : "‹ Previous";
      previousPost.title = previousInfo.title || "Previous post";
    }
    if (nextPost) {
      nextPost.disabled = !nextInfo.url;
      nextPost.textContent = nextInfo.url ? `${nextInfo.title || "Next post"} ›` : "Next ›";
      nextPost.title = nextInfo.title || "Next post";
    }
    const backArchive = actionButton("back-archive");
    if (backArchive) backArchive.hidden = !state.returnTarget?.isConnected;
  };
  const render = () => {
    const prefs = readerPrefs();
    state.modal.dataset.view = prefs.view;
    state.modal.dataset.width = prefs.width;
    state.modal.dataset.fit = prefs.fit;
    state.modal.dataset.direction = prefs.direction;
    state.modal.dataset.thumbnails = prefs.thumbnails ? "on" : "off";
    state.modal.querySelector("#mrm-reader-title").textContent = state.title;
    actionButton("focus").textContent = state.focusMode ? "Exit focus" : "Focus";
    const focusExit = state.modal.querySelector(".mrm-reader-focus-exit");
    if (focusExit) focusExit.hidden = !state.focusMode;
    actionButton("cycle-view").textContent = prefs.view === "strip" ? "Strip" : prefs.view === "strip-gaps" ? "Strip + gaps" : "Paged";
    actionButton("width").textContent = prefs.width === "comfort" ? "Comfort" : "Wide";
    actionButton("fit").textContent = prefs.fit === "width" ? "Fit width" : "Fit height";
    actionButton("direction").textContent = prefs.direction.toUpperCase();
    const comments = MRM.site.commentsCount(state.document);
    actionButton("comments").textContent = comments == null ? "Comments" : `Comments (${comments})`;
    const saved = MRM.storage.isSaved(state.url);
    const saveButton = actionButton("save");
    if (saveButton) { saveButton.textContent = saved ? "★ Saved" : "☆ Save"; saveButton.setAttribute("aria-pressed", String(saved)); }
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
      const prefs = readerPrefs();
      const paged = prefs.view === "paged";
      const attrs = { alt: page.alt, loading: paged ? "eager" : (index < 2 ? "eager" : "lazy"), decoding: "async", "data-mrm-src": page.src };
      if (!paged || Math.abs(index - state.pageIndex) <= pagedPrefetchRadius()) attrs.src = page.src;
      const img = MRM.util.create("img", { attrs });
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
    if (readerPrefs().view === "paged") goTo(state.pageIndex, false);
    else observePages();
  };
  const renderThumbnails = () => {
    const host = state.modal.querySelector(".mrm-reader-thumbnails");
    host.replaceChildren();
    state.pages.forEach((page, index) => {
      const button = MRM.util.create("button", { className: "mrm-reader-thumbnail", attrs: { type: "button", "aria-label": `Go to page ${index + 1}` }, dataset: { index } });
      if (!constrainedConnection()) button.append(MRM.util.create("img", { attrs: { src: page.src, alt: "", loading: "lazy", decoding: "async" } }));
      button.append(MRM.util.create("span", { text: String(index + 1) }));
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
    const pageText = `${state.pageIndex + 1} / ${state.pages.length}`;
    state.modal.querySelector("#mrm-reader-page-count").textContent = pageText;
    const mobilePageCount = state.modal.querySelector("#mrm-reader-mobile-page-count");
    if (mobilePageCount) mobilePageCount.textContent = pageText;
    const percent = state.pages.length ? Math.round(((state.pageIndex + 1) / state.pages.length) * 100) : 0;
    const progressMeter = state.modal.querySelector("#mrm-reader-progress-meter");
    if (progressMeter) progressMeter.value = percent;
    const progressLabel = state.modal.querySelector("#mrm-reader-progress-label");
    if (progressLabel) progressLabel.textContent = `Page ${state.pageIndex + 1} of ${state.pages.length} · ${percent}%`;
    const scrubber = state.modal.querySelector("#mrm-reader-scrubber");
    scrubber.max = String(Math.max(1, state.pages.length));
    scrubber.value = String(state.pageIndex + 1);
    state.modal.querySelectorAll(".mrm-reader-thumbnail").forEach((button, i) => button.classList.toggle("is-active", i === state.pageIndex));
    if (state.url && state.pages.length) MRM.storage.setReaderProgress(state.url, state.title, state.pageIndex, state.pages.length);
    updateNavigation();
  };
  const goTo = (index, smooth = true) => {
    setPageIndex(index);
    hydratePagedWindow();
    const target = state.modal.querySelector(`.mrm-reader-page[data-index='${state.pageIndex}']`);
    if (!target) return;
    if (readerPrefs().view === "paged") {
      state.modal.querySelectorAll(".mrm-reader-page").forEach((page, i) => page.hidden = i !== state.pageIndex);
      target.hidden = false;
      state.modal.querySelector(".mrm-reader-stage").scrollTop = 0;
    } else target.scrollIntoView({ block: "start", behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
  };
  const movePage = (delta) => goTo(state.pageIndex + delta);
  const sequenceTarget = (delta) => sequenceInfo(delta).url;
  const movePost = (delta) => {
    const target = sequenceTarget(delta);
    if (target) open(target, { sequence: state.sequence, trigger: state.modal.querySelector(`[data-reader-action='${delta < 0 ? "previous-post" : "next-post"}']`) });
    else MRM.util.announce("No adjacent post available");
  };
  const prefetchAdjacent = () => MRM.util.idle(() => {
    if (constrainedConnection()) return;
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
  const togglePreference = (patch) => MRM.storage.updateReaderPreferences(patch);
  const cycleView = () => {
    const modes = ["strip", "strip-gaps", "paged"];
    const current = readerPrefs().view;
    togglePreference({ view: modes[(modes.indexOf(current) + 1) % modes.length] });
    render();
  };
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else state.modal.requestFullscreen?.();
  };
  const toggleFocus = () => {
    if (state.commentsVisible) showComments();
    state.focusMode = !state.focusMode;
    state.modal.classList.toggle("is-focus-mode", state.focusMode);
    state.modal.classList.remove("is-image-zoomed");
    actionButton("focus").textContent = state.focusMode ? "Exit focus" : "Focus";
    const focusExit = state.modal.querySelector(".mrm-reader-focus-exit");
    if (focusExit) focusExit.hidden = !state.focusMode;
    state.modal.querySelector(".mrm-reader-stage")?.focus({ preventScroll: true });
  };
  const backToArchive = () => {
    const target = state.returnTarget;
    const fallbackY = state.returnScrollY;
    close();
    requestAnimationFrame(() => {
      if (target?.isConnected) {
        target.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        target.querySelector(".mrm-reader-trigger, a, button")?.focus({ preventScroll: true });
      } else window.scrollTo({ top: fallbackY, behavior: "auto" });
    });
  };
  const onPointerDown = (event) => {
    if (!/touch|pen/.test(event.pointerType || "")) return;
    state.pointerStart = { x: event.clientX, y: event.clientY, at: performance.now() };
  };
  const onPointerUp = (event) => {
    const start = state.pointerStart;
    state.pointerStart = null;
    if (!start || readerPrefs().view !== "paged" || state.modal.classList.contains("is-image-zoomed")) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.25 || performance.now() - start.at > 900) return;
    const logicalNext = dx < 0;
    const direction = readerPrefs().direction;
    movePage(logicalNext ? (direction === "rtl" ? -1 : 1) : (direction === "rtl" ? 1 : -1));
  };
  const onDoubleClick = (event) => {
    if (!event.target.matches(".mrm-reader-page img") || !matchMedia("(max-width: 760px)").matches) return;
    const enabled = !state.modal.classList.contains("is-image-zoomed");
    state.modal.classList.toggle("is-image-zoomed", enabled);
    if (enabled) {
      const rect = event.target.getBoundingClientRect();
      const x = MRM.util.clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100, 0, 100);
      const y = MRM.util.clamp(((event.clientY - rect.top) / Math.max(1, rect.height)) * 100, 0, 100);
      event.target.style.setProperty("--mrm-zoom-origin", `${x}% ${y}%`);
    } else event.target.style.removeProperty("--mrm-zoom-origin");
  };
  const close = () => {
    state.abort?.abort();
    MRM.runtime.readerObserver?.disconnect();
    state.modal.hidden = true;
    state.modal.classList.remove("is-focus-mode", "is-image-zoomed");
    state.focusMode = false;
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
      "back-archive": backToArchive,
      "previous-post": () => movePost(-1),
      "next-post": () => movePost(1),
      "previous-page": () => movePage(readerPrefs().direction === "rtl" ? 1 : -1),
      "next-page": () => movePage(readerPrefs().direction === "rtl" ? -1 : 1),
      "first-page": () => goTo(0),
      "last-page": () => goTo(state.pages.length - 1),
      "cycle-view": cycleView,
      width: () => { togglePreference({ width: readerPrefs().width === "comfort" ? "wide" : "comfort" }); render(); },
      fit: () => { togglePreference({ fit: readerPrefs().fit === "width" ? "height" : "width" }); render(); },
      direction: () => { togglePreference({ direction: readerPrefs().direction === "ltr" ? "rtl" : "ltr" }); render(); },
      thumbnails: () => { togglePreference({ thumbnails: !readerPrefs().thumbnails }); render(); },
      comments: showComments,
      save: () => { MRM.storage.toggleSaved(state.url, state.title, state.pages[state.pageIndex]?.src || state.pages[0]?.src || ""); render(); },
      focus: toggleFocus,
      "open-tab": () => window.open(state.url, "_blank", "noopener"),
      fullscreen,
      toolbar: () => state.modal.classList.toggle("is-toolbar-hidden"),
    };
    map[action]?.();
  };
  const onScroll = () => {
    if (!readerPrefs().autoHideToolbar || readerPrefs().view === "paged") return;
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
      d: toggleFocus,
      s: () => actionButton("save")?.click(),
      r: () => actionButton("direction").click(),
      t: () => actionButton("thumbnails").click(),
      home: () => goTo(0),
      end: () => goTo(state.pages.length - 1),
      arrowleft: () => movePage(readerPrefs().direction === "rtl" ? 1 : -1),
      pageup: () => movePage(-1),
      arrowright: () => movePage(readerPrefs().direction === "rtl" ? -1 : 1),
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
    const save = MRM.util.create("button", { className: "mrm-post-save", attrs: { type: "button", "aria-pressed": String(MRM.storage.isSaved(location.href)) } });
    const syncSave = () => {
      const saved = MRM.storage.isSaved(location.href);
      save.textContent = saved ? "★ Saved" : "☆ Save for later";
      save.setAttribute("aria-pressed", String(saved));
    };
    syncSave();
    reader.addEventListener("click", () => open(location.href, { trigger: reader }));
    comments.addEventListener("click", () => MRM.util.q(MRM.selectors.comments)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    save.addEventListener("click", () => MRM.storage.toggleSaved(location.href, title.textContent, MRM.util.imageSource(MRM.util.q(MRM.selectors.mangaImages))));
    const onSaved = (event) => { if (!event.detail?.url || event.detail.url === MRM.util.canonicalUrl(location.href)) syncSave(); };
    MRM.events.addEventListener("saved-posts", onSaved);
    actions.append(reader, save, comments);
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
  MRM.events.addEventListener("saved-posts", () => { if (state.modal && !state.modal.hidden && state.pages.length) render(); });
  const deviceQuery = matchMedia("(max-width: 760px)");
  deviceQuery.addEventListener?.("change", () => { if (state.modal && !state.modal.hidden && state.pages.length) render(); });
  return { open, close, installPostButtons, goTo };
})();
