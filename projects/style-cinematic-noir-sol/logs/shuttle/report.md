# Shuttle report: style-cinematic-noir-sol

Mode: api; lead: sonnet; written 2026-10-14T14:10:55.

Shuttle: style-cinematic-noir-sol  current done
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
      spent: $3.7413, 7876560 tokens, 245 calls; limits {'usd': 9.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $3.7413, 7876560 tokens, 245 model calls; cache reads 6658328 of 7793789 input tokens (85 %)
- by phase: - $0.2704 (22), P10 $0.3497 (36), P11 $0.1102 (4), P5 $0.2137 (16), P6 $0.1398 (4), P8 $2.1593 (127), P9 $0.4982 (36)
- by agent: critic $0.2638 (21), lead $1.4621 (83), shuttle-fixer $0.4125 (56), shuttle-scene-author $1.6028 (85)
- models: claude-sonnet-5-5 x83, gpt-6.1-sol x141, gemini-3.8-flash x21
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 11 turns $0.3397 (0 cache misses); P5-P6 success 21 turns $0.3697 (1 cache misses); P8 success 7 turns $1.7859 (1 cache misses); P9 success 13 turns $0.3168 (0 cache misses); P10 success 10 turns $0.3024 (0 cache misses); P10 success 12 turns $0.2071 (0 cache misses); P10 success 6 turns $0.0542 (0 cache misses); P11 success 3 turns $0.1018 (1 cache misses)
- the CLI's own total, each session counted once: $3.4774 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T12:59:43 P5 for b01 by lead: pilot_check failed: b01 avatar_props_unknown: the avatar does not read card.0, card.1, card.2. b01 props.card is a bare array of strings ["02:00","Login successful","Dana is asleep"]; the avatar's card prop is an object (title, l... per the error: likely {title, lines}). patch_storyboard b01 props.card into the avatar's card object shape (title '02:00', lines the other two) keeping kicker and title; then re-run pilot_check. b02 is already accepted and unaffected. (stale P5; voided none)

## Delegations
- own-scene-author-0eda7674 scene-author ['b02'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-52c03718 scene-author ['b03', 'b04', 'b05', 'b06'] collected: 24 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 7
- own-scene-author-3db8afc4 scene-author ['b07'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-34a077b2 scene-author ['b08', 'b09'] collected: 19 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-scene-author-b7b90d0b scene-author ['b10', 'b11'] collected: 20 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-936bf621 scene-author ['b12'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-ac1cf553 scene-author ['b13'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-3f385d3f scene-author ['b14'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-66e6cf31 fixer ['b13'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-7ebadd60 fixer ['b13'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-e77f109d fixer ['b10', 'b11'] collected: 13 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-fixer-b3c8646f fixer ['b13'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-26997742 fixer ['b13'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-c16b85e2 fixer ['b11'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- animatic ok: 1
- capabilities ok: 1
- catalog_search ok: 2
- check ok: 5
- collect ok: 6
- contact_sheet ok: 9
- critic_review ok: 3
- delegate ok: 6
- frames ok: 1
- get_api_section error: 2
- get_api_section ok: 53
- get_beat ok: 3
- get_catalog_entry error: 2
- get_example_scene error: 2
- get_example_scene ok: 11
- get_skill_section ok: 1
- get_source_chunks ok: 1
- get_style_pack ok: 9
- lab_snapshot ok: 40
- lesson_status ok: 8
- list_skill_sections ok: 1
- narrate ok: 1
- note ok: 8
- patch_storyboard ok: 1
- pilot_check ok: 2
- read_artifact error: 2
- read_artifact ok: 37
- render ok: 1
- reopen ok: 1
- report_finding ok: 5
- request_approval ok: 2
- submit_review ok: 7
- submit_scene ok: 20

## Refusals by the rails
- none

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b13', 'b01'] (lead)
- frames [108, 117, 117.491] (fixer)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b10', 'b11', 'b13'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b10', 'b11', 'b13'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 1
- engine: 0
