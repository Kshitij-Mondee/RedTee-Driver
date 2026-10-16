# Shuttle report: https-private

Mode: subscription; lead: sonnet; written 2026-10-10T09:46:17.

Shuttle: https-private  current done
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
      spent: $25.1582 (notional), 35228285 tokens, 695 calls; limits {'usd': 80.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table; notional in subscription mode)
- total $25.1582, 35228285 tokens, 695 model calls; cache reads 31060805 of 34299970 input tokens (91 %)
- by phase: - $0.1859 (15), P1 $0.1823 (5), P10 $4.2922 (33), P11 $0.2062 (4), P2 $0.1246 (7), P3 $0.1203 (5), P4 $0.1304 (4), P5 $1.5250 (23), P6 $0.9291 (5), P7 $0.6871 (20), P8 $9.9915 (420), P9 $6.7835 (154)
- by agent: critic $0.1423 (12), lead $8.1425 (148), shuttle-fact-finder $0.0345 (3), shuttle-fixer $5.6507 (297), shuttle-kit-builder $1.2610 (16), shuttle-scene-author $9.9043 (218), skeptic $0.0227 (1)
- models: claude-sonnet-5-5 x674, gemini-3.8-flash x13, claude-opus-5-5 x21
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 42 turns $1.6624 (1 cache misses); P5 success 30 turns $1.7292 (0 cache misses); P6 success 6 turns $0.3079 (0 cache misses); P7 success 10 turns $3.0182 (1 cache misses); P8 success 35 turns $17.4620 (3 cache misses); P9 success 69 turns $15.1279 (7 cache misses); P10 success 17 turns $1.5144 (1 cache misses); P10 success 19 turns $0.7676 (2 cache misses); P11 success 4 turns $0.2608 (0 cache misses)
- the CLI's own total, each session counted once: $41.8504 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-10T05:17:31 P4 for b02, b04, b05, b09, b14, b15, b16, b17 by lead: Script estimate is 151s against a 120s plan and 156s cap; trim words and split long phrases (<=9 words) on b02, b04, b05, b09, b14, b15, b16, b17 for safe timing. (stale P4; voided none)

