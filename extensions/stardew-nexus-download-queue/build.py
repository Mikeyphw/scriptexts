#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"


def iter_files():
    for path in sorted(SRC.rglob("*")):
        if path.is_file():
            rel = path.relative_to(SRC)
            if rel.parts and rel.parts[0] == "META-INF":
                continue
            yield path, rel


def main() -> None:
    manifest = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))
    name = ROOT.name
    version = manifest.get("version", "0.0.0")
    DIST.mkdir(parents=True, exist_ok=True)
    for old in DIST.glob("*.xpi"):
        old.unlink()
    out = DIST / f"{name}-{version}.xpi"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path, rel in iter_files():
            archive.write(path, rel.as_posix())
    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    (DIST / "SHA256SUMS").write_text(f"{digest}  {out.name}\n", encoding="utf-8")
    print(f"built {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
