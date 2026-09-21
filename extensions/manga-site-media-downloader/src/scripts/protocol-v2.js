(() => {
  if (globalThis.EXT_PROTOCOL_V2) return;
  const VERSION = 2;
  const REQUEST_PREFIX = "extv2";
  let sequence = 0;
  function requestId() {
    sequence = (sequence + 1) % 0x7fffffff;
    return `${REQUEST_PREFIX}:${Date.now().toString(36)}:${sequence.toString(36)}`;
  }
  function isObject(value) { return !!value && typeof value === "object" && !Array.isArray(value); }
  function createRequest(action, payload = {}, id = requestId()) {
    if (!action || typeof action !== "string") throw new TypeError("Protocol action must be a non-empty string");
    return { protocol: "scriptexts-extension", version: VERSION, requestId: String(id), action, payload: isObject(payload) ? payload : { value: payload } };
  }
  function normalizeIncoming(message) {
    if (!isObject(message)) return { ok: false, error: "invalid-message" };
    if (message.protocol === "scriptexts-extension") {
      if (message.version !== VERSION) return { ok: false, error: "unsupported-version", requestId: message.requestId || null };
      if (!message.requestId || typeof message.action !== "string" || !message.action) return { ok: false, error: "invalid-envelope", requestId: message.requestId || null };
      return { ok: true, legacy: false, requestId: String(message.requestId), action: message.action, payload: isObject(message.payload) ? message.payload : {} };
    }
    if (typeof message.type !== "string" || !message.type) return { ok: false, error: "missing-action" };
    return { ok: true, legacy: true, requestId: null, action: message.type, payload: message };
  }
  function toLegacyMessage(normalized) {
    if (!normalized?.ok) return null;
    if (normalized.legacy) return normalized.payload;
    return { ...normalized.payload, type: normalized.action, __protocolV2RequestId: normalized.requestId };
  }
  function response(normalized, value, error = null) {
    if (!normalized || normalized.legacy) return value;
    return error
      ? { protocol: "scriptexts-extension", version: VERSION, requestId: normalized.requestId, ok: false, error: String(error?.message || error) }
      : { protocol: "scriptexts-extension", version: VERSION, requestId: normalized.requestId, ok: true, value };
  }
  function senderAllowed(sender, options = {}) {
    if (!sender || typeof sender !== "object") return false;
    const runtimeId = globalThis.browser?.runtime?.id || globalThis.chrome?.runtime?.id || null;
    if (sender.id && runtimeId && sender.id !== runtimeId) return false;
    if (sender.tab?.url) {
      try {
        const url = new URL(sender.tab.url);
        const allowed = options.allowedHosts || [];
        if (allowed.length && !allowed.includes(url.hostname)) return false;
      } catch { return false; }
    }
    return true;
  }
  function adaptPromiseListener(handler, options = {}) {
    return (raw, sender) => {
      const normalized = normalizeIncoming(raw);
      if (!normalized.ok) return raw?.protocol === "scriptexts-extension" ? Promise.resolve(response({ legacy:false, requestId: normalized.requestId }, null, normalized.error)) : undefined;
      if (!senderAllowed(sender || {}, options)) return Promise.resolve(response(normalized, null, "sender-not-allowed"));
      let result;
      try { result = handler(toLegacyMessage(normalized), sender); } catch (error) { return Promise.resolve(response(normalized, null, error)); }
      if (typeof result === "undefined") return normalized.legacy ? undefined : Promise.resolve(response(normalized, null, "unknown-action"));
      return Promise.resolve(result).then((value) => response(normalized, value), (error) => response(normalized, null, error));
    };
  }
  function adaptCallbackListener(handler, options = {}) {
    return (raw, sender, sendResponse) => {
      const normalized = normalizeIncoming(raw);
      if (!normalized.ok) {
        if (raw?.protocol === "scriptexts-extension") sendResponse(response({ legacy:false, requestId: normalized.requestId }, null, normalized.error));
        return false;
      }
      if (!senderAllowed(sender || {}, options)) { sendResponse(response(normalized, null, "sender-not-allowed")); return false; }
      const wrapped = (value) => sendResponse(response(normalized, value));
      try { return handler(toLegacyMessage(normalized), sender, wrapped); }
      catch (error) { sendResponse(response(normalized, null, error)); return false; }
    };
  }
  function withTimeout(promise, ms = 15000, label = "extension request") {
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms); });
    return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timer));
  }
  globalThis.EXT_PROTOCOL_V2 = Object.freeze({ VERSION, createRequest, normalizeIncoming, toLegacyMessage, response, senderAllowed, adaptPromiseListener, adaptCallbackListener, withTimeout });
})();
