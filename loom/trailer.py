"""Course trailers (D-49): a 20-35 s trailer cut from an approved lesson, with no model calls.

BRAG makes a launch video for a product: hook -> reveal -> 2-3 highlights -> payoff/outro, short,
specific, and showing the real thing. A Loom trailer does the same for a lesson, and stays grounded
because every picture and every spoken word is the lesson's own:
- the footage is the lesson's composed scenes, played through an edit decision list (runtime/trailer.js);
- the voice is the lesson's narration, cut at phrase boundaries (never mid-sentence);
- the cards carry the lesson's title, its closing line and a duration computed from the lesson;
- the music is re-made for the trailer so its chord changes land ON the cuts.

    py -m loom trailer <id> [--tone default|polished|cinematic|chaotic|deadpan] [--beats b01,b12,b16,b28] [--render]

Output: projects/<id>/trailer/ (plan.json, build/, audio, <id>-trailer.mp4, .jpg poster baked as frame 0,
card.txt for the LMS course card).
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import wave
from pathlib import Path

import numpy as np

from .util import ENGINE_ROOT, LoomError, info, read_json, run, which, write_json

# BRAG's tone presets, translated for learning content (pacing of cuts, dip length, music, sound energy)
TONES = {
    "default":   {"dip": 0.32, "flash": False, "mood": "upbeat", "level": 0.2, "sfx": "moderate", "cut_sfx": "whoosh", "spring": "snappy", "cap": 5.2},
    "polished":  {"dip": 0.6, "flash": False, "mood": "calm_focus", "level": 0.16, "sfx": "sparse", "cut_sfx": "reveal", "spring": "gentle", "cap": 6.0},
    "cinematic": {"dip": 0.5, "flash": False, "mood": "serious", "level": 0.2, "sfx": "moderate", "cut_sfx": "reveal", "spring": "gentle", "cap": 5.6},
    "chaotic":   {"dip": 0.14, "flash": True, "mood": "upbeat", "level": 0.24, "sfx": "rich", "cut_sfx": "whoosh", "spring": "lively", "cap": 4.0},
    "deadpan":   {"dip": 0.9, "flash": False, "mood": "calm_focus", "level": 0.12, "sfx": "sparse", "cut_sfx": None, "spring": "gentle", "cap": 6.5},
}
HIGHLIGHT_JOBS = ("demonstrate", "distinguish", "scenario", "relate", "refute")
TITLE_S, END_S = 2.6, 3.6
TARGET = (20.0, 35.0)


def _phrases_upto(beat: dict, cap: float) -> tuple[float, float, str]:
    """Whole phrases from the start of a beat's speech, as many as fit in `cap` seconds (at least one)."""
    ph = beat["phrases"]
    a = ph[0]["words"][0]["s"]
    b = ph[0]["words"][-1]["e"]; txt = [ph[0]["text"]]
    for p in ph[1:]:
        e = p["words"][-1]["e"]
        if e - a > cap:
            break
        b = e; txt.append(p["text"])
    return a, b, " ".join(txt)


def _phrases_last(beat: dict, cap: float) -> tuple[float, float, str]:
    """Whole phrases ENDING at the beat's last word, as many as fit in `cap` seconds (at least one). A
    highlight shows the scene developed, not being set up: the end of a beat is where its picture is whole
    and its point is made (found by looking at the first trailer's frames: empty cards and bubbles)."""
    ph = beat["phrases"]
    b = ph[-1]["words"][-1]["e"]
    a = ph[-1]["words"][0]["s"]; txt = [ph[-1]["text"]]
    for p in reversed(ph[:-1]):
        s0 = p["words"][0]["s"]
        if b - s0 > cap:
            break
        a = s0; txt.insert(0, p["text"])
    return a, b, " ".join(txt)


