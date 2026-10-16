# Shuttle report: feedback-shuttle-opus

Mode: subscription; lead: opus; written 2026-10-08T21:20:23.

Shuttle: feedback-shuttle-opus  current done
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
      spent: $71.2739 (notional), 91988759 tokens, 647 calls; limits {'usd': 150.0}; reopens 4 of 4

## Cost (USD at the engine's price table; notional in subscription mode)
- total $71.2739, 91988759 tokens, 647 model calls; cache reads 84270615 of 91765127 input tokens (92 %)
- by phase: - $0.7411 (33), P1 $0.3817 (9), P10 $12.2228 (89), P11 $0.3186 (3), P2 $0.2844 (8), P3 $0.2186 (5), P4 $0.3265 (3), P5 $2.3885 (30), P6 $2.1486 (12), P7 $4.6352 (46), P8 $22.4098 (321), P9 $25.1980 (88)
- by agent: critic $0.3477 (28), lead $55.6865 (234), reconcile $3.5875 (1), shuttle-fact-finder $0.0417 (3), shuttle-fixer $2.5527 (101), shuttle-kit-builder $1.7174 (34), shuttle-scene-author $7.3160 (245), skeptic $0.0245 (1)
- models: claude-opus-5-5 x234, claude-sonnet-5 x383, gemini-3.8-flash x29, claude-opus-5-5,claude-sonnet-5 x1
- sessions (the CLI's own figures): P1-P4 success 36 turns $1.4294 (1 cache misses); P5-P6 success 41 turns $1.9390 (0 cache misses); P7-P9 success 192 turns $59.3469 (12 cache misses); P10-P11 success 42 turns $3.2690 (1 cache misses); P10-P11 success 4 turns $3.4512 (0 cache misses); P10-P11 success 53 turns $3.8163 (1 cache misses)

## Reopens
- 2026-10-08T17:49:16 P7 by lead: The composed build shows the kit API cannot carry the storyboard's continuity. (1) desk_set draws its wall and table as raw SVG into the station, so in the composed film b04 and b05 render as an empty wall (Leo, the dials, the bubble and the tag are all invisible) and b06 shows Leo sunk behind the wrong table. It needs a back part and a front part, each drawn only into the parent it is given. (2) marks_rail and week_planner bundle mark_1..3, call_card and tue_pin inside one root, so beats cannot create the storyboard's design elements as separate ctx.el. Check: held_missing on b05, b06 and b08-b11. Because nothing could be held, every continue beat redrew the whole set over the previous one (content_overlap at every join). (3) Smaller kit bugs seen in snapshots and the check: due_thu stays invisible after flip; the moved call card sits on the 'Next week' text (text overlap); tue_message has no accent; the sendTo text overflows. The fix is in the kit API, then every beat is rewritten on a held/E.ui continuity protocol. (stale P7, P8, P9, P10, P11; voided final)
- 2026-10-08T19:25:14 P8 by lead: Four beats (b05, b06, b10, b11) still carry the pre-contract code. That code draws outside the elements and redraws held items, and in the composed film it blanks b04. They need full rewrites on the held/E.ui continuity contract. Two fixer attempts on b05 hit the fixer's 8-turn cap before submitting (one of them even had a drafted source), so the rewrites need scene-authors, which only work in P8. Beats already rewritten and accepted on the contract (b02, b03, b04, b07, b08, b09, b14) stay as they are. (stale P8, P9, P10, P11; voided final)
- 2026-10-08T20:02:20 P5 by lead: The check now passes everything except one storyboard-owned error: b12 (quiz.question template) shows 9.7 s with nothing developing from 88.9 s. Both option cards arrive together as peers, then card B's long line is read aloud while the frame holds, until the pause ring. The hold is the point of a stopping check (the viewer reads and compares the two lines), so the plan should declare it with intent 'hold' on b12. That is a storyboard field, so it needs P5. Same patch: b11's shot move goes from 'push' to 'none' to match the built beat (the push was dropped; the walking accent bar carries the order). Last reopen (3 of 3). It also makes P7 stale, which lets the kit-builder fix the build-time stroke bug in mark_card and due_thu next session. (stale P5, P6, P7, P8, P9, P10, P11; voided plan, final)
- 2026-10-08T20:44:42 P5 by lead: b13 quiz.answer props were written 1-based (answer 2, tempting 1); the template is 0-based, so no option is marked and the screen reads 'Why not B?' while the narration says B is right. Patch b13 only: answer 1, tempting 0. Person raised the reopen cap to 4 for this. (stale P5, P6, P7, P8, P9, P10, P11; voided plan, final)

## Delegations
- own-fact-finder-4dbcda45 fact-finder  collected: 4 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-a2e07052 kit-builder  collected: 32 calls, accepted ['submit_kit'], refused 0, snapshots 4
- own-scene-author-d0984b33 scene-author ['b02'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-1d8cfbb6 scene-author ['b03'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-8944b862 scene-author ['b04'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-5cda834e scene-author ['b05'] collected: 26 calls, accepted [], refused 0, snapshots 8
- own-scene-author-d4d45692 scene-author ['b06'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-2d2145ef scene-author ['b07'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-5ae62185 scene-author ['b08'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-27c76be7 scene-author ['b09'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-0e4ff890 scene-author ['b10'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-490614f3 scene-author ['b11'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-3a0afa58 scene-author ['b14'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-89cb3220 scene-author ['b05'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-kit-builder-fa7f95e8 kit-builder  collected: 16 calls, accepted ['submit_kit'], refused 0, snapshots 4
- own-scene-author-479d9a57 scene-author ['b02'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-c43a3175 scene-author ['b04'] collected: 16 calls, accepted [], refused 0, snapshots 11
- own-scene-author-339c6054 scene-author ['b07'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-761e0ae9 scene-author ['b14'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-252b911d scene-author ['b04'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-2099617b scene-author ['b03'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-48670125 scene-author ['b08'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-f527291a fixer ['b14'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-9a72f465 fixer ['b05'] collected: 9 calls, accepted [], refused 0, snapshots 1
- own-fixer-9d700f51 fixer ['b09'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-c016dcec fixer ['b05'] collected: 12 calls, accepted [], refused 0, snapshots 1
- own-scene-author-6ff74781 scene-author ['b05'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-39bc94d5 scene-author ['b10'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-3fe4cfe8 fixer ['b06'] collected: 3 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-d11e4893 fixer ['b11'] collected: 3 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-75e8130d fixer ['b04'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-b25d18ee fixer ['b05'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-7930c883 fixer ['b02'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-76930463 fixer ['b11'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-edbef942 fixer ['b05'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-d8df0fca fixer ['b11'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-76387605 fixer ['b02'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-5820bae6 fixer ['b03'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-kit-builder-a8aca675 kit-builder  collected: 10 calls, accepted ['submit_kit'], refused 0, snapshots 1
- own-fixer-a137f554 fixer ['b04'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-d2581514 fixer ['b05', 'b06'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-fixer-e7988a60 fixer ['b10'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-f31d96c2 fixer ['b04'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-cc873281 fixer ['b07'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-c79b2097 fixer ['b08'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-1143a1e8 fixer ['b14'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-cf38d685 fixer ['b14'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 6
- animatic ok: 3
- capabilities ok: 11
- catalog_search ok: 11
- check ok: 11
- choose_persona ok: 1
- collect ok: 47
- compose ok: 12
- contact_sheet ok: 11
- contact_sheet refused: 1
- critic_review ok: 5
- delegate ok: 47
- delegate refused: 4
- frames error: 1
- frames ok: 8
- get_api_section error: 12
- get_api_section ok: 122
- get_beat ok: 5
- get_catalog_entry error: 2
- get_catalog_entry ok: 8
- get_example_scene error: 3
- get_example_scene ok: 17
- get_skill_section error: 1
- get_skill_section ok: 17
- get_style_pack ok: 8
- kit_preview error: 1
- kit_preview ok: 9
- lab_snapshot error: 1
- lab_snapshot ok: 102
- lesson_status ok: 16
- list_skill_sections error: 7
- list_skill_sections ok: 8
- narrate ok: 3
- note ok: 18
- patch_storyboard ok: 2
- patch_storyboard refused: 1
- read_artifact error: 5
- read_artifact ok: 125
- render ok: 1
- render refused: 1
- reopen ok: 4
- reopen refused: 1
- report_finding error: 21
- report_finding ok: 10
- request_approval ok: 5
- skeptic_review ok: 1
- strips ok: 5
- submit_brief ok: 2
- submit_kit ok: 6
- submit_knowledge ok: 2
- submit_outline ok: 1
- submit_review ok: 4
- submit_scene ok: 41
- submit_script ok: 2
- submit_storyboard ok: 1
- submit_teaching_plan ok: 2

## Refusals by the rails
- contact_sheet (lead): contact_sheet belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is pending; beat files not accepted yet: scenes/b03.js, scenes/b05.js, scenes/b06.js, scenes/b07.js, scenes/b08.js, scenes/b09.js, scenes/b10.js, scenes/b11.js ...
- delegate (lead): the scene-author works in P8; the lesson is in P9
- delegate (lead): the scene-author works in P8; the lesson is in P9
- delegate (lead): the scene-author works in P8; the lesson is in P9
- delegate (lead): the scene-author works in P8; the lesson is in P9
- patch_storyboard (lead): P5 (storyboard) is accepted; to change it call reopen('P5', reason): that marks P5 and every later phase stale and counts against the reopen cap
- reopen (lead): the reopen cap (3) is used: ask the person (request_approval or end the session with what you would change and why)
- render (lead): render belongs to P11 (render); P10 (critique and fix) is not accepted yet: reopened at 2026-10-08T20:44:42: redo it, or accept_phase('P10') if it still holds; critic_review of the current build

## What the lead looked at
- animatic 2 (lead)
- kit_preview  (lead)
- frames [9.696, 20.6, 57.3, 63.5] (lead)
- strips b02-b03 (lead)
- strips b04-b07 (lead)
- strips b08-b11 (lead)
- kit_preview  (lead)
- strips b02-b04 (lead)
- contact_sheet ['b05'] (fixer)
- frames [8.2, 9.5, 34.6, 82.8] (lead)
- frames [9.476, 38.5, 42.6, 82.8] (lead)
- frames [9.4, 9.6] (lead)
- frames [9.4, 9.48, 9.6, 9.7] (fixer)
- strips b12-b13 (lead)
- animatic 2 (lead)
- kit_preview  (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15'] (lead)
- contact_sheet ['b02', 'b03', 'b04', 'b05', 'b06', 'b10', 'b14'] (lead)
- contact_sheet ['b12', 'b13', 'b01', 'b07', 'b08', 'b09', 'b11', 'b15'] (lead)
- contact_sheet ['b10'] (fixer)
- contact_sheet ['b04', 'b05', 'b06', 'b07', 'b10', 'b11'] (lead)
- frames [27.6, 30.8] (lead)
- frames [27.6, 32, 46.3] (lead)
- animatic 2 (lead)
- contact_sheet ['b10', 'b12', 'b13', 'b14', 'b02', 'b05'] (lead)
- contact_sheet ['b01', 'b03', 'b04', 'b06', 'b07', 'b08', 'b09', 'b11', 'b15'] (lead)
- contact_sheet ['b07', 'b08', 'b14'] (lead)
- contact_sheet ['b14', 'b13'] (lead)
- frames [50, 61, 111, 121] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- scene: 0
- engine: 0
