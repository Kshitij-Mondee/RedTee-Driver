# Shuttle report: gps-position

Mode: subscription; lead: sonnet; written 2026-10-11T00:38:24.

Shuttle: gps-position  current done
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   accepted  
      P7   lesson kit               accepted  
      P8   beats                    accepted  
      P9   compose and check        accepted  
      P10  critique and fix         accepted  
      P11  render                   accepted  
      spent: $36.5203 (notional), 51482343 tokens, 1000 calls; limits {'usd': 80.0}; reopens 2 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table; notional in subscription mode)
- total $36.5203, 51482343 tokens, 1000 model calls; cache reads 45792445 of 50298221 input tokens (91 %)
- by phase: - $0.2355 (15), P1 $0.2945 (8), P10 $0.5482 (21), P11 $0.7999 (4), P2 $0.1949 (7), P3 $0.5640 (8), P4 $0.4972 (5), P5 $3.8048 (26), P6 $1.9341 (13), P7 $1.6325 (46), P8 $16.0854 (749), P9 $9.9292 (98)
- by agent: critic $0.1638 (12), lead $12.8539 (219), shuttle-fact-finder $0.1145 (2), shuttle-fixer $4.0155 (198), shuttle-kit-builder $2.1238 (29), shuttle-scene-author $17.1983 (539), skeptic $0.0505 (1)
- models: claude-opus-5-5 x56, claude-sonnet-5-5 x945, gemini-3.8-flash x13
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 46 turns $2.0261 (1 cache misses); P5 success 30 turns $3.1628 (0 cache misses); P6 success 6 turns $0.3601 (0 cache misses); P7 success 11 turns $4.2590 (1 cache misses); P8 success 89 turns $34.1660 (2 cache misses); P9 success 31 turns $3.7451 (0 cache misses); P5 success 18 turns $0.8511 (0 cache misses); P6 success 7 turns $0.3921 (0 cache misses); P8 success 4 turns $0.1222 (0 cache misses); P9 success 4 turns $0.1219 (0 cache misses); P7 success 11 turns $0.9062 (1 cache misses); P8 success 4 turns $0.1198 (0 cache misses); P9 success 19 turns $0.4679 (0 cache misses); P7 success 9 turns $0.5153 (1 cache misses); P8 success 4 turns $0.1219 (0 cache misses); P9 success 4 turns $0.1103 (0 cache misses); P10 success 54 turns $5.4500 (1 cache misses); P11 success 4 turns $0.2658 (0 cache misses)
- the CLI's own total, each session counted once: $57.1639 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 2 of 3; for named beats 1 of 8
- 2026-10-10T23:43:44 P5 for b12, b16, b22, b23, b24, b26, b27, b28, b34 by lead: Check P9 held_missing: the storyboard's continuity.held/keep names for these beats do not exist in the previous beat's built scene (scene authors named elements differently, e.g. b12 keeps 'readout' but b11 builds 'timer'/'readout_link'; b22-b24 keep phone_pt, circle_a/b/c but b21 builds 'circles'; b26-b28 keep top_clock/bottom_clock but b25 builds others; b34 keeps dot/halo not built by b33; b16 keeps 'ring'). Beat-scope fixers cannot clear this (six fixers tried). Patch these scenes' keep/held to the element names the previous beat actually builds (read scenes/<prev>.js ctx.el names and the beat's own ctx.held calls), not the scene files. (stale P5; voided none)
- 2026-10-10T23:49:13 P7 by lead: check fails only on kit tight_inset: scenes/_kit.js signal mkChip (~lines 647-659) pill w = 56+tw leaves its text box flush (-0.5px) with the pill edge; needs pill w = 56+tw+16. Affects b07 (and any beat using signal pinText/stampText). (stale P7; voided final)
- 2026-10-10T23:59:45 P7 by lead: Root cause of b07 tight_inset on part signal found: the probe's containerOf (runtime/kit.js 388-412) skips offset shadows only when they carry class "lm-shadow". The chip's shadow rect (scenes/_kit.js line 651, mkChip) has no class, so the probe takes it as the pill: it sits 8px lower (y -20..36), the 41px-high text (y -20.5..20.5) is 0.5px above its top edge, inset -0.5. The earlier width fix (w = 56+tw+16) could not matter: the limiting side is the top. Fix: add class: "lm-shadow" to that shadow rect attributes. Nothing else changes. (stale P7; voided final)

