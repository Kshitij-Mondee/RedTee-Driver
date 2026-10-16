"""The MCP server one Relay role task talks to when its model is served by Claude Code (provider claude_code).

    python -m loom.agents.cc_server --task <task.json>

Relay on the subscription (2026-10-08): each role task runs as one `claude -p` session whose system prompt is the role's
own (Claude Code's is replaced) and whose only tools are the role's Relay tools, served here. The calls run the same
functions Relay's runtime calls (`loom/agents/tools.call`: the role's allow-list, argument schema, gates), with the
runtime's guards kept on the server side: a submission is always judged, a seventh identical call stops, the tool-call
limit answers "write now", and no resubmission is taken past the repair limit. The task's state (accepted, artifact,
errors, value, findings, snapshots) is saved after every call for the runner (`cc_runner.py`), and lesson-changing
calls take a lock shared by every process working on the lesson (parallel scene workers are separate processes here).
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import threading
import time
from pathlib import Path

from ..util import read_json, write_json

READ_PREFIXES = ("get_", "list_", "catalog_", "capabilities", "read_artifact")
# tools that take the lesson lock themselves, only for the part that writes the lesson (R-46: lab_snapshot held the
# lock while it photographed and probed, so parallel scene workers queued: median wait 82 s, max 557 s)
SELF_LOCKED = ("lab_snapshot",)


class LessonLock:
    """A lock on one file, held across processes (msvcrt on Windows, fcntl elsewhere)."""

    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.fh = None

    def __enter__(self):
        self.fh = open(self.path, "a+b")
        if os.name == "nt":
            import msvcrt
            while True:
                try:
                    self.fh.seek(0)
                    msvcrt.locking(self.fh.fileno(), msvcrt.LK_LOCK, 1)
                    break
                except OSError:          # LK_LOCK gives up after about 10 s: keep waiting
                    time.sleep(0.2)
        else:
            import fcntl
            fcntl.flock(self.fh.fileno(), fcntl.LOCK_EX)
        return self

    def __exit__(self, *a):
        try:
            if os.name == "nt":
                import msvcrt
                self.fh.seek(0)
                msvcrt.locking(self.fh.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl
                fcntl.flock(self.fh.fileno(), fcntl.LOCK_UN)
        finally:
            self.fh.close()


def _safe(state: dict) -> dict:
    """The task state that can be saved (images go to the model, not the file)."""
    out = {}
    for k, v in state.items():
        if k == "images":
            continue
        try:
            json.dumps(v)
            out[k] = v
        except TypeError:
            out[k] = str(v)
    return out


class TaskServer:
    def __init__(self, task_file: str):
        from ..project import Project
        from . import tools as T
        self.T = T
        self.task = read_json(Path(task_file))
        self.p = Project.open(self.task["project"])
        self.state_file = Path(self.task["state_file"])
        state = read_json(self.state_file, {}) if self.state_file.exists() else {}
        tgt = self.task.get("target")
        self.ctx = T.ToolContext(project=self.p, role=self.task["role"], stage=self.task["stage"], beat=self.task.get("beat"),
                                 target=Path(tgt) if tgt else None, extra=dict(self.task.get("extra") or {}), state=state)
        self.names = list(self.task["tools"])
        self.limits = self.task.get("limits") or {}
        self.seen: dict = {}
        self.calls = int(state.get("cc_calls", 0))
        self.lock = threading.Lock()
        self.lesson_lock = self.p.path("logs/cc/lesson.lock")
        self.ctx.lesson_lock = lambda: LessonLock(self.lesson_lock)
        # one line per tool call (R-46: server.log held only the engine's printed output, so a tool failure could be
        # read only from the CLI transcripts)
        self.call_log = self.state_file.with_name("calls.jsonl")

    def list_tools(self) -> list[dict]:
        return [{"name": n, "description": self.T.TOOLS[n].description, "inputSchema": self.T.TOOLS[n].parameters} for n in self.names]

    def call(self, name: str, args: dict) -> tuple[dict, list]:
        with self.lock:
            if name not in self.names:
                return {"error": f"unknown tool {name}"}, []
            self.calls += 1
            t0 = time.monotonic()
            res = self._guarded(name, args)
            self._log_call(name, args, res, time.monotonic() - t0)
            st = self.ctx.state
            images = [i for i in st.pop("images", []) if Path(i).exists()]
            st["cc_calls"] = self.calls
            write_json(self.state_file, _safe(st))          # after every call, the guarded ones too
            return res, images

    def _log_call(self, name: str, args: dict, res, secs: float) -> None:
        try:
            r = res if isinstance(res, dict) else {}
            row = {"n": self.calls, "at": time.strftime("%Y-%m-%dT%H:%M:%S"), "tool": name, "s": round(secs, 2),
                   "args": {k: (len(v) if isinstance(v, (str, list, dict)) else v) for k, v in (args or {}).items()},
                   "ok": not r.get("error") and r.get("accepted") is not False}
            for k in ("error", "errors", "runtime_errors"):
                if r.get(k):
                    row[k] = str(r[k])[:400]
            with open(self.call_log, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")
        except Exception:  # noqa: BLE001  (a log line never fails a call)
            pass

    def _guarded(self, name: str, args: dict):
        from .. import ledger as L
        T = self.T
        terminal = T.TOOLS[name].terminal
        key = hashlib.sha1((name + json.dumps(args, sort_keys=True)).encode()).hexdigest()
        self.seen[key] = self.seen.get(key, 0) + 1
        st = self.ctx.state
        repairs = int(self.limits.get("repairs", 3))
        if terminal and st.get("done"):
            return {"accepted": True, "note": "already accepted: stop now, nothing more to do"}
        if terminal and st.get("rounds", 0) > repairs:
            return {"error": f"no resubmissions left ({repairs} used): stop now"}
        if not terminal and self.seen[key] >= 6:
            st["cc_stop"] = f"loop on {name}"
            return {"error": "the same call with the same arguments six times: stop and submit what you have"}
        if not terminal and self.calls > int(self.limits.get("tool_calls", 80)):
            return {"error": f"tool-call limit reached: no more reading; write the artifact now and call `{self.task.get('terminal')}`"}
        tok = L.RUNNING.set({"model": self.task.get("model"), "provider": "claude_code", "role": self.task["role"]})
        try:
            if name.startswith(READ_PREFIXES) or name in SELF_LOCKED:
                res = T.call(self.ctx, name, args)
            else:
                with LessonLock(self.lesson_lock):
                    res = T.call(self.ctx, name, args)
        finally:
            L.RUNNING.reset(tok)
        if isinstance(res, dict) and not terminal and self.seen[key] >= 3:
            res = dict(res, note=f"you have read this {self.seen[key]} times; use it and write the artifact")
        return res


def serve(task_file: str, inp, out):
    from ..shuttle.server import PROTOCOL, _content
    srv = TaskServer(task_file)
    wlock = threading.Lock()

    def send(msg):
        data = memoryview((json.dumps(msg, ensure_ascii=False) + "\n").encode("utf-8"))
        with wlock:
            while data:
                n = out.write(data)
                data = data[n or 0:]
            out.flush()

    for raw in inp:
        raw = raw.strip()
        if not raw:
            continue
        try:
            msg = json.loads(raw.decode("utf-8") if isinstance(raw, bytes) else raw)
        except json.JSONDecodeError:
            continue
        mid, method, params = msg.get("id"), msg.get("method"), msg.get("params") or {}
        try:
            if method == "initialize":
                res = {"protocolVersion": params.get("protocolVersion") or PROTOCOL, "capabilities": {"tools": {"listChanged": False}},
                       "serverInfo": {"name": "relay", "version": "1.0"}}
            elif method == "tools/list":
                res = {"tools": srv.list_tools()}
            elif method == "tools/call":
                r, imgs = srv.call(params.get("name"), params.get("arguments") or {})
                res = _content(r if isinstance(r, dict) else {"result": r}, imgs)
            elif method == "ping":
                res = {}
            elif mid is None:
                continue
            else:
                send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"method not found: {method}"}})
                continue
            if mid is not None:
                send({"jsonrpc": "2.0", "id": mid, "result": res})
        except Exception as e:  # noqa: BLE001  (a tool never takes the server down)
            if mid is not None:
                send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32603, "message": f"{type(e).__name__}: {e}"}})


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description="Relay's per-task MCP server for a role served by Claude Code")
    ap.add_argument("--task", required=True)
    a = ap.parse_args(argv)
    from ..shuttle.server import isolate_stdio
    task = read_json(Path(a.task))
    proto_in, proto_out = isolate_stdio(Path(task["state_file"]).with_name("server.log"))
    print(f"--- relay task server started {time.strftime('%Y-%m-%d %H:%M:%S')} for {task['role']} {task.get('beat') or ''}", flush=True)
    serve(a.task, proto_in, proto_out)


if __name__ == "__main__":
    main()
