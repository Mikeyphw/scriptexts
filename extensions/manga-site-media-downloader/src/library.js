"use strict";

const {
  getLibraryItems,
  saveLibraryItem,
  updateLibraryItem,
  removeLibraryItem,
  importLibraryItems,
  createExportPayload,
  createSyncSnapshot,
  normalizeUrl,
  DOWNLOAD_QUEUE_KEY,
} = window.MRMLibraryStore;

let libraryItems = [];
let filteredItems = [];
let selectedLibraryIds = new Set();
let activeQuickFilter = "all";
let queuedUrlSet = new Set();

function $(id) {
  return document.getElementById(id);
}

function showToast(message, type = "info") {
  const toast = $("toast");
  toast.textContent = message;
  toast.hidden = false;
  toast.dataset.type = type;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function appendDebug(level, message, meta = null) {
  try {
    await browser.runtime.sendMessage({ type: "MRM_APPEND_DEBUG", level, message, meta });
  } catch {}
}

function getSearchText(item) {
  return [
    item.displayTitle, item.title, item.host, item.siteName, item.notes,
    ...(item.languages || []), ...(item.artists || []), ...(item.circles || []),
    ...(item.tags || []), ...(item.categories || []),
  ].join(" ").toLowerCase();
}

function applyFilters() {
  const query = $("searchInput").value.trim().toLowerCase();
  const site = $("siteFilter").value;
  const language = $("languageFilter").value;
  const status = $("statusFilter").value;
  const collection = $("collectionFilter")?.value || "";
  const minRating = Number($("ratingFilter")?.value || 0);
  const sort = $("sortSelect").value;

  filteredItems = libraryItems.filter((item) => {
    const normalizedUrl = normalizeUrl(item.url || item.canonicalUrl || "");
    if (activeQuickFilter === "downloaded" && !item.downloaded) return false;
    if (activeQuickFilter === "favorites" && !item.favorite) return false;
    if (activeQuickFilter === "queued" && !queuedUrlSet.has(normalizedUrl)) return false;
    if (activeQuickFilter === "recent") {
      const ts = Number(item.addedAt || item.updatedAt || 0);
      if (!ts || Date.now() - ts > 7 * 24 * 60 * 60 * 1000) return false;
    }
    if (query && !getSearchText(item).includes(query)) return false;
    if (site && item.host !== site) return false;
    if (language && !(item.languages || []).includes(language)) return false;
    if (status === "downloaded" && !item.downloaded) return false;
    if (status === "not-downloaded" && item.downloaded) return false;
    if (status === "favorite" && !item.favorite) return false;
    if (status === "reading" && item.readingStatus !== "reading") return false;
    if (status === "finished" && item.readingStatus !== "finished") return false;
    if (collection && String(item.collection || "Unsorted") !== collection) return false;
    if (minRating && Number(item.rating || 0) < minRating) return false;
    return true;
  });

  filteredItems.sort((a, b) => {
    if (sort === "titleAsc") return String(a.sortTitle || a.title).localeCompare(String(b.sortTitle || b.title));
    if (sort === "siteAsc") return String(a.host).localeCompare(String(b.host)) || String(a.title).localeCompare(String(b.title));
    if (sort === "downloadedDesc") return Number(!!b.downloaded) - Number(!!a.downloaded) || Number(b.addedAt || 0) - Number(a.addedAt || 0);
    return Number(b.addedAt || 0) - Number(a.addedAt || 0);
  });

  render();
}

function updateFilters() {
  const siteFilter = $("siteFilter");
  const languageFilter = $("languageFilter");
  const currentSite = siteFilter.value;
  const currentLanguage = languageFilter.value;
  const sites = Array.from(new Set(libraryItems.map((item) => item.host).filter(Boolean))).sort();
  const languages = Array.from(new Set(libraryItems.flatMap((item) => item.languages || []))).sort();
  const collectionFilter = $("collectionFilter");
  const currentCollection = collectionFilter?.value || "";
  const collections = Array.from(new Set(libraryItems.map((item) => String(item.collection || "Unsorted")).filter(Boolean))).sort();

  replaceSelectOptions(siteFilter, "All sites", sites);
  replaceSelectOptions(languageFilter, "All languages", languages);
  if (collectionFilter) replaceSelectOptions(collectionFilter, "All collections", collections);

  siteFilter.value = sites.includes(currentSite) ? currentSite : "";
  languageFilter.value = languages.includes(currentLanguage) ? currentLanguage : "";
  if (collectionFilter) collectionFilter.value = collections.includes(currentCollection) ? currentCollection : "";
}

function replaceSelectOptions(select, defaultLabel, values) {
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultLabel;

  const options = values.map((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    return option;
  });

  select.replaceChildren(defaultOption, ...options);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[char]));
}

function chip(value, className = "") {
  const span = document.createElement("span");
  span.className = `chip ${className}`.trim();
  span.textContent = value;
  return span;
}


function formatLibraryDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function joinMetadataValues(values) {
  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

function appendMetadataRow(container, label, value, options = {}) {
  const normalized = Array.isArray(value) ? joinMetadataValues(value) : String(value || "").trim();
  if (!normalized && !options.showEmpty) return;

  const row = document.createElement("div");
  row.className = "metadata-row";

  const key = document.createElement("dt");
  key.textContent = label;

  const val = document.createElement("dd");
  if (options.link && normalized) {
    const anchor = document.createElement("a");
    anchor.href = normalized;
    anchor.textContent = normalized;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    val.appendChild(anchor);
  } else {
    val.textContent = normalized || "—";
  }

  row.append(key, val);
  container.appendChild(row);
}

function appendMetadataChipGroup(container, label, values, limit = 14) {
  const normalized = (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!normalized.length) return;

  const row = document.createElement("div");
  row.className = "metadata-row metadata-row-stack";

  const key = document.createElement("dt");
  key.textContent = label;

  const val = document.createElement("dd");
  val.className = "metadata-chip-list";

  normalized.slice(0, limit).forEach((value) => val.appendChild(chip(value)));
  if (normalized.length > limit) val.appendChild(chip(`+${normalized.length - limit} more`));

  row.append(key, val);
  container.appendChild(row);
}

function createMetadataPanel(item) {
  const details = document.createElement("details");
  details.className = "metadata-details";
  details.open = true;

  const summary = document.createElement("summary");
  summary.textContent = "Metadata";

  const list = document.createElement("dl");
  list.className = "metadata-list";

  appendMetadataRow(list, "Clean title", item.title);
  appendMetadataRow(list, "Display title", item.displayTitle);
  appendMetadataRow(list, "Site", item.siteName || item.host);
  appendMetadataRow(list, "Pages", item.pageCount == null ? "" : String(item.pageCount));
  appendMetadataRow(list, "Source", item.url || item.canonicalUrl, { link: true });
  appendMetadataChipGroup(list, "Languages", item.languages);
  appendMetadataChipGroup(list, "Artists", item.artists);
  appendMetadataChipGroup(list, "Circles", item.circles);
  appendMetadataChipGroup(list, "Categories", item.categories);
  appendMetadataChipGroup(list, "Tags", item.tags, 18);
  appendMetadataRow(list, "Added", formatLibraryDate(item.addedAt));
  appendMetadataRow(list, "Updated", formatLibraryDate(item.updatedAt));
  appendMetadataRow(list, "Refreshed", formatLibraryDate(item.lastCheckedAt));
  appendMetadataRow(list, "Downloads", item.downloadCount ? String(item.downloadCount) : "");
  appendMetadataRow(list, "Last downloaded", formatLibraryDate(item.lastDownloadedAt));
  appendMetadataRow(list, "Cover source", item.coverFallbackSource || (item.coverDataUrl ? "cached cover" : item.coverUrl ? "remote cover URL" : ""));

  const hasRows = list.children.length > 0;
  if (!hasRows) {
    const empty = document.createElement("p");
    empty.className = "metadata-empty";
    empty.textContent = "No extra metadata saved yet. Try Refresh metadata.";
    details.append(summary, empty);
    return details;
  }

  details.append(summary, list);
  return details;
}


function getSelectedItems() {
  return libraryItems.filter((item) => selectedLibraryIds.has(item.id));
}

function pruneSelection() {
  const validIds = new Set(libraryItems.map((item) => item.id));
  selectedLibraryIds = new Set(Array.from(selectedLibraryIds).filter((id) => validIds.has(id)));
}

function updateBulkUi() {
  const selectedCount = selectedLibraryIds.size;
  const selectedSummary = $("selectedSummary");
  if (selectedSummary) selectedSummary.textContent = `${selectedCount} selected`;
  [
    "downloadSelectedBtn",
    "queueSelectedBtn",
    "refreshSelectedBtn",
    "removeSelectedBtn",
    "exportSelectedBtn",
    "clearSelectionBtn",
  ].forEach((id) => {
    const button = $(id);
    if (button) button.disabled = selectedCount === 0;
  });
}

function createLibraryExportPayload(items) {
  return {
    type: "mrm-library-export",
    version: 1,
    exportedAt: Date.now(),
    libraryItems: items,
  };
}

async function cacheCoverDataUrlForItem(item, reason = "library") {
  const coverUrl = item?.thumbnailUrl || item?.coverUrl || "";
  if (!coverUrl || item.coverDataUrl || /^data:/i.test(coverUrl)) return item;

  try {
    const response = await browser.runtime.sendMessage({
      type: "MRM_CACHE_COVER_DATA_URL",
      coverUrl,
      pageUrl: item.canonicalUrl || item.url || "",
      itemId: item.id || "",
      reason,
    });
    if (response?.ok && response.coverDataUrl) {
      return { ...item, coverDataUrl: response.coverDataUrl };
    }
    if (response?.fallbackStarted) {
      await appendDebug("info", "Library cover-only generation started after cache failure", {
        id: item.id,
        url: item.canonicalUrl || item.url || "",
        reason,
        pending: !!response.pending,
      });
    }
  } catch (error) {
    await appendDebug("warn", "Library cover local cache request failed", {
      url: item?.canonicalUrl || item?.url || "",
      coverUrl,
      reason,
      error: error?.message || String(error),
    });
  }

  return item;
}


function mergeRefreshedMetadata(existing, fresh) {
  const now = Date.now();
  return {
    ...fresh,
    id: existing.id,
    favorite: !!existing.favorite,
    rating: Number(existing.rating || 0),
    notes: existing.notes || "",
    downloaded: !!existing.downloaded,
    downloadCount: Number(existing.downloadCount || 0),
    lastDownloadedAt: existing.lastDownloadedAt || null,
    queued: !!existing.queued,
    addedAt: existing.addedAt || now,
    updatedAt: now,
    lastCheckedAt: now,
    coverUrl: fresh.coverUrl || existing.coverUrl || "",
    thumbnailUrl: fresh.thumbnailUrl || fresh.coverUrl || existing.thumbnailUrl || existing.coverUrl || "",
    coverDataUrl: fresh.coverDataUrl || existing.coverDataUrl || "",
    coverFallbackSource: fresh.coverFallbackSource || existing.coverFallbackSource || "",
    metadataConfidence: {
      ...(existing.metadataConfidence || {}),
      ...(fresh.metadataConfidence || {}),
    },
  };
}

function isMyReadingMangaLibraryUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "") === "myreadingmanga.info";
  } catch {
    return false;
  }
}

