export function createMtsAdapter(deps) {
  const { parseMtsFiles, stableHash, cleanText, uniqueElements } = deps;
  return {
    id: 'mts',
    name: 'Mod The Sims',
    hosts: ['modthesims.info', 'www.modthesims.info'],
    detectPageType(doc = document, rawUrl = location.href) {
      if (this.isDetailUrl(rawUrl)) return 'detail';
      try {
        const url = new URL(rawUrl, location.href);
        if (/^\/$/.test(url.pathname)) return 'home';
        if (/\/(downloads|browse|search|tags?|showthread|f|forumdisplay)/i.test(url.pathname) || this.listingCards(doc).length) return 'listing';
      } catch (_) {}
      return this.listingCards(doc).length ? 'listing' : 'generic';
    },
    detailSelector: 'a[href*="/d/"], a[href*="download.php?t="]',
    isDetailUrl(rawUrl) {
      try {
        const url = new URL(rawUrl, location.href);
        return /^\/d\/\d+(?:\/|$)/.test(url.pathname) ||
          (url.pathname.endsWith('/download.php') && url.searchParams.has('t'));
      } catch { return false; }
    },
    modIdFromUrl(rawUrl) {
      const url = new URL(rawUrl, location.href);
      const match = url.pathname.match(/^\/d\/(\d+)/);
      return match?.[1] || url.searchParams.get('t') || stableHash(url.href);
    },
    normalizeDetailUrl(rawUrl) {
      return new URL(rawUrl, location.href).href;
    },
    listingCards(doc = document) {
      const candidates = [
        ...doc.querySelectorAll('li.smol-card-component, .smol-card-component, .downloadDetails, .download-card, article, .card')
      ];
      const cards = candidates
        .map(card => {
          // After the MTS UI rewrite, the clean card contains a .downloadDetails
          // body for compatibility. Do not wire that inner body as a second card,
          // or it gets a second + Basket button.
          const rendered = card.closest?.('.sccb-rendered-mts-card');
          if (rendered) return rendered;
          const native = card.closest?.('li.smol-card-component, .smol-card-component, .download-card, article.card, .card') || card;
          return native;
        });
      return uniqueElements(cards).filter(card => this.findModLink(card));
    },
    findModLink(root) {
      const links = [...root.querySelectorAll(this.detailSelector)].filter(a => this.isDetailUrl(a.href));
      return links.find(a => a.closest('.downloadtitle, .title, h2, h3')) ||
        links.find(a => cleanText(a.textContent)) || links[0] || null;
    },
    titleFromCard(card, link) {
      return cleanText(
        card.dataset.sccbTitle ||
        card.querySelector('.sccb-card-title, .downloadtitle, .download-title, .title, h2, h3')?.textContent ||
        link?.textContent ||
        link?.getAttribute('title') ||
        'Mod The Sims download'
      );
    },
    appendButton(card, button) {
      const target = card.querySelector('.sccb-rendered-card-actions, .downloadCardFooter, .downloadDetails, .buttons, .stats') || card;
      target.appendChild(button);
    },
    detailInsertTarget(doc = document) {
      return doc.querySelector('#sccb-mts-detail-actions') || doc.querySelector('#statistics_bar') || doc.querySelector('#actualtabs') || doc.querySelector('#scroll_files') || doc.querySelector('h1');
    },
    extractTitle(doc, pageUrl) {
      const title = cleanText(
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('h1')?.textContent ||
        doc.title ||
        new URL(pageUrl).pathname
      );
      return title.replace(/^Mod\s*The\s*Sims\s*-\s*/i, '').trim() || 'Mod The Sims download';
    },
    extractCreator(doc) {
      const ogAuthor = cleanText(doc.querySelector('meta[property="og:author"]')?.getAttribute('content'));
      if (ogAuthor) return ogAuthor;
      const maybe = cleanText(doc.querySelector('.creator, .downloaduser, a[href*="member.php"]')?.textContent);
      return maybe || '';
    },
    parseFiles(doc, pageUrl) {
      return parseMtsFiles(doc, pageUrl);
    },
    detectError(doc) {
      const text = cleanText(doc.body?.textContent || doc.documentElement.textContent || '').toLowerCase();
      if (/you must be logged in|login required|please log in/.test(text)) return 'Login may be required.';
      if (/adult|age gate|permission|not allowed|no permission/.test(text)) return 'A permission or age gate may be blocking the file list.';
      if (/removed|deleted|no longer available/.test(text)) return 'The download may have been removed.';
      return '';
    }
  };;
}
