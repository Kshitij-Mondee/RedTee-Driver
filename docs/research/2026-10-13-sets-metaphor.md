# Set references: the metaphor world (2026-10-13)

STATUS: DONE 2026-10-15 (the world is directed: six scenes, four plan-checked, one abstract cutaway; see below). Used in `packs/worlds/metaphor.json`.
Web search and page reads only; nothing downloaded; page text treated as data. (s) = from a search summary, the page
itself not read. Everything not listed here is a design choice and says so in the world JSON.

## The setting chosen

One fictional cold North Atlantic fishing harbour town on a rocky headland, in late spring, when icebergs drift past
offshore. Real places like this exist (Newfoundland's "Iceberg Alley"), so a harbour, a lighthouse with a clockwork
watch room, a keeper's walled garden, a coastal hill path and a new road bridge over the inlet can all be ONE believable
place. No real town is drawn: no flags, no names, no signs.

## Choosing the scenes (D-156)

Lesson moments imagined first (corporate explainers that reach for a metaphor):
1. HTTPS and certificates as a guarded harbour mouth (a past lesson, https-private, used this).
2. Hidden risk: the tip of the iceberg (culture, technical debt, root causes, unconscious bias).
3. A reveal: the surface view, then the cutaway.
4. Two teams building toward each other and meeting in the middle (integration, alignment).
5. A programme's status: what is built, what is left, the gap still open.
6. A process as a train of gears; one worn part stops the light (single points of failure).
7. Routine maintenance and checks (the keeper winding and oiling the clockwork).
8. Growth over time: a habit started today versus the result months later.
9. A mentor and a new starter planning a season of work.
10. A long programme as a climb with milestones; looking back at how far we have come.
11. Navigating complexity (a maze from above).

Places kept (six, all high or medium): harbour (1, plus arrivals and handovers), iceberg (2, 3), bridge_build (4, 5),
machine (6, 7), garden (8, 9), mountain_path (10).

Dropped: **maze**. A hedge or stone maze has no believable place in a bare granite fishing town (no tall hedges grow
there), and moment 11 is served by the hill path's route choice or by a diagram template. Evidence from
`python3 -m loom sets demand` (2026-10-15): metaphor/harbour named by 2 lessons (https-private, https-private-v2);
metaphor/machine named by 5 lessons, but on inspection only through the phrase "a machine-steady stream" in the
style-cinematic-noir scripts, so it is not evidence of a scene; no lesson named the others.

## Facts used

| Fact used in the brief | Source |
|---|---|
| About 89 to 90 percent of an iceberg is under water (ice 917 kg/m3, sea water 1020 to 1030 kg/m3; the ratio is about 0.89) | (s) https://www.schoolphysics.co.uk/age11-14/Mechanics/Statics/text/Icebergs/index.html ; (s) https://www.navcen.uscg.gov/node/380 (notes the figure is approximate) ; (s) https://www1.udel.edu/CATS/healy_2003/update/log14-jul24b.html |
| An iceberg's underwater part is wider than its visible top and its shape is irregular; it floats in its most stable orientation | (s) https://sketchplanations.com/iceberg-orientation |
| Icebergs pass and ground near fishing towns in spring and early summer (late April to early July, peak May and June); viewed from shore and from hill trails | (s) https://www.accuweather.com/en/weather-news/icebergs-newfoundland-canada-tourism-greenland-glaciers/1169750 ; (s) https://www.nbcnews.com/news/world/ice-meet-you-newfoundland-sees-first-berg-season-n748616 |
| A flashing lighthouse lens turns on wheels, ball bearings or a mercury bath; beneath it a clockwork turns it | https://uslhs.org/resources/lighthouse-technology/lens-rotation (read) |
| The rotation clockwork: a weight on a cable wound on a drive drum, a speed regulator keeping the turning speed constant, a drive shaft and gear to the lens; the weight falls down a tube or the tower's centre; keepers rewound it by hand with a crank every one to several hours | (s) https://www.staugustinelighthouse.org/2015/12/16/lighthouse-technology-clockwork-mechanism/ ; (s) https://pharology.eu/howlighthouseswork/H24_opticrotation.html ; (s) https://sheringhamlighthouse.ca/the-lighthouse-2/lighthouse-anatomy/ |
| The watch room sits between the tower and the lantern and holds the pedestal and the clock; keepers stood watch there | (s) https://graveslightstation.com/about-graves-light-boston/recent-pictures/pre-restoration-photos/level-6-watchroom/ |
| Balanced cantilever bridges: a pair of form travellers on each pier casts segments outward symmetrically, about 5 m each (up to about 10 m), one pair a week; the two arms meet with a short closure segment at mid-span | (s) https://www.doka.com/en/projects/bridges/balanced-cantilevered-bridge ; (s) https://vtechworks.lib.vt.edu/handle/10919/35904 ; (s) https://strukturas.no/?p=4924 |
| Fishing harbour quays: bollards or mooring rings no more than 5 m apart; fenders fixed to the quay capping | (s) https://www.fao.org/4/v5270e/v5270e06.htm |
| A bollard stands at least 0.5 m back from the quay edge | (s, weak source: an engineer's post) |
| Footpath minimum width about 2 m in lowland guidance; uplands are waymarked with cairns rather than posts; a waymarker post is a 100 x 100 mm timber post about 1 m tall with a chamfered top | (s) https://www.kent.gov.uk/__data/assets/pdf_file/0014/5144/Widths-and-heights-design-standards.pdf ; (s) https://conservationhandbooks.com/footpaths-introduction/the-pattern-of-paths/ ; (s) https://www.ruralpayments.org/topics/updates/guidance-archive/agri-environment-climate-scheme-capital-items-archive/signage-archived-13-05-2021/ |
| Raised vegetable beds about 1.2 m wide (reach the middle from both sides); paths 45 cm for kneeling, 60 to 75 cm for a barrow; a cold frame about 46 cm high at the back, 38 cm at the front | (s) https://www.allotment-garden.org/gardening-information/raised-beds/how-to-construct-raised-beds/ ; (s) https://www.allotment-garden.org/store/equipment/large-raised-bed-with-large-cold-frame |

| Height-to-draft ratios by shape (Robe 1976, Davis Strait): tabular about 1:4.5, pinnacle and drydock about 1:2.3 to 1:2.4, domed reported 1:6.3; rounded CIS/IIP averages: tabular, blocky, wedge 1:5, domed 1:4, pinnacle 1:2, drydock 1:1. The cutaway uses 30 m above and 120 m below (1:4) | (s) https://apps.dtic.mil/sti/pdfs/ADA037224.pdf ; (s) https://wiki.met.no/_media/wiki/access/deliverables/d4-43-metno_neh-finalversion.pdf |
| Walled kitchen garden walls 2.5 to 4 m high at a surveyed example; walls store the sun's heat so espaliered fruit grows on them; a garden turned so its warm wall gets the afternoon sun | (s) https://coflein.gov.uk/en/site/700343 ; (s) https://en.wikipedia.org/wiki/Walled_garden ; (s) https://www.havering.gov.uk/bedfordswalled |
| Iceberg size classes (International Ice Patrol): medium 16 to 45 m high and about 61 to 120 m long; large 46 to 75 m high; shapes: tabular, blocky, dome, pinnacle, wedge, dry-dock | (s) https://www.noaa.gov/jetstream/icebergs-max ; (s) https://www150.statcan.gc.ca/n1/pub/16-508-x/16-508-x2024001-eng.htm ; (s) https://www.newworldencyclopedia.org/entry/Iceberg |

## Not verified (design choices in the brief)

- The iceberg's draft: the brief draws the underwater part about four times as deep as the visible part is tall and
  wider than it, so the area under the waterline is about nine times the area above it (the 90 percent rule in a
  section). The real draft-to-height ratio depends on the shape and was not read from a source.

- Quay height above the water: no source found; the brief uses about 2.5 m above the water at mid tide, with a
  ladder recessed into the wall, typical of small harbours but not sourced.
- Watch room size: the brief uses a round room about 3.6 m across inside, with walls of white-painted brick; real
  towers vary widely.
- Pierhead light colours: the brief puts a red light on one pierhead and a green one on the other without saying which
  convention, so no region is pinned.
- Cairn size (the brief uses about 1.2 m tall, 1.5 m across at the base) and the stone-pitched path build: no
  construction standard was read.
- The bridge's main span (120 m between two piers), the deck top (22 m above the water), the box depth (about 7 m over
  the piers, 3.5 m at the tips) and the 20 m gap at mid-span are design choices consistent with balanced cantilever
  practice, not taken from one bridge. The form traveller's size (about 6 m above the deck) and the total station's
  size are from general knowledge, not read from a source.
- The watch room was enlarged to 4.2 m across (from 3.6 m) so a camera can see two people beside the clockwork; real
  watch rooms vary and no single tower was measured. The clockwork's frame size (about 1.0 by 0.6 by 1.1 m) is a design
  choice.
- A working weight-driven clockwork today: most lights are automated; the world says the station is kept as a working
  heritage light wound by hand, which some preserved lights do, but no example was read for this brief.
- The hill path's terrain is a modelled ridge (15 percent up its crest, 35 percent down its sides), not a surveyed hill.
- The cutaway's keel outline (130 to 150 m wide, area about nine times the visible area) was computed from simple
  shapes, not traced from a measured berg.

## 2026-10-15 rename (lead)

The scene `machine` is now `clockwork_room` (plan check renamed to match). The bare word "machine" matched every factory lesson that mentions a machine; the scene keeps its aliases (clockwork, gears, lighthouse clockwork, watch room).
