MRM.site = (() => {
  const facetPrefixes = Object.freeze({
    lang: "Language",
    category: "Category",
    genre: "Genre",
    tag: "Tag",
    artist: "Artist",
    pairing: "Pairing",
    group: "Group",
    status: "Status",
  });
  const ignoredClasses = new Set(["status-publish"]);
  const detectPage = (doc = document) => {
    const body = doc.body;
    if (!body) return "unknown";
    if (body.matches(".single-post, .wp-singular") || MRM.util.q(MRM.selectors.mangaImages, doc)) return "post";
    if (body.matches(".search, .search-results") || MRM.util.q(MRM.selectors.nativeFacets, doc)) return "search";
    if (MRM.util.qa(MRM.selectors.archiveCards, doc).length) return "archive";
    return "unknown";
  };
  const taxonomiesFromClasses = (article) => {
    const result = {};
    for (const className of article.classList) {
      const index = className.indexOf("-");
      if (index < 1) continue;
      const prefix = className.slice(0, index);
      const value = className.slice(index + 1);
      if (!facetPrefixes[prefix] || !value || ignoredClasses.has(className) || /^\d+$/.test(value)) continue;
      if (!result[prefix]) result[prefix] = [];
      result[prefix].push(value);
    }
    for (const values of Object.values(result)) values.sort();
    return result;
  };
  const parseCard = (article, order) => {
    const link = MRM.util.q(MRM.selectors.titleLink, article) || MRM.util.q("a[href]", article);
    if (!link) return null;
    const url = MRM.util.canonicalUrl(link.href);
    if (!url || new URL(url).hostname !== location.hostname) return null;
    const title = MRM.util.text(link.textContent || article.getAttribute("aria-label"));
    const taxonomies = taxonomiesFromClasses(article);
    const image = MRM.util.q(MRM.selectors.coverImage, article);
    const haystack = MRM.util.normalize([title, ...Object.values(taxonomies).flat().map(MRM.util.slugLabel)].join(" "));
    return { article, link, image, url, title, order, taxonomies, haystack, isEnglish: taxonomies.lang?.includes("english") || /\[eng(?:lish)?\]/i.test(title) };
  };
  const collectCards = (root = document) => MRM.util.qa(MRM.selectors.archiveCards, root)
    .filter((article) => !article.closest(".yarpp-related, .related-posts, #comments"))
    .map(parseCard)
    .filter(Boolean);
  const nativeFacets = (doc = document) => {
    const groups = {};
    for (const widget of MRM.util.qa(MRM.selectors.nativeFacets, doc)) {
      const rawTitle = MRM.util.text(MRM.util.q(MRM.selectors.nativeFacetTitle, widget)?.textContent).toLocaleLowerCase();
      let type = Object.keys(facetPrefixes).find((prefix) => rawTitle.includes(prefix));
      if (rawTitle.includes("circle") || rawTitle.includes("artist")) type = "artist";
      if (!type) continue;
      const terms = MRM.util.qa(MRM.selectors.nativeFacetTerm, widget).map((term) => {
        const anchor = MRM.util.q("a[href]", term);
        const countText = MRM.util.text(MRM.util.q("span", term)?.textContent).replace(/[^\d]/g, "");
        return {
          slug: term.dataset.termSlug,
          name: term.dataset.termName || MRM.util.text(anchor?.childNodes?.[1]?.textContent || anchor?.textContent).replace(/\(\d+\)$/, "").trim(),
          count: Number(countText) || 0,
          href: anchor?.href || "",
        };
      }).filter((term) => term.slug);
      if (terms.length) groups[type] = terms;
    }
    return groups;
  };
  const syntheticFacets = (cards) => {
    const counts = {};
    for (const card of cards) for (const [type, values] of Object.entries(card.taxonomies)) {
      counts[type] ||= {};
      for (const value of values) counts[type][value] = (counts[type][value] || 0) + 1;
    }
    return Object.fromEntries(Object.entries(counts).map(([type, values]) => [type, Object.entries(values)
      .map(([slug, count]) => ({ slug, name: MRM.util.slugLabel(slug), count, href: "" }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))]));
  };
  const extractImages = (doc = document) => {
    const content = MRM.util.q(MRM.selectors.postContent, doc) || doc;
    const selectors = [
      MRM.selectors.mangaImages,
      ".entry-content img[data-src]",
      ".entry-content img[data-lazy-src]",
      ".entry-content picture img",
    ].join(",");
    const images = MRM.util.qa(selectors, content).map((img, index) => {
      const src = MRM.util.imageSource(img);
      const width = Number(img.getAttribute("width")) || img.naturalWidth || 0;
      const height = Number(img.getAttribute("height")) || img.naturalHeight || 0;
      const marker = MRM.util.normalize(`${img.className} ${img.alt} ${src}`);
      if (!src || /avatar|emoji|logo|icon|banner|advert|gravatar/.test(marker)) return null;
      if (width && height && width < 250 && height < 250) return null;
      return { src: new URL(src, doc.baseURI || location.href).href, alt: MRM.util.text(img.alt) || `Page ${index + 1}`, width, height };
    }).filter(Boolean);
    return MRM.util.unique(images, (item) => item.src);
  };
  const commentsCount = (doc = document) => {
    const candidates = MRM.util.qa(MRM.selectors.commentsCount, doc).map((node) => MRM.util.text(node.textContent));
    for (const candidate of candidates) {
      const match = candidate.match(/\d+/);
      if (match) return Number(match[0]);
    }
    return MRM.util.q(MRM.selectors.comments, doc) ? null : 0;
  };
  const adjacentLinks = (doc = document) => {
    const prev = MRM.util.q("a[rel~='prev'], .previous a, .pagination-previous a, .adjacent-entry-pagination .previous a", doc);
    const next = MRM.util.q("a[rel~='next'], .next a, .pagination-next a, .adjacent-entry-pagination .next a", doc);
    return { prev: prev?.href || "", next: next?.href || "" };
  };
  return { facetPrefixes, detectPage, taxonomiesFromClasses, parseCard, collectCards, nativeFacets, syntheticFacets, extractImages, commentsCount, adjacentLinks };
})();
