const BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID = "1045970260428-l071ieen89j7cqbpq86def3cdkr3pptf.apps.googleusercontent.com";
const BUNDLED_GOOGLE_DRIVE_CLIENT_ID = BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID;

function buildDefaultSettings() {
  const base = window.MRMCommon?.getDefaultSettings ? window.MRMCommon.getDefaultSettings() : {};
  return {
    ...base,
    googleDriveClientId: BUNDLED_GOOGLE_DRIVE_CLIENT_ID,
    googleDriveClientSecret: "",
    googleDriveOAuthMode: "desktop-pkce",
    googleDriveSyncEnabled: false,
    googleDriveAutoSyncOnStartup: false,
    googleDriveAutoSyncOnLibraryChange: false,
    googleDriveAutoSyncDelaySeconds: 60,
    pageToastEnabled: true,
    minimalQueueOverlay: true,
    minimalQueueOverlayActiveOnly: false,
  };
}

let settings = buildDefaultSettings();

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent || "");
}

function applyPlatformDefaults(savedSettings = {}) {
  if (typeof savedSettings.androidBackgroundTabFix === "boolean") {
    return savedSettings;
  }

  return {
    ...savedSettings,
    androidBackgroundTabFix: isAndroidDevice(),
  };
}

const { sanitizeFilename, clearChildren, createEl, showToast, debounce, formatCookieHeader, maskValue, appendDebugLog } = window.MRMCommon;
let editingCookieIndex = -1;
let googleDriveCredentialsDirty = false;

function setGoogleDriveCredentialsSavedState(kind = "saved", message = "") {
  const label = document.getElementById("googleDriveCredentialsSavedState");
  const button = document.getElementById("saveGoogleDriveCredentialsBtn");
  if (!label) return;
  label.dataset.state = kind;
  if (kind === "dirty") {
    label.textContent = message || "Unsaved changes";
  } else if (kind === "saving") {
    label.textContent = message || "Saving…";
  } else if (kind === "error") {
    label.textContent = message || "Save failed";
  } else {
    label.textContent = message || "Saved locally";
  }
  if (button) button.disabled = kind === "saving" || kind === "saved";
}

async function saveGoogleDriveCredentials() {
  try {
    googleDriveCredentialsDirty = false;
    setGoogleDriveCredentialsSavedState("saving");
    settings.googleDriveClientSecret = String(document.getElementById("googleDriveClientSecretInput")?.value || "").trim();
    await saveSettings();
    setGoogleDriveCredentialsSavedState("saved");
    await appendDebugLog?.("SETTINGS", "info", "Google Drive credentials saved");
  } catch (error) {
    googleDriveCredentialsDirty = true;
    setGoogleDriveCredentialsSavedState("error");
    throw error;
  }
}

const autosave = debounce(async () => {
  await saveSettings();
  if (googleDriveCredentialsDirty) {
    googleDriveCredentialsDirty = false;
    setGoogleDriveCredentialsSavedState("saved");
  }
  await appendDebugLog?.("SETTINGS", "info", "Settings auto-saved");
}, 250);

window.alert = (message) => showToast(message, "warning");
document.addEventListener("DOMContentLoaded", async function () {
  await loadSettings();
  setupEventListeners();
  ensureAdvancedExtras();
  bindAutosaveInputs();
  updateUI();
  await refreshGoogleDriveStatus();
});

async function loadSettings() {
  try {
    const result = await browser.storage.local.get(["mrmSettings"]);
    if (result.mrmSettings) {
      settings = { ...buildDefaultSettings(), ...applyPlatformDefaults(result.mrmSettings) };
    } else {
      settings = buildDefaultSettings();
    }
  } catch (error) {
    console.error("[MRM Settings] Error loading settings:", error);
  }
}

async function saveSettings() {
  try {
    const sanitizedSettings = { ...settings, autoRetrievedCookies: [] };
    await browser.storage.local.set({ mrmSettings: sanitizedSettings });
    console.log("[MRM Settings] Settings saved.");
  } catch (error) {
    console.error("[MRM Settings] Error saving settings:", error);
    showToast("Failed to save settings. Please try again.", "error");
  }
}



function ensureAdvancedExtras() {
  const advancedGrid = document.querySelector(".mrm-setting-grid");
  if (!advancedGrid || document.getElementById("filenameRulePreview")) return;

  const block = document.createElement("div");
  block.className = "mrm-setting-block";

  const head = document.createElement("div");
  head.className = "mrm-setting-head";

  const headText = document.createElement("div");
  const title = document.createElement("div");
  title.className = "mrm-setting-title";
  title.textContent = "Archive naming";
  const copy = document.createElement("div");
  copy.className = "mrm-setting-copy";
  copy.textContent = "Normalize common single-part suffixes and preview the final CBZ title.";
  headText.append(title, copy);

  const preview = document.createElement("span");
  preview.id = "filenameRulePreview";
  preview.className = "mrm-inline-chip";
  preview.textContent = "Preview";

  head.append(headText, preview);
  block.appendChild(head);

  const rows = [
    {
      title: "Strip trailing “Part 1”",
      copy: "Removes a final Part 1 / Pt 1 marker from archive base names.",
      id: "stripPartSuffixToggle",
    },
    {
      title: "Strip trailing “Page 1”",
      copy: "Useful when galleries are exported one archive at a time.",
      id: "stripPageSuffixToggle",
    },
    {
      title: "Include page range in CBZ",
      copy: "Reserved for multi-page archive naming.",
      id: "includePageRangeInCbzToggle",
    },
  ];

  rows.forEach(({ title: rowTitle, copy: rowCopy, id }) => {
    const row = document.createElement("div");
    row.className = "mrm-setting-row";

    const textWrap = document.createElement("div");
    const rowTitleEl = document.createElement("div");
    rowTitleEl.className = "mrm-setting-title";
    rowTitleEl.textContent = rowTitle;
    const rowCopyEl = document.createElement("div");
    rowCopyEl.className = "mrm-setting-copy";
    rowCopyEl.textContent = rowCopy;
    textWrap.append(rowTitleEl, rowCopyEl);

    const label = document.createElement("label");
    label.className = "mrm-toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = id;
    const track = document.createElement("span");
    track.className = "mrm-toggle-track";
    label.append(input, track);

    row.append(textWrap, label);
    block.appendChild(row);
  });

  const queueBlock = document.getElementById("queueConcurrencySlider")?.closest(".mrm-setting-block");
  if (queueBlock && queueBlock.parentNode) queueBlock.parentNode.insertBefore(block, queueBlock.nextSibling);
}

function updateFilenameRulePreview() {
  const preview = document.getElementById("filenameRulePreview");
  if (!preview) return;
  let sample = "Example Title Part 1";
  if (settings.stripPartSuffix !== false) sample = sample.replace(/[\s._-]+(?:part|pt)[\s._-]*0*1\s*$/i, "");
  if (settings.stripPageSuffix) sample = sample.replace(/[\s._-]+page[\s._-]*0*1\s*$/i, "");
  preview.textContent = sanitizeFilename(sample || "Example Title", "Example Title");
}

