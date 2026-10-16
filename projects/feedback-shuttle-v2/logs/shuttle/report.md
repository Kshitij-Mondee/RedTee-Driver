# Shuttle report: feedback-shuttle-v2

Mode: subscription; lead: opus; written 2026-10-09T07:10:33.

Shuttle: feedback-shuttle-v2  current done
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
      spent: $18.3131 (notional), 21921746 tokens, 352 calls; limits {'usd': 150.0}; reopens 1 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table; notional in subscription mode)
- total $18.3131, 21921746 tokens, 352 model calls; cache reads 18921216 of 21633093 input tokens (87 %)
- by phase: - $1.0101 (12), P1 $0.3481 (6), P10 $2.9180 (18), P11 $0.4423 (5), P2 $0.2754 (7), P3 $0.1392 (4), P4 $0.6234 (4), P5 $1.9506 (21), P6 $0.7456 (4), P7 $1.9480 (33), P8 $5.9409 (188), P9 $1.9715 (50)
- by agent: critic $0.0941 (7), lead $12.0878 (133), shuttle-fact-finder $0.0947 (2), shuttle-fixer $2.4128 (86), shuttle-kit-builder $1.1958 (25), shuttle-scene-author $2.3801 (98), skeptic $0.0478 (1)
- models: claude-opus-5-5 x68, claude-sonnet-5-5 x281, gemini-3.8-flash x8
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 1 turns $0.0000 (0 cache misses); P1-P4 (resumed) success 1 turns $0.0000 (0 cache misses); P1-P4 success 32 turns $1.7098 (1 cache misses); P5-P6 success 34 turns $2.1252 (0 cache misses); P7-P9 success 71 turns $6.2784 (1 cache misses); P10-P11 success 35 turns $4.0290 (0 cache misses)
- the CLI's own total, each session counted once: $14.1425 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 1 of 3; for named beats 0 of 8
- 2026-10-09T06:19:54 P7 by lead: pilot_check fails with 2 content_overlap errors at each beat start (b01 @0, b02 @9.897): duplicated text blocks drawn at the same spot in the kit. Prime suspect: wall_calendar draws This week / Next week text on BOTH the under page and the turning front page; also comment_bubble draws each tab label three times (slot/paper/accent variants) and row texts under opacity-0 groups. Fix in the kit so only one text block is present at a time. (stale P7; voided final)

