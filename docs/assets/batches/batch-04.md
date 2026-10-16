# Batch 04: Families B and C, operations and AI (the P1 items)

Made in a Claude Code on the web session on 2026-10-16. Inputs:
- the hand-off sheet (`docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`, sections 0 to 6, Family B and Family C);
- the cloud route (`docs/assets/HANDOFF_CLOUD_START.md`): batch 04 is "the P1 items of families B and C".

The friend's file also recorded the batch 03 quality pass; here that part is in batch-03.md.

## Part 1: batch 04

| id | file | what it is |
|---|---|---|
| T-019 | `ops_cluster_map.js` | a container cluster: nodes as panels with CPU and memory bars, pods as tiles named by service, their state by tone AND outline (running solid, pending dashed, failed crossed, terminating faded), an optional control plane |
| T-020 | `ops_rollout.js` | a deployment rollout, canary, blue-green or rolling: a router, the old and new instances, traffic as a stream of dots, the split as a percentage named by its version, an instance that turns unhealthy, a rollback |
| T-023 | `ops_metric_tile.js` | a monitoring tile: the metric's name, its value large with its unit, a sparkline, dashed warning and critical lines labelled with their values, the state shown three ways (tone, icon, edge bar) |
| T-024 | `ops_alert_card.js` | an alert or page: a severity badge, a title up to three lines, the service and the time, a pile of earlier alerts behind it; it is acked, resolved or escalated |
| T-025 | `ops_incident_timeline.js` | an incident on a time axis: phases as bands, events as pins whose labels hang on their stems like flags, long quiet gaps drawn as a break, brackets for time to detect and time to resolve |
| T-026 | `ops_slo_budget.js` | an SLO and its error budget: the target and window, the budget bar left and used, the burn rate, a release freeze |
| T-030 | `ops_cloud_architecture.js` | a provider-neutral architecture: nested frames (cloud, region, zone, network, subnet) each with its line style and name, service nodes, links routed as elbows or bows, an outage, a request flowing along its links |
| T-035 | `ai_context_window.js` | a model's context window as a budget: segments in distinct tones, narrow ones labelled on leaders, the total against the limit, overflow hatched past the end, truncation sliding the oldest out |
| T-036 | `ai_token_distribution.js` | next-token probabilities: the context in mono with a caret, candidate tokens as bars with percentages, a temperature dial, a top-p cut with its value on a tag, the sampled token |
| T-037 | `ai_llm_console.js` | an LLM conversation as a developer sees it: role chips, system and user text in mono, the answer streaming, tool calls with their results, token use and the stop reason, redaction |
| T-045 | `ai_guardrails.js` | a guardrail pipeline: the input, input checks as gates, the model, output checks, the response; each gate passes, flags or blocks, and a blocked request turns back with its reason |
| shared | `_dev_kit.js` | the shared helpers from batch 03, extended (decision 2) |

Each has its fixture in `runtime/components/fixtures/<id>.json` (3 cases with different content, one at the maximum
the params allow) and its sheet in `library/sheets/<id>.jpg`.

The state functions each item returns, each also scriptable as a `steps` entry (ops_rollout: `script`, because its
`steps` is content), so the fixtures prove them:

| id | state functions |
|---|---|
| `ops_cluster_map` | `schedule(podSpec, nodeId, t)`, `fail(nodeId, t)`, `reschedule(map, t)`, `scale(svc, n, t)`, `state(podId, state, t)` |
| `ops_rollout` | `step(i, t)`, `health(i, state, t)`, `rollback(t)` |
| `ops_metric_tile` | `push(v, t)`, `state(s, t)` |
| `ops_alert_card` | `ack(t)`, `resolve(t)`, `escalate(t)` |
| `ops_incident_timeline` | `play(t, dur)`, `focus(i, t)` |
| `ops_slo_budget` | `burn(used, t, dur)`, `freeze(t)` |
| `ops_cloud_architecture` | `reveal(order, t)`, `outage(frameId, t)`, `flow(path, t)` |
| `ai_context_window` | `add(seg, t)`, `overflow(t)`, `truncate(n, t)`, `resize(i, tokens, t)` |
| `ai_token_distribution` | `setTemperature(v, t)`, `setTopP(v, t)`, `sample(i, t)` |
| `ai_llm_console` | `stream(i, t)`, `add(turn, t)`, `focus(i, t)`, `redact(i, spans, t)` |
| `ai_guardrails` | `run(t)`, `block(gateIndex, reason, t)` |