function bindAutosaveInputs() {
  const toggleMap = [
    ["useCookiesToggle", "useCookies"],
    ["hideAIListingToggle", "hideAIListing"],
    ["hideDownloadedListingToggle", "hideDownloadedListing"],
    ["hideQueuedListingToggle", "hideQueuedListing"],
    ["hideSavedListingToggle", "hideSavedListing"],
    ["compactMobileUiToggle", "compactMobileUi"],
    ["queueWifiOnlyToggle", "queueWifiOnly"],
    ["androidBackgroundTabFixToggle", "androidBackgroundTabFix"],
    ["debugModeToggle", "debugMode"],
    ["verboseDebugModeToggle", "verboseDebugMode"],
    ["stripPartSuffixToggle", "stripPartSuffix"],
    ["stripPageSuffixToggle", "stripPageSuffix"],
    ["includePageRangeInCbzToggle", "includePageRangeInCbz"],
  ];
  toggleMap.forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener("change", async (event) => {
      settings[key] = !!event.target.checked;
      updateUI();
      await autosave();
    });
  });

  document.getElementById("retryCountSlider")?.addEventListener("input", async (event) => {
    settings.retryCount = Number(event.target.value || 3);
    updateUI();
    await autosave();
  });
  document.getElementById("timeoutSlider")?.addEventListener("input", async (event) => {
    settings.timeout = Number(event.target.value || 30);
    updateUI();
    await autosave();
  });
  document.getElementById("queueConcurrencySlider")?.addEventListener("input", async (event) => {
    settings.queueConcurrency = Math.max(1, Math.min(3, Number(event.target.value || 1)));
    updateUI();
    await autosave();
  });
  document.getElementById("cookieSourceAuto")?.addEventListener("change", async () => {
    settings.cookieSource = "auto";
    updateUI();
    await autosave();
  });
  document.getElementById("cookieSourceCustom")?.addEventListener("change", async () => {
    settings.cookieSource = "custom";
    updateUI();
    await autosave();
  });
  document.getElementById("cookieStringTextarea")?.addEventListener("input", () => {
    const text = document.getElementById("cookieStringTextarea").value || "";
    document.getElementById("simpleCookieInput").value = text;
  });

  const googleDriveClientSecretInput = document.getElementById("googleDriveClientSecretInput");
  const syncGoogleDriveClientSecret = async () => {
    settings.googleDriveClientSecret = String(googleDriveClientSecretInput?.value || "").trim();
    googleDriveCredentialsDirty = true;
    setGoogleDriveCredentialsSavedState("dirty");
    await autosave();
    if (!googleDriveCredentialsDirty) {
      setGoogleDriveCredentialsSavedState("saved");
    }
  };
  googleDriveClientSecretInput?.addEventListener("input", syncGoogleDriveClientSecret);
  googleDriveClientSecretInput?.addEventListener("change", syncGoogleDriveClientSecret);
  googleDriveClientSecretInput?.addEventListener("blur", syncGoogleDriveClientSecret);
}

function setupEventListeners() {
  // Navigation
  document.getElementById("backBtn").addEventListener("click", goBack);
  document.getElementById("saveBtn").addEventListener("click", handleSave);
  document.getElementById("footerBackBtn")?.addEventListener("click", goBack);
  document.getElementById("footerSaveBtn")?.addEventListener("click", handleSave);

  // Cookie management
  document
    .getElementById("addCookieBtn")
    .addEventListener("click", showAddCookieModal);
  document
    .getElementById("autoRetrieveCookiesBtn")
    .addEventListener("click", autoRetrieveCookies);
  document
    .getElementById("refreshCookiesBtn")
    .addEventListener("click", autoRetrieveCookies);
  document
    .getElementById("parseCookieStringBtn")
    .addEventListener("click", parseCookieString);
  document
    .getElementById("closeModalBtn")
    .addEventListener("click", hideCookieModal);
  document
    .getElementById("cancelCookieBtn")
    .addEventListener("click", hideCookieModal);
  document
    .getElementById("saveCookieBtn")
    .addEventListener("click", saveCookie);

  // Cookie source radio buttons
  document
    .getElementById("cookieSourceAuto")
    .addEventListener("change", handleCookieSourceChange);
  document
    .getElementById("cookieSourceCustom")
    .addEventListener("change", handleCookieSourceChange);

  // Settings toggles and sliders
  document
    .getElementById("useCookiesToggle")
    .addEventListener("change", function () {
      settings.useCookies = this.checked;
    });

  document
    .getElementById("debugModeToggle")
    .addEventListener("change", function () {
      settings.debugMode = this.checked;
    });

  document
    .getElementById("hideAIListingToggle")
    .addEventListener("change", function () {
      settings.hideAIListing = this.checked;
    });

  document
    .getElementById("hideDownloadedListingToggle")
    ?.addEventListener("change", function () {
      settings.hideDownloadedListing = this.checked;
    });

  document
    .getElementById("hideQueuedListingToggle")
    ?.addEventListener("change", function () {
      settings.hideQueuedListing = this.checked;
    });

  document
    .getElementById("androidBackgroundTabFixToggle")
    .addEventListener("change", function () {
      settings.androidBackgroundTabFix = this.checked;
    });

  document
    .getElementById("retryCountSlider")
    .addEventListener("input", function () {
      settings.retryCount = parseInt(this.value);
      document.getElementById("retryCountDisplay").textContent = this.value;
    });

  document
    .getElementById("timeoutSlider")
    .addEventListener("input", function () {
      settings.timeout = parseInt(this.value);
      document.getElementById("timeoutDisplay").textContent = this.value;
    });

  // Reset settings
  document.getElementById("resetBtn").addEventListener("click", resetSettings);

  // Debug tools
  document
    .getElementById("testCookiesBtn")
    .addEventListener("click", testCookies);
  document
    .getElementById("clearTestCookiesBtn")
    .addEventListener("click", clearTestCookies);

  document
    .getElementById("showOAuthRedirectBtn")
    ?.addEventListener("click", showAndCopyOAuthRedirectUrl);
  document
    .getElementById("googleDriveSignInBtn")
    ?.addEventListener("click", testGoogleDriveConnection);
  document
    .getElementById("googleDriveConnectTestBtn")
    ?.addEventListener("click", testGoogleDriveConnection);
  document
    .getElementById("copyGoogleDriveSignInUrlBtn")
    ?.addEventListener("click", copyGoogleDriveSignInUrl);
  document
    .getElementById("googleDriveStatusBtn")
    ?.addEventListener("click", refreshGoogleDriveStatus);
  document
    .getElementById("googleDriveCompleteManualRedirectBtn")
    ?.addEventListener("click", completeGoogleDriveOAuthFromRedirectUrl);
  document
    .getElementById("googleDriveDisconnectBtn")
    ?.addEventListener("click", disconnectGoogleDriveTestToken);
  document
    .getElementById("googleDriveReconnectBtn")
    ?.addEventListener("click", testGoogleDriveConnection);
  document
    .getElementById("googleDriveDisconnectPrimaryBtn")
    ?.addEventListener("click", disconnectGoogleDriveTestToken);
  document
    .getElementById("saveGoogleDriveCredentialsBtn")
    ?.addEventListener("click", saveGoogleDriveCredentials);
  syncGoogleDriveClientPlaceholder();
  ["googleDriveSyncEnabledToggle", "googleDriveAutoSyncChangeToggle", "googleDriveAutoSyncStartupToggle", "googleDriveAutoSyncDelayInput"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", saveGoogleDriveAutoSyncSettings);
  });

  // Modal backdrop click
  document
    .getElementById("cookieModal")
    .addEventListener("click", function (e) {
      if (e.target === this) {
        hideCookieModal();
      }
    });

  // Form validation
  document
    .getElementById("cookieName")
    .addEventListener("input", validateCookieForm);
  document
    .getElementById("cookieValue")
    .addEventListener("input", validateCookieForm);
}