def plan(project, tone: str = "default", beats: list[str] | None = None) -> dict:
    if tone not in TONES:
        raise LoomError(f"unknown tone '{tone}' ({', '.join(TONES)})")
    T = TONES[tone]
    script = read_json(project.path("plan/script.json"))
    sb = read_json(project.path("plan/storyboard.json"))
    tm = read_json(project.path("audio/timings.json"))
    mf = read_json(project.path("build/manifest.json"))
    if mf.get("draft_media"):
        raise LoomError("the lesson build holds draft Manim clips: run `py -m loom run <id> compose` first")
    tb = {b["id"]: b for b in tm["beats"]}
    sc = {s["beat"]: s for s in sb["scenes"]}
    jobs = {b["id"]: b for b in script["beats"]}
    def usable(bid):
        # clip beats (manim, skia, three, media) are re-timed into the trailer (their <video> is trimmed)
        return bid in tb and tb[bid]["phrases"]

    if beats:
        bad = [b for b in beats if not usable(b)]
        if bad:
            raise LoomError(f"cannot use {bad} (unknown or silent beats)")
        hook, mids, payoff = beats[0], beats[1:-1], beats[-1]
    else:
        order = [b["id"] for b in script["beats"] if usable(b["id"])]
        hook = next((b for b in order if jobs[b]["job"] == "hook"), order[0])
        payoffs = [b for b in order if jobs[b]["job"] == "payoff" and sc[b]["kind"] in ("bespoke", "blueprint", "template")]
        payoff = payoffs[0] if payoffs else order[-1]
        # highlights: the lesson DOING its thing (BRAG: show the flow, not the slide about it). Prefer drawn
        # scenes (bespoke/blueprint) with change over time, one per section, in lesson order.
        cands = [b for b in order if b not in (hook, payoff) and jobs[b]["job"] in HIGHLIGHT_JOBS
                 and sc[b]["kind"] in ("bespoke", "blueprint")]
        best = {}
        for b in cands:
            j = jobs[b]; sec = j["section"]
            score = (1 if j.get("change_over_time") else 0, float(j.get("animate_score") or 0), -(tb[b]["speech_end"] - tb[b]["speech_start"]))
            if sec not in best or score > best[sec][0]:
                best[sec] = (score, b)
        mids = [b for _, b in sorted(best.values(), key=lambda x: order.index(x[1]))]
    # fit the target length: drop highlights (the weakest first) until it fits
    cap = T["cap"]

    def length(ms):
        segs = [hook] + ms + [payoff]
        return TITLE_S + END_S + sum(min(cap + 1.0, _phrases_upto(tb[b], cap if b in ms else cap + 1.0)[1] - _phrases_upto(tb[b], cap)[0]) + 0.8 for b in segs)
    mids = list(mids)
    while mids and length(mids) > TARGET[1]:
        mids.pop(len(mids) // 2)
    mids = mids[:3]
    # the timeline: hook, title card, highlights, payoff, end card
    t = 0.0; segments, cards, cuts, spoken = [], [], [], []

    def seg(bid, c, last=False, hold=0.45):
        nonlocal t
        a, b, txt = (_phrases_last if last else _phrases_upto)(tb[bid], c)
        a0 = max(tb[bid]["start"], a - 0.35); b0 = min(tb[bid]["end"], b + hold)
        segments.append({"beat": bid, "a": round(a0, 3), "b": round(b0, 3), "t0": round(t, 3), "t1": round(t + b0 - a0, 3)})
        spoken.append({"beat": bid, "text": txt})
        t += b0 - a0

    seg(hook, cap + 1.0)
    cuts.append(round(t, 3))
    title = script["title"]
    mins = max(1, round(mf["duration"] / 60))
    cards.append({"kind": "title", "t0": round(t, 3), "t1": round(t + TITLE_S, 3), "kicker": f"A {mins}-minute lesson", "title": title})
    t += TITLE_S
    for b in mids:
        cuts.append(round(t, 3)); seg(b, cap, last=True)
    cuts.append(round(t, 3)); seg(payoff, cap + 1.0, last=True, hold=1.2)   # let the payoff picture land
    cuts.append(round(t, 3))
    last = script["beats"][-1]
    line = " ".join(last["narration"])
    if len(line.split()) > 16:
        line = last["narration"][0]
    cards.append({"kind": "end", "t0": round(t, 3), "t1": round(t + END_S, 3), "line": line, "title": title, "cta": f"Watch the full lesson  ·  {mins} min"})
    t += END_S
    D = round(t, 3)
    brief = read_json(project.path("plan/brief.json"), {}) or {}
    tl = re.split(r"[.;]\s", (brief.get("through_line") or ""))[0].rstrip(".;, ")
    card_copy = f"{title}. {tl}." if tl else f"{title}."
    card_copy += f" A {mins}-minute lesson."
    return {"lesson": project.id, "tone": tone, "duration": D, "segments": segments, "cards": cards, "cuts": cuts,
            "spoken": spoken, "card_copy": card_copy, "tone_spec": T,
            "why": {"hook": hook, "highlights": mids, "payoff": payoff}}


def _mix(project, P: dict, out: Path) -> Path:
    from .narrate import read_wav
    from .narrate.mix import SR, _lp_fast, chord_at, pad, place_events
    D = P["duration"]; N = int(D * SR)
    v, vsr = read_wav(project.path("audio/narration.wav"))
    v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)
    voice = np.zeros(N)
    for s in P["segments"]:
        i0, i1 = int(s["a"] * SR), int(s["b"] * SR)
        chunk = v[i0:i1].copy()
        f = int(0.03 * SR)
        if len(chunk) > 2 * f:
            chunk[:f] *= np.linspace(0, 1, f); chunk[-f:] *= np.linspace(1, 0, f)
        j = int(s["t0"] * SR); n = min(len(chunk), N - j)
        voice[j:j + n] += chunk[:n]
    T = P["tone_spec"]
    style = read_json(project.path("build/manifest.json"))["style"]
    root = int((style.get("music") or {}).get("root_midi", 50))
    mood = T["mood"]
    bed = pad(D, mood, root, changes=P["cuts"])         # the music follows the cuts (D-47)
    fx = np.zeros(N)

    def add(at, sig):
        i = int(at * SR); n = min(len(sig), N - i)
        if i >= 0 and n > 0:
            fx[i:i + n] += sig[:n]
    ev = []
    if T["cut_sfx"]:
        ev += [{"kind": T["cut_sfx"], "t": c} for c in P["cuts"]]
    for c in P["cards"]:
        ev.append({"kind": "reveal", "t": c["t0"] + 0.2})
        if c["kind"] == "end":
            ev.append({"kind": "success", "t": c["t0"] + 1.35})
    place_events(add, ev, root, lambda t: chord_at(t, D, mood, P["cuts"]), T["sfx"])
    venv = _lp_fast(np.abs(voice), 0.0015)
    duck = 1 - 0.55 * np.clip(venv / 0.05, 0, 1)
    master = voice + bed * T["level"] * duck + fx * 0.6
    tt = np.arange(N) / SR
    master *= np.clip((D - tt) / 0.9, 0, 1) * np.clip(tt / 0.15, 0, 1)
    master = master / (np.max(np.abs(master)) or 1) * 0.89
    raw = out.with_name("trailer_raw.wav")
    with wave.open(str(raw), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([master, master], 1) * 32767).astype(np.int16).tobytes())
    ff = which("ffmpeg")
    if ff:
        run([ff, "-v", "error", "-y", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), str(out)])
    else:
        raw.replace(out)
    return out