async function fetchLibraryItemMetadataInTab(item, reason = "direct-fetch-fallback") {
  const url = item.canonicalUrl || item.url;
  await appendDebug("info", "Library metadata refresh falling back to browser tab extraction", {
    id: item.id,
    url,
    reason,
  });

  const response = await browser.runtime.sendMessage({
    type: "MRM_EXTRACT_METADATA_IN_TAB",
    url,
    timeoutMs: 70000,
  });

  if (!response?.ok || !response.metadata) {
    throw new Error(response?.error || "Metadata tab extraction failed.");
  }

  const fresh = response.metadata;
  const merged = mergeRefreshedMetadata(item, {
    ...fresh,
    url: fresh.url || item.url || url,
    canonicalUrl: fresh.canonicalUrl || item.canonicalUrl || url,
  });
  return cacheCoverDataUrlForItem(merged, "metadata-tab-refresh");
}

async function fetchLibraryItemMetadataDirect(item) {
  const url = item.canonicalUrl || item.url;
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error(`Metadata fetch failed: HTTP ${response.status}`);

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const base = doc.createElement("base");
  base.href = url;
  doc.head.prepend(base);

  const fresh = window.MRMMetadataExtractor.extractPostMetadata(doc, url);
  const merged = mergeRefreshedMetadata(item, {
    ...fresh,
    url: fresh.url || item.url || url,
    canonicalUrl: fresh.canonicalUrl || item.canonicalUrl || url,
  });
  return cacheCoverDataUrlForItem(merged, "metadata-direct-refresh");
}

async function fetchLibraryItemMetadata(item) {
  const url = item.canonicalUrl || item.url;
  if (!url) throw new Error("Library item has no URL.");

  await appendDebug("info", "Library metadata refresh started", { id: item.id, url });

  if (isMyReadingMangaLibraryUrl(url)) {
    return fetchLibraryItemMetadataInTab(item, "myreadingmanga-cloudflare-safe-path");
  }

  try {
    return await fetchLibraryItemMetadataDirect(item);
  } catch (error) {
    const message = String(error?.message || error);
    if (/HTTP\s*(401|403|429|503)|Failed to fetch|NetworkError/i.test(message)) {
      return fetchLibraryItemMetadataInTab(item, message);
    }
    throw error;
  }
}

async function fetchLibraryItemMissingCoverMetadata(item) {
  const refreshed = await fetchLibraryItemMetadata(item);
  return mergeRefreshedMetadata(item, {
    ...item,
    coverUrl: refreshed.coverUrl || item.coverUrl || "",
    thumbnailUrl: refreshed.thumbnailUrl || refreshed.coverUrl || item.thumbnailUrl || item.coverUrl || "",
    pageCount: refreshed.pageCount || item.pageCount || null,
    metadataConfidence: {
      ...(item.metadataConfidence || {}),
      cover: (refreshed.coverUrl || item.coverUrl) ? "high" : "low",
    },
  });
}

function isMissingLibraryCover(item) {
  return !(item.coverDataUrl || item.coverUrl || item.thumbnailUrl);
}


async function refreshLibraryItemMetadata(item, button = null) {
  const label = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "Refreshing…";
  }

  try {
    const refreshed = await fetchLibraryItemMetadata(item);
    await saveLibraryItem(refreshed);
    await appendDebug("info", "Library metadata refreshed", {
      id: item.id,
      url: item.url,
      title: refreshed.displayTitle || refreshed.title,
      coverUrl: refreshed.coverUrl,
      coverCached: !!refreshed.coverDataUrl,
      tagCount: refreshed.tags?.length || 0,
      categoryCount: refreshed.categories?.length || 0,
      pageCount: refreshed.pageCount || null,
    });
    await loadLibrary();
    showToast("Metadata refreshed.", "success");
  } catch (error) {
    await appendDebug("error", "Library metadata refresh failed", {
      id: item.id,
      url: item.url,
      error: error?.message || String(error),
    });
    showToast(error?.message || "Metadata refresh failed.", "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = label || "Refresh";
    }
  }
}

async function refreshSelectedLibraryItems() {
  const items = getSelectedItems();
  if (!items.length) {
    showToast("Select at least one item first.");
    return;
  }

  const button = $("refreshSelectedBtn");
  button.disabled = true;
  let refreshed = 0;
  let failed = 0;

  try {
    for (const item of items) {
      try {
        const nextItem = await fetchLibraryItemMetadata(item);
        await saveLibraryItem(nextItem);
        refreshed += 1;
      } catch (error) {
        failed += 1;
        await appendDebug("error", "Selected Library metadata refresh failed", {
          id: item.id,
          url: item.url,
          error: error?.message || String(error),
        });
      }
    }

    await appendDebug("info", "Selected Library metadata refresh completed", {
      selected: items.length,
      refreshed,
      failed,
    });
    await loadLibrary();
    showToast(failed ? `Refreshed ${refreshed}; failed ${failed}.` : `Refreshed ${refreshed} item(s).`);
  } finally {
    updateBulkUi();
  }
}

