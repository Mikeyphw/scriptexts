MRM.facets = (() => {
  const paramFor = Object.freeze({ lang: "ep_filter_lang", category: "ep_filter_category", genre: "ep_filter_genre", tag: "ep_filter_post_tag", artist: "ep_filter_artist", pairing: "ep_filter_pairing", group: "ep_filter_group", status: "ep_filter_status" });
  let directory = {};
  const buildDirectory = (cards) => {
    const native = MRM.site.nativeFacets();
    const synthetic = MRM.site.syntheticFacets(cards);
    const cached = MRM.storage.getFacetCache() || {};
    directory = {};
    for (const type of Object.keys(MRM.site.facetPrefixes)) {
      const merged = new Map();
      for (const source of [cached[type] || [], synthetic[type] || [], native[type] || []]) for (const term of source) {
        const prior = merged.get(term.slug) || {};
        merged.set(term.slug, { ...prior, ...term, count: Math.max(prior.count || 0, term.count || 0) });
      }
      if (merged.size) directory[type] = [...merged.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }
    if (Object.keys(native).length) MRM.storage.setFacetCache(directory);
    return directory;
  };
  const activeFor = (mode, type) => MRM.storage.preferences.filters[mode]?.[type] || [];
  const setActive = (mode, type, values) => {
    const filters = structuredClone(MRM.storage.preferences.filters);
    filters[mode] ||= {};
    if (values.length) filters[mode][type] = values;
    else delete filters[mode][type];
    MRM.storage.replaceFilters(filters);
  };
  const toggle = (mode, type, slug) => {
    const current = new Set(activeFor(mode, type));
    current.has(slug) ? current.delete(slug) : current.add(slug);
    const otherMode = mode === "include" ? "exclude" : "include";
    const other = new Set(activeFor(otherMode, type));
    other.delete(slug);
    const filters = structuredClone(MRM.storage.preferences.filters);
    filters[mode] ||= {}; filters[otherMode] ||= {};
    current.size ? filters[mode][type] = [...current] : delete filters[mode][type];
    other.size ? filters[otherMode][type] = [...other] : delete filters[otherMode][type];
    MRM.storage.replaceFilters(filters);
  };
  const matches = (card, filters) => {
    for (const [type, values] of Object.entries(filters.include || {})) {
      if (!values.length) continue;
      const cardValues = new Set(card.taxonomies[type] || []);
      if (!values.some((value) => cardValues.has(value))) return false;
    }
    for (const [type, values] of Object.entries(filters.exclude || {})) {
      if (!values.length) continue;
      const cardValues = new Set(card.taxonomies[type] || []);
      if (values.some((value) => cardValues.has(value))) return false;
    }
    return true;
  };
  const nativeSortValue = () => {
    const url = new URL(location.href);
    return url.searchParams.get("ep_sort") || MRM.util.q("#ep-sort")?.value || "";
  };
  const nativeApplyUrl = (filters = MRM.storage.preferences.filters, sortValue = nativeSortValue()) => {
    if (MRM.runtime.page !== "search") return "";
    const url = new URL(location.href);
    for (const [type, parameter] of Object.entries(paramFor)) {
      url.searchParams.delete(parameter);
      const included = filters.include?.[type] || [];
      if (included.length) url.searchParams.set(parameter, included.join(","));
    }
    if (sortValue) url.searchParams.set("ep_sort", sortValue);
    else url.searchParams.delete("ep_sort");
    return url.href;
  };
  const applyNative = (sortValue = nativeSortValue()) => {
    const target = nativeApplyUrl(MRM.storage.preferences.filters, sortValue);
    if (target && target !== location.href) location.assign(target);
  };
  const syncFromUrl = () => {
    if (MRM.runtime.page !== "search") return;
    const url = new URL(location.href);
    const filters = structuredClone(MRM.storage.preferences.filters);
    filters.include ||= {};
    let changed = false;
    for (const [type, parameter] of Object.entries(paramFor)) {
      const values = (url.searchParams.get(parameter) || "").split(",").map((value) => value.trim()).filter(Boolean);
      const prior = filters.include[type] || [];
      if (JSON.stringify(values) !== JSON.stringify(prior)) changed = true;
      if (values.length) filters.include[type] = values;
      else delete filters.include[type];
    }
    if (changed) MRM.storage.replaceFilters(filters);
  };
  const clear = () => {
    const filters = structuredClone(MRM.storage.preferences.filters);
    filters.include = {}; filters.exclude = {};
    MRM.storage.replaceFilters(filters);
  };
  return { paramFor, buildDirectory, get directory() { return directory; }, activeFor, setActive, toggle, matches, nativeSortValue, nativeApplyUrl, applyNative, syncFromUrl, clear };
})();
