# Shuttle report: feedback-shuttle-v3

Mode: subscription; lead: opus; written 2026-10-09T21:02:28.

Shuttle: feedback-shuttle-v3  current done
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
      spent: $41.5822 (notional), 46799826 tokens, 838 calls; limits {'usd': 150.0}; reopens 0 of 3; for named beats 3 of 8

## Cost (USD at the engine's price table; notional in subscription mode)
- total $41.5822, 46799826 tokens, 838 model calls; cache reads 41333629 of 45550470 input tokens (91 %)
- by phase: - $0.2950 (15), P1 $0.4345 (11), P10 $6.2355 (116), P11 $0.4427 (6), P2 $0.4204 (11), P3 $0.7169 (12), P4 $0.6896 (14), P5 $5.9866 (44), P6 $2.3422 (31), P7 $1.1431 (27), P8 $14.4459 (436), P9 $8.4298 (115)
- by agent: critic $0.1560 (10), lead $21.4643 (360), shuttle-fact-finder $0.1047 (3), shuttle-fixer $8.5061 (249), shuttle-kit-builder $3.2506 (20), shuttle-scene-author $8.0834 (195), skeptic $0.0171 (1)
- models: claude-opus-5-5 x279, claude-sonnet-5-5 x569, gemini-3.8-flash x11
- sessions (the CLI's own figures; a resumed session's are cumulative): P1 success 20 turns $0.5239 (0 cache misses); P2 success 11 turns $0.5150 (1 cache misses); P3 success 20 turns $0.6566 (0 cache misses); P4 success 22 turns $0.9212 (0 cache misses); P5 success 43 turns $2.4738 (0 cache misses); P6 success 10 turns $0.3348 (0 cache misses); P7 success 11 turns $8.0912 (1 cache misses); P8 success 35 turns $15.6010 (1 cache misses); P9 success 14 turns $2.5092 (1 cache misses); P10 success 43 turns $8.3455 (2 cache misses); P5 success 10 turns $0.4440 (0 cache misses); P6 success 9 turns $0.3592 (0 cache misses); P8 success 14 turns $1.0236 (0 cache misses); P9 success 13 turns $0.6302 (0 cache misses); P10 success 27 turns $1.7477 (0 cache misses); P5 success 9 turns $0.2781 (0 cache misses); P6 success 8 turns $0.2323 (0 cache misses); P8 success 11 turns $1.0779 (0 cache misses); P9 success 6 turns $0.1897 (0 cache misses); P10 success 25 turns $3.0539 (0 cache misses); P5 success 8 turns $0.2749 (0 cache misses); P6 success 8 turns $0.2673 (0 cache misses); P8 success 11 turns $0.5487 (0 cache misses); P10 success 71 turns $5.8091 (1 cache misses); P10 success 11 turns $0.3633 (0 cache misses); P11 success 8 turns $0.4056 (0 cache misses)
- the CLI's own total, each session counted once: $56.6776 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 3 of 8
- 2026-10-09T19:03:59 P5 for b08, b09, b10 by lead: Engine name collision: a new element named 'card' in b07 (room station, after a camera join) draws the old b01/b04 vague bubble over the message card (critic blocker on b07). b07 is now accepted with its card named 'card_b07' and b08 holds 'card_b07'. The storyboard's continuity still says b08, b09, b10 hold 'card', so the check fails with held_missing on b08 and b09. Patch the held, travelling and incoming lists of b08, b09 and b10 to use 'card_b07' in place of 'card'. The beats' intent, text and timing do not change. (stale P5; voided none)
- 2026-10-09T19:24:38 P5 for b08, b09, b10 by lead: b07's element names collided with kept room elements from earlier beats (the vague bubble drew over the message card: the critic's b07 blocker). b07 now uses unique names set7, clock7, asha7, ben7, card7 and renders correctly. b08, b09, b10 must hold those names: in keep, continuity.held and continuity.retiring, replace set->set7, clock->clock7, asha->asha7, ben->ben7, card_b07->card7. Nothing else changes. (stale P5; voided none)
- 2026-10-09T19:43:45 P5 for b07 by lead: Critic blocker on b07 is still real in the compose: the vague bubble 'Maybe tighten it up?' covers the whole beat. b07.js already uses unique element names (set7, clock7, asha7, ben7, card7) and contains no 'vague' state in the last test, yet the lab still shows the bubble: b07's storyboard continuity.incoming still lists set, clock, asha, ben, card, which resolve to the earlier room beats' elements (b01's vague bubble 'card'). Patch b07 continuity.incoming (and design.elements names) to set7, clock7, asha7, ben7, card7, the same pattern that fixed b08 to b10. (stale P5; voided none)

## Delegations
- own-fact-finder-decdf17a fact-finder  collected: 4 calls, accepted ['submit_knowledge'], refused 0, snapshots 0
- own-kit-builder-47223a67 kit-builder ['b01', 'b02', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] collected: 36 calls, accepted ['submit_kit'], refused 0, snapshots 7
- own-scene-author-60fb1598 scene-author ['b01'] collected: 22 calls, accepted ['submit_scene'], refused 0, snapshots 7
- own-scene-author-5908a700 scene-author ['b02'] collected: 32 calls, accepted ['submit_scene'], refused 0, snapshots 9
- own-scene-author-16d204db scene-author ['b04'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-a6426d9b scene-author ['b05'] collected: 25 calls, accepted [], refused 0, snapshots 14
- own-scene-author-347e255b scene-author ['b06'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-62b8aa78 scene-author ['b07'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-ee38fe73 scene-author ['b08'] collected: 16 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-scene-author-55b3a24e scene-author ['b09'] collected: 24 calls, accepted [], refused 0, snapshots 11
- own-scene-author-c6e784cf scene-author ['b10'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-b23124b2 scene-author ['b11'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-dcdae82d scene-author ['b12'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-scene-author-ec325c1a scene-author ['b13'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 7
- own-scene-author-ab79f95e scene-author ['b14'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-scene-author-ce02b6fa scene-author ['b15'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-b1aa1f66 scene-author ['b16'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-scene-author-3e0cb8a6 scene-author ['b05'] collected: 10 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-cb0649c4 scene-author ['b09'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-fixer-d0c89c5f fixer ['b11', 'b12'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-41fec45e fixer ['b14', 'b15'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-fixer-78847790 fixer ['b13'] collected: 14 calls, accepted ['submit_scene'], refused 0, snapshots 8
- own-fixer-924c4621 fixer ['b07', 'b08'] collected: 21 calls, accepted [], refused 0, snapshots 7
- own-fixer-78c23b9f fixer ['b05'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-d087efa0 fixer ['b13'] collected: 17 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-fixer-8149668b fixer ['b01'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-f90bb162 fixer ['b16'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-79e22b52 fixer ['b07', 'b08'] collected: 16 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-4a3d6f13 fixer ['b01', 'b04', 'b07', 'b08'] collected: 28 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 6
- own-fixer-681d9823 fixer ['b07', 'b08'] collected: 19 calls, accepted [], refused 0, snapshots 7
- own-fixer-c8bec98a fixer ['b07', 'b08'] collected: 19 calls, accepted [], refused 0, snapshots 8
- own-scene-author-add4ed20 scene-author ['b07'] collected: 4 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-ba0fae42 fixer ['b08', 'b09', 'b10'] collected: 17 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 0, snapshots 3
- own-fixer-3d1e8043 fixer ['b05'] collected: 9 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-0352aa8c fixer ['b07'] collected: 18 calls, accepted ['submit_scene'], refused 0, snapshots 11
- own-fixer-87aa14bd fixer ['b08', 'b09', 'b10'] collected: 17 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 1, snapshots 4
- own-fixer-aab93ad3 fixer ['b07'] collected: 19 calls, accepted [], refused 0, snapshots 5
- own-fixer-a2233439 fixer ['b07'] collected: 17 calls, accepted [], refused 0, snapshots 8
- own-fixer-bd989cb9 fixer ['b07'] revoked: 3 calls, accepted [], refused 0, snapshots 1
- own-fixer-56d88a1d fixer ['b07'] collected: 5 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-fixer-48f89ad9 fixer ['b07'] collected: 4 calls, accepted ['submit_scene'], refused 1, snapshots 2
- own-fixer-05e6c3d2 fixer ['b07', 'b08', 'b09'] collected: 17 calls, accepted ['submit_scene', 'submit_scene'], refused 3, snapshots 7
- own-fixer-bde6ccae fixer ['b07', 'b10'] collected: 7 calls, accepted ['submit_scene'], refused 1, snapshots 3
- own-fixer-5fcea48b fixer ['b08', 'b09', 'b10'] collected: 15 calls, accepted ['submit_scene', 'submit_scene', 'submit_scene'], refused 3, snapshots 6
- own-fixer-488b41ed fixer ['b08', 'b09'] collected: 9 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2

## Tool calls (tool, outcome, count)
- accept_phase ok: 3
- animatic ok: 4
- capabilities ok: 3
- check ok: 11
- choose_persona ok: 1
- collect ok: 24
- contact_sheet ok: 26
- critic_review ok: 3
- delegate ok: 25
- delegate refused: 1
- frames ok: 3
- get_api_section error: 1
- get_api_section ok: 86
- get_beat ok: 47
- get_catalog_entry error: 2
- get_catalog_entry ok: 2
- get_example_scene error: 2
- get_example_scene ok: 13
- get_skill_section error: 1
- get_skill_section ok: 36
- get_style_pack ok: 7
- kit_preview ok: 7
- lab_snapshot ok: 197
- lab_snapshot refused: 9
- lesson_status ok: 46
- list_skill_sections ok: 10
- narrate ok: 4
- note ok: 34
- patch_storyboard ok: 3
- pilot_check ok: 1
- read_artifact error: 19
- read_artifact ok: 267
- render ok: 1
- reopen ok: 3
- report_finding ok: 5
- request_approval ok: 6
- skeptic_review ok: 1
- strips ok: 1
- submit_brief ok: 2
- submit_kit ok: 1
- submit_knowledge ok: 1
- submit_outline ok: 2
- submit_review ok: 2
- submit_scene ok: 48
- submit_script ok: 1
- submit_storyboard ok: 2
- submit_teaching_plan ok: 2

## Refusals by the rails
- lab_snapshot (fixer): read your whole brief before you write: parts 2, 3 of 3 not read yet (read_artifact('brief:own-fixer-87aa14bd#2', owner) then read_artifact('brief:own-fixer-87aa14bd#3', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 1 of 1 not read yet (read_artifact('brief:own-fixer-48f89ad9', owner))
- delegate (lead): scenes/b07.js is owned by the open token own-fixer-48f89ad9 (fixer): collect it first (one writer per file)
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2, 3 of 3 not read yet (read_artifact('brief:own-fixer-05e6c3d2', owner) then read_artifact('brief:own-fixer-05e6c3d2#2', owner) then read_artifact('brief:own-fixer-05e6c3d2#3', owner))
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2, 3 of 3 not read yet (read_artifact('brief:own-fixer-05e6c3d2', owner) then read_artifact('brief:own-fixer-05e6c3d2#2', owner) then read_artifact('brief:own-fixer-05e6c3d2#3', owner))
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2, 3 of 3 not read yet (read_artifact('brief:own-fixer-05e6c3d2', owner) then read_artifact('brief:own-fixer-05e6c3d2#2', owner) then read_artifact('brief:own-fixer-05e6c3d2#3', owner))
- lab_snapshot (fixer): read your whole brief before you write: part 2 of 2 not read yet (read_artifact('brief:own-fixer-bde6ccae#2', owner))
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2, 3 of 3 not read yet (read_artifact('brief:own-fixer-5fcea48b', owner) then read_artifact('brief:own-fixer-5fcea48b#2', owner) then read_artifact('brief:own-fixer-5fcea48b#3', owner))
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2, 3 of 3 not read yet (read_artifact('brief:own-fixer-5fcea48b', owner) then read_artifact('brief:own-fixer-5fcea48b#2', owner) then read_artifact('brief:own-fixer-5fcea48b#3', owner))
- lab_snapshot (fixer): read your whole brief before you write: parts 1, 2, 3 of 3 not read yet (read_artifact('brief:own-fixer-5fcea48b', owner) then read_artifact('brief:own-fixer-5fcea48b#2', owner) then read_artifact('brief:own-fixer-5fcea48b#3', owner))

## What the lead looked at
- animatic 2 (lead)
- kit_preview  (lead)
- contact_sheet ['b11', 'b12', 'b15'] (lead)
- contact_sheet ['b15'] (fixer)
- contact_sheet ['b11', 'b14', 'b13'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- frames [38.7, 46.5, 111.05, 111.4] (lead)
- contact_sheet ['b06', 'b13', 'b15'] (lead)
- contact_sheet ['b13'] (fixer)
- contact_sheet ['b01', 'b02'] (fixer)
- contact_sheet ['b04', 'b08', 'b09'] (fixer)
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- contact_sheet ['b07'] (lead)
- contact_sheet ['b07', 'b08'] (lead)
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- contact_sheet ['b07', 'b08'] (lead)
- contact_sheet ['b07'] (fixer)
- contact_sheet ['b07'] (lead)
- animatic 2 (lead)
- contact_sheet ['b07'] (lead)
- contact_sheet ['b07'] (lead)
- contact_sheet ['b01', 'b02', 'b04', 'b05', 'b06', 'b08'] (lead)
- frames [46.5, 54.5] (lead)
- strips b06-b08 (lead)
- contact_sheet ['b07'] (fixer)
- contact_sheet ['b02', 'b04', 'b07', 'b08', 'b09', 'b10'] (lead)
- contact_sheet ['b01', 'b03', 'b05', 'b08', 'b11', 'b12', 'b13', 'b14', 'b15'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12', 'b13', 'b14', 'b15', 'b16'] (lead)
- frames [6, 42, 80, 138] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 0
- kit: 0
- scene: 0
- engine: 2
