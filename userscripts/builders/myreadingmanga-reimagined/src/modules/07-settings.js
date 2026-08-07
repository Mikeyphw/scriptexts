MRM.settings = (() => {
  let panel = null;
  let facetHost = null;
  const makeToggle = (label, checked, onChange) => {
    const row = MRM.util.create("label", { className: "mrm-toggle-row" });
    const input = MRM.util.create("input", { attrs: { type: "checkbox" } });
    input.checked = checked;
    input.addEventListener("change", () => onChange(input.checked));
    row.append(MRM.util.create("span", { text: label }), input);
    return row;
  };
  const updateFilters = (patch) => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, ...patch });
  const renderPanel = () => {
    if (panel) return panel;
    const launcher = MRM.util.create("button", { attrs: { id: "mrm-panel-launcher", type: "button", "aria-controls": "mrm-control-panel", "aria-expanded": "false", "aria-label": "Open archive filters and display settings" } });
    launcher.innerHTML = '<span class="mrm-launcher-icon" aria-hidden="true">☷</span><span>Filters</span><span id="mrm-launcher-count" class="mrm-launcher-count" hidden>0</span>';
    panel = MRM.util.create("aside", { attrs: { id: "mrm-control-panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "mrm-panel-title", hidden: true }, className: "mrm-control-panel" });
    panel.innerHTML = `
      <header class="mrm-panel-header"><div><strong id="mrm-panel-title">MRM workspace</strong><span id="mrm-result-count">0 results</span></div><button type="button" data-panel-action="close" aria-label="Close controls">×</button></header>
      <nav class="mrm-panel-tabs" aria-label="Settings sections"><button type="button" data-tab="filters" aria-selected="true">Filters</button><button type="button" data-tab="grid">Grid</button><button type="button" data-tab="theme">Theme</button></nav>
      <div class="mrm-panel-scroll">
        <section data-panel-section="filters">
          <label class="mrm-field"><span>Search visible archive</span><input id="mrm-live-search" type="search" autocomplete="off" placeholder="Title, artist, tags…"></label>
          <section class="mrm-view-section" aria-labelledby="mrm-view-title"><div class="mrm-section-heading"><strong id="mrm-view-title">Filter views</strong><button type="button" data-panel-action="save-view">Save current</button></div><div id="mrm-filter-views" class="mrm-filter-views"></div></section>
          <div id="mrm-filter-toggles"></div>
          <label class="mrm-field"><span>Display order</span><select id="mrm-sort"><option value="default">Newest first</option><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="english-first">English first</option></select></label>
          <div id="mrm-native-search-controls"></div>
          <div class="mrm-inline-actions"><button type="button" data-panel-action="mark-read">Mark visible read</button><button type="button" data-panel-action="clear-filters">Clear filters</button></div>
          <div id="mrm-active-filters" class="mrm-active-filters" aria-label="Active filters"></div>
          <div id="mrm-facets" class="mrm-facets"></div>
        </section>
        <section data-panel-section="grid" hidden></section>
        <section data-panel-section="theme" hidden></section>
      </div>`;
    document.body.append(launcher, panel);
    launcher.addEventListener("click", () => togglePanel());
    panel.addEventListener("click", onPanelClick);
    panel.addEventListener("keydown", (event) => MRM.util.trapFocus(event, panel));
    const search = panel.querySelector("#mrm-live-search");
    search.value = MRM.storage.preferences.filters.query;
    search.addEventListener("input", MRM.util.debounce(() => updateFilters({ query: search.value }), 120));
    const sort = panel.querySelector("#mrm-sort");
    sort.value = MRM.storage.preferences.filters.sort;
    sort.addEventListener("change", () => updateFilters({ sort: sort.value }));
    renderNativeSearchControls();
    renderFilterViews();
    renderFilterToggles();
    renderGridSettings();
    renderThemeSettings();
    facetHost = panel.querySelector("#mrm-facets");
    refreshFacets();
    return panel;
  };
  const renderNativeSearchControls = () => {
    const host = panel.querySelector("#mrm-native-search-controls");
    host.replaceChildren();
    if (MRM.runtime.page !== "search") return;
    const native = MRM.util.q("#ep-sort");
    const field = MRM.util.create("label", { className: "mrm-field" });
    const select = MRM.util.create("select", { attrs: { id: "mrm-native-sort" } });
    if (native) for (const option of native.options) select.append(MRM.util.create("option", { text: option.textContent, attrs: { value: option.value } }));
    else for (const [value, label] of [["date", "Newest"], ["date_asc", "Oldest"], ["relevance", "Relevance"], ["rand", "Random"]]) select.append(MRM.util.create("option", { text: label, attrs: { value } }));
    select.value = MRM.facets.nativeSortValue() || "date";
    field.append(MRM.util.create("span", { text: "Site order" }), select);
    const apply = MRM.util.create("button", { text: "Apply filters on site", attrs: { type: "button", "data-panel-action": "apply-native" } });
    host.append(field, apply);
  };
  const builtinViews = () => [
    { id: "builtin-unread", name: "Unread", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: true } },
    { id: "builtin-english-unread", name: "English unread", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: true, onlyEnglish: true } },
    { id: "builtin-english", name: "English only", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: false, onlyEnglish: true } },
    { id: "builtin-saved", name: "Saved for later", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: false, onlySaved: true } },
    { id: "builtin-defaults", name: "Default exclusions", filters: structuredClone(MRM.storage.defaults.filters) },
  ];
  const renderFilterViews = () => {
    const host = panel?.querySelector("#mrm-filter-views");
    if (!host) return;
    host.replaceChildren();
    for (const view of [...builtinViews(), ...(MRM.storage.preferences.savedViews || [])]) {
      const item = MRM.util.create("div", { className: "mrm-filter-view" });
      const apply = MRM.util.create("button", { text: view.name, attrs: { type: "button", title: `Apply ${view.name}` } });
      apply.addEventListener("click", () => MRM.storage.applyView(view));
      item.append(apply);
      if (!view.id.startsWith("builtin-")) {
        const remove = MRM.util.create("button", { text: "×", className: "mrm-filter-view-remove", attrs: { type: "button", "aria-label": `Delete saved view ${view.name}` } });
        remove.addEventListener("click", () => MRM.storage.deleteView(view.id));
        item.append(remove);
      }
      host.append(item);
    }
  };
  const renderFilterToggles = () => {
    const host = panel.querySelector("#mrm-filter-toggles");
    host.replaceChildren(
      makeToggle("Hide read", MRM.storage.preferences.filters.hideRead, (value) => updateFilters({ hideRead: value })),
      makeToggle("Only English", MRM.storage.preferences.filters.onlyEnglish, (value) => updateFilters({ onlyEnglish: value })),
      makeToggle("Saved for later only", MRM.storage.preferences.filters.onlySaved, (value) => updateFilters({ onlySaved: value })),
    );
  };
  const rangeField = (label, key, value, min, max, step, onInput) => {
    const row = MRM.util.create("label", { className: "mrm-field" });
    const output = MRM.util.create("output", { text: String(value) });
    const input = MRM.util.create("input", { attrs: { type: "range", min, max, step, value, "data-grid-key": key } });
    input.addEventListener("input", () => { output.value = input.value; onInput(Number(input.value)); });
    row.append(MRM.util.create("span", { text: label }), output, input);
    return row;
  };
  const renderGridSettings = () => {
    const host = panel.querySelector("[data-panel-section='grid']");
    const updateGrid = (patch) => MRM.storage.update({ grid: { ...MRM.storage.preferences.grid, ...patch } });
    const g = MRM.storage.preferences.grid;
    const density = MRM.util.create("fieldset", { className: "mrm-density-settings" });
    density.append(MRM.util.create("legend", { text: "Archive density" }));
    const choices = MRM.util.create("div", { className: "mrm-density-options", attrs: { role: "radiogroup", "aria-label": "Archive density" } });
    for (const [value, title, description] of [
      ["comfortable", "Comfortable", "4 columns · larger covers"],
      ["balanced", "Balanced", "5 columns · recommended"],
      ["compact", "Compact", "6 columns · more results"],
    ]) {
      const button = MRM.util.create("button", { className: "mrm-density-option", attrs: { type: "button", role: "radio", "aria-checked": g.density === value }, dataset: { density: value } });
      button.append(MRM.util.create("strong", { text: title }), MRM.util.create("span", { text: description }));
      button.addEventListener("click", () => {
        updateGrid({ density: value });
        renderGridSettings();
      });
      choices.append(button);
    }
    density.append(choices);
    const advanced = MRM.util.create("details", { className: "mrm-grid-advanced" });
    advanced.append(MRM.util.create("summary", { text: "Custom grid controls" }));
    const advancedBody = MRM.util.create("div", { className: "mrm-grid-advanced-body" });
    const customUpdate = (patch) => updateGrid({ density: "custom", ...patch });
    advancedBody.append(
      rangeField("Desktop columns", "desktop", g.desktop, 2, 10, 1, (value) => customUpdate({ desktop: value })),
      rangeField("Tablet columns", "tablet", g.tablet, 2, 8, 1, (value) => customUpdate({ tablet: value })),
      rangeField("Mobile columns", "mobile", g.mobile, 1, 4, 1, (value) => customUpdate({ mobile: value })),
      rangeField("Grid gap", "gap", g.gap, 4, 32, 1, (value) => customUpdate({ gap: value })),
    );
    advanced.append(advancedBody);
    const ratio = rangeField("Cover ratio", "ratio", g.ratio, 0.55, 1.2, 0.01, (value) => updateGrid({ ratio: value }));
    const cover = (() => {
      const field = MRM.util.create("label", { className: "mrm-field" });
      const select = MRM.util.create("select");
      select.innerHTML = '<option value="contain">Fit entire cover</option><option value="cover">Fill card frame</option>';
      select.value = g.coverFit === "cover" ? "cover" : "contain";
      select.addEventListener("change", () => updateGrid({ coverFit: select.value }));
      field.append(MRM.util.create("span", { text: "Cover display" }), select);
      return field;
    })();
    host.replaceChildren(density, ratio, cover, advanced);
  };
  const renderThemeSettings = () => {
    const host = panel.querySelector("[data-panel-section='theme']");
    const prefs = MRM.storage.preferences;
    const ui = makeToggle("Enable site makeover", prefs.uiEnabled, (value) => MRM.storage.update({ uiEnabled: value }));
    const dock = MRM.util.create("label", { className: "mrm-field" });
    const dockSelect = MRM.util.create("select");
    dockSelect.innerHTML = '<option value="right">Dock right</option><option value="left">Dock left</option>';
    dockSelect.value = prefs.dock;
    dockSelect.addEventListener("change", () => MRM.storage.update({ dock: dockSelect.value }));
    dock.append(MRM.util.create("span", { text: "Panel position" }), dockSelect);
    const accent = MRM.util.create("label", { className: "mrm-field" });
    const color = MRM.util.create("input", { attrs: { type: "color", value: prefs.accent } });
    const text = MRM.util.create("input", { attrs: { type: "text", value: prefs.accent, maxlength: 7, pattern: "#[0-9A-Fa-f]{6}" } });
    const applyColor = (value) => { if (/^#[0-9a-f]{6}$/i.test(value)) MRM.storage.update({ accent: value }); };
    color.addEventListener("input", () => { text.value = color.value; applyColor(color.value); });
    text.addEventListener("change", () => { color.value = text.value; applyColor(text.value); });
    accent.append(MRM.util.create("span", { text: "Accent" }), color, text);
    const borders = MRM.util.create("fieldset", { className: "mrm-border-grid" });
    borders.append(MRM.util.create("legend", { text: "Borders" }));
    for (const [name, enabled] of Object.entries(prefs.border)) borders.append(makeToggle(MRM.util.slugLabel(name), enabled, (value) => MRM.storage.update({ border: { ...MRM.storage.preferences.border, [name]: value } })));
    const readerProfile = MRM.util.create("p", { className: "mrm-settings-note", text: `Reader controls are remembered separately for ${MRM.storage.readerDevice()} and ${MRM.storage.readerDevice() === "mobile" ? "desktop" : "mobile"}.` });
    const clearRead = MRM.util.create("button", { text: "Clear read history", attrs: { type: "button" } });
    clearRead.addEventListener("click", () => { if (confirm("Clear all locally stored read history?")) MRM.storage.clearRead(); });
    const clearSaved = MRM.util.create("button", { text: "Clear saved posts", attrs: { type: "button" } });
    clearSaved.addEventListener("click", () => { if (confirm("Remove every locally saved post?")) MRM.storage.clearSaved(); });
    const dataActions = MRM.util.create("div", { className: "mrm-inline-actions" });
    dataActions.append(clearRead, clearSaved);
    host.replaceChildren(ui, dock, accent, borders, readerProfile, dataActions);
  };
  const termRow = (type, term) => {
    const row = MRM.util.create("div", { className: "mrm-facet-term" });
    const label = MRM.util.create("span", { text: term.name });
    const count = MRM.util.create("small", { text: term.count ? String(term.count) : "" });
    const include = MRM.util.create("button", { text: "Include", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("include", type).includes(term.slug) } });
    const exclude = MRM.util.create("button", { text: "Exclude", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("exclude", type).includes(term.slug) } });
    include.addEventListener("click", () => MRM.facets.toggle("include", type, term.slug));
    exclude.addEventListener("click", () => MRM.facets.toggle("exclude", type, term.slug));
    row.append(label, count, include, exclude);
    return row;
  };
  const refreshFacets = () => {
    if (!facetHost) return;
    facetHost.replaceChildren();
    for (const [type, terms] of Object.entries(MRM.facets.directory)) {
      const details = MRM.util.create("details", { className: "mrm-facet-group" });
      const summary = MRM.util.create("summary", { text: `${MRM.site.facetPrefixes[type]} (${terms.length})` });
      const search = MRM.util.create("input", { attrs: { type: "search", placeholder: `Search ${MRM.site.facetPrefixes[type].toLocaleLowerCase()}`, "aria-label": `Search ${MRM.site.facetPrefixes[type]}` } });
      const list = MRM.util.create("div", { className: "mrm-facet-list" });
      const renderTerms = () => {
        const needle = MRM.util.normalize(search.value);
        const filtered = terms.filter((term) => !needle || MRM.util.normalize(term.name).includes(needle));
        list.replaceChildren(...filtered.slice(0, 8).map((term) => termRow(type, term)));
        more.hidden = filtered.length <= 8;
      };
      const more = MRM.util.create("button", { className: "mrm-facet-more", text: "Show all", attrs: { type: "button" } });
      more.addEventListener("click", () => openFacetModal(type, terms, MRM.site.facetPrefixes[type]));
      search.addEventListener("input", MRM.util.debounce(renderTerms, 80));
      details.append(summary, search, list, more);
      facetHost.append(details);
      renderTerms();
    }
  };
  const openFacetModal = (type, terms, title) => {
    let modal = MRM.util.q("#mrm-facet-modal");
    if (!modal) {
      modal = MRM.util.create("section", { attrs: { id: "mrm-facet-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-facet-modal-title" }, className: "mrm-facet-modal" });
      document.body.append(modal);
    }
    modal.innerHTML = `<div class="mrm-facet-modal-card"><header><h2 id="mrm-facet-modal-title"></h2><button type="button" data-modal-close aria-label="Close">×</button></header><input type="search" aria-label="Search options" placeholder="Search options…"><div class="mrm-facet-modal-list"></div><footer class="mrm-facet-modal-pagination"><button type="button" data-page="previous">Previous</button><span aria-live="polite"></span><button type="button" data-page="next">Next</button></footer></div>`;
    modal.querySelector("h2").textContent = title;
    const input = modal.querySelector("input");
    const list = modal.querySelector(".mrm-facet-modal-list");
    const pageLabel = modal.querySelector(".mrm-facet-modal-pagination span");
    const previous = modal.querySelector("[data-page='previous']");
    const next = modal.querySelector("[data-page='next']");
    const pageSize = 18;
    let page = 0;
    const render = () => {
      const needle = MRM.util.normalize(input.value);
      const filtered = terms.filter((term) => !needle || MRM.util.normalize(term.name).includes(needle));
      const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = MRM.util.clamp(page, 0, pageCount - 1);
      const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);
      list.replaceChildren(...visible.map((term) => type ? termRow(type, term) : MRM.util.create("span", { className: "mrm-taxonomy-chip", text: term.name })));
      pageLabel.textContent = `${page + 1} / ${pageCount} · ${filtered.length} options`;
      previous.disabled = page <= 0;
      next.disabled = page >= pageCount - 1;
    };
    previous.addEventListener("click", () => { page -= 1; render(); });
    next.addEventListener("click", () => { page += 1; render(); });
    input.addEventListener("input", () => { page = 0; render(); });
    MRM.runtime.facetModalOpen = true;
    document.documentElement.classList.add("mrm-modal-open");
    const closeModal = () => { MRM.runtime.facetModalOpen = false; document.documentElement.classList.remove("mrm-modal-open"); modal.remove(); };
    modal.querySelector("[data-modal-close]").addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    modal.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); else MRM.util.trapFocus(event, modal); });
    render(); input.focus();
  };
  const openMetadataPopover = (button, card, values) => {
    MRM.util.q("#mrm-metadata-popover")?.remove();
    document.documentElement.classList.remove("mrm-metadata-open");
    const mobile = matchMedia("(max-width: 680px)").matches;
    const popover = MRM.util.create("section", { attrs: { id: "mrm-metadata-popover", role: "dialog", "aria-modal": String(mobile), "aria-labelledby": "mrm-metadata-title" }, className: "mrm-metadata-popover" });
    const header = MRM.util.create("header");
    header.append(MRM.util.create("strong", { id: "mrm-metadata-title", text: card.title }), MRM.util.create("button", { text: "×", attrs: { type: "button", "aria-label": "Close metadata" } }));
    const body = MRM.util.create("div", { className: "mrm-metadata-groups" });
    const grouped = new Map();
    for (const item of values) { if (!grouped.has(item.type)) grouped.set(item.type, []); grouped.get(item.type).push(item); }
    for (const [type, items] of grouped) {
      const group = MRM.util.create("section", { className: "mrm-metadata-group" });
      group.append(MRM.util.create("h3", { text: MRM.site.facetPrefixes[type] || MRM.util.slugLabel(type) }));
      const chips = MRM.util.create("div", { className: "mrm-metadata-group-chips" });
      for (const item of items) {
        const chip = MRM.util.create("button", { text: MRM.util.slugLabel(item.slug), attrs: { type: "button", title: `Include ${MRM.util.slugLabel(item.slug)}` } });
        chip.addEventListener("click", () => { MRM.facets.toggle("include", item.type, item.slug); close(); });
        chips.append(chip);
      }
      group.append(chips); body.append(group);
    }
    let outside = null;
    const close = () => {
      document.documentElement.classList.remove("mrm-metadata-open");
      popover.remove();
      if (outside) document.removeEventListener("pointerdown", outside, true);
    };
    popover.append(header, body); document.body.append(popover);
    if (mobile) document.documentElement.classList.add("mrm-metadata-open");
    const rect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const below = rect.bottom + 8;
    const top = below + popoverRect.height <= innerHeight - 12 ? below : Math.max(12, rect.top - popoverRect.height - 8);
    popover.style.setProperty("--mrm-popover-left", `${Math.max(12, Math.min(innerWidth - Math.min(360, innerWidth - 24) - 12, rect.left))}px`);
    popover.style.setProperty("--mrm-popover-top", `${top}px`);
    header.querySelector("button").addEventListener("click", close);
    outside = (event) => { if (!popover.contains(event.target) && event.target !== button) close(); };
    setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
    popover.addEventListener("keydown", (event) => { if (event.key === "Escape") { close(); button.focus(); } else MRM.util.trapFocus(event, popover); });
    popover.querySelector("button").focus();
  };
  const selectTab = (section = "filters") => {
    renderPanel();
    const tab = panel.querySelector(`[data-tab="${section}"]`) || panel.querySelector("[data-tab='filters']");
    panel.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
    panel.querySelectorAll("[data-panel-section]").forEach((node) => node.hidden = node.dataset.panelSection !== tab.dataset.tab);
  };
  const togglePanel = (force, section) => {
    renderPanel();
    if (section) selectTab(section);
    const open = force ?? panel.hidden;
    panel.hidden = !open;
    MRM.runtime.panelOpen = open;
    document.documentElement.classList.toggle("mrm-panel-open", open && matchMedia("(max-width: 760px)").matches);
    const launcher = MRM.util.q("#mrm-panel-launcher");
    launcher.setAttribute("aria-expanded", String(open));
    if (open) panel.querySelector("[data-panel-action='close']").focus();
    else launcher.focus();
  };
  const open = (section = "filters") => togglePanel(true, section);
  const onPanelClick = (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      panel.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
      panel.querySelectorAll("[data-panel-section]").forEach((section) => section.hidden = section.dataset.panelSection !== tab.dataset.tab);
      return;
    }
    const action = event.target.closest("[data-panel-action]")?.dataset.panelAction;
    if (action === "close") togglePanel(false);
    if (action === "mark-read") MRM.archive.markVisibleRead();
    if (action === "save-view") { const name = prompt("Name this filter view"); if (name) MRM.storage.saveView(name); }
    if (action === "apply-native") MRM.facets.applyNative(panel.querySelector("#mrm-native-sort")?.value || MRM.facets.nativeSortValue());
    if (action === "clear-filters") {
      MRM.archive.clearFilters();
      panel.querySelector("#mrm-live-search").value = "";
      renderFilterToggles();
    }
  };
  const installRecoveryButton = () => {
    if (MRM.util.q("#mrm-ui-recovery")) return;
    const button = MRM.util.create("button", { attrs: { id: "mrm-ui-recovery", type: "button" }, text: "Enable MRM UI" });
    button.addEventListener("click", () => MRM.storage.update({ uiEnabled: true }));
    document.body.append(button);
  };
  const init = () => {
    renderPanel();
    installRecoveryButton();
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && MRM.runtime.panelOpen && !event.defaultPrevented) togglePanel(false);
    });
  };
  MRM.events.addEventListener("preferences", () => {
    if (!panel) return;
    const search = panel.querySelector("#mrm-live-search");
    if (document.activeElement !== search) search.value = MRM.storage.preferences.filters.query;
    panel.querySelector("#mrm-sort").value = MRM.storage.preferences.filters.sort;
    panel.querySelectorAll(".mrm-density-option").forEach((button) => button.setAttribute("aria-checked", String(button.dataset.density === MRM.storage.preferences.grid.density)));
    refreshFacets();
    renderFilterViews();
  });
  return { init, open, togglePanel, refreshFacets, openFacetModal, openMetadataPopover, installRecoveryButton };
})();
