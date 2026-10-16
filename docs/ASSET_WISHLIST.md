# Asset wishlist: characters, sets, props and kits for the Loom library, with Claude Design prompts (2026-10-01)

STATUS: DESIGN 2026-10-01. A plan for the library, not shipped assets.

**Why these, and why now.** The visual study (`docs/research/2026-10-01-visual-study.md`) found that Loom
frames are emptier than every reference channel: they draw on 13 to 28% of the frame against 30 to 50%. They
also have no places, few props and one-colour pages. What closes that gap is mostly assets:
- a cast that can act;
- places to stand in;
- props that carry the information;
- metaphor kits;
- diagram parts.

Code can draw simple versions (`runtime/scenery.js`, `runtime/rigs/beans.js`), but a library of well-drawn,
recolourable pieces is what makes every future video, in every style, look made rather than generated.

**How to use this file.**
1. Paste **Prompt 0 (the contract)** into Claude Design first, in every session.
2. Then paste one numbered prompt at a time.
3. Bring the SVG files back into `assets/library/<kind>/`.

An importer that checks the contract (`loom assets import`) does not exist yet. It is listed at the end as
engine work.

**Priorities.**
- **P0:** needed for the next real lessons in the three new registers.
- **P1:** widens what the engine can say.
- **P2:** polish and range.

**Rights.** All designs are original. Nothing should resemble an existing channel's characters or mascot, a
cartoon franchise, or a real brand. No real logos. Real-world objects (a laptop, a forklift) are generic and
unbranded.

---

## The long view: one asset, every style

Loom restyles a whole lesson by swapping one pack file. A drawn asset only survives that if it is built to be
restyled. So every asset follows the same contract:
- **Colour comes from slots, not hex.**
  - **Fills:** a fixed set of placeholder colours that Loom maps to the pack's tokens.
  - **Skin and hair:** use their own slots, so casting stays the person's choice.
- **Outlines are their own layer.** Every outline stroke carries `class="lm-outline"`. A toon pack shows it in ink,
  a flat pack hides it, and a line-art pack keeps only it.
- **Shading is its own layer.** The single cel shade is `class="lm-shade"`; a highlight, if any, is
  `class="lm-hi"`. Packs turn them on or off.
- **No text is baked in.** Every place words go (a sign, a screen, a document) is an empty rectangle with an id
  such as `slot_title` or `slot_body`, so the engine writes real, grounded words at real type sizes (the text
  gates apply).
- **Anchors are named.** These include where the feet stand, where a hand grips, the top of a desk and the
  centre of a screen. They let code place things on things.
- **Parts are separate.** Characters come as limbs with pivots, so `ctx.character` can animate them; sets come
  in depth layers for parallax.

Built this way, one set of drawings serves story-cartoon, presenter-pop, corporate-clean, flat-cosmos,
whiteboard (roughened in code) and line-art. TED-Ed's range (coming next) will add hand-drawn and painterly
registers; the same contract carries those as alternative layers.

---

## Prompt 0: the contract (paste first, every session)

```
You are designing a reusable asset library for a code-rendered video engine that makes workplace training and
explainer videos. Every asset must be restyled later by code, so follow this contract exactly.

FORMAT
- One SVG file per asset, viewBox in px, no external references, no embedded images, no filters, no masks
  unless asked, no gradients unless asked (if asked, linear only, two stops).
- Group everything into named <g id="..."> layers. Use lowercase snake_case ids.
- Coordinates are integers or one decimal. Size budget: props and icons up to 80 KB; characters and sets up to
  400 KB (detail is wanted there; do not simplify a character to save bytes).

COLOUR SLOTS (use ONLY these exact hex values; the engine replaces them with a style's colours)
  #101010 ink (outlines, dark details)       #FFFFFF surface (cards, paper, screens off)
  #E6E6E6 surface2 (walls, secondary)        #CFCFCF field2 (floors, ground)
  #8A8A8A muted (furniture metal, extras)    #FF0000 accent    #00C000 accent2
  #0000FF accent3                            #FFD000 accent4   #606060 line (thin connectors)
  #F2C7A5 skin  #D9A784 skin_shade           #3B2A20 hair     #7A0000 mouth
  For props and sets, a darker shade of a slot is NOT allowed; put shade shapes in the lm-shade layer using
  #000000 at fill-opacity 0.14 instead (the engine recolours it).
  CHARACTERS use their own richer slot families (each a base, a shade and a highlight, so faces and clothes can
  be modelled properly and still be recast by code):
    skin   #F2C7A5 base  #D9A784 shade  #FBE3CF highlight  #C98E70 deep shade (under chin, inner ear)
    hair   #3B2A20 base  #24180F shade  #6A4A36 highlight
    eye    #4A6A8A iris  #1A1A1A pupil  #FFFFFF sclera and catch-light
    lips   #B8645A       blush #E8998A (fill-opacity 0.35)
    cloth1 #2F4A7A base  #22365C shade  #4A6AA0 highlight   (main garment)
    cloth2 #D8D2C4 base  #B8B0A0 shade  #F0ECE2 highlight   (shirt, inner layer)
    cloth3 #5A4636 base  #3E3024 shade  #7A6250 highlight   (trousers, shoes, bag)
    metal  #9AA0A6 base  #6E747A shade  #D0D4D8 highlight   (glasses, watch, buckle)
  These exact values are the only colours allowed in a character file.

LAYERS AND CLASSES
- Outlines: every outline stroke in a group or element with class="lm-outline", stroke #101010, width 5
  (at the given viewBox), round joins and caps. Fills never carry a stroke themselves.
- Cel shade: one flat shade shape per volume, class="lm-shade", on the side away from the light (light from
  top left).
- No highlights unless asked (class="lm-hi" if asked).

TEXT
- Never draw letters, numbers or logos. Where text belongs, place an empty rect with id="slot_<name>",
  fill="none", stroke="none", sized to the area words should fill, and list the slots in the reply.

ANCHORS
- Mark placement points as <circle id="anchor_<name>" r="2" fill="none"/>: feet, grip_r, grip_l,
  desk_top, screen_centre, seat, door_threshold, etc.

STYLE
- Detail follows the asset. Characters and sets are the craft pieces: professional illustration quality, the
  level of a premium animation studio's explainer work, with real construction, proportion, clothing and
  expression (the character prompts say exactly how much). Props and icons are clean and economical, but every
  silhouette still reads at 1/4 size.
- Original designs only: nothing resembling an existing cartoon, mascot, channel or brand. People are diverse in
  age, build, skin and gender expression, dressed for ordinary workplaces, never caricatured.
- Before delivering, check your own work against the prompt's quality bar and redraw what falls short. Say what
  you changed.

DELIVERY
- For each asset: the SVG, a one-paragraph description, the list of ids (layers, slots, anchors), and for
  characters the pivot point of every part.
```

