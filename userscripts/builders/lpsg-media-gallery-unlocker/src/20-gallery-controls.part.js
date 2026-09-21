    function cancelScan() {
        if (state.scanAbortController) {
            state.scanAbortController.abort();
        }
    }

    function setActionButtonsDisabled(disabled) {
        document.querySelectorAll("#pg-scan-all, #pg-download-zip, #pg-more-scan-all, #pg-more-download-zip").forEach(button => {
            button.disabled = disabled;
        });
        updateMobileUiState();
    }

    function setCancelButtonVisible(visible) {
        document.querySelectorAll("#pg-cancel-scan, #pg-more-cancel-scan").forEach(button => {
            button.style.display = visible ? "" : "none";
        });
        updateMobileUiState();
    }

    const retryQueue = [];
    let isRetrying = false;

    function queueRetry(imgElement, fullSrc, attemptNum) {
        retryQueue.push({ img: imgElement, src: fullSrc, attempt: attemptNum });

        if (!isRetrying) {
            processRetryQueue();
        }
    }

    function processRetryQueue() {
        if (retryQueue.length === 0) {
            isRetrying = false;
            return;
        }

        isRetrying = true;

        const item = retryQueue.shift();
        const dynamicDelay = config.retryDelay * item.attempt;

        setTimeout(() => {
            const separator = item.src.includes("?") ? "&" : "?";
            const timestamp = Date.now();

            item.img.src = `${item.src}${separator}retry=${timestamp}`;
            processRetryQueue();
        }, dynamicDelay);
    }

    function setStatusOverlay(cardElement, type, text) {
        let overlay = cardElement.querySelector(".pg-status-overlay");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "pg-status-overlay";
            cardElement.appendChild(overlay);
        }

        if (type === "clear") {
            overlay.remove();
            return;
        }

        const iconHtml = type === "retry"
            ? `<div class="pg-status-icon pg-status-retry">${warnIconSvg}</div>`
            : `<div class="pg-status-icon pg-status-broken">${brokenIconSvg}</div>`;
        const retryButton = type === "broken"
            ? `<button type="button" class="pg-thumb-retry" data-pg-action="retry-thumbnail">Retry thumbnail</button>`
            : "";

        const textClass = type === "broken" ? "pg-status-broken" : "pg-status-retry";

        overlay.innerHTML = `
            ${iconHtml}
            <div class="pg-status-text ${textClass}">${text}</div>
            ${retryButton}
        `;
    }

    let lazyImageObserver;
    let lazyObserverRoot = null;

    function ensureLazyObserver() {
        const root = document.querySelector(".pg-gallery-scroll");
        if (!root) {
            return null;
        }

        if (lazyImageObserver && lazyObserverRoot === root) {
            return lazyImageObserver;
        }

        lazyImageObserver?.disconnect();
        lazyObserverRoot = root;
        lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const img = entry.target;
                const src = img.dataset.src;
                if (src && !img.dataset.loadStarted) {
                    img.dataset.loadStarted = "1";
                    img.src = src;
                }
                observer.unobserve(img);
            });
        }, { root, rootMargin: isMobileLayout() ? "75% 0px" : "520px 0px", threshold: 0.01 });
        return lazyImageObserver;
    }

    function observeLazyImage(img, eager = false) {
        if (!img?.dataset?.src) return;
        if (eager) {
            img.dataset.loadStarted = "1";
            img.loading = "eager";
            img.fetchPriority = "high";
            img.src = img.dataset.src;
            return;
        }
        img.loading = "lazy";
        ensureLazyObserver()?.observe(img);
    }

    function initLazyObserver() {
        const observer = ensureLazyObserver();
        if (!observer) return;
        document.querySelectorAll(".pg-lazy-img:not([data-load-started])").forEach(img => observer.observe(img));
    }


    function makeDebugTimestamp() {
        const now = new Date();
        return now.toISOString().replace("T", " ").replace("Z", "");
    }

    function stringifyDebugValue(value) {
        if (value === undefined || value === null || value === "") {
            return "";
        }

        if (value instanceof Error) {
            return `${value.name || "Error"}: ${value.message || String(value)}`;
        }

        try {
            return typeof value === "string" ? value : JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }

    function getDebugLogText() {
        return state.debugLogs
            .map(entry => {
                const dataText = stringifyDebugValue(entry.data);
                return `[${entry.time}] ${entry.level.toUpperCase()} ${entry.message}${dataText ? `\n${dataText}` : ""}`;
            })
            .join("\n\n");
    }

    function addDebugLog(level, message, data = null) {
        const rank = { summary: 0, verbose: 1, trace: 2 };
        const required = level === "trace" ? 2 : level === "verbose" ? 1 : 0;
        const configured = rank[config.debugLevel] ?? 0;

        if (required > configured) {
            return;
        }

        state.debugLogs.push({
            time: makeDebugTimestamp(),
            level: level === "trace" || level === "verbose" ? "info" : level,
            message,
            data,
        });

        if (state.debugLogs.length > config.debugMaxEntries) {
            state.debugLogs.splice(0, state.debugLogs.length - config.debugMaxEntries);
        }

        if (state.debugPanelOpen) {
            renderDebugPanel();
        }
    }

    function renderDebugPanel() {
        const logBox = document.getElementById("pg-debug-log");
        const summary = document.getElementById("pg-debug-summary");

        if (!logBox || !summary) {
            return;
        }

        const counts = state.debugLogs.reduce((acc, entry) => {
            acc[entry.level] = (acc[entry.level] || 0) + 1;
            return acc;
        }, {});

        summary.textContent = [
            `${state.debugLogs.length} event(s)`,
            `${counts.ok || 0} ok`,
            `${counts.warn || 0} warning(s)`,
            `${counts.error || 0} error(s)`,
        ].join(" · ");

        logBox.innerHTML = "";

        state.debugLogs.slice().reverse().forEach(entry => {
            const row = document.createElement("div");
            const dataText = stringifyDebugValue(entry.data);

            row.className = `pg-debug-entry ${entry.level}`;
            row.textContent = `[${entry.time}] ${entry.level.toUpperCase()} ${entry.message}${dataText ? `\n${dataText}` : ""}`;
            logBox.appendChild(row);
        });
    }

    function setDebugPanelVisible(visible) {
        state.debugPanelOpen = visible;

        const panel = document.getElementById("pg-debug-panel");

        if (panel) {
            panel.classList.toggle("visible", visible);
        }

        const container = document.getElementById("pg-container");

        if (!visible && container?.classList.contains("pg-debug-only")) {
            container.remove();
            state.container = null;
            state.lightbox = null;
        }

        renderDebugPanel();
    }

    function toggleDebugPanel() {
        setDebugPanelVisible(!state.debugPanelOpen);
    }

    function clearDebugLogs() {
        state.debugLogs = [];
        renderDebugPanel();
    }

    async function copyDebugLog() {
        const text = getDebugLogText();

        try {
            await navigator.clipboard.writeText(text);
            addDebugLog("ok", "Debug log copied to clipboard.");
        } catch (error) {
            addDebugLog("error", "Failed to copy debug log.", error);
            alert("Could not copy debug log. Use Export instead.");
        }
    }

    function exportDebugLog() {
        const blob = new Blob([getDebugLogText()], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `lpsg_gallery_debug_${Date.now()}.txt`;
        link.click();

        URL.revokeObjectURL(url);
    }

    function buildGalleryUI() {
        if (document.getElementById("pg-container")) {
            return;
        }

        const container = document.createElement("div");
        container.id = "pg-container";
        refreshDeviceProfile();
        container.classList.toggle("pg-mobile-profile", isMobileProfile);
        container.classList.toggle("pg-coarse-pointer", isCoarsePointer);
        container.dataset.deviceProfile = isMobileProfile ? "mobile" : "desktop";

        container.innerHTML = `
            <div class="pg-header">
                <div class="pg-header-main">
                    <div class="pg-title-wrap">
                        <div class="pg-title">Media Gallery</div>
                        <div class="pg-desktop-subtitle" id="pg-desktop-status">Use search, sorting, quick actions, and keyboard shortcuts.</div>
                        <div class="pg-mobile-subtitle" id="pg-mobile-status">Tap to open. Long-press to select.</div>
                    </div>
                    <div class="pg-filter-segment" role="tablist" aria-label="Media filter">
                        <button class="pg-filter-btn active" data-filter="all">All (<span id="pg-count-all">0</span>)</button>
                        <button class="pg-filter-btn" data-filter="image">Images (<span id="pg-count-image">0</span>)</button>
                        <button class="pg-filter-btn" data-filter="video">Videos (<span id="pg-count-video">0</span>)</button>
                    </div>
                    <button class="pg-action-btn pg-mobile-more" id="pg-gallery-more" type="button" aria-haspopup="dialog">More</button>
                    <button class="pg-close" aria-label="Close gallery">✖</button>
                </div>
                <div class="pg-filters pg-desktop-actions">
                    <button class="pg-action-btn" id="pg-scan-all">Scan all</button>
                    <button class="pg-action-btn" id="pg-cancel-scan" style="display:none;">Stop scan</button>
                    <button class="pg-action-btn" id="pg-export-urls">URLs</button>
                    <button class="pg-action-btn pg-primary-action" id="pg-download-zip">ZIP selected</button>
                    <button class="pg-action-btn" id="pg-zip-pause" style="display:none;">Pause</button>
                    <button class="pg-action-btn" id="pg-zip-cancel" style="display:none;">Cancel ZIP</button>
                    <button class="pg-action-btn" id="pg-desktop-more">More</button>
                    <button class="pg-action-btn" id="pg-shortcuts-help">Shortcuts</button>
                    <button class="pg-action-btn" id="pg-debug-toggle">Debug</button>
                    <span class="pg-cache-pill" id="pg-cache-size">Cache: …</span>
                </div>
            </div>

            <div class="pg-selection-bar">
                <span class="pg-selection-count" id="pg-selection-count">0 selected</span>
                <label class="pg-search-control">Search
                    <input type="search" id="pg-gallery-search" placeholder="page, type, URL…" autocomplete="off">
                </label>
                <label class="pg-size-control">Page
                    <select id="pg-page-filter"><option value="all">All pages</option></select>
                </label>
                <label class="pg-cache-pill"><input type="checkbox" id="pg-selected-only"> Selected only</label>
                <label class="pg-cache-pill"><input type="checkbox" id="pg-group-by-page"> Group by page</label>
                <label class="pg-size-control">Sort
                    <select id="pg-sort-order">
                        <option value="scan">Scan order</option>
                        <option value="page">Page</option>
                        <option value="type">Type</option>
                        <option value="likes-desc">Most liked posts</option>
                        <option value="likes-asc">Least liked posts</option>
                        <option value="duration-desc">Longest videos</option>
                        <option value="duration-asc">Shortest videos</option>
                        <option value="selected">Selected first</option>
                    </select>
                </label>
                <button class="pg-select-btn" id="pg-toggle-chrome" type="button">Focus gallery</button>
                <button class="pg-select-btn" id="pg-toggle-details" type="button">Hide details</button>
                <button class="pg-select-btn" id="pg-select-all" type="button">Select all</button>
                <button class="pg-select-btn" id="pg-select-none" type="button">None</button>
                <button class="pg-select-btn" id="pg-select-visible" type="button">Select visible</button>
                <button class="pg-select-btn" id="pg-deselect-visible" type="button">Deselect visible</button>
                <button class="pg-select-btn" id="pg-select-videos" type="button">Videos</button>
                <button class="pg-select-btn" id="pg-select-images" type="button">Images</button>
                <button class="pg-select-btn" id="pg-select-page" type="button">This page</button>
                <button class="pg-select-btn" id="pg-invert-selection" type="button">Invert</button>
                <button class="pg-select-btn" id="pg-load-durations" type="button">Load durations</button>
                <button class="pg-select-btn" id="pg-clear-temp-cache" type="button">Clear temp cache</button>
                <button class="pg-select-btn" id="pg-clear-all-cache" type="button">Clear all cache</button>
                <label class="pg-cache-pill"><input type="checkbox" id="pg-keep-temp-cache"> Resume cache (slower)</label>
                <label class="pg-size-control">Size
                    <select id="pg-card-size">
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="large">Large</option>
                        <option value="xlarge">XL</option>
                    </select>
                </label>
            </div>

            <div class="pg-progress" id="pg-progress" role="status" aria-live="polite">
                <div class="pg-progress-row">
                    <div id="pg-progress-text"></div>
                    <div class="pg-progress-actions" id="pg-progress-actions">
                        <button type="button" id="pg-progress-pause" style="display:none;">Pause</button>
                        <button type="button" id="pg-progress-cancel" style="display:none;">Cancel</button>
                        <button type="button" id="pg-progress-details">Details</button>
                    </div>
                </div>
                <div class="pg-progress-bar">
                    <div class="pg-progress-fill" id="pg-progress-fill"></div>
                </div>
            </div>

            <div class="pg-desktop-overview" id="pg-desktop-overview" aria-live="polite">
                <div class="pg-stat-card">
                    <div class="pg-stat-label">Visible</div>
                    <div class="pg-stat-value" id="pg-stat-visible">0</div>
                </div>
                <div class="pg-stat-card">
                    <div class="pg-stat-label">Selected</div>
                    <div class="pg-stat-value" id="pg-stat-selected">0</div>
                </div>
                <div class="pg-stat-card">
                    <div class="pg-stat-label">Pages</div>
                    <div class="pg-stat-value" id="pg-stat-pages">0</div>
                </div>
                <div class="pg-stat-card">
                    <div class="pg-stat-label">State</div>
                    <div class="pg-stat-value" id="pg-stat-state">Ready</div>
                </div>
            </div>

            <div class="pg-sheet-backdrop" id="pg-sheet-backdrop"></div>
            <div class="pg-bottom-sheet" id="pg-gallery-more-sheet" role="dialog" aria-modal="true" aria-label="Gallery actions" aria-hidden="true">
                <div class="pg-sheet-grabber" aria-hidden="true"></div>
                <div class="pg-sheet-header">
                    <div class="pg-sheet-title">Gallery actions</div>
                    <button type="button" class="pg-sheet-close" id="pg-gallery-more-close" aria-label="Close actions">×</button>
                </div>
                <div class="pg-sheet-body">
                    <section class="pg-sheet-section">
                        <div class="pg-sheet-section-title">Main actions</div>
                        <div class="pg-sheet-grid">
                            <button class="pg-sheet-btn" id="pg-more-scan-all" type="button">Scan all pages</button>
                            <button class="pg-sheet-btn" id="pg-more-cancel-scan" type="button" style="display:none;">Stop scan</button>
                            <button class="pg-sheet-btn" id="pg-more-download-zip" type="button">Download ZIP</button>
                            <button class="pg-sheet-btn" id="pg-more-export-urls" type="button">Export URLs</button>
                            <button class="pg-sheet-btn" id="pg-more-zip-pause" type="button" style="display:none;">Pause ZIP</button>
                            <button class="pg-sheet-btn" id="pg-more-zip-cancel" type="button" style="display:none;">Cancel ZIP</button>
                            <button class="pg-sheet-btn" id="pg-more-debug-toggle" type="button">Diagnostics</button>
                            <button class="pg-sheet-btn" id="pg-more-retry-failed" type="button">Retry failed</button>
                        </div>
                    </section>
                    <section class="pg-sheet-section">
                        <div class="pg-sheet-section-title">Selection</div>
                        <div class="pg-sheet-grid">
                            <button class="pg-sheet-btn" id="pg-more-selection-mode" type="button">Selection mode</button>
                            <button class="pg-sheet-btn" id="pg-more-select-all" type="button">Select all</button>
                            <button class="pg-sheet-btn" id="pg-more-select-none" type="button">Clear selection</button>
                            <button class="pg-sheet-btn" id="pg-more-select-visible" type="button">Select visible</button>
                            <button class="pg-sheet-btn" id="pg-more-deselect-visible" type="button">Deselect visible</button>
                            <button class="pg-sheet-btn" id="pg-more-select-videos" type="button">Select videos</button>
                            <button class="pg-sheet-btn" id="pg-more-select-images" type="button">Select images</button>
                            <button class="pg-sheet-btn" id="pg-more-select-page" type="button">This page only</button>
                            <button class="pg-sheet-btn" id="pg-more-invert-selection" type="button">Invert selection</button>
                        </div>
                    </section>
                    <section class="pg-sheet-section">
                        <div class="pg-sheet-section-title">Desktop</div>
                        <div class="pg-sheet-grid">
                            <button class="pg-sheet-btn" id="pg-more-toggle-chrome" type="button">Focus gallery</button>
                            <button class="pg-sheet-btn" id="pg-more-toggle-details" type="button">Toggle details</button>
                            <button class="pg-sheet-btn" id="pg-more-load-durations" type="button">Load video durations</button>
                            <button class="pg-sheet-btn" id="pg-more-shortcuts" type="button">Keyboard shortcuts</button>
                            <button class="pg-sheet-btn" id="pg-more-focus-search" type="button">Focus search</button>
                        </div>
                    </section>
                    <section class="pg-sheet-section">
                        <div class="pg-sheet-section-title">Settings</div>
                        <div class="pg-sheet-grid">
                            <label class="pg-sheet-setting">Card size
                                <select id="pg-more-card-size">
                                    <option value="compact">Compact</option>
                                    <option value="comfortable">Comfortable</option>
                                    <option value="large">Large</option>
                                    <option value="xlarge">XL</option>
                                </select>
                            </label>
                            <label class="pg-sheet-setting">Page
                                <select id="pg-more-page-filter"><option value="all">All pages</option></select>
                            </label>
                            <label class="pg-sheet-setting">Selected only
                                <input type="checkbox" id="pg-more-selected-only">
                            </label>
                            <label class="pg-sheet-setting">Group by page
                                <input type="checkbox" id="pg-more-group-by-page">
                            </label>
                            <label class="pg-sheet-setting">Sort
                                <select id="pg-more-sort-order">
                                    <option value="scan">Scan order</option>
                                    <option value="page">Page</option>
                                    <option value="type">Type</option>
                                    <option value="likes-desc">Most liked posts</option>
                                    <option value="likes-asc">Least liked posts</option>
                                    <option value="duration-desc">Longest videos</option>
                                    <option value="duration-asc">Shortest videos</option>
                                    <option value="selected">Selected first</option>
                                </select>
                            </label>
                            <label class="pg-sheet-setting">ZIP part size
                                <select id="pg-more-zip-part-size">
                                    <option value="0">Auto</option>
                                    <option value="32">32 MiB</option>
                                    <option value="64">64 MiB</option>
                                    <option value="96">96 MiB</option>
                                    <option value="256">256 MiB</option>
                                    <option value="512">512 MiB</option>
                                </select>
                            </label>
                            <label class="pg-sheet-setting">ZIP grouping
                                <select id="pg-more-zip-grouping">
                                    <option value="selection">Selected media</option>
                                    <option value="page">One archive per page</option>
                                </select>
                            </label>
                            <label class="pg-sheet-setting">Resume cache (slower)
                                <input type="checkbox" id="pg-more-keep-temp-cache">
                            </label>
                            <button class="pg-sheet-btn" id="pg-more-clear-temp-cache" type="button">Clear temp cache</button>
                            <button class="pg-sheet-btn" id="pg-more-clear-all-cache" type="button">Clear all cache</button>
                            <span class="pg-cache-pill" id="pg-more-cache-size">Cache: …</span>
                        </div>
                    </section>
                </div>
            </div>

            <div class="pg-shortcut-panel" id="pg-shortcut-panel" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" aria-hidden="true">
                <div class="pg-shortcut-header">
                    <div class="pg-shortcut-title">Keyboard shortcuts</div>
                    <button type="button" class="pg-shortcut-close" id="pg-shortcut-close" aria-label="Close shortcuts">×</button>
                </div>
                <div class="pg-shortcut-body">
                    <div class="pg-shortcut-row"><span>Search gallery</span><span class="pg-kbd">/</span></div>
                    <div class="pg-shortcut-row"><span>Select all</span><span class="pg-kbd">A</span></div>
                    <div class="pg-shortcut-row"><span>Select visible</span><span class="pg-kbd">V</span></div>
                    <div class="pg-shortcut-row"><span>Clear selection</span><span class="pg-kbd">N</span></div>
                    <div class="pg-shortcut-row"><span>Download ZIP</span><span class="pg-kbd">Z</span></div>
                    <div class="pg-shortcut-row"><span>Export URLs</span><span class="pg-kbd">U</span></div>
                    <div class="pg-shortcut-row"><span>Diagnostics</span><span class="pg-kbd">D</span></div>
                    <div class="pg-shortcut-row"><span>Scan all pages</span><span class="pg-kbd">S</span></div>
                    <div class="pg-shortcut-row"><span>Smaller / larger cards</span><span class="pg-kbd">− / +</span></div>
                    <div class="pg-shortcut-row"><span>Lightbox previous / next</span><span class="pg-kbd">← / →</span></div>
                    <div class="pg-shortcut-row"><span>First / last media</span><span class="pg-kbd">Home / End</span></div>
                    <div class="pg-shortcut-row"><span>Close panel/gallery</span><span class="pg-kbd">Esc</span></div>
                </div>
            </div>

            <section class="pg-zip-job-summary" id="pg-zip-job-summary" aria-live="polite" hidden>
                <div class="pg-zip-job-title" data-pg-job-title>Creating ZIP</div>
                <div class="pg-zip-job-count" data-pg-job-count>0 / 0 completed</div>
                <div class="pg-zip-job-meta" data-pg-job-meta></div>
                <div class="pg-zip-job-problems" data-pg-job-problems hidden></div>
            </section>

            <div id="pg-debug-panel" aria-live="polite">
                <div class="pg-debug-header">
                    <div class="pg-debug-title">Gallery Debug</div>
                    <div class="pg-debug-actions">
                        <button type="button" id="pg-debug-copy">Copy</button>
                        <button type="button" id="pg-debug-export">Export</button>
                        <button type="button" id="pg-debug-failed">Failed URLs</button>
                        <button type="button" id="pg-debug-retry-failed">Retry failed</button>
                        <button type="button" id="pg-debug-clear-cache">Clear cache</button>
                        <button type="button" id="pg-debug-clear">Clear</button>
                        <button type="button" id="pg-debug-close">Close</button>
                    </div>
                </div>
                <div class="pg-debug-summary" id="pg-debug-summary">No debug events yet.</div>
                <div class="pg-debug-log" id="pg-debug-log"></div>
            </div>

            <div class="pg-gallery-scroll">
                <div class="pg-grid" id="pg-grid"></div>
            </div>

            <div class="pg-sticky-download-bar">
                <span class="pg-selection-count" id="pg-sticky-selection-count">0 selected</span>
                <button class="pg-select-btn" id="pg-sticky-zip" type="button">ZIP</button>
                <button class="pg-select-btn" id="pg-sticky-urls" type="button">URLs</button>
                <button class="pg-select-btn pg-sticky-more" id="pg-sticky-more" type="button">More</button>
                <button class="pg-select-btn" id="pg-sticky-none" type="button">Clear</button>
                <button class="pg-select-btn" id="pg-sticky-failed" type="button">Retry failed</button>
                <span class="pg-sticky-status" id="pg-sticky-status"></span>
            </div>

            <div id="pg-lightbox">
                <div class="pg-lb-header">
                    <span class="pg-lb-counter"></span>
                </div>

                <div class="pg-lb-content" id="pg-lb-stage">
                    <div class="pg-loader"></div>
                </div>

                <div class="pg-lb-controls">
                    <button class="pg-ctrl-btn" id="pg-prev" aria-label="Previous">❮</button>
                    <button class="pg-ctrl-btn" id="pg-grid-view" aria-label="Back to grid">${gridIconSvg}</button>
                    <a class="pg-ctrl-link" id="pg-post-current" href="#" target="_blank" rel="noopener noreferrer" aria-label="Open original post">💬</a>
                    <a class="pg-ctrl-link" id="pg-open-current" href="#" target="_blank" rel="noopener noreferrer" aria-label="Open media">↗</a>
                    <a class="pg-ctrl-link" id="pg-download-current" href="#" download aria-label="Download media">⬇</a>
                    <button class="pg-ctrl-btn" id="pg-next" aria-label="Next">❯</button>
                </div>
                <div class="pg-lb-filmstrip" id="pg-lb-filmstrip" aria-label="Nearby media thumbnails"></div>
            </div>
        `;

        document.body.appendChild(container);

        state.container = container;
        state.lightbox = container.querySelector("#pg-lightbox");
        restoreZipJobSummary();

        container.querySelectorAll(".pg-filter-btn").forEach(button => {
            button.addEventListener("click", event => {
                container.querySelectorAll(".pg-filter-btn").forEach(item => item.classList.remove("active"));
                event.currentTarget.classList.add("active");
                state.filter = event.currentTarget.dataset.filter;
                renderGrid();
            });
        });

        container.querySelector(".pg-close").addEventListener("click", closeGallery);
        container.querySelector("#pg-grid-view").addEventListener("click", closeLightbox);
        container.querySelector("#pg-prev").addEventListener("click", () => navLightbox(-1));
        container.querySelector("#pg-next").addEventListener("click", () => navLightbox(1));
        container.querySelector("#pg-scan-all").addEventListener("click", runManualRescan);
        container.querySelector("#pg-cancel-scan").addEventListener("click", cancelScan);
        container.querySelector("#pg-export-urls").addEventListener("click", exportUrls);
        container.querySelector("#pg-download-zip").addEventListener("click", downloadAllAsZip);
        container.querySelector("#pg-zip-pause").addEventListener("click", toggleZipPause);
        container.querySelector("#pg-zip-cancel").addEventListener("click", cancelZipDownload);
        container.querySelector("#pg-select-all").addEventListener("click", selectAllMedia);
        container.querySelector("#pg-select-none").addEventListener("click", deselectAllMedia);
        container.querySelector("#pg-select-visible").addEventListener("click", selectVisibleMedia);
        container.querySelector("#pg-deselect-visible").addEventListener("click", deselectVisibleMedia);
        container.querySelector("#pg-select-videos").addEventListener("click", () => selectByPredicate(item => item.type === "video"));
        container.querySelector("#pg-select-images").addEventListener("click", () => selectByPredicate(item => item.type === "image"));
        container.querySelector("#pg-select-page").addEventListener("click", selectCurrentThreadPageMedia);
        container.querySelector("#pg-invert-selection").addEventListener("click", invertSelection);
        container.querySelector("#pg-load-durations").addEventListener("click", () => void hydrateVideoDurations("button"));
        container.querySelector("#pg-clear-temp-cache").addEventListener("click", clearTempCacheFromUi);
        container.querySelector("#pg-clear-all-cache").addEventListener("click", clearAllCacheFromUi);
        container.querySelector("#pg-keep-temp-cache").addEventListener("change", event => {
            setKeepTempCache(event.currentTarget.checked);
        });

        container.querySelector("#pg-card-size").addEventListener("change", event => {
            setGalleryCardSize(event.currentTarget.value);
        });
        container.querySelector("#pg-sort-order").addEventListener("change", event => {
            setGallerySort(event.currentTarget.value);
        });
        container.querySelector("#pg-gallery-search").addEventListener("input", event => {
            setGallerySearch(event.currentTarget.value);
        });
        container.querySelector("#pg-page-filter").addEventListener("change", event => setPageFilter(event.currentTarget.value));
        container.querySelector("#pg-selected-only").addEventListener("change", event => setSelectedOnly(event.currentTarget.checked));
        container.querySelector("#pg-group-by-page").addEventListener("change", event => setGroupByPage(event.currentTarget.checked));
        container.querySelector("#pg-toggle-chrome").addEventListener("click", toggleChromeCollapsed);
        container.querySelector("#pg-toggle-details").addEventListener("click", toggleDesktopDetails);
        container.querySelector("#pg-desktop-more").addEventListener("click", toggleGalleryMoreSheet);
        container.querySelector("#pg-shortcuts-help").addEventListener("click", showShortcutHelp);
        container.querySelector("#pg-sticky-zip").addEventListener("click", downloadAllAsZip);
        container.querySelector("#pg-sticky-urls").addEventListener("click", exportUrls);
        container.querySelector("#pg-sticky-more").addEventListener("click", toggleGalleryMoreSheet);
        container.querySelector("#pg-sticky-none").addEventListener("click", deselectAllMedia);
        container.querySelector("#pg-sticky-failed").addEventListener("click", retryFailedZipItems);
        container.querySelector("#pg-gallery-more").addEventListener("click", toggleGalleryMoreSheet);
        container.querySelector("#pg-gallery-more-close").addEventListener("click", closeGalleryMoreSheet);
        container.querySelector("#pg-sheet-backdrop").addEventListener("click", () => {
            hideShortcutHelp();
            closeGalleryMoreSheet();
        });
        container.querySelector("#pg-progress-pause").addEventListener("click", toggleZipPause);
        container.querySelector("#pg-progress-cancel").addEventListener("click", () => {
            if (state.zipRunning) {
                cancelZipDownload();
            } else if (state.scanRunning) {
                cancelScan();
            }
        });
        container.querySelector("#pg-progress-details").addEventListener("click", () => { renderZipJobSummary(); const panel = document.getElementById("pg-zip-job-summary"); panel?.scrollIntoView?.({ block: "nearest", behavior: "smooth" }); });
        container.querySelector("#pg-more-scan-all").addEventListener("click", () => { closeGalleryMoreSheet(); void runManualRescan(); });
        container.querySelector("#pg-more-cancel-scan").addEventListener("click", cancelScan);
        container.querySelector("#pg-more-download-zip").addEventListener("click", () => { closeGalleryMoreSheet(); void downloadAllAsZip(); });
        container.querySelector("#pg-more-export-urls").addEventListener("click", () => { closeGalleryMoreSheet(); exportUrls(); });
        container.querySelector("#pg-more-zip-pause").addEventListener("click", toggleZipPause);
        container.querySelector("#pg-more-zip-cancel").addEventListener("click", cancelZipDownload);
        container.querySelector("#pg-more-debug-toggle").addEventListener("click", () => { closeGalleryMoreSheet(); toggleDebugPanel(); });
        container.querySelector("#pg-more-retry-failed").addEventListener("click", retryFailedZipItems);
        container.querySelector("#pg-more-selection-mode").addEventListener("click", () => {
            setSelectionMode(!state.selectionMode);
        });
        container.querySelector("#pg-more-select-all").addEventListener("click", selectAllMedia);
        container.querySelector("#pg-more-select-none").addEventListener("click", deselectAllMedia);
        container.querySelector("#pg-more-select-visible").addEventListener("click", selectVisibleMedia);
        container.querySelector("#pg-more-deselect-visible").addEventListener("click", deselectVisibleMedia);
        container.querySelector("#pg-more-select-videos").addEventListener("click", () => selectByPredicate(item => item.type === "video"));
        container.querySelector("#pg-more-select-images").addEventListener("click", () => selectByPredicate(item => item.type === "image"));
        container.querySelector("#pg-more-select-page").addEventListener("click", selectCurrentThreadPageMedia);
        container.querySelector("#pg-more-invert-selection").addEventListener("click", invertSelection);
        container.querySelector("#pg-more-toggle-chrome").addEventListener("click", () => { closeGalleryMoreSheet(); toggleChromeCollapsed(); });
        container.querySelector("#pg-more-toggle-details").addEventListener("click", () => { closeGalleryMoreSheet(); toggleDesktopDetails(); });
        container.querySelector("#pg-more-load-durations").addEventListener("click", () => { closeGalleryMoreSheet(); void hydrateVideoDurations("more-sheet"); });
        container.querySelector("#pg-more-shortcuts").addEventListener("click", () => { closeGalleryMoreSheet(); showShortcutHelp(); });
        container.querySelector("#pg-more-focus-search").addEventListener("click", () => { closeGalleryMoreSheet(); focusGallerySearch(); });
        container.querySelector("#pg-more-clear-temp-cache").addEventListener("click", clearTempCacheFromUi);
        container.querySelector("#pg-more-clear-all-cache").addEventListener("click", clearAllCacheFromUi);
        container.querySelector("#pg-more-keep-temp-cache").addEventListener("change", event => setKeepTempCache(event.currentTarget.checked));
        container.querySelector("#pg-more-zip-part-size").addEventListener("change", event => setZipPartSize(event.currentTarget.value));
        container.querySelector("#pg-more-zip-grouping").addEventListener("change", event => setZipGrouping(event.currentTarget.value));
        container.querySelector("#pg-more-card-size").addEventListener("change", event => setGalleryCardSize(event.currentTarget.value));
        container.querySelector("#pg-more-sort-order").addEventListener("change", event => setGallerySort(event.currentTarget.value));
        container.querySelector("#pg-more-page-filter").addEventListener("change", event => setPageFilter(event.currentTarget.value));
        container.querySelector("#pg-more-selected-only").addEventListener("change", event => setSelectedOnly(event.currentTarget.checked));
        container.querySelector("#pg-more-group-by-page").addEventListener("change", event => setGroupByPage(event.currentTarget.checked));
        container.querySelector("#pg-shortcut-close").addEventListener("click", hideShortcutHelp);
        container.querySelector("#pg-debug-toggle").addEventListener("click", toggleDebugPanel);
        container.querySelector("#pg-debug-close").addEventListener("click", () => setDebugPanelVisible(false));
        container.querySelector("#pg-debug-clear").addEventListener("click", clearDebugLogs);
        container.querySelector("#pg-debug-copy").addEventListener("click", copyDebugLog);
        container.querySelector("#pg-debug-export").addEventListener("click", exportDebugLog);
        container.querySelector("#pg-debug-failed").addEventListener("click", exportFailedUrls);
        container.querySelector("#pg-debug-retry-failed").addEventListener("click", retryFailedZipItems);
        container.querySelector("#pg-debug-clear-cache").addEventListener("click", clearAllCacheFromUi);
        setKeepTempCache(localStorage.getItem("pg_keep_temp_cache_v3") === "1", false);
        document.querySelectorAll("#pg-card-size, #pg-more-card-size").forEach(selector => {
            selector.value = getValidGalleryCardSize(state.galleryCardSize);
        });
        document.querySelectorAll("#pg-sort-order, #pg-more-sort-order").forEach(sortSelector => {
            sortSelector.value = getValidGallerySort(state.gallerySort);
        });
        const zipPartSizeSelector = document.getElementById("pg-more-zip-part-size");
        if (zipPartSizeSelector) zipPartSizeSelector.value = String(state.zipPartSizeMiB || 0);
        const zipGroupingSelector = document.getElementById("pg-more-zip-grouping");
        if (zipGroupingSelector) zipGroupingSelector.value = state.zipGrouping;
        if (getValidGallerySort(state.gallerySort).startsWith("duration")) {
            void hydrateVideoDurations("initial-sort");
        }
        container.classList.toggle("pg-desktop-details-open", state.desktopDetailsOpen);
        container.classList.toggle("pg-chrome-collapsed", state.chromeCollapsed);
        applyGalleryGridSize();
        updateMobileUiState();
        updateDesktopOverview();
        void updateCacheStats();

        document.addEventListener("keydown", handleKeyInput);

        container.addEventListener("wheel", event => {
            const galleryScroll = container.querySelector(".pg-gallery-scroll");
            const lightbox = container.querySelector("#pg-lightbox");
            const isLightboxOpen = lightbox && lightbox.classList.contains("active");

            if (isLightboxOpen) {
                event.preventDefault();
                return;
            }

            if (galleryScroll) {
                event.preventDefault();
                galleryScroll.scrollTop += event.deltaY;
            }
        }, { passive: false });

        setupLightboxGestures(document.getElementById("pg-lb-stage"));
    }



    function getZipPartLimitBytes() {
        const requestedMiB = Number(state.zipPartSizeMiB) || 0;
        const allowed = new Set(config.zipPartSizePresetsMiB);
        if (allowed.has(requestedMiB)) return requestedMiB * 1024 * 1024;
        return config.maxZipBlobBytes;
    }

    function setZipPartSize(value) {
        const parsed = Number(value) || 0;
        state.zipPartSizeMiB = config.zipPartSizePresetsMiB.includes(parsed) ? parsed : 0;
        localStorage.setItem("pg_zip_part_size_mib", String(state.zipPartSizeMiB));
    }

    function setZipGrouping(value) {
        state.zipGrouping = value === "page" ? "page" : "selection";
        localStorage.setItem("pg_zip_grouping", state.zipGrouping);
    }

    function getZipEstimate(items) {
        const known = items.map(item => Number(item.size) || 0).filter(size => size > 0);
        const knownBytes = known.reduce((sum, size) => sum + size, 0);
        const unknownCount = Math.max(0, items.length - known.length);
        return { knownBytes, knownCount: known.length, unknownCount };
    }

    function buildArchiveManifest({ runId, jobId, partNumber, archiveBaseName, grouping, pageNumber, entries, failures }) {
        return {
            schemaVersion: 1,
            generator: "LPSG Media Gallery Unlocker",
            generatedAt: new Date().toISOString(),
            threadUrl: window.location.href,
            archiveBaseName,
            grouping,
            pageNumber: pageNumber || null,
            partNumber,
            runId,
            jobId,
            files: entries.map(entry => ({
                fileName: entry.fileName,
                type: entry.item.type,
                pageNumber: entry.item.pageNumber || null,
                postId: entry.item.postId || null,
                postUrl: entry.item.postUrl || null,
                sourceUrl: entry.url || entry.item.src || null,
                originalUrl: entry.item.originalSrc || entry.item.src || null,
                size: entry.size || null,
            })),
            failedEntries: failures.map(entry => ({
                fileName: entry.fileName,
                type: entry.item?.type || null,
                pageNumber: entry.item?.pageNumber || null,
                postId: entry.item?.postId || null,
                postUrl: entry.item?.postUrl || null,
                sources: entry.sources || [],
                error: entry.error || "Unknown error",
            })),
        };
    }

    function setKeepTempCache(value, persist = true) {
        state.keepTempCacheAfterZip = Boolean(value);

        if (persist) {
            localStorage.setItem("pg_keep_temp_cache_v3", state.keepTempCacheAfterZip ? "1" : "0");
        }

        document.querySelectorAll("#pg-keep-temp-cache, #pg-more-keep-temp-cache").forEach(input => {
            input.checked = state.keepTempCacheAfterZip;
        });
    }

    function updateMobileUiState() {
        const container = document.getElementById("pg-container");
        const selectionModeButton = document.getElementById("pg-more-selection-mode");
        const chromeButtons = document.querySelectorAll("#pg-toggle-chrome, #pg-more-toggle-chrome");
        const durationButtons = document.querySelectorAll("#pg-load-durations, #pg-more-load-durations");
        const mobileStatus = document.getElementById("pg-mobile-status");
        const selected = getSelectedMedia().length;
        const total = state.mediaById.size;

        container?.classList.toggle("pg-selection-mode", state.selectionMode);
        container?.classList.toggle("pg-has-selection", selected > 0);
        container?.classList.toggle("pg-has-job", state.zipRunning || state.scanRunning);

        if (selectionModeButton) {
            selectionModeButton.textContent = state.selectionMode ? "Done editing selection" : "Edit selection";
        }

        chromeButtons.forEach(button => {
            button.textContent = state.chromeCollapsed ? "Show controls" : "Focus gallery";
        });

        durationButtons.forEach(button => {
            button.disabled = state.videoDurationHydrationRunning;
            button.textContent = state.videoDurationHydrationRunning ? "Loading durations…" : (button.id === "pg-more-load-durations" ? "Load video durations" : "Load durations");
        });

        if (mobileStatus) {
            if (state.zipRunning) {
                mobileStatus.textContent = state.zipPaused ? "ZIP paused." : "ZIP running in background.";
            } else if (state.scanRunning) {
                // Detailed live scan state belongs exclusively to #pg-progress.
                mobileStatus.textContent = "";
            } else if (state.selectionMode && selected > 0) {
                mobileStatus.textContent = `${selected} selected. Use ZIP, URLs, or More.`;
            } else if (selected > 0) {
                mobileStatus.textContent = `${selected} included in ZIP · long-press to edit selection.`;
            } else if (total > 0) {
                mobileStatus.textContent = `${total} media found. Tap to open. Long-press to select.`;
            } else {
                mobileStatus.textContent = "Tap Scan all or wait for auto-scan.";
            }
        }

        updateFloatingButtonLabel();
        updateProgressDrawerControls();
        updateDesktopOverview();
    }

    function setSelectionMode(enabled) {
        state.selectionMode = Boolean(enabled);
        updateMobileUiState();
    }


    function isEditableTarget(target) {
        return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true'], [contenteditable='']"));
    }

    function getValidGallerySort(value) {
        return [
            "scan",
            "page",
            "type",
            "likes-desc",
            "likes-asc",
            "duration-desc",
            "duration-asc",
            "selected",
        ].includes(value) ? value : "scan";
    }

    function setGallerySort(value) {
        state.gallerySort = getValidGallerySort(value);
        state.filteredMediaCache = null;
        localStorage.setItem("pg_gallery_sort", state.gallerySort);
        document.querySelectorAll("#pg-sort-order, #pg-more-sort-order").forEach(selector => {
            selector.value = state.gallerySort;
        });

        if (state.gallerySort.startsWith("duration")) {
            void hydrateVideoDurations("sort");
        }

        renderGrid();
    }

    function setPageFilter(value) {
        state.pageFilter = value === "all" ? "all" : String(Math.max(1, Number.parseInt(value, 10) || 1));
        state.filteredMediaCache = null;
        document.querySelectorAll("#pg-page-filter, #pg-more-page-filter").forEach(select => { select.value = state.pageFilter; });
        renderGrid();
    }

    function setSelectedOnly(enabled) {
        state.selectedOnly = Boolean(enabled);
        state.filteredMediaCache = null;
        document.querySelectorAll("#pg-selected-only, #pg-more-selected-only").forEach(input => { input.checked = state.selectedOnly; });
        renderGrid();
    }

    function setGroupByPage(enabled) {
        state.groupByPage = Boolean(enabled);
        state.filteredMediaCache = null;
        document.querySelectorAll("#pg-group-by-page, #pg-more-group-by-page").forEach(input => { input.checked = state.groupByPage; });
        renderGrid();
    }

    function refreshPageNavigationControls(allMedia = getAllMedia()) {
        const pages = [...new Set(allMedia.map(item => Number(item.pageNumber)).filter(Number.isFinite))].sort((a,b) => a-b);
        document.querySelectorAll("#pg-page-filter, #pg-more-page-filter").forEach(select => {
            const previous = state.pageFilter;
            select.replaceChildren(new Option("All pages", "all"), ...pages.map(page => new Option(`Page ${page}`, String(page))));
            if (previous !== "all" && !pages.includes(Number(previous))) state.pageFilter = "all";
            select.value = state.pageFilter;
        });
    }

    function setGallerySearch(value) {
        const nextValue = String(value || "").trim().toLowerCase();

        if (nextValue === state.gallerySearch) {
            return;
        }

        state.gallerySearch = nextValue;
        state.filteredMediaCache = null;

        if (state.gallerySearchTimer) {
            clearTimeout(state.gallerySearchTimer);
        }

        state.gallerySearchTimer = setTimeout(() => {
            state.gallerySearchTimer = null;
            renderGrid();
        }, config.searchDebounceMs);
    }

    function focusGallerySearch() {
        const input = document.getElementById("pg-gallery-search");
        if (input) {
            input.focus();
            input.select?.();
        }
    }

    function toggleDesktopDetails() {
        state.desktopDetailsOpen = !state.desktopDetailsOpen;
        localStorage.setItem("pg_desktop_details_open", state.desktopDetailsOpen ? "1" : "0");
        document.getElementById("pg-container")?.classList.toggle("pg-desktop-details-open", state.desktopDetailsOpen);
        updateDesktopOverview();
    }

    function setChromeCollapsed(collapsed) {
        state.chromeCollapsed = Boolean(collapsed);
        localStorage.setItem("pg_chrome_collapsed", state.chromeCollapsed ? "1" : "0");
        document.getElementById("pg-container")?.classList.toggle("pg-chrome-collapsed", state.chromeCollapsed);
        updateMobileUiState();
    }

    function toggleChromeCollapsed() {
        setChromeCollapsed(!state.chromeCollapsed);
    }

    function showShortcutHelp() {
        const panel = document.getElementById("pg-shortcut-panel");
        const backdrop = document.getElementById("pg-sheet-backdrop");
        if (!panel) {
            return;
        }
        closeToolsMenu();
        closeGalleryMoreSheet();
        state.shortcutsOpen = true;
        panel.classList.add("visible");
        panel.setAttribute("aria-hidden", "false");
        backdrop?.classList.add("visible");
        requestAnimationFrame(() => document.getElementById("pg-shortcut-close")?.focus?.());
    }

    function hideShortcutHelp() {
        const panel = document.getElementById("pg-shortcut-panel");
        const backdrop = document.getElementById("pg-sheet-backdrop");
        state.shortcutsOpen = false;
        panel?.classList.remove("visible");
        panel?.setAttribute("aria-hidden", "true");
        if (!state.galleryMoreOpen) {
            backdrop?.classList.remove("visible");
        }
    }

    function updateDesktopStatus(message = "") {
        const status = document.getElementById("pg-desktop-status");

        if (status && message) {
            status.textContent = message;
            return;
        }

        updateMobileUiState();
    }

    function updateDesktopOverview() {
        const container = document.getElementById("pg-container");
        const all = getAllMedia();
        const selected = getSelectedMedia();
        const pages = new Set(all.map(item => Number(item.pageNumber) || 0).filter(Boolean));
        const visible = state.filteredMedia.length || getFilteredMedia().length;
        const stateLabel = state.zipRunning
            ? (state.zipPaused ? "ZIP paused" : "ZIP running")
            : state.scanRunning
                ? "Scanning"
                : state.lastFailedZipEntries.length
                    ? `${state.lastFailedZipEntries.length} failed`
                    : "Ready";
        const detailsButton = document.getElementById("pg-toggle-details");
        const status = document.getElementById("pg-desktop-status");

        container?.classList.toggle("pg-desktop-details-open", state.desktopDetailsOpen);

        const setText = (id, text) => {
            const node = document.getElementById(id);
            if (node) {
                node.textContent = text;
            }
        };

        setText("pg-stat-visible", `${visible}/${all.length}`);
        setText("pg-stat-selected", `${selected.length}`);
        setText("pg-stat-pages", pages.size ? `${pages.size}` : "1");
        setText("pg-stat-state", stateLabel);

        if (detailsButton) {
            detailsButton.textContent = state.desktopDetailsOpen ? "Hide details" : "Show details";
        }

        if (status) {
            const search = state.gallerySearch ? ` · search: “${state.gallerySearch}”` : "";
            status.textContent = `${all.length} media · ${visible} visible · ${selected.length} selected${search}`;
        }
    }

    function changeGalleryCardSizeStep(delta) {
        const keys = Object.keys(config.galleryCardSizes);
        const current = keys.indexOf(getValidGalleryCardSize(state.galleryCardSize));
        const next = Math.max(0, Math.min(keys.length - 1, current + delta));
        setGalleryCardSize(keys[next]);
    }

    function closeGalleryMoreSheet() {
        const sheet = document.getElementById("pg-gallery-more-sheet");
        const backdrop = document.getElementById("pg-sheet-backdrop");

        state.galleryMoreOpen = false;
        sheet?.classList.remove("visible");
        sheet?.setAttribute("aria-hidden", "true");
        if (!state.shortcutsOpen) {
            backdrop?.classList.remove("visible");
        }
    }

    function openGalleryMoreSheet() {
        const sheet = document.getElementById("pg-gallery-more-sheet");
        const backdrop = document.getElementById("pg-sheet-backdrop");

        if (!sheet) {
            return;
        }

        closeToolsMenu();
        state.galleryMoreOpen = true;
        sheet.classList.add("visible");
        sheet.setAttribute("aria-hidden", "false");
        backdrop?.classList.add("visible");
        updateMobileUiState();
        requestAnimationFrame(() => sheet.querySelector("button, select, input")?.focus?.());
    }

    function toggleGalleryMoreSheet() {
        if (state.galleryMoreOpen) {
            closeGalleryMoreSheet();
        } else {
            openGalleryMoreSheet();
        }
    }

    function updateProgressDrawerControls() {
        const actions = document.getElementById("pg-progress-actions");
        const pause = document.getElementById("pg-progress-pause");
        const cancel = document.getElementById("pg-progress-cancel");
        const details = document.getElementById("pg-progress-details");
        const hasJob = state.zipRunning || state.scanRunning;

        actions?.classList.toggle("visible", hasJob || Boolean(state.lastFailedZipEntries.length));

        if (pause) {
            pause.style.display = state.zipRunning ? "" : "none";
            pause.textContent = state.zipPaused ? "Resume" : "Pause";
        }

        if (cancel) {
            cancel.style.display = hasJob ? "" : "none";
            cancel.textContent = state.zipRunning ? "Cancel ZIP" : "Cancel scan";
        }

        if (details) {
            details.style.display = hasJob || Boolean(state.lastFailedZipEntries.length) ? "" : "none";
        }
    }

    function updateFloatingButtonLabel() {
        const button = document.querySelector(".pg-floating-launcher");

        if (!button) {
            return;
        }

        const selected = getSelectedMedia().length;
        const total = state.mediaById.size;

        if (state.zipRunning) {
            button.textContent = state.zipPaused ? "ZIP paused" : "ZIP running";
        } else if (state.scanRunning) {
            button.textContent = "Scanning…";
        } else if (selected > 0) {
            button.textContent = `Media · ${selected} selected`;
        } else if (total > 0) {
            button.textContent = `Media · ${total}`;
        } else {
            button.textContent = "Media tools";
        }
    }

    function resetLightboxZoom() {
        state.lightboxZoomed = false;
        document.querySelectorAll(".pg-lb-media.pg-zoomed").forEach(node => {
            node.classList.remove("pg-zoomed");
            node.style.transformOrigin = "";
        });
    }

    function toggleLightboxControls() {
        const lightbox = document.getElementById("pg-lightbox");

        if (!lightbox) {
            return;
        }

        state.lightboxControlsHidden = !state.lightboxControlsHidden;
        lightbox.classList.toggle("pg-controls-hidden", state.lightboxControlsHidden);
    }

    function toggleLightboxZoom(event = null) {
        const image = document.querySelector("#pg-lb-stage img.pg-lb-media");

        if (!image) {
            return;
        }

        state.lightboxZoomed = !state.lightboxZoomed;
        image.classList.toggle("pg-zoomed", state.lightboxZoomed);

        if (state.lightboxZoomed && event) {
            const rect = image.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
            const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100;
            image.style.transformOrigin = `${x}% ${y}%`;
        } else {
            image.style.transformOrigin = "";
        }
    }

    function getTouchDistance(touches) {
        if (!touches || touches.length < 2) {
            return 0;
        }

        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }

    function setupLightboxGestures(stage) {
        if (!stage || stage.dataset.pgGesturesInstalled === "true") {
            return;
        }

        stage.dataset.pgGesturesInstalled = "true";
        let startX = 0;
        let startY = 0;
        let startDistance = 0;
        let pinchStarted = false;
        let gestureMoved = false;

        stage.addEventListener("touchstart", event => {
            if (!event.changedTouches.length) {
                return;
            }

            startX = event.changedTouches[0].clientX;
            startY = event.changedTouches[0].clientY;
            startDistance = getTouchDistance(event.touches);
            pinchStarted = event.touches.length > 1;
            gestureMoved = false;
        }, { passive: true });

        stage.addEventListener("touchmove", event => {
            if (!event.changedTouches.length) {
                return;
            }

            const dx = event.changedTouches[0].clientX - startX;
            const dy = event.changedTouches[0].clientY - startY;
            gestureMoved = gestureMoved || Math.abs(dx) > 12 || Math.abs(dy) > 12;

            if (pinchStarted && event.touches.length > 1) {
                const distance = getTouchDistance(event.touches);

                if (startDistance > 0 && Math.abs(distance - startDistance) > 38) {
                    const image = document.querySelector("#pg-lb-stage img.pg-lb-media");
                    state.lightboxZoomed = distance > startDistance;
                    image?.classList.toggle("pg-zoomed", state.lightboxZoomed);
                }
            }
        }, { passive: true });

        stage.addEventListener("touchend", event => {
            if (!event.changedTouches.length || pinchStarted) {
                pinchStarted = false;
                return;
            }

            const dx = event.changedTouches[0].clientX - startX;
            const dy = event.changedTouches[0].clientY - startY;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);

            if (dy > 90 && absY > absX * 1.2) {
                closeLightbox();
                return;
            }

            if (absX > 54 && absX > absY * 1.15) {
                navLightbox(dx < 0 ? 1 : -1);
            }
        }, { passive: true });

        stage.addEventListener("click", event => {
            if (gestureMoved || event.target.closest("button, a, video")) {
                gestureMoved = false;
                return;
            }

            toggleLightboxControls();
        });

        stage.addEventListener("dblclick", event => {
            if (event.target.closest("video")) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            toggleLightboxZoom(event);
        });
    }

    function getSelectedMedia() {
        const selected = [];
        state.selectedMediaIds.forEach(id => {
            const item = state.mediaById.get(id);
            if (item) {
                selected.push(item);
            }
        });

        return selected;
    }

    function updateSelectionSummary() {
        const summary = document.getElementById("pg-selection-count");
        const stickySummary = document.getElementById("pg-sticky-selection-count");
        const zipButton = document.getElementById("pg-download-zip");
        const stickyZipButton = document.getElementById("pg-sticky-zip");
        const moreZipButton = document.getElementById("pg-more-download-zip");

        const total = state.mediaById.size;
        const selectedItems = getSelectedMedia();
        const selected = selectedItems.length;
        const visibleSelected = state.filteredMedia.filter(item => state.selectedMediaIds.has(item.id)).length;
        const estimatedKnownBytes = selectedItems.reduce((sum, item) => sum + (Number(item.size) || 0), 0);
        const sizeLabel = estimatedKnownBytes > 0 ? ` · ~${formatBytes(estimatedKnownBytes)}` : "";
        const text = `${selected}/${total} selected · ${visibleSelected} visible${sizeLabel}`;

        if (summary) {
            summary.textContent = text;
        }

        if (stickySummary) {
            stickySummary.textContent = text;
        }

        [zipButton, stickyZipButton, moreZipButton].filter(Boolean).forEach(button => {
            if (!state.zipRunning) {
                const zipLabel = "ZIP";
                button.textContent = selected > 0 ? `${zipLabel} (${selected})` : zipLabel;
                button.disabled = selected === 0;
            }
        });

        if (selected === 0 && state.selectionMode && isMobileLayout()) {
            state.selectionMode = false;
        }

        updateMobileUiState();
    }


    function selectAllMedia() {
        getAllMedia().forEach(item => state.selectedMediaIds.add(item.id));
        state.autoSelectNewMedia = true;
        if (isMobileLayout()) {
            state.selectionMode = true;
        }
        invalidateSelectionCaches();
        renderGrid();
        updateSelectionSummary();
    }

    function deselectAllMedia() {
        state.selectedMediaIds.clear();
        state.autoSelectNewMedia = false;
        state.selectionMode = false;
        invalidateSelectionCaches();
        renderGrid();
        updateSelectionSummary();
    }

    function selectVisibleMedia() {
        state.filteredMedia.forEach(item => state.selectedMediaIds.add(item.id));
        if (isMobileLayout()) {
            state.selectionMode = true;
        }
        invalidateSelectionCaches();
        renderGrid();
        updateSelectionSummary();
    }

    function deselectVisibleMedia() {
        state.filteredMedia.forEach(item => state.selectedMediaIds.delete(item.id));
        state.autoSelectNewMedia = false;
        invalidateSelectionCaches();
        renderGrid();
        updateSelectionSummary();
    }

    function selectByPredicate(predicate) {
        getAllMedia().forEach(item => {
            if (predicate(item)) {
                state.selectedMediaIds.add(item.id);
            } else {
                state.selectedMediaIds.delete(item.id);
            }
        });
        state.autoSelectNewMedia = false;
        if (isMobileLayout() && getSelectedMedia().length > 0) {
            state.selectionMode = true;
        }
        invalidateSelectionCaches();
        renderGrid();
        updateSelectionSummary();
    }

    function selectCurrentThreadPageMedia() {
        const pageNumber = getThreadInfo()?.currentPage || state.lastKnownPage || 1;
        selectByPredicate(item => Number(item.pageNumber) === Number(pageNumber));
    }

    function invertSelection() {
        getAllMedia().forEach(item => {
            if (state.selectedMediaIds.has(item.id)) {
                state.selectedMediaIds.delete(item.id);
            } else {
                state.selectedMediaIds.add(item.id);
            }
        });
        state.autoSelectNewMedia = false;
        if (isMobileLayout() && getSelectedMedia().length > 0) {
            state.selectionMode = true;
        }
        invalidateSelectionCaches();
        renderGrid();
        updateSelectionSummary();
    }

    function selectFailedMedia() {
        state.selectedMediaIds.clear();
        state.lastFailedZipEntries.forEach(entry => {
            if (entry?.item?.id) {
                state.selectedMediaIds.add(entry.item.id);
            }
        });
        state.autoSelectNewMedia = false;
        if (isMobileLayout() && getSelectedMedia().length > 0) {
            state.selectionMode = true;
        }
        invalidateSelectionCaches();
        renderGrid();
        updateSelectionSummary();
    }


    function toggleMediaSelected(item, selected) {
        if (selected) {
            state.selectedMediaIds.add(item.id);
            if (isMobileLayout()) {
                state.selectionMode = true;
            }
        } else {
            state.selectedMediaIds.delete(item.id);
            state.autoSelectNewMedia = false;
        }

        invalidateSelectionCaches();
        if (getValidGallerySort(state.gallerySort) === "selected") {
            scheduleRenderGrid();
        }
        updateSelectionSummary();
    }

    function invalidateMediaCaches() {
        state.mediaRevision += 1;
        state.allMediaCache = null;
        state.filteredMediaCache = null;
    }

    function invalidateSelectionCaches() {
        state.selectionRevision += 1;

        if (getValidGallerySort(state.gallerySort) === "selected") {
            state.filteredMediaCache = null;
        }
    }

