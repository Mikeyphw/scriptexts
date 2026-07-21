(() => {
  const { ACTIONS, CONFIG, utils, ext } = globalThis.TMD_COMMON;
  if (window.__TMD_CONTENT_V340__) return;
  window.__TMD_CONTENT_V340__ = true;

  const state = {
    settings: { debugEnabled: true, showFloatingButtons: true, autoCollectLight: true },
    logs: [],
    tasks: [],
    debugOpen: false,
    browserOpen: false,
    collectRunning: false,
  };

  function log(level, message, data = {}, source = "content") {
    const entry = { ts: Date.now(), level, source, message, data };
    if (state.settings.debugEnabled || level === "error") {
      state.logs.unshift(entry);
      if (state.logs.length > 120) state.logs.length = 120;
    }
    ext.runtime.sendMessage({ type: ACTIONS.APPEND_LOG, entry }).catch(() => {});
    renderDebugPanel();
  }

  async function loadSettings() {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_SETTINGS });
    if (response?.ok) state.settings = response.settings;
    const logsResponse = await ext.runtime.sendMessage({ type: ACTIONS.GET_LOGS });
    if (logsResponse?.ok) state.logs = logsResponse.logs || [];
  }

  function getChatTitle() {
    const selectors = [".chat-info .title", ".profile-content .title", ".person .title", "header .title"];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const text = node?.textContent?.trim();
      if (text) return text;
    }
    return document.title.replace(/\s*-\s*Telegram.*/i, "").trim() || "telegram-chat";
  }

  function getChatDiagnostics() {
    const selectors = [".chat-info .title", ".profile-content .title", ".person .title", "header .title"];
    return selectors.map((selector) => {
      const node = document.querySelector(selector);
      return {
        selector,
        found: !!node,
        text: node?.textContent?.trim() || "",
      };
    });
  }

  function findScrollParent(node) {
    let current = node instanceof Element ? node : null;
    while (current && current !== document.body && current !== document.documentElement) {
      const style = getComputedStyle(current);
      const overflowY = style.overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight + 20) {
        return current;
      }
      current = current.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function getMediaDiagnostics() {
    const active = document.querySelector(CONFIG.selectors.activeMediaTab);
    const grid = document.querySelector(CONFIG.selectors.mediaGrid);
    const tiles = grid ? Array.from(grid.querySelectorAll(CONFIG.selectors.mediaTiles)) : [];
    const scrollParent = grid ? findScrollParent(grid) : null;
    return {
      activeMediaTabFound: !!active,
      mediaGridFound: !!grid,
      tileCount: tiles.length,
      scrollParentTag: scrollParent?.tagName || "",
      scrollParentClass: scrollParent?.className || "",
      scrollTop: scrollParent?.scrollTop || 0,
      scrollHeight: scrollParent?.scrollHeight || 0,
      clientHeight: scrollParent?.clientHeight || 0,
    };
  }

  function getChatKey() {
    return utils.hashCode(`${location.pathname}|${location.hash}|${getChatTitle()}`);
  }

  function resolveFromElement(el) {
    if (!el) return "";
    return el.currentSrc || el.src || el.querySelector?.("source")?.src || "";
  }

  function findMeaningfulMedia(root, tagName) {
    const nodes = Array.from(root.querySelectorAll(tagName));
    return nodes.find((node) => {
      if (utils.isExcludedNode(node)) return false;
      if (tagName === "img" && utils.isTinyNode(node)) return false;
      return Boolean(resolveFromElement(node));
    }) || null;
  }

  function resolveTile(tile) {
    const video = findMeaningfulMedia(tile, "video");
    const audio = findMeaningfulMedia(tile, "audio");
    const image = findMeaningfulMedia(tile, "img");
    const type = video || tile.querySelector(".video-time, .video-duration, [data-type='video'], .time")
      ? "video"
      : audio
        ? "audio"
        : image || tile.querySelector("canvas")
          ? "image"
          : "unknown";
    let directUrl = "";
    let previewUrl = image ? resolveFromElement(image) : "";
    if (type === "video") directUrl = video ? resolveFromElement(video) : "";
    if (type === "audio") directUrl = audio ? resolveFromElement(audio) : "";
    if (type === "image") directUrl = previewUrl;
    const duration = tile.querySelector(".time, .video-time, .video-duration")?.textContent?.trim() || "";
    const mid = tile.closest("[data-mid]")?.getAttribute("data-mid") || "";
    const fingerprint = utils.hashCode(`${type}|${previewUrl}|${mid}|${duration}`);
    return {
      type, directUrl, previewUrl, duration, mid, fingerprint,
      fileName: `${utils.hashCode(directUrl || previewUrl || tile.textContent || "media")}.${type === "video" ? "mp4" : type === "audio" ? "ogg" : "jpg"}`,
      tile,
    };
  }

  function resolveMessageMedia(message) {
    const nodes = Array.from(message.querySelectorAll("video, img, audio")).filter((node) => {
      if (utils.isExcludedNode(node)) return false;
      if (node.tagName.toLowerCase() === "img" && utils.isTinyNode(node)) return false;
      return Boolean(resolveFromElement(node));
    });
    return utils.uniqBy(nodes.map((node) => {
      const url = resolveFromElement(node);
      const tag = node.tagName.toLowerCase();
      const type = tag === "video" ? "video" : tag === "audio" ? "audio" : "image";
      return {
        type, url,
        previewUrl: type === "image" ? url : "",
        fingerprint: utils.hashCode(`${type}|${url}|${message.getAttribute("data-mid") || ""}`),
        fileName: `${utils.hashCode(url)}.${type === "video" ? "mp4" : type === "audio" ? "ogg" : "jpg"}`,
      };
    }), (item) => `${item.type}|${item.url}`);
  }

  function getForegroundViewerMedia() {
    const video = document.querySelector(CONFIG.selectors.viewerVideo);
    if (video) {
      const url = resolveFromElement(video);
      if (url) return { type: "video", url, fileName: `${utils.hashCode(url)}.mp4` };
    }
    const image = document.querySelector(CONFIG.selectors.viewerImage);
    if (image) {
      const url = resolveFromElement(image);
      if (url) return { type: "image", url, fileName: `${utils.hashCode(url)}.jpg` };
    }
    return null;
  }

  async function upsertEntries(entries) {
    if (!Array.isArray(entries) || !entries.length) return;
    await ext.runtime.sendMessage({
      type: ACTIONS.UPSERT_MEDIA_BATCH,
      chatKey: getChatKey(),
      chatLabel: getChatTitle(),
      entries,
    });
  }

  async function getChatMedia() {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_CHAT_MEDIA, chatKey: getChatKey() });
    return response?.value || { entries: [] };
  }

  async function collectMessagesLight() {
    const messages = Array.from(document.querySelectorAll(CONFIG.selectors.messageBubble)).slice(-80);
    const entries = [];
    for (const message of messages) {
      if (message.closest("#column-right")) continue;
      resolveMessageMedia(message).forEach((item) => {
        entries.push({
          fingerprint: item.fingerprint,
          chatKey: getChatKey(),
          chatLabel: getChatTitle(),
          type: item.type,
          previewUrl: item.previewUrl || "",
          originalUrl: item.url || "",
          duration: "",
          caption: "",
          source: "message",
          mid: message.getAttribute("data-mid") || "",
          fileName: item.fileName,
        });
      });
    }
    await upsertEntries(entries);
    return entries.length;
  }

  async function collectMediaTabLight() {
    const active = document.querySelector(CONFIG.selectors.activeMediaTab);
    const grid = document.querySelector(CONFIG.selectors.mediaGrid);
    if (!active || !grid) return 0;
    const tiles = Array.from(grid.querySelectorAll(CONFIG.selectors.mediaTiles));
    const entries = tiles.map((tile) => {
      const resolved = resolveTile(tile);
      if (resolved.type === "unknown") return null;
      return {
        fingerprint: resolved.fingerprint,
        chatKey: getChatKey(),
        chatLabel: getChatTitle(),
        type: resolved.type,
        previewUrl: resolved.previewUrl,
        originalUrl: resolved.directUrl,
        duration: resolved.duration,
        caption: "",
        source: "media-tab",
        mid: resolved.mid,
        fileName: resolved.fileName,
      };
    }).filter(Boolean);
    await upsertEntries(entries);
    return entries.length;
  }

  async function collectViewerLight() {
    const current = getForegroundViewerMedia();
    if (!current) return 0;
    await upsertEntries([{
      fingerprint: utils.hashCode(`${current.type}|${current.url}`),
      chatKey: getChatKey(),
      chatLabel: getChatTitle(),
      type: current.type,
      previewUrl: current.type === "image" ? current.url : "",
      originalUrl: current.url,
      duration: "",
      caption: "",
      source: "viewer",
      mid: "",
      fileName: current.fileName,
    }]);
    return 1;
  }

  async function collectNow() {
    if (state.collectRunning) return;
    state.collectRunning = true;
    try {
      log("info", "Collect now invoked", {
        chatTitle: getChatTitle(),
        chatDiagnostics: getChatDiagnostics(),
        mediaDiagnostics: getMediaDiagnostics(),
      }, "collector");
      const before = await getChatMedia();
      await collectMessagesLight();
      await collectMediaTabLight();
      await collectViewerLight();
      const after = await getChatMedia();
      log("info", "Collect now completed", {
        before: before.entries.length,
        after: after.entries.length,
        mediaDiagnostics: getMediaDiagnostics(),
      }, "collector");
      await renderMediaBrowser();
    } catch (error) {
      log("error", "Collect now failed", { message: String(error?.message || error) }, "collector");
      throw error;
    } finally {
      state.collectRunning = false;
    }
  }


  function getAndroidSafeScrollParent() {
    const grid = document.querySelector(CONFIG.selectors.mediaGrid);
    if (!grid) return null;
    let current = grid;
    while (current && current !== document.body && current !== document.documentElement) {
      const style = getComputedStyle(current);
      const overflowY = style.overflowY;
      if ((overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight + 20) {
        return current;
      }
      current = current.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  }

  function nudgeVirtualizedGrid(target) {
    if (!(target instanceof Element)) return;
    target.dispatchEvent(new Event("scroll", { bubbles: true }));
    target.dispatchEvent(new WheelEvent("wheel", { bubbles: true, deltaY: 480 }));
    target.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [] }));
    target.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, cancelable: true, touches: [] }));
    target.dispatchEvent(new TouchEvent("touchend", { bubbles: true, cancelable: true, touches: [] }));
  }

  async function harvestMore(maxSteps = 36) {
    const grid = document.querySelector(CONFIG.selectors.mediaGrid);
    const active = document.querySelector(CONFIG.selectors.activeMediaTab);
    const scrollParent = getAndroidSafeScrollParent();

    log("info", "Harvest more invoked", {
      chatTitle: getChatTitle(),
      mediaDiagnostics: getMediaDiagnostics(),
      androidSafe: /Android/i.test(navigator.userAgent || ""),
    }, "collector");

    if (!grid || !active || !scrollParent) throw new Error("Open Media tab first.");

    let lastCount = (await getChatMedia()).entries.length;
    let stableSteps = 0;

    const totalSteps = Math.max(1, Math.min(100, Number.isFinite(maxSteps) ? maxSteps : 36));

    for (let i = 0; i < totalSteps; i += 1) {
      const beforeDiag = getMediaDiagnostics();
      const stepSize = Math.max(720, Math.floor((scrollParent.clientHeight || 800) * 0.9));
      scrollParent.scrollTop += stepSize;
      nudgeVirtualizedGrid(scrollParent);
      nudgeVirtualizedGrid(grid);
      await utils.sleep(/Android/i.test(navigator.userAgent || "") ? 520 : 320);
      await collectMediaTabLight();

      const current = await getChatMedia();
      const count = Array.isArray(current.entries) ? current.entries.length : 0;
      const delta = count - lastCount;
      const afterDiag = getMediaDiagnostics();

      log("info", "Harvest step", {
        totalSteps,
        step: i + 1,
        count,
        delta,
        before: beforeDiag,
        after: afterDiag,
      }, "collector");

      if (state.browserOpen) await renderMediaBrowser();

      if (delta <= 0) stableSteps += 1;
      else stableSteps = 0;

      lastCount = count;
      if (stableSteps >= 5) break;
    }

    log("info", "Harvest more completed", { total: lastCount, mediaDiagnostics: getMediaDiagnostics() }, "collector");
    await renderMediaBrowser();
  }

  async function downloadEntry(entry) {
    const url = entry.originalUrl || (entry.type === "image" ? entry.previewUrl : "");
    if (!url) throw new Error("No media URL");
    if (entry.type === "video" && !entry.originalUrl) throw new Error("Video unresolved: no original URL captured yet.");
    if (url.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.fileName || "download.bin";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    await ext.runtime.sendMessage({
      type: ACTIONS.DOWNLOAD_URL,
      url,
      filename: entry.fileName || "download.bin",
    });
  }

  function injectBridge() {
    if (document.getElementById("tmd-page-bridge")) return;
    const script = document.createElement("script");
    script.id = "tmd-page-bridge";
    script.src = chrome.runtime.getURL("page-bridge.js");
    document.documentElement.appendChild(script);
  }

  function handleBridgeMessage(event) {
    if (event.source !== window) return;
    if (event.data?.source !== "TMD_PAGE_BRIDGE") return;
    const payload = event.data.payload || {};
    const type = payload.type || payload.kind;
    upsertEntries([{
      fingerprint: utils.hashCode(`${payload.type || ""}|${payload.url || ""}|${payload.mime || ""}`),
      chatKey: getChatKey(),
      chatLabel: getChatTitle(),
      type: payload.type || "",
      previewUrl: payload.type === "image" ? (payload.url || "") : "",
      originalUrl: payload.url || "",
      duration: "",
      caption: "",
      source: `bridge:${payload.kind || "unknown"}`,
      mid: "",
      mime: payload.mime || "",
      fileName: `${utils.hashCode(payload.url || "")}.${payload.type === "video" ? "mp4" : payload.type === "audio" ? "ogg" : "jpg"}`,
    }]).catch(() => {});
  }

  function injectStyles() {
    if (document.getElementById("tmd-inline-styles")) return;
    const style = document.createElement("style");
    style.id = "tmd-inline-styles";
    style.textContent = `
      .tmd-root{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:2147483647;font-family:Inter,system-ui,sans-serif}
      .tmd-fab,.tmd-media-browser-fab{width:52px;height:52px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(10,21,37,.92);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28)}
      .tmd-media-browser-fab{position:fixed;right:max(12px,env(safe-area-inset-right));bottom:76px;z-index:2147483646;font-size:12px;font-weight:700}
      .tmd-panel{position:absolute;right:0;bottom:64px;width:360px;max-height:min(70dvh,720px);display:flex;flex-direction:column;overflow:hidden;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:rgba(9,19,34,.96);color:#e7edf7;box-shadow:0 16px 38px rgba(0,0,0,.35)}
      .tmd-panel[hidden],.tmd-media-browser[hidden]{display:none!important}
      .tmd-panel-head,.tmd-browser-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;padding:12px;border-bottom:1px solid rgba(255,255,255,.08)}
      .tmd-sub,.tmd-browser-sub{font-size:12px;color:#8aa0bd}
      .tmd-actions,.tmd-browser-actions{display:flex;gap:6px;flex-wrap:wrap}
      .tmd-btn{min-width:60px;height:34px;padding:0 10px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#fff;cursor:pointer;font-size:12px}
      .tmd-section{display:flex;flex-direction:column;min-height:0}
      .tmd-section-title{padding:10px 12px 8px;font-size:12px;color:#8aa0bd;text-transform:uppercase;letter-spacing:.05em}
      .tmd-task-list,.tmd-log-list{overflow:auto;padding:0 10px 10px;display:grid;gap:8px}
      .tmd-task-row,.tmd-log-row{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.03);padding:10px}
      .tmd-task-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center}
      .tmd-task-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .tmd-task-meta{font-size:12px;color:#8aa0bd}
      .tmd-log-row.error{border-color:rgba(255,89,89,.32)}
      .tmd-log-row.warn{border-color:rgba(255,196,89,.24)}
      .tmd-log-head{font-size:11px;color:#8aa0bd}
      .tmd-log-body{font-size:12px;margin-top:3px}
      .tmd-log-pre{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;font-size:11px;color:#cbd7e7}
      .tmd-empty{padding:12px;color:#8aa0bd;font-size:12px}
      .tmd-media-browser{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(90vw,1180px);height:min(84vh,860px);z-index:2147483645;border:1px solid rgba(255,255,255,.12);border-radius:22px;background:rgba(9,19,34,.96);color:#e7edf7;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.42);backdrop-filter:blur(12px)}
      .tmd-browser-title{font-size:18px;font-weight:700}
      .tmd-browser-toolbar{display:flex;gap:8px;flex-wrap:wrap;padding:12px;border-bottom:1px solid rgba(255,255,255,.08)}
      .tmd-browser-toolbar button{height:36px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:#fff;cursor:pointer}
      .tmd-browser-toolbar button.active{background:#184f8a}
      .tmd-browser-grid{padding:12px;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;align-content:start}
      .tmd-browser-card{position:relative;border-radius:16px;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);min-height:180px}
      .tmd-browser-card img{width:100%;height:100%;object-fit:cover;display:block;aspect-ratio:1/1}
      .tmd-browser-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to top, rgba(0,0,0,.45), transparent 45%)}
      .tmd-browser-badge,.tmd-browser-duration,.tmd-media-tile-badge{position:absolute;left:8px;padding:0 6px;height:22px;border-radius:999px;background:rgba(0,0,0,.66);font-size:11px;line-height:22px}
      .tmd-browser-badge,.tmd-media-tile-badge{bottom:8px}
      .tmd-browser-duration{top:8px}
      .tmd-browser-download,.tmd-media-tile-btn,.tmd-viewer-btn,.tmd-msg-btn{border:1px solid rgba(255,255,255,.14);background:rgba(9,19,34,.78);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
      .tmd-browser-download,.tmd-media-tile-btn{position:absolute;right:8px;bottom:8px;width:36px;height:36px;border-radius:999px}
      .tmd-viewer-btn{min-width:44px;height:44px;border-radius:999px}
      .tmd-msg-btn{position:absolute;right:6px;bottom:6px;min-width:34px;height:34px;border-radius:999px;z-index:4}
      @media (max-width:720px){.tmd-media-browser{width:96vw;height:88vh}.tmd-browser-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}.tmd-panel{width:min(92vw,360px)}}
    `;
    document.head.appendChild(style);
  }

  function mountDebugPanel() {
    if (document.getElementById("tmd-root")) return;
    const root = utils.createEl("div", { id: "tmd-root", className: "tmd-root" });

    const fab = utils.createEl("button", { className: "tmd-fab", type: "button", text: "↓" });
    fab.setAttribute("aria-expanded", "false");

    const panel = utils.createEl("section", { className: "tmd-panel" });
    panel.hidden = true;

    const head = utils.createEl("div", { className: "tmd-panel-head" });
    const left = utils.createEl("div");
    const strong = document.createElement("strong");
    strong.textContent = "Media downloads";
    const sub = utils.createEl("div", { className: "tmd-sub", text: "Compact panel · debug on" });
    left.appendChild(strong);
    left.appendChild(sub);

    const actions = utils.createEl("div", { className: "tmd-actions" });
    [["toggle-debug","Debug on"],["copy-logs","Copy"],["clear-logs","Clear"],["close","Close"]].forEach(([act, label]) => {
      const btn = utils.createEl("button", { className: "tmd-btn", type: "button", text: label });
      btn.setAttribute("data-act", act);
      actions.appendChild(btn);
    });

    head.appendChild(left);
    head.appendChild(actions);

    const section = utils.createEl("div", { className: "tmd-section" });
    section.appendChild(utils.createEl("div", { className: "tmd-section-title", text: "Debug log" }));
    section.appendChild(utils.createEl("div", { className: "tmd-log-list" }));

    panel.appendChild(head);
    panel.appendChild(section);
    root.appendChild(fab);
    root.appendChild(panel);
    document.body.appendChild(root);

    fab.addEventListener("click", () => {
      state.debugOpen = !state.debugOpen;
      renderDebugPanel();
    });

    root.addEventListener("click", async (event) => {
      const action = event.target.closest("[data-act]")?.getAttribute("data-act");
      if (!action) return;
      if (action === "close") state.debugOpen = false;
      if (action === "copy-logs") await navigator.clipboard.writeText(state.logs.map((entry) => `[${new Date(entry.ts).toISOString()}] ${entry.level.toUpperCase()} ${entry.source} ${entry.message}\n${JSON.stringify(entry.data, null, 2)}`).join("\n\n"));
      if (action === "clear-logs") {
        state.logs = [];
        await ext.runtime.sendMessage({ type: ACTIONS.CLEAR_LOGS });
      }
      if (action === "toggle-debug") {
        state.settings.debugEnabled = !state.settings.debugEnabled;
        await ext.runtime.sendMessage({ type: ACTIONS.SET_SETTINGS, settings: state.settings });
      }
      renderDebugPanel();
    });
    renderDebugPanel();
  }

  function renderDebugPanel() {
    const root = document.getElementById("tmd-root");
    if (!root) return;
    root.querySelector(".tmd-panel").hidden = !state.debugOpen;
    root.querySelector(".tmd-fab").setAttribute("aria-expanded", String(state.debugOpen));
    root.querySelector(".tmd-sub").textContent = `Compact panel · debug ${state.settings.debugEnabled ? "on" : "off"}`;
    root.querySelector('[data-act="toggle-debug"]').textContent = state.settings.debugEnabled ? "Debug on" : "Debug off";
    const list = root.querySelector(".tmd-log-list");
    list.textContent = "";
    if (!state.logs.length) {
      list.appendChild(utils.createEl("div", { className: "tmd-empty", text: "No logs." }));
      return;
    }
    state.logs.slice(0, 80).forEach((entry) => {
      const row = utils.createEl("div", { className: `tmd-log-row ${entry.level}` });
      const head = utils.createEl("div", { className: "tmd-log-head", text: `[${utils.formatTimestamp(entry.ts)}] ${entry.level.toUpperCase()} ${entry.source}` });
      const body = utils.createEl("div", { className: "tmd-log-body", text: entry.message });
      const pre = utils.createEl("pre", { className: "tmd-log-pre" });
      pre.textContent = JSON.stringify(entry.data, null, 2);
      row.appendChild(head);
      row.appendChild(body);
      row.appendChild(pre);
      list.appendChild(row);
    });
  }

  async function mountMediaBrowser() {
    if (!state.settings.showFloatingButtons) return;
    if (!document.getElementById("tmd-media-browser-fab")) {
      const fab = utils.createEl("button", { id: "tmd-media-browser-fab", className: "tmd-media-browser-fab", type: "button", text: "Media" });
      const browser = utils.createEl("section", { id: "tmd-media-browser", className: "tmd-media-browser", hidden: true });

      const head = utils.createEl("div", { className: "tmd-browser-head" });
      const headLeft = utils.createEl("div");
      headLeft.appendChild(utils.createEl("div", { className: "tmd-browser-title", text: "Floating media browser" }));
      headLeft.appendChild(utils.createEl("div", { className: "tmd-browser-sub", text: "Persistent per-chat media index." }));

      const headActions = utils.createEl("div", { className: "tmd-browser-actions" });
      [["collect","Collect now"],["harvest","Harvest more"],["close","Close"]].forEach(([act, label]) => {
        const btn = utils.createEl("button", { className: "tmd-btn", type: "button", text: label });
        btn.setAttribute("data-act", act);
        headActions.appendChild(btn);
      });

      head.appendChild(headLeft);
      head.appendChild(headActions);

      const toolbar = utils.createEl("div", { className: "tmd-browser-toolbar" });
      [["all","All",true],["photos","Photos",false],["videos","Videos",false],["audio","Audio",false]].forEach(([flt, label, active]) => {
        const btn = utils.createEl("button", { type: "button", text: label, className: active ? "active" : "" });
        btn.setAttribute("data-filter", flt);
        toolbar.appendChild(btn);
      });

      browser.appendChild(head);
      browser.appendChild(toolbar);
      browser.appendChild(utils.createEl("div", { className: "tmd-browser-grid" }));

      document.body.appendChild(fab);
      document.body.appendChild(browser);

      fab.addEventListener("click", async () => {
        state.browserOpen = !state.browserOpen;
        browser.hidden = !state.browserOpen;
        if (state.browserOpen) await renderMediaBrowser();
      });

      browser.addEventListener("click", async (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        const action = button.dataset.act;
        const filter = button.dataset.filter;
        if (action === "close") {
          state.browserOpen = false;
          browser.hidden = true;
        } else if (action === "collect") {
          try {
            button.disabled = true;
            button.textContent = "Collecting...";
            await collectNow();
          } finally {
            button.disabled = false;
            button.textContent = "Collect now";
          }
        } else if (action === "harvest") {
          try {
            button.disabled = true;
            button.textContent = "Harvesting...";
            await harvestMore();
          } finally {
            button.disabled = false;
            button.textContent = "Harvest more";
          }
        } else if (filter) {
          browser.setAttribute("data-filter", filter);
          browser.querySelectorAll("[data-filter]").forEach((node) => node.classList.remove("active"));
          button.classList.add("active");
          await renderMediaBrowser();
        }
      });
    }
  }

  async function renderMediaBrowser() {
    const browser = document.getElementById("tmd-media-browser");
    if (!browser) return;
    const grid = browser.querySelector(".tmd-browser-grid");
    const data = await getChatMedia();
    let entries = Array.isArray(data.entries) ? data.entries.slice() : [];
    const filter = browser.getAttribute("data-filter") || "all";
    if (filter === "photos") entries = entries.filter((e) => e.type === "image");
    if (filter === "videos") entries = entries.filter((e) => e.type === "video");
    if (filter === "audio") entries = entries.filter((e) => e.type === "audio");

    grid.textContent = "";
    if (!entries.length) {
      grid.appendChild(utils.createEl("div", { className: "tmd-empty", text: "No indexed media yet. Use Collect now." }));
      return;
    }
    entries.forEach((entry) => {
      const preview = entry.previewUrl || (entry.type === "image" ? entry.originalUrl : "");
      const card = utils.createEl("article", { className: "tmd-browser-card" });

      if (preview) {
        const img = document.createElement("img");
        img.src = preview;
        img.alt = "";
        card.appendChild(img);
      } else {
        const empty = document.createElement("div");
        empty.textContent = "No preview";
        empty.style.height = "100%";
        empty.style.minHeight = "180px";
        empty.style.display = "flex";
        empty.style.alignItems = "center";
        empty.style.justifyContent = "center";
        empty.style.color = "#8aa0bd";
        empty.style.fontSize = "12px";
        card.appendChild(empty);
      }

      card.appendChild(utils.createEl("div", { className: "tmd-browser-overlay" }));
      card.appendChild(utils.createEl("div", { className: "tmd-browser-badge", text: entry.type === "video" ? "Video" : entry.type === "audio" ? "Audio" : "Photo" }));
      if (entry.duration) card.appendChild(utils.createEl("div", { className: "tmd-browser-duration", text: entry.duration }));
      const downloadBtn = utils.createEl("button", { className: "tmd-browser-download", type: "button", text: "↓", title: "Download" });
      card.appendChild(downloadBtn);

      downloadBtn.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await downloadEntry(entry);
          log("info", "Download queued", { type: entry.type, url: entry.originalUrl || entry.previewUrl }, "download");
        } catch (error) {
          log("error", "Download failed", { message: String(error?.message || error), entry }, "download");
        }
      });
      grid.appendChild(card);
    });
  }

  function mountMessageButtons() {
    if (!state.settings.showFloatingButtons) return;
    const messages = Array.from(document.querySelectorAll(CONFIG.selectors.messageBubble));
    messages.forEach((message) => {
      if (message.dataset.tmdMessageMounted === "1") return;
      if (message.closest("#column-right")) return;
      if (message.closest(CONFIG.selectors.excludedNodes)) return;
      const items = resolveMessageMedia(message);
      if (!items.length) return;
      message.dataset.tmdMessageMounted = "1";
      utils.ensureRelativePosition(message);
      const button = utils.createEl("button", {
        className: "tmd-msg-btn",
        type: "button",
        text: items.length > 1 ? `+${items.length}` : "↓",
        title: "Queue media",
      });
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const latest = resolveMessageMedia(message);
        await upsertEntries(latest.map((item) => ({
          fingerprint: item.fingerprint,
          chatKey: getChatKey(),
          chatLabel: getChatTitle(),
          type: item.type,
          previewUrl: item.previewUrl || "",
          originalUrl: item.url || "",
          duration: "",
          caption: "",
          source: "message-button",
          mid: message.getAttribute("data-mid") || "",
          fileName: item.fileName,
        })));
        if (state.browserOpen) await renderMediaBrowser();
      });
      message.appendChild(button);
    });
  }

  function mountViewerButtons() {
    if (!state.settings.showFloatingButtons) return;
    const current = getForegroundViewerMedia();
    if (!current) return;
    const containers = [
      document.querySelector(CONFIG.selectors.viewerActionsK),
      document.querySelector(CONFIG.selectors.viewerActionsZ),
      document.querySelector(CONFIG.selectors.viewerVideoControlsZ),
      document.querySelector(CONFIG.selectors.viewerVideoControlsK),
    ].filter(Boolean);
    containers.forEach((container) => {
      if (container.querySelector(".tmd-viewer-btn")) return;
      const button = utils.createEl("button", { className: "tmd-viewer-btn", type: "button", text: "↓", title: "Download media" });
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const media = getForegroundViewerMedia();
        if (!media) return;
        await upsertEntries([{
          fingerprint: utils.hashCode(`${media.type}|${media.url}`),
          chatKey: getChatKey(),
          chatLabel: getChatTitle(),
          type: media.type,
          previewUrl: media.type === "image" ? media.url : "",
          originalUrl: media.url,
          duration: "",
          caption: "",
          source: "viewer-button",
          mid: "",
          fileName: media.fileName,
        }]);
        if (state.browserOpen) await renderMediaBrowser();
      });
      container.prepend(button);
    });
  }

  function mountMediaTabButtons() {
    if (!state.settings.showFloatingButtons) return;
    const active = document.querySelector(CONFIG.selectors.activeMediaTab);
    const grid = document.querySelector(CONFIG.selectors.mediaGrid);
    if (!active || !grid) return;
    Array.from(grid.querySelectorAll(CONFIG.selectors.mediaTiles)).forEach((tile) => {
      const resolved = resolveTile(tile);
      if (resolved.type === "unknown") return;
      utils.ensureRelativePosition(tile);

      let button = tile.querySelector(".tmd-media-tile-btn");
      if (!button) {
        button = utils.createEl("button", { className: "tmd-media-tile-btn", type: "button", text: "↓", title: "Queue media" });
        button.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const latest = resolveTile(tile);
          await upsertEntries([{
            fingerprint: latest.fingerprint,
            chatKey: getChatKey(),
            chatLabel: getChatTitle(),
            type: latest.type,
            previewUrl: latest.previewUrl,
            originalUrl: latest.directUrl,
            duration: latest.duration,
            caption: "",
            source: "media-tab-button",
            mid: latest.mid,
            fileName: latest.fileName,
          }]);
          if (state.browserOpen) await renderMediaBrowser();
        });
        tile.appendChild(button);
      }

      let badge = tile.querySelector(".tmd-media-tile-badge");
      if (!badge) {
        badge = utils.createEl("div", { className: "tmd-media-tile-badge" });
        tile.appendChild(badge);
      }
      badge.textContent = resolved.type === "video" ? "V" : resolved.type === "audio" ? "A" : "I";
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      if (message?.type === ACTIONS.TAB_COLLECT_NOW) {
        await collectNow();
        sendResponse({ ok: true });
      } else if (message?.type === ACTIONS.TAB_HARVEST_MORE) {
        await harvestMore(message.steps);
        sendResponse({ ok: true });
      } else if (message?.type === ACTIONS.TAB_OPEN_BROWSER) {
        state.browserOpen = true;
        const browser = document.getElementById("tmd-media-browser");
        if (browser) browser.hidden = false;
        await renderMediaBrowser();
        sendResponse({ ok: true });
      } else if (message?.type === ACTIONS.TAB_TOGGLE_DEBUG_PANEL) {
        state.debugOpen = !state.debugOpen;
        renderDebugPanel();
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false });
      }
    })().catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));
    return true;
  });

  async function bootstrap() {
    await loadSettings();
    injectStyles();
    injectBridge();
    window.addEventListener("message", handleBridgeMessage);
    mountDebugPanel();
    await mountMediaBrowser();
    log("info", "UI mounted", { floatingButtons: state.settings.showFloatingButtons }, "ui");

    const tick = utils.debounce(async () => {
      if (state.settings.autoCollectLight) {
        collectMessagesLight().catch(() => {});
        collectMediaTabLight().catch(() => {});
        collectViewerLight().catch(() => {});
      }
      mountMessageButtons();
      mountViewerButtons();
      mountMediaTabButtons();
      if (state.browserOpen) renderMediaBrowser().catch(() => {});
    }, 120);

    const observer = new MutationObserver(() => tick());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "src", "style"],
    });

    mountMessageButtons();
    mountViewerButtons();
    mountMediaTabButtons();
    log("info", "Content script started", {
      chat: getChatTitle(),
      chatDiagnostics: getChatDiagnostics(),
      mediaButton: !!document.getElementById("tmd-media-browser-fab"),
      debugButton: !!document.getElementById("tmd-root"),
      mediaDiagnostics: getMediaDiagnostics(),
    }, "core");
  }

  bootstrap().catch((error) => {
    console.error("[TMD] bootstrap failed", error);
  });
})();