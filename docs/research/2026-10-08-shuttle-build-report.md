# Shuttle build report (2026-10-08, D-135)

Asked: build Shuttle, the single-lead-agent pipeline of `docs/strategy/2026-10-08-shuttle-pipeline.md`, beside Relay;
verify the platform first; prove it without paid calls (S0); stop before S1 and S2. Relay is untouched and still the
default. No paid model call and no subscription run was made: every model reply below came from Loom's mock server.

## 1. What was built

| piece | where | what it does |
|---|---|---|
| rails | `loom/shuttle/rails.py` | the lesson state machine: P1 to P11 accepted by the engine's own gates (`flow.status`, `checks/*`) plus what only Shuttle records (skeptic verdict, outline, animatic, kit preview, accepted beat files, critic); approvals facts, plan, final; `reopen` (stale marks, versions kept, approvals voided, tokens revoked, cap 3); budget per lesson (USD, tokens, calls), per phase and per sub-agent from `logs/shuttle/calls.jsonl`; owner tokens (files, phases, tools, a call cap). State in `logs/shuttle/state.json` |
| loom-mcp | `loom/shuttle/server.py` | MCP over stdio (JSON-RPC, written here: the `mcp` package is not installed); 49 tools; every call checks the rails first and answers a refusal that names the missing step; the engine functions are Relay's (`loom/agents/tools.py`) and the engine's (`flow`, `qa`, `story`, `lab`, `router`, `strips`); every call is traced and logged in the decision ledger with the caller's real model; lesson-state tools run one at a time; its prints and children go to `logs/shuttle/server.log` and never touch the protocol's pipes |
| new tools | same | `kit_preview` (the kit lab strip, `loom/shuttle/kitpreview.py`) required by `submit_kit`; `request_approval`; `reopen`; `accept_phase`; `budget_status`; `delegate` (with the engine's context block for the beat, built by Relay's `task_message`) and `collect`; `contact_sheet`, `frames`, `strips`; `skeptic_review` and `critic_review` (Relay's roles on another model family); `read_artifact`; `get_world_pack`; `choose_persona` |
| approvals | `loom/flow.py`, `loom/cli.py` | `py -m loom approve <id> facts` (or `plan`, `final`) `--by ... --notes ...`; every approval writes `qa/approvals/<kind>.json` with its time (compared with reopen times) and the person's notes (handed to the lead on resume) |
| playbook | `skills/loom/shuttle-director/SKILL.md` | the lead's procedure: phases with short reading lists and definitions of done, delegation (brief, token, spawn in the foreground, collect), what each sub-agent's brief adds, when to look, when to reopen and when not, the recurring failures from AGENT_LEARNINGS as rules, approvals and budget |
| sub-agents | `shuttle/agents/*.md`, `loom/shuttle/agents.py` | fact-finder, kit-builder, scene-author, clip-author, fixer, researcher: a Shuttle frame each plus Relay's shared rules and role card (one contract for both pipelines); `py -m loom shuttle agents --emit claude` (or `sdk`) writes `.claude/agents/shuttle-*.md` and `shuttle/build/agents.json` (generated) |
| hook | `loom/shuttle/hook.py` | PreToolUse: no Write or Edit into lessons, generated files or RedTee; no shell write into a lesson; no approval and no forced render by an agent; a sub-agent's loom write needs its token; `--strict` (every launch) denies any engine write and any shell. Records each loom call's caller by tool-use id |
| launchers | `loom/shuttle/launch.py`, `loom/shuttle/sdk_runner.py` | `py -m loom shuttle run`, `resume`, `status`, `report`, `agents`; one `claude -p` per phase group from the playbook and `notes.md`; stream-json parsed into `logs/llm_calls.jsonl` and `logs/shuttle/calls.jsonl` (real model, agent, tokens, notional USD in subscription mode); the child environment scrubbed; the key source checked before any call; exit codes 0, 2, 3, 4, 5 |
| engine fixes found on the way | `loom/manim_bridge.py`, `skia_bridge.py`, `three_bridge.py`, `loom/flow.py` | a lenient compose skips clip files not written yet (it ended every parallel snapshot; Relay's parallel workers had the same hole) |
| mock server | `loom/agents/llm/mock_server.py` | Anthropic streaming as server-sent events (`anthropic_stream`), Claude Code's system-role messages, images priced like the API |
| proof | `tests/suites/shuttle_rails.py` (15), `tools/shuttle_s0.py` | below |

## 2. The platform, verified (STEP 1)
Full notes: `docs/research/2026-10-08-shuttle-platform.md`. What changed the design:
- **API mode needs no SDK.** The Python Agent SDK drives the same `claude` binary with the same flags, so API mode is
  the launcher with the key in the child's environment and `--max-budget-usd` as a backstop. `--runner sdk` is written
  against the SDK's documented interface and is unverified (installing it needs Kshitij's approval).
- **A key in the environment silently beats the subscription login** (`claude auth status`: `apiKeySource:
  ANTHROPIC_API_KEY` with the claude.ai login present). Subscription mode drops every ANTHROPIC_* and CLAUDE* variable
  and stops before any model call if the init message reports a key.
- **Sub-agents run in the background by default** in CLI 2.1.283; Shuttle turns that off and spawns in the foreground.
- **Claude Code neither drains an MCP server's stderr nor keeps the server's children off its stdin**: both blocked
  loom-mcp in S0 until the server isolated its stdio.
- **A hook cannot add a field to a tool's input** (it is schema-checked), but the CLI sends the hook's tool-use id in
  the MCP call's `_meta`; the hook's caller record is matched by that id.
- `--max-turns`, `--append-system-prompt-file` are hidden flags that exist; agent front matter takes `maxTurns`,
  `background`, `effort`.

## 3. Tests (offline) and red runs
`tests/suites/shuttle_rails.py`, 15 tests: out-of-phase refusal; the approval pause; reopen invalidation (and its cap);
the budget stop (lesson and sub-agent, and the launcher's guard); ownership (beats, tools, phases, one writer per
file, tokens from the wrong thread); a draft is not an accepted beat; the hook (11 decisions, strict mode, the CLI's
stdin/stdout contract); the kit gate red and green (a real lab strip on this PC); the two sub-agent targets agree; the
subscription child's environment; the stream ledger and the key-source guard; loom-mcp over stdio; children never
touch the protocol; the mock's streaming and image pricing; the lenient compose. Each was run with its rail mutated
out (or on the old code) and went red: `docs/research/shuttle/red_runs.txt` (0 problems).

The full suite after the build: without `--browser` 256 passed, 0 failed, 27 skipped (each skip named: Chrome, vision
lab, cairo); with `--browser` 272 passed, 2 failed, 9 skipped. The two failures are not Shuttle's:
`primitive_brush_paints_the_same_marks_and_reveals_them_in_order` failed before this work too (another session's brush
test); `mock_llm_match_filters_and_unmatched_fallback` passed in the first run and 3 of 3 times alone, and failed once
under the browser run's load because the mock records a request after sending its reply, so the test can read the list
before the last request lands (an old race in the mock, not fixed here). `py tools/context_check.py`: OK.

## 4. S0: the real launcher and `claude -p`, driven by a scripted model
`py tools/shuttle_s0.py` (2026-10-08 11:06:17, 3365 s): Claude Code 2.1.283 ran with an empty config folder, a fake key and its
base URL on the mock; the scripted lead and seven sub-agents walked the demo lesson's artifacts (spacing-sticks, under a
new id) from P1 to P11 through the launcher's own code. Evidence: `docs/research/shuttle/s0/` (results, trace, model calls,
rails state, report).

