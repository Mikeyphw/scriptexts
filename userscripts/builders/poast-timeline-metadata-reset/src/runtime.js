const DENSITY_KEY = 'cc_poast_density_range';
  const GAP_KEY = 'cc_poast_gap_range';
  const GRID_KEY = 'cc_poast_grid_min_range';
  const MOBILE_GRID_KEY = 'cc_poast_mobile_grid_min_range';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyDensityPrefs() {
    const density = clamp(Number(localStorage.getItem(DENSITY_KEY) || '14'), 8, 24);
    const gap = clamp(Number(localStorage.getItem(GAP_KEY) || '14'), 4, 28);
    const grid = clamp(Number(localStorage.getItem(GRID_KEY) || '280'), 180, 420);
    const mobileGrid = clamp(Number(localStorage.getItem(MOBILE_GRID_KEY) || '160'), 110, 240);

    document.documentElement.style.setProperty('--cc-density-card-pad', density + 'px');
    document.documentElement.style.setProperty('--cc-density-card-gap', Math.max(6, Math.round(density * 0.85)) + 'px');
    document.documentElement.style.setProperty('--cc-density-gallery-gap', gap + 'px');
    document.documentElement.style.setProperty('--cc-density-media-gap', Math.max(2, Math.round(gap * 0.55)) + 'px');
    document.documentElement.style.setProperty('--cc-density-grid-min', grid + 'px');
    document.documentElement.style.setProperty('--cc-mobile-grid-min', mobileGrid + 'px');

    document.body.dataset.ccDensity = 'range';
    document.body.dataset.ccGap = 'range';
  }

  function buildDensityToolbar() {
    if (document.getElementById('cc-density-toolbar')) return;

    const collapsed = localStorage.getItem('cc_poast_density_toolbar_collapsed') === '1';

    const toolbar = document.createElement('div');
    toolbar.id = 'cc-density-toolbar';
    if (collapsed) toolbar.classList.add('cc-collapsed');

    toolbar.innerHTML = `
      <div class="cc-density-topbar">
        <div class="cc-density-title">Layout</div>
        <button type="button" class="cc-density-toggle" aria-expanded="${collapsed ? 'false' : 'true'}">${collapsed ? '＋' : '–'}</button>
      </div>
      <div class="cc-density-content">
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Card density</div>
            <div class="cc-density-value" data-value-for="density"></div>
          </div>
          <input type="range" min="8" max="24" step="1" data-range="density">
        </div>
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Gaps</div>
            <div class="cc-density-value" data-value-for="gap"></div>
          </div>
          <input type="range" min="4" max="28" step="1" data-range="gap">
        </div>
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Grid width</div>
            <div class="cc-density-value" data-value-for="grid"></div>
          </div>
          <input type="range" min="180" max="420" step="10" data-range="grid">
        </div>
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Mobile grid</div>
            <div class="cc-density-value" data-value-for="mobile-grid"></div>
          </div>
          <input type="range" min="110" max="240" step="2" data-range="mobile-grid">
        </div>
      </div>
    `;

    toolbar.addEventListener('click', (event) => {
      const toggle = event.target.closest('.cc-density-toggle');
      if (toggle) {
        const nextCollapsed = !toolbar.classList.contains('cc-collapsed');
        toolbar.classList.toggle('cc-collapsed', nextCollapsed);
        localStorage.setItem('cc_poast_density_toolbar_collapsed', nextCollapsed ? '1' : '0');
        toggle.setAttribute('aria-expanded', String(!nextCollapsed));
        toggle.textContent = nextCollapsed ? '＋' : '–';
      }
    });

    toolbar.addEventListener('input', (event) => {
      const range = event.target.closest('input[type="range"][data-range]');
      if (!range) return;

      const kind = range.getAttribute('data-range');
      const value = String(range.value);

      if (kind === 'density') localStorage.setItem(DENSITY_KEY, value);
      if (kind === 'gap') localStorage.setItem(GAP_KEY, value);
      if (kind === 'grid') localStorage.setItem(GRID_KEY, value);
      if (kind === 'mobile-grid') localStorage.setItem(MOBILE_GRID_KEY, value);

      applyDensityPrefs();
      syncDensityToolbar();
    });

    document.body.appendChild(toolbar);
    syncDensityToolbar();
  }

  function syncDensityToolbar() {
    const toolbar = document.getElementById('cc-density-toolbar');
    if (!toolbar) return;

    const density = clamp(Number(localStorage.getItem(DENSITY_KEY) || '14'), 8, 24);
    const gap = clamp(Number(localStorage.getItem(GAP_KEY) || '14'), 4, 28);
    const grid = clamp(Number(localStorage.getItem(GRID_KEY) || '280'), 180, 420);
    const mobileGrid = clamp(Number(localStorage.getItem(MOBILE_GRID_KEY) || '160'), 110, 240);

    const densityRange = toolbar.querySelector('[data-range="density"]');
    const gapRange = toolbar.querySelector('[data-range="gap"]');
    const gridRange = toolbar.querySelector('[data-range="grid"]');
    const mobileGridRange = toolbar.querySelector('[data-range="mobile-grid"]');

    if (densityRange) densityRange.value = String(density);
    if (gapRange) gapRange.value = String(gap);
    if (gridRange) gridRange.value = String(grid);
    if (mobileGridRange) mobileGridRange.value = String(mobileGrid);

    const densityValue = toolbar.querySelector('[data-value-for="density"]');
    const gapValue = toolbar.querySelector('[data-value-for="gap"]');
    const gridValue = toolbar.querySelector('[data-value-for="grid"]');
    const mobileGridValue = toolbar.querySelector('[data-value-for="mobile-grid"]');

    if (densityValue) densityValue.textContent = density + 'px';
    if (gapValue) gapValue.textContent = gap + 'px';
    if (gridValue) gridValue.textContent = grid + 'px';
    if (mobileGridValue) mobileGridValue.textContent = mobileGrid + 'px';
  }

  function applyRouteClasses() {
    document.body.classList.remove('cc-route-media-gallery', 'cc-route-media-grid');
    const path = location.pathname || '';
    const params = new URLSearchParams(location.search || '');
    if (/\/media/.test(path) && params.get('view') === 'gallery') {
      document.body.classList.add('cc-route-media-gallery');
    }
    if (/\/media/.test(path) && params.get('view') === 'grid') {
      document.body.classList.add('cc-route-media-grid');
    }
  }


  function removeOldBrokenStylesOnce() {
    const styles = Array.from(document.querySelectorAll('style'));
    for (const style of styles) {
      const txt = (style.textContent || '').replace(/\s+/g, '');
      if (BAD_STYLE_MARKERS.some(marker => txt.includes(marker.replace(/\s+/g, '')))) {
        style.remove();
      }
    }
  }

  function injectOnce() {
    if (document.getElementById(STYLE_ID)) return;

    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.append(style);
  }


  const AUTO_INSTANCES = [
    'nitter.poast.org',
    'xcancel.com',
    'nitter.net',
    'nitter.privacydev.net',
    'nitter.woodland.cafe'
  ];

  function handleNoItemsFoundOnce() {
    const none = Array.from(document.querySelectorAll('h2.timeline-none, .timeline-none'))
      .find(el => /no items found/i.test((el.textContent || '').trim()));

    if (!none) return;

    const currentHost = location.host;
    const reloadKey = 'cc_poast_no_items_reload_' + location.pathname + location.search;
    const fallbackKey = 'cc_poast_no_items_fallback_' + location.pathname + location.search;

    const reloadCount = Number(sessionStorage.getItem(reloadKey) || '0');
    const fallbackCount = Number(sessionStorage.getItem(fallbackKey) || '0');

    if (reloadCount < 1) {
      sessionStorage.setItem(reloadKey, String(reloadCount + 1));
      setTimeout(() => location.reload(), 700);
      return;
    }

    if (fallbackCount < 1) {
      const idx = AUTO_INSTANCES.indexOf(currentHost);
      const nextHost = AUTO_INSTANCES[(idx >= 0 ? idx + 1 : 0) % AUTO_INSTANCES.length];
      if (nextHost && nextHost !== currentHost) {
        sessionStorage.setItem(fallbackKey, String(fallbackCount + 1));
        const url = new URL(location.href);
        url.host = nextHost;
        setTimeout(() => { location.href = url.toString(); }, 700);
      }
    }
  }


  const REPLY_CONTEXT_ATTR = 'data-cc-reply-context';

  function q(sel, root = document) {
    return root.querySelector(sel);
  }

  function qa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function nodeText(node) {
    return (node?.textContent || '').replace(/\s+/g, ' ').trim();
  }



  function extractParentPreview(doc) {
    const candidate =
      q('.main-tweet', doc) ||
      q('.thread .timeline-item', doc) ||
      q('.timeline > .timeline-item', doc);

    if (!candidate) return null;

    const fullname = nodeText(q('.fullname', candidate));
    const username = nodeText(q('.username', candidate));
    const date = nodeText(q('.tweet-date', candidate));
    const text = nodeText(q('.tweet-content.media-body, .tweet-content', candidate));

    const media = [];
    qa('.attachments a.still-image img', candidate).slice(0, 4).forEach((img) => {
      const src = img.currentSrc || img.src || '';
      if (src) media.push({ type: 'image', src });
    });

    qa('.attachments video', candidate).slice(0, 2).forEach((video) => {
      const poster = video.getAttribute('poster') || '';
      media.push({ type: 'video', poster });
    });

    return { fullname, username, date, text, media };
  }

  async function fetchParentPreview(url) {
    const response = await fetch(url, { credentials: 'include' });
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return extractParentPreview(doc);
  }

  function buildParentPreview(data, url) {
    const wrap = document.createElement('section');
    wrap.className = 'cc-reply-context';
    wrap.setAttribute(REPLY_CONTEXT_ATTR, '1');

    const mediaHtml = data.media.length
      ? '<div class="cc-reply-context__media">' + data.media.map((m) => (
          m.type === 'video'
            ? '<video muted playsinline preload="metadata"' + (m.poster ? ' poster="' + m.poster + '"' : '') + '></video>'
            : '<img src="' + m.src + '" alt="">'
        )).join('') + '</div>'
      : '';

    wrap.innerHTML = `
      <div class="cc-reply-context__head">
        <span class="cc-reply-context__label">Replying to this post</span>
        <div class="cc-reply-context__actions">
          <a class="cc-reply-context__open" href="${url}" target="_blank" rel="noreferrer noopener">Open original</a>
          <button type="button" class="cc-reply-context__toggle" aria-expanded="true">Hide</button>
        </div>
      </div>
      <div class="cc-reply-context__body">
        <div class="cc-reply-context__meta">
          <strong>${data.fullname || 'Post'}</strong>
          <span>${data.username || ''}</span>
          <span>${data.date || ''}</span>
        </div>
        <div class="cc-reply-context__text">${data.text || 'No preview text found.'}</div>
        ${mediaHtml}
      </div>
    `;

    const toggle = q('.cc-reply-context__toggle', wrap);
    const body = q('.cc-reply-context__body', wrap);

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.textContent = expanded ? 'Show' : 'Hide';
      body.hidden = expanded;
    });

    return wrap;
  }


  function getSelfStatusUrl(item) {
    const selfLink = q('.tweet-date a[href*="/status/"]', item);
    return selfLink?.href || null;
  }

  function getReplyTargetUrl(item) {
    if (!q('.replying-to', item)) return null;

    const selfUrl = getSelfStatusUrl(item);
    const links = qa('a[href*="/status/"]', item)
      .filter((a) => /\/status\/\d+/.test(a.getAttribute('href') || ''))
      .filter((a) => !a.closest('.tweet-stats'))
      .map((a) => a.href)
      .filter(Boolean);

    const distinct = [...new Set(links)].filter((href) => href !== selfUrl);
    return distinct[0] || null;
  }

  function isSamePostPreview(item, data) {
    const body = q(':scope > .tweet-body', item);
    if (!body || !data) return false;

    const currentName = nodeText(q('.fullname', body));
    const currentUser = nodeText(q('.username', body));
    const currentDate = nodeText(q('.tweet-date', body));
    const currentText = nodeText(q('.tweet-content.media-body, .tweet-content', body));

    return Boolean(
      data.fullname &&
      data.username &&
      data.text &&
      currentName === data.fullname &&
      currentUser === data.username &&
      currentDate === data.date &&
      currentText === data.text
    );
  }

  async function enhanceReplyItem(item) {
    if (!q('.replying-to', item) || q('[' + REPLY_CONTEXT_ATTR + ']', item)) return;

    const body = q(':scope > .tweet-body', item);
    const replyingTo = body ? q('.replying-to', body) : null;
    const targetUrl = getReplyTargetUrl(item);

    if (!body || !replyingTo || !targetUrl) return;

    const shell = document.createElement('section');
    shell.className = 'cc-reply-context';
    shell.setAttribute(REPLY_CONTEXT_ATTR, '1');
    shell.innerHTML = `
      <div class="cc-reply-context__head">
        <span class="cc-reply-context__label">Loading replied-to post…</span>
        <div class="cc-reply-context__actions">
          <a class="cc-reply-context__open" href="${targetUrl}" target="_blank" rel="noreferrer noopener">Open original</a>
        </div>
      </div>
    `;

    replyingTo.insertAdjacentElement('afterend', shell);

    try {
      const data = await fetchParentPreview(targetUrl);
      if (!data || isSamePostPreview(item, data)) {
        shell.remove();
        return;
      }
      shell.replaceWith(buildParentPreview(data, targetUrl));
    } catch {
      shell.remove();
    }
  }


  function enhanceReplyContexts() {
    qa('.timeline > .timeline-item, .thread > .timeline-item').forEach((item) => {
      enhanceReplyItem(item);
    });
  }


  function run() {
    removeOldBrokenStylesOnce();
    injectOnce();
    applyDensityPrefs();
    applyRouteClasses();
    handleNoItemsFoundOnce();
    enhanceReplyContexts();
    buildDensityToolbar();
    syncDensityToolbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
