---
name: lnd-motion-fit
description: Choose the RIGHT animation for a given diagram or chart in a learning video and put its parts in the right order - which entrance a bar, pyramid, funnel, ring, flow, tree, gauge, venn, table or timeline actually needs, what scaffolding must exist before content arrives, how instruments (dials, meters, counters, progress rings) must build, how things should leave, and when the obvious geometric order must be overridden. Use whenever animating a diagram in any tool, deciding how a visual should build, reviewing a reveal order, fixing a build that feels like a slideshow of unrelated pops, or when asked to make something "smoother", "more animated" or "flow better".
---

# Motion Fit - what this design needs, in what order

You are matching motion to meaning. A design does not need "an animation"; it needs the one entrance
whose change over time IS the thing being taught, and it needs its parts to arrive in an order that
never shows an effect before its cause.

**Precedence.** `lnd-visual-design` owns the craft numbers - durations, easing, stagger, overshoot - and
the animation gate itself ("animate only what is a change over time; everything else is a static
composition with signalling"). `lnd-motion-craft` owns easing and timing. `lnd-motion-choreography-loop`
owns the design loop and the proof. **This skill owns only the MAPPING - design type to entrance - and
the ordering rules.** No timing number appears below, on purpose.

---

## 1. The gate before the map

Before choosing an entrance, answer: **is this element's change over time part of the teaching?**

- **Yes** -> it is content-motion. A bar GROWING is the magnitude claim. Animate it.
- **No** -> it is staging. It appears so the eye knows where to look. Reveal it and move on.

If everything in your design claims to be content-motion, the claim is decoration. Most elements in
most designs are staging, and that is correct.

**A still camera, a moving drawing.** In 96 TED-Ed films the camera was static in about three quarters of
shots; the teaching lived in what changed inside the frame: a part growing, a slot swapping, a label
recolouring on its word. Put content-motion in the drawing first. When the camera does move, it makes one
slow eased move, and one long move may carry a whole explanation (timing in `lnd-motion-craft`).

---

## 2. The motion vocabulary

These names describe WHAT moves, so they translate to any tool (a preset, a keyframe pair, a CSS class,
a Manim animation):

| name | what happens |
|---|---|
| **reveal** | fades in with a small rise, in place - quiet staging |
| **grow** | scales up from a baseline (vertical) |
| **grow-x** | scales out from a baseline (horizontal) |
| **pop** | arrives with a small overshoot |
| **draw** | a stroke draws along its path; an arc or line sweeps |
| **count** | a number rolls up from zero to its value |
| **unmask** | a mask opens (left-to-right, top-down or from the centre) - reads as *printed* |
| **settle** | rises a little, overshoots a few pixels, comes to rest - reads as *placed, with weight* |
| **stamp** | scales from slightly large down to size with a hard ease-out - reads as *decided* |
| **drop** | comes down from above with a small bounce - reads as *handed down* |
| **converge** | slides in from the left or right with a small overshoot - two things *meeting* |
| **iris** | a circular mask opens from the centre - *opened like a lens* |
| **assemble** | unmasks left-to-right with a small slide, opacity last - *a box coming together* |
| **hold** | nothing moves: one extra beat of pause before this step - *a breath before the point* |
| **rest** | the build is finished and nothing new arrives while the voice explains it; declared on the scene (`intent: "rest"` or `"process_hold"`) - *a finished picture, being read* |
| **swap** | the layout stays; one slot's contents change on the word - *same place, new state*. The swap-in-place slot is coming; until then, the old content leaves and the new arrives in the same reserved box |
| **value travel** | a pointer sweeps, digits roll, a marker travels a path, a fill rises - motion that IS the reading |

**Overshoot is a pack setting, not part of the name.** The small overshoot in pop and drop is the
illustrated-pack form; packs with `motion.overshoot: false` (every editorial and technical pack) get the
same move with a plain ease-out, and it still reads, because what moves names the motion, not the bounce.
In the runtime today, pop and drop follow the pack; settle and converge never overshoot. *Changed (D-112):
pop, settle, drop and converge were described with overshoot for every pack; the films show none outside
cartoon registers.*

---

## 3. The map

| Design | What actually changes | Motion | Direction / origin | Why any other choice teaches wrongly |
|---|---|---|---|---|
| vertical bar chart | magnitude | grow | up from the axis | a bar that FADES in asserts no magnitude; growth from a baseline is the claim |
| horizontal bar / bar row | magnitude | grow-x | out from the axis | growing from the centre implies a signed deviation it does not have |
| stack / accumulation | a running total | grow | bottom-up, cumulative | each segment must land ON the previous one or "adds up to" is lost |
| pyramid of support | what holds up what | reveal | **bottom to top** | the apex arriving first shows a thing supported by nothing |
| funnel / attrition | loss at each stage | reveal | **top to bottom** | you lose people in order; bottom-up reverses causation |
| tree / taxonomy | derivation | reveal | **root first, top-down** | a child before its parent is nonsense |
| ring / cycle | return | reveal | clockwise from twelve | an arbitrary start point hides that it closes |
| flow / process | dependency | draw, then reveal | left to right; **the connector draws INTO the node that follows** | a node that appears before the arrow reaching it has no antecedent |
| timeline | sequence | draw, then reveal | the spine draws first, events left to right | events floating without their axis are a list, not a timeline |
| part-whole (donut, pie) | proportion | draw | arc sweeps clockwise from twelve | fading in a wedge shows a shape, not a share |
| gauge / dial | position on a range | draw | needle sweeps from the minimum | the SCALE must exist first or the needle points at nothing |
| number line operation | the operation | draw | along the line, left to right | the jump IS the teaching; a static arrow is a diagram of it |
| scatter / correlation | the pattern | reveal all points together, then draw the fit | points have no intrinsic order | staggering points implies a sequence the data does not have |
| venn / overlap | shared membership | reveal both sets, THEN the intersection | | the overlap cannot precede the sets it is made of |
| fishbone | contributing causes | draw the spine, then reveal the bones | alternating sides outward from the spine | bones before the spine are floating labels |
| comparison, two columns | tension | reveal, blocked | left block complete, then right block | interleaving destroys the "now compare" beat |
| table | precise values | reveal | header row, then rows in order | a table is read, not watched; keep it near-instant |
| icon row / tags | membership in a set | pop | left to right, tight stagger | these are peers; a slow serial reveal implies rank |
| callout / stat | one number | pop or stamp | in place | it is a single claim; anything else delays it |

---

## 4. The ordering rules that outrank the map

Applied in this order, they decide every remaining question.

1. **Scaffolding before content.** Axis before bars. Spine before bones. Scale before needle. Frame
   before what sits in it. A container before its contents.
2. **The reference before the thing measured against it.** A limit line, target or benchmark must exist
   before the bar that approaches it, or the viewer watches something grow towards nothing.
3. **Cause before effect.** A connector draws into the node it feeds. An arrow that arrives after its
   target is backwards, however smooth.
4. **The whole before the part it contains.** Both circles, then the overlap. The total, then the split.
5. **Peers arrive as peers.** Equal things get equal treatment and a tight stagger; a long serial cascade
   over peers invents a ranking.
6. **Exits are not reversed entrances.** A thing leaving is not a thing arriving backwards.

Section 9 turns these six into a grammar per design. Agreeing with "scaffolding before content" is easy;
knowing that a gauge's threshold marker is scaffolding and its reading is not, on a specific gauge, is
what section 9 is for. Read it before you choose an order, not after.

---

## 5. When the obvious geometric order must be overridden

The natural default is geometry: bottom-to-top on a vertical build, left-to-right on a horizontal one,
clockwise on a ring, block by block left-to-right for columns. Anything else should be a deliberate,
written-down decision with its reason.

**The canonical overrides** - the cases where geometry and meaning genuinely disagree:

| design | order | the reason to write down |
|---|---|---|
| funnel | top to bottom | attrition happens in order, top down |
| tree / taxonomy | top to bottom | a parent must exist before its children |
| waterfall from a starting total | top to bottom | the start is the top; each step deducts from it |
| any narration-driven build | the order the narration names things | the scene names things in a different order |

**Narration order waives geometry entirely, and it carries an obligation:** the narration must actually
name the elements in that sequence. Otherwise the viewer reads one script and hears another - which is
worse than an odd reveal order.

**Direction versus arbitrariness.** A direction that differs from the geometric default is a question to
answer ("is there a reason?"), not a defect. An order that is *arbitrary* - explained by no principle at
all - is a defect. When judging a build, first set aside up to two leading scaffold steps (a baseline, a
spine, a dial): scaffolding sits wherever the structure sits, and counting it as the first member of the
content run makes correct builds look wrong. The real defect that survives that check, and that ships
more often than anyone admits: a pyramid built **apex-first**, a structure resting on nothing. That is not
a style choice; it is the diagram contradicting itself.

---

## 6. What is a style setting, what is adjustable, and what is fixed

| must be a THEME / STYLE value | may be ADJUSTABLE per use | must be FIXED STRUCTURE |
|---|---|---|
| every colour, without exception | entrance duration | the reveal ORDER |
| the text colour used on accent fills | stagger between steps | which element is scaffolding |
| stroke and surface colours | easing / overshoot amount (where the pack allows any) | the step numbers themselves |
| | overall motion intensity (subtle / lively) | which motion each element uses |

**Reveal order is not adjustable.** It encodes the argument. A setting that lets someone reverse a
pyramid is a setting that lets them ship a pyramid resting on nothing.

**Step numbers must be derived, never typed.** Assign them from a counter as elements are created. A
hard-coded "step 3" assumes every earlier element exists; with an empty title or a single item the
sequence develops a hole and the cascade visibly hitches while it waits out the missing step.

**Never write a literal duration into one element** while its siblings read theirs from a shared
setting; that one element silently stops responding when the pace is changed.

---

## 7. Prove it

Check the order and the timing with whatever your tool gives you (a timeline view, a frame export, a
script that reads the element order), then **look at four frames**: the first, one mid-build, the
settle, the last. A still of the finished design cannot show an element that is legible at rest and
collides with another at 160 ms, and a timing check cannot show that the build teaches the wrong causal
order. Only you can see the second one.

When a check and the picture disagree, the picture wins and the check gets fixed.

---

## 8. Registers - making a correct build feel like something

Sections 1-7 make a build CORRECT: the right motion, the right order. They do not make it FEEL like
anything. A correct build in which every group does a plain reveal (fade plus a small rise) is a slide
deck: the boxes arrive as boxes. This section is about the difference, and it starts with an attitude.

**The mindset: experiment first, then subtract.** For every design, before settling, try at least three
treatments that differ in what MOVES, not in how much: the box slides in as a whole; the box's edge draws
and the fill floods in behind it; the box is unmasked left-to-right like a print coming off a press.
Render each as frames and look. Keep the one whose motion says what the design says, then take away
everything the eye does not need. "More animation" is never the goal; "this box came together in a way
that felt inevitable" is. Two devices carry most of the charm and cost nothing:

- **A hold before the payoff.** The verdict, the total, the takeaway lands after a breath. Never hold for
  more than one step, and never hold scaffolding - holds are for consequences. A hold is not a rest: a
  finished build may rest, declared, while the voice explains it (`lnd-motion-craft`, "Rest is deliberate").
- **Follow-through.** Two ways, by pack. Classic, for illustrated packs with `motion.overshoot` on: the
  primary property settles slightly after it arrives, 2-4% overshoot on a scale, 3 px past the mark on a
  rise; below 2% it reads as nothing, above 10% as cartoon. Editorial and technical packs: the
  follow-through is the deceleration itself, a short ease-out that lands, which is what the films' general
  registers show.

**What the motion libraries teach.** GSAP and the Codrops tradition built a generation of reveals on
masks: uncovering an element reads as *printed*, fading it in reads as *projected*. anime.js and
Framer Motion made springs the default entrance: arrive decisively, then settle. Material Design's
fade-through is a sequential out-then-in with a scale on the incoming element - never both at once. IBM
Carbon splits motion into a PRODUCTIVE register (fast, functional: tables, lists, data) and an EXPRESSIVE
one (slower, with character: openers, payoffs), and scales duration with the distance travelled. Apple's
reduce-motion guidance: tighten springs, replace movement along an axis with fades, never animate into or
out of blur.

| register | reads as | use it for | never for |
|---|---|---|---|
| **unmask** | printed, revealed by hand | quotes, definitions, headlines, a card's text block, a rule | a value (the mask hides magnitude) |
| **settle** | placed, with weight | cards, list items, panels, notes | scaffold lines |
| **stamp** | struck, decided | verdicts, totals, the one number, a call to action | peers (a stamped row of equals reads as five verdicts) |
| **drop** | handed down | kickers, headers, labels that sit above what they name | anything that grows upward |
| **converge** | two things meeting | comparison columns, before/after panels, a pair | a single centred element |
| **iris** | opened like a lens | rings, hubs, donuts, gauge tracks, badges | rectangular text blocks |
| **assemble** | a box coming together | any card or tile that would otherwise just fade | text runs longer than a line |
| **hold** | a breath before the point | the consequence step only | scaffolding, peers |

The magnitude and path motions keep their meaning: grow for magnitude, draw for a path or sweep, pop for a
single peer, reveal for staging that must not draw attention, value travel for motion that IS the content.
A register only replaces the generic reveal, on the groups whose role deserves better.

**Roles decide the register, not taste:**

```
frame        title / kicker                  drop
structure    scaffold, axis, frame           reveal - quiet, it must not compete
focus        the element the scene is about  settle, or the design's content motion
detail       items, rows, points             settle for cards and rows; pop for peers; unmask for prose
consequence  verdict, total, takeaway        stamp, after a hold
```

**Exits are a register too.** Each entrance leaves in its own way - last in, first out, at about 0.6x the
entrance duration: an unmask re-masks, a stamp or pop shrinks slightly and fades, a converge leaves further
out the way it came in from, and everything that rose leaves upward. A thing must not leave exactly the way
it came (that reads as an undo), and nothing merely fades.

**The two mistakes the vocabulary invites.** (1) Everything expressive: if every step is a stamp, no step
is. Data and lists are PRODUCTIVE (settle, unmask, tight stagger); openers and payoffs are EXPRESSIVE
(stamp, hold, iris). (2) Motion in the reading zone during dense explanation: during data, comparison and
anything assessed, a register may arrive and must then be still.

A register that looks wonderful in your head and has not been rendered is a sketch.

### 8.1 Illustrated packs only (look_family: illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard, cinematic-noir, cinematic-dawn)

None of this reaches editorial or technical packs.
- **Springy pops** belong on cartoon people and small accents (a badge, a mark, one prop): the pop and drop
  with overshoot. Never on data, text blocks or structure, where the map's motion still decides.
- **Stepped pose beats:** a figure or drawing changes pose A, pose B, the peak on the key word, held
  between steps rather than tweened, and texture boils on fours or threes. Use the stepped-time
  primitive (`Loom.stepped.on`, `.boil`; D-114), never hand-made steps in scene code.
- **Morph chains** (one shape becoming the next, as a transform or a join) and **motif-shaped wipes** are
  built (D-114): `Loom.morph.to` / `.chain` / `.fill` in scenes, `motif` and `fill` joins in the storyboard. Name
  them in the storyboard's `devices`, and never hand-draw a fake morph.

---

## 9. The build grammar - what must exist before what, per design

Sections 3 and 8 answer *how* an element moves. They do not answer the question that decides whether a
build reads as competent: **which element the viewer is allowed to see first, and which one cannot
possibly come before it.**

### 9.1 Three questions, three different failures

Ask them in this order. They are ranked: **causality outranks convention outranks charm**, and you never
trade a higher rank for a lower one.

| | the question | what a violation looks like to a viewer |
|---|---|---|
| **CAUSAL** | would this element be meaningless, floating, or pointing at nothing without the other one? | **defective.** "The arrow points at nothing." "The number grew towards a target that was not there yet." "The label sat on empty space." Nobody says "wrong order" - they say the video is broken. |
| **CONVENTIONAL** | which way has the viewer already learned to read this form? | **backwards.** A ring that fills anticlockwise, a timeline that builds right to left, a pyramid that starts at its apex. Nothing is technically wrong and every viewer feels it. |
| **MOTION** | does the element's own geometry name its motion (section 3)? | **cheap.** A bar that fades in place instead of growing. A route that pops instead of drawing. It reads as a slideshow of a chart rather than a chart being made. |

The learned expectations are not decoration and they are not yours to reinvent: viewers arrive already
fluent in them, so a violation costs comprehension, not style points. Where the literature is explicit it
agrees: stage a complex change as a sequence of simple sub-changes so each is trackable, keep each stage as
long as needed and no longer, and prefer translation and divergence over rotation, which is harder to
follow (Heer and Robertson, *Animated Transitions in Statistical Data Graphics*, InfoVis 2007). Chart tools
encode the same conventions in their defaults: a column chart wipes upward, a bar chart wipes right, a pie
animates as a wheel, a line follows time from the left.

### 9.2 The five dependencies that are ALWAYS hard

Apply these to any design, including one that is not in the table below. If you remember one part of this
section, remember this list.

1. **ANCHOR.** A quantity is drawn from something: a bar from its baseline, an arc from its track, a needle
   from its zero, a line from its axis. The anchor exists first, and the quantity grows *out of it*, never
   into place. A bar that appears at full height has thrown away the only thing that makes it a bar.
2. **CONTAINER.** A card, panel, plate, lane, column, cell or frame exists before what sits inside it.
   Content that arrives before its container reads as a layout error being corrected on screen.
3. **REFERENCE.** A target, limit, benchmark, average, prior year or "before" state exists before the thing
   measured against it. Otherwise the viewer watches something travel towards nothing and has to re-read
   the frame once the reference lands.
4. **JUNCTION.** An edge, arrow, connector or flow starts at something that already exists and *draws
   towards* its target; the target may land as the stroke arrives, never before it. An arrowhead that
   exists before its tail is the single most common "this looks broken" defect in a diagram.
5. **AGGREGATE and LABEL.** A total, sum, net, average or verdict comes after its parts (and is the one
   place a hold and a stamp earn their keep). A label, value or caption never precedes the shape it names -
   it arrives with it or just after it.

### 9.3 The grammar, per archetype

Read the order left to right. `->` is "then"; `+` is "together, as peers".

| archetype | the build, in order | motion | convention it obeys | the failure it prevents |
|---|---|---|---|---|
| **column / bar** (bar, grouped bar, histogram) | axis and baseline -> any target line -> bars in axis order -> value labels with their own bar | grow up from the baseline (grow-x for horizontal) | quantity grows from zero along the measure axis; categories left to right | bars fading in place; a value already legible while its bar is still growing |
| **horizontal bar / ranking** (lollipop, dumbbell) | axis -> rows top to bottom -> markers with their row | grow-x, marker pop on arrival | ranked lists read top down, best first | a bar growing right to left; the dot landing before its stem |
| **line / area** | axes -> gridlines -> line draws left to right -> points appear as the line passes them -> area unmasks under the finished line | draw the path, pop the points, unmask the band | time runs left to right | points existing before the line reaches them; an area before its own boundary |
| **scatter / bubble** | axes -> quadrant tints -> all points as ONE peer group -> only then any highlighted point | pop, the highlighted one stamp | a cloud has no rank | a serial cascade over 40 points, which invents an order the data does not have |
| **pie / donut / ring** | track ring -> wedges clockwise from twelve -> centre value LAST | wedge draw/sweep, centre pop after a hold | every pie the viewer has seen starts at twelve and goes clockwise | anticlockwise fill; a centre total legible before the wedges that produce it |
| **gauge / meter / bullet** | scale and its ticks -> target marker -> needle or fill sweeps from zero -> reading | scale reveal, fill grow/sweep, reading pop | dials sweep up from the low end | a needle that appears at its value (an assertion, not a measurement); a reading before the sweep |
| **stacked / composition** (stacked bar, pictograph, waterfall) | axis -> segments in stack order from the base -> total on top | grow, total stamp | a stack is built from its base | segments arriving in narration order, which makes the stack jump |
| **matrix / heatmap / treemap** | grid lines and headers -> cells in reading order, or ALL cells as one peer group -> the one called-out cell | cells reveal/unmask, callout stamp | tables are read row by row | a 5x5 grid revealed cell by cell for eight seconds; a highlight before the grid |
| **funnel** | frame -> stages top to bottom, widest first -> drop-off labels with their stage | stage unmask/grow, label with it | a funnel narrows downward and things fall through it | building bottom up, which reverses the causality the shape exists to show |
| **pyramid** | base -> upward to the apex -> apex label last | grow/settle | you cannot stand on a tier that is not there | apex-first |
| **process chain** (chevrons, step row, swimlane) | lane/rail -> step 1 -> its arrow draws INTO step 2 -> step 2 -> ... | step reveal/settle, arrow draw | processes run along their arrows | every step popping and the arrows appearing afterwards, which turns a sequence into a row of boxes |
| **timeline / gantt / roadmap** | spine draws first along the time axis -> events in date order -> bars grow from their start date | spine draw, events settle, bars grow-x | earlier is left (or up); duration grows forward in time | events floating before the spine; a gantt bar growing right to left |
| **branch / decision** | the question or diamond -> both outgoing arrows together -> both outcomes together | diamond pop, arrows draw, outcomes as peers | a fork's branches are simultaneous alternatives | revealing one branch then the other, which implies the first is the answer |
| **cycle** | nodes clockwise from twelve -> arcs between them as each pair exists -> the CLOSING arc last | node pop, arc draw | a loop is only a loop once it closes | closing the loop early, or all arcs after all nodes, which is a ring of dots |
| **tree / org chart / mind map** | root -> edge to each child draws -> children as peers per level -> next level | root pop, edges draw, children settle | hierarchy flows down (or out) from its root | a child before its parent, which reads as a broken graph |
| **venn / overlap** | both sets TOGETHER as peers -> the intersection -> its label | sets pop/grow, intersection unmask | the whole before the part it contains | an overlap that exists before one of the things overlapping |
| **comparison, two sides** (vs card, pros/cons, SWOT) | frame -> the two headers as peers -> side by side per row (if rows are compared) or column by column (if each side is an argument) -> verdict last | headers as peers, sides converge, verdict stamp after a hold | two sides are equals; a verdict is not | staging one whole side before the other when the rows are pairwise, which hides the comparison |
| **before / after** | before -> arrow draws -> after | arrow draw, after unmask | change reads left to right, through its cause | the after state appearing first, which is the answer before the question |
| **weight / trade-off** (balance scale) | fulcrum and beam -> both pans as peers -> then the tilt | beam reveal, pans as peers, tilt as motion | a balance settles once, after both sides are loaded | tilting before both pans are loaded, so the tilt has no visible cause |
| **table / ledger** | card and header row -> rows top to bottom, fast -> total LAST, after a hold | rows settle, total stamp | tables are read, not watched; the total is the payoff | over-staging a table; a total that is already there |
| **list** (bullets, numbered, checklist, agenda) | title -> items in reading order, each on its spoken word, or one slot that swaps -> each tick or badge WITH its item, never as its own step | items settle, ticks with them | reading order, top to bottom | a badge cascade that doubles the step count and drifts off the narration; an icon grid |
| **KPI strip / counter** | frame -> each figure counts up from zero -> its caption with or just after it | count, caption settle | a number that changed should be seen changing | a final value fading in, which is a claim rather than a measurement |
| **stat / callout / headline** | kicker -> the figure -> the caption | figure stamp, caption settle | one claim, one arrival | staging a single claim into three acts |
| **definition / quote** | term or quote mark -> body unmasks like print -> attribution or example last | drop, unmask, settle/stamp | text is read left to right, and prose does not bounce | a definition that pops word-blocks; an attribution before the words it attributes |
| **map / anatomy / annotated image** | base image or map -> leader lines draw -> pins or labels land at their ends | image unmask, leaders draw, pins pop | you cannot point at a place that is not on screen yet | labels before the thing they annotate; pins before their leader lines |

### 9.4 What must NOT be staged

Over-staging is a defect with the same weight as bad ordering, and it is the one a keen animator commits.

- **A table, a matrix or a dense grid.** It is a reference the viewer scans; per-cell staging holds them
  hostage to your cadence.
- **Peers.** Points in a cloud, tags, icons in a row, both branches of a fork, both sides of a balance. A
  serial cascade over peers *asserts a ranking* the data does not contain.
- **A single claim.** One number, one headline, one call to action. Three acts for one sentence.
- **Furniture.** Rules, brand marks, decorative motifs, background tints. They belong to the slide, not to
  the argument.
- **Anything the narration has already said.** A hold before a payoff the viewer has already heard is not
  suspense, it is lag.
- **A declared rest.** Once the frame is finished and resting, nothing new arrives; one slow ambient loop at
  most. Motion added to raise a motion share is decoration: motion share describes a film, it is
  never a target.

### 9.5 The instrument law - people already know how these things move

An instrument, a map, a counter, a route - each is an object the viewer has watched a thousand times
outside your video. They arrive with an expectation of the ORDER OF EVENTS, and a build that violates it
does not read as a different style; it reads as broken, or as an animation nobody thought about.

A dial, gauge, meter, speedometer, thermometer, progress ring, odometer or scale is read POINTER-FIRST, in
four steps, always:

```
1  THE INSTRUMENT EXISTS   the track, the scale, the hub - and the pointer AT ITS MINIMUM.
                           a real needle rests at zero before it moves; it does not appear
                           already pointing somewhere.
2  THE POINTER TRAVELS     from the minimum, at instrument speed - slower than an entrance,
                           because the viewer is taking a reading off it.
3  THE READING IS MARKED   at the instant the pointer STOPS. Not before, not a beat later.
4  THE NUMBER IS NAMED     last. Now "64%" is a confirmation of something watched, not a caption.
```

Break step 3 and the whole thing collapses: if the coloured band is already on screen while the needle is
still moving, the answer has been given away and the travel is decoration.

**A band is two different objects, and they sit on opposite sides of the pointer:**

| the band is | it means | when it arrives | why |
|---|---|---|---|
| a **target / limit / benchmark** someone supplied | context you need to interpret the arrival | with the scaffold, **before** the pointer, at LOWER visual weight | the viewer must know what "good" is while watching the needle approach it |
| the **reading** (minimum to value) | the answer | **with the pointer's arrival**, at full weight | it IS the measurement; showing it first answers the question the sweep was asking |

The discriminator is visual **weight**: a tick, a hairline, a thin limit line reads as scale; a band at the
track's own weight reads as a verdict. If a target should arrive early, draw it thin.

And the third case: **if the source gave no target, do not invent one.** A template that ships a default
"good zone" for every gauge puts a fabricated range on screen every time it is used. With no target, the
band is the reading.

**The same law for its relatives** - *the thing that measures exists -> the value travels -> the result is
marked -> the result is named*:

| object | the pointer | marked at arrival | named last |
|---|---|---|---|
| gauge / dial / speedometer | needle sweeping from the minimum | the arc from minimum to value | the numeral |
| odometer / counter | the digits rolling | the unit or change chip | the label under it |
| progress ring / donut | the arc sweeping clockwise from twelve | the completed segment | the percentage |
| thermometer / tank / vessel | the fill rising from the base | the level line | the reading |
| route / journey / pipeline | the marker travelling the path | the gate it reached | the gate's label |
| slider / spectrum | the handle moving along the rail | the filled portion behind it | the value |

**"At that exact time" needs its own mechanism.** "The next step" in a build is one cadence gap (a few
tenths of a second); a value travel takes about a second. So "pointer at step 2, mark at step 3" puts the
mark down in the MIDDLE of the sweep. The mark must be timed to the END of the travel - a delay equal to
the travel's own duration, taken from the same setting that drives the travel, never typed separately.

### 9.6 Things that are right in the design file and wrong on screen

- **Appearing and travelling are two properties, so they are two elements.** A needle must fade in with its
  dial AND rotate later. In most animation systems one element cannot carry two animations of the same kind
  cleanly; wrap it - the appearance on a parent, the rotation on the child.
- **Paint order and reveal order are independent.** What is drawn on top is decided by layer/document order;
  when it arrives is decided by the build. Draw connectors on a LOWER layer so they sit under their nodes,
  and still give them a LATER step so they arrive after the node they leave. A connector runs EDGE TO EDGE,
  from the rim of one node to the boundary of the other - never centre to centre, or it is drawn under both
  things it connects.
- **A label never precedes what it names.** Putting a label in the same group as its shape is the reliable
  construction - one group, one arrival, nothing to get wrong. An instrument's readout is the same rule in
  time: never print the figure before the pointer finds it.
- **Automatic timing can overrule your order.** If your tool times elements to the narration for you (auto
  sync to the voice-over, "build with text", smart animate), an element it cannot match - a line with no
  words, an arrow, a connector - may be scheduled at the very start, and the largest text on screen may be
  promoted to lead even when it is the ANSWER. When a build looks wrong and your order looks right, check
  the timing the tool actually produced before touching the design.
- **Paint that is not painted.** In SVG, a gradient whose units are the object's bounding box is not drawn at
  all on a perfectly vertical or horizontal line (the box has zero width or height). Valid markup, no
  warning, nothing on screen. Strokes take a solid colour; gradients are for fills on real shapes.
- **Rasterisers are not browsers.** Some SVG-to-PNG converters run no CSS animation at all and silently drop
  elements that combine certain transform settings. A still made that way can hide a needle the browser
  shows. Check stills against the real renderer before trusting them.

**A simulated interface has an instrument law too.** People know how software behaves, so the order of
events is fixed:
1. The pointer travels to the control, on an arc and at a human speed.
2. The press is visible: the pointer dips and the control depresses.
3. The system responds after the press, never before.
4. Typed text appears at a human pace with the caret leading it.
5. A result arrives as a new object (a toast, a row, a badge).

A field that fills itself, or a toast before the click, reads as fake at once.

### 9.7 Leaving: the same grammar in reverse

An exit is not an entrance played backwards, but it obeys the SAME dependencies with the arrows turned round.

1. **Contents leave before their container; scaffolding leaves LAST.** A heading that vanishes first leaves
   a body with no heading; per-element exits that leave empty card shells standing read exactly as broken as
   a label that precedes its shape.
2. **The unit of a departure is the whole visual, not each element.** A chart leaves as a chart. Per-element
   exits at a scene boundary look like disintegration, not departure. Within a scene, per-element is right;
   at a boundary, the whole visual is.
3. **One object leaving takes the whole exit window.** If a lone element finishes leaving early, the screen
   sits EMPTY before the cut.

4. **A group leaves in reverse order of arrival, faster than it came,** then its container. Members that
   leave in arrival order read as the build rewinding.

**A heading is not usually a continuity object.** Consecutive scenes rarely share an identical title. What IS
stable is the title's POSITION, so the title area can hold its place while the words change - the broadcast
lower-third convention.

### 9.8 The exit register: what leaves HOW

One exit shape for everything is a slideshow with better easing. Pick the exit from what the thing IS.
The mechanism is the whole point: **displace, scale or occlude; never merely fade.** An occluding exit
changes no opacity at all, which is why it says *where the content went*.

| the unit is | it leaves by | mechanism | why this one |
|---|---|---|---|
| a chart grown from an axis | collapsing back to the axis | undo | it folds back into the thing it grew out of |
| a table, ledger or prose card | a wipe upward | occlude | text must be occluded ALONG its lines, so whole lines vanish |
| a list | closing up into its header | undo | it closes into its own title |
| a stroke diagram, route, timeline | un-drawing towards its source | undo | it retracts to where it began, so it is not the entrance's mirror |
| a two-sided comparison | the two sides closing on each other (barn doors) | occlude | the layout's own gesture |
| a ring, gauge, donut, hero figure | an iris closing | occlude | the geometry is already a circle |
| a stamped verdict or mark | receding (small scale-down) | scale | a mark withdraws; it does not slide |
| the body of a scene that ends a section | off the left edge | displace | it leaves the FRAME; the most video-like option |
| an opener, divider or payoff | advancing towards the viewer | scale | spectacle belongs exactly here, and nowhere else |
| anything also present in the next scene | holding still | none | free continuity; animating it is the loudest slideshow tell there is |

**Two fences:**
1. **An occluding edge runs ALONG the text direction, never across it.** A vertical wipe across a paragraph
   slices glyphs mid-word and reads as a rendering fault; a wipe upward removes whole lines and reads as
   intended.
2. **Nothing moves upward through a heading that is being held.** Either clip the leaving content at the
   title area, or the heading leaves too - it cannot be held and passed through.

**The shape of the join itself:** the retiring elements leave in sequence, then a **hard cut**, then the
arriving elements wait for the frame to clear and build in a direction that follows from the way the
outgoing content left. Never a crossfade under a move: for the length of the dissolve you see both
compositions mid-move, stacked, which reads as a fault.

Two declared exceptions, both from the films: inside one topic, one long camera move may carry across the
join while the content changes under it; and a deliberate ghost (one image held through the next) is
declared with `join_in.overlap: "ghost"`. Chapter boundaries stay hard cuts or a card.

**Restraint is part of the register.** Four exit shapes used because the content called for them beat ten
sprinkled for variety.

### 9.9 The canvas is the held object

Across a whole video, one thing is usually present in every scene: the background FIELD - the base canvas
colour. Everything above it (an accent glow, a gradient, an ambient drift) is a canvas layer. Treat the field
as the held element, and the join between scenes becomes five phases on one surface:

```
EXIT (per visual) -> CANVAS-OUT (layers recede to the bare field, overlapping the last exits)
  -> BLANK HOLD (a few frames; the eye registers the stage)  == CUT on two identical frames ==
  -> BLANK HOLD -> CANVAS-IN (the next scene's layers grow, ease-out) -> ENTRANCE (from ~0.2 s into it)
```

- **The cut is invisible by construction,** because both frames are the bare field. No dissolve needed.
- **Canvas leads content:** the first element begins while the field is still growing, so field and content
  arrive as one gesture.
- **The blank is alive.** Any ambient drift keeps moving through it; a frozen blank reads as a dropped frame.
  (In code-rendered video, time looping background motion from the global clock, not the scene's own clock,
  or it restarts at every cut.)
- **Headings recede last. Continuing scenes of one group skip all five phases.** Section dividers may change
  the field more, and more slowly - spectacle belongs there.

---

## The one-page check

```
GATE       every animated element's change over time IS the teaching
           everything else is staging, revealed and done
           still camera, moving drawing; a finished frame may REST (declared)
           overshoot only in illustrated packs; elsewhere a plain ease-out
MOTION     taken from the map: grow for magnitude, draw for a path or sweep,
           reveal for staging, pop for a single peer or claim
ORDER      scaffolding -> reference -> cause -> whole -> peers
           no effect before its cause; no bar before its limit line
GRAMMAR    s9, per archetype, ranked causal > conventional > charm
           the five hard dependencies: anchor, container, reference,
           junction, aggregate-and-label. a quantity GROWS OUT of its
           anchor; an arrow DRAWS INTO its target; a total comes last
           conventions are learned, not yours: time L->R, quantity up
           from zero, ring clockwise from twelve, hierarchy down from
           its root, funnel wide to narrow, stack from its base
           do NOT stage: tables, peers, one claim, furniture, anything
           the narration already said
INSTRUMENT the instrument exists, POINTER AT ITS MINIMUM
           the pointer travels, at instrument speed
           the reading is MARKED the instant it stops (timed to the end
             of the travel, from the same setting - "next step" is too early)
           the number is named LAST
           a supplied target is scale: thin, early. a band at the track's
           own weight is the answer: full weight, on arrival.
           no target supplied means NO BAND IS INVENTED
ON SCREEN  appear and travel are two elements (parent + child)
           paint order and reveal order are independent: connectors on a
           lower layer, but a later step
           a label never precedes its shape; a readout never precedes its pointer
           auto-timing can overrule your order: check the real timeline
DEFAULT    geometry holds, or the override is written down with its reason
           funnel / tree / waterfall build top-down; narration order obliges
           the narration to name things in that order
SETTINGS   colours are theme values; durations and stagger are adjustable;
           the reveal order and the step numbers are structure, derived not typed
REGISTER   role decides it: frame drop, structure reveal, focus settle,
           detail settle/pop/unmask, consequence stamp after a hold
           productive for data and lists, expressive for openers and payoffs
           exits per element, last in first out, ~0.6x, never the way it came,
           never a bare fade
PROVE      check the order and timing, then look at four frames by eye
```