| after | exit | current | waiting | stop |
|---|---|---|---|---|
| run (P1 to the facts approval) | 3 | P2 | facts |  |
| resume after facts | 3 | P6 | plan |  |
| resume after plan | 4 | P10 |  | budget |
| resume with a raised budget | 3 | P11 | final |  |
| resume after final | 0 | done |  |  |

**15 of 15 cases hold:**

| case | holds | observed |
|---|---|---|
| skip a gate: the lead's storyboard in P1 is refused, naming P1 | yes | submit_storyboard belongs to P5 (storyboard); P1 (brief) is not accepted yet: stage brief is pending |
| no file tools: the lead's Write never runs (Claude Code has no such tool in the session) | yes | a Write tool_use is in the stream; plan/brief.json is the gate's: Right after their next training, the viewer schedules three  |
| the lead writes no beat: its submit_scene is refused | yes | submit_scene is written by a scene-author sub-agent: delegate('scene-author', ...) gives it an owner token, and it passes that token as `owner` (the lead never writes a beat, the kit or the fact sheet itself) |
| a sub-agent cannot write another beat: b05's token refused for b10 | yes | beat b10 is not this token's (it owns b05) |
| a sub-agent without its token is denied by the hook (Claude Code reported its type) | yes | {"tool": "mcp__loom__submit_scene", "agent": "shuttle-scene-author", "why": "submit_scene: pass your owner token as `owner` (the brief from the lead names it)"} |
| the storyboard is reopened once, P5 to P11 stale, the plan approval voided | yes | {"at": "2026-10-08T11:06:45.798931", "phase": "P5", "reason": "S0: after the animatic, b03 is re-cut (scripted reopen)", "by": "lead", "stale": ["P5", "P6", "P7", "P8", "P9", "P10", "P11"], "versions": {"storyboard": "167e210a0a", "scenes": null, "outline": "0 |
| the budget stops the run once (exit 4), and a raised budget resumes it | yes | [{"event": "budget_stop", "detail": "usd 41.84 of 25.0 used for the lesson", "why": null}, {"event": "session_killed", "detail": null, "why": "budget: usd 41.84 of 25.0 used for the lesson"}] |
| three approvals pause the run (exit 3): facts, plan, final | yes | ["facts", "plan", "final"] |
| every phase accepted at the end (exit 0) | yes | {"P1": "accepted", "P2": "accepted", "P3": "accepted", "P4": "accepted", "P5": "accepted", "P6": "accepted", "P7": "accepted", "P8": "accepted", "P9": "accepted", "P10": "accepted", "P11": "accepted"} |
| seven sub-agents (facts, two scenes, two clips, two fixers) worked through owner tokens, each accepted and collected | yes | {"own-fact-finder-1": ["collected", ["submit_knowledge"], 0], "own-scene-author-b05-1": ["collected", ["submit_scene"], 1], "own-scene-author-b10-1": ["collected", ["submit_scene"], 1], "own-clip-author-b06-1": ["collected", ["submit_clip"], 1], "own-clip-auth |
| every model call is in the ledger with its real model; sub-agents' calls carry their agent | yes | {"calls": 69, "agents": ["lead", "shuttle-clip-author", "shuttle-fact-finder", "shuttle-fixer", "shuttle-scene-author"], "models": ["<synthetic>", "claude-sonnet-5", "mock-gem", "mock-strong"]} |
| every tool call is in the decision ledger with the caller's model | yes | {"tool_calls": 66, "with_model": 66, "models": ["claude-sonnet-5", "sonnet"]} |
| the first check fails, two fixers fix their beats in P9, the second check passes | yes | ["fail", "pass"] |
| the hook's caller records reach the server (sub-agent identity cross-checked) | yes | {"calls_with_hook_record": 66, "calls": 66} |
| no real provider was reached (every request answered by the mock) | yes | {"requests": 76, "by_provider": {"anthropic": 74, "openai": 1, "gemini": 1}, "unmatched": []} |

Model calls in the ledger: 69 (critic 1, lead 52, shuttle-clip-author 4, shuttle-fact-finder 1, shuttle-fixer 4, shuttle-scene-author 6, skeptic 1); requests the mock answered: 76 (anthropic 74, openai 1, gemini 1); unmatched: 0. Tool calls: 66, refused by the rails: 3. The USD figures in the trace are the mock's token counts at list prices: they say nothing about a real lesson's cost.

After this run, three ledger details were tightened (and the first two checked by a second S0 up to P2): a sub-agent's
first tool call named its alias (`sonnet`) because the stream had not yet shown its model (now recorded at its first
message, with the lead's model as the fallback for the same alias); one `<synthetic>` row (Claude Code's own stop
notice, $0) is now traced instead of logged as a call; and a session the launcher kills (the budget stop) now flushes
its last message. The mock answered 76 requests and the ledger holds 69 rows: the killed session's unflushed message
explains part of the gap; the rest is not traced to a cause (unverified, likely the CLI's compaction attempt after
the inflated usage).

## 5. Not verified
- No real model has run Shuttle: the lead's judgement, its cost, its cache reads and the quality of the film are
  unknown until S1 and S2.
- The real text of a usage-limit stop (exit 5) has not been seen; the launcher reads a `rate_limit_event` with status
  rejected, or an error result naming a limit or a 402/429.
- The SDK runner (`--runner sdk`).
- `strips` and `frames` inside a session: the scripted lead never calls them; both were run directly on a composed copy of
  the demo and returned real pictures (looked at), as did `contact_sheet`, which S0 does call.
- The PreToolUse hook's file rules inside a real session: the lead has no file tools at all, so S0 could only show the
  CLI refusing the Write itself; the hook's file rules are proven by their tests, its loom rules in S0.

## 6. Next: S1 and S2 (not run; each needs Kshitij's go)
The last Relay run's request (bench 20261007-003835): "How to give feedback that changes behaviour, not just
feelings", story-cartoon, 2 minutes, corporate employees, teaching, mentor.

**S1, one subscription lesson** (bills the claude.ai subscription; the other-family skeptic and critic bill their API
keys, about $0.05 to $0.50 together, an ESTIMATE):
```
py -m loom new feedback-shuttle-s1 --topic "How to give feedback that changes behaviour, not just feelings" --audience "corporate employees" --style story-cartoon --length 2 --persona mentor
py -m loom shuttle run feedback-shuttle-s1 --mode subscription --lead sonnet --budget 25
py -m loom approve feedback-shuttle-s1 facts --by "Kshitij" --notes "..."
py -m loom shuttle resume feedback-shuttle-s1
py -m loom approve feedback-shuttle-s1 plan --by "Kshitij" --notes "..."
py -m loom shuttle resume feedback-shuttle-s1
py -m loom approve feedback-shuttle-s1 final --by "Kshitij" --notes "..."
py -m loom shuttle report feedback-shuttle-s1
```
`--budget 25` is notional (the list price of the tokens); it stops the run, not a bill. Each `run` or `resume` stops
with exit 3 at an approval: look at `qa/approvals/<kind>.md` (facts: `plan/knowledge.json`; plan: the animatic sheets
`qa/shuttle_animatic_*.jpg`; final: `renders/feedback-shuttle-s1.mp4`) before approving. Judge it pairwise and blind
against Relay's film of the same request (`projects/bench-20261006-151439-claude-balanced-fix1007/renders/`), within
story-cartoon (D-122). `--lead opus` is allowed in this mode if you choose it.

**S2, API mode, cost measured** (bills the Anthropic key; an ESTIMATE of $4 to $10 for a 2-minute lesson, design
section 1):
```
py -m loom new feedback-shuttle-s2 --topic "How to give feedback that changes behaviour, not just feelings" --audience "corporate employees" --style story-cartoon --length 2 --persona mentor
py -m loom shuttle run feedback-shuttle-s2 --mode api --lead sonnet --budget 10
```
then the same approvals and resumes; `py -m loom shuttle report feedback-shuttle-s2` gives the cost by phase and by
sub-agent from the real calls.
