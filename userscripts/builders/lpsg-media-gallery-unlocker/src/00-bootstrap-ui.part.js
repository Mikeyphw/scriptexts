// ==UserScript==
// @name         LPSG Media Gallery Unlocker
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/lpsg-media-gallery-unlocker
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/standalone/lpsg-media-gallery-unlocker
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/lpsg-media-gallery-unlocker/lpsg-media-gallery-unlocker.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/lpsg-media-gallery-unlocker/lpsg-media-gallery-unlocker.user.js
// @version      6.7.4-optimized
// @description  Optimized LPSG media gallery with complete post-scoped discovery, streaming ZIPs, page-title archive names, mobile-safe defaults, smart source fallback, and lightweight optional resume caching.
// @author       CurlyWurly
// @match        https://www.lpsg.com/*
// @icon         data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/Pjxzdmcgdmlld0JveD0iMCAwIDI1NiAyNTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PHJlY3QgZmlsbD0ibm9uZSIgaGVpZ2h0PSIyNTYiIHdpZHRoPSIyNTYiLz48cGF0aCBkPSJNOTMuMiwxMjIuOEE3MC4zLDcwLjMsMCwwLDEsODgsOTZhNzIsNzIsMCwxLEsNzIsNzIsNzAuMyw3MC4zLDAsMCwxLTI2LjgtNS4yaDBMMTIwLDE3Nkg5NnYyNEg3MnYyMEgzMlYxODRsNjEuMi02MS4yWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZENzAwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMTYiLz48Y2lyY2xlIGN4PSIxODAiIGN5PSI3NiIgcj0iMTIiIGZpbGw9IiNGRkQ3MDAiLz48L3N2Zz4=
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.8.26/dist/zip.min.js
// @license      MIT
// ==/UserScript==

