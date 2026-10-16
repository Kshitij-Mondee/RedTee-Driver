"""Loom Studio: the local editing surface (P0: brand kits, looks, restyling lessons).

    py -m loom studio            ->  http://127.0.0.1:8820

Standard library only. Binds to 127.0.0.1 (local use; there is no auth in P0). Long work (previews, restyles)
runs as a background `python -m loom ...` subprocess, so the UI stays responsive and a crash never takes the
server down; the job's output is kept for the UI and in library-style logs.

API (JSON):
  GET  /api/styles                       style packs (id, name, reads_as, fits)
  GET  /api/fonts                        font registry (family -> weights)
  GET  /api/brands                       brand list
  GET  /api/brands/<id>                  brand + lint matrix (per style: ok, issues, suggested fixes)
  POST /api/brands                       {id, name}                 create
  PUT  /api/brands/<id>                  brand json                 save (locked fields refused)
  POST /api/brands/<id>/lint             brand json (unsaved edits) lint matrix without saving
  POST /api/brands/<id>/upload           {kind: logo|font, filename, data}  (base64; svg/png, woff2; <= 2 MB)
  POST /api/brands/<id>/lock | unlock    {by}
  POST /api/brands/<id>/preview          {styles: [...]} -> job
  GET  /api/lessons                      projects with their style and brand
  POST /api/lessons/<id>/restyle         {style, brand, fork_as} -> job
  GET  /api/jobs/<id>                    job status, log tail, result
  GET  /files?path=<engine-relative>     images produced by previews / restyles (engine folder only)
"""
from __future__ import annotations

import base64
import datetime as _dt
import json
import subprocess
import sys
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .. import brand as B
from ..util import ENGINE_ROOT, LoomError, read_json

UI = Path(__file__).resolve().parent / "ui"
JOBS: dict[str, dict] = {}
MAX_UPLOAD = 2 * 1024 * 1024


def _projects():
    from ..project import projects_root
    out = []
    for d in sorted(projects_root().iterdir()):
        if d.name.startswith(".") or not (d / "project.json").exists() or not (d / "plan/storyboard.json").exists():
            continue
        sb = read_json(d / "plan/storyboard.json", {})
        r = next(iter(sorted((d / "renders").glob("*.mp4"))), None) if (d / "renders").exists() else None
        out.append({"id": d.name, "style": sb.get("style"), "brand": sb.get("brand"), "fork": d.name.startswith("_"),
                    "title": (read_json(d / "plan/script.json", {}) or {}).get("title", ""), "render": str(r.relative_to(ENGINE_ROOT)) if r else None})
    return sorted(out, key=lambda x: (x["fork"], x["title"], x["id"]))   # originals first, copies after


def _run_job(kind: str, args, result_fn=None) -> str:
    """args: one `loom` argument list, or a list of them run in order (stops at the first failure)."""
    jid = uuid.uuid4().hex[:10]
    JOBS[jid] = {"id": jid, "kind": kind, "status": "running", "log": "", "result": None,
                 "started": _dt.datetime.now().isoformat(timespec="seconds")}

    def work():
        try:
            steps = args if args and isinstance(args[0], list) else [args]
            log = ""
            for a in steps:
                JOBS[jid]["step"] = " ".join(a[:2])
                p = subprocess.run([sys.executable, "-m", "loom"] + a, cwd=str(ENGINE_ROOT), capture_output=True, text=True, timeout=7200)
                log += f"$ loom {' '.join(a)}\n" + p.stdout + p.stderr
                JOBS[jid]["log"] = log[-12000:]
                if p.returncode not in (0, 3):
                    break
            JOBS[jid]["status"] = "done" if p.returncode in (0, 3) else "failed"
            if result_fn:
                JOBS[jid]["result"] = result_fn(p)
        except Exception as e:  # noqa: BLE001 - reported to the UI, never swallowed
            JOBS[jid]["status"] = "failed"; JOBS[jid]["log"] += f"\n{type(e).__name__}: {e}"
        JOBS[jid]["finished"] = _dt.datetime.now().isoformat(timespec="seconds")

    threading.Thread(target=work, daemon=True).start()
    return jid


def _rel(p) -> str | None:
    if not p:
        return None
    try:
        return str(Path(p).resolve().relative_to(ENGINE_ROOT)).replace("\\", "/")
    except ValueError:
        return None


