// ==UserScript==
// @name         Telegram Media Downloader
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/telegram-media-downloader
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/standalone/telegram-media-downloader
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/telegram-media-downloader/telegram-media-downloader.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/telegram-media-downloader/telegram-media-downloader.user.js
// @name:en      Telegram Media Downloader
// @name:zh-CN   Telegram 受限图片视频下载器
// @name:zh-TW   Telegram 受限圖片影片下載器
// @name:ru      Telegram: загрузчик медиафайлов
// @version      1.213
// @description  Download images, GIFs, videos, and voice messages on the Telegram webapp from private channels that disable downloading and restrict saving content
// @description:en  Download images, GIFs, videos, and voice messages on the Telegram webapp from private channels that disable downloading and restrict saving content
// @description:ru Загружайте изображения, GIF-файлы, видео и голосовые сообщения в веб-приложении Telegram из частных каналов, которые отключили загрузку и ограничили сохранение контента
// @description:zh-CN 从禁止下载的Telegram频道中下载图片、视频及语音消息
// @description:zh-TW 從禁止下載的 Telegram 頻道中下載圖片、影片及語音訊息
// @author       Nestor Qin
// @license      GNU GPLv3
// @website      https://github.com/Neet-Nestor/Telegram-Media-Downloader
// @match        https://web.telegram.org/*
// @match        https://webk.telegram.org/*
// @match        https://webz.telegram.org/*
// @icon         https://img.icons8.com/color/452/telegram-app--v5.png
// ==/UserScript==


