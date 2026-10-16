# Shuttle report: style-story-cartoon-sonnet

Mode: api; lead: sonnet; written 2026-10-14T11:59:11.

Shuttle: style-story-cartoon-sonnet  current done
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
      spent: $9.2009, 11887064 tokens, 318 calls; limits {'usd': 16.0}; reopens 0 of 3; for named beats 7 of 8

## Cost (USD at the engine's price table)
- total $9.2009, 11887064 tokens, 318 model calls; cache reads 9432456 of 11688643 input tokens (81 %)
- by phase: - $0.1544 (13), P10 $0.2931 (21), P11 $0.0422 (4), P5 $0.5210 (22), P6 $0.1603 (12), P8 $7.7924 (230), P9 $0.2374 (16)
- by agent: critic $0.1473 (12), lead $2.1911 (110), shuttle-fixer $1.7656 (56), shuttle-scene-author $5.0969 (140)
- models: claude-sonnet-5-5 x306, gemini-3.8-flash x12
- sessions (the CLI's own figures; a resumed session's are cumulative): P8 success 23 turns $7.3410 (0 cache misses); P9 success 5 turns $0.0926 (0 cache misses); P5-P6 success 20 turns $0.5135 (0 cache misses); P8 success 9 turns $0.2559 (0 cache misses); P5-P6 success 9 turns $0.1482 (0 cache misses); P8 success 8 turns $0.0673 (0 cache misses); P5-P6 success 8 turns $0.0751 (0 cache misses); P8 success 5 turns $0.0418 (0 cache misses); P10 success 12 turns $0.3961 (0 cache misses); P10 success 8 turns $0.0922 (0 cache misses); P11 success 3 turns $0.0299 (0 cache misses)
- the CLI's own total, each session counted once: $9.0536 (the table above prices the same tokens from the engine's table)

## Reopens
- used: 0 of 3; for named beats 7 of 8
- 2026-10-14T11:29:30 P5 for b06, b08, b12 by lead: Check storyboard defects. b06: keep and accent_on name receipt_circle, which b05 never draws (b06 draws receipt_ring); drop receipt_circle from keep and set accent_on to receipt_ring. b08: process.flow token label "Maya's note" overflows its card at the 30px floor; shorten to "Note". b12: avatar card prop must be an object {title, lines, rule, say}, not an array; use card {title:"Know your channels", lines:["Your manager, or another one","HR or compliance","Your speak-up line"]}. (stale P5; voided none)
- 2026-10-14T11:30:14 P5 for b04, b05, b10 by lead: Held gate (held_missing) now refuses keep of kit-made names (room, desk, receipts, phone, laptop, pad, path doors) in b04, b05, b06, b10 because the previous bespoke scene files never draw them (kit parts do); engine finding already filed by b09 author. Drop those names from keep; the beat files are unchanged. (stale P5; voided none)
- 2026-10-14T11:30:44 P5 for b06, b08, b12 by lead: b04, b05, b10 keeps fixed (kit-made names dropped); now b06 keep (same held_missing), plus the b06 accent_on receipt_ring, b08 token label overflow and b12 card shape from the P9 check. (stale P5; voided none)
- 2026-10-14T11:30:53 P5 for b04, b05, b06, b08, b10, b12 by lead: The patch gate validates the whole storyboard, so b04, b05, b06, b10 (held_missing keeps of kit-made names) must be patched together with b08 and b12 in one patch. (stale P5; voided none)
- 2026-10-14T11:38:08 P5 for b05, b06 by lead: continuity_contract: b06 keeps ['receipts'] from b05 and b05's elements list receipt_circle, but b05 (and b04) draw no element of those names: the kit holds the desk set inside glass_carry, and the held gate refuses kit-made names. Patch b05: drop element receipt_circle (the ring dim is dropped; pad_heading carries the accent anyway). Patch b06: keep [maya, magnifier] only (no receipts, no receipt_circle); its own receipt_ring is drawn in the file. (stale P5; voided none)
- 2026-10-14T11:42:31 P5 for b08 by lead: b08 process.flow token label overflows at 30px floor even as "Note"; drop label, keep mail icon (stale P5; voided none)
- 2026-10-14T11:42:40 P5 for b08 by lead: b08 token label still overflows; drop label (stale P5; voided none)