function updateUI() {
  // Update toggles
  document.getElementById("useCookiesToggle").checked = settings.useCookies;
  document.getElementById("debugModeToggle").checked = settings.debugMode;
  document.getElementById("verboseDebugModeToggle").checked = !!settings.verboseDebugMode;
  document.getElementById("verboseDebugModeToggle").disabled = !settings.debugMode;
  document.getElementById("hideAIListingToggle").checked = settings.hideAIListing;
  const hideDownloadedToggle = document.getElementById("hideDownloadedListingToggle");
  if (hideDownloadedToggle) hideDownloadedToggle.checked = !!settings.hideDownloadedListing;
  const hideQueuedToggle = document.getElementById("hideQueuedListingToggle");
  if (hideQueuedToggle) hideQueuedToggle.checked = !!settings.hideQueuedListing;
  const hideSavedToggle = document.getElementById("hideSavedListingToggle");
  if (hideSavedToggle) hideSavedToggle.checked = !!settings.hideSavedListing;
  const compactMobileToggle = document.getElementById("compactMobileUiToggle");
  if (compactMobileToggle) compactMobileToggle.checked = !!settings.compactMobileUi;
  const queueConcurrencySlider = document.getElementById("queueConcurrencySlider");
  if (queueConcurrencySlider) queueConcurrencySlider.value = String(Math.max(1, Math.min(3, Number(settings.queueConcurrency || 1))));
  const queueConcurrencyDisplay = document.getElementById("queueConcurrencyDisplay");
  if (queueConcurrencyDisplay) queueConcurrencyDisplay.textContent = String(Math.max(1, Math.min(3, Number(settings.queueConcurrency || 1))));
  const queueWifiOnlyToggle = document.getElementById("queueWifiOnlyToggle");
  if (queueWifiOnlyToggle) queueWifiOnlyToggle.checked = !!settings.queueWifiOnly;
  document.getElementById("androidBackgroundTabFixToggle").checked = settings.androidBackgroundTabFix;
  const stripPartSuffixToggle = document.getElementById("stripPartSuffixToggle");
  if (stripPartSuffixToggle) stripPartSuffixToggle.checked = settings.stripPartSuffix !== false;
  const stripPageSuffixToggle = document.getElementById("stripPageSuffixToggle");
  if (stripPageSuffixToggle) stripPageSuffixToggle.checked = !!settings.stripPageSuffix;
  const includePageRangeInCbzToggle = document.getElementById("includePageRangeInCbzToggle");
  if (includePageRangeInCbzToggle) includePageRangeInCbzToggle.checked = !!settings.includePageRangeInCbz;
  updateFilenameRulePreview();

  // Update sliders
  document.getElementById("retryCountSlider").value = settings.retryCount;
  document.getElementById("retryCountDisplay").textContent =
    settings.retryCount;
  document.getElementById("timeoutSlider").value = settings.timeout;
  document.getElementById("timeoutDisplay").textContent = settings.timeout;

  // Update cookie source selection
  document.getElementById("cookieSourceAuto").checked =
    settings.cookieSource === "auto";
  document.getElementById("cookieSourceCustom").checked =
    settings.cookieSource === "custom";
  handleCookieSourceChange();

  settings.googleDriveOAuthMode = "desktop-pkce";
  const googleDriveClientIdInput = document.getElementById("googleDriveClientIdInput");
  if (googleDriveClientIdInput && googleDriveClientIdInput.value !== (settings.googleDriveClientId || "")) {
    googleDriveClientIdInput.value = settings.googleDriveClientId || "";
  }
  const googleDriveClientSecretInput = document.getElementById("googleDriveClientSecretInput");
  if (googleDriveClientSecretInput && googleDriveClientSecretInput.value !== (settings.googleDriveClientSecret || "")) {
    googleDriveClientSecretInput.value = settings.googleDriveClientSecret || "";
  }
  googleDriveCredentialsDirty = false;
  setGoogleDriveCredentialsSavedState("saved");
  syncGoogleDriveClientPlaceholder();

  const syncEnabledToggle = document.getElementById("googleDriveSyncEnabledToggle");
  if (syncEnabledToggle) syncEnabledToggle.checked = !!settings.googleDriveSyncEnabled;
  const autoChangeToggle = document.getElementById("googleDriveAutoSyncChangeToggle");
  if (autoChangeToggle) autoChangeToggle.checked = !!settings.googleDriveAutoSyncOnLibraryChange;
  const autoStartupToggle = document.getElementById("googleDriveAutoSyncStartupToggle");
  if (autoStartupToggle) autoStartupToggle.checked = !!settings.googleDriveAutoSyncOnStartup;
  const autoDelayInput = document.getElementById("googleDriveAutoSyncDelayInput");
  if (autoDelayInput) autoDelayInput.value = String(settings.googleDriveAutoSyncDelaySeconds || 60);

  // Update cookie list
  renderCookieList();
}



function setGoogleDriveStatus(status, kind = "info") {
  const el = document.getElementById("googleDriveStatus");
  if (!el) return;
  el.style.display = "block";
  el.textContent = typeof status === "string" ? status : JSON.stringify(status, null, 2);
  el.dataset.kind = kind;
}

function getSelectedGoogleDriveOAuthMode() {
  return "desktop-pkce";
}

function getBundledGoogleDriveClientIdForMode() {
  return BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID;
}

function syncGoogleDriveClientPlaceholder() {
  const input = document.getElementById("googleDriveClientIdInput");
  if (!input) return;
  input.placeholder = BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID;
}

async function copyTextToClipboard(text, fallbackFieldId = "googleOAuthRedirectUrl") {
  const value = String(text || "");
  if (!value) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = document.getElementById(fallbackFieldId);
    if (field) {
      field.value = value;
      field.focus();
      field.select();
      return document.execCommand?.("copy") || false;
    }
  }

  return false;
}

async function getSavedGoogleDriveClientId() {
  const input = document.getElementById("googleDriveClientIdInput");
  const resolvedValue = BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID;
  settings.googleDriveClientId = resolvedValue;
  settings.googleDriveOAuthMode = "desktop-pkce";
  if (input && input.value !== resolvedValue) input.value = resolvedValue;
  return resolvedValue;
}

async function getSavedGoogleDriveClientSecret() {
  const input = document.getElementById("googleDriveClientSecretInput");
  const inputValue = String(input?.value || "").trim();
  if (inputValue) return inputValue;

  const result = await browser.storage.local.get(["mrmSettings"]);
  const storedValue = String(result?.mrmSettings?.googleDriveClientSecret || "").trim();
  if (storedValue && input) input.value = storedValue;
  return storedValue;
}

async function persistGoogleDriveClientId(_clientId) {
  const cleanClientId = BUNDLED_GOOGLE_DRIVE_DESKTOP_CLIENT_ID;
  settings.googleDriveClientId = cleanClientId;
  settings.googleDriveOAuthMode = "desktop-pkce";
  const input = document.getElementById("googleDriveClientIdInput");
  if (input && input.value !== cleanClientId) input.value = cleanClientId;
  await saveSettings();
  return cleanClientId;
}

async function showAndCopyOAuthRedirectUrl() {
  try {
    const clientId = await getSavedGoogleDriveClientId();
    const response = await browser.runtime.sendMessage({ type: "MRM_GET_OAUTH_REDIRECT_URL", clientId, oauthMode: getSelectedGoogleDriveOAuthMode() });
    if (!response?.ok) throw new Error(response?.error || "Could not get OAuth redirect URL.");

    const redirectUrl = response.redirectUrl || "";
    const field = document.getElementById("googleOAuthRedirectUrl");
    if (field) field.value = redirectUrl;

    const copied = await copyTextToClipboard(redirectUrl);
    setGoogleDriveStatus({
      redirectUrl,
      copied,
      nextStep: "Paste this exact URL into Google Cloud OAuth client → Authorized redirect URIs.",
    });
    await appendDebugLog?.("SETTINGS", "info", "OAuth redirect URL shown", { copied, redirectUrl });
  } catch (error) {
    const message = String(error?.message || error);
    setGoogleDriveStatus(`OAuth redirect URL failed: ${message}`, "error");
    await appendDebugLog?.("SETTINGS", "error", "OAuth redirect URL failed", { error: message });
  }
}


function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGoogleDriveOAuthSession(sessionId, timeoutMs = 5 * 60 * 1000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const response = await browser.runtime.sendMessage({
      type: "MRM_GOOGLE_DRIVE_OAUTH_SESSION_STATUS",
      sessionId,
    });
    if (response?.status === "connected") return response.result || response;
    if (response?.status === "failed") throw new Error(response.error || "Google OAuth failed.");
    if (response?.status === "missing") throw new Error(response.error || "Google OAuth session expired.");
    await delay(1000);
  }
  throw new Error("Google OAuth timed out before the redirect returned.");
}

