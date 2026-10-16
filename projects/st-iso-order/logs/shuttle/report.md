# Shuttle report: st-iso-order

Mode: api; lead: sonnet; written 2026-10-16T16:35:20.

Shuttle: st-iso-order  current done
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
      spent: $14.6969, 22465785 tokens, 654 calls; limits {'usd': 30.0}; reopens 1 of 3; for named beats 3 of 8

## Cost (USD at the engine's price table)
- total $14.6969, 22465785 tokens, 654 model calls; cache reads 19019198 of 22139137 input tokens (86 %)
- by phase: - $0.2073 (14), P1 $0.2794 (7), P10 $0.3630 (26), P11 $0.2124 (7), P2 $0.2063 (9), P3 $0.3325 (7), P4 $0.9771 (16), P5 $2.9726 (36), P6 $0.6446 (20), P7 $3.1172 (100), P8 $5.1153 (377), P9 $0.2692 (35)
- by agent: critic $0.1710 (12), lead $7.4293 (168), shuttle-fact-finder $0.0707 (4), shuttle-fixer $0.8075 (98), shuttle-kit-builder $2.5375 (84), shuttle-scene-author $3.6520 (287), skeptic $0.0288 (1)
- models: claude-opus-5-5 x77, claude-sonnet-5-5 x95, gemini-3.8-flash x13, gpt-6.1-sol x469
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 30 turns $1.6739 (0 cache misses); P5 success 18 turns $2.2161 (0 cache misses); P6 success 6 turns $0.0934 (0 cache misses); P1-P4 success 5 turns $0.2028 (0 cache misses); P5 success 11 turns $0.6090 (0 cache misses); P6 success 5 turns $0.0654 (0 cache misses); P1-P4 success 4 turns $0.1650 (0 cache misses); P5 success 9 turns $0.3438 (0 cache misses); P6 success 4 turns $0.0530 (0 cache misses); P7 success 12 turns $1.4963 (0 cache misses); P8 success 13 turns $4.1850 (1 cache misses); P7 success 11 turns $1.7046 (2 cache misses); P8 success 6 turns $0.2163 (0 cache misses); P9 success 14 turns $0.2922 (0 cache misses); P10 success 16 turns $1.0605 (0 cache misses); P11 success 4 turns $0.1200 (1 cache misses)
- the CLI's own total, each session counted once: $14.4971 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 1 of 3; for named beats 3 of 8
- 2026-10-16T15:09:40 P4 for b12, b14, b15, b16, b21, b22, b24 by lead: narrate refused: ASR mismatches on short or odd phrases (b12.2, b14.2, b15.1, b16.2, b22.3, b24.x; output was cut off after b24, b21 'at, at hub' likely next). Reword lines so TTS reads them cleanly. (stale P4; voided none)
- 2026-10-16T15:11:27 P5 for b12, b14, b15, b16, b22 by lead: The P4 rewording (TTS clarity) changed phrases these beats' t_anchors cite ('A wrong item', 'linehaul', 'Miss the truck', 'stalls it too', 'A missed truck'); the P5 accept after patching b24 left them stale. Re-point anchors to the current wording, nothing else changes. (stale P5; voided none)
- 2026-10-16T15:13:44 P4 for b10, b14, b19, b22 by lead: narrate ASR check failed on b10.2 'Walk, lift.' (heard Ewok Lift), b14.2 'Trucks between hubs are called line haul,' (heard Tracks...Line Hall), b19.2 'Nobody home.' and b19.5 'Bad weather.' (heard It's ...), b22.1 'The hub.' (heard See the hub). Very short fragments and odd words; reword into fuller natural sentences, same facts. (stale P4; voided none)
- 2026-10-16T15:45:31 P7 by lead: Beat authors b05,b06,b07,b10,b11,b16,b22 independently report kit defects: board-mode lamp artwork (card/lamp states) invisible while only ring and 'Lamp' pin show (the film's subject); no visible label decal on box; Lamp pin persists after crate leaves; held_mark cannot fit 'Unreadable label' (b22 cannot be accepted: text_overflow); pins cannot end before camera moves; night state too pale; grey state loses dotted route and leaves a floating grey crate on fresh boards (b20, b21). (stale P7; voided final)

## Delegations
- own-fact-finder-46efb748 fact-finder  collected: 4 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-0bcd85de kit-builder  collected: 25 calls, accepted [], refused 0, snapshots 7
- own-kit-builder-58414543 kit-builder  collected: 20 calls, accepted ['submit_kit'], refused 0, snapshots 7
- own-scene-author-12b8b5b3 scene-author ['b01'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-39caf9f7 scene-author ['b02'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-1b5df51a scene-author ['b03'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-1da51d0d scene-author ['b04'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-a66af791 scene-author ['b05'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-f7574d62 scene-author ['b06'] collected: 22 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-f7cbac00 scene-author ['b07'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-eac6dac9 scene-author ['b08'] collected: 21 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-59964cab scene-author ['b09'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-de0fdb00 scene-author ['b10'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-4a94fdf6 scene-author ['b11'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-3c613a4d scene-author ['b12'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-e15754b3 scene-author ['b13'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-9980ae10 scene-author ['b14'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-cd66ce2e scene-author ['b15'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-efe7b964 scene-author ['b16'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-6f50b79f scene-author ['b17'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-48337cb4 scene-author ['b18'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-8e7f31d9 scene-author ['b19'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-ddc6132f scene-author ['b20'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-67e1ce2a scene-author ['b21'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-1a9de51f scene-author ['b22'] collected: 26 calls, accepted [], refused 0, snapshots 6
- own-scene-author-b3b53020 scene-author ['b23'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-2b72ac2e scene-author ['b24'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-kit-builder-73c3d41a kit-builder  collected: 25 calls, accepted [], refused 0, snapshots 13
- own-kit-builder-fdc094b1 kit-builder  collected: 12 calls, accepted ['submit_kit'], refused 0, snapshots 4
- own-scene-author-120d964e scene-author ['b22'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-b0f9f9ea fixer ['b16'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-53396596 fixer ['b14'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-b842ddb7 fixer ['b15'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-65879f09 fixer ['b17'] collected: 3 calls, accepted [], refused 0, snapshots 0
- own-fixer-1c0e5dee fixer ['b05', 'b06'] collected: 21 calls, accepted [], refused 0, snapshots 6
- own-fixer-5e1a1bb4 fixer ['b13'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-ad9f3cbf fixer ['b17', 'b18', 'b19'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-3cf6a9f1 fixer ['b14'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-c82003ca fixer ['b09'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-1877e2ae fixer ['b01', 'b02'] collected: 8 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2
- own-fixer-aa6050f3 fixer ['b20', 'b21'] collected: 13 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-f853ad34 fixer ['b05', 'b06'] collected: 12 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3

## Tool calls (tool, outcome, count)
- animatic ok: 1
- capabilities ok: 4
- catalog_search ok: 1
- check ok: 5
- choose_persona ok: 1
- collect ok: 13
- contact_sheet error: 1
- contact_sheet ok: 8
- critic_review ok: 2
- delegate ok: 13
- delegate refused: 1
- frames ok: 6
- get_api_section error: 5
- get_api_section ok: 97
- get_beat ok: 10
- get_example_scene error: 3
- get_example_scene ok: 16
- get_skill_section ok: 18
- get_source_chunks ok: 1
- get_style_pack ok: 33
- kit_preview error: 2
- kit_preview ok: 31
- lab_snapshot ok: 95
- lesson_status ok: 11
- list_skill_sections ok: 7
- narrate error: 2
- narrate ok: 1
- note ok: 19
- patch_script ok: 2
- patch_script refused: 1
- patch_storyboard ok: 3
- patch_storyboard refused: 1
- pilot_check ok: 2
- read_artifact error: 24
- read_artifact ok: 209
- render ok: 1
- reopen ok: 4
- report_finding ok: 48
- request_approval ok: 3
- skeptic_review ok: 1
- submit_brief ok: 3
- submit_kit ok: 3
- submit_knowledge ok: 1
- submit_outline ok: 6
- submit_review refused: 1
- submit_scene ok: 39
- submit_script ok: 3
- submit_storyboard ok: 4
- submit_teaching_plan ok: 3

## Refusals by the rails
- patch_script (lead): P4 (persona and script) is accepted; to change it call reopen('P4', reason), with beats=[...] when the change is limited to some beats (its own cap, no approval voided). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes
- patch_storyboard (lead): P5 (storyboard) is accepted; to change it call reopen('P5', reason), with beats=[...] when the change is limited to some beats (its own cap, no approval voided). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes
- delegate (lead): the kit-builder works in P7; the lesson is in P8
- submit_review (lead): P10 (critique and fix) is accepted; to change it call reopen('P10', reason). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes

## What the lead looked at
- animatic 3 (lead)
- kit_preview  (lead)
- kit_preview  (lead)
- kit_preview  (lead)
- kit_preview  (lead)
- contact_sheet ['b16', 'b10', 'b14'] (lead)
- frames [110, 112.4, 114.9] (fixer)
- frames [110, 112.4, 114.9] (fixer)
- frames [115.8, 118.5] (fixer)
- contact_sheet ['b05', 'b07', 'b11', 'b20', 'b21', 'b22', 'b24', 'b01', 'b02'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b19', 'b20', 'b21', 'b22', 'b23', 'b24'] (lead)
- contact_sheet ['b13', 'b05', 'b20'] (lead)
- frames [141, 144, 146, 153] (fixer)
- frames [120.32, 126.15, 127.05, 136.54] (fixer)
- contact_sheet ['b05', 'b06', 'b13', 'b17', 'b18', 'b20', 'b21', 'b02', 'b01'] (lead)
- contact_sheet ['b14'] (lead)
- frames [76.5, 77.01, 77.5] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 1
- engine: 0
