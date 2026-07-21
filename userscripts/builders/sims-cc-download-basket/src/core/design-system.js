export function getSccbCentralDesignSystemCss() {
  return `
    /* ------------------------------------------------------------------
       Sims CC shared design system v1.2.0
       Central typography, theme tokens, component rules, and mobile safety.
       Keep cross-site typography/theme/rules here instead of duplicating
       them in individual site rewrites.
       ------------------------------------------------------------------ */

    :root,
    html[data-sccb-site] {
      --sccb-font-ui: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
      --sccb-font-display: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
      --sccb-type-body: clamp(13.5px, .22vw + 12.8px, 15.5px) !important;
      --sccb-type-small: clamp(11.5px, .14vw + 11px, 12.75px) !important;
      --sccb-type-chip: clamp(11px, .12vw + 10.8px, 12px) !important;
      --sccb-type-card-title: clamp(14.5px, .42vw + 13px, 17px) !important;
      --sccb-type-section-title: clamp(18px, .9vw + 15px, 25px) !important;
      --sccb-type-page-title: clamp(24px, 1.55vw + 18px, 44px) !important;
      --sccb-line-tight: 1.18 !important;
      --sccb-line-title: 1.22 !important;
      --sccb-line-body: 1.62 !important;
      --sccb-space-1: 4px !important;
      --sccb-space-2: 8px !important;
      --sccb-space-3: 12px !important;
      --sccb-space-4: 16px !important;
      --sccb-space-5: 20px !important;
      --sccb-space-6: 24px !important;
      --sccb-radius-sm: 10px !important;
      --sccb-radius-md: 14px !important;
      --sccb-radius-lg: 20px !important;
      --sccb-radius-xl: 26px !important;
      --sccb-surface: #111c1f !important;
      --sccb-surface-2: #172629 !important;
      --sccb-surface-3: #20363a !important;
      --sccb-border-soft: rgba(231,247,244,.075) !important;
      --sccb-border-glow: rgba(40,215,197,.18) !important;
      --sccb-focus-ring: 0 0 0 3px rgba(85,207,255,.26) !important;
      --sccb-site-max: min(100%, 1780px) !important;
      --sccb-readable-max: 92ch !important;
      --sccb-card-min: 220px !important;
      --sccb-card-gap: clamp(12px, 1.1vw, 20px) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"],
    html[data-sccb-site][data-sccb-host-ui="1"] body {
      min-width: 0 !important;
      width: 100% !important;
      max-width: none !important;
      overflow-x: clip !important;
      font-family: var(--sccb-font-ui) !important;
      font-size: var(--sccb-type-body) !important;
      line-height: var(--sccb-line-body) !important;
      color: var(--sccb-text) !important;
      background-color: var(--sccb-bg) !important;
      color-scheme: dark !important;
      font-kerning: normal !important;
      font-variant-ligatures: common-ligatures !important;
      text-rendering: optimizeLegibility !important;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] *,
    html[data-sccb-site][data-sccb-host-ui="1"] *::before,
    html[data-sccb-site][data-sccb-host-ui="1"] *::after {
      box-sizing: border-box !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      body, button, input, select, textarea, option,
      p, li, td, th, label, small, span, div, a
    ) {
      font-family: var(--sccb-font-ui) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      h1, h2, h3, h4, h5, h6,
      .sccb-site-title, .sccb-mts-page-title, .sccb-simblr-hero-title,
      .sccb-tsr-hero-title, .sccb-card-title, .sccb-mod-title,
      .browse-info-title-info, .downloadtitle, .title
    ) {
      font-family: var(--sccb-font-display) !important;
      color: var(--sccb-text) !important;
      letter-spacing: -0.035em !important;
      line-height: var(--sccb-line-title) !important;
      text-wrap: balance !important;
      overflow-wrap: anywhere !important;
      margin-block: 0 .45em !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(h1, .sccb-site-title, .sccb-mts-page-title, .sccb-simblr-hero-title, .sccb-tsr-hero-title) {
      font-size: var(--sccb-type-page-title) !important;
      line-height: 1.08 !important;
      max-width: min(100%, 18ch) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(h2, .sccb-site-section-title, .sccb-section-title, .sccb-mts-section-title) {
      font-size: var(--sccb-type-section-title) !important;
      line-height: 1.12 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-card-title, .sccb-mod-title, .browse-info-title-info) {
      font-size: var(--sccb-type-card-title) !important;
      line-height: var(--sccb-line-title) !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
      min-height: calc(var(--sccb-type-card-title) * 2.45) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(p, li, td, th, .sccb-body, .description, .downloadDescription, .item-description) {
      font-size: var(--sccb-type-body) !important;
      line-height: var(--sccb-line-body) !important;
      color: color-mix(in srgb, var(--sccb-text), #9bb8b3 18%) !important;
      max-width: var(--sccb-readable-max) !important;
      overflow-wrap: anywhere !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(small, .small, .meta, .date, .sccb-meta, .sccb-muted, .browse-info-published-date, .downloadcreator) {
      font-size: var(--sccb-type-small) !important;
      line-height: 1.35 !important;
      letter-spacing: .012em !important;
      color: var(--sccb-muted) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-chip, .sccb-card-chip, .sccb-source-pill, .sccb-stat-chip,
      .sccb-mts-subsection-chip, .sccb-tsr-date-chip, .browse-info-category,
      .tag, .badge, .label
    ) {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      max-width: 100% !important;
      min-height: 24px !important;
      padding: 4px 9px !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: linear-gradient(180deg, rgba(33,62,66,.96), rgba(23,42,45,.96)) !important;
      color: var(--sccb-cyan) !important;
      font-size: var(--sccb-type-chip) !important;
      font-weight: 800 !important;
      line-height: 1.15 !important;
      text-decoration: none !important;
      white-space: normal !important;
      text-align: center !important;
      overflow-wrap: anywhere !important;
      box-shadow: inset 0 0 0 1px rgba(85,207,255,.10) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-btn, .sccb-add, .sccb-card-button, .sccb-site-toolbar-btn,
      button, input[type="button"], input[type="submit"], a.button, .button, .btn
    ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle) {
      font-family: var(--sccb-font-ui) !important;
      font-size: clamp(12px, .18vw + 11.5px, 13.5px) !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      letter-spacing: -.005em !important;
      min-height: 36px !important;
      padding: 0 13px !important;
      border: 0 !important;
      border-radius: 999px !important;
      color: #061012 !important;
      background: linear-gradient(90deg, var(--sccb-teal), var(--sccb-green)) !important;
      text-shadow: none !important;
      box-shadow: 0 10px 26px rgba(40,215,197,.18) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 7px !important;
      white-space: nowrap !important;
      text-decoration: none !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(button, a, input, select, textarea):focus-visible {
      outline: none !important;
      box-shadow: var(--sccb-focus-ring), 0 0 0 1px rgba(85,207,255,.30) inset !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-toolbar, #sccb-site-toolbar,
      .sccb-mts-page-hero, .sccb-simblr-hero, .sccb-tsr-hero,
      .sccb-mts-section, .sccb-site-section, .sccb-related-section,
      .sccb-panel, .sccb-file-modal, .sccb-settings-panel
    ) {
      max-width: var(--sccb-site-max) !important;
      margin-inline: auto !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-mts-card-grid, .sccb-simblr-card-grid, .sccb-tsr-card-grid,
      .sccb-related-grid, #browse-files, .recommendation-items,
      .download-grid, .item-grid
    ) {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(var(--sccb-card-min), 1fr)) !important;
      gap: var(--sccb-card-gap) !important;
      align-items: stretch !important;
      width: 100% !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-rendered-mts-card, .sccb-rendered-simblr-card,
      .sccb-tsr-card, .sccb-site-card, [data-sccb-card="1"]
    ) {
      min-width: 0 !important;
      height: auto !important;
      display: flex !important;
      flex-direction: column !important;
      border-radius: var(--sccb-radius-lg) !important;
      background: linear-gradient(180deg, rgba(23,38,41,.98), rgba(13,23,25,.98)) !important;
      color: var(--sccb-text) !important;
      box-shadow: 0 18px 52px rgba(0,0,0,.30), inset 0 0 0 1px var(--sccb-border-soft) !important;
      overflow: hidden !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-card-thumb, .sccb-mod-thumb, .sccb-tsr-card-image, .sccb-simblr-card-image,
      .browse-image, .item-image
    ) {
      background-color: #0b1416 !important;
      border-radius: var(--sccb-radius-md) !important;
      overflow: hidden !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-card-thumb img, .sccb-mod-thumb img, .sccb-simblr-card-image img, .sccb-tsr-card-image img, .browse-image img, .item-image img) {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"],
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(#app, #root, .app, .page, .wrapper, .site-wrapper, .main-wrapper, .content-wrapper, .tsr-page, .tsr-wrapper, .layout, .main, main) {
      background-color: var(--sccb-bg) !important;
      background-image: radial-gradient(circle at 18% 0%, rgba(40,215,197,.10), transparent 30%), linear-gradient(180deg, #101719, #081012) !important;
      color: var(--sccb-text) !important;
      min-width: 0 !important;
      max-width: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.stripe, .stripes, .noise, .pattern, .texture, .site-bg, .page-bg, .background, .background-layer, .tsr-bg, .ad, .adsbygoogle),
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body::before,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body::after {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      background: none !important;
      background-image: none !important;
    }



    /* TSR hard reset: keep TSR's own white footer/nav/dropdown/modal layers from
       fighting the themed app. This intentionally lives in the central design
       system because TSR re-injects many of these surfaces after page load. */
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      body, #app, #root, .app, .page, .wrapper, .main-wrapper, .main-content-wrapper,
      .content-wrapper, .browse-page, .detail-page, main, section, article,
      .container, .container-fluid, .row, .row-fluid
    ) {
      background-color: transparent !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
      border-color: var(--sccb-border-soft) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"],
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] body {
      background:
        radial-gradient(circle at 18% 0%, rgba(40,215,197,.12), transparent 32%),
        radial-gradient(circle at 88% 12%, rgba(142,232,95,.07), transparent 26%),
        linear-gradient(180deg, #101719 0%, #081012 100%) !important;
      background-color: #101719 !important;
      color: var(--sccb-text) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      [style*="background: white"], [style*="background:white"],
      [style*="background-color: white"], [style*="background-color:white"],
      [style*="background: #fff"], [style*="background:#fff"],
      [style*="background-color: #fff"], [style*="background-color:#fff"],
      [style*="background: rgb(255"], [style*="background-color: rgb(255"]
    ):not(img):not(video):not(canvas):not(.sccb-card-thumb):not(.sccb-tsr-gallery-main):not(.sccb-tsr-gallery-thumb) {
      background: rgba(17,28,31,.96) !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .mainmenu, .menu-wrapper, .menu-content, nav.topbar, nav.main-nav,
      .nav-2-col-between, .mobile-menu, .dl-menuwrapper
    ) {
      background: transparent !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .mainmenu {
      position: sticky !important;
      top: 8px !important;
      z-index: 100000 !important;
      width: min(1180px, calc(100vw - 18px)) !important;
      max-width: calc(100vw - 18px) !important;
      margin: 8px auto 10px !important;
      padding: 0 !important;
      pointer-events: auto !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 8px !important;
      border-radius: 24px !important;
      background: linear-gradient(180deg, rgba(17,28,31,.98), rgba(9,18,20,.98)) !important;
      border: 1px solid rgba(231,247,244,.10) !important;
      box-shadow: 0 20px 58px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.04) !important;
      overflow: visible !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-content {
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      gap: 8px 12px !important;
      align-items: center !important;
      width: 100% !important;
      min-height: 0 !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .mainmenu :is(.logo, .logo-wrapper, .site-logo, img[alt*="Sims Resource"], img[src*="logo"]) {
      max-width: 74px !important;
      max-height: 74px !important;
      object-fit: contain !important;
      border-radius: 18px !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.topbar,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.main-nav {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
      min-width: 0 !important;
      width: 100% !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.nav.underline, .nav.spaced, .nav.hover-drop, nav.main-nav ul, nav.topbar ul) {
      display: flex !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
      background: transparent !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.nav.underline a, .nav.spaced a, .nav.hover-drop a, nav.main-nav a, nav.topbar a, .help-button, .cc-manager-button) {
      min-height: 34px !important;
      padding: 0 11px !important;
      border-radius: 999px !important;
      background: rgba(29,45,49,.92) !important;
      border: 1px solid rgba(231,247,244,.08) !important;
      color: var(--sccb-text) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-decoration: none !important;
      font-weight: 900 !important;
      text-shadow: none !important;
      white-space: nowrap !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.nav.underline a, .nav.spaced a, .nav.hover-drop a, nav.main-nav a, nav.topbar a, .help-button, .cc-manager-button):hover,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.nav.underline li:hover > a, .nav.hover-drop li:hover > a) {
      background: linear-gradient(90deg, rgba(40,215,197,.28), rgba(142,232,95,.20)) !important;
      color: #fff !important;
      border-color: rgba(85,207,255,.28) !important;
      box-shadow: 0 12px 28px rgba(40,215,197,.16) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .searchbar, .search-bar, .search-wrapper, .search-container,
      input[type="search"], input[type="text"], select
    ) {
      background: rgba(6,16,18,.82) !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
      border: 1px solid rgba(85,207,255,.14) !important;
      border-radius: 999px !important;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.02) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] input::placeholder {
      color: rgba(231,247,244,.58) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .dl-menu, .dl-submenu, .select-dropdown, .dropdown-menu, .dropdown-content,
      .dropdown-wrap ul, .nav.hover-drop ul, .nav.hover-drop li > ul,
      .popover, .tooltip, .thumbnail-popup, .basket-modal, .basketcta-popup,
      .ccmanager-cta-popup, .jump_popup
    ) {
      background: linear-gradient(180deg, rgba(23,38,41,.99), rgba(9,18,20,.99)) !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
      border: 1px solid rgba(85,207,255,.16) !important;
      border-radius: 18px !important;
      box-shadow: 0 22px 64px rgba(0,0,0,.48) !important;
      overflow: hidden !important;
      z-index: 100001 !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .dl-menu a, .dl-submenu a, .select-dropdown a, .dropdown-menu a,
      .dropdown-content a, .nav.hover-drop ul a, .thumbnail-popup a,
      .basket-modal a, .basketcta-popup a, .ccmanager-cta-popup a
    ) {
      color: var(--sccb-text) !important;
      background: transparent !important;
      text-decoration: none !important;
      border-radius: 10px !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .dl-menu a:hover, .select-dropdown a:hover, .dropdown-menu a:hover,
      .nav.hover-drop ul a:hover, .thumbnail-popup a:hover
    ) {
      color: #061012 !important;
      background: linear-gradient(90deg, var(--sccb-teal), var(--sccb-green)) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .md-modal, .md-content, .modal, .modal-content, .modal-dialog,
      .free-signup-cta, .login-popup, .email-verify-popup, .winback,
      .centered-modal, .download-cta, .magazine-modal
    ) {
      background: linear-gradient(180deg, rgba(23,38,41,.99), rgba(9,18,20,.99)) !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
      border: 1px solid rgba(231,247,244,.10) !important;
      border-radius: 22px !important;
      box-shadow: 0 28px 80px rgba(0,0,0,.56) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.md-modal h1, .md-modal h2, .md-modal h3, .md-content h1, .md-content h2, .modal-heading) {
      color: var(--sccb-text) !important;
      text-shadow: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      footer, .footer, #footer, .site-footer, .main-footer, .footer-wrapper,
      .footer-container, .footer-links-styling, #social-media-icons-container,
      #footer-about-links-container, #footer-legal-links-container
    ) {
      background: linear-gradient(180deg, #0d1719, #070d0f) !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
      border-color: rgba(231,247,244,.08) !important;
      box-shadow: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] footer {
      margin-top: 32px !important;
      padding: 28px max(18px, env(safe-area-inset-left)) calc(28px + env(safe-area-inset-bottom)) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.footer-stat-container, .footer-stat-label, .footer-stat-number) {
      color: var(--sccb-text) !important;
      background: transparent !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .footer-stat-number {
      color: var(--sccb-green) !important;
      font-weight: 950 !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(footer a, .footer a, .footer-links-styling a) {
      color: var(--sccb-cyan) !important;
      text-decoration: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.md-overlay, .modal-backdrop) {
      background: rgba(2,7,8,.72) !important;
      backdrop-filter: blur(8px) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .sccb-tsr-force-hidden,
      footer, #footer, .footer, .site-footer, .main-footer, .footer-wrapper, .footer-container,
      .top-ribbon, #anon.top-ribbon, #top-ribbon-trial, .redfast-text-only-web,
      .mainmenu.sccb-tsr-native-menu-hidden, .mainmenu.sccb-tsr-native-menu-hidden *,
      .mainmenu.sccb-tsr-force-hidden, .menu-wrapper.sccb-tsr-force-hidden,
      .menu-content.sccb-tsr-force-hidden, nav.topbar.sccb-tsr-force-hidden,
      nav.main-nav.sccb-tsr-force-hidden, .mobile-menu.sccb-tsr-force-hidden,
      .dl-menuwrapper.sccb-tsr-force-hidden,
      a.vip-leader, .vip-leader, .ad-browse-rectangle-wrapper, .ad-browse-rectangle-mid, div.ad-browse-rectangle-wrapper:nth-child(5), div.ad-browse-rectangle-wrapper:nth-child(17), .ad, .ads, .ad-slot, .ad-container, .ad-wrapper,
      .advert, .advertisement, .adsbygoogle, [data-google-query-id],
      iframe[src*="googlesyndication"], iframe[src*="doubleclick"],
      [id^="google_ads"], [id*="ad-slot"], [class*="adslot"], [class*="ad-slot"], [class*="ad-browse"]
    ) {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      width: 0 !important;
      height: 0 !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      overflow: hidden !important;
    }



    /* TSR controlled topbar: replace the busy native header with only
       Categories, search, and login. Keep native dropdowns/popups dark too. */
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .top-ribbon, #anon.top-ribbon, #top-ribbon-trial, .redfast-text-only-web,
      .mainmenu.sccb-tsr-native-menu-hidden,
      .mainmenu.sccb-tsr-native-menu-hidden *,
      .searchbar-basket, .join-vip, .vip-shop, .lookbuilder-btn,
      .submit-creations-wrapper, .top-support, .support-notifications-badge,
      .nav-divider, .tsr-logo, .logo, .logo-wrapper, .site-logo
    ) {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar {
      position: sticky !important;
      top: 10px !important;
      z-index: 100050 !important;
      width: min(1180px, calc(100vw - 20px)) !important;
      margin: 10px auto 12px !important;
      padding: 0 !important;
      background: transparent !important;
      color: var(--sccb-text) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner {
      display: grid !important;
      grid-template-columns: auto minmax(220px, 1fr) auto !important;
      gap: 10px !important;
      align-items: center !important;
      width: 100% !important;
      padding: 10px !important;
      border-radius: 28px !important;
      background: linear-gradient(180deg, rgba(15,27,30,.98), rgba(7,16,18,.98)) !important;
      border: 1px solid rgba(85,207,255,.14) !important;
      box-shadow: 0 22px 70px rgba(0,0,0,.46), inset 0 1px 0 rgba(255,255,255,.05) !important;
      overflow: visible !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat { position: relative !important; }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-button,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned {
      min-height: 42px !important;
      padding: 0 18px !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: linear-gradient(90deg, var(--sccb-teal), var(--sccb-green)) !important;
      color: #061012 !important;
      font-weight: 950 !important;
      font-size: 14px !important;
      text-decoration: none !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      white-space: nowrap !important;
      box-shadow: 0 12px 34px rgba(40,215,197,.22) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned {
      background: rgba(31,54,58,.92) !important;
      color: var(--sccb-cyan) !important;
      border: 1px solid rgba(85,207,255,.18) !important;
      box-shadow: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-button:hover,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned:hover {
      transform: translateY(-1px) !important;
      filter: brightness(1.04) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar.sccb-tsr-search-owned,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-fallback-search {
      width: 100% !important;
      min-width: 0 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      background: rgba(3,12,14,.78) !important;
      border: 1px solid rgba(85,207,255,.16) !important;
      border-radius: 999px !important;
      padding: 4px 8px !important;
      min-height: 42px !important;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.02) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar-input-bar {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar-categories-button.sccb-tsr-search-category-hidden,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .searchbar-icon {
      display: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar input[type="search"],
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar input[type="text"],
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .search-input-field {
      width: 100% !important;
      min-width: 0 !important;
      height: 32px !important;
      padding: 0 8px !important;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      color: var(--sccb-text) !important;
      font-size: 14px !important;
      outline: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu {
      position: absolute !important;
      left: 0 !important;
      top: calc(100% + 10px) !important;
      width: min(620px, calc(100vw - 24px)) !important;
      padding: 14px !important;
      border-radius: 24px !important;
      background: linear-gradient(180deg, rgba(18,32,35,.99), rgba(7,16,18,.99)) !important;
      color: var(--sccb-text) !important;
      border: 1px solid rgba(85,207,255,.18) !important;
      box-shadow: 0 26px 80px rgba(0,0,0,.58) !important;
      opacity: 0 !important;
      visibility: hidden !important;
      transform: translateY(-6px) !important;
      transition: opacity .14s ease, transform .14s ease, visibility .14s ease !important;
      z-index: 100060 !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat:hover .sccb-tsr-cat-menu,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat:focus-within .sccb-tsr-cat-menu,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar.sccb-cat-open .sccb-tsr-cat-menu {
      opacity: 1 !important;
      visibility: visible !important;
      transform: translateY(0) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-tabs,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-grid {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-tabs { margin-bottom: 12px !important; }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu a {
      min-height: 34px !important;
      padding: 0 12px !important;
      border-radius: 999px !important;
      background: rgba(29,45,49,.90) !important;
      color: var(--sccb-cyan) !important;
      border: 1px solid rgba(85,207,255,.10) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-decoration: none !important;
      font-weight: 900 !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-tabs a:nth-child(2),
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu a:hover {
      background: linear-gradient(90deg, var(--sccb-teal), var(--sccb-green)) !important;
      color: #061012 !important;
      border-color: transparent !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .nav.hover-drop > li > div, .nav.hover-drop li > div,
      .nav.hover-drop ul, .dropdown-menu, .dropdown-content,
      .search-categories-filter, #collections-menu-wrapper
    ) {
      background: linear-gradient(180deg, rgba(18,32,35,.99), rgba(7,16,18,.99)) !important;
      background-image: none !important;
      color: var(--sccb-text) !important;
      border: 1px solid rgba(85,207,255,.18) !important;
      border-radius: 20px !important;
      box-shadow: 0 26px 80px rgba(0,0,0,.58) !important;
    }



    /* TSR ad rectangles: remove both the ad contents and their grid wrappers so they never reserve browse-grid cells. */
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .ad-browse-rectangle-wrapper, .ad-browse-rectangle-mid,
      div.ad-browse-rectangle-wrapper:nth-child(5),
      div.ad-browse-rectangle-wrapper:nth-child(17),
      a.vip-leader, .vip-leader, [class*="ad-browse"]
    ) {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      width: 0 !important;
      height: 0 !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      grid-column: auto !important;
      grid-row: auto !important;
    }

    /* TSR pagination: themed pills instead of the tiny native strip. */
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.sccb-tsr-pagination, .pager, .pagination, .browse-pagination, [class*="pagination"], [class*="pager"]) {
      width: min(100%, var(--sccb-site-max)) !important;
      margin: 26px auto 16px !important;
      padding: 10px 12px !important;
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      background: linear-gradient(180deg, rgba(18,32,35,.96), rgba(8,17,19,.96)) !important;
      border: 1px solid rgba(85,207,255,.12) !important;
      border-radius: 22px !important;
      box-shadow: 0 18px 48px rgba(0,0,0,.30) !important;
      color: var(--sccb-muted) !important;
    }
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.sccb-tsr-pagination, .pager, .pagination, .browse-pagination, [class*="pagination"], [class*="pager"]) :is(a, button, span, li) {
      list-style: none !important;
      text-decoration: none !important;
    }
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.sccb-tsr-page-pill, .pager a, .pagination a, .pager span, .pagination span, .page-link) {
      min-width: 34px !important;
      min-height: 34px !important;
      padding: 0 12px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 999px !important;
      background: rgba(29,53,57,.90) !important;
      color: var(--sccb-cyan) !important;
      border: 1px solid rgba(85,207,255,.12) !important;
      font-size: 12px !important;
      font-weight: 950 !important;
      line-height: 1 !important;
      box-shadow: none !important;
    }
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.sccb-tsr-page-pill:hover, .pager a:hover, .pagination a:hover, .page-link:hover) {
      background: linear-gradient(90deg, var(--sccb-teal), var(--sccb-cyan)) !important;
      color: #061012 !important;
      transform: translateY(-1px) !important;
    }
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.sccb-tsr-page-current, .active > .page-link, .page-item.active .page-link, .pagination .active a, .pager .active a, [aria-current="page"]) {
      background: linear-gradient(90deg, var(--sccb-green), var(--sccb-yellow)) !important;
      color: #061012 !important;
      border-color: transparent !important;
      box-shadow: 0 10px 28px rgba(142,232,95,.22) !important;
    }
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-page-status {
      display: inline-flex !important;
      align-items: center !important;
      min-height: 30px !important;
      padding: 0 12px !important;
      border-radius: 999px !important;
      background: rgba(18,32,35,.90) !important;
      color: var(--sccb-muted) !important;
      font-size: 12px !important;
      font-weight: 850 !important;
    }

    /* TSR rendered download cards: replace the native white cards with a fully controlled shell. */
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-tsr-native-card-hidden {
      display: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(#browse-files, .browse-files, .browse-page .items, .browse-page .content, .browse-page .grid, .sccb-tsr-card-grid) {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)) !important;
      gap: 22px !important;
      align-items: stretch !important;
      width: min(100%, var(--sccb-site-max)) !important;
      margin-inline: auto !important;
      overflow: visible !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card {
      position: relative !important;
      min-width: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      background: linear-gradient(180deg, rgba(24,41,45,.98), rgba(10,20,22,.98)) !important;
      color: var(--sccb-text) !important;
      border: 1px solid rgba(85,207,255,.13) !important;
      border-radius: 22px !important;
      overflow: hidden !important;
      box-shadow: 0 22px 54px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.04) !important;
      transform: translateZ(0) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card:hover {
      border-color: rgba(40,215,197,.32) !important;
      box-shadow: 0 26px 70px rgba(0,0,0,.42), 0 0 0 1px rgba(40,215,197,.08) inset !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-media {
      position: relative !important;
      display: grid !important;
      place-items: center !important;
      width: 100% !important;
      aspect-ratio: 4 / 3 !important;
      padding: 10px !important;
      background: radial-gradient(circle at 50% 24%, rgba(85,207,255,.10), transparent 38%), #071214 !important;
      border-radius: 0 !important;
      overflow: hidden !important;
      text-decoration: none !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-media img {
      display: block !important;
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      object-position: center center !important;
      border-radius: 14px !important;
      background: rgba(255,255,255,.96) !important;
      box-shadow: 0 10px 30px rgba(0,0,0,.20) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-placeholder {
      color: var(--sccb-green) !important;
      font-size: 30px !important;
      font-weight: 950 !important;
      letter-spacing: .08em !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-body {
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      flex: 1 1 auto !important;
      padding: 13px !important;
      background: linear-gradient(180deg, rgba(24,41,45,.78), rgba(10,20,22,.96)) !important;
      color: var(--sccb-text) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-title {
      min-height: 2.45em !important;
      color: var(--sccb-text) !important;
      font-size: 15px !important;
      line-height: 1.22 !important;
      font-weight: 950 !important;
      letter-spacing: -.015em !important;
      text-decoration: none !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-title:hover {
      color: var(--sccb-cyan) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-creator {
      color: var(--sccb-muted) !important;
      font-size: 12px !important;
      line-height: 1.25 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-chips,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-meta {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      align-items: center !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-chips span,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-meta span {
      min-height: 24px !important;
      padding: 0 8px !important;
      border-radius: 999px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 11px !important;
      line-height: 1 !important;
      font-weight: 900 !important;
      white-space: nowrap !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-chips span {
      background: rgba(29,53,57,.90) !important;
      color: var(--sccb-cyan) !important;
      border: 1px solid rgba(85,207,255,.12) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-meta span {
      background: rgba(142,232,95,.12) !important;
      color: var(--sccb-green) !important;
      border: 1px solid rgba(142,232,95,.16) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-summary {
      margin: 0 !important;
      color: rgba(231,247,244,.72) !important;
      font-size: 12px !important;
      line-height: 1.38 !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card-actions {
      display: grid !important;
      gap: 7px !important;
      margin-top: auto !important;
      padding-top: 4px !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card-actions .sccb-card-button,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card-actions .sccb-add-basket-btn {
      width: 100% !important;
      min-height: 38px !important;
      border-radius: 999px !important;
      font-weight: 950 !important;
      background: linear-gradient(90deg, var(--sccb-teal), var(--sccb-green)) !important;
      color: #061012 !important;
      border: 0 !important;
      box-shadow: 0 12px 28px rgba(40,215,197,.20) !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card .sccb-site-card-ribbon,
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-card :is(.bsk, .basket-overlay, .favorite-toggle, .share-button, .basket-overlay-icon) {
      display: none !important;
    }
    @media (max-width: 760px) {
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar {
        top: 4px !important;
        width: calc(100vw - 10px) !important;
        margin: 4px auto 8px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner {
        grid-template-columns: 1fr auto !important;
        border-radius: 20px !important;
        padding: 8px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search {
        grid-column: 1 / -1 !important;
        order: 3 !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu {
        position: fixed !important;
        left: 8px !important;
        right: 8px !important;
        top: 68px !important;
        width: auto !important;
        max-height: min(70dvh, 520px) !important;
        overflow: auto !important;
      }
    }

    @media (max-width: 760px) {
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .mainmenu {
        top: 4px !important;
        width: calc(100vw - 10px) !important;
        max-width: calc(100vw - 10px) !important;
        margin-block: 4px 8px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-wrapper {
        border-radius: 18px !important;
        padding: 7px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .menu-content {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.topbar,
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] nav.main-nav,
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.nav.underline, .nav.spaced, .nav.hover-drop) {
        justify-content: flex-start !important;
        overflow-x: auto !important;
        flex-wrap: nowrap !important;
        scrollbar-width: none !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.nav.underline, .nav.spaced, .nav.hover-drop)::-webkit-scrollbar {
        display: none !important;
      }
    }

    @media (min-width: 1440px) {
      html[data-sccb-site][data-sccb-host-ui="1"] {
        --sccb-card-min: 235px !important;
      }
    }

    @media (max-width: 900px) {
      html[data-sccb-site][data-sccb-host-ui="1"] {
        --sccb-site-max: 100% !important;
        --sccb-card-min: min(100%, 210px) !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-site-toolbar, #sccb-site-toolbar,
        .sccb-mts-page-hero, .sccb-simblr-hero, .sccb-tsr-hero,
        .sccb-mts-section, .sccb-site-section, .sccb-related-section
      ) {
        width: calc(100vw - 16px) !important;
        max-width: calc(100vw - 16px) !important;
        margin-inline: auto !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-mts-detail-layout, .sccb-tsr-detail-layout, .sccb-simblr-detail-layout, .column-wrapper, .row-fluid, .row) {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-site-toolbar-actions, .sccb-panel-actions, .sccb-modal-actions) {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        width: 100% !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-card-button, .sccb-add, .sccb-btn, .sccb-site-toolbar-btn) {
        min-height: 44px !important;
      }
    }

    @media (max-width: 640px) {
      html[data-sccb-site][data-sccb-host-ui="1"] {
        --sccb-type-body: 14px !important;
        --sccb-type-card-title: 16px !important;
        --sccb-card-min: 100% !important;
        --sccb-card-gap: 12px !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-card-grid, .sccb-simblr-card-grid, .sccb-tsr-card-grid,
        .sccb-related-grid, #browse-files, .recommendation-items,
        .download-grid, .item-grid
      ) {
        grid-template-columns: 1fr !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(h1, .sccb-site-title, .sccb-mts-page-title, .sccb-simblr-hero-title, .sccb-tsr-hero-title) {
        max-width: 100% !important;
        font-size: clamp(24px, 8vw, 34px) !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-card-title, .sccb-mod-title, .browse-info-title-info) {
        min-height: 0 !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-chip, .sccb-card-chip, .sccb-stat-chip, .tag, .badge, .label) {
        min-height: 28px !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-site-toolbar-actions, .sccb-panel-actions, .sccb-modal-actions) {
        grid-template-columns: 1fr !important;
      }
    }

    @media (hover: none), (pointer: coarse) {
      html[data-sccb-site][data-sccb-host-ui="1"] :is(a, button, input, select, textarea, .sccb-chip, .sccb-card-chip) {
        -webkit-tap-highlight-color: rgba(40,215,197,.16) !important;
      }
      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-site-card:hover, [data-sccb-card="1"]:hover) {
        transform: none !important;
      }
    }

    /* Mobile audit fixes: one central place for viewport, touch, overflow, and
       bottom-sheet behaviour across MTS, Simblr.cc, and TSR. */
    @media (max-width: 760px), (pointer: coarse) {
      html[data-sccb-site][data-sccb-host-ui="1"],
      html[data-sccb-site][data-sccb-host-ui="1"] body {
        max-width: 100vw !important;
        overflow-x: hidden !important;
        touch-action: manipulation !important;
        scroll-padding-top: calc(72px + env(safe-area-inset-top)) !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] .sccb-mobile-unclamp {
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        left: auto !important;
        right: auto !important;
        transform: none !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] .sccb-mobile-media {
        max-width: 100% !important;
        height: auto !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] .sccb-mobile-scrollbox {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-page-main, .sccb-mts-detail-page,
        .sccb-simblr-app, #sccb-simblr-app, .sccb-simblr-app-index, .sccb-simblr-app-detail,
        .sccb-tsr-hero, .sccb-tsr-detail-layout, .sccb-tsr-related-section,
        main, .main, .container, .container-fluid
      ):not(.sccb-panel):not(.sccb-file-modal) {
        width: calc(100vw - 12px) !important;
        max-width: calc(100vw - 12px) !important;
        margin-inline: auto !important;
        padding-inline: 0 !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-page-hero, .sccb-mts-detail-hero, .sccb-mts-section,
        .sccb-simblr-hero, .sccb-simblr-app-hero, .sccb-simblr-app-section, .sccb-simblr-detail-hero,
        .sccb-tsr-hero, .sccb-tsr-detail-card, .sccb-tsr-detail-panel, .sccb-tsr-related-section,
        .sccb-site-section
      ) {
        border-radius: 18px !important;
        padding: 12px !important;
        margin-block: 10px !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-detail-layout, .sccb-simblr-detail-layout, .sccb-simblr-detail-redone-layout,
        .sccb-tsr-detail-layout, .sccb-tsr-related-layout
      ) {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 12px !important;
        width: calc(100vw - 12px) !important;
        max-width: calc(100vw - 12px) !important;
        margin-inline: auto !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-detail-sidebar, .sccb-simblr-detail-redone-side, .sccb-tsr-detail-side
      ) {
        position: static !important;
        width: 100% !important;
        max-width: 100% !important;
        order: 2 !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-detail-main, .sccb-simblr-detail-redone-description, .sccb-tsr-detail-main
      ) {
        width: 100% !important;
        max-width: 100% !important;
        order: 1 !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-custom-gallery-main, .sccb-mts-gallery-carousel,
        .sccb-simblr-gallery-main, .sccb-simblr-redone-gallery-main,
        .sccb-tsr-gallery-main
      ) {
        width: 100% !important;
        max-width: 100% !important;
        min-height: 0 !important;
        max-height: min(62vh, calc(var(--sccb-vh, 1vh) * 62)) !important;
        aspect-ratio: 4 / 3 !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-custom-gallery-main img, .sccb-mts-gallery-carousel img,
        .sccb-simblr-gallery-main img, .sccb-simblr-redone-gallery-main img,
        .sccb-tsr-gallery-main img
      ) {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-card-grid, .sccb-simblr-card-grid, .sccb-tsr-card-grid,
        .sccb-related-grid, .sccb-tsr-related-grid, #browse-files,
        .recommendation-items, .download-grid, .item-grid
      ) {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 170px), 1fr)) !important;
        gap: 12px !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-rendered-mts-card, .sccb-rendered-simblr-card, .sccb-rendered-tsr-card,
        .sccb-site-card, [data-sccb-card="1"]
      ) {
        border-radius: 18px !important;
        min-width: 0 !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-rendered-mts-card, .sccb-rendered-simblr-card, .sccb-rendered-tsr-card
      ) :is(.sccb-card-button, .sccb-add-basket-btn) {
        min-height: 44px !important;
        font-size: 13.5px !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-page-breadcrumbs, .sccb-mts-detail-breadcrumb-rail,
        .sccb-tsr-crumbs, .sccb-simblr-info-chips, .sccb-simblr-filter-chips,
        .sccb-simblr-card-chips, .sccb-rendered-tsr-chips, .sccb-rendered-tsr-meta
      ) {
        display: flex !important;
        overflow-x: auto !important;
        flex-wrap: nowrap !important;
        gap: 7px !important;
        padding-bottom: 4px !important;
        scrollbar-width: none !important;
        -webkit-overflow-scrolling: touch !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-page-breadcrumbs, .sccb-mts-detail-breadcrumb-rail,
        .sccb-tsr-crumbs, .sccb-simblr-info-chips, .sccb-simblr-filter-chips,
        .sccb-simblr-card-chips, .sccb-rendered-tsr-chips, .sccb-rendered-tsr-meta
      )::-webkit-scrollbar { display: none !important; }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-chip, .sccb-card-chip, .sccb-stat-chip, .sccb-btn, button, a.button, .btn) {
        min-height: 40px !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] input,
      html[data-sccb-site][data-sccb-host-ui="1"] select,
      html[data-sccb-site][data-sccb-host-ui="1"] textarea {
        min-height: 44px !important;
        font-size: 16px !important;
      }

      html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-groups {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }
      html[data-sccb-site="simblr"][data-sccb-host-ui="1"] .sccb-simblr-filter-group {
        padding: 10px !important;
        border-radius: 16px !important;
      }

      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar {
        position: sticky !important;
        top: max(4px, env(safe-area-inset-top)) !important;
        width: calc(100vw - 10px) !important;
        max-width: calc(100vw - 10px) !important;
        margin: 4px auto 8px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner {
        grid-template-columns: auto 1fr auto !important;
        gap: 7px !important;
        padding: 7px !important;
        border-radius: 20px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-button,
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-login-owned {
        min-height: 40px !important;
        padding-inline: 12px !important;
        font-size: 12.5px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search {
        min-width: 0 !important;
        min-height: 40px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] .sccb-rendered-tsr-media {
        aspect-ratio: 4 / 3 !important;
        padding: 8px !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(.sccb-tsr-page-status, .sccb-tsr-page-pill, .sccb-tsr-page-current, .sccb-tsr-page-next) {
        min-height: 38px !important;
      }
    }

    @media (max-width: 520px) {
      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-card-grid, .sccb-simblr-card-grid, .sccb-tsr-card-grid,
        .sccb-related-grid, .sccb-tsr-related-grid, #browse-files,
        .recommendation-items, .download-grid, .item-grid
      ) {
        grid-template-columns: 1fr !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-page-title, .sccb-mts-page-title, .sccb-simblr-hero-title, .sccb-tsr-hero-title, h1) {
        font-size: clamp(23px, 8vw, 32px) !important;
      }

      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-inner {
        grid-template-columns: 1fr auto !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-clean-search {
        grid-column: 1 / -1 !important;
        order: 3 !important;
      }
      html[data-sccb-site="tsr"][data-sccb-host-ui="1"] #sccb-tsr-clean-topbar .sccb-tsr-cat-menu {
        position: fixed !important;
        left: 8px !important;
        right: 8px !important;
        top: calc(58px + env(safe-area-inset-top)) !important;
        width: auto !important;
        max-height: min(70dvh, 520px) !important;
        overflow: auto !important;
      }

      #sccb-mini-strip {
        left: 6px !important;
        right: 6px !important;
        border-radius: 16px !important;
      }
      .sccb-mini-open,
      .sccb-mini-download {
        min-height: 44px !important;
        padding-inline: 10px !important;
        font-size: 12.5px !important;
      }
    }


    /* ------------------------------------------------------------------
       Typography + flat borderless pass v1.1.0
       ------------------------------------------------------------------ */
    html[data-sccb-site][data-sccb-host-ui="1"] {
      --sccb-type-body: clamp(14px, .18vw + 13.2px, 15.75px) !important;
      --sccb-type-small: clamp(12px, .10vw + 11.7px, 12.9px) !important;
      --sccb-type-chip: clamp(11.5px, .10vw + 11.2px, 12.4px) !important;
      --sccb-type-card-title: clamp(15px, .30vw + 14px, 17.25px) !important;
      --sccb-type-section-title: clamp(19px, .72vw + 16px, 25px) !important;
      --sccb-type-page-title: clamp(26px, 1.22vw + 20px, 42px) !important;
      --sccb-line-tight: 1.2 !important;
      --sccb-line-title: 1.18 !important;
      --sccb-line-body: 1.58 !important;
      --sccb-border-soft: transparent !important;
      --sccb-border-glow: transparent !important;
      --sccb-focus-ring: 0 0 0 3px rgba(85,207,255,.26) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      body, button, input, select, textarea,
      h1, h2, h3, h4, h5, h6, p, li, td, th, label, small, span, div, a
    ) {
      font-family: var(--sccb-font-ui) !important;
      font-synthesis-weight: none !important;
      text-rendering: geometricPrecision !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      h1, h2, h3, h4, h5, h6,
      .sccb-site-title, .sccb-mts-page-title, .sccb-simblr-hero-title,
      .sccb-tsr-hero-title, .sccb-card-title, .sccb-mod-title,
      .browse-info-title-info, .downloadtitle, .title
    ) {
      letter-spacing: -0.022em !important;
      font-weight: 900 !important;
      text-align: left !important;
      text-wrap: balance !important;
      max-width: min(100%, 38ch) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      p, li, td, th, .sccb-body, .description, .downloadDescription,
      .item-description, .sccb-detail-text, .sccb-tsr-description-panel
    ) {
      letter-spacing: .002em !important;
      text-align: left !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-chip, .sccb-card-chip, .sccb-source-pill, .sccb-stat-chip,
      .sccb-mts-subsection-chip, .sccb-tsr-date-chip, .browse-info-category,
      .tag, .badge, .label
    ) {
      border: 0 !important;
      box-shadow: none !important;
      background: rgba(29,55,59,.92) !important;
      color: var(--sccb-cyan) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-btn, .sccb-add, .sccb-card-button, .sccb-site-toolbar-btn,
      button, input[type="button"], input[type="submit"], a.button, .button, .btn
    ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle) {
      border: 0 !important;
      box-shadow: none !important;
      background: linear-gradient(90deg, var(--sccb-teal), var(--sccb-green)) !important;
      text-align: center !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-toolbar, #sccb-site-toolbar, .sccb-mts-page-hero,
      .sccb-simblr-hero, .sccb-tsr-hero, .sccb-mts-section,
      .sccb-site-section, .sccb-related-section, .sccb-panel,
      .sccb-file-modal, .sccb-settings-panel, .sccb-rendered-mts-card,
      .sccb-rendered-simblr-card, .sccb-tsr-card, .sccb-site-card,
      [data-sccb-card="1"], .sccb-tsr-detail-shell, .sccb-tsr-detail-left,
      .sccb-tsr-detail-right, .sccb-tsr-gallery-card, .sccb-tsr-description-panel,
      .sccb-tsr-detail-card, .sccb-mts-detail-shell, .sccb-simblr-detail-shell,
      #sccb-basket-panel, #sccb-mini-strip, #sccb-toast, #sccb-modal-backdrop .sccb-file-modal
    ) {
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
      background-image: none !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-rendered-mts-card, .sccb-rendered-simblr-card,
      .sccb-tsr-card, .sccb-site-card, [data-sccb-card="1"]
    ) {
      background: var(--sccb-surface-2) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-toolbar, #sccb-site-toolbar, .sccb-mts-page-hero,
      .sccb-simblr-hero, .sccb-tsr-hero, .sccb-mts-section,
      .sccb-site-section, .sccb-related-section, .sccb-panel,
      .sccb-tsr-detail-shell, .sccb-tsr-detail-left, .sccb-tsr-detail-right,
      .sccb-tsr-gallery-card, .sccb-tsr-description-panel, .sccb-tsr-detail-card
    ) {
      background: rgba(17,28,31,.96) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      input, textarea, select, .searchbar, .search-bar, .search-wrapper,
      .search-container, .sccb-input, .sccb-search
    ) {
      border: 0 !important;
      box-shadow: none !important;
      background: rgba(6,16,18,.88) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      table, tr, td, th, fieldset, hr, .separator, .divider,
      .message, .message-body, .downloadDetails, .column-wrapper,
      .tabs-bg-white, .panel, .card, .box, .well, .container, .container-fluid
    ) {
      border: 0 !important;
      box-shadow: none !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(button, a, input, select, textarea):focus-visible {
      outline: 2px solid rgba(85,207,255,.70) !important;
      outline-offset: 3px !important;
      box-shadow: none !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(button, a, .sccb-btn, .sccb-add, .sccb-card-button):hover {
      filter: brightness(1.05) !important;
    }

    @media (max-width: 720px) {
      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        h1, h2, h3, .sccb-site-title, .sccb-mts-page-title,
        .sccb-simblr-hero-title, .sccb-tsr-hero-title
      ) {
        letter-spacing: -0.018em !important;
        max-width: 100% !important;
      }
    }

    /* ------------------------------------------------------------------
       Readability / containment audit pass
       Keep text inside cards, chips, nav, buttons, panels, and tables.
       ------------------------------------------------------------------ */

    html[data-sccb-site][data-sccb-host-ui="1"] {
      --sccb-bg: #0b1214 !important;
      --sccb-page: #0b1214 !important;
      --sccb-panel: #111c1f !important;
      --sccb-surface: #111c1f !important;
      --sccb-surface-2: #152426 !important;
      --sccb-surface-3: #1b3033 !important;
      --sccb-text: #e8f2ef !important;
      --sccb-muted: #91aaa6 !important;
      --sccb-dim: #6f8984 !important;
      --sccb-teal: #35bda8 !important;
      --sccb-green: #8bdc6e !important;
      --sccb-cyan: #57bfe4 !important;
      --sccb-yellow: #c8d86c !important;
      --sccb-accent-soft: rgba(53,189,168,.15) !important;
      --sccb-accent-soft-2: rgba(139,220,110,.11) !important;
      --sccb-accent-ink: #bdf5ea !important;
      --sccb-action-bg: #20383b !important;
      --sccb-action-bg-hover: #29464a !important;
      --sccb-action-bg-active: #31534f !important;
      --sccb-card-min: 225px !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-toolbar, #sccb-site-toolbar, .sccb-mts-page-hero,
      .sccb-simblr-hero, .sccb-tsr-hero, .sccb-mts-section,
      .sccb-site-section, .sccb-related-section, .sccb-panel,
      .sccb-file-modal, .sccb-settings-panel, .sccb-rendered-mts-card,
      .sccb-rendered-simblr-card, .sccb-tsr-card, .sccb-site-card,
      [data-sccb-card="1"], .sccb-tsr-detail-shell, .sccb-tsr-detail-left,
      .sccb-tsr-detail-right, .sccb-tsr-gallery-card, .sccb-tsr-description-panel,
      .sccb-tsr-detail-card, .sccb-mts-detail-shell, .sccb-simblr-detail-shell,
      #sccb-basket-panel, #sccb-mini-strip, #sccb-toast, .sccb-file-modal,
      .sccb-card-body, .sccb-card-meta, .sccb-card-chips, .sccb-card-stats,
      .sccb-tsr-card-body, .sccb-simblr-card-body, .sccb-mts-card-body
    ) {
      min-width: 0 !important;
      max-width: 100% !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      hyphens: auto !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-card-title, .sccb-mod-title, .browse-info-title-info,
      .sccb-tsr-card-title, .sccb-simblr-card-title, .sccb-mts-card-title,
      .sccb-related-title, .sccb-item-title, .sccb-file-title
    ) {
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      hyphens: auto !important;
      text-overflow: clip !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-meta, .sccb-muted, .sccb-card-author, .sccb-card-date,
      .sccb-tsr-card-description, .sccb-simblr-card-summary,
      .sccb-card-summary, .sccb-body, .description, .downloadDescription,
      .item-description, .sccb-detail-text, .sccb-tsr-description-panel,
      .sccb-tsr-description-panel *, .sccb-simblr-description *, .sccb-mts-description *
    ) {
      max-width: 100% !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      hyphens: auto !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(pre, code, kbd, samp, .bbcode_code, .code, textarea) {
      max-width: 100% !important;
      overflow-x: auto !important;
      white-space: pre-wrap !important;
      overflow-wrap: anywhere !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(table, thead, tbody, tr, td, th) {
      max-width: 100% !important;
      min-width: 0 !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-chip, .sccb-card-chip, .sccb-source-pill, .sccb-stat-chip,
      .sccb-mts-subsection-chip, .sccb-tsr-date-chip, .browse-info-category,
      .tag, .badge, .label
    ) {
      max-width: 100% !important;
      min-width: 0 !important;
      white-space: normal !important;
      text-wrap: pretty !important;
      overflow-wrap: anywhere !important;
      background: #1c3336 !important;
      color: var(--sccb-cyan) !important;
      box-shadow: none !important;
      border: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-btn, .sccb-add, .sccb-card-button, .sccb-site-toolbar-btn,
      button, input[type="button"], input[type="submit"], a.button, .button, .btn
    ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle) {
      max-width: 100% !important;
      min-width: 0 !important;
      white-space: normal !important;
      text-wrap: balance !important;
      overflow-wrap: anywhere !important;
      line-height: 1.15 !important;
      min-height: 36px !important;
      padding-block: 8px !important;
      color: var(--sccb-accent-ink) !important;
      background: linear-gradient(90deg, var(--sccb-accent-soft), var(--sccb-accent-soft-2)), var(--sccb-action-bg) !important;
      box-shadow: none !important;
      border: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-btn, .sccb-add, .sccb-card-button, .sccb-site-toolbar-btn,
      button, input[type="button"], input[type="submit"], a.button, .button, .btn
    ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle):hover {
      color: var(--sccb-text) !important;
      background: linear-gradient(90deg, rgba(53,189,168,.23), rgba(139,220,110,.16)), var(--sccb-action-bg-hover) !important;
      filter: none !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-btn.primary, .sccb-add, .sccb-card-button, .sccb-mini-download,
      #sccb-fab, .sccb-basket-primary, .sccb-file-modal .primary
    ) {
      color: #071112 !important;
      background: linear-gradient(90deg, rgba(53,189,168,.92), rgba(139,220,110,.86)) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-btn.secondary, .sccb-btn.ghost, .sccb-site-toolbar-btn,
      .sccb-modal-close, .sccb-mini-remove
    ) {
      color: var(--sccb-cyan) !important;
      background: #1d3337 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-toolbar, #sccb-site-toolbar, .sccb-mts-page-hero,
      .sccb-simblr-hero, .sccb-tsr-hero, .sccb-mts-section,
      .sccb-site-section, .sccb-related-section, .sccb-panel,
      .sccb-file-modal, .sccb-settings-panel, .sccb-rendered-mts-card,
      .sccb-rendered-simblr-card, .sccb-tsr-card, .sccb-site-card,
      [data-sccb-card="1"], .sccb-tsr-detail-shell, .sccb-tsr-detail-left,
      .sccb-tsr-detail-right, .sccb-tsr-gallery-card, .sccb-tsr-description-panel,
      .sccb-tsr-detail-card, .sccb-mts-detail-shell, .sccb-simblr-detail-shell,
      #sccb-basket-panel, #sccb-mini-strip, #sccb-toast, .sccb-file-modal
    ) {
      background-image: none !important;
      box-shadow: none !important;
      border: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-rendered-mts-card, .sccb-rendered-simblr-card,
      .sccb-tsr-card, .sccb-site-card, [data-sccb-card="1"]
    ) {
      background: #142325 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-toolbar, #sccb-site-toolbar,
      .sccb-mts-page-hero, .sccb-simblr-hero, .sccb-tsr-hero,
      .sccb-mts-section, .sccb-site-section, .sccb-related-section,
      .sccb-panel, .sccb-tsr-detail-shell, .sccb-tsr-detail-left,
      .sccb-tsr-detail-right, .sccb-tsr-gallery-card, .sccb-tsr-description-panel,
      .sccb-tsr-detail-card
    ) {
      background: #111c1f !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-page-tagline, .sccb-hero-kicker, .sccb-section-kicker,
      .sccb-card-chips, .sccb-card-stats, .sccb-filter-groups,
      .sccb-breadcrumbs, .sccb-rail, .sccb-chip-row
    ) {
      min-width: 0 !important;
      max-width: 100% !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      scrollbar-width: thin !important;
      -webkit-overflow-scrolling: touch !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-card-chips, .sccb-card-stats, .sccb-filter-groups,
      .sccb-breadcrumbs, .sccb-chip-row
    ) > * {
      min-width: 0 !important;
      max-width: 100% !important;
    }

    @media (max-width: 720px) {
      html[data-sccb-site][data-sccb-host-ui="1"] {
        --sccb-card-min: min(100%, 172px) !important;
        --sccb-type-card-title: clamp(13.25px, 2.5vw, 15px) !important;
        --sccb-type-body: clamp(12.75px, 2.7vw, 14px) !important;
        --sccb-type-small: clamp(10.75px, 2.4vw, 12px) !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-card-title, .sccb-mod-title, .browse-info-title-info,
        .sccb-tsr-card-title, .sccb-simblr-card-title, .sccb-mts-card-title
      ) {
        -webkit-line-clamp: 3 !important;
        min-height: 0 !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-btn, .sccb-add, .sccb-card-button, .sccb-site-toolbar-btn,
        button, input[type="button"], input[type="submit"], a.button, .button, .btn
      ):not(.flickity-button):not(.carousel-control):not(.dropdown-toggle) {
        min-height: 42px !important;
        padding-inline: 12px !important;
      }
    }


    /* ------------------------------------------------------------------
       Typography/rhythm + vertical-space audit v1.1.2
       This is the final central layer. Site modules may extract/rebuild DOM,
       but spacing, type rhythm, flat surfaces, text containment, and empty
       space collapse should be controlled here.
       ------------------------------------------------------------------ */

    html[data-sccb-site][data-sccb-host-ui="1"] {
      --sccb-page-pad: clamp(10px, 1.6vw, 24px) !important;
      --sccb-block-gap: clamp(10px, 1.1vw, 18px) !important;
      --sccb-section-gap: clamp(14px, 1.5vw, 24px) !important;
      --sccb-panel-pad: clamp(12px, 1.3vw, 20px) !important;
      --sccb-card-pad: clamp(10px, 1vw, 14px) !important;
      --sccb-title-measure: 24ch !important;
      --sccb-body-measure: 78ch !important;
      --sccb-compact-shadow: none !important;
      --sccb-hairline: transparent !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      h1, h2, h3, h4, h5, h6,
      .sccb-site-title, .sccb-mts-page-title, .sccb-simblr-hero-title,
      .sccb-tsr-hero-title, .sccb-section-title, .sccb-site-section-title,
      .sccb-mts-section-title, .sccb-related-heading
    ) {
      max-width: min(100%, var(--sccb-title-measure)) !important;
      text-wrap: balance !important;
      overflow-wrap: break-word !important;
      word-break: normal !important;
      hyphens: auto !important;
      margin-top: 0 !important;
      margin-bottom: .38em !important;
      font-weight: 860 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      p, li, dd, dt, blockquote, .sccb-body, .sccb-copy,
      .sccb-description, .sccb-detail-text, .description,
      .downloadDescription, .item-description
    ) {
      max-width: min(100%, var(--sccb-body-measure)) !important;
      margin-top: 0 !important;
      margin-bottom: .75em !important;
      line-height: 1.58 !important;
      text-wrap: pretty !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      p:last-child, li:last-child, blockquote:last-child,
      .sccb-body > :last-child, .sccb-copy > :last-child,
      .sccb-description > :last-child, .sccb-detail-text > :last-child
    ) { margin-bottom: 0 !important; }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-toolbar, #sccb-site-toolbar,
      .sccb-mts-page-hero, .sccb-mts-detail-hero, .sccb-simblr-hero,
      .sccb-simblr-app-hero, .sccb-simblr-detail-redone-hero,
      .sccb-tsr-hero, .sccb-mts-section, .sccb-site-section,
      .sccb-simblr-app-section, .sccb-related-section,
      .sccb-tsr-related-section, .sccb-tsr-detail-shell,
      .sccb-mts-detail-shell, .sccb-simblr-detail-shell,
      .sccb-panel, .sccb-settings-panel, .sccb-file-modal
    ) {
      padding: var(--sccb-panel-pad) !important;
      margin-block: var(--sccb-section-gap) !important;
      border: 0 !important;
      box-shadow: none !important;
      background-image: none !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-mts-section + .sccb-mts-section,
      .sccb-site-section + .sccb-site-section,
      .sccb-simblr-app-section + .sccb-simblr-app-section,
      .sccb-related-section + .sccb-related-section,
      .sccb-tsr-related-section + .sccb-tsr-related-section
    ) { margin-top: var(--sccb-block-gap) !important; }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-section-head, .sccb-mts-section-head,
      .sccb-simblr-app-section-head, .sccb-related-head,
      .sccb-tsr-related-head, .sccb-card-body,
      .sccb-rendered-tsr-body, .sccb-simblr-card-body,
      .sccb-mts-card-body, .sccb-card-content
    ) {
      gap: clamp(6px, .75vw, 10px) !important;
      padding: var(--sccb-card-pad) !important;
      min-width: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-mts-card-grid, .sccb-simblr-card-grid, .sccb-tsr-card-grid,
      .sccb-related-grid, .sccb-tsr-related-grid, #browse-files,
      .recommendation-items, .download-grid, .item-grid
    ) {
      gap: var(--sccb-card-gap) !important;
      align-content: start !important;
    }

    /* Flat and borderless means no native 1px seams, heavy shadows, or bright neon panels. */
    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-rendered-mts-card, .sccb-rendered-simblr-card,
      .sccb-rendered-tsr-card, .sccb-tsr-card, .sccb-site-card,
      [data-sccb-card="1"], .sccb-panel, .sccb-file-modal,
      .sccb-settings-panel, .sccb-tsr-detail-card,
      .sccb-tsr-detail-left, .sccb-tsr-detail-right,
      .sccb-tsr-gallery-card, .sccb-tsr-description-panel,
      .sccb-simblr-info-panel, .sccb-mts-detail-card,
      .message, .message-body, .well, .card, .box, .panel,
      .container, .container-fluid
    ) {
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
      background-image: none !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-rendered-mts-card, .sccb-rendered-simblr-card,
      .sccb-rendered-tsr-card, .sccb-tsr-card, .sccb-site-card,
      [data-sccb-card="1"]
    ) {
      background: var(--sccb-surface-2) !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-card-chips, .sccb-card-stats, .sccb-rendered-tsr-chips,
      .sccb-rendered-tsr-meta, .sccb-simblr-filter-groups,
      .sccb-filter-groups, .sccb-breadcrumbs, .sccb-chip-row,
      .sccb-section-actions, .sccb-site-toolbar-actions
    ) {
      display: flex !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      min-width: 0 !important;
      max-width: 100% !important;
      overflow: visible !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-chip, .sccb-card-chip, .sccb-stat-chip, .sccb-source-pill,
      .sccb-tsr-date-chip, .sccb-mts-subsection-chip, .tag, .badge,
      .label, .browse-info-category
    ) {
      flex: 0 1 auto !important;
      max-width: 100% !important;
      min-width: 0 !important;
      white-space: normal !important;
      text-align: center !important;
      overflow-wrap: anywhere !important;
      background: color-mix(in srgb, var(--sccb-surface-3), var(--sccb-cyan) 8%) !important;
      color: color-mix(in srgb, var(--sccb-cyan), var(--sccb-text) 18%) !important;
      box-shadow: none !important;
      border: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-card-title, .sccb-mod-title, .browse-info-title-info,
      .sccb-tsr-card-title, .sccb-simblr-card-title, .sccb-mts-card-title,
      .sccb-rendered-tsr-title, .sccb-related-title
    ) {
      min-height: 0 !important;
      max-height: calc(var(--sccb-type-card-title) * 2.8) !important;
      display: -webkit-box !important;
      -webkit-line-clamp: 2 !important;
      -webkit-box-orient: vertical !important;
      overflow: hidden !important;
    }

    /* Large unused vertical space audit. Collapse empty rewritten shells, ad slots,
       orphan spacer rows, and native placeholders after extraction. */
    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-empty, .sccb-native-hidden, .sccb-force-hidden,
      .sccb-tsr-force-hidden, .sccb-tsr-native-card-hidden,
      .sccb-mts-native-card-hidden, .sccb-simblr-native-hidden,
      .ad, .ads, .ad-slot, .ad-container, .ad-wrapper, .advert,
      .advertisement, .adsbygoogle, [class*="advert"], [id*="advert"],
      [class*="ad-browse"], [id*="google_ads"], [data-google-query-id],
      iframe[src*="googlesyndication"], iframe[src*="doubleclick"]
    ) {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      position: absolute !important;
      inset: auto !important;
      width: 0 !important;
      height: 0 !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-section, .sccb-mts-section, .sccb-simblr-app-section,
      .sccb-related-section, .sccb-tsr-related-section,
      .sccb-panel, .message, .message-body, .well, .box, .card, .panel
    ):empty {
      display: none !important;
      margin: 0 !important;
      padding: 0 !important;
      min-height: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-site-section, .sccb-mts-section, .sccb-simblr-app-section,
      .sccb-related-section, .sccb-tsr-related-section
    ):has(:is(.sccb-card-grid, .sccb-mts-card-grid, .sccb-simblr-card-grid, .sccb-tsr-card-grid, .sccb-related-grid):empty) {
      display: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .spacer, .clear, .clearfix, .clearer, .ad-spacer,
      .leaderboard, .rectangle-ad, .banner-ad, .top-banner,
      .bottom-banner, .sccb-legacy-spacer
    ) {
      min-height: 0 !important;
      margin-block: 0 !important;
      padding-block: 0 !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] br + br + br,
    html[data-sccb-site][data-sccb-host-ui="1"] p:empty,
    html[data-sccb-site][data-sccb-host-ui="1"] div:empty:not(.sccb-sheet-handle):not(.sccb-plumbob):not(.sccb-gallery-thumb):not(.sccb-rendered-tsr-placeholder) {
      display: none !important;
    }

    /* Site-specific vertical gap normalisers that still live centrally. */
    html[data-sccb-site="mts"][data-sccb-host-ui="1"] :is(
      .maincontentwrapper, .maincontentinner, .column-wrapper, .row, .row-fluid,
      .container, .container-fluid, .message, .message-body
    ),
    html[data-sccb-site="simblr"][data-sccb-host-ui="1"] :is(
      #sccb-simblr-app, .sccb-simblr-app-index, .sccb-simblr-app-detail,
      .container, .container-fluid, .row, .section
    ),
    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      #content, #main, main, .browse-page, .detail-page, .content-wrapper,
      .main-content-wrapper, .container, .container-fluid, .row
    ) {
      min-height: 0 !important;
      margin-top: 0 !important;
      margin-bottom: var(--sccb-block-gap) !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
    }

    html[data-sccb-site="tsr"][data-sccb-host-ui="1"] :is(
      .details-wrapper, .browse-container, .browse-content, .content-area,
      .item-list, .items, #browse-files, .sccb-tsr-detail-layout
    ) {
      align-content: start !important;
      row-gap: var(--sccb-card-gap) !important;
      margin-top: var(--sccb-block-gap) !important;
      margin-bottom: var(--sccb-block-gap) !important;
    }

    html[data-sccb-site="simblr"][data-sccb-host-ui="1"] :is(
      .sccb-simblr-filter-groups, .sccb-filter-groups
    ) {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr)) !important;
      align-items: start !important;
      gap: 10px !important;
      overflow: visible !important;
    }

    html[data-sccb-site="simblr"][data-sccb-host-ui="1"] :is(
      .sccb-simblr-filter-group, .sccb-filter-group
    ) {
      min-width: 0 !important;
      background: var(--sccb-surface-2) !important;
      border: 0 !important;
      box-shadow: none !important;
      padding: 10px !important;
    }

    @media (max-width: 760px) {
      html[data-sccb-site][data-sccb-host-ui="1"] {
        --sccb-page-pad: 8px !important;
        --sccb-panel-pad: 10px !important;
        --sccb-section-gap: 10px !important;
        --sccb-block-gap: 8px !important;
        --sccb-card-gap: 10px !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-site-toolbar, #sccb-site-toolbar,
        .sccb-mts-page-hero, .sccb-mts-detail-hero, .sccb-simblr-hero,
        .sccb-simblr-app-hero, .sccb-simblr-detail-redone-hero,
        .sccb-tsr-hero, .sccb-mts-section, .sccb-site-section,
        .sccb-simblr-app-section, .sccb-related-section,
        .sccb-tsr-related-section, .sccb-tsr-detail-shell,
        .sccb-mts-detail-shell, .sccb-simblr-detail-shell,
        .sccb-panel, .sccb-settings-panel
      ) {
        margin-block: 8px !important;
        padding: 10px !important;
      }

      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-card-title, .sccb-mod-title, .browse-info-title-info,
        .sccb-tsr-card-title, .sccb-simblr-card-title, .sccb-mts-card-title,
        .sccb-rendered-tsr-title, .sccb-related-title
      ) {
        -webkit-line-clamp: 3 !important;
        max-height: none !important;
      }
    }


    /* Adjustable mod grid: this late layer wins over site-specific hard-coded grids.
       The values are controlled by the toolbar Grid button and Basket settings. */
    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-mts-card-grid, .sccb-mts-grid, .sccb-simblr-card-grid,
      .sccb-tsr-card-grid, .sccb-related-grid, .sccb-tsr-related-grid,
      #browse-files, .recommendation-items, .download-grid, .item-grid
    ) {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--sccb-card-min)), 1fr)) !important;
      gap: var(--sccb-card-gap) !important;
      align-items: stretch !important;
      grid-auto-flow: row dense !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-card-thumb, .sccb-mod-thumb, .sccb-tsr-card-image, .sccb-simblr-card-image,
      .sccb-mts-card-thumb, .browse-image, .item-image
    ) {
      aspect-ratio: var(--sccb-card-image-ratio, 4 / 3) !important;
    }

    html[data-sccb-site][data-sccb-grid="compact"][data-sccb-host-ui="1"] :is(
      .sccb-rendered-mts-card, .sccb-rendered-simblr-card, .sccb-rendered-tsr-card,
      .sccb-tsr-card, .sccb-site-card, [data-sccb-card="1"]
    ) {
      --sccb-type-card-title: clamp(13px, .22vw + 12px, 15px) !important;
    }

    html[data-sccb-site][data-sccb-grid="gallery"][data-sccb-host-ui="1"] :is(
      .sccb-card-title, .sccb-mod-title, .browse-info-title-info,
      .sccb-tsr-card-title, .sccb-simblr-card-title, .sccb-mts-card-title
    ) {
      -webkit-line-clamp: 3 !important;
      min-height: calc(var(--sccb-type-card-title) * 3.45) !important;
    }



    /* Performance containment: keep long rebuilt grids/cards cheap to layout and paint. */
    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-rendered-mts-card, .sccb-rendered-simblr-card, .sccb-rendered-tsr-card,
      .sccb-tsr-card, .sccb-site-card, [data-sccb-card="1"],
      .sccb-panel, .sccb-file-modal, .sccb-settings-panel
    ) {
      contain: layout paint !important;
      content-visibility: auto !important;
      contain-intrinsic-size: 360px 520px !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(
      .sccb-mts-card-grid, .sccb-mts-grid, .sccb-simblr-card-grid,
      .sccb-tsr-card-grid, .sccb-related-grid, .sccb-tsr-related-grid,
      #browse-files, .recommendation-items, .download-grid, .item-grid
    ) {
      contain: layout paint !important;
      content-visibility: auto !important;
      contain-intrinsic-size: 900px !important;
    }

    html[data-sccb-site][data-sccb-host-ui="1"] :is(.sccb-card-media, .sccb-card-body, .sccb-card-title, .sccb-card-meta, .sccb-card-chips, .sccb-card-stats, .sccb-card-summary) {
      min-width: 0 !important;
      max-width: 100% !important;
      overflow-wrap: anywhere !important;
    }

    @media (max-width: 760px) {
      html[data-sccb-site][data-sccb-host-ui="1"] :is(
        .sccb-mts-card-grid, .sccb-mts-grid, .sccb-simblr-card-grid,
        .sccb-tsr-card-grid, .sccb-related-grid, .sccb-tsr-related-grid,
        #browse-files, .recommendation-items, .download-grid, .item-grid
      ) {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--sccb-card-min-mobile)), 1fr)) !important;
      }

      html[data-sccb-site][data-sccb-grid="roomy"][data-sccb-host-ui="1"] :is(
        .sccb-mts-card-grid, .sccb-mts-grid, .sccb-simblr-card-grid,
        .sccb-tsr-card-grid, .sccb-related-grid, .sccb-tsr-related-grid,
        #browse-files, .recommendation-items, .download-grid, .item-grid
      ),
      html[data-sccb-site][data-sccb-grid="gallery"][data-sccb-host-ui="1"] :is(
        .sccb-mts-card-grid, .sccb-mts-grid, .sccb-simblr-card-grid,
        .sccb-tsr-card-grid, .sccb-related-grid, .sccb-tsr-related-grid,
        #browse-files, .recommendation-items, .download-grid, .item-grid
      ) {
        grid-template-columns: 1fr !important;
      }
    }


  `;
}