async function refreshMissingLibraryCovers() {
  const items = libraryItems.filter(isMissingLibraryCover);
  if (!items.length) {
    showToast("No Library items are missing covers.");
    return;
  }

  const button = $("refreshMissingCoversBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Refreshing covers…";
  }

  let refreshed = 0;
  let found = 0;
  let failed = 0;

  try {
    for (const item of items) {
      try {
        const nextItem = await fetchLibraryItemMissingCoverMetadata(item);
        await saveLibraryItem(nextItem);
        refreshed += 1;
        if (nextItem.coverUrl || nextItem.thumbnailUrl) found += 1;
      } catch (error) {
        failed += 1;
        await appendDebug("error", "Missing-cover Library refresh failed", {
          id: item.id,
          url: item.url,
          error: error?.message || String(error),
        });
      }
    }

    await appendDebug("info", "Missing-cover Library refresh completed", {
      totalMissingBefore: items.length,
      refreshed,
      found,
      failed,
    });
    await loadLibrary();
    showToast(failed ? `Found ${found} cover(s); failed ${failed}.` : `Found ${found} cover(s).`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Refresh missing covers";
    }
    updateBulkUi();
  }
}

async function exportSelectedLibraryItems() {
  const items = getSelectedItems();
  if (!items.length) {
    showToast("Select at least one item first.");
    return;
  }
  downloadJson(`mrm-library-selected-${new Date().toISOString().slice(0, 10)}.json`, createLibraryExportPayload(items));
  await appendDebug("info", "Selected Library items exported", { count: items.length });
  showToast(`Exported ${items.length} selected item(s).`);
}

async function downloadSelectedLibraryItems() {
  const items = getSelectedItems();
  if (!items.length) {
    showToast("Select at least one item first.");
    return;
  }
  const button = $("downloadSelectedBtn");
  button.disabled = true;
  let started = 0;
  let failed = 0;
  try {
    for (const item of items) {
      try {
        const response = await browser.runtime.sendMessage({ type: "MRM_LIBRARY_DOWNLOAD_ITEM", item });
        if (!response?.ok) throw new Error(response?.error || "Could not start download.");
        started += 1;
      } catch (error) {
        failed += 1;
        await appendDebug("error", "Selected Library download failed to start", {
          id: item.id,
          url: item.url,
          error: error?.message || String(error),
        });
      }
    }
    await appendDebug("info", "Bulk Library download requested", { selected: items.length, started, failed });
    showToast(failed ? `Started ${started}; failed ${failed}.` : `Started ${started} download(s).`);
  } finally {
    updateBulkUi();
  }
}


async function generateSelectedCoversFromDownload() {
  const selected = getSelectedItems();
  const items = selected.filter((item) => !item.coverDataUrl);
  if (!selected.length) {
    showToast("Select at least one item first.");
    return;
  }
  if (!items.length) {
    showToast("Selected item(s) already have cached covers.");
    return;
  }

  const button = $("generateSelectedCoversBtn");
  if (button) {
    button.disabled = true;
    button.textContent = "Generating cover only…";
  }

  let started = 0;
  let failed = 0;

  try {
    for (const item of items) {
      try {
        const response = await browser.runtime.sendMessage({
          type: "MRM_LIBRARY_GENERATE_COVER_FROM_DOWNLOAD",
          item,
        });
        if (!response?.ok) throw new Error(response?.error || "Could not start cover generation.");
        started += 1;
      } catch (error) {
        failed += 1;
        await appendDebug("error", "Selected Library cover generation failed to start", {
          id: item.id,
          url: item.url,
          error: error?.message || String(error),
        });
      }
    }

    await appendDebug("info", "Bulk Library cover generation requested", {
      selected: selected.length,
      missingCachedCover: items.length,
      started,
      failed,
    });
    showToast(failed ? `Started ${started}; failed ${failed}.` : `Started ${started} cover-only job(s).`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Generate cover only";
    }
    updateBulkUi();
  }
}

async function queueSelectedLibraryItems() {
  const items = getSelectedItems();
  if (!items.length) {
    showToast("Select at least one item first.");
    return;
  }
  const button = $("queueSelectedBtn");
  button.disabled = true;
  try {
    for (const item of items) {
      await addItemToQueue(item);
      await updateLibraryItem(item.id, { queued: true });
    }
    await appendDebug("info", "Selected Library items queued", { count: items.length });
    await loadLibrary();
    showToast(`Queued ${items.length} item(s).`, "success");
  } finally {
    updateBulkUi();
  }
}

