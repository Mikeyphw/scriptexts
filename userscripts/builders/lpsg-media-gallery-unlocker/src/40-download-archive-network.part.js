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

