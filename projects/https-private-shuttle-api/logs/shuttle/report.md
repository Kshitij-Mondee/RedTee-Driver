# Shuttle report: https-private-shuttle-api

Mode: api; lead: sonnet; written 2026-10-12T17:40:51.

Shuttle: https-private-shuttle-api  current done
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
      spent: $21.8001, 40572877 tokens, 848 calls; limits {'usd': 30.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $21.8001, 40572877 tokens, 848 model calls; cache reads 37006407 of 39884361 input tokens (93 %)
- by phase: - $0.2661 (19), P1 $0.0946 (4), P10 $0.8014 (35), P11 $0.4556 (5), P2 $0.1076 (8), P3 $0.0498 (3), P4 $0.2268 (5), P5 $1.1590 (16), P6 $0.7267 (5), P7 $0.6973 (21), P8 $9.1838 (502), P9 $8.0313 (225)
- by agent: critic $0.2102 (16), lead $11.3259 (242), shuttle-fact-finder $0.0340 (3), shuttle-fixer $3.3488 (312), shuttle-kit-builder $1.3962 (17), shuttle-scene-author $5.4560 (257), skeptic $0.0290 (1)
- models: claude-sonnet-5-5 x824, gemini-3.8-flash x17, claude-opus-5-5 x16
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 31 turns $1.2247 (1 cache misses); P5 success 30 turns $1.3900 (0 cache misses); P6 success 5 turns $0.2029 (0 cache misses); P7 success 9 turns $3.6792 (2 cache misses); P8 success 74 turns $16.0806 (4 cache misses); P10 success 27 turns $2.0212 (0 cache misses); P11 success 5 turns $0.1976 (0 cache misses)
- the CLI's own total, each session counted once: $24.7963 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-fact-finder-7168f4d3 fact-finder  collected: 3 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-25efa82e kit-builder ['b01', 'b02', 'b04', 'b06', 'b10', 'b13', 'b15'] collected: 28 calls, accepted ['submit_kit'], refused 0, snapshots 6
- own-scene-author-11bab3bb scene-author ['b01'] collected: 16 calls, accepted ['submit_scene'], refused 1, snapshots 4
- own-scene-author-c751020b scene-author ['b02'] collected: 28 calls, accepted [], refused 0, snapshots 5
- own-scene-author-6c7762db scene-author ['b02'] collected: 26 calls, accepted [], refused 0, snapshots 9
- own-fixer-a449e8b0 fixer ['b02'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-9ad98a42 fixer ['b01'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-19995e3b fixer ['b01', 'b02'] collected: 18 calls, accepted ['submit_scene', 'submit_scene'], refused 1, snapshots 6
- own-scene-author-8b2ebc8f scene-author ['b13'] collected: 17 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-f8ae21fb scene-author ['b15'] collected: 23 calls, accepted [], refused 2, snapshots 12
- own-scene-author-e78e5b94 scene-author ['b18'] collected: 23 calls, accepted ['submit_scene'], refused 3, snapshots 14
- own-scene-author-711077c2 scene-author ['b03'] collected: 17 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-1511e242 scene-author ['b04'] collected: 16 calls, accepted ['submit_scene'], refused 2, snapshots 5
- own-scene-author-b081d609 scene-author ['b14'] collected: 20 calls, accepted ['submit_scene'], refused 1, snapshots 8
- own-fixer-1ddd4ef1 fixer ['b15'] collected: 12 calls, accepted ['submit_scene'], refused 2, snapshots 4
- own-scene-author-e45d3a9c scene-author ['b05'] collected: 19 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-f7ca54a8 scene-author ['b16'] collected: 13 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-fixer-e9bde54a fixer ['b13'] collected: 8 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-scene-author-27b97be1 scene-author ['b06'] collected: 13 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-5f5d0928 scene-author ['b17'] collected: 13 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-665c54b4 scene-author ['b07'] collected: 17 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-6638806d scene-author ['b08'] collected: 15 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-a01107fd scene-author ['b09'] collected: 16 calls, accepted ['submit_scene'], refused 2, snapshots 6
- own-scene-author-e7062c81 scene-author ['b10'] collected: 20 calls, accepted ['submit_scene'], refused 2, snapshots 8
- own-scene-author-1f8c1192 scene-author ['b11'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-ab378621 scene-author ['b12'] collected: 16 calls, accepted ['submit_scene'], refused 1, snapshots 7
- own-fixer-ee4e18c6 fixer ['b02'] collected: 9 calls, accepted ['submit_scene'], refused 2, snapshots 3
- own-fixer-15343ddc fixer ['b11'] collected: 14 calls, accepted ['submit_scene'], refused 2, snapshots 8
- own-fixer-c1b0d3cf fixer ['b05'] collected: 17 calls, accepted [], refused 1, snapshots 11
- own-fixer-61feee74 fixer ['b07'] collected: 11 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-fixer-36d8f213 fixer ['b09'] collected: 14 calls, accepted ['submit_scene'], refused 1, snapshots 7
- own-fixer-88a1fe16 fixer ['b10', 'b01'] collected: 13 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-fixer-633a282b fixer ['b04'] collected: 9 calls, accepted [], refused 2, snapshots 3
- own-fixer-79a8801d fixer ['b17'] collected: 15 calls, accepted ['submit_scene'], refused 2, snapshots 4
- own-fixer-a6c022b1 fixer ['b05'] collected: 17 calls, accepted [], refused 2, snapshots 12
- own-fixer-3f25801a fixer ['b12'] collected: 10 calls, accepted ['submit_scene'], refused 3, snapshots 3
- own-fixer-5e188d78 fixer ['b05'] collected: 8 calls, accepted ['submit_scene'], refused 2, snapshots 3
- own-fixer-695d1432 fixer ['b17'] collected: 8 calls, accepted [], refused 2, snapshots 2
- own-fixer-d3a092e5 fixer ['b12'] collected: 10 calls, accepted ['submit_scene'], refused 2, snapshots 5
- own-fixer-e988ed0a fixer ['b05'] collected: 9 calls, accepted ['submit_scene'], refused 2, snapshots 4
- own-fixer-535486e0 fixer ['b17'] collected: 11 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-fixer-9c7d00a9 fixer ['b17'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-c1882c26 fixer ['b17'] collected: 10 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-c594c665 fixer ['b17'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-ffae9681 fixer ['b17'] collected: 7 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-f6f8218f fixer ['b17'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-29283345 fixer ['b17'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-284f433c fixer ['b17'] collected: 7 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-e67d3ed7 fixer ['b17'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-977ff428 fixer ['b17'] collected: 11 calls, accepted ['submit_scene'], refused 2, snapshots 5
- own-fixer-50e8a33c fixer ['b17'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-d1ff6bb9 fixer ['b17'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-bf6f3427 fixer ['b17'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-c7a29b92 fixer ['b17'] collected: 8 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-82fd85b6 fixer ['b10'] collected: 14 calls, accepted ['submit_scene'], refused 1, snapshots 8
- own-fixer-c4445a9d fixer ['b17'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-9745b811 fixer ['b02'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-c1ea6c6e fixer ['b05'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-e4d760f8 fixer ['b17'] collected: 13 calls, accepted ['submit_scene'], refused 1, snapshots 5

## Tool calls (tool, outcome, count)
- accept_phase ok: 2
- animatic ok: 1
- capabilities ok: 1
- check ok: 19
- check refused: 1
- choose_persona ok: 1
- collect ok: 34
- contact_sheet ok: 8
- critic_review ok: 2
- delegate ok: 35
- delegate refused: 1
- frames ok: 9
- get_api_section error: 1
- get_api_section ok: 74
- get_beat ok: 33
- get_example_scene ok: 6
- get_skill_section ok: 20
- get_style_pack ok: 9
- kit_preview ok: 6
- lab_snapshot ok: 195
- lab_snapshot refused: 64
- lesson_status ok: 4
- list_skill_sections ok: 6
- narrate ok: 1
- note ok: 9
- pilot_check ok: 1
- read_artifact error: 12
- read_artifact ok: 272
- render ok: 1
- report_finding ok: 9
- request_approval ok: 3
- skeptic_review ok: 1
- strips ok: 1
- submit_brief ok: 1
- submit_kit ok: 1
- submit_knowledge ok: 1
- submit_outline ok: 1
- submit_review ok: 3
- submit_scene ok: 66
- submit_scene refused: 3
- submit_script ok: 2
- submit_storyboard ok: 1
- submit_teaching_plan ok: 1

## Refusals by the rails
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [0.4, 1.2, 2.6, 4.6, 6.2, 7.8] is too long
- delegate (lead): scenes/b01.js is owned by the open token own-fixer-9ad98a42 (fixer): collect it first (one writer per file)
- lab_snapshot (fixer): read your whole brief before you write: part 3 of 3 not read yet (read_artifact('brief:own-fixer-19995e3b#3', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-8b2ebc8f#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-f8ae21fb#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-e78e5b94#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-711077c2#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-f8ae21fb#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-e78e5b94#2', owner))
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [114, 116, 118, 120.3, 122.5] is too long
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-1ddd4ef1#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-1ddd4ef1#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-1511e242#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-1511e242#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-b081d609#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-e9bde54a#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-e45d3a9c#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-f7ca54a8#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-27b97be1#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-5f5d0928#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-665c54b4#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-6638806d#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-a01107fd#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-a01107fd#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-e7062c81#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-e7062c81#2', owner))
- lab_snapshot (scene-author): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-scene-author-ab378621#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-ee4e18c6#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-15343ddc#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-c1b0d3cf#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-15343ddc#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-61feee74#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-36d8f213#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 3 of 3 not read yet (read_artifact('brief:own-fixer-88a1fe16#3', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-633a282b#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-633a282b#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-79a8801d#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-79a8801d#2', owner))
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- check (lead): check belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is edited; beat files not accepted yet: scenes/b05.js
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-a6c022b1#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-a6c022b1#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-3f25801a#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-5e188d78#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-695d1432#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-3f25801a#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-5e188d78#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-695d1432#2', owner))
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-d3a092e5#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-d3a092e5#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-e988ed0a#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-535486e0#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-e988ed0a#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-fixer-9c7d00a9', owner) then read_artifact('brief:own-fixer-9c7d00a9#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-c1882c26#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-c594c665#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-ffae9681#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-f6f8218f#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-29283345#2', owner))

## What the lead looked at
- animatic 2 (lead)
- kit_preview  (lead)
- frames [104.95, 106, 110, 113.4] (fixer)
- contact_sheet ['b16', 'b17'] (fixer)
- frames [113.4] (fixer)
- frames [113.4] (lead)
- frames [28.1] (lead)
- contact_sheet ['b11', 'b12'] (lead)
- strips b17-b18 (lead)
- frames [113.35] (lead)
- frames [113.4] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b10', 'b07', 'b02'] (lead)
- contact_sheet ['b05', 'b17', 'b12'] (lead)
- frames [113.4, 112] (lead)
- contact_sheet ['b02', 'b05', 'b10'] (lead)
- contact_sheet ['b17', 'b03', 'b06'] (lead)
- frames [42, 45.8] (lead)
- frames [74.28, 117.84] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 0
- engine: 1
