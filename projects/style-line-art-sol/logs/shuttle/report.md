# Shuttle report: style-line-art-sol

Mode: api; lead: sonnet; written 2026-10-14T10:37:21.

Shuttle: style-line-art-sol  current done
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
      spent: $2.7360, 5246257 tokens, 197 calls; limits {'usd': 9.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $2.7360, 5246257 tokens, 197 model calls; cache reads 4349298 of 5185290 input tokens (84 %)
- by phase: - $0.1530 (13), P10 $0.2912 (23), P11 $0.1089 (4), P5 $0.0759 (5), P6 $0.0470 (4), P8 $1.8069 (132), P9 $0.2530 (16)
- by agent: critic $0.1466 (12), lead $1.0425 (60), shuttle-fixer $0.2329 (12), shuttle-scene-author $1.3140 (113)
- models: claude-sonnet-5-5 x60, gpt-6.1-sol x125, gemini-3.8-flash x12
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 11 turns $1.6828 (0 cache misses); P9 success 8 turns $0.0992 (0 cache misses); P5-P6 success 10 turns $0.1275 (0 cache misses); P8 success 4 turns $0.0679 (0 cache misses); P9 success 5 turns $0.0454 (0 cache misses); P10 success 12 turns $0.4036 (0 cache misses); P10 success 7 turns $0.0629 (0 cache misses); P11 success 3 turns $0.1001 (1 cache misses)
- the CLI's own total, each session counted once: $2.5894 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T10:09:39 P5 for b02 by lead: check error avatar_props_unknown: b02 props.card is an array of strings; the avatar reads card as an object {title, lines, rule, say}. Patch b02 props to card: {title: 'Everything you handle has a class', lines: ['Public','Internal','Confidential']} (drop the top-level duplicate title only if it clashes), keeping class-colour intent. (stale P5; voided none)

## Delegations
- own-scene-author-31f4cb88 scene-author ['b04'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-745ad79d scene-author ['b05'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-b2780ac7 scene-author ['b01'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-75878721 scene-author ['b03'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-bbc7c930 scene-author ['b06'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-0fcb0b1e scene-author ['b07', 'b08'] collected: 24 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 5
- own-scene-author-1e663387 scene-author ['b09', 'b10'] collected: 15 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-scene-author-0a1d9a6f scene-author ['b11'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-32dcaef1 scene-author ['b12'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-aa411c89 scene-author ['b13'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-b25546fd fixer ['b09', 'b10', 'b06'] collected: 14 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 4

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- catalog_search ok: 1
- check ok: 3
- collect ok: 3
- contact_sheet ok: 6
- critic_review ok: 2
- delegate ok: 3
- delegate refused: 1
- frames ok: 1
- get_api_section ok: 52
- get_beat ok: 4
- get_example_scene error: 2
- get_example_scene ok: 13
- get_skill_section ok: 3
- get_style_pack ok: 12
- lab_snapshot ok: 34
- lesson_status ok: 7
- list_skill_sections ok: 3
- narrate ok: 1
- note ok: 8
- patch_storyboard ok: 1
- pilot_check ok: 1
- read_artifact error: 3
- read_artifact ok: 34
- render ok: 1
- reopen ok: 1
- report_finding ok: 12
- request_approval ok: 2
- submit_review ok: 4
- submit_scene ok: 16

## Refusals by the rails
- delegate (lead): pass either one job (agent, brief, beats) or `jobs`, not both

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b13'] (lead)
- contact_sheet ['b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12'] (lead)
- contact_sheet ['b10', 'b12', 'b06'] (lead)
- frames [46.5, 49.6] (fixer)
- contact_sheet ['b06', 'b10'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- kit: 0
- scene: 0
- engine: 0
