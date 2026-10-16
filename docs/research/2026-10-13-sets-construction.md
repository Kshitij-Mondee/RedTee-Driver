# Set references: real-world facts for the construction world (2026-10-15)

STATUS: DONE (2026-10-15). Research for `packs/worlds/construction.json` (brief 2, D-156). Web search and page reads
only: nothing downloaded, page text treated as data. (s) = from a search summary, the page itself not read; everything
else was read. Dates read: 2026-10-15. No brands are drawn: suppliers' pages were used for sizes only.

## 0. The place (our choice)

One specific site: a five-storey block of 36 flats with a concrete frame on a former car park at a town-centre edge,
eighteen months in, with a tube-and-fitting scaffold, a two-storey cabin stack at the entrance and drainage trenches
being dug across the yard. Chosen because one site at this stage holds every imagined moment: a permit issued in the
site office, a visitor induction, a toolbox talk in the yard, work at height on a scaffold lift and an excavation edge.

## 1. Scaffolds and work at height

| Fact used | Source |
|---|---|
| Work at Height Regulations 2005, schedule 2: main guardrail at least 950 mm above the edge (910 mm for older fixed protection); no unprotected gap above 470 mm between guardrails; toe boards suitable to stop people and materials falling (150 mm is the common guidance figure, not in the statute) | (s) https://www.legislation.gov.uk/uksi/2005/735/schedule/2 ; (s) https://www.haspod.com/blog/construction/scaffold-handrail-height |
| Brick guards: mesh panels on the guardrails to stop small items falling, used over pedestrian routes and public areas | (s) https://squote.app/knowledge/scaffolding/scaffold-edge-protection |
| TG20 (as summarised): lift height at most 2.0 m; standard bay length about 2.4 m; 5 + 2 boards on non-designed scaffolds; minimum working platform 600 mm; ladders at 75 degrees (4 up to 1 out); ladder openings about 450 by 600 mm | (s) https://squote.app/knowledge/scaffolding/independent-tied-scaffold ; (s) https://www.sell2wales.gov.wales/Assets/NoticeBuilder_FileDownload.aspx?id=346979 ; (s) https://scaffoldersforum.com/goto/post?id=86844 |
| Ladders used for access must be secured and, unless there is another handhold, rise at least 1 m above the landing | https://www.hse.gov.uk/construction/safetytopics/excavations.htm (read; the same rule as for scaffold ladders) |

Not verified: the scaffold tag system (green insert for safe, red for not) is common practice known from memory, not from
a source read here. The 2.0 m bay used in the plan is inside the TG20 limit quoted above.

## 2. Excavations

| Fact used | Source |
|---|---|
| A competent person inspects supports or battering at the start of each shift and after any event affecting stability; written reports | https://www.hse.gov.uk/construction/safetytopics/excavations.htm (read) |
| Edge protection: guardrails and toe boards next to the supported side, or fabricated guardrail assemblies on the trench box, or box extensions or trench sheets longer than the trench is deep; edge protection with toe boards or projecting box sides stops spoil falling in | same page (read) |
| Do not park plant or vehicles near the sides; no petrol or diesel engines near the edge | same page (read) |
| Identify and mark buried services before digging (HSG47); a cubic metre of soil can weigh over 1.5 t | same page (read) |
| Spoil set back from the edge: 0.6 m, 1 m or 2 m depending on the source and jurisdiction | (s) https://ohs-pubstore.labour.alberta.ca/download/sample/1858 ; (s) https://ors.od.nih.gov/sr/dohs/Documents/excavation-checklist-inspection.pdf |

Not verified: the UK utility marking colours (yellow for gas, red for electricity) are from memory of NJUG practice,
not a source read here; the trench box's panel sizes are design choices; the brief's 1.5 m spoil setback is a choice
inside the range above.

## 3. Hoardings, cabins and segregation

| Fact used | Source |
|---|---|
| CDM 2015: the site perimeter is identified by signs or fenced off; HSG151 risk assessment decides the hoarding; hoardings at least 2.4 m, up to 3.6 m where needed (for example acoustic); solid hoarding in urban areas | (s) https://designingbuildings.co.uk/wiki/Hoarding ; (s) https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/627944/D9_Worksite_security_v1.0.pdf |
| Pedestrian routes physically separated from vehicles by robust barriers; turnstiles and a separate pedestrian gate at the entrance | (s) https://ccsbestpractice.org.uk/wp-content/uploads/2018/10/Common-Visual-Standards-Booklet.pdf ; (s) https://www.lakeside-hire.co.uk/?p=8916 |
| Site cabins: 32 by 10 ft units about 9.75 by 3.0 m (one maker 9.76 by 3.05 m), stackable with an external stair; anti-vandal steel shutters on windows; welfare units hold canteen, office, drying room and toilets | (s) https://www.algeco.co.uk/site-accommodation/static-site-welfare/32ft-static-welfare-unit ; (s) https://www.portakabin.com/gb-en/buildings/ready-for-hire/ks092o/ ; (s) https://www.budgetshippingcontainers.co.uk/sales/32ft-x-10ft-offices-cabins-used/ |
| Mesh fence panels (temporary fencing) about 3.5 by 2.0 m on feet, clamped together | (s) https://www.lakeside-hire.co.uk/?p=8916 |

Not verified: the inside of a linked double cabin used as the site office and induction room is our design from
common practice; no source describes a standard layout. The ISO 7010 assembly-point sign (E007) and mandatory signs are
taken from the warehouse research, section 7.

## 4. Scenes kept, added and dropped (D-156)

Lesson moments imagined: a permit to work issued and closed in the site office; a visitor induction and sign-in; a
toolbox talk in the yard; the site alarm and the walk to the assembly point; escorting a visitor along the fenced
route; a bricklayer behind guardrails and brick guards; a missing guardrail spotted; climbing the ladder through the
gate; checking the scaffold tag; a trench inspection at the start of a shift; scanning for buried services before
digging; a near miss with a digger bucket by a gas main.

Kept: `site_overview` (now the yard by the cabin stack where toolbox talks happen, with the building and its
scaffolding behind), `site_cabin` (the site office and induction room), `scaffold` (one working lift). Added:
`excavation` (the trench by the back hoarding). Dropped: `roadworks` (a public-road place outside this site; its
trench moments now happen at `excavation`), `field_visit` (a roadside cabinet away from any building site; lone-working
and utilities lessons belong to a utilities or street world, not this one).

Camera numbers come from `tools/set_camera.py`; specs and outputs are in `docs/assets/plan_checks/construction/`. The
scaffold camera stands level with the lift, 5.7 m out from it (as from a mobile elevating work platform), so the
plan's z values are absolute heights. In `site_overview` the left worker's line of sight passes the end of the cabin
stack and meets the hoarding; that hit is stored as the point `W1_ray_hoarding`.

Note for other worlds: scene ids are plain words, and the gate refuses any scene that names another scene's id, so
the construction scenes other than `scaffold` say "scaffolding".
