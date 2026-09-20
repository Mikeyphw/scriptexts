// ==UserScript==
// @name         Search Engines Clean Dark UI
// @namespace    https://github.com/Mikeyphw/scriptexts/userscripts/search-engines-clean-dark-ui
// @homepageURL  https://github.com/Mikeyphw/scriptexts/tree/main/userscripts/standalone/search-engines-clean-dark-ui
// @supportURL   https://github.com/Mikeyphw/scriptexts/issues
// @updateURL    https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/search-engines-clean-dark-ui/search-engines-clean-dark-ui.meta.js
// @downloadURL  https://raw.githubusercontent.com/Mikeyphw/scriptexts/main/userscripts/standalone/search-engines-clean-dark-ui/search-engines-clean-dark-ui.user.js
// @version      3.5
// @description  Full UI normalization: tabs, sub-tabs, popups, border removal
// @match        https://www.100searchengines.com/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    let sidebarBuilt = false;

    /* ================= CSS RESET LAYER ================= */
    const css = `
        :root {
            --bg: #0b0f14;
            --panel: #121a26;
            --panel2: #0f1622;
            --text: #e6e6e6;
            --muted: #9aa4b2;
            --accent: #4da3ff;
        }

        html, body {
            background: var(--bg) !important;
            color: var(--text) !important;
            font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial !important;
        }

        /* ================= HARD BORDER REMOVAL ================= */
        /* Keep the reset scoped: never erase keyboard focus or every container background. */
        #engine-tabs, #custom-sidebar, .gsc-webResult, .gsc-result, .result-item,
        .gsc-context-menu, .gsc-context-menu-item, input, select, textarea, button {
            border-color: transparent !important;
            box-shadow: none !important;
        }

        :where(a, button, input, select, textarea, [tabindex]):focus-visible {
            outline: 2px solid var(--accent) !important;
            outline-offset: 2px !important;
        }

        /* ================= LINKS ================= */
        a {
            color: var(--accent) !important;
            text-decoration: none !important;
        }

        a:hover {
            color: #6bb6ff !important;
            background: rgba(77,163,255,0.08) !important;
        }

        /* ================= MAIN ENGINE TABS ================= */
        #engine-tabs {
            position: sticky;
            top: 0;
            z-index: 99999;
            display: flex;
            gap: 6px;
            padding: 8px;
            background: var(--bg);
            overflow-x: auto;
        }

        .tab-btn {
            padding: 8px 12px;
            background: var(--panel);
            color: var(--text);
            cursor: pointer;
            white-space: nowrap;
            border-radius: 6px !important;
            opacity: 0.85;
        }

        .tab-btn.active {
            background: var(--accent);
            color: #000 !important;
            opacity: 1;
        }

        /* ================= SUB TABS (All / Images / News / Videos) ================= */
        .gsc-tabsArea,
        .gsc-refinementBlock {
            background: var(--bg) !important;
            border: none !important;
        }

        .gsc-tabHeader {
            background: var(--panel2) !important;
            color: var(--text) !important;
            padding: 6px 10px !important;
            margin: 2px !important;
            border-radius: 6px !important;
        }

        .gsc-tabHeader.gsc-tabhActive {
            background: var(--accent) !important;
            color: #000 !important;
        }

        /* ================= RESULTS ================= */
        .gsc-webResult,
        .gsc-result,
        .result-item {
            background: var(--panel) !important;
            padding: 12px !important;
            margin: 10px 0 !important;
            border-radius: 8px !important;
        }

        .gsc-webResult:hover {
            background: #182233 !important;
        }

        /* ================= POPUPS / CONTEXT MENUS ================= */
        .gsc-context-menu,
        .gsc-modalBackground,
        .gsc-results-wrapper-overlay {
            background: rgba(11,15,20,0.92) !important;
            backdrop-filter: blur(10px) !important;
        }

        .gsc-context-menu-item {
            background: var(--panel) !important;
            color: var(--text) !important;
            margin: 4px !important;
            border-radius: 6px !important;
        }

        /* ================= INPUT ================= */
        input, select, textarea {
            background: var(--panel) !important;
            color: var(--text) !important;
            padding: 10px !important;
        }

        /* ================= SIDEBAR ================= */
        #sidebar-toggle {
            position: fixed;
            left: 10px;
            bottom: 10px;
            z-index: 100000;
            background: var(--panel);
            padding: 10px;
            cursor: pointer;
        }

        #custom-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 260px;
            height: 100%;
            background: var(--panel);
            transform: translateX(-100%);
            transition: 0.2s ease;
            z-index: 99998;
            overflow-y: auto;
        }

        #custom-sidebar.open {
            transform: translateX(0);
        }
    `;

    function injectCSS() {
        const s = document.createElement('style');
        s.textContent = css;
        document.documentElement.appendChild(s);
    }

    /* ================= MAIN TABS ================= */
    function buildTabs() {
        const bar = document.createElement('div');
        bar.id = 'engine-tabs';

        const tabs = ['all', 'google', 'bing', 'duckduckgo', 'startpage', 'brave'];

        tabs.forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'tab-btn';
            btn.setAttribute('aria-pressed', 'false');
            btn.textContent = t.toUpperCase();

            btn.onclick = () => {
                document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                document.querySelectorAll('.result-item').forEach(el => {
                    if (t === 'all') {
                        el.style.display = '';
                    } else {
                        el.dataset.engine === t
                            ? el.style.display = ''
                            : el.style.display = 'none';
                    }
                });
            };

            bar.appendChild(btn);
        });

        document.body.prepend(bar);
    }

    /* ================= TAG RESULTS ================= */
    function tagResults(root = document) {
        const anchors = [];
        if (root instanceof Element && root.matches('a[href]')) anchors.push(root);
        if (root.querySelectorAll) anchors.push(...root.querySelectorAll('a[href]'));
        anchors.forEach(a => {
            const engine =
                /google\./i.test(a.href) ? 'google' :
                /bing\./i.test(a.href) ? 'bing' :
                /duckduckgo\.com/i.test(a.href) ? 'duckduckgo' :
                /startpage\.com/i.test(a.href) ? 'startpage' :
                /search\.brave\.com/i.test(a.href) ? 'brave' :
                null;

            if (!engine) return;

            const row = a.closest('.gsc-webResult, .gsc-result, tr, div, li');
            if (!row) return;

            row.classList.add('result-item');
            row.dataset.engine = engine;
        });
    }

    /* ================= SIDEBAR (NO DUPLICATES) ================= */
    function buildSidebar() {
        if (sidebarBuilt) return;
        sidebarBuilt = true;

        const sidebar = document.createElement('div');
        sidebar.id = 'custom-sidebar';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.id = 'sidebar-toggle';
        toggle.textContent = '☰';
        toggle.setAttribute('aria-label', 'Toggle search links sidebar');
        toggle.setAttribute('aria-controls', 'custom-sidebar');
        toggle.setAttribute('aria-expanded', 'false');

        toggle.onclick = () => {
            const open = sidebar.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(open));
        };

        const seen = new Set();

        document.querySelectorAll('a[href]').forEach(a => {
            if (seen.has(a.href)) return;
            seen.add(a.href);

            if (a.href.includes('google') || a.href.includes('bing') ||
                a.href.includes('duck') || a.href.includes('reddit')) {
                sidebar.appendChild(a.cloneNode(true));
            }
        });

        document.body.appendChild(sidebar);
        document.body.appendChild(toggle);
    }

    /* ================= INIT ================= */
    function init() {
        injectCSS();
        buildTabs();

        window.addEventListener('DOMContentLoaded', () => {
            tagResults();
            buildSidebar();

            new MutationObserver(records => {
                for (const record of records) {
                    for (const node of record.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) tagResults(node);
                    }
                }
            }).observe(document.body, { childList: true, subtree: true });
        });
    }

    init();
})();