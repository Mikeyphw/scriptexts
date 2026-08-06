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
