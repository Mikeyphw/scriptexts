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

