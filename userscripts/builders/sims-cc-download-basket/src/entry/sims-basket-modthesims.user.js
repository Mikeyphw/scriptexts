// ==UserScript==
// @name         Sims CC Download Basket - Mod The Sims
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/sims-basket-modthesims
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/sims-cc-download-basket
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/src/entry/sims-basket-modthesims.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/src/entry/sims-basket-modthesims.user.js
// @version      1.4.1
// @description  Site-specific build for Mod The Sims, generated from the shared Sims CC Download Basket core.
// @author       ChatGPT
// @match        https://modthesims.info/*
// @match        https://www.modthesims.info/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      modthesims.info
// @connect      www.modthesims.info
// @connect      chii.modthesims.info
// @connect      *
// ==/UserScript==

import { runSimsCcDownloadBasket } from '../core/app.js';
import { createMtsAdapter } from '../sites/mts.js';

runSimsCcDownloadBasket([createMtsAdapter]);
