# RUN_LOG: https-private-shuttle-api (Shuttle on the real API, sonnet-only), 2026-10-12

Written by the session that runs it as operator. Kshitij: "I want you to run a shuttle pipeline on real api as well to see if
our estimated cost for api was on point. Do it on https. Again, don't let it touch any already made video or script before
it makes everything on it's own from scratch. Use opus 5.5 for storyboarding. Sonnet for everything else."
Operator rule: no edits or context mid-run; a fault that would cost the run a lot of time or money is fixed and logged
(`py -m loom note`) as an intervention.

## Setup

- The request of `https-private` word for word (topic "How HTTPS keeps your data private", corporate employees, teaching,
  2 minutes, persona analyst, corporate-clean, no presenter, mix cinema, the same notes), `--isolated`: its design seed
  reads no other lesson and the style library (assets/kept, D-163) is neither read nor fed. A new folder; no earlier
  lesson's plan, script, scenes or film is read. Differences at creation from https-private-v2's request: the voice speed
  (1.0; P6 calibrates it) and `mix_as` (set during a run).
- Models: `--preset sonnet-only`: Sonnet 5.5 leads every phase, Opus 5.5 leads P5 (outline and storyboard) only; every
  sub-agent Sonnet 5.5. The skeptic (P2) and the critic (P10) stay Gemini 3.8 Flash, as in every Shuttle run so far and in
  the estimate this run checks (another model family checks the facts and the pictures; about $0.2 a run).
- Mode: `--mode api` (the ANTHROPIC_API_KEY from .env: real billed calls), `--budget 30` (USD, real), unattended approvals
  in Kshitij's name.
- What it checks: the estimate is https-private-v2's notional cost on the subscription, $16.50 at list price (R-50,
  `docs/research/2026-10-10-https-private-v2-comparison.md`), same preset and request. The engine has changed since (Loom's
  checker at draw time, L-409 to L-412, D-160 joins, D-163), so the two differ in engine as well as in billing.
- Engine change for this run (D-164): `loom/shuttle/config.json` `lead.storyboard.api` and `loom/shuttle/launch.py` let a preset
  give P5 Opus on the API path, no other phase (Shuttle refused Opus there, D-119). Relay was told first; at its request
  this run launches after Relay's measured run `https-private-relay` ends, so neither run's wall time is inflated.
- Launch at 15:09, after Relay's measured run ended (its session confirmed; its end fingerprint showed only D-164's two
  Shuttle files changed). Engine fingerprinted at launch (`logs/engine_fingerprint_at_launch.json`, 223 files). Free check
  first: `agents doctor` found the Anthropic key and its models. The full suite was not rerun after D-164; the 45 Shuttle
  tests passed after it, and Relay's session ran the full suite before its launch (engine unchanged since but for D-164).
- Command: `py -m loom shuttle run https-private-shuttle-api --mode api --preset sonnet-only --budget 30 --approve-as
  "agent, unattended per Kshitij (https-private on Shuttle via API, 2026-10-12)"`. State at start: mode api, preset
  sonnet-only, leads P1-P4 Sonnet, P5 Opus, P6 to P11 Sonnet.

## Result

- **Exit 0 at 17:40, every phase accepted, no reopen, no operator intervention.** Film `renders/https-private-shuttle-api.mp4`,
  2:03. Engine unchanged during the run (`logs/engine_fingerprint_at_end.json`).
- **Cost: $21.80 billed on the API** (the engine's figure: the API's reported tokens at the price table; the invoice itself is
  not seen here), 152 min, 848 calls, 39.1 M tokens in (92 to 96 % cached), 666 k out. The estimate, https-private-v2 on the
  subscription at list price: $16.50, 71 min (`docs/research/2026-10-12-https-private-shuttle-api-comparison.md`).
- **The price table holds:** phases with like work cost alike (P1 to P4 $0.55 against $0.46, P6 $0.73 against $0.77, P8's
  sub-agents $7.75 against $7.86). The $5.30 over the estimate is what this run did, not the billing: P8's lead $3.86 against
  $0.74 (502 calls against 255, 259 looks against 79, 125 min against 36) and P9 $4.83 against $1.27 (20 checks against 5).
- **Why P8 cost more:** 64 of 259 looks were refused, "read your whole brief before you write: part 2 of 2 not read yet":
  the scene and fixer briefs are about 57 k characters, so two parts, and authors take part 1 for the whole (L-420).
- **Why P9 cost more:** 20 checks (each about 62 s, offline, no model call). The first check had 10 errors (6 words_cut, 3
  content_overlap, 1 foreign_pixels); from 16:45 only b17's foreign_pixels remained, owner "engine" (for a person). The lead
  sent b17 to a fixer about 16 times, and also after passing checks at 17:04, 17:11, 17:19 and 17:23 (chasing warnings), each
  edit breaking or mending it again (L-421). Not a flaky check: the final build probed 0 px three times out of three.
- **Briefs:** fixer briefs 51 k to 105 k characters for a one-beat fix (kit source 30,113 each, twice in a two-beat brief;
  the whole film about 11 k); the beat's own spec, defect and file about 5 to 7 k (L-422).
- **The film, looked at (20 frames, within corporate-clean):** one world (the browser, the watcher, the server) through six
  sections; certificate, shared key, scrambled data, the check with three choices, the habit (read the domain). No stacked
  duplicate boards (Relay's fault, L-417 to L-419 and the held-part fix). Seen: camera push-ins crop text at the frame edge
  ("e42", "ounts.example") and the last section's "Scramble" tag is cut at the right edge. Not listened to; one run.
