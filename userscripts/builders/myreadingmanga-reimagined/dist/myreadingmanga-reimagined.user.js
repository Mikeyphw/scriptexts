// ==UserScript==
// @name         MyReadingManga Reimagined
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/myreadingmanga-reimagined
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/myreadingmanga-reimagined
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.user.js
// @version      6.7.0
// @description  A clean-room MyReadingManga archive workspace with a personal saved library, device-aware reader preferences, connection-aware page loading, stable PageTual long-page browsing, and hardened accessible controls.
// @run-at       document-idle
// @match        https://myreadingmanga.info/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";
  const MRM = {
    config: Object.freeze({"id":"myreadingmanga-reimagined","name":"MyReadingManga Reimagined","version":"6.7.0","description":"A clean-room MyReadingManga archive workspace with a personal saved library, device-aware reader preferences, connection-aware page loading, stable PageTual long-page browsing, and hardened accessible controls.","matches":["https://myreadingmanga.info/*"],"runAt":"document-idle","storagePrefix":"mrm-reimagined-v1","hostnames":["myreadingmanga.info"],"fixtureContractVersion":1}),
    css: "/* archive.css */\nhtml.mrm-ui-enabled .mrm-archive-page .breadcrumb { display: none !important; }\nhtml.mrm-ui-enabled .mrm-archive-page main.content,\nhtml.mrm-ui-enabled .mrm-archive-page .content,\nhtml.mrm-ui-enabled .mrm-archive-page .content-archive,\nhtml.mrm-ui-enabled .mrm-archive-page .archive-content { display: block !important; width: 100% !important; max-width: none !important; min-width: 0 !important; float: none !important; clear: both !important; }\n\n.mrm-archive-overview { position: sticky; z-index: 90000; top: 78px; display: grid; gap: 14px; margin: 0 0 clamp(22px, 2.8vw, 36px); padding: 18px clamp(18px, 2.2vw, 28px); border: 1px solid var(--mrm-line); border-radius: 20px; background: color-mix(in srgb, var(--mrm-surface) 94%, transparent); box-shadow: 0 16px 42px rgba(0,0,0,.24); backdrop-filter: blur(20px) saturate(145%); }\n.mrm-overview-heading { display: flex; min-width: 0; align-items: end; justify-content: space-between; gap: 24px; }\n.mrm-overview-copy { min-width: 0; }\n.mrm-overview-eyebrow { display: block; margin-bottom: 5px; color: var(--mrm-accent); font-size: 11px; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }\n.mrm-overview-copy h1 { margin: 0 !important; color: var(--mrm-text) !important; font-size: clamp(24px, calc(20px + .8vw), 34px) !important; line-height: 1.08 !important; letter-spacing: -.032em; }\n.mrm-overview-result-summary { flex: 0 0 auto; display: grid; justify-items: end; gap: 1px; color: var(--mrm-muted); font-size: 12px; line-height: 1.35; }\n.mrm-overview-result-summary strong { color: var(--mrm-text); font-size: 25px; line-height: 1; }\n#mrm-overview-progress-count { color: color-mix(in srgb, var(--mrm-accent) 76%, white); font-weight: 750; }\n.mrm-overview-search { display: grid; grid-template-columns: auto minmax(0,1fr); align-items: center; min-width: 0; min-height: 48px; border: 1px solid var(--mrm-line); border-radius: 13px; padding-inline: 13px; background: var(--mrm-surface-2); color: var(--mrm-muted); }\n.mrm-overview-search:focus-within { border-color: color-mix(in srgb, var(--mrm-accent) 65%, var(--mrm-line)); outline: 3px solid color-mix(in srgb, var(--mrm-accent) 15%, transparent); }\n.mrm-overview-search > span[aria-hidden] { font-size: 20px; line-height: 1; }\n.mrm-overview-search input { width: 100%; min-width: 0; min-height: 46px; border: 0 !important; padding: 0 0 0 10px !important; background: transparent !important; color: var(--mrm-text) !important; font-size: 15px !important; box-shadow: none !important; }\n.mrm-overview-command-row { display: grid; grid-template-columns: auto minmax(150px, 190px) auto auto; align-items: end; gap: 9px; }\n.mrm-overview-quick-filters, .mrm-overview-density { display: inline-flex; min-width: 0; align-items: center; gap: 5px; border: 1px solid var(--mrm-line); border-radius: 12px; padding: 4px; background: var(--mrm-surface-2); }\n.mrm-overview-quick-filters button, .mrm-overview-density button { min-height: 36px; border: 0; border-radius: 8px; padding: 0 11px; background: transparent; color: var(--mrm-muted); font-size: 13px; font-weight: 750; cursor: pointer; white-space: nowrap; }\n.mrm-overview-quick-filters button[aria-pressed=\"true\"], .mrm-overview-density button[aria-checked=\"true\"] { background: color-mix(in srgb, var(--mrm-accent) 23%, var(--mrm-surface-3)); color: var(--mrm-text); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mrm-accent) 46%, transparent); }\n.mrm-overview-sort { display: grid; gap: 4px; color: var(--mrm-muted); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }\n.mrm-overview-sort select { width: 100%; min-height: 46px; border: 1px solid var(--mrm-line) !important; border-radius: 12px; padding: 0 34px 0 11px !important; background: var(--mrm-surface-2) !important; color: var(--mrm-text) !important; font-size: 14px !important; text-transform: none; box-shadow: none !important; }\n.mrm-overview-filter-button { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; gap: 8px; border: 1px solid color-mix(in srgb, var(--mrm-accent) 55%, var(--mrm-line)); border-radius: 12px; padding: 0 15px; background: color-mix(in srgb, var(--mrm-accent) 15%, var(--mrm-surface-2)); color: var(--mrm-text); font-size: 14px; font-weight: 800; cursor: pointer; white-space: nowrap; }\n.mrm-overview-filter-button:hover { background: color-mix(in srgb, var(--mrm-accent) 24%, var(--mrm-surface-2)); }\n.mrm-overview-filter-row { display: flex; min-width: 0; align-items: flex-start; gap: 10px; }\n.mrm-overview-active-filters[hidden], .mrm-overview-clear[hidden], #mrm-overview-progress-count[hidden] { display: none !important; }\n.mrm-overview-active-filters { flex: 1; display: flex; flex-wrap: wrap; min-width: 0; max-width: 100%; gap: 7px; overflow: visible; }\n.mrm-overview-clear { flex: 0 0 auto; min-height: 34px; border: 0; border-radius: 9px; padding: 0 10px; background: transparent; color: var(--mrm-muted); font-size: 13px; cursor: pointer; }\n.mrm-overview-clear:hover { background: var(--mrm-surface-2); color: var(--mrm-text); }\n\nhtml.mrm-ui-enabled .mrm-card-grid { display: grid !important; grid-template-columns: repeat(var(--mrm-grid-desktop), minmax(0, 1fr)); gap: var(--mrm-grid-gap) !important; align-items: stretch; width: 100% !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; clear: both !important; }\nhtml.mrm-ui-enabled .mrm-card-grid > .mrm-card { width: auto !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; float: none !important; clear: none !important; }\nhtml.mrm-ui-enabled .mrm-card { position: relative; display: flex !important; flex-direction: column; min-width: 0; overflow: hidden; container-type: inline-size; container-name: mrm-card; border-radius: var(--mrm-radius); background: var(--mrm-surface); box-shadow: 0 10px 28px rgba(0,0,0,.22); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }\nhtml.mrm-ui-enabled .mrm-card:hover { transform: translateY(-3px); box-shadow: 0 18px 38px rgba(0,0,0,.32); }\nhtml[data-mrm-border-cards=\"on\"] .mrm-card { border: 1px solid var(--mrm-line) !important; }\nhtml[data-mrm-border-cards=\"off\"] .mrm-card { border: 0 !important; }\nhtml.mrm-ui-enabled .mrm-card .entry-header { order: 2; display: flex; flex-direction: column; align-items: stretch; min-height: 82px; padding: 13px 13px 8px !important; }\nhtml.mrm-ui-enabled .mrm-card .entry-title { width: 100%; margin: 0 !important; color: var(--mrm-text) !important; font-size: clamp(15px, calc(14px + .14vw), 17px) !important; line-height: 1.34 !important; font-weight: 780 !important; letter-spacing: -.012em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\nhtml.mrm-ui-enabled .mrm-card .entry-title a { color: var(--mrm-text) !important; text-decoration: none !important; }\nhtml.mrm-ui-enabled .mrm-card .entry-title a:hover { color: color-mix(in srgb, var(--mrm-accent) 86%, white) !important; }\n.mrm-card-byline { min-height: 17px; margin: 7px 0 0 !important; overflow: hidden; color: var(--mrm-muted) !important; font-size: 12px !important; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }\nhtml.mrm-ui-enabled .mrm-card-cover { order: 1; position: relative; width: 100% !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; aspect-ratio: var(--mrm-cover-ratio); overflow: hidden; background: radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--mrm-accent) 13%, var(--mrm-surface-2)), var(--mrm-surface-2) 68%); }\nhtml.mrm-ui-enabled .mrm-card-cover > :not(.entry-image-link):not(.mrm-card-badges) { display: none !important; }\nhtml.mrm-ui-enabled .mrm-card-cover > a,\nhtml.mrm-ui-enabled .mrm-card-cover > a img { display: block; width: 100% !important; max-width: none !important; height: 100% !important; }\nhtml.mrm-ui-enabled .mrm-card-cover img { object-position: center top !important; transition: transform .2s ease, filter .2s ease, opacity .2s ease; }\nhtml[data-mrm-cover-fit=\"contain\"] .mrm-card-cover img { object-fit: contain !important; }\nhtml[data-mrm-cover-fit=\"cover\"] .mrm-card-cover img { object-fit: cover !important; }\nhtml.mrm-ui-enabled .mrm-card:hover .mrm-card-cover img { transform: scale(1.018); }\n.mrm-card-badges { position: absolute; z-index: 3; inset: 8px 8px auto; display: flex !important; align-items: flex-start; justify-content: space-between; gap: 8px; pointer-events: none; }\n.mrm-card-language-badge, .mrm-card-state-badge { display: inline-flex; min-height: 28px; align-items: center; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 5px 9px; background: rgba(8,9,13,.82); color: #fff; font-size: 11px; font-weight: 850; line-height: 1; box-shadow: 0 5px 16px rgba(0,0,0,.28); backdrop-filter: blur(10px); }\n.mrm-card-state-badge { margin-left: auto; background: color-mix(in srgb, var(--mrm-accent) 78%, rgba(8,9,13,.88)); }\n.mrm-card-state-badge.is-complete { background: rgba(22,117,72,.92); }\n.mrm-card-state-badge[hidden] { display: none !important; }\n.mrm-is-read .mrm-card-cover img { filter: saturate(.66) brightness(.73); }\n.mrm-in-progress .mrm-card-cover img { filter: saturate(.9) brightness(.9); }\nhtml.mrm-ui-enabled .mrm-card .entry-footer { order: 3; display: grid; gap: 9px; margin-top: auto; padding: 0 12px 12px !important; min-width: 0; overflow: visible !important; }\n.mrm-card-chips { display: flex; flex-wrap: wrap; align-items: stretch; gap: 5px; min-width: 0; max-width: 100%; min-height: 30px; overflow: visible; }\n.mrm-taxonomy-chip, .mrm-filter-chip { box-sizing: border-box; max-width: 100%; height: auto !important; max-height: none !important; border-radius: 999px; border: 1px solid var(--mrm-line); background: var(--mrm-surface-2); color: var(--mrm-muted); font-size: 12px; line-height: 1.2; min-height: 30px; padding: 7px 10px; white-space: nowrap; }\n.mrm-taxonomy-chip { display: inline-flex; flex: 0 1 auto; min-width: 0; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }\n.mrm-chip-label { display: block; min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-taxonomy-chip[data-type=\"lang\"] { color: color-mix(in srgb, var(--mrm-accent) 75%, white); }\n.mrm-taxonomy-more { flex: 0 0 auto; min-width: 38px; padding-inline: 9px; color: var(--mrm-text); overflow: visible; }\n.mrm-taxonomy-more-compact { display: none; }\nhtml[data-mrm-border-chips=\"off\"] .mrm-taxonomy-chip, html[data-mrm-border-chips=\"off\"] .mrm-filter-chip { border-color: transparent; }\n.mrm-card-progress[hidden] { display: none !important; }\n.mrm-card-progress { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 7px; align-items: center; color: var(--mrm-muted); font-size: 11px; }\n.mrm-card-progress-track { position: relative; height: 5px; overflow: hidden; border-radius: 999px; background: var(--mrm-surface-3); }\n.mrm-card-progress-bar { position: absolute; inset: 0 auto 0 0; width: var(--mrm-progress, 0%); border-radius: inherit; background: var(--mrm-accent); }\n.mrm-card-progress-label { white-space: nowrap; }\n.mrm-card-actions { display: grid; grid-template-columns: minmax(0,1fr) 42px; gap: 6px; min-width: 0; }\n.mrm-reader-button, .mrm-primary-action, .mrm-card-original, .mrm-card-read-toggle { min-height: 42px; border: 1px solid color-mix(in srgb, var(--mrm-accent) 45%, var(--mrm-line)); border-radius: 11px; background: color-mix(in srgb, var(--mrm-accent) 12%, var(--mrm-surface-2)); color: color-mix(in srgb, var(--mrm-accent) 82%, white); font-size: 13px; font-weight: 800; cursor: pointer; text-decoration: none !important; }\n.mrm-reader-button { display: flex; min-width: 0; align-items: center; justify-content: space-between; padding-inline: 13px; }\n.mrm-reader-button > span { font-size: 19px; line-height: 1; }\n.mrm-card-original { display: grid; place-items: center; padding: 0; font-size: 17px; }\n.mrm-card-read-toggle { grid-column: 1 / -1; min-height: 32px; border-color: transparent; padding: 0 8px; background: transparent; color: var(--mrm-muted); font-size: 12px; font-weight: 700; }\n.mrm-reader-button:hover, .mrm-primary-action:hover, .mrm-card-original:hover { background: color-mix(in srgb, var(--mrm-accent) 24%, var(--mrm-surface-2)); color: var(--mrm-text); }\n.mrm-card-read-toggle:hover { background: var(--mrm-surface-2); color: var(--mrm-text); }\n\nhtml.mrm-ui-enabled .archive-pagination.pagination { display: block !important; width: 100% !important; max-width: none !important; clear: both !important; margin: clamp(30px, 4vw, 54px) 0 0 !important; padding: 0 !important; border: 0 !important; background: transparent !important; box-shadow: none !important; }\nhtml.mrm-ui-enabled .archive-pagination > ul { display: flex !important; align-items: center; justify-content: center; flex-wrap: wrap; gap: 7px; margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .archive-pagination li { margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .archive-pagination a,\nhtml.mrm-ui-enabled .archive-pagination .pagination-omission { display: inline-grid !important; min-width: 44px; min-height: 44px; place-items: center; margin: 0 !important; border: 1px solid var(--mrm-line); border-radius: 11px; padding: 0 10px; background: var(--mrm-surface); color: var(--mrm-muted) !important; font-size: 14px; font-weight: 750; text-decoration: none !important; }\nhtml.mrm-ui-enabled .archive-pagination a:hover { border-color: color-mix(in srgb, var(--mrm-accent) 60%, var(--mrm-line)); color: var(--mrm-text) !important; }\nhtml.mrm-ui-enabled .archive-pagination .active > a,\nhtml.mrm-ui-enabled .archive-pagination a[aria-current=\"page\"] { border-color: transparent; background: var(--mrm-accent); color: #09090d !important; }\nhtml.mrm-ui-enabled .archive-pagination .pagination-next > a,\nhtml.mrm-ui-enabled .archive-pagination .pagination-previous > a { min-width: 96px; }\nhtml.mrm-ui-enabled #pagetual-sideController,\nhtml.mrm-ui-enabled [id^=\"pagetual-sideController\"] { display: block !important; visibility: visible !important; z-index: 2147480900 !important; }\nhtml.mrm-ui-enabled .mrm-archive-page .pagetual_pageBar,\nhtml.mrm-ui-enabled .mrm-archive-page .autopagerize_page_info,\nhtml.mrm-ui-enabled .mrm-archive-page [id^=\"pagetual_pageBar\"] { display: flex !important; visibility: visible !important; grid-column: 1 / -1 !important; width: calc(100% - 20px) !important; max-width: calc(100% - 20px) !important; min-height: 44px !important; margin: 18px 10px !important; padding: 7px 12px !important; align-items: center !important; justify-content: center !important; border: 1px solid var(--mrm-line) !important; border-radius: 999px !important; background: color-mix(in srgb, var(--mrm-surface) 92%, transparent) !important; box-shadow: 0 12px 30px rgba(0,0,0,.24) !important; color: var(--mrm-text) !important; font-size: 14px !important; font-weight: 800 !important; line-height: 1.2 !important; text-indent: 0 !important; opacity: 1 !important; position: relative !important; z-index: 20 !important; box-sizing: border-box !important; }\nhtml.mrm-ui-enabled .mrm-archive-page .pagetual_pageBar :is(a, span),\nhtml.mrm-ui-enabled .mrm-archive-page .autopagerize_page_info :is(a, span),\nhtml.mrm-ui-enabled .mrm-archive-page [id^=\"pagetual_pageBar\"] :is(a, span) { color: var(--mrm-text) !important; font-size: 14px !important; line-height: 1.2 !important; text-decoration: none !important; }\nhtml[data-mrm-border-pagination=\"off\"] .archive-pagination { border: 0 !important; box-shadow: none !important; }\n\n@media (max-width: 1380px) {\n  .mrm-overview-command-row { grid-template-columns: minmax(0,1fr) minmax(150px, 190px) auto; }\n  .mrm-overview-density { grid-column: 1 / 3; width: fit-content; }\n  .mrm-overview-filter-button { grid-column: 3; grid-row: 1 / span 2; align-self: stretch; }\n}\n@media (max-width: 1100px) {\n  html.mrm-ui-enabled .mrm-card-grid { grid-template-columns: repeat(var(--mrm-grid-tablet), minmax(0,1fr)); }\n  .mrm-archive-overview { top: 76px; }\n  .mrm-overview-command-row { grid-template-columns: minmax(0,1fr) auto; }\n  .mrm-overview-sort { grid-column: 1; }\n  .mrm-overview-density { grid-column: 1 / -1; }\n  .mrm-overview-filter-button { grid-column: 2; grid-row: 1 / span 2; }\n}\n@media (max-width: 760px) {\n  .mrm-archive-overview { top: 0; gap: 10px; margin: 0 -2px 18px; padding: 13px; border-radius: 15px; }\n  .mrm-overview-heading { align-items: center; gap: 12px; }\n  .mrm-overview-eyebrow { display: none; }\n  .mrm-overview-copy h1 { font-size: 20px !important; }\n  .mrm-overview-result-summary strong { font-size: 20px; }\n  .mrm-overview-result-summary { font-size: 11px; }\n  .mrm-overview-search { min-height: 44px; }\n  .mrm-overview-search input { min-height: 42px; font-size: 14px !important; }\n  .mrm-overview-command-row { grid-template-columns: minmax(0,1fr) auto; gap: 7px; }\n  .mrm-overview-quick-filters { overflow-x: auto; }\n  .mrm-overview-sort { display: none; }\n  .mrm-overview-density { display: none; }\n  .mrm-overview-filter-button { grid-column: 2; grid-row: 1; min-height: 44px; padding-inline: 12px; }\n  .mrm-overview-filter-row { max-height: 76px; overflow-y: auto; }\n  html.mrm-ui-enabled .mrm-card-grid { grid-template-columns: repeat(var(--mrm-grid-mobile), minmax(0,1fr)); gap: max(9px, calc(var(--mrm-grid-gap) * .7)) !important; }\n  html.mrm-ui-enabled .mrm-card { border-radius: 13px; }\n  html.mrm-ui-enabled .mrm-card .entry-header { min-height: 70px; padding: 10px 9px 7px !important; }\n  html.mrm-ui-enabled .mrm-card .entry-title { font-size: 14px !important; line-height: 1.34 !important; }\n  .mrm-card-byline { margin-top: 5px !important; font-size: 11px !important; }\n  html.mrm-ui-enabled .mrm-card .entry-footer { gap: 7px; padding: 0 8px 9px !important; }\n  .mrm-card-badges { inset: 6px 6px auto; }\n  .mrm-card-language-badge, .mrm-card-state-badge { min-height: 25px; padding: 4px 7px; font-size: 10px; }\n  .mrm-card-chips { gap: 4px; }\n  .mrm-taxonomy-chip { min-height: 28px; padding: 6px 8px; font-size: 11px; }\n  .mrm-card-actions { grid-template-columns: minmax(0,1fr) 38px; gap: 5px; }\n  .mrm-reader-button, .mrm-card-original { min-height: 38px; }\n  .mrm-card-read-toggle { min-height: 30px; }\n  html.mrm-ui-enabled .archive-pagination a { min-width: 42px; min-height: 42px; }\n}\n\n@container mrm-card (max-width: 230px) {\n  .mrm-taxonomy-secondary, .mrm-taxonomy-more-wide { display: none !important; }\n  .mrm-taxonomy-more-compact { display: inline-flex; }\n}\n@container mrm-card (max-width: 185px) {\n  .mrm-card-byline { display: none; }\n  html.mrm-ui-enabled .mrm-card .entry-header { min-height: 62px; }\n  .mrm-card-read-toggle { font-size: 11px; }\n}\n\n/* Host themes often set card buttons to inherit a tiny or oversized root value. Keep card controls deterministic. */\nhtml.mrm-ui-enabled .mrm-card .mrm-taxonomy-chip { font-size: 12px; }\nhtml.mrm-ui-enabled .mrm-card .mrm-reader-button { font-size: 13px; }\nhtml.mrm-ui-enabled .mrm-card .mrm-card-original { font-size: 17px; }\nhtml.mrm-ui-enabled .mrm-card .mrm-card-read-toggle { font-size: 12px; }\n@media (max-width: 760px) {\n  html.mrm-ui-enabled .mrm-card .mrm-taxonomy-chip { font-size: 11px; }\n  html.mrm-ui-enabled .mrm-card .mrm-reader-button { font-size: 12px; }\n  html.mrm-ui-enabled .mrm-card .mrm-card-read-toggle { font-size: 11px; }\n}\n\n@media (min-width: 761px) and (max-width: 1120px) {\n  .mrm-archive-overview { top: 126px; }\n}\n\n\n/* Phase 3: long archive continuity and PageTual feedback. */\nhtml.mrm-ui-enabled .mrm-card-grid > .mrm-card {\n  content-visibility: auto;\n  contain-intrinsic-size: 360px 520px;\n}\n.mrm-page-separator {\n  grid-column: 1 / -1;\n  display: flex;\n  min-height: 44px;\n  align-items: center;\n  justify-content: center;\n  gap: 9px;\n  margin: 8px 0 2px;\n  color: var(--mrm-muted);\n  font-size: 12px;\n  font-weight: 700;\n  letter-spacing: .01em;\n}\n.mrm-page-separator[hidden] { display: none !important; }\n.mrm-page-separator::before,\n.mrm-page-separator::after { content: \"\"; flex: 1 1 60px; height: 1px; background: var(--mrm-line); }\n.mrm-page-separator > span { color: var(--mrm-text); font-size: 13px; font-weight: 850; }\n.mrm-page-separator > small { font: inherit; color: var(--mrm-muted); }\n.mrm-page-load-status {\n  display: flex;\n  width: min(100%, 620px);\n  min-height: 48px;\n  box-sizing: border-box;\n  align-items: center;\n  justify-content: center;\n  gap: 10px;\n  margin: 22px auto 4px;\n  padding: 10px 14px;\n  border: 1px solid var(--mrm-line);\n  border-radius: 14px;\n  background: color-mix(in srgb, var(--mrm-surface) 94%, transparent);\n  color: var(--mrm-muted);\n  font-size: 13px;\n  font-weight: 700;\n}\n.mrm-page-load-status[hidden] { display: none !important; }\n.mrm-page-load-spinner { display: none; width: 16px; height: 16px; flex: 0 0 auto; border: 2px solid color-mix(in srgb, var(--mrm-accent) 25%, var(--mrm-line)); border-top-color: var(--mrm-accent); border-radius: 50%; }\n.mrm-page-load-status.is-busy .mrm-page-load-spinner { display: block; animation: mrm-page-load-spin .8s linear infinite; }\n.mrm-page-load-retry { min-height: 34px; display: inline-flex; align-items: center; padding: 0 11px; border-radius: 9px; background: var(--mrm-surface-2); color: var(--mrm-text) !important; font-size: 12px; font-weight: 800; text-decoration: none !important; }\n.mrm-page-load-retry[hidden] { display: none !important; }\n.mrm-scroll-position {\n  position: fixed;\n  right: max(14px, env(safe-area-inset-right));\n  bottom: max(18px, calc(env(safe-area-inset-bottom) + 12px));\n  z-index: 2147480700;\n  min-width: 72px;\n  box-sizing: border-box;\n  padding: 8px 11px;\n  border: 1px solid var(--mrm-line);\n  border-radius: 999px;\n  background: color-mix(in srgb, var(--mrm-surface) 92%, transparent);\n  box-shadow: 0 8px 24px rgba(0,0,0,.28);\n  color: var(--mrm-text);\n  font-size: 12px;\n  font-weight: 850;\n  text-align: center;\n  pointer-events: none;\n  backdrop-filter: blur(12px);\n}\n.mrm-scroll-position[hidden] { display: none !important; }\n@keyframes mrm-page-load-spin { to { transform: rotate(360deg); } }\n@media (prefers-reduced-motion: reduce) { .mrm-page-load-status.is-busy .mrm-page-load-spinner { animation: none; } }\n@media (max-width: 760px) {\n  .mrm-page-separator { min-height: 38px; gap: 7px; margin-top: 5px; font-size: 11px; }\n  .mrm-page-separator > span { font-size: 12px; }\n  .mrm-page-load-status { width: calc(100% - 16px); min-height: 44px; margin-top: 16px; font-size: 12px; }\n  .mrm-scroll-position { right: 10px; bottom: max(12px, calc(env(safe-area-inset-bottom) + 8px)); font-size: 11px; }\n}\n.mrm-archive-overview { transition: top .2s ease; }\nhtml.mrm-header-hidden .mrm-archive-overview { top: 10px; }\n@media (max-width: 760px) { html.mrm-header-hidden .mrm-archive-overview { top: 8px; } }\n@media (prefers-reduced-motion: reduce) { .mrm-archive-overview { transition: none !important; } }\n\n/* Phase 5: personal library and continue-reading shelf */\n#mrm-overview-saved-count { color: color-mix(in srgb, #ffd36a 78%, white); font-weight: 750; }\n#mrm-overview-saved-count[hidden], .mrm-continue-shelf[hidden] { display: none !important; }\n.mrm-continue-shelf { min-width: 0; display: grid; grid-template-columns: auto minmax(0,1fr); gap: 12px; align-items: center; border: 1px solid color-mix(in srgb, var(--mrm-accent) 28%, var(--mrm-line)); border-radius: 13px; padding: 8px 10px; background: color-mix(in srgb, var(--mrm-accent) 7%, var(--mrm-surface-2)); }\n.mrm-continue-heading { display: grid; gap: 2px; min-width: 126px; }\n.mrm-continue-heading strong { color: var(--mrm-text); font-size: 13px; }\n.mrm-continue-heading span { color: var(--mrm-muted); font-size: 11px; }\n.mrm-continue-items { min-width: 0; display: flex; gap: 7px; overflow-x: auto; overscroll-behavior-inline: contain; scrollbar-width: thin; }\n.mrm-continue-item { flex: 0 0 min(230px, 42vw); min-width: 0; min-height: 54px; display: grid; grid-template-columns: 38px minmax(0,1fr); gap: 8px; align-items: center; border: 1px solid var(--mrm-line); border-radius: 10px; padding: 6px 8px; background: var(--mrm-surface); color: var(--mrm-text); text-align: left; cursor: pointer; }\n.mrm-continue-item:hover { background: var(--mrm-surface-3); }\n.mrm-continue-item img { width: 38px; height: 44px; border-radius: 6px; object-fit: cover; object-position: center top; }\n.mrm-continue-copy { min-width: 0; display: grid; gap: 3px; }\n.mrm-continue-copy strong, .mrm-continue-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-continue-copy strong { font-size: 12px; }\n.mrm-continue-copy small { color: var(--mrm-muted); font-size: 10px; }\n\n.mrm-card-actions { grid-template-columns: minmax(0,1fr) minmax(70px,.72fr) 42px; }\n.mrm-reader-button { grid-column: 1 / 3; }\n.mrm-card-original { grid-column: 3; }\n.mrm-card-save-toggle { grid-column: 1; }\n.mrm-card-read-toggle { grid-column: 2 / 4; }\n.mrm-card-save-toggle { min-height: 36px; border: 0; border-radius: 9px; padding: 0 8px; background: transparent; color: var(--mrm-muted); font-size: 12px; font-weight: 750; cursor: pointer; }\n.mrm-card-save-toggle[aria-pressed=\"true\"] { background: color-mix(in srgb, #ffd36a 13%, var(--mrm-surface-2)); color: #ffe39a; }\n.mrm-card-save-toggle:hover, .mrm-card-read-toggle:hover { background: var(--mrm-surface-2); color: var(--mrm-text); }\n.mrm-is-saved { box-shadow: 0 10px 28px rgba(0,0,0,.22), inset 0 0 0 1px color-mix(in srgb, #ffd36a 30%, transparent); }\n\n/* Phase 6: primary target sizing and keyboard clarity */\n.mrm-overview-quick-filters button, .mrm-overview-density button, .mrm-overview-clear { min-height: 44px; }\n.mrm-reader-button, .mrm-card-original { min-height: 44px; }\n.mrm-card-save-toggle, .mrm-card-read-toggle { min-height: 40px; }\n@media (max-width: 760px) {\n  .mrm-continue-shelf { grid-template-columns: 1fr; gap: 7px; }\n  .mrm-continue-heading { grid-template-columns: auto 1fr; gap: 8px; align-items: baseline; }\n  .mrm-continue-item { flex-basis: min(220px, 72vw); }\n  .mrm-card-actions { grid-template-columns: minmax(0,1fr) minmax(62px,.7fr) 40px; }\n  .mrm-card-save-toggle, .mrm-card-read-toggle { font-size: 11px; }\n}\n\n/* base.css */\n:root {\n  --mrm-accent: #9b7cff;\n  --mrm-bg: #090a0f;\n  --mrm-surface: #14161d;\n  --mrm-surface-2: #1b1e27;\n  --mrm-surface-3: #242834;\n  --mrm-text: #f6f7fb;\n  --mrm-muted: #aeb4c2;\n  --mrm-line: rgba(255,255,255,.13);\n  --mrm-shadow: 0 18px 54px rgba(0,0,0,.38);\n  --mrm-radius: 16px;\n  --mrm-grid-desktop: 5;\n  --mrm-grid-tablet: 4;\n  --mrm-grid-mobile: 2;\n  --mrm-grid-gap: 18px;\n  --mrm-cover-ratio: .714;\n  --mrm-type-base: 16px;\n  --mrm-type-xs: 12px;\n  --mrm-type-sm: 13px;\n  --mrm-type-md: 15px;\n  --mrm-type-lg: 17px;\n  color-scheme: dark;\n}\nhtml.mrm-ui-enabled *, html.mrm-ui-enabled *::before, html.mrm-ui-enabled *::after { box-sizing: border-box; }\n.mrm-sr-only { position: fixed !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0 0 0 0) !important; white-space: nowrap !important; }\nhtml.mrm-ui-enabled { max-width: 100%; overflow-x: clip !important; background: var(--mrm-bg) !important; }\nhtml.mrm-ui-enabled body { max-width: 100%; margin: 0 !important; overflow-x: hidden !important; background: var(--mrm-bg) !important; color: var(--mrm-text) !important; }\nhtml.mrm-ui-enabled body, html.mrm-ui-enabled button, html.mrm-ui-enabled input, html.mrm-ui-enabled select { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif !important; }\n.mrm-site-toolbar, .mrm-archive-overview, .mrm-card-grid, .mrm-control-panel, .mrm-facet-modal, .mrm-reader-modal, #mrm-panel-launcher, #mrm-ui-recovery,\nhtml.mrm-ui-enabled .before-footer, html.mrm-ui-enabled .footer-widgets, html.mrm-ui-enabled .site-footer { font-size: var(--mrm-type-base) !important; }\n.mrm-site-toolbar button, .mrm-site-toolbar input, .mrm-archive-overview button, .mrm-archive-overview input, .mrm-archive-overview select,\n.mrm-card button, .mrm-control-panel button, .mrm-control-panel input, .mrm-control-panel select, .mrm-facet-modal button, .mrm-facet-modal input,\n.mrm-reader-modal button, .mrm-reader-modal input, .mrm-reader-modal select, #mrm-panel-launcher, #mrm-ui-recovery { font-size: inherit; }\nhtml.mrm-ui-enabled a { color: inherit; }\nhtml.mrm-ui-enabled .site-container { background: transparent !important; }\nhtml.mrm-ui-enabled .nav-primary,\nhtml.mrm-ui-enabled .site-header { display: none !important; }\nhtml.mrm-ui-disabled .mrm-site-toolbar { display: none !important; }\n\n.mrm-site-toolbar {\n  position: sticky;\n  z-index: 100000;\n  top: 0;\n  width: 100%;\n  border-bottom: 1px solid var(--mrm-line);\n  background: color-mix(in srgb, var(--mrm-surface) 92%, transparent);\n  color: var(--mrm-text);\n  box-shadow: 0 10px 34px rgba(0,0,0,.22);\n  backdrop-filter: blur(18px) saturate(145%);\n}\n.mrm-site-toolbar-inner {\n  width: min(100%, 1920px);\n  min-height: 68px;\n  margin-inline: auto;\n  padding: 10px clamp(16px, 2.4vw, 46px);\n  display: grid;\n  grid-template-columns: auto minmax(0,1fr) minmax(240px, 340px);\n  gap: clamp(14px, 2vw, 30px);\n  align-items: center;\n}\n.mrm-site-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none !important; white-space: nowrap; }\n.mrm-site-brand-mark { display: grid; place-items: center; min-width: 48px; min-height: 42px; border-radius: 13px; background: var(--mrm-accent); color: #09090d; font-size: 13px; font-weight: 950; letter-spacing: .05em; }\n.mrm-site-brand-copy { display: grid; line-height: 1.05; }\n.mrm-site-brand-copy strong { font-size: 15px; letter-spacing: -.01em; }\n.mrm-site-brand-copy small { margin-top: 4px; color: var(--mrm-muted); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }\n.mrm-site-nav { min-width: 0; overflow-x: auto; scrollbar-width: none; }\n.mrm-site-nav::-webkit-scrollbar { display: none; }\n.mrm-site-menu { display: flex !important; align-items: center; gap: 4px; width: max-content; margin: 0 !important; padding: 0 !important; list-style: none !important; }\n.mrm-site-menu > li { margin: 0 !important; padding: 0 !important; list-style: none !important; }\n.mrm-site-menu a { display: flex; min-height: 40px; align-items: center; padding: 0 11px; border-radius: 10px; color: var(--mrm-muted) !important; font-size: 13px; font-weight: 750; letter-spacing: .025em; text-decoration: none !important; text-transform: uppercase; white-space: nowrap; }\n.mrm-site-menu a:hover, .mrm-site-menu a:focus-visible { background: var(--mrm-surface-2); color: var(--mrm-text) !important; outline: none; }\n.mrm-site-search { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: stretch; min-width: 0; border: 1px solid var(--mrm-line); border-radius: 13px; background: var(--mrm-surface-2); overflow: hidden; }\n.mrm-site-search:focus-within { border-color: color-mix(in srgb, var(--mrm-accent) 65%, var(--mrm-line)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--mrm-accent) 16%, transparent); }\n.mrm-site-search input { min-width: 0; min-height: 44px; font-size: 14px !important; border: 0 !important; background: transparent !important; color: var(--mrm-text) !important; padding: 0 13px !important; box-shadow: none !important; }\n.mrm-site-search button { min-width: 76px; font-size: 13px; border: 0; border-left: 1px solid var(--mrm-line); background: color-mix(in srgb, var(--mrm-accent) 14%, var(--mrm-surface-2)); color: var(--mrm-text); font-weight: 800; cursor: pointer; }\n.mrm-site-search button:hover { background: color-mix(in srgb, var(--mrm-accent) 23%, var(--mrm-surface-2)); }\nhtml[data-mrm-border-header=\"off\"] .mrm-site-toolbar { border-bottom-color: transparent; }\n\nhtml.mrm-ui-enabled .site-inner { width: min(100%, 1920px) !important; max-width: 1920px !important; margin-inline: auto !important; padding: clamp(22px, 3vw, 46px) clamp(14px, 2.6vw, 48px) clamp(48px, 6vw, 86px) !important; }\nhtml.mrm-ui-enabled .content-sidebar-wrap,\nhtml.mrm-ui-enabled main.content,\nhtml.mrm-ui-enabled .content { width: 100% !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; float: none !important; }\n\nhtml.mrm-ui-enabled .before-footer,\nhtml.mrm-ui-enabled .footer-widgets,\nhtml.mrm-ui-enabled .site-footer { border: 0 !important; border-top: 1px solid var(--mrm-line) !important; background: var(--mrm-surface) !important; color: var(--mrm-text) !important; box-shadow: none !important; }\nhtml.mrm-ui-enabled .before-footer .wrap,\nhtml.mrm-ui-enabled .footer-widgets > .wrap,\nhtml.mrm-ui-enabled .site-footer > .wrap { width: min(100%, 1680px) !important; max-width: 1680px !important; margin-inline: auto !important; padding: clamp(26px, 4vw, 54px) clamp(18px, 3vw, 48px) !important; }\nhtml.mrm-ui-enabled .before-footer .widget-title,\nhtml.mrm-ui-enabled .footer-widgets .widget-title { margin: 0 0 18px !important; color: var(--mrm-text) !important; font-size: 13px !important; font-weight: 850 !important; letter-spacing: .12em !important; text-transform: uppercase !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px 18px; margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments > li { min-width: 0; margin: 0 !important; padding: 11px 13px !important; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-muted); font-size: 14px; line-height: 1.5; list-style: none !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments a { color: var(--mrm-text) !important; text-decoration: none !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments a:hover { color: var(--mrm-accent) !important; }\nhtml.mrm-ui-enabled .footer-widgets > .wrap { display: grid !important; grid-template-columns: repeat(3, minmax(0,1fr)); gap: clamp(24px, 4vw, 58px); }\nhtml.mrm-ui-enabled .footer-widgets .widget-area { width: auto !important; margin: 0 !important; float: none !important; }\nhtml.mrm-ui-enabled .footer-widgets .widget { margin: 0 0 26px !important; }\nhtml.mrm-ui-enabled .footer-widgets .tagcloud { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }\nhtml.mrm-ui-enabled .footer-widgets .tagcloud > a,\nhtml.mrm-ui-enabled .footer-widgets .menu a { display: inline-flex; min-height: 34px; align-items: center; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 7px 10px; background: var(--mrm-surface-2); color: var(--mrm-muted) !important; font-size: 12px !important; line-height: 1.2; text-decoration: none !important; }\nhtml.mrm-ui-enabled .footer-widgets .tagcloud > a:hover,\nhtml.mrm-ui-enabled .footer-widgets .menu a:hover { border-color: color-mix(in srgb, var(--mrm-accent) 55%, var(--mrm-line)); color: var(--mrm-text) !important; }\n.mrm-footer-more { flex-basis: 100%; margin-top: 10px; }\n.mrm-footer-more summary { width: fit-content; cursor: pointer; color: var(--mrm-accent); font-size: 13px; font-weight: 750; }\n.mrm-footer-more-content { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }\n#recentcomments .mrm-footer-more { grid-column: 1 / -1; }\n#recentcomments .mrm-footer-more-content { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px 18px; }\n#recentcomments .mrm-footer-more-content > li { min-width: 0; padding: 11px 13px; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-muted); list-style: none; }\nhtml.mrm-ui-enabled .site-footer { text-align: center; }\nhtml.mrm-ui-enabled .site-footer > .wrap { display: grid; gap: 16px; justify-items: center; padding-block: 30px !important; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary .menu { display: flex !important; flex-wrap: wrap; justify-content: center; gap: 5px 16px; margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary li { margin: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary a { color: var(--mrm-muted) !important; font-size: 12px; font-weight: 750; letter-spacing: .06em; text-decoration: none !important; text-transform: uppercase; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary a:hover { color: var(--mrm-accent) !important; }\nhtml.mrm-ui-enabled .site-footer .copyright,\nhtml.mrm-ui-enabled .site-footer p { max-width: 860px; margin: 0 !important; color: color-mix(in srgb, var(--mrm-muted) 82%, transparent) !important; font-size: 12px !important; line-height: 1.6; }\n\n#mrm-ui-recovery { position: fixed; right: 14px; bottom: 14px; z-index: 2147482000; display: none; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 10px 14px; background: var(--mrm-surface); color: var(--mrm-text); box-shadow: var(--mrm-shadow); }\nhtml.mrm-ui-disabled #mrm-ui-recovery { display: block; }\n\n@media (max-width: 1120px) {\n  .mrm-site-toolbar-inner { grid-template-columns: auto minmax(220px, 1fr); }\n  .mrm-site-nav { grid-column: 1 / -1; grid-row: 2; }\n  .mrm-site-search { grid-column: 2; grid-row: 1; }\n}\n@media (max-width: 760px) {\n  .mrm-site-toolbar { position: relative; }\n  .mrm-site-toolbar-inner { min-height: 0; grid-template-columns: 1fr; gap: 9px; padding: 10px 12px 12px; }\n  .mrm-site-brand { grid-column: 1; grid-row: 1; }\n  .mrm-site-brand-copy { display: none; }\n  .mrm-site-brand-mark { min-width: 54px; min-height: 40px; }\n  .mrm-site-search { grid-column: 1; grid-row: 2; }\n  .mrm-site-nav { grid-column: 1; grid-row: 3; }\n  .mrm-site-menu a { min-height: 40px; padding-inline: 11px; font-size: 13px; }\n  html.mrm-ui-enabled .site-inner { padding: 18px 10px 48px !important; }\n  html.mrm-ui-enabled .before-footer #recentcomments,\n  #recentcomments .mrm-footer-more-content,\n  html.mrm-ui-enabled .footer-widgets > .wrap { grid-template-columns: 1fr; }\n}\n@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }\n\n/* Phase 4: adaptive chrome and compact footer */\n.mrm-site-toolbar { transition: transform .2s ease, box-shadow .2s ease; will-change: transform; }\n.mrm-site-toolbar.mrm-site-toolbar-hidden { transform: translateY(calc(-100% - 2px)); box-shadow: none; }\n.mrm-site-toolbar-no-search .mrm-site-toolbar-inner { grid-template-columns: auto minmax(0,1fr); }\n.mrm-site-menu a[aria-current=\"page\"], .mrm-site-brand[aria-current=\"page\"] .mrm-site-brand-mark {\n  background: color-mix(in srgb, var(--mrm-accent) 22%, var(--mrm-surface-2));\n  color: var(--mrm-text) !important;\n  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mrm-accent) 42%, transparent);\n}\n.mrm-site-menu a[aria-current=\"page\"] { position: relative; }\n.mrm-site-menu a[aria-current=\"page\"]::after { content: \"\"; position: absolute; left: 12px; right: 12px; bottom: 4px; height: 2px; border-radius: 99px; background: var(--mrm-accent); }\n.mrm-site-more { position: relative; }\n.mrm-site-more > summary { min-height: 40px; display: flex; align-items: center; gap: 6px; border-radius: 10px; padding: 0 11px; color: var(--mrm-muted); font-size: 13px; font-weight: 750; letter-spacing: .025em; text-transform: uppercase; cursor: pointer; list-style: none; }\n.mrm-site-more > summary::-webkit-details-marker { display: none; }\n.mrm-site-more > summary::after { content: \"⌄\"; font-size: 11px; transition: transform .16s ease; }\n.mrm-site-more[open] > summary, .mrm-site-more > summary:hover, .mrm-site-more > summary:focus-visible { background: var(--mrm-surface-2); color: var(--mrm-text); outline: none; }\n.mrm-site-more[open] > summary::after { transform: rotate(180deg); }\n.mrm-site-more-menu { position: absolute; z-index: 100002; top: calc(100% + 8px); right: 0; width: min(260px, calc(100vw - 24px)); display: grid; gap: 3px; border: 1px solid var(--mrm-line); border-radius: 13px; padding: 7px; background: var(--mrm-surface); box-shadow: var(--mrm-shadow); }\n.mrm-site-more-menu a { min-height: 40px; display: flex; align-items: center; border-radius: 9px; padding: 0 11px; color: var(--mrm-muted) !important; font-size: 13px; font-weight: 700; text-decoration: none !important; text-transform: none; }\n.mrm-site-more-menu a:hover, .mrm-site-more-menu a:focus-visible { background: var(--mrm-surface-2); color: var(--mrm-text) !important; outline: none; }\n\nhtml.mrm-compact-footer-ready.mrm-ui-enabled .before-footer,\nhtml.mrm-compact-footer-ready.mrm-ui-enabled .footer-widgets,\nhtml.mrm-compact-footer-ready.mrm-ui-enabled .site-footer { display: none !important; }\n.mrm-compact-footer { width: 100%; border-top: 1px solid var(--mrm-line); background: color-mix(in srgb, var(--mrm-surface) 94%, var(--mrm-bg)); color: var(--mrm-text); font-size: var(--mrm-type-base) !important; }\n.mrm-compact-footer-grid { width: min(100%, 1680px); margin-inline: auto; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; padding: 24px clamp(16px, 3vw, 46px) 18px; }\n.mrm-compact-footer-section { min-width: 0; border: 1px solid var(--mrm-line); border-radius: 14px; background: color-mix(in srgb, var(--mrm-surface-2) 74%, transparent); overflow: clip; }\n.mrm-compact-footer-section > summary { min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 14px; color: var(--mrm-text); font-size: 13px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; cursor: pointer; list-style: none; }\n.mrm-compact-footer-section > summary::-webkit-details-marker { display: none; }\n.mrm-footer-chevron { color: var(--mrm-muted); transition: transform .16s ease; }\n.mrm-compact-footer-section[open] .mrm-footer-chevron { transform: rotate(180deg); }\n.mrm-compact-footer-body { padding: 0 13px 14px; }\n.mrm-compact-comments { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }\n.mrm-compact-comments > li, .mrm-compact-footer-overflow-content > li { margin: 0; padding: 9px 10px; border-radius: 9px; background: color-mix(in srgb, var(--mrm-surface) 78%, transparent); color: var(--mrm-muted); font-size: 12px; line-height: 1.45; list-style: none; }\n.mrm-compact-comments a { color: var(--mrm-text) !important; text-decoration: none !important; }\n.mrm-compact-link-cloud { display: flex; flex-wrap: wrap; gap: 6px; }\n.mrm-compact-link-cloud > a, .mrm-compact-footer-overflow-content > a { display: inline-flex; min-height: 32px; max-width: 100%; align-items: center; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 5px 9px; background: var(--mrm-surface); color: var(--mrm-muted) !important; font-size: 11px !important; line-height: 1.2; text-decoration: none !important; overflow-wrap: anywhere; }\n.mrm-compact-site-links { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 5px; }\n.mrm-compact-site-links > a { min-height: 36px; display: flex; align-items: center; border-radius: 9px; padding: 0 9px; color: var(--mrm-muted) !important; font-size: 12px; font-weight: 700; text-decoration: none !important; }\n.mrm-compact-site-links > a:hover, .mrm-compact-link-cloud a:hover { background: var(--mrm-surface-2); color: var(--mrm-text) !important; }\n.mrm-compact-footer-overflow { flex-basis: 100%; width: 100%; }\n.mrm-compact-footer-overflow > summary { width: fit-content; margin-top: 5px; color: var(--mrm-accent); font-size: 12px; font-weight: 800; cursor: pointer; list-style: none; }\n.mrm-compact-footer-overflow > summary::-webkit-details-marker { display: none; }\n.mrm-compact-footer-overflow-content { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }\n.mrm-footer-comments .mrm-compact-footer-overflow-content { display: grid; }\n.mrm-compact-copyright { width: min(100%, 1680px); margin-inline: auto; padding: 0 clamp(16px, 3vw, 46px) 22px; color: color-mix(in srgb, var(--mrm-muted) 82%, transparent); font-size: 11px; line-height: 1.5; text-align: center; }\n.mrm-compact-copyright p, .mrm-compact-copyright .copyright { margin: 0 !important; }\n.mrm-compact-copyright a { color: var(--mrm-muted) !important; }\n\n@media (max-width: 1120px) {\n  .mrm-site-toolbar-no-search .mrm-site-toolbar-inner { grid-template-columns: auto minmax(0,1fr); }\n  .mrm-site-toolbar-no-search .mrm-site-nav { grid-column: 2; grid-row: 1; }\n  .mrm-compact-footer-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }\n  .mrm-footer-links { grid-column: 1 / -1; }\n}\n@media (max-width: 760px) {\n  .mrm-site-toolbar { position: sticky; }\n  .mrm-site-toolbar-inner, .mrm-site-toolbar-no-search .mrm-site-toolbar-inner { grid-template-columns: auto minmax(0,1fr); gap: 8px; padding: 8px 10px; }\n  .mrm-site-brand { grid-column: 1; grid-row: 1; }\n  .mrm-site-nav, .mrm-site-toolbar-no-search .mrm-site-nav { grid-column: 2; grid-row: 1; overflow: visible; }\n  .mrm-site-menu { width: 100%; justify-content: flex-end; }\n  .mrm-site-menu > li:nth-child(n+4):not(.mrm-site-more-item) { display: none; }\n  .mrm-site-menu a { min-height: 40px; padding-inline: 9px; font-size: 12px; }\n  .mrm-site-more > summary { min-height: 40px; padding-inline: 9px; font-size: 12px; }\n  .mrm-site-more-menu { position: fixed; top: 58px; right: 10px; }\n  .mrm-site-search { display: none; }\n  .mrm-compact-footer-grid { grid-template-columns: 1fr; gap: 8px; padding: 16px 10px 12px; }\n  .mrm-compact-footer-section > summary { min-height: 50px; }\n  .mrm-compact-footer-section:not([open]) .mrm-compact-footer-body { display: none; }\n  .mrm-compact-site-links { grid-template-columns: 1fr 1fr; }\n  .mrm-compact-copyright { padding: 0 14px 18px; }\n}\n@media (prefers-reduced-motion: reduce) { .mrm-site-toolbar, .mrm-footer-chevron, .mrm-site-more > summary::after { transition: none !important; } }\nhtml.mrm-ui-disabled .mrm-compact-footer { display: none !important; }\n\n/* Phase 6: accessibility and interaction hardening */\n:root { --mrm-focus-ring: #f4efff; }\n.mrm-skip-link { position: fixed; z-index: 2147483646; top: 8px; left: 8px; transform: translateY(-160%); min-height: 44px; display: inline-flex; align-items: center; border: 2px solid var(--mrm-focus-ring); border-radius: 10px; padding: 0 14px; background: var(--mrm-bg); color: var(--mrm-text) !important; font-size: 14px; font-weight: 850; text-decoration: none !important; transition: transform .12s ease; }\n.mrm-skip-link:focus { transform: translateY(0); }\nhtml.mrm-ui-enabled :where(.mrm-site-toolbar, .mrm-archive-overview, .mrm-card-grid, .mrm-control-panel, .mrm-facet-modal, .mrm-metadata-popover, .mrm-reader-modal, .mrm-compact-footer, #mrm-panel-launcher, #mrm-ui-recovery) :focus-visible,\nhtml.mrm-ui-enabled :where(#mrm-panel-launcher, #mrm-ui-recovery):focus-visible { outline: 3px solid var(--mrm-focus-ring) !important; outline-offset: 2px !important; box-shadow: 0 0 0 5px color-mix(in srgb, var(--mrm-accent) 35%, transparent) !important; }\nhtml.mrm-panel-open, html.mrm-panel-open body { overflow: hidden !important; overscroll-behavior: none; }\n.mrm-settings-note { margin: 0; border-left: 3px solid color-mix(in srgb, var(--mrm-accent) 62%, var(--mrm-line)); padding: 9px 10px; background: var(--mrm-surface-2); color: var(--mrm-muted); font-size: 12px; line-height: 1.45; }\n@media (prefers-contrast: more) {\n  :root { --mrm-muted: #d7d9e0; --mrm-line: rgba(255,255,255,.34); }\n  .mrm-card, .mrm-archive-overview, .mrm-control-panel, .mrm-compact-footer-section { border-color: var(--mrm-line) !important; }\n}\n@media (prefers-reduced-motion: reduce) { .mrm-skip-link { transition: none; } }\nhtml.mrm-modal-open, html.mrm-modal-open body { overflow: hidden !important; overscroll-behavior: none; }\n\nhtml.mrm-metadata-open, html.mrm-metadata-open body { overflow: hidden !important; overscroll-behavior: none; }\n\n/* reader.css */\nhtml.mrm-reader-open, html.mrm-reader-open body { overflow: hidden !important; }\n.mrm-reader-modal { position: fixed; z-index: 2147483500; inset: 0; display: grid; grid-template-rows: auto auto minmax(0,1fr) auto; background: #08090c; color: var(--mrm-text); }\n.mrm-reader-modal[hidden] { display: none; }\nhtml[data-mrm-border-reader=\"on\"] .mrm-reader-modal { box-shadow: inset 0 0 0 1px var(--mrm-line); }\n.mrm-reader-toolbar { z-index: 3; display: grid; gap: 6px; padding: 8px 10px; background: rgba(15,17,23,.96); backdrop-filter: blur(14px); transition: transform .18s ease; }\n.mrm-reader-toolbar-primary { display: grid; grid-template-columns: auto auto minmax(0,1fr) auto auto; align-items: center; gap: 8px; }\n.mrm-reader-toolbar-primary h2 { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; text-align: center; }\n.mrm-reader-toolbar button, .mrm-reader-footer button { min-height: 42px; font-size: 14px; border: 0; border-radius: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 6px 10px; }\n.mrm-reader-toolbar-secondary { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; }\n.mrm-reader-toolbar-secondary button { flex: 0 0 auto; }\n.mrm-reader-progress { background: var(--mrm-surface); padding: 3px 10px; }\n.mrm-reader-progress input { width: 100%; accent-color: var(--mrm-accent); }\n.mrm-reader-body { min-height: 0; display: grid; grid-template-columns: 112px minmax(0,1fr); }\n.mrm-reader-thumbnails { overflow-y: auto; padding: 8px; background: #0f1117; }\n.mrm-reader-thumbnail { width: 100%; display: grid; gap: 4px; margin-bottom: 8px; border: 2px solid transparent; border-radius: 8px; overflow: hidden; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 3px; }\n.mrm-reader-thumbnail.is-active { border-color: var(--mrm-accent); }\n.mrm-reader-thumbnail img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; }\n.mrm-reader-stage { min-width: 0; min-height: 0; overflow: auto; scroll-snap-type: y proximity; background: #050608; }\n.mrm-reader-page { width: min(100%, 980px); margin: 0 auto; display: grid; justify-items: center; scroll-snap-align: start; }\n.mrm-reader-page img { display: block; max-width: 100%; width: auto; height: auto; background: #111; }\n.mrm-reader-page figcaption { padding: 6px 10px; color: var(--mrm-muted); font-size: 12px; }\n.mrm-reader-modal[data-view=\"strip-gaps\"] .mrm-reader-page { margin-block: 14px; }\n.mrm-reader-modal[data-view=\"paged\"] .mrm-reader-stage { display: grid; place-items: center; padding: 8px; }\n.mrm-reader-modal[data-view=\"paged\"] .mrm-reader-page { height: 100%; align-content: center; }\n.mrm-reader-modal[data-fit=\"height\"] .mrm-reader-page img { max-height: calc(100vh - 180px); width: auto; }\n.mrm-reader-modal[data-fit=\"width\"] .mrm-reader-page img { width: 100%; max-height: none; }\n.mrm-reader-modal[data-width=\"comfort\"] .mrm-reader-page { max-width: 920px; }\n.mrm-reader-modal[data-width=\"wide\"] .mrm-reader-page { max-width: 1480px; }\n.mrm-reader-modal[data-thumbnails=\"off\"] .mrm-reader-body { grid-template-columns: minmax(0,1fr); }\n.mrm-reader-modal[data-thumbnails=\"off\"] .mrm-reader-thumbnails { display: none; }\n.mrm-reader-comments { overflow: auto; padding: clamp(14px, 3vw, 40px); background: var(--mrm-bg); }\n.mrm-reader-status { place-self: center; padding: 22px; border-radius: 14px; background: var(--mrm-surface); }\n.mrm-reader-error { color: #ff9a9a; }\n.mrm-reader-footer { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 7px 10px; background: var(--mrm-surface); }\n.mrm-reader-mobile-zones { display: none; }\n.mrm-reader-modal.is-toolbar-hidden .mrm-reader-toolbar { transform: translateY(-100%); position: absolute; width: 100%; }\n.mrm-post-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 18px; }\n.mrm-post-actions button { min-height: 46px; font-size: 14px; border: 0; border-radius: 11px; padding: 10px 16px; background: var(--mrm-surface-2); color: var(--mrm-text); }\nhtml.mrm-ui-enabled .mrm-post-page .entry-content > div:has(> img.img-myreadingmanga) { display: grid; justify-items: center; }\nhtml.mrm-ui-enabled .mrm-post-page .img-myreadingmanga { max-width: min(100%, 1100px); height: auto; }\n@media (max-width: 760px) {\n  .mrm-reader-modal { grid-template-rows: auto auto minmax(0,1fr); }\n  .mrm-reader-toolbar { padding: 6px; }\n  .mrm-reader-toolbar-primary { grid-template-columns: auto minmax(0,1fr) auto; }\n  .mrm-reader-toolbar-primary [data-reader-action=\"previous-post\"], .mrm-reader-toolbar-primary [data-reader-action=\"next-post\"] { display: none; }\n  .mrm-reader-toolbar-secondary { max-width: 100vw; }\n  .mrm-reader-body { grid-template-columns: minmax(0,1fr); }\n  .mrm-reader-thumbnails { display: none; }\n  .mrm-reader-footer { display: none; }\n  .mrm-reader-mobile-zones { pointer-events: none; display: grid; grid-template-columns: 30% 40% 30%; position: absolute; inset: 112px 0 0; z-index: 2; }\n  .mrm-reader-mobile-zones button { pointer-events: auto; border: 0; background: transparent; }\n  .mrm-reader-page figcaption { display: none; }\n  .mrm-reader-modal[data-fit=\"height\"] .mrm-reader-page img { max-height: calc(100vh - 125px); }\n}\n\n.mrm-post-taxonomies { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 6px; }\n.mrm-reader-toolbar button:disabled, .mrm-reader-footer button:disabled { opacity: .42; cursor: not-allowed; }\n\n/* Inline post reading layout */\nhtml.mrm-ui-enabled .mrm-post-page main.content,\nhtml.mrm-ui-enabled .mrm-post-page .content,\nhtml.mrm-ui-enabled .mrm-post-page article.entry,\nhtml.mrm-ui-enabled .mrm-post-page .entry-content {\n  width: 100% !important;\n  max-width: none !important;\n  min-width: 0 !important;\n  float: none !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page article.entry {\n  margin: 0 !important;\n  padding: 0 !important;\n  background: transparent !important;\n  box-shadow: none !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-header,\nhtml.mrm-ui-enabled .mrm-post-page #mrm-post-actions,\nhtml.mrm-ui-enabled .mrm-post-page .entry-content > :not(div:has(> img.img-myreadingmanga)),\nhtml.mrm-ui-enabled .mrm-post-page #comments,\nhtml.mrm-ui-enabled .mrm-post-page .entry-comments {\n  box-sizing: border-box !important;\n  width: min(100%, 1100px) !important;\n  margin-inline: auto !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-header {\n  padding: clamp(14px, 2.5vw, 26px) !important;\n  border-radius: var(--mrm-radius);\n  background: var(--mrm-surface) !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-title {\n  margin: 0 !important;\n  color: var(--mrm-text) !important;\n  font-size: clamp(20px, 3vw, 32px) !important;\n  line-height: 1.25 !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-content > div:has(> img.img-myreadingmanga) {\n  display: grid !important;\n  justify-items: center;\n  width: 100% !important;\n  max-width: none !important;\n  min-width: 0 !important;\n  margin: 0 !important;\n  padding: 0 !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .img-myreadingmanga {\n  display: block !important;\n  width: min(100%, 1100px) !important;\n  max-width: 1100px !important;\n  min-width: 0 !important;\n  height: auto !important;\n  margin: 0 auto !important;\n  object-fit: contain !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .mrm-post-actions {\n  padding: 12px 0 18px;\n}\n@media (max-width: 680px) {\n  html.mrm-ui-enabled .mrm-post-page .site-inner { padding-inline: 0 !important; }\n  html.mrm-ui-enabled .mrm-post-page .entry-header,\n  html.mrm-ui-enabled .mrm-post-page #mrm-post-actions,\n  html.mrm-ui-enabled .mrm-post-page .entry-content > :not(div:has(> img.img-myreadingmanga)),\n  html.mrm-ui-enabled .mrm-post-page #comments,\n  html.mrm-ui-enabled .mrm-post-page .entry-comments { width: calc(100% - 24px) !important; }\n}\n\n/* Phase 4: reader continuity, focus mode, and mobile controls */\n.mrm-reader-toolbar-primary { grid-template-columns: auto auto minmax(110px, .55fr) minmax(0,1fr) auto minmax(110px, .55fr); }\n.mrm-reader-toolbar-primary [data-reader-action=\"previous-post\"],\n.mrm-reader-toolbar-primary [data-reader-action=\"next-post\"] { min-width: 0; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-reader-back-archive[hidden] { display: none !important; }\n.mrm-reader-progress { display: grid; gap: 4px; padding: 4px 10px 6px; }\n#mrm-reader-progress-meter { appearance: none; width: 100%; height: 3px; border: 0; border-radius: 999px; overflow: hidden; background: var(--mrm-surface-3); }\n#mrm-reader-progress-meter::-webkit-progress-bar { background: var(--mrm-surface-3); }\n#mrm-reader-progress-meter::-webkit-progress-value { background: var(--mrm-accent); }\n#mrm-reader-progress-meter::-moz-progress-bar { background: var(--mrm-accent); }\n.mrm-reader-progress-controls { display: grid; grid-template-columns: auto minmax(120px,1fr); gap: 10px; align-items: center; }\n#mrm-reader-progress-label { min-width: 132px; color: var(--mrm-muted); font-size: 11px; font-weight: 750; white-space: nowrap; }\n.mrm-reader-progress-controls input { min-width: 0; height: 18px; margin: 0; }\n.mrm-reader-mobile-controls { display: none; }\n.mrm-reader-focus-exit { position: fixed; z-index: 8; top: 12px; right: 12px; min-height: 40px; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 0 13px; background: color-mix(in srgb, var(--mrm-surface) 88%, transparent); color: var(--mrm-text); font-size: 12px; font-weight: 800; box-shadow: var(--mrm-shadow); backdrop-filter: blur(12px); }\n.mrm-reader-focus-exit[hidden] { display: none !important; }\n.mrm-reader-modal.is-focus-mode { grid-template-rows: minmax(0,1fr); }\n.mrm-reader-modal.is-focus-mode .mrm-reader-toolbar,\n.mrm-reader-modal.is-focus-mode .mrm-reader-progress,\n.mrm-reader-modal.is-focus-mode .mrm-reader-footer,\n.mrm-reader-modal.is-focus-mode .mrm-reader-thumbnails,\n.mrm-reader-modal.is-focus-mode .mrm-reader-mobile-controls { display: none !important; }\n.mrm-reader-modal.is-focus-mode .mrm-reader-body { grid-template-columns: minmax(0,1fr); grid-row: 1; }\n.mrm-reader-modal.is-focus-mode .mrm-reader-stage { height: 100dvh; }\n.mrm-reader-modal.is-image-zoomed .mrm-reader-stage { touch-action: pan-x pan-y; overflow: auto; }\n.mrm-reader-modal.is-image-zoomed .mrm-reader-page img { transform: scale(1.65); transform-origin: var(--mrm-zoom-origin, 50% 50%); transition: transform .16s ease; }\n\n@media (max-width: 980px) {\n  .mrm-reader-toolbar-primary { grid-template-columns: auto auto minmax(0,1fr) auto; }\n  .mrm-reader-toolbar-primary [data-reader-action=\"previous-post\"], .mrm-reader-toolbar-primary [data-reader-action=\"next-post\"] { display: none; }\n}\n@media (max-width: 760px) {\n  .mrm-reader-modal { grid-template-rows: auto auto minmax(0,1fr); }\n  .mrm-reader-toolbar-primary { grid-template-columns: auto auto minmax(0,1fr) auto; }\n  .mrm-reader-toolbar-primary .mrm-reader-back-archive { display: inline-flex; }\n  .mrm-reader-toolbar-primary h2 { font-size: 14px; }\n  .mrm-reader-progress { padding: 3px 7px 5px; }\n  .mrm-reader-progress-controls { grid-template-columns: auto minmax(80px,1fr); gap: 7px; }\n  #mrm-reader-progress-label { min-width: 112px; font-size: 10px; }\n  .mrm-reader-body { padding-bottom: calc(58px + env(safe-area-inset-bottom)); }\n  .mrm-reader-mobile-controls { position: absolute; z-index: 5; left: 8px; right: 8px; bottom: max(8px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: minmax(82px,1fr) auto minmax(82px,1fr); gap: 7px; align-items: center; border: 1px solid var(--mrm-line); border-radius: 15px; padding: 6px; background: color-mix(in srgb, var(--mrm-surface) 90%, transparent); box-shadow: 0 12px 34px rgba(0,0,0,.38); backdrop-filter: blur(14px); }\n  .mrm-reader-mobile-controls button { min-height: 42px; border: 0; border-radius: 10px; padding: 0 10px; background: var(--mrm-surface-2); color: var(--mrm-text); font-size: 12px; font-weight: 800; }\n  .mrm-reader-mobile-controls button:disabled { opacity: .42; }\n  #mrm-reader-mobile-page-count { min-width: 58px; color: var(--mrm-muted); font-size: 11px; font-weight: 800; text-align: center; white-space: nowrap; }\n  .mrm-reader-mobile-zones { bottom: calc(58px + env(safe-area-inset-bottom)); }\n  .mrm-reader-focus-exit { top: max(10px, env(safe-area-inset-top)); right: 10px; }\n  .mrm-reader-modal.is-focus-mode .mrm-reader-body { padding-bottom: 0; }\n  .mrm-reader-modal.is-focus-mode .mrm-reader-mobile-zones { inset: 0; bottom: 0; }\n}\n@media (prefers-reduced-motion: reduce) { .mrm-reader-modal.is-image-zoomed .mrm-reader-page img { transition: none; } }\n@media (max-width: 760px) {\n  .mrm-reader-modal[data-view=\"paged\"] .mrm-reader-mobile-zones { display: none; }\n}\n\n/* Phase 5-6: device-aware reader, saved state, and constrained-network polish */\n.mrm-reader-toolbar [data-reader-action=\"save\"][aria-pressed=\"true\"], .mrm-post-save[aria-pressed=\"true\"] { background: color-mix(in srgb, #ffd36a 16%, var(--mrm-surface-2)); color: #ffe39a; }\n.mrm-reader-toolbar button, .mrm-reader-footer button { min-height: 44px; }\n.mrm-reader-thumbnail:not(:has(img)) { min-height: 44px; place-items: center; font-weight: 850; }\n.mrm-reader-thumbnail:not(:has(img)) span { font-size: 12px; }\n.mrm-reader-page img:not([src]) { min-width: min(72vw, 520px); min-height: min(62vh, 720px); background: linear-gradient(110deg, #111 25%, #181a22 42%, #111 58%); }\n@media (max-width: 760px) {\n  .mrm-reader-mobile-controls button { min-height: 44px; }\n}\n\n/* settings.css */\n#mrm-panel-launcher { position: fixed; font-size: 14px; z-index: 2147481000; right: 18px; bottom: 20px; display: inline-flex; min-width: 112px; min-height: 48px; align-items: center; justify-content: center; gap: 8px; border: 1px solid color-mix(in srgb, var(--mrm-accent) 58%, var(--mrm-line)); border-radius: 999px; padding: 0 14px; background: color-mix(in srgb, var(--mrm-accent) 18%, var(--mrm-surface)); color: var(--mrm-text); font-weight: 850; box-shadow: var(--mrm-shadow); backdrop-filter: blur(14px); cursor: pointer; visibility: visible; transition: opacity .18s ease, transform .18s ease, visibility 0s linear 0s; }\n#mrm-panel-launcher:hover { background: color-mix(in srgb, var(--mrm-accent) 28%, var(--mrm-surface)); }\n#mrm-panel-launcher[aria-expanded=\"true\"], #mrm-panel-launcher.mrm-launcher-suppressed { opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(8px); transition: opacity .18s ease, transform .18s ease; }\n.mrm-launcher-icon { color: var(--mrm-accent); font-size: 17px; }\n.mrm-launcher-count { display: inline-grid; min-width: 23px; min-height: 23px; place-items: center; border-radius: 999px; background: var(--mrm-accent); color: #09090d; font-size: 12px; font-weight: 950; }\n.mrm-launcher-count[hidden] { display: none !important; }\nhtml[data-mrm-dock=\"left\"] #mrm-panel-launcher { right: auto; left: 18px; }\n.mrm-control-panel[hidden] { display: none !important; }\n.mrm-control-panel { position: fixed; z-index: 2147482000; inset: 10px 10px 10px auto; width: min(440px, calc(100vw - 20px)); display: grid; grid-template-rows: auto auto minmax(0,1fr); background: var(--mrm-surface); color: var(--mrm-text); border-radius: 20px; box-shadow: var(--mrm-shadow); overflow: hidden; }\nhtml[data-mrm-dock=\"left\"] .mrm-control-panel { inset: 10px auto 10px 10px; }\nhtml[data-mrm-border-panel=\"on\"] .mrm-control-panel { border: 1px solid var(--mrm-line); }\n.mrm-panel-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 18px; }\n.mrm-panel-header div { display: grid; gap: 4px; }\n.mrm-panel-header strong { font-size: 17px; }\n.mrm-panel-header span { color: var(--mrm-muted); font-size: 13px; }\n.mrm-panel-header button, .mrm-facet-modal header button { min-width: 44px; min-height: 44px; border: 0; border-radius: 50%; background: var(--mrm-surface-2); color: var(--mrm-text); font-size: 22px; cursor: pointer; }\n.mrm-panel-tabs { display: grid; grid-template-columns: repeat(3, 1fr); padding: 0 14px 14px; gap: 7px; }\n.mrm-panel-tabs button { min-height: 44px; font-size: 14px; border: 0; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-muted); cursor: pointer; }\n.mrm-panel-tabs button[aria-selected=\"true\"] { background: color-mix(in srgb, var(--mrm-accent) 24%, var(--mrm-surface-2)); color: var(--mrm-text); font-weight: 800; }\n.mrm-panel-scroll { overflow: auto; font-size: 15px; padding: 0 15px 20px; }\n.mrm-panel-scroll section { display: grid; gap: 15px; }\n.mrm-panel-scroll section[hidden] { display: none; }\n.mrm-field { display: grid; grid-template-columns: 1fr auto; gap: 7px 10px; align-items: center; }\n.mrm-field > input[type=\"search\"], .mrm-field > input[type=\"text\"], .mrm-field > select, .mrm-facet-group > input { grid-column: 1 / -1; font-size: 14px; width: 100%; min-height: 44px; border: 1px solid var(--mrm-line); border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 8px 11px; }\n.mrm-field > input[type=\"range\"] { grid-column: 1 / -1; width: 100%; accent-color: var(--mrm-accent); }\n.mrm-toggle-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; min-height: 44px; }\n.mrm-toggle-row input { width: 22px; height: 22px; accent-color: var(--mrm-accent); }\n.mrm-inline-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n.mrm-inline-actions button, .mrm-facet-more, [data-panel-section=\"theme\"] > button { min-height: 44px; font-size: 14px; border: 0; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-text); cursor: pointer; }\n.mrm-active-filters { display: flex; flex-wrap: wrap; min-width: 0; max-width: 100%; gap: 6px; overflow: visible; }\n.mrm-filter-chip { display: inline-flex; flex: 0 1 auto; min-width: 0; max-width: 100%; gap: 6px; align-items: center; overflow: hidden; color: var(--mrm-text); cursor: pointer; }\n.mrm-filter-chip-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-filter-chip-remove { flex: 0 0 auto; display: inline-grid; min-width: 16px; place-items: center; font-size: 15px; line-height: 1; }\n.mrm-facets { display: grid; gap: 8px; }\n.mrm-facet-group { border-radius: 12px; background: var(--mrm-surface-2); padding: 11px; }\n.mrm-facet-group summary { cursor: pointer; font-size: 15px; font-weight: 750; }\n.mrm-facet-group > input { margin-top: 10px; }\n.mrm-facet-list { display: grid; gap: 4px; margin-top: 8px; }\n.mrm-facet-term { display: grid; font-size: 14px; grid-template-columns: minmax(0,1fr) auto 72px 76px; gap: 6px; align-items: center; min-height: 38px; }\n.mrm-facet-term span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-facet-term small { color: var(--mrm-muted); }\n.mrm-facet-term button { min-height: 34px; border: 1px solid var(--mrm-line); border-radius: 8px; background: transparent; color: var(--mrm-muted); font-size: 12px; cursor: pointer; }\n.mrm-facet-term button[aria-pressed=\"true\"] { background: var(--mrm-accent); color: #09090d; border-color: transparent; font-weight: 800; }\n.mrm-border-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; border: 1px solid var(--mrm-line); border-radius: 12px; padding: 10px 12px; }\n.mrm-border-grid legend { padding-inline: 5px; }\n.mrm-facet-modal { position: fixed; z-index: 2147483000; inset: 0; display: grid; place-items: center; padding: 14px; background: rgba(0,0,0,.72); }\n.mrm-facet-modal-card { width: min(680px, 100%); max-height: min(84vh, 760px); display: grid; grid-template-rows: auto auto minmax(0,1fr) auto; gap: 12px; background: var(--mrm-surface); border-radius: 18px; padding: 16px; box-shadow: var(--mrm-shadow); }\n.mrm-facet-modal header { display: flex; justify-content: space-between; align-items: center; }\n.mrm-facet-modal input { min-height: 44px; font-size: 14px; border: 1px solid var(--mrm-line); border-radius: 10px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 8px 10px; }\n.mrm-facet-modal-list { overflow: auto; display: grid; gap: 5px; }\n.mrm-facet-modal-pagination { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }\n.mrm-facet-modal-pagination button { min-height: 42px; font-size: 14px; border: 0; border-radius: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); }\n.mrm-facet-modal-pagination button:disabled { opacity: .45; }\nhtml.mrm-ui-disabled #mrm-panel-launcher, html.mrm-ui-disabled #mrm-control-panel { display: none !important; }\n#mrm-native-search-controls { display: grid; gap: 8px; }\n#mrm-native-search-controls > button { min-height: 42px; border: 0; border-radius: 10px; background: color-mix(in srgb, var(--mrm-accent) 22%, var(--mrm-surface-2)); color: var(--mrm-text); font-weight: 750; }\n@media (max-width: 680px) { .mrm-control-panel { inset: 0 !important; width: 100vw; border-radius: 0; } #mrm-panel-launcher { right: 12px; bottom: 14px; min-width: 104px; } html[data-mrm-dock=\"left\"] #mrm-panel-launcher { left: 12px; } }\n\n.mrm-density-settings { display: grid; gap: 10px; margin: 0; border: 1px solid var(--mrm-line); border-radius: 14px; padding: 12px; }\n.mrm-density-settings legend { padding-inline: 6px; color: var(--mrm-text); font-size: 14px; font-weight: 800; }\n.mrm-density-options { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 7px; }\n.mrm-density-option { display: grid; min-height: 72px; align-content: center; gap: 4px; border: 1px solid var(--mrm-line); border-radius: 11px; padding: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); text-align: left; cursor: pointer; }\n.mrm-density-option strong { font-size: 13px; }\n.mrm-density-option span { color: var(--mrm-muted); font-size: 11px; line-height: 1.35; }\n.mrm-density-option[aria-checked=\"true\"] { border-color: color-mix(in srgb, var(--mrm-accent) 68%, var(--mrm-line)); background: color-mix(in srgb, var(--mrm-accent) 18%, var(--mrm-surface-2)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mrm-accent) 35%, transparent); }\n.mrm-grid-advanced { border-radius: 12px; background: var(--mrm-surface-2); padding: 11px; }\n.mrm-grid-advanced summary { cursor: pointer; font-size: 14px; font-weight: 750; }\n.mrm-grid-advanced-body { display: grid; gap: 14px; margin-top: 14px; }\n@media (max-width: 440px) { .mrm-density-options { grid-template-columns: 1fr; } .mrm-density-option { min-height: 58px; } }\n\n.mrm-view-section { display: grid !important; gap: 9px !important; padding: 11px; border-radius: 13px; background: var(--mrm-surface-2); }\n.mrm-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.mrm-section-heading strong { font-size: 14px; }\n.mrm-section-heading button { min-height: 34px; border: 0; border-radius: 9px; padding: 0 10px; background: color-mix(in srgb, var(--mrm-accent) 20%, var(--mrm-surface)); color: var(--mrm-text); font-size: 12px; font-weight: 800; }\n.mrm-filter-views { display: flex; flex-wrap: wrap; gap: 7px; }\n.mrm-filter-view { display: inline-flex; min-width: 0; border: 1px solid var(--mrm-line); border-radius: 999px; overflow: hidden; background: var(--mrm-surface); }\n.mrm-filter-view > button { min-height: 34px; border: 0; padding: 0 11px; background: transparent; color: var(--mrm-text); font-size: 12px; cursor: pointer; }\n.mrm-filter-view .mrm-filter-view-remove { width: 32px; padding: 0; border-left: 1px solid var(--mrm-line); color: var(--mrm-muted); }\n.mrm-facet-term button { padding-inline: 7px; white-space: nowrap; }\n.mrm-metadata-popover { position: fixed; z-index: 2147483500; left: var(--mrm-popover-left); top: var(--mrm-popover-top); width: min(360px, calc(100vw - 24px)); max-height: min(62vh, 520px); display: grid; grid-template-rows: auto minmax(0,1fr); border: 1px solid var(--mrm-line); border-radius: 16px; background: var(--mrm-surface); color: var(--mrm-text); box-shadow: var(--mrm-shadow); overflow: hidden; }\n.mrm-metadata-popover > header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 14px; border-bottom: 1px solid var(--mrm-line); }\n.mrm-metadata-popover > header strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }\n.mrm-metadata-popover > header button { min-width: 36px; min-height: 36px; border: 0; border-radius: 50%; background: var(--mrm-surface-2); color: var(--mrm-text); font-size: 19px; }\n.mrm-metadata-groups { overflow: auto; display: grid; gap: 14px; padding: 14px; }\n.mrm-metadata-group { display: grid; gap: 7px; }\n.mrm-metadata-group h3 { margin: 0; color: var(--mrm-muted); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }\n.mrm-metadata-group-chips { display: flex; flex-wrap: wrap; gap: 6px; }\n.mrm-metadata-group-chips button { min-height: 32px; max-width: 100%; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 4px 10px; background: var(--mrm-surface-2); color: var(--mrm-text); font-size: 12px; overflow-wrap: anywhere; }\n@media (max-width: 680px) { .mrm-control-panel { top: auto !important; height: min(92dvh, 860px); border-radius: 22px 22px 0 0; } .mrm-panel-header { padding-top: 14px; } .mrm-control-panel::before { content: \"\"; width: 42px; height: 4px; margin: 8px auto 0; border-radius: 99px; background: var(--mrm-line); } .mrm-metadata-popover { left: 0; right: 0; bottom: 0; top: auto; width: 100vw; max-height: 70dvh; border-radius: 22px 22px 0 0; } }\n\n/* Phase 6: modal background lock and touch targets */\n.mrm-facet-term button, .mrm-facet-more, .mrm-filter-view > button, .mrm-section-heading button, .mrm-metadata-group-chips button, .mrm-metadata-popover > header button { min-height: 40px; }\n@media (max-width: 760px) {\n  .mrm-facet-term button, .mrm-facet-more, .mrm-filter-view > button, .mrm-section-heading button, .mrm-metadata-group-chips button, .mrm-metadata-popover > header button { min-height: 44px; }\n}",
  };

  // module: 00-core.js
  MRM.events = new EventTarget();
  MRM.runtime = {
    page: null,
    cards: [],
    panelOpen: false,
    facetModalOpen: false,
    reader: null,
    archiveObserver: null,
    readerObserver: null,
    refreshTimer: 0,
    lastFocused: null,
  };
  
  MRM.selectors = Object.freeze({
    archiveCards: "article.post.entry:has(.entry-title-link)",
    titleLink: ".entry-title-link",
    coverImage: ".entry-image, .post-image",
    postArticle: "body.single-post article.post.entry, body.wp-singular article.post.entry",
    postContent: "article.post.entry > .entry-content, .single-post .entry-content",
    mangaImages: ".entry-content img.img-myreadingmanga, .entry-content img[class*='myreadingmanga']",
    comments: "#comments, #wpdcom, .wpdiscuz-comments",
    commentsCount: ".entry-comments-link, .wpd-thread-head .wpd-thread-info, [class*='comment-count']",
    nativeFacets: ".ep-filter-widget.widget_ep-facet, .widget_ep-facet",
    nativeFacetTitle: ".ep-filter-title",
    nativeFacetTerm: ".term[data-term-slug]",
    mainContent: ".content, main, .site-inner",
    pagination: ".pagination, .archive-pagination, .entry-pagination",
  });
  
  MRM.util = (() => {
    const text = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    const normalize = (value) => text(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
    const slugLabel = (value) => text(value).replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const q = (selector, root = document) => root.querySelector(selector);
    const qa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const create = (tag, options = {}) => {
      const node = document.createElement(tag);
      if (options.className) node.className = options.className;
      if (options.text !== undefined) node.textContent = options.text;
      if (options.html !== undefined) node.innerHTML = options.html;
      if (options.attrs) for (const [name, value] of Object.entries(options.attrs)) {
        if (value === false || value == null) continue;
        if (value === true) node.setAttribute(name, "");
        else node.setAttribute(name, String(value));
      }
      if (options.dataset) for (const [name, value] of Object.entries(options.dataset)) node.dataset[name] = String(value);
      return node;
    };
    const debounce = (fn, delay = 120) => {
      let timer = 0;
      return (...args) => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), delay);
      };
    };
    const throttle = (fn, delay = 120) => {
      let pending = false;
      let latest = null;
      return (...args) => {
        latest = args;
        if (pending) return;
        pending = true;
        window.setTimeout(() => {
          pending = false;
          fn(...latest);
        }, delay);
      };
    };
    const idle = (fn, timeout = 600) => {
      if ("requestIdleCallback" in window) return window.requestIdleCallback(fn, { timeout });
      return window.setTimeout(fn, 1);
    };
    const canonicalUrl = (raw) => {
      try {
        const url = new URL(raw, location.href);
        url.hash = "";
        url.searchParams.delete("output");
        return url.href.replace(/\/$/, "") + "/";
      } catch {
        return "";
      }
    };
    const bestSrcset = (srcset) => {
      const candidates = String(srcset || "").split(",").map((part) => {
        const [url, descriptor = "0w"] = part.trim().split(/\s+/);
        const score = Number.parseFloat(descriptor) || 0;
        return { url, score };
      }).filter((item) => item.url);
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0]?.url || "";
    };
    const imageSource = (img) => {
      if (!img) return "";
      const srcset = img.getAttribute("data-srcset") || img.getAttribute("data-lazy-srcset") || img.getAttribute("srcset");
      const candidates = [
        bestSrcset(srcset),
        img.getAttribute("data-lazy-src"),
        img.getAttribute("data-src"),
        img.getAttribute("data-original"),
        img.currentSrc,
        img.getAttribute("src"),
      ].filter(Boolean);
      return candidates.find((src) => !/^data:,$/.test(src) && !/^data:image\/svg\+xml/i.test(src)) || "";
    };
    const safeFetchDocument = async (url, signal) => {
      const target = new URL(url, location.href);
      if (target.hostname !== location.hostname) throw new Error("Cross-origin reader fetch blocked");
      const response = await fetch(target.href, { credentials: "include", signal, headers: { Accept: "text/html" } });
      if (!response.ok) throw new Error(`Reader fetch failed (${response.status})`);
      const html = await response.text();
      return new DOMParser().parseFromString(html, "text/html");
    };
    const unique = (items, keyFn = (item) => item) => {
      const seen = new Set();
      return items.filter((item) => {
        const key = keyFn(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    })[char]);
    const announce = (message) => {
      let region = q("#mrm-live-region");
      if (!region) {
        region = create("div", { attrs: { id: "mrm-live-region", role: "status", "aria-live": "polite" }, className: "mrm-sr-only" });
        document.body.append(region);
      }
      region.textContent = "";
      requestAnimationFrame(() => { region.textContent = message; });
    };
    const focusable = (root) => qa("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])", root)
      .filter((node) => !node.hidden && node.getClientRects().length);
    const trapFocus = (event, root) => {
      if (event.key !== "Tab") return;
      const nodes = focusable(root);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    const pageTitle = (doc = document) => text(q("article.post.entry .entry-title", doc)?.textContent || doc.title);
    return { text, normalize, slugLabel, clamp, q, qa, create, debounce, throttle, idle, canonicalUrl, imageSource, safeFetchDocument, unique, escapeHtml, announce, focusable, trapFocus, pageTitle };
  })();

  // module: 01-storage.js
  MRM.storage = (() => {
    const key = `${MRM.config.storagePrefix}:preferences`;
    const readKey = `${MRM.config.storagePrefix}:read-posts`;
    const progressKey = `${MRM.config.storagePrefix}:reader-progress`;
    const savedKey = `${MRM.config.storagePrefix}:saved-posts`;
    const facetCacheKey = `${MRM.config.storagePrefix}:facet-directory`;
    const readerCachePrefix = `${MRM.config.storagePrefix}:reader-pages:`;
    const defaults = Object.freeze({
      uiEnabled: true,
      dock: "right",
      accent: "#9b7cff",
      border: { header: false, cards: true, pagination: false, reader: false, panel: true, chips: true },
      grid: { density: "balanced", desktop: 5, tablet: 4, mobile: 2, gap: 18, ratio: 0.714, coverFit: "contain" },
      filters: { query: "", hideRead: false, onlyEnglish: false, onlySaved: false, sort: "default", include: {}, exclude: { tag: ["cuntboy", "ai", "shota"] } },
      reader: { view: "strip", width: "comfort", fit: "width", direction: "ltr", thumbnails: true, autoHideToolbar: true },
      readerProfiles: { desktop: {}, mobile: {} },
      savedViews: [],
    });
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const merge = (base, incoming) => {
      if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return base;
      const out = { ...base };
      for (const [name, value] of Object.entries(incoming)) {
        if (value && typeof value === "object" && !Array.isArray(value) && base[name] && typeof base[name] === "object") out[name] = merge(base[name], value);
        else out[name] = value;
      }
      return out;
    };
    const parse = (raw, fallback) => {
      try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
    };
    let preferences = merge(clone(defaults), parse(localStorage.getItem(key), {}));
    let readPosts = parse(localStorage.getItem(readKey), {});
    let readerProgress = parse(localStorage.getItem(progressKey), {});
    let savedPosts = parse(localStorage.getItem(savedKey), {});
    const persist = () => localStorage.setItem(key, JSON.stringify(preferences));
    const persistRead = () => localStorage.setItem(readKey, JSON.stringify(readPosts));
    const persistProgress = () => localStorage.setItem(progressKey, JSON.stringify(readerProgress));
    const persistSaved = () => localStorage.setItem(savedKey, JSON.stringify(savedPosts));
    const trimEntries = (records, limit) => Object.fromEntries(Object.entries(records)
      .sort((a, b) => (b[1].updatedAt || b[1].readAt || 0) - (a[1].updatedAt || a[1].readAt || 0))
      .slice(0, limit));
    const update = (patch) => {
      preferences = merge(preferences, patch);
      persist();
      MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
      return preferences;
    };
    const replaceFilters = (filters) => {
      preferences = { ...preferences, filters: clone(filters) };
      persist();
      MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
      return preferences;
    };
    const markRead = (url, title = "") => {
      const normalized = MRM.util.canonicalUrl(url);
      if (!normalized) return;
      readPosts[normalized] = { title: MRM.util.text(title), readAt: Date.now() };
      readPosts = trimEntries(readPosts, 5000);
      persistRead();
      MRM.events.dispatchEvent(new CustomEvent("read-history", { detail: { url: normalized, read: true } }));
    };
    const unmarkRead = (url, options = {}) => {
      const normalized = MRM.util.canonicalUrl(url);
      if (!normalized) return;
      delete readPosts[normalized];
      if (options.clearProgress !== false) delete readerProgress[normalized];
      persistRead();
      persistProgress();
      MRM.events.dispatchEvent(new CustomEvent("read-history", { detail: { url: normalized, read: false } }));
      MRM.events.dispatchEvent(new CustomEvent("reader-progress", { detail: { url: normalized, progress: null } }));
    };
    const isRead = (url) => Boolean(readPosts[MRM.util.canonicalUrl(url)]);
    const isSaved = (url) => Boolean(savedPosts[MRM.util.canonicalUrl(url)]);
    const savePost = (url, title = "", image = "") => {
      const normalized = MRM.util.canonicalUrl(url);
      if (!normalized) return null;
      savedPosts[normalized] = { title: MRM.util.text(title), image: String(image || ""), savedAt: Date.now(), updatedAt: Date.now() };
      savedPosts = trimEntries(savedPosts, 2000);
      persistSaved();
      MRM.events.dispatchEvent(new CustomEvent("saved-posts", { detail: { url: normalized, saved: true } }));
      return savedPosts[normalized];
    };
    const unsavePost = (url) => {
      const normalized = MRM.util.canonicalUrl(url);
      if (!normalized || !savedPosts[normalized]) return;
      delete savedPosts[normalized];
      persistSaved();
      MRM.events.dispatchEvent(new CustomEvent("saved-posts", { detail: { url: normalized, saved: false } }));
    };
    const toggleSaved = (url, title = "", image = "") => isSaved(url) ? (unsavePost(url), false) : Boolean(savePost(url, title, image));
    const readerDevice = () => matchMedia("(max-width: 760px)").matches ? "mobile" : "desktop";
    const readerPreferences = () => ({ ...preferences.reader, ...(preferences.readerProfiles?.[readerDevice()] || {}) });
    const updateReaderPreferences = (patch) => {
      const device = readerDevice();
      const profiles = preferences.readerProfiles || { desktop: {}, mobile: {} };
      const nextProfile = { ...(profiles[device] || {}), ...patch };
      preferences = { ...preferences, readerProfiles: { ...profiles, [device]: nextProfile } };
      persist();
      MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
      return readerPreferences();
    };
    const getReaderProgress = (url) => readerProgress[MRM.util.canonicalUrl(url)] || null;
    const setReaderProgress = (url, title, pageIndex, pageCount) => {
      const normalized = MRM.util.canonicalUrl(url);
      const total = Math.max(1, Number(pageCount) || 1);
      const index = MRM.util.clamp(Number(pageIndex) || 0, 0, total - 1);
      if (!normalized) return null;
      const previous = readerProgress[normalized];
      const completed = index >= total - 1;
      if (previous?.pageIndex === index && previous?.pageCount === total && previous?.completed === completed) return previous;
      const progress = {
        title: MRM.util.text(title),
        pageIndex: index,
        pageCount: total,
        percent: Math.round(((index + 1) / total) * 100),
        completed,
        updatedAt: Date.now(),
      };
      readerProgress[normalized] = progress;
      readerProgress = trimEntries(readerProgress, 2000);
      persistProgress();
      if (completed && !isRead(normalized)) markRead(normalized, title);
      MRM.events.dispatchEvent(new CustomEvent("reader-progress", { detail: { url: normalized, progress } }));
      return progress;
    };
    const saveView = (name, filters = preferences.filters) => {
      const cleanName = MRM.util.text(name).slice(0, 48);
      if (!cleanName) return null;
      const view = { id: `view-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: cleanName, filters: clone(filters) };
      preferences = { ...preferences, savedViews: [...(preferences.savedViews || []).filter((item) => item.name !== cleanName), view].slice(-12) };
      persist();
      MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
      return view;
    };
    const deleteView = (id) => {
      preferences = { ...preferences, savedViews: (preferences.savedViews || []).filter((item) => item.id !== id) };
      persist();
      MRM.events.dispatchEvent(new CustomEvent("preferences", { detail: preferences }));
    };
    const applyView = (view) => view?.filters && replaceFilters(clone(view.filters));
    const clearRead = () => {
      readPosts = {};
      readerProgress = {};
      localStorage.removeItem(readKey);
      localStorage.removeItem(progressKey);
      MRM.events.dispatchEvent(new Event("read-history"));
      MRM.events.dispatchEvent(new Event("reader-progress"));
    };
    const clearSaved = () => {
      savedPosts = {};
      localStorage.removeItem(savedKey);
      MRM.events.dispatchEvent(new Event("saved-posts"));
    };
    const getFacetCache = () => {
      const cached = parse(localStorage.getItem(facetCacheKey), null);
      if (!cached || Date.now() - cached.savedAt > 14 * 24 * 60 * 60 * 1000) return null;
      return cached.value;
    };
    const setFacetCache = (value) => localStorage.setItem(facetCacheKey, JSON.stringify({ savedAt: Date.now(), value }));
    const readerCacheKey = (url) => `${readerCachePrefix}${encodeURIComponent(MRM.util.canonicalUrl(url))}`;
    const getReaderCache = (url) => {
      try {
        const cached = parse(sessionStorage.getItem(readerCacheKey(url)), null);
        if (!cached || Date.now() - cached.savedAt > 30 * 60 * 1000 || !Array.isArray(cached.pages) || !cached.pages.length) return null;
        return cached;
      } catch { return null; }
    };
    const setReaderCache = (url, title, pages) => {
      try {
        const compactPages = pages.slice(0, 1000).map(({ src, alt, width, height }) => ({ src, alt, width, height }));
        sessionStorage.setItem(readerCacheKey(url), JSON.stringify({ savedAt: Date.now(), title: MRM.util.text(title), pages: compactPages }));
      } catch { /* Session storage can be unavailable in hardened contexts. */ }
    };
    return {
      defaults,
      get preferences() { return preferences; },
      get readPosts() { return readPosts; },
      get readerProgress() { return readerProgress; },
      get savedPosts() { return savedPosts; },
      update,
      replaceFilters,
      markRead,
      unmarkRead,
      isRead,
      isSaved,
      savePost,
      unsavePost,
      toggleSaved,
      readerDevice,
      readerPreferences,
      updateReaderPreferences,
      getReaderProgress,
      setReaderProgress,
      saveView,
      deleteView,
      applyView,
      clearRead,
      clearSaved,
      getFacetCache,
      setFacetCache,
      getReaderCache,
      setReaderCache,
    };
  })();

  // module: 02-site-model.js
  MRM.site = (() => {
    const facetPrefixes = Object.freeze({
      lang: "Language",
      category: "Category",
      genre: "Genre",
      tag: "Tag",
      artist: "Artist",
      pairing: "Pairing",
      group: "Group",
      status: "Status",
    });
    const ignoredClasses = new Set(["status-publish"]);
    const detectPage = (doc = document) => {
      const body = doc.body;
      if (!body) return "unknown";
      if (body.matches(".single-post, .wp-singular") || MRM.util.q(MRM.selectors.mangaImages, doc)) return "post";
      if (body.matches(".search, .search-results") || MRM.util.q(MRM.selectors.nativeFacets, doc)) return "search";
      if (MRM.util.qa(MRM.selectors.archiveCards, doc).length) return "archive";
      return "unknown";
    };
    const taxonomiesFromClasses = (article) => {
      const result = {};
      for (const className of article.classList) {
        const index = className.indexOf("-");
        if (index < 1) continue;
        const prefix = className.slice(0, index);
        const value = className.slice(index + 1);
        if (!facetPrefixes[prefix] || !value || ignoredClasses.has(className) || /^\d+$/.test(value)) continue;
        if (!result[prefix]) result[prefix] = [];
        result[prefix].push(value);
      }
      for (const values of Object.values(result)) values.sort();
      return result;
    };
    const parseCard = (article, order) => {
      const link = MRM.util.q(MRM.selectors.titleLink, article) || MRM.util.q("a[href]", article);
      if (!link) return null;
      const url = MRM.util.canonicalUrl(link.href);
      if (!url || new URL(url).hostname !== location.hostname) return null;
      const title = MRM.util.text(link.textContent || article.getAttribute("aria-label"));
      const taxonomies = taxonomiesFromClasses(article);
      const image = MRM.util.q(MRM.selectors.coverImage, article);
      const haystack = MRM.util.normalize([title, ...Object.values(taxonomies).flat().map(MRM.util.slugLabel)].join(" "));
      return { article, link, image, url, title, order, taxonomies, haystack, isEnglish: taxonomies.lang?.includes("english") || /\[eng(?:lish)?\]/i.test(title) };
    };
    const collectCards = (root = document) => {
      const nodes = [];
      if (root instanceof Element && root.matches(MRM.selectors.archiveCards)) nodes.push(root);
      if (root && typeof root.querySelectorAll === "function") nodes.push(...MRM.util.qa(MRM.selectors.archiveCards, root));
      return MRM.util.unique(nodes)
        .filter((article) => !article.closest(".yarpp-related, .related-posts, #comments"))
        .map(parseCard)
        .filter(Boolean);
    };
    const nativeFacets = (doc = document) => {
      const groups = {};
      for (const widget of MRM.util.qa(MRM.selectors.nativeFacets, doc)) {
        const rawTitle = MRM.util.text(MRM.util.q(MRM.selectors.nativeFacetTitle, widget)?.textContent).toLocaleLowerCase();
        let type = Object.keys(facetPrefixes).find((prefix) => rawTitle.includes(prefix));
        if (rawTitle.includes("circle") || rawTitle.includes("artist")) type = "artist";
        if (!type) continue;
        const terms = MRM.util.qa(MRM.selectors.nativeFacetTerm, widget).map((term) => {
          const anchor = MRM.util.q("a[href]", term);
          const countText = MRM.util.text(MRM.util.q("span", term)?.textContent).replace(/[^\d]/g, "");
          return {
            slug: term.dataset.termSlug,
            name: term.dataset.termName || MRM.util.text(anchor?.childNodes?.[1]?.textContent || anchor?.textContent).replace(/\(\d+\)$/, "").trim(),
            count: Number(countText) || 0,
            href: anchor?.href || "",
          };
        }).filter((term) => term.slug);
        if (terms.length) groups[type] = terms;
      }
      return groups;
    };
    const syntheticFacets = (cards) => {
      const counts = {};
      for (const card of cards) for (const [type, values] of Object.entries(card.taxonomies)) {
        counts[type] ||= {};
        for (const value of values) counts[type][value] = (counts[type][value] || 0) + 1;
      }
      return Object.fromEntries(Object.entries(counts).map(([type, values]) => [type, Object.entries(values)
        .map(([slug, count]) => ({ slug, name: MRM.util.slugLabel(slug), count, href: "" }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))]));
    };
    const extractImages = (doc = document) => {
      const content = MRM.util.q(MRM.selectors.postContent, doc) || doc;
      const selectors = [
        MRM.selectors.mangaImages,
        ".entry-content img[data-src]",
        ".entry-content img[data-lazy-src]",
        ".entry-content picture img",
      ].join(",");
      const images = MRM.util.qa(selectors, content).map((img, index) => {
        const src = MRM.util.imageSource(img);
        const width = Number(img.getAttribute("width")) || img.naturalWidth || 0;
        const height = Number(img.getAttribute("height")) || img.naturalHeight || 0;
        const marker = MRM.util.normalize(`${img.className} ${img.alt} ${src}`);
        if (!src || /avatar|emoji|logo|icon|banner|advert|gravatar/.test(marker)) return null;
        if (width && height && width < 250 && height < 250) return null;
        return { src: new URL(src, doc.baseURI || location.href).href, alt: MRM.util.text(img.alt) || `Page ${index + 1}`, width, height };
      }).filter(Boolean);
      return MRM.util.unique(images, (item) => item.src);
    };
    const commentsCount = (doc = document) => {
      const candidates = MRM.util.qa(MRM.selectors.commentsCount, doc).map((node) => MRM.util.text(node.textContent));
      for (const candidate of candidates) {
        const match = candidate.match(/\d+/);
        if (match) return Number(match[0]);
      }
      return MRM.util.q(MRM.selectors.comments, doc) ? null : 0;
    };
    const adjacentLinks = (doc = document) => {
      const prev = MRM.util.q("a[rel~='prev'], .previous a, .pagination-previous a, .adjacent-entry-pagination .previous a", doc);
      const next = MRM.util.q("a[rel~='next'], .next a, .pagination-next a, .adjacent-entry-pagination .next a", doc);
      return { prev: prev?.href || "", next: next?.href || "" };
    };
    return { facetPrefixes, detectPage, taxonomiesFromClasses, parseCard, collectCards, nativeFacets, syntheticFacets, extractImages, commentsCount, adjacentLinks };
  })();

  // module: 03-theme.js
  MRM.theme = (() => {
    const styleId = "mrm-reimagined-styles";
    const densityPresets = Object.freeze({
      comfortable: { desktop: 4, tablet: 3, mobile: 1, gap: 24 },
      balanced: { desktop: 5, tablet: 4, mobile: 2, gap: 18 },
      compact: { desktop: 6, tablet: 5, mobile: 2, gap: 12 },
      custom: null,
    });
    const install = () => {
      if (!document.getElementById(styleId)) {
        const style = MRM.util.create("style", { attrs: { id: styleId }, text: MRM.css });
        document.documentElement.append(style);
      }
      apply(MRM.storage.preferences);
    };
    const apply = (preferences) => {
      const root = document.documentElement;
      const density = densityPresets[preferences.grid.density] ? preferences.grid.density : "custom";
      const grid = densityPresets[density] || preferences.grid;
      root.classList.toggle("mrm-ui-enabled", Boolean(preferences.uiEnabled));
      root.classList.toggle("mrm-ui-disabled", !preferences.uiEnabled);
      root.dataset.mrmDock = preferences.dock;
      root.dataset.mrmDensity = density;
      root.dataset.mrmCoverFit = preferences.grid.coverFit === "cover" ? "cover" : "contain";
      root.style.setProperty("--mrm-accent", preferences.accent);
      root.style.setProperty("--mrm-grid-desktop", grid.desktop);
      root.style.setProperty("--mrm-grid-tablet", grid.tablet);
      root.style.setProperty("--mrm-grid-mobile", grid.mobile);
      root.style.setProperty("--mrm-grid-gap", `${grid.gap}px`);
      root.style.setProperty("--mrm-cover-ratio", preferences.grid.ratio);
      for (const [name, enabled] of Object.entries(preferences.border)) root.dataset[`mrmBorder${name[0].toUpperCase()}${name.slice(1)}`] = enabled ? "on" : "off";
      document.body?.classList.toggle("mrm-reader-capable", true);
    };
    MRM.events.addEventListener("preferences", (event) => apply(event.detail));
    return { install, apply, densityPresets };
  })();

  // module: 04-facets.js
  MRM.facets = (() => {
    const paramFor = Object.freeze({ lang: "ep_filter_lang", category: "ep_filter_category", genre: "ep_filter_genre", tag: "ep_filter_post_tag", artist: "ep_filter_artist", pairing: "ep_filter_pairing", group: "ep_filter_group", status: "ep_filter_status" });
    let directory = {};
    const buildDirectory = (cards) => {
      const native = MRM.site.nativeFacets();
      const synthetic = MRM.site.syntheticFacets(cards);
      const cached = MRM.storage.getFacetCache() || {};
      directory = {};
      for (const type of Object.keys(MRM.site.facetPrefixes)) {
        const merged = new Map();
        for (const source of [cached[type] || [], synthetic[type] || [], native[type] || []]) for (const term of source) {
          const prior = merged.get(term.slug) || {};
          merged.set(term.slug, { ...prior, ...term, count: Math.max(prior.count || 0, term.count || 0) });
        }
        if (merged.size) directory[type] = [...merged.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      }
      if (Object.keys(native).length) MRM.storage.setFacetCache(directory);
      return directory;
    };
    const activeFor = (mode, type) => MRM.storage.preferences.filters[mode]?.[type] || [];
    const setActive = (mode, type, values) => {
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters[mode] ||= {};
      if (values.length) filters[mode][type] = values;
      else delete filters[mode][type];
      MRM.storage.replaceFilters(filters);
    };
    const toggle = (mode, type, slug) => {
      const current = new Set(activeFor(mode, type));
      current.has(slug) ? current.delete(slug) : current.add(slug);
      const otherMode = mode === "include" ? "exclude" : "include";
      const other = new Set(activeFor(otherMode, type));
      other.delete(slug);
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters[mode] ||= {}; filters[otherMode] ||= {};
      current.size ? filters[mode][type] = [...current] : delete filters[mode][type];
      other.size ? filters[otherMode][type] = [...other] : delete filters[otherMode][type];
      MRM.storage.replaceFilters(filters);
    };
    const matches = (card, filters) => {
      for (const [type, values] of Object.entries(filters.include || {})) {
        if (!values.length) continue;
        const cardValues = new Set(card.taxonomies[type] || []);
        if (!values.some((value) => cardValues.has(value))) return false;
      }
      for (const [type, values] of Object.entries(filters.exclude || {})) {
        if (!values.length) continue;
        const cardValues = new Set(card.taxonomies[type] || []);
        if (values.some((value) => cardValues.has(value))) return false;
      }
      return true;
    };
    const nativeSortValue = () => {
      const url = new URL(location.href);
      return url.searchParams.get("ep_sort") || MRM.util.q("#ep-sort")?.value || "";
    };
    const nativeApplyUrl = (filters = MRM.storage.preferences.filters, sortValue = nativeSortValue()) => {
      if (MRM.runtime.page !== "search") return "";
      const url = new URL(location.href);
      for (const [type, parameter] of Object.entries(paramFor)) {
        url.searchParams.delete(parameter);
        const included = filters.include?.[type] || [];
        if (included.length) url.searchParams.set(parameter, included.join(","));
      }
      if (sortValue) url.searchParams.set("ep_sort", sortValue);
      else url.searchParams.delete("ep_sort");
      return url.href;
    };
    const applyNative = (sortValue = nativeSortValue()) => {
      const target = nativeApplyUrl(MRM.storage.preferences.filters, sortValue);
      if (target && target !== location.href) location.assign(target);
    };
    const syncFromUrl = () => {
      if (MRM.runtime.page !== "search") return;
      const url = new URL(location.href);
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters.include ||= {};
      let changed = false;
      for (const [type, parameter] of Object.entries(paramFor)) {
        const values = (url.searchParams.get(parameter) || "").split(",").map((value) => value.trim()).filter(Boolean);
        const prior = filters.include[type] || [];
        if (JSON.stringify(values) !== JSON.stringify(prior)) changed = true;
        if (values.length) filters.include[type] = values;
        else delete filters.include[type];
      }
      if (changed) MRM.storage.replaceFilters(filters);
    };
    const clear = () => {
      const filters = structuredClone(MRM.storage.preferences.filters);
      filters.include = {}; filters.exclude = {};
      MRM.storage.replaceFilters(filters);
    };
    return { paramFor, buildDirectory, get directory() { return directory; }, activeFor, setActive, toggle, matches, nativeSortValue, nativeApplyUrl, applyNative, syncFromUrl, clear };
  })();

  // module: 05-archive.js
  MRM.archive = (() => {
    const enhancedAttr = "data-mrm-enhanced";
    const pageTualCandidateAttr = "data-mrm-page-tual-candidate";
    const pageTualUiSelector = ".pagetual_pageBar, .autopagerize_page_info, #pagetual-sideController, [id^='pagetual_pageBar'], [id^='pagetual-sideController'], [name^='pagetual-iframe'], iframe[name^='pagetual-iframe']";
    const ignoredMutationSelector = ".mrm-control-panel, .mrm-facet-modal, .mrm-reader-modal, #mrm-site-toolbar, #mrm-archive-overview";
    const pendingRoots = new Set();
    const handledPageTualEvents = new WeakSet();
    let overview = null;
    let scanTimer = 0;
    let pageSequence = 1;
    let pageLoadTimer = 0;
    let pageLoadStatus = null;
    let positionIndicator = null;
    let positionHideTimer = 0;
    let positionFrame = 0;
    const intersectingCards = new Set();
  
    const activeFilterCount = (filters = MRM.storage.preferences.filters) => {
      let count = Number(Boolean(filters.query)) + Number(Boolean(filters.hideRead)) + Number(Boolean(filters.onlyEnglish)) + Number(Boolean(filters.onlySaved));
      for (const mode of ["include", "exclude"]) for (const values of Object.values(filters[mode] || {})) count += values.length;
      return count;
    };
  
    const renderContinueShelf = () => {
      const shelf = MRM.util.q("#mrm-continue-shelf");
      const host = MRM.util.q(".mrm-continue-items", shelf || document);
      if (!shelf || !host) return;
      const active = MRM.runtime.cards.map((card) => ({ card, progress: MRM.storage.getReaderProgress(card.url) }))
        .filter(({ card, progress }) => progress && !progress.completed && !MRM.storage.isRead(card.url))
        .sort((a, b) => (b.progress.updatedAt || 0) - (a.progress.updatedAt || 0))
        .slice(0, 6);
      host.replaceChildren();
      for (const { card, progress } of active) {
        const button = MRM.util.create("button", { className: "mrm-continue-item", attrs: { type: "button", "aria-label": `Continue ${card.title} at page ${progress.pageIndex + 1}` } });
        if (card.image) button.append(MRM.util.create("img", { attrs: { src: MRM.util.imageSource(card.image), alt: "", loading: "lazy", decoding: "async" } }));
        const copy = MRM.util.create("span", { className: "mrm-continue-copy" });
        copy.append(MRM.util.create("strong", { text: card.title }), MRM.util.create("small", { text: `Page ${progress.pageIndex + 1} of ${progress.pageCount} · ${progress.percent}%` }));
        button.append(copy);
        button.addEventListener("click", () => MRM.reader.open(card.url, { sequence: visibleCards().map((item) => item.url), trigger: button }));
        host.append(button);
      }
      shelf.hidden = active.length === 0;
    };
  
    const updateResultUI = (visible, total) => {
      MRM.util.q("#mrm-result-count")?.replaceChildren(document.createTextNode(`${visible} of ${total} results`));
      MRM.util.q("#mrm-overview-count")?.replaceChildren(document.createTextNode(String(visible)));
      MRM.util.q("#mrm-overview-loaded")?.replaceChildren(document.createTextNode(`${total} loaded`));
      const inProgress = Object.values(MRM.storage.readerProgress).filter((progress) => !progress.completed).length;
      const progressLabel = MRM.util.q("#mrm-overview-progress-count");
      if (progressLabel) {
        progressLabel.textContent = inProgress ? `${inProgress} in progress` : "Nothing in progress";
        progressLabel.hidden = inProgress === 0;
      }
      const savedCount = Object.keys(MRM.storage.savedPosts).length;
      const savedLabel = MRM.util.q("#mrm-overview-saved-count");
      if (savedLabel) {
        savedLabel.textContent = savedCount ? `${savedCount} saved` : "Nothing saved";
        savedLabel.hidden = savedCount === 0;
      }
      renderContinueShelf();
      const badge = MRM.util.q("#mrm-launcher-count");
      if (badge) {
        const active = activeFilterCount();
        badge.textContent = String(active);
        badge.hidden = active === 0;
      }
    };
  
    const archiveTitle = () => {
      const heading = MRM.util.text(MRM.util.q(".archive-title, .page-title, .search-title")?.textContent);
      if (heading) return heading;
      if (MRM.runtime.page === "search") {
        const query = new URL(location.href).searchParams.get("s");
        return query ? `Search results for “${query}”` : "Search results";
      }
      const breadcrumb = MRM.util.text(MRM.util.q(".breadcrumb_last")?.textContent);
      if (breadcrumb && MRM.util.normalize(breadcrumb) !== "mrm") return breadcrumb;
      return "Latest releases";
    };
  
    const syncOverviewControls = () => {
      if (!overview) return;
      const { filters, grid } = MRM.storage.preferences;
      const search = MRM.util.q("#mrm-overview-search", overview);
      const sort = MRM.util.q("#mrm-overview-sort", overview);
      if (search && document.activeElement !== search) search.value = filters.query;
      if (sort) sort.value = filters.sort;
      for (const button of MRM.util.qa("[data-overview-toggle]", overview)) {
        button.setAttribute("aria-pressed", String(Boolean(filters[button.dataset.overviewToggle])));
      }
      for (const button of MRM.util.qa("[data-overview-density]", overview)) {
        const active = grid.density === button.dataset.overviewDensity;
        button.setAttribute("aria-checked", String(active));
        button.classList.toggle("is-active", active);
      }
    };
  
    const ensureOverview = () => {
      if (overview?.isConnected) return overview;
      const content = MRM.util.q("main.content, .content");
      const archive = MRM.util.q(".content-archive, .archive-content", content || document);
      if (!content || !archive) return null;
      overview = MRM.util.create("section", { className: "mrm-archive-overview", attrs: { id: "mrm-archive-overview", "aria-labelledby": "mrm-overview-title" } });
      overview.innerHTML = `
        <div class="mrm-overview-heading">
          <div class="mrm-overview-copy">
            <span class="mrm-overview-eyebrow">MyReadingManga archive</span>
            <h1 id="mrm-overview-title"></h1>
          </div>
          <div class="mrm-overview-result-summary" aria-live="polite">
            <strong id="mrm-overview-count">0</strong>
            <span id="mrm-overview-loaded">Loading archive…</span>
            <span id="mrm-overview-progress-count" hidden></span>
            <span id="mrm-overview-saved-count" hidden></span>
          </div>
        </div>
        <section id="mrm-continue-shelf" class="mrm-continue-shelf" hidden aria-labelledby="mrm-continue-title">
          <div class="mrm-continue-heading"><strong id="mrm-continue-title">Continue reading</strong><span>Resume where you left off</span></div>
          <div class="mrm-continue-items"></div>
        </section>
        <label class="mrm-overview-search"><span class="mrm-sr-only">Filter this archive</span><span aria-hidden="true">⌕</span><input id="mrm-overview-search" type="search" autocomplete="off" placeholder="Search titles, artists, groups, tags…"></label>
        <div class="mrm-overview-command-row">
          <div class="mrm-overview-quick-filters" aria-label="Quick filters">
            <button type="button" data-overview-toggle="onlyEnglish" aria-pressed="false">English</button>
            <button type="button" data-overview-toggle="hideRead" aria-pressed="false">Hide read</button>
            <button type="button" data-overview-toggle="onlySaved" aria-pressed="false">Saved</button>
          </div>
          <label class="mrm-overview-sort"><span>Sort</span><select id="mrm-overview-sort"><option value="default">Newest first</option><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="english-first">English first</option></select></label>
          <div class="mrm-overview-density" role="radiogroup" aria-label="Archive density">
            <button type="button" role="radio" data-overview-density="comfortable" aria-checked="false" title="Comfortable: four columns">Large</button>
            <button type="button" role="radio" data-overview-density="balanced" aria-checked="false" title="Balanced: five columns">Balanced</button>
            <button type="button" role="radio" data-overview-density="compact" aria-checked="false" title="Compact: six columns">Compact</button>
          </div>
          <button class="mrm-overview-filter-button" type="button" data-overview-action="filters"><span aria-hidden="true">☷</span> All filters</button>
        </div>
        <div class="mrm-overview-filter-row">
          <div class="mrm-active-filters mrm-overview-active-filters" aria-label="Active filters"></div>
          <button class="mrm-overview-clear" type="button" data-overview-action="clear">Clear all</button>
        </div>`;
      MRM.util.q("#mrm-overview-title", overview).textContent = archiveTitle();
      archive.before(overview);
      const search = MRM.util.q("#mrm-overview-search", overview);
      search.addEventListener("input", MRM.util.debounce(() => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, query: search.value }), 120));
      MRM.util.q("#mrm-overview-sort", overview).addEventListener("change", (event) => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, sort: event.target.value }));
      overview.addEventListener("click", (event) => {
        const actionNode = event.target.closest("[data-overview-action]");
        if (actionNode?.dataset.overviewAction === "filters") MRM.settings.open("filters");
        if (actionNode?.dataset.overviewAction === "clear") clearFilters();
        const toggle = event.target.closest("[data-overview-toggle]")?.dataset.overviewToggle;
        if (toggle) MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, [toggle]: !MRM.storage.preferences.filters[toggle] });
        const density = event.target.closest("[data-overview-density]")?.dataset.overviewDensity;
        if (density) MRM.storage.update({ grid: { ...MRM.storage.preferences.grid, density } });
      });
      MRM.util.q("#mrm-panel-launcher")?.classList.add("mrm-launcher-suppressed");
      syncOverviewControls();
      return overview;
    };
  
    const nextPageUrl = () => MRM.util.q(".archive-pagination .pagination-next a, .pagination .next, a.next.page-numbers")?.href || "";
  
    const ensureLongPageUI = () => {
      if (!pageLoadStatus?.isConnected) {
        const archive = MRM.util.q(".content-archive, .archive-content, .entries");
        if (archive) {
          pageLoadStatus = MRM.util.create("div", { className: "mrm-page-load-status", attrs: { id: "mrm-page-load-status", hidden: true, role: "status", "aria-live": "polite" } });
          pageLoadStatus.innerHTML = `<span class="mrm-page-load-spinner" aria-hidden="true"></span><span class="mrm-page-load-copy"></span><a class="mrm-page-load-retry" hidden>Open next page</a>`;
          archive.append(pageLoadStatus);
        }
      }
      if (!positionIndicator?.isConnected) {
        positionIndicator = MRM.util.create("div", { className: "mrm-scroll-position", attrs: { id: "mrm-scroll-position", hidden: true, "aria-hidden": "true" } });
        document.body.append(positionIndicator);
      }
      return pageLoadStatus;
    };
  
    const setPageLoadStatus = (message, { busy = false, retry = false, autoHide = 0 } = {}) => {
      const host = ensureLongPageUI();
      if (!host) return;
      host.hidden = false;
      host.classList.toggle("is-busy", busy);
      MRM.util.q(".mrm-page-load-copy", host).textContent = message;
      const retryLink = MRM.util.q(".mrm-page-load-retry", host);
      const href = nextPageUrl();
      retryLink.hidden = !retry || !href;
      if (href) retryLink.href = href;
      window.clearTimeout(pageLoadTimer);
      if (autoHide) pageLoadTimer = window.setTimeout(() => { if (host) host.hidden = true; }, autoHide);
    };
  
    const beginPageLoadFeedback = () => {
      const href = nextPageUrl();
      if (!href && !MRM.util.q(".pagetual_pageBar, .autopagerize_page_info, [id^='pagetual_pageBar']")) return;
      if (pageLoadStatus && !pageLoadStatus.hidden && pageLoadStatus.classList.contains("is-busy")) return;
      setPageLoadStatus("Loading the next page…", { busy: true });
      window.clearTimeout(pageLoadTimer);
      pageLoadTimer = window.setTimeout(() => setPageLoadStatus("The next page is taking longer than expected.", { retry: true }), 12000);
    };
  
    const installLongPageFeedback = () => {
      ensureLongPageUI();
      let ticking = false;
      window.addEventListener("scroll", () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
            if (remaining < Math.max(900, window.innerHeight * 1.2)) beginPageLoadFeedback();
            schedulePositionUpdate();
          });
        }
      }, { passive: true });
    };
  
    const ensurePositionObserver = () => {
      if (MRM.runtime.archivePositionObserver || typeof IntersectionObserver !== "function") return MRM.runtime.archivePositionObserver;
      MRM.runtime.archivePositionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const card = MRM.runtime.cards.find((item) => item.article === entry.target);
          if (!card) continue;
          if (entry.isIntersecting && !card.article.hidden) intersectingCards.add(card);
          else intersectingCards.delete(card);
        }
      }, { rootMargin: "-10% 0px -78% 0px", threshold: [0, 0.01] });
      return MRM.runtime.archivePositionObserver;
    };
  
    const observeCardPosition = (card) => ensurePositionObserver()?.observe(card.article);
  
    const schedulePositionUpdate = () => {
      if (positionFrame) return;
      positionFrame = requestAnimationFrame(() => {
        positionFrame = 0;
        const visible = visibleCards();
        if (!visible.length) return;
        let current = [...intersectingCards].filter((card) => !card.article.hidden).sort((a, b) => a.article.getBoundingClientRect().top - b.article.getBoundingClientRect().top)[0];
        if (!current) current = visible.find((card) => card.article.getBoundingClientRect().bottom > 0) || visible.at(-1);
        const index = Math.max(0, visible.indexOf(current));
        ensureLongPageUI();
        if (!positionIndicator) return;
        positionIndicator.textContent = `${index + 1} of ${visible.length}`;
        positionIndicator.hidden = false;
        window.clearTimeout(positionHideTimer);
        positionHideTimer = window.setTimeout(() => { if (positionIndicator) positionIndicator.hidden = true; }, 1200);
      });
    };
  
    const addPageSeparator = (firstOrder, added) => {
      if (!added || firstOrder < 1) return null;
      const root = findGridRoot();
      const firstCard = MRM.runtime.cards.find((card) => card.order === firstOrder);
      if (!root || !firstCard) return null;
      const page = ++pageSequence;
      const separator = MRM.util.create("div", {
        className: "mrm-page-separator",
        attrs: { role: "separator", "aria-label": `Page ${page}, ${added} more releases` },
        dataset: { mrmBeforeOrder: String(firstOrder), mrmPage: String(page) },
      });
      separator.innerHTML = `<span>Page ${page}</span><small>${added} more releases</small>`;
      root.insertBefore(separator, firstCard.article);
      return separator;
    };
  
    const syncPageSeparators = (filters) => {
      const root = findGridRoot();
      if (!root) return;
      const defaultOrder = filters.sort === "default";
      const separators = MRM.util.qa(":scope > .mrm-page-separator", root).sort((a, b) => Number(a.dataset.mrmBeforeOrder) - Number(b.dataset.mrmBeforeOrder));
      separators.forEach((separator, index) => {
        const order = Number(separator.dataset.mrmBeforeOrder);
        const nextOrder = Number(separators[index + 1]?.dataset.mrmBeforeOrder ?? Number.POSITIVE_INFINITY);
        const hasVisibleBatchCard = MRM.runtime.cards.some((item) => item.order >= order && item.order < nextOrder && !item.article.hidden);
        separator.hidden = !defaultOrder || !hasVisibleBatchCard;
        if (!defaultOrder) return;
        const card = MRM.runtime.cards.find((item) => item.order === order);
        if (card?.article?.parentElement === root && card.article.previousElementSibling !== separator) root.insertBefore(separator, card.article);
      });
    };
  
    const findGridRoot = () => MRM.util.q(".mrm-card-grid");
    const archiveContainerFor = (article) => article?.closest?.(".content-archive, .archive-content, .entries") || MRM.util.q(".content-archive, .archive-content, .entries");
    const ensureGridRoot = (article) => {
      const existing = findGridRoot();
      if (existing) return existing;
      const container = archiveContainerFor(article);
      if (!container || !article) return null;
      const root = MRM.util.create("div", { className: "mrm-card-grid", attrs: { role: "list", "aria-label": "Manga archive results" } });
      let anchor = article;
      while (anchor.parentElement && anchor.parentElement !== container) anchor = anchor.parentElement;
      container.insertBefore(root, anchor.parentElement === container ? anchor : container.firstChild);
      return root;
    };
  
    const syncGridOrder = (orderedCards) => {
      const root = findGridRoot();
      if (!root) return false;
      const desired = orderedCards.map((card) => card.article).filter((article) => article.isConnected);
      const current = [...root.children].filter((node) => node.matches?.("article.post.entry"));
      if (desired.length === current.length && desired.every((node, index) => current[index] === node)) return false;
      const boundary = [...root.children].find((node) => !node.matches?.("article.post.entry")) || null;
      const fragment = document.createDocumentFragment();
      for (const article of desired) fragment.append(article);
      root.insertBefore(fragment, boundary);
      return true;
    };
  
    const orderedCardsFor = (filters) => {
      const ordered = [...MRM.runtime.cards];
      const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });
      if (filters.sort === "title-asc") ordered.sort((a, b) => collator.compare(a.title, b.title));
      else if (filters.sort === "title-desc") ordered.sort((a, b) => collator.compare(b.title, a.title));
      else if (filters.sort === "english-first") ordered.sort((a, b) => Number(b.isEnglish) - Number(a.isEnglish) || a.order - b.order);
      else ordered.sort((a, b) => a.order - b.order);
      return ordered;
    };
  
    const creatorLine = (card) => {
      const artists = card.taxonomies.artist || [];
      const groups = card.taxonomies.group || [];
      const values = [...artists.slice(0, 1), ...groups.slice(0, artists.length ? 1 : 2)].map(MRM.util.slugLabel);
      return values.join(" · ");
    };
  
    const progressFor = (card) => MRM.storage.getReaderProgress(card.url);
    const updateCardState = (card) => {
      const read = MRM.storage.isRead(card.url);
      const progress = progressFor(card);
      card.article.classList.toggle("mrm-is-read", read);
      card.article.classList.toggle("mrm-in-progress", Boolean(progress && !progress.completed));
      const stateBadge = MRM.util.q(".mrm-card-state-badge", card.article);
      if (stateBadge) {
        stateBadge.hidden = !read && !progress;
        stateBadge.classList.toggle("is-complete", read);
        stateBadge.textContent = read ? "✓ Read" : progress ? `${progress.percent}%` : "";
        stateBadge.setAttribute("aria-label", read ? "Read" : progress ? `${progress.percent}% read` : "");
      }
      const progressRow = MRM.util.q(".mrm-card-progress", card.article);
      if (progressRow) {
        progressRow.hidden = !progress || progress.completed || read;
        const bar = MRM.util.q(".mrm-card-progress-bar", progressRow);
        const label = MRM.util.q(".mrm-card-progress-label", progressRow);
        if (bar && progress) bar.style.setProperty("--mrm-progress", `${progress.percent}%`);
        if (label && progress) label.textContent = `Page ${progress.pageIndex + 1} of ${progress.pageCount}`;
        if (progress) {
          progressRow.setAttribute("aria-valuemin", "0");
          progressRow.setAttribute("aria-valuemax", "100");
          progressRow.setAttribute("aria-valuenow", String(progress.percent));
          progressRow.setAttribute("aria-valuetext", `Page ${progress.pageIndex + 1} of ${progress.pageCount}`);
        }
      }
      const reader = MRM.util.q(".mrm-reader-button", card.article);
      if (reader) reader.firstChild.textContent = progress && !progress.completed && !read ? "Continue" : "Read";
      const toggle = MRM.util.q(".mrm-card-read-toggle", card.article);
      if (toggle) {
        toggle.textContent = read ? "Mark unread" : "Mark read";
        toggle.setAttribute("aria-label", `${read ? "Mark unread" : "Mark read"}: ${card.title}`);
      }
      const saved = MRM.storage.isSaved(card.url);
      card.article.classList.toggle("mrm-is-saved", saved);
      const saveToggle = MRM.util.q(".mrm-card-save-toggle", card.article);
      if (saveToggle) {
        saveToggle.textContent = saved ? "★ Saved" : "☆ Save";
        saveToggle.setAttribute("aria-pressed", String(saved));
        saveToggle.setAttribute("aria-label", `${saved ? "Remove from saved" : "Save for later"}: ${card.title}`);
      }
    };
  
    const filterAndSort = () => {
      ensureOverview();
      const { filters } = MRM.storage.preferences;
      const query = MRM.util.normalize(filters.query);
      const ordered = orderedCardsFor(filters);
      const visible = ordered.filter((card) => {
        if (query && !card.haystack.includes(query)) return false;
        if (filters.hideRead && MRM.storage.isRead(card.url)) return false;
        if (filters.onlyEnglish && !card.isEnglish) return false;
        if (filters.onlySaved && !MRM.storage.isSaved(card.url)) return false;
        return MRM.facets.matches(card, filters);
      });
      const visibleSet = new Set(visible.map((card) => card.url));
      for (const card of MRM.runtime.cards) {
        card.article.hidden = !visibleSet.has(card.url);
        updateCardState(card);
      }
      syncGridOrder(ordered);
      syncPageSeparators(filters);
      intersectingCards.forEach((card) => { if (card.article.hidden) intersectingCards.delete(card); });
      updateResultUI(visible.length, MRM.runtime.cards.length);
      syncOverviewControls();
      MRM.util.announce(`${visible.length} results visible`);
      renderActiveChips();
      return visible;
    };
  
    const chip = (label, onRemove) => {
      const button = MRM.util.create("button", { className: "mrm-filter-chip", attrs: { type: "button", "aria-label": `Remove ${label}`, title: label } });
      button.append(
        MRM.util.create("span", { className: "mrm-filter-chip-label", text: label }),
        MRM.util.create("span", { className: "mrm-filter-chip-remove", text: "×", attrs: { "aria-hidden": "true" } }),
      );
      button.addEventListener("click", onRemove);
      return button;
    };
  
    const activeDescriptors = () => {
      const filters = MRM.storage.preferences.filters;
      const descriptors = [];
      if (filters.query) descriptors.push({ label: `Search: ${filters.query}`, remove: () => MRM.storage.replaceFilters({ ...filters, query: "" }) });
      if (filters.hideRead) descriptors.push({ label: "Hide read", remove: () => MRM.storage.replaceFilters({ ...filters, hideRead: false }) });
      if (filters.onlyEnglish) descriptors.push({ label: "English only", remove: () => MRM.storage.replaceFilters({ ...filters, onlyEnglish: false }) });
      if (filters.onlySaved) descriptors.push({ label: "Saved", remove: () => MRM.storage.replaceFilters({ ...filters, onlySaved: false }) });
      for (const mode of ["include", "exclude"]) for (const [type, values] of Object.entries(filters[mode] || {})) for (const value of values) {
        descriptors.push({ label: `${mode === "include" ? "IN" : "OUT"} · ${MRM.site.facetPrefixes[type]} · ${MRM.util.slugLabel(value)}`, remove: () => MRM.facets.toggle(mode, type, value) });
      }
      return descriptors;
    };
  
    const renderActiveChips = () => {
      const descriptors = activeDescriptors();
      for (const host of MRM.util.qa(".mrm-active-filters")) {
        host.replaceChildren(...descriptors.map(({ label, remove }) => chip(label, remove)));
        if (host.classList.contains("mrm-overview-active-filters")) host.hidden = descriptors.length === 0;
      }
      const clear = MRM.util.q(".mrm-overview-clear");
      if (clear) clear.hidden = descriptors.length === 0;
    };
  
    const metadataButton = (item) => {
      const label = MRM.util.slugLabel(item.slug);
      const button = MRM.util.create("button", {
        className: "mrm-taxonomy-chip",
        attrs: { type: "button", title: `Include ${MRM.site.facetPrefixes[item.type]}: ${label}` },
        dataset: { type: item.type },
      });
      button.append(MRM.util.create("span", { className: "mrm-chip-label", text: label }));
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        MRM.facets.toggle("include", item.type, item.slug);
      });
      return button;
    };
  
    const overflowButton = (card, values, hiddenCount, variant) => {
      const button = MRM.util.create("button", {
        className: `mrm-taxonomy-chip mrm-taxonomy-more mrm-taxonomy-more-${variant}`,
        text: `+${hiddenCount}`,
        attrs: { type: "button", "aria-label": `Show ${hiddenCount} more metadata terms for ${card.title}` },
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        MRM.settings.openMetadataPopover(button, card, values);
      });
      return button;
    };
  
    const metadataChips = (card) => {
      const row = MRM.util.create("div", { className: "mrm-card-chips", attrs: { "aria-label": "Manga metadata" } });
      const priority = ["genre", "category", "status", "tag", "pairing", "group", "artist", "lang"];
      const values = priority.flatMap((type) => (card.taxonomies[type] || []).map((slug) => ({ type, slug })));
      values.slice(0, 2).forEach((item, index) => {
        const button = metadataButton(item);
        if (index === 1) button.classList.add("mrm-taxonomy-secondary");
        row.append(button);
      });
      if (values.length > 2) row.append(overflowButton(card, values, values.length - 2, "wide"));
      if (values.length > 1) row.append(overflowButton(card, values, values.length - 1, "compact"));
      return row;
    };
  
    const enhanceCard = (card) => {
      if (card.article.hasAttribute(enhancedAttr)) return false;
      card.article.setAttribute(enhancedAttr, "true");
      card.article.classList.add("mrm-card");
      card.article.setAttribute("role", "listitem");
      card.article.dataset.mrmUrl = card.url;
      card.article.dataset.mrmOrder = String(card.order);
      const content = MRM.util.q(".entry-content", card.article) || card.article;
      const imageLink = MRM.util.q(".entry-image-link", card.article);
      if (imageLink) imageLink.removeAttribute("aria-hidden");
      card.link.title = card.title;
      if (card.image) {
        card.image.alt = card.image.alt || card.title;
        card.image.loading = card.order < 8 ? "eager" : "lazy";
        card.image.decoding = "async";
      }
      MRM.util.qa(":scope > .mrm-card-badges", content).forEach((node) => node.remove());
      const badges = MRM.util.create("div", { className: "mrm-card-badges" });
      const language = card.taxonomies.lang?.[0];
      if (language) badges.append(MRM.util.create("span", { className: "mrm-card-language-badge", text: MRM.util.slugLabel(language) }));
      badges.append(MRM.util.create("span", { className: "mrm-card-state-badge", attrs: { hidden: true } }));
      content.append(badges);
      const header = MRM.util.q(".entry-header", card.article);
      MRM.util.qa(":scope > .mrm-card-byline", header || card.article).forEach((node) => node.remove());
      const byline = creatorLine(card);
      if (header && byline) header.append(MRM.util.create("p", { className: "mrm-card-byline", text: byline }));
      const footer = MRM.util.q(".entry-footer", card.article) || MRM.util.create("footer", { className: "entry-footer" });
      if (!footer.parentElement) card.article.append(footer);
      const progress = MRM.util.create("div", { className: "mrm-card-progress", attrs: { hidden: true, role: "progressbar", "aria-label": `Reading progress for ${card.title}` } });
      progress.append(MRM.util.create("span", { className: "mrm-card-progress-track" },), MRM.util.create("span", { className: "mrm-card-progress-label" }));
      MRM.util.q(".mrm-card-progress-track", progress).append(MRM.util.create("span", { className: "mrm-card-progress-bar" }));
      const actions = MRM.util.create("div", { className: "mrm-card-actions" });
      const reader = MRM.util.create("button", { className: "mrm-reader-button", attrs: { type: "button", "aria-label": `Open ${card.title} in reader` } });
      reader.append(document.createTextNode("Read"), MRM.util.create("span", { text: "›", attrs: { "aria-hidden": "true" } }));
      reader.addEventListener("click", (event) => {
        event.preventDefault();
        MRM.reader.open(card.url, { sequence: visibleCards().map((item) => item.url), trigger: reader });
      });
      const original = MRM.util.create("a", { className: "mrm-card-original", text: "↗", attrs: { href: card.url, target: "_blank", rel: "noopener", "aria-label": `Open original post: ${card.title}`, title: "Open original post" } });
      original.addEventListener("click", () => MRM.storage.markRead(card.url, card.title), { passive: true });
      const saveToggle = MRM.util.create("button", { className: "mrm-card-save-toggle", attrs: { type: "button", "aria-pressed": "false" } });
      saveToggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        MRM.storage.toggleSaved(card.url, card.title, MRM.util.imageSource(card.image));
      });
      const readToggle = MRM.util.create("button", { className: "mrm-card-read-toggle", attrs: { type: "button" } });
      readToggle.addEventListener("click", (event) => {
        event.preventDefault();
        if (MRM.storage.isRead(card.url)) MRM.storage.unmarkRead(card.url);
        else MRM.storage.markRead(card.url, card.title);
      });
      actions.append(reader, saveToggle, original, readToggle);
      footer.replaceChildren(metadataChips(card), progress, actions);
      card.link.addEventListener("click", () => MRM.storage.markRead(card.url, card.title), { passive: true });
      content.classList.add("mrm-card-cover");
      const root = ensureGridRoot(card.article);
      if (root && card.article.parentElement !== root) root.append(card.article);
      updateCardState(card);
      observeCardPosition(card);
      return true;
    };
  
    const visibleCards = () => MRM.runtime.cards.filter((card) => !card.article.hidden);
    const markVisibleRead = () => {
      for (const card of visibleCards()) MRM.storage.markRead(card.url, card.title);
      filterAndSort();
    };
    const clearFilters = () => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, query: "", hideRead: false, onlyEnglish: false, onlySaved: false, include: {}, exclude: {} });
  
    const removeDuplicateCandidate = (article) => {
      if (!article?.isConnected || article.hasAttribute(enhancedAttr)) return;
      if (article.hasAttribute(pageTualCandidateAttr) || article.closest?.(`[${pageTualCandidateAttr}]`)) article.remove();
    };
  
    const ingest = (root = document) => {
      const parsed = MRM.site.collectCards(root);
      if (!parsed.length) return 0;
      ensureOverview();
      const existing = new Map(MRM.runtime.cards.map((card) => [card.url, card]));
      let order = MRM.runtime.cards.length;
      let added = 0;
      for (const card of parsed) {
        if (existing.has(card.url)) {
          if (existing.get(card.url).article !== card.article) removeDuplicateCandidate(card.article);
          continue;
        }
        card.order = order++;
        existing.set(card.url, card);
        MRM.runtime.cards.push(card);
        if (enhanceCard(card)) added += 1;
      }
      if (!added) return 0;
      MRM.facets.buildDirectory(MRM.runtime.cards);
      filterAndSort();
      MRM.settings.refreshFacets();
      return added;
    };
  
    const scan = (root = document) => ingest(root);
  
    const candidateArticles = (root = document) => {
      const nodes = [];
      if (root instanceof Element && root.matches(MRM.selectors.archiveCards)) nodes.push(root);
      if (root && typeof root.querySelectorAll === "function") nodes.push(...MRM.util.qa(MRM.selectors.archiveCards, root));
      return MRM.util.unique(nodes);
    };
  
    const markPageTualCandidates = (root = document) => {
      let marked = 0;
      for (const article of candidateArticles(root)) {
        if (article.hasAttribute(enhancedAttr)) continue;
        article.setAttribute(pageTualCandidateAttr, "1");
        marked += 1;
      }
      return marked;
    };
  
    const flushQueuedScans = () => {
      scanTimer = 0;
      const roots = [...pendingRoots];
      pendingRoots.clear();
      let added = 0;
      for (const root of roots) added += ingest(root?.isConnected === false ? document : root);
      return added;
    };
  
    const queueScan = (root = document, delay = 90) => {
      pendingRoots.add(root || document);
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(flushQueuedScans, delay);
    };
  
    const isPageTualUi = (node) => node instanceof Element && (node.matches(pageTualUiSelector) || Boolean(node.closest?.(pageTualUiSelector)));
    const rawArticleRoots = (records) => {
      const roots = [];
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element) || isPageTualUi(node) || node.closest?.(ignoredMutationSelector)) continue;
        const articles = candidateArticles(node);
        if (articles.some((article) => !article.hasAttribute(enhancedAttr))) roots.push(node);
      }
      return MRM.util.unique(roots);
    };
  
    const handlePageTualInsert = (event) => {
      if (event && typeof event === "object" && handledPageTualEvents.has(event)) return;
      if (event && typeof event === "object") handledPageTualEvents.add(event);
      const root = event?.detail?.root instanceof Element ? event.detail.root : document;
      const firstOrder = MRM.runtime.cards.length;
      markPageTualCandidates(root);
      const added = ingest(root);
      if (added) {
        addPageSeparator(firstOrder, added);
        setPageLoadStatus(`Page ${pageSequence} loaded · ${added} new releases`, { autoHide: 3200 });
        syncPageSeparators(MRM.storage.preferences.filters);
      }
      queueScan(document, 90);
      window.setTimeout(() => queueScan(document, 90), 500);
    };
  
    const observe = () => {
      MRM.runtime.archiveObserver?.disconnect();
      MRM.runtime.archiveObserver = new MutationObserver((records) => {
        for (const root of rawArticleRoots(records)) queueScan(root, 70);
      });
      MRM.runtime.archiveObserver.observe(document.body, { childList: true, subtree: true });
      window.addEventListener("message", (event) => {
        const data = event?.data;
        if (data && typeof data === "object" && data.command === "pagetual") {
          if (data.action === "insert") handlePageTualInsert(event);
          else if (["load", "loading", "request"].includes(data.action)) beginPageLoadFeedback();
        }
      });
      window.addEventListener("pagetual:insert", handlePageTualInsert);
      document.addEventListener("pagetual:insert", handlePageTualInsert);
      document.addEventListener("pagetual_page_inserted", handlePageTualInsert);
    };
  
    const init = () => {
      document.body.classList.add("mrm-archive-page");
      ensureOverview();
      scan(document);
      observe();
      installLongPageFeedback();
    };
  
    MRM.events.addEventListener("preferences", filterAndSort);
    MRM.events.addEventListener("read-history", filterAndSort);
    MRM.events.addEventListener("reader-progress", filterAndSort);
    MRM.events.addEventListener("saved-posts", filterAndSort);
    return { init, scan, filterAndSort, visibleCards, markVisibleRead, clearFilters, renderActiveChips, activeFilterCount, handlePageTualInsert, beginPageLoadFeedback };
  })();

  // module: 06-reader.js
  MRM.reader = (() => {
    const state = {
      modal: null,
      document: null,
      url: "",
      title: "",
      pages: [],
      pageIndex: 0,
      sequence: [],
      abort: null,
      commentsVisible: false,
      toolbarHidden: false,
      focusMode: false,
      returnTarget: null,
      returnScrollY: 0,
      pointerStart: null,
    };
    const readerPrefs = () => MRM.storage.readerPreferences();
    const constrainedConnection = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return Boolean(connection?.saveData || /(?:^|-)2g$/i.test(connection?.effectiveType || "") || /slow-2g/i.test(connection?.effectiveType || ""));
    };
    const pagedPrefetchRadius = () => constrainedConnection() ? 1 : 2;
    const hydratePagedWindow = () => {
      if (!state.modal || readerPrefs().view !== "paged") return;
      const radius = pagedPrefetchRadius();
      state.modal.querySelectorAll(".mrm-reader-page img[data-mrm-src]").forEach((img) => {
        const index = Number(img.closest(".mrm-reader-page")?.dataset.index || 0);
        if (Math.abs(index - state.pageIndex) <= radius && !img.getAttribute("src")) img.src = img.dataset.mrmSrc;
      });
    };
    const renderShell = () => {
      if (state.modal) return state.modal;
      const modal = MRM.util.create("section", { className: "mrm-reader-modal", attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-reader-title", hidden: true } });
      modal.innerHTML = `
        <div class="mrm-reader-toolbar">
          <div class="mrm-reader-toolbar-primary">
            <button type="button" data-reader-action="close" aria-label="Close reader">×</button>
            <button type="button" data-reader-action="back-archive" class="mrm-reader-back-archive" hidden>Back to archive</button>
            <button type="button" data-reader-action="previous-post" aria-label="Previous post">‹ Post</button>
            <h2 id="mrm-reader-title">Reader</h2>
            <span id="mrm-reader-page-count" aria-live="polite">0 / 0</span>
            <button type="button" data-reader-action="next-post" aria-label="Next post">Post ›</button>
          </div>
          <div class="mrm-reader-toolbar-secondary">
            <button type="button" data-reader-action="cycle-view" title="Cycle view (C)">Strip</button>
            <button type="button" data-reader-action="width" title="Toggle width (W)">Comfort</button>
            <button type="button" data-reader-action="fit" title="Toggle fit (M)">Fit width</button>
            <button type="button" data-reader-action="direction" title="Toggle direction (R)">LTR</button>
            <button type="button" data-reader-action="thumbnails" title="Toggle thumbnails (T)">Thumbs</button>
            <button type="button" data-reader-action="comments">Comments</button>
            <button type="button" data-reader-action="save" aria-pressed="false" title="Save for later (S)">☆ Save</button>
            <button type="button" data-reader-action="focus" title="Distraction-free reading (D)">Focus</button>
            <button type="button" data-reader-action="open-tab">Open post</button>
            <button type="button" data-reader-action="fullscreen" title="Fullscreen (F)">Fullscreen</button>
          </div>
        </div>
        <div class="mrm-reader-progress">
          <progress id="mrm-reader-progress-meter" max="100" value="0" aria-label="Reading progress"></progress>
          <div class="mrm-reader-progress-controls">
            <span id="mrm-reader-progress-label">Page 0 of 0 · 0%</span>
            <input id="mrm-reader-scrubber" type="range" min="1" max="1" value="1" aria-label="Reader page">
          </div>
        </div>
        <div class="mrm-reader-body">
          <aside class="mrm-reader-thumbnails" aria-label="Page thumbnails"></aside>
          <main class="mrm-reader-stage" tabindex="0"></main>
          <section class="mrm-reader-comments" hidden></section>
        </div>
        <div class="mrm-reader-mobile-zones" aria-hidden="true">
          <button type="button" data-reader-action="previous-page" tabindex="-1"></button>
          <button type="button" data-reader-action="toolbar" tabindex="-1"></button>
          <button type="button" data-reader-action="next-page" tabindex="-1"></button>
        </div>
        <button type="button" class="mrm-reader-focus-exit" data-reader-action="focus" hidden>Exit focus</button>
        <nav class="mrm-reader-mobile-controls" aria-label="Mobile reader navigation">
          <button type="button" data-reader-action="previous-page">Previous</button>
          <span id="mrm-reader-mobile-page-count" aria-live="polite">0 / 0</span>
          <button type="button" data-reader-action="next-page">Next</button>
        </nav>
        <nav class="mrm-reader-footer" aria-label="Reader navigation">
          <button type="button" data-reader-action="first-page">First</button>
          <button type="button" data-reader-action="previous-page">Previous</button>
          <button type="button" data-reader-action="next-page">Next</button>
          <button type="button" data-reader-action="last-page">Last</button>
        </nav>`;
      document.body.append(modal);
      modal.addEventListener("click", onClick);
      modal.addEventListener("keydown", (event) => MRM.util.trapFocus(event, modal));
      modal.querySelector("#mrm-reader-scrubber").addEventListener("input", (event) => goTo(Number(event.target.value) - 1));
      const stage = modal.querySelector(".mrm-reader-stage");
      stage.addEventListener("scroll", MRM.util.throttle(onScroll, 80));
      stage.addEventListener("pointerdown", onPointerDown, { passive: true });
      stage.addEventListener("pointerup", onPointerUp, { passive: true });
      stage.addEventListener("dblclick", onDoubleClick);
      state.modal = modal;
      MRM.runtime.reader = state;
      return modal;
    };
    const actionButton = (action) => state.modal?.querySelector(`[data-reader-action='${action}']`);
    const actionButtons = (action) => state.modal ? Array.from(state.modal.querySelectorAll(`[data-reader-action='${action}']`)) : [];
    const setLoading = (loading, message = "Loading reader…") => {
      const stage = state.modal.querySelector(".mrm-reader-stage");
      stage.toggleAttribute("aria-busy", loading);
      if (loading) stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status", text: message, attrs: { role: "status" } }));
    };
    const collectPost = async (url) => {
      if (MRM.util.canonicalUrl(url) === MRM.util.canonicalUrl(location.href) && MRM.runtime.page === "post") return document;
      state.abort?.abort();
      state.abort = new AbortController();
      return MRM.util.safeFetchDocument(url, state.abort.signal);
    };
    const waitForPages = async (doc) => {
      const attempts = doc === document ? 12 : 3;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const pages = MRM.site.extractImages(doc);
        if (pages.length) return pages;
        await new Promise((resolve) => window.setTimeout(resolve, 125));
      }
      return [];
    };
    const open = async (url, options = {}) => {
      renderShell();
      MRM.runtime.lastFocused = options.trigger || document.activeElement;
      state.sequence = options.sequence || state.sequence;
      const requestedUrl = MRM.util.canonicalUrl(url);
      state.returnTarget = options.trigger?.closest?.(".mrm-card") || MRM.runtime.cards.find((item) => item.url === requestedUrl)?.article || null;
      state.returnScrollY = window.scrollY;
      state.focusMode = false;
      state.modal.classList.remove("is-focus-mode", "is-image-zoomed");
      state.modal.hidden = false;
      document.documentElement.classList.add("mrm-reader-open");
      setLoading(true);
      actionButton("close").focus();
      try {
        const normalizedUrl = MRM.util.canonicalUrl(url);
        let doc = null;
        let pages = [];
        let loadError = null;
        try {
          doc = await collectPost(url);
          pages = await waitForPages(doc);
        } catch (error) { loadError = error; }
        const cached = !pages.length ? MRM.storage.getReaderCache(normalizedUrl) : null;
        if (!pages.length && cached) {
          doc = document.implementation.createHTMLDocument(cached.title || "Cached reader");
          pages = cached.pages;
        }
        if (!pages.length) throw loadError || new Error("No manga pages were detected on this post.");
        state.document = doc;
        state.url = normalizedUrl;
        state.title = MRM.util.pageTitle(doc) || cached?.title || "Reader";
        state.pages = pages;
        MRM.storage.setReaderCache(state.url, state.title, state.pages);
        const savedProgress = MRM.storage.getReaderProgress(state.url);
        state.pageIndex = savedProgress && !savedProgress.completed ? MRM.util.clamp(savedProgress.pageIndex, 0, state.pages.length - 1) : 0;
        state.commentsVisible = false;
        render();
        const resumed = Boolean(savedProgress && !savedProgress.completed && savedProgress.pageIndex > 0);
        if (resumed) MRM.util.announce(`Resuming ${state.title} at page ${state.pageIndex + 1} of ${state.pages.length}`);
        requestAnimationFrame(() => goTo(state.pageIndex, false));
        prefetchAdjacent();
      } catch (error) {
        const stage = state.modal.querySelector(".mrm-reader-stage");
        stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status mrm-reader-error", text: error.message || "Reader could not open this post.", attrs: { role: "alert" } }));
      }
    };
    const sequenceInfo = (delta) => {
      const index = state.sequence.indexOf(state.url);
      if (index >= 0) {
        const url = state.sequence[index + delta] || "";
        const card = MRM.runtime.cards.find((item) => item.url === url);
        return { url, title: card?.title || "" };
      }
      const selectors = delta < 0
        ? "a[rel~='prev'], .previous a, .pagination-previous a, .adjacent-entry-pagination .previous a"
        : "a[rel~='next'], .next a, .pagination-next a, .adjacent-entry-pagination .next a";
      const anchor = MRM.util.q(selectors, state.document);
      return { url: anchor?.href || "", title: MRM.util.text(anchor?.textContent || anchor?.title) };
    };
    const updateNavigation = () => {
      const atFirst = state.pageIndex <= 0;
      const atLast = state.pageIndex >= Math.max(0, state.pages.length - 1);
      for (const action of ["first-page", "previous-page"]) for (const button of actionButtons(action)) button.disabled = atFirst;
      for (const action of ["next-page", "last-page"]) for (const button of actionButtons(action)) button.disabled = atLast;
      const previousInfo = sequenceInfo(-1);
      const nextInfo = sequenceInfo(1);
      const previousPost = actionButton("previous-post");
      const nextPost = actionButton("next-post");
      if (previousPost) {
        previousPost.disabled = !previousInfo.url;
        previousPost.textContent = previousInfo.url ? `‹ ${previousInfo.title || "Previous post"}` : "‹ Previous";
        previousPost.title = previousInfo.title || "Previous post";
      }
      if (nextPost) {
        nextPost.disabled = !nextInfo.url;
        nextPost.textContent = nextInfo.url ? `${nextInfo.title || "Next post"} ›` : "Next ›";
        nextPost.title = nextInfo.title || "Next post";
      }
      const backArchive = actionButton("back-archive");
      if (backArchive) backArchive.hidden = !state.returnTarget?.isConnected;
    };
    const render = () => {
      const prefs = readerPrefs();
      state.modal.dataset.view = prefs.view;
      state.modal.dataset.width = prefs.width;
      state.modal.dataset.fit = prefs.fit;
      state.modal.dataset.direction = prefs.direction;
      state.modal.dataset.thumbnails = prefs.thumbnails ? "on" : "off";
      state.modal.querySelector("#mrm-reader-title").textContent = state.title;
      actionButton("focus").textContent = state.focusMode ? "Exit focus" : "Focus";
      const focusExit = state.modal.querySelector(".mrm-reader-focus-exit");
      if (focusExit) focusExit.hidden = !state.focusMode;
      actionButton("cycle-view").textContent = prefs.view === "strip" ? "Strip" : prefs.view === "strip-gaps" ? "Strip + gaps" : "Paged";
      actionButton("width").textContent = prefs.width === "comfort" ? "Comfort" : "Wide";
      actionButton("fit").textContent = prefs.fit === "width" ? "Fit width" : "Fit height";
      actionButton("direction").textContent = prefs.direction.toUpperCase();
      const comments = MRM.site.commentsCount(state.document);
      actionButton("comments").textContent = comments == null ? "Comments" : `Comments (${comments})`;
      const saved = MRM.storage.isSaved(state.url);
      const saveButton = actionButton("save");
      if (saveButton) { saveButton.textContent = saved ? "★ Saved" : "☆ Save"; saveButton.setAttribute("aria-pressed", String(saved)); }
      renderPages();
      renderThumbnails();
      setPageIndex(state.pageIndex);
      updateNavigation();
    };
    const renderPages = () => {
      const stage = state.modal.querySelector(".mrm-reader-stage");
      stage.replaceChildren();
      state.pages.forEach((page, index) => {
        const figure = MRM.util.create("figure", { className: "mrm-reader-page", dataset: { index } });
        const prefs = readerPrefs();
        const paged = prefs.view === "paged";
        const attrs = { alt: page.alt, loading: paged ? "eager" : (index < 2 ? "eager" : "lazy"), decoding: "async", "data-mrm-src": page.src };
        if (!paged || Math.abs(index - state.pageIndex) <= pagedPrefetchRadius()) attrs.src = page.src;
        const img = MRM.util.create("img", { attrs });
        const captionText = () => `${index + 1} / ${state.pages.length}${page.width && page.height ? ` · ${page.width}×${page.height}` : ""}`;
        const caption = MRM.util.create("figcaption", { text: captionText() });
        img.addEventListener("load", () => {
          if ((!page.width || !page.height) && img.naturalWidth && img.naturalHeight) {
            page.width = img.naturalWidth;
            page.height = img.naturalHeight;
            caption.textContent = captionText();
            MRM.storage.setReaderCache(state.url, state.title, state.pages);
          }
        }, { once: true });
        figure.append(img, caption);
        stage.append(figure);
      });
      if (readerPrefs().view === "paged") goTo(state.pageIndex, false);
      else observePages();
    };
    const renderThumbnails = () => {
      const host = state.modal.querySelector(".mrm-reader-thumbnails");
      host.replaceChildren();
      state.pages.forEach((page, index) => {
        const button = MRM.util.create("button", { className: "mrm-reader-thumbnail", attrs: { type: "button", "aria-label": `Go to page ${index + 1}` }, dataset: { index } });
        if (!constrainedConnection()) button.append(MRM.util.create("img", { attrs: { src: page.src, alt: "", loading: "lazy", decoding: "async" } }));
        button.append(MRM.util.create("span", { text: String(index + 1) }));
        button.addEventListener("click", () => goTo(index));
        host.append(button);
      });
    };
    const observePages = () => {
      state.readerObserver?.disconnect?.();
      MRM.runtime.readerObserver?.disconnect();
      MRM.runtime.readerObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setPageIndex(Number(visible.target.dataset.index));
      }, { root: state.modal.querySelector(".mrm-reader-stage"), threshold: [0.2, 0.5, 0.8] });
      state.modal.querySelectorAll(".mrm-reader-page").forEach((page) => MRM.runtime.readerObserver.observe(page));
    };
    const setPageIndex = (index) => {
      state.pageIndex = MRM.util.clamp(index, 0, Math.max(0, state.pages.length - 1));
      const pageText = `${state.pageIndex + 1} / ${state.pages.length}`;
      state.modal.querySelector("#mrm-reader-page-count").textContent = pageText;
      const mobilePageCount = state.modal.querySelector("#mrm-reader-mobile-page-count");
      if (mobilePageCount) mobilePageCount.textContent = pageText;
      const percent = state.pages.length ? Math.round(((state.pageIndex + 1) / state.pages.length) * 100) : 0;
      const progressMeter = state.modal.querySelector("#mrm-reader-progress-meter");
      if (progressMeter) progressMeter.value = percent;
      const progressLabel = state.modal.querySelector("#mrm-reader-progress-label");
      if (progressLabel) progressLabel.textContent = `Page ${state.pageIndex + 1} of ${state.pages.length} · ${percent}%`;
      const scrubber = state.modal.querySelector("#mrm-reader-scrubber");
      scrubber.max = String(Math.max(1, state.pages.length));
      scrubber.value = String(state.pageIndex + 1);
      state.modal.querySelectorAll(".mrm-reader-thumbnail").forEach((button, i) => button.classList.toggle("is-active", i === state.pageIndex));
      if (state.url && state.pages.length) MRM.storage.setReaderProgress(state.url, state.title, state.pageIndex, state.pages.length);
      updateNavigation();
    };
    const goTo = (index, smooth = true) => {
      setPageIndex(index);
      hydratePagedWindow();
      const target = state.modal.querySelector(`.mrm-reader-page[data-index='${state.pageIndex}']`);
      if (!target) return;
      if (readerPrefs().view === "paged") {
        state.modal.querySelectorAll(".mrm-reader-page").forEach((page, i) => page.hidden = i !== state.pageIndex);
        target.hidden = false;
        state.modal.querySelector(".mrm-reader-stage").scrollTop = 0;
      } else target.scrollIntoView({ block: "start", behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    };
    const movePage = (delta) => goTo(state.pageIndex + delta);
    const sequenceTarget = (delta) => sequenceInfo(delta).url;
    const movePost = (delta) => {
      const target = sequenceTarget(delta);
      if (target) open(target, { sequence: state.sequence, trigger: state.modal.querySelector(`[data-reader-action='${delta < 0 ? "previous-post" : "next-post"}']`) });
      else MRM.util.announce("No adjacent post available");
    };
    const prefetchAdjacent = () => MRM.util.idle(() => {
      if (constrainedConnection()) return;
      for (const target of [sequenceTarget(-1), sequenceTarget(1)]) if (target) fetch(target, { credentials: "include", priority: "low" }).catch(() => {});
    });
    const showComments = () => {
      const commentsHost = state.modal.querySelector(".mrm-reader-comments");
      const stage = state.modal.querySelector(".mrm-reader-stage");
      const source = MRM.util.q(MRM.selectors.comments, state.document);
      state.commentsVisible = !state.commentsVisible;
      commentsHost.hidden = !state.commentsVisible;
      stage.hidden = state.commentsVisible;
      state.modal.querySelector(".mrm-reader-thumbnails").hidden = state.commentsVisible;
      actionButton("comments").textContent = state.commentsVisible ? "Back to reader" : "Comments";
      if (state.commentsVisible) {
        commentsHost.replaceChildren();
        if (source) {
          const clone = source.cloneNode(true);
          clone.querySelectorAll("script, iframe, form").forEach((node) => node.remove());
          commentsHost.append(clone);
        } else commentsHost.append(MRM.util.create("p", { text: "Comments are not present in the fetched page." }));
        commentsHost.focus?.();
      }
    };
    const togglePreference = (patch) => MRM.storage.updateReaderPreferences(patch);
    const cycleView = () => {
      const modes = ["strip", "strip-gaps", "paged"];
      const current = readerPrefs().view;
      togglePreference({ view: modes[(modes.indexOf(current) + 1) % modes.length] });
      render();
    };
    const fullscreen = () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else state.modal.requestFullscreen?.();
    };
    const toggleFocus = () => {
      if (state.commentsVisible) showComments();
      state.focusMode = !state.focusMode;
      state.modal.classList.toggle("is-focus-mode", state.focusMode);
      state.modal.classList.remove("is-image-zoomed");
      actionButton("focus").textContent = state.focusMode ? "Exit focus" : "Focus";
      const focusExit = state.modal.querySelector(".mrm-reader-focus-exit");
      if (focusExit) focusExit.hidden = !state.focusMode;
      state.modal.querySelector(".mrm-reader-stage")?.focus({ preventScroll: true });
    };
    const backToArchive = () => {
      const target = state.returnTarget;
      const fallbackY = state.returnScrollY;
      close();
      requestAnimationFrame(() => {
        if (target?.isConnected) {
          target.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          target.querySelector(".mrm-reader-trigger, a, button")?.focus({ preventScroll: true });
        } else window.scrollTo({ top: fallbackY, behavior: "auto" });
      });
    };
    const onPointerDown = (event) => {
      if (!/touch|pen/.test(event.pointerType || "")) return;
      state.pointerStart = { x: event.clientX, y: event.clientY, at: performance.now() };
    };
    const onPointerUp = (event) => {
      const start = state.pointerStart;
      state.pointerStart = null;
      if (!start || readerPrefs().view !== "paged" || state.modal.classList.contains("is-image-zoomed")) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.25 || performance.now() - start.at > 900) return;
      const logicalNext = dx < 0;
      const direction = readerPrefs().direction;
      movePage(logicalNext ? (direction === "rtl" ? -1 : 1) : (direction === "rtl" ? 1 : -1));
    };
    const onDoubleClick = (event) => {
      if (!event.target.matches(".mrm-reader-page img") || !matchMedia("(max-width: 760px)").matches) return;
      const enabled = !state.modal.classList.contains("is-image-zoomed");
      state.modal.classList.toggle("is-image-zoomed", enabled);
      if (enabled) {
        const rect = event.target.getBoundingClientRect();
        const x = MRM.util.clamp(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100, 0, 100);
        const y = MRM.util.clamp(((event.clientY - rect.top) / Math.max(1, rect.height)) * 100, 0, 100);
        event.target.style.setProperty("--mrm-zoom-origin", `${x}% ${y}%`);
      } else event.target.style.removeProperty("--mrm-zoom-origin");
    };
    const close = () => {
      state.abort?.abort();
      MRM.runtime.readerObserver?.disconnect();
      state.modal.hidden = true;
      state.modal.classList.remove("is-focus-mode", "is-image-zoomed");
      state.focusMode = false;
      document.documentElement.classList.remove("mrm-reader-open");
      MRM.runtime.lastFocused?.focus?.();
    };
    const onClick = (event) => {
      const button = event.target.closest("[data-reader-action]");
      if (!button) {
        if (event.target === state.modal) close();
        return;
      }
      const action = button.dataset.readerAction;
      const map = {
        close,
        "back-archive": backToArchive,
        "previous-post": () => movePost(-1),
        "next-post": () => movePost(1),
        "previous-page": () => movePage(readerPrefs().direction === "rtl" ? 1 : -1),
        "next-page": () => movePage(readerPrefs().direction === "rtl" ? -1 : 1),
        "first-page": () => goTo(0),
        "last-page": () => goTo(state.pages.length - 1),
        "cycle-view": cycleView,
        width: () => { togglePreference({ width: readerPrefs().width === "comfort" ? "wide" : "comfort" }); render(); },
        fit: () => { togglePreference({ fit: readerPrefs().fit === "width" ? "height" : "width" }); render(); },
        direction: () => { togglePreference({ direction: readerPrefs().direction === "ltr" ? "rtl" : "ltr" }); render(); },
        thumbnails: () => { togglePreference({ thumbnails: !readerPrefs().thumbnails }); render(); },
        comments: showComments,
        save: () => { MRM.storage.toggleSaved(state.url, state.title, state.pages[state.pageIndex]?.src || state.pages[0]?.src || ""); render(); },
        focus: toggleFocus,
        "open-tab": () => window.open(state.url, "_blank", "noopener"),
        fullscreen,
        toolbar: () => state.modal.classList.toggle("is-toolbar-hidden"),
      };
      map[action]?.();
    };
    const onScroll = () => {
      if (!readerPrefs().autoHideToolbar || readerPrefs().view === "paged") return;
      const stage = state.modal.querySelector(".mrm-reader-stage");
      state.modal.classList.toggle("is-toolbar-hidden", stage.scrollTop > 120 && stage.scrollTop > (state.lastScrollTop || 0));
      state.lastScrollTop = stage.scrollTop;
    };
    const onKeydown = (event) => {
      if (!state.modal || state.modal.hidden) return;
      const target = event.target;
      if (target.matches("input, textarea, select") && event.key !== "Escape") return;
      const key = event.key.toLocaleLowerCase();
      const handlers = {
        escape: close,
        f: fullscreen,
        w: () => actionButton("width").click(),
        m: () => actionButton("fit").click(),
        c: cycleView,
        d: toggleFocus,
        s: () => actionButton("save")?.click(),
        r: () => actionButton("direction").click(),
        t: () => actionButton("thumbnails").click(),
        home: () => goTo(0),
        end: () => goTo(state.pages.length - 1),
        arrowleft: () => movePage(readerPrefs().direction === "rtl" ? 1 : -1),
        pageup: () => movePage(-1),
        arrowright: () => movePage(readerPrefs().direction === "rtl" ? -1 : 1),
        pagedown: () => movePage(1),
      };
      if (event.altKey && (key === "arrowleft" || key === "arrowright")) {
        event.preventDefault(); movePost(key === "arrowleft" ? -1 : 1); return;
      }
      if (handlers[key]) { event.preventDefault(); handlers[key](); }
    };
    const installPostButtons = () => {
      const article = MRM.util.q(MRM.selectors.postArticle);
      const title = MRM.util.q(".entry-title", article || document);
      if (!title || MRM.util.q("#mrm-post-actions")) return;
      const actions = MRM.util.create("div", { attrs: { id: "mrm-post-actions" }, className: "mrm-post-actions" });
      const reader = MRM.util.create("button", { className: "mrm-primary-action", text: "Open Reader", attrs: { type: "button" } });
      const count = MRM.site.commentsCount(document);
      const comments = MRM.util.create("button", { text: count == null ? "Comments" : `Comments (${count})`, attrs: { type: "button" } });
      const save = MRM.util.create("button", { className: "mrm-post-save", attrs: { type: "button", "aria-pressed": String(MRM.storage.isSaved(location.href)) } });
      const syncSave = () => {
        const saved = MRM.storage.isSaved(location.href);
        save.textContent = saved ? "★ Saved" : "☆ Save for later";
        save.setAttribute("aria-pressed", String(saved));
      };
      syncSave();
      reader.addEventListener("click", () => open(location.href, { trigger: reader }));
      comments.addEventListener("click", () => MRM.util.q(MRM.selectors.comments)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      save.addEventListener("click", () => MRM.storage.toggleSaved(location.href, title.textContent, MRM.util.imageSource(MRM.util.q(MRM.selectors.mangaImages))));
      const onSaved = (event) => { if (!event.detail?.url || event.detail.url === MRM.util.canonicalUrl(location.href)) syncSave(); };
      MRM.events.addEventListener("saved-posts", onSaved);
      actions.append(reader, save, comments);
      if (article) {
        const taxonomies = MRM.site.taxonomiesFromClasses(article);
        const chips = MRM.util.create("div", { className: "mrm-post-taxonomies", attrs: { "aria-label": "Post metadata" } });
        for (const type of ["lang", "category", "genre", "artist", "group", "pairing", "status", "tag"]) {
          for (const slug of (taxonomies[type] || []).slice(0, type === "tag" ? 12 : 5)) {
            chips.append(MRM.util.create("span", { className: "mrm-taxonomy-chip", text: MRM.util.slugLabel(slug), attrs: { title: MRM.site.facetPrefixes[type] } }));
          }
        }
        if (chips.childElementCount) actions.append(chips);
      }
      title.insertAdjacentElement("afterend", actions);
      MRM.storage.markRead(location.href, title.textContent);
    };
    document.addEventListener("keydown", onKeydown, true);
    MRM.events.addEventListener("preferences", () => { if (state.modal && !state.modal.hidden && state.pages.length) render(); });
    MRM.events.addEventListener("saved-posts", () => { if (state.modal && !state.modal.hidden && state.pages.length) render(); });
    const deviceQuery = matchMedia("(max-width: 760px)");
    deviceQuery.addEventListener?.("change", () => { if (state.modal && !state.modal.hidden && state.pages.length) render(); });
    return { open, close, installPostButtons, goTo };
  })();

  // module: 07-settings.js
  MRM.settings = (() => {
    let panel = null;
    let facetHost = null;
    const makeToggle = (label, checked, onChange) => {
      const row = MRM.util.create("label", { className: "mrm-toggle-row" });
      const input = MRM.util.create("input", { attrs: { type: "checkbox" } });
      input.checked = checked;
      input.addEventListener("change", () => onChange(input.checked));
      row.append(MRM.util.create("span", { text: label }), input);
      return row;
    };
    const updateFilters = (patch) => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, ...patch });
    const renderPanel = () => {
      if (panel) return panel;
      const launcher = MRM.util.create("button", { attrs: { id: "mrm-panel-launcher", type: "button", "aria-controls": "mrm-control-panel", "aria-expanded": "false", "aria-label": "Open archive filters and display settings" } });
      launcher.innerHTML = '<span class="mrm-launcher-icon" aria-hidden="true">☷</span><span>Filters</span><span id="mrm-launcher-count" class="mrm-launcher-count" hidden>0</span>';
      panel = MRM.util.create("aside", { attrs: { id: "mrm-control-panel", role: "dialog", "aria-modal": "false", "aria-labelledby": "mrm-panel-title", hidden: true }, className: "mrm-control-panel" });
      panel.innerHTML = `
        <header class="mrm-panel-header"><div><strong id="mrm-panel-title">MRM workspace</strong><span id="mrm-result-count">0 results</span></div><button type="button" data-panel-action="close" aria-label="Close controls">×</button></header>
        <nav class="mrm-panel-tabs" aria-label="Settings sections"><button type="button" data-tab="filters" aria-selected="true">Filters</button><button type="button" data-tab="grid">Grid</button><button type="button" data-tab="theme">Theme</button></nav>
        <div class="mrm-panel-scroll">
          <section data-panel-section="filters">
            <label class="mrm-field"><span>Search visible archive</span><input id="mrm-live-search" type="search" autocomplete="off" placeholder="Title, artist, tags…"></label>
            <section class="mrm-view-section" aria-labelledby="mrm-view-title"><div class="mrm-section-heading"><strong id="mrm-view-title">Filter views</strong><button type="button" data-panel-action="save-view">Save current</button></div><div id="mrm-filter-views" class="mrm-filter-views"></div></section>
            <div id="mrm-filter-toggles"></div>
            <label class="mrm-field"><span>Display order</span><select id="mrm-sort"><option value="default">Newest first</option><option value="title-asc">Title A–Z</option><option value="title-desc">Title Z–A</option><option value="english-first">English first</option></select></label>
            <div id="mrm-native-search-controls"></div>
            <div class="mrm-inline-actions"><button type="button" data-panel-action="mark-read">Mark visible read</button><button type="button" data-panel-action="clear-filters">Clear filters</button></div>
            <div id="mrm-active-filters" class="mrm-active-filters" aria-label="Active filters"></div>
            <div id="mrm-facets" class="mrm-facets"></div>
          </section>
          <section data-panel-section="grid" hidden></section>
          <section data-panel-section="theme" hidden></section>
        </div>`;
      document.body.append(launcher, panel);
      launcher.addEventListener("click", () => togglePanel());
      panel.addEventListener("click", onPanelClick);
      panel.addEventListener("keydown", (event) => MRM.util.trapFocus(event, panel));
      const search = panel.querySelector("#mrm-live-search");
      search.value = MRM.storage.preferences.filters.query;
      search.addEventListener("input", MRM.util.debounce(() => updateFilters({ query: search.value }), 120));
      const sort = panel.querySelector("#mrm-sort");
      sort.value = MRM.storage.preferences.filters.sort;
      sort.addEventListener("change", () => updateFilters({ sort: sort.value }));
      renderNativeSearchControls();
      renderFilterViews();
      renderFilterToggles();
      renderGridSettings();
      renderThemeSettings();
      facetHost = panel.querySelector("#mrm-facets");
      refreshFacets();
      return panel;
    };
    const renderNativeSearchControls = () => {
      const host = panel.querySelector("#mrm-native-search-controls");
      host.replaceChildren();
      if (MRM.runtime.page !== "search") return;
      const native = MRM.util.q("#ep-sort");
      const field = MRM.util.create("label", { className: "mrm-field" });
      const select = MRM.util.create("select", { attrs: { id: "mrm-native-sort" } });
      if (native) for (const option of native.options) select.append(MRM.util.create("option", { text: option.textContent, attrs: { value: option.value } }));
      else for (const [value, label] of [["date", "Newest"], ["date_asc", "Oldest"], ["relevance", "Relevance"], ["rand", "Random"]]) select.append(MRM.util.create("option", { text: label, attrs: { value } }));
      select.value = MRM.facets.nativeSortValue() || "date";
      field.append(MRM.util.create("span", { text: "Site order" }), select);
      const apply = MRM.util.create("button", { text: "Apply filters on site", attrs: { type: "button", "data-panel-action": "apply-native" } });
      host.append(field, apply);
    };
    const builtinViews = () => [
      { id: "builtin-unread", name: "Unread", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: true } },
      { id: "builtin-english-unread", name: "English unread", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: true, onlyEnglish: true } },
      { id: "builtin-english", name: "English only", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: false, onlyEnglish: true } },
      { id: "builtin-saved", name: "Saved for later", filters: { ...MRM.storage.preferences.filters, query: "", hideRead: false, onlySaved: true } },
      { id: "builtin-defaults", name: "Default exclusions", filters: structuredClone(MRM.storage.defaults.filters) },
    ];
    const renderFilterViews = () => {
      const host = panel?.querySelector("#mrm-filter-views");
      if (!host) return;
      host.replaceChildren();
      for (const view of [...builtinViews(), ...(MRM.storage.preferences.savedViews || [])]) {
        const item = MRM.util.create("div", { className: "mrm-filter-view" });
        const apply = MRM.util.create("button", { text: view.name, attrs: { type: "button", title: `Apply ${view.name}` } });
        apply.addEventListener("click", () => MRM.storage.applyView(view));
        item.append(apply);
        if (!view.id.startsWith("builtin-")) {
          const remove = MRM.util.create("button", { text: "×", className: "mrm-filter-view-remove", attrs: { type: "button", "aria-label": `Delete saved view ${view.name}` } });
          remove.addEventListener("click", () => MRM.storage.deleteView(view.id));
          item.append(remove);
        }
        host.append(item);
      }
    };
    const renderFilterToggles = () => {
      const host = panel.querySelector("#mrm-filter-toggles");
      host.replaceChildren(
        makeToggle("Hide read", MRM.storage.preferences.filters.hideRead, (value) => updateFilters({ hideRead: value })),
        makeToggle("Only English", MRM.storage.preferences.filters.onlyEnglish, (value) => updateFilters({ onlyEnglish: value })),
        makeToggle("Saved for later only", MRM.storage.preferences.filters.onlySaved, (value) => updateFilters({ onlySaved: value })),
      );
    };
    const rangeField = (label, key, value, min, max, step, onInput) => {
      const row = MRM.util.create("label", { className: "mrm-field" });
      const output = MRM.util.create("output", { text: String(value) });
      const input = MRM.util.create("input", { attrs: { type: "range", min, max, step, value, "data-grid-key": key } });
      input.addEventListener("input", () => { output.value = input.value; onInput(Number(input.value)); });
      row.append(MRM.util.create("span", { text: label }), output, input);
      return row;
    };
    const renderGridSettings = () => {
      const host = panel.querySelector("[data-panel-section='grid']");
      const updateGrid = (patch) => MRM.storage.update({ grid: { ...MRM.storage.preferences.grid, ...patch } });
      const g = MRM.storage.preferences.grid;
      const density = MRM.util.create("fieldset", { className: "mrm-density-settings" });
      density.append(MRM.util.create("legend", { text: "Archive density" }));
      const choices = MRM.util.create("div", { className: "mrm-density-options", attrs: { role: "radiogroup", "aria-label": "Archive density" } });
      for (const [value, title, description] of [
        ["comfortable", "Comfortable", "4 columns · larger covers"],
        ["balanced", "Balanced", "5 columns · recommended"],
        ["compact", "Compact", "6 columns · more results"],
      ]) {
        const button = MRM.util.create("button", { className: "mrm-density-option", attrs: { type: "button", role: "radio", "aria-checked": g.density === value }, dataset: { density: value } });
        button.append(MRM.util.create("strong", { text: title }), MRM.util.create("span", { text: description }));
        button.addEventListener("click", () => {
          updateGrid({ density: value });
          renderGridSettings();
        });
        choices.append(button);
      }
      density.append(choices);
      const advanced = MRM.util.create("details", { className: "mrm-grid-advanced" });
      advanced.append(MRM.util.create("summary", { text: "Custom grid controls" }));
      const advancedBody = MRM.util.create("div", { className: "mrm-grid-advanced-body" });
      const customUpdate = (patch) => updateGrid({ density: "custom", ...patch });
      advancedBody.append(
        rangeField("Desktop columns", "desktop", g.desktop, 2, 10, 1, (value) => customUpdate({ desktop: value })),
        rangeField("Tablet columns", "tablet", g.tablet, 2, 8, 1, (value) => customUpdate({ tablet: value })),
        rangeField("Mobile columns", "mobile", g.mobile, 1, 4, 1, (value) => customUpdate({ mobile: value })),
        rangeField("Grid gap", "gap", g.gap, 4, 32, 1, (value) => customUpdate({ gap: value })),
      );
      advanced.append(advancedBody);
      const ratio = rangeField("Cover ratio", "ratio", g.ratio, 0.55, 1.2, 0.01, (value) => updateGrid({ ratio: value }));
      const cover = (() => {
        const field = MRM.util.create("label", { className: "mrm-field" });
        const select = MRM.util.create("select");
        select.innerHTML = '<option value="contain">Fit entire cover</option><option value="cover">Fill card frame</option>';
        select.value = g.coverFit === "cover" ? "cover" : "contain";
        select.addEventListener("change", () => updateGrid({ coverFit: select.value }));
        field.append(MRM.util.create("span", { text: "Cover display" }), select);
        return field;
      })();
      host.replaceChildren(density, ratio, cover, advanced);
    };
    const renderThemeSettings = () => {
      const host = panel.querySelector("[data-panel-section='theme']");
      const prefs = MRM.storage.preferences;
      const ui = makeToggle("Enable site makeover", prefs.uiEnabled, (value) => MRM.storage.update({ uiEnabled: value }));
      const dock = MRM.util.create("label", { className: "mrm-field" });
      const dockSelect = MRM.util.create("select");
      dockSelect.innerHTML = '<option value="right">Dock right</option><option value="left">Dock left</option>';
      dockSelect.value = prefs.dock;
      dockSelect.addEventListener("change", () => MRM.storage.update({ dock: dockSelect.value }));
      dock.append(MRM.util.create("span", { text: "Panel position" }), dockSelect);
      const accent = MRM.util.create("label", { className: "mrm-field" });
      const color = MRM.util.create("input", { attrs: { type: "color", value: prefs.accent } });
      const text = MRM.util.create("input", { attrs: { type: "text", value: prefs.accent, maxlength: 7, pattern: "#[0-9A-Fa-f]{6}" } });
      const applyColor = (value) => { if (/^#[0-9a-f]{6}$/i.test(value)) MRM.storage.update({ accent: value }); };
      color.addEventListener("input", () => { text.value = color.value; applyColor(color.value); });
      text.addEventListener("change", () => { color.value = text.value; applyColor(text.value); });
      accent.append(MRM.util.create("span", { text: "Accent" }), color, text);
      const borders = MRM.util.create("fieldset", { className: "mrm-border-grid" });
      borders.append(MRM.util.create("legend", { text: "Borders" }));
      for (const [name, enabled] of Object.entries(prefs.border)) borders.append(makeToggle(MRM.util.slugLabel(name), enabled, (value) => MRM.storage.update({ border: { ...MRM.storage.preferences.border, [name]: value } })));
      const readerProfile = MRM.util.create("p", { className: "mrm-settings-note", text: `Reader controls are remembered separately for ${MRM.storage.readerDevice()} and ${MRM.storage.readerDevice() === "mobile" ? "desktop" : "mobile"}.` });
      const clearRead = MRM.util.create("button", { text: "Clear read history", attrs: { type: "button" } });
      clearRead.addEventListener("click", () => { if (confirm("Clear all locally stored read history?")) MRM.storage.clearRead(); });
      const clearSaved = MRM.util.create("button", { text: "Clear saved posts", attrs: { type: "button" } });
      clearSaved.addEventListener("click", () => { if (confirm("Remove every locally saved post?")) MRM.storage.clearSaved(); });
      const dataActions = MRM.util.create("div", { className: "mrm-inline-actions" });
      dataActions.append(clearRead, clearSaved);
      host.replaceChildren(ui, dock, accent, borders, readerProfile, dataActions);
    };
    const termRow = (type, term) => {
      const row = MRM.util.create("div", { className: "mrm-facet-term" });
      const label = MRM.util.create("span", { text: term.name });
      const count = MRM.util.create("small", { text: term.count ? String(term.count) : "" });
      const include = MRM.util.create("button", { text: "Include", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("include", type).includes(term.slug) } });
      const exclude = MRM.util.create("button", { text: "Exclude", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("exclude", type).includes(term.slug) } });
      include.addEventListener("click", () => MRM.facets.toggle("include", type, term.slug));
      exclude.addEventListener("click", () => MRM.facets.toggle("exclude", type, term.slug));
      row.append(label, count, include, exclude);
      return row;
    };
    const refreshFacets = () => {
      if (!facetHost) return;
      facetHost.replaceChildren();
      for (const [type, terms] of Object.entries(MRM.facets.directory)) {
        const details = MRM.util.create("details", { className: "mrm-facet-group" });
        const summary = MRM.util.create("summary", { text: `${MRM.site.facetPrefixes[type]} (${terms.length})` });
        const search = MRM.util.create("input", { attrs: { type: "search", placeholder: `Search ${MRM.site.facetPrefixes[type].toLocaleLowerCase()}`, "aria-label": `Search ${MRM.site.facetPrefixes[type]}` } });
        const list = MRM.util.create("div", { className: "mrm-facet-list" });
        const renderTerms = () => {
          const needle = MRM.util.normalize(search.value);
          const filtered = terms.filter((term) => !needle || MRM.util.normalize(term.name).includes(needle));
          list.replaceChildren(...filtered.slice(0, 8).map((term) => termRow(type, term)));
          more.hidden = filtered.length <= 8;
        };
        const more = MRM.util.create("button", { className: "mrm-facet-more", text: "Show all", attrs: { type: "button" } });
        more.addEventListener("click", () => openFacetModal(type, terms, MRM.site.facetPrefixes[type]));
        search.addEventListener("input", MRM.util.debounce(renderTerms, 80));
        details.append(summary, search, list, more);
        facetHost.append(details);
        renderTerms();
      }
    };
    const openFacetModal = (type, terms, title) => {
      let modal = MRM.util.q("#mrm-facet-modal");
      if (!modal) {
        modal = MRM.util.create("section", { attrs: { id: "mrm-facet-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-facet-modal-title" }, className: "mrm-facet-modal" });
        document.body.append(modal);
      }
      modal.innerHTML = `<div class="mrm-facet-modal-card"><header><h2 id="mrm-facet-modal-title"></h2><button type="button" data-modal-close aria-label="Close">×</button></header><input type="search" aria-label="Search options" placeholder="Search options…"><div class="mrm-facet-modal-list"></div><footer class="mrm-facet-modal-pagination"><button type="button" data-page="previous">Previous</button><span aria-live="polite"></span><button type="button" data-page="next">Next</button></footer></div>`;
      modal.querySelector("h2").textContent = title;
      const input = modal.querySelector("input");
      const list = modal.querySelector(".mrm-facet-modal-list");
      const pageLabel = modal.querySelector(".mrm-facet-modal-pagination span");
      const previous = modal.querySelector("[data-page='previous']");
      const next = modal.querySelector("[data-page='next']");
      const pageSize = 18;
      let page = 0;
      const render = () => {
        const needle = MRM.util.normalize(input.value);
        const filtered = terms.filter((term) => !needle || MRM.util.normalize(term.name).includes(needle));
        const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
        page = MRM.util.clamp(page, 0, pageCount - 1);
        const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);
        list.replaceChildren(...visible.map((term) => type ? termRow(type, term) : MRM.util.create("span", { className: "mrm-taxonomy-chip", text: term.name })));
        pageLabel.textContent = `${page + 1} / ${pageCount} · ${filtered.length} options`;
        previous.disabled = page <= 0;
        next.disabled = page >= pageCount - 1;
      };
      previous.addEventListener("click", () => { page -= 1; render(); });
      next.addEventListener("click", () => { page += 1; render(); });
      input.addEventListener("input", () => { page = 0; render(); });
      MRM.runtime.facetModalOpen = true;
      document.documentElement.classList.add("mrm-modal-open");
      const closeModal = () => { MRM.runtime.facetModalOpen = false; document.documentElement.classList.remove("mrm-modal-open"); modal.remove(); };
      modal.querySelector("[data-modal-close]").addEventListener("click", closeModal);
      modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
      modal.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); else MRM.util.trapFocus(event, modal); });
      render(); input.focus();
    };
    const openMetadataPopover = (button, card, values) => {
      MRM.util.q("#mrm-metadata-popover")?.remove();
      document.documentElement.classList.remove("mrm-metadata-open");
      const mobile = matchMedia("(max-width: 680px)").matches;
      const popover = MRM.util.create("section", { attrs: { id: "mrm-metadata-popover", role: "dialog", "aria-modal": String(mobile), "aria-labelledby": "mrm-metadata-title" }, className: "mrm-metadata-popover" });
      const header = MRM.util.create("header");
      header.append(MRM.util.create("strong", { id: "mrm-metadata-title", text: card.title }), MRM.util.create("button", { text: "×", attrs: { type: "button", "aria-label": "Close metadata" } }));
      const body = MRM.util.create("div", { className: "mrm-metadata-groups" });
      const grouped = new Map();
      for (const item of values) { if (!grouped.has(item.type)) grouped.set(item.type, []); grouped.get(item.type).push(item); }
      for (const [type, items] of grouped) {
        const group = MRM.util.create("section", { className: "mrm-metadata-group" });
        group.append(MRM.util.create("h3", { text: MRM.site.facetPrefixes[type] || MRM.util.slugLabel(type) }));
        const chips = MRM.util.create("div", { className: "mrm-metadata-group-chips" });
        for (const item of items) {
          const chip = MRM.util.create("button", { text: MRM.util.slugLabel(item.slug), attrs: { type: "button", title: `Include ${MRM.util.slugLabel(item.slug)}` } });
          chip.addEventListener("click", () => { MRM.facets.toggle("include", item.type, item.slug); close(); });
          chips.append(chip);
        }
        group.append(chips); body.append(group);
      }
      let outside = null;
      const close = () => {
        document.documentElement.classList.remove("mrm-metadata-open");
        popover.remove();
        if (outside) document.removeEventListener("pointerdown", outside, true);
      };
      popover.append(header, body); document.body.append(popover);
      if (mobile) document.documentElement.classList.add("mrm-metadata-open");
      const rect = button.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();
      const below = rect.bottom + 8;
      const top = below + popoverRect.height <= innerHeight - 12 ? below : Math.max(12, rect.top - popoverRect.height - 8);
      popover.style.setProperty("--mrm-popover-left", `${Math.max(12, Math.min(innerWidth - Math.min(360, innerWidth - 24) - 12, rect.left))}px`);
      popover.style.setProperty("--mrm-popover-top", `${top}px`);
      header.querySelector("button").addEventListener("click", close);
      outside = (event) => { if (!popover.contains(event.target) && event.target !== button) close(); };
      setTimeout(() => document.addEventListener("pointerdown", outside, true), 0);
      popover.addEventListener("keydown", (event) => { if (event.key === "Escape") { close(); button.focus(); } else MRM.util.trapFocus(event, popover); });
      popover.querySelector("button").focus();
    };
    const selectTab = (section = "filters") => {
      renderPanel();
      const tab = panel.querySelector(`[data-tab="${section}"]`) || panel.querySelector("[data-tab='filters']");
      panel.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
      panel.querySelectorAll("[data-panel-section]").forEach((node) => node.hidden = node.dataset.panelSection !== tab.dataset.tab);
    };
    const togglePanel = (force, section) => {
      renderPanel();
      if (section) selectTab(section);
      const open = force ?? panel.hidden;
      panel.hidden = !open;
      MRM.runtime.panelOpen = open;
      document.documentElement.classList.toggle("mrm-panel-open", open && matchMedia("(max-width: 760px)").matches);
      const launcher = MRM.util.q("#mrm-panel-launcher");
      launcher.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector("[data-panel-action='close']").focus();
      else launcher.focus();
    };
    const open = (section = "filters") => togglePanel(true, section);
    const onPanelClick = (event) => {
      const tab = event.target.closest("[data-tab]");
      if (tab) {
        panel.querySelectorAll("[data-tab]").forEach((button) => button.setAttribute("aria-selected", String(button === tab)));
        panel.querySelectorAll("[data-panel-section]").forEach((section) => section.hidden = section.dataset.panelSection !== tab.dataset.tab);
        return;
      }
      const action = event.target.closest("[data-panel-action]")?.dataset.panelAction;
      if (action === "close") togglePanel(false);
      if (action === "mark-read") MRM.archive.markVisibleRead();
      if (action === "save-view") { const name = prompt("Name this filter view"); if (name) MRM.storage.saveView(name); }
      if (action === "apply-native") MRM.facets.applyNative(panel.querySelector("#mrm-native-sort")?.value || MRM.facets.nativeSortValue());
      if (action === "clear-filters") {
        MRM.archive.clearFilters();
        panel.querySelector("#mrm-live-search").value = "";
        renderFilterToggles();
      }
    };
    const installRecoveryButton = () => {
      if (MRM.util.q("#mrm-ui-recovery")) return;
      const button = MRM.util.create("button", { attrs: { id: "mrm-ui-recovery", type: "button" }, text: "Enable MRM UI" });
      button.addEventListener("click", () => MRM.storage.update({ uiEnabled: true }));
      document.body.append(button);
    };
    const init = () => {
      renderPanel();
      installRecoveryButton();
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && MRM.runtime.panelOpen && !event.defaultPrevented) togglePanel(false);
      });
    };
    MRM.events.addEventListener("preferences", () => {
      if (!panel) return;
      const search = panel.querySelector("#mrm-live-search");
      if (document.activeElement !== search) search.value = MRM.storage.preferences.filters.query;
      panel.querySelector("#mrm-sort").value = MRM.storage.preferences.filters.sort;
      panel.querySelectorAll(".mrm-density-option").forEach((button) => button.setAttribute("aria-checked", String(button.dataset.density === MRM.storage.preferences.grid.density)));
      refreshFacets();
      renderFilterViews();
    });
    return { init, open, togglePanel, refreshFacets, openFacetModal, openMetadataPopover, installRecoveryButton };
  })();

  // module: 08-app.js
  MRM.app = (() => {
    const removeNoise = () => {
      document.querySelectorAll("ins[data-zoneid], .eas6a97888e38, [id^='ad-'], .advertisement, .before-footer-widgets").forEach((node) => node.remove());
    };
  
    const normalizeHref = (href) => {
      try {
        const url = new URL(href, location.href);
        return `${url.origin}${url.pathname.replace(/\/$/, "") || "/"}${url.search}`;
      } catch { return ""; }
    };
  
    const currentLink = (href) => {
      try {
        const target = new URL(href, location.href);
        if (target.hostname !== location.hostname) return false;
        if (target.searchParams.get("ep_sort") === "rand") return new URL(location.href).searchParams.get("ep_sort") === "rand";
        const targetPath = target.pathname.replace(/\/$/, "") || "/";
        const currentPath = location.pathname.replace(/\/$/, "") || "/";
        if (targetPath === "/") return currentPath === "/" && !location.search;
        return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
      } catch { return false; }
    };
  
    const collectNavigationLinks = (nativeNav) => {
      const seen = new Set();
      return MRM.util.qa("a[href]", nativeNav || document).map((anchor) => ({
        href: anchor.href,
        label: MRM.util.text(anchor.textContent || anchor.title),
        title: MRM.util.text(anchor.title),
        rel: anchor.rel,
      })).filter((item) => {
        if (!item.href || !item.label || /^mrm$/i.test(item.label)) return false;
        const key = normalizeHref(item.href);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
  
    const navigationAnchor = (item) => {
      const anchor = MRM.util.create("a", { text: item.label, attrs: { href: item.href, title: item.title || item.label } });
      if (item.rel) anchor.rel = item.rel;
      if (currentLink(item.href)) anchor.setAttribute("aria-current", "page");
      return anchor;
    };
  
    const installToolbarMotion = (toolbar) => {
      let previousY = Math.max(0, window.scrollY);
      let frame = 0;
      const sync = () => {
        frame = 0;
        const currentY = Math.max(0, window.scrollY);
        const delta = currentY - previousY;
        const blocked = document.documentElement.classList.contains("mrm-reader-open") || MRM.runtime.panelOpen || MRM.runtime.facetModalOpen;
        if (blocked || currentY < 120 || delta < -5) toolbar.classList.remove("mrm-site-toolbar-hidden");
        else if (delta > 7 && currentY > 180) toolbar.classList.add("mrm-site-toolbar-hidden");
        document.documentElement.classList.toggle("mrm-header-hidden", toolbar.classList.contains("mrm-site-toolbar-hidden"));
        previousY = currentY;
      };
      window.addEventListener("scroll", () => {
        if (!frame) frame = requestAnimationFrame(sync);
      }, { passive: true });
      toolbar.addEventListener("focusin", () => {
        toolbar.classList.remove("mrm-site-toolbar-hidden");
        document.documentElement.classList.remove("mrm-header-hidden");
      });
    };
  
    const enhanceSiteChrome = () => {
      if (MRM.util.q("#mrm-site-toolbar")) return;
      const nativeNav = MRM.util.q(".nav-primary");
      const nativeHeader = MRM.util.q(".site-header");
      if (!nativeNav && !nativeHeader) return;
      const toolbar = MRM.util.create("header", { className: "mrm-site-toolbar", attrs: { id: "mrm-site-toolbar" } });
      const mainTarget = MRM.util.q("main, .site-inner .content, .content");
      if (mainTarget && !mainTarget.id) mainTarget.id = "mrm-main-content";
      const skip = MRM.util.create("a", { className: "mrm-skip-link", text: "Skip to content", attrs: { href: `#${mainTarget?.id || "mrm-main-content"}` } });
      const inner = MRM.util.create("div", { className: "mrm-site-toolbar-inner" });
      const homeHref = MRM.util.q(".menu-item-home a[href]", nativeNav || document)?.href || new URL("/", location.href).href;
      const brand = MRM.util.create("a", { className: "mrm-site-brand", attrs: { href: homeHref, "aria-label": "MyReadingManga home" } });
      if (location.pathname === "/" && !location.search) brand.setAttribute("aria-current", "page");
      brand.innerHTML = '<span class="mrm-site-brand-mark" aria-hidden="true">MRM</span><span class="mrm-site-brand-copy"><strong>MyReadingManga</strong><small>Reimagined</small></span>';
  
      const nav = MRM.util.create("nav", { className: "mrm-site-nav", attrs: { "aria-label": "Main navigation" } });
      const menu = MRM.util.create("ul", { className: "mrm-site-menu" });
      const links = collectNavigationLinks(nativeNav);
      const primary = links.slice(0, 5);
      const overflow = links.slice(5);
      for (const item of primary) {
        const li = MRM.util.create("li");
        li.append(navigationAnchor(item));
        menu.append(li);
      }
      if (overflow.length) {
        const li = MRM.util.create("li", { className: "mrm-site-more-item" });
        const details = MRM.util.create("details", { className: "mrm-site-more" });
        const summary = MRM.util.create("summary", { text: "More" });
        const popup = MRM.util.create("div", { className: "mrm-site-more-menu" });
        for (const item of overflow) popup.append(navigationAnchor(item));
        details.append(summary, popup);
        details.addEventListener("toggle", () => {
          if (details.open) requestAnimationFrame(() => popup.querySelector("a")?.focus({ preventScroll: true }));
        });
        document.addEventListener("pointerdown", (event) => {
          if (details.open && !details.contains(event.target)) details.open = false;
        }, true);
        li.append(details);
        menu.append(li);
      }
      nav.append(menu);
  
      const archiveOwnsSearch = MRM.runtime.page === "archive" || MRM.runtime.page === "search";
      if (archiveOwnsSearch) toolbar.classList.add("mrm-site-toolbar-no-search");
      inner.append(brand, nav);
      if (!archiveOwnsSearch) {
        const sourceSearch = MRM.util.q("form.search-form", nativeHeader || document);
        const search = MRM.util.create("form", { className: "mrm-site-search", attrs: { role: "search", action: sourceSearch?.action || homeHref, method: "get" } });
        const query = MRM.util.create("input", { attrs: { type: "search", name: "s", value: sourceSearch?.querySelector("input[name='s']")?.value || "", placeholder: "Search MyReadingManga", autocomplete: "off", "aria-label": "Search MyReadingManga" } });
        const submit = MRM.util.create("button", { text: "Search", attrs: { type: "submit" } });
        search.append(query, submit);
        inner.append(search);
      }
      toolbar.append(skip, inner);
      (nativeNav || nativeHeader).before(toolbar);
      installToolbarMotion(toolbar);
    };
  
    const uniqueClones = (nodes, limit = Infinity) => {
      const seen = new Set();
      const out = [];
      for (const node of nodes) {
        const anchor = node.matches?.("a[href]") ? node : node.querySelector?.("a[href]");
        const key = normalizeHref(anchor?.href || "") || MRM.util.normalize(node.textContent);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        const clone = node.cloneNode(true);
        clone.querySelectorAll?.("script, iframe, form").forEach((child) => child.remove());
        clone.querySelectorAll?.("[id]").forEach((child) => child.removeAttribute("id"));
        if (clone.id) clone.removeAttribute("id");
        out.push(clone);
        if (out.length >= limit) break;
      }
      return out;
    };
  
    const appendOverflow = (host, nodes, visibleCount, label) => {
      nodes.slice(0, visibleCount).forEach((node) => host.append(node));
      if (nodes.length <= visibleCount) return;
      const details = MRM.util.create("details", { className: "mrm-compact-footer-overflow" });
      const summary = MRM.util.create("summary", { text: `${label} (${nodes.length - visibleCount})` });
      const content = MRM.util.create("div", { className: "mrm-compact-footer-overflow-content" });
      nodes.slice(visibleCount).forEach((node) => content.append(node));
      details.append(summary, content);
      host.append(details);
    };
  
    const footerSection = (title, kind) => {
      const details = MRM.util.create("details", { className: `mrm-compact-footer-section mrm-footer-${kind}` });
      if (!matchMedia("(max-width: 760px)").matches) details.open = true;
      const summary = MRM.util.create("summary");
      summary.innerHTML = `<span>${MRM.util.escapeHtml(title)}</span><span class="mrm-footer-chevron" aria-hidden="true">⌄</span>`;
      const body = MRM.util.create("div", { className: "mrm-compact-footer-body" });
      details.append(summary, body);
      return { details, body };
    };
  
    const enhanceFooter = () => {
      if (MRM.util.q("#mrm-compact-footer")) return;
      const nativeFooter = MRM.util.q(".site-footer");
      const beforeFooter = MRM.util.q(".before-footer");
      const widgetFooter = MRM.util.q(".footer-widgets");
      if (!nativeFooter && !beforeFooter && !widgetFooter) return;
  
      const shell = MRM.util.create("footer", { className: "mrm-compact-footer", attrs: { id: "mrm-compact-footer", "aria-label": "MyReadingManga footer" } });
      const grid = MRM.util.create("div", { className: "mrm-compact-footer-grid" });
  
      const comments = uniqueClones(MRM.util.qa("#recentcomments > li", beforeFooter || document), 12);
      if (comments.length) {
        const section = footerSection("Recent comments", "comments");
        const list = MRM.util.create("ul", { className: "mrm-compact-comments" });
        appendOverflow(list, comments, 4, "More comments");
        section.body.append(list);
        grid.append(section.details);
      }
  
      const browseLinks = uniqueClones(MRM.util.qa(".footer-widgets .tagcloud > a", widgetFooter || document), 80);
      if (browseLinks.length) {
        const section = footerSection("Browse", "browse");
        const links = MRM.util.create("div", { className: "mrm-compact-link-cloud" });
        appendOverflow(links, browseLinks, 14, "Browse all");
        section.body.append(links);
        grid.append(section.details);
      }
  
      const siteLinkSources = [
        ...MRM.util.qa(".nav-primary a[href]"),
        ...MRM.util.qa(".site-footer .nav-secondary a[href], .site-footer a[href]", nativeFooter || document),
      ];
      const siteLinks = uniqueClones(siteLinkSources, 20).filter((node) => MRM.util.normalize(node.textContent) !== "mrm");
      if (siteLinks.length) {
        const section = footerSection("Site links", "links");
        const links = MRM.util.create("nav", { className: "mrm-compact-site-links", attrs: { "aria-label": "Footer links" } });
        siteLinks.forEach((node) => links.append(node));
        section.body.append(links);
        grid.append(section.details);
      }
  
      shell.append(grid);
      const copyrightSource = MRM.util.q(".copyright, .site-footer p", nativeFooter || document);
      if (copyrightSource) {
        const copyright = MRM.util.create("div", { className: "mrm-compact-copyright" });
        const clone = copyrightSource.cloneNode(true);
        clone.querySelectorAll?.("script, iframe, form").forEach((node) => node.remove());
        copyright.append(clone);
        shell.append(copyright);
      }
      (nativeFooter || widgetFooter || beforeFooter).before(shell);
      document.documentElement.classList.add("mrm-compact-footer-ready");
    };
  
    const initPost = () => {
      document.body.classList.add("mrm-post-page");
      MRM.settings.installRecoveryButton();
      MRM.reader.installPostButtons();
      removeNoise();
    };
    const initArchive = () => {
      MRM.facets.syncFromUrl();
      MRM.settings.init();
      MRM.archive.init();
      removeNoise();
    };
    const start = () => {
      if (!MRM.config.hostnames.includes(location.hostname)) return;
      MRM.theme.install();
      MRM.runtime.page = MRM.site.detectPage();
      document.documentElement.dataset.mrmPage = MRM.runtime.page;
      enhanceSiteChrome();
      enhanceFooter();
      if (MRM.runtime.page === "post") initPost();
      else if (MRM.runtime.page === "archive" || MRM.runtime.page === "search") initArchive();
      else MRM.settings.init();
    };
    return { start };
  })();
  
  MRM.app.start();
})();
