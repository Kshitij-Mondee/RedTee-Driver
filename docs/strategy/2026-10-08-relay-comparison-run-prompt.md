# Prompt: one Relay lesson on the Shuttle comparison request (2026-10-08)

## Version 2: Relay on the subscription through `claude -p` (supersedes version 1 below)

Kshitij (2026-10-08): "I want the relay session to also be able to use claude -p so that claude can act as the api of
it strictly and not interfere with any result or output and let the pipeline run untouched just like the shuttle
session." So Relay runs on profile `claude-cc` (D-141, runbook section 12a): every Claude role is one `claude -p`
session that sees only its role prompt, its task and its own Relay tools, billed to the subscription (notional
list-price USD logged); the skeptic and critic are Gemini 3.8 Flash on the key, as in Shuttle. For a separate Claude
Code session in this folder. Written by the Shuttle build session.

```
You are the OPERATOR of one Relay run in the Loom Video-Engine folder (C:\Users\Admin\Desktop\Video-Engine).
Windows, Git Bash: `py`, forward slashes. No em or en dashes in anything you write. Logs are append-only; take every
L- and R- id from the log's last entry at the moment you write (other sessions append too). Read CLAUDE.md,
docs/context/README.md and docs/AGENTS_RUNBOOK.md sections 3, 4, 7, 9, 11 and 12a first.

PURPOSE. Kshitij compares two agent pipelines on the SAME lesson request: Relay (this run) and Shuttle (another
session's run, projects/feedback-shuttle-opus). He rates both films pairwise and blind, and compares cost. Claude Code
is only the model API here: each Relay role reaches Claude through `claude -p` with Relay's own prompt and tools.

YOUR ROLE: operator only. Run the commands below, watch, and log what you see. Do NOT edit engine code, prompts,
skills, packs, profiles or the lesson's files; do not fix, patch, re-route, approve by hand or advise the pipeline;
do not use --keep, --redo, --workers or render --force; do not add notes to the lesson. Do not open anything in
projects/feedback-shuttle-opus or projects/feedback-shuttle-s1 (no context from the other film may reach this one).
If the run stops, record where and why and report; Kshitij decides what happens next.

MONEY. Claude roles bill the claude.ai subscription (no API key reaches them: the run stops before any model call if
the CLI reports a key source, and stops with exit 5 if the subscription's limit is reached or the next call would bill
as overage). Real money is only the Gemini skeptic and critic, capped by --budget 3 (expect well under USD 1).
Nothing else may be spent. The subscription's 5-hour window is shared with every other Claude session on the
account, including the Shuttle run.

STEPS
1. Check the setup (free, no model call): `py -m loom agents doctor --profiles claude-cc`. It must show the claude CLI
   with login claude.ai and "profile claude-cc: all models served". If not, STOP and report.
2. Create the lesson with exactly the Shuttle request:
   py -m loom new feedback-relay-cmp --topic "How to give feedback that changes behaviour, not just feelings" --audience "corporate employees" --style story-cartoon --length 2 --persona mentor
3. Run Relay end to end (profile claude-cc: Opus 5.5 writes the brief, teaching plan and script; Sonnet 5.5 the facts,
   persona, outline, storyboard, kit, scenes, clips and tweaks; Gemini 3.8 Flash the skeptic and critic; context
   `cards`; plan checkpoint off by default, D-131):
   py -m loom agents run feedback-relay-cmp --profile claude-cc --until render --budget 3 --approve-knowledge-as "agent, unattended per Kshitij (Relay vs Shuttle comparison, 2026-10-08)"
   Run it in the background with a long timeout (up to 6 hours) and watch logs/agents_run.json, logs/traces/,
   logs/cc/ and logs/llm_calls.jsonl. Exit codes: 0 done, 2 a gate or the check still failing after the repair
   rounds, 3 waiting at a human gate, 4 the Gemini budget, 5 a limit (the subscription window, overage, or a
   provider's credit). On exit 5 from the subscription window only: note the reset time from the last task trace's
   "window" (logs/traces/*.jsonl, event "result"), wait until it has passed, and run the SAME command once more (Relay
   resumes from the stages already accepted); that is the only re-run allowed. On any other exit than 0, do not retry
   or work around it: log it and report.
4. When it ends: `py -m loom agents report feedback-relay-cmp`, then look at qa/sheets/_overview.jpg and frames of
   renders/feedback-relay-cmp.mp4 yourself and describe only what you see (no fixing, no judging against Shuttle).

LOG EVERYTHING (in the folder, not only in the chat)
- projects/feedback-relay-cmp/RUN_LOG.md: the command, start and end times, wall time per stage, every stage's gate
  result (each rejection with its errors and the repair that followed), every model task (role, model, provider,
  turns, tool calls, repairs, resumed or not, status, USD), every check run (errors and warnings, first and last), the
  defects routed per owner per round (qa/defects.json), the critic's findings, engine faults left for a person, the
  render and its verification (qa/render_verify.json), the subscription window seen in the traces, and every error,
  refusal, timeout, retry, limit, escalation and blocker, as seen.
- Costs at every step, from logs/llm_calls.jsonl: rows with provider claude_code are list-price USD with notional
  true and billed_usd 0 (one per model message, plus "reconcile" rows that add the CLI's session total); gemini rows
  are real USD. Give both, never mixed into one number without saying so: by stage, by role, by model, by provider,
  cached versus uncached input, cache writes, output; the run totals (notional, billed, both); cost per minute of film.
- docs/research/2026-10-08-relay-comparison-run.md: the same facts in this table (Relay's column only; the Shuttle
  build session lines it up with Shuttle's report):
  | measure | Relay (this run) |
  |---|---|
  | request (topic, style, length, audience, persona) | |
  | models (planning, storyboard, scenes, kit, skeptic, critic) and how each was served | |
  | total USD: notional (subscription), billed (Gemini), by stage, by role | |
  | model calls, input tokens, cached share, cache writes, output tokens | |
  | wall time, by stage | |
  | gate rejections per stage, repair rounds used | |
  | check errors: first run, final run | |
  | critic findings (blocker, major, minor) and what happened to each | |
  | redo / escalations / resumed fix sessions | |
  | film: duration, beats by kind, kit used or not | |
  | MP4 path, render verification | |
  | issues and blockers (each with where it showed) | |
- docs/context/RUNS.md: one entry (next free R- id). docs/AGENT_LEARNINGS.md: an L- entry only for something that
  went wrong in the pipeline, with its evidence (no fixes in this session).

DIFFERENCES TO STATE IN THE REPORT (part of the comparison, not things to correct)
- Shuttle's lead is Opus for planning AND storyboard; Relay cannot put Opus on the storyboard (D-119, refused in
  code), so Relay's storyboard is Sonnet. The comparison is pipeline plus model placement.
- Both bill the subscription for Claude and the Gemini key for the reviewers, and both log list-price USD for the
  Claude part, priced from the same table.
- Both use the engine as it is today; the Shuttle build session holds its engine fixes until both runs report.

STOP when the report and the logs are written. Then tell Kshitij: exit code, notional and billed USD, wall time, the
MP4 path, and the top issues, in a short message.
```