async function copyGoogleDriveSignInUrl() {
  let clientId = await getSavedGoogleDriveClientId();

  try {
    const redirectResponse = await browser.runtime.sendMessage({ type: "MRM_GET_OAUTH_REDIRECT_URL", clientId, oauthMode: getSelectedGoogleDriveOAuthMode() });
    if (redirectResponse?.ok) {
      const redirectField = document.getElementById("googleOAuthRedirectUrl");
      if (redirectField) redirectField.value = redirectResponse.redirectUrl || "";
    }

    if (!clientId) {
      setGoogleDriveStatus({
        message: "Desktop OAuth Client ID is bundled, then tap Copy sign-in URL again.",
        redirectUrl: redirectResponse?.redirectUrl || "",
        copied: false,
        clientIdStored: false,
      }, "warning");
      await appendDebugLog?.("SETTINGS", "warn", "Google Drive sign-in URL not generated; missing client ID", {
        redirectUrl: redirectResponse?.redirectUrl || "",
      });
      return;
    }

    clientId = await persistGoogleDriveClientId(clientId);

    const prepared = await browser.runtime.sendMessage({
      type: "MRM_GOOGLE_DRIVE_OAUTH_PREPARE_TAB",
      clientId,
      clientSecret: await getSavedGoogleDriveClientSecret(),
      oauthMode: getSelectedGoogleDriveOAuthMode(),
    });
    if (!prepared?.ok) throw new Error(prepared?.error || "Could not prepare Google OAuth sign-in URL.");

    const redirectField = document.getElementById("googleOAuthRedirectUrl");
    if (redirectField) redirectField.value = prepared.redirectUrl || "";

    const signInField = document.getElementById("googleDriveSignInUrl");
    if (signInField) signInField.value = prepared.authUrl || "";

    const copied = await copyTextToClipboard(prepared.authUrl || "", "googleDriveSignInUrl");
    setGoogleDriveStatus({
      message: copied ? "Google sign-in URL copied." : "Google sign-in URL generated. Copy it manually from the field.",
      copied,
      android: isAndroidDevice(),
      clientIdStored: true,
      redirectUrl: prepared.redirectUrl,
      signInUrl: prepared.authUrl,
      sessionId: prepared.sessionId,
      instructions: [
        "Open the copied URL in Firefox Android.",
        "Finish Google sign-in.",
        "If it does not connect automatically, copy the final redirected URL and paste it into the manual redirect field.",
      ],
    });
    await appendDebugLog?.("SETTINGS", "info", "Google Drive manual sign-in URL generated", {
      copied,
      sessionId: prepared.sessionId,
      android: isAndroidDevice(),
      hasClientId: true,
    });
  } catch (error) {
    const message = String(error?.message || error);
    setGoogleDriveStatus(`Google sign-in URL failed: ${message}`, "error");
    await appendDebugLog?.("SETTINGS", "error", "Google Drive manual sign-in URL failed", { error: message });
  }
}

async function completeGoogleDriveOAuthFromRedirectUrl() {
  const redirectUrl = String(document.getElementById("googleDriveManualRedirectUrl")?.value || "").trim();
  if (!redirectUrl) {
    setGoogleDriveStatus("Paste the final redirected URL first.", "warning");
    return;
  }

  let clientId = await getSavedGoogleDriveClientId();
  if (clientId) {
    clientId = await persistGoogleDriveClientId(clientId);
  }

  try {
    const response = await browser.runtime.sendMessage({
      type: "MRM_GOOGLE_DRIVE_COMPLETE_MANUAL_REDIRECT",
      redirectUrl,
      clientId,
      clientSecret: await getSavedGoogleDriveClientSecret(),
      oauthMode: getSelectedGoogleDriveOAuthMode(),
    });
    if (!response?.ok && !response?.connected) throw new Error(response?.error || "Manual redirect connection failed.");

    setGoogleDriveConnectionUi({
      connected: true,
      scope: response.scope,
      expiresAt: response.expiresAt,
    });
    setGoogleDriveStatus({
      connected: true,
      provider: "google-drive",
      scope: response.scope,
      expiresAt: response.expiresAt,
      appDataAccess: response.appDataAccess,
      note: "Manual redirect URL accepted. Google Drive sync is connected.",
    });
    await appendDebugLog?.("SETTINGS", "info", "Google Drive manual redirect accepted", {
      appDataAccess: response.appDataAccess,
      expiresAt: response.expiresAt,
    });
    await refreshGoogleDriveStatus();
  } catch (error) {
    const message = String(error?.message || error);
    setGoogleDriveStatus(`Manual redirected URL failed: ${message}`, "error");
    await appendDebugLog?.("SETTINGS", "error", "Google Drive manual redirect failed", { error: message });
  }
}

async function testGoogleDriveConnectionWithPageInitiatedTab(clientId) {
  const prepared = await browser.runtime.sendMessage({
    type: "MRM_GOOGLE_DRIVE_OAUTH_PREPARE_TAB",
    clientId,
    clientSecret: await getSavedGoogleDriveClientSecret(),
    oauthMode: getSelectedGoogleDriveOAuthMode(),
  });
  if (!prepared?.ok) throw new Error(prepared?.error || "Could not prepare Google OAuth.");

  const redirectField = document.getElementById("googleOAuthRedirectUrl");
  if (redirectField) redirectField.value = prepared.redirectUrl || "";

  setGoogleDriveStatus({
    message: "Opening Google sign-in tab...",
    android: isAndroidDevice(),
    redirectUrl: prepared.redirectUrl,
    note: "If the tab does not open, copy the authUrl from this status and open it manually.",
    authUrl: prepared.authUrl,
  });

  let tab = null;
  try {
    tab = await browser.tabs.create({ url: prepared.authUrl, active: true });
  } catch (error) {
    const popup = window.open(prepared.authUrl, "_blank", "noopener,noreferrer");
    if (!popup) throw new Error(`Could not open Google sign-in tab: ${String(error?.message || error)}`);
  }

  if (tab?.id) {
    const registered = await browser.runtime.sendMessage({
      type: "MRM_GOOGLE_DRIVE_OAUTH_REGISTER_TAB",
      sessionId: prepared.sessionId,
      tabId: tab.id,
    });
    if (!registered?.ok) throw new Error(registered?.error || "Could not register Google OAuth tab.");
  }

  return waitForGoogleDriveOAuthSession(prepared.sessionId);
}

async function testGoogleDriveConnection() {
  const clientId = await persistGoogleDriveClientId(await getSavedGoogleDriveClientId());

  if (!clientId) {
    await showAndCopyOAuthRedirectUrl();
    setGoogleDriveStatus("Desktop OAuth Client ID is bundled. The redirect URL was shown above for Google Cloud setup.", "warning");
    return;
  }

  const usePageInitiatedFlow = isAndroidDevice();

  setGoogleDriveStatus(
    usePageInitiatedFlow
      ? "Opening Google sign-in from this Settings page. Android may block background-created auth tabs, so this uses a page-initiated tab."
      : "Opening Google OAuth sign-in..."
  );

  try {
    const response = usePageInitiatedFlow
      ? await testGoogleDriveConnectionWithPageInitiatedTab(clientId)
      : await browser.runtime.sendMessage({
          type: "MRM_GOOGLE_DRIVE_OAUTH_TEST",
          clientId,
          clientSecret: await getSavedGoogleDriveClientSecret(),
          oauthMode: "desktop-pkce",
        });

    if (!response?.ok && !response?.connected) {
      throw new Error(response?.error || "Google Drive OAuth test failed.");
    }

    setGoogleDriveConnectionUi({
      connected: true,
      scope: response.scope,
      expiresAt: response.expiresAt,
    });
    setGoogleDriveStatus({
      connected: true,
      provider: "google-drive",
      scope: response.scope,
      expiresAt: response.expiresAt,
      appDataAccess: response.appDataAccess,
      note: "Connection succeeded. Google Drive manual/automatic sync can now use this token.",
    });
    await appendDebugLog?.("SETTINGS", "info", "Google Drive OAuth test succeeded", {
      scope: response.scope,
      appDataAccess: response.appDataAccess,
      androidPageInitiatedFlow: usePageInitiatedFlow,
    });
    await refreshGoogleDriveStatus();
  } catch (error) {
    const message = String(error?.message || error);
    setGoogleDriveStatus(`Google Drive OAuth test failed: ${message}`, "error");
    await appendDebugLog?.("SETTINGS", "error", "Google Drive OAuth test failed", {
      error: message,
      androidPageInitiatedFlow: usePageInitiatedFlow,
    });
  }
}


