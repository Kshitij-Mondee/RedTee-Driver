"""Red runs for the R-52 fixes: each test with the old behaviour put back in-process must FAIL, then PASS restored.
    py docs/research/relay_upgrade/red_runs_r52.py   (from the engine root)"""
import io
import subprocess
import sys
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests" / "suites"))
import relay_upgrade as U  # noqa: E402
from loom import compose as CP  # noqa: E402
from loom import flow as FL  # noqa: E402
from loom import util as UT  # noqa: E402

_run_code = FL.run_code


def old_run_code(project, name, **kw):
    """before R-52: every compose, a snapshot's too, marked the stage done"""
    _run_code(project, name, **kw)
    if name == "compose":
        FL.mark_done(project, name, passed=True)


def old_run_tree(args, cwd, env, timeout, capture):
    """before R-52: subprocess.run, which waits on a grandchild's pipe after a timeout"""
    return subprocess.run(args, cwd=cwd, env=env, timeout=timeout, capture_output=capture, text=True, encoding="utf-8", errors="replace")


CASES = [
    ("check_a_snapshot_compose_never_counts_as_the_compose", "a snapshot compose marks compose done", FL, "run_code", old_run_code),
    ("check_a_seam_between_worlds_takes_the_styles_join", "the seam is always a fade (R-49)", CP, "seam_join", lambda style, a, b: "fade"),
    ("check_a_timeout_ends_the_call_even_when_a_grandchild_holds_the_pipe", "plain subprocess.run", UT, "_run_tree", old_run_tree),
]


def run(name):
    buf = io.StringIO()
    try:
        with redirect_stdout(buf):
            return True, str(getattr(U, name)())[:200]
    except Exception as e:  # noqa: BLE001
        return False, f"{type(e).__name__}: {str(e)[:200]}"


lines, bad = [], 0
for name, what, mod, attr, old in CASES:
    keep = getattr(mod, attr)
    setattr(mod, attr, old)
    try:
        ok_m, why_m = run(name)
    finally:
        setattr(mod, attr, keep)
    ok, why = run(name)
    good = (not ok_m) and ok
    bad += not good
    lines.append(f"{'OK ' if good else 'BAD'} {name}\n    mutation ({what}): {'PASS (not red!)' if ok_m else 'FAIL'} {why_m}\n    restored: {'PASS' if ok else 'FAIL'} {why}")
lines.append("--  primitive_runtime_joins_never_hold_a_blank_frame: red on a runtime copy with the old cover curve and lead "
             "(LOOM_TEST_RUNTIME): dip opacity 0.9996, 1, 1, 1 at 0.40 to 0.50; first element after a cut at 10.9 s")
out = Path(__file__).with_name("red_runs_r52.txt")
out.write_text("\n".join(lines) + f"\n\n{len(CASES) - bad} of {len(CASES)} red with the mutation and green restored\n", encoding="utf-8")
print(out.read_text(encoding="utf-8"))
sys.exit(1 if bad else 0)
