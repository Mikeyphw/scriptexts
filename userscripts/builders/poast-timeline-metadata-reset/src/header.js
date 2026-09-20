// ==UserScript==
// @name         Poast Timeline Metadata Reset
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/poast-timeline-metadata-reset
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/standalone/poast-timeline-metadata-reset
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/poast-timeline-metadata-reset/poast-timeline-metadata-reset.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/poast-timeline-metadata-reset/poast-timeline-metadata-reset.user.js
// @version      1.0.0
// @description  Lightweight one-shot reset for broken injected Poast CSS, plus safe timeline card metadata spacing polish.
// @match        *://nitter.poast.org/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const STYLE_ID = 'cc-poast-reset-timeline-style';

  const BAD_STYLE_MARKERS = [
    '.timeline-container{float:right;width:68%!important}',
    '.profile-tabs{width:100vw;max-width:600px}',
    '.profile-tab{box-sizing:border-box;font-size:14px;text-align:left;vertical-align:top;max-width:32%}',
    '.profile-banner,.profile-banner>a,.profile-banner>a>img{display:block!important}'
  ];

