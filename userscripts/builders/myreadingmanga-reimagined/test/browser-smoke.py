#!/usr/bin/env python3
"""Optional Chromium interaction smoke for the generated MRM userscript."""

from __future__ import annotations

import argparse
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist" / "myreadingmanga-reimagined.user.js"
FIXTURES = ROOT / "test" / "fixtures"
PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

STORAGE_SHIM = r"""
(() => {
  const makeStorage = () => {
    const data = new Map();
    return {
      getItem(key) { return data.has(String(key)) ? data.get(String(key)) : null; },
      setItem(key, value) { data.set(String(key), String(value)); },
      removeItem(key) { data.delete(String(key)); },
      clear() { data.clear(); },
      key(index) { return [...data.keys()][index] ?? null; },
      get length() { return data.size; }
    };
  };
  Object.defineProperty(window, "localStorage", { configurable: true, value: makeStorage() });
  Object.defineProperty(window, "sessionStorage", { configurable: true, value: makeStorage() });
})();
"""


def runtime_source() -> str:
    source = DIST.read_text(encoding="utf-8")
    # Fixtures run on about:blank. Keep production host checks intact in dist,
    # but replace them in-memory for this local interaction harness.
    return (
        source.replace('"hostnames":["myreadingmanga.info"]', '"hostnames":[""]')
        .replace("new URL(url).hostname !== location.hostname", "false")
    )


def install(page: Page, html: str, source: str, preferences: dict | None = None) -> list[str]:
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.set_content(html, wait_until="domcontentloaded")
    page.add_style_tag(content="html { font-size: 10px !important; }")
    page.add_script_tag(content=STORAGE_SHIM)
    if preferences is not None:
        page.evaluate(
            "prefs => localStorage.setItem('mrm-reimagined-v1:preferences', JSON.stringify(prefs))",
            preferences,
        )
    page.add_script_tag(content=source)
    return errors


def wait_for_article_quiescence(page: Page, selector: str = ".mrm-card-grid", milliseconds: int = 700) -> int:
    return page.evaluate(
        """({ selector, milliseconds }) => new Promise(resolve => {
          const root = document.querySelector(selector);
          if (!root) { resolve(-1); return; }
          let mutations = 0;
          const touchesArticle = node => node instanceof Element && (node.matches?.('article.post.entry') || node.querySelector?.('article.post.entry'));
          const observer = new MutationObserver(records => {
            for (const record of records) {
              if ([...record.addedNodes, ...record.removedNodes].some(touchesArticle)) mutations += 1;
            }
          });
          observer.observe(root, { childList: true, subtree: true });
          setTimeout(() => { observer.disconnect(); resolve(mutations); }, milliseconds);
        })""",
        {"selector": selector, "milliseconds": milliseconds},
    )