## Delegations
- own-scene-author-a53b05d6 scene-author ['b03'] collected: 23 calls, accepted [], refused 1, snapshots 11
- own-scene-author-1e01aa85 scene-author ['b04'] collected: 21 calls, accepted ['submit_scene'], refused 1, snapshots 9
- own-fixer-8e093c55 fixer ['b03'] collected: 6 calls, accepted ['submit_scene'], refused 0, snapshots 1
- own-scene-author-99bc3db7 scene-author ['b01'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 4
- own-scene-author-36613d5c scene-author ['b02'] collected: 13 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-951ff43c scene-author ['b05'] collected: 11 calls, accepted ['submit_scene'], refused 1, snapshots 5
- own-scene-author-cfe9e468 scene-author ['b06'] collected: 12 calls, accepted ['submit_scene'], refused 0, snapshots 3
- own-scene-author-f9eeff23 scene-author ['b07'] collected: 11 calls, accepted ['submit_scene'], refused 0, snapshots 5
- own-scene-author-fce927a8 scene-author ['b09'] collected: 15 calls, accepted [], refused 0, snapshots 5
- own-scene-author-1439d166 scene-author ['b10'] collected: 23 calls, accepted [], refused 0, snapshots 11
- own-scene-author-a25b42d4 scene-author ['b11'] collected: 15 calls, accepted ['submit_scene'], refused 0, snapshots 6
- own-fixer-88f75416 fixer ['b09', 'b10'] collected: 19 calls, accepted [], refused 0, snapshots 10
- own-fixer-370c4cdf fixer ['b06'] collected: 7 calls, accepted ['submit_scene'], refused 0, snapshots 2
- own-fixer-c3090f0f fixer ['b09', 'b10'] collected: 10 calls, accepted ['submit_scene', 'submit_scene'], refused 0, snapshots 2
- own-fixer-ed0b7bc9 fixer ['b05'] collected: 8 calls, accepted [], refused 1, snapshots 2
- own-fixer-7970e160 fixer ['b06'] collected: 8 calls, accepted ['submit_scene'], refused 1, snapshots 3

## Tool calls (tool, outcome, count)
- accept_phase ok: 4
- accept_phase refused: 1
- animatic ok: 3
- capabilities ok: 2
- check ok: 4
- collect ok: 7
- contact_sheet error: 2
- contact_sheet ok: 7
- critic_review ok: 2
- delegate ok: 7
- frames ok: 1
- get_api_section ok: 35
- get_beat ok: 6
- get_catalog_entry ok: 1
- get_example_scene ok: 10
- lab_snapshot ok: 81
- lab_snapshot refused: 3
- lesson_status ok: 12
- narrate ok: 3
- note ok: 12
- patch_storyboard ok: 6
- patch_storyboard refused: 2
- pilot_check ok: 1
- pilot_check refused: 1
- read_artifact error: 8
- read_artifact ok: 62
- render ok: 1
- reopen ok: 7
- report_finding ok: 7
- request_approval ok: 4
- submit_review ok: 4
- submit_scene ok: 21
- submit_scene refused: 2

## Refusals by the rails
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [24.4, 26.6, 28.4, 31.0, 32.4, 33.2] is too long
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [15.7, 19.9, 21.6, 23.2, 24.1, 24.65] is too long
- pilot_check (lead): the pilot beats need their authors first (scenes/b03.js (not accepted yet)); then pilot_check
- lab_snapshot (scene-author): bad arguments for lab_snapshot: [33.5, 35.2, 37.0, 38.9, 41.6] is too long
- patch_storyboard (lead): P5 is reopened for b06, b08, b12 only; b04, b05, b10 is not among them
- patch_storyboard (lead): P5 is reopened for b04, b05, b10 only; b06, b08, b12 is not among them
- accept_phase (lead): P6 is not accepted: approval: plan (request_approval('plan', ...), then a person approves)
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property
- submit_scene (fixer): bad arguments for submit_scene: 'artifact' is a required property

## What the lead looked at
- frames [73] (fixer)
- animatic 2 (lead)
- animatic 2 (lead)
- animatic 2 (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12'] (lead)
- contact_sheet ['b07', 'b06'] (lead)
- contact_sheet ['b06'] (lead)
- contact_sheet ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09'] (lead)
- contact_sheet ['b10', 'b11', 'b12'] (lead)
- contact_sheet ['b06'] (lead)

## Hook denials
- none

## Defects from the last check, by owner
- script: 0
- storyboard: 1
- kit: 0
- scene: 0
- engine: 0