---

## Getting the files back from Claude Design (added 2026-10-01)

**What Claude Design can export.** Its own help page ("Get started with Claude Design", support.claude.com,
read 2026-10-01) lists:
- Download as .zip;
- PDF;
- PPTX;
- Send to Canva;
- standalone HTML;
- Handoff to Claude Code.

There is no "export SVG" or PNG button. A PDF or picture of a character is a reference only: Loom cannot rig
or recolour it. So ask Claude Design to keep each asset as its own SVG file inside the project, then download
the project as a .zip.

**Verified 2026-10-01 (maya-v1.zip):** the .zip keeps every asset as its own SVG file plus `manifest.json`. (Before that test this line read "not verified yet".) Review copies under `preview/` and composite sheets the manifest does not list are reported by the intake, not imported. The original advice still holds for a new account: Prove it with one small prop
before a whole cast. If the .zip does not contain them, export the standalone HTML instead: the review page
below carries the same SVGs inline, and the intake tool reads either.

### Prompt R: the return format (paste after Prompt 0, in every session that should deliver files)
```
DELIVERY FOR THE ENGINE (in addition to anything you show me)
1. Keep every asset as its own file in this project, one <svg> per file, following the contract above, in a
   folder per subject: e.g. maya/head.svg, maya/torso.svg, maya/arm_upper_l.svg, props/mug.svg.
2. Add manifest.json at the project root:
   {"batch": "<name>", "assets": [
     {"file": "maya/head.svg", "kind": "character_part", "character": "maya", "part": "head",
      "parent": "torso", "pivot": [x, y], "slots": [], "anchors": ["anchor_neck"],
      "description": "one line"},
     ...]}
   kind is one of: character, character_part, prop, icon, set, texture. A pivot is in the part's own viewBox
   coordinates; parent names the part it hangs from (the torso has none). List every slot_ and anchor_ id.
3. Make index.html a review page. It shows each asset on a neutral ground, and the full character assembled
   from its parts in three poses (stand, point, sit) so I can see the parts fit. It embeds the SAME svg markup
   inline with data-asset="<file path without .svg>" on each <svg>, and the manifest inside
   <script type="application/json" id="loom-manifest">.
4. Never convert anything to PNG or JPG, never draw letters, and reply with the list of files.
```

### Bringing them into Video-Engine
1. In Claude Design: **Export, then Download as .zip.** Use **Export as standalone HTML** if the .zip turns out
   not to hold the SVG files.
2. Save the file anywhere, for example `Video-Engine/assets/incoming/_drop/maya-v1.zip`.
3. Run `py tools/asset_intake.py assets/incoming/_drop/maya-v1.zip --batch maya-v1` (or the `.html`). It
   copies every asset to `assets/incoming/maya-v1/` and checks each against the contract:
   - slot colours only;
   - no text, images or scripts;
   - size budget;
   - a pivot on every character part.

   It writes `INTAKE.md`.
4. Paste the failures from `INTAKE.md` back to Claude Design ("fix these, keep everything else"), and repeat.
   A clean intake (exit 0) is the gate before anything is imported. The importer, `ctx.asset` and the rig
   importer (end of this file) are built when the first clean batch exists.

---

## A. Cast (characters)

**Rewritten 2026-10-01 after review.** The first version of this section asked for big round heads, bean
bodies, stick limbs and dot eyes. That copied the most minimal register in the study, and Claude Design did
exactly what it was told, so the results were basic. This version asks for a real character-design brief:
- one recurring cast, designed once with a character bible;
- three rendering treatments of the same people;
- a full model sheet per person;
- an explicit quality bar.

The bean figures stay in code (`runtime/rigs/beans.js`) only as placeholders.

