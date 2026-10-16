# Shuttle report: st-bp-cooling

Mode: api; lead: sonnet; written 2026-10-16T16:35:17.

Shuttle: st-bp-cooling  current done
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
      spent: $13.3081, 18311770 tokens, 478 calls; limits {'usd': 30.0}; reopens 0 of 3; for named beats 2 of 8

## Cost (USD at the engine's price table)
- total $13.3081, 18311770 tokens, 478 model calls; cache reads 15143890 of 17999432 input tokens (84 %)
- by phase: - $0.3010 (19), P1 $0.3105 (9), P10 $0.3267 (24), P11 $0.0915 (4), P2 $0.3027 (11), P3 $0.3147 (6), P4 $0.9333 (16), P5 $2.8237 (32), P6 $0.5276 (18), P7 $2.2439 (48), P8 $4.7419 (281), P9 $0.3906 (10)
- by agent: critic $0.2658 (17), lead $7.0937 (134), shuttle-fact-finder $0.1739 (6), shuttle-fixer $0.1746 (23), shuttle-kit-builder $1.8953 (40), shuttle-scene-author $3.6769 (257), skeptic $0.0279 (1)
- models: claude-opus-5-5 x72, claude-sonnet-5-5 x68, gemini-3.8-flash x18, gpt-6.1-sol x320
- sessions (the CLI's own figures; a resumed session's are cumulative): P1-P4 success 31 turns $1.8034 (0 cache misses); P5 success 20 turns $2.4734 (0 cache misses); P6 success 5 turns $0.0781 (0 cache misses); P1-P4 success 5 turns $0.1474 (0 cache misses); P5 success 6 turns $0.2256 (0 cache misses); P6 success 6 turns $0.0581 (0 cache misses); P1-P4 success 5 turns $0.1618 (0 cache misses); P5 success 5 turns $0.2205 (0 cache misses); P6 success 4 turns $0.0534 (0 cache misses); P7 success 12 turns $2.4437 (0 cache misses); P8 success 15 turns $4.8377 (1 cache misses); P9 success 4 turns $0.0371 (0 cache misses); P10 success 13 turns $0.3985 (0 cache misses); P11 success 3 turns $0.0758 (0 cache misses)
- the CLI's own total, each session counted once: $13.0144 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 2 of 8
- 2026-10-16T15:09:38 P4 for b10 by lead: narrate: TTS (kokoro) says "CRAH" as "craw" (ASR heard 'The warm air returns to a craw', 14% word error). Patch b10 narration so it is spoken as letters, e.g. "The warm air returns to a C R A H," keeping "a computer room air handler." on_screen stays "CRAH". (stale P4; voided none)
- 2026-10-16T15:11:33 P4 for b10 by lead: ASR refuses b10.1 even with spelled letters (heard "C-R-H"). Reword so the acronym is not spoken: line 1 "The warm air returns to tall cabinets at the hall's edge," line 2 "called computer room air handlers." On-screen CRAH label unchanged. (stale P4; voided none)

## Delegations
- own-fact-finder-fb00679b fact-finder  collected: 5 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-7b544ae6 kit-builder ['b01', 'b02'] collected: 25 calls, accepted [], refused 0, snapshots 11
- own-kit-builder-bb4a2e0f kit-builder ['b01', 'b02'] collected: 17 calls, accepted ['submit_kit'], refused 0, snapshots 8
- own-scene-author-9d2c3ede scene-author ['b01'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-5080ffcd scene-author ['b02'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-ac3ba8e9 scene-author ['b03'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-6172486a scene-author ['b04'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-08d95b58 scene-author ['b05'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-0c6e5115 scene-author ['b06'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-e4ab51d1 scene-author ['b07'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-78990152 scene-author ['b08'] collected: 20 calls, accepted [], refused 0, snapshots 4
- own-scene-author-96e4a41d scene-author ['b09'] collected: 20 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-192caf18 scene-author ['b10'] collected: 21 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-7226120d scene-author ['b11'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-7535969c scene-author ['b12'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-79e592d0 scene-author ['b13'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-3084e4b1 scene-author ['b08'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-c06f82e3 scene-author ['b14'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-f3113c97 scene-author ['b15'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-527b1b50 scene-author ['b16'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-9d5ab0b3 scene-author ['b17'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-9b1cf507 scene-author ['b18'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-7a7ead2f scene-author ['b19'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-e846adad scene-author ['b20'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-2b3178b0 scene-author ['b21'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-5c1f50cc scene-author ['b22'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-f04e88c9 scene-author ['b23'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-eaed4256 scene-author ['b24'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-889de9da scene-author ['b25'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-f5b90e17 scene-author ['b26'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-1f588ea6 fixer ['b04'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-f08539df fixer ['b21'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-50666d5f fixer ['b24', 'b25'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-48a15345 fixer ['b18', 'b19'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1

## Tool calls (tool, outcome, count)
- accept_phase ok: 3
- animatic ok: 1
- catalog_search ok: 1
- check ok: 2
- choose_persona ok: 1
- collect ok: 7
- contact_sheet ok: 4
- critic_review ok: 2
- delegate ok: 7
- frames ok: 3
- get_api_section error: 1
- get_api_section ok: 73
- get_beat ok: 3
- get_example_scene error: 3
- get_example_scene ok: 18
- get_skill_section ok: 15
- get_source_chunks ok: 1
- get_style_pack ok: 32
- kit_preview error: 3
- kit_preview ok: 19
- lab_snapshot ok: 70
- lesson_status ok: 8
- list_skill_sections ok: 6
- narrate error: 2
- narrate ok: 1
- note ok: 15
- patch_script ok: 2
- patch_script refused: 1
- pilot_check ok: 1
- read_artifact error: 25
- read_artifact ok: 117
- render ok: 1
- reopen ok: 2
- report_finding ok: 29
- request_approval ok: 3
- skeptic_review ok: 1
- submit_brief ok: 4
- submit_kit ok: 1
- submit_knowledge ok: 3
- submit_outline ok: 6
- submit_review ok: 3
- submit_scene ok: 30
- submit_script ok: 3
- submit_storyboard ok: 3
- submit_teaching_plan ok: 3

## Refusals by the rails
- patch_script (lead): P4 (persona and script) is accepted; to change it call reopen('P4', reason), with beats=[...] when the change is limited to some beats (its own cap, no approval voided). Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes

## What the lead looked at
- animatic 3 (lead)
- kit_preview  (lead)
- kit_preview  (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18'] (lead)
- contact_sheet ['b19', 'b20', 'b21', 'b22', 'b23', 'b24', 'b25', 'b26'] (lead)
- contact_sheet ['b06', 'b18', 'b21'] (lead)
- frames [126.3] (fixer)
- frames [177.75] (fixer)
- frames [126.3, 127.5] (lead)

## Hook denials
- none
