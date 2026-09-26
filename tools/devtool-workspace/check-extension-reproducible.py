#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    manifest = json.loads((root / "src" / "manifest.json").read_text(encoding="utf-8"))
    version = str(manifest.get("version") or "0.0.0")
    artifact = root / "dist" / f"{root.name}-{version}.xpi"
    build = [sys.executable, "build.py"]

    subprocess.run(build, cwd=root, check=True)
    first = sha256(artifact)
    subprocess.run(build, cwd=root, check=True)
    second = sha256(artifact)
    if first != second:
        print(f"{root.name}: package is not reproducible", file=sys.stderr)
        print(f"first : {first}", file=sys.stderr)
        print(f"second: {second}", file=sys.stderr)
        return 1
    sums = (root / "dist" / "SHA256SUMS").read_text(encoding="utf-8").strip()
    if first not in sums or artifact.name not in sums:
        print(f"{root.name}: SHA256SUMS does not describe {artifact.name}", file=sys.stderr)
        return 1
    print(f"{root.name}: reproducible {artifact.name} sha256={first}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
