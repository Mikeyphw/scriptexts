"""S7 P03 real scriptexts consumer acceptance, via the canonical Devtool CLI.

No import of private Devtool internals; no live GitHub calls, commits to the
consumer repository, or release assertions. CI uses an isolated source pin.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REPO = "Mikeyphw/scriptexts"


def git(path: Path, *args: str) -> str:
    result = subprocess.run(["git", "-C", str(path), *args], text=True,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            check=True, timeout=30)
    return result.stdout.strip()


def cli(path: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run([sys.executable, "-m", "devtool", "--repo", str(path), *args],
                            text=True, capture_output=True, check=False, timeout=90)
    if check and result.returncode:
        raise AssertionError("Devtool command refused: " + result.stderr[-1600:] +
                             result.stdout[-1200:])
    return result


class ConsumerAdoptionPilot(unittest.TestCase):
    def test_real_consumer_audit_is_read_only_and_nonqualifying(self) -> None:
        before = git(ROOT, "status", "--porcelain", "--untracked-files=all")
        audit = cli(ROOT, "delivery", "adoption", "audit", "--json")
        data = json.loads(audit.stdout)
        after = git(ROOT, "status", "--porcelain", "--untracked-files=all")
        self.assertEqual(before, after, "Audit must not write to the consumer checkout")
        self.assertEqual(data["schema"], "devtool.delivery-adoption-audit.v1")
        self.assertEqual(data["repository"], SOURCE_REPO)
        self.assertEqual(data["source_sha"], git(ROOT, "rev-parse", "HEAD"))
        self.assertTrue(data["worktree_clean"])
        self.assertTrue(data["devtool_config_present"])
        self.assertTrue(data["scaffolding_ready"])
        self.assertEqual(data["evidence_scope"], "local-git-and-static-advisory-only")
        self.assertIs(data["ci_qualified"], False)
        self.assertIs(data["release_qualified"], False)

    def test_existing_static_contract_stays_authoritative(self) -> None:
        result = subprocess.run([sys.executable, str(ROOT / "scripts" / "devtool_actions_contract.py")],
                                cwd=ROOT, capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["status"], "PASS")

    def test_data_only_scaffold_then_exact_tree_drift_refusal(self) -> None:
        with tempfile.TemporaryDirectory(prefix="s7-p03-") as temp:
            base = Path(temp)
            repo = base / "fixture"
            payload = base / "payload"
            repo.mkdir()
            payload.mkdir()
            git(repo, "init", "-b", "main")
            git(repo, "config", "user.name", "S7 Pilot")
            git(repo, "config", "user.email", "s7-pilot@example.invalid")
            git(repo, "remote", "add", "origin", "https://github.com/Mikeyphw/scriptexts.git")
            (repo / "README.md").write_text("fixture v1\n", encoding="utf-8")
            (repo / ".gitignore").write_text(".devtool/\n", encoding="utf-8")
            git(repo, "add", "README.md", ".gitignore")
            git(repo, "commit", "-m", "fixture v1")
            original = git(repo, "rev-parse", "HEAD")
            (payload / "NEW.txt").write_text("canonical devtool overlay\n", encoding="utf-8")
            plan = base / "plan.json"
            plan.write_text(json.dumps({"schema_version": 1, "changes": [
                {"path": "NEW.txt", "action": "add"}]}), encoding="utf-8")
            out = base / "scaffold.zip"
            result = cli(repo, "delivery", "adoption", "scaffold",
                         "--payload", str(payload), "--plan", str(plan),
                         "--output", str(out), "--expected-head", original, "--json")
            self.assertTrue(out.is_file())
            summary = json.loads(result.stdout)
            self.assertEqual(summary["source_sha"], original)
            self.assertEqual(git(repo, "status", "--porcelain"), "")
            with zipfile.ZipFile(out) as archive:
                self.assertIsNone(archive.testzip())
                manifest = json.loads(archive.read(".devtool-artifact.json"))
                self.assertEqual(manifest["base_contract_mode"], "exact-tree")
                self.assertEqual(manifest["base_commit"], original)
                self.assertEqual(manifest["base_tree"], git(repo, "rev-parse", "HEAD^{tree}"))
            cli(repo, "validate", "overlay", str(out))
            (repo / "README.md").write_text("fixture v2\n", encoding="utf-8")
            git(repo, "add", "README.md")
            git(repo, "commit", "-m", "fixture v2")
            stale = cli(repo, "validate", "overlay", str(out), check=False)
            self.assertNotEqual(stale.returncode, 0,
                                "Exact-tree artifact must not validate on a newer clean HEAD")
            self.assertEqual(git(repo, "status", "--porcelain"), "")
            self.assertFalse((repo / "NEW.txt").exists())


if __name__ == "__main__":
    unittest.main()
