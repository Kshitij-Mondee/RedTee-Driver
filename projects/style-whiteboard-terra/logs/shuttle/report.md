# Shuttle report: style-whiteboard-terra

Mode: api; lead: sonnet; written 2026-10-14T09:46:49.

Shuttle: style-whiteboard-terra  current done
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
      spent: $3.2687, 5161798 tokens, 163 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $3.2687, 5161798 tokens, 163 model calls; cache reads 4235691 of 5090114 input tokens (83 %)
- by phase: - $0.1318 (10), P10 $0.2625 (21), P11 $0.0402 (4), P5 $0.0654 (3), P6 $0.0801 (4), P8 $2.2595 (95), P9 $0.4292 (26)
- by agent: critic $0.1249 (9), lead $1.0587 (63), shuttle-fixer $0.1413 (8), shuttle-scene-author $1.9439 (83)
- models: claude-sonnet-5-5 x63, gpt-5.6-terra x91, gemini-3.8-flash x9
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 10 turns $2.2528 (0 cache misses); P9 success 16 turns $0.2072 (0 cache misses); P5-P6 success 8 turns $0.1486 (1 cache misses); P8 success 4 turns $0.0700 (0 cache misses); P9 success 4 turns $0.0693 (0 cache misses); P10 success 11 turns $0.2999 (0 cache misses); P10 success 7 turns $0.0642 (0 cache misses); P11 success 3 turns $0.0318 (0 cache misses)
- the CLI's own total, each session counted once: $3.1438 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T09:18:19 P5 for b03 by lead: check error avatar_props_unknown: b03 props.card is a list; the avatar reads card as an object {title, lines, rule, say}. Patch b03 props to {"title":"Three moves fix it","card":{"lines":["Before","During","Close"]}} (keep title at top level). (stale P5; voided none)

## Delegations
- own-scene-author-56c9305f scene-author ['b01'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-b43a9cd4 scene-author ['b02'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-2218eb3c scene-author ['b04'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-7fb0f7a7 scene-author ['b05'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-be357e9a scene-author ['b06'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-b1de097b scene-author ['b07'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-a2e6c61e scene-author ['b08'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-16d4f019 scene-author ['b09'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-95e4a63a scene-author ['b12'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-5f30a758 scene-author ['b13'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-1d54c10f scene-author ['b14'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-9d5c7efc fixer ['b12', 'b13'] collected: 9 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 4

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- capabilities ok: 1
- catalog_search ok: 1
- check ok: 3
- collect ok: 3
- contact_sheet ok: 5
- critic_review ok: 2
- delegate ok: 3
- get_api_section error: 1
- get_api_section ok: 39
- get_beat ok: 2
- get_catalog_entry error: 1
- get_example_scene error: 1
- get_example_scene ok: 10
- get_skill_section ok: 1
- get_source_chunks ok: 1
- get_style_pack ok: 11
- lab_snapshot ok: 28
- lesson_status ok: 7
- list_skill_sections ok: 1
- narrate ok: 1
- note ok: 8
- patch_storyboard ok: 1
- pilot_check ok: 1
- read_artifact error: 4
- read_artifact ok: 27
- render ok: 1
- reopen ok: 1
- report_finding ok: 3
- request_approval ok: 2
- submit_review ok: 4
- submit_scene ok: 14

## Refusals by the rails
- none

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b12', 'b13'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- kit: 0
- scene: 0
- engine: 0
