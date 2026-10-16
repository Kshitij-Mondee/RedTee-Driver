# Shuttle report: wb-prioritise-classic

Mode: api; lead: sonnet; written 2026-10-15T22:13:43.

Shuttle: wb-prioritise-classic  current done
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
      spent: $6.8066, 10668933 tokens, 306 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $6.8066, 10668933 tokens, 306 model calls; cache reads 8747871 of 10483631 input tokens (83 %)
- by phase: - $0.4176 (35), P10 $0.7837 (41), P11 $0.0466 (4), P8 $4.8573 (185), P9 $0.7013 (41)
- by agent: critic $0.4110 (34), lead $1.5656 (66), shuttle-fixer $1.9182 (84), shuttle-scene-author $2.9118 (122)
- models: claude-sonnet-5-5 x66, gpt-5.6-terra x206, gemini-3.8-flash x34
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 14 turns $3.7693 (0 cache misses); P9 success 18 turns $0.3926 (0 cache misses); P9 success 4 turns $0.0666 (0 cache misses); P10 success 27 turns $2.1401 (0 cache misses); P11 success 3 turns $0.0270 (0 cache misses)
- the CLI's own total, each session counted once: $6.3957 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-3bb38c37 scene-author ['b02'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-9608e253 scene-author ['b03'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-c1bc667e fixer ['b02', 'b03'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-20143b96 scene-author ['b04'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-9687d9ec scene-author ['b05'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-60641d75 scene-author ['b06'] collected: 15 calls, accepted [], refused 0, snapshots 4
- own-scene-author-be27fa91 scene-author ['b07'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-19185395 scene-author ['b08'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-d1a9c135 scene-author ['b09'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-9081e47f scene-author ['b10'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-9a342968 scene-author ['b11'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-aa55b8de scene-author ['b12'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 10
- own-scene-author-c6f52807 scene-author ['b13'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-e2ba8ff6 fixer ['b05', 'b06'] collected: 10 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-41ad8632 fixer ['b10'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-732776db fixer ['b02'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-80f9769f fixer ['b06', 'b07'] collected: 15 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-fixer-18840423 fixer ['b08', 'b09', 'b10', 'b11', 'b12'] collected: 22 calls, accepted ['submit_scene', 'submit_scene'], refused 1, snapshots 8
- own-fixer-ca6b7c61 fixer ['b13'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-ea221101 fixer ['b04'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-fed18138 fixer ['b10', 'b11', 'b12'] collected: 12 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-6acba07d fixer ['b07', 'b08', 'b09', 'b10', 'b11', 'b12'] collected: 17 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 7
- own-fixer-2c2d4009 fixer ['b09', 'b10', 'b11', 'b12'] collected: 15 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 5

## Tool calls (tool, outcome, count)
- check error: 3
- check ok: 5
- collect ok: 9
- contact_sheet ok: 6
- critic_review error: 1
- critic_review ok: 4
- delegate ok: 9
- get_api_section error: 2
- get_api_section ok: 38
- get_example_scene ok: 9
- get_skill_section ok: 1
- get_style_pack ok: 12
- lab_snapshot error: 1
- lab_snapshot ok: 78
- lab_snapshot refused: 1
- lesson_status ok: 5
- note ok: 4
- pilot_check ok: 1
- read_artifact error: 3
- read_artifact ok: 84
- render ok: 1
- report_finding ok: 19
- request_approval ok: 1
- submit_review ok: 3
- submit_scene ok: 35

## Refusals by the rails
- lab_snapshot (fixer): bad arguments for lab_snapshot: 'new' is a required property

## What the lead looked at
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b07', 'b08', 'b10', 'b12'] (lead)
- contact_sheet ['b09', 'b12'] (lead)
- contact_sheet ['b09', 'b11', 'b12'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 0
- engine: 13
