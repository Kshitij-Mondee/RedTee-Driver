# Running Loom through API agents (outside Cowork) - runbook

STATUS: SHIPPED 2026-10-06 (D-115). Proven on mock providers only; the first real calls are the bench below. Design:
`docs/strategy/2026-10-06-agent-architecture.md`.

## 0. Keys
One file: `Video-Engine/.env` (gitignored). Lines (only the ones you have):
```
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...
```
Keys are read at call time, sent only in each provider's auth header, and never written to a log.

## 1. Check the setup (free: no model calls)
From the Video-Engine folder, in Git Bash or PowerShell:
```
py -m loom agents profiles
py -m loom agents doctor
```
`doctor` asks each provider with a key for its own model list and checks every profile against it. Any line that says
`is NOT served` means a model id in `loom/agents/config/models.json` is wrong or not enabled on your account: fix
that id before spending money. `doctor` exits 1 when anything is wrong.

## 2. The model bench (paid; capped)
The same 2-minute topic through several model combinations, planning stages only (brief to storyboard), each into
its own project, gated stage by stage:
```
py -m loom agents bench --topic "How to give feedback that changes behaviour, not just feelings" --style story-cartoon --length 2 --until storyboard --budget 10 --provider-cap 5
```
- `--profiles` picks the combinations (default: all five: claude-balanced, openai-balanced, gemini-balanced,
  mixed-value, budget). A profile whose key is missing is listed as skipped.
- `--budget` is a hard cap in USD for the whole bench; `--provider-cap` caps each provider. A call whose worst case
  could cross a cap is never sent; the profile then stops with exit 4 and the report says so.
