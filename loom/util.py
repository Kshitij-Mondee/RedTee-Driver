"""Small shared helpers. Standard library only (Windows-first: never assume `python3` or bash)."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

ENGINE_ROOT = Path(__file__).resolve().parent.parent


def read_json(p: str | Path, default: Any = None) -> Any:
    p = Path(p)
    if not p.exists():
        if default is not None:
            return default
        raise FileNotFoundError(str(p))
    import time as _t
    for i in range(20):
        try:
            with open(p, encoding="utf-8") as f:
                return json.load(f)
        except PermissionError:
            # another process is replacing the file this moment (Windows refuses the open while os.replace runs): the
            # Shuttle launcher crashed on it reading state.json as loom-mcp saved it (S0, 2026-10-09). write_json waits
            # out a reader the same way
            if i == 19:
                raise
            _t.sleep(0.05 * (i + 1))


def write_json(p: str | Path, obj: Any) -> Path:
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    # one temporary file per writer: parallel scene workers saving the same log shared one ".tmp" and Windows refused
    # the rename while another thread held it (WinError 32, bench 2026-10-07)
    import threading
    import time as _t
    tmp = p.with_suffix(p.suffix + f".{os.getpid()}.{threading.get_ident()}.tmp")
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")
    for i in range(20):
        try:
            os.replace(tmp, p)
            break
        except PermissionError:          # a reader has the target open for a moment (Windows): wait and try again
            if i == 19:
                raise
            _t.sleep(0.05 * (i + 1))
    return p


def sha(*parts: Any, n: int = 16) -> str:
    h = hashlib.sha256()
    for part in parts:
        if isinstance(part, (bytes, bytearray)):
            h.update(part)
        elif isinstance(part, (dict, list)):
            h.update(json.dumps(part, sort_keys=True, ensure_ascii=False).encode("utf-8"))
        else:
            h.update(str(part).encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()[:n]


def file_sha(p: str | Path, n: int = 16) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:n]


def which(name: str) -> str | None:
    """Find an executable; on Windows also tries the .cmd/.exe shims npm installs."""
    for cand in (name, name + ".cmd", name + ".exe") if os.name == "nt" else (name,):
        p = shutil.which(cand)
        if p:
            return p
    return None


def _kill_tree(p: subprocess.Popen) -> None:
    """Kill a child and everything it started (a probe's node and the browser node launched)."""
    try:
        if os.name == "nt":
            subprocess.run(["taskkill", "/T", "/F", "/PID", str(p.pid)], capture_output=True, timeout=30)
        else:
            import signal
            os.killpg(os.getpgid(p.pid), signal.SIGKILL)
    except Exception:  # noqa: BLE001  (already gone, or no rights: the plain kill below still runs)
        pass
    try:
        p.kill()
    except Exception:  # noqa: BLE001
        pass


def _run_tree(args: list, cwd, env, timeout, capture: bool) -> subprocess.CompletedProcess:
    """subprocess.run, except that a timeout really ends the call. subprocess.run kills only the child and then waits
    for its output pipes, which a grandchild (the browser a probe launched) still holds: the check's 600 s probe
    timeout surfaced after about 95 minutes (feedback-relay-v3, L-406). Here the whole tree is killed, and the pipes are
    closed if they are still held 10 s later; the TimeoutExpired carries whatever output came."""
    kw = {"cwd": cwd, "env": env, "text": True, "encoding": "utf-8", "errors": "replace"}
    if capture:
        kw.update(stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if os.name != "nt":
        kw["start_new_session"] = True          # its own process group, so the tree can be killed at once
    p = subprocess.Popen(args, **kw)
    try:
        out, err = p.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        _kill_tree(p)
        try:
            out, err = p.communicate(timeout=10)
        except subprocess.TimeoutExpired:
            for f in (p.stdout, p.stderr):
                try:
                    f and f.close()
                except Exception:  # noqa: BLE001
                    pass
            out, err = "", ""
        raise subprocess.TimeoutExpired(args, timeout, output=out, stderr=err)
    except BaseException:                      # Ctrl+C, or anything else: leave no browser behind
        _kill_tree(p)
        raise
    return subprocess.CompletedProcess(args, p.returncode, out, err)


def run(cmd: list[str], cwd: str | Path | None = None, env: dict | None = None, timeout: int | None = None,
        check: bool = True, capture: bool = True) -> subprocess.CompletedProcess:
    exe = which(cmd[0]) or cmd[0]
    e = os.environ.copy()
    if env:
        e.update(env)
    r = _run_tree([exe] + cmd[1:], cwd=str(cwd) if cwd else None, env=e, timeout=timeout, capture=capture)
    if check and r.returncode != 0:
        tail = ((r.stdout or "")[-1500:] + "\n" + (r.stderr or "")[-2500:]).strip()
        raise RuntimeError(f"command failed ({r.returncode}): {' '.join(cmd)}\n{tail}")
    return r


def py_exe() -> str:
    return sys.executable or ("py" if os.name == "nt" else "python3")


def info(msg: str) -> None:
    print(msg, flush=True)


def warn(msg: str) -> None:
    print(f"[warn] {msg}", flush=True)


class LoomError(RuntimeError):
    """A failure the user must act on (bad artifact, failed gate, missing tool)."""


import contextlib as _contextlib
import time as _time


@_contextlib.contextmanager
def file_lock(lock: Path, timeout: float = 300.0, stale: float = 1800.0):
    """Exclusive cross-process lock (a create-exclusive file). Not re-entrant. A lock older than `stale`
    seconds is treated as abandoned by a killed process and broken. Used by the Manim clip store."""
    lock = Path(lock)
    lock.parent.mkdir(parents=True, exist_ok=True)
    t0 = _time.time()
    while True:
        try:
            fd = os.open(str(lock), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, f"{os.getpid()} {_time.time():.0f}".encode()); os.close(fd)
            break
        except FileExistsError:
            try:
                if _time.time() - lock.stat().st_mtime > stale:
                    lock.unlink(); continue
            except FileNotFoundError:
                continue
            if _time.time() - t0 > timeout:
                raise LoomError(f"{lock} is held by another process; retry, or delete it if nothing is running")
            _time.sleep(0.1)
    try:
        yield
    finally:
        with _contextlib.suppress(FileNotFoundError):
            lock.unlink()