function formatGoogleDriveExpiry(expiresAt) {
  if (!expiresAt) return "Unknown expiry";
  try {
    return `Expires ${new Date(expiresAt).toLocaleString()}`;
  } catch {
    return `Expires ${String(expiresAt)}`;
  }
}

function setGoogleDriveConnectionUi(oauth = {}) {
  const connected = !!oauth.connected && !oauth.expired;
  const expired = !!oauth.expired;
  const banner = document.getElementById("googleDriveConnectionBanner");
  const title = document.getElementById("googleDriveConnectionTitle");
  const details = document.getElementById("googleDriveConnectionDetails");
  const signInButton = document.getElementById("googleDriveSignInBtn");
  const signInLabel = document.getElementById("googleDriveSignInLabel");
  const connectedActions = document.getElementById("googleDriveConnectedActions");
  const help = document.getElementById("googleDriveConnectionHelp");
  const syncButtons = [
    "googleDrivePushBtn",
    "googleDrivePullBtn",
    "googleDriveSyncNowBtn",
  ].map((id) => document.getElementById(id)).filter(Boolean);

  if (banner) {
    banner.classList.toggle("mrm-google-connection-banner--connected", connected);
    banner.classList.toggle("mrm-google-connection-banner--expired", expired);
    banner.classList.toggle("mrm-google-connection-banner--disconnected", !connected && !expired);
  }

  if (title) {
    title.textContent = connected
      ? "Google Drive connected"
      : expired
        ? "Google Drive reconnect required"
        : "Google Drive disconnected";
  }

  if (details) {
    details.textContent = connected
      ? `${oauth.scope || "Drive AppData"} • ${formatGoogleDriveExpiry(oauth.expiresAt)}`
      : expired
        ? "Google access tokens expire. Reconnect to continue syncing."
        : "Sign in to enable Drive AppData sync.";
  }

  if (signInButton) {
    signInButton.style.display = connected ? "none" : "";
  }

  if (signInLabel) {
    signInLabel.textContent = expired ? "Reconnect Google Drive" : "Sign in with Google Drive";
  }

  if (connectedActions) {
    connectedActions.style.display = connected ? "" : "none";
  }

  if (help) {
    help.textContent = connected
      ? "Connected. Use Sync Now, Push, or Pull below."
      : expired
        ? "Authorization expired because Google rejected offline access for token flow. Reconnect to get a fresh access token."
        : "Uses Desktop app PKCE with Drive AppData access. Google may require the Desktop app client secret; it is stored locally and redacted from diagnostics.";
  }

  syncButtons.forEach((button) => {
    button.disabled = !connected;
    button.title = connected ? "" : "Connect Google Drive first.";
  });
}


async function refreshGoogleDriveStatus() {
  const statusEl = document.getElementById("googleDriveStatus");
  if (!statusEl) return;

  try {
    const response = await browser.runtime.sendMessage({ type: "MRM_GOOGLE_DRIVE_SYNC_STATUS" });
    if (!response?.ok) throw new Error(response?.error || "Could not read Google Drive status.");

    const syncSettings = response.syncSettings || {};
    settings.googleDriveSyncEnabled = !!syncSettings.enabled;
    settings.googleDriveAutoSyncOnLibraryChange = !!syncSettings.autoSyncOnLibraryChange;
    settings.googleDriveAutoSyncOnStartup = !!syncSettings.autoSyncOnStartup;
    settings.googleDriveAutoSyncDelaySeconds = Number(syncSettings.autoSyncDelaySeconds || 60);
    updateUI();
    setGoogleDriveConnectionUi(response.oauth || {});

    setGoogleDriveStatus({
      connected: !!response.oauth?.connected,
      provider: "google-drive",
      scope: response.oauth?.scope,
      expiresAt: response.oauth?.expiresAt,
      expired: !!response.oauth?.expired,
      syncSettings,
      files: response.files,
    }, response.oauth?.connected ? "info" : "warning");
  } catch (error) {
    setGoogleDriveConnectionUi({ connected: false });
    setGoogleDriveStatus(`Google Drive status failed: ${String(error?.message || error)}`, "error");
  }
}

async function disconnectGoogleDriveTestToken() {
  try {
    const response = await browser.runtime.sendMessage({ type: "MRM_GOOGLE_DRIVE_DISCONNECT" });
    if (!response?.ok) throw new Error(response?.error || "Disconnect failed.");
    setGoogleDriveConnectionUi({ connected: false });
    setGoogleDriveStatus("Google Drive disconnected.");
    await appendDebugLog?.("SETTINGS", "info", "Google Drive test token disconnected");
  } catch (error) {
    const message = String(error?.message || error);
    setGoogleDriveStatus(`Google Drive disconnect failed: ${message}`, "error");
    await appendDebugLog?.("SETTINGS", "error", "Google Drive disconnect failed", { error: message });
  }
}

async function runGoogleDriveAction(type, label) {
  setGoogleDriveStatus(`${label} started...`);
  try {
    const response = await browser.runtime.sendMessage({ type });
    if (!response?.ok) throw new Error(response?.error || `${label} failed.`);
    setGoogleDriveStatus(response);
    await refreshGoogleDriveStatus();
    await appendDebugLog?.("SETTINGS", "info", `${label} completed`, response);
  } catch (error) {
    const message = String(error?.message || error);
    setGoogleDriveStatus(`${label} failed: ${message}`, "error");
    await appendDebugLog?.("SETTINGS", "error", `${label} failed`, { error: message });
  }
}

async function saveGoogleDriveAutoSyncSettings() {
  const enabled = !!document.getElementById("googleDriveSyncEnabledToggle")?.checked;
  const autoSyncOnLibraryChange = !!document.getElementById("googleDriveAutoSyncChangeToggle")?.checked;
  const autoSyncOnStartup = !!document.getElementById("googleDriveAutoSyncStartupToggle")?.checked;
  const autoSyncDelaySeconds = Math.max(10, Math.min(900, Number(document.getElementById("googleDriveAutoSyncDelayInput")?.value || 60)));

  settings.googleDriveSyncEnabled = enabled;
  settings.googleDriveAutoSyncOnLibraryChange = autoSyncOnLibraryChange;
  settings.googleDriveAutoSyncOnStartup = autoSyncOnStartup;
  settings.googleDriveAutoSyncDelaySeconds = autoSyncDelaySeconds;
  await saveSettings();

  try {
    const response = await browser.runtime.sendMessage({
      type: "MRM_GOOGLE_DRIVE_AUTO_SYNC_SETTINGS",
      settings: {
        enabled,
        autoSyncOnLibraryChange,
        autoSyncOnStartup,
        autoSyncDelaySeconds,
      },
    });
    if (!response?.ok) throw new Error(response?.error || "Could not save auto-sync settings.");
    setGoogleDriveStatus({
      message: "Auto-sync settings saved.",
      syncSettings: response.syncSettings,
    });
  } catch (error) {
    setGoogleDriveStatus(`Auto-sync settings failed: ${String(error?.message || error)}`, "error");
  }
}


