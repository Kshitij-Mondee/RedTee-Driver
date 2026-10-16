# Shuttle report: style-cinematic-noir-sonnet

Mode: api; lead: sonnet; written 2026-10-14T14:05:03.

Shuttle: style-cinematic-noir-sonnet  current done
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
      spent: $8.4194, 9944010 tokens, 239 calls; limits {'usd': 16.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $8.4194, 9944010 tokens, 239 model calls; cache reads 7750960 of 9686640 input tokens (80 %)
- by phase: - $0.2632 (18), P10 $0.2255 (20), P11 $0.0410 (4), P5 $0.0608 (5), P6 $0.0471 (4), P8 $7.4917 (174), P9 $0.2901 (14)
- by agent: critic $0.2565 (17), lead $1.0727 (58), shuttle-fixer $0.2738 (17), shuttle-scene-author $6.8163 (147)
- models: claude-sonnet-5-5 x222, gemini-3.8-flash x17
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 15 turns $0.9801 (0 cache misses); P5-P6 success 8 turns $0.0766 (0 cache misses); P8 success 9 turns $6.5418 (0 cache misses); P9 success 7 turns $0.1955 (0 cache misses); P10 success 10 turns $0.2828 (0 cache misses); P10 success 6 turns $0.0532 (0 cache misses); P11 success 3 turns $0.0328 (0 cache misses)
- the CLI's own total, each session counted once: $8.1628 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T13:04:21 P5 for b01 by lead: pilot_check fails: b01 avatar_props_unknown: the avatar reads card as an object (card: {title, l...}), not an array; props.card was given as ["02:00","Login successful","Dana is asleep"], so card.0, card.1, card.2 are unknown. Patch b01 props.card to the object shape (title plus up to three short lines) e.g. {title: "02:00", lines: ["Login successful", "Dana is asleep"]} after checking the exact key names in the gate message; keep kicker/title. Also the b02 pilot frame shows the avatar disc (Open Peeps bust) opening the lesson, which style guide s10 discourages; acceptable only as the cold open. (stale P5; voided none)

## Delegations
- own-scene-author-0c352ce6 scene-author ['b02'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-fd41b1a7 scene-author ['b03'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-8266aefc scene-author ['b04'] collected: 23 calls, accepted ['submit_scene'], refused 0, snapshots 14
- own-scene-author-da35df6f scene-author ['b05'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-84f69b86 scene-author ['b06'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-08c5fb82 scene-author ['b07'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-b7175fe6 scene-author ['b08'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-2b1d0f03 scene-author ['b09'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-b9419fdd scene-author ['b10'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-6210e1bc scene-author ['b11'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-bf74e3fa scene-author ['b12'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-debb64d0 scene-author ['b13'] collected: 21 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-scene-author-6e568341 scene-author ['b14'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-e9d4915f fixer ['b13'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 1
- own-fixer-fef1f18c fixer ['b13'] collected: 4 calls, accepted ['submit_scene'], refused 1, snapshots 1
- own-fixer-eff1cce1 fixer ['b07'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- capabilities ok: 2
- catalog_search ok: 2
- check ok: 3
- collect ok: 4
- contact_sheet ok: 7
- critic_review ok: 2
- delegate ok: 4
- frames ok: 1
- get_api_section ok: 56
- get_beat ok: 2
- get_catalog_entry error: 2
- get_example_scene ok: 9
- get_skill_section ok: 4
- get_style_pack ok: 4
- lab_snapshot error: 1
- lab_snapshot ok: 59
- lesson_status ok: 5
- list_skill_sections ok: 1
- narrate ok: 1
- note ok: 7
- patch_storyboard ok: 1
- pilot_check ok: 2
- read_artifact error: 6
- read_artifact ok: 37
- render ok: 1
- reopen ok: 1
- request_approval ok: 2
- submit_review ok: 4
- submit_scene ok: 16
- submit_scene refused: 3

## Refusals by the rails
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10', 'b11'] (lead)
- frames [117.5] (fixer)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b07', 'b12', 'b13'] (lead)
- contact_sheet ['b07'] (fixer)
- contact_sheet ['b07', 'b13'] (lead)
- contact_sheet ['b07', 'b13', 'b12'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 1
- engine: 0
