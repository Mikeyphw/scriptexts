export default {
  "id": "gayteam-modern-ui",
  "name": "Gayteam Modern UI",
  "version": "1.0.5",
  "description": "Modern dark mobile-first interface for gayteam.club.",
  "matches": [
    "https://gayteam.club/*",
    "https://www.gayteam.club/*"
  ],
  "grants": [
    "GM_addStyle",
    "GM_getValue",
    "GM_setValue",
    "GM_deleteValue",
    "GM_registerMenuCommand"
  ],
  "runAt": "document-end",
  "noFrames": true,
  "css": "src/core/styles.css",
  "output": {
    "userScript": "dist/gayteam-modern-ui.user.js",
    "metaScript": "dist/gayteam-modern-ui.meta.js"
  },
  "client": {
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
      "maxPaginationLinks": 18,
      "hideArticleRemainder": false,
      "imageFit": "cover",
      "minCardTextLength": 4
    },
    "performance": {
      "lowResource": true,
      "disableMutationObserver": true,
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
        { "id": "home", "label": "Home", "href": "/" },
        { "id": "bareback", "label": "Bareback", "href": "/bareback/" },
        { "id": "twinks", "label": "Twinks", "href": "/twink/" },
        { "id": "latinos", "label": "Latinos", "href": "/latinos/" },
        { "id": "muscle", "label": "Muscle", "href": "/muscle/" },
        { "id": "solo", "label": "Solo", "href": "/solo/" },
        { "id": "trans", "label": "Trans", "href": "/trans/" }
      ],
      "bottom": [
        { "id": "home", "label": "Home", "action": "go-home" },
        { "id": "browse", "label": "Browse", "action": "open-browse" },
        { "id": "search", "label": "Search", "action": "open-search" },
        { "id": "saved", "label": "Saved", "action": "filter-saved" },
        { "id": "more", "label": "More", "action": "open-settings" }
      ],
      "articleBottom": [
        { "id": "back", "label": "Back", "action": "history-back" },
        { "id": "save", "label": "Save", "action": "toggle-save" },
        { "id": "comments", "label": "Comments", "action": "jump-comments" },
        { "id": "top", "label": "Top", "action": "scroll-top" },
        { "id": "more", "label": "More", "action": "open-settings" }
      ]
    }
  }
};
