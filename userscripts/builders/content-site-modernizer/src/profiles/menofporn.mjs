export default {
  "id": "menofporn-modern-ui",
  "name": "MenOfPorn Modern UI",
  "version": "1.5.2",
  "description": "Modern dark mobile-first interface for MenOfPorn.blog, now driven by the shared content-site runtime.",
  "matches": [
    "https://menofporn.blog/*",
    "https://www.menofporn.blog/*"
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
    "userScript": "dist/menofporn-modern-ui.user.js",
    "metaScript": "dist/menofporn-modern-ui.meta.js"
  },
  "client": {
    "schemaVersion": 1,
    "id": "menofporn-modern-ui",
    "name": "MenOfPorn Modern UI",
    "shortName": "MenOfPorn",
    "mark": "MP",
    "storagePrefix": "menofporn-modern-ui",
    "home": "/",
    "searchPath": "/?s=",
    "feedTitle": "Latest posts",
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
      "minCardTextLength": 8
    },
    "performance": {
      "lowResource": true,
      "disableMutationObserver": false,
      "mutationDebounceMs": 250,
      "maxFeedCards": 0,
      "initialFeedCards": 48,
      "feedBatchSize": 48,
      "feedRootSelector": "#content,.site-content,#primary,.content-area,#main,main"
    },
    "articleHints": [
      "body.single",
      "body.single-post",
      "article.bloglo-article .entry-content",
      "main[itemtype='http://schema.org/Blog'] article.bloglo-article",
      "path:^/\\d{4}/\\d{2}/[^/?#]+\\.html$"
    ],
    "selectors": {
      "page": {
        "header": "#masthead,#bloglo-header,.site-header,.bloglo-header,.bloglo-topbar,.bloglo-mobile-nav,.bloglo-logo",
        "nav": "#bloglo-primary-nav,.bloglo-primary-nav,.main-navigation,.site-navigation,.menu,.navbar,.breadcrumb-trail,.breadcrumbs,.navigation.pagination,.nav-links",
        "main": "#content,.site-content,#primary,.content-area,#main,.site-main,main",
        "sidebar": "#secondary,.bloglo-sidebar-container,.widget-area,.bloglo-sidebar-widget,.bloglo-widget,aside,[class*='sidebar']"
      },
      "feed": {
        "containers": [
          "#content",
          ".site-content",
          "#primary",
          ".content-area",
          "#main",
          "main"
        ],
        "exclude": "#secondary,.bloglo-sidebar-container,.widget-area,.bloglo-sidebar-widget,.bloglo-widget,aside,[class*='sidebar'],.breadcrumb-trail,.breadcrumbs,.csm-source-hidden,[class*='advert'],[id*='advert'],[class*='ads'],[id*='ads']",
        "items": [
          "article.bloglo-article"
        ],
        "title": ".entry-title a,.entry-title,.post-title,h1,h2,h3,.title",
        "summary": ".entry-summary,.bloglo-entry-summary,.post-excerpt,.entry-content p,p",
        "category": ".post-category a,.cat-links a,[rel='category tag'],a[href*='/category/']",
        "duration": "",
        "pagination": ".navigation.pagination,.nav-links,.page-numbers,.pagination",
        "date": ".entry-meta time,.posted-on time,time,.date,.entry-date"
      },
      "article": {
        "root": "article.bloglo-article,.entry-content.bloglo-entry,.entry-content,main",
        "comments": ".comments-area,#comments,#respond"
      },
      "ads": [
        ".bloglo-sidebar-widget",
        ".bloglo-widget",
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
        { "id": "home", "label": "Latest posts", "href": "/" },
        { "id": "categories", "label": "Categories & Tags", "href": "/categories" },
        { "id": "polls", "label": "Polls", "href": "/category/polls" },
        { "id": "archives", "label": "Archives", "href": "/archives" },
        { "id": "interviews", "label": "Interviews", "href": "/category/interviews" },
        { "id": "reviews", "label": "Reviews", "href": "/category/reviews" }
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
