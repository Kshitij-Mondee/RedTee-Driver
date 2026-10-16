# Shuttle report: style-cinematic-noir-terra

Mode: api; lead: sonnet; written 2026-10-14T14:04:36.

Shuttle: style-cinematic-noir-terra  current done
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
      spent: $3.8438, 5954750 tokens, 179 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $3.8438, 5954750 tokens, 179 model calls; cache reads 4815642 of 5874408 input tokens (82 %)
- by phase: - $0.1504 (11), P10 $0.2912 (22), P11 $0.0745 (4), P5 $0.1534 (13), P6 $0.1159 (5), P8 $2.9592 (114), P9 $0.0993 (10)
- by agent: critic $0.1438 (10), lead $1.1100 (73), shuttle-fixer $0.2908 (19), shuttle-scene-author $2.2993 (77)
- models: claude-sonnet-5-5 x73, gpt-5.6-terra x96, gemini-3.8-flash x10
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 17 turns $0.5054 (0 cache misses); P5-P6 success 18 turns $0.2688 (0 cache misses); P8 success 16 turns $2.3732 (0 cache misses); P10 success 12 turns $0.4201 (0 cache misses); P10 success 7 turns $0.0678 (0 cache misses); P11 success 3 turns $0.0648 (0 cache misses)
- the CLI's own total, each session counted once: $3.7000 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T13:00:07 P5 for b01 by lead: pilot_check failed: b01 avatar_props_unknown: the avatar does not read card.0, card.1, card.2. Its props are member, cast, side, kicker, title, say_title, title_cue, card, name, role_label, cloth, talk_emotion, frame_r, frame_fill, and card must be an object (title, l... likely lines), not an array of strings. patch_storyboard b01 props.card to the object shape (title '02:00', lines ['Login successful','Dana is asleep'] or per the avatar docs). Also the presenter smiling in the t=5 frame is off-tone for a serious breach opener; set talk_emotion to a calm/serious value if allowed. (stale P5; voided none)

## Delegations
- own-scene-author-71755388 scene-author ['b02'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-68ad0f7b scene-author ['b03', 'b04', 'b05', 'b06'] collected: 28 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 16
- own-scene-author-a91ece99 scene-author ['b07'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-fc9ab296 scene-author ['b08', 'b09'] collected: 14 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-scene-author-8654d8c9 scene-author ['b10', 'b11'] collected: 10 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2
- own-scene-author-b914f80e scene-author ['b12'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-22823191 scene-author ['b13'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-8d4c75e1 scene-author ['b14'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-bf755e94 fixer ['b07'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-65a81091 fixer ['b14'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-63b7356b fixer ['b13'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 2

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- capabilities ok: 1
- catalog_search ok: 2
- check ok: 3
- collect ok: 4
- contact_sheet ok: 6
- critic_review ok: 2
- delegate ok: 4
- get_api_section error: 2
- get_api_section ok: 33
- get_beat ok: 2
- get_catalog_entry error: 2
- get_example_scene error: 1
- get_example_scene ok: 6
- get_skill_section ok: 1
- get_source_chunks ok: 1
- get_style_pack ok: 9
- lab_snapshot ok: 44
- lesson_status ok: 7
- list_skill_sections ok: 1
- narrate ok: 1
- note ok: 6
- patch_storyboard ok: 2
- pilot_check ok: 2
- read_artifact error: 2
- read_artifact ok: 25
- render ok: 1
- reopen ok: 1
- request_approval ok: 2
- submit_review ok: 4
- submit_scene ok: 16

## Refusals by the rails
- none

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b09', 'b14', 'b13'] (lead)
- contact_sheet ['b13', 'b14'] (lead)
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
