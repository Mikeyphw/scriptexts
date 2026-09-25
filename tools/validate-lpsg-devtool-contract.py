#!/usr/bin/env python3
from __future__ import annotations

import os
from pathlib import Path
import tomllib

ROOT = Path(__file__).resolve().parents[1]
CONFIG = tomllib.loads((ROOT / ".devtool.toml").read_text(encoding="utf-8"))
TARGET_NAME = "lpsg-media-gallery-unlocker"


def fail(message: str) -> None:
    raise SystemExit(f"LPSG Devtool contract: FAIL: {message}")


wrapper = CONFIG.get("wrapper", {})
if wrapper.get("schema") != 1:
    fail("wrapper schema must be 1")
if wrapper.get("default_command") != "validate":
    fail("wrapper default command must be validate")

expected_workflows = {
    "build": "build",
    "check": "check",
    "test": "test",
    "seal": "seal",
    "validate": "validate",
}
commands = wrapper.get("commands", {})
if set(commands) != set(expected_workflows):
    fail(f"wrapper command set mismatch: {sorted(commands)}")
for name, workflow in expected_workflows.items():
    command = commands[name]
    if command.get("workflow") != workflow:
        fail(f"wrapper {name} must resolve workflow {workflow}")
    if command.get("target") != TARGET_NAME:
        fail(f"wrapper {name} must target {TARGET_NAME}")
    if command.get("devtool"):
        fail(f"wrapper {name} must use workflow resolution, not a native devtool binding")

try:
    target = CONFIG["targets"][TARGET_NAME]
except KeyError:
    fail(f"target {TARGET_NAME} is missing")

expected_output = "userscripts/standalone/lpsg-media-gallery-unlocker/lpsg-media-gallery-unlocker.user.js"
if target.get("outputs") != [expected_output]:
    fail(f"target output must be the generated standalone userscript: {target.get('outputs')!r}")

jobs = target.get("jobs", {})
expected_jobs = {"build", "reproducibility", "syntax", "regression", "seal"}
if set(jobs) != expected_jobs:
    fail(f"target-local job set mismatch: {sorted(jobs)}")

expected_commands = {
    "build": ["node", "build.mjs"],
    "reproducibility": ["node", "build.mjs", "--check"],
    "syntax": ["node", "--check", "../../standalone/lpsg-media-gallery-unlocker/lpsg-media-gallery-unlocker.user.js"],
    "regression": ["node", "--test", "test/lpsg.test.mjs", "test/release-seal.test.mjs"],
    "seal": ["node", "release-seal.mjs", "--json"],
}
for name, command in expected_commands.items():
    job = jobs[name]
    if job.get("runner") != "command" or job.get("command") != command:
        fail(f"job {name} command contract drifted")
    if name != "build" and job.get("metadata", {}).get("read_only") is not True:
        fail(f"job {name} must remain explicitly read-only")

workflows = target.get("workflows", {})
if set(workflows) != {"build", "check", "test", "seal", "validate"}:
    fail(f"workflow set mismatch: {sorted(workflows)}")

validate = workflows["validate"]
validate_refs = {step.get("ref") for step in validate if isinstance(step, dict)}
if validate_refs != {"job:reproducibility", "job:syntax", "job:regression"}:
    fail(f"validate workflow refs drifted: {sorted(validate_refs)}")
if any(step.get("depends_on") != [] for step in validate if isinstance(step, dict)):
    fail("validate workflow must keep the three read-only checks independent for safe parallel scheduling")

for name in ("devtoolw", "devtoolw.cmd"):
    path = ROOT / name
    if not path.is_file():
        fail(f"{name} launcher missing")
    text = path.read_text(encoding="utf-8")
    if "DEVTOOL_WRAPPER_LAUNCHER=1" not in text or "wrapper exec" not in text:
        fail(f"{name} is not a Devtool-managed wrapper launcher")
if os.name != "nt" and not os.access(ROOT / "devtoolw", os.X_OK):
    fail("devtoolw must be executable")

if not (ROOT / "docs" / "WRAPPER.md").is_file():
    fail("docs/WRAPPER.md missing")

standalone = ROOT / "userscripts" / "standalone" / "lpsg-media-gallery-unlocker" / "lpsg-media-gallery-unlocker.user.js"
text = standalone.read_text(encoding="utf-8")
if "// @version      6.7.5-optimized" not in text:
    fail("expected LPSG 6.7.5-optimized generated userscript")

print("LPSG Devtool wrapper/EXO/TLJ contract: PASS")
