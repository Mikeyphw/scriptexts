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