def retime_videos(html: str, segments: list[dict], media: dict) -> str:
    """Clips (manim, skia, three, media) in a trailer: keep the <video> of every clip beat the trailer shows,
    re-timed onto the trailer clock with a trim in-point (HyperFrames' data-playback-start); drop the rest."""
    segs = {s["beat"]: s for s in segments}

    def one(m):
        tag = m.group(0)
        idm = re.search(r'id="media-([^"]+)"', tag)
        bid = idm.group(1) if idm else None
        seg, md = segs.get(bid), media.get(bid)
        if not seg or not md:
            return ""
        ms = float(md.get("start") or 0); me = ms + float(md.get("duration") or 0)
        a, b = max(seg["a"], ms), min(seg["b"], me)
        if b <= a:
            return ""
        tag = re.sub(r'data-start="[^"]*"', f'data-start="{round(seg["t0"] + (a - seg["a"]), 3)}"', tag)
        tag = re.sub(r'data-duration="[^"]*"', f'data-duration="{round(b - a, 3)}" data-playback-start="{round(a - ms, 3)}"', tag)
        return tag
    return re.sub(r"<video [^>]*></video>\n?", one, html)


def build(project, tone: str = "default", beats: list[str] | None = None) -> dict:
    src = project.path("build")
    if not (src / "index.html").exists():
        raise LoomError("compose the lesson first (py -m loom run <id> compose)")
    P = plan(project, tone, beats)
    root = project.path("trailer"); root.mkdir(exist_ok=True)
    write_json(root / "plan.json", P)
    dst = root / "build"
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("snapshots", "renders", "*.mp4"))
    shutil.copy2(ENGINE_ROOT / "runtime/trailer.js", dst / "runtime/trailer.js")
    (dst / "assets/audio").mkdir(parents=True, exist_ok=True)
    _mix(project, P, dst / "assets/audio/trailer.wav")
    html = (src / "index.html").read_text(encoding="utf-8")
    m = re.search(r"<script>window\.LOOM_MANIFEST = (.*?);</script>", html, re.S)
    if not m:
        raise LoomError("could not find the manifest in the lesson build")
    mf = json.loads(m.group(1).replace("<\\/", "</"))
    mf["trailer"] = True
    mf["captions"]["enabled"] = False                      # the trailer's words are its cards and its voice
    mf["chrome"] = dict(mf.get("chrome") or {}, section_labels=False)
    D = P["duration"]
    tm_js = json.dumps({"duration": D, "segments": P["segments"], "cards": P["cards"], "cuts": P["cuts"],
                        "tone": {"dip": P["tone_spec"]["dip"], "flash": P["tone_spec"]["flash"], "spring": P["tone_spec"]["spring"]}}, ensure_ascii=False)
    data = json.dumps(mf, ensure_ascii=False).replace("</", "<\\/")
    html = html[:m.start()] + f"<script>window.LOOM_MANIFEST = {data};</script>" + html[m.end():]
    html = retime_videos(html, P["segments"], {s["beat"]: s.get("media") or {} for s in mf["scenes"] if (s.get("media") or {}).get("src")})
    html = re.sub(r'(<div id="lm-root"[^>]*data-duration=")[^"]*(")', lambda k: f"{k.group(1)}{D}{k.group(2)}", html)
    html = re.sub(r'<audio id="lm-audio" src="assets/audio/mix.wav" data-start="0" data-duration="[^"]*"',
                  f'<audio id="lm-audio" src="assets/audio/trailer.wav" data-start="0" data-duration="{D}"', html)
    boot_old = re.search(r"Loom\.boot\(window\.LOOM_MANIFEST\)\.then\(function \(\) \{ window\.__timelines\[\"main\"\] = Loom\.tl; \}\);", html)
    if not boot_old:
        raise LoomError("could not find the boot call in the lesson build")
    html = html[:boot_old.start()] + f"Loom.boot(window.LOOM_MANIFEST).then(function () {{ Loom.trailer.install({tm_js}); }});" + html[boot_old.end():]
    if '<script src="runtime/boot.js"></script>' not in html:
        raise LoomError("could not find runtime/boot.js in the lesson build")
    html = html.replace('<script src="runtime/boot.js"></script>', '<script src="runtime/boot.js"></script>\n<script src="runtime/trailer.js"></script>', 1)
    (dst / "index.html").write_text(html, encoding="utf-8", newline="\n")
    (root / "card.txt").write_text(P["card_copy"] + "\n", encoding="utf-8")
    info(f"trailer: {D:.1f}s, {len(P['segments'])} segments ({', '.join(s['beat'] for s in P['segments'])}), tone={tone} -> {dst}")
    return P


