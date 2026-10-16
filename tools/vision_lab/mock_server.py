#!/usr/bin/env python3
"""A stand-in for the vLLM server, for testing the vision lab's plumbing without a GPU.

    python mock_server.py --port 8011 --model Qwen/Qwen3.5-122B-A10B-FP8

It answers /v1/models and /v1/chat/completions. With a json_schema response_format it returns a schema-valid
object (deterministic filler that uses ids it finds in the prompt), checks that every file:// media path exists
(as vLLM does with --allowed-local-media-path), and answers the selftest's questions correctly. It proves the
pipeline runs end to end; it says nothing about a real model's quality.
"""
import argparse
import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def gen(s, key="", ctx=None):
    t = s.get("type")
    if "enum" in s:
        return s["enum"][0]
    if t == "object":
        props = s.get("properties", {})
        if not props and isinstance(s.get("additionalProperties"), dict):
            return {"composition": 3.0}
        return {k: gen(v, k, ctx) for k, v in props.items() if k in s.get("required", list(props))}
    if t == "array":
        if key in ("subject_box", "box"):
            return [0.2, 0.2, 0.8, 0.8]
        if key in ("support", "members", "videos", "exceptions", "seen_in"):
            return ctx["videos"][:1] if key != "exceptions" and key != "seen_in" else []
        if key == "shots":
            return ctx["shots"][:1]
        return [gen(s.get("items", {"type": "string"}), key, ctx)]
    if t == "integer":
        return 3 if key == "score" else 1
    if t == "number":
        return {"t": 0.2, "dur": 0.5, "height_frac": 0.05, "t0": 0.0, "t1": 1.0, "weight": 1.0}.get(key, 0.5)
    if t == "boolean":
        return False
    if key == "video_id":
        return ctx["videos"][0] if ctx["videos"] else "v"
    if key in ("shot_id", "example_shot"):
        return ctx["shots"][0] if ctx["shots"] else "s001"
    return f"mock {key or 'text'}"


