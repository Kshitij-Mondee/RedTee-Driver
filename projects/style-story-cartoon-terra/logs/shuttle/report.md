# Shuttle report: style-story-cartoon-terra

Mode: api; lead: sonnet; written 2026-10-14T11:52:25.

Shuttle: style-story-cartoon-terra  current done
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
      spent: $5.4179, 9414716 tokens, 277 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 3 of 8

## Cost (USD at the engine's price table)
- total $5.4179, 9414716 tokens, 277 model calls; cache reads 8020764 of 9300022 input tokens (86 %)
- by phase: - $0.1356 (14), P10 $0.2365 (23), P11 $0.0863 (4), P5 $0.3327 (17), P6 $0.1295 (10), P8 $4.0947 (191), P9 $0.4026 (18)
- by agent: critic $0.1286 (13), lead $1.7990 (94), shuttle-fixer $0.9535 (60), shuttle-scene-author $2.5368 (110)
- models: claude-sonnet-5-5 x94, gpt-5.6-terra x170, gemini-3.8-flash x13
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 18 turns $3.2036 (0 cache misses); P9 success 5 turns $0.0896 (0 cache misses); P5-P6 success 19 turns $0.3583 (0 cache misses); P8 success 15 turns $1.0120 (0 cache misses); P5-P6 success 9 turns $0.1341 (0 cache misses); P8 success 3 turns $0.0265 (0 cache misses); P9 success 4 turns $0.0747 (0 cache misses); P10 success 11 turns $0.2411 (0 cache misses); P10 success 7 turns $0.0743 (0 cache misses); P11 success 3 turns $0.0752 (1 cache misses)
- the CLI's own total, each session counted once: $5.2893 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 3 of 8
- 2026-10-14T11:11:44 P5 for b08, b12 by lead: P9 check: b08 token label "Maya's note" overflows its card at the 30px label floor (shorten, e.g. "Note"); b12 avatar props card.0/card.1/card.2 unknown (avatar reads member, cast, side, kicker, title, say_title, title_cue, card, name, role_label, cloth, talk_emotion, frame_r...): fix card to the form the avatar template reads (check get_catalog_entry for avatar) or drop it. (stale P5; voided none)
- 2026-10-14T11:12:31 P5 for b06, b10, b08, b12 by lead: Storyboard gate refuses the b08/b12 patch because b06 and b10 keep names (pad, pad_line1-3; path_set, path_line, doors) that b05 and b09 scene files do not expose (held_missing). Drop those names from keep; fixers in P9 expose/hold them properly. (stale P5; voided none)
- 2026-10-14T11:34:36 P5 for b08 by lead: process.flow token label "Note" still overflows at the 30px floor; drop the token label (icon only). (stale P5; voided none)

## Delegations
- own-scene-author-eec16ebd scene-author ['b03'] collected: 15 calls, accepted [], refused 0, snapshots 2
- own-scene-author-86d19d84 scene-author ['b04'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-5e11e979 scene-author ['b03'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-e8d0e702 scene-author ['b01'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-5aa1985e scene-author ['b02'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-2b4038b3 scene-author ['b05'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-c94d2619 scene-author ['b07'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-8b157095 scene-author ['b09'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-5613d3ab scene-author ['b06'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-588c53cc scene-author ['b10'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-40bcb365 scene-author ['b11'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 7
- own-fixer-089e56a4 fixer ['b09', 'b10'] collected: 20 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 8
- own-fixer-b6eb0bc1 fixer ['b03', 'b05', 'b06'] collected: 20 calls, accepted [], refused 0, snapshots 7
- own-fixer-ad877ff1 fixer ['b11'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-e828949a fixer ['b05', 'b06'] collected: 12 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-fixer-35fb8bd4 fixer ['b09'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-a3e2aa45 fixer ['b11'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 2
- animatic ok: 2
- catalog_search ok: 2
- check ok: 4
- check refused: 1
- collect ok: 7
- contact_sheet ok: 5
- critic_review ok: 2
- delegate ok: 7
- get_api_section error: 3
- get_api_section ok: 47
- get_beat ok: 7
- get_catalog_entry error: 1
- get_catalog_entry ok: 1
- get_example_scene error: 1
- get_example_scene ok: 9
- get_skill_section ok: 1
- get_style_pack ok: 10
- lab_snapshot ok: 61
- lesson_status ok: 10
- narrate ok: 2
- note ok: 10
- patch_storyboard ok: 3
- patch_storyboard refused: 1
- pilot_check ok: 1
- read_artifact error: 3
- read_artifact ok: 61
- render ok: 1
- reopen ok: 3
- report_finding ok: 13
- request_approval ok: 3
- submit_review ok: 4
- submit_scene ok: 22

## Refusals by the rails
- patch_storyboard (lead): P5 is reopened for b08, b12 only; b06, b10 is not among them
- check (lead): check belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is stale; beat files not accepted yet: scenes/b03.js

## What the lead looked at
- animatic 2 (lead)
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12'] (lead)
- contact_sheet ['b09', 'b11'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- kit: 0
- scene: 0
- engine: 0
