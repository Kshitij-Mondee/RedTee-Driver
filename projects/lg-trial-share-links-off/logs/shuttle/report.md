# Shuttle report: lg-trial-share-links-off

Mode: api; lead: sonnet; written 2026-10-16T04:32:39.

Shuttle: lg-trial-share-links-off  current done
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
      spent: $4.2601, 9414644 tokens, 252 calls; limits {'usd': 18.0}; reopens 0 of 3; for named beats 2 of 8

## Cost (USD at the engine's price table)
- total $4.2601, 9414644 tokens, 252 model calls; cache reads 8084821 of 9326128 input tokens (87 %)
- by phase: - $0.3136 (19), P10 $0.0779 (7), P11 $0.1465 (6), P5 $0.2702 (15), P6 $0.2287 (15), P8 $2.9474 (165), P9 $0.2757 (25)
- by agent: critic $0.3063 (18), lead $1.4937 (88), shuttle-fixer $0.0359 (5), shuttle-scene-author $2.4242 (141)
- models: claude-sonnet-5-5 x71, gpt-6.1-sol x146, claude-opus-5-5 x17, gemini-3.8-flash x18
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 14 turns $2.5431 (0 cache misses); P9 success 9 turns $0.1329 (0 cache misses); P5 success 8 turns $0.1930 (0 cache misses); P6 success 7 turns $0.0754 (0 cache misses); P8 success 10 turns $0.4103 (0 cache misses); P9 success 7 turns $0.0704 (0 cache misses); P5 success 9 turns $0.1563 (0 cache misses); P6 success 6 turns $0.0627 (0 cache misses); P8 success 7 turns $0.1028 (0 cache misses); P10 success 8 turns $0.0961 (0 cache misses); P11 success 3 turns $0.1108 (1 cache misses)
- the CLI's own total, each session counted once: $3.9538 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 2 of 8
- 2026-10-16T03:52:10 P5 for b03, b25, b18, b19 by lead: P9 check: b03/b25 avatar card must be an object {lines:[...]} not a list; b18/b19 quiz.question/quiz.answer templates fail wb_face (patrick hand) on a whiteboard board, so they must become bespoke whiteboard scenes (engine-written words), which also fixes b18's 9s idle. (stale P5; voided none)
- 2026-10-16T04:13:45 P5 for b03, b25 by lead: b03 avatar card lines are set in patrick hand and fail wb_face on the whiteboard board; no whiteboard-face option on the avatar kind (stale P5; voided none)

## Delegations
- own-scene-author-f499ece1 scene-author ['b01'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-03f84cb1 scene-author ['b02'] collected: 24 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-26047415 scene-author ['b04', 'b05', 'b06', 'b07', 'b08'] collected: 23 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 8
- own-scene-author-4bf48cfc scene-author ['b09', 'b10', 'b11', 'b12'] collected: 18 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-scene-author-9f1f578d scene-author ['b13', 'b14', 'b15', 'b16', 'b17'] collected: 22 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 10
- own-scene-author-c963c1cf scene-author ['b20', 'b21'] collected: 19 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-scene-author-c62d2d9e scene-author ['b22', 'b23', 'b24'] collected: 17 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-4e7524e6 scene-author ['b08'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-c0b9c0bc scene-author ['b18', 'b19'] collected: 24 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-fixer-56e642f9 fixer ['b18', 'b19'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- animatic ok: 2
- capabilities ok: 6
- catalog_search ok: 5
- check ok: 4
- collect ok: 5
- contact_sheet ok: 4
- critic_review error: 1
- critic_review ok: 1
- delegate ok: 5
- get_api_section error: 9
- get_api_section ok: 28
- get_beat ok: 21
- get_catalog_entry error: 1
- get_catalog_entry ok: 1
- get_example_scene ok: 6
- get_skill_section ok: 7
- get_source_chunks ok: 1
- get_style_pack ok: 9
- lab_snapshot ok: 43
- lesson_status ok: 11
- list_skill_sections ok: 4
- narrate ok: 2
- note ok: 10
- patch_storyboard ok: 2
- pilot_check ok: 1
- read_artifact error: 9
- read_artifact ok: 31
- render ok: 1
- reopen ok: 2
- report_finding ok: 8
- request_approval ok: 3
- submit_review refused: 1
- submit_scene ok: 26

## Refusals by the rails
- submit_review (lead): P10 (critique and fix) is accepted; to change it call reopen('P10', reason). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes

## What the lead looked at
- animatic 3 (lead)
- animatic 3 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b19', 'b20', 'b21', 'b22', 'b23', 'b24', 'b25'] (lead)
- contact_sheet ['b08', 'b16', 'b24'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 3
- kit: 0
- scene: 4
- engine: 0