class H(BaseHTTPRequestHandler):
    model = "mock"
    key = None            # when set, every request must carry "Bearer <key>", like vLLM started with VLLM_API_KEY
    video_fps = None       # when set, a video costs prompt tokens like vLLM's Qwen3-VL loader: frames = min(dur*fps, file frames)
    reject_sample = False  # when set, a video request with do_sample_frames fails like vLLM 0.30 did on the pod (L-200)
    # D-113 realism: the pod's failures were load, not plumbing
    kv = None              # KV cache size in tokens: a request whose prompt + max_tokens does not fit WAITS (queued), like vLLM
    delay = 0.0            # seconds each request takes (decode time stand-in)
    think_cap_once = False # the first thinking request per prompt spends all max_tokens thinking and answers nothing
    inflight = 0
    peak_inflight = 0
    requests_seen = 0
    _seen_think = set()
    import threading as _th
    _cv = _th.Condition()

    def _authorised(self) -> bool:
        if self.key and self.headers.get("Authorization") != f"Bearer {self.key}":
            self._send(401, {"error": "Unauthorized"})
            return False
        return True

    def log_message(self, *a):
        pass

    def _send(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b)))
        try:
            self.end_headers(); self.wfile.write(b)
        except (BrokenPipeError, ConnectionResetError):
            pass   # the client gave up (a timeout under load is what the tests provoke)

    def do_GET(self):
        if not self._authorised():
            return
        if self.path.endswith("/models"):
            return self._send(200, {"data": [{"id": self.model}]})
        if self.path.endswith("/version"):
            return self._send(200, {"version": "mock-1"})
        self._send(404, {})

    def do_POST(self):
        if not self._authorised():
            return
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        text, vid_tokens = "", 0
        for m in body["messages"]:
            c = m["content"]
            if isinstance(c, str):
                text += c
                continue
            for part in c:
                if part["type"] == "text":
                    text += part["text"]
                else:
                    url = part[part["type"]]["url"]
                    if url.startswith("file://") and not Path(url[7:]).exists():
                        return self._send(400, {"error": f"media not found {url}"})
                    if part["type"] == "video_url" and self.video_fps and url.startswith("file://"):
                        import subprocess
                        o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
                                            "stream=nb_read_frames:format=duration", "-of", "json", url[7:]], capture_output=True, text=True)
                        j = json.loads(o.stdout)
                        n_file, dur = int(j["streams"][0]["nb_read_frames"]), float(j["format"]["duration"])
                        vid_tokens += 100 * min(max(int(dur * self.video_fps), 4), n_file)
        if self.reject_sample and (body.get("mm_processor_kwargs") or {}).get("do_sample_frames"):
            dump = "array([[[255, 255, 255], " * 400
            return self._send(400, {"error": {"message": "Failed to apply Qwen3VLProcessor on data={'videos': [[" + dump +
                                              "]]} ValueError: do_sample_frames needs video metadata (mock cause)"}})
        H.requests_seen += 1
        need = len(text) // 3 + vid_tokens + int(body.get("max_tokens", 0))
        if H.kv:
            with H._cv:
                while H.inflight + need > H.kv and H.inflight > 0:
                    H._cv.wait(timeout=1)
                H.inflight += need
                H.peak_inflight = max(H.peak_inflight, H.inflight)
        try:
            return self._answer(body, text, vid_tokens)
        finally:
            if H.kv:
                with H._cv:
                    H.inflight -= need
                    H._cv.notify_all()

    def _answer(self, body, text, vid_tokens):
        import time as _time
        if H.delay:
            _time.sleep(H.delay)
        think = (body.get("chat_template_kwargs") or {}).get("enable_thinking")
        sig = hash(text[:2000])
        if H.think_cap_once and think and sig not in H._seen_think:
            H._seen_think.add(sig)
            mt = int(body.get("max_tokens", 0))
            return self._send(200, {"choices": [{"message": {"content": "", "reasoning_content": "thinking " * 50}, "finish_reason": "length"}],
                                    "usage": {"prompt_tokens": len(text) // 4, "completion_tokens": mt,
                                              "completion_tokens_details": {"reasoning_tokens": mt}}})
        ctx_len = getattr(self, "context", None)
        if ctx_len and len(text) // 3 + vid_tokens + int(body.get("max_tokens", 0)) > ctx_len:
            # vLLM's refusal, word for word in its shape (seen on the pod, L-209)
            H.overflows = getattr(H, "overflows", 0) + 1
            return self._send(400, {"error": {"message": f"This model's maximum context length is {ctx_len} tokens. However, you requested "
                                              f"{body.get('max_tokens')} output tokens and your prompt contains at least "
                                              f"{ctx_len - int(body.get('max_tokens', 0)) + 1} input tokens. Please reduce the length of the input."}})
        rf = body.get("response_format") or {}
        sch = (rf.get("json_schema") or {}).get("schema")
        name = (rf.get("json_schema") or {}).get("name")
        if name == "_runaway" and rf:
            # what Qwen did on the pod (L-199): the grammar corners it into whitespace until max_tokens
            return self._send(200, {"choices": [{"message": {"content": '{"answer":' + " " * 400, "reasoning_content": ""},
                                                 "finish_reason": "length"}], "usage": {"completion_tokens": body.get("max_tokens", 0)}})
        if name == "_img":
            out = {"number": 42, "left_shape": "circle", "right_shape": "square"}
        elif name == "_aud":
            out = {"beeps": 2, "times_s": [1.0, 2.5]}
        elif name == "_vid":
            out = {"direction": "left_to_right", "background_change_s": 2.0, "colour_after": "black"}
        elif sch:
            ctx = {"videos": re.findall(r"VIDEO (\S+?)[ ,(]", text) or re.findall(r"'([\w-]{6,})'", text),
                   "shots": re.findall(r'"id": "(s\d{3}[a-z]?)"', text) or re.findall(r"SHOT (s\d{3}[a-z]?)", text) or ["s001"]}
            out = gen(sch, "", ctx)
        else:
            out = {"answer": "hello"}
        self._send(200, {"choices": [{"message": {"content": json.dumps(out), "reasoning_content": "mock thinking" if think else ""}, "finish_reason": "stop"}],
                         "usage": {"prompt_tokens": len(text) // 4 + vid_tokens, "completion_tokens": 200,
                                   "completion_tokens_details": {"reasoning_tokens": 120 if think else 0}}})


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--port", type=int, default=8011); ap.add_argument("--model", default="Qwen/Qwen3.5-122B-A10B-FP8")
    a = ap.parse_args()
    H.model = a.model
    ThreadingHTTPServer(("127.0.0.1", a.port), H).serve_forever()
