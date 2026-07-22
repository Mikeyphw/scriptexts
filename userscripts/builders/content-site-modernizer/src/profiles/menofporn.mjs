export default {
  "id": "menofporn-modern-ui",
  "name": "MenOfPorn Modern UI",
  "version": "1.4.0",
  "description": "Modern dark mobile-first interface for MenOfPorn.blog.",
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
  "source": "src/sites/menofporn/menofporn-modern-ui.source.js",
  "output": {
    "userScript": "dist/menofporn-modern-ui.user.js",
    "metaScript": "dist/menofporn-modern-ui.meta.js"
  }
};