def archive_smoke(browser, source: str) -> None:
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = install(page, (FIXTURES / "mrm-home.html").read_text(encoding="utf-8"), source)
    page.wait_for_selector("#mrm-panel-launcher", state="attached")
    page.wait_for_selector("#mrm-site-toolbar")
    page.wait_for_selector("#mrm-archive-overview")
    total = page.locator(".mrm-card").count()
    assert total >= 70, total
    assert "Filters" in (page.locator("#mrm-panel-launcher").text_content() or "")
    assert (page.locator("#mrm-launcher-count").text_content() or "").strip() == "3"
    assert page.locator("#mrm-overview-title").inner_text() == "Latest releases"
    assert page.locator(".mrm-site-menu > li").count() >= 6
    assert page.locator(".nav-primary").evaluate("node => getComputedStyle(node).display") == "none"

    visual = page.locator(".mrm-card:not([hidden])").first.evaluate(
        """card => {
          const cover = card.querySelector('.mrm-card-cover');
          const header = card.querySelector('.entry-header');
          const title = card.querySelector('.entry-title');
          const chipRow = card.querySelector('.mrm-card-chips');
          const chips = [...card.querySelectorAll('.mrm-taxonomy-chip')].filter(node => getComputedStyle(node).display !== 'none');
          const reader = card.querySelector('.mrm-reader-button');
          const pagination = document.querySelector('.archive-pagination a');
          const overviewCopy = document.querySelector('.mrm-overview-result-summary');
          const navLink = document.querySelector('.mrm-site-menu a');
          const footerComment = document.querySelector('.before-footer #recentcomments > li');
          const footerChip = document.querySelector('.footer-widgets .tagcloud > a, .footer-widgets .menu a');
          const cardRect = card.getBoundingClientRect();
          const readerRect = reader.getBoundingClientRect();
          const pageRect = pagination?.getBoundingClientRect();
          const chipRowRect = chipRow?.getBoundingClientRect();
          const chipsFit = chips.every(chip => { const rect = chip.getBoundingClientRect(); return rect.left >= chipRowRect.left - 1 && rect.right <= chipRowRect.right + 1 && rect.top >= chipRowRect.top - 1 && rect.bottom <= chipRowRect.bottom + 1; });
          return {
            columns: getComputedStyle(document.querySelector('.mrm-card-grid')).gridTemplateColumns.split(' ').length,
            coverBeforeTitle: cover.getBoundingClientRect().top < header.getBoundingClientRect().top,
            titleSize: parseFloat(getComputedStyle(title).fontSize),
            chipSize: chips.length ? parseFloat(getComputedStyle(chips[0]).fontSize) : 0,
            chipHeight: chips.length ? chips[0].getBoundingClientRect().height : 0,
            chips: chips.length,
            chipsFit,
            readerSize: parseFloat(getComputedStyle(reader).fontSize),
            overviewSize: overviewCopy ? parseFloat(getComputedStyle(overviewCopy).fontSize) : 0,
            navSize: navLink ? parseFloat(getComputedStyle(navLink).fontSize) : 0,
            footerCommentSize: footerComment ? parseFloat(getComputedStyle(footerComment).fontSize) : 0,
            footerChipSize: footerChip ? parseFloat(getComputedStyle(footerChip).fontSize) : 0,
            readerRatio: readerRect.width / cardRect.width,
            readerBackground: getComputedStyle(reader).backgroundColor,
            accent: getComputedStyle(document.documentElement).getPropertyValue('--mrm-accent').trim(),
            objectFit: getComputedStyle(card.querySelector('.mrm-card-cover img')).objectFit,
            pageWidth: pageRect?.width || 0,
            pageHeight: pageRect?.height || 0,
          };
        }"""
    )
    assert visual["columns"] == 5, visual
    assert visual["coverBeforeTitle"], visual
    assert visual["titleSize"] >= 15, visual
    assert visual["chipSize"] >= 12 and visual["chipHeight"] >= 30, visual
    assert visual["readerSize"] >= 13, visual
    assert visual["overviewSize"] >= 12 and visual["navSize"] >= 13, visual
    assert visual["footerCommentSize"] >= 14 and visual["footerChipSize"] >= 12, visual
    assert visual["chips"] <= 3 and visual["chipsFit"], visual
    assert visual["readerRatio"] < 0.8, visual
    assert visual["readerBackground"] != visual["accent"], visual
    assert visual["objectFit"] == "contain", visual
    assert visual["pageWidth"] >= 44 and visual["pageHeight"] >= 44, visual
    assert page.locator(".mrm-footer-more").count() >= 2
    controller = page.locator("#pagetual-sideController")
    if controller.count():
        assert controller.is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
    assert page.locator("#mrm-panel-launcher").is_hidden()

    # Density presets are persistent and switch the live grid without rebuilding cards.
    page.locator("[data-overview-density='comfortable']").click()
    page.wait_for_timeout(80)
    assert page.locator(".mrm-card-grid").evaluate("node => getComputedStyle(node).gridTemplateColumns.split(' ').length") == 4
    page.locator("[data-overview-density='compact']").click()
    page.wait_for_timeout(80)
    assert page.locator(".mrm-card-grid").evaluate("node => getComputedStyle(node).gridTemplateColumns.split(' ').length") == 6
    page.locator("[data-overview-density='balanced']").click()
    page.wait_for_timeout(80)
    assert page.locator(".mrm-card-grid").evaluate("node => getComputedStyle(node).gridTemplateColumns.split(' ').length") == 5
    assert page.evaluate("JSON.parse(localStorage.getItem('mrm-reimagined-v1:preferences')).grid.density") == "balanced"

    # Read state is visible, reversible, and does not fade the whole card.
    first_visible = page.locator(".mrm-card:not([hidden])").first
    read_toggle = first_visible.locator(".mrm-card-read-toggle")
    read_toggle.click()
    page.wait_for_timeout(80)
    assert "mrm-is-read" in (first_visible.get_attribute("class") or "")
    assert "Read" in first_visible.locator(".mrm-card-state-badge").inner_text()
    assert first_visible.evaluate("node => getComputedStyle(node).opacity") == "1"
    read_toggle.click()
    page.wait_for_timeout(80)
    assert "mrm-is-read" not in (first_visible.get_attribute("class") or "")

    english_quick = page.locator("[data-overview-toggle='onlyEnglish']")
    english_quick.click()
    page.wait_for_timeout(100)
    assert english_quick.get_attribute("aria-pressed") == "true"
    assert 1 <= page.locator(".mrm-card:not([hidden])").count() < total
    english_quick.click()
    page.wait_for_timeout(100)

    page.click(".mrm-overview-filter-button")
    page.wait_for_selector("#mrm-control-panel:not([hidden])")
    panel_text_size = page.get_by_text("Only English", exact=True).evaluate("node => parseFloat(getComputedStyle(node).fontSize)")
    panel_chip = page.locator("#mrm-active-filters .mrm-filter-chip").first
    panel_chip_size = panel_chip.evaluate("node => parseFloat(getComputedStyle(node).fontSize)")
    panel_chip_geometry = panel_chip.evaluate(
        """node => {
          const rect = node.getBoundingClientRect();
          const remove = node.querySelector('.mrm-filter-chip-remove')?.getBoundingClientRect();
          const label = node.querySelector('.mrm-filter-chip-label')?.getBoundingClientRect();
          return { width: rect.width, removeWidth: remove?.width || 0, removeRight: remove?.right || 0, right: rect.right, labelWidth: label?.width || 0 };
        }"""
    )
    assert panel_text_size >= 15 and panel_chip_size >= 12, (panel_text_size, panel_chip_size)
    assert panel_chip_geometry["removeWidth"] >= 16 and panel_chip_geometry["removeRight"] <= panel_chip_geometry["right"] + 1, panel_chip_geometry
    initially_visible = page.locator(".mrm-card:not([hidden])").count()
    assert initially_visible < total, (initially_visible, total)
    assert page.locator("#mrm-active-filters .mrm-filter-chip").count() >= 1

    page.click("[data-panel-action='clear-filters']")
    page.wait_for_timeout(150)
    assert page.locator(".mrm-card:not([hidden])").count() == total
    assert page.locator("#mrm-launcher-count").is_hidden()
    assert page.locator(".mrm-overview-active-filters").is_hidden()

    page.get_by_text("Only English", exact=True).locator("..").locator("input").check()
    page.wait_for_timeout(150)
    english_visible = page.locator(".mrm-card:not([hidden])").count()
    assert 1 <= english_visible < total, english_visible

    page.locator("#mrm-live-search").fill("hardcore")
    page.wait_for_timeout(150)
    searched = page.locator(".mrm-card:not([hidden])").count()
    assert 1 <= searched < english_visible, searched

    # A raw dynamic archive insertion should be enhanced exactly once, then settle.
    before = page.locator(".mrm-card").count()
    page.evaluate(
        """() => {
          const original = document.querySelector('.mrm-card');
          const clone = original.cloneNode(true);
          clone.id = 'post-dynamic-smoke';
          clone.removeAttribute('data-mrm-enhanced');
          clone.removeAttribute('data-mrm-url');
          clone.classList.remove('mrm-card', 'mrm-is-read');
          clone.querySelector('.entry-footer')?.replaceChildren();
          clone.querySelector('.entry-content')?.classList.remove('mrm-card-cover');
          const link = clone.querySelector('.entry-title-link, h2 a, a[href]');
          if (link) { link.href = 'https://myreadingmanga.info/dynamic-smoke/'; link.textContent = 'Dynamic Smoke Entry'; }
          document.querySelector('.content-archive, .archive-content').append(clone);
        }"""
    )
    page.wait_for_function("before => document.querySelectorAll('.mrm-card').length === before + 1", arg=before)
    assert page.locator("[data-mrm-url$='/dynamic-smoke/']").count() == 1
    assert wait_for_article_quiescence(page) == 0
    assert not errors, errors
    page.close()



