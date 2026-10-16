# Shuttle report: style-story-cartoon-sol

Mode: api; lead: sonnet; written 2026-10-14T11:45:41.

Shuttle: style-story-cartoon-sol  current done
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
      spent: $3.5543, 7630989 tokens, 199 calls; limits {'usd': 9.0}; reopens 0 of 3; for named beats 3 of 8

## Cost (USD at the engine's price table)
- total $3.5543, 7630989 tokens, 199 model calls; cache reads 6609569 of 7555764 input tokens (87 %)
- by phase: - $0.1040 (7), P10 $0.0850 (4), P11 $0.1264 (5), P5 $0.2096 (11), P6 $0.1949 (8), P8 $2.6612 (149), P9 $0.1733 (15)
- by agent: critic $0.0969 (6), lead $1.5637 (73), shuttle-fixer $0.0888 (10), shuttle-scene-author $1.8050 (110)
- models: claude-sonnet-5-5 x73, gpt-6.1-sol x120, gemini-3.8-flash x6
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 26 turns $2.5616 (1 cache misses); P9 success 6 turns $0.0725 (0 cache misses); P5-P6 success 10 turns $0.3282 (1 cache misses); P8 success 9 turns $0.1748 (0 cache misses); P5-P6 success 9 turns $0.0776 (0 cache misses); P8 success 5 turns $0.0396 (0 cache misses); P10 success 5 turns $0.0956 (0 cache misses); P11 success 3 turns $0.1074 (1 cache misses)
- the CLI's own total, each session counted once: $3.4574 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 3 of 8
- 2026-10-14T11:16:29 P5 for b06, b08, b10, b12 by lead: Check errors owned by the storyboard. b06: keep list and accent_on name receipt_circle, which b05 does not hold as a literal (held_missing); drop receipt_circle from keep (the ring is dimmed/restored inside held receipts.inner) and set accent_on to a held or new name such as pad_ticks. b08: template process.flow token label "Maya's note" overflows its card at the 30px label floor; shorten to "Note" or "Her note" (or drop the token). b12: avatar props must be only member, cast, side, kicker, title, say_title, title_cue, card{title, lines, rule, say}, name, role_label, cloth, talk_emotion, frame_r, frame_fill; replace card as a list of 3 strings with card:{title:'Know your channels', lines:['Your manager, or another one','HR or compliance','Your speak-up line']}. b10 (contact sheet look): signs (manager_sign, other_sign, hr_sign, compliance_sign, line_sign, line_tag), route stroke path_fork, path_past and kerb path_kerb are on screen in b09 but missing in b10 (doors unlabelled, no accent route); add them to b10 keep list, then b10's author or a fixer must make the file hold them. (stale P5; voided none)
- 2026-10-14T11:30:20 P5 for b08 by lead: b08 process.flow token label 'Note' still fails text_overflow at the 30px label floor. Patch the scene's props.token to {"icon":"mail"} with no label (icon only), everything else unchanged. (stale P5; voided none)
- 2026-10-14T11:30:31 P5 for b08 by lead: b08 token label overflow: patch token to icon only (stale P5; voided none)

## Delegations
- own-scene-author-e91a40fa scene-author ['b03'] collected: 15 calls, accepted [], refused 0, snapshots 3
- own-scene-author-44776988 scene-author ['b04'] collected: 21 calls, accepted [], refused 0, snapshots 5
- own-scene-author-6fda61b9 scene-author ['b03', 'b04'] collected: 11 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2
- own-scene-author-a0a8878d scene-author ['b01', 'b02'] collected: 17 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-scene-author-199dc6be scene-author ['b05', 'b06'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-3995ec13 scene-author ['b07'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-023296d0 scene-author ['b09', 'b10'] collected: 16 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-scene-author-bf588b5c scene-author ['b11'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-25f73d95 scene-author ['b05'] collected: 12 calls, accepted [], refused 0, snapshots 1
- own-scene-author-a4869580 scene-author ['b05', 'b06'] collected: 12 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-fixer-149f339d fixer ['b09', 'b10'] collected: 13 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2

## Tool calls (tool, outcome, count)
- accept_phase ok: 2
- animatic ok: 2
- check ok: 3
- collect ok: 6
- contact_sheet error: 1
- contact_sheet ok: 4
- critic_review ok: 1
- delegate ok: 6
- delegate refused: 1
- get_api_section error: 2
- get_api_section ok: 37
- get_beat ok: 6
- get_example_scene ok: 8
- get_style_pack ok: 9
- lab_snapshot ok: 34
- lesson_status ok: 8
- narrate ok: 2
- note ok: 8
- patch_storyboard ok: 3
- patch_storyboard refused: 1
- pilot_check ok: 1
- read_artifact error: 3
- read_artifact ok: 47
- render ok: 1
- reopen ok: 3
- report_finding ok: 15
- request_approval ok: 3
- submit_review refused: 1
- submit_scene ok: 20

## Refusals by the rails
- delegate (lead): scenes/b05.js is owned by the open token own-scene-author-25f73d95 (scene-author): collect it first (one writer per file)
- patch_storyboard (lead): P5 is reopened for b06, b08, b10, b12 only; b09 is not among them
- submit_review (lead): P10 (critique and fix) is accepted; to change it call reopen('P10', reason). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes

## What the lead looked at
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b09', 'b10'] (lead)
- animatic 2 (lead)
- contact_sheet ['b09', 'b10'] (lead)
- animatic 2 (lead)
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
