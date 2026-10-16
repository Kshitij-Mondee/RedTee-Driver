# Prompt for the next session (rewritten 2026-10-02, end of R-24: step 7 and the corporate plan)

Paste everything below the line into a new Cowork session with the Video-Engine, RedTee_V1_Video and Characters
folders connected. This file is a handoff note, not a log: replace it at the end of each session.

---

You are continuing work on **Loom**, my code-rendered L&D video engine in `C:\Users\Admin\Desktop\Video-Engine`.
That folder is the canonical copy of everything. Before doing anything else:

1. Read:
   - `CLAUDE.md`, then `docs/context/README.md` and `docs/context/STATE.md` (especially "Open work");
   - the last entries of `docs/context/DECISIONS.md` (D-88 to D-94);
   - `docs/AGENT_LEARNINGS.md` run 22 (L-161 to L-167);
   - `docs/context/RUNS.md` R-24;
   - `docs/research/2026-10-02-step7-review.md` and `docs/strategy/2026-10-02-corporate-readiness-plan.md`.
2. Tell me in five lines what you understood the current state to be, and what is unverified.

**Standing rules (mine, they never expire):**
- Never change or sync anything into `RedTee_V1_Video`. It is read-only.
- Logs are append-only: supersede, never delete (CHANGELOG, AGENT_LEARNINGS, DECISIONS, RUNS, RUN_LOGs).
- Do it with tooling and prove it by running something. A claim with no command behind it is unverified;
  say so. When numbers and frames disagree, the frames win.
- Write every finding, decision, plan and prompt into Video-Engine, not only in chat or a sandbox.
  The repo `skills/` are canonical; Cowork account skill copies follow them.
- Research is a reference, never a checklist or fixed template. No unnecessary skill edits: change a
  skill only when a finding earns it, and tell me exactly what changed.
- Corporate adult learners, not teacher-like: get things through. Interesting, learner-friendly, but
  pedagogy respected. Keep both the classic and the new ways; I choose.
- Think long term, including running Loom outside Cowork (`docs/PORTABILITY_CHECKLIST.md`).
- Downloads need my approval. Study reference videos, never republish them. Never bypass a blocked fetch.
- Windows-first: `py`, forward slashes in Git Bash.
- Sandbox care (L-123): never copy whole projects or video folders into the sandbox or /tmp; work on the
  mounted folders and keep sandbox scratch small. Background jobs die between sandbox calls and calls are capped
  near 3 minutes, so run long work as short resumable calls (L-132). If heavy work (renders, whisper, browser tests) is
  needed, give me the exact commands to run on my PC and read the outputs with file tools.
- Finish every task you start and close the session with: context docs updated, `py tools/context_check.py`
  and `py tests/run_tests.py` results (mine or yours), and this file rewritten for the next session.

**Where things stand (verify, do not trust):**
- **Step 7 is made and reviewed, but NOT rendered.**
  - Lessons: `projects/feedback-that-lands` (corporate-clean, Maya v5 as manager, 7:10) and
    `projects/phishing-report` (cinematic-noir, `--mix cinema`, 7:00).
  - Chrome check in the sandbox: 0 errors each. Sheets are in `qa/sheets/`; findings are in `qa/review.json`.
- **The verdict (`docs/research/2026-10-02-step7-review.md`):** the writing is right, the pictures are not sellable
  yet.
  - Every pack draws people as beans and objects at icon detail.
  - The plain lesson's middle is slides.
  - Maya clashes with code-drawn rooms.
  - The best frames are artefacts (email, worksheet, inbox, funnel city), annotated.
- **Engine fixes this run (all proven):**
  - station residue switched off;
  - the reading floor sees camera exits;
  - `m.travel` is exact and seek-order independent (a Chrome test fails on the old code);
  - holds act on `life`;
  - `quiz.answer` has `also_why` and `takeaway`.
- **Maya v5** is imported as rig `maya` (`tools/rig_import.py`, D-93): 20 poses. She has no walk or seated pose yet.
- **The plan (D-94, DESIGN), six phases:**
  - 0: render and watch;
  - 1: artefact-first plain register (`Loom.ui`, `Loom.type`, pack `briefing`, maturity tells);
  - 2: templates that fill the frame;
  - 3: one cast in one drawing language;
  - 4: checks for occlusion, station residue, empty or repeated frames, and auto-hold;
  - 5: SCORM/xAPI, brand, source mode, accessibility, measured cost;
  - 6: the demo kit.
  - Track A (the cinema pilot) moves behind phases 1 and 2.