async function removeSelectedLibraryItems() {
  const items = getSelectedItems();
  if (!items.length) {
    showToast("Select at least one item first.");
    return;
  }
  if (!confirm(`Remove ${items.length} selected item(s) from Library?`)) return;
  const button = $("removeSelectedBtn");
  button.disabled = true;
  try {
    for (const item of items) {
      await removeLibraryItem(item.id);
      selectedLibraryIds.delete(item.id);
    }
    await appendDebug("info", "Selected Library items removed", { count: items.length });
    await loadLibrary();
    showToast(`Removed ${items.length} item(s).`, "success");
  } finally {
    updateBulkUi();
  }
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "library-card";
  if (selectedLibraryIds.has(item.id)) card.classList.add("is-selected");

  const selectRow = document.createElement("div");
  selectRow.className = "library-select-row";
  const selectLabel = document.createElement("label");
  selectLabel.className = "library-select-label";
  const selectInput = document.createElement("input");
  selectInput.type = "checkbox";
  selectInput.checked = selectedLibraryIds.has(item.id);
  selectInput.addEventListener("change", () => {
    if (selectInput.checked) selectedLibraryIds.add(item.id);
    else selectedLibraryIds.delete(item.id);
    card.classList.toggle("is-selected", selectInput.checked);
    updateBulkUi();
  });
  const selectText = document.createElement("span");
  selectText.textContent = "Select";
  selectLabel.append(selectInput, selectText);
  selectRow.appendChild(selectLabel);

  const cover = document.createElement("div");
  cover.className = "cover";
  const coverSource = item.coverDataUrl || item.thumbnailUrl || item.coverUrl;
  if (coverSource) {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.alt = "";
    img.src = coverSource;
    let triedLocalCache = !!item.coverDataUrl;
    img.onerror = async () => {
      if (!triedLocalCache && (item.coverUrl || item.thumbnailUrl)) {
        triedLocalCache = true;
        cover.textContent = "Caching cover…";
        const cached = await cacheCoverDataUrlForItem(item, "library-render-fallback");
        if (cached.coverDataUrl) {
          await updateLibraryItem(item.id, { coverDataUrl: cached.coverDataUrl });
          img.src = cached.coverDataUrl;
          cover.replaceChildren(img);
          return;
        }
      }
      img.remove();
      cover.textContent = "No cover";
    };
    cover.appendChild(img);
  } else {
    cover.textContent = "No cover";
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.displayTitle || item.title || "Untitled";

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${item.siteName || item.host || "Unknown site"} · Added ${new Date(item.addedAt || Date.now()).toLocaleDateString()}`;

  const chips = document.createElement("div");
  chips.className = "chips";
  chips.appendChild(chip(item.downloaded ? "Downloaded" : "Not downloaded", item.downloaded ? "success" : "warn"));
  if (item.favorite) chips.appendChild(chip("★ Favorite"));
  if (item.collection) chips.appendChild(chip(`📁 ${item.collection}`));
  if (item.readingStatus) chips.appendChild(chip(item.readingStatus));
  if (Number(item.rating || 0)) chips.appendChild(chip("★".repeat(Math.max(1, Math.min(5, Number(item.rating || 0))))));
  if (item.pageCount) chips.appendChild(chip(`${item.pageCount} pages`));
  (item.languages || []).slice(0, 4).forEach((lang) => chips.appendChild(chip(lang)));
  (item.artists || []).slice(0, 2).forEach((artist) => chips.appendChild(chip(artist)));
  (item.categories || []).slice(0, 2).forEach((category) => chips.appendChild(chip(category)));

  const metadataPanel = createMetadataPanel(item);

  const notes = document.createElement("textarea");
  notes.className = "notes";
  notes.placeholder = "Notes…";
  notes.value = item.notes || "";
  notes.addEventListener("change", async () => {
    await updateLibraryItem(item.id, { notes: notes.value });
    await loadLibrary();
    await appendDebug("info", "Library notes updated", { id: item.id });
  });

  const personal = document.createElement("div");
  personal.className = "personal-fields";
  const collectionInput = document.createElement("input");
  collectionInput.placeholder = "Collection / folder";
  collectionInput.value = item.collection || "";
  collectionInput.addEventListener("change", async () => {
    await updateLibraryItem(item.id, { collection: collectionInput.value.trim(), updatedAt: Date.now() });
    await loadLibrary();
  });
  const readingSelect = document.createElement("select");
  ["unread", "reading", "finished"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    readingSelect.appendChild(option);
  });
  readingSelect.value = item.readingStatus || "unread";
  readingSelect.addEventListener("change", async () => {
    await updateLibraryItem(item.id, { readingStatus: readingSelect.value, updatedAt: Date.now() });
    await loadLibrary();
  });
  const ratingSelect = document.createElement("select");
  [0, 1, 2, 3, 4, 5].forEach((value) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = value ? "★".repeat(value) : "No rating";
    ratingSelect.appendChild(option);
  });
  ratingSelect.value = String(Number(item.rating || 0));
  ratingSelect.addEventListener("change", async () => {
    await updateLibraryItem(item.id, { rating: Number(ratingSelect.value || 0), updatedAt: Date.now() });
    await loadLibrary();
  });
  personal.append(collectionInput, readingSelect, ratingSelect);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const openBtn = document.createElement("button");
  openBtn.className = "ghost";
  openBtn.textContent = "Open";
  openBtn.addEventListener("click", () => browser.tabs.create({ url: item.url || item.canonicalUrl }));

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download";
  downloadBtn.addEventListener("click", async () => {
    downloadBtn.disabled = true;
    try {
      const response = await browser.runtime.sendMessage({ type: "MRM_LIBRARY_DOWNLOAD_ITEM", item });
      if (!response?.ok) throw new Error(response?.error || "Could not start download.");
      await appendDebug("info", "Library download requested", { id: item.id, url: item.url });
      showToast("Download started.");
    } catch (error) {
      showToast(error.message || "Download failed.");
    } finally {
      downloadBtn.disabled = false;
    }
  });

  const queueBtn = document.createElement("button");
  queueBtn.className = "ghost";
  queueBtn.textContent = "Queue";
  queueBtn.addEventListener("click", async () => {
    await addItemToQueue(item);
    await updateLibraryItem(item.id, { queued: true });
    await loadLibrary();
    showToast("Added to queue.");
  });

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "ghost";
  favoriteBtn.textContent = item.favorite ? "Unfavorite" : "Favorite";
  favoriteBtn.addEventListener("click", async () => {
    await updateLibraryItem(item.id, { favorite: !item.favorite });
    await loadLibrary();
  });

  const markBtn = document.createElement("button");
  markBtn.className = "ghost";
  markBtn.textContent = item.downloaded ? "Mark Undone" : "Mark Done";
  markBtn.addEventListener("click", async () => {
    await updateLibraryItem(item.id, { downloaded: !item.downloaded, lastDownloadedAt: !item.downloaded ? Date.now() : null });
    await loadLibrary();
  });

  const refreshBtn = document.createElement("button");
  refreshBtn.className = "ghost";
  refreshBtn.textContent = "Refresh";
  refreshBtn.title = "Fetch the post page again and update title, cover, tags, categories, and page count.";
  refreshBtn.addEventListener("click", async () => {
    await refreshLibraryItemMetadata(item, refreshBtn);
  });

  const removeBtn = document.createElement("button");
  removeBtn.className = "danger";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", async () => {
    if (!confirm("Remove this item from Library?")) return;
    await removeLibraryItem(item.id);
    await loadLibrary();
    showToast("Removed.");
  });

  actions.append(openBtn, downloadBtn, queueBtn, refreshBtn, favoriteBtn, markBtn, removeBtn);
  body.append(title, meta, chips, metadataPanel, personal, notes, actions);
  card.append(selectRow, cover, body);
  return card;
}

async function addItemToQueue(item) {
  const result = await browser.storage.local.get([DOWNLOAD_QUEUE_KEY]);
  const queue = Array.isArray(result[DOWNLOAD_QUEUE_KEY]) ? result[DOWNLOAD_QUEUE_KEY] : [];
  const normalized = normalizeUrl(item.url || item.canonicalUrl);
  const queueItem = {
    id: item.id,
    title: item.displayTitle || item.title,
    url: item.url || item.canonicalUrl,
    host: item.host,
    thumbnailUrl: item.thumbnailUrl || item.coverUrl || "",
    status: "pending",
    selected: true,
    addedAt: Date.now(),
    lastError: null,
  };
  const index = queue.findIndex((entry) => normalizeUrl(entry.url) === normalized || entry.id === item.id);
  if (index >= 0) queue[index] = { ...queue[index], ...queueItem, addedAt: queue[index].addedAt || queueItem.addedAt };
  else queue.unshift(queueItem);
  await browser.storage.local.set({ [DOWNLOAD_QUEUE_KEY]: queue });
}


function setLibraryDensityButton() {
  const button = $("toggleDensityBtn");
  if (!button) return;
  const compact = document.body.classList.contains("library-compact");
  button.textContent = compact ? "Comfortable view" : "Compact view";
}

function updateLibraryStats() {
  const stats = $("libraryStats");
  const summary = $("librarySummaryText");
  if (!stats || !summary) return;
  const total = libraryItems.length;
  const shown = filteredItems.length;
  const downloaded = libraryItems.filter((item) => item.downloaded).length;
  const favorites = libraryItems.filter((item) => item.favorite).length;
  const collections = new Set(libraryItems.map((item) => (item.collection || "").trim()).filter(Boolean)).size;
  stats.replaceChildren(
    createStatCard("Saved", String(total), "All library items"),
    createStatCard("Shown", String(shown), "Current filters"),
    createStatCard("Downloaded", String(downloaded), "Ready locally"),
    createStatCard("Favorites", String(favorites), "Starred items"),
    createStatCard("Collections", String(collections), "Custom groups"),
  );
  summary.textContent = `${shown} shown · ${total} saved · ${downloaded} downloaded`;
}

function createStatCard(label, value, hint) {
  const card = document.createElement("div");
  card.className = "library-stat-card";
  const valueEl = document.createElement("div");
  valueEl.className = "library-stat-value";
  valueEl.textContent = value;
  const labelEl = document.createElement("div");
  labelEl.className = "library-stat-label";
  labelEl.textContent = label;
  const hintEl = document.createElement("div");
  hintEl.className = "library-stat-hint";
  hintEl.textContent = hint;
  card.append(valueEl, labelEl, hintEl);
  return card;
}


function updateQuickFilters() {
  const container = $("libraryQuickFilters");
  if (!container) return;
  const chips = [
    { key: "all", label: "All", count: libraryItems.length },
    { key: "downloaded", label: "Downloaded", count: libraryItems.filter((item) => item.downloaded).length },
    { key: "queued", label: "Queued", count: libraryItems.filter((item) => queuedUrlSet.has(normalizeUrl(item.url || item.canonicalUrl || ""))).length },
    { key: "favorites", label: "Favorites", count: libraryItems.filter((item) => item.favorite).length },
    { key: "recent", label: "Recent", count: libraryItems.filter((item) => {
      const ts = Number(item.addedAt || item.updatedAt || 0);
      return ts && (Date.now() - ts <= 7 * 24 * 60 * 60 * 1000);
    }).length },
  ];
  container.replaceChildren(...chips.map((chip) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-filter-chip" + (chip.key === activeQuickFilter ? " is-active" : "");
    button.dataset.quickFilter = chip.key;
    button.textContent = `${chip.label} (${chip.count})`;
    button.addEventListener("click", () => {
      activeQuickFilter = chip.key;
      updateQuickFilters();
      applyFilters();
    });
    return button;
  }));
}

function getLibraryGroups(items) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const groups = [
    { key: "favorites", label: "Favorites", items: [] },
    { key: "today", label: "Today", items: [] },
    { key: "week", label: "This week", items: [] },
    { key: "earlier", label: "Earlier", items: [] },
  ];
  for (const item of items) {
    if (item.favorite) {
      groups[0].items.push(item);
      continue;
    }
    const ts = Number(item.addedAt || item.updatedAt || 0);
    const age = now - ts;
    if (age <= day) groups[1].items.push(item);
    else if (age <= 7 * day) groups[2].items.push(item);
    else groups[3].items.push(item);
  }
  return groups.filter((group) => group.items.length);
}

function createGroupHeader(group) {
  const header = document.createElement("div");
  header.className = "library-group-header";
  const title = document.createElement("div");
  title.className = "library-group-title";
  title.textContent = group.label;
  const meta = document.createElement("div");
  meta.className = "library-group-meta";
  const downloaded = group.items.filter((item) => item.downloaded).length;
  meta.textContent = `${group.items.length} items · ${downloaded} downloaded`;
  header.append(title, meta);
  return header;
}

function render() {
  pruneSelection();
  const grid = $("libraryGrid");
  const empty = $("emptyLibrary");
  grid.replaceChildren();
  updateLibraryStats();
  updateQuickFilters();
  empty.hidden = libraryItems.length !== 0;
  const groups = getLibraryGroups(filteredItems);
  for (const group of groups) {
    grid.appendChild(createGroupHeader(group));
    for (const item of group.items) grid.appendChild(createCard(item));
  }
  updateBulkUi();
}

async function loadLibrary() {
  libraryItems = await getLibraryItems();
  try {
    const stored = await browser.storage.local.get(DOWNLOAD_QUEUE_KEY);
    const queue = Array.isArray(stored?.[DOWNLOAD_QUEUE_KEY]) ? stored[DOWNLOAD_QUEUE_KEY] : [];
    queuedUrlSet = new Set(queue.map((item) => normalizeUrl(item.url || "")));
  } catch {
    queuedUrlSet = new Set();
  }
  updateFilters();
  applyFilters();
}

async function exportLibrary() {
  const payload = await createExportPayload();
  downloadJson(`mrm-library-${new Date().toISOString().slice(0, 10)}.json`, payload);
  await appendDebug("info", "Library exported", { count: payload.libraryItems.length });
  showToast("Library exported.", "success");
}

async function exportSyncSnapshot() {
  const snapshot = await createSyncSnapshot();
  downloadJson(`mrm-sync-snapshot-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
  showToast("Sync snapshot exported.", "success");
}

function importLibraryFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const payload = JSON.parse(String(reader.result || "{}"));
      const result = await importLibraryItems(payload);
      await loadLibrary();
      await appendDebug("info", "Library imported", result);
      showToast(`Imported ${result.imported} item(s).`);
    } catch (error) {
      showToast(error.message || "Import failed.");
    } finally {
      $("importLibraryFileInput").value = "";
    }
  };
  reader.readAsText(file);
}