(function () {
    "use strict";

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const coarsePointerQuery = window.matchMedia?.("(hover: none), (pointer: coarse)") || null;
    let isCoarsePointer = Boolean(coarsePointerQuery?.matches);
    let isMobileProfile = isAndroid || isIOS || window.innerWidth <= 700 || navigator.maxTouchPoints > 1 || isCoarsePointer;

    function refreshDeviceProfile() {
        isCoarsePointer = Boolean(coarsePointerQuery?.matches);
        isMobileProfile = isAndroid || isIOS || window.innerWidth <= 700 || navigator.maxTouchPoints > 1 || isCoarsePointer;
        const container = document.getElementById("pg-container");
        if (container) {
            container.classList.toggle("pg-mobile-profile", isMobileProfile);
            container.classList.toggle("pg-coarse-pointer", isCoarsePointer);
            container.dataset.deviceProfile = isMobileProfile ? "mobile" : "desktop";
        }
        return isMobileProfile;
    }

    window.addEventListener("resize", refreshDeviceProfile, { passive: true });
    coarsePointerQuery?.addEventListener?.("change", refreshDeviceProfile);

    const config = {
        volume: 0.1,
        formats: ["mp4", "m4v", "mov"],
        imageFormats: ["jpg", "jpeg", "png", "gif", "webp", "avif"],
        glassBase: "rgba(20, 20, 20, 0.85)",
        glassBorder: "1px solid rgba(255, 255, 255, 0.1)",
        highlight: "#FFD700",
        maxRetries: isMobileProfile ? 2 : 3,
        retryDelay: isMobileProfile ? 750 : 1000,
        fetchConcurrency: isMobileProfile ? 2 : 4,
        zipConcurrency: isMobileProfile ? 2 : 4,
        scanConcurrency: isMobileProfile ? 2 : 4,
        uiYieldEvery: isMobileProfile ? 4 : 8,
        renderChunkSize: isMobileProfile ? 36 : 96,
        renderDebounceMs: 80,
        lazyObserverDebounceMs: 120,
        eagerImageCount: isMobileProfile ? 10 : 18,
        metadataSaveDebounceMs: 1500,
        searchDebounceMs: 120,
        hoverPreviewDelayMs: 360,
        debugMaxEntries: isMobileProfile ? 400 : 800,
        observerDebounceMs: 250,
        maxPages: 1000,
        zipItemTimeoutMs: isMobileProfile ? 120000 : 60000,
        cacheDbName: "pg_gallery_cache_v2",
        cacheDbVersion: 1,
        enableBlobCache: true,
        autoDeleteAfterSuccessfulZip: true,
        maxBlobCacheBytes: isMobileProfile ? 256 * 1024 * 1024 : 750 * 1024 * 1024,
        maxSingleBlobBytes: isMobileProfile ? 96 * 1024 * 1024 : 250 * 1024 * 1024,
        maxZipBlobBytes: isMobileProfile ? 64 * 1024 * 1024 : 512 * 1024 * 1024,
        zipPartSizePresetsMiB: [32, 64, 96, 256, 512],
        staleCacheMs: isMobileProfile ? 4 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
        metadataCacheTtlMs: 7 * 24 * 60 * 60 * 1000,
        cacheStatsDebounceMs: isMobileProfile ? 5000 : 2500,
        scanBatchPages: isMobileProfile ? 3 : 4,
        scanFetchMaxAttempts: 4,
        scanRetryBaseMs: 800,
        scanRetryMaxMs: 8000,
        pageScanCacheTtlMs: 24 * 60 * 60 * 1000,
        pageScanTailRevalidateCount: 2,
        zipProgressIntervalMs: isMobileProfile ? 500 : 250,
        debugLevel: localStorage.getItem("pg_debug_level") || "summary", // summary | verbose | trace
        galleryGridGap: isMobileProfile ? 8 : 15,
        galleryCardSizes: {
            compact: { label: "Compact", mobileWidth: 132, desktopWidth: 170 },
            comfortable: { label: "Comfortable", mobileWidth: 170, desktopWidth: 220 },
            large: { label: "Large", mobileWidth: 220, desktopWidth: 280 },
            xlarge: { label: "XL", mobileWidth: 280, desktopWidth: 360 },
        },
        defaultGalleryCardSize: isMobileProfile ? "compact" : "comfortable",
    };

    const state = {
        mediaById: new Map(),
        filteredMedia: [],
        currentIndex: 0,
        filter: "all",
        container: null,
        lightbox: null,
        scanStarted: false,
        scanRunning: false,
        scanAbortController: null,
        scanPageFailures: new Map(),
        observer: null,
        pendingRoots: new Set(),
        debounceTimer: null,
        savedScrollY: 0,
        lastKnownPage: 1,
        debugLogs: [],
        debugPanelOpen: false,
        debugRunId: 0,
        zipJobSummary: null,
        zipRunning: false,
        selectedMediaIds: new Set(),
        autoSelectNewMedia: true,
        fabMenuOpen: false,
        toastTimers: new Map(),
        cacheSizeBytes: 0,
        tempCacheSizeBytes: 0,
        keepTempCacheAfterZip: false,
        zipPaused: false,
        zipAbortController: null,
        lastFailedZipEntries: [],
        lastZipItems: [],
        currentZipJobId: "",
        blockedZipSourceHosts: new Map(),
        zipSourceScores: new Map(),
        zipPartSizeMiB: Number(localStorage.getItem("pg_zip_part_size_mib")) || 0,
        zipGrouping: localStorage.getItem("pg_zip_grouping") === "page" ? "page" : "selection",
        cacheStatsTimer: null,
        galleryCardSize: localStorage.getItem("pg_gallery_card_size") || config.defaultGalleryCardSize,
        selectionMode: false,
        galleryMoreOpen: false,
        lightboxControlsHidden: false,
        lightboxZoomed: false,
        gallerySearch: "",
        pageFilter: "all",
        selectedOnly: false,
        groupByPage: false,
        gallerySort: localStorage.getItem("pg_gallery_sort") || "scan",
        chromeCollapsed: localStorage.getItem("pg_chrome_collapsed") === "1",
        videoDurationHydrationRunning: false,
        videoDurationHydrationQueued: false,
        desktopDetailsOpen: localStorage.getItem("pg_desktop_details_open") !== "0",
        shortcutsOpen: false,
        mediaRevision: 0,
        selectionRevision: 0,
        allMediaCache: null,
        filteredMediaCache: null,
        renderRafId: 0,
        renderDebounceTimer: null,
        renderToken: 0,
        lazyObserverTimer: null,
        metadataSaveTimer: null,
        gallerySearchTimer: null,
        activePreviewVideo: null,
        hoverPreviewTimer: null,
        cardLongPressTimer: null,
        cardLongPressMediaId: "",
        cardLongPressTriggered: false,
    };

    const styles = `
        :root {
            --pg-glass: ${config.glassBase};
            --pg-border: ${config.glassBorder};
            --pg-highlight: ${config.highlight};
            --pg-text: #fff;
            --pg-muted: #aaa;
            --pg-safe-bottom: env(safe-area-inset-bottom, 0px);
            --pg-card-min-width: 220px;
            --pg-grid-gap: 15px;
        }

        .p-navgroup-link--iconic--media { color: inherit; }
        .pg-gallery-launcher { cursor: pointer; }

        .pg-floating-launcher {
            position: fixed;
            right: 16px;
            bottom: calc(16px + var(--pg-safe-bottom));
            z-index: 99998;
            border: none;
            border-radius: 999px;
            background: #222;
            color: #fff;
            padding: 12px 16px;
            min-height: 44px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(0,0,0,0.34);
            touch-action: manipulation;
        }


        .pg-floating-launcher.pg-tools-open {
            background: #333;
            color: var(--pg-highlight);
        }

        .pg-tools-menu {
            position: fixed;
            right: 16px;
            bottom: calc(70px + var(--pg-safe-bottom));
            z-index: 99998;
            display: none;
            min-width: 220px;
            padding: 8px;
            border: var(--pg-border);
            border-radius: 18px;
            background: rgba(20, 20, 20, 0.94);
            box-shadow: 0 8px 26px rgba(0,0,0,0.45);
            backdrop-filter: blur(12px);
        }

        .pg-tools-menu.visible {
            display: grid;
            gap: 6px;
        }

        .pg-tools-menu button {
            width: 100%;
            border: var(--pg-border);
            border-radius: 12px;
            background: rgba(255,255,255,0.06);
            color: #fff;
            padding: 11px 12px;
            min-height: 44px;
            text-align: left;
            font-size: 13px;
            font-weight: 650;
            cursor: pointer;
            touch-action: manipulation;
        }

        .pg-tools-menu button:hover {
            border-color: var(--pg-highlight);
            background: rgba(255, 215, 0, 0.12);
        }

        .pg-tools-title {
            display: none;
        }

        .pg-selection-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            padding: 10px 18px;
            border-bottom: var(--pg-border);
            background: rgba(0,0,0,0.28);
            color: var(--pg-muted);
            font-size: 13px;
        }

        .pg-selection-count {
            color: #fff;
            font-weight: 700;
            margin-right: auto;
        }

        .pg-select-btn {
            background: transparent;
            border: var(--pg-border);
            color: #ddd;
            padding: 7px 12px;
            min-height: 36px;
            border-radius: 999px;
            cursor: pointer;
            touch-action: manipulation;
        }

        .pg-select-btn:hover {
            border-color: var(--pg-highlight);
            color: #fff;
        }

        .pg-size-control {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            min-height: 36px;
            border: var(--pg-border);
            border-radius: 999px;
            color: #ddd;
            background: rgba(255,255,255,0.03);
            white-space: nowrap;
        }

        .pg-size-control select {
            min-height: 28px;
            border: 0;
            border-radius: 999px;
            background: #222;
            color: #fff;
            padding: 3px 8px;
        }

        .pg-select-wrap {
            position: absolute;
            top: 8px;
            left: 8px;
            z-index: 7;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 999px;
            background: rgba(0,0,0,0.68);
            border: 1px solid rgba(255,255,255,0.18);
            backdrop-filter: blur(4px);
        }

        .pg-select-wrap input {
            width: 20px;
            height: 20px;
            accent-color: var(--pg-highlight);
            cursor: pointer;
        }

        .pg-item.pg-selected {
            border-color: rgba(255, 215, 0, 0.85);
            box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.22);
        }


        .pg-cache-pill {
            color: #ddd;
            border: var(--pg-border);
            border-radius: 999px;
            padding: 7px 11px;
            background: rgba(255,255,255,0.05);
            white-space: nowrap;
        }

        .pg-sticky-download-bar {
            position: sticky;
            bottom: 0;
            z-index: 20;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            padding: 10px 18px calc(10px + var(--pg-safe-bottom));
            border-top: var(--pg-border);
            background: rgba(0,0,0,0.78);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }

        .pg-sticky-download-bar .pg-selection-count {
            margin-right: auto;
        }

        .pg-page-heading {
            break-inside: avoid;
            margin: 8px 0 12px;
            padding: 8px 10px;
            border: var(--pg-border);
            border-radius: 10px;
            background: rgba(255,255,255,0.06);
            color: #fff;
            font-size: 12px;
            font-weight: 800;
        }

        #pg-container {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.92);
            backdrop-filter: blur(15px);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            overscroll-behavior: none;
            color: #fff;
        }

        #pg-container.pg-visible {
            opacity: 1;
            pointer-events: auto;
        }

        #pg-container.pg-debug-only {
            opacity: 1;
            pointer-events: none;
            background: transparent;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }

        #pg-container.pg-debug-only > :not(#pg-debug-panel) {
            display: none !important;
        }

        #pg-container.pg-debug-only #pg-debug-panel {
            pointer-events: auto;
        }

        .pg-header {
            padding: 14px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            background: rgba(0,0,0,0.4);
            border-bottom: var(--pg-border);
            flex-shrink: 0;
        }

        .pg-filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }

        .pg-filter-btn,
        .pg-action-btn {
            background: transparent;
            border: var(--pg-border);
            color: #aaa;
            padding: 8px 15px;
            min-height: 40px;
            border-radius: 999px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
            touch-action: manipulation;
        }

        .pg-filter-btn.active,
        .pg-filter-btn:hover,
        .pg-action-btn:hover {
            background: rgba(255, 215, 0, 0.15);
            border-color: var(--pg-highlight);
            color: #fff;
        }

        .pg-action-btn:disabled {
            opacity: 0.45;
            cursor: wait;
        }

        .pg-close {
            background: none;
            border: none;
            color: #fff;
            font-size: 28px;
            cursor: pointer;
            min-width: 44px;
            min-height: 44px;
            touch-action: manipulation;
        }


        .pg-zip-job-summary { margin: 10px 16px; padding: 14px; border: var(--pg-border); border-radius: 16px; background: rgba(255,255,255,.055); }
        .pg-zip-job-summary[hidden] { display:none; }
        .pg-zip-job-title { font-weight: 800; font-size: 16px; }
        .pg-zip-job-count { margin-top: 5px; font-size: 15px; }
        .pg-zip-job-meta, .pg-zip-job-problems { margin-top: 5px; color: var(--pg-muted); font-size: 13px; line-height: 1.4; }
        .pg-zip-job-problems { color: #ffcc66; }

        .pg-progress {
            display: none;
            padding: 10px 20px;
            border-bottom: var(--pg-border);
            background: rgba(0,0,0,0.35);
            color: var(--pg-muted);
            font-size: 13px;
        }

        .pg-progress.visible { display: block; }

        .pg-progress-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }

        .pg-progress-bar {
            overflow: hidden;
            height: 5px;
            margin-top: 8px;
            border-radius: 999px;
            background: rgba(255,255,255,0.13);
        }

        .pg-progress-fill {
            width: 0%;
            height: 100%;
            background: var(--pg-highlight);
            transition: width 0.2s ease;
        }

        .pg-toast-host {
            position: fixed;
            left: 14px;
            bottom: calc(14px + var(--pg-safe-bottom));
            z-index: 100002;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: min(420px, calc(100vw - 28px));
            pointer-events: none;
        }

        .pg-toast {
            pointer-events: auto;
            overflow: hidden;
            border: var(--pg-border);
            border-radius: 14px;
            background: rgba(18,18,18,0.96);
            color: #fff;
            box-shadow: 0 10px 26px rgba(0,0,0,0.42);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }

        .pg-toast-body {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 14px;
        }

        .pg-toast-message {
            min-width: 0;
            font-size: 13px;
            line-height: 1.35;
            overflow-wrap: anywhere;
        }

        .pg-toast-close {
            flex: 0 0 auto;
            min-width: 32px;
            min-height: 32px;
            border: none;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            cursor: pointer;
            touch-action: manipulation;
        }

        .pg-toast-progress {
            height: 4px;
            background: rgba(255,255,255,0.14);
        }

        .pg-toast-progress-fill {
            width: 0%;
            height: 100%;
            background: var(--pg-highlight);
            transition: width 0.2s ease;
        }

        .pg-toast.ok .pg-toast-progress-fill { background: #42d392; }
        .pg-toast.warn .pg-toast-progress-fill { background: #ffcc66; }
        .pg-toast.error .pg-toast-progress-fill { background: #ff5f5f; }

        .pg-toast-actions {
            display: flex;
            gap: 8px;
            padding: 0 14px 12px;
            flex-wrap: wrap;
        }

        .pg-toast-actions a,
        .pg-toast-actions button {
            border: var(--pg-border);
            border-radius: 999px;
            background: rgba(255,255,255,0.06);
            color: #fff;
            min-height: 38px;
            padding: 8px 12px;
            font-size: 13px;
            text-decoration: none;
            cursor: pointer;
            touch-action: manipulation;
        }

        #pg-debug-panel {
            position: fixed;
            right: 14px;
            top: 76px;
            bottom: calc(14px + var(--pg-safe-bottom));
            width: min(720px, calc(100vw - 28px));
            z-index: 100001;
            display: none;
            flex-direction: column;
            background: rgba(10,10,10,0.96);
            border: var(--pg-border);
            border-radius: 14px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.55);
            overflow: hidden;
        }

        #pg-debug-panel.visible { display: flex; }

        .pg-debug-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 10px 12px;
            border-bottom: var(--pg-border);
            background: rgba(255,255,255,0.04);
        }

        .pg-debug-title {
            font-weight: 700;
            font-size: 13px;
            color: #fff;
        }

        .pg-debug-actions {
            display: flex;
            gap: 7px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .pg-debug-actions button {
            min-height: 34px;
            border-radius: 999px;
            border: var(--pg-border);
            background: transparent;
            color: #ddd;
            cursor: pointer;
            padding: 6px 10px;
            font-size: 12px;
        }

        .pg-debug-actions button:hover {
            border-color: var(--pg-highlight);
            color: #fff;
        }

        .pg-debug-summary {
            padding: 8px 12px;
            color: var(--pg-muted);
            font-size: 12px;
            border-bottom: var(--pg-border);
            overflow-wrap: anywhere;
        }

        .pg-debug-log {
            flex: 1;
            overflow: auto;
            padding: 10px 12px;
            font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            color: #ddd;
            -webkit-overflow-scrolling: touch;
        }

        .pg-debug-entry {
            padding: 7px 0;
            border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .pg-debug-entry.info { color: #d6e8ff; }
        .pg-debug-entry.ok { color: #c8f7c5; }
        .pg-debug-entry.warn { color: #ffe3a3; }
        .pg-debug-entry.error { color: #ffb4b4; }


        .pg-gallery-scroll {
            flex-grow: 1;
            overflow-y: auto;
            padding: 20px;
            scrollbar-width: thin;
            scrollbar-color: #444 transparent;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
        }

        .pg-grid {
            column-width: var(--pg-card-min-width);
            column-gap: var(--pg-grid-gap);
            width: 100%;
            max-width: 1800px;
            margin: 0 auto;
        }

        .pg-page-group-heading {
            column-span: all;
            break-after: avoid;
            margin: 12px 0 8px;
            padding: 8px 10px;
            border-radius: 8px;
            background: rgba(255,255,255,.07);
            font-weight: 700;
            color: #f2f2f2;
        }

        .pg-item {
            break-inside: avoid;
            margin-bottom: var(--pg-grid-gap);
            position: relative;
            content-visibility: auto;
            contain-intrinsic-size: auto 320px;
            border-radius: 8px;
            overflow: hidden;
            border: var(--pg-border);
            background: #111;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .pg-item:hover {
            transform: scale(1.02);
            z-index: 2;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        }

        .pg-item img,
        .pg-item video {
            width: 100%;
            height: auto;
            display: block;
            object-fit: cover;
        }

        .pg-preview-video {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
            pointer-events: none;
        }

        .pg-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            pointer-events: none;
            backdrop-filter: blur(4px);
            z-index: 5;
        }

        .pg-badge.video { color: var(--pg-highlight); }

        .pg-meta {
            padding: 8px 10px;
            border-top: var(--pg-border);
            color: var(--pg-muted);
            font-size: 11px;
            overflow-wrap: anywhere;
        }

        .pg-meta a {
            color: #8ab4f8;
            text-decoration: none;
        }

        .pg-status-overlay {
            position: absolute;
            inset: 0;
            background: rgba(20, 20, 20, 0.85);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 4;
            backdrop-filter: blur(2px);
            opacity: 1;
            transition: opacity 0.3s;
        }

        .pg-status-text {
            color: #ccc;
            font-size: 12px;
            margin-top: 5px;
            text-align: center;
        }

        .pg-status-icon { font-size: 20px; }
        .pg-status-retry { color: var(--pg-highlight); animation: pg-pulse 1.5s infinite; }
        .pg-status-broken { color: #ff5555; }

        @keyframes pg-pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }

        .pg-lazy-img,
        .pg-video-poster {
            opacity: 1;
            aspect-ratio: var(--pg-media-aspect, 4 / 3);
            min-height: 0;
            background: linear-gradient(110deg, #171717 8%, #242424 18%, #171717 33%);
            background-size: 200% 100%;
            animation: pg-media-skeleton 1.35s linear infinite;
            transition: opacity 0.25s ease-in-out;
        }

        .pg-lazy-img.pg-loaded,
        .pg-video-poster.pg-loaded {
            opacity: 1;
            animation: none;
            background: #111;
        }

        .pg-lazy-img.pg-broken,
        .pg-video-poster.pg-broken { opacity: 0.28; animation: none; }

        @keyframes pg-media-skeleton {
            to { background-position-x: -200%; }
        }

        .pg-status-overlay button.pg-thumb-retry {
            margin-top: 10px;
            min-height: 38px;
            padding: 7px 12px;
            border: 1px solid rgba(255,255,255,0.22);
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            cursor: pointer;
        }

        #pg-lightbox {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.95);
            display: flex;
            flex-direction: column;
            z-index: 100000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }

        #pg-lightbox.active {
            opacity: 1;
            pointer-events: auto;
        }

        .pg-lb-content {
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 20px;
            position: relative;
        }

        .pg-lb-media {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            box-shadow: 0 0 30px rgba(0,0,0,0.5);
            border-radius: 4px;
        }

        .pg-lb-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 15px;
            display: flex;
            justify-content: center;
            z-index: 10;
            background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
        }

        .pg-lb-counter {
            font-size: 14px;
            color: #fff;
            background: rgba(0,0,0,0.4);
            padding: 4px 12px;
            border-radius: 20px;
        }

        .pg-lb-controls {
            position: absolute;
            bottom: calc(24px + var(--pg-safe-bottom));
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            align-items: center;
            background: rgba(30,30,30,0.84);
            padding: 10px 18px;
            border-radius: 30px;
            border: var(--pg-border);
            backdrop-filter: blur(10px);
            z-index: 10;
            opacity: 0.9;
            transition: opacity 0.3s ease, background 0.3s;
        }

        .pg-ctrl-btn,
        .pg-ctrl-link {
            background: none;
            border: none;
            color: #fff;
            font-size: 20px;
            cursor: pointer;
            min-width: 40px;
            min-height: 40px;
            padding: 5px 8px;
            transition: color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            touch-action: manipulation;
        }

        .pg-ctrl-btn:hover,
        .pg-ctrl-link:hover { color: var(--pg-highlight); }

        .pg-ctrl-btn:disabled {
            color: #444;
            cursor: default;
        }

        .pg-ios-play-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid rgba(255, 255, 255, 0.2);
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
        }

        .pg-ios-play-btn svg {
            filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
            margin-left: 3px;
        }

        .pg-loader {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            border: 3px solid #333;
            border-top-color: var(--pg-highlight);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @media (max-width: 700px) {
            .pg-floating-launcher {
                right: 14px;
                bottom: calc(74px + var(--pg-safe-bottom));
                padding: 12px 15px;
                border-radius: 999px;
            }


            .pg-tools-menu {
                right: 14px;
                left: 14px;
                bottom: calc(128px + var(--pg-safe-bottom));
                min-width: 0;
            }

            .pg-selection-bar {
                padding: 8px 10px;
                gap: 6px;
                overflow-x: auto;
                flex-wrap: nowrap;
                scrollbar-width: thin;
            }

            .pg-selection-count {
                flex: 0 0 auto;
                margin-right: 4px;
            }

            .pg-size-control {
                flex: 0 0 auto;
            }

            .pg-select-btn {
                flex: 0 0 auto;
                min-height: 40px;
            }

            .pg-header {
                align-items: stretch;
                padding: 10px;
                gap: 8px;
            }

            .pg-filters {
                flex: 1;
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 7px;
            }

            .pg-filter-btn,
            .pg-action-btn {
                width: 100%;
                min-height: 42px;
                padding: 7px 8px;
                font-size: 12px;
                white-space: nowrap;
            }

            .pg-close {
                align-self: start;
                padding: 0;
            }

            .pg-gallery-scroll {
                padding: 10px;
            }

            .pg-grid {
                column-gap: var(--pg-grid-gap);
            }

            .pg-item {
                border-radius: 10px;
            }

            .pg-meta {
                font-size: 10px;
                padding: 7px;
            }

            .pg-lb-content {
                padding: 44px 8px 86px;
            }


            #pg-debug-panel {
                top: 72px;
                right: 8px;
                bottom: calc(8px + var(--pg-safe-bottom));
                width: calc(100vw - 16px);
                border-radius: 12px;
            }

            .pg-debug-actions button {
                min-height: 32px;
                padding: 5px 8px;
            }

            .pg-lb-controls {
                left: 8px;
                right: 8px;
                bottom: calc(12px + var(--pg-safe-bottom));
                transform: none;
                justify-content: space-around;
                gap: 4px;
                border-radius: 18px;
                padding: 8px;
            }

            .pg-ctrl-btn,
            .pg-ctrl-link {
                min-width: 42px;
                min-height: 42px;
                font-size: 18px;
            }
        }

        @media (max-width: 420px) {
            .pg-filters {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }


        .pg-header-main {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            min-width: 0;
        }

        .pg-title-wrap {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-right: auto;
        }

        .pg-title {
            color: #fff;
            font-size: 16px;
            font-weight: 800;
            white-space: nowrap;
        }

        .pg-mobile-subtitle {
            display: none;
            color: var(--pg-muted);
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .pg-filter-segment {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }

        .pg-mobile-more {
            display: none;
        }

        .pg-desktop-actions {
            margin-left: auto;
        }

        .pg-sheet-backdrop {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: none;
            background: rgba(0,0,0,0.45);
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
        }

        .pg-sheet-backdrop.visible {
            display: block;
        }

        .pg-bottom-sheet {
            position: fixed;
            left: 50%;
            bottom: calc(12px + var(--pg-safe-bottom));
            z-index: 100001;
            display: none;
            width: min(720px, calc(100vw - 28px));
            max-height: min(74vh, 720px);
            transform: translateX(-50%);
            overflow: hidden;
            border: var(--pg-border);
            border-radius: 22px;
            background: rgba(18,18,18,0.98);
            color: #fff;
            box-shadow: 0 20px 70px rgba(0,0,0,0.62);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
        }

        .pg-bottom-sheet.visible {
            display: flex;
            flex-direction: column;
        }

        .pg-sheet-grabber {
            width: 44px;
            height: 5px;
            border-radius: 999px;
            background: rgba(255,255,255,0.25);
            margin: 10px auto 4px;
            flex: 0 0 auto;
        }

        .pg-sheet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 16px 12px;
            border-bottom: var(--pg-border);
        }

        .pg-sheet-title {
            font-size: 15px;
            font-weight: 800;
        }

        .pg-sheet-close {
            min-width: 40px;
            min-height: 40px;
            border: none;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            font-size: 22px;
            cursor: pointer;
            touch-action: manipulation;
        }

        .pg-sheet-body {
            overflow: auto;
            padding: 12px;
            -webkit-overflow-scrolling: touch;
        }

        .pg-sheet-section {
            padding: 10px 0 14px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .pg-sheet-section:last-child {
            border-bottom: none;
            padding-bottom: 6px;
        }

        .pg-sheet-section-title {
            color: var(--pg-muted);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            margin: 0 0 8px;
            text-transform: uppercase;
        }

        .pg-sheet-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
            gap: 8px;
        }

        .pg-sheet-btn,
        .pg-sheet-setting {
            width: 100%;
            min-height: 46px;
            border: var(--pg-border);
            border-radius: 14px;
            background: rgba(255,255,255,0.06);
            color: #fff;
            padding: 10px 12px;
            font-size: 13px;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
            touch-action: manipulation;
        }

        .pg-sheet-btn:hover,
        .pg-sheet-setting:hover {
            border-color: var(--pg-highlight);
            background: rgba(255, 215, 0, 0.11);
        }

        .pg-sheet-btn:disabled {
            opacity: 0.45;
            cursor: wait;
        }

        .pg-sheet-setting {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            cursor: default;
        }

        .pg-sheet-setting select {
            max-width: 150px;
            min-height: 34px;
            border: 0;
            border-radius: 999px;
            background: #222;
            color: #fff;
            padding: 5px 10px;
        }

        .pg-progress-actions {
            display: none;
            gap: 7px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .pg-progress-actions.visible {
            display: flex;
        }

        .pg-progress-actions button {
            min-height: 34px;
            border: var(--pg-border);
            border-radius: 999px;
            background: rgba(255,255,255,0.06);
            color: #fff;
            padding: 6px 10px;
            font-size: 12px;
            cursor: pointer;
            touch-action: manipulation;
        }

        .pg-sticky-status {
            color: var(--pg-muted);
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .pg-sticky-more {
            display: none;
        }

        #pg-lightbox.pg-controls-hidden .pg-lb-header,
        #pg-lightbox.pg-controls-hidden .pg-lb-controls {
            opacity: 0;
            pointer-events: none;
        }

        .pg-lb-media.pg-zoomed {
            transform: scale(2);
            cursor: zoom-out;
            transition: transform 0.18s ease;
        }

        @media (hover: none), (pointer: coarse) {
            .pg-item:hover {
                transform: none;
                box-shadow: none;
            }
        }

        @media (max-width: 700px) {
            .pg-header {
                display: block;
                padding: 8px 10px;
            }

            .pg-header-main {
                display: grid;
                grid-template-columns: 1fr auto auto;
                grid-template-areas:
                    "title more close"
                    "filters filters filters";
                align-items: center;
                gap: 8px;
            }

            .pg-title-wrap { grid-area: title; }
            .pg-filter-segment { grid-area: filters; }
            .pg-mobile-more { grid-area: more; display: inline-flex; align-items: center; justify-content: center; }
            .pg-close { grid-area: close; }
            .pg-mobile-subtitle { display: block; }
            .pg-desktop-actions { display: none !important; }

            .pg-filter-segment {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 7px;
                width: 100%;
            }

            .pg-filter-segment .pg-filter-btn {
                width: 100%;
            }

            .pg-selection-bar {
                display: none;
            }

            .pg-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: var(--pg-grid-gap);
                column-width: auto;
                column-gap: var(--pg-grid-gap);
            }

            .pg-item {
                margin-bottom: 0;
                min-width: 0;
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
            }

            .pg-item img,
            .pg-item video {
                height: auto;
            }

            .pg-select-wrap {
                width: 44px;
                height: 44px;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.15s ease;
            }

            #pg-container.pg-selection-mode .pg-select-wrap,
            .pg-item.pg-selected .pg-select-wrap {
                opacity: 1;
                pointer-events: auto;
            }

            .pg-select-wrap input {
                width: 24px;
                height: 24px;
            }

            .pg-sticky-download-bar {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto auto auto;
                gap: 8px;
                padding: 9px 10px calc(9px + var(--pg-safe-bottom));
            }

            .pg-sticky-download-bar .pg-selection-count {
                min-width: 0;
                margin-right: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .pg-sticky-status {
                grid-column: 1 / -1;
                order: 2;
                display: none;
            }

            .pg-sticky-status:not(:empty) {
                display: block;
            }

            #pg-sticky-none,
            #pg-sticky-failed {
                display: none;
            }

            .pg-sticky-more {
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .pg-progress {
                position: sticky;
                bottom: calc(58px + var(--pg-safe-bottom));
                z-index: 21;
                margin: 0 10px 8px;
                border: var(--pg-border);
                border-radius: 16px;
                background: rgba(16,16,16,0.94);
                box-shadow: 0 12px 30px rgba(0,0,0,0.45);
            }

            .pg-progress-row {
                align-items: flex-start;
                flex-direction: column;
            }

            .pg-progress-actions {
                width: 100%;
                justify-content: flex-start;
            }

            .pg-bottom-sheet {
                left: 8px;
                right: 8px;
                bottom: calc(8px + var(--pg-safe-bottom));
                width: auto;
                max-height: min(82vh, 760px);
                transform: none;
                border-radius: 22px 22px 18px 18px;
            }

            .pg-sheet-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .pg-tools-menu {
                left: 8px;
                right: 8px;
                bottom: calc(8px + var(--pg-safe-bottom));
                min-width: 0;
                max-height: 78vh;
                overflow: auto;
                border-radius: 22px;
                padding: 10px;
            }

            .pg-tools-menu.visible {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .pg-tools-menu .pg-tools-title {
                display: block;
                padding: 4px 6px 8px;
                color: #fff;
                font-weight: 800;
                font-size: 15px;
            }

            .pg-tools-menu button {
                min-height: 48px;
                border-radius: 14px;
                font-size: 14px;
            }

            .pg-lb-content {
                padding: 52px 8px 92px;
            }

            .pg-lb-controls {
                display: grid;
                grid-template-columns: auto auto auto auto auto auto;
                left: 8px;
                right: 8px;
                width: auto;
                max-width: none;
            }
        }

        @media (min-width: 520px) and (max-width: 700px) {
            .pg-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }

        @media (max-width: 380px) {
            .pg-sheet-grid {
                grid-template-columns: 1fr;
            }

            .pg-lb-controls {
                grid-template-columns: repeat(6, minmax(0, 1fr));
            }
        }

        /* Desktop and overall UX polish */
        .pg-desktop-subtitle {
            display: block;
            color: var(--pg-muted);
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 520px;
        }

        .pg-header {
            position: relative;
            z-index: 3;
        }

        .pg-desktop-actions {
            display: grid;
            grid-template-columns: repeat(4, auto);
            justify-content: end;
            align-items: center;
            gap: 8px;
            max-width: min(820px, 54vw);
        }

        .pg-action-btn.pg-primary-action {
            color: #111;
            border-color: var(--pg-highlight);
            background: var(--pg-highlight);
            font-weight: 850;
        }

        .pg-action-btn.pg-primary-action:hover {
            color: #111;
            background: #ffe76d;
        }

        .pg-desktop-toolbar-chip {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            min-height: 36px;
            padding: 5px 10px;
            border: var(--pg-border);
            border-radius: 999px;
            background: rgba(255,255,255,0.04);
            color: #ddd;
            white-space: nowrap;
        }

        .pg-search-control {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-height: 36px;
            padding: 5px 10px;
            border: var(--pg-border);
            border-radius: 999px;
            color: #ddd;
            background: rgba(255,255,255,0.04);
            white-space: nowrap;
        }

        .pg-search-control input {
            width: min(260px, 24vw);
            min-height: 28px;
            border: 0;
            outline: none;
            border-radius: 999px;
            background: #222;
            color: #fff;
            padding: 4px 10px;
        }

        .pg-search-control input::placeholder { color: #8a8a8a; }

        .pg-desktop-overview {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            padding: 12px 18px;
            border-bottom: var(--pg-border);
            background: rgba(255,255,255,0.025);
        }

        #pg-container:not(.pg-desktop-details-open) .pg-desktop-overview {
            display: none;
        }

        .pg-stat-card {
            min-width: 0;
            padding: 10px 12px;
            border: var(--pg-border);
            border-radius: 14px;
            background: rgba(255,255,255,0.055);
        }

        .pg-stat-label {
            color: var(--pg-muted);
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.07em;
            text-transform: uppercase;
        }

        .pg-stat-value {
            margin-top: 4px;
            color: #fff;
            font-size: 16px;
            font-weight: 850;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .pg-empty-state {
            max-width: 720px;
            margin: 56px auto;
            padding: 28px;
            border: var(--pg-border);
            border-radius: 22px;
            background: rgba(255,255,255,0.045);
            color: #fff;
            text-align: center;
            break-inside: avoid;
        }

        .pg-empty-state-title {
            font-size: 18px;
            font-weight: 850;
            margin-bottom: 8px;
        }

        .pg-empty-state-body {
            color: var(--pg-muted);
            line-height: 1.45;
            font-size: 13px;
        }

        .pg-card-quick-actions {
            position: absolute;
            left: 8px;
            right: 8px;
            bottom: 36px;
            z-index: 8;
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            opacity: 0;
            pointer-events: none;
            transform: translateY(6px);
            transition: opacity 0.18s ease, transform 0.18s ease;
        }

        .pg-item:hover .pg-card-quick-actions,
        .pg-item:focus-within .pg-card-quick-actions {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
        }

        .pg-card-quick-actions button,
        .pg-card-quick-actions a {
            min-height: 30px;
            padding: 5px 8px;
            border: 1px solid rgba(255,255,255,0.22);
            border-radius: 999px;
            background: rgba(0,0,0,0.72);
            color: #fff;
            text-decoration: none;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
        }

        .pg-card-quick-actions button:hover,
        .pg-card-quick-actions a:hover {
            color: #111;
            background: var(--pg-highlight);
            border-color: var(--pg-highlight);
        }

        .pg-item:focus-visible,
        .pg-filter-btn:focus-visible,
        .pg-action-btn:focus-visible,
        .pg-select-btn:focus-visible,
        .pg-sheet-btn:focus-visible,
        .pg-ctrl-btn:focus-visible,
        .pg-ctrl-link:focus-visible,
        .pg-floating-launcher:focus-visible {
            outline: 2px solid var(--pg-highlight);
            outline-offset: 3px;
        }

        .pg-shortcut-panel {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 100003;
            display: none;
            width: min(620px, calc(100vw - 34px));
            max-height: min(76vh, 700px);
            overflow: hidden;
            border: var(--pg-border);
            border-radius: 22px;
            background: rgba(16,16,16,0.98);
            color: #fff;
            box-shadow: 0 22px 80px rgba(0,0,0,0.68);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
        }

        .pg-shortcut-panel.visible { display: flex; flex-direction: column; }

        .pg-shortcut-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            border-bottom: var(--pg-border);
        }

        .pg-shortcut-title { font-weight: 850; font-size: 16px; }

        .pg-shortcut-close {
            min-width: 40px;
            min-height: 40px;
            border: 0;
            border-radius: 999px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            font-size: 22px;
            cursor: pointer;
        }

        .pg-shortcut-body {
            overflow: auto;
            padding: 12px 16px 16px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 14px;
            -webkit-overflow-scrolling: touch;
        }

        .pg-shortcut-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            color: #ddd;
            font-size: 13px;
        }

        .pg-kbd {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            min-height: 24px;
            padding: 2px 8px;
            border-radius: 7px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(255,255,255,0.07);
            color: #fff;
            font: 12px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            white-space: nowrap;
        }

        .pg-lb-filmstrip {
            position: absolute;
            left: 50%;
            bottom: calc(86px + var(--pg-safe-bottom));
            transform: translateX(-50%);
            z-index: 9;
            display: flex;
            gap: 7px;
            max-width: min(920px, calc(100vw - 80px));
            padding: 8px;
            overflow-x: auto;
            border: var(--pg-border);
            border-radius: 16px;
            background: rgba(20,20,20,0.74);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            scrollbar-width: thin;
        }

        .pg-lb-thumb {
            flex: 0 0 auto;
            width: 58px;
            height: 44px;
            border: 2px solid transparent;
            border-radius: 8px;
            overflow: hidden;
            background: rgba(255,255,255,0.08);
            cursor: pointer;
            padding: 0;
        }

        .pg-lb-thumb.active {
            border-color: var(--pg-highlight);
        }

        .pg-lb-thumb img,
        .pg-lb-thumb video,
        .pg-lb-thumb-placeholder {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .pg-lb-thumb-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--pg-highlight);
            font-size: 10px;
            font-weight: 850;
        }

        #pg-lightbox.pg-controls-hidden .pg-lb-filmstrip {
            opacity: 0;
            pointer-events: none;
        }

        @media (min-width: 701px) {
            #pg-container.pg-desktop-density-compact .pg-selection-bar {
                padding-top: 6px;
                padding-bottom: 6px;
            }

            #pg-container.pg-desktop-density-compact .pg-desktop-overview {
                padding-top: 8px;
                padding-bottom: 8px;
            }

            .pg-sticky-more { display: inline-flex; }
        }

        @media (max-width: 900px) and (min-width: 701px) {
            .pg-desktop-actions {
                grid-template-columns: repeat(3, auto);
                max-width: min(760px, 58vw);
            }

            .pg-search-control input { width: 180px; }
            .pg-shortcut-body { grid-template-columns: 1fr; }
            .pg-desktop-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 700px) {
            .pg-desktop-subtitle,
            .pg-desktop-overview,
            .pg-desktop-toolbar-chip,
            .pg-search-control,
            .pg-card-quick-actions,
            .pg-lb-filmstrip {
                display: none !important;
            }

            .pg-shortcut-panel {
                top: auto;
                bottom: calc(12px + var(--pg-safe-bottom));
                transform: translateX(-50%);
                max-height: min(74vh, 680px);
            }

            .pg-shortcut-body { grid-template-columns: 1fr; }
        }

        /* 6.5 flat/borderless focus mode and metadata UX */
        :root {
            --pg-highlight: #8b7cff;
            --pg-text: #f5f7fb;
            --pg-muted: #a8b0c0;
            --pg-border: 1px solid transparent;
            --pg-surface-0: #090b10;
            --pg-surface-1: #10131a;
            --pg-surface-2: #171b24;
            --pg-surface-3: #222838;
        }

        #pg-container {
            background: var(--pg-surface-0);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }

        .pg-header,
        .pg-selection-bar,
        .pg-progress,
        .pg-desktop-overview,
        .pg-sticky-download-bar,
        .pg-bottom-sheet,
        .pg-tools-menu,
        #pg-debug-panel,
        .pg-shortcut-panel,
        .pg-toast {
            border-color: transparent;
            background: var(--pg-surface-1);
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
        }

        .pg-header {
            padding: 10px 16px;
        }

        .pg-gallery-scroll {
            padding: 16px;
        }

        .pg-grid {
            max-width: none;
        }

        .pg-filter-btn,
        .pg-action-btn,
        .pg-select-btn,
        .pg-sheet-btn,
        .pg-sheet-setting,
        .pg-cache-pill,
        .pg-size-control,
        .pg-search-control,
        .pg-toast-actions a,
        .pg-toast-actions button,
        .pg-debug-actions button,
        .pg-ctrl-btn,
        .pg-ctrl-link {
            border-color: transparent;
            background: var(--pg-surface-2);
            color: var(--pg-text);
            box-shadow: none;
        }

        .pg-filter-btn.active,
        .pg-filter-btn:hover,
        .pg-action-btn:hover,
        .pg-select-btn:hover,
        .pg-sheet-btn:hover,
        .pg-sheet-setting:hover,
        .pg-toast-actions a:hover,
        .pg-toast-actions button:hover {
            border-color: transparent;
            background: var(--pg-surface-3);
            color: #fff;
        }

        .pg-action-btn.pg-primary-action,
        .pg-progress-fill,
        .pg-toast-progress-fill {
            background: var(--pg-highlight);
        }

        .pg-action-btn.pg-primary-action {
            color: #fff;
        }

        .pg-search-control input,
        .pg-size-control select,
        .pg-sheet-setting select {
            background: var(--pg-surface-0);
            color: var(--pg-text);
        }

        .pg-item {
            border: 0;
            border-radius: 16px;
            background: var(--pg-surface-1);
            transition: transform 0.16s ease, background 0.16s ease;
        }

        .pg-item:hover {
            transform: translateY(-2px);
            box-shadow: none;
            background: var(--pg-surface-2);
        }

        .pg-item.pg-selected {
            box-shadow: inset 0 0 0 2px var(--pg-highlight);
        }

        .pg-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 6px;
            border-top: 0;
            padding: 9px;
        }

        .pg-meta-chip {
            display: inline-flex;
            align-items: center;
            max-width: 100%;
            min-height: 24px;
            padding: 3px 7px;
            border-radius: 999px;
            background: rgba(255,255,255,0.07);
            color: #dce2ee;
            font-size: 11px;
            font-weight: 750;
            text-decoration: none;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .pg-meta-muted {
            color: #7e8799;
        }

        .pg-meta-link:hover {
            background: var(--pg-highlight);
            color: #fff;
        }

        .pg-badge {
            border-radius: 999px;
            background: rgba(9, 11, 16, 0.78);
        }

        #pg-container.pg-chrome-collapsed .pg-selection-bar,
        #pg-container.pg-chrome-collapsed .pg-desktop-overview {
            display: none !important;
        }

        #pg-container.pg-chrome-collapsed .pg-header {
            padding-block: 8px;
        }

        #pg-container.pg-chrome-collapsed .pg-desktop-subtitle {
            display: none;
        }

        #pg-container.pg-chrome-collapsed .pg-gallery-scroll {
            padding: 10px 12px 12px;
        }

        #pg-container.pg-chrome-collapsed .pg-title {
            font-size: 14px;
        }

        #pg-container.pg-chrome-collapsed:not(.pg-has-selection):not(.pg-has-job) .pg-sticky-download-bar {
            display: none;
        }

        #pg-lightbox.pg-video-open .pg-lb-content {
            padding: 64px 92px 16px 16px;
        }

        #pg-lightbox.pg-video-open .pg-lb-controls {
            top: 72px;
            right: 18px;
            bottom: auto;
            left: auto;
            transform: none;
            flex-direction: column;
            gap: 6px;
            padding: 8px;
            border-radius: 18px;
            background: rgba(16, 19, 26, 0.92);
        }

        #pg-lightbox.pg-video-open .pg-lb-filmstrip {
            display: none;
        }

        #pg-lightbox.pg-video-open .pg-lb-media {
            max-height: calc(100vh - 96px);
        }

        @media (max-width: 700px) {
            #pg-container.pg-chrome-collapsed .pg-header-main {
                grid-template-areas:
                    "title more close"
                    "filters filters filters";
            }

            #pg-container.pg-chrome-collapsed .pg-gallery-scroll {
                padding: 8px;
            }

            #pg-lightbox.pg-video-open .pg-lb-content {
                padding: 104px 8px 8px;
            }

            #pg-lightbox.pg-video-open .pg-lb-controls {
                top: calc(50px + env(safe-area-inset-top, 0px));
                left: 8px;
                right: 8px;
                bottom: auto;
                display: grid;
                grid-template-columns: repeat(6, minmax(0, 1fr));
                width: auto;
                max-width: none;
            }

            #pg-lightbox.pg-video-open .pg-lb-media {
                max-height: calc(100vh - 122px);
            }
        }

        /* Overlay 1/6: runtime mobile profile convergence.
           Do not rely on the CSS viewport alone: Android/Iceraven may expose a
           desktop-width layout viewport while still needing touch-first UI. */
        #pg-container.pg-mobile-profile .pg-header {
            display: block;
            padding: 8px 10px;
        }
        #pg-container.pg-mobile-profile .pg-header-main {
            display: grid;
            grid-template-columns: 1fr auto auto;
            grid-template-areas: "title more close" "filters filters filters";
            align-items: center;
            gap: 8px;
        }
        #pg-container.pg-mobile-profile .pg-title-wrap { grid-area: title; }
        #pg-container.pg-mobile-profile .pg-filter-segment {
            grid-area: filters;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 7px;
            width: 100%;
        }
        #pg-container.pg-mobile-profile .pg-filter-segment .pg-filter-btn { width: 100%; }
        #pg-container.pg-mobile-profile .pg-mobile-more {
            grid-area: more;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        #pg-container.pg-mobile-profile .pg-close { grid-area: close; }
        #pg-container.pg-mobile-profile .pg-mobile-subtitle { display: block; }
        #pg-container.pg-mobile-profile .pg-mobile-subtitle:empty { display: none; }
        #pg-container.pg-mobile-profile .pg-desktop-subtitle,
        #pg-container.pg-mobile-profile .pg-desktop-actions,
        #pg-container.pg-mobile-profile .pg-desktop-overview,
        #pg-container.pg-mobile-profile .pg-desktop-toolbar-chip,
        #pg-container.pg-mobile-profile .pg-selection-bar,
        #pg-container.pg-mobile-profile .pg-search-control,
        #pg-container.pg-mobile-profile .pg-card-quick-actions,
        #pg-container.pg-mobile-profile .pg-lb-filmstrip {
            display: none !important;
        }
        #pg-container.pg-mobile-profile .pg-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: var(--pg-grid-gap);
            column-width: auto;
            column-gap: var(--pg-grid-gap);
        }
        #pg-container.pg-mobile-profile .pg-item {
            margin-bottom: 0;
            min-width: 0;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        #pg-container.pg-mobile-profile .pg-select-wrap {
            width: 44px;
            height: 44px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s ease;
        }
        #pg-container.pg-mobile-profile.pg-selection-mode .pg-select-wrap {
            opacity: 1;
            pointer-events: auto;
        }
        #pg-container.pg-mobile-profile .pg-select-wrap input { width: 24px; height: 24px; }
        #pg-container:not(.pg-selection-mode) .pg-item.pg-selected {
            border-color: transparent;
            box-shadow: none;
        }
        #pg-container:not(.pg-selection-mode) .pg-item.pg-selected .pg-select-wrap {
            opacity: 0;
            pointer-events: none;
        }
        #pg-container.pg-mobile-profile .pg-sticky-download-bar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto auto auto;
            gap: 8px;
            padding: 8px 10px calc(8px + var(--pg-safe-bottom));
        }
        #pg-container.pg-mobile-profile .pg-sticky-download-bar .pg-selection-count {
            min-width: 0; margin-right: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        #pg-container.pg-mobile-profile .pg-sticky-status { display: none !important; }
        #pg-container.pg-coarse-pointer .pg-item:hover { transform: none; box-shadow: none; }

    `;

    const gridIconSvg = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="white" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
    const warnIconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    const brokenIconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

    function injectStyles() {
        if (document.getElementById("pg-improved-styles")) {
            return;
        }

        const styleSheet = document.createElement("style");
        styleSheet.id = "pg-improved-styles";
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

