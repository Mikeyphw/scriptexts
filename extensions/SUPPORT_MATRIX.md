# Extension browser support

| Extension | Firefox / Firefox Android | Chromium MV3 |
|---|---|---|
| Telegram Media Downloader | Supported | Supported |
| Stardew Nexus Download Queue | Supported | Supported |
| Manga Site Media Downloader | Supported | Not packaged |

The Manga extension intentionally remains Firefox-only because its image pipeline depends on blocking `webRequest` request/response header rewriting, including per-request CORS response headers. Chromium MV3 does not provide an equivalent safe general-purpose blocking response-header API for this behavior. The release seal fails if a Chromium package is emitted for Manga until that feature is redesigned rather than silently degraded.
