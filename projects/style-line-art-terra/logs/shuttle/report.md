# Shuttle report: style-line-art-terra

Mode: api; lead: sonnet; written 2026-10-14T10:38:01.

Shuttle: style-line-art-terra  current done
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
      spent: $3.1411, 4642177 tokens, 199 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 1 of 8

## Cost (USD at the engine's price table)
- total $3.1411, 4642177 tokens, 199 model calls; cache reads 3836378 of 4550360 input tokens (84 %)
- by phase: - $0.1241 (8), P10 $0.2713 (26), P11 $0.0389 (4), P5 $0.0575 (3), P6 $0.0938 (5), P8 $2.1123 (124), P9 $0.4432 (29)
- by agent: critic $0.1176 (7), lead $1.0738 (66), shuttle-fixer $0.5075 (40), shuttle-scene-author $1.4422 (86)
- models: claude-sonnet-5-5 x66, gpt-5.6-terra x126, gemini-3.8-flash x7
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 13 turns $1.8963 (1 cache misses); P9 success 15 turns $0.3675 (0 cache misses); P5-P6 success 9 turns $0.1625 (0 cache misses); P8 success 3 turns $0.0219 (0 cache misses); P9 success 4 turns $0.0274 (0 cache misses); P10 success 12 turns $0.4506 (0 cache misses); P10 success 7 turns $0.0676 (0 cache misses); P11 success 3 turns $0.0298 (0 cache misses)
- the CLI's own total, each session counted once: $3.0235 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 1 of 8
- 2026-10-14T10:14:42 P5 for b02 by lead: check avatar_props_unknown: b02 props.card is a list but the avatar reads card as an object {title, lines, rule, say}. Patch b02 props to card: {lines: ["Public","Internal","Confidential"]} (keep title; optionally say). No other change. (stale P5; voided none)

## Delegations
- own-scene-author-0f9ba9dd scene-author ['b04'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-fccb2b2b scene-author ['b05'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-5c0ca4bf fixer ['b04', 'b05'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-18c303eb scene-author ['b01', 'b13'] collected: 13 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2
- own-scene-author-885560ff scene-author ['b03'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-118ac40c scene-author ['b06'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-0a5f7c1f scene-author ['b07'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-f02bd123 scene-author ['b08'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-5dfdbf66 scene-author ['b09'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-5c42ab3b scene-author ['b10'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-3f84d9a7 scene-author ['b11'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-b95c970b scene-author ['b12'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-a224467f fixer ['b03'] collected: 3 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-391ab581 fixer ['b07', 'b08'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-b2b8088b fixer ['b09', 'b10'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-89585ec4 fixer ['b08'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-2cae8a01 fixer ['b05'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-3e88889f fixer ['b12'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 3

## Tool calls (tool, outcome, count)
- accept_phase ok: 1
- animatic ok: 1
- capabilities ok: 2
- catalog_search ok: 1
- check ok: 4
- collect ok: 5
- contact_sheet ok: 6
- critic_review ok: 2
- delegate ok: 5
- get_api_section error: 2
- get_api_section ok: 52
- get_beat ok: 1
- get_catalog_entry error: 1
- get_example_scene error: 1
- get_example_scene ok: 9
- get_skill_section ok: 2
- get_source_chunks ok: 1
- get_style_pack ok: 11
- lab_snapshot ok: 35
- lesson_status ok: 7
- narrate ok: 1
- note ok: 8
- patch_storyboard ok: 1
- pilot_check ok: 2
- read_artifact error: 2
- read_artifact ok: 43
- render ok: 1
- reopen ok: 1
- report_finding ok: 2
- request_approval ok: 2
- submit_review ok: 4
- submit_scene ok: 20

## Refusals by the rails
- none

## What the lead looked at
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13'] (lead)
- contact_sheet ['b08', 'b12', 'b05'] (lead)
- contact_sheet ['b05', 'b08', 'b12'] (lead)
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
