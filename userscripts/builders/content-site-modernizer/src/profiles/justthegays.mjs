export default {
  "id": "justthegays-modern-ui",
  "name": "JustTheGays Modern UI",
  "version": "1.0.3",
  "description": "Modern dark mobile-first interface for justthegays.tv.",
  "matches": [
    "https://justthegays.tv/*",
    "https://www.justthegays.tv/*"
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
    "userScript": "dist/justthegays-modern-ui.user.js",
    "metaScript": "dist/justthegays-modern-ui.meta.js"
  },
  "client": {
    "schemaVersion": 1,
    "id": "justthegays-modern-ui",
    "name": "JustTheGays Modern UI",
    "shortName": "JustTheGays",
    "mark": "JG",
    "storagePrefix": "justthegays-modern-ui",
    "home": "/",
    "searchPath": "/search?q=",
    "layout": {
      "desktopMaxWidth": 1320,
      "articleMaxWidth": 980,
      "cardImageRatio": "16 / 9",
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
      "disableMutationObserver": false,
      "mutationDebounceMs": 250,
      "maxFeedCards": 0,
      "initialFeedCards": 48,
      "feedBatchSize": 48,
      "feedRootSelector": "main"
    },
    "articleHints": [
      ".video-js",
      "#vjs_video_3",
      "video.vjs-tech",
      "path:^/video/"
    ],
    "selectors": {
      "page": {
        "header": "nav.menu,.menu.sticky",
        "nav": "nav.menu,.side-rail",
        "main": "main,#root-cont main",
        "sidebar": ".side-rail,.srail-slot,.live-cam-card,.cam-link"
      },
      "feed": {
        "containers": [
          "main",
          "#root-cont main"
        ],
        "exclude": ".side-rail,.srail-slot,.live-cam-card,.cam-link,.vcm-wrap,#ad-banner,ins,[class*='advert'],[id*='advert'],.csm-source-hidden",
        "items": [
          ".video-item"
        ],
        "title": ".video-title,h1,h2,h3,.title",
        "category": ".video-categories .category a[href*='/category/'],.cloudcat a[href*='/category/']",
        "duration": ".duration-pill",
        "pagination": "main > .flex.gap-2.justify-center.py-4,main > .text-center.mt-8.mb-8",
        "date": ".video-stats .ms-auto,time,.date"
      },
      "article": {
        "root": "main",
        "comments": "#comments,.comments"
      },
      "ads": [
        "#ad-banner",
        "ins[id]",
        ".ppd2tjfqno3",
        "protonpass-root-aecf",
        "[class*='advert']",
        "[id*='advert']",
        "[class*='banner']",
        "iframe[src*='doubleclick']",
        "iframe[src*='googlesyndication']",
        "script[src*='googlesyndication']"
      ]
    },
    "nav": {
      "primary": [
        { "id": "home", "label": "Home", "href": "/" },
        { "id": "latest", "label": "Latest", "href": "/p6909/latest" },
        { "id": "anal", "label": "Anal", "href": "/p6899/category/anal" },
        { "id": "twinks", "label": "Young & Twink", "href": "/p6896/category/youngtwink" },
        { "id": "bareback", "label": "Bareback", "href": "/p6887/category/bareback" },
        { "id": "muscle", "label": "Muscle", "href": "/p6892/category/muscle" },
        { "id": "bigcock", "label": "Big Cock", "href": "/p6888/category/big-cock" }
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
