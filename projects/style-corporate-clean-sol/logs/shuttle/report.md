# Shuttle report: style-corporate-clean-sol

Mode: api; lead: sonnet; written 2026-10-14T12:51:03.

Shuttle: style-corporate-clean-sol  current done
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
      spent: $3.9092, 9801389 tokens, 270 calls; limits {'usd': 9.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $3.9092, 9801389 tokens, 270 model calls; cache reads 8632920 of 9724668 input tokens (89 %)
- by phase: - $0.0924 (8), P10 $0.2867 (28), P11 $0.0328 (4), P8 $3.2809 (210), P9 $0.2163 (20)
- by agent: critic $0.0859 (7), lead $0.8596 (48), shuttle-fixer $0.5201 (65), shuttle-scene-author $2.4436 (150)
- models: claude-sonnet-5-5 x48, gpt-6.1-sol x215, gemini-3.8-flash x7
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 18 turns $3.2546 (0 cache misses); P9 success 7 turns $0.2254 (0 cache misses); P10 success 13 turns $0.2547 (0 cache misses); P10 success 7 turns $0.0654 (0 cache misses); P11 success 3 turns $0.0232 (0 cache misses)
- the CLI's own total, each session counted once: $3.8233 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-4ec200b8 scene-author ['b02'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-bba330e2 scene-author ['b03'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-271eb014 scene-author ['b04'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-583421d7 scene-author ['b05'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-87dba481 scene-author ['b06'] collected: 22 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-6afcfad2 scene-author ['b07'] collected: 22 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-d13b44f7 scene-author ['b08'] collected: 30 calls, accepted [], refused 0, snapshots 4
- own-scene-author-d0c25d83 scene-author ['b09'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-fc8164fa scene-author ['b10'] collected: 22 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-f6b9f7c4 scene-author ['b11'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-da53416c scene-author ['b12'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-172f55ea scene-author ['b13'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-fb300287 fixer ['b03', 'b04'] collected: 13 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-c18f6004 fixer ['b05', 'b06'] collected: 11 calls, accepted [], refused 0, snapshots 2
- own-scene-author-c8a21923 scene-author ['b08'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-a6bdd2f1 fixer ['b05', 'b06'] collected: 11 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-a1974b35 fixer ['b07'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-f5ac6b16 fixer ['b08'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-92fa8cf8 fixer ['b02'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-3d95621c fixer ['b13'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- check ok: 3
- collect ok: 7
- contact_sheet ok: 6
- critic_review ok: 2
- delegate ok: 7
- frames ok: 1
- get_api_section error: 2
- get_api_section ok: 62
- get_beat ok: 1
- get_example_scene error: 2
- get_example_scene ok: 16
- get_style_pack ok: 14
- lab_snapshot error: 1
- lab_snapshot ok: 48
- lesson_status ok: 5
- note ok: 5
- pilot_check ok: 1
- read_artifact error: 13
- read_artifact ok: 97
- render ok: 1
- report_finding ok: 18
- request_approval ok: 1
- submit_review ok: 4
- submit_scene ok: 23

## Refusals by the rails
- none

## What the lead looked at
- frames [17.7, 26.35, 35.5] (fixer)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b02', 'b12', 'b13'] (lead)
- contact_sheet ['b01', 'b02', 'b13'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 2
- engine: 0