- Estimated cost: about $0.50 to $2 per profile to storyboard on a 2-minute topic (an ESTIMATE from token counts
  of the role cards and the demo lesson's artifacts; no real call has been made yet).
- Output: `bench/<run>/REPORT.md` (gates, repairs, tokens, cost, time, devices and value script per profile),
  `bench/<run>/results.json`, `bench/<run>/llm_calls.jsonl`, and one project per profile under `projects/bench-...`.
- The knowledge sheet is approved as "agent, unattended bench" so the bench can reach the storyboard. These lessons
  are for comparing models, never for shipping.

Judging: gate results are facts; quality is not. Open each profile's `plan/outline.json` and
`plan/storyboard.json`, or run `py -m loom animatic <project>` for a picture of the plan, and choose by looking.

## 3. One lesson through agents
```
py -m loom new my-lesson --topic "..." --audience "..." --style corporate-clean --length 2
py -m loom agents run my-lesson --profile mixed-value --until storyboard --budget 3
# the run stops at the knowledge sheet: read plan/knowledge.json, then
py -m loom approve my-lesson knowledge --by "Kshitij"
py -m loom agents run my-lesson --profile mixed-value --until render --budget 6
```
Exit codes: 0 done, 2 a gate failed after repairs (see `logs/agents_run.json` and `logs/traces/`), 3 waiting at a
human gate, 4 budget stop.
`py -m loom agents report my-lesson` prints cost, tokens and time per role.

## 4. Where everything is logged
- `projects/<id>/logs/llm_calls.jsonl`: every call (role, model, tokens, cached, thinking, USD, latency).
- `projects/<id>/logs/traces/<task>.jsonl`: every turn and tool call of every agent task.
- `projects/<id>/logs/agents_run.json`: the task results of the last run.
- `projects/<id>/logs/decisions.jsonl`: the decision ledger (D-97), as in agent mode.

## 5. Changing models or prices
- Models and prices: `loom/agents/config/models.json` (each entry names the page and date its price came from).
- Combinations: `loom/agents/config/profiles/*.json` (role to model alias; `effort` per role; `escalate` to name a
  stronger model a role may retry on once). Opus is refused on the storyboard by code.

## 6. Not yet run through agents
- (superseded 2026-10-07, section 10: Manim, Skia and Three beats now have clip workers on the API path.)
- `media` beats (no agent writes them; the storyboard is refused at submit if it asks for one).
- Tweaks (the role card and tool exist; no CLI entry yet).

## 7. One video per model combination (2026-10-06)
`tools/agents_combos.sh` (Git Bash) or `tools/agents_combos.ps1` (PowerShell) makes the same 2-minute lesson once per
combination, each into `projects/combo-<profile>`, through to the MP4:
```
bash tools/agents_combos.sh                                   # claude-balanced, openai-balanced, claude-openai-value, two-key-budget
bash tools/agents_combos.sh claude-openai-value               # one combination
TOPIC="..." STYLE=story-cartoon BUDGET=6 bash tools/agents_combos.sh openai-balanced
.\tools\agents_combos.ps1 -Profiles two-key-budget -Budget 6   # PowerShell
```
- The four default profiles need only the Anthropic and OpenAI keys. `claude-openai-value` and `two-key-budget` were
  added for a two-key account (Sonnet always writes the storyboard; Opus never does). If `doctor` shows a working
  Gemini key, `gemini-balanced`, `mixed-value` and `budget` can be named too.
- `--approve-knowledge-as` approves the knowledge sheet unattended in the name you give, so the run reaches the
  render. Read each `plan/knowledge.json` before sharing a video.
- Cost per video: an ESTIMATE of $4 to $9 for a 2-minute lesson, most of it the scene workers; `--budget` (default 9)
  refuses any call that could cross it. Four videos fit inside $40 split across two keys.
- What is proven: every stage on mock providers, and one run from a storyboard through the scene workers to compose
  (`agents_chain_runs_from_a_storyboard_through_scenes_to_compose`). Not proven: a real provider call, check and
  render inside a conductor run (they are the same code stages Cowork uses).
- Compare: `py -m loom agents report combo-<profile>` (cost, tokens, time per role) and the MP4s side by side.

## 8. From a bench project to a video, and what the first real bench changed (2026-10-06)
- A bench project stops at the storyboard with its knowledge approved. Continue it with the same profile:
  `py -m loom agents run <bench project id> --profile <profile> --until render --budget 6`.
- Judge: `bench/<run>/REPORT.md` and `py -m loom agents report <id>` for cost and reliability; `py -m loom animatic <id>`
  for the plan; the MP4s, `qa/sheets/_overview.jpg` and `py -m loom strips <id>` for the film; rubric section 8.
- Provider limits found by the real bench (D-118, L-230): GPT-6.x go through the Responses API; Haiku 4.5 gets budgeted
  thinking; an agent that has written nothing is nudged at half its turns and forced to submit on its last two.

## 9. Parity with Cowork, and defects sent back to their owners (2026-10-06, D-119)
- `--context parity` gives every role the stage's whole Cowork reading list (skills, guide, catalogue, prompt pack) as
  one cached prefix; `--context cards` (the default until the A/B below says otherwise) keeps the short role cards.
- Scene workers must look before they submit: `lab_snapshot(times, source)` writes the draft, renders the beat and
  returns its runtime errors. A draft that is never accepted is taken back off disk.
- A failed check no longer ends the run. Each defect goes to its owner (`loom/agents/router.py`): the storyboard's
  author for template, blueprint and avatar beats (it answers with `patch_storyboard`, only the changed scenes), the
  beat's own worker for bespoke scenes, the script's author for narration reported by others (`patch_script`). The
  owner's saved session (`logs/sessions/`) is resumed, so its earlier work is read from the provider cache. Engine
  faults (a template's own padding or contrast, sample text, unlocated errors) are written to `qa/defects.json` for a
  person and never sent to a model. Two fix rounds per owner (`--repair-rounds`), all inside `--budget`.
- The picture critic's blocker and major findings go through the same router.
  Since D-143 every finding goes, minors included, and the critic looks a second time after its first findings were
  fixed: only at the beats that changed, with its earlier findings to re-check. After that, a verify-only look at the
  beats the last fixes changed: a blocker stops the render, anything less is written to `qa/review_final.json` (L-346).
  Errors raised inside a part that `scenes/_kit.js` defines carry `part` and go to the kit's author (owner `kit`).
- The storyboard may draw a beat the allocation made a template when it writes `upgrade_reason` (at most 25 %).
- Existing projects work too: with no saved session, a new fixer gets only the defect list and reads beats with tools.
- The A/B (one lesson, two contexts): see the CHANGELOG entry of 2026-10-06 "pipeline parity" for the commands.

## 10. What the bench post-mortem changed (2026-10-07, `docs/research/2026-10-07-bench-fix-report.md`)
- **Length.** The pedagogy, script, outline and storyboard task messages carry the requested length; the plan must state
  `pacing.requested_s`; the script is held to 1.3 times the request and about 8 beats a minute; `narrate` refuses a
  narration past 1.3 times the request (the stage is marked rejected).
- **Overrides leave a trace.** `--keep` logs an `override` in the decision ledger for every accepted stage today's gate
  would refuse (with its error count). `mark_done` by hand on a rejected stage is logged the same way.
- **Forced renders (D-124).** `py -m loom run <id> render --force --reason "why this build ships despite its check"`:
  the reason is required, the build must be the one the check saw (`qa/report.json` carries its hash), and a build with
  a thrown scene or frame callback is refused outright. Segments made from another build are dropped before a render,
  and a render whose verification compares nothing, or finds more than 10 % of frames different, fails.
- **Scene workers see their context.** The task names the elements they may hold (names, kinds, the beat that drew
  them), the previous and next beats' narration and elements, and the cast (one look per person).
- **Clip workers.** Storyboard beats of kind `manim`, `skia` or `three` with no file get a clip worker (role `clip`):
  it renders a draft through its bridge (`render_clip`), looks at the frames, and `submit_clip`; a submit before a
  render is refused.
- **The storyboard looks at its animatic once** after its first accepted submit (one panel per beat, nine to an image)
  and either patches beats or calls `storyboard_stands` (logged). One round; the CLI has no switch for it (tests use
  `Conductor(storyboard_look=False)`).
- **The mix is a ceiling.** An agents run sets `request.mix_as = "ceiling"`: any template-allocated beat may be drawn
  (no upgrade reason, no 25 % cap). The bench report states each kind's share and the capabilities the scenes used.
- **Discovery.** `capabilities(group)` lists everything the engine draws (generated from `// @capability` lines in
  `runtime/*.js`, the catalogue, rigs, world packs and the clip renderers: `runtime/capabilities.md`).
  `get_example_scene` reaches the lab, Manim, Skia and Three examples; SCENE_API's sub-topics are headings.
- **The critic** sees every sheet (batches of 40), each beat's narration and props, and a polarity rubric (which side is
  right or wrong); it runs when the check failed too, and its findings join the same repair round.
- **Router.** `blurred_beat` and foreign pixels go to the engine; an element off frame or a cropped figure goes to the
  storyboard when the beat's own shot causes it, else to the scene; a thrown scene goes to its bespoke author, or to the
  engine for a template.

## 11. Relay improvements (2026-10-08, D-129; `docs/strategy/2026-10-08-pipeline-architecture.md`)
The API pipeline is now called **Relay**; **Shuttle** (one lead agent on rails) is designed in
`docs/strategy/2026-10-08-shuttle-pipeline.md` and not built yet.
- **Plan checkpoint (off by default, D-131).** A run goes straight from the storyboard to the kit and the scenes. With
  `--plan-gate` it stops with exit 3 before them and writes `qa/approvals/plan.md` (length, beats by kind, the animatic
  sheets); approve with `py -m loom approve <id> plan --by "<name>"`, or add `--approve-plan-as "<who>"` to record an
  unattended approval. Any later change to the script or storyboard makes an approval stale.
- **Lesson kit.** A storyboard may declare `kit.parts` (`{id, what, states, beats, size}`): one kit worker (role `kit`;
  the profile's scene model unless it names a `kit` model) writes `scenes/_kit.js` before the scenes; compose loads it
  before every beat; scene workers get the kit's parts, API note and source, and report kit problems with
  `fix_route: "kit"`. The kit gate is `loom/checks/kit.py` (run inside the scenes gate). Not yet: a kit preview strip.
- **The real model in the ledger.** Gate and decision records written during an agents task name the model that ran
  (L-268), not the tier default.
- **Cache misses** (a seen prefix that read 0 cached tokens) are counted per task in the trace and the `model_call`
  record, and printed.
- **Libraries.** Storyboard and scene agents can reach `Loom.physics`, `Loom.brush` and `Loom.orb` through
  `capabilities` (`docs/research/2026-10-08-motion-libraries.md`).

## 12. Shuttle: one lead agent on rails (2026-10-08; design `docs/strategy/2026-10-08-shuttle-pipeline.md`)
Shuttle runs beside Relay (sections 0 to 11 stay as they are). One lead agent owns the lesson through Claude Code
headless (`claude -p`), works only through loom-mcp (`loom/shuttle/server.py`), follows the playbook
`skills/loom/shuttle-director`, and gives facts, the kit, beats, clips and fixes to sub-agents (`shuttle/agents/`).
Platform facts it relies on: `docs/research/2026-10-08-shuttle-platform.md`.

**Runners (D-165, 2026-10-12).** `--runner loom` (the default) runs the lead and its sub-agents as Shuttle's own agents on any
provider (`loom/shuttle/loop.py`; Anthropic, OpenAI, Gemini; `--mode api`, the keys in .env): the same rails, tools, playbook,
sub-agents and session plan. `--lead` and the presets name any `loom/agents/config/models.json` alias (Opus only where a decision
lets it); a preset's `agents` sets the sub-agents' models (`--preset gemini-pro` runs the whole lesson on Gemini 3.1 Pro, with
Claude or OpenAI as the skeptic and critic). `--runner cli` is Claude Code (`claude -p`) as below, the only way to bill the
claude.ai subscription. Both write the same logs (`calls.jsonl`, `trace.jsonl`, `stream_<group>.jsonl`, `report.md`).

**Run, wait, resume:**
```
py -m loom new my-lesson --topic "..." --audience "..." --style story-cartoon --length 2
py -m loom shuttle run my-lesson --mode subscription --budget 15
# exit 3: a person looks at qa/approvals/<kind>.md, then
py -m loom approve my-lesson facts --by "Kshitij" --notes "drop the 70 percent claim"
py -m loom shuttle resume my-lesson
py -m loom shuttle status my-lesson     # phases, what each lacks, budget, reopens
py -m loom shuttle report my-lesson     # logs/shuttle/report.md: cost by phase and sub-agent, reopens, refusals, looks
```
- **Modes.** `--mode subscription` (default): the child has no ANTHROPIC_* or CLAUDE* variable, so Claude Code uses the
  claude.ai login; the run stops before any model call if the CLI reports another key source. `--mode api`: the key
  from .env, `--max-budget-usd` as a backstop. `--lead sonnet` (default) or `--lead opus` (subscription; on the API, Opus is for the storyboard through
  `--preset sonnet-only`, D-164).
  `--runner sdk` uses the Claude Agent SDK when it is installed (not yet: its download needs approval).
- **Budget.** `--budget` USD (in subscription mode the list price of the tokens, notional), `--budget-tokens`,
  `--budget-calls`; per lesson, across resumes; resume with a higher `--budget` to lift a budget stop.
- **Approvals.** facts (P2), plan (P6), final (P11, after the render). `--approve-as "agent, unattended per <who>"`
  records unattended approvals instead of waiting (it must say "unattended").
- **Reopens (D-144: only what changed is redone).** A reopen marks only its own phase stale; each later phase re-checks
  itself and opens only when something it depends on changed (stage input hashes, plan hashes, kit preview, each beat
  file's storyboard scene and kit parts, the critic's build, the render). `reopen('P5', why, beats=[...])` (or P4) patches
  only those beats, voids no approval, cap 8; a whole reopen voids the approvals from that phase on, cap 3. A beat file
  is fixed in place by a fixer or a scene-author in P8 to P10, no reopen. When the lead stops with a cap used, a person
  can lift it: `py -m loom shuttle grant-reopen my-lesson --by "Kshitij" --why "..."`, then `resume`; the lead still
  chooses what to reopen and fixes it itself. The grant is logged as the person's decision.
- **The toolbox (D-146, as Relay's D-137 to D-140).** The lead and the building sub-agents carry the toolbox menu;
  `use_tool([...])` loads a tool's section (three: the 3D model list); a beat whose storyboard scene names `tools` hands
  them to its author; device beats are `device_shot` presets the lead changes with `set_device(beat, ..., why)`.
  `LOOM_TOOLBOX=off` removes it for an A/B.
- **Leads per session (D-145).** With `--lead opus`, the build session (P7 to P9) runs on Sonnet; planning and
  critique stay on Opus. `--build-lead same` keeps the run's lead everywhere, `--build-lead opus|sonnet` sets the build.
  A `lead_by_group` key is a range of phases, so with one session per phase P7, P8 and P9 each run on Sonnet.
- **Less context for the lead (D-148, D-150).** Sessions by the "mixed" split (`session_split` in config.json, the
  default since D-150: P1 to P4 and P5 to P6 in one session each, one per phase from P7; `"phase"` one per phase;
  `"group"` P1-P4, P5-P6, P7-P9, P10-P11); each starts from the playbook, and its first message carries the status and
  the notes; its loom-mcp lists only its phases' tools and its sub-agents'. A reopen of an earlier phase ends the session (its handoff says what to
  change; that phase's own session does it); a session past its phase gets 6 more lead messages, then the launcher ends
  it. A session that changed nothing is resumed once with what is missing; one that made progress is not a failed try;
  at most 6 sessions per phase in one run. `delegate` stores the whole brief in `logs/shuttle/briefs/<token>.md` and
  returns a short spawn prompt; the sub-agent reads its brief with `read_artifact('brief:<token>')` (in parts when long).
  `delegate(jobs=[...])` and `collect(token='all')` make a check round three lead turns; `check` composes first.
  No sub-agent writes before it has read every part of its brief (`collect` shows `brief_read`); one that asks for a later
  part first is handed the first part it has not read, with a note (L-411). A scene author's task names the elements the
  next beat takes from its beat by name (the CONTRACT WITH THE NEXT BEAT), and its look holds submission until they exist;
  a held_missing for a name its own storyboard keep takes from the previous beat is shown as waiting on that beat and does
  not hold it (L-409, D-159). Pictures:
  `contact_sheet` defaults to `overview` (up to 9 beats, at the size the lead saw before D-148), `detail='full'` shows up
  to 3 beats, each frame about 1.7 times as wide; `frames` is full by default. A smaller sweep is a setting
  (`pictures.overview_px`), not the default, until a shadow run shows no loss (CLAUDE.md rule 13). The kit-builder's
  task lists the engine's places and objects (`Loom.place`, `Loom.obj`) as an option, never a requirement.
- **Opus plans by default (D-158).** A subscription run with no --preset, --lead or --build-lead uses `opus-plan`: Opus leads
  P1 to P5 (brief, facts, teaching plan, script, storyboard), Sonnet leads P6 to P11. `--preset sonnet-only` or `--lead sonnet`
  choose otherwise.
- **Model presets (D-153).** `--preset sonnet-only` runs every session on Sonnet except P5 (the storyboard), its own
  session on Opus; sub-agents stay Sonnet and the reviewers Gemini. Presets live in config.json `model_presets`; a session
  never mixes models. Subscription mode only (no Opus on the API path).
- **Cheaper rounds (D-150).** Sub-agents send `edits` ({old, new}) after their first draft (lab_snapshot, kit_preview,
  render_clip; submit_kit takes the last previewed draft). With `--lead opus` (critique on Opus, build on Sonnet), P10
  alternates: the judge decides the critic's findings and hands the fixes over with `plan_fixes`, a fix round on Sonnet
  delegates and checks them and reports `fixes_done`, the judge then re-runs the critic and submits the review. A beat
  that removes, at load, what an earlier beat drew in an element it holds is a check error on that beat
  (`held_content_removed`). The render's verification runs four frames at a time.
- **One beat, one rewrite (D-145).** A kit change made for one beat leaves the others calling the part "to verify":
  the next check keeps the clean ones as they are and sends only a flagged beat to a fixer.
- **Pilot (lessons with a kit).** P8 starts with the first continue join's two beats and `pilot_check` (probe and layout on
  a private copy of the build); the other beats are delegated after it passes on the current kit.
- **Who checks overlap and contrast (D-154).** By default Loom's own checker, inside the runtime probe (seconds): text
  overlap seen by a viewer (a clash, or a cut where one text is partly covered), a text partly covered by an opaque card
  (`text_covered`), the same words drawn again on themselves (`text_redrawn`: a warning in the check, an error at the
  pilot join, where the kit can still change to carry its parts), and WCAG contrast twice per beat; its lines read `lc layout|contrast <code> @ <t>: <beat> ...`. A text
  seen nowhere, under a real blur, or marked `data-layout-allow-overlap` is not judged. HyperFrames' check stays a
  choice: `LOOM_CHECKER=hyperframes`, or `shadow` (both run, HyperFrames gates, the agreement goes to
  `qa/checker_shadow.json`), or `"check": {"checker": ...}` in the lesson's project.json. Proof:
  `docs/research/2026-10-10-loom-checker-reliability.md`.
- **The check at draw time (D-157).** A scene author's `lab_snapshot` returns `check_errors` (its beat's own: overlap, covered,
  off card, a line through an object, contrast, type size, words cut), `check_warnings` and `shared_with_other_beats`; the own errors
  hold the submission like runtime errors do (a kit part's error is reported with fix_route "kit"; after the hold cap the file is taken
  and the check routes what is left). Shared findings never hold. A Shuttle run refuses to start when the render browser has no WebGL
  (`py -m loom doctor`; `LOOM_ALLOW_NO_WEBGL=1` runs anyway). Runs compare phase by phase with `py tools/run_compare.py <a> <b>`.
- **Critic.** A later `critic_review` judges only beats whose contact sheet changed or whose blocker or major is open,
  with the earlier findings and the accepted ones; nothing changed means no model call.
- **Models and costs.** `loom/shuttle/config.json` `model_ids` pins the lead's `--model` and every sub-agent to a full id
  (the CLI's `sonnet` served claude-sonnet-5). Each session's per-model token gap is filled from the CLI's `modelUsage`,
  priced from models.json; the report also gives the CLI's own total, each session counted once. A subscription session
  stops on a rejected window or on overage.
- **Exit codes** as Relay: 0 done, 2 failed (a phase still not accepted after two sessions in a row that changed nothing,
  or after 6 sessions in one run), 3 waiting for a person, 4 budget, 5 the account's limit (resume after it resets).
- **What a run writes:** `logs/shuttle/` (`state.json` the rails, `trace.jsonl` every tool call and session event,
  `calls.jsonl` every model call with its real model and agent, `notes.md` the lead's handoff, `briefs/`,
  `stream_<group>.jsonl` the raw CLI stream, `server.log`, `hook_denials.jsonl`, `report.md`), plus the usual
  `logs/llm_calls.jsonl` and the decision ledger (one `tool_call` record per call, naming the caller's model).
- **Sub-agent files are generated:** `py -m loom shuttle agents --emit claude|sdk|both` writes
  `.claude/agents/shuttle-*.md` and `shuttle/build/agents.json` from `shuttle/agents/*.md` (each run does it too).
- **Proof without paid calls:** `py tools/shuttle_s0.py` drives the real launcher and `claude -p` with a scripted
  model on the mock server (results in `docs/research/shuttle/s0/`); `py tests/run_tests.py --only shuttle` runs the
  rails tests.

## 12a. Relay on the subscription: provider `claude_code` (2026-10-08, D-141)
Relay as in sections 3 to 11, with each role task served by Claude Code headless instead of an API call:
```
py -m loom agents doctor --profiles claude-cc      # free: the claude CLI, its claude.ai login, the Gemini key
py -m loom agents run my-lesson --profile claude-cc --until render --budget 3 --approve-knowledge-as "agent, unattended per <who>"
```
- **What the model sees:** the role's own system prompt (Claude Code's is replaced; the CLI adds one identity line),
  the task message (and images), and only the role's Relay tools as `mcp__relay__<tool>`. No built-in tools, no
  CLAUDE.md, no memory, no skills or slash commands. The session runs in `%TEMP%/loom_cc/<lesson>`.
- **Billing:** the child environment has no API key, so the claude.ai subscription serves Claude roles; the run stops
  before any call if the CLI reports another key source, and stops (exit 5) on a rejected limit or overage, as Shuttle.
  The Gemini skeptic and critic in `claude-cc` bill the Gemini key: that is what `--budget` caps.
- **Costs:** `logs/llm_calls.jsonl` rows with `provider: claude_code` are list price, `notional: true`,
  `billed_usd: 0` (one per model message, plus a `reconcile` row against the CLI's session total). The 5-hour
  subscription window is shared with every other `claude` session on the account, including a Shuttle run.
- **Per task:** `logs/cc/<task>/` (system.md, task.json, mcp.json, state.json, server.log), `logs/traces/<task>.jsonl`
  (each model message, its tools and usage, and the result), and `logs/sessions/<role>.json` (`cc_session_id`).
- **Offline proof:** `py tests/run_tests.py --only agents_cc_` (the real CLI against the mock server, a fake key).
- **Opus on the storyboard only (D-142):** `--profile claude-cc-opus-sb` puts Opus 5.5 on the storyboard outline and
  the storyboard and Sonnet 5.5 on every other written role (the code included); Gemini still reviews. It and
  `claude-core-opus-sb` (the same split on the API, D-162) are the profiles allowed Opus there, through their
  `opus_storyboard` field. `cc-sonnet` calls the CLI with the full name
  `claude-sonnet-5-5`: the `sonnet` alias served `claude-sonnet-5` on 2026-10-08. Check the `model` field of the
  `claude_code` rows in `logs/llm_calls.jsonl` to see what actually served a role.
- **Since D-143 (after R-35):** cc-opus calls `claude-opus-5-5` by its full name too, and a task answered by another
  model than its alias's id stops with `served_model_mismatch`. The notional cost is the per-message rows plus only the
  tokens the CLI's `modelUsage` counted beyond them, priced from models.json; the CLI's dollar total (cumulative on a
  resumed session, and an estimate for a model the CLI build does not know, `cost_basis: "unknown"` in the trace) is
  not used. `agents report` prints `usd_notional` and `usd_billed`. For a comparison, create the lesson with
  `py -m loom new <id> ... --isolated` so its design seed reads no other lesson and no other lesson reads it.

## 13. The toolbox and the 3D models on the API path (2026-10-08, D-137, D-138; `docs/TOOLBOX.md`)
- **The menu** (physics, brush, orb, three, skia: when to pick each, when not, cost) is in the cached prompt of the
  storyboard, scene, clip, kit and tweak roles. **`use_tool(names)`** returns a tool's section (for `three`, with the
  live 3D model list): code, no model call, logged as a `tool_load` decision.
- **Hand-over:** a storyboard scene's `"tools": ["physics"]` (or a `three`/`skia` kind) puts those sections in the
  beat's scene, clip or kit task. The storyboard gate refuses a name that is not a tool.
- **3D clips** start from `assets/models3d` (`await X.model(id, opts)`); `py -m loom models` lists them,
  `py -m loom models check` gates them, `py -m loom models sheet [ids] [--style s]` draws their turntable sheets.
- **Resumable Three.js renders:** an interrupted clip keeps its finished frames and continues (`LOOM_FRAMES_ROOT`
  puts that scratch on a fast local disk).
- **A/B (paid; not run yet):** `py tools/toolbox_ab.py prepare mfa-explained` (done once: `projects/ab-mfa-explained-on`
  and `-off`), then run the storyboard in each arm (the off arm with `LOOM_TOOLBOX=off`; commands in the script's
  docstring) and `py tools/toolbox_ab.py compare ab-mfa-explained-on ab-mfa-explained-off`; then look at both
  animatics.
- **Shuttle:** its sub-agents can already read `get_skill_section("TOOLBOX", "<tool>")`; `use_tool` and the menu are
  not wired into `loom/shuttle/server.py` yet (that file was in flight in another session; left untouched).

## 14. Topic packs and swappable devices (2026-10-08, D-139, D-140)
- **Device beats are params:** the storyboard plans `{"kind": "three", "three": {"preset": "device_shot", "params":
  {"device": ..., "screen": ...}}}`; no clip worker runs for it (nothing to write). After the storyboard, a person runs
  `py -m loom device <id> <beat> <device> [--screen JSON] [--mood m]`, and the tweak agent has `set_device`; both
  validate against the preset's card and log a `device_swap`. The storyboard gate checks a preset beat's params.
- **Model packs, moods and recipes:** listed by `use_tool(["three"])` and `use_tool(["physics"])` etc.;
  `get_example_scene("model:<id>")` returns one model's file with its full card, `"preset:<id>"` a preset.
- **Repairs:** a check or critic defect in a device beat is routed to the storyboard (it patches the params); a throw
  inside the preset goes to the engine.
- **Shuttle:** not wired to `use_tool`, `set_device`, the menu or presets yet; its agents can read
  `get_skill_section("TOOLBOX", "<tool>")`.


## 15. Relay upgrade: one vision, honest tools, one world (2026-10-10, D-155; `docs/research/2026-10-10-relay-upgrade.md`)
- **The film card** (`conductor.film_card`): the brief's intent, the concept, world, cast, devices, value bands and every
  beat in one line, at the top of every scene, kit, clip, critic and fixer message (the same text a lesson, cached).
  Any role reads more with `read_artifact` (`film`, plan files, `storyboard:<key>`, `scene:<beat>`).
- **Snapshots:** `lab_snapshot(times, source | edits)`; times are seconds on the LESSON clock inside the beat (the
  phrase timings' clock); a time outside it is refused with the beat's span. Sheets: one or two frames large, three or
  four in a 2 x 2 grid, each labelled with its time. `submit_scene` holds a file whose last look threw (twice at most;
  a kit part's error goes to the kit with `report_finding` fix_route "kit").
- **The kit** is drawn with `kit_preview(source | edits)` before `submit_kit` takes it. With a kit and three or more new
  bespoke beats, a **pilot pair** is written first; its kit reports send the kit back before the others start, and its
  pictures go to the others as THE LOOK SO FAR.
- **Craft notes** (`runtime.craft_notes`): each role's style guide sections and its card's skill sections, preloaded.
- **Gate one_world:** no `scenario.dialogue` or `hero.*` on a station the bespoke beats draw.
- **Logs:** `logs/cc/<task>/calls.jsonl`, one line per tool call (claude_code provider).
- **Mix:** an illustrated style on the classic mix prints that `--mix cinema` exists; both stay, the person chooses.

## 16. Reuse or build, per style (2026-10-12, D-163; `docs/strategy/2026-10-12-reuse-or-build.md`)
- **The rule:** the storyboard (Relay's task, Shuttle's `get_style_pack` `kept_library`) sees the kit parts and bespoke beats
  earlier lessons of the same style built, and writes `"reuse": "<id>"` on a kit part or a bespoke scene where one fits;
  otherwise it builds. Never another style's piece (D-122).
- **A reused part** loads as is under the lesson's part id, before the kit (compose writes `build/scenes/_kept.js`; the kit
  preview loads it too); the kit-builder never writes it and may call it. **A reused beat** is its author's starting code.
- **Keeping:** at `py -m loom approve <id> final` (Shuttle's last step) and when a Relay run finishes its render with every
  gate passed, the engine keeps every kit part and bespoke beat the lesson built (a reuse only counts a use). An isolated
  lesson (`--isolated`, comparisons) neither sees nor feeds the library.
- **By hand:** `py -m loom kept list [--style S]`, `py -m loom kept keep <lesson> [--force]` (seed from an earlier approved
  lesson), `py -m loom kept remove <id>`.

