# Shuttle report: style-line-art-sonnet

Mode: api; lead: sonnet; written 2026-10-14T10:32:09.

Shuttle: style-line-art-sonnet  current done
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
      spent: $4.8605, 6135468 tokens, 158 calls; limits {'usd': 16.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $4.8605, 6135468 tokens, 158 model calls; cache reads 4956252 of 5990606 input tokens (83 %)
- by phase: - $0.0917 (7), P10 $0.0961 (9), P11 $0.0805 (4), P5 $0.1116 (9), P6 $0.1042 (5), P8 $4.1502 (109), P9 $0.2263 (15)
- by agent: critic $0.0846 (6), lead $0.8672 (53), shuttle-scene-author $3.9088 (99)
- models: claude-sonnet-5-5 x152, gemini-3.8-flash x6
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 10 turns $4.2508 (0 cache misses); P9 success 10 turns $0.0796 (0 cache misses); P5-P6 success 15 turns $0.2295 (0 cache misses); P8 success 3 turns $0.0224 (0 cache misses); P9 success 4 turns $0.0307 (0 cache misses); P10 success 8 turns $0.0943 (0 cache misses); P11 success 3 turns $0.0686 (0 cache misses)
- the CLI's own total, each session counted once: $4.7760 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T10:12:21 P5 for b02 by lead: b02 avatar props wrong: card is an array, but the avatar reads card as an object {title, lines, rule, say}. Check fails avatar_props_unknown. (stale P5; voided none)

## Delegations
- own-scene-author-185a4540 scene-author ['b04'] collected: 12 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-e7b0f100 scene-author ['b05'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-3521aa06 scene-author ['b01', 'b13'] collected: 13 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-scene-author-14ec2778 scene-author ['b03'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-f54f7773 scene-author ['b06'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-990abed0 scene-author ['b07', 'b08'] collected: 16 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-d3503717 scene-author ['b09', 'b10'] collected: 23 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 9
- own-scene-author-56fcb605 scene-author ['b11'] collected: 12 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-f7d8627b scene-author ['b12'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- capabilities ok: 2
- catalog_search ok: 2
- check ok: 2
- collect ok: 2
- contact_sheet ok: 3
- critic_review ok: 1
- delegate ok: 2
- get_api_section error: 1
- get_api_section ok: 36
- get_beat ok: 6
- get_catalog_entry error: 2
- get_example_scene ok: 4
- get_style_pack ok: 1
- lab_snapshot ok: 38
- lab_snapshot refused: 2
- lesson_status ok: 6
- narrate ok: 1
- note ok: 8
- patch_storyboard ok: 1
- pilot_check ok: 1
- read_artifact error: 4
- read_artifact ok: 23
- render ok: 1
- reopen ok: 1
- request_approval ok: 2
- submit_review ok: 3
- submit_scene ok: 12

## Refusals by the rails
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [26.3, 28.6, 30.8, 32.4, 33.7] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [93.9, 95.2, 97.2, 98.0, 98.9] is too long

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b10', 'b06', 'b12'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- kit: 0
- scene: 0
- engine: 0
