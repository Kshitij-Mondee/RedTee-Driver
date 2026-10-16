#!/usr/bin/env python3
"""Find model weights that are already on the volume, in any layout, and say whether they are complete.
Read-only unless --link is given. Standard library only, so it runs before setup.sh has built the venv.

    python3 find_model.py                                  # look for Qwen/Qwen3.8-27B under /workspace
    python3 find_model.py --model Qwen/Qwen3.8-27B --root /workspace
    python3 find_model.py --link                           # make a complete copy found elsewhere usable (see below)

Layouts it understands:
  - a Hugging Face cache anywhere (<cache>/hub/models--Qwen--Qwen3.8-27B/snapshots/<rev>/...);
  - a plain folder of weights (a config.json whose name_or_path / folder name matches, with *.safetensors).

Complete means every shard named in model.safetensors.index.json exists, is not empty, and no *.incomplete
download is left in the cache's blobs.

--link (only when a complete copy is found and /workspace/hf does not already have one):
  - an HF cache elsewhere: /workspace/hf/hub/models--... becomes a symlink to it, so setup.sh's `hf download`
    only checks it and downloads nothing big;
  - a plain folder: writes /workspace/hf/local_model_path__<org>--<name>, which serve.sh then serves under the
    model's own name.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def gb(n: int) -> str:
    return f"{n / 1e9:.1f} GB"


def size_of(p: Path) -> int:
    t = 0
    for root, _, files in os.walk(p, followlinks=False):
        for f in files:
            fp = Path(root) / f
            try:
                t += fp.stat().st_size          # follows HF snapshot symlinks to their blobs
            except OSError:
                pass
    return t


def check_folder(d: Path) -> dict:
    """A folder holding config.json and weights (an HF snapshot or a plain download)."""
    idx = d / "model.safetensors.index.json"
    shards = sorted(p.name for p in d.glob("*.safetensors"))
    missing, empty = [], []
    if idx.exists():
        try:
            want = sorted(set(json.loads(idx.read_text())["weight_map"].values()))
        except Exception as e:  # noqa: BLE001
            return {"path": str(d), "complete": False, "why": f"unreadable index: {e}"}
        for w in want:
            p = d / w
            if not p.exists():
                missing.append(w)
            elif p.stat().st_size == 0:
                empty.append(w)
        n_want = len(want)
    else:
        n_want = len(shards) if shards else 1
        if not shards:
            missing.append("*.safetensors")
    ok = not missing and not empty and (d / "config.json").exists()
    why = []
    if missing: why.append(f"{len(missing)} of {n_want} shards missing (e.g. {missing[:2]})")
    if empty: why.append(f"{len(empty)} empty shards")
    if not (d / "config.json").exists(): why.append("no config.json")
    return {"path": str(d), "complete": ok, "shards": f"{n_want - len(missing) - len(empty)}/{n_want}",
            "size": gb(size_of(d)), "why": "; ".join(why) or "ok"}


def find(model: str, root: Path) -> list[dict]:
    org, name = model.split("/", 1)
    cache_dir = f"models--{org}--{name}"
    found = []
    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        depth = len(Path(dirpath).relative_to(root).parts)
        if depth > 7:
            dirnames[:] = []
            continue
        dirnames[:] = [x for x in dirnames if x not in ("proc", "sys", "node_modules", ".git", ".locks")]   # .locks holds empty lock dirs
        p = Path(dirpath)
        if p.name == cache_dir:
            snaps = sorted((p / "snapshots").glob("*")) if (p / "snapshots").exists() else []
            inc = list((p / "blobs").glob("*.incomplete")) if (p / "blobs").exists() else []
            for s in snaps or [p]:
                r = check_folder(s)
                r.update(kind="hf_cache", cache=str(p), incomplete_downloads=len(inc))
                if inc:
                    r["complete"] = False
                    note = f"{len(inc)} unfinished downloads in blobs"
                    r["why"] = note if r["why"] == "ok" else r["why"] + "; " + note
                found.append(r)
            dirnames[:] = []
            continue
        if "config.json" in filenames and any(f.endswith(".safetensors") for f in filenames) and "/snapshots/" not in dirpath:
            try:
                cfg = json.loads((p / "config.json").read_text())
            except Exception:  # noqa: BLE001
                cfg = {}
            label = " ".join(str(cfg.get(k, "")) for k in ("_name_or_path", "name_or_path")) + " " + p.name
            if name.lower() in label.lower() or name.lower().replace(".", "") in label.lower().replace(".", ""):
                r = check_folder(p); r["kind"] = "folder"
                found.append(r)
    return found


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen3.8-27B")
    ap.add_argument("--root", default="/workspace")
    ap.add_argument("--link", action="store_true")
    a = ap.parse_args(argv)
    root = Path(a.root)
    found = find(a.model, root)
    print(f"== looking for {a.model} under {root}")
    if not found:
        print("   not found: setup.sh will download it (about 56 GB for Qwen3.8-27B in BF16).")
    for r in found:
        print(f"   [{'COMPLETE' if r['complete'] else 'INCOMPLETE'}] {r['kind']}: {r['path']}")
        print(f"      shards {r.get('shards')}, {r.get('size')}; {r['why']}")
    # other Qwen models on the volume, so nothing big is downloaded twice by mistake
    # other caches, by exact name (a substring test once hid Qwen3.8-27B-FP8 when looking for Qwen3.8-27B, L-192);
    # sizes follow the snapshot symlinks, because the weights themselves live in blobs
    me = f"models--{a.model.replace('/', '--')}"
    others = sorted({p for p in root.glob("**/models--*") if p.is_dir() and p.name != me and "/.locks/" not in str(p)}) if root.exists() else []
    if others:
        print("== other model caches on the volume (not touched):")
        for o in others[:15]:
            snap = sorted((o / "snapshots").glob("*")) if (o / "snapshots").exists() else []
            tag = ""
            if o.name.startswith(me + "-"):
                r = check_folder(snap[-1]) if snap else {"complete": False}
                tag = f"  <- a VARIANT of {a.model}: {'COMPLETE' if r['complete'] else 'INCOMPLETE'}"
            print(f"   {o}  ({gb(size_of(snap[-1]) if snap else size_of(o))}){tag}")
    good = [r for r in found if r["complete"]]
    target = root / "hf" / "hub" / f"models--{a.model.replace('/', '--')}"
    if a.link:
        if any(r["kind"] == "hf_cache" and Path(r["cache"]).resolve() == target.resolve() for r in good if target.exists()):
            print("== link: /workspace/hf already has a complete copy; nothing to do.")
        elif not good:
            print("== link: no complete copy found; setup.sh will download (it resumes a partial HF download).")
        else:
            r = good[0]
            if r["kind"] == "hf_cache":
                if target.exists() or target.is_symlink():
                    print(f"== link: {target} exists but is not complete; move it aside first, then run --link again.")
                    return 2
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(Path(r["cache"]).resolve(), target_is_directory=True)
                print(f"== link: {target} -> {r['cache']}")
            else:
                (root / "hf").mkdir(parents=True, exist_ok=True)
                lp = root / "hf" / f"local_model_path__{a.model.replace('/', '--')}"
                lp.write_text(r["path"] + "\n")
                print(f"== link: serve.sh will serve {r['path']} as {a.model} (written to {lp})")
    return 0 if good else 1


if __name__ == "__main__":
    sys.exit(main())