function renderCookieList() {
  const cookieList = document.getElementById("cookieList");
  const emptyCookies = document.getElementById("emptyCookies");
  clearChildren(cookieList);

  if (settings.cookieSource === "auto") {
    emptyCookies.style.display = "none";
    return;
  }

  if (settings.cookies.length === 0) {
    emptyCookies.style.display = "block";
    return;
  }

  emptyCookies.style.display = "none";

  settings.cookies.forEach((cookie, index) => {
    const domain = cookie.domain || "Current domain";
    const path = cookie.path || "/";
    const flags = [];
    if (cookie.secure) flags.push("Secure");
    if (cookie.httpOnly) flags.push("HttpOnly");

    const row = createEl("div", { className: "cookie-item flex items-center justify-between p-3 border border-gray-200 rounded-lg" });
    const body = createEl("div", { className: "flex-1 min-w-0" });
    const top = createEl("div", { className: "flex items-center space-x-2" });
    top.appendChild(createEl("h4", { className: "font-medium text-gray-800 truncate", text: cookie.name || "" }));
    top.appendChild(createEl("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded", text: domain }));
    body.appendChild(top);
    body.appendChild(createEl("p", {
      className: "text-sm text-gray-600 truncate",
      text: `Value: ${(cookie.value || "").substring(0, 50)}${(cookie.value || "").length > 50 ? "..." : ""}`
    }));
    body.appendChild(createEl("p", {
      className: "text-xs text-gray-500",
      text: `Path: ${path}${flags.length ? ` (${flags.join(", ")})` : ""}`
    }));

    const actions = createEl("div", { className: "flex space-x-2 ml-3" });
    actions.appendChild(createEl("button", {
      className: "edit-cookie-btn text-blue-600 hover:text-blue-800 p-1",
      text: "Edit",
      dataset: { index }
    }));
    actions.appendChild(createEl("button", {
      className: "delete-cookie-btn text-red-600 hover:text-red-800 p-1",
      text: "Delete",
      dataset: { index }
    }));

    row.appendChild(body);
    row.appendChild(actions);
    cookieList.appendChild(row);
  });
}

function showAddCookieModal() {
  editingCookieIndex = -1;
  document.getElementById("modalTitle").textContent = "Add Cookie";
  clearCookieForm();
  document.getElementById("cookieModal").style.display = "flex";
  document.getElementById("cookieName").focus();
}

function editCookie(index) {
  editingCookieIndex = index;
  const cookie = settings.cookies[index];

  document.getElementById("modalTitle").textContent = "Edit Cookie";
  document.getElementById("cookieName").value = cookie.name;
  document.getElementById("cookieValue").value = cookie.value;
  document.getElementById("cookieDomain").value = cookie.domain || "";
  document.getElementById("cookiePath").value = cookie.path || "/";
  document.getElementById("cookieSecure").checked = cookie.secure || false;
  document.getElementById("cookieHttpOnly").checked = cookie.httpOnly || false;

  document.getElementById("cookieModal").style.display = "flex";
  document.getElementById("cookieName").focus();
  validateCookieForm();
}

function deleteCookie(index) {
  if (confirm("Are you sure you want to delete this cookie?")) {
    settings.cookies.splice(index, 1);
    renderCookieList();
  }
}

function hideCookieModal() {
  document.getElementById("cookieModal").style.display = "none";
  clearCookieForm();
  editingCookieIndex = -1;
}

function clearCookieForm() {
  document.getElementById("cookieName").value = "";
  document.getElementById("cookieValue").value = "";
  document.getElementById("cookieDomain").value = "";
  document.getElementById("cookiePath").value = "/";
  document.getElementById("cookieSecure").checked = false;
  document.getElementById("cookieHttpOnly").checked = false;
  validateCookieForm();
}

function validateCookieForm() {
  const name = document.getElementById("cookieName").value.trim();
  const value = document.getElementById("cookieValue").value.trim();
  const saveBtn = document.getElementById("saveCookieBtn");

  const isValid = name.length > 0 && value.length > 0;
  saveBtn.disabled = !isValid;
  saveBtn.classList.toggle("opacity-50", !isValid);
  saveBtn.classList.toggle("cursor-not-allowed", !isValid);
}

function saveCookie() {
  const name = document.getElementById("cookieName").value.trim();
  const value = document.getElementById("cookieValue").value.trim();
  const domain = document.getElementById("cookieDomain").value.trim();
  const path = document.getElementById("cookiePath").value.trim() || "/";
  const secure = document.getElementById("cookieSecure").checked;
  const httpOnly = document.getElementById("cookieHttpOnly").checked;

  if (!name || !value) {
    alert("Cookie name and value are required.");
    return;
  }

  // Validate cookie name (basic validation)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    alert(
      "Cookie name can only contain letters, numbers, underscore, and hyphen."
    );
    return;
  }

  // Check for duplicate names (except when editing)
  const existingIndex = settings.cookies.findIndex(
    (cookie) => cookie.name === name
  );
  if (existingIndex !== -1 && existingIndex !== editingCookieIndex) {
    alert(
      "A cookie with this name already exists. Please choose a different name."
    );
    return;
  }

  const cookie = {
    name,
    value,
    domain: domain || null,
    path,
    secure,
    httpOnly,
  };

  if (editingCookieIndex >= 0) {
    settings.cookies[editingCookieIndex] = cookie;
  } else {
    settings.cookies.push(cookie);
  }

  renderCookieList();
  hideCookieModal();
}

