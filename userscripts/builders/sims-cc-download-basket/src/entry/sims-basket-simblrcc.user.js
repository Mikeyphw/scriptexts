// ==UserScript==
// @name         Sims CC Download Basket - Simblr.cc
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/sims-basket-simblrcc
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/sims-cc-download-basket
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/src/entry/sims-basket-simblrcc.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/src/entry/sims-basket-simblrcc.user.js
// @version      1.4.1
// @description  Site-specific build for Simblr.cc, generated from the shared Sims CC Download Basket core.
// @author       ChatGPT
// @match        https://simblr.cc/*
// @match        https://www.simblr.cc/*
// @match        http://simblr.cc/*
// @match        http://www.simblr.cc/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      simblr.cc
// @connect      *
// ==/UserScript==

import { runSimsCcDownloadBasket } from '../core/app.js';
import { createSimblrAdapter } from '../sites/simblr.js';

runSimsCcDownloadBasket([createSimblrAdapter]);
