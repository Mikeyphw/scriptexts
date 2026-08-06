MRM.app = (() => {
  const removeNoise = () => {
    document.querySelectorAll("ins[data-zoneid], .eas6a97888e38, [id^='ad-'], .advertisement, .before-footer-widgets").forEach((node) => node.remove());
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
    if (MRM.runtime.page === "post") initPost();
    else if (MRM.runtime.page === "archive" || MRM.runtime.page === "search") initArchive();
    else MRM.settings.init();
  };
  return { start };
})();

MRM.app.start();
