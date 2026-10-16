# Set references: real-space facts for the office world and craft rules per style (2026-10-09)

STATUS: SHIPPED 2026-10-09. Asked by Kshitij: "look for each scene reference online. I want all scenes to be flawless,
nothing absurd". Two research sub-agents, web search and page reads only (nothing downloaded; page text treated as data).
Used in `packs/worlds/office.json` (identity, scale, every scene) and `packs/set_styles.json` (layout_rules and each
style's render rules). (s) = from a search summary, the page itself not read; everything else was read.

## 1. Converted mill: structure and scale

| Fact used in the brief | Source |
|---|---|
| Mill bays about 6.7 m by 4.7 m; upper spinning floors 4.19 to 4.34 m high | https://en.wikipedia.org/wiki/Broadstone_Mill,_Reddish |
| 1920s mills moved to steel frames; steel columns with timber floors plausible | (s) https://manchestervictorianarchitects.org.uk/buildings/sir-john-holdens-mill-astley-bridge |
| Steel sash about 1.8 m by 2.1 m, 20 panes of about 36 by 51 cm, one centre-pivot hopper per window | https://www.nps.gov/orgs/1739/upload/tech-note-windows-02-insulated-glass-steel-windows.pdf |
| Restored sash painted dark (one project: dark green) | https://www.nps.gov/orgs/1739/upload/tech-note-windows-17-repair-steel-windows.pdf |
| A timber-joisted floor is boards or a thin screed, not a poured slab: the brief now uses sanded boards | (s) https://www.gyvlon.co.uk/uploads/Document/cs031---brownsfield-mill.pdf |
| Sprinklers in heritage mills are exposed pipework, no suspended ceilings | (s) https://www.zurich.co.uk/news-and-insight/how-zurich-is-protecting-234-years-of-history |
| New glass partitions run past the old columns without touching them | (s) https://divisare.com/projects/424047-varchi-valentina-ronzoni-architetto-giacomo-de-vecchi-borghi-1819 |

Not verified: sill height (0.9 m in the brief is a design choice), corridor width, how high glass boxes stop in a 4.2 m
space (the brief's birch-ply lid at 2.8 m is a design choice).

## 2. Per scene

- **Meeting room for 8:** table about 2.4 to 3.0 m by 1.07 m, three a side and one at each end; room about 4.3 by 4.9
  to 5.5 m; 65 to 75 inch screen on the short wall, centre 1.2 to 1.4 m; floor box or grommet for power
  (https://www.findofficefurniture.com/plan/conference-room-8-people.html). Glass manifestation at 850 to 1000 mm and
  1400 to 1600 mm (s, https://designingbuildings.co.uk/wiki/Glass_manifestation).
- **Open plan:** 1600 by 800 mm per person, back-to-back cluster of four 3200 by 1600 mm, desks 720 to 740 mm (s,
  vendor); main aisle about 1.5 m (s, guide figures vary); HSE 11 m3 per person
  (https://www.hse.gov.uk/contact/faqs/roomspace.htm).
- **Desk:** screen top near eye level at arm's length (s, https://www.hse.gov.uk/MSD/dse/good-posture.htm); screen at
  90 degrees to the window, never facing it or with it behind (s, Exeter DSE guidance). The first brief put the window
  behind the monitor: fixed.
- **One-to-one:** conversation distance 80 to 120 cm, side table 50 to 60 cm high (s, retailer; sources disagree).
- **Kitchen:** worktop 900 mm, dishwasher beside the sink, boiling-water tap (s).
- **Reception:** gate lanes 550 to 650 mm plus one about 900 mm wide lane (s); two-height desk, standing 950 to 1100 mm and
  seated about 750 mm (s, BS 8300-2 as quoted).
- **Corridor:** door clear width 800 mm (s); extinguisher handle about 1.0 m (s); exit signs above doors 2.0 to 2.5 m (s).
- **Corner office:** about 13 to 14.5 m2, desk, two visitor chairs, small table (s).
- **Training room:** 1.8 to 3.0 m2 a person; side aisles about 1.1 m; 1.2 m before the front row (s, vendor).
- **Night:** exit signs are maintained (always lit), emergency lights non-maintained (off) (s).

Absurdities the briefs now forbid: a 2.7 m tiled ceiling in a mill; big modern panes; uneven columns or columns inside
glass; glass with no bands; a table too short for eight; screens facing or backlit by windows; one-width gates; a
single-height reception desk; extinguishers on the floor; kitchen appliances away from the sink.

## 3. Craft rules per style (summarised into packs/set_styles.json)

- **Layout, all styles:** layout is cinematography; far, mid, near and space for characters; a low horizon; lead the eye;
  backgrounds that do not merge with characters; paint behind objects for parallax
  (https://disneyanimation.com/process/layout/, https://brentandmax.com/tips-for-drawing-backgrounds/,
  https://www.rmcad.edu/blog/the-art-of-background-design-in-animation/,
  https://blog.motionarray.com/learn/after-effects/animate-flat-2d-images-after-effects/).
- **Flat editorial:** geometric construction, opaque fills, separation by tone not transparency, minimum shape and gap
  sizes (https://www.ibm.com/design/language/illustration/flat-style/design); cast shadows or objects look pasted in
  (https://www.creativebloq.com/art/digital-art/quick-tips-to-bring-interiors-to-life-how-colour-light-and-texture-can-transform-your-digital-art).
- **Story cartoon:** construct from the horizon; cheat props toward camera; empty sets and high horizons fail
  (brentandmax.com).
- **2.5D:** paint behind every moving piece; distance lighter, cooler, less detailed
  (https://binus.ac.id/bandung/dkv/2025/11/04/backgrounds-that-breathe-creating-depth-in-flat-worlds/). Relighting by layer
  is our own design: no source found.
- **Painterly:** limited palette (4 to 6 plus white), tone before colour, hard edges only at the focus
  (https://bristle.studio/tutorials/take-your-gouache-painting-to-the-next-level/); window light cool, lamps orange
  (Gurney, http://gurneyjourney.blogspot.com/2018/12/paint-your-kitchen-or-friends.html).
- **Ink and wash:** outside-in, one decisive line, heavier near and underneath, white kept
  (https://chriswilsonstudio.com/pen-and-ink-urban-sketching/,
  https://www.artistsnetwork.com/art-mediums/sketching-techniques-drawing-from-the-outside-in/).
- **Line art:** three weights by depth, single strokes, overlapping corners
  (https://www.protradecraft.com/video/13-architectural-drawing-tips).
- **Isometric:** grid snapping, one light and shadow type, wall thickness and reveals
  (https://www.ibm.com/design/language/illustration/isometric-style/design,
  https://learn.corel.com/tutorials/how-to-create-an-isometric-illustration-in-corel-vector/).
- **Glow at night:** the emitter is the focus, falloff, designed darks (https://tips.clip-studio.com/en-us/articles/11478,
  https://watercolourworkout.substack.com/p/glow-in-the-dark).
- **Semi-real behind a presenter:** background tells the story, softened, never far darker than the subject, a practical
  lamp on the key side (https://www.abelcine.com/articles/blog-and-knowledge/tutorials-and-guides/staging-and-lighting-an-interview-with-rubidium-wu).

Limits: these are text references. No images were looked at or downloaded (downloads need Kshitij's approval); the visual
proof is the first Claude Design delivery, reviewed against the reject lists.
