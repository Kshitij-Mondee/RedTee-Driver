# Reuse or build, per style (2026-10-12)

STATUS: BUILT 2026-10-12 (D-163, loom/kept.py). As built, the library is `assets/kept/<style>/{parts,beats}` (a place or
background is a kit part); an isolated lesson neither sees nor feeds it. The proposal below is kept as written.

Kshitij (2026-10-12): "I want all of this to be very hybrid. If a scene for the asked style exists, then reuse otherwise
build it. SIMPLE." Asked and answered: a scene built when nothing fitted is kept automatically; the rule covers
backgrounds and beats.

## Today (mapped 2026-10-12)
- Set library (assets/sets, D-152): 2 sets, both office/meeting_room; the painterly one maps to no style pack; no
  storyboard has used the `set` field; no brief, card or playbook lists it.
- Loom.place / Loom.obj, 17 templates, 5 blueprints: the same code in every style (drawn in style tokens); offered "as an
  option, never a requirement".
- Library forms and designs (library/): promotion needs 2 to 3 uses, an assessment, a template that reads in EVERY style
  and a blind test; 0 components, last harvest 2026-09-30.
- Lesson kits: never kept. Five story-cartoon lessons each drew their own meeting room, wall calendar and clock.
- Nothing is collected when a run finishes.

## The rule (one sentence)
For every place, shared part and beat the storyboard needs, look in the lesson's style library first: if one fits, reuse
it; if none fits, build it, and when the film is approved the engine keeps it in that style's library.

## The library
`library/kept/<style pack>/` with three kinds, each entry a folder holding its code, a card (name, what it is, words it
answers to, source lesson, date, uses) and a still:
- `places/`: a background (a room, a sky with Earth, a server hall). Reused as is.
- `parts/`: a kit part (a phone, a padlock, a satellite). Reused as is.
- `beats/`: a whole bespoke beat (its storyboard spec and its code). Reused as the scene author's starting code: the
  author changes the words, the timings and what the lesson needs, and keeps the drawing.
Keyed by the exact style pack: never across styles (D-122). The approved Claude Design sets (assets/sets) are looked up
first for places and stay as they are.

## The flow
1. P5 storyboard: the brief lists the style's kept places, parts and beats (name and one line each). For each scene and
   kit part the storyboard writes `"reuse": "<kept id>"` or builds; when a kept piece answers to the same thing and it does
   not reuse it, it says why in one line (fit is its judgement, not a quota).
2. P7 kit: a reused place or part is loaded from the library, nothing written; the rest is built as today.
3. P8 scenes: a reused beat's author starts from the kept code (a short brief: the kept beat, the new words and timings).
4. After final approval: the engine keeps every built place, part and beat that passed the check into the style's library
   (a reused one only counts a use). Nothing is kept from a run that failed.

## Not in this step
- Engine-drawn beats with no author (templates) stay as they are; a kept beat reused often is a candidate for one later.
- Approvals: kept automatically, as Kshitij chose; `py -m loom kept remove <id>` takes one out.
