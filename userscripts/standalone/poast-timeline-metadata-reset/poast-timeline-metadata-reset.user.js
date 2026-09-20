// ==UserScript==
// @name         Poast Timeline Metadata Reset
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/poast-timeline-metadata-reset
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/standalone/poast-timeline-metadata-reset
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/poast-timeline-metadata-reset/poast-timeline-metadata-reset.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/poast-timeline-metadata-reset/poast-timeline-metadata-reset.user.js
// @version      1.0.0
// @description  Lightweight one-shot reset for broken injected Poast CSS, plus safe timeline card metadata spacing polish.
// @match        *://nitter.poast.org/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const STYLE_ID = 'cc-poast-reset-timeline-style';

  const BAD_STYLE_MARKERS = [
    '.timeline-container{float:right;width:68%!important}',
    '.profile-tabs{width:100vw;max-width:600px}',
    '.profile-tab{box-sizing:border-box;font-size:14px;text-align:left;vertical-align:top;max-width:32%}',
    '.profile-banner,.profile-banner>a,.profile-banner>a>img{display:block!important}'
  ];

  const css = `:root {
  --cc-bg: #06090f;
  --cc-bg-2: #0a0f18;
  --cc-border: rgba(255,255,255,.08);
  --cc-border-2: rgba(255,255,255,.06);
  --cc-text: #eef4ff;
  --cc-muted: #99a8bc;
  --cc-accent: #5d92ff;
  --cc-shadow: 0 10px 24px rgba(0,0,0,.14);
  --cc-radius-xl: 20px;
  --cc-radius-lg: 16px;
  --cc-radius-md: 12px;
  --cc-gap: 18px;
  --cc-top-offset: 56px;
  --cc-rail-width: 380px;
  --cc-card-bg: #0d1522;
  --cc-card-bg-2: #101a2b;
  --cc-card-gap: 12px;
  --cc-avatar: 42px;
}

html, body {
  background:
    radial-gradient(circle at top left, rgba(61,102,179,.12), transparent 22%),
    radial-gradient(circle at top right, rgba(36,61,108,.08), transparent 22%),
    linear-gradient(180deg, var(--cc-bg), var(--cc-bg-2)) !important;
}

body {
  color: var(--cc-text);
}

a {
  text-decoration: none;
}

/* one-shot layout reset */
body > .container {
  display: block !important;
  width: min(1520px, calc(100% - 20px)) !important;
  max-width: none !important;
  margin-inline: auto !important;
  padding-top: 0 !important;
}

.container > .profile-tabs {
  float: none !important;
  width: auto !important;
  max-width: none !important;
  display: grid !important;
  grid-template-columns: minmax(340px, var(--cc-rail-width)) minmax(0, 1fr) !important;
  gap: var(--cc-gap) !important;
  align-items: start !important;
}

.container > .profile-tabs > .profile-tab {
  width: auto !important;
  max-width: none !important;
  float: none !important;
  padding: 0 !important;
}

.container > .profile-tabs > .profile-tab.sticky {
  grid-column: 1 !important;
  position: sticky !important;
  top: calc(var(--cc-top-offset) + 12px) !important;
  align-self: start !important;
  display: grid !important;
  gap: 12px !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.container > .profile-tabs > .profile-tab.sticky > * {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.container > .profile-tabs > .timeline-container {
  grid-column: 2 !important;
  float: none !important;
  width: auto !important;
  max-width: none !important;
  min-width: 0 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  position: relative !important;
}

/* header */
.top-nav,
nav,
.navbar {
  position: sticky !important;
  top: 0 !important;
  z-index: 120 !important;
  background: rgba(8,11,18,.94) !important;
  backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid var(--cc-border) !important;
  box-shadow: 0 8px 24px rgba(0,0,0,.16) !important;
}

.top-nav .container,
nav .container,
.navbar .container {
  min-height: 56px !important;
}

.top-nav a,
nav a,
.navbar a {
  color: var(--cc-text) !important;
}

/* banner */
.container > .profile-tabs > .profile-banner {
  grid-column: 1 / -1 !important;
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 0 12px !important;
  overflow: hidden !important;
  border-radius: var(--cc-radius-xl) !important;
  background: rgba(255,255,255,.02) !important;
  box-shadow: 0 12px 28px rgba(0,0,0,.18) !important;
  float: none !important;
  clear: both !important;
}

.container > .profile-tabs > .profile-banner > a,
.container > .profile-tabs > .profile-banner > a > img {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
}

.container > .profile-tabs > .profile-banner > a > img {
  height: auto !important;
  object-fit: cover !important;
  object-position: center !important;
  margin: 0 !important;
  transform: none !important;
}

/* rail cards */
.profile-card,
.photo-rail-card {
  width: 100% !important;
  max-width: 100% !important;
  background: linear-gradient(180deg, rgba(13,21,34,.98), rgba(13,21,34,.94)) !important;
  border: 1px solid var(--cc-border) !important;
  border-radius: var(--cc-radius-xl) !important;
  box-shadow: 0 12px 28px rgba(0,0,0,.18) !important;
  overflow: hidden !important;
}

.photo-rail-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 6px !important;
  padding: 10px !important;
}

.photo-rail-grid a,
.photo-rail-grid img {
  display: block !important;
  width: 100% !important;
}

.photo-rail-grid img {
  aspect-ratio: 1 !important;
  object-fit: cover !important;
  border-radius: 10px !important;
}

/* actual tabs */
.timeline-container > ul.tab {
  position: sticky !important;
  top: calc(var(--cc-top-offset) + 12px) !important;
  z-index: 100 !important;
  display: flex !important;
  gap: 6px !important;
  list-style: none !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  padding: 8px !important;
  margin: 0 0 14px !important;
  background: rgba(11,17,28,.88) !important;
  border: 1px solid var(--cc-border) !important;
  border-radius: var(--cc-radius-lg) !important;
  box-shadow: 0 12px 28px rgba(0,0,0,.18) !important;
  scrollbar-width: none !important;
}

.timeline-container > ul.tab::-webkit-scrollbar {
  display: none !important;
}

.timeline-container > ul.tab > li.tab-item {
  list-style: none !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.timeline-container > ul.tab > li.tab-item > a {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 36px !important;
  padding: 0 14px !important;
  border-radius: 999px !important;
  color: var(--cc-muted) !important;
  background: transparent !important;
  border: 0 !important;
  outline: 0 !important;
  box-shadow: none !important;
  white-space: nowrap !important;
}

.timeline-container > ul.tab > li.tab-item::before,
.timeline-container > ul.tab > li.tab-item::after,
.timeline-container > ul.tab > li.tab-item > a::before,
.timeline-container > ul.tab > li.tab-item > a::after {
  content: none !important;
  display: none !important;
}

.timeline-container > ul.tab > li.tab-item.active > a,
.timeline-container > ul.tab > li.tab-item > a[aria-current="page"] {
  color: var(--cc-text) !important;
  background: rgba(93,146,255,.14) !important;
  border-radius: 999px !important;
  border: 0 !important;
  outline: 0 !important;
  box-shadow: inset 0 0 0 1px rgba(93,146,255,.20) !important;
}

/* timeline metadata spacing */
.timeline-item,
.timeline-item * {
  box-sizing: border-box !important;
  min-width: 0 !important;
}

.timeline-item {
  float: none !important;
  width: auto !important;
  max-width: 100% !important;
  transform: none !important;
  filter: none !important;
}

.timeline > .timeline-item,
.thread > .timeline-item {
  background: linear-gradient(180deg, var(--cc-card-bg), var(--cc-card-bg-2)) !important;
  border: 1px solid var(--cc-border) !important;
  border-radius: var(--cc-radius-xl) !important;
  box-shadow: var(--cc-shadow) !important;
  overflow: hidden !important;
  margin-bottom: 14px !important;
}

.timeline-item > .tweet-body {
  display: grid !important;
  gap: var(--cc-card-gap) !important;
  padding: 14px !important;
}

.timeline-item .retweet-header,
.timeline-item .retweet-text,
.timeline-item .tweet-pre-header,
.timeline-item .pinned {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
  color: var(--cc-muted) !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
  margin: 0 !important;
}

.timeline-item .retweet-header a,
.timeline-item .retweet-text a {
  color: var(--cc-muted) !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

.timeline-item .tweet-header {
  display: grid !important;
  grid-template-columns: auto minmax(0, 1fr) auto !important;
  gap: 10px !important;
  align-items: start !important;
  margin: 0 !important;
}

.timeline-item .tweet-avatar {
  width: var(--cc-avatar) !important;
  height: var(--cc-avatar) !important;
  min-width: var(--cc-avatar) !important;
  min-height: var(--cc-avatar) !important;
  border-radius: 999px !important;
  overflow: hidden !important;
  align-self: start !important;
}

.timeline-item .tweet-avatar img,
.timeline-item img.avatar,
.timeline-item img.avatar.round {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
  border-radius: 999px !important;
}

.timeline-item .tweet-name-row,
.timeline-item .fullname-and-username {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
  min-width: 0 !important;
  line-height: 1.25 !important;
}

.timeline-item .fullname {
  color: var(--cc-text) !important;
  font-weight: 800 !important;
}

.timeline-item .username {
  color: var(--cc-muted) !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

.timeline-item .tweet-date,
.timeline-item .tweet-date a {
  color: var(--cc-muted) !important;
  white-space: nowrap !important;
  line-height: 1.25 !important;
}

.timeline-item .tweet-date {
  align-self: start !important;
  justify-self: end !important;
  margin: 0 !important;
}

.timeline-item .replying-to {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  flex-wrap: wrap !important;
  color: var(--cc-muted) !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
  margin: -2px 0 0 !important;
}

.timeline-item .replying-to a {
  color: var(--cc-muted) !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

.timeline-item .tweet-content,
.timeline-item .tweet-content.media-body {
  color: var(--cc-text) !important;
  line-height: 1.5 !important;
  margin: 0 !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

.timeline-item .tweet-content p,
.timeline-item .tweet-content.media-body p {
  margin: 0 !important;
}

.timeline-item .tweet-content a,
.timeline-item .tweet-content.media-body a {
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

.timeline-item .quote,
.timeline-item .quote-big {
  border: 1px solid var(--cc-border) !important;
  background: rgba(255,255,255,.02) !important;
  border-radius: var(--cc-radius-md) !important;
  padding: 10px 12px !important;
  margin: 0 !important;
}

.timeline-item .quote .tweet-content,
.timeline-item .quote-big .tweet-content,
.timeline-item .quote-text {
  margin-top: 6px !important;
}

.timeline-item .attachments {
  margin: 0 !important;
}

.timeline-item .attachments .gallery-row {
  gap: 6px !important;
}

.timeline-item .attachments .attachment,
.timeline-item .attachments .still-image,
.timeline-item .attachments img,
.timeline-item .attachments video {
  border-radius: 12px !important;
}

.timeline-item .tweet-stats {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 8px !important;
  padding-top: 10px !important;
  margin: 0 !important;
  border-top: 1px solid var(--cc-border-2) !important;
  color: var(--cc-muted) !important;
}

.timeline-item .tweet-stat {
  min-width: 0 !important;
  font-size: 12px !important;
}

.timeline-item .tweet-stat .icon-container {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  max-width: 100% !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.timeline > .timeline-item:hover,
.thread > .timeline-item:hover {
  transform: none !important;
  filter: none !important;
  box-shadow: var(--cc-shadow) !important;
}

@media (max-width: 980px) {
  body > .container {
    width: calc(100% - 12px) !important;
  }

  .container > .profile-tabs {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .container > .profile-tabs > .profile-banner,
  .container > .profile-tabs > .profile-tab.sticky,
  .container > .profile-tabs > .timeline-container {
    grid-column: 1 !important;
  }

  .container > .profile-tabs > .profile-tab.sticky {
    position: static !important;
  }

  .timeline-container > ul.tab {
    top: calc(var(--cc-top-offset) + 8px) !important;
    padding: 6px !important;
  }

  .timeline-container > ul.tab > li.tab-item > a {
    min-height: 34px !important;
    padding: 0 12px !important;
    font-size: 14px !important;
  }
}

@media (max-width: 760px) {
  :root {
    --cc-avatar: 36px;
  }

  body > .container {
    width: calc(100% - 8px) !important;
  }

  .profile-banner,
  .profile-card,
  .photo-rail-card,
  .timeline-container > ul.tab,
  .timeline > .timeline-item,
  .thread > .timeline-item {
    border-radius: 16px !important;
  }

  .timeline-container > ul.tab > li.tab-item > a {
    min-height: 32px !important;
    padding: 0 10px !important;
    font-size: 13px !important;
  }

  .photo-rail-grid {
    gap: 4px !important;
    padding: 8px !important;
  }

  .timeline-item > .tweet-body {
    padding: 12px !important;
    gap: 10px !important;
  }

  .timeline-item .tweet-header {
    grid-template-columns: auto minmax(0, 1fr) !important;
    grid-template-rows: auto auto !important;
  }

  .timeline-item .tweet-date {
    grid-column: 2 !important;
    justify-self: start !important;
    margin-top: -2px !important;
  }

  .timeline-item .tweet-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 480px) {
  .timeline-item > .tweet-body {
    padding: 10px !important;
  }

  .timeline-item .retweet-header,
  .timeline-item .retweet-text,
  .timeline-item .replying-to,
  .timeline-item .tweet-date,
  .timeline-item .tweet-date a {
    font-size: 12px !important;
  }
}


/* merged avatar fix */

:root {
  --cc-avatar-size: 42px;
}

/* restore real card avatar box */
.timeline-item .tweet-header .tweet-avatar,
.timeline-item .tweet-header a.tweet-avatar,
.timeline-item .tweet-header .tweet-avatar.round,
.timeline-item .tweet-header a.tweet-avatar.round {
  display: block !important;
  width: var(--cc-avatar-size) !important;
  height: var(--cc-avatar-size) !important;
  min-width: var(--cc-avatar-size) !important;
  min-height: var(--cc-avatar-size) !important;
  max-width: var(--cc-avatar-size) !important;
  max-height: var(--cc-avatar-size) !important;
  border-radius: 999px !important;
  overflow: hidden !important;
  align-self: start !important;
  flex: 0 0 auto !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* restore image inside avatar */
.timeline-item .tweet-header .tweet-avatar img,
.timeline-item .tweet-header a.tweet-avatar img,
.timeline-item .tweet-header img.avatar,
.timeline-item .tweet-header img.avatar.round {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 100% !important;
  min-height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  object-fit: cover !important;
  object-position: center !important;
  border-radius: 999px !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* keep header layout compatible with avatar present */
.timeline-item .tweet-header {
  display: grid !important;
  grid-template-columns: auto minmax(0, 1fr) auto !important;
  gap: 10px !important;
  align-items: start !important;
}

@media (max-width: 760px) {
  :root {
    --cc-avatar-size: 36px;
  }

  .timeline-item .tweet-header {
    grid-template-columns: auto minmax(0, 1fr) !important;
    grid-template-rows: auto auto !important;
  }

  .timeline-item .tweet-date {
    grid-column: 2 !important;
    justify-self: start !important;
  }
}

/* merged timeline media presentation */
.timeline-item .attachments {
  display: grid !important;
  gap: 8px !important;
  margin: 0 !important;
}

.timeline-item .attachments .gallery-row {
  display: grid !important;
  gap: 8px !important;
  margin: 0 !important;
}

.timeline-item .attachments.card,
.timeline-item .attachments .gallery-video,
.timeline-item .attachments .video-overlay,
.timeline-item .attachments .video-container {
  overflow: hidden !important;
  border-radius: var(--cc-radius-lg) !important;
}

.timeline-item .attachments .attachment,
.timeline-item .attachments a.still-image,
.timeline-item .attachments .gallery-video,
.timeline-item .attachments .video-container {
  display: block !important;
  overflow: hidden !important;
  border-radius: var(--cc-radius-lg) !important;
  background: rgba(255,255,255,.02) !important;
  border: 1px solid var(--cc-border-2) !important;
}

.timeline-item .attachments a.still-image,
.timeline-item .attachments .gallery-video,
.timeline-item .attachments .video-overlay,
.timeline-item .attachments .video-container {
  width: 100% !important;
  max-width: 100% !important;
}

.timeline-item .attachments img,
.timeline-item .attachments video {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  object-fit: contain !important;
  object-position: center !important;
  background: #000 !important;
}

.timeline-item .attachments .gallery-video video,
.timeline-item .attachments .video-container video {
  width: 100% !important;
  height: auto !important;
  object-fit: contain !important;
}

.timeline-item .attachments .gallery-row:has(.attachment:nth-child(2)) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

.timeline-item .attachments .gallery-row:has(.attachment:nth-child(3)) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

.timeline-item .attachments .gallery-row:has(.attachment:nth-child(4)) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

.timeline-item .attachments .attachment img,
.timeline-item .attachments .attachment video {
  border-radius: 0 !important;
}

.timeline-item .quote + .attachments,
.timeline-item .quote-big + .attachments,
.timeline-item .tweet-content + .attachments,
.timeline-item .tweet-content.media-body + .attachments,
.timeline-item .replying-to + .attachments {
  margin-top: 2px !important;
}

@media (max-width: 760px) {
  .timeline-item .attachments,
  .timeline-item .attachments .gallery-row {
    gap: 6px !important;
  }

  .timeline-item .attachments .attachment,
  .timeline-item .attachments a.still-image,
  .timeline-item .attachments .gallery-video,
  .timeline-item .attachments .video-container {
    border-radius: 12px !important;
  }
}

@media (max-width: 480px) {
  .timeline-item .attachments,
  .timeline-item .attachments .gallery-row {
    gap: 4px !important;
  }
}


/* merged sidebar profile card refinement */
.profile-card,
.photo-rail-card {
  background: linear-gradient(180deg, rgba(13,21,34,.98), rgba(13,21,34,.94)) !important;
  border: 1px solid var(--cc-border) !important;
  border-radius: var(--cc-radius-xl) !important;
  box-shadow: 0 12px 28px rgba(0,0,0,.18) !important;
  overflow: hidden !important;
}

.profile-card {
  padding: 14px !important;
  gap: 12px !important;
}

.profile-card,
.profile-card * {
  box-sizing: border-box !important;
  min-width: 0 !important;
}

.profile-card .profile-card-avatar {
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.04) !important;
}

.profile-card .profile-card-avatar img {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
}

.profile-card .profile-card-tabs-name,
.profile-card .profile-card-info,
.profile-card .profile-card-extra,
.profile-card .profile-card-extra-links {
  width: 100% !important;
  max-width: 100% !important;
}

.profile-card .profile-card-fullname {
  color: var(--cc-text) !important;
  font-weight: 800 !important;
  line-height: 1.12 !important;
  margin: 0 !important;
}

.profile-card .profile-card-username {
  color: var(--cc-muted) !important;
  line-height: 1.3 !important;
  margin-top: 2px !important;
}

.profile-card .profile-bio {
  color: var(--cc-text) !important;
  line-height: 1.48 !important;
  margin-top: 8px !important;
}

.profile-card .profile-location,
.profile-card .profile-website,
.profile-card .profile-joindate {
  color: var(--cc-muted) !important;
  line-height: 1.35 !important;
  margin-top: 6px !important;
}

.profile-card .profile-location a,
.profile-card .profile-website a,
.profile-card .profile-joindate a {
  color: var(--cc-text) !important;
}

.profile-card .profile-card-fullname,
.profile-card .profile-card-username,
.profile-card .profile-bio,
.profile-card .profile-location,
.profile-card .profile-website,
.profile-card .profile-joindate {
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

.profile-card .profile-card-extra-links {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 8px !important;
  margin-top: 12px !important;
}

.profile-card .profile-card-extra-links > a,
.profile-card .profile-card-extra-links > div,
.profile-card .profile-card-extra-links > span {
  display: grid !important;
  gap: 2px !important;
  align-content: center !important;
  min-height: 58px !important;
  padding: 10px 8px !important;
  background: rgba(255,255,255,.03) !important;
  border: 1px solid rgba(255,255,255,.06) !important;
  border-radius: 12px !important;
  text-align: center !important;
}

.profile-card .profile-card-extra-links strong,
.profile-card .profile-card-extra-links b,
.profile-card .profile-card-extra-links .stat-num {
  color: var(--cc-text) !important;
  font-weight: 800 !important;
}

.profile-card .profile-card-extra-links small,
.profile-card .profile-card-extra-links span,
.profile-card .profile-card-extra-links .stat-label {
  color: var(--cc-muted) !important;
}

/* if this instance exposes statlist instead */
.profile-card .profile-statlist {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 8px !important;
  margin-top: 12px !important;
}

.profile-card .profile-stat,
.profile-card .profile-statlist > * {
  display: grid !important;
  gap: 2px !important;
  align-content: center !important;
  min-height: 58px !important;
  padding: 10px 8px !important;
  background: rgba(255,255,255,.03) !important;
  border: 1px solid rgba(255,255,255,.06) !important;
  border-radius: 12px !important;
  text-align: center !important;
}

.profile-card .profile-stat strong,
.profile-card .profile-stat b,
.profile-card .profile-stat .stat-num {
  color: var(--cc-text) !important;
  font-weight: 800 !important;
}

.profile-card .profile-stat span,
.profile-card .profile-stat .stat-label {
  color: var(--cc-muted) !important;
}

/* photo rail refinement */
.photo-rail-card {
  padding: 0 !important;
}

.photo-rail-card .card-header,
.photo-rail-card .title,
.photo-rail-card h2,
.photo-rail-card h3 {
  color: var(--cc-text) !important;
}

.photo-rail-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 6px !important;
  padding: 10px !important;
}

.photo-rail-grid a {
  display: block !important;
  border-radius: 10px !important;
  overflow: hidden !important;
  background: rgba(255,255,255,.02) !important;
}

.photo-rail-grid img {
  display: block !important;
  width: 100% !important;
  aspect-ratio: 1 !important;
  object-fit: cover !important;
  border-radius: 10px !important;
}

@media (max-width: 760px) {
  .profile-card {
    padding: 12px !important;
  }

  .profile-card .profile-card-extra-links,
  .profile-card .profile-statlist {
    gap: 6px !important;
  }

  .photo-rail-grid {
    gap: 4px !important;
    padding: 8px !important;
  }
}


/* merged avatar + timeline stats + sidebar stat containment fix */

/* restore real card avatar anchor */
.timeline-item .tweet-header a.tweet-avatar,
.timeline-item .tweet-header .tweet-avatar {
  display: block !important;
  width: var(--cc-avatar) !important;
  height: var(--cc-avatar) !important;
  min-width: var(--cc-avatar) !important;
  min-height: var(--cc-avatar) !important;
  max-width: var(--cc-avatar) !important;
  max-height: var(--cc-avatar) !important;
  border-radius: 999px !important;
  overflow: hidden !important;
  align-self: start !important;
  justify-self: start !important;
  flex: 0 0 auto !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.timeline-item .tweet-header a.tweet-avatar img,
.timeline-item .tweet-header .tweet-avatar img,
.timeline-item .tweet-header img.avatar,
.timeline-item .tweet-header img.avatar.round {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 100% !important;
  min-height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  object-fit: cover !important;
  object-position: center !important;
  border-radius: 999px !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* tighter timeline stats spacing */
.timeline-item .tweet-stats {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: flex-start !important;
  gap: 14px !important;
  padding-top: 10px !important;
  margin: 0 !important;
  border-top: 1px solid var(--cc-border-2) !important;
}

.timeline-item .tweet-stat {
  flex: 0 1 auto !important;
  min-width: 0 !important;
}

.timeline-item .tweet-stat .icon-container {
  display: inline-flex !important;
  align-items: center !important;
  gap: 6px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* contain sidebar stats inside card */
.profile-card .profile-card-extra-links,
.profile-card .profile-statlist {
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

.profile-card .profile-card-extra-links {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

.profile-card .profile-card-extra-links > a,
.profile-card .profile-card-extra-links > div,
.profile-card .profile-card-extra-links > span,
.profile-card .profile-stat,
.profile-card .profile-statlist > * {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  overflow: hidden !important;
}

.profile-card .profile-card-extra-links strong,
.profile-card .profile-card-extra-links b,
.profile-card .profile-card-extra-links .stat-num,
.profile-card .profile-stat strong,
.profile-card .profile-stat b,
.profile-card .profile-stat .stat-num {
  display: block !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.profile-card .profile-card-extra-links small,
.profile-card .profile-card-extra-links span,
.profile-card .profile-card-extra-links .stat-label,
.profile-card .profile-stat span,
.profile-card .profile-stat .stat-label {
  display: block !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

@media (max-width: 760px) {
  .timeline-item .tweet-stats {
    gap: 10px !important;
  }
}


/* merged stronger avatar restore v2 */

/* ensure header always reserves an avatar column */
.timeline-item .tweet-header {
  display: grid !important;
  grid-template-columns: 42px minmax(0, 1fr) auto !important;
  gap: 10px !important;
  align-items: start !important;
}

.timeline-item .tweet-header > a.tweet-avatar,
.timeline-item .tweet-header > .tweet-avatar,
.timeline-item .tweet-header a.tweet-avatar,
.timeline-item .tweet-header .tweet-avatar {
  grid-column: 1 !important;
  grid-row: 1 / span 2 !important;
  display: block !important;
  position: relative !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  max-width: 42px !important;
  max-height: 42px !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  border-radius: 999px !important;
  visibility: visible !important;
  opacity: 1 !important;
  align-self: start !important;
  justify-self: start !important;
  flex: none !important;
  float: none !important;
  z-index: 1 !important;
}

.timeline-item .tweet-header > a.tweet-avatar[href],
.timeline-item .tweet-header a.tweet-avatar[href] {
  pointer-events: auto !important;
}

.timeline-item .tweet-header > a.tweet-avatar img,
.timeline-item .tweet-header > .tweet-avatar img,
.timeline-item .tweet-header a.tweet-avatar img,
.timeline-item .tweet-header .tweet-avatar img,
.timeline-item .tweet-header img.avatar,
.timeline-item .tweet-header img.avatar.round {
  display: block !important;
  position: static !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  max-width: 42px !important;
  max-height: 42px !important;
  margin: 0 !important;
  padding: 0 !important;
  object-fit: cover !important;
  object-position: center !important;
  border-radius: 999px !important;
  visibility: visible !important;
  opacity: 1 !important;
  background: transparent !important;
}

.timeline-item .tweet-header .tweet-name-row,
.timeline-item .tweet-header .fullname-and-username {
  grid-column: 2 !important;
  grid-row: 1 !important;
}

.timeline-item .tweet-header .tweet-date {
  grid-column: 3 !important;
  grid-row: 1 !important;
  justify-self: end !important;
}

@media (max-width: 760px) {
  .timeline-item .tweet-header {
    grid-template-columns: 36px minmax(0, 1fr) !important;
    grid-template-rows: auto auto !important;
  }

  .timeline-item .tweet-header > a.tweet-avatar,
  .timeline-item .tweet-header > .tweet-avatar,
  .timeline-item .tweet-header a.tweet-avatar,
  .timeline-item .tweet-header .tweet-avatar,
  .timeline-item .tweet-header > a.tweet-avatar img,
  .timeline-item .tweet-header > .tweet-avatar img,
  .timeline-item .tweet-header a.tweet-avatar img,
  .timeline-item .tweet-header .tweet-avatar img,
  .timeline-item .tweet-header img.avatar,
  .timeline-item .tweet-header img.avatar.round {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    min-height: 36px !important;
    max-width: 36px !important;
    max-height: 36px !important;
  }

  .timeline-item .tweet-header .tweet-name-row,
  .timeline-item .tweet-header .fullname-and-username {
    grid-column: 2 !important;
    grid-row: 1 !important;
  }

  .timeline-item .tweet-header .tweet-date {
    grid-column: 2 !important;
    grid-row: 2 !important;
    justify-self: start !important;
  }
}


/* merged bigger avatar pass */
:root {
  --cc-avatar: 52px !important;
}

.timeline-item .tweet-header {
  grid-template-columns: 52px minmax(0, 1fr) auto !important;
  gap: 12px !important;
  align-items: center !important;
}

.timeline-item .tweet-header > a.tweet-avatar,
.timeline-item .tweet-header > .tweet-avatar,
.timeline-item .tweet-header a.tweet-avatar,
.timeline-item .tweet-header .tweet-avatar {
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  min-height: 52px !important;
  max-width: 52px !important;
  max-height: 52px !important;
}

.timeline-item .tweet-header > a.tweet-avatar img,
.timeline-item .tweet-header > .tweet-avatar img,
.timeline-item .tweet-header a.tweet-avatar img,
.timeline-item .tweet-header .tweet-avatar img,
.timeline-item .tweet-header img.avatar,
.timeline-item .tweet-header img.avatar.round {
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  min-height: 52px !important;
  max-width: 52px !important;
  max-height: 52px !important;
}

.timeline-item .tweet-name-row,
.timeline-item .fullname-and-username {
  gap: 10px !important;
  line-height: 1.2 !important;
}

.timeline-item .tweet-date {
  align-self: center !important;
}

@media (max-width: 760px) {
  :root {
    --cc-avatar: 44px !important;
  }

  .timeline-item .tweet-header {
    grid-template-columns: 44px minmax(0, 1fr) !important;
    gap: 10px !important;
    align-items: start !important;
  }

  .timeline-item .tweet-header > a.tweet-avatar,
  .timeline-item .tweet-header > .tweet-avatar,
  .timeline-item .tweet-header a.tweet-avatar,
  .timeline-item .tweet-header .tweet-avatar,
  .timeline-item .tweet-header > a.tweet-avatar img,
  .timeline-item .tweet-header > .tweet-avatar img,
  .timeline-item .tweet-header a.tweet-avatar img,
  .timeline-item .tweet-header .tweet-avatar img,
  .timeline-item .tweet-header img.avatar,
  .timeline-item .tweet-header img.avatar.round {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    min-height: 44px !important;
    max-width: 44px !important;
    max-height: 44px !important;
  }
}


/* merged smaller banner + better card positions */
.container > .profile-tabs > .profile-banner {
  max-height: 290px !important;
}

.container > .profile-tabs > .profile-banner > a,
.container > .profile-tabs > .profile-banner > a > img {
  width: 100% !important;
  max-width: 100% !important;
}

.container > .profile-tabs > .profile-banner > a > img {
  max-height: 290px !important;
  object-fit: cover !important;
  object-position: center 24% !important;
}

.timeline-item > .tweet-body {
  gap: 10px !important;
  padding: 14px 16px !important;
}

.timeline-item .retweet-header,
.timeline-item .retweet-text,
.timeline-item .tweet-pre-header,
.timeline-item .pinned {
  margin-bottom: -2px !important;
}

.timeline-item .tweet-header {
  align-items: start !important;
}

.timeline-item .tweet-name-row,
.timeline-item .fullname-and-username {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  row-gap: 4px !important;
  flex-wrap: wrap !important;
}

.timeline-item .fullname {
  line-height: 1.15 !important;
}

.timeline-item .username {
  line-height: 1.2 !important;
}

.timeline-item .tweet-date,
.timeline-item .tweet-date a {
  line-height: 1.15 !important;
}

.timeline-item .replying-to {
  margin-top: -4px !important;
}

.timeline-item .tweet-content,
.timeline-item .tweet-content.media-body {
  margin-top: -1px !important;
  line-height: 1.46 !important;
}

.timeline-item .attachments {
  margin-top: 2px !important;
}

.timeline-item .attachments + .tweet-stats,
.timeline-item .tweet-content + .tweet-stats,
.timeline-item .quote + .tweet-stats,
.timeline-item .quote-big + .tweet-stats {
  margin-top: 2px !important;
}

.timeline-item .tweet-stats {
  gap: 12px !important;
  padding-top: 9px !important;
  align-items: center !important;
}

.timeline-item .tweet-stat {
  display: inline-flex !important;
  align-items: center !important;
}

.timeline-item .tweet-stat .icon-container {
  gap: 5px !important;
  line-height: 1 !important;
}

.timeline-item .quote,
.timeline-item .quote-big {
  margin-top: 2px !important;
}

@media (max-width: 980px) {
  .container > .profile-tabs > .profile-banner {
    max-height: 220px !important;
  }

  .container > .profile-tabs > .profile-banner > a > img {
    max-height: 220px !important;
    object-position: center 20% !important;
  }
}

@media (max-width: 760px) {
  .container > .profile-tabs > .profile-banner {
    max-height: 160px !important;
    border-radius: 16px !important;
  }

  .container > .profile-tabs > .profile-banner > a > img {
    max-height: 160px !important;
    object-position: center 18% !important;
  }

  .timeline-item > .tweet-body {
    padding: 12px 13px !important;
    gap: 9px !important;
  }

  .timeline-item .tweet-stats {
    gap: 10px !important;
    padding-top: 8px !important;
  }
}

@media (max-width: 480px) {
  .container > .profile-tabs > .profile-banner {
    max-height: 128px !important;
    border-radius: 14px !important;
  }

  .container > .profile-tabs > .profile-banner > a > img {
    max-height: 128px !important;
  }

  .timeline-item > .tweet-body {
    padding: 10px 11px !important;
  }

  .timeline-item .tweet-stats {
    gap: 8px !important;
  }
}


/* merged card alignment + rectangular image sizing fix */

/* make the whole header use the left avatar gutter properly */
.timeline-item .tweet-header {
  grid-template-columns: 52px minmax(0, 1fr) auto !important;
  column-gap: 12px !important;
  row-gap: 2px !important;
  align-items: start !important;
}

.timeline-item .tweet-header > a.tweet-avatar,
.timeline-item .tweet-header > .tweet-avatar,
.timeline-item .tweet-header a.tweet-avatar,
.timeline-item .tweet-header .tweet-avatar {
  grid-column: 1 !important;
  grid-row: 1 / span 2 !important;
  align-self: start !important;
  justify-self: start !important;
  margin-top: 1px !important;
}

.timeline-item .tweet-header .tweet-name-row,
.timeline-item .tweet-header .fullname-and-username {
  grid-column: 2 !important;
  grid-row: 1 !important;
  align-self: center !important;
  margin: 0 !important;
}

.timeline-item .tweet-header .tweet-date {
  grid-column: 3 !important;
  grid-row: 1 !important;
  align-self: center !important;
  justify-self: end !important;
  margin: 0 !important;
}

.timeline-item .retweet-header,
.timeline-item .retweet-text,
.timeline-item .tweet-pre-header,
.timeline-item .pinned {
  margin-bottom: -1px !important;
}

.timeline-item .replying-to,
.timeline-item .tweet-content,
.timeline-item .tweet-content.media-body,
.timeline-item .quote,
.timeline-item .quote-big,
.timeline-item .attachments,
.timeline-item .tweet-stats {
  margin-left: 0 !important;
}

/* stop portrait images from being shown inside square/contain black-bar frames */
.timeline-item .attachments,
.timeline-item .attachments.card,
.timeline-item .attachments .gallery-row,
.timeline-item .attachments .attachment,
.timeline-item .attachments a.still-image {
  background: transparent !important;
}

.timeline-item .attachments .attachment,
.timeline-item .attachments a.still-image,
.timeline-item .attachments .gallery-video,
.timeline-item .attachments .video-container {
  border-radius: var(--cc-radius-lg) !important;
  overflow: hidden !important;
  border: 1px solid var(--cc-border-2) !important;
}

/* images should fill their own natural rectangle instead of contain-with-bars */
.timeline-item .attachments img,
.timeline-item .attachments a.still-image img,
.timeline-item .attachments .attachment img {
  display: block !important;
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
  object-fit: cover !important;
  object-position: center !important;
  background: transparent !important;
}

/* videos can still use black background, but don't force square framing */
.timeline-item .attachments video,
.timeline-item .attachments .gallery-video video,
.timeline-item .attachments .video-container video {
  display: block !important;
  width: 100% !important;
  height: auto !important;
  max-width: 100% !important;
  object-fit: contain !important;
  object-position: center !important;
  background: #000 !important;
}

/* single-media posts should size by media naturally */
.timeline-item .attachments:not(:has(.gallery-row .attachment:nth-child(2))) .attachment,
.timeline-item .attachments:not(:has(.gallery-row .attachment:nth-child(2))) a.still-image,
.timeline-item .attachments:not(:has(.gallery-row .attachment:nth-child(2))) .gallery-video,
.timeline-item .attachments:not(:has(.gallery-row .attachment:nth-child(2))) .video-container {
  aspect-ratio: auto !important;
  min-height: 0 !important;
}

/* multi-image rows keep tidy gaps but no forced square tiles */
.timeline-item .attachments .gallery-row {
  gap: 8px !important;
  align-items: start !important;
}

.timeline-item .attachments .gallery-row .attachment {
  align-self: start !important;
}

/* make media sit closer to content like the screenshot target */
.timeline-item .tweet-content + .attachments,
.timeline-item .tweet-content.media-body + .attachments,
.timeline-item .replying-to + .tweet-content,
.timeline-item .replying-to + .tweet-content.media-body {
  margin-top: 0 !important;
}

@media (max-width: 760px) {
  .timeline-item .tweet-header {
    grid-template-columns: 44px minmax(0, 1fr) !important;
    row-gap: 2px !important;
  }

  .timeline-item .tweet-header > a.tweet-avatar,
  .timeline-item .tweet-header > .tweet-avatar,
  .timeline-item .tweet-header a.tweet-avatar,
  .timeline-item .tweet-header .tweet-avatar {
    grid-row: 1 / span 2 !important;
  }

  .timeline-item .tweet-header .tweet-name-row,
  .timeline-item .tweet-header .fullname-and-username {
    grid-column: 2 !important;
    grid-row: 1 !important;
  }

  .timeline-item .tweet-header .tweet-date {
    grid-column: 2 !important;
    grid-row: 2 !important;
    justify-self: start !important;
    align-self: start !important;
  }
}


/* merged real DOM card header + uncropped image fix */

/* real Poast card header structure:
   .tweet-header
     a.tweet-avatar
     .tweet-name-row
       .fullname-and-username
       .tweet-date
*/
.timeline-item .tweet-header {
  display: grid !important;
  grid-template-columns: 52px minmax(0, 1fr) !important;
  column-gap: 12px !important;
  row-gap: 0 !important;
  align-items: start !important;
}

.timeline-item .tweet-header > a.tweet-avatar,
.timeline-item .tweet-header > .tweet-avatar {
  grid-column: 1 !important;
  grid-row: 1 !important;
  display: block !important;
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  min-height: 52px !important;
  max-width: 52px !important;
  max-height: 52px !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 999px !important;
  overflow: hidden !important;
  align-self: start !important;
  justify-self: start !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.timeline-item .tweet-header > a.tweet-avatar img,
.timeline-item .tweet-header > .tweet-avatar img,
.timeline-item .tweet-header img.avatar,
.timeline-item .tweet-header img.avatar.round {
  display: block !important;
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  min-height: 52px !important;
  max-width: 52px !important;
  max-height: 52px !important;
  margin: 0 !important;
  object-fit: cover !important;
  object-position: center !important;
  border-radius: 999px !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.timeline-item .tweet-header > .tweet-name-row {
  grid-column: 2 !important;
  grid-row: 1 !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  column-gap: 10px !important;
  row-gap: 2px !important;
  align-items: start !important;
  min-width: 0 !important;
  margin: 0 !important;
}

.timeline-item .tweet-header > .tweet-name-row > .fullname-and-username {
  grid-column: 1 !important;
  grid-row: 1 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  row-gap: 4px !important;
  flex-wrap: wrap !important;
  min-width: 0 !important;
  margin: 0 !important;
}

.timeline-item .tweet-header > .tweet-name-row > .tweet-date {
  grid-column: 2 !important;
  grid-row: 1 !important;
  align-self: center !important;
  justify-self: end !important;
  white-space: nowrap !important;
  margin: 0 !important;
}

.timeline-item .fullname,
.timeline-item .username,
.timeline-item .tweet-date,
.timeline-item .tweet-date a {
  line-height: 1.15 !important;
}

/* uncropped image presentation: let card fit image instead of forcing fill */
.timeline-item .attachments,
.timeline-item .attachments.card,
.timeline-item .attachments .gallery-row,
.timeline-item .attachments .attachment,
.timeline-item .attachments a.still-image {
  background: transparent !important;
}

.timeline-item .attachments .attachment,
.timeline-item .attachments a.still-image,
.timeline-item .attachments .gallery-video,
.timeline-item .attachments .video-container,
.timeline-item .attachments .video-overlay {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
  border-radius: var(--cc-radius-lg) !important;
  border: 1px solid var(--cc-border-2) !important;
  background: transparent !important;
  aspect-ratio: auto !important;
  min-height: 0 !important;
  height: auto !important;
}

.timeline-item .attachments img,
.timeline-item .attachments a.still-image img,
.timeline-item .attachments .attachment img {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  object-fit: contain !important;
  object-position: center !important;
  background: transparent !important;
}

.timeline-item .attachments video,
.timeline-item .attachments .gallery-video video,
.timeline-item .attachments .video-container video {
  display: block !important;
  width: 100% !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  object-fit: contain !important;
  object-position: center !important;
  background: #000 !important;
}

/* keep multi-image rows tidy without forcing square crop */
.timeline-item .attachments .gallery-row {
  display: grid !important;
  gap: 8px !important;
  align-items: start !important;
}

.timeline-item .attachments .gallery-row:has(.attachment:nth-child(2)) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

.timeline-item .attachments .gallery-row:has(.attachment:nth-child(3)),
.timeline-item .attachments .gallery-row:has(.attachment:nth-child(4)) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

@media (max-width: 760px) {
  .timeline-item .tweet-header {
    grid-template-columns: 44px minmax(0, 1fr) !important;
    column-gap: 10px !important;
  }

  .timeline-item .tweet-header > a.tweet-avatar,
  .timeline-item .tweet-header > .tweet-avatar,
  .timeline-item .tweet-header > a.tweet-avatar img,
  .timeline-item .tweet-header > .tweet-avatar img,
  .timeline-item .tweet-header img.avatar,
  .timeline-item .tweet-header img.avatar.round {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    min-height: 44px !important;
    max-width: 44px !important;
    max-height: 44px !important;
  }

  .timeline-item .tweet-header > .tweet-name-row {
    grid-template-columns: minmax(0, 1fr) !important;
    row-gap: 2px !important;
  }

  .timeline-item .tweet-header > .tweet-name-row > .tweet-date {
    grid-column: 1 !important;
    grid-row: 2 !important;
    justify-self: start !important;
    align-self: start !important;
  }
}


/* merged stronger avatar position fix */
.timeline-item .tweet-header {
  display: grid !important;
  grid-template-columns: 52px minmax(0, 1fr) !important;
  column-gap: 12px !important;
  row-gap: 2px !important;
  align-items: start !important;
}

.timeline-item .tweet-header > a.tweet-avatar,
.timeline-item .tweet-header > .tweet-avatar {
  grid-column: 1 !important;
  grid-row: 1 !important;
  align-self: start !important;
  justify-self: start !important;
  margin: 0 !important;
  margin-top: 0 !important;
  position: relative !important;
  left: 0 !important;
  top: 0 !important;
  transform: none !important;
  z-index: 2 !important;
}

.timeline-item .tweet-header > .tweet-name-row {
  grid-column: 2 !important;
  grid-row: 1 !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  column-gap: 10px !important;
  row-gap: 2px !important;
  align-items: start !important;
  min-width: 0 !important;
  margin: 0 !important;
}

.timeline-item .tweet-header > .tweet-name-row > .fullname-and-username {
  grid-column: 1 !important;
  grid-row: 1 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  row-gap: 4px !important;
  flex-wrap: wrap !important;
  min-width: 0 !important;
  margin: 0 !important;
}

.timeline-item .tweet-header > .tweet-name-row > .tweet-date {
  grid-column: 2 !important;
  grid-row: 1 !important;
  justify-self: end !important;
  align-self: center !important;
  margin: 0 !important;
  white-space: nowrap !important;
}

/* merged stronger full-image display fix */
.timeline-item .attachments,
.timeline-item .attachments.card,
.timeline-item .attachments .gallery-row,
.timeline-item .attachments .attachment,
.timeline-item .attachments a.still-image,
.timeline-item .attachments .gallery-video,
.timeline-item .attachments .video-container,
.timeline-item .attachments .video-overlay {
  aspect-ratio: auto !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
}

.timeline-item .attachments .attachment,
.timeline-item .attachments a.still-image,
.timeline-item .attachments .gallery-video,
.timeline-item .attachments .video-container {
  display: block !important;
  overflow: hidden !important;
  border-radius: var(--cc-radius-lg) !important;
  border: 1px solid var(--cc-border-2) !important;
  background: transparent !important;
}

.timeline-item .attachments img,
.timeline-item .attachments a.still-image img,
.timeline-item .attachments .attachment img {
  display: block !important;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  margin-inline: auto !important;
  object-fit: contain !important;
  object-position: center !important;
  background: transparent !important;
}

.timeline-item .attachments video,
.timeline-item .attachments .gallery-video video,
.timeline-item .attachments .video-container video {
  display: block !important;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  margin-inline: auto !important;
  object-fit: contain !important;
  object-position: center !important;
  background: #000 !important;
}

@media (max-width: 760px) {
  .timeline-item .tweet-header {
    grid-template-columns: 44px minmax(0, 1fr) !important;
    column-gap: 10px !important;
  }

  .timeline-item .tweet-header > .tweet-name-row {
    grid-template-columns: minmax(0, 1fr) !important;
  }

  .timeline-item .tweet-header > .tweet-name-row > .tweet-date {
    grid-column: 1 !important;
    grid-row: 2 !important;
    justify-self: start !important;
    align-self: start !important;
  }
}


/* merged search page polish */
.search-form,
form[action*="/search"] {
  display: grid !important;
  gap: 10px !important;
  padding: 14px !important;
  margin: 0 0 14px !important;
  background: linear-gradient(180deg, rgba(13,21,34,.98), rgba(13,21,34,.94)) !important;
  border: 1px solid var(--cc-border) !important;
  border-radius: var(--cc-radius-xl) !important;
  box-shadow: var(--cc-shadow) !important;
}

.search-form *,
form[action*="/search"] * {
  box-sizing: border-box !important;
  min-width: 0 !important;
}

.search-form .search-bar,
form[action*="/search"] .search-bar,
.search-form .input-group,
form[action*="/search"] .input-group {
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  gap: 10px !important;
  align-items: center !important;
}

.search-form input[type="text"],
.search-form input[type="search"],
.search-form input[name="f"],
form[action*="/search"] input[type="text"],
form[action*="/search"] input[type="search"],
form[action*="/search"] input[name="f"] {
  width: 100% !important;
  min-height: 42px !important;
  padding: 0 14px !important;
  border-radius: 14px !important;
  border: 1px solid rgba(255,255,255,.08) !important;
  background: rgba(255,255,255,.03) !important;
  color: var(--cc-text) !important;
  outline: 0 !important;
  box-shadow: none !important;
}

.search-form input[type="text"]::placeholder,
.search-form input[type="search"]::placeholder,
.search-form input[name="f"]::placeholder,
form[action*="/search"] input[type="text"]::placeholder,
form[action*="/search"] input[type="search"]::placeholder,
form[action*="/search"] input[name="f"]::placeholder {
  color: var(--cc-muted) !important;
  opacity: .9 !important;
}

.search-form input[type="submit"],
.search-form button[type="submit"],
form[action*="/search"] input[type="submit"],
form[action*="/search"] button[type="submit"] {
  min-height: 42px !important;
  padding: 0 16px !important;
  border-radius: 999px !important;
  border: 1px solid rgba(93,146,255,.22) !important;
  background: rgba(93,146,255,.14) !important;
  color: var(--cc-text) !important;
  font-weight: 700 !important;
  box-shadow: none !important;
}

.search-form .search-options,
.search-form .filters,
form[action*="/search"] .search-options,
form[action*="/search"] .filters {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 10px !important;
  align-items: center !important;
}

.search-form label,
form[action*="/search"] label {
  color: var(--cc-muted) !important;
  font-size: 13px !important;
  line-height: 1.35 !important;
}

.search-form select,
.search-form input[type="checkbox"],
.search-form input[type="radio"],
form[action*="/search"] select,
form[action*="/search"] input[type="checkbox"],
form[action*="/search"] input[type="radio"] {
  accent-color: var(--cc-accent) !important;
}

.search-form select,
form[action*="/search"] select {
  min-height: 38px !important;
  padding: 0 12px !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255,255,255,.08) !important;
  background: rgba(255,255,255,.03) !important;
  color: var(--cc-text) !important;
}

.search-title,
.search-header,
.timeline-container .search-header {
  margin: 0 0 10px !important;
  color: var(--cc-text) !important;
}

.timeline-container .timeline-item:has(.search-item),
.timeline-container .search-item,
.search-result {
  min-width: 0 !important;
}

@media (max-width: 760px) {
  .search-form,
  form[action*="/search"] {
    padding: 12px !important;
    gap: 8px !important;
    border-radius: 16px !important;
  }

  .search-form .search-bar,
  form[action*="/search"] .search-bar,
  .search-form .input-group,
  form[action*="/search"] .input-group {
    grid-template-columns: 1fr !important;
    gap: 8px !important;
  }

  .search-form input[type="text"],
  .search-form input[type="search"],
  .search-form input[name="f"],
  form[action*="/search"] input[type="text"],
  form[action*="/search"] input[type="search"],
  form[action*="/search"] input[name="f"] {
    min-height: 40px !important;
  }

  .search-form input[type="submit"],
  .search-form button[type="submit"],
  form[action*="/search"] input[type="submit"],
  form[action*="/search"] button[type="submit"] {
    min-height: 40px !important;
  }
}


/* merged reply context preview */
.cc-reply-context {
  display: grid !important;
  gap: 8px !important;
  padding: 10px 12px !important;
  margin-top: 8px !important;
  border: 1px solid rgba(93,146,255,.18) !important;
  border-radius: var(--cc-radius-md) !important;
  background: linear-gradient(180deg, rgba(93,146,255,.09), rgba(93,146,255,.03)) !important;
}

.cc-reply-context__head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.cc-reply-context__label,
.cc-reply-context__meta {
  color: var(--cc-muted) !important;
  font-size: 12px !important;
  line-height: 1.35 !important;
}

.cc-reply-context__meta {
  display: flex !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.cc-reply-context__text {
  color: var(--cc-text) !important;
  line-height: 1.45 !important;
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
}

.cc-reply-context__actions {
  display: inline-flex !important;
  gap: 8px !important;
  flex-wrap: wrap !important;
}

.cc-reply-context__open,
.cc-reply-context__toggle {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-height: 28px !important;
  padding: 0 10px !important;
  border-radius: 999px !important;
  border: 1px solid rgba(255,255,255,.08) !important;
  background: rgba(255,255,255,.04) !important;
  color: var(--cc-text) !important;
  box-shadow: none !important;
  text-decoration: none !important;
}

.cc-reply-context__media {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(76px, 1fr)) !important;
  gap: 6px !important;
}

.cc-reply-context__media img,
.cc-reply-context__media video {
  display: block !important;
  width: 100% !important;
  aspect-ratio: 1 !important;
  object-fit: cover !important;
  border-radius: 10px !important;
  border: 1px solid rgba(255,255,255,.08) !important;
}

@media (max-width: 760px) {
  .cc-reply-context {
    padding: 9px 10px !important;
    gap: 7px !important;
  }
}


/* merged emoji font fallback fix */
html,
body,
.timeline-item,
.timeline-item .tweet-content,
.timeline-item .tweet-content.media-body,
.timeline-item .replying-to,
.timeline-item .fullname,
.timeline-item .username,
.cc-reply-context,
.cc-reply-context__text,
.cc-reply-context__meta,
.profile-card,
.profile-card .profile-bio,
.profile-card .profile-location,
.profile-card .profile-website,
.profile-card .profile-joindate {
  font-family:
    system-ui,
    -apple-system,
    "Segoe UI",
    Roboto,
    "Noto Sans",
    "Noto Color Emoji",
    "Apple Color Emoji",
    "Segoe UI Emoji",
    sans-serif !important;
}


/* merged stricter real-DOM card header alignment */

/* exact Poast DOM:
   .tweet-header
     a.tweet-avatar
     .tweet-name-row
       .fullname-and-username
       .tweet-date
*/
.timeline-item .tweet-header {
  display: grid !important;
  grid-template-columns: 52px minmax(0, 1fr) !important;
  column-gap: 12px !important;
  row-gap: 0 !important;
  align-items: start !important;
}

.timeline-item .tweet-header > a.tweet-avatar,
.timeline-item .tweet-header > .tweet-avatar {
  grid-column: 1 !important;
  grid-row: 1 !important;
  display: block !important;
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  min-height: 52px !important;
  max-width: 52px !important;
  max-height: 52px !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 999px !important;
  overflow: hidden !important;
  align-self: start !important;
  justify-self: start !important;
  position: relative !important;
  left: 0 !important;
  top: 0 !important;
  transform: none !important;
  float: none !important;
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 2 !important;
}

.timeline-item .tweet-header > a.tweet-avatar img,
.timeline-item .tweet-header > .tweet-avatar img {
  display: block !important;
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  min-height: 52px !important;
  max-width: 52px !important;
  max-height: 52px !important;
  margin: 0 !important;
  padding: 0 !important;
  object-fit: cover !important;
  object-position: center !important;
  border-radius: 999px !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.timeline-item .tweet-header > .tweet-name-row {
  grid-column: 2 !important;
  grid-row: 1 !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1fr) auto !important;
  column-gap: 10px !important;
  row-gap: 2px !important;
  align-items: start !important;
  min-width: 0 !important;
  margin: 0 !important;
  width: 100% !important;
}

.timeline-item .tweet-header > .tweet-name-row > .fullname-and-username {
  grid-column: 1 !important;
  grid-row: 1 !important;
  display: flex !important;
  align-items: center !important;
  align-self: center !important;
  gap: 8px !important;
  row-gap: 4px !important;
  flex-wrap: wrap !important;
  min-width: 0 !important;
  margin: 0 !important;
}

.timeline-item .tweet-header > .tweet-name-row > .tweet-date {
  grid-column: 2 !important;
  grid-row: 1 !important;
  justify-self: end !important;
  align-self: center !important;
  white-space: nowrap !important;
  margin: 0 !important;
}

.timeline-item .tweet-header > .tweet-name-row > .fullname-and-username .fullname,
.timeline-item .tweet-header > .tweet-name-row > .fullname-and-username .username,
.timeline-item .tweet-header > .tweet-name-row > .tweet-date,
.timeline-item .tweet-header > .tweet-name-row > .tweet-date a {
  line-height: 1.15 !important;
}

@media (max-width: 760px) {
  .timeline-item .tweet-header {
    grid-template-columns: 44px minmax(0, 1fr) !important;
    column-gap: 10px !important;
  }

  .timeline-item .tweet-header > a.tweet-avatar,
  .timeline-item .tweet-header > .tweet-avatar,
  .timeline-item .tweet-header > a.tweet-avatar img,
  .timeline-item .tweet-header > .tweet-avatar img {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
    min-height: 44px !important;
    max-width: 44px !important;
    max-height: 44px !important;
  }

  .timeline-item .tweet-header > .tweet-name-row {
    grid-template-columns: minmax(0, 1fr) !important;
    row-gap: 2px !important;
  }

  .timeline-item .tweet-header > .tweet-name-row > .tweet-date {
    grid-column: 1 !important;
    grid-row: 2 !important;
    justify-self: start !important;
    align-self: start !important;
  }
}


/* merged media gallery tab pass */

/* route-aware gallery shell */
body.cc-route-media-gallery .timeline.media-gallery-view,
body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry,
body.cc-route-media-grid .timeline.media-gallery-view,
body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry {
  min-width: 0 !important;
}

/* gallery masonry becomes a stable responsive grid */
body.cc-route-media-gallery .timeline.media-gallery-view > .gallery-masonry,
body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
  gap: 14px !important;
  align-items: start !important;
  column-count: unset !important;
  column-gap: 0 !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view > .gallery-masonry > .timeline-item,
body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry > .timeline-item {
  margin: 0 !important;
  break-inside: avoid !important;
}

/* gallery cards: media-first, cleaner spacing */
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item > .tweet-body {
  gap: 10px !important;
  padding: 12px !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .tweet-content,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .tweet-content.media-body {
  display: -webkit-box !important;
  -webkit-box-orient: vertical !important;
  -webkit-line-clamp: 3 !important;
  overflow: hidden !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments.card,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-row,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .attachment,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments a.still-image,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-video,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .video-container,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .video-overlay {
  aspect-ratio: auto !important;
  min-height: 0 !important;
  height: auto !important;
  max-height: none !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments {
  display: grid !important;
  gap: 8px !important;
  margin: 0 !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-row {
  display: grid !important;
  gap: 8px !important;
  align-items: start !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-row:has(.attachment:nth-child(2)) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-row:has(.attachment:nth-child(3)),
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-row:has(.attachment:nth-child(4)) {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .attachment,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments a.still-image,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-video,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .video-container {
  display: block !important;
  overflow: hidden !important;
  border-radius: var(--cc-radius-lg) !important;
  border: 1px solid var(--cc-border-2) !important;
  background: transparent !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments img,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments a.still-image img,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .attachment img {
  display: block !important;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  margin-inline: auto !important;
  object-fit: contain !important;
  object-position: center !important;
  background: transparent !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments video,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .gallery-video video,
body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item .attachments .video-container video {
  display: block !important;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
  max-height: none !important;
  margin-inline: auto !important;
  object-fit: contain !important;
  object-position: center !important;
  background: #000 !important;
}

/* media grid view: true media-only tiles */
body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry,
body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry {
  display: grid !important;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
  gap: 8px !important;
  align-items: start !important;
  column-count: unset !important;
  column-gap: 0 !important;
}

body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry > .timeline-item,
body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry > .timeline-item {
  margin: 0 !important;
  overflow: hidden !important;
}

body.cc-route-media-grid .timeline.media-gallery-view .timeline-item > .tweet-body {
  padding: 0 !important;
  gap: 0 !important;
}

body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .tweet-header,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .tweet-content,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .tweet-content.media-body,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .replying-to,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .retweet-header,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .retweet-text,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .tweet-pre-header,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .pinned,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .tweet-stats {
  display: none !important;
}

body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments.card,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .gallery-row,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .attachment,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments a.still-image,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .gallery-video,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .video-container,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .video-overlay {
  border-radius: 0 !important;
  border: 0 !important;
  aspect-ratio: 1 !important;
  min-height: 0 !important;
  height: auto !important;
  background: transparent !important;
}

body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments {
  display: grid !important;
  gap: 0 !important;
  margin: 0 !important;
}

body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .gallery-row {
  gap: 0 !important;
}

body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments img,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments a.still-image img,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .attachment img,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments video,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .gallery-video video,
body.cc-route-media-grid .timeline.media-gallery-view .timeline-item .attachments .video-container video {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  object-fit: cover !important;
}

/* mobile gallery */
@media (max-width: 760px) {
  body.cc-route-media-gallery .timeline.media-gallery-view > .gallery-masonry,
  body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry {
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item > .tweet-body {
    padding: 11px !important;
    gap: 9px !important;
  }

  body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry,
  body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 6px !important;
  }
}

@media (max-width: 480px) {
  body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry,
  body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry {
    gap: 4px !important;
  }
}


/* merged adjustable density + gaps controls */
:root {
  --cc-density-card-pad: 14px;
  --cc-density-card-gap: 12px;
  --cc-density-gallery-gap: 14px;
  --cc-density-grid-min: 280px;
  --cc-density-media-gap: 8px;
  --cc-density-toolbar-bottom: 14px;
}

#cc-density-toolbar {
  position: fixed;
  right: 14px;
  bottom: var(--cc-density-toolbar-bottom);
  z-index: 9999;
  display: grid;
  gap: 8px;
  padding: 10px;
  min-width: 220px;
  border-radius: 16px;
  border: 1px solid var(--cc-border);
  background: rgba(13,21,34,.92);
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 28px rgba(0,0,0,.22);
}

#cc-density-toolbar .cc-density-row {
  display: grid;
  gap: 6px;
}

#cc-density-toolbar .cc-density-label {
  color: var(--cc-muted);
  font-size: 12px;
  line-height: 1.2;
}

#cc-density-toolbar .cc-density-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

#cc-density-toolbar button {
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.03);
  color: var(--cc-text);
  box-shadow: none;
}

#cc-density-toolbar button[aria-pressed="true"] {
  background: rgba(93,146,255,.14);
  border-color: rgba(93,146,255,.22);
}

body[data-cc-density="compact"] {
  --cc-density-card-pad: 10px;
  --cc-density-card-gap: 9px;
  --cc-density-gallery-gap: 10px;
  --cc-density-grid-min: 220px;
  --cc-density-media-gap: 6px;
}

body[data-cc-density="normal"] {
  --cc-density-card-pad: 14px;
  --cc-density-card-gap: 12px;
  --cc-density-gallery-gap: 14px;
  --cc-density-grid-min: 280px;
  --cc-density-media-gap: 8px;
}

body[data-cc-density="comfortable"] {
  --cc-density-card-pad: 18px;
  --cc-density-card-gap: 15px;
  --cc-density-gallery-gap: 18px;
  --cc-density-grid-min: 340px;
  --cc-density-media-gap: 10px;
}

body[data-cc-gap="tight"] {
  --cc-density-gallery-gap: 8px;
  --cc-density-media-gap: 4px;
}

body[data-cc-gap="normal"] {
  --cc-density-gallery-gap: 14px;
  --cc-density-media-gap: 8px;
}

body[data-cc-gap="wide"] {
  --cc-density-gallery-gap: 20px;
  --cc-density-media-gap: 12px;
}

.timeline-item > .tweet-body {
  gap: var(--cc-density-card-gap) !important;
  padding: var(--cc-density-card-pad) !important;
}

.timeline-item .attachments,
.timeline-item .attachments .gallery-row {
  gap: var(--cc-density-media-gap) !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view > .gallery-masonry,
body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry {
  grid-template-columns: repeat(auto-fill, minmax(var(--cc-density-grid-min), 1fr)) !important;
  gap: var(--cc-density-gallery-gap) !important;
}

body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry,
body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry {
  gap: var(--cc-density-media-gap) !important;
}

@media (max-width: 760px) {
  #cc-density-toolbar {
    right: 8px;
    left: 8px;
    bottom: 8px;
    min-width: 0;
  }
}


/* merged collapsible density toolbar */
#cc-density-toolbar {
  min-width: 0 !important;
  width: min(260px, calc(100vw - 28px)) !important;
  transition: transform .18s ease, opacity .18s ease, width .18s ease !important;
}

#cc-density-toolbar.cc-collapsed {
  width: auto !important;
  padding: 8px !important;
}

#cc-density-toolbar .cc-density-topbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
}

#cc-density-toolbar .cc-density-title {
  color: var(--cc-text);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
}

#cc-density-toolbar .cc-density-toggle {
  min-width: 30px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.03);
  color: var(--cc-text);
}

#cc-density-toolbar.cc-collapsed .cc-density-content {
  display: none !important;
}


/* merged range-based density + gap controls + mobile grid fix */
:root {
  --cc-density-card-pad: 14px;
  --cc-density-card-gap: 12px;
  --cc-density-gallery-gap: 14px;
  --cc-density-grid-min: 280px;
  --cc-density-media-gap: 8px;
  --cc-density-toolbar-bottom: 14px;
  --cc-mobile-grid-min: 160px;
}

#cc-density-toolbar {
  min-width: 0 !important;
  width: min(280px, calc(100vw - 28px)) !important;
  transition: transform .18s ease, opacity .18s ease, width .18s ease !important;
}

#cc-density-toolbar.cc-collapsed {
  width: auto !important;
  padding: 8px !important;
}

#cc-density-toolbar .cc-density-topbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
}

#cc-density-toolbar .cc-density-title {
  color: var(--cc-text);
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
}

#cc-density-toolbar .cc-density-toggle {
  min-width: 30px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.03);
  color: var(--cc-text);
}

#cc-density-toolbar.cc-collapsed .cc-density-content {
  display: none !important;
}

#cc-density-toolbar .cc-density-row {
  display: grid !important;
  gap: 6px !important;
}

#cc-density-toolbar .cc-density-labelbar {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 8px !important;
}

#cc-density-toolbar .cc-density-label {
  color: var(--cc-muted);
  font-size: 12px;
  line-height: 1.2;
}

#cc-density-toolbar .cc-density-value {
  color: var(--cc-text);
  font-size: 12px;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

#cc-density-toolbar input[type="range"] {
  width: 100% !important;
  margin: 0 !important;
  accent-color: var(--cc-accent) !important;
}

.timeline-item > .tweet-body {
  gap: var(--cc-density-card-gap) !important;
  padding: var(--cc-density-card-pad) !important;
}

.timeline-item .attachments,
.timeline-item .attachments .gallery-row {
  gap: var(--cc-density-media-gap) !important;
}

body.cc-route-media-gallery .timeline.media-gallery-view > .gallery-masonry,
body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry {
  grid-template-columns: repeat(auto-fill, minmax(var(--cc-density-grid-min), 1fr)) !important;
  gap: var(--cc-density-gallery-gap) !important;
}

body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry,
body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry {
  gap: var(--cc-density-media-gap) !important;
}

/* critical mobile fix: do not force gallery to one column; allow adjustable columns */
@media (max-width: 760px) {
  body.cc-route-media-gallery .timeline.media-gallery-view > .gallery-masonry,
  body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry {
    grid-template-columns: repeat(auto-fill, minmax(var(--cc-mobile-grid-min), 1fr)) !important;
    gap: var(--cc-density-gallery-gap) !important;
  }

  body.cc-route-media-gallery .timeline.media-gallery-view .timeline-item > .tweet-body {
    padding: 11px !important;
    gap: 9px !important;
  }

  body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry,
  body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry {
    grid-template-columns: repeat(auto-fill, minmax(var(--cc-mobile-grid-min), 1fr)) !important;
    gap: var(--cc-density-media-gap) !important;
  }

  #cc-density-toolbar {
    right: 8px;
    left: 8px;
    bottom: 8px;
    width: auto !important;
    min-width: 0;
  }
}

@media (max-width: 480px) {
  :root {
    --cc-mobile-grid-min: 138px;
  }

  body.cc-route-media-grid .timeline.media-gallery-view > .gallery-masonry,
  body.cc-route-media-grid .timeline.media-gallery-view .gallery-masonry,
  body.cc-route-media-gallery .timeline.media-gallery-view > .gallery-masonry,
  body.cc-route-media-gallery .timeline.media-gallery-view .gallery-masonry {
    gap: var(--cc-density-media-gap) !important;
  }
}
`;
const DENSITY_KEY = 'cc_poast_density_range';
  const GAP_KEY = 'cc_poast_gap_range';
  const GRID_KEY = 'cc_poast_grid_min_range';
  const MOBILE_GRID_KEY = 'cc_poast_mobile_grid_min_range';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function applyDensityPrefs() {
    const density = clamp(Number(localStorage.getItem(DENSITY_KEY) || '14'), 8, 24);
    const gap = clamp(Number(localStorage.getItem(GAP_KEY) || '14'), 4, 28);
    const grid = clamp(Number(localStorage.getItem(GRID_KEY) || '280'), 180, 420);
    const mobileGrid = clamp(Number(localStorage.getItem(MOBILE_GRID_KEY) || '160'), 110, 240);

    document.documentElement.style.setProperty('--cc-density-card-pad', density + 'px');
    document.documentElement.style.setProperty('--cc-density-card-gap', Math.max(6, Math.round(density * 0.85)) + 'px');
    document.documentElement.style.setProperty('--cc-density-gallery-gap', gap + 'px');
    document.documentElement.style.setProperty('--cc-density-media-gap', Math.max(2, Math.round(gap * 0.55)) + 'px');
    document.documentElement.style.setProperty('--cc-density-grid-min', grid + 'px');
    document.documentElement.style.setProperty('--cc-mobile-grid-min', mobileGrid + 'px');

    document.body.dataset.ccDensity = 'range';
    document.body.dataset.ccGap = 'range';
  }

  function buildDensityToolbar() {
    if (document.getElementById('cc-density-toolbar')) return;

    const collapsed = localStorage.getItem('cc_poast_density_toolbar_collapsed') === '1';

    const toolbar = document.createElement('div');
    toolbar.id = 'cc-density-toolbar';
    if (collapsed) toolbar.classList.add('cc-collapsed');

    toolbar.innerHTML = `
      <div class="cc-density-topbar">
        <div class="cc-density-title">Layout</div>
        <button type="button" class="cc-density-toggle" aria-expanded="${collapsed ? 'false' : 'true'}">${collapsed ? '＋' : '–'}</button>
      </div>
      <div class="cc-density-content">
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Card density</div>
            <div class="cc-density-value" data-value-for="density"></div>
          </div>
          <input type="range" min="8" max="24" step="1" data-range="density">
        </div>
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Gaps</div>
            <div class="cc-density-value" data-value-for="gap"></div>
          </div>
          <input type="range" min="4" max="28" step="1" data-range="gap">
        </div>
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Grid width</div>
            <div class="cc-density-value" data-value-for="grid"></div>
          </div>
          <input type="range" min="180" max="420" step="10" data-range="grid">
        </div>
        <div class="cc-density-row">
          <div class="cc-density-labelbar">
            <div class="cc-density-label">Mobile grid</div>
            <div class="cc-density-value" data-value-for="mobile-grid"></div>
          </div>
          <input type="range" min="110" max="240" step="2" data-range="mobile-grid">
        </div>
      </div>
    `;

    toolbar.addEventListener('click', (event) => {
      const toggle = event.target.closest('.cc-density-toggle');
      if (toggle) {
        const nextCollapsed = !toolbar.classList.contains('cc-collapsed');
        toolbar.classList.toggle('cc-collapsed', nextCollapsed);
        localStorage.setItem('cc_poast_density_toolbar_collapsed', nextCollapsed ? '1' : '0');
        toggle.setAttribute('aria-expanded', String(!nextCollapsed));
        toggle.textContent = nextCollapsed ? '＋' : '–';
      }
    });

    toolbar.addEventListener('input', (event) => {
      const range = event.target.closest('input[type="range"][data-range]');
      if (!range) return;

      const kind = range.getAttribute('data-range');
      const value = String(range.value);

      if (kind === 'density') localStorage.setItem(DENSITY_KEY, value);
      if (kind === 'gap') localStorage.setItem(GAP_KEY, value);
      if (kind === 'grid') localStorage.setItem(GRID_KEY, value);
      if (kind === 'mobile-grid') localStorage.setItem(MOBILE_GRID_KEY, value);

      applyDensityPrefs();
      syncDensityToolbar();
    });

    document.body.appendChild(toolbar);
    syncDensityToolbar();
  }

  function syncDensityToolbar() {
    const toolbar = document.getElementById('cc-density-toolbar');
    if (!toolbar) return;

    const density = clamp(Number(localStorage.getItem(DENSITY_KEY) || '14'), 8, 24);
    const gap = clamp(Number(localStorage.getItem(GAP_KEY) || '14'), 4, 28);
    const grid = clamp(Number(localStorage.getItem(GRID_KEY) || '280'), 180, 420);
    const mobileGrid = clamp(Number(localStorage.getItem(MOBILE_GRID_KEY) || '160'), 110, 240);

    const densityRange = toolbar.querySelector('[data-range="density"]');
    const gapRange = toolbar.querySelector('[data-range="gap"]');
    const gridRange = toolbar.querySelector('[data-range="grid"]');
    const mobileGridRange = toolbar.querySelector('[data-range="mobile-grid"]');

    if (densityRange) densityRange.value = String(density);
    if (gapRange) gapRange.value = String(gap);
    if (gridRange) gridRange.value = String(grid);
    if (mobileGridRange) mobileGridRange.value = String(mobileGrid);

    const densityValue = toolbar.querySelector('[data-value-for="density"]');
    const gapValue = toolbar.querySelector('[data-value-for="gap"]');
    const gridValue = toolbar.querySelector('[data-value-for="grid"]');
    const mobileGridValue = toolbar.querySelector('[data-value-for="mobile-grid"]');

    if (densityValue) densityValue.textContent = density + 'px';
    if (gapValue) gapValue.textContent = gap + 'px';
    if (gridValue) gridValue.textContent = grid + 'px';
    if (mobileGridValue) mobileGridValue.textContent = mobileGrid + 'px';
  }

  function applyRouteClasses() {
    document.body.classList.remove('cc-route-media-gallery', 'cc-route-media-grid');
    const path = location.pathname || '';
    const params = new URLSearchParams(location.search || '');
    if (/\/media/.test(path) && params.get('view') === 'gallery') {
      document.body.classList.add('cc-route-media-gallery');
    }
    if (/\/media/.test(path) && params.get('view') === 'grid') {
      document.body.classList.add('cc-route-media-grid');
    }
  }


  function removeOldBrokenStylesOnce() {
    const styles = Array.from(document.querySelectorAll('style'));
    for (const style of styles) {
      const txt = (style.textContent || '').replace(/\s+/g, '');
      if (BAD_STYLE_MARKERS.some(marker => txt.includes(marker.replace(/\s+/g, '')))) {
        style.remove();
      }
    }
  }

  function injectOnce() {
    if (document.getElementById(STYLE_ID)) return;

    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.append(style);
  }


  const AUTO_INSTANCES = [
    'nitter.poast.org',
    'xcancel.com',
    'nitter.net',
    'nitter.privacydev.net',
    'nitter.woodland.cafe'
  ];

  function handleNoItemsFoundOnce() {
    const none = Array.from(document.querySelectorAll('h2.timeline-none, .timeline-none'))
      .find(el => /no items found/i.test((el.textContent || '').trim()));

    if (!none) return;

    const currentHost = location.host;
    const reloadKey = 'cc_poast_no_items_reload_' + location.pathname + location.search;
    const fallbackKey = 'cc_poast_no_items_fallback_' + location.pathname + location.search;

    const reloadCount = Number(sessionStorage.getItem(reloadKey) || '0');
    const fallbackCount = Number(sessionStorage.getItem(fallbackKey) || '0');

    if (reloadCount < 1) {
      sessionStorage.setItem(reloadKey, String(reloadCount + 1));
      setTimeout(() => location.reload(), 700);
      return;
    }

    if (fallbackCount < 1) {
      const idx = AUTO_INSTANCES.indexOf(currentHost);
      const nextHost = AUTO_INSTANCES[(idx >= 0 ? idx + 1 : 0) % AUTO_INSTANCES.length];
      if (nextHost && nextHost !== currentHost) {
        sessionStorage.setItem(fallbackKey, String(fallbackCount + 1));
        const url = new URL(location.href);
        url.host = nextHost;
        setTimeout(() => { location.href = url.toString(); }, 700);
      }
    }
  }


  const REPLY_CONTEXT_ATTR = 'data-cc-reply-context';

  function q(sel, root = document) {
    return root.querySelector(sel);
  }

  function qa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function nodeText(node) {
    return (node?.textContent || '').replace(/\s+/g, ' ').trim();
  }



  function extractParentPreview(doc) {
    const candidate =
      q('.main-tweet', doc) ||
      q('.thread .timeline-item', doc) ||
      q('.timeline > .timeline-item', doc);

    if (!candidate) return null;

    const fullname = nodeText(q('.fullname', candidate));
    const username = nodeText(q('.username', candidate));
    const date = nodeText(q('.tweet-date', candidate));
    const text = nodeText(q('.tweet-content.media-body, .tweet-content', candidate));

    const media = [];
    qa('.attachments a.still-image img', candidate).slice(0, 4).forEach((img) => {
      const src = img.currentSrc || img.src || '';
      if (src) media.push({ type: 'image', src });
    });

    qa('.attachments video', candidate).slice(0, 2).forEach((video) => {
      const poster = video.getAttribute('poster') || '';
      media.push({ type: 'video', poster });
    });

    return { fullname, username, date, text, media };
  }

  async function fetchParentPreview(url) {
    const response = await fetch(url, { credentials: 'include' });
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return extractParentPreview(doc);
  }

  function buildParentPreview(data, url) {
    const wrap = document.createElement('section');
    wrap.className = 'cc-reply-context';
    wrap.setAttribute(REPLY_CONTEXT_ATTR, '1');

    const mediaHtml = data.media.length
      ? '<div class="cc-reply-context__media">' + data.media.map((m) => (
          m.type === 'video'
            ? '<video muted playsinline preload="metadata"' + (m.poster ? ' poster="' + m.poster + '"' : '') + '></video>'
            : '<img src="' + m.src + '" alt="">'
        )).join('') + '</div>'
      : '';

    wrap.innerHTML = `
      <div class="cc-reply-context__head">
        <span class="cc-reply-context__label">Replying to this post</span>
        <div class="cc-reply-context__actions">
          <a class="cc-reply-context__open" href="${url}" target="_blank" rel="noreferrer noopener">Open original</a>
          <button type="button" class="cc-reply-context__toggle" aria-expanded="true">Hide</button>
        </div>
      </div>
      <div class="cc-reply-context__body">
        <div class="cc-reply-context__meta">
          <strong>${data.fullname || 'Post'}</strong>
          <span>${data.username || ''}</span>
          <span>${data.date || ''}</span>
        </div>
        <div class="cc-reply-context__text">${data.text || 'No preview text found.'}</div>
        ${mediaHtml}
      </div>
    `;

    const toggle = q('.cc-reply-context__toggle', wrap);
    const body = q('.cc-reply-context__body', wrap);

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.textContent = expanded ? 'Show' : 'Hide';
      body.hidden = expanded;
    });

    return wrap;
  }


  function getSelfStatusUrl(item) {
    const selfLink = q('.tweet-date a[href*="/status/"]', item);
    return selfLink?.href || null;
  }

  function getReplyTargetUrl(item) {
    if (!q('.replying-to', item)) return null;

    const selfUrl = getSelfStatusUrl(item);
    const links = qa('a[href*="/status/"]', item)
      .filter((a) => /\/status\/\d+/.test(a.getAttribute('href') || ''))
      .filter((a) => !a.closest('.tweet-stats'))
      .map((a) => a.href)
      .filter(Boolean);

    const distinct = [...new Set(links)].filter((href) => href !== selfUrl);
    return distinct[0] || null;
  }

  function isSamePostPreview(item, data) {
    const body = q(':scope > .tweet-body', item);
    if (!body || !data) return false;

    const currentName = nodeText(q('.fullname', body));
    const currentUser = nodeText(q('.username', body));
    const currentDate = nodeText(q('.tweet-date', body));
    const currentText = nodeText(q('.tweet-content.media-body, .tweet-content', body));

    return Boolean(
      data.fullname &&
      data.username &&
      data.text &&
      currentName === data.fullname &&
      currentUser === data.username &&
      currentDate === data.date &&
      currentText === data.text
    );
  }

  async function enhanceReplyItem(item) {
    if (!q('.replying-to', item) || q('[' + REPLY_CONTEXT_ATTR + ']', item)) return;

    const body = q(':scope > .tweet-body', item);
    const replyingTo = body ? q('.replying-to', body) : null;
    const targetUrl = getReplyTargetUrl(item);

    if (!body || !replyingTo || !targetUrl) return;

    const shell = document.createElement('section');
    shell.className = 'cc-reply-context';
    shell.setAttribute(REPLY_CONTEXT_ATTR, '1');
    shell.innerHTML = `
      <div class="cc-reply-context__head">
        <span class="cc-reply-context__label">Loading replied-to post…</span>
        <div class="cc-reply-context__actions">
          <a class="cc-reply-context__open" href="${targetUrl}" target="_blank" rel="noreferrer noopener">Open original</a>
        </div>
      </div>
    `;

    replyingTo.insertAdjacentElement('afterend', shell);

    try {
      const data = await fetchParentPreview(targetUrl);
      if (!data || isSamePostPreview(item, data)) {
        shell.remove();
        return;
      }
      shell.replaceWith(buildParentPreview(data, targetUrl));
    } catch {
      shell.remove();
    }
  }


  function enhanceReplyContexts() {
    qa('.timeline > .timeline-item, .thread > .timeline-item').forEach((item) => {
      enhanceReplyItem(item);
    });
  }


  function run() {
    removeOldBrokenStylesOnce();
    injectOnce();
    applyDensityPrefs();
    applyRouteClasses();
    handleNoItemsFoundOnce();
    enhanceReplyContexts();
    buildDensityToolbar();
    syncDensityToolbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
