# Shuttle report: st-sc-2fa

Mode: api; lead: sonnet; written 2026-10-16T16:35:19.

Shuttle: st-sc-2fa  current done
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
      spent: $12.4197, 21414601 tokens, 682 calls; limits {'usd': 30.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $12.4197, 21414601 tokens, 682 model calls; cache reads 18335833 of 21140674 input tokens (87 %)
- by phase: - $0.1793 (11), P1 $0.2238 (6), P10 $0.2724 (24), P11 $0.1441 (5), P2 $0.2628 (10), P3 $0.2786 (6), P4 $0.6227 (7), P5 $1.9902 (22), P6 $0.4857 (14), P7 $0.3349 (15), P8 $6.9495 (512), P9 $0.6757 (50)
- by agent: critic $0.1455 (9), lead $5.0873 (117), shuttle-fact-finder $0.1337 (5), shuttle-fixer $2.5738 (201), shuttle-kit-builder $0.1755 (11), shuttle-scene-author $4.2773 (338), skeptic $0.0265 (1)
- models: claude-opus-5-5 x53, claude-sonnet-5-5 x69, gemini-3.8-flash x10, gpt-6.1-sol x550
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 24 turns $1.3738 (0 cache misses); P5 success 18 turns $1.8999 (0 cache misses); P6 success 4 turns $0.0802 (0 cache misses); P1-P4 success 4 turns $0.1884 (0 cache misses); P5 success 7 turns $0.2782 (0 cache misses); P6 success 4 turns $0.0530 (0 cache misses); P7 success 8 turns $0.4070 (0 cache misses); P8 success 14 turns $5.3802 (0 cache misses); P9 success 12 turns $1.0966 (2 cache misses); P9 success 4 turns $0.0365 (0 cache misses); P10 success 15 turns $1.3421 (0 cache misses); P11 success 3 turns $0.1118 (1 cache misses)
- the CLI's own total, each session counted once: $12.2477 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-16T15:09:05 P4 for b19 by lead: narrate refused b19.1: TTS says 'autofill' as 'auto fill' (ASR word error 29%). Respell the line, e.g. 'auto-fill' or 'fill in by itself', keeping the F18 hedge (warning sign, not guarantee). (stale P4; voided none)

## Delegations
- own-fact-finder-f9cf2002 fact-finder  collected: 5 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-bd9a2c8c kit-builder ['b05', 'b09', 'b10', 'b11', 'b13', 'b20', 'b22', 'b23', 'b24', 'b25', 'b08', 'b01', 'b02', 'b04', 'b06'] collected: 14 calls, accepted ['submit_kit'], refused 0, snapshots 2
- own-scene-author-0ef14c7e scene-author ['b01'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-295c2d9c scene-author ['b02'] collected: 24 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-21f553be scene-author ['b03'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-d74d79cf scene-author ['b04'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-fdca0449 scene-author ['b05'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-d4c09687 scene-author ['b06'] collected: 24 calls, accepted [], refused 0, snapshots 4
- own-scene-author-b57668fa scene-author ['b07'] collected: 27 calls, accepted [], refused 0, snapshots 5
- own-scene-author-6b16966f scene-author ['b08'] collected: 19 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-7bb2da23 scene-author ['b09'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-c8cc5910 scene-author ['b10'] collected: 27 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-f0045879 scene-author ['b11'] collected: 16 calls, accepted [], refused 0, snapshots 2
- own-scene-author-75e00ee9 scene-author ['b12'] collected: 22 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-c0717e5c scene-author ['b13'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-190d703f scene-author ['b14'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-7a7a9d67 scene-author ['b15'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-8d82da27 scene-author ['b16'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-31a2b460 scene-author ['b17'] collected: 24 calls, accepted [], refused 0, snapshots 4
- own-scene-author-db558f0b scene-author ['b18'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-5e46363e scene-author ['b19'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-5166a8ad scene-author ['b20'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-730eb509 scene-author ['b21'] collected: 24 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-a85714ae scene-author ['b22'] collected: 23 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-85059080 scene-author ['b23'] collected: 23 calls, accepted [], refused 0, snapshots 4
- own-scene-author-59dc98bf scene-author ['b24'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-783cc8f0 scene-author ['b25'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-6230bd99 fixer ['b06', 'b07'] collected: 20 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-fixer-4de79c05 fixer ['b11'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-70cf263b fixer ['b17'] collected: 20 calls, accepted [], refused 0, snapshots 6
- own-fixer-6334914f fixer ['b23'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-49d351f6 fixer ['b17'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-9f2ff7f7 fixer ['b05', 'b06', 'b07', 'b08', 'b11'] collected: 25 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-fixer-828e3844 fixer ['b09', 'b13'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-58ae7730 fixer ['b16', 'b17'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-22e19eee fixer ['b16', 'b17'] collected: 16 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-12a590e2 fixer ['b16', 'b17'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-3aa37dd1 fixer ['b03', 'b04'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-02884168 fixer ['b05'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-d8e3fc4f fixer ['b10'] collected: 16 calls, accepted [], refused 0, snapshots 9
- own-fixer-e4a1496d fixer ['b14', 'b15'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-bfc38d77 fixer ['b16'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-30e7abcf fixer ['b18', 'b19'] collected: 18 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-c51f469c fixer ['b10'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-8b1f7ce3 fixer ['b04'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 3
- animatic ok: 1
- budget_status ok: 1
- capabilities ok: 2
- catalog_search ok: 2
- check ok: 6
- check refused: 1
- choose_persona ok: 1
- collect ok: 11
- contact_sheet ok: 5
- critic_review ok: 2
- delegate ok: 12
- frames ok: 10
- get_api_section error: 13
- get_api_section ok: 162
- get_beat ok: 9
- get_catalog_entry ok: 1
- get_example_scene ok: 30
- get_skill_section ok: 15
- get_style_pack ok: 35
- kit_preview ok: 2
- lab_snapshot ok: 142
- lesson_status ok: 5
- list_skill_sections ok: 4
- narrate error: 1
- narrate ok: 1
- note ok: 14
- patch_script ok: 1
- patch_storyboard refused: 1
- pilot_check ok: 1
- read_artifact error: 52
- read_artifact ok: 190
- render ok: 1
- reopen ok: 1
- report_finding ok: 51
- request_approval ok: 3
- skeptic_review ok: 1
- submit_brief ok: 2
- submit_kit ok: 2
- submit_knowledge ok: 2
- submit_outline ok: 5
- submit_review refused: 1
- submit_scene ok: 50
- submit_script ok: 2
- submit_storyboard ok: 2
- submit_teaching_plan ok: 3

## Refusals by the rails
- patch_storyboard (lead): P5 (storyboard) is accepted; to change it call reopen('P5', reason), with beats=[...] when the change is limited to some beats (its own cap, no approval voided). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes
- check (lead): check belongs to P9 (compose and check); P8 (beats) is not accepted yet: stage scenes is edited; beat files not accepted yet: scenes/b04.js, scenes/b10.js
- submit_review (lead): P10 (critique and fix) is accepted; to change it call reopen('P10', reason). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes

## What the lead looked at
- animatic 3 (lead)
- kit_preview  (lead)
- frames [126, 127] (fixer)
- frames [49, 54, 61, 82] (fixer)
- frames [126, 127] (fixer)
- frames [126.3, 133.7] (fixer)
- frames [126.3, 133.7] (fixer)
- frames [126.2] (lead)
- frames [126.2, 127] (fixer)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b19', 'b20', 'b21', 'b22', 'b23', 'b24', 'b25'] (lead)
- contact_sheet ['b15', 'b16', 'b18'] (lead)
- frames [103.72, 104.23, 111.35, 116.91] (fixer)
- frames [137.96, 146.15] (fixer)
- frames [123.85, 124.4, 133.1, 134.1] (fixer)
- contact_sheet ['b03', 'b04', 'b05', 'b10', 'b14', 'b15', 'b16', 'b18', 'b19'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 0
- engine: 1
