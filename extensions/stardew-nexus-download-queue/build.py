#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
ZIP_DATE = (1980, 1, 1, 0, 0, 0)

def iter_files():
    for path in sorted(SRC.rglob("*")):
        if path.is_file():
            rel = path.relative_to(SRC)
            if rel.parts and rel.parts[0] == "META-INF":
                continue
            yield path, rel

def main() -> None:
    manifest = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))
    version = manifest.get("version", "0.0.0")
    DIST.mkdir(parents=True, exist_ok=True)
    for old in DIST.glob("*.xpi"):
        old.unlink()
    out = DIST / f"{ROOT.name}-{version}.xpi"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path, rel in iter_files():
            info = zipfile.ZipInfo(rel.as_posix(), ZIP_DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            info.create_system = 3
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    (DIST / "SHA256SUMS").write_text(f"{digest}  {out.name}\n", encoding="utf-8")
    print(f"built {out.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
