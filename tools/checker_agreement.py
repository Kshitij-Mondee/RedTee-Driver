"""Does Loom's own layout checker (tools/node/probe.mjs layoutAudit, contrastAudit) find what HyperFrames' check found?

    py tools/checker_agreement.py [--out DIR] [lesson ...]

For every lesson whose qa/hf_check.json and qa/report.json belong to the build still on disk (the report's build hash
equals the build's), the probe runs on that build (read only: its output goes to --out, the lesson's qa/ is not
touched) and its findings are compared with HyperFrames':
- recall: every content_overlap or contrast_aa_failure that HyperFrames made an ERROR the check kept (the report's
  errors, after Loom's painted test) must be an error in Loom's checker too;
- extra: every error only Loom's checker raises is listed, to be judged on the frames.
Writes <out>/agreement.json and prints a table. The checker replaces HyperFrames only when recall is complete and
every extra has been judged (D-154, Kshitij 2026-10-10: "make sure that we first check our checker").
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from loom.qa import build_hash, hf_gating, same_finding  # noqa: E402
from loom.util import ENGINE_ROOT, read_json, run, which, write_json  # noqa: E402
from loom.render import hf_env  # noqa: E402



def hf_findings(hf: dict) -> list:
    out = []
    for sec in ("layout", "contrast"):
        for f in (hf.get(sec) or {}).get("findings", []):
            if f.get("code") in ("content_overlap", "contrast_aa_failure"):
                out.append({"code": f["code"], "severity": f.get("severity"), "time": float(f.get("time") or 0), "text": f.get("text") or "",
                            "selector": f.get("selector") or ""})
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("lessons", nargs="*")
    ap.add_argument("--out", default=str(ROOT / "docs" / "research" / "checker_agreement"))
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    for d in sorted((ROOT / "projects").iterdir()):
        if a.lessons and d.name not in a.lessons:
            continue
        b, hfp, rp = d / "build", d / "qa" / "hf_check.json", d / "qa" / "report.json"
        if not ((b / "index.html").exists() and hfp.exists() and rp.exists()):
            continue
        rep = read_json(rp, {})
        if rep.get("build_hash") != build_hash(b):
            rows.append({"lesson": d.name, "skipped": "the build changed since its check"})
            continue
        hf = hf_findings(read_json(hfp, {}))
        gate = hf_gating(read_json(hfp, {}), rep.get("errors") or [])
        po = out / f"{d.name}.probe.json"
        env = dict(os.environ, **hf_env(), LOOM_PROBE_TEXT="0", LOOM_PROBE_FOREIGN="0")
        t0 = time.time()
        try:
            run([which("node"), str(ENGINE_ROOT / "tools/node/probe.mjs"), str(b / "index.html"), str(po)], env=env, timeout=1200)
        except Exception as e:  # noqa: BLE001
            rows.append({"lesson": d.name, "error": str(e)[:200]})
            continue
        pr = read_json(po, {})
        ours = (pr.get("layout") or {}).get("findings", []) + (pr.get("contrast") or {}).get("findings", [])
        ours_err = [o for o in ours if o["severity"] == "error"]
        # a HyperFrames overlap whose text Loom reports covered (the same defect named from the other side) counts as found
        cov_as = [dict(o, code="content_overlap", a={"text": o["text"]}, b={"text": ""}) for o in ours if o["code"] == "text_covered"]
        missed = [h for h in gate if not any(same_finding(h, o) and o["severity"] == "error" for o in ours + cov_as)]
        softer = [h for h in gate if h in missed and any(same_finding(h, o) for o in ours)]
        extra = [o for o in ours_err if o["code"] == "text_covered" or not any(same_finding(h, o) for h in hf)]
        rows.append({"lesson": d.name, "seconds": round(time.time() - t0, 1), "nodes": pr.get("nodes"),
                     "hf_errors": len(gate), "found_as_error": len(gate) - len(missed), "missed": missed, "found_softer": len(softer),
                     "ours_errors": len(ours_err), "extra": extra, "layout_ms": (pr.get("layout") or {}).get("ms"),
                     "contrast_ms": (pr.get("contrast") or {}).get("ms"), "probe_errors": [pr.get("layout_error"), pr.get("contrast_error")]})
        r = rows[-1]
        print(f"{d.name:42} hf errors {r['hf_errors']:3}  found {r['found_as_error']:3}  missed {len(missed):2}  ours {r['ours_errors']:3}  "
              f"extra {len(extra):2}  {r['seconds']} s, {r['nodes']} nodes", flush=True)
    write_json(out / "agreement.json", rows)
    done = [r for r in rows if "hf_errors" in r]
    tot = {k: sum(r[k] if isinstance(r[k], int) else len(r[k]) for r in done) for k in ("hf_errors", "found_as_error", "missed", "ours_errors", "extra")}
    print(f"\nlessons compared {len(done)} (skipped {len(rows) - len(done)}): HyperFrames errors {tot['hf_errors']}, found as errors "
          f"{tot['found_as_error']}, missed {tot['missed']}; Loom errors {tot['ours_errors']}, of them not in HyperFrames {tot['extra']}")
    return 0 if tot["missed"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
