#!/usr/bin/env python3
"""Optional visual regression thumbnail runner for content-site userscripts.

Normal repository validation should only compile this file and run --check-config.
Browser execution happens explicitly through the npm visual smoke commands.
"""
from __future__ import annotations

import argparse
import contextlib
import datetime as _dt
import functools
import json
import os
import re
import sys
import threading
import time
from dataclasses import dataclass
from hashlib import sha256
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


class VisualError(RuntimeError):
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


def utc_now_iso() -> str:
    return _dt.datetime.now(tz=_dt.UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def safe_slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", value.strip()).strip("-._") or "item"


def find_repo_root(start: Path) -> Path:
    cur = start.resolve()
    for candidate in [cur, *cur.parents]:
        if (candidate / "repo-manifest.json").is_file() and (candidate / "userscripts").is_dir():
            return candidate
    raise VisualError(f"could not find repo root above {start}")


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise VisualError(f"missing config: {path}") from exc
    except json.JSONDecodeError as exc:
        raise VisualError(f"invalid JSON in {path}: {exc}") from exc


def rel_path(root: Path, value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else root / path


def repo_rel(root: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except Exception:
        return str(path)


def resolve_browser_executable(root: Path, executable: str | None) -> str | None:
    value = executable or os.environ.get("PLAYWRIGHT_EXECUTABLE_PATH")
    if not value:
        return None
    path = Path(value)
    return str(path if path.is_absolute() else root / path)



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


def resolve_paths(builder: str, config: str | None) -> RepoPaths:
    root = find_repo_root(Path.cwd())
    if config:
        config_path = Path(config).resolve() if Path(config).is_absolute() else (root / config).resolve()
        data = load_json(config_path)
        builder_rel = data.get("builderRoot") or "userscripts/builders/content-site-modernizer"
        return RepoPaths(root=root, builder_root=(root / builder_rel).resolve(), config_path=config_path)
    builders = {"content-site-modernizer": "userscripts/builders/content-site-modernizer"}
    builder_rel = builders.get(builder, builder)
    builder_root = (root / builder_rel).resolve()
    return RepoPaths(root=root, builder_root=builder_root, config_path=builder_root / "smoke.config.json")


def configured_viewports(config_data: dict[str, Any]) -> dict[str, ViewportSpec]:
    raw = config_data.get("viewports") or [
        {"id": "mobile", "width": 390, "height": 900},
        {"id": "desktop", "width": 1280, "height": 900},
    ]
    out: dict[str, ViewportSpec] = {}
    for item in raw:
        spec = ViewportSpec(str(item["id"]), int(item["width"]), int(item["height"]))
        if spec.id in out:
            raise VisualError(f"duplicate viewport id: {spec.id}")
        out[spec.id] = spec
    return out


def visual_config(config_data: dict[str, Any]) -> dict[str, Any]:
    return config_data.get("visualRegression") or {}


def select_viewports(config_data: dict[str, Any], args: argparse.Namespace) -> list[ViewportSpec]:
    available = configured_viewports(config_data)
    requested = args.viewports
    if requested:
        missing = sorted(set(requested) - set(available))
        if missing:
            raise VisualError(f"unknown viewport id(s): {', '.join(missing)}")
        return [available[item] for item in requested]
    if args.matrix:
        ids = visual_config(config_data).get("viewports") or config_data.get("defaultMatrixViewports") or list(available)
        missing = sorted(set(ids) - set(available))
        if missing:
            raise VisualError(f"visual/default matrix references unknown viewport(s): {', '.join(missing)}")
        return [available[item] for item in ids]
    return [ViewportSpec("custom", int(args.width), int(args.height))]


def select_sites(config_data: dict[str, Any], args: argparse.Namespace) -> list[dict[str, Any]]:
    sites = config_data.get("sites") or []
    if args.all:
        return sites
    wanted = set(args.sites or [])
    if not wanted:
        wanted = set(visual_config(config_data).get("focusedSites") or config_data.get("defaultSites") or [site["id"] for site in sites[:3]])
    selected = [site for site in sites if site.get("id") in wanted]
    missing = wanted - {site.get("id") for site in selected}
    if missing:
        raise VisualError(f"unknown site id(s): {', '.join(sorted(missing))}")
    return selected


def select_fixtures(site: dict[str, Any], args: argparse.Namespace, config_data: dict[str, Any]) -> list[dict[str, Any]]:
    fixtures = site.get("fixtures") or []
    if args.fixtures:
        if "all" in args.fixtures:
            return fixtures
        wanted = set(args.fixtures)
    else:
        wanted = set(visual_config(config_data).get("defaultFixtures") or ["home"])
    selected = [fixture for fixture in fixtures if fixture.get("id") in wanted]
    if not selected:
        raise VisualError(f"{site.get('id')}: no fixture matched {', '.join(sorted(wanted))}")
    return selected


def validate_config(paths: RepoPaths, config_data: dict[str, Any]) -> list[str]:
    problems: list[str] = []
    if config_data.get("schemaVersion") != 1:
        problems.append("schemaVersion must be 1")
    sites = config_data.get("sites")
    if not isinstance(sites, list) or not sites:
        problems.append("sites must be a non-empty list")
        return problems
    try:
        configured_viewports(config_data)
    except Exception as exc:
        problems.append(str(exc))
    visual = visual_config(config_data)
    for key in ["baselineDir", "outputDir", "report"]:
        if not visual.get(key):
            problems.append(f"visualRegression.{key} is required")
    if visual.get("enabledByFlagOnly") is not True:
        problems.append("visualRegression.enabledByFlagOnly must be true")
    if not isinstance(visual.get("thresholdRatio", 0), (int, float)):
        problems.append("visualRegression.thresholdRatio must be numeric")
    seen: set[str] = set()
    for site in sites:
        sid = site.get("id")
        if not isinstance(sid, str) or not sid:
            problems.append("site missing string id")
            continue
        if sid in seen:
            problems.append(f"duplicate site id: {sid}")
        seen.add(sid)
        script = site.get("script")
        if not script or not rel_path(paths.root, script).is_file():
            problems.append(f"{sid}: missing generated userscript {script}")
        fixtures = site.get("fixtures")
        if not isinstance(fixtures, list) or not fixtures:
            problems.append(f"{sid}: fixtures must be a non-empty list")
            continue
        for fixture in fixtures:
            fid = fixture.get("id")
            fpath = fixture.get("path")
            if not fid:
                problems.append(f"{sid}: fixture missing id")
            if not fpath or not rel_path(paths.root, fpath).is_file():
                problems.append(f"{sid}/{fid}: missing fixture {fpath}")
    return problems


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
        return


def start_static_server(root: Path) -> tuple[ThreadingHTTPServer, str]:
    handler = functools.partial(QuietHandler, directory=str(root))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, f"http://127.0.0.1:{server.server_port}"


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


def inject_visual_stability(page: Any) -> None:
    page.add_style_tag(content="""
      *, *::before, *::after {
        animation-delay: -1ms !important;
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-delay: 0ms !important;
        transition-duration: 0ms !important;
      }
      iframe, video, canvas { visibility: hidden !important; }
      [id^="ad"], [class*=" ad"], [class^="ad"], .ads, .advertisement,
      #alc3yar, #lkai, .pagetual_sideController { display: none !important; pointer-events: none !important; }
    """)
    page.evaluate("() => { window.scrollTo(0, 0); document.documentElement.classList.add('csm-visual-smoke'); }")


def screenshot_name(site_id: str, fixture_id: str, viewport_id: str) -> str:
    return f"{safe_slug(site_id)}-{safe_slug(fixture_id)}-{safe_slug(viewport_id)}.png"


def sha_file(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def compare_images(current: Path, baseline: Path, diff: Path, threshold: float) -> dict[str, Any]:
    result: dict[str, Any] = {
        "baseline": str(baseline),
        "current": str(current),
        "thresholdRatio": threshold,
        "sha256": sha_file(current),
    }
    if not baseline.is_file():
        result.update({"status": "missing-baseline", "severity": "missing", "diffRatio": None})
        return result
    result["baselineSha256"] = sha_file(baseline)
    if result["sha256"] == result["baselineSha256"]:
        result.update({"status": "match", "severity": "ok", "diffRatio": 0.0})
        return result
    try:
        from PIL import Image, ImageChops  # type: ignore
    except Exception:
        result.update({
            "status": "changed",
            "severity": "high",
            "diffRatio": None,
            "note": "Pillow is not installed; byte hashes differ, but pixel diff was skipped. Install requirements-smoke.txt for visual diff images.",
        })
        return result
    with Image.open(baseline) as base_img, Image.open(current) as cur_img:
        base = base_img.convert("RGBA")
        cur = cur_img.convert("RGBA")
        if base.size != cur.size:
            max_w = max(base.width, cur.width)
            max_h = max(base.height, cur.height)
            padded_base = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
            padded_cur = Image.new("RGBA", (max_w, max_h), (0, 0, 0, 0))
            padded_base.paste(base, (0, 0))
            padded_cur.paste(cur, (0, 0))
            base = padded_base
            cur = padded_cur
            result["sizeChanged"] = True
        diff_img = ImageChops.difference(base, cur)
        bbox = diff_img.getbbox()
        if bbox is None:
            diff_ratio = 0.0
        else:
            alpha = diff_img.convert("L")
            changed = sum(1 for value in alpha.getdata() if value)
            diff_ratio = changed / float(alpha.width * alpha.height)
            diff.parent.mkdir(parents=True, exist_ok=True)
            # Increase visibility while keeping original differences recognizable.
            visual = diff_img.point(lambda p: min(255, p * 4))
            visual.save(diff)
            result["diff"] = str(diff)
        if diff_ratio <= threshold:
            severity = "ok"
        elif diff_ratio <= 0.05:
            severity = "medium"
        else:
            severity = "high"
        result.update({"status": "changed", "severity": severity, "diffRatio": diff_ratio})
        return result


def maybe_write_thumbnail(source: Path, thumb: Path, width: int = 360) -> str | None:
    try:
        from PIL import Image  # type: ignore
    except Exception:
        return None
    try:
        with Image.open(source) as image:
            img = image.convert("RGBA")
            if img.width <= width:
                target = img.copy()
            else:
                height = max(1, round(img.height * (width / img.width)))
                target = img.resize((width, height))
            thumb.parent.mkdir(parents=True, exist_ok=True)
            target.save(thumb)
            return str(thumb)
    except Exception:
        return None


def render_report(payload: dict[str, Any]) -> str:
    lines = [
        "# Content-site visual regression report",
        "",
        f"Generated: `{payload['run']['finishedAt']}`",
        f"Mode: `{'capture' if payload['run'].get('capture') else 'compare'}`",
        f"Builder: `{payload['builder']}`",
        "",
        "| Site | Fixture | Viewport | Status | Severity | Diff | Current | Baseline |",
        "| --- | --- | --- | --- | --- | ---: | --- | --- |",
    ]
    for item in payload.get("screenshots", []):
        diff = item.get("diffRatio")
        diff_text = "n/a" if diff is None else f"{diff:.3%}"
        current = item.get("current") or ""
        baseline = item.get("baseline") or ""
        lines.append(
            f"| {item.get('site')} | {item.get('fixture')} | {item.get('viewport')} | "
            f"{item.get('status')} | {item.get('severity')} | {diff_text} | `{current}` | `{baseline}` |"
        )
    lines.extend(["", "## Notes", ""])
    if payload.get("ok"):
        lines.append("No visual drift exceeded the configured threshold.")
    else:
        lines.append("One or more screenshots changed, exceeded threshold, or did not have a baseline.")
    lines.append("")
    lines.append("Capture/update baselines only after reviewing the generated current screenshots.")
    return "\n".join(lines) + "\n"


def run_visual(args: argparse.Namespace, paths: RepoPaths, config_data: dict[str, Any]) -> dict[str, Any]:
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except Exception as exc:
        raise VisualError(
            "could not import Playwright. Install smoke dependencies once with:\n"
            "  python3 -m venv .venv-smoke\n"
            "  . .venv-smoke/bin/activate\n"
            "  pip install -r requirements-smoke.txt\n"
            "  python -m playwright install chromium\n"
            "or point at a system browser with --executable /usr/bin/chromium"
        ) from exc

    visual = visual_config(config_data)
    output_dir = rel_path(paths.root, args.output or visual.get("outputDir") or "smoke-results/content-site-modernizer-visual")
    baseline_dir = rel_path(paths.root, args.baseline_dir or visual.get("baselineDir") or "tools/smoke/visual-baselines/content-site-modernizer")
    report_name = visual.get("report") or "content-site-visual-regression.md"
    threshold = float(args.threshold if args.threshold is not None else visual.get("thresholdRatio", 0.015))
    current_dir = output_dir / "current"
    diff_dir = output_dir / "diff"
    thumb_dir = output_dir / "thumbs"
    baseline_thumb_dir = baseline_dir / "thumbs"
    current_dir.mkdir(parents=True, exist_ok=True)
    baseline_dir.mkdir(parents=True, exist_ok=True)

    selected_sites = select_sites(config_data, args)
    viewports = select_viewports(config_data, args)
    server, base_url = start_static_server(paths.root)
    started_at = utc_now_iso()
    screenshots: list[dict[str, Any]] = []
    try:
        with sync_playwright() as p:
            browser_type = getattr(p, args.browser)
            launch_options: dict[str, Any] = {"headless": not args.headful}
            executable = resolve_browser_executable(paths.root, args.executable)
            browser_executable_description = describe_browser_executable(paths.root, args.executable)
            if executable:
                launch_options["executable_path"] = executable
            try:
                browser = browser_type.launch(**launch_options)
            except Exception as exc:
                attempted = f" using {browser_executable_description}"
                raise VisualError(
                    f"could not launch Playwright browser {args.browser!r}{attempted}: {exc}\n"
                    f"Attempted executable: {browser_executable_description}\n"
                    f"Launch error: {type(exc).__name__}: {exc}\n"
                    f"Install the browser once with:\n"
                    f"  python -m playwright install {args.browser}\n"
                    f"or point at a system browser with --executable /usr/bin/chromium"
                ) from exc
            try:
                for site in selected_sites:
                    script_path = rel_path(paths.root, site["script"])
                    script_text = script_path.read_text(encoding="utf-8")
                    for fixture in select_fixtures(site, args, config_data):
                        fixture_path = rel_path(paths.root, fixture["path"])
                        fixture_rel = repo_rel(paths.root, fixture_path)
                        url = f"{base_url}/{fixture_rel}"
                        for viewport in viewports:
                            context = browser.new_context(viewport={"width": viewport.width, "height": viewport.height}, reduced_motion="reduce")
                            page = context.new_page()
                            install_userscript_mocks(page)
                            page.add_init_script(script_text)
                            page.goto(url, wait_until="domcontentloaded", timeout=args.timeout_ms)
                            page.wait_for_timeout(args.wait_ms)
                            inject_visual_stability(page)
                            expect = fixture.get("expect") or {}
                            selectors = expect.get("selectors") or [expect.get("shellSelector"), ".csm-topbar"]
                            for selector in [item for item in selectors if item]:
                                with contextlib.suppress(Exception):
                                    page.locator(selector).first.wait_for(state="attached", timeout=1500)
                                    break
                            page.wait_for_timeout(150)
                            name = screenshot_name(site["id"], fixture["id"], viewport.id)
                            current = current_dir / name
                            baseline = baseline_dir / name
                            diff = diff_dir / name
                            page.screenshot(path=str(current), full_page=True, animations="disabled")
                            if args.capture or args.update:
                                baseline.write_bytes(current.read_bytes())
                                result = {
                                    "site": site["id"],
                                    "fixture": fixture["id"],
                                    "viewport": viewport.id,
                                    "status": "captured",
                                    "severity": "ok",
                                    "diffRatio": 0.0,
                                    "current": repo_rel(paths.root, current),
                                    "baseline": repo_rel(paths.root, baseline),
                                    "sha256": sha_file(current),
                                }
                                maybe_write_thumbnail(baseline, baseline_thumb_dir / name)
                            else:
                                result = compare_images(current, baseline, diff, threshold)
                                result.update({"site": site["id"], "fixture": fixture["id"], "viewport": viewport.id})
                                result["current"] = repo_rel(paths.root, current)
                                result["baseline"] = repo_rel(paths.root, baseline)
                                if result.get("diff"):
                                    result["diff"] = repo_rel(paths.root, Path(result["diff"]))
                            thumb = maybe_write_thumbnail(current, thumb_dir / name)
                            if thumb:
                                result["thumbnail"] = repo_rel(paths.root, Path(thumb))
                            screenshots.append(result)
                            page.close()
                            context.close()
            finally:
                browser.close()
    finally:
        server.shutdown()

    blocking = [item for item in screenshots if item.get("severity") in {"missing", "medium", "high"}]
    if args.capture or args.update:
        ok = True
    elif args.fail_on_visual_diff:
        ok = not blocking
    else:
        # Compare is report-only by default, so ok only reflects runner execution.
        ok = True
    payload = {
        "ok": ok,
        "builder": config_data.get("builder") or args.builder,
        "run": {
            "startedAt": started_at,
            "finishedAt": utc_now_iso(),
            "browser": args.browser,
            "headless": not args.headful,
            "capture": bool(args.capture or args.update),
            "compare": not bool(args.capture or args.update),
            "thresholdRatio": threshold,
            "viewports": [viewport.id for viewport in viewports],
            "output": repo_rel(paths.root, output_dir),
            "baselineDir": repo_rel(paths.root, baseline_dir),
            "failOnVisualDiff": bool(args.fail_on_visual_diff),
        },
        "screenshots": screenshots,
        "artifacts": {
            "json": repo_rel(paths.root, output_dir / "content-site-visual-results.json"),
            "markdown": repo_rel(paths.root, output_dir / report_name),
        },
    }
    (output_dir / "content-site-visual-results.json").write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (output_dir / report_name).write_text(render_report(payload), encoding="utf-8")
    if args.capture or args.update:
        manifest = {
            "schemaVersion": 1,
            "builder": config_data.get("builder") or args.builder,
            "updatedAt": payload["run"]["finishedAt"],
            "thresholdRatio": threshold,
            "entries": [
                {key: item.get(key) for key in ["site", "fixture", "viewport", "baseline", "sha256"]}
                for item in screenshots
            ],
        }
        (baseline_dir / "visual-baseline-manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return payload


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Capture or compare content-site visual regression thumbnails.")
    parser.add_argument("--builder", default="content-site-modernizer")
    parser.add_argument("--config")
    parser.add_argument("--site", action="append", dest="sites")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--fixture", action="append", dest="fixtures", help="Fixture id to capture. Use --fixture all for every fixture.")
    parser.add_argument("--viewport", action="append", dest="viewports")
    parser.add_argument("--matrix", action="store_true")
    parser.add_argument("--width", type=int, default=1280)
    parser.add_argument("--height", type=int, default=900)
    parser.add_argument("--browser", default="chromium", choices=["chromium", "firefox", "webkit"])
    parser.add_argument("--executable")
    parser.add_argument("--headful", action="store_true")
    parser.add_argument("--capture", action="store_true", help="Capture/overwrite accepted visual baselines.")
    parser.add_argument("--update", action="store_true", help="Alias for --capture with explicit intent.")
    parser.add_argument("--compare", action="store_true", help="Compare current screenshots against accepted baselines. This is the default.")
    parser.add_argument("--fail-on-visual-diff", action="store_true")
    parser.add_argument("--threshold", type=float)
    parser.add_argument("--output")
    parser.add_argument("--baseline-dir")
    parser.add_argument("--wait-ms", type=int, default=600)
    parser.add_argument("--timeout-ms", type=int, default=15000)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--check-config", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        paths = resolve_paths(args.builder, args.config)
        config_data = load_json(paths.config_path)
        problems = validate_config(paths, config_data)
        if problems:
            raise VisualError("invalid visual smoke config:\n" + "\n".join(f"- {item}" for item in problems))
        if args.list:
            for site in config_data.get("sites", []):
                print(f"{site['id']}\t{site.get('name', site['id'])}")
            return 0
        if args.check_config:
            visual = visual_config(config_data)
            print(
                f"visual smoke config ok: {len(config_data.get('sites', []))} sites; "
                f"baseline={visual.get('baselineDir')}; output={visual.get('outputDir')}"
            )
            return 0
        if args.capture and args.compare:
            raise VisualError("choose either --capture or --compare, not both")
        payload = run_visual(args, paths, config_data)
        print(json.dumps({
            "ok": payload["ok"],
            "artifacts": payload["artifacts"],
            "screenshots": len(payload.get("screenshots", [])),
            "mode": "capture" if payload["run"].get("capture") else "compare",
        }, indent=2, sort_keys=True))
        return 0 if payload["ok"] else 1
    except VisualError as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