### How to run the character prompts
1. Paste Prompt 0.
2. Paste **Prompt A0 (the character bible)**. It is the shared reference that every character prompt points to.
3. Run **A1 for ONE character first (Maya)** as a pilot, and judge it against the quality bar before ordering
   the other seven. Consistency across a cast is the hardest part; fix the pilot before multiplying it.
4. Run A2 (the second treatment) and A3 (the third) only for the treatments you will actually use.

### Prompt A0: the character bible (paste after Prompt 0, before any character prompt)
```
CHARACTER BIBLE - a recurring cast for workplace training videos. These eight people appear across many videos,
in several visual treatments, so they must be designed as real characters: specific, consistent, believable
adults at work. Not mascots, not stick figures, not generic "corporate people" clip-art.

SHARED DESIGN RULES (all treatments)
- Construction: build every figure from real anatomy simplified with intent - skull and jaw, neck with
  sternomastoid suggestion, shoulders wider than the head, ribcage and pelvis as two masses with a waist
  between them, arms reaching mid-thigh, elbows at the waist line, knees at about half leg height. Weight
  sits on a believable centre of gravity; every standing pose has a slight contrapposto unless the character
  is stiff on purpose.
- Faces: distinct face shapes per person (oval, square, heart, long, round); eyes with an upper lid line, a
  lower lid suggestion, an iris and pupil, one catch-light; eyebrows with thickness and shape that suit the
  person; a nose with a defined bridge and nostril shapes (not a dot or a hook); ears with an inner fold;
  lips with an upper and lower lip shape (not a single line); teeth only when the mouth is open; smile lines,
  eye bags or freckles where they fit the person's age.
- Hair: real volume and a hairline, grouped into 5 to 12 clumps with direction and flow, a shade layer under
  the clumps and a highlight band; hair breaks the head silhouette naturally.
- Clothes: real garments with structure - collars, plackets, cuffs, seams, pockets, buttons, zips, lanyards,
  watch straps; folds at elbows, shoulders, waist and knees where fabric bends (3 to 6 fold lines per garment,
  drawn where the body pushes or pulls the cloth); fabric weight differs (a knit cardigan sags, a blazer holds
  its shape, hi-vis is stiff and crinkles).
- Hands: five fingers with knuckle joints and nails; never mittens.
- Shoes: real shoe types (trainers, boots, loafers, flats) with soles and laces where they exist.
- Colour: each person has a deliberate palette in the character slot families (skin, hair, eye, lips,
  cloth1-3, metal), base + shade + highlight, light from top left.
- Expression range: every face can do neutral, listening, smile, laugh, surprise, concern, doubt, focus,
  realisation, frustration, relief, pride - with brows, lids and mouth working together.
- Diversity done properly: different skin tones (and correct undertones, not just darker grey), hair textures
  (straight, wavy, curly, coily, locs, close-cropped, greying, thinning), body types, ages 22 to 60, one
  person who wears a hijab, one who uses glasses daily; nobody is a stereotype of their group or their job.

THE CAST (names are working names; each line is a brief to design from)
 1 MAYA  - new starter, 23. Slim, 5'4", curious and a little anxious. Heart-shaped face, warm brown skin, dark
   curly hair in a high puff with a few loose curls, small gold hoops. Knit sweater over a collared shirt,
   lanyard with ID badge, chinos, white trainers, canvas tote. Default: eyebrows slightly raised, attentive.
 2 DANIEL - team lead, 41. Broad, 5'11", calm and steady. Square face, light olive skin, short dark hair with
   grey at the temples, trimmed beard. Oxford shirt with sleeves rolled twice, no tie, smart watch, dark
   trousers, brown leather shoes. Default: relaxed, half smile, hands often open.
 3 PRIYA - analyst, 32. Medium build, 5'5", precise and quietly funny. Oval face, medium brown skin, long straight
   black hair in a low ponytail, rectangular glasses. Cardigan over a plain top, slim trousers, flats; often holds
   a laptop or a printed report. Default: thoughtful, one eyebrow ready to rise.
 4 SAM  - customer, 55. Stocky, 5'8", friendly but impatient when things go wrong. Round face, pale freckled skin,
   thinning sandy hair, reading glasses pushed up. Rain jacket over a polo, jeans, walking shoes, a shopping bag or
   a phone in hand. Default: open and chatty.
 5 KOFI - warehouse and field operations, 29. Athletic, 6'0", practical and safety-minded. Long face, deep brown
   skin with cool undertone, short twists, light stubble. Hi-vis vest over a grey hoodie, work trousers with knee
   pads, steel-toe boots, gloves clipped to the belt, a radio. Default: alert, grounded stance.
 6 ELENA - executive, 52. Tall, 5'9", direct and warm. Long oval face, fair skin with fine lines, silver bob cut
   sharp at the jaw. Tailored blazer, silk blouse, slim trousers, low heels, a single statement ring.
   Default: composed, slight forward lean when listening.
 7 AISHA - compliance and audit, 37. Medium build, 5'6", meticulous and fair. Soft oval face, light brown skin,
   navy hijab neatly pinned with a visible fold structure, defined eyebrows, warm brown eyes. Long
   cardigan-jacket, high-neck top, straight trousers, flats, a clipboard or tablet.
   Default: neutral, attentive, never stern.
 8 LEO - engineer, 27. Lanky, 6'1", relaxed and inventive. Long face, East Asian features drawn respectfully,
   messy straight black hair falling over the forehead, round wire glasses. Hoodie with sleeves pushed up, T-shirt,
   headphones round the neck, joggers, trainers, a coffee cup. Default: amused, slightly slouched.

SILHOUETTE TEST: lined up in black fill only, all eight must be recognisable from their outline alone (height,
build, hair shape, one signature item each: tote, rolled sleeves, ponytail and glasses, rain jacket, hi-vis and
radio, bob and blazer, hijab and clipboard, headphones and hoodie).
```

