# Set references: the nature world (2026-10-13 brief, done 2026-10-15)

STATUS: DONE 2026-10-15. Used in `packs/worlds/nature.json` (brief 2). Web search and page reads only; nothing
downloaded; page text treated as data. (s) = from a search summary, the page itself not read. Everything not listed
here is a design choice and says so below.

## The setting chosen

One fictional temperate river valley in early June: hedged mixed farmland on the valley floor, a river past a tidy
food factory (a dairy), a solar farm on flat valley-floor fields grazed by sheep, a wind farm on the ridge that closes
the valley to the north, and spruce plantations with native broadleaves on the western hills. No real place is drawn.

## Choosing the scenes (D-156)

Lesson moments imagined first (sustainability, energy and outdoor-safety lessons for corporate adults):
1. Where our electricity comes from: wind and solar.
2. Why renewable output varies with the weather.
3. A site visit before signing a green power contract (Scope 2).
4. Land used twice: sheep and pollinators under the panels.
5. A food buyer visits a supplier farm to talk about soil and emissions (Scope 3).
6. Hedges and field margins as habitat.
7. Fertiliser runoff after heavy rain.
8. An environmental officer samples the river below a site after a complaint.
9. A spill reaches the river: who reports it, how fast.
10. Flood risk to a site and the town downstream.
11. A sourcing manager visits a certified forest: felling and replanting.
12. Lone working in remote places.

Places kept (four, one high and three medium): energy_landscape (1 to 4), crop_field (5 to 7), riverbank (7 to 10),
forest_road (11, 12).

Dropped: **coast** ("coastline with a town"): coastal erosion and sea-level lessons are rare in workplace training, the
flood-risk moment is served by the riverbank's flood variant, and a second coast would echo the metaphor world's
harbour. Renamed (the version 1 ids were plain words that the gate refuses inside other scenes' text, and no lesson or
library file used them): farm to **crop_field**, river to **riverbank**, forest to **forest_road**; their old names stay
as aliases. Evidence from `python3 -m loom sets demand` (2026-10-15): no lesson named any nature scene.

## Facts used

| Fact used in the brief | Source |
|---|---|
| UK onshore turbines today around a 170 m rotor and 7 MW; a recent example 162 m rotor; a modelling baseline 120 m hub, 136 m rotor. The brief uses 100 m hub, 130 m rotor (tip about 165 m) | (s) https://knowledge.energyinst.org/new-energy-world/article?id=139164 ; (s) https://netzerocompare.com/articles/vestas-installs-uks-most-powerful-onshore-wind-turbine-at-sanquhar-ii ; (s) https://ethos-reskit.readthedocs.io/en/latest/reference/wind/core/design_turbine.html |
| Turbine spacing: a cited minimum 3.5 rotor diameters, often 5 across the wind and 7 along it. The brief uses about 650 m (5 diameters) along the ridge | (s) https://en.wikipedia.org/wiki/Wind_farm ; (s) https://mercomindia.com/guidelines-wind-turbine-placement |
| Ground-mounted solar: sheep pass under panel edges as low as about 0.6 m; grassy avenues 3 to 7 m wide between rows, about 70 percent of the site left as grassland; UK sites grazed by sheep | (s) https://www.maine.gov/dacf/ard/solar/docs/Solar%20Farm%20Grazing%20Best%20Management%20Practices_vFinal.pdf ; (s) https://lightsourcebp.com/app/uploads/2022/11/Solar-Agriculture.pdf ; (s) https://infrastructure.planninginspectorate.gov.uk/wp-content/ipc/uploads/projects/EN010143/EN010143-000289-6.2%20Appndx%202-1%20Grazing%20Feasibility%20Study.pdf |
| Field gates 3.6 m (12 ft) are a standard width for a tractor | (s) https://conservationhandbooks.com/?p=868 ; (s) https://webportal.ribblevalley.gov.uk/planx_downloads/21_0637_FIELD_GATE.pdf |
| Hedges: topped hedges 1.5 to 3 m; a side-trimmed hedge 4 m by 2 m | (s) https://develop.agriland.ie/farming-news/managing-hedgerows-on-tillage-farms/ ; (s) https://www.peakdistrict.gov.uk/__data/assets/pdf_file/0014/2165/derelict-hedgerows.pdf |
| Forest roads: 3.4 m running width, 25 m average felled corridor, roadside ditches | (s) https://www.ruralpayments.org/topics/all-schemes/forestry-grant-scheme/forestry-grant-scheme-capital-items/construction-of-forest-road/construction-of-forest-road.pdf |
| Flood embankments: an indicative scheme up to about 3 m above ground with 1 in 4 side slopes; crest widths of 4 to 5 m in other countries' guidance | (s) https://consult.environment-agency.gov.uk/west-midlands/bourn-and-lower-rea-flood-risk-management-scheme/user_uploads/valley-park-concept-map.pdf ; (s) https://roadsforwater.org/guideline/coastal-lowlands/roads-combined-with-flood-embankments/ |
| Staff gauges: boards in sections up to about 1.2 m, centimetre graduations, mounted on a post or a headwall | (s) https://ott.com/products/water-level-1/ott-staff-level-gauges-960 ; (s) https://openchannelflow.com/gauges/ |

## Plan checks

`docs/assets/plan_checks/nature/energy_landscape.json`, `crop_field.json`, `riverbank.json`, `forest_road.json`: each
camera was run through `tools/set_camera.py`; every head ray was followed past the nearest surface to the ridge or the
valley (noted in each scene's plan) so both heads are seen against open sky or, for the riverbank's B, the water.

## Not verified (design choices)

- Hub height 100 m and rotor 130 m are a reasonable modern onshore size, not one machine's datasheet.
- Panel table geometry (0.8 m front, 2.75 m back, 25 degree tilt, 9 m pitch, two modules in portrait) and the 40 m
  unplanted meadow strip along the solar farm's south edge are design choices consistent with the sources, not
  measured from one site. The weather station with a pyranometer is general knowledge.
- Winter wheat about 0.85 m tall in early June, tramlines every 24 m: general farming knowledge, not read here.
- The flood embankment (2.5 m tall, 3 m crest) is smaller than the crest widths found abroad; a design choice for a
  small lowland river. The river width (25 m) and the outfall headwall build are design choices.
- Sitka spruce at 25 to 30 m at felling: not confirmed by a source in this search.
- The terrain of the forest road scene (30 percent up, 20 percent down) and the 150 m height above the valley are
  modelled, not surveyed.