async function runDriveSyncAction(type, label) {
  const syncStatus = $("syncStatus");
  if (syncStatus) syncStatus.textContent = `${label} started...`;
  try {
    const response = await browser.runtime.sendMessage({ type });
    if (!response?.ok) throw new Error(response?.error || `${label} failed.`);
    if (syncStatus) {
      const libraryCount = response.libraryItems ?? response.pull?.libraryItems ?? response.push?.libraryItems ?? "";
      const queueCount = response.queueItems ?? response.pull?.queueItems ?? response.push?.queueItems ?? "";
      syncStatus.textContent = `${label} completed${libraryCount !== "" ? ` · Library: ${libraryCount}` : ""}${queueCount !== "" ? ` · Queue: ${queueCount}` : ""}`;
    }
    await appendDebug("info", `${label} completed from Library page`, response);
    if (type !== "MRM_GOOGLE_DRIVE_PUSH_LOCAL") await loadLibrary();
    showToast(`${label} completed.`, "success");
  } catch (error) {
    const message = String(error?.message || error);
    if (syncStatus) syncStatus.textContent = `${label} failed: ${message}`;
    await appendDebug("error", `${label} failed from Library page`, { error: message });
    showToast(`${label} failed.`, "error");
  }
}


async function setSelectedCollection() {
  const selected = getSelectedItems();
  if (!selected.length) return showToast("Select Library items first.");
  const value = prompt("Collection/folder name:", selected[0].collection || "");
  if (value === null) return;
  for (const item of selected) {
    await updateLibraryItem(item.id, { collection: value.trim(), updatedAt: Date.now() });
  }
  await loadLibrary();
  showToast("Collection updated.");
}