### Prompt A1 (P0): the story treatment, refined (pilot: Maya first, then the cast)
```
Using the CHARACTER BIBLE, draw [MAYA] in the STORY treatment: a contemporary editorial-animation look for
story-driven training videos - stylised but crafted, the quality of a top motion-design studio's character work,
not a children's cartoon.
- Proportions: about 6 heads tall (slightly large head for expression; never a giant ball head), hands and feet
  a touch larger than life for readability.
- Line: a confident outline with VARIED weight - heavier on the outer contour (6 px at 1080p scale), lighter on
  inner details (2.5 to 3.5 px), tapered line ends on folds and hair; outlines in class="lm-outline" so code can
  thin, recolour or remove them.
- Shading: two-tone cel shading (base + shade) with a crisp terminator, plus a thin highlight on hair, nose
  bridge, cheekbone and fabric edges (lm-hi), and soft ambient-occlusion shapes where parts meet (under chin,
  armpits, collar) at low opacity (lm-shade).
- Detail budget at full-body size: all bible details visible - badge on the lanyard, stitching on the tote,
  sweater ribbing at cuffs and hem, laces, earrings. Nothing smaller than 3 px at 1920 x 1080.
DELIVER (a model sheet), each piece a separate SVG or a clearly named <g>:
 a) turnaround: front, 3/4 front, side, 3/4 back, back - same height lines across, 1000 x 2000 box per view, feet
    on anchor_feet;
 b) the rig: the front and 3/4 views split into parts with pivots - head, jaw (for mouth), neck, torso_upper,
    torso_lower (pelvis), upper_arm_l/r, forearm_l/r, hand_l/r (swappable), thigh_l/r, shin_l/r, foot_l/r,
    hair_back, hair_front, accessories (badge, tote) as separate groups; overlapping joints drawn so rotation
    up to the stated limits never shows a gap (shoulder 0 to 170 degrees, elbow 0 to 150, knee 0 to 120);
 c) face kit in head coordinates: eyes (open, half, closed, wide, squint), eyebrows (neutral, raised, frown,
    worried, one up), mouths - 9 lip-sync shapes (rest/M-B-P, A-I, E, O, U, F-V, L, W-Q, smile-talk) and 12
    expressions from the bible list, each as a group;
 d) poses (full body, assembled from the rig): standing idle, walking (4 key frames), sitting at a desk typing,
    sitting back thinking, pointing at something screen right, presenting with an open palm, holding a phone and
    reading, on a phone call, shrugging, arms crossed, hand on chin, cheering, worried with hand at the neck,
    talking with both hands, handing over a document, leaning on a desk, waving, listening and nodding;
 e) hands: 20 hand poses (open, relaxed, point, thumb up, fist, pinch, holding phone, holding cup, holding
    paper, holding pen, typing, counting 1 to 5, OK sign, wave, palm up offering, palm out stop), left and right;
 f) a colour callout panel listing every slot used and where.
QUALITY BAR - reject and redraw if any of these is true:
 the head is wider than the shoulders; eyes are dots or plain circles; the nose is a single dot or line; hands
 are mittens or have fewer than four visible fingers; clothes have no folds or seams; the hair is one flat
 shape; the face could belong to any of the other seven; the pose is stiff and symmetrical; line weight is
 uniform everywhere; the character looks like clip-art or a children's app.
After Maya is approved, repeat for DANIEL, PRIYA, SAM, KOFI, ELENA, AISHA, LEO with the same sheet, keeping the
same proportions system, line weights and shading rules, so they stand together as one cast.
```

### Prompt A2 (P1): the presenter treatment (semi-realistic flat editorial)
```
Using the CHARACTER BIBLE, draw the same eight people in the PRESENTER treatment, for documentary-style
explainers: semi-realistic flat vector illustration like high-end editorial and magazine illustration.
- Natural adult proportions (7 to 7.5 heads), real facial structure with planes of the face suggested by 3 to 4
  flat tone shapes (no outlines, or a very thin same-hue line only on the jaw and hands).
- Skin built from base, shade, highlight and deep shade; hair as layered tone shapes with flow; clothing with
  value shapes for folds and fabric texture suggested by pattern (knit rib, denim seam, blazer lapel roll).
- Lighting: a key light from top left and a cool rim light from behind on hair and shoulders (lm-hi).
Deliver per person: waist-up front and 3/4 (for host-to-camera and interview framing), full body front, the face
kit from A1 c), and 10 poses: talking to camera, pointing at a diagram on screen right, two-hand explaining,
holding a tablet and showing it, listening in an interview, walking and talking, sitting in an interview chair,
reacting surprised, laughing, thinking with hand at the chin. Same quality bar as A1, plus: the face must read as
a real, specific adult at 1080p in a waist-up shot; no plastic-doll smoothness, no uncanny realism.
```

