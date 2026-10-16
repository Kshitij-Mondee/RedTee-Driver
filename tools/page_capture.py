"""Capture a real web page once, offline and self-contained, for the screencast engine's `page` region (2026-10-16).

    py tools/page_capture.py <url> --project <id> --approved-by "<name>" [--name signup] [--width 1280] [--height 800]
    py tools/page_capture.py <url> --out <folder> ...                     (a folder instead of a project's assets/pages)
    py tools/page_capture.py <url> --out <folder> --shot-only             (a screenshot only, for tools/screenshot_theme.py)
    py tools/page_capture.py bundle --scene <scene.src.js> --pages <a.page.js> [...] --out <scene.js>

A capture is a download, so it needs the requester's approval (CLAUDE.md rule 11): `--approved-by` names who approved
this site, and the provenance file records it with the URL, the date and robots.txt. A page served from this computer
(localhost, 127.0.0.1, ::1, *.localhost, *.test) downloads nothing and needs no approval; the provenance says so.
The tool refuses: a URL with a user name or password in it, a scheme other than http(s), a page robots.txt disallows
for us (or for every robot), and any login: a fresh browser profile with no cookies, nothing typed, public pages only.

It writes, under projects/<id>/assets/pages/ (or --out):
  <name>.page.json     the snapshot: the DOM with data-lm-i on every element, the CSS (media resolved at the capture
                       width, :hover/:focus/:active as classes), fonts and images inlined, each element's box
  <name>.page.js       Loom.webpage("<name>", ...): the registration a scene file (or a lesson's runtime) loads
  <name>.capture.json  provenance: url, approved_by (or "local page"), date, robots, width, what was dropped
  <name>.png           the page as captured (the reference to compare with)
Study a reference, never republish it: a capture is for the lesson that teaches that product.
"""
from __future__ import annotations

import argparse
import datetime as dt
import ipaddress
import json
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.robotparser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
UA = "LoomCapture"


def is_local(host: str) -> bool:
    host = (host or "").strip("[]").lower()
    if host in ("localhost",) or host.endswith(".localhost") or host.endswith(".test"):
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def check_url(url: str, approved_by: str | None) -> dict:
    """the reasons to refuse, or the provenance to record"""
    u = urllib.parse.urlsplit(url)
    if u.scheme not in ("http", "https"):
        raise SystemExit(f"refused: only http(s) pages are captured (got {u.scheme or 'no scheme'})")
    if u.username or u.password:
        raise SystemExit("refused: the URL carries a user name or password; captures are of public pages only, never signed in")
    local = is_local(u.hostname or "")
    if not local and not (approved_by or "").strip():
        raise SystemExit("refused: a capture downloads the page; name who approved this site with --approved-by \"<name>\" "
                         "(the requester approves each site, CLAUDE.md rule 11)")
    robots = "not checked"
    rp = urllib.robotparser.RobotFileParser()
    rp.set_url(f"{u.scheme}://{u.netloc}/robots.txt")
    try:
        rp.read()
        ok = rp.can_fetch(UA, url)
        robots = "allowed" if ok else "disallowed"
        if not ok:
            raise SystemExit(f"refused: robots.txt at {u.netloc} disallows {u.path or '/'} for robots")
    except SystemExit:
        raise
    except Exception as e:   # noqa: BLE001  (no robots.txt reachable: the default is allowed)
        robots = f"unreadable ({type(e).__name__}), treated as allowed"
    return {"url": url, "local": local, "approved_by": (approved_by or "").strip() or ("local page, nothing downloaded" if local else None),
            "robots": robots}


def _rename_fonts(snap: dict, name: str) -> dict:
    """the page's own font families get a prefix, so they never collide with the style pack's faces"""
    fams = sorted({f["family"] for f in snap.get("fonts") or []}, key=len, reverse=True)
    if not fams:
        return snap
    new = {f: f"lmw-{name}-{re.sub(r'[^A-Za-z0-9]+', '-', f)}" for f in fams}

    def fix_value(v: str) -> str:
        for f in fams:
            v = re.sub(r'(["\'])%s\1' % re.escape(f), f'"{new[f]}"', v)
            v = re.sub(r'(^|[\s,])%s(?=\s*(,|$))' % re.escape(f), lambda m: m.group(1) + f'"{new[f]}"', v)
        return v

    snap["css"] = re.sub(r'(font(?:-family)?\s*:\s*)([^;{}]*)', lambda m: m.group(1) + fix_value(m.group(2)), snap["css"])
    for f in snap["fonts"]:
        f["family"] = new[f["family"]]
    for e in snap["els"]:
        if e.get("ff"):
            e["ff"] = fix_value(e["ff"])
    return snap


