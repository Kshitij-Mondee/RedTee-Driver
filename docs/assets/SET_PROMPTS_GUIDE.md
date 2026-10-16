# Set prompts for Claude Design: how they work and the pilot (2026-10-09)

STATUS: SHIPPED 2026-10-09 (prompts and checks). The visual result is unproven until the pilot comes back.

## Why the world prompts were rewritten

Kshitij asked whether the world packs would look good and differ from scene to scene. Read again, they would not:
- **Inventories, not direction.** 105 scenes with a median of 8 words each, such as "meeting room: table, wall screen,
  chairs, a whiteboard". There was no camera, light, materials, sense of place or sign of use.
- **No room rendering per style.** The prompt said to paste a character style block (S1 to S9). Those blocks describe
  faces and proportions, not how a room is drawn.
- **Flatness built into the contract.** Sets were limited to ten flat slot colours with black at 14 percent for shade,
  so a painterly or lit room could not be made.
- **Contradictions.** Some scenes said "no people in the sets" and then asked for "a person seated".
- **Never tried.** No world had been sent to Claude Design.

## What a set prompt is now

There is one paste-ready prompt per (scene, style), and nothing else needs adding. Each one carries the following.

**For the engine:**
1. **The set contract.** It covers:
   - the 2400 x 1350 canvas with the 1920 x 1080 frame and overscan;
   - far, mid and near layers, with walls and floor drawn complete behind the furniture;
   - classed light groups;
   - slots, anchors, no people and no text.
2. **The style's exact palette** (`packs/set_styles.json`, `loom/set_styles.py`). It has 15 materials (wall, floor,
   wood and so on), each with a base, a shade, a highlight and a deep tone, plus ink, light, shadow and haze: 64
   distinct colours per style. Shades are tinted by the style's own shadow colour, so they share one temperature and
   never go grey. Every tone differs visibly from its base. Because each colour belongs to exactly one material and
   tone, the engine can still recolour a set.
3. **The return format.** The file name, the manifest, and a review page with a parallax check and a no-light check.

**For the look:**
4. **The style block for rooms.** How a room is drawn in that style: perspective, the light and shadow method,
   texture, detail by depth, the quality bar and a reject list.
5. **The world.** One specific place: the office is the fourth floor of a converted 1920s textile mill. It brings the
   real architecture, materials, real-world scale, signs of life, the default light and the motifs that repeat in
   every scene.
6. **The objects in this scene and how each real one is built.** For example, a task chair has a five-spoke base with
   castors, a gas lift, a seat, a backrest and arms. A style may simplify the surface, never the parts.
7. **The scene, directed:**
   - the camera (height, perspective, horizon, vanishing points);
   - the composition (focal point, foreground frame, free space for characters);
   - the light;
   - what goes in the far, mid and near layers;
   - 4 to 7 specific details, plus slots, anchors, variants and what to avoid.

**The working order:**
8. **A plan before drawing.** Horizon, vanishing points, focus, light, character zones and layers.
9. **A quality check before replying.** It covers:
   - layout rules from professional background practice;
   - real-world sense;
   - the style's, the world's and the set's reject lists.

The real-world facts (mill heights and bays, steel windows, glass manifestation, desk and table sizes, screen glare,
gate widths, exit signs) and the craft rules come with sources in `docs/research/2026-10-09-set-references.md`.

## The pilot: three prompts, one scene, three styles

Paste each into a **fresh** Claude Design session:
- `docs/assets/world_prompts/office/flat_editorial/meeting_room.md`
- `docs/assets/world_prompts/office/lit_25d/meeting_room.md`
- `docs/assets/world_prompts/office/painterly/meeting_room.md`

Judge each against itself, never against the other styles (D-122):
- **Plan first.** Did it write the plan before drawing?
- **At a glance.**
  - Is the room the mill (high joists, 20-pane windows, white brick, black columns)?
  - Is every object the real thing?
  - Is there one clear light?
  - Is there room for two people?