### Prompt A3 (P2): the cinematic treatment (painted light, for the 2.5D depth stage)
```
Using the CHARACTER BIBLE, draw MAYA, DANIEL and ELENA in the CINEMATIC treatment for moody 2.5D scenes (night
office, dawn window): the A2 construction, rendered with dramatic light - a single warm key from one side, a cool
fill, strong cast shadows on the face and clothes as separate shape layers, a bright rim light, and a soft
painted texture on large areas (a subtle brush grain allowed as a pattern, no raster images). Deliver full body
3/4 and waist-up 3/4 in three lighting setups (warm key left, warm key right, backlit silhouette with rim), each as
layers: base, shadow, light, rim, so the depth stage can relight them by changing layer opacity.
```

### Prompt A4 (P0): background people, still crafted
```
Design 16 background people in the A1 STORY treatment at mid detail: real proportions and clothing, simplified
faces (eyes and brows as small shapes, no mouths needed), fewer folds. Mix of ages, builds, skin tones, hair and
workwear (office, retail, warehouse, clinic). Each in two versions: full colour, and a desaturated "background"
version in the muted slots that recedes behind the cast. Front, 3/4 and back; 4 standing and 4 seated poses
across the set; a few holding a phone, a coffee, a box, a bag. They fill rooms and crowds without drawing the eye,
but must not look like faceless blobs.
```

### Prompt A5 (P1): close-up portraits for emotional moments
```
Design head-and-shoulders portraits of all eight bible characters at 1200 x 1200 in the A1 STORY treatment, the
most detailed pieces in the library: individual eyelashes as 3 to 5 strokes, iris with a darker rim and a
catch-light, lip highlight, skin shade planes on forehead, cheek and jaw, hair strand groups, collar and fabric
detail. Each portrait carries the 12 expressions and 9 mouths as layers, and eyes and brows as separate groups
so they can blink and move. These are for the close shot where a face must carry the moment (a realisation, a
worry, relief), so the expression must be readable and specific, never generic.
```

### Prompt A6 (P1): pictogram people for diagrams (deliberately simple)
```
Design a pictogram family for diagrams only (not for story scenes): person, two people, team of four, customer,
manager, engineer, auditor, new starter, remote worker (person with laptop), crowd of nine. Geometric and
consistent like a good public-signage icon set: a circle head, a shaped torso with shoulders, optional role
markers (headset, hard hat, clipboard, laptop), 120 x 160, one fill slot (accent), optional outline layer.
Plus a "highlighted" variant (a ring around) and a "faded" variant (muted slot). Simple is correct HERE because
these sit inside charts and flows; they are symbols, not characters.
```

---

## B. Sets (places, in depth layers)

### Prompt B1 (P0): workplace interiors
```
Design 8 interior sets at 1920 x 1080, each as depth layers <g id="back">, <g id="mid">, <g id="front">, with
a clear floor line (anchor_floor_y), empty wall areas marked as slot_wall_<n> for signs and screens, and
furniture anchors (desk_top, seat, screen_centre). Leave the middle third of the frame free enough for two
characters to stand.
 1 open-plan office (desks in rows, plants, a window wall)    2 meeting room (table, screen on wall, chairs)
 3 break room / kitchen (counter, mug rack, fridge)            4 reception (desk, sofa, door)
 5 call centre row (headsets, partitions)                     6 home office (desk, window, shelf)
 7 training room (rows of chairs, a screen, a flip chart)      8 server room (racks, cable trays, cool light)
Each in two moods using slots only: day (surface2 walls) and evening (walls in field2, lit windows accent4).
```

### Prompt B2 (P0): work sites and public places
```
Design 8 more sets, same rules as B1: warehouse aisle (racks, pallets, a forklift silhouette), factory floor
(machines, conveyor), retail store counter (till, shelves), hospital or clinic corridor, city street with shop
fronts, a town-hall stage (curtains, lectern, spotlight shape in an lm-hi layer), a lift lobby / corridor (for
transitions between rooms), and an outdoor car park. Back layers simple, front layers sparse (a plant, a post)
for parallax.
```

### Prompt B3 (P1): screen-in-scene frames
```
Design frames where a screen IS the scene: a video-call grid (2, 4 and 6 tiles, each tile a slot with a
nameplate slot), a laptop seen over a shoulder, a phone held in a hand (slot_screen), a browser window, a chat
app window (bubbles as slots), an email client (slot_subject, slot_body). Flat, no outlines needed; an
outline layer optional.
```

---

## C. Props (the information lives on them)

### Prompt C1 (P0): documents and paperwork
```
Design props that carry words or numbers, each with text slots, 3/4 view and front view: contract (with
signature line), policy page (title slot, 4 line slots, highlight slot), invoice, receipt, form with checkboxes
(each checkbox a group so code can tick it), checklist on a clipboard, sticky note, ID badge on a lanyard,
envelope, sealed letter, a folder with a tab, a stamp (APPROVED area as slot), a calendar page (slot_day,
slot_month), a flip calendar (pages as separate groups).
```

### Prompt C2 (P0): devices and screens
```
Design devices with screen slots, front and 3/4: laptop, desktop monitor, phone, tablet, card terminal,
headset, desk phone, printer, projector screen, a wall TV, a dashboard monitor with three widget slots.
```

