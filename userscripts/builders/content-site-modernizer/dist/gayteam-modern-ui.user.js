// ==UserScript==
// @name         Gayteam Modern UI
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/gayteam-modern-ui
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/content-site-modernizer
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/content-site-modernizer/dist/gayteam-modern-ui.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/content-site-modernizer/dist/gayteam-modern-ui.user.js
// @version      1.0.5
// @description  Modern dark mobile-first interface for gayteam.club.
// @author       Mikeyphw
// @match        https://gayteam.club/*
// @match        https://www.gayteam.club/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @noframes
// ==/UserScript==

(() => {
  'use strict';
  const PROFILE = {
  "schemaVersion": 1,
  "id": "gayteam-modern-ui",
  "name": "Gayteam Modern UI",
  "shortName": "Gayteam",
  "mark": "GT",
  "storagePrefix": "gayteam-modern-ui",
  "home": "/",
  "searchPath": "/index.php?do=search&subaction=search&story=",
  "layout": {
    "desktopMaxWidth": 1320,
    "articleMaxWidth": 980,
    "cardImageRatio": "16 / 10",
    "hideSidebars": true,
    "hideOriginalChrome": true,
    "rebuildFeedGrid": true,
    "normalizeCards": true,
    "requireCardImage": true,
    "hideFeedRemainder": true,
    "showFeedLoadMore": true,
    "preserveFeedSections": false,
    "maxPaginationLinks": 18,
    "hideArticleRemainder": false,
    "imageFit": "cover",
    "minCardTextLength": 4
  },
  "performance": {
    "lowResource": true,
    "disableMutationObserver": true,
    "mutationDebounceMs": 250,
    "maxFeedCards": 0,
    "initialFeedCards": 48,
    "feedBatchSize": 48,
    "feedRootSelector": ".section__content.section__items,#dle-content,.main,.content"
  },
  "articleHints": [
    ".inner-page",
    ".poster-container",
    "path:^/[0-9]+-.+\\.html$"
  ],
  "selectors": {
    "page": {
      "header": ".header,.header__inner,.header__menu,.mobile-menu,#mobile-menu,.mobile-menu-close",
      "nav": ".header__menu,.side-block__menu,.pagination,#pagination",
      "main": ".main,#dle-content,.content,.wrapper-main,main",
      "sidebar": ".sidebar,.side-block,#mobile-menu,.login,.overlay,.pp-blocker"
    },
    "feed": {
      "containers": [
        ".section__content.section__items",
        "#dle-content",
        ".main",
        ".content"
      ],
      "exclude": ".sidebar,.side-block,.login,.overlay,#mobile-menu,.mobile-menu-close,.pp-blocker,[class*='advert'],[id*='advert'],.csm-source-hidden",
      "items": [
        ".thumb-item"
      ],
      "title": ".thumb-item__title,h1,h2,h3,.title",
      "summary": "",
      "category": ".section__title,.side-block__menu a[href^='https://gayteam.club/']",
      "duration": ".thumb-item__label--time",
      "pagination": "#pagination .pagination__inner,#pagination",
      "date": "time,.date"
    },
    "article": {
      "root": ".inner-page,article.inner-page,.inner-page__main",
      "comments": ".inner-page__comments,#inner-page__comments,#dle-comments-form,.add-comments-form"
    },
    "ads": [
      ".login",
      ".overlay",
      ".mobile-menu-close",
      "#mobile-menu",
      ".pp-blocker",
      "#scrolltop",
      "[id*='ad-']",
      "[id*='ads-']",
      "[id*='advert']",
      "[class*='ad-']",
      "[class*='ads-']",
      "[class*='advert']",
      "[class*='banner']",
      "ins.adsbygoogle",
      "iframe[src*='doubleclick']",
      "iframe[src*='googlesyndication']",
      "script[src*='googlesyndication']"
    ]
  },
  "nav": {
    "primary": [
      {
        "id": "home",
        "label": "Home",
        "href": "/"
      },
      {
        "id": "bareback",
        "label": "Bareback",
        "href": "/bareback/"
      },
      {
        "id": "twinks",
        "label": "Twinks",
        "href": "/twink/"
      },
      {
        "id": "latinos",
        "label": "Latinos",
        "href": "/latinos/"
      },
      {
        "id": "muscle",
        "label": "Muscle",
        "href": "/muscle/"
      },
      {
        "id": "solo",
        "label": "Solo",
        "href": "/solo/"
      },
      {
        "id": "trans",
        "label": "Trans",
        "href": "/trans/"
      }
    ],
    "bottom": [
      {
        "id": "home",
        "label": "Home",
        "action": "go-home"
      },
      {
        "id": "browse",
        "label": "Browse",
        "action": "open-browse"
      },
      {
        "id": "search",
        "label": "Search",
        "action": "open-search"
      },
      {
        "id": "saved",
        "label": "Saved",
        "action": "filter-saved"
      },
      {
        "id": "more",
        "label": "More",
        "action": "open-settings"
      }
    ],
    "articleBottom": [
      {
        "id": "back",
        "label": "Back",
        "action": "history-back"
      },
      {
        "id": "save",
        "label": "Save",
        "action": "toggle-save"
      },
      {
        "id": "comments",
        "label": "Comments",
        "action": "jump-comments"
      },
      {
        "id": "top",
        "label": "Top",
        "action": "scroll-top"
      },
      {
        "id": "more",
        "label": "More",
        "action": "open-settings"
      }
    ]
  },
  "capabilities": {
    "feed": true,
    "article": true,
    "drawer": true,
    "bottomNav": true,
    "savedState": true,
    "viewedState": true,
    "searchDrawer": true,
    "loadMore": true,
    "pagination": true,
    "pageTual": true,
    "sectionedFeed": false,
    "durationBadges": true,
    "accessibilityChrome": true,
    "visualRegression": true
  }
};
  const CSS_TEXT = ":root {\n  --csm-bg: #090b0f;\n  --csm-surface: #12161d;\n  --csm-raised: #191f28;\n  --csm-text: #f0f3f7;\n  --csm-muted: #aab3c1;\n  --csm-faint: #8792a2;\n  --csm-accent: #d65cff;\n  --csm-accent-2: #5ad7ff;\n  --csm-radius: 24px;\n  --csm-text-xs: .82rem;\n  --csm-text-sm: .9rem;\n  --csm-text-md: 1rem;\n  --csm-text-lg: clamp(1.05rem, 1.6vw, 1.24rem);\n  --csm-text-xl: clamp(1.4rem, 4vw, 2.35rem);\n  --csm-focus-ring: 0 0 0 3px rgba(90, 215, 255, .34), 0 0 0 1px rgba(90, 215, 255, .8);\n  color-scheme: dark;\n}\nhtml.csm-modernized {\n  background: var(--csm-bg) !important;\n  min-inline-size: 0 !important;\n}\nhtml.csm-modernized body {\n  background: radial-gradient(circle at 20% -10%, rgba(214,92,255,.14), transparent 36rem), var(--csm-bg) !important;\n  color: var(--csm-text) !important;\n  font: 16px/1.62 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif !important;\n  overflow-x: hidden !important;\n  min-inline-size: 0 !important;\n}\nhtml.csm-modernized body :is(#page,#content,.site,.site-content,.site-main,.content,.content-area,.main-content,.wrap,.wrapper,.container,.page-wrap,.page-wrapper,.row,.col,.column,.entry-content,.post-content,.single-post,.post,.article,.main,.primary) {\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n}\n\nhtml.csm-modernized.csm-low-resource body {\n  background: var(--csm-bg) !important;\n}\nhtml.csm-modernized.csm-low-resource .csm-topbar {\n  backdrop-filter: none !important;\n}\nhtml.csm-modernized.csm-low-resource .csm-card,\nhtml.csm-modernized.csm-low-resource .csm-article {\n  background: var(--csm-surface) !important;\n}\nhtml.csm-modernized.csm-low-resource .csm-drawer {\n  backdrop-filter: none !important;\n}\n\nhtml.csm-modernized img,\nhtml.csm-modernized video,\nhtml.csm-modernized iframe {\n  max-inline-size: 100% !important;\n}\n\n.csm-sr-only {\n  position: absolute !important;\n  inline-size: 1px !important;\n  block-size: 1px !important;\n  padding: 0 !important;\n  margin: -1px !important;\n  overflow: hidden !important;\n  clip: rect(0 0 0 0) !important;\n  white-space: nowrap !important;\n  border: 0 !important;\n}\n\n.csm-hidden,\n.csm-ad-hidden,\n.csm-source-hidden {\n  display: none !important;\n  visibility: hidden !important;\n  inline-size: 0 !important;\n  block-size: 0 !important;\n  max-inline-size: 0 !important;\n  max-block-size: 0 !important;\n  margin: 0 !important;\n  padding: 0 !important;\n  overflow: hidden !important;\n}\n.csm-topbar {\n  position: sticky;\n  top: 0;\n  z-index: 2147481000;\n  display: flex;\n  align-items: center;\n  gap: .8rem;\n  min-height: 58px;\n  padding: max(.7rem, env(safe-area-inset-top)) clamp(.85rem, 3vw, 1.4rem) .7rem;\n  background: rgba(9, 11, 15, .9);\n  backdrop-filter: blur(18px);\n  box-shadow: 0 1px 0 rgba(255,255,255,.06);\n}\n.csm-brand {\n  display: flex;\n  align-items: center;\n  min-width: 0;\n  gap: .65rem;\n  color: var(--csm-text) !important;\n  text-decoration: none !important;\n  font-weight: 800 !important;\n  letter-spacing: -.02em;\n}\n.csm-brand-mark {\n  display: grid;\n  place-items: center;\n  inline-size: 34px;\n  block-size: 34px;\n  border-radius: 13px;\n  background: linear-gradient(135deg, var(--csm-accent), var(--csm-accent-2));\n  color: #07080a;\n  font-weight: 900;\n  font-size: .86rem;\n}\n.csm-brand-text {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.csm-actions {\n  margin-inline-start: auto;\n  display: flex;\n  gap: .45rem;\n}\n.csm-btn,\n.csm-chip {\n  border: 0 !important;\n  min-height: 44px;\n  border-radius: 999px;\n  padding: .68rem .92rem;\n  background: rgba(255,255,255,.08);\n  color: var(--csm-text) !important;\n  text-decoration: none !important;\n  font: inherit;\n  font-weight: 750;\n  cursor: pointer;\n  touch-action: manipulation;\n}\n.csm-btn:hover,\n.csm-chip:hover,\n.csm-btn[aria-pressed=\"true\"],\n.csm-chip[aria-pressed=\"true\"] {\n  background: rgba(214,92,255,.2);\n}\n.csm-progress {\n  position: fixed;\n  inset: 0 0 auto 0;\n  height: 3px;\n  z-index: 2147481002;\n  transform-origin: 0 50%;\n  transform: scaleX(0);\n  background: linear-gradient(90deg, var(--csm-accent), var(--csm-accent-2));\n}\n.csm-layout {\n  width: min(100% - 1.5rem, var(--csm-max, 1360px)) !important;\n  max-inline-size: var(--csm-max, 1360px) !important;\n  margin: 1rem auto 5rem !important;\n  padding: 0 !important;\n  float: none !important;\n  clear: both !important;\n  min-inline-size: 0 !important;\n}\n\n@supports (content-visibility: auto) {\n  html.csm-modernized.csm-low-resource .csm-card {\n    content-visibility: auto;\n    contain-intrinsic-size: 360px 260px;\n  }\n  html.csm-modernized.csm-low-resource .csm-article > * {\n    content-visibility: auto;\n    contain-intrinsic-size: 1px 720px;\n  }\n}\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader .csm-layout {\n  contain: layout paint style;\n}\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader .csm-feed-grid {\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));\n}\n\n.csm-feed-grid {\n  display: grid !important;\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 285px), 1fr));\n  gap: clamp(.8rem, 2vw, 1.2rem);\n  align-items: stretch;\n  width: 100% !important;\n  min-inline-size: 0 !important;\n}\n.csm-card {\n  position: relative !important;\n  display: flex !important;\n  flex-direction: column !important;\n  overflow: hidden !important;\n  min-width: 0 !important;\n  border: 0 !important;\n  border-radius: var(--csm-radius) !important;\n  background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.025)), var(--csm-surface) !important;\n  box-shadow: none !important;\n  padding: 0 !important;\n  margin: 0 !important;\n  color: var(--csm-text) !important;\n  float: none !important;\n  width: auto !important;\n  max-width: none !important;\n  min-height: 100% !important;\n}\n.csm-card-cover {\n  position: absolute !important;\n  inset: 0 !important;\n  z-index: 3 !important;\n  color: transparent !important;\n  text-decoration: none !important;\n}\n.csm-card a:not(.csm-card-cover) {\n  color: inherit !important;\n  text-decoration: none !important;\n  position: relative;\n  z-index: 2;\n}\n\n.csm-card-media {\n  display: grid !important;\n  place-items: center !important;\n  inline-size: 100% !important;\n  aspect-ratio: var(--csm-card-ratio, 16 / 9) !important;\n  overflow: hidden !important;\n  background: #0d1118 !important;\n}\n.csm-card-body {\n  position: relative !important;\n  z-index: 2 !important;\n  display: flex !important;\n  flex-direction: column !important;\n  gap: .45rem !important;\n  padding: .72rem .82rem .82rem !important;\n  min-block-size: 0 !important;\n}\n.csm-card-title {\n  margin: 0 !important;\n  color: var(--csm-text) !important;\n  font-size: var(--csm-text-lg) !important;\n  line-height: 1.12 !important;\n  letter-spacing: -.025em !important;\n  display: -webkit-box !important;\n  -webkit-line-clamp: 3 !important;\n  -webkit-box-orient: vertical !important;\n  overflow: hidden !important;\n}\n.csm-card-body .csm-meta {\n  margin: 0 !important;\n  font-size: var(--csm-text-xs) !important;\n  line-height: 1.2 !important;\n}\n.csm-card img {\n  inline-size: 100% !important;\n  width: 100% !important;\n  aspect-ratio: var(--csm-card-ratio, 16 / 9);\n  block-size: auto !important;\n  object-fit: var(--csm-card-fit, cover) !important;\n  object-position: center center !important;\n  display: block !important;\n  border-radius: 0 !important;\n  margin: 0 !important;\n  background: #0d1118 !important;\n}\n.csm-card-media img {\n  block-size: 100% !important;\n  height: 100% !important;\n}\n.csm-card :is(h1,h2,h3,.entry-title,.post-title,.title):not(.csm-card-title) {\n  font-size: clamp(1.05rem, 2.4vw, 1.36rem) !important;\n  line-height: 1.12 !important;\n  letter-spacing: -.025em !important;\n  margin: .85rem .95rem .35rem !important;\n  color: var(--csm-text) !important;\n  display: -webkit-box !important;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden !important;\n}\n.csm-card :is(p,.excerpt,.summary,.dek) {\n  color: var(--csm-muted) !important;\n  margin: 0 .95rem .9rem !important;\n  display: -webkit-box !important;\n  -webkit-line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden !important;\n}\n.csm-card .csm-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: .4rem;\n  margin: auto .95rem .95rem;\n  color: var(--csm-faint);\n  font-size: .84rem;\n  position: relative;\n  z-index: 2;\n}\n.csm-card.csm-viewed img {\n  opacity: .56;\n  filter: saturate(.7);\n}\n.csm-section-title {\n  grid-column: 1 / -1;\n  margin: 1.4rem 0 .8rem;\n  font-size: var(--csm-text-xl);\n  line-height: 1.05;\n  letter-spacing: -.04em;\n  color: var(--csm-text) !important;\n}\n.csm-article-shell {\n  width: min(100% - 1.5rem, calc(var(--csm-article-width, 790px) + 4rem)) !important;\n  margin: 1rem auto 6rem !important;\n  padding: 0 !important;\n  float: none !important;\n  background: transparent !important;\n}\n.csm-article {\n  width: min(100%, var(--csm-article-width, 790px)) !important;\n  max-inline-size: var(--csm-article-width, 790px) !important;\n  margin: 1.1rem auto 6rem !important;\n  padding: clamp(1rem, 3vw, 1.35rem) !important;\n  border-radius: 28px !important;\n  background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.02)), var(--csm-surface) !important;\n  color: var(--csm-text) !important;\n  float: none !important;\n  box-sizing: border-box !important;\n}\n.csm-article :is(h1,.entry-title,.post-title) {\n  font-size: clamp(1.85rem, 8vw, 3.4rem) !important;\n  line-height: 1.08 !important;\n  letter-spacing: -.045em !important;\n  color: var(--csm-text) !important;\n  overflow: visible !important;\n  display: block !important;\n  -webkit-line-clamp: unset !important;\n}\n.csm-article :is(h2,h3,h4) {\n  color: var(--csm-text) !important;\n  line-height: 1.18 !important;\n}\n.csm-article :is(p,li) {\n  color: #e7ebf2 !important;\n  font-size: clamp(1rem, 1.4vw, 1.12rem) !important;\n  line-height: 1.72 !important;\n}\n.csm-article :is(a) { color: var(--csm-accent-2) !important; }\n.csm-article img,\n.csm-article video,\n.csm-article iframe {\n  max-inline-size: 100% !important;\n  block-size: auto !important;\n  border-radius: 18px !important;\n}\n.csm-drawer {\n  position: fixed;\n  inset: auto .65rem calc(.65rem + env(safe-area-inset-bottom)) .65rem;\n  z-index: 2147481001;\n  max-height: min(72vh, 620px);\n  overflow: auto;\n  border-radius: 28px;\n  padding: 1rem;\n  background: #10141b;\n  color: var(--csm-text);\n  box-shadow: 0 24px 80px rgba(0,0,0,.52);\n  transform: translateY(120%);\n  transition: transform .2s ease;\n}\n.csm-drawer[aria-hidden=\"false\"] { transform: translateY(0); }\n.csm-drawer-backdrop {\n  position: fixed;\n  inset: 0;\n  z-index: 2147481000;\n  background: rgba(0,0,0,.48);\n  opacity: 0;\n  pointer-events: none;\n  transition: opacity .2s ease;\n}\n.csm-drawer-backdrop[data-open=\"true\"] { opacity: 1; pointer-events: auto; }\n.csm-drawer h2 { margin: .2rem 0 1rem; font-size: 1.25rem; color: var(--csm-text) !important; }\n.csm-drawer-grid { display: grid; gap: .55rem; }\n.csm-drawer input {\n  min-height: 46px;\n  border: 0;\n  border-radius: 16px;\n  padding: .75rem .9rem;\n  background: rgba(255,255,255,.08);\n  color: var(--csm-text);\n}\n.csm-bottomnav {\n  position: fixed;\n  inset: auto .55rem calc(.55rem + env(safe-area-inset-bottom)) .55rem;\n  z-index: 2147480999;\n  display: grid;\n  grid-template-columns: repeat(5, 1fr);\n  gap: .25rem;\n  padding: .35rem;\n  border-radius: 24px;\n  background: rgba(15,18,24,.9);\n  backdrop-filter: blur(18px);\n}\n.csm-bottomnav button {\n  min-height: 48px;\n  border: 0;\n  border-radius: 18px;\n  background: transparent;\n  color: var(--csm-muted);\n  font: inherit;\n  font-size: var(--csm-text-xs);\n  font-weight: 760;\n}\n.csm-bottomnav button[aria-current=\"page\"],\n.csm-bottomnav button:hover {\n  color: var(--csm-text);\n  background: rgba(255,255,255,.08);\n}\n\nhtml.csm-site-bleeding-cool-modern-reader {\n  --csm-accent: #b68cff;\n  --csm-accent-2: #6fd2ff;\n  --csm-max: 1320px;\n  --csm-article-width: 820px;\n}\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader .csm-layout {\n  contain: layout paint style;\n}\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader .csm-feed-grid {\n  grid-template-columns: repeat(auto-fit, minmax(min(100%, 310px), 1fr));\n}\n\n.csm-feed-grid {\n  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));\n}\nhtml.csm-site-bleeding-cool-modern-reader .csm-feed-grid .csm-card:first-child {\n  grid-column: span 2;\n}\nhtml.csm-site-bleeding-cool-modern-reader .csm-card:first-child :is(h1,h2,h3,.entry-title,.post-title,.title) {\n  font-size: clamp(1.25rem, 2.7vw, 2rem) !important;\n}\nhtml.csm-site-bleeding-cool-modern-reader .csm-article {\n  background: #171c24 !important;\n}\nhtml.csm-site-bleeding-cool-modern-reader :is(.popular-now,.popular,.trending,.widget,.widget-area,aside,[class*=\"sidebar\"],[id*=\"sidebar\"],[class*=\"popular\"]):not(.csm-drawer) {\n  display: none !important;\n}\n\n\n/* Bleeding Cool profile: strip native white wrappers and heavyweight article extras. */\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader,\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader body,\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader :is(#td-outer-wrap,#td-container,.td-container,.td-main-content-wrap,.td-main-page-wrap,.td-pb-row,.td-ss-main-content,.td-pb-span8,.td-pb-span4,.td-main-sidebar,.td-content-wrap,.tdc-content-wrap,.td-page-content,.td-post-content,.td-article-content,.td_block_wrap,.td_module_wrap,.td_block_inner,.td_quote_box) {\n  background: transparent !important;\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n}\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader body {\n  background: var(--csm-bg) !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-layout {\n  background: transparent !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-feed-grid {\n  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)) !important;\n  gap: .72rem !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card {\n  border-radius: 16px !important;\n  min-block-size: 0 !important;\n  background: #141922 !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card-media {\n  border-radius: 0 !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card img {\n  object-fit: contain !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card:first-child {\n  grid-column: span 2;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card:first-child .csm-card-title {\n  font-size: clamp(1.12rem, 2.2vw, 1.58rem) !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card[data-csm-no-image=\"true\"] {\n  display: none !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article-shell {\n  background: transparent !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article {\n  background: #161b23 !important;\n  color: var(--csm-text) !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(.td-post-sharing,.td-post-sharing-top,.td-post-sharing-bottom,.td-social-sharing,.td-social-style,.addtoany_share_save_container,[class*=\"addthis\"],.sharedaddy,.sd-sharing-enabled,.td-a-rec,.td-g-rec,.td_block_related_posts,.td-related-title,.td-related-row,.td-post-next-prev,.td-author-box-wrap,.td-author-name,.td-author-description,.td-more-articles-box,.td-post-source-tags) {\n  display: none !important;\n  visibility: hidden !important;\n  block-size: 0 !important;\n  margin: 0 !important;\n  padding: 0 !important;\n  overflow: hidden !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article img {\n  display: block !important;\n  max-inline-size: 100% !important;\n  width: auto !important;\n  height: auto !important;\n  max-height: 78vh !important;\n  object-fit: contain !important;\n  margin-inline: auto !important;\n  background: #0d1118 !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article iframe,\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article video {\n  width: 100% !important;\n  aspect-ratio: 16 / 9 !important;\n  height: auto !important;\n  background: #0d1118 !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(p,li,figcaption) {\n  color: #e6ebf3 !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader :is(.td-main-sidebar,.td-pb-span4,aside,.sidebar,.widget-area,.td-footer-wrapper,.td-sub-footer-container) {\n  display: none !important;\n}\n\n@media (min-width: 760px) {\n  .csm-bottomnav { display: none; }\n  .csm-layout { margin-bottom: 3rem !important; }\n}\n@media (max-width: 760px) {\n  .csm-layout { width: min(100% - .9rem, var(--csm-max, 1360px)) !important; }\n  html.csm-site-bleeding-cool-modern-reader .csm-feed-grid .csm-card:first-child { grid-column: auto; }\n}\n@media (max-width: 520px) {\n  .csm-actions .csm-btn[data-desktop] { display:none; }\n  .csm-topbar { min-height: 54px; }\n  .csm-card { border-radius: 20px !important; }\n  .csm-article { border-radius: 22px !important; padding: .95rem !important; }\n}\n\n/* Bleeding Cool correction pass: keep the rest of the feed reachable and kill native white islands. */\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader,\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader body,\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader :is(#td-outer-wrap,#td-container,#td-mobile-nav,.td-container-wrap,.td-container,.td-main-content-wrap,.td-main-page-wrap,.td-main-content,.td-pb-row,.td-ss-main-content,.td-pb-span8,.td-pb-span12,.td-block-span12,.td-content-wrap,.tdc-content-wrap,.td-page-content,.td-post-content,.td-article-content,.td_block_wrap,.td_block_inner,.td_module_wrap,.td_module_1,.td_module_2,.td_module_3,.td_module_4,.td_module_6,.td_module_10,.td_module_16,.td_module_mx1,.td_module_mx2,.td_module_mx3,.td_module_mx4,.td_module_wrap,.td-theme-wrap,.wpb_wrapper,.vc_row,.vc_column_container,.vc_column-inner,.td_quote_box) {\n  background: transparent !important;\n  background-color: transparent !important;\n  background-image: none !important;\n  box-shadow: none !important;\n}\nhtml.csm-modernized.csm-site-bleeding-cool-modern-reader body > :not(.csm-topbar):not(.csm-drawer):not(.csm-drawer-backdrop):not(.csm-bottomnav):not(.csm-progress):not(script):not(style) {\n  background: transparent !important;\n  background-color: transparent !important;\n  background-image: none !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-layout,\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-feed-grid {\n  background: var(--csm-bg) !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-layout {\n  padding: .9rem !important;\n  border-radius: 0 !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card-deferred {\n  display: none !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-load-more {\n  display: block !important;\n  width: min(100%, 36rem) !important;\n  min-height: 48px !important;\n  margin: 1rem auto 0 !important;\n  border: 0 !important;\n  border-radius: 999px !important;\n  background: rgba(255,255,255,.1) !important;\n  color: var(--csm-text) !important;\n  font: inherit !important;\n  font-weight: 800 !important;\n  cursor: pointer !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-load-more[hidden] {\n  display: none !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card:not(:has(.csm-card-title:not(:empty))):not(:has(img[src])) {\n  display: none !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card-media {\n  background: #10151d !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card img {\n  object-fit: contain !important;\n  object-position: center center !important;\n  background: #10151d !important;\n}\nhtml.csm-feed-mode.csm-site-bleeding-cool-modern-reader .csm-card-title {\n  min-height: 0 !important;\n  margin: 0 !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article-shell,\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article,\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(.td-post-content,.td-article-content,.entry-content,.post-content) {\n  background: #161b23 !important;\n  color: var(--csm-text) !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader :is(.td-post-sharing,.td-post-sharing-top,.td-post-sharing-bottom,.td-social-sharing,.td-social-style,.td-social-icon-wrap,.td-social-box,.td-social-handler,.tdb-social-item,.sharedaddy,.sd-sharing-enabled,.addtoany_share_save_container,.sharethis-inline-share-buttons,.heateor_sss_sharing_container,.sfsi_widget,.sfsi_wDiv,.td_block_related_posts,.td-related-title,.td-related-row,.td-post-next-prev,.td-author-box-wrap,.td-more-articles-box,.td-post-source-tags,.td-footer-wrapper,.td-sub-footer-container,.td-footer-container,.td-footer-template-wrap,.td_block_wrap:has(.td-related-title),.td_block_wrap:has(.td-module-thumb),a:has(img[src*=\"social-1_square\"]),a:has(img[src*=\"social_facebook\"]),a:has(img[src*=\"social_twitter\"]),a:has(img[src*=\"social_instagram\"]),a:has(img[src*=\"social_website\"]),a:has(img[src*=\"Google_News_icon\"]),a[href*=\"facebook.com/share\"],a[href*=\"twitter.com/share\"],a[href*=\"pinterest.com/pin\"],a[href*=\"reddit.com/submit\"]) {\n  display: none !important;\n  visibility: hidden !important;\n  block-size: 0 !important;\n  inline-size: 0 !important;\n  max-block-size: 0 !important;\n  max-inline-size: 0 !important;\n  margin: 0 !important;\n  padding: 0 !important;\n  overflow: hidden !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article img {\n  max-width: 100% !important;\n  width: auto !important;\n  height: auto !important;\n  object-fit: contain !important;\n  margin-inline: auto !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(iframe,video) {\n  max-width: 100% !important;\n  width: 100% !important;\n  height: auto !important;\n  aspect-ratio: 16 / 9 !important;\n  background: #0d1118 !important;\n}\n\n/* Feed pagination and video-duration repair pass. */\n.csm-card-media {\n  position: relative !important;\n}\n.csm-duration-badge {\n  position: absolute !important;\n  inset: auto .62rem .62rem auto !important;\n  z-index: 4 !important;\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  min-height: 28px !important;\n  padding: .24rem .56rem !important;\n  border-radius: 999px !important;\n  background: rgba(4, 7, 12, .86) !important;\n  color: #fff !important;\n  font-size: .9rem !important;\n  line-height: 1 !important;\n  font-weight: 850 !important;\n  letter-spacing: .01em !important;\n  box-shadow: 0 8px 24px rgba(0, 0, 0, .38) !important;\n  pointer-events: none !important;\n}\n.csm-pagination {\n  display: flex !important;\n  flex-wrap: wrap !important;\n  justify-content: center !important;\n  align-items: center !important;\n  gap: .45rem !important;\n  width: min(100%, var(--csm-max, 1360px)) !important;\n  margin: 1.2rem auto 0 !important;\n  padding: .35rem !important;\n  color: var(--csm-text) !important;\n  position: relative !important;\n  z-index: 2 !important;\n}\n.csm-page-link,\n.csm-page-current,\n.csm-page-ellipsis {\n  display: inline-flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  min-width: 42px !important;\n  min-height: 42px !important;\n  padding: .45rem .72rem !important;\n  border-radius: 999px !important;\n  background: rgba(255,255,255,.08) !important;\n  color: var(--csm-text) !important;\n  text-decoration: none !important;\n  font: inherit !important;\n  font-size: .95rem !important;\n  line-height: 1 !important;\n  font-weight: 800 !important;\n}\n.csm-page-link:hover,\n.csm-page-current {\n  background: rgba(214,92,255,.22) !important;\n}\n.csm-page-ellipsis {\n  min-width: auto !important;\n  background: transparent !important;\n  color: var(--csm-muted) !important;\n}\n\n/* PageTual compatibility: keep its infinite-scroll page bars usable inside the modern shell. */\nhtml.csm-modernized #pagetual-sideController,\nhtml.csm-modernized [id^=\"pagetual-sideController\"] {\n  display: block !important;\n  visibility: visible !important;\n  z-index: 2147480900 !important;\n}\nhtml.csm-modernized .pagetual_pageBar,\nhtml.csm-modernized .autopagerize_page_info,\nhtml.csm-modernized [id^=\"pagetual_pageBar\"] {\n  display: flex !important;\n  visibility: visible !important;\n  inline-size: min(100%, var(--csm-max, 1360px)) !important;\n  max-inline-size: min(100%, var(--csm-max, 1360px)) !important;\n  min-block-size: 44px !important;\n  margin: 1rem auto !important;\n  padding: .45rem .75rem !important;\n  justify-content: center !important;\n  align-items: center !important;\n  border-radius: 999px !important;\n  background: rgba(18, 22, 29, .86) !important;\n  border: 1px solid rgba(255,255,255,.1) !important;\n  box-shadow: 0 12px 34px rgba(0,0,0,.28) !important;\n  color: var(--csm-text) !important;\n  text-indent: 0 !important;\n  opacity: 1 !important;\n  position: relative !important;\n  z-index: 20 !important;\n}\nhtml.csm-modernized .pagetual_pageBar a,\nhtml.csm-modernized .autopagerize_page_info a,\nhtml.csm-modernized [id^=\"pagetual_pageBar\"] a,\nhtml.csm-modernized .pagetual_pageBar span,\nhtml.csm-modernized .autopagerize_page_info span,\nhtml.csm-modernized [id^=\"pagetual_pageBar\"] span {\n  color: var(--csm-text) !important;\n  font: 800 .95rem/1.1 Inter, ui-sans-serif, system-ui, sans-serif !important;\n  text-decoration: none !important;\n}\n\n/* Section-aware home feeds: preserve category lanes on WP-Drudge style homepages. */\n.csm-feed-sections {\n  display: flex !important;\n  flex-direction: column !important;\n  gap: clamp(1.2rem, 3vw, 2rem) !important;\n  width: 100% !important;\n  min-inline-size: 0 !important;\n}\n.csm-feed-section {\n  display: flex !important;\n  flex-direction: column !important;\n  gap: clamp(.7rem, 1.6vw, 1rem) !important;\n  width: 100% !important;\n  min-inline-size: 0 !important;\n}\n.csm-feed-section-title {\n  margin: 0 !important;\n  padding: .1rem .05rem 0 !important;\n  color: var(--csm-text) !important;\n  font-size: clamp(1.15rem, 3vw, 1.85rem) !important;\n  line-height: 1.05 !important;\n  letter-spacing: -.035em !important;\n  font-weight: 900 !important;\n}\n.csm-layout-sectioned > .csm-section-title {\n  margin-bottom: clamp(1rem, 2vw, 1.5rem) !important;\n}\nhtml.csm-site-str8upgayporn-modern-ui .csm-feed-section[data-csm-section-key=\"featured\"] .csm-feed-grid {\n  grid-template-columns: minmax(0, 1fr) !important;\n}\nhtml.csm-site-str8upgayporn-modern-ui .csm-feed-section[data-csm-section-key=\"featured\"] .csm-card {\n  max-inline-size: min(100%, 820px) !important;\n}\nhtml.csm-site-str8upgayporn-modern-ui .csm-feed-section[data-csm-section-key=\"featured\"] .csm-card-title {\n  font-size: clamp(1.28rem, 3.5vw, 2.05rem) !important;\n  -webkit-line-clamp: 2 !important;\n}\nhtml.csm-site-str8upgayporn-modern-ui .csm-excluded-feed-section,\nhtml.csm-site-str8upgayporn-modern-ui .csm-drawer a[href*=\"/category/hot-links/\"] {\n  display: none !important;\n}\n\n\n/* Shared UX-state hardening: search, saved filtering, live load-more and drawer focus. */\n.csm-filter-hidden,\n.csm-saved-hidden,\n.csm-deferred-hidden,\n.csm-card-deferred {\n  display: none !important;\n}\n.csm-feed-status {\n  display: flex !important;\n  flex-wrap: wrap !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  gap: .65rem !important;\n  width: 100% !important;\n  margin: 0 0 .8rem !important;\n  padding: .65rem .75rem !important;\n  border-radius: 18px !important;\n  background: rgba(255,255,255,.07) !important;\n  color: var(--csm-muted) !important;\n  font-size: var(--csm-text-sm) !important;\n  font-weight: 760 !important;\n}\n.csm-feed-status[hidden] {\n  display: none !important;\n}\nhtml.csm-drawer-open {\n  overflow: hidden !important;\n}\nhtml.csm-modernized :is(a,button,input,select,textarea,summary,[tabindex]):focus-visible {\n  outline: 0 !important;\n  box-shadow: var(--csm-focus-ring) !important;\n}\n.csm-drawer[aria-hidden=\"false\"] {\n  outline: 0 !important;\n}\n@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n  .csm-topbar,\n  .csm-bottomnav,\n  html.csm-modernized .pagetual_pageBar,\n  html.csm-modernized .autopagerize_page_info,\n  html.csm-modernized [id^=\"pagetual_pageBar\"] {\n    background: #0f131a !important;\n  }\n}\n\n.csm-card-summary {\n  margin: 0.15rem 0 0;\n  color: var(--csm-muted);\n  font-size: var(--csm-text-sm);\n  line-height: 1.5;\n  display: -webkit-box;\n  -webkit-line-clamp: 3;\n  line-clamp: 3;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}\n\nhtml.csm-site-putinho-modern-ui {\n  --csm-accent: #ff4d8d;\n  --csm-accent-2: #ff76a7;\n}\n\nhtml.csm-site-menofporn-modern-ui {\n  --csm-accent: #d9b66a;\n  --csm-accent-2: #f1cf85;\n}\n\nhtml.csm-site-putinho-modern-ui .csm-card-title,\nhtml.csm-site-menofporn-modern-ui .csm-card-title {\n  -webkit-line-clamp: unset;\n  line-clamp: unset;\n}\n\n\n/* Bleeding Cool article correctness: article prose must never inherit feed truncation. */\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader {\n  --csm-bottomnav-clearance: calc(6.75rem + env(safe-area-inset-bottom, 0px));\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader body {\n  padding-bottom: var(--csm-bottomnav-clearance) !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(\n  .td-post-content,.td-article-content,.entry-content,.post-content,\n  p,blockquote,figcaption,figure,.wp-caption,.wp-caption-text,\n  .td-post-sub-title,.entry-subtitle,.post-subtitle,.dek,.excerpt\n) {\n  display: block !important;\n  -webkit-box-orient: initial !important;\n  -webkit-line-clamp: unset !important;\n  line-clamp: unset !important;\n  max-height: none !important;\n  max-block-size: none !important;\n  overflow: visible !important;\n  text-overflow: clip !important;\n  white-space: normal !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article li {\n  -webkit-line-clamp: unset !important;\n  line-clamp: unset !important;\n  max-height: none !important;\n  max-block-size: none !important;\n  overflow: visible !important;\n  text-overflow: clip !important;\n  white-space: normal !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(\n  .td-post-sub-title,.entry-subtitle,.post-subtitle,.dek,.excerpt\n) {\n  color: var(--csm-muted) !important;\n  opacity: 1 !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(.td-post-content,.td-article-content,.entry-content,.post-content) > :last-child {\n  margin-bottom: 1.5rem !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article :is(.td-post-content,.td-article-content,.entry-content,.post-content) :is(.td-adspot-title,.td-adspot-title:empty,.td-a-rec:empty,p:empty,div:empty) {\n  min-height: 0 !important;\n}\n\n/* Bleeding Cool article cleanup: remove tail chrome without disturbing editorial copy. */\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article .csm-article-media-group {\n  display: block !important;\n  position: relative !important;\n  max-width: 100% !important;\n  max-height: none !important;\n  overflow: visible !important;\n  contain: none !important;\n  break-inside: avoid !important;\n  background: transparent !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article .csm-article-media-group :is(img,picture,source) {\n  max-width: 100% !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article .csm-article-media-caption {\n  display: block !important;\n  max-height: none !important;\n  overflow: visible !important;\n  white-space: normal !important;\n  text-overflow: clip !important;\n  -webkit-line-clamp: unset !important;\n  line-clamp: unset !important;\n}\nhtml.csm-article-mode.csm-site-bleeding-cool-modern-reader .csm-article .csm-mismatched-media-caption {\n  display: none !important;\n}\n";
  const install = (() => {
function csmNormalizeCleanupText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .trim();
}

function csmTitleTokens(value) {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'from', 'into', 'this', 'that', 'image', 'cover',
    'page', 'preview', 'comic', 'comics', 'issue', 'official', 'full', 'view', 'product'
  ]);
  return csmNormalizeCleanupText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((token) => token.length >= 2 && !stop.has(token));
}

function csmTitleTokenOverlap(left, right) {
  const a = new Set(csmTitleTokens(left));
  const b = new Set(csmTitleTokens(right));
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.min(a.size, b.size);
}


function csmLooksLikeCompetingProductTitle(value) {
  const text = csmNormalizeCleanupText(value);
  if (text.length < 6 || text.length > 140 || csmTitleTokens(text).length < 2) return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  const uppercase = letters.replace(/[^A-Z]/g, '').length;
  const uppercaseRatio = letters.length ? uppercase / letters.length : 0;
  return /#\s*\d+/.test(text) || /\b\d+\s*\(\s*OF\s+\d+\s*\)/i.test(text) || uppercaseRatio >= 0.62;
}

function csmShouldHideMismatchedCaption({ mediaLabel, caption, followingTitle }) {
  const media = csmNormalizeCleanupText(mediaLabel);
  const cap = csmNormalizeCleanupText(caption);
  const next = csmNormalizeCleanupText(followingTitle);
  if (media.length < 6 || cap.length < 6 || next.length < 6) return false;
  if (!csmLooksLikeCompetingProductTitle(cap)) return false;
  if (csmTitleTokens(media).length < 2 || csmTitleTokens(next).length < 2) return false;
  const mediaToNext = csmTitleTokenOverlap(media, next);
  const mediaToCaption = csmTitleTokenOverlap(media, cap);
  const captionToNext = csmTitleTokenOverlap(cap, next);
  return mediaToNext >= 0.5 && mediaToCaption < 0.25 && captionToNext < 0.25;
}
return function installContentSiteModernizer(profile, cssText) {
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
    if (profile.articleHints?.some(matchesArticleHint)) return true;
    const evidence = profile.articleEvidence || [];
    if (!evidence.length) return false;
    return articleEvidenceScore() >= Math.max(1, profile.articleEvidenceMin || 2);
  };

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
      for (const grid of grids) installLoadMore(grid);
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
  installSourceCleanup(articleMode);
  hideAds();
  installTopbar(articleMode);
  installProgress(articleMode);
  installDrawer();
  installBottomNav(articleMode);
  if (articleMode) enhanceArticle(); else reconcileFeed({ reason: 'initial' });
  observe();
  addEventListener('keydown', trapDrawerFocus);
};
})();
  install(PROFILE, CSS_TEXT);
})();
