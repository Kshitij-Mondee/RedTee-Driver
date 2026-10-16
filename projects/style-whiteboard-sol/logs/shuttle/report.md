# Shuttle report: style-whiteboard-sol

Mode: api; lead: sonnet; written 2026-10-14T09:52:09.

Shuttle: style-whiteboard-sol  current done
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
      spent: $3.5214, 6743093 tokens, 189 calls; limits {'usd': 9.0}; reopens 2 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $3.5214, 6743093 tokens, 189 model calls; cache reads 5785404 of 6653654 input tokens (87 %)
- by phase: - $0.1140 (8), P10 $0.1594 (15), P11 $0.0902 (4), P5 $0.0356 (3), P6 $0.0375 (4), P7 $0.8970 (23), P8 $1.8304 (106), P9 $0.3572 (26)
- by agent: critic $0.1067 (7), lead $1.3523 (88), shuttle-fixer $0.0282 (5), shuttle-kit-builder $0.6993 (15), shuttle-scene-author $1.3349 (74)
- models: claude-sonnet-5-5 x103, gpt-6.1-sol x79, gemini-3.8-flash x7
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 10 turns $0.5389 (0 cache misses); P7 success 7 turns $0.3333 (0 cache misses); P8 success 9 turns $0.1830 (0 cache misses); P7 success 7 turns $0.6518 (0 cache misses); P8 success 6 turns $1.0394 (0 cache misses); P9 success 18 turns $0.2291 (0 cache misses); P5-P6 success 8 turns $0.0766 (0 cache misses); P8 success 4 turns $0.0358 (0 cache misses); P9 success 4 turns $0.0759 (0 cache misses); P10 success 12 turns $0.1756 (0 cache misses); P11 success 3 turns $0.0753 (1 cache misses)
- the CLI's own total, each session counted once: $3.4146 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 2 of 3; for named beats 1 of 8
- 2026-10-14T09:06:49 P7 by lead: Pilot pair b01/b02 blocked by kit team_table bugs found by b02's author: (1) bubble(i,'?') Caveat '?' overflows its 64px box at the 72px floor (gate text_overflow); (2) opts.held:true + arrive(t) does not bring the people back after previous beat's leave(), chairs stay empty; (3) bubble/clearBubbles child names may collide across beats (b01 two scribbles, b02 four bubbles, b12 four more). Keep API; b01 is accepted and uses draw/arrive/leave/bubble(null)/clearBubbles. (stale P7; voided final)
- 2026-10-14T09:14:01 P7 by lead: Pilot b01+b02: pilot_check passes but the frames (qa/pilot_check.jpg, t=5.0 and t=14.03) show team_table's held arrive still failing: after b01 leave(), b02 team_table(held:true).arrive(tSam) leaves all four chairs EMPTY at 14.03 (bubble 'May' and scribbles float above empty chairs). Scene-author also snapshotted and found empty chairs in every sampled frame incl. settled. Kit fix needed, API unchanged: with held:true, arrive(t) must make each person visible (check life-group opacity set by leave() is actually reset on the held people elements and the b02 handle's person refs point to the same elements; if the leave in b01 exits the elements via m.exit/ctx.held exit, restoring needs to override that). Also nameTag(0,'Sam') currently draws under the table line, not by Sam's seat: tagBox(0) should sit at the head of person 0 / below the chair at the seat. Verify in a real two-beat pair (b01 then b02) by looking at frames at 14s before accepting. (stale P7; voided final)
- 2026-10-14T09:33:51 P5 for b03 by lead: P9 check error avatar_props_unknown: b03 props.card is an array; the avatar reads card as an object {title, lines, rule, say}. Patch b03 props to card: {lines: ["Before","During","Close"]} (title stays "Three moves fix it" at top level; add card.title only if needed). (stale P5; voided none)

## Delegations
- own-scene-author-3b1cfe3e scene-author ['b01'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-eb4ff7e6 scene-author ['b02'] collected: 17 calls, accepted [], refused 0, snapshots 2
- own-kit-builder-bd29902d kit-builder ['b01', 'b02'] collected: 8 calls, accepted ['submit_kit'], refused 0, snapshots 1
- own-scene-author-045a9e15 scene-author ['b02'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-kit-builder-7d02befc kit-builder ['b01', 'b02'] collected: 10 calls, accepted ['submit_kit'], refused 0, snapshots 1
- own-scene-author-6dfbea9d scene-author ['b04', 'b05', 'b06'] collected: 18 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 7
- own-scene-author-e71aea5e scene-author ['b07', 'b08'] collected: 16 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-01178cc8 scene-author ['b09'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-9dce006b scene-author ['b12', 'b13'] collected: 12 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-scene-author-7c6a4b7c scene-author ['b14'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-ab5c5d65 fixer ['b05'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- capabilities ok: 1
- catalog_search ok: 1
- check ok: 3
- collect ok: 6
- contact_sheet ok: 3
- critic_review ok: 2
- delegate ok: 6
- delegate refused: 1
- get_api_section ok: 27
- get_beat ok: 4
- get_catalog_entry error: 1
- get_example_scene error: 1
- get_example_scene ok: 8
- get_skill_section ok: 1
- get_source_chunks ok: 1
- get_style_pack ok: 8
- kit_preview ok: 2
- lab_snapshot ok: 24
- lesson_status ok: 9
- list_skill_sections ok: 1
- narrate ok: 1
- note ok: 11
- patch_storyboard ok: 1
- pilot_check ok: 2
- read_artifact error: 3
- read_artifact ok: 41
- render ok: 1
- reopen ok: 3
- report_finding ok: 3
- request_approval ok: 2
- submit_kit ok: 2
- submit_review ok: 3
- submit_scene ok: 13

## Refusals by the rails
- delegate (lead): the kit-builder works in P7; the lesson is in P8

## What the lead looked at
- kit_preview  (lead)
- kit_preview  (lead)
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b13', 'b11', 'b05'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- kit: 0
- scene: 0
- engine: 0