### Prompt C3 (P0): money, value and time
```
Design: coins (stack, single), notes (stack, fan), a payment card (no brand), price tag on a string
(slot_price), a ledger book open (8 line slots), a calculator, a safe, a piggy bank, a wallet; a wall clock (hand
groups with pivots), a stopwatch, an hourglass (sand as a group to animate), a calendar, a deadline flag.
```

### Prompt C4 (P0): status and measurement
```
Design instruments whose moving parts are separate groups with pivots, so code drives them: a gauge (needle,
3 zone arcs in pos/accent4/neg slots), a thermometer (fill bar), a battery meter, a traffic light (3 lamps), a
progress bar, a speedometer, a balance scale (beam and two pans), a target with an arrow, a funnel with three
stages.
```

### Prompt C5 (P1): safety, security and risk
```
Design: padlock (shackle as a group), key, shield, badge reader, CCTV camera, warning sign triangle
(slot_symbol), wet-floor cone, barrier tape, first-aid kit, fire extinguisher, hard hat, hi-vis vest, gloves,
goggles, a door with an access panel, a spam / phishing email (envelope with a hook).
```

### Prompt C6 (P1): office and logistics
```
Design: desks (single, L-shaped, standing), office chair, filing cabinet (drawers as groups), whiteboard on a
stand (slot_board), flip chart, bookshelf, plant (3 sizes), coffee mug, water cooler, cardboard box (open,
closed), pallet, hand truck, delivery van side view, conveyor segment (tiles to loop).
```

### Prompt C7 (P1): buildings and places (flat and isometric)
```
Design 10 buildings, each as a flat front view AND a true-isometric view (30 degree axes), with a nameplate
slot: head office tower, bank, factory, warehouse, shop, school, hospital, data centre, government building,
house. Isometric versions sit on a 2 x 2 tile footprint with anchor_base.
```

---

## D. Metaphor kits (one picture the whole lesson lives in)

### Prompt D1 (P1): ten metaphor worlds
```
Design ten small kits (6 to 10 pieces each) for governing metaphors in training videos; every kit has a base
scene and parts that move separately:
 1 harbour (boats, lock gates as groups, lighthouse with a beam in lm-hi)   2 bridge being built (sections)
 3 maze (walls as tiles, a marker)                                          4 machine of gears (gears with pivots)
 5 iceberg (above / below water parts)                                      6 pipes and valves (valves rotate)
 7 dominoes in a line (each tile a group)                                   8 a tower of blocks (removable blocks)
 9 mountain path with checkpoints (flags as slots)                          10 garden (seed, sprout, plant stages)
Usable in outlined (with lm-outline) and flat (layer hidden) treatments.
```

### Prompt D2 (P2): a low-poly isometric world
```
Design a low-poly isometric island set for system metaphors: grass tiles, water tiles, trees (3), mountains
(2), a village, a city cluster, a road, a bridge, a port, a boat, a small submarine, a lighthouse, clouds. Faces
as flat polygons in slot colours with the lm-shade layer for the shaded faces. Tiles snap to a 1-unit grid.
```

---

## E. Diagram parts (presenter-pop and chalk-lab)

### Prompt E1 (P0): labels, callouts and verdicts
```
Design: pointer pill labels (pointing right, left, up, down) with a text slot, a callout with a leader line
(the line as a separate path), verdict badges (tick in a circle, cross in a circle, question mark, warning),
step number discs (1 to 9 as a template, the number is a slot), a highlight marker sweep (hand-drawn, as a
path to draw on), a hand-drawn circle and underline (paths to draw on), arrows (straight, curved, hand-drawn
curved, double-headed), brackets and braces.
```

### Prompt E2 (P0): source excerpt card
```
Design a "source on screen" card: a document page excerpt with a header slot (title), 6 line slots, one
highlight band behind any one line (a rect the engine moves), a page-number slot and a soft paper edge. Two
versions: a light page and a dark-mode page. It shows the learner the real line from the policy being
taught.
```

### Prompt E3 (P1): board parts for chalk-lab
```
Design technical-board parts on a near-black ground, thin strokes (stroke-width 2): a glass sphere with axis
lines (Bloch-like, for any two-state idea), tinted glowing boxes (border in an accent slot with a soft outer
glow allowed via a second wider low-opacity stroke), a node-and-edge kit, an axis kit with ticks, an energy-
level ladder, a timeline with tick marks, a dotted grid tile, a chalk-grain texture tile (subtle, tileable).
```

---

## F. Texture, frames and motion pieces

### Prompt F1 (P1): textures and cards
```
Design tileable textures at 512 x 512, very subtle: paper grain, cardboard, chalkboard grain, halftone dots,
brush wash. Plus title-card frames: a black narration card frame, a chapter card with a number slot, a quote
card with a portrait slot, a lower-third nameplate (slot_name, slot_role) in three widths.
```

### Prompt F2 (P2): micro-animations (Lottie, token colours)
```
Design 12 short looping or one-shot animations as Lottie JSON, using only the colour slots from the contract:
tick drawing on, cross drawing on, alert pulse, typing dots, loading ring, coin flip, clock hands turning,
envelope opening, padlock closing, confetti burst, a sparkle, a heartbeat line. 1 to 2 seconds each, 60 fps,
no expressions, no images.
```

---

## G. For the styles that are coming
- **TED-Ed register** (files coming): expect painterly and hand-drawn treatments. After the study, add prompts
  for alternative layers (`lm-paint`: a texture-filled version of the same shapes) so the same assets can carry
  a painterly look.
