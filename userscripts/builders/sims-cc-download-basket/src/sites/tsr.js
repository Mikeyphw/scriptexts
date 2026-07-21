export function createTsrAdapter(deps) {
  const { parseTsrFiles, stableHash, cleanText, uniqueElements } = deps;

  function parseItemData(node) {
    if (!node) return {};
    const raw = node.getAttribute('data-item') || node.dataset?.item || '';
    if (!raw) return {};
    try { return JSON.parse(raw); }
    catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = raw;
        return JSON.parse(textarea.value);
      } catch { return {}; }
    }
  }

  function categoryFromUrl(rawUrl) {
    try {
      const url = new URL(rawUrl, location.href);
      return url.pathname.match(/\/category\/([^/]+)/i)?.[1] || '';
    } catch { return ''; }
  }

  return {
    id: 'tsr',
    name: 'The Sims Resource',
    hosts: ['thesimsresource.com', 'www.thesimsresource.com'],
    detectPageType(doc = document, rawUrl = location.href) {
      if (this.isDetailUrl(rawUrl)) return 'detail';
      try {
        const url = new URL(rawUrl, location.href);
        if (/^\/$/.test(url.pathname)) return 'home';
        if (/\/(downloads|browse|category|search)/i.test(url.pathname) || this.listingCards(doc).length) return 'listing';
      } catch (_) {}
      return this.listingCards(doc).length ? 'listing' : 'generic';
    },
    detailSelector: 'a[href*="/downloads/details/"][href*="/id/"], a[href*="/downloads/"]',
    isDetailUrl(rawUrl) {
      try {
        const url = new URL(rawUrl, location.href);
        return /\/downloads\/details\//i.test(url.pathname) && /\/id\/\d+\/?$/i.test(url.pathname);
      } catch { return false; }
    },
    modIdFromUrl(rawUrl) {
      try {
        const url = new URL(rawUrl, location.href);
        return url.pathname.match(/\/id\/(\d+)\/?$/i)?.[1] ||
          url.pathname.match(/\/downloads\/(\d+)\/?$/i)?.[1] ||
          stableHash(url.href);
      } catch { return stableHash(rawUrl); }
    },
    normalizeDetailUrl(rawUrl) {
      return new URL(rawUrl, location.href).href;
    },
    listingCards(doc = document) {
      const rendered = [...doc.querySelectorAll('.sccb-rendered-tsr-card[data-sccb-tsr-rendered="1"]')];
      if (rendered.length) return uniqueElements(rendered).filter(card => this.findModLink(card));
      const candidates = [...doc.querySelectorAll('.item-wrapper[data-item], .browse-file .item-wrapper')]
        .filter(card => !card.closest('.sccb-rendered-tsr-card') && !card.classList.contains('sccb-tsr-native-card-hidden'));
      return uniqueElements(candidates).filter(card => this.findModLink(card));
    },
    findModLink(root) {
      const links = [...root.querySelectorAll('a[href*="/downloads/details/"][href*="/id/"]')]
        .filter(a => this.isDetailUrl(a.href));
      return links.find(a => a.closest('.browse-info-title, h1')) ||
        links.find(a => cleanText(a.textContent)) ||
        links[0] || null;
    },
    titleFromCard(card, link) {
      const data = parseItemData(card);
      return cleanText(
        card.dataset.sccbTitle ||
        data.title ||
        card.querySelector('.browse-info-title-info, h1, h2, h3')?.textContent ||
        link?.textContent ||
        'The Sims Resource download'
      );
    },
    appendButton(card, button) {
      const target = card.querySelector('.sccb-tsr-card-actions, .sccb-rendered-tsr-card-actions, .big-download-buttons, .download-button.download-now, .browse-info') || card;
      if (target.matches?.('.download-button.download-now')) target.insertAdjacentElement('afterend', button);
      else target.appendChild(button);
    },
    detailInsertTarget(doc = document) {
      return doc.querySelector('.sccb-tsr-detail-actions-slot, .sccb-rendered-tsr-card.sccb-tsr-detail-summary-card .sccb-rendered-tsr-card-actions, .big-download-buttons.main-download-buttons.details-page, .details-right-wrapper .big-download-buttons, .details-right-wrapper .browse-info, .detail-page h1, h1');
    },
    extractTitle(doc, pageUrl) {
      const item = parseItemData(doc.querySelector('.details-right-wrapper .item-wrapper[data-item], .detail-page .item-wrapper[data-item], .item-wrapper[data-item]'));
      const title = cleanText(
        item.title ||
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('h1, .browse-info-title-info')?.textContent ||
        doc.title ||
        new URL(pageUrl).pathname
      );
      return title.replace(/^The\s*Sims\s*Resource\s*\|\s*/i, '').trim() || 'The Sims Resource download';
    },
    extractCreator(doc) {
      const item = parseItemData(doc.querySelector('.details-right-wrapper .item-wrapper[data-item], .detail-page .item-wrapper[data-item], .item-wrapper[data-item]'));
      return cleanText(item.creator || item.creatorName || doc.querySelector('.big-creator, .artist-name a, .browse-info-creator .created-by')?.textContent || '').replace(/^By\s+/i, '');
    },
    parseFiles(doc, pageUrl) {
      return parseTsrFiles(doc, pageUrl);
    },
    detectError(doc) {
      const text = cleanText(doc.body?.textContent || doc.documentElement.textContent || '').toLowerCase();
      if (/need to login|login to download|verify your email/.test(text)) return 'Login or email verification may be required.';
      if (/vip subscription|vip members/.test(text)) return 'Some TSR actions may require VIP, but the regular download link was still captured when available.';
      if (/removed|deleted|unavailable/.test(text)) return 'The download may have been removed.';
      return '';
    },
    categoryFromUrl,
    parseItemData,
  };
}
