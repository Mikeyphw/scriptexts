    /* LPSG mobile-first controls. Same IIFE, no external bridge or global exports. */
    const mobileUX = {
        favorites: new Set(), recent: new Set(), favoritesOnly: false, recentOnly: false,
        searchOpen: false, currentJob: null, currentThread: "", suppressGridClickUntil: 0,
        livePartLinks: new Map(), preparedShare: null, sourceIdSet: new Set(), resultCount: 0,
    };

    function mobileStorageRead(key, fallback = null) {
        try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
        catch { return fallback; }
    }
    function mobileStorageWrite(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch { return false; }
    }
    function mobileThreadKey(suffix) {
        return `pg_mf_${suffix}_${getThreadCacheId()}`;
    }
    function mobileLoadCollections() {
        const thread = getThreadCacheId();
        if (mobileUX.currentThread !== thread) mobileUX.recent.clear();
        mobileUX.currentThread = thread;
        const saved = mobileStorageRead(mobileThreadKey("favorites"), []);
        mobileUX.favorites = mobileStorageRead("pg_mf_session_favorites", false) ? new Set() :
            new Set(Array.isArray(saved) ? saved.filter(x => typeof x === "string").slice(0, 2000) : []);
    }
    function mobileToggleFavorite(item) {
        if (!item?.id) return;
        if (mobileUX.favorites.has(item.id)) mobileUX.favorites.delete(item.id);
        else {
            mobileUX.favorites.add(item.id);
            if (mobileUX.favorites.size > 2000) mobileUX.favorites.delete(mobileUX.favorites.values().next().value);
        }
        if (!mobileStorageRead("pg_mf_session_favorites", false) &&
            !mobileStorageWrite(mobileThreadKey("favorites"), [...mobileUX.favorites].slice(-2000))) {
            showToast("mf-storage", "Storage unavailable; favorite retained for this session.", { level: "warn", timeout: 3500 });
        }
        refreshMobileLightboxActions();
        if (mobileUX.favoritesOnly) { state.filteredMediaCache = null; renderGrid(); }
    }
    function mobileMarkViewed(item) {
        if (!item?.id) return;
        if (mobileUX.preparedShare?.id !== item.id) mobileUX.preparedShare = null;
        mobileUX.recent.delete(item.id);
        mobileUX.recent.add(item.id);
        if (mobileUX.recentOnly) state.filteredMediaCache = null;
        if (mobileUX.recent.size > 200) mobileUX.recent.delete(mobileUX.recent.values().next().value);
    }
    function mobileRefreshFavoritesView() {
        state.filteredMediaCache = null;
        renderGrid();
    }
    function mobileOpenSearch() {
        const dialog = document.getElementById("pg-mf-search");
        if (!dialog) return;
        mobileHideDownloads();
        mobileUX.searchOpen = true;
        dialog.hidden = false;
        dialog.setAttribute("aria-hidden", "false");
        dialog.classList.add("visible");
        const input = dialog.querySelector("#pg-mf-query");
        if (input) { input.value = state.gallerySearch || ""; input.focus(); }
        const sort = dialog.querySelector("#pg-mf-sort");
        if (sort) sort.value = state.gallerySort;
        mobileRefreshSearch();
    }
    function mobileCloseSearch() {
        const dialog = document.getElementById("pg-mf-search");
        mobileUX.searchOpen = false;
        if (!dialog) return;
        dialog.hidden = true;
        dialog.setAttribute("aria-hidden", "true");
        dialog.classList.remove("visible");
        document.querySelector("#pg-mf-nav button[data-mf='search']")?.focus?.();
    }
    function mobileRefreshSearch() {
        const dialog = document.getElementById("pg-mf-search");
        if (!dialog || dialog.hidden) return;
        const pages = [...new Set(getAllMedia().map(x => Number(x.pageNumber)).filter(x => Number.isInteger(x) && x >= 1))].sort((a,b) => a-b);
        const page = dialog.querySelector("#pg-mf-page");
        if (page) {
            const last = state.pageFilter;
            page.replaceChildren(new Option("All pages", "all"), ...pages.map(n => new Option(`Page ${n}`, String(n))));
            page.value = last;
        }
        dialog.querySelectorAll("[data-mf-filter]").forEach(btn => {
            const selected = btn.dataset.mfFilter === state.filter;
            btn.setAttribute("aria-pressed", String(selected));
        });
        const favorites = dialog.querySelector("#pg-mf-favorites");
        if (favorites) favorites.setAttribute("aria-pressed", String(mobileUX.favoritesOnly));
        const recent = dialog.querySelector("#pg-mf-recent");
        if (recent) recent.setAttribute("aria-pressed", String(mobileUX.recentOnly));
        const count = dialog.querySelector("#pg-mf-result-count");
        if (count) count.textContent = `${getFilteredMedia().length} matching items`;
    }
    function mobileSetDataSaver(enabled) {
        const saved = Boolean(enabled);
        mobileStorageWrite("pg_mf_data_saver", saved);
        const lowMemory = Number(navigator.deviceMemory) > 0 && Number(navigator.deviceMemory) <= 2;
        const slowNetwork = /(?:^|[^0-9])(?:slow-2g|2g|3g)/i.test(navigator.connection?.effectiveType || "");
        const batch = saved || (isMobileProfile && (lowMemory || slowNetwork)) ? 1 : (isMobileProfile ? 2 : 4);
        config.fetchConcurrency = batch;
        config.scanConcurrency = batch;
        config.zipConcurrency = batch;
        config.maxRetries = saved ? 1 : (isMobileProfile ? 2 : 3);
        const input = document.getElementById("pg-mf-data-saver");
        if (input) input.checked = saved;
        const container = document.getElementById("pg-container");
        container?.classList.toggle("pg-mf-data-saver", saved);
        if (saved) stopActivePreviewVideo();
    }
    function mobileUpdateDock() {
        const dock = document.getElementById("pg-mf-nav");
        if (!dock) return;
        const selected = state.selectedMediaIds.size;
        const summary = dock.querySelector("#pg-mf-selected");
        if (summary) summary.textContent = selected > 999 ? "999+" : String(selected);
        dock.querySelector("[data-mf='select']")?.setAttribute("aria-pressed", String(state.selectionMode));
        const status = dock.querySelector("#pg-mf-download-status");
        if (status) status.textContent = state.zipRunning ? (state.zipPaused ? "Paused" : "Running") : "";
        const dl = dock.querySelector("[data-mf='downloads']");
        if (dl) dl.setAttribute("aria-label", state.zipRunning ? "Download progress and controls" : "Downloads and recovery");
    }
    function mobileShowDownloads() {
        const dlg = document.getElementById("pg-mf-downloads");
        if (!dlg) return;
        if (mobileUX.searchOpen) mobileCloseSearch();
        mobileRenderDownloads();
        dlg.hidden = false;
        dlg.classList.add("visible");
        dlg.setAttribute("aria-hidden", "false");
        dlg.querySelector("button")?.focus?.();
    }
    function mobileHideDownloads() {
        const dlg = document.getElementById("pg-mf-downloads");
        if (!dlg) return;
        dlg.hidden = true;
        dlg.classList.remove("visible");
        dlg.setAttribute("aria-hidden", "true");
    }
    function mobileLoadCheckpoint() {
        const record = mobileStorageRead(mobileThreadKey("pending-zip"));
        if (!record || record.version !== 1 || record.thread !== getThreadCacheId()) return null;
        const ttlDays = mobileStorageRead("pg_mf_retention_days", 7);
        const ttl = [1, 7, 30].includes(ttlDays) ? ttlDays : 7;
        if (!Number.isFinite(record.createdAt) || Date.now() - record.createdAt > ttl * 86400000 || record.createdAt > Date.now() + 60000) return null;
        for (const key of ["sourceIds", "deliveredIds", "parts"]) {
            if (!Array.isArray(record[key]) || record[key].length > 5000) return null;
        }
        if (!record.sourceIds.every(id => typeof id === "string" && id.length <= 512)) return null;
        if (!record.deliveredIds.every(id => typeof id === "string" && id.length <= 512)) return null;
        if (!record.parts.every(p => p && typeof p === "object" && typeof p.fileName === "string" && p.fileName.length <= 512 && Number.isFinite(p.size) && p.size >= 0 &&
            (!p.itemIds || (Array.isArray(p.itemIds) && p.itemIds.length <= 5000 && p.itemIds.every(id => typeof id === "string" && id.length <= 512))))) return null;
        if (!Array.isArray(record.confirmedIds)) record.confirmedIds = [];
        if (!record.confirmedIds.every(id => typeof id === "string" && id.length <= 512)) return null;
        if (!record.results || typeof record.results !== "object" || Array.isArray(record.results)) record.results = {};
        if (Object.keys(record.results).length > 5000) return null;
        for (const [id, value] of Object.entries(record.results)) {
            if (id.length > 512 || !value || typeof value !== "object" ||
                !["archived", "failed", "download-triggered"].includes(value.status) ||
                !Number.isFinite(value.bytes) || value.bytes < 0) return null;
        }
        return record;
    }
    function mobileDownloadCheckpoint(items) {
        if (mobileUX.currentJob?.parts?.length) {
            const history = mobileStorageRead(mobileThreadKey("zip-history"), []);
            const entries = Array.isArray(history) ? history.slice(0, 4) : [];
            entries.unshift(mobileUX.currentJob);
            mobileStorageWrite(mobileThreadKey("zip-history"), entries);
        }
        const record = {
            version: 1, thread: getThreadCacheId(), createdAt: Date.now(), status: "running",
            sourceIds: items.map(item => item.id).filter(Boolean).slice(0, 5000),
            deliveredIds: [], confirmedIds: [], results: {}, parts: [],
        };
        mobileUX.currentJob = record;
        mobileUX.sourceIdSet = new Set(record.sourceIds);
        mobileUX.resultCount = 0;
        mobileUX.livePartLinks.clear();
        mobileStorageWrite(mobileThreadKey("pending-zip"), record);
    }
    function mobileSaveDeliveredPart(entries, fileName, size, objectUrl = null) {
        const job = mobileUX.currentJob;
        if (!job) return;
        if (typeof objectUrl === "string" && objectUrl.startsWith("blob:")) {
            mobileUX.livePartLinks.set(fileName, objectUrl);
            setTimeout(() => { if (mobileUX.livePartLinks.get(fileName) === objectUrl) {
                mobileUX.livePartLinks.delete(fileName); mobileRenderDownloads();
            } }, 9 * 60 * 1000);
        }
        job.parts.push({ fileName, size, itemIds: entries.map(e => e.item?.id).filter(Boolean),
            savedAt: Date.now(), state: "download-triggered" });
        // Only consider complete parts delivered, never in-progress or unfinished ZIP writes.
        const ids = new Set(job.deliveredIds);
        entries.forEach(entry => { if (entry.item?.id) ids.add(entry.item.id); });
        job.deliveredIds = [...ids];
        entries.forEach(entry => { if (entry.item?.id) mobileRecordItemResult(entry.item, "download-triggered", entry.size || 0); });
        mobileStorageWrite(mobileThreadKey("pending-zip"), job);
        mobileRenderDownloads();
    }
    function mobileRecordItemResult(item, status, bytes = 0) {
        const job = mobileUX.currentJob;
        if (!job || !item?.id || !mobileUX.sourceIdSet.has(item.id)) return;
        if (!job.results || typeof job.results !== "object") job.results = Object.create(null);
        // Defend against untrusted IDs such as "__proto__" without mutating object prototypes.
        if (item.id === "__proto__" || item.id === "prototype" || item.id === "constructor") return;
        const isNew = !Object.prototype.hasOwnProperty.call(job.results, item.id);
        job.results[item.id] = { status, bytes: Math.max(0, Number(bytes) || 0) };
        if (isNew) mobileUX.resultCount += 1;
        // Bounded writes and O(1) membership/count for large galleries.
        // Finalized ZIP parts are always checkpointed immediately.
        if (status === "failed" || (isNew && mobileUX.resultCount % 20 === 0))
            mobileStorageWrite(mobileThreadKey("pending-zip"), job);
    }
    function mobileConfirmPartSaved(partIndex) {
        const job = mobileUX.currentJob || mobileLoadCheckpoint();
        const index = Number(partIndex);
        if (!job || !Number.isInteger(index) || index < 0 || index >= job.parts.length) return;
        const part = job.parts[index];
        if (part.state === "user-confirmed") return;
        if (!confirm(`Confirm that ${part.fileName} is visible in your device Downloads?`)) return;
        part.state = "user-confirmed";
        const ids = new Set(job.confirmedIds || []);
        (part.itemIds || []).forEach(id => ids.add(id));
        job.confirmedIds = [...ids];
        mobileUX.currentJob = job;
        mobileStorageWrite(mobileThreadKey("pending-zip"), job);
        mobileRenderDownloads();
    }
    function mobileSaveSelection() {
        const ids = [...state.selectedMediaIds].slice(0, 5000);
        if (!mobileStorageWrite(mobileThreadKey("selection"), ids)) {
            showToast("mf-selection", "Unable to save selection: browser storage unavailable.", { level: "warn" });
        } else showToast("mf-selection", `Saved ${ids.length} selected media for this thread.`, { level: "ok" });
    }
    function mobileRestoreSelection() {
        const ids = mobileStorageRead(mobileThreadKey("selection"), []);
        if (!Array.isArray(ids) || ids.length > 5000) return;
        const available = ids.filter(id => typeof id === "string" && state.mediaById.has(id));
        state.selectedMediaIds = new Set(available);
        state.autoSelectNewMedia = false;
        setSelectionMode(available.length > 0);
        commitBulkSelection();
        showToast("mf-selection", `Restored ${available.length} selected items. Rescan for missing media.`, { level: "info" });
    }
    function mobileScanWithScope(mode) {
        const info = getThreadInfo();
        if (!info) { addMediaItems(scanMedia(document, 1)); renderGrid(); return; }
        const pages = discoverThreadPageUrls(document, info);
        const estimate = mode === "recent" ? Math.min(5, pages.length) : pages.length;
        if (estimate > 40 && !confirm(`Scan up to ${estimate} thread pages? Mobile data and time may be significant.`)) return;
        mobileHideDownloads();
        void scanAllThreadPages(mode);
    }
    function mobileFinishDownload(status) {
        if (!mobileUX.currentJob) return;
        mobileUX.currentJob.status = status;
        mobileStorageWrite(mobileThreadKey("pending-zip"), mobileUX.currentJob);
        mobileRenderDownloads();
    }
    function mobileRenderDownloads() {
        const root = document.getElementById("pg-mf-downloads");
        if (!root) return;
        const job = mobileUX.currentJob || mobileLoadCheckpoint();
        const info = root.querySelector("#pg-mf-job-text");
        const action = root.querySelector("#pg-mf-resume");
        const parts = root.querySelector("#pg-mf-parts");
        const summary = state.zipJobSummary;
        const statuses = Object.values(job?.results || {});
        const errors = statuses.filter(item => item?.status === "failed").length;
        if (info) info.textContent = state.zipRunning
            ? `${state.zipPaused ? "Paused" : "Running"}: ${summary?.completed || 0}/${summary?.total || 0} processed · ${formatBytes(summary?.archivedBytes || 0)} archived · ${errors} failed`
            : job ? `${job.status}: ${job.deliveredIds?.length || 0}/${job.sourceIds?.length || 0} items in completed ZIP parts · ${errors} failed. Download-triggered does not confirm a saved file.`
                  : "No saved download checkpoint.";
        if (parts) {
            parts.replaceChildren();
            (job?.parts || []).slice(-12).forEach((part, offset) => {
                const row = document.createElement("div");
                row.textContent = `${part.fileName} · ${formatBytes(part.size)} · ${part.state === "user-confirmed" ? "user confirmed saved" : "save not verified"}`;
                if (part.state !== "user-confirmed") {
                    const confirmButton = document.createElement("button");
                    confirmButton.type = "button";
                    confirmButton.dataset.mfConfirm = String(Math.max(0, job.parts.length - 12) + offset);
                    confirmButton.textContent = "Mark saved";
                    row.appendChild(confirmButton);
                }
                const liveUrl = mobileUX.livePartLinks.get(part.fileName);
                if (liveUrl) {
                    const link = document.createElement("a");
                    link.href = liveUrl; link.download = part.fileName;
                    link.textContent = "Download part";
                    link.setAttribute("aria-label", `Download ${part.fileName} again`);
                    row.appendChild(link);
                }
                parts.appendChild(row);
            });
            const history = mobileStorageRead(mobileThreadKey("zip-history"), []);
            if (Array.isArray(history)) history.filter(old => old && typeof old === "object").slice(0, 4).forEach(old => {
                const row = document.createElement("div");
                row.textContent = `Earlier ${old.status || "interrupted"}: ${old.parts?.length || 0} part save attempts`;
                parts.appendChild(row);
            });
        }
        if (action) {
            const confirmed = new Set(job?.confirmedIds || []);
            const remaining = job?.sourceIds?.filter(id => !confirmed.has(id)) || [];
            action.hidden = state.zipRunning || remaining.length === 0;
            action.textContent = `Retry unconfirmed (${remaining.length})`;
        }
        root.querySelector("#pg-mf-retry-all")?.toggleAttribute("hidden", state.zipRunning || !job?.sourceIds?.length);
        const clear = root.querySelector("#pg-mf-clear-history");
        if (clear) clear.disabled = state.zipRunning;
        root.querySelector("#pg-mf-pause")?.toggleAttribute("hidden", !state.zipRunning);
        root.querySelector("#pg-mf-cancel")?.toggleAttribute("hidden", !state.zipRunning);
        const pause = root.querySelector("#pg-mf-pause");
        if (pause) pause.textContent = state.zipPaused ? "Resume current ZIP" : "Pause current ZIP";
    }
    async function mobileRetryRemaining(retryAll = false) {
        if (state.zipRunning) return;
        const job = mobileUX.currentJob || mobileLoadCheckpoint();
        if (!job || job.thread !== getThreadCacheId()) return;
        await loadThreadMetadataCache();
        const completed = new Set(job.confirmedIds || []);
        const missingIds = job.sourceIds.filter(id => retryAll || !completed.has(id));
        const items = missingIds.map(id => state.mediaById.get(id)).filter(Boolean);
        if (!items.length) {
            showToast("mf-resume", "Items unavailable. Scan the thread again before retrying.", { level: "warn", timeout: 4500 });
            return;
        }
        mobileHideDownloads();
        // A new ZIP run is intentionally created. We cannot resume an unclosed ZIP writer
        // or prove that an earlier automatic browser download was saved by the OS.
        state.lastZipItems = items;
        state.debugRunId += 1;
        void runZipDownloadInBackground(items, state.debugRunId);
    }
    function mobileClearHistory() {
        if (state.zipRunning) { showToast("mf-privacy", "Cancel the active ZIP before clearing its recovery checkpoint.", { level: "warn" }); return; }
        mobileUX.recent.clear();
        mobileUX.favorites.clear();
        mobileUX.currentJob = null;
        mobileUX.sourceIdSet.clear();
        mobileUX.resultCount = 0;
        mobileUX.livePartLinks.clear();
        mobileUX.preparedShare = null;
        for (const key of ["favorites", "pending-zip", "zip-history", "selection"]) {
            try { localStorage.removeItem(mobileThreadKey(key)); } catch {}
        }
        mobileUX.favoritesOnly = false;
        mobileUX.recentOnly = false;
        mobileRefreshFavoritesView();
        mobileRenderDownloads();
    }
    async function mobileShareCurrent() {
        const item = state.filteredMedia[state.currentIndex];
        if (!item) return;
        const url = item.src;
        if (typeof navigator.share === "function") {
            try { await navigator.share({ title: "LPSG media", url }); return; }
            catch (error) { if (error?.name === "AbortError") return; }
        }
        showToast("mf-share", "Native sharing unavailable. Use Open media or Download.", { level: "warn", timeout: 4000 });
    }
    async function mobileFetchBoundedShareBlob(item, maxBytes) {
        // Independent, bounded read: never use an unbounded response.blob() for sharing.
        // Site-authenticated requests follow the existing download origin policy.
        for (const sourceUrl of getDownloadSources(item).slice(0, 8)) {
            const abort = new AbortController();
            const timeout = setTimeout(() => abort.abort(), Math.min(config.zipItemTimeoutMs, 60000));
            try {
                const response = await fetch(sourceUrl, {
                    credentials: "include", cache: "no-store",
                    referrer: item.postUrl || window.location.href,
                    signal: abort.signal,
                    headers: { Accept: item.type === "video" ? "video/*,*/*;q=0.8" : "image/*,*/*;q=0.8" },
                });
                if (!response.ok || !response.body?.getReader) continue;
                const length = Number(response.headers.get("content-length")) || 0;
                if (length > maxBytes) throw new Error("Share file too large");
                const reader = response.body.getReader();
                const chunks = [];
                let bytes = 0;
                try {
                    while (true) {
                        const next = await reader.read();
                        if (next.done) break;
                        bytes += next.value.byteLength;
                        if (bytes > maxBytes) throw new Error("Share file too large");
                        chunks.push(next.value);
                    }
                } catch (error) { await reader.cancel().catch(() => {}); throw error; }
                if (!bytes) throw new Error("Empty media file");
                return new Blob(chunks, { type: response.headers.get("content-type") || "application/octet-stream" });
            } catch (error) {
                if (String(error?.message || "").includes("too large")) throw error;
                // Try the next source without persisting or exposing the private URL.
            } finally { clearTimeout(timeout); abort.abort(); }
        }
        throw new Error("No shareable media source");
    }
    async function mobileShareFileCurrent() {
        const item = state.filteredMedia[state.currentIndex];
        if (!item) return;
        if (typeof navigator.share !== "function" || typeof File !== "function") {
            showToast("mf-share-file", "File sharing is unavailable here. Use Share link or Download.", { level: "warn" });
            return;
        }
        if (mobileUX.preparedShare?.id === item.id) {
            const file = mobileUX.preparedShare.file;
            if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
                try { await navigator.share({ title: "LPSG media", files: [file] }); }
                catch (error) { if (error?.name !== "AbortError") showToast("mf-share-file", "Native file sharing was declined. Use Download.", { level: "warn" }); }
            } else showToast("mf-share-file", "Browser cannot share this file. Use Download.", { level: "warn" });
            return;
        }
        const maxBytes = 24 * 1024 * 1024;
        if (Number(item.size) > maxBytes) {
            showToast("mf-share-file", "File is over 24 MiB; use Download instead.", { level: "warn" });
            return;
        }
        showToast("mf-share-file", "Preparing file locally. Tap Share file again when ready.", { level: "info", timeout: 4500 });
        try {
            const blob = await mobileFetchBoundedShareBlob(item, maxBytes);
            const current = state.filteredMedia[state.currentIndex];
            if (current?.id !== item.id) return;
            if (blob.size > maxBytes) {
                showToast("mf-share-file", "File exceeds the safe mobile share budget; use Download.", { level: "warn" });
                return;
            }
            const file = new File([blob], buildFileName(item, state.currentIndex), {
                type: blob.type || "application/octet-stream",
            });
            if (typeof navigator.canShare !== "function" || !navigator.canShare({ files: [file] })) {
                showToast("mf-share-file", "Native file sharing unsupported for this file. Use Download.", { level: "warn" });
                return;
            }
            mobileUX.preparedShare = { id: item.id, file };
            showToast("mf-share-file", "File ready. Tap Share file again to open the Android share sheet.", { level: "ok", timeout: 5000 });
        } catch {
            showToast("mf-share-file", "Could not prepare file. Use Share link or Download.", { level: "warn" });
        }
    }
    function refreshMobileLightboxActions() {
        const item = state.filteredMedia[state.currentIndex];
        const fav = document.getElementById("pg-mf-favorite-action");
        const shareFile = document.getElementById("pg-mf-share-file-action");
        if (shareFile) shareFile.textContent = mobileUX.preparedShare?.id === item?.id ? "Share file" : "Prepare file";
        if (fav) {
            fav.textContent = item?.id && mobileUX.favorites.has(item.id) ? "★ Favorite" : "☆ Favorite";
            fav.setAttribute("aria-pressed", String(Boolean(item?.id && mobileUX.favorites.has(item.id))));
        }
    }
    function mobileInstallLightboxActions(container) {
        const controls = container.querySelector("#pg-lightbox .pg-lb-controls");
        if (!controls || controls.querySelector("#pg-mf-favorite-action")) return;
        const fav = document.createElement("button");
        fav.type = "button";
        fav.id = "pg-mf-favorite-action";
        fav.className = "pg-ctrl-btn";
        fav.textContent = "☆ Favorite";
        fav.setAttribute("aria-label", "Toggle favorite media");
        fav.onclick = () => mobileToggleFavorite(state.filteredMedia[state.currentIndex]);
        const share = document.createElement("button");
        share.type = "button";
        share.id = "pg-mf-share-action";
        share.className = "pg-ctrl-btn";
        share.textContent = "Share link";
        share.onclick = () => { void mobileShareCurrent(); };
        const shareFile = document.createElement("button");
        shareFile.type = "button";
        shareFile.id = "pg-mf-share-file-action";
        shareFile.className = "pg-ctrl-btn";
        shareFile.textContent = "Prepare file";
        shareFile.setAttribute("aria-label", "Prepare or share current media file");
        shareFile.onclick = () => { void mobileShareFileCurrent(); };
        controls.append(fav, share, shareFile);
    }
    function installMobileUX() {
        const container = document.getElementById("pg-container");
        if (!container || container.querySelector("#pg-mf-nav")) return;
        mobileLoadCollections();
        const dock = document.createElement("nav");
        dock.id = "pg-mf-nav";
        dock.className = "pg-mf-nav";
        dock.setAttribute("aria-label", "Mobile gallery navigation");
        dock.innerHTML = `
            <button type="button" data-mf="gallery" aria-label="Gallery">▦<span>Gallery</span></button>
            <button type="button" data-mf="search" aria-label="Search and filters">⌕<span>Search</span></button>
            <button type="button" data-mf="select" aria-label="Select media" aria-pressed="false">✓<span>Select <b id="pg-mf-selected">0</b></span></button>
            <button type="button" data-mf="downloads" aria-label="Downloads and recovery">↓<span>Downloads <small id="pg-mf-download-status"></small></span></button>
            <button type="button" data-mf="more" aria-label="More actions">⋯<span>More</span></button>`;
        container.appendChild(dock);
        dock.addEventListener("click", event => {
            const button = event.target.closest("button[data-mf]");
            if (!button) return;
            const command = button.dataset.mf;
            if (command === "gallery") { mobileCloseSearch(); mobileHideDownloads(); setSelectionMode(false); }
            else if (command === "search") mobileOpenSearch();
            else if (command === "select") { setSelectionMode(!state.selectionMode); mobileUpdateDock(); }
            else if (command === "downloads") mobileShowDownloads();
            else if (command === "more") openGalleryMoreSheet();
        });
        const search = document.createElement("section");
        search.id = "pg-mf-search";
        search.className = "pg-mf-sheet";
        search.hidden = true;
        search.setAttribute("role", "dialog");
        search.setAttribute("aria-modal", "true");
        search.setAttribute("aria-hidden", "true");
        search.setAttribute("aria-label", "Mobile media search and filters");
        search.innerHTML = `<div class="pg-mf-sheet-head"><strong>Find media</strong><button type="button" data-mf-close="search" aria-label="Close search">×</button></div>
          <label>Search<input type="search" id="pg-mf-query" placeholder="Post, page, type, URL…" autocomplete="off"></label>
          <div class="pg-mf-chips" aria-label="Media types">
            <button type="button" data-mf-filter="all">All</button><button type="button" data-mf-filter="image">Images</button><button type="button" data-mf-filter="video">Videos</button>
          </div>
          <div class="pg-mf-chips"><button type="button" id="pg-mf-favorites" aria-pressed="false">★ Favorites</button><button type="button" id="pg-mf-recent" aria-pressed="false">Recently viewed</button></div>
          <label>Page<select id="pg-mf-page"><option value="all">All pages</option></select></label>
          <label>Sort<select id="pg-mf-sort"><option value="scan">Scan order</option><option value="page">Page</option><option value="type">Type</option><option value="likes-desc">Most liked</option><option value="likes-asc">Least liked</option><option value="duration-desc">Longest videos</option><option value="duration-asc">Shortest videos</option><option value="selected">Selected first</option></select></label>
          <div class="pg-mf-sheet-foot"><span id="pg-mf-result-count" role="status"></span><button type="button" id="pg-mf-clear-filter">Clear filters</button><button type="button" id="pg-mf-show-results">Show results</button></div>`;
        container.appendChild(search);
        search.addEventListener("click", event => {
            const target = event.target.closest("button");
            if (!target) return;
            if (target.dataset.mfClose === "search" || target.id === "pg-mf-show-results") { mobileCloseSearch(); return; }
            if (target.dataset.mfFilter) {
                state.filter = target.dataset.mfFilter;
                container.querySelectorAll(".pg-filter-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === state.filter));
                state.filteredMediaCache = null; renderGrid(); mobileRefreshSearch(); return;
            }
            if (target.id === "pg-mf-favorites") { mobileUX.favoritesOnly = !mobileUX.favoritesOnly; mobileUX.recentOnly = false; mobileRefreshFavoritesView(); mobileRefreshSearch(); return; }
            if (target.id === "pg-mf-recent") { mobileUX.recentOnly = !mobileUX.recentOnly; mobileUX.favoritesOnly = false; mobileRefreshFavoritesView(); mobileRefreshSearch(); return; }
            if (target.id === "pg-mf-clear-filter") {
                mobileUX.favoritesOnly = false; mobileUX.recentOnly = false;
                state.filter = "all"; state.filteredMediaCache = null;
                state.gallerySearch = "";
                search.querySelector("#pg-mf-query").value = "";
                setPageFilter("all"); setGallerySort("scan");
                container.querySelectorAll(".pg-filter-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === "all"));
                renderGrid(); mobileRefreshSearch();
            }
        });
        search.querySelector("#pg-mf-query").addEventListener("input", event => { setGallerySearch(event.target.value); mobileRefreshSearch(); });
        search.querySelector("#pg-mf-sort").addEventListener("change", event => { setGallerySort(event.target.value); mobileRefreshSearch(); });
        search.querySelector("#pg-mf-page").addEventListener("change", event => { setPageFilter(event.target.value); mobileRefreshSearch(); });
        const downloads = document.createElement("section");
        downloads.id = "pg-mf-downloads";
        downloads.className = "pg-mf-sheet";
        downloads.hidden = true;
        downloads.setAttribute("role", "dialog");
        downloads.setAttribute("aria-modal", "true");
        downloads.setAttribute("aria-hidden", "true");
        downloads.setAttribute("aria-label", "Downloads and recovery");
        downloads.innerHTML = `<div class="pg-mf-sheet-head"><strong>Downloads</strong><button type="button" id="pg-mf-downloads-close" aria-label="Close downloads">×</button></div>
          <p id="pg-mf-job-text" role="status">No download started</p>
          <div id="pg-mf-parts" aria-label="Completed ZIP part save attempts"></div>
          <div class="pg-mf-sheet-foot"><button type="button" id="pg-mf-pause">Pause</button><button type="button" id="pg-mf-cancel">Cancel</button><button type="button" id="pg-mf-resume">Retry remaining</button><button type="button" id="pg-mf-retry-all">Retry all</button></div>
          <label><input type="checkbox" id="pg-mf-data-saver"> Data saver (sequential downloads and scans)</label>
          <p>Downloads run only while the browser keeps this page alive. A browser download being triggered is not confirmation it was saved.</p>
          <div class="pg-mf-sheet-foot"><button type="button" id="pg-mf-scan-current">Scan current page</button><button type="button" id="pg-mf-scan-recent">Last 5 pages</button><button type="button" id="pg-mf-scan-new">Uncached pages</button><button type="button" id="pg-mf-scan-all">All pages</button></div>
          <div class="pg-mf-sheet-foot"><button type="button" id="pg-mf-save-selection">Save selection</button><button type="button" id="pg-mf-restore-selection">Restore selection</button></div>
          <label><input type="checkbox" id="pg-mf-session-favorites"> Keep favorites only this session</label>
          <label>Recovery checkpoint retention<select id="pg-mf-retention"><option value="1">1 day</option><option value="7">7 days</option><option value="30">30 days</option></select></label>
          <button type="button" id="pg-mf-clear-history">Clear favorites, selections, and recovery history for this thread</button>`;
        container.appendChild(downloads);
        downloads.addEventListener("click", event => {
            const clicked = event.target.closest("button");
            if (clicked?.dataset.mfConfirm !== undefined) { mobileConfirmPartSaved(clicked.dataset.mfConfirm); return; }
            const id = clicked?.id;
            if (id === "pg-mf-downloads-close") mobileHideDownloads();
            if (id === "pg-mf-pause") toggleZipPause();
            if (id === "pg-mf-cancel") cancelZipDownload();
            if (id === "pg-mf-resume") void mobileRetryRemaining();
            if (id === "pg-mf-save-selection") mobileSaveSelection();
            if (id === "pg-mf-restore-selection") mobileRestoreSelection();
            if (id === "pg-mf-retry-all") void mobileRetryRemaining(true);
            if (id === "pg-mf-clear-history") {
                if (confirm("Clear thread favorites and saved recovery checkpoints?")) mobileClearHistory();
            }
            if (id === "pg-mf-scan-current") { addMediaItems(scanMedia(document, getThreadInfo()?.currentPage || 1)); renderGrid(); mobileHideDownloads(); }
            if (["pg-mf-scan-recent", "pg-mf-scan-new", "pg-mf-scan-all"].includes(id)) {
                const mode = id === "pg-mf-scan-recent" ? "recent" : id === "pg-mf-scan-new" ? "uncached" : "all";
                mobileScanWithScope(mode);
            }
        });
        downloads.querySelector("#pg-mf-data-saver").addEventListener("change", event => mobileSetDataSaver(event.target.checked));
        const sessionFavorites = downloads.querySelector("#pg-mf-session-favorites");
        sessionFavorites.checked = Boolean(mobileStorageRead("pg_mf_session_favorites", false));
        sessionFavorites.addEventListener("change", event => {
            mobileStorageWrite("pg_mf_session_favorites", Boolean(event.target.checked));
            if (event.target.checked) { try { localStorage.removeItem(mobileThreadKey("favorites")); } catch {} }
        });
        const retention = downloads.querySelector("#pg-mf-retention");
        retention.value = String(mobileStorageRead("pg_mf_retention_days", 7));
        retention.addEventListener("change", event => mobileStorageWrite("pg_mf_retention_days", Number(event.target.value)));
        mobileInstallLightboxActions(container);
        mobileInstallKeyboardAndLifecycle(container);
        mobileSetDataSaver(Boolean(mobileStorageRead("pg_mf_data_saver", navigator.connection?.saveData || false)));
        mobileUX.currentJob = mobileLoadCheckpoint();
        mobileUX.sourceIdSet = new Set(mobileUX.currentJob?.sourceIds || []);
        mobileUX.resultCount = Object.keys(mobileUX.currentJob?.results || {}).length;
        if (mobileUX.currentJob?.status === "running" && !state.zipRunning) {
            mobileUX.currentJob.status = "interrupted";
            mobileStorageWrite(mobileThreadKey("pending-zip"), mobileUX.currentJob);
        }
        mobileUpdateDock();
        // Updates stay bounded: observe only the existing progress text, never the dock itself.
        const progressText = container.querySelector("#pg-progress-text");
        if (progressText) new MutationObserver(() => { mobileUpdateDock(); mobileRenderDownloads(); })
            .observe(progressText, { childList: true, characterData: true, subtree: true });
    }

    const mobileZoom = { scale: 1, x: 0, y: 0, distance: 0, startScale: 1, startX: 0, startY: 0, panning: false };
    function mobileResetZoom() {
        mobileZoom.scale = 1; mobileZoom.x = 0; mobileZoom.y = 0;
        mobileZoom.distance = 0; mobileZoom.panning = false;
        const img = document.querySelector("#pg-lb-stage img.pg-lb-media");
        if (img) { img.style.transform = ""; img.style.transformOrigin = ""; img.classList.remove("pg-zoomed"); }
        state.lightboxZoomed = false;
    }
    function mobileRenderZoom() {
        const img = document.querySelector("#pg-lb-stage img.pg-lb-media");
        if (!img) return;
        // Limit panning to the enlarged image, not arbitrary off-screen space.
        const boundX = Math.max(0, (img.clientWidth * mobileZoom.scale - img.clientWidth) / 2);
        const boundY = Math.max(0, (img.clientHeight * mobileZoom.scale - img.clientHeight) / 2);
        mobileZoom.x = Math.max(-boundX, Math.min(boundX, mobileZoom.x));
        mobileZoom.y = Math.max(-boundY, Math.min(boundY, mobileZoom.y));
        img.style.transform = `translate3d(${mobileZoom.x}px, ${mobileZoom.y}px, 0) scale(${mobileZoom.scale})`;
        img.style.transformOrigin = "center center";
        img.classList.toggle("pg-zoomed", mobileZoom.scale > 1.05);
        state.lightboxZoomed = mobileZoom.scale > 1.05;
    }
    function mobileInstallZoom(container) {
        const stage = container.querySelector("#pg-lb-stage");
        if (!stage || stage.dataset.pgMfZoom) return;
        stage.dataset.pgMfZoom = "1";
        const distance = touches => touches.length < 2 ? 0 : Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY,
        );
        stage.addEventListener("touchstart", event => {
            if (!event.target.closest("img.pg-lb-media")) return;
            if (event.touches.length > 1) {
                mobileZoom.distance = distance(event.touches);
                mobileZoom.startScale = mobileZoom.scale;
                mobileZoom.panning = false;
            } else if (mobileZoom.scale > 1.05) {
                mobileZoom.panning = true;
                mobileZoom.startX = event.touches[0].clientX;
                mobileZoom.startY = event.touches[0].clientY;
            }
        }, { passive: true, capture: true });
        stage.addEventListener("touchmove", event => {
            if (event.target.closest("video")) return;
            if (event.touches.length > 1 && mobileZoom.distance > 0) {
                const d = distance(event.touches);
                mobileZoom.scale = Math.max(1, Math.min(4, mobileZoom.startScale * d / mobileZoom.distance));
                if (mobileZoom.scale <= 1.02) { mobileZoom.scale = 1; mobileZoom.x = 0; mobileZoom.y = 0; }
                mobileRenderZoom(); event.preventDefault();
            } else if (event.touches.length === 1 && mobileZoom.panning && mobileZoom.scale > 1.05) {
                const finger = event.touches[0];
                mobileZoom.x += finger.clientX - mobileZoom.startX;
                mobileZoom.y += finger.clientY - mobileZoom.startY;
                mobileZoom.startX = finger.clientX; mobileZoom.startY = finger.clientY;
                mobileRenderZoom(); event.preventDefault();
            }
        }, { passive: false, capture: true });
        stage.addEventListener("touchend", event => {
            if (event.touches.length < 2) mobileZoom.distance = 0;
            if (!event.touches.length) mobileZoom.panning = false;
            if (mobileZoom.scale <= 1.05 && mobileZoom.scale !== 1) mobileResetZoom();
        }, { passive: true, capture: true });
    }
    function mobileInstallSwipeSelection(container) {
        const grid = container.querySelector("#pg-grid");
        if (!grid || grid.dataset.pgMfSwipe) return;
        grid.dataset.pgMfSwipe = "1";
        let pointer = null;
        grid.addEventListener("click", event => {
            if (performance.now() < mobileUX.suppressGridClickUntil) {
                event.preventDefault(); event.stopImmediatePropagation();
                mobileUX.suppressGridClickUntil = 0;
            }
        }, true);
        grid.addEventListener("pointerdown", event => {
            if (event.pointerType !== "touch") return;
            if (!event.target.closest(".pg-item")) return;
            pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false, seen: new Set() };
        }, { capture: true, passive: true });
        grid.addEventListener("pointermove", event => {
            if (!pointer || event.pointerId !== pointer.id) return;
            const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
            if (Math.hypot(dx, dy) > 10 && state.cardLongPressTimer) {
                clearTimeout(state.cardLongPressTimer);
                state.cardLongPressTimer = null;
            }
            if (!state.selectionMode || Math.abs(dy) > Math.abs(dx) * 1.2) return;
            if (!pointer.horizontal && Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 1.4) pointer.horizontal = true;
            if (!pointer.horizontal) return;
            mobileUX.suppressGridClickUntil = performance.now() + 650;
            event.preventDefault();
            const card = document.elementFromPoint(event.clientX, event.clientY)?.closest(".pg-item[data-media-id]");
            const item = card && getMediaFromCard(card);
            if (!item || pointer.seen.has(item.id)) return;
            pointer.seen.add(item.id);
            const box = card.querySelector(".pg-select-wrap input");
            if (box) box.checked = true;
            card.classList.add("pg-selected");
            toggleMediaSelected(item, true);
        }, { capture: true, passive: false });
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(name => grid.addEventListener(name, () => { pointer = null; }, { passive: true }));
    }
    function mobileInstallKeyboardAndLifecycle(container) {
        container.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                if (mobileUX.searchOpen) { event.preventDefault(); event.stopPropagation(); mobileCloseSearch(); }
                else if (!document.getElementById("pg-mf-downloads")?.hidden) { event.preventDefault(); event.stopPropagation(); mobileHideDownloads(); }
            }
            if (event.key !== "Tab") return;
            const modal = mobileUX.searchOpen ? document.getElementById("pg-mf-search") :
                (!document.getElementById("pg-mf-downloads")?.hidden ? document.getElementById("pg-mf-downloads") : null);
            if (!modal) return;
            const nodes = [...modal.querySelectorAll("button:not([hidden]),input:not([hidden]),select:not([hidden])")].filter(el => el.offsetParent !== null);
            if (!nodes.length) return;
            if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1].focus(); }
            else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0].focus(); }
        }, true);
        mobileInstallSwipeSelection(container);
        mobileInstallZoom(container);
    }