## Delegations
- own-fact-finder-af533afa fact-finder  collected: 3 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-36dc1515 kit-builder  collected: 32 calls, accepted ['submit_kit'], refused 0, snapshots 6
- own-scene-author-fe57a4a0 scene-author ['b01'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-bb50c2de scene-author ['b02'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 7
- own-scene-author-827fa10f scene-author ['b03'] collected: 7 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-scene-author-1b79f679 scene-author ['b04'] collected: 16 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-c289786e scene-author ['b05'] collected: 31 calls, accepted ['submit_scene'], refused 1, snapshots 16
- own-scene-author-601aaac7 scene-author ['b06'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-3a01bfe2 scene-author ['b07'] collected: 20 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-da31ce46 scene-author ['b08'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-fc926b4b scene-author ['b09'] collected: 18 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-scene-author-f4afcbf6 scene-author ['b10'] collected: 26 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-db72e75d scene-author ['b11'] collected: 23 calls, accepted ['submit_scene'], refused 0, snapshots 10
- own-scene-author-5e8ecbb2 scene-author ['b12'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 9
- own-scene-author-5810a334 scene-author ['b13'] collected: 15 calls, accepted ['submit_scene'], refused 1, snapshots 4
- own-scene-author-07537da1 scene-author ['b14'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-3f5ed769 scene-author ['b17'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-4da97951 fixer ['b04', 'b05', 'b06', 'b07'] collected: 27 calls, accepted [], refused 0, snapshots 5
- own-fixer-90c3daf8 fixer ['b08', 'b11'] collected: 21 calls, accepted ['submit_scene'], refused 0, snapshots 7
- own-fixer-882b03d9 fixer ['b02'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-22bbb7bc fixer ['b17'] collected: 9 calls, accepted ['submit_scene'], refused 1, snapshots 1
- own-fixer-a4d41ed4 fixer ['b04', 'b05'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-fixer-0c1d46ff fixer ['b06', 'b07'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-67a00150 fixer ['b11'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-e538d18f fixer ['b05'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-291a03e6 fixer ['b06'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-fixer-9f18cb49 fixer ['b04'] collected: 12 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-fixer-8580ac71 fixer ['b05'] collected: 18 calls, accepted [], refused 0, snapshots 9
- own-fixer-8271ea47 fixer ['b06'] collected: 17 calls, accepted [], refused 0, snapshots 7
- own-fixer-971b4936 fixer ['b08'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-4c4fae15 fixer ['b13'] collected: 10 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-fixer-46b44e95 fixer ['b02'] collected: 9 calls, accepted ['submit_scene'], refused 1, snapshots 1
- own-scene-author-0b0a4992 scene-author ['b05'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-aa618643 scene-author ['b06'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-794cbdfd scene-author ['b07'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-33fae8cd fixer ['b04'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-fixer-d346474e fixer ['b13'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-c6e6be3d fixer ['b02'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-87635566 fixer ['b02'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-9c265877 fixer ['b04'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-182857c0 fixer ['b06'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-f0969a5e fixer ['b06'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-fixer-0423400c fixer ['b06'] collected: 6 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-7cea4f43 fixer ['b02'] collected: 7 calls, accepted ['submit_scene'], refused 1, snapshots 4
- own-fixer-0646bc9a fixer ['b07'] collected: 15 calls, accepted ['submit_scene'], refused 1, snapshots 9
- own-fixer-2d60ab70 fixer ['b12'] collected: 11 calls, accepted ['submit_scene'], refused 1, snapshots 6
- own-fixer-9cae1609 fixer ['b07'] collected: 8 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-fixer-8358632a fixer ['b07'] collected: 7 calls, accepted ['submit_scene'], refused 1, snapshots 2

## Tool calls (tool, outcome, count)
- accept_phase ok: 2
- animatic ok: 1
- capabilities ok: 2
- check ok: 10
- check refused: 2
- choose_persona ok: 1
- collect ok: 15
- contact_sheet error: 1
- contact_sheet ok: 15
- critic_review ok: 3
- delegate ok: 16
- frames error: 3
- frames ok: 7
- get_api_section error: 1
- get_api_section ok: 63
- get_beat ok: 38
- get_catalog_entry error: 1
- get_catalog_entry ok: 2
- get_example_scene ok: 6
- get_skill_section ok: 26
- get_style_pack ok: 8
- kit_preview ok: 6
- lab_snapshot error: 2
- lab_snapshot ok: 201
- lab_snapshot refused: 12
- lesson_status ok: 5
- list_skill_sections ok: 8
- narrate ok: 1
- note ok: 13
- patch_script ok: 1
- patch_script refused: 1
- pilot_check ok: 1
- read_artifact error: 27
- read_artifact ok: 244
- render ok: 1
- reopen ok: 1
- report_finding ok: 2
- request_approval ok: 3
- skeptic_review ok: 1
- submit_brief ok: 2
- submit_kit ok: 1
- submit_knowledge ok: 1
- submit_outline ok: 1
- submit_review ok: 4
- submit_scene ok: 51
- submit_scene refused: 4
- submit_script ok: 1
- submit_storyboard ok: 1
- submit_teaching_plan ok: 1

## Refusals by the rails
- patch_script (lead): P4 (persona and script) is accepted; to change it call reopen('P4', reason), with beats=[...] when the change is limited to some beats (its own cap, no approval voided). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [] should be non-empty
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [19.9, 21.6, 23.2, 25, 26.4] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [44.2, 44.9, 45.8, 47, 47.6] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [27, 29.6, 31, 32.4, 33.6] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [55.7, 57.4, 59.2, 60.4, 61.4, 63.2] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [84.9, 85.5, 87.4, 89.2, 90.3] is too long
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- check (lead): check belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is edited; beat files not accepted yet: scenes/b05.js
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- check (lead): check belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is edited; beat files not accepted yet: scenes/b05.js, scenes/b06.js
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-fixer-0423400c', owner) then read_artifact('brief:own-fixer-0423400c#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-0646bc9a#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-2d60ab70#2', owner))
- lab_snapshot (fixer): bad arguments for lab_snapshot: [] should be non-empty
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-fixer-9cae1609', owner) then read_artifact('brief:own-fixer-9cae1609#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2 of 2 not read yet (read_artifact('brief:own-fixer-8358632a', owner) then read_artifact('brief:own-fixer-8358632a#2', owner))

## What the lead looked at
- animatic 2 (lead)
- kit_preview  (lead)
- contact_sheet ['b04', 'b05', 'b06', 'b07', 'b08', 'b11'] (lead)
- frames [19.83, 24.5, 26.3] (fixer)
- frames [19.83, 29.86, 37.09, 48.05] (lead)
- contact_sheet ['b06'] (fixer)
- frames [37.6, 40.1, 41, 42.8] (fixer)
- frames [11.4, 19.83, 47.12, 85.13] (lead)
- contact_sheet ['b05', 'b06', 'b07'] (lead)
- contact_sheet ['b12', 'b13', 'b14'] (lead)
- frames [85.133, 86, 88, 90] (fixer)
- frames [83.5, 84.9, 85, 85.25] (fixer)
- frames [11.4, 19.83, 37.09, 42.45] (lead)
- contact_sheet ['b04', 'b05', 'b06', 'b07', 'b02'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17'] (lead)
- contact_sheet ['b07', 'b02', 'b04'] (lead)
- contact_sheet ['b12', 'b09', 'b14'] (lead)
- contact_sheet ['b12'] (fixer)
- contact_sheet ['b07', 'b02', 'b12'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17'] (lead)
- contact_sheet ['b07', 'b08'] (lead)
- contact_sheet ['b07', 'b08'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 1
- engine: 1
