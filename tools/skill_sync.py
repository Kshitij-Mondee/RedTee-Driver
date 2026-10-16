"""Skill sync: the repo `skills/` are canonical; the Cowork account copies must follow them (CLAUDE.md rule 10, L-267).

    py tools/skill_sync.py <account skills dir>                 # report drift, exit 1 when any skill differs
    py tools/skill_sync.py --check [<account skills dir>]       # the same, the folder from env LOOM_ACCOUNT_SKILLS
    py tools/skill_sync.py <account skills dir> --json
    py tools/skill_sync.py --package <out dir> [--engine-path <path>]   # build one .skill per repo skill, for install

The account skills dir is the folder that holds one folder per installed skill (the Claude app keeps it under
%APPDATA%/Claude/local-agent-mode-sessions/skills-plugin/<org>/<user>/skills). `py tools/context_check.py` runs the
drift check when env LOOM_ACCOUNT_SKILLS names that folder, and says it skipped (with the reason) when it does not.

What is NOT drift (the account copy's own form, written by the package step):
- frontmatter quoting (`name: "loom-director"` against `name: loom-director`);
- blank lines and trailing spaces, CRLF line ends;
- the location line after the frontmatter ("> The Loom engine lives in the **Video-Engine** folder ...").
Everything else is: a changed, added or removed line, a repo file the account copy lacks (references, examples),
a file only the account copy has, a repo skill not installed at all. Account skills that are not in the repo (other
plugins' skills) are not ours and are not compared.

A `.skill` package is a zip of `<name>/...`: the repo skill's folder as it is, with the location line inserted into
SKILL.md right after the frontmatter, so Cowork opens the Video-Engine folder before following the paths.
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCATION_PREFIX = "> The Loom engine lives in the **Video-Engine** folder"
SKIP_NAMES = {".DS_Store", "Thumbs.db"}


def location_line(rel_skill_md: str, engine_path: str | None = None) -> str:
    """the line every account copy carries after its frontmatter (rel_skill_md: skills/<group>/<name>/SKILL.md)"""
    ep = engine_path or str(ROOT)
    return (f"{LOCATION_PREFIX} (`{ep}`). All paths below are relative to it; open or connect that folder first. "
            f"Canonical copy: `Video-Engine/{rel_skill_md}`; this account copy follows it.")


def repo_skills(root: Path = ROOT) -> dict[str, Path]:
    """{skill name: its folder} for skills/<group>/<name>/SKILL.md"""
    return {p.parent.name: p.parent for p in sorted((root / "skills").glob("*/*/SKILL.md"))}


def _files(d: Path) -> dict[str, Path]:
    return {f.relative_to(d).as_posix(): f for f in sorted(d.rglob("*"))
            if f.is_file() and f.name not in SKIP_NAMES and "__pycache__" not in f.parts}


def _unquote(v: str) -> str:
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        v = v[1:-1]
        v = v.replace('\\"', '"') if v and '\\"' in v else v
    return v


def normalize(text: str) -> list[str]:
    """the lines that carry meaning: frontmatter values unquoted, the location line, blank lines and trailing spaces
    dropped, line ends unified"""
    lines = text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out, in_fm, fm_seen = [], False, False
    for i, ln in enumerate(lines):
        s = ln.rstrip()
        if s == "---" and (i == 0 or in_fm) and not fm_seen:
            in_fm = not in_fm
            fm_seen = fm_seen or not in_fm
            out.append(s)
            continue
        if in_fm:
            m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", s)
            if m:
                s = f"{m.group(1)}: {_unquote(m.group(2))}"
        if not s.strip() or s.startswith(LOCATION_PREFIX):
            continue
        out.append(s)
    return out


def compare(repo_dir: Path, acct_dir: Path, context: int = 0, max_lines: int = 12) -> dict:
    """one skill: {missing_files, extra_files, changed: {file: [diff lines]}}; empty lists and dict mean in sync"""
    rf, af = _files(repo_dir), _files(acct_dir)
    out = {"missing_files": sorted(set(rf) - set(af)), "extra_files": sorted(set(af) - set(rf)), "changed": {}}
    for rel in sorted(set(rf) & set(af)):
        if rel.lower().endswith((".md", ".txt", ".json", ".yaml", ".yml", ".js", ".py", ".html", ".css", ".svg")):
            a = normalize(rf[rel].read_text(encoding="utf-8", errors="replace"))
            b = normalize(af[rel].read_text(encoding="utf-8", errors="replace"))
            if a != b:
                d = [x for x in difflib.unified_diff(a, b, "repo", "account", n=context, lineterm="")
                     if x.startswith(("+", "-")) and not x.startswith(("+++", "---"))]
                out["changed"][rel] = d[:max_lines] + ([f"... {len(d) - max_lines} more line(s)"] if len(d) > max_lines else [])
        elif rf[rel].read_bytes() != af[rel].read_bytes():
            out["changed"][rel] = ["(binary file differs)"]
    return out


def drift(account: Path, root: Path = ROOT) -> dict:
    """{skill: problems} for every repo skill that is missing from the account or differs from it; {} when in sync"""
    out = {}
    for name, d in repo_skills(root).items():
        a = account / name
        if not (a / "SKILL.md").exists():
            out[name] = {"not_installed": True}
            continue
        c = compare(d, a)
        if c["missing_files"] or c["extra_files"] or c["changed"]:
            out[name] = c
    return out


def lines(dr: dict, compared: int) -> list[str]:
    """a short, readable report of drift(...)"""
    if not dr:
        return [f"skills: {compared} repo skill(s) and their account copies agree"]
    out = [f"skills: {len(dr)} of {compared} account cop(ies) differ from skills/ (the repo is canonical; rebuild with "
           f"`py tools/skill_sync.py --package <dir>` and install):"]
    for name, c in dr.items():
        if c.get("not_installed"):
            out.append(f"  {name}: not installed in the account")
            continue
        if c["missing_files"]:
            out.append(f"  {name}: missing in the account: {', '.join(c['missing_files'][:6])}")
        if c["extra_files"]:
            out.append(f"  {name}: only in the account: {', '.join(c['extra_files'][:6])}")
        for rel, d in c["changed"].items():
            out.append(f"  {name}/{rel}: {len([x for x in d if not x.startswith('...')])} changed line(s), first: {d[0][:140] if d else ''}")
    return out


def package(out_dir: Path, root: Path = ROOT, engine_path: str | None = None) -> list[Path]:
    """one <name>.skill (a zip of <name>/...) per repo skill, the location line inserted after SKILL.md's frontmatter"""
    out_dir.mkdir(parents=True, exist_ok=True)
    made = []
    for name, d in repo_skills(root).items():
        rel = (d / "SKILL.md").relative_to(root).as_posix()
        dst = out_dir / f"{name}.skill"
        with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr(f"{name}/", "")
            for r, f in _files(d).items():
                if r == "SKILL.md":
                    z.writestr(f"{name}/SKILL.md", with_location(f.read_text(encoding="utf-8"), rel, engine_path))
                else:
                    z.write(f, f"{name}/{r}")
        made.append(dst)
    return made


