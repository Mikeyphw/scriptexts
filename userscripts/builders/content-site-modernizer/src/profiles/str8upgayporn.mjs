export default {
  "id": "str8upgayporn-modern-ui",
  "name": "STR8UPGAYPORN Modern UI",
  "version": "1.0.4",
  "description": "Modern dark mobile-first interface for STR8UPGAYPORN's WP-Drudge story grid, preserving home category lanes while hiding Hot Links.",
  "matches": [
    "https://str8upgayporn.com/*",
    "https://www.str8upgayporn.com/*"
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
    "userScript": "dist/str8upgayporn-modern-ui.user.js",
    "metaScript": "dist/str8upgayporn-modern-ui.meta.js"
  },
  "client": {
    "schemaVersion": 1,
    "id": "str8upgayporn-modern-ui",
    "name": "STR8UPGAYPORN Modern UI",
    "shortName": "STR8UP",
    "mark": "S8",
    "storagePrefix": "str8upgayporn-modern-ui",
    "home": "/",
    "searchPath": "/?s=",
    "feedTitle": "Latest stories",
    "layout": {
      "desktopMaxWidth": 1360,
      "articleMaxWidth": 980,
      "cardImageRatio": "16 / 10",
      "hideSidebars": true,
      "hideOriginalChrome": true,
      "rebuildFeedGrid": true,
      "normalizeCards": true,
      "requireCardImage": false,
      "hideFeedRemainder": true,
      "showFeedLoadMore": true,
      "preserveFeedSections": true,
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
      "initialFeedCards": 60,
      "feedBatchSize": 60,
      "feedRootSelector": "#main-content"
    },
    "articleHints": [
      "body.single-post",
      ".single-post .post",
      ".entry-content",
      ".post-content",
      "path:^/(?!category/|tag/|page/|author/|feed/|comments/)[^/?#]+/$"
    ],
    "selectors": {
      "page": {
        "header": ".site-top-ad,#header,.banner-container.site-top-ad,#logo-or-name",
        "nav": "#menu-topmenu,.header-nav,.fixed-nav,#fixed-nav",
        "main": "#main-content,#content-wrap,#content,main,.site-main",
        "sidebar": "#sidebar,.sidebar,.widget-area,.site-top-ad,.banner-container:not(#featured .banner-container)"
      },
      "feed": {
        "containers": [
          "#main-content",
          "#content-wrap",
          "#column-1",
          "#column-2",
          "#column-3"
        ],
        "exclude": ".site-top-ad,#header,.header-nav,#menu-topmenu,.banner-container,.textwidget,.readmore,.csm-source-hidden,[class*='advert'],[id*='advert'],[class*='ads'],[id*='ads']",
        "items": [
          "#featured .featured-wrap",
          ".posts-list > li"
        ],
        "featuredItems": "#featured .featured-wrap",
        "featuredTitle": "Featured",
        "sections": ".wpd-posted-links",
        "sectionTitle": ".widget-head a,.widget-head",
        "sectionItems": ".posts-list > li",
        "excludeSectionTitles": ["Hot Links"],
        "title": ".headline-link,h1,h2,h3,.entry-title,.post-title,.title",
        "category": ".cat-links a,.post-categories a,.category a",
        "duration": "",
        "pagination": ".wp-pagenavi,.wp-paginate,.pagination,.nav-links,.page-numbers",
        "date": "time,.date,.posted-on,.entry-date"
      },
      "article": {
        "root": "article,.post,#content .post,#main-content .post,.entry-content,#content,#main-content",
        "comments": "#comments,.comments-area,.commentlist,#respond"
      },
      "ads": [
        ".site-top-ad",
        ".banner-container",
        "[class*='advert']",
        "[id*='advert']",
        "[class*='ads']",
        "[id*='ads']",
        "ins.adsbygoogle",
        "iframe[src*='doubleclick']",
        "iframe[src*='googlesyndication']",
        "script[src*='googlesyndication']"
      ]
    },
    "nav": {
      "primary": [
        { "id": "home", "label": "Home", "href": "/" },
        { "id": "daily", "label": "Str8UpDaily", "href": "/category/str8updaily/" },
        { "id": "new-releases", "label": "New Releases", "href": "/category/new-releases/" },
        { "id": "news", "label": "News", "href": "/category/news/" },
        { "id": "reviews", "label": "Reviews", "href": "/category/reviews/" }
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
