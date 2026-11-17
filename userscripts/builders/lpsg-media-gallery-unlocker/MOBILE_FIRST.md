# LPSG Media Gallery Unlocker — consolidated mobile-first v6.8.0

This is one staged source overhaul for `Mikeyphw/scriptexts`. Source stays in the numbered modules of `userscripts/builders/lpsg-media-gallery-unlocker/src/`; the standalone `.user.js` and `.meta.js` are generated, not edited independently.

## Interaction and navigation

- Normal mobile card taps open the lightbox, even when the gallery auto-selected all detected media for ZIP. Explicit selection mode, long-press, and horizontal drag-to-select change the selection.
- Bottom navigation exposes Gallery, Search, Selection, Downloads, and More for one-handed use. Mobile search is a real modal with search, type, page, sort, favorites, recent items, and clear controls. Search and Downloads sheets do not overlap.
- Pinch/pan supports continuous 1–4× image zoom with bounded translations, double-tap zoom and swipe navigation when unzoomed. It does not interfere with native video controls; the prior mobile pinch handler is disabled so two zoom implementations cannot fight.
- The adaptive grid uses card-size settings and browser width, adds 120/240-item mobile rendering batches with automatic/manual load-more, and handles landscape, touch targets, keyboard focus, and reduced motion.

## Media organization and privacy

- Per-thread favorites, session-only recent items, and explicit per-thread Save/Restore selection operations. Session-only favorites mode prevents favorites from being written to persistent browser storage.
- Clear thread history removes favorites, saved selection, and recovery metadata without touching unrelated browser settings. History cannot be cleared during an active ZIP write.
- Recovery checkpoint retention is configurable to 1/7/30 days; records are bounded and schema-checked. Media source URLs and credentials are not stored in the newly introduced per-item recovery receipt.
- Data saver respects browser Save-Data as a default, limits concurrency and video previews, disables lightbox autoplay, and avoids non-user-requested duration probes while hidden or in data-saving mode.

## Scanning, ZIP, sharing

- Scan current page, last five discovered pages, uncached/revalidating pages, or the whole thread. User-requested scans estimated above 40 pages ask for confirmation. The original full-thread automatic scan behavior is retained.
- ZIP progress shows processed items, archived bytes and failure count. Recovery checkpoints store bounded per-item statuses and finalized ZIP-part names. Recently generated ZIP parts expose an explicit download-again link while the associated temporary blob URL remains valid.
- **Download-triggered is not file-saved.** Users can explicitly confirm saved parts, retry unconfirmed media, or retry all. After a reload the UI can rebuild missing ZIP parts from available media/cache, but cannot resume an open ZIP writer or recover a revoked blob URL.
- `Share link` invokes native Web Share URL sharing where supported. `Prepare file` performs a bounded streaming fetch (24 MiB cap); a **separate user tap** to `Share file` preserves the transient user activation required for native file sharing. Unsupported browser/file combinations fall back to regular downloads or link sharing. Media contents are not persisted by the new share feature.

## Packaging and acceptance

The staging `.pyz` verifies every bundled asset, validates JavaScript syntax, runs an isolated executable VM smoke, checks the exact target source blob preimages, assembles the numbered modules and launches the **native Devtool v3.1+** builder. Devtool exclusively owns source-bound overlay scaffold, static validation, atomic commit, durable session, approved push/PR and required CI observation. The staging helper does not implement an alternative apply engine. It is intentionally *not pinned to a historical Devtool commit*: it fetches canonical `Mikeyphw/devtool` `main` at execution and requires compatible v3.1+, while the immutable native package records its own exact-source integrity contract.

The following are NOT release claims until executed on the target machine: full LPSG node test suite and generated release seal, Devtool native overlay validation/apply, GitHub hosted checks at exact PR HEAD, Firefox Android / Violentmonkey device behavior and actual OS file saves. A userscript cannot guarantee continued execution after Android suspends or terminates its browser process.

## Audit 5: native package reuse and read-only preflight

The standalone `.pyz` is a **verified staging helper**, not an already-built native
Devtool package. On a clean feature worktree it executes the repository's
original LPSG preview checks, builds the **native Devtool v3.1+ immutable** `.pyz`
with the canonical builder, and delegates read-only `check` or authorized `apply`.
If `check` is invoked from `main`, it refuses without creating a Git branch;
`apply` may create a separate feature worktree. An already-built native package
is re-attested against all 14 staged payload bytes, actions and preimages before
reuse; older immutable packages are never silently rewritten or repinned.

Native package reuse also requires its unchanged SHA-256 construction receipt.
If native CI exits with a non-green status, the wrapper preserves the actual exit
code; resume the native durable delivery session instead of applying twice.

Intermediate per-file ZIP results are checkpointed in batches to limit repeated
localStorage JSON serialization; completed part results are always committed
synchronously. OS download-save confirmation remains manual.
