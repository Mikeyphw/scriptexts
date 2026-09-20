function installContentSiteModernizer(profile, cssText) {
  if (!profile || document.documentElement.classList.contains('csm-modernized')) return;

  const d = document;
  const storage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(`${profile.storagePrefix}:${key}`);
        return value == null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(`${profile.storagePrefix}:${key}`, JSON.stringify(value)); } catch {}
    }
  };

  const saved = new Set(storage.get('saved', []));
  const viewed = new Set(storage.get('viewed', []));
  const perf = profile.performance || {};
  const feedState = { mode: 'all', query: '', version: 0, reason: 'initial' };
  const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
  let activeDrawerTrigger = null;
  const $$ = (sel, root = d) => {
    try { return Array.from(root.querySelectorAll(sel)); } catch { return []; }
  };
  const selectorList = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((x) => x.trim()).filter(Boolean);
  const first = (selectors, root = d) => selectorList(selectors).flatMap((sel) => $$(sel, root)).find(Boolean);
  const slugClass = `csm-site-${String(profile.id || 'content-site').replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}`;
  const pageTualSelector = '.pagetual_pageBar,.autopagerize_page_info,#pagetual-sideController,[id^="pagetual_pageBar"],[id^="pagetual-sideController"],[name^="pagetual-iframe"],iframe[name^="pagetual-iframe"]';
  const isPageTualNode = (node) => node instanceof Element && (node.matches?.(pageTualSelector) || !!node.closest?.(pageTualSelector));
  const absolutePath = (href) => {
    try {
      const url = new URL(href, location.href);
      return url.origin === location.origin ? url.pathname : url.href;
    } catch {
      return href || location.href;
    }
  };
  const idFor = (node) => absolutePath(node.querySelector('a[href]')?.href || location.href);
  const matchesArticleHint = (hint) => {
    if (hint.startsWith('body.')) return d.body.classList.contains(hint.slice(5));
    if (hint.startsWith('path:')) return new RegExp(hint.slice(5)).test(location.pathname);
    return !!d.querySelector(hint);
  };
  const articleEvidenceScore = () => (profile.articleEvidence || []).reduce((score, selector) =>
    score + (d.querySelector(selector) ? 1 : 0), 0);
  const isArticlePage = () => {
    const evidence = profile.articleEvidence || [];
    return csmArticleDecision({
      hintMatched: Boolean(profile.articleHints?.some(matchesArticleHint)),
      evidenceScore: articleEvidenceScore(),
      evidenceCount: evidence.length,
      evidenceMin: profile.articleEvidenceMin || 2
    });
  };

  function currentInteractionProfile() {
    const mediaMatches = (query) => {
      try { return typeof matchMedia === 'function' && matchMedia(query).matches; } catch { return false; }
    };
    return csmInteractionProfile({
      userAgent: navigator.userAgent || '',
      coarsePointer: mediaMatches('(pointer: coarse)'),
      anyCoarsePointer: mediaMatches('(any-pointer: coarse)'),
      maxTouchPoints: navigator.maxTouchPoints || 0,
      width: innerWidth,
      breakpoint: profile.layout?.mobileBreakpoint || 760
    });
  }

  function syncInteractionProfile() {
    const state = currentInteractionProfile();
    for (const node of [d.documentElement, d.body]) {
      node.classList.toggle('csm-mobile-profile', state.mobile);
      node.classList.toggle('csm-coarse-pointer', state.coarse);
    }
  }

  function installInteractionProfile() {
    syncInteractionProfile();
    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; syncInteractionProfile(); });
    };
    addEventListener('resize', schedule, { passive: true });
    addEventListener('orientationchange', schedule, { passive: true });
    for (const query of ['(pointer: coarse)', '(any-pointer: coarse)']) {
      try {
        const media = matchMedia(query);
        media.addEventListener?.('change', schedule);
      } catch {}
    }
  }

  function injectCss(articleMode) {
    const style = d.createElement('style');
    style.id = 'csm-style';
    style.textContent = cssText;
    d.head.append(style);
    d.documentElement.classList.add('csm-modernized', slugClass, articleMode ? 'csm-article-mode' : 'csm-feed-mode');
    d.body.classList.add('csm-modernized-body', slugClass, articleMode ? 'csm-article-mode' : 'csm-feed-mode');
    if (perf.lowResource) {
      d.documentElement.classList.add('csm-low-resource');
      d.body.classList.add('csm-low-resource');
    }
    d.documentElement.style.setProperty('--csm-max', `${profile.layout?.desktopMaxWidth || 1360}px`);
    d.documentElement.style.setProperty('--csm-article-width', `${profile.layout?.articleMaxWidth || 790}px`);
    d.documentElement.style.setProperty('--csm-card-ratio', profile.layout?.cardImageRatio || '16 / 9');
    d.documentElement.style.setProperty('--csm-card-fit', profile.layout?.cardImageFit || profile.layout?.imageFit || 'cover');
  }

  function hideNodes(selectors, root = d) {
    for (const sel of selectorList(selectors)) {
      for (const node of $$(sel, root)) {
        if (node.closest?.('.csm-topbar,.csm-drawer,.csm-bottomnav') || isPageTualNode(node)) continue;
        node.classList.add('csm-source-hidden');
      }
    }
  }

  function hideAds(root = d) {
    hideNodes(profile.selectors?.ads || [], root);
  }

  function installSourceCleanup(articleMode) {
    if (profile.layout?.hideSidebars) hideNodes(profile.selectors?.page?.sidebar || 'aside,.sidebar,#secondary,.widget-area,[class*="sidebar"]');
    if (profile.layout?.hideOriginalChrome) {
      hideNodes(profile.selectors?.page?.header || 'header,#masthead,.site-header,.header,.top-bar,.topbar,.ticker,[class*="breaking"]');
      hideNodes(profile.selectors?.page?.nav || 'nav,.main-navigation,.site-navigation,.menu,.navbar');
    }
    if (articleMode && profile.layout?.hideArticleSidebars !== false) {
      hideNodes(profile.selectors?.page?.sidebar || 'aside,.sidebar,#secondary,.widget-area,[class*="sidebar"]');
    }
  }

  function makeButton(label, action, attrs = {}) {
    const btn = d.createElement('button');
    btn.type = 'button';
    btn.className = 'csm-btn';
    btn.textContent = label;
    btn.dataset.action = action;
    btn.setAttribute('aria-label', attrs['aria-label'] || label);
    if (action.startsWith('open-')) {
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-controls', 'csm-drawer');
    }
    for (const [key, value] of Object.entries(attrs)) btn.setAttribute(key, value);
    btn.addEventListener('click', () => runAction(action));
    return btn;
  }

  function installTopbar(articleMode) {
    const bar = d.createElement('header');
    bar.className = 'csm-topbar';
    bar.innerHTML = `<a class="csm-brand" href="${profile.home || '/'}"><span class="csm-brand-mark">${profile.mark || '★'}</span><span class="csm-brand-text">${profile.shortName || profile.name}</span></a><div class="csm-actions"></div>`;
    const actions = bar.querySelector('.csm-actions');
    actions.append(makeButton('Browse', 'open-browse', { 'aria-expanded': 'false', 'data-desktop': 'true' }));
    actions.append(makeButton('Search', 'open-search', { 'aria-expanded': 'false' }));
    if (articleMode) actions.append(makeButton(saved.has(absolutePath(location.href)) ? 'Saved' : 'Save', 'toggle-save', { 'aria-pressed': String(saved.has(absolutePath(location.href))) }));
    actions.append(makeButton('More', 'open-settings', { 'aria-expanded': 'false' }));
    d.body.prepend(bar);
  }

  function installNewsTicker(articleMode) {
    if (articleMode) return;
    const selector = profile.selectors?.feed?.breaking || '';
    const source = first(selector);
    if (!(source instanceof HTMLElement)) return;
    const links = Array.from(source.querySelectorAll('a[href]'))
      .filter((link) => !link.closest?.('.csm-topbar,.csm-drawer,.csm-bottomnav'))
      .map((link) => ({ href: link.href, text: (link.textContent || '').replace(/\s+/g, ' ').trim() }))
      .filter((item) => item.text);
    const sourceText = (source.textContent || '').replace(/\s+/g, ' ').trim();
    if (!links.length && !sourceText) return;

    const ticker = d.createElement('nav');
    ticker.className = 'csm-news-ticker';
    ticker.setAttribute('aria-label', 'Breaking news');
    const label = d.createElement('span');
    label.className = 'csm-news-ticker-label';
    label.textContent = 'Breaking';
    ticker.append(label);
    const seen = new Set();
    const items = links.length ? links : [{ href: '', text: sourceText.replace(/^Breaking:?\s*/i, '') }];
    for (const item of items.slice(0, 6)) {
      const text = item.text.replace(/^Breaking:?\s*/i, '').trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const node = item.href ? d.createElement('a') : d.createElement('span');
      if (item.href) node.href = item.href;
      node.className = 'csm-news-ticker-item';
      node.textContent = text;
      ticker.append(node);
    }
    if (ticker.children.length <= 1) return;
    source.classList.add('csm-source-hidden');
    const topbar = first('.csm-topbar');
    if (topbar) topbar.after(ticker); else d.body.prepend(ticker);
  }

  function installProgress(articleMode) {
    if (!articleMode) return;
    const p = d.createElement('div');
    p.className = 'csm-progress';
    p.setAttribute('role', 'progressbar');
    p.setAttribute('aria-label', 'Reading progress');
    p.setAttribute('aria-valuemin', '0');
    p.setAttribute('aria-valuemax', '100');
    d.body.append(p);
    let progressFrame = 0;
    const updateNow = () => {
      progressFrame = 0;
      const max = Math.max(1, d.documentElement.scrollHeight - innerHeight);
      const value = Math.max(0, Math.min(100, Math.round((scrollY / max) * 100)));
      p.style.transform = `scaleX(${value / 100})`;
      p.setAttribute('aria-valuenow', String(value));
    };
    const update = () => {
      if (progressFrame) return;
      progressFrame = requestAnimationFrame(updateNow);
    };
    addEventListener('scroll', update, { passive: true });
    updateNow();
  }

  function installDrawer() {
    const backdrop = d.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'csm-drawer-backdrop';
    backdrop.setAttribute('aria-label', 'Close panel');
    backdrop.addEventListener('click', closeDrawer);
    const drawer = d.createElement('aside');
    drawer.className = 'csm-drawer';
    drawer.id = 'csm-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('tabindex', '-1');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'csm-drawer-title');
    drawer.setAttribute('aria-describedby', 'csm-drawer-description');
    drawer.innerHTML = `<h2 id="csm-drawer-title">${profile.shortName || profile.name}</h2><p id="csm-drawer-description" class="csm-sr-only">Use Tab to move through panel controls. Press Escape to close this panel.</p><div class="csm-drawer-grid" data-drawer-content></div>`;
    d.body.append(backdrop, drawer);
  }

  function openDrawer(kind) {
    const drawer = d.querySelector('.csm-drawer');
    const content = drawer.querySelector('[data-drawer-content]');
    const title = drawer.querySelector('h2');
    const navItems = kind === 'search' ? [] : (profile.nav?.primary || []);
    title.textContent = kind === 'search' ? 'Search loaded stories' : kind === 'settings' ? 'Display' : 'Browse';
    if (kind === 'search') {
      content.innerHTML = `<label class="csm-sr-only" for="csm-drawer-search">Filter loaded stories</label><input id="csm-drawer-search" type="search" placeholder="Filter loaded stories on this page" aria-label="Filter loaded stories"><button class="csm-btn" type="button" data-site-search aria-label="Open site search for current filter">Open site search</button><button class="csm-btn" type="button" data-show-all aria-label="Show all loaded stories">Show all loaded</button>`;
      const input = content.querySelector('input');
      input.value = feedState.mode === 'search' ? feedState.query : '';
      input.addEventListener('input', () => filterCards(input.value));
      content.querySelector('[data-site-search]').addEventListener('click', () => {
        const q = encodeURIComponent(input.value.trim());
        if (q) location.href = `${profile.searchPath || '/?s='}${q}`;
      });
      content.querySelector('[data-show-all]').addEventListener('click', showAllCards);
      setTimeout(() => input.focus(), 30);
    } else if (kind === 'settings') {
      content.innerHTML = `<button class="csm-btn" type="button" data-clear-viewed>Clear viewed</button><button class="csm-btn" type="button" data-clear-saved>Clear saved</button><button class="csm-btn" type="button" data-show-all>Show all loaded</button><p style="color:var(--csm-muted);margin:.4rem 0 0">Saved and viewed state stays in this browser.</p>`;
      content.querySelector('[data-clear-viewed]').addEventListener('click', () => { if (!confirm('Clear viewed history for this site?')) return; viewed.clear(); storage.set('viewed', []); refreshStates(); toast('Viewed history cleared'); });
      content.querySelector('[data-clear-saved]').addEventListener('click', () => { if (!confirm('Clear saved posts for this site?')) return; saved.clear(); storage.set('saved', []); refreshStates(); reconcileFeed({ reason: 'saved-cleared' }); toast('Saved posts cleared'); });
      content.querySelector('[data-show-all]').addEventListener('click', showAllCards);
    } else {
      content.innerHTML = navItems.map((item) => `<a class="csm-chip" href="${item.href}">${item.label}</a>`).join('') || '<p>No sections found.</p>';
    }
    activeDrawerTrigger = d.activeElement instanceof HTMLElement ? d.activeElement : null;
    drawer.setAttribute('aria-hidden', 'false');
    d.documentElement.classList.add('csm-drawer-open');
    d.querySelector('.csm-drawer-backdrop').dataset.open = 'true';
    const expandedAction = `open-${kind}`;
    for (const btn of $$('[data-action^="open-"]')) btn.setAttribute('aria-expanded', String(btn.dataset.action === expandedAction));
    const focusTarget = drawer.querySelector('input,button,a,summary,[tabindex]:not([tabindex="-1"])') || drawer;
    setTimeout(() => focusTarget.focus({ preventScroll: true }), 30);
  }

  function closeDrawer({ restoreFocus = true } = {}) {
    const drawer = d.querySelector('.csm-drawer');
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
    d.documentElement.classList.remove('csm-drawer-open');
    const backdrop = d.querySelector('.csm-drawer-backdrop');
    if (backdrop) backdrop.dataset.open = 'false';
    for (const btn of $$('[data-action^="open-"]')) btn.setAttribute('aria-expanded', 'false');
    if (restoreFocus && activeDrawerTrigger?.isConnected) activeDrawerTrigger.focus({ preventScroll: true });
    activeDrawerTrigger = null;
  }

  function trapDrawerFocus(event) {
    const drawer = d.querySelector('.csm-drawer[aria-hidden="false"]');
    if (!drawer) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); return; }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(drawer.querySelectorAll(focusableSelector)).filter((node) => node instanceof HTMLElement && node.offsetParent !== null);
    if (!focusable.length) { event.preventDefault(); drawer.focus({ preventScroll: true }); return; }
    const firstNode = focusable[0];
    const lastNode = focusable[focusable.length - 1];
    if (event.shiftKey && d.activeElement === firstNode) { event.preventDefault(); lastNode.focus({ preventScroll: true }); }
    else if (!event.shiftKey && d.activeElement === lastNode) { event.preventDefault(); firstNode.focus({ preventScroll: true }); }
  }

  function toast(message) {
    let node = d.querySelector('.csm-toast');
    if (!node) {
      node = d.createElement('div');
      node.className = 'csm-toast';
      node.setAttribute('role', 'status');
      node.style.cssText = 'position:fixed;left:50%;bottom:6rem;transform:translateX(-50%);z-index:2147481003;background:#1a2029;color:#fff;padding:.75rem 1rem;border-radius:999px;font-weight:750;box-shadow:0 10px 40px rgba(0,0,0,.35)';
      d.body.append(node);
    }
    node.textContent = message;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.remove(), 4200);
  }

  function installBottomNav(articleMode) {
    const nav = d.createElement('nav');
    nav.className = 'csm-bottomnav';
    nav.setAttribute('aria-label', articleMode ? 'Article actions' : 'Page actions');
    const items = articleMode ? profile.nav?.articleBottom : profile.nav?.bottom;
    for (const item of items || []) {
      const btn = d.createElement('button');
      btn.type = 'button';
      btn.textContent = item.label;
      btn.dataset.action = item.action;
      btn.setAttribute('aria-label', item.ariaLabel || item.label);
      if (String(item.action || '').startsWith('open-')) {
        btn.setAttribute('aria-haspopup', 'dialog');
        btn.setAttribute('aria-controls', 'csm-drawer');
        btn.setAttribute('aria-expanded', 'false');
      }
      if (item.id === 'home' && location.pathname === '/') btn.setAttribute('aria-current', 'page');
      btn.addEventListener('click', () => runAction(item.action));
      nav.append(btn);
    }
    d.body.append(nav);
  }

  function runAction(action) {
    if (action === 'go-home') location.href = profile.home || '/';
    else if (action === 'open-browse') openDrawer('browse');
    else if (action === 'open-search') openDrawer('search');
    else if (action === 'open-settings') openDrawer('settings');
    else if (action === 'filter-saved') filterSaved();
    else if (action === 'show-all') showAllCards();
    else if (action === 'history-back') history.length > 1 ? history.back() : location.assign(profile.home || '/');
    else if (action === 'toggle-save') toggleSave(location.href, true);
    else if (action === 'copy-link') {
      const href = location.href;
      navigator.clipboard?.writeText(href).then(() => toast('Link copied')).catch(() => {
        prompt('Copy link', href);
      });
    }
    else if (action === 'jump-comments') (first(profile.selectors?.article?.comments || '#comments,.comments-area') || d.querySelector('#comments'))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (action === 'scroll-top') scrollTo({ top: 0, behavior: 'smooth' });
  }

  function feedRoots() {
    const hasPageTualCandidate = (node) => node instanceof HTMLElement && !!node.querySelector?.('[data-csm-page-tual-candidate="1"],[data-csm-pagetual-candidate="1"]');
    const explicitRoot = perf.feedRootSelector ? first(perf.feedRootSelector) : null;
    if (explicitRoot instanceof HTMLElement && (!isExcluded(explicitRoot) || hasPageTualCandidate(explicitRoot))) return [explicitRoot];
    const roots = selectorList(profile.selectors?.feed?.containers || profile.selectors?.page?.main || 'main,#main,.site-main')
      .flatMap((sel) => $$(sel))
      .filter((node) => node instanceof HTMLElement && (!isExcluded(node) || hasPageTualCandidate(node)));
    return roots.length ? [...new Set(roots)] : [d.body];
  }

  function isExcluded(node) {
    if (isPageTualNode(node)) return true;
    const excludes = selectorList(profile.selectors?.feed?.exclude || '');
    return excludes.some((sel) => node.matches?.(sel) || node.closest?.(sel));
  }

  function imageSourceFor(img) {
    if (!(img instanceof HTMLImageElement)) return '';
    const attrs = [
      img.currentSrc,
      img.getAttribute('src'),
      img.getAttribute('data-src'),
      img.getAttribute('data-lazy-src'),
      img.getAttribute('data-original'),
      img.getAttribute('data-orig-file'),
      img.getAttribute('srcset'),
      img.getAttribute('data-srcset')
    ];
    return attrs.find((value) => value && !/^data:image\/(?:gif|svg\+xml);/i.test(String(value))) || '';
  }

  function findCardImage(node) {
    const images = Array.from(node.querySelectorAll('img'));
    return images.find((img) => {
      const src = imageSourceFor(img);
      const alt = (img.getAttribute('alt') || '').trim();
      return !!src && !/spacer|blank|placeholder|pixel|avatar|logo|tracking/i.test(src + ' ' + alt);
    }) || null;
  }

  function titleTextFor(node, link) {
    const titleNode = first(profile.selectors?.feed?.title || 'h1,h2,h3,.entry-title,.post-title,.title', node) || link;
    return (titleNode?.textContent || link?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function summaryTextFor(node, title = '') {
    const selectors = profile.selectors?.feed?.summary || '';
    if (!selectors) return '';
    const candidates = selectorList(selectors)
      .flatMap((sel) => $$(sel, node))
      .map((candidate) => (candidate.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const titleNorm = title.replace(/\s+/g, ' ').trim().toLowerCase();
    return candidates.find((text) => {
      const normalized = text.toLowerCase();
      return normalized && normalized !== titleNorm && normalized.length >= 18;
    }) || '';
  }

  function selectCardNodes(nodes, seenLinks = new Set(), options = {}) {
    const seen = new Set();
    const limit = Number(options.limit ?? perf.maxFeedCards ?? profile.layout?.maxFeedCards ?? 0);
    const selected = [];
    const requireImage = profile.layout?.requireCardImage === true;
    const isMarkedPageTualCandidate = (node) => node instanceof HTMLElement && (node.dataset.csmPageTualCandidate === '1' || !!node.closest?.('[data-csm-page-tual-candidate="1"],[data-csm-pagetual-candidate="1"]'));
    const allowHiddenSourceFor = (node) => options.allowHiddenSource === true || isMarkedPageTualCandidate(node);
    for (const node of nodes) {
      if (!(node instanceof HTMLElement) || seen.has(node)) continue;
      seen.add(node);
      if (node.dataset.csmCard) continue;
      if (node.closest('.csm-topbar,.csm-drawer,.csm-bottomnav') || isPageTualNode(node)) continue;
      if (!allowHiddenSourceFor(node) && isExcluded(node)) continue;
      const link = node.querySelector('a[href]');
      if (!link) continue;
      const hrefKey = absolutePath(link.href);
      if (seenLinks.has(hrefKey)) continue;
      const text = titleTextFor(node, link);
      if (text.length < (profile.layout?.minCardTextLength || 18)) continue;
      if (requireImage && !findCardImage(node)) continue;
      seenLinks.add(hrefKey);
      selected.push(node);
      if (limit > 0 && selected.length >= limit) break;
    }
    return selected;
  }

  function cardCandidates() {
    const selectors = selectorList(profile.selectors?.feed?.items || 'article');
    const nodes = [];
    for (const root of feedRoots()) {
      for (const sel of selectors) nodes.push(...$$(sel, root));
    }
    return selectCardNodes(nodes);
  }

  function primaryMain(items) {
    const roots = feedRoots();
    const best = roots.find((root) => items.some((item) => root.contains(item)));
    return best || first(profile.selectors?.page?.main || 'main,#main,.site-main') || items[0]?.parentElement || d.body;
  }

  function sectionKeyFor(title, index = 0) {
    const key = String(title || 'Section').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return key || `section-${index + 1}`;
  }

  function sectionTitleFor(section) {
    const titleNode = first(profile.selectors?.feed?.sectionTitle || '.widget-title,.widget-head,h1,h2,h3', section);
    return (titleNode?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isExcludedSectionTitle(title) {
    const text = String(title || '').trim();
    return (profile.selectors?.feed?.excludeSectionTitles || []).some((value) => {
      if (value instanceof RegExp) return value.test(text);
      const raw = String(value || '').trim();
      if (raw.startsWith('/') && raw.lastIndexOf('/') > 0) {
        const last = raw.lastIndexOf('/');
        try { return new RegExp(raw.slice(1, last), raw.slice(last + 1)).test(text); } catch {}
      }
      return text.toLowerCase() === raw.toLowerCase();
    });
  }

  function hideSourceSection(section) {
    const source = section.closest?.('.widget-box,.wpd-posted-links,section,article,div') || section;
    source.classList.add('csm-source-hidden', 'csm-excluded-feed-section');
  }

  function sectionedFeedCandidates() {
    const sections = [];
    const seenLinks = new Set();
    const featuredSelectors = selectorList(profile.selectors?.feed?.featuredItems || '');
    if (featuredSelectors.length) {
      const featuredNodes = [];
      for (const root of feedRoots()) for (const sel of featuredSelectors) featuredNodes.push(...$$(sel, root));
      const featuredItems = selectCardNodes(featuredNodes, seenLinks, { allowHiddenSource: true });
      if (featuredItems.length) sections.push({ key: 'featured', title: profile.selectors?.feed?.featuredTitle || 'Featured', items: featuredItems });
    }

    const sectionSelectors = selectorList(profile.selectors?.feed?.sections || '');
    const itemSelectors = selectorList(profile.selectors?.feed?.sectionItems || profile.selectors?.feed?.items || 'article');
    let sectionIndex = 0;
    for (const root of feedRoots()) {
      for (const sel of sectionSelectors) {
        for (const section of $$(sel, root)) {
          if (!(section instanceof HTMLElement) || section.closest('.csm-topbar,.csm-drawer,.csm-bottomnav') || isPageTualNode(section)) continue;
          const title = sectionTitleFor(section) || `Section ${sectionIndex + 1}`;
          if (isExcludedSectionTitle(title)) {
            hideSourceSection(section);
            continue;
          }
          const nodes = [];
          for (const itemSel of itemSelectors) nodes.push(...$$(itemSel, section));
          const items = selectCardNodes(nodes, seenLinks, { allowHiddenSource: true });
          if (!items.length) continue;
          sections.push({ key: sectionKeyFor(title, sectionIndex), title, items });
          sectionIndex += 1;
        }
      }
    }
    return sections;
  }

  function ensureSectionedFeed(sections, main) {
    main.classList.add('csm-layout', 'csm-layout-sectioned');
    let wrap = main.querySelector(':scope > .csm-feed-sections');
    if (!wrap) {
      wrap = d.createElement('div');
      wrap.className = 'csm-feed-sections';
      main.prepend(wrap);
    }

    const grids = [];
    for (const [index, section] of sections.entries()) {
      const key = section.key || sectionKeyFor(section.title, index);
      let shell = wrap.querySelector(`:scope > .csm-feed-section[data-csm-section-key="${CSS.escape(key)}"]`);
      if (!shell) {
        shell = d.createElement('section');
        shell.className = 'csm-feed-section';
        shell.dataset.csmSectionKey = key;
        shell.innerHTML = '<h2 class="csm-feed-section-title"></h2><div class="csm-feed-grid"></div>';
        wrap.append(shell);
      }
      const title = shell.querySelector('.csm-feed-section-title');
      title.textContent = section.title || 'Stories';
      const grid = shell.querySelector('.csm-feed-grid');
      grid.setAttribute('aria-label', section.title || 'Stories');
      for (const item of section.items) grid.append(item);
      grids.push(grid);
    }

    const hideRemainder = profile.layout?.hideFeedRemainder === true;
    for (const child of Array.from(main.children)) {
      if (child === wrap || child.classList.contains('csm-section-title') || child.classList.contains('csm-pagination')) continue;
      if (hideRemainder || (!child.querySelector?.('a[href],img,video,iframe') && !child.textContent.trim())) child.classList.add('csm-source-hidden');
    }
    return { wrap, grids };
  }

  function ensureFeedGrid(items, main) {
    main.classList.add('csm-layout');
    const rebuild = profile.layout?.rebuildFeedGrid !== false;
    if (!rebuild) {
      const parent = items[0]?.parentElement;
      if (parent && items.every((item) => item.parentElement === parent)) parent.classList.add('csm-feed-grid');
      return parent || main;
    }
    let grid = main.querySelector(':scope > .csm-feed-grid');
    if (!grid) {
      grid = d.createElement('section');
      grid.className = 'csm-feed-grid';
      grid.setAttribute('aria-label', 'Stories');
      main.prepend(grid);
    }
    for (const item of items) grid.append(item);
    const hideRemainder = profile.layout?.hideFeedRemainder === true;
    for (const child of Array.from(main.children)) {
      if (child === grid || child.classList.contains('csm-section-title') || child.classList.contains('csm-load-more') || child.classList.contains('csm-pagination')) continue;
      if (hideRemainder || (!child.querySelector?.('a[href],img,video,iframe') && !child.textContent.trim())) child.classList.add('csm-source-hidden');
    }
    return grid;
  }

  function feedCards(grid) {
    return Array.from(grid.querySelectorAll(':scope > .csm-card'));
  }

  function currentFeedLinkSet() {
    return new Set($$('.csm-card a[href]').map((link) => absolutePath(link.href)));
  }

  function gridInitialCount() {
    return Number(perf.initialFeedCards || profile.layout?.initialFeedCards || 0);
  }

  function gridBatchSize() {
    return Number(perf.feedBatchSize || profile.layout?.feedBatchSize || gridInitialCount() || 12);
  }

  function cardMatchesFeedState(card) {
    const query = feedState.mode === 'search' ? feedState.query.trim().toLowerCase() : '';
    const searchHidden = !!query && !card.textContent.toLowerCase().includes(query);
    const savedHidden = feedState.mode === 'saved' && !saved.has(idFor(card));
    card.hidden = false;
    card.classList.toggle('csm-filter-hidden', searchHidden);
    card.classList.toggle('csm-saved-hidden', savedHidden);
    return !searchHidden && !savedHidden;
  }

  function ensureFeedStatus(grid) {
    if (!(grid instanceof HTMLElement)) return null;
    let status = grid.parentElement?.querySelector(':scope > .csm-feed-status');
    if (!status) {
      status = d.createElement('div');
      status.className = 'csm-feed-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.innerHTML = '<span data-csm-feed-status-text></span><button class="csm-chip" type="button" data-csm-show-all>Show all</button>';
      status.querySelector('[data-csm-show-all]').addEventListener('click', showAllCards);
      grid.before(status);
    }
    return status;
  }

  function updateFeedStatus(grid, matchingCount, totalCount) {
    const status = ensureFeedStatus(grid);
    if (!status) return;
    const label = status.querySelector('[data-csm-feed-status-text]');
    if (feedState.mode === 'search') label.textContent = `Filtering loaded stories for “${feedState.query}” · ${matchingCount}/${totalCount}`;
    else if (feedState.mode === 'saved') label.textContent = `Showing saved loaded stories · ${matchingCount}/${totalCount}`;
    else label.textContent = '';
    status.hidden = feedState.mode === 'all';
  }

  function applyFeedState(grid) {
    if (!(grid instanceof HTMLElement)) return;
    const cards = feedCards(grid);
    const initial = gridInitialCount();
    const matching = cards.filter(cardMatchesFeedState);
    let visible = Number(grid.dataset.csmVisibleCount || initial || matching.length);
    if (!Number.isFinite(visible) || visible <= 0) visible = initial || matching.length;
    visible = Math.max(initial || 0, Math.min(visible, matching.length));
    if (!grid.dataset.csmVisibleCount) grid.dataset.csmVisibleCount = String(visible);
    const matchingSet = new Set(matching.slice(0, visible));
    for (const card of cards) {
      const deferred = matching.includes(card) && !matchingSet.has(card);
      card.classList.toggle('csm-deferred-hidden', deferred);
      card.classList.toggle('csm-card-deferred', deferred);
    }
    const button = grid.parentElement?.querySelector(':scope > .csm-load-more');
    if (button) {
      const remaining = Math.max(0, matching.length - visible);
      button.hidden = !profile.layout?.showFeedLoadMore || remaining === 0;
      button.textContent = remaining ? `Load ${Math.min(remaining, gridBatchSize())} more stories · ${remaining} left` : 'All stories loaded';
    }
    updateFeedStatus(grid, matching.length, cards.length);
  }

  function revealNextBatch(grid) {
    const cards = feedCards(grid).filter(cardMatchesFeedState);
    const current = Number(grid.dataset.csmVisibleCount || gridInitialCount() || 0);
    grid.dataset.csmVisibleCount = String(Math.min(cards.length, current + gridBatchSize()));
    applyFeedState(grid);
  }

  function installLoadMore(grid) {
    const initial = gridInitialCount();
    if (!profile.layout?.showFeedLoadMore || !initial || !(grid instanceof HTMLElement)) {
      applyFeedState(grid);
      return;
    }
    const cards = feedCards(grid);
    if (cards.length <= initial) {
      applyFeedState(grid);
      return;
    }
    if (!grid.dataset.csmVisibleCount) grid.dataset.csmVisibleCount = String(Math.min(initial, cards.length));
    let button = grid.parentElement?.querySelector(':scope > .csm-load-more');
    if (!button) {
      button = d.createElement('button');
      button.type = 'button';
      button.className = 'csm-load-more';
      grid.after(button);
      button.addEventListener('click', () => revealNextBatch(grid));
    }
    applyFeedState(grid);
  }


  function installPagination(main, grid) {
    const selectors = profile.selectors?.feed?.pagination || '#pagination .pagination__inner,#pagination,.pagination,.nav-links,.page-numbers';
    const source = selectorList(selectors)
      .flatMap((sel) => $$(sel))
      .find((node) => node instanceof HTMLElement && !node.classList.contains('csm-pagination') && !node.closest?.('.csm-topbar,.csm-drawer,.csm-bottomnav') && !isPageTualNode(node) && node.querySelector?.('a[href]'));
    if (!source || !main) return;

    let nav = main.querySelector(':scope > .csm-pagination');
    if (!nav) {
      nav = d.createElement('nav');
      nav.className = 'csm-pagination';
      nav.setAttribute('aria-label', 'Page navigation');
    } else {
      nav.textContent = '';
    }

    const pieces = Array.from(source.querySelectorAll('a[href],span'))
      .map((node) => {
        const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text || /^(?:Page|Back to Top|Go to Bottom)$/i.test(text)) return null;
        if (node.matches('a[href]')) {
          const a = d.createElement('a');
          a.href = node.href;
          a.textContent = text;
          a.className = 'csm-page-link';
          return a;
        }
        const span = d.createElement('span');
        span.textContent = text;
        span.className = text === '...' ? 'csm-page-ellipsis' : 'csm-page-current';
        if (span.className === 'csm-page-current') span.setAttribute('aria-current', 'page');
        return span;
      })
      .filter(Boolean)
      .slice(0, Number(profile.layout?.maxPaginationLinks || 18));

    if (!pieces.some((node) => node.matches?.('a[href]'))) return;
    nav.append(...pieces);
    const anchor = grid?.parentElement === main ? grid : main.querySelector(':scope > .csm-feed-sections') || main.querySelector(':scope > .csm-feed-grid');
    const loadMore = main.querySelector(':scope > .csm-load-more:last-of-type');
    (loadMore || anchor || main.lastElementChild)?.after?.(nav) || main.append(nav);
  }


  function applyFeedCardVariants(grid) {
    if (!(grid instanceof HTMLElement)) return;
    const featuredCount = Number(profile.layout?.featuredCardCount || 0);
    for (const [index, card] of feedCards(grid).entries()) {
      const variant = csmFeedVariantForIndex(index, featuredCount);
      card.dataset.csmCardVariant = variant;
      card.classList.toggle('csm-card-featured', variant === 'featured');
      card.classList.toggle('csm-card-standard', variant === 'standard');
    }
  }

  function enhanceFeed() {
    if (profile.layout?.preserveFeedSections) {
      const sections = sectionedFeedCandidates();
      const items = sections.flatMap((section) => section.items);
      if (!items.length) return;
      const main = primaryMain(items);
      const titleText = profile.feedTitle || first('h1,h2,.section-title,.archive-title', main)?.textContent?.trim();
      if (titleText && !main.querySelector(':scope > .csm-section-title')) {
        const title = d.createElement('h1');
        title.className = 'csm-section-title';
        title.textContent = titleText;
        main.prepend(title);
      }
      const { wrap, grids } = ensureSectionedFeed(sections, main);
      for (const item of items) enhanceCard(item);
      for (const grid of grids) { applyFeedCardVariants(grid); installLoadMore(grid); }
      installPagination(main, wrap);
      return;
    }

    const items = cardCandidates();
    if (!items.length) return;
    const main = primaryMain(items);
    const titleText = profile.feedTitle || first('h1,h2,.section-title,.archive-title', main)?.textContent?.trim();
    if (titleText && !main.querySelector(':scope > .csm-section-title')) {
      const title = d.createElement('h1');
      title.className = 'csm-section-title';
      title.textContent = titleText;
      main.prepend(title);
    }
    const grid = ensureFeedGrid(items, main);
    for (const item of items) enhanceCard(item);
    applyFeedCardVariants(grid);
    installLoadMore(grid);
    installPagination(main, grid);
  }

  function cleanDuration(value) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    const match = text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
    return match ? match[0] : '';
  }

  function durationTextFor(node) {
    const selectors = profile.selectors?.feed?.duration || '';
    const explicit = first(selectors, node);
    const explicitText = cleanDuration(explicit?.textContent);
    if (explicitText) return explicitText;
    const fallback = Array.from(node.querySelectorAll('[class*="duration"],[class*="time"],[data-duration]'))
      .map((candidate) => cleanDuration(candidate.getAttribute('data-duration') || candidate.textContent))
      .find(Boolean);
    return fallback || '';
  }

  function normalizeCard(item, link, id) {
    const title = titleTextFor(item, link);
    const image = findCardImage(item);
    const cat = first(profile.selectors?.feed?.category || '', item);
    const time = first(profile.selectors?.feed?.date || 'time', item);
    const duration = durationTextFor(item);
    const metaParts = [];
    if (cat) metaParts.push(cat.textContent.trim().split(/\s+/).slice(0, 4).join(' '));
    if (time) {
      const timeText = time.textContent.trim();
      if (!duration || timeText !== duration) metaParts.push(timeText);
    }

    const cover = d.createElement('a');
    cover.className = 'csm-card-cover';
    cover.href = link.href;
    cover.setAttribute('aria-label', title || link.textContent.trim() || 'Open story');

    const body = d.createElement('div');
    body.className = 'csm-card-body';
    const heading = d.createElement('h3');
    heading.className = 'csm-card-title';
    heading.textContent = title;
    body.append(heading);
    const summary = summaryTextFor(item, title);
    if (summary) {
      const excerpt = d.createElement('p');
      excerpt.className = 'csm-card-summary';
      excerpt.textContent = summary;
      body.append(excerpt);
    }
    if (metaParts.length) {
      const meta = d.createElement('div');
      meta.className = 'csm-meta';
      meta.setAttribute('aria-label', 'Story metadata');
      meta.textContent = metaParts.filter(Boolean).join(' · ');
      body.append(meta);
    }

    item.textContent = '';
    if (image) {
      const media = d.createElement('div');
      media.className = 'csm-card-media';
      const clone = image.cloneNode(false);
      const lazySrc = clone.getAttribute('data-src') || clone.getAttribute('data-lazy-src') || clone.getAttribute('data-original') || clone.getAttribute('data-orig-file');
      const lazySrcset = clone.getAttribute('data-srcset') || clone.getAttribute('srcset');
      if ((!clone.getAttribute('src') || /^data:/i.test(clone.getAttribute('src') || '')) && lazySrc) clone.setAttribute('src', lazySrc);
      if (!clone.getAttribute('srcset') && lazySrcset) clone.setAttribute('srcset', lazySrcset);
      clone.loading = 'lazy';
      clone.decoding = 'async';
      media.append(clone);
      if (duration) {
        const badge = d.createElement('span');
        badge.className = 'csm-duration-badge';
        badge.setAttribute('aria-label', `Duration ${duration}`);
        badge.textContent = duration;
        media.append(badge);
      }
      item.append(media);
    } else {
      item.dataset.csmNoImage = 'true';
    }
    item.append(body, cover);
  }

  function enhanceCard(item) {
    if (item.dataset.csmCard) return;
    item.dataset.csmCard = '1';
    item.classList.add('csm-card');
    const id = idFor(item);
    if (viewed.has(id)) item.classList.add('csm-viewed');
    const link = item.querySelector('a[href]');
    if (profile.layout?.normalizeCards && link) {
      normalizeCard(item, link, id);
    } else {
      if (link && !item.querySelector('.csm-card-cover')) {
        const cover = d.createElement('a');
        cover.className = 'csm-card-cover';
        cover.href = link.href;
        cover.setAttribute('aria-label', link.textContent.trim() || 'Open story');
        item.prepend(cover);
      }
      if (!item.querySelector('.csm-meta')) {
        const meta = d.createElement('div');
        meta.className = 'csm-meta';
        const parts = [];
        const cat = first(profile.selectors?.feed?.category || '', item);
        const time = first(profile.selectors?.feed?.date || 'time', item);
        const duration = durationTextFor(item);
        if (cat) parts.push(cat.textContent.trim().split(/\s+/).slice(0, 4).join(' '));
        if (time) {
          const timeText = time.textContent.trim();
          if (!duration || timeText !== duration) parts.push(timeText);
        }
        if (duration && !item.querySelector('.csm-duration-badge')) {
          const badge = d.createElement('span');
          badge.className = 'csm-duration-badge';
          badge.setAttribute('aria-label', `Duration ${duration}`);
          badge.textContent = duration;
          (item.querySelector('.csm-card-media') || item).append(badge);
        }
        meta.textContent = parts.filter(Boolean).join(' · ');
        if (meta.textContent) item.append(meta);
      }
    }
    item.querySelector('a[href]')?.addEventListener('click', () => { viewed.add(id); storage.set('viewed', [...viewed]); });
  }

  function applyFeedStateToAllGrids() {
    for (const grid of $$('.csm-feed-grid')) applyFeedState(grid);
  }

  function filterCards(query) {
    const next = query.trim();
    feedState.mode = next ? 'search' : 'all';
    feedState.query = next;
    feedState.version += 1;
    reconcileFeed({ reason: 'search' });
  }

  function filterSaved() {
    feedState.mode = 'saved';
    feedState.query = '';
    feedState.version += 1;
    reconcileFeed({ reason: 'saved' });
    toast('Showing saved items from this page');
  }

  function showAllCards() {
    feedState.mode = 'all';
    feedState.query = '';
    feedState.version += 1;
    for (const grid of $$('.csm-feed-grid')) delete grid.dataset.csmVisibleCount;
    reconcileFeed({ reason: 'show-all' });
    toast('Showing all loaded stories');
  }

  function refreshStates() {
    for (const card of $$('.csm-card')) card.classList.toggle('csm-viewed', viewed.has(idFor(card)));
    applyFeedStateToAllGrids();
  }

  function reconcileFeed({ reason = 'manual', root = d } = {}) {
    feedState.reason = reason;
    feedState.version += 1;
    if (!isArticlePage()) enhanceFeed();
    refreshStates();
  }

  function toggleSave(href, articleMode = false) {
    const id = absolutePath(href);
    if (saved.has(id)) saved.delete(id); else saved.add(id);
    storage.set('saved', [...saved]);
    for (const btn of $$('[data-action="toggle-save"]')) {
      btn.textContent = saved.has(id) ? 'Saved' : 'Save';
      btn.setAttribute('aria-pressed', String(saved.has(id)));
    }
    toast(saved.has(id) ? 'Saved' : 'Removed from saved');
    if (articleMode) refreshStates();
    else if (feedState.mode === 'saved') reconcileFeed({ reason: 'save-toggle' });
  }

  function articleCleanupRoot(root) {
    const selector = profile.articleCleanup?.contentRootSelector || '.td-post-content,.td-article-content,.entry-content,.post-content';
    return first(selector, root) || root;
  }

  function safeHideArticleNode(node, root) {
    if (!(node instanceof Element) || node === root || !root.contains(node)) return false;
    if (node.matches?.('.csm-topbar,.csm-drawer,.csm-bottomnav,.csm-progress')) return false;
    node.classList.add('csm-source-hidden');
    return true;
  }

  function cleanupArticleChrome(root) {
    const cleanup = profile.articleCleanup || {};
    const content = articleCleanupRoot(root);
    hideNodes(cleanup.hideSelectors || [], content);

    const socialLinkSelector = cleanup.socialLinkSelector || [
      'a[href*="facebook.com/share"]',
      'a[href*="twitter.com/share"]',
      'a[href*="x.com/intent"]',
      'a[href*="pinterest.com/pin"]',
      'a[href*="reddit.com/submit"]',
      'a:has(img[src*="social-1_square"])',
      'a:has(img[src*="social_facebook"])',
      'a:has(img[src*="social_twitter"])'
    ].join(',');
    const googleNewsSelector = cleanup.googleNewsLinkSelector || 'a[href*="news.google.com"]';
    const sharePrompt = csmNormalizeCleanupText(cleanup.sharePromptText || 'Enjoyed this? Please share on social media!');
    const tailMarkers = [];

    const isSocialOnly = (node) => {
      if (!(node instanceof Element)) return false;
      const links = $$('a[href]', node);
      const socialImages = $$('img[src*="social_"],img[src*="social-1_square"],img[src*="facebook"],img[src*="twitter"]', node);
      const socialLinks = links.filter((link) => {
        try { return link.matches(socialLinkSelector); } catch { return false; }
      });
      if (links.length && socialLinks.length !== links.length) return false;
      if (!links.length && !socialImages.length) return false;
      const text = csmNormalizeCleanupText(node.textContent);
      return text.length <= Number(cleanup.maxSocialContainerText || 220);
    };

    for (const node of $$('p,div,strong,h2,h3,h4', content)) {
      if (csmNormalizeCleanupText(node.textContent) !== sharePrompt) continue;
      tailMarkers.push(node);
      safeHideArticleNode(node, content);
      let sibling = node.nextElementSibling;
      let steps = 0;
      while (sibling && steps < Number(cleanup.maxShareSiblingScan || 8)) {
        if (!isSocialOnly(sibling)) break;
        const next = sibling.nextElementSibling;
        safeHideArticleNode(sibling, content);
        sibling = next;
        steps += 1;
      }
    }

    const googlePromoText = csmNormalizeCleanupText(cleanup.googleNewsPromoText || 'Stay up-to-date and support the site by following Bleeding Cool on Google News today!').toLowerCase();
    for (const link of $$(googleNewsSelector, content)) {
      const linkText = csmNormalizeCleanupText(link.textContent).toLowerCase();
      const hasPromoBadge = !!link.querySelector?.('img[src*="Google_News"],img[src*="google_preferred_source_badge"]');
      if (!hasPromoBadge && linkText !== googlePromoText) continue;
      tailMarkers.push(link);
      const box = link.closest(cleanup.googleNewsContainerSelector || 'p,figure,aside,.google-news,.google-news-promo,.follow-google-news');
      if (box && box !== content && content.contains(box)) safeHideArticleNode(box, content);
      else safeHideArticleNode(link, content);
    }

    const followsTailMarker = (node) => tailMarkers.some((marker) =>
      marker !== node && !!(marker.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
    const stopPrefixes = (cleanup.authorStopTextPrefixes || ['Comments will load', 'Latest by ', 'Latest in '])
      .map((value) => csmNormalizeCleanupText(value).toLowerCase());
    const isAuthorBoundary = (node) => {
      if (!(node instanceof Element)) return true;
      if (node.matches?.(profile.selectors?.article?.comments || '#comments,.comments-area')) return true;
      const text = csmNormalizeCleanupText(node.textContent).toLowerCase();
      return stopPrefixes.some((prefix) => text.startsWith(prefix));
    };

    if (tailMarkers.length) {
      for (const heading of $$('h2,h3,h4', content)) {
        const text = csmNormalizeCleanupText(heading.textContent);
        if (!/^About\s+/i.test(text) || !followsTailMarker(heading)) continue;
        const authorBox = heading.closest(cleanup.authorContainerSelector || '.td-author-box-wrap,.author-box,.author-bio');
        if (authorBox && authorBox !== content && content.contains(authorBox)) {
          safeHideArticleNode(authorBox, content);
          continue;
        }
        let sibling = heading;
        let steps = 0;
        while (sibling && steps < Number(cleanup.maxAuthorSiblingScan || 12)) {
          if (sibling !== heading && isAuthorBoundary(sibling)) break;
          const next = sibling.nextElementSibling;
          safeHideArticleNode(sibling, content);
          sibling = next;
          steps += 1;
        }
      }
    }
  }

  function normalizeArticleMediaGroups(root) {
    const cleanup = profile.articleCleanup || {};
    const content = articleCleanupRoot(root);
    const groupSelector = cleanup.mediaGroupSelector || 'figure,.wp-caption,.wp-block-image,.gallery-item,.td-image-wrap';
    const captionSelector = cleanup.captionSelector || 'figcaption,.wp-caption-text,.caption,[class*="caption"]';
    const productLabelSelector = cleanup.productLabelSelector || 'h2,h3,h4,.product-title,.solicit-title,p,strong';

    const nextProductLabel = (group) => {
      let node = group.nextElementSibling;
      let steps = 0;
      while (node && steps < Number(cleanup.maxProductLabelScan || 3)) {
        const candidate = node.matches?.(productLabelSelector) ? node : first(productLabelSelector, node);
        const text = csmNormalizeCleanupText(candidate?.textContent);
        if (text && text.length <= Number(cleanup.maxProductLabelLength || 180) && !/^View Product Page$/i.test(text)) return text;
        node = node.nextElementSibling;
        steps += 1;
      }
      return '';
    };

    for (const group of $$(groupSelector, content)) {
      if (!(group instanceof HTMLElement)) continue;
      group.classList.add('csm-article-media-group');
      const image = first('img', group);
      const caption = first(captionSelector, group);
      if (caption instanceof HTMLElement) caption.classList.add('csm-article-media-caption');
      if (!(image instanceof HTMLImageElement) || !(caption instanceof HTMLElement)) continue;
      const mediaLabel = image.getAttribute('alt') || image.getAttribute('title') || '';
      const followingTitle = nextProductLabel(group);
      if (csmShouldHideMismatchedCaption({ mediaLabel, caption: caption.textContent, followingTitle })) {
        caption.classList.add('csm-source-hidden', 'csm-mismatched-media-caption');
        group.dataset.csmCaptionMismatch = 'true';
      }
    }
  }

  function enhanceArticle() {
    const root = first(profile.selectors?.article?.root || 'article,main');
    if (!root) return;
    root.classList.add('csm-article');
    cleanupArticleChrome(root);
    normalizeArticleMediaGroups(root);
    if (profile.articleCleanup?.removeOrphanSeparators) {
      for (const node of $$('p,div,span', root)) {
        if (node.children.length || node.querySelector?.('a,img,video,iframe')) continue;
        if (/^[\s·.•|–—-]*$/.test(node.textContent || '') && (node.textContent || '').trim()) {
          node.classList.add('csm-source-hidden');
        }
      }
    }
    const wrapper = root.closest(profile.selectors?.page?.main || 'main,#main,.site-main,.content,.main-content,.site-content');
    if (wrapper instanceof HTMLElement) {
      wrapper.classList.add('csm-article-shell');
      if (profile.layout?.hideArticleRemainder === true) {
        for (const child of Array.from(wrapper.children)) {
          if (child === root || child.contains(root) || root.contains(child)) continue;
          child.classList.add('csm-source-hidden');
        }
      }
    }
    const id = absolutePath(location.href);
    let dwell = 0;
    const timer = setInterval(() => {
      if (d.visibilityState !== 'visible') return;
      dwell += 1;
      if (dwell >= 10) { viewed.add(id); storage.set('viewed', [...viewed]); clearInterval(timer); }
    }, 1000);
    addEventListener('pagehide', () => clearInterval(timer), { once: true });
  }

  function observe() {
    let scheduled = 0;
    const scheduleFeedEnhance = (delay = Number(perf.mutationDebounceMs || 300)) => {
      if (isArticlePage()) return;
      if (scheduled) clearTimeout(scheduled);
      scheduled = setTimeout(() => {
        scheduled = 0;
        reconcileFeed({ reason: feedState.reason || 'mutation' });
      }, delay);
    };
    const markPageTualCandidates = (root = d) => {
      if (!root || typeof root.querySelectorAll !== 'function') return;
      const selectors = [
        ...selectorList(profile.selectors?.feed?.items || ''),
        ...selectorList(profile.selectors?.feed?.sectionItems || ''),
        ...selectorList(profile.selectors?.feed?.featuredItems || ''),
        ...selectorList('article')
      ];
      const markNode = (node) => {
        if (node instanceof HTMLElement && !node.dataset.csmCard) node.dataset.csmPageTualCandidate = '1';
      };
      for (const sel of selectors) {
        if (root instanceof HTMLElement && root.matches?.(sel)) markNode(root);
        for (const node of $$(sel, root)) markNode(node);
      }
    };
    const ingestPageTualCandidates = (root = d) => {
      if (!root || typeof root.querySelectorAll !== 'function') return 0;
      const candidates = Array.from(root.querySelectorAll('[data-csm-page-tual-candidate="1"],[data-csm-pagetual-candidate="1"]'));
      const items = selectCardNodes(candidates, currentFeedLinkSet(), { allowHiddenSource: true, limit: 0 });
      if (!items.length) return 0;
      const grid = first('.csm-feed-section:not([data-csm-section-key="featured"]) .csm-feed-grid') || first('.csm-feed-grid');
      if (!(grid instanceof HTMLElement)) return 0;
      for (const item of items) {
        grid.append(item);
        enhanceCard(item);
      }
      applyFeedCardVariants(grid);
      installLoadMore(grid);
      applyFeedState(grid);
      return items.length;
    };
    const handlePageTualInsert = (event) => {
      // PageTual posts this after it finishes inserting a fetched page. Reconcile
      // immediately, then again after PageTual's own batched DOM work settles.
      // The immediate pass keeps disabled-MutationObserver profiles compatible
      // with deterministic fixture smoke and real next-page inserts.
      markPageTualCandidates(event?.detail?.root || d);
      ingestPageTualCandidates(event?.detail?.root || d);
      feedState.reason = 'pagetual';
      reconcileFeed({ reason: 'pagetual' });
      scheduleFeedEnhance(90);
      setTimeout(() => scheduleFeedEnhance(90), 500);
    };
    addEventListener('message', (event) => {
      const data = event?.data;
      if (data && typeof data === 'object' && data.command === 'pagetual' && data.action === 'insert') {
        handlePageTualInsert(event);
      }
    });
    addEventListener('pagetual:insert', handlePageTualInsert);
    if (perf.disableMutationObserver) return;
    const mo = new MutationObserver((records) => {
      let touched = false;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (!node.closest?.('.csm-topbar,.csm-drawer,.csm-bottomnav') && !isPageTualNode(node)) hideAds(node);
          touched = true;
        }
      }
      if (touched) scheduleFeedEnhance();
    });
    mo.observe(d.body, { childList: true, subtree: true });
  }

  const articleMode = isArticlePage();
  injectCss(articleMode);
  installInteractionProfile();
  installTopbar(articleMode);
  installNewsTicker(articleMode);
  installSourceCleanup(articleMode);
  hideAds();
  installProgress(articleMode);
  installDrawer();
  installBottomNav(articleMode);
  if (articleMode) enhanceArticle(); else reconcileFeed({ reason: 'initial' });
  observe();
  addEventListener('keydown', trapDrawerFocus);
}
