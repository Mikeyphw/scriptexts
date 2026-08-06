MRM.archive = (() => {
  const enhancedAttr = "data-mrm-enhanced";
  const pageTualCandidateAttr = "data-mrm-page-tual-candidate";
  const pageTualUiSelector = ".pagetual_pageBar, .autopagerize_page_info, #pagetual-sideController, [id^='pagetual_pageBar'], [id^='pagetual-sideController'], [name^='pagetual-iframe'], iframe[name^='pagetual-iframe']";
  const ignoredMutationSelector = ".mrm-control-panel, .mrm-facet-modal, .mrm-reader-modal, #mrm-site-toolbar, #mrm-archive-overview";
  const pendingRoots = new Set();
  const handledPageTualEvents = new WeakSet();
  let overview = null;
  let scanTimer = 0;

  const activeFilterCount = (filters = MRM.storage.preferences.filters) => {
    let count = Number(Boolean(filters.query)) + Number(Boolean(filters.hideRead)) + Number(Boolean(filters.onlyEnglish));
    for (const mode of ["include", "exclude"]) for (const values of Object.values(filters[mode] || {})) count += values.length;
    return count;
  };

  const updateResultUI = (visible, total) => {
    MRM.util.q("#mrm-result-count")?.replaceChildren(document.createTextNode(`${visible} of ${total} results`));
    MRM.util.q("#mrm-overview-count")?.replaceChildren(document.createTextNode(String(visible)));
    MRM.util.q("#mrm-overview-loaded")?.replaceChildren(document.createTextNode(`${total} loaded`));
    const inProgress = Object.values(MRM.storage.readerProgress).filter((progress) => !progress.completed).length;
    const progressLabel = MRM.util.q("#mrm-overview-progress-count");
    if (progressLabel) {
      progressLabel.textContent = inProgress ? `${inProgress} in progress` : "Nothing in progress";
      progressLabel.hidden = inProgress === 0;
    }
    const badge = MRM.util.q("#mrm-launcher-count");
    if (badge) {
      const active = activeFilterCount();
      badge.textContent = String(active);
      badge.hidden = active === 0;
    }
  };

  const archiveTitle = () => {
    const heading = MRM.util.text(MRM.util.q(".archive-title, .page-title, .search-title")?.textContent);
    if (heading) return heading;
    if (MRM.runtime.page === "search") {
      const query = new URL(location.href).searchParams.get("s");
      return query ? `Search results for “${query}”` : "Search results";
    }
    const breadcrumb = MRM.util.text(MRM.util.q(".breadcrumb_last")?.textContent);
    if (breadcrumb && MRM.util.normalize(breadcrumb) !== "mrm") return breadcrumb;
    return "Latest releases";
  };

  const syncOverviewControls = () => {
    if (!overview) return;
    const { filters, grid } = MRM.storage.preferences;
    const search = MRM.util.q("#mrm-overview-search", overview);
    const sort = MRM.util.q("#mrm-overview-sort", overview);
    if (search && document.activeElement !== search) search.value = filters.query;
    if (sort) sort.value = filters.sort;
    for (const button of MRM.util.qa("[data-overview-toggle]", overview)) {
      button.setAttribute("aria-pressed", String(Boolean(filters[button.dataset.overviewToggle])));
    }
    for (const button of MRM.util.qa("[data-overview-density]", overview)) {
      const active = grid.density === button.dataset.overviewDensity;
      button.setAttribute("aria-checked", String(active));
      button.classList.toggle("is-active", active);
    }
  };

  const ensureOverview = () => {
    if (overview?.isConnected) return overview;
    const content = MRM.util.q("main.content, .content");
    const archive = MRM.util.q(".content-archive, .archive-content", content || document);
    if (!content || !archive) return null;
    overview = MRM.util.create("section", { className: "mrm-archive-overview", attrs: { id: "mrm-archive-overview", "aria-labelledby": "mrm-overview-title" } });
    overview.innerHTML = `
      <div class="mrm-overview-heading">
        <div class="mrm-overview-copy">
          <span class="mrm-overview-eyebrow">MyReadingManga archive</span>
          <h1 id="mrm-overview-title"></h1>
        </div>
        <div class="mrm-overview-result-summary" aria-live="polite">
          <strong id="mrm-overview-count">0</strong>
          <span id="mrm-overview-loaded">Loading archive…</span>
          <span id="mrm-overview-progress-count" hidden></span>
        </div>
      </div>
      <label class="mrm-overview-search"><span class="mrm-sr-only">Filter this archive</span><span aria-hidden="true">⌕</span><input id="mrm-overview-search" type="search" autocomplete="off" placeholder="Search titles, artists, groups, tags…"></label>
      <div class="mrm-overview-command-row">
        <div class="mrm-overview-quick-filters" aria-label="Quick filters">
          <button type="button" data-overview-toggle="onlyEnglish" aria-pressed="false">English</button>
          <button type="button" data-overview-toggle="hideRead" aria-pressed="false">Hide read</button>
        </div>
        <label class="mrm-overview-sort"><span>Sort</span><select id="mrm-overview-sort"><option value="default">Newest first</option><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="english-first">English first</option></select></label>
        <div class="mrm-overview-density" role="radiogroup" aria-label="Archive density">
          <button type="button" role="radio" data-overview-density="comfortable" aria-checked="false" title="Comfortable: four columns">Large</button>
          <button type="button" role="radio" data-overview-density="balanced" aria-checked="false" title="Balanced: five columns">Balanced</button>
          <button type="button" role="radio" data-overview-density="compact" aria-checked="false" title="Compact: six columns">Compact</button>
        </div>
        <button class="mrm-overview-filter-button" type="button" data-overview-action="filters"><span aria-hidden="true">☷</span> All filters</button>
      </div>
      <div class="mrm-overview-filter-row">
        <div class="mrm-active-filters mrm-overview-active-filters" aria-label="Active filters"></div>
        <button class="mrm-overview-clear" type="button" data-overview-action="clear">Clear all</button>
      </div>`;
    MRM.util.q("#mrm-overview-title", overview).textContent = archiveTitle();
    archive.before(overview);
    const search = MRM.util.q("#mrm-overview-search", overview);
    search.addEventListener("input", MRM.util.debounce(() => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, query: search.value }), 120));
    MRM.util.q("#mrm-overview-sort", overview).addEventListener("change", (event) => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, sort: event.target.value }));
    overview.addEventListener("click", (event) => {
      const actionNode = event.target.closest("[data-overview-action]");
      if (actionNode?.dataset.overviewAction === "filters") MRM.settings.open("filters");
      if (actionNode?.dataset.overviewAction === "clear") clearFilters();
      const toggle = event.target.closest("[data-overview-toggle]")?.dataset.overviewToggle;
      if (toggle) MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, [toggle]: !MRM.storage.preferences.filters[toggle] });
      const density = event.target.closest("[data-overview-density]")?.dataset.overviewDensity;
      if (density) MRM.storage.update({ grid: { ...MRM.storage.preferences.grid, density } });
    });
    MRM.util.q("#mrm-panel-launcher")?.classList.add("mrm-launcher-suppressed");
    syncOverviewControls();
    return overview;
  };

  const findGridRoot = () => MRM.util.q(".mrm-card-grid");
  const archiveContainerFor = (article) => article?.closest?.(".content-archive, .archive-content, .entries") || MRM.util.q(".content-archive, .archive-content, .entries");
  const ensureGridRoot = (article) => {
    const existing = findGridRoot();
    if (existing) return existing;
    const container = archiveContainerFor(article);
    if (!container || !article) return null;
    const root = MRM.util.create("div", { className: "mrm-card-grid", attrs: { role: "list", "aria-label": "Manga archive results" } });
    let anchor = article;
    while (anchor.parentElement && anchor.parentElement !== container) anchor = anchor.parentElement;
    container.insertBefore(root, anchor.parentElement === container ? anchor : container.firstChild);
    return root;
  };

  const syncGridOrder = (orderedCards) => {
    const root = findGridRoot();
    if (!root) return false;
    const desired = orderedCards.map((card) => card.article).filter((article) => article.isConnected);
    const current = [...root.children].filter((node) => node.matches?.("article.post.entry"));
    if (desired.length === current.length && desired.every((node, index) => current[index] === node)) return false;
    const boundary = [...root.children].find((node) => !node.matches?.("article.post.entry")) || null;
    const fragment = document.createDocumentFragment();
    for (const article of desired) fragment.append(article);
    root.insertBefore(fragment, boundary);
    return true;
  };

  const orderedCardsFor = (filters) => {
    const ordered = [...MRM.runtime.cards];
    const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
    if (filters.sort === "title-asc") ordered.sort((a, b) => collator.compare(a.title, b.title));
    else if (filters.sort === "title-desc") ordered.sort((a, b) => collator.compare(b.title, a.title));
    else if (filters.sort === "english-first") ordered.sort((a, b) => Number(b.isEnglish) - Number(a.isEnglish) || a.order - b.order);
    else ordered.sort((a, b) => a.order - b.order);
    return ordered;
  };

  const creatorLine = (card) => {
    const artists = card.taxonomies.artist || [];
    const groups = card.taxonomies.group || [];
    const values = [...artists.slice(0, 1), ...groups.slice(0, artists.length ? 1 : 2)].map(MRM.util.slugLabel);
    return values.join(" · ");
  };

  const progressFor = (card) => MRM.storage.getReaderProgress(card.url);
  const updateCardState = (card) => {
    const read = MRM.storage.isRead(card.url);
    const progress = progressFor(card);
    card.article.classList.toggle("mrm-is-read", read);
    card.article.classList.toggle("mrm-in-progress", Boolean(progress && !progress.completed));
    const stateBadge = MRM.util.q(".mrm-card-state-badge", card.article);
    if (stateBadge) {
      stateBadge.hidden = !read && !progress;
      stateBadge.classList.toggle("is-complete", read);
      stateBadge.textContent = read ? "✓ Read" : progress ? `${progress.percent}%` : "";
      stateBadge.setAttribute("aria-label", read ? "Read" : progress ? `${progress.percent}% read` : "");
    }
    const progressRow = MRM.util.q(".mrm-card-progress", card.article);
    if (progressRow) {
      progressRow.hidden = !progress || progress.completed || read;
      const bar = MRM.util.q(".mrm-card-progress-bar", progressRow);
      const label = MRM.util.q(".mrm-card-progress-label", progressRow);
      if (bar && progress) bar.style.setProperty("--mrm-progress", `${progress.percent}%`);
      if (label && progress) label.textContent = `Page ${progress.pageIndex + 1} of ${progress.pageCount}`;
      if (progress) {
        progressRow.setAttribute("aria-valuemin", "0");
        progressRow.setAttribute("aria-valuemax", "100");
        progressRow.setAttribute("aria-valuenow", String(progress.percent));
        progressRow.setAttribute("aria-valuetext", `Page ${progress.pageIndex + 1} of ${progress.pageCount}`);
      }
    }
    const reader = MRM.util.q(".mrm-reader-button", card.article);
    if (reader) reader.firstChild.textContent = progress && !progress.completed && !read ? "Continue" : "Read";
    const toggle = MRM.util.q(".mrm-card-read-toggle", card.article);
    if (toggle) {
      toggle.textContent = read ? "Mark unread" : "Mark read";
      toggle.setAttribute("aria-label", `${read ? "Mark unread" : "Mark read"}: ${card.title}`);
    }
  };

  const filterAndSort = () => {
    ensureOverview();
    const { filters } = MRM.storage.preferences;
    const query = MRM.util.normalize(filters.query);
    const ordered = orderedCardsFor(filters);
    const visible = ordered.filter((card) => {
      if (query && !card.haystack.includes(query)) return false;
      if (filters.hideRead && MRM.storage.isRead(card.url)) return false;
      if (filters.onlyEnglish && !card.isEnglish) return false;
      return MRM.facets.matches(card, filters);
    });
    const visibleSet = new Set(visible.map((card) => card.url));
    for (const card of MRM.runtime.cards) {
      card.article.hidden = !visibleSet.has(card.url);
      updateCardState(card);
    }
    syncGridOrder(ordered);
    updateResultUI(visible.length, MRM.runtime.cards.length);
    syncOverviewControls();
    MRM.util.announce(`${visible.length} results visible`);
    renderActiveChips();
    return visible;
  };

  const chip = (label, onRemove) => {
    const button = MRM.util.create("button", { className: "mrm-filter-chip", attrs: { type: "button", "aria-label": `Remove ${label}`, title: label } });
    button.append(
      MRM.util.create("span", { className: "mrm-filter-chip-label", text: label }),
      MRM.util.create("span", { className: "mrm-filter-chip-remove", text: "×", attrs: { "aria-hidden": "true" } }),
    );
    button.addEventListener("click", onRemove);
    return button;
  };

  const activeDescriptors = () => {
    const filters = MRM.storage.preferences.filters;
    const descriptors = [];
    if (filters.query) descriptors.push({ label: `Search: ${filters.query}`, remove: () => MRM.storage.replaceFilters({ ...filters, query: "" }) });
    if (filters.hideRead) descriptors.push({ label: "Hide read", remove: () => MRM.storage.replaceFilters({ ...filters, hideRead: false }) });
    if (filters.onlyEnglish) descriptors.push({ label: "English only", remove: () => MRM.storage.replaceFilters({ ...filters, onlyEnglish: false }) });
    for (const mode of ["include", "exclude"]) for (const [type, values] of Object.entries(filters[mode] || {})) for (const value of values) {
      descriptors.push({ label: `${mode === "include" ? "IN" : "OUT"} · ${MRM.site.facetPrefixes[type]} · ${MRM.util.slugLabel(value)}`, remove: () => MRM.facets.toggle(mode, type, value) });
    }
    return descriptors;
  };

  const renderActiveChips = () => {
    const descriptors = activeDescriptors();
    for (const host of MRM.util.qa(".mrm-active-filters")) {
      host.replaceChildren(...descriptors.map(({ label, remove }) => chip(label, remove)));
      if (host.classList.contains("mrm-overview-active-filters")) host.hidden = descriptors.length === 0;
    }
    const clear = MRM.util.q(".mrm-overview-clear");
    if (clear) clear.hidden = descriptors.length === 0;
  };

  const metadataButton = (item) => {
    const label = MRM.util.slugLabel(item.slug);
    const button = MRM.util.create("button", {
      className: "mrm-taxonomy-chip",
      attrs: { type: "button", title: `Include ${MRM.site.facetPrefixes[item.type]}: ${label}` },
      dataset: { type: item.type },
    });
    button.append(MRM.util.create("span", { className: "mrm-chip-label", text: label }));
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      MRM.facets.toggle("include", item.type, item.slug);
    });
    return button;
  };

  const overflowButton = (card, values, hiddenCount, variant) => {
    const button = MRM.util.create("button", {
      className: `mrm-taxonomy-chip mrm-taxonomy-more mrm-taxonomy-more-${variant}`,
      text: `+${hiddenCount}`,
      attrs: { type: "button", "aria-label": `Show ${hiddenCount} more metadata terms for ${card.title}` },
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      MRM.settings.openFacetModal(null, values.map((item) => ({ ...item, name: MRM.util.slugLabel(item.slug), count: 0 })), `${card.title} metadata`);
    });
    return button;
  };

  const metadataChips = (card) => {
    const row = MRM.util.create("div", { className: "mrm-card-chips", attrs: { "aria-label": "Manga metadata" } });
    const priority = ["genre", "category", "status", "tag", "pairing", "group", "artist", "lang"];
    const values = priority.flatMap((type) => (card.taxonomies[type] || []).map((slug) => ({ type, slug })));
    values.slice(0, 2).forEach((item, index) => {
      const button = metadataButton(item);
      if (index === 1) button.classList.add("mrm-taxonomy-secondary");
      row.append(button);
    });
    if (values.length > 2) row.append(overflowButton(card, values, values.length - 2, "wide"));
    if (values.length > 1) row.append(overflowButton(card, values, values.length - 1, "compact"));
    return row;
  };

  const enhanceCard = (card) => {
    if (card.article.hasAttribute(enhancedAttr)) return false;
    card.article.setAttribute(enhancedAttr, "true");
    card.article.classList.add("mrm-card");
    card.article.setAttribute("role", "listitem");
    card.article.dataset.mrmUrl = card.url;
    const content = MRM.util.q(".entry-content", card.article) || card.article;
    const imageLink = MRM.util.q(".entry-image-link", card.article);
    if (imageLink) imageLink.removeAttribute("aria-hidden");
    card.link.title = card.title;
    if (card.image) {
      card.image.alt = card.image.alt || card.title;
      card.image.loading = card.order < 8 ? "eager" : "lazy";
      card.image.decoding = "async";
    }
    MRM.util.qa(":scope > .mrm-card-badges", content).forEach((node) => node.remove());
    const badges = MRM.util.create("div", { className: "mrm-card-badges" });
    const language = card.taxonomies.lang?.[0];
    if (language) badges.append(MRM.util.create("span", { className: "mrm-card-language-badge", text: MRM.util.slugLabel(language) }));
    badges.append(MRM.util.create("span", { className: "mrm-card-state-badge", attrs: { hidden: true } }));
    content.append(badges);
    const header = MRM.util.q(".entry-header", card.article);
    MRM.util.qa(":scope > .mrm-card-byline", header || card.article).forEach((node) => node.remove());
    const byline = creatorLine(card);
    if (header && byline) header.append(MRM.util.create("p", { className: "mrm-card-byline", text: byline }));
    const footer = MRM.util.q(".entry-footer", card.article) || MRM.util.create("footer", { className: "entry-footer" });
    if (!footer.parentElement) card.article.append(footer);
    const progress = MRM.util.create("div", { className: "mrm-card-progress", attrs: { hidden: true, role: "progressbar", "aria-label": `Reading progress for ${card.title}` } });
    progress.append(MRM.util.create("span", { className: "mrm-card-progress-track" },), MRM.util.create("span", { className: "mrm-card-progress-label" }));
    MRM.util.q(".mrm-card-progress-track", progress).append(MRM.util.create("span", { className: "mrm-card-progress-bar" }));
    const actions = MRM.util.create("div", { className: "mrm-card-actions" });
    const reader = MRM.util.create("button", { className: "mrm-reader-button", attrs: { type: "button", "aria-label": `Open ${card.title} in reader` } });
    reader.append(document.createTextNode("Read"), MRM.util.create("span", { text: "›", attrs: { "aria-hidden": "true" } }));
    reader.addEventListener("click", (event) => {
      event.preventDefault();
      MRM.reader.open(card.url, { sequence: visibleCards().map((item) => item.url), trigger: reader });
    });
    const original = MRM.util.create("a", { className: "mrm-card-original", text: "↗", attrs: { href: card.url, target: "_blank", rel: "noopener", "aria-label": `Open original post: ${card.title}`, title: "Open original post" } });
    original.addEventListener("click", () => MRM.storage.markRead(card.url, card.title), { passive: true });
    const readToggle = MRM.util.create("button", { className: "mrm-card-read-toggle", attrs: { type: "button" } });
    readToggle.addEventListener("click", (event) => {
      event.preventDefault();
      if (MRM.storage.isRead(card.url)) MRM.storage.unmarkRead(card.url);
      else MRM.storage.markRead(card.url, card.title);
    });
    actions.append(reader, original, readToggle);
    footer.replaceChildren(metadataChips(card), progress, actions);
    card.link.addEventListener("click", () => MRM.storage.markRead(card.url, card.title), { passive: true });
    content.classList.add("mrm-card-cover");
    const root = ensureGridRoot(card.article);
    if (root && card.article.parentElement !== root) root.append(card.article);
    updateCardState(card);
    return true;
  };

  const visibleCards = () => MRM.runtime.cards.filter((card) => !card.article.hidden);
  const markVisibleRead = () => {
    for (const card of visibleCards()) MRM.storage.markRead(card.url, card.title);
    filterAndSort();
  };
  const clearFilters = () => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, query: "", hideRead: false, onlyEnglish: false, include: {}, exclude: {} });

  const removeDuplicateCandidate = (article) => {
    if (!article?.isConnected || article.hasAttribute(enhancedAttr)) return;
    if (article.hasAttribute(pageTualCandidateAttr) || article.closest?.(`[${pageTualCandidateAttr}]`)) article.remove();
  };

  const ingest = (root = document) => {
    const parsed = MRM.site.collectCards(root);
    if (!parsed.length) return 0;
    ensureOverview();
    const existing = new Map(MRM.runtime.cards.map((card) => [card.url, card]));
    let order = MRM.runtime.cards.length;
    let added = 0;
    for (const card of parsed) {
      if (existing.has(card.url)) {
        if (existing.get(card.url).article !== card.article) removeDuplicateCandidate(card.article);
        continue;
      }
      card.order = order++;
      existing.set(card.url, card);
      MRM.runtime.cards.push(card);
      if (enhanceCard(card)) added += 1;
    }
    if (!added) return 0;
    MRM.facets.buildDirectory(MRM.runtime.cards);
    filterAndSort();
    MRM.settings.refreshFacets();
    return added;
  };

  const scan = (root = document) => ingest(root);

  const candidateArticles = (root = document) => {
    const nodes = [];
    if (root instanceof Element && root.matches(MRM.selectors.archiveCards)) nodes.push(root);
    if (root && typeof root.querySelectorAll === "function") nodes.push(...MRM.util.qa(MRM.selectors.archiveCards, root));
    return MRM.util.unique(nodes);
  };

  const markPageTualCandidates = (root = document) => {
    let marked = 0;
    for (const article of candidateArticles(root)) {
      if (article.hasAttribute(enhancedAttr)) continue;
      article.setAttribute(pageTualCandidateAttr, "1");
      marked += 1;
    }
    return marked;
  };

  const flushQueuedScans = () => {
    scanTimer = 0;
    const roots = [...pendingRoots];
    pendingRoots.clear();
    let added = 0;
    for (const root of roots) added += ingest(root?.isConnected === false ? document : root);
    return added;
  };

  const queueScan = (root = document, delay = 90) => {
    pendingRoots.add(root || document);
    window.clearTimeout(scanTimer);
    scanTimer = window.setTimeout(flushQueuedScans, delay);
  };

  const isPageTualUi = (node) => node instanceof Element && (node.matches(pageTualUiSelector) || Boolean(node.closest?.(pageTualUiSelector)));
  const rawArticleRoots = (records) => {
    const roots = [];
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element) || isPageTualUi(node) || node.closest?.(ignoredMutationSelector)) continue;
      const articles = candidateArticles(node);
      if (articles.some((article) => !article.hasAttribute(enhancedAttr))) roots.push(node);
    }
    return MRM.util.unique(roots);
  };

  const handlePageTualInsert = (event) => {
    if (event && typeof event === "object" && handledPageTualEvents.has(event)) return;
    if (event && typeof event === "object") handledPageTualEvents.add(event);
    const root = event?.detail?.root instanceof Element ? event.detail.root : document;
    markPageTualCandidates(root);
    ingest(root);
    queueScan(document, 90);
    window.setTimeout(() => queueScan(document, 90), 500);
  };

  const observe = () => {
    MRM.runtime.archiveObserver?.disconnect();
    MRM.runtime.archiveObserver = new MutationObserver((records) => {
      for (const root of rawArticleRoots(records)) queueScan(root, 70);
    });
    MRM.runtime.archiveObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("message", (event) => {
      const data = event?.data;
      if (data && typeof data === "object" && data.command === "pagetual" && data.action === "insert") handlePageTualInsert(event);
    });
    window.addEventListener("pagetual:insert", handlePageTualInsert);
    document.addEventListener("pagetual:insert", handlePageTualInsert);
    document.addEventListener("pagetual_page_inserted", handlePageTualInsert);
  };

  const init = () => {
    document.body.classList.add("mrm-archive-page");
    ensureOverview();
    scan(document);
    observe();
  };

  MRM.events.addEventListener("preferences", filterAndSort);
  MRM.events.addEventListener("read-history", filterAndSort);
  MRM.events.addEventListener("reader-progress", filterAndSort);
  return { init, scan, filterAndSort, visibleCards, markVisibleRead, clearFilters, renderActiveChips, activeFilterCount };
})();
