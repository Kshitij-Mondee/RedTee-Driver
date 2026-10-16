#!/usr/bin/env python3
"""Vision lab: a vision-language model studies reference films and judges Loom films, with code doing all the measuring.

Run on the GPU pod (see README.md). Every command is resumable: finished items are skipped.

    python vl.py check-env                 # tools, GPU, disk, videos found
    python vl.py selftest                  # the model server: text, image, video, JSON schema, thinking
    python vl.py select                    # choose the study set (stratified by year and animation credit)
    python vl.py prepare                   # code measurements: shots, cuts, motion, palette, words, stills, clips
    python vl.py shots                     # level 1: the model annotates every shot
    python vl.py videos                    # level 2: the model analyses every whole video
    python vl.py synthesize                # level 3: frequency tables (code) + style guide (model)
    python vl.py calibrate plant|judge-planted|consistency|crossmodel|loom|report
    python vl.py judge --film F.mp4 [--manifest build/manifest.json --script plan/script.json --storyboard plan/storyboard.json]
    python vl.py validate                  # schema, evidence, ranges, copyright overlap, coverage
    python vl.py status                    # progress
    python vl.py pack                      # the bundle to send back (JSON and Markdown only; no media, no transcripts)
    python vl.py ingest bundle.zip --into <dir>   # on the receiving side

Design: docs/strategy/2026-10-03-vision-lab.md in Video-Engine (D-101). The model only ever describes what it
was shown; code supplies every number (cuts, motion, palette, timing) and checks every reference it makes.
"""
from __future__ import annotations

import argparse
import base64
import concurrent.futures as cf
import copy
import hashlib
import json
import math
import os
import random
import re
import shutil
import subprocess
import sys
import threading
import time
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCHEMAS = HERE / "schemas"
SKILLS = HERE / "skills"
VERSION = "1.0.0"
_print_lock = threading.Lock()


def auth(cfg) -> dict:
    """The server's key: vLLM refuses every request ('Unauthorized') when it was started with VLLM_API_KEY set, as on
    Kshitij's pod (L-198). The same variable is read here, so the lab always sends the key the server expects."""
    key = os.environ.get("VLLM_API_KEY") or cfg["server"].get("api_key") or "EMPTY"
    return {"Authorization": f"Bearer {key}"}


def log(*a):
    with _print_lock:
        print(time.strftime("%H:%M:%S"), *a, flush=True)


# ------------------------------------------------------------------ config and paths
def load_cfg(path: str | None) -> dict:
    import yaml
    p = Path(path) if path else HERE / "config.yaml"
    cfg = yaml.safe_load(p.read_text(encoding="utf-8"))
    cfg["_path"] = str(p)
    return cfg


class Paths:
    def __init__(self, cfg: dict):
        self.work = Path(cfg["work_dir"])
        self.videos = Path(cfg["videos_dir"])
        self.prep = self.work / "prep"
        self.out = self.work / "out" / cfg["run_id"]
        self.raw = self.work / "raw" / cfg["run_id"]
        self.calib = self.work / "calib"
        for d in (self.prep, self.out, self.raw, self.calib):
            d.mkdir(parents=True, exist_ok=True)

    def vprep(self, vid: str) -> Path:
        return self.prep / vid


class phase_lock:
    """One heavy model phase per server at a time (L-213: synthesize started by hand beside judge-planted filled the
    KV cache and cost about 4.9 pod hours). A second heavy phase refuses to start and says which one is running."""
    def __init__(self, P: "Paths", phase: str):
        self.path, self.phase, self.fh = P.work / ".heavy_phase.lock", phase, None

    def __enter__(self):
        try:
            import fcntl
        except ImportError:                     # Windows: the lab runs on the Linux pod; the lock is a no-op here
            return self
        self.fh = open(self.path, "a+")
        try:
            fcntl.flock(self.fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            self.fh.seek(0)
            who = self.fh.read().strip() or "another phase"
            self.fh.close(); self.fh = None
            sys.exit(f"refused: {who} is already using the model server. Run one heavy phase at a time (L-213).")
        self.fh.seek(0); self.fh.truncate(); self.fh.write(f"{self.phase} (pid {os.getpid()}, since {time.strftime('%H:%M:%S')})"); self.fh.flush()
        return self

    def __exit__(self, *a):
        if self.fh:
            try:
                import fcntl
                self.fh.seek(0); self.fh.truncate(); self.fh.flush()
                fcntl.flock(self.fh, fcntl.LOCK_UN)
            finally:
                self.fh.close()


def rj(p: Path, default=None):
    try:
        return json.loads(Path(p).read_text(encoding="utf-8"))
    except Exception:
        if default is not None:
            return default
        raise


def wj(p: Path, obj):
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, indent=1, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, p)


def run(cmd: list, timeout=3600, check=True) -> subprocess.CompletedProcess:
    # stdin=DEVNULL: ffmpeg reads stdin for keyboard commands and can block forever in a worker thread (seen in the sandbox)
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, timeout=timeout, stdin=subprocess.DEVNULL)
    if check and r.returncode != 0:
        raise RuntimeError(f"command failed ({r.returncode}): {' '.join(map(str, cmd))[:300]}\n{r.stderr[-1500:]}")
    return r


def ff(name="ffmpeg") -> str:
    return shutil.which(name) or name


def probe(v: Path) -> dict:
    r = run([ff("ffprobe"), "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,duration:format=duration",
             "-of", "json", v])
    j = json.loads(r.stdout)
    st = (j.get("streams") or [{}])[0]
    num, den = (st.get("r_frame_rate") or "25/1").split("/")
    D = float(j["format"]["duration"])
    try:
        vd = float(st.get("duration"))
    except (TypeError, ValueError):
        vd = D
    # the PICTURE can end before the container (audio runs on): stills and clips must stay inside the picture (L-193)
    return {"duration": D, "video_duration": min(D, vd), "width": int(st.get("width", 0)), "height": int(st.get("height", 0)),
            "fps": round(float(num) / max(1.0, float(den)), 3)}


# ------------------------------------------------------------------ schemas
_schema_cache: dict = {}


def schema(name: str) -> dict:
    if name not in _schema_cache:
        _schema_cache[name] = json.loads((SCHEMAS / f"{name}.schema.json").read_text(encoding="utf-8"))
    return _schema_cache[name]


def inline_refs(s: dict) -> dict:
    """Resolve local #/definitions/x refs (some guided-decoding backends do not follow $ref)."""
    root = copy.deepcopy(s)
    defs = root.pop("definitions", {})

    def walk(o):
        if isinstance(o, dict):
            if "$ref" in o and o["$ref"].startswith("#/definitions/"):
                return walk(copy.deepcopy(defs[o["$ref"].split("/")[-1]]))
            return {k: walk(v) for k, v in o.items()}
        if isinstance(o, list):
            return [walk(v) for v in o]
        return o
    return walk(root)


def model_schema(name: str) -> dict:
    """The schema as sent to the server: refs inlined, keywords some backends reject removed. The full schema is
    still enforced afterwards by `check_schema`."""
    s = inline_refs(schema(name))

    drop = ("$schema", "minimum", "maximum", "maxItems", "minItems", "pattern", "format", "title")

    def strip(o, is_props=False):
        # inside a "properties" mapping the keys are FIELD names (a field may be called "pattern"): never drop them
        if isinstance(o, dict):
            return {k: strip(v, k == "properties" and not is_props) for k, v in o.items() if is_props or k not in drop}
        if isinstance(o, list):
            return [strip(v) for v in o]
        return o
    return strip(s)


def prompt_schema(name: str) -> dict:
    """The schema as WRITTEN INTO THE PROMPT: refs inlined, every limit kept (maxItems, minimum, ...). The grammar
    sent to the server drops limits some backends reject (model_schema), so without this the model never learned
    that `steal` holds at most 5 items, and 4 of 5 pilot films failed validation on it, attempt after attempt (L-205)."""
    s = inline_refs(schema(name))
    return {k: v for k, v in s.items() if k not in ("$schema", "title")}


def trim_to_limits(obj, sch: dict, path: str = "") -> list[str]:
    """Cut arrays that exceed the schema's maxItems, keeping the first items (the skills ask for the most important
    first). Returns what was cut, so it is counted, never silent."""
    cut = []
    if isinstance(obj, dict) and isinstance(sch.get("properties"), dict):
        for k, v in obj.items():
            if k in sch["properties"]:
                cut += trim_to_limits(v, sch["properties"][k], f"{path}/{k}")
    elif isinstance(obj, list):
        mx = sch.get("maxItems")
        if isinstance(mx, int) and len(obj) > mx:
            cut.append(f"{path or '/'}: {len(obj)} > {mx}")
            del obj[mx:]
        it = sch.get("items")
        if isinstance(it, dict):
            for i, v in enumerate(obj):
                cut += trim_to_limits(v, it, f"{path}/{i}")
    return cut


def check_schema(name: str, obj) -> list[str]:
    import jsonschema
    v = jsonschema.Draft7Validator(schema(name))
    # the rule first, then the END of the message: jsonschema puts the offending value first, and a 200-character cut
    # used to drop the reason ("is too long") from every error (L-212)
    out = []
    for e in v.iter_errors(obj):
        rule = f"{e.validator}={json.dumps(e.validator_value, ensure_ascii=False)[:60]}"
        msg = e.message if len(e.message) <= 160 else "..." + e.message[-157:]
        out.append(f"{'/'.join(map(str, e.path)) or '<root>'}: breaks {rule}: {msg}")
    return out[:20]


# ------------------------------------------------------------------ skills (the model's instructions)
def skill_text(*names: str, rules: bool = True) -> str:
    parts = [(SKILLS / "00_rules.md").read_text(encoding="utf-8")] if rules else []
    for n in names:
        parts.append((SKILLS / n).read_text(encoding="utf-8"))
    return "\n\n---\n\n".join(parts)


# ------------------------------------------------------------------ model client
class ContextOverflow(RuntimeError):
    """The server refused the prompt as longer than its context. Never retried: the same prompt fails the same way."""


CHARS_PER_TOKEN = 2.8   # measured 2.96 on the pilot's synthesize prompts (JSON records, L-209); 2.8 keeps headroom


def est_tokens(s: str) -> int:
    return int(len(s) / CHARS_PER_TOKEN) + 1


def pack_by_budget(sizes: list[int], budget: int, cap: int | None = None) -> list[list[int]]:
    """Indices grouped in order so each group's summed size stays within budget (and at most `cap` items). An item
    larger than the budget on its own gets a group of its own; the caller must shrink it."""
    groups, cur, tot = [], [], 0
    for i, s in enumerate(sizes):
        if cur and (tot + s > budget or (cap and len(cur) >= cap)):
            groups.append(cur); cur, tot = [], 0
        cur.append(i); tot += s
    if cur:
        groups.append(cur)
    return groups


class CallTimeout(RuntimeError):
    """A call timed out twice (once at its estimated budget, once at 1.5x after the load fell). The step goes on;
    its next run picks the item up (resume skips finished work)."""


RUN_STAMP = time.strftime("%m%d%H%M%S") + f"{os.getpid() % 1000:03d}"   # one per invocation: raw names never collide


class Admission:
    """A token-weighted gate in front of the server (L-213). The pod's KV cache held 622,215 tokens; synthesize put
    about 991k in flight beside the judge, requests queued on the server, and the queue time ate the client timeout.
    A call now waits HERE, where waiting costs nothing, until its prompt + max_tokens fit under kv_fraction of the cache."""
    def __init__(self, capacity: int):
        self.cap, self.used, self.cv = max(1, int(capacity)), 0, threading.Condition()
        self.peak = 0

    def acquire(self, n: int):
        n = min(int(n), self.cap)
        with self.cv:
            while self.used + n > self.cap and self.used > 0:
                self.cv.wait(timeout=5)
            self.used += n
            self.peak = max(self.peak, self.used)

    def release(self, n: int):
        n = min(int(n), self.cap)
        with self.cv:
            self.used = max(0, self.used - n)
            self.cv.notify_all()

    def wait_below(self, frac: float, max_s: float):
        end = time.time() + max_s
        with self.cv:
            while self.used > frac * self.cap and time.time() < end:
                self.cv.wait(timeout=5)


def server_facts(cfg: dict) -> dict:
    """What the running vLLM server itself reported at start-up (server.log): the KV cache size and the context
    length. The config is a promise; the log is the fact (Rule 0). Empty when there is no log (a remote or mock server)."""
    lp = Path(cfg.get("work_dir") or ".") / "server.log"
    out = {}
    try:
        txt = lp.read_text(errors="ignore")[-2_000_000:]
    except OSError:
        return out
    kv = re.findall(r"GPU KV cache size:\s*([0-9,]+)\s*tokens", txt)
    if kv:
        out["kv_tokens"] = int(kv[-1].replace(",", ""))
    ml = re.findall(r"max_(?:seq|model)_len[=: ]+([0-9]+)", txt)
    if ml:
        out["max_model_len"] = int(ml[-1])
    return out


class _AdmitRegistry:
    def __init__(self):
        self.by, self.lock = {}, threading.Lock()

    def get(self, base: str, cfg: dict) -> Admission:
        with self.lock:
            if base not in self.by:
                S = cfg["server"]
                kv = float(S.get("kv_tokens", 600000))
                real = server_facts(cfg).get("kv_tokens")
                if real and real < kv:      # never admit more than the server really holds
                    log(f"admission: config kv_tokens {int(kv)} > the server's {real} (server.log); using {real}")
                    kv = real
                self.by[base] = Admission(int(kv * float(S.get("kv_fraction", 0.85))))
            return self.by[base]


ADMIT = _AdmitRegistry()
_media_cache: dict = {}


def media_tokens(kind: str, path: Path | None, fps: float | None) -> int:
    """About how many prompt tokens an image or a video costs (Qwen VL: a 28x28 patch is one token before 2x2 merging,
    so about w*h/3136 per frame; video frames are merged two by two in time). Learned scale factors correct it."""
    try:
        if kind == "image":
            from PIL import Image
            with Image.open(path) as im:
                w, h = im.size
            return int(w * h / 3136) + 8
        if kind == "video":
            key = str(path)
            if key not in _media_cache:
                _media_cache[key] = probe(path)
            pr = _media_cache[key]
            frames = max(2, min(pr["video_duration"] * (fps or 2), pr["video_duration"] * (pr["fps"] or 25)))
            return int(frames / 2 * pr["width"] * pr["height"] / 3136) + 16
    except Exception:  # noqa: BLE001 - an estimate must never fail a call
        pass
    return 1500 if kind == "video" else 400


