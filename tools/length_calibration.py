"""How long will a script run? Fit the estimate on narrated lessons (RC15, 2026-10-07).

    py tools/length_calibration.py [<project id> ...]      (default: the five bench lessons of 2026-10-06)

For each lesson with plan/script.json and audio/timings.json: words, beats, the script's own pauses, wpm_target, the
NARRATED duration, the old estimate (words / wpm x 60 + 0.8 s a beat) and the current one (loom/checks/gates.py
script_seconds). Then a least-squares fit of duration - pauses = a x words / wpm x 60 + b x beats over the lessons, and
each lesson's error under the old estimate, the fitted formula and the formula the gate uses. Every error is printed
with its lesson; a lesson with no narration is listed as not measured, never dropped.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

BENCH = [f"bench-20261006-151439-{k}" for k in ("claude-balanced", "openai-balanced", "gemini-balanced", "mixed-value", "budget")]


def rows(ids):
    from loom.checks.gates import script_seconds
    from loom.checks.text import words
    out, skipped = [], []
    for pid in ids:
        P = ROOT / "projects" / pid
        sc, tm = P / "plan" / "script.json", P / "audio" / "timings.json"
        if not (sc.exists() and tm.exists()):
            skipped.append(pid)
            continue
        s = json.loads(sc.read_text(encoding="utf-8"))
        t = json.loads(tm.read_text(encoding="utf-8"))
        wpm = float(s.get("wpm_target") or 150)
        n = sum(len(words(" ".join(b.get("narration") or []))) for b in s.get("beats") or [])
        nb = len(s.get("beats") or [])
        pauses = sum(float(b.get("pause_after_s") or 0) for b in s.get("beats") or [])
        out.append({"id": pid, "words": n, "beats": nb, "pauses": pauses, "wpm": wpm, "narrated": float(t.get("duration") or 0),
                    "old": n / wpm * 60 + 0.8 * nb, "gate": script_seconds(s)})
    return out, skipped


def fit(rs):
    import numpy as np
    A = np.array([[r["words"] / r["wpm"] * 60, r["beats"]] for r in rs])
    y = np.array([r["narrated"] - r["pauses"] for r in rs])
    (a, b), *_ = np.linalg.lstsq(A, y, rcond=None)
    return float(a), float(b)


def main(argv) -> int:
    ids = argv or BENCH
    rs, skipped = rows(ids)
    if not rs:
        print("no lesson with a script and a narration: nothing measured (a zero is not a result)")
        return 2
    a, b = fit(rs)
    from loom.checks.gates import EST_BEAT_S, EST_WORD_FACTOR
    print(f"fitted on {len(rs)} lessons: duration = {a:.3f} x words / wpm x 60 + {b:.2f} s x beats + the script's pauses")
    print(f"the gate uses:          duration = {EST_WORD_FACTOR:.3f} x words / wpm x 60 + {EST_BEAT_S:.2f} s x beats + the script's pauses")
    print(f"{'lesson':44s} {'words':>5s} {'beats':>5s} {'narrated':>8s} {'old':>12s} {'fitted':>12s} {'gate':>12s}")
    for r in rs:
        fitted = a * r["words"] / r["wpm"] * 60 + b * r["beats"] + r["pauses"]
        e = lambda v: f"{v:6.0f} {100 * (v - r['narrated']) / r['narrated']:+5.1f}%"   # noqa: E731
        print(f"{r['id']:44s} {r['words']:5d} {r['beats']:5d} {r['narrated']:8.0f} {e(r['old'])} {e(fitted)} {e(r['gate'])}")
    for pid in skipped:
        print(f"{pid:44s} not measured (no script or no narration)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