## Delegations
- own-fact-finder-488e79a1 fact-finder  collected: 2 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-7a1a32f5 kit-builder ['b03', 'b06', 'b12', 'b15', 'b19', 'b27', 'b30'] collected: 41 calls, accepted ['submit_kit'], refused 0, snapshots 8
- own-scene-author-dafb50e8 scene-author ['b02'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-6b8c6c82 scene-author ['b03'] collected: 26 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-312f4034 scene-author ['b01'] collected: 15 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-e32356d4 scene-author ['b04'] collected: 12 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-54147474 scene-author ['b05'] collected: 40 calls, accepted ['submit_scene'], refused 1, snapshots 16
- own-scene-author-cad51dcd scene-author ['b06'] collected: 48 calls, accepted ['submit_scene'], refused 2, snapshots 22
- own-scene-author-e43975a9 scene-author ['b07'] collected: 40 calls, accepted ['submit_scene'], refused 0, snapshots 17
- own-scene-author-6fba7231 scene-author ['b08'] collected: 35 calls, accepted ['submit_scene'], refused 2, snapshots 11
- own-scene-author-d117ae5b scene-author ['b09'] collected: 32 calls, accepted ['submit_scene'], refused 2, snapshots 12
- own-scene-author-98f6d4ba scene-author ['b10'] collected: 28 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-0c7e3209 scene-author ['b11'] collected: 31 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-scene-author-d4a85209 scene-author ['b12'] collected: 42 calls, accepted ['submit_scene'], refused 1, snapshots 11
- own-scene-author-8086ed25 scene-author ['b13'] collected: 23 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-50e2e72e scene-author ['b14'] collected: 24 calls, accepted ['submit_scene'], refused 2, snapshots 6
- own-scene-author-c5813e5b scene-author ['b15'] collected: 24 calls, accepted ['submit_scene'], refused 2, snapshots 9
- own-scene-author-870396a8 scene-author ['b16'] collected: 36 calls, accepted ['submit_scene'], refused 0, snapshots 10
- own-scene-author-c6f1476a scene-author ['b17'] collected: 34 calls, accepted ['submit_scene'], refused 2, snapshots 13
- own-scene-author-e5ddf364 scene-author ['b18'] collected: 36 calls, accepted ['submit_scene'], refused 2, snapshots 16
- own-scene-author-09095f13 scene-author ['b19'] collected: 15 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-scene-author-bfe8f4b4 scene-author ['b20'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-c8da4d89 scene-author ['b21'] collected: 18 calls, accepted ['submit_scene'], refused 1, snapshots 7
- own-scene-author-d05be5aa scene-author ['b22'] collected: 24 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-29b8abf4 scene-author ['b23'] collected: 14 calls, accepted [], refused 1, snapshots 3
- own-scene-author-c055e941 scene-author ['b24'] collected: 19 calls, accepted [], refused 1, snapshots 3
- own-scene-author-9bbab813 scene-author ['b25'] collected: 10 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-60a81432 scene-author ['b26'] collected: 15 calls, accepted [], refused 2, snapshots 3
- own-scene-author-dec99b29 scene-author ['b27'] collected: 16 calls, accepted [], refused 1, snapshots 4
- own-scene-author-4a64f698 scene-author ['b28'] collected: 19 calls, accepted [], refused 1, snapshots 5
- own-scene-author-e5dc7f12 scene-author ['b29'] collected: 9 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-scene-author-366d6d7b scene-author ['b30'] collected: 13 calls, accepted ['submit_scene'], refused 1, snapshots 4
- own-scene-author-05e53225 scene-author ['b31'] collected: 12 calls, accepted ['submit_scene'], refused 1, snapshots 4
- own-scene-author-8f10aaf3 scene-author ['b32'] collected: 23 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-cd598858 scene-author ['b33'] collected: 16 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-3c056bc8 scene-author ['b34'] collected: 20 calls, accepted [], refused 1, snapshots 8
- own-fixer-6482801c fixer ['b23'] collected: 7 calls, accepted [], refused 1, snapshots 2
- own-fixer-7a127f5c fixer ['b24'] collected: 10 calls, accepted [], refused 1, snapshots 3
- own-fixer-351b629b fixer ['b26'] collected: 6 calls, accepted [], refused 1, snapshots 2
- own-fixer-814b2b65 fixer ['b27'] collected: 8 calls, accepted [], refused 1, snapshots 2
- own-fixer-cf1072a9 fixer ['b28'] collected: 8 calls, accepted [], refused 1, snapshots 2
- own-fixer-4344fcbd fixer ['b34'] collected: 10 calls, accepted [], refused 1, snapshots 3
- own-fixer-8d70edb1 fixer ['b07'] collected: 19 calls, accepted [], refused 0, snapshots 10
- own-fixer-a643c3f8 fixer ['b07'] collected: 33 calls, accepted [], refused 0, snapshots 16
- own-fixer-5e23df64 fixer ['b07'] collected: 19 calls, accepted [], refused 0, snapshots 8
- own-kit-builder-a44848e7 kit-builder  collected: 8 calls, accepted ['submit_kit'], refused 0, snapshots 1
- own-kit-builder-13ab5c14 kit-builder ['b07'] collected: 5 calls, accepted ['submit_kit'], refused 0, snapshots 1
- own-fixer-d87d9af1 fixer ['b15', 'b16', 'b17'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-fixer-ba98eea7 fixer ['b12'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-e5fd70de fixer ['b03'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 9
- own-fixer-37b2e6a2 fixer ['b15'] collected: 16 calls, accepted [], refused 0, snapshots 5
- own-fixer-7c28fc17 fixer ['b16'] collected: 20 calls, accepted [], refused 0, snapshots 6
- own-fixer-ca6a85c1 fixer ['b17'] collected: 18 calls, accepted [], refused 0, snapshots 5
- own-fixer-c41032d9 fixer ['b15', 'b16', 'b17', 'b18'] open: 26 calls, accepted [], refused 0, snapshots 7

## Tool calls (tool, outcome, count)
- accept_phase ok: 7
- animatic ok: 2
- budget_status ok: 1
- capabilities ok: 3
- catalog_search ok: 5
- check ok: 6
- check refused: 1
- choose_persona ok: 1
- collect ok: 12
- contact_sheet ok: 14
- critic_review ok: 2
- delegate ok: 13
- delegate refused: 1
- get_api_section error: 6
- get_api_section ok: 109
- get_beat ok: 112
- get_catalog_entry error: 18
- get_example_scene ok: 3
- get_skill_section error: 1
- get_skill_section ok: 17
- get_style_pack ok: 32
- get_world_pack ok: 1
- kit_preview ok: 10
- lab_snapshot error: 7
- lab_snapshot ok: 292
- lab_snapshot refused: 40
- lesson_status ok: 17
- list_skill_sections ok: 7
- narrate ok: 2
- note ok: 23
- patch_storyboard ok: 2
- pilot_check ok: 3
- read_artifact error: 56
- read_artifact ok: 337
- render ok: 1
- reopen ok: 3
- reopen refused: 1
- report_finding ok: 27
- report_finding refused: 2
- request_approval ok: 4
- skeptic_review ok: 1
- submit_brief ok: 1
- submit_kit ok: 3
- submit_knowledge ok: 1
- submit_outline ok: 2
- submit_review ok: 2
- submit_scene ok: 71
- submit_script ok: 2
- submit_storyboard ok: 2
- submit_teaching_plan error: 1
- submit_teaching_plan ok: 3

## Refusals by the rails
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-312f4034', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-e32356d4', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-54147474', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-cad51dcd', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-98f6d4ba', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-d117ae5b', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-8086ed25', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-6fba7231', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-c5813e5b', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-50e2e72e', owner))
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [93.8, 95, 97, 99, 100.5] is too long
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-d05be5aa', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-e5ddf364', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-c8da4d89', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-c6f1476a', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-09095f13', owner))
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [] should be non-empty
- lab_snapshot (scene-author): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-scene-author-8f10aaf3', owner))
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [60.3, 62.4, 64.4, 65.3, 65.75] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [119.5, 122, 123.4, 124.4, 124.7, 125.5] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [100.8, 102, 104, 105.6, 106.6] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [38, 38.8, 39.5, 41.5, 44.15] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [111.7, 113, 115.2, 117.6, 118.1, 118.8] is too long
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-29b8abf4', owner) then read_artifact('brief:own-scene-author-29b8abf4#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-9bbab813', owner) then read_artifact('brief:own-scene-author-9bbab813#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-60a81432', owner) then read_artifact('brief:own-scene-author-60a81432#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-dec99b29', owner) then read_artifact('brief:own-scene-author-dec99b29#2', owner))
- report_finding (scene-author): bad arguments for report_finding: Additional properties are not allowed ('beat' was unexpected)
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-4a64f698', owner) then read_artifact('brief:own-scene-author-4a64f698#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-05e53225', owner) then read_artifact('brief:own-scene-author-05e53225#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-e5dc7f12', owner) then read_artifact('brief:own-scene-author-e5dc7f12#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-366d6d7b', owner) then read_artifact('brief:own-scene-author-366d6d7b#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-c055e941', owner) then read_artifact('brief:own-scene-author-c055e941#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-3c056bc8', owner) then read_artifact('brief:own-scene-author-3c056bc8#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-scene-author-cd598858', owner) then read_artifact('brief:own-scene-author-cd598858#2', owner))
- report_finding (scene-author): bad arguments for report_finding: Additional properties are not allowed ('beat' was unexpected)
- delegate (lead): scenes/b24.js is owned by the open token own-scene-author-c055e941 (scene-author): collect it first (one writer per file)
- lab_snapshot (fixer): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-fixer-6482801c', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-fixer-7a127f5c', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-fixer-351b629b', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-fixer-814b2b65', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-fixer-cf1072a9', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 1 of 2 not read yet (read_artifact('brief:own-fixer-4344fcbd', owner))
- reopen (lead): nothing to reopen: P7 is after the current phase P5; just work on P5
- check (lead): check belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is edited; beat files not accepted yet: scenes/b15.js, scenes/b17.js

## What the lead looked at
- animatic 4 (lead)
- kit_preview  (lead)
- kit_preview  (scene-author)
- kit_preview  (scene-author)
- animatic 4 (lead)
- kit_preview  (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b19', 'b20', 'b21', 'b22', 'b23', 'b24', 'b25', 'b26', 'b27'] (lead)
- contact_sheet ['b28', 'b29', 'b30', 'b31', 'b32', 'b33', 'b34'] (lead)
- contact_sheet ['b15', 'b16', 'b25'] (lead)
- contact_sheet ['b12', 'b03', 'b17'] (lead)
- contact_sheet ['b15', 'b16', 'b17', 'b18'] (fixer)
- contact_sheet ['b01', 'b05', 'b10', 'b25', 'b30'] (fixer)
- contact_sheet ['b15', 'b16', 'b17'] (lead)
- contact_sheet ['b15', 'b16'] (fixer)
- contact_sheet ['b16', 'b17', 'b18'] (fixer)
- contact_sheet ['b08', 'b12', 'b14'] (fixer)
- contact_sheet ['b13', 'b14', 'b16'] (fixer)
- contact_sheet ['b03', 'b12', 'b15', 'b16', 'b17', 'b18'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 3
- kit: 0
- scene: 0
- engine: 0