- **The review page.** Does the parallax view show no holes? Does the no-light view still read as the room?
- **Bring it back.** Export the project as a .zip and run
  `py tools/asset_intake.py <export.zip> --batch office-meeting-pilot`. It checks the exact palette, the far, mid and
  near order, `frame_safe`, `anchor_floor_y` and the canvas. Paste its failures back ("fix these, keep everything
  else").

If the pilot is good, the same prompts exist for all 10 office scenes in all 9 styles, plus a props prompt per style
(index: `docs/assets/world_prompts/README.md`). If it is not, write down what failed. The fix goes into the JSON
sources and every prompt regenerates.

## Directing another world

Give the world `"brief": 2` in `packs/worlds/<world>.json` and add `identity` (place, architecture, materials,
inhabited, scale, default_light, motifs, avoid) and `objects`. Each scene needs:
- for, camera, composition, light;
- far, mid, near;
- details, slots, anchors, variants, avoid, objects.

Then run `py tools/world_packs.py`. Its gate refuses a directed scene that:
- misses any field;
- puts people in the set;
- names an object with no construction note;
- refers to another scene (each prompt stands alone).

Check the place's real facts against references first, as the office did. Since 2026-10-15 every world is directed;
the working brief is `docs/assets/WORLD_DIRECTING_BRIEF.md`.

## Not built yet

- **Rendering.** The engine does not yet render these SVG sets in a lesson. The importer (a `Loom.place` from an
  imported set, its layers on the parallax camera, and recolouring by material) is the next piece of engine work.
  Until then, sets come in through the intake and wait in `assets/incoming/`.
- **Palette checks.** Each palette was checked by rendering swatches and a rough test room, not on real Claude Design
  output.

## Batches (2026-10-10)

There are two ways to get several sets drawn:
- **A batch prompt.** `docs/assets/world_prompts/<world>/<style>/batch_<k>__<scenes>.md` asks for three sets in one
  Claude Design session. It states the contract and style once, then each set's own plan and camera, and orders them
  one at a time. One zip comes back with all three sets and one manifest; the intake and `py -m loom sets add` take
  them together.
- **Parallel sessions.** Paste single-scene prompts into several Claude Design projects at once, one scene per project.
  This is slower to set up, but each set gets the model's full attention. Use it for a scene that came back weak from a
  batch.

The office batches are:
1. open_plan, desk_close, evening_floor (the open floor)
2. one_to_one, exec_office, training_room (rooms off the floor)
3. break_room, reception, corridor_lift (the circulation side)

Every scene is plan-checked (`docs/assets/plan_checks/office/`).

## Choosing a world's scenes (D-156, 2026-10-10)

Kshitij: "we don't need so many filler scenes... make sure the location makes sense and would be reused." Before
directing a world:
1. **Imagine the videos.** Write down 8 to 12 lesson moments that typical lessons in this world contain, for example "a
   pharmacist checks a prescription with a patient" or "a nurse hands over at shift change". Each moment needs a place.
2. **Look at the evidence.** Run `py -m loom sets demand` to see which places past lessons named in their words.
3. **Keep the places where those moments happen.** That is usually 4 to 6 per world: the places where people talk,
   decide, work and make mistakes. Drop transitions (corridors, lifts, lobbies) and generic rooms, unless the world's
   lessons happen there. For example, a corridor is a real place for evacuation training; a lift almost never is.
4. **Record it in the scene.** `uses` lists at least 4 of those moments; `reuse` is high, medium or low; a low scene
   needs `keep` with a reason. The gate refuses anything else, and refuses more than 6 high or medium scenes.

## Every world directed (2026-10-15, D-171)

All 18 worlds are brief 2. There are 89 scenes, of which 80 are plan-checked and 9 are drafts. The drafts are the
abstract places: the five inside the body, the iceberg cutaway, the GPS orbit, the solar system and cyberspace. Each
world went through the D-156 cut, and its research, with sources and "not verified" lists, is in
`docs/research/2026-10-13-sets-<world>.md`. The prompts are in `docs/assets/world_prompts/<world>/<style>/`; the
README there indexes them.

**Start with the batches.** Each `batch_<k>__<scenes>.md` is one Claude Design session for two or three sets.

| world | the place | batches |
|---|---|---|
| travel | a mid-sized airport, a hotel and a travel company's team room | airport_checkin, departure_gate, aircraft_cabin / hotel_lobby, hotel_room, booking_desk |
| healthcare | Ward 7 and outpatients of a 2009 district general hospital | ward, nurses_station, treatment_room / clinic_room, pharmacy, waiting_area |
| contact_centre | a 2012 business-park contact centre | agent_row, agent_desk, team_huddle / coaching_room, quiet_room |
| finance | a 1930s regional bank head office and main branch | branch, advice_room, vault / fincrime_desk, trading_floor |
| tech_cyber | a retailer's 2016 technology centre | soc, incident_room, dev_desk / data_centre, access_vestibule (cyberspace is single, a draft) |
| retail | a neighbourhood supermarket | till, service_desk / shop_floor, stockroom |
| warehouse | a regional distribution centre | aisle, picking / loading_dock, shift_board |
| factory | a water-based paint plant | production_line, machine_close, quality_bench / control_room, ppe_station |
| construction | a five-storey block of flats going up | site_overview, excavation / site_cabin, scaffold |
| home | a 1930s semi-detached house | home_office, kitchen_table / living_room, doorstep |
| city | one tram-line district, joined to the office's mill | street, office_exterior / transit, cafe |
| classroom | a further-education college | classroom, lecture_hall, library |
| history | one weaving town in the 1890s and the 1950s | weaving_shed, market_street / counting_house, office_1950s |
| metaphor | a granite harbour town with a lighthouse | harbour, iceberg / bridge_build, mountain_path / clockwork_room, garden |
| nature | one river valley in early June | energy_landscape, crop_field / riverbank, forest_road |
| micro_body | one healthy body at true microscopic scale | bloodstream, lungs, neurons / skin_surface, gut |
| space | a fictional crewed programme of the early 2030s | earth_orbit, solar_system / station_module, mission_control |

**What is not verified yet:**
- No set from these worlds has been drawn. The plan checks are geometry, not pictures, so judge the first delivery of
  each world the way the office was judged (`docs/assets/reviews/2026-10-13-office-sets.md`).
- Many sizes come from search summaries or are design choices. Each research doc lists them.
- About 5 percent of the frame coordinates in the scene text (51 of 1,084) are not a single projected point. They are
  mostly the centre of a screen, a table or a view, written as "about".

**The matcher changed with the new worlds (loom/sets.py `resolve`):**
- **The more specific name wins.** "market street" is the history scene, not city's "street"; "machine close" is not a
  match for a scene called "machine".
- **A world word inside the scene's own name is not a world named.** "office exterior" is a city scene, "training
  room" is an office scene.
- **The test.** All 465 scene names and aliases load their own scene (test
  `check_every_scene_name_and_alias_loads_its_own_scene`).
- **Rename.** Metaphor's scene `machine` was renamed `clockwork_room`.