### Gate results

`python3 -m loom library accept <id>`, final runs after the last change to each file (exit 0 for each; the sheet paths are
shortened from absolute):

```
component ops_cluster_map (commissioned): accepted; sheet library/sheets/ops_cluster_map.jpg
component ops_rollout (commissioned): accepted; sheet library/sheets/ops_rollout.jpg
component ops_metric_tile (commissioned): accepted; sheet library/sheets/ops_metric_tile.jpg
component ops_alert_card (commissioned): accepted; sheet library/sheets/ops_alert_card.jpg
component ops_incident_timeline (commissioned): accepted; sheet library/sheets/ops_incident_timeline.jpg
component ops_slo_budget (commissioned): accepted; sheet library/sheets/ops_slo_budget.jpg
component ops_cloud_architecture (commissioned): accepted; sheet library/sheets/ops_cloud_architecture.jpg
component ai_context_window (commissioned): accepted; sheet library/sheets/ai_context_window.jpg
component ai_token_distribution (commissioned): accepted; sheet library/sheets/ai_token_distribution.jpg
component ai_llm_console (commissioned): accepted; sheet library/sheets/ai_llm_console.jpg
component ai_guardrails: accepted; sheet library/sheets/ai_guardrails.jpg
```

Every case rendered in each item's styles (9, or 10 for the timeline and the cluster map) with 0 runtime errors, 0
console errors and 0 sample-text leaks.

The check gate (`check_component`) was also run on all 28 components on this branch, after the kit's layout and text
changes (the one kit change after it, the still-word pace, runs only inside the whiteboard and blueprint engines, which
the sheet does not load; the 18 accepts and the labs above ran after it): the
11 above, batch 03's 7 and batches 01 and 02's 10 app shells (`app_email`, `app_chat_workspace`, `app_calendar`,
`app_docs_editor`, `app_lms_course`, `app_hris`, `app_cloud_console`, `app_analytics`, `app_project_board`,
`app_ide_workspace`). All 28 PASS with 0 errors. The warnings left are named under "Left open".

### The engine paths (proved outside the sheet)

The sheet loads no style engine, so each item's three cases were rendered through `python3 -m loom lab` in its engine
styles (screencast for the screens, whiteboard and blueprint for all): a scratch scene that bundles `_app_kit.js`,
`_dev_kit.js` and the component, then `ctx.use`s the fixture (`at` set to 0.6 where the case was still). Not committed.

