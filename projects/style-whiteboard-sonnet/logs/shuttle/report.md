# Shuttle report: style-whiteboard-sonnet

Mode: api; lead: sonnet; written 2026-10-14T09:46:09.

Shuttle: style-whiteboard-sonnet  current done
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
      spent: $3.8816, 5501607 tokens, 150 calls; limits {'usd': 16.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $3.8816, 5501607 tokens, 150 model calls; cache reads 4608094 of 5379518 input tokens (86 %)
- by phase: - $0.1028 (8), P10 $0.2256 (18), P11 $0.1119 (4), P5 $0.0324 (4), P6 $0.0437 (4), P8 $3.1394 (98), P9 $0.2258 (14)
- by agent: critic $0.0958 (7), lead $0.8073 (55), shuttle-fixer $0.0638 (4), shuttle-scene-author $2.9147 (84)
- models: claude-sonnet-5-5 x143, gemini-3.8-flash x7
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 13 turns $3.2472 (0 cache misses); P9 success 7 turns $0.0546 (0 cache misses); P5-P6 success 8 turns $0.0741 (0 cache misses); P8 success 4 turns $0.0301 (0 cache misses); P9 success 4 turns $0.0316 (0 cache misses); P10 success 10 turns $0.1873 (0 cache misses); P10 success 6 turns $0.0575 (0 cache misses); P11 success 3 turns $0.1034 (1 cache misses)
- the CLI's own total, each session counted once: $3.7858 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T09:20:42 P5 for b03 by lead: check: avatar_props_unknown on b03. props.card is a list; avatar reads card as an object {title, lines, rule, say}. Patch b03 props to {"title":"Three moves fix it","card":{"title":"Three moves fix it","lines":["Before","During","Close"]}} (or drop top-level title if duplicated). (stale P5; voided none)

## Delegations
- own-scene-author-13034609 scene-author ['b01'] collected: 8 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-9ba0459f scene-author ['b02'] collected: 12 calls, accepted [], refused 0, snapshots 1
- own-scene-author-4291515c scene-author ['b02'] collected: 10 calls, accepted ['submit_scene'], refused 1, snapshots 4
- own-scene-author-c5aefc18 scene-author ['b04', 'b05', 'b06'] collected: 15 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 1, snapshots 5
- own-scene-author-dadd54b3 scene-author ['b07', 'b08'] collected: 15 calls, accepted ['submit_scene', 'submit_scene'], refused 1, snapshots 7
- own-scene-author-f991dd5c scene-author ['b09'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-05bf7110 scene-author ['b12', 'b13'] collected: 15 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-bc152acd scene-author ['b14'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-4417ce19 fixer ['b13'] collected: 3 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- check ok: 3
- collect ok: 4
- contact_sheet ok: 3
- critic_review ok: 2
- delegate ok: 4
- get_api_section ok: 16
- get_beat ok: 4
- get_catalog_entry error: 1
- get_example_scene ok: 5
- lab_snapshot ok: 28
- lab_snapshot refused: 4
- lesson_status ok: 8
- narrate ok: 1
- note ok: 8
- patch_storyboard ok: 1
- pilot_check ok: 1
- read_artifact error: 4
- read_artifact ok: 25
- render ok: 1
- reopen ok: 1
- report_finding ok: 2
- request_approval ok: 2
- submit_review ok: 4
- submit_scene ok: 14

## Refusals by the rails
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [1.6, 2.9, 5.0, 7.2, 9.5] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [9.7, 10.5, 12.5, 15.5, 17.5] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [50.4, 53.2, 56.0, 58.6, 60.2] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [31.0, 33.0, 37.0, 38.8, 40.9] is too long

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b13'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- kit: 0
- scene: 0
- engine: 0