- **Era and mood variants for story-cartoon:** sepia, grey doodle and night. These are pack work, not new
  drawings, because the contract keeps colour in slots.

### Added after the TED-Ed and Kurzgesagt study (2026-10-01)

**Why these four.** They come from what the two studies measured:
- TED-Ed fills its frames with a textured ground chosen from the subject's material (covered 0.71 to 0.91,
  grain about 1.0).
- TED-Ed and Kurzgesagt both personify mechanisms.
- Kurzgesagt's stress video pictures the modern workplace as a threat.

Sources: `docs/research/teded/2026-10-01-teded-study.md` and `docs/research/kurz/2026-10-01-kurzgesagt-study.md`.
Paste Prompt 0 first, as always.

#### Prompt G1 (P1): material grounds, chosen per subject
```
Design six tileable ground textures, 1024 x 1024, seamless on all edges, each in two layers: a base field
(one slot colour, surface or surface2) and a texture layer drawn in ink #101010 at fill-opacity 0.04 to 0.10
only, so a style can recolour and fade it. The six: aged parchment (fibres, faint stains, darker edges as a
separate optional layer id="edge_burn"), cold-pressed gouache paper (tooth and soft wash blooms), crayon on
paper (directional wax strokes), weathered stone (pits, hairline cracks), blueprint grid paper (fine grid plus
major lines in line #606060), and woven cloth. No shapes that read as objects; nothing that repeats visibly at
1/2 size. Quality bar: put each at full frame behind a single flat character; it must read as a material,
never as noise. Redraw any that look like a filter.
```

#### Prompt G2 (P1): the painterly layer for existing assets (`lm-paint`)
```
For each asset I attach (props and sets from sections B and C), add one group with class="lm-paint": the same
shapes re-drawn as loose painted strokes and dry-brush edges in the SAME slot colours, so a painterly style can
show lm-paint and hide the flat fills, and a flat style does the reverse. Keep every id, slot and anchor
unchanged and in the same place. Strokes stay inside each shape's silhouette by at most 3 px. Quality bar: the
painted version must be recognisably the same object at 1/4 size, and must not look like a photo filter.
```

#### Prompt G3 (P0): the modern workplace as pressure (stressor and calm kit)
```
Design an original kit of workplace pressure props, each in two states as separate groups, id="calm" and
id="pressing", so a scene can switch one into the other:
an email envelope (pressing: corners sharpened, an aggressive tilt, a glow halo shape in accent at
fill-opacity 0.3), an inbox counter badge (slot_count), a calendar with a deadline circled (slot_date), an
alarm clock (pressing: shaking lines), a stack of papers (pressing: three times taller, leaning), a ringing
phone, a headset, a wall of sticky notes, a progress bar stuck near the end (slot_label), a bill with a
total (slot_total), a traffic jam tile (top-down, 6 cars).
Plus the calm counterparts: a cup with steam, a plant, a walking path tile, a closed laptop, a window with
sky. And one "ancient threat" silhouette: a generic large predator shadow, original, side view, as a single
flat shape for an overlay at fill-opacity 0.5. Quality bar: the pressing state must read as pressure from the
silhouette alone at 1/4 size, without any face, text or colour change.
```

#### Prompt G4 (P1): personified mechanisms (a small guide and faces for things)
```
Part 1. A small guide figure for walking INSIDE diagrams: 120 px tall at the given viewBox, using the
character slot families, in the same construction as the cast bible but simpler for small size. It comes
in three outfits (lab coat, hi-vis vest, office cardigan), with props: a torch whose beam is a separate
group id="beam" (a flat cone in surface at fill-opacity 0.6), a magnifier, a clipboard, a measuring tape.
Parts with pivots: head, torso, upper and lower arms, hands, legs. Poses: walk (4 frames), point, shine
the torch, look up, shrug.
Part 2. A face kit to attach to any object (a document, a server, a cell, a lung, a coin), drawn on its
own, centred on anchor_face: 8 eye pairs (neutral, worried, determined, sleepy, surprised, angry, smug,
dizzy) and 8 mouths, in ink and surface only, so they sit on any colour. Quality bar: a plain rounded
rectangle with the face attached must show each emotion clearly at 80 px wide.
```

