#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import stat
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
ZIP_FILE_MODE = stat.S_IFREG | 0o644


def iter_files():
    for path in sorted(SRC.rglob("*")):
        if path.is_file():
            rel = path.relative_to(SRC)
            if rel.parts and rel.parts[0] == "META-INF":
                continue
            yield path, rel


def deterministic_info(rel: Path) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(rel.as_posix(), date_time=ZIP_TIMESTAMP)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = ZIP_FILE_MODE << 16
    info.flag_bits |= 0x800
    return info


def main() -> None:
    manifest = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))
    name = ROOT.name
    version = manifest.get("version", "0.0.0")
    DIST.mkdir(parents=True, exist_ok=True)
    for old in DIST.glob("*.xpi"):
        old.unlink()
    out = DIST / f"{name}-{version}.xpi"
    with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path, rel in iter_files():
            archive.writestr(deterministic_info(rel), path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    digest = hashlib.sha256(out.read_bytes()).hexdigest()
    (DIST / "SHA256SUMS").write_text(f"{digest}  {out.name}\n", encoding="utf-8")
    print(f"built {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
