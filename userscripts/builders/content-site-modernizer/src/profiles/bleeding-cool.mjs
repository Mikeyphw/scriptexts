export default {
  "id": "bleeding-cool-modern-reader",
  "name": "Bleeding Cool Modern Reader",
  "version": "0.1.0",
  "description": "Modern dark mobile-first reader UI for Bleeding Cool.",
  "matches": [
    "https://bleedingcool.com/*",
    "https://www.bleedingcool.com/*"
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
    "userScript": "dist/bleeding-cool-modern-reader.user.js",
    "metaScript": "dist/bleeding-cool-modern-reader.meta.js"
  },
  "client": {
    "id": "bleeding-cool-modern-reader",
    "name": "Bleeding Cool Modern Reader",
    "shortName": "Bleeding Cool",
    "mark": "BC",
    "storagePrefix": "bc-modern-reader",
    "home": "/",
    "searchPath": "/?s=",
    "layout": {
      "desktopMaxWidth": 1320,
      "articleMaxWidth": 820,
      "cardImageRatio": "16 / 9",
      "hideSidebars": true,
      "hideOriginalChrome": true,
      "rebuildFeedGrid": true,
      "minCardTextLength": 24
    },
    "performance": {
      "lowResource": true,
      "disableMutationObserver": true,
      "maxFeedCards": 42,
      "feedRootSelector": ".td-ss-main-content,.td-pb-span8,.main-content,.content-area,.site-main,main,#main"
    },
    "articleHints": [
      "body.single-post",
      "body.post-template-default",
      "path:^/(comics|tv|movies|games|collectibles|wrestling)/.+/.+"
    ],
    "selectors": {
      "page": {
        "header": "header,#masthead,.site-header,.top-bar,.topbar,.site-branding,.bc-header,[class*='header'],[class*='breaking']",
        "nav": "nav,.main-navigation,.site-navigation,.menu,.navbar,.nav-links,.breadcrumb",
        "main": "main,#main,.site-main,.content-area,.main-content,.primary,.site-content",
        "sidebar": "aside,#secondary,.sidebar,.widget-area,.popular-now,.popular,.trending,[class*='sidebar'],[class*='popular'],[id*='sidebar'],[id*='popular']"
      },
      "feed": {
        "containers": [
          "main",
          "#main",
          ".site-main",
          ".content-area",
          ".main-content",
          ".primary"
        ],
        "exclude": "aside,#secondary,.sidebar,.widget,.widget-area,.popular-now,.popular,.trending,[class*='sidebar'],[class*='popular'],[id*='sidebar'],[id*='popular'],.csm-source-hidden",
        "items": [
          "article",
          ".post:not(.widget):not(.popular)",
          ".entry:not(.widget):not(.popular)",
          ".river-item",
          ".story",
          ".card:not(.widget):not(.popular)"
        ],
        "title": "h1,h2,h3,.entry-title,.post-title,.title",
        "category": ".cat-links,.category,[rel='category tag']",
        "date": "time,.date,.posted-on"
      },
      "article": {
        "root": "article,.post,.entry,main",
        "comments": "#comments,.comments-area"
      },
      "ads": [
        ".adsbygoogle",
        ".code-block",
        "[id*='div-gpt-ad']",
        "[id^='google_ads']",
        "[id^='adngin']",
        "[class*='advertisement']",
        "[class*='ad-container']",
        "[class*='ad-slot']",
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
          "id": "comics",
          "label": "Comics",
          "href": "/comics/"
        },
        {
          "id": "tv",
          "label": "TV",
          "href": "/tv/"
        },
        {
          "id": "movies",
          "label": "Movies",
          "href": "/movies/"
        },
        {
          "id": "games",
          "label": "Games",
          "href": "/games/"
        },
        {
          "id": "collectibles",
          "label": "Collectibles",
          "href": "/collectibles/"
        },
        {
          "id": "wrestling",
          "label": "Wrestling",
          "href": "/wrestling/"
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
    }
  }
};