class Handler(BaseHTTPRequestHandler):
    server_version = "LoomStudio/0.1"

    def log_message(self, fmt, *a):  # keep the console quiet; errors still surface through the API
        pass

    # ---------------------------------------------------------- plumbing
    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, (bytes, bytearray)) else json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", ctype); self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(data)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_UPLOAD * 2:
            raise LoomError("request too large")
        return json.loads(self.rfile.read(n) or b"{}")

    def _err(self, e, code=400):
        self._send(code, {"error": str(e)})

    # ---------------------------------------------------------- GET
    def do_GET(self):
        u = urlparse(self.path); parts = [x for x in u.path.split("/") if x]
        try:
            if u.path in ("/", "/index.html"):
                return self._send(200, (UI / "index.html").read_bytes(), "text/html; charset=utf-8")
            if u.path == "/files":
                rel = (parse_qs(u.query).get("path") or [""])[0]
                f = (ENGINE_ROOT / rel).resolve()
                if ENGINE_ROOT.resolve() not in f.parents or not f.is_file():
                    return self._err("not found", 404)
                ctype = {".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".mp4": "video/mp4"}.get(f.suffix.lower(), "application/octet-stream")
                return self._send(200, f.read_bytes(), ctype)
            if parts[:2] == ["api", "styles"]:
                return self._send(200, [{k: read_json(p).get(k) for k in ("id", "name", "reads_as", "fits")} for p in sorted(B.STYLES.glob("*.json"))])
            if parts[:2] == ["api", "fonts"]:
                return self._send(200, {k: v["weights"] for k, v in B.fonts_registry().items()})
            if parts == ["api", "brands"]:
                return self._send(200, B.list_brands())
            if parts[:2] == ["api", "brands"] and len(parts) == 3:
                b = B.load_brand(parts[2])
                d = B.brand_dir(b["id"])
                prev = read_json(d / "preview" / "preview.json", {}) or {}
                grids = {st: _rel(r.get("grid")) for st, r in (prev.get("styles") or {}).items()}
                return self._send(200, {"brand": b, "lint": B.lint_matrix(b), "previews": grids,
                                        "logo_url": f"/files?path={_rel(d / b['logo']['file'])}" if b.get("logo") else None})
            if parts == ["api", "lessons"]:
                return self._send(200, _projects())
            if parts[:2] == ["api", "jobs"] and len(parts) == 3:
                j = JOBS.get(parts[2])
                return self._send(200, j) if j else self._err("no such job", 404)
            return self._err("not found", 404)
        except LoomError as e:
            return self._err(e)
        except Exception as e:  # noqa: BLE001
            return self._err(f"{type(e).__name__}: {e}", 500)

    # ---------------------------------------------------------- POST / PUT
    def do_PUT(self):
        parts = [x for x in urlparse(self.path).path.split("/") if x]
        try:
            if parts[:2] == ["api", "brands"] and len(parts) == 3:
                b = self._body()
                if b.get("id") != parts[2]:
                    return self._err("id in the body must match the URL")
                B.save_brand(b)
                return self._send(200, {"brand": b, "lint": B.lint_matrix(b)})
            return self._err("not found", 404)
        except LoomError as e:
            return self._err(e)
        except Exception as e:  # noqa: BLE001
            return self._err(f"{type(e).__name__}: {e}", 500)

    def do_POST(self):
        parts = [x for x in urlparse(self.path).path.split("/") if x]
        try:
            body = self._body()
            if parts == ["api", "brands"]:
                bid = (body.get("id") or "").strip().lower()
                if (B.BRANDS / bid / "brand.json").exists():
                    return self._err(f"brand '{bid}' already exists")
                b = B.blank(bid, body.get("name") or bid)
                B.save_brand(b)
                return self._send(200, {"brand": b, "lint": B.lint_matrix(b)})
            if parts[:2] == ["api", "brands"] and len(parts) == 4:
                bid, action = parts[2], parts[3]
                if action == "lint":
                    E = B.validate(body)
                    return self._send(200, {"errors": E, "lint": B.lint_matrix(body) if not E else {}})
                if action == "upload":
                    return self._upload(bid, body)
                if action in ("lock", "unlock"):
                    b = B.load_brand(bid)
                    b["locks"] = dict(b.get("locks") or {}, locked=action == "lock", by=body.get("by") or "studio",
                                      at=_dt.datetime.now().isoformat(timespec="seconds"))
                    B.save_brand(b, force_locked=True)
                    return self._send(200, {"brand": b})
                if action == "preview":
                    styles = [s for s in (body.get("styles") or []) if (B.STYLES / f"{s}.json").exists()]
                    args = ["brand", "preview", bid] + (["--styles", ",".join(styles)] if styles else [])

                    def res(_p, bid=bid):
                        prev = read_json(B.brand_dir(bid) / "preview" / "preview.json", {}) or {}
                        return {st: {"grid": _rel(r.get("grid")), "errors": r.get("errors", [])} for st, r in (prev.get("styles") or {}).items()}
                    return self._send(200, {"job": _run_job("preview", args, res)})
            if parts[:2] == ["api", "lessons"] and len(parts) == 4 and parts[3] == "render":
                pid = parts[2]

                def res(_p, pid=pid):
                    from ..project import Project
                    pr = Project.open(pid)
                    mp4 = pr.path(f"renders/{pid}.mp4")
                    rep = read_json(pr.path("qa/report.json"), {}) or {}
                    return {"project": pid, "mp4": _rel(mp4) if mp4.exists() else None, "errors": rep.get("errors", [])}
                # the FULL check (HyperFrames sampling + contact sheets) always runs before a render
                return self._send(200, {"job": _run_job("render", [["run", pid, "check"], ["run", pid, "render"]], res)})
            if parts[:2] == ["api", "lessons"] and len(parts) == 4 and parts[3] == "restyle":
                pid = parts[2]
                args = ["restyle", pid]
                if body.get("style"):
                    args += ["--style", body["style"]]
                if "brand" in body:
                    args += ["--brand", body.get("brand") or ""]
                target = body.get("fork_as") or pid
                if body.get("fork_as"):
                    args += ["--as", body["fork_as"]]

                def res(p, target=target):
                    try:
                        txt = p.stdout[p.stdout.index("{"):]
                        r = json.loads(txt[: txt.rindex("}") + 1])
                        r["frames"] = _rel(r.get("frames"))
                        return r
                    except Exception:  # noqa: BLE001
                        return {"project": target, "error": "could not read the restyle result; see the log"}
                return self._send(200, {"job": _run_job("restyle", args, res)})
            return self._err("not found", 404)
        except LoomError as e:
            return self._err(e)
        except Exception as e:  # noqa: BLE001
            return self._err(f"{type(e).__name__}: {e}", 500)

    def _upload(self, bid, body):
        kind, name = body.get("kind"), Path(body.get("filename") or "").name
        data = base64.b64decode(body.get("data") or "")
        if len(data) > MAX_UPLOAD:
            return self._err("file is larger than 2 MB")
        b = B.load_brand(bid)
        d = B.brand_dir(bid)
        if kind in ("logo", "logo_dark"):
            if Path(name).suffix.lower() not in (".svg", ".png"):
                return self._err("a logo must be .svg or .png")
            if (b.get("locks") or {}).get("locked") and "logo" in (b["locks"].get("fields") or []):
                return self._err("brand is locked: unlock it to change the logo")
            f = d / (f"logo{Path(name).suffix.lower()}" if kind == "logo" else f"logo-dark{Path(name).suffix.lower()}"); f.write_bytes(data)
            if kind == "logo":
                b["logo"] = dict(b.get("logo") or {"placement": "top-right", "height": 48, "show": "always"}, file=f.name)
            else:
                if not b.get("logo"):
                    return self._err("upload the main logo first")
                b["logo"]["file_dark"] = f.name
            B.save_brand(b, force_locked=False)
            return self._send(200, {"brand": b, "logo_url": f"/files?path={_rel(f)}"})
        if kind == "font":
            if Path(name).suffix.lower() != ".woff2":
                return self._err("a font must be a .woff2 file")
            (d / "fonts").mkdir(exist_ok=True)
            f = d / "fonts" / name; f.write_bytes(data)
            return self._send(200, {"file": f"fonts/{name}"})
        return self._err("kind must be logo or font")


def serve(port: int = 8820, host: str = "127.0.0.1"):
    httpd = ThreadingHTTPServer((host, port), Handler)
    print(f"Loom Studio on http://{host}:{port}  (Ctrl+C to stop)", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