async function bulkTagSelectedItems() {
  const selected = getSelectedItems();
  if (!selected.length) return showToast("Select Library items first.");
  const value = prompt("Tags to add, comma separated:", "");
  if (value === null) return;
  const tagsToAdd = value.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (!tagsToAdd.length) return;
  for (const item of selected) {
    const merged = Array.from(new Set([...(item.tags || []), ...tagsToAdd])).sort();
    await updateLibraryItem(item.id, { tags: merged, updatedAt: Date.now() });
  }
  await loadLibrary();
  showToast("Tags added.");
}

async function refreshStaleMetadata() {
  const now = Date.now();
  const stale = libraryItems.filter((item) => !item.lastCheckedAt || now - Number(item.lastCheckedAt || 0) > 30 * 24 * 60 * 60 * 1000);
  if (!stale.length) return showToast("No stale metadata found.");
  if (!confirm(`Refresh ${stale.length} stale item(s)?`)) return;
  let refreshed = 0;
  for (const item of stale) {
    try {
      const next = await fetchLibraryItemMetadata(item);
      await saveLibraryItem(next);
      refreshed += 1;
    } catch (error) {
      await appendDebug("warn", "Stale metadata refresh failed", { id: item.id, url: item.url, error: error?.message || String(error) });
    }
  }
  await loadLibrary();
  showToast(`Refreshed ${refreshed} stale item(s).`);
}

