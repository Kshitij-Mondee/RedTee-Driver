Run the Relay pipeline on the API for the https-private idea, as the operator only, and compare it with the two Shuttle runs.

Kshitij (2026-10-12): "I want to run the relay pipeline with the same video idea - https-private and see what it makes and
comes up with ... claude api credits are refilled so i want the relay pipeline to use api." Then: "no let it use opus for
storyboading." (D-162: profile `claude-core-opus-sb`.)

Read first: CLAUDE.md, docs/context/README.md (STATE, DECISIONS, RUNS), docs/AGENT_LEARNINGS.md, docs/AGENTS_RUNBOOK.md
sections 0 to 4, 11 and 15, and projects/https-private-v2/RUN_LOG.md (the setup to copy).

Approval: Kshitij approves paid Anthropic API calls (Opus on the storyboard, Sonnet elsewhere) for this one run, capped at $25 for the whole run (`--budget 25`). The
Gemini skeptic and critic bill the Gemini key inside the same cap. Nothing else paid, no other runs, no downloads.

1. Free checks (no model calls): `py -m loom agents doctor --profiles claude-core-opus-sb`, and the full suite with the browser
   (`py tests/run_tests.py`, HYPERFRAMES_BROWSER_PATH set). Note any failure in the RUN_LOG before launching. If doctor says
   a model is not served or the Anthropic key is missing, stop and tell Kshitij.
2. Create the lesson with the https-private request word for word, isolated so it can be compared:
   ```
   py -m loom new https-private-relay --topic "How HTTPS keeps your data private" --audience "corporate employees" --genre teaching --length 2 --style corporate-clean --persona analyst --voice af_heart --voice-provider kokoro --avatar none --mix cinema --isolated --notes "Pure motion graphics on a clean corporate background (the style's plain light field): no cinematic sets, no hand-drawn or textured look, no presenter. Mostly the system itself in motion: a browser and a server, data packets travelling, a certificate being checked, keys being exchanged, data scrambled and unscrambled, the padlock. Technical but clean and beautiful: crisp shapes, clear labels, purposeful motion. Any engine library may be used where it serves the idea."
   ```
   Check `projects/https-private-relay/project.json` against `projects/https-private-v2/project.json` (request block):
   only the id, the dates and the voice speed (calibrated in the run) may differ.
   It is isolated on purpose: it neither reuses from nor feeds the style library (`assets/kept`, D-163), so the film is
   Relay's own work. Expect no `reuse` in its storyboard and nothing kept at the end; that is correct, not a fault.
3. Write `projects/https-private-relay/RUN_LOG.md` (setup, the exact commands, the engine state, what differs from the
   Shuttle runs: Relay's roles and profile claude-core-opus-sb: Opus 5.5 writes the storyboard outline and the storyboard, Sonnet 5.5
   every other written role, Gemini skeptic and critic; D-162), and add a "MEASURED RUN IN FLIGHT" line to docs/context/STATE.md so other sessions keep
   the shared engine files still. Fingerprint the shared engine files at launch as the Shuttle runs did.
4. Launch, unattended in Kshitij's name:
   ```
   py -m loom agents run https-private-relay --profile claude-core-opus-sb --until render --budget 25 --approve-knowledge-as "agent, unattended per Kshitij (https-private on Relay via API, 2026-10-12)"
   ```
   Run it in the background and watch it; do not poll in a tight loop.
5. Operator only (memory: pipeline test runs are operator only): no edits to the engine or the lesson and no added
   context mid-run. A fault that would cost the run a lot of time or money is fixed and logged as an intervention
   (`py -m loom note https-private-relay --kind override ...`) and in the RUN_LOG. If the budget stops it (exit 4), stop
   and report; do not raise the cap without Kshitij.
6. After it ends: `py -m loom agents report https-private-relay`; look at the contact sheets and at least 20 frames of the
   film (renders/https-private-relay.mp4) before saying anything about quality, within corporate-clean only (styles are
   never compared with each other, D-122). Compare with https-private and https-private-v2 stage by stage: time, calls,
   tokens (cached), USD, checks and their errors, rework. tools/run_compare.py reads Shuttle logs only: extend it to read a
   Relay lesson (logs/llm_calls.jsonl, logs/traces, logs/agents_run.json) with a test, then write
   docs/research/2026-10-12-https-private-relay-comparison.md with it. Name what is not verified (not listened to, one run).
7. Close: RUN_LOG result, RUNS.md entry, AGENT_LEARNINGS entries for anything that went wrong (with the gate or instruction
   that now prevents it), DECISIONS only if a decision was made, remove the in-flight line from STATE.md,
   `py tools/context_check.py`. Read the next free R-, L- and D- ids at write time (other sessions append to the same
   logs). Then report to Kshitij: the film path, cost and time against both Shuttle runs, what Relay did differently in the
   script and the storyboard, and what you would fix.

No em or en dashes in anything you write. Never hand-edit generated files. Logs are append-only. RedTee_V1_Video is read-only.
