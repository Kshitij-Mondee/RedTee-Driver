# Set references: the micro_body world (2026-10-13 brief, done 2026-10-15)

STATUS: DONE 2026-10-15. Used in `packs/worlds/micro_body.json` (brief 2). Web search and page reads only; nothing
downloaded; page text treated as data. (s) = from a search summary, the page itself not read.

## The setting chosen

The inside of one healthy adult body at true microscopic scale: five real tissues of the same body, each drawn as a
softly lit place with real shapes and real relative sizes, thinned out (real tissue is far more crowded) and saying so.
All five scenes are abstract (no floor plan): each states its scale in pixels per micrometre in its plan, and its
composition is set in frame terms; none is plan-checked, so their prompts are drafts.

## Choosing the scenes (D-156)

Lesson moments imagined first (wellbeing, hygiene, food safety and learning lessons for corporate adults):
1. The stress response: adrenaline and cortisol in the blood (a past lesson, stress-signal, "moves inside her").
2. A white cell fights an infection; how a vaccine trains the immune system.
3. Hand hygiene: why germs sit in the skin's furrows and how soap lifts them.
4. Skin care for wet work and gloves (dermatitis).
5. Fine dust and fumes at work reaching the deepest part of the lungs.
6. How a respiratory infection takes hold; the case for ventilation and masks.
7. The gut microbiome, diet and stress.
8. Food poisoning: bacteria breaking through the gut's defences.
9. Why antibiotics are used only when needed.
10. How practice and spacing strengthen connections in the brain (a past lesson, spacing-sticks, is about this).
11. Sleep and memory; why breaks restore focus.

Places kept (five, two high and three medium): bloodstream (1, 2), skin_surface (3, 4), lungs (5, 6), gut (7, 8, 9),
neurons (10, 11; new).

Dropped: **cell_interior** ("inside a cell: nucleus and organelles as a landscape"): it serves school biology, not the
wellbeing, hygiene and learning moments above. Added: **neurons**, because learning-science and wellbeing lessons need
the brain far more often. Evidence from `python3 -m loom sets demand` (2026-10-15): micro_body/gut named by one lesson
(bench-20261006-135952-budget), but only through the phrase "gut instinct", so it is not evidence of a scene.

## Facts used

| Fact used in the brief | Source |
|---|---|
| Red blood cells about 6 to 8 micrometres across (average 7.8 in one source); biconcave; a vessel must be at least 2.7 micrometres wide for a maximally deformed red cell to pass | (s) https://www.nanomedicine.com/NMI/8.2.1.2.htm ; (s) https://bionumbers.hms.harvard.edu/bionumber.aspx?id=100508 |
| Neutrophils 10 to 12 micrometres in stained smears (about 8 in suspension); platelets 2 to 4 micrometres | (s) https://abdn.ac.uk/medical/elf/courses/view/126314/a-short-review-of-histology/1/page9 ; (s) https://histologyguide.com/slideview/MH-033hr-blood-smear/07-quiz-1.html |
| Capillaries 5 to 10 micrometres across | (s) https://www.lecturio.de/medical-courses/cell-sizes.lecture ; (s) https://www.jci.org/references/scholar/24384/B28 |
| Corneocytes 30 to 50 micrometres across, 0.2 to 0.5 micrometres thick, flattened and many-sided, 15 to 25 layers; stratum corneum about 10 to 40 micrometres (about 29 on the back of the hand) | (s) https://en.wikipedia.org/wiki/Corneocyte ; (s) https://en.wikipedia.org/wiki/Stratum_corneum ; (s) https://birmingham.elsevierpure.com/files/107333705/Review_Corneocytes_AE_Accepted_Version.pdf |
| Staphylococcus epidermidis: cocci 0.8 to 1 micrometre, in pairs, tetrads and clusters | (s) https://vetbact.org/?artid=205 ; (s) https://universe84a.com/?p=19036 |
| Hair diameter 17 to 181 micrometres, a nominal 75 | (s) https://en.wikipedia.org/wiki/Hair%27s_breadth |
| Eccrine sweat duct about 20 to 50 micrometres across (the opening on the surface was not found measured) | (s) https://en.wikipedia.org/wiki/Sweat_gland |
| Alveolus about 200 to 300 micrometres across; bronchioles 1 mm or less, terminal bronchioles 0.5 mm or less | (s) https://arxiv.org/pdf/1502.04372 ; (s) https://en.wikipedia.org/wiki/Bronchiole |
| Human alveolar macrophage about 21 micrometres across (flow cytometry, 10 volunteers) | (s) https://forschung.kssg.ch/en/publications/1508-cell-size-of-alveolar-macrophages-an-interspecies-comparison |
| Colon: an inner mucus layer, essentially free of bacteria, about 50 to 300 micrometres in humans; a looser outer layer at least as thick where bacteria live | (s) https://pmc.ncbi.nlm.nih.gov/articles/PMC3716454 ; (s) https://pmc.ncbi.nlm.nih.gov/articles/PMC3063600 |
| Small intestine villi about 0.5 to 1.6 mm; microvilli 1.5 to 2 micrometres long, about 0.1 thick (used for the brush border) | (s) https://www.pathologyoutlines.com/topic/smallbowelnormalhistology.html |
| Pyramidal neuron cell bodies about 20 micrometres (16 to 24 measured); dendrites 0.5 to several micrometres thick | (s) https://en.wikipedia.org/wiki/Pyramidal_cell ; (s) https://neuroelectro.org/data_table/281/ |

## Not verified (general knowledge or design choices)

- Red cell thickness (about 2 micrometres at the rim, about 1 at the centre): general knowledge, not confirmed here.
- Blood is about 45 percent red cells by volume: general knowledge.
- The number of alveoli (hundreds of millions): general knowledge; the world says "hundreds of millions" only.
- PM2.5 means particles up to 2.5 micrometres: the definition, not read from a source here.
- A flu virus about 0.1 micrometre: general knowledge.
- Gut bacteria sizes (rods about 1 by 2 to 3 micrometres): general knowledge; the search did not return a measurement.
- Dendritic spines 1 to 2 micrometres, myelin and nodes, astrocyte end-feet on capillaries: general knowledge.
- The colon's inner mucus is drawn at 100 micrometres (inside the 50 to 300 range); the arteriole at 60 micrometres;
  the sweat duct opening at about 40 micrometres: design choices.
- Every scene thins its tissue for legibility and says so in its plan.
