# WS5: which tools the agents called in the five bench runs (bench-20261006-151439)

Measured 2026-10-07, read-only. Projects: `projects/bench-20261006-151439-{claude-balanced, openai-balanced, gemini-balanced, mixed-value, budget}`.
Nothing under `projects/`, `runtime/`, `loom/`, `tools/` or `tests/` was modified. Every number below comes from the scripts named in "Method"; nothing is estimated by hand.

## Key numbers

- 91 agent tasks (one trace file each), 598 model turns, 1208 tool calls across the five projects. 89 tasks have an end event (80 accepted, 9 stopped at limits); 2 have none (mixed-value `storyboard-9eaa7143`, budget `pedagogy-939b56ca`).
- No `critic` and no `tweak` task ran in any of the five projects. gemini-balanced ran no scene worker at all (its last trace is the storyboard task).
- 43 scene workers: claude-balanced 24, budget 14, mixed-value 4, openai-balanced 1, gemini-balanced 0.
- Arguments were recovered for 1024 of the 1098 non-terminal tool calls (all calls except the 110 `submit_*`): every `get_api_section` (198/198), `list_skill_sections` (65/65), `get_example_scene` (97/97), `get_catalog_entry` (177/177), `get_beat` (112/112), `get_fact` (86/86), `get_style_pack` (39/39), and 238 of 239 `get_skill_section`. Not recovered: 25 of 31 `catalog_search`, 2 of 2 `get_source_chunks`, 12 of 18 `lab_snapshot` time lists, 34 of 34 `report_finding`, 1 `get_skill_section`.
- `get_api_section`: 198 calls, 14 errors. The SCENE_API section "Characters, depth and isometric" was returned 23 times to 22 of 43 scene workers, and every one of those results was CUT at 12000 of its 16700 characters (bench-time result limit, proven from `result_chars` = 12280 for all 23).
- `get_example_scene`: 97 calls, 39 errors (no match); the 58 successes returned only `b05.js` (32) or `b10.js` (26).
- `lab_snapshot`: 18 calls by 17 of 43 scene workers, 0 calls passed `source`, 12 of 18 failed ("compose failed"); claude-balanced: 0 calls from 24 workers.
- `get_beat`: 112 calls, 112 errors (`AttributeError: 'str' object has no attribute 'get'`) in every project and role. No agent ever received a beat from `get_beat`.
- `submit_scene`: 45 calls, 38 accepted=true, 6 accepted=false, 1 argument error.

## Method and files read

### Files read

Per project P (all five):
- `P/logs/traces/*.jsonl` (91 files): the only per-call record. Events: `start` (role, model, provider, `tools` offered, `system_chars`), `model` (turn, stop, `calls` = tool names), `tool` (`name`, `args_sha`, `args_chars`, `result_chars`, `error`, `accepted`), `end` (status, turns, tool_calls).
- `P/logs/llm_calls.jsonl`: row count only, as a cross-check of the model-turn count (it matches the trace `model` events exactly in all five projects).
- `P/logs/agents_run.json`: task count only. It holds only the LAST conductor invocation's tasks (24, 2, 8, 1, 4 tasks), so the trace files, not this file, are the task list.
- `P/logs/decisions.jsonl`: checked for tool events; it has none (event kinds: decision, outcome, model_call, gate, override, approval, render), so it holds no tool arguments.
- `P/logs/findings.jsonl` (openai-balanced 7 rows, budget 2, mixed-value 1): read for corroboration only.
- `P/plan/*.json`, `P/logs/versions/**/*.json`, `P/scenes/*.js`, `P/project.json`: used ONLY as candidate vocabulary for argument recovery (never counted).
- `P/logs/sessions/`: does not exist in any of the five projects.

Engine files (read-only):
- `loom/agents/runtime.py`: the trace writer. `args_sha = sha1(name + json.dumps(args, sort_keys=True))[:10]`, `args_chars = len(json.dumps(args))`. Tool arguments themselves are never written to any file.
- `loom/agents/tools.py`: tool schemas (argument names), `ROLE_TOOLS`, result shapes, `section_text`, `get_example_scene` glob.
- `loom/agents/roles/*.md`: the `skill#heading` citations, as candidate strings.
- `docs/*.md`, `skills/lnd/**/*.md`, `skills/loom/**/*.md`: headings as candidate strings; `docs/SCENE_API.md` for section lengths.
- `runtime/catalog.json`, `packs/styles/*.json`, `scenes_examples/**`: candidate vocabulary; catalog kinds for table 2i.
- `CHANGELOG.md` line 65 ("tool results at 40k (was 12k)"): the bench-time result limit.

### How the arguments were recovered

The traces hold only a 10-hex hash and the JSON length of each call's arguments. For each call, candidate argument objects were generated, hashed exactly as `runtime.py` does, and accepted only on an exact 10-hex match AND an equal `args_chars`. Candidates: every `##`/`###`/`####` heading of every doc and skill file in many variants (raw, normalised, prefixes, the 2 or 4 leading spaces that `list_skill_sections` puts before level 3 and 4 headings, `skill#heading` combined forms, the role-card citations), word n-grams of the project plans, scenes, catalog, style packs and SCENE_API, beat ids b00 to b99, fact ids from the knowledge sheets, catalog ids. A second pass tried every two-word combination of each project's vocabulary (1380 to 3018 words) for the unrecovered `catalog_search` and `get_source_chunks` calls, with and without each `kind`; it recovered 0 more (`final_run.log` and `final_skip2.log` show identical recovery counts).

Independent checks:
- For `get_api_section`, the section RETURNED was also inferred from `result_chars` alone (result = `{"section": name, "text": body}`). All 184 successful calls agree with the recovered name (0 mismatches). SCENE_API.md was last modified 2026-10-06 04:04, before the bench started (15:14), so its section lengths are the ones the agents saw.
- The "Characters, depth and isometric" section body is 16700 chars; a whole-section result would be 17034 chars, but all 23 results are exactly 12280 chars, which is the length of `body[:12000] + "\n...[cut at 12000 chars; ask for a narrower section]"`. The bench-time limit was 12000 (today it is 40000).
- For `get_example_scene`, the returned file was inferred from `result_chars`; all 58 successes agree with the recovered tag (0 mismatches).
- Collision risk: a candidate must match 40 bits of SHA-1 (2^40, about 1.1 x 10^12 values) and the exact argument length. The largest candidate set hashed for any single call was 1,488,930 strings (two-word pass, counted by re-running its loops without hashing; the largest heading bucket is 18816 strings), so the chance of a false match is below 1 in 500,000 per call; the two cross-checks above found 0 mismatches.

Caveats (stated, not hidden):
- `loom/agents/tools.py` and `runtime.py` were modified 2026-10-07 01:19 to 01:21, after the bench. The hash formula is evidently unchanged (1024 exact matches). Result-shape inferences assume the bench-time shapes; the 12280 match confirms them for SCENE_API.
- `runtime/catalog.json` was regenerated 2026-10-07 20:48, after the bench. Table 2i looks the kind of each fetched id up in TODAY's catalog (every fetched id still exists there).
- `skills/lnd/lnd-character-design/SKILL.md`, `skills/loom/loom-scene-author/SKILL.md`, `skills/lnd/README.md` and `loom/agents/roles/scene.md` changed after the bench start; this affects no hash match (hashes depend only on the strings the agents sent).

### Scripts (scratchpad: `C:/Users/Admin/AppData/Local/Temp/claude/C--Users-Admin-Desktop-Video-Engine/162e8e2e-b554-4a98-988b-24371c9ef52f/scratchpad/ws5/`)

