export function createSimblrAdapter(deps) {
  const { parseSimblrFiles, stableHash, cleanText, uniqueElements } = deps;
  return {
    id: 'simblr',
    name: 'Simblr.cc',
    hosts: ['simblr.cc', 'www.simblr.cc'],
    detectPageType(doc = document, rawUrl = location.href) {
      if (this.isDetailUrl(rawUrl)) return 'detail';
      try {
        const url = new URL(rawUrl, location.href);
        if (/^\/$|\/home/i.test(url.pathname)) return 'home';
        if (/\/ts\d+\/?$/i.test(url.pathname)) return 'hub';
        if (/\/(mods?|stories|wips?|tutorials|lookbooks|tag|search|ts\d+)/i.test(url.pathname) || this.listingCards(doc).length) return 'listing';
      } catch (_) {}
      return this.listingCards(doc).length ? 'listing' : 'generic';
    },
    detailSelector: 'a[href*="/ts3/mod/"], a[href*="/ts4/mod/"], a[href*="/ts2/mod/"], a[href*="/mod/"]',
    isDetailUrl(rawUrl) {
      try {
        const url = new URL(rawUrl, location.href);
        return /^\/ts\d+\/mod\/\d+[^/]*\.html$/i.test(url.pathname) || /^\/mod\/\d+[^/]*\.html$/i.test(url.pathname);
      } catch { return false; }
    },
    modIdFromUrl(rawUrl) {
      const url = new URL(rawUrl, location.href);
      const match = url.pathname.match(/\/mod\/(\d+)/i);
      return match?.[1] || stableHash(url.href);
    },
    normalizeDetailUrl(rawUrl) {
      return new URL(rawUrl, location.href).href;
    },
    listingCards(doc = document) {
      const candidates = [...doc.querySelectorAll('#sccb-simblr-app .sccb-rendered-simblr-card, .smol-card-component, .grid-card, article.card, .card')];
      return uniqueElements(candidates).filter(card => this.findModLink(card));
    },
    findModLink(root) {
      const links = [...root.querySelectorAll(this.detailSelector)].filter(a => this.isDetailUrl(a.href));
      return links.find(a => a.classList.contains('grid-card-title')) ||
        links.find(a => cleanText(a.textContent)) || links[0] || null;
    },
    titleFromCard(card, link) {
      return cleanText(card.querySelector('.grid-card-title, h2, h3, .card-title')?.textContent || link?.textContent || 'Simblr.cc download');
    },
    appendButton(card, button) {
      const renderedActions = card.querySelector('.sccb-rendered-simblr-card-actions');
      if (renderedActions) {
        renderedActions.querySelectorAll('.sccb-add, .sccb-card-button').forEach(existing => {
          if (existing !== button) existing.remove();
        });
        renderedActions.appendChild(button);
        return;
      }
      const target = card.querySelector('.card-body, .grid-card-body, .grid-card-title')?.parentElement || card;
      target.querySelectorAll(':scope > .sccb-add, :scope > .sccb-card-button').forEach(existing => existing.remove());
      target.appendChild(button);
    },
    detailInsertTarget(doc = document) {
      return doc.querySelector('#sccb-simblr-detail-actions') ||
        doc.querySelector('a.downloadlink')?.closest('p, div, section') ||
        doc.querySelector('h1, .display-5, .display-6');
    },
    extractTitle(doc, pageUrl) {
      const title = cleanText(
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('h1, .display-5, .display-6')?.textContent ||
        doc.title ||
        new URL(pageUrl).pathname
      );
      return title.replace(/^Simblr\.cc\s*-\s*/i, '').trim() || 'Simblr.cc download';
    },
    extractCreator(doc) {
      const text = cleanText(doc.querySelector('.author, .creator, a[href*="/profile/"], a[href*="/user/"]')?.textContent);
      return text || '';
    },
    parseFiles(doc, pageUrl) {
      return parseSimblrFiles(doc, pageUrl);
    },
    detectError(doc) {
      const text = cleanText(doc.body?.textContent || doc.documentElement.textContent || '').toLowerCase();
      if (/login|required|permission|not allowed/.test(text)) return 'Login or permission may be required.';
      if (/removed|deleted|unavailable/.test(text)) return 'The download may have been removed.';
      return '';
    }
  };;
}