## Delegations
- own-fact-finder-d92ad1e4 fact-finder  collected: 4 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-01104ddc kit-builder ['b01', 'b02', 'b03', 'b06', 'b07', 'b09', 'b12', 'b15', 'b16'] collected: 34 calls, accepted ['submit_kit'], refused 0, snapshots 13
- own-scene-author-10f6b77d scene-author ['b01'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-9a949836 scene-author ['b02'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-kit-builder-411c70a5 kit-builder  collected: 5 calls, accepted ['submit_kit'], refused 0, snapshots 1
- own-fixer-ed563147 fixer ['b01', 'b02'] collected: 11 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-scene-author-75675f5d scene-author ['b03'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-d8eb3381 scene-author ['b04'] collected: 8 calls, accepted [], refused 0, snapshots 2
- own-scene-author-ade908af scene-author ['b06'] collected: 6 calls, accepted [], refused 0, snapshots 1
- own-scene-author-e117335a scene-author ['b07'] collected: 8 calls, accepted [], refused 0, snapshots 1
- own-scene-author-2be66659 scene-author ['b08'] collected: 12 calls, accepted [], refused 0, snapshots 1
- own-scene-author-e1e0433c scene-author ['b09'] collected: 21 calls, accepted [], refused 0, snapshots 0
- own-scene-author-cdba8e87 scene-author ['b10'] collected: 13 calls, accepted [], refused 0, snapshots 1
- own-scene-author-544c10dc scene-author ['b11'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-7136c857 scene-author ['b12'] collected: 12 calls, accepted [], refused 1, snapshots 2
- own-scene-author-bf029c2b scene-author ['b13'] collected: 12 calls, accepted [], refused 0, snapshots 1
- own-scene-author-1d4298f5 scene-author ['b14'] collected: 18 calls, accepted [], refused 0, snapshots 1
- own-scene-author-7dfc8826 scene-author ['b15'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-9dd2a857 scene-author ['b16'] collected: 7 calls, accepted [], refused 0, snapshots 2
- own-fixer-233bd371 fixer ['b09'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-fixer-2da149d9 fixer ['b15'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-fixer-416348c1 fixer ['b10'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-eef79800 fixer ['b13'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-cbc0110f fixer ['b13', 'b14'] collected: 17 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-fixer-50439512 fixer ['b15'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-fixer-a3967eb8 fixer ['b15'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-abe850c0 fixer ['b01'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-1ae6f559 fixer ['b04'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-50a8a333 fixer ['b11'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-452a6adb fixer ['b14'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-a904577a fixer ['b16'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 3

## Tool calls (tool, outcome, count)
- accept_phase ok: 2
- animatic ok: 1
- capabilities ok: 3
- catalog_search ok: 1
- check ok: 5
- choose_persona ok: 1
- collect ok: 31
- compose ok: 5
- contact_sheet ok: 6
- contact_sheet refused: 1
- critic_review ok: 2
- delegate ok: 31
- delegate refused: 4
- frames ok: 6
- frames refused: 1
- get_api_section error: 4
- get_api_section ok: 86
- get_beat ok: 14
- get_catalog_entry error: 1
- get_example_scene error: 6
- get_example_scene ok: 13
- get_skill_section error: 1
- get_skill_section ok: 12
- get_style_pack ok: 4
- kit_preview ok: 14
- lab_snapshot ok: 60
- lab_snapshot refused: 1
- lesson_status ok: 11
- list_skill_sections error: 1
- list_skill_sections ok: 5
- narrate ok: 1
- note ok: 8
- pilot_check ok: 2
- pilot_check refused: 2
- read_artifact error: 18
- read_artifact ok: 99
- render ok: 1
- reopen ok: 1
- report_finding error: 1
- report_finding ok: 2
- request_approval ok: 3
- skeptic_review ok: 1
- strips refused: 1
- submit_brief ok: 2
- submit_kit ok: 4
- submit_knowledge ok: 1
- submit_outline ok: 1
- submit_review refused: 1
- submit_scene ok: 21
- submit_script ok: 3
- submit_storyboard ok: 2
- submit_teaching_plan ok: 1

## Refusals by the rails
- frames (lead): frames belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is pending; beat files not accepted yet: scenes/b03.js, scenes/b04.js, scenes/b06.js, scenes/b07.js, scenes/b08.js, scenes/b09.js, scenes/b10.js, scenes/b11.js ...; pilot_check of the first continue join (b01, b02
- contact_sheet (lead): contact_sheet belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is pending; beat files not accepted yet: scenes/b03.js, scenes/b04.js, scenes/b06.js, scenes/b07.js, scenes/b08.js, scenes/b09.js, scenes/b10.js, scenes/b11.js ...; pilot_check of the first continue join (b
- strips (lead): strips belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is pending; beat files not accepted yet: scenes/b03.js, scenes/b04.js, scenes/b06.js, scenes/b07.js, scenes/b08.js, scenes/b09.js, scenes/b10.js, scenes/b11.js ...; pilot_check of the first continue join (b01, b02
- pilot_check (lead): submit the pilot beats first (scenes/b01.js, scenes/b02.js); then pilot_check
- pilot_check (lead): submit the pilot beats first (scenes/b01.js, scenes/b02.js); then pilot_check
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [0.8, 1.6, 4.2, 6.5, 8.5, 12] is too long
- delegate (lead): scenes/b09.js is owned by the open token own-scene-author-e1e0433c (scene-author): collect it first (one writer per file)
- delegate (lead): scenes/b15.js is owned by the open token own-scene-author-7dfc8826 (scene-author): collect it first (one writer per file)
- delegate (lead): scenes/b10.js is owned by the open token own-scene-author-cdba8e87 (scene-author): collect it first (one writer per file)
- delegate (lead): scenes/b13.js is owned by the open token own-scene-author-bf029c2b (scene-author): collect it first (one writer per file)
- submit_review (lead): P10 (critique and fix) is accepted; to change it call reopen('P10', reason). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes

## What the lead looked at
- animatic 2 (lead)
- kit_preview  (lead)
- frames [70.5, 71.1, 71.167, 71.4] (fixer)
- frames [122.068, 122.5, 123.5] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- frames [0.3, 1.2, 2.2, 3.5] (lead)
- frames [121.6, 121.9, 122.07, 122.4] (fixer)
- frames [121.9, 122.068, 122.3, 123] (lead)
- contact_sheet ['b01', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- contact_sheet ['b01', 'b04', 'b11', 'b14', 'b16'] (lead)
- frames [3, 85, 118, 138] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 1
- engine: 0
