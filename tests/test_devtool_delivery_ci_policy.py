"""S7 P03 HF01 — committed source-bound CI policy, no remote mutation."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from devtool.delivery_ci_policy import load_policy, DeliveryCIPolicyError, check_requested

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "Validate": 317669398,
    "Devtool S7 P03 scriptexts Consumer Adoption": 418864667,
}


def git(root: Path, *args: str) -> str:
    return subprocess.run(["git", "-C", str(root), *args], check=True,
                          text=True, capture_output=True, timeout=20).stdout.strip()


class RequiredCIPolicy(unittest.TestCase):
    def test_committed_policy_exact_repository_base_event_and_ids(self):
        before = git(ROOT, "status", "--porcelain", "--untracked-files=all")
        policy = load_policy(ROOT, expected_repository="Mikeyphw/scriptexts", expected_base="main")
        self.assertEqual(policy.workflow_ids, REQUIRED)
        self.assertEqual(set(policy.names), set(REQUIRED))
        self.assertEqual(policy.path, "config/delivery-required-ci.json")
        self.assertFalse(policy.receipt()["release_qualified"])
        check_requested(tuple(REQUIRED), policy)
        with self.assertRaises(DeliveryCIPolicyError):
            check_requested(("Validate",), policy)
        self.assertEqual(git(ROOT, "status", "--porcelain", "--untracked-files=all"), before)

    def test_workflow_identities_and_read_only_permissions_retained(self):
        expected = {
            "Validate": ROOT / ".github/workflows/validate.yml",
            "Devtool S7 P03 scriptexts Consumer Adoption": ROOT / ".github/workflows/devtool-s7-p03-consumer.yml",
        }
        for name, path in expected.items():
            content = path.read_text(encoding="utf8")
            self.assertIn("name: " + name, content)
            self.assertIn("pull_request:", content)
        pilot = expected["Devtool S7 P03 scriptexts Consumer Adoption"].read_text()
        self.assertIn("contents: read", pilot)
        self.assertIn("test_devtool_delivery_*.py", pilot)

    def test_uncommitted_policy_or_mismatched_identity_fails_closed(self):
        with tempfile.TemporaryDirectory(prefix="s7-p03-ci-") as root:
            repo = Path(root)
            git(repo, "init", "-b", "main")
            git(repo, "config", "user.email", "ci@example.invalid")
            git(repo, "config", "user.name", "CI fixture")
            target = repo / "config/delivery-required-ci.json"
            target.parent.mkdir()
            target.write_bytes((ROOT / "config/delivery-required-ci.json").read_bytes())
            git(repo, "add", ".")
            git(repo, "commit", "-m", "policy fixture")
            good = load_policy(repo, expected_repository="Mikeyphw/scriptexts", expected_base="main")
            self.assertEqual(good.workflow_ids, REQUIRED)
            with self.assertRaises(DeliveryCIPolicyError):
                load_policy(repo, expected_repository="Mikeyphw/other", expected_base="main")
            doc = json.loads(target.read_text())
            doc["required_workflows"] = doc["required_workflows"][:1]
            target.write_text(json.dumps(doc))
            with self.assertRaises(DeliveryCIPolicyError):
                load_policy(repo, expected_repository="Mikeyphw/scriptexts", expected_base="main")


if __name__ == "__main__":
    unittest.main()
