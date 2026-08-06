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
    page.add_script_tag(content=STORAGE_SHIM)
    if preferences is not None:
        page.evaluate(
            "prefs => localStorage.setItem('mrm-reimagined-v1:preferences', JSON.stringify(prefs))",
            preferences,
        )
    page.add_script_tag(content=source)
    return errors


def archive_smoke(browser, source: str) -> None:
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = install(page, (FIXTURES / "mrm-home.html").read_text(encoding="utf-8"), source)
    page.wait_for_selector("#mrm-panel-launcher")
    total = page.locator(".mrm-card").count()
    assert total >= 70, total

    page.click("#mrm-panel-launcher")
    page.wait_for_selector("#mrm-control-panel:not([hidden])")
    initially_visible = page.locator(".mrm-card:not([hidden])").count()
    assert initially_visible < total, (initially_visible, total)
    assert page.locator("#mrm-active-filters .mrm-filter-chip").count() >= 1

    page.click("[data-panel-action='clear-filters']")
    page.wait_for_timeout(150)
    assert page.locator(".mrm-card:not([hidden])").count() == total

    page.get_by_text("Only English", exact=True).locator("..").locator("input").check()
    page.wait_for_timeout(150)
    english_visible = page.locator(".mrm-card:not([hidden])").count()
    assert 1 <= english_visible < total, english_visible

    page.locator("#mrm-live-search").fill("hardcore")
    page.wait_for_timeout(150)
    searched = page.locator(".mrm-card:not([hidden])").count()
    assert 1 <= searched < english_visible, searched

    # A dynamic archive insertion should be enhanced by the observer pipeline.
    before = page.locator(".mrm-card").count()
    page.evaluate(
        """() => {
          const original = document.querySelector('article');
          const clone = original.cloneNode(true);
          clone.id = 'post-dynamic-smoke';
          const link = clone.querySelector('.entry-title-link, h2 a, a[href]');
          if (link) { link.href = '/dynamic-smoke/'; link.textContent = 'Dynamic Smoke Entry'; }
          original.parentElement.append(clone);
          document.dispatchEvent(new CustomEvent('pagetual:insert'));
        }"""
    )
    page.wait_for_timeout(250)
    assert page.locator(".mrm-card").count() == before + 1
    assert not errors, errors
    page.close()


def search_smoke(browser, source: str) -> None:
    page = browser.new_page(viewport={"width": 1200, "height": 800})
    errors = install(page, (FIXTURES / "mrm-search.html").read_text(encoding="utf-8"), source)
    page.wait_for_selector("#mrm-panel-launcher")
    page.click("#mrm-panel-launcher")
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

    page.locator(".mrm-reader-modal [data-reader-action=\"comments\"]").click()
    assert page.locator(".mrm-reader-comments").is_visible()
    page.locator(".mrm-reader-modal [data-reader-action=\"comments\"]").click()

    page.keyboard.press("c")
    assert page.locator(".mrm-reader-modal").get_attribute("data-view") == "strip-gaps"
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
            search_smoke(browser, source)
            reader_smoke(browser, source)
        finally:
            browser.close()
    print("MRM Chromium smoke passed: archive, native facets, dynamic inserts, disabled-UI reader, comments, mobile zones, and keyboard controls.")


if __name__ == "__main__":
    main()
