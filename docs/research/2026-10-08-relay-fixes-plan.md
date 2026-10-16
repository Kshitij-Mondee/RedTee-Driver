# Fixing what the Relay comparison run found (2026-10-08)

Kshitij, after R-35 (`feedback-relay-sb`, exit 2, no film): "Plan thoroughly and finally fix every single issue and
verify". This plan names each issue, its root cause (measured, with the evidence), the fix, the test that must be red
before and green after, and how the whole is verified. Learnings L-324 to L-328; decisions D-142, D-143.

## The issues and their causes

| # | issue (where it showed) | root cause (evidence) | fix |
|---|---|---|---|
| 1 | 36 of the 70 final errors, "unknown colour token none", never fixed (checks 1 to 5) | `runtime/style.js` `S.c("none")` raises `unknown_token` and returns **ink**: `fill: "none"`, valid SVG for "no fill", paints the shape solid ink. The kit part `meeting_room` (`scenes/_kit.js:267`) used it | `S.c` returns `"none"` for `none` and `transparent` (no error). Test: a kit path with `fill: "none"` draws no fill and raises nothing |
| 2 | defects drawn by the lesson kit went to the scene workers or the engine list; the kit's author never saw them (routing, every round) | the router has owners script, storyboard, scene, engine: no `kit`; probe errors carry only code, message and beat; a scene worker's `fix_route: "kit"` report was dropped | the runtime wraps every `Loom.lesson.<part>` at boot and tags each error raised inside it with `part`; the router sends any error with a `part`, and any `fix_route: "kit"` report, to a new owner `kit`; the conductor gives the kit worker its fix rounds (resuming its session) and re-checks. Tests: a part's error carries `part`; the router routes it to `kit`, a scene's own error to `scene`; a conductor repair runs the kit role |
| 3 | b09: the right quiz option never marked, every option dimmed; "Why not B?" where the story meant A (final sheet) | `quiz.answer` counts options from 0 (`i === p.answer`); the storyboard wrote `answer: 3` for the third of three options and `tempting: 1` for the first; no gate checks an index against its list | schema key `index_of` (answer, tempting, also -> options; chart.bars highlight -> series; hub-and-spoke signals.to -> satellites); the props gate refuses an index outside its list and says indices start at 0; the template reports `index_out_of_range` at runtime too. Tests: answer 3 of 3 options refused, answer 2 accepted |
| 4 | three, then five, check passes with nothing fixed (checks 3 to 5, 16 min) | `repair()` sets `changed = True` whenever scene fixes are requested, even when every job is refused as "fix rounds used up" | `scenes(fixes=...)` reports whether any worker ran; `repair()` counts only owners that ran; with nothing run it returns "failed" (exit 2 at once). Test: with every round used up, repair returns "failed" and no check re-runs |
| 5 | notional cost: a resumed session counted twice ($0.97), every Sonnet 5.5 task about 2x (24 reconcile rows) | measured on the real CLI against the mock: on a resume `total_cost_usd` and `modelUsage` are **cumulative for the session**; CLI 2.1.283 has no `claude-sonnet-5-5` in its binary and reports `costBasis: "unknown"`, pricing it high; the per-message rows carried every token (Claude Code's own transcript agrees token for token) | reconcile from the CLI's `modelUsage` tokens, minus what the session already accounted (kept in the session file), priced from models.json; a reconcile row only adds tokens the stream did not report, with those tokens. The trace records `costBasis`. Tests: on the mock, a first run and a resume add no phantom reconcile; a missing message's tokens are reconciled once |
| 6 | the `sonnet` alias served `claude-sonnet-5` while the profile named and priced Sonnet 5.5 (first attempt) | an alias resolves to whatever the CLI build knows; nothing compared the served model with the alias's id | `cc-opus` pinned to `claude-opus-5-5` too (D-142 pinned Sonnet); cc_runner stops a task whose first message comes from another model than its alias's id (`served_model_mismatch`); doctor prints each claude_code alias's CLI name. Test: a mock that answers as another model is stopped with that error |
| 7 | the design seed read the Shuttle film of the comparison (stdout, design seed block) | `recent_seeds` reads the last 5 lessons on disk | `py -m loom new ... --isolated` (project.json `isolated: true`): an isolated lesson reads no other lesson for its seed and is read by none. Test: an isolated lesson's seed ignores a sibling, a normal one sees it, and no lesson sees an isolated one |
| 8 | one critic pass only; its minors never routed; fixes never judged (critic table) | `self.reviewed` allows one pass; the router drops minors (D-119's rule: blocker and major) | the critic looks again after the first repair round (a second and last pass), and every finding, minors included, goes to its owner (D-143, superseding that part of D-119 on Kshitij's "fix every single issue"). Test: the conductor runs the critic twice when the first pass found something, and routes a minor |

Not engine faults (the models' work in that film): b01's blank beat that came back, b12's overlapping text, b05's
connector. They are judged again by the second critic pass and the checks, and routed to their owners.

## Verification
1. Each fix has its test, red on the code before (recorded in `docs/research/relay_fixes/red_runs.txt`) and green after.
2. The offline suite (`py tests/run_tests.py`, with `--browser`) passes; `py tools/context_check.py` passes.
3. A fresh Relay run of the same request on profile `claude-cc-opus-sb`, created `--isolated`, to the render; the
   operator looks at the contact sheets and the MP4's frames and logs it like R-35.

## Status (2026-10-09, appended)
- Items 1, 2, 4, 5, 6, 7 and 8: fixed by this work, each with its test (`tests/suites/relay_fixes.py`), red before
  (or shown failing with the fix switched off) and green after; record `docs/research/relay_fixes/red_runs.txt`.
- Item 3 (the quiz index): fixed by another session minutes before this work's red run (L-321); the test confirms it.
- Found while verifying, on the isolated rerun `projects/feedback-relay-v2`, and fixed the same way:
  L-335 (an overlap the check reported was not on screen: `qa.painted_overlaps`), L-336 (a bespoke scene's own inset
  went to the engine list), L-337 (option letters written twice), L-338 (a quiz answer with other options than its
  question; the critic reading page turns as seams), L-339 (a scene-only fix left the check "done", so the critic
  judged old pictures).
- The live run showed each fix working: no phantom reconcile rows ($0.0679 brief against $0.1258 before), "recent
  lessons: none", Opus and Sonnet 5.5 by full name, kit defects to the kit's author, no empty re-check passes, the
  second critic pass, the gates refusing the storyboard's quiz mistakes on resume.
