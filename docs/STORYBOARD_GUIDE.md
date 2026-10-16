# Storyboard guide - how Loom avoids the slideshow

A slideshow is a stack of full-frame layouts joined by cuts, where nothing carries over and everything
appears at once and then freezes. Loom removes each of those causes structurally:

| slideshow cause | Loom's answer |
|---|---|
| every beat owns the whole frame | **stations** on ONE world canvas; the camera travels between them |
| nothing carries over | **held** elements (same station, same name: they simply stay), **motifs** that travel across stations, **zoom** into a portal |
| hard cut or crossfade between slides | **joins**: camera pan (displacement is the exit), travel, zoom, per-element exits then a cut on the bare field (`canvas`), continue |
| everything appears at once | every element reveals ON the word that names it (`say` anchors) |
| the frame freezes | ambient field (period-locked), value travel, one gentle camera move, next reveal on its word; or a declared `rest` on a finished frame |

## World and stations
Station coordinates are 0..1920 x 0..1080 (one frame). Place stations in world coordinates so camera
moves read as meaning: a chapter advances to the right, a detail sits below its parent, a new topic is
far away. Nested stations (`parent` + `rect` in the parent's coords) are INSIDE an element of the parent:
a `zoom` join flies the camera into it (use `hero.portal` to draw the frame the child sits in).

```json
"world": {"stations": [
  {"id": "desk",   "x": 0,    "y": 0},
  {"id": "curve",  "x": 2400, "y": 0},
  {"id": "inside", "parent": "curve", "rect": {"x": 1180, "y": 300, "w": 480, "h": 270}},
  {"id": "plan",   "x": 4800, "y": 600}
]}
```

**Hold the layout, change its state (D-112).** For mechanism and structure beats, keep one station across beats
(`continue`, `ctx.held`) and swap, recolour or relabel its contents on the spoken word. A new station per beat
stays available (D-70).

**What the storyboard gate refuses since the bench post-mortem (2026-10-07; `docs/research/2026-10-07-bench-fix-report.md`).**
Finished lessons made before these rules keep their known findings as warnings (`loom/checks/film_baseline.json`);
any new lesson fails on them.
- **Length.** The plan states the request's length (`pacing.requested_s`; "no length was requested" is refused when
  the request has one). The script is held to 1.3 times the request (the estimate is 1.08 x words / wpm x 60 plus
  1.0 s a beat plus the pauses, within 5 % of the narrated benches) and to `ceil(8 x minutes x 1.25)` beats (20 for
  2 minutes); `narrate` refuses a narration past 1.3 times the request.
- **Framing (D-125).** No `shot.focus` or `zoom` on a template, blueprint, redtee or avatar beat (they fill the
  frame; the runtime ignores it). A nested station never declares its own `w`/`h` (its space is one 1920x1080
  frame; `rect` sets its size).
