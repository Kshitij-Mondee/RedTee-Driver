# Shuttle report: gps-slice-sol

Mode: api; lead: sonnet; written 2026-10-12T22:13:55.

Shuttle: gps-slice-sol  current P10
      P1   brief                    accepted  
      P2   facts                    accepted  
      P3   pedagogy                 accepted  
      P4   persona and script       accepted  
      P5   storyboard               accepted  
      P6   narration and animatic   accepted  
      P7   lesson kit               accepted  
      P8   beats                    accepted  
      P9   compose and check        accepted  
      P10  critique and fix         open      critic_review of the current build; stage review is pending
      P11  render                   open      stage render is pending
      spent: $3.1278, 8678372 tokens, 266 calls; limits {'usd': 6.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $3.1278, 8678372 tokens, 266 model calls; cache reads 7847935 of 8615124 input tokens (91 %)
- by phase: P10 $0.0460 (4), P8 $2.7627 (244), P9 $0.3192 (18)
- by agent: lead $0.6726 (26), shuttle-fixer $0.2282 (15), shuttle-scene-author $2.2270 (225)
- models: claude-sonnet-5-5 x26, gpt-6.1-sol x240
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 21 turns $3.0337 (0 cache misses); P9 success 5 turns $0.0941 (0 cache misses)
- the CLI's own total, each session counted once: $3.1278 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-3f89c50f scene-author ['b08'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-19014bc9 scene-author ['b09'] collected: 20 calls, accepted [], refused 0, snapshots 6
- own-scene-author-9b6960e5 scene-author ['b09'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-ed983555 scene-author ['b10'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-366836ae scene-author ['b11'] collected: 28 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-e811af59 scene-author ['b12'] collected: 20 calls, accepted [], refused 0, snapshots 1
- own-scene-author-f3040d42 scene-author ['b13'] collected: 21 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-22c7e03d scene-author ['b14'] collected: 26 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-251a5f9b scene-author ['b15'] collected: 20 calls, accepted [], refused 0, snapshots 2
- own-scene-author-49510303 scene-author ['b16'] collected: 18 calls, accepted [], refused 0, snapshots 0
- own-scene-author-4d5e4e63 scene-author ['b17'] collected: 26 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-ea578853 scene-author ['b18'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-74b2d620 scene-author ['b12'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-3147c26f scene-author ['b15'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-69e2b874 scene-author ['b16'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-64a7cb6d fixer ['b16', 'b17'] collected: 25 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4

## Tool calls (tool, outcome, count)
- check ok: 1
- collect ok: 5
- contact_sheet error: 2
- contact_sheet ok: 2
- delegate ok: 5
- frames ok: 2
- get_api_section error: 4
- get_api_section ok: 48
- get_beat ok: 3
- get_example_scene ok: 11
- get_skill_section ok: 1
- get_style_pack ok: 15
- lab_snapshot error: 1
- lab_snapshot ok: 46
- lesson_status ok: 3
- list_skill_sections error: 1
- list_skill_sections ok: 1
- note ok: 1
- pilot_check ok: 1
- read_artifact error: 47
- read_artifact ok: 95
- report_finding ok: 22
- submit_scene ok: 13

## Refusals by the rails
- none

## What the lead looked at
- frames [59.3, 59.95, 66.5, 39.2] (fixer)
- frames [23, 28, 33, 36.5] (fixer)
- contact_sheet ['b08', 'b09', 'b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b14', 'b15', 'b16', 'b17', 'b18'] (lead)

## Hook denials
- none