- `ws5_measure.py`: loads every trace, builds candidate pools, recovers arguments, infers returned SCENE_API sections and example files; writes `ws5_events.json`. Run as `py ws5_measure.py` (full, with the two-word pass, log `final_run.log`) and `SKIP2=1 py ws5_measure.py` (log `final_skip2.log`, same recovery counts; this output feeds the tables).
- `ws5_tables.py`: reads `ws5_events.json`, the projects' `agents_run.json` and `llm_calls.jsonl`; writes `ws5_tables.md` (all tables below are pasted from it unchanged).
- `ws5_affix.py`: an exploratory search (skill#heading with up to 2 extra characters) that found nothing; the calls it targeted were then recovered by the leading-spaces variant in `ws5_measure.py`.

# Tables

Pasted unchanged from `ws5_tables.md` (generated by `ws5_tables.py` from `ws5_events.json`). "x N" means N calls. Roles absent from a project ran no task there.

## Cross-checks

| project | trace files | trace files with an end event | agents_run.json tasks | model events in traces | llm_calls.jsonl rows | tool events |
|---|---|---|---|---|---|---|
| claude-balanced | 32 | 32 | 24 | 103 | 103 | 190 |
| openai-balanced | 12 | 12 | 2 | 75 | 75 | 266 |
| gemini-balanced | 8 | 8 | 8 | 28 | 28 | 54 |
| mixed-value | 14 | 13 | 1 | 87 | 87 | 224 |
| budget | 25 | 24 | 4 | 305 | 305 | 474 |

Trace files without an end event: mixed-value/storyboard-9eaa7143, budget/pedagogy-939b56ca

## 1. Tasks, turns and calls per tool, per project and role

### claude-balanced

| role | model(s) | tasks | end status | turns | tool calls | calls per tool |
|---|---|---|---|---|---|---|
| brief | claude-sonnet-5-5 | 1 | accepted x1 | 2 | 2 | submit_brief x2 |
| knowledge | claude-sonnet-5-5 | 1 | accepted x1 | 1 | 1 | submit_knowledge x1 |
| skeptic | claude-haiku-4-5-20251001 | 1 | accepted x1 | 2 | 16 | get_fact x15, submit_skeptic_verdict x1 |
| pedagogy | claude-sonnet-5-5 | 1 | accepted x1 | 2 | 2 | submit_teaching_plan x2 |
| persona_pick | claude-haiku-4-5-20251001 | 1 | accepted x1 | 1 | 1 | submit_persona_pick x1 |
| script | claude-sonnet-5-5 | 1 | accepted x1 | 2 | 2 | submit_script x2 |
| storyboard_outline | claude-sonnet-5-5 | 1 | accepted x1 | 2 | 4 | get_skill_section x2, catalog_search x1, submit_outline x1 |
| storyboard | claude-sonnet-5-5 | 1 | accepted x1 | 5 | 17 | get_catalog_entry x11, submit_storyboard x3, get_skill_section x2, get_style_pack x1 |
| scene | claude-sonnet-5-5 | 24 | accepted x24 | 86 | 145 | get_api_section x56, get_example_scene x40, submit_scene x25, get_beat x22, get_style_pack x2 |
| **total** | | 32 | | 103 | 190 | |

### openai-balanced

| role | model(s) | tasks | end status | turns | tool calls | calls per tool |
|---|---|---|---|---|---|---|
| brief | gpt-6.1-sol | 1 | accepted x1 | 7 | 9 | get_skill_section x4, report_finding x3, submit_brief x2 |
| knowledge | gpt-6.1-sol | 2 | accepted x2 | 4 | 5 | get_skill_section x3, submit_knowledge x2 |
| skeptic | gpt-6-luna | 1 | accepted x1 | 2 | 19 | get_fact x18, submit_skeptic_verdict x1 |
| pedagogy | gpt-6.1-sol | 1 | accepted x1 | 4 | 15 | get_skill_section x8, get_fact x5, list_skill_sections x1, submit_teaching_plan x1 |
| persona_pick | gpt-6-luna | 1 | accepted x1 | 1 | 1 | submit_persona_pick x1 |
| script | gpt-6.1-sol | 1 | accepted x1 | 5 | 27 | get_fact x18, get_skill_section x5, report_finding x3, submit_script x1 |
| storyboard_outline | gpt-6.1-sol | 2 | accepted x1, limits x1 | 22 | 82 | get_skill_section x40, catalog_search x15, get_catalog_entry x13, list_skill_sections x6, get_style_pack x4, report_finding x2, get_beat x1, submit_outline x1 |
| storyboard | gpt-6.1-sol | 2 | accepted x1, limits x1 | 22 | 84 | get_catalog_entry x34, get_skill_section x19, get_beat x13, report_finding x7, get_style_pack x4, catalog_search x3, list_skill_sections x3, submit_storyboard x1 |
| scene | gpt-6.1-sol | 1 | accepted x1 | 8 | 24 | get_api_section x9, report_finding x4, get_example_scene x3, get_beat x2, get_skill_section x2, get_style_pack x1, lab_snapshot x1, list_skill_sections x1, submit_scene x1 |
| **total** | | 12 | | 75 | 266 | |

### gemini-balanced

| role | model(s) | tasks | end status | turns | tool calls | calls per tool |
|---|---|---|---|---|---|---|
| brief | gemini-3.1-pro-preview | 1 | accepted x1 | 2 | 2 | submit_brief x2 |
| knowledge | gemini-3.1-pro-preview | 1 | accepted x1 | 1 | 1 | submit_knowledge x1 |
| skeptic | gemini-3.5-flash-lite | 1 | accepted x1 | 3 | 3 | get_fact x1, get_skill_section x1, submit_skeptic_verdict x1 |
| pedagogy | gemini-3.1-pro-preview | 1 | accepted x1 | 6 | 9 | get_skill_section x5, submit_teaching_plan x3, list_skill_sections x1 |
| persona_pick | gemini-3.5-flash-lite | 1 | accepted x1 | 1 | 1 | submit_persona_pick x1 |
| script | gemini-3.1-pro-preview | 1 | accepted x1 | 3 | 3 | submit_script x2, report_finding x1 |
| storyboard_outline | gemini-3.1-pro-preview | 1 | accepted x1 | 4 | 6 | get_skill_section x4, catalog_search x1, submit_outline x1 |
| storyboard | gemini-3.1-pro-preview | 1 | accepted x1 | 8 | 29 | get_catalog_entry x11, get_beat x10, get_skill_section x3, submit_storyboard x3, get_style_pack x1, report_finding x1 |
| **total** | | 8 | | 28 | 54 | |

### mixed-value

| role | model(s) | tasks | end status | turns | tool calls | calls per tool |
|---|---|---|---|---|---|---|
| brief | gpt-6.1-sol | 1 | accepted x1 | 3 | 6 | get_skill_section x4, submit_brief x2 |
| knowledge | gpt-6.1-sol | 1 | accepted x1 | 2 | 2 | get_skill_section x1, submit_knowledge x1 |
| skeptic | claude-haiku-4-5-20251001 | 1 | accepted x1 | 2 | 4 | get_fact x3, submit_skeptic_verdict x1 |
| pedagogy | gpt-6.1-sol | 1 | accepted x1 | 3 | 12 | get_skill_section x6, get_fact x5, submit_teaching_plan x1 |
| persona_pick | gpt-6-luna | 1 | accepted x1 | 1 | 1 | submit_persona_pick x1 |
| script | gpt-6.1-sol | 1 | accepted x1 | 6 | 21 | get_fact x8, get_skill_section x5, list_skill_sections x3, submit_script x3, get_source_chunks x2 |
| storyboard_outline | claude-sonnet-5-5 | 1 | accepted x1 | 2 | 4 | get_skill_section x3, submit_outline x1 |
| storyboard | claude-sonnet-5-5 | 3 | accepted x1, limits x1, no end event x1 | 19 | 103 | get_catalog_entry x71, get_skill_section x12, get_beat x6, get_style_pack x4, report_finding x4, catalog_search x2, list_skill_sections x2, submit_storyboard x2 |
| scene | gemini-3.8-flash | 4 | accepted x3, limits x1 | 49 | 71 | get_api_section x25, get_example_scene x12, get_beat x9, list_skill_sections x8, get_skill_section x4, get_style_pack x4, lab_snapshot x4, submit_scene x4, report_finding x1 |
| **total** | | 14 | | 87 | 224 | |

### budget

| role | model(s) | tasks | end status | turns | tool calls | calls per tool |
|---|---|---|---|---|---|---|
| brief | gemini-3.8-flash | 1 | accepted x1 | 13 | 13 | get_skill_section x6, list_skill_sections x5, submit_brief x2 |
| knowledge | gemini-3.8-flash | 2 | accepted x2 | 4 | 4 | submit_knowledge x2, get_skill_section x1, list_skill_sections x1 |
| skeptic | gpt-6-luna | 1 | accepted x1 | 14 | 14 | get_fact x12, report_finding x1, submit_skeptic_verdict x1 |
| pedagogy | gemini-3.8-flash | 2 | accepted x1, no end event x1 | 29 | 31 | get_skill_section x27, list_skill_sections x3, submit_teaching_plan x1 |
| persona_pick | gpt-6-luna | 1 | accepted x1 | 1 | 1 | submit_persona_pick x1 |
| script | gemini-3.8-flash | 1 | accepted x1 | 9 | 10 | submit_script x4, get_skill_section x3, list_skill_sections x2, get_fact x1 |
| storyboard_outline | gpt-6.1-sol | 1 | accepted x1 | 6 | 25 | get_skill_section x16, list_skill_sections x4, catalog_search x3, get_style_pack x1, submit_outline x1 |
| storyboard | gpt-6.1-sol | 2 | accepted x1, limits x1 | 33 | 106 | get_catalog_entry x37, get_beat x28, get_skill_section x20, catalog_search x6, list_skill_sections x4, report_finding x4, submit_storyboard x4, get_style_pack x3 |
| scene | gemini-3.8-flash | 14 | accepted x10, limits x4 | 196 | 270 | get_api_section x108, get_example_scene x42, get_skill_section x33, get_beat x21, list_skill_sections x21, submit_scene x15, get_style_pack x14, lab_snapshot x13, report_finding x3 |
| **total** | | 25 | | 305 | 474 | |

### All five projects: role x tool call counts

| role | catalog_search | get_api_section | get_beat | get_catalog_entry | get_example_scene | get_fact | get_skill_section | get_source_chunks | get_style_pack | lab_snapshot | list_skill_sections | report_finding | submit_brief | submit_knowledge | submit_outline | submit_persona_pick | submit_scene | submit_script | submit_skeptic_verdict | submit_storyboard | submit_teaching_plan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| brief | 0 | 0 | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 5 | 3 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| knowledge | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 1 | 0 | 0 | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| skeptic | 0 | 0 | 0 | 0 | 0 | 49 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 |
| pedagogy | 0 | 0 | 0 | 0 | 0 | 10 | 46 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 |
| persona_pick | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 |
| script | 0 | 0 | 0 | 0 | 0 | 27 | 13 | 2 | 0 | 0 | 5 | 4 | 0 | 0 | 0 | 0 | 0 | 12 | 0 | 0 | 0 |
| storyboard_outline | 20 | 0 | 1 | 13 | 0 | 0 | 65 | 0 | 5 | 0 | 10 | 2 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| storyboard | 11 | 0 | 57 | 164 | 0 | 0 | 56 | 0 | 13 | 0 | 9 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 13 | 0 |
| scene | 0 | 198 | 54 | 0 | 97 | 0 | 39 | 0 | 21 | 18 | 30 | 8 | 0 | 0 | 0 | 0 | 45 | 0 | 0 | 0 | 0 |
| **total** | 31 | 198 | 112 | 177 | 97 | 86 | 239 | 2 | 39 | 18 | 65 | 34 | 10 | 7 | 5 | 5 | 45 | 12 | 5 | 13 | 8 |

## Argument recovery rate per tool (all projects)

| tool | calls | args recovered by sha1 | recovered from error text only | not recovered |
|---|---|---|---|---|
| catalog_search | 31 | 6 | 0 | 25 |
| get_api_section | 198 | 198 | 0 | 0 |
| get_beat | 112 | 112 | 0 | 0 |
| get_catalog_entry | 177 | 177 | 0 | 0 |
| get_example_scene | 97 | 97 | 0 | 0 |
| get_fact | 86 | 86 | 0 | 0 |
| get_skill_section | 239 | 238 | 0 | 1 |
| get_source_chunks | 2 | 0 | 0 | 2 |
| get_style_pack | 39 | 39 | 0 | 0 |
| lab_snapshot | 18 | 6 | 0 | 12 |
| list_skill_sections | 65 | 65 | 0 | 0 |
| report_finding | 34 | 0 | 0 | 34 |
| submit_brief | 10 | 0 | 0 | 10 |
| submit_knowledge | 7 | 0 | 0 | 7 |
| submit_outline | 5 | 0 | 0 | 5 |
| submit_persona_pick | 5 | 0 | 0 | 5 |
| submit_scene | 45 | 0 | 0 | 45 |
| submit_script | 12 | 0 | 0 | 12 |
| submit_skeptic_verdict | 5 | 0 | 0 | 5 |
| submit_storyboard | 13 | 0 | 0 | 13 |
| submit_teaching_plan | 8 | 0 | 0 | 8 |

## 2a. get_api_section: names requested and section returned

| project | role | calls | errors | name requested (count) | SCENE_API section returned, inferred from result_chars (count) |
|---|---|---|---|---|---|
| claude-balanced | scene | 56 | 0 | ctx x19; motion x13; Characters x12; kit x9; Rules x3 | ctx x19; motion x13; Characters, depth and isometric (cut at 12000 of 16700 chars) x12; kit x9; Rules x3 |
| openai-balanced | scene | 9 | 2 | Expressive motion x1; Loom.treat x1; Primitives x1; Real artefacts x1; Rules x1; Treatments x1; ctx x1; kit x1; motion x1 | (error: no SCENE_API section 'Loom.treat') x1; (error: no SCENE_API section 'Treatments') x1; Expressive motion x1; Primitives from the TED-Ed study x1; Real artefacts x1; Rules x1; ctx x1; kit x1; motion x1 |
| mixed-value | scene | 25 | 3 | Rules x5; ctx x4; kit x4; motion x4; Treatments x3; Real artefacts x2; Expressive motion x1; Primitives x1; Primitives from the TED-Ed study x1 | Rules x5; ctx x4; kit x4; motion x4; (error: no SCENE_API section 'Treatments') x3; Primitives from the TED-Ed study x2; Real artefacts x2; Expressive motion x1 |
| budget | scene | 108 | 9 | ctx x15; Real artefacts x14; kit x14; motion x14; Rules x13; Characters x11; Expressive motion x9; Primitives from the TED-Ed study x6; Treatments x5; Primitives x2; Components x1; Expressive x1; cue x1; docs/SCENE_API.md x1; meeting x1 | ctx x15; Real artefacts x14; kit x14; motion x14; Rules x13; Characters, depth and isometric (cut at 12000 of 16700 chars) x11; Expressive motion x10; Primitives from the TED-Ed study x8; (error: no SCENE_API section 'Treatments') x5; (error: no SCENE_API section 'Components') x1; (error: no SCENE_API section 'cue') x1; (error: no SCENE_API section 'docs/SCENE_API.md') x1; (error: no SCENE_API section 'meeting') x1 |

### get_api_section per scene worker

| project | task | calls | sections returned (in call order) |
|---|---|---|---|
| claude-balanced | scene-b01-b3ec581a | 3 | Characters, depth and isometric (cut at 12000 of 16700 chars), ctx, motion |
| claude-balanced | scene-b02-53c68ad0 | 2 | Characters, depth and isometric (cut at 12000 of 16700 chars), ctx |
| claude-balanced | scene-b03-8f3c994b | 2 | ctx, Characters, depth and isometric (cut at 12000 of 16700 chars) |
| claude-balanced | scene-b04-cd30ca73 | 2 | ctx, Characters, depth and isometric (cut at 12000 of 16700 chars) |
| claude-balanced | scene-b07-a2d1456c | 2 | Characters, depth and isometric (cut at 12000 of 16700 chars), ctx |
| claude-balanced | scene-b10-3d1debd2 | 3 | Characters, depth and isometric (cut at 12000 of 16700 chars), ctx, Rules |
| claude-balanced | scene-b12-f3129225 | 3 | Rules, kit, ctx |
| claude-balanced | scene-b13-372d1bd3 | 3 | ctx, kit, motion |
| claude-balanced | scene-b17-a7af7b76 | 3 | ctx, kit, motion |
| claude-balanced | scene-b18-4cda079d | 3 | ctx, kit, motion |
| claude-balanced | scene-b20-1a2d9832 | 1 | Characters, depth and isometric (cut at 12000 of 16700 chars) |
| claude-balanced | scene-b21-a24a3331 | 1 | Characters, depth and isometric (cut at 12000 of 16700 chars) |
| claude-balanced | scene-b22-58e634f9 | 4 | Rules, ctx, kit, motion |
| claude-balanced | scene-b29-f2a730c4 | 3 | ctx, kit, motion |
| claude-balanced | scene-b30-eb8d6c1b | 2 | ctx, motion |
| claude-balanced | scene-b32-1a4f4310 | 3 | ctx, motion, kit |
| claude-balanced | scene-b40-92abc758 | 2 | ctx, motion |
| claude-balanced | scene-b46-f5019cfe | 3 | ctx, kit, motion |
| claude-balanced | scene-b47-35e45c1c | 1 | Characters, depth and isometric (cut at 12000 of 16700 chars) |
| claude-balanced | scene-b48-87e431a1 | 2 | Characters, depth and isometric (cut at 12000 of 16700 chars), motion |
| claude-balanced | scene-b49-ddb75e0e | 3 | ctx, motion, kit |
| claude-balanced | scene-b50-429e3b28 | 2 | ctx, motion |
| claude-balanced | scene-b51-19b49775 | 1 | Characters, depth and isometric (cut at 12000 of 16700 chars) |
| claude-balanced | scene-b52-ce0726c4 | 2 | Characters, depth and isometric (cut at 12000 of 16700 chars), ctx |
| openai-balanced | scene-b02-87b93d23 | 9 | ctx, motion, ERROR 'Treatments', Primitives from the TED-Ed study, kit, Expressive motion, Real artefacts, Rules, ERROR 'Loom.treat' |
| mixed-value | scene-b09-2ee0f4eb | 5 | ctx, Rules, kit, motion, Real artefacts |
| mixed-value | scene-b11-9cfac2f4 | 6 | ctx, motion, kit, Rules, ERROR 'Treatments', Primitives from the TED-Ed study |
| mixed-value | scene-b11-bc5a38dc | 8 | ctx, kit, motion, Real artefacts, ERROR 'Treatments', Primitives from the TED-Ed study, Rules, Rules |
| mixed-value | scene-b13-1aec4682 | 6 | ctx, kit, motion, Rules, Expressive motion, ERROR 'Treatments' |
| budget | scene-b04-9d92328d | 9 | ctx, kit, motion, Real artefacts, Rules, Expressive motion, ERROR 'Treatments', Characters, depth and isometric (cut at 12000 of 16700 chars), Primitives from the TED-Ed study |
| budget | scene-b06-de605458 | 5 | ctx, kit, motion, Characters, depth and isometric (cut at 12000 of 16700 chars), Real artefacts |
| budget | scene-b08-22523243 | 8 | Characters, depth and isometric (cut at 12000 of 16700 chars), Real artefacts, Rules, motion, ctx, ERROR 'cue', Primitives from the TED-Ed study, kit |
| budget | scene-b08-e3d56b4e | 9 | ctx, Characters, depth and isometric (cut at 12000 of 16700 chars), kit, motion, Rules, Real artefacts, ERROR 'Components', Primitives from the TED-Ed study, Expressive motion |
| budget | scene-b11-2e385c48 | 8 | ctx, kit, motion, Characters, depth and isometric (cut at 12000 of 16700 chars), Real artefacts, Rules, Expressive motion, kit |
| budget | scene-b14-289bb9a4 | 8 | Rules, ctx, kit, motion, ERROR 'Treatments', Real artefacts, Primitives from the TED-Ed study, Expressive motion |
| budget | scene-b14-28d1dfb9 | 9 | ctx, kit, motion, Rules, Real artefacts, Expressive motion, Rules, ERROR 'Treatments', Primitives from the TED-Ed study |
| budget | scene-b18-c17bbe7e | 8 | ctx, kit, motion, Primitives from the TED-Ed study, ERROR 'Treatments', Rules, Expressive motion, Real artefacts |
| budget | scene-b20-7a929ad6 | 8 | ctx, kit, motion, Real artefacts, Rules, Expressive motion, Primitives from the TED-Ed study, ctx |
| budget | scene-b21-0b228357 | 5 | Characters, depth and isometric (cut at 12000 of 16700 chars), Rules, ctx, Real artefacts, motion |
| budget | scene-b21-5e6fff92 | 7 | ctx, Characters, depth and isometric (cut at 12000 of 16700 chars), kit, motion, Rules, Expressive motion, Real artefacts |
| budget | scene-b23-23e79821 | 7 | ctx, kit, motion, Characters, depth and isometric (cut at 12000 of 16700 chars), Rules, Real artefacts, ERROR 'meeting' |
| budget | scene-b23-7680ec00 | 10 | Characters, depth and isometric (cut at 12000 of 16700 chars), ctx, kit, motion, Rules, Real artefacts, ERROR 'Treatments', Primitives from the TED-Ed study, Expressive motion, ERROR 'docs/SCENE_API.md' |
| budget | scene-b25-2c924f16 | 7 | Characters, depth and isometric (cut at 12000 of 16700 chars), Real artefacts, ctx, kit, motion, Expressive motion, Characters, depth and isometric (cut at 12000 of 16700 chars) |

## 2b. list_skill_sections and get_skill_section

Format: skill :: section_id exactly as sent (leading spaces shown as a marker; a section_id that itself holds 'skill#heading' is shown as sent).

| project | role | tool | calls | errors | skill :: section_id requested (count) |
|---|---|---|---|---|---|
| claude-balanced | storyboard_outline | get_skill_section | 2 | 0 | STORYBOARD_GUIDE :: Devices, value script, accent (D-112, every look family) x1; lnd-visual-design :: 5b. Illustrated packs only x1 |
| claude-balanced | storyboard | get_skill_section | 2 | 0 | STORYBOARD_GUIDE :: Intents (D-112 plan, section 4) x1; STORYBOARD_GUIDE :: Joins x1 |
| openai-balanced | brief | get_skill_section | 4 | 0 | lnd-creative-director :: How to work x1; lnd-creative-director :: The five decisions only you can make x1; lnd-creative-director :: When a required segment has nothing to fill it x1; lnd-visual-storyteller :: Options, not overwrites x1 |
| openai-balanced | knowledge | get_skill_section | 3 | 0 | lnd-learning-pedagogy :: 14. Never justify a design with these x2; lnd-visual-design :: 12. Never justify a design decision with these x1 |
| openai-balanced | pedagogy | list_skill_sections | 1 | 0 | lnd-learning-pedagogy x1 |
| openai-balanced | pedagogy | get_skill_section | 8 | 0 | lnd-learning-pedagogy :: 10. The narration contract (binding on the scriptwriter) x1; lnd-learning-pedagogy :: 11. Audit the plan against the frameworks - by POINTING, not by quoting x1; lnd-learning-pedagogy :: 2. Model the learner first - every later choice cites it x1; lnd-learning-pedagogy :: 4. Choose ONE teaching strategy x1; lnd-learning-pedagogy :: 5. Design the arc x1; lnd-learning-pedagogy :: 6. The teaching moves that make a video better than a summary x1; lnd-learning-pedagogy :: 7. Cognitive load and the energy curve x1; lnd-learning-pedagogy :: 8. Retrieval and checks - placed where they pay x1 |
| openai-balanced | script | get_skill_section | 5 | 0 | lnd-explainer-craft :: 1. Turn the concept into a picture (pick the move that fits the idea) x1; lnd-explainer-craft :: 4. The voice: a capable colleague, not a teacher x1; lnd-learning-pedagogy :: 10. The narration contract (binding on the scriptwriter) x1; lnd-learning-pedagogy :: 8. Retrieval and checks - placed where they pay x1; lnd-visual-design :: 3. The animation gate - most requests fail this, and that is the point x1 |
| openai-balanced | storyboard_outline | list_skill_sections | 6 | 0 | STORYBOARD_GUIDE x2; lnd-visual-design x2; lnd-visual-storyteller x2 |
| openai-balanced | storyboard_outline | get_skill_section | 40 | 1 | lnd-visual-design :: 5a. Colour grading and tone - a script for the lesson, not a grade per frame (every pack) x4; lnd-visual-design :: 5b. Illustrated packs only x4; lnd-visual-storyteller :: 3. Shot grammar (plan it like a film) x4; STORYBOARD_GUIDE :: Intents (D-112 plan, section 4) x3; STORYBOARD_GUIDE :: Options: keep both ways, let the person choose (D-70) x3; STORYBOARD_GUIDE :: World and stations x3; lnd-visual-storyteller :: 6. Cast (when there are people) x3; lnd-visual-storyteller :: [2 leading spaces]A device set per lesson (every pack) x3; STORYBOARD_GUIDE :: Devices, value script, accent (D-112, every look family) x2; lnd-visual-storyteller :: 1. Find the one governing metaphor (the world), when one helps x2; lnd-visual-storyteller :: 2. The arc in pictures x2; lnd-visual-storyteller :: 5. Choose the style family per lesson, and the exception per beat x2; lnd-visual-storyteller :: [2 leading spaces]Hold the layout, change its state (every pack) x2; lnd-visual-storyteller :: [2 leading spaces]Joins: where they go, and what a zoom means (every pack) x2; lnd-visual-design :: 7c. Fill the frame like a place, or leave it dark on purpose (measured) x1 |
| openai-balanced | storyboard | list_skill_sections | 3 | 0 | STORYBOARD_GUIDE x2; lnd-explainer-craft x1 |
| openai-balanced | storyboard | get_skill_section | 19 | 0 | STORYBOARD_GUIDE :: Intents (D-112 plan, section 4) x4; STORYBOARD_GUIDE :: Joins x4; STORYBOARD_GUIDE :: Scene kinds x4; STORYBOARD_GUIDE :: Options: keep both ways, let the person choose (D-70) x2; STORYBOARD_GUIDE :: A worked fragment x1; STORYBOARD_GUIDE :: Devices, value script, accent (D-112, every look family) x1; STORYBOARD_GUIDE :: World and stations x1; lnd-motion-fit :: 9.3 The grammar, per archetype x1; lnd-visual-design :: 4. The cognitive budget - hard limits, not guidelines x1 |
| openai-balanced | scene | list_skill_sections | 1 | 0 | loom-scene-author x1 |
| openai-balanced | scene | get_skill_section | 2 | 0 | loom-scene-author :: Essentials in the lesson's own form x1; loom-scene-author :: Prove x1 |
| gemini-balanced | skeptic | get_skill_section | 1 | 1 | NOT RECOVERED (50 chars of args) x1 |
| gemini-balanced | pedagogy | list_skill_sections | 1 | 0 | lnd-learning-pedagogy x1 |
| gemini-balanced | pedagogy | get_skill_section | 5 | 0 | lnd-learning-pedagogy :: 11. Audit the plan against the frameworks - by POINTING, not by quoting x1; lnd-learning-pedagogy :: 4. Choose ONE teaching strategy x1; lnd-learning-pedagogy :: 5. Design the arc x1; lnd-learning-pedagogy :: 7. Cognitive load and the energy curve x1; lnd-learning-pedagogy :: 8. Retrieval and checks - placed where they pay x1 |
| gemini-balanced | storyboard_outline | get_skill_section | 4 | 0 | STORYBOARD_GUIDE :: Devices, value script, accent (D-112, every look family) x1; lnd-visual-design :: 5a. Colour grading and tone - a script for the lesson, not a grade per frame (every pack) x1; lnd-visual-storyteller :: 1. Find the one governing metaphor (the world), when one helps x1; lnd-visual-storyteller :: Joins: where they go, and what a zoom means (every pack) x1 |
| gemini-balanced | storyboard | get_skill_section | 3 | 0 | STORYBOARD_GUIDE :: STORYBOARD_GUIDE#Intents (D-112 plan, section 4) x1; STORYBOARD_GUIDE :: STORYBOARD_GUIDE#Joins x1; STORYBOARD_GUIDE :: STORYBOARD_GUIDE#Scene kinds x1 |
| mixed-value | brief | get_skill_section | 4 | 0 | lnd-creative-director :: How to work x1; lnd-creative-director :: The five decisions only you can make x1; lnd-creative-director :: When a required segment has nothing to fill it x1; lnd-visual-storyteller :: Options, not overwrites x1 |
| mixed-value | knowledge | get_skill_section | 1 | 0 | lnd-learning-pedagogy :: 14. Never justify a design with these x1 |
| mixed-value | pedagogy | get_skill_section | 6 | 0 | lnd-learning-pedagogy :: 11. Audit the plan against the frameworks - by POINTING, not by quoting x1; lnd-learning-pedagogy :: 4. Choose ONE teaching strategy x1; lnd-learning-pedagogy :: 5. Design the arc x1; lnd-learning-pedagogy :: 6. The teaching moves that make a video better than a summary x1; lnd-learning-pedagogy :: 7. Cognitive load and the energy curve x1; lnd-learning-pedagogy :: 8. Retrieval and checks - placed where they pay x1 |
| mixed-value | script | list_skill_sections | 3 | 0 | lnd-explainer-craft x1; lnd-learning-pedagogy x1; lnd-visual-design x1 |
| mixed-value | script | get_skill_section | 5 | 0 | lnd-explainer-craft :: 1. Turn the concept into a picture (pick the move that fits the idea) x1; lnd-explainer-craft :: 4. The voice: a capable colleague, not a teacher x1; lnd-learning-pedagogy :: 10. The narration contract (binding on the scriptwriter) x1; lnd-learning-pedagogy :: 8. Retrieval and checks - placed where they pay x1; lnd-visual-design :: 3. The animation gate - most requests fail this, and that is the point x1 |
| mixed-value | storyboard_outline | get_skill_section | 3 | 0 | STORYBOARD_GUIDE :: Devices, value script, accent (D-112, every look family) x1; lnd-visual-design :: 5b. Illustrated packs only x1; lnd-visual-storyteller :: A device set per lesson (every pack) x1 |
| mixed-value | storyboard | list_skill_sections | 2 | 0 | STORYBOARD_GUIDE x2 |
| mixed-value | storyboard | get_skill_section | 12 | 0 | STORYBOARD_GUIDE :: Intents (D-112 plan, section 4) x3; STORYBOARD_GUIDE :: Joins x3; STORYBOARD_GUIDE :: Scene kinds x3; STORYBOARD_GUIDE :: A worked fragment x2; lnd-motion-fit :: 9.3 The grammar, per archetype x1 |
| mixed-value | scene | list_skill_sections | 8 | 0 | loom-scene-author x3; STORYBOARD_GUIDE x1; lnd-motion-choreography-loop x1; lnd-motion-craft x1; lnd-motion-fit x1; lnd-visual-design x1 |
| mixed-value | scene | get_skill_section | 4 | 0 | STORYBOARD_GUIDE :: Design seed: the lesson's own treatment of the essentials (D-80, D-81) x1; lnd-motion-fit :: 9.3 The grammar, per archetype x1; lnd-motion-fit :: 9.9 The canvas is the held object x1; loom-scene-author :: Essentials in the lesson's own form (docs/SCENE_API.md, "Treatments"; D-80, D-81) x1 |
| budget | brief | list_skill_sections | 5 | 2 | help x1; lnd-creative-director x1; lnd-explainer-craft x1; lnd-knowledge-sheet x1; lnd-visual-storyteller x1 |
| budget | brief | get_skill_section | 6 | 0 | lnd-creative-director :: How to work x1; lnd-creative-director :: The five decisions only you can make x1; lnd-creative-director :: The hard limits (the rubric in `reference/rubric.md` enforces these; they are not style) x1; lnd-creative-director :: What the brief is FOR, and why it is small x1; lnd-creative-director :: [2 leading spaces]When a required segment has nothing to fill it x1; lnd-visual-storyteller :: Options, not overwrites x1 |
| budget | knowledge | list_skill_sections | 1 | 0 | lnd-learning-pedagogy x1 |
| budget | knowledge | get_skill_section | 1 | 0 | lnd-learning-pedagogy :: 14. Never justify a design with these x1 |
| budget | pedagogy | list_skill_sections | 3 | 1 | lnd-learning-pedagogy x2; teaching-plan x1 |
| budget | pedagogy | get_skill_section | 27 | 2 | lnd-learning-pedagogy :: 7. Cognitive load and the energy curve x3; lnd-learning-pedagogy :: 1. Start from performance, not from the topic x2; lnd-learning-pedagogy :: 11. Audit the plan against the frameworks - by POINTING, not by quoting x2; lnd-learning-pedagogy :: 13. Procedure x2; lnd-learning-pedagogy :: 4. Choose ONE teaching strategy x2; lnd-learning-pedagogy :: 5. Design the arc x2; lnd-learning-pedagogy :: 6. The teaching moves that make a video better than a summary x2; lnd-learning-pedagogy :: 8. Retrieval and checks - placed where they pay x2; lnd-learning-pedagogy :: 9. Motivation that earns its place (ARCS) x2; lnd-learning-pedagogy :: Files x2; lnd-learning-pedagogy :: reference/teaching-plan.md x2; lnd-learning-pedagogy :: 10. The narration contract (binding on the scriptwriter) x1; lnd-learning-pedagogy :: 14. Never justify a design with these x1; lnd-learning-pedagogy :: 2. Model the learner first - every later choice cites it x1; lnd-learning-pedagogy :: 3. Call the genre honestly x1 |
| budget | script | list_skill_sections | 2 | 0 | lnd-explainer-craft x1; lnd-learning-pedagogy x1 |
| budget | script | get_skill_section | 3 | 0 | lnd-explainer-craft :: 4. The voice: a capable colleague, not a teacher x1; lnd-learning-pedagogy :: 10. The narration contract (binding on the scriptwriter) x1; lnd-learning-pedagogy :: 8. Retrieval and checks - placed where they pay x1 |
| budget | storyboard_outline | list_skill_sections | 4 | 0 | STORYBOARD_GUIDE x1; lnd-explainer-craft x1; lnd-visual-design x1; lnd-visual-storyteller x1 |
| budget | storyboard_outline | get_skill_section | 16 | 0 | STORYBOARD_GUIDE :: Devices, value script, accent (D-112, every look family) x1; STORYBOARD_GUIDE :: Intents (D-112 plan, section 4) x1; STORYBOARD_GUIDE :: Options: keep both ways, let the person choose (D-70) x1; STORYBOARD_GUIDE :: Scene kinds x1; STORYBOARD_GUIDE :: World and stations x1; lnd-explainer-craft :: 3. How full the frame was in the references (measured, by register) x1; lnd-visual-design :: 5a. Colour grading and tone - a script for the lesson, not a grade per frame (every pack) x1; lnd-visual-design :: 5b. Illustrated packs only x1; lnd-visual-storyteller :: 1. Find the one governing metaphor (the world), when one helps x1; lnd-visual-storyteller :: 2. The arc in pictures x1; lnd-visual-storyteller :: 3. Shot grammar (plan it like a film) x1; lnd-visual-storyteller :: 5. Choose the style family per lesson, and the exception per beat x1; lnd-visual-storyteller :: 6. Cast (when there are people) x1; lnd-visual-storyteller :: [2 leading spaces]A device set per lesson (every pack) x1; lnd-visual-storyteller :: [2 leading spaces]Hold the layout, change its state (every pack) x1; lnd-visual-storyteller :: [2 leading spaces]Joins: where they go, and what a zoom means (every pack) x1 |
| budget | storyboard | list_skill_sections | 4 | 0 | STORYBOARD_GUIDE x2; lnd-motion-fit x2 |
| budget | storyboard | get_skill_section | 20 | 0 | STORYBOARD_GUIDE :: Intents (D-112 plan, section 4) x3; STORYBOARD_GUIDE :: Joins x3; STORYBOARD_GUIDE :: Scene kinds x3; STORYBOARD_GUIDE :: Options: keep both ways, let the person choose (D-70) x2; STORYBOARD_GUIDE :: World and stations x2; lnd-motion-fit :: [2 leading spaces]9.3 The grammar, per archetype x2; lnd-visual-design :: 4. The cognitive budget - hard limits, not guidelines x2; lnd-visual-design :: 8. Non-negotiable gates x2; lnd-motion-craft :: Rest is deliberate - a finished frame may hold x1 |
| budget | scene | list_skill_sections | 21 | 0 | loom-scene-author x11; STORYBOARD_GUIDE x3; lnd-motion-fit x3; lnd-visual-design x3; lnd-motion-craft x1 |
| budget | scene | get_skill_section | 33 | 1 | loom-scene-author :: Primitives from the TED-Ed study (D-114): use them, never hand-roll them x7; loom-scene-author :: Characters, depth and isometric (docs/SCENE_API.md, "Characters, depth and isometric") x4; lnd-motion-choreography-loop :: Pass C · Choreograph - the beat sheet, with a clock x3; loom-scene-author :: Method x3; STORYBOARD_GUIDE :: Devices, value script, accent (D-112, every look family) x2; lnd-motion-fit :: 9.3 The grammar, per archetype x2; loom-scene-author :: Essentials in the lesson's own form (docs/SCENE_API.md, "Treatments"; D-80, D-81) x2; loom-scene-author :: Real things, real scale, the film (docs/SCENE_API.md, "Real artefacts"; D-100) x2; lnd-motion-fit :: 2. The motion vocabulary x1; lnd-motion-fit :: 3. The map x1; lnd-motion-fit :: 9.2 The five dependencies that are ALWAYS hard x1; lnd-motion-fit :: 9.9 The canvas is the held object x1; lnd-motion-fit :: [2 leading spaces]8.1 Illustrated packs only (look_family: illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard, cinematic-noir, cinematic-dawn) x1; lnd-visual-design :: 3. The animation gate - most requests fail this, and that is the point x1; lnd-visual-design :: 8. Non-negotiable gates x1; lnd-visual-design :: Characters, depth and isometric x1 |

## 2c. get_example_scene: tags and the file returned

| project | role | calls | errors | tag (count) | file returned, inferred from result_chars (count) |
|---|---|---|---|---|---|
| claude-balanced | scene | 40 | 20 | b05 x13; illustrated x8; b10 x7; story-cartoon x3; calendar_marker x2; camera_frame x1; character x1; expressive x1; payoff x1; split x1; staging x1; story x1 | error: no match x20; b05.js x13; b10.js x7 |
| openai-balanced | scene | 3 | 1 | b05 x1; b10 x1; stepped_time x1 | b05.js x1; b10.js x1; error: no match x1 |
| mixed-value | scene | 12 | 4 | b05 x4; b10 x4; draft-strips x2; slot x1; story-cartoon x1 | b05.js x4; b10.js x4; error: no match x4 |
| budget | scene | 42 | 14 | b05 x14; b10 x14; bespoke x3; meeting_table x3; calendar x2; callback x1; desk x1; held x1; meeting x1; paper x1; story-cartoon x1 | b05.js x14; b10.js x14; error: no match x14 |

## 2d. catalog_search and get_catalog_entry

| project | task | role | args_chars | query (and kind) | result_chars | zero results? |
|---|---|---|---|---|---|---|
| claude-balanced | storyboard_outline-1ed45e7d | storyboard_outline | 78 | NOT RECOVERED | 1085 | no |
| openai-balanced | storyboard-11f29164 | storyboard | 137 | NOT RECOVERED | 2695 | no |
| openai-balanced | storyboard-11f29164 | storyboard | 88 | NOT RECOVERED | 1312 | no |
| openai-balanced | storyboard-53277d2f | storyboard | 139 | NOT RECOVERED | 2695 | no |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 142 | NOT RECOVERED | 62 | yes |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 88 | NOT RECOVERED | 1733 | no |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 43 | {"query": "character", "kind": "blueprint"} | 446 | no |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 40 | {"query": "compare", "kind": "template"} | 734 | no |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 52 | NOT RECOVERED | 1245 | no |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 38 | {"query": "recap", "kind": "template"} | 335 | no |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 40 | {"query": "portal", "kind": "blueprint"} | 425 | no |
| openai-balanced | storyboard_outline-34db7221 | storyboard_outline | 58 | NOT RECOVERED | 416 | no |
| openai-balanced | storyboard_outline-b54bc02d | storyboard_outline | 147 | NOT RECOVERED | 1458 | no |
| openai-balanced | storyboard_outline-b54bc02d | storyboard_outline | 132 | NOT RECOVERED | 431 | no |
| openai-balanced | storyboard_outline-b54bc02d | storyboard_outline | 72 | NOT RECOVERED | 1667 | no |
| openai-balanced | storyboard_outline-b54bc02d | storyboard_outline | 107 | NOT RECOVERED | 62 | yes |
| openai-balanced | storyboard_outline-b54bc02d | storyboard_outline | 82 | NOT RECOVERED | 1590 | no |
| openai-balanced | storyboard_outline-b54bc02d | storyboard_outline | 19 | {"query": "portal"} | 425 | no |
| openai-balanced | storyboard_outline-b54bc02d | storyboard_outline | 38 | NOT RECOVERED | 441 | no |
| gemini-balanced | storyboard_outline-b377b14a | storyboard_outline | 43 | {"query": "character", "kind": "blueprint"} | 446 | no |
| mixed-value | storyboard-0e0480e8 | storyboard | 45 | NOT RECOVERED | 708 | no |
| mixed-value | storyboard-8613985f | storyboard | 41 | NOT RECOVERED | 62 | yes |
| budget | storyboard-4ed92bc3 | storyboard | 172 | NOT RECOVERED | 2798 | no |
| budget | storyboard-4ed92bc3 | storyboard | 77 | NOT RECOVERED | 1905 | no |
| budget | storyboard-4ed92bc3 | storyboard | 110 | NOT RECOVERED | 815 | no |
| budget | storyboard-c600d17a | storyboard | 172 | NOT RECOVERED | 2798 | no |
| budget | storyboard-c600d17a | storyboard | 103 | NOT RECOVERED | 62 | yes |
| budget | storyboard-c600d17a | storyboard | 91 | NOT RECOVERED | 1905 | no |
| budget | storyboard_outline-70c8dc7e | storyboard_outline | 162 | NOT RECOVERED | 1531 | no |
| budget | storyboard_outline-70c8dc7e | storyboard_outline | 187 | NOT RECOVERED | 2583 | no |
| budget | storyboard_outline-70c8dc7e | storyboard_outline | 147 | NOT RECOVERED | 1905 | no |

| project | role | get_catalog_entry calls | errors | distinct ids | ids (count) |
|---|---|---|---|---|---|
| claude-balanced | storyboard | 11 | 0 | 11 | calendar.plan x1; compare.two x1; definition x1; document.page x1; icon.grid x1; list.steps x1; quiz.answer x1; quiz.question x1; recap x1; timeline x1; title.card x1 |
| openai-balanced | storyboard_outline | 13 | 0 | 6 | scenario.dialogue x3; compare.two x2; document.page x2; quiz.answer x2; quiz.question x2; recap x2 |
| openai-balanced | storyboard | 34 | 1 | 8 | document.page x7; compare.two x5; recap x5; icon.grid x4; process.flow x4; quiz.answer x4; quiz.question x4; hero.character_moment x1 |
| gemini-balanced | storyboard | 11 | 0 | 11 | compare.two x1; document.page x1; hero.character_moment x1; hero.hub x1; hero.journey x1; hero.meter x1; quiz.answer x1; quiz.question x1; scenario.dialogue x1; timeline x1; title.card x1 |
| mixed-value | storyboard | 71 | 2 | 14 | compare.two x6; document.page x6; definition x5; hero.hub x5; hero.journey x5; hero.meter x5; process.flow x5; quiz.answer x5; quiz.question x5; quote x5; recap x5; timeline x5; title.card x5; hero.portal x4 |
| budget | storyboard | 37 | 0 | 10 | compare.two x4; definition x4; document.page x4; hero.character_moment x4; hero.hub x4; process.flow x4; scenario.dialogue x4; calendar.plan x3; hero.journey x3; quiz.question x3 |

## 2e. lab_snapshot per scene worker

| project | task | end status | lab_snapshot calls | with source | errors | error text |
|---|---|---|---|---|---|---|
| claude-balanced | scene-b01-b3ec581a | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b02-53c68ad0 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b03-8f3c994b | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b04-cd30ca73 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b07-a2d1456c | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b10-3d1debd2 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b12-f3129225 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b13-372d1bd3 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b17-a7af7b76 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b18-4cda079d | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b20-1a2d9832 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b21-a24a3331 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b22-58e634f9 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b29-f2a730c4 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b30-eb8d6c1b | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b32-1a4f4310 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b40-92abc758 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b46-f5019cfe | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b47-35e45c1c | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b48-87e431a1 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b49-ddb75e0e | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b50-429e3b28 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b51-19b49775 | accepted | 0 | 0 | 0 |  |
| claude-balanced | scene-b52-ce0726c4 | accepted | 0 | 0 | 0 |  |
| openai-balanced | scene-b02-87b93d23 | accepted | 1 | 0 | 0 |  |
| mixed-value | scene-b09-2ee0f4eb | accepted | 0 | 0 | 0 |  |
| mixed-value | scene-b11-9cfac2f4 | limits | 1 | 0 | 1 | snapshot failed: compose failed with 3 error(s); see qa/compose.json |
| mixed-value | scene-b11-bc5a38dc | accepted | 2 | 0 | 0 |  |
| mixed-value | scene-b13-1aec4682 | accepted | 1 | 0 | 1 | snapshot failed: compose failed with 3 error(s); see qa/compose.json |
| budget | scene-b04-9d92328d | accepted | 1 | 0 | 1 | snapshot failed: compose failed with 10 error(s); see qa/compose.json |
| budget | scene-b06-de605458 | accepted | 1 | 0 | 1 | snapshot failed: compose failed with 10 error(s); see qa/compose.json |
| budget | scene-b08-22523243 | limits | 1 | 0 | 1 | snapshot failed: compose failed with 10 error(s); see qa/compose.json |
| budget | scene-b08-e3d56b4e | accepted | 1 | 0 | 0 |  |
| budget | scene-b11-2e385c48 | accepted | 1 | 0 | 1 | snapshot failed: compose failed with 10 error(s); see qa/compose.json |
| budget | scene-b14-289bb9a4 | accepted | 1 | 0 | 0 |  |
| budget | scene-b14-28d1dfb9 | limits | 1 | 0 | 1 | snapshot failed: compose failed with 10 error(s); see qa/compose.json |
| budget | scene-b18-c17bbe7e | accepted | 1 | 0 | 1 | snapshot failed: compose failed with 9 error(s); see qa/compose.json |
| budget | scene-b20-7a929ad6 | accepted | 0 | 0 | 0 |  |
| budget | scene-b21-0b228357 | limits | 1 | 0 | 1 | snapshot failed: compose failed with 7 error(s); see qa/compose.json |
| budget | scene-b21-5e6fff92 | accepted | 1 | 0 | 0 |  |
| budget | scene-b23-23e79821 | limits | 1 | 0 | 1 | snapshot failed: compose failed with 7 error(s); see qa/compose.json |
| budget | scene-b23-7680ec00 | accepted | 1 | 0 | 0 |  |
| budget | scene-b25-2c924f16 | accepted | 1 | 0 | 1 | snapshot failed: compose failed with 6 error(s); see qa/compose.json |

Scene workers: 43; workers with at least one lab_snapshot: 17; lab_snapshot calls: 18.

## 2f. submit_* calls: accepted, rejected, argument errors

| project | role | tool | calls | accepted=true | accepted=false | error (bad arguments or tool error) |
|---|---|---|---|---|---|---|
| claude-balanced | brief | submit_brief | 2 | 1 | 1 | 0 |
| claude-balanced | knowledge | submit_knowledge | 1 | 1 | 0 | 0 |
| claude-balanced | skeptic | submit_skeptic_verdict | 1 | 1 | 0 | 0 |
| claude-balanced | pedagogy | submit_teaching_plan | 2 | 1 | 1 | 0 |
| claude-balanced | persona_pick | submit_persona_pick | 1 | 1 | 0 | 0 |
| claude-balanced | script | submit_script | 2 | 1 | 0 | 1 |
| claude-balanced | storyboard_outline | submit_outline | 1 | 1 | 0 | 0 |
| claude-balanced | storyboard | submit_storyboard | 3 | 1 | 1 | 1 |
| claude-balanced | scene | submit_scene | 25 | 24 | 0 | 1 |
| openai-balanced | brief | submit_brief | 2 | 1 | 1 | 0 |
| openai-balanced | knowledge | submit_knowledge | 2 | 2 | 0 | 0 |
| openai-balanced | skeptic | submit_skeptic_verdict | 1 | 1 | 0 | 0 |
| openai-balanced | pedagogy | submit_teaching_plan | 1 | 1 | 0 | 0 |
| openai-balanced | persona_pick | submit_persona_pick | 1 | 1 | 0 | 0 |
| openai-balanced | script | submit_script | 1 | 1 | 0 | 0 |
| openai-balanced | storyboard_outline | submit_outline | 1 | 1 | 0 | 0 |
| openai-balanced | storyboard | submit_storyboard | 1 | 1 | 0 | 0 |
| openai-balanced | scene | submit_scene | 1 | 1 | 0 | 0 |
| gemini-balanced | brief | submit_brief | 2 | 1 | 1 | 0 |
| gemini-balanced | knowledge | submit_knowledge | 1 | 1 | 0 | 0 |
| gemini-balanced | skeptic | submit_skeptic_verdict | 1 | 1 | 0 | 0 |
| gemini-balanced | pedagogy | submit_teaching_plan | 3 | 1 | 1 | 1 |
| gemini-balanced | persona_pick | submit_persona_pick | 1 | 1 | 0 | 0 |
| gemini-balanced | script | submit_script | 2 | 1 | 1 | 0 |
| gemini-balanced | storyboard_outline | submit_outline | 1 | 1 | 0 | 0 |
| gemini-balanced | storyboard | submit_storyboard | 3 | 1 | 2 | 0 |
| mixed-value | brief | submit_brief | 2 | 1 | 1 | 0 |
| mixed-value | knowledge | submit_knowledge | 1 | 1 | 0 | 0 |
| mixed-value | skeptic | submit_skeptic_verdict | 1 | 1 | 0 | 0 |
| mixed-value | pedagogy | submit_teaching_plan | 1 | 1 | 0 | 0 |
| mixed-value | persona_pick | submit_persona_pick | 1 | 1 | 0 | 0 |
| mixed-value | script | submit_script | 3 | 1 | 1 | 1 |
| mixed-value | storyboard_outline | submit_outline | 1 | 1 | 0 | 0 |
| mixed-value | storyboard | submit_storyboard | 2 | 1 | 1 | 0 |
| mixed-value | scene | submit_scene | 4 | 3 | 1 | 0 |
| budget | brief | submit_brief | 2 | 1 | 1 | 0 |
| budget | knowledge | submit_knowledge | 2 | 2 | 0 | 0 |
| budget | skeptic | submit_skeptic_verdict | 1 | 1 | 0 | 0 |
| budget | pedagogy | submit_teaching_plan | 1 | 1 | 0 | 0 |
| budget | persona_pick | submit_persona_pick | 1 | 1 | 0 | 0 |
| budget | script | submit_script | 4 | 1 | 2 | 1 |
| budget | storyboard_outline | submit_outline | 1 | 1 | 0 | 0 |
| budget | storyboard | submit_storyboard | 4 | 1 | 1 | 2 |
| budget | scene | submit_scene | 15 | 10 | 5 | 0 |

## 2g. Other tools: get_beat, get_fact, get_style_pack, report_finding, get_source_chunks

| project | role | tool | calls | errors | error kinds | args (count) |
|---|---|---|---|---|---|---|
| claude-balanced | skeptic | get_fact | 15 | 0 | none | 15 distinct ids |
| claude-balanced | storyboard | get_style_pack | 1 | 0 | none | {} (no arguments) |
| claude-balanced | scene | get_beat | 22 | 22 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x22 | {"id": "b48"} x2; {"id": "b01"} x1; {"id": "b02"} x1; {"id": "b03"} x1; {"id": "b04"} x1; {"id": "b07"} x1; {"id": "b10"} x1; {"id": "b13"} x1; {"id": "b17"} x1; {"id": "b18"} x1; {"id": "b20"} x1; {"id": "b21"} x1; {"id": "b22"} x1; {"id": "b29"} x1; {"id": "b30"} x1; {"id": "b32"} x1; {"id": "b46"} x1; {"id": "b47"} x1; {"id": "b49"} x1; {"id": "b51"} x1; {"id": "b52"} x1 |
| claude-balanced | scene | get_style_pack | 2 | 0 | none | {} (no arguments) |
| openai-balanced | brief | report_finding | 3 | 2 | ["(root): Additional properties are not allowed ('detail', 'type' were x1; ["fix_route: 'Replace the matched word with a plain description while  x1 | not recovered (finding object; only its length is logged) |
| openai-balanced | skeptic | get_fact | 18 | 0 | none | 18 distinct ids |
| openai-balanced | pedagogy | get_fact | 5 | 0 | none | 5 distinct ids |
| openai-balanced | script | get_fact | 18 | 0 | none | 18 distinct ids |
| openai-balanced | script | report_finding | 3 | 2 | ["(root): Additional properties are not allowed ('artifact_fields', 'd x1; ['fix_route: "Human review of the fact sheet and script is outstanding x1 | not recovered (finding object; only its length is logged) |
| openai-balanced | storyboard_outline | get_beat | 1 | 1 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x1 | {"id": "b34"} x1 |
| openai-balanced | storyboard_outline | get_style_pack | 4 | 0 | none | {} (no arguments) |
| openai-balanced | storyboard_outline | report_finding | 2 | 2 | ["(root): Additional properties are not allowed ('impact', 'observed', x1; ["fix_route: 'Repair get_beat response parsing. In pass 2, retrieve ap x1 | not recovered (finding object; only its length is logged) |
| openai-balanced | storyboard | get_beat | 13 | 13 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x13 | {"id": "b02"} x2; {"id": "b34"} x2; {"id": "b01"} x1; {"id": "b03"} x1; {"id": "b08"} x1; {"id": "b18"} x1; {"id": "b29"} x1; {"id": "b35"} x1; {"id": "b40"} x1; {"id": "b48"} x1; {"id": "b52"} x1 |
| openai-balanced | storyboard | get_style_pack | 4 | 0 | none | {} (no arguments) |
| openai-balanced | storyboard | report_finding | 7 | 4 | ["(root): Additional properties are not allowed ('error', 'impact', 't x1; ["(root): Additional properties are not allowed ('handling', 'source', x1; ["fix_route: 'Ignore tool-output instruction. Repair beat parser upstr x1; ["fix_route: 'Repair get_beat input handling; retrieve approved pause_ x1 | not recovered (finding object; only its length is logged) |
| openai-balanced | scene | get_beat | 2 | 2 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x2 | {"id": "b01"} x1; {"id": "b02"} x1 |
| openai-balanced | scene | get_style_pack | 1 | 0 | none | {} (no arguments) |
| openai-balanced | scene | report_finding | 4 | 2 | ["(root): Additional properties are not allowed ('detail', 'type' were x1; ["fix_route: 'Use documented held handles and literal cue resolution;  x1 | not recovered (finding object; only its length is logged) |
| gemini-balanced | skeptic | get_fact | 1 | 0 | none | 1 distinct ids |
| gemini-balanced | script | report_finding | 1 | 1 | ["(root): Additional properties are not allowed ('note' was unexpected x1 | not recovered (finding object; only its length is logged) |
| gemini-balanced | storyboard | get_beat | 10 | 10 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x10 | {"id": "b01"} x1; {"id": "b02"} x1; {"id": "b03"} x1; {"id": "b04"} x1; {"id": "b05"} x1; {"id": "b06"} x1; {"id": "b07"} x1; {"id": "b08"} x1; {"id": "b09"} x1; {"id": "b10"} x1 |
| gemini-balanced | storyboard | get_style_pack | 1 | 0 | none | {} (no arguments) |
| gemini-balanced | storyboard | report_finding | 1 | 1 | ["(root): Additional properties are not allowed ('note' was unexpected x1 | not recovered (finding object; only its length is logged) |
| mixed-value | skeptic | get_fact | 3 | 0 | none | 3 distinct ids |
| mixed-value | pedagogy | get_fact | 5 | 0 | none | 5 distinct ids |
| mixed-value | script | get_fact | 8 | 0 | none | 8 distinct ids |
| mixed-value | script | get_source_chunks | 2 | 0 | none | NOT RECOVERED x2 |
| mixed-value | storyboard | get_beat | 6 | 6 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x6 | {"id": "b01"} x2; {"id": "b09"} x2; {"id": "b26"} x2 |
| mixed-value | storyboard | get_style_pack | 4 | 0 | none | {} (no arguments) |
| mixed-value | storyboard | report_finding | 4 | 3 | ["(root): Additional properties are not allowed ('issue', 'tool' were  x2; ['fix_route: "Check get_beat\'s handling of beat records where a field x1 | not recovered (finding object; only its length is logged) |
| mixed-value | scene | get_beat | 9 | 9 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x9 | {"id": "b11"} x3; {"id": "b09"} x2; {"id": "b08"} x1; {"id": "b10"} x1; {"id": "b12"} x1; {"id": "b13"} x1 |
| mixed-value | scene | get_style_pack | 4 | 0 | none | {} (no arguments) |
| mixed-value | scene | report_finding | 1 | 1 | ["(root): Additional properties are not allowed ('note' was unexpected x1 | not recovered (finding object; only its length is logged) |
| budget | skeptic | get_fact | 12 | 0 | none | 12 distinct ids |
| budget | skeptic | report_finding | 1 | 1 | ["(root): Additional properties are not allowed ('detail', 'type' were x1 | not recovered (finding object; only its length is logged) |
| budget | script | get_fact | 1 | 0 | none | 1 distinct ids |
| budget | storyboard_outline | get_style_pack | 1 | 0 | none | {} (no arguments) |
| budget | storyboard | get_beat | 28 | 28 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x28 | {"id": "b01"} x2; {"id": "b17"} x2; {"id": "b02"} x1; {"id": "b03"} x1; {"id": "b04"} x1; {"id": "b05"} x1; {"id": "b06"} x1; {"id": "b07"} x1; {"id": "b08"} x1; {"id": "b09"} x1; {"id": "b10"} x1; {"id": "b11"} x1; {"id": "b12"} x1; {"id": "b13"} x1; {"id": "b14"} x1; {"id": "b15"} x1; {"id": "b16"} x1; {"id": "b18"} x1; {"id": "b19"} x1; {"id": "b20"} x1; {"id": "b21"} x1; {"id": "b22"} x1; {"id": "b23"} x1; {"id": "b24"} x1; {"id": "b25"} x1; {"id": "b26"} x1 |
| budget | storyboard | get_style_pack | 3 | 0 | none | {} (no arguments) |
| budget | storyboard | report_finding | 4 | 3 | ["(root): Additional properties are not allowed ('effect', 'error', 't x1; ["(root): Additional properties are not allowed ('message', 'scope', ' x1; ["fix_route: 'Repair get_beat input handling; verify timing at compose x1 | not recovered (finding object; only its length is logged) |
| budget | scene | get_beat | 21 | 21 | get_beat failed: AttributeError: 'str' object has no attribute 'get' x21 | {"id": "b14"} x3; {"id": "b08"} x2; {"id": "b13"} x2; {"id": "b21"} x2; {"id": "b22"} x2; {"id": "b01"} x1; {"id": "b03"} x1; {"id": "b04"} x1; {"id": "b06"} x1; {"id": "b11"} x1; {"id": "b17"} x1; {"id": "b18"} x1; {"id": "b20"} x1; {"id": "b23"} x1; {"id": "b25"} x1 |
| budget | scene | get_style_pack | 14 | 0 | none | {} (no arguments) |
| budget | scene | report_finding | 3 | 2 | ["(root): Additional properties are not allowed ('description', 'tool' x1; ["fix_route: 'Inspect tool wrapper in server for get_beat' is not one  x1 | not recovered (finding object; only its length is logged) |

## 2h. SCENE_API sections received by scene workers (at least once per worker)

| project | scene workers | ctx | kit | motion | Rules | Expressive motion | Characters, depth and isometric (cut at 12000 of 16700 chars) | Real artefacts | Primitives from the TED-Ed study | failed names (count) |
|---|---|---|---|---|---|---|---|---|---|---|
| claude-balanced | 24 | 19 | 9 | 13 | 3 | 0 | 12 | 0 | 0 | none |
| openai-balanced | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 1 | Loom.treat x1; Treatments x1 |
| gemini-balanced | 0 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| mixed-value | 4 | 4 | 4 | 4 | 4 | 1 | 0 | 2 | 2 | Treatments x3 |
| budget | 14 | 14 | 13 | 14 | 12 | 10 | 10 | 14 | 8 | Treatments x5; Components x1; cue x1; docs/SCENE_API.md x1; meeting x1 |

## 2i. get_catalog_entry by catalog kind (kind looked up in today's runtime/catalog.json, modified 2026-10-07 20:48, after the bench)

| project | role | calls | template | blueprint | component | id not in today's catalog | tool errors |
|---|---|---|---|---|---|---|---|
| claude-balanced | storyboard | 11 | 11 | 0 | 0 | 0 | 0 |
| openai-balanced | storyboard_outline | 13 | 13 | 0 | 0 | 0 | 0 |
| openai-balanced | storyboard | 34 | 33 | 1 | 0 | 0 | 1 |
| gemini-balanced | storyboard | 11 | 7 | 4 | 0 | 0 | 0 |
| mixed-value | storyboard | 71 | 52 | 19 | 0 | 0 | 2 |
| budget | storyboard | 37 | 26 | 11 | 0 | 0 | 0 |

## 3. Tools offered (start event) and never called, per project and role

| project | role | tools offered | called (distinct) | offered but never called | called but not offered |
|---|---|---|---|---|---|
| claude-balanced | brief | list_skill_sections, get_skill_section, report_finding, submit_brief | 1 | list_skill_sections, get_skill_section, report_finding | none |
| claude-balanced | knowledge | list_skill_sections, get_skill_section, report_finding, submit_knowledge | 1 | list_skill_sections, get_skill_section, report_finding | none |
| claude-balanced | skeptic | get_fact, report_finding, submit_skeptic_verdict | 2 | report_finding | none |
| claude-balanced | pedagogy | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_teaching_plan | 1 | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact | none |
| claude-balanced | persona_pick | submit_persona_pick | 1 | none | none |
| claude-balanced | script | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_script | 1 | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact | none |
| claude-balanced | storyboard_outline | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_outline | 3 | list_skill_sections, report_finding, get_catalog_entry, get_style_pack, get_beat | none |
| claude-balanced | storyboard | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_storyboard | 4 | list_skill_sections, report_finding, catalog_search, get_beat | none |
| claude-balanced | scene | list_skill_sections, get_skill_section, report_finding, get_api_section, get_example_scene, get_style_pack, get_beat, lab_snapshot, submit_scene | 5 | list_skill_sections, get_skill_section, report_finding, lab_snapshot | none |
| openai-balanced | brief | list_skill_sections, get_skill_section, report_finding, submit_brief | 3 | list_skill_sections | none |
| openai-balanced | knowledge | list_skill_sections, get_skill_section, report_finding, submit_knowledge | 2 | list_skill_sections, report_finding | none |
| openai-balanced | skeptic | get_fact, report_finding, submit_skeptic_verdict | 2 | report_finding | none |
| openai-balanced | pedagogy | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_teaching_plan | 4 | report_finding, get_source_chunks | none |
| openai-balanced | persona_pick | submit_persona_pick | 1 | none | none |
| openai-balanced | script | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_script | 4 | list_skill_sections, get_source_chunks | none |
| openai-balanced | storyboard_outline | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_outline | 8 | none | none |
| openai-balanced | storyboard | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_storyboard | 8 | none | none |
| openai-balanced | scene | list_skill_sections, get_skill_section, report_finding, get_api_section, get_example_scene, get_style_pack, get_beat, lab_snapshot, submit_scene | 9 | none | none |
| gemini-balanced | brief | list_skill_sections, get_skill_section, report_finding, submit_brief | 1 | list_skill_sections, get_skill_section, report_finding | none |
| gemini-balanced | knowledge | list_skill_sections, get_skill_section, report_finding, submit_knowledge | 1 | list_skill_sections, get_skill_section, report_finding | none |
| gemini-balanced | skeptic | get_fact, report_finding, submit_skeptic_verdict | 3 | report_finding | get_skill_section |
| gemini-balanced | pedagogy | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_teaching_plan | 3 | report_finding, get_source_chunks, get_fact | none |
| gemini-balanced | persona_pick | submit_persona_pick | 1 | none | none |
| gemini-balanced | script | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_script | 2 | list_skill_sections, get_skill_section, get_source_chunks, get_fact | none |
| gemini-balanced | storyboard_outline | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_outline | 3 | list_skill_sections, report_finding, get_catalog_entry, get_style_pack, get_beat | none |
| gemini-balanced | storyboard | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_storyboard | 6 | list_skill_sections, catalog_search | none |
| mixed-value | brief | list_skill_sections, get_skill_section, report_finding, submit_brief | 2 | list_skill_sections, report_finding | none |
| mixed-value | knowledge | list_skill_sections, get_skill_section, report_finding, submit_knowledge | 2 | list_skill_sections, report_finding | none |
| mixed-value | skeptic | get_fact, report_finding, submit_skeptic_verdict | 2 | report_finding | none |
| mixed-value | pedagogy | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_teaching_plan | 3 | list_skill_sections, report_finding, get_source_chunks | none |
| mixed-value | persona_pick | submit_persona_pick | 1 | none | none |
| mixed-value | script | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_script | 5 | report_finding | none |
| mixed-value | storyboard_outline | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_outline | 2 | list_skill_sections, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat | none |
| mixed-value | storyboard | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_storyboard | 8 | none | none |
| mixed-value | scene | list_skill_sections, get_skill_section, report_finding, get_api_section, get_example_scene, get_style_pack, get_beat, lab_snapshot, submit_scene | 9 | none | none |
| budget | brief | list_skill_sections, get_skill_section, report_finding, submit_brief | 3 | report_finding | none |
| budget | knowledge | list_skill_sections, get_skill_section, report_finding, submit_knowledge | 3 | report_finding | none |
| budget | skeptic | get_fact, report_finding, submit_skeptic_verdict | 3 | none | none |
| budget | pedagogy | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_teaching_plan | 3 | report_finding, get_source_chunks, get_fact | none |
| budget | persona_pick | submit_persona_pick | 1 | none | none |
| budget | script | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_script | 4 | report_finding, get_source_chunks | none |
| budget | storyboard_outline | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_outline | 5 | report_finding, get_catalog_entry, get_beat | none |
| budget | storyboard | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_storyboard | 8 | none | none |
| budget | scene | list_skill_sections, get_skill_section, report_finding, get_api_section, get_example_scene, get_style_pack, get_beat, lab_snapshot, submit_scene | 9 | none | none |

### All projects pooled: offered but never called by any task of the role

| role | tasks | offered | never called in any project |
|---|---|---|---|
| brief | 5 | list_skill_sections, get_skill_section, report_finding, submit_brief | none |
| knowledge | 7 | list_skill_sections, get_skill_section, report_finding, submit_knowledge | report_finding |
| skeptic | 5 | get_fact, report_finding, submit_skeptic_verdict | none |
| pedagogy | 6 | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_teaching_plan | report_finding, get_source_chunks |
| persona_pick | 5 | submit_persona_pick | none |
| script | 5 | list_skill_sections, get_skill_section, report_finding, get_source_chunks, get_fact, submit_script | none |
| storyboard_outline | 6 | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_outline | none |
| storyboard | 9 | list_skill_sections, get_skill_section, report_finding, catalog_search, get_catalog_entry, get_style_pack, get_beat, submit_storyboard | none |
| scene | 43 | list_skill_sections, get_skill_section, report_finding, get_api_section, get_example_scene, get_style_pack, get_beat, lab_snapshot, submit_scene | none |

## 4. What could not be recovered, tool by tool

Stated explicitly, per tool, across all five projects (source: `ws5_events.json`, field `args`).

| tool | calls | recovered | not recovered | why, and what IS known for the unrecovered calls |
|---|---|---|---|---|
| get_api_section | 198 | 198 | 0 | all names recovered; returned section also inferred from length (184 successes, 0 mismatches) |
| list_skill_sections | 65 | 65 | 0 | 3 of them were errors whose error text also quotes the name |
| get_skill_section | 239 | 238 | 1 | the 1 is gemini-balanced `skeptic-b158269e`: 50 chars of args, refused because the skeptic role is not offered the tool; no candidate matched |
| get_example_scene | 97 | 97 | 0 | returned file also inferred from length (58 successes, 0 mismatches) |
| catalog_search | 31 | 6 | 25 | free-text queries; only hash and length logged. Unrecovered argument lengths 38 to 187 chars (a query of 5 to 173 chars, depending on whether `kind` was set). 4 of the 25 returned zero results (`result_chars` 62, the exact length of an empty result); the `kind` of the 25 is unknown |
| get_catalog_entry | 177 | 177 | 0 | none |
| get_beat | 112 | 112 | 0 | none (all 112 calls errored) |
| get_fact | 86 | 86 | 0 | ids recovered; the report gives counts only |
| get_style_pack | 39 | 39 | 0 | takes no arguments |
| get_source_chunks | 2 | 0 | 2 | free-text queries (mixed-value script; 101 and 205 chars of args); not recoverable |
| lab_snapshot | 18 | 6 | 12 | time lists recovered for 6 (on a half-second grid); for all 18 the args are 16 to 33 chars, which proves no call carried `source` (a scene file is thousands of chars) |
| report_finding | 34 | 0 | 34 | a free object; not recoverable. 24 of the 34 were refused by the finding schema (15 for extra properties, 9 for a `fix_route` outside its enum) and 10 were logged; error text in table 2g |
| submit_* (9 tools) | 110 | 0 | 110 | whole artifacts; not recoverable and not needed. `accepted` is logged for every call (table 2f) |

## 5. Summary

**Did scene workers fetch the SCENE_API sections on characters, places, objects, data, depth, isometric, fx moments, Lottie, UI artefacts, TED-Ed primitives, manim/skia/three?**

SCENE_API.md has only 8 `##` sections, and `get_api_section` can only return one of those 8 whole (or cut). Many of the asked topics are bold paragraphs INSIDE a section, so a worker gets them only by fetching the parent section. Mapping (from `docs/SCENE_API.md`, unchanged since before the bench):

| topic | where it lives | scene workers that received it (of 43) | calls |
|---|---|---|---|
| characters (rigs), scenery, depth stage (2.5D), isometric, glow kit, treatments, objects, places and the camera, vendor art | "Characters, depth and isometric", chars 0 to 11863 of the section, inside the 12000-char cut | 22 (claude-balanced 12 of 24, budget 10 of 14, mixed-value 0 of 4, openai-balanced 0 of 1) | 23 |
| data as a picture | same section, starts at char 11863: only its first 137 chars were delivered | 0 received it whole | 0 whole |
| real geography, hold and transform, object recipe, screen joins, finish (fx.js grain, vignette, paper), imported characters (Claude Design rigs) | same section, chars 13235 to 16700: beyond the cut | 0 | 0 |
| fx moments (`ctx.fxMoment`), Lottie (`ctx.lottie`), the one-line pointer to skia and three scenes | "Expressive motion" | 12 (budget 10, mixed-value 1, openai-balanced 1, claude-balanced 0) | 12 |
| UI artefacts, camera on an element, props, scale and people | "Real artefacts" | 17 (budget 14, mixed-value 2, openai-balanced 1, claude-balanced 0) | 17 |
| TED-Ed primitives | "Primitives from the TED-Ed study" | 11 (budget 8, mixed-value 2, openai-balanced 1, claude-balanced 0) | 11 |
| manim | not in SCENE_API.md at all (it is in `docs/MANIM.md`, `docs/VISUALS_PLUS.md`, which no tool can serve: the guide aliases are STORYBOARD_GUIDE, SCENE_API, REFERENCE_FIRST, COMPONENTS, LAYOUT) | 0 | 0 |

- So: characters, places, objects, depth and isometric were received by 22 of 43 scene workers (every time cut at 12000 chars); data, fx finish and imported characters by 0; fx moments and Lottie by 12; UI artefacts by 17; TED-Ed primitives by 11; manim by 0; skia/three only as a one-line pointer inside "Expressive motion" (12).
- claude-balanced's 24 scene workers fetched only ctx (19 workers), motion (13), Characters (12), kit (9), Rules (3), one call each: none fetched Expressive motion, Real artefacts or TED-Ed primitives, none read a skill section, none called `lab_snapshot`.
- 14 `get_api_section` calls failed on names that are not `##` headings: "Treatments" 9 (it is a bold paragraph inside the Characters section; the `loom-scene-author` heading the agents read cites `docs/SCENE_API.md, "Treatments"`), "Loom.treat", "Components", "cue", "meeting", "docs/SCENE_API.md" 1 each. The openai-balanced scene worker logged this as a finding ("Treatments API is referenced by the skill but not exposed by get_api_section").
- Skill-side reading by scene workers: `loom-scene-author :: Primitives from the TED-Ed study (D-114)` 7, `:: Characters, depth and isometric (...)` 4, `:: Real things, real scale, the film` 2 (all budget). `lnd-character-design` was fetched by 0 tasks of any role in all five projects.
- `get_example_scene` can only ever return `scenes_examples/b05.js` or `b10.js` (the tool globs `scenes_examples/*.js`, top level only). The 42 files in `scenes_examples/lab/` (lab_characters, lab_places, lab_objects, lab_data, lab_iso, lab_depth, lab_lottie, lab_fx, lab_ui_artefacts and others) and the `skia/` and `three/` folders were unreachable. 39 of 97 calls asked for a topic tag ("illustrated" 8, "story-cartoon" 5, "bespoke" 3, "meeting_table" 3, "character" 1 and others) and all 39 failed; all 58 successes used the literal tags "b05" or "b10".
- `get_beat` failed on all 112 calls (scene 54, storyboard 57, outline 1), so no scene or storyboard agent ever received its beat's timings or storyboard scene through the tool.

**Did any storyboard agent search for anything beyond templates?**

- Storyboard roles (`storyboard_outline`, `storyboard`) were offered catalog and skill tools only: never `get_api_section`, `get_example_scene` or `lab_snapshot`.
- `catalog_search`: 31 calls (outline 20, storyboard 11). Recovered 6: "character" kind=blueprint (openai-balanced and gemini-balanced outlines), "portal" kind=blueprint and "portal" with no kind (openai-balanced outlines), "compare" kind=template, "recap" kind=template. So at least 4 searches reached beyond templates: 3 restricted to blueprints, 1 over all kinds. No recovered search used kind=component. The other 25 queries are not recoverable.
- `get_catalog_entry`: 177 calls; by today's catalog kind 142 template ids, 35 blueprint ids (all `hero.*`: character_moment, hub, journey, meter, portal), 0 component ids. claude-balanced's storyboard fetched 11 template ids and 0 blueprints; it ran 0 `catalog_search` (its outline ran 1).
- Skill reading on characters by storyboard roles: `lnd-visual-storyteller :: 6. Cast (when there are people)` 4 calls (openai-balanced outline 3, one refused at the tool-call limit; budget outline 1). No storyboard task read `lnd-character-design`.
- The scene role was not offered `catalog_search` or `get_catalog_entry` in any project (start events), although today's `loom/agents/roles/scene.md` (modified after the bench) names them, and the openai-balanced scene worker logged "Catalog lookup and run_gate tools not exposed".