- **Keep.** `keep` names only what the previous beat on the SAME station drew (a template's own part names, or a
  bespoke beat's `design.elements`). Keeping a page without its lines warns (an empty husk).
- **Variety.** One template id at most max(2, 15 % of beats) times; A-B-A-B alternation warns; a `hybrid` beat that
  is a plain template needs its motion layer. In an agents run the mix is a ceiling for templates, not a quota.
- **Avatar props** are the presenter's own (title up to 12 words, kicker, a `card` of up to 3 lines or a rule);
  other keys are refused.
- **Empty slots.** A slot meant to look empty is `{"empty": true}`, never words like blank, TBD or "...".
- **People (D-126).** When people appear, `story.cast` lists each person once with ONE look: `{name, rig}` (a
  designed rig carries its own look; every draw of that person must then agree) or `{name, member, skin, cloth}`
  for a peep. Template person props say `cast: "<name>"` and are drawn exactly as the cast says. A cast entry that
  nobody draws as a person (an object, an unseen role) needs no look.
- **compare.two polarity.** `valence` colours a side; `verdict: right|wrong` draws the tick or cross; `stance:
  myth|fact` tags a side (or a document.page) and strikes a myth. `tone` is deprecated (it drew a verdict for a
  colour).
- **API path.** A beat of a kind no agent writes (media) is refused at submit; manim, skia and three have clip
  workers.

## Joins
- `continue` - same station. Elements the new scene takes with `ctx.held(name)` stay put (the strongest
  continuity there is); everything else leaves in reading order before the new elements arrive.
- `camera` - pan (and zoom) to another station, ~1 s, editorial ease. The move IS the exit.
- `travel` - camera pan while a motif flies to its new place (`via: "memory_orb"`).
- `zoom` - into a nested station (parent must be the previous beat's station).
- `canvas` - per-element exits to the bare field, cut, new elements arrive. For section changes.
- `cut` - the first beat, a jolt, or a chapter boundary (D-112: most studied chapter joins are hard cuts;
  gradual joins live inside a topic).
- `join_in.overlap: "ghost"` - a deliberate ghost dissolve; the double-exposure check skips that join.

Narration gaps are sized to the join (a camera move gets ~1 s of silence), so the picture lands as the
next sentence starts. One long eased camera move (10 to 20 s) may carry a whole explanation and cross a join.
Material joins (D-114, `docs/primitives/material.md`): `torn`, `page`, `scroll`, `motif` (a wipe shaped like the
topic's own motif: `shape`), `handoff` (the next field grows in: `to`), `fill` (a shape from the old frame grows to
become the next field: `shape`, `box`). Pick ONE join material per lesson and name it in `devices`. Torn paper, page
turns, scrolls, motif wipes and morph chains are cartoon material, for **illustrated packs only (look_family:
illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard, cinematic-noir, cinematic-dawn)**; `handoff` and
`fill` suit every family.

## Devices, value script, accent (D-112, every look family)
Studied films repeat a few devices instead of inventing each beat. Declare, before the beats:
- `devices`: 3 to 5 named devices reused across beats, plus one join material
  (`[{"id": "ledger", "what": "the ledger page held while its rows swap (Loom.slot)", "kind": "explain", "beats": ["b04", "b05"]}, ...]`;
  `kind` is one of explain, list, data, join, rest, callback, other).
  Lists and numbers are objects (a swapping slot, a stamped unit grid, a counter on a pile), never an icon grid or
  a bare number card; text sits on things; a recap replays the lesson's own images (`intent: "callback"`).
- `value_script`: one value band, broken for meaning (a dark beat for the key mechanism, a colour flood at a
  turn, colour withheld until the payoff). House arc: a pale open, a slightly richer middle, a lift at the close.
- `accent_on` (per scene): the named element that carries the one saturated accent, often under 2 % of the frame.

## Intents (D-112 plan, section 4)
A scene `intent` declares a deliberate frame. `hold`, `sparse` and `dark` stay as they were; new:

| intent | what the gates do |
|---|---|
| `rest` (a finished, dense frame while the voice explains) | empty, sparse, repeated pass; static hold up to `pace.rest_max_s` (20 s), warns above (`hold` too) |
| `process_hold` | sparse and repeated pass; static hold as `rest` |
| `punctuation` (a 0.6 to 1.2 s beat) | empty passes for runs of 1.2 s or less; sparse passes |
| `callback` | repeated passes |
| `ghost` | double exposure skipped |
| `diegetic_text` (signage, texture, never a narrated term) | tiny text warns instead of erroring |

Declare one only on a finished frame: our failures were holds on empty frames. Motion share and cut rate are
descriptions, never targets. Tone checks warn: brightness per beat against `value_script`, more than two
saturated hue families in a settled frame, illustrated packs against `tone_reference`. The film,
hold and double-exposure checks honour these intents (D-112); log a flag that fires on a declared intent.

## Scene kinds
- `template` (catalog templates): structure beats. Calm, precise, anchored reveals.
- `blueprint` (catalog heroes): motion-is-content beats, filled with a small JSON spec.
- `manim`: curves, functions, geometry, anything mathematical. Transparent clip placed in the world.
- `skia`: a HERO moment that needs per-pixel light: SkSL shaders, frosted glass, blur-to-sharp type, real motion
  blur. Offline, heavy: at most one or two per lesson, on openers, dividers or payoffs (`docs/VISUALS_PLUS.md`).
- `three`: real 3D (a device, a system that turns to show its sides). Offline clip. Only when depth IS the idea.
- `page` (D-176): what the runtime cannot draw yet, from approved libraries: a real map, a laid-out diagram, a
  typeset formula, highlighted code, a working terminal, stroke-written lettering, a morph. Offline clip, sealed (no
  held parts, its words not layout-checked, a restyle re-renders it), so only when the picture needs that library.
  `{"kind": "page", "page": {"file": "scenes/<beat>_page.js", "rect": [...], "libs": ["d3", "topojson"], "params": {...}}}`;
  see `docs/PAGE_CLIPS.md`.
- Any scene may add `fx: [{"kind": "light"|"spotlight", "at": "spoken words", "dur": 1.2, "rect": [x, y, w, h]}]`:
  a light sweep on a payoff, or a spotlight that dims everything but the thing being taught (signalling).
- The lesson may set `fx` (the style's shader background, grain and vignette, overridden; `{"enabled": false}`
  turns it off) and `poster: {"beat": "b07"}` (the thumbnail).
- `bespoke`: a custom motion scene written as code by the scene author, from your `design` spec:
  `{treatment, why_motion, elements:[...], beat_sheet:[{t_anchor, element, action, motion}], continuity}`.
- `avatar`: the presenter (intro/outro, ~10% of time).

## Visual storytelling (D-62; skill `skills/lnd/lnd-visual-storyteller`)
Plan the lesson as a film: interesting AND sound (D-67). All fields are optional, and everything here is a
reference, not a rule (D-64). The gate offers labelled suggestions (never blocks) for every kind of video;
the genre only changes which form of story it suggests (`packs/genres/*.md`). `story.dial: "off"` switches
them off for one lesson. It always notes what the engine cannot draw (depth on a template, an unknown rig).
- `story: {metaphor, setting, arc, cast: [{name, rig or member, skin, cloth, role}], dial}`: the one picture the lesson
  lives inside, if one helps. `cast` is required when people appear (see "What the storyboard gate refuses" above).
- Per scene: `shot.size` (establishing | wide | medium | close | insert | overhead | pov), `depth`
  (flat | layered | iso | 3d), `light` (even | key | spotlight | silhouette | night | dawn | glow),
  `story_role` (hook | setup | turn | reveal | payoff | practice).
- `depth: layered` or `iso` needs a `bespoke` scene (ctx.depth, ctx.iso) or a clip; `3d` needs `three`.
- Review it before building: `py -m loom animatic <id>` writes one panel per beat (built frames when they
  exist), `qa/animatic.jpg` and a timed `qa/animatic.mp4` with the narration.

## Design seed: the lesson's own treatment of the essentials (D-80, D-81)
`py -m loom go` writes the engine's seed for a new lesson before the storyboard task, and prints it (D-82). Show the
person the choice and the alternatives (`py -m loom seed <id> --show`), and apply what they change with `--set
axis=option`, or `--clear` for the classic forms.
- Motion beats happen in a place (`Loom.place.*`, D-84). An idea that is not a held layout or a declared rest
  gets a continuous camera move (`Loom.cam.push` or `pan`, or a `shot.move`), in the seed's habit. The lint warns
  on still beats. (D-112: was "each idea"; a still camera on a changing drawing is a good beat.)
- Things the narration names are drawn objects (`Loom.obj`, D-83), not hero-size icons.
- A storyboard may carry `design_seed: {"bubble": "chat"}`; it overrides the file, axis by axis.
- Plan the joins to the seed's camera habit (push, pan or cut). That habit is guidance only; nothing enforces it.
- Keep every essential the lesson needs. Change the form, never the presence.
- Check the result against recent lessons with `py -m loom variety <id>`.

## Reuse or build, per style (D-163)
The kit parts and bespoke beats earlier lessons of this style built are listed for you (THE STYLE'S LIBRARY). Where one
shows the same thing, reuse it: `"reuse": "<style>/part/<name>"` on a kit part (loaded as is under your part id) or
`"reuse": "<style>/beat/<name>"` on a bespoke scene (its author starts from that code and changes the words and timings).
Where none fits, build it; the engine keeps it when the film is approved. Fit is your judgement; never another style's piece.

## Options: keep both ways, let the person choose (D-70)
A scene may name its treatment and carry others it could use:
`"option": "acting character", "alternatives": {"illustrated bust": {"kind": "blueprint", "blueprint":
"hero.character_moment", "props": {...}}}`. `py -m loom options <id>` lists them;
`py -m loom switch <id> <beat> "illustrated bust"` swaps (the current one is kept, scene files stay on
disk, switching back restores the storyboard exactly). Honour `brief.look`; with no preference, use the
established treatment and offer the newer one.

## A worked fragment
```json
{"beat": "b04", "kind": "blueprint", "station": "desk", "blueprint": "hero.character_moment",
 "props": {"member": "woman", "name": "Maya", "day_label": "Friday", "say_day": "by Friday",
           "items": [{"icon": "lightbulb", "label": "Idea 1", "say": "three ideas", "fade_say": "gone"}],
           "moods": [{"emotion": "surprised", "say": "blank"}]},
 "join_in": {"type": "continue"}, "motion_is": "content", "register": "expressive"},
{"beat": "b05", "kind": "manim", "station": "curve", "manim": {"file": "scenes/b05.py", "rect": [160, 120, 1600, 760]},
 "join_in": {"type": "camera"}}
```
