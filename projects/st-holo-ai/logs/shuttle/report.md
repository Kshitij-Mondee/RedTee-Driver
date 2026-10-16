# Shuttle report: st-holo-ai

Mode: api; lead: sonnet; written 2026-10-16T16:35:18.

Shuttle: st-holo-ai  current done
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
      spent: $9.7933, 15503628 tokens, 415 calls; limits {'usd': 30.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $9.7933, 15503628 tokens, 415 model calls; cache reads 13350483 of 15270725 input tokens (87 %)
- by phase: - $0.2089 (13), P1 $0.3277 (10), P10 $0.5462 (37), P11 $0.1303 (4), P2 $0.2278 (9), P3 $0.3271 (7), P4 $0.5780 (6), P5 $2.0912 (22), P6 $0.3249 (9), P7 $0.5103 (16), P8 $4.2932 (274), P9 $0.2279 (8)
- by agent: critic $0.1557 (11), lead $5.3731 (108), shuttle-fact-finder $0.0867 (4), shuttle-fixer $0.5286 (47), shuttle-kit-builder $0.3056 (13), shuttle-scene-author $3.2981 (231), skeptic $0.0455 (1)
- models: claude-opus-5-5 x52, claude-sonnet-5-5 x60, gemini-3.8-flash x12, gpt-6.1-sol x291
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 31 turns $1.6213 (0 cache misses); P5 success 21 turns $2.1383 (0 cache misses); P6 success 8 turns $0.1271 (1 cache misses); P7 success 7 turns $0.5964 (0 cache misses); P8 success 13 turns $3.8577 (1 cache misses); P9 success 8 turns $0.1384 (0 cache misses); P10 success 17 turns $1.0006 (1 cache misses); P11 success 3 turns $0.1123 (1 cache misses)
- the CLI's own total, each session counted once: $9.5922 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-fact-finder-c46f6e9f fact-finder  collected: 3 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-ca71bf5a kit-builder ['b01', 'b02', 'b03', 'b06', 'b07', 'b09', 'b14', 'b15', 'b16', 'b17', 'b21', 'b22'] collected: 16 calls, accepted ['submit_kit'], refused 0, snapshots 4
- own-scene-author-6eb645ba scene-author ['b01'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-c43e8832 scene-author ['b02'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-ccf5c903 scene-author ['b03'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-4122fa0c scene-author ['b04'] collected: 24 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-scene-author-349ad0d7 scene-author ['b05'] collected: 24 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-79eace21 scene-author ['b06'] collected: 25 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-5a3222cb scene-author ['b07'] collected: 27 calls, accepted [], refused 0, snapshots 5
- own-scene-author-8563e154 scene-author ['b09'] collected: 30 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-27659110 scene-author ['b10'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-6a7e2a34 scene-author ['b11'] collected: 23 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-90ab09e9 scene-author ['b13'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-0225c963 scene-author ['b14'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-314dcac1 scene-author ['b15'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-0b1a084e scene-author ['b16'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-a6c49ff9 scene-author ['b17'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-de49da1d scene-author ['b21'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-988a80ab scene-author ['b22'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-61563df9 scene-author ['b07'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-19253c3d fixer ['b05', 'b06'] collected: 15 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-ef7f56d7 fixer ['b07'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-b085fe46 fixer ['b11'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-86386803 fixer ['b13', 'b14'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 7

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- catalog_search ok: 1
- check ok: 2
- choose_persona ok: 1
- collect ok: 6
- contact_sheet ok: 10
- critic_review ok: 2
- delegate ok: 6
- frames ok: 2
- get_api_section error: 6
- get_api_section ok: 86
- get_beat ok: 7
- get_catalog_entry ok: 6
- get_example_scene ok: 22
- get_skill_section ok: 16
- get_source_chunks ok: 1
- get_style_pack ok: 22
- kit_preview ok: 4
- lab_snapshot ok: 73
- lesson_status ok: 4
- list_skill_sections ok: 6
- narrate ok: 1
- note ok: 9
- pilot_check ok: 1
- read_artifact error: 33
- read_artifact ok: 102
- render ok: 1
- report_finding ok: 33
- request_approval ok: 3
- skeptic_review ok: 1
- strips ok: 1
- submit_brief ok: 3
- submit_kit ok: 2
- submit_knowledge ok: 1
- submit_outline ok: 4
- submit_review ok: 3
- submit_scene ok: 23
- submit_script ok: 2
- submit_storyboard ok: 2
- submit_teaching_plan ok: 2

## Refusals by the rails
- none

## What the lead looked at
- animatic 3 (lead)
- kit_preview  (lead)
- contact_sheet ['b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b11', 'b13', 'b14'] (lead)
- contact_sheet ['b10', 'b11', 'b14'] (lead)
- frames [83, 86.5, 111, 115.5] (lead)
- strips b10-b11 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b19', 'b20', 'b21', 'b22'] (lead)
- contact_sheet ['b07', 'b11', 'b12'] (lead)
- frames [58.6, 87] (lead)
- contact_sheet ['b04', 'b05', 'b06'] (lead)
- contact_sheet ['b13', 'b14', 'b15'] (lead)
- contact_sheet ['b12', 'b18', 'b22'] (lead)
- contact_sheet ['b05', 'b06', 'b07', 'b11', 'b14'] (lead)

## Hook denials
- none
