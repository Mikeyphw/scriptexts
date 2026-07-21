(() => {
  if (window.__TMD_PAGE_BRIDGE__) return;
  window.__TMD_PAGE_BRIDGE__ = true;

  const classify = (url, mime) => {
    const value = `${mime || ""} ${url || ""}`;
    if (/video\//i.test(value) || /\.(mp4|webm|mov)(\?|$)/i.test(value)) return "video";
    if (/audio\//i.test(value) || /\.(ogg|mp3|m4a)(\?|$)/i.test(value)) return "audio";
    if (/image\//i.test(value) || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(value)) return "image";
    return "";
  };

  const post = (payload) => window.postMessage({ source: "TMD_PAGE_BRIDGE", payload }, "*");

  const originalCreateObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (blob) => {
    const url = originalCreateObjectURL(blob);
    const mime = blob?.type || "";
    const type = classify(url, mime);
    if (type) post({ kind: "blob", url, mime, type, size: blob.size || 0 });
    return url;
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    try {
      const reqUrl = typeof input === "string" ? input : input?.url || "";
      const url = response.url || reqUrl;
      const mime = (response.headers.get("Content-Type") || "").split(";")[0];
      const type = classify(url, mime);
      if (type) post({ kind: "fetch", url, mime, type, status: response.status });
    } catch {}
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this.__tmd_url = url;
    return originalOpen.call(this, method, url, ...rest);
  };
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener("load", function() {
      try {
        const url = this.responseURL || this.__tmd_url || "";
        const mime = (this.getResponseHeader("Content-Type") || "").split(";")[0];
        const type = classify(url, mime);
        if (type) post({ kind: "xhr", url, mime, type, status: this.status });
      } catch {}
    });
    return originalSend.apply(this, args);
  };
})();
