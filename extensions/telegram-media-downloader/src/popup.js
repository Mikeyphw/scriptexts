(() => {
  const { ACTIONS, ext, utils } = globalThis.TMD_COMMON;
  const status = document.getElementById("status");
  const logsEl = document.getElementById("logs");
  const setStatus = (text) => { status.textContent = text; };

  async function activeTab() {
    const tabs = await ext.tabs.query({ active: true, currentWindow: true });
    return Array.isArray(tabs) ? tabs[0] : null;
  }

  async function sendToActive(type) {
    const tab = await activeTab();
    if (!tab?.id) throw new Error("No active Telegram tab");
    return ext.tabs.sendMessage(tab.id, { type });
  }

  function renderLogs(logs) {
    logsEl.textContent = "";
    if (!logs.length) {
      const empty = document.createElement("div");
      empty.className = "meta";
      empty.textContent = "No logs yet.";
      logsEl.appendChild(empty);
      return;
    }
    logs.slice(0, 80).forEach((entry) => {
      const div = document.createElement("div");
      div.className = `log ${entry.level || ""}`;

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `[${utils.formatTimestamp(entry.ts)}] ${String(entry.level || "").toUpperCase()} ${entry.source || ""}`;

      const msg = document.createElement("div");
      msg.className = "msg";
      msg.textContent = entry.message || "";

      const pre = document.createElement("pre");
      pre.className = "meta";
      pre.style.margin = "6px 0 0";
      pre.textContent = JSON.stringify(entry.data || {}, null, 2);

      div.appendChild(meta);
      div.appendChild(msg);
      div.appendChild(pre);
      logsEl.appendChild(div);
    });
  }

  async function refreshLogs() {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_LOGS });
    renderLogs(response?.logs || []);
  }

  async function loadSettings() {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_SETTINGS });
    const settings = response?.settings || {};
    document.getElementById("debugEnabled").checked = !!settings.debugEnabled;
    document.getElementById("showFloatingButtons").checked = !!settings.showFloatingButtons;
    document.getElementById("autoCollectLight").checked = !!settings.autoCollectLight;
  }

  async function saveSettings() {
    const settings = {
      debugEnabled: document.getElementById("debugEnabled").checked,
      showFloatingButtons: document.getElementById("showFloatingButtons").checked,
      autoCollectLight: document.getElementById("autoCollectLight").checked,
    };
    await ext.runtime.sendMessage({ type: ACTIONS.SET_SETTINGS, settings });
    setStatus("Settings saved. Reload Telegram tab if buttons still don't appear.");
  }

  document.getElementById("collect").addEventListener("click", async () => {
    setStatus("Collecting…");
    try {
      await sendToActive(ACTIONS.TAB_COLLECT_NOW);
      setStatus("Collect now finished.");
      await refreshLogs();
    } catch (error) {
      setStatus(`Collect failed: ${error.message}`);
    }
  });

  document.getElementById("harvest").addEventListener("click", async () => {
    const stepsValue = Number(document.getElementById("harvestSteps").value || 8);
    const steps = Math.max(1, Math.min(100, Number.isFinite(stepsValue) ? stepsValue : 8));
    setStatus(`Harvesting ${steps} step(s)…`);
    try {
      const tab = await activeTab();
      if (!tab?.id) throw new Error("No active Telegram tab");
      await ext.tabs.sendMessage(tab.id, { type: ACTIONS.TAB_HARVEST_MORE, steps });
      setStatus(`Harvest finished: ${steps} step(s).`);
      await refreshLogs();
    } catch (error) {
      setStatus(`Harvest failed: ${error.message}`);
    }
  });

  document.getElementById("browser").addEventListener("click", async () => {
    setStatus("Opening media browser…");
    try {
      await sendToActive(ACTIONS.TAB_OPEN_BROWSER);
      setStatus("Media browser opened.");
    } catch (error) {
      setStatus(`Open browser failed: ${error.message}`);
    }
  });

  document.getElementById("library").addEventListener("click", async () => {
    await ext.runtime.sendMessage({ type: ACTIONS.OPEN_LIBRARY });
    window.close();
  });

  document.getElementById("settings").addEventListener("click", async () => {
    await ext.runtime.openOptionsPage();
    window.close();
  });

  document.getElementById("copyLogs").addEventListener("click", async () => {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_LOGS });
    const logs = response?.logs || [];
    const text = logs.map((entry) => `[${new Date(entry.ts).toISOString()}] ${String(entry.level || "").toUpperCase()} ${entry.source || ""} ${entry.message || ""}\n${JSON.stringify(entry.data || {}, null, 2)}`).join("\n");
    await navigator.clipboard.writeText(text);
    setStatus("Logs copied.");
  });

  document.getElementById("clearLogs").addEventListener("click", async () => {
    await ext.runtime.sendMessage({ type: ACTIONS.CLEAR_LOGS });
    await refreshLogs();
    setStatus("Logs cleared.");
  });

  document.getElementById("refreshLogs").addEventListener("click", refreshLogs);

  ["debugEnabled","showFloatingButtons","autoCollectLight"].forEach((id) => {
    document.getElementById(id).addEventListener("change", saveSettings);
  });

  Promise.all([loadSettings(), refreshLogs()]).catch((error) => setStatus(error.message));
})();