def render(project, quality: str = "high") -> Path:
    from .render import hf_env, hyperframes_cmd
    root = project.path("trailer"); b = root / "build"
    if not (b / "index.html").exists():
        raise LoomError("build the trailer first (py -m loom trailer <id>)")
    out = root / f"{project.id}-trailer.mp4"
    env = hf_env(); env["HF_SEGMENTED_CAPTURE"] = "true"
    r = run(hyperframes_cmd() + ["render", "--quality", quality, "--output", str(out), "--resume", "--keep-segments"], cwd=b, env=env, check=False)
    if r.returncode != 0 or not out.exists():
        raise LoomError("trailer render failed:\n" + ((r.stdout or "")[-800:] + (r.stderr or "")[-800:]))
    return finish(project, out)


def finish(project, out: Path | None = None) -> Path:
    """The poster: the title card, settled (its words fully in), baked as frame 0 (BRAG)."""
    root = project.path("trailer")
    out = out or root / f"{project.id}-trailer.mp4"
    P = read_json(root / "plan.json")
    tc = next(c for c in P["cards"] if c["kind"] == "title")
    t = tc["t0"] + 1.6
    ff = which("ffmpeg")
    jpg = out.with_suffix(".jpg")
    run([ff, "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(out), "-frames:v", "1", "-q:v", "2", str(jpg)])
    tmp = out.with_name(out.stem + ".poster.mp4")
    run([ff, "-v", "error", "-y", "-i", str(out), "-i", str(jpg), "-filter_complex", "[0:v][1:v]overlay=0:0:enable='eq(n,0)'[v]",
         "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy",
         "-movflags", "+faststart", str(tmp)])
    tmp.replace(out)
    info(f"trailer rendered -> {out} (poster {jpg.name}, baked as frame 0)")
    return out


def sheet(project, times: list[float] | None = None) -> Path:
    """A contact sheet of the trailer (its cards, every segment and mid-dip), from the trailer build."""
    from PIL import Image, ImageDraw
    from .render import hf_env, hyperframes_cmd
    root = project.path("trailer"); b = root / "build"
    P = read_json(root / "plan.json")
    if times is None:
        times = []
        for s in P["segments"]:
            times += [round(s["t0"] + 0.9, 2), round((s["t0"] + s["t1"]) / 2, 2)]
        for c in P["cards"]:
            times += [round(c["t0"] + 0.35, 2), round(c["t0"] + 1.8, 2)]
        times += [round(c, 2) for c in P["cuts"][:2]]
        times = sorted(set(times))
    snap = b / "snapshots"; shutil.rmtree(snap, ignore_errors=True)
    run(hyperframes_cmd() + ["snapshot", "--at", ",".join(f"{t:.2f}" for t in times)], cwd=b, env=hf_env(), timeout=1800)
    shots = sorted(snap.glob("frame-*-at-*.png"), key=lambda f: float(f.stem.split("-at-")[1].rstrip("s")))
    cols = 4; rows = (len(shots) + cols - 1) // cols
    W_, H_ = 480, 270
    sh = Image.new("RGB", (cols * (W_ + 4), rows * (H_ + 24)), (17, 17, 17)); d = ImageDraw.Draw(sh)
    for i, f in enumerate(shots):
        x, y = (i % cols) * (W_ + 4), (i // cols) * (H_ + 24)
        sh.paste(Image.open(f).convert("RGB").resize((W_, H_)), (x, y + 22))
        d.text((x + 6, y + 5), f.stem.split("-at-")[1], fill=(255, 220, 90))
    out = root / "sheet.jpg"; sh.save(out, quality=88)
    return out