(function () {
  const logger = {
    info: (message, fileName = null) => {
      console.log(
        `[Tel Download] ${fileName ? `${fileName}: ` : ""}${message}`
      );
    },
    error: (message, fileName = null) => {
      console.error(
        `[Tel Download] ${fileName ? `${fileName}: ` : ""}${message}`
      );
    },
  };
  // Unicode values for icons (used in /k/ app)
  // https://github.com/morethanwords/tweb/blob/master/src/icons.ts
  const DOWNLOAD_ICON = "\ue979";
  const FORWARD_ICON = "\ue99a";
  const contentRangeRegex = /^bytes (\d+)-(\d+)\/(\d+)$/;
  const DOWNLOAD_MAX_RETRIES = 3;
  const DOWNLOAD_RETRY_BASE_MS = 700;
  const FALLBACK_MEMORY_LIMIT = 256 * 1024 * 1024;
  const activeDownloads = new Map();
  const hashCode = (s) => {
    var h = 0,
      l = s.length,
      i = 0;
    if (l > 0) {
      while (i < l) {
        h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
      }
    }
    return h >>> 0;
  };

  const createProgressBar = (videoId, fileName, onCancel = null) => {
    const isDarkMode =
      document.querySelector("html").classList.contains("night") ||
      document.querySelector("html").classList.contains("theme-dark");
    const container = document.getElementById(
      "tel-downloader-progress-bar-container"
    );
    const innerContainer = document.createElement("div");
    innerContainer.id = "tel-downloader-progress-" + videoId;
    innerContainer.style.width = "20rem";
    innerContainer.style.marginTop = "0.4rem";
    innerContainer.style.padding = "0.6rem";
    innerContainer.style.backgroundColor = isDarkMode
      ? "rgba(0,0,0,0.3)"
      : "rgba(0,0,0,0.6)";

    const flexContainer = document.createElement("div");
    flexContainer.style.display = "flex";
    flexContainer.style.justifyContent = "space-between";

    const title = document.createElement("p");
    title.className = "filename";
    title.style.margin = 0;
    title.style.color = "white";
    title.innerText = fileName;

    const closeButton = document.createElement("div");
    closeButton.style.cursor = "pointer";
    closeButton.style.fontSize = "1.2rem";
    closeButton.style.color = isDarkMode ? "#8a8a8a" : "white";
    closeButton.innerHTML = "&times;";
    closeButton.setAttribute("role", "button");
    closeButton.setAttribute("aria-label", onCancel ? "Cancel download" : "Dismiss download");
    closeButton.onclick = function () {
      if (onCancel) onCancel();
      innerContainer.remove();
    };

    const progressBar = document.createElement("div");
    progressBar.className = "progress";
    progressBar.style.backgroundColor = "#e2e2e2";
    progressBar.style.position = "relative";
    progressBar.style.width = "100%";
    progressBar.style.height = "1.6rem";
    progressBar.style.borderRadius = "2rem";
    progressBar.style.overflow = "hidden";

    const counter = document.createElement("p");
    counter.style.position = "absolute";
    counter.style.zIndex = 5;
    counter.style.left = "50%";
    counter.style.top = "50%";
    counter.style.transform = "translate(-50%, -50%)";
    counter.style.margin = 0;
    counter.style.color = "black";
    const progress = document.createElement("div");
    progress.style.position = "absolute";
    progress.style.height = "100%";
    progress.style.width = "0%";
    progress.style.backgroundColor = "#6093B5";

    progressBar.appendChild(counter);
    progressBar.appendChild(progress);
    flexContainer.appendChild(title);
    flexContainer.appendChild(closeButton);
    innerContainer.appendChild(flexContainer);
    innerContainer.appendChild(progressBar);
    container.appendChild(innerContainer);
  };

  const updateProgress = (videoId, fileName, progress) => {
    const innerContainer = document.getElementById(
      "tel-downloader-progress-" + videoId
    );
    if (!innerContainer) return;
    innerContainer.querySelector("p.filename").innerText = fileName;
    const progressBar = innerContainer.querySelector("div.progress");
    progressBar.querySelector("p").innerText = progress + "%";
    progressBar.querySelector("div").style.width = progress + "%";
  };

  const updateProgressStatus = (videoId, message) => {
    const innerContainer = document.getElementById("tel-downloader-progress-" + videoId);
    if (!innerContainer) return;
    innerContainer.querySelector("div.progress p").innerText = message;
  };

  const completeProgress = (videoId) => {
    const innerContainer = document.getElementById("tel-downloader-progress-" + videoId);
    if (!innerContainer) return;
    const progressBar = innerContainer.querySelector("div.progress");
    progressBar.querySelector("p").innerText = "Completed";
    progressBar.querySelector("div").style.backgroundColor = "#B6C649";
    progressBar.querySelector("div").style.width = "100%";
  };

  const AbortProgress = (videoId) => {
    const innerContainer = document.getElementById("tel-downloader-progress-" + videoId);
    if (!innerContainer) return;
    const progressBar = innerContainer.querySelector("div.progress");
    progressBar.querySelector("p").innerText = "Aborted";
    progressBar.querySelector("div").style.backgroundColor = "#D16666";
    progressBar.querySelector("div").style.width = "100%";
  };

  const sleepWithAbort = (ms, signal) =>
    new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
      const timer = setTimeout(resolve, ms);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });

  const retryDelayMs = (response, attempt) => {
    const retryAfter = response?.headers?.get("Retry-After");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
      const date = Date.parse(retryAfter);
      if (Number.isFinite(date)) return Math.max(0, date - Date.now());
    }
    return DOWNLOAD_RETRY_BASE_MS * 2 ** attempt;
  };

  const fetchMediaPart = async (url, offset, signal, jobId = null) => {
    for (let attempt = 0; ; attempt += 1) {
      let response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: { Range: `bytes=${offset}-` },
          signal,
        });
      } catch (error) {
        if (error?.name === "AbortError" || attempt >= DOWNLOAD_MAX_RETRIES) throw error;
        if (jobId) updateProgressStatus(jobId, `Retrying ${attempt + 1}/${DOWNLOAD_MAX_RETRIES}…`);
        await sleepWithAbort(DOWNLOAD_RETRY_BASE_MS * 2 ** attempt, signal);
        continue;
      }
      if ([408, 429, 500, 502, 503, 504].includes(response.status) && attempt < DOWNLOAD_MAX_RETRIES) {
        if (jobId) updateProgressStatus(jobId, `HTTP ${response.status} · retry ${attempt + 1}/${DOWNLOAD_MAX_RETRIES}…`);
        await sleepWithAbort(retryDelayMs(response, attempt), signal);
        continue;
      }
      if (![200, 206].includes(response.status)) {
        throw new Error(`Unexpected media response: HTTP ${response.status}`);
      }
      return response;
    }
  };

  const parseMediaResponse = (response, requestedOffset) => {
    const contentType = (response.headers.get("Content-Type") || "application/octet-stream")
      .split(";", 1)[0]
      .trim();
    const contentLength = Number(response.headers.get("Content-Length")) || null;
    const contentRange = response.headers.get("Content-Range");

    // A server may legally ignore Range and return the complete object as HTTP 200.
    if (response.status === 200) {
      if (requestedOffset > 0) {
        throw new Error("Server stopped honoring Range during a resumed transfer");
      }
      return { start: 0, end: contentLength ? contentLength - 1 : null, total: contentLength, complete: true, contentType };
    }

    const match = contentRange?.match(contentRangeRegex);
    if (!match) throw new Error("HTTP 206 response is missing a valid Content-Range header");
    const start = Number(match[1]);
    const end = Number(match[2]);
    const total = Number(match[3]);
    if (start !== requestedOffset) throw new Error(`Range gap: expected ${requestedOffset}, received ${start}`);
    if (end < start || total <= end) throw new Error(`Invalid Content-Range: ${contentRange}`);
    return { start, end, total, complete: end + 1 >= total, contentType };
  };

  const saveBlobDownload = (parts, contentType, fileName) => {
    const blob = new Blob(parts, { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
  };

  const downloadMedia = async (url, { kind, extension }) => {
    const jobId = `${(Math.random() + 1).toString(36).substring(2, 10)}_${Date.now()}`;
    const controller = new AbortController();
    const parts = [];
    let offset = 0;
    let total = null;
    let contentType = `${kind}/${extension}`;
    let fileName = `${hashCode(url).toString(36)}.${extension}`;
    try {
      const metadata = JSON.parse(decodeURIComponent(url.split("/").at(-1)));
      if (metadata?.fileName) fileName = metadata.fileName;
    } catch { /* URL does not contain Telegram stream metadata. */ }

    activeDownloads.set(jobId, controller);
    createProgressBar(jobId, fileName, () => controller.abort());

    let writable = null;
    const canStreamToDisk = "showSaveFilePicker" in unsafeWindow && (() => {
      try { return unsafeWindow.self === unsafeWindow.top; } catch { return false; }
    })();

    try {
      if (canStreamToDisk) {
        const handle = await unsafeWindow.showSaveFilePicker({ suggestedName: fileName });
        writable = await handle.createWritable();
      }

      while (true) {
        const response = await fetchMediaPart(url, offset, controller.signal, jobId);
        const info = parseMediaResponse(response, offset);
        if (!info.contentType.startsWith(`${kind}/`)) {
          throw new Error(`Expected ${kind} media, received ${info.contentType}`);
        }
        contentType = info.contentType;
        if (!writable && info.total && info.total > FALLBACK_MEMORY_LIMIT) {
          throw new Error("Media is too large for the in-memory fallback. Use a browser with File System Access support.");
        }
        const subtype = contentType.split("/")[1]?.replace(/[^a-z0-9.+-]/gi, "") || extension;
        fileName = fileName.replace(/\.[^.]+$/, `.${subtype}`);
        const part = await response.blob();

        if (writable) {
          await writable.write(part);
        } else {
          parts.push(part);
          const buffered = parts.reduce((sum, item) => sum + item.size, 0);
          if (buffered > FALLBACK_MEMORY_LIMIT) {
            throw new Error("Media is too large for the in-memory fallback. Use a browser with File System Access support.");
          }
        }

        total = info.total || part.size;
        offset = info.complete ? total : info.end + 1;
        updateProgress(jobId, fileName, total ? Math.min(100, Math.round((offset * 100) / total)) : 100);
        if (info.complete) break;
      }

      if (writable) await writable.close();
      else saveBlobDownload(parts, contentType, fileName);
      completeProgress(jobId);
    } catch (error) {
      if (writable) {
        try { await writable.abort?.(); } catch { /* best effort */ }
      }
      if (error?.name !== "AbortError") logger.error(error?.message || error, fileName);
      AbortProgress(jobId);
    } finally {
      activeDownloads.delete(jobId);
    }
  };

  const tel_download_video = (url) => downloadMedia(url, { kind: "video", extension: "mp4" });
  const tel_download_audio = (url) => downloadMedia(url, { kind: "audio", extension: "ogg" });

  const tel_download_image = (imageUrl) => {
    const fileName =
      (Math.random() + 1).toString(36).substring(2, 10) + ".jpeg"; // assume jpeg

    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = imageUrl;
    a.download = fileName;
    a.click();
    document.body.removeChild(a);

    logger.info("Download triggered", fileName);
  };

  logger.info("Initialized");

  // For WebZ (/a/) webapp. DOM-driven scans avoid permanent polling.
  const scanWebZ = () => {
    // Stories
    const storiesContainer = document.getElementById("StoryViewer");
    if (storiesContainer) {
      console.log("storiesContainer");
      const createDownloadButton = () => {
        console.log("createDownloadButton");
        const downloadIcon = document.createElement("i");
        downloadIcon.className = "icon icon-download";
        const downloadButton = document.createElement("button");
        downloadButton.className =
          "Button TkphaPyQ tiny translucent-white round tel-download";
        downloadButton.appendChild(downloadIcon);
        downloadButton.setAttribute("type", "button");
        downloadButton.setAttribute("title", "Download");
        downloadButton.setAttribute("aria-label", "Download");
        downloadButton.onclick = () => {
          // 1. Story with video
          const video = storiesContainer.querySelector("video");
          const videoSrc =
            video?.src ||
            video?.currentSrc ||
            video?.querySelector("source")?.src;
          if (videoSrc) {
            tel_download_video(videoSrc);
          } else {
            // 2. Story with image
            const images = storiesContainer.querySelectorAll("img.PVZ8TOWS");
            if (images.length > 0) {
              const imageSrc = images[images.length - 1]?.src;
              if (imageSrc) tel_download_image(imageSrc);
            }
          }
        };
        return downloadButton;
      };

      const dropdownMenu = storiesContainer.querySelector(".DropdownMenu");
      const storyHeader =
        storiesContainer.querySelector(".GrsJNw3y") ||
        dropdownMenu?.parentNode;
      if (storyHeader && !storyHeader.querySelector(".tel-download")) {
        console.log("storyHeader");
        storyHeader.insertBefore(
          createDownloadButton(),
          storyHeader.querySelector("button")
        );
      }
    }

    // All media opened are located in .media-viewer-movers > .media-viewer-aspecter
    const mediaContainer = document.querySelector(
      "#MediaViewer .MediaViewerSlide--active"
    );
    const mediaViewerActions = document.querySelector(
      "#MediaViewer .MediaViewerActions"
    );
    if (!mediaContainer || !mediaViewerActions) return;

    // Videos in channels
    const videoPlayer = mediaContainer.querySelector(
      ".MediaViewerContent > .VideoPlayer"
    );
    const img = mediaContainer.querySelector(".MediaViewerContent > div > img");
    // 1. Video player detected - Video or GIF
    // container > .MediaViewerSlides > .MediaViewerSlide > .MediaViewerContent > .VideoPlayer > video[src]
    const downloadIcon = document.createElement("i");
    downloadIcon.className = "icon icon-download";
    const downloadButton = document.createElement("button");
    downloadButton.className =
      "Button smaller translucent-white round tel-download";
    downloadButton.setAttribute("type", "button");
    downloadButton.setAttribute("title", "Download");
    downloadButton.setAttribute("aria-label", "Download");
    if (videoPlayer) {
      const videoUrl = videoPlayer.querySelector("video").currentSrc;
      downloadButton.setAttribute("data-tel-download-url", videoUrl);
      downloadButton.appendChild(downloadIcon);
      downloadButton.onclick = () => {
        tel_download_video(videoPlayer.querySelector("video").currentSrc);
      };

      // Add download button to video controls
      const controls = videoPlayer.querySelector(".VideoPlayerControls");
      if (controls) {
        const buttons = controls.querySelector(".buttons");
        if (!buttons.querySelector("button.tel-download")) {
          const spacer = buttons.querySelector(".spacer");
          spacer.after(downloadButton);
        }
      }

      // Add/Update/Remove download button to topbar
      if (mediaViewerActions.querySelector("button.tel-download")) {
        const telDownloadButton = mediaViewerActions.querySelector(
          "button.tel-download"
        );
        if (
          mediaViewerActions.querySelectorAll('button[title="Download"]')
            .length > 1
        ) {
          // There's existing download button, remove ours
          mediaViewerActions.querySelector("button.tel-download").remove();
        } else if (
          telDownloadButton.getAttribute("data-tel-download-url") !== videoUrl
        ) {
          // Update existing button
          telDownloadButton.onclick = () => {
            tel_download_video(videoPlayer.querySelector("video").currentSrc);
          };
          telDownloadButton.setAttribute("data-tel-download-url", videoUrl);
        }
      } else if (
        !mediaViewerActions.querySelector('button[title="Download"]')
      ) {
        // Add the button if there's no download button at all
        mediaViewerActions.prepend(downloadButton);
      }
    } else if (img && img.src) {
      downloadButton.setAttribute("data-tel-download-url", img.src);
      downloadButton.appendChild(downloadIcon);
      downloadButton.onclick = () => {
        tel_download_image(img.src);
      };

      // Add/Update/Remove download button to topbar
      if (mediaViewerActions.querySelector("button.tel-download")) {
        const telDownloadButton = mediaViewerActions.querySelector(
          "button.tel-download"
        );
        if (
          mediaViewerActions.querySelectorAll('button[title="Download"]')
            .length > 1
        ) {
          // There's existing download button, remove ours
          mediaViewerActions.querySelector("button.tel-download").remove();
        } else if (
          telDownloadButton.getAttribute("data-tel-download-url") !== img.src
        ) {
          // Update existing button
          telDownloadButton.onclick = () => {
            tel_download_image(img.src);
          };
          telDownloadButton.setAttribute("data-tel-download-url", img.src);
        }
      } else if (
        !mediaViewerActions.querySelector('button[title="Download"]')
      ) {
        // Add the button if there's no download button at all
        mediaViewerActions.prepend(downloadButton);
      }
    }
  };

  // For WebK (/k/) webapp.
  const scanWebK = () => {
    /* Voice Message or Circle Video */
    const pinnedAudio = document.body.querySelector(".pinned-audio");
    let dataMid;
    let downloadButtonPinnedAudio =
      document.body.querySelector("._tel_download_button_pinned_container") ||
      document.createElement("button");
    if (pinnedAudio) {
      dataMid = pinnedAudio.getAttribute("data-mid");
      downloadButtonPinnedAudio.className =
        "btn-icon tgico-download _tel_download_button_pinned_container";
      downloadButtonPinnedAudio.innerHTML = `<span class="tgico button-icon">${DOWNLOAD_ICON}</span>`;
    }
    const audioElements = document.body.querySelectorAll("audio-element");
    audioElements.forEach((audioElement) => {
      const bubble = audioElement.closest(".bubble");
      if (
        !bubble ||
        bubble.querySelector("._tel_download_button_pinned_container")
      ) {
        return; /* Skip if there's already a download button */
      }
      if (
        dataMid &&
        downloadButtonPinnedAudio.getAttribute("data-mid") !== dataMid &&
        audioElement.getAttribute("data-mid") === dataMid
      ) {
        downloadButtonPinnedAudio.onclick = (e) => {
          e.stopPropagation();
          if (isAudio) {
              tel_download_audio(link);
          } else {
              tel_download_video(link);
          }
        };
        downloadButtonPinnedAudio.setAttribute("data-mid", dataMid);
        const link = audioElement.audio && audioElement.audio.getAttribute("src");
        const isAudio = audioElement.audio && audioElement.audio instanceof HTMLAudioElement
        if (link) {
          pinnedAudio
            .querySelector(".pinned-container-wrapper-utils")
            .appendChild(downloadButtonPinnedAudio);
        }
      }
    });

    // Stories
    const storiesContainer = document.getElementById("stories-viewer");
    if (storiesContainer) {
      const createDownloadButton = () => {
        const downloadButton = document.createElement("button");
        downloadButton.className = "btn-icon rp tel-download";
        downloadButton.innerHTML = `<span class="tgico">${DOWNLOAD_ICON}</span><div class="c-ripple"></div>`;
        downloadButton.setAttribute("type", "button");
        downloadButton.setAttribute("title", "Download");
        downloadButton.setAttribute("aria-label", "Download");
        downloadButton.onclick = () => {
          // 1. Story with video
          const video = storiesContainer.querySelector("video.media-video");
          const videoSrc =
            video?.src ||
            video?.currentSrc ||
            video?.querySelector("source")?.src;
          if (videoSrc) {
            tel_download_video(videoSrc);
          } else {
            // 2. Story with image
            const imageSrc =
              storiesContainer.querySelector("img.media-photo")?.src;
            if (imageSrc) tel_download_image(imageSrc);
          }
        };
        return downloadButton;
      };

      const storyHeader = storiesContainer.querySelector(
        "[class^='_ViewerStoryHeaderRight']"
      );
      if (storyHeader && !storyHeader.querySelector(".tel-download")) {
        storyHeader.prepend(createDownloadButton());
      }

      const storyFooter = storiesContainer.querySelector(
        "[class^='_ViewerStoryFooterRight']"
      );
      if (storyFooter && !storyFooter.querySelector(".tel-download")) {
        storyFooter.prepend(createDownloadButton());
      }
    }

    // All media opened are located in .media-viewer-movers > .media-viewer-aspecter
    const mediaContainer = document.querySelector(".media-viewer-whole");
    if (!mediaContainer) return;
    const mediaAspecter = mediaContainer.querySelector(
      ".media-viewer-movers .media-viewer-aspecter"
    );
    const mediaButtons = mediaContainer.querySelector(
      ".media-viewer-topbar .media-viewer-buttons"
    );
    if (!mediaAspecter || !mediaButtons) return;

    // Query hidden buttons and unhide them
    const hiddenButtons = mediaButtons.querySelectorAll("button.btn-icon.hide");
    let onDownload = null;
    for (const btn of hiddenButtons) {
      btn.classList.remove("hide");
      if (btn.textContent === FORWARD_ICON) {
        btn.classList.add("tgico-forward");
      }
      if (btn.textContent === DOWNLOAD_ICON) {
        btn.classList.add("tgico-download");
        // Use official download buttons
        onDownload = () => {
          btn.click();
        };
        logger.info("onDownload", onDownload);
      }
    }

    if (mediaAspecter.querySelector(".ckin__player")) {
      // 1. Video player detected - Video and it has finished initial loading
      // container > .ckin__player > video[src]

      // add download button to videos
      const controls = mediaAspecter.querySelector(
        ".default__controls.ckin__controls"
      );
      if (controls && !controls.querySelector(".tel-download")) {
        const brControls = controls.querySelector(
          ".bottom-controls .right-controls"
        );
        const downloadButton = document.createElement("button");
        downloadButton.className =
          "btn-icon default__button tgico-download tel-download";
        downloadButton.innerHTML = `<span class="tgico">${DOWNLOAD_ICON}</span>`;
        downloadButton.setAttribute("type", "button");
        downloadButton.setAttribute("title", "Download");
        downloadButton.setAttribute("aria-label", "Download");
        if (onDownload) {
          downloadButton.onclick = onDownload;
        } else {
          downloadButton.onclick = () => {
            tel_download_video(mediaAspecter.querySelector("video").src);
          };
        }
        brControls.prepend(downloadButton);
      }
    } else if (
      mediaAspecter.querySelector("video") &&
      mediaAspecter.querySelector("video") &&
      !mediaButtons.querySelector("button.btn-icon.tgico-download")
    ) {
      // 2. Video HTML element detected, could be either GIF or unloaded video
      // container > video[src]
      const downloadButton = document.createElement("button");
      downloadButton.className = "btn-icon tgico-download tel-download";
      downloadButton.innerHTML = `<span class="tgico button-icon">${DOWNLOAD_ICON}</span>`;
      downloadButton.setAttribute("type", "button");
      downloadButton.setAttribute("title", "Download");
      downloadButton.setAttribute("aria-label", "Download");
      if (onDownload) {
        downloadButton.onclick = onDownload;
      } else {
        downloadButton.onclick = () => {
          tel_download_video(mediaAspecter.querySelector("video").src);
        };
      }
      mediaButtons.prepend(downloadButton);
    } else if (!mediaButtons.querySelector("button.btn-icon.tgico-download")) {
      // 3. Image without download button detected
      // container > img.thumbnail
      if (
        !mediaAspecter.querySelector("img.thumbnail") ||
        !mediaAspecter.querySelector("img.thumbnail").src
      ) {
        return;
      }
      const downloadButton = document.createElement("button");
      downloadButton.className = "btn-icon tgico-download tel-download";
      downloadButton.innerHTML = `<span class="tgico button-icon">${DOWNLOAD_ICON}</span>`;
      downloadButton.setAttribute("type", "button");
      downloadButton.setAttribute("title", "Download");
      downloadButton.setAttribute("aria-label", "Download");
      if (onDownload) {
        downloadButton.onclick = onDownload;
      } else {
        downloadButton.onclick = () => {
          tel_download_image(mediaAspecter.querySelector("img.thumbnail").src);
        };
      }
      mediaButtons.prepend(downloadButton);
    }
  };

  // Progress bar container setup
  (function setupProgressBar() {
    const body = document.querySelector("body");
    const container = document.createElement("div");
    container.id = "tel-downloader-progress-bar-container";
    container.style.position = "fixed";
    container.style.bottom = 0;
    container.style.right = 0;
    if (location.pathname.startsWith("/k/")) {
      container.style.zIndex = 4;
    } else {
      container.style.zIndex = 1600;
    }
    body.appendChild(container);
  })();

  logger.info("Completed script setup.");

  let telegramScanScheduled = false;
  const runTelegramScans = () => {
    telegramScanScheduled = false;
    scanWebZ();
    scanWebK();
  };
  const scheduleTelegramScan = () => {
    if (telegramScanScheduled) return;
    telegramScanScheduled = true;
    (window.requestAnimationFrame || ((callback) => setTimeout(callback, 0)))(runTelegramScans);
  };
  const TELEGRAM_MEDIA_SELECTOR = [
    "#MediaViewer", "#StoryViewer", ".media-viewer-whole", "#stories-viewer",
    ".pinned-audio", "audio-element", ".bubble", "video", "img.media-photo", "img.PVZ8TOWS"
  ].join(",");
  const mutationTouchesTelegramMedia = (mutation) => {
    const nodes = mutation.type === "childList"
      ? [...mutation.addedNodes, mutation.target]
      : [mutation.target];
    return nodes.some((node) => {
      if (!(node instanceof Element)) return false;
      return node.matches(TELEGRAM_MEDIA_SELECTOR) ||
        node.closest(TELEGRAM_MEDIA_SELECTOR) ||
        node.querySelector?.(TELEGRAM_MEDIA_SELECTOR);
    });
  };
  const telegramObserver = new MutationObserver((mutations) => {
    // Ignore unrelated chat churn; only newly-added/changed media surfaces schedule work.
    if (mutations.some(mutationTouchesTelegramMedia)) scheduleTelegramScan();
  });
  telegramObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "src"],
  });
  scheduleTelegramScan();

})();
