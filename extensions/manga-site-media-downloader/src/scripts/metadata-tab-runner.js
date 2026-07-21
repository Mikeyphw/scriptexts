(function () {
  "use strict";

  const HASH_PREFIX = "#mrm-extract-metadata=";
  const SEARCH_PARAM = "mrm_metadata_job";

  function getJobId() {
    if (location.hash.startsWith(HASH_PREFIX)) {
      try {
        return decodeURIComponent(location.hash.slice(HASH_PREFIX.length));
      } catch {
        return location.hash.slice(HASH_PREFIX.length);
      }
    }

    try {
      return new URLSearchParams(location.search).get(SEARCH_PARAM) || "";
    } catch {
      return "";
    }
  }

  function getCleanUrl() {
    try {
      const url = new URL(location.href);
      url.hash = "";
      url.searchParams.delete(SEARCH_PARAM);
      return url.href;
    } catch {
      return location.href.split("#")[0];
    }
  }

  function isChallengePage() {
    const title = String(document.title || "").toLowerCase();
    const body = String(document.body?.textContent || "").toLowerCase().slice(0, 5000);
    return title.includes("just a moment")
      || body.includes("checking your browser")
      || body.includes("verify you are human")
      || body.includes("cloudflare");
  }

  function hasUsableMetadata() {
    return !!document.querySelector(
      "meta[property='og:title'], meta[name='twitter:title'], h1.entry-title, article h1, .entry-title, article .entry-content img, .entry-content img"
    );
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForUsablePage() {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (isChallengePage()) {
        await delay(1000);
        continue;
      }

      if (hasUsableMetadata()) return true;
      await delay(500);
    }

    return hasUsableMetadata() && !isChallengePage();
  }


  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Could not read cover blob."));
      reader.readAsDataURL(blob);
    });
  }

  async function cacheCoverInsideMetadataTab(metadata) {
    const coverUrl = String(metadata?.thumbnailUrl || metadata?.coverUrl || "").trim();
    if (!metadata || metadata.coverDataUrl || !coverUrl || /^data:/i.test(coverUrl)) return metadata;

    try {
      const response = await fetch(coverUrl, {
        credentials: "include",
        cache: "force-cache",
        referrer: getCleanUrl(),
      });

      if (!response.ok) {
        throw new Error(`Cover fetch failed in metadata tab: HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const type = String(blob.type || "").toLowerCase();
      if (type && !type.startsWith("image/")) {
        throw new Error(`Cover fetch returned non-image content in metadata tab: ${type}`);
      }

      if (blob.size > 1536 * 1024) {
        throw new Error(`Cover image is too large to cache in metadata tab: ${blob.size} bytes`);
      }

      const coverDataUrl = await blobToDataUrl(blob);
      await browser.runtime.sendMessage({
        type: "MRM_APPEND_DEBUG",
        level: "info",
        message: "Metadata runner cached cover locally",
        meta: {
          url: metadata.canonicalUrl || metadata.url || getCleanUrl(),
          coverUrl,
          bytes: coverDataUrl.length,
        },
      }).catch(() => {});
      return { ...metadata, coverDataUrl };
    } catch (error) {
      await browser.runtime.sendMessage({
        type: "MRM_APPEND_DEBUG",
        level: "warn",
        message: "Metadata runner cover cache failed",
        meta: {
          url: metadata.canonicalUrl || metadata.url || getCleanUrl(),
          coverUrl,
          error: String(error?.message || error),
        },
      }).catch(() => {});
      return metadata;
    }
  }


  async function sendResult(jobId, ok, metadata = null, error = null) {
    try {
      await browser.runtime.sendMessage({
        type: "MRM_METADATA_TAB_RESULT",
        jobId,
        ok,
        metadata,
        error,
      });
    } catch {}
  }

  async function run() {
    const jobId = getJobId();
    if (!jobId) return;

    const runKey = `__mrmMetadataRunner_${jobId}`;
    if (window[runKey]) return;
    window[runKey] = true;

    try {
      await browser.runtime.sendMessage({
        type: "MRM_APPEND_DEBUG",
        level: "info",
        message: "Metadata runner started",
        meta: { jobId, url: getCleanUrl(), title: document.title || "" },
      }).catch(() => {});

      const ready = await waitForUsablePage();
      if (!ready) {
        const reason = isChallengePage()
          ? "Metadata page is still blocked by Cloudflare/challenge."
          : "Metadata page did not expose usable post metadata.";
        throw new Error(reason);
      }

      const extractor = window.MRMMetadataExtractor;
      const store = window.MRMLibraryStore;
      if (!extractor?.extractPostMetadata) {
        throw new Error("Metadata extractor is not available in metadata tab.");
      }

      const raw = extractor.extractPostMetadata(document, getCleanUrl());
      let metadata = store?.normalizeLibraryItem ? store.normalizeLibraryItem(raw) : raw;
      metadata = await cacheCoverInsideMetadataTab(metadata);

      await sendResult(jobId, true, metadata, null);

      await browser.runtime.sendMessage({
        type: "MRM_APPEND_DEBUG",
        level: "info",
        message: "Metadata runner completed",
        meta: {
          jobId,
          title: metadata.displayTitle || metadata.title || "",
          coverUrl: metadata.coverUrl || metadata.thumbnailUrl || "",
          tagCount: metadata.tags?.length || 0,
          categoryCount: metadata.categories?.length || 0,
          pageCount: metadata.pageCount || null,
          coverCached: !!metadata.coverDataUrl,
        },
      }).catch(() => {});
    } catch (error) {
      const message = String(error?.message || error);
      await sendResult(jobId, false, null, message);
      await browser.runtime.sendMessage({
        type: "MRM_APPEND_DEBUG",
        level: "error",
        message: "Metadata runner failed",
        meta: { jobId, url: getCleanUrl(), error: message, title: document.title || "" },
      }).catch(() => {});
    }
  }

  run();
})();
