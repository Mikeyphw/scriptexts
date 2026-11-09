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
