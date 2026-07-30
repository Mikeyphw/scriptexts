#!/usr/bin/env python3
"""Repo-wide Playwright smoke runner for generated userscripts.

This runner is intentionally optional. Normal devtool validation only compiles this
file and validates smoke configs; browser execution happens when a developer runs
it manually or sets PLAYWRIGHT_SMOKE=1 in an overlay validator.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import functools
import html
import json
import os
import re
import sys
import textwrap
import threading
import time
from dataclasses import dataclass
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse


class SmokeError(RuntimeError):
    pass


@dataclass(frozen=True)
class RepoPaths:
    root: Path
    builder_root: Path
    config_path: Path


@dataclass(frozen=True)
class ViewportSpec:
    id: str
    width: int
    height: int


def find_repo_root(start: Path) -> Path:
    cur = start.resolve()
    for candidate in [cur, *cur.parents]:
        if (candidate / "repo-manifest.json").is_file() and (candidate / "userscripts").is_dir():
            return candidate
    raise SmokeError(f"could not find repo root above {start}")


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SmokeError(f"missing config: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SmokeError(f"invalid JSON in {path}: {exc}") from exc


def resolve_paths(builder: str, config: str | None) -> RepoPaths:
    root = find_repo_root(Path.cwd())
    if config:
        config_path = (root / config).resolve() if not Path(config).is_absolute() else Path(config).resolve()
        data = load_json(config_path)
        builder_rel = data.get("builderRoot") or "userscripts/builders/content-site-modernizer"
        return RepoPaths(root=root, builder_root=(root / builder_rel).resolve(), config_path=config_path)
    builders = {
        "content-site-modernizer": "userscripts/builders/content-site-modernizer",
    }
    builder_rel = builders.get(builder, builder)
    builder_root = (root / builder_rel).resolve()
    return RepoPaths(root=root, builder_root=builder_root, config_path=builder_root / "smoke.config.json")


def rel_path(root: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else root / path


def repo_rel(root: Path, value: Path) -> str:
    try:
        return value.resolve().relative_to(root.resolve()).as_posix()
    except Exception:
        return str(value)


def resolve_browser_executable(root: Path, executable: str | None) -> str | None:
    value = executable or os.environ.get("PLAYWRIGHT_EXECUTABLE_PATH")
    if not value:
        return None
    resolved = rel_path(root, value)
    return str(resolved)



# Browser executable discovery marker for shell parity tests:
# command -v chromium || command -v chromium-browser || command -v google-chrome-stable || command -v google-chrome

def describe_browser_executable(root: Path, executable: str | None) -> str:
    resolved = resolve_browser_executable(root, executable)
    if not resolved:
        return "Playwright-managed bundled browser"
    path = Path(resolved)
    if not path.exists():
        return f"executable {resolved!r} (missing)"
    if not os.access(path, os.X_OK):
        return f"executable {resolved!r} (not executable)"
    return f"executable {resolved!r}"


def safe_slug(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip())
    return value.strip("-._") or "artifact"


def utc_now_iso() -> str:
    return _dt.datetime.now(tz=_dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def configured_viewports(config_data: dict[str, Any]) -> dict[str, ViewportSpec]:
    raw = config_data.get("viewports") or [
        {"id": "mobile", "width": 390, "height": 900},
        {"id": "desktop", "width": 1280, "height": 900},
    ]
    out: dict[str, ViewportSpec] = {}
    for item in raw:
        try:
            spec = ViewportSpec(str(item["id"]), int(item["width"]), int(item["height"]))
        except Exception as exc:
            raise SmokeError(f"invalid viewport entry: {item!r}") from exc
        if spec.id in out:
            raise SmokeError(f"duplicate viewport id: {spec.id}")
        out[spec.id] = spec
    return out


def select_viewports(config_data: dict[str, Any], args: argparse.Namespace) -> list[ViewportSpec]:
    available = configured_viewports(config_data)
    if args.viewports:
        missing = sorted(set(args.viewports) - set(available))
        if missing:
            raise SmokeError(f"unknown viewport id(s): {', '.join(missing)}")
        return [available[item] for item in args.viewports]
    if args.matrix:
        ids = config_data.get("defaultMatrixViewports") or list(available)
        missing = sorted(set(ids) - set(available))
        if missing:
            raise SmokeError(f"defaultMatrixViewports references unknown viewport(s): {', '.join(missing)}")
        return [available[item] for item in ids]
    return [ViewportSpec("custom", int(args.width), int(args.height))]


def validate_config(paths: RepoPaths, config_data: dict[str, Any]) -> list[str]:
    problems: list[str] = []
    if config_data.get("schemaVersion") != 1:
        problems.append("schemaVersion must be 1")
    if not isinstance(config_data.get("sites"), list) or not config_data["sites"]:
        problems.append("sites must be a non-empty list")
        return problems

    try:
        configured_viewports(config_data)
    except SmokeError as exc:
        problems.append(str(exc))

    seen: set[str] = set()
    for site in config_data["sites"]:
        sid = site.get("id")
        if not sid or not isinstance(sid, str):
            problems.append("site is missing string id")
            continue
        if sid in seen:
            problems.append(f"duplicate site id: {sid}")
        seen.add(sid)
        script = site.get("script")
        if not script:
            problems.append(f"{sid}: missing script")
        elif not rel_path(paths.root, script).is_file():
            problems.append(f"{sid}: script not found: {script}")
        fixtures = site.get("fixtures")
        if not isinstance(fixtures, list) or not fixtures:
            problems.append(f"{sid}: fixtures must be a non-empty list")
        else:
            for fixture in fixtures:
                fid = fixture.get("id")
                fpath = fixture.get("path")
                if not fid:
                    problems.append(f"{sid}: fixture missing id")
                if not fpath:
                    problems.append(f"{sid}/{fid}: fixture missing path")
                elif not rel_path(paths.root, fpath).is_file():
                    problems.append(f"{sid}/{fid}: fixture not found: {fpath}")
        pagetual = site.get("pagetual")
        if pagetual:
            fpath = pagetual.get("fixture")
            if not fpath:
                problems.append(f"{sid}: pagetual fixture missing")
            elif not rel_path(paths.root, fpath).is_file():
                problems.append(f"{sid}: pagetual fixture not found: {fpath}")
        live = site.get("live")
        if live:
            url = live.get("url")
            parsed = urlparse(str(url or ""))
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                problems.append(f"{sid}: live.url must be an absolute http(s) URL")
            expect = live.get("expect")
            if expect is not None and not isinstance(expect, dict):
                problems.append(f"{sid}: live.expect must be an object when present")
    return problems


def write_result(output_dir: Path, name: str, payload: dict[str, Any]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / name
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path


def write_text(output_dir: Path, name: str, text: str) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / name
    path.write_text(text, encoding="utf-8")
    return path


def install_userscript_mocks(page: Any) -> None:
    page.add_init_script(
        """
        (() => {
          const store = new Map();
          window.unsafeWindow = window;
          window.GM_addStyle = window.GM_addStyle || ((css) => {
            const style = document.createElement('style');
            style.textContent = String(css || '');
            document.documentElement.appendChild(style);
            return style;
          });
          window.GM_registerMenuCommand = window.GM_registerMenuCommand || (() => 0);
          window.GM_getValue = window.GM_getValue || ((key, fallback) => store.has(key) ? store.get(key) : fallback);
          window.GM_setValue = window.GM_setValue || ((key, value) => { store.set(key, value); });
          window.GM_deleteValue = window.GM_deleteValue || ((key) => { store.delete(key); });
        })();
        """
    )


def site_by_id(config_data: dict[str, Any], ids: list[str], all_sites: bool) -> list[dict[str, Any]]:
    sites = config_data["sites"]
    if all_sites:
        return sites
    wanted = set(ids)
    if not wanted:
        default_ids = config_data.get("defaultSites") or [site["id"] for site in sites[:3]]
        wanted = set(default_ids)
    selected = [site for site in sites if site["id"] in wanted]
    missing = wanted - {site["id"] for site in selected}
    if missing:
        raise SmokeError(f"unknown site id(s): {', '.join(sorted(missing))}")
    return selected


def default_feed_expect(site: dict[str, Any]) -> dict[str, Any]:
    for fixture in site.get("fixtures", []):
        expect = fixture.get("expect")
        if int((expect or {}).get("minCards", 0) or 0) > 0:
            return dict(expect or {})
    return {"minCards": 1, "selectors": []}


def live_fixture_for_site(site: dict[str, Any], live_interactions: bool, live_drift: bool = False) -> dict[str, Any]:
    live = site.get("live")
    if not live:
        raise SmokeError(f"{site.get('id', '<unknown>')}: missing live smoke URL")
    if live_drift:
        # Drift mode keeps the page smoke alive long enough to report selector/card
        # deltas. It should not fail just because a category lane or duration badge
        # moved on the live site; those are reported as drift severities instead.
        expect = dict(live.get("expect") or {})
        expect.setdefault("minCards", 0)
        expect.setdefault("selectors", [])
    else:
        expect = default_feed_expect(site)
        expect.update(live.get("expect") or {})
    return {
        "id": live.get("id") or "live-home",
        "url": live["url"],
        "live": True,
        "liveDrift": bool(live_drift),
        "allowConsoleErrors": bool(live.get("allowConsoleErrors", True)),
        "assertDrawer": bool(live.get("assertDrawer", True)),
        "assertInteractions": bool(live_interactions and live.get("assertInteractions", True)),
        "simulatePageTual": bool(live.get("simulatePageTual", False)),
        "expect": expect,
    }


def fixtures_for_site(site: dict[str, Any], args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.live:
        return [live_fixture_for_site(site, bool(args.live_interactions), bool(args.live_drift))]
    return list(site.get("fixtures", []))


def output_dir_for_run(paths: RepoPaths, config_data: dict[str, Any], args: argparse.Namespace) -> Path:
    configured = str(args.output or "")
    if args.live and configured == "smoke-results/content-site-modernizer":
        live_output = (config_data.get("evidence") or {}).get("liveOutput") or "smoke-results/content-site-modernizer-live"
        return rel_path(paths.root, live_output)
    return rel_path(paths.root, configured)


def live_host(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def install_live_network_guards(context: Any, page_host: str, allow_third_party: bool) -> None:
    if allow_third_party:
        return
    allowed = {page_host.lstrip("www.")}

    def guarded_route(route: Any) -> None:
        request = route.request
        req_host = live_host(request.url).lstrip("www.")
        resource_type = request.resource_type
        is_same_site = not req_host or req_host in allowed or req_host.endswith("." + next(iter(allowed)))
        if not is_same_site:
            route.abort()
            return
        if resource_type in {"image", "media", "font"}:
            route.abort()
            return
        route.continue_()

    context.route("**/*", guarded_route)


class QuietStaticHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        return


def start_static_server(root: Path) -> tuple[ThreadingHTTPServer, str]:
    handler = functools.partial(QuietStaticHandler, directory=str(root))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, name="scriptexts-smoke-http", daemon=True)
    thread.start()
    host, port = server.server_address[:2]
    return server, f"http://{host}:{port}"


def page_url(root: Path, path: Path, base_url: str, use_file_url: bool) -> str:
    resolved = path.resolve()
    if use_file_url:
        return resolved.as_uri()
    rel = resolved.relative_to(root.resolve()).as_posix()
    return f"{base_url}/{quote(rel)}"


def wait_for_selector(page: Any, selector: str, timeout: int) -> None:
    try:
        page.wait_for_selector(selector, timeout=timeout)
    except Exception as exc:  # Playwright raises TimeoutError from its own package.
        raise SmokeError(f"missing selector after injection: {selector}") from exc


def neutralize_fixture_blockers(page: Any) -> None:
    """Disable capture-only ad/popup layers that are present in local fixtures.

    The smoke runner validates our userscript UI, not third-party clickjacking
    overlays preserved by SingleFile captures. Keep this narrow and reversible:
    it only runs in the Playwright page and never changes generated scripts.
    """
    try:
        page.add_style_tag(content="""
          #lkai,
          [href*="workdeadlinededicate.com"],
          [id^="alc"],
          [class*="popunder"],
          [class*="popup"],
          .adsbygoogle {
            pointer-events: none !important;
          }
          #lkai,
          [href*="workdeadlinededicate.com"] {
            display: none !important;
            visibility: hidden !important;
          }
        """)
        page.evaluate(
            """
            () => {
              for (const node of document.querySelectorAll('#lkai,[href*="workdeadlinededicate.com"],[id^="alc"]')) {
                if (!(node instanceof HTMLElement)) continue;
                node.style.setProperty('pointer-events', 'none', 'important');
                if (node.matches('#lkai,[href*="workdeadlinededicate.com"]')) {
                  node.style.setProperty('display', 'none', 'important');
                  node.style.setProperty('visibility', 'hidden', 'important');
                }
              }
            }
            """
        )
    except Exception:
        # Fixture cleanup must not mask the actual assertion result.
        return


def click_first_visible(page: Any, selector: str, timeout: int) -> dict[str, Any]:
    """Click the first visible element matching a selector list.

    Playwright's normal click action is intentionally strict, but captured pages
    often contain hidden desktop buttons before visible mobile buttons, plus
    preserved ad overlays that intercept pointer events. DOM-clicking the first
    visible target keeps the smoke assertion focused on userscript behavior.
    """
    neutralize_fixture_blockers(page)
    deadline = time.time() + timeout / 1000
    last: dict[str, Any] = {"clicked": False, "candidates": 0, "visible": 0}
    while time.time() < deadline:
        last = page.evaluate(
            """
            (selector) => {
              const candidates = Array.from(document.querySelectorAll(selector));
              const visible = candidates.filter((node) => {
                if (!(node instanceof HTMLElement)) return false;
                const style = getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
                const rect = node.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              });
              const target = visible[0];
              if (!target) return { clicked: false, candidates: candidates.length, visible: visible.length };
              target.scrollIntoView({ block: 'center', inline: 'center' });
              try { target.focus({ preventScroll: true }); } catch {}
              target.click();
              return {
                clicked: true,
                candidates: candidates.length,
                visible: visible.length,
                tag: target.tagName.toLowerCase(),
                text: (target.textContent || target.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 80)
              };
            }
            """,
            selector,
        )
        if last.get("clicked"):
            return last
        page.wait_for_timeout(100)
    raise SmokeError(f"no visible clickable target for selector: {selector}; candidates={last.get('candidates', 0)} visible={last.get('visible', 0)}")


def fill_first_visible(page: Any, selector: str, value: str, timeout: int) -> dict[str, Any]:
    """Fill the first visible input matching a selector list.

    Locator.first.fill() can grab a hidden desktop or stale drawer input when a
    selector list spans desktop/mobile controls. Use DOM visibility so mobile
    smoke runs fill the same control a user can see.
    """
    deadline = time.time() + timeout / 1000
    last: dict[str, Any] = {"filled": False, "candidates": 0, "visible": 0}
    while time.time() < deadline:
        last = page.evaluate(
            """
            ({ selector, value }) => {
              const candidates = Array.from(document.querySelectorAll(selector));
              const visible = candidates.filter((node) => {
                if (!(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement)) return false;
                const style = getComputedStyle(node);
                if (style.display === 'none' || style.visibility === 'hidden') return false;
                const rect = node.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
              });
              const target = visible[0];
              if (!target) return { filled: false, candidates: candidates.length, visible: visible.length };
              target.focus({ preventScroll: true });
              target.value = value;
              target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
              target.dispatchEvent(new Event('change', { bubbles: true }));
              return { filled: true, candidates: candidates.length, visible: visible.length };
            }
            """,
            {"selector": selector, "value": value},
        )
        if last.get("filled"):
            return last
        page.wait_for_timeout(100)
    raise SmokeError(f"no visible fillable target for selector: {selector}; candidates={last.get('candidates', 0)} visible={last.get('visible', 0)}")


def visible_feed_status_text(page: Any) -> tuple[int, str]:
    data = page.evaluate(
        """
        () => {
          const nodes = Array.from(document.querySelectorAll('[data-csm-feed-status-text]'));
          const visible = nodes.filter((node) => {
            const box = node.closest('.csm-feed-status') || node;
            if (!(box instanceof HTMLElement) || box.hidden) return false;
            const style = getComputedStyle(box);
            const rect = box.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          });
          return {
            count: visible.length,
            text: visible.map((node) => (node.textContent || '').replace(/\\s+/g, ' ').trim()).filter(Boolean).join(' | ')
          };
        }
        """
    )
    return int(data.get("count", 0) or 0), str(data.get("text") or "")


def evaluate_common_assertions(page: Any, fixture: dict[str, Any], timeout: int) -> dict[str, Any]:
    expect = fixture.get("expect", {})
    wait_for_selector(page, expect.get("shellSelector", "html.csm-modernized, body.csm-modernized-body"), timeout)

    selectors: list[str] = list(expect.get("selectors") or [])
    for selector in selectors:
        wait_for_selector(page, selector, timeout)

    min_cards = int(expect.get("minCards", 0) or 0)
    card_selector = expect.get("cardSelector", ".csm-card")
    cards = page.locator(card_selector).count()
    if cards < min_cards:
        raise SmokeError(f"expected at least {min_cards} cards, found {cards} via {card_selector}")

    forbidden = []
    for selector in expect.get("forbiddenSelectors") or []:
        count = page.locator(selector).count()
        if count:
            forbidden.append({"selector": selector, "count": count})
    if forbidden:
        raise SmokeError(f"forbidden selectors present: {forbidden}")

    return {"cards": cards, "selectors": selectors, "forbidden": forbidden}


def baseline_feed_fixture(site: dict[str, Any]) -> dict[str, Any]:
    for fixture in site.get("fixtures", []):
        expect = fixture.get("expect") or {}
        if int(expect.get("minCards", 0) or 0) > 0:
            return fixture
    fixtures = site.get("fixtures") or []
    return fixtures[0] if fixtures else {"id": "<none>", "expect": {}}


def collect_card_samples(page: Any, card_selector: str, limit: int = 5) -> list[dict[str, str]]:
    try:
        samples = page.evaluate(
            """
            ({ cardSelector, limit }) => Array.from(document.querySelectorAll(cardSelector)).slice(0, limit).map((card) => {
              const link = card.querySelector && card.querySelector('a[href]');
              const image = card.querySelector && card.querySelector('img');
              const title = (card.textContent || image?.getAttribute('alt') || '').replace(/\\s+/g, ' ').trim().slice(0, 160);
              return {
                title,
                href: link ? link.href : '',
                image: image ? (image.currentSrc || image.src || image.getAttribute('src') || '') : ''
              };
            })
            """,
            {"cardSelector": card_selector, "limit": int(limit)},
        )
        return [dict(item) for item in samples if isinstance(item, dict)]
    except Exception:
        return []


def drift_severity_rank(severity: str) -> int:
    ranks = {"ok": 0, "info": 1, "low": 2, "medium": 3, "high": 4, "critical": 5}
    return ranks.get(severity, 0)


def live_drift_thresholds(config_data: dict[str, Any], site: dict[str, Any]) -> dict[str, Any]:
    live_smoke = config_data.get("liveSmoke") or {}
    defaults = {
        "minCardRatio": 0.5,
        "warnCardRatio": 0.75,
        "missingSelectorSeverity": "medium",
        "zeroCardsSeverity": "critical",
        "lowCardSeverity": "high",
    }
    defaults.update(live_smoke.get("driftReport") or {})
    defaults.update(((site.get("live") or {}).get("drift") or {}))
    return defaults


def evaluate_live_drift(
    page: Any,
    config_data: dict[str, Any],
    site: dict[str, Any],
    fixture: dict[str, Any],
    assertions: dict[str, Any],
) -> dict[str, Any]:
    baseline_fixture = baseline_feed_fixture(site)
    baseline_expect = dict(baseline_fixture.get("expect") or {})
    thresholds = live_drift_thresholds(config_data, site)
    baseline_min_cards = int(baseline_expect.get("minCards", 0) or 0)
    card_selector = baseline_expect.get("cardSelector") or fixture.get("expect", {}).get("cardSelector") or ".csm-card"
    live_cards = int(page.locator(card_selector).count())
    visible_cards = visible_count(page, card_selector)
    ratio = None
    if baseline_min_cards > 0:
        ratio = live_cards / baseline_min_cards

    selector_rows = []
    missing_selectors = []
    for selector in baseline_expect.get("selectors") or []:
        count = int(page.locator(selector).count())
        row = {"selector": selector, "count": count, "present": count > 0}
        selector_rows.append(row)
        if count == 0:
            missing_selectors.append(selector)

    notes: list[str] = []
    severity = "ok"
    if live_cards == 0 and baseline_min_cards > 0:
        severity = str(thresholds.get("zeroCardsSeverity", "critical"))
        notes.append(f"no live cards matched baseline selector {card_selector!r}")
    elif ratio is not None and ratio < float(thresholds.get("minCardRatio", 0.5)):
        severity = str(thresholds.get("lowCardSeverity", "high"))
        notes.append(f"live card count ratio {ratio:.2f} is below minimum {float(thresholds.get('minCardRatio', 0.5)):.2f}")
    elif ratio is not None and ratio < float(thresholds.get("warnCardRatio", 0.75)):
        severity = "medium"
        notes.append(f"live card count ratio {ratio:.2f} is below warning {float(thresholds.get('warnCardRatio', 0.75)):.2f}")

    if missing_selectors and drift_severity_rank(str(thresholds.get("missingSelectorSeverity", "medium"))) > drift_severity_rank(severity):
        severity = str(thresholds.get("missingSelectorSeverity", "medium"))
    if missing_selectors:
        notes.append("missing expected live selector(s): " + ", ".join(missing_selectors))

    if not notes:
        notes.append("live card and selector shape matches fixture baseline thresholds")

    return {
        "enabled": True,
        "severity": severity,
        "baselineFixture": baseline_fixture.get("id"),
        "baselineMinCards": baseline_min_cards,
        "baselineCardSelector": card_selector,
        "liveCards": live_cards,
        "visibleLiveCards": visible_cards,
        "ratio": ratio,
        "selectors": selector_rows,
        "missingSelectors": missing_selectors,
        "samples": collect_card_samples(page, card_selector),
        "notes": notes,
        "hardAssertions": assertions,
    }


def live_drift_should_fail(drift: dict[str, Any], threshold: str = "high") -> bool:
    return drift_severity_rank(str(drift.get("severity", "ok"))) >= drift_severity_rank(threshold)


def visible_count(page: Any, selector: str) -> int:
    return int(page.evaluate(
        """
        (selector) => Array.from(document.querySelectorAll(selector)).filter((node) => {
          if (!(node instanceof HTMLElement)) return false;
          const style = getComputedStyle(node);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length
        """,
        selector,
    ))


def wait_for_any_selector(page: Any, selectors: list[str], timeout: int) -> str:
    deadline = time.time() + timeout / 1000
    last_error = ""
    while time.time() < deadline:
        for selector in selectors:
            try:
                if page.locator(selector).count():
                    return selector
            except Exception as exc:
                last_error = str(exc)
        page.wait_for_timeout(100)
    detail = f" ({last_error})" if last_error else ""
    raise SmokeError(f"none of the expected selectors appeared: {selectors}{detail}")


def wait_until_count(page: Any, selector: str, predicate: str, expected: int, timeout: int) -> int:
    deadline = time.time() + timeout / 1000
    current = visible_count(page, selector)
    while time.time() < deadline:
        current = visible_count(page, selector)
        if predicate == "gte" and current >= expected:
            return current
        if predicate == "gt" and current > expected:
            return current
        if predicate == "lt" and current < expected:
            return current
        if predicate == "lte" and current <= expected:
            return current
        page.wait_for_timeout(100)
    raise SmokeError(f"visible count for {selector} did not become {predicate} {expected}; last={current}")


def search_input_selector() -> str:
    return ', '.join([
        '.csm-drawer[aria-hidden="false"] input[type="search"]',
        '#mop-scrim.mop-open #mop-drawer .mop-search-input[aria-label*="Filter"]',
        '#mop-scrim.mop-open #mop-drawer .mop-search-input:not([name="s"])',
        '#ptn-scrim.ptn-open #ptn-drawer .ptn-search-input[aria-label*="Filter"]',
        '#ptn-scrim.ptn-open #ptn-drawer .ptn-search-input:not([name="s"])',
    ])


def drawer_open_selectors() -> list[str]:
    return [
        '.csm-drawer[aria-hidden="false"]',
        '#mop-scrim.mop-open #mop-drawer',
        '#ptn-scrim.ptn-open #ptn-drawer',
    ]


def drawer_closed_selectors() -> list[str]:
    return [
        '.csm-drawer[aria-hidden="true"]',
        '#mop-scrim:not(.mop-open) #mop-drawer',
        '#ptn-scrim:not(.ptn-open) #ptn-drawer',
    ]


def assert_search_filter(page: Any, fixture: dict[str, Any], timeout: int) -> dict[str, Any]:
    expect = fixture.get("expect", {})
    card_selector = expect.get("cardSelector", ".csm-card")
    before_visible = visible_count(page, card_selector)
    if before_visible <= 1:
        return {"skipped": True, "reason": f"not enough visible cards for search filter: {before_visible}"}
    open_selector = '[data-action="open-search"], [data-mop-action="search"], [data-ptn-action="search"]'
    if not page.locator(open_selector).count():
        return {"skipped": True, "reason": f"search trigger absent: {open_selector}"}
    click_first_visible(page, open_selector, timeout)
    wait_for_any_selector(page, drawer_open_selectors(), timeout)
    input_sel = search_input_selector()
    wait_for_selector(page, input_sel, timeout)
    query = "zzzz-smoke-no-match-zzzz"
    fill_first_visible(page, input_sel, query, timeout)
    after_filtered = wait_until_count(page, card_selector, "lt", before_visible, timeout)
    hidden_count = int(page.locator('.csm-filter-hidden, .mop-filtered-out, .ptn-filtered-out').count())
    status_text = ""
    visible_status_count = 0
    deadline = time.time() + timeout / 1000
    while time.time() < deadline:
        visible_status_count, status_text = visible_feed_status_text(page)
        if visible_status_count == 0 or query in status_text:
            break
        page.wait_for_timeout(100)
    if visible_status_count > 0 and query not in status_text:
        raise SmokeError(f"search status did not mention query {query!r}: {status_text!r}")
    fill_first_visible(page, input_sel, "", timeout)
    restored = wait_until_count(page, card_selector, "gte", before_visible, timeout)
    page.keyboard.press("Escape")
    return {
        "query": query,
        "beforeVisibleCards": before_visible,
        "afterFilteredVisibleCards": after_filtered,
        "restoredVisibleCards": restored,
        "hiddenClassCount": hidden_count,
        "statusText": status_text,
        "visibleStatusCount": visible_status_count,
    }


def assert_load_more(page: Any, fixture: dict[str, Any], timeout: int) -> dict[str, Any]:
    expect = fixture.get("expect", {})
    card_selector = expect.get("cardSelector", ".csm-card")
    button_selector = '.csm-load-more:not([hidden])'
    if not page.locator(button_selector).count():
        return {"skipped": True, "reason": "visible shared load-more button absent"}
    before_visible = visible_count(page, card_selector)
    before_total = page.locator(card_selector).count()
    before_text = page.locator(button_selector).first.inner_text(timeout=timeout)
    click_first_visible(page, button_selector, timeout)
    after_visible = wait_until_count(page, card_selector, "gt", before_visible, timeout)
    after_text = page.locator(button_selector).first.inner_text(timeout=timeout) if page.locator(button_selector).count() else ""
    return {
        "beforeVisibleCards": before_visible,
        "afterVisibleCards": after_visible,
        "totalCards": before_total,
        "beforeButtonText": before_text,
        "afterButtonText": after_text,
    }


def assert_card_action_toggles(page: Any, fixture: dict[str, Any], timeout: int) -> dict[str, Any]:
    expect = fixture.get("expect", {})
    card_selector = expect.get("cardSelector", ".csm-card")
    result: dict[str, Any] = {}
    save_selector = '[data-mop-card-action="save"], [data-ptn-card-action="save"]'
    viewed_selector = '[data-mop-card-action="viewed"], [data-ptn-card-action="viewed"]'
    if page.locator(save_selector).count():
        save = page.locator(save_selector).first
        before_pressed = save.get_attribute("aria-pressed")
        click_first_visible(page, save_selector, timeout)
        deadline = time.time() + timeout / 1000
        active = False
        after_pressed = None
        while time.time() < deadline:
            after_pressed = save.get_attribute("aria-pressed")
            active = bool(save.evaluate("node => node.classList.contains('mop-active') || node.classList.contains('ptn-active')"))
            if after_pressed == "true" or active:
                break
            page.wait_for_timeout(100)
        if after_pressed != "true" and not active:
            raise SmokeError(f"card save action did not toggle active state; before aria-pressed={before_pressed!r} after={after_pressed!r}")
        result["save"] = {"beforeAriaPressed": before_pressed, "afterAriaPressed": after_pressed, "activeClass": active}
    else:
        result["save"] = {"skipped": True, "reason": "direct card save action absent"}

    if page.locator(viewed_selector).count():
        button = page.locator(viewed_selector).first
        click_first_visible(page, viewed_selector, timeout)
        deadline = time.time() + timeout / 1000
        viewed = False
        while time.time() < deadline:
            viewed = bool(button.evaluate("node => !!node.closest('.mop-viewed,.ptn-viewed,.csm-viewed') || node.classList.contains('mop-active') || node.classList.contains('ptn-active')"))
            if viewed:
                break
            page.wait_for_timeout(100)
        if not viewed:
            raise SmokeError("card viewed action did not mark the card as viewed")
        result["viewed"] = {"marked": True}
    else:
        # Shared-runtime cards do not expose a card button, but clicking the card link should write viewed state.
        changed = page.evaluate(
            """
            (cardSelector) => {
              const card = document.querySelector(cardSelector);
              const link = card && card.querySelector('a[href]');
              if (!card || !link) return { skipped: true, reason: 'card link absent' };
              const before = JSON.stringify(Object.fromEntries(Array.from({ length: localStorage.length }, (_, i) => {
                const key = localStorage.key(i);
                return [key, localStorage.getItem(key)];
              })));
              const stopNav = (event) => {
                if (event.target && event.target.closest && event.target.closest('a[href]') === link) event.preventDefault();
              };
              document.addEventListener('click', stopNav, { capture: true, once: true });
              link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
              const after = JSON.stringify(Object.fromEntries(Array.from({ length: localStorage.length }, (_, i) => {
                const key = localStorage.key(i);
                return [key, localStorage.getItem(key)];
              })));
              const viewedStores = [];
              for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (key && /viewed|modern-ui/i.test(key)) viewedStores.push({ key, value: localStorage.getItem(key) });
              }
              return { changed: before !== after, viewedStores };
            }
            """,
            card_selector,
        )
        if changed.get("skipped"):
            result["viewed"] = changed
        elif not changed.get("changed"):
            raise SmokeError(f"shared card link click did not update viewed storage: {changed}")
        else:
            result["viewed"] = {"storageChanged": True, "stores": changed.get("viewedStores", [])[:3]}
    return result


def assert_interactions(page: Any, paths: RepoPaths, site: dict[str, Any], fixture: dict[str, Any], timeout: int) -> dict[str, Any]:
    if fixture.get("assertInteractions") is False:
        return {"skipped": True, "reason": "fixture disabled interaction assertions"}
    if int(fixture.get("expect", {}).get("minCards", 0) or 0) <= 0:
        return {"skipped": True, "reason": "fixture has no feed cards"}
    interactions: dict[str, Any] = {}
    interactions["cardActions"] = assert_card_action_toggles(page, fixture, timeout)
    interactions["searchFilter"] = assert_search_filter(page, fixture, timeout)
    interactions["loadMore"] = assert_load_more(page, fixture, timeout)
    return interactions

def open_drawer_for_smoke(page: Any, preferred_selector: str, timeout: int) -> tuple[str, str, dict[str, Any]]:
    """Open a drawer through the first available visible trigger.

    Mobile layouts can hide the desktop browse button and expose equivalent
    actions in the bottom nav. Try browse first, then search/settings controls,
    and validate the same shared drawer regardless of which trigger opened it.
    """
    selectors: list[str] = []
    for selector in [
        preferred_selector,
        '[data-action="open-browse"]',
        '[data-action="open-search"]',
        '[data-action="open-settings"]',
        '[data-mop-action="drawer"]',
        '[data-ptn-action="drawer"]',
    ]:
        if selector and selector not in selectors:
            selectors.append(selector)
    last_error = ""
    for selector in selectors:
        if not page.locator(selector).count():
            continue
        try:
            clicked = click_first_visible(page, selector, timeout)
            opened = wait_for_any_selector(page, drawer_open_selectors(), max(900, min(timeout, 2500)))
            return selector, opened, clicked
        except Exception as exc:
            last_error = str(exc)
            try:
                page.keyboard.press("Escape")
                wait_for_any_selector(page, drawer_closed_selectors(), 800)
            except Exception:
                pass
    raise SmokeError(f"could not open drawer with visible trigger; tried={selectors}; last={last_error}")


def assert_drawer(page: Any, site: dict[str, Any], timeout: int) -> dict[str, Any]:
    drawer = site.get("drawer", {})
    open_selector = drawer.get("openSelector", '[data-action="open-browse"]')
    if not page.locator(open_selector).count() and not page.locator('[data-action^="open-"],[data-mop-action="drawer"],[data-ptn-action="drawer"]').count():
        return {"skipped": True, "reason": f"open selector absent: {open_selector}"}
    opened_with, opened_selector, clicked = open_drawer_for_smoke(page, open_selector, timeout)
    drawer_selector = '.csm-drawer, #mop-drawer, #ptn-drawer'
    role = page.locator(drawer_selector).first.get_attribute("role")
    modal = page.locator(drawer_selector).first.get_attribute("aria-modal")
    page.keyboard.press("Escape")
    wait_for_any_selector(page, drawer_closed_selectors(), timeout)
    if role != "dialog" or modal != "true":
        raise SmokeError(f"drawer role/aria-modal mismatch: role={role!r} aria-modal={modal!r}")
    return {"opened": True, "openedWith": opened_with, "openedSelector": opened_selector, "clicked": clicked, "role": role, "ariaModal": modal}




def assert_accessibility_contract(page: Any, site: dict[str, Any], fixture: dict[str, Any], viewport: ViewportSpec, timeout: int) -> dict[str, Any]:
    """Lightweight accessibility smoke checks without adding an axe dependency.

    The goal is to catch regressions in the shared UI chrome: unnamed controls,
    hidden desktop buttons being selected on mobile, drawer semantics/focus
    behavior, card link naming, and article progress semantics.
    """
    expect = fixture.get("expect", {})
    card_selector = expect.get("cardSelector", ".csm-card")
    result: dict[str, Any] = {}

    chrome = page.evaluate(
        """
        ({ cardSelector, isMobile }) => {
          const isVisible = (node) => {
            if (!(node instanceof HTMLElement)) return false;
            const style = getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };
          const nameFor = (node) => (node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || '').replace(/\\s+/g, ' ').trim();
          const visibleControls = Array.from(document.querySelectorAll('.csm-topbar button,.csm-bottomnav button,.csm-drawer button,.csm-drawer a,.csm-drawer input')).filter(isVisible);
          const unnamedControls = visibleControls
            .filter((node) => !nameFor(node) && !node.getAttribute('aria-labelledby'))
            .map((node) => node.outerHTML.slice(0, 160));
          const mobileDesktopControls = isMobile
            ? Array.from(document.querySelectorAll('[data-desktop="true"]')).filter(isVisible).map((node) => nameFor(node) || node.outerHTML.slice(0, 80))
            : [];
          const bottom = document.querySelector('.csm-bottomnav');
          const bottomVisible = bottom ? isVisible(bottom) : false;
          const bottomButtons = bottomVisible ? Array.from(bottom.querySelectorAll('button')).filter(isVisible) : [];
          const bottomUnnamed = bottomButtons.filter((node) => !nameFor(node)).map((node) => node.outerHTML.slice(0, 120));
          const cardLinks = Array.from(document.querySelectorAll(`${cardSelector} a[href]`)).filter(isVisible).slice(0, 12);
          const unnamedCardLinks = cardLinks.filter((link) => {
            const label = nameFor(link);
            const imageAlt = Array.from(link.querySelectorAll('img')).map((img) => img.getAttribute('alt') || '').join(' ').trim();
            return !label && !imageAlt;
          }).map((link) => link.outerHTML.slice(0, 160));
          const progress = document.querySelector('.csm-progress');
          return {
            visibleControls: visibleControls.length,
            unnamedControls,
            mobileDesktopControls,
            bottomNav: bottom ? {
              visible: bottomVisible,
              ariaLabel: bottom.getAttribute('aria-label') || '',
              buttons: bottomButtons.length,
              unnamedButtons: bottomUnnamed
            } : null,
            cardsChecked: cardLinks.length,
            unnamedCardLinks,
            progress: progress ? {
              role: progress.getAttribute('role'),
              label: progress.getAttribute('aria-label'),
              min: progress.getAttribute('aria-valuemin'),
              max: progress.getAttribute('aria-valuemax'),
              now: progress.getAttribute('aria-valuenow')
            } : null
          };
        }
        """,
        {"cardSelector": card_selector, "isMobile": viewport.width < 720},
    )
    if chrome.get("unnamedControls"):
        raise SmokeError(f"visible chrome controls without accessible names: {chrome['unnamedControls'][:3]}")
    if chrome.get("mobileDesktopControls"):
        raise SmokeError(f"desktop-only controls visible on mobile: {chrome['mobileDesktopControls'][:3]}")
    bottom = chrome.get("bottomNav")
    if bottom and bottom.get("visible"):
        if not bottom.get("ariaLabel"):
            raise SmokeError("visible bottom nav is missing aria-label")
        if bottom.get("unnamedButtons"):
            raise SmokeError(f"bottom nav buttons without accessible names: {bottom['unnamedButtons'][:3]}")
    if chrome.get("unnamedCardLinks"):
        raise SmokeError(f"card links without accessible names: {chrome['unnamedCardLinks'][:3]}")
    progress = chrome.get("progress")
    if progress:
        if progress.get("role") != "progressbar" or not progress.get("label") or progress.get("min") != "0" or progress.get("max") != "100":
            raise SmokeError(f"article progressbar accessibility mismatch: {progress}")
    result["chrome"] = chrome

    drawer_selector = site.get("drawer", {}).get("openSelector", '[data-action="open-browse"]')
    if page.locator(drawer_selector).count() or page.locator('[data-action^="open-"],[data-mop-action="drawer"],[data-ptn-action="drawer"]').count():
        opened_with, opened_selector, clicked = open_drawer_for_smoke(page, drawer_selector, timeout)
        page.wait_for_timeout(100)
        drawer = page.evaluate(
            """
            () => {
              const drawer = document.querySelector('.csm-drawer, #mop-drawer, #ptn-drawer');
              const active = document.activeElement;
              const labelledBy = drawer?.getAttribute('aria-labelledby') || '';
              const describedBy = drawer?.getAttribute('aria-describedby') || '';
              const visibleOpeners = Array.from(document.querySelectorAll('[data-action="open-browse"],[data-mop-action="drawer"],[data-ptn-action="drawer"]')).filter((node) => {
                if (!(node instanceof HTMLElement)) return false;
                const style = getComputedStyle(node);
                const rect = node.getBoundingClientRect();
                return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
              });
              return {
                present: !!drawer,
                role: drawer?.getAttribute('role') || '',
                ariaModal: drawer?.getAttribute('aria-modal') || '',
                ariaHidden: drawer?.getAttribute('aria-hidden') || '',
                labelledBy,
                labelledByExists: !!(labelledBy && document.getElementById(labelledBy)),
                describedBy,
                describedByExists: !describedBy || !!document.getElementById(describedBy),
                focusInside: !!(drawer && active && drawer.contains(active)),
                expandedOpeners: visibleOpeners.filter((node) => node.getAttribute('aria-expanded') === 'true').length
              };
            }
            """
        )
        if drawer.get("role") != "dialog" or drawer.get("ariaModal") != "true" or drawer.get("ariaHidden") != "false":
            raise SmokeError(f"drawer semantics mismatch: {drawer}")
        if not drawer.get("labelledByExists") or not drawer.get("describedByExists"):
            raise SmokeError(f"drawer label/description target missing: {drawer}")
        if not drawer.get("focusInside"):
            raise SmokeError(f"drawer did not move focus inside after opening: {drawer}")
        if drawer.get("expandedOpeners", 0) < 1:
            raise SmokeError(f"drawer opener did not expose aria-expanded=true: {drawer}")
        for _ in range(3):
            page.keyboard.press("Tab")
        focus_trap = page.evaluate("""() => { const drawer = document.querySelector('.csm-drawer, #mop-drawer, #ptn-drawer'); return !!(drawer && document.activeElement && drawer.contains(document.activeElement)); }""")
        if not focus_trap:
            raise SmokeError("drawer focus escaped while tabbing")
        page.keyboard.press("Escape")
        wait_for_any_selector(page, drawer_closed_selectors(), timeout)
        closed = page.evaluate(
            """
            () => {
              const drawer = document.querySelector('.csm-drawer, #mop-drawer, #ptn-drawer');
              const active = document.activeElement;
              return {
                ariaHidden: drawer?.getAttribute('aria-hidden') || '',
                focusRestoredToChrome: !!(active && active.closest && active.closest('.csm-topbar,.csm-bottomnav')),
                expandedOpeners: Array.from(document.querySelectorAll('[data-action^="open-"]')).filter((node) => node.getAttribute('aria-expanded') === 'true').length
              };
            }
            """
        )
        if closed.get("ariaHidden") != "true" or closed.get("expandedOpeners") != 0:
            raise SmokeError(f"drawer close state mismatch: {closed}")
        result["drawer"] = {"openedWith": opened_with, "openedSelector": opened_selector, "clicked": clicked, **drawer, "closed": closed}

    if page.locator('[data-action="open-search"]').count():
        click_first_visible(page, '[data-action="open-search"]', timeout)
        wait_for_any_selector(page, drawer_open_selectors(), timeout)
        search = page.evaluate(
            """
            () => {
              const input = document.querySelector('.csm-drawer[aria-hidden="false"] input[type="search"]');
              return input ? {
                id: input.id || '',
                ariaLabel: input.getAttribute('aria-label') || '',
                labelledBy: input.getAttribute('aria-labelledby') || '',
                hasLabel: !!(input.id && document.querySelector(`label[for="${CSS.escape(input.id)}"]`))
              } : null;
            }
            """
        )
        if search and not (search.get("ariaLabel") or search.get("labelledBy") or search.get("hasLabel")):
            raise SmokeError(f"search input lacks an accessible label: {search}")
        page.keyboard.press("Escape")
        wait_for_any_selector(page, drawer_closed_selectors(), timeout)
        result["search"] = search
    return result

def pagetual_config(site: dict[str, Any]) -> dict[str, Any] | None:
    cfg = site.get("pagetual")
    return dict(cfg) if isinstance(cfg, dict) else None


def pagetual_card_selector(site: dict[str, Any]) -> str:
    cfg = pagetual_config(site) or {}
    return str(cfg.get("cardSelector") or ".csm-card")


def append_pagetual_page(
    page: Any,
    paths: RepoPaths,
    site: dict[str, Any],
    *,
    label: str,
    max_nodes: int | None = None,
    duplicate: bool = False,
    timeout: int = 8000,
) -> dict[str, Any]:
    cfg = pagetual_config(site)
    if not cfg:
        return {"skipped": True, "reason": "no pagetual config"}
    html_text = rel_path(paths.root, cfg["fixture"]).read_text(encoding="utf-8", errors="replace")
    payload = {
        "html": html_text,
        "sourceSelector": cfg.get("sourceSelector"),
        "appendTargetSelector": cfg.get("appendTargetSelector"),
        "maxNodes": int(max_nodes if max_nodes is not None else cfg.get("maxNodes", 8)),
        "label": label,
        "duplicate": bool(duplicate),
    }
    appended = page.evaluate(
        """
        ({ html, sourceSelector, appendTargetSelector, maxNodes, label, duplicate }) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const candidates = Array.from(doc.querySelectorAll(sourceSelector || 'article, li, .post-item, .thumb-item, .item, .cf.the-content')).slice(0, maxNodes || 8);
          const target = document.querySelector(appendTargetSelector || '[data-csm-source-feed-root]') || document.querySelector('[data-csm-source-feed-root]') || document.querySelector('main') || document.body;
          if (!target) return { appended: 0, reason: 'no target' };
          let appendTarget = target;
          if (target.classList && target.classList.contains('csm-feed-grid')) {
            appendTarget = document.querySelector('[data-csm-source-feed-root]') || document.querySelector('main') || document.body;
          }
          const pageBar = document.createElement('div');
          pageBar.className = 'pagetual_pageBar';
          pageBar.dataset.csmSmokePageTual = label || 'next';
          pageBar.textContent = `PageTual simulated ${label || 'next page'}`;
          appendTarget.appendChild(pageBar);
          let index = 0;
          for (const node of candidates) {
            const clone = document.importNode(node, true);
            clone.setAttribute?.('data-csm-smoke-pagetual-page', label || 'next');
            if (!duplicate) {
              // Keep the real path/host, but make every cloned link unique so
              // site-specific title/image anchors cannot be de-duped away.
              const suffix = `csm-smoke-${label || 'next'}-${index}`.replace(/[^a-z0-9_-]+/gi, '-');
              for (const [linkIndex, link] of Array.from(clone.querySelectorAll?.('a[href]') || []).entries()) {
                const url = new URL(link.href, location.href);
                const linkSuffix = `${suffix}-${linkIndex}`;
                if (url.origin === location.origin) {
                  const clean = url.pathname.replace(/\/$/, '');
                  url.pathname = `${clean}-${linkSuffix}/`;
                  url.search = '';
                } else {
                  url.searchParams.set('csm-smoke-page', label || 'next');
                  url.searchParams.set('csm-smoke-index', String(index));
                  url.searchParams.set('csm-smoke-link', String(linkIndex));
                }
                link.href = url.href;
              }
            }
            appendTarget.appendChild(clone);
            index += 1;
          }
          window.postMessage({ command: 'pagetual', action: 'insert' }, '*');
          window.dispatchEvent(new CustomEvent('pagetual:insert', { detail: { root: appendTarget, label: label || 'next' } }));
          return { appended: candidates.length, target: appendTarget.tagName.toLowerCase(), duplicate: !!duplicate };
        }
        """,
        payload,
    )
    if appended.get("appended", 0) <= 0:
        raise SmokeError(f"PageTual simulation appended no source nodes: {appended}")
    page.wait_for_timeout(min(max(timeout // 10, 250), 900))
    return appended


def wait_for_card_growth(page: Any, selector: str, before: int, min_added: int, timeout: int) -> int:
    deadline = time.time() + timeout / 1000
    after = before
    while time.time() < deadline:
        after = page.locator(selector).count()
        if after >= before + min_added:
            return after
        page.wait_for_timeout(100)
    raise SmokeError(f"PageTual append did not produce new cards: before={before} after={after}")


def duplicate_href_count(page: Any, card_selector: str) -> int:
    return int(page.evaluate(
        """
        (cardSelector) => {
          const seen = new Set();
          let duplicates = 0;
          for (const card of document.querySelectorAll(cardSelector)) {
            const link = card.querySelector && card.querySelector('a[href]');
            if (!link) continue;
            const key = new URL(link.href, location.href).pathname.replace(/\\/$/, '').toLowerCase() || link.href;
            if (seen.has(key)) duplicates += 1;
            else seen.add(key);
          }
          return duplicates;
        }
        """,
        card_selector,
    ))


def assert_pagetual_filter_preserved(page: Any, fixture: dict[str, Any], timeout: int) -> dict[str, Any]:
    expect = fixture.get("expect", {})
    card_selector = expect.get("cardSelector", ".csm-card")
    before_visible = visible_count(page, card_selector)
    open_selector = '[data-action="open-search"], [data-mop-action="search"], [data-ptn-action="search"]'
    if before_visible <= 1 or not page.locator(open_selector).count():
        return {"skipped": True, "reason": "search drawer unavailable for active-filter PageTual contract"}
    click_first_visible(page, open_selector, timeout)
    wait_for_any_selector(page, drawer_open_selectors(), timeout)
    input_sel = search_input_selector()
    wait_for_selector(page, input_sel, timeout)
    query = "zzzz-smoke-no-match-zzzz"
    page.locator(input_sel).first.fill(query)
    after_filtered = wait_until_count(page, card_selector, "lt", before_visible, timeout)
    page.keyboard.press("Escape")
    return {"query": query, "beforeVisibleCards": before_visible, "afterFilteredVisibleCards": after_filtered}


def should_run_pagetual_contract(page: Any, site: dict[str, Any], fixture: dict[str, Any]) -> tuple[bool, str, int]:
    expect = fixture.get("expect", {})
    if int(expect.get("minCards", 0) or 0) <= 0:
        return False, "fixture has no feed cards", 0
    card_selector = pagetual_card_selector(site)
    before = int(page.locator(card_selector).count())
    if before <= 1:
        return False, f"not enough existing cards for PageTual growth contract: {before}", before
    return True, "", before


def assert_pagetual_contract_v2(page: Any, paths: RepoPaths, site: dict[str, Any], fixture: dict[str, Any], timeout: int) -> dict[str, Any]:
    cfg = pagetual_config(site)
    if not cfg:
        return {"skipped": True, "reason": "no pagetual config"}
    should_run, reason, before = should_run_pagetual_contract(page, site, fixture)
    if not should_run:
        return {"skipped": True, "reason": reason, "beforeCards": before}
    card_selector = pagetual_card_selector(site)
    min_added = int(cfg.get("expectMinAddedCards", 1))
    result: dict[str, Any] = {"version": 2, "cardSelector": card_selector}

    first = append_pagetual_page(page, paths, site, label="page-2", timeout=timeout)
    after_first = wait_for_card_growth(page, card_selector, before, min_added, timeout)
    result["firstAppend"] = {"beforeCards": before, "afterCards": after_first, "appendedSourceNodes": first.get("appended", 0)}

    before_second = after_first
    second = append_pagetual_page(page, paths, site, label="page-3", timeout=timeout)
    after_second = wait_for_card_growth(page, card_selector, before_second, min_added, timeout)
    result["secondAppend"] = {"beforeCards": before_second, "afterCards": after_second, "appendedSourceNodes": second.get("appended", 0)}

    before_dupe = after_second
    dupes_before = duplicate_href_count(page, card_selector)
    duplicate = append_pagetual_page(page, paths, site, label="duplicate-page", duplicate=True, timeout=timeout)
    page.wait_for_timeout(min(max(timeout // 10, 250), 900))
    after_dupe = page.locator(card_selector).count()
    dupes_after = duplicate_href_count(page, card_selector)
    max_duplicate_growth = int(cfg.get("maxDuplicateCardGrowth", 0))
    if after_dupe > before_dupe + max_duplicate_growth:
        raise SmokeError(f"PageTual duplicate append grew cards too much: before={before_dupe} after={after_dupe} allowed={max_duplicate_growth}")
    if dupes_after > dupes_before + max_duplicate_growth:
        raise SmokeError(f"PageTual duplicate append created duplicate hrefs: before={dupes_before} after={dupes_after} allowed={max_duplicate_growth}")
    result["duplicateAppend"] = {
        "beforeCards": before_dupe,
        "afterCards": after_dupe,
        "duplicatesBefore": dupes_before,
        "duplicatesAfter": dupes_after,
        "appendedSourceNodes": duplicate.get("appended", 0),
    }

    filter_state = assert_pagetual_filter_preserved(page, fixture, timeout)
    before_filter_append = page.locator(card_selector).count()
    append_pagetual_page(page, paths, site, label="filtered-page", timeout=timeout)
    after_filter_append = wait_for_card_growth(page, card_selector, before_filter_append, min_added, timeout)
    visible_after_filter_append = visible_count(page, card_selector)
    if not filter_state.get("skipped") and visible_after_filter_append != 0:
        raise SmokeError(f"PageTual append while no-match filter is active should remain hidden; visible={visible_after_filter_append}")
    result["activeFilterAppend"] = {
        **filter_state,
        "beforeCards": before_filter_append,
        "afterCards": after_filter_append,
        "visibleCardsAfterAppend": visible_after_filter_append,
    }

    page.evaluate(
        """
        () => {
          const clear = document.querySelector('[data-csm-show-all]');
          if (clear instanceof HTMLElement) clear.click();
          for (const input of document.querySelectorAll('input[type="search"]')) {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        """
    )
    page.wait_for_timeout(250)
    restored_visible = visible_count(page, card_selector)
    if restored_visible <= 0:
        raise SmokeError("PageTual contract v2 could not restore visible cards after active filter scenario")
    result["restore"] = {"visibleCards": restored_visible, "totalCards": page.locator(card_selector).count()}
    return result


def simulate_pagetual(page: Any, paths: RepoPaths, site: dict[str, Any], timeout: int) -> dict[str, Any]:
    cfg = site.get("pagetual")
    if not cfg:
        return {"skipped": True, "reason": "no pagetual config"}
    should_run, reason, before = should_run_pagetual_contract(page, site, {"expect": {"minCards": 1}})
    if not should_run:
        return {"skipped": True, "reason": reason, "beforeCards": before}
    card_selector = pagetual_card_selector(site)
    appended = append_pagetual_page(page, paths, site, label="next-page", timeout=timeout)
    after = wait_for_card_growth(page, cfg.get("cardSelector", ".csm-card"), before, int(cfg.get("expectMinAddedCards", 1)), timeout)
    return {"beforeCards": before, "afterCards": after, "appendedSourceNodes": appended.get("appended", 0)}


def is_ignored_console_error(text: str) -> bool:
    normalized = str(text or "")
    ignored_patterns = [
        r"Failed to load resource: the server responded with a status of 404",
        r"Failed to load resource: the server responded with a status of 403",
        r"favicon\.ico",
        r"net::ERR_BLOCKED_BY_CLIENT",
        r"wedata\.net/databases/AutoPagerize/items_all\.json",
        r"Access to fetch at .*AutoPagerize.*CORS policy",
        r"Failed to load resource: net::ERR_FAILED",
    ]
    return any(re.search(pattern, normalized, re.I) for pattern in ignored_patterns)


def console_error_text(events: list[dict[str, Any]]) -> list[str]:
    errors = []
    for event in events:
        if event.get("type") in {"error", "pageerror"}:
            text = str(event.get("text", ""))
            if is_ignored_console_error(text):
                continue
            errors.append(text)
    return errors


def write_console_log(paths: RepoPaths, output_dir: Path, slug: str, events: list[dict[str, Any]]) -> str | None:
    if not events:
        return None
    lines = []
    for event in events:
        location = event.get("location") or {}
        loc = ""
        if location.get("url"):
            loc = f" ({location.get('url')}:{location.get('lineNumber', 0)})"
        lines.append(f"[{event.get('type', 'log')}] {event.get('text', '')}{loc}")
    path = write_text(output_dir, f"{slug}-console.log", "\n".join(lines) + "\n")
    return repo_rel(paths.root, path)


def maybe_write_failure_artifacts(
    paths: RepoPaths,
    output_dir: Path,
    page: Any,
    fixture_result: dict[str, Any],
    slug: str,
    snapshot_mode: str,
    failed: bool,
) -> None:
    if failed:
        screenshot = output_dir / f"{slug}.png"
        try:
            page.screenshot(path=str(screenshot), full_page=True)
            fixture_result["screenshot"] = repo_rel(paths.root, screenshot)
        except Exception as exc:
            fixture_result["screenshotError"] = str(exc)
    if snapshot_mode == "on" or (snapshot_mode == "retain-on-failure" and failed):
        snapshot = output_dir / f"{slug}.html"
        try:
            snapshot.write_text(page.content(), encoding="utf-8")
            fixture_result["htmlSnapshot"] = repo_rel(paths.root, snapshot)
        except Exception as exc:
            fixture_result["htmlSnapshotError"] = str(exc)


def fixture_rows(result: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for site in result.get("sites", []):
        for fixture in site.get("fixtures", []):
            rows.append({"site": site.get("id", ""), **fixture})
    return rows


def render_markdown_report(result: dict[str, Any]) -> str:
    title = "Content-site smoke report"
    status = "PASS" if result.get("ok") else "FAIL"
    lines = [f"# {title}", "", f"Status: **{status}**", ""]
    run = result.get("run", {})
    if run:
        lines.extend([
            "## Run",
            "",
            f"- Started: `{run.get('startedAt', 'unknown')}`",
            f"- Finished: `{run.get('finishedAt', 'unknown')}`",
            f"- Builder: `{result.get('builder', 'unknown')}`",
            f"- Browser: `{run.get('browser', 'unknown')}`",
            f"- Headless: `{run.get('headless', 'unknown')}`",
            f"- Matrix: `{', '.join(run.get('viewports', []) or []) or 'custom'}`",
            "",
        ])
    lines.extend([
        "## Fixtures",
        "",
        "| Site | Fixture | Viewport | Status | Cards | Interactions | PageTual | Duration | Evidence |",
        "| --- | --- | --- | --- | ---: | --- | --- | ---: | --- |",
    ])
    for row in fixture_rows(result):
        fstatus = "PASS" if row.get("ok") else "FAIL"
        cards = row.get("assertions", {}).get("cards", "")
        pagetual = row.get("pagetual", {})
        contract = row.get("pagetualContract", {})
        if contract.get("skipped"):
            ptext = "v2 skipped"
        elif contract:
            first = contract.get("firstAppend", {})
            second = contract.get("secondAppend", {})
            ptext = f"v2 {first.get('beforeCards', '?')}→{second.get('afterCards', '?')}"
        elif pagetual.get("skipped"):
            ptext = "skipped"
        elif pagetual:
            ptext = f"{pagetual.get('beforeCards', '?')}→{pagetual.get('afterCards', '?')}"
        else:
            ptext = ""
        a11y = row.get("accessibility", {})
        if a11y.get("skipped"):
            a11y_text = "skipped"
        elif a11y:
            drawer_a11y = "drawer" if a11y.get("drawer") else "chrome"
            a11y_text = f"ok ({drawer_a11y})"
        else:
            a11y_text = ""
        interactions = row.get("interactions", {})
        if interactions.get("skipped"):
            itext = "skipped"
        elif interactions:
            passed_bits = []
            for key in ["cardActions", "searchFilter", "loadMore"]:
                value = interactions.get(key, {})
                if value.get("skipped"):
                    passed_bits.append(f"{key}: skip")
                else:
                    passed_bits.append(f"{key}: ok")
            itext = "<br>".join(passed_bits)
        else:
            itext = ""
        evidence = []
        for key, label in [("screenshot", "png"), ("htmlSnapshot", "html"), ("trace", "trace"), ("consoleLog", "console")]:
            if row.get(key):
                evidence.append(f"[{label}]({row[key]})")
        error = row.get("error")
        if error:
            evidence.append(f"`{html.escape(str(error)[:120])}`")
        lines.append(
            f"| `{row.get('site', '')}` | `{row.get('id', '')}` | `{row.get('viewport', '')}` | {fstatus} | {cards} | {a11y_text} | {itext} | {ptext} | {row.get('durationMs', '')}ms | {'<br>'.join(evidence)} |"
        )
    lines.append("")
    failed = [row for row in fixture_rows(result) if not row.get("ok")]
    if failed:
        lines.extend(["## Failures", ""])
        for row in failed:
            lines.append(f"- `{row.get('site')}/{row.get('id')}/{row.get('viewport')}`: {row.get('error', 'unknown failure')}")
        lines.append("")
    return "\n".join(lines)


def render_live_drift_report(result: dict[str, Any]) -> str:
    rows = [row for row in fixture_rows(result) if row.get("drift")]
    status = "PASS" if not any(live_drift_should_fail(row.get("drift") or {}) for row in rows) else "DRIFT"
    lines = [
        "# Content-site live drift report",
        "",
        f"Status: **{status}**",
        "",
        "Live drift is a shape report. It is non-failing unless the run used `--fail-on-live-drift`.",
        "",
        "| Site | Viewport | Severity | Baseline | Cards | Ratio | Missing selectors | Evidence |",
        "| --- | --- | --- | --- | ---: | ---: | --- | --- |",
    ]
    if not rows:
        lines.append("| _none_ |  |  |  |  |  |  |  |")
    for row in rows:
        drift = row.get("drift") or {}
        ratio = drift.get("ratio")
        ratio_text = "" if ratio is None else f"{float(ratio):.2f}"
        missing = drift.get("missingSelectors") or []
        evidence = []
        for key, label in [("screenshot", "png"), ("htmlSnapshot", "html"), ("trace", "trace")]:
            if row.get(key):
                evidence.append(f"[{label}]({row[key]})")
        lines.append(
            f"| `{row.get('site', '')}` | `{row.get('viewport', '')}` | **{drift.get('severity', '')}** | "
            f"`{drift.get('baselineFixture', '')}` | {drift.get('liveCards', 0)}/{drift.get('baselineMinCards', 0)} | "
            f"{ratio_text} | {html.escape(', '.join(missing)) if missing else ''} | {'<br>'.join(evidence)} |"
        )
    lines.extend(["", "## Notes", ""])
    for row in rows:
        drift = row.get("drift") or {}
        notes = drift.get("notes") or []
        if notes:
            lines.append(f"- `{row.get('site')}/{row.get('viewport')}`: " + "; ".join(str(item) for item in notes))
    samples_rows = [row for row in rows if (row.get("drift") or {}).get("samples")]
    if samples_rows:
        lines.extend(["", "## Live card samples", ""])
        for row in samples_rows:
            lines.append(f"### {row.get('site')} / {row.get('viewport')}")
            for sample in (row.get("drift") or {}).get("samples", [])[:5]:
                title = html.escape(str(sample.get("title") or "<untitled>")[:160])
                href = html.escape(str(sample.get("href") or ""))
                lines.append(f"- {title}" + (f" — `{href}`" if href else ""))
            lines.append("")
    return "\n".join(lines)



def live_baseline_settings(config_data: dict[str, Any]) -> dict[str, Any]:
    live_smoke = config_data.get("liveSmoke") or {}
    defaults: dict[str, Any] = {
        "path": "tools/smoke/live-baselines/content-site-modernizer-live-baseline.json",
        "report": "content-site-live-baseline.md",
        "minCardRatio": 0.6,
        "warnCardRatio": 0.8,
        "warnHighCardRatio": 1.5,
        "maxCardRatio": 2.0,
        "missingSelectorSeverity": "high",
        "missingBaselineSeverity": "medium",
        "failSeverity": "high",
    }
    defaults.update(live_smoke.get("baseline") or {})
    return defaults


def live_baseline_path(paths: RepoPaths, config_data: dict[str, Any], args: argparse.Namespace | None = None) -> Path:
    override = getattr(args, "live_baseline", None) if args is not None else None
    value = override or live_baseline_settings(config_data).get("path")
    return rel_path(paths.root, str(value))


def live_baseline_key(site: str, fixture: str, viewport: str) -> str:
    return f"{site}:{fixture}:{viewport}"


def load_live_baseline(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"schemaVersion": 1, "builder": "content-site-modernizer", "updatedAt": None, "entries": {}}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SmokeError(f"invalid live baseline JSON: {path}: {exc}") from exc
    if data.get("schemaVersion") != 1 or not isinstance(data.get("entries"), dict):
        raise SmokeError(f"invalid live baseline shape: {path}")
    return data


def selector_counts_from_drift(drift: dict[str, Any]) -> dict[str, int]:
    out: dict[str, int] = {}
    for row in drift.get("selectors") or []:
        selector = str(row.get("selector") or "")
        if selector:
            out[selector] = int(row.get("count") or 0)
    return out


def baseline_entries_from_result(result: dict[str, Any]) -> dict[str, Any]:
    entries: dict[str, Any] = {}
    finished = (result.get("run") or {}).get("finishedAt") or utc_now_iso()
    for row in fixture_rows(result):
        drift = row.get("drift") or {}
        if not drift:
            continue
        site = str(row.get("site") or "")
        fixture = str(row.get("id") or "")
        viewport = str(row.get("viewport") or "")
        if not site or not fixture or not viewport:
            continue
        entries[live_baseline_key(site, fixture, viewport)] = {
            "site": site,
            "fixture": fixture,
            "viewport": viewport,
            "url": row.get("url", ""),
            "capturedAt": finished,
            "baselineFixture": drift.get("baselineFixture"),
            "cardSelector": drift.get("baselineCardSelector"),
            "acceptedLiveCards": int(drift.get("liveCards") or 0),
            "acceptedVisibleCards": int(drift.get("visibleLiveCards") or 0),
            "selectorCounts": selector_counts_from_drift(drift),
            "samples": list(drift.get("samples") or [])[:5],
            "severityAtCapture": drift.get("severity", "ok"),
            "notesAtCapture": list(drift.get("notes") or [])[:5],
        }
    return entries


def write_live_baseline(paths: RepoPaths, config_data: dict[str, Any], result: dict[str, Any], args: argparse.Namespace) -> Path:
    path = live_baseline_path(paths, config_data, args)
    entries = baseline_entries_from_result(result)
    payload = {
        "schemaVersion": 1,
        "builder": result.get("builder") or config_data.get("builder"),
        "updatedAt": (result.get("run") or {}).get("finishedAt") or utc_now_iso(),
        "source": "accepted guarded live smoke baseline",
        "sourceRun": {
            "startedAt": (result.get("run") or {}).get("startedAt"),
            "finishedAt": (result.get("run") or {}).get("finishedAt"),
            "browser": (result.get("run") or {}).get("browser"),
            "viewports": (result.get("run") or {}).get("viewports"),
        },
        "entries": entries,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    result["liveBaselineCapture"] = {
        "path": repo_rel(paths.root, path),
        "entries": len(entries),
        "updatedAt": payload["updatedAt"],
    }
    return path


def evaluate_live_baseline_drift(row: dict[str, Any], entry: dict[str, Any] | None, settings: dict[str, Any]) -> dict[str, Any]:
    drift = row.get("drift") or {}
    current_cards = int(drift.get("liveCards") or 0)
    current_visible = int(drift.get("visibleLiveCards") or 0)
    if not entry:
        return {
            "enabled": True,
            "baselineFound": False,
            "severity": str(settings.get("missingBaselineSeverity", "medium")),
            "acceptedLiveCards": None,
            "liveCards": current_cards,
            "visibleLiveCards": current_visible,
            "ratio": None,
            "missingAcceptedSelectors": [],
            "notes": ["no accepted live baseline entry for this site/fixture/viewport"],
        }

    accepted = int(entry.get("acceptedLiveCards") or 0)
    ratio = None if accepted <= 0 else current_cards / accepted
    severity = "ok"
    notes: list[str] = []
    if accepted > 0 and current_cards == 0:
        severity = "critical"
        notes.append("accepted baseline had cards but current live run matched zero cards")
    elif ratio is not None and ratio < float(settings.get("minCardRatio", 0.6)):
        severity = "high"
        notes.append(f"current card ratio {ratio:.2f} is below minimum {float(settings.get('minCardRatio', 0.6)):.2f}")
    elif ratio is not None and ratio < float(settings.get("warnCardRatio", 0.8)):
        severity = "medium"
        notes.append(f"current card ratio {ratio:.2f} is below warning {float(settings.get('warnCardRatio', 0.8)):.2f}")
    elif ratio is not None and ratio > float(settings.get("maxCardRatio", 2.0)):
        severity = "medium"
        notes.append(f"current card ratio {ratio:.2f} is above maximum {float(settings.get('maxCardRatio', 2.0)):.2f}")
    elif ratio is not None and ratio > float(settings.get("warnHighCardRatio", 1.5)):
        severity = "low"
        notes.append(f"current card ratio {ratio:.2f} is above warning {float(settings.get('warnHighCardRatio', 1.5)):.2f}")

    current_counts = selector_counts_from_drift(drift)
    missing = []
    for selector, old_count in (entry.get("selectorCounts") or {}).items():
        if int(old_count or 0) > 0 and int(current_counts.get(selector, 0)) == 0:
            missing.append(selector)
    if missing:
        selector_severity = str(settings.get("missingSelectorSeverity", "high"))
        if drift_severity_rank(selector_severity) > drift_severity_rank(severity):
            severity = selector_severity
        notes.append("accepted baseline selector(s) disappeared: " + ", ".join(missing))
    if not notes:
        notes.append("current live shape is within accepted baseline thresholds")

    return {
        "enabled": True,
        "baselineFound": True,
        "severity": severity,
        "acceptedAt": entry.get("capturedAt"),
        "acceptedLiveCards": accepted,
        "acceptedVisibleCards": int(entry.get("acceptedVisibleCards") or 0),
        "liveCards": current_cards,
        "visibleLiveCards": current_visible,
        "ratio": ratio,
        "missingAcceptedSelectors": missing,
        "notes": notes,
        "samplesAtCapture": list(entry.get("samples") or [])[:3],
    }


def compare_live_baseline(paths: RepoPaths, config_data: dict[str, Any], result: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    path = live_baseline_path(paths, config_data, args)
    baseline = load_live_baseline(path)
    settings = live_baseline_settings(config_data)
    threshold = str(settings.get("failSeverity", "high"))
    compared = 0
    failed = 0
    for site in result.get("sites", []):
        for fixture in site.get("fixtures", []):
            if not fixture.get("drift"):
                continue
            key = live_baseline_key(str(site.get("id") or ""), str(fixture.get("id") or ""), str(fixture.get("viewport") or ""))
            baseline_row = evaluate_live_baseline_drift({"site": site.get("id", ""), **fixture}, baseline.get("entries", {}).get(key), settings)
            fixture["liveBaseline"] = baseline_row
            compared += 1
            if getattr(args, "fail_on_live_baseline_drift", False) and live_drift_should_fail(baseline_row, threshold):
                fixture["ok"] = False
                fixture["error"] = "live baseline drift severity " + str(baseline_row.get("severity")) + ": " + "; ".join(baseline_row.get("notes", []))
                site["ok"] = False
                result["ok"] = False
                failed += 1
    result["liveBaselineCompare"] = {
        "path": repo_rel(paths.root, path),
        "entries": len(baseline.get("entries", {})),
        "compared": compared,
        "failed": failed,
        "failThreshold": threshold,
    }
    return result


def render_live_baseline_report(result: dict[str, Any]) -> str:
    capture = result.get("liveBaselineCapture")
    compare = result.get("liveBaselineCompare")
    rows = [row for row in fixture_rows(result) if row.get("liveBaseline")]
    status = "CAPTURED" if capture and not compare else "PASS"
    if any(live_drift_should_fail((row.get("liveBaseline") or {}), "high") for row in rows):
        status = "DRIFT"
    lines = [
        "# Content-site accepted live baseline report",
        "",
        f"Status: **{status}**",
        "",
        "Accepted live baselines are opt-in. They compare current guarded live smoke results against a previously accepted live snapshot, not only against static fixtures.",
        "",
    ]
    if capture:
        lines.extend([
            "## Capture",
            "",
            f"- Baseline: `{capture.get('path')}`",
            f"- Entries written: `{capture.get('entries')}`",
            f"- Updated: `{capture.get('updatedAt')}`",
            "",
        ])
    if compare:
        lines.extend([
            "## Compare",
            "",
            f"- Baseline: `{compare.get('path')}`",
            f"- Baseline entries: `{compare.get('entries')}`",
            f"- Compared rows: `{compare.get('compared')}`",
            f"- Fail threshold: `{compare.get('failThreshold')}`",
            "",
        ])
    lines.extend([
        "| Site | Fixture | Viewport | Severity | Baseline found | Cards | Ratio | Missing accepted selectors |",
        "| --- | --- | --- | --- | --- | ---: | ---: | --- |",
    ])
    if not rows:
        lines.append("| _none_ |  |  |  |  |  |  |  |")
    for row in rows:
        baseline = row.get("liveBaseline") or {}
        ratio = baseline.get("ratio")
        ratio_text = "" if ratio is None else f"{float(ratio):.2f}"
        accepted = baseline.get("acceptedLiveCards")
        live = baseline.get("liveCards")
        cards_text = f"{live}/{accepted if accepted is not None else 'missing'}"
        missing = html.escape(", ".join(baseline.get("missingAcceptedSelectors") or []))
        lines.append(
            f"| `{row.get('site')}` | `{row.get('id')}` | `{row.get('viewport')}` | **{baseline.get('severity')}** | "
            f"{bool(baseline.get('baselineFound'))} | {cards_text} | {ratio_text} | {missing} |"
        )
    notes = []
    for row in rows:
        baseline = row.get("liveBaseline") or {}
        if baseline.get("notes"):
            notes.append(f"- `{row.get('site')}/{row.get('viewport')}`: " + "; ".join(str(item) for item in baseline.get("notes") or []))
    if notes:
        lines.extend(["", "## Notes", "", *notes])
    return "\n".join(lines)

def write_reports(paths: RepoPaths, output_dir: Path, result: dict[str, Any]) -> None:
    result_path = write_result(output_dir, "content-site-smoke-results.json", result)
    report_path = write_text(output_dir, "content-site-smoke-summary.md", render_markdown_report(result))
    artifacts = {
        "json": repo_rel(paths.root, result_path),
        "markdown": repo_rel(paths.root, report_path),
    }
    if result.get("run", {}).get("liveDrift"):
        drift_path = write_text(output_dir, "content-site-live-drift.md", render_live_drift_report(result))
        artifacts["liveDriftMarkdown"] = repo_rel(paths.root, drift_path)
    if result.get("run", {}).get("liveBaselineCapture") or result.get("run", {}).get("liveBaselineUpdate") or result.get("run", {}).get("liveBaselineCompare"):
        baseline_report = write_text(output_dir, "content-site-live-baseline.md", render_live_baseline_report(result))
        artifacts["liveBaselineMarkdown"] = repo_rel(paths.root, baseline_report)
        if result.get("liveBaselineCapture"):
            artifacts["liveBaselineJson"] = result["liveBaselineCapture"].get("path")
        elif result.get("liveBaselineCompare"):
            artifacts["liveBaselineJson"] = result["liveBaselineCompare"].get("path")
    result["artifacts"] = artifacts
    write_result(output_dir, "content-site-smoke-results.json", result)


def run_browser(paths: RepoPaths, config_data: dict[str, Any], selected: list[dict[str, Any]], args: argparse.Namespace) -> dict[str, Any]:
    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        raise SmokeError(
            "Playwright is not installed. Create the repo-wide smoke env first:\n"
            "  python3 -m venv .venv-smoke\n"
            "  . .venv-smoke/bin/activate\n"
            "  pip install -r requirements-smoke.txt\n"
            "  python -m playwright install chromium"
        ) from exc

    output_dir = output_dir_for_run(paths, config_data, args)
    output_dir.mkdir(parents=True, exist_ok=True)
    viewports = select_viewports(config_data, args)
    result: dict[str, Any] = {
        "ok": True,
        "builder": config_data.get("builder"),
        "sites": [],
        "run": {
            "startedAt": utc_now_iso(),
            "browser": args.browser or config_data.get("defaultBrowser", "chromium"),
            "headless": not args.headed,
            "config": repo_rel(paths.root, paths.config_path),
            "output": repo_rel(paths.root, output_dir),
            "viewports": [item.id for item in viewports],
            "trace": args.trace,
            "snapshot": args.snapshot,
            "interactions": True,
            "live": bool(args.live),
            "liveInteractions": bool(args.live_interactions),
            "liveThirdPartyAllowed": bool(args.allow_live_third_party),
            "liveDrift": bool(args.live_drift),
            "failOnLiveDrift": bool(args.fail_on_live_drift),
            "liveBaselineCapture": bool(args.live_baseline_capture),
            "liveBaselineUpdate": bool(args.live_baseline_update),
            "liveBaselineCompare": bool(args.live_baseline_compare),
            "failOnLiveBaselineDrift": bool(args.fail_on_live_baseline_drift),
            "pagetualContract": bool(args.pagetual_contract),
            "accessibilityContract": bool(args.a11y_contract),
        },
    }
    browser_name = result["run"]["browser"]
    timeout = int(args.timeout)
    server: ThreadingHTTPServer | None = None
    base_url = ""
    if not args.file_url and not args.live:
        server, base_url = start_static_server(paths.root)
        result["fixtureServer"] = base_url

    if args.live and args.pagetual and not args.allow_live_pagetual:
        raise SmokeError("refusing to inject PageTual on live sites without --allow-live-pagetual")

    try:
        with sync_playwright() as pw:
            browser_factory = getattr(pw, browser_name, None)
            if browser_factory is None:
                raise SmokeError(f"unknown browser: {browser_name}")
            launch_options = {"headless": not args.headed}
            executable = resolve_browser_executable(paths.root, args.executable)
            browser_executable_description = describe_browser_executable(paths.root, args.executable)
            if executable:
                launch_options["executable_path"] = executable
            try:
                browser = browser_factory.launch(**launch_options)
            except Exception as exc:
                attempted = f" using {browser_executable_description}"
                raise SmokeError(
                    f"could not launch Playwright browser {browser_name!r}{attempted}: {exc}\n"
                    f"Attempted executable: {browser_executable_description}\n"
                    f"Launch error: {type(exc).__name__}: {exc}\n"
                    f"Install the browser once with:\n"
                    f"  python -m playwright install {browser_name}\n"
                    f"or point at a system browser with --executable /usr/bin/chromium"
                ) from exc
            try:
                for site in selected:
                    site_result: dict[str, Any] = {"id": site["id"], "ok": True, "fixtures": []}
                    result["sites"].append(site_result)
                    script_path = rel_path(paths.root, site["script"])
                    for fixture in fixtures_for_site(site, args):
                        for viewport in viewports:
                            slug = safe_slug(f"{site['id']}-{fixture['id']}-{viewport.id}")
                            context = browser.new_context(viewport={"width": viewport.width, "height": viewport.height})
                            if fixture.get("live"):
                                install_live_network_guards(context, live_host(fixture["url"]), bool(args.allow_live_third_party))
                            tracing_active = args.trace in {"on", "retain-on-failure"}
                            if tracing_active:
                                context.tracing.start(screenshots=True, snapshots=True, sources=True)
                            page = context.new_page()
                            install_userscript_mocks(page)
                            console_events: list[dict[str, Any]] = []

                            def on_console(msg: Any) -> None:
                                try:
                                    console_events.append({"type": msg.type, "text": msg.text, "location": msg.location})
                                except Exception:
                                    console_events.append({"type": "console", "text": str(msg)})

                            def on_pageerror(exc: Any) -> None:
                                console_events.append({"type": "pageerror", "text": str(exc), "location": {}})

                            page.on("console", on_console)
                            page.on("pageerror", on_pageerror)
                            fixture_result: dict[str, Any] = {
                                "id": fixture["id"],
                                "viewport": viewport.id,
                                "viewportSize": {"width": viewport.width, "height": viewport.height},
                                "ok": True,
                            }
                            site_result["fixtures"].append(fixture_result)
                            failed = False
                            started = time.perf_counter()
                            try:
                                if fixture.get("live"):
                                    url = fixture["url"]
                                else:
                                    url = page_url(paths.root, rel_path(paths.root, fixture["path"]), base_url, args.file_url)
                                fixture_result["url"] = url
                                try:
                                    page.goto(url, wait_until="domcontentloaded", timeout=timeout)
                                except Exception as exc:
                                    if fixture.get("live"):
                                        raise
                                    ready_state = "unknown"
                                    body_present = False
                                    for _ in range(8):
                                        try:
                                            ready_state = page.evaluate("() => document.readyState").strip()
                                            body_present = bool(page.locator("body").count())
                                            if body_present:
                                                break
                                        except Exception:
                                            page.wait_for_timeout(150)
                                    if not body_present:
                                        raise
                                    fixture_result["navigationWarning"] = f"continued after fixture navigation timeout/state={ready_state}: {type(exc).__name__}: {exc}"
                                neutralize_fixture_blockers(page)
                                if args.pagetual and args.inject_real_pagetual:
                                    page.add_script_tag(path=str(rel_path(paths.root, args.pagetual)))
                                    fixture_result["pagetualScript"] = "injected-real"
                                elif args.pagetual:
                                    fixture_result["pagetualScript"] = "simulated-events-only"
                                page.add_script_tag(path=str(script_path))
                                fixture_result["assertions"] = evaluate_common_assertions(page, fixture, timeout)
                                if fixture.get("liveDrift"):
                                    drift = evaluate_live_drift(page, config_data, site, fixture, fixture_result["assertions"])
                                    fixture_result["drift"] = drift
                                    fail_threshold = str(((config_data.get("liveSmoke") or {}).get("driftReport") or {}).get("failSeverity", "high"))
                                    if args.fail_on_live_drift and live_drift_should_fail(drift, fail_threshold):
                                        raise SmokeError(f"live drift severity {drift.get('severity')} exceeded {fail_threshold}: {'; '.join(drift.get('notes', []))}")
                                if fixture.get("assertDrawer", True):
                                    fixture_result["drawer"] = assert_drawer(page, site, timeout)
                                if args.a11y_contract:
                                    fixture_result["accessibility"] = assert_accessibility_contract(page, site, fixture, viewport, timeout)
                                fixture_result["interactions"] = assert_interactions(page, paths, site, fixture, timeout)
                                if fixture.get("simulatePageTual", False) or args.pagetual_contract:
                                    if args.pagetual_contract:
                                        fixture_result["pagetualContract"] = assert_pagetual_contract_v2(page, paths, site, fixture, timeout)
                                    else:
                                        fixture_result["pagetual"] = simulate_pagetual(page, paths, site, timeout)
                                errors = console_error_text(console_events)
                                fixture_result["console"] = {"events": len(console_events), "errors": len(errors)}
                                if errors and not fixture.get("allowConsoleErrors", False):
                                    raise SmokeError("console/page errors: " + " | ".join(errors[:8]))
                            except Exception as exc:
                                failed = True
                                result["ok"] = False
                                site_result["ok"] = False
                                fixture_result["ok"] = False
                                fixture_result["error"] = str(exc)
                            finally:
                                fixture_result["durationMs"] = int((time.perf_counter() - started) * 1000)
                                log_path = write_console_log(paths, output_dir, slug, console_events)
                                if log_path:
                                    fixture_result["consoleLog"] = log_path
                                maybe_write_failure_artifacts(paths, output_dir, page, fixture_result, slug, args.snapshot, failed)
                                if tracing_active:
                                    trace_path = output_dir / f"{slug}.trace.zip"
                                    try:
                                        if args.trace == "on" or (args.trace == "retain-on-failure" and failed):
                                            context.tracing.stop(path=str(trace_path))
                                            fixture_result["trace"] = repo_rel(paths.root, trace_path)
                                        else:
                                            context.tracing.stop()
                                    except Exception as exc:
                                        fixture_result["traceError"] = str(exc)
                                context.close()
            finally:
                browser.close()
    finally:
        if server is not None:
            server.shutdown()
            server.server_close()
    result["run"]["finishedAt"] = utc_now_iso()
    if args.live_baseline_compare:
        compare_live_baseline(paths, config_data, result, args)
    if args.live_baseline_capture or args.live_baseline_update:
        write_live_baseline(paths, config_data, result, args)
    write_reports(paths, output_dir, result)
    return result


def render_existing_report(paths: RepoPaths, json_path: Path, output: str | None) -> Path:
    result = load_json(json_path)
    markdown = render_markdown_report(result)
    if output:
        out = rel_path(paths.root, output)
    else:
        out = json_path.with_name("content-site-smoke-summary.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(markdown, encoding="utf-8")
    return out


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Run optional repo-wide Playwright smoke checks for generated userscripts.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent(
            """
            Examples:
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --list
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --site gayteam --site str8upgayporn
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --all --matrix
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --all --matrix --pagetual-contract
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --all --matrix --a11y-contract
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --site gayteam --live --matrix
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --all --matrix --live-drift
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --live --all --matrix --live-drift --live-baseline-compare
              python tools/smoke/run-content-site-smoke.py --builder content-site-modernizer --report smoke-results/content-site-modernizer/content-site-smoke-results.json
              PLAYWRIGHT_SMOKE=1 devtool ... apply-overlay overlay.zip --validate
            """
        ),
    )
    parser.add_argument("--builder", default="content-site-modernizer")
    parser.add_argument("--config", default=None, help="Config path relative to repo root")
    parser.add_argument("--site", action="append", default=[], help="Site id to smoke; may be repeated")
    parser.add_argument("--all", action="store_true", help="Smoke every configured site")
    parser.add_argument("--list", action="store_true", help="List configured sites and exit")
    parser.add_argument("--check-config", action="store_true", help="Validate smoke config and exit without Playwright")
    parser.add_argument("--report", default=None, help="Render Markdown from an existing smoke JSON result and exit")
    parser.add_argument("--report-output", default=None, help="Optional Markdown output path for --report")
    parser.add_argument("--browser", default=None, help="chromium, firefox, or webkit")
    parser.add_argument("--headed", action="store_true", help="Run with a visible browser")
    parser.add_argument("--pagetual", default=None, help="Optional PageTual userscript path used by PageTual fixture contracts")
    parser.add_argument("--inject-real-pagetual", action="store_true", help="Execute the real PageTual userscript during fixture smoke; disabled by default because deterministic contracts simulate PageTual insert events")
    parser.add_argument("--pagetual-contract", action="store_true", help="Run PageTual compatibility contract v2 on feed fixtures")
    parser.add_argument("--a11y-contract", action="store_true", help="Run shared UI accessibility smoke checks on local/live pages")
    parser.add_argument("--live", action="store_true", help="Use guarded live URLs from smoke.config.json instead of local fixtures")
    parser.add_argument("--live-interactions", action="store_true", help="Run interaction checks on live pages; disabled by default")
    parser.add_argument("--live-drift", action="store_true", help="Write live DOM/card drift report without making drift a failure")
    parser.add_argument("--fail-on-live-drift", action="store_true", help="Fail when live drift reaches the configured severity threshold")
    parser.add_argument("--live-baseline", default=None, help="Accepted live baseline JSON path; defaults to smoke.config.json liveSmoke.baseline.path")
    parser.add_argument("--live-baseline-capture", action="store_true", help="Capture the current live-drift run as the accepted live baseline")
    parser.add_argument("--live-baseline-update", action="store_true", help="Explicit alias for --live-baseline-capture when refreshing an accepted baseline")
    parser.add_argument("--live-baseline-compare", action="store_true", help="Compare current live-drift rows against the accepted live baseline")
    parser.add_argument("--fail-on-live-baseline-drift", action="store_true", help="Fail when accepted-live baseline drift reaches the configured severity threshold")
    parser.add_argument("--allow-live-pagetual", action="store_true", help="Allow PageTual injection while --live is active")
    parser.add_argument("--allow-live-third-party", action="store_true", help="Allow third-party live page requests instead of blocking them")
    parser.add_argument("--executable", default=None, help="Optional browser executable path, e.g. /usr/bin/chromium")
    parser.add_argument("--file-url", action="store_true", help="Open fixtures as file:// URLs instead of serving the repo on localhost")
    parser.add_argument("--output", default="smoke-results/content-site-modernizer")
    parser.add_argument("--timeout", type=int, default=8000, help="Per-page timeout in milliseconds")
    parser.add_argument("--width", type=int, default=390)
    parser.add_argument("--height", type=int, default=900)
    parser.add_argument("--viewport", dest="viewports", action="append", default=[], help="Configured viewport id to run; may be repeated")
    parser.add_argument("--matrix", action="store_true", help="Run the configured default viewport matrix")
    parser.add_argument("--trace", choices=["off", "on", "retain-on-failure"], default="retain-on-failure")
    parser.add_argument("--snapshot", choices=["off", "on", "retain-on-failure"], default="retain-on-failure", help="Write post-injection HTML snapshots")
    args = parser.parse_args(argv)

    try:
        paths = resolve_paths(args.builder, args.config)
        config_data = load_json(paths.config_path)
        problems = validate_config(paths, config_data)
        if problems:
            for problem in problems:
                print(f"smoke config error: {problem}", file=sys.stderr)
            return 2
        if args.report:
            report_path = render_existing_report(paths, rel_path(paths.root, args.report), args.report_output)
            print(f"smoke report written: {repo_rel(paths.root, report_path)}")
            return 0
        if args.live_drift and not args.live:
            raise SmokeError("--live-drift requires --live")
        if args.fail_on_live_drift and not args.live_drift:
            raise SmokeError("--fail-on-live-drift requires --live-drift")
        baseline_modes = [args.live_baseline_capture, args.live_baseline_update, args.live_baseline_compare]
        if any(baseline_modes) and not (args.live and args.live_drift):
            raise SmokeError("live baseline modes require --live --live-drift")
        if args.live_baseline_capture and args.live_baseline_update:
            raise SmokeError("use either --live-baseline-capture or --live-baseline-update, not both")
        if args.fail_on_live_baseline_drift and not args.live_baseline_compare:
            raise SmokeError("--fail-on-live-baseline-drift requires --live-baseline-compare")
        selected = site_by_id(config_data, args.site, args.all)
        if args.list:
            matrix_ids = ", ".join(configured_viewports(config_data))
            print(f"viewports: {matrix_ids}")
            for site in config_data["sites"]:
                marker = "*" if site in selected else " "
                live = " live" if site.get("live") else ""
                print(f"{marker} {site['id']}: {site.get('name', site['id'])}{live}")
            return 0
        if args.check_config:
            viewport_count = len(configured_viewports(config_data))
            print(f"smoke config ok: {paths.config_path.relative_to(paths.root)} ({len(config_data['sites'])} sites, {viewport_count} viewports)")
            return 0
        result = run_browser(paths, config_data, selected, args)
        for site in result["sites"]:
            status = "PASS" if site["ok"] else "FAIL"
            print(f"{status} {site['id']}")
            for fixture in site["fixtures"]:
                fstatus = "PASS" if fixture["ok"] else "FAIL"
                extra = f" - {fixture.get('error')}" if not fixture["ok"] else ""
                viewport = fixture.get("viewport", "custom")
                print(f"  {fstatus} {fixture['id']} [{viewport}]{extra}")
        if result.get("artifacts"):
            print(f"results: {result['artifacts'].get('json')}")
            print(f"summary: {result['artifacts'].get('markdown')}")
            if result['artifacts'].get('liveDriftMarkdown'):
                print(f"live drift: {result['artifacts'].get('liveDriftMarkdown')}")
            if result['artifacts'].get('liveBaselineMarkdown'):
                print(f"live baseline: {result['artifacts'].get('liveBaselineMarkdown')}")
            if result['artifacts'].get('liveBaselineJson'):
                print(f"accepted baseline: {result['artifacts'].get('liveBaselineJson')}")
        return 0 if result["ok"] else 1
    except SmokeError as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
