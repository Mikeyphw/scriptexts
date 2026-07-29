export default {
  "id": "aipt-comics-modern-reader",
  "name": "AIPT Comics Modern Reader",
  "version": "0.1.4",
  "description": "Modern dark mobile-first reader UI for AIPT Comics.",
  "matches": [
    "https://aiptcomics.com/*",
    "https://www.aiptcomics.com/*"
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
    "userScript": "dist/aipt-comics-modern-reader.user.js",
    "metaScript": "dist/aipt-comics-modern-reader.meta.js"
  },
  "client": {
    "schemaVersion": 1,
    "id": "aipt-comics-modern-reader",
    "name": "AIPT Comics Modern Reader",
    "shortName": "AIPT",
    "mark": "A!",
    "storagePrefix": "aipt-comics-modern-reader",
    "home": "/",
    "searchPath": "/?s=",
    "layout": {
      "desktopMaxWidth": 1360,
      "articleMaxWidth": 780,
      "cardImageRatio": "16 / 9"
    },
    "articleHints": [
      "body.single-post",
      "body.post-template-default",
      "path:^/\\d{4}/\\d{2}/\\d{2}/",
      "article .entry-content",
      "main article h1"
    ],
    "selectors": {
      "page": {
        "main": "main,#main,.site-main,.main-content,.content,.site-content,.td-main-content,.td-ss-main-content,.td-pb-span8,.td-block-span12"
      },
      "feed": {
        "items": [
          "article",
          ".post",
          ".entry",
          ".story",
          ".card",
          ".td_module_wrap",
          ".td_module_1",
          ".td_module_2",
          ".td_module_6",
          ".td_module_10",
          ".td_module_16",
          ".td-block-span6",
          ".td-block-span4",
          "li:has(a[href*='aiptcomics.com/'])",
          "div:has(> a[href*='aiptcomics.com/'] > img)"
        ],
        "title": "h1,h2,h3,.entry-title,.post-title,.td-module-title,.td-big-grid-post .entry-title,.title",
        "category": ".cat-links,.category,.td-post-category,[rel='category tag'],a[href*='/category/']",
        "date": "time,.date,.posted-on,.td-post-date,.entry-date"
      },
      "article": {
        "root": "article,.post,.entry,main,.td-post-content,.td-ss-main-content",
        "comments": "#comments,.comments-area,.td-comments,#respond"
      },
      "ads": [
        "[id*='ad-']",
        "[id*='ads-']",
        "[id*='advert']",
        "[id*='leaderboard']",
        "[class*='ad-']",
        "[class*='ads-']",
        "[class*='advert']",
        "[class*='sponsor']",
        "[class*='promo']",
        ".td-a-rec",
        ".td-g-rec",
        ".td-adspot-title",
        ".google-auto-placed",
        "ins.adsbygoogle",
        "iframe[src*='doubleclick']",
        "iframe[src*='googlesyndication']",
        "script[src*='googlesyndication']"
      ]
    },
    "nav": {
      "primary": [
        { "id": "home", "label": "Home", "href": "/" },
        { "id": "comics", "label": "Comics", "href": "/category/comic-books/" },
        { "id": "movies", "label": "Movies", "href": "/category/movies/" },
        { "id": "tv", "label": "TV", "href": "/category/tv/" },
        { "id": "games", "label": "Games", "href": "/category/video-games/" },
        { "id": "wrestling", "label": "Wrestling", "href": "/category/pro-wrestling/" },
        { "id": "interviews", "label": "Interviews", "href": "/category/interviews/" }
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