async function testCookies() {
  const testBtn = document.getElementById("testCookiesBtn");
  const testResult = document.getElementById("cookieTestResult");
  const { clearChildren, createEl } = window.MRMCommon;

  const appendParagraph = (children = [], className = "") => {
    const paragraph = createEl("p", className ? { className } : {});
    for (const child of children) {
      paragraph.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    testResult.appendChild(paragraph);
    return paragraph;
  };

  const appendLabelValue = (label, value, className = "") => {
    appendParagraph([
      createEl("strong", { text: label }),
      document.createTextNode(` ${value}`),
    ], className);
  };

  const appendList = (items, className = "text-sm", itemClassName = "") => {
    const list = createEl("ul", { className });
    for (const item of items) {
      const li = createEl("li", itemClassName ? { className: itemClassName } : {});
      li.appendChild(typeof item === "string" ? document.createTextNode(item) : item);
      list.appendChild(li);
    }
    testResult.appendChild(list);
    return list;
  };

  try {
    testBtn.textContent = "Testing...";
    testBtn.disabled = true;
    testResult.style.display = "block";
    clearChildren(testResult);
    appendParagraph(["Testing cookie configuration..."]);

    let cookiesToUse = [];
    let sourceInfo = "";

    if (
      settings.cookieSource === "auto" &&
      settings.autoRetrievedCookies &&
      settings.autoRetrievedCookies.length > 0
    ) {
      cookiesToUse = settings.autoRetrievedCookies;
      sourceInfo = `Auto-retrieved (${cookiesToUse.length} cookies)`;
    } else if (
      settings.cookieSource === "custom" &&
      settings.cookies &&
      settings.cookies.length > 0
    ) {
      cookiesToUse = settings.cookies;
      sourceInfo = `Custom (${cookiesToUse.length} cookies)`;
    }

    clearChildren(testResult);
    const wrapper = createEl("div", { className: "space-y-2" });
    testResult.appendChild(wrapper);

    const mount = (node) => wrapper.appendChild(node);
    const mountParagraph = (children = [], className = "") => {
      const paragraph = createEl("p", className ? { className } : {});
      for (const child of children) {
        paragraph.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
      }
      mount(paragraph);
      return paragraph;
    };
    const mountLabelValue = (label, value, className = "") => {
      mountParagraph([
        createEl("strong", { text: label }),
        document.createTextNode(` ${value}`),
      ], className);
    };

    mountLabelValue("Cookie Source:", sourceInfo);
    mountLabelValue("Use Cookies Enabled:", settings.useCookies ? "Yes" : "No");

    if (!settings.useCookies) {
      mountParagraph([
        createEl("strong", { text: "Warning:" }),
        document.createTextNode(" Cookie usage is disabled!"),
      ], "text-orange-600");
    } else if (cookiesToUse.length === 0) {
      mountParagraph([
        createEl("strong", { text: "Error:" }),
        document.createTextNode(" No cookies configured!"),
      ], "text-red-600");
    } else {
      const cookieString = cookiesToUse
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      mountParagraph([createEl("strong", { text: "Cookie Header:" })]);
      mount(createEl("div", {
        className: "bg-gray-100 p-2 rounded text-xs font-mono break-all",
        text: `${cookieString.substring(0, 200)}${cookieString.length > 200 ? "..." : ""}`,
      }));

      mountParagraph([createEl("strong", { text: "Important Cookies Found:" })]);
      const importantCookies = cookiesToUse.filter(
        (cookie) =>
          cookie.name.includes("cf_clearance") ||
          cookie.name.includes("session") ||
          cookie.name.includes("auth") ||
          cookie.name.includes("PHPSESSID")
      );

      if (importantCookies.length > 0) {
        const list = createEl("ul", { className: "text-sm" });
        for (const cookie of importantCookies) {
          const li = createEl("li", { className: "text-green-600" });
          li.appendChild(document.createTextNode(`✓ ${cookie.name} (${cookie.value.substring(0, 20)}...)`));
          list.appendChild(li);
        }
        mount(list);
      } else {
        mountParagraph([
          "No common authentication cookies found (cf_clearance, session, auth, PHPSESSID)"
        ], "text-orange-600");
      }
    }

    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tabs[0];
      const tabUrl = new URL(activeTab.url);
      const testUrl = `${tabUrl.origin}/favicon.ico`;

      mountLabelValue("Test Request:", testUrl);

      if (cookiesToUse.length > 0) {
        mountParagraph([createEl("strong", { text: "Setting cookies in browser..." })]);
        for (const cookie of cookiesToUse) {
          try {
            const cookieDetails = {
              url: testUrl,
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain || tabUrl.hostname,
              path: cookie.path || "/",
              secure: cookie.secure || tabUrl.protocol === "https:",
              httpOnly: cookie.httpOnly || false,
            };

            if (cookie.partitionKey) {
              cookieDetails.partitionKey = cookie.partitionKey;
            }

            await browser.cookies.set(cookieDetails);
            mountParagraph([`✓ Set cookie: ${cookie.name}`], "text-sm text-green-600");
          } catch (cookieError) {
            mountParagraph([`✗ Failed to set cookie ${cookie.name}: ${cookieError.message}`], "text-sm text-red-600");
          }
        }
      }

      console.log(
        cookiesToUse
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join("; ")
      );

      const pageResponse = await browser.tabs.sendMessage(activeTab.id, {
        type: "PAGE_FETCH",
        url: testUrl,
        options: {
          method: "GET",
        },
      });

      if (!pageResponse) {
        throw new Error("No response from page context");
      }

      if (pageResponse.ok) {
        const p = createEl("p");
        p.appendChild(createEl("strong", { text: "Test Result:" }));
        p.appendChild(document.createTextNode(" "));
        p.appendChild(createEl("span", { className: "text-green-600", text: `HTTP ${pageResponse.status} ${pageResponse.statusText}` }));
        mount(p);
      } else if (typeof pageResponse.status !== "undefined") {
        const p = createEl("p");
        p.appendChild(createEl("strong", { text: "Test Result:" }));
        p.appendChild(document.createTextNode(" "));
        p.appendChild(createEl("span", { className: "text-red-600", text: `HTTP ${pageResponse.status} ${pageResponse.statusText || ""}`.trim() }));
        mount(p);
      } else {
        const p = createEl("p");
        p.appendChild(createEl("strong", { text: "Test Result:" }));
        p.appendChild(document.createTextNode(" "));
        p.appendChild(createEl("span", { className: "text-red-600", text: pageResponse.error || "Request failed" }));
        mount(p);
      }

      const verificationCookies = await browser.cookies.getAll({
        url: testUrl,
      });

      if (verificationCookies.length > 0) {
        mountParagraph([
          createEl("strong", { text: `Cookies in browser for ${tabUrl.hostname}:` }),
        ]);
        const list = createEl("ul", { className: "text-sm" });
        for (const cookie of verificationCookies) {
          const isImportant =
            cookie.name.includes("cf_clearance") ||
            cookie.name.includes("session") ||
            cookie.name.includes("auth");
          const li = createEl("li", {
            className: isImportant ? "text-blue-600" : "text-gray-600",
            text: `• ${cookie.name} = ${cookie.value.substring(0, 20)}...`,
          });
          list.appendChild(li);
        }
        mount(list);
      } else {
        mountParagraph([`No cookies found in browser for ${tabUrl.hostname}`], "text-orange-600");
      }
    } catch (testError) {
      const p = createEl("p");
      p.appendChild(createEl("strong", { text: "Test Request Failed:" }));
      p.appendChild(document.createTextNode(" "));
      p.appendChild(createEl("span", { className: "text-red-600", text: testError.message }));
      mount(p);
    }
  } catch (error) {
    console.error("[MRM Settings] Cookie test error:", error);
    testResult.textContent = `Test failed: ${error.message}`;
  } finally {
    testBtn.textContent = "Test Cookies";
    testBtn.disabled = false;
  }
}


async function clearTestCookies() {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = tabs[0];
    const tabUrl = new URL(activeTab.url);

    // Get all cookies for the current domain
    const cookies = await browser.cookies.getAll({
      url: activeTab.url,
    });

    if (cookies.length === 0) {
      alert("No cookies found to clear for this domain.");
      return;
    }

    if (confirm(`Clear ${cookies.length} cookies for ${tabUrl.hostname}?`)) {
      let cleared = 0;
      for (const cookie of cookies) {
        try {
          await browser.cookies.remove({
            url: activeTab.url,
            name: cookie.name,
            storeId: cookie.storeId,
          });
          cleared++;
        } catch (error) {
          console.error(`Failed to clear cookie ${cookie.name}:`, error);
        }
      }
      alert(`Cleared ${cleared} cookies for ${tabUrl.hostname}`);
    }
  } catch (error) {
    console.error("Error clearing cookies:", error);
    alert("Failed to clear cookies: " + error.message);
  }
}

async function resetSettings() {
  if (
    confirm(
      "Are you sure you want to reset all settings to default? This will delete all cookies and reset all preferences."
    )
  ) {
    settings = buildDefaultSettings();
    updateUI();
    await saveSettings();
    await appendDebugLog?.("SETTINGS", "info", "Settings reset to defaults");
    alert("Settings have been reset to default values.");
  }
}

async function handleSave() {
  const saveBtn = document.getElementById("saveBtn");
  const originalText = saveBtn.textContent;

  try {
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    await saveSettings();
    await appendDebugLog?.("SETTINGS", "info", "Settings saved");

    saveBtn.textContent = "Saved!";
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 1500);
  } catch (error) {
    console.error("[MRM Settings] Save error:", error);
    saveBtn.textContent = "Error";
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 2000);
  }
}

function goBack() {
  // Navigate back to popup
  window.location.href = "popup.html";
}

function handleCookieSourceChange() {
  const isAuto = document.getElementById("cookieSourceAuto").checked;
  const isCustom = document.getElementById("cookieSourceCustom").checked;

  if (isAuto) {
    settings.cookieSource = "auto";
    document.getElementById("simpleCookieInput").style.display = "none";
    document.getElementById("autoRetrievedCookies").style.display = "block";
    document.getElementById("addCookieBtn").style.display = "none";
    autoRetrieveCookies();
  } else if (isCustom) {
    settings.cookieSource = "custom";
    document.getElementById("simpleCookieInput").style.display = "block";
    document.getElementById("autoRetrievedCookies").style.display = "none";
    document.getElementById("addCookieBtn").style.display = "inline-block";
  }

  renderCookieList();
}

