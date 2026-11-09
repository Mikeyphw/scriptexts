# CB-NX01 — exact-file Android Cinderbox bridge

Cinderbox can open a Nexus Stardew mod URL containing `tab=files`,
`cinderbox_file`, `cinderbox_mode=nxm`, and a one-time `cinderbox_request`.
The content script requires a manager action for that **exact file ID**;
missing, ambiguous or mismatched results are refused rather than replaced
by the main/latest file. An extension-side banner explains when Nexus login,
confirmation or the Android external-app prompt needs user interaction.

A browser-created NXM tab only proves **handoff attempted**. It is not proof
that Cinderbox accepted or downloaded the archive. No browser cookies/API keys
are passed to Cinderbox. The standalone browser queue remains available.

Node contracts: `node --test tools/tests/cbnx01-handoff.test.mjs`.
Live Firefox for Android + Nexus account + Cinderbox acceptance is still
required before claiming end-to-end support.

## Q01 HF03 — Iceraven dynamic file-action fallback (0.4.8)

The exact-link detector may find no matching anchor on the 2026 dynamic Nexus Files UI. In that case the handoff banner offers an **explicit, user-clicked Nexus HTTPS manager-action link** for the same mod/file ID. It does not create, forge, or bypass an NXM authorization token, impersonate a user, capture credentials, or silently choose a different file. If the Nexus UI cannot provide that file for Mod Manager download, qualification remains blocked. The Retry button re-arms the full bounded detection window. Live Iceraven device evidence is still required.
