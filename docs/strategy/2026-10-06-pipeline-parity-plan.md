# Pipeline parity plan: the API pipeline at Cowork quality, cheaply (2026-10-06)

STATUS: PARTIAL (built and proven on mock providers 2026-10-06, D-119, L-241; the live one-lesson A/B is not run yet).
Requested by Kshitij after bench 20261006-151439 (L-239, L-240).

## Standing decisions
- **No Opus anywhere in the pipeline for now** (Kshitij, 2026-10-06): the point is to see what the other models
  can do. The code refusal on storyboard roles stays.
- Keep both ways: the role-card path stays as an option (`--context cards`); parity becomes the default only
  after the one-lesson test below shows it is better.

## Why the pipeline is below Cowork (measured on bench 151439)
| Gap | Evidence |
|---|---|
| Role cards (6 KB) instead of the stage's full skills | storyboard task in Cowork: about 181 KB (about 45k tokens) of skills, guide, catalogue; pipeline prefix 17.5 KB. Claude's storyboard fetched 2 skill sections, outline 2 |
| Scene writers never look | Sonnet's 24 scene workers: 0 skill sections, 0 snapshots; 4 scenes throw, 6 empty frames |
| A failed check ends the run | all five stopped at check; the critic never ran |
| The script writer's score caps new scenes | L-240: gemini 0, openai 1, mixed 3 bespoke |
| Same style for all five | the bench fixes `story-cartoon`, mentor, classic mix (bench.py), by design, not said |

## Changes (all code, no API cost to build)
1. **Parity context.** Each agent's system prefix is the same reading list as the Cowork task file
   (`loom/agent/tasks.py`, `Stage.skills`) plus the role card's output contract. Prefix is identical for every
   task of a role, so it caches: Anthropic `cache_control`, OpenAI automatic prefix cache, Gemini implicit cache.
   Sizes per stage (chars / 4, an estimate): brief 5k, pedagogy 9k, persona 4k, script 23k, storyboard 45k,
   scenes 44k, review 14k tokens.
2. **Look before submit.** `submit_scene` is refused until the worker has called `lab_snapshot` on the current
   file at least once (and again after an edit).
3. **Defect router (send the bug back to its owner).**
   - Every check error and critic finding becomes a record `{beat, code, element, detail, owner}`.
   - Owner table: template or blueprint props, held elements, joins, icons, words cut on a template -> storyboard;
     anything inside a bespoke scene file -> that beat's scene worker; a fact or narration problem -> script;
     a template or runtime fault with valid props -> engine (logged for a human, never sent to a model).
   - Each agent's conversation is saved when it submits (`logs/sessions/<task>.json`, provider-native messages
     incl. OpenAI encrypted reasoning). A fix resumes that conversation with one message listing only its
     defects; the prefix and history are cache reads, not a fresh run.
   - Downstream agents report upstream defects with `report_finding(fix_route=<stage>)`; the conductor batches
     them per owner, between stages, never mid-call.
   - After a fix, only what changed is redone: storyboard scene specs are hashed per beat; a changed spec re-runs
     that beat's scene worker (resumed, not fresh); compose and check are code.
   - Bounds: 2 fix rounds per owner per run, inside `--budget`; what is left is reported with its owner.
   - Cache lifetime: Anthropic 5 minutes by default. The storyboard and script sessions use the 1-hour cache
     (2x write price) because their fixes arrive after narration and scenes.
4. **Storyboard may upgrade a beat.** A beat allocated `template` may become bespoke or blueprint when the scene
   carries `upgrade_reason`; capped at 25 % of beats; the gate warns instead of erroring.
5. **Bench varies or declares style.** `--style` per run, printed in the report header.
6. **Proof before rollout.** One lesson, same topic, same profile, `--context cards` vs `--context parity`;
   frames side by side, cost from `llm_calls.jsonl`. Parity becomes the default only if it wins on frames.

## Estimated effect (estimates, unverified until step 6)
Cost per 8-minute, 54-beat lesson on claude-balanced (today $3.62 measured: planning $2.12, scenes $1.50):
- storyboard and outline prefix: about +$0.35; script and planning: about +$0.10;
- scenes: about +$1.40 (44k-token prefix, about 4 cache writes then reads) and about +$0.50 for snapshots;
- defect router: about +$0.30 to $0.80 (resumed sessions are mostly cache reads);
- upgrades: about +$0.15 per added Sonnet scene.
Total about $6.5 to $8 for this length. Flash-scene profiles rise less (Flash cache reads are $0.075 per Mtok).
Length is the largest driver: these lessons ran 5 to 11 minutes against a 2-minute request.