- 147 strips for batches 03 and 04 together (18 items x 3 cases, in each item's engine styles): 0 errors.
- Re-run after the last changes (the still-word pace, the fixture ceilings): the items they touched, 0 errors.
- Warnings left, all on the maximum or densest cases, each the item saying what it did:
  - `sc_term_wide`, `sc_code_wide`, `dev_diff_comment_long` (batch 03, as before);
  - `dev_incident_crowded`: the 14-event timeline (see "Left open");
  - `dev_ctx_crowded`: the 9-segment context window in whiteboard and blueprint, where the hand's lettering is
    wider; the labels that find no clear row keep their leader behind a label rather than through a word;
  - `dev_engine_box` (info): a long event label and the guardrails' long request are lettered on two lines;
  - `wb_text_floor` on "Grounding" in the guardrails' 9-box case in whiteboard: the hand letters it at its smallest
    size in a 120 px gate. In the strip it reads whole inside the gate.
- Found by the labs and fixed: `wb_window_tight` / `bp_window_tight` (short words in a still were written at 0.03 s a
  letter, just under the engines' window; now 0.045 s, at least 0.3 s), `dev_arch_tall` and `dev_cluster_full` (the
  maximum fixtures' height ceilings were raised; both frames hug their content, so the ceiling only allows room).

What I looked at in the strips: the hand draws each frame, card, gate and node outline, then writes every word of a
diagram (pod names travel with their pods; the split figure is rewritten at each step); the pen drafts and letters
in blueprint; in screencast the screens are the app frame with the kit's content inside.

### What I looked at

Every row of every sheet, then each case of each item at full size in six styles (corporate-clean, presenter-pop,
dark-technical, whiteboard, blueprint, and screencast or line-art), 960 px a tile. I checked:
- words whole, inside their boxes, never cut while there is room;
- no line, stem or leader through a word, a node or a disc;
- nothing drawn that no param supplied, and nothing left empty that should say something;
- frames that hug their content rather than floating in empty space;
- dark packs and light packs, and the hand and pen of whiteboard and blueprint.

Fixed after looking, though the gates had passed:
- **metric tile:** the dashed thresholds said nothing about which limit they were. They now carry their values in
  their tones in a gutter at the right. A long name wraps to two lines, and when the state word would cut it, the
  word moves down to the value's row;
- **alert card:** a long title lost its consequence at two lines; titles now take up to three. The service and the
  time wrap to two lines when they do not fit side by side (the time had been cut);
- **incident timeline:** stems ran through other events' labels, and in blueprint the dense case climbed out of its
  frame. Labels now hang right of their stem (left near the right edge), and each takes the lowest row where no stem
  crosses it and its own stem crosses no label below. Placed from the right so close events climb as a staircase, with
  a look-ahead so a left-hung label never traps the pins under it. Rows are as tall as their own labels;
- **cluster map:** the frame kept its full `h` whatever the content, three nodes floating in twice their height. The
  frame now hugs its grid (`h` is a ceiling), with size() and build() sharing one layout (`DK.clusterLayout`);
- **rollout:** blueprint's pen cut "traffic router" to "traffic..."; the router's name wraps to two lines. The split
  figure ("0%") did not say of what; the new version's name is now under it, in its tone;
- **cloud architecture**, rebuilt in its layout and routing:
  - frames split a fixed `h` by weight, so zones were twice the height of their nodes. Every frame is now as tall as
    its content, siblings side by side share the tallest, and the whole hugs it (`DK.archLayout`);
  - the load balancer's lines cut diagonally through zone names. Links between rows are now elbows with round corners,
    running in a gap left above the frame they enter, so every fan-out reads as a tidy tree;
  - nodes inside a frame take the slot nearest the nodes they link to elsewhere (two passes of the barycentre rule), so
    "primary database" and "standby database" sit side by side and their replication link is short and straight;
  - a bowed link went through a node when it ran right to left (the bend's sign flipped). The bow now picks the side
    that crosses fewer names, and is only as deep as it must be to clear the nodes in its way;
  - a link's label pill is placed along its link where no other link, node, node label or frame name is;
  - frame names sit on a plate of their own fill above the links, so a link passes behind a name, never through it;
  - "web application firewall" was cut at 170 px; a row of nodes above frames now has up to 260 px a label;
- **context window:** a centred label was struck through by its neighbour's leader ("Sy|stem prompt"). Labels now
  hang on their leaders like flags, placed by the same rule as the timeline's;
- **token distribution:** the top-p value was squeezed onto the last kept row's track. It is now on a tag on the cut
  line, and moves with it;
- **LLM console:** a short chat left half the window empty (the fixtures now give `rows` to fit); a scrolled view could
  land with a chip's top cut by the edge, or with an orphan line of a turn whose chip had scrolled away. The scroll now
  lands on a turn's top when one is within three rows, else on a line's top, 10 px clear of the edge;
- **guardrails:** check names were cut ("Allowed topics for customer...") and blueprint cut the request. Gates, the
  model and the cards now grow to the lines their words need (a check up to five lines, the model three, a card nine).
  A blocked request's outcome showed nowhere: it now appears as the request turns back.

### Decisions (made without asking, as the brief says)

1. **Styles (D-193).** The items that are product screens (metric tile, alert card, SLO budget, LLM console) are made
   for the nine screen and technical styles as batch 03's screens (screencast, corporate-clean, engineering, line-art,
   editorial-paper, presenter-pop, dark-technical, whiteboard, blueprint). The incident timeline and the cluster map
   are shown both as screens and as diagrams, so they add chalk-lab. The pure explainers (rollout, cloud
   architecture, context window, token distribution, guardrails) are not screens, so they drop screencast and add
   chalk-lab. None is made for hologram, isometric, glow-flat, flat-cosmos, story-cartoon or the cinematic styles: each
   of those shows the subject its own way, as separate items (D-122, D-193).
2. **The shared helper grew** rather than a new one: `_dev_kit.js` now also has `DK.warnTok` (the pack's warning
   tone: the token whose hue is nearest amber, `accent4` in screencast), `DK.tones` (distinct series tones),
   `DK.para` (a clamped paragraph drawn line by line, so an ellipsised last line never re-wraps), and the shared
   layouts each item hangs on it (`alertLayout`, `sloLayout`, `incidentLayout`, `clusterLayout`, `rolloutLayout`,
   `archLayout`, `ctxLayout`, `tokLayout`, `guardLayout`, `consoleFootH`), so size() and build() never disagree.
   `_app_kit.js` is untouched, and the 10 app shells pass with the changed kit.
3. **State never by hue alone.** Every state also has a shape or a word: the tile's icon and edge bar, the pod's
   outline, the instance's cross, the gate's icon and optional word (`labels`), the overflow's hatch.
4. **Numbers are the scene's.** The token distribution reshapes the given probabilities by temperature
   deterministically (p^(1/T), normalised); nothing is sampled at random, and `sample(i)` names the row. The rollout's
   dots are a pure function of time (a hash, not `Math.random`).
5. **Words that are not param strings become one**, as in batch 03: product words come from label params (`labels`,
   `stateLabels`, `countLabel` with `{n}`), tool arguments and results are strings, and the generated words are only
   numbers.
6. **Generic products only.** Services, versions, regions, companies and people are invented; the cloud architecture
   uses Lucide icons and neutral names (no provider's icons or names), and its fixture says "provider neutral". Two
   search tags that named products were made generic ("container platform", "virtual network"), and batch 03's
   HTTP fixture organisation became "harbour-logistics-europe".
7. **Families and names** follow section 5: `family: "ops"` and `family: "ai"`, ids `ops_<name>` and `ai_<name>`,
   `commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-<n>)"`, 10 tags each.
8. **Branches.** The session works on `claude/sharp-johnson-q7yt5b` and the brief asks for `assets/batch-NN`. Batch 04
   is pushed to `assets/batch-04` and to the session's branch. The batch 03 quality pass is its own commit, also pushed
   to `assets/batch-03` so that branch carries the fixed items.

### Left open

1. **Dense incident timelines.** In the 14-event case, two or three events (the cluster in the first ten minutes) find
   no row that keeps every stem clear within seven rows. Their stem then breaks where it passes behind a label (it never
   crosses a word), and `dev_incident_crowded` says which. A wider `w` or a `breakAfter` that compresses the quiet
   stretch removes it.
2. **Engine pace.** As in batch 03, the whiteboard hand and the blueprint pen write every word of a diagram before its
   motion; the cloud architecture's maximum case takes several seconds of lettering.
3. **Width factors** for the hand and the pen (x1.6 to x1.75 whiteboard, x1.35 to x1.4 blueprint) are measured on the
   fixtures, not derived from the engines' fonts.
4. **Generated files are left out of the commit**, as before: `runtime/catalog.*`, `runtime/capabilities.*`,
   `library/decisions.json` and the untracked `library/scenes/` folders were rebuilt by the gates and restored.
5. **Not in this batch:** the P2 and P3 items of families B and C (T-021, T-022, T-027 to T-029, T-031 to T-034,
   T-038 to T-044, T-046), by the cloud plan's order.