def pagetual_smoke(browser, source: str) -> None:
    page = browser.new_page(viewport={"width": 1200, "height": 850})
    errors = install(page, (FIXTURES / "mrm-home.html").read_text(encoding="utf-8"), source)
    page.wait_for_selector(".mrm-card-grid .mrm-card")
    initial = page.locator(".mrm-card").count()

    # Keep a no-match filter active while PageTual inserts a hidden source page.
    page.locator("#mrm-overview-search").fill("page-tual-no-match")
    page.wait_for_timeout(180)
    assert page.locator(".mrm-card:not([hidden])").count() == 0

    page.evaluate(
        """() => {
          const cleanClone = (suffix, title) => {
            const clone = document.querySelector('.mrm-card').cloneNode(true);
            clone.id = `pagetual-${suffix}`;
            clone.removeAttribute('data-mrm-enhanced');
            clone.removeAttribute('data-mrm-url');
            clone.classList.remove('mrm-card', 'mrm-is-read');
            clone.querySelector('.entry-footer')?.replaceChildren();
            clone.querySelector('.entry-content')?.classList.remove('mrm-card-cover');
            const link = clone.querySelector('.entry-title-link, h2 a, a[href]');
            link.href = `https://myreadingmanga.info/pagetual-${suffix}/`;
            link.textContent = title;
            return clone;
          };
          const source = document.createElement('section');
          source.id = 'pagetual-hidden-source';
          source.hidden = true;
          source.append(cleanClone('alpha', 'PageTual Alpha'), cleanClone('beta', 'PageTual Beta'));
          document.querySelector('.content-archive, .archive-content').append(source);
          const bar = document.createElement('div');
          bar.id = 'pagetual_pageBar_smoke';
          bar.className = 'pagetual_pageBar';
          bar.innerHTML = '<span>Page 2 loaded</span>';
          document.querySelector('.mrm-card-grid').append(bar);
          window.postMessage({ command: 'pagetual', action: 'insert' }, '*');
        }"""
    )
    page.wait_for_function("initial => document.querySelectorAll('.mrm-card').length === initial + 2", arg=initial)
    assert page.locator("#pagetual-hidden-source article.post.entry").count() == 0
    assert page.locator(".mrm-card:not([hidden])").count() == 0
    page_bar = page.locator("#pagetual_pageBar_smoke")
    assert page_bar.is_visible()
    bar_geometry = page_bar.evaluate(
        """node => { const rect = node.getBoundingClientRect(); return { width: rect.width, minHeight: rect.height, gridColumn: getComputedStyle(node).gridColumn }; }"""
    )
    assert bar_geometry["width"] >= 900 and bar_geometry["minHeight"] >= 44, bar_geometry

    page.locator(".mrm-overview-clear").click()
    page.wait_for_timeout(160)
    assert page.locator(".mrm-card:not([hidden])").count() == initial + 2

    # Reinsert one canonical URL through the custom-event path. It must be removed as a duplicate.
    page.evaluate(
        """() => {
          const duplicate = document.querySelector('[data-mrm-url$="/pagetual-alpha/"]').cloneNode(true);
          duplicate.removeAttribute('data-mrm-enhanced');
          duplicate.removeAttribute('data-mrm-url');
          duplicate.classList.remove('mrm-card');
          duplicate.querySelector('.entry-footer')?.replaceChildren();
          duplicate.querySelector('.entry-content')?.classList.remove('mrm-card-cover');
          const source = document.createElement('div');
          source.id = 'pagetual-duplicate-source';
          source.hidden = true;
          source.append(duplicate);
          document.querySelector('.content-archive, .archive-content').append(source);
          document.dispatchEvent(new CustomEvent('pagetual:insert', { detail: { root: source } }));
        }"""
    )
    page.wait_for_timeout(220)
    assert page.locator(".mrm-card").count() == initial + 2
    assert page.locator("#pagetual-duplicate-source article.post.entry").count() == 0
    assert wait_for_article_quiescence(page) == 0
    assert not errors, errors
    page.close()


