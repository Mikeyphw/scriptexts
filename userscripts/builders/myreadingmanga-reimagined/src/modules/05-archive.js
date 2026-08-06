MRM.archive = (() => {
  const enhancedAttr = "data-mrm-enhanced";
  const filterAndSort = () => {
    const { filters } = MRM.storage.preferences;
    const query = MRM.util.normalize(filters.query);
    let visible = MRM.runtime.cards.filter((card) => {
      if (query && !card.haystack.includes(query)) return false;
      if (filters.hideRead && MRM.storage.isRead(card.url)) return false;
      if (filters.onlyEnglish && !card.isEnglish) return false;
      return MRM.facets.matches(card, filters);
    });
    const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
    if (filters.sort === "title-asc") visible.sort((a, b) => collator.compare(a.title, b.title));
    else if (filters.sort === "title-desc") visible.sort((a, b) => collator.compare(b.title, a.title));
    else if (filters.sort === "english-first") visible.sort((a, b) => Number(b.isEnglish) - Number(a.isEnglish) || a.order - b.order);
    else visible.sort((a, b) => a.order - b.order);
    const visibleSet = new Set(visible.map((card) => card.url));
    const root = findGridRoot();
    for (const card of MRM.runtime.cards) {
      card.article.hidden = !visibleSet.has(card.url);
      card.article.classList.toggle("mrm-is-read", MRM.storage.isRead(card.url));
      if (!card.article.hidden && root) root.append(card.article);
    }
    MRM.util.q("#mrm-result-count")?.replaceChildren(document.createTextNode(`${visible.length} of ${MRM.runtime.cards.length}`));
    MRM.util.announce(`${visible.length} results visible`);
    renderActiveChips();
    return visible;
  };
  const findGridRoot = () => {
    const first = MRM.runtime.cards[0]?.article;
    return first?.parentElement || null;
  };
  const chip = (label, onRemove) => {
    const button = MRM.util.create("button", { className: "mrm-filter-chip", attrs: { type: "button", "aria-label": `Remove ${label}` } });
    button.append(MRM.util.create("span", { text: label }), MRM.util.create("span", { text: "×", attrs: { "aria-hidden": "true" } }));
    button.addEventListener("click", onRemove);
    return button;
  };
  const renderActiveChips = () => {
    const host = MRM.util.q("#mrm-active-filters");
    if (!host) return;
    host.replaceChildren();
    const filters = MRM.storage.preferences.filters;
    if (filters.query) host.append(chip(`Search: ${filters.query}`, () => MRM.storage.replaceFilters({ ...filters, query: "" })));
    if (filters.hideRead) host.append(chip("Hide read", () => MRM.storage.replaceFilters({ ...filters, hideRead: false })));
    if (filters.onlyEnglish) host.append(chip("English only", () => MRM.storage.replaceFilters({ ...filters, onlyEnglish: false })));
    for (const mode of ["include", "exclude"]) for (const [type, values] of Object.entries(filters[mode] || {})) for (const value of values) {
      host.append(chip(`${mode === "include" ? "IN" : "OUT"} · ${MRM.site.facetPrefixes[type]} · ${MRM.util.slugLabel(value)}`, () => MRM.facets.toggle(mode, type, value)));
    }
  };
  const metadataChips = (card) => {
    const row = MRM.util.create("div", { className: "mrm-card-chips" });
    const priority = ["lang", "genre", "category", "artist", "tag", "status", "group", "pairing"];
    const values = priority.flatMap((type) => (card.taxonomies[type] || []).map((slug) => ({ type, slug })));
    for (const item of values.slice(0, 7)) {
      const anchor = MRM.util.create("button", { className: "mrm-taxonomy-chip", text: MRM.util.slugLabel(item.slug), attrs: { type: "button", title: `Include ${MRM.site.facetPrefixes[item.type]}: ${MRM.util.slugLabel(item.slug)}` } });
      anchor.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); MRM.facets.toggle("include", item.type, item.slug); });
      row.append(anchor);
    }
    if (values.length > 7) {
      const more = MRM.util.create("button", { className: "mrm-taxonomy-chip", text: `+${values.length - 7}`, attrs: { type: "button", "aria-label": `Show ${values.length - 7} more tags` } });
      more.addEventListener("click", (event) => {
        event.preventDefault(); event.stopPropagation();
        MRM.settings.openFacetModal(null, values.map((item) => ({ ...item, name: MRM.util.slugLabel(item.slug), count: 0 })), `${card.title} metadata`);
      });
      row.append(more);
    }
    return row;
  };
  const enhanceCard = (card) => {
    if (card.article.hasAttribute(enhancedAttr)) return;
    card.article.setAttribute(enhancedAttr, "true");
    card.article.classList.add("mrm-card");
    card.article.dataset.mrmUrl = card.url;
    const content = MRM.util.q(".entry-content", card.article) || card.article;
    const imageLink = MRM.util.q(".entry-image-link", card.article);
    if (imageLink) imageLink.removeAttribute("aria-hidden");
    if (card.image) {
      card.image.alt = card.image.alt || card.title;
      card.image.loading = card.order < 8 ? "eager" : "lazy";
      card.image.decoding = "async";
    }
    const footer = MRM.util.q(".entry-footer", card.article) || MRM.util.create("footer", { className: "entry-footer" });
    if (!footer.parentElement) card.article.append(footer);
    const actions = MRM.util.create("div", { className: "mrm-card-actions" });
    const reader = MRM.util.create("button", { className: "mrm-reader-button", text: "Reader", attrs: { type: "button", "aria-label": `Open ${card.title} in reader` } });
    reader.addEventListener("click", (event) => {
      event.preventDefault();
      MRM.reader.open(card.url, { sequence: visibleCards().map((item) => item.url), trigger: reader });
    });
    actions.append(reader);
    footer.replaceChildren(metadataChips(card), actions);
    card.link.addEventListener("click", () => MRM.storage.markRead(card.url, card.title), { passive: true });
    content.classList.add("mrm-card-cover");
  };
  const visibleCards = () => MRM.runtime.cards.filter((card) => !card.article.hidden);
  const markVisibleRead = () => {
    for (const card of visibleCards()) MRM.storage.markRead(card.url, card.title);
    filterAndSort();
  };
  const scan = (root = document) => {
    const parsed = MRM.site.collectCards(root);
    if (!parsed.length) return;
    const existing = new Map(MRM.runtime.cards.map((card) => [card.url, card]));
    let order = MRM.runtime.cards.length;
    for (const card of parsed) {
      if (existing.has(card.url)) continue;
      card.order = order++;
      MRM.runtime.cards.push(card);
      enhanceCard(card);
    }
    MRM.facets.buildDirectory(MRM.runtime.cards);
    filterAndSort();
    MRM.settings.refreshFacets();
  };
  const observe = () => {
    MRM.runtime.archiveObserver?.disconnect();
    const refresh = MRM.util.debounce(() => scan(document), 120);
    MRM.runtime.archiveObserver = new MutationObserver((records) => {
      if (records.some((record) => [...record.addedNodes].some((node) => node.nodeType === 1 && (node.matches?.("article.post.entry") || node.querySelector?.("article.post.entry"))))) refresh();
    });
    MRM.runtime.archiveObserver.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pagetual:insert", refresh);
    document.addEventListener("pagetual_page_inserted", refresh);
  };
  const init = () => {
    document.body.classList.add("mrm-archive-page");
    scan(document);
    observe();
  };
  MRM.events.addEventListener("preferences", filterAndSort);
  MRM.events.addEventListener("read-history", filterAndSort);
  return { init, scan, filterAndSort, visibleCards, markVisibleRead, renderActiveChips };
})();
