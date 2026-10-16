"""Screen AI-written video notes (the Gemini study, docs/research/GEMINI_BRIEF.md) before anyone learns from them.

    py tools/check_video_notes.py notes.json [--online]

Notes that look complete can be filler: a model that could not watch a video may still return a full JSON
answer. On 2026-10-01, 14 of the notes received were one template copied 14 times, with only the title and
URL changed (83 of 85 fields identical, 0.99 text similarity), and several URLs pointed at a different
channel's video than the notes described. This checker flags that before the notes reach a skill:
  - placeholder titles ("Lesson 3", "Video 2", "Analysis 4");
  - near-duplicate entries (the same text under different titles);
  - identical round durations or publish dates across entries;
  - notes that admit they were simulated ("could not see actual video frames", "simulated due to platform
    access limitations"), and low overall confidence;
  - too few segments to have watched anything (fewer than 3);
  - segments that do not cover the stated duration;
  - with --online (on your own machine): the URL's real title and channel from YouTube's public oEmbed
    endpoint, compared with what the notes claim.
Verdict per entry: usable, check (look at the video before using it), or reject.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

PLACEHOLDER = re.compile(r"\b(lesson|video|analysis|example|sample)\s*\d+\b", re.I)
# the model saying, somewhere in its own notes, that it did not actually see the video
SIMULATED = re.compile(r"simulat|could not (?:see|access|watch) (?:the )?(?:actual )?(?:video|frames)|not able to (?:watch|view)|based on (?:the )?title|platform access limitation|cannot watch", re.I)


def entries(doc):
    if isinstance(doc, dict) and "video" in doc:
        return [doc]
    if isinstance(doc, list):
        return [e for d in doc for e in entries(d)]
    if isinstance(doc, dict):
        return [e for v in doc.values() for e in entries(v)]
    return []


def flat(o, p=""):
    if isinstance(o, dict):
        for k, v in o.items():
            yield from flat(v, p + "." + k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from flat(v, f"{p}[{i}]")
    else:
        yield p, str(o)


def secs(t):
    try:
        parts = [float(x) for x in str(t).strip().split(":")]
    except ValueError:
        return None
    s = 0.0
    for x in parts:
        s = s * 60 + x
    return s


def vid_id(url):
    m = re.search(r"(?:youtu\.be/|v=)([A-Za-z0-9_-]{11})", str(url))
    return m.group(1) if m else None


def oembed(vid):
    u = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote(f"https://www.youtube.com/watch?v={vid}")
    with urllib.request.urlopen(u, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def check(doc, online=False):
    E = entries(doc)
    texts = [" ".join(v for k, v in sorted(flat(e)) if not k.startswith(".video")) for e in E]
    durations = [e["video"].get("duration") for e in E]
    dates = [e["video"].get("published") for e in E]
    out = []
    for i, e in enumerate(E):
        v = e["video"]
        flags = []
        if PLACEHOLDER.search(v.get("title", "")):
            flags.append(("reject", f"placeholder title '{v.get('title')}'"))
        dup = [j for j in range(len(E)) if j != i and SequenceMatcher(None, texts[i], texts[j]).ratio() > 0.9]
        if dup:
            flags.append(("reject", f"near-identical to {len(dup)} other entr{'y' if len(dup) == 1 else 'ies'} (the same notes under another title)"))
        if len(E) > 2 and durations.count(v.get("duration")) > 2 and str(v.get("duration", "")).endswith(":00"):
            flags.append(("check", f"duration {v.get('duration')} repeated across {durations.count(v.get('duration'))} entries"))
        if len(E) > 2 and dates.count(v.get("published")) > 2:
            flags.append(("check", f"publish date {v.get('published')} repeated across {dates.count(v.get('published'))} entries"))
        said = " ".join([str(e.get("could_not_see", "")), str(e.get("confidence_overall", ""))])
        if SIMULATED.search(said) or SIMULATED.search(texts[i]):
            flags.append(("reject", "the notes say themselves that the video was not seen (simulated)"))
        elif str(e.get("confidence_overall", "")).lower() == "low":
            flags.append(("check", "overall confidence is low"))
        segs = e.get("segments") or []
        if len(segs) < 3:
            flags.append(("reject", f"{len(segs)} segment(s): too few to have followed the video"))
        else:
            end, dur = secs(segs[-1].get("t_end")), secs(v.get("duration"))
            if end and dur and abs(end - dur) > max(20, 0.1 * dur):
                flags.append(("check", f"segments end at {segs[-1].get('t_end')}, video is {v.get('duration')}"))
        if online and vid_id(v.get("url")):
            try:
                real = oembed(vid_id(v["url"]))
                if real.get("author_name", "").lower() not in v.get("channel", "").lower() and v.get("channel", "").lower() not in real.get("author_name", "").lower():
                    flags.append(("reject", f"URL is a {real.get('author_name')} video ('{real.get('title')}'), notes say {v.get('channel')}"))
                elif SequenceMatcher(None, real.get("title", "").lower(), v.get("title", "").lower()).ratio() < 0.6:
                    flags.append(("reject", f"URL's real title is '{real.get('title')}', notes say '{v.get('title')}'"))
            except Exception as ex:
                flags.append(("check", f"could not look up the URL ({ex.__class__.__name__})"))
        verdict = "reject" if any(f[0] == "reject" for f in flags) else "check" if flags else "usable"
        out.append({"title": v.get("title"), "channel": v.get("channel"), "url": v.get("url"), "verdict": verdict, "flags": [f[1] for f in flags]})
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("notes", nargs="+"); ap.add_argument("--online", action="store_true")
    a = ap.parse_args(argv)
    rows = []
    for p in a.notes:
        rows += check(json.loads(Path(p).read_text(encoding="utf-8")), a.online)
    for r in rows:
        print(f"[{r['verdict']:7}] {r['channel']} | {r['title']}")
        for f in r["flags"]:
            print(f"           - {f}")
    n = {k: sum(1 for r in rows if r["verdict"] == k) for k in ("usable", "check", "reject")}
    print(f"\n{len(rows)} entries: {n['usable']} usable, {n['check']} to check against the video, {n['reject']} rejected")
    return 0 if not n["reject"] else 1


if __name__ == "__main__":
    sys.exit(main())