class Client:
    def __init__(self, cfg: dict, paths: Paths, which: str = "a", base_url: str | None = None):
        self.cfg, self.paths, self.which = cfg, paths, which
        self.m = cfg["models"][which]
        self.base = (base_url or cfg["server"]["base_url"]).rstrip("/")
        st = rj(paths.work / "selftest.json", {})
        self.transport = st.get("transport", "file")
        self.structured = bool(cfg["media"].get("structured_output", True)) and st.get("structured_ok", True)
        self.think_ok = st.get("thinking_with_schema_ok", True)
        self.video_mode = st.get("video_mode", "fps+sample")      # how fps reaches the processor; selftest picks the one the server takes
        self.usage = Counter()
        self.lock = threading.Lock()
        self.prompt_scale: dict = {}          # real prompt tokens / estimate, per call kind (learned)
        self.speed: dict = {}                 # completion tokens / second per call, per kind (learned)
        self.timeout_boost: dict = {}
        self.raw_dir = which if which != "a" else ""   # model B and C keep their raw records apart

    def save_usage(self, name: str):
        """Usage accumulates across invocations (L-212: each run overwrote the file, so the largest phase had none)."""
        p = self.paths.out / f"usage_{name}.json"
        old = rj(p, {}) or {}
        inv = old.get("invocations") if isinstance(old.get("invocations"), list) else ([{"run": "before-v2", **old}] if old else [])
        inv.append({"run": RUN_STAMP, **{k: v for k, v in self.usage.items()}})
        tot = Counter()
        for x in inv:
            for k, v in x.items():
                if isinstance(v, (int, float)) and k != "run":
                    tot[k] += v
        wj(p, {"total": dict(tot), "invocations": inv})

    # media parts --------------------------------------------------------------
    def media(self, kind: str, path: Path) -> dict:
        path = Path(path).resolve()
        if self.transport == "file":
            url = "file://" + str(path)
        else:
            mime = {"image": "image/jpeg", "video": "video/mp4", "audio": "audio/wav"}[kind]
            url = f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()
        return {"type": f"{kind}_url", f"{kind}_url": {"url": url}}

    @staticmethod
    def text(t: str) -> dict:
        return {"type": "text", "text": t}

    # one call -----------------------------------------------------------------
    def call(self, kind: str, system: str, content: list, schema_name: str | None, key: str, fps: float | None = None,
             temperature: float | None = None, seed: int | None = None, max_tokens: int | None = None) -> dict:
        """kind: shots | videos | synthesize | judge | judge_film | selftest | maturity*. Returns the parsed, schema-valid
        object. Raw responses (text and thinking, never media) are kept under raw/ for audit.

        Safety (D-113, from the TED-Ed run): the call waits for room in the server's KV cache before it is sent, so
        queueing on the server can no longer eat the timeout (L-213); its timeout is sized from its own prompt and
        max_tokens; a timeout is retried once, larger, after the load falls, never resent unchanged (L-210); thinking
        that runs to the cap is told apart from a grammar runaway and retried with room or without thinking."""
        import requests
        group = "judge" if kind.startswith("judge") else kind
        think = bool(self.m.get("thinking", {}).get(group, False)) and self.think_ok
        temp = temperature if temperature is not None else self.m["temperature"]["thinking" if think else "plain"]
        mt = int(max_tokens or self.m.get("max_tokens", {}).get(kind, 8000))
        body = {
            "model": self.m["name"],
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": content}],
            "max_tokens": mt, "temperature": temp, "top_p": 0.95 if think else 0.8,
            "chat_template_kwargs": {"enable_thinking": think},
        }
        if seed is not None:
            body["seed"] = seed
        if fps and any(p.get("type") == "video_url" for p in content):
            if self.video_mode == "fps+sample":
                body["mm_processor_kwargs"] = {"fps": fps, "do_sample_frames": True}
            elif self.video_mode == "fps":
                body["mm_processor_kwargs"] = {"fps": fps}
            # "none": the server's own frame sampling
        if schema_name:
            # the schema is ALSO written into the prompt (L-199): a model that knows the shape picks tokens the grammar
            # allows; one that does not can be cornered into padding whitespace until max_tokens
            body["messages"][1]["content"] = list(content) + [self.text(
                "Return ONE JSON object that matches this JSON Schema exactly (types, enums, required fields and array limits):\n"
                + json.dumps(prompt_schema(schema_name), separators=(",", ":"), ensure_ascii=False))]
        if schema_name and self.structured:
            body["response_format"] = {"type": "json_schema", "json_schema": {"name": schema_name, "schema": model_schema(schema_name), "strict": True}}
        self._receipt(kind, key, system, content, schema_name, think, body)
        est_prompt = self.estimate_prompt(kind, system, body["messages"][1]["content"], fps)
        ctx = int(self.m.get("context") or 131072)
        if est_prompt + body["max_tokens"] > ctx:
            # a prompt we can already see will not fit is refused here, not by the server after the queue (L-209)
            if est_prompt + 1024 > ctx:
                self._raw(kind, key, body, "", "", {}, 0.0, 0, f"prompt of about {est_prompt} tokens exceeds the context {ctx}")
                raise ContextOverflow(f"{kind} {key}: prompt of about {est_prompt} tokens does not fit the context of {ctx}")
            body["max_tokens"] = ctx - est_prompt - 512
        errors, text, reasoning, data = [], "", "", {}
        base_messages = list(body["messages"])
        retries = int(self.cfg["server"].get("retries", 3))
        timeouts_left = int(self.cfg["server"].get("timeout_retries", 1))
        widened = cut_thinking = False
        attempt = 0
        while attempt <= retries:
            t0 = time.time()
            need_wait = False
            reserve = est_prompt + int(body["max_tokens"])
            tmo = self.call_timeout(kind, est_prompt, int(body["max_tokens"]), body["chat_template_kwargs"]["enable_thinking"])
            text, reasoning, data = "", "", {}
            ADMIT.get(self.base, self.cfg).acquire(reserve)
            try:
                t0 = time.time()
                r = requests.post(self.base + "/chat/completions", json=body, timeout=tmo, headers=auth(self.cfg))
                if r.status_code != 200:
                    t_ = r.text
                    if r.status_code == 400 and "maximum context length" in t_:
                        # deterministic: the same prompt fails the same way, so retrying only wastes pod time (L-209)
                        raise ContextOverflow(f"{kind} {key}: prompt too long for the context: {t_[-600:]}")
                    # keep the end: vLLM puts the cause after a long dump of the input (L-200)
                    raise RuntimeError(f"HTTP {r.status_code}: {t_[:200]} ... {t_[-1200:]}" if len(t_) > 1500 else f"HTTP {r.status_code}: {t_}")
                data = r.json()
                ch = data["choices"][0]
                msg = ch["message"]
                finish = ch.get("finish_reason") or "unknown"
                text = msg.get("content") or ""
                reasoning = msg.get("reasoning_content") or msg.get("reasoning") or ""
                u = data.get("usage") or {}
                comp = int(u.get("completion_tokens") or 0)
                rtok = int(((u.get("completion_tokens_details") or {}).get("reasoning_tokens")) or 0)
                with self.lock:
                    for k, v in u.items():
                        if isinstance(v, int):
                            self.usage[k] += v
                    self.usage["reasoning_tokens"] += rtok
                    self.learn(kind, est_prompt, u, time.time() - t0)
                capped = finish == "length" or (comp and comp >= int(body["max_tokens"]))
                if capped and (rtok >= 0.9 * comp or (reasoning and not text.strip())):
                    # THINKING ran to the cap and left no answer. It is not a grammar runaway (the pod's four
                    # "runaways" were this, L-212): give it room once, then answer without thinking.
                    with self.lock:
                        self.usage["thinking_caps"] += 1
                    if not widened and int(body["max_tokens"] * 1.5) + est_prompt <= ctx:
                        body["max_tokens"] = int(body["max_tokens"] * 1.5); widened = True
                        raise ValueError(f"thinking used the whole budget ({rtok} of {comp} tokens): retrying with max_tokens {body['max_tokens']}")
                    if not cut_thinking:
                        body["chat_template_kwargs"] = {"enable_thinking": False}
                        body["temperature"] = self.m["temperature"]["plain"]; body["top_p"] = 0.8
                        cut_thinking = True
                        raise ValueError("thinking used the whole budget twice: retrying without thinking")
                if capped and "response_format" in body and text and len(text.strip()) < 0.2 * len(text) + 50:
                    # grammar runaway: the ANSWER is mostly padding and hit max_tokens (seen on the pod: '{"answer":' then
                    # 7,900 tokens of whitespace). Retry without the grammar; the schema stays in the prompt and the
                    # validator still checks every field (L-199)
                    body.pop("response_format", None)
                    body["messages"] = list(base_messages)
                    with self.lock:
                        self.usage["grammar_runaways"] += 1
                    raise ValueError("grammar runaway (whitespace to max_tokens): retrying without the grammar")
                obj = parse_json(text)
                if schema_name:
                    cut = trim_to_limits(obj, inline_refs(schema(schema_name)))
                    if cut:
                        with self.lock:
                            self.usage["arrays_trimmed"] += len(cut)
                    errs = check_schema(schema_name, obj)
                    if errs:
                        raise ValueError("schema: " + "; ".join(errs[:6]))
                self._raw(kind, key, body, text, reasoning, data, time.time() - t0, attempt, None)
                return obj
            except ContextOverflow as e:
                self._raw(kind, key, body, text, reasoning, data, time.time() - t0, attempt, str(e)[:1600])
                raise
            except requests.exceptions.Timeout as e:
                # a timeout is never resent unchanged (L-210): once, with a longer timeout, after the load has fallen
                es = f"timeout after {tmo:.0f} s ({e.__class__.__name__})"
                errors.append(es)
                self._raw(kind, key, body, text, reasoning, data, time.time() - t0, attempt, es)
                with self.lock:
                    self.usage["timeouts"] += 1
                if timeouts_left <= 0:
                    raise CallTimeout(f"{kind} {key}: {es}; not retried again (the step's next run picks it up)")
                timeouts_left -= 1
                self.timeout_boost[kind] = self.timeout_boost.get(kind, 1.0) * 1.5
                need_wait = True
            except Exception as e:  # noqa: BLE001 - schema, JSON and transient errors are retried and logged
                es = str(e)
                es = es if len(es) <= 1600 else es[:300] + " ... " + es[-1300:]
                errors.append(es)
                self._raw(kind, key, body, text, reasoning, data, time.time() - t0, attempt, es)
                if ("schema" in es or "JSON" in es) and "runaway" not in es:
                    # repair turn: show the model its own answer and the exact errors
                    body["messages"] = base_messages[:2] + [
                        {"role": "assistant", "content": text[:20000]},
                        {"role": "user", "content": "Your answer did not validate: " + es[:1500] + "\nReturn the corrected JSON object only, within every array limit."}]
                time.sleep(min(10, 2 * (attempt + 1)))
            finally:
                ADMIT.get(self.base, self.cfg).release(reserve)
            if need_wait:
                ADMIT.get(self.base, self.cfg).wait_below(0.5, 600)
            attempt += 1
        raise RuntimeError(f"{kind} {key}: failed after retries: {errors[-1] if errors else '?'}")

    # estimates: prompt size, speed, timeout -----------------------------------
    def estimate_prompt(self, kind: str, system: str, content: list, fps: float | None) -> int:
        n = est_tokens(system) + sum(est_tokens(p.get("text", "")) for p in content if p.get("type") == "text")
        for p in content:
            t = p.get("type", "")
            if t in ("image_url", "video_url"):
                url = p[t]["url"]
                path = Path(url[7:]) if url.startswith("file://") else None
                n += media_tokens(t[:-4], path, fps)
        corr = self.prompt_scale.get(kind)
        return int(n * corr) if corr else n

    def learn(self, kind: str, est_prompt: int, usage: dict, secs: float):
        """Keep the estimates honest: the real prompt size against the estimate, and the real decode speed."""
        pt, ct = usage.get("prompt_tokens"), usage.get("completion_tokens")
        if pt and est_prompt:
            r = pt / max(1, est_prompt / (self.prompt_scale.get(kind) or 1.0))
            self.prompt_scale[kind] = round(0.7 * (self.prompt_scale.get(kind) or r) + 0.3 * r, 3)
        if ct and secs > 1:
            self.speed.setdefault(kind, []).append(ct / secs)
            self.speed[kind] = self.speed[kind][-30:]

    def call_timeout(self, kind: str, est_prompt: int, max_tokens: int, thinking: bool) -> float:
        S = self.cfg["server"]
        sp = sorted(self.speed.get(kind) or [])
        tps = max(float(S.get("decode_tps_floor", 10)), sp[len(sp) // 4] if sp else 0)   # a slow quartile, not the mean
        est = est_prompt / float(S.get("prefill_tps", 2500)) + max_tokens / tps
        t = max(float(S["timeout_s"]), 1.5 * est) * self.timeout_boost.get(kind, 1.0)
        return min(float(S.get("timeout_max_s", 7200)), t)

    def _receipt(self, kind, key, system, content, schema_name, think, body):
        """What the model was REALLY given, per call (L-197): every skill file whose full text is inside the system
        prompt, whether the rules come first, the schema and how it was enforced, the media parts and whether each
        file exists. `vl.py receipts` summarises them and fails when a call kind misses a skill it needs."""
        skills = [p.name for p in sorted(SKILLS.glob("*.md")) if p.read_text(encoding="utf-8").strip() in system]
        media = Counter(); missing = 0
        for part in content:
            t = part.get("type", "")
            if t.endswith("_url"):
                media[t[:-4]] += 1
                url = part[t]["url"]
                if url.startswith("file://") and not Path(url[7:]).exists():
                    missing += 1
        rec = {"kind": kind, "key": key, "run": RUN_STAMP, "skills": skills,
               "rules_first": system.startswith((SKILLS / "00_rules.md").read_text(encoding="utf-8").strip()[:200]),
               "rubric": "RUBRIC (from" in system, "system_chars": len(system),
               "schema": schema_name, "schema_enforced": "response_format" in body, "thinking": think,
               "schema_in_prompt": bool(schema_name) and "JSON Schema exactly" in json.dumps(body["messages"][1]["content"]),
               "media": dict(media), "media_missing": missing,
               "user_text_chars": sum(len(p.get("text", "")) for p in content if p.get("type") == "text")}
        with self.lock:
            self.paths.raw.mkdir(parents=True, exist_ok=True)
            with open(self.paths.raw / "receipts.jsonl", "a", encoding="utf-8") as fh:
                fh.write(json.dumps(rec) + "\n")

    def _raw(self, kind, key, body, text, reasoning, data, secs, attempt, err):
        """Every attempt, kept: the answer AND the thinking text (L-213: the run kept only the thinking's length, so
        "how did it think?" had no answer). The file name carries this invocation's stamp, so a later run never
        overwrites an earlier one's attempts (L-212); calls.jsonl is the one-line-per-attempt index."""
        slim = {k: v for k, v in body.items() if k != "messages"}
        slim.pop("response_format", None)
        u = data.get("usage") if isinstance(data, dict) else None
        fin = ((data.get("choices") or [{}])[0].get("finish_reason") if isinstance(data, dict) and data.get("choices") else None)
        rec = {"key": key, "kind": kind, "run": RUN_STAMP, "attempt": attempt, "seconds": round(secs, 2), "error": err, "request": slim,
               "content": text, "reasoning": reasoning or "", "reasoning_chars": len(reasoning or ""), "usage": u,
               "finish": fin or ("error" if err else "unknown")}
        p = self.paths.raw / self.raw_dir / kind / (re.sub(r"[^\w.-]", "_", key) + f".{RUN_STAMP}.a{attempt}.json")
        wj(p, rec)
        idx = {k: rec[k] for k in ("key", "kind", "run", "attempt", "seconds", "finish")} | {
            "error": (err or "")[:200], "prompt_tokens": (u or {}).get("prompt_tokens"), "completion_tokens": (u or {}).get("completion_tokens"),
            "reasoning_tokens": ((u or {}).get("completion_tokens_details") or {}).get("reasoning_tokens"), "max_tokens": body.get("max_tokens"),
            "thinking": (body.get("chat_template_kwargs") or {}).get("enable_thinking")}
        with self.lock:
            with open(self.paths.raw / "calls.jsonl", "a", encoding="utf-8") as fh:
                fh.write(json.dumps(idx) + "\n")


def parse_json(text: str):
    t = (text or "").strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    try:
        return json.loads(t)
    except Exception:
        a, b = t.find("{"), t.rfind("}")
        if a >= 0 and b > a:
            return json.loads(t[a:b + 1])
        raise ValueError("no JSON object in the answer")


# ------------------------------------------------------------------ select the study set
ID_RE = re.compile(r"\[([\w-]{11})\]")
CREDIT_RE = re.compile(r"(?im)^\s*(?:animation|animated|directed|art direction)\s*(?:by|:)\s*(.+)$")


def video_id(p: Path) -> str:
    m = ID_RE.search(p.name)
    return m.group(1) if m else "v" + hashlib.sha1(p.name.encode()).hexdigest()[:10]


def sidecar(p: Path, ext: str) -> Path | None:
    import glob as _g
    cands = [p.with_suffix(ext)] + sorted(p.parent.glob(_g.escape(p.stem) + "*" + ext))   # titles carry [id]: escape it
    return next((c for c in cands if c.exists()), None)


def credit_hash(desc: str) -> str | None:
    """The animation credit, hashed. It is a hidden label used only to test whether style families are coherent;
    the name itself is never shown to the model or exported."""
    m = CREDIT_RE.search(desc or "")
    if not m:
        return None
    name = re.split(r"[|\n]", m.group(1))[0].strip().lower()
    name = re.sub(r"[^a-z0-9 ]", "", name)[:60].strip()
    return hashlib.sha1(name.encode()).hexdigest()[:10] if name else None


def cmd_select(cfg, P: Paths, args):
    S = cfg["select"]
    vids = []
    for p in sorted(P.videos.glob("*.mp4")):
        info = rj(sidecar(p, ".info.json"), {}) if sidecar(p, ".info.json") else {}
        dur = float(info.get("duration") or 0) or probe(p)["duration"]
        if not (S["min_duration_s"] <= dur <= S["max_duration_s"]):
            continue
        date = str(info.get("upload_date") or "")
        vids.append({"id": video_id(p), "file": str(p), "title": info.get("title") or p.stem, "year": date[:4] or "unknown",
                     "duration": round(dur, 1), "credit": credit_hash(info.get("description", "")),
                     "srt": str(sidecar(p, ".srt")) if sidecar(p, ".srt") else None})
    if not vids:
        sys.exit(f"no videos between {S['min_duration_s']} and {S['max_duration_s']} s in {P.videos} (a zero is not a result)")
    rnd = random.Random(cfg["calibration"]["seed"])
    rnd.shuffle(vids)
    want = min(S["count"], len(vids))
    cap_year = max(1, int(math.ceil(S["per_year_cap"] * want)))
    years, credits, chosen = Counter(), Counter(), []
    # round-robin over years so every era is in the set, newest first inside each year
    by_year = defaultdict(list)
    for v in vids:
        by_year[v["year"]].append(v)
    order = sorted(by_year, reverse=True)
    while len(chosen) < want and any(by_year.values()):
        progressed = False
        for y in order:
            while by_year[y]:
                v = by_year[y].pop()
                if years[y] >= cap_year or (v["credit"] and credits[v["credit"]] >= S["per_animator_cap"]):
                    continue
                chosen.append(v); years[y] += 1; progressed = True
                if v["credit"]:
                    credits[v["credit"]] += 1
                break
            if len(chosen) >= want:
                break
        if not progressed:
            break
    if len(chosen) < want:   # the caps could not be met with this collection: fill up, and say so
        left = [v for v in vids if v not in chosen]
        log(f"select: caps leave {len(chosen)}; filling {want - len(chosen)} more without the caps")
        chosen += left[: want - len(chosen)]
    wj(P.work / "selection.json", {"count": len(chosen), "available": len(vids), "years": dict(years),
                                   "credited": sum(1 for v in chosen if v["credit"]), "videos": chosen})
    log(f"select: {len(chosen)} of {len(vids)} videos; years {dict(sorted(years.items()))}; "
        f"{sum(1 for v in chosen if v['credit'])} with an animation credit; {sum(1 for v in chosen if v['srt'])} with an .srt")


def selection(P: Paths, only: str | None = None) -> list[dict]:
    sel = rj(P.work / "selection.json", {})
    vids = sel.get("videos") or []
    if not vids:
        sys.exit("no selection.json: run `python vl.py select` first")
    if only:
        keep = set(only.split(","))
        vids = [v for v in vids if v["id"] in keep]
    return vids


# ------------------------------------------------------------------ prepare (code measurements, no model)
def frames_small(v: Path, fps: float, w=160, h=90):
    import numpy as np
    p = subprocess.Popen([ff(), "-v", "error", "-i", str(v), "-vf", f"fps={fps},scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE, stdin=subprocess.DEVNULL)
    n = w * h * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
    p.wait()


def hist512(f):
    import numpy as np
    q = (f // 32).reshape(-1, 3).astype(np.int32)
    h = np.bincount(q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2], minlength=512).astype(np.float32)
    return h / h.sum()


def analyse_frames(v: Path, fps: float) -> dict:
    """Cuts (hard and gradual), per-frame change, black and frozen frames. Same cut rule as tools/video_study.py
    (colour mix AND a visible share of pixels must change), plus a gradual-transition detector."""
    import numpy as np
    prev = prevh = None
    change, hdiff, lum, frozen = [], [], [], []
    for f in frames_small(v, fps):
        g = f.astype(np.int16)
        h = hist512(f)
        lum.append(float(f.mean()))
        if prev is not None:
            px = float((np.abs(g - prev).max(2) > 24).mean())
            hd = float(0.5 * np.abs(h - prevh).sum())
            change.append(px); hdiff.append(hd)
            frozen.append(float(np.abs(g - prev).mean()) < 0.15)
        prev, prevh = g, h
    change, hdiff = np.array(change), np.array(hdiff)
    hard = [i + 1 for i in range(len(change)) if (hdiff[i] > 0.45 and change[i] > 0.25) or (change[i] > 0.6 and hdiff[i] > 0.25)]
    # gradual: 3+ consecutive frames of moderate change whose combined colour shift is large (a dissolve or a morph)
    grad, i = [], 0
    while i < len(change):
        if 0.04 < change[i] < 0.6 and i not in hard:
            j = i
            while j + 1 < len(change) and 0.04 < change[j + 1] < 0.6:
                j += 1
            if j - i >= 2 and hdiff[i:j + 1].sum() > 0.6 and not any(i <= k <= j + 1 for k in hard):
                grad.append((i + 1 + j + 1) // 2)
            i = j + 1
        else:
            i += 1
    return {"fps": fps, "change": change.round(4).tolist(), "hdiff": hdiff.round(4).tolist(), "lum": [round(x, 1) for x in lum],
            "frozen": frozen, "hard": hard, "gradual": grad}


def flow_curve(v: Path, width: int = 192) -> dict:
    """EVERY frame (the model and the 5 fps pass cannot judge smoothness): optical-flow speed per frame (99th percentile)
    (pixels per frame at `width`), mean luminance, hard cuts at full rate, and one-frame flashes (a frame unlike
    both neighbours while they match each other: the 'flashes back for a frame' bug)."""
    import numpy as np
    import cv2
    pr = probe(v)
    w, h = width, int(round(width * pr["height"] / max(1, pr["width"]) / 2) * 2)
    p = subprocess.Popen([ff(), "-v", "error", "-i", str(v), "-vf", f"scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                         stdout=subprocess.PIPE, stdin=subprocess.DEVNULL)
    n = w * h
    mags, lum, frames3, flashes, cuts = [], [], [], [], []
    prev = None
    i = 0
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        g = np.frombuffer(b, np.uint8).reshape(h, w)
        lum.append(float(g.mean()))
        if prev is not None:
            diff = float(np.abs(g.astype(np.int16) - prev.astype(np.int16)).mean())
            if diff > 28:                      # a hard change: a cut, not motion
                cuts.append(i); mags.append(0.0)
            else:
                fl = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 2, 9, 2, 5, 1.1, 0)
                # the 99th percentile, not the mean: a small object moving fast is a movement even on a still frame
                mags.append(float(np.percentile(np.sqrt((fl ** 2).sum(2)), 99)))
        else:
            mags.append(0.0)
        frames3.append(g)
        if len(frames3) == 3:
            a, m, c = (x.astype(np.int16) for x in frames3)
            if np.abs(a - c).mean() < 2.0 and np.abs(m - a).mean() > 8.0:
                flashes.append(i - 1)
            frames3.pop(0)
        prev = g
        i += 1
    p.wait()
    return {"fps": pr["fps"], "width": w, "mag": [round(x, 3) for x in mags], "lum": [round(x, 1) for x in lum],
            "cuts": cuts, "flashes": flashes}


def motion_events_full(fc: dict, t0: float, t1: float, thr: float = 0.5) -> dict:
    """Movements inside [t0, t1] from the full-rate speed curve: start, duration, peak speed, where the peak falls
    (0 = at the start: an ease-out move; 1 = at the end: an ease-in; middle = ease-in-out), whether it plateaus
    (linear), jerk spikes (sudden speed jumps inside a move), flicker (luminance see-saw) and flashes."""
    import numpy as np
    fps = fc["fps"] or 25
    a, b = int(t0 * fps), max(int(t0 * fps) + 2, int(t1 * fps))
    m = np.array(fc["mag"][a:b], dtype=float)
    if len(m) < 3:
        return {"events": [], "jerk_spikes": 0, "flicker": 0.0, "flashes": 0, "moving_share": 0.0}
    sm = np.convolve(m, np.ones(3) / 3, mode="same")
    ev, i = [], 0
    while i < len(sm):
        if sm[i] > thr:
            j = i
            while j + 1 < len(sm) and sm[j + 1] > thr * 0.6:
                j += 1
            if j - i >= 2:
                seg = sm[i:j + 1]
                pk = int(seg.argmax())
                frac = pk / max(1, len(seg) - 1)
                plateau = float((seg > 0.8 * seg.max()).mean())
                shape = "linear" if plateau > 0.5 else ("ease_out" if frac < 0.3 else "ease_in" if frac > 0.7 else "ease_in_out")
                ev.append({"t": round(i / fps, 2), "dur": round((j - i + 1) / fps, 2), "peak": round(float(seg.max()), 2),
                           "peak_at": round(frac, 2), "shape": shape})
            i = j + 1
        else:
            i += 1
    # stutter: inside a movement the speed drops to near zero and jumps back (step motion, dropped frames, a tween
    # fighting another). Counted as frames whose speed is far below both neighbours while those move.
    jerk = 0
    for k in range(1, len(m) - 1):
        if m[k - 1] > thr and m[k + 1] > thr and m[k] < 0.35 * min(m[k - 1], m[k + 1]):
            jerk += 1
        elif m[k] > thr and m[k] > 3.0 * max(m[k - 1], m[k + 1], 0.1):
            jerk += 1
    l = np.array(fc["lum"][a:b], dtype=float)
    dl = np.diff(l)
    flick = float(((dl[1:] * dl[:-1] < 0) & (np.abs(dl[1:]) > 2) & (np.abs(dl[:-1]) > 2)).mean()) if len(dl) > 2 else 0.0
    fl = sum(1 for k in fc["flashes"] if a <= k < b)
    # up to 100 events (L-212: the cap of 20 left later motion unmeasured in 123 shots), with the true total
    return {"events": ev[:100], "events_total": len(ev), "truncated": len(ev) > 100, "jerk_spikes": jerk, "flicker": round(flick, 3), "flashes": fl,
            "moving_share": round(float((sm > thr).mean()), 3)}


def audio_onsets(v: Path, sr: int = 16000) -> dict:
    """Sound hits from spectral flux (numpy only): times and strengths, plus loudness per 0.1 s. Tuned on a synthetic
    test (6 clicks over a music-like tone bed and noise: all 6 found, none extra); approximate on real mixes."""
    import numpy as np
    p = subprocess.run([ff(), "-v", "error", "-i", str(v), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, stdin=subprocess.DEVNULL)
    x = np.frombuffer(p.stdout, np.int16).astype(np.float32) / 32768
    if len(x) < sr:
        return {"onsets": [], "rms_db_10hz": []}
    n, hop = 1024, 256
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1))
    flux = np.maximum(0, np.diff(np.log1p(S * 10), axis=0)).sum(1)
    k = 15
    med = np.array([np.median(flux[max(0, i - k): i + k]) for i in range(len(flux))])
    thr = med + 2.5 * flux.std()
    peaks = [i for i in range(1, len(flux) - 1) if flux[i] > thr[i] and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]]
    keep, last = [], -999
    for i in peaks:                                  # at most one hit per 80 ms
        if i - last >= int(0.12 * sr / hop):
            keep.append(i); last = i
    t = [(i + 1) * hop / sr for i in keep]
    mx = float(flux.max()) or 1.0
    step = sr // 10
    m = len(x) // step
    rms = (20 * np.log10(np.sqrt((x[: m * step].reshape(m, step) ** 2).mean(1) + 1e-12))).round(1).tolist()
    return {"onsets": [{"t": round(a, 3), "s": round(float(flux[i]) / mx, 3)} for a, i in zip(t, keep)], "rms_db_10hz": rms}


def sound_stats(ons: dict, words: list, cuts_s: list, events_s: list, D: float) -> dict:
    """How sound and picture line up: hits outside speech, cuts and movement starts that land within 0.12 s of a
    hit, and the level between words (the music bed) against the level of speech."""
    import numpy as np
    on = [o["t"] for o in ons.get("onsets", [])]
    speech = [(w["s"] - 0.05, w["e"] + 0.05) for w in words]
    def in_speech(t):
        return any(a <= t <= b for a, b in speech)
    non = [t for t in on if not in_speech(t)]
    near = lambda t: any(abs(t - o) <= 0.12 for o in on)
    rms = ons.get("rms_db_10hz", [])
    sp, gap = [], []
    for i, r in enumerate(rms):
        (sp if in_speech(i / 10 + 0.05) else gap).append(r)
    return {"hits": len(on), "hits_per_min": round(len(on) / max(1e-6, D / 60), 1), "nonspeech_hits_per_min": round(len(non) / max(1e-6, D / 60), 1),
            "cuts_on_hit_share": round(sum(1 for c in cuts_s if near(c)) / len(cuts_s), 3) if cuts_s else None,
            "moves_on_hit_share": round(sum(1 for e in events_s if near(e)) / len(events_s), 3) if events_s else None,
            "speech_db_median": round(float(np.median(sp)), 1) if sp else None,
            "between_words_db_median": round(float(np.median(gap)), 1) if gap else None}


def audio_db(v: Path, step=0.5) -> list:
    import numpy as np
    p = subprocess.run([ff(), "-v", "error", "-i", str(v), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True, stdin=subprocess.DEVNULL)
    a = np.frombuffer(p.stdout, np.int16).astype(np.float32) / 32768
    k = int(8000 * step)
    m = len(a) // k
    if m == 0:
        return []
    return (20 * np.log10(np.sqrt((a[: m * k].reshape(m, k) ** 2).mean(1) + 1e-12))).round(1).tolist()


def palette(paths: list[Path], k: int) -> list[dict]:
    """k-means (deterministic seed) over pixels of the given stills; colours as hex with their share."""
    import numpy as np
    from PIL import Image
    px = np.concatenate([np.asarray(Image.open(p).convert("RGB").resize((96, 54))).reshape(-1, 3) for p in paths]).astype(np.float32)
    rng = np.random.default_rng(0)
    c = px[rng.choice(len(px), k, replace=False)]
    for _ in range(12):
        lab = ((px[:, None, :] - c[None]) ** 2).sum(2).argmin(1)
        for j in range(k):
            if (lab == j).any():
                c[j] = px[lab == j].mean(0)
    share = np.bincount(lab, minlength=k) / len(lab)
    order = np.argsort(-share)
    return [{"hex": "#%02X%02X%02X" % tuple(int(x) for x in c[j]), "share": round(float(share[j]), 3)} for j in order if share[j] > 0.01]


def still_stats(p: Path) -> dict:
    import numpy as np
    from PIL import Image, ImageFilter
    im = Image.open(p).convert("RGB").resize((480, 270))
    a = np.asarray(im).astype(np.float32)
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    edges = np.asarray(im.convert("L").filter(ImageFilter.FIND_EDGES)).astype(np.float32)
    return {"brightness": round(float(a.mean() / 255), 3), "saturation": round(float(sat.mean()), 3),
            "detail": round(float((edges > 40).mean()), 4)}


def extract_still(v: Path, t: float, out: Path, width: int, vdur: float | None = None):
    """One still at t. ffmpeg writes NOTHING (and no error) when t is at or past the last frame, so the time is
    clamped inside the picture and stepped back until a frame comes out (L-193)."""
    # min(iw, width): never upscale a low-resolution source (it adds pixels, not detail)
    if vdur:
        t = min(t, vdur - 0.1)
    for back in (0.0, 0.25, 0.5, 1.0, 2.0):
        run([ff(), "-v", "error", "-y", "-ss", f"{max(0.0, t - back):.3f}", "-i", v, "-frames:v", "1", "-vf", f"scale='min(iw,{width})':-2", "-q:v", "2", out])
        if Path(out).exists() and Path(out).stat().st_size > 0:
            return
    raise RuntimeError(f"no frame near {t:.2f} s in {Path(v).name}")


def make_lowres(src: Path, out: Path, cfg) -> None:
    """The whole-film video, AT the frame rate the model should see (media.video_fps). The server samples videos at
    its own rate (serve.sh: 4 fps, the highest we use) but never more often than the file has frames, so a file made at
    1 fps reaches the model at exactly 1 fps (L-201)."""
    run([ff(), "-v", "error", "-y", "-i", src, "-an", "-vf", f"fps={cfg['media']['video_fps']},scale=-2:{cfg['media']['video_height']}",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p", out], timeout=7200)


def lowres_ok(p: Path, cfg) -> bool:
    if not p.exists():
        return False
    try:
        return abs(probe(p)["fps"] - float(cfg["media"]["video_fps"])) < 0.01
    except Exception:  # noqa: BLE001
        return False


def extract_clip(v: Path, t0: float, t1: float, out: Path, height: int):
    run([ff(), "-v", "error", "-y", "-ss", f"{t0:.3f}", "-i", v, "-t", f"{max(0.2, t1 - t0):.3f}", "-an", "-vf", f"scale=-2:'min(ih,{height})'",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", out])


def srt_words(p: Path) -> list[dict]:
    """Cue-level timings spread evenly over each cue's words (approximate; marked as such)."""
    words = []
    txt = p.read_text(encoding="utf-8", errors="ignore")
    for blk in re.split(r"\n\s*\n", txt):
        m = re.search(r"(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)", blk)
        if not m:
            continue
        g = list(map(int, m.groups()))
        a = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        b = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        line = " ".join(blk.split("\n")[2:]) if "-->" in blk.split("\n")[1] else " ".join(blk.split("\n")[1:])
        line = re.sub(r"<[^>]+>|\{[^}]+\}", "", line)
        ws = [w for w in line.split() if w.strip()]
        for i, w in enumerate(ws):
            words.append({"w": w, "s": round(a + (b - a) * i / max(1, len(ws)), 2), "e": round(a + (b - a) * (i + 1) / max(1, len(ws)), 2)})
    # auto-generated .srt repeats lines across cues: drop exact repeats at nearly the same time
    out, seen = [], set()
    for w in words:
        k = (w["w"].lower(), round(w["s"]))
        if k not in seen:
            seen.add(k); out.append(w)
    return out


_whisper = None
_wlock = threading.Lock()


def load_wav16(p: Path):
    """16 kHz mono 16-bit wav -> float32 array. Whisper gets the array, so it never decodes the file itself:
    faster-whisper's own decoder broke on PyAV 15+ ('metadata_errors', L-194)."""
    import wave
    import numpy as np
    with wave.open(str(p), "rb") as w:
        if w.getframerate() != 16000 or w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError(f"{p.name}: expected 16 kHz mono 16-bit")
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


def whisper_words(v: Path, cfg) -> list[dict] | None:
    """v: the 16 kHz mono wav made by prepare."""
    global _whisper
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None
    if not cfg["prepare"].get("whisper_model"):
        return None
    with _wlock:
        try:
            if _whisper is None:
                dev = cfg["prepare"].get("whisper_device", "cuda")
                _whisper = WhisperModel(cfg["prepare"]["whisper_model"], device=dev, compute_type="float16" if dev == "cuda" else "int8",
                                        download_root=cfg["prepare"].get("whisper_dir") or None)
            segs, _ = _whisper.transcribe(load_wav16(v), word_timestamps=True, vad_filter=True, language="en")
            return [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segs for w in (s.words or [])]
        except Exception as e:  # noqa: BLE001 - fall back to the .srt, and say so
            log(f"whisper unavailable ({str(e)[:160]}); words come from the .srt if there is one")
            return None


def speech_stats(words: list[dict], D: float) -> dict:
    if not words:
        return {"words": 0, "wpm": 0, "pauses": []}
    pauses = [{"t": round(a["e"], 2), "s": round(b["s"] - a["e"], 2)} for a, b in zip(words, words[1:]) if b["s"] - a["e"] >= 0.7]
    speak = max(1e-6, words[-1]["e"] - words[0]["s"])
    return {"words": len(words), "wpm": round(len(words) / (speak / 60), 1), "first_word_s": words[0]["s"], "last_word_s": words[-1]["e"],
            "pauses": pauses[:80], "pause_count": len(pauses)}


def make_shots(fa: dict, D: float, cfg) -> list[dict]:
    fps = fa["fps"]
    bounds = sorted({round(i / fps, 2): ("hard" if i in fa["hard"] else "gradual") for i in fa["hard"] + fa["gradual"]}.items())
    cuts, kinds = [0.0], ["first"]
    for t, k in bounds:
        if t - cuts[-1] >= cfg["prepare"]["min_shot_s"] and D - t >= cfg["prepare"]["min_shot_s"]:
            cuts.append(t); kinds.append(k)
    cuts.append(D)
    shots = []
    for i in range(len(cuts) - 1):
        a, b = cuts[i], cuts[i + 1]
        parts = max(1, int(math.ceil((b - a) / cfg["media"]["max_shot_s"])))
        for j in range(parts):
            pa, pb = a + (b - a) * j / parts, a + (b - a) * (j + 1) / parts
            sid = f"s{i + 1:03d}" + (chr(97 + j) if parts > 1 else "")
            shots.append({"id": sid, "t0": round(pa, 2), "t1": round(pb, 2), "len": round(pb - pa, 2),
                          "cut_in": kinds[i] if j == 0 else "continued", "parent": f"s{i + 1:03d}"})
    return shots


def shot_motion(fa: dict, t0: float, t1: float) -> dict:
    fps = fa["fps"]
    seg = fa["change"][int(t0 * fps): max(int(t0 * fps) + 1, int(t1 * fps) - 1)]
    if not seg:
        return {"mean": 0, "max": 0, "per_second": [], "still_s": 0}
    per_s = [round(max(seg[int(s * fps): int((s + 1) * fps)] or [0]), 3) for s in range(int(math.ceil(t1 - t0)))]
    still = sum(1 for x in per_s if x < 0.01)
    return {"mean": round(sum(seg) / len(seg), 4), "max": round(max(seg), 3), "per_second": per_s, "still_s": still}


# ------------------------------------------------------------------ measures v2 (D-113): fixes from the full read of the TED-Ed run
MEASURE_VERSION = 2


def classify_moves(events: list[dict]) -> list[dict]:
    """Label each full-rate movement (L-212: "linear moves are jitter" was wrong as a blanket rule; 35 % of the short
    linear events in the TED-Ed run sat in regular runs).
    - move: an eased movement (ease_out, ease_in, ease_in_out);
    - pan: a linear movement of 0.5 s or more (a constant-speed pan, scroll or walk);
    - swap: a short linear event with a high peak (an instant change the cut detector did not split);
    - boil: one of a regular run (4+ events, near-constant spacing of 0.2 s or less: drawings or texture on fours/threes);
    - cycle: one of a regular run with longer spacing (a looped action);
    - jitter: what is left (grain, compression); never narrate it."""
    out = [dict(e) for e in events]
    short = [i for i, e in enumerate(out) if e.get("shape") == "linear" and e.get("dur", 0) < 0.5]
    in_run = {}
    ts = [out[i]["t"] for i in short]
    k = 0
    while k < len(short) - 1:
        gap = round(ts[k + 1] - ts[k], 3)
        j = k + 1
        while j + 1 < len(short) and abs((ts[j + 1] - ts[j]) - gap) <= 0.03:
            j += 1
        if j - k + 1 >= 4:
            for x in range(k, j + 1):
                in_run[short[x]] = gap
            k = j
        else:
            k += 1
    for i, e in enumerate(out):
        if e.get("shape") != "linear":
            e["kind"] = "move"
        elif e.get("dur", 0) >= 0.5:
            e["kind"] = "pan"
        elif i in in_run:
            e["kind"] = "boil" if in_run[i] <= 0.2 else "cycle"
            e["spacing_s"] = in_run[i]
        elif e.get("peak", 0) >= 2.0:
            e["kind"] = "swap"
        else:
            e["kind"] = "jitter"
    return out


def longest_run(per_s: list, thr: float = 0.01) -> int:
    best = cur = 0
    for x in per_s:
        cur = cur + 1 if x < thr else 0
        best = max(best, cur)
    return best


def hex_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def palette_distance(pa: list[dict], pb: list[dict]) -> float | None:
    """How different two shots' colours are (0 = the same palette; hard cuts in the TED-Ed run measured about 55 to 64,
    continuations about 6 to 12). Share-weighted nearest-colour distance in RGB, averaged both ways."""
    if not pa or not pb:
        return None
    def one(a, b):
        tot = sum(c["share"] for c in a) or 1
        return sum(c["share"] * min(math.dist(hex_rgb(c["hex"]), hex_rgb(d["hex"])) for d in b) for c in a) / tot
    return round((one(pa, pb) + one(pb, pa)) / 2, 1)


def parent_shots(shots: list[dict]) -> list[dict]:
    """The real shots: sub-shots (the 20 s split for the shot pass) folded back into their parent."""
    out = []
    for s in shots:
        if out and s.get("parent") == out[-1]["id"] and s.get("cut_in") == "continued":
            out[-1]["t1"] = s["t1"]; out[-1]["len"] = round(out[-1]["t1"] - out[-1]["t0"], 2)
        else:
            out.append({"id": s.get("parent") or s["id"], "t0": s["t0"], "t1": s["t1"], "len": s["len"], "cut_in": s.get("cut_in")})
    return out


def clean_words(words: list[dict], max_per_s: float) -> tuple[list[dict], int]:
    """Drop Whisper hallucinations: zero-length words and runs packed tighter than `max_per_s` words a second
    (L-212: one film had 202 words in 1.3 s)."""
    keep = [w for w in words if w.get("e", 0) - w.get("s", 0) >= 0.01]
    bad = set()
    j = 0
    for i, w in enumerate(keep):
        while keep[j]["s"] < w["s"] - 1.0:
            j += 1
        if i - j + 1 > max_per_s:
            bad.update(range(j, i + 1))
    out = [w for i, w in enumerate(keep) if i not in bad]
    return out, len(words) - len(out)


def chroma_stats(paths: list[Path]) -> dict:
    """Over the shot's stills: the share of vivid pixels and the saturated hue families, with small ones listed as
    accents (L-212: `saturation` alone read 0.0 on a frame that was 17 % pure red; accents under ~2 % fall below the
    6-colour palette)."""
    import numpy as np
    from PIL import Image
    hs, vivid_n, tot = [], 0, 0
    for p in paths:
        im = Image.open(p).convert("RGB").resize((240, 135))
        a = np.asarray(im).astype(np.float32)
        mx, mn = a.max(2), a.min(2)
        sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
        vv = (sat > 0.5) & (mx > 90)
        hsv = np.asarray(im.convert("HSV")).astype(np.float32)
        hs.append(hsv[..., 0][vv] / 256.0)
        vivid_n += int(vv.sum()); tot += vv.size
    allh = np.concatenate(hs) if hs else np.array([])
    h, _ = np.histogram(allh, bins=12, range=(0, 1))
    fams = [{"hue_deg": int(i * 30 + 15), "share": round(float(c) / max(1, tot), 4)} for i, c in enumerate(h) if c / max(1, tot) >= 0.003]
    return {"vivid_share": round(vivid_n / max(1, tot), 4), "hue_families": len([f for f in fams if f["share"] >= 0.015]),
            "accents": [f for f in fams if 0.003 <= f["share"] < 0.15]}


def look_over(paths: list[Path]) -> dict:
    """`look` over all three stills (L-212: it was measured on the middle still only)."""
    ls = [still_stats(p) for p in paths]
    return {k: round(sum(x[k] for x in ls) / len(ls), 4) for k in ("brightness", "saturation", "detail")} | {"per_still": ls}


def sync_by_code(shot: dict, words: list[dict]) -> dict:
    """Word-to-picture timing measured by code: for each real movement start in the shot (not jitter or boil), the
    gap to the nearest word start (negative = picture first). The model's own `sync_offset_s` was 0.0 on 6,116 of
    6,307 shots: a default, not a measurement (L-212)."""
    starts = [shot["t0"] + e["t"] for e in shot.get("moves", {}).get("events", []) if e.get("kind") in ("move", "pan", "swap")]
    ws = [w["s"] for w in words if shot["t0"] - 1 <= w["s"] <= shot["t1"] + 1]
    if not starts or not ws:
        return {"events": len(starts), "median_offset_s": None}
    offs = sorted(min((s - w for w in ws), key=abs) for s in starts)
    return {"events": len(starts), "median_offset_s": round(offs[len(offs) // 2], 2)}


def derive_measures(m: dict, cfg: dict | None = None, words: list | None = None, shot_dirs: Path | None = None) -> dict:
    """Upgrade a measure record to v2 in place, from what it already holds (works on the pod and on a bundle):
    pacing over real shots, longest still runs, classified moves, palette distance at every boundary, and, where the
    stills and words are at hand, look over three stills, chroma and code-measured sync."""
    shots = m.get("shots") or []
    D = (m.get("probe") or {}).get("duration") or (shots[-1]["t1"] if shots else 0)
    for i, s in enumerate(shots):
        s.setdefault("motion", {})["longest_still_run_s"] = longest_run(s["motion"].get("per_second") or [])
        mv = s.setdefault("moves", {"events": []})
        mv["events"] = classify_moves(mv.get("events") or [])
        mv.setdefault("events_total", len(mv["events"]))
        if i:
            s["palette_delta_in"] = palette_distance(shots[i - 1].get("palette") or [], s.get("palette") or [])
            # a "gradual cut" across which the colours barely change is a continuation (an overlay, a move), not a join
            s["continuation_likely"] = bool(s.get("cut_in") == "gradual" and s["palette_delta_in"] is not None and s["palette_delta_in"] < 15)
        sd = shot_dirs / s["id"] if shot_dirs else None
        if sd and all((sd / f"k{n}.jpg").exists() for n in range(3)):
            st = [sd / f"k{n}.jpg" for n in range(3)]
            s["look"] = look_over(st)
            s["chroma"] = chroma_stats(st)
        if words is not None:
            s["sync_code"] = sync_by_code(s, words)
    par = parent_shots(shots)
    joins = [p for p in par[1:]]
    real_joins = [p for p in joins if not (p.get("cut_in") == "gradual" and next((s for s in shots if s["id"] == p["id"] or s.get("parent") == p["id"]), {}).get("continuation_likely"))]
    lens = sorted(p["len"] for p in par) or [0]
    cuts = m.setdefault("cuts", {})
    cuts.setdefault("hard_raw", cuts.get("hard")); cuts.setdefault("gradual_raw", cuts.get("gradual"))
    cuts.update({"hard": sum(1 for p in joins if p.get("cut_in") == "hard"), "gradual": sum(1 for p in joins if p.get("cut_in") == "gradual"),
                 "per_minute": round(len(joins) / max(1e-6, D / 60), 2), "real_joins_per_minute": round(len(real_joins) / max(1e-6, D / 60), 2),
                 "records_per_minute": round((len(shots) - 1) / max(1e-6, D / 60), 2),
                 "_note": "per_minute counts real shots (sub-shot splits folded back); hard_raw/gradual_raw are detector counts before cuts under min_shot_s were merged; real_joins_per_minute also drops gradual 'cuts' with no colour change (D-113)"})
    m["shot_len"] = {"median": lens[len(lens) // 2], "p25": lens[len(lens) // 4], "p75": lens[3 * len(lens) // 4], "max": lens[-1], "n": len(par),
                     "_note": "over real shots; sub-shots are only for the shot pass (D-113)"}
    per_s = m.get("motion_per_second") or []
    m["longest_still_s"] = longest_run(per_s)
    if m.get("holds") is not None:
        m["holds_top"] = sorted(m["holds"], key=lambda h: -h["s"])[:10]
    m["move_kinds"] = dict(Counter(e["kind"] for s in shots for e in s["moves"]["events"]))
    if "black_seconds" in m:
        m["dark_seconds"] = m.pop("black_seconds")     # it counts dark CONTENT (luminance under 12), not black frames
    m["measure_version"] = MEASURE_VERSION
    return m


def prepare_one(v: dict, cfg, P: Paths) -> str:
    vid, src = v["id"], Path(v["file"])
    d = P.vprep(vid)
    done = d / "measure.json"
    want_words = bool(cfg["prepare"].get("whisper_model")) or bool(v.get("srt"))
    if done.exists():
        old = rj(done, {})
        if old and old.get("measure_version", 1) < MEASURE_VERSION and not (want_words and old.get("words_source") == "none"):
            # upgrade a v1 record in place from what is on disk: no new decoding, no Whisper (D-113)
            derive_measures(old, cfg, rj(d / "words.json", {}).get("words", []), d / "shots")
            wj(done, old)
        if not (want_words and rj(done, {}).get("words_source") == "none"):
            if not lowres_ok(d / "lowres.mp4", cfg):
                make_lowres(src, d / "lowres.mp4", cfg)
                return f"{vid}: already prepared; whole-film video remade at {cfg['media']['video_fps']} fps"
            return f"{vid}: already prepared"
        done.unlink()                                          # prepared without words while words were wanted: redo
    d.mkdir(parents=True, exist_ok=True)
    pr = probe(src)
    D = pr["duration"]
    VD = pr.get("video_duration") or D
    fa = analyse_frames(src, cfg["prepare"]["analysis_fps"])
    shots = make_shots(fa, VD, cfg)
    wav = d / "audio.wav"                                       # 16 kHz mono: Whisper reads it, and the ears pass (stays on the pod)
    if not wav.exists():
        run([ff(), "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav])
    words = whisper_words(wav, cfg)
    wsrc = "whisper"
    if words is None and v.get("srt"):
        words, wsrc = srt_words(Path(v["srt"])), "srt_approx"
    if words is None:
        if want_words:
            # a film without words cannot be linked to its narration: fail loudly rather than study it half-blind
            raise RuntimeError("no words: Whisper failed (see the line above) and there is no .srt")
        words, wsrc = [], "none"
    words, dropped = clean_words(words, float(cfg["prepare"].get("max_words_per_s") or 7))
    wj(d / "words.json", {"source": wsrc, "words": words, "dropped_as_hallucinated": dropped})       # stays on the pod: never packed
    k = cfg["prepare"]["palette_colours"]
    fc = flow_curve(src)
    wj(d / "flow.json", fc)                                   # per-frame curves stay on the pod; summaries are exported
    for s in shots:
        sd = d / "shots" / s["id"]
        sd.mkdir(parents=True, exist_ok=True)
        ts = [s["t0"] + min(0.15, s["len"] / 4), (s["t0"] + s["t1"]) / 2, s["t1"] - min(0.15, s["len"] / 4)]
        stills = []
        for n, t in enumerate(ts):
            p = sd / f"k{n}.jpg"
            if not p.exists():
                extract_still(src, t, p, cfg["media"]["keyframe_width"], VD)
            stills.append(p)
        if not (sd / "clip.mp4").exists():
            extract_clip(src, s["t0"], s["t1"], sd / "clip.mp4", cfg["media"]["shot_clip_height"])
        s["stills_t"] = [round(t - s["t0"], 2) for t in ts]
        s["palette"] = palette(stills, k)
        s["look"] = still_stats(stills[1])
        s["motion"] = shot_motion(fa, s["t0"], s["t1"])
        s["moves"] = motion_events_full(fc, s["t0"], s["t1"])
        s["words_n"] = sum(1 for w in words if s["t0"] <= w["s"] < s["t1"])
    lowres = d / "lowres.mp4"
    if not lowres_ok(lowres, cfg):          # also rebuilds a lowres made before L-201 at the source frame rate
        make_lowres(src, lowres, cfg)
    per_s = [round(max(fa["change"][int(t * fa['fps']): int((t + 1) * fa['fps'])] or [0]), 3) for t in range(int(D))]
    holds, run_ = [], 0
    for t, c in enumerate(per_s + [1.0]):
        if c < 0.01:
            run_ += 1
        else:
            if run_ >= 2:
                holds.append({"t": t - run_, "s": run_})
            run_ = 0
    db = audio_db(src)
    ons = audio_onsets(src)
    ev_starts = [s["t0"] + e["t"] for s in shots for e in s["moves"]["events"]]
    snd = sound_stats(ons, words, [s["t0"] for s in shots[1:] if s["cut_in"] == "hard"], ev_starts, D)
    wj(d / "onsets.json", ons)
    lens = sorted(s["len"] for s in shots)
    black = [round(i / fa["fps"], 2) for i, l in enumerate(fa["lum"]) if l < 12]
    m = {
        "video_id": vid, "title": v.get("title"), "year": v.get("year"), "probe": pr, "words_source": wsrc,
        "cuts": {"hard": len(fa["hard"]), "gradual": len(fa["gradual"]), "per_minute": round((len(shots) - 1) / (D / 60), 2)},
        "shot_len": {"median": lens[len(lens) // 2], "p25": lens[len(lens) // 4], "p75": lens[3 * len(lens) // 4], "max": lens[-1], "n": len(shots)},
        "motion_per_second": per_s, "motion_share": round(sum(1 for x in per_s if x >= 0.01) / max(1, len(per_s)), 3),
        "holds": holds, "black_seconds": len(black) / fa["fps"],
        "audio_db_per_half_s": db, "speech": speech_stats(words, D), "sound": snd,
        "smoothness": {"flashes": len(fc["flashes"]), "jerk_spikes": sum(s["moves"]["jerk_spikes"] for s in shots),
                       "move_shapes": dict(Counter(e["shape"] for s in shots for e in s["moves"]["events"]))},
        "shots": shots, "words_dropped": dropped,
    }
    derive_measures(m, cfg, words, d / "shots")
    wj(done, m)
    return f"{vid}: {len(shots)} shots, words from {wsrc}"


def cmd_prepare(cfg, P, args):
    vids = selection(P, args.only)
    if args.limit:
        vids = vids[: args.limit]
    # whisper is one GPU model: run its videos one at a time; ffmpeg work is parallel inside a video
    run_pool(cfg, "prepare", lambda v: prepare_one(v, cfg, P), vids, args.workers or 2)
    bad = [v["id"] for v in vids if not (P.vprep(v["id"]) / "measure.json").exists()]
    if bad:
        log(f"prepare: {len(bad)} films not prepared: {bad[:10]}")
        return 1


def _safe(fn, *a):
    try:
        return fn(*a)
    except Exception as e:  # noqa: BLE001
        return f"FAILED {a[0].get('id') if isinstance(a[0], dict) else a[0]}: {str(e)[:300]}"


# ------------------------------------------------------------------ level 1: shots
def words_in(words: list[dict], t0: float, t1: float) -> str:
    ws = [w for w in words if t0 <= w["s"] < t1]
    return " ".join(f"[{w['s'] - t0:.1f}] {w['w']}" for w in ws) or "(no speech)"


def shots_to_annotate(m: dict, cfg) -> list[dict]:
    """Every shot, or an even sample of `media.max_shots_per_film` (first and last kept) when the run must be shorter.
    The sample is deterministic, so a re-run picks the same shots, and every later step expects exactly these (L-206)."""
    shots = m.get("shots", [])
    cap = (cfg.get("media") or {}).get("max_shots_per_film")
    if not cap or len(shots) <= int(cap):
        return shots
    cap = int(cap)
    idx = sorted({round(i * (len(shots) - 1) / (cap - 1)) for i in range(cap)})
    return [shots[i] for i in idx]


def shot_context(m: dict, s: dict, prev_idea: str | None, words: list, n: int, i: int) -> str:
    """The shot's measured facts, as FACTS (D-113). The run handed the model the raw move list as prose; it copied 81 %
    of its event times from it and narrated jitter as action (L-212). Now: jitter and boil are named as texture and
    left out of the event list, each real movement has an id the answer can point to, and the sub-shot split and a
    colour-free "gradual cut" are said to be what they are."""
    pal = ", ".join(f"{c['hex']} {int(c['share'] * 100)}%" for c in s["palette"])
    look = s.get("look") or {}
    evs = [e for e in (s.get("moves") or {}).get("events", [])]
    real = [e for e in evs if e.get("kind", "move") in ("move", "pan", "swap", "cycle")]
    tex = Counter(e.get("kind") for e in evs if e.get("kind") in ("boil", "jitter"))
    ids = [{"id": f"m{k + 1}", "t": e["t"], "dur": e["dur"], "kind": e.get("kind", "move"), "shape": e.get("shape"), "peak": e.get("peak")}
           for k, e in enumerate(real)]
    join = s["cut_in"]
    if join == "continued":
        join = "none: this is the next part of the same shot, split only for this pass (not a join; set transition_in to none_continuous)"
    elif s.get("continuation_likely"):
        join = "gradual, but the colours barely change across it: likely the same picture continuing (an overlay or a move), not a scene change"
    lr = (s.get("motion") or {}).get("longest_still_run_s", (s.get("motion") or {}).get("still_s"))
    return (f"VIDEO {m['video_id']} ({m['probe']['width']}x{m['probe']['height']}, {m['probe']['duration']:.0f} s). "
            f"SHOT {s['id']} ({i + 1} of {n}), video time {s['t0']:.2f} to {s['t1']:.2f} s, length {s['len']:.2f} s.\n"
            f"Previous shot: {prev_idea or 'none (this is the first shot of the film)'}\n"
            f"MEASURED BY CODE (facts; use them, never restate them as something you saw):\n"
            f"- join into this shot: {join}\n"
            f"- motion share per second (fraction of pixels changing): {s['motion']['per_second']}; longest still stretch {lr} s\n"
            f"- palette: {pal}; brightness {look.get('brightness')}, saturation {look.get('saturation')}, detail {look.get('detail')}\n"
            f"- real movements at full frame rate (t and dur in s from the shot start): {json.dumps(ids)}\n"
            f"- texture, not events (do not list these as motion events): {dict(tex) or 'none'}\n"
            f"Stills attached at {s['stills_t']} s from the shot start (start, middle, end), then the clip.\n"
            f"Words spoken (seconds from shot start): {words_in(words, s['t0'], s['t1'])}\n"
            f"Return the `shot` JSON for shot_id \"{s['id']}\". For each motion event set `source`: \"code\" with `code_event` = the id "
            f"(m1, m2, ...) when it is one of the real movements above, or \"seen\" with `code_event` \"\" when you see it in the clip "
            f"and no id matches. Never invent a time for something you did not see.")


def annotate_video_shots(v: dict, cfg, P: Paths, cl: Client, out_dir: Path, sample: set | None = None, temperature=None, seed=None) -> str:
    vid = v["id"]
    d = P.vprep(vid)
    m = rj(d / "measure.json", {})
    if not m:
        return f"{vid}: not prepared"
    words = rj(d / "words.json", {}).get("words", [])
    system = skill_text("10_shot_annotator.md", "loom_capabilities.md")
    done, failed = 0, 0
    keep = {s["id"] for s in shots_to_annotate(m, cfg)}
    main = P.out / "shots" / vid

    def prev_idea(i: int) -> str | None:
        # the TRUE previous shot (L-212: a sampled re-run passed the previous SAMPLED shot, so 12 to 15 mid-film shots
        # per part were called the first shot and joins were written against the wrong picture)
        if i == 0:
            return None
        ps = m["shots"][i - 1]["id"]
        for base in (out_dir / vid, main):
            r = rj(base / f"{ps}.json", {})
            if r.get("visual_idea"):
                return r["visual_idea"]
        return f"(not annotated yet; shot {ps}, {m['shots'][i - 1]['t0']:.1f} to {m['shots'][i - 1]['t1']:.1f} s)"
    for i, s in enumerate(m["shots"]):
        if s["id"] not in keep:
            continue
        outp = out_dir / vid / f"{s['id']}.json"
        if sample is not None and f"{vid}/{s['id']}" not in sample:
            continue
        if outp.exists():
            continue
        sd = d / "shots" / s["id"]
        content = [Client.text(shot_context(m, s, prev_idea(i), words, len(m["shots"]), i))]
        content += [cl.media("image", sd / f"k{n}.jpg") for n in range(3)]
        if cfg["media"]["shot_video"] == "clip":
            content.append(cl.media("video", sd / "clip.mp4"))
        try:
            obj = cl.call("shots", system, content, "shot", key=f"{vid}_{s['id']}", fps=cfg["media"]["shot_fps"], temperature=temperature, seed=seed)
            obj["shot_id"] = s["id"]
            obj["_t0"], obj["_t1"] = s["t0"], s["t1"]
            wj(outp, obj)
            done += 1
        except Exception as e:  # noqa: BLE001
            failed += 1
            log(f"shots {vid}/{s['id']} FAILED: {str(e)[:200]}")
    return f"{vid}: {done} new shot records, {failed} failed"


class Progress:
    """A line per finished item, in completion order, and a summary at least every `progress_every_s` (L-213: lines
    printed in submission order left the log silent for up to 2 hours while work was finishing)."""
    def __init__(self, cfg: dict, label: str, total: int):
        self.label, self.total, self.done, self.t0 = label, total, 0, time.time()
        self.every = float(cfg["server"].get("progress_every_s", 300)); self.last = self.t0
        self.lock = threading.Lock()
        log(f"{label}: {total} to do")

    def tick(self, msg: str):
        with self.lock:
            self.done += 1
            log(self.label, msg)
            now = time.time()
            if now - self.last >= self.every or self.done == self.total:
                el = now - self.t0
                eta = el / self.done * (self.total - self.done) if self.done else 0
                log(f"{self.label} progress: {self.done}/{self.total} in {el / 60:.0f} min; about {eta / 60:.0f} min left (estimate)")
                self.last = now


def run_pool(cfg: dict, label: str, fn, items: list, workers: int) -> list:
    """Run fn over items in parallel and log in COMPLETION order."""
    pr = Progress(cfg, label, len(items))
    out = []
    with cf.ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        futs = [ex.submit(_safe, fn, it) for it in items]
        for f in cf.as_completed(futs):
            r = f.result(); out.append(r); pr.tick(str(r))
    return out


def cmd_shots(cfg, P, args, which="a", out_sub="shots", sample=None, temperature=None, seed=None, base_url=None):
    vids = selection(P, args.only)
    cl = Client(cfg, P, which, base_url)
    if out_sub != "shots":
        cl.raw_dir = out_sub                 # the re-run's raw records never overwrite the original calls (L-212)
    out_dir = P.out / out_sub
    with phase_lock(P, out_sub):
        run_pool(cfg, out_sub, lambda v: annotate_video_shots(v, cfg, P, cl, out_dir, sample, temperature, seed), vids, cfg["server"]["workers"])
    cl.save_usage(out_sub)


# ------------------------------------------------------------------ level 2: videos
CONDENSE_SHOT = ["shot_id", "_t0", "_t1", "visual_idea"]


def condense_shot(o: dict) -> dict:
    return {
        "id": o.get("shot_id"), "t": [o.get("_t0"), o.get("_t1")], "join": (o.get("transition_in") or {}).get("type"),
        "size": (o.get("frame") or {}).get("shot_size"), "technique": (o.get("style") or {}).get("technique"),
        "camera": (o.get("camera") or {}).get("move"), "function": (o.get("teaching") or {}).get("function"),
        "relation": (o.get("narration_link") or {}).get("relation"), "sync": (o.get("narration_link") or {}).get("sync"),
        "gist": (o.get("narration_link") or {}).get("gist"), "idea": o.get("visual_idea"), "craft": o.get("craft"),
        "motion": [e.get("type") for e in (o.get("motion_events") or [])], "chars": (o.get("characters") or {}).get("count"),
        "text": [[t.get("kind"), t.get("height_frac")] for t in (o.get("text_on_screen") or [])],
    }


def load_shots(P: Paths, vid: str, sub="shots") -> list[dict]:
    return [rj(p) for p in sorted((P.out / sub / vid).glob("*.json"))]


def analyse_video(v: dict, cfg, P: Paths, cl: Client) -> str:
    vid = v["id"]
    outp = P.out / "videos" / f"{vid}.json"
    if outp.exists():
        return f"{vid}: done"
    m = rj(P.vprep(vid) / "measure.json", {})
    shots = load_shots(P, vid)
    if not m or len(shots) < len(shots_to_annotate(m, cfg)):
        return f"{vid}: waiting for shots ({len(shots)}/{len(m.get('shots', []))})"
    summ = {k: m.get(k) for k in ("cuts", "shot_len", "motion_share", "longest_still_s", "holds_top", "speech", "dark_seconds", "move_kinds")}
    summ["speech"] = {k: v2 for k, v2 in m["speech"].items() if k != "pauses"}
    text = (f"VIDEO {vid}, {m['probe']['duration']:.1f} s. Code measurements: {json.dumps(summ)}\n"
            f"Motion share per second: {m['motion_per_second']}\n"
            f"SHOT RECORDS (condensed, {len(shots)}): {json.dumps([condense_shot(s) for s in shots], ensure_ascii=False)}\n"
            f"The whole video is attached at about {cfg['media']['video_fps']} frame per second. Return the `video` JSON for video_id \"{vid}\".")
    content = [Client.text(text), cl.media("video", P.vprep(vid) / "lowres.mp4")]
    obj = cl.call("videos", skill_text("20_video_analyst.md", "loom_capabilities.md"), content, "video", key=vid, fps=cfg["media"]["video_fps"])
    obj["video_id"] = vid
    wj(outp, obj)
    return f"{vid}: video record written"


def cmd_videos(cfg, P, args):
    cl = Client(cfg, P, "a")
    # whole-film calls run `server.video_workers` at a time; the admission gate keeps them inside the KV cache (L-213)
    with phase_lock(P, "videos"):
        run_pool(cfg, "videos", lambda v: analyse_video(v, cfg, P, cl), selection(P, args.only),
                 int(cfg["server"].get("video_workers") or cfg["server"]["workers"] // 3))
    cl.save_usage("videos")


# ------------------------------------------------------------------ the ears: soundtrack per video (model C)
def listen_video(v: dict, cfg, P: Paths, cl: Client) -> str:
    vid = v["id"]
    outp = P.out / "sound" / f"{vid}.json"
    if outp.exists():
        return f"{vid}: done"
    d = P.vprep(vid)
    m = rj(d / "measure.json", {})
    if not m:
        return f"{vid}: not prepared"
    cuts = [s["t0"] for s in m["shots"] if s["cut_in"] == "hard"]
    sp = {k: v2 for k, v2 in m["speech"].items() if k != "pauses"}
    text = (f"VIDEO {vid}, {m['probe']['duration']:.1f} s. Code sound measurements: {json.dumps(m.get('sound'))}\n"
            f"Hard cuts at (s): {cuts}\nSpeech: {json.dumps(sp)}; pauses (t, s): {[(p['t'], p['s']) for p in m['speech'].get('pauses', [])][:40]}\n"
            f"The soundtrack and the video (about {cfg['media']['video_fps']} frame per second) are attached. Return the `sound` JSON for video_id \"{vid}\".")
    content = [Client.text(text), cl.media("audio", d / "audio.wav"), cl.media("video", d / "lowres.mp4")]
    obj = cl.call("sound", skill_text("25_sound_listener.md", "loom_capabilities.md"), content, "sound", key=f"sound_{vid}", fps=cfg["media"]["video_fps"])
    obj["video_id"] = vid
    wj(outp, obj)
    return f"{vid}: sound record written"


def cmd_sound(cfg, P, args):
    cl = Client(cfg, P, "c", getattr(args, "base_url", None))
    with phase_lock(P, "sound"):
        run_pool(cfg, "sound", lambda v: listen_video(v, cfg, P, cl), selection(P, args.only), max(1, cfg["server"]["workers"] // 2))
    cl.save_usage("sound")


# ------------------------------------------------------------------ level 3: statistics (code) and style guide (model)
def pct(xs, q):
    xs = sorted(xs)
    return round(xs[min(len(xs) - 1, int(q * len(xs)))], 3) if xs else None


def corpus_stats(P: Paths, vids: list[str]) -> dict:
    """Every count and distribution the style guide may cite, computed from the records (never by the model)."""
    tables = defaultdict(Counter)
    per_video = defaultdict(lambda: defaultdict(set))
    nums = defaultdict(list)
    for vid in vids:
        m = rj(P.vprep(vid) / "measure.json", {})
        if m:
            nums["cuts_per_minute"].append(m["cuts"]["per_minute"]); nums["shot_len_median"].append(m["shot_len"]["median"])
            nums["motion_share"].append(m["motion_share"]); nums["wpm"].append(m["speech"].get("wpm", 0))
            nums["longest_hold_s"].append(max([h["s"] for h in m["holds"]] or [0]))
            nums["duration_s"].append(m["probe"]["duration"])
            snd = m.get("sound") or {}
            for k2 in ("hits_per_min", "nonspeech_hits_per_min", "cuts_on_hit_share", "moves_on_hit_share"):
                if isinstance(snd.get(k2), (int, float)):
                    nums[f"sound:{k2}"].append(snd[k2])
            if isinstance(snd.get("speech_db_median"), (int, float)) and isinstance(snd.get("between_words_db_median"), (int, float)):
                nums["sound:bed_below_speech_db"].append(snd["speech_db_median"] - snd["between_words_db_median"])
            for s in m["shots"]:
                for e in (s.get("moves") or {}).get("events", []):
                    tables["move_shape"][e["shape"]] += 1
                    nums[f"move_dur:{e['shape']}"].append(e["dur"]); nums["move_peak_at"].append(e["peak_at"])
            for s in m["shots"]:
                nums["shot_len_all"].append(s["len"])
        for o in load_shots(P, vid):
            f = {
                "join": (o.get("transition_in") or {}).get("type"), "shot_size": (o.get("frame") or {}).get("shot_size"),
                "composition": (o.get("frame") or {}).get("composition"), "technique": (o.get("style") or {}).get("technique"),
                "outline": (o.get("style") or {}).get("outline"), "shading": (o.get("style") or {}).get("shading"),
                "texture": (o.get("style") or {}).get("texture"), "background": (o.get("style") or {}).get("background"),
                "camera": (o.get("camera") or {}).get("move"), "function": (o.get("teaching") or {}).get("function"),
                "relation": (o.get("narration_link") or {}).get("relation"), "sync": (o.get("narration_link") or {}).get("sync"),
                "focal_cue": (o.get("frame") or {}).get("focal_cue"), "negative_space": (o.get("frame") or {}).get("negative_space"),
            }
            for k, val in f.items():
                if val:
                    tables[k][val] += 1; per_video[k][val].add(vid)
            for e in o.get("motion_events") or []:
                tables["motion_type"][e.get("type")] += 1; per_video["motion_type"][e.get("type")].add(vid)
                tables["motion_meaning"][e.get("meaning")] += 1
                if isinstance(e.get("dur"), (int, float)):
                    nums[f"motion_dur:{e.get('type')}"].append(e["dur"])
            for t in o.get("text_on_screen") or []:
                tables["text_kind"][t.get("kind")] += 1
                if isinstance(t.get("height_frac"), (int, float)):
                    nums[f"text_height:{t.get('kind')}"].append(t["height_frac"])
            nl = o.get("narration_link") or {}
            if isinstance(nl.get("sync_offset_s"), (int, float)) and nl.get("sync") not in ("no_speech", "unrelated"):
                nums["sync_offset_s"].append(nl["sync_offset_s"])
            ch = o.get("characters") or {}
            nums["characters_per_shot"].append(ch.get("count") or 0)
            fr = o.get("frame") or {}
            if isinstance(fr.get("element_count"), int):
                nums["elements_per_shot"].append(fr["element_count"])
            if isinstance(fr.get("depth_layers"), int):
                nums["depth_layers"].append(fr["depth_layers"])
    out = {"videos": len(vids), "shots": sum(tables["join"].values()),
           "tables": {k: dict(c.most_common()) for k, c in tables.items()},
           "videos_using": {k: {val: len(s) for val, s in d.items()} for k, d in per_video.items()},
           "numbers": {k: {"n": len(v), "p10": pct(v, .1), "p25": pct(v, .25), "median": pct(v, .5), "p75": pct(v, .75), "p90": pct(v, .9)}
                       for k, v in sorted(nums.items()) if v}}
    return out


def cmd_synthesize(cfg, P, args):
    vids = [v["id"] for v in selection(P, args.only) if (P.out / "videos" / f"{v['id']}.json").exists()]
    if not vids:
        sys.exit("no video records yet: run `python vl.py videos` first (a zero is not a result)")
    stats = corpus_stats(P, vids)
    wj(P.out / "stats.json", stats)
    log(f"synthesize: stats over {stats['videos']} videos, {stats['shots']} shots")
    cl = Client(cfg, P, "a")
    system = skill_text("30_style_distiller.md", "loom_capabilities.md")
    budget = synth_budget(cfg, system)
    J = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))

    # one record per film; a film too big for the budget on its own keeps fewer craft notes, then fewer shots (counted)
    recs, shrunk = {}, []
    for vid in vids:
        base = {"video": rj(P.out / "videos" / f"{vid}.json"), "sound": rj(P.out / "sound" / f"{vid}.json", {}) or None}
        shots = [condense_shot(s) for s in load_shots(P, vid)]
        r = {**base, "shots": shots}
        if est_tokens(J(r)) > budget // 2:
            r = {**base, "shots": [{**s, "craft": (s.get("craft") or [])[:1]} for s in shots]}
            while len(r["shots"]) > 10 and est_tokens(J(r)) > budget // 2:
                r["shots"] = r["shots"][::2]
            shrunk.append(vid)
        recs[vid] = r
    if shrunk:
        log(f"synthesize: {len(shrunk)} films shortened to fit (craft notes cut to 1, then every other shot): {shrunk}")
    # batches packed by measured size, not by a fixed count: ten films were 3x the context on the pod (L-209)
    groups = pack_by_budget([est_tokens(J(recs[v])) for v in vids], budget - 3000, cap=int(args.batch or 10))
    batches = [[vids[i] for i in g] for g in groups]
    log(f"synthesize: {len(batches)} batches (input budget {budget} tokens each, sizes {[len(b) for b in batches]})")

    def one(bi_b):
        bi, b = bi_b
        outp = P.out / "batches" / f"batch_{bi + 1:02d}.json"
        if outp.exists() and (rj(outp, {}) or {}).get("videos") == b:
            return f"batch {bi + 1}: done"
        # a batch file from an earlier run over a different set (the 5-film pilot) is redone, never reused (L-203)
        text = (f"SCOPE: batch of {len(b)} videos: {b}\nBATCH STATISTICS (code): {J(corpus_stats(P, b))}\n"
                f"RECORDS: {J([recs[v] for v in b])}\nReturn the `style_guide` JSON with scope \"batch\".")
        obj = cl.call("synthesize", system, [Client.text(text)], "style_guide", key=f"batch_{bi + 1:02d}")
        obj["scope"], obj["videos"] = "batch", b
        wj(outp, obj)
        return f"batch {bi + 1}: written"
    workers = int(cfg["server"].get("synth_workers") or max(1, cfg["server"]["workers"] // 2))
    with phase_lock(P, "synthesize"):
        run_pool(cfg, "synthesize", one, list(enumerate(batches)), workers)
    guides = [rj(P.out / "batches" / f"batch_{bi + 1:02d}.json", {}) or {} for bi in range(len(batches))]
    good = [g for g, b in zip(guides, batches) if g.get("videos") == b]
    if len(good) < len(batches):
        sys.exit(f"only {len(good)} of {len(batches)} batch guides match this run's films: re-run synthesize")
    obj = merge_guides(cl, system, good, stats, vids, P, budget, workers)
    obj["scope"], obj["videos"] = "corpus", vids
    wj(P.out / "style_guide.json", obj)
    (P.out / "style_guide.md").write_text(render_guide_md(obj, stats), encoding="utf-8")
    cl.save_usage("synthesize")
    wj(P.out / "synthesis_status.json", {"run": RUN_STAMP, "videos": vids, "batches": len(batches), "complete": True})
    log("synthesize: style_guide.json and style_guide.md written")


def synth_budget(cfg: dict, system: str, which: str = "a") -> int:
    """Input tokens left for the records in one synthesize call: the model's context, less the answer's max_tokens,
    the skills, the schema written into the prompt and a margin. vLLM refuses a prompt past this with a 400."""
    m = cfg["models"][which]
    ctx = int(m.get("context") or 131072)
    out = int(m.get("max_tokens", {}).get("synthesize", 32000))
    sch = json.dumps(prompt_schema("style_guide"), separators=(",", ":"), ensure_ascii=False)
    return ctx - out - est_tokens(system) - est_tokens(sch) - 2000


def merge_guides(cl, system: str, guides: list[dict], stats: dict, vids: list, P, budget: int, workers: int = 4,
                 level: int = 1) -> dict:
    """Merge batch guides into one corpus guide. When their condensed form does not fit one call, merge them in
    groups first (written to batches/merge_L<level>_<n>.json, reused when their films match), then merge those."""
    J = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    head = (f"SCOPE: corpus of {len(vids)} videos.\nCORPUS STATISTICS (code): {J(stats)}\n")
    tail = ("Merge them into one corpus guide: same technique = same id, keep the best evidence, recount frequency_videos "
            "from the batch guides (sum over batches). Return the `style_guide` JSON with scope \"corpus\".")
    parts = [J(condense_guide(g)) for g in guides]
    room = budget - est_tokens(head + tail) - 200
    if sum(est_tokens(p) for p in parts) <= room:
        text = head + f"BATCH STYLE GUIDES ({len(guides)}, condensed): [{','.join(parts)}]\n" + tail
        return cl.call("synthesize", system, [Client.text(text)], "style_guide", key="corpus")
    groups = pack_by_budget([est_tokens(p) for p in parts], room)
    if len(groups) >= len(guides):
        raise RuntimeError(f"merge level {level}: no two batch guides fit one call (budget {room} tokens); lower max_tokens.synthesize")
    log(f"synthesize: {len(guides)} guides too big for one merge; merging in {len(groups)} groups first (level {level})")

    def one(gi_g):
        gi, g = gi_g
        members = [v for i in g for v in guides[i].get("videos", [])]
        outp = P.out / "batches" / f"merge_L{level}_{gi + 1:02d}.json"
        if outp.exists() and (rj(outp, {}) or {}).get("videos") == members:
            return rj(outp)
        text = (f"SCOPE: merge of {len(g)} batch guides covering {len(members)} videos.\n"
                f"BATCH STYLE GUIDES ({len(g)}, condensed): [{','.join(parts[i] for i in g)}]\n"
                "Merge them into one guide: same technique = same id, keep the best evidence, recount frequency_videos "
                "(sum over the guides). Return the `style_guide` JSON with scope \"batch\".")
        o = cl.call("synthesize", system, [Client.text(text)], "style_guide", key=f"merge_L{level}_{gi + 1:02d}")
        o["scope"], o["videos"] = "batch", members
        wj(outp, o)
        return o
    with cf.ThreadPoolExecutor(max_workers=max(1, workers)) as ex:
        merged = list(ex.map(one, list(enumerate(groups))))
    return merge_guides(cl, system, merged, stats, vids, P, budget, workers, level + 1)


def cmd_distill_prep(cfg, P, args):
    """The inputs for the off-pod distillation (D-110): per batch of films, the whole-film records with the code's
    numbers, and per film a one-line-per-shot file. Text only, no narration (gists are dropped), packed in the bundle
    under distill/. The style guide is then written off the pod, where a long text-only step costs no GPU time."""
    vids = [v["id"] for v in selection(P, args.only) if (P.out / "videos" / f"{v['id']}.json").exists()]
    if not vids:
        sys.exit("distill-prep: no video records yet (a zero is not a result)")
    d = P.out / "distill"
    (d / "shots").mkdir(parents=True, exist_ok=True)
    bs = int(args.batch or 12)
    for vid in vids:
        L = [f"# Shots of {vid}. Format: id [time] size/technique/join/camera/function/relation, motion types; IDEA; CRAFT."]
        for s in load_shots(P, vid):
            c = condense_shot(s)
            tags = "/".join(str(c.get(k)) for k in ("size", "technique", "join", "camera", "function", "relation"))
            L.append(f"{c['id']} [{c['t'][0]}-{c['t'][1]}s] {tags} motion={','.join(x for x in (c.get('motion') or []) if x)}\n   IDEA: {c.get('idea')}\n   CRAFT: " + " | ".join(c.get("craft") or []))
        (d / "shots" / f"{vid}.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    for bi in range(0, len(vids), bs):
        b = vids[bi:bi + bs]
        L = [f"# Film batch {bi // bs + 1:02d}: {len(b)} films", "", "## Code statistics for this batch", "```json", json.dumps(corpus_stats(P, b), indent=1), "```"]
        for vid in b:
            m = rj(P.vprep(vid) / "measure.json", {})
            summ = {k: m.get(k) for k in ("cuts", "shot_len", "motion_share", "longest_still_s", "holds_top", "dark_seconds", "move_kinds")}
            summ["speech"] = {k: v2 for k, v2 in (m.get("speech") or {}).items() if k != "pauses"}
            L += [f"## FILM {vid}", "```json", json.dumps(summ, indent=1), "```", "```json", json.dumps(rj(P.out / "videos" / f"{vid}.json"), indent=1, ensure_ascii=False), "```",
                  f"Shot file: distill/shots/{vid}.md", ""]
        (d / f"films_{bi // bs + 1:02d}.md").write_text("\n".join(L), encoding="utf-8")
    log(f"distill-prep: {len(vids)} films in {math.ceil(len(vids) / bs)} batches under {d}")


def condense_guide(g: dict) -> dict:
    """A batch guide cut to what the corpus merge needs, so ten of them fit one context (about a third of the size)."""
    return {
        "videos": g.get("videos"), "house_constants": [{"rule": h["rule"], "n": len(h.get("support", []))} for h in g.get("house_constants", [])],
        "style_families": [{k: f.get(k) for k in ("id", "label", "defining_features", "members", "signature_techniques", "closest_loom_pack", "what_loom_lacks")}
                           for f in g.get("style_families", [])],
        "technique_library": [{**{k: t.get(k) for k in ("id", "name", "category", "description", "when_to_use", "how_to_execute", "timing",
                                                         "frequency_videos", "loom_status", "loom_notes")}, "evidence": (t.get("evidence") or [])[:3]}
                              for t in g.get("technique_library", [])],
        "explanation_patterns": [{**{k: x.get(k) for k in ("concept_kind", "device", "recipe", "frequency_videos")}, "evidence": (x.get("evidence") or [])[:2]}
                                 for x in g.get("explanation_patterns", [])],
        "rules": [{**{k: r.get(k) for k in ("area", "rule", "strength", "measurable_as")}, "evidence": (r.get("evidence") or [])[:2]} for r in g.get("rules", [])],
        "avoid": g.get("avoid", []), "judge_rubric": g.get("judge_rubric", []), "open_questions": g.get("open_questions", []),
    }


def render_guide_md(g: dict, stats: dict) -> str:
    L = [f"# Style guide ({g.get('scope')}, {len(g.get('videos', []))} videos, {stats.get('shots')} shots)", ""]
    L.append("## House constants")
    L += [f"- {h['rule']} ({len(h.get('support', []))} videos; exceptions {len(h.get('exceptions', []))})" for h in g.get("house_constants", [])]
    L.append("\n## Style families")
    for f in g.get("style_families", []):
        L.append(f"- **{f['label']}** ({len(f.get('members', []))} videos; closest pack {f.get('closest_loom_pack')}): "
                 + "; ".join(f.get("defining_features", [])) + ". Loom lacks: " + "; ".join(f.get("what_loom_lacks", [])))
    L.append("\n## Techniques")
    for t in sorted(g.get("technique_library", []), key=lambda t: -t.get("frequency_videos", 0)):
        L.append(f"- **{t['name']}** `{t['id']}` [{t['category']}, {t['frequency_videos']} videos, Loom: {t['loom_status']}]: {t['description']} "
                 f"When: {t['when_to_use']} Timing: {t['timing']}")
    L.append("\n## Rules")
    L += [f"- [{r['area']}, {r['strength']}] {r['rule']} (check: {r['measurable_as']})" for r in g.get("rules", [])]
    L.append("\n## Avoid")
    L += [f"- {a['anti_pattern']}: {a['why']}" for a in g.get("avoid", [])]
    L.append("\n## Judge rubric")
    L += [f"- **{r['name']}** ({r['id']}, weight {r['weight']}): 1 = {r['anchor_1']} / 3 = {r['anchor_3']} / 5 = {r['anchor_5']}" for r in g.get("judge_rubric", [])]
    L.append("\n## Open questions")
    L += [f"- {q}" for q in g.get("open_questions", [])]
    return "\n".join(L) + "\n"


# ------------------------------------------------------------------ judge (Loom films, or planted test films)
def default_rubric() -> list:
    return rj(SKILLS / "default_rubric.json")


def rubric_text(P: Paths) -> str:
    g = rj(P.out / "style_guide.json", {})
    rub = g.get("judge_rubric") or default_rubric()
    src = "the reference style guide" if g.get("judge_rubric") else "the default rubric (no style guide yet)"
    return f"RUBRIC (from {src}):\n" + "\n".join(
        f"- {r['id']}: {r['question']} | 1 = {r['anchor_1']} | 3 = {r['anchor_3']} | 5 = {r['anchor_5']}" for r in rub)


def film_segments(film: Path, manifest: Path | None, script: Path | None, storyboard: Path | None, window: float) -> list[dict]:
    D = probe(film)["duration"]
    if manifest and Path(manifest).exists():
        man = rj(manifest)
        sc = {b["id"]: b for b in (rj(script, {}).get("beats", []) if script else [])}
        sb = {s["beat"]: s for s in (rj(storyboard, {}).get("scenes", []) if storyboard else [])}
        segs = []
        jw = {sc_.get("beat"): {"type": (sc_.get("join_in") or {}).get("type"), "window": sc_.get("join_window")}
              for sc_ in man.get("scenes", []) if sc_.get("join_window")}
        for b in man["beats"]:
            s = sb.get(b["id"], {})
            intent = {k: s.get(k) for k in ("kind", "template", "subject", "world", "shot", "join_in", "story_role", "intent") if s.get(k) is not None}
            if isinstance(s.get("design"), dict):
                intent["treatment"] = str(s["design"].get("treatment", ""))[:600]
            segs.append({"id": b["id"], "t0": round(float(b["start"]), 2), "t1": round(min(D, float(b["end"])), 2),
                         "narration": " ".join(sc.get(b["id"], {}).get("narration", [])), "intent": intent,
                         "joins": [jw[b["id"]]] if b["id"] in jw else []})
        return segs
    n = int(math.ceil(D / window))
    segs = [{"id": f"w{i + 1:03d}", "t0": round(i * window, 2), "t1": round(min(D, (i + 1) * window), 2), "narration": "", "intent": {}} for i in range(n)]
    if len(segs) > 1 and segs[-1]["t1"] - segs[-1]["t0"] < 3.0:
        # a 1 to 3 s tail is folded into the window before it (the run spent 5,000 to 6,000 thinking tokens on 1 s tails)
        segs[-2]["t1"] = segs[-1]["t1"]; segs.pop()
    return segs


def judge_film(cfg, P: Paths, film: Path, name: str, segments: list[dict], out_dir: Path, cl: Client) -> dict:
    work = P.calib / "judge" / name
    work.mkdir(parents=True, exist_ok=True)
    fa_p = work / "frames.json"
    fa = rj(fa_p, {}) or analyse_frames(film, cfg["prepare"]["analysis_fps"])
    wj(fa_p, fa)
    fc_p = work / "flow.json"
    fc = rj(fc_p, {}) or flow_curve(film)
    wj(fc_p, fc)
    system = skill_text("40_film_judge.md") + "\n\n" + rubric_text(P)

    def one(seg):
        outp = out_dir / f"{seg['id']}.json"
        if outp.exists():
            return f"{seg['id']}: done"
        sd = work / seg["id"]
        sd.mkdir(exist_ok=True)
        L = seg["t1"] - seg["t0"]
        ts = [seg["t0"] + min(0.3, L / 4), (seg["t0"] + seg["t1"]) / 2, seg["t1"] - min(0.3, L / 4)]
        for n, t in enumerate(ts):
            if not (sd / f"k{n}.jpg").exists():
                extract_still(film, t, sd / f"k{n}.jpg", cfg["media"]["keyframe_width"])
        if not (sd / "clip.mp4").exists():
            extract_clip(film, seg["t0"], seg["t1"], sd / "clip.mp4", cfg["media"]["shot_clip_height"])
        fps = fa["fps"]
        i0, i1 = int(seg["t0"] * fps), int(seg["t1"] * fps)
        mot = shot_motion(fa, seg["t0"], seg["t1"])
        black = sum(1 for l in fa["lum"][i0:i1] if l < 12) / fps
        frozen = sum(1 for z in fa["frozen"][i0:i1] if z) / fps
        text = (f"FILM {name}, SEGMENT {seg['id']}: film time {seg['t0']:.2f} to {seg['t1']:.2f} s (the clip starts at {seg['t0']:.2f}).\n"
                f"Stills at film times {[round(t, 2) for t in ts]}, then the clip.\n"
                f"Narration in this segment: {seg['narration'] or '(not supplied to you; the film may have narration you cannot hear: never report missing narration as a defect)'}\n"
                f"Authored joins in this segment (planned transitions; a frame in the middle of one is not a defect): {json.dumps(seg.get('joins') or []) if seg.get('joins') else '(not given: a mid-dissolve or mid-morph frame may be authored, so judge the frames on either side, not the in-between)'}\n"
                f"Plan intent for this segment: {json.dumps(seg['intent'], ensure_ascii=False) if seg['intent'] else '(not given)'}\n"
                f"Measured by code: motion share per second {mot['per_second']}; still seconds {mot['still_s']}; black seconds {black:.1f}; "
                f"frozen seconds {frozen:.1f}.\nFull-frame-rate movement (code): {json.dumps(motion_events_full(fc, seg['t0'], seg['t1']))} "
                "(jerk_spikes = sudden speed jumps inside a move; flashes = single frames unlike both neighbours; treat any flash as a defect to find).\n"
                f"Return the `judge_segment` JSON for segment_id \"{seg['id']}\" with t0 {seg['t0']} and t1 {seg['t1']}.")
        content = [Client.text(text)] + [cl.media("image", sd / f"k{n}.jpg") for n in range(3)] + [cl.media("video", sd / "clip.mp4")]
        obj = cl.call("judge", system, content, "judge_segment", key=f"{name}_{seg['id']}", fps=cfg["media"]["judge_fps"])
        obj["segment_id"], obj["t0"], obj["t1"] = seg["id"], seg["t0"], seg["t1"]
        wj(outp, obj)
        return f"{seg['id']}: {obj.get('verdict')} ({len(obj.get('defects', []))} defects)"
    run_pool(cfg, f"judge {name}", one, segments, cfg["server"]["workers"])
    recs = [rj(out_dir / f"{s['id']}.json", {}) for s in segments]
    if any(not r for r in recs):
        log(f"judge {name}: {sum(1 for r in recs if not r)} segments missing; re-run to finish")
        return {}
    filmp = out_dir / "_film.json"
    if not filmp.exists():
        low = work / "lowres.mp4"
        if not lowres_ok(low, cfg):
            make_lowres(film, low, cfg)
        means = {k: round(sum(r["scores"][k]["score"] for r in recs) / len(recs), 2) for k in recs[0]["scores"]}
        text = (f"FILM {name}. Dimension means over {len(recs)} segments (code): {json.dumps(means)}\n"
                f"SEGMENT REVIEWS: {json.dumps(recs, ensure_ascii=False)}\nThe whole film is attached at low frame rate. Return the `judge_film` JSON.")
        obj = cl.call("judge_film", system, [Client.text(text), cl.media("video", low)], "judge_film", key=f"{name}__film", fps=cfg["media"]["video_fps"])
        obj["film_id"], obj["dimension_means"] = name, means
        wj(filmp, obj)
    return rj(filmp)


def cmd_judge(cfg, P, args):
    film = Path(args.film)
    name = args.name or film.stem
    segs = film_segments(film, args.manifest and Path(args.manifest), args.script and Path(args.script), args.storyboard and Path(args.storyboard),
                         float(args.window or cfg["calibration"]["judge_window_s"]))
    cl = Client(cfg, P, args.model or "a", args.base_url)
    with phase_lock(P, f"judge {name}"):
        r = judge_film(cfg, P, film, name, segs, P.out / "judge" / name, cl)
    cl.save_usage("judge")
    if r:
        log(f"judge {name}: verdict {r.get('verdict')}; means {r.get('dimension_means')}")



# ------------------------------------------------------------------ maturity: the golden set (D-102 E3)
def cmd_maturity(cfg, P, args):
    """Rate every golden-set frame 1-5 for maturity, `--repeats` times with different seeds (blind: the frames
    arrive as opaque ids; no class, key or source). Writes out/maturity/<id>.json and out/maturity/scores.json,
    which `py -m loom golden report --judge` compares with the person's ratings (Spearman >= 0.7 to gate)."""
    d = Path(args.frames)
    idx = rj(d / "golden_frames.json")
    if not idx or not idx.get("frames"):
        sys.exit(f"maturity: no golden_frames.json in {d}. On the PC run `py -m loom golden export` and copy the folder here.")
    ids = [f["id"] for f in idx["frames"]]
    missing = [i for i in ids if not (d / f"{i}.jpg").exists()]
    if missing:
        sys.exit(f"maturity: {len(missing)} frames missing in {d}, e.g. {missing[:3]}")
    which = args.model or "a"
    cl = Client(cfg, P, which, args.base_url)
    variant = getattr(args, "variant", None) or "v1"
    if variant == "pairs":
        return maturity_pairs(cfg, P, args, cl, d, ids, which)
    # v1: 45_maturity_rater after the study rules (D-102 E3 first try: rho 0.05 with Kshitij, L-202)
    # styled: 46_maturity_styled (D-107, RATING_INTENT.md): name the style, then judge execution on one bar for every
    # style; WITHOUT the study rules, whose audience rule biased taste toward corporate-clean (L-202)
    anchors_txt, anchor_parts = None, []
    if variant == "anchored":
        A = rj(d / "anchors.json")
        if not A or not A.get("anchors"):
            sys.exit("maturity --variant anchored: no anchors.json in the frames folder. On the PC run `py -m loom golden export` and copy it again.")
        meaning = {1: "not usable", 2: "weak", 3: "acceptable", 4: "professional", 5: "excellent"}
        for a in A["anchors"]:
            sc = int(round(a["score"]))
            anchor_parts += [cl.text(f"Reference frame, rated {a['score']:g} ({meaning.get(sc, '')}) by the person whose bar you apply:"),
                             cl.media("image", d / f"{a['id']}.jpg")]
        anchors_txt = [a["id"] for a in A["anchors"]]
        ids = [i for i in ids if i in set(A["test"])]             # scored only on the held-out frames
    kind = {"v1": "maturity", "styled": "maturity_styled", "anchored": "maturity_anchored"}[variant]
    out_dir = P.out / (("maturity" if variant == "v1" else f"maturity_{variant}") + ("" if which == "a" else f"_{which}"))
    system = skill_text("45_maturity_rater.md") if variant == "v1" else skill_text("46_maturity_styled.md", rules=False)
    if variant == "anchored":
        system += ("\n\n---\n\nYou are first shown a few reference frames with the score the person gave them. They show where "
                   "the person's bar sits: use them to calibrate, then rate the new frame on the same bar. Never copy a score "
                   "because a frame looks like a reference; judge the new frame's own execution.")
    schema_name = "maturity" if variant == "v1" else "maturity_styled"
    reps = max(1, int(args.repeats))

    def one(fid):
        p = out_dir / f"{fid}.json"
        if p.exists():
            return fid, rj(p)
        runs = []
        for r in range(reps):
            o = cl.call(kind, system, anchor_parts + [cl.text("Now the frame to rate:"), cl.media("image", d / f"{fid}.jpg"),
                                                      cl.text("Rate this frame on the same bar as the reference frames.")],
                        schema_name, f"{fid}.r{r}", seed=1000 + r)
            runs.append(o)
        rec = {"id": fid, "runs": runs, "score": sum(o["score"] for o in runs) / len(runs)}
        wj(p, rec)
        return fid, rec

    def safe(fid):
        try:
            return one(fid)
        except Exception as e:  # noqa: BLE001 - one frame failing must not stop the other 59; it is reported below
            return fid, {"error": str(e)[-300:]}

    recs, failed = {}, {}
    log(f"maturity: {len(ids)} frames x {reps} runs, {cfg['server']['workers']} at a time (progress every 5 frames)")
    with cf.ThreadPoolExecutor(max_workers=cfg["server"]["workers"]) as ex:
        for n, (fid, rec) in enumerate(ex.map(safe, ids), 1):
            if "error" in rec:
                failed[fid] = rec["error"]; log(f"maturity: {fid} FAILED: {rec['error'][-160:]}")
            else:
                recs[fid] = rec
            if n % 5 == 0 or n == len(ids):
                log(f"maturity: {n}/{len(ids)} frames done ({len(failed)} failed)")
    if failed:
        log(f"maturity: {len(failed)} frames failed; run `python vl.py maturity` again to finish them (done frames are kept)")
    scores = {f: r["score"] for f, r in recs.items()}
    multi = [r for r in recs.values() if len(r["runs"]) > 1]
    agree = (sum(1 for r in multi if len({o["score"] for o in r["runs"]}) == 1) / len(multi)) if multi else None
    within1 = (sum(1 for r in multi if max(o["score"] for o in r["runs"]) - min(o["score"] for o in r["runs"]) <= 1) / len(multi)) if multi else None
    spread = sorted(set(scores.values()))
    styles = {}
    for f, r in recs.items():
        st = [o.get("style") for o in r["runs"] if o.get("style")]
        if st:
            styles[f] = Counter(st).most_common(1)[0][0]
    summary = {"model": cfg["models"][which]["name"], "variant": variant, "anchors": anchors_txt, "frames": len(scores), "failed": sorted(failed), "repeats": reps,
               "scores": scores, "styles": styles,
               "self_agreement_exact": agree, "self_agreement_within_1": within1,
               "flat": len(spread) < 2, "usage": dict(cl.usage)}
    wj(out_dir / "scores.json", summary)
    log(f"maturity: {len(scores)} frames x {reps}; exact self-agreement {agree}; within 1 {within1}"
        + ("; WARNING every frame got the same score: this judge cannot rank" if summary["flat"] else ""))
    return 1 if summary["flat"] or failed else 0


def bradley_terry(ids: list[str], games: list[tuple[str, str, float]], iters: int = 200) -> dict[str, float]:
    """Strength per item from pairwise results (a, b, score of a: 1 win, 0.5 same, 0 loss), MM algorithm with a weak
    prior (one half-win against a virtual average player) so that an item that never loses stays finite."""
    import math as _m
    w = {i: 0.5 for i in ids}; n = {i: {} for i in ids}
    for a, b, sa in games:
        w[a] += sa; w[b] += 1 - sa
        n[a][b] = n[a].get(b, 0) + 1; n[b][a] = n[b].get(a, 0) + 1
    p = {i: 1.0 for i in ids}
    for _ in range(iters):
        new = {}
        for i in ids:
            den = sum(c / (p[i] + p[j]) for j, c in n[i].items()) + 1.0 / (p[i] + 1.0)
            new[i] = w[i] / den if den else p[i]
        g = _m.exp(sum(_m.log(v) for v in new.values()) / len(new))
        p = {i: v / g for i, v in new.items()}
    return {i: round(_m.log(v), 4) for i, v in p.items()}


def maturity_pairs(cfg, P, args, cl, d: Path, ids: list[str], which: str):
    """Pairwise variant: each frame meets `--pairs` others, every pair in BOTH orders (position bias cancels and is
    measured); Bradley-Terry turns the games into one strength per frame, which golden report ranks like a score."""
    out_dir = P.out / ("maturity_pairs" + ("" if which == "a" else f"_{which}"))
    system = skill_text("47_maturity_pairwise.md", rules=False)
    rng = random.Random(int(cfg["calibration"].get("seed", 7)))
    k = max(1, int(getattr(args, "pairs", 6) or 6))
    pairs = set()
    for i in ids:
        others = [j for j in ids if j != i]
        rng.shuffle(others)
        for j in others[:k]:
            pairs.add(tuple(sorted((i, j))))
    jobs = [(a, b) for a, b in sorted(pairs)] + [(b, a) for a, b in sorted(pairs)]

    def one(ab):
        a, b = ab
        p = out_dir / f"{a}__{b}.json"
        if p.exists():
            return ab, rj(p)
        try:
            o = cl.call("maturity_pair", system, [cl.text("Frame A:"), cl.media("image", d / f"{a}.jpg"),
                                                   cl.text("Frame B:"), cl.media("image", d / f"{b}.jpg"),
                                                   cl.text("Which frame is closer to professional and clean, each judged against the top of its own style?")], "maturity_pair", f"{a}__{b}", seed=11)
        except Exception as e:  # noqa: BLE001
            return ab, {"error": str(e)[-300:]}
        wj(p, o)
        return ab, o

    log(f"maturity pairs: {len(pairs)} pairs x 2 orders = {len(jobs)} comparisons, {cfg['server']['workers']} at a time")
    res, failed = {}, 0
    with cf.ThreadPoolExecutor(max_workers=cfg["server"]["workers"]) as ex:
        for n_, (ab, o) in enumerate(ex.map(one, jobs), 1):
            if "error" in o:
                failed += 1
            else:
                res[ab] = o
            if n_ % 25 == 0 or n_ == len(jobs):
                log(f"maturity pairs: {n_}/{len(jobs)} done ({failed} failed)")
    games, a_wins, decided, consistent, both = [], 0, 0, 0, 0
    for (a, b), o in res.items():
        sa = {"A": 1.0, "B": 0.0, "same": 0.5}[o["better"]]
        games.append((a, b, sa))
        if o["better"] != "same":
            decided += 1; a_wins += o["better"] == "A"
        if a < b and (b, a) in res:
            both += 1
            o2 = res[(b, a)]
            w1 = {"A": a, "B": b, "same": None}[o["better"]]; w2 = {"A": b, "B": a, "same": None}[o2["better"]]
            consistent += w1 == w2
    strength = bradley_terry(ids, games)
    summary = {"model": cfg["models"][which]["name"], "variant": "pairs", "frames": len(ids), "comparisons": len(res), "failed": failed,
               "first_frame_win_share": round(a_wins / decided, 3) if decided else None,
               "order_consistency": round(consistent / both, 3) if both else None,
               "scores": strength, "usage": dict(cl.usage)}
    wj(out_dir / "scores.json", summary)
    log(f"maturity pairs: {len(res)} comparisons; Frame A won {summary['first_frame_win_share']} of decided ones (0.5 = no position bias); "
        f"same verdict in both orders {summary['order_consistency']}")
    return 1 if failed else 0


# ------------------------------------------------------------------ calibration
PLANT_TYPES = {  # planted type -> judge defect types that count as finding it, and its class
    "black": (["black_frame", "empty_frame"], "gross"),
    "freeze": (["freeze_frame", "static_hold"], "gross"),
    "placeholder": (["placeholder_content"], "gross"),
    "cut_off_text": (["text_cut_off", "bad_crop"], "gross"),
    "tiny_text": (["text_too_small", "illegible_low_contrast"], "subtle"),
    "low_contrast_text": (["illegible_low_contrast", "text_too_small"], "subtle"),
    "grain": (["grain_noise", "compression_artifact"], "subtle"),
    "seam": (["seam_visible", "bad_crop", "double_exposure", "style_mix"], "subtle"),
}
# where each plant sits in the frame (x0, y0, x1, y1 as fractions), so a finding can be matched by place as well as time
PLANT_BOXES = {"black": [0, 0, 1, 1], "freeze": [0, 0, 1, 1], "grain": [0, 0, 1, 1], "placeholder": [0.30, 0.25, 0.70, 0.75],
               "cut_off_text": [0.55, 0.38, 1.0, 0.50], "tiny_text": [0.58, 0.29, 0.86, 0.32], "low_contrast_text": [0.30, 0.36, 0.70, 0.54],
               "seam": [0.56, 0, 1, 1]}
FONT = next((f for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf"] if Path(f).exists()), None)


def plant_filter(kind: str, a: float, b: float) -> str:
    en = f"enable='between(t,{a:.2f},{b:.2f})'"
    fnt = f"fontfile={FONT}:" if FONT else ""
    if kind == "black":
        return f"drawbox=x=0:y=0:w=iw:h=ih:color=black@1:t=fill:{en}"
    if kind == "grain":
        return f"noise=alls=55:allf=t+u:{en}"
    if kind == "tiny_text":
        return f"drawtext={fnt}text='Quarterly review notes for the team':fontsize=h*0.012:x=w*0.58:y=h*0.30:fontcolor=white:box=1:boxcolor=black@0.55:{en}"
    if kind == "cut_off_text":
        return f"drawtext={fnt}text='Key results this quarter':fontsize=h*0.085:x=w-tw*0.45:y=h*0.40:fontcolor=white:box=1:boxcolor=black@0.6:{en}"
    if kind == "low_contrast_text":
        return (f"drawbox=x=iw*0.30:y=ih*0.36:w=iw*0.40:h=ih*0.18:color=0x7A7A7A:t=fill:{en},"
                f"drawtext={fnt}text='Three steps to report it':fontsize=h*0.05:x=w*0.32:y=h*0.42:fontcolor=0x858585:{en}")
    if kind == "placeholder":
        bars = ",".join(f"drawbox=x=iw*0.34:y=ih*{0.33 + 0.07 * i:.2f}:w=iw*{0.30 - 0.05 * (i % 2):.2f}:h=ih*0.03:color=0xBDBDBD:t=fill:{en}" for i in range(5))
        return f"drawbox=x=iw*0.30:y=ih*0.25:w=iw*0.40:h=ih*0.50:color=white:t=fill:{en}," + bars
    if kind == "seam":
        return f"drawbox=x=iw*0.56:y=0:w=iw*0.44:h=ih:color=0x2A6FDB:t=fill:{en}"
    raise ValueError(kind)


def cmd_calibrate(cfg, P, args):
    C = cfg["calibration"]
    rnd = random.Random(C["seed"])
    vids = selection(P)
    cdir = P.out / "calibration"
    if args.step == "plant":
        pick = rnd.sample(vids, min(C["plant_videos"], len(vids)))
        types = list(PLANT_TYPES)
        truth, k = {"films": []}, 0
        npv = int(C["plant_per_video"])
        for v in pick:
            src = Path(v["file"])
            D = probe(src)["duration"]
            m = rj(P.vprep(v["id"]) / "measure.json", {})
            per_s = m.get("motion_per_second") or []
            slots = [12 + i * ((D - 24) / npv) for i in range(npv)]
            plants = []
            for s in slots:
                kind = types[k % len(types)]; k += 1
                a = round(s + rnd.uniform(0, 1.5), 2)
                if kind == "freeze" and per_s:
                    # a freeze must land where the source MOVES, or it is invisible (L-212: three freezes on still
                    # pictures were "missed" though the judge described the stillness)
                    lo, hi = max(1, int(s) - 8), min(len(per_s) - 3, int(s) + 8)
                    best = max(range(lo, hi), key=lambda x: sum(per_s[x:x + 3]), default=int(s))
                    if sum(per_s[best:best + 3]) / 3 >= float(C.get("plant_min_motion", 0.02)):
                        a = float(best)
                plants.append({"type": kind, "t0": a, "t1": round(a + 2.5, 2), "class": PLANT_TYPES[kind][1], "box": PLANT_BOXES.get(kind)})
            out = P.calib / "planted" / f"{v['id']}_planted.mp4"
            out.parent.mkdir(parents=True, exist_ok=True)
            tmp = out.with_suffix(".freeze.mp4")
            fr = [p_ for p_ in plants if p_["type"] == "freeze"]
            base = src
            if fr:
                # every freeze holds its first frame for its span; the audio is kept (L-212: the planted films had no
                # sound, and the judge then flagged "no narration" across clean windows)
                parts, last = [], 0.0
                for j, f_ in enumerate(fr):
                    parts.append(f"[0:v]trim={last}:{f_['t0']},setpts=PTS-STARTPTS[a{j}];[0:v]trim={f_['t0']}:{f_['t0'] + 0.04},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration={f_['t1'] - f_['t0'] - 0.04:.2f}[f{j}]")
                    last = f_["t1"]
                parts.append(f"[0:v]trim=start={last},setpts=PTS-STARTPTS[z]")
                chain = "".join(f"[a{j}][f{j}]" for j in range(len(fr))) + "[z]"
                fc_ = ";".join(parts) + f";{chain}concat=n={2 * len(fr) + 1}:v=1[v]"
                run([ff(), "-v", "error", "-y", "-i", src, "-filter_complex", fc_, "-map", "[v]", "-map", "0:a?", "-c:v", "libx264",
                     "-preset", "veryfast", "-crf", "18", "-c:a", "aac", "-shortest", tmp], timeout=7200)
                base = tmp
            vf = ",".join(plant_filter(p_["type"], p_["t0"], p_["t1"]) for p_ in plants if p_["type"] != "freeze") or "null"
            run([ff(), "-v", "error", "-y", "-i", base, "-map", "0:v", "-map", "0:a?", "-vf", vf, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                 "-c:a", "copy", out], timeout=7200)
            tmp.unlink(missing_ok=True)
            truth["films"].append({"video_id": v["id"], "film": str(out), "duration": D, "plants": plants})
            log(f"plant {v['id']}: {[p_['type'] for p_ in plants]}")
        wj(cdir / "planted_truth.json", truth)
        return
    if args.step == "judge-planted":
        truth = rj(cdir / "planted_truth.json")
        cl = Client(cfg, P, "a")
        with phase_lock(P, "calibrate judge-planted"):
            for f in truth["films"]:
                name = f"planted_{f['video_id']}"
                segs = film_segments(Path(f["film"]), None, None, None, float(C["judge_window_s"]))
                judge_film(cfg, P, Path(f["film"]), name, segs, cdir / "planted" / name, cl)
        cl.save_usage("calib_judge")
        return
    if args.step in ("consistency", "crossmodel"):
        allshots = [f"{v['id']}/{s['id']}" for v in vids for s in rj(P.vprep(v["id"]) / "measure.json", {}).get("shots", [])]
        sample = set(rnd.sample(allshots, max(1, int(len(allshots) * C["sample_frac"])))) if allshots else set()
        wj(cdir / f"{args.step}_sample.json", sorted(sample))
        if args.step == "consistency":
            cmd_shots(cfg, P, args, "a", "calib_consistency", sample, temperature=0.7, seed=2)
        else:
            cmd_shots(cfg, P, args, "b", "calib_crossmodel", sample, base_url=args.base_url)
        return
    if args.step == "loom":
        if not args.film or not args.manifest:
            sys.exit("calibrate loom needs --film <old step-7 MP4> --manifest <build/manifest.json> --script --storyboard --lesson <id>")
        name = f"loom_{args.lesson or Path(args.film).stem}"
        segs = film_segments(Path(args.film), Path(args.manifest), args.script and Path(args.script), args.storyboard and Path(args.storyboard), 6)
        judge_film(cfg, P, Path(args.film), name, segs, cdir / "loom" / name, Client(cfg, P, "a", args.base_url))
        return
    if args.step == "report":
        wj(cdir / "report.json", calibration_report(cfg, P))
        log("calibration report:", json.dumps(rj(cdir / "report.json")["gates"], indent=1))
        return
    sys.exit(f"unknown calibrate step {args.step}")


ENUM_FIELDS = [("transition_in", "type"), ("frame", "shot_size"), ("frame", "composition"), ("style", "technique"), ("style", "outline"),
               ("style", "shading"), ("style", "background"), ("camera", "move"), ("narration_link", "relation"), ("narration_link", "sync"),
               ("teaching", "function"), ("loom_map", "shot_size"), ("loom_map", "join_in")]


def agreement(P: Paths, sub: str) -> dict:
    per, n = defaultdict(lambda: [0, 0]), 0
    for p in (P.out / sub).glob("*/*.json"):
        a = rj(P.out / "shots" / p.parent.name / p.name, {})
        b = rj(p, {})
        if not a or not b:
            continue
        n += 1
        for g, f in ENUM_FIELDS:
            per[f"{g}.{f}"][1] += 1
            per[f"{g}.{f}"][0] += int((a.get(g) or {}).get(f) == (b.get(g) or {}).get(f))
    fields = {k: round(v[0] / v[1], 3) for k, v in per.items() if v[1]}
    return {"pairs": n, "fields": fields, "mean": round(sum(fields.values()) / len(fields), 3) if fields else None}


def calibration_report(cfg, P: Paths) -> dict:
    C, cdir = cfg["calibration"], P.out / "calibration"
    G = C["gates"]
    rep: dict = {"gates": {}}
    for sub, gate in (("calib_consistency", "consistency_enum_agreement"), ("calib_crossmodel", "crossmodel_enum_agreement")):
        a = agreement(P, sub)
        rep[sub] = a
        rep["gates"][gate] = {"value": a["mean"], "threshold": G[gate], "pass": a["mean"] is not None and a["mean"] >= G[gate], "n": a["pairs"]}
    truth = rj(cdir / "planted_truth.json", {})
    if truth:
        # found = a defect of ANY label lands on the plant in time (and, where both have a box, in place). The run's
        # scorer accepted only a fixed label list and credited 39 of 50 plants that the judge had in fact described
        # (46 of 50, L-212); label agreement is reported beside it, never instead of it.
        win, iou_min = float(C.get("match_window_s", 1.0)), float(C.get("match_iou", 0.3))
        found = defaultdict(lambda: [0, 0, 0])
        clean_segments = clean_flagged = 0
        blockers = blockers_on_plants = 0
        for f in truth["films"]:
            recs = [rj(p) for p in sorted((cdir / "planted" / f"planted_{f['video_id']}").glob("w*.json"))]
            for pl in f["plants"]:
                ok_types, cls = PLANT_TYPES[pl["type"]]
                pbox = pl.get("box") or PLANT_BOXES.get(pl["type"])
                hits = [d for r in recs for d in r.get("defects", [])
                        if d.get("t", -9) <= pl["t1"] + win and d.get("t", -9) + max(0.5, d.get("dur", 0)) >= pl["t0"] - win
                        and (not pbox or pbox == [0, 0, 1, 1] or not d.get("box") or box_iou(pbox, d["box"]) >= iou_min)]
                found[pl["type"]][0] += int(bool(hits)); found[pl["type"]][1] += 1
                found[pl["type"]][2] += int(any(d.get("type") in ok_types for d in hits))
            for r in recs:
                on_plant = any(r["t0"] - win <= pl["t1"] and r["t1"] + win >= pl["t0"] for pl in f["plants"])
                nb = sum(1 for d in r.get("defects", []) if d.get("severity") == "blocker")
                blockers += nb; blockers_on_plants += nb if on_plant else 0
                if not on_plant:
                    clean_segments += 1
                    clean_flagged += int(any(d.get("severity") in ("major", "blocker") for d in r.get("defects", [])))
        per = {k: {"found": v[0], "planted": v[1], "recall": round(v[0] / v[1], 3), "label_agrees": v[2]} for k, v in found.items()}
        def cls_recall(c):
            ks = [k for k in per if PLANT_TYPES[k][1] == c]
            tot = sum(per[k]["planted"] for k in ks)
            return round(sum(per[k]["found"] for k in ks) / tot, 3) if tot else None
        rep["planted"] = {"per_type": per, "clean_segments": clean_segments, "clean_flagged_major": clean_flagged,
                          "blockers": blockers, "blocker_precision": round(blockers_on_plants / blockers, 3) if blockers else None,
                          "matching": f"any label within {win} s, boxes overlapping >= {iou_min} where both have one"}
        fpr = round(clean_flagged / clean_segments, 3) if clean_segments else None
        for gate, val in (("planted_recall_gross", cls_recall("gross")), ("planted_recall_subtle", cls_recall("subtle"))):
            rep["gates"][gate] = {"value": val, "threshold": G[gate], "pass": val is not None and val >= G[gate]}
        rep["gates"]["planted_false_positive_rate"] = {"value": fpr, "threshold": G["planted_false_positive_rate"],
                                                       "pass": fpr is not None and fpr <= G["planted_false_positive_rate"]}
        rep["trusted_defect_types"] = sorted({t for k, v in per.items() if v["recall"] >= 0.8 for t in PLANT_TYPES[k][0]})
    gt = rj(HERE / "ground_truth" / "loom_step7_findings.json", {})
    loom_dirs = sorted((cdir / "loom").glob("loom_*")) if (cdir / "loom").exists() else []
    if gt and loom_dirs:
        hit = tot = 0
        per_lesson = {}
        for d in loom_dirs:
            lesson = d.name[len("loom_"):]
            beats = {}
            for b in gt.get("lessons", {}).get(lesson, {}).get("beats", []):   # a beat with any major finding counts as major
                if b["beat"] not in beats or b["severity"] == "major":
                    beats[b["beat"]] = b
            h = t = 0
            for bid, b in beats.items():
                if b["severity"] != "major":
                    continue
                r = rj(d / f"{bid}.json", {})
                if not r:
                    continue
                t += 1
                h += int(r.get("verdict") != "ship" and any(x.get("severity") in ("major", "blocker") for x in r.get("defects", [])))
            per_lesson[lesson] = {"major_beats_judged": t, "flagged": h, "recall": round(h / t, 3) if t else None}
            hit += h; tot += t
        val = round(hit / tot, 3) if tot else None
        rep["loom"] = per_lesson
        rep["gates"]["loom_beat_recall"] = {"value": val, "threshold": G["loom_beat_recall"], "pass": val is not None and val >= G["loom_beat_recall"]}
    g = rj(P.out / "style_guide.json", {})
    if g.get("style_families"):
        fam = {m: f["id"] for f in g["style_families"] for m in f.get("members", [])}
        cred = {v["id"]: v.get("credit") for v in selection(P)}
        pairs = same = 0
        ids = [i for i in fam if cred.get(i)]
        for i in range(len(ids)):
            for j in range(i + 1, len(ids)):
                if cred[ids[i]] == cred[ids[j]]:
                    pairs += 1; same += int(fam[ids[i]] == fam[ids[j]])
        val = round(same / pairs, 3) if pairs else None
        rep["gates"]["family_purity"] = {"value": val, "threshold": G["family_purity"], "pass": val is not None and val >= G["family_purity"],
                                        "same_credit_pairs": pairs, "note": "share of same-credit video pairs placed in the same style family"}
    # every configured gate appears: run, or skipped by config with a reason, never silently absent (L-212: loom_beat_recall
    # vanished from the report and all_pass still counted ">= 6")
    skip = set(C.get("skip_gates") or [])
    for gate, thr in G.items():
        if gate not in rep["gates"]:
            rep["gates"][gate] = {"value": None, "threshold": thr, "pass": None if gate in skip else False,
                                  "status": "skipped by config" if gate in skip else "NOT RUN"}
    rep["all_pass"] = all(v.get("pass") is True for k, v in rep["gates"].items() if k not in skip)
    rep["not_run"] = sorted(k for k, v in rep["gates"].items() if v.get("status") == "NOT RUN")
    return rep


def box_iou(a: list, b: list) -> float:
    try:
        ix = max(0.0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0.0, min(a[3], b[3]) - max(a[1], b[1]))
        inter = ix * iy
        ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
        return inter / ua if ua > 0 else 0.0
    except Exception:  # noqa: BLE001
        return 0.0


# ------------------------------------------------------------------ validate
def strings(o, path=""):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from strings(v, f"{path}/{k}")
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from strings(v, f"{path}/{i}")


def ngrams(ws: list[str], n: int) -> set:
    return {" ".join(ws[i:i + n]) for i in range(len(ws) - n + 1)}


def norm_words(s: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", s.lower())


def validate_outputs(cfg, out: Path, prep: Path | None, video_ids: list[str] | None, durations: dict) -> dict:
    """Schema, evidence, ranges and copyright overlap for everything under `out`. Works on the pod (with prep, for
    the transcript overlap check) and on the receiving side (without)."""
    E, W = [], []
    counts = Counter()
    nmax = int(cfg["copyright"]["max_verbatim_words"])
    shot_ids = defaultdict(set)
    redact = []
    for p in sorted((out / "shots").glob("*/*.json")) if (out / "shots").exists() else []:
        vid, o = p.parent.name, rj(p, {})
        counts["shots"] += 1
        for e in check_schema("shot", {k: v for k, v in o.items() if not k.startswith("_")}):   # _t0/_t1 are the code's own fields
            E.append(f"shot {vid}/{p.stem}: {e}")
        L = (o.get("_t1") or 0) - (o.get("_t0") or 0)
        shot_ids[vid].add(o.get("shot_id"))
        for ev in o.get("motion_events") or []:
            if not (-0.25 <= ev.get("t", -1) <= L + 0.5):
                W.append(f"shot {vid}/{p.stem}: motion event at {ev.get('t')} s outside the shot (0..{L:.2f})")
        bx = (o.get("frame") or {}).get("subject_box") or []
        if len(bx) != 4 or not all(0 <= x <= 1 for x in bx) or bx[0] >= bx[2] or bx[1] >= bx[3]:
            W.append(f"shot {vid}/{p.stem}: subject_box {bx} is not a box inside 0..1")
        for t in o.get("text_on_screen") or []:
            if not (0 < (t.get("height_frac") or 0) < 0.5):
                W.append(f"shot {vid}/{p.stem}: text height_frac {t.get('height_frac')} implausible")
    for p in sorted((out / "videos").glob("*.json")) if (out / "videos").exists() else []:
        vid, o = p.stem, rj(p, {})
        counts["videos"] += 1
        for e in check_schema("video", o):
            E.append(f"video {vid}: {e}")
        D = durations.get(vid)
        cited = [s for seg in o.get("structure", []) for s in seg.get("shots", [])]
        cited += [s for m in (o.get("visual_system") or {}).get("recurring_motifs", []) for s in m.get("shots", [])]
        cited += [m.get("example_shot") for m in (o.get("transition_grammar") or {}).get("signature_moves", [])]
        bad = [s for s in cited if s and shot_ids.get(vid) and s not in shot_ids[vid]]
        if bad:
            E.append(f"video {vid}: cites shots that do not exist {sorted(set(bad))[:8]}")
        if D:
            for seg in o.get("structure", []) + o.get("best_moments", []) + o.get("colour_script", []):
                if not (-1 <= seg.get("t0", 0) <= D + 1 and -1 <= seg.get("t1", 0) <= D + 1):
                    E.append(f"video {vid}: time range {seg.get('t0')}..{seg.get('t1')} outside 0..{D:.0f}")
    for p in sorted((out / "sound").glob("*.json")) if (out / "sound").exists() else []:
        o = rj(p, {})
        counts["sound"] += 1
        for e in check_schema("sound", o):
            E.append(f"sound {p.stem}: {e}")
        D = durations.get(p.stem)
        for x in (o.get("music") or {}).get("changes", []) + (o.get("sfx") or {}).get("examples", []):
            if D and not (-1 <= x.get("t", 0) <= D + 1):
                W.append(f"sound {p.stem}: time {x.get('t')} outside 0..{D:.0f}")
    for p in sorted(out.glob("maturity*/*.json")):
        if p.name == "scores.json":
            continue
        counts["maturity"] += 1
        if p.parent.name.startswith("maturity_pairs"):
            for e in check_schema("maturity_pair", rj(p, {})):
                E.append(f"{p.parent.name}/{p.stem}: {e}")
            continue
        sch = "maturity_styled" if p.parent.name.startswith(("maturity_styled", "maturity_anchored")) else "maturity"
        for i, run_ in enumerate(rj(p, {}).get("runs") or [{}]):
            for e in check_schema(sch, run_):
                E.append(f"{p.parent.name}/{p.stem} run {i}: {e}")
    known_videos = set(video_ids or []) | set(shot_ids)
    for p in [out / "style_guide.json"] + sorted((out / "batches").glob("*.json") if (out / "batches").exists() else []):
        if not p.exists():
            continue
        o = rj(p, {})
        counts["style_guides"] += 1
        for e in check_schema("style_guide", o):
            E.append(f"{p.name}: {e}")
        scope_n = len(o.get("videos", []))
        for t in o.get("technique_library", []):
            if t.get("frequency_videos", 0) > scope_n:
                E.append(f"{p.name}: technique {t.get('id')} claims {t.get('frequency_videos')} videos, scope has {scope_n}")
        evid = [e for t in o.get("technique_library", []) for e in t.get("evidence", [])]
        evid += [e for r in o.get("rules", []) for e in r.get("evidence", [])] + [e for x in o.get("explanation_patterns", []) for e in x.get("evidence", [])]
        missing = [f"{e['video_id']}/{e['shot_id']}" for e in evid if known_videos and (e["video_id"] not in known_videos or
                   (shot_ids.get(e["video_id"]) and e["shot_id"] not in shot_ids[e["video_id"]]))]
        if missing:
            (E if len(missing) > 0.1 * max(1, len(evid)) else W).append(f"{p.name}: {len(missing)} of {len(evid)} evidence items do not exist, e.g. {missing[:5]}")
        members = [m for f in o.get("style_families", []) for m in f.get("members", [])]
        if known_videos and [m for m in members if m not in known_videos]:
            E.append(f"{p.name}: style family members that are not in the set: {[m for m in members if m not in known_videos][:5]}")
    for p in sorted(out.glob("**/judge*/**/*.json")) + sorted(out.glob("calibration/**/w*.json")) + sorted(out.glob("calibration/loom/**/*.json")):
        o = rj(p, {})
        if not isinstance(o, dict) or "scores" not in o:
            continue
        counts["judge_segments"] += 1
        for e in check_schema("judge_segment", o):
            E.append(f"judge {p.parent.name}/{p.stem}: {e}")
        for d in o.get("defects", []):
            if not (o["t0"] - 1 <= d.get("t", -9) <= o["t1"] + 1):
                W.append(f"judge {p.parent.name}/{p.stem}: defect at {d.get('t')} outside the segment {o['t0']}..{o['t1']}")
    if prep and prep.exists():
        # every output that belongs to a film, not only shots/ and videos/ (L-212: the consistency re-run's gists
        # quoted narration and were never redacted)
        by_vid = defaultdict(list)
        for f in out.rglob("*.json"):
            parts = set(f.relative_to(out).parts) | {f.stem}
            for vid in shot_ids:
                if vid in parts or f.stem.startswith(vid):
                    by_vid[vid].append(f)
        for vid in shot_ids:
            words = [w["w"] for w in rj(prep / vid / "words.json", {}).get("words", [])]
            grams = ngrams(norm_words(" ".join(words)), nmax)
            if not grams:
                continue
            for f in sorted(set(by_vid[vid])):
                if not f.exists():
                    continue
                for path, s in strings(rj(f, {})):
                    if ngrams(norm_words(s), nmax) & grams:
                        redact.append({"file": str(f.relative_to(out)), "path": path})
        if redact:
            W.append(f"copyright: {len(redact)} strings share {nmax}+ consecutive words with a transcript; `pack` redacts them")
    if counts["shots"] == 0:
        E.append("no shot records at all (a zero is not a result)")
    return {"counts": dict(counts), "errors": E, "warnings": W, "redact": redact, "ok": not E}


def cmd_validate(cfg, P, args):
    vids = selection(P)
    durs = {v["id"]: v["duration"] for v in vids}
    rep = validate_outputs(cfg, P.out, P.prep, [v["id"] for v in vids], durs)
    total = sum(len(shots_to_annotate(rj(P.vprep(v["id"]) / "measure.json", {}), cfg)) for v in vids)
    rep["coverage"] = {"selected_videos": len(vids), "prepared": sum(1 for v in vids if (P.vprep(v["id"]) / "measure.json").exists()),
                       "shots_expected": total, "shots_done": rep["counts"].get("shots", 0),
                       "videos_done": rep["counts"].get("videos", 0), "style_guide": (P.out / "style_guide.json").exists()}
    if total and rep["counts"].get("shots", 0) < 0.95 * total:
        rep["errors"].append(f"coverage: {rep['counts'].get('shots', 0)} of {total} shots annotated (< 95 %)")
        rep["ok"] = False
    # the whole-film pass too: the pilot "validated OK" with 1 of 5 film records (L-204)
    films_with_shots = sum(1 for v in vids if (P.out / "shots" / v["id"]).exists())
    if films_with_shots and rep["counts"].get("videos", 0) < 0.95 * films_with_shots:
        rep["errors"].append(f"coverage: {rep['counts'].get('videos', 0)} of {films_with_shots} films have a video record (< 95 %)")
        rep["ok"] = False
    rep["coverage"]["films_with_shots"] = films_with_shots
    # a style guide must be THIS run's and cover its films (L-212: the pilot's 1-film guide validated "OK" in the full
    # run after synthesize had failed, and was packed)
    g = rj(P.out / "style_guide.json", {}) or {}
    st = rj(P.out / "synthesis_status.json", {}) or {}
    films = [v["id"] for v in vids if (P.out / "shots" / v["id"]).exists()]
    if g:
        cov = len(set(g.get("videos") or []) & set(films))
        if not st.get("complete") or cov < 0.95 * max(1, len(films)):
            rep["errors"].append(f"style_guide.json is stale or partial: it covers {cov} of {len(films)} films "
                                 f"(synthesis_status complete={st.get('complete')}); it is left out of the bundle")
            rep["ok"] = False
            rep["stale_style_guide"] = True
    else:
        rep["notes"] = rep.get("notes", []) + ["no style guide on the pod: the distillation runs off the pod from the bundle (distill-prep, D-110)"]
    rep["coverage"]["style_guide"] = bool(g) and not rep.get("stale_style_guide")
    wj(P.out / "validation.json", rep)
    log(f"validate: {'OK' if rep['ok'] else 'ERRORS'}; {len(rep['errors'])} errors, {len(rep['warnings'])} warnings; coverage {rep['coverage']}")
    for e in rep["errors"][:20]:
        log("  E", e)
    for w in rep["warnings"][:10]:
        log("  W", w)
    return 0 if rep["ok"] else 1


def cmd_status(cfg, P, args):
    vids = selection(P)
    prepared = [v for v in vids if (P.vprep(v["id"]) / "measure.json").exists()]
    exp = sum(len(shots_to_annotate(rj(P.vprep(v["id"]) / "measure.json", {}), cfg)) for v in prepared)
    done = len(list((P.out / "shots").glob("*/*.json"))) if (P.out / "shots").exists() else 0
    fails = len(list(P.raw.glob("**/*.a3.json"))) if P.raw.exists() else 0
    log(f"status: {len(prepared)}/{len(vids)} prepared; shots {done}/{exp}; videos {len(list((P.out / 'videos').glob('*.json')))}; "
        f"batches {len(list((P.out / 'batches').glob('*.json')))}; style guide {'yes' if (P.out / 'style_guide.json').exists() else 'no'}; "
        f"calls that needed a 4th attempt {fails}")


# ------------------------------------------------------------------ receipts: proof of what each call carried
NEEDS = {  # call kind -> skill files that must be inside its system prompt, media it must carry, and whether a rubric is due
    "shots": (["00_rules.md", "10_shot_annotator.md", "loom_capabilities.md"], {"image": 3}, False),
    "videos": (["00_rules.md", "20_video_analyst.md", "loom_capabilities.md"], {"video": 1}, False),
    "sound": (["00_rules.md", "25_sound_listener.md", "loom_capabilities.md"], {"audio": 1}, False),
    "synthesize": (["00_rules.md", "30_style_distiller.md", "loom_capabilities.md"], {}, False),
    "judge": (["00_rules.md", "40_film_judge.md"], {"video": 1}, True),
    "judge_film": (["00_rules.md", "40_film_judge.md"], {"video": 1}, True),
    "maturity": (["00_rules.md", "45_maturity_rater.md"], {"image": 1}, False),
    "maturity_styled": (["46_maturity_styled.md"], {"image": 1}, False),        # deliberately without the study rules (L-202)
    "maturity_anchored": (["46_maturity_styled.md"], {"image": 2}, False),      # >= 1 rated anchor + the frame (D-108)
    "maturity_pair": (["47_maturity_pairwise.md"], {"image": 2}, False),
}


def receipts_summary(P: Paths) -> dict:
    p = P.raw / "receipts.jsonl"
    recs = [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.exists() else []
    out, bad = {}, []
    for kind in sorted({r["kind"] for r in recs}):
        rs = [r for r in recs if r["kind"] == kind]
        need, media_need, rubric = NEEDS.get(kind, ([], {}, False))
        row = {"calls": len(rs), "skills_seen": sorted({s for r in rs for s in r["skills"]}),
               "rules_first": sum(r["rules_first"] for r in rs), "schema_enforced": sum(r["schema_enforced"] for r in rs),
               "thinking": sum(bool(r["thinking"]) for r in rs), "media_missing": sum(r["media_missing"] for r in rs),
               "median_system_chars": sorted(r["system_chars"] for r in rs)[len(rs) // 2]}
        for r in rs:
            miss = [n for n in need if n not in r["skills"]]
            short = {m: c for m, c in media_need.items() if r["media"].get(m, 0) < c}
            rules_due = "00_rules.md" in need
            if miss or short or r["media_missing"] or (rules_due and not r["rules_first"]) or (rubric and not r["rubric"]):
                bad.append({"kind": kind, "key": r["key"], "missing_skills": miss, "missing_media": short,
                            "missing_files": r["media_missing"], "rules_first": r["rules_first"], "rubric": r["rubric"]})
        out[kind] = row
    return {"calls": len(recs), "by_kind": out, "problems": bad[:50], "problem_count": len(bad),
            "skills_sha": {p.name: hashlib.sha1(p.read_bytes()).hexdigest()[:10] for p in sorted(SKILLS.glob("*"))}}


def cmd_receipts(cfg, P, args):
    r = receipts_summary(P)
    wj(P.out / "prompt_receipts.json", r)                      # travels in the bundle, so the receiving side can check too
    log(f"receipts: {r['calls']} calls")
    for kind, row in r["by_kind"].items():
        log(f"  {kind:11s} calls {row['calls']:5d} | skills {', '.join(row['skills_seen']) or '-'} | rules first {row['rules_first']} | "
            f"schema {row['schema_enforced']} | thinking {row['thinking']} | missing media files {row['media_missing']} | prompt ~{row['median_system_chars']} chars")
    for b in r["problems"][:10]:
        log("  PROBLEM", b)
    if r["calls"] == 0:
        log("  no calls recorded yet: a zero is not a pass")
        return 1
    log("receipts: OK" if not r["problem_count"] else f"receipts: {r['problem_count']} calls missed a skill, a rubric or a media file")
    return 0 if not r["problem_count"] else 1


# ------------------------------------------------------------------ pack (to send back) and ingest (receiving side)
def cmd_pack(cfg, P, args):
    wj(P.out / "prompt_receipts.json", receipts_summary(P))
    v = cmd_validate(cfg, P, args)
    rep = rj(P.out / "validation.json")
    if v and not args.force:
        sys.exit("validation has errors; fix them or pass --force (the bundle then says it is unvalidated)")
    red = defaultdict(set)
    for r in rep.get("redact", []):
        red[r["file"]].add(r["path"])
    bundle = P.work / f"bundle_{cfg['run_id']}.zip"
    try:
        import importlib.metadata as im
        libs = {k: im.version(k) for k in ("numpy", "requests", "jsonschema", "PyYAML") if _has(k)}
    except Exception:  # noqa: BLE001
        libs = {}
    try:
        import requests
        sv = requests.get(cfg["server"]["base_url"].rsplit("/v1", 1)[0] + "/version", timeout=5, headers=auth(cfg)).json()
    except Exception:  # noqa: BLE001
        sv = None
    manifest = {"run_id": cfg["run_id"], "vl_version": VERSION, "vl_sha": hashlib.sha1((HERE / "vl.py").read_bytes()).hexdigest()[:12],
                "schemas_sha": hashlib.sha1(b"".join(p.read_bytes() for p in sorted(SCHEMAS.glob("*.json")))).hexdigest()[:12],
                "skills_sha": hashlib.sha1(b"".join(p.read_bytes() for p in sorted(SKILLS.glob("*")))).hexdigest()[:12],
                "models": {k: m["name"] for k, m in cfg["models"].items()}, "server_version": sv, "libs": libs,
                "config": {k: v2 for k, v2 in cfg.items() if not k.startswith("_")}, "validation_ok": rep["ok"], "forced": bool(args.force),
                "selftest": rj(P.work / "selftest.json", {}), "packed_at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    n = 0
    with zipfile.ZipFile(bundle, "w", zipfile.ZIP_DEFLATED) as z:
        stale = set()
        if rep.get("stale_style_guide"):
            stale = {"style_guide.json", "style_guide.md"} | {str(x.relative_to(P.out)) for x in (P.out / "batches").glob("*")}
        for p in sorted(P.out.rglob("*")):
            if not p.is_file() or p.suffix.lower() not in (".json", ".md"):
                continue
            rel = str(p.relative_to(P.out))
            if rel in stale:
                continue
            obj = rj(p, None) if p.suffix == ".json" else None
            if obj is not None and rel in red:
                for path in red[rel]:
                    _set_path(obj, path, "[redacted: verbatim overlap with the narration]")
                z.writestr(f"{cfg['run_id']}/{rel}", json.dumps(obj, indent=1, ensure_ascii=False)); n += 1
            else:
                z.write(p, f"{cfg['run_id']}/{rel}"); n += 1
        for v in selection(P):
            m = rj(P.vprep(v["id"]) / "measure.json", {})
            if m:
                z.writestr(f"{cfg['run_id']}/measures/{v['id']}.json", json.dumps(m)); n += 1
        sel = rj(P.work / "selection.json")
        for v in sel["videos"]:
            v.pop("file", None); v.pop("srt", None)
        z.writestr(f"{cfg['run_id']}/selection.json", json.dumps(sel, indent=1, ensure_ascii=False))
        z.writestr(f"{cfg['run_id']}/run_manifest.json", json.dumps(manifest, indent=1, ensure_ascii=False))
        z.writestr(f"{cfg['run_id']}/README_BUNDLE.md", (HERE / "BUNDLE_README.md").read_text(encoding="utf-8"))
        names = z.namelist()
    bad = [x for x in names if re.search(r"\.(mp4|jpg|jpeg|png|wav|srt|vtt)$|words\.json$", x, re.I)]
    if bad:
        bundle.unlink()
        sys.exit(f"refused: media or transcripts would be packed: {bad[:5]}")
    log(f"pack: {bundle} ({n} files, {bundle.stat().st_size / 1e6:.1f} MB). Send this one file back.")
    # the raw side (every answer, every thinking text, calls.jsonl, receipts, logs): text only, for LOCAL study; it may
    # quote narration, so it is never published (L-213: the run kept no thinking text at all)
    rawz = P.work / f"raw_{cfg['run_id']}.zip"
    nr = 0
    with zipfile.ZipFile(rawz, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(P.raw.rglob("*")):
            if p.is_file() and p.suffix.lower() in (".json", ".jsonl"):
                z.write(p, f"raw_{cfg['run_id']}/{p.relative_to(P.raw)}"); nr += 1
        for lg in ("run_full.log", "synth.log", "server.log", "selftest.json"):
            if (P.work / lg).exists():
                z.write(P.work / lg, f"raw_{cfg['run_id']}/logs/{lg}"); nr += 1
    log(f"pack: {rawz} ({nr} files, {rawz.stat().st_size / 1e6:.1f} MB): raw answers, thinking and logs. Bring it home too; keep it local.")


def _has(mod):
    try:
        import importlib.metadata as im
        im.version(mod)
        return True
    except Exception:  # noqa: BLE001
        return False


def _set_path(obj, path, value):
    keys = [k for k in path.split("/") if k]
    cur = obj
    for k in keys[:-1]:
        cur = cur[int(k)] if isinstance(cur, list) else cur[k]
    last = keys[-1]
    if isinstance(cur, list):
        cur[int(last)] = value
    else:
        cur[last] = value


def cmd_ingest(cfg, args):
    src = Path(args.bundle)
    dest = Path(args.into)
    with zipfile.ZipFile(src) as z:
        names = z.namelist()
        bad = [x for x in names if re.search(r"\.(mp4|jpg|jpeg|png|wav|srt|vtt)$|words\.json$", x, re.I)]
        if bad:
            sys.exit(f"refused: the bundle contains media or transcripts {bad[:5]}")
        run_id = names[0].split("/")[0]
        z.extractall(dest)
    root = dest / run_id
    sel = rj(root / "selection.json", {})
    durs = {v["id"]: v["duration"] for v in sel.get("videos", [])}
    rep = validate_outputs(cfg, root, None, list(durs), durs)
    wj(root / "ingest_validation.json", rep)
    man = rj(root / "run_manifest.json", {})
    cal = rj(root / "calibration" / "report.json", {})
    g = rj(root / "style_guide.json", {})
    L = [f"# Vision lab bundle {run_id}", "",
         f"- model A {man.get('models', {}).get('a')}, server {man.get('server_version')}, vl {man.get('vl_version')} ({man.get('vl_sha')})",
         f"- counts {rep['counts']}; validation on ingest: {'OK' if rep['ok'] else str(len(rep['errors'])) + ' errors'}",
         f"- calibration all_pass: {cal.get('all_pass')}"]
    for k, v in (cal.get("gates") or {}).items():
        verdict = v.get("status") or ("PASS" if v.get("pass") else "FAIL")   # a skipped gate is not a failure; NOT RUN is shown as such
        L.append(f"  - {k}: {v.get('value')} (threshold {v.get('threshold')}) {verdict}")
    L.append(f"- techniques {len(g.get('technique_library', []))}, rules {len(g.get('rules', []))}, families {len(g.get('style_families', []))}")
    (root / "INGEST.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n".join(L))
    for e in rep["errors"][:15]:
        print("  E", e)


# ------------------------------------------------------------------ selftest and environment
def make_test_media(d: Path):
    from PIL import Image, ImageDraw, ImageFont
    d.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (1280, 720), (245, 245, 240))
    dr = ImageDraw.Draw(img)
    try:
        f = ImageFont.truetype(FONT or "DejaVuSans.ttf", 120)
    except Exception:  # noqa: BLE001
        f = ImageFont.load_default()
    dr.text((420, 280), "TEST 42", fill=(20, 20, 20), font=f)
    dr.ellipse((80, 260, 280, 460), fill=(220, 40, 40))
    dr.rectangle((1000, 260, 1200, 460), fill=(40, 80, 220))
    img.save(d / "test.jpg", quality=92)
    # 4 s: a red square moves left to right; the background turns from white to black at 2.0 s
    run([ff(), "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=white:s=640x360:d=2:r=25", "-f", "lavfi", "-i", "color=c=black:s=640x360:d=2:r=25",
         "-f", "lavfi", "-i", "color=c=red:s=60x60:d=4:r=25", "-filter_complex",
         "[0:v][1:v]concat=n=2:v=1[bg];[bg][2:v]overlay=x='20+t*130':y=150[v]", "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", d / "test.mp4"])


def cmd_selftest(cfg, P, args):
    import requests
    d = P.work / "selftest"
    make_test_media(d)
    res = {"base_url": cfg["server"]["base_url"], "model": cfg["models"][args.model or "a"]["name"]}
    try:
        r = requests.get(cfg["server"]["base_url"] + "/models", timeout=20, headers=auth(cfg))
        if r.status_code != 200 or "data" not in (r.json() if r.headers.get("content-type", "").startswith("application/json") else {}):
            hint = (" The server wants an API key: start it and run the lab in the same shell (VLLM_API_KEY is read by both),"
                    " or `export VLLM_API_KEY=<the key>` here." if r.status_code == 401 or "Unauthorized" in r.text else "")
            sys.exit(f"selftest: the server answered HTTP {r.status_code}: {r.text[:300]}.{hint}")
        res["models_served"] = [m["id"] for m in r.json()["data"]]
    except Exception as e:  # noqa: BLE001
        sys.exit(f"selftest: the server at {cfg['server']['base_url']} does not answer ({e}). Start it with serve.sh first.")
    if res["model"] not in res["models_served"]:
        sys.exit(f"selftest: server serves {res['models_served']}, config expects {res['model']}")
    tiny = {"type": "object", "additionalProperties": False, "required": ["answer"], "properties": {"answer": {"type": "string"}}}
    _schema_cache["_tiny"] = tiny
    img_s = {"type": "object", "additionalProperties": False, "required": ["number", "left_shape", "right_shape"],
             "properties": {"number": {"type": "integer"}, "left_shape": {"type": "string", "enum": ["circle", "square", "triangle", "none"]},
                            "right_shape": {"type": "string", "enum": ["circle", "square", "triangle", "none"]}}}
    _schema_cache["_img"] = img_s
    vid_s = {"type": "object", "additionalProperties": False, "required": ["direction", "background_change_s", "colour_after"],
             "properties": {"direction": {"type": "string", "enum": ["left_to_right", "right_to_left", "up", "down", "none"]},
                            "background_change_s": {"type": "number"}, "colour_after": {"type": "string"}}}
    _schema_cache["_vid"] = vid_s
    cl = Client(cfg, P, args.model or "a")
    sysm = "Answer with the JSON object only."

    def attempt(name, fn):
        t0 = time.time()
        try:
            out = fn()
            res[name] = {"ok": True, "answer": out, "s": round(time.time() - t0, 1)}
        except Exception as e:  # noqa: BLE001
            es = str(e)
            res[name] = {"ok": False, "error": es if len(es) <= 600 else es[:150] + " ... " + es[-450:], "s": round(time.time() - t0, 1)}
        log("selftest", name, "OK" if res[name]["ok"] else "FAIL", res[name].get("answer") or res[name].get("error"))
    cl.think_ok = False
    attempt("text_schema", lambda: cl.call("selftest", sysm, [Client.text("Say hello in the field answer.")], "_tiny", key="t1", max_tokens=1500))
    # one stream's decode speed, for every later per-call timeout and the preflight budgets (L-210: the run guessed it)
    t_ = time.time(); c0 = cl.usage.get("completion_tokens", 0)
    attempt("decode_speed", lambda: cl.call("selftest", sysm, [Client.text("Write the whole numbers from 1 to 250, separated by single spaces, in the field answer.")],
                                             "_tiny", key="speed", max_tokens=1500))
    gen = cl.usage.get("completion_tokens", 0) - c0
    res["decode_tps"] = round(gen / max(0.5, time.time() - t_), 1) if res["decode_speed"]["ok"] and gen > 50 else None
    log("selftest decode speed (one stream, no load):", res["decode_tps"], "tokens/s")
    cl.think_ok = True
    cl.m = dict(cl.m, thinking={"selftest": True})
    attempt("text_schema_thinking", lambda: cl.call("selftest", sysm, [Client.text("What is 17 + 25? Write the result in digits, as text, in the field answer.")],
                                                     "_tiny", key="t2", max_tokens=1500))
    cl.m = dict(cl.m, thinking={"selftest": False})
    for transport in ("file", "base64"):
        cl.transport = transport
        attempt(f"image_{transport}", lambda: cl.call("selftest", sysm, [Client.text("Read the number written in the image and name the shape on the left and on the right."),
                                                                            cl.media("image", d / "test.jpg")], "_img", key=f"img_{transport}", max_tokens=1500))
        if res[f"image_{transport}"]["ok"]:
            break
    res["transport"] = cl.transport
    img = (res.get(f"image_{cl.transport}") or {}).get("answer") or {}
    res["image_correct"] = img.get("number") == 42 and img.get("left_shape") == "circle" and img.get("right_shape") == "square"
    # how the frame rate reaches the video processor differs between vLLM versions and models (L-200): try each way,
    # keep the first the server accepts AND answers correctly, and record what each way cost in prompt tokens
    res["video_modes"] = {}
    for mode in ("fps+sample", "fps", "none"):
        cl.video_mode = mode
        before = cl.usage.get("prompt_tokens", 0)
        attempt(f"video_{mode}", lambda: cl.call("selftest", sysm, [Client.text("A small square moves across the frame and the background changes colour once. "
                                                                                 "Which way does the square move, at what second does the background change, and to what colour?"),
                                                                     cl.media("video", d / "test.mp4")], "_vid", key=f"vid_{mode}", fps=4, max_tokens=1500))
        r_ = res[f"video_{mode}"]
        va_ = r_.get("answer") or {}
        ok_ = r_["ok"] and va_.get("direction") == "left_to_right" and abs(float(va_.get("background_change_s") or -9) - 2.0) <= 0.6
        res["video_modes"][mode] = {"accepted": r_["ok"], "correct": ok_, "prompt_tokens": cl.usage.get("prompt_tokens", 0) - before}
        if ok_:
            res["video_clip"] = r_; res["video_mode"] = mode
            break
    else:
        res["video_clip"] = next((res[f"video_{m}"] for m in ("fps+sample", "fps", "none") if res[f"video_{m}"]["ok"]), res["video_none"])
        res["video_mode"] = next((m for m in ("fps+sample", "fps", "none") if res[f"video_{m}"]["ok"]), "fps+sample")
    log("selftest video modes:", res["video_modes"], "-> using", res["video_mode"])
    # does the server sample at the rate serve.sh asks (4 fps), and does a 1 fps file reach the model at 1 fps? (L-201)
    # Measured from prompt tokens: the same question with no video, with the 4 s clip (25 fps file) and with a 1 fps copy.
    cl.video_mode = res["video_mode"]
    q = [Client.text("A small square moves across the frame and the background changes colour once. "
                     "Which way does the square move, at what second does the background change, and to what colour?")]
    run([ff(), "-v", "error", "-y", "-i", d / "test.mp4", "-vf", "fps=1", "-c:v", "libx264", "-pix_fmt", "yuv420p", d / "test_1fps.mp4"])
    toks = {}
    for name_, content_ in (("none", q), ("clip_25fps", q + [cl.media("video", d / "test.mp4")]), ("clip_1fps", q + [cl.media("video", d / "test_1fps.mp4")])):
        before = cl.usage.get("prompt_tokens", 0)
        try:
            cl.call("selftest", sysm, content_, "_vid", key=f"rate_{name_}", fps=4 if name_ != "clip_1fps" else 1, max_tokens=600)
        except Exception as e:  # noqa: BLE001
            log("selftest rate probe", name_, "failed:", str(e)[-200:])
        toks[name_] = cl.usage.get("prompt_tokens", 0) - before
    a, b = toks["clip_25fps"] - toks["none"], toks["clip_1fps"] - toks["none"]
    res["video_rate"] = {"prompt_tokens": toks, "ratio_4fps_to_1fps": round(a / b, 2) if a > 0 and b > 0 else None}
    r_ = res["video_rate"]["ratio_4fps_to_1fps"]
    # 16 frames against 4 is a ratio of about 4; the old 2 fps default gives about 2
    res["video_rate_ok"] = None if r_ is None else 3.0 <= r_ <= 5.0
    log("selftest video rate:", res["video_rate"], "->", {None: "not measurable on this server", True: "OK (4 fps, and 1 fps files stay 1 fps)",
                                                          False: "WRONG: restart the server with the current serve.sh (media-io-kwargs fps 4)"}[res["video_rate_ok"]])
    if (args.model or "a") == "c":
        import wave
        import numpy as np
        sr = 16000
        x = np.zeros(sr * 4, np.float32)
        for t_ in (1.0, 2.5):
            i = int(t_ * sr); x[i:i + 3200] = 0.6 * np.sin(2 * np.pi * 880 * np.arange(3200) / sr)
        with wave.open(str(d / "beeps.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((x * 32767).astype(np.int16).tobytes())
        aud_s = {"type": "object", "additionalProperties": False, "required": ["beeps", "times_s"],
                 "properties": {"beeps": {"type": "integer"}, "times_s": {"type": "array", "items": {"type": "number"}}}}
        _schema_cache["_aud"] = aud_s
        attempt("audio", lambda: cl.call("selftest", sysm, [Client.text("How many beeps are in this audio, and at what seconds do they start?"),
                                                             cl.media("audio", d / "beeps.wav")], "_aud", key="aud"))
        aa = (res.get("audio") or {}).get("answer") or {}
        res["audio_correct"] = aa.get("beeps") == 2
    va = (res.get("video_clip") or {}).get("answer") or {}
    res["video_correct"] = va.get("direction") == "left_to_right" and abs(float(va.get("background_change_s") or -9) - 2.0) <= 0.6
    res["structured_ok"] = res["text_schema"]["ok"]
    res["thinking_with_schema_ok"] = res["text_schema_thinking"]["ok"]
    res["recommend"] = []
    if not res["image_correct"]:
        res["recommend"].append("the model misread the test image: check the model is a vision model and the server flags")
    if not res["video_correct"]:
        res["recommend"].append("video input is wrong or unsupported: set media.shot_video: frames in config.yaml, or fix the server video flags")
    if res.get("video_rate_ok") is False:
        res["recommend"].append("the server samples video at the wrong rate: stop it (pkill -f 'vllm serve') and start it with the current serve.sh")
    wj(P.work / "selftest.json", res)
    log("selftest:", "ALL GOOD" if res["image_correct"] and res["video_correct"] and res["structured_ok"] and res.get("video_rate_ok") is not False else "SEE RECOMMENDATIONS", res["recommend"])


def cmd_check_env(cfg, P, args):
    ok = True
    for t in ("ffmpeg", "ffprobe", "nvidia-smi"):
        w = shutil.which(t)
        log(f"{t}: {w or 'MISSING'}")
        ok &= bool(w) or t == "nvidia-smi"
    for mod in ("numpy", "PIL", "yaml", "requests", "jsonschema", "cv2", "faster_whisper"):
        try:
            __import__(mod); log(f"python {mod}: ok")
        except ImportError:
            log(f"python {mod}: MISSING" + (" (words then come from the .srt files)" if mod == "faster_whisper" else ""))
            ok &= mod == "faster_whisper"
    if shutil.which("nvidia-smi"):
        log(run(["nvidia-smi", "--query-gpu=name,memory.total,memory.used", "--format=csv,noheader"], check=False).stdout.strip())
    du = shutil.disk_usage(P.work)
    log(f"disk free at {P.work}: {du.free / 1e9:.0f} GB")
    mp4 = list(P.videos.glob("*.mp4"))
    log(f"videos in {P.videos}: {len(mp4)} mp4, {len(list(P.videos.glob('*.srt')))} srt, {len(list(P.videos.glob('*.info.json')))} info.json")
    if mp4:
        pr = probe(mp4[0])
        log(f"first video: {pr}")
        if pr["height"] < 700:
            log(f"note: {pr['height']}p source. Fine for composition, colour, motion, pacing and structure; small text and thin lines "
                "are judged with lower confidence (the model is told the resolution).")
    log(f"font for planted text: {FONT or 'MISSING (apt install fonts-dejavu-core)'}")
    log("check-env:", "OK" if ok and mp4 else "PROBLEMS ABOVE")


def cmd_remeasure(cfg, P, args):
    n = 0
    for v in selection(P):
        d = P.vprep(v["id"]); mp = d / "measure.json"
        m = rj(mp, {})
        if m and m.get("measure_version", 1) < MEASURE_VERSION:
            derive_measures(m, cfg, rj(d / "words.json", {}).get("words", []), d / "shots")
            wj(mp, m); n += 1
    log(f"remeasure: {n} measure files upgraded to version {MEASURE_VERSION}")


def cmd_preflight(cfg, P, args):
    """Run before a paid phase (D-113). Every line is a check that would have saved pod time in the TED-Ed run."""
    E, W = [], []
    m = cfg["models"]["a"]; S = cfg["server"]
    ctx = int(m.get("context") or 0)
    if not ctx:
        E.append("models.a.context is not set: it must match serve.sh --max-model-len")
    sf = server_facts(cfg)
    if sf.get("max_model_len") and ctx and ctx > sf["max_model_len"]:
        E.append(f"models.a.context {ctx} > the server's max_model_len {sf['max_model_len']} (server.log): every long call would be refused")
    if sf.get("kv_tokens") and float(S.get("kv_tokens", 0)) > sf["kv_tokens"]:
        W.append(f"server.kv_tokens {S.get('kv_tokens')} > the server's {sf['kv_tokens']} (server.log): admission uses the server's number")
    if not sf:
        W.append("no server.log facts (KV size, context): the config's numbers are trusted unchecked")
    st = rj(P.work / "selftest.json", {})
    if not st:
        E.append("no selftest.json: run `python vl.py selftest` against the running server first")
    else:
        for k in ("image_correct", "video_correct", "structured_ok"):
            if not st.get(k):
                E.append(f"selftest: {k} is not true ({st.get('recommend')})")
        if st.get("video_rate_ok") is False:
            E.append("selftest: the server samples video at the wrong rate (restart it with the current serve.sh)")
    # under load one stream runs at about half its idle speed (the pod: 20.7 tok/s at 5 workers, 11.8 at 12)
    tps = max(float(S.get("decode_tps_floor", 10)), 0.5 * float(st.get("decode_tps") or 0))
    kv = min([float(S.get("kv_tokens", 0))] + ([float(sf["kv_tokens"])] if sf.get("kv_tokens") else [])) * float(S.get("kv_fraction", 0.85))
    typical = {"shots": 10000, "videos": 45000, "judge": 10000, "judge_film": 90000, "maturity_styled": 1700, "synthesize": 92000}
    rows = []
    for kind, pt in typical.items():
        mt = int(m.get("max_tokens", {}).get(kind, 8000))
        if ctx and pt + mt > ctx:
            E.append(f"{kind}: a typical prompt ({pt}) + max_tokens ({mt}) exceeds the context ({ctx})")
        per_call = pt / float(S.get("prefill_tps", 2500)) + mt / tps
        fits = int(kv // (pt + mt)) if kv else 0
        rows.append(f"  {kind:16s} max_tokens {mt:6d}  worst case per call ~{per_call / 60:5.1f} min at {tps:.0f} tok/s  in flight at once <= {fits} (KV)")
        if fits and kind == "videos" and fits < int(S.get("video_workers", 1)):
            W.append(f"videos: {S.get('video_workers')} workers but only {fits} fit the KV cache at once; the admission gate will queue the rest (no timeouts)")
    try:
        import fcntl
        with open(P.work / ".heavy_phase.lock", "a+") as fh:
            try:
                fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB); fcntl.flock(fh, fcntl.LOCK_UN)
            except OSError:
                fh.seek(0); E.append(f"a heavy phase is running now: {fh.read().strip()}")
    except ImportError:
        pass
    old = [v["id"] for v in selection(P) if rj(P.vprep(v["id"]) / "measure.json", {}).get("measure_version", MEASURE_VERSION) < MEASURE_VERSION]
    if old:
        W.append(f"{len(old)} measure files are an older version: run `python vl.py remeasure` (no decoding, seconds)")
    du = shutil.disk_usage(P.work)
    if du.free < 20e9:
        W.append(f"only {du.free / 1e9:.0f} GB free at {P.work}")
    log("preflight: budgets (estimates from config and the selftest speed):")
    for r in rows:
        log(r)
    for w in W:
        log("  W", w)
    for e in E:
        log("  E", e)
    log("preflight:", "OK" if not E else f"{len(E)} problem(s): fix them before spending pod time")
    wj(P.work / "preflight.json", {"errors": E, "warnings": W, "budgets": rows})
    return 0 if not E else 1


# ------------------------------------------------------------------ main
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--config")
    sub = ap.add_subparsers(dest="cmd", required=True)
    for c in ("check-env", "select", "status", "validate", "videos"):
        s = sub.add_parser(c); s.add_argument("--only")
    s = sub.add_parser("selftest"); s.add_argument("--model")
    s = sub.add_parser("prepare"); s.add_argument("--only"); s.add_argument("--limit", type=int); s.add_argument("--workers", type=int, default=2)
    s = sub.add_parser("shots"); s.add_argument("--only")
    s = sub.add_parser("synthesize"); s.add_argument("--only"); s.add_argument("--batch", type=int, default=10)
    s = sub.add_parser("sound"); s.add_argument("--only"); s.add_argument("--base-url")
    s = sub.add_parser("judge"); s.add_argument("--film", required=True); s.add_argument("--name"); s.add_argument("--manifest"); s.add_argument("--script")
    s.add_argument("--storyboard"); s.add_argument("--window", type=float); s.add_argument("--model"); s.add_argument("--base-url")
    s = sub.add_parser("calibrate"); s.add_argument("step", choices=["plant", "judge-planted", "consistency", "crossmodel", "loom", "report"])
    s.add_argument("--only"); s.add_argument("--base-url"); s.add_argument("--film"); s.add_argument("--manifest"); s.add_argument("--script")
    s.add_argument("--storyboard"); s.add_argument("--lesson")
    s = sub.add_parser("maturity", help="rate the golden-set frames 1-5 (D-102 E3)"); s.add_argument("--frames", default="/workspace/golden")
    s.add_argument("--repeats", type=int, default=2); s.add_argument("--model"); s.add_argument("--base-url")
    s.add_argument("--variant", choices=["v1", "styled", "pairs", "anchored"], default="v1", help="v1: first rubric; styled: style first, then execution on one bar (D-107); pairs: style-aware pairwise comparisons")
    s.add_argument("--pairs", type=int, default=6, help="pairs variant: opponents per frame (each pair is run in both orders)")
    s = sub.add_parser("receipts", help="what every model call really carried: skills, rubric, schema, media")
    s = sub.add_parser("distill-prep", help="text inputs for the off-pod style-guide distillation (D-110)"); s.add_argument("--only"); s.add_argument("--batch", type=int, default=12)
    s = sub.add_parser("preflight", help="before a paid run: config, server, budgets, lock (D-113)")
    s = sub.add_parser("remeasure", help="upgrade every measure.json to the current measure version, from what is on disk")
    s = sub.add_parser("pack"); s.add_argument("--force", action="store_true"); s.add_argument("--only")
    s = sub.add_parser("ingest"); s.add_argument("bundle"); s.add_argument("--into", required=True)
    args = ap.parse_args(argv)
    cfg = load_cfg(args.config)
    if args.cmd == "ingest":
        return cmd_ingest(cfg, args)
    P = Paths(cfg)
    fn = {"check-env": cmd_check_env, "selftest": cmd_selftest, "select": cmd_select, "prepare": cmd_prepare, "shots": cmd_shots,
          "videos": cmd_videos, "sound": cmd_sound, "synthesize": cmd_synthesize, "judge": cmd_judge, "calibrate": cmd_calibrate, "maturity": cmd_maturity, "receipts": cmd_receipts, "validate": cmd_validate,
          "status": cmd_status, "pack": cmd_pack, "distill-prep": cmd_distill_prep, "preflight": cmd_preflight, "remeasure": cmd_remeasure}[args.cmd]
    if args.cmd == "maturity":
        with phase_lock(P, "maturity"):
            return fn(cfg, P, args) or 0
    return fn(cfg, P, args) or 0


if __name__ == "__main__":
    sys.exit(main())
