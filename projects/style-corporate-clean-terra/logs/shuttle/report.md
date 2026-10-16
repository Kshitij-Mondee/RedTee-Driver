# Shuttle report: style-corporate-clean-terra

Mode: api; lead: sonnet; written 2026-10-14T12:54:48.

Shuttle: style-corporate-clean-terra  current done
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
      spent: $5.1274, 7980700 tokens, 234 calls; limits {'usd': 10.0}; reopens 0 of 3; for named beats 0 of 8

## Cost (USD at the engine's price table)
- total $5.1274, 7980700 tokens, 234 model calls; cache reads 6598215 of 7855977 input tokens (84 %)
- by phase: - $0.1590 (13), P10 $0.3987 (24), P11 $0.0392 (5), P8 $3.7204 (153), P9 $0.8101 (39)
- by agent: critic $0.1515 (12), lead $1.0909 (54), shuttle-fixer $1.0871 (53), shuttle-scene-author $2.7980 (115)
- models: claude-sonnet-5-5 x54, gpt-5.6-terra x168, gemini-3.8-flash x12
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 17 turns $3.9796 (1 cache misses); P9 success 11 turns $0.4285 (0 cache misses); P10 success 15 turns $0.4785 (0 cache misses); P10 success 7 turns $0.0570 (0 cache misses); P11 success 4 turns $0.0323 (0 cache misses)
- the CLI's own total, each session counted once: $4.9759 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 0 of 8
- none

## Delegations
- own-scene-author-a758ee9b scene-author ['b02'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-272c518d scene-author ['b03'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-771e73e4 fixer ['b02', 'b03'] collected: 14 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2
- own-scene-author-1216c8ff scene-author ['b04'] collected: 8 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-84ef1c7d scene-author ['b05'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-b7cf9522 scene-author ['b06'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-b32bd8b7 scene-author ['b07'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-1937a0cc scene-author ['b08'] collected: 24 calls, accepted ['submit_scene'], refused 0, snapshots 9
- own-scene-author-0dc000cc scene-author ['b09'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-e6b8e209 scene-author ['b10'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-01bc0d45 scene-author ['b11'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-52df9b37 scene-author ['b12'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-741fd411 scene-author ['b13'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-5b90bec0 fixer ['b03', 'b05', 'b06', 'b07', 'b08'] collected: 19 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-fixer-136037a9 fixer ['b12'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-fe5408ae fixer ['b04', 'b05', 'b06'] collected: 0 calls, accepted [], refused 0, snapshots 0
- own-fixer-c8687370 fixer ['b04', 'b05', 'b06'] collected: 8 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 4
- own-fixer-7d9fd768 fixer ['b06', 'b07'] collected: 8 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-04c28dcc fixer ['b05', 'b06', 'b07', 'b08'] collected: 17 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 7

## Tool calls (tool, outcome, count)
- check ok: 6
- collect ok: 8
- contact_sheet ok: 8
- critic_review ok: 2
- delegate ok: 8
- delegate refused: 1
- frames ok: 1
- get_api_section error: 2
- get_api_section ok: 56
- get_example_scene error: 3
- get_example_scene ok: 12
- get_style_pack ok: 12
- lab_snapshot error: 2
- lab_snapshot ok: 60
- lesson_status ok: 3
- note ok: 4
- pilot_check ok: 2
- read_artifact error: 4
- read_artifact ok: 59
- render ok: 1
- report_finding ok: 2
- request_approval ok: 1
- submit_review ok: 4
- submit_scene ok: 27

## Refusals by the rails
- delegate (lead): scenes/b04.js is owned by the open token own-fixer-fe5408ae (fixer): collect it first (one writer per file)

## What the lead looked at
- contact_sheet ['b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14'] (lead)
- contact_sheet ['b05', 'b06', 'b07'] (lead)
- contact_sheet ['b05', 'b06', 'b07'] (lead)
- contact_sheet ['b08'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11'] (lead)
- frames [17.33] (lead)

## Hook denials
- mcp__loom__submit_scene (shuttle-fixer): submit_scene: pass your owner token as `owner` (the brief from the lead names it)
- mcp__loom__submit_scene (shuttle-fixer): submit_scene: pass your owner token as `owner` (the brief from the lead names it)
- mcp__loom__submit_scene (shuttle-fixer): submit_scene: pass your owner token as `owner` (the brief from the lead names it)
- mcp__loom__submit_scene (shuttle-fixer): submit_scene: pass your owner token as `owner` (the brief from the lead names it)
- mcp__loom__submit_scene (shuttle-fixer): submit_scene: pass your owner token as `owner` (the brief from the lead names it)

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 1
- engine: 0