def mobile_layout_smoke(browser, source: str) -> None:
    page = browser.new_page(viewport={"width": 390, "height": 900})
    errors = install(page, (FIXTURES / "mrm-home.html").read_text(encoding="utf-8"), source)
    page.wait_for_selector(".mrm-card-grid .mrm-card:not([hidden])")
    geometry = page.locator(".mrm-card-grid").evaluate(
        """grid => {
          const rect = grid.getBoundingClientRect();
          const cards = [...grid.querySelectorAll('.mrm-card:not([hidden])')].slice(0, 4).map(card => {
            const cardRect = card.getBoundingClientRect();
            return { x: Math.round(cardRect.x), width: cardRect.width };
          });
          return { width: rect.width, cards, scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth };
        }"""
    )
    assert geometry["width"] >= 360, geometry
    assert min(card["width"] for card in geometry["cards"]) >= 160, geometry
    assert len({card["x"] for card in geometry["cards"]}) >= 2, geometry
    assert geometry["scrollWidth"] <= geometry["viewport"] + 1, geometry
    page.close()

    post = browser.new_page(viewport={"width": 390, "height": 900})
    errors.extend(install(post, (FIXTURES / "mrm-post.html").read_text(encoding="utf-8"), source))
    post.wait_for_selector(".img-myreadingmanga")
    image_width = post.locator(".img-myreadingmanga").first.evaluate("image => image.getBoundingClientRect().width")
    assert image_width >= 360, image_width
    assert post.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
    assert not errors, errors
    post.close()


