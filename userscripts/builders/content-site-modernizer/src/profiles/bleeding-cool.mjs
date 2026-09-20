export default {
  "id": "bleeding-cool-modern-reader",
  "name": "Bleeding Cool Modern Reader",
  "version": "0.1.6",
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
    "schemaVersion": 1,
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
      "cardImageFit": "cover",
      "mobileBreakpoint": 760,
      "featuredCardCount": 1,
      "hideSidebars": true,
      "hideOriginalChrome": true,
      "rebuildFeedGrid": true,
      "normalizeCards": true,
      "requireCardImage": true,
      "hideFeedRemainder": true,
      "showFeedLoadMore": true,
      "hideArticleRemainder": true,
      "imageFit": "contain",
      "minCardTextLength": 24
    },
    "articleCleanup": {
      "removeOrphanSeparators": true,
      "contentRootSelector": ".td-post-content,.td-article-content,.entry-content,.post-content",
      "hideSelectors": [
        ".td-post-sharing",
        ".td-post-sharing-top",
        ".td-post-sharing-bottom",
        ".td-social-sharing",
        ".td-social-style",
        ".td-social-icon-wrap",
        ".td-social-box",
        ".td-social-handler",
        ".tdb-social-item",
        ".sharedaddy",
        ".sd-sharing-enabled",
        ".addtoany_share_save_container",
        ".sharethis-inline-share-buttons",
        ".heateor_sss_sharing_container",
        ".sfsi_widget",
        ".sfsi_wDiv",
        ".td-author-box-wrap"
      ],
      "sharePromptText": "Enjoyed this? Please share on social media!",
      "socialLinkSelector": "a[href*='facebook.com/share'],a[href*='twitter.com/share'],a[href*='x.com/intent'],a[href*='pinterest.com/pin'],a[href*='reddit.com/submit'],a:has(img[src*='social-1_square']),a:has(img[src*='social_facebook']),a:has(img[src*='social_twitter'])",
      "googleNewsLinkSelector": "a[href*='news.google.com'],a:has(img[src*='Google_News_icon']),a:has(img[src*='google_preferred_source_badge'])",
      "googleNewsPromoText": "Stay up-to-date and support the site by following Bleeding Cool on Google News today!",
      "googleNewsContainerSelector": "p,figure,aside,.google-news,.google-news-promo,.follow-google-news",
      "authorContainerSelector": ".td-author-box-wrap,.author-box,.author-bio",
      "authorStopTextPrefixes": [
        "Comments will load",
        "Latest by ",
        "Latest in "
      ],
      "maxSocialContainerText": 220,
      "maxShareSiblingScan": 8,
      "maxAuthorSiblingScan": 12,
      "mediaGroupSelector": "figure,.wp-caption,.wp-block-image,.gallery-item,.td-image-wrap",
      "captionSelector": "figcaption,.wp-caption-text,.caption,[class*='caption']",
      "productLabelSelector": "h2,h3,h4,.product-title,.solicit-title,p,strong",
      "maxProductLabelScan": 3,
      "maxProductLabelLength": 180
    },
    "performance": {
      "lowResource": true,
      "disableMutationObserver": true,
      "maxFeedCards": 0,
      "initialFeedCards": 36,
      "feedBatchSize": 36,
      "feedRootSelector": ".td-ss-main-content,.td-pb-span8,.main-content,.content-area,.site-main,main,#main"
    },
    "articleHints": [
      "body.single-post",
      "body.post-template-default",
      "path:^/(comics|tv|movies|games|collectibles|wrestling)/.+/.+"
    ],
    "articleEvidenceMin": 2,
    "articleEvidence": [
      "article .td-post-content,article .td-article-content,article .entry-content,article .post-content",
      "article h1,.single-post h1,.post-template-default h1",
      "article time,.single-post time,.post-template-default time",
      "article [rel='author'],article .td-post-author-name,.single-post .author,.post-template-default .author"
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
        "date": "time,.date,.posted-on",
        "breaking": ".td-trending-now-wrap,.td-trending-now-display-area,.breaking-news,.breaking-news-ticker,[class*='breaking-news'],[class*='breaking_news']"
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
        "script[src*='googlesyndication']",
        ".td-footer-wrapper",
        ".td-sub-footer-container",
        ".td_block_related_posts",
        ".td-related-title",
        ".td-related-row",
        ".td-post-sharing",
        ".td-social-sharing",
        ".td-social-icon-wrap",
        ".sharedaddy",
        ".sd-sharing-enabled",
        ".addtoany_share_save_container",
        ".sharethis-inline-share-buttons",
        "a[href*='facebook.com/share']",
        "a[href*='twitter.com/share']",
        "a[href*='pinterest.com/pin']",
        "a[href*='reddit.com/submit']",
        "a:has(img[src*='social-1_square'])",
        "a:has(img[src*='social_facebook'])",
        "a:has(img[src*='social_twitter'])",
        "a:has(img[src*='social_instagram'])",
        "a:has(img[src*='Google_News_icon'])"
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
