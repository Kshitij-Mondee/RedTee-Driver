# Topic asset needs: what seven upcoming topic areas must show, and what to build for it

STATUS: RESEARCH 2026-10-08. A brainstorm and build list, not shipped work. Nothing here is built yet. Read with
`docs/TOOLBOX.md` (the five tools), `runtime/capabilities.md` (everything else) and the `@model` cards in
`assets/models3d/*.js` (22 models today: bar_chart, building, clock, cloud, coin_stack, credit_card, desk_set, document,
envelope, folder, gear, globe, id_badge, key, laptop, lightbulb, monitor, padlock, phone, security_key, server_rack,
shield). Checked by listing that folder on 2026-10-08.

Rules every item below obeys (they come from the engine's laws, restated so a builder does not have to look them up):

- **Words come from the lesson.** Every label, chunk name, token, red flag, bin name or value is passed in from the
  narration or the knowledge sheet. No asset carries default sample text that could reach a real slide.
- **No invented numbers.** Where a recipe needs proportions (a split, a probability, a pass rate) they are inputs; if the
  lesson has none, the beat says "imagine" or "say" and the picture is visibly illustrative.
- **No people as models** (they come from character kits), **no brands or real product designs** (generic only).
- **Colours are roles, never hex.** Models take `casing`, `trim`, `ok`, `bad`, `accent` and so on from the style.
- **Determinism.** A frame is a pure function of t; physics is baked once from a seed.

Asset type legend used throughout: **(a)** 3D model, **(b)** 3D set, **(c)** physics recipe, **(d)** brush recipe,
**(e)** orb recipe, **(f)** already covered (the existing capability is named), **(g)** mood preset for 3D shots.

What already covers a lot, so it is not proposed again: `Loom.ui.mail / inbox / chat / doc` (real email and chat
artefacts), `ui.window, field, button, cursor, m.typeInto` (product in use), `Loom.magnify` (lens on a detail),
`Loom.data.*` (unitGrid, barsOn, dipLine, pile), `clip_manim` (exact maths and plots), `clip_skia` (light and blur),
`ctx.iso` (isometric systems), `Loom.place.server` (a 2D machine room), templates (`cycle`, `process.flow`,
`compare.two`, `list.steps`, `scenario.dialogue`, `document.page`), library forms (`verdict_stamp`,
`strike_out_stroke`, `press_button`, `outcome_tick`), world packs `tech_cyber`, `office`, `contact_centre`.

---

## 1. AI for developers

| # | teaching moment (one line) | best carrier |
|---|---|---|
| 1 | The assistant suggests code inside the editor and the developer accepts or edits it | (f) `monitor`/`laptop` screen spec `code` plus (e) orb `composing`; needs the new screen spec `diff` (see 6.4) |
| 2 | An agent works in a loop: plan, call a tool, read the result, decide again | (e) `agent_tool_loop` |
| 3 | An app talks to a model through an API: request out, response back, with a key | (f) `ui.wire` or `hero.hub` blueprint; `key` model for the API key beat |
| 4 | A prompt lives in code as a template with slots filled at run time | (f) screen spec `code`, slots highlighted with `m.highlight` |
| 5 | Evals: a fixed set of cases is run on every change and sorted into pass and fail | (c) `sort_into_bins` (eval variant) |
| 6 | RAG in an app: the question finds the closest chunks, which are put into the prompt | (a) `chunk_cabinet` plus (a) `embedding_space` |
| 7 | CI/CD with AI: each change travels through build, tests, AI review, scan and a human gate | (b) `ci_conveyor` |
| 8 | Code review: a reviewer (human or AI) marks the risky lines of a diff | (d) `review_markup` over screen spec `diff` |
| 9 | Prompt injection: text inside a document tries to give the agent new orders | (e) `injection_trap` |
| 10 | Least privilege for agents: only the tools the task needs, and a human approves the irreversible | (a) `agent_sandbox` |

Accuracy notes for this topic: prompt injection comes in a direct form (typed by the user) and an indirect form (hidden
in content the model reads); model output must be treated as untrusted input before it is run or rendered; "excessive
agency" means more permissions, functions or autonomy than the task needs, and the mitigation is least privilege plus
approval for irreversible actions (OWASP Top 10 for LLM Applications, via the summaries cited in Sources). Numbering
differs between the 2023 and 2025 OWASP lists, so a lesson must name the edition it cites.

## 2. Machine learning fundamentals

| # | teaching moment | best carrier |
|---|---|---|
| 1 | Data is a pile of examples, each with features and a label | (f) `Loom.data.unitGrid` for the pile, `ui.build` table for one example |
| 2 | A feature is one measurable column the model can use | (f) `Loom.magnify` on one column of the table |
| 3 | Split before training: train, validation, and a test set that is locked away until the end | (c) `train_test_split` |
| 4 | Training is a loop: predict, measure the error, adjust, repeat | (f) template `cycle`; the adjust step can cut to (a) `loss_landscape` |
| 5 | Loss is a landscape and gradient descent walks downhill in steps | (a) `loss_landscape` |
| 6 | The learning rate: too large overshoots and bounces, too small crawls | (a) `loss_landscape` key `lr` (opts) |
| 7 | Overfitting: the curve threads every training point and misses new ones; training loss falls while validation loss rises | (f) `clip_manim` for the curve fit, `Loom.data.dipLine` pair for the two loss curves |
| 8 | A network is layers of weighted connections that light up as an input passes through | (a) `neural_lattice` |
| 9 | Metrics: a confusion matrix, and the precision versus recall trade-off as the threshold moves | (f) `unitGrid` for the matrix; (a) `balance_scale` for the trade-off beat |
| 10 | The model lifecycle: train, evaluate, deploy, monitor, retrain when the data drifts | (b) `ci_conveyor` (MLOps variant) plus (f) `dipLine` for drift |

Accuracy notes: gradient descent steps against the gradient; a too-large learning rate overshoots the minimum and can
oscillate or diverge, a too-small one is slow (several course sources, cited). Overfitting shows as training loss
falling while validation loss rises after some point (Google ML Crash Course, cited). A real loss surface has as many
dimensions as the model has weights, so any 3D surface is a two-weight slice, and the caption must say so. Keep the
test set out of every training and tuning step (leakage is the error to show).

## 3. Data centres

| # | teaching moment | best carrier |
|---|---|---|
| 1 | What a data hall is: rows of racks, overhead cable trays, cooling along the walls | (b) `dc_hall` |
| 2 | Inside a rack: servers in units, a switch near the top, two power strips at the back, blanking panels in the gaps | (a) `server_rack` v2 plus (a) `tor_switch`, `rack_pdu` |
| 3 | An 8-accelerator AI server: what is inside the box and how it is cooled | (a) `gpu_server` |
| 4 | Why accelerators: one chip with many small cores and fast memory stacked beside it | (a) `accelerator_chip` |
| 5 | Networking: servers to the rack switch, rack switches to the spine | (a) `tor_switch` for the object, (f) `ctx.iso` boxes and arrows for the topology |
| 6 | Hot and cold aisles: fronts face the cold aisle, exhaust leaves the back, containment stops the mixing | (b) `dc_aisle_pair` |
| 7 | Liquid cooling: a coolant loop from the CDU to cold plates on the chips, heat handed to facility water | (a) `cdu` plus (a) `accelerator_chip` key `plate` |
| 8 | Power and redundancy: utility, UPS, generator, A and B paths to dual power supplies | (b) `power_path` plus (c) `redundancy_topple` |
| 9 | PUE: all the energy entering the site divided by the energy the IT equipment uses | (c) `pue_pour` |
| 10 | Physical security: fence, lobby, mantrap, hall, cage, locked rack | (b) `dc_security_layers` plus (a) `badge_door` |

Accuracy notes for this topic are in the model and set cards (section 8 and 9) because each one has its own traps.

## 4. Generative AI

| # | teaching moment | best carrier |
|---|---|---|
| 1 | Text becomes tokens: words split into pieces, often sub-word pieces | (f) `Loom.slot` swap of the sentence into token chips; the split must come from a real tokenizer run, never guessed |
| 2 | Embeddings: each token or chunk becomes a point, and similar meanings sit close together | (a) `embedding_space` |
| 3 | Attention: each token looks back at earlier tokens and weighs them | (f) kit `path` arcs with weighted thickness over token chips; (a) `transformer_stack` for where it sits |
| 4 | A model is a stack of repeated blocks that turns tokens into a next-token prediction | (a) `transformer_stack` |
| 5 | The context window holds a fixed number of tokens, input and output together | (c) `context_window_tray` |
| 6 | Sampling and temperature: the model picks the next token from a probability spread | (c) `next_token_draw` plus (f) `Loom.data.barsOn` for the spread |
| 7 | Diffusion: an image is made by removing noise step by step, guided by the prompt | (f) `clip_skia` (noise field resolving, see 14.1) |
| 8 | RAG: retrieve the closest chunks, then answer from them with citations | (a) `chunk_cabinet` plus (e) `retrieval_answer` |
| 9 | Fine-tuning changes the weights with examples; RAG changes what the model is shown | (a) `neural_lattice` key `tune` versus `chunk_cabinet`, side by side (f) `compare.two` |
| 10 | Hallucination and guardrails: fluent but wrong, and filters before and after the model | (e) `assistant_unsure` plus (c) `defence_layers_sieve` (guardrail variant) |

Accuracy notes: in a decoder-only language model (the common chat model) a token attends only to itself and earlier
tokens (a causal mask); the weights in one row sum to one after softmax; several heads run in parallel with different
patterns (attention explainers cited). Query, key and value are learned projections of each token; the score is a dot
product of a query with each key. Embeddings live in hundreds or thousands of dimensions, so a 3D cloud is a projection
and the caption says so; analogy offsets (the "king and queen" kind) are a tendency that emerges from training, not a
law. Temperature rescales the spread: low sharpens it towards the top choice, high flattens it; it does not add
knowledge. Diffusion training adds noise to real images and teaches a network to predict that noise; generation starts
from fresh noise and removes it step by step; it does not collage stored pictures (diffusion explainers cited).
What happens when a context window is exceeded depends on the app (truncation, refusal or summarising), so a lesson
states its own app's behaviour.

## 5. AI for non-technical staff

| # | teaching moment | best carrier |
|---|---|---|
| 1 | What an assistant is good at, and where it is unreliable | (e) `assistant_can_cant` plus (f) `compare.two` |
| 2 | A good prompt: role, task, context, format | (f) `Loom.ui.chat` with (d) `underline_wash` behind the one part being taught |
| 3 | Check the output: it can sound sure and still be wrong | (e) `assistant_unsure` plus (f) `Loom.magnify` and `verdict_stamp` |
| 4 | Data privacy: what never goes into a prompt | (c) `sort_into_bins` (privacy variant) |
| 5 | Acceptable use: the policy says what tools and what data are allowed | (f) `document` model with `stamp`, or `document.page` template |
| 6 | Bias: a skewed sample in gives a skewed answer out | (c) `biased_funnel` plus (a) `balance_scale` |
| 7 | A human stays responsible: the assistant drafts, a person approves | (e) `human_approval` |
| 8 | Where the assistant's answer comes from (training versus your documents) | (a) `chunk_cabinet` (the documents) with (e) orb `searching` |

Accuracy notes: keep the orb to an assistant actually working (TOOLBOX rule); do not anthropomorphise beyond the named
states; "it can be wrong while sounding sure" is the core message of checking, and the lesson's policy, not the
asset, says what data is restricted.

## 6. Emails

| # | teaching moment | best carrier |
|---|---|---|
| 1 | Anatomy of a good email: clear subject, the ask up front, one topic, a clear close | (f) `Loom.ui.mail` with (d) `review_markup` marks |
| 2 | Subject lines that get read, in a crowded inbox | (f) `Loom.ui.inbox` with `m.highlight` |
| 3 | Templates save time for repeat messages | (f) `document.page` template and `Loom.slot` to swap the filled fields |
| 4 | Reply-all: one reply becomes many, and the inbox overflows | (c) `inbox_flood` |
| 5 | Tone and etiquette: the same words read differently | (f) `scenario.dialogue` or `compare.two` |
| 6 | Phishing red flags: urgency, requests for data or money, odd sender, mismatched or shortened links | (d) `red_flag_circles` over (f) `Loom.ui.mail` |
| 7 | Hover before you click: the shown link and the real destination differ | (f) `cursor` hover plus the new screen spec `link_hover` (6.4) on `laptop` |
| 8 | Attachments: an unexpected file is a risk; check before opening | (a) `envelope` extension key `attachment` |
| 9 | Spam filters and layered defence: most is stopped, some gets through, so reporting matters | (c) `defence_layers_sieve` |
| 10 | Report, do not just delete: the report button and a second channel to verify | (f) `press_button` form plus `phone` screen `notification` |

Accuracy notes: CISA's listed signs are urgent or emotionally appealing language, requests for personal or financial
information, untrusted shortened URLs, and incorrect email addresses or links; CISA adds that perfect grammar no longer
means safe because of AI. NCSC stresses layered defences (filtering, reporting, device protection, response), a
no-blame reporting culture, and verifying requests through a second channel. The NCSC page's case study numbers
(emails filtered, reached, reported, clicked) may be used only when the lesson cites that case study by name.

### 6.4 Screen spec extensions (shared by topics 1, 4, 5, 6)

The phone, laptop, monitor and desk_set models already take screen specs. Four new kinds would serve these topics
without any new model: `diff {title, lines: [[sign, text]]}` (added and removed lines), `terminal {lines}` (a command
and its output, including a test run with tick or cross per line), `link_hover {text, shown, real}` (an anchor and the
tooltip showing the true address), `prompt {blocks: [[role, text]]}` (system, user and context blocks of a prompt).
All words from params, as today.

## 7. General corporate learning

| # | teaching moment | best carrier |
|---|---|---|
| 1 | Day one: your badge, your laptop, your desk, the building | (f) `id_badge`, `laptop`, `desk_set`, `building` models; `isometric_office` example |
| 2 | Access and tailgating: one badge, one person through the door | (a) `badge_door` |
| 3 | Clear desk and screen lock | (f) `desk_set` key `chair` with screen spec `lock` |
| 4 | Disposing of records safely | (a) `shredder` (low priority; `document` with `stamp` covers most) |
| 5 | Meetings: agenda, time box, owner for each action | (f) `places.meeting`, `clock` model, `owner_chip` form |
| 6 | Feedback that lands: specific, behaviour not person, timely | (d) `review_markup` (margin notes variant) plus (f) `scenario.dialogue` |
| 7 | Compliance: rules weigh risk against convenience | (a) `balance_scale` |
| 8 | Time management: the big priorities go in first or they do not fit | (c) `priority_jar` |
| 9 | Collaboration and handoffs: a missing owner stalls the work | (f) `gear` model key `jam` |
| 10 | Customer service: a queue that grows faster than it is served | (f) physics example `lab_physics.js` (the backlog pile); `contact_centre` world |

---

## 8. New 3D models (a)

Each card is what a builder needs for the `@model` line: id, what, parts, keys (0..1 meaning), accuracy, topics. Every
model also takes `turn` (radians about y), as all current models do. Size estimates are an estimate from the current
library (30 to 74 lines per model, counted with `wc -l` on 2026-10-08).

### 8.1 `gpu_server`
- **What:** a generic 8-accelerator AI server lying flat, lid removable, in air-cooled or liquid-cooled form (`opts.cooling: "air" | "liquid"`).
- **Parts:** chassis, lid, fan_wall, accelerator_tray (8 modules in a 2 x 4 grid), switch_chips (a row of smaller packages on the same board), cpu_board (2 CPU sockets, memory slots), psus, nic_bay, heatsinks (air) or cold_plates + manifold tubes (liquid).
- **Keys:** `lid` 0 on .. 1 lifted away; `explode` 0 assembled .. 1 the tray, CPU board and PSUs separate vertically; `load` 0..1 accelerators glow in the warm role in order; `airflow` 0..1 cool particles enter the front and leave warm at the back; `flow` 0..1 coolant dashes travel cool in, warm out (liquid form); `fail` index of a module that goes to the alert role.
- **Accuracy:** air goes front to back, always; never draw consumer graphics cards with fans and display ports (the most common mistake); the eight modules are identical and sit on one baseboard linked through switch chips (all-to-all), not on separate cards; the air form has tall finned heatsinks and many fans, the liquid form replaces heatsinks with flat cold plates joined by tubes and keeps fewer fans (one vendor's liquid version cut GPU fans from fifteen to five, flopper.io); liquid versions are physically shorter. Generic only: no maker shapes or logos.
- **Topics:** 3, 4, 2 (training compute). **Size:** big (estimate 150 to 200 lines).

### 8.2 `accelerator_chip`
- **What:** one accelerator package close up: a large central die, memory stacks beside it on the same substrate, a board below; optionally a cold plate lowers onto it.
- **Parts:** board, substrate, die, memory_stacks (4 to 8), cores (a grid texture on the die), cold_plate, inlet, outlet.
- **Keys:** `cores` 0..1 the die's core grid lights all at once (parallel; `opts.serial: true` lights one at a time for a CPU contrast); `memory` 0..1 pulses travel between stacks and die; `plate` 0 lifted .. 1 seated; `flow` 0..1 coolant moves inlet to outlet, colour shifting cool to warm; `cutaway` 0..1 the plate shows its inner channels.
- **Accuracy:** memory stacks sit beside the die on the package, not on the far side of the board (general knowledge, unverified this session); heat goes into the plate and leaves in the fluid, so outlet is the warm role; no part numbers.
- **Topics:** 3, 4, 2. **Size:** quick (estimate 80 to 100 lines).

### 8.3 `tor_switch`
- **What:** a 1U network switch: a dense row of port cages on one face with link lights, power supplies and fan modules on the other.
- **Parts:** chassis, ports (24 to 48 cages in two rows), port_leds, uplinks (a few larger cages, accent), psus (2), fans.
- **Keys:** `links` 0..1 port lights come on in order; `traffic` 0..1 a deterministic blink pattern; `uplink` 0..1 the uplink cages glow; `fail` index of a port in the alert role; `airflow` 0..1 arrows show intake and exhaust.
- **Accuracy:** the airflow direction must match the rack: a port-side intake switch takes cool air through the ports, a port-side exhaust switch is the opposite, and the cold aisle must face the intake side (FS community, Arista and Vertiv notes); at the top of a rack the switch risks breathing server exhaust, which is a teachable mistake state; two PSUs, one per power feed.
- **Topics:** 3. **Size:** quick (estimate 60 to 80 lines).

### 8.4 `rack_pdu`
- **What:** a vertical, zero-U power strip that mounts in the back of a rack: a column of outlets, a small meter, an input cord.
- **Parts:** body, outlets, meter, cord, feed_tag (A or B, colour by role).
- **Keys:** `power` 0..1 outlet lights come on top to bottom; `load` 0..1 the meter bar fills; `fail` 0..1 the strip goes dark and its tag turns to the alert role.
- **Accuracy:** used in pairs, A and B, on separate upstream sources, colour-coded so they are not confused; a dual-supply server takes one cord from each; each side must be able to carry the whole load alone (Austin Hughes, Belden notes); no household plugs, no wall sockets.
- **Topics:** 3. **Size:** quick (estimate 50 lines).

### 8.5 `server_rack` v2 (an extension, not a new model)
- **Why:** the current rack is generic (load, alert, slide). Data-centre lessons need it to be correct.
- **New parts:** front_door (perforated), blanking_panels, rear_pdus (two `rack_pdu`), top switch (`tor_switch`), cable bundles at the rear.
- **New keys:** `door` 0 closed .. 1 swung open; `blanking` 0 gaps open .. 1 every empty unit filled; `airflow` 0..1 particles in at the front, out at the back; `recirc` 0..1 the mistake state, hot air curls from the back over the top or through a gap into the front; `feed_b` 0..1 the B side fails and the servers stay lit.
- **Accuracy:** fronts face the cold aisle; exhaust only at the back; blanking panels stop hot air returning through empty units (AKCP, STULZ notes); rear PDUs vertical. Keep existing keys working unchanged.
- **Topics:** 3. **Size:** quick extension (estimate 60 extra lines).

### 8.6 `cdu`
- **What:** a coolant distribution unit: a floor-standing cabinet with a door that opens to show two pumps, a plate heat exchanger, a reservoir, a filter, valves and a control display; four pipe ends on top or the side.
- **Parts:** cabinet, door, pumps (2), heat_exchanger, reservoir, filter, valves, display, pipes_primary (facility supply and return), pipes_secondary (technology loop supply and return).
- **Keys:** `door` 0..1; `primary` 0..1 facility water flows; `secondary` 0..1 coolant flows to and from the racks; `heat` 0..1 the secondary return warms in colour and the heat crosses the exchanger plates into the primary; `pump_swap` 0..1 pump A stops and pump B takes over (redundancy).
- **Accuracy:** two loops that never mix; heat crosses only through the heat exchanger; the secondary loop feeds the rack manifolds and cold plates; parts list (pumps, reservoir, heat exchanger, filter, sensors, valves, controls) from Boyd, Nautilus and Gigabyte glossaries; supply is the cool role and return the warm role everywhere.
- **Topics:** 3. **Size:** big (estimate 120 to 150 lines).

### 8.7 `loss_landscape`
- **What:** a smooth lit surface on a plinth with contour lines projected on the floor, a ball that descends, and a trail of its steps.
- **Parts:** surface, contours, ball, trail, axes (two weight axes and a loss axis, words from params).
- **Keys:** `descend` 0..1 the ball moves along a precomputed path of steps; `lr` set at make (`opts.lr: "small" | "good" | "large"`) chooses a slow crawl, a clean descent or an overshooting zigzag; `minima` set at make (`opts.minima: 1 | 2`) adds a second, shallower valley so a local minimum can be shown; `contours` 0..1 the floor projection draws.
- **Accuracy:** each step goes against the slope and is shorter where the ground flattens (with a fixed rate); the surface is a two-weight slice of a far larger space, so the caption says so; never label the vertical axis "accuracy" (loss is lower when better); the path is computed from the surface's own gradient, not hand-drawn, so it is honest.
- **Topics:** 2, 4. **Size:** quick (estimate 90 lines).

### 8.8 `embedding_space`
- **What:** a 3D point cloud in a faint box with three unlabelled axes; clusters of points with words beside them (from params); arrows between points.
- **Parts:** box, points, cluster_labels, query_point, neighbour_links, offset_arrows.
- **Keys:** `scatter` 0 random .. 1 points settle into clusters; `query` 0..1 a query point arrives and its nearest neighbours light and link (`opts.k`); `offset` 0..1 two parallel arrows draw (the analogy beat); `spin` radians the cloud turns.
- **Accuracy:** closeness means similar meaning; the real space has hundreds or thousands of dimensions, so the picture is a projection and says so; neighbours are chosen by a cosine or distance computed on the shown positions so the lit points are really the nearest; analogy arrows are approximate, never exactly parallel by design. Words for clusters always come from the lesson.
- **Topics:** 4, 1, 5, 2. **Size:** big (estimate 110 to 130 lines).

### 8.9 `chunk_cabinet`
- **What:** an index cabinet of shallow drawers, each a document chunk with a short label (from params); a query card slides in front and the best-matching drawers open.
- **Parts:** cabinet, drawers (6 to 12), labels, query_card, beam.
- **Keys:** `index` 0..1 pages drop in and become drawers (chunking); `query` 0..1 the query card arrives and a beam sweeps; `topk` 0..1 the k chosen drawers slide out in rank order; `hand_off` 0..1 the chosen chunks lift and stack towards the frame edge (into the prompt).
- **Accuracy:** retrieval picks by similarity, not by keyword alone (unless the lesson's system is keyword search); the chunks go into the prompt; the model can still misread them, so a citation beat should follow; drawer count is illustrative.
- **Topics:** 4, 1, 5. **Size:** quick (estimate 80 lines).

### 8.10 `neural_lattice`
- **What:** three to five vertical layers of spheres joined by thin links; activations pulse forward; link thickness shows weight.
- **Parts:** nodes, links, layer_labels.
- **Keys:** `forward` 0..1 a pulse travels input to output and nodes light by activation; `backward` 0..1 a second pulse returns and some links change thickness (learning); `tune` 0..1 only a small marked subset of links changes (fine-tuning or adapters); `spin` radians.
- **Accuracy:** links connect every node in one layer to every node in the next (dense) unless the lesson says otherwise; learning changes link strengths, not the number of nodes; keep it small (a real network is vastly larger, and the caption says the picture is a toy).
- **Topics:** 2, 4. **Size:** quick (estimate 80 lines).

### 8.11 `transformer_stack`
- **What:** a tower of identical blocks; token tiles enter at the bottom, rise through each block, and a probability bar row emerges at the top.
- **Parts:** embed_base, blocks (N, each with an attention slab and a feed-forward slab), residual_rail, output_bars, token_tiles.
- **Keys:** `pass` 0..1 tiles rise block by block; `open` 0..1 one block (`opts.focus`) slides apart to show its two slabs; `predict` 0..1 the output bars grow and the top one lights.
- **Accuracy:** a chat model is decoder-only (no encoder tower) unless the lesson is about the original translation design; every block is the same shape; the output is a spread over the vocabulary, not one word; the attention slab is where tokens look at earlier tokens.
- **Topics:** 4. **Size:** quick to medium (estimate 100 lines).

### 8.12 `agent_sandbox`
- **What:** a glass room on a plinth with a softly lit core inside (a stand-in for the agent, not the 2D orb) and a wall of tool sockets; only some sockets hold plugs; a gate on the front with a status light.
- **Parts:** walls, core, sockets, plugs (tools, labels from params), gate, gate_light.
- **Keys:** `plug` 0..1 the allowed tools plug in one by one; `reach` 0..1 a beam from the core tries an unplugged socket and bounces off; `approve` 0..1 the gate light goes to the ok role and the gate opens (a human approved); `seal` 0..1 the walls frost (isolation).
- **Accuracy:** expresses least privilege and approval for irreversible actions (OWASP excessive agency); no robot shapes.
- **Topics:** 1, 5. **Size:** quick (estimate 80 lines).

### 8.13 `badge_door`
- **What:** a security door in a frame with a badge reader beside it; the reader light changes; the door swings.
- **Parts:** frame, door, reader, reader_light, floor_line (the one-person zone).
- **Keys:** `tap` 0..1 the reader light goes to ok (opts.status ok or bad); `open` 0..1 the door swings; `tailgate` 0..1 a second shadow crosses the floor line and the reader turns to the alert role; `interlock` set at make (`opts.pair: true`) builds two doors in series for a mantrap, and the second will not open while the first is open.
- **Accuracy:** a mantrap is two interlocking doors that admit one authenticated person at a time (Exin study guide summary); people are not modelled (the tailgater is a shadow or a character from a kit composited in).
- **Topics:** 7, 3, infosec lessons. **Size:** quick (estimate 70 lines).

### 8.14 `balance_scale`
- **What:** a two-pan beam balance on a pillar; items (simple blocks with labels from params) land in the pans.
- **Parts:** base, pillar, beam, pans, items.
- **Keys:** `load_left` and `load_right` 0..1 items drop in; `tilt` -1..1 the beam settles to the given side (driven by the caller, never by a hidden rule); `level` 0..1 the beam returns to level.
- **Accuracy:** the tilt is the caller's statement, so a lesson cannot accidentally "weigh" two things without saying which is heavier; avoid courtroom symbols unless the lesson is legal.
- **Topics:** 5 (bias), 2 (precision and recall), 7 (compliance). **Size:** quick (estimate 55 lines).

### 8.15 `envelope` extension: key `attachment`
- A paper clip and a file tag (name from params) come out with the letter; `reveal` 0..1 the tag turns to show its real type in the alert role (the disguised attachment beat). Topics: 6. Quick (estimate 25 extra lines).

### 8.16 `shredder` (low priority)
- **What:** an office shredder bin with a slot; a document feeds in and strips fall into the bin. **Keys:** `feed` 0..1, `fill` 0..1. **Accuracy:** cross-cut strips for sensitive records if the lesson's policy says so. Topics: 7. Quick (estimate 45 lines).

### 8.17 `ups_cabinet` and `generator_set` (parts of `power_path`, promoted only if a second lesson needs them alone)
- `ups_cabinet`: a row cabinet with battery shelves behind a door; keys `charge` 0..1, `discharge` 0..1 (battery bridges the gap), `door`.
- `generator_set`: a containerised generator with an exhaust stack and fuel tank base; keys `start` 0..1 (exhaust puffs, panel light), `run` 0..1.
- **Accuracy:** the UPS carries the load instantly while the generator starts; the generator is outdoors or in its own room; no brand shapes.

---

## 9. New 3D sets (b)

### 9.1 `dc_aisle_pair` (the most important data-centre set)
- **What:** two rows of racks (`server_rack` v2) facing each other across a cold aisle, with hot aisles behind; cooling units at the row ends; cable trays overhead.
- **Parts:** rows (2 x 4 to 6 racks), floor (raised with perforated tiles, or slab), tiles, cooling_units, containment (doors and roof panels), cable_trays, return_path.
- **Keys:** `airflow` 0..1 cool particles rise from the tiles (or fall from overhead), pass through the racks front to back, leave warm and travel back to the cooling units; `containment` 0..1 doors and roof panels slide in; `mode` set at make (`"hot" | "cold"` containment); `mixing` 0..1 the mistake: no blanking, hot air spills over the rack tops and round the row ends into the fronts; `thermal` 0..1 the whole set recolours to a cool-to-warm temperature view.
- **Accuracy:** rack fronts face each other across the cold aisle and backs face the hot aisle; perforated tiles only in the cold aisle, never in the hot aisle; return air goes back to the cooling unit; containment closes the top and row ends of one aisle (STULZ best-practice document, NSF paper, CAC patents cited); `opts.supply: "floor" | "overhead" | "wall"` because many modern halls have no raised floor; hot exhaust never reaches a front except in the `mixing` state.
- **Topics:** 3. **Size:** big (estimate 200 lines, reusing rack v2).

### 9.2 `dc_hall`
- **What:** a wide data hall for an establishing shot or a fly-through: several rows, overhead busway and trays, cooling units and CDUs on the wall, lights.
- **Keys:** `lights` 0..1 rows light in order; `focus` index of a row that stays bright while the rest dim; `dolly` 0..1 the camera travels down the cold aisle.
- **Accuracy:** same aisle rules as 9.1; keep it sparse so it reads as a place, not a texture. **Topics:** 3, 4. **Size:** big (estimate 150 lines, instanced racks).

### 9.3 `dc_security_layers`
- **What:** an isometric cutaway of concentric layers: perimeter fence and gate, building shell and lobby, mantrap (`badge_door` pair), data hall, a caged area, a locked rack.
- **Keys:** `path` 0..1 a marker travels from the gate inwards; `layer` index lit in turn; `breach` 0..1 one layer fails and the next one holds (defence in depth).
- **Accuracy:** layers run outside in (perimeter, site, building, room, cage, rack) with independent controls, so defeating one leaves the others (Exin, datacate, StarHub, CoreSite summaries); access is logged at every layer; no real operator's layout.
- **Topics:** 3, 7. **Size:** big (estimate 150 lines; `light: "iso"`).

### 9.4 `power_path`
- **What:** an isometric chain: utility feed, transformer, switchgear with a transfer switch, `ups_cabinet` and batteries, `generator_set`, two separate paths A and B to `rack_pdu` pairs and a dual-supply server.
- **Keys:** `flow` 0..1 energy pulses travel the paths; `utility_fail` 0..1 the feed goes dark, the UPS carries, the generator starts and takes over; `path_fail` "a" | "b" one path goes dark and the server stays lit.
- **Accuracy:** the two paths stay separate end to end (that is what 2N means); a UPS bridges the seconds the generator needs; do not show one PDU feeding both supplies. **Topics:** 3. **Size:** big (estimate 180 lines).

### 9.5 `dc_campus`
- **What:** an exterior diorama: the hall building, a fenced perimeter with a gatehouse, generators in a yard, heat rejection units on the roof, a substation.
- **Keys:** `highlight` one of "power", "cooling", "security" draws its path; `night` 0..1 lights on.
- **Accuracy:** heat leaves the site through roof or yard units; fuel stored near generators. **Topics:** 3. **Size:** big (estimate 150 lines). Lower priority than 9.1 to 9.4.

### 9.6 `ci_conveyor`
- **What:** a conveyor running through a row of stations with gates; each change is a crate (label from params); stations carry labels from the lesson (build, tests, AI review, security scan, human approval, deploy).
- **Keys:** `run` 0..1 crates travel; `gate_i` per station pass (ok light, gate lifts) or fail; `reject` 0..1 a side arm pushes a failing crate onto a return chute; `approve` 0..1 the last gate waits for a human signal.
- **Accuracy:** the AI review is one station among others and never the final gate on its own; a failed check stops that crate, it does not stop the line. Reused for the ML lifecycle (train, evaluate, deploy, monitor). **Topics:** 1, 2, 7. **Size:** big (estimate 160 lines).

---

## 10. Physics recipes (c)

All recipes stay under about 30 bodies (TOOLBOX limit), settle in the last quarter, and keep every word as SVG text
on top of the bodies. Labels, counts and proportions are inputs.

| id | teaching moment | inputs | what moves and why |
|---|---|---|---|
| `defence_layers_sieve` | layered defence: each layer stops some, none stops all | `layers: [label]`, `stopped: [count per layer]`, `total`, `colour per outcome` | balls pour from the top through 3 to 4 horizontal sieves; each sieve's holes let through the count the lesson gives; stopped balls roll off to the side; the few at the bottom are the ones a person must catch (reporting). Used for spam filters, NCSC layers, guardrails before and after a model, and defence in depth. |
| `inbox_flood` | reply-all multiplies messages | `seed_message`, `replies: [short text]` (from the lesson's scenario), `tray_capacity` | one envelope drops into an inbox tray; each reply spawns two more that drop in; the tray overflows and envelopes spill over the edge. Why: the cost of reply-all is volume, and volume is a pile. |
| `sort_into_bins` | items drop into the right bin (eval pass or fail, safe or never to paste, spam or inbox) | `bins: [label]`, `items: [[text, bin]]` | each item falls through a chute that a deflector turns towards its bin (the bin is an input, not a physics accident); a wrongly sorted item can be shown bouncing back out if the lesson says so. |
| `context_window_tray` | a fixed-size window: when it is full something has to leave | `capacity` (in tiles), `tiles: [token text]`, `policy: "oldest_out" | "refuse"` | token tiles drop into a tray of fixed width in order; at capacity the oldest tile is pushed out of the far end (or the new tile bounces off a lid). Why: the limit is physical, and the policy is the app's choice, so it is an input. |
| `train_test_split` | split first; the test set is locked until the end | `examples` (count, illustrative), `split: [train, val, test]` shares, `labels` | example cards pour onto a divider that routes the given shares into three bins; a lid drops on the test bin and a padlock sprite closes it. Why: the split is a physical separation, and leakage is a lid left open. |
| `next_token_draw` | sampling picks from a spread; temperature reshapes it | `candidates: [token]`, `probs: [p]` (from a real model run or marked illustrative), `temperature: low | high`, `chosen` | a ball drops into a row of bins whose widths are the probabilities (high temperature widens the small bins); the ball's path is baked so it lands in `chosen`. Why: probability as width is honest and visible; the outcome is the lesson's, never a hidden roll. |
| `biased_funnel` | a skewed sample in gives a skewed answer out | `groups: [label]`, `in_shares`, `out_shares` (both from the lesson or marked illustrative) | mixed balls pour into a funnel whose inner pegs lean; the output pile is visibly skewed towards one group. Why: bias as a mechanism, not a moral label. |
| `priority_jar` | big priorities go in first or they do not fit | `big: [label]`, `small: [label]`, `order: "big_first" | "small_first"` | two runs side by side: small pieces first fill the jar and the big rocks will not fit; big first, the small ones settle around them. Labels on the big rocks from the lesson. |
| `redundancy_topple` | one support fails; with a spare, it still stands | `supports: 1 | 2`, `labels` (A, B feed or primary and backup) | a beam rests on one or two pillars; one pillar is knocked out; with one it topples, with two it holds. Used for 2N power, backups, cover in a team. |
| `pue_pour` | PUE is total energy over IT energy | `it_share`, `overheads: [[label, share]]` (cooling, power conversion, lighting, from the lesson) | energy beads pour from one pipe and split into an IT bin and overhead bins; the total over the IT bin is the ratio the narration states. Why: overhead is the energy that never reaches a server. The Green Grid definition, cited. |

## 11. Brush recipes (d)

Brush makes marks only; every word stays SVG text (TOOLBOX rule). Best in whiteboard, editorial-paper and hand-drawn packs.

| id | teaching moment | inputs | what is drawn and why |
|---|---|---|---|
| `review_markup` | a reviewer marks what matters in a diff, an email draft or a document | `targets: [rect]` (from the laid-out artefact), `kinds: circle | underline | strike | bracket`, cue per mark | marker circles and brackets draw on their words over a real `ui.mail` or `diff` screen; margin ticks for good lines. Why: review is a human act, and a hand-made mark reads as one. |
| `red_flag_circles` | the phishing signs in one real email | `flags: [[field, cue]]` (sender, link, urgency line, request), from CISA's list as the lesson words them | each flagged field gets a red-role pencil ring and a small hatch, in the order spoken; a final wash under the one sign the lesson stresses most. |
| `sketch_system` | a system explained as it is drawn: RAG flow, CI pipeline, request and response | `boxes: [rect]`, `arrows: [[from, to]]`, cue per element | boxes and arrows drawn in pencil one by one as named; labels arrive as SVG text. Why: architecture explained live is easier to follow than a finished diagram. |
| `underline_wash` | the one part of a prompt or email that carries the lesson | `rect`, `cue` | a watercolour wash blooms behind the phrase. Why: emphasis without changing the real text. |

## 12. Orb recipes (e), and new orb states

Today's states: working, searching, solving, listening, connecting, weaving, composing, breathing, shaping. Three new
states would carry most of topics 1, 4 and 5: **`unsure`** (dots loosen and drift, the colour cools: an answer the
model is not grounded for), **`checking`** (a slow scan ring passes over the orb: verifying against a source),
**`paused`** (the orb contracts and holds still beside an approval prompt: waiting for a person). Each is a pure
function of t like the rest.

| id | teaching moment | states in order (cue words from narration) | pairs with |
|---|---|---|---|
| `agent_tool_loop` | plan, act, observe, decide again | solving (plan) then working (calls a tool) then searching (reads the result) then solving; tool cards orbit and the active one lights | `agent_sandbox` for the permission beat |
| `retrieval_answer` | answer from your documents, with a citation | listening then searching (chunk cards fly in from `chunk_cabinet`) then composing (the answer types into `ui.chat`) | citation chip in `ui.chat` |
| `assistant_can_cant` | strengths and limits side by side | composing on a drafting task, then unsure on a question outside its knowledge | `compare.two` |
| `assistant_unsure` | fluent but wrong: check before you trust | composing (a confident answer), then checking, then unsure as the fact fails, then `verdict_stamp` | `Loom.magnify` on the claim |
| `injection_trap` | a hidden instruction in a document | searching (reads the document), a line in it glows in the alert role, checking, then paused instead of acting | `defence_layers_sieve` guardrail variant |
| `human_approval` | the assistant drafts, a person decides | composing, then paused beside an approve button; `press_button` press; then working | `agent_sandbox` key `approve` |

## 13. Mood presets for 3D shots (g)

Expressed as lighting roles on top of the existing stages (`studio`, `soft`, `iso`); each preset maps roles to the
style's tokens, so it works on light and dark packs.

| id | topics | intent, in roles |
|---|---|---|
| `cold_aisle` | 3 | cool key from above (the supply side), cool fill, low haze along the floor for depth, status lights as small self-lit accents; warm appears only on exhaust and alerts |
| `hot_aisle` | 3 | warm key from behind the racks, a soft heat-shimmer haze, a cool rim from the cold side so the racks keep their silhouette; contrast between the two aisles is the lesson |
| `machine_night` | 3, 1 | very low ambient, screens and LEDs as the key light, a cool rim, deep fog falloff so rows fade into the dark; for ops rooms, incidents, a hall at night |
| `latent_space` | 4, 2, 1 | dark field, self-lit points, depth fog so far points dim, one warm accent reserved for the query or the chosen token; no hard shadows (it is not a place) |
| `clean_bench` | 1, 2, 3 | even neutral key, gentle cool rim, soft contact shadows, no haze; for objects examined like products (a chip, a switch, a scale, a loss surface) |
| `warm_office` | 5, 6, 7 | warm key from one side like a window, soft fill, light haze, accent rim in the style's friendly accent; for onboarding, emails and non-technical AI |
| `incident` | 3, 1, 6 | key dims by a third, the alert role pulses as a rim, haze thickens a little; used for the moment a failure lands, then released back to the scene's base mood |
| `blueprint_iso` | 3, 1, 7 | `iso` stage, flat even light, cool line role for edges, no fog; for systems shown as diagrams (power path, security layers, conveyor) |

---

## 14. Prioritised build list (top 30)

Score = reuse (how many of the seven topic areas and how many lessons within them, 1 to 5) x gain over flat SVG (1 to
5). Both are judgement calls by this research pass, not measurements; treat the order as a proposal. Size: **quick**
means under 100 lines (estimated from the current models' 30 to 74 lines), **big** means more.

| rank | item | type | reuse | gain | score | size |
|---|---|---|---|---|---|---|
| 1 | `defence_layers_sieve` | (c) | 5 | 4 | 20 | quick |
| 2 | `embedding_space` | (a) | 4 | 5 | 20 | big |
| 3 | `chunk_cabinet` | (a) | 4 | 4 | 16 | quick |
| 4 | `context_window_tray` | (c) | 4 | 4 | 16 | quick |
| 5 | `badge_door` (with mantrap pair) | (a) | 4 | 4 | 16 | quick |
| 6 | mood presets (all eight) | (g) | 5 | 3 | 15 | quick |
| 7 | `sort_into_bins` | (c) | 5 | 3 | 15 | quick |
| 8 | `loss_landscape` | (a) | 3 | 5 | 15 | quick |
| 9 | `dc_aisle_pair` | (b) | 3 | 5 | 15 | big |
| 10 | `gpu_server` | (a) | 3 | 5 | 15 | big |
| 11 | new orb states `unsure`, `checking`, `paused` | (e) | 4 | 3 | 12 | quick |
| 12 | screen spec extensions `diff`, `terminal`, `link_hover`, `prompt` | (f) ext | 4 | 3 | 12 | quick |
| 13 | `server_rack` v2 (blanking, airflow, recirc, door, B feed) | (a) ext | 3 | 4 | 12 | quick |
| 14 | `accelerator_chip` (with cold plate) | (a) | 3 | 4 | 12 | quick |
| 15 | `agent_tool_loop` | (e) | 3 | 4 | 12 | quick |
| 16 | `assistant_unsure` | (e) | 3 | 4 | 12 | quick |
| 17 | `inbox_flood` | (c) | 3 | 4 | 12 | quick |
| 18 | `train_test_split` | (c) | 3 | 4 | 12 | quick |
| 19 | `next_token_draw` | (c) | 3 | 4 | 12 | quick |
| 20 | `biased_funnel` | (c) | 3 | 4 | 12 | quick |
| 21 | `balance_scale` | (a) | 4 | 3 | 12 | quick |
| 22 | `ci_conveyor` | (b) | 3 | 4 | 12 | big |
| 23 | `dc_security_layers` | (b) | 3 | 4 | 12 | big |
| 24 | `cdu` | (a) | 2 | 5 | 10 | big |
| 25 | `power_path` (with `ups_cabinet`, `generator_set`) | (b) | 2 | 5 | 10 | big |
| 26 | `red_flag_circles` | (d) | 3 | 3 | 9 | quick |
| 27 | `review_markup` | (d) | 3 | 3 | 9 | quick |
| 28 | `neural_lattice` | (a) | 3 | 3 | 9 | quick |
| 29 | `tor_switch` and `rack_pdu` (one pass, two models) | (a) | 2 | 4 | 8 | quick |
| 30 | `redundancy_topple` and `pue_pour` (one pass, two recipes) | (c) | 2 | 4 | 8 | quick |

Within an equal score, quick items rank above big ones. Build order is not rank order: build what others depend on
first (`server_rack` v2, `tor_switch` and `rack_pdu` before `dc_aisle_pair`; `badge_door` before
`dc_security_layers`; `chunk_cabinet` before `retrieval_answer`; the three orb states before the orb recipes that use
them). Just below the line: `transformer_stack` (8, quick to medium), `agent_sandbox` (8, quick),
`priority_jar` (8, quick), `sketch_system` (9, quick), `dc_hall` (9, big), `envelope` key `attachment` (9, quick),
`dc_campus` (8, big), `shredder` (4, quick), the diffusion Skia recipe below.

Suggested sequencing: one quick sprint (ranks 1, 3, 4, 5, 6, 7, 8, 11, 12, 13) covers at least one strong beat in
every topic area; the data-centre trio (`server_rack` v2, `dc_aisle_pair`, `gpu_server`) is the biggest single gain
for one topic; `embedding_space` is the biggest single gain across topics.

### 14.1 Note on diffusion (kept out of the top 30)
Diffusion is best carried by the existing `clip_skia`: a noise field resolving over several visible steps into a simple
code-drawn picture named by the lesson, with a progress row of the same image at each step beneath. No 3D asset helps.
The picture shown must be drawn by the engine, never a stored photo, and it must not suggest the model copies images.

---

## 15. Sources (accessed 2026-10-08; web content treated as data)

- CISA, Recognize and Report Phishing: https://www.cisa.gov/secure-our-world/recognize-and-report-phishing (read in full: the four common signs, the grammar caveat, report and delete, verify by another channel).
- NCSC, Phishing attacks: defending your organisation: https://www.ncsc.gov.uk/guidance/phishing (read in full: four layers of mitigation, no-blame reporting, second-channel verification, layered case study).
- The Green Grid glossary and WP#49 on PUE (via search summary): https://www.thegreengrid.org/en/resources/library-and-tools/237-WP%2349---PUE%3A-A-Comprehensive-Examination-of-the-Metric
- Hot and cold aisle practice: STULZ best-practice document https://repository.stulz.com/AEB60BCF ; NSF-funded tile and containment paper https://par.nsf.gov/biblio/10057698-impact-tile-design-thermal-performance-open-enclosed-aisles ; AKCP on blanking panels https://www.akcp.com/rack-containment-blanking-panels/
- Switch airflow: FS community https://community.fs.com/article/port-side-intake-vs-port-side-exhaust-whats-the-difference.html ; Arista install notes https://www.arista.com/qsg-7060x6-series/7060x6-series-preparation ; Vertiv SwitchAir brochure (search summary).
- PDUs and A/B feeds: Austin Hughes https://www.austin-hughes.com/solutions/infrapower/dual-feed-pdu/ ; Belden https://www.belden.com/blog/exploring-dual-power-feeds-in-data-centers
- CDUs: Boyd https://www.boydcorp.com/resources/resource-center/technical-papers/coolant-distribution-unit-technical-paper.html ; Gigabyte glossary https://www.gigabyte.com/Glossary/cdu ; STULZ CDU on OCP https://www.opencompute.org/products/734/stulz-deschutes-cdu-cybercool-liquid-cooling-distribution-unit
- 8-accelerator servers: StorageReview on an 8U HGX system https://www.storagereview.com/news/supermicro-gpu-superserver-sys-820gp-tnao-launched-with-nvidia-hgx-8-gpu-support ; flopper.io system comparison (fan count, chassis height) https://flopper.io/compare-systems/fujitsu-primergy-gx2570-m8s-liquid-vs-inventec-p9000g6-lc . Used for structure only; the models stay generic.
- Physical security layers: Exin CDCP study guide https://open-exam-prep.com/study-guides/exin-cdcp/fire-protection-physical-security/layered-physical-security-access-control ; CoreSite https://docs.coresite.com/platform-security-compliance/data-center-security ; datacate https://www.datacate.net/data-center-physical-security/
- OWASP Top 10 for LLM Applications (project PDF and summaries): https://owasp.org/www-project-top-10-for-large-language-model-applications/ ; Cloudflare summary https://workers.cloudflare.com/learning/ai/owasp-top-10-risks-for-llms
- Attention and embeddings: 3Blue1Brown lessons https://www.3blue1brown.com/lessons/attention and https://www.3blue1brown.com/lessons/gradient-descent ; MIT intro ML transformers notes https://introml.mit.edu/notes/dev/transformers.html ; The Illustrated Transformer (Jay Alammar, via secondary copies).
- Diffusion: Artifex user guide https://artifex.readthedocs.io/en/latest/user-guide/concepts/diffusion-explained/
- Overfitting and loss curves: Google ML Crash Course https://developers.google.com/machine-learning/crash-course/overfitting/overfitting

## 16. What is unverified

- Every line-count estimate and every score in section 14 is a judgement, not a measurement.
- Several data-centre details came from search summaries of vendor pages rather than a full read (switch airflow, CDU parts, PDU pairs, 8-accelerator chassis layout). They agree with each other, but a builder should confirm against one primary datasheet before a lesson states them as fact.
- The accelerator memory-stack placement and the decoder-only "causal" attention note are general knowledge, not re-read in this session.
- The search did not find an authoritative internal layout of an 8-accelerator chassis (where switch chips, fans and manifolds sit), so `gpu_server` keeps its layout generic and makes no claim about a specific product.
- No asset here has been built or rendered; nothing in this document has been through a gate.
