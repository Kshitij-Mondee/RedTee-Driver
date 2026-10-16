"""Download the approved free illustration sets (assets/vendor/SOURCES.json, D-88) from their official URLs.

    py tools/fetch_assets.py              # every set that is fetched by URL or zip
    py tools/fetch_assets.py doodles      # one set
    py tools/fetch_assets.py --check      # what is present, nothing downloaded

Approved by Kshitij (2026-10-02): only sets that need no paid licence and no attribution. npm sets (Fluent
Emoji) come with `npm install`. Each set lands in assets/vendor/<id>/ with:
  - the files (SVG; for Kenney, the isometric PNG renders);
  - LICENSE.txt (the licence, where it was verified, the date);
  - SOURCE.json (url and sha256 of every file).
Files already present are kept; nothing is overwritten unless --force. A set whose every download fails is
reported (exit 1), never silently skipped. Run on a machine with normal internet access: the Cowork sandbox's
allowlist blocks these hosts.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import io
import json
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "assets" / "vendor"


def get(url: str, timeout=60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "loom-fetch-assets/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def write_licence(d: Path, S: dict):
    (d / "LICENSE.txt").write_text(
        f"{S['name']}\nLicence: {S['licence']} ({S['licence_url']})\nVerified from: {S['verified_from']}\n"
        f"Attribution: {S['attribution']}\nFetched for Loom on {datetime.date.today().isoformat()} (D-88).\n", encoding="utf-8")


def fetch_set(S: dict, force=False) -> dict:
    d = VENDOR / S["id"]
    d.mkdir(parents=True, exist_ok=True)
    src = json.loads((d / "SOURCE.json").read_text()) if (d / "SOURCE.json").exists() else {"files": {}}
    ok, fail = 0, []
    if S["kind"] == "urls":
        for name in S["files"]:
            f = d / (name + S["ext"])
            if f.exists() and not force:
                ok += 1; continue
            url = S["base"] + name + S["ext"]
            try:
                b = get(url)
                if S["ext"] == ".svg" and b"<svg" not in b[:4000]:
                    raise ValueError("not an SVG")
                f.write_bytes(b); src["files"][f.name] = {"url": url, "sha256": hashlib.sha256(b).hexdigest()}; ok += 1
            except Exception as e:
                fail.append(f"{name}: {e}")
    elif S["kind"] == "zip":
        try:
            z = zipfile.ZipFile(io.BytesIO(get(S["url"], timeout=180)))
            for info in z.infolist():
                p = info.filename
                if info.is_dir() or not p.lower().endswith(".png") or S.get("keep", "") not in p:
                    continue
                f = d / Path(p).name
                if f.exists() and not force:
                    ok += 1; continue
                b = z.read(info); f.write_bytes(b)
                src["files"][f.name] = {"url": S["url"] + "#" + p, "sha256": hashlib.sha256(b).hexdigest()}; ok += 1
        except Exception as e:
            fail.append(f"zip: {e}")
    else:
        return {"id": S["id"], "skipped": f"kind {S['kind']} comes with npm install"}
    write_licence(d, S)
    (d / "SOURCE.json").write_text(json.dumps(src, indent=1))
    return {"id": S["id"], "ok": ok, "failed": fail}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*"); ap.add_argument("--check", action="store_true"); ap.add_argument("--force", action="store_true")
    a = ap.parse_args(argv)
    sets = json.loads((VENDOR / "SOURCES.json").read_text())["sets"]
    if a.ids:
        unknown = [i for i in a.ids if i not in {s["id"] for s in sets}]
        if unknown:
            print("not approved sets: " + ", ".join(unknown) + " (assets/vendor/SOURCES.json)"); return 2
        sets = [s for s in sets if s["id"] in a.ids]
    code = 0
    for S in sets:
        if a.check:
            d = VENDOR / S["id"]
            if S["kind"] == "iconify":  # an npm set: count the pieces in its icons.json
                p = ROOT / S["path"]
                n = len(json.loads(p.read_text(encoding="utf-8")).get("icons", {})) if p.exists() else 0
            else:
                n = len([p for p in d.glob("*") if p.suffix in (".svg", ".png")]) if d.exists() else 0
            print(f"{S['id']:8s} {S['licence']:8s} {n:4d} file(s) {'(npm)' if S['kind'] == 'iconify' else ''}"); continue
        r = fetch_set(S, a.force)
        if r.get("skipped"):
            print(f"{S['id']}: {r['skipped']}"); continue
        print(f"{S['id']}: {r['ok']} file(s) present, {len(r['failed'])} failed")
        for f in r["failed"][:10]:
            print("   ", f)
        if r["ok"] == 0:
            code = 1
    return code


if __name__ == "__main__":
    sys.exit(main())