def capture(url: str, out: Path, name: str, approved_by: str | None, width: int, height: int, shot_only: bool) -> dict:
    prov = check_url(url, approved_by)
    from loom.render import browser_path
    from loom.util import which
    chrome = browser_path()
    if not chrome:
        raise SystemExit("no browser here (run `npx hyperframes browser ensure`)")
    out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="lmcap_"))
    job = {"url": url, "width": width, "height": height, "out_json": str(tmp / "snap.json"), "out_png": str(out / f"{name}.png"), "shot_only": shot_only}
    (tmp / "job.json").write_text(json.dumps(job), encoding="utf-8")
    import os
    r = subprocess.run([which("node") or "node", str(ROOT / "tools/node/page_capture.mjs"), str(tmp / "job.json")], capture_output=True, text=True,
                       timeout=180, env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=chrome))
    res = json.loads((r.stdout.strip().splitlines() or ["{}"])[-1] or "{}")
    if r.returncode or not res.get("ok"):
        raise SystemExit(f"capture failed: {res.get('error') or r.stderr[-600:]}")
    prov.update({"date": dt.date.today().isoformat(), "width": width, "height": height, "shot_only": shot_only, "dropped": res.get("log", [])})
    if not shot_only:
        snap = _rename_fonts(json.loads(Path(job["out_json"]).read_text(encoding="utf-8")), name)
        snap["name"] = name
        (out / f"{name}.page.json").write_text(json.dumps(snap), encoding="utf-8")
        (out / f"{name}.page.js").write_text(f"// captured {prov['date']} from {url} ({prov['approved_by']}); see {name}.capture.json\n"
                                             f"Loom.webpage({json.dumps(name)}, {json.dumps(snap)});\n", encoding="utf-8")
        prov["elements"] = len(snap["els"]); prov["page_h"] = snap["h"]; prov["bytes"] = (out / f"{name}.page.json").stat().st_size
    (out / f"{name}.capture.json").write_text(json.dumps(prov, indent=1), encoding="utf-8")
    return prov


def bundle(scene: Path, pages: list[Path], out: Path) -> None:
    """one lab scene file: its @lab header line, the page registrations, then the scene (the lab loads one file)"""
    src = scene.read_text(encoding="utf-8").splitlines(keepends=True)
    head = [ln for ln in src[:1] if ln.startswith("// @lab")]
    body = src[len(head):]
    parts = head + [f"// built by tools/page_capture.py bundle from {scene.name} and {', '.join(p.name for p in pages)}: edit those, not this\n"]
    parts += [p.read_text(encoding="utf-8") for p in pages] + body
    out.write_text("".join(parts), encoding="utf-8")


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if argv and argv[0] == "bundle":
        ap = argparse.ArgumentParser(prog="page_capture.py bundle")
        ap.add_argument("--scene", required=True); ap.add_argument("--pages", nargs="+", required=True); ap.add_argument("--out", required=True)
        a = ap.parse_args(argv[1:])
        bundle(Path(a.scene), [Path(p) for p in a.pages], Path(a.out))
        print(f"bundled -> {a.out}")
        return
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("url")
    ap.add_argument("--project"); ap.add_argument("--out")
    ap.add_argument("--approved-by", dest="approved_by")
    ap.add_argument("--name"); ap.add_argument("--width", type=int, default=1280); ap.add_argument("--height", type=int, default=800)
    ap.add_argument("--shot-only", action="store_true")
    a = ap.parse_args(argv)
    if not (a.project or a.out):
        raise SystemExit("say where: --project <id> (projects/<id>/assets/pages) or --out <folder>")
    out = Path(a.out) if a.out else ROOT / "projects" / a.project / "assets" / "pages"
    if a.project and not (ROOT / "projects" / a.project).exists():
        raise SystemExit(f"no project {a.project}")
    name = a.name or re.sub(r"[^a-z0-9]+", "-", (urllib.parse.urlsplit(a.url).path.strip("/") or urllib.parse.urlsplit(a.url).hostname or "page").lower()).strip("-") or "page"
    prov = capture(a.url, out, name, a.approved_by, a.width, a.height, a.shot_only)
    print(json.dumps({k: prov[k] for k in ("url", "approved_by", "robots", "date") if k in prov} | {"out": str(out), "name": name, "elements": prov.get("elements")}))


if __name__ == "__main__":
    main()
