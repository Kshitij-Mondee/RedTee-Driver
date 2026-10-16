# Set references: real-world facts for the factory world (2026-10-15)

STATUS: DONE (2026-10-15). Research for `packs/worlds/factory.json` (brief 2, D-156). Web search and page reads only:
nothing downloaded, page text treated as data. (s) = from a search summary, the page itself not read. Dates read:
2026-10-15. No brands are drawn: makers' pages were used for sizes and parts only.

## 0. The place (our choice)

One specific plant: a water-based paint plant (filling hall, process hall, a block between them with the control room,
welfare rooms and the PPE lobby). Chosen because one coherent site carries every imagined moment: machine guarding and
lockout on a filling line, a quality defect on tins, a near miss at a line-side board, PPE at the hall door and a
process alarm in a control room that watches mixing vessels.

| Fact used | Source |
|---|---|
| Paint plants disperse pigment in high-speed dispersers, then let down, tint and check, then fill into tins or pails, lid, check-weigh, label and palletise | (s) https://mill.globecore.com/?p=2584 ; (s) https://www.zonadepinturas.com/en/more-in-depth/paints-and-coatings/12478-manufacture-of-emulsified-paints.html.md ; (s) https://santint.com/about/news/santint-latex-paint-and-stone-paint-filling-line-are-delivered-successfully!.html |
| Fillers for paint are volumetric piston or net-weigh; lids are placed and pressed by machine or by hand; check-weighers sit after filling and lidding | (s) https://pcimag.com/articles/103421-how-liquid-filling-machines-benefit-the-paint-and-coatings-industry ; (s) https://www.minebea-intec.com/in/expertise-and-knowledge/our-references-and-best-practices/high-precision-checkweighing-for-renowned-paint-and-render-manufacturer-thanks-to-innovative-special-solution-from-minebea-intec |

Not verified: the 2.5 L tin's size (about 0.19 m across and 0.2 m tall) is from memory of common tin sizes, not a
source. The hall sizes (60 by 30 m, 8 m eaves, 7.5 m frame bays) are design choices in the range of the warehouse
research (docs/research/2026-10-13-sets-warehouse.md, section 1).

## 1. Machine guarding and emergency stops

| Fact | Source |
|---|---|
| ISO 13857: protective structures lower than 1400 mm need extra measures; the gap between floor and guard no more than 180 mm (ISO 11161 allows 200 mm for integrated systems); a 50 mm mesh opening needs about 850 mm from the hazard | (s) https://www.troax.com/app/uploads/Brochure-Safety-Guide_EN.pdf ; (s) https://axelent.co.uk/world-of-axelent/knowledge/faq-maximum-gap ; (s) https://occupli.com/?p=103998 |
| Emergency stops: a red mushroom head on a yellow background (ISO 13850 and IEC 60947-5-5 as cited by makers), latching, twist or pull to release; mounted where operators can reach and see them; an emergency stop is not a safeguard | (s) https://www.mouser.com/datasheet/2/1437/111880-3079040.pdf ; (s) https://directory.newequipment.com/classified/30-mm-mount-emergency-stop-buttons-77721.html |
| Stack lights (andon towers): green normal running, amber attention or help needed, red stopped; any operator can raise an andon call | (s) https://business.adobe.com/blog/basics/what-is-andon-lean-manufacturing ; (s) https://www.wolfautomation.com/products/stack-lights/?page=5 |

Not verified: no source gave a mounting height for emergency stops; the brief's 1.0 to 1.3 m is a design choice inside
normal reach. The 2.0 m perimeter fence and 0.15 m floor gap follow the summaries above, not the standard's tables.

## 2. Isolation and lockout