def with_location(text: str, rel_skill_md: str, engine_path: str | None = None) -> str:
    """SKILL.md with the location line after its frontmatter (once; an existing location line is replaced)"""
    t = text.replace("\r\n", "\n")
    body_lines = [ln for ln in t.split("\n") if not ln.startswith(LOCATION_PREFIX)]
    t = "\n".join(body_lines)
    m = re.match(r"^---\n.*?\n---\n", t, re.S)
    head, rest = (t[:m.end()], t[m.end():]) if m else ("", t)
    return head + "\n" + location_line(rel_skill_md, engine_path) + "\n\n" + rest.lstrip("\n")


def check(account: str | None, root: Path = ROOT) -> tuple[list[str], list[str]]:
    """(problems, notes) for context_check: drift is a problem; no account path is a named skip, never a pass"""
    if not account:
        return [], ["skills: skipped (env LOOM_ACCOUNT_SKILLS is not set: no account skills folder to compare; set it to "
                    "the Claude app's skills folder to check the copies)"]
    p = Path(account)
    if not p.is_dir():
        return [f"skills: LOOM_ACCOUNT_SKILLS={account} is not a folder"], []
    n = len(repo_skills(root))
    if not n:
        return ["skills: 0 repo skills found under skills/*/*/SKILL.md: nothing was compared"], []
    dr = drift(p, root)
    msg = lines(dr, n)
    return (msg if dr else []), ([] if dr else msg)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("account", nargs="?", help="the account skills folder (one folder per installed skill)")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--check", action="store_true", help="compare with the account folder (argument or env LOOM_ACCOUNT_SKILLS); a named skip when neither")
    ap.add_argument("--package", metavar="OUT_DIR", help="build one .skill per repo skill into OUT_DIR")
    ap.add_argument("--engine-path", help="the Video-Engine path written into the location line (default: this folder)")
    a = ap.parse_args(argv)
    if a.package:
        made = package(Path(a.package), engine_path=a.engine_path)
        print(f"{len(made)} package(s) in {a.package}:")
        for m in made:
            print(f"  {m.name}")
        return 0 if made else 2
    if a.check and not a.account:
        import os
        a.account = os.environ.get("LOOM_ACCOUNT_SKILLS")
        if not a.account:
            print(check(None)[1][0])
            return 0
    if not a.account:
        ap.error("give the account skills folder, or --check, or --package OUT_DIR")
    acct = Path(a.account)
    if not acct.is_dir():
        print(f"not a folder: {acct}")
        return 2
    n = len(repo_skills())
    if not n:
        print("0 repo skills found: nothing was compared")
        return 2
    dr = drift(acct)
    if a.json:
        print(json.dumps({"compared": n, "drift": dr}, indent=1))
    else:
        print("\n".join(lines(dr, n)))
    return 1 if dr else 0


if __name__ == "__main__":
    sys.exit(main())
