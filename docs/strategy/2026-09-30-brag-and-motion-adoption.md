# What Loom took from BRAG and from motion/framer (2026-09-30, run R-11)

STATUS: SHIPPED 2026-09-30.

**Sources:**
- BRAG: `latent-spaces/brag`, the `/brag` and `/brag-slim` skills and their references.
- motion/framer: the `motion-framer` skill in `freshtechbro/claudedesignskills`.

**The question:** which of their good parts make a Loom lesson better, and in what form: a skill rule, an
engine primitive, a check, or all three. Loom's laws decide the form:
- grounded content;
- narration-locked reveals;
- deterministic frames;
- style-pack personality;
- the cognitive budget.

## Taken, and where it lives

| Good part | From | Loom form | Where |
|---|---|---|---|
| Springs with a designer-facing **bounce** and **visual duration**, plus presets | framer | `Loom.spring({bounce, visual})`, closed form and exact at 0 and 1. `m.spring(E, t, {preset})`. The style pack's personality clamps bounce: no overshoot, no bounce | `runtime/expressive.js`, test `springs_are_exact...` |
| **Variants orchestration**: staggerChildren, when: beforeChildren, staggerDirection -1 | framer | `m.group(Es, t, {enter, order: forward/reverse/center/edges/shuffle, parent})` and `m.groupExit` (reverse, faster). The whole group is compressed to at most 1.2 s (lnd-motion-craft) | `runtime/expressive.js`, test `groups_compress...` |
| **Keyframe arrays** for gestures (the form-error shake) | framer | `m.shake` (wrong or blocked, with an error sound), `m.nudge` (look here), `m.press` (tapped), `m.glow` (payoff). They run on `E.life`, so they never fight an entrance | `runtime/expressive.js` |
| **Gestures** (hover, tap, drag) | framer | In a video nobody hovers, so gestures become **simulated interaction**: `ui.cursor`, `m.cursorTo` (arc, Fitts-like duration), `m.tap` (press, ripple, click), `m.typeInto` (caret on the clock, thinned key sounds), `ui.window/field/button/toast`, `m.toastIn` | `runtime/interaction.js`, `lab_show_it_in_use` |
| **layoutId** shared-element transitions | framer | Already in Loom as motifs: `ctx.motif` + `adopt` + `travelTo` carry one object across stations. Now named as the shared-element pattern in the skills | `docs/SCENE_API.md` |
| **Transform and opacity only** | framer | Already a rule (lnd-motion-craft). Kept | skill |
| **Show the thing in use** (entry -> key action -> result, not the slide about it) | BRAG | A rule in lnd-visual-design and the storyboard guidance, backed by the interaction kit | skills |
| **Reading floor**: fast in, then HOLD (about 0.8 s for a label, 0.3 s per word, at least 1.2 s for a sentence) | BRAG | A measured check from the runtime report: settled time from entrance end to exit start. Currently a warning (a ratchet) | `loom/qa.py`, test `reading_floor...` |
| **Double exposure**: a crossfade between busy layouts turns to mud; stagger old out, then new in, or dip | BRAG | A check at same-station joins, plus mid-join frames in every contact sheet | `loom/qa.py` |
| **Look at stills mid-transition** | BRAG | The contact sheet gains a JOIN panel per beat | `loom/qa.py` |
| **Sound written with the motion**: effects in the music's key, sitting under it, repeated small sounds in the background, the first and last of a sequence accented | BRAG | The runtime records sound events (`Loom.sfx`). The check collects them per build (`qa/sfx_events.json`) and the mix synthesises them tuned to the sounding chord (key, click, card, land, reveal, success, error). Style or storyboard sets the energy (sparse, moderate, rich) | `runtime/expressive.js`, `loom/narrate/mix.py` |
| **Beat and cue sync** (strong cues within 0.15 s, beat grid within 0.10 s) | BRAG | **Inverted**: Loom synthesises its music, so the music follows the edit and chord changes land ON cuts and section starts (`music.follow_edit`). Narration still owns reveal timing | `loom/narrate/mix.py`, `chord_times` |
| **Tone presets** plus freeform direction mapped to the nearest one | BRAG | Trailer tones (default, polished, cinematic, chaotic, deadpan). Each maps to dip length, flash, music mood and level, sound energy, spring preset and segment cap | `loom/trailer.py` |
| **The whole /brag product**: a 15-25 s launch video with hook -> reveal -> highlights -> punchline | BRAG | **`loom trailer`**: a 20-35 s course trailer cut from an approved lesson through an edit decision list. Its own scenes are the footage, its own narration is the voice, and there are no model calls | `loom/trailer.py`, `runtime/trailer.js` |
| **Poster = the strongest settled frame, baked as frame 0** | BRAG | Every render writes `renders/<id>.jpg`. Trailers also bake it as frame 0 | `loom/render.py`, `loom/trailer.py` |
| **Share copy** | BRAG | Trailer `card.txt`: the lesson's title and through-line plus a computed duration, for the LMS course card. No invented claims | `loom/trailer.py` |
| **Plan owns WHAT, the engine owns HOW** | BRAG | Already Loom's split (storyboard vs runtime). Restated in loom-director for trailers: the agent may choose `--beats`, and the engine does the cut | skill |
| **Every frame postable** | BRAG | A review question in lnd-visual-design | skill |

## Rejected, and why

- **15-25 s total length, and humour from absurdity.** Those are launch-video goals. The length law only
  applies to trailers.
- **No voice by default.** Loom lessons are narrated by design. The trailer reuses the lesson's own voice.
- **Hover, focus and drag as live interaction, AnimatePresence and useInView.** Nothing is interactive in a
  rendered video. Their visual lessons (press states, exit orchestration) were taken; the event machinery
  was not.
- **Per-property transitions** (x on a spring, opacity on a tween). They conflict with Loom's
  "one progress drives all properties" law, which prevents the swimming look.
- **Sample-based SFX libraries.** The requester chose synthesised sound (no downloads, no licences).
- **Audio-reactive visuals from RMS.** Deferred: the presenter already follows the narration envelope.
  Ambient glow tied to music energy is a candidate for later.
- **Snapping reveals to the beat grid.** In a lesson, reveals land on spoken words; a beat-snapped reveal
  would lead or lag the voice. The music moves instead.

## What the new checks found on shipped lessons (the point of a new check)

- **spacing-sticks b04 and b16:** `hero.meter` notes arrived after the needle's travel, one in the last
  0.3 s of the beat. A replaced note was never removed: its exit was scheduled before its own entrance,
  so the entrance won. On screen, "On the day" and "A week later" overlapped as a double exposure.
  - Fixed in the blueprint: a note lands on its words; the old one leaves first, after its reading floor.
  - The lesson was re-rendered; the old MP4 is archived.
- **The check's own first version** read `exitT` for held elements and flagged them as readable for
  0.0 s (L-74). It now counts only real exit tweens.
- **The frame cache** keyed on `index.html` + `mix.wav` only, so the fixed blueprint first showed OLD
  frames (L-76). It now hashes the whole build.
