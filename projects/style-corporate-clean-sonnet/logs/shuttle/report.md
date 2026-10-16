# Shuttle report: style-corporate-clean-sonnet

Mode: api; lead: sonnet; written 2026-10-14T12:45:47.

Shuttle: style-corporate-clean-sonnet  current done
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
      spent: $8.6548, 7641030 tokens, 197 calls; limits {'usd': 16.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $8.6548, 7641030 tokens, 197 model calls; cache reads 5071922 of 7455985 input tokens (68 %)
- by phase: - $0.0935 (7), P10 $0.1570 (9), P11 $0.0627 (3), P8 $8.0794 (164), P9 $0.2622 (14)
- by agent: critic $0.0870 (6), lead $0.8229 (33), shuttle-fixer $0.6490 (15), shuttle-scene-author $7.0959 (143)
- models: claude-sonnet-5-5 x191, gemini-3.8-flash x6
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 14 turns $7.6026 (2 cache misses); P9 success 9 turns $0.7633 (0 cache misses); P10 success 7 turns $0.1445 (0 cache misses); P11 success 3 turns $0.0574 (0 cache misses)
- the CLI's own total, each session counted once: $8.5677 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-7e16e55b scene-author ['b02'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-deb6fb5f scene-author ['b03'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-7551287b scene-author ['b04'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-9ac3cec5 scene-author ['b05'] collected: 13 calls, accepted ['submit_scene'], refused 1, snapshots 4
- own-scene-author-514d57a4 scene-author ['b06'] collected: 17 calls, accepted ['submit_scene'], refused 1, snapshots 8
- own-scene-author-b80ae4eb scene-author ['b07'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-da417c0f scene-author ['b08'] collected: 25 calls, accepted [], refused 0, snapshots 11
- own-scene-author-42761234 scene-author ['b09'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-4957c590 scene-author ['b10'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-115d88ac scene-author ['b11'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-fb8e7f86 scene-author ['b12'] collected: 10 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-b5057594 scene-author ['b13'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-b62d9b2a scene-author ['b08'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-99d8fc8c fixer ['b06', 'b07'] collected: 18 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 8

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- capabilities ok: 1
- check ok: 2
- collect ok: 4
- contact_sheet ok: 4
- critic_review ok: 1
- delegate ok: 4
- get_api_section ok: 50
- get_beat ok: 1
- get_style_pack ok: 1
- lab_snapshot error: 6
- lab_snapshot ok: 55
- lab_snapshot refused: 2
- lesson_status ok: 3
- note ok: 4
- pilot_check ok: 1
- read_artifact error: 7
- read_artifact ok: 43
- render ok: 1
- report_finding ok: 1
- request_approval ok: 1
- submit_review ok: 3
- submit_scene ok: 17
- submit_scene refused: 1

## Refusals by the rails
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [34.9, 38.0, 39.8, 41.3, 43.0, 44.2] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [80.7, 82.0, 84.0, 85.2, 86.4] is too long
- submit_scene (scene-author): bad arguments for submit_scene: 'artifact' is a required property

## What the lead looked at
- contact_sheet ['b06', 'b07'] (lead)
- contact_sheet ['b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10'] (lead)
- contact_sheet ['b11', 'b12', 'b13', 'b01', 'b14'] (lead)
- contact_sheet ['b05', 'b06', 'b12'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 2
- engine: 0