async function cleanupDuplicateLibraryItems() {
  const byUrl = new Map();
  const duplicates = [];
  for (const item of libraryItems) {
    const key = normalizeUrl(item.canonicalUrl || item.url || "");
    if (!key) continue;
    if (byUrl.has(key)) duplicates.push(item);
    else byUrl.set(key, item);
  }
  if (!duplicates.length) return showToast("No duplicates found.");
  if (!confirm(`Remove ${duplicates.length} duplicate item(s)? User notes/favorites from duplicates are not merged in this simple cleanup.`)) return;
  for (const item of duplicates) await removeLibraryItem(item.id);
  await loadLibrary();
  showToast("Duplicate cleanup completed.");
}

function setupEvents() {
  ["searchInput", "siteFilter", "languageFilter", "statusFilter", "collectionFilter", "ratingFilter", "sortSelect"].forEach((id) => {
    $(id).addEventListener("input", applyFilters);
    $(id).addEventListener("change", applyFilters);
  });
  $("exportLibraryBtn").addEventListener("click", exportLibrary);
  $("exportSelectedBtn").addEventListener("click", exportSelectedLibraryItems);
  $("selectVisibleBtn").addEventListener("click", () => {
    filteredItems.forEach((item) => selectedLibraryIds.add(item.id));
    render();
  });
  $("selectAllBtn").addEventListener("click", () => {
    libraryItems.forEach((item) => selectedLibraryIds.add(item.id));
    render();
  });
  $("clearSelectionBtn").addEventListener("click", () => {
    selectedLibraryIds.clear();
    render();
  });
  $("downloadSelectedBtn").addEventListener("click", downloadSelectedLibraryItems);
  $("queueSelectedBtn").addEventListener("click", queueSelectedLibraryItems);
  $("refreshSelectedBtn").addEventListener("click", refreshSelectedLibraryItems);
  $("refreshMissingCoversBtn").addEventListener("click", refreshMissingLibraryCovers);
  $("generateSelectedCoversBtn").addEventListener("click", generateSelectedCoversFromDownload);
  $("setCollectionSelectedBtn")?.addEventListener("click", setSelectedCollection);
  $("bulkTagSelectedBtn")?.addEventListener("click", bulkTagSelectedItems);
  $("refreshStaleMetadataBtn")?.addEventListener("click", refreshStaleMetadata);
  $("cleanupDuplicatesBtn")?.addEventListener("click", cleanupDuplicateLibraryItems);
  $("removeSelectedBtn").addEventListener("click", removeSelectedLibraryItems);
  $("importLibraryBtn").addEventListener("click", () => $("importLibraryFileInput").click());
  $("importLibraryFileInput").addEventListener("change", (event) => importLibraryFromFile(event.target.files?.[0]));
  $("createSnapshotBtn").addEventListener("click", exportSyncSnapshot);
  $("syncNowBtn").addEventListener("click", () => runDriveSyncAction("MRM_GOOGLE_DRIVE_SYNC_NOW", "Sync Now"));
  $("syncNowBtn2")?.addEventListener("click", () => runDriveSyncAction("MRM_GOOGLE_DRIVE_SYNC_NOW", "Sync Now"));
  $("drivePushBtn")?.addEventListener("click", () => runDriveSyncAction("MRM_GOOGLE_DRIVE_PUSH_LOCAL", "Push Local to Drive"));
  $("drivePullBtn")?.addEventListener("click", () => runDriveSyncAction("MRM_GOOGLE_DRIVE_PULL_REMOTE", "Pull Remote to Local"));
  $("backBtn").addEventListener("click", () => history.length > 1 ? history.back() : window.close());
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.mrmLibraryItems) loadLibrary();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupEvents();
  await loadLibrary();
});

function renderLibrarySummary() {
  const root = $("librarySummary");
  if (!root) return;
  const total = libraryItems.length;
  const downloaded = libraryItems.filter((item) => item.downloaded).length;
  const queued = libraryItems.filter((item) => item.queued).length;
  const favorites = libraryItems.filter((item) => item.favorite).length;
  root.replaceChildren(...[
    ["Items", total],
    ["Downloaded", downloaded],
    ["Queued", queued],
    ["Favorites", favorites],
  ].map(([k,v]) => {
    const stat = document.createElement("div");
    stat.className = "stat";
    const ks = document.createElement("span"); ks.className = "k"; ks.textContent = String(k);
    const vs = document.createElement("span"); vs.className = "v"; vs.textContent = String(v);
    stat.append(ks,vs);
    return stat;
  }));
}
const __origRender = render;
render = function renderWithSummary() {
  __origRender();
  renderLibrarySummary();
};
