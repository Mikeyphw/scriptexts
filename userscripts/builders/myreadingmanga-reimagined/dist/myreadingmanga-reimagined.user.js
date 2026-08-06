// ==UserScript==
// @name         MyReadingManga Reimagined
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/myreadingmanga-reimagined
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/myreadingmanga-reimagined
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/myreadingmanga-reimagined/dist/myreadingmanga-reimagined.user.js
// @version      6.2.0
// @description  A clean-room MyReadingManga archive workspace with density modes, a sticky archive command bar, clearer card hierarchy, visible read and reading-progress states, stable PageTual ingestion, persistent facets, and an accessible manga reader.
// @run-at       document-idle
// @match        https://myreadingmanga.info/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";
  const MRM = {
    config: Object.freeze({"id":"myreadingmanga-reimagined","name":"MyReadingManga Reimagined","version":"6.2.0","description":"A clean-room MyReadingManga archive workspace with density modes, a sticky archive command bar, clearer card hierarchy, visible read and reading-progress states, stable PageTual ingestion, persistent facets, and an accessible manga reader.","matches":["https://myreadingmanga.info/*"],"runAt":"document-idle","storagePrefix":"mrm-reimagined-v1","hostnames":["myreadingmanga.info"],"fixtureContractVersion":1}),
    css: "/* archive.css */\nhtml.mrm-ui-enabled .mrm-archive-page .breadcrumb { display: none !important; }\nhtml.mrm-ui-enabled .mrm-archive-page main.content,\nhtml.mrm-ui-enabled .mrm-archive-page .content,\nhtml.mrm-ui-enabled .mrm-archive-page .content-archive,\nhtml.mrm-ui-enabled .mrm-archive-page .archive-content { display: block !important; width: 100% !important; max-width: none !important; min-width: 0 !important; float: none !important; clear: both !important; }\n\n.mrm-archive-overview { position: sticky; z-index: 90000; top: 78px; display: grid; gap: 14px; margin: 0 0 clamp(22px, 2.8vw, 36px); padding: 18px clamp(18px, 2.2vw, 28px); border: 1px solid var(--mrm-line); border-radius: 20px; background: color-mix(in srgb, var(--mrm-surface) 94%, transparent); box-shadow: 0 16px 42px rgba(0,0,0,.24); backdrop-filter: blur(20px) saturate(145%); }\n.mrm-overview-heading { display: flex; min-width: 0; align-items: end; justify-content: space-between; gap: 24px; }\n.mrm-overview-copy { min-width: 0; }\n.mrm-overview-eyebrow { display: block; margin-bottom: 5px; color: var(--mrm-accent); font-size: 11px; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }\n.mrm-overview-copy h1 { margin: 0 !important; color: var(--mrm-text) !important; font-size: clamp(24px, calc(20px + .8vw), 34px) !important; line-height: 1.08 !important; letter-spacing: -.032em; }\n.mrm-overview-result-summary { flex: 0 0 auto; display: grid; justify-items: end; gap: 1px; color: var(--mrm-muted); font-size: 12px; line-height: 1.35; }\n.mrm-overview-result-summary strong { color: var(--mrm-text); font-size: 25px; line-height: 1; }\n#mrm-overview-progress-count { color: color-mix(in srgb, var(--mrm-accent) 76%, white); font-weight: 750; }\n.mrm-overview-search { display: grid; grid-template-columns: auto minmax(0,1fr); align-items: center; min-width: 0; min-height: 48px; border: 1px solid var(--mrm-line); border-radius: 13px; padding-inline: 13px; background: var(--mrm-surface-2); color: var(--mrm-muted); }\n.mrm-overview-search:focus-within { border-color: color-mix(in srgb, var(--mrm-accent) 65%, var(--mrm-line)); outline: 3px solid color-mix(in srgb, var(--mrm-accent) 15%, transparent); }\n.mrm-overview-search > span[aria-hidden] { font-size: 20px; line-height: 1; }\n.mrm-overview-search input { width: 100%; min-width: 0; min-height: 46px; border: 0 !important; padding: 0 0 0 10px !important; background: transparent !important; color: var(--mrm-text) !important; font-size: 15px !important; box-shadow: none !important; }\n.mrm-overview-command-row { display: grid; grid-template-columns: auto minmax(150px, 190px) auto auto; align-items: end; gap: 9px; }\n.mrm-overview-quick-filters, .mrm-overview-density { display: inline-flex; min-width: 0; align-items: center; gap: 5px; border: 1px solid var(--mrm-line); border-radius: 12px; padding: 4px; background: var(--mrm-surface-2); }\n.mrm-overview-quick-filters button, .mrm-overview-density button { min-height: 36px; border: 0; border-radius: 8px; padding: 0 11px; background: transparent; color: var(--mrm-muted); font-size: 13px; font-weight: 750; cursor: pointer; white-space: nowrap; }\n.mrm-overview-quick-filters button[aria-pressed=\"true\"], .mrm-overview-density button[aria-checked=\"true\"] { background: color-mix(in srgb, var(--mrm-accent) 23%, var(--mrm-surface-3)); color: var(--mrm-text); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mrm-accent) 46%, transparent); }\n.mrm-overview-sort { display: grid; gap: 4px; color: var(--mrm-muted); font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }\n.mrm-overview-sort select { width: 100%; min-height: 46px; border: 1px solid var(--mrm-line) !important; border-radius: 12px; padding: 0 34px 0 11px !important; background: var(--mrm-surface-2) !important; color: var(--mrm-text) !important; font-size: 14px !important; text-transform: none; box-shadow: none !important; }\n.mrm-overview-filter-button { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; gap: 8px; border: 1px solid color-mix(in srgb, var(--mrm-accent) 55%, var(--mrm-line)); border-radius: 12px; padding: 0 15px; background: color-mix(in srgb, var(--mrm-accent) 15%, var(--mrm-surface-2)); color: var(--mrm-text); font-size: 14px; font-weight: 800; cursor: pointer; white-space: nowrap; }\n.mrm-overview-filter-button:hover { background: color-mix(in srgb, var(--mrm-accent) 24%, var(--mrm-surface-2)); }\n.mrm-overview-filter-row { display: flex; min-width: 0; align-items: flex-start; gap: 10px; }\n.mrm-overview-active-filters[hidden], .mrm-overview-clear[hidden], #mrm-overview-progress-count[hidden] { display: none !important; }\n.mrm-overview-active-filters { flex: 1; display: flex; flex-wrap: wrap; min-width: 0; max-width: 100%; gap: 7px; overflow: visible; }\n.mrm-overview-clear { flex: 0 0 auto; min-height: 34px; border: 0; border-radius: 9px; padding: 0 10px; background: transparent; color: var(--mrm-muted); font-size: 13px; cursor: pointer; }\n.mrm-overview-clear:hover { background: var(--mrm-surface-2); color: var(--mrm-text); }\n\nhtml.mrm-ui-enabled .mrm-card-grid { display: grid !important; grid-template-columns: repeat(var(--mrm-grid-desktop), minmax(0, 1fr)); gap: var(--mrm-grid-gap) !important; align-items: stretch; width: 100% !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; clear: both !important; }\nhtml.mrm-ui-enabled .mrm-card-grid > .mrm-card { width: auto !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; float: none !important; clear: none !important; }\nhtml.mrm-ui-enabled .mrm-card { position: relative; display: flex !important; flex-direction: column; min-width: 0; overflow: hidden; container-type: inline-size; container-name: mrm-card; border-radius: var(--mrm-radius); background: var(--mrm-surface); box-shadow: 0 10px 28px rgba(0,0,0,.22); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }\nhtml.mrm-ui-enabled .mrm-card:hover { transform: translateY(-3px); box-shadow: 0 18px 38px rgba(0,0,0,.32); }\nhtml[data-mrm-border-cards=\"on\"] .mrm-card { border: 1px solid var(--mrm-line) !important; }\nhtml[data-mrm-border-cards=\"off\"] .mrm-card { border: 0 !important; }\nhtml.mrm-ui-enabled .mrm-card .entry-header { order: 2; display: flex; flex-direction: column; align-items: stretch; min-height: 82px; padding: 13px 13px 8px !important; }\nhtml.mrm-ui-enabled .mrm-card .entry-title { width: 100%; margin: 0 !important; color: var(--mrm-text) !important; font-size: clamp(15px, calc(14px + .14vw), 17px) !important; line-height: 1.34 !important; font-weight: 780 !important; letter-spacing: -.012em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\nhtml.mrm-ui-enabled .mrm-card .entry-title a { color: var(--mrm-text) !important; text-decoration: none !important; }\nhtml.mrm-ui-enabled .mrm-card .entry-title a:hover { color: color-mix(in srgb, var(--mrm-accent) 86%, white) !important; }\n.mrm-card-byline { min-height: 17px; margin: 7px 0 0 !important; overflow: hidden; color: var(--mrm-muted) !important; font-size: 12px !important; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }\nhtml.mrm-ui-enabled .mrm-card-cover { order: 1; position: relative; width: 100% !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; aspect-ratio: var(--mrm-cover-ratio); overflow: hidden; background: radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--mrm-accent) 13%, var(--mrm-surface-2)), var(--mrm-surface-2) 68%); }\nhtml.mrm-ui-enabled .mrm-card-cover > :not(.entry-image-link):not(.mrm-card-badges) { display: none !important; }\nhtml.mrm-ui-enabled .mrm-card-cover > a,\nhtml.mrm-ui-enabled .mrm-card-cover > a img { display: block; width: 100% !important; max-width: none !important; height: 100% !important; }\nhtml.mrm-ui-enabled .mrm-card-cover img { object-position: center top !important; transition: transform .2s ease, filter .2s ease, opacity .2s ease; }\nhtml[data-mrm-cover-fit=\"contain\"] .mrm-card-cover img { object-fit: contain !important; }\nhtml[data-mrm-cover-fit=\"cover\"] .mrm-card-cover img { object-fit: cover !important; }\nhtml.mrm-ui-enabled .mrm-card:hover .mrm-card-cover img { transform: scale(1.018); }\n.mrm-card-badges { position: absolute; z-index: 3; inset: 8px 8px auto; display: flex !important; align-items: flex-start; justify-content: space-between; gap: 8px; pointer-events: none; }\n.mrm-card-language-badge, .mrm-card-state-badge { display: inline-flex; min-height: 28px; align-items: center; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 5px 9px; background: rgba(8,9,13,.82); color: #fff; font-size: 11px; font-weight: 850; line-height: 1; box-shadow: 0 5px 16px rgba(0,0,0,.28); backdrop-filter: blur(10px); }\n.mrm-card-state-badge { margin-left: auto; background: color-mix(in srgb, var(--mrm-accent) 78%, rgba(8,9,13,.88)); }\n.mrm-card-state-badge.is-complete { background: rgba(22,117,72,.92); }\n.mrm-card-state-badge[hidden] { display: none !important; }\n.mrm-is-read .mrm-card-cover img { filter: saturate(.66) brightness(.73); }\n.mrm-in-progress .mrm-card-cover img { filter: saturate(.9) brightness(.9); }\nhtml.mrm-ui-enabled .mrm-card .entry-footer { order: 3; display: grid; gap: 9px; margin-top: auto; padding: 0 12px 12px !important; min-width: 0; overflow: visible !important; }\n.mrm-card-chips { display: flex; flex-wrap: wrap; align-items: stretch; gap: 5px; min-width: 0; max-width: 100%; min-height: 30px; overflow: visible; }\n.mrm-taxonomy-chip, .mrm-filter-chip { box-sizing: border-box; max-width: 100%; height: auto !important; max-height: none !important; border-radius: 999px; border: 1px solid var(--mrm-line); background: var(--mrm-surface-2); color: var(--mrm-muted); font-size: 12px; line-height: 1.2; min-height: 30px; padding: 7px 10px; white-space: nowrap; }\n.mrm-taxonomy-chip { display: inline-flex; flex: 0 1 auto; min-width: 0; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }\n.mrm-chip-label { display: block; min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-taxonomy-chip[data-type=\"lang\"] { color: color-mix(in srgb, var(--mrm-accent) 75%, white); }\n.mrm-taxonomy-more { flex: 0 0 auto; min-width: 38px; padding-inline: 9px; color: var(--mrm-text); overflow: visible; }\n.mrm-taxonomy-more-compact { display: none; }\nhtml[data-mrm-border-chips=\"off\"] .mrm-taxonomy-chip, html[data-mrm-border-chips=\"off\"] .mrm-filter-chip { border-color: transparent; }\n.mrm-card-progress[hidden] { display: none !important; }\n.mrm-card-progress { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 7px; align-items: center; color: var(--mrm-muted); font-size: 11px; }\n.mrm-card-progress-track { position: relative; height: 5px; overflow: hidden; border-radius: 999px; background: var(--mrm-surface-3); }\n.mrm-card-progress-bar { position: absolute; inset: 0 auto 0 0; width: var(--mrm-progress, 0%); border-radius: inherit; background: var(--mrm-accent); }\n.mrm-card-progress-label { white-space: nowrap; }\n.mrm-card-actions { display: grid; grid-template-columns: minmax(0,1fr) 42px; gap: 6px; min-width: 0; }\n.mrm-reader-button, .mrm-primary-action, .mrm-card-original, .mrm-card-read-toggle { min-height: 42px; border: 1px solid color-mix(in srgb, var(--mrm-accent) 45%, var(--mrm-line)); border-radius: 11px; background: color-mix(in srgb, var(--mrm-accent) 12%, var(--mrm-surface-2)); color: color-mix(in srgb, var(--mrm-accent) 82%, white); font-size: 13px; font-weight: 800; cursor: pointer; text-decoration: none !important; }\n.mrm-reader-button { display: flex; min-width: 0; align-items: center; justify-content: space-between; padding-inline: 13px; }\n.mrm-reader-button > span { font-size: 19px; line-height: 1; }\n.mrm-card-original { display: grid; place-items: center; padding: 0; font-size: 17px; }\n.mrm-card-read-toggle { grid-column: 1 / -1; min-height: 32px; border-color: transparent; padding: 0 8px; background: transparent; color: var(--mrm-muted); font-size: 12px; font-weight: 700; }\n.mrm-reader-button:hover, .mrm-primary-action:hover, .mrm-card-original:hover { background: color-mix(in srgb, var(--mrm-accent) 24%, var(--mrm-surface-2)); color: var(--mrm-text); }\n.mrm-card-read-toggle:hover { background: var(--mrm-surface-2); color: var(--mrm-text); }\n\nhtml.mrm-ui-enabled .archive-pagination.pagination { display: block !important; width: 100% !important; max-width: none !important; clear: both !important; margin: clamp(30px, 4vw, 54px) 0 0 !important; padding: 0 !important; border: 0 !important; background: transparent !important; box-shadow: none !important; }\nhtml.mrm-ui-enabled .archive-pagination > ul { display: flex !important; align-items: center; justify-content: center; flex-wrap: wrap; gap: 7px; margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .archive-pagination li { margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .archive-pagination a,\nhtml.mrm-ui-enabled .archive-pagination .pagination-omission { display: inline-grid !important; min-width: 44px; min-height: 44px; place-items: center; margin: 0 !important; border: 1px solid var(--mrm-line); border-radius: 11px; padding: 0 10px; background: var(--mrm-surface); color: var(--mrm-muted) !important; font-size: 14px; font-weight: 750; text-decoration: none !important; }\nhtml.mrm-ui-enabled .archive-pagination a:hover { border-color: color-mix(in srgb, var(--mrm-accent) 60%, var(--mrm-line)); color: var(--mrm-text) !important; }\nhtml.mrm-ui-enabled .archive-pagination .active > a,\nhtml.mrm-ui-enabled .archive-pagination a[aria-current=\"page\"] { border-color: transparent; background: var(--mrm-accent); color: #09090d !important; }\nhtml.mrm-ui-enabled .archive-pagination .pagination-next > a,\nhtml.mrm-ui-enabled .archive-pagination .pagination-previous > a { min-width: 96px; }\nhtml.mrm-ui-enabled #pagetual-sideController,\nhtml.mrm-ui-enabled [id^=\"pagetual-sideController\"] { display: block !important; visibility: visible !important; z-index: 2147480900 !important; }\nhtml.mrm-ui-enabled .mrm-archive-page .pagetual_pageBar,\nhtml.mrm-ui-enabled .mrm-archive-page .autopagerize_page_info,\nhtml.mrm-ui-enabled .mrm-archive-page [id^=\"pagetual_pageBar\"] { display: flex !important; visibility: visible !important; grid-column: 1 / -1 !important; width: calc(100% - 20px) !important; max-width: calc(100% - 20px) !important; min-height: 44px !important; margin: 18px 10px !important; padding: 7px 12px !important; align-items: center !important; justify-content: center !important; border: 1px solid var(--mrm-line) !important; border-radius: 999px !important; background: color-mix(in srgb, var(--mrm-surface) 92%, transparent) !important; box-shadow: 0 12px 30px rgba(0,0,0,.24) !important; color: var(--mrm-text) !important; font-size: 14px !important; font-weight: 800 !important; line-height: 1.2 !important; text-indent: 0 !important; opacity: 1 !important; position: relative !important; z-index: 20 !important; box-sizing: border-box !important; }\nhtml.mrm-ui-enabled .mrm-archive-page .pagetual_pageBar :is(a, span),\nhtml.mrm-ui-enabled .mrm-archive-page .autopagerize_page_info :is(a, span),\nhtml.mrm-ui-enabled .mrm-archive-page [id^=\"pagetual_pageBar\"] :is(a, span) { color: var(--mrm-text) !important; font-size: 14px !important; line-height: 1.2 !important; text-decoration: none !important; }\nhtml[data-mrm-border-pagination=\"off\"] .archive-pagination { border: 0 !important; box-shadow: none !important; }\n\n@media (max-width: 1380px) {\n  .mrm-overview-command-row { grid-template-columns: minmax(0,1fr) minmax(150px, 190px) auto; }\n  .mrm-overview-density { grid-column: 1 / 3; width: fit-content; }\n  .mrm-overview-filter-button { grid-column: 3; grid-row: 1 / span 2; align-self: stretch; }\n}\n@media (max-width: 1100px) {\n  html.mrm-ui-enabled .mrm-card-grid { grid-template-columns: repeat(var(--mrm-grid-tablet), minmax(0,1fr)); }\n  .mrm-archive-overview { top: 76px; }\n  .mrm-overview-command-row { grid-template-columns: minmax(0,1fr) auto; }\n  .mrm-overview-sort { grid-column: 1; }\n  .mrm-overview-density { grid-column: 1 / -1; }\n  .mrm-overview-filter-button { grid-column: 2; grid-row: 1 / span 2; }\n}\n@media (max-width: 760px) {\n  .mrm-archive-overview { top: 0; gap: 10px; margin: 0 -2px 18px; padding: 13px; border-radius: 15px; }\n  .mrm-overview-heading { align-items: center; gap: 12px; }\n  .mrm-overview-eyebrow { display: none; }\n  .mrm-overview-copy h1 { font-size: 20px !important; }\n  .mrm-overview-result-summary strong { font-size: 20px; }\n  .mrm-overview-result-summary { font-size: 11px; }\n  .mrm-overview-search { min-height: 44px; }\n  .mrm-overview-search input { min-height: 42px; font-size: 14px !important; }\n  .mrm-overview-command-row { grid-template-columns: minmax(0,1fr) auto; gap: 7px; }\n  .mrm-overview-quick-filters { overflow-x: auto; }\n  .mrm-overview-sort { display: none; }\n  .mrm-overview-density { display: none; }\n  .mrm-overview-filter-button { grid-column: 2; grid-row: 1; min-height: 44px; padding-inline: 12px; }\n  .mrm-overview-filter-row { max-height: 76px; overflow-y: auto; }\n  html.mrm-ui-enabled .mrm-card-grid { grid-template-columns: repeat(var(--mrm-grid-mobile), minmax(0,1fr)); gap: max(9px, calc(var(--mrm-grid-gap) * .7)) !important; }\n  html.mrm-ui-enabled .mrm-card { border-radius: 13px; }\n  html.mrm-ui-enabled .mrm-card .entry-header { min-height: 70px; padding: 10px 9px 7px !important; }\n  html.mrm-ui-enabled .mrm-card .entry-title { font-size: 14px !important; line-height: 1.34 !important; }\n  .mrm-card-byline { margin-top: 5px !important; font-size: 11px !important; }\n  html.mrm-ui-enabled .mrm-card .entry-footer { gap: 7px; padding: 0 8px 9px !important; }\n  .mrm-card-badges { inset: 6px 6px auto; }\n  .mrm-card-language-badge, .mrm-card-state-badge { min-height: 25px; padding: 4px 7px; font-size: 10px; }\n  .mrm-card-chips { gap: 4px; }\n  .mrm-taxonomy-chip { min-height: 28px; padding: 6px 8px; font-size: 11px; }\n  .mrm-card-actions { grid-template-columns: minmax(0,1fr) 38px; gap: 5px; }\n  .mrm-reader-button, .mrm-card-original { min-height: 38px; }\n  .mrm-card-read-toggle { min-height: 30px; }\n  html.mrm-ui-enabled .archive-pagination a { min-width: 42px; min-height: 42px; }\n}\n\n@container mrm-card (max-width: 230px) {\n  .mrm-taxonomy-secondary, .mrm-taxonomy-more-wide { display: none !important; }\n  .mrm-taxonomy-more-compact { display: inline-flex; }\n}\n@container mrm-card (max-width: 185px) {\n  .mrm-card-byline { display: none; }\n  html.mrm-ui-enabled .mrm-card .entry-header { min-height: 62px; }\n  .mrm-card-read-toggle { font-size: 11px; }\n}\n\n/* Host themes often set card buttons to inherit a tiny or oversized root value. Keep card controls deterministic. */\nhtml.mrm-ui-enabled .mrm-card .mrm-taxonomy-chip { font-size: 12px; }\nhtml.mrm-ui-enabled .mrm-card .mrm-reader-button { font-size: 13px; }\nhtml.mrm-ui-enabled .mrm-card .mrm-card-original { font-size: 17px; }\nhtml.mrm-ui-enabled .mrm-card .mrm-card-read-toggle { font-size: 12px; }\n@media (max-width: 760px) {\n  html.mrm-ui-enabled .mrm-card .mrm-taxonomy-chip { font-size: 11px; }\n  html.mrm-ui-enabled .mrm-card .mrm-reader-button { font-size: 12px; }\n  html.mrm-ui-enabled .mrm-card .mrm-card-read-toggle { font-size: 11px; }\n}\n\n@media (min-width: 761px) and (max-width: 1120px) {\n  .mrm-archive-overview { top: 126px; }\n}\n\n/* base.css */\n:root {\n  --mrm-accent: #9b7cff;\n  --mrm-bg: #090a0f;\n  --mrm-surface: #14161d;\n  --mrm-surface-2: #1b1e27;\n  --mrm-surface-3: #242834;\n  --mrm-text: #f6f7fb;\n  --mrm-muted: #aeb4c2;\n  --mrm-line: rgba(255,255,255,.13);\n  --mrm-shadow: 0 18px 54px rgba(0,0,0,.38);\n  --mrm-radius: 16px;\n  --mrm-grid-desktop: 5;\n  --mrm-grid-tablet: 4;\n  --mrm-grid-mobile: 2;\n  --mrm-grid-gap: 18px;\n  --mrm-cover-ratio: .714;\n  --mrm-type-base: 16px;\n  --mrm-type-xs: 12px;\n  --mrm-type-sm: 13px;\n  --mrm-type-md: 15px;\n  --mrm-type-lg: 17px;\n  color-scheme: dark;\n}\nhtml.mrm-ui-enabled *, html.mrm-ui-enabled *::before, html.mrm-ui-enabled *::after { box-sizing: border-box; }\n.mrm-sr-only { position: fixed !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0 0 0 0) !important; white-space: nowrap !important; }\nhtml.mrm-ui-enabled { max-width: 100%; overflow-x: clip !important; background: var(--mrm-bg) !important; }\nhtml.mrm-ui-enabled body { max-width: 100%; margin: 0 !important; overflow-x: hidden !important; background: var(--mrm-bg) !important; color: var(--mrm-text) !important; }\nhtml.mrm-ui-enabled body, html.mrm-ui-enabled button, html.mrm-ui-enabled input, html.mrm-ui-enabled select { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif !important; }\n.mrm-site-toolbar, .mrm-archive-overview, .mrm-card-grid, .mrm-control-panel, .mrm-facet-modal, .mrm-reader-modal, #mrm-panel-launcher, #mrm-ui-recovery,\nhtml.mrm-ui-enabled .before-footer, html.mrm-ui-enabled .footer-widgets, html.mrm-ui-enabled .site-footer { font-size: var(--mrm-type-base) !important; }\n.mrm-site-toolbar button, .mrm-site-toolbar input, .mrm-archive-overview button, .mrm-archive-overview input, .mrm-archive-overview select,\n.mrm-card button, .mrm-control-panel button, .mrm-control-panel input, .mrm-control-panel select, .mrm-facet-modal button, .mrm-facet-modal input,\n.mrm-reader-modal button, .mrm-reader-modal input, .mrm-reader-modal select, #mrm-panel-launcher, #mrm-ui-recovery { font-size: inherit; }\nhtml.mrm-ui-enabled a { color: inherit; }\nhtml.mrm-ui-enabled .site-container { background: transparent !important; }\nhtml.mrm-ui-enabled .nav-primary,\nhtml.mrm-ui-enabled .site-header { display: none !important; }\nhtml.mrm-ui-disabled .mrm-site-toolbar { display: none !important; }\n\n.mrm-site-toolbar {\n  position: sticky;\n  z-index: 100000;\n  top: 0;\n  width: 100%;\n  border-bottom: 1px solid var(--mrm-line);\n  background: color-mix(in srgb, var(--mrm-surface) 92%, transparent);\n  color: var(--mrm-text);\n  box-shadow: 0 10px 34px rgba(0,0,0,.22);\n  backdrop-filter: blur(18px) saturate(145%);\n}\n.mrm-site-toolbar-inner {\n  width: min(100%, 1920px);\n  min-height: 68px;\n  margin-inline: auto;\n  padding: 10px clamp(16px, 2.4vw, 46px);\n  display: grid;\n  grid-template-columns: auto minmax(0,1fr) minmax(240px, 340px);\n  gap: clamp(14px, 2vw, 30px);\n  align-items: center;\n}\n.mrm-site-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none !important; white-space: nowrap; }\n.mrm-site-brand-mark { display: grid; place-items: center; min-width: 48px; min-height: 42px; border-radius: 13px; background: var(--mrm-accent); color: #09090d; font-size: 13px; font-weight: 950; letter-spacing: .05em; }\n.mrm-site-brand-copy { display: grid; line-height: 1.05; }\n.mrm-site-brand-copy strong { font-size: 15px; letter-spacing: -.01em; }\n.mrm-site-brand-copy small { margin-top: 4px; color: var(--mrm-muted); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }\n.mrm-site-nav { min-width: 0; overflow-x: auto; scrollbar-width: none; }\n.mrm-site-nav::-webkit-scrollbar { display: none; }\n.mrm-site-menu { display: flex !important; align-items: center; gap: 4px; width: max-content; margin: 0 !important; padding: 0 !important; list-style: none !important; }\n.mrm-site-menu > li { margin: 0 !important; padding: 0 !important; list-style: none !important; }\n.mrm-site-menu a { display: flex; min-height: 40px; align-items: center; padding: 0 11px; border-radius: 10px; color: var(--mrm-muted) !important; font-size: 13px; font-weight: 750; letter-spacing: .025em; text-decoration: none !important; text-transform: uppercase; white-space: nowrap; }\n.mrm-site-menu a:hover, .mrm-site-menu a:focus-visible { background: var(--mrm-surface-2); color: var(--mrm-text) !important; outline: none; }\n.mrm-site-search { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: stretch; min-width: 0; border: 1px solid var(--mrm-line); border-radius: 13px; background: var(--mrm-surface-2); overflow: hidden; }\n.mrm-site-search:focus-within { border-color: color-mix(in srgb, var(--mrm-accent) 65%, var(--mrm-line)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--mrm-accent) 16%, transparent); }\n.mrm-site-search input { min-width: 0; min-height: 44px; font-size: 14px !important; border: 0 !important; background: transparent !important; color: var(--mrm-text) !important; padding: 0 13px !important; box-shadow: none !important; }\n.mrm-site-search button { min-width: 76px; font-size: 13px; border: 0; border-left: 1px solid var(--mrm-line); background: color-mix(in srgb, var(--mrm-accent) 14%, var(--mrm-surface-2)); color: var(--mrm-text); font-weight: 800; cursor: pointer; }\n.mrm-site-search button:hover { background: color-mix(in srgb, var(--mrm-accent) 23%, var(--mrm-surface-2)); }\nhtml[data-mrm-border-header=\"off\"] .mrm-site-toolbar { border-bottom-color: transparent; }\n\nhtml.mrm-ui-enabled .site-inner { width: min(100%, 1920px) !important; max-width: 1920px !important; margin-inline: auto !important; padding: clamp(22px, 3vw, 46px) clamp(14px, 2.6vw, 48px) clamp(48px, 6vw, 86px) !important; }\nhtml.mrm-ui-enabled .content-sidebar-wrap,\nhtml.mrm-ui-enabled main.content,\nhtml.mrm-ui-enabled .content { width: 100% !important; max-width: none !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; float: none !important; }\n\nhtml.mrm-ui-enabled .before-footer,\nhtml.mrm-ui-enabled .footer-widgets,\nhtml.mrm-ui-enabled .site-footer { border: 0 !important; border-top: 1px solid var(--mrm-line) !important; background: var(--mrm-surface) !important; color: var(--mrm-text) !important; box-shadow: none !important; }\nhtml.mrm-ui-enabled .before-footer .wrap,\nhtml.mrm-ui-enabled .footer-widgets > .wrap,\nhtml.mrm-ui-enabled .site-footer > .wrap { width: min(100%, 1680px) !important; max-width: 1680px !important; margin-inline: auto !important; padding: clamp(26px, 4vw, 54px) clamp(18px, 3vw, 48px) !important; }\nhtml.mrm-ui-enabled .before-footer .widget-title,\nhtml.mrm-ui-enabled .footer-widgets .widget-title { margin: 0 0 18px !important; color: var(--mrm-text) !important; font-size: 13px !important; font-weight: 850 !important; letter-spacing: .12em !important; text-transform: uppercase !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px 18px; margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments > li { min-width: 0; margin: 0 !important; padding: 11px 13px !important; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-muted); font-size: 14px; line-height: 1.5; list-style: none !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments a { color: var(--mrm-text) !important; text-decoration: none !important; }\nhtml.mrm-ui-enabled .before-footer #recentcomments a:hover { color: var(--mrm-accent) !important; }\nhtml.mrm-ui-enabled .footer-widgets > .wrap { display: grid !important; grid-template-columns: repeat(3, minmax(0,1fr)); gap: clamp(24px, 4vw, 58px); }\nhtml.mrm-ui-enabled .footer-widgets .widget-area { width: auto !important; margin: 0 !important; float: none !important; }\nhtml.mrm-ui-enabled .footer-widgets .widget { margin: 0 0 26px !important; }\nhtml.mrm-ui-enabled .footer-widgets .tagcloud { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }\nhtml.mrm-ui-enabled .footer-widgets .tagcloud > a,\nhtml.mrm-ui-enabled .footer-widgets .menu a { display: inline-flex; min-height: 34px; align-items: center; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 7px 10px; background: var(--mrm-surface-2); color: var(--mrm-muted) !important; font-size: 12px !important; line-height: 1.2; text-decoration: none !important; }\nhtml.mrm-ui-enabled .footer-widgets .tagcloud > a:hover,\nhtml.mrm-ui-enabled .footer-widgets .menu a:hover { border-color: color-mix(in srgb, var(--mrm-accent) 55%, var(--mrm-line)); color: var(--mrm-text) !important; }\n.mrm-footer-more { flex-basis: 100%; margin-top: 10px; }\n.mrm-footer-more summary { width: fit-content; cursor: pointer; color: var(--mrm-accent); font-size: 13px; font-weight: 750; }\n.mrm-footer-more-content { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }\n#recentcomments .mrm-footer-more { grid-column: 1 / -1; }\n#recentcomments .mrm-footer-more-content { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px 18px; }\n#recentcomments .mrm-footer-more-content > li { min-width: 0; padding: 11px 13px; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-muted); list-style: none; }\nhtml.mrm-ui-enabled .site-footer { text-align: center; }\nhtml.mrm-ui-enabled .site-footer > .wrap { display: grid; gap: 16px; justify-items: center; padding-block: 30px !important; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary .menu { display: flex !important; flex-wrap: wrap; justify-content: center; gap: 5px 16px; margin: 0 !important; padding: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary li { margin: 0 !important; list-style: none !important; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary a { color: var(--mrm-muted) !important; font-size: 12px; font-weight: 750; letter-spacing: .06em; text-decoration: none !important; text-transform: uppercase; }\nhtml.mrm-ui-enabled .site-footer .nav-secondary a:hover { color: var(--mrm-accent) !important; }\nhtml.mrm-ui-enabled .site-footer .copyright,\nhtml.mrm-ui-enabled .site-footer p { max-width: 860px; margin: 0 !important; color: color-mix(in srgb, var(--mrm-muted) 82%, transparent) !important; font-size: 12px !important; line-height: 1.6; }\n\n#mrm-ui-recovery { position: fixed; right: 14px; bottom: 14px; z-index: 2147482000; display: none; border: 1px solid var(--mrm-line); border-radius: 999px; padding: 10px 14px; background: var(--mrm-surface); color: var(--mrm-text); box-shadow: var(--mrm-shadow); }\nhtml.mrm-ui-disabled #mrm-ui-recovery { display: block; }\n\n@media (max-width: 1120px) {\n  .mrm-site-toolbar-inner { grid-template-columns: auto minmax(220px, 1fr); }\n  .mrm-site-nav { grid-column: 1 / -1; grid-row: 2; }\n  .mrm-site-search { grid-column: 2; grid-row: 1; }\n}\n@media (max-width: 760px) {\n  .mrm-site-toolbar { position: relative; }\n  .mrm-site-toolbar-inner { min-height: 0; grid-template-columns: 1fr; gap: 9px; padding: 10px 12px 12px; }\n  .mrm-site-brand { grid-column: 1; grid-row: 1; }\n  .mrm-site-brand-copy { display: none; }\n  .mrm-site-brand-mark { min-width: 54px; min-height: 40px; }\n  .mrm-site-search { grid-column: 1; grid-row: 2; }\n  .mrm-site-nav { grid-column: 1; grid-row: 3; }\n  .mrm-site-menu a { min-height: 40px; padding-inline: 11px; font-size: 13px; }\n  html.mrm-ui-enabled .site-inner { padding: 18px 10px 48px !important; }\n  html.mrm-ui-enabled .before-footer #recentcomments,\n  #recentcomments .mrm-footer-more-content,\n  html.mrm-ui-enabled .footer-widgets > .wrap { grid-template-columns: 1fr; }\n}\n@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }\n\n/* reader.css */\nhtml.mrm-reader-open, html.mrm-reader-open body { overflow: hidden !important; }\n.mrm-reader-modal { position: fixed; z-index: 2147483500; inset: 0; display: grid; grid-template-rows: auto auto minmax(0,1fr) auto; background: #08090c; color: var(--mrm-text); }\n.mrm-reader-modal[hidden] { display: none; }\nhtml[data-mrm-border-reader=\"on\"] .mrm-reader-modal { box-shadow: inset 0 0 0 1px var(--mrm-line); }\n.mrm-reader-toolbar { z-index: 3; display: grid; gap: 6px; padding: 8px 10px; background: rgba(15,17,23,.96); backdrop-filter: blur(14px); transition: transform .18s ease; }\n.mrm-reader-toolbar-primary { display: grid; grid-template-columns: auto auto minmax(0,1fr) auto auto; align-items: center; gap: 8px; }\n.mrm-reader-toolbar-primary h2 { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; text-align: center; }\n.mrm-reader-toolbar button, .mrm-reader-footer button { min-height: 42px; font-size: 14px; border: 0; border-radius: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 6px 10px; }\n.mrm-reader-toolbar-secondary { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: thin; }\n.mrm-reader-toolbar-secondary button { flex: 0 0 auto; }\n.mrm-reader-progress { background: var(--mrm-surface); padding: 3px 10px; }\n.mrm-reader-progress input { width: 100%; accent-color: var(--mrm-accent); }\n.mrm-reader-body { min-height: 0; display: grid; grid-template-columns: 112px minmax(0,1fr); }\n.mrm-reader-thumbnails { overflow-y: auto; padding: 8px; background: #0f1117; }\n.mrm-reader-thumbnail { width: 100%; display: grid; gap: 4px; margin-bottom: 8px; border: 2px solid transparent; border-radius: 8px; overflow: hidden; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 3px; }\n.mrm-reader-thumbnail.is-active { border-color: var(--mrm-accent); }\n.mrm-reader-thumbnail img { width: 100%; aspect-ratio: 3 / 4; object-fit: cover; }\n.mrm-reader-stage { min-width: 0; min-height: 0; overflow: auto; scroll-snap-type: y proximity; background: #050608; }\n.mrm-reader-page { width: min(100%, 980px); margin: 0 auto; display: grid; justify-items: center; scroll-snap-align: start; }\n.mrm-reader-page img { display: block; max-width: 100%; width: auto; height: auto; background: #111; }\n.mrm-reader-page figcaption { padding: 6px 10px; color: var(--mrm-muted); font-size: 12px; }\n.mrm-reader-modal[data-view=\"strip-gaps\"] .mrm-reader-page { margin-block: 14px; }\n.mrm-reader-modal[data-view=\"paged\"] .mrm-reader-stage { display: grid; place-items: center; padding: 8px; }\n.mrm-reader-modal[data-view=\"paged\"] .mrm-reader-page { height: 100%; align-content: center; }\n.mrm-reader-modal[data-fit=\"height\"] .mrm-reader-page img { max-height: calc(100vh - 180px); width: auto; }\n.mrm-reader-modal[data-fit=\"width\"] .mrm-reader-page img { width: 100%; max-height: none; }\n.mrm-reader-modal[data-width=\"comfort\"] .mrm-reader-page { max-width: 920px; }\n.mrm-reader-modal[data-width=\"wide\"] .mrm-reader-page { max-width: 1480px; }\n.mrm-reader-modal[data-thumbnails=\"off\"] .mrm-reader-body { grid-template-columns: minmax(0,1fr); }\n.mrm-reader-modal[data-thumbnails=\"off\"] .mrm-reader-thumbnails { display: none; }\n.mrm-reader-comments { overflow: auto; padding: clamp(14px, 3vw, 40px); background: var(--mrm-bg); }\n.mrm-reader-status { place-self: center; padding: 22px; border-radius: 14px; background: var(--mrm-surface); }\n.mrm-reader-error { color: #ff9a9a; }\n.mrm-reader-footer { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 7px 10px; background: var(--mrm-surface); }\n.mrm-reader-mobile-zones { display: none; }\n.mrm-reader-modal.is-toolbar-hidden .mrm-reader-toolbar { transform: translateY(-100%); position: absolute; width: 100%; }\n.mrm-post-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 18px; }\n.mrm-post-actions button { min-height: 46px; font-size: 14px; border: 0; border-radius: 11px; padding: 10px 16px; background: var(--mrm-surface-2); color: var(--mrm-text); }\nhtml.mrm-ui-enabled .mrm-post-page .entry-content > div:has(> img.img-myreadingmanga) { display: grid; justify-items: center; }\nhtml.mrm-ui-enabled .mrm-post-page .img-myreadingmanga { max-width: min(100%, 1100px); height: auto; }\n@media (max-width: 760px) {\n  .mrm-reader-modal { grid-template-rows: auto auto minmax(0,1fr); }\n  .mrm-reader-toolbar { padding: 6px; }\n  .mrm-reader-toolbar-primary { grid-template-columns: auto minmax(0,1fr) auto; }\n  .mrm-reader-toolbar-primary [data-reader-action=\"previous-post\"], .mrm-reader-toolbar-primary [data-reader-action=\"next-post\"] { display: none; }\n  .mrm-reader-toolbar-secondary { max-width: 100vw; }\n  .mrm-reader-body { grid-template-columns: minmax(0,1fr); }\n  .mrm-reader-thumbnails { display: none; }\n  .mrm-reader-footer { display: none; }\n  .mrm-reader-mobile-zones { pointer-events: none; display: grid; grid-template-columns: 30% 40% 30%; position: absolute; inset: 112px 0 0; z-index: 2; }\n  .mrm-reader-mobile-zones button { pointer-events: auto; border: 0; background: transparent; }\n  .mrm-reader-page figcaption { display: none; }\n  .mrm-reader-modal[data-fit=\"height\"] .mrm-reader-page img { max-height: calc(100vh - 125px); }\n}\n\n.mrm-post-taxonomies { flex-basis: 100%; display: flex; flex-wrap: wrap; gap: 6px; }\n.mrm-reader-toolbar button:disabled, .mrm-reader-footer button:disabled { opacity: .42; cursor: not-allowed; }\n\n/* Inline post reading layout */\nhtml.mrm-ui-enabled .mrm-post-page main.content,\nhtml.mrm-ui-enabled .mrm-post-page .content,\nhtml.mrm-ui-enabled .mrm-post-page article.entry,\nhtml.mrm-ui-enabled .mrm-post-page .entry-content {\n  width: 100% !important;\n  max-width: none !important;\n  min-width: 0 !important;\n  float: none !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page article.entry {\n  margin: 0 !important;\n  padding: 0 !important;\n  background: transparent !important;\n  box-shadow: none !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-header,\nhtml.mrm-ui-enabled .mrm-post-page #mrm-post-actions,\nhtml.mrm-ui-enabled .mrm-post-page .entry-content > :not(div:has(> img.img-myreadingmanga)),\nhtml.mrm-ui-enabled .mrm-post-page #comments,\nhtml.mrm-ui-enabled .mrm-post-page .entry-comments {\n  box-sizing: border-box !important;\n  width: min(100%, 1100px) !important;\n  margin-inline: auto !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-header {\n  padding: clamp(14px, 2.5vw, 26px) !important;\n  border-radius: var(--mrm-radius);\n  background: var(--mrm-surface) !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-title {\n  margin: 0 !important;\n  color: var(--mrm-text) !important;\n  font-size: clamp(20px, 3vw, 32px) !important;\n  line-height: 1.25 !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .entry-content > div:has(> img.img-myreadingmanga) {\n  display: grid !important;\n  justify-items: center;\n  width: 100% !important;\n  max-width: none !important;\n  min-width: 0 !important;\n  margin: 0 !important;\n  padding: 0 !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .img-myreadingmanga {\n  display: block !important;\n  width: min(100%, 1100px) !important;\n  max-width: 1100px !important;\n  min-width: 0 !important;\n  height: auto !important;\n  margin: 0 auto !important;\n  object-fit: contain !important;\n}\nhtml.mrm-ui-enabled .mrm-post-page .mrm-post-actions {\n  padding: 12px 0 18px;\n}\n@media (max-width: 680px) {\n  html.mrm-ui-enabled .mrm-post-page .site-inner { padding-inline: 0 !important; }\n  html.mrm-ui-enabled .mrm-post-page .entry-header,\n  html.mrm-ui-enabled .mrm-post-page #mrm-post-actions,\n  html.mrm-ui-enabled .mrm-post-page .entry-content > :not(div:has(> img.img-myreadingmanga)),\n  html.mrm-ui-enabled .mrm-post-page #comments,\n  html.mrm-ui-enabled .mrm-post-page .entry-comments { width: calc(100% - 24px) !important; }\n}\n\n/* settings.css */\n#mrm-panel-launcher { position: fixed; font-size: 14px; z-index: 2147481000; right: 18px; bottom: 20px; display: inline-flex; min-width: 112px; min-height: 48px; align-items: center; justify-content: center; gap: 8px; border: 1px solid color-mix(in srgb, var(--mrm-accent) 58%, var(--mrm-line)); border-radius: 999px; padding: 0 14px; background: color-mix(in srgb, var(--mrm-accent) 18%, var(--mrm-surface)); color: var(--mrm-text); font-weight: 850; box-shadow: var(--mrm-shadow); backdrop-filter: blur(14px); cursor: pointer; visibility: visible; transition: opacity .18s ease, transform .18s ease, visibility 0s linear 0s; }\n#mrm-panel-launcher:hover { background: color-mix(in srgb, var(--mrm-accent) 28%, var(--mrm-surface)); }\n#mrm-panel-launcher[aria-expanded=\"true\"], #mrm-panel-launcher.mrm-launcher-suppressed { opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(8px); transition: opacity .18s ease, transform .18s ease; }\n.mrm-launcher-icon { color: var(--mrm-accent); font-size: 17px; }\n.mrm-launcher-count { display: inline-grid; min-width: 23px; min-height: 23px; place-items: center; border-radius: 999px; background: var(--mrm-accent); color: #09090d; font-size: 12px; font-weight: 950; }\n.mrm-launcher-count[hidden] { display: none !important; }\nhtml[data-mrm-dock=\"left\"] #mrm-panel-launcher { right: auto; left: 18px; }\n.mrm-control-panel[hidden] { display: none !important; }\n.mrm-control-panel { position: fixed; z-index: 2147482000; inset: 10px 10px 10px auto; width: min(440px, calc(100vw - 20px)); display: grid; grid-template-rows: auto auto minmax(0,1fr); background: var(--mrm-surface); color: var(--mrm-text); border-radius: 20px; box-shadow: var(--mrm-shadow); overflow: hidden; }\nhtml[data-mrm-dock=\"left\"] .mrm-control-panel { inset: 10px auto 10px 10px; }\nhtml[data-mrm-border-panel=\"on\"] .mrm-control-panel { border: 1px solid var(--mrm-line); }\n.mrm-panel-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 18px; }\n.mrm-panel-header div { display: grid; gap: 4px; }\n.mrm-panel-header strong { font-size: 17px; }\n.mrm-panel-header span { color: var(--mrm-muted); font-size: 13px; }\n.mrm-panel-header button, .mrm-facet-modal header button { min-width: 44px; min-height: 44px; border: 0; border-radius: 50%; background: var(--mrm-surface-2); color: var(--mrm-text); font-size: 22px; cursor: pointer; }\n.mrm-panel-tabs { display: grid; grid-template-columns: repeat(3, 1fr); padding: 0 14px 14px; gap: 7px; }\n.mrm-panel-tabs button { min-height: 44px; font-size: 14px; border: 0; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-muted); cursor: pointer; }\n.mrm-panel-tabs button[aria-selected=\"true\"] { background: color-mix(in srgb, var(--mrm-accent) 24%, var(--mrm-surface-2)); color: var(--mrm-text); font-weight: 800; }\n.mrm-panel-scroll { overflow: auto; font-size: 15px; padding: 0 15px 20px; }\n.mrm-panel-scroll section { display: grid; gap: 15px; }\n.mrm-panel-scroll section[hidden] { display: none; }\n.mrm-field { display: grid; grid-template-columns: 1fr auto; gap: 7px 10px; align-items: center; }\n.mrm-field > input[type=\"search\"], .mrm-field > input[type=\"text\"], .mrm-field > select, .mrm-facet-group > input { grid-column: 1 / -1; font-size: 14px; width: 100%; min-height: 44px; border: 1px solid var(--mrm-line); border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 8px 11px; }\n.mrm-field > input[type=\"range\"] { grid-column: 1 / -1; width: 100%; accent-color: var(--mrm-accent); }\n.mrm-toggle-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; min-height: 44px; }\n.mrm-toggle-row input { width: 22px; height: 22px; accent-color: var(--mrm-accent); }\n.mrm-inline-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n.mrm-inline-actions button, .mrm-facet-more, [data-panel-section=\"theme\"] > button { min-height: 44px; font-size: 14px; border: 0; border-radius: 11px; background: var(--mrm-surface-2); color: var(--mrm-text); cursor: pointer; }\n.mrm-active-filters { display: flex; flex-wrap: wrap; min-width: 0; max-width: 100%; gap: 6px; overflow: visible; }\n.mrm-filter-chip { display: inline-flex; flex: 0 1 auto; min-width: 0; max-width: 100%; gap: 6px; align-items: center; overflow: hidden; color: var(--mrm-text); cursor: pointer; }\n.mrm-filter-chip-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-filter-chip-remove { flex: 0 0 auto; display: inline-grid; min-width: 16px; place-items: center; font-size: 15px; line-height: 1; }\n.mrm-facets { display: grid; gap: 8px; }\n.mrm-facet-group { border-radius: 12px; background: var(--mrm-surface-2); padding: 11px; }\n.mrm-facet-group summary { cursor: pointer; font-size: 15px; font-weight: 750; }\n.mrm-facet-group > input { margin-top: 10px; }\n.mrm-facet-list { display: grid; gap: 4px; margin-top: 8px; }\n.mrm-facet-term { display: grid; font-size: 14px; grid-template-columns: minmax(0,1fr) auto 42px 48px; gap: 6px; align-items: center; min-height: 38px; }\n.mrm-facet-term span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.mrm-facet-term small { color: var(--mrm-muted); }\n.mrm-facet-term button { min-height: 34px; border: 1px solid var(--mrm-line); border-radius: 8px; background: transparent; color: var(--mrm-muted); font-size: 12px; cursor: pointer; }\n.mrm-facet-term button[aria-pressed=\"true\"] { background: var(--mrm-accent); color: #09090d; border-color: transparent; font-weight: 800; }\n.mrm-border-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; border: 1px solid var(--mrm-line); border-radius: 12px; padding: 10px 12px; }\n.mrm-border-grid legend { padding-inline: 5px; }\n.mrm-facet-modal { position: fixed; z-index: 2147483000; inset: 0; display: grid; place-items: center; padding: 14px; background: rgba(0,0,0,.72); }\n.mrm-facet-modal-card { width: min(680px, 100%); max-height: min(84vh, 760px); display: grid; grid-template-rows: auto auto minmax(0,1fr) auto; gap: 12px; background: var(--mrm-surface); border-radius: 18px; padding: 16px; box-shadow: var(--mrm-shadow); }\n.mrm-facet-modal header { display: flex; justify-content: space-between; align-items: center; }\n.mrm-facet-modal input { min-height: 44px; font-size: 14px; border: 1px solid var(--mrm-line); border-radius: 10px; background: var(--mrm-surface-2); color: var(--mrm-text); padding: 8px 10px; }\n.mrm-facet-modal-list { overflow: auto; display: grid; gap: 5px; }\n.mrm-facet-modal-pagination { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; }\n.mrm-facet-modal-pagination button { min-height: 42px; font-size: 14px; border: 0; border-radius: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); }\n.mrm-facet-modal-pagination button:disabled { opacity: .45; }\nhtml.mrm-ui-disabled #mrm-panel-launcher, html.mrm-ui-disabled #mrm-control-panel { display: none !important; }\n#mrm-native-search-controls { display: grid; gap: 8px; }\n#mrm-native-search-controls > button { min-height: 42px; border: 0; border-radius: 10px; background: color-mix(in srgb, var(--mrm-accent) 22%, var(--mrm-surface-2)); color: var(--mrm-text); font-weight: 750; }\n@media (max-width: 680px) { .mrm-control-panel { inset: 0 !important; width: 100vw; border-radius: 0; } #mrm-panel-launcher { right: 12px; bottom: 14px; min-width: 104px; } html[data-mrm-dock=\"left\"] #mrm-panel-launcher { left: 12px; } }\n\n.mrm-density-settings { display: grid; gap: 10px; margin: 0; border: 1px solid var(--mrm-line); border-radius: 14px; padding: 12px; }\n.mrm-density-settings legend { padding-inline: 6px; color: var(--mrm-text); font-size: 14px; font-weight: 800; }\n.mrm-density-options { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 7px; }\n.mrm-density-option { display: grid; min-height: 72px; align-content: center; gap: 4px; border: 1px solid var(--mrm-line); border-radius: 11px; padding: 9px; background: var(--mrm-surface-2); color: var(--mrm-text); text-align: left; cursor: pointer; }\n.mrm-density-option strong { font-size: 13px; }\n.mrm-density-option span { color: var(--mrm-muted); font-size: 11px; line-height: 1.35; }\n.mrm-density-option[aria-checked=\"true\"] { border-color: color-mix(in srgb, var(--mrm-accent) 68%, var(--mrm-line)); background: color-mix(in srgb, var(--mrm-accent) 18%, var(--mrm-surface-2)); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mrm-accent) 35%, transparent); }\n.mrm-grid-advanced { border-radius: 12px; background: var(--mrm-surface-2); padding: 11px; }\n.mrm-grid-advanced summary { cursor: pointer; font-size: 14px; font-weight: 750; }\n.mrm-grid-advanced-body { display: grid; gap: 14px; margin-top: 14px; }\n@media (max-width: 440px) { .mrm-density-options { grid-template-columns: 1fr; } .mrm-density-option { min-height: 58px; } }",
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
    const facetCacheKey = `${MRM.config.storagePrefix}:facet-directory`;
    const readerCachePrefix = `${MRM.config.storagePrefix}:reader-pages:`;
    const defaults = Object.freeze({
      uiEnabled: true,
      dock: "right",
      accent: "#9b7cff",
      border: { header: false, cards: true, pagination: false, reader: false, panel: true, chips: true },
      grid: { density: "balanced", desktop: 5, tablet: 4, mobile: 2, gap: 18, ratio: 0.714, coverFit: "contain" },
      filters: { query: "", hideRead: false, onlyEnglish: false, sort: "default", include: {}, exclude: { tag: ["cuntboy", "ai", "shota"] } },
      reader: { view: "strip", width: "comfort", fit: "width", direction: "ltr", thumbnails: true, autoHideToolbar: true },
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
    const persist = () => localStorage.setItem(key, JSON.stringify(preferences));
    const persistRead = () => localStorage.setItem(readKey, JSON.stringify(readPosts));
    const persistProgress = () => localStorage.setItem(progressKey, JSON.stringify(readerProgress));
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
    const clearRead = () => {
      readPosts = {};
      readerProgress = {};
      localStorage.removeItem(readKey);
      localStorage.removeItem(progressKey);
      MRM.events.dispatchEvent(new Event("read-history"));
      MRM.events.dispatchEvent(new Event("reader-progress"));
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
      update,
      replaceFilters,
      markRead,
      unmarkRead,
      isRead,
      getReaderProgress,
      setReaderProgress,
      clearRead,
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
  
    const activeFilterCount = (filters = MRM.storage.preferences.filters) => {
      let count = Number(Boolean(filters.query)) + Number(Boolean(filters.hideRead)) + Number(Boolean(filters.onlyEnglish));
      for (const mode of ["include", "exclude"]) for (const values of Object.values(filters[mode] || {})) count += values.length;
      return count;
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
          </div>
        </div>
        <label class="mrm-overview-search"><span class="mrm-sr-only">Filter this archive</span><span aria-hidden="true">⌕</span><input id="mrm-overview-search" type="search" autocomplete="off" placeholder="Search titles, artists, groups, tags…"></label>
        <div class="mrm-overview-command-row">
          <div class="mrm-overview-quick-filters" aria-label="Quick filters">
            <button type="button" data-overview-toggle="onlyEnglish" aria-pressed="false">English</button>
            <button type="button" data-overview-toggle="hideRead" aria-pressed="false">Hide read</button>
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
        return MRM.facets.matches(card, filters);
      });
      const visibleSet = new Set(visible.map((card) => card.url));
      for (const card of MRM.runtime.cards) {
        card.article.hidden = !visibleSet.has(card.url);
        updateCardState(card);
      }
      syncGridOrder(ordered);
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
        MRM.settings.openFacetModal(null, values.map((item) => ({ ...item, name: MRM.util.slugLabel(item.slug), count: 0 })), `${card.title} metadata`);
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
      const readToggle = MRM.util.create("button", { className: "mrm-card-read-toggle", attrs: { type: "button" } });
      readToggle.addEventListener("click", (event) => {
        event.preventDefault();
        if (MRM.storage.isRead(card.url)) MRM.storage.unmarkRead(card.url);
        else MRM.storage.markRead(card.url, card.title);
      });
      actions.append(reader, original, readToggle);
      footer.replaceChildren(metadataChips(card), progress, actions);
      card.link.addEventListener("click", () => MRM.storage.markRead(card.url, card.title), { passive: true });
      content.classList.add("mrm-card-cover");
      const root = ensureGridRoot(card.article);
      if (root && card.article.parentElement !== root) root.append(card.article);
      updateCardState(card);
      return true;
    };
  
    const visibleCards = () => MRM.runtime.cards.filter((card) => !card.article.hidden);
    const markVisibleRead = () => {
      for (const card of visibleCards()) MRM.storage.markRead(card.url, card.title);
      filterAndSort();
    };
    const clearFilters = () => MRM.storage.replaceFilters({ ...MRM.storage.preferences.filters, query: "", hideRead: false, onlyEnglish: false, include: {}, exclude: {} });
  
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
      markPageTualCandidates(root);
      ingest(root);
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
        if (data && typeof data === "object" && data.command === "pagetual" && data.action === "insert") handlePageTualInsert(event);
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
    };
  
    MRM.events.addEventListener("preferences", filterAndSort);
    MRM.events.addEventListener("read-history", filterAndSort);
    MRM.events.addEventListener("reader-progress", filterAndSort);
    return { init, scan, filterAndSort, visibleCards, markVisibleRead, clearFilters, renderActiveChips, activeFilterCount };
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
    };
    const renderShell = () => {
      if (state.modal) return state.modal;
      const modal = MRM.util.create("section", { className: "mrm-reader-modal", attrs: { role: "dialog", "aria-modal": "true", "aria-labelledby": "mrm-reader-title", hidden: true } });
      modal.innerHTML = `
        <div class="mrm-reader-toolbar">
          <div class="mrm-reader-toolbar-primary">
            <button type="button" data-reader-action="close" aria-label="Close reader">×</button>
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
            <button type="button" data-reader-action="open-tab">Open post</button>
            <button type="button" data-reader-action="fullscreen" title="Fullscreen (F)">Fullscreen</button>
          </div>
        </div>
        <div class="mrm-reader-progress"><input id="mrm-reader-scrubber" type="range" min="1" max="1" value="1" aria-label="Reader page"></div>
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
      modal.querySelector(".mrm-reader-stage").addEventListener("scroll", MRM.util.throttle(onScroll, 80));
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
        requestAnimationFrame(() => goTo(state.pageIndex, false));
        prefetchAdjacent();
      } catch (error) {
        const stage = state.modal.querySelector(".mrm-reader-stage");
        stage.replaceChildren(MRM.util.create("div", { className: "mrm-reader-status mrm-reader-error", text: error.message || "Reader could not open this post.", attrs: { role: "alert" } }));
      }
    };
    const updateNavigation = () => {
      const atFirst = state.pageIndex <= 0;
      const atLast = state.pageIndex >= Math.max(0, state.pages.length - 1);
      for (const action of ["first-page", "previous-page"]) for (const button of actionButtons(action)) button.disabled = atFirst;
      for (const action of ["next-page", "last-page"]) for (const button of actionButtons(action)) button.disabled = atLast;
      const previousPost = actionButton("previous-post");
      const nextPost = actionButton("next-post");
      if (previousPost) previousPost.disabled = !sequenceTarget(-1);
      if (nextPost) nextPost.disabled = !sequenceTarget(1);
    };
    const render = () => {
      const prefs = MRM.storage.preferences.reader;
      state.modal.dataset.view = prefs.view;
      state.modal.dataset.width = prefs.width;
      state.modal.dataset.fit = prefs.fit;
      state.modal.dataset.direction = prefs.direction;
      state.modal.dataset.thumbnails = prefs.thumbnails ? "on" : "off";
      state.modal.querySelector("#mrm-reader-title").textContent = state.title;
      actionButton("cycle-view").textContent = prefs.view === "strip" ? "Strip" : prefs.view === "strip-gaps" ? "Strip + gaps" : "Paged";
      actionButton("width").textContent = prefs.width === "comfort" ? "Comfort" : "Wide";
      actionButton("fit").textContent = prefs.fit === "width" ? "Fit width" : "Fit height";
      actionButton("direction").textContent = prefs.direction.toUpperCase();
      const comments = MRM.site.commentsCount(state.document);
      actionButton("comments").textContent = comments == null ? "Comments" : `Comments (${comments})`;
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
        const img = MRM.util.create("img", { attrs: { src: page.src, alt: page.alt, loading: index < 2 ? "eager" : "lazy", decoding: "async" } });
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
      if (MRM.storage.preferences.reader.view === "paged") goTo(state.pageIndex, false);
      else observePages();
    };
    const renderThumbnails = () => {
      const host = state.modal.querySelector(".mrm-reader-thumbnails");
      host.replaceChildren();
      state.pages.forEach((page, index) => {
        const button = MRM.util.create("button", { className: "mrm-reader-thumbnail", attrs: { type: "button", "aria-label": `Go to page ${index + 1}` }, dataset: { index } });
        button.append(MRM.util.create("img", { attrs: { src: page.src, alt: "", loading: "lazy" } }), MRM.util.create("span", { text: String(index + 1) }));
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
      state.modal.querySelector("#mrm-reader-page-count").textContent = `${state.pageIndex + 1} / ${state.pages.length}`;
      const scrubber = state.modal.querySelector("#mrm-reader-scrubber");
      scrubber.max = String(Math.max(1, state.pages.length));
      scrubber.value = String(state.pageIndex + 1);
      state.modal.querySelectorAll(".mrm-reader-thumbnail").forEach((button, i) => button.classList.toggle("is-active", i === state.pageIndex));
      if (state.url && state.pages.length) MRM.storage.setReaderProgress(state.url, state.title, state.pageIndex, state.pages.length);
      updateNavigation();
    };
    const goTo = (index, smooth = true) => {
      setPageIndex(index);
      const target = state.modal.querySelector(`.mrm-reader-page[data-index='${state.pageIndex}']`);
      if (!target) return;
      if (MRM.storage.preferences.reader.view === "paged") {
        state.modal.querySelectorAll(".mrm-reader-page").forEach((page, i) => page.hidden = i !== state.pageIndex);
        target.hidden = false;
        state.modal.querySelector(".mrm-reader-stage").scrollTop = 0;
      } else target.scrollIntoView({ block: "start", behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
    };
    const movePage = (delta) => goTo(state.pageIndex + delta);
    const sequenceTarget = (delta) => {
      const index = state.sequence.indexOf(state.url);
      if (index >= 0) return state.sequence[index + delta] || "";
      const adjacent = MRM.site.adjacentLinks(state.document);
      return delta < 0 ? adjacent.prev : adjacent.next;
    };
    const movePost = (delta) => {
      const target = sequenceTarget(delta);
      if (target) open(target, { sequence: state.sequence, trigger: state.modal.querySelector(`[data-reader-action='${delta < 0 ? "previous-post" : "next-post"}']`) });
      else MRM.util.announce("No adjacent post available");
    };
    const prefetchAdjacent = () => MRM.util.idle(() => {
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
    const togglePreference = (patch) => MRM.storage.update({ reader: { ...MRM.storage.preferences.reader, ...patch } });
    const cycleView = () => {
      const modes = ["strip", "strip-gaps", "paged"];
      const current = MRM.storage.preferences.reader.view;
      togglePreference({ view: modes[(modes.indexOf(current) + 1) % modes.length] });
      render();
    };
    const fullscreen = () => {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else state.modal.requestFullscreen?.();
    };
    const close = () => {
      state.abort?.abort();
      MRM.runtime.readerObserver?.disconnect();
      state.modal.hidden = true;
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
        "previous-post": () => movePost(-1),
        "next-post": () => movePost(1),
        "previous-page": () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? 1 : -1),
        "next-page": () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? -1 : 1),
        "first-page": () => goTo(0),
        "last-page": () => goTo(state.pages.length - 1),
        "cycle-view": cycleView,
        width: () => { togglePreference({ width: MRM.storage.preferences.reader.width === "comfort" ? "wide" : "comfort" }); render(); },
        fit: () => { togglePreference({ fit: MRM.storage.preferences.reader.fit === "width" ? "height" : "width" }); render(); },
        direction: () => { togglePreference({ direction: MRM.storage.preferences.reader.direction === "ltr" ? "rtl" : "ltr" }); render(); },
        thumbnails: () => { togglePreference({ thumbnails: !MRM.storage.preferences.reader.thumbnails }); render(); },
        comments: showComments,
        "open-tab": () => window.open(state.url, "_blank", "noopener"),
        fullscreen,
        toolbar: () => state.modal.classList.toggle("is-toolbar-hidden"),
      };
      map[action]?.();
    };
    const onScroll = () => {
      if (!MRM.storage.preferences.reader.autoHideToolbar || MRM.storage.preferences.reader.view === "paged") return;
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
        r: () => actionButton("direction").click(),
        t: () => actionButton("thumbnails").click(),
        home: () => goTo(0),
        end: () => goTo(state.pages.length - 1),
        arrowleft: () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? 1 : -1),
        pageup: () => movePage(-1),
        arrowright: () => movePage(MRM.storage.preferences.reader.direction === "rtl" ? -1 : 1),
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
      reader.addEventListener("click", () => open(location.href, { trigger: reader }));
      comments.addEventListener("click", () => MRM.util.q(MRM.selectors.comments)?.scrollIntoView({ behavior: "smooth", block: "start" }));
      actions.append(reader, comments);
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
    const renderFilterToggles = () => {
      const host = panel.querySelector("#mrm-filter-toggles");
      host.replaceChildren(
        makeToggle("Hide read", MRM.storage.preferences.filters.hideRead, (value) => updateFilters({ hideRead: value })),
        makeToggle("Only English", MRM.storage.preferences.filters.onlyEnglish, (value) => updateFilters({ onlyEnglish: value })),
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
      const clearRead = MRM.util.create("button", { text: "Clear read history", attrs: { type: "button" } });
      clearRead.addEventListener("click", () => { if (confirm("Clear all locally stored read history?")) MRM.storage.clearRead(); });
      host.replaceChildren(ui, dock, accent, borders, clearRead);
    };
    const termRow = (type, term) => {
      const row = MRM.util.create("div", { className: "mrm-facet-term" });
      const label = MRM.util.create("span", { text: term.name });
      const count = MRM.util.create("small", { text: term.count ? String(term.count) : "" });
      const include = MRM.util.create("button", { text: "IN", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("include", type).includes(term.slug) } });
      const exclude = MRM.util.create("button", { text: "OUT", attrs: { type: "button", "aria-pressed": MRM.facets.activeFor("exclude", type).includes(term.slug) } });
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
      modal.querySelector("[data-modal-close]").addEventListener("click", () => modal.remove());
      modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
      modal.addEventListener("keydown", (event) => { if (event.key === "Escape") modal.remove(); else MRM.util.trapFocus(event, modal); });
      render(); input.focus();
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
    });
    return { init, open, togglePanel, refreshFacets, openFacetModal, installRecoveryButton };
  })();

  // module: 08-app.js
  MRM.app = (() => {
    const removeNoise = () => {
      document.querySelectorAll("ins[data-zoneid], .eas6a97888e38, [id^='ad-'], .advertisement, .before-footer-widgets").forEach((node) => node.remove());
    };
  
    const enhanceSiteChrome = () => {
      if (MRM.util.q("#mrm-site-toolbar")) return;
      const nativeNav = MRM.util.q(".nav-primary");
      const nativeHeader = MRM.util.q(".site-header");
      if (!nativeNav && !nativeHeader) return;
      const toolbar = MRM.util.create("header", { className: "mrm-site-toolbar", attrs: { id: "mrm-site-toolbar" } });
      const inner = MRM.util.create("div", { className: "mrm-site-toolbar-inner" });
      const homeHref = MRM.util.q(".menu-item-home a[href]", nativeNav || document)?.href || location.href;
      const brand = MRM.util.create("a", { className: "mrm-site-brand", attrs: { href: homeHref, "aria-label": "MyReadingManga home" } });
      brand.innerHTML = '<span class="mrm-site-brand-mark" aria-hidden="true">MRM</span><span class="mrm-site-brand-copy"><strong>MyReadingManga</strong><small>Reimagined</small></span>';
      const nav = MRM.util.create("nav", { className: "mrm-site-nav", attrs: { "aria-label": "Main navigation" } });
      const sourceMenu = MRM.util.q("ul.menu", nativeNav || document);
      if (sourceMenu) {
        const menu = sourceMenu.cloneNode(true);
        menu.removeAttribute("id");
        menu.className = "mrm-site-menu";
        menu.querySelector(".menu-item-home")?.remove();
        menu.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
        nav.append(menu);
      }
      const sourceSearch = MRM.util.q("form.search-form", nativeHeader || document);
      const search = MRM.util.create("form", { className: "mrm-site-search", attrs: { role: "search", action: sourceSearch?.action || homeHref, method: "get" } });
      const query = MRM.util.create("input", { attrs: { type: "search", name: "s", value: sourceSearch?.querySelector("input[name='s']")?.value || "", placeholder: "Search MyReadingManga", autocomplete: "off", "aria-label": "Search MyReadingManga" } });
      const submit = MRM.util.create("button", { text: "Search", attrs: { type: "submit" } });
      search.append(query, submit);
      inner.append(brand, nav, search);
      toolbar.append(inner);
      (nativeNav || nativeHeader).before(toolbar);
    };
  
    const collapseOverflow = (container, selector, visibleCount, label) => {
      if (!container || container.dataset.mrmCollapsed === "true") return;
      const nodes = [...container.querySelectorAll(selector)].filter((node) => node.parentElement === container);
      if (nodes.length <= visibleCount) return;
      const details = MRM.util.create("details", { className: "mrm-footer-more" });
      const summary = MRM.util.create("summary", { text: `${label} (${nodes.length - visibleCount})` });
      const contents = MRM.util.create("div", { className: "mrm-footer-more-content" });
      for (const node of nodes.slice(visibleCount)) contents.append(node);
      details.append(summary, contents);
      container.append(details);
      container.dataset.mrmCollapsed = "true";
    };
  
    const enhanceFooter = () => {
      for (const cloud of MRM.util.qa(".footer-widgets .tagcloud")) collapseOverflow(cloud, ":scope > a", 18, "Show all");
      for (const comments of MRM.util.qa(".before-footer #recentcomments")) collapseOverflow(comments, ":scope > li", 8, "More comments");
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