| Fact | Source |
|---|---|
| HSE HSG253 is the guidance on safe isolation of plant; PUWER regulation 19 requires a means of isolating work equipment from every energy source | (s) https://www.hse.gov.uk/Pubns/books/hsg253.htm ; (s) https://www.hse-network.com/energy-isolation-under-puwer-where-most-manufacturers-still-fall-short/ |
| Each person working applies their own individually keyed lock and a danger tag; identify every energy source, isolate, dissipate stored energy, then work | (s) https://www.adelaide.edu.au/hr/ua/media/4836/appendix-d-plant-tag-and-lockout-procedure.pdf ; (s) https://www.curtin.edu.au/healthandsafety/wp-content/uploads/Lock_Out_Tag_Out_Guideline.pdf |
| Rotary main isolators: a red handle on a yellow plate, lockable in OFF with a padlock | (s) https://uk.rs-online.com/web/p/rotary-handles/6867367 ; (s) https://eshop.se.com/za/direct-rotary-handle-compact-nsxm-red-handle-on-yellow-front-ip40-lv426931t.html |
| Lockout stations: wall boards holding red padlocks, hasps and tags | (s) https://www.screwfix.com/p/essentials-10-padlock-lockout-station/133ly |

Not verified: the IEC 60204-1 height band for the isolator handle (often quoted as 0.6 to 1.9 m) was not found in a
source; the brief uses 1.2 to 1.6 m, inside it.

## 3. Floors, walkways and signs

| Fact | Source |
|---|---|
| HSE: pedestrian-only and vehicle-only areas clearly marked; crossing points marked, protected and enforced; markings renewed when they fade | (s) https://www.hse.gov.uk/workplacetransport/factsheets/pedestrians.htm ; (s) https://www.hse.gov.uk/WORKPLACETRANSPORT/information/safeworkplace.htm |
| UK law sets no colour scheme for floor markings (yellow walkway lines are a convention) | (s) https://www.fastlineservices.co.uk/resources/warehouse-line-marking-regulations-uk |
| ISO 7010 mandatory signs: blue disc, white symbol; M003 ear protection, M004 eye protection, M008 safety footwear, M009 gloves | (s) https://en.wikipedia.org/wiki/ISO_7010 ; (s) https://www.caledoniasigns.co.uk/Mandatory-Symbols |

Not verified: no source gave a standard layout for a PPE point at a hall entrance; the lobby with a dispenser, a
signs board beside the door and a striped line on the floor is our design from common practice.

## 4. Control room

| Fact | Source |
|---|---|
| ISO 11064-4 covers seated control workstations; most-used screens sit slightly below eye level; a slightly curved row of four screens per position is a common layout; off-workstation overview displays are part 3 | (s) https://www.iso.org/standard/54419.html ; (s) https://autorepair99.centralindia.cloudapp.azure.com/automotive/control-room-design-guidelines.html |

Not verified: no source on glare was found; the brief keeps windows at 90 degrees to the screens, as the office
world does for DSE (HSE guidance read for the office).

## 5. Scenes kept and dropped (D-156)

Lesson moments imagined: lockout before clearing a lidder jam; reaching past an open guard; using and resetting an
emergency stop; a tin with a badly seated lid found and quarantined; a fill-weight check; a near miss reported at the
team board; an andon call; a start-of-shift huddle; PPE at the hall door; a visitor issued PPE; a high-level alarm in
the control room; control-room handover.

Kept (all five version 1 ids, each now one specific place in the paint plant): `production_line` (the line-side team
area of filling line 1), `machine_close` (the lidder on filling line 2 and its isolator), `quality_bench` (the
line-side quality station and quarantine cage), `control_room`, `ppe_station` (the PPE lobby). None dropped: every
imagined moment needed one of them, and no transition or generic room was added.

Camera numbers for every scene come from `tools/set_camera.py`; specs and outputs are in
`docs/assets/plan_checks/factory/`. Where a head's line of sight passes over a low conveyor to the wall behind, the
crossing points are stored as extra points (`L_ray_line_front`, `O_ray_line_front`, `O_ray_backwall`).