## Engine work this needs (not built)
0. **Built (2026-10-01):** `tools/asset_intake.py` is the contract check and intake step (see "Getting the files
   back"). The importer below will reuse its checks rather than repeat them.
1. **`loom assets import <file|folder>`:** validates the contract (slot colours only, including the character
   slot families with base, shade and highlight; classes, slots, anchors, sizes) and rejects what breaks it. It writes `assets/library/<kind>/<id>.svg` plus a `.json` with tags, slots,
   anchors and pivots.
2. **A runtime `ctx.asset(name, id, o)`:** places an asset, recolours its slots from the pack, shows or hides
   `lm-outline` and `lm-shade` per shading, and fills its text slots through `kit.text`, so the text gates
   apply.
3. **A rig importer:** turns an A1-style part set with pivots into a `Loom.rig.define` entry, so drawn
   characters act exactly like `ava` and `pip`.
4. **Catalog entries and selection tags,** so the storyboard stage can ask for "a meeting room, evening" or
   "a gauge" by need rather than by file name.
5. **Candidates from the TED-Ed and Kurzgesagt study (2026-10-01), not built.** Each is code, not a drawing;
   build one only if lessons keep reaching for it (the library promotion rule):
   - a two-panel comparison frame that returns with one new value each time (Kurzgesagt's Earth/Hestia pair);
   - a full-frame lettered term card (TED-Ed), the companion of `ctx.narrationCard`;
   - a diagonal strip-panel transition for a list of small scenes.

## Reviewing a character delivery (added 2026-10-01, D-86)
1. `py tools/asset_intake.py <zip> --batch <name>`. Read `assets/incoming/<name>/INTAKE.md`.
2. Copy the delivery's `engine/` scripts into `assets/incoming/<name>/_engine/`.
3. `py tools/rig_review.py assets/incoming/<name>`.

The review assembles every pose the delivery defines from the delivered files, runs the joint test, measures the
expressions, and sheets the turnaround and hands (into `cache/review/<name>/`). Write the review from those sheets:
`docs/assets/reviews/2026-10-01-maya-v2.md` is the model.

**A delivery without engine scripts (Maya v3, 2026-10-02, D-89):** if the review page carries its builds as data
(`<script id="loom-builds">`), copy the page (`index.html`) into `assets/incoming/<name>/_page/` instead, or pass
`--page`. `rig_review.py` rebuilds every build, and every figure baked into the page, from the delivered part
files, and `--zoom bN@x,y,w,h` makes close-ups. Model: `docs/assets/reviews/2026-10-02-maya-v3.md`. A delivery
that declares its own `base_slots` {name: hex} in the manifest can be imported with `asset_intake.py
--declared-slots`, which maps those hexes to the contract's (opt-in; each remap is listed).

---

## Hands kit (D-114, added 2026-10-06)

`runtime/hands.js` stages hands as presenters (enter from an edge, point, count, carry an object in and leave it,
exit) but code may not draw them (D-102), so until this art arrives the runtime draws an abstract PLACEHOLDER set
and warns `hands_placeholder`. The contract is `assets/hands/README.md`; the prompt below restates it so it can be
pasted alone. Deliver one family per look family; P0 is `cartoon` (illustrated packs) and `flat` (editorial).

### Prompt H1 (P0): hands as presenters, three families
```
Design a set of HANDS that present things in an explainer video. Original designs, no resemblance to any
existing studio's style. Three families, each a complete set of 13 poses:

FAMILY "cartoon" (for illustrated looks): flat colour, a soft dark outline (class hand-line, fill none, round
joins, stroke about 6 units), rounded simplified fingers, 4 fingers allowed, one shade shape on the side away
from the light (light from the upper left).
FAMILY "flat" (for corporate and editorial looks): flat colour, NO outline, realistic adult proportions,
5 fingers, one subtle shade shape, short clean nails (class hand-nail).
FAMILY "line" (for technical looks): one line weight, line only (class hand-line), no fill except the sleeve.

POSES (one SVG per pose, file name = pose): point (index extended, others curled), tap (index slightly bent,
about to touch a screen), pinch (thumb and index meeting), hold (palm up, cupped, carrying an object that is
NOT drawn), place (palm forward, fingers out, setting an object down that is NOT drawn), grab (fist around a
handle that is NOT drawn), open (open palm to the viewer, fingers together), thumbs (thumb up), count1, count2,
count3, count4, count5 (that many fingers raised, the rest folded).

GEOMETRY for every file:
- viewBox="0 0 400 640"; the hand enters from the BOTTOM: fingers point up, the forearm in a plain sleeve
  (with a simple cuff) runs straight down to the bottom edge of the viewBox, square and centred.
- the sleeve is 150 units wide where it meets the bottom edge, centred at x = 200.
- keep the wrist at the same place and the hand the same size in every pose, so swapping poses does not jump.
- on the root <svg>: data-anchor="x y" (point and tap: the index fingertip; pinch: the pinch point; hold and
  place: the centre of the carried object; grab: the centre of the grip; open, thumbs, count1-5: the palm
  centre), data-wrist="200 640", data-wrist-width="150", data-licence="in-house", data-author="<your name>".

COLOUR: every filled shape has exactly one class, and the colours you draw with will be replaced:
hand-skin, hand-skin-shade, hand-nail, hand-sleeve, hand-sleeve-shade; outlines are class hand-line with
fill="none". Draw with a mid skin tone (#D19B72) and a mid blue sleeve (#2563EB) so it reads during review.
Skin works for every tone in the list #F1CCA7, #D19B72, #A36B47, #744A31 (check that the shade still reads on
the darkest).

RULES: no gradients, no filters, no images, no text, no ids needed; under 20 KB and under 300 nodes per file;
paths merged per class. Deliver as assets/hands/<family>/<pose>.svg plus a LICENSE.txt per family.
Then show all 13 poses of each family on one sheet, each with a small cross at its data-anchor, so the anchors
can be checked by eye.
```

Review: drop the folder into `assets/hands/<family>/`, run the contract check (`python3
tests/suites/primitives_material_footage_hands.py hands`; it reads every family the same way `embed_hands()` does), then, once the lab
bundles `assets/hands` (wiring in `docs/primitives/hands.md`), render `python3 -m loom lab lab_hands` with `family`
switched to the new family and look at the strip: anchors on target, no jump on a pose swap, the sleeve meeting the
frame edge.