- **Tests:** 77. In the sandbox: 69 passed, 7 skipped, and 1 failed (the STATE test count, since fixed and passing).
  The Chrome travel test passed on its own. `context_check` OK.

- **Priority (mine):** the videos to at least 95 % of their potential, visually and as L&D. The final goal (speed,
  cost, decision models such as Jev, Sonnet writing drawing code, a modular brain like RedTee) is recorded in
  `docs/strategy/2026-10-02-final-goal.md` (D-95). Do NOT build it yet; only avoid making it harder.

- **PC results (2026-10-02):**
  - Check: feedback 7 errors, phishing 47 (40 are chapter-overlay false positives).
  - Both MP4s rendered, but not watched yet.
  - Tests: 73 passed, and 4 failed on a missing cairo library (now named skips).
  - Triage: step 7 review section 7.
- **Brain:** my own design, `docs/strategy/2026-10-02-brain-architecture.md` (D-96). Ask me for the order before
  building any of it.

- **Logging (D-97):** the engine writes the decision ledger itself. Log every fix, deviation, routing or tooling
  choice you make outside a task with `py -m loom note`, and set `LOOM_ACTOR` for sub-agents. Never cut a step or
  its thinking for cost (final-goal rule 0).
- **The phishing MP4 is measured:** motion 47 %, event gap 9 s, a blank frame at 05:45. The feedback MP4 is not
  measured yet.

- **Both step 7 lessons were REJECTED after Kshitij watched them** ("AWFUL"). Read
  `docs/research/2026-10-03-frame-audit.md` first. The plan is D-99: a 60 s golden segment per lesson, to his bar,
  before anything else scales. Never call a lesson good without his look at the MP4.

- **D-100 is built (R-25):**
  - film strips and previews;
  - `Loom.ui` artefacts;
  - viewpoint, scale and pack-level extras;
  - layering and join fixes;
  - `Loom.cam.frame`;
  - film checks (empty, repeated, overlay, type size, cut words, scale).

  The two golden segments (phishing b17 to b21, feedback b37 to b41) wait for Kshitij to watch them rendered on the
  PC. Start by asking for his verdict on them. The film checks flag shipped beats outside the segments (STATE).

- **Parked next step (Kshitij, 2026-10-03):** fix the rest of both lessons, feedback first. See STATE "NEXT STEP".
  Nothing outside the golden segments was rebuilt.

- **Vision lab (D-101):** `tools/vision_lab/`. If a bundle is in `docs/research/vision/inbox/`:
  - ingest it first (`py tools/vision_lab/vl.py ingest <zip> --into docs/research/vision`);
  - read `calibration/report.json` before trusting anything.

- **Visual maturity (D-102), E1 built (D-103):**
  - Kshitij rates the golden set with `py -m loom golden serve` (66 frames, about 10 minutes).
  - Read `py -m loom golden report` before E2. Look at:
    - the class means (reference against rejected and new);
    - his own consistency on the 6 repeats;
    - which tags dominate the low scores.
  - No new figurative code-drawing until E2 has been run.

**What to do this session, in order:**
1. Ask me for the PC outputs of phase 0:
   - `py -m loom run feedback-that-lands check` and `py -m loom run phishing-report check` (these include the
     HyperFrames layout pass, which the sandbox skipped);
   - then `py -m loom run feedback-that-lands render` and `py -m loom run phishing-report render`;
   - `py tests/run_tests.py --browser` and `py tools/context_check.py`.

   Watch the MP4s with me, and add a "watched" section to the step 7 review.
2. Ask me the five decisions at the end of the corporate plan. Do not start phase 1 without my yes.
3. Then phase 1 (with phase 4 items 1, 2 and 4 alongside). Reference boards first (D-87). Every new builder gets a
   lab scene, a Chrome strip and a test that can fail.
4. Still open from before:
   - vendor sets on the PC (`py tools/fetch_assets.py`, task 98);
   - Maya walk and seated poses from Claude Design;
   - Track A after phases 1 and 2.
