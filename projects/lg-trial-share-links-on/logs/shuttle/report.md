# Shuttle report: lg-trial-share-links-on

Mode: api; lead: sonnet; written 2026-10-16T04:36:02.

Shuttle: lg-trial-share-links-on  current done
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
      spent: $5.1450, 9970090 tokens, 277 calls; limits {'usd': 18.0}; reopens 0 of 3; for named beats 2 of 8

## Cost (USD at the engine's price table)
- total $5.1450, 9970090 tokens, 277 model calls; cache reads 8512959 of 9870618 input tokens (86 %)
- by phase: - $0.2172 (15), P10 $0.3390 (21), P11 $0.0438 (3), P5 $0.6603 (20), P6 $0.3246 (15), P8 $2.9147 (170), P9 $0.6453 (33)
- by agent: critic $0.2102 (14), lead $2.4030 (93), shuttle-fixer $0.4086 (37), shuttle-scene-author $2.1232 (133)
- models: claude-sonnet-5-5 x68, gpt-6.1-sol x170, claude-opus-5-5 x25, gemini-3.8-flash x14
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 14 turns $2.6829 (1 cache misses); P5 success 19 turns $0.5955 (0 cache misses); P6 success 4 turns $0.1240 (1 cache misses); P8 success 5 turns $0.2538 (0 cache misses); P9 success 11 turns $0.2140 (0 cache misses); P5 success 6 turns $0.1853 (0 cache misses); P6 success 6 turns $0.0609 (0 cache misses); P8 success 4 turns $0.0366 (0 cache misses); P9 success 4 turns $0.0346 (0 cache misses); P10 success 17 turns $0.7084 (0 cache misses); P11 success 3 turns $0.0389 (0 cache misses)
- the CLI's own total, each session counted once: $4.9348 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 2 of 8
- 2026-10-16T03:50:14 P5 for b03, b25, b18, b19 by lead: P9 check fails 11 storyboard-owned errors. b03 and b25 (avatar): props.card is a list of strings and the avatar reads card as another shape (avatar_props_unknown card.0/1/2); fix the card prop to the shape the avatar reads (see the avatar template props) or drop the card and carry the three lines as written board words. b18 quiz.question and b19 quiz.answer: wb_face, every word set in Patrick Hand (kicker YOUR TURN, option letters, Pause and decide, question, explanation, why_not) but a whiteboard engine board must have words written by the engine or headings in the display face; the quiz templates cannot do that, so replace b18 and b19 with bespoke scenes (rough question heading, three options written by the engine hand with ink letters in rough rings, pause written; answer beat: wrong options struck, Named people, view ringed with one accent, short why-not and explanation written), keeping the same narration, ids, kit-free design, and the camera join into b18 and continue join b19; bespoke beats then go to a scene-author in P8. (stale P5; voided none)
- 2026-10-16T04:09:17 P5 for b03, b25 by lead: wb_face: avatar card lines (b03, same card in b25) are set in Patrick Hand on a whiteboard engine board; check rejects. Patch the two avatar scenes to drop the card (title only) so no non-engine words remain. (stale P5; voided none)

## Delegations
- own-scene-author-2b931db5 scene-author ['b01'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-10d47eef scene-author ['b02'] collected: 21 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-714f3533 scene-author ['b04', 'b05', 'b06'] collected: 17 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-cac7545b scene-author ['b07', 'b08'] collected: 20 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-f7eb5738 scene-author ['b09', 'b10'] collected: 14 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-scene-author-507a72b9 scene-author ['b11', 'b12'] collected: 17 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-scene-author-86c728dc scene-author ['b13', 'b14', 'b15'] collected: 16 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-530d2618 scene-author ['b16', 'b17'] collected: 17 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-scene-author-37a9fca5 scene-author ['b20', 'b21'] collected: 11 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-scene-author-b5703eab scene-author ['b22', 'b23', 'b24'] collected: 15 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-scene-author-093e3511 scene-author ['b18', 'b19'] collected: 16 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-50a80a72 fixer ['b18', 'b19'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-012af7fa fixer ['b13', 'b14', 'b15', 'b16', 'b17'] collected: 20 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 8
- own-fixer-c278b5e5 fixer ['b18', 'b19'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 2
- animatic ok: 2
- capabilities ok: 3
- catalog_search ok: 2
- check ok: 5
- collect ok: 5
- contact_sheet ok: 8
- critic_review ok: 2
- delegate ok: 5
- frames ok: 1
- get_api_section error: 13
- get_api_section ok: 31
- get_beat ok: 14
- get_example_scene error: 1
- get_example_scene ok: 11
- get_skill_section ok: 2
- get_style_pack ok: 13
- lab_snapshot error: 1
- lab_snapshot ok: 54
- lesson_status ok: 8
- list_skill_sections ok: 2
- narrate ok: 2
- note ok: 12
- patch_storyboard ok: 3
- pilot_check ok: 1
- read_artifact error: 10
- read_artifact ok: 50
- render ok: 1
- reopen ok: 2
- report_finding ok: 11
- request_approval ok: 3
- submit_review ok: 3
- submit_scene ok: 29

## Refusals by the rails
- none

## What the lead looked at
- contact_sheet ['b13', 'b14', 'b15', 'b16', 'b17'] (lead)
- animatic 3 (lead)
- contact_sheet ['b03', 'b25'] (lead)
- animatic 3 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b19', 'b20', 'b21', 'b22', 'b23', 'b24', 'b25'] (lead)
- contact_sheet ['b15', 'b16', 'b17'] (lead)
- contact_sheet ['b18', 'b23', 'b11'] (lead)
- frames [162.834, 163.634, 165.6, 175.1] (fixer)
- contact_sheet ['b15', 'b16', 'b18'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 2
- engine: 0