async function autoRetrieveCookies() {
  try {
    const refreshBtn = document.getElementById("refreshCookiesBtn");
    const autoRetrieveBtn = document.getElementById("autoRetrieveCookiesBtn");

    // Show loading state
    if (refreshBtn) refreshBtn.textContent = "Loading...";
    if (autoRetrieveBtn) autoRetrieveBtn.textContent = "Loading...";

    // Function to get the Partition Key from the URL
    function getPartitionKeyFromUrl(url) {
      const origin = new URL(url).origin;
      return { topLevelSite: origin };
    }

    // Get the active tab's URL and storeId
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const activeTab = tabs[0];
    const tabUrl = activeTab.url;
    const tabCookieStoreId = activeTab.cookieStoreId;
    const partitionKey = getPartitionKeyFromUrl(tabUrl);

    // Use the tab's URL and the extracted Partition Key to get cookies
    const cookies = await browser.cookies.getAll({
      url: tabUrl,
      storeId: tabCookieStoreId,
      partitionKey: partitionKey,
    });

    // Store the auto-retrieved cookies
    settings.autoRetrievedCookies = cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      partitionKey: cookie.partitionKey,
    }));

    renderAutoRetrievedCookies();

    console.log(
      `[MRM Settings] Auto-retrieved ${cookies.length} cookies from current tab`
    );
  } catch (error) {
    console.error("[MRM Settings] Error auto-retrieving cookies:", error);
    alert(
      "Failed to retrieve cookies from current tab. Make sure you're on the target website."
    );
  } finally {
    // Reset button text
    const refreshBtn = document.getElementById("refreshCookiesBtn");
    const autoRetrieveBtn = document.getElementById("autoRetrieveCookiesBtn");
    if (refreshBtn) refreshBtn.textContent = "Refresh";
    if (autoRetrieveBtn) autoRetrieveBtn.textContent = "Auto Retrieve";
  }
}


function renderAutoRetrievedCookies() {
  const autoRetrievedList = document.getElementById("autoRetrievedList");
  clearChildren(autoRetrievedList);

  if (!settings.autoRetrievedCookies || settings.autoRetrievedCookies.length === 0) {
    autoRetrievedList.appendChild(createEl("p", {
      className: "text-sm text-gray-500",
      text: "No cookies found. Make sure you're on the target website."
    }));
    return;
  }

  settings.autoRetrievedCookies.forEach((cookie) => {
    const domain = cookie.domain || "Current domain";
    const isImportant = cookie.name.includes("cf_clearance") || cookie.name.includes("session") || cookie.name.includes("auth");
    const bgColor = isImportant ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200";

    const row = createEl("div", { className: `flex items-center justify-between p-2 border ${bgColor} rounded text-sm` });
    const body = createEl("div", { className: "flex-1 min-w-0" });
    const top = createEl("div", { className: "flex items-center space-x-2" });
    top.appendChild(createEl("span", { className: "font-medium", text: cookie.name }));
    top.appendChild(createEl("span", { className: "text-xs text-gray-500", text: domain }));
    body.appendChild(top);
    body.appendChild(createEl("p", {
      className: "text-xs text-gray-600 truncate",
      text: `${(cookie.value || "").substring(0, 50)}${(cookie.value || "").length > 50 ? "..." : ""}`
    }));
    row.appendChild(body);
    if (isImportant) {
      row.appendChild(createEl("span", { className: "text-blue-600 text-xs ml-2", text: "Important" }));
    }
    autoRetrievedList.appendChild(row);
  });
}

function parseCookieString() {
  const cookieString = document
    .getElementById("cookieStringTextarea")
    .value.trim();

  if (!cookieString) {
    alert("Please enter a cookie string.");
    return;
  }

  try {
    // Parse the cookie string
    const cookiePairs = cookieString
      .split(";")
      .map((pair) => pair.trim())
      .filter((pair) => pair);
    const parsedCookies = [];

    for (const pair of cookiePairs) {
      const [name, ...valueParts] = pair.split("=");
      if (name && valueParts.length > 0) {
        const value = valueParts.join("="); // In case value contains '='
        parsedCookies.push({
          name: name.trim(),
          value: value.trim(),
          domain: null,
          path: "/",
          secure: false,
          httpOnly: false,
        });
      }
    }

    if (parsedCookies.length === 0) {
      alert("No valid cookies found in the string. Please check the format.");
      return;
    }

    // Replace existing custom cookies
    settings.cookies = parsedCookies;

    // Clear the textarea
    document.getElementById("cookieStringTextarea").value = "";

    // Update UI
    renderCookieList();

    alert(`Successfully parsed ${parsedCookies.length} cookies.`);
  } catch (error) {
    console.error("[MRM Settings] Error parsing cookie string:", error);
    alert("Failed to parse cookie string. Please check the format.");
  }
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// Export settings for use in other scripts
window.MRMSettings = {
  getSettings: async function () {
    await loadSettings();
    return settings;
  },

  getCookieHeader: function () {
    if (!settings.useCookies) {
      return null;
    }

    let cookiesToUse = [];

    if (
      settings.cookieSource === "auto" &&
      settings.autoRetrievedCookies.length > 0
    ) {
      cookiesToUse = settings.autoRetrievedCookies;
    } else if (
      settings.cookieSource === "custom" &&
      settings.cookies.length > 0
    ) {
      cookiesToUse = settings.cookies;
    }

    if (cookiesToUse.length === 0) {
      return null;
    }

    return cookiesToUse
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  },
};

function buildSettingsSectionNav() {
  const nav = document.getElementById("settingsSectionNav");
  if (!nav) return;
  const titles = Array.from(document.querySelectorAll("[data-section-title]"));
  nav.replaceChildren();
  titles.forEach((titleEl) => {
    const card = titleEl.closest(".mrm-card");
    if (!card.id) card.id = `section-${titleEl.dataset.sectionTitle}`;
    const a = document.createElement("a");
    a.href = `#${card.id}`;
    a.textContent = titleEl.textContent.trim();
    nav.appendChild(a);
  });
}

function setupSettingsSearch() {
  const input = document.getElementById("settingsSearchInput");
  if (!input) return;
  input.addEventListener("input", () => {
    const query = String(input.value || "").trim().toLowerCase();
    document.querySelectorAll(".mrm-card").forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.classList.toggle("is-filter-hidden", !!query && !text.includes(query));
    });
  });
}

async function applyAndroidPreset() {
  settings = {
    ...settings,
    compactMobileUi: true,
    androidBackgroundTabFix: true,
    queueAutoStartEnabled: true,
    queueConcurrency: 1,
    queuePerHostConcurrency: 1,
    androidSafeMode: true,
    retryCount: 3,
    timeout: 30,
  };
  updateUI();
  await saveSettings();
  showToast("Android preset applied.", "success");
}

function setupSettingsEnhancements() {
  buildSettingsSectionNav();
  setupSettingsSearch();
  document.getElementById("applyAndroidPresetBtn")?.addEventListener("click", applyAndroidPreset);
  document.getElementById("expandAllSettingsBtn")?.addEventListener("click", () => {
    document.querySelectorAll("details").forEach((node) => { node.open = true; });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(setupSettingsEnhancements, 0);
});


function bindPageFeedbackSettings() {
  const pageToastToggle = document.getElementById("pageToastEnabledToggle");
  const queueOverlayToggle = document.getElementById("minimalQueueOverlayToggle");
  const queueOverlayActiveOnlyToggle = document.getElementById("minimalQueueOverlayActiveOnlyToggle");

  if (pageToastToggle) {
    pageToastToggle.checked = settings.pageToastEnabled !== false;
    pageToastToggle.addEventListener("change", () => {
      settings.pageToastEnabled = !!pageToastToggle.checked;
      saveSettings();
    });
  }

  if (queueOverlayToggle) {
    queueOverlayToggle.checked = settings.minimalQueueOverlay !== false;
    queueOverlayToggle.addEventListener("change", () => {
      settings.minimalQueueOverlay = !!queueOverlayToggle.checked;
      saveSettings();
    });
  }

  if (queueOverlayActiveOnlyToggle) {
    queueOverlayActiveOnlyToggle.checked = !!settings.minimalQueueOverlayActiveOnly;
    queueOverlayActiveOnlyToggle.addEventListener("change", () => {
      settings.minimalQueueOverlayActiveOnly = !!queueOverlayActiveOnlyToggle.checked;
      saveSettings();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(bindPageFeedbackSettings, 0);
});
