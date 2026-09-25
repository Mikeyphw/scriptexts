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
        showToast("debug-open", "Debug panel opened.", { level: "info", timeout: 1600 });
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