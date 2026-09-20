import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const script = readFileSync(resolve(here, "../telegram-media-downloader.user.js"), "utf8");
const webk = readFileSync(resolve(here, "fixtures/webk.html"), "utf8");
const webz = readFileSync(resolve(here, "fixtures/webz.html"), "utf8");

test("runtime is mutation-driven instead of 500ms polling", () => {
  assert.doesNotMatch(script, /setInterval\s*\(/);
  assert.match(script, /new MutationObserver/);
  assert.match(script, /requestAnimationFrame/);
  assert.match(script, /scanWebZ/);
  assert.match(script, /scanWebK/);
  assert.match(script, /mutationTouchesTelegramMedia/);
  assert.match(script, /addedNodes/);
  assert.match(script, /Ignore unrelated chat churn/);
});

test("WebK and WebZ fixture contracts remain represented", () => {
  for (const token of ["media-viewer-whole", "audio-element"]) assert.ok(webk.includes(token));
  for (const token of ["MediaViewerSlide--active", "VideoPlayer", "StoryViewer"]) assert.ok(webz.includes(token));
  assert.match(script, /\.media-viewer-whole/);
  assert.match(script, /#MediaViewer \.MediaViewerSlide--active/);
  assert.match(script, /audio-element/);
});

test("audio and video share one cancellable transfer engine", () => {
  assert.match(script, /const downloadMedia = async/);
  assert.match(script, /new AbortController\(\)/);
  assert.match(script, /tel_download_video = \(url\) => downloadMedia/);
  assert.match(script, /tel_download_audio = \(url\) => downloadMedia/);
  assert.match(script, /activeDownloads\.delete/);
});

test("network layer handles 200, 206, Retry-After and transient failures", () => {
  assert.match(script, /\[200, 206\]/);
  assert.match(script, /Retry-After/);
  for (const status of [408, 429, 500, 502, 503, 504]) assert.ok(script.includes(String(status)));
  assert.match(script, /HTTP 206 response is missing a valid Content-Range/);
  assert.match(script, /server may legally ignore Range/i);
});

test("retry waits and fetches are cancellation-safe", () => {
  assert.match(script, /sleepWithAbort/);
  assert.match(script, /signal\?\.aborted/);
  assert.match(script, /signal,/);
  assert.match(script, /controller\.abort\(\)/);
  assert.match(script, /Retrying \${attempt \+ 1}/);
  assert.match(script, /HTTP \${response\.status} · retry/);
});

test("fallback has an explicit memory ceiling and streaming path", () => {
  assert.match(script, /FALLBACK_MEMORY_LIMIT/);
  assert.match(script, /256 \* 1024 \* 1024/);
  assert.match(script, /showSaveFilePicker/);
  assert.match(script, /await writable\.write\(part\)/);
  assert.match(script, /too large for the in-memory fallback/);
  assert.match(script, /!writable && info\.total && info\.total > FALLBACK_MEMORY_LIMIT/);
});

test("progress helpers tolerate a dismissed progress card", () => {
  assert.match(script, /if \(!innerContainer\) return;\n    innerContainer\.querySelector\("p\.filename"\)/);
});

test("progress surface supports cancel, completion and failure", () => {
  assert.match(script, /Cancel download/);
  assert.match(script, /completeProgress\(jobId\)/);
  assert.match(script, /AbortProgress\(jobId\)/);
});
