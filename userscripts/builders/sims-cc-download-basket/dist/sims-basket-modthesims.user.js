// ==UserScript==
// @name         Sims CC Download Basket - Mod The Sims
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/sims-basket-modthesims
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/builders/sims-cc-download-basket
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/dist/sims-basket-modthesims.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/builders/sims-cc-download-basket/dist/sims-basket-modthesims.user.js
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

(() => {
  'use strict';

function getSccbCentralDesignSystemCss() {
  return `:root,html[data-sccb-site]{--sccb-font-ui:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif !important;--sccb-font-display:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif !important;--sccb-type-body:clamp(13.5px,.22vw+12.8px,15.5px) !important;--sccb-type-small:clamp(11.5px,.14vw+11px,12.75px) !important;--sccb-type-chip:clamp(11px,.12vw+10.8px,12px) !important;--sccb-type-card-title:clamp(14.5px,.42vw+13px,17px) !important;--sccb-type-section-title:clamp(18px,.9vw+15px,25px) !important;--sccb-type-page-title:clamp(24px,1.55vw+18px,44px) !important;--sccb-line-tight:1.18 !important;--sccb-line-title:1.22 !important;--sccb-line-body:1.62 !important;--sccb-space-1:4px !important;--sccb-space-2:8px !important;--sccb-space-3:12px !important;--sccb-space-4:16px !important;--sccb-space-5:20px !important;--sccb-space-6:24px !important;--sccb-radius-sm:10px !important;--sccb-radius-md:14px !important;--sccb-radius-lg:20px !important;--sccb-radius-xl:26px !important;--sccb-surface:#111c1f !important;--sccb-surface-2:#172629 !important;--sccb-surface-3:#20363a !important;--sccb-border-soft:rgba(231,247,244,.075) !important;--sccb-border-glow:rgba(40,215,197,.18) !important;--sccb-focus-ring:0 0 0 3px rgba(85,207,255,.26) !important;--sccb-site-max:min(100%,1780px) !important;--sccb-readable-max:92ch !important;--sccb-card-min:220px !important;--sccb-card-gap:clamp(12px,1.1vw,20px) !important;}html[data-sccb-site][data-sccb-host-ui="1"],html[data-sccb-site][data-sccb-host-ui="1"] body{min-width:0 !important;width:100% !important;max-width:none !important;overflow-x:clip !important;font-family:var(--sccb-font-ui) !important;font-size:var(--sccb-type-body) !important;line-height:var(--sccb-line-body) !important;color:var(--sccb-text) !important;background-color:var(--sccb-bg) !important;color-scheme:dark !important;font-kerning:normal !important;font-variant-ligatures:common-ligatures !important;text-rendering:optimizeLegibility !important;-webkit-font-smoothing:antialiased !important;-moz-osx-font-smoothing:grayscale !important;}html[data-sccb-site][data-sccb-host-ui="1"] *,html[data-sccb-site][data-sccb-host-ui="1"] *::before,html[data-sccb-site][data-sccb-host-ui="1"] *::after{box-sizing:border-box !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( body,button,input,select,textarea,option,p,li,td,th,label,small,span,div,a ){font-family:var(--sccb-font-ui) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( h1,h2,h3,h4,h5,h6,.sccb-site-title,.sccb-mts-page-title,.sccb-simblr-hero-title,.sccb-tsr-hero-title,.sccb-card-title,.sccb-mod-title,.browse-info-title-info,.downloadtitle,.title ){font-family:var(--sccb-font-display) !important;color:var(--sccb-text) !important;letter-spacing:-0.035em !important;line-height:var(--sccb-line-title) !important;text-wrap:balance !important;overflow-wrap:anywhere !important;margin-block:0 .45em !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(h1,.sccb-site-title,.sccb-mts-page-title,.sccb-simblr-hero-title,.sccb-tsr-hero-title){font-size:var(--sccb-type-page-title) !important;line-height:1.08 !important;max-width:min(100%,18ch) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(h2,.sccb-site-section-title,.sccb-section-title,.sccb-mts-section-title){font-size:var(--sccb-type-section-title) !important;line-height:1.12 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-card-title,.sccb-mod-title,.browse-info-title-info){font-size:var(--sccb-type-card-title) !important;line-height:var(--sccb-line-title) !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;min-height:calc(var(--sccb-type-card-title) * 2.45) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(p,li,td,th,.sccb-body,.description,.downloadDescription,.item-description){font-size:var(--sccb-type-body) !important;line-height:var(--sccb-line-body) !important;color:color-mix(in srgb,var(--sccb-text),#9bb8b3 18%) !important;max-width:var(--sccb-readable-max) !important;overflow-wrap:anywhere !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(small,.small,.meta,.date,.sccb-meta,.sccb-muted,.browse-info-published-date,.downloadcreator){font-size:var(--sccb-type-small) !important;line-height:1.35 !important;letter-spacing:.012em !important;color:var(--sccb-muted) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-chip,.sccb-card-chip,.sccb-source-pill,.sccb-stat-chip,.sccb-mts-subsection-chip,.sccb-tsr-date-chip,.browse-info-category,.tag,.badge,.label ){display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:6px !important;max-width:100% !important;min-height:24px !important;padding:4px 9px !important;border:0 !important;border-radius:999px !important;background:linear-gradient(180deg,rgba(33,62,66,.96),rgba(23,42,45,.96)) !important;color:var(--sccb-cyan) !important;font-size:var(--sccb-type-chip) !important;font-weight:800 !important;line-height:1.15 !important;text-decoration:none !important;white-space:normal !important;text-align:center !important;overflow-wrap:anywhere !important;box-shadow:inset 0 0 0 1px rgba(85,207,255,.10) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-btn,.sccb-add,.sccb-card-button,.sccb-site-toolbar-btn,button,input[type="button"],input[type="submit"],a.button,.button,.btn ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle){font-family:var(--sccb-font-ui) !important;font-size:clamp(12px,.18vw+11.5px,13.5px) !important;font-weight:900 !important;line-height:1 !important;letter-spacing:-.005em !important;min-height:36px !important;padding:0 13px !important;border:0 !important;border-radius:999px !important;color:#061012 !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;text-shadow:none !important;box-shadow:0 10px 26px rgba(40,215,197,.18) !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:7px !important;white-space:nowrap !important;text-decoration:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(button,a,input,select,textarea):focus-visible{outline:none !important;box-shadow:var(--sccb-focus-ring),0 0 0 1px rgba(85,207,255,.30) inset !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-simblr-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-related-section,.sccb-panel,.sccb-file-modal,.sccb-settings-panel ){max-width:var(--sccb-site-max) !important;margin-inline:auto !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){display:grid !important;grid-template-columns:repeat(auto-fill,minmax(var(--sccb-card-min),1fr)) !important;gap:var(--sccb-card-gap) !important;align-items:stretch !important;width:100% !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"] ){min-width:0 !important;height:auto !important;display:flex !important;flex-direction:column !important;border-radius:var(--sccb-radius-lg) !important;background:linear-gradient(180deg,rgba(23,38,41,.98),rgba(13,23,25,.98)) !important;color:var(--sccb-text) !important;box-shadow:0 18px 52px rgba(0,0,0,.30),inset 0 0 0 1px var(--sccb-border-soft) !important;overflow:hidden !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-thumb,.sccb-mod-thumb,.sccb-tsr-card-image,.sccb-simblr-card-image,.browse-image,.item-image ){background-color:#0b1416 !important;border-radius:var(--sccb-radius-md) !important;overflow:hidden !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-card-thumb img,.sccb-mod-thumb img,.sccb-simblr-card-image img,.sccb-tsr-card-image img,.browse-image img,.item-image img){max-width:100% !important;height:auto !important;object-fit:contain !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"],html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body,html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(#app,#root,.app,.page,.wrapper,.site-wrapper,.main-wrapper,.content-wrapper,.tsr-page,.tsr-wrapper,.layout,.main,main){background-color:var(--sccb-bg) !important;background-image:radial-gradient(circle at 18% 0%,rgba(40,215,197,.10),transparent 30%),linear-gradient(180deg,#101719,#081012) !important;color:var(--sccb-text) !important;min-width:0 !important;max-width:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.stripe,.stripes,.noise,.pattern,.texture,.site-bg,.page-bg,.background,.background-layer,.tsr-bg,.ad,.adsbygoogle),html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body::before,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body::after{display:none !important;opacity:0 !important;visibility:hidden !important;background:none !important;background-image:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( body,#app,#root,.app,.page,.wrapper,.main-wrapper,.main-content-wrapper,.content-wrapper,.browse-page,.detail-page,main,section,article,.container,.container-fluid,.row,.row-fluid ){background-color:transparent !important;background-image:none !important;color:var(--sccb-text) !important;border-color:var(--sccb-border-soft) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"],html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body{background:radial-gradient(circle at 18% 0%,rgba(40,215,197,.12),transparent 32%),radial-gradient(circle at 88% 12%,rgba(142,232,95,.07),transparent 26%),linear-gradient(180deg,#101719 0%,#081012 100%) !important;background-color:#101719 !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( [style*="background:white"],[style*="background:white"],[style*="background-color:white"],[style*="background-color:white"],[style*="background:#fff"],[style*="background:#fff"],[style*="background-color:#fff"],[style*="background-color:#fff"],[style*="background:rgb(255"],[style*="background-color:rgb(255"] ):not(img):not(video):not(canvas):not(.sccb-card-thumb):not(.sccb-tsr-gallery-main):not(.sccb-tsr-gallery-thumb){background:rgba(17,28,31,.96) !important;background-image:none !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .mainmenu,.menu-wrapper,.menu-content,nav.topbar,nav.main-nav,.nav-2-col-between,.mobile-menu,.dl-menuwrapper ){background:transparent !important;background-image:none !important;color:var(--sccb-text) !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .mainmenu{position:sticky !important;top:8px !important;z-index:100000 !important;width:min(1180px,calc(100vw - 18px)) !important;max-width:calc(100vw - 18px) !important;margin:8px auto 10px !important;padding:0 !important;pointer-events:auto !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-wrapper{width:100% !important;max-width:100% !important;margin:0 auto !important;padding:8px !important;border-radius:24px !important;background:linear-gradient(180deg,rgba(17,28,31,.98),rgba(9,18,20,.98)) !important;border:1px solid rgba(231,247,244,.10) !important;box-shadow:0 20px 58px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.04) !important;overflow:visible !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-content{display:grid !important;grid-template-columns:auto minmax(0,1fr) !important;gap:8px 12px !important;align-items:center !important;width:100% !important;min-height:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .mainmenu:is(.logo,.logo-wrapper,.site-logo,img[alt*="Sims Resource"],img[src*="logo"]){max-width:74px !important;max-height:74px !important;object-fit:contain !important;border-radius:18px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.topbar,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.main-nav{display:flex !important;align-items:center !important;justify-content:space-between !important;flex-wrap:wrap !important;gap:8px !important;min-width:0 !important;width:100% !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.nav.underline,.nav.spaced,.nav.hover-drop,nav.main-nav ul,nav.topbar ul){display:flex !important;align-items:center !important;flex-wrap:wrap !important;gap:6px !important;margin:0 !important;padding:0 !important;list-style:none !important;background:transparent !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.nav.underline a,.nav.spaced a,.nav.hover-drop a,nav.main-nav a,nav.topbar a,.help-button,.cc-manager-button){min-height:34px !important;padding:0 11px !important;border-radius:999px !important;background:rgba(29,45,49,.92) !important;border:1px solid rgba(231,247,244,.08) !important;color:var(--sccb-text) !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;text-decoration:none !important;font-weight:900 !important;text-shadow:none !important;white-space:nowrap !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.nav.underline a,.nav.spaced a,.nav.hover-drop a,nav.main-nav a,nav.topbar a,.help-button,.cc-manager-button):hover,html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.nav.underline li:hover>a,.nav.hover-drop li:hover>a){background:linear-gradient(90deg,rgba(40,215,197,.28),rgba(142,232,95,.20)) !important;color:#fff !important;border-color:rgba(85,207,255,.28) !important;box-shadow:0 12px 28px rgba(40,215,197,.16) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .searchbar,.search-bar,.search-wrapper,.search-container,input[type="search"],input[type="text"],select ){background:rgba(6,16,18,.82) !important;background-image:none !important;color:var(--sccb-text) !important;border:1px solid rgba(85,207,255,.14) !important;border-radius:999px !important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.02) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] input::placeholder{color:rgba(231,247,244,.58) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .dl-menu,.dl-submenu,.select-dropdown,.dropdown-menu,.dropdown-content,.dropdown-wrap ul,.nav.hover-drop ul,.nav.hover-drop li>ul,.popover,.tooltip,.thumbnail-popup,.basket-modal,.basketcta-popup,.ccmanager-cta-popup,.jump_popup ){background:linear-gradient(180deg,rgba(23,38,41,.99),rgba(9,18,20,.99)) !important;background-image:none !important;color:var(--sccb-text) !important;border:1px solid rgba(85,207,255,.16) !important;border-radius:18px !important;box-shadow:0 22px 64px rgba(0,0,0,.48) !important;overflow:hidden !important;z-index:100001 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .dl-menu a,.dl-submenu a,.select-dropdown a,.dropdown-menu a,.dropdown-content a,.nav.hover-drop ul a,.thumbnail-popup a,.basket-modal a,.basketcta-popup a,.ccmanager-cta-popup a ){color:var(--sccb-text) !important;background:transparent !important;text-decoration:none !important;border-radius:10px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .dl-menu a:hover,.select-dropdown a:hover,.dropdown-menu a:hover,.nav.hover-drop ul a:hover,.thumbnail-popup a:hover ){color:#061012 !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .md-modal,.md-content,.modal,.modal-content,.modal-dialog,.free-signup-cta,.login-popup,.email-verify-popup,.winback,.centered-modal,.download-cta,.magazine-modal ){background:linear-gradient(180deg,rgba(23,38,41,.99),rgba(9,18,20,.99)) !important;background-image:none !important;color:var(--sccb-text) !important;border:1px solid rgba(231,247,244,.10) !important;border-radius:22px !important;box-shadow:0 28px 80px rgba(0,0,0,.56) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.md-modal h1,.md-modal h2,.md-modal h3,.md-content h1,.md-content h2,.modal-heading){color:var(--sccb-text) !important;text-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( footer,.footer,#footer,.site-footer,.main-footer,.footer-wrapper,.footer-container,.footer-links-styling,#social-media-icons-container,#footer-about-links-container,#footer-legal-links-container ){background:linear-gradient(180deg,#0d1719,#070d0f) !important;background-image:none !important;color:var(--sccb-text) !important;border-color:rgba(231,247,244,.08) !important;box-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] footer{margin-top:32px !important;padding:28px max(18px,env(safe-area-inset-left)) calc(28px+env(safe-area-inset-bottom)) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.footer-stat-container,.footer-stat-label,.footer-stat-number){color:var(--sccb-text) !important;background:transparent !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .footer-stat-number{color:var(--sccb-green) !important;font-weight:950 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(footer a,.footer a,.footer-links-styling a){color:var(--sccb-cyan) !important;text-decoration:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.md-overlay,.modal-backdrop){background:rgba(2,7,8,.72) !important;backdrop-filter:blur(8px) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .sccb-tsr-force-hidden,footer,#footer,.footer,.site-footer,.main-footer,.footer-wrapper,.footer-container,.top-ribbon,#anon.top-ribbon,#top-ribbon-trial,.redfast-text-only-web,.mainmenu.sccb-tsr-native-menu-hidden,.mainmenu.sccb-tsr-native-menu-hidden *,.mainmenu.sccb-tsr-force-hidden,.menu-wrapper.sccb-tsr-force-hidden,.menu-content.sccb-tsr-force-hidden,nav.topbar.sccb-tsr-force-hidden,nav.main-nav.sccb-tsr-force-hidden,.mobile-menu.sccb-tsr-force-hidden,.dl-menuwrapper.sccb-tsr-force-hidden,a.vip-leader,.vip-leader,.ad-browse-rectangle-wrapper,.ad-browse-rectangle-mid,div.ad-browse-rectangle-wrapper:nth-child(5),div.ad-browse-rectangle-wrapper:nth-child(17),.ad,.ads,.ad-slot,.ad-container,.ad-wrapper,.advert,.advertisement,.adsbygoogle,[data-google-query-id],iframe[src*="googlesyndication"],iframe[src*="doubleclick"],[id^="google_ads"],[id*="ad-slot"],[class*="adslot"],[class*="ad-slot"],[class*="ad-browse"] ){display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;width:0 !important;height:0 !important;min-width:0 !important;min-height:0 !important;max-width:0 !important;max-height:0 !important;margin:0 !important;padding:0 !important;border:0 !important;overflow:hidden !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .top-ribbon,#anon.top-ribbon,#top-ribbon-trial,.redfast-text-only-web,.mainmenu.sccb-tsr-native-menu-hidden,.mainmenu.sccb-tsr-native-menu-hidden *,.searchbar-basket,.join-vip,.vip-shop,.lookbuilder-btn,.submit-creations-wrapper,.top-support,.support-notifications-badge,.nav-divider,.tsr-logo,.logo,.logo-wrapper,.site-logo ){display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar{position:sticky !important;top:10px !important;z-index:100050 !important;width:min(1180px,calc(100vw - 20px)) !important;margin:10px auto 12px !important;padding:0 !important;background:transparent !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner{display:grid !important;grid-template-columns:auto minmax(220px,1fr) auto !important;gap:10px !important;align-items:center !important;width:100% !important;padding:10px !important;border-radius:28px !important;background:linear-gradient(180deg,rgba(15,27,30,.98),rgba(7,16,18,.98)) !important;border:1px solid rgba(85,207,255,.14) !important;box-shadow:0 22px 70px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.05) !important;overflow:visible !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat{position:relative !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-button,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned{min-height:42px !important;padding:0 18px !important;border:0 !important;border-radius:999px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-weight:950 !important;font-size:14px !important;text-decoration:none !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;white-space:nowrap !important;box-shadow:0 12px 34px rgba(40,215,197,.22) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned{background:rgba(31,54,58,.92) !important;color:var(--sccb-cyan) !important;border:1px solid rgba(85,207,255,.18) !important;box-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-button:hover,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned:hover{transform:translateY(-1px) !important;filter:brightness(1.04) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar.sccb-tsr-search-owned,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-fallback-search{width:100% !important;min-width:0 !important;display:flex !important;align-items:center !important;gap:8px !important;background:rgba(3,12,14,.78) !important;border:1px solid rgba(85,207,255,.16) !important;border-radius:999px !important;padding:4px 8px !important;min-height:42px !important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.02) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar-input-bar{flex:1 1 auto !important;min-width:0 !important;display:flex !important;align-items:center !important;gap:8px !important;background:transparent !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar-categories-button.sccb-tsr-search-category-hidden,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar-icon{display:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar input[type="search"],html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar input[type="text"],html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .search-input-field{width:100% !important;min-width:0 !important;height:32px !important;padding:0 8px !important;background:transparent !important;border:0 !important;box-shadow:none !important;color:var(--sccb-text) !important;font-size:14px !important;outline:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu{position:absolute !important;left:0 !important;top:calc(100%+10px) !important;width:min(620px,calc(100vw - 24px)) !important;padding:14px !important;border-radius:24px !important;background:linear-gradient(180deg,rgba(18,32,35,.99),rgba(7,16,18,.99)) !important;color:var(--sccb-text) !important;border:1px solid rgba(85,207,255,.18) !important;box-shadow:0 26px 80px rgba(0,0,0,.58) !important;opacity:0 !important;visibility:hidden !important;transform:translateY(-6px) !important;transition:opacity .14s ease,transform .14s ease,visibility .14s ease !important;z-index:100060 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat:hover .sccb-tsr-cat-menu,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat:focus-within .sccb-tsr-cat-menu,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar.sccb-cat-open .sccb-tsr-cat-menu{opacity:1 !important;visibility:visible !important;transform:translateY(0) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-tabs,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-grid{display:flex !important;flex-wrap:wrap !important;gap:8px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-tabs{margin-bottom:12px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu a{min-height:34px !important;padding:0 12px !important;border-radius:999px !important;background:rgba(29,45,49,.90) !important;color:var(--sccb-cyan) !important;border:1px solid rgba(85,207,255,.10) !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;text-decoration:none !important;font-weight:900 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-tabs a:nth-child(2),html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu a:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;border-color:transparent !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .nav.hover-drop>li>div,.nav.hover-drop li>div,.nav.hover-drop ul,.dropdown-menu,.dropdown-content,.search-categories-filter,#collections-menu-wrapper ){background:linear-gradient(180deg,rgba(18,32,35,.99),rgba(7,16,18,.99)) !important;background-image:none !important;color:var(--sccb-text) !important;border:1px solid rgba(85,207,255,.18) !important;border-radius:20px !important;box-shadow:0 26px 80px rgba(0,0,0,.58) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .ad-browse-rectangle-wrapper,.ad-browse-rectangle-mid,div.ad-browse-rectangle-wrapper:nth-child(5),div.ad-browse-rectangle-wrapper:nth-child(17),a.vip-leader,.vip-leader,[class*="ad-browse"] ){display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;position:absolute !important;width:0 !important;height:0 !important;min-width:0 !important;min-height:0 !important;max-width:0 !important;max-height:0 !important;margin:0 !important;padding:0 !important;overflow:hidden !important;grid-column:auto !important;grid-row:auto !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.sccb-tsr-pagination,.pager,.pagination,.browse-pagination,[class*="pagination"],[class*="pager"]){width:min(100%,var(--sccb-site-max)) !important;margin:26px auto 16px !important;padding:10px 12px !important;display:flex !important;flex-wrap:wrap !important;align-items:center !important;justify-content:center !important;gap:8px !important;background:linear-gradient(180deg,rgba(18,32,35,.96),rgba(8,17,19,.96)) !important;border:1px solid rgba(85,207,255,.12) !important;border-radius:22px !important;box-shadow:0 18px 48px rgba(0,0,0,.30) !important;color:var(--sccb-muted) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.sccb-tsr-pagination,.pager,.pagination,.browse-pagination,[class*="pagination"],[class*="pager"]):is(a,button,span,li){list-style:none !important;text-decoration:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.sccb-tsr-page-pill,.pager a,.pagination a,.pager span,.pagination span,.page-link){min-width:34px !important;min-height:34px !important;padding:0 12px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;border-radius:999px !important;background:rgba(29,53,57,.90) !important;color:var(--sccb-cyan) !important;border:1px solid rgba(85,207,255,.12) !important;font-size:12px !important;font-weight:950 !important;line-height:1 !important;box-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.sccb-tsr-page-pill:hover,.pager a:hover,.pagination a:hover,.page-link:hover){background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-cyan)) !important;color:#061012 !important;transform:translateY(-1px) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.sccb-tsr-page-current,.active>.page-link,.page-item.active .page-link,.pagination .active a,.pager .active a,[aria-current="page"]){background:linear-gradient(90deg,var(--sccb-green),var(--sccb-yellow)) !important;color:#061012 !important;border-color:transparent !important;box-shadow:0 10px 28px rgba(142,232,95,.22) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-page-status{display:inline-flex !important;align-items:center !important;min-height:30px !important;padding:0 12px !important;border-radius:999px !important;background:rgba(18,32,35,.90) !important;color:var(--sccb-muted) !important;font-size:12px !important;font-weight:850 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-card-hidden{display:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(#browse-files,.browse-files,.browse-page .items,.browse-page .content,.browse-page .grid,.sccb-tsr-card-grid){display:grid !important;grid-template-columns:repeat(auto-fill,minmax(230px,1fr)) !important;gap:22px !important;align-items:stretch !important;width:min(100%,var(--sccb-site-max)) !important;margin-inline:auto !important;overflow:visible !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card{position:relative !important;min-width:0 !important;display:flex !important;flex-direction:column !important;background:linear-gradient(180deg,rgba(24,41,45,.98),rgba(10,20,22,.98)) !important;color:var(--sccb-text) !important;border:1px solid rgba(85,207,255,.13) !important;border-radius:22px !important;overflow:hidden !important;box-shadow:0 22px 54px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.04) !important;transform:translateZ(0) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card:hover{border-color:rgba(40,215,197,.32) !important;box-shadow:0 26px 70px rgba(0,0,0,.42),0 0 0 1px rgba(40,215,197,.08) inset !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-media{position:relative !important;display:grid !important;place-items:center !important;width:100% !important;aspect-ratio:4 / 3 !important;padding:10px !important;background:radial-gradient(circle at 50% 24%,rgba(85,207,255,.10),transparent 38%),#071214 !important;border-radius:0 !important;overflow:hidden !important;text-decoration:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-media img{display:block !important;width:100% !important;height:100% !important;max-width:100% !important;max-height:100% !important;object-fit:contain !important;object-position:center center !important;border-radius:14px !important;background:rgba(255,255,255,.96) !important;box-shadow:0 10px 30px rgba(0,0,0,.20) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-placeholder{color:var(--sccb-green) !important;font-size:30px !important;font-weight:950 !important;letter-spacing:.08em !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-body{display:flex !important;flex-direction:column !important;gap:8px !important;flex:1 1 auto !important;padding:13px !important;background:linear-gradient(180deg,rgba(24,41,45,.78),rgba(10,20,22,.96)) !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-title{min-height:2.45em !important;color:var(--sccb-text) !important;font-size:15px !important;line-height:1.22 !important;font-weight:950 !important;letter-spacing:-.015em !important;text-decoration:none !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-title:hover{color:var(--sccb-cyan) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-creator{color:var(--sccb-muted) !important;font-size:12px !important;line-height:1.25 !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-chips,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-meta{display:flex !important;flex-wrap:wrap !important;gap:6px !important;align-items:center !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-chips span,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-meta span{min-height:24px !important;padding:0 8px !important;border-radius:999px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;font-size:11px !important;line-height:1 !important;font-weight:900 !important;white-space:nowrap !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-chips span{background:rgba(29,53,57,.90) !important;color:var(--sccb-cyan) !important;border:1px solid rgba(85,207,255,.12) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-meta span{background:rgba(142,232,95,.12) !important;color:var(--sccb-green) !important;border:1px solid rgba(142,232,95,.16) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-summary{margin:0 !important;color:rgba(231,247,244,.72) !important;font-size:12px !important;line-height:1.38 !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card-actions{display:grid !important;gap:7px !important;margin-top:auto !important;padding-top:4px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card-actions .sccb-card-button,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card-actions .sccb-add-basket-btn{width:100% !important;min-height:38px !important;border-radius:999px !important;font-weight:950 !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;border:0 !important;box-shadow:0 12px 28px rgba(40,215,197,.20) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card .sccb-site-card-ribbon,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card:is(.bsk,.basket-overlay,.favorite-toggle,.share-button,.basket-overlay-icon){display:none !important;}@media (max-width:760px){html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar{top:4px !important;width:calc(100vw - 10px) !important;margin:4px auto 8px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner{grid-template-columns:1fr auto !important;border-radius:20px !important;padding:8px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search{grid-column:1 / -1 !important;order:3 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu{position:fixed !important;left:8px !important;right:8px !important;top:68px !important;width:auto !important;max-height:min(70dvh,520px) !important;overflow:auto !important;}}@media (max-width:760px){html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .mainmenu{top:4px !important;width:calc(100vw - 10px) !important;max-width:calc(100vw - 10px) !important;margin-block:4px 8px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-wrapper{border-radius:18px !important;padding:7px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-content{display:flex !important;flex-direction:column !important;align-items:stretch !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.topbar,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.main-nav,html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.nav.underline,.nav.spaced,.nav.hover-drop){justify-content:flex-start !important;overflow-x:auto !important;flex-wrap:nowrap !important;scrollbar-width:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.nav.underline,.nav.spaced,.nav.hover-drop)::-webkit-scrollbar{display:none !important;}}@media (min-width:1440px){html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-card-min:235px !important;}}@media (max-width:900px){html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-site-max:100% !important;--sccb-card-min:min(100%,210px) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-simblr-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-related-section ){width:calc(100vw - 16px) !important;max-width:calc(100vw - 16px) !important;margin-inline:auto !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-mts-detail-layout,.sccb-tsr-detail-layout,.sccb-simblr-detail-layout,.column-wrapper,.row-fluid,.row){display:block !important;width:100% !important;max-width:100% !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-site-toolbar-actions,.sccb-panel-actions,.sccb-modal-actions){display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:8px !important;width:100% !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-card-button,.sccb-add,.sccb-btn,.sccb-site-toolbar-btn){min-height:44px !important;}}@media (max-width:640px){html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-type-body:14px !important;--sccb-type-card-title:16px !important;--sccb-card-min:100% !important;--sccb-card-gap:12px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){grid-template-columns:1fr !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(h1,.sccb-site-title,.sccb-mts-page-title,.sccb-simblr-hero-title,.sccb-tsr-hero-title){max-width:100% !important;font-size:clamp(24px,8vw,34px) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-card-title,.sccb-mod-title,.browse-info-title-info){min-height:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-chip,.sccb-card-chip,.sccb-stat-chip,.tag,.badge,.label){min-height:28px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-site-toolbar-actions,.sccb-panel-actions,.sccb-modal-actions){grid-template-columns:1fr !important;}}@media (hover:none),(pointer:coarse){html[data-sccb-site][data-sccb-host-ui="1"]:is(a,button,input,select,textarea,.sccb-chip,.sccb-card-chip){-webkit-tap-highlight-color:rgba(40,215,197,.16) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-site-card:hover,[data-sccb-card="1"]:hover){transform:none !important;}}@media (max-width:760px),(pointer:coarse){html[data-sccb-site][data-sccb-host-ui="1"],html[data-sccb-site][data-sccb-host-ui="1"] body{max-width:100vw !important;overflow-x:hidden !important;touch-action:manipulation !important;scroll-padding-top:calc(72px+env(safe-area-inset-top)) !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-mobile-unclamp{width:auto !important;min-width:0 !important;max-width:100% !important;left:auto !important;right:auto !important;transform:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-mobile-media{max-width:100% !important;height:auto !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-mobile-scrollbox{display:block !important;width:100% !important;max-width:100% !important;overflow-x:auto !important;-webkit-overflow-scrolling:touch !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-page-main,.sccb-mts-detail-page,.sccb-simblr-app,#sccb-simblr-app,.sccb-simblr-app-index,.sccb-simblr-app-detail,.sccb-tsr-hero,.sccb-tsr-detail-layout,.sccb-tsr-related-section,main,.main,.container,.container-fluid ):not(.sccb-panel):not(.sccb-file-modal){width:calc(100vw - 12px) !important;max-width:calc(100vw - 12px) !important;margin-inline:auto !important;padding-inline:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-page-hero,.sccb-mts-detail-hero,.sccb-mts-section,.sccb-simblr-hero,.sccb-simblr-app-hero,.sccb-simblr-app-section,.sccb-simblr-detail-hero,.sccb-tsr-hero,.sccb-tsr-detail-card,.sccb-tsr-detail-panel,.sccb-tsr-related-section,.sccb-site-section ){border-radius:18px !important;padding:12px !important;margin-block:10px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-detail-layout,.sccb-simblr-detail-layout,.sccb-simblr-detail-redone-layout,.sccb-tsr-detail-layout,.sccb-tsr-related-layout ){display:grid !important;grid-template-columns:1fr !important;gap:12px !important;width:calc(100vw - 12px) !important;max-width:calc(100vw - 12px) !important;margin-inline:auto !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-detail-sidebar,.sccb-simblr-detail-redone-side,.sccb-tsr-detail-side ){position:static !important;width:100% !important;max-width:100% !important;order:2 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-detail-main,.sccb-simblr-detail-redone-description,.sccb-tsr-detail-main ){width:100% !important;max-width:100% !important;order:1 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-custom-gallery-main,.sccb-mts-gallery-carousel,.sccb-simblr-gallery-main,.sccb-simblr-redone-gallery-main,.sccb-tsr-gallery-main ){width:100% !important;max-width:100% !important;min-height:0 !important;max-height:min(62vh,calc(var(--sccb-vh,1vh) * 62)) !important;aspect-ratio:4 / 3 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-custom-gallery-main img,.sccb-mts-gallery-carousel img,.sccb-simblr-gallery-main img,.sccb-simblr-redone-gallery-main img,.sccb-tsr-gallery-main img ){width:100% !important;height:100% !important;object-fit:contain !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){grid-template-columns:repeat(auto-fill,minmax(min(100%,170px),1fr)) !important;gap:12px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-rendered-tsr-card,.sccb-site-card,[data-sccb-card="1"] ){border-radius:18px !important;min-width:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-rendered-tsr-card ):is(.sccb-card-button,.sccb-add-basket-btn){min-height:44px !important;font-size:13.5px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-page-breadcrumbs,.sccb-mts-detail-breadcrumb-rail,.sccb-tsr-crumbs,.sccb-simblr-info-chips,.sccb-simblr-filter-chips,.sccb-simblr-card-chips,.sccb-rendered-tsr-chips,.sccb-rendered-tsr-meta ){display:flex !important;overflow-x:auto !important;flex-wrap:nowrap !important;gap:7px !important;padding-bottom:4px !important;scrollbar-width:none !important;-webkit-overflow-scrolling:touch !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-page-breadcrumbs,.sccb-mts-detail-breadcrumb-rail,.sccb-tsr-crumbs,.sccb-simblr-info-chips,.sccb-simblr-filter-chips,.sccb-simblr-card-chips,.sccb-rendered-tsr-chips,.sccb-rendered-tsr-meta )::-webkit-scrollbar{display:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-chip,.sccb-card-chip,.sccb-stat-chip,.sccb-btn,button,a.button,.btn){min-height:40px !important;}html[data-sccb-site][data-sccb-host-ui="1"] input,html[data-sccb-site][data-sccb-host-ui="1"] select,html[data-sccb-site][data-sccb-host-ui="1"] textarea{min-height:44px !important;font-size:16px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-groups{display:grid !important;grid-template-columns:1fr !important;gap:10px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-group{padding:10px !important;border-radius:16px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar{position:sticky !important;top:max(4px,env(safe-area-inset-top)) !important;width:calc(100vw - 10px) !important;max-width:calc(100vw - 10px) !important;margin:4px auto 8px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner{grid-template-columns:auto 1fr auto !important;gap:7px !important;padding:7px !important;border-radius:20px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-button,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned{min-height:40px !important;padding-inline:12px !important;font-size:12.5px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search{min-width:0 !important;min-height:40px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-media{aspect-ratio:4 / 3 !important;padding:8px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(.sccb-tsr-page-status,.sccb-tsr-page-pill,.sccb-tsr-page-current,.sccb-tsr-page-next){min-height:38px !important;}}@media (max-width:520px){html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){grid-template-columns:1fr !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-page-title,.sccb-mts-page-title,.sccb-simblr-hero-title,.sccb-tsr-hero-title,h1){font-size:clamp(23px,8vw,32px) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner{grid-template-columns:1fr auto !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search{grid-column:1 / -1 !important;order:3 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu{position:fixed !important;left:8px !important;right:8px !important;top:calc(58px+env(safe-area-inset-top)) !important;width:auto !important;max-height:min(70dvh,520px) !important;overflow:auto !important;}#sccb-mini-strip{left:6px !important;right:6px !important;border-radius:16px !important;}.sccb-mini-open,.sccb-mini-download{min-height:44px !important;padding-inline:10px !important;font-size:12.5px !important;}}html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-type-body:clamp(14px,.18vw+13.2px,15.75px) !important;--sccb-type-small:clamp(12px,.10vw+11.7px,12.9px) !important;--sccb-type-chip:clamp(11.5px,.10vw+11.2px,12.4px) !important;--sccb-type-card-title:clamp(15px,.30vw+14px,17.25px) !important;--sccb-type-section-title:clamp(19px,.72vw+16px,25px) !important;--sccb-type-page-title:clamp(26px,1.22vw+20px,42px) !important;--sccb-line-tight:1.2 !important;--sccb-line-title:1.18 !important;--sccb-line-body:1.58 !important;--sccb-border-soft:transparent !important;--sccb-border-glow:transparent !important;--sccb-focus-ring:0 0 0 3px rgba(85,207,255,.26) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( body,button,input,select,textarea,h1,h2,h3,h4,h5,h6,p,li,td,th,label,small,span,div,a ){font-family:var(--sccb-font-ui) !important;font-synthesis-weight:none !important;text-rendering:geometricPrecision !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( h1,h2,h3,h4,h5,h6,.sccb-site-title,.sccb-mts-page-title,.sccb-simblr-hero-title,.sccb-tsr-hero-title,.sccb-card-title,.sccb-mod-title,.browse-info-title-info,.downloadtitle,.title ){letter-spacing:-0.022em !important;font-weight:900 !important;text-align:left !important;text-wrap:balance !important;max-width:min(100%,38ch) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( p,li,td,th,.sccb-body,.description,.downloadDescription,.item-description,.sccb-detail-text,.sccb-tsr-description-panel ){letter-spacing:.002em !important;text-align:left !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-chip,.sccb-card-chip,.sccb-source-pill,.sccb-stat-chip,.sccb-mts-subsection-chip,.sccb-tsr-date-chip,.browse-info-category,.tag,.badge,.label ){border:0 !important;box-shadow:none !important;background:rgba(29,55,59,.92) !important;color:var(--sccb-cyan) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-btn,.sccb-add,.sccb-card-button,.sccb-site-toolbar-btn,button,input[type="button"],input[type="submit"],a.button,.button,.btn ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle){border:0 !important;box-shadow:none !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;text-align:center !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-simblr-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-related-section,.sccb-panel,.sccb-file-modal,.sccb-settings-panel,.sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"],.sccb-tsr-detail-shell,.sccb-tsr-detail-left,.sccb-tsr-detail-right,.sccb-tsr-gallery-card,.sccb-tsr-description-panel,.sccb-tsr-detail-card,.sccb-mts-detail-shell,.sccb-simblr-detail-shell,#sccb-basket-panel,#sccb-mini-strip,#sccb-toast,#sccb-modal-backdrop .sccb-file-modal ){border:0 !important;outline:0 !important;box-shadow:none !important;background-image:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"] ){background:var(--sccb-surface-2) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-simblr-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-related-section,.sccb-panel,.sccb-tsr-detail-shell,.sccb-tsr-detail-left,.sccb-tsr-detail-right,.sccb-tsr-gallery-card,.sccb-tsr-description-panel,.sccb-tsr-detail-card ){background:rgba(17,28,31,.96) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( input,textarea,select,.searchbar,.search-bar,.search-wrapper,.search-container,.sccb-input,.sccb-search ){border:0 !important;box-shadow:none !important;background:rgba(6,16,18,.88) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( table,tr,td,th,fieldset,hr,.separator,.divider,.message,.message-body,.downloadDetails,.column-wrapper,.tabs-bg-white,.panel,.card,.box,.well,.container,.container-fluid ){border:0 !important;box-shadow:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(button,a,input,select,textarea):focus-visible{outline:2px solid rgba(85,207,255,.70) !important;outline-offset:3px !important;box-shadow:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(button,a,.sccb-btn,.sccb-add,.sccb-card-button):hover{filter:brightness(1.05) !important;}@media (max-width:720px){html[data-sccb-site][data-sccb-host-ui="1"]:is( h1,h2,h3,.sccb-site-title,.sccb-mts-page-title,.sccb-simblr-hero-title,.sccb-tsr-hero-title ){letter-spacing:-0.018em !important;max-width:100% !important;}}html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-bg:#0b1214 !important;--sccb-page:#0b1214 !important;--sccb-panel:#111c1f !important;--sccb-surface:#111c1f !important;--sccb-surface-2:#152426 !important;--sccb-surface-3:#1b3033 !important;--sccb-text:#e8f2ef !important;--sccb-muted:#91aaa6 !important;--sccb-dim:#6f8984 !important;--sccb-teal:#35bda8 !important;--sccb-green:#8bdc6e !important;--sccb-cyan:#57bfe4 !important;--sccb-yellow:#c8d86c !important;--sccb-accent-soft:rgba(53,189,168,.15) !important;--sccb-accent-soft-2:rgba(139,220,110,.11) !important;--sccb-accent-ink:#bdf5ea !important;--sccb-action-bg:#20383b !important;--sccb-action-bg-hover:#29464a !important;--sccb-action-bg-active:#31534f !important;--sccb-card-min:225px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-simblr-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-related-section,.sccb-panel,.sccb-file-modal,.sccb-settings-panel,.sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"],.sccb-tsr-detail-shell,.sccb-tsr-detail-left,.sccb-tsr-detail-right,.sccb-tsr-gallery-card,.sccb-tsr-description-panel,.sccb-tsr-detail-card,.sccb-mts-detail-shell,.sccb-simblr-detail-shell,#sccb-basket-panel,#sccb-mini-strip,#sccb-toast,.sccb-file-modal,.sccb-card-body,.sccb-card-meta,.sccb-card-chips,.sccb-card-stats,.sccb-tsr-card-body,.sccb-simblr-card-body,.sccb-mts-card-body ){min-width:0 !important;max-width:100% !important;overflow-wrap:anywhere !important;word-break:normal !important;hyphens:auto !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-title,.sccb-mod-title,.browse-info-title-info,.sccb-tsr-card-title,.sccb-simblr-card-title,.sccb-mts-card-title,.sccb-related-title,.sccb-item-title,.sccb-file-title ){max-width:100% !important;min-width:0 !important;overflow:hidden !important;overflow-wrap:anywhere !important;word-break:normal !important;hyphens:auto !important;text-overflow:clip !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-meta,.sccb-muted,.sccb-card-author,.sccb-card-date,.sccb-tsr-card-description,.sccb-simblr-card-summary,.sccb-card-summary,.sccb-body,.description,.downloadDescription,.item-description,.sccb-detail-text,.sccb-tsr-description-panel,.sccb-tsr-description-panel *,.sccb-simblr-description *,.sccb-mts-description * ){max-width:100% !important;overflow-wrap:anywhere !important;word-break:normal !important;hyphens:auto !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(pre,code,kbd,samp,.bbcode_code,.code,textarea){max-width:100% !important;overflow-x:auto !important;white-space:pre-wrap !important;overflow-wrap:anywhere !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(table,thead,tbody,tr,td,th){max-width:100% !important;min-width:0 !important;overflow-wrap:anywhere !important;word-break:normal !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-chip,.sccb-card-chip,.sccb-source-pill,.sccb-stat-chip,.sccb-mts-subsection-chip,.sccb-tsr-date-chip,.browse-info-category,.tag,.badge,.label ){max-width:100% !important;min-width:0 !important;white-space:normal !important;text-wrap:pretty !important;overflow-wrap:anywhere !important;background:#1c3336 !important;color:var(--sccb-cyan) !important;box-shadow:none !important;border:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-btn,.sccb-add,.sccb-card-button,.sccb-site-toolbar-btn,button,input[type="button"],input[type="submit"],a.button,.button,.btn ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle){max-width:100% !important;min-width:0 !important;white-space:normal !important;text-wrap:balance !important;overflow-wrap:anywhere !important;line-height:1.15 !important;min-height:36px !important;padding-block:8px !important;color:var(--sccb-accent-ink) !important;background:linear-gradient(90deg,var(--sccb-accent-soft),var(--sccb-accent-soft-2)),var(--sccb-action-bg) !important;box-shadow:none !important;border:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-btn,.sccb-add,.sccb-card-button,.sccb-site-toolbar-btn,button,input[type="button"],input[type="submit"],a.button,.button,.btn ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle):hover{color:var(--sccb-text) !important;background:linear-gradient(90deg,rgba(53,189,168,.23),rgba(139,220,110,.16)),var(--sccb-action-bg-hover) !important;filter:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-btn.primary,.sccb-add,.sccb-card-button,.sccb-mini-download,#sccb-fab,.sccb-basket-primary,.sccb-file-modal .primary ){color:#071112 !important;background:linear-gradient(90deg,rgba(53,189,168,.92),rgba(139,220,110,.86)) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-btn.secondary,.sccb-btn.ghost,.sccb-site-toolbar-btn,.sccb-modal-close,.sccb-mini-remove ){color:var(--sccb-cyan) !important;background:#1d3337 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-simblr-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-related-section,.sccb-panel,.sccb-file-modal,.sccb-settings-panel,.sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"],.sccb-tsr-detail-shell,.sccb-tsr-detail-left,.sccb-tsr-detail-right,.sccb-tsr-gallery-card,.sccb-tsr-description-panel,.sccb-tsr-detail-card,.sccb-mts-detail-shell,.sccb-simblr-detail-shell,#sccb-basket-panel,#sccb-mini-strip,#sccb-toast,.sccb-file-modal ){background-image:none !important;box-shadow:none !important;border:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"] ){background:#142325 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-simblr-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-related-section,.sccb-panel,.sccb-tsr-detail-shell,.sccb-tsr-detail-left,.sccb-tsr-detail-right,.sccb-tsr-gallery-card,.sccb-tsr-description-panel,.sccb-tsr-detail-card ){background:#111c1f !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-page-tagline,.sccb-hero-kicker,.sccb-section-kicker,.sccb-card-chips,.sccb-card-stats,.sccb-filter-groups,.sccb-breadcrumbs,.sccb-rail,.sccb-chip-row ){min-width:0 !important;max-width:100% !important;overflow-x:auto !important;overflow-y:hidden !important;scrollbar-width:thin !important;-webkit-overflow-scrolling:touch !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-chips,.sccb-card-stats,.sccb-filter-groups,.sccb-breadcrumbs,.sccb-chip-row )>*{min-width:0 !important;max-width:100% !important;}@media (max-width:720px){html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-card-min:min(100%,172px) !important;--sccb-type-card-title:clamp(13.25px,2.5vw,15px) !important;--sccb-type-body:clamp(12.75px,2.7vw,14px) !important;--sccb-type-small:clamp(10.75px,2.4vw,12px) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-title,.sccb-mod-title,.browse-info-title-info,.sccb-tsr-card-title,.sccb-simblr-card-title,.sccb-mts-card-title ){-webkit-line-clamp:3 !important;min-height:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-btn,.sccb-add,.sccb-card-button,.sccb-site-toolbar-btn,button,input[type="button"],input[type="submit"],a.button,.button,.btn ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle){min-height:42px !important;padding-inline:12px !important;}}html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-page-pad:clamp(10px,1.6vw,24px) !important;--sccb-block-gap:clamp(10px,1.1vw,18px) !important;--sccb-section-gap:clamp(14px,1.5vw,24px) !important;--sccb-panel-pad:clamp(12px,1.3vw,20px) !important;--sccb-card-pad:clamp(10px,1vw,14px) !important;--sccb-title-measure:24ch !important;--sccb-body-measure:78ch !important;--sccb-compact-shadow:none !important;--sccb-hairline:transparent !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( h1,h2,h3,h4,h5,h6,.sccb-site-title,.sccb-mts-page-title,.sccb-simblr-hero-title,.sccb-tsr-hero-title,.sccb-section-title,.sccb-site-section-title,.sccb-mts-section-title,.sccb-related-heading ){max-width:min(100%,var(--sccb-title-measure)) !important;text-wrap:balance !important;overflow-wrap:break-word !important;word-break:normal !important;hyphens:auto !important;margin-top:0 !important;margin-bottom:.38em !important;font-weight:860 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( p,li,dd,dt,blockquote,.sccb-body,.sccb-copy,.sccb-description,.sccb-detail-text,.description,.downloadDescription,.item-description ){max-width:min(100%,var(--sccb-body-measure)) !important;margin-top:0 !important;margin-bottom:.75em !important;line-height:1.58 !important;text-wrap:pretty !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( p:last-child,li:last-child,blockquote:last-child,.sccb-body>:last-child,.sccb-copy>:last-child,.sccb-description>:last-child,.sccb-detail-text>:last-child ){margin-bottom:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-mts-detail-hero,.sccb-simblr-hero,.sccb-simblr-app-hero,.sccb-simblr-detail-redone-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-simblr-app-section,.sccb-related-section,.sccb-tsr-related-section,.sccb-tsr-detail-shell,.sccb-mts-detail-shell,.sccb-simblr-detail-shell,.sccb-panel,.sccb-settings-panel,.sccb-file-modal ){padding:var(--sccb-panel-pad) !important;margin-block:var(--sccb-section-gap) !important;border:0 !important;box-shadow:none !important;background-image:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-section+.sccb-mts-section,.sccb-site-section+.sccb-site-section,.sccb-simblr-app-section+.sccb-simblr-app-section,.sccb-related-section+.sccb-related-section,.sccb-tsr-related-section+.sccb-tsr-related-section ){margin-top:var(--sccb-block-gap) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-section-head,.sccb-mts-section-head,.sccb-simblr-app-section-head,.sccb-related-head,.sccb-tsr-related-head,.sccb-card-body,.sccb-rendered-tsr-body,.sccb-simblr-card-body,.sccb-mts-card-body,.sccb-card-content ){gap:clamp(6px,.75vw,10px) !important;padding:var(--sccb-card-pad) !important;min-width:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){gap:var(--sccb-card-gap) !important;align-content:start !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-rendered-tsr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"],.sccb-panel,.sccb-file-modal,.sccb-settings-panel,.sccb-tsr-detail-card,.sccb-tsr-detail-left,.sccb-tsr-detail-right,.sccb-tsr-gallery-card,.sccb-tsr-description-panel,.sccb-simblr-info-panel,.sccb-mts-detail-card,.message,.message-body,.well,.card,.box,.panel,.container,.container-fluid ){border:0 !important;outline:0 !important;box-shadow:none !important;background-image:none !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-rendered-tsr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"] ){background:var(--sccb-surface-2) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-chips,.sccb-card-stats,.sccb-rendered-tsr-chips,.sccb-rendered-tsr-meta,.sccb-simblr-filter-groups,.sccb-filter-groups,.sccb-breadcrumbs,.sccb-chip-row,.sccb-section-actions,.sccb-site-toolbar-actions ){display:flex !important;align-items:center !important;flex-wrap:wrap !important;gap:6px !important;min-width:0 !important;max-width:100% !important;overflow:visible !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-chip,.sccb-card-chip,.sccb-stat-chip,.sccb-source-pill,.sccb-tsr-date-chip,.sccb-mts-subsection-chip,.tag,.badge,.label,.browse-info-category ){flex:0 1 auto !important;max-width:100% !important;min-width:0 !important;white-space:normal !important;text-align:center !important;overflow-wrap:anywhere !important;background:color-mix(in srgb,var(--sccb-surface-3),var(--sccb-cyan) 8%) !important;color:color-mix(in srgb,var(--sccb-cyan),var(--sccb-text) 18%) !important;box-shadow:none !important;border:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-title,.sccb-mod-title,.browse-info-title-info,.sccb-tsr-card-title,.sccb-simblr-card-title,.sccb-mts-card-title,.sccb-rendered-tsr-title,.sccb-related-title ){min-height:0 !important;max-height:calc(var(--sccb-type-card-title) * 2.8) !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-empty,.sccb-native-hidden,.sccb-force-hidden,.sccb-tsr-force-hidden,.sccb-tsr-native-card-hidden,.sccb-mts-native-card-hidden,.sccb-simblr-native-hidden,.ad,.ads,.ad-slot,.ad-container,.ad-wrapper,.advert,.advertisement,.adsbygoogle,[class*="advert"],[id*="advert"],[class*="ad-browse"],[id*="google_ads"],[data-google-query-id],iframe[src*="googlesyndication"],iframe[src*="doubleclick"] ){display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;position:absolute !important;inset:auto !important;width:0 !important;height:0 !important;min-width:0 !important;min-height:0 !important;max-width:0 !important;max-height:0 !important;margin:0 !important;padding:0 !important;overflow:hidden !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-section,.sccb-mts-section,.sccb-simblr-app-section,.sccb-related-section,.sccb-tsr-related-section,.sccb-panel,.message,.message-body,.well,.box,.card,.panel ):empty{display:none !important;margin:0 !important;padding:0 !important;min-height:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-section,.sccb-mts-section,.sccb-simblr-app-section,.sccb-related-section,.sccb-tsr-related-section ):has(:is(.sccb-card-grid,.sccb-mts-card-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid):empty){display:none !important;margin:0 !important;padding:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .spacer,.clear,.clearfix,.clearer,.ad-spacer,.leaderboard,.rectangle-ad,.banner-ad,.top-banner,.bottom-banner,.sccb-legacy-spacer ){min-height:0 !important;margin-block:0 !important;padding-block:0 !important;}html[data-sccb-site][data-sccb-host-ui="1"] br+br+br,html[data-sccb-site][data-sccb-host-ui="1"] p:empty,html[data-sccb-site][data-sccb-host-ui="1"] div:empty:not(.sccb-sheet-handle):not(.sccb-plumbob):not(.sccb-gallery-thumb):not(.sccb-rendered-tsr-placeholder){display:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"]:is( .maincontentwrapper,.maincontentinner,.column-wrapper,.row,.row-fluid,.container,.container-fluid,.message,.message-body ),html[data-sccb-site="simblr"][data-sccb-host-ui="1"]:is( #sccb-simblr-app,.sccb-simblr-app-index,.sccb-simblr-app-detail,.container,.container-fluid,.row,.section ),html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( #content,#main,main,.browse-page,.detail-page,.content-wrapper,.main-content-wrapper,.container,.container-fluid,.row ){min-height:0 !important;margin-top:0 !important;margin-bottom:var(--sccb-block-gap) !important;padding-top:0 !important;padding-bottom:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is( .details-wrapper,.browse-container,.browse-content,.content-area,.item-list,.items,#browse-files,.sccb-tsr-detail-layout ){align-content:start !important;row-gap:var(--sccb-card-gap) !important;margin-top:var(--sccb-block-gap) !important;margin-bottom:var(--sccb-block-gap) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"]:is( .sccb-simblr-filter-groups,.sccb-filter-groups ){display:grid !important;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr)) !important;align-items:start !important;gap:10px !important;overflow:visible !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"]:is( .sccb-simblr-filter-group,.sccb-filter-group ){min-width:0 !important;background:var(--sccb-surface-2) !important;border:0 !important;box-shadow:none !important;padding:10px !important;}@media (max-width:760px){html[data-sccb-site][data-sccb-host-ui="1"]{--sccb-page-pad:8px !important;--sccb-panel-pad:10px !important;--sccb-section-gap:10px !important;--sccb-block-gap:8px !important;--sccb-card-gap:10px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-site-toolbar,#sccb-site-toolbar,.sccb-mts-page-hero,.sccb-mts-detail-hero,.sccb-simblr-hero,.sccb-simblr-app-hero,.sccb-simblr-detail-redone-hero,.sccb-tsr-hero,.sccb-mts-section,.sccb-site-section,.sccb-simblr-app-section,.sccb-related-section,.sccb-tsr-related-section,.sccb-tsr-detail-shell,.sccb-mts-detail-shell,.sccb-simblr-detail-shell,.sccb-panel,.sccb-settings-panel ){margin-block:8px !important;padding:10px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-title,.sccb-mod-title,.browse-info-title-info,.sccb-tsr-card-title,.sccb-simblr-card-title,.sccb-mts-card-title,.sccb-rendered-tsr-title,.sccb-related-title ){-webkit-line-clamp:3 !important;max-height:none !important;}}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-mts-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){display:grid !important;grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--sccb-card-min)),1fr)) !important;gap:var(--sccb-card-gap) !important;align-items:stretch !important;grid-auto-flow:row dense !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-card-thumb,.sccb-mod-thumb,.sccb-tsr-card-image,.sccb-simblr-card-image,.sccb-mts-card-thumb,.browse-image,.item-image ){aspect-ratio:var(--sccb-card-image-ratio,4 / 3) !important;}html[data-sccb-site][data-sccb-grid="compact"][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-rendered-tsr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"] ){--sccb-type-card-title:clamp(13px,.22vw+12px,15px) !important;}html[data-sccb-site][data-sccb-grid="gallery"][data-sccb-host-ui="1"]:is( .sccb-card-title,.sccb-mod-title,.browse-info-title-info,.sccb-tsr-card-title,.sccb-simblr-card-title,.sccb-mts-card-title ){-webkit-line-clamp:3 !important;min-height:calc(var(--sccb-type-card-title) * 3.45) !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-rendered-mts-card,.sccb-rendered-simblr-card,.sccb-rendered-tsr-card,.sccb-tsr-card,.sccb-site-card,[data-sccb-card="1"],.sccb-panel,.sccb-file-modal,.sccb-settings-panel ){contain:layout paint !important;content-visibility:auto !important;contain-intrinsic-size:360px 520px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-mts-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){contain:layout paint !important;content-visibility:auto !important;contain-intrinsic-size:900px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-card-media,.sccb-card-body,.sccb-card-title,.sccb-card-meta,.sccb-card-chips,.sccb-card-stats,.sccb-card-summary){min-width:0 !important;max-width:100% !important;overflow-wrap:anywhere !important;}@media (max-width:760px){html[data-sccb-site][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-mts-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){grid-template-columns:repeat(auto-fill,minmax(min(100%,var(--sccb-card-min-mobile)),1fr)) !important;}html[data-sccb-site][data-sccb-grid="roomy"][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-mts-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ),html[data-sccb-site][data-sccb-grid="gallery"][data-sccb-host-ui="1"]:is( .sccb-mts-card-grid,.sccb-mts-grid,.sccb-simblr-card-grid,.sccb-tsr-card-grid,.sccb-related-grid,.sccb-tsr-related-grid,#browse-files,.recommendation-items,.download-grid,.item-grid ){grid-template-columns:1fr !important;}}`;
}

function runSimsCcDownloadBasket(adapterFactories) {
  'use strict';
const APP = 'sims-cc-basket';
  const VERSION = 5;
  const STORAGE_KEY = 'sims-cc-download-basket.v2';
  const CACHE_KEY = 'sims-cc-download-basket.cache.v1';
  const SETTINGS_KEY = 'sims-cc-download-basket.settings.v1';
  const OLD_MTS_LOCALSTORAGE_KEY = 'mts-download-basket-v1';
  const WIRED_ATTR = 'data-sccb-wired';
  const CARD_ATTR = 'data-sccb-card';
  const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
  const DEFAULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  const DOWNLOAD_DELAY_MS = 500;
  const HIGH_DUPLICATE_SCORE = 90;
  const LIKELY_DUPLICATE_SCORE = 70;
  const POSSIBLE_DUPLICATE_SCORE = 40;
  const MAX_AUTO_VISIBLE = 60;

  const modInfoInflight = new Map();
  const networkMetaInflight = new Map();
  const hashInflight = new Map();

  let adapter;

  const state = {
    wireTimer: 0,
    cleanupQueued: false,
    cleanupReason: '',
    activePanel: null,
    activeModal: null,
    visibleQueue: [],
    busy: false,
    pageType: 'unknown',
    lastWireAt: 0,
    saveTimer: 0,
    pendingBasket: null,
    cleanupTimers: new Map(),
    layoutRecoveryShown: false,
    downloadQueue: null,
    lastFailedFileKeys: [],
    basketRefineOpen: false,
    basketSearchTimer: 0,
  };

  function currentSiteEnabled(settings = getSettings()) {
    const key = adapter?.id === 'mts' ? 'themeMts' : adapter?.id === 'simblr' ? 'themeSimblr' : adapter?.id === 'tsr' ? 'themeTsr' : 'siteUi';
    return settings.siteUi !== false && settings[key] !== false && settings.safeMode !== 'basket' && settings.safeMode !== 'disabled';
  }

  function canRewriteNative(settings = getSettings()) {
    return currentSiteEnabled(settings) && settings.safeMode === 'full' && settings.rewriteNativeCards !== false;
  }

  function canThemeLight(settings = getSettings()) {
    return currentSiteEnabled(settings) && (settings.safeMode === 'full' || settings.safeMode === 'light');
  }

  function canUseBasket(settings = getSettings()) {
    return settings.basketUi !== false && settings.safeMode !== 'disabled';
  }

  function applyRuntimeModeDatasets(settings = getSettings()) {
    document.documentElement.dataset.sccbMode = settings.safeMode || 'full';
    document.documentElement.dataset.sccbDebug = settings.debugUi ? '1' : '0';
    document.documentElement.dataset.sccbBasketUi = canUseBasket(settings) ? '1' : '0';
    document.documentElement.dataset.sccbHostUi = canThemeLight(settings) ? '1' : '0';
    document.documentElement.dataset.sccbRewrite = canRewriteNative(settings) ? '1' : '0';
  }

  function scheduleCleanup(reason = 'mutation', delay = 70) {
    const key = String(reason || 'mutation');
    if (state.cleanupTimers.has(key)) clearTimeout(state.cleanupTimers.get(key));
    const run = () => {
      state.cleanupTimers.delete(key);
      debounceWire(key);
    };
    state.cleanupTimers.set(key, setTimeout(run, Math.max(16, Number(delay) || 70)));
  }

  function debounceWire(reason = 'mutation') {
    state.cleanupReason = reason || state.cleanupReason || 'mutation';
    if (state.cleanupQueued) return;
    state.cleanupQueued = true;
    const run = () => {
      clearTimeout(state.wireTimer);
      state.wireTimer = setTimeout(() => {
        state.cleanupQueued = false;
        wirePage();
      }, 70);
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else run();
  }

  function wirePage() {
    state.lastWireAt = Date.now();
    state.pageType = detectPageType();
    const settings = getSettings();
    document.documentElement.dataset.sccbPageType = state.pageType;
    applyRuntimeModeDatasets(settings);
    applyGridSettings(settings);
    if (settings.safeMode === 'disabled') {
      document.querySelector('#sccb-site-toolbar')?.remove();
      document.querySelector('#sccb-fab')?.remove();
      document.querySelector('#sccb-mini-strip')?.remove();
      runMobileModeAuditFixes();
      return;
    }
    runSiteRewriteForPage(state.pageType);
    enhanceSitePageUi(state.pageType);
    if (canUseBasket(settings)) {
      wireListingCards(state.pageType);
      wireDetailPage(state.pageType);
      ensureSiteToolbar();
      updateFabCount();
    } else {
      document.querySelector('#sccb-site-toolbar')?.remove();
      document.querySelector('#sccb-fab')?.remove();
      document.querySelector('#sccb-mini-strip')?.remove();
    }
    removeAddVisibleControls();
    runMobileModeAuditFixes();
    runBrokenLayoutRecovery(state.pageType);
  }

  function getAdapter(rawUrl) {
    let url;
    try { url = new URL(rawUrl, location.href); } catch { return null; }
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    return siteAdapters.find(site => (site.hosts || [])
      .map(item => String(item).replace(/^www\./, '').toLowerCase())
      .includes(host)) || null;
  }

  function detectPageType() {
    try {
      if (adapter?.detectPageType) {
        const detected = adapter.detectPageType(document, location.href);
        if (detected) return detected;
      }
      if (adapter?.isDetailUrl?.(location.href)) return 'detail';
      const path = location.pathname.replace(/\/+$/, '') || '/';
      if (path === '/' || /\/(home|index)(?:\.|$)/i.test(path)) return 'home';
      const cards = adapter?.listingCards ? adapter.listingCards(document).slice(0, 2) : [];
      if (cards.length) return 'listing';
      if (/\/(downloads|browse|category|mods|search|tag|ts\d+)/i.test(path)) return 'listing';
      return 'generic';
    } catch (_) {
      return adapter?.isDetailUrl?.(location.href) ? 'detail' : 'generic';
    }
  }

  function isListingLikePage(pageType = state.pageType) {
    return pageType === 'listing' || pageType === 'home' || pageType === 'hub' || pageType === 'generic';
  }

  function runSiteRewriteForPage(pageType = state.pageType) {
    const settings = getSettings();
    if (!canThemeLight(settings)) return;
    if (adapter.id === 'mts') {
      rewriteMtsPageNavigation();
      if (!canRewriteNative(settings)) return;
      if (pageType === 'detail') rewriteMtsDetailPage();
      else rewriteMtsListingSections();
      return;
    }
    if (!canRewriteNative(settings)) return;
    if (adapter.id === 'simblr') {
      rewriteSimblrPage(pageType);
      return;
    }
    if (adapter.id === 'tsr') {
      rewriteTsrPage(pageType);
    }
  }

  function scheduleIdleWork(work, timeout = 120) {
    if (typeof work !== 'function') return;
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => work(), { timeout: Math.max(80, timeout * 4) });
      return;
    }
    setTimeout(work, timeout);
  }

  function getCachedCardData(node, cacheKey, extractor) {
    if (!node || typeof extractor !== 'function') return {};
    const prop = `__sccb_${cacheKey}_cardData`;
    if (node[prop]) return node[prop];
    const data = extractor(node) || {};
    try { Object.defineProperty(node, prop, { value: data, configurable: true }); }
    catch (_) { node[prop] = data; }
    return data;
  }

  function forEachWithBudget(nodes, worker, max = 120) {
    const list = Array.from(nodes || []);
    const limit = Math.min(list.length, Math.max(1, Number(max) || 120));
    for (let i = 0; i < limit; i++) worker(list[i], i);
    if (list.length > limit) scheduleIdleWork(() => forEachWithBudget(list.slice(limit), worker, max), 80);
  }

  const ADAPTER_DEPS = {
    parseMtsFiles,
    parseSimblrFiles,
    parseTsrFiles,
    stableHash,
    cleanText,
    uniqueElements,
  };
  const siteAdapters = (Array.isArray(adapterFactories) ? adapterFactories : [])
    .map(factory => typeof factory === 'function' ? factory(ADAPTER_DEPS) : factory)
    .filter(Boolean);

  function getSiteAdapter(id) {
    return siteAdapters.find(site => site.id === id) || null;
  }

  adapter = getAdapter(location.href);
  if (!adapter) return;

  migrateOldData();
  injectStyles();
  applyGridSettings();
  initializeSiteUi();
  ensureFab();
  ensureMiniStrip();
  wirePage();
  bindGlobalKeys();

  const observer = new MutationObserver(() => scheduleCleanup(adapter?.id || 'mutation', adapter?.id === 'tsr' ? 250 : 90));
  observer.observe(document.documentElement, { childList: true, subtree: true });

  let sccbResizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(sccbResizeTimer);
    sccbResizeTimer = setTimeout(runMobileModeAuditFixes, 120);
  }, { passive: true });

  function wireListingCards(pageType = state.pageType) {
    const limit = pageType === 'detail' ? 80 : 250;
    const cards = adapter.listingCards(document).slice(0, limit);
    cards.forEach(card => {
      if (card.getAttribute(WIRED_ATTR)) return;
      const link = adapter.findModLink(card);
      if (!link) return;
      card.setAttribute(WIRED_ATTR, '1');
      card.setAttribute(CARD_ATTR, '1');
      card.classList.add('sccb-site-card');

      const modUrl = adapter.normalizeDetailUrl(link.href);
      const modId = adapter.modIdFromUrl(modUrl);
      const title = adapter.titleFromCard(card, link);
      decorateListingCard(card, title);
      const button = makeAddButton({ modUrl, modId, title, source: 'listing' });
      button.classList.add('sccb-card-button');
      adapter.appendButton(card, button);
      updateButtonState(button, modId);
    });
  }

  function wireDetailPage() {
    if (!adapter.isDetailUrl(location.href)) return;
    if (document.querySelector('#sccb-detail-button')) return;

    const modUrl = adapter.normalizeDetailUrl(location.href);
    const modId = adapter.modIdFromUrl(modUrl);
    const title = adapter.extractTitle(document, modUrl);
    const button = makeAddButton({ modUrl, modId, title, source: 'detail' });
    button.id = 'sccb-detail-button';
    button.classList.add('sccb-detail-button');
    button.textContent = '+ Add this mod to basket';

    const target = adapter.detailInsertTarget(document);
    target?.classList.add('sccb-site-detail-anchor');
    if (target?.id === 'sccb-mts-detail-actions') target.appendChild(button);
    else if (target) target.insertAdjacentElement('afterend', button);
    else document.body.prepend(button);
    updateButtonState(button, modId);
  }

  function initializeSiteUi() {
    applyGridSettings();
    document.documentElement.dataset.sccbSite = adapter.id;
    applyRuntimeModeDatasets();
    document.documentElement.dataset.sccbDetail = adapter.isDetailUrl(location.href) ? '1' : '0';
    document.body?.classList.add('sccb-site-ui-ready');
    const theme = document.querySelector('meta[name="theme-color"]') || document.head.appendChild(document.createElement('meta'));
    theme.setAttribute('name', 'theme-color');
    theme.setAttribute('content', '#101719');
  }

  function runMobileModeAuditFixes() {
    const isMobile = (() => {
      try { return window.matchMedia('(max-width: 760px), (pointer: coarse)').matches; }
      catch (_) { return window.innerWidth <= 760; }
    })();
    document.documentElement.dataset.sccbMobile = isMobile ? '1' : '0';

    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head?.appendChild(viewport);
    }
    const currentViewport = viewport.getAttribute('content') || '';
    if (!/viewport-fit=cover/i.test(currentViewport) || !/width=device-width/i.test(currentViewport)) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
    }

    try {
      document.documentElement.style.setProperty('--sccb-vh', `${Math.max(1, window.innerHeight * 0.01)}px`);
    } catch (_) {}

    if (!isMobile) return;

    document.querySelectorAll('table, pre, code, .bbcode, .code, .sccb-site-download-zone, .downloadDetails, .downloadDescription').forEach(el => {
      if (!el.closest('.sccb-panel, .sccb-file-modal')) el.classList.add('sccb-mobile-scrollbox');
    });

    document.querySelectorAll('img, video, iframe, canvas, svg').forEach(el => {
      if (!el.closest('.sccb-panel, .sccb-file-modal')) el.classList.add('sccb-mobile-media');
    });

    document.querySelectorAll('[style]').forEach(el => {
      if (el.closest('.sccb-panel, .sccb-file-modal, #sccb-fab, #sccb-mini-strip')) return;
      if (el.matches('img, video, canvas, svg, iframe')) return;
      const style = el.getAttribute('style') || '';
      if (/(?:^|;)\s*(?:min-)?width\s*:\s*(?:[4-9]\d{2,}|\d{4,})px/i.test(style) || /left\s*:\s*-?\d{3,}px/i.test(style)) {
        el.classList.add('sccb-mobile-unclamp');
      }
    });
  }

  function enhanceSitePageUi(pageType = state.pageType) {
    applyGridSettings();
    document.documentElement.dataset.sccbSite = adapter.id;
    applyRuntimeModeDatasets();
    document.documentElement.dataset.sccbDetail = adapter.isDetailUrl(location.href) ? '1' : '0';
    document.body?.classList.add('sccb-site-ui-ready');

    const cards = adapter.listingCards(document).slice(0, 250);
    cards.forEach(card => {
      card.classList.add('sccb-site-card');
      const link = adapter.findModLink(card);
      if (link) decorateListingCard(card, adapter.titleFromCard(card, link));
    });
    decorateSiteSections();

    if (adapter.isDetailUrl(location.href)) {
      document.querySelector('h1, .display-5, .display-6, .downloadtitle')?.classList.add('sccb-site-title');
      adapter.detailInsertTarget(document)?.classList.add('sccb-site-detail-anchor');
      document.querySelector('#scroll_files, #actualcontent3, .downloadlinks, .downloadlist, .table')?.classList.add('sccb-site-download-zone');
      document.querySelectorAll('a.downloadlink').forEach(a => a.classList.add('sccb-site-download-link'));
    }
  }

  function decorateListingCard(card, title) {
    if (!card) return;
    card.dataset.sccbTitle = title || card.dataset.sccbTitle || '';
    if (card.classList.contains('sccb-rendered-mts-card') || card.classList.contains('sccb-rendered-tsr-card')) return;
    if (card.querySelector(':scope > .sccb-site-card-ribbon')) return;
    const ribbon = document.createElement('div');
    ribbon.className = 'sccb-site-card-ribbon';
    ribbon.innerHTML = `<span class="sccb-plumbob-mini"></span><span>${escapeHtml(adapter.name)}</span>`;
    card.prepend(ribbon);
    card.dataset.sccbTitle = title || '';
  }

  function decorateSiteSections() {
    const sectionCandidates = [
      ...document.querySelectorAll('.message, section, .container, .container-fluid, .row, .row-fluid, .carousel, .card-group, .album, .content, .maincontentwrapper')
    ];
    sectionCandidates.forEach(section => {
      if (!section || section.id === 'sccb-site-toolbar') return;
      if (section.querySelector('.sccb-site-card, [data-sccb-card="1"], .smol-card-component, .grid-card, article.card')) {
        section.classList.add('sccb-site-section');
        const heading = section.querySelector('.message-header, .card-header, .section-header, .section-title, .row-title, .index-title, h2, h3');
        heading?.classList.add('sccb-site-section-heading');
      }
    });

    document.querySelectorAll('.message-header, .card-header, .section-header, .section-title, .row-title, .index-title, .bg-primary, .text-bg-primary').forEach(el => {
      if (!el.closest('.sccb-panel, .sccb-file-modal, #sccb-site-toolbar')) el.classList.add('sccb-site-section-heading');
    });

    document.querySelectorAll('footer, .footer, #menubar.bottom-footer').forEach(el => el.classList.add('sccb-site-footer'));
  }

  function rewriteMtsPageNavigation() {
    if (adapter?.id !== 'mts') return;
    const nav = document.querySelector('#pagenavigation');
    if (!nav || nav.dataset.sccbMtsPageNav === '1') return;

    const oldTitleRow = nav.querySelector(':scope > div');
    const gameLinkSource = nav.querySelector('.headingtitle a');
    const subtitleNodes = [...nav.querySelectorAll('.subtitle')];
    const titleSubtitle = subtitleNodes[0];
    const countSubtitle = subtitleNodes.find(node => /found/i.test(cleanText(node.textContent || '')));
    const downloadLinkSource = titleSubtitle?.querySelector('a[href]');

    const rawTrail = cleanText(titleSubtitle?.textContent || 'Downloads');
    const parts = rawTrail.split('»').map(part => cleanText(part)).filter(Boolean);
    let currentTitle = parts[parts.length - 1] || 'Downloads';
    if (/^downloads$/i.test(currentTitle)) {
      const path = location.pathname + location.search;
      if (/showType=1|updated/i.test(path)) currentTitle = 'Updated Downloads';
    }
    const countText = cleanText(countSubtitle?.textContent || '').replace(/^\(|\)$/g, '');
    const tagline = cleanText(nav.querySelector('.inBetweenLine')?.textContent || '');

    const hero = document.createElement('div');
    hero.className = 'sccb-mts-page-hero';

    const main = document.createElement('div');
    main.className = 'sccb-mts-page-main';

    const crumbs = document.createElement('div');
    crumbs.className = 'sccb-mts-page-crumbs';

    const game = gameLinkSource ? gameLinkSource.cloneNode(true) : document.createElement('span');
    if (!gameLinkSource) game.textContent = 'Sims 3';
    game.classList.add('sccb-mts-page-crumb');
    game.removeAttribute('style');

    const downloads = downloadLinkSource ? downloadLinkSource.cloneNode(true) : document.createElement('span');
    if (!downloadLinkSource) downloads.textContent = 'Downloads';
    downloads.classList.add('sccb-mts-page-crumb');
    downloads.removeAttribute('style');

    const current = document.createElement('span');
    current.className = 'sccb-mts-page-current';
    current.textContent = currentTitle;

    crumbs.append(game, makeMtsCrumbSeparator(), downloads, makeMtsCrumbSeparator(), current);

    const titleLine = document.createElement('div');
    titleLine.className = 'sccb-mts-page-title-line';
    const title = document.createElement('h1');
    title.className = 'sccb-mts-page-title';
    title.textContent = currentTitle;
    titleLine.appendChild(title);
    if (countText) {
      const count = document.createElement('span');
      count.className = 'sccb-mts-page-count-chip';
      count.textContent = countText;
      titleLine.appendChild(count);
    }

    main.append(crumbs, titleLine);
    if (tagline) {
      const sub = document.createElement('div');
      sub.className = 'sccb-mts-page-tagline';
      sub.textContent = tagline;
      main.appendChild(sub);
    }

    const actions = document.createElement('div');
    actions.className = 'sccb-mts-page-actions';
    const paginationCandidates = [...nav.querySelectorAll('.pagination, .pager, .pagenav, .pageNav, [class*="pagination"], [class*="pagenav"]')]
      .filter(el => !el.closest('.sccb-mts-page-hero'));
    paginationCandidates.forEach(el => actions.appendChild(el));

    hero.append(main, actions);
    nav.prepend(hero);
    if (oldTitleRow) oldTitleRow.classList.add('sccb-mts-native-title-row');
    nav.dataset.sccbMtsPageNav = '1';
  }

  function makeMtsCrumbSeparator() {
    const sep = document.createElement('span');
    sep.className = 'sccb-mts-page-separator';
    sep.textContent = '›';
    return sep;
  }

  function rewriteMtsDetailPage() {
    if (!canRewriteNative()) return;
    document.documentElement.dataset.sccbModule = 'MTS detail renderer';
    if (adapter.id !== 'mts' || !adapter.isDetailUrl(location.href) || !canRewriteNative()) return;
    const main = document.querySelector('.maincontentinner') || document.querySelector('#maincontentwrapper, .maincontentwrapper, main, .container');
    if (!main) return;

    const alreadyRewritten = main.dataset.sccbMtsDetailRewritten === '1';
    main.classList.add('sccb-mts-detail-page');
    main.dataset.sccbMtsDetailRewritten = '1';

    const modUrl = adapter.normalizeDetailUrl(location.href);
    const titleText = adapter.extractTitle(document, modUrl);
    const creator = adapter.extractCreator(document);
    const titleSection = document.querySelector('#scroll_title');
    const statsBar = document.querySelector('#statistics_bar');
    const buttonsBar = document.querySelector('#buttons_bar');
    const gallery = document.querySelector('.carousel-wrapper, #screenshots, #scroll_carousel');
    const galleryWrapper = document.querySelector('.carousel-wrapper');
    const columnWrapper = document.querySelector('.column-wrapper');
    const descriptionBox = document.querySelector('#descriptionbox');
    const tabContent = document.querySelector('#tabcontent');
    const sidebar = document.querySelector('#sidebar');
    const tabs = document.querySelector('#actualtabs');
    const files = document.querySelector('#scroll_files, #actualcontent3');

    let hero = document.querySelector('#sccb-mts-detail-hero');
    if (!hero) {
      hero = document.createElement('section');
      hero.id = 'sccb-mts-detail-hero';
      hero.className = 'sccb-mts-detail-hero';

      const iconUrl = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      const safeIcon = iconUrl ? escapeAttr(new URL(iconUrl, location.href).href) : '';
      const statChips = buildMtsDetailStatChips(statsBar);
      hero.innerHTML = `
        <div class="sccb-mts-detail-titleblock">
          ${safeIcon ? `<img class="sccb-mts-detail-icon" src="${safeIcon}" alt="">` : `<span class="sccb-mts-detail-icon sccb-mts-detail-icon-fallback">◆</span>`}
          <div class="sccb-mts-detail-titlecopy">
            <div class="sccb-mts-detail-kicker">Sims 3 download</div>
            <h1 class="sccb-mts-detail-title">${escapeHtml(titleText)}</h1>
            ${creator ? `<div class="sccb-mts-detail-byline">by <strong>${escapeHtml(creator)}</strong></div>` : ''}
          </div>
        </div>
        <div class="sccb-mts-detail-stat-row">${statChips}</div>
        <div id="sccb-mts-detail-actions" class="sccb-mts-detail-actions"></div>`;
      (titleSection || main.firstElementChild || main).insertAdjacentElement('beforebegin', hero);
    }

    titleSection?.classList.add('sccb-mts-native-hidden-title');
    statsBar?.classList.add('sccb-mts-native-hidden-stats');
    buttonsBar?.classList.add('sccb-mts-native-buttons-bar');
    if (buttonsBar && !hero.querySelector('.sccb-mts-native-buttons-bar')) {
      hero.querySelector('#sccb-mts-detail-actions')?.appendChild(buttonsBar);
    }

    rebuildMtsDetailGallery(galleryWrapper || gallery, hero);
    themeMtsDetailNativeLeaks();

    if (galleryWrapper) {
      galleryWrapper.classList.add('sccb-mts-detail-gallery-card');
      if (!galleryWrapper.querySelector(':scope > .sccb-mts-gallery-head')) {
        const head = document.createElement('div');
        head.className = 'sccb-mts-gallery-head';
        head.innerHTML = `<span>Preview gallery</span><span class="sccb-mts-gallery-hint">Click image for full size</span>`;
        galleryWrapper.prepend(head);
      }
      const carousel = galleryWrapper.querySelector('.main-carousel, #largeScreenshots');
      const cells = [...galleryWrapper.querySelectorAll('.carousel-cell')];
      const images = [...galleryWrapper.querySelectorAll('.carousel-cell img, img.carousel-cell-image, img[src]')]
        .filter(img => img.src && !img.classList.contains('sf-hidden'));
      if (carousel) carousel.classList.add('sccb-mts-gallery-carousel');
      cells.forEach((cell, i) => cell.dataset.sccbGalleryIndex = String(i));
      if (images.length && !galleryWrapper.querySelector('.sccb-mts-gallery-strip')) {
        const strip = document.createElement('div');
        strip.className = 'sccb-mts-gallery-strip';
        images.slice(0, 12).forEach((img, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `sccb-mts-gallery-thumb${i === 0 ? ' is-active' : ''}`;
          btn.title = `Preview ${i + 1}`;
          const src = img.currentSrc || img.src || img.dataset.flickityLazyload || img.dataset.src || '';
          btn.innerHTML = `<img src="${escapeAttr(src)}" alt="Preview ${i + 1}">`;
          btn.addEventListener('click', () => {
            strip.querySelectorAll('.sccb-mts-gallery-thumb').forEach(el => el.classList.remove('is-active'));
            btn.classList.add('is-active');
            const targetCell = cells[i];
            try {
              if (window.jQuery && carousel) window.jQuery(carousel).flickity?.('select', i);
              else if (carousel?.flickity?.select) carousel.flickity.select(i);
              else targetCell?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } catch {
              targetCell?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
          });
          strip.appendChild(btn);
        });
        galleryWrapper.appendChild(strip);
      }
    } else if (gallery) {
      gallery.classList.add('sccb-mts-detail-gallery-card');
    }

    columnWrapper?.classList.add('sccb-mts-detail-layout');
    descriptionBox?.classList.add('sccb-mts-detail-main');
    tabContent?.classList.add('sccb-mts-detail-tabcontent');
    tabs?.classList.add('sccb-mts-detail-tabs');
    sidebar?.classList.add('sccb-mts-detail-sidebar');
    files?.classList.add('sccb-mts-detail-files');

    rewriteMtsDetailBreadcrumbs();
    normalizeMtsDetailStats(statsBar);
    themeMtsDetailButtons();
    replaceMtsInlineIcons();
    markMtsRelatedDownloadSections();

    document.querySelectorAll('#actualcontent1, #actualcontent2, #actualcontent3, #actualcontent5').forEach(el => {
      el.classList.add('sccb-mts-detail-tab-pane');
    });
    document.querySelectorAll('#sidebar .message, .sccb-mts-detail-sidebar .message').forEach(el => {
      el.classList.add('sccb-mts-sidebar-card');
    });
    document.querySelectorAll('#actualcontent1 > .message, #actualcontent3 > .message, #actualcontent2 > .message, #actualcontent5 > .message').forEach(el => {
      el.classList.add('sccb-mts-content-card');
    });
    document.querySelectorAll('.adslot-wrapper-horizontal, #adslot-interstitial, .adslot-interstitial').forEach(el => {
      el.classList.add('sccb-mts-muted-adslot');
    });
  }

  function buildMtsDetailStatChips(statsBar) {
    const stats = extractMtsDetailStats(statsBar);
    if (!stats.length) return '';
    return stats.map(stat => `
      <span class="sccb-mts-detail-stat-chip" title="${escapeAttr(stat.original || `${stat.value} ${stat.label}`)}">
        <span class="sccb-mts-detail-stat-emoji">${escapeHtml(stat.emoji)}</span>
        <span class="sccb-mts-detail-stat-value">${escapeHtml(stat.value)}</span>
        <span class="sccb-mts-detail-stat-label">${escapeHtml(stat.label)}</span>
      </span>`).join('');
  }

  function extractMtsDetailStats(statsBar) {
    if (!statsBar) return [];
    const rawSpans = [...statsBar.querySelectorAll(':scope > span')];
    const rawTexts = rawSpans.length ? rawSpans.map(span => cleanText(span.textContent)) : [cleanText(statsBar.textContent)];
    const stats = [];
    const add = (emoji, value, label, original) => {
      value = cleanText(value || '');
      label = cleanText(label || '');
      if (!value || !label) return;
      const key = `${emoji}:${value}:${label}`.toLowerCase();
      if (stats.some(stat => stat.key === key)) return;
      stats.push({ key, emoji, value, label, original: original || `${value} ${label}` });
    };
    rawTexts.forEach(text => {
      const clean = cleanText(text || '');
      if (!clean) return;
      let m;
      if ((m = clean.match(/Downloaded\s+([\d,.]+\s*[kKmM]?)\s+times/i))) add('⬇️', m[1], 'downloads', clean);
      if ((m = clean.match(/([\d,.]+\s*[kKmM]?)\s+Thanks?/i))) add('💚', m[1], 'thanks', clean);
      if ((m = clean.match(/([\d,.]+\s*[kKmM]?)\s+Favou?rites?d?/i))) add('💚', m[1], 'favourited', clean);
      if ((m = clean.match(/([\d,.]+\s*[kKmM]?)\s+Views?/i))) add('👁️', m[1], 'views', clean);
    });
    return stats.slice(0, 6);
  }

  function normalizeMtsDetailStats(statsBar) {
    if (!statsBar || statsBar.dataset.sccbMtsStatsNormalized === '1') return;
    const stats = extractMtsDetailStats(statsBar);
    if (!stats.length) return;
    statsBar.dataset.sccbMtsStatsNormalized = '1';
    statsBar.classList.add('sccb-mts-detail-stat-native-row');
    statsBar.textContent = '';
    stats.forEach(stat => {
      const chip = document.createElement('span');
      chip.className = 'sccb-mts-detail-stat-chip sccb-mts-detail-stat-chip-native';
      chip.title = stat.original || `${stat.value} ${stat.label}`;
      chip.innerHTML = `<span class="sccb-mts-detail-stat-emoji">${escapeHtml(stat.emoji)}</span><span class="sccb-mts-detail-stat-value">${escapeHtml(stat.value)}</span><span class="sccb-mts-detail-stat-label">${escapeHtml(stat.label)}</span>`;
      statsBar.appendChild(chip);
    });
  }

  function rewriteMtsDetailBreadcrumbs() {
    const nav = document.querySelector('#navbits.navbits-top, #navbits, .navbits-top');
    if (!nav) return;

    const collectItems = () => {
      const liItems = [...nav.querySelectorAll('ul.breadcrumb li, .breadcrumb li, .navbits-breadcrumbs li')]
        .map(li => {
          const link = li.querySelector('a[href]');
          const text = cleanText(link?.textContent || li.textContent || '')
            .replace(/^>|>$/g, '')
            .replace(/›/g, '')
            .trim();
          return text ? { text, href: link?.href || '' } : null;
        })
        .filter(Boolean);
      if (liItems.length) return liItems;

      const anchors = [...nav.querySelectorAll('a[href]')]
        .map(a => ({ text: cleanText(a.textContent || ''), href: a.href || '' }))
        .filter(item => item.text);
      if (anchors.length) return anchors;

      const raw = cleanText(nav.textContent || '');
      return raw.split(/>|›|»/).map(part => ({ text: cleanText(part), href: '' })).filter(item => item.text);
    };

    const items = collectItems()
      .filter((item, index, arr) => arr.findIndex(other => other.text.toLowerCase() === item.text.toLowerCase() && other.href === item.href) === index)
      .slice(0, 8);
    if (!items.length) return;

    const rail = nav.querySelector('.sccb-mts-detail-breadcrumb-rail') || document.createElement('nav');
    rail.className = 'sccb-mts-detail-breadcrumb-rail';
    rail.setAttribute('aria-label', 'Download path');
    rail.textContent = '';
    items.forEach((item, index) => {
      if (index) {
        const sep = document.createElement('span');
        sep.className = 'sccb-mts-detail-breadcrumb-sep';
        sep.textContent = '›';
        rail.appendChild(sep);
      }
      const el = item.href ? document.createElement('a') : document.createElement('span');
      el.className = `sccb-mts-detail-breadcrumb-chip${index === items.length - 1 ? ' is-current' : ''}`;
      if (item.href) el.href = item.href;
      el.textContent = item.text;
      rail.appendChild(el);
    });
    nav.dataset.sccbMtsCrumbs = '1';
    if (!rail.parentNode) {
      nav.textContent = '';
      nav.appendChild(rail);
    }
  }

  function themeMtsDetailButtons() {
    document.querySelectorAll('.button, a.button, input.button, .btn, a.btn, .tag:not(body), a.tag, button').forEach(el => {
      if (el.closest('.sccb-panel, .sccb-file-modal, #sccb-site-toolbar')) return;
      if (el.matches('.sccb-btn, .sccb-add, .sccb-icon-btn')) return;
      el.classList.add('sccb-mts-themed-button');
    });
    const thank = document.querySelector('#thankme');
    if (thank && thank.dataset.sccbThanksThemed !== '1') {
      thank.dataset.sccbThanksThemed = '1';
      thank.classList.add('sccb-mts-thanks-button');
      thank.innerHTML = '<span class="sccb-mts-thanks-icon">💚</span><span>Say thanks</span>';
    }
    const thanked = document.querySelector('#thanksyou');
    if (thanked) thanked.classList.add('sccb-mts-thanked-chip');
    document.querySelectorAll('a[href*="/downloads/all/?u="], a[href*="downloads/all/?u="], a[href*="download.php?u="]').forEach(a => {
      if (/view\s+all\s+downloads/i.test(cleanText(a.textContent || ''))) {
        a.classList.add('sccb-mts-author-downloads-button');
        a.textContent = 'View all downloads';
      }
    });
  }

  function replaceMtsInlineIcons() {
    const alarmSelectors = [
      'img.inlineimg[src*="alarm"]',
      'img[src*="alarm.gif"]',
      'img[src*="smilies/alarm"]',
      'img[title="Alarm"]',
      'img[alt="Alarm"]'
    ].join(',');
    document.querySelectorAll(alarmSelectors).forEach(img => {
      if (img.dataset.sccbReplacedIcon === '1') return;
      const icon = document.createElement('span');
      icon.className = 'sccb-mts-inline-alert-pill';
      icon.title = img.title || 'Important note';
      icon.innerHTML = '<span aria-hidden="true">⚠</span><strong>Important</strong>';
      img.dataset.sccbReplacedIcon = '1';
      img.replaceWith(icon);
    });
    document.querySelectorAll('.header1fontColor, .darkgreen, .fas.fa-arrow-alt-right, .fa-solid.fa-arrow-alt-right').forEach(el => {
      el.classList.add('sccb-mts-native-accent-themed');
    });
  }

  function markMtsRelatedDownloadSections() {
    document.querySelectorAll('.cards-horizontal, .message:has(.smol-card-component), .message-body:has(.smol-card-component)').forEach(el => {
      if (el.closest('.sccb-panel, .sccb-file-modal')) return;
      el.classList.add('sccb-mts-related-downloads-zone');
    });
    document.querySelectorAll('.message-header').forEach(header => {
      const text = cleanText(header.textContent || '');
      if (/more downloads|other download|recommendations/i.test(text)) header.classList.add('sccb-mts-related-heading');
    });
    // Detail pages can load recommendation cards after the first pass. Re-run the
    // same card-shell renderer used on listing pages so related cards never keep
    // the native MTS layout or duplicate site chips/buttons.
    rewriteMtsListingSections();
  }

  function rebuildMtsDetailGallery(nativeGallery, hero) {
    if (document.querySelector('#sccb-mts-custom-gallery')) return;
    const roots = uniqueElements([
      nativeGallery,
      document.querySelector('.carousel-wrapper'),
      document.querySelector('#scroll_carousel'),
      document.querySelector('#screenshots')
    ].filter(Boolean));
    const images = [];
    const seen = new Set();
    roots.forEach(root => {
      root.querySelectorAll('img').forEach(img => {
        const src = img.currentSrc || img.src || img.dataset.flickityLazyload || img.dataset.lazyload || img.dataset.src || '';
        if (!src || seen.has(src) || img.classList.contains('sf-hidden')) return;
        seen.add(src);
        images.push({ src, alt: img.alt || adapter.extractTitle(document, location.href) || 'Preview image' });
      });
    });
    if (!images.length) return;

    const card = document.createElement('section');
    card.id = 'sccb-mts-custom-gallery';
    card.className = 'sccb-mts-custom-gallery';
    const title = adapter.extractTitle(document, location.href) || 'Preview';
    card.innerHTML = `
      <div class="sccb-mts-custom-gallery-head">
        <div>
          <div class="sccb-mts-custom-gallery-kicker">Preview gallery</div>
          <h2>${escapeHtml(title)}</h2>
        </div>
        <a class="sccb-mts-custom-gallery-open" href="${escapeAttr(images[0].src)}" target="_blank" rel="noopener">Open image</a>
      </div>
      <div class="sccb-mts-custom-gallery-stage">
        <button type="button" class="sccb-mts-custom-gallery-nav prev" aria-label="Previous image">‹</button>
        <img class="sccb-mts-custom-gallery-main" src="${escapeAttr(images[0].src)}" alt="${escapeAttr(images[0].alt)}">
        <button type="button" class="sccb-mts-custom-gallery-nav next" aria-label="Next image">›</button>
      </div>
      <div class="sccb-mts-custom-gallery-thumbs" role="list"></div>`;

    const main = card.querySelector('.sccb-mts-custom-gallery-main');
    const open = card.querySelector('.sccb-mts-custom-gallery-open');
    const thumbs = card.querySelector('.sccb-mts-custom-gallery-thumbs');
    let active = 0;
    const select = index => {
      active = (index + images.length) % images.length;
      main.src = images[active].src;
      main.alt = images[active].alt;
      open.href = images[active].src;
      thumbs.querySelectorAll('.sccb-mts-custom-gallery-thumb').forEach((btn, i) => {
        btn.classList.toggle('is-active', i === active);
        btn.setAttribute('aria-selected', i === active ? 'true' : 'false');
      });
    };
    images.forEach((image, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sccb-mts-custom-gallery-thumb${i === 0 ? ' is-active' : ''}`;
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.innerHTML = `<img src="${escapeAttr(image.src)}" alt="Preview ${i + 1}">`;
      btn.addEventListener('click', () => select(i));
      thumbs.appendChild(btn);
    });
    card.querySelector('.sccb-mts-custom-gallery-nav.prev')?.addEventListener('click', () => select(active - 1));
    card.querySelector('.sccb-mts-custom-gallery-nav.next')?.addEventListener('click', () => select(active + 1));

    (hero || document.querySelector('.maincontentinner') || document.body).insertAdjacentElement('afterend', card);
    roots.forEach(root => root.classList.add('sccb-mts-native-gallery-hidden'));
  }

  function themeMtsDetailNativeLeaks() {
    document.documentElement.classList.add('sccb-mts-detail-rebuilt');
    document.querySelectorAll(
      '.maincontentinner > .message-header.color-mode__header, #scroll_carousel, #screenshots, .adslot-wrapper-horizontal, .adslot-interstitial, #adslot-interstitial'
    ).forEach(el => el.classList.add('sccb-mts-native-leak-hidden'));

    document.querySelectorAll(
      '.maincontentinner, .column-wrapper, #descriptionbox, #tabcontent, #actualcontent1, #actualcontent2, #actualcontent3, #actualcontent5, #sidebar, #scroll_files, .navbits-top'
    ).forEach(el => el.classList.add('sccb-mts-detail-surface'));

    document.querySelectorAll(
      '.maincontentinner .message, .maincontentinner section.message, #scroll_files.message, #sidebar .message, #descriptionbox > .message'
    ).forEach(el => el.classList.add('sccb-mts-detail-cardified'));

    document.querySelectorAll(
      '.maincontentinner .message-header, #scroll_files .message-header, #sidebar .message-header, #descriptionbox .message-header, .tabs-bg-white'
    ).forEach(el => el.classList.add('sccb-mts-detail-native-header-themed'));

    document.querySelectorAll(
      '.maincontentinner .message-body, #scroll_files .message-body, #sidebar .message-body, #descriptionbox .message-body'
    ).forEach(el => el.classList.add('sccb-mts-detail-native-body-themed'));
  }

  function rewriteMtsListingSections() {
    if (!canRewriteNative()) return;
    document.documentElement.dataset.sccbModule = 'MTS listing renderer';
    if (adapter?.id !== 'mts') return;

    const nativeSections = uniqueElements([...document.querySelectorAll('.message, .sccb-mts-related-downloads-zone, .cards-horizontal')])
      .filter(section => !section.closest('.sccb-panel, .sccb-file-modal, #sccb-site-toolbar'))
      .filter(section => !section.dataset.sccbMtsRewritten)
      .filter(section => section.querySelector('.smol-card-component'));

    nativeSections.forEach(section => {
      const originalHeader = section.querySelector(':scope > .message-header');
      const originalBody = section.matches?.('.message-body, .cards-horizontal, .utils-outer') ? section : (section.querySelector(':scope > .message-body, :scope > .utils-outer, :scope > .cards-horizontal') || section);
      const originalGrid = originalBody.matches?.('.smol-css-grid, .constrained-grid') ? originalBody : (originalBody.querySelector(':scope > .smol-css-grid, :scope > .constrained-grid') || originalBody.querySelector('.smol-css-grid, .constrained-grid'));
      const cards = originalGrid
        ? [...originalGrid.querySelectorAll(':scope > .smol-card-component')]
        : [...originalBody.querySelectorAll('.smol-card-component')];
      if (!cards.length) return;

      const title = extractMtsSectionTitle(originalHeader, section) || 'Downloads';
      const actionLinks = extractMtsSectionActions(originalHeader);

      const newHeader = document.createElement('div');
      newHeader.className = 'sccb-mts-section-header sccb-site-section-heading';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'sccb-mts-section-title-wrap';
      const h2 = document.createElement('h2');
      h2.className = 'sccb-mts-section-title';
      h2.textContent = title;
      const meta = document.createElement('div');
      meta.className = 'sccb-mts-section-meta';
      meta.textContent = `${cards.length} visible download${cards.length === 1 ? '' : 's'}`;
      titleWrap.append(h2, meta);

      const actions = document.createElement('div');
      actions.className = 'sccb-mts-section-actions';
      actionLinks.forEach(link => actions.appendChild(link));
      newHeader.append(titleWrap, actions);

      const newBody = document.createElement('div');
      newBody.className = 'sccb-mts-section-body';
      const newGrid = document.createElement('ul');
      newGrid.className = 'sccb-mts-grid';
      newGrid.setAttribute('role', 'list');

      cards.forEach(card => {
        const rendered = renderMtsCardShell(card);
        if (!rendered) return;
        newGrid.appendChild(rendered);
      });
      newBody.appendChild(newGrid);

      section.textContent = '';
      section.classList.add('sccb-mts-section', 'sccb-site-section');
      section.dataset.sccbMtsRewritten = '1';
      section.append(newHeader, newBody);
    });
  }

  function extractMtsSectionTitle(header, fallbackRoot) {
    if (header) {
      const clone = header.cloneNode(true);
      clone.querySelectorAll('a, button, i, svg, img, .btn, .badge').forEach(el => el.remove());
      const clean = sanitizeMtsSectionTitle(cleanText(clone.textContent));
      if (clean) return clean;
    }

    const idTitle = humanizeMtsSectionId(fallbackRoot?.id || '');
    if (idTitle) return idTitle;

    const directHeading = fallbackRoot?.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > .title, :scope > .headingtitle');
    const cleanHeading = sanitizeMtsSectionTitle(cleanText(directHeading?.textContent || ''));
    if (cleanHeading) return cleanHeading;

    return 'Downloads';
  }

  function sanitizeMtsSectionTitle(text) {
    const clean = cleanText(text || '')
      .replace(/\bSee more\s+\w+\b/ig, '')
      .replace(/\bFeatured Upload!\b/ig, '')
      .replace(/\bPicked Upload!\b/ig, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return '';
    // If a legacy wrapper without a real header is rewritten, its textContent is
    // the concatenation of every card title, creator, date, and preview. Never
    // use that as a section heading.
    if (clean.length > 72) return '';
    if (/\bby\s+\S+\s+(updated|uploaded|today|yesterday)\b/i.test(clean)) return '';
    if ((clean.match(/»/g) || []).length > 1) return '';
    return clean;
  }

  function humanizeMtsSectionId(id) {
    const map = {
      recentlyAdded: 'Recently Added',
      updatedDownloads: 'Updated Downloads',
      popularDownloads: 'Popular Downloads',
      featuredDownloads: 'Featured Downloads',
      pickedDownloads: 'Picked Downloads',
      downloads: 'Downloads'
    };
    if (map[id]) return map[id];
    const clean = cleanText(id || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[\-_]+/g, ' ')
      .trim();
    if (!clean || clean.length > 40) return '';
    return clean.replace(/\w/g, ch => ch.toUpperCase());
  }

  function extractMtsSectionActions(header) {
    if (!header) return [];
    return [...header.querySelectorAll('a[href]')].slice(0, 3).map(link => {
      const action = link.cloneNode(true);
      action.className = 'sccb-mts-section-action';
      action.removeAttribute('style');
      const text = cleanText(action.textContent) || action.getAttribute('title') || 'See more';
      action.textContent = text.replace(/^\s*featured upload!\s*/i, '').replace(/^\s*picked upload!\s*/i, '').trim() || 'See more';
      return action;
    });
  }

  function renderMtsCardShell(nativeCard) {
    const data = getCachedCardData(nativeCard, 'mts', extractMtsCardData);
    if (!data?.url) return null;

    const card = document.createElement('li');
    card.className = 'sccb-rendered-mts-card sccb-mts-card smol-card-component sccb-site-card';
    card.dataset.sccbRendered = '1';
    card.dataset.sccbModule = 'MTS card renderer';
    card.dataset.sccbTitle = data.title;

    const thumb = document.createElement('a');
    thumb.className = 'sccb-mts-card-thumb';
    thumb.href = data.url;
    thumb.title = data.title;

    if (data.imageUrl) {
      // Render as a background block instead of carrying over MTS's native
      // .featuredimage <img>. The native image CSS is heavily constrained on
      // some pages and was causing tiny top-left thumbnails inside our cards.
      const image = document.createElement('span');
      image.className = 'sccb-mts-card-image';
      image.setAttribute('role', 'img');
      image.setAttribute('aria-label', data.title);
      image.style.backgroundImage = `url(${JSON.stringify(data.imageUrl)})`;
      thumb.appendChild(image);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'sccb-mts-card-placeholder';
      placeholder.textContent = '◆';
      thumb.appendChild(placeholder);
    }

    if (data.titleEmojis.length) {
      const flag = document.createElement('span');
      flag.className = 'sccb-title-emoji-flag';
      flag.textContent = data.titleEmojis.join(' ');
      thumb.appendChild(flag);
    }

    const body = document.createElement('div');
    body.className = 'sccb-mts-card-body downloadDetails';

    const title = document.createElement('a');
    title.className = 'sccb-card-title downloadtitle';
    title.href = data.url;
    if (data.titleEmojis.length) {
      const icon = document.createElement('span');
      icon.className = 'sccb-card-title-emojis';
      icon.textContent = data.titleEmojis.join(' ');
      title.append(icon, document.createTextNode(' '));
    }
    title.appendChild(document.createTextNode(data.title));

    const byline = document.createElement('div');
    byline.className = 'sccb-card-author downloadcreator';
    const by = document.createElement('span');
    by.textContent = 'by ';
    byline.appendChild(by);
    if (data.creatorUrl && data.creator) {
      const creator = document.createElement('a');
      creator.href = data.creatorUrl;
      creator.textContent = data.creator;
      byline.appendChild(creator);
    } else {
      byline.appendChild(document.createTextNode(data.creator || 'Unknown creator'));
    }

    const metaRow = document.createElement('div');
    metaRow.className = 'sccb-card-meta-row';
    metaRow.appendChild(byline);
    if (data.dateText) {
      const updatedChip = document.createElement('span');
      updatedChip.className = 'sccb-card-updated-chip';
      updatedChip.textContent = normalizeMtsUpdatedText(data.dateText);
      updatedChip.title = data.dateText;
      metaRow.appendChild(updatedChip);
    }

    const chips = document.createElement('div');
    chips.className = 'sccb-card-chips forumtitles';
    data.categories.slice(-3).forEach(cat => {
      const chip = document.createElement(cat.url ? 'a' : 'span');
      chip.className = 'sccb-card-chip';
      if (cat.url) chip.href = cat.url;
      chip.textContent = cat.text;
      chips.appendChild(chip);
    });

    const stats = document.createElement('div');
    stats.className = 'sccb-card-stats downloadCardFooterIcons';
    data.stats.slice(0, 4).forEach(stat => {
      const item = document.createElement('span');
      item.className = 'sccb-card-stat';
      item.textContent = `${stat.emoji} ${stat.value}`;
      item.title = stat.label;
      stats.appendChild(item);
    });
    if (!data.stats.length) {
      const item = document.createElement('span');
      item.className = 'sccb-card-stat sccb-card-stat-muted';
      item.textContent = 'Sims 3 CC';
      stats.appendChild(item);
    }

    const actions = document.createElement('div');
    actions.className = 'sccb-rendered-card-actions downloadCardFooter';

    // Create the listing action as part of the replacement card itself. Relying
    // only on the later generic wiring pass left a race where MTS replacement
    // cards could be painted before the observer discovered them, so the card
    // appeared without a basket action. Marking the shell as wired here also
    // prevents the generic pass from adding a duplicate button.
    if (canUseBasket()) {
      const modUrl = (getSiteAdapter('mts') || adapter).normalizeDetailUrl(data.url);
      const modId = (getSiteAdapter('mts') || adapter).modIdFromUrl(modUrl);
      const button = makeAddButton({ modUrl, modId, title: data.title, source: 'listing' });
      button.classList.add('sccb-card-button');
      actions.appendChild(button);
      card.setAttribute(WIRED_ATTR, '1');
      card.setAttribute(CARD_ATTR, '1');
      updateButtonState(button, modId);
    }

    body.append(title, metaRow);
    if (data.categories.length) body.appendChild(chips);
    body.append(stats, actions);
    card.append(thumb, body);
    return card;
  }

  function extractMtsCardData(card) {
    const link = (getSiteAdapter('mts') || adapter).findModLink(card) || card.querySelector('a[href*="/d/"], a[href*="download.php?t="]');
    if (!link) return null;
    const url = (getSiteAdapter('mts') || adapter).normalizeDetailUrl(link.href);
    const titleNode = card.querySelector('.downloadtitle, .title, h2, h3') || link;
    const titleEmojis = extractMtsTitleEmojis(titleNode, card);
    const rawTitle = cleanText(titleNode?.textContent || link.textContent || link.title || 'Mod The Sims download');
    const title = cleanMtsRenderedTitle(rawTitle) || 'Mod The Sims download';

    const img = card.querySelector('img.featuredimage:not(.sf-hidden), .thumbnailwrapper img:not(.sf-hidden), img[src]:not(.sf-hidden)');
    const imageUrl = resolveImageUrl(img);

    const creatorLink = card.querySelector('.downloadcreatorname a[href], .downloadcreator a[href*="/m/"], a[href*="/m/"]');
    const creator = cleanText(creatorLink?.textContent || '').replace(/^by\s+/i, '') || '';
    const creatorUrl = creatorLink?.href || '';
    const creatorLine = cleanText(card.querySelector('.downloadcreator')?.textContent || '');
    const dateText = cleanMtsBylineDate(creatorLine, creator);

    const categories = [...card.querySelectorAll('.forumtitles a[href]')]
      .map(a => ({ text: cleanText(a.textContent), url: a.href }))
      .filter(cat => cat.text)
      // The source site is already shown as an overlay badge. Keep actual
      // category chips only, otherwise cards show duplicate "Mod The Sims" chips.
      .filter(cat => !/^mod\s*the\s*sims$/i.test(cat.text))
      .filter(cat => !/^sims\s*[1234]$/i.test(cat.text))
      .filter((cat, index, arr) => arr.findIndex(other => other.text.toLowerCase() === cat.text.toLowerCase()) === index);

    return {
      url,
      title,
      titleEmojis,
      imageUrl,
      creator,
      creatorUrl,
      dateText,
      categories,
      stats: extractMtsCardStats(card),
    };
  }

  function cleanMtsRenderedTitle(text) {
    return cleanText(text || '')
      .replace(/^\s*(featured upload!|picked upload!|favourite[d]?|favorite[d]?|trending|popular|new)\s*/ig, '')
      .replace(/^[★☆⭐🏆🔥💚✨\s]+/u, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanMtsBylineDate(line, creator) {
    let text = cleanText(line || '').replace(/^by\s+/i, '').trim();
    if (creator) text = text.replace(new RegExp(escapeRegExp(creator), 'i'), '').trim();
    return text.replace(/^[-·\s]+/, '').trim();
  }

  function normalizeMtsUpdatedText(text) {
    const clean = cleanText(text || '')
      .replace(/^(updated|uploaded)\s+/i, '')
      .replace(/^at\s+/i, '')
      .trim();
    if (!clean) return 'Updated';
    if (/^(today|yesterday)\b/i.test(clean)) return `Updated ${clean}`;
    return `Updated ${clean}`;
  }

  function resolveImageUrl(img) {
    if (!img) return '';
    const candidates = [
      img.getAttribute('data-src'),
      img.getAttribute('data-original'),
      img.currentSrc,
      img.getAttribute('src'),
      img.src,
      img.getAttribute('data-bg'),
    ];
    const raw = candidates.map(value => cleanText(value || '')).find(value => value && value !== 'data:,' && !/^data:image\/gif/i.test(value));
    if (!raw) return '';
    try { return new URL(raw, location.href).href; } catch { return raw; }
  }

  function extractMtsTitleEmojis(titleNode, card) {
    const tokens = [];
    const add = emoji => { if (emoji && !tokens.includes(emoji)) tokens.push(emoji); };
    const text = cleanText(`${titleNode?.textContent || ''} ${titleNode?.getAttribute?.('title') || ''}`);
    if (/featured/i.test(text)) add('⭐');
    if (/picked|staff pick|picked upload|award|trophy/i.test(text)) add('🏆');
    if (/trend|hot|popular/i.test(text)) add('🔥');
    if (/favour|favor|heart/i.test(text)) add('💚');
    if (/new/i.test(text)) add('✨');

    const iconScope = titleNode || card;
    iconScope?.querySelectorAll?.('i, svg, img[title], .fa, [class*="fa-"]').forEach(el => {
      const hay = `${el.className || ''} ${el.getAttribute('title') || ''} ${el.getAttribute('aria-label') || ''}`;
      add(mtsEmojiForIconText(hay));
    });

    // Some MTS feature markers sit just outside the title. Convert those native
    // icon badges to simple emojis rather than carrying over mismatched FA icons.
    card?.querySelectorAll?.('.downloadtitle i, .downloadtitle img[title], .downloadtitle [class*="fa-"]').forEach(el => {
      const hay = `${el.className || ''} ${el.getAttribute('title') || ''} ${el.getAttribute('aria-label') || ''}`;
      add(mtsEmojiForIconText(hay));
    });
    return tokens.slice(0, 3);
  }

  function mtsEmojiForIconText(text) {
    const hay = String(text || '').toLowerCase();
    if (/trophy|award|picked/.test(hay)) return '🏆';
    if (/star|featured/.test(hay)) return '⭐';
    if (/fire|flame|trend|hot|popular/.test(hay)) return '🔥';
    if (/heart|favour|favor/.test(hay)) return '💚';
    if (/spark|new|plus/.test(hay)) return '✨';
    if (/download/.test(hay)) return '⬇️';
    if (/comment/.test(hay)) return '💬';
    if (/eye|view/.test(hay)) return '👁️';
    return '';
  }

  function extractMtsCardStats(card) {
    const footer = card.querySelector('.downloadCardFooterIcons, .downloadCardFooter, .stats');
    if (!footer) return [];
    const stats = [];
    footer.querySelectorAll('i[title], [class*="fa-"][title]').forEach(icon => {
      const label = cleanText(icon.getAttribute('title') || icon.getAttribute('aria-label') || '');
      if (!label) return;
      const value = cleanText(collectTextUntilNextIcon(icon)).match(/[\d,.]+\s*[kKmM]?/)?.[0] || '';
      if (!value) return;
      stats.push({ label, value, emoji: statEmoji(label) });
    });

    // Saved pages sometimes flatten the icon text. Keep a fallback so cards do
    // not look empty if Font Awesome markup is stripped.
    if (!stats.length) {
      const text = cleanText(footer.textContent || '');
      const nums = text.match(/[\d,.]+\s*[kKmM]?/g) || [];
      const labels = ['Views', 'Favourites', 'Comments', 'Downloads'];
      nums.slice(0, 4).forEach((value, i) => stats.push({ label: labels[i], value, emoji: statEmoji(labels[i]) }));
    }
    return stats.filter((stat, index, arr) => arr.findIndex(other => other.label === stat.label && other.value === stat.value) === index);
  }

  function collectTextUntilNextIcon(icon) {
    let text = '';
    let node = icon.nextSibling;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.matches?.('i, img, svg, [class*="fa-"]')) break;
      text += node.textContent || '';
      node = node.nextSibling;
    }
    return text;
  }

  function statEmoji(label) {
    const text = String(label || '').toLowerCase();
    if (/view|eye/.test(text)) return '👁️';
    if (/favour|favor|heart|like/.test(text)) return '💚';
    if (/comment|reply/.test(text)) return '💬';
    if (/download/.test(text)) return '⬇️';
    return '•';
  }

  function ensureSiteToolbar() {
    const cards = adapter.listingCards(document).slice(0, MAX_AUTO_VISIBLE);
    const isDetail = adapter.isDetailUrl(location.href);
    const existing = document.querySelector('#sccb-site-toolbar');
    if (!cards.length && !isDetail) {
      existing?.remove();
      return;
    }
    let toolbar = existing;
    if (!toolbar) {
      toolbar = document.createElement('section');
      toolbar.id = 'sccb-site-toolbar';
      toolbar.innerHTML = `
        <div class="sccb-site-toolbar-main">
          <span class="sccb-plumbob"></span>
          <span class="sccb-site-toolbar-title">Sims CC tools</span>
          <span class="sccb-site-toolbar-meta"></span>
        </div>
        <div class="sccb-site-toolbar-actions"></div>`;
      const anchor = findSiteToolbarAnchor();
      if (anchor?.parentElement) anchor.parentElement.insertBefore(toolbar, anchor);
      else document.body.prepend(toolbar);

      const actions = toolbar.querySelector('.sccb-site-toolbar-actions');

      const openBasket = document.createElement('button');
      openBasket.type = 'button';
      openBasket.className = 'sccb-site-toolbar-btn';
      openBasket.textContent = 'Open basket';
      openBasket.addEventListener('click', showPanel);
      actions.appendChild(openBasket);

      const settings = document.createElement('button');
      settings.type = 'button';
      settings.className = 'sccb-site-toolbar-btn';
      settings.textContent = 'Settings';
      settings.addEventListener('click', showSettings);
      actions.appendChild(settings);

      const grid = document.createElement('button');
      grid.type = 'button';
      grid.className = 'sccb-site-toolbar-btn sccb-grid-toggle';
      grid.addEventListener('click', cycleGridDensity);
      actions.appendChild(grid);

      const debug = document.createElement('button');
      debug.type = 'button';
      debug.className = 'sccb-site-toolbar-btn sccb-debug-toggle';
      debug.addEventListener('click', toggleDebugUi);
      actions.appendChild(debug);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'sccb-site-toolbar-btn sccb-site-theme-toggle';
      toggle.addEventListener('click', toggleSiteUi);
      actions.appendChild(toggle);
    }
    updateSiteToolbar(toolbar, cards.length, isDetail);
  }

  function findSiteToolbarAnchor() {
    if (adapter.id === 'mts') {
      return document.querySelector('.maincontentwrapper, #newestDownloads, #content, #main, main, .span12') || document.body.firstElementChild;
    }
    if (adapter.id === 'simblr') {
      const cardSection = [...document.querySelectorAll('main, section, .container, .container-fluid')]
        .find(el => el.querySelector('.smol-card-component, .grid-card, article.card, .card'));
      return cardSection || document.querySelector('main, .container, .container-fluid, .display-5, .display-6, h1') || document.body.firstElementChild;
    }
    if (adapter.id === 'tsr') {
      return document.querySelector('.main-content-wrapper, .browse-page, .detail-page, #browse-files, .details-wrapper') || document.body.firstElementChild;
    }
    return document.querySelector('main, #content, #main, .container, .container-fluid, .row-fluid, h1, .display-5, .display-6') || document.body.firstElementChild;
  }

  function updateSiteToolbar(toolbar = document.querySelector('#sccb-site-toolbar'), cardCount = adapter.listingCards(document).length, isDetail = adapter.isDetailUrl(location.href)) {
    if (!toolbar) return;
    const files = getAllFiles();
    const selected = files.filter(file => file.selected !== false).length;
    toolbar.querySelector('.sccb-site-toolbar-meta').textContent = `${adapter.name} · ${cardCount ? `${Math.min(cardCount, MAX_AUTO_VISIBLE)} items on page` : 'detail page'} · ${selected}/${files.length} selected`;
    toolbar.querySelectorAll('.sccb-site-add-visible, #sccb-add-visible').forEach(el => el.remove());
    const settings = getSettings();
    const grid = toolbar.querySelector('.sccb-grid-toggle');
    if (grid) grid.textContent = `Grid: ${gridDensityLabel(settings.gridDensity)}`;
    const debug = toolbar.querySelector('.sccb-debug-toggle');
    if (debug) debug.textContent = settings.debugUi ? 'Debug on' : 'Debug UI';
    const toggle = toolbar.querySelector('.sccb-site-theme-toggle');
    if (toggle) toggle.textContent = settings.siteUi ? 'Site theme on' : 'Site theme off';
  }

  function gridDensityLabel(value) {
    return ({ compact: 'Compact', comfortable: 'Comfortable', roomy: 'Roomy', gallery: 'Gallery', custom: 'Custom' }[String(value || '')] || 'Comfortable');
  }

  function gridDensityPreset(value, customMin = 220) {
    const custom = Math.max(150, Math.min(380, Number(customMin) || 220));
    const presets = {
      compact: { min: 170, mobileMin: 156, gap: '10px', image: '4 / 3' },
      comfortable: { min: 220, mobileMin: 180, gap: '14px', image: '4 / 3' },
      roomy: { min: 260, mobileMin: 210, gap: '18px', image: '4 / 3' },
      gallery: { min: 310, mobileMin: 240, gap: '22px', image: '1 / 1' },
      custom: { min: custom, mobileMin: Math.max(156, Math.min(240, custom - 40)), gap: '16px', image: '4 / 3' },
    };
    return presets[String(value || 'comfortable')] || presets.comfortable;
  }

  function applyGridSettings(settings = getSettings()) {
    const density = String(settings.gridDensity || 'comfortable');
    const preset = gridDensityPreset(density, settings.gridCardMin);
    const root = document.documentElement;
    root.dataset.sccbGrid = density;
    root.style.setProperty('--sccb-card-min', `${preset.min}px`, 'important');
    root.style.setProperty('--sccb-card-min-mobile', `${preset.mobileMin}px`, 'important');
    root.style.setProperty('--sccb-card-gap', preset.gap, 'important');
    root.style.setProperty('--sccb-card-image-ratio', preset.image, 'important');
  }

  function cycleGridDensity() {
    const settings = getSettings();
    const order = ['compact', 'comfortable', 'roomy', 'gallery'];
    const current = order.includes(settings.gridDensity) ? settings.gridDensity : 'comfortable';
    const nextDensity = order[(order.indexOf(current) + 1) % order.length];
    const next = { ...settings, gridDensity: nextDensity };
    saveSettings(next);
    applyGridSettings(next);
    updateSiteToolbar();
    toast(`Grid density: ${gridDensityLabel(nextDensity)}.`);
  }

  function toggleSiteUi() {
    const settings = getSettings();
    const next = { ...settings, siteUi: !settings.siteUi };
    saveSettings(next);
    applyRuntimeModeDatasets(next);
    updateSiteToolbar();
    toast(next.siteUi ? 'Site UI restyle enabled.' : 'Site UI restyle disabled.');
    if (next.siteUi) debounceWire('site-ui-on');
  }

  function toggleDebugUi() {
    const settings = getSettings();
    const next = { ...settings, debugUi: !settings.debugUi };
    saveSettings(next);
    applyRuntimeModeDatasets(next);
    updateSiteToolbar();
    toast(next.debugUi ? 'Debug UI enabled.' : 'Debug UI disabled.');
  }

  function removeAddVisibleControls() {
    document.querySelectorAll('#sccb-add-visible, .sccb-site-add-visible').forEach(el => el.remove());
  }

  function ensureAddVisibleButton() {
    removeAddVisibleControls();
  }

  function makeAddButton(info) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sccb-add';
    button.textContent = '+ Basket';
    button.dataset.modUrl = info.modUrl;
    button.dataset.modId = info.modId;
    button.dataset.modTitle = info.title || '';
    button.dataset.site = getAdapter(info.modUrl)?.id || adapter.id;
    button.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      await addSingleMod(info, button);
    });
    return button;
  }

  async function addSingleMod(info, button) {
    const originalLabel = button?.textContent || '+ Basket';
    setButtonState(button, 'loading', 'Checking…');
    try {
      const result = await getModDownloadInfo(info.modUrl, { titleHint: info.title });
      if (!result.files.length) {
        const reason = result.error || 'No downloadable file links were found.';
        toast(`${reason} Open the mod page and try again.`, true);
        setButtonState(button, 'error', 'Open page');
        return;
      }

      const basket = loadBasket();
      const analyzed = analyzeIncomingFiles(result.files, basket);
      const exactDuplicates = analyzed.filter(file => file.exactDuplicate).length;
      const reviewable = analyzed.filter(file => !file.exactDuplicate);
      if (!reviewable.length) {
        toast(`Already in basket: ${result.title}`);
        setButtonState(button, 'added', 'Already added');
        return;
      }

      const hasLikelyDuplicates = reviewable.some(file => file.duplicateScore >= LIKELY_DUPLICATE_SCORE);
      let filesToAdd = reviewable;
      if (result.files.length > 1 || hasLikelyDuplicates) {
        setButtonState(button, hasLikelyDuplicates ? 'choice' : 'choice', hasLikelyDuplicates ? 'Review dupes' : 'Choose files');
        filesToAdd = await chooseFilesForMods([{ ...result, files: reviewable, already: exactDuplicates }], { single: result.files.length > 1 });
        if (!filesToAdd.length) {
          setButtonState(button, '', originalLabel);
          return;
        }
      }

      const summary = addFilesToBasket(result, filesToAdd);
      toast(formatAddSummary(summary, exactDuplicates));
      updateEveryButtonState();
    } catch (error) {
      console.error(`[${APP}]`, error);
      toast(`Could not add mod: ${error.message || error}`, true);
      setButtonState(button, 'error', 'Retry');
    } finally {
      if (button && button.dataset.sccbState === 'loading') setButtonState(button, '', originalLabel);
    }
  }

  // Batch add-visible controls were intentionally removed; keep per-card basket actions only.

  async function getModDownloadInfo(modUrl, options = {}) {
    const absoluteUrl = (getAdapter(modUrl) || adapter).normalizeDetailUrl(modUrl);
    const siteAdapter = getAdapter(absoluteUrl) || adapter;
    const modId = siteAdapter.modIdFromUrl(absoluteUrl);
    const site = siteAdapter.id;
    const cacheKey = `${site}:${modId}`;
    const settings = getSettings();
    const cacheTtl = Number(settings.cacheTtlMs) || DEFAULT_CACHE_TTL_MS;

    if (!options.force) {
      const memory = getCache(cacheKey);
      if (memory) {
        const cached = normalizeCachedResult(memory);
        const age = Date.now() - (memory.fetchedAt || 0);
        if (age < cacheTtl) return cached;
        refreshModCacheSoon(absoluteUrl, { ...options, force: true });
        return cached;
      }
      if (modInfoInflight.has(cacheKey)) return modInfoInflight.get(cacheKey);
    }

    const promise = (async () => {
      const html = samePage(absoluteUrl) ? document.documentElement.outerHTML : await requestText(absoluteUrl);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const title = siteAdapter.extractTitle(doc, absoluteUrl) || options.titleHint || 'Download';
      const creator = siteAdapter.extractCreator(doc);
      const descriptionInfo = extractModDescription(siteAdapter, doc, absoluteUrl, { title, creator });
      const error = siteAdapter.detectError(doc);
      const rawFiles = layeredParseFiles(siteAdapter, doc, absoluteUrl);
      let files = rawFiles.map(file => normalizeFile({
        ...file,
        site,
        siteName: siteAdapter.name,
        modId,
        modTitle: title,
        modUrl: absoluteUrl,
        creator,
      })).filter(file => file.fileId && file.url);

      if (settings.resolveFinalUrls && (!isMobileViewport() || settings.resolveOnMobile)) {
        files = await mapWithConcurrency(files, Math.min(getFetchConcurrency(settings), 2), async file => {
          try { return await resolveNetworkMetaForFile(file, { silent: true }); }
          catch { return file; }
        });
      }

      const result = {
        version: 2,
        site,
        siteName: siteAdapter.name,
        modId,
        title,
        modTitle: title,
        modUrl: absoluteUrl,
        creator,
        descriptionText: descriptionInfo.text,
        descriptionPreview: descriptionInfo.preview,
        descriptionSource: descriptionInfo.source,
        descriptionFetchedAt: Date.now(),
        info: descriptionInfo.info,
        files,
        error,
        fetchedAt: Date.now(),
      };
      setCache(cacheKey, result);
      return result;
    })();

    if (!options.force) modInfoInflight.set(cacheKey, promise);
    try { return await promise; }
    finally { if (!options.force) modInfoInflight.delete(cacheKey); }
  }

  function refreshModCacheSoon(modUrl, options = {}) {
    setTimeout(() => {
      getModDownloadInfo(modUrl, { ...options, force: true }).catch(error => {
        console.debug?.(`[${APP}] stale cache refresh failed`, error);
      });
    }, 25);
  }

  function layeredParseFiles(siteAdapter, doc, pageUrl) {
    const found = [];
    found.push(...siteAdapter.parseFiles(doc, pageUrl));
    found.push(...parseDirectKnownDownloadLinks(siteAdapter, doc, pageUrl));
    return dedupeFiles(found, siteAdapter.id);
  }

  function extractModDescription(siteAdapter, doc, pageUrl, context = {}) {
    const site = siteAdapter?.id || adapter?.id || 'unknown';
    const metaDescription = cleanText(
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      ''
    );

    const selectorMap = {
      mts: [
        '#actualcontent1', '#descriptionbox .message-body', '#descriptionbox',
        '.download-description', '.postbody', '.maincontentinner .message-body'
      ],
      simblr: [
        '#description', '#descriptionTab', '.tab-description', '.larger-text',
        '.sccb-simblr-description-copy', '.card-body', 'article', 'main .container'
      ],
      tsr: [
        '.sccb-tsr-description-copy', '.details-description', '.details-left-wrapper',
        '.item-description', '#description', '.description', '.tab-content', '.md-content'
      ]
    };

    const candidates = [];
    for (const selector of selectorMap[site] || []) {
      doc.querySelectorAll(selector).forEach(node => {
        if (!node || node.closest?.('script, style, nav, footer, .sccb-panel, .sccb-file-modal')) return;
        const text = cleanDescriptionText(node.textContent || '', context);
        if (text) candidates.push({ source: selector, text });
      });
    }

    if (site === 'tsr') {
      const item = parseTsrItemData(
        doc.querySelector('.details-right-wrapper .item-wrapper[data-item]') ||
        doc.querySelector('.detail-page .item-wrapper[data-item]') ||
        doc.querySelector('.item-wrapper[data-item]')
      );
      const itemDescription = cleanDescriptionText(item.description || item.Description || item.summary || '', context);
      if (itemDescription) candidates.unshift({ source: 'data-item.description', text: itemDescription });
    }

    if (site === 'simblr') {
      const simblrText = cleanDescriptionText(doc.querySelector('.sccb-simblr-description-copy')?.textContent || '', context);
      if (simblrText) candidates.unshift({ source: 'simblr.description', text: simblrText });
    }

    if (metaDescription) candidates.push({ source: 'meta.description', text: cleanDescriptionText(metaDescription, context) });

    const best = candidates
      .filter(item => item.text && item.text.length >= 20)
      .sort((a, b) => descriptionScore(b.text, b.source) - descriptionScore(a.text, a.source))[0] ||
      candidates.find(item => item.text) || { source: '', text: '' };

    const text = capStoredDescription(best.text || '');
    return {
      text,
      preview: makeDescriptionPreview(text),
      source: best.source || '',
      info: {
        title: context.title || '',
        creator: context.creator || '',
        pageUrl,
        capturedAt: Date.now(),
      },
    };
  }

  function cleanDescriptionText(value, context = {}) {
    let text = String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (!text) return '';
    const blocked = [
      /^download\s*$/i, /^description\s*$/i, /^notes\s*$/i, /^recommended\s*$/i,
      /^comments\s*$/i, /^add to basket/i, /^download selected/i
    ];
    if (blocked.some(rx => rx.test(text))) return '';
    const title = cleanText(context.title || '');
    if (title && text.length < title.length + 12 && text.includes(title)) return '';
    text = text
      .split('\n')
      .map(line => cleanText(line))
      .filter(line => line && !/^\s*(download|notes|recommended|comments|advertisement|sponsored)\s*$/i.test(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return text;
  }

  function descriptionScore(text, source = '') {
    const length = Math.min(cleanText(text).length, 5000);
    let score = length;
    if (/description|actualcontent1|details-left|larger-text|data-item/i.test(source)) score += 1800;
    if (/meta/i.test(source)) score -= 700;
    if (/download|button|nav|footer|comments/i.test(text)) score -= 400;
    return score;
  }

  function capStoredDescription(text) {
    const clean = cleanDescriptionText(text);
    if (clean.length <= 14000) return clean;
    return `${clean.slice(0, 14000).trim()}\n\n…`;
  }

  function makeDescriptionPreview(text) {
    const clean = cleanText(text);
    if (!clean) return '';
    return clean.length > 220 ? `${clean.slice(0, 220).trim()}…` : clean;
  }

  function parseMtsFiles(doc, pageUrl) {
    const scopes = [
      doc.querySelector('#scroll_files'),
      doc.querySelector('#actualcontent3'),
      doc,
    ].filter(Boolean);
    const anchors = uniqueElements(scopes.flatMap(scope => [
      ...scope.querySelectorAll('a.downloadlink[href*="getfile.php?file="], a[href*="getfile.php?file="]')
    ]));
    const byId = new Map();

    for (const anchor of anchors) {
      const url = safeAbsUrl(anchor.getAttribute('href'), pageUrl);
      if (!url) continue;
      const parsed = new URL(url);
      const fileId = parsed.searchParams.get('file');
      if (!fileId) continue;

      const row = anchor.closest('tr, li, p, div') || anchor.parentElement || anchor;
      const rowText = cleanText(row.textContent);
      const current = byId.get(fileId) || {
        fileId,
        url,
        fileName: '',
        size: '',
        type: '',
        role: '',
      };

      const anchorText = cleanText(anchor.textContent);
      if (isUsefulFileName(anchorText) && !current.fileName) current.fileName = anchorText;
      if (!current.size) current.size = extractSize(rowText);
      if (!current.type) current.type = extractTypeFromRow(rowText) || extensionOf(current.fileName);
      current.url = preferUrl(current.url, url);
      byId.set(fileId, current);
    }

    return [...byId.values()].map(file => ({
      ...file,
      fileName: file.fileName || `MTS file ${file.fileId}`,
      type: file.type || extensionOf(file.fileName),
    }));
  }

  function parseSimblrFiles(doc, pageUrl) {
    const anchors = [...doc.querySelectorAll('a.downloadlink[href*="/download/"], a[href*="/download/"]')];
    const byId = new Map();
    for (const anchor of anchors) {
      const url = safeAbsUrl(anchor.getAttribute('href'), pageUrl);
      if (!url) continue;
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/download\/(\d+)/i);
      if (!match) continue;
      const fileId = match[1];
      const dataFileInfo = anchor.getAttribute('data-fileinfo') || '';
      const dataName = cleanText(dataFileInfo.split('|').slice(1).join('|'));
      const anchorText = cleanText(anchor.textContent);
      const row = anchor.closest('tr, li, p, div') || anchor.parentElement || anchor;
      const rowText = cleanText(row.textContent);
      const current = byId.get(fileId) || {
        fileId,
        url,
        fileName: '',
        size: '',
        type: '',
        role: '',
      };
      if (isUsefulFileName(dataName) && !current.fileName) current.fileName = dataName;
      if (isUsefulFileName(anchorText) && !current.fileName) current.fileName = anchorText;
      if (!current.size) current.size = extractSize(rowText);
      if (!current.type) current.type = extensionOf(current.fileName);
      byId.set(fileId, current);
    }

    return [...byId.values()].map(file => ({
      ...file,
      fileName: file.fileName || `Simblr download ${file.fileId}`,
      type: file.type || extensionOf(file.fileName),
    }));
  }

  function parseTsrFiles(doc, pageUrl) {
    const item = parseTsrItemData(
      doc.querySelector('.details-right-wrapper .item-wrapper[data-item]') ||
      doc.querySelector('.detail-page .item-wrapper[data-item]') ||
      doc.querySelector('.item-wrapper[data-item]')
    );
    const id = cleanText(item.ID || item.ItemID || (() => {
      try {
        const parsed = new URL(pageUrl, location.href);
        return parsed.pathname.match(/\/id\/(\d+)/)?.[1] || parsed.pathname.match(/\/downloads\/(\d+)/)?.[1] || '';
      } catch { return ''; }
    })());
    if (!id) return [];

    const title = cleanText(item.title || doc.querySelector('h1, .browse-info-title-info')?.textContent || `TSR download ${id}`);
    const size = cleanText(item.FileSize_nice || extractSize(doc.body?.textContent || ''));
    const sizeBytes = Number(item.FileSize) || parseSizeBytes(size);
    const downloadLink = doc.querySelector(`a[href*="/downloads/${id}"]`)?.getAttribute('href') || `/downloads/${id}`;
    const url = safeAbsUrl(downloadLink, pageUrl) || safeAbsUrl(`/downloads/${id}`, pageUrl);
    return [{
      fileId: id,
      url,
      fileName: title ? `${title} - The Sims Resource` : `The Sims Resource download ${id}`,
      size,
      sizeBytes,
      type: 'tsr',
      role: 'main',
    }];
  }

  function parseTsrItemData(node) {
    if (!node) return {};
    const raw = node.getAttribute('data-item') || node.dataset?.item || '';
    if (!raw) return {};
    try { return JSON.parse(raw); }
    catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = raw;
        return JSON.parse(textarea.value);
      } catch { return {}; }
    }
  }

  function parseDirectKnownDownloadLinks(siteAdapter, doc, pageUrl) {
    if (siteAdapter.id === 'mts') return [];
    if (siteAdapter.id === 'simblr') return [];
    return [];
  }

  function dedupeFiles(files, site) {
    const byKey = new Map();
    for (const file of files) {
      const key = `${site}:${file.fileId || stableHash(file.url)}`;
      const current = byKey.get(key) || {};
      byKey.set(key, { ...current, ...file, fileName: current.fileName || file.fileName, size: current.size || file.size });
    }
    return [...byKey.values()];
  }

  function normalizeFile(file) {
    const site = String(file.site || 'unknown');
    const modId = String(file.modId || 'unknown');
    const fileId = String(file.fileId || stableHash(file.url));
    const fileName = cleanText(file.fileName) || `${file.siteName || site} file ${fileId}`;
    const key = file.key || `${site}:${modId}:${fileId}`;
    const type = cleanText(file.type || extensionOf(fileName)).toLowerCase();
    const size = cleanText(file.size);
    const sizeBytes = Number(file.sizeBytes) || parseSizeBytes(size);
    const normalized = {
      key,
      site,
      siteName: file.siteName || site,
      modId,
      modTitle: cleanText(file.modTitle) || cleanText(file.title) || 'Download',
      modUrl: file.modUrl || file.url || '',
      creator: cleanText(file.creator),
      modDescriptionText: capStoredDescription(file.modDescriptionText || file.descriptionText || file.description || ''),
      modDescriptionPreview: file.modDescriptionPreview || file.descriptionPreview || makeDescriptionPreview(file.modDescriptionText || file.descriptionText || file.description || ''),
      descriptionSource: cleanText(file.descriptionSource),
      descriptionFetchedAt: Number(file.descriptionFetchedAt) || 0,
      info: file.info && typeof file.info === 'object' ? file.info : {},
      fileId,
      fileName,
      url: file.url,
      size,
      sizeBytes,
      type,
      role: file.role || inferFileRole(fileName, file.role),
      selected: file.selected !== false,
      addedAt: Number(file.addedAt) || Date.now(),
      updatedAt: Number(file.updatedAt) || Date.now(),
      networkMeta: file.networkMeta && typeof file.networkMeta === 'object' ? file.networkMeta : {},
      contentSha256: cleanText(file.contentSha256 || file.fingerprints?.contentSha256),
    };
    normalized.fingerprints = makeFingerprints(normalized, file.fingerprints || {});
    return normalized;
  }

  function makeFingerprints(file, existing = {}) {
    const fileName = cleanText(file.fileName);
    const filenameNorm = existing.filenameNorm || normalizeFileNameForDuplicate(fileName);
    const filenameExact = existing.filenameExact || fileName.toLowerCase();
    const sizeBytes = Number(file.sizeBytes) || 0;
    const contentSha256 = cleanText(file.contentSha256 || existing.contentSha256 || '');
    const finalUrl = file.networkMeta?.finalUrl || existing.finalUrl || '';
    const finalCanonical = finalUrl ? canonicalizeGenericUrl(finalUrl) : '';
    const etag = cleanText(file.networkMeta?.etag || existing.etag || '');
    const dispositionName = cleanText(file.networkMeta?.contentDispositionName || existing.contentDispositionName || '');
    const dispositionNorm = dispositionName ? normalizeFileNameForDuplicate(dispositionName) : '';
    const canonicalUrl = canonicalizeDownloadUrl(file.url, file.site);
    const titleKey = existing.titleKey || normalizeTitleKey(file.modTitle);
    const creatorKey = existing.creatorKey || normalizeCreatorKey(file.creator);
    return {
      siteKey: file.key,
      canonicalUrl,
      finalUrl: finalCanonical,
      filenameExact,
      filenameNorm,
      contentDispositionName: dispositionName,
      contentDispositionNorm: dispositionNorm,
      sizeBytes,
      weakKey: filenameNorm && sizeBytes ? `${filenameNorm}:${sizeBytes}` : '',
      dispositionWeakKey: dispositionNorm && sizeBytes ? `${dispositionNorm}:${sizeBytes}` : '',
      titleKey,
      creatorKey,
      contentSha256,
      etag,
      lastModified: cleanText(file.networkMeta?.lastModified || existing.lastModified || ''),
    };
  }

  function refreshFileFingerprints(file) {
    const normalized = normalizeFile(file);
    Object.assign(file, normalized);
    return file;
  }

  function loadBasket() {
    const empty = { version: VERSION, updatedAt: Date.now(), mods: {}, choices: {} };
    try {
      const raw = gmGet(STORAGE_KEY, '');
      if (!raw) return empty;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return normalizeBasket(parsed);
    } catch (error) {
      console.warn(`[${APP}] Could not load basket`, error);
      return empty;
    }
  }

  function normalizeBasket(value) {
    const basket = {
      version: VERSION,
      updatedAt: Number(value?.updatedAt) || Date.now(),
      mods: {},
      choices: value?.choices && typeof value.choices === 'object' ? value.choices : {},
      sessions: Array.isArray(value?.sessions) && value.sessions.length ? unique(value.sessions.map(cleanText).filter(Boolean)) : ['Default'],
    };

    if (Array.isArray(value)) {
      for (const old of value) {
        const inferred = normalizeFile({
          site: old.site || 'mts',
          siteName: old.siteName || 'Mod The Sims',
          modId: old.modId || extractMtsModId(old.modUrl) || stableHash(old.modUrl || old.url),
          modTitle: old.modTitle || old.title,
          modUrl: old.modUrl,
          creator: old.creator,
          fileId: old.id || extractKnownFileId(old.url) || stableHash(old.url),
          fileName: old.fileName,
          url: old.url,
          size: old.size,
          type: old.type,
        });
        addNormalizedFileToBasketObject(basket, inferred, true);
      }
      basket.duplicateIndex = buildSerializableDuplicateIndex(basket);
      return basket;
    }

    for (const [modKey, mod] of Object.entries(value?.mods || {})) {
      if (!mod || typeof mod !== 'object') continue;
      const normalizedMod = {
        key: mod.key || modKey,
        site: mod.site || 'unknown',
        siteName: mod.siteName || mod.site || 'Site',
        modId: String(mod.modId || modKey.split(':').pop()),
        title: cleanText(mod.title || mod.modTitle) || 'Download',
        url: mod.url || mod.modUrl || '',
        creator: cleanText(mod.creator),
        descriptionText: capStoredDescription(mod.descriptionText || mod.description || mod.summary || ''),
        descriptionPreview: mod.descriptionPreview || makeDescriptionPreview(mod.descriptionText || mod.description || mod.summary || ''),
        descriptionSource: cleanText(mod.descriptionSource),
        descriptionFetchedAt: Number(mod.descriptionFetchedAt) || 0,
        info: mod.info && typeof mod.info === 'object' ? mod.info : {},
        addedAt: Number(mod.addedAt) || Date.now(),
        updatedAt: Number(mod.updatedAt) || Date.now(),
        files: {},
      };
      for (const [fileKey, file] of Object.entries(mod.files || {})) {
        const normalized = {
          ...file,
          key: file.key || fileKey,
          site: file.site || normalizedMod.site,
          siteName: file.siteName || normalizedMod.siteName,
          modId: String(file.modId || normalizedMod.modId),
          modTitle: cleanText(file.modTitle || normalizedMod.title),
          modUrl: file.modUrl || normalizedMod.url,
          creator: cleanText(file.creator || normalizedMod.creator),
          modDescriptionText: capStoredDescription(file.modDescriptionText || file.descriptionText || normalizedMod.descriptionText || ''),
          modDescriptionPreview: file.modDescriptionPreview || makeDescriptionPreview(file.modDescriptionText || file.descriptionText || normalizedMod.descriptionText || ''),
          fileId: String(file.fileId || fileKey.split(':').pop()),
          fileName: cleanText(file.fileName) || `File ${file.fileId || ''}`,
          url: file.url,
          size: cleanText(file.size),
          sizeBytes: Number(file.sizeBytes) || parseSizeBytes(file.size),
          type: cleanText(file.type || extensionOf(file.fileName)).toLowerCase(),
          role: file.role || inferFileRole(file.fileName),
          selected: file.selected !== false,
          networkMeta: file.networkMeta || {},
          contentSha256: file.contentSha256 || file.fingerprints?.contentSha256 || '',
          addedAt: Number(file.addedAt) || Date.now(),
          updatedAt: Number(file.updatedAt) || Date.now(),
          session: cleanText(file.session) || 'Default',
          note: cleanText(file.note),
          tags: Array.isArray(file.tags) ? file.tags.map(cleanText).filter(Boolean) : cleanText(file.tags).split(',').map(cleanText).filter(Boolean),
          downloadStatus: cleanText(file.downloadStatus),
          lastTriedAt: Number(file.lastTriedAt) || 0,
        };
        normalizedMod.files[normalized.key] = normalizeFile(normalized);
      }
      if (Object.keys(normalizedMod.files).length) basket.mods[normalizedMod.key] = normalizedMod;
    }
    basket.duplicateIndex = buildSerializableDuplicateIndex(basket);
    return basket;
  }

  function saveBasket(basket, options = {}) {
    basket.version = VERSION;
    basket.updatedAt = Date.now();
    basket.duplicateIndex = buildSerializableDuplicateIndex(basket);
    delete basket._index;
    const persist = () => {
      const pending = state.pendingBasket || basket;
      state.pendingBasket = null;
      pending.version = VERSION;
      pending.updatedAt = Date.now();
      pending.duplicateIndex = buildSerializableDuplicateIndex(pending);
      delete pending._index;
      gmSet(STORAGE_KEY, JSON.stringify(pending));
    };
    if (options.immediate) {
      clearTimeout(state.saveTimer);
      state.saveTimer = 0;
      state.pendingBasket = null;
      persist();
    } else {
      state.pendingBasket = basket;
      clearTimeout(state.saveTimer);
      state.saveTimer = setTimeout(persist, 220);
    }
    updateFabCount();
    runMobileModeAuditFixes();
  }

  function mergeModInfoIntoBasketMod(mod, modInfo = {}) {
    const description = capStoredDescription(modInfo.descriptionText || modInfo.description || '');
    if (description && (!mod.descriptionText || description.length >= mod.descriptionText.length)) {
      mod.descriptionText = description;
      mod.descriptionPreview = modInfo.descriptionPreview || makeDescriptionPreview(description);
      mod.descriptionSource = cleanText(modInfo.descriptionSource);
      mod.descriptionFetchedAt = Number(modInfo.descriptionFetchedAt) || Date.now();
    }
    if (modInfo.info && typeof modInfo.info === 'object') mod.info = { ...(mod.info || {}), ...modInfo.info };
    if (modInfo.creator && !mod.creator) mod.creator = cleanText(modInfo.creator);
    if ((modInfo.title || modInfo.modTitle) && (!mod.title || mod.title === 'Download')) mod.title = cleanText(modInfo.title || modInfo.modTitle);
    if (modInfo.modUrl && !mod.url) mod.url = modInfo.modUrl;
    return mod;
  }

  function addNormalizedFileToBasketObject(basket, file, preserveSelection = false) {
    const modKey = `${file.site}:${file.modId}`;
    if (!basket.mods[modKey]) {
      basket.mods[modKey] = {
        key: modKey,
        site: file.site,
        siteName: file.siteName,
        modId: file.modId,
        title: file.modTitle,
        url: file.modUrl,
        creator: file.creator || '',
        descriptionText: capStoredDescription(file.modDescriptionText || file.descriptionText || file.description || ''),
        descriptionPreview: file.modDescriptionPreview || makeDescriptionPreview(file.modDescriptionText || file.descriptionText || file.description || ''),
        descriptionSource: cleanText(file.descriptionSource),
        descriptionFetchedAt: Number(file.descriptionFetchedAt) || 0,
        info: file.info && typeof file.info === 'object' ? file.info : {},
        addedAt: file.addedAt || Date.now(),
        updatedAt: file.updatedAt || Date.now(),
        files: {},
      };
    }
    basket.mods[modKey].files[file.key] = preserveSelection ? { ...file, session: file.session || 'Default' } : { ...file, selected: true, session: file.session || getSettings().activeBasketSession || 'Default' };
    if (!basket.sessions) basket.sessions = ['Default'];
    const session = basket.mods[modKey].files[file.key].session || 'Default';
    if (!basket.sessions.includes(session)) basket.sessions.push(session);
  }

  function pickModInfo(modInfo) {
    return {
      site: modInfo.site,
      siteName: modInfo.siteName,
      modId: modInfo.modId,
      modTitle: modInfo.title || modInfo.modTitle,
      modUrl: modInfo.modUrl,
      creator: modInfo.creator,
      modDescriptionText: modInfo.descriptionText || modInfo.description || '',
      modDescriptionPreview: modInfo.descriptionPreview || makeDescriptionPreview(modInfo.descriptionText || modInfo.description || ''),
      descriptionText: modInfo.descriptionText || modInfo.description || '',
      descriptionPreview: modInfo.descriptionPreview || makeDescriptionPreview(modInfo.descriptionText || modInfo.description || ''),
      descriptionSource: modInfo.descriptionSource || '',
      descriptionFetchedAt: modInfo.descriptionFetchedAt || 0,
      info: modInfo.info || {},
    };
  }

  function fileInBasket(basket, keyOrFile) {
    const key = typeof keyOrFile === 'string' ? keyOrFile : keyOrFile?.key;
    if (!key) return false;
    return ensureBasketIndex(basket).fileKeys.has(key);
  }

  function getAllFiles(basket = loadBasket()) {
    return Object.values(basket.mods || {}).flatMap(mod => Object.values(mod.files || {}));
  }

  function getSelectedFiles(basket = loadBasket()) {
    return getAllFiles(basket).filter(file => file.selected !== false);
  }

  function ensureBasketIndex(basket) {
    if (!basket._index) basket._index = buildBasketIndex(basket);
    return basket._index;
  }

  function buildBasketIndex(basket) {
    const index = {
      fileKeys: new Set(),
      byWeakKey: new Map(),
      byFilenameNorm: new Map(),
      byFilenameExact: new Map(),
      bySha256: new Map(),
      byFinalUrl: new Map(),
      byCanonicalUrl: new Map(),
      byEtag: new Map(),
      byTitleKey: new Map(),
    };
    for (const file of getAllFilesFromBasketObject(basket)) {
      refreshFileFingerprints(file);
      index.fileKeys.add(file.key);
      const fp = file.fingerprints || {};
      addIndexValue(index.byWeakKey, fp.weakKey, file.key);
      addIndexValue(index.byWeakKey, fp.dispositionWeakKey, file.key);
      addIndexValue(index.byFilenameNorm, fp.filenameNorm, file.key);
      addIndexValue(index.byFilenameNorm, fp.contentDispositionNorm, file.key);
      addIndexValue(index.byFilenameExact, fp.filenameExact, file.key);
      addIndexValue(index.bySha256, fp.contentSha256, file.key);
      addIndexValue(index.byFinalUrl, fp.finalUrl, file.key);
      addIndexValue(index.byCanonicalUrl, fp.canonicalUrl, file.key);
      addIndexValue(index.byEtag, fp.etag, file.key);
      addIndexValue(index.byTitleKey, fp.titleKey, file.key);
    }
    index.fileByKey = new Map(getAllFilesFromBasketObject(basket).map(file => [file.key, file]));
    return index;
  }

  function buildSerializableDuplicateIndex(basket) {
    const index = buildBasketIndex({ ...basket, _index: null });
    const serialize = map => Object.fromEntries([...map.entries()].filter(([, keys]) => keys.size > 1).map(([key, keys]) => [key, [...keys]]));
    return {
      generatedAt: Date.now(),
      byWeakKey: serialize(index.byWeakKey),
      byFilenameNorm: serialize(index.byFilenameNorm),
      bySha256: serialize(index.bySha256),
      byFinalUrl: serialize(index.byFinalUrl),
      byCanonicalUrl: serialize(index.byCanonicalUrl),
    };
  }

  function addIndexValue(map, key, fileKey) {
    if (!key) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(fileKey);
  }

  function getAllFilesFromBasketObject(basket) {
    return Object.values(basket.mods || {}).flatMap(mod => Object.values(mod.files || {}));
  }

  function analyzeIncomingFiles(files, basket = loadBasket(), settings = getSettings()) {
    const index = ensureBasketIndex(basket);
    return files.map(file => {
      const normalized = normalizeFile(file);
      const exact = index.fileKeys.has(normalized.key);
      const duplicates = exact ? [] : findDuplicateCandidates(normalized, basket, settings);
      const best = duplicates[0] || null;
      return {
        ...normalized,
        exactDuplicate: exact,
        duplicateCandidates: duplicates,
        duplicateScore: best?.score || 0,
        duplicateReason: best?.reason || '',
        duplicateDefaultSkip: Boolean(best && settings.autoSkipHighConfidence && best.score >= HIGH_DUPLICATE_SCORE),
      };
    });
  }

  function findDuplicateCandidates(file, basket = loadBasket(), settings = getSettings()) {
    if (!settings.warnCrossSiteDuplicates) return [];
    const index = ensureBasketIndex(basket);
    const candidateKeys = new Set();
    const fp = file.fingerprints || makeFingerprints(file);
    collectIndexMatches(candidateKeys, index.bySha256, fp.contentSha256);
    collectIndexMatches(candidateKeys, index.byFinalUrl, fp.finalUrl);
    collectIndexMatches(candidateKeys, index.byCanonicalUrl, fp.canonicalUrl);
    collectIndexMatches(candidateKeys, index.byEtag, fp.etag);
    collectIndexMatches(candidateKeys, index.byWeakKey, fp.weakKey);
    collectIndexMatches(candidateKeys, index.byWeakKey, fp.dispositionWeakKey);
    collectIndexMatches(candidateKeys, index.byFilenameNorm, fp.filenameNorm);
    collectIndexMatches(candidateKeys, index.byFilenameNorm, fp.contentDispositionNorm);
    collectIndexMatches(candidateKeys, index.byFilenameExact, fp.filenameExact);
    collectIndexMatches(candidateKeys, index.byTitleKey, fp.titleKey);

    const matches = [];
    for (const key of candidateKeys) {
      if (key === file.key) continue;
      const existing = index.fileByKey.get(key);
      if (!existing) continue;
      const scored = scoreDuplicatePair(file, existing);
      if (scored.score >= POSSIBLE_DUPLICATE_SCORE) matches.push({ ...scored, file: existing });
    }
    return matches.sort((a, b) => b.score - a.score || sourceRank(a.file, settings) - sourceRank(b.file, settings)).slice(0, 5);
  }

  function collectIndexMatches(set, map, key) {
    if (!key) return;
    const values = map.get(key);
    if (values) values.forEach(value => set.add(value));
  }

  function scoreDuplicatePair(a, b) {
    const afp = a.fingerprints || makeFingerprints(a);
    const bfp = b.fingerprints || makeFingerprints(b);
    if (afp.contentSha256 && afp.contentSha256 === bfp.contentSha256) return { score: 100, reason: 'exact SHA-256 checksum match' };
    if (afp.finalUrl && afp.finalUrl === bfp.finalUrl) return { score: 95, reason: 'same final download URL' };
    if (afp.etag && afp.etag === bfp.etag && similarSize(a.sizeBytes, b.sizeBytes)) return { score: 94, reason: 'same ETag and size' };
    if (afp.canonicalUrl && afp.canonicalUrl === bfp.canonicalUrl) return { score: 92, reason: 'same canonical download URL' };
    if (afp.weakKey && afp.weakKey === bfp.weakKey) return { score: 90, reason: 'same normalized filename and byte size' };
    if (afp.dispositionWeakKey && afp.dispositionWeakKey === bfp.dispositionWeakKey) return { score: 90, reason: 'same server filename and byte size' };
    if (afp.filenameExact && afp.filenameExact === bfp.filenameExact && similarSize(a.sizeBytes, b.sizeBytes)) return { score: 80, reason: 'same filename and similar size' };
    if (afp.filenameNorm && afp.filenameNorm === bfp.filenameNorm && afp.titleKey && afp.titleKey === bfp.titleKey) return { score: 72, reason: 'same normalized filename and mod title' };
    if (afp.filenameNorm && afp.filenameNorm === bfp.filenameNorm && afp.creatorKey && afp.creatorKey === bfp.creatorKey) return { score: 70, reason: 'same normalized filename and creator' };
    if (afp.filenameNorm && afp.filenameNorm === bfp.filenameNorm && !isGenericDuplicateName(afp.filenameNorm)) return { score: 55, reason: 'same normalized filename' };
    if (afp.titleKey && afp.titleKey === bfp.titleKey && afp.creatorKey && afp.creatorKey === bfp.creatorKey && similarSize(a.sizeBytes, b.sizeBytes)) return { score: 50, reason: 'same mod title, creator, and similar size' };
    if (afp.titleKey && afp.titleKey === bfp.titleKey && !isGenericDuplicateName(afp.titleKey)) return { score: 40, reason: 'same mod title' };
    return { score: 0, reason: '' };
  }

  function similarSize(a, b) {
    if (!a || !b) return false;
    const delta = Math.abs(a - b);
    return delta <= Math.max(1024, Math.round(Math.max(a, b) * 0.02));
  }

  function isGenericDuplicateName(value) {
    return /^(defaultreplacement|default|cas|merged|main|download|file|package|archive|mod|mesh|texture|preview|readme)(\.[a-z0-9]+)?$/i.test(value || '');
  }

  function sourceRank(file, settings = getSettings()) {
    const preferred = settings.preferredSource || 'mts';
    if (file.site === preferred) return 0;
    if (file.site === 'mts') return 1;
    if (file.site === 'simblr') return 2;
    if (file.site === 'tsr') return 3;
    return 9;
  }

  function preferredFile(files, settings = getSettings()) {
    return [...files].sort((a, b) => sourceRank(a, settings) - sourceRank(b, settings) || (b.updatedAt || 0) - (a.updatedAt || 0))[0];
  }

  async function chooseFilesForMods(mods, options = {}) {
    return new Promise(resolve => {
      closeModal();
      const basket = loadBasket();
      const overlay = document.createElement('div');
      overlay.className = 'sccb-modal-backdrop';
      overlay.tabIndex = -1;

      const modal = document.createElement('section');
      modal.className = 'sccb-file-modal';
      overlay.appendChild(modal);

      const handle = document.createElement('div');
      handle.className = 'sccb-sheet-handle';
      modal.appendChild(handle);

      const header = document.createElement('header');
      header.className = 'sccb-modal-header';
      modal.appendChild(header);

      const titleWrap = document.createElement('div');
      header.appendChild(titleWrap);

      const title = document.createElement('h2');
      title.textContent = options.duplicateReview ? 'Review files and likely duplicates' : (options.single ? 'Choose files' : `Review ${mods.length} mod${mods.length === 1 ? '' : 's'}`);
      titleWrap.appendChild(title);

      const subtitle = document.createElement('div');
      subtitle.className = 'sccb-muted';
      subtitle.textContent = options.single
        ? `${mods[0].title} has multiple downloads.`
        : (options.duplicateReview ? 'Likely duplicates are unchecked by default. Check them to add anyway.' : 'Pick exactly what should be added to the shared basket.');
      titleWrap.appendChild(subtitle);

      const close = iconButton('×', 'Close', () => done([]));
      header.appendChild(close);

      const body = document.createElement('div');
      body.className = 'sccb-modal-body';
      modal.appendChild(body);

      const toolbar = document.createElement('div');
      toolbar.className = 'sccb-choice-toolbar';
      body.appendChild(toolbar);
      toolbar.appendChild(makeButton('Select all', '', () => body.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = true; })));
      toolbar.appendChild(makeButton('Select none', '', () => body.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; })));
      toolbar.appendChild(makeButton('Main files', '', () => selectDefaultChoices(body, mods)));
      toolbar.appendChild(makeButton('Missing only', '', () => body.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = !input.disabled; })));

      for (const mod of mods) {
        const modKey = `${mod.site}:${mod.modId}`;
        const remembered = new Set(basket.choices?.[modKey] || []);
        const group = document.createElement('section');
        group.className = 'sccb-choice-group';
        group.dataset.modKey = modKey;
        body.appendChild(group);

        const groupHeader = document.createElement('button');
        groupHeader.type = 'button';
        groupHeader.className = 'sccb-choice-group-header';
        groupHeader.title = 'Collapse or expand this mod';
        group.appendChild(groupHeader);

        const headerText = document.createElement('span');
        groupHeader.appendChild(headerText);

        const modTitle = document.createElement('span');
        modTitle.className = 'sccb-choice-title';
        modTitle.textContent = mod.title;
        headerText.appendChild(modTitle);

        const modMeta = document.createElement('span');
        modMeta.className = 'sccb-muted';
        const alreadyText = mod.already ? ` · ${mod.already} already in basket` : '';
        modMeta.textContent = `${mod.siteName} · ${mod.files.length} available${alreadyText}`;
        headerText.appendChild(modMeta);

        const caret = document.createElement('span');
        caret.className = 'sccb-choice-caret';
        caret.textContent = '⌄';
        groupHeader.appendChild(caret);

        const list = document.createElement('div');
        list.className = 'sccb-choice-list';
        group.appendChild(list);
        groupHeader.addEventListener('click', () => {
          group.classList.toggle('collapsed');
          caret.textContent = group.classList.contains('collapsed') ? '›' : '⌄';
        });

        const mainGuess = chooseDefaultFileIndexes(mod.files);
        mod.files.forEach((file, index) => {
          const label = document.createElement('label');
          label.className = `sccb-file-choice ${file.duplicateScore >= LIKELY_DUPLICATE_SCORE ? 'sccb-likely-duplicate' : ''}`.trim();
          label.dataset.fileKey = file.key;
          label.dataset.modKey = modKey;
          label.dataset.index = String(index);

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.dataset.fileKey = file.key;
          checkbox.dataset.modKey = modKey;
          checkbox.dataset.fileId = file.fileId;
          checkbox.checked = remembered.size ? remembered.has(file.fileId) : (file.duplicateDefaultSkip ? false : mainGuess.has(index));
          label.appendChild(checkbox);

          const text = document.createElement('span');
          label.appendChild(text);

          const name = document.createElement('span');
          name.className = 'sccb-choice-file-name';
          name.textContent = file.fileName;
          text.appendChild(name);

          const meta = document.createElement('span');
          meta.className = 'sccb-choice-file-meta';
          const bits = [file.role, file.type?.toUpperCase(), file.size].filter(Boolean);
          meta.textContent = bits.join(' · ') || 'Download file';
          text.appendChild(meta);

          if (file.duplicateScore >= POSSIBLE_DUPLICATE_SCORE && file.duplicateCandidates?.length) {
            const dupe = document.createElement('span');
            dupe.className = `sccb-duplicate-note ${file.duplicateScore >= HIGH_DUPLICATE_SCORE ? 'high' : ''}`;
            const best = file.duplicateCandidates[0];
            dupe.textContent = `${file.duplicateScore >= HIGH_DUPLICATE_SCORE ? '⚠ Likely duplicate' : 'Possible duplicate'} of ${best.file.siteName || best.file.site} · ${best.file.fileName} (${best.reason}, ${best.score})`;
            text.appendChild(dupe);
          }

          list.appendChild(label);
        });
      }

      const actions = document.createElement('footer');
      actions.className = 'sccb-modal-actions';
      modal.appendChild(actions);
      actions.appendChild(makeButton('Cancel', '', () => done([])));
      actions.appendChild(makeButton('Add selected', 'primary', () => done(selectedFiles())));

      overlay.addEventListener('click', event => {
        if (event.target === overlay) done([]);
      });
      overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); done([]); }
        if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); done(selectedFiles()); }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
          event.preventDefault();
          body.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = true; });
        }
      });

      document.body.appendChild(overlay);
      state.activeModal = overlay;
      setTimeout(() => overlay.focus(), 0);

      function selectedFiles() {
        const selected = [];
        const selectedByMod = new Map();
        for (const input of body.querySelectorAll('input[type="checkbox"]:checked')) {
          const mod = mods.find(item => `${item.site}:${item.modId}` === input.dataset.modKey);
          if (!mod) continue;
          const file = mod.files.find(item => item.key === input.dataset.fileKey);
          if (!file) continue;
          selected.push(file);
          const ids = selectedByMod.get(input.dataset.modKey) || [];
          ids.push(file.fileId);
          selectedByMod.set(input.dataset.modKey, ids);
        }
        const basketNow = loadBasket();
        for (const [modKey, ids] of selectedByMod) basketNow.choices[modKey] = unique(ids);
        saveBasket(basketNow);
        return selected;
      }

      function done(value) {
        overlay.remove();
        if (state.activeModal === overlay) state.activeModal = null;
        resolve(value);
      }
    });
  }

  function selectDefaultChoices(body, mods) {
    for (const group of body.querySelectorAll('.sccb-choice-group')) {
      const mod = mods.find(item => `${item.site}:${item.modId}` === group.dataset.modKey);
      const defaults = chooseDefaultFileIndexes(mod?.files || []);
      group.querySelectorAll('input[type="checkbox"]').forEach((input, idx) => { input.checked = !mod?.files?.[idx]?.duplicateDefaultSkip && defaults.has(idx); });
    }
  }

  function chooseDefaultFileIndexes(files) {
    if (files.length <= 1) return new Set(files.map((_, i) => i));
    const scored = files.map((file, index) => ({ index, score: scoreFileForDefault(file) }));
    const bestScore = Math.max(...scored.map(item => item.score));
    if (bestScore <= 0) return new Set();
    return new Set(scored.filter(item => item.score === bestScore).map(item => item.index));
  }

  function scoreFileForDefault(file) {
    const name = `${file.fileName} ${file.role || ''}`.toLowerCase();
    let score = 0;
    if (/\b(main|required|base|default|merged)\b/.test(name)) score += 6;
    if (/\b(optional|addon|add-on|alternate|alt|brighter|darker|fixed|source|psd|preview|old|deprecated)\b/.test(name)) score -= 5;
    if (/\.(package|sims3pack|zip|rar|7z)$/i.test(file.fileName)) score += 2;
    if (/source|psd|blend|preview|image|screenshot/i.test(file.fileName)) score -= 4;
    return score;
  }

  function groupFilesByModInfo(mods, files) {
    const map = new Map();
    for (const file of files) {
      const key = `${file.site}:${file.modId}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(file);
    }
    return map;
  }

  function updateButtonState(button, modId) {
    if (!button) return;
    const site = button.dataset.site || adapter.id;
    const basket = loadBasket();
    const mod = basket.mods[`${site}:${modId}`];
    if (!mod) {
      setButtonState(button, '', button.id === 'sccb-detail-button' ? '+ Add this mod to basket' : '+ Basket');
      return;
    }
    const count = Object.keys(mod.files || {}).length;
    setButtonState(button, 'added', count > 1 ? `Added ${count}` : 'Added ✓');
  }

  function updateEveryButtonState() {
    document.querySelectorAll('.sccb-add').forEach(button => updateButtonState(button, button.dataset.modId));
    updateFabCount();
    if (state.activePanel) renderPanelContents(state.activePanel.querySelector('.sccb-panel'));
  }

  function setButtonState(button, stateName, label) {
    if (!button) return;
    button.dataset.sccbState = stateName || '';
    button.disabled = stateName === 'loading';
    button.textContent = label;
  }

  function ensureFab() {
    if (!canUseBasket()) return;
    if (document.querySelector('#sccb-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'sccb-fab';
    fab.type = 'button';
    fab.addEventListener('click', togglePanel);
    document.body.appendChild(fab);
    updateFabCount();
    runMobileModeAuditFixes();
  }

  function ensureMiniStrip() {
    if (!canUseBasket()) return;
    if (document.querySelector('#sccb-mini-strip')) return;
    const strip = document.createElement('div');
    strip.id = 'sccb-mini-strip';

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'sccb-mini-open';
    open.addEventListener('click', showPanel);
    strip.appendChild(open);

    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'sccb-mini-download';
    download.textContent = 'Download';
    download.addEventListener('click', downloadSelected);
    strip.appendChild(download);

    document.body.appendChild(strip);
    updateFabCount();
    runMobileModeAuditFixes();
  }

  function updateFabCount() {
    const fab = document.querySelector('#sccb-fab');
    if (!fab) return;
    const files = getAllFiles();
    const selected = files.filter(file => file.selected !== false).length;
    const isMobile = window.matchMedia?.('(max-width: 640px)').matches;
    fab.innerHTML = `<span class="sccb-plumbob-mini"></span><span>${isMobile ? `${selected || files.length}` : `Basket · ${selected}/${files.length}`}</span>`;

    const strip = document.querySelector('#sccb-mini-strip');
    if (strip) {
      strip.querySelector('.sccb-mini-open').innerHTML = `<span class="sccb-plumbob-mini"></span><span>Basket · ${selected} selected · ${files.length} total</span>`;
      strip.querySelector('.sccb-mini-download').disabled = !selected;
      strip.dataset.empty = files.length ? '0' : '1';
    }
    document.documentElement.dataset.sccbHasFiles = files.length ? '1' : '0';
    document.documentElement.dataset.sccbPanelOpen = state.activePanel ? '1' : '0';
    updateSiteToolbar();
  }

  function togglePanel() {
    if (state.activePanel) closePanel();
    else showPanel();
  }

  function closePanel() {
    state.activePanel?.remove();
    state.activePanel = null;
    updateFabCount();
    runMobileModeAuditFixes();
  }

  function showPanel() {
    closePanel();
    const overlay = document.createElement('div');
    overlay.className = 'sccb-panel-shell';
    const panel = document.createElement('section');
    panel.className = 'sccb-panel';
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    state.activePanel = overlay;
    updateFabCount();

    const handle = document.createElement('div');
    handle.className = 'sccb-sheet-handle';
    panel.appendChild(handle);

    const header = document.createElement('header');
    header.className = 'sccb-panel-header';
    panel.appendChild(header);

    const heading = document.createElement('div');
    heading.className = 'sccb-panel-title';
    heading.innerHTML = `<span class="sccb-plumbob"></span><span>Sims CC Basket</span>`;
    header.appendChild(heading);
    header.appendChild(iconButton('×', 'Close', closePanel));

    renderPanelContents(panel);
  }

  // Advanced basket manager layer: grouped views, sessions, search/filter/sort, queue state, health, exports, and diagnostics.
  function renderPanelContents(panel) {
    if (!panel) return;
    panel.querySelector('.sccb-panel-body')?.remove();
    panel.querySelector('.sccb-panel-actions')?.remove();

    const basket = loadBasket();
    ensureBasketSessions(basket);
    const settings = getSettings();
    const allMods = Object.values(basket.mods || {});
    const allFiles = getAllFiles(basket);
    const viewFiles = getFilteredBasketFiles(basket, settings);
    const selected = viewFiles.filter(file => file.selected !== false);
    const allSelected = getSelectedFiles(basket);

    const body = document.createElement('div');
    body.className = 'sccb-panel-body sccb-basket-manager';
    panel.appendChild(body);

    body.appendChild(renderBasketSummary(basket, allFiles, viewFiles, allSelected));
    body.appendChild(renderBasketControls(basket, settings));
    if (state.downloadQueue) body.appendChild(renderDownloadQueueState());

    if (!allFiles.length) {
      const empty = document.createElement('div');
      empty.className = 'sccb-empty-state';
      empty.innerHTML = '<strong>Basket is empty</strong><span>Use + Basket on supported mod cards or detail pages.</span>';
      body.appendChild(empty);
      return renderBasketActions(panel, basket, [], []);
    }

    const list = document.createElement('div');
    list.className = `sccb-mod-list sccb-basket-view-${settings.basketView || 'detailed'}`;
    body.appendChild(list);

    const grouped = groupFilteredFilesByMod(basket, viewFiles, settings);
    if (!grouped.length) {
      const empty = document.createElement('div');
      empty.className = 'sccb-empty-state';
      empty.innerHTML = '<strong>No matching basket items</strong><span>Clear the search or choose another filter.</span>';
      list.appendChild(empty);
    }

    for (const group of grouped) list.appendChild(renderBasketModGroup(group, basket, settings));
    renderBasketActions(panel, basket, viewFiles, selected);
  }

  function renderBasketSummary(basket, allFiles, viewFiles, selectedFiles) {
    const mods = Object.values(basket.mods || {});
    const duplicateGroups = findDuplicateGroups(basket, LIKELY_DUPLICATE_SCORE).length;
    const stale = allFiles.filter(isFileStale).length;
    const summary = document.createElement('div');
    summary.className = 'sccb-summary sccb-basket-summary-compact';

    const primary = document.createElement('div');
    primary.className = 'sccb-summary-primary';
    primary.innerHTML = `<strong>${mods.length} mod${mods.length === 1 ? '' : 's'}</strong><span>·</span><strong>${allFiles.length} file${allFiles.length === 1 ? '' : 's'}</strong><span>·</span><span>${selectedFiles.length} selected</span>${formatTotalSize(allFiles) || ''}`;
    summary.appendChild(primary);

    const status = document.createElement('div');
    status.className = 'sccb-summary-status';
    if (viewFiles.length !== allFiles.length) status.appendChild(simpleChip(`${viewFiles.length} shown`, ''));
    if (duplicateGroups) status.appendChild(simpleChip(`${duplicateGroups} duplicate${duplicateGroups === 1 ? '' : 's'}`, 'warn'));
    if (stale) status.appendChild(simpleChip(`${stale} stale`, 'warn'));
    if (status.children.length) summary.appendChild(status);
    return summary;
  }

  function renderBasketControls(basket, settings) {
    const wrap = document.createElement('section');
    wrap.className = 'sccb-basket-controls sccb-basket-controls-compact';

    const top = document.createElement('div');
    top.className = 'sccb-basket-control-top';
    wrap.appendChild(top);

    const search = document.createElement('input');
    search.className = 'sccb-basket-search';
    search.type = 'search';
    search.placeholder = 'Search basket…';
    search.value = settings.basketSearch || '';
    search.addEventListener('input', () => {
      const value = search.value;
      clearTimeout(state.basketSearchTimer);
      state.basketSearchTimer = setTimeout(() => updateBasketSetting('basketSearch', value), 180);
    });
    top.appendChild(search);

    const refine = document.createElement('details');
    refine.className = 'sccb-refine-disclosure';
    refine.open = Boolean(state.basketRefineOpen);
    refine.addEventListener('toggle', () => { state.basketRefineOpen = refine.open; });
    const refineSummary = document.createElement('summary');
    const activeCount = [
      settings.basketFilter && settings.basketFilter !== 'all',
      settings.basketSiteFilter && settings.basketSiteFilter !== 'all',
      settings.activeBasketSession && settings.activeBasketSession !== 'all' && settings.activeBasketSession !== 'Default',
      settings.basketSort && settings.basketSort !== 'addedDesc',
      settings.basketView && settings.basketView !== 'detailed',
    ].filter(Boolean).length;
    refineSummary.textContent = activeCount ? `Refine · ${activeCount}` : 'Refine';
    refine.appendChild(refineSummary);
    top.appendChild(refine);

    const drawer = document.createElement('div');
    drawer.className = 'sccb-refine-drawer';
    refine.appendChild(drawer);

    drawer.appendChild(renderControlField('Show', renderSegmentedControl('basketFilter', settings.basketFilter || 'all', [
      ['all', 'All'], ['selected', 'Selected'], ['unselected', 'Unselected'], ['duplicates', 'Duplicates'], ['stale', 'Stale'], ['failed', 'Failed']
    ])));

    drawer.appendChild(renderControlField('Site', renderSegmentedControl('basketSiteFilter', settings.basketSiteFilter || 'all', [
      ['all', 'All'], ['mts', 'MTS'], ['simblr', 'Simblr'], ['tsr', 'TSR']
    ])));

    drawer.appendChild(renderControlField('View', renderSegmentedControl('basketView', settings.basketView || 'detailed', [
      ['compact', 'Compact'], ['detailed', 'Detailed']
    ])));

    const sortSelect = document.createElement('select');
    sortSelect.value = settings.basketSort || 'addedDesc';
    [
      ['addedDesc', 'Date added'], ['site', 'Site'], ['creator', 'Creator'], ['title', 'Mod title'],
      ['sizeDesc', 'File size'], ['duplicate', 'Duplicate status'], ['selected', 'Selected first']
    ].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = value === sortSelect.value;
      sortSelect.appendChild(option);
    });
    sortSelect.addEventListener('change', () => updateBasketSetting('basketSort', sortSelect.value));
    drawer.appendChild(renderControlField('Sort', sortSelect));

    const sessionControls = document.createElement('div');
    sessionControls.className = 'sccb-session-row';
    const sessions = ensureBasketSessions(basket);
    const sessionSelect = document.createElement('select');
    sessionSelect.className = 'sccb-session-select';
    ['All sessions', ...sessions].forEach(label => {
      const value = label === 'All sessions' ? 'all' : label;
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      option.selected = String(settings.activeBasketSession || 'Default') === value;
      sessionSelect.appendChild(option);
    });
    sessionSelect.addEventListener('change', () => updateBasketSetting('activeBasketSession', sessionSelect.value === 'all' ? 'all' : sessionSelect.value));
    sessionControls.append(sessionSelect);
    sessionControls.appendChild(makeButton('New', '', () => createBasketSession()));
    sessionControls.appendChild(makeButton('Move selected', '', () => moveSelectedToSession()));
    drawer.appendChild(renderControlField('Session', sessionControls));

    return wrap;
  }

  function renderControlField(label, control) {
    const field = document.createElement('div');
    field.className = 'sccb-refine-field';
    const heading = document.createElement('span');
    heading.className = 'sccb-refine-label';
    heading.textContent = label;
    field.append(heading, control);
    return field;
  }

  function renderSegmentedControl(settingKey, current, options) {
    const group = document.createElement('div');
    group.className = 'sccb-segmented';
    options.forEach(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = String(current) === String(value) ? 'active' : '';
      button.textContent = label;
      button.addEventListener('click', () => updateBasketSetting(settingKey, value));
      group.appendChild(button);
    });
    return group;
  }

  function updateBasketSetting(key, value) {
    const settings = { ...getSettings(), [key]: value };
    saveSettings(settings);
    if (state.activePanel) renderPanelContents(state.activePanel.querySelector('.sccb-panel'));
  }

  function getFilteredBasketFiles(basket = loadBasket(), settings = getSettings()) {
    const files = getAllFiles(basket);
    const query = cleanText(settings.basketSearch).toLowerCase();
    const dupeKeys = new Set(findDuplicateGroups(basket, POSSIBLE_DUPLICATE_SCORE).flatMap(group => group.files.map(file => file.key)));
    return files.filter(file => {
      if (settings.activeBasketSession && settings.activeBasketSession !== 'all' && (file.session || 'Default') !== settings.activeBasketSession) return false;
      if (settings.basketSiteFilter && settings.basketSiteFilter !== 'all' && file.site !== settings.basketSiteFilter) return false;
      if (settings.basketFilter === 'selected' && file.selected === false) return false;
      if (settings.basketFilter === 'unselected' && file.selected !== false) return false;
      if (settings.basketFilter === 'duplicates' && !dupeKeys.has(file.key)) return false;
      if (settings.basketFilter === 'stale' && !isFileStale(file)) return false;
      if (settings.basketFilter === 'failed' && file.downloadStatus !== 'failed') return false;
      if (query) {
        const hay = [file.fileName, file.modTitle, file.creator, file.siteName, file.size, file.type, file.note, file.modDescriptionText, file.descriptionText, ...(file.tags || [])].join(' ').toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }

  function groupFilteredFilesByMod(basket, files, settings) {
    const groups = new Map();
    for (const file of files) {
      const modKey = `${file.site}:${file.modId}`;
      const mod = basket.mods?.[modKey] || { key: modKey, title: file.modTitle, site: file.site, siteName: file.siteName, creator: file.creator, url: file.modUrl, files: {} };
      if (!groups.has(modKey)) groups.set(modKey, { mod, files: [] });
      groups.get(modKey).files.push(file);
    }
    const result = [...groups.values()];
    const sort = settings.basketSort || 'addedDesc';
    for (const group of result) group.files.sort((a, b) => compareBasketFiles(a, b, sort));
    result.sort((a, b) => compareBasketGroups(a, b, sort));
    return result;
  }

  function compareBasketGroups(a, b, sort) {
    const af = a.files[0] || {}, bf = b.files[0] || {};
    if (sort === 'site') return cleanText(af.siteName || af.site).localeCompare(cleanText(bf.siteName || bf.site)) || cleanText(a.mod.title).localeCompare(cleanText(b.mod.title));
    if (sort === 'creator') return cleanText(a.mod.creator || af.creator).localeCompare(cleanText(b.mod.creator || bf.creator));
    if (sort === 'title') return cleanText(a.mod.title).localeCompare(cleanText(b.mod.title));
    if (sort === 'sizeDesc') return sumSize(b.files) - sumSize(a.files);
    if (sort === 'selected') return countSelected(b.files) - countSelected(a.files);
    if (sort === 'duplicate') return duplicateWeight(b.files) - duplicateWeight(a.files);
    return Math.max(...a.files.map(f => f.addedAt || 0)) - Math.max(...b.files.map(f => f.addedAt || 0));
  }

  function compareBasketFiles(a, b, sort) {
    if (sort === 'sizeDesc') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
    if (sort === 'selected') return Number(b.selected !== false) - Number(a.selected !== false);
    if (sort === 'title') return cleanText(a.fileName).localeCompare(cleanText(b.fileName));
    return (b.addedAt || 0) - (a.addedAt || 0);
  }

  function renderBasketModGroup(group, basket, settings) {
    const mod = group.mod;
    const files = group.files;
    const selectedCount = files.filter(file => file.selected !== false).length;
    const section = document.createElement('section');
    section.className = 'sccb-mod-card sccb-basket-mod-group';
    section.dataset.session = files[0]?.session || 'Default';

    const header = document.createElement('header');
    header.className = 'sccb-mod-header';
    section.appendChild(header);

    const groupSelect = document.createElement('input');
    groupSelect.type = 'checkbox';
    groupSelect.className = 'sccb-mod-select';
    groupSelect.checked = selectedCount === files.length && files.length > 0;
    groupSelect.indeterminate = selectedCount > 0 && selectedCount < files.length;
    groupSelect.setAttribute('aria-label', `Select all files in ${mod.title || 'mod'}`);
    groupSelect.addEventListener('change', () => setModSelection(mod.key, groupSelect.checked));
    header.appendChild(groupSelect);

    const left = document.createElement('div');
    left.className = 'sccb-mod-heading';
    header.appendChild(left);

    const title = document.createElement('button');
    title.type = 'button';
    title.className = 'sccb-mod-title sccb-mod-title-button';
    title.textContent = mod.title || files[0]?.modTitle || 'Mod';
    title.title = 'Open saved mod information';
    title.addEventListener('click', () => showBasketModInfo(mod.key));
    left.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'sccb-muted sccb-mod-meta-line';
    meta.textContent = `${files[0]?.siteName || mod.siteName || mod.site || 'Site'}${mod.creator || files[0]?.creator ? ` · ${mod.creator || files[0].creator}` : ''} · ${selectedCount}/${files.length} selected${files[0]?.session && files[0].session !== 'Default' ? ` · ${files[0].session}` : ''}`;
    left.appendChild(meta);

    const descriptionPreview = mod.descriptionPreview || makeDescriptionPreview(mod.descriptionText || files.find(file => file.modDescriptionText)?.modDescriptionText || '');
    if (descriptionPreview) {
      const preview = document.createElement('button');
      preview.type = 'button';
      preview.className = 'sccb-mod-description-preview';
      preview.textContent = descriptionPreview;
      preview.title = 'Open saved mod description';
      preview.addEventListener('click', () => showBasketModInfo(mod.key));
      left.appendChild(preview);
    }

    const menu = createOverflowMenu('Mod actions', [
      ['Open info', () => showBasketModInfo(mod.key)],
      ['Open source', () => window.open(mod.url || files[0]?.modUrl, '_blank', 'noopener')],
      ['Refresh files', () => refreshModFiles(mod.key)],
      ['Select all', () => setModSelection(mod.key, true)],
      ['Deselect all', () => setModSelection(mod.key, false)],
      ['Remove mod', () => removeMod(mod.key), 'danger'],
    ]);
    header.appendChild(menu);

    if (settings.basketView === 'compact') {
      const compact = document.createElement('div');
      compact.className = 'sccb-compact-line';
      compact.textContent = files.map(file => file.fileName).join(' · ');
      section.appendChild(compact);
      return section;
    }

    const fileList = document.createElement('div');
    fileList.className = 'sccb-file-list';
    section.appendChild(fileList);
    for (const file of files) fileList.appendChild(renderBasketFileRow(file, basket));
    return section;
  }

  function renderBasketFileRow(file, basket) {
    const row = document.createElement('div');
    row.className = 'sccb-file-row';
    row.dataset.fileKey = file.key;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = file.selected !== false;
    checkbox.setAttribute('aria-label', `Select ${file.fileName || 'download file'}`);
    checkbox.addEventListener('change', () => setFileSelection(file.key, checkbox.checked));
    row.appendChild(checkbox);

    const text = document.createElement('div');
    text.className = 'sccb-file-text';
    row.appendChild(text);

    const title = document.createElement('span');
    title.className = 'sccb-file-title';
    title.textContent = file.fileName || 'Download file';
    text.appendChild(title);

    const metaParts = [file.type && file.type.toUpperCase(), file.size, file.role && file.role !== 'other' ? file.role : '', file.session && file.session !== 'Default' ? file.session : ''].filter(Boolean);
    const meta = document.createElement('span');
    meta.className = 'sccb-file-meta';
    meta.textContent = metaParts.join(' · ');
    text.appendChild(meta);

    const chips = document.createElement('span');
    chips.className = 'sccb-file-chip-row';
    if (isFileStale(file)) chips.appendChild(simpleChip('Stale', 'warn'));
    if (file.downloadStatus) chips.appendChild(simpleChip(statusLabel(file.downloadStatus), file.downloadStatus === 'failed' ? 'danger' : ''));
    const dupes = findDuplicateCandidates(file, basket).filter(match => match.file.key !== file.key && match.score >= LIKELY_DUPLICATE_SCORE);
    if (dupes.length) chips.appendChild(simpleChip('Possible duplicate', 'warn'));
    (file.tags || []).slice(0, 2).forEach(tag => chips.appendChild(simpleChip(tag, '')));
    if ((file.tags || []).length > 2) chips.appendChild(simpleChip(`+${file.tags.length - 2}`, ''));
    if (chips.children.length) text.appendChild(chips);

    const menu = document.createElement('details');
    menu.className = 'sccb-overflow-menu sccb-file-overflow';
    const menuSummary = document.createElement('summary');
    menuSummary.textContent = '⋯';
    menuSummary.title = 'File actions';
    menu.appendChild(menuSummary);
    const pop = document.createElement('div');
    pop.className = 'sccb-overflow-popover sccb-file-popover';
    menu.appendChild(pop);

    const edit = document.createElement('div');
    edit.className = 'sccb-file-edit';
    const note = document.createElement('textarea');
    note.placeholder = 'Notes for this file…';
    note.value = file.note || '';
    note.addEventListener('change', () => updateFileMeta(file.key, { note: note.value }));
    const tags = document.createElement('input');
    tags.type = 'text';
    tags.placeholder = 'tags, comma separated';
    tags.value = (file.tags || []).join(', ');
    tags.addEventListener('change', () => updateFileMeta(file.key, { tags: tags.value.split(',').map(cleanText).filter(Boolean) }));
    edit.append(note, tags);
    pop.appendChild(edit);
    pop.appendChild(makeMenuAction('Remove file', () => removeFile(file.key), 'danger', menu));
    row.appendChild(menu);
    return row;
  }

  function renderBasketActions(panel, basket, viewFiles, selected) {
    const actions = document.createElement('footer');
    actions.className = 'sccb-panel-actions sccb-panel-actions-simple';
    panel.appendChild(actions);

    const selectedAll = getSelectedFiles(basket);
    const download = makeButton(`Download${selectedAll.length ? ` · ${selectedAll.length}` : ''}`, 'primary', () => showDownloadPlan('download'));
    download.disabled = !selectedAll.length;
    actions.appendChild(download);

    const more = document.createElement('details');
    more.className = 'sccb-action-menu';
    const moreSummary = document.createElement('summary');
    moreSummary.textContent = 'More';
    more.appendChild(moreSummary);
    actions.appendChild(more);

    const drawer = document.createElement('div');
    drawer.className = 'sccb-action-drawer';
    more.appendChild(drawer);

    drawer.appendChild(renderActionGroup('Download & links', [
      ['Open tabs', () => showDownloadPlan('tabs')],
      ['Copy links', () => copySelectedLinks()],
      ['Retry failed', () => retryFailedDownloads()],
    ], !selectedAll.length));

    drawer.appendChild(renderActionGroup('Organize', [
      ['Select by site', () => selectBySite()],
      ['Move selected', () => moveSelectedToSession()],
      ['Remove selected', () => removeSelected(), 'danger'],
    ]));

    drawer.appendChild(renderActionGroup('Check & repair', [
      ['Check basket', () => showBasketHealthCheck()],
      ['Refresh stale', () => refreshStaleFiles(getSelectedFiles()).then(updateEveryButtonState)],
      ['Review duplicates', () => showDuplicateReview()],
      ['Resolve metadata', () => resolveMetadataForSelected()],
      ['Verify duplicates', () => verifySelectedHashes()],
    ]));

    drawer.appendChild(renderActionGroup('Export & backup', [
      ['TXT', () => exportBasketFormat('txt')],
      ['Markdown', () => exportBasketFormat('markdown')],
      ['JSON', () => exportBasketFormat('json')],
      ['CSV', () => exportBasketFormat('csv')],
      ['aria2', () => exportBasketFormat('aria2')],
      ['JDownloader', () => exportBasketFormat('jdownloader')],
      ['Import JSON', () => importJson()],
    ]));

    drawer.appendChild(renderActionGroup('Tools', [
      ['Basket diagnostics', () => showBasketDiagnostics()],
      ['Settings', () => showSettings()],
      ['Clear basket', () => clearBasket(), 'danger'],
    ]));
  }

  function renderActionGroup(label, actions, disabled = false) {
    const group = document.createElement('details');
    group.className = 'sccb-action-group';
    const summary = document.createElement('summary');
    summary.textContent = label;
    group.appendChild(summary);
    const body = document.createElement('div');
    body.className = 'sccb-action-group-body';
    group.appendChild(body);
    for (const [text, handler, kind] of actions) {
      const button = makeButton(text, kind || '', handler);
      if (disabled && !['Settings', 'Basket diagnostics'].includes(text)) button.disabled = true;
      body.appendChild(button);
    }
    return group;
  }

  function createOverflowMenu(label, actions) {
    const details = document.createElement('details');
    details.className = 'sccb-overflow-menu';
    const summary = document.createElement('summary');
    summary.textContent = '⋯';
    summary.title = label;
    details.appendChild(summary);
    const pop = document.createElement('div');
    pop.className = 'sccb-overflow-popover';
    details.appendChild(pop);
    for (const [text, handler, kind] of actions) pop.appendChild(makeMenuAction(text, handler, kind, details));
    return details;
  }

  function makeMenuAction(label, onClick, kind = '', owner) {
    const button = makeButton(label, kind, event => {
      event?.preventDefault?.();
      owner && (owner.open = false);
      onClick(event);
    });
    button.classList.add('sccb-menu-action');
    return button;
  }

  function addFilesToBasket(modInfo, files) {
    const basket = loadBasket();
    ensureBasketSessions(basket);
    let addedFiles = 0;
    let duplicates = 0;
    const addedKeys = [];
    const modKey = `${modInfo.site}:${modInfo.modId}`;
    const mod = basket.mods[modKey] || {
      key: modKey,
      site: modInfo.site,
      siteName: modInfo.siteName,
      modId: String(modInfo.modId),
      title: modInfo.title || modInfo.modTitle,
      url: modInfo.modUrl,
      creator: modInfo.creator || '',
      descriptionText: capStoredDescription(modInfo.descriptionText || modInfo.description || ''),
      descriptionPreview: modInfo.descriptionPreview || makeDescriptionPreview(modInfo.descriptionText || modInfo.description || ''),
      descriptionSource: cleanText(modInfo.descriptionSource),
      descriptionFetchedAt: Number(modInfo.descriptionFetchedAt) || 0,
      info: modInfo.info && typeof modInfo.info === 'object' ? modInfo.info : {},
      addedAt: Date.now(),
      updatedAt: Date.now(),
      files: {},
    };
    mergeModInfoIntoBasketMod(mod, modInfo);
    const session = getSettings().activeBasketSession === 'all' ? 'Default' : (getSettings().activeBasketSession || 'Default');
    const chosenIds = [];
    const index = ensureBasketIndex(basket);
    for (const file of files) {
      const normalized = normalizeFile({ ...file, ...pickModInfo(modInfo), session });
      chosenIds.push(normalized.fileId);
      if (index.fileKeys.has(normalized.key) || mod.files[normalized.key]) { duplicates++; continue; }
      mod.files[normalized.key] = { ...normalized, selected: true, session };
      index.fileKeys.add(normalized.key);
      addedKeys.push(normalized.key);
      addedFiles++;
    }
    mod.updatedAt = Date.now();
    basket.mods[modKey] = mod;
    if (!basket.sessions.includes(session)) basket.sessions.push(session);
    if (chosenIds.length) basket.choices[modKey] = unique(chosenIds);
    saveBasket(basket);
    if (addedKeys.length) toastWithUndo(`Added ${addedKeys.length} file${addedKeys.length === 1 ? '' : 's'} to basket.`, () => removeFilesByKey(addedKeys), 'Undo');
    return { addedFiles, duplicates, modTitle: mod.title };
  }

  async function downloadSelected() { showDownloadPlan('download'); }
  async function openSelectedTabs() { showDownloadPlan('tabs'); }

  function showBasketModInfo(modKey) {
    const basket = loadBasket();
    const mod = basket.mods?.[modKey];
    if (!mod) return toast('Mod info was not found.', true);
    const files = Object.values(mod.files || {});
    const description = mod.descriptionText || files.find(file => file.modDescriptionText)?.modDescriptionText || '';
    const preview = mod.descriptionPreview || makeDescriptionPreview(description);
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'sccb-modal-backdrop';
    const modal = document.createElement('section');
    modal.className = 'sccb-file-modal sccb-mod-info-modal';
    overlay.appendChild(modal);
    modal.innerHTML = `<div class="sccb-sheet-handle"></div><header class="sccb-modal-header"><div><h2>${escapeHtml(mod.title || 'Mod info')}</h2><div class="sccb-muted">${escapeHtml(mod.siteName || mod.site || 'Site')}${mod.creator ? ` · ${escapeHtml(mod.creator)}` : ''}</div></div></header>`;
    modal.querySelector('.sccb-modal-header').appendChild(iconButton('×', 'Close', closeModal));

    const body = document.createElement('div');
    body.className = 'sccb-modal-body sccb-mod-info-body';
    modal.appendChild(body);

    const chips = document.createElement('div');
    chips.className = 'sccb-mod-info-chip-row';
    chips.appendChild(simpleChip(`${files.length} file${files.length === 1 ? '' : 's'}`, ''));
    chips.appendChild(simpleChip(`${files.filter(file => file.selected !== false).length} selected`, ''));
    if (mod.descriptionSource) chips.appendChild(simpleChip(`Description: ${mod.descriptionSource}`, ''));
    if (mod.descriptionFetchedAt) chips.appendChild(simpleChip(`Saved ${new Date(mod.descriptionFetchedAt).toLocaleDateString()}`, ''));
    body.appendChild(chips);

    if (preview) {
      const short = document.createElement('p');
      short.className = 'sccb-mod-info-preview';
      short.textContent = preview;
      body.appendChild(short);
    }

    const desc = document.createElement('section');
    desc.className = 'sccb-mod-info-description';
    desc.innerHTML = '<h3>Description</h3>';
    const copy = document.createElement('div');
    copy.className = 'sccb-mod-info-description-copy';
    copy.textContent = description || 'No description was saved for this mod yet. Refresh this mod or add it again from the detail page to capture the description.';
    desc.appendChild(copy);
    body.appendChild(desc);

    const fileSection = document.createElement('section');
    fileSection.className = 'sccb-mod-info-files';
    fileSection.innerHTML = '<h3>Files</h3>';
    const list = document.createElement('div');
    list.className = 'sccb-mod-info-file-list';
    files.forEach(file => {
      const row = document.createElement('a');
      row.href = file.url || mod.url || '#';
      row.target = '_blank';
      row.rel = 'noopener';
      row.className = 'sccb-mod-info-file-row';
      row.innerHTML = `<strong>${escapeHtml(file.fileName || 'Download file')}</strong><span>${escapeHtml([file.type?.toUpperCase(), file.size, file.role && file.role !== 'other' ? file.role : ''].filter(Boolean).join(' · ') || 'Download file')}</span>`;
      list.appendChild(row);
    });
    fileSection.appendChild(list);
    body.appendChild(fileSection);

    const actions = document.createElement('footer');
    actions.className = 'sccb-modal-actions';
    actions.appendChild(makeButton('Open source', '', () => window.open(mod.url || files[0]?.modUrl || '#', '_blank', 'noopener')));
    actions.appendChild(makeButton('Refresh mod info', '', async () => { await refreshModFiles(mod.key); closeModal(); showBasketModInfo(mod.key); }));
    actions.appendChild(makeButton('Close', 'primary', closeModal));
    modal.appendChild(actions);
    document.body.appendChild(overlay);
    state.activeModal = overlay;
  }

  function showDownloadPlan(mode = 'download') {
    const basket = loadBasket();
    const files = getSelectedFiles(basket);
    if (!files.length) return toast('No files selected.', true);
    const duplicateGroups = findDuplicateGroups(basket, LIKELY_DUPLICATE_SCORE).filter(group => group.files.some(file => file.selected !== false));
    const stale = files.filter(isFileStale);
    const missing = files.filter(file => !file.url);
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'sccb-modal-backdrop';
    overlay.tabIndex = -1;
    const modal = document.createElement('section');
    modal.className = 'sccb-file-modal sccb-download-plan-modal';
    overlay.appendChild(modal);
    modal.innerHTML = `<div class="sccb-sheet-handle"></div><header class="sccb-modal-header"><div><h2>Download plan</h2><div class="sccb-muted">Review before opening download links.</div></div></header>`;
    modal.querySelector('.sccb-modal-header').appendChild(iconButton('×', 'Close', closeModal));
    const body = document.createElement('div');
    body.className = 'sccb-modal-body sccb-plan-body';
    body.innerHTML = `
      <div class="sccb-plan-grid">
        <span><strong>${files.length}</strong> selected files</span>
        <span><strong>${new Set(files.map(f => f.site)).size}</strong> sites</span>
        <span>${formatTotalSize(files).replace(/^ · /, '') || 'size unknown'}</span>
        <span>${duplicateGroups.length ? `${duplicateGroups.length} duplicate group${duplicateGroups.length === 1 ? '' : 's'}` : 'no likely duplicates'}</span>
        <span>${stale.length ? `${stale.length} stale link${stale.length === 1 ? '' : 's'}` : 'links look fresh'}</span>
        <span>${missing.length ? `${missing.length} missing URL${missing.length === 1 ? '' : 's'}` : 'URLs present'}</span>
      </div>`;
    const list = document.createElement('div');
    list.className = 'sccb-plan-list';
    files.slice(0, 80).forEach(file => {
      const row = document.createElement('div');
      row.className = 'sccb-plan-row';
      row.textContent = `${file.siteName || file.site} · ${file.modTitle} · ${file.fileName}`;
      list.appendChild(row);
    });
    if (files.length > 80) {
      const more = document.createElement('div');
      more.className = 'sccb-muted';
      more.textContent = `+ ${files.length - 80} more files`;
      list.appendChild(more);
    }
    body.appendChild(list);
    modal.appendChild(body);
    const actions = document.createElement('footer');
    actions.className = 'sccb-modal-actions';
    modal.appendChild(actions);
    actions.appendChild(makeButton(stale.length ? 'Refresh stale first' : 'Refresh links', '', async () => { await refreshStaleFiles(files); closeModal(); showDownloadPlan(mode); }));
    actions.appendChild(makeButton(mode === 'tabs' ? 'Open tabs' : 'Download', 'primary', async () => { closeModal(); await runDownloadQueue(mode); }));
    actions.appendChild(makeButton('Copy links', '', () => { closeModal(); copySelectedLinks(); }));
    actions.appendChild(makeButton('Export TXT', '', () => { closeModal(); exportBasketFormat('txt'); }));
    actions.appendChild(makeButton('Cancel', '', closeModal));
    document.body.appendChild(overlay);
    state.activeModal = overlay;
  }

  async function runDownloadQueue(mode = 'download', fileKeys = null) {
    let files = fileKeys ? getAllFiles().filter(file => fileKeys.includes(file.key)) : getSelectedFiles();
    if (!files.length) return toast('No files selected.', true);
    if (getSettings().resolveBeforeDownload) files = await resolveMetadataForFileList(files);
    files = await refreshStaleFiles(files);
    state.downloadQueue = { mode, total: files.length, done: 0, failed: 0, current: '', startedAt: Date.now(), items: files.map(file => ({ key: file.key, status: 'queued', name: file.fileName })) };
    state.lastFailedFileKeys = [];
    if (state.activePanel) renderPanelContents(state.activePanel.querySelector('.sccb-panel'));
    const basket = loadBasket();
    for (const file of files) {
      state.downloadQueue.current = file.fileName;
      updateDownloadQueueItem(file.key, 'running');
      try {
        if (!file.url) throw new Error('Missing URL');
        if (mode === 'tabs') window.open(file.url, '_blank', 'noopener');
        else triggerDownload(file.url);
        updateFileDownloadStatus(basket, file.key, mode === 'tabs' ? 'opened' : 'downloaded');
        updateDownloadQueueItem(file.key, mode === 'tabs' ? 'opened' : 'downloaded');
        state.downloadQueue.done++;
      } catch (error) {
        updateFileDownloadStatus(basket, file.key, 'failed');
        updateDownloadQueueItem(file.key, 'failed');
        state.downloadQueue.failed++;
        state.lastFailedFileKeys.push(file.key);
      }
      if (state.activePanel) renderPanelContents(state.activePanel.querySelector('.sccb-panel'));
      await delay(DOWNLOAD_DELAY_MS);
    }
    saveBasket(basket);
    const failed = state.downloadQueue.failed;
    toast(failed ? `${state.downloadQueue.done} opened · ${failed} failed. Use Retry failed or Copy failed links.` : `${state.downloadQueue.done} download link${state.downloadQueue.done === 1 ? '' : 's'} opened.` , Boolean(failed));
    if (state.activePanel) renderPanelContents(state.activePanel.querySelector('.sccb-panel'));
  }

  function renderDownloadQueueState() {
    const q = state.downloadQueue;
    const box = document.createElement('section');
    box.className = 'sccb-queue-state';
    if (!q) return box;
    box.innerHTML = `<strong>${q.failed ? 'Download queue completed with failures' : q.done >= q.total ? 'Download queue complete' : 'Downloading'}</strong><span>${q.done} of ${q.total}${q.failed ? ` · ${q.failed} failed` : ''}</span>${q.current ? `<span>Current: ${escapeHtml(q.current)}</span>` : ''}`;
    if (q.failed) box.appendChild(makeButton('Retry failed', '', () => retryFailedDownloads()));
    return box;
  }

  function updateDownloadQueueItem(key, status) {
    const item = state.downloadQueue?.items?.find(entry => entry.key === key);
    if (item) item.status = status;
  }

  function retryFailedDownloads() {
    const failed = state.lastFailedFileKeys?.length ? state.lastFailedFileKeys : getAllFiles().filter(file => file.downloadStatus === 'failed').map(file => file.key);
    if (!failed.length) return toast('No failed downloads to retry.');
    return runDownloadQueue('download', failed);
  }

  function updateFileDownloadStatus(basket, fileKey, status) {
    updateFileInBasketObject(basket, fileKey, file => ({ ...file, downloadStatus: status, lastTriedAt: Date.now() }));
  }

  function showBasketHealthCheck() {
    const basket = loadBasket();
    const files = getAllFiles(basket);
    const duplicateGroups = findDuplicateGroups(basket, LIKELY_DUPLICATE_SCORE);
    const stale = files.filter(isFileStale);
    const missingUrl = files.filter(file => !file.url);
    const missingName = files.filter(file => !file.fileName);
    const loginMaybe = files.filter(file => /login|signin|account|member/i.test(file.url || ''));
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'sccb-modal-backdrop';
    const modal = document.createElement('section');
    modal.className = 'sccb-file-modal';
    overlay.appendChild(modal);
    modal.innerHTML = `<div class="sccb-sheet-handle"></div><header class="sccb-modal-header"><div><h2>Basket health check</h2><div class="sccb-muted">Quick reliability summary.</div></div></header>`;
    modal.querySelector('.sccb-modal-header').appendChild(iconButton('×', 'Close', closeModal));
    const body = document.createElement('div');
    body.className = 'sccb-modal-body sccb-health-grid';
    [
      ['Files', files.length], ['Missing URLs', missingUrl.length], ['Missing names', missingName.length],
      ['Stale links', stale.length], ['Duplicate groups', duplicateGroups.length], ['Possible login-gated', loginMaybe.length]
    ].forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = value ? 'sccb-health-item warn' : 'sccb-health-item';
      item.innerHTML = `<strong>${value}</strong><span>${label}</span>`;
      body.appendChild(item);
    });
    modal.appendChild(body);
    const actions = document.createElement('footer');
    actions.className = 'sccb-modal-actions';
    actions.appendChild(makeButton('Refresh stale', '', async () => { await refreshStaleFiles(stale); closeModal(); showBasketHealthCheck(); }));
    actions.appendChild(makeButton('Review duplicates', '', () => { closeModal(); showDuplicateReview(); }));
    actions.appendChild(makeButton('Close', 'primary', closeModal));
    modal.appendChild(actions);
    document.body.appendChild(overlay);
    state.activeModal = overlay;
  }

  function showBasketDiagnostics() {
    const basket = loadBasket();
    const files = getAllFiles(basket);
    const index = ensureBasketIndex(basket);
    const payload = {
      site: adapter?.id,
      modCount: Object.keys(basket.mods || {}).length,
      fileCount: files.length,
      selectedCount: files.filter(file => file.selected !== false).length,
      sessions: ensureBasketSessions(basket),
      duplicateGroups: findDuplicateGroups(basket, POSSIBLE_DUPLICATE_SCORE).length,
      duplicateIndexEntries: Object.keys(basket.duplicateIndex || {}).reduce((n, key) => n + Object.keys(basket.duplicateIndex[key] || {}).length, 0),
      storageBytes: JSON.stringify(basket).length,
      lastSave: basket.updatedAt ? new Date(basket.updatedAt).toLocaleString() : '',
      fileKeyIndex: index.fileKeys?.size || 0,
      pageType: state.pageType,
      mode: getSettings().safeMode,
    };
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'sccb-modal-backdrop';
    const modal = document.createElement('section');
    modal.className = 'sccb-file-modal';
    overlay.appendChild(modal);
    modal.innerHTML = `<div class="sccb-sheet-handle"></div><header class="sccb-modal-header"><div><h2>Basket diagnostics</h2><div class="sccb-muted">Storage and index details for debugging.</div></div></header>`;
    modal.querySelector('.sccb-modal-header').appendChild(iconButton('×', 'Close', closeModal));
    const pre = document.createElement('pre');
    pre.className = 'sccb-diagnostics-pre';
    pre.textContent = JSON.stringify(payload, null, 2);
    const body = document.createElement('div');
    body.className = 'sccb-modal-body';
    body.appendChild(pre);
    modal.appendChild(body);
    const actions = document.createElement('footer');
    actions.className = 'sccb-modal-actions';
    actions.appendChild(makeButton('Copy diagnostics', '', () => copyText(pre.textContent).then(() => toast('Diagnostics copied.'))));
    actions.appendChild(makeButton('Close', 'primary', closeModal));
    modal.appendChild(actions);
    document.body.appendChild(overlay);
    state.activeModal = overlay;
  }

  function exportBasketFormat(kind) {
    const basket = loadBasket();
    const files = getSelectedFiles(basket);
    if (!files.length && kind !== 'json') return toast('No selected files to export.', true);
    let content = '';
    let extension = 'txt';
    if (kind === 'json') { content = JSON.stringify(basket, null, 2); extension = 'json'; }
    else if (kind === 'markdown') { content = basketToMarkdown(basket, true); extension = 'md'; }
    else if (kind === 'csv') { content = basketToCsv(files); extension = 'csv'; }
    else if (kind === 'aria2') { content = files.map(file => `${file.url}\n  out=${sanitizeFilename(file.fileName || 'download')}`).join('\n'); extension = 'txt'; }
    else if (kind === 'jdownloader') { content = files.map(file => file.url).join('\n'); extension = 'txt'; }
    else { content = files.map(file => file.url).join('\n'); extension = 'txt'; }
    if (!content) return toast('Nothing to export.', true);
    downloadText(`sims-cc-basket-${kind}-${dateStamp()}.${extension}`, content);
  }

  function exportTextFile(kind) { exportBasketFormat(kind === 'json' ? 'json' : 'txt'); }

  function basketToCsv(files) {
    const header = ['site','mod','creator','file','size','url','session','tags','note'];
    const rows = files.map(file => [file.siteName || file.site, file.modTitle, file.creator, file.fileName, file.size, file.url, file.session || 'Default', (file.tags || []).join('|'), file.note || '']);
    return [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  }

  function csvCell(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function clearBasket() {
    if (!getAllFiles().length) return toast('Basket is already empty.');
    const basket = loadBasket();
    gmSet(`${STORAGE_KEY}.backup.previous`, JSON.stringify(basket));
    if (!confirm('Clear the entire Sims CC basket? Export a backup first if you may need it.')) return;
    saveBasket({ version: VERSION, updatedAt: Date.now(), mods: {}, choices: {}, sessions: ['Default'] }, { immediate: true });
    updateEveryButtonState();
    toastWithUndo('Basket cleared.', () => { const raw = gmGet(`${STORAGE_KEY}.backup.previous`, ''); if (raw) { gmSet(STORAGE_KEY, raw); updateEveryButtonState(); toast('Basket restored.'); } }, 'Undo');
  }

  function bindGlobalKeys() {
    document.addEventListener('keydown', event => {
      const target = event.target;
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || '') || target?.isContentEditable;
      if (event.key === 'Escape') {
        if (state.activeModal) closeModal();
        else if (state.activePanel) closePanel();
        return;
      }
      if (typing) return;
      if (event.key?.toLowerCase() === 'b') { event.preventDefault(); togglePanel(); }
      if (event.key === '/') { event.preventDefault(); if (!state.activePanel) showPanel(); setTimeout(() => document.querySelector('.sccb-basket-search')?.focus(), 0); }
      if (event.key?.toLowerCase() === 'd') { event.preventDefault(); showDownloadPlan('download'); }
      if ((event.ctrlKey || event.metaKey) && event.key?.toLowerCase() === 'a' && state.activePanel) { event.preventDefault(); setAllVisibleSelection(true); }
      if ((event.key === 'Delete' || event.key === 'Backspace') && state.activePanel) { event.preventDefault(); removeSelected(); }
    });
  }

  function updateFileMeta(fileKey, patch) {
    const basket = loadBasket();
    updateFileInBasketObject(basket, fileKey, file => ({ ...file, ...patch }));
    saveBasket(basket);
    updateEveryButtonState();
  }

  function setAllVisibleSelection(selected) {
    const basket = loadBasket();
    const files = getFilteredBasketFiles(basket, getSettings());
    const keys = new Set(files.map(file => file.key));
    for (const mod of Object.values(basket.mods || {})) for (const file of Object.values(mod.files || {})) if (keys.has(file.key)) file.selected = selected;
    saveBasket(basket);
    updateEveryButtonState();
  }

  function selectBySite() {
    const site = prompt('Select all files from which site? Use mts, simblr, tsr, or all:');
    if (!site) return;
    const wanted = site.trim().toLowerCase();
    const basket = loadBasket();
    for (const mod of Object.values(basket.mods || {})) for (const file of Object.values(mod.files || {})) file.selected = wanted === 'all' || file.site === wanted;
    saveBasket(basket);
    updateEveryButtonState();
  }

  function ensureBasketSessions(basket = loadBasket()) {
    const set = new Set(['Default']);
    (basket.sessions || []).forEach(name => { const clean = cleanText(name); if (clean) set.add(clean); });
    for (const file of getAllFilesFromBasketObject(basket)) set.add(file.session || 'Default');
    basket.sessions = [...set];
    return basket.sessions;
  }

  function createBasketSession() {
    const name = cleanText(prompt('New basket/session name:'));
    if (!name) return;
    const basket = loadBasket();
    ensureBasketSessions(basket);
    if (!basket.sessions.includes(name)) basket.sessions.push(name);
    saveBasket(basket);
    updateBasketSetting('activeBasketSession', name);
  }

  function moveSelectedToSession() {
    const basket = loadBasket();
    ensureBasketSessions(basket);
    const name = cleanText(prompt('Move selected files to which session?', getSettings().activeBasketSession === 'all' ? 'Default' : getSettings().activeBasketSession || 'Default'));
    if (!name) return;
    for (const mod of Object.values(basket.mods || {})) for (const file of Object.values(mod.files || {})) if (file.selected !== false) file.session = name;
    if (!basket.sessions.includes(name)) basket.sessions.push(name);
    saveBasket(basket);
    updateBasketSetting('activeBasketSession', name);
  }

  function refreshModFiles(modKey) {
    const basket = loadBasket();
    const mod = basket.mods?.[modKey];
    if (!mod) return toast('Mod not found.', true);
    return refreshStaleFiles(Object.values(mod.files || {}).map(file => ({ ...file, updatedAt: 0 }))).then(() => updateEveryButtonState());
  }

  function removeFilesByKey(keys) {
    const basket = loadBasket();
    const set = new Set(keys);
    for (const [modKey, mod] of Object.entries(basket.mods || {})) {
      for (const fileKey of Object.keys(mod.files || {})) if (set.has(fileKey)) delete mod.files[fileKey];
      if (!Object.keys(mod.files || {}).length) delete basket.mods[modKey];
    }
    saveBasket(basket);
    updateEveryButtonState();
  }

  function isFileStale(file) { return Date.now() - (file.updatedAt || file.addedAt || 0) > STALE_AFTER_MS; }
  function sumSize(files) { return files.reduce((sum, file) => sum + (Number(file.sizeBytes) || 0), 0); }
  function countSelected(files) { return files.filter(file => file.selected !== false).length; }
  function duplicateWeight(files) { return files.reduce((max, file) => Math.max(max, findDuplicateCandidates(file).filter(match => match.file.key !== file.key)[0]?.score || 0), 0); }
  function statusLabel(status) { return status === 'downloaded' ? 'Downloaded' : status === 'opened' ? 'Opened' : status === 'failed' ? 'Failed' : status; }
  function simpleChip(label, kind) { const span = document.createElement('span'); span.className = `sccb-mini-chip ${kind || ''}`; span.textContent = label; return span; }
  function sanitizeFilename(name) { return cleanText(name).replace(/[\\/:*?"<>|]+/g, '_') || 'download'; }

  function toastWithUndo(message, undo, undoLabel = 'Undo') {
    const node = document.createElement('div');
    node.className = 'sccb-toast sccb-toast-action';
    const span = document.createElement('span');
    span.textContent = message;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = undoLabel;
    button.addEventListener('click', () => { try { undo?.(); } finally { node.remove(); } });
    node.append(span, button);
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 7000);
  }

  function setFileSelection(fileKey, selected) {
    const basket = loadBasket();
    for (const mod of Object.values(basket.mods || {})) {
      if (mod.files?.[fileKey]) {
        mod.files[fileKey].selected = selected;
        mod.updatedAt = Date.now();
        break;
      }
    }
    saveBasket(basket);
    updateEveryButtonState();
  }

  function setModSelection(modKey, selected) {
    const basket = loadBasket();
    const mod = basket.mods[modKey];
    if (mod) {
      Object.values(mod.files || {}).forEach(file => { file.selected = selected; });
      mod.updatedAt = Date.now();
      saveBasket(basket);
      updateEveryButtonState();
    }
  }

  function removeFile(fileKey) {
    const basket = loadBasket();
    for (const [modKey, mod] of Object.entries(basket.mods || {})) {
      if (mod.files?.[fileKey]) {
        delete mod.files[fileKey];
        mod.updatedAt = Date.now();
        if (!Object.keys(mod.files).length) delete basket.mods[modKey];
        break;
      }
    }
    saveBasket(basket);
    updateEveryButtonState();
  }

  function removeMod(modKey) {
    const basket = loadBasket();
    delete basket.mods[modKey];
    saveBasket(basket);
    updateEveryButtonState();
  }

  function removeSelected() {
    const basket = loadBasket();
    let removed = 0;
    for (const [modKey, mod] of Object.entries(basket.mods || {})) {
      for (const [fileKey, file] of Object.entries(mod.files || {})) {
        if (file.selected !== false) {
          delete mod.files[fileKey];
          removed++;
        }
      }
      if (!Object.keys(mod.files).length) delete basket.mods[modKey];
    }
    saveBasket(basket);
    updateEveryButtonState();
    toast(removed ? `Removed ${removed} selected file${removed === 1 ? '' : 's'}.` : 'No files selected.', !removed);
  }

  async function refreshStaleFiles(files) {
    const stale = files.filter(file => Date.now() - (file.updatedAt || 0) > STALE_AFTER_MS);
    if (!stale.length) return files;

    const basket = loadBasket();
    const groups = new Map();
    for (const file of stale) {
      const key = `${file.site}:${file.modId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(file);
    }

    let refreshed = 0;
    for (const [modKey, group] of groups) {
      const mod = basket.mods[modKey];
      if (!mod?.url) continue;
      const siteAdapter = getAdapter(mod.url);
      if (!siteAdapter) continue;
      try {
        const result = await getModDownloadInfo(mod.url, { force: true, titleHint: mod.title });
        mergeModInfoIntoBasketMod(mod, result);
        for (const oldFile of group) {
          const fresh = result.files.find(file => file.fileId === oldFile.fileId);
          if (!fresh) continue;
          const existing = mod.files[oldFile.key];
          if (!existing) continue;
          existing.url = fresh.url;
          existing.fileName = fresh.fileName || existing.fileName;
          existing.size = fresh.size || existing.size;
          existing.sizeBytes = fresh.sizeBytes || existing.sizeBytes;
          existing.type = fresh.type || existing.type;
          existing.updatedAt = Date.now();
          refreshed++;
        }
        mod.updatedAt = Date.now();
      } catch (error) {
        console.warn(`[${APP}] Refresh failed for ${modKey}`, error);
      }
    }
    if (refreshed) {
      saveBasket(basket);
      toast(`Refreshed ${refreshed} stale download link${refreshed === 1 ? '' : 's'}.`);
    }
    return getSelectedFiles(loadBasket());
  }

  async function copySelectedLinks() {
    const files = getSelectedFiles();
    if (!files.length) return toast('No files selected.', true);
    await copyText(files.map(file => file.url).join('\n'));
    toast(`Copied ${files.length} selected link${files.length === 1 ? '' : 's'}.`);
  }

  async function copyMarkdown() {
    const basket = loadBasket();
    const markdown = basketToMarkdown(basket, true);
    if (!markdown) return toast('Basket is empty.', true);
    await copyText(markdown);
    toast('Copied basket as Markdown.');
  }

  function importJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = normalizeBasket(JSON.parse(String(reader.result || '{}')));
          const current = loadBasket();
          let added = 0;
          for (const mod of Object.values(imported.mods || {})) {
            for (const importedFile of Object.values(mod.files || {})) {
              if (!fileInBasket(current, importedFile.key)) {
                addNormalizedFileToBasketObject(current, importedFile, true);
                delete current._index;
                added++;
              }
            }
          }
          current.choices = { ...(current.choices || {}), ...(imported.choices || {}) };
          saveBasket(current);
          updateEveryButtonState();
          toast(`Imported ${added} new file${added === 1 ? '' : 's'}.`);
        } catch (error) {
          toast(`Import failed: ${error.message || error}`, true);
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  function basketToMarkdown(basket, selectedOnly = false) {
    const lines = [];
    for (const mod of Object.values(basket.mods || {})) {
      const files = Object.values(mod.files || {}).filter(file => !selectedOnly || file.selected !== false);
      if (!files.length) continue;
      lines.push(`## ${mod.title}`);
      lines.push(`- Site: ${mod.siteName || mod.site}`);
      if (mod.url) lines.push(`- Page: ${mod.url}`);
      for (const file of files) {
        lines.push(`- ${file.fileName}${file.size ? ` (${file.size})` : ''}`);
        lines.push(`  ${file.url}`);
      }
      lines.push('');
    }
    return lines.join('\n').trim();
  }

  function triggerDownload(url) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener';
    anchor.download = '';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => anchor.remove(), 1000);
  }

  function requestText(url) {
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          headers: { Accept: 'text/html,application/xhtml+xml' },
          anonymous: false,
          onload: response => {
            if (response.status >= 200 && response.status < 400) resolve(response.responseText || '');
            else reject(new Error(`HTTP ${response.status}`));
          },
          onerror: () => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Network timeout')),
        });
      });
    }
    return fetch(url, { credentials: 'include', cache: 'no-store', headers: { Accept: 'text/html,application/xhtml+xml' } })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      });
  }

  function gmGet(key, fallback) {
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(key, fallback);
      return localStorage.getItem(key) ?? fallback;
    } catch { return fallback; }
  }

  function gmSet(key, value) {
    try {
      if (typeof GM_setValue === 'function') return GM_setValue(key, value);
      localStorage.setItem(key, value);
    } catch (error) { console.warn(`[${APP}] Storage failed`, error); }
  }

  function gmDelete(key) {
    try {
      if (typeof GM_deleteValue === 'function') return GM_deleteValue(key);
      localStorage.removeItem(key);
    } catch {}
  }

  function getCache(cacheKey) {
    try {
      const raw = gmGet(CACHE_KEY, '{}');
      const cache = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return cache?.[cacheKey] || null;
    } catch { return null; }
  }

  function setCache(cacheKey, value) {
    try {
      const raw = gmGet(CACHE_KEY, '{}');
      const cache = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
      cache[cacheKey] = value;
      const cutoff = Date.now() - 3 * (Number(getSettings().cacheTtlMs) || DEFAULT_CACHE_TTL_MS);
      for (const [key, item] of Object.entries(cache)) {
        if (!item?.fetchedAt || item.fetchedAt < cutoff) delete cache[key];
      }
      gmSet(CACHE_KEY, JSON.stringify(cache));
    } catch (error) { console.warn(`[${APP}] Cache write failed`, error); }
  }

  function normalizeCachedResult(result) {
    return {
      ...result,
      descriptionText: capStoredDescription(result.descriptionText || result.description || ''),
      descriptionPreview: result.descriptionPreview || makeDescriptionPreview(result.descriptionText || result.description || ''),
      files: (result.files || []).map(file => normalizeFile(file)),
    };
  }

  function migrateOldData() {
    const current = gmGet(STORAGE_KEY, '');
    if (current) return;
    try {
      const raw = localStorage.getItem(OLD_MTS_LOCALSTORAGE_KEY);
      if (!raw) return;
      const oldItems = JSON.parse(raw);
      if (!Array.isArray(oldItems) || !oldItems.length) return;
      const basket = normalizeBasket(oldItems);
      gmSet(STORAGE_KEY, JSON.stringify(basket));
      toastSoon(`Migrated ${getAllFiles(basket).length} old MTS basket file${getAllFiles(basket).length === 1 ? '' : 's'}.`);
    } catch {}
  }

  function getSettings() {
    const defaults = defaultSettings();
    try {
      const raw = gmGet(SETTINGS_KEY, '');
      const parsed = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
      return { ...defaults, ...parsed };
    } catch { return defaults; }
  }

  function saveSettings(settings) {
    gmSet(SETTINGS_KEY, JSON.stringify({ ...defaultSettings(), ...settings }));
  }

  function defaultSettings() {
    return {
      siteUi: true,
      safeMode: 'full',
      debugUi: false,
      basketUi: true,
      rewriteNativeCards: true,
      themeMts: true,
      themeSimblr: true,
      themeTsr: true,
      warnCrossSiteDuplicates: true,
      autoSkipHighConfidence: true,
      preferredSource: 'mts',
      resolveFinalUrls: false,
      resolveBeforeDownload: false,
      resolveOnMobile: false,
      verifySha256OptIn: false,
      concurrencyDesktop: 4,
      concurrencyMobile: 2,
      cacheTtlMs: DEFAULT_CACHE_TTL_MS,
      gridDensity: 'comfortable',
      gridCardMin: 220,
      basketView: 'compact',
      basketSort: 'addedDesc',
      basketFilter: 'all',
      basketSiteFilter: 'all',
      basketSearch: '',
      activeBasketSession: 'Default',
    };
  }

  function getFetchConcurrency(settings = getSettings()) {
    const value = isMobileViewport() ? settings.concurrencyMobile : settings.concurrencyDesktop;
    return Math.max(1, Math.min(8, Number(value) || (isMobileViewport() ? 2 : 4)));
  }

  function isMobileViewport() {
    return Boolean(window.matchMedia?.('(max-width: 640px)').matches);
  }

  async function mapWithConcurrency(items, concurrency, worker, onError) {
    const results = new Array(items.length);
    let cursor = 0;
    const count = Math.max(1, Math.min(Number(concurrency) || 1, items.length || 1));
    async function run() {
      while (cursor < items.length) {
        const index = cursor++;
        try { results[index] = await worker(items[index], index); }
        catch (error) { results[index] = onError ? await onError(error, items[index], index) : Promise.reject(error); }
      }
    }
    await Promise.all(Array.from({ length: count }, run));
    return results;
  }

  function normalizeFileNameForDuplicate(name) {
    const original = cleanText(decodeMaybe(name));
    const ext = extensionOf(original);
    let base = ext ? original.replace(new RegExp(`\\.${escapeRegExp(ext)}$`, 'i'), '') : original;
    base = base
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\b(modthesims|mod\s*the\s*sims|simblr\.cc|simblrcc|the\s*sims\s*resource|thesimsresource|tsr|sims?\s*3|ts3|s3)\b/g, '')
      .replace(/\bmts[_\-\s]*/g, '')
      .replace(/\bby[_\-\s]+[a-z0-9_ -]{2,40}$/g, '')
      .replace(/\b[a-z0-9_ -]*-\d{5,}-/g, '')
      .replace(/\b\d{5,}\b/g, '')
      .replace(/\b(v|ver|version)\s*\d+(?:\.\d+)*\b/g, '')
      .replace(/\b(final|fixed|new|updated|download)\b/g, '')
      .replace(/[^a-z0-9]+/g, '');
    return `${base}${ext ? `.${ext.toLowerCase()}` : ''}`.trim();
  }

  function normalizeTitleKey(title) {
    return cleanText(title).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function normalizeCreatorKey(creator) {
    return cleanText(creator).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '').trim();
  }

  function canonicalizeDownloadUrl(rawUrl, site = '') {
    try {
      const url = new URL(rawUrl, location.href);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (site === 'mts' || host === 'modthesims.info' || host.endsWith('.modthesims.info')) {
        const file = url.searchParams.get('file');
        if (file) return `mts:getfile:${file}`;
      }
      if (site === 'simblr' || host === 'simblr.cc') {
        const match = url.pathname.match(/\/download\/(\d+)/i);
        if (match) return `simblr:download:${match[1]}`;
      }
      return canonicalizeGenericUrl(url.href);
    } catch { return ''; }
  }

  function canonicalizeGenericUrl(rawUrl) {
    try {
      const url = new URL(rawUrl, location.href);
      url.hash = '';
      const drop = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'v', 'cache', 'cb', '_'];
      drop.forEach(param => url.searchParams.delete(param));
      url.hostname = url.hostname.replace(/^www\./, '').toLowerCase();
      const entries = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
      url.search = '';
      for (const [key, value] of entries) url.searchParams.append(key, value);
      return url.href.replace(/\/$/, '');
    } catch { return cleanText(rawUrl); }
  }

  async function resolveNetworkMetaForFile(file, options = {}) {
    const normalized = normalizeFile(file);
    const cacheKey = normalized.key;
    if (!options.force && normalized.networkMeta?.checkedAt && Date.now() - normalized.networkMeta.checkedAt < DEFAULT_CACHE_TTL_MS) return normalized;
    if (networkMetaInflight.has(cacheKey)) return networkMetaInflight.get(cacheKey);
    const promise = (async () => {
      const meta = await requestHeadMeta(normalized.url);
      const merged = normalizeFile({
        ...normalized,
        fileName: meta.contentDispositionName || normalized.fileName,
        size: normalized.size || (meta.contentLength ? formatBytes(meta.contentLength) : ''),
        sizeBytes: normalized.sizeBytes || meta.contentLength || 0,
        networkMeta: { ...(normalized.networkMeta || {}), ...meta, checkedAt: Date.now() },
        updatedAt: Date.now(),
      });
      updateStoredFile(merged.key, () => merged, { silent: true });
      return merged;
    })();
    networkMetaInflight.set(cacheKey, promise);
    try { return await promise; }
    catch (error) {
      if (!options.silent) toast(`Metadata check failed for ${normalized.fileName}: ${error.message || error}`, true);
      return normalized;
    } finally { networkMetaInflight.delete(cacheKey); }
  }

  function requestHeadMeta(url) {
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'HEAD',
          url,
          anonymous: false,
          onload: response => {
            if (response.status >= 200 && response.status < 400) resolve(parseResponseHeaders(response.responseHeaders || '', response.finalUrl || url));
            else reject(new Error(`HTTP ${response.status}`));
          },
          onerror: () => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Network timeout')),
        });
      });
    }
    return fetch(url, { method: 'HEAD', credentials: 'include', cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return {
        finalUrl: response.url || url,
        contentLength: Number(response.headers.get('content-length')) || 0,
        contentDispositionName: fileNameFromDisposition(response.headers.get('content-disposition') || ''),
        etag: response.headers.get('etag') || '',
        lastModified: response.headers.get('last-modified') || '',
      };
    });
  }

  function parseResponseHeaders(headersText, finalUrl) {
    const headers = {};
    String(headersText || '').split(/\r?\n/).forEach(line => {
      const idx = line.indexOf(':');
      if (idx > -1) headers[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
    });
    return {
      finalUrl,
      contentLength: Number(headers['content-length']) || 0,
      contentDispositionName: fileNameFromDisposition(headers['content-disposition'] || ''),
      etag: headers.etag || '',
      lastModified: headers['last-modified'] || '',
    };
  }

  function fileNameFromDisposition(value) {
    const star = value.match(/filename\*=UTF-8''([^;]+)/i);
    if (star) return cleanText(decodeMaybe(star[1].replace(/"/g, '')));
    const plain = value.match(/filename="?([^";]+)"?/i);
    return plain ? cleanText(decodeMaybe(plain[1])) : '';
  }

  async function resolveMetadataForSelected() {
    let files = getSelectedFiles();
    if (!files.length) return toast('No files selected.', true);
    toast(`Checking metadata for ${files.length} selected file${files.length === 1 ? '' : 's'}…`);
    files = await mapWithConcurrency(files, Math.min(getFetchConcurrency(), 3), file => resolveNetworkMetaForFile(file, { force: true, silent: true }));
    const basket = loadBasket();
    files.forEach(file => updateFileInBasketObject(basket, file.key, () => file));
    saveBasket(basket);
    updateEveryButtonState();
    toast(`Metadata updated for ${files.length} file${files.length === 1 ? '' : 's'}.`);
  }

  async function resolveMetadataForFileList(files) {
    const resolved = await mapWithConcurrency(files, Math.min(getFetchConcurrency(), 3), file => resolveNetworkMetaForFile(file, { force: false, silent: true }), () => null);
    const cleaned = resolved.filter(Boolean);
    if (cleaned.length) {
      const basket = loadBasket();
      cleaned.forEach(file => updateFileInBasketObject(basket, file.key, () => file));
      saveBasket(basket);
      return cleaned;
    }
    return files;
  }

  async function verifySelectedHashes() {
    const settings = getSettings();
    if (!settings.verifySha256OptIn) {
      const ok = confirm('Verify duplicates downloads selected files in the background to compare exact SHA-256 checksums. Enable this now?');
      if (!ok) return;
      saveSettings({ ...settings, verifySha256OptIn: true });
    }
    const files = getSelectedFiles();
    if (!files.length) return toast('No files selected.', true);
    toast(`Verifying ${files.length} checksum${files.length === 1 ? '' : 's'}…`);
    let done = 0;
    const verified = await mapWithConcurrency(files, isMobileViewport() ? 1 : 2, async file => {
      const result = await hashFile(file);
      done++;
      toast(`Verified ${done}/${files.length}: ${file.fileName}`);
      return result;
    }, error => {
      console.warn(`[${APP}] hash failed`, error);
      return null;
    });
    const basket = loadBasket();
    let count = 0;
    for (const file of verified.filter(Boolean)) {
      updateFileInBasketObject(basket, file.key, () => file);
      count++;
    }
    saveBasket(basket);
    updateEveryButtonState();
    toast(`SHA-256 verified for ${count} file${count === 1 ? '' : 's'}.`);
  }

  async function hashFile(file) {
    const normalized = normalizeFile(file);
    if (normalized.contentSha256) return normalized;
    if (hashInflight.has(normalized.key)) return hashInflight.get(normalized.key);
    const promise = (async () => {
      const buffer = await requestArrayBuffer(normalized.url);
      const hash = await sha256Hex(buffer);
      return normalizeFile({ ...normalized, contentSha256: hash, updatedAt: Date.now() });
    })();
    hashInflight.set(normalized.key, promise);
    try { return await promise; }
    finally { hashInflight.delete(normalized.key); }
  }

  function requestArrayBuffer(url) {
    if (typeof GM_xmlhttpRequest === 'function') {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url,
          responseType: 'arraybuffer',
          anonymous: false,
          onload: response => {
            if (response.status >= 200 && response.status < 400) resolve(response.response);
            else reject(new Error(`HTTP ${response.status}`));
          },
          onerror: () => reject(new Error('Network error')),
          ontimeout: () => reject(new Error('Network timeout')),
        });
      });
    }
    return fetch(url, { credentials: 'include', cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer();
    });
  }

  async function sha256Hex(buffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function updateStoredFile(fileKey, updater, options = {}) {
    const basket = loadBasket();
    const changed = updateFileInBasketObject(basket, fileKey, updater);
    if (changed) {
      saveBasket(basket);
      if (!options.silent) updateEveryButtonState();
    }
    return changed;
  }

  function updateFileInBasketObject(basket, fileKey, updater) {
    for (const mod of Object.values(basket.mods || {})) {
      if (mod.files?.[fileKey]) {
        const next = updater(mod.files[fileKey]);
        mod.files[fileKey] = normalizeFile(next || mod.files[fileKey]);
        mod.updatedAt = Date.now();
        return true;
      }
    }
    return false;
  }

  function findDuplicateGroups(basket = loadBasket(), minScore = LIKELY_DUPLICATE_SCORE) {
    const files = getAllFilesFromBasketObject(basket).map(file => normalizeFile(file));
    const parent = new Map(files.map(file => [file.key, file.key]));
    const find = key => {
      let root = parent.get(key) || key;
      while (parent.get(root) && parent.get(root) !== root) root = parent.get(root);
      let cur = key;
      while (parent.get(cur) && parent.get(cur) !== root) { const next = parent.get(cur); parent.set(cur, root); cur = next; }
      return root;
    };
    const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(rb, ra); };
    const pairScores = new Map();
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const score = scoreDuplicatePair(files[i], files[j]);
        if (score.score >= minScore) {
          union(files[i].key, files[j].key);
          pairScores.set(`${files[i].key}|${files[j].key}`, score);
        }
      }
    }
    const groups = new Map();
    for (const file of files) {
      const root = find(file.key);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(file);
    }
    return [...groups.values()].filter(group => group.length > 1).map(group => ({
      files: group,
      best: preferredFile(group),
      score: maxGroupScore(group),
      reason: groupReason(group),
    })).sort((a, b) => b.score - a.score);
  }

  function maxGroupScore(group) {
    let score = 0;
    for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) score = Math.max(score, scoreDuplicatePair(group[i], group[j]).score);
    return score;
  }

  function groupReason(group) {
    let best = { score: 0, reason: '' };
    for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
      const scored = scoreDuplicatePair(group[i], group[j]);
      if (scored.score > best.score) best = scored;
    }
    return best.reason;
  }

  function showDuplicateReview() {
    const groups = findDuplicateGroups(loadBasket(), LIKELY_DUPLICATE_SCORE);
    if (!groups.length) return toast('No likely duplicates found. Try Resolve metadata or Verify duplicates for stronger checks.');
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'sccb-modal-backdrop';
    overlay.tabIndex = -1;
    const modal = document.createElement('section');
    modal.className = 'sccb-file-modal';
    overlay.appendChild(modal);
    const handle = document.createElement('div');
    handle.className = 'sccb-sheet-handle';
    modal.appendChild(handle);
    const header = document.createElement('header');
    header.className = 'sccb-modal-header';
    header.innerHTML = `<div><h2>Review duplicates</h2><div class="sccb-muted">${groups.length} likely duplicate group${groups.length === 1 ? '' : 's'} found.</div></div>`;
    header.appendChild(iconButton('×', 'Close', () => closeModal()));
    modal.appendChild(header);
    const body = document.createElement('div');
    body.className = 'sccb-modal-body';
    modal.appendChild(body);
    groups.forEach((group, groupIndex) => {
      const section = document.createElement('section');
      section.className = 'sccb-choice-group sccb-dupe-group';
      section.dataset.group = String(groupIndex);
      const head = document.createElement('div');
      head.className = 'sccb-dupe-heading';
      head.textContent = `Likely same file · ${group.score} · ${group.reason}`;
      section.appendChild(head);
      group.files.forEach(file => {
        const label = document.createElement('label');
        label.className = 'sccb-file-choice';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = file.key === group.best.key;
        input.dataset.fileKey = file.key;
        label.appendChild(input);
        const text = document.createElement('span');
        text.innerHTML = `<span class="sccb-choice-file-name">${escapeHtml(file.fileName)}</span><span class="sccb-choice-file-meta">${escapeHtml(file.siteName || file.site)} · ${escapeHtml(file.modTitle)}${file.size ? ` · ${escapeHtml(file.size)}` : ''}</span>`;
        label.appendChild(text);
        section.appendChild(label);
      });
      body.appendChild(section);
    });
    const actions = document.createElement('footer');
    actions.className = 'sccb-modal-actions';
    modal.appendChild(actions);
    actions.appendChild(makeButton('Keep preferred source', 'primary', () => {
      const keep = new Set(groups.map(group => preferredFile(group.files).key));
      removeDuplicateGroups(groups, keep);
      closeModal();
    }));
    actions.appendChild(makeButton('Keep checked', '', () => {
      const keep = new Set([...body.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.dataset.fileKey));
      removeDuplicateGroups(groups, keep);
      closeModal();
    }));
    actions.appendChild(makeButton('Keep MTS', '', () => { removeDuplicateGroups(groups, new Set(groups.flatMap(g => g.files.filter(f => f.site === 'mts').map(f => f.key)))); closeModal(); }));
    actions.appendChild(makeButton('Keep Simblr', '', () => { removeDuplicateGroups(groups, new Set(groups.flatMap(g => g.files.filter(f => f.site === 'simblr').map(f => f.key)))); closeModal(); }));
    actions.appendChild(makeButton('Keep both', '', () => closeModal()));
    document.body.appendChild(overlay);
    state.activeModal = overlay;
    setTimeout(() => overlay.focus(), 0);
  }

  function removeDuplicateGroups(groups, keepKeys) {
    const basket = loadBasket();
    let removed = 0;
    for (const group of groups) {
      const groupKeys = group.files.map(file => file.key);
      const keepInGroup = groupKeys.filter(key => keepKeys.has(key));
      if (!keepInGroup.length) continue;
      for (const key of groupKeys) {
        if (!keepKeys.has(key)) {
          for (const mod of Object.values(basket.mods || {})) {
            if (mod.files?.[key]) { delete mod.files[key]; removed++; }
          }
        }
      }
    }
    for (const [modKey, mod] of Object.entries(basket.mods || {})) if (!Object.keys(mod.files || {}).length) delete basket.mods[modKey];
    saveBasket(basket);
    updateEveryButtonState();
    toast(removed ? `Removed ${removed} duplicate file${removed === 1 ? '' : 's'}.` : 'No duplicate files removed.');
  }

  function runBrokenLayoutRecovery(pageType = state.pageType) {
    const settings = getSettings();
    if (!canRewriteNative(settings) || state.layoutRecoveryShown) return;
    const renderedCards = document.querySelectorAll('.sccb-rendered-mts-card, .sccb-rendered-simblr-card, .sccb-rendered-tsr-card').length;
    const nativeHiddenCards = document.querySelectorAll('.sccb-mts-native-card-hidden, .sccb-simblr-native-card-hidden, .sccb-tsr-native-card-hidden').length;
    const duplicateAddButtons = [...document.querySelectorAll('.sccb-add, .sccb-card-button')]
      .some(button => button.parentElement && button.parentElement.querySelectorAll('.sccb-add, .sccb-card-button').length > 1);
    const detailMissingGallery = pageType === 'detail' && adapter.id !== 'mts' && !document.querySelector('.sccb-tsr-detail-gallery img, .sccb-simblr-detail-gallery img, .sccb-mts-custom-gallery img, .sccb-detail-gallery img') && document.querySelectorAll('img[src]').length > 1;
    if ((nativeHiddenCards && !renderedCards && isListingLikePage(pageType)) || duplicateAddButtons || detailMissingGallery) {
      state.layoutRecoveryShown = true;
      document.documentElement.dataset.sccbRecovery = '1';
      document.querySelectorAll('.sccb-mts-native-card-hidden, .sccb-simblr-native-card-hidden, .sccb-tsr-native-card-hidden, .sccb-tsr-force-hidden, .sccb-tsr-native-gallery-hidden').forEach(el => {
        el.classList.remove('sccb-mts-native-card-hidden', 'sccb-simblr-native-card-hidden', 'sccb-tsr-native-card-hidden', 'sccb-tsr-force-hidden', 'sccb-tsr-native-gallery-hidden');
        try { el.style.removeProperty('display'); el.style.removeProperty('visibility'); el.style.removeProperty('opacity'); el.style.removeProperty('pointer-events'); } catch (_) {}
      });
      toast('Recovered native layout because a rewrite looked incomplete. Try Safe mode if this page still looks wrong.', true);
    }
  }

  function showSettings() {
    closeModal();
    const settings = getSettings();
    const overlay = document.createElement('div');
    overlay.className = 'sccb-modal-backdrop';
    overlay.tabIndex = -1;
    const modal = document.createElement('section');
    modal.className = 'sccb-file-modal sccb-settings-modal';
    overlay.appendChild(modal);
    const handle = document.createElement('div');
    handle.className = 'sccb-sheet-handle';
    modal.appendChild(handle);
    const header = document.createElement('header');
    header.className = 'sccb-modal-header';
    header.innerHTML = '<div><h2>Basket settings</h2><div class="sccb-muted">Layout, duplicate detection, and fetch optimization.</div></div>';
    header.appendChild(iconButton('×', 'Close', () => closeModal()));
    modal.appendChild(header);
    const body = document.createElement('div');
    body.className = 'sccb-modal-body sccb-settings-body';
    modal.appendChild(body);

    const fields = [
      ['siteUi', 'Restyle supported site pages'],
      ['themeMts', 'Theme Mod The Sims'],
      ['themeSimblr', 'Theme Simblr.cc'],
      ['themeTsr', 'Theme The Sims Resource'],
      ['basketUi', 'Basket UI'],
      ['rewriteNativeCards', 'Rewrite native cards/details'],
      ['debugUi', 'Visual diagnostics mode'],
      ['warnCrossSiteDuplicates', 'Warn about likely cross-site duplicates'],
      ['autoSkipHighConfidence', 'Unchecked by default for high-confidence duplicates'],
      ['resolveFinalUrls', 'Resolve final URLs while adding files'],
      ['resolveBeforeDownload', 'Resolve metadata before downloading selected files'],
      ['resolveOnMobile', 'Allow metadata resolution on mobile'],
      ['verifySha256OptIn', 'Allow SHA-256 verification downloads'],
    ];
    fields.forEach(([key, label]) => body.appendChild(settingCheckbox(key, label, settings[key])));
    body.appendChild(settingSelect('safeMode', 'Safety mode', settings.safeMode, [['full', 'Full theme'], ['light', 'Light theme only'], ['basket', 'Basket only'], ['disabled', 'Disabled']]));
    body.appendChild(renderGridDensityPreview(settings.gridDensity));
    body.appendChild(settingSelect('gridDensity', 'Mod grid density', settings.gridDensity, [['compact', 'Compact — smaller cards'], ['comfortable', 'Comfortable — balanced'], ['roomy', 'Roomy — larger cards'], ['gallery', 'Gallery — largest previews'], ['custom', 'Custom card width']]));
    body.appendChild(settingSelect('gridCardMin', 'Custom minimum card width', settings.gridCardMin, [[160, '160 px'], [180, '180 px'], [200, '200 px'], [220, '220 px'], [240, '240 px'], [260, '260 px'], [280, '280 px'], [320, '320 px'], [360, '360 px']]));
    body.appendChild(settingSelect('preferredSource', 'Preferred source for duplicate cleanup', settings.preferredSource, [['mts', 'Mod The Sims'], ['simblr', 'Simblr.cc'], ['tsr', 'The Sims Resource']]));
    body.appendChild(settingSelect('concurrencyDesktop', 'Desktop concurrent fetches', settings.concurrencyDesktop, [[2, '2'], [4, '4'], [6, '6'], [8, '8']]));
    body.appendChild(settingSelect('concurrencyMobile', 'Mobile concurrent fetches', settings.concurrencyMobile, [[1, '1'], [2, '2'], [3, '3'], [4, '4']]));
    body.appendChild(settingSelect('cacheTtlMs', 'Cache duration', settings.cacheTtlMs, [[6 * 60 * 60 * 1000, '6 hours'], [24 * 60 * 60 * 1000, '24 hours'], [7 * 24 * 60 * 60 * 1000, '7 days']]));

    const actions = document.createElement('footer');
    actions.className = 'sccb-modal-actions';
    modal.appendChild(actions);
    actions.appendChild(makeButton('Save settings', 'primary', () => {
      const next = { ...settings };
      body.querySelectorAll('[data-setting]').forEach(input => {
        const key = input.dataset.setting;
        if (input.type === 'checkbox') next[key] = input.checked;
        else next[key] = /^\d+$/.test(input.value) ? Number(input.value) : input.value;
      });
      saveSettings(next);
      applyRuntimeModeDatasets(next);
      applyGridSettings(next);
      updateSiteToolbar();
      closeModal();
      toast('Settings saved.');
    }));
    actions.appendChild(makeButton('Export settings', '', exportSettings));
    actions.appendChild(makeButton('Import settings', '', importSettings));
    actions.appendChild(makeButton('Reset theme settings', '', () => { const current = getSettings(); const defaults = defaultSettings(); const next = { ...current, siteUi: defaults.siteUi, safeMode: defaults.safeMode, debugUi: defaults.debugUi, rewriteNativeCards: defaults.rewriteNativeCards, themeMts: defaults.themeMts, themeSimblr: defaults.themeSimblr, themeTsr: defaults.themeTsr, gridDensity: defaults.gridDensity, gridCardMin: defaults.gridCardMin }; saveSettings(next); applyRuntimeModeDatasets(next); applyGridSettings(next); updateSiteToolbar(); closeModal(); toast('Theme settings reset.'); }));
    actions.appendChild(makeButton('Reset basket only', '', () => { saveBasket({ version: VERSION, mods: {}, updatedAt: Date.now() }); updateEveryButtonState(); updateFabCount(); closeModal(); toast('Basket reset.'); }));
    actions.appendChild(makeButton('Reset all', '', () => { const defaults = defaultSettings(); saveSettings(defaults); applyRuntimeModeDatasets(defaults); applyGridSettings(defaults); updateSiteToolbar(); closeModal(); toast('Settings reset.'); }));
    actions.appendChild(makeButton('Cancel', '', () => closeModal()));
    document.body.appendChild(overlay);
    state.activeModal = overlay;
  }

  function renderGridDensityPreview(current) {
    const wrap = document.createElement('div');
    wrap.className = 'sccb-setting-row sccb-grid-preview-row';
    const label = document.createElement('span');
    label.textContent = 'Grid preview';
    const group = document.createElement('div');
    group.className = 'sccb-grid-preview-group';
    ['compact', 'comfortable', 'roomy', 'gallery'].forEach(mode => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `sccb-grid-preview ${String(current || 'comfortable') === mode ? 'active' : ''}`;
      button.dataset.gridChoice = mode;
      button.textContent = gridDensityLabel(mode);
      button.addEventListener('click', () => {
        const select = document.querySelector('[data-setting="gridDensity"]');
        if (select) select.value = mode;
        group.querySelectorAll('.sccb-grid-preview').forEach(el => el.classList.toggle('active', el === button));
      });
      group.appendChild(button);
    });
    wrap.append(group, label);
    return wrap;
  }

  function exportSettings() {
    const payload = { version: VERSION, exportedAt: new Date().toISOString(), settings: getSettings(), basket: loadBasket() };
    const text = JSON.stringify(payload, null, 2);
    navigator.clipboard?.writeText(text).then(() => toast('Settings and basket copied as JSON.')).catch(() => {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); toast('Settings and basket copied as JSON.'); }
      catch (_) { toast('Could not copy settings JSON.', true); }
      area.remove();
    });
  }

  function importSettings() {
    const text = prompt('Paste exported Sims CC Download Basket settings JSON:');
    if (!text) return;
    try {
      const payload = JSON.parse(text);
      if (payload.settings) saveSettings({ ...defaultSettings(), ...payload.settings });
      if (payload.basket?.mods) saveBasket({ ...payload.basket, updatedAt: Date.now() });
      applyRuntimeModeDatasets();
      applyGridSettings();
      updateEveryButtonState();
      updateFabCount();
      closeModal();
      toast('Settings imported.');
      debounceWire('settings-import');
    } catch (_) {
      toast('Could not import settings JSON.', true);
    }
  }

  function settingCheckbox(key, label, value) {
    const row = document.createElement('label');
    row.className = 'sccb-setting-row';
    row.innerHTML = `<input type="checkbox" data-setting="${key}" ${value ? 'checked' : ''}><span>${escapeHtml(label)}</span>`;
    return row;
  }

  function settingSelect(key, label, value, options) {
    const row = document.createElement('label');
    row.className = 'sccb-setting-row';
    const select = document.createElement('select');
    select.dataset.setting = key;
    options.forEach(([optValue, optLabel]) => {
      const option = document.createElement('option');
      option.value = String(optValue);
      option.textContent = optLabel;
      option.selected = String(optValue) === String(value);
      select.appendChild(option);
    });
    const span = document.createElement('span');
    span.textContent = label;
    row.appendChild(select);
    row.appendChild(span);
    return row;
  }

  function decodeMaybe(value) {
    try { return decodeURIComponent(String(value || '').replace(/\+/g, ' ')); }
    catch { return String(value || ''); }
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  function extractKnownFileId(url) {
    try {
      const parsed = new URL(url, location.href);
      return parsed.searchParams.get('file') || parsed.pathname.match(/\/download\/(\d+)/)?.[1] || parsed.pathname.match(/\/downloads\/(\d+)/)?.[1] || '';
    } catch { return ''; }
  }

  function extractMtsModId(url) {
    try {
      const parsed = new URL(url, location.href);
      return parsed.pathname.match(/^\/d\/(\d+)/)?.[1] || parsed.searchParams.get('t') || '';
    } catch { return ''; }
  }

  function setButtonDatasetSite(button) {
    if (button) button.dataset.site = adapter.id;
  }

  function makeButton(label, kind, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `sccb-btn ${kind || ''}`.trim();
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function iconButton(label, title, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sccb-icon-btn';
    button.textContent = label;
    button.title = title;
    button.addEventListener('click', onClick);
    return button;
  }

  function closeModal() {
    state.activeModal?.remove();
    state.activeModal = null;
  }

  function toast(message, isError = false) {
    const node = document.createElement('div');
    node.className = `sccb-toast ${isError ? 'error' : ''}`;
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 4500);
  }

  function toastSoon(message, isError = false) {
    setTimeout(() => toast(message, isError), 250);
  }

  function formatAddSummary(summary, already = 0) {
    const parts = [];
    if (summary.addedFiles) parts.push(`Added ${summary.addedFiles} file${summary.addedFiles === 1 ? '' : 's'}`);
    if (summary.duplicates || already) {
      const count = summary.duplicates + already;
      parts.push(`${count} duplicate${count === 1 ? '' : 's'} skipped`);
    }
    return parts.length ? `${parts.join(' · ')}.` : 'Already in basket.';
  }

  function formatTotalSize(files) {
    const known = files.map(file => file.sizeBytes || 0).filter(Boolean);
    if (!known.length) return '';
    return ` · ${formatBytes(known.reduce((a, b) => a + b, 0))}`;
  }

  function extractSize(text) {
    const match = cleanText(text).match(/\b([0-9]+(?:[.,][0-9]+)?\s*(?:B|KB|MB|GB|KiB|MiB|GiB))\b/i);
    return match ? match[1].replace(/\s+/g, ' ') : '';
  }

  function extractTypeFromRow(text) {
    const match = cleanText(text).match(/\b(archive|package|sims3pack|zip|rar|7z)\b/i);
    return match ? match[1].toLowerCase() : '';
  }

  function parseSizeBytes(size) {
    const match = cleanText(size).match(/^([0-9]+(?:[.,][0-9]+)?)\s*(B|KB|MB|GB|KiB|MiB|GiB)$/i);
    if (!match) return 0;
    const n = Number(match[1].replace(',', '.'));
    const unit = match[2].toLowerCase();
    const multipliers = { b: 1, kb: 1000, mb: 1000000, gb: 1000000000, kib: 1024, mib: 1048576, gib: 1073741824 };
    return Math.round(n * (multipliers[unit] || 1));
  }

  function formatBytes(bytes) {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1000 && unit < units.length - 1) { value /= 1000; unit++; }
    return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
  }

  function extensionOf(fileName) {
    const match = cleanText(fileName).match(/\.([a-z0-9]{2,8})(?:$|[?#])/i) || cleanText(fileName).match(/\.([a-z0-9]{2,8})$/i);
    return match ? match[1].toLowerCase() : '';
  }

  function inferFileRole(fileName, explicit = '') {
    const text = `${explicit} ${fileName}`.toLowerCase();
    if (/\b(main|required|base|default|merged)\b/.test(text)) return 'main';
    if (/\b(optional|addon|add-on)\b/.test(text)) return 'optional';
    if (/\b(source|psd|blend)\b/.test(text)) return 'source';
    if (/\b(alt|alternate|brighter|darker)\b/.test(text)) return 'variant';
    return '';
  }

  function isUsefulFileName(text) {
    const value = cleanText(text);
    if (!value) return false;
    if (/^download$/i.test(value)) return false;
    if (/^click here$/i.test(value)) return false;
    if (value.length > 220) return false;
    return /\.(zip|rar|7z|package|sims3pack|sims2pack|txt|pdf|png|jpg|jpeg|psd|blend)$/i.test(value) || !/^\W+$/.test(value);
  }

  function safeAbsUrl(href, base) {
    try { return new URL(href, base).href; } catch { return ''; }
  }

  function preferUrl(oldUrl, newUrl) {
    if (!oldUrl) return newUrl;
    if (/download/i.test(oldUrl) && !/download/i.test(newUrl)) return oldUrl;
    return newUrl || oldUrl;
  }

  function samePage(url) {
    try {
      const parsed = new URL(url, location.href);
      return parsed.origin === location.origin && parsed.pathname === location.pathname && parsed.search === location.search;
    } catch { return false; }
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean).map(String))];
  }

  function uniqueElements(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function stableHash(value) {
    const text = String(value || '');
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function copyText(text) {
    if (!text) return;
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 1000);
  }

  function dateStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function injectStyles() {
    if (document.querySelector('#sccb-styles')) return;
    const style = document.createElement('style');
    style.id = 'sccb-styles';
    style.textContent = `:root{--sccb-bg:#101719;--sccb-panel:#172326;--sccb-panel-2:#1d2d31;--sccb-panel-3:#24383d;--sccb-text:#e7f7f4;--sccb-muted:#9bb8b3;--sccb-dim:#66817c;--sccb-teal:#28d7c5;--sccb-cyan:#55cfff;--sccb-green:#8ee85f;--sccb-yellow:#d8f35a;--sccb-danger:#ff6b7a;--sccb-shadow:rgba(0,0,0,.48);}html[data-sccb-site="mts"][data-sccb-host-ui="1"],html[data-sccb-site="mts"][data-sccb-host-ui="1"][color-mode],html[data-sccb-site="mts"][data-sccb-host-ui="1"]:root{--page-background:#101719 !important;--page-surface:#0d1517 !important;--page-text:#e7f7f4 !important;--page-text-muted:#9bb8b3 !important;--background-light-primary:#101719 !important;--background-light-secondary:#0d1517 !important;--background-light-tertiary:#172326 !important;--background-blue-notifcation:#1d2d31 !important;--background-blue-notification:#1d2d31 !important;--grayLighten:#172326 !important;--grayLighter:#0d1517 !important;--grayLight:#24383d !important;--white:#172326 !important;--black:#e7f7f4 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] body,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #wrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #container,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #maincontainer,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentinner,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .column-wrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tabs-bg-white,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .downloadDetails,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message-body{background-color:transparent !important;background-image:none !important;color:var(--sccb-text) !important;}html[data-sccb-site][data-sccb-host-ui="1"]{color-scheme:dark !important;font-size:clamp(15px,.45vw+13px,17px) !important;-webkit-text-size-adjust:100% !important;text-size-adjust:100% !important;}html[data-sccb-site][data-sccb-host-ui="1"] *,html[data-sccb-site][data-sccb-host-ui="1"] *::before,html[data-sccb-site][data-sccb-host-ui="1"] *::after{box-sizing:border-box !important;}html[data-sccb-site][data-sccb-host-ui="1"] body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif !important;font-size:0.94rem !important;line-height:1.55 !important;letter-spacing:-0.006em !important;-webkit-font-smoothing:antialiased !important;-moz-osx-font-smoothing:grayscale !important;text-rendering:optimizeLegibility !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(p,li,td,th,label,input,select,textarea,button,a,span,div){font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(p,li,td,th){font-size:clamp(13px,.2vw+12px,15px) !important;line-height:1.6 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(h1,h2,h3,h4,h5,h6,.sccb-mod-title,.sccb-card-title,.browse-info-title-info){letter-spacing:-0.035em !important;overflow-wrap:anywhere !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(small,.small,.meta,.date,.browse-info-published-date,.downloadcreator,.sccb-muted){letter-spacing:.01em !important;}html[data-sccb-site][data-sccb-host-ui="1"] body{background:radial-gradient(circle at 16% 4%,rgba(40,215,197,.14),transparent 28%),radial-gradient(circle at 86% 10%,rgba(142,232,95,.10),transparent 28%),linear-gradient(180deg,#101719,#080c0e) !important;color:var(--sccb-text) !important;}html[data-sccb-site][data-sccb-host-ui="1"] a:not(.sccb-btn):not(.sccb-add):not(.sccb-icon-btn):not(.sccb-file-name):not(.sccb-mod-title){color:var(--sccb-cyan) !important;}html[data-sccb-site][data-sccb-host-ui="1"] a:not(.sccb-btn):not(.sccb-add):hover{color:var(--sccb-green) !important;}html[data-sccb-site][data-sccb-host-ui="1"] .container,html[data-sccb-site][data-sccb-host-ui="1"] .container-fluid,html[data-sccb-site][data-sccb-host-ui="1"] #content,html[data-sccb-site][data-sccb-host-ui="1"] #main,html[data-sccb-site][data-sccb-host-ui="1"] main{background:transparent !important;}html[data-sccb-site][data-sccb-host-ui="1"] .navbar,html[data-sccb-site][data-sccb-host-ui="1"] .navbar-inner,html[data-sccb-site][data-sccb-host-ui="1"] nav,html[data-sccb-site][data-sccb-host-ui="1"] header:not(.sccb-panel-header):not(.sccb-modal-header):not(.sccb-mod-header){background:rgba(12,19,21,.88) !important;color:var(--sccb-text) !important;border:none !important;box-shadow:0 14px 42px rgba(0,0,0,.24) !important;}html[data-sccb-site][data-sccb-host-ui="1"] .breadcrumb,html[data-sccb-site][data-sccb-host-ui="1"] .well,html[data-sccb-site][data-sccb-host-ui="1"] .card,html[data-sccb-site][data-sccb-host-ui="1"] .list-group-item,html[data-sccb-site][data-sccb-host-ui="1"] .dropdown-menu,html[data-sccb-site][data-sccb-host-ui="1"] .tab-content,html[data-sccb-site][data-sccb-host-ui="1"] .tab-pane,html[data-sccb-site][data-sccb-host-ui="1"] .downloadDetails,html[data-sccb-site][data-sccb-host-ui="1"] .smol-card-component,html[data-sccb-site][data-sccb-host-ui="1"] [data-sccb-card="1"]{background:linear-gradient(180deg,rgba(29,45,49,.96),rgba(20,31,34,.96)) !important;color:var(--sccb-text) !important;border:none !important;border-radius:20px !important;box-shadow:0 16px 46px rgba(0,0,0,.28) !important;}html[data-sccb-site][data-sccb-host-ui="1"] [data-sccb-card="1"],html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-card{position:relative !important;overflow:hidden !important;padding:max(12px,.75rem) !important;transition:transform 140ms ease,box-shadow 140ms ease,background 140ms ease !important;}html[data-sccb-site][data-sccb-host-ui="1"] [data-sccb-card="1"]:hover,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-card:hover{transform:translateY(-2px) !important;box-shadow:0 24px 70px rgba(0,0,0,.36),0 0 0 1px rgba(40,215,197,.10) inset !important;}.sccb-site-card-ribbon{display:inline-flex;align-items:center;gap:7px;width:fit-content;margin:0 0 8px;padding:5px 9px;border-radius:999px;background:rgba(40,215,197,.12);color:var(--sccb-green);font:900 11px/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:none;}#sccb-site-toolbar{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;width:min(1180px,calc(100% - 24px));margin:12px auto 14px;padding:12px 14px;border-radius:22px;background:linear-gradient(90deg,rgba(22,35,38,.96),rgba(32,55,58,.96));color:var(--sccb-text);box-shadow:0 18px 54px rgba(0,0,0,.34);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;position:relative;top:auto;z-index:50;}.sccb-site-toolbar-main{display:flex;align-items:center;gap:10px;min-width:0;}.sccb-site-toolbar-title{font-weight:950;white-space:nowrap;}.sccb-site-toolbar-meta{color:var(--sccb-muted);font-weight:800;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.sccb-site-toolbar-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;}.sccb-site-toolbar-btn{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 11px;border-radius:999px;background:#253b40;color:var(--sccb-text);cursor:pointer;font:900 12px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}.sccb-site-toolbar-btn:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-cyan));color:#061012;}html[data-sccb-site][data-sccb-host-ui="1"] h1,html[data-sccb-site][data-sccb-host-ui="1"] h2,html[data-sccb-site][data-sccb-host-ui="1"] h3,html[data-sccb-site][data-sccb-host-ui="1"] .display-5,html[data-sccb-site][data-sccb-host-ui="1"] .display-6,html[data-sccb-site][data-sccb-host-ui="1"] .downloadtitle{color:var(--sccb-text) !important;text-shadow:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-title{padding:14px 16px !important;border-radius:22px !important;background:linear-gradient(90deg,rgba(29,45,49,.92),rgba(16,23,25,.92)) !important;box-shadow:0 16px 46px rgba(0,0,0,.26) !important;}html[data-sccb-site][data-sccb-host-ui="1"] table,html[data-sccb-site][data-sccb-host-ui="1"] .table,html[data-sccb-site][data-sccb-host-ui="1"] #scroll_files,html[data-sccb-site][data-sccb-host-ui="1"] #actualcontent3,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-download-zone{background:rgba(23,35,38,.94) !important;color:var(--sccb-text) !important;border:none !important;border-radius:18px !important;overflow:hidden !important;}html[data-sccb-site][data-sccb-host-ui="1"] tr,html[data-sccb-site][data-sccb-host-ui="1"] td,html[data-sccb-site][data-sccb-host-ui="1"] th{background:transparent !important;color:var(--sccb-text) !important;border-color:rgba(231,247,244,.08) !important;}html[data-sccb-site][data-sccb-host-ui="1"] input,html[data-sccb-site][data-sccb-host-ui="1"] select,html[data-sccb-site][data-sccb-host-ui="1"] textarea,html[data-sccb-site][data-sccb-host-ui="1"] .form-control,html[data-sccb-site][data-sccb-host-ui="1"] .search-query{background:#111b1e !important;color:var(--sccb-text) !important;border-color:rgba(231,247,244,.10) !important;border-radius:999px !important;box-shadow:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] img,html[data-sccb-site][data-sccb-host-ui="1"] .thumbnail,html[data-sccb-site][data-sccb-host-ui="1"] .thumb{border-radius:16px !important;border:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .nav-tabs,html[data-sccb-site][data-sccb-host-ui="1"] .nav-pills,html[data-sccb-site][data-sccb-host-ui="1"] .pagination,html[data-sccb-site][data-sccb-host-ui="1"] .pager{border:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .nav-tabs>li>a,html[data-sccb-site][data-sccb-host-ui="1"] .nav-pills>li>a,html[data-sccb-site][data-sccb-host-ui="1"] .pagination a,html[data-sccb-site][data-sccb-host-ui="1"] .pager a{background:#182528 !important;color:var(--sccb-muted) !important;border:none !important;border-radius:999px !important;}html[data-sccb-site][data-sccb-host-ui="1"] .nav-tabs>.active>a,html[data-sccb-site][data-sccb-host-ui="1"] .nav-pills>.active>a,html[data-sccb-site][data-sccb-host-ui="1"] .active>a{background:linear-gradient(90deg,var(--sccb-green),var(--sccb-yellow)) !important;color:#101719 !important;}html[data-sccb-site][data-sccb-host-ui="1"] .downloadlink,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-download-link{display:inline-flex !important;align-items:center !important;gap:7px !important;min-height:34px !important;padding:7px 12px !important;border-radius:999px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-weight:900 !important;text-decoration:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .downloadlink:hover,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-download-link:hover{filter:brightness(1.08) !important;}html[data-sccb-site][data-sccb-host-ui="1"]{color-scheme:dark !important;scrollbar-color:#253b40 #0b1113 !important;--bs-body-bg:#0b1113 !important;--bs-body-color:var(--sccb-text) !important;--bs-card-bg:#172326 !important;--bs-border-color:rgba(231,247,244,.08) !important;--bs-primary:#28d7c5 !important;--bs-info:#55cfff !important;--bs-success:#8ee85f !important;}html[data-sccb-site][data-sccb-host-ui="1"] body,html[data-sccb-site][data-sccb-host-ui="1"] div,html[data-sccb-site][data-sccb-host-ui="1"] p,html[data-sccb-site][data-sccb-host-ui="1"] li,html[data-sccb-site][data-sccb-host-ui="1"] small,html[data-sccb-site][data-sccb-host-ui="1"] span:not(.sccb-plumbob):not(.sccb-plumbob-mini){border-color:rgba(231,247,244,.08) !important;}html[data-sccb-site][data-sccb-host-ui="1"] hr,html[data-sccb-site][data-sccb-host-ui="1"] .dropdown-divider{border-color:rgba(231,247,244,.10) !important;opacity:1 !important;}html[data-sccb-site][data-sccb-host-ui="1"] .btn:not(.sccb-btn):not(.sccb-add),html[data-sccb-site][data-sccb-host-ui="1"] button.btn:not(.sccb-btn):not(.sccb-add),html[data-sccb-site][data-sccb-host-ui="1"] input.btn,html[data-sccb-site][data-sccb-host-ui="1"] .badge,html[data-sccb-site][data-sccb-host-ui="1"] .label,html[data-sccb-site][data-sccb-host-ui="1"] .page-link,html[data-sccb-site][data-sccb-host-ui="1"] .btn-primary,html[data-sccb-site][data-sccb-host-ui="1"] .btn-info,html[data-sccb-site][data-sccb-host-ui="1"] .btn-success,html[data-sccb-site][data-sccb-host-ui="1"] .btn-secondary,html[data-sccb-site][data-sccb-host-ui="1"] .btn-outline-primary,html[data-sccb-site][data-sccb-host-ui="1"] .btn-outline-info{background:#253b40 !important;color:var(--sccb-text) !important;border:none !important;border-radius:999px !important;box-shadow:none !important;text-shadow:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .btn:not(.sccb-btn):not(.sccb-add):hover,html[data-sccb-site][data-sccb-host-ui="1"] .page-link:hover,html[data-sccb-site][data-sccb-host-ui="1"] .btn-primary:hover,html[data-sccb-site][data-sccb-host-ui="1"] .btn-info:hover,html[data-sccb-site][data-sccb-host-ui="1"] .btn-success:hover,html[data-sccb-site][data-sccb-host-ui="1"] .btn-secondary:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-cyan)) !important;color:#061012 !important;}html[data-sccb-site][data-sccb-host-ui="1"] .bg-primary,html[data-sccb-site][data-sccb-host-ui="1"] .bg-info,html[data-sccb-site][data-sccb-host-ui="1"] .bg-success,html[data-sccb-site][data-sccb-host-ui="1"] .text-bg-primary,html[data-sccb-site][data-sccb-host-ui="1"] .text-bg-info,html[data-sccb-site][data-sccb-host-ui="1"] .text-bg-success,html[data-sccb-site][data-sccb-host-ui="1"] [class*="bg-primary"],html[data-sccb-site][data-sccb-host-ui="1"] [class*="bg-info"]{background:linear-gradient(90deg,#162326,#20373a) !important;color:var(--sccb-text) !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-section,html[data-sccb-site][data-sccb-host-ui="1"] .message,html[data-sccb-site][data-sccb-host-ui="1"] .card-group,html[data-sccb-site][data-sccb-host-ui="1"] .album,html[data-sccb-site][data-sccb-host-ui="1"] .carousel,html[data-sccb-site][data-sccb-host-ui="1"] .maincontentwrapper{background:rgba(11,17,19,.72) !important;color:var(--sccb-text) !important;border:none !important;border-radius:22px !important;box-shadow:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-section-heading,html[data-sccb-site][data-sccb-host-ui="1"] .message-header,html[data-sccb-site][data-sccb-host-ui="1"] .card-header,html[data-sccb-site][data-sccb-host-ui="1"] .section-header,html[data-sccb-site][data-sccb-host-ui="1"] .section-title,html[data-sccb-site][data-sccb-host-ui="1"] .row-title,html[data-sccb-site][data-sccb-host-ui="1"] .index-title{background:linear-gradient(90deg,#162326,#20373a) !important;color:var(--sccb-text) !important;border:none !important;border-radius:18px 18px 0 0 !important;text-shadow:none !important;box-shadow:none !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-section-heading a,html[data-sccb-site][data-sccb-host-ui="1"] .message-header a,html[data-sccb-site][data-sccb-host-ui="1"] .card-header a{color:var(--sccb-green) !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-footer,html[data-sccb-site][data-sccb-host-ui="1"] footer,html[data-sccb-site][data-sccb-host-ui="1"] .footer,html[data-sccb-site][data-sccb-host-ui="1"] #menubar.bottom-footer{background:#090e10 !important;color:var(--sccb-muted) !important;border:none !important;box-shadow:inset 0 1px 0 rgba(231,247,244,.06) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .span12,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .row-fluid>.span12,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .inBetweenLine,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .well,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .well-small,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .alert,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .modal-body:not(.sccb-modal-body){background:rgba(14,22,25,.96) !important;color:var(--sccb-text) !important;border:none !important;border-radius:18px !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message{margin:14px 0 !important;overflow:hidden !important;background:#0d1517 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message-body,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .utils-outer{background:#0d1517 !important;color:var(--sccb-text) !important;border:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .alert,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .alert-success,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .adslot-wrapper-horizontal{background:rgba(29,45,49,.86) !important;color:var(--sccb-text) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .grayLighten-border,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .thumbnail,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .thumbnailwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .downloadCardFooter,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .forumtitle{background:transparent !important;border-color:rgba(231,247,244,.08) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .downloadcreator,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .downloadPreview,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .forumtitle,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .downloadCardFooter,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .downloadCardFooterIcons{color:var(--sccb-muted) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .smol-css-grid,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .constrained-grid{background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] body{padding-left:0 !important;padding-right:0 !important;overflow-x:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .container,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .span12,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #main,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #content,html[data-sccb-site="mts"][data-sccb-host-ui="1"] main{box-sizing:border-box !important;width:min(1920px,calc(100vw - 28px)) !important;max-width:none !important;min-width:0 !important;margin-left:auto !important;margin-right:auto !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .row,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .row-fluid{box-sizing:border-box !important;width:100% !important;max-width:none !important;margin-left:0 !important;margin-right:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .row>.span12,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .row-fluid>.span12,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .container>.span12{box-sizing:border-box !important;float:none !important;width:100% !important;max-width:none !important;margin-left:0 !important;margin-right:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #sccb-site-toolbar{width:min(1920px,calc(100vw - 28px)) !important;max-width:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message-body,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .utils-outer,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .inBetweenLine,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .breadcrumb,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .well,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .alert,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .adslot-wrapper-horizontal{box-sizing:border-box !important;width:100% !important;max-width:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .smol-css-grid,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .constrained-grid{box-sizing:border-box !important;width:100% !important;max-width:none !important;--gap:10px !important;--min:30ch !important;grid-template-columns:repeat(auto-fit,minmax(min(30ch,100%),1fr)) !important;align-items:stretch !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .smol-css-grid>.smol-card-component,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .constrained-grid>.smol-card-component{min-width:0 !important;max-width:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .constrained-grid,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .smol-css-grid.constrained-grid,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .smol-css-grid.gridtype-grid{grid-template-rows:none !important;grid-auto-rows:auto !important;overflow:visible !important;height:auto !important;min-height:0 !important;max-height:none !important;margin-bottom:12px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message-body,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .utils-outer{height:auto !important;min-height:0 !important;max-height:none !important;overflow:visible !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .message-body.utils-outer{padding-bottom:10px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section{display:block !important;width:100% !important;margin:14px 0 18px !important;padding:0 !important;background:#0d1517 !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:22px !important;overflow:hidden !important;box-shadow:0 18px 54px rgba(0,0,0,.24) !important;min-height:0 !important;height:auto !important;max-height:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-header{position:static !important;top:auto !important;display:flex !important;align-items:flex-start !important;justify-content:space-between !important;gap:10px 14px !important;flex-wrap:wrap !important;width:100% !important;min-width:0 !important;min-height:48px !important;padding:12px 14px !important;margin:0 !important;background:linear-gradient(90deg,#1a2a2e,#24383d) !important;border:none !important;border-bottom:1px solid rgba(231,247,244,.08) !important;border-radius:0 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-title-wrap{display:flex !important;align-items:center !important;gap:8px !important;flex:1 1 280px !important;flex-wrap:wrap !important;min-width:0 !important;max-width:100% !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-title{flex:0 1 auto !important;min-width:0 !important;max-width:100% !important;margin:0 !important;padding:0 !important;color:var(--sccb-text) !important;font:900 clamp(15px,1.45vw,18px)/1.15 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:-.02em !important;overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-meta{display:inline-flex !important;align-items:center !important;justify-content:center !important;flex:0 0 auto !important;min-width:0 !important;max-width:100% !important;min-height:24px !important;margin:0 !important;padding:4px 9px !important;border-radius:999px !important;background:rgba(142,232,95,.13) !important;color:var(--sccb-green) !important;border:1px solid rgba(142,232,95,.18) !important;font:850 11px/1.15 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:.01em !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-actions{display:flex !important;align-items:center !important;justify-content:flex-end !important;gap:8px !important;flex:0 1 auto !important;min-width:0 !important;max-width:100% !important;flex-wrap:wrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-action{display:inline-flex !important;align-items:center !important;justify-content:center !important;min-height:34px !important;padding:7px 12px !important;border-radius:999px !important;border:none !important;background:linear-gradient(90deg,rgba(40,215,197,.86),rgba(142,232,95,.86)) !important;color:#061012 !important;font:900 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-decoration:none !important;box-shadow:0 12px 28px rgba(40,215,197,.18) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-body{width:100% !important;margin:0 !important;padding:12px !important;background:#0d1517 !important;min-height:0 !important;height:auto !important;max-height:none !important;overflow:visible !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-grid{all:unset;box-sizing:border-box !important;display:grid !important;width:100% !important;grid-template-columns:repeat(auto-fill,minmax(220px,1fr)) !important;gap:12px !important;align-items:stretch !important;list-style:none !important;margin:0 !important;padding:0 !important;min-height:0 !important;height:auto !important;max-height:none !important;overflow:visible !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-grid>.sccb-mts-card,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-grid>.smol-card-component{box-sizing:border-box !important;display:flex !important;flex-direction:column !important;width:100% !important;min-width:0 !important;height:auto !important;min-height:0 !important;max-height:none !important;margin:0 !important;padding:10px !important;float:none !important;grid-row:auto !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .thumbnailwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card>a:first-child{display:block !important;width:100% !important;margin:0 0 10px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card img.featuredimage,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .featuredimage{display:block !important;width:100% !important;height:clamp(128px,13vw,210px) !important;object-fit:cover !important;object-position:center !important;background:#101719 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .downloadDetails{display:flex !important;flex-direction:column !important;flex:1 1 auto !important;width:100% !important;padding:0 !important;margin:0 !important;background:transparent !important;border:none !important;border-radius:0 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .downloadtitle{margin:0 0 4px !important;min-height:2.6em !important;color:var(--sccb-text) !important;font-size:14px !important;line-height:1.25 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .downloadcreator,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .downloadPreview,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .forumtitles{margin:0 0 6px !important;font-size:11px !important;line-height:1.35 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .downloadCardFooter{margin-top:auto !important;padding:0 !important;background:transparent !important;border:none !important;box-shadow:none !important;}@media (min-width:1700px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-grid{grid-template-columns:repeat(auto-fill,minmax(250px,1fr)) !important;}}@media (max-width:700px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-header{align-items:flex-start !important;flex-direction:column !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-title-wrap{flex-basis:100% !important;align-items:flex-start !important;flex-direction:column !important;gap:6px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-title{white-space:normal !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-meta{max-width:100% !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-actions,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-action{width:100% !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-grid{grid-template-columns:1fr !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card img.featuredimage,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .featuredimage{height:190px !important;}}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-mts-card{position:relative !important;display:flex !important;flex-direction:column !important;gap:0 !important;min-width:0 !important;min-height:100% !important;padding:12px !important;border:1px solid rgba(231,247,244,.075) !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(16,23,25,.98)) !important;box-shadow:0 16px 42px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.025) !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-mts-card:hover{transform:translateY(-2px) !important;box-shadow:0 22px 54px rgba(0,0,0,.34),0 0 0 1px rgba(40,215,197,.14) inset !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card-thumb{position:relative !important;display:block !important;width:100% !important;aspect-ratio:4 / 3 !important;margin:0 !important;overflow:hidden !important;border-radius:16px !important;background:radial-gradient(circle at 20% 10%,rgba(40,215,197,.16),transparent 34%),#102326 !important;text-decoration:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card-image{display:block !important;width:100% !important;height:100% !important;min-width:100% !important;min-height:100% !important;background-repeat:no-repeat !important;background-position:center !important;background-size:contain !important;background-color:#0d191c !important;border:none !important;border-radius:0 !important;transform:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-mts-card:hover .sccb-mts-card-image{transform:none !important;transition:transform 180ms ease !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card-placeholder{width:100% !important;height:100% !important;display:grid !important;place-items:center !important;color:var(--sccb-green) !important;font-size:44px !important;font-weight:950 !important;opacity:.85 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-source-badge,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-title-emoji-flag{position:absolute !important;display:inline-flex !important;align-items:center !important;gap:6px !important;padding:6px 9px !important;border-radius:999px !important;border:1px solid rgba(231,247,244,.08) !important;background:rgba(10,25,27,.84) !important;color:var(--sccb-green) !important;font:900 11px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;backdrop-filter:blur(8px) !important;box-shadow:0 8px 24px rgba(0,0,0,.28) !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-source-badge{left:10px !important;top:10px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-title-emoji-flag{right:10px !important;top:10px !important;color:var(--sccb-yellow) !important;font-size:13px !important;letter-spacing:1px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card-body{display:flex !important;flex-direction:column !important;flex:1 1 auto !important;min-width:0 !important;padding:11px 2px 0 !important;margin:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-title{display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;min-height:2.48em !important;margin:0 0 5px !important;color:var(--sccb-text) !important;font:900 15px/1.24 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:-.015em !important;text-decoration:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-title:hover{color:var(--sccb-green) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-title-emojis{letter-spacing:.5px !important;white-space:nowrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-author{display:block !important;max-width:100% !important;margin:0 !important;color:var(--sccb-muted) !important;font:750 12px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-author a{color:var(--sccb-cyan) !important;font-weight:900 !important;text-decoration:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-source-badge{display:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-meta-row{display:flex !important;align-items:center !important;flex-wrap:wrap !important;gap:7px !important;min-width:0 !important;margin:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-meta-row .sccb-card-author{flex:1 1 auto !important;min-width:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-updated-chip{display:inline-flex !important;align-items:center !important;max-width:100% !important;min-height:22px !important;padding:4px 8px !important;border-radius:999px !important;background:rgba(142,232,95,.12) !important;border:1px solid rgba(142,232,95,.18) !important;color:var(--sccb-green) !important;font:900 11px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-updated-chip::before{content:"🕒";margin-right:5px;font-size:10px;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-chips{display:flex !important;flex-wrap:wrap !important;align-items:flex-start !important;align-content:flex-start !important;gap:6px !important;width:100% !important;height:auto !important;min-height:0 !important;max-height:none !important;margin:10px 0 0 !important;padding:0 !important;overflow:visible !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-chip{display:inline-flex !important;flex:0 1 auto !important;align-items:center !important;justify-content:center !important;max-width:100% !important;min-width:0 !important;min-height:24px !important;height:auto !important;padding:5px 8px !important;border-radius:999px !important;background:#1c3538 !important;color:var(--sccb-cyan) !important;font:850 11px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-align:center !important;text-decoration:none !important;white-space:normal !important;overflow:visible !important;overflow-wrap:anywhere !important;text-overflow:clip !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-stats{display:flex !important;align-items:center !important;gap:9px !important;flex-wrap:wrap !important;margin:auto 0 0 !important;padding-top:11px !important;color:#8aa9a4 !important;font:800 11px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-stat{display:inline-flex !important;align-items:center !important;gap:3px !important;white-space:nowrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-stat-muted{color:var(--sccb-muted) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-card-actions{display:flex !important;flex:0 0 auto !important;align-items:stretch !important;width:100% !important;height:auto !important;min-height:38px !important;max-height:none !important;margin:11px 0 0 !important;padding:0 !important;overflow:visible !important;background:transparent !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-card-actions .sccb-card-button,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-card-actions .sccb-add{width:100% !important;min-height:38px !important;margin:0 !important;padding:10px 12px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;box-shadow:0 12px 28px rgba(40,215,197,.16) !important;font-size:13px !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-card-actions .sccb-add[data-sccb-state="added"]{background:#203a32 !important;color:var(--sccb-green) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-card-actions .sccb-add[data-sccb-state="choice"]{background:linear-gradient(90deg,var(--sccb-yellow),var(--sccb-green)) !important;color:#101719 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-card-actions .sccb-add[data-sccb-state="error"]{background:#3b2229 !important;color:#ffd5db !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-mts-card>.sccb-add,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-mts-card .sccb-mts-card-body>.sccb-add:not(.sccb-card-button){display:none !important;}@media (min-width:1600px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-grid{grid-template-columns:repeat(auto-fill,minmax(250px,1fr)) !important;gap:18px !important;}}@media (max-width:700px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-rendered-mts-card{border-radius:20px !important;padding:11px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-card-title{font-size:16px !important;}}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #menubar,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #menubar .navbar,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #menubar .navbar-inner,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #cbp-hrmenu,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrmenu{background:rgba(8,13,15,.96) !important;color:var(--sccb-text) !important;border-color:rgba(231,247,244,.08) !important;box-shadow:0 10px 28px rgba(0,0,0,.30) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #menubar a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrmenu a{color:var(--sccb-cyan) !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrmenu>ul>li>a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #menubar .fake-pills>a{border-radius:999px !important;padding:5px 10px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrmenu>ul>li>a:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #menubar .fake-pills>a:hover{background:#1d2d31 !important;color:var(--sccb-green) !important;text-decoration:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrsub,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrsub-inner,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-menu,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-content,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-item,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .typeahead.dropdown-menu,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .popover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .modal,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .modal-content{background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(12,19,21,.98)) !important;color:var(--sccb-text) !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:18px !important;box-shadow:0 18px 60px rgba(0,0,0,.55) !important;text-shadow:none !important;opacity:1 !important;z-index:2147483000 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrsub.well,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrsub.well-small,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-menu.well,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .grayLighten-border{background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(12,19,21,.98)) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-menu a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-content a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrsub a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .popover a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .modal a{color:var(--sccb-cyan) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-menu li>a:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .dropdown-content a:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .cbp-hrsub a:hover{background:#253b40 !important;color:var(--sccb-green) !important;text-decoration:none !important;}@media (max-width:767px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .container,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .span12,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #sccb-site-toolbar{width:calc(100vw - 12px) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .smol-css-grid,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .constrained-grid{--gap:6px !important;--min:100% !important;grid-template-columns:1fr !important;}}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] body{background:radial-gradient(circle at 18% 0%,rgba(40,215,197,.14),transparent 30%),radial-gradient(circle at 78% 12%,rgba(142,232,95,.09),transparent 30%),linear-gradient(180deg,#101719,#080c0e) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .navbar,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .navbar-collapse,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .offcanvas,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .dropdown-menu{background:rgba(9,14,16,.92) !important;color:var(--sccb-text) !important;border:none !important;box-shadow:0 14px 42px rgba(0,0,0,.30) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .container>.rounded,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .container-fluid>.rounded,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .jumbotron,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .hero,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card-body,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .list-group,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .list-group-item{background:linear-gradient(180deg,rgba(29,45,49,.94),rgba(16,23,25,.94)) !important;color:var(--sccb-text) !important;border:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card-title,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .grid-card-title,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .display-5,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .display-6{color:var(--sccb-text) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .carousel-control-prev,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .carousel-control-next,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .carousel-control-prev-icon,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .carousel-control-next-icon{background-color:rgba(23,35,38,.86) !important;border-radius:999px !important;filter:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentwrapper *,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentinner *,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .column-wrapper *{border-color:rgba(231,247,244,.08) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] [style*="background-color:white"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] [style*="background:white"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] [style*="background-color:#fff"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] [style*="background:#fff"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] [style*="background-color:#fff"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] [style*="background:#fff"]{background:transparent !important;background-color:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .blue,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .info,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .notification,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .alert-info,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .help-notice,html[data-sccb-site="mts"][data-sccb-host-ui="1"] [class*="notification"]{background:linear-gradient(180deg,rgba(29,45,49,.96),rgba(16,23,25,.96)) !important;color:var(--sccb-text) !important;border-color:rgba(85,207,255,.16) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .flickity-button{background:rgba(23,35,38,.92) !important;color:var(--sccb-text) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"]{--bs-body-bg:#101719 !important;--bs-body-color:#e7f7f4 !important;--bs-secondary-bg:#172326 !important;--bs-tertiary-bg:#1d2d31 !important;--bs-primary:#28d7c5 !important;--bs-info:#55cfff !important;--bs-success:#8ee85f !important;--bs-link-color:#55cfff !important;--bs-link-hover-color:#8ee85f !important;color-scheme:dark !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero{position:relative !important;overflow:hidden !important;border-radius:28px !important;background:radial-gradient(circle at 18% 10%,rgba(40,215,197,.18),transparent 34%),linear-gradient(135deg,rgba(29,45,49,.96),rgba(13,21,23,.96)) !important;border:1px solid rgba(231,247,244,.08) !important;box-shadow:0 24px 72px rgba(0,0,0,.34) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero-title,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-title{color:var(--sccb-text) !important;font-weight:950 !important;letter-spacing:-.035em !important;text-shadow:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero-copy{color:var(--sccb-muted) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-section{margin-block:18px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-section-heading,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .bg-primary,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .text-bg-primary{display:flex !important;align-items:center !important;justify-content:center !important;min-height:42px !important;border-radius:14px !important;background:linear-gradient(90deg,#162326,#20373a) !important;color:var(--sccb-text) !important;border:1px solid rgba(231,247,244,.08) !important;box-shadow:0 14px 34px rgba(0,0,0,.22) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .grid-card,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .smol-card-component{border-radius:22px !important;background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(16,23,25,.98)) !important;border:1px solid rgba(231,247,244,.075) !important;box-shadow:0 16px 42px rgba(0,0,0,.28) !important;overflow:hidden !important;color:var(--sccb-text) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .grid-card:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .smol-card-component:hover{transform:translateY(-2px) !important;box-shadow:0 22px 54px rgba(0,0,0,.34),0 0 0 1px rgba(40,215,197,.14) inset !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-thumb{display:block !important;width:100% !important;aspect-ratio:4 / 3 !important;overflow:hidden !important;border-radius:16px !important;background:#0d191c !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-img,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card-img-top{width:100% !important;height:100% !important;object-fit:contain !important;background:#0d191c !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-title,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .grid-card-title,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card-title a,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card-title{color:var(--sccb-cyan) !important;font-weight:900 !important;line-height:1.25 !important;text-decoration:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-meta,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] small,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .text-muted{color:var(--sccb-muted) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-site-card-ribbon{display:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-downloadlink,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] a.downloadlink,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] a[href*="/download/"]{display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:8px !important;min-height:40px !important;padding:9px 14px !important;border-radius:999px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-weight:950 !important;text-decoration:none !important;box-shadow:0 12px 28px rgba(40,215,197,.18) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-panel,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .table,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .alert{border-radius:20px !important;background:linear-gradient(180deg,rgba(29,45,49,.96),rgba(16,23,25,.96)) !important;border:1px solid rgba(231,247,244,.08) !important;color:var(--sccb-text) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-image{border-radius:18px !important;background:#0d191c !important;object-fit:contain !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"],html[data-sccb-site="simblr"][data-sccb-host-ui="1"] body{min-width:0 !important;background:radial-gradient(circle at 18% 0%,rgba(40,215,197,.13),transparent 30%),radial-gradient(circle at 80% 8%,rgba(142,232,95,.09),transparent 28%),linear-gradient(180deg,#101719,#070b0d) !important;color:var(--sccb-text) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-shell,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] main,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .container,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .container-fluid{max-width:min(1680px,calc(100vw - 28px)) !important;width:min(1680px,calc(100vw - 28px)) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .navbar,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] nav.navbar{position:sticky !important;top:0 !important;z-index:2147482000 !important;min-height:56px !important;padding:8px 14px !important;background:rgba(8,13,15,.96) !important;backdrop-filter:blur(14px) !important;border-bottom:1px solid rgba(231,247,244,.08) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-nav-link,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .navbar a,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .nav-link,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .dropdown-item{color:var(--sccb-cyan) !important;border-radius:999px !important;padding:7px 10px !important;font-weight:850 !important;text-decoration:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-nav-link:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .navbar a:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .nav-link:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .dropdown-item:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .nav-link.active{background:linear-gradient(90deg,rgba(40,215,197,.18),rgba(142,232,95,.16)) !important;color:var(--sccb-green) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .dropdown-menu,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .offcanvas,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .modal-content{background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(12,19,21,.98)) !important;color:var(--sccb-text) !important;border:1px solid rgba(231,247,244,.09) !important;border-radius:18px !important;box-shadow:0 24px 70px rgba(0,0,0,.55) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero{margin-block:18px 26px !important;min-height:clamp(240px,28vw,430px) !important;display:grid !important;place-items:center !important;padding:clamp(24px,5vw,68px) !important;text-align:center !important;background:linear-gradient(rgba(8,13,15,.52),rgba(8,13,15,.74)),radial-gradient(circle at 50% 10%,rgba(142,232,95,.22),transparent 26%),linear-gradient(135deg,rgba(29,45,49,.98),rgba(13,21,23,.98)) !important;border-radius:30px !important;border:1px solid rgba(231,247,244,.09) !important;box-shadow:0 28px 80px rgba(0,0,0,.42) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero-title{max-width:760px !important;margin:0 auto 10px !important;font-size:clamp(28px,5vw,58px) !important;line-height:.96 !important;color:var(--sccb-text) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero-copy{max-width:760px !important;margin-inline:auto !important;color:var(--sccb-muted) !important;font-size:clamp(13px,1.5vw,16px) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero-action,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .btn-primary,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .btn-info,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .btn-success{border:0 !important;border-radius:999px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-weight:950 !important;box-shadow:0 14px 34px rgba(40,215,197,.24) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-section{position:relative !important;margin-block:22px 34px !important;padding:0 !important;overflow:visible !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-section-heading,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .bg-primary.sccb-simblr-section-heading,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .text-bg-primary.sccb-simblr-section-heading{width:min(430px,100%) !important;min-height:44px !important;margin:0 auto 16px !important;padding:10px 16px !important;display:flex !important;align-items:center !important;justify-content:center !important;gap:8px !important;border-radius:14px !important;background:linear-gradient(90deg,#1d3a40,#244647) !important;color:var(--sccb-text) !important;border:1px solid rgba(85,207,255,.16) !important;box-shadow:0 14px 34px rgba(0,0,0,.30) !important;font-weight:950 !important;letter-spacing:-.01em !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-native-card-hidden{display:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card{min-width:0 !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(16,23,25,.98)) !important;border:1px solid rgba(231,247,244,.075) !important;box-shadow:0 16px 42px rgba(0,0,0,.28) !important;overflow:hidden !important;color:var(--sccb-text) !important;display:flex !important;flex-direction:column !important;transition:transform 140ms ease,box-shadow 140ms ease !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card:hover{transform:translateY(-3px) !important;box-shadow:0 22px 58px rgba(0,0,0,.38),0 0 0 1px rgba(40,215,197,.14) inset !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-thumb{position:relative !important;display:block !important;width:100% !important;aspect-ratio:4 / 3 !important;overflow:hidden !important;background:#0b1517 !important;border-radius:0 !important;text-decoration:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-image,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-img,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card-img-top{display:block !important;width:100% !important;height:100% !important;background-size:contain !important;background-repeat:no-repeat !important;background-position:center !important;object-fit:contain !important;background-color:#0b1517 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-placeholder{width:100% !important;height:100% !important;display:grid !important;place-items:center !important;color:var(--sccb-green) !important;font-size:34px !important;background:radial-gradient(circle,rgba(40,215,197,.12),transparent 58%),#0b1517 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-flag{position:absolute !important;top:10px !important;right:10px !important;z-index:2 !important;display:grid !important;place-items:center !important;width:30px !important;height:30px !important;border-radius:999px !important;background:rgba(8,13,15,.72) !important;backdrop-filter:blur(8px) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-body{min-height:0 !important;padding:13px !important;display:flex !important;flex-direction:column !important;gap:9px !important;flex:1 1 auto !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-title{color:var(--sccb-cyan) !important;font-size:14px !important;line-height:1.22 !important;font-weight:950 !important;text-decoration:none !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-title:hover{color:var(--sccb-green) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-meta-line{color:var(--sccb-muted) !important;font-size:12px !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-meta-line a{color:var(--sccb-green) !important;text-decoration:none !important;font-weight:850 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-updated-chip{display:inline-flex !important;max-width:100% !important;margin-left:5px !important;padding:3px 7px !important;border-radius:999px !important;background:rgba(142,232,95,.13) !important;color:var(--sccb-green) !important;font-size:11px !important;font-weight:900 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-chips{display:flex !important;flex-wrap:wrap !important;gap:5px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-chip{padding:4px 7px !important;border-radius:999px !important;background:#173236 !important;color:var(--sccb-cyan) !important;font-size:11px !important;font-weight:850 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-summary{margin:0 !important;color:var(--sccb-muted) !important;font-size:12px !important;line-height:1.35 !important;display:-webkit-box !important;-webkit-line-clamp:3 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-stats{display:flex !important;gap:9px !important;flex-wrap:wrap !important;margin-top:auto !important;color:#8aa9a4 !important;font-size:11px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card-actions{margin-top:2px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card-actions .sccb-add{width:100% !important;margin:0 !important;min-height:36px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-page{max-width:min(1380px,calc(100vw - 28px)) !important;width:min(1380px,calc(100vw - 28px)) !important;margin-inline:auto !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-native-title-hidden,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-native-gallery-image-hidden{display:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-hero{display:flex !important;align-items:center !important;gap:14px !important;margin:18px 0 !important;padding:18px !important;border-radius:24px !important;background:linear-gradient(135deg,rgba(29,45,49,.98),rgba(13,21,23,.98)) !important;border:1px solid rgba(231,247,244,.09) !important;box-shadow:0 18px 54px rgba(0,0,0,.32) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-hero-icon{width:18px !important;height:28px !important;clip-path:polygon(50% 0,100% 38%,50% 100%,0 38%) !important;background:linear-gradient(180deg,var(--sccb-yellow),var(--sccb-green)) !important;color:transparent !important;flex:0 0 auto !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-hero h1{margin:0 !important;color:var(--sccb-text) !important;font-size:clamp(22px,3vw,42px) !important;line-height:1.05 !important;font-weight:950 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-subtitle{margin-top:4px !important;color:var(--sccb-muted) !important;font-size:13px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-custom-gallery{position:relative !important;margin:0 0 18px !important;border-radius:24px !important;background:#081012 !important;border:1px solid rgba(231,247,244,.08) !important;overflow:hidden !important;box-shadow:0 18px 54px rgba(0,0,0,.35) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-main{display:block !important;aspect-ratio:16 / 9 !important;min-height:280px !important;max-height:70vh !important;background:#071012 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-image{display:block !important;width:100% !important;height:100% !important;background-size:contain !important;background-repeat:no-repeat !important;background-position:center !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-rail{display:flex !important;gap:8px !important;padding:10px !important;overflow-x:auto !important;background:rgba(23,35,38,.92) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-thumb{all:unset !important;box-sizing:border-box !important;width:78px !important;height:56px !important;flex:0 0 auto !important;border-radius:12px !important;background-size:cover !important;background-position:center !important;border:2px solid transparent !important;cursor:pointer !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-thumb.active{border-color:var(--sccb-green) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-nav{position:absolute !important;top:calc(50% - 28px) !important;z-index:2 !important;width:42px !important;height:42px !important;border:0 !important;border-radius:999px !important;background:rgba(23,35,38,.82) !important;color:var(--sccb-text) !important;font-size:30px !important;line-height:1 !important;cursor:pointer !important;box-shadow:0 10px 26px rgba(0,0,0,.35) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-nav.prev{left:12px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-nav.next{right:12px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-panel,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .card,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .list-group,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .list-group-item,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .alert,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .table,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .accordion-item{border-radius:20px !important;background:linear-gradient(180deg,rgba(29,45,49,.96),rgba(16,23,25,.96)) !important;border:1px solid rgba(231,247,244,.08) !important;color:var(--sccb-text) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-downloadlink,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] a.downloadlink,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] a[href*="/download/"]{display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:8px !important;min-height:42px !important;padding:10px 16px !important;border-radius:999px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-weight:950 !important;text-decoration:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-native-button:not(.sccb-add):not(.sccb-btn){border:0 !important;border-radius:999px !important;background:#253b40 !important;color:var(--sccb-text) !important;font-weight:850 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .carousel-control-prev,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .carousel-control-next{width:40px !important;height:40px !important;top:50% !important;transform:translateY(-50%) !important;border-radius:999px !important;background:rgba(23,35,38,.84) !important;opacity:1 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] footer,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-footer{margin-top:48px !important;background:#0b1012 !important;color:var(--sccb-muted) !important;border-top:1px solid rgba(231,247,244,.08) !important;}@media (max-width:700px){html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-shell,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] main,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .container,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .container-fluid,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-page{width:calc(100vw - 12px) !important;max-width:calc(100vw - 12px) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-gallery-main{min-height:220px !important;aspect-ratio:4 / 3 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-hero{align-items:flex-start !important;}}.sccb-add,.sccb-btn,.sccb-icon-btn,#sccb-fab,#sccb-add-visible,.sccb-site-add-visible{display:none !important;}#sccb-add-visible{all:unset;box-sizing:border-box;border:none !important;border-radius:999px !important;background:#253b40 !important;color:var(--sccb-text) !important;cursor:pointer !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:7px !important;font:800 12px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;padding:8px 12px !important;margin:6px 4px 4px 0 !important;text-decoration:none !important;text-shadow:none !important;box-shadow:none !important;transition:transform 120ms ease,background 120ms ease,box-shadow 120ms ease,color 120ms ease !important;}.sccb-add:hover,.sccb-btn:hover,.sccb-icon-btn:hover,#sccb-add-visible:hover{transform:translateY(-1px) !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-cyan)) !important;color:#061012 !important;text-decoration:none !important;}.sccb-add[disabled],.sccb-btn[disabled]{opacity:.65 !important;cursor:wait !important;transform:none !important;}.sccb-add[data-sccb-state="added"]{background:linear-gradient(90deg,var(--sccb-green),var(--sccb-yellow)) !important;color:#101719 !important;}.sccb-add[data-sccb-state="choice"]{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#071112 !important;}.sccb-add[data-sccb-state="error"]{background:#3b2229 !important;color:#ffd5db !important;}.sccb-detail-button{margin:10px 0 !important;}#sccb-fab{position:fixed !important;right:18px !important;bottom:18px !important;z-index:2147483646 !important;padding:13px 17px !important;background:linear-gradient(135deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-weight:900 !important;box-shadow:0 12px 34px rgba(40,215,197,.28) !important;}#sccb-fab:hover{box-shadow:0 16px 42px rgba(40,215,197,.38) !important;}#sccb-add-visible{position:fixed !important;right:18px !important;bottom:72px !important;z-index:2147483645 !important;background:#1d2d31 !important;color:var(--sccb-green) !important;}.sccb-plumbob-mini,.sccb-plumbob{display:inline-block;width:12px;height:18px;background:linear-gradient(180deg,var(--sccb-yellow),var(--sccb-green));clip-path:polygon(50% 0,100% 38%,50% 100%,0 38%);filter:drop-shadow(0 0 10px rgba(142,232,95,.55));}.sccb-plumbob{width:14px;height:22px;}.sccb-panel-shell{position:fixed;right:18px;bottom:78px;z-index:2147483645;width:min(620px,calc(100vw - 24px));max-height:min(760px,calc(100vh - 110px));}.sccb-panel,.sccb-file-modal{color:var(--sccb-text);background:linear-gradient(180deg,var(--sccb-panel),var(--sccb-bg));border:none;border-radius:24px;box-shadow:0 24px 70px var(--sccb-shadow);overflow:hidden;font:13px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}.sccb-panel{display:flex;flex-direction:column;max-height:inherit;}.sccb-panel-header,.sccb-modal-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 16px;background:linear-gradient(90deg,#162326,#20373a);border:none;}.sccb-panel-title{display:inline-flex;align-items:center;gap:10px;font-weight:950;letter-spacing:.2px;color:var(--sccb-text);}.sccb-icon-btn{width:30px !important;height:30px !important;padding:0 !important;margin:0 0 0 4px !important;background:#253b40 !important;color:var(--sccb-muted) !important;}.sccb-icon-btn:hover{background:var(--sccb-danger) !important;color:#170608 !important;}.sccb-panel-body,.sccb-modal-body{padding:10px;overflow:auto;}.sccb-summary{padding:12px;margin-bottom:8px;border-radius:16px;background:#111b1e;color:var(--sccb-muted);font-weight:700;}.sccb-mod-list,.sccb-file-list,.sccb-choice-list{display:grid;gap:8px;}.sccb-mod-card,.sccb-choice-group{background:var(--sccb-panel-2);border:none;border-radius:18px;overflow:hidden;}.sccb-mod-header,.sccb-choice-group-header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:12px;background:rgba(255,255,255,.02);}.sccb-mod-title,.sccb-choice-title{color:var(--sccb-text) !important;font-weight:900;font-size:13px;text-decoration:none !important;}.sccb-mod-title:hover{color:var(--sccb-green) !important;}.sccb-muted,.sccb-file-meta,.sccb-choice-file-meta{color:var(--sccb-muted);font-size:12px;}.sccb-mod-actions{white-space:nowrap;}.sccb-file-row,.sccb-file-choice{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:start;padding:10px 12px;margin:0;background:#182528;color:var(--sccb-text);cursor:pointer;}.sccb-file-choice{grid-template-columns:auto 1fr;margin:7px 0;border-radius:15px;}.sccb-file-row:hover,.sccb-file-choice:hover{background:#22353a;}.sccb-file-row input,.sccb-file-choice input{margin-top:4px;accent-color:var(--sccb-green);}.sccb-file-name,.sccb-choice-file-name{display:block;color:var(--sccb-green) !important;font-weight:850;word-break:break-word;text-decoration:none !important;}.sccb-file-meta,.sccb-choice-file-meta{display:block;margin-top:3px;}.sccb-panel-actions,.sccb-modal-actions{display:flex;flex-wrap:wrap;gap:8px;padding:12px;background:#111b1e;}.sccb-panel-actions{max-height:145px;overflow:auto;}.sccb-btn{margin:0 !important;}.sccb-btn.primary{background:linear-gradient(90deg,var(--sccb-green),var(--sccb-yellow)) !important;color:#101719 !important;}.sccb-btn.danger{background:#3b2229 !important;color:#ffd5db !important;}.sccb-btn.danger:hover{background:var(--sccb-danger) !important;color:#170608 !important;}.sccb-modal-backdrop{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:18px;background:rgba(3,7,8,.68);backdrop-filter:blur(8px);}.sccb-file-modal{width:min(620px,100%);max-height:min(780px,calc(100vh - 36px));display:flex;flex-direction:column;}.sccb-modal-header h2{margin:0;color:var(--sccb-text);font:950 15px/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}.sccb-toast{position:fixed;right:18px;bottom:128px;z-index:2147483647;max-width:min(460px,calc(100vw - 36px));background:#172326;color:var(--sccb-text);border:none;border-radius:16px;padding:12px 14px;box-shadow:0 16px 48px rgba(0,0,0,.45);font:800 13px/1.35 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}.sccb-toast.error{background:#3b2229;color:#ffd5db;}.sccb-sheet-handle{display:none;width:42px;height:5px;border-radius:999px;background:rgba(231,247,244,.24);margin:10px auto 4px;flex:0 0 auto;}#sccb-mini-strip{display:none;box-sizing:border-box;position:fixed;left:10px;right:10px;bottom:calc(10px+env(safe-area-inset-bottom));z-index:2147483645;gap:8px;align-items:center;padding:8px;border:none;border-radius:20px;background:linear-gradient(90deg,#162326,#20373a);box-shadow:0 18px 54px rgba(0,0,0,.46);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}#sccb-mini-strip[data-empty="1"]{display:none !important;}.sccb-mini-open,.sccb-mini-download{all:unset;box-sizing:border-box;border:none;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 13px;font:900 13px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}.sccb-mini-open{flex:1;background:#111b1e;color:var(--sccb-text);}.sccb-mini-download{background:linear-gradient(90deg,var(--sccb-green),var(--sccb-yellow));color:#101719;}.sccb-mini-download[disabled]{opacity:.55;cursor:default;}.sccb-advanced-actions{display:flex;flex-wrap:wrap;gap:8px;width:100%;}.sccb-more-toggle{display:none !important;}.sccb-row-remove{padding:7px 10px !important;color:#ffd5db !important;background:#3b2229 !important;}.sccb-choice-toolbar{display:flex;flex-wrap:wrap;gap:8px;padding:0 0 10px;}.sccb-choice-toolbar .sccb-btn{min-height:34px !important;}button.sccb-choice-group-header{all:unset;box-sizing:border-box;display:flex;justify-content:space-between;gap:10px;align-items:flex-start;width:100%;padding:12px;background:rgba(255,255,255,.02);cursor:pointer;}button.sccb-choice-group-header:hover{background:rgba(255,255,255,.05);}.sccb-choice-group-header>span:first-child{display:grid;gap:3px;min-width:0;}.sccb-choice-caret{color:var(--sccb-green);font-weight:950;font-size:18px;line-height:1;}.sccb-choice-group.collapsed .sccb-choice-list{display:none;}.sccb-likely-duplicate{background:#2b2a1d !important;outline:1px solid rgba(216,243,90,.22);}.sccb-duplicate-note{display:block;margin-top:6px;padding:7px 9px;border-radius:12px;background:rgba(216,243,90,.10);color:#edf8a6;font-size:12px;font-weight:800;}.sccb-duplicate-note.high{background:rgba(255,197,72,.14);color:#ffe5a3;}.sccb-dupe-heading{padding:11px 12px;color:var(--sccb-yellow);background:rgba(216,243,90,.08);font-weight:900;font-size:12px;}.sccb-setting-row{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;padding:11px 12px;margin-bottom:8px;border-radius:15px;background:#182528;color:var(--sccb-text);font-weight:750;}.sccb-setting-row input,.sccb-setting-row select{accent-color:var(--sccb-green);}.sccb-setting-row select{min-width:105px;border:none;border-radius:999px;padding:7px 9px;background:#253b40;color:var(--sccb-text);font:800 12px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}.sccb-btn:active,.sccb-add:active,#sccb-fab:active,.sccb-mini-open:active,.sccb-mini-download:active{transform:scale(.98) !important;}@media (max-width:760px){#sccb-site-toolbar{position:sticky;top:0;width:calc(100% - 16px);margin:8px auto 10px;align-items:stretch;flex-direction:column;border-radius:20px;}.sccb-site-toolbar-main{align-items:flex-start;}.sccb-site-toolbar-main .sccb-plumbob{margin-top:1px;}.sccb-site-toolbar-meta{display:block;white-space:normal;}.sccb-site-toolbar-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));}.sccb-site-toolbar-btn{min-height:40px;}.sccb-site-add-visible{grid-column:1 / -1;}}@media (max-width:640px){.sccb-sheet-handle{display:block;}.sccb-panel-shell{left:0;right:0;bottom:0;width:100vw;max-height:88vh;max-height:88dvh;z-index:2147483646;}.sccb-panel{max-height:88vh;max-height:88dvh;border-radius:24px 24px 0 0;}.sccb-panel-header,.sccb-modal-header{padding:10px 14px 13px;}.sccb-panel-body,.sccb-modal-body{padding:10px 10px 0;}.sccb-panel-actions,.sccb-modal-actions{position:sticky;bottom:0;z-index:1;padding:10px 12px calc(12px+env(safe-area-inset-bottom));max-height:none;overflow:visible;}.sccb-panel-actions>.sccb-btn.primary,.sccb-modal-actions>.sccb-btn.primary{flex:1 1 100%;min-height:46px;font-size:15px !important;order:-2;}.sccb-panel-actions>.sccb-btn:not(.primary),.sccb-modal-actions>.sccb-btn:not(.primary){min-height:42px;}.sccb-more-toggle{display:inline-flex !important;}.sccb-advanced-actions{display:none;width:100%;padding-top:2px;}.sccb-advanced-actions.open{display:flex;}.sccb-advanced-actions .sccb-btn{flex:1 1 calc(50% - 4px);min-height:40px;}#sccb-fab{right:12px !important;bottom:calc(12px+env(safe-area-inset-bottom)) !important;padding:12px 14px !important;min-width:54px !important;}html[data-sccb-has-files="1"][data-sccb-panel-open="0"] #sccb-fab{display:none !important;}html[data-sccb-has-files="1"][data-sccb-panel-open="0"] #sccb-mini-strip{display:flex;}html[data-sccb-panel-open="1"] #sccb-mini-strip{display:none !important;}#sccb-add-visible{left:10px !important;right:10px !important;bottom:calc(66px+env(safe-area-inset-bottom)) !important;width:auto !important;min-height:42px !important;}.sccb-card-button,.sccb-add{width:100% !important;min-height:42px !important;margin:8px 0 0 !important;}.sccb-mod-header,.sccb-choice-group-header{gap:8px;}.sccb-mod-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}.sccb-file-row{grid-template-columns:auto 1fr;gap:10px;border-radius:0;padding:12px;}.sccb-file-row .sccb-row-remove{grid-column:2;justify-self:start;width:auto !important;min-height:34px !important;margin-top:2px !important;}.sccb-modal-backdrop{display:flex;align-items:flex-end;justify-content:center;padding:0;}.sccb-file-modal{width:100vw;max-height:90vh;max-height:90dvh;border-radius:24px 24px 0 0;}.sccb-choice-toolbar{position:sticky;top:0;z-index:1;background:linear-gradient(180deg,var(--sccb-panel),rgba(23,35,38,.94));padding:0 0 10px;}.sccb-choice-toolbar .sccb-btn{flex:1 1 calc(50% - 4px);min-height:40px !important;}.sccb-file-choice{min-height:48px;padding:12px;}.sccb-toast{left:12px;right:12px;bottom:calc(76px+env(safe-area-inset-bottom));max-width:none;}}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .browse-outer-body,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .browse-content,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentinner,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #browse-content{background:#0b1113 !important;color:var(--sccb-text) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .inBetweenLine,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #header-banners,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #adslotwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .browse-content>div:not(.sccb-mts-section):not(#sccb-site-toolbar){background:#111b1e !important;color:var(--sccb-text) !important;border-color:rgba(231,247,244,.08) !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation{margin:10px 0 8px !important;padding:14px 16px 8px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:22px 22px 10px 10px !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation[data-sccb-mts-page-nav="1"]{padding:0 !important;border-radius:24px !important;background:linear-gradient(135deg,rgba(18,34,37,.98),rgba(9,17,19,.98)) !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation[data-sccb-mts-page-nav="1"] .sccb-mts-native-title-row{display:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-hero{display:flex !important;align-items:center !important;justify-content:space-between !important;gap:16px !important;padding:18px 20px !important;background:radial-gradient(circle at 0% 0%,rgba(40,215,197,.14),transparent 32%),linear-gradient(135deg,rgba(23,39,43,.98),rgba(11,17,19,.98)) !important;color:var(--sccb-text) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-main{display:flex !important;flex-direction:column !important;min-width:0 !important;gap:8px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-crumbs{display:flex !important;align-items:center !important;flex-wrap:wrap !important;gap:6px !important;color:var(--sccb-muted) !important;font:850 12px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-crumb,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-crumbs a{color:var(--sccb-cyan) !important;text-decoration:none !important;font-weight:900 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-current{color:var(--sccb-text) !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-separator{color:rgba(231,247,244,.32) !important;font-weight:900 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-title-line{display:flex !important;align-items:center !important;flex-wrap:wrap !important;gap:10px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-title{margin:0 !important;color:var(--sccb-text) !important;font:950 clamp(22px,2.1vw,34px)/1.05 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:-.045em !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-count-chip{display:inline-flex !important;align-items:center !important;min-height:28px !important;padding:6px 10px !important;border-radius:999px !important;background:rgba(85,207,255,.12) !important;border:1px solid rgba(85,207,255,.18) !important;color:var(--sccb-cyan) !important;font:950 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-tagline{display:inline-flex !important;width:fit-content !important;max-width:100% !important;padding:7px 11px !important;border-radius:999px !important;background:rgba(6,16,18,.72) !important;color:var(--sccb-muted) !important;font:800 13px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-page-actions{display:flex !important;align-items:center !important;justify-content:flex-end !important;flex-wrap:wrap !important;gap:7px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation .headingtitle,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation .subtitle,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation .subtitle a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation a{color:var(--sccb-cyan) !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation .headingtitle{font-size:clamp(18px,1.4vw,25px) !important;font-weight:950 !important;letter-spacing:-.03em !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #pagenavigation .inBetweenLine,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .inBetweenLine{display:block !important;width:100% !important;margin:10px 0 0 !important;padding:9px 12px !important;border-radius:999px !important;background:#0b1113 !important;color:var(--sccb-text) !important;font-weight:650 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header.topLevelSections{display:flex !important;align-items:flex-start !important;gap:10px 12px !important;margin:0 0 8px !important;padding:14px 16px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:10px 10px 22px 22px !important;background:#111b1e !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections>span:last-child,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections span:has(>a.btn){display:flex !important;flex-wrap:wrap !important;align-items:center !important;gap:8px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections strong{color:var(--sccb-text) !important;font:900 13px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections a.btn,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header a.btn:not(.sccb-btn):not(.sccb-add){display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:7px !important;min-height:34px !important;margin:0 !important;padding:7px 12px !important;border:1px solid rgba(85,207,255,.08) !important;border-radius:999px !important;background:linear-gradient(180deg,#20353a,#17272b) !important;color:var(--sccb-cyan) !important;font:850 13px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-decoration:none !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 6px 16px rgba(0,0,0,.16) !important;white-space:nowrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections a.btn:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header a.btn:not(.sccb-btn):not(.sccb-add):hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;transform:translateY(-1px) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections .tag2,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections .badge,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections .label{display:inline-flex !important;align-items:center !important;justify-content:center !important;min-width:22px !important;height:22px !important;padding:0 7px !important;margin:0 -4px 0 2px !important;border-radius:999px !important;background:rgba(142,232,95,.95) !important;color:#061012 !important;font:950 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header:not(.topLevelSections){display:flex !important;align-items:center !important;flex-wrap:wrap !important;gap:8px 12px !important;margin:0 0 12px !important;padding:10px 14px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:18px !important;background:#10191c !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header select,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header input[type="text"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header input[type="search"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header .bginput{min-height:32px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:999px !important;background:#0b1113 !important;color:var(--sccb-text) !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header input[type="submit"],html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header .btn-mini{min-height:32px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-title{max-width:100% !important;overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .downloadPreview,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .sf-hidden,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section .downloadPreview{display:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .downloadcreator,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-card .forumtitles{display:block !important;max-height:3.1em !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #adsfreemessage,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .alert.alert-success,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .alert-info,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .well,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .breadcrumb{background:#152327 !important;color:var(--sccb-text) !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:18px !important;}@media (max-width:760px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .color-mode__header.topLevelSections{border-radius:18px !important;padding:12px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .topLevelSections a.btn{flex:1 1 auto !important;min-width:calc(50% - 8px) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section-title{max-width:100% !important;white-space:normal !important;}}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .maincontentinner,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-page{display:block !important;width:100% !important;max-width:none !important;min-width:0 !important;background:transparent !important;color:var(--sccb-text) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-native-hidden-title,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-native-hidden-stats,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .maincontentinner>.message-header.color-mode__header{display:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-hero{box-sizing:border-box !important;display:grid !important;grid-template-columns:minmax(0,1fr) auto !important;grid-template-areas:"title actions" "stats actions" !important;gap:12px 16px !important;align-items:center !important;width:100% !important;margin:12px 0 14px !important;padding:16px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:24px !important;background:radial-gradient(circle at 2% 0%,rgba(40,215,197,.16),transparent 28%),linear-gradient(135deg,rgba(29,45,49,.98),rgba(13,21,23,.98)) !important;box-shadow:0 18px 54px rgba(0,0,0,.32),inset 0 1px 0 rgba(255,255,255,.03) !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-titleblock{grid-area:title !important;display:flex !important;align-items:center !important;gap:13px !important;min-width:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-icon{flex:0 0 auto !important;width:58px !important;height:58px !important;border-radius:18px !important;object-fit:cover !important;background:#102326 !important;box-shadow:0 10px 28px rgba(0,0,0,.28) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-icon-fallback{display:grid !important;place-items:center !important;color:var(--sccb-green) !important;font-size:26px !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-titlecopy{min-width:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-kicker{margin:0 0 4px !important;color:var(--sccb-green) !important;font:950 11px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-transform:uppercase !important;letter-spacing:.08em !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-title{margin:0 !important;max-width:100% !important;color:var(--sccb-text) !important;font:950 clamp(21px,2vw,34px)/1.06 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:-.045em !important;overflow-wrap:anywhere !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-byline{margin-top:5px !important;color:var(--sccb-muted) !important;font:800 13px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-byline strong{color:var(--sccb-cyan) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-stat-row{grid-area:stats !important;display:flex !important;flex-wrap:wrap !important;gap:7px !important;min-width:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-stat-chip{display:inline-flex !important;align-items:center !important;min-height:28px !important;max-width:100% !important;padding:6px 10px !important;border-radius:999px !important;background:rgba(85,207,255,.10) !important;border:1px solid rgba(85,207,255,.14) !important;color:var(--sccb-cyan) !important;font:900 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;white-space:nowrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-actions{grid-area:actions !important;display:flex !important;align-items:center !important;justify-content:flex-end !important;flex-wrap:wrap !important;gap:8px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-native-buttons-bar{display:inline-flex !important;align-items:center !important;flex-wrap:wrap !important;gap:8px !important;margin:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-actions #sccb-detail-button,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-actions .sccb-detail-button{min-height:38px !important;margin:0 !important;padding:10px 14px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card{box-sizing:border-box !important;width:100% !important;margin:0 0 14px !important;padding:12px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:24px !important;background:linear-gradient(180deg,rgba(23,35,38,.98),rgba(9,14,16,.98)) !important;box-shadow:0 18px 54px rgba(0,0,0,.30) !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-head{display:flex !important;align-items:center !important;justify-content:space-between !important;gap:10px !important;margin:0 0 10px !important;color:var(--sccb-text) !important;font:950 13px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-hint{color:var(--sccb-muted) !important;font-weight:800 !important;font-size:12px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-carousel,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .main-carousel,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #largeScreenshots{display:block !important;width:100% !important;max-width:none !important;min-height:clamp(280px,52vh,640px) !important;margin:0 !important;border-radius:18px !important;background:#071012 !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .flickity-viewport{height:clamp(280px,52vh,640px) !important;min-height:clamp(280px,52vh,640px) !important;border-radius:18px !important;background:linear-gradient(45deg,rgba(255,255,255,.025) 25%,transparent 25%),linear-gradient(-45deg,rgba(255,255,255,.025) 25%,transparent 25%),#071012 !important;background-size:28px 28px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .flickity-slider,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .carousel-cell{height:100% !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .carousel-cell{width:100% !important;display:flex !important;align-items:center !important;justify-content:center !important;padding:10px !important;box-sizing:border-box !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .carousel-cell img,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .carousel-cell-image,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card img.flickity-lazyloaded{width:auto !important;height:auto !important;max-width:100% !important;max-height:100% !important;object-fit:contain !important;object-position:center !important;border-radius:14px !important;box-shadow:0 12px 34px rgba(0,0,0,.34) !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .flickity-button{width:42px !important;height:42px !important;border-radius:999px !important;background:rgba(29,45,49,.88) !important;color:var(--sccb-text) !important;box-shadow:0 10px 30px rgba(0,0,0,.35) !important;opacity:1 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .flickity-button:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-strip{display:grid !important;grid-auto-flow:column !important;grid-auto-columns:minmax(76px,104px) !important;gap:8px !important;margin-top:10px !important;padding:2px 2px 4px !important;overflow-x:auto !important;overscroll-behavior-inline:contain !important;scrollbar-color:#253b40 #0b1113 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-thumb{all:unset !important;box-sizing:border-box !important;display:block !important;height:64px !important;border-radius:14px !important;border:2px solid transparent !important;background:#102326 !important;overflow:hidden !important;cursor:pointer !important;opacity:.78 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-thumb.is-active,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-thumb:hover{border-color:var(--sccb-green) !important;opacity:1 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-thumb img{width:100% !important;height:100% !important;object-fit:cover !important;border-radius:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-layout{display:block !important;width:100% !important;margin-top:14px !important;background:transparent !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-main,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #descriptionbox.sccb-mts-detail-main{width:100% !important;max-width:none !important;float:none !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-main>.message,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-content-card,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-sidebar-card{border:1px solid rgba(231,247,244,.08) !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(18,30,33,.98),rgba(9,14,16,.98)) !important;color:var(--sccb-text) !important;overflow:hidden !important;box-shadow:0 14px 42px rgba(0,0,0,.23) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-tabcontent,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #tabcontent.sccb-mts-detail-tabcontent{display:grid !important;grid-template-columns:minmax(0,1fr) minmax(260px,330px) !important;gap:16px !important;align-items:start !important;width:100% !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-tab-pane{grid-column:1 !important;min-width:0 !important;width:100% !important;max-width:none !important;color:var(--sccb-text) !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-sidebar,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #sidebar.sccb-mts-detail-sidebar{grid-column:2 !important;grid-row:1 / span 8 !important;width:auto !important;max-width:none !important;min-width:0 !important;position:sticky !important;top:12px !important;align-self:start !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-tabs,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tabs-bg-white{display:flex !important;flex-wrap:wrap !important;gap:7px !important;margin:0 0 12px !important;padding:8px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:999px !important;background:#0b1113 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs li,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tabs-bg-white li{margin:0 !important;padding:0 !important;background:transparent !important;border:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tabs-bg-white a{display:inline-flex !important;align-items:center !important;min-height:34px !important;padding:8px 12px !important;border-radius:999px !important;background:#182528 !important;color:var(--sccb-muted) !important;font-weight:900 !important;text-decoration:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs .is-active-blue a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs .active a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tabs-bg-white .is-active-blue a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tabs-bg-white .active a{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-files,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #scroll_files.sccb-mts-detail-files{border-radius:20px !important;background:#10191c !important;border:1px solid rgba(231,247,244,.08) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-files .message-header,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-sidebar-card .message-header,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-content-card .message-header{background:linear-gradient(90deg,#162326,#20373a) !important;color:var(--sccb-text) !important;border:0 !important;border-radius:0 !important;padding:11px 13px !important;font:950 13px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-files .message-body,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-content-card .message-body,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-sidebar-card .message-body{background:transparent !important;color:var(--sccb-text) !important;padding:14px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page .message-body.padding-large{padding:14px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page .description,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page .bulmatab{color:var(--sccb-text) !important;line-height:1.62 !important;font-size:14px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page .description h2,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page .description h3,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page .description h4{color:var(--sccb-green) !important;margin-top:20px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page blockquote,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page .quote,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page pre,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-page code{background:#0b1113 !important;color:var(--sccb-text) !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:14px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-muted-adslot{min-height:0 !important;margin:8px 0 !important;padding:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important;opacity:.18 !important;overflow:hidden !important;}@media (max-width:980px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-hero{grid-template-columns:1fr !important;grid-template-areas:"title" "stats" "actions" !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-actions{justify-content:flex-start !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-tabcontent,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #tabcontent.sccb-mts-detail-tabcontent{grid-template-columns:1fr !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-sidebar,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #sidebar.sccb-mts-detail-sidebar{grid-column:1 !important;grid-row:auto !important;position:static !important;}}@media (max-width:640px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-hero,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card{border-radius:18px !important;padding:10px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-icon{width:46px !important;height:46px !important;border-radius:14px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-gallery-card .flickity-viewport,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-carousel,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .main-carousel,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #largeScreenshots{min-height:min(62vh,420px) !important;height:min(62vh,420px) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-gallery-strip{grid-auto-columns:74px !important;}}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] body{background:radial-gradient(circle at 78% 8%,rgba(40,215,197,.09),transparent 28%),linear-gradient(180deg,#10211f 0%,#071012 56%,#05090a 100%) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] body>.container,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .maincontentwrapper,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .span12,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .row{width:min(1760px,calc(100vw - 24px)) !important;max-width:none !important;min-width:0 !important;margin-left:auto !important;margin-right:auto !important;padding-left:0 !important;padding-right:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .maincontentinner,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-surface{box-sizing:border-box !important;width:100% !important;max-width:none !important;min-width:0 !important;background:transparent !important;border:0 !important;color:var(--sccb-text) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-native-gallery-hidden,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-native-leak-hidden,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #scroll_carousel,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #screenshots,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .maincontentinner>.message-header.color-mode__header,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .adslot-wrapper-horizontal,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .adslot-interstitial,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #adslot-interstitial{display:none !important;height:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #sccb-mts-detail-hero.sccb-mts-detail-hero{width:100% !important;margin:12px 0 14px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery{box-sizing:border-box !important;width:100% !important;margin:0 0 16px !important;padding:14px !important;border-radius:26px !important;border:1px solid rgba(231,247,244,.08) !important;background:linear-gradient(180deg,rgba(18,30,33,.98),rgba(7,16,18,.99)) !important;box-shadow:0 22px 70px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.035) !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-head{display:flex !important;justify-content:space-between !important;align-items:end !important;gap:12px !important;margin:0 0 12px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-kicker{color:var(--sccb-green) !important;font:950 11px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-transform:uppercase !important;letter-spacing:.08em !important;margin-bottom:4px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery h2{margin:0 !important;color:var(--sccb-text) !important;font:950 clamp(18px,1.6vw,28px)/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:-.035em !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-open{flex:0 0 auto !important;display:inline-flex !important;align-items:center !important;min-height:34px !important;padding:8px 12px !important;border-radius:999px !important;background:#20373a !important;color:var(--sccb-cyan) !important;font:900 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-decoration:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-stage{position:relative !important;display:grid !important;place-items:center !important;width:100% !important;min-height:clamp(360px,62vh,780px) !important;border-radius:22px !important;background:linear-gradient(45deg,rgba(255,255,255,.025) 25%,transparent 25%),linear-gradient(-45deg,rgba(255,255,255,.025) 25%,transparent 25%),#050c0e !important;background-size:30px 30px !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-main{display:block !important;width:auto !important;height:auto !important;max-width:100% !important;max-height:clamp(340px,60vh,740px) !important;object-fit:contain !important;object-position:center !important;border-radius:16px !important;box-shadow:0 18px 48px rgba(0,0,0,.38) !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-nav{position:absolute !important;top:50% !important;transform:translateY(-50%) !important;z-index:2 !important;display:grid !important;place-items:center !important;width:44px !important;height:44px !important;border:0 !important;border-radius:999px !important;background:rgba(29,45,49,.88) !important;color:var(--sccb-text) !important;font:950 30px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;box-shadow:0 12px 34px rgba(0,0,0,.4) !important;cursor:pointer !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-nav.prev{left:12px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-nav.next{right:12px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-nav:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-thumbs{display:grid !important;grid-auto-flow:column !important;grid-auto-columns:minmax(92px,132px) !important;gap:9px !important;margin-top:12px !important;padding:2px 2px 5px !important;overflow-x:auto !important;overscroll-behavior-inline:contain !important;scrollbar-color:#253b40 #0b1113 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-thumb{all:unset !important;box-sizing:border-box !important;display:block !important;height:74px !important;border-radius:15px !important;border:2px solid transparent !important;background:#102326 !important;overflow:hidden !important;cursor:pointer !important;opacity:.72 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-thumb.is-active,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-thumb:hover{border-color:var(--sccb-green) !important;opacity:1 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-thumb img{width:100% !important;height:100% !important;object-fit:cover !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .navbits-top,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-cardified,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #descriptionbox>.message,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #sidebar>.message,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #scroll_files.message{border:1px solid rgba(231,247,244,.08) !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(16,25,28,.99),rgba(7,16,18,.99)) !important;box-shadow:0 16px 48px rgba(0,0,0,.26) !important;color:var(--sccb-text) !important;overflow:hidden !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .navbits-top{padding:10px 12px !important;margin:0 0 10px !important;border-radius:16px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-native-header-themed,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .message-header,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .color-mode__header{background:linear-gradient(90deg,#162326,#20373a) !important;color:var(--sccb-text) !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-native-body-themed,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .message-body,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .padding-large,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .bulmatab,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .description{background:transparent !important;color:var(--sccb-text) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .column-wrapper.cf{display:block !important;margin-top:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #tabcontent{display:grid !important;grid-template-columns:minmax(0,1fr) minmax(270px,360px) !important;gap:16px !important;align-items:start !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent1,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent2,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent3,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent5{grid-column:1 !important;min-width:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #sidebar{grid-column:2 !important;grid-row:1 / span 10 !important;align-self:start !important;position:sticky !important;top:12px !important;width:auto !important;float:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.tabs-bg-white,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white{background:#071012 !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:999px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] table,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .table,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] tr,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] td,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] th{background:transparent !important;color:var(--sccb-text) !important;border-color:rgba(231,247,244,.08) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent1 a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent2 a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent3 a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualcontent5 a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #sidebar a{color:var(--sccb-cyan) !important;}@media (max-width:980px){html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #tabcontent{grid-template-columns:1fr !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #sidebar{grid-column:1 !important;grid-row:auto !important;position:static !important;}}@media (max-width:640px){html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery{padding:10px !important;border-radius:18px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-head{align-items:start !important;flex-direction:column !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-stage{min-height:min(62vh,440px) !important;border-radius:16px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-custom-gallery-main{max-height:min(58vh,410px) !important;}}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-breadcrumb-rail{display:flex !important;flex-wrap:wrap !important;align-items:center !important;gap:7px !important;width:100% !important;min-width:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-breadcrumb-chip{display:inline-flex !important;align-items:center !important;max-width:min(38ch,100%) !important;min-height:30px !important;padding:7px 11px !important;border-radius:999px !important;background:rgba(29,45,49,.92) !important;border:1px solid rgba(85,207,255,.14) !important;color:var(--sccb-cyan) !important;font:900 12px/1.1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-decoration:none !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.03) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-breadcrumb-chip:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-breadcrumb-chip:focus{background:linear-gradient(90deg,rgba(40,215,197,.24),rgba(85,207,255,.18)) !important;color:var(--sccb-text) !important;box-shadow:0 10px 28px rgba(40,215,197,.14) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-breadcrumb-chip.is-current{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;border-color:transparent !important;color:#061012 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .sccb-mts-detail-breadcrumb-sep{color:rgba(231,247,244,.34) !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-stat-native-row,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #statistics_bar.sccb-mts-detail-stat-native-row{display:flex !important;flex-wrap:wrap !important;align-items:center !important;justify-content:flex-start !important;gap:8px !important;padding:10px 12px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:18px !important;background:linear-gradient(90deg,rgba(18,35,38,.98),rgba(11,17,19,.98)) !important;color:var(--sccb-text) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-stat-chip{display:inline-flex !important;align-items:center !important;gap:5px !important;min-height:31px !important;padding:7px 11px !important;border-radius:999px !important;background:rgba(85,207,255,.10) !important;border:1px solid rgba(85,207,255,.16) !important;color:var(--sccb-cyan) !important;font:900 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;white-space:nowrap !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-stat-chip .sccb-mts-detail-stat-value{color:var(--sccb-text) !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-detail-stat-chip .sccb-mts-detail-stat-label{color:var(--sccb-muted) !important;text-transform:lowercase !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs.is-boxed,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.sccb-mts-detail-tabs,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.tabs-bg-white,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white{position:sticky !important;top:0 !important;z-index:30 !important;display:flex !important;flex-wrap:wrap !important;align-items:center !important;gap:8px !important;min-height:auto !important;height:auto !important;margin:0 0 14px !important;padding:8px !important;border-radius:20px !important;border:1px solid rgba(231,247,244,.08) !important;background:linear-gradient(180deg,rgba(16,25,28,.98),rgba(6,12,13,.98)) !important;box-shadow:0 14px 36px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.03) !important;overflow:visible !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.sccb-mts-detail-tabs li,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white li,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tab-btn{display:inline-flex !important;align-items:center !important;height:auto !important;margin:0 !important;padding:0 !important;background:transparent !important;border:0 !important;border-radius:999px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.sccb-mts-detail-tabs a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs.is-boxed a{display:inline-flex !important;align-items:center !important;gap:7px !important;min-height:36px !important;padding:9px 13px !important;border:1px solid transparent !important;border-radius:999px !important;background:transparent !important;color:var(--sccb-muted) !important;font:950 13px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-decoration:none !important;transition:transform .14s ease,background .14s ease,color .14s ease,box-shadow .14s ease !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.sccb-mts-detail-tabs a:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.sccb-mts-detail-tabs a:focus,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white a:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white a:focus,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tab-btn:hover>a{transform:translateY(-1px) !important;background:rgba(40,215,197,.14) !important;border-color:rgba(40,215,197,.22) !important;color:var(--sccb-text) !important;box-shadow:0 12px 30px rgba(40,215,197,.12) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.sccb-mts-detail-tabs .is-active-blue a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs.sccb-mts-detail-tabs .active a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white .is-active-blue a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs-bg-white .active a,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tab-btn.is-active-blue>a{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;border-color:transparent !important;color:#061012 !important;box-shadow:0 12px 30px rgba(40,215,197,.20) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs .icon,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs .icon i{color:currentColor !important;width:auto !important;margin:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] .tabs .badge,html[data-sccb-site="mts"][data-sccb-host-ui="1"][data-sccb-detail="1"] #actualtabs .badge{min-width:20px !important;height:20px !important;display:inline-grid !important;place-items:center !important;padding:0 6px !important;border-radius:999px !important;background:rgba(6,16,18,.72) !important;color:var(--sccb-green) !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-themed-button,html[data-sccb-site="mts"][data-sccb-host-ui="1"] a.sccb-mts-themed-button,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .button,html[data-sccb-site="mts"][data-sccb-host-ui="1"] a.button,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tag:not(body),html[data-sccb-site="mts"][data-sccb-host-ui="1"] .btn:not(.sccb-btn):not(.sccb-add),html[data-sccb-site="mts"][data-sccb-host-ui="1"] a.btn:not(.sccb-btn):not(.sccb-add){box-sizing:border-box !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:7px !important;min-height:34px !important;padding:8px 12px !important;border:1px solid rgba(231,247,244,.10) !important;border-radius:999px !important;background:rgba(29,45,49,.96) !important;color:var(--sccb-text) !important;font:900 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-decoration:none !important;text-shadow:none !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.03) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-themed-button:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .button:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .tag:not(body):hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .btn:not(.sccb-btn):not(.sccb-add):hover{transform:translateY(-1px) !important;background:linear-gradient(90deg,rgba(40,215,197,.24),rgba(142,232,95,.20)) !important;color:var(--sccb-text) !important;border-color:rgba(142,232,95,.28) !important;box-shadow:0 12px 28px rgba(40,215,197,.14) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #thankme.sccb-mts-thanks-button,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-thanks-button{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;border-color:transparent !important;color:#061012 !important;font-weight:950 !important;box-shadow:0 12px 30px rgba(142,232,95,.18) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-thanked-chip,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #thanksyou{display:inline-flex !important;align-items:center !important;min-height:32px !important;padding:8px 12px !important;border-radius:999px !important;background:rgba(142,232,95,.14) !important;color:var(--sccb-green) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-author-downloads-button{background:rgba(85,207,255,.12) !important;color:var(--sccb-cyan) !important;border-color:rgba(85,207,255,.20) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .header1fontColor,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .darkgreen,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-native-accent-themed{color:var(--sccb-green) !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .fas.fa-arrow-alt-right,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .fa-solid.fa-arrow-alt-right{display:inline-grid !important;place-items:center !important;width:20px !important;height:20px !important;border-radius:999px !important;background:rgba(142,232,95,.14) !important;color:var(--sccb-green) !important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .fas.fa-arrow-alt-right::before,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .fa-solid.fa-arrow-alt-right::before{content:"›" !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-inline-alert-icon{display:inline-grid !important;place-items:center !important;width:1.45em !important;height:1.45em !important;margin:0 .16em !important;border-radius:999px !important;background:rgba(216,243,90,.16) !important;color:var(--sccb-yellow) !important;font-size:.95em !important;vertical-align:-.18em !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-downloads-zone .sccb-mts-grid,html[data-sccb-site="mts"][data-sccb-host-ui="1"] [data-sccb-detail="1"] .sccb-mts-grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr)) !important;gap:16px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-heading{background:linear-gradient(90deg,#162326,#20373a) !important;color:var(--sccb-text) !important;border:0 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-downloads-zone.cards-horizontal,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-downloads-zone .cards-horizontal,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-downloads-zone .smol-css-grid{overflow:visible !important;scroll-snap-type:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-downloads-zone .smol-css-grid:not(.sccb-mts-grid){display:grid !important;grid-template-columns:repeat(auto-fill,minmax(230px,1fr)) !important;grid-auto-flow:row !important;grid-auto-columns:initial !important;gap:16px !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top{margin:10px 0 12px !important;padding:8px !important;border:1px solid rgba(231,247,244,.08) !important;border-radius:18px !important;background:linear-gradient(90deg,rgba(12,25,28,.98),rgba(18,35,38,.98)) !important;color:var(--sccb-text) !important;box-shadow:0 12px 32px rgba(0,0,0,.22) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits .breadcrumb,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits ul,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top .breadcrumb{display:flex !important;flex-wrap:wrap !important;align-items:center !important;gap:6px !important;margin:0 !important;padding:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important;list-style:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits li,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top li{display:inline-flex !important;align-items:center !important;gap:6px !important;margin:0 !important;padding:0 !important;background:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits .divider,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top .divider{color:rgba(231,247,244,.32) !important;font-weight:950 !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits li>a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits li>strong>a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top li>a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top li>strong>a{display:inline-flex !important;align-items:center !important;min-height:28px !important;padding:6px 10px !important;border-radius:999px !important;background:rgba(29,45,49,.92) !important;border:1px solid rgba(231,247,244,.08) !important;color:var(--sccb-cyan) !important;font:900 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;text-decoration:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits li:last-child>a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #navbits li:last-child>strong>a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top li:last-child>a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .navbits-top li:last-child>strong>a{background:rgba(142,232,95,.14) !important;border-color:rgba(142,232,95,.22) !important;color:var(--sccb-green) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.tabs-bg-white{background:linear-gradient(90deg,rgba(9,18,20,.98),rgba(14,28,31,.98)) !important;border-color:rgba(231,247,244,.10) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.tabs-bg-white a{background:rgba(29,45,49,.92) !important;color:var(--sccb-text) !important;border:1px solid rgba(231,247,244,.08) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs a *,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.tabs-bg-white a *{color:inherit !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs a:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs a:focus,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.tabs-bg-white a:hover,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.tabs-bg-white a:focus{background:rgba(40,215,197,.18) !important;border-color:rgba(85,207,255,.30) !important;color:#ffffff !important;box-shadow:0 10px 26px rgba(40,215,197,.13) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs .is-active-blue a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.sccb-mts-detail-tabs .active a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.tabs-bg-white .is-active-blue a,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs.tabs-bg-white .active a{background:linear-gradient(90deg,#28d7c5,#8ee85f) !important;color:#061012 !important;border-color:transparent !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs .badge{background:rgba(6,16,18,.78) !important;color:var(--sccb-green) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs .is-active-blue .badge,html[data-sccb-site="mts"][data-sccb-host-ui="1"] #actualtabs .active .badge{background:rgba(6,16,18,.88) !important;color:var(--sccb-green) !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-inline-alert-pill{display:inline-flex !important;align-items:center !important;gap:6px !important;min-height:24px !important;margin:0 .2em !important;padding:4px 8px !important;border-radius:999px !important;background:rgba(216,243,90,.14) !important;border:1px solid rgba(216,243,90,.24) !important;color:var(--sccb-yellow) !important;font:950 11px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;vertical-align:middle !important;text-shadow:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-inline-alert-pill strong{color:inherit !important;font:inherit !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-site-card-ribbon{display:none !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-downloads-zone .sccb-rendered-mts-card,html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-section .sccb-rendered-mts-card{display:flex !important;}html[data-sccb-site="mts"][data-sccb-host-ui="1"] .sccb-mts-related-downloads-zone .smol-card-component:not(.sccb-rendered-mts-card){padding:12px !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(16,23,25,.98)) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]{--tsr-background:#101719 !important;--tsr-background-light:#172326 !important;--tsr-text:var(--sccb-text) !important;--tsr-primary:var(--sccb-teal) !important;background:var(--sccb-bg) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body{background:radial-gradient(circle at 22% 0%,rgba(40,215,197,.12),transparent 30%),linear-gradient(180deg,#101719,#081012) !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"],html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body,html[data-sccb-tsr-preload="1"],html[data-sccb-tsr-preload="1"] body{min-width:0 !important;background-color:#101719 !important;background-attachment:fixed !important;background-size:auto !important;background-repeat:no-repeat !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body::before,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body::after,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .background::before,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .background::after,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .page-background,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .site-background,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .bg,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .noise,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .stripe,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .stripes{display:none !important;opacity:0 !important;visibility:hidden !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"]:is(#app,#root,.app,.page,.wrapper,.site-wrapper,.main-wrapper,.content-wrapper,.tsr-page,.tsr-wrapper){background-color:transparent !important;background-image:none !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] [style*="background"]:not(.item-image):not(.sccb-tsr-gallery-main):not(.sccb-tsr-gallery-thumb){background-image:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] a{color:var(--sccb-cyan) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .main-content-wrapper,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-page,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .detail-page,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #browse-files,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-wrapper{width:min(1780px,calc(100vw - 28px)) !important;max-width:none !important;margin-inline:auto !important;background:transparent !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #browse-files,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .recommendation-items{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(245px,1fr)) !important;gap:18px !important;align-items:stretch !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-file,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .item-wrapper.sccb-tsr-card{height:auto !important;min-height:0 !important;margin:0 !important;padding:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .item-wrapper.sccb-tsr-card{display:flex !important;flex-direction:column !important;overflow:hidden !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(16,23,25,.98)) !important;box-shadow:0 18px 46px rgba(0,0,0,.26) !important;border:1px solid rgba(231,247,244,.07) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .item-wrapper.sccb-tsr-card:hover{transform:translateY(-2px) !important;box-shadow:0 24px 58px rgba(0,0,0,.38) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-border,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-site-card-ribbon,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .favorite-toggle,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .share-button,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .admin-item-hidden{display:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .item-image.sccb-tsr-card-image{display:block !important;width:100% !important;aspect-ratio:4 / 3 !important;min-height:0 !important;height:auto !important;background-size:contain !important;background-repeat:no-repeat !important;background-position:center !important;background-color:#0c1719 !important;border-radius:18px 18px 0 0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-info.sccb-tsr-card-body{display:flex !important;flex-direction:column !important;gap:8px !important;padding:12px !important;min-height:190px !important;color:var(--sccb-text) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-info-title-info{color:var(--sccb-text) !important;font:900 15px/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-info-category,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-info-creator,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .created-by{color:var(--sccb-muted) !important;font-size:12px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .browse-info-published-date.sccb-tsr-date-chip,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .artist-downloads.sccb-tsr-stats-chip{width:fit-content !important;max-width:100% !important;padding:5px 8px !important;border-radius:999px !important;background:rgba(142,232,95,.12) !important;border:1px solid rgba(142,232,95,.20) !important;color:var(--sccb-green) !important;font:800 11px/1.2 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .download-button.download-now,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-button,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .button{border:0 !important;border-radius:999px !important;background:rgba(37,59,64,.95) !important;color:var(--sccb-text) !important;box-shadow:none !important;font-weight:900 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .download-button.download-now:hover,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .button:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .item-wrapper.sccb-tsr-card>.sccb-add,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .item-wrapper.sccb-tsr-card .sccb-card-button{width:calc(100% - 24px) !important;margin:0 12px 12px !important;min-height:38px !important;justify-content:center !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-hero{width:min(1780px,calc(100vw - 28px)) !important;margin:18px auto 16px !important;padding:18px !important;border-radius:26px !important;background:linear-gradient(135deg,rgba(23,35,38,.98),rgba(29,45,49,.92)) !important;border:1px solid rgba(231,247,244,.08) !important;box-shadow:0 18px 48px rgba(0,0,0,.28) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-hero h1{margin:8px 0 !important;color:var(--sccb-text) !important;font:950 clamp(24px,3vw,42px)/1.05 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-crumbs,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-hero-meta{display:flex !important;flex-wrap:wrap !important;gap:8px !important;align-items:center !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-crumbs span,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-hero-meta span{padding:6px 9px !important;border-radius:999px !important;background:rgba(85,207,255,.10) !important;border:1px solid rgba(85,207,255,.16) !important;color:var(--sccb-cyan) !important;font:850 12px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-crumbs b{color:var(--sccb-dim) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-title-hidden>.browse-info-title,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-title-hidden>.full-category-path{display:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-wrapper{display:grid !important;grid-template-columns:minmax(0,1.45fr) minmax(320px,.75fr) !important;gap:18px !important;align-items:start !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-left-wrapper,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-right-wrapper,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .info-panel,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-creation-info,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .big-download-buttons,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .help-buttons,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-panel{border-radius:22px !important;background:rgba(23,35,38,.96) !important;border:1px solid rgba(231,247,244,.08) !important;color:var(--sccb-text) !important;box-shadow:0 16px 38px rgba(0,0,0,.22) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-left-wrapper,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-right-wrapper{padding:14px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-gallery{padding:12px !important;border-radius:24px !important;background:#0b1416 !important;border:1px solid rgba(231,247,244,.08) !important;margin-bottom:12px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-gallery-main{display:grid !important;place-items:center !important;aspect-ratio:4 / 3 !important;background:#070d0f !important;border-radius:18px !important;overflow:hidden !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-gallery-main img{width:100% !important;height:100% !important;object-fit:contain !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-gallery-rail{display:flex !important;gap:8px !important;margin-top:10px !important;overflow-x:auto !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-gallery-thumb{width:82px !important;height:62px !important;flex:0 0 auto !important;padding:0 !important;border:1px solid rgba(85,207,255,.20) !important;border-radius:12px !important;overflow:hidden !important;background:rgba(29,45,49,.9) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-gallery-thumb img{width:100% !important;height:100% !important;object-fit:contain !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-gallery-hidden{display:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs{display:flex !important;flex-wrap:wrap !important;align-items:center !important;gap:8px !important;width:100% !important;min-width:0 !important;min-height:0 !important;margin:0 0 12px !important;padding:8px !important;list-style:none !important;border-radius:18px !important;background:rgba(6,16,18,.82) !important;border:1px solid rgba(231,247,244,.08) !important;box-shadow:inset 0 1px 0 rgba(231,247,244,.04) !important;overflow:visible !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs li,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs li{display:flex !important;align-items:center !important;justify-content:center !important;flex:0 1 auto !important;width:auto !important;min-width:0 !important;height:auto !important;min-height:0 !important;margin:0 !important;padding:0 !important;float:none !important;background:transparent !important;border:0 !important;line-height:1 !important;text-indent:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs li.hideme,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs li.hideme{display:flex !important;visibility:visible !important;opacity:1 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs a,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs a,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs .tab-link,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs .tab-link{display:inline-flex !important;align-items:center !important;justify-content:center !important;width:auto !important;min-width:96px !important;max-width:100% !important;height:38px !important;min-height:38px !important;padding:0 15px !important;margin:0 !important;border-radius:999px !important;background:rgba(29,45,49,.96) !important;border:1px solid rgba(85,207,255,.16) !important;color:#e7f7f4 !important;font:900 13px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:.01em !important;text-align:center !important;text-decoration:none !important;text-transform:none !important;text-shadow:none !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;float:none !important;box-shadow:none !important;opacity:1 !important;filter:none !important;text-indent:0 !important;vertical-align:middle !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs a *,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs a *{color:inherit !important;line-height:1 !important;text-align:center !important;text-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs .active-tab a,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs .active-tab a,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs a:hover,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs a:hover,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.sccb-tsr-tabs a:focus,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .tabs.group.sccb-tsr-tabs a:focus{background:linear-gradient(90deg,#28d7c5,#8ee85f) !important;color:#061012 !important;border-color:transparent !important;outline:none !important;box-shadow:0 10px 26px rgba(40,215,197,.22) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .nav.hover-drop,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .searchbar,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .pager{background:rgba(23,35,38,.98) !important;color:var(--sccb-text) !important;border-radius:18px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .pager a,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .pager span,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .pager .on{border-radius:999px !important;background:rgba(37,59,64,.88) !important;color:var(--sccb-text) !important;padding:6px 10px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .pager .on{background:var(--sccb-green) !important;color:#061012 !important;}@media (max-width:900px){html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .details-wrapper{grid-template-columns:1fr !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #browse-files{grid-template-columns:repeat(auto-fill,minmax(190px,1fr)) !important;}}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-detail-layout,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-related-layout{width:min(1780px,calc(100vw - 32px)) !important;margin:18px auto !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-layout{display:grid !important;grid-template-columns:minmax(0,1.18fr) minmax(360px,.72fr) !important;gap:24px !important;align-items:start !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-main,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-side{display:grid !important;gap:16px !important;align-content:start !important;min-width:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-card{padding:16px !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(23,35,38,.98),rgba(13,25,28,.96)) !important;border:1px solid rgba(231,247,244,.08) !important;box-shadow:0 18px 44px rgba(0,0,0,.25) !important;color:var(--sccb-text) !important;min-width:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-card>h2,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-related-header h2{margin:0 0 12px !important;color:var(--sccb-text) !important;font:950 clamp(17px,1.4vw,22px)/1.18 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;letter-spacing:-.02em !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-detail-hidden,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-related-hidden{display:none !important;visibility:hidden !important;height:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;overflow:hidden !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-layout .sccb-tsr-gallery{margin:0 !important;padding:16px !important;border-radius:26px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-layout .sccb-tsr-gallery-main{min-height:420px !important;max-height:72vh !important;aspect-ratio:4 / 3 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-layout .sccb-tsr-tabs{order:2 !important;width:100% !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description{order:3 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description .details-creation-info,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description .info-panel,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-comments .comments-area,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-comments .details-comments{background:transparent !important;border:0 !important;box-shadow:none !important;padding:0 !important;margin:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description *,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-comments,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-comments *{text-align:left !important;color:inherit;line-height:1.58 !important;vertical-align:baseline !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description:is(p,li,div),html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-comments:is(p,li,div){font-size:14px !important;letter-spacing:.005em !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description:is(a,.shorturl,.copy-shorturl),html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-comments a{color:var(--sccb-cyan) !important;text-decoration:none !important;overflow-wrap:anywhere !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-description:is(a,.shorturl,.copy-shorturl):hover,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-comments a:hover{color:var(--sccb-green) !important;text-decoration:underline !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-summary-card{width:100% !important;max-width:none !important;margin:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-actions .big-download-buttons,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-actions .help-buttons,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-actions .vip-div-line{display:flex !important;flex-wrap:wrap !important;gap:8px !important;padding:0 !important;margin:0 !important;background:transparent !important;border:0 !important;box-shadow:none !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-actions-slot{display:grid !important;gap:10px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-actions .sccb-detail-button{width:100% !important;justify-content:center !important;min-height:42px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-stats .file-data,html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-stats .big-info-details{display:flex !important;flex-wrap:wrap !important;gap:8px !important;background:transparent !important;border:0 !important;box-shadow:none !important;padding:0 !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-related-layout{display:grid !important;gap:18px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-related-section{padding:16px !important;border-radius:24px !important;background:rgba(13,25,28,.88) !important;border:1px solid rgba(231,247,244,.08) !important;box-shadow:0 14px 40px rgba(0,0,0,.20) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-related-header{display:flex !important;align-items:center !important;justify-content:space-between !important;gap:12px !important;margin-bottom:14px !important;padding-bottom:10px !important;border-bottom:1px solid rgba(231,247,244,.08) !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-related-header span{padding:6px 9px !important;border-radius:999px !important;background:rgba(142,232,95,.12) !important;color:var(--sccb-green) !important;font-weight:900 !important;font-size:12px !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-related-grid{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(210px,1fr)) !important;gap:16px !important;align-items:stretch !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-related-grid .sccb-rendered-tsr-card{width:100% !important;margin:0 !important;}@media (max-width:980px){html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-layout{grid-template-columns:1fr !important;}html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-detail-layout .sccb-tsr-gallery-main{min-height:260px !important;}}@media (max-width:760px){html[data-sccb-site][data-sccb-host-ui="1"] body{font-size:15px !important;line-height:1.58 !important;overflow-x:hidden !important;}html[data-sccb-site][data-sccb-host-ui="1"] #sccb-site-toolbar{width:calc(100vw - 16px) !important;margin:8px auto 10px !important;padding:10px !important;border-radius:18px !important;align-items:stretch !important;flex-direction:column !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-toolbar-main{align-items:flex-start !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-toolbar-title,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-toolbar-meta{white-space:normal !important;overflow:visible !important;text-overflow:clip !important;line-height:1.25 !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-toolbar-actions{display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr)) !important;width:100% !important;gap:8px !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-toolbar-btn,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-add,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-btn,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-card-button{min-height:44px !important;padding:0 14px !important;font-size:13px !important;}html[data-sccb-site][data-sccb-host-ui="1"] .sccb-tsr-hero,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-simblr-hero,html[data-sccb-site][data-sccb-host-ui="1"] .sccb-mts-page-hero{width:calc(100vw - 16px) !important;margin:10px auto !important;padding:14px !important;border-radius:20px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-tsr-hero h1,.sccb-simblr-hero-title,.sccb-mts-page-title,h1){font-size:clamp(22px,7vw,32px) !important;line-height:1.08 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(#browse-files,.sccb-mts-card-grid,.sccb-simblr-card-grid,.sccb-related-grid,.recommendation-items){grid-template-columns:1fr !important;gap:12px !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-rendered-mts-card,.sccb-rendered-simblr-card,.item-wrapper.sccb-tsr-card,.sccb-site-card){border-radius:18px !important;max-width:none !important;width:100% !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-card-title,.sccb-mod-title,.browse-info-title-info){font-size:clamp(15px,4.5vw,18px) !important;line-height:1.2 !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-chip,.sccb-card-chip,.sccb-tsr-date-chip,.browse-info-category){font-size:12px !important;line-height:1.2 !important;max-width:100% !important;overflow-wrap:anywhere !important;}#sccb-fab{right:12px !important;bottom:calc(12px+env(safe-area-inset-bottom)) !important;min-height:48px !important;}}@media (max-width:420px){html[data-sccb-site][data-sccb-host-ui="1"] .sccb-site-toolbar-actions{grid-template-columns:1fr !important;}html[data-sccb-site][data-sccb-host-ui="1"]:is(.sccb-tsr-crumbs,.sccb-tsr-hero-meta,.sccb-mts-page-breadcrumbs,.sccb-card-chips){gap:6px !important;}}@media (hover:none){.sccb-file-row:hover,.sccb-file-choice:hover,button.sccb-choice-group-header:hover{background:inherit;}.sccb-add:hover,.sccb-btn:hover,.sccb-icon-btn:hover,#sccb-add-visible:hover{transform:none !important;}}html[data-sccb-site="simblr"][data-sccb-host-ui="1"]{--bs-body-bg:var(--sccb-bg) !important;--bs-body-color:var(--sccb-text) !important;--bs-tertiary-bg:var(--sccb-panel) !important;--bs-secondary-bg:var(--sccb-panel-2) !important;--bs-border-color:rgba(85,207,255,.12) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] body{background:radial-gradient(circle at 18% -8%,rgba(40,215,197,.16),transparent 34%),radial-gradient(circle at 88% 12%,rgba(142,232,95,.10),transparent 28%),linear-gradient(180deg,#101719 0%,#0a0f11 100%) !important;color:var(--sccb-text) !important;min-width:0 !important;overflow-x:hidden !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-native-page-hidden,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-noise-hidden,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-native-card-hidden{display:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] #sccb-simblr-app{width:min(1680px,calc(100vw - 28px)) !important;margin:18px auto 80px !important;padding:0 !important;color:var(--sccb-text) !important;isolation:isolate !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-hero,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-hero{display:flex !important;align-items:center !important;justify-content:space-between !important;gap:18px !important;min-height:150px !important;padding:clamp(18px,3vw,34px) !important;border-radius:28px !important;background:linear-gradient(135deg,rgba(23,35,38,.96),rgba(16,23,25,.92)),radial-gradient(circle at 92% 0%,rgba(142,232,95,.18),transparent 34%) !important;box-shadow:0 24px 70px rgba(0,0,0,.38) !important;border:1px solid rgba(85,207,255,.10) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-kicker{display:inline-flex !important;align-items:center !important;gap:8px !important;margin-bottom:10px !important;color:var(--sccb-green) !important;font-size:12px !important;font-weight:900 !important;text-transform:uppercase !important;letter-spacing:.08em !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-hero h1,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-hero h1{margin:0 !important;max-width:980px !important;color:var(--sccb-text) !important;font-size:clamp(30px,4.2vw,62px) !important;line-height:.98 !important;letter-spacing:-.055em !important;text-wrap:balance !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-hero p{max-width:780px !important;margin:12px 0 0 !important;color:var(--sccb-muted) !important;font-size:clamp(14px,.45vw+13px,18px) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-hero-actions{display:flex !important;flex-wrap:wrap !important;gap:10px !important;justify-content:flex-end !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero-link,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-section-more,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-open-card{display:inline-flex !important;align-items:center !important;justify-content:center !important;min-height:38px !important;padding:0 14px !important;border-radius:999px !important;background:rgba(37,59,64,.92) !important;color:var(--sccb-text) !important;font-size:12px !important;font-weight:900 !important;text-decoration:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-hero-link:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-section-more:hover,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-open-card:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-panel,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-section,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-description,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-info-panel{margin-top:16px !important;padding:16px !important;border-radius:24px !important;background:rgba(13,21,23,.82) !important;box-shadow:0 18px 50px rgba(0,0,0,.30) !important;border:1px solid rgba(85,207,255,.09) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-title{margin-bottom:10px !important;color:var(--sccb-muted) !important;font-size:12px !important;font-weight:900 !important;text-transform:uppercase !important;letter-spacing:.06em !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-groups{display:grid !important;grid-template-columns:repeat(auto-fit,minmax(220px,1fr)) !important;gap:12px !important;align-items:stretch !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-group{min-width:0 !important;padding:12px !important;border-radius:18px !important;background:linear-gradient(180deg,rgba(29,45,49,.86),rgba(13,21,23,.72)) !important;border:1px solid rgba(85,207,255,.10) !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-group-title{display:inline-flex !important;align-items:center !important;min-height:28px !important;margin:0 0 9px !important;padding:0 10px !important;border-radius:999px !important;background:rgba(142,232,95,.16) !important;color:var(--sccb-green) !important;font-size:12px !important;line-height:1 !important;font-weight:950 !important;letter-spacing:.02em !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-chips,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-info-chips{display:flex !important;flex-wrap:wrap !important;gap:8px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-chip{display:inline-flex !important;align-items:center !important;min-height:32px !important;padding:0 12px !important;border-radius:999px !important;background:#1c3538 !important;color:var(--sccb-cyan) !important;text-decoration:none !important;font-size:12px !important;font-weight:800 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-chip:hover{background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;}@media (max-width:680px){html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-groups{grid-template-columns:1fr !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-panel{padding:12px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-chip{min-height:36px !important;}}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-section-head{display:flex !important;align-items:center !important;justify-content:space-between !important;gap:12px !important;margin-bottom:14px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-section-head h2{margin:0 !important;color:var(--sccb-text) !important;font-size:clamp(18px,1.2vw+16px,30px) !important;line-height:1.05 !important;letter-spacing:-.035em !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-section-head span{display:inline-flex !important;margin-top:4px !important;color:var(--sccb-green) !important;font-size:12px !important;font-weight:800 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-grid{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(220px,1fr)) !important;gap:16px !important;align-items:stretch !important;}@media (min-width:1500px){html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-grid{grid-template-columns:repeat(auto-fill,minmax(245px,1fr)) !important;}}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card{display:flex !important;flex-direction:column !important;min-width:0 !important;overflow:hidden !important;border:0 !important;border-radius:22px !important;background:linear-gradient(180deg,rgba(29,45,49,.98),rgba(16,28,31,.98)) !important;box-shadow:0 16px 38px rgba(0,0,0,.28) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card:hover{transform:translateY(-2px) !important;box-shadow:0 22px 48px rgba(0,0,0,.36) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-thumb{position:relative !important;display:block !important;width:100% !important;aspect-ratio:4 / 3 !important;padding:0 !important;overflow:hidden !important;background:#0d1517 !important;border-radius:18px 18px 10px 10px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-image{display:block !important;width:100% !important;height:100% !important;background-size:contain !important;background-position:center !important;background-repeat:no-repeat !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-placeholder{display:grid !important;place-items:center !important;width:100% !important;height:100% !important;color:var(--sccb-green) !important;font-size:38px !important;background:radial-gradient(circle at center,rgba(40,215,197,.16),transparent 54%) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-body{display:flex !important;flex:1 !important;flex-direction:column !important;gap:8px !important;padding:12px !important;min-width:0 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-title{color:var(--sccb-cyan) !important;font-size:15px !important;font-weight:900 !important;line-height:1.2 !important;text-decoration:none !important;display:-webkit-box !important;-webkit-line-clamp:2 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-meta-line{color:var(--sccb-muted) !important;font-size:12px !important;line-height:1.35 !important;min-width:0 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-meta-line a{color:var(--sccb-green) !important;text-decoration:none !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-updated-chip,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-chip{display:inline-flex !important;align-items:center !important;width:max-content !important;max-width:100% !important;min-height:24px !important;padding:0 8px !important;border-radius:999px !important;background:#1c3538 !important;color:var(--sccb-green) !important;font-size:11px !important;font-weight:900 !important;overflow:hidden !important;text-overflow:ellipsis !important;white-space:nowrap !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-chips,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-stats{display:flex !important;flex-wrap:wrap !important;gap:6px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-summary{margin:0 !important;color:var(--sccb-muted) !important;font-size:12px !important;line-height:1.42 !important;display:-webkit-box !important;-webkit-line-clamp:3 !important;-webkit-box-orient:vertical !important;overflow:hidden !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-stats{margin-top:auto !important;color:#8aa9a4 !important;font-size:11px !important;font-weight:800 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card-actions{display:flex !important;flex-direction:column !important;gap:8px !important;margin-top:2px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-rendered-simblr-card-actions .sccb-add{width:100% !important;min-height:38px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-hero{display:block !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-meta{display:flex !important;flex-wrap:wrap !important;gap:8px !important;margin-top:12px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-meta span{display:inline-flex !important;align-items:center !important;min-height:28px !important;padding:0 10px !important;border-radius:999px !important;background:#1c3538 !important;color:var(--sccb-green) !important;font-size:12px !important;font-weight:900 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-actions{display:flex !important;flex-wrap:wrap !important;gap:10px !important;margin-top:14px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery{position:relative !important;margin-top:16px !important;padding:14px !important;border-radius:26px !important;background:rgba(13,21,23,.86) !important;border:1px solid rgba(85,207,255,.10) !important;box-shadow:0 18px 50px rgba(0,0,0,.32) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-main{display:block !important;width:100% !important;height:clamp(320px,58vh,720px) !important;border-radius:20px !important;background:#071012 !important;overflow:hidden !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-image{display:block !important;width:100% !important;height:100% !important;background-size:contain !important;background-position:center !important;background-repeat:no-repeat !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-rail{display:grid !important;grid-template-columns:repeat(auto-fill,minmax(72px,1fr)) !important;gap:8px !important;margin-top:10px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-thumb{aspect-ratio:4 / 3 !important;border:0 !important;border-radius:12px !important;background-color:#102326 !important;background-size:cover !important;background-position:center !important;opacity:.68 !important;cursor:pointer !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-thumb.active{opacity:1 !important;outline:2px solid var(--sccb-green) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-nav{position:absolute !important;top:calc(50% - 28px) !important;z-index:2 !important;width:46px !important;height:46px !important;border:0 !important;border-radius:999px !important;background:rgba(16,28,31,.88) !important;color:var(--sccb-text) !important;font-size:30px !important;cursor:pointer !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-nav.prev{left:24px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-nav.next{right:24px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-layout{display:grid !important;grid-template-columns:minmax(0,1fr) minmax(280px,380px) !important;gap:16px !important;align-items:start !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-description h2,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-info-panel h3{margin:0 0 12px !important;color:var(--sccb-text) !important;font-size:18px !important;font-weight:950 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-description-copy{color:var(--sccb-text) !important;font-size:14px !important;line-height:1.65 !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-description-copy a{color:var(--sccb-cyan) !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-downloadlink{display:flex !important;align-items:center !important;justify-content:center !important;min-height:42px !important;margin-top:8px !important;border-radius:999px !important;background:linear-gradient(90deg,var(--sccb-teal),var(--sccb-green)) !important;color:#061012 !important;font-size:13px !important;font-weight:950 !important;text-decoration:none !important;}@media (max-width:860px){html[data-sccb-site="simblr"][data-sccb-host-ui="1"] #sccb-simblr-app{width:calc(100vw - 16px) !important;margin-top:10px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-hero,html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-hero{display:block !important;min-height:0 !important;padding:18px !important;border-radius:22px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-hero-actions{justify-content:flex-start !important;margin-top:14px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr)) !important;gap:12px !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-detail-redone-layout{grid-template-columns:1fr !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-main{height:min(58dvh,460px) !important;}}@media (max-width:520px){html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-card-grid{grid-template-columns:1fr !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-app-section-head{align-items:flex-start !important;flex-direction:column !important;}html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-redone-gallery-rail{grid-template-columns:repeat(4,1fr) !important;}}html[data-sccb-debug="1"] .sccb-site-section,html[data-sccb-debug="1"] .sccb-rendered-mts-card,html[data-sccb-debug="1"] .sccb-rendered-simblr-card,html[data-sccb-debug="1"] .sccb-rendered-tsr-card,html[data-sccb-debug="1"] #sccb-site-toolbar,html[data-sccb-debug="1"] .sccb-panel,html[data-sccb-debug="1"] .sccb-file-modal{outline:2px dashed rgba(85,207,255,.68) !important;outline-offset:3px !important;position:relative !important;}html[data-sccb-debug="1"] [data-sccb-module]::before{content:attr(data-sccb-module);position:absolute;z-index:1000002;top:6px;left:6px;max-width:calc(100% - 12px);padding:3px 7px;border-radius:999px;background:rgba(8,16,18,.88);color:var(--sccb-cyan);font:700 11px/1.2 var(--sccb-font,system-ui);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}html[data-sccb-mode="light"] .sccb-rendered-mts-card,html[data-sccb-mode="light"] .sccb-rendered-simblr-card,html[data-sccb-mode="light"] .sccb-rendered-tsr-card,html[data-sccb-mode="basket"] .sccb-rendered-mts-card,html[data-sccb-mode="basket"] .sccb-rendered-simblr-card,html[data-sccb-mode="basket"] .sccb-rendered-tsr-card,html[data-sccb-mode="disabled"] #sccb-site-toolbar,html[data-sccb-mode="disabled"] #sccb-fab,html[data-sccb-mode="disabled"] #sccb-mini-strip{display:none !important;}.sccb-grid-preview-group{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:min(100%,420px);}.sccb-grid-preview{min-height:40px;border:0;border-radius:14px;background:var(--sccb-panel-2);color:var(--sccb-muted);font-weight:800;cursor:pointer;}.sccb-grid-preview.active,.sccb-grid-preview:hover{background:color-mix(in srgb,var(--sccb-teal) 18%,var(--sccb-panel-2));color:var(--sccb-text);}.sccb-basket-manager{gap:12px;}.sccb-basket-summary-grid{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}.sccb-basket-summary-grid>span,.sccb-warn-chip,.sccb-mini-chip{min-width:0;padding:5px 9px;border-radius:999px;background:color-mix(in srgb,var(--sccb-panel-2) 86%,var(--sccb-teal));color:var(--sccb-muted);font-size:12px;font-weight:760;}.sccb-warn-chip,.sccb-mini-chip.warn{color:var(--sccb-yellow);background:color-mix(in srgb,var(--sccb-panel-2) 85%,var(--sccb-yellow));}.sccb-mini-chip.danger{color:var(--sccb-danger);background:color-mix(in srgb,var(--sccb-panel-2) 82%,var(--sccb-danger));}.sccb-basket-controls{display:grid;gap:10px;padding:10px;border-radius:18px;background:var(--sccb-panel);}.sccb-basket-search,.sccb-session-select,.sccb-inline-select select,.sccb-file-edit input,.sccb-file-edit textarea{width:100%;min-width:0;min-height:38px;border:0;border-radius:14px;background:var(--sccb-panel-2);color:var(--sccb-text);padding:8px 10px;font:inherit;}.sccb-file-edit textarea{min-height:56px;resize:vertical;}.sccb-segmented{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;}.sccb-segmented button{flex:0 0 auto;border:0;border-radius:999px;background:var(--sccb-panel-2);color:var(--sccb-muted);min-height:34px;padding:7px 10px;font-weight:780;cursor:pointer;}.sccb-segmented button.active,.sccb-segmented button:hover{color:var(--sccb-text);background:color-mix(in srgb,var(--sccb-panel-2) 78%,var(--sccb-teal));}.sccb-inline-select,.sccb-session-row{display:flex;gap:8px;align-items:center;min-width:0;}.sccb-inline-select span{flex:0 0 auto;color:var(--sccb-muted);font-size:12px;font-weight:800;}.sccb-session-row>select{flex:1 1 auto;}.sccb-empty-state{display:grid;gap:4px;padding:22px;text-align:center;color:var(--sccb-muted);}.sccb-empty-state strong{color:var(--sccb-text);font-size:15px;}.sccb-basket-mod-group{contain:layout paint;}.sccb-mod-heading{min-width:0;}.sccb-mod-meta-line,.sccb-compact-line,.sccb-plan-row{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.sccb-basket-view-compact .sccb-mod-card{padding-block:10px;}.sccb-file-chip-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px;}.sccb-file-edit{margin-top:8px;}.sccb-file-edit summary{cursor:pointer;color:var(--sccb-muted);font-weight:800;font-size:12px;}.sccb-file-edit[open]{display:grid;gap:7px;}.sccb-queue-state{display:grid;gap:4px;padding:10px;border-radius:16px;background:color-mix(in srgb,var(--sccb-panel) 86%,var(--sccb-green));color:var(--sccb-text);}.sccb-queue-state span{color:var(--sccb-muted);font-size:12px;}.sccb-plan-grid,.sccb-health-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;}.sccb-plan-grid>span,.sccb-health-item{display:grid;gap:3px;padding:10px;border-radius:16px;background:var(--sccb-panel-2);color:var(--sccb-muted);min-width:0;}.sccb-health-item strong{color:var(--sccb-text);font-size:18px;}.sccb-health-item.warn strong{color:var(--sccb-yellow);}.sccb-plan-list{display:grid;gap:5px;margin-top:12px;max-height:240px;overflow:auto;}.sccb-diagnostics-pre{max-width:100%;overflow:auto;padding:12px;border-radius:16px;background:var(--sccb-bg);color:var(--sccb-muted);font-size:12px;line-height:1.5;}.sccb-toast-action{display:flex;align-items:center;justify-content:space-between;gap:12px;}.sccb-toast-action button{border:0;border-radius:999px;background:var(--sccb-green);color:#061012;padding:6px 10px;font-weight:900;cursor:pointer;}.sccb-mod-description-preview{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;width:100%;max-width:100%;overflow:hidden;margin-top:6px;padding:0;border:0;background:transparent;color:var(--sccb-muted);text-align:left;font:inherit;font-size:12px;line-height:1.35;cursor:pointer;overflow-wrap:anywhere;}.sccb-mod-description-preview:hover{color:var(--sccb-text);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--sccb-teal) 55%,transparent);}.sccb-mod-info-modal{width:min(760px,calc(100vw - 24px));}.sccb-mod-info-body{display:grid;gap:12px;}.sccb-mod-info-chip-row{display:flex;flex-wrap:wrap;gap:6px;}.sccb-mod-info-preview{margin:0;padding:10px 12px;border-radius:16px;background:var(--sccb-panel);color:var(--sccb-muted);line-height:1.45;}.sccb-mod-info-description,.sccb-mod-info-files{display:grid;gap:8px;min-width:0;}.sccb-mod-info-description h3,.sccb-mod-info-files h3{margin:0;color:var(--sccb-text);font-size:14px;letter-spacing:.01em;}.sccb-mod-info-description-copy{max-height:min(46vh,520px);overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;padding:12px;border-radius:16px;background:var(--sccb-panel);color:var(--sccb-text);line-height:1.55;}.sccb-mod-info-file-list{display:grid;gap:6px;}.sccb-mod-info-file-row{display:grid;gap:3px;min-width:0;padding:9px 10px;border-radius:14px;background:var(--sccb-panel);color:var(--sccb-text);text-decoration:none;}.sccb-mod-info-file-row span{color:var(--sccb-muted);font-size:12px;}.sccb-mod-info-file-row strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.sccb-basket-summary-compact{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;}.sccb-summary-primary,.sccb-summary-status{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-width:0;color:var(--sccb-muted);font-size:12px;}.sccb-summary-primary strong{color:var(--sccb-text);}.sccb-basket-controls-compact{padding:0;background:transparent;}.sccb-basket-control-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;}.sccb-refine-disclosure{position:relative;}.sccb-refine-disclosure>summary,.sccb-action-menu>summary{list-style:none;min-height:38px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:8px 12px;background:var(--sccb-panel-2);color:var(--sccb-text);font-weight:820;cursor:pointer;white-space:nowrap;}.sccb-refine-disclosure>summary::-webkit-details-marker,.sccb-action-menu>summary::-webkit-details-marker,.sccb-overflow-menu>summary::-webkit-details-marker{display:none;}.sccb-refine-drawer{position:absolute;z-index:30;top:calc(100%+8px);right:0;width:min(460px,calc(100vw - 34px));display:grid;gap:10px;padding:12px;border-radius:18px;background:var(--sccb-panel);box-shadow:0 18px 50px rgba(0,0,0,.42);}.sccb-refine-field{display:grid;grid-template-columns:78px minmax(0,1fr);gap:10px;align-items:center;min-width:0;}.sccb-refine-label{color:var(--sccb-muted);font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.06em;}.sccb-mod-header{grid-template-columns:auto minmax(0,1fr) auto;align-items:start;}.sccb-mod-select{margin-top:4px;accent-color:var(--sccb-green);}.sccb-mod-title-button{display:block;width:100%;border:0;padding:0;background:transparent;color:var(--sccb-text);text-align:left;font:inherit;font-weight:860;cursor:pointer;}.sccb-overflow-menu{position:relative;align-self:start;}.sccb-overflow-menu>summary{list-style:none;width:34px;height:34px;display:grid;place-items:center;border-radius:999px;background:var(--sccb-panel-2);color:var(--sccb-muted);font-size:18px;font-weight:900;cursor:pointer;}.sccb-overflow-menu[open]>summary,.sccb-overflow-menu>summary:hover{color:var(--sccb-text);background:color-mix(in srgb,var(--sccb-panel-2) 82%,var(--sccb-teal));}.sccb-overflow-popover{position:absolute;z-index:35;top:calc(100%+6px);right:0;min-width:180px;display:grid;gap:4px;padding:7px;border-radius:14px;background:var(--sccb-panel);box-shadow:0 16px 42px rgba(0,0,0,.45);}.sccb-menu-action{width:100%;justify-content:flex-start;text-align:left;border-radius:10px !important;background:transparent !important;}.sccb-menu-action:hover{background:var(--sccb-panel-2) !important;}.sccb-file-row{grid-template-columns:auto minmax(0,1fr) auto;}.sccb-file-popover{width:min(320px,calc(100vw - 42px));}.sccb-panel-actions-simple{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;}.sccb-panel-actions-simple>.primary{min-height:44px;}.sccb-action-menu{position:relative;}.sccb-action-drawer{position:absolute;z-index:40;right:0;bottom:calc(100%+8px);width:min(360px,calc(100vw - 30px));max-height:min(70vh,620px);overflow:auto;display:grid;gap:7px;padding:10px;border-radius:18px;background:var(--sccb-panel);box-shadow:0 20px 60px rgba(0,0,0,.5);}.sccb-action-group{border-radius:13px;background:var(--sccb-panel-2);overflow:hidden;}.sccb-action-group>summary{list-style:none;cursor:pointer;padding:10px 12px;color:var(--sccb-text);font-weight:820;}.sccb-action-group>summary::-webkit-details-marker{display:none;}.sccb-action-group-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:0 8px 8px;}.sccb-action-group-body .sccb-btn{min-width:0;white-space:normal;text-align:center;}@media (max-width:640px){.sccb-basket-controls{padding:0;}.sccb-basket-summary-compact{align-items:flex-start;flex-direction:column;}.sccb-refine-drawer{position:fixed;left:10px;right:10px;top:auto;bottom:calc(82px+env(safe-area-inset-bottom));width:auto;max-height:68dvh;overflow:auto;}.sccb-refine-field{grid-template-columns:1fr;gap:5px;}.sccb-overflow-popover{position:fixed;left:10px;right:10px;top:auto;bottom:calc(78px+env(safe-area-inset-bottom));width:auto;max-height:60dvh;overflow:auto;}.sccb-action-drawer{position:fixed;left:10px;right:10px;bottom:calc(78px+env(safe-area-inset-bottom));width:auto;max-height:70dvh;}.sccb-action-group-body{grid-template-columns:1fr;}.sccb-session-row,.sccb-inline-select{align-items:stretch;flex-direction:column;}.sccb-session-row,.sccb-inline-select{align-items:stretch;flex-direction:column;}.sccb-segmented{padding-bottom:2px;}.sccb-plan-grid,.sccb-health-grid{grid-template-columns:1fr 1fr;}}${getSccbCentralDesignSystemCss()}`;
    document.head.appendChild(style);
  }
}

function createMtsAdapter(deps) {
  const { parseMtsFiles, stableHash, cleanText, uniqueElements } = deps;
  return {
    id: 'mts',
    name: 'Mod The Sims',
    hosts: ['modthesims.info', 'www.modthesims.info'],
    detectPageType(doc = document, rawUrl = location.href) {
      if (this.isDetailUrl(rawUrl)) return 'detail';
      try {
        const url = new URL(rawUrl, location.href);
        if (/^\/$/.test(url.pathname)) return 'home';
        if (/\/(downloads|browse|search|tags?|showthread|f|forumdisplay)/i.test(url.pathname) || this.listingCards(doc).length) return 'listing';
      } catch (_) {}
      return this.listingCards(doc).length ? 'listing' : 'generic';
    },
    detailSelector: 'a[href*="/d/"], a[href*="download.php?t="]',
    isDetailUrl(rawUrl) {
      try {
        const url = new URL(rawUrl, location.href);
        return /^\/d\/\d+(?:\/|$)/.test(url.pathname) ||
          (url.pathname.endsWith('/download.php') && url.searchParams.has('t'));
      } catch { return false; }
    },
    modIdFromUrl(rawUrl) {
      const url = new URL(rawUrl, location.href);
      const match = url.pathname.match(/^\/d\/(\d+)/);
      return match?.[1] || url.searchParams.get('t') || stableHash(url.href);
    },
    normalizeDetailUrl(rawUrl) {
      return new URL(rawUrl, location.href).href;
    },
    listingCards(doc = document) {
      const candidates = [
        ...doc.querySelectorAll('li.smol-card-component, .smol-card-component, .downloadDetails, .download-card, article, .card')
      ];
      const cards = candidates
        .map(card => {
          // After the MTS UI rewrite, the clean card contains a .downloadDetails
          // body for compatibility. Do not wire that inner body as a second card,
          // or it gets a second + Basket button.
          const rendered = card.closest?.('.sccb-rendered-mts-card');
          if (rendered) return rendered;
          const native = card.closest?.('li.smol-card-component, .smol-card-component, .download-card, article.card, .card') || card;
          return native;
        });
      return uniqueElements(cards).filter(card => this.findModLink(card));
    },
    findModLink(root) {
      const links = [...root.querySelectorAll(this.detailSelector)].filter(a => this.isDetailUrl(a.href));
      return links.find(a => a.closest('.downloadtitle, .title, h2, h3')) ||
        links.find(a => cleanText(a.textContent)) || links[0] || null;
    },
    titleFromCard(card, link) {
      return cleanText(
        card.dataset.sccbTitle ||
        card.querySelector('.sccb-card-title, .downloadtitle, .download-title, .title, h2, h3')?.textContent ||
        link?.textContent ||
        link?.getAttribute('title') ||
        'Mod The Sims download'
      );
    },
    appendButton(card, button) {
      const target = card.querySelector('.sccb-rendered-card-actions, .downloadCardFooter, .downloadDetails, .buttons, .stats') || card;
      target.appendChild(button);
    },
    detailInsertTarget(doc = document) {
      return doc.querySelector('#sccb-mts-detail-actions') || doc.querySelector('#statistics_bar') || doc.querySelector('#actualtabs') || doc.querySelector('#scroll_files') || doc.querySelector('h1');
    },
    extractTitle(doc, pageUrl) {
      const title = cleanText(
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('h1')?.textContent ||
        doc.title ||
        new URL(pageUrl).pathname
      );
      return title.replace(/^Mod\s*The\s*Sims\s*-\s*/i, '').trim() || 'Mod The Sims download';
    },
    extractCreator(doc) {
      const ogAuthor = cleanText(doc.querySelector('meta[property="og:author"]')?.getAttribute('content'));
      if (ogAuthor) return ogAuthor;
      const maybe = cleanText(doc.querySelector('.creator, .downloaduser, a[href*="member.php"]')?.textContent);
      return maybe || '';
    },
    parseFiles(doc, pageUrl) {
      return parseMtsFiles(doc, pageUrl);
    },
    detectError(doc) {
      const text = cleanText(doc.body?.textContent || doc.documentElement.textContent || '').toLowerCase();
      if (/you must be logged in|login required|please log in/.test(text)) return 'Login may be required.';
      if (/adult|age gate|permission|not allowed|no permission/.test(text)) return 'A permission or age gate may be blocking the file list.';
      if (/removed|deleted|no longer available/.test(text)) return 'The download may have been removed.';
      return '';
    }
  };;
}

runSimsCcDownloadBasket([createMtsAdapter]);

})();
