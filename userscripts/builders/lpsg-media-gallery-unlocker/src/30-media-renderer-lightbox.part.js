    function getAllMedia() {
        if (!state.allMediaCache) {
            state.allMediaCache = Array.from(state.mediaById.values());
        }

        return state.allMediaCache;
    }

    function buildMediaSearchText(item) {
        return [
            item.type,
            item.subType,
            item.pageNumber ? `page ${item.pageNumber}` : "",
            item.pageNumber ? String(item.pageNumber) : "",
            item.src,
            item.thumb,
            item.poster,
            item.postUrl,
            item.postId,
            Number.isFinite(Number(item.likeCount)) ? `likes ${item.likeCount}` : "",
            Number.isFinite(Number(item.durationSeconds)) ? `duration ${formatDuration(item.durationSeconds)}` : "",
            getExtension(item.src || ""),
        ].filter(Boolean).join(" ").toLowerCase();
    }

    function getFilteredMedia() {
        const allMedia = getAllMedia();
        const query = String(state.gallerySearch || "").trim().toLowerCase();
        const sort = getValidGallerySort(state.gallerySort);
        const cacheKey = [
            state.mediaRevision,
            sort === "selected" ? state.selectionRevision : 0,
            state.filter,
            state.pageFilter,
            state.selectedOnly ? state.selectionRevision : 0,
            state.selectedOnly,
            state.groupByPage,
            query,
            sort,
        ].join("|");

        if (state.filteredMediaCache?.key === cacheKey) {
            return state.filteredMediaCache.items;
        }

        let media = allMedia;

        if (state.filter !== "all") {
            media = media.filter(item => item.type === state.filter);
        }

        if (state.pageFilter !== "all") {
            media = media.filter(item => Number(item.pageNumber) === Number(state.pageFilter));
        }

        if (state.selectedOnly) {
            media = media.filter(item => state.selectedMediaIds.has(item.id));
        }

        if (query) {
            media = media.filter(item => {
                if (!item.searchText) {
                    item.searchText = buildMediaSearchText(item);
                }

                return item.searchText.includes(query);
            });
        }

        media = media.slice();

        const byOriginalOrder = (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
        const knownNumber = value => Number.isFinite(Number(value)) ? Number(value) : null;
        const compareKnown = (aValue, bValue, direction = "desc") => {
            const left = knownNumber(aValue);
            const right = knownNumber(bValue);

            if (left === null && right === null) {
                return 0;
            }

            if (left === null) {
                return 1;
            }

            if (right === null) {
                return -1;
            }

            return direction === "asc" ? left - right : right - left;
        };

        if (state.groupByPage || sort === "page") {
            media.sort((a, b) => (Number(a.pageNumber) || 0) - (Number(b.pageNumber) || 0) || byOriginalOrder(a, b));
        } else if (sort === "type") {
            media.sort((a, b) => String(a.type || "").localeCompare(String(b.type || "")) || byOriginalOrder(a, b));
        } else if (sort === "likes-desc") {
            media.sort((a, b) => compareKnown(a.likeCount, b.likeCount, "desc") || byOriginalOrder(a, b));
        } else if (sort === "likes-asc") {
            media.sort((a, b) => compareKnown(a.likeCount, b.likeCount, "asc") || byOriginalOrder(a, b));
        } else if (sort === "duration-desc") {
            media.sort((a, b) => Number(a.type !== "video") - Number(b.type !== "video") || compareKnown(a.durationSeconds, b.durationSeconds, "desc") || byOriginalOrder(a, b));
        } else if (sort === "duration-asc") {
            media.sort((a, b) => Number(a.type !== "video") - Number(b.type !== "video") || compareKnown(a.durationSeconds, b.durationSeconds, "asc") || byOriginalOrder(a, b));
        } else if (sort === "selected") {
            media.sort((a, b) => Number(state.selectedMediaIds.has(b.id)) - Number(state.selectedMediaIds.has(a.id)) || byOriginalOrder(a, b));
        }

        state.filteredMediaCache = { key: cacheKey, items: media };
        return media;
    }

    function reorderForColumns(items, numCols) {
        const result = [];

        for (let col = 0; col < numCols; col += 1) {
            for (let index = col; index < items.length; index += numCols) {
                result.push(items[index]);
            }
        }

        return result;
    }

    function getValidGalleryCardSize(value) {
        return config.galleryCardSizes[value] ? value : config.defaultGalleryCardSize;
    }

    function isMobileLayout() {
        return refreshDeviceProfile();
    }

    function getGalleryCardWidth() {
        const key = getValidGalleryCardSize(state.galleryCardSize);
        const size = config.galleryCardSizes[key];

        return isMobileLayout() ? size.mobileWidth : size.desktopWidth;
    }

    function applyGalleryGridSize() {
        const root = document.documentElement;
        const width = getGalleryCardWidth();
        const gap = isMobileLayout() ? 10 : config.galleryGridGap;

        root.style.setProperty("--pg-card-min-width", `${width}px`);
        root.style.setProperty("--pg-grid-gap", `${gap}px`);

        document.querySelectorAll("#pg-card-size, #pg-more-card-size").forEach(selector => {
            selector.value = getValidGalleryCardSize(state.galleryCardSize);
        });
    }

    function setGalleryCardSize(value) {
        state.galleryCardSize = getValidGalleryCardSize(value);
        localStorage.setItem("pg_gallery_card_size", state.galleryCardSize);
        applyGalleryGridSize();
        renderGrid();
        showToast("grid-size", `Grid size: ${config.galleryCardSizes[state.galleryCardSize].label}`, { level: "info", timeout: 1800 });
    }

    function getColumnCount() {
        const scroll = document.querySelector(".pg-gallery-scroll");
        const width = scroll?.clientWidth || window.innerWidth || 1;
        const cardWidth = getGalleryCardWidth();
        const gap = isMobileLayout() ? 10 : config.galleryGridGap;

        return Math.max(1, Math.floor((width + gap) / (cardWidth + gap)));
    }

    function scheduleRenderGrid() {
        if (!state.container) {
            return;
        }

        if (state.renderDebounceTimer || state.renderRafId) {
            return;
        }

        state.renderDebounceTimer = setTimeout(() => {
            state.renderDebounceTimer = null;
            state.renderRafId = requestAnimationFrame(() => {
                state.renderRafId = 0;
                renderGrid();
            });
        }, config.renderDebounceMs);
    }

    function cancelPendingRender() {
        if (state.renderDebounceTimer) {
            clearTimeout(state.renderDebounceTimer);
            state.renderDebounceTimer = null;
        }

        if (state.renderRafId) {
            cancelAnimationFrame(state.renderRafId);
            state.renderRafId = 0;
        }

        state.renderToken += 1;
    }

    function scheduleLazyObserver() {
        if (state.lazyObserverTimer) {
            clearTimeout(state.lazyObserverTimer);
        }

        state.lazyObserverTimer = setTimeout(() => {
            state.lazyObserverTimer = null;
            initLazyObserver();
        }, config.lazyObserverDebounceMs);
    }

    function createMediaCard(item, index) {
        const card = document.createElement("div");

        card.className = state.selectedMediaIds.has(item.id) ? "pg-item pg-selected" : "pg-item";
        card.tabIndex = 0;
        card.dataset.mediaId = item.id;
        card.dataset.index = String(index);
        card.dataset.type = item.type || "";
        card.title = `${item.type === "video" ? "Video" : "Image"} · Page ${item.pageNumber || "?"} · Enter opens lightbox`;

        let badge = "";
        let content = "";
        let imageNode = null;

        if (item.type === "video") {
            const poster = item.poster || "";
            badge = `<span class="pg-badge video">VIDEO</span>`;
            content = poster
                ? `<img class="pg-video-poster" src="${escapeHtml(poster)}" data-src="${escapeHtml(poster)}" data-retries="0" loading="lazy" alt="">`
                : `<div style="height:150px; display:flex; align-items:center; justify-content:center; background:#222; color:#555;">No Thumb</div>`;
        } else {
            imageNode = document.createElement("img");
            imageNode.className = "pg-lazy-img";
            imageNode.dataset.src = item.thumb || item.src;
            imageNode.dataset.fullSrc = item.src;
            imageNode.dataset.retries = "0";

            const safeWidth = Number(item.width) > 0 ? Number(item.width) : 4;
            const safeHeight = Number(item.height) > 0 ? Number(item.height) : 3;
            imageNode.style.setProperty("--pg-media-aspect", `${safeWidth} / ${safeHeight}`);

            imageNode.onload = function () {
                if (this.naturalWidth > 0 && this.naturalHeight > 0) {
                    this.style.setProperty("--pg-media-aspect", `${this.naturalWidth} / ${this.naturalHeight}`);
                }
                this.classList.remove("pg-broken");
                this.classList.add("pg-loaded");
                setStatusOverlay(card, "clear");
            };

            imageNode.onerror = function () {
                const fullSrc = this.dataset.fullSrc;
                let retries = parseInt(this.dataset.retries || "0", 10);

                if (retries < config.maxRetries) {
                    retries += 1;
                    this.dataset.retries = String(retries);
                    setStatusOverlay(card, "retry", `Retrying (${retries}/${config.maxRetries})`);
                    queueRetry(this, fullSrc, retries);
                } else {
                    setStatusOverlay(card, "broken", "Thumbnail unavailable");
                    this.classList.add("pg-loaded", "pg-broken");
                }
            };

            badge = item.subType === "gif"
                ? `<span class="pg-badge">GIF</span>`
                : `<span class="pg-badge">IMG</span>`;
        }

        const likesMeta = Number.isFinite(Number(item.likeCount))
            ? `<span class="pg-meta-chip" title="Post reactions / likes">♥ ${escapeHtml(formatLikes(item.likeCount))}${item.likeCountReliable ? "" : "?"}</span>`
            : `<span class="pg-meta-chip pg-meta-muted" title="No visible like/reaction count found">♥ —</span>`;
        const durationMeta = item.type === "video"
            ? `<span class="pg-meta-chip" title="Video duration">⏱ ${escapeHtml(formatDuration(item.durationSeconds))}</span>`
            : "";
        const postLink = item.postUrl
            ? `<a class="pg-meta-chip pg-meta-link" href="${escapeHtml(item.postUrl)}" target="_blank" rel="noopener noreferrer">Post</a>`
            : "";
        let sourceHost = "";
        try { sourceHost = new URL(item.src || item.thumb || "", window.location.href).hostname; } catch {}
        const sourceMeta = sourceHost ? `<span class="pg-meta-chip pg-meta-muted" title="Media source host">${escapeHtml(sourceHost)}</span>` : "";
        const postIdMeta = item.postId ? `<span class="pg-meta-chip pg-meta-muted" title="XenForo post ID">#${escapeHtml(item.postId)}</span>` : "";

        const checked = state.selectedMediaIds.has(item.id) ? "checked" : "";
        const selectorHtml = `<label class="pg-select-wrap" title="Include in ZIP"><input type="checkbox" ${checked} aria-label="Include this media in ZIP"></label>`;

        const quickActionsHtml = `
            <div class="pg-card-quick-actions" aria-label="Quick actions">
                <button type="button" data-pg-action="preview">Preview</button>
                <a href="${escapeHtml(item.src)}" target="_blank" rel="noopener noreferrer">Open</a>
                <a href="${escapeHtml(item.src)}" download="${escapeHtml(buildFileName(item, index))}">Save</a>
                ${item.postUrl ? `<a href="${escapeHtml(item.postUrl)}" target="_blank" rel="noopener noreferrer">Post</a>` : ""}
            </div>`;

        card.innerHTML = `${selectorHtml}${badge}${content}${quickActionsHtml}<div class="pg-meta"><span class="pg-meta-chip">Page ${item.pageNumber || "?"}</span>${likesMeta}${durationMeta}${sourceMeta}${postIdMeta}${postLink}</div>`;

        if (imageNode) {
            card.insertBefore(imageNode, card.querySelector(".pg-meta"));
            observeLazyImage(imageNode, index < config.eagerImageCount);
        }

        const videoPoster = card.querySelector(".pg-video-poster");
        if (videoPoster) {
            videoPoster.onload = function () {
                this.classList.remove("pg-broken");
                this.classList.add("pg-loaded");
                setStatusOverlay(card, "clear");
            };
            videoPoster.onerror = function () {
                this.classList.add("pg-loaded", "pg-broken");
                setStatusOverlay(card, "broken", "Video thumbnail unavailable");
            };
            if (videoPoster.complete && videoPoster.naturalWidth > 0) videoPoster.onload();
        }

        return card;
    }

    function getCardFromEvent(event) {
        return event.target instanceof Element ? event.target.closest(".pg-item[data-media-id]") : null;
    }

    function getMediaFromCard(card) {
        return card?.dataset?.mediaId ? state.mediaById.get(card.dataset.mediaId) : null;
    }

    function getFilteredIndexFromCard(card) {
        const index = Number(card?.dataset?.index);
        return Number.isFinite(index) ? index : -1;
    }

    function stopActivePreviewVideo() {
        if (state.hoverPreviewTimer) {
            clearTimeout(state.hoverPreviewTimer);
            state.hoverPreviewTimer = null;
        }

        if (state.activePreviewVideo) {
            state.activePreviewVideo.pause?.();
            state.activePreviewVideo.removeAttribute("src");
            state.activePreviewVideo.load?.();
            state.activePreviewVideo.remove();
            state.activePreviewVideo = null;
        }
    }

    function startPreviewVideoForCard(card) {
        if (!card || card.dataset.type !== "video" || isIOS || window.matchMedia("(pointer: coarse)").matches) {
            return;
        }

        const item = getMediaFromCard(card);
        if (!item?.src || card.querySelector(".pg-preview-video")) {
            return;
        }

        stopActivePreviewVideo();
        state.hoverPreviewTimer = setTimeout(() => {
            if (!document.body.contains(card)) {
                return;
            }

            const previewVideo = document.createElement("video");
            previewVideo.className = "pg-preview-video";
            previewVideo.src = item.src;
            previewVideo.muted = true;
            previewVideo.loop = true;
            previewVideo.playsInline = true;
            previewVideo.preload = "metadata";
            state.activePreviewVideo = previewVideo;
            card.appendChild(previewVideo);
            previewVideo.play().catch(() => {});
        }, config.hoverPreviewDelayMs);
    }

    function attachGalleryGridHandlers(grid) {
        if (!grid || grid.dataset.pgDelegatedHandlers === "1") {
            return;
        }

        grid.dataset.pgDelegatedHandlers = "1";

        grid.addEventListener("click", event => {
            const card = getCardFromEvent(event);
            if (!card) {
                return;
            }

            const retryThumbnailButton = event.target.closest?.("[data-pg-action='retry-thumbnail']");
            if (retryThumbnailButton) {
                event.preventDefault();
                event.stopPropagation();
                const img = card.querySelector(".pg-lazy-img, .pg-video-poster");
                if (img) {
                    img.dataset.retries = "0";
                    delete img.dataset.loadStarted;
                    img.classList.remove("pg-loaded", "pg-broken");
                    setStatusOverlay(card, "retry", "Retrying thumbnail");
                    const src = img.dataset.src || img.dataset.fullSrc;
                    if (src) {
                        const separator = src.includes("?") ? "&" : "?";
                        img.dataset.loadStarted = "1";
                        img.src = `${src}${separator}retry=${Date.now()}`;
                    }
                }
                return;
            }

            const previewButton = event.target.closest?.("[data-pg-action='preview']");
            if (previewButton) {
                event.preventDefault();
                event.stopPropagation();
                openLightbox(getFilteredIndexFromCard(card));
                return;
            }

            if (event.target.closest?.("a, input, label, button")) {
                return;
            }

            if (state.cardLongPressTriggered && state.cardLongPressMediaId === card.dataset.mediaId) {
                event.preventDefault();
                event.stopPropagation();
                state.cardLongPressTriggered = false;
                return;
            }

            const item = getMediaFromCard(card);
            const checkbox = card.querySelector(".pg-select-wrap input");

            if (!item || !checkbox) {
                return;
            }

            if (isMobileLayout() && (state.selectionMode || state.selectedMediaIds.size > 0)) {
                const selected = !state.selectedMediaIds.has(item.id);
                checkbox.checked = selected;
                card.classList.toggle("pg-selected", selected);
                toggleMediaSelected(item, selected);
                return;
            }

            openLightbox(getFilteredIndexFromCard(card));
        });

        grid.addEventListener("change", event => {
            const checkbox = event.target instanceof HTMLInputElement && event.target.matches(".pg-select-wrap input") ? event.target : null;
            if (!checkbox) {
                return;
            }

            const card = checkbox.closest(".pg-item[data-media-id]");
            const item = getMediaFromCard(card);
            if (!item) {
                return;
            }

            toggleMediaSelected(item, checkbox.checked);
            card.classList.toggle("pg-selected", checkbox.checked);
        });

        grid.addEventListener("keydown", event => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            if (isEditableTarget(event.target)) {
                return;
            }

            const card = getCardFromEvent(event);
            if (!card) {
                return;
            }

            event.preventDefault();
            openLightbox(getFilteredIndexFromCard(card));
        });

        grid.addEventListener("pointerdown", event => {
            const card = getCardFromEvent(event);
            if (!card || !isMobileLayout() || event.target.closest?.("a, input, label, button")) {
                return;
            }

            if (state.cardLongPressTimer) {
                clearTimeout(state.cardLongPressTimer);
            }

            state.cardLongPressTriggered = false;
            state.cardLongPressMediaId = card.dataset.mediaId || "";
            state.cardLongPressTimer = setTimeout(() => {
                const item = getMediaFromCard(card);
                const checkbox = card.querySelector(".pg-select-wrap input");

                if (!item || !checkbox || !document.body.contains(card)) {
                    return;
                }

                state.cardLongPressTriggered = true;
                setSelectionMode(true);
                checkbox.checked = true;
                toggleMediaSelected(item, true);
                card.classList.add("pg-selected");
                showToast("selection", "Selection mode enabled. Tap cards to select or clear.", {
                    level: "info",
                    timeout: 1800,
                });
            }, 430);
        }, { passive: true });

        ["pointerup", "pointercancel", "pointerout"].forEach(type => {
            grid.addEventListener(type, event => {
                if (type === "pointerout") {
                    const card = getCardFromEvent(event);
                    if (card && event.relatedTarget instanceof Node && card.contains(event.relatedTarget)) {
                        return;
                    }
                }

                if (state.cardLongPressTimer) {
                    clearTimeout(state.cardLongPressTimer);
                    state.cardLongPressTimer = null;
                }
            }, { passive: true });
        });

        grid.addEventListener("pointerover", event => {
            const card = getCardFromEvent(event);
            if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) {
                return;
            }

            startPreviewVideoForCard(card);
        }, { passive: true });

        grid.addEventListener("pointerout", event => {
            const card = getCardFromEvent(event);
            if (!card || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))) {
                return;
            }

            stopActivePreviewVideo();
        }, { passive: true });
    }

    function renderGrid() {
        const grid = document.getElementById("pg-grid");
        const countAll = document.getElementById("pg-count-all");
        const countImage = document.getElementById("pg-count-image");
        const countVideo = document.getElementById("pg-count-video");

        if (!grid || !countAll) {
            return;
        }

        cancelPendingRender();
        stopActivePreviewVideo();
        attachGalleryGridHandlers(grid);
        applyGalleryGridSize();
        updateMobileUiState();
        grid.replaceChildren();

        const allMedia = getAllMedia();
        refreshPageNavigationControls(allMedia);
        let imageCount = 0;
        let videoCount = 0;

        allMedia.forEach(item => {
            if (item.type === "image") {
                imageCount += 1;
            } else if (item.type === "video") {
                videoCount += 1;
            }
        });

        state.filteredMedia = getFilteredMedia();
        countAll.innerText = String(allMedia.length);

        if (countImage) {
            countImage.innerText = String(imageCount);
        }

        if (countVideo) {
            countVideo.innerText = String(videoCount);
        }

        if (state.filteredMedia.length === 0) {
            const hasMedia = allMedia.length > 0;
            grid.innerHTML = `
                <div class="pg-empty-state">
                    <div class="pg-empty-state-title">${hasMedia ? "No media matches this view" : "No media found yet"}</div>
                    <div class="pg-empty-state-body">
                        ${hasMedia ? "Clear the search, switch filters, or scan again." : "Open a thread page and scan, or wait for the automatic thread scan to finish."}
                    </div>
                </div>`;
            updateSelectionSummary();
            updateDesktopOverview();
            return;
        }

        const displayOrder = (isMobileLayout() || state.groupByPage) ? state.filteredMedia.slice() : reorderForColumns(state.filteredMedia, getColumnCount());
        const filteredIndexById = new Map(state.filteredMedia.map((item, index) => [item.id, index]));
        const token = ++state.renderToken;
        let cursor = 0;

        const appendChunk = () => {
            if (token !== state.renderToken || !document.body.contains(grid)) {
                return;
            }

            const fragment = document.createDocumentFragment();
            const end = Math.min(displayOrder.length, cursor + config.renderChunkSize);

            while (cursor < end) {
                const item = displayOrder[cursor];
                if (state.groupByPage) {
                    const previous = cursor > 0 ? displayOrder[cursor - 1] : null;
                    if (!previous || Number(previous.pageNumber) !== Number(item.pageNumber)) {
                        const heading = document.createElement("div");
                        heading.className = "pg-page-group-heading";
                        heading.textContent = `Page ${item.pageNumber || "?"}`;
                        fragment.appendChild(heading);
                    }
                }
                fragment.appendChild(createMediaCard(item, filteredIndexById.get(item.id) ?? cursor));
                cursor += 1;
            }

            grid.appendChild(fragment);

            if (cursor < displayOrder.length) {
                requestAnimationFrame(appendChunk);
            }
        };

        appendChunk();
        updateSelectionSummary();
        updateDesktopOverview();
    }

    async function openGallery() {
        buildGalleryUI();

        state.container = document.getElementById("pg-container");
        state.lightbox = document.getElementById("pg-lightbox");
        state.container?.classList.remove("pg-debug-only");

        lockBodyScroll();

        requestAnimationFrame(() => {
            document.getElementById("pg-container")?.classList.add("pg-visible");
        });

        await loadThreadMetadataCache();
        addMediaItems(scanMedia(document, getThreadInfo()?.currentPage || 1));
        renderGrid();
        void updateCacheStats();

        if (!state.scanStarted && isThreadPage()) {
            await scanAllThreadPages();
        }
    }

    async function runManualRescan() {
        state.mediaById.clear();
        state.selectedMediaIds.clear();
        state.autoSelectNewMedia = true;
        state.selectionMode = false;
        invalidateMediaCaches();
        invalidateSelectionCaches();
        renderGrid();
        state.scanStarted = false;
        await scanAllThreadPages();
    }

    function closeGallery() {
        const container = document.getElementById("pg-container");

        if (!container) {
            return;
        }

        cancelScan();
        closeLightbox();
        hideShortcutHelp();
        closeGalleryMoreSheet();
        container.classList.remove("pg-visible", "pg-debug-only");

        setTimeout(() => container.remove(), 300);

        unlockBodyScroll();
        document.removeEventListener("keydown", handleKeyInput);

        if (state.lazyObserverTimer) {
            clearTimeout(state.lazyObserverTimer);
            state.lazyObserverTimer = null;
        }

        if (state.gallerySearchTimer) {
            clearTimeout(state.gallerySearchTimer);
            state.gallerySearchTimer = null;
        }

        cancelPendingRender();
        stopActivePreviewVideo();
        void flushThreadMetadataCacheSave();

        if (lazyImageObserver) {
            lazyImageObserver.disconnect();
        }

        retryQueue.length = 0;
        isRetrying = false;
        state.container = null;
        state.lightbox = null;
        state.selectionMode = false;
        state.galleryMoreOpen = false;
    }

    function openLightbox(index) {
        state.currentIndex = index;

        const lightbox = document.getElementById("pg-lightbox");

        if (!lightbox) {
            return;
        }

        state.lightboxControlsHidden = false;
        lightbox.classList.remove("pg-controls-hidden");
        lightbox.classList.add("active");
        resetLightboxZoom();
        updateLightboxContent();
    }

    function closeLightbox() {
        const lightbox = document.getElementById("pg-lightbox");
        const stage = document.getElementById("pg-lb-stage");

        stage?.querySelectorAll("video").forEach(video => video.pause());
        resetLightboxZoom();
        state.lightboxControlsHidden = false;
        lightbox?.classList.remove("active", "pg-controls-hidden", "pg-video-open");
    }

    function navLightbox(direction) {
        const newIndex = state.currentIndex + direction;

        if (newIndex >= 0 && newIndex < state.filteredMedia.length) {
            state.currentIndex = newIndex;
            resetLightboxZoom();
            updateLightboxContent();
        }
    }

    function updateLightboxContent() {
        const item = state.filteredMedia[state.currentIndex];
        const stage = document.getElementById("pg-lb-stage");
        const lightbox = document.getElementById("pg-lightbox");
        const counter = document.querySelector(".pg-lb-counter");
        const prevButton = document.getElementById("pg-prev");
        const nextButton = document.getElementById("pg-next");
        const postLink = document.getElementById("pg-post-current");
        const openLink = document.getElementById("pg-open-current");
        const downloadLink = document.getElementById("pg-download-current");

        if (!item || !stage || !counter || !prevButton || !nextButton || !openLink || !downloadLink || !postLink) {
            return;
        }

        const fileName = buildFileName(item, state.currentIndex);

        lightbox?.classList.toggle("pg-video-open", item.type === "video");

        prevButton.disabled = state.currentIndex === 0;
        nextButton.disabled = state.currentIndex === state.filteredMedia.length - 1;
        counter.innerText = `${state.currentIndex + 1} / ${state.filteredMedia.length} · ${item.type === "video" ? `Video · ${formatDuration(item.durationSeconds)}` : "Image"} · Page ${item.pageNumber || "?"}${Number.isFinite(Number(item.likeCount)) ? ` · ♥ ${formatLikes(item.likeCount)}` : ""}`;

        postLink.href = item.postUrl || "#";
        postLink.style.display = item.postUrl ? "" : "none";

        openLink.href = item.src;
        downloadLink.href = item.src;
        downloadLink.download = fileName;

        resetLightboxZoom();
        stage.innerHTML = `<div class="pg-loader"></div>`;

        if (item.type === "video") {
            if (isIOS) {
                renderIOSVideoLightbox(stage, item);
                return;
            }

            const mediaElement = document.createElement("video");

            mediaElement.className = "pg-lb-media";
            mediaElement.controls = true;
            mediaElement.playsInline = true;
            mediaElement.autoplay = true;
            mediaElement.volume = config.volume;

            if (item.poster) {
                mediaElement.poster = item.poster;
            }

            const sources = item.sources?.length ? item.sources : [item.src];

            sources.forEach(sourceUrl => {
                const source = document.createElement("source");
                source.src = sourceUrl;
                source.type = getVideoMimeType(getExtension(sourceUrl));
                mediaElement.appendChild(source);
            });

            mediaElement.oncanplay = () => stage.querySelector(".pg-loader")?.remove();
            mediaElement.onloadedmetadata = () => {
                if (Number.isFinite(mediaElement.duration) && mediaElement.duration > 0) {
                    saveCachedVideoDuration(item, mediaElement.duration);
                    counter.innerText = `${state.currentIndex + 1} / ${state.filteredMedia.length} · Video · ${formatDuration(item.durationSeconds)} · Page ${item.pageNumber || "?"}${Number.isFinite(Number(item.likeCount)) ? ` · ♥ ${formatLikes(item.likeCount)}` : ""}`;
                    scheduleThreadMetadataCacheSave();
                    scheduleRenderGrid();
                }
            };
            mediaElement.onerror = () => stage.querySelector(".pg-loader")?.remove();

            stage.appendChild(mediaElement);
            renderLightboxFilmstrip();
            return;
        }

        const mediaElement = document.createElement("img");

        mediaElement.className = "pg-lb-media";
        mediaElement.src = item.src;
        mediaElement.onload = () => stage.querySelector(".pg-loader")?.remove();
        mediaElement.onerror = () => {
            stage.querySelector(".pg-loader")?.remove();
            stage.insertAdjacentHTML("beforeend", `<div style="color:#fff; text-align:center;">Failed to load full size image.</div>`);
        };

        stage.appendChild(mediaElement);
        renderLightboxFilmstrip();
    }

    function renderIOSVideoLightbox(stage, item) {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:relative; display:flex; align-items:center; justify-content:center; max-width:100%; max-height:100%; cursor:pointer;";

        if (item.poster) {
            const img = document.createElement("img");
            img.src = item.poster;
            img.className = "pg-lb-media";
            img.onload = () => stage.querySelector(".pg-loader")?.remove();
            img.onerror = () => stage.querySelector(".pg-loader")?.remove();
            wrapper.appendChild(img);
        } else {
            stage.querySelector(".pg-loader")?.remove();
            wrapper.style.width = "80%";
            wrapper.style.height = "60%";
            wrapper.style.background = "#111";
            wrapper.style.borderRadius = "8px";
        }

        const playButton = document.createElement("div");
        playButton.className = "pg-ios-play-btn";
        playButton.innerHTML = `<svg viewBox="0 0 24 24" width="32" height="32" fill="white"><path d="M8 5v14l11-7z"/></svg>`;

        playButton.addEventListener("click", event => {
            event.stopPropagation();
            window.open(item.src, "_blank");
        });

        wrapper.addEventListener("click", () => {
            window.open(item.src, "_blank");
        });

        wrapper.appendChild(playButton);
        stage.appendChild(wrapper);
        renderLightboxFilmstrip();
    }



    function renderLightboxFilmstrip() {
        const strip = document.getElementById("pg-lb-filmstrip");
        if (!strip) {
            return;
        }

        strip.innerHTML = "";

        if (isMobileLayout() || state.filteredMedia.length <= 1) {
            return;
        }

        const radius = 12;
        const start = Math.max(0, state.currentIndex - radius);
        const end = Math.min(state.filteredMedia.length, state.currentIndex + radius + 1);

        state.filteredMedia.slice(start, end).forEach((item, offset) => {
            const index = start + offset;
            const button = document.createElement("button");
            button.type = "button";
            button.className = index === state.currentIndex ? "pg-lb-thumb active" : "pg-lb-thumb";
            button.setAttribute("aria-label", `Open media ${index + 1}`);

            const thumb = item.thumb || item.poster || (item.type === "image" ? item.src : "");
            if (thumb) {
                const img = document.createElement("img");
                img.src = thumb;
                img.loading = "lazy";
                img.alt = "";
                button.appendChild(img);
            } else {
                const fallback = document.createElement("div");
                fallback.className = "pg-lb-thumb-placeholder";
                fallback.textContent = item.type === "video" ? "VID" : "IMG";
                button.appendChild(fallback);
            }

            button.addEventListener("click", event => {
                event.preventDefault();
                state.currentIndex = index;
                updateLightboxContent();
            });

            strip.appendChild(button);

            if (index === state.currentIndex) {
                requestAnimationFrame(() => button.scrollIntoView({ block: "nearest", inline: "center" }));
            }
        });
    }

    function handleKeyInput(event) {
        const lightbox = document.getElementById("pg-lightbox");
        const isLightboxOpen = lightbox && lightbox.classList.contains("active");
        const shortcutPanel = document.getElementById("pg-shortcut-panel");
        const isShortcutOpen = shortcutPanel && shortcutPanel.classList.contains("visible");
        const key = event.key;
        const lower = key.toLowerCase();

        if (key === "Escape") {
            if (isShortcutOpen) {
                hideShortcutHelp();
            } else if (state.galleryMoreOpen) {
                closeGalleryMoreSheet();
            } else if (state.debugPanelOpen) {
                setDebugPanelVisible(false);
            } else if (isLightboxOpen) {
                closeLightbox();
            } else {
                closeGallery();
            }
            return;
        }

        if (isEditableTarget(event.target)) {
            return;
        }

        if (isLightboxOpen) {
            if (key === "ArrowLeft") {
                event.preventDefault();
                navLightbox(-1);
            } else if (key === "ArrowRight") {
                event.preventDefault();
                navLightbox(1);
            } else if (key === "Home") {
                event.preventDefault();
                state.currentIndex = 0;
                updateLightboxContent();
            } else if (key === "End") {
                event.preventDefault();
                state.currentIndex = Math.max(0, state.filteredMedia.length - 1);
                updateLightboxContent();
            } else if (lower === "i") {
                event.preventDefault();
                toggleLightboxControls();
            }
            return;
        }

        if (key === "/") {
            event.preventDefault();
            focusGallerySearch();
            return;
        }

        if (lower === "?") {
            event.preventDefault();
            showShortcutHelp();
            return;
        }

        if (lower === "a") {
            event.preventDefault();
            selectAllMedia();
        } else if (lower === "v") {
            event.preventDefault();
            selectVisibleMedia();
        } else if (lower === "n") {
            event.preventDefault();
            deselectAllMedia();
        } else if (lower === "z") {
            event.preventDefault();
            void downloadAllAsZip();
        } else if (lower === "u") {
            event.preventDefault();
            exportUrls();
        } else if (lower === "d") {
            event.preventDefault();
            toggleDebugPanel();
        } else if (lower === "s") {
            event.preventDefault();
            void runManualRescan();
        } else if (lower === "c") {
            event.preventDefault();
            toggleChromeCollapsed();
        } else if (lower === "t") {
            event.preventDefault();
            void hydrateVideoDurations("shortcut");
        } else if (key === "+" || key === "=") {
            event.preventDefault();
            changeGalleryCardSizeStep(1);
        } else if (key === "-" || key === "_") {
            event.preventDefault();
            changeGalleryCardSizeStep(-1);
        }
    }

    function lockBodyScroll() {
        state.savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        document.body.style.position = "fixed";
        document.body.style.top = `-${state.savedScrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = "100%";
        document.body.style.overflow = "hidden";
    }

    function unlockBodyScroll() {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, state.savedScrollY);
    }