## Version 1 (superseded by version 2 above: it used profile claude-core on the API key)

For a separate Claude Code session in this folder. It makes the Relay film that is compared, pairwise and blind, with
Shuttle's `feedback-shuttle-opus` (Opus lead, Sonnet sub-agents, subscription). Written by the Shuttle build session.

```
You are the OPERATOR of one Relay run in the Loom Video-Engine folder (C:\Users\Admin\Desktop\Video-Engine). Read
CLAUDE.md, docs/context/README.md, docs/AGENTS_RUNBOOK.md (sections 0 to 11: Relay) and docs/AGENT_LEARNINGS.md
(L-239 onward) first. Windows, Git Bash: `py`, forward slashes. No em or en dashes in anything you write. Logs are
append-only; take every L-, D-, R- id from the log's last entry at the moment you write (other sessions append too).

PURPOSE. Kshitij compares the two agent pipelines on the SAME lesson request: Relay (this run) against Shuttle
(projects/feedback-shuttle-opus, running now). He will rate both films pairwise and blind, and compare cost. So this
run must be Relay as it ships, untouched by you.

YOUR ROLE: operator only. Run the commands below, watch, and log. Do NOT edit engine code, prompts, skills, packs or
the lesson's artifacts; do not fix, patch, re-route or hand-approve anything mid-run; do not use --keep, --redo or
render --force. If the run stops, record where and why and report; Kshitij decides what happens next. Never touch
projects/feedback-shuttle-opus or projects/feedback-shuttle-s1 (another session owns them).

PAID RUN, APPROVED. This run spends real API money (Anthropic and Gemini keys in .env): Kshitij approves up to USD 15
in total for it (estimate USD 4 to 9 for a 2-minute lesson, runbook section 7). Nothing else may be spent.

STEPS
1. Check the setup (free): `py -m loom agents doctor --profiles claude-core`. If a model is not served, STOP and report.
2. Create the lesson with exactly the Shuttle request:
   py -m loom new feedback-relay-cmp --topic "How to give feedback that changes behaviour, not just feelings" --audience "corporate employees" --style story-cartoon --length 2 --persona mentor
3. Run Relay end to end (profile claude-core: Sonnet writes every role, Gemini 3.8 Flash is skeptic and critic, the
   same reviewers Shuttle uses; default context `cards`; plan checkpoint off by default, D-131):
   py -m loom agents run feedback-relay-cmp --profile claude-core --until render --budget 15 --approve-knowledge-as "agent, unattended per Kshitij (Relay vs Shuttle comparison, 2026-10-08)"
   Run it in the background with a long timeout and watch logs/agents_run.json, logs/traces/ and logs/llm_calls.jsonl.
   Exit codes: 0 done, 2 a gate or the check still failing after the repair rounds, 3 waiting at a human gate, 4 budget,
   5 out of credit. On any exit other than 0, do not retry or work around it: log it and report.
4. When it ends: `py -m loom agents report feedback-relay-cmp`, and look at qa/sheets/_overview.jpg and the MP4 frames
   (renders/feedback-relay-cmp.mp4) yourself, describing only what you see (no fixing).

LOG EVERYTHING (in the folder, not only in the chat)
- projects/feedback-relay-cmp/RUN_LOG.md: the command, start and end times, wall time per stage, every stage's gate
  result (each rejection with its errors and the repair that followed), every model task (role, model, turns, tool
  calls, repairs, status, USD), every check run (errors and warnings, first and last), the defects routed per owner
  per round (qa/defects.json), the critic's findings, engine faults left for a person, the render and its verification
  (qa/render_verify.json), and every error, refusal, timeout, retry, escalation and blocker, as seen.
- Costs at every step, from logs/llm_calls.jsonl (real USD at the engine's price table): by stage, by role, by model,
  by provider, cached versus uncached input, output, and the run total against the budget; cost per minute of film.
- docs/research/2026-10-08-relay-comparison-run.md: the same facts in this comparison table, so it lines up with
  Shuttle's report (projects/feedback-shuttle-opus/logs/shuttle/report.md):
  | measure | Relay (this run) |
  |---|---|
  | request (topic, style, length, audience, persona) | |
  | models (planning, storyboard, scenes, kit, skeptic, critic) | |
  | total USD (real), by stage, by role | |
  | model calls, input tokens, cached share, output tokens | |
  | wall time, by stage | |
  | gate rejections per stage, repair rounds used | |
  | check errors: first run, final run | |
  | critic findings (blocker, major, minor) and what happened to each | |
  | redo / escalations | |
  | film: duration, beats by kind, kit used or not | |
  | MP4 path, render verification | |
  | issues and blockers (each with where it showed) | |
- docs/context/RUNS.md: one entry (next free R- id). docs/AGENT_LEARNINGS.md: an L- entry only for something that
  went wrong in the pipeline, with its evidence (no fixes in this session).

DIFFERENCES TO STATE IN THE REPORT (they are part of the comparison, not things to correct)
- Shuttle's lead is Opus (planning and storyboard); Relay cannot put Opus on the storyboard (D-119, refused in code), so
  this run uses Sonnet there. The comparison is pipeline plus planning model.
- Shuttle bills the claude.ai subscription and logs list-price USD (notional); Relay bills the API keys (real). Both
  are priced from the same table, so compare them as list-price dollars.
- Both runs use the engine as it is today; the Shuttle build session holds its engine fixes until this run reports.

STOP when the report and the logs are written. Then tell Kshitij: exit code, total USD, wall time, the MP4 path, and
the top issues, in a short message.
```
