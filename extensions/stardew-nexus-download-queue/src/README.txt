# Stardew Nexus Queue

Firefox extension for Nexus Mods Stardew Valley pages.

## Features
- Queue manual downloads from listing pages and mod pages
- Optional Vortex queue items
- Popup queue manager
- Stardew-only site scope
- Listing buttons with icon or text+icon modes

## Load in Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from this folder

## Notes
- Manual downloads are queued through the browser downloads API.
- Vortex/NMM items are launched when they reach the front of the queue.
- The extension only runs on `https://www.nexusmods.com/stardewvalley/*`.
