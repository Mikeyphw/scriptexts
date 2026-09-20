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

    function normalizeUrl(value) {
        if (!value) {
            return "";
        }

        try {
            const url = new URL(value, window.location.origin);
            url.hash = "";
            url.searchParams.delete("retry");
            return url.toString();
        } catch {
            return "";
        }
    }

    function stripUrlForCompare(value) {
        const url = normalizeUrl(value);

        if (!url) {
            return "";
        }

        try {
            const parsed = new URL(url);
            parsed.hash = "";
            parsed.search = "";
            return parsed.toString().replace(/\/$/, "");
        } catch {
            return "";
        }
    }

    function getPath(url) {
        try {
            return new URL(url).pathname.toLowerCase();
        } catch {
            return "";
        }
    }

    function getExtension(url) {
        const match = getPath(url).match(/\.([a-z0-9]+)$/i);
        return match ? match[1].toLowerCase() : "";
    }

    function isThreadPage() {
        return /^\/threads\/[^/]+\.\d+/.test(window.location.pathname);
    }

    function getThreadInfo() {
        const match = window.location.pathname.match(/^\/threads\/([^/]+)\.(\d+)(?:\/page-(\d+))?/);

        if (!match) {
            return null;
        }

        return {
            slug: match[1],
            threadId: match[2],
            currentPage: Number(match[3] || "1"),
        };
    }

    function getPageNumberFromUrl(value) {
        const url = normalizeUrl(value);
        const match = getPath(url).match(/\/page-(\d+)/);

        return match ? Number(match[1]) : 1;
    }

    function buildThreadPageUrl(threadInfo, pageNumber) {
        if (pageNumber <= 1) {
            return `${window.location.origin}/threads/${threadInfo.slug}.${threadInfo.threadId}/`;
        }

        return `${window.location.origin}/threads/${threadInfo.slug}.${threadInfo.threadId}/page-${pageNumber}`;
    }

    function isSameThreadUrl(value, threadInfo) {
        const url = normalizeUrl(value);

        if (!url || !threadInfo?.threadId) {
            return false;
        }

        try {
            const parsed = new URL(url);
            const threadPathPattern = new RegExp(`/threads/[^/]+\\.${threadInfo.threadId}(?:/|$)`, "i");

            return parsed.origin === window.location.origin && threadPathPattern.test(parsed.pathname);
        } catch {
            return false;
        }
    }

    function normalizeThreadPageUrl(value, threadInfo) {
        const url = normalizeUrl(value);

        if (!url || !isSameThreadUrl(url, threadInfo)) {
            return "";
        }

        const pageNumber = getPageNumberFromUrl(url);
        return buildThreadPageUrl(threadInfo, pageNumber);
    }

    function getPageNumbersFromDocument(root, threadInfo) {
        const pageNumbers = new Set([1, threadInfo.currentPage || 1]);
        const selectors = [
            ".pageNav a[href]",
            ".pageNav-main a[href]",
            ".pageNav-page a[href]",
            ".pageNav-jump[href]",
            "a[href*='/page-']",
            "link[rel='next'][href]",
            "link[rel='prev'][href]",
        ].join(", ");

        root.querySelectorAll(selectors).forEach(link => {
            const href = link.href || link.getAttribute("href") || "";

            if (!isSameThreadUrl(href, threadInfo)) {
                return;
            }

            pageNumbers.add(getPageNumberFromUrl(href));
            const textPageNumber = Number((link.textContent || "").trim());

            if (Number.isInteger(textPageNumber) && textPageNumber > 0) {
                pageNumbers.add(textPageNumber);
            }
        });

        const titleText = root.title || root.querySelector("title")?.textContent || "";
        const titleMatch = titleText.match(/\bPage\s+(\d+)\b/i);

        if (titleMatch) {
            pageNumbers.add(Number(titleMatch[1]));
        }

        return Array.from(pageNumbers)
            .filter(pageNumber => Number.isInteger(pageNumber) && pageNumber > 0);
    }

    function discoverThreadPageUrls(root, threadInfo) {
        const pageNumbers = getPageNumbersFromDocument(root, threadInfo);
        const lastPage = Math.min(config.maxPages, Math.max(1, ...pageNumbers));

        return Array.from({ length: lastPage }, (_, index) =>
            buildThreadPageUrl(threadInfo, index + 1)
        );
    }

    function isCurrentDocumentUrl(url, threadInfo) {
        const currentPageUrl = buildThreadPageUrl(threadInfo, threadInfo.currentPage);
        return stripUrlForCompare(url) === stripUrlForCompare(currentPageUrl);
    }

    function isAttachmentUrl(url) {
        const path = getPath(normalizeUrl(url));
        return path.includes("/attachments/") || path.includes("/data/attachments/");
    }

    function isVideoPosterUrl(url) {
        const path = getPath(normalizeUrl(url));
        return path.includes("/attachments/posters/") || path.includes("/data/attachments/posters/") || path.includes("/lsvideo/thumbnails/");
    }

    function isCrossOriginCdnUrl(url) {
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.origin !== window.location.origin && /(^|\.)lpsg\.com$/i.test(parsed.hostname);
        } catch {
            return false;
        }
    }

    function getUrlHost(value) {
        try {
            return new URL(value, window.location.origin).hostname.toLowerCase();
        } catch {
            return "";
        }
    }

    function getUrlOriginRank(value) {
        try {
            const parsed = new URL(value, window.location.origin);
            if (parsed.origin === window.location.origin) {
                return 0;
            }
            if (isCrossOriginCdnUrl(parsed.href)) {
                return 2;
            }
            return 1;
        } catch {
            return 3;
        }
    }

    function getSourceScore(url) {
        const host = getUrlHost(url);
        const extension = getExtension(url) || "bin";
        return (state.zipSourceScores.get(`${host}|${extension}`) || 0) +
            (state.zipSourceScores.get(host) || 0);
    }

    function prioritizeDownloadSources(sources) {
        // Preserve discovery order first. The exact URL exposed by the page should be
        // tried before generated MP4/M4V/MOV guesses. Scores only affect generated
        // tie-breaks after the script has learned what works during this ZIP run.
        return sources
            .map(normalizeUrl)
            .filter(Boolean)
            .filter((url, index, array) => array.indexOf(url) === index)
            .map((url, index) => ({ url, index }))
            .sort((left, right) => {
                const leftBlocked = isZipSourceHostBlocked(left.url) ? 1 : 0;
                const rightBlocked = isZipSourceHostBlocked(right.url) ? 1 : 0;
                const leftScore = getSourceScore(left.url);
                const rightScore = getSourceScore(right.url);
                const leftOrigin = getUrlOriginRank(left.url);
                const rightOrigin = getUrlOriginRank(right.url);

                return leftBlocked - rightBlocked ||
                    rightScore - leftScore ||
                    leftOrigin - rightOrigin ||
                    left.index - right.index;
            })
            .map(item => item.url);
    }

    function isLikelyNetworkOrCorsError(error) {
        const text = stringifyDebugValue(error);
        return /NetworkError|Failed to fetch|Load failed|CORS|TypeError/i.test(text) && !/HTTP\s+\d{3}/i.test(text);
    }

    function isZipSourceHostBlocked(url) {
        const host = getUrlHost(url);
        const blocked = host ? state.blockedZipSourceHosts.get(host) : null;
        return Boolean(blocked && blocked.runId === state.debugRunId);
    }

    function rememberZipSourceResult(url, ok, error = null) {
        const host = getUrlHost(url);
        const extension = getExtension(url) || "bin";

        if (!host) {
            return;
        }

        const hostKey = host;
        const formatKey = `${host}|${extension}`;
        const delta = ok ? 3 : -2;
        state.zipSourceScores.set(formatKey, (state.zipSourceScores.get(formatKey) || 0) + delta);

        if (ok) {
            state.zipSourceScores.set(hostKey, (state.zipSourceScores.get(hostKey) || 0) + 1);
            return;
        }

        if (isCrossOriginCdnUrl(url) && isLikelyNetworkOrCorsError(error)) {
            state.blockedZipSourceHosts.set(host, {
                runId: state.debugRunId,
                reason: stringifyDebugValue(error),
                blockedAt: Date.now(),
            });
            state.zipSourceScores.set(hostKey, (state.zipSourceScores.get(hostKey) || 0) - 20);
        }
    }

    function isVideoCandidateUrl(url) {
        const normalized = normalizeUrl(url);
        const path = getPath(normalized);
        const extension = getExtension(normalized);

        return (
            config.formats.includes(extension) &&
            (
                path.includes("/video/") ||
                path.includes("/data/video/") ||
                path.includes("/lsvideo/videos/") ||
                path.includes("/attachments/") ||
                path.includes("/data/attachments/")
            )
        );
    }

    function getUrlLikeValues(value) {
        if (!value) {
            return [];
        }

        const text = String(value).replace(/\\\//g, "/");
        const absoluteMatches = text.match(/https?:\/\/[^"'<>\s)]+/gi) || [];
        const relativeMatches = text.match(/\/(?:data\/)?(?:video|attachments|lsvideo)\/[^"'<>\s)]+/gi) || [];

        return [...absoluteMatches, ...relativeMatches]
            .map(item => item.replace(/[),.;]+$/g, ""));
    }

    function collectUrlsFromElement(element) {
        if (!element) {
            return [];
        }

        const urls = [];

        Array.from(element.attributes || []).forEach(attribute => {
            urls.push(...getUrlLikeValues(attribute.value));
        });

        return urls;
    }

    function getUniqueVideoUrls(values) {
        return values
            .flat()
            .map(normalizeUrl)
            .filter(Boolean)
            .filter(isVideoCandidateUrl)
            .filter((url, index, array) => array.indexOf(url) === index);
    }

    function getVideoUrlsNearElement(element) {
        if (!element) {
            return [];
        }

        const scopes = [
            element,
            element.closest?.(".newVideoDiv, .pg-hydrated-video, .bbMediaWrapper-inner, .bbMediaWrapper, .file, .message-cell--main, .bbWrapper"),
            element.parentElement,
        ].filter(Boolean);

        const urls = [];

        scopes.forEach(scope => {
            urls.push(...collectUrlsFromElement(scope));

            scope.querySelectorAll?.("a[href], source[src], video[src], [data-src], [data-url], [data-video-url], [data-file-url]").forEach(node => {
                urls.push(node.href, node.src, node.currentSrc);
                urls.push(
                    node.getAttribute("href"),
                    node.getAttribute("src"),
                    node.getAttribute("data-src"),
                    node.getAttribute("data-url"),
                    node.getAttribute("data-video-url"),
                    node.getAttribute("data-file-url")
                );
                urls.push(...collectUrlsFromElement(node));
            });
        });

        return getUniqueVideoUrls(urls);
    }

    function getVideoMimeType(format) {
        if (format === "mov") {
            return "video/quicktime";
        }

        if (format === "m4v") {
            return "video/x-m4v";
        }

        return "video/mp4";
    }

    function buildVideoCandidatesFromPoster(imageUrl) {
        const normalizedImageUrl = normalizeUrl(imageUrl);

        if (!normalizedImageUrl) {
            return [];
        }

        return config.formats
            .map(format => normalizedImageUrl
                .replace("attachments/posters", "video")
                .replace("/attachments/posters", "/video")
                .replace("/lsvideo/thumbnails", "/lsvideo/videos")
                .replace(/\.(jpg|jpeg|png|webp)(\?.*)?$/i, `.${format}`)
            )
            .map(normalizeUrl)
            .filter(isVideoCandidateUrl);
    }

    function getPostRootForElement(element) {
        return element?.closest?.("article.message, .message, .message--post, [data-lb-id^='post-'], [id^='js-post-'], [id^='post-']") || null;
    }

    function getPostIdForRoot(postRoot) {
        if (!postRoot) {
            return "";
        }

        const lbId = postRoot.getAttribute("data-lb-id") || "";
        const id = postRoot.id || "";

        return (
            lbId.match(/post-(\d+)/)?.[1] ||
            id.match(/(?:js-)?post-(\d+)/)?.[1] ||
            postRoot.querySelector?.("a[href*='/posts/']")?.href?.match(/\/posts\/(\d+)/)?.[1] ||
            ""
        );
    }

    function getPostUrlForElement(element) {
        const postRoot = getPostRootForElement(element);

        if (!postRoot) {
            return "";
        }

        const postId = getPostIdForRoot(postRoot);

        if (postId) {
            return `${window.location.origin}/posts/${postId}/`;
        }

        const id = postRoot.id || "";

        if (id) {
            return `${window.location.href.split("#")[0]}#${id}`;
        }

        return "";
    }

    function parseCompactNumber(value) {
        if (value === undefined || value === null) {
            return null;
        }

        const text = String(value).trim().toLowerCase();

        if (!text) {
            return null;
        }

        const match = text.match(/(-?\d+(?:[,.]\d+)?)(?:\s*([km]))?/i);

        if (!match) {
            return null;
        }

        const number = Number(match[1].replace(/,/g, ""));

        if (!Number.isFinite(number)) {
            return null;
        }

        const multiplier = match[2] === "m" ? 1000000 : match[2] === "k" ? 1000 : 1;
        return Math.max(0, Math.round(number * multiplier));
    }

    function extractReactionCountFromText(text) {
        const normalized = String(text || "").replace(/\s+/g, " ").trim();

        if (!normalized) {
            return null;
        }

        const directPatterns = [
            /(?:like|likes|reaction|reactions)\s*[:·-]?\s*(\d[\d,]*(?:\.\d+)?\s*[km]?)/i,
            /(\d[\d,]*(?:\.\d+)?\s*[km]?)\s*(?:like|likes|reaction|reactions|people reacted|members reacted|users reacted)/i,
            /and\s+(\d[\d,]*(?:\.\d+)?\s*[km]?)\s+others?/i,
        ];

        for (const pattern of directPatterns) {
            const match = normalized.match(pattern);
            const parsed = parseCompactNumber(match?.[1]);

            if (parsed !== null) {
                return parsed;
            }
        }

        return null;
    }

    const postEngagementCache = new WeakMap();

    function getPostEngagementForElement(element) {
        const postRoot = getPostRootForElement(element);
        const postId = getPostIdForRoot(postRoot);

        if (!postRoot) {
            return { postId, likeCount: null, likeCountReliable: false };
        }

        const cached = postEngagementCache.get(postRoot);
        if (cached) {
            return cached;
        }

        const candidates = [];
        const selectors = [
            "[data-reaction-count]",
            "[data-reactions]",
            "[data-score]",
            ".reactionsBar",
            ".reactionsBar-link",
            ".reactionSummary",
            ".js-reactionList",
            ".message-responseRow",
            ".message-responseRow--reactions",
            ".message-footer",
            ".message-actionBar",
            ".likesBar",
            "a[href*='/reactions']",
            "a[href*='/posts/'][href*='reactions']",
        ];

        postRoot.querySelectorAll(selectors.join(",")).forEach(node => {
            for (const attr of ["data-reaction-count", "data-reactions", "data-score", "aria-label", "title"]) {
                const parsed = parseCompactNumber(node.getAttribute(attr));

                if (parsed !== null) {
                    candidates.push({ value: parsed, reliable: attr.startsWith("data-") });
                }
            }

            const fromText = extractReactionCountFromText(node.textContent || "");

            if (fromText !== null) {
                candidates.push({ value: fromText, reliable: true });
            }
        });

        const exactReactionIcons = postRoot.querySelectorAll(".reaction, .reactionSummary span, .reactionsBar .reaction").length;

        if (exactReactionIcons > 0 && exactReactionIcons <= 12) {
            candidates.push({ value: exactReactionIcons, reliable: false });
        }

        if (candidates.length === 0) {
            const result = { postId, likeCount: null, likeCountReliable: false };
            postEngagementCache.set(postRoot, result);
            return result;
        }

        const best = candidates.reduce((current, next) => {
            if (!current) {
                return next;
            }

            if (next.reliable && !current.reliable) {
                return next;
            }

            if (next.value > current.value) {
                return next;
            }

            return current;
        }, null);

        const result = {
            postId,
            likeCount: best?.value ?? null,
            likeCountReliable: Boolean(best?.reliable),
        };

        postEngagementCache.set(postRoot, result);
        return result;
    }

    function getCanonicalVideoAssetId(item) {
        const candidates = [
            ...(item.sources || []),
            item.src,
            item.workingUrl,
        ].map(normalizeUrl).filter(Boolean);

        for (const candidate of candidates) {
            const path = getPath(candidate);
            const match = path.match(/(?:\/data)?\/video\/\d+\/([^/?#]+?)(?:\.(?:mp4|m4v|mov))?$/i) ||
                path.match(/\/lsvideo\/videos\/([^/?#]+?)(?:\.(?:mp4|m4v|mov))?$/i);

            if (match?.[1]) {
                return match[1].replace(/\.(?:mp4|m4v|mov)$/i, "").toLowerCase();
            }
        }

        return "";
    }

    function getStableMediaId(item) {
        if (item.type === "video") {
            const assetId = getCanonicalVideoAssetId(item);

            if (assetId) {
                return `video:${assetId}`;
            }

            if (item.poster) {
                return `video-poster:${normalizeUrl(item.poster)}`;
            }
        }

        return `${item.type}:${normalizeUrl(item.src)}`;
    }

    function addMediaItems(items) {
        let addedCount = 0;
        let updatedCount = 0;

        items.forEach(item => {
            if (!item || !item.src) {
                return;
            }

            const id = getStableMediaId(item);

            if (!id) {
                return;
            }

            const existingItem = state.mediaById.get(id);
            if (existingItem) {
                let changed = false;

                if (!existingItem.el && item.el) {
                    existingItem.el = item.el;
                    changed = true;
                }
                if (item.sources?.length) {
                    const mergedSources = getUniqueVideoUrls([...(existingItem.sources || []), ...item.sources]);
                    if (mergedSources.length !== (existingItem.sources || []).length) {
                        existingItem.sources = mergedSources;
                        changed = true;
                    }
                }
                if (item.poster && !existingItem.poster) {
                    existingItem.poster = item.poster;
                    changed = true;
                }
                if (item.thumb && !existingItem.thumb) {
                    existingItem.thumb = item.thumb;
                    changed = true;
                }
                if (item.postUrl && !existingItem.postUrl) {
                    existingItem.postUrl = item.postUrl;
                    changed = true;
                }
                if (item.postId && !existingItem.postId) {
                    existingItem.postId = item.postId;
                    changed = true;
                }
                if (Number.isFinite(Number(item.likeCount)) && Number(item.likeCount) !== Number(existingItem.likeCount)) {
                    existingItem.likeCount = Number(item.likeCount);
                    existingItem.likeCountReliable = Boolean(item.likeCountReliable);
                    changed = true;
                }
                if (Number.isFinite(Number(item.durationSeconds)) && Number(item.durationSeconds) > 0 && Number(item.durationSeconds) !== Number(existingItem.durationSeconds)) {
                    existingItem.durationSeconds = Number(item.durationSeconds);
                    changed = true;
                }

                if (changed) {
                    existingItem.searchText = buildMediaSearchText(existingItem);
                    updatedCount += 1;
                }
                return;
            }

            const cachedItem = {
                ...item,
                id,
                orderIndex: Number.isFinite(Number(item.orderIndex)) ? Number(item.orderIndex) : state.mediaById.size,
            };
            cachedItem.workingUrl = loadCachedWorkingUrl(cachedItem);

            if (cachedItem.type === "video" && !(Number(cachedItem.durationSeconds) > 0)) {
                cachedItem.durationSeconds = loadCachedVideoDuration(cachedItem);
            }

            cachedItem.searchText = buildMediaSearchText(cachedItem);
            state.mediaById.set(id, cachedItem);

            if (state.autoSelectNewMedia) {
                state.selectedMediaIds.add(id);
            }

            addedCount += 1;
        });

        if (addedCount > 0 || updatedCount > 0) {
            invalidateMediaCaches();

            if (addedCount > 0 && state.autoSelectNewMedia) {
                invalidateSelectionCaches();
            }

            if (state.container) {
                scheduleRenderGrid();
                updateSelectionSummary();
            }

            scheduleThreadMetadataCacheSave();
            updateFloatingButtonLabel();
        }

        return addedCount;
    }

    function unlockVideos(root = document, pageNumber = 1) {
        const posters = Array.from(root.getElementsByClassName("video-easter-egg-poster"));
        const hydratedVideos = [];

        posters.forEach(poster => {
            if (!(poster instanceof HTMLElement) || poster.dataset.pgHydrated === "true") {
                return;
            }

            const img = poster.querySelector("img");
            const imageUrl = normalizeUrl(img?.currentSrc || img?.src || img?.dataset?.src);

            poster.dataset.pgHydrated = "true";

            if (!imageUrl) {
                return;
            }

            const unlockedSources = getVideoUrlsNearElement(poster);
            const guessedSources = buildVideoCandidatesFromPoster(imageUrl);
            const sources = getUniqueVideoUrls([...unlockedSources, ...guessedSources]);

            if (sources.length === 0) {
                return;
            }

            const doc = poster.ownerDocument || document;
            const videoWrapper = doc.createElement("div");
            const video = doc.createElement("video");

            videoWrapper.className = "newVideoDiv pg-hydrated-video";
            videoWrapper.style.cssText = "display:inline-block; max-width:100%;";

            video.className = "message-cell--main-video";
            video.controls = true;
            video.playsInline = true;
            video.preload = "metadata";
            video.poster = imageUrl;
            video.volume = config.volume;
            video.style.cssText = "max-width:100%; width:auto; max-height:80vh; display:block; margin:0 auto;";

            sources.forEach(sourceUrl => {
                const source = doc.createElement("source");
                const extension = getExtension(sourceUrl);

                source.src = sourceUrl;
                source.type = getVideoMimeType(extension);
                video.appendChild(source);
            });

            videoWrapper.appendChild(video);
            poster.insertAdjacentElement("afterend", videoWrapper);
            poster.remove();

            hydratedVideos.push({
                type: "video",
                el: video,
                src: sources[0],
                sources,
                poster: imageUrl,
                width: 300,
                height: 169,
                pageNumber,
                postUrl: getPostUrlForElement(videoWrapper),
                ...getPostEngagementForElement(videoWrapper),
            });
        });

        root.querySelectorAll(".video-easter-egg-blocker, .video-easter-egg-overlay").forEach(el => el.remove());

        root.querySelectorAll("video").forEach(video => {
            if (!video.dataset.volSet) {
                video.volume = config.volume;
                video.dataset.volSet = "true";
            }
        });

        root.querySelectorAll('img[loading="lazy"]').forEach(img => {
            img.loading = "eager";

            if (img.dataset.src && !img.src) {
                img.src = img.dataset.src;
            }
        });

        return hydratedVideos;
    }

    function getVideoSources(video) {
        const sourceUrls = [
            video.currentSrc,
            video.src,
            video.getAttribute("data-src"),
            video.getAttribute("data-url"),
            ...Array.from(video.querySelectorAll("source")).flatMap(source => [
                source.currentSrc,
                source.src,
                source.getAttribute("src"),
                source.getAttribute("data-src"),
                source.getAttribute("data-url"),
            ]),
            ...getVideoUrlsNearElement(video),
        ];

        return getUniqueVideoUrls(sourceUrls);
    }

    function scanMedia(root = document, pageNumber = 1) {
        const postSelector = [
            "article.message[id^='js-post-']",
            "article.message--post",
            ".message.message--post",
            "[data-lb-id^='post-']",
        ].join(", ");
        const discoveredScopes = root.matches?.(postSelector)
            ? [root]
            : Array.from(root.querySelectorAll?.(postSelector) || []);
        const scanScopes = discoveredScopes.length > 0
            ? discoveredScopes.filter((scope, index, scopes) =>
                !scopes.some((other, otherIndex) => otherIndex !== index && other.contains(scope))
            )
            : [root];
        const media = [];

        scanScopes.forEach(scope => {
            const unlockedVideos = unlockVideos(scope, pageNumber);
            const existingVideos = Array.from(scope.querySelectorAll(
                ".message-cell--main video, video.message-cell--main-video, video"
            )).map(video => {
                const sources = getVideoSources(video);

                if (sources.length === 0) {
                    return null;
                }

                return {
                    type: "video",
                    el: video,
                    src: sources[0],
                    sources,
                    poster: normalizeUrl(video.getAttribute("data-poster") || video.getAttribute("poster") || video.poster),
                    width: video.videoWidth || 300,
                    height: video.videoHeight || 169,
                    pageNumber,
                    postUrl: getPostUrlForElement(video),
                    ...getPostEngagementForElement(video),
                };
            }).filter(Boolean);

            const posterUrls = new Set(
                [...unlockedVideos, ...existingVideos]
                    .map(video => normalizeUrl(video.poster))
                    .filter(Boolean)
            );

            // Preserve the original broad attachment coverage, but only once per post.
            // This catches linked thumbnails, lazy-loaded images, inline attachments, and
            // alternate XenForo attachment layouts without scanning navigation/avatar images.
            const images = Array.from(scope.querySelectorAll("img")).filter(img => {
                const src = normalizeUrl(
                    img.currentSrc ||
                    img.src ||
                    img.getAttribute("src") ||
                    img.dataset.src ||
                    img.getAttribute("data-src")
                );
                const parentHref = normalizeUrl(img.closest("a[href]")?.href);
                const linkedFile = Boolean(img.closest(".file.file--linked, .attachment, .attachmentList, .bbImageWrapper"));
                const attachment = isAttachmentUrl(src) || isAttachmentUrl(parentHref);

                if (!linkedFile && !attachment) {
                    return false;
                }

                if (posterUrls.has(src) || isVideoPosterUrl(src) || isVideoPosterUrl(parentHref)) {
                    return false;
                }

                const width = img.naturalWidth || img.width || parseInt(img.getAttribute("width") || "0", 10);
                const height = img.naturalHeight || img.height || parseInt(img.getAttribute("height") || "0", 10);
                return !(width > 0 && height > 0 && width < 50 && height < 50);
            }).map(img => {
                const parentLink = img.closest("a[href]");
                const thumb = normalizeUrl(
                    img.currentSrc ||
                    img.src ||
                    img.getAttribute("src") ||
                    img.dataset.src ||
                    img.getAttribute("data-src")
                );
                const href = normalizeUrl(parentLink?.href);
                const fullUrl = href && (
                    isAttachmentUrl(href) ||
                    /\.(?:jpg|jpeg|png|gif|webp|avif)(?:\?|#|$)/i.test(href)
                ) ? href : thumb;

                if (!fullUrl) {
                    return null;
                }

                return {
                    type: "image",
                    subType: getExtension(fullUrl) === "gif" ? "gif" : "img",
                    el: img,
                    src: fullUrl,
                    thumb,
                    width: parseInt(img.getAttribute("width") || img.naturalWidth || 0, 10),
                    height: parseInt(img.getAttribute("height") || img.naturalHeight || 0, 10),
                    pageNumber,
                    postUrl: getPostUrlForElement(img),
                    ...getPostEngagementForElement(img),
                };
            }).filter(Boolean);

            const knownVideoUrls = new Set(
                [...unlockedVideos, ...existingVideos]
                    .flatMap(video => video.sources?.length ? video.sources : [video.src])
                    .map(normalizeUrl)
                    .filter(Boolean)
            );

            // One bounded subtree scan per post replaces the old per-link rescans while
            // retaining support for video URLs hidden in arbitrary wrapper attributes.
            const discoveredVideoUrls = getVideoUrlsNearElement(scope);
            const linkedVideos = discoveredVideoUrls.filter(sourceUrl => {
                const normalized = normalizeUrl(sourceUrl);

                if (!normalized || knownVideoUrls.has(normalized)) {
                    return false;
                }

                knownVideoUrls.add(normalized);
                return true;
            }).map(sourceUrl => {
                const posterImage = scope.querySelector(
                    "video[poster], .video-easter-egg-poster img, img[src*='/attachments/posters/'], img[src*='/lsvideo/thumbnails/']"
                );

                return {
                    type: "video",
                    el: scope,
                    src: sourceUrl,
                    sources: [sourceUrl],
                    poster: normalizeUrl(
                        posterImage?.getAttribute("poster") ||
                        posterImage?.currentSrc ||
                        posterImage?.src ||
                        posterImage?.dataset?.src
                    ),
                    width: 300,
                    height: 169,
                    pageNumber,
                    postUrl: getPostUrlForElement(scope),
                    ...getPostEngagementForElement(scope),
                };
            });

            media.push(...unlockedVideos, ...existingVideos, ...linkedVideos, ...images);
        });

        addDebugLog("verbose", "Page media discovery completed.", {
            pageNumber,
            postScopes: scanScopes.length,
            candidates: media.length,
            videos: media.filter(item => item.type === "video").length,
            images: media.filter(item => item.type === "image").length,
        });

        return media;
    }

    function formatBytes(bytes) {
        const value = Number(bytes) || 0;

        if (value < 1024) {
            return `${value} B`;
        }

        const units = ["KB", "MB", "GB", "TB"];
        let size = value / 1024;
        let index = 0;

        while (size >= 1024 && index < units.length - 1) {
            size /= 1024;
            index += 1;
        }

        return `${size >= 100 ? Math.round(size) : size.toFixed(1)} ${units[index]}`;
    }

    function hashString(value) {
        let hash = 5381;
        const text = String(value);

        for (let index = 0; index < text.length; index += 1) {
            hash = ((hash << 5) + hash) + text.charCodeAt(index);
            hash |= 0;
        }

        return Math.abs(hash).toString(36);
    }

    function getThreadCacheId() {
        const info = getThreadInfo();

        if (info?.threadId) {
            return `thread:${info.threadId}`;
        }

        return `page:${hashString(window.location.origin + window.location.pathname)}`;
    }

    function getWorkingUrlCacheKey(item) {
        return `pg_working_url:${getThreadCacheId()}:${item.id}`;
    }

    function loadCachedWorkingUrl(item) {
        try {
            return localStorage.getItem(getWorkingUrlCacheKey(item)) || "";
        } catch {
            return "";
        }
    }

    function saveCachedWorkingUrl(item, url) {
        if (!item?.id || !url) {
            return;
        }

        item.workingUrl = url;

        try {
            localStorage.setItem(getWorkingUrlCacheKey(item), url);
        } catch {}
    }

    function getDurationCacheKey(item) {
        return `pg_video_duration:${getThreadCacheId()}:${item.id || hashString(item.src || "")}`;
    }

    function loadCachedVideoDuration(item) {
        if (!item || item.type !== "video") {
            return null;
        }

        try {
            const cached = localStorage.getItem(getDurationCacheKey(item));
            const value = Number(cached);
            return Number.isFinite(value) && value > 0 ? value : null;
        } catch {
            return null;
        }
    }

    function saveCachedVideoDuration(item, seconds) {
        const value = Number(seconds);

        if (!item?.id || item.type !== "video" || !Number.isFinite(value) || value <= 0) {
            return;
        }

        if (Number(item.durationSeconds) !== value) {
            item.durationSeconds = value;
            item.searchText = buildMediaSearchText(item);
            state.filteredMediaCache = null;
        }

        try {
            localStorage.setItem(getDurationCacheKey(item), String(value));
        } catch {}
    }

    function formatDuration(seconds) {
        const value = Number(seconds);

        if (!Number.isFinite(value) || value <= 0) {
            return "Unknown";
        }

        const rounded = Math.round(value);
        const hours = Math.floor(rounded / 3600);
        const minutes = Math.floor((rounded % 3600) / 60);
        const secs = rounded % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
        }

        return `${minutes}:${String(secs).padStart(2, "0")}`;
    }

    function formatLikes(count) {
        const value = Number(count);

        if (!Number.isFinite(value) || value < 0) {
            return "No likes found";
        }

        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
        }

        if (value >= 1000) {
            return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
        }

        return String(value);
    }

    function readVideoDurationFromElement(video) {
        return new Promise(resolve => {
            if (!(video instanceof HTMLVideoElement)) {
                resolve(null);
                return;
            }

            if (Number.isFinite(video.duration) && video.duration > 0) {
                resolve(video.duration);
                return;
            }

            let settled = false;
            const cleanup = () => {
                video.removeEventListener("loadedmetadata", onDone);
                video.removeEventListener("durationchange", onDone);
                video.removeEventListener("error", onError);
                clearTimeout(timeout);
            };
            const finish = value => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanup();
                resolve(value);
            };
            const onDone = () => finish(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null);
            const onError = () => finish(null);
            const timeout = setTimeout(() => finish(null), 8000);

            video.addEventListener("loadedmetadata", onDone, { once: true });
            video.addEventListener("durationchange", onDone, { once: true });
            video.addEventListener("error", onError, { once: true });
            video.preload = "metadata";

            try {
                video.load();
            } catch {}
        });
    }

    function probeVideoDuration(item) {
        return new Promise(resolve => {
            const sourceUrl = (item.sources || []).find(Boolean) || item.src;

            if (!sourceUrl) {
                resolve(null);
                return;
            }

            const video = document.createElement("video");
            let settled = false;

            const cleanup = () => {
                video.removeEventListener("loadedmetadata", onDone);
                video.removeEventListener("durationchange", onDone);
                video.removeEventListener("error", onError);
                clearTimeout(timeout);
                video.removeAttribute("src");
                video.load?.();
            };
            const finish = value => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanup();
                resolve(value);
            };
            const onDone = () => finish(Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null);
            const onError = () => finish(null);
            const timeout = setTimeout(() => finish(null), 10000);

            video.preload = "metadata";
            video.muted = true;
            video.playsInline = true;
            video.addEventListener("loadedmetadata", onDone, { once: true });
            video.addEventListener("durationchange", onDone, { once: true });
            video.addEventListener("error", onError, { once: true });
            video.src = sourceUrl;

            try {
                video.load();
            } catch {
                finish(null);
            }
        });
    }

    async function hydrateVideoDurations(reason = "manual") {
        if (state.videoDurationHydrationRunning) {
            state.videoDurationHydrationQueued = true;
            return;
        }

        const videos = getAllMedia().filter(item => item.type === "video" && !(Number(item.durationSeconds) > 0));

        if (videos.length === 0) {
            return;
        }

        state.videoDurationHydrationRunning = true;
        state.videoDurationHydrationQueued = false;
        updateDesktopStatus(`Loading video durations… 0/${videos.length}`);

        let completed = 0;
        let found = 0;

        try {
            for (const item of videos) {
                let duration = loadCachedVideoDuration(item);

                if (!duration && item.el instanceof HTMLVideoElement) {
                    duration = await readVideoDurationFromElement(item.el);
                }

                if (!duration) {
                    duration = await probeVideoDuration(item);
                }

                if (duration) {
                    saveCachedVideoDuration(item, duration);
                    found += 1;
                }

                completed += 1;

                if (completed % 8 === 0 || completed === videos.length) {
                    updateDesktopStatus(`Loading video durations… ${completed}/${videos.length}`);
                    updateSelectionSummary();
                    updateDesktopOverview();
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            addDebugLog("ok", "Video duration hydration finished.", { reason, checked: videos.length, found });
            scheduleThreadMetadataCacheSave();
        } finally {
            state.videoDurationHydrationRunning = false;
            updateDesktopStatus();

            if (state.videoDurationHydrationQueued) {
                state.videoDurationHydrationQueued = false;
                void hydrateVideoDurations("queued");
            } else if (state.container) {
                renderGrid();
            }
        }
    }

    function getBlobCacheKey(item, sourceUrl) {
        return `blob:${getThreadCacheId()}:${item.id}:${hashString(sourceUrl)}`;
    }

    function getZipCacheKey(jobId, partNumber) {
        return `zip:${getThreadCacheId()}:${jobId}:part-${partNumber}`;
    }

    let dbPromise = null;

    function requestToPromise(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
        });
    }

    function transactionToPromise(tx) {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error("Cache transaction failed."));
            tx.onabort = () => reject(tx.error || new Error("Cache transaction aborted."));
        });
    }

    function openCacheDb() {
        if (dbPromise) {
            return dbPromise;
        }

        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(config.cacheDbName, config.cacheDbVersion);

            request.onupgradeneeded = () => {
                const db = request.result;

                if (!db.objectStoreNames.contains("metadata")) {
                    const store = db.createObjectStore("metadata", { keyPath: "key" });
                    store.createIndex("threadId", "threadId", { unique: false });
                    store.createIndex("kind", "kind", { unique: false });
                    store.createIndex("createdAt", "createdAt", { unique: false });
                    store.createIndex("expiresAt", "expiresAt", { unique: false });
                    store.createIndex("jobId", "jobId", { unique: false });
                }

                if (!db.objectStoreNames.contains("blobs")) {
                    db.createObjectStore("blobs", { keyPath: "key" });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Could not open cache database."));
        });

        return dbPromise;
    }

    async function getCacheRecord(key) {
        const db = await openCacheDb();
        const meta = await requestToPromise(db.transaction("metadata", "readonly").objectStore("metadata").get(key));

        if (!meta) {
            return null;
        }

        if (meta.hasBlob) {
            const blobRecord = await requestToPromise(db.transaction("blobs", "readonly").objectStore("blobs").get(key));
            return { ...meta, blob: blobRecord?.blob || null };
        }

        return meta;
    }

    async function putCacheRecord(record) {
        const db = await openCacheDb();
        const hasBlob = record.blob instanceof Blob;
        const metadata = { ...record, hasBlob };
        delete metadata.blob;
        const stores = ["metadata", "blobs"];
        const tx = db.transaction(stores, "readwrite");
        tx.objectStore("metadata").put(metadata);

        if (hasBlob) {
            tx.objectStore("blobs").put({ key: record.key, blob: record.blob });
        } else if (stores.includes("blobs")) {
            tx.objectStore("blobs").delete(record.key);
        }

        await transactionToPromise(tx);
    }

    async function deleteCacheRecord(key) {
        const db = await openCacheDb();
        const tx = db.transaction(["metadata", "blobs"], "readwrite");
        tx.objectStore("metadata").delete(key);
        tx.objectStore("blobs").delete(key);
        await transactionToPromise(tx);
    }

    async function getAllCacheRecords() {
        const db = await openCacheDb();
        return (await requestToPromise(db.transaction("metadata", "readonly").objectStore("metadata").getAll())) || [];
    }

    async function getCacheRecordsByIndex(indexName, value) {
        const db = await openCacheDb();
        const store = db.transaction("metadata", "readonly").objectStore("metadata");
        return (await requestToPromise(store.index(indexName).getAll(value))) || [];
    }

    async function deleteCacheRecords(keys) {
        if (!keys.length) {
            return 0;
        }

        const db = await openCacheDb();
        const tx = db.transaction(["metadata", "blobs"], "readwrite");
        const metadata = tx.objectStore("metadata");
        const blobs = tx.objectStore("blobs");
        keys.forEach(key => {
            metadata.delete(key);
            blobs.delete(key);
        });
        await transactionToPromise(tx);
        return keys.length;
    }

    async function getCacheStats() {
        const records = await getAllCacheRecords();
        const now = Date.now();
        let total = 0;
        let temp = 0;
        let stale = 0;

        records.forEach(record => {
            const size = Number(record.size) || 0;
            total += size;

            if (record.temporary) {
                temp += size;
            }

            if (record.expiresAt && record.expiresAt < now) {
                stale += size;
            }
        });

        return { count: records.length, totalBytes: total, tempBytes: temp, staleBytes: stale };
    }

    async function updateCacheStats() {
        clearTimeout(state.cacheStatsTimer);

        state.cacheStatsTimer = setTimeout(async () => {
            try {
                const stats = await getCacheStats();
                state.cacheSizeBytes = stats.totalBytes;
                state.tempCacheSizeBytes = stats.tempBytes;
                document.querySelectorAll("#pg-cache-size, #pg-more-cache-size").forEach(node => {
                    node.textContent = `Cache: ${formatBytes(stats.totalBytes)} · temp ${formatBytes(stats.tempBytes)}`;
                });
                addDebugLog("trace", "Cache stats updated.", stats);
            } catch (error) {
                document.querySelectorAll("#pg-cache-size, #pg-more-cache-size").forEach(node => {
                    node.textContent = "Cache: unavailable";
                });
                addDebugLog("warn", "Cache stats failed.", { error: stringifyDebugValue(error) });
            }
        }, config.cacheStatsDebounceMs);
    }

    async function pruneExpiredCache() {
        const now = Date.now();
        const records = await getAllCacheRecords();
        const expiredKeys = records.filter(record => record.expiresAt && record.expiresAt < now).map(record => record.key);
        const deleted = await deleteCacheRecords(expiredKeys);

        if (deleted > 0) {
            addDebugLog("info", "Expired cache records pruned.", { deleted });
            void updateCacheStats();
        }

        return deleted;
    }

    async function ensureCacheRoom(extraBytes) {
        if (!Number.isFinite(extraBytes) || extraBytes <= 0) {
            return true;
        }

        const records = await getAllCacheRecords();
        let total = records.reduce((sum, record) => sum + (Number(record.size) || 0), 0);

        if (total + extraBytes <= config.maxBlobCacheBytes) {
            return true;
        }

        const removable = records.filter(record => record.temporary).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        const keysToDelete = [];

        for (const record of removable) {
            keysToDelete.push(record.key);
            total -= Number(record.size) || 0;

            if (total + extraBytes <= config.maxBlobCacheBytes) {
                break;
            }
        }

        await deleteCacheRecords(keysToDelete);

        if (keysToDelete.length > 0) {
            addDebugLog("info", "Old temp cache evicted for space.", { deleted: keysToDelete.length, requestedBytes: extraBytes });
        }

        void updateCacheStats();
        return total + extraBytes <= config.maxBlobCacheBytes;
    }

    async function cacheMediaBlob(item, sourceUrl, blob, jobId, roomReserved = false) {
        // "Keep temp cache" is the explicit resumable-download mode.
        if (!config.enableBlobCache || !state.keepTempCacheAfterZip || !blob || blob.size <= 0) {
            return false;
        }

        if (blob.size > config.maxSingleBlobBytes) {
            addDebugLog("warn", "Blob cache skipped: single file limit.", { itemId: item.id, size: blob.size, limit: config.maxSingleBlobBytes, url: sourceUrl });
            return false;
        }

        const hasRoom = roomReserved || await ensureCacheRoom(blob.size);

        if (!hasRoom) {
            addDebugLog("warn", "Blob cache skipped: total cache limit.", { itemId: item.id, size: blob.size, limit: config.maxBlobCacheBytes });
            return false;
        }

        const now = Date.now();
        await putCacheRecord({
            key: getBlobCacheKey(item, sourceUrl),
            threadId: getThreadCacheId(),
            jobId,
            mediaId: item.id,
            url: sourceUrl,
            kind: "mediaBlob",
            type: item.type,
            size: blob.size,
            blob,
            createdAt: now,
            expiresAt: now + config.staleCacheMs,
            temporary: true,
        });
        void updateCacheStats();
        return true;
    }

    async function getCachedMediaBlob(item, sourceUrl, context = {}) {
        if (!config.enableBlobCache) {
            return null;
        }

        const record = await getCacheRecord(getBlobCacheKey(item, sourceUrl));

        if (!record?.blob) {
            return null;
        }

        if (record.expiresAt && record.expiresAt < Date.now()) {
            await deleteCacheRecord(record.key);
            return null;
        }

        addDebugLog("verbose", "ZIP cache hit.", { runId: context.runId, index: context.index, itemId: item.id, url: sourceUrl, size: record.blob.size });
        return { blob: record.blob, url: sourceUrl, fromCache: true };
    }

    async function cacheZipBlob() {
        // Completed ZIPs are downloaded immediately and never duplicated in IndexedDB.
        return false;
    }

    async function clearJobTempCache(jobId) {
        if (!jobId) {
            return 0;
        }

        const records = await getCacheRecordsByIndex("jobId", jobId);
        const keys = records.filter(record => record.temporary).map(record => record.key);
        const deleted = await deleteCacheRecords(keys);

        if (deleted > 0) {
            addDebugLog("info", "ZIP temp cache cleared.", { jobId, deleted });
        }

        void updateCacheStats();
        return deleted;
    }

    async function clearTempCache() {
        const records = await getAllCacheRecords();
        return deleteCacheRecords(records.filter(record => record.temporary).map(record => record.key));
    }

    async function clearAllCache() {
        const records = await getAllCacheRecords();
        return deleteCacheRecords(records.map(record => record.key));
    }

    async function clearTempCacheFromUi() {
        const deleted = await clearTempCache();
        addDebugLog("info", "Temp cache cleared by user.", { deleted });
        showToast("cache", `Temp cache cleared · ${deleted} record(s)`, { level: "ok", timeout: 4000 });
        void updateCacheStats();
    }

    async function clearAllCacheFromUi() {
        const deleted = await clearAllCache();
        addDebugLog("info", "All cache cleared by user.", { deleted });
        showToast("cache", `All cache cleared · ${deleted} record(s)`, { level: "ok", timeout: 4000 });
        void updateCacheStats();
    }


    function serializeMediaItem(item) {
        return {
            id: item.id,
            type: item.type,
            subType: item.subType || "",
            src: item.src,
            sources: item.sources || [],
            poster: item.poster || "",
            thumb: item.thumb || "",
            width: item.width || 0,
            height: item.height || 0,
            pageNumber: item.pageNumber || 0,
            postUrl: item.postUrl || "",
            workingUrl: item.workingUrl || loadCachedWorkingUrl(item) || "",
            size: item.size || 0,
            postId: item.postId || "",
            likeCount: Number.isFinite(Number(item.likeCount)) ? Number(item.likeCount) : null,
            likeCountReliable: Boolean(item.likeCountReliable),
            durationSeconds: Number.isFinite(Number(item.durationSeconds)) ? Number(item.durationSeconds) : null,
            orderIndex: Number.isFinite(Number(item.orderIndex)) ? Number(item.orderIndex) : 0,
        };
    }

    async function saveThreadMetadataCache() {
        try {
            const items = getAllMedia().map(serializeMediaItem);
            const now = Date.now();

            await putCacheRecord({
                key: `meta:${getThreadCacheId()}:media`,
                threadId: getThreadCacheId(),
                kind: "mediaMeta",
                size: JSON.stringify(items).length,
                items,
                createdAt: now,
                expiresAt: now + config.metadataCacheTtlMs,
                temporary: false,
            });

            void updateCacheStats();
        } catch (error) {
            addDebugLog("warn", "Media metadata cache save failed.", {
                error: stringifyDebugValue(error),
            });
        }
    }

    function scheduleThreadMetadataCacheSave() {
        if (state.metadataSaveTimer) {
            clearTimeout(state.metadataSaveTimer);
        }

        state.metadataSaveTimer = setTimeout(() => {
            state.metadataSaveTimer = null;
            void saveThreadMetadataCache();
        }, config.metadataSaveDebounceMs);
    }

    async function flushThreadMetadataCacheSave() {
        if (state.metadataSaveTimer) {
            clearTimeout(state.metadataSaveTimer);
            state.metadataSaveTimer = null;
            await saveThreadMetadataCache();
        }
    }

    async function loadThreadMetadataCache() {
        try {
            const record = await getCacheRecord(`meta:${getThreadCacheId()}:media`);

            if (!record?.items?.length) {
                return 0;
            }

            if (record.expiresAt && record.expiresAt < Date.now()) {
                await deleteCacheRecord(record.key);
                return 0;
            }

            const items = record.items.map(item => ({
                ...item,
                el: null,
            }));

            const added = addMediaItems(items);

            if (added > 0) {
                addDebugLog("ok", "Loaded media metadata from cache.", {
                    added,
                    cachedAt: record.createdAt,
                });
                showToast("cache", `Loaded cached gallery: ${added} item(s)`, {
                    level: "ok",
                    timeout: 3000,
                });
            }

            return added;
        } catch (error) {
            addDebugLog("warn", "Media metadata cache load failed.", {
                error: stringifyDebugValue(error),
            });
            return 0;
        }
    }


    function setProgress(message, current = 0, total = 0) {
        const box = document.getElementById("pg-progress");
        const text = document.getElementById("pg-progress-text");
        const fill = document.getElementById("pg-progress-fill");

        if (!box || !text || !fill) {
            return;
        }

        box.classList.add("visible");
        text.textContent = message;

        updateMobileUiState();

        if (total > 0) {
            fill.style.width = `${Math.min(100, Math.round((current / total) * 100))}%`;
        } else {
            fill.style.width = "0%";
        }
    }

    function clearProgress(message = "") {
        const box = document.getElementById("pg-progress");
        const text = document.getElementById("pg-progress-text");
        const fill = document.getElementById("pg-progress-fill");

        if (!box || !text || !fill) {
            return;
        }

        if (message) {
            text.textContent = message;
            fill.style.width = "100%";


            setTimeout(() => {
                box.classList.remove("visible");
                updateMobileUiState();
            }, 1600);

            return;
        }

        box.classList.remove("visible");
        text.textContent = "";
        fill.style.width = "0%";
        const stickyStatus = document.getElementById("pg-sticky-status");
        if (stickyStatus) {
            stickyStatus.textContent = "";
        }
        updateMobileUiState();
    }


    function ensureToastHost() {
        let host = document.getElementById("pg-toast-host");

        if (!host) {
            host = document.createElement("div");
            host.id = "pg-toast-host";
            host.className = "pg-toast-host";
            document.body.appendChild(host);
        }

        return host;
    }

    function removeToast(id, delay = 0) {
        const timerKey = `toast:${id}`;
        const existingTimer = state.toastTimers.get(timerKey);

        if (existingTimer) {
            clearTimeout(existingTimer);
            state.toastTimers.delete(timerKey);
        }

        const remove = () => {
            document.getElementById(`pg-toast-${id}`)?.remove();
        };

        if (delay > 0) {
            const timer = setTimeout(remove, delay);
            state.toastTimers.set(timerKey, timer);
            return;
        }

        remove();
    }

    function showToast(id, message, options = {}) {
        const host = ensureToastHost();
        const level = options.level || "info";
        let toast = document.getElementById(`pg-toast-${id}`);

        if (!toast) {
            toast = document.createElement("div");
            toast.id = `pg-toast-${id}`;
            toast.className = `pg-toast ${level}`;
            toast.innerHTML = `
                <div class="pg-toast-body">
                    <div class="pg-toast-message"></div>
                    <button type="button" class="pg-toast-close" aria-label="Close notification">×</button>
                </div>
                <div class="pg-toast-actions"></div>
                <div class="pg-toast-progress"><div class="pg-toast-progress-fill"></div></div>
            `;
            toast.querySelector(".pg-toast-close").addEventListener("click", () => removeToast(id));
            host.appendChild(toast);
        }

        toast.className = `pg-toast ${level}`;
        toast.querySelector(".pg-toast-message").textContent = message;

        const actions = toast.querySelector(".pg-toast-actions");
        actions.innerHTML = "";

        if (Array.isArray(options.actions)) {
            options.actions.forEach(action => {
                const button = action.href ? document.createElement("a") : document.createElement("button");

                button.textContent = action.label;
                button.type = action.href ? undefined : "button";

                if (action.href) {
                    button.href = action.href;
                    button.download = action.download || "";
                    button.target = "_blank";
                    button.rel = "noopener noreferrer";
                } else if (typeof action.onClick === "function") {
                    button.addEventListener("click", action.onClick);
                }

                actions.appendChild(button);
            });
        }

        actions.style.display = actions.children.length > 0 ? "" : "none";

        if (Number.isFinite(options.current) && Number.isFinite(options.total) && options.total > 0) {
            const percent = Math.max(0, Math.min(100, Math.round((options.current / options.total) * 100)));
            toast.querySelector(".pg-toast-progress-fill").style.width = `${percent}%`;
        } else if (options.done) {
            toast.querySelector(".pg-toast-progress-fill").style.width = "100%";
        }

        if (options.timeout) {
            removeToast(id, options.timeout);
        }

        return toast;
    }

    function setDownloadButtonDisabled(disabled) {
        const buttons = [
            document.getElementById("pg-download-zip"),
            document.getElementById("pg-sticky-zip"),
            document.getElementById("pg-more-download-zip"),
        ].filter(Boolean);
        const selected = getSelectedMedia().length;

        buttons.forEach(button => {
            button.disabled = disabled || selected === 0;
            const zipLabel = "ZIP";
            button.textContent = disabled ? "ZIP running…" : (selected > 0 ? `${zipLabel} (${selected})` : zipLabel);
        });
        updateMobileUiState();
    }


    function yieldToUi() {
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    function assertNotAborted(signal) {
        if (signal?.aborted) {
            throw new DOMException("Scan cancelled.", "AbortError");
        }
    }

    function abortableDelay(ms, signal) {
        assertNotAborted(signal);
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                signal?.removeEventListener("abort", onAbort);
                resolve();
            }, Math.max(0, ms));
            const onAbort = () => {
                clearTimeout(timer);
                reject(new DOMException("Scan cancelled.", "AbortError"));
            };
            signal?.addEventListener("abort", onAbort, { once: true });
        });
    }

    function parseRetryAfterMs(value) {
        if (!value) {
            return 0;
        }
        const seconds = Number(value);
        if (Number.isFinite(seconds) && seconds >= 0) {
            return seconds * 1000;
        }
        const timestamp = Date.parse(value);
        return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : 0;
    }

    function isRetryableScanStatus(status) {
        return [408, 425, 429, 500, 502, 503, 504].includes(Number(status));
    }

    async function fetchThreadDocument(url, signal, pageNumber = getPageNumberFromUrl(url)) {
        let lastError = null;

        for (let attempt = 1; attempt <= config.scanFetchMaxAttempts; attempt += 1) {
            assertNotAborted(signal);

            try {
                const response = await fetch(url, {
                    credentials: "include",
                    cache: attempt === 1 ? "default" : "no-cache",
                    signal,
                });

                if (response.ok) {
                    const html = await response.text();
                    return {
                        document: new DOMParser().parseFromString(html, "text/html"),
                        html,
                        attempts: attempt,
                    };
                }

                const error = new Error(`HTTP ${response.status}`);
                error.status = response.status;
                error.retryAfterMs = parseRetryAfterMs(response.headers.get("Retry-After"));
                lastError = error;

                if (!isRetryableScanStatus(response.status) || attempt >= config.scanFetchMaxAttempts) {
                    throw error;
                }
            } catch (error) {
                if (error?.name === "AbortError") {
                    throw error;
                }
                lastError = error;
                const retryable = error?.status ? isRetryableScanStatus(error.status) : error instanceof TypeError;
                if (!retryable || attempt >= config.scanFetchMaxAttempts) {
                    throw error;
                }
            }

            const exponentialMs = Math.min(config.scanRetryMaxMs, config.scanRetryBaseMs * (2 ** (attempt - 1)));
            const waitMs = Math.max(Number(lastError?.retryAfterMs) || 0, exponentialMs);
            state.scanPageFailures.set(pageNumber, {
                pageNumber,
                url,
                status: "retrying",
                attempt: attempt + 1,
                maxAttempts: config.scanFetchMaxAttempts,
                error: stringifyDebugValue(lastError),
            });
            setProgress(`Retrying page ${pageNumber} · attempt ${attempt + 1}/${config.scanFetchMaxAttempts} in ${Math.ceil(waitMs / 1000)}s`, 0, 1);
            addDebugLog("warn", "Retrying thread page scan.", { pageNumber, url, attempt: attempt + 1, waitMs, error: stringifyDebugValue(lastError) });
            await abortableDelay(waitMs, signal);
        }

        throw lastError || new Error("Thread page request failed.");
    }

    function getPageScanCacheKey(pageNumber) {
        return `scan:${getThreadCacheId()}:page:${pageNumber}`;
    }

    function fingerprintThreadPage(pageDocument) {
        const root = pageDocument?.querySelector?.(".p-body-pageContent, .block--messages, main") || pageDocument?.body;
        if (!root) {
            return "";
        }
        const markers = Array.from(root.querySelectorAll("article.message, .message, [data-content=message]"), node => {
            const id = node.getAttribute("data-content") || node.id || node.getAttribute("data-author") || "";
            const time = node.querySelector("time")?.getAttribute("datetime") || "";
            const mediaCount = node.querySelectorAll("img, video, source, a[href]").length;
            return `${id}:${time}:${mediaCount}`;
        });
        return hashString(markers.join("|") || root.textContent?.slice(0, 4096) || "");
    }

    async function loadPageScanCache(pageNumber) {
        try {
            const record = await getCacheRecord(getPageScanCacheKey(pageNumber));
            if (!record || record.kind !== "pageScan" || !Array.isArray(record.items)) {
                return null;
            }
            return { ...record, stale: Boolean(record.expiresAt && record.expiresAt < Date.now()) };
        } catch (error) {
            addDebugLog("warn", "Page scan cache load failed.", { pageNumber, error: stringifyDebugValue(error) });
            return null;
        }
    }

    async function savePageScanCache(pageNumber, url, pageDocument, items, signatureOverride = "") {
        try {
            const serializedItems = items.map(serializeMediaItem);
            const now = Date.now();
            await putCacheRecord({
                key: getPageScanCacheKey(pageNumber),
                threadId: getThreadCacheId(),
                kind: "pageScan",
                pageNumber,
                pageUrl: url,
                signature: signatureOverride || fingerprintThreadPage(pageDocument),
                items: serializedItems,
                size: JSON.stringify(serializedItems).length,
                createdAt: now,
                expiresAt: now + config.pageScanCacheTtlMs,
                temporary: false,
            });
        } catch (error) {
            addDebugLog("warn", "Page scan cache save failed.", { pageNumber, error: stringifyDebugValue(error) });
        }
    }

    function shouldRevalidateCachedPage(entry, lastPage, threadInfo) {
        if (!entry.cacheRecord || entry.cacheRecord.stale) {
            return true;
        }
        const tailStart = Math.max(1, lastPage - config.pageScanTailRevalidateCount + 1);
        return entry.pageNumber >= tailStart || entry.pageNumber === threadInfo.currentPage || isCurrentDocumentUrl(entry.url, threadInfo);
    }

    async function scanAllThreadPages() {
        if (state.scanRunning) {
            return;
        }

        const threadInfo = getThreadInfo();

        if (!threadInfo) {
            addMediaItems(scanMedia(document, 1));
            return;
        }

        state.scanRunning = true;
        state.scanAbortController = new AbortController();
        state.scanPageFailures.clear();
        setActionButtonsDisabled(true);
        setCancelButtonVisible(true);
        const signal = state.scanAbortController.signal;
        const queue = discoverThreadPageUrls(document, threadInfo);
        const lastPage = Math.max(1, ...queue.map(getPageNumberFromUrl));
        let completed = 0;
        let failed = 0;
        let reused = 0;
        let changed = 0;
        let pendingMedia = [];
        let pagesSinceFlush = 0;

        const flushPendingMedia = () => {
            if (pendingMedia.length === 0) {
                return 0;
            }

            const batch = pendingMedia;
            pendingMedia = [];
            pagesSinceFlush = 0;
            return addMediaItems(batch);
        };

        try {
            setProgress(`Preparing incremental scan · ${queue.length} page(s)`, 0, Math.max(queue.length, 1));
            const workQueue = await Promise.all(queue.map(async url => {
                const pageNumber = getPageNumberFromUrl(url);
                return { url, pageNumber, cacheRecord: await loadPageScanCache(pageNumber) };
            }));
            assertNotAborted(signal);

            await runConcurrent(workQueue, config.scanConcurrency, async entry => {
                assertNotAborted(signal);

                try {
                    if (!shouldRevalidateCachedPage(entry, lastPage, threadInfo)) {
                        const cachedItems = entry.cacheRecord.items.map(item => ({ ...item, el: null }));
                        pendingMedia.push(...cachedItems);
                        reused += 1;
                        state.lastKnownPage = Math.max(state.lastKnownPage, entry.pageNumber);
                        addDebugLog("trace", "Reused cached thread page scan.", { pageNumber: entry.pageNumber, items: cachedItems.length });
                    } else {
                        let pageDocument;
                        let signature = "";
                        if (isCurrentDocumentUrl(entry.url, threadInfo)) {
                            pageDocument = document;
                            signature = fingerprintThreadPage(pageDocument);
                        } else {
                            const fetched = await fetchThreadDocument(entry.url, signal, entry.pageNumber);
                            pageDocument = fetched.document;
                            signature = fingerprintThreadPage(pageDocument);
                        }

                        state.lastKnownPage = Math.max(state.lastKnownPage, entry.pageNumber);
                        const signatureMatches = Boolean(entry.cacheRecord?.signature && signature && entry.cacheRecord.signature === signature);
                        if (signatureMatches) {
                            const cachedItems = entry.cacheRecord.items.map(item => ({ ...item, el: null }));
                            pendingMedia.push(...cachedItems);
                            reused += 1;
                            // Refresh the TTL of a verified unchanged page without rescanning its DOM.
                            await savePageScanCache(entry.pageNumber, entry.url, pageDocument, cachedItems, signature);
                        } else {
                            const pageItems = scanMedia(pageDocument, entry.pageNumber);
                            pendingMedia.push(...pageItems);
                            if (entry.cacheRecord) {
                                changed += 1;
                                addDebugLog("info", "Changed thread page detected; media rescanned.", { pageNumber: entry.pageNumber, previousSignature: entry.cacheRecord.signature, signature });
                            } else {
                                addDebugLog("info", "New uncached thread page scanned.", { pageNumber: entry.pageNumber, items: pageItems.length });
                            }
                            await savePageScanCache(entry.pageNumber, entry.url, pageDocument, pageItems, signature);
                        }
                    }

                    state.scanPageFailures.delete(entry.pageNumber);
                    pagesSinceFlush += 1;
                    if (pagesSinceFlush >= config.scanBatchPages) {
                        flushPendingMedia();
                    }
                } catch (error) {
                    if (error?.name === "AbortError") {
                        throw error;
                    }
                    failed += 1;
                    const usedCachedFallback = Boolean(entry.cacheRecord?.items);
                    if (usedCachedFallback) {
                        pendingMedia.push(...entry.cacheRecord.items.map(item => ({ ...item, el: null })));
                        reused += 1;
                    }
                    state.scanPageFailures.set(entry.pageNumber, {
                        pageNumber: entry.pageNumber,
                        url: entry.url,
                        status: usedCachedFallback ? "failed-cached-fallback" : "failed",
                        cachedFallback: usedCachedFallback,
                        error: stringifyDebugValue(error),
                    });
                    addDebugLog("warn", "Thread page scan failed after retries.", { pageNumber: entry.pageNumber, url: entry.url, cachedFallback: usedCachedFallback, error: stringifyDebugValue(error) });
                } finally {
                    completed += 1;
                    const message = `Scanning pages: ${completed}/${queue.length} · ${reused} cached · ${changed} changed · ${failed} failed · ${state.mediaById.size + pendingMedia.length} candidates`;
                    setProgress(message, completed, queue.length);
                }
            });

            flushPendingMedia();
            state.scanStarted = true;
            renderGrid();
            clearProgress(`Scan complete. Found ${state.mediaById.size} media item(s).`);
            const failedPages = Array.from(state.scanPageFailures.keys()).sort((a, b) => a - b);
            const failedSuffix = failedPages.length ? ` · failed pages ${failedPages.join(", ")}` : "";
            showToast("scan", `Scan complete · ${state.mediaById.size} media · ${reused} cached · ${changed} changed · ${failed} failed${failedSuffix}`, {
                level: failed > 0 ? "warn" : "ok",
                done: true,
                timeout: 4500,
            });
            addDebugLog(failed > 0 ? "warn" : "ok", "Incremental thread scan complete.", { pages: queue.length, reused, changed, failed, media: state.mediaById.size, failures: Array.from(state.scanPageFailures.values()) });
            scheduleThreadMetadataCacheSave();
        } catch (error) {
            flushPendingMedia();

            if (error?.name === "AbortError") {
                clearProgress(`Scan cancelled. Found ${state.mediaById.size} media item(s).`);
                showToast("scan", `Scan cancelled. Progress was saved; the next scan can resume from cached pages.`, { level: "warn", done: true, timeout: 4500 });
            } else {
                clearProgress(`Scan stopped. Found ${state.mediaById.size} media item(s).`);
                showToast("scan", `Scan stopped. Found ${state.mediaById.size} media item(s).`, { level: "error", done: true, timeout: 5000 });
                addDebugLog("error", "Thread scan crashed.", { error: stringifyDebugValue(error) });
            }
        } finally {
            state.scanRunning = false;
            state.scanAbortController = null;
            setActionButtonsDisabled(false);
            setCancelButtonVisible(false);
            void updateCacheStats();
        }
    }

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
        container.querySelector("#pg-progress-details").addEventListener("click", () => setDebugPanelVisible(true));
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

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#039;",
            };

            return entities[char];
        });
    }

    function buildFileName(item, index) {
        const url = new URL(item.src);
        const rawName = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || "");
        const extension = getExtension(item.src) || (item.type === "video" ? "mp4" : "bin");

        const baseName = rawName
            .replace(/\.[a-z0-9]+$/i, "")
            .replace(/[^a-z0-9_-]+/gi, "_")
            .replace(/^_+|_+$/g, "")
            .slice(0, 80);

        return `lpsg_${item.type}_${String(index + 1).padStart(4, "0")}_${baseName || "file"}.${extension}`;
    }

    function getExtensionFromMimeType(mimeType, fallback = "bin") {
        const clean = String(mimeType || "").split(";")[0].trim().toLowerCase();
        const map = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/avif": "avif",
            "video/mp4": "mp4",
            "video/quicktime": "mov",
            "video/x-m4v": "m4v",
        };

        return map[clean] || fallback;
    }

    function improveFileNameFromBlob(fileName, blob) {
        if (!/\.bin$/i.test(fileName)) {
            return fileName;
        }

        const extension = getExtensionFromMimeType(blob?.type, "bin");

        if (extension === "bin") {
            return fileName;
        }

        return fileName.replace(/\.bin$/i, `.${extension}`);
    }


    function exportFailedUrls() {
        if (state.lastFailedZipEntries.length === 0) {
            showToast("debug", "No failed ZIP URLs to export.", {
                level: "info",
                timeout: 3500,
            });
            return;
        }

        const text = state.lastFailedZipEntries
            .flatMap(entry => [
                `# ${entry.fileName || "failed media"}`,
                `# ${entry.error || "Unknown error"}`,
                ...(entry.sources || []),
                "",
            ])
            .join("\n");

        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `lpsg_failed_urls_${Date.now()}.txt`;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }


    function exportUrls() {
        const selectedItems = getSelectedMedia();
        const items = selectedItems.length > 0 ? selectedItems : getAllMedia();

        if (items.length === 0) {
            alert("No media URLs to export.");
            return;
        }

        const text = items
            .map(item => {
                if (item.type === "video" && item.sources?.length) {
                    return item.sources.join("\n");
                }

                return item.src;
            })
            .join("\n");

        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "lpsg_gallery_urls.txt";
        link.click();

        URL.revokeObjectURL(url);
    }

    function getDownloadSources(item) {
        const sources = [];
        const cachedWorkingUrl = item.workingUrl || loadCachedWorkingUrl(item);

        if (cachedWorkingUrl) {
            sources.push(cachedWorkingUrl);
        }

        if (item.type === "video") {
            sources.push(...(item.sources || []));
            sources.push(...(item.el instanceof HTMLVideoElement ? getVideoSources(item.el) : []));
            sources.push(...(item.el ? getVideoUrlsNearElement(item.el) : []));
        }

        sources.push(item.src);

        if (item.type === "video") {
            return prioritizeDownloadSources(getUniqueVideoUrls(sources));
        }

        if (isVideoPosterUrl(item.src)) {
            addDebugLog("warn", "ZIP skipped video poster image masquerading as media.", {
                itemId: item.id || null,
                src: item.src,
                pageNumber: item.pageNumber || null,
                postUrl: item.postUrl || null,
            });
            return [];
        }

        return prioritizeDownloadSources(
            sources
                .map(normalizeUrl)
                .filter(Boolean)
                .filter(url => !isVideoPosterUrl(url))
                .filter((url, index, array) => array.indexOf(url) === index)
        );
    }

    async function fetchWithTimeout(sourceUrl, item, context = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.zipItemTimeoutMs);

        try {
            const response = await fetch(sourceUrl, {
                credentials: "include",
                cache: "no-store",
                referrer: item.postUrl || window.location.href,
                signal: controller.signal,
                headers: {
                    Accept: item.type === "video" ? "video/*,*/*;q=0.8" : "image/*,*/*;q=0.8",
                },
            });

            const responseInfo = {
                runId: context.runId,
                index: context.index,
                url: sourceUrl,
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get("content-type"),
                contentLength: response.headers.get("content-length"),
            };

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error("Empty response body.");
            }

            return {
                blob,
                responseInfo,
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async function waitIfZipPaused() {
        while (state.zipPaused) {
            if (state.zipAbortController?.signal?.aborted) {
                throw new DOMException("ZIP cancelled.", "AbortError");
            }

            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }

    async function fetchFirstAvailableBlob(item, context = {}) {
        const sources = getDownloadSources(item);
        let lastError = null;

        addDebugLog("trace", "ZIP item source list prepared.", {
            runId: context.runId,
            index: context.index,
            type: item.type,
            pageNumber: item.pageNumber || null,
            postUrl: item.postUrl || null,
            fileName: context.fileName || null,
            sourceCount: sources.length,
            sources,
            blobCache: config.enableBlobCache,
        });

        if (sources.length === 0) {
            throw new Error("No downloadable sources found.");
        }

        for (const [sourceIndex, sourceUrl] of sources.entries()) {
            await waitIfZipPaused();

            if (state.zipAbortController?.signal?.aborted) {
                throw new DOMException("ZIP cancelled.", "AbortError");
            }

            if (isZipSourceHostBlocked(sourceUrl)) {
                addDebugLog("verbose", "ZIP source skipped: host blocked after network/CORS failure.", {
                    runId: context.runId,
                    index: context.index,
                    sourceIndex: sourceIndex + 1,
                    sourceCount: sources.length,
                    url: sourceUrl,
                    host: getUrlHost(sourceUrl),
                });
                continue;
            }

            try {
                const cached = await getCachedMediaBlob(item, sourceUrl, context);

                if (cached?.blob) {
                    saveCachedWorkingUrl(item, sourceUrl);
                    rememberZipSourceResult(sourceUrl, true);
                    return cached;
                }

                addDebugLog("trace", "ZIP fetch attempt started.", {
                    runId: context.runId,
                    index: context.index,
                    sourceIndex: sourceIndex + 1,
                    sourceCount: sources.length,
                    url: sourceUrl,
                    timeoutMs: config.zipItemTimeoutMs,
                });

                const result = await fetchWithTimeout(sourceUrl, item, context);

                addDebugLog("verbose", "ZIP fetch succeeded.", {
                    ...result.responseInfo,
                    sourceIndex: sourceIndex + 1,
                    blobSize: result.blob.size,
                    blobType: result.blob.type,
                });

                saveCachedWorkingUrl(item, sourceUrl);
                rememberZipSourceResult(sourceUrl, true);

                return {
                    blob: result.blob,
                    url: sourceUrl,
                    fromCache: false,
                };
            } catch (error) {
                lastError = error;
                rememberZipSourceResult(sourceUrl, false, error);
                addDebugLog("warn", "ZIP fetch attempt failed.", {
                    runId: context.runId,
                    index: context.index,
                    sourceIndex: sourceIndex + 1,
                    sourceCount: sources.length,
                    url: sourceUrl,
                    error: stringifyDebugValue(error),
                });
            }
        }

        throw lastError || new Error("No available source.");
    }


    async function runConcurrent(items, concurrency, worker) {
        const queue = [...items];
        const workerCount = Math.max(1, Math.min(Math.max(1, concurrency), queue.length || 1));

        const workers = Array.from({ length: workerCount }, async () => {
            while (queue.length > 0) {
                const item = queue.shift();
                await worker(item);

                if (queue.length % config.uiYieldEvery === 0) {
                    await yieldToUi();
                }
            }
        });

        await Promise.all(workers);
    }

    async function downloadAllAsZip() {
        if (state.zipRunning) {
            showToast("zip", "ZIP is already running in the background.", {
                level: "warn",
                timeout: 3000,
            });
            return;
        }

        if (typeof zip === "undefined" || !zip.ZipWriter) {
            alert("zip.js failed to load.");
            addDebugLog("error", "zip.js is undefined.");
            return;
        }

        const items = getSelectedMedia();
        if (state.zipGrouping === "page") {
            items.sort((a, b) => (Number(a.pageNumber) || 1) - (Number(b.pageNumber) || 1) || (Number(a.orderIndex) || 0) - (Number(b.orderIndex) || 0));
        }

        if (items.length === 0) {
            alert("Select at least one media item to zip.");
            addDebugLog("warn", "ZIP requested with no selected media.");
            showToast("zip", "Select at least one media item first.", {
                level: "warn",
                timeout: 3500,
            });
            return;
        }

        const runId = state.debugRunId + 1;
        state.debugRunId = runId;
        setDebugPanelVisible(true);

        const estimate = getZipEstimate(items);
        const estimateLabel = estimate.knownBytes > 0
            ? ` · known size ~${formatBytes(estimate.knownBytes)}${estimate.unknownCount ? ` + ${estimate.unknownCount} unknown` : ""}`
            : ` · size unknown`;
        const groupingLabel = state.zipGrouping === "page" ? " · grouped by page" : "";
        showToast("zip", `ZIP started: ${items.length} item(s)${estimateLabel}${groupingLabel}`, {
            current: 0,
            total: items.length,
        });

        addDebugLog("info", "ZIP background run queued.", {
            runId,
            selectedItems: items.length,
            totalItems: state.mediaById.size,
            videoItems: items.filter(item => item.type === "video").length,
            imageItems: items.filter(item => item.type === "image").length,
            zipConcurrency: config.zipConcurrency,
            page: window.location.href,
            android: /Android/i.test(navigator.userAgent),
        });

        void runZipDownloadInBackground(items, runId);
    }

    function updateToastProgressOnly(id, message, current, total, level = "info") {
        const toast = document.getElementById(`pg-toast-${id}`);

        if (!toast) {
            return false;
        }

        toast.className = `pg-toast ${level}`;
        toast.querySelector(".pg-toast-message").textContent = message;

        if (Number.isFinite(current) && Number.isFinite(total) && total > 0) {
            const percent = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
            toast.querySelector(".pg-toast-progress-fill").style.width = `${percent}%`;
        }

        return true;
    }

    function updateZipProgressUi(message, current, total, level = "info", force = false) {
        const now = performance.now();
        const last = state.lastZipProgressUpdate || 0;

        if (!force && now - last < config.zipProgressIntervalMs) {
            return;
        }

        state.lastZipProgressUpdate = now;
        setProgress(message, current, total);

        if (!updateToastProgressOnly("zip", message, current, total, level)) {
            showToast("zip", message, {
                current,
                total,
                level,
                actions: buildZipToastActions(),
            });
        }
    }

    function sanitizeArchiveBaseName(value) {
        const original = String(value || "").normalize("NFKC");
        const normalized = original
            .replace(/[\u0000-\u001f\u007f]/g, " ")
            .replace(/\s*(?:[|_]|[-–—])\s*LPSG(?:\s*(?:[|_]|[-–—]).*)?$/i, "")
            .replace(/\s*(?:[|_]|[-–—])\s*Page\s+\d+\s*$/i, "")
            .replace(/[<>"/\\|?*]+/g, " ")
            .replace(/\s*:\s*/g, " - ")
            .replace(/\s*[-–—]\s*/g, " - ")
            .replace(/\s*_\s*/g, "_")
            .replace(/\s+/g, " ")
            .replace(/[. ]+$/g, "")
            .trim();
        const safeName = normalized || original.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]+/g, " ").trim();
        const reservedName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
        const boundedName = Array.from(safeName || "lpsg_gallery_media").slice(0, 160).join("").replace(/[. ]+$/g, "");

        if (!boundedName) {
            return "lpsg_gallery_media";
        }

        return reservedName.test(boundedName) ? `_${boundedName}` : boundedName;
    }

    function getPageArchiveBaseName() {
        const threadInfo = getThreadInfo();
        const titleCandidates = [
            document.querySelector("h1.p-title-value")?.textContent,
            document.querySelector(".p-title-value")?.textContent,
            document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
            document.querySelector('meta[name="twitter:title"]')?.getAttribute("content"),
            document.title,
            threadInfo?.slug ? threadInfo.slug.replace(/[-_]+/g, " ") : "",
        ];
        const pageName = titleCandidates.find(value => String(value || "").trim());
        return sanitizeArchiveBaseName(pageName || "lpsg_gallery_media");
    }

    function triggerZipPartDownload(blob, partNumber, isOnlyPart, runId, jobId, archiveBaseName, pageNumber = null, pagePartIndex = 1) {
        const zipUrl = URL.createObjectURL(blob);
        const baseName = sanitizeArchiveBaseName(archiveBaseName || getPageArchiveBaseName());
        const pageSuffix = pageNumber ? ` - page ${String(pageNumber).padStart(2, "0")}` : "";
        const displayPart = pageNumber ? pagePartIndex : partNumber;
        const partSuffix = isOnlyPart && displayPart === 1 ? "" : ` - part ${String(displayPart).padStart(2, "0")}`;
        const fileName = `${baseName}${pageSuffix}${partSuffix}.zip`;
        const link = document.createElement("a");
        link.href = zipUrl;
        link.download = fileName;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();

        addDebugLog("info", "ZIP part download triggered.", {
            runId,
            jobId,
            fileName,
            partNumber,
            zipSize: blob.size,
        });

        setTimeout(() => URL.revokeObjectURL(zipUrl), isMobileProfile ? 10 * 60 * 1000 : 2 * 60 * 1000);
        return { label: isOnlyPart ? "Open ZIP" : `Open part ${partNumber}`, href: zipUrl, download: fileName };
    }

    async function runZipDownloadInBackground(items, runId) {
        let completed = 0;
        let failed = 0;
        let stagedBytes = 0;
        let archivedBytes = 0;
        let archivedFiles = 0;
        let partNumber = 0;
        let partBytes = 0;
        let partFiles = 0;
        let writer = null;
        let currentPartPage = null;
        let currentPagePartIndex = 0;
        let partManifestEntries = [];
        const emittedFailures = new Set();
        const failedEntries = [];
        const downloadActions = [];
        const jobId = `zip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const archiveBaseName = getPageArchiveBaseName();
        const partLimitBytes = getZipPartLimitBytes();
        const grouping = state.zipGrouping;
        const startedAt = performance.now();

        state.zipRunning = true;
        state.zipPaused = false;
        state.currentZipJobId = jobId;
        state.zipAbortController = new AbortController();
        state.lastFailedZipEntries = [];
        state.lastZipItems = items;
        state.lastZipProgressUpdate = 0;
        state.blockedZipSourceHosts = new Map();
        state.zipSourceScores = new Map();
        setDownloadButtonDisabled(true);
        setZipControlButtonsVisible(true);
        updateZipProgressUi(`Preparing ZIP: 0/${items.length}`, 0, items.length, "info", true);

        addDebugLog("info", "ZIP run started.", {
            runId,
            jobId,
            totalItems: items.length,
            videoItems: items.filter(item => item.type === "video").length,
            imageItems: items.filter(item => item.type === "image").length,
            fetchConcurrency: config.zipConcurrency,
            partLimitBytes,
            grouping,
            resumeCacheEnabled: state.keepTempCacheAfterZip,
            page: window.location.href,
            archiveBaseName,
            android: isAndroid,
            mobileProfile: isMobileProfile,
        });

        const openPart = (pageNumber = null) => {
            partNumber += 1;
            partBytes = 0;
            partFiles = 0;
            const nextPage = grouping === "page" ? (Number(pageNumber) || 1) : null;
            currentPagePartIndex = nextPage && nextPage === currentPartPage ? currentPagePartIndex + 1 : 1;
            currentPartPage = nextPage;
            partManifestEntries = [];
            writer = new zip.ZipWriter(
                new zip.BlobWriter("application/zip"),
                { level: 0, bufferedWrite: false }
            );
        };

        const closePart = async isOnlyPart => {
            if (!writer || partFiles === 0) {
                return;
            }

            updateZipProgressUi(`Finalizing ZIP part ${partNumber}…`, archivedFiles, items.length, failed > 0 ? "warn" : "info", true);
            const closeStartedAt = performance.now();
            const partFailures = failedEntries.filter(entry => {
                if (emittedFailures.has(entry)) return false;
                if (grouping !== "page") return true;
                return (Number(entry.item?.pageNumber) || 1) === currentPartPage;
            });
            partFailures.forEach(entry => emittedFailures.add(entry));
            const manifest = buildArchiveManifest({
                runId, jobId, partNumber, archiveBaseName, grouping,
                pageNumber: currentPartPage,
                entries: partManifestEntries,
                failures: partFailures,
            });
            await writer.add("manifest.json", new zip.TextReader(JSON.stringify(manifest, null, 2)), { level: 0 });
            const zipBlob = await writer.close();
            const action = triggerZipPartDownload(zipBlob, partNumber, isOnlyPart, runId, jobId, archiveBaseName, currentPartPage, currentPagePartIndex);
            downloadActions.push(action);
            addDebugLog("ok", "ZIP part finalized.", {
                runId,
                jobId,
                partNumber,
                files: partFiles,
                inputBytes: partBytes,
                zipBytes: zipBlob.size,
                elapsedMs: Math.round(performance.now() - closeStartedAt),
            });
            writer = null;
            partBytes = 0;
            partFiles = 0;
            partManifestEntries = [];
        };

        try {
            await pruneExpiredCache();
            const indexedItems = items.map((item, index) => ({ item, index }));

            for (let offset = 0; offset < indexedItems.length; offset += config.zipConcurrency) {
                await waitIfZipPaused();
                assertNotAborted(state.zipAbortController?.signal);
                const batch = indexedItems.slice(offset, offset + config.zipConcurrency);
                const fetchedBatch = await Promise.all(batch.map(async entry => {
                    const fileName = buildFileName(entry.item, entry.index);

                    try {
                        const result = await fetchFirstAvailableBlob(entry.item, {
                            runId,
                            jobId,
                            index: entry.index + 1,
                            total: items.length,
                            fileName,
                        });
                        const zipItem = { ...entry.item, src: result.url };
                        return {
                            ...entry,
                            zipItem,
                            fileName: improveFileNameFromBlob(buildFileName(zipItem, entry.index), result.blob),
                            blob: result.blob,
                            url: result.url,
                            fromCache: Boolean(result.fromCache),
                        };
                    } catch (error) {
                        failed += 1;
                        failedEntries.push({
                            item: entry.item,
                            index: entry.index,
                            fileName,
                            error: stringifyDebugValue(error),
                            sources: getDownloadSources(entry.item),
                        });
                        addDebugLog("error", "ZIP item failed after all sources.", {
                            runId,
                            index: entry.index + 1,
                            type: entry.item.type,
                            pageNumber: entry.item.pageNumber || null,
                            postUrl: entry.item.postUrl || null,
                            error: stringifyDebugValue(error),
                        });
                        return null;
                    } finally {
                        completed += 1;
                    }
                }));

                const successfulBatch = fetchedBatch.filter(Boolean).sort((a, b) => a.index - b.index);

                if (state.keepTempCacheAfterZip && successfulBatch.length > 0) {
                    const batchBytes = successfulBatch.reduce((sum, file) => sum + file.blob.size, 0);
                    const hasCacheRoom = await ensureCacheRoom(batchBytes);

                    if (hasCacheRoom) {
                        await Promise.all(successfulBatch.map(file =>
                            cacheMediaBlob(file.item, file.url, file.blob, jobId, true)
                                .catch(error => addDebugLog("warn", "ZIP batch cache write failed; continuing.", {
                                    runId,
                                    index: file.index + 1,
                                    error: stringifyDebugValue(error),
                                }))
                        ));
                    } else {
                        addDebugLog("warn", "ZIP batch cache skipped: total cache limit.", {
                            runId,
                            batchBytes,
                            limit: config.maxBlobCacheBytes,
                        });
                    }
                }

                for (const file of successfulBatch) {
                    await waitIfZipPaused();
                    assertNotAborted(state.zipAbortController?.signal);
                    stagedBytes += file.blob.size;

                    const filePage = Number(file.item.pageNumber) || 1;
                    if (!writer) {
                        openPart(filePage);
                    }

                    if (grouping === "page" && partFiles > 0 && currentPartPage !== filePage) {
                        await closePart(true);
                        openPart(filePage);
                    } else if (partFiles > 0 && partBytes + file.blob.size > partLimitBytes) {
                        await closePart(false);
                        openPart(filePage);
                    }

                    const addStartedAt = performance.now();
                    await writer.add(file.fileName, new zip.BlobReader(file.blob), {
                        level: 0,
                        onprogress: (loaded, total) => {
                            const filePercent = total > 0 ? Math.round((loaded / total) * 100) : 0;
                            updateZipProgressUi(
                                `Building ZIP part ${partNumber}: ${archivedFiles}/${items.length} files · current ${filePercent}% · ${failed} failed`,
                                archivedFiles,
                                items.length,
                                failed > 0 ? "warn" : "info"
                            );
                        },
                    });
                    partBytes += file.blob.size;
                    partFiles += 1;
                    partManifestEntries.push({ item: file.item, fileName: file.fileName, url: file.url, size: file.blob.size });
                    archivedBytes += file.blob.size;
                    archivedFiles += 1;

                    addDebugLog("trace", "ZIP file archived.", {
                        runId,
                        index: file.index + 1,
                        fileName: file.fileName,
                        size: file.blob.size,
                        partNumber,
                        elapsedMs: Math.round(performance.now() - addStartedAt),
                    });
                    file.blob = null;
                }

                const message = `Building ZIP: ${completed}/${items.length} fetched · ${archivedFiles} archived · ${failed} failed · ${formatBytes(archivedBytes)}`;
                updateZipProgressUi(message, completed, items.length, failed > 0 ? "warn" : "info", true);

                if (completed % 20 === 0 || completed === items.length) {
                    addDebugLog("info", "ZIP progress checkpoint.", {
                        runId,
                        completed,
                        archivedFiles,
                        failed,
                        archivedBytes,
                        currentPart: partNumber,
                        currentPartBytes: partBytes,
                    });
                }

                await yieldToUi();
            }

            state.lastFailedZipEntries = failedEntries;

            if (archivedFiles === 0) {
                throw new Error("No files could be fetched for ZIP.");
            }

            await closePart(grouping === "page" || partNumber === 1);
            const elapsedMs = Math.round(performance.now() - startedAt);
            clearProgress(`ZIP complete. ${archivedFiles} file(s) added, ${failed} failed.`);
            showToast("zip", `ZIP complete: ${archivedFiles}/${items.length} added · ${failed} failed · ${partNumber} part(s).`, {
                level: failed > 0 ? "warn" : "ok",
                done: true,
                actions: [...downloadActions.slice(-3), ...buildZipToastActions()],
                timeout: isMobileProfile ? 0 : 9000,
            });
            addDebugLog(failed > 0 ? "warn" : "ok", "ZIP run complete.", {
                runId,
                jobId,
                added: archivedFiles,
                failed,
                parts: partNumber,
                inputBytes: stagedBytes,
                archivedBytes,
                elapsedMs,
                averageMiBPerSecond: elapsedMs > 0 ? Number((archivedBytes / 1048576 / (elapsedMs / 1000)).toFixed(2)) : null,
                mobileProfile: isMobileProfile,
            });

            if (config.autoDeleteAfterSuccessfulZip && !state.keepTempCacheAfterZip) {
                void clearJobTempCache(jobId);
            }
        } catch (error) {
            state.lastFailedZipEntries = failedEntries;
            try {
                if (writer) {
                    await writer.close();
                }
            } catch {
                // Ignore cleanup failures after cancellation/crash.
            }

            const cancelled = error?.name === "AbortError";
            clearProgress(cancelled ? "ZIP cancelled." : `ZIP failed. ${archivedFiles} file(s) added, ${failed} failed.`);
            showToast("zip", cancelled ? "ZIP cancelled." : "ZIP failed. Open Debug for details.", {
                level: cancelled ? "warn" : "error",
                done: true,
                timeout: 7000,
                actions: buildZipToastActions(),
            });
            addDebugLog(cancelled ? "warn" : "error", cancelled ? "ZIP run cancelled." : "ZIP run crashed.", {
                runId,
                jobId,
                completed,
                archivedFiles,
                failed,
                error: stringifyDebugValue(error),
            });
        } finally {
            state.zipRunning = false;
            state.zipPaused = false;
            state.zipAbortController = null;
            state.currentZipJobId = "";
            setDownloadButtonDisabled(false);
            setZipControlButtonsVisible(false);
            updateSelectionSummary();
            void updateCacheStats();
        }
    }


    function buildZipToastActions() {
        const actions = [];

        if (state.zipRunning) {
            actions.push({
                label: state.zipPaused ? "Resume" : "Pause",
                onClick: toggleZipPause,
            });
            actions.push({
                label: "Cancel",
                onClick: cancelZipDownload,
            });
        }

        if (state.lastFailedZipEntries.length > 0) {
            actions.push({
                label: `Retry failed (${state.lastFailedZipEntries.length})`,
                onClick: retryFailedZipItems,
            });
        }

        actions.push({
            label: "Debug",
            onClick: () => setDebugPanelVisible(true),
        });

        return actions;
    }

    function setZipControlButtonsVisible(visible) {
        const pauseButtons = [
            document.getElementById("pg-zip-pause"),
            document.getElementById("pg-more-zip-pause"),
        ].filter(Boolean);
        const cancelButtons = [
            document.getElementById("pg-zip-cancel"),
            document.getElementById("pg-more-zip-cancel"),
        ].filter(Boolean);

        pauseButtons.forEach(button => {
            button.style.display = visible ? "" : "none";
            button.textContent = state.zipPaused ? "Resume" : (button.id === "pg-more-zip-pause" ? "Pause ZIP" : "Pause");
        });

        cancelButtons.forEach(button => {
            button.style.display = visible ? "" : "none";
        });

        updateMobileUiState();
    }

    function toggleZipPause() {
        if (!state.zipRunning) {
            return;
        }

        state.zipPaused = !state.zipPaused;
        setZipControlButtonsVisible(true);
        showToast("zip", state.zipPaused ? "ZIP paused." : "ZIP resumed.", {
            level: state.zipPaused ? "warn" : "info",
            actions: buildZipToastActions(),
        });
        addDebugLog("info", state.zipPaused ? "ZIP paused by user." : "ZIP resumed by user.");
    }

    function cancelZipDownload() {
        if (state.zipAbortController) {
            state.zipAbortController.abort();
        }

        state.zipPaused = false;
        setZipControlButtonsVisible(false);
        addDebugLog("warn", "ZIP cancel requested by user.");
    }

    function retryFailedZipItems() {
        if (state.zipRunning) {
            showToast("zip", "Wait for the current ZIP job to finish before retrying failed items.", {
                level: "warn",
                timeout: 4000,
            });
            return;
        }

        const failedItems = state.lastFailedZipEntries
            .map(entry => entry.item)
            .filter(Boolean);

        if (failedItems.length === 0) {
            showToast("zip", "No failed ZIP items to retry.", {
                level: "info",
                timeout: 3500,
            });
            return;
        }

        selectFailedMedia();
        const runId = state.debugRunId + 1;
        state.debugRunId = runId;
        setDebugPanelVisible(true);
        showToast("zip", `Retrying failed ZIP items: 0/${failedItems.length}`, {
            current: 0,
            total: failedItems.length,
            actions: buildZipToastActions(),
        });
        void runZipDownloadInBackground(failedItems, runId);
    }

    function getPagetualRoots(mutations) {
        const roots = [];

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }

                const mightContainMedia =
                    node.matches?.(
                        ".message, .message--post, .block-body, .js-replyNewMessageContainer, " +
                        ".video-easter-egg-poster, a[href*='/attachments/'], img[src*='/attachments/']"
                    ) ||
                    node.querySelector?.(
                        ".message-cell--main, .message--post, .video-easter-egg-poster, " +
                        "a[href*='/attachments/'], a[href*='/data/attachments/'], " +
                        "img[src*='/attachments/'], img[src*='/data/attachments/'], " +
                        "video, source[src]"
                    );

                if (mightContainMedia) {
                    roots.push(node);
                }
            });
        });

        return roots;
    }

    function schedulePagetualScan(roots) {
        roots.forEach(root => state.pendingRoots.add(root));
        clearTimeout(state.debounceTimer);

        state.debounceTimer = setTimeout(() => {
            const rootsToScan = Array.from(state.pendingRoots);
            state.pendingRoots.clear();

            let added = 0;

            rootsToScan.forEach(root => {
                added += addMediaItems(scanMedia(root, state.lastKnownPage));
            });

            if (added > 0 && state.container) {
                setProgress(`Pagetual added ${added} new media item(s).`, 1, 1);
                setTimeout(() => clearProgress(), 1200);
            }
        }, config.observerDebounceMs);
    }

    function startPagetualObserver() {
        if (state.observer) {
            return;
        }

        const root =
            document.querySelector(".p-body-main") ||
            document.querySelector(".block-container") ||
            document.body;

        state.observer = new MutationObserver(mutations => {
            const roots = getPagetualRoots(mutations);

            if (roots.length > 0) {
                schedulePagetualScan(roots);
            }
        });

        state.observer.observe(root, {
            childList: true,
            subtree: true,
        });
    }

    function createThreadTab() {
        if (document.querySelector(".pg-tab-launcher")) {
            return true;
        }

        const tabContainer =
            document.querySelector(".tabs") ||
            document.querySelector(".block-tabHeader") ||
            document.querySelector(".p-sectionLinks-list");

        if (!tabContainer) {
            return false;
        }

        const sampleTab =
            tabContainer.querySelector("a.tabs-tab") ||
            tabContainer.querySelector("a.block-tabHeader-tab") ||
            tabContainer.querySelector("a.p-sectionLinks-link");

        const tab = document.createElement("a");

        tab.href = "#";
        tab.className = sampleTab
            ? `${sampleTab.className.replace(/\bis-active\b/g, "").trim()} pg-gallery-launcher pg-tab-launcher`
            : "tabs-tab pg-gallery-launcher pg-tab-launcher";

        tab.textContent = "Gallery";
        tab.title = "Open Gallery";

        tab.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            openGallery();
        });

        tabContainer.appendChild(tab);
        return true;
    }

    function createNavButton() {
        if (document.querySelector(".pg-nav-launcher")) {
            return true;
        }

        const navGroups = document.querySelectorAll(".p-navgroup.p-account");

        if (navGroups.length === 0) {
            return false;
        }

        navGroups.forEach(navGroup => {
            if (navGroup.querySelector(".pg-nav-launcher")) {
                return;
            }

            const button = document.createElement("a");

            button.className = "p-navgroup-link u-ripple p-navgroup-link--iconic p-navgroup-link--iconic--media pg-gallery-launcher pg-nav-launcher";
            button.title = "Open Gallery";
            button.href = "#";
            button.innerHTML = `
                <i aria-hidden="true" class="fa fa-images"></i>
                <span class="p-navgroup-linkText">Gallery</span>
            `;

            button.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                openGallery();
            });

            navGroup.appendChild(button);
        });

        return true;
    }

    function closeToolsMenu() {
        const menu = document.getElementById("pg-tools-menu");
        const button = document.querySelector(".pg-floating-launcher");

        state.fabMenuOpen = false;
        menu?.classList.remove("visible");
        button?.classList.remove("pg-tools-open");
        button?.setAttribute("aria-expanded", "false");
    }

    function toggleToolsMenu() {
        const menu = document.getElementById("pg-tools-menu");
        const button = document.querySelector(".pg-floating-launcher");

        if (!menu || !button) {
            return;
        }

        if (!state.fabMenuOpen) {
            closeGalleryMoreSheet();
        }

        state.fabMenuOpen = !state.fabMenuOpen;
        menu.classList.toggle("visible", state.fabMenuOpen);
        button.classList.toggle("pg-tools-open", state.fabMenuOpen);
        button.setAttribute("aria-expanded", state.fabMenuOpen ? "true" : "false");
    }

    function prepareMediaToolAction() {
        if (isThreadPage()) {
            state.lastKnownPage = Math.max(1, state.lastKnownPage, getThreadInfo()?.currentPage || 1);
            addMediaItems(scanMedia(document, getThreadInfo()?.currentPage || 1));
            return;
        }

        addMediaItems(scanMedia(document, 1));
    }

    function openDebugOnlyPanel() {
        closeToolsMenu();
        buildGalleryUI();

        const container = document.getElementById("pg-container");

        container?.classList.remove("pg-visible");
        container?.classList.add("pg-debug-only");
        setDebugPanelVisible(true);
        showToast("Debug panel opened.", "info", 1600);
    }

    function runFabAction(action) {
        closeToolsMenu();

        if (action !== "open" && action !== "debug") {
            prepareMediaToolAction();
        }

        if (action === "open") {
            void openGallery();
            return;
        }

        if (action === "scan") {
            void runManualRescan();
            return;
        }

        if (action === "zip") {
            void downloadAllAsZip();
            return;
        }

        if (action === "urls") {
            exportUrls();
            return;
        }

        if (action === "retryFailed") {
            void retryFailedZipItems();
            return;
        }

        if (action === "clearTempCache") {
            void clearTempCacheFromUi();
            return;
        }

        if (action === "debug") {
            openDebugOnlyPanel();
        }
    }

    function createFloatingButton() {
        if (document.querySelector(".pg-floating-launcher")) {
            return;
        }

        const button = document.createElement("button");
        const menu = document.createElement("div");

        button.type = "button";
        button.className = "pg-floating-launcher pg-gallery-launcher";
        button.textContent = "Media tools";
        button.setAttribute("aria-label", "Open media tools menu");
        button.setAttribute("aria-expanded", "false");
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            toggleToolsMenu();
        });

        menu.id = "pg-tools-menu";
        menu.className = "pg-tools-menu";
        menu.innerHTML = `
            <div class="pg-sheet-grabber" aria-hidden="true"></div>
            <div class="pg-tools-title">Media tools</div>
            <button type="button" data-action="open">Open gallery</button>
            <button type="button" data-action="scan">Scan all pages</button>
            <button type="button" data-action="zip">Download selected ZIP</button>
            <button type="button" data-action="urls">Export selected URLs</button>
            <button type="button" data-action="retryFailed">Retry failed ZIP</button>
            <button type="button" data-action="clearTempCache">Clear temp cache</button>
            <button type="button" data-action="debug">Diagnostics</button>
        `;

        menu.addEventListener("click", event => {
            const action = event.target.closest("button")?.dataset.action;

            if (!action) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            runFabAction(action);
        });

        document.addEventListener("click", event => {
            if (!event.target.closest(".pg-floating-launcher, #pg-tools-menu")) {
                closeToolsMenu();
            }
        }, true);

        document.body.appendChild(menu);
        document.body.appendChild(button);
        updateFloatingButtonLabel();
    }

    function createLaunchButtons() {
        createThreadTab();
        createNavButton();
        createFloatingButton();
    }

    function init() {
        injectStyles();
        void pruneExpiredCache().then(updateCacheStats).catch(() => {});

        if (isThreadPage()) {
            state.lastKnownPage = Math.max(1, ...discoverThreadPageUrls(document, getThreadInfo()).map(getPageNumberFromUrl));
            addMediaItems(scanMedia(document, getThreadInfo()?.currentPage || 1));
        } else {
            addMediaItems(scanMedia(document, 1));
        }

        startPagetualObserver();
        createLaunchButtons();

        setTimeout(() => {
            addMediaItems(scanMedia(document, getThreadInfo()?.currentPage || 1));
            createLaunchButtons();
        }, 750);

        setTimeout(() => {
            addMediaItems(scanMedia(document, getThreadInfo()?.currentPage || 1));
            createLaunchButtons();
        }, 1500);
    }

    init();
})();