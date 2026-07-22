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
      "desktopMaxWidth": 1360,
      "articleMaxWidth": 790,
      "cardImageRatio": "16 / 9"
    },
    "articleHints": [
      "body.single-post",
      "body.post-template-default",
      "path:^/(comics|tv|movies|games|collectibles|wrestling)/.+/.+"
    ],
    "selectors": {
      "page": {
        "main": "main,#main,.site-main,.content,.main-content,.site-content"
      },
      "feed": {
        "items": [
          "article",
          ".post",
          ".entry",
          ".river-item",
          ".story",
          ".card",
          "li:has(a[href*='bleedingcool.com/'])"
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
        "[id*='ad']",
        "[class*='ad-']",
        "[class*='advert']",
        "[class*='sponsor']",
        "[class*='promo']",
        "iframe[src*='doubleclick']",
        "iframe[src*='googlesyndication']",
        "script[src*='googlesyndication']",
        ".code-block"
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
