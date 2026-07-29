export default {
  "id": "putinho-modern-ui",
  "name": "Putinho Modern UI",
  "version": "1.1.2",
  "description": "Modern dark mobile-first interface for putinho.net, now driven by the shared content-site runtime.",
  "matches": [
    "https://putinho.net/*",
    "https://www.putinho.net/*"
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
    "userScript": "dist/putinho-modern-ui.user.js",
    "metaScript": "dist/putinho-modern-ui.meta.js"
  },
  "client": {
    "schemaVersion": 1,
    "id": "putinho-modern-ui",
    "name": "Putinho Modern UI",
    "shortName": "Putinho",
    "mark": "PT",
    "storagePrefix": "putinho-modern-ui",
    "home": "/",
    "searchPath": "/?s=",
    "feedTitle": "Latest videos",
    "layout": {
      "desktopMaxWidth": 1320,
      "articleMaxWidth": 920,
      "cardImageRatio": "16 / 9",
      "hideSidebars": true,
      "hideOriginalChrome": true,
      "rebuildFeedGrid": true,
      "normalizeCards": true,
      "requireCardImage": false,
      "hideFeedRemainder": true,
      "showFeedLoadMore": true,
      "maxPaginationLinks": 18,
      "hideArticleRemainder": false,
      "imageFit": "cover",
      "minCardTextLength": 4
    },
    "performance": {
      "lowResource": true,
      "disableMutationObserver": false,
      "mutationDebounceMs": 250,
      "maxFeedCards": 0,
      "initialFeedCards": 48,
      "feedBatchSize": 48,
      "feedRootSelector": "#posts-container,.posts-items,.main-content,#content,main"
    },
    "articleHints": [
      "body.single",
      "#the-post",
      "article.post-content",
      ".entry-content.entry",
      "path:^/(?!category/|tag/|page/|author/|feed/|comments/|wp-json/)[^/?#]+/?$"
    ],
    "selectors": {
      "page": {
        "header": "#theme-header,#tie-header,#header,.site-header,.top-nav,.topbar,.logo-row,.main-nav-wrapper,.mobile-header,.header-layout-1",
        "nav": "#main-nav,.main-nav,.top-menu,.mobile-menu,#mobile-menu,.tie-mobile-nav,.breadcrumb,#breadcrumb,.pagination,.pages-nav,.nav-links,.page-numbers",
        "main": "#content,.site-content,.main-content,main,#main-content-row,.container-wrapper",
        "sidebar": "aside,#sidebar,.sidebar,.widget-area,.tie-sidebar,.magazine1,.container-wrapper .sidebar,.stream-item,.stream-item-widget"
      },
      "feed": {
        "containers": [
          "#posts-container",
          ".posts-items",
          ".main-content",
          "#content",
          "main"
        ],
        "exclude": "aside,#sidebar,.sidebar,.widget,.widget-area,.tie-sidebar,.stream-item,.stream-item-widget,.mag-box-title,.container-wrapper .sidebar,[class*='advert'],[id*='advert'],[class*='ads'],[id*='ads'],.csm-source-hidden",
        "items": [
          ".post-item"
        ],
        "title": ".post-title a,.post-title,.entry-title,h1,h2,h3,.title",
        "summary": ".post-excerpt,.entry-summary,.excerpt,p",
        "category": ".post-cat,.cat-links a,.post-categories a,a[href*='/category/']",
        "duration": "",
        "pagination": ".pagination,.pages-nav,.nav-links,.page-numbers,.tie-pagination,.wp-pagenavi",
        "date": ".post-meta .date,.post-meta,time,.date,.post-date"
      },
      "article": {
        "root": "#the-post,article.post-content,.post-content,.entry-content.entry,main",
        "comments": ".comments-area,#comments,#add-comment-block,#respond"
      },
      "ads": [
        ".stream-item",
        ".stream-item-widget",
        ".tie-ad",
        ".e3lan",
        ".adsbygoogle",
        "[class*='advert']",
        "[id*='advert']",
        "[class*='ads']",
        "[id*='ads']",
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
        { "id": "bombando", "label": "#Bombando", "href": "/bombando/" },
        { "id": "videos-gays", "label": "Videos Gays", "href": "/category/videos-gays/" },
        { "id": "amador", "label": "Amador", "href": "/category/amador/" },
        { "id": "bareback", "label": "Bareback", "href": "/category/bareback/" },
        { "id": "dotados", "label": "Dotados", "href": "/category/dotados/" },
        { "id": "novinhos", "label": "Novinhos", "href": "/category/novinhos/" }
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
