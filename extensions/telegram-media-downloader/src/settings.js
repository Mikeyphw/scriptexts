(() => {
  const { ACTIONS, ext } = globalThis.TMD_COMMON;
  const status = document.getElementById("status");
  const setStatus = (text) => { status.textContent = text; };

  async function load() {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_SETTINGS });
    const settings = response?.settings || {};
    document.getElementById("debugEnabled").checked = !!settings.debugEnabled;
    document.getElementById("showFloatingButtons").checked = !!settings.showFloatingButtons;
    document.getElementById("autoCollectLight").checked = !!settings.autoCollectLight;
  }

  document.getElementById("save").addEventListener("click", async () => {
    await ext.runtime.sendMessage({
      type: ACTIONS.SET_SETTINGS,
      settings: {
        debugEnabled: document.getElementById("debugEnabled").checked,
        showFloatingButtons: document.getElementById("showFloatingButtons").checked,
        autoCollectLight: document.getElementById("autoCollectLight").checked,
      },
    });
    setStatus("Saved.");
  });

  document.getElementById("clearLogs").addEventListener("click", async () => {
    await ext.runtime.sendMessage({ type: ACTIONS.CLEAR_LOGS });
    setStatus("Logs cleared.");
  });

  document.getElementById("clearAll").addEventListener("click", async () => {
    await ext.runtime.sendMessage({ type: ACTIONS.CLEAR_ALL_INDEX });
    setStatus("All indexed media cleared.");
  });

  load().catch((error) => setStatus(error.message));
})();
