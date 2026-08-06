MRM.theme = (() => {
  const styleId = "mrm-reimagined-styles";
  const install = () => {
    if (!document.getElementById(styleId)) {
      const style = MRM.util.create("style", { attrs: { id: styleId }, text: MRM.css });
      document.documentElement.append(style);
    }
    apply(MRM.storage.preferences);
  };
  const apply = (preferences) => {
    const root = document.documentElement;
    root.classList.toggle("mrm-ui-enabled", Boolean(preferences.uiEnabled));
    root.classList.toggle("mrm-ui-disabled", !preferences.uiEnabled);
    root.dataset.mrmDock = preferences.dock;
    root.style.setProperty("--mrm-accent", preferences.accent);
    root.style.setProperty("--mrm-grid-desktop", preferences.grid.desktop);
    root.style.setProperty("--mrm-grid-tablet", preferences.grid.tablet);
    root.style.setProperty("--mrm-grid-mobile", preferences.grid.mobile);
    root.style.setProperty("--mrm-grid-gap", `${preferences.grid.gap}px`);
    root.style.setProperty("--mrm-cover-ratio", preferences.grid.ratio);
    for (const [name, enabled] of Object.entries(preferences.border)) root.dataset[`mrmBorder${name[0].toUpperCase()}${name.slice(1)}`] = enabled ? "on" : "off";
    document.body?.classList.toggle("mrm-reader-capable", true);
  };
  MRM.events.addEventListener("preferences", (event) => apply(event.detail));
  return { install, apply };
})();