def search_smoke(browser, source: str) -> None:
    page = browser.new_page(viewport={"width": 1200, "height": 800})
    errors = install(page, (FIXTURES / "mrm-search.html").read_text(encoding="utf-8"), source)
    page.wait_for_selector("#mrm-panel-launcher", state="attached")
    page.click(".mrm-overview-filter-button")
    page.wait_for_selector("#mrm-native-search-controls:not([hidden])")
    assert page.locator("#mrm-native-sort option").count() >= 4
    assert page.get_by_text("Apply filters on site", exact=True).count() == 1

    facet_groups = page.locator(".mrm-facet-group")
    assert facet_groups.count() >= 3
    facet_groups.first.locator("summary").click()
    show_all = facet_groups.first.get_by_text("Show all", exact=True)
    if show_all.is_visible():
        show_all.click()
        page.wait_for_selector("#mrm-facet-modal")
        assert page.locator(".mrm-facet-modal-pagination").is_visible()
        page.locator("#mrm-facet-modal [data-modal-close]").click()
    assert not errors, errors
    page.close()


def reader_smoke(browser, source: str) -> None:
    page = browser.new_page(viewport={"width": 390, "height": 900})
    preferences = {
        "uiEnabled": False,
        "filters": {"query": "", "hideRead": False, "onlyEnglish": False, "sort": "default", "include": {}, "exclude": {}},
        "reader": {"view": "paged", "width": "comfort", "fit": "width", "direction": "ltr", "thumbnails": True, "autoHideToolbar": True},
    }
    errors = install(page, (FIXTURES / "mrm-post.html").read_text(encoding="utf-8"), source, preferences)
    page.evaluate(
        "pixel => document.querySelectorAll('.img-myreadingmanga').forEach((img, index) => { img.src = `${pixel}#${index + 1}`; })",
        PIXEL,
    )
    page.wait_for_selector("#mrm-post-actions")
    assert page.locator("html").get_attribute("class").find("mrm-ui-disabled") >= 0
    assert page.locator("#mrm-ui-recovery").is_visible()

    page.click("#mrm-post-actions .mrm-primary-action")
    page.wait_for_selector(".mrm-reader-modal:not([hidden]) .mrm-reader-page")
    page_count = page.locator(".mrm-reader-page").count()
    assert page_count >= 20, page_count
    assert page.locator("[data-reader-action='previous-page']").first.is_disabled()
    assert not page.locator("[data-reader-action='next-page']").first.is_disabled()
    assert page.locator(".mrm-reader-mobile-zones").is_visible()

    page.locator("[data-reader-action='next-page']").first.click()
    page.wait_for_timeout(120)
    assert (page.locator("#mrm-reader-page-count").inner_text() or "").startswith("2 /")
    progress = page.evaluate("JSON.parse(localStorage.getItem('mrm-reimagined-v1:reader-progress'))")
    assert progress and next(iter(progress.values()))["pageIndex"] == 1, progress
    page.keyboard.press("Escape")
    assert page.locator(".mrm-reader-modal").is_hidden()
    page.click("#mrm-post-actions .mrm-primary-action")
    page.wait_for_selector(".mrm-reader-modal:not([hidden]) .mrm-reader-page")
    page.wait_for_timeout(120)
    assert (page.locator("#mrm-reader-page-count").inner_text() or "").startswith("2 /")

    page.locator(".mrm-reader-modal [data-reader-action=\"comments\"]").click()
    assert page.locator(".mrm-reader-comments").is_visible()
    page.locator(".mrm-reader-modal [data-reader-action=\"comments\"]").click()

    page.keyboard.press("c")
    assert page.locator(".mrm-reader-modal").get_attribute("data-view") == "strip"
    page.keyboard.press("w")
    assert page.locator(".mrm-reader-modal").get_attribute("data-width") == "wide"
    page.keyboard.press("Escape")
    assert page.locator(".mrm-reader-modal").is_hidden()
    assert not errors, errors
    page.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--executable", default="/usr/bin/chromium", help="Chromium executable path")
    args = parser.parse_args()
    source = runtime_source()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=args.executable,
            args=["--no-sandbox"],
        )
        try:
            archive_smoke(browser, source)
            pagetual_smoke(browser, source)
            mobile_layout_smoke(browser, source)
            search_smoke(browser, source)
            reader_smoke(browser, source)
        finally:
            browser.close()
    print("MRM Chromium smoke passed: unified shell, archive hierarchy, readable cards, compact metadata/actions, pagination/footer, mobile geometry, native facets, stable dynamic inserts, PageTual hidden-source/duplicate/filter reconciliation, unclipped chips, disabled-UI reader, comments, mobile zones, and keyboard controls.")


if __name__ == "__main__":
    main()
