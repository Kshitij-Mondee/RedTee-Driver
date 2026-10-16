# Set references: real-space facts for the history world (2026-10-13)

STATUS: SHIPPED 2026-10-15 (the history world is directed: brief 2, four scenes, each plan-checked). Used in
`packs/worlds/history.json` (identity, scale, objects and every scene). Web search and page reads only; nothing
downloaded; page text treated as data. (s) = from a search summary, the page itself not read; everything else was
read.

## 0. The period and the scenes kept (D-156)

Lesson moments imagined first ("how it used to be"): a weaver minding four looms with no guards (why the Factory Acts
came); a child half-timer at the looms; a factory inspector in the shed; the noise of the shed; a flying shuttle;
wages counted into tins and paid through a hatch; a clerk posting a ledger by hand; a manager finding a gap in the
books; letters copied in a press; a stallholder weighing goods while a customer watches the scales; an inspector
testing weights; adulterated flour; a difficult customer at a stall; a typist making carbon copies; personnel files in
an unlocked cabinet; office rules and smoking at desks; unequal pay; a message before email. `py -m loom sets demand`
(2026-10-15): no past lesson named a history scene.

One coherent place, two dates. The world is one cotton-weaving town and its main firm, seen in the 1890s and the 1950s
only. The two dates are justified by the lessons: the 1890s hold the origins of factory safety law, pay records and
fair trading; the 1950s hold office work before computers. Medieval or ancient settings, a port and a separate
archive had no lesson moment and are not in the world.

| scene | date | reuse | why it stays |
|---|---|---|---|
| `weaving_shed` | 1890s | high | the origin of safety law: machinery, children, noise, inspectors |
| `counting_house` | 1890s | medium | wages, ledgers, fraud, copies: the origins of records and pay |
| `market_street` | 1890s | medium | weights and measures, food law, serving customers |
| `office_1950s` | 1950s | high | typing, carbons, paper files, office rules, unequal pay |

Dropped or merged: `mill` became `weaving_shed` (a weaving shed is the specific, well-documented place; the id changed
so the word "mill" stays free for the other scenes' text, since the gate refuses a scene that names another scene's
id); `market` became `market_street` for the same reason; `port` dropped (no moment needs it, and a port does not
belong to an inland weaving town); `archive` merged into the counting house (ledgers) and the 1950s office (files).

Plan checks: `docs/assets/plan_checks/history/<scene>.json` (all four).

## 1. The weaving shed

| Fact used in the brief | Source |
|---|---|
| North-light sawtooth roofs (glazing facing north, slate facing south, about 30 degrees); modular 3 m by 6 m bays on cast-iron columns; about 3.5 m from the floor to the beams and 4.6 m to the ridges; hollow columns carrying rainwater from the gutter beams; stone-flag floors, lime plaster, exposed cast iron; looms driven by leather belts from overhead cross-shafts off a line shaft; the columns carry the shaft bearings | https://en.wikipedia.org/wiki/Weaving_shed (read 2026-10-15; it cites Nasmith 1895 and the Pennine Lancashire weaving shed study) |
| A standard shed held about 1200 looms; weavers tended four to eight looms each, on piece rates; tacklers kept the looms running | same page (read) |
| The Lancashire loom (1842) was semi-automatic: one operative could run four or more looms, hence the "four loom weaver" | https://en.wikipedia.org/wiki/Lancashire_Loom (read 2026-10-15) |
| Column spacing varied: one Rossendale shed had valleys 6.1 m apart with columns every 3.05 m; later sheds dropped a column row | (s) https://britishlistedbuildings.co.uk/101428080-britannia-mill-rossendale-worsley-ward |
| A Lancashire loom of about 1880 to 1900 was shipped in a crate 965 by 2265 by 1200 mm | (s) https://collection.sciencemuseumgroup.org.uk/objects/co8614550/lancashire-loom-loom |
| The 1891 Factory Act raised the minimum working age to 11; half-time working (part school, part mill) began with the 1844 Act for textile children | (s) https://thornber.net/medicine/html/factory.html ; https://el.rub.de/wiki/Brit-Cult/index.php/Factory_Acts |

Not verified: the loom's own size (the brief uses 2.1 by 1.0 by 1.2 m, inferred from the crate, an estimate); the
0.8 m alley between loom fronts and where each loom's belt drops (the brief puts the driving pulley at the loom's far
end); the bay of 3.6 m by 6 m is inside the documented range.

## 2. The counting house and the 1950s office

| Fact | Source |
|---|---|
| Clerks worked at high sloping desks, standing or perched on tall stools, in offices lit by poor daylight and gas; ledgers up to about 50 by 40 by 20 cm and over 40 lb, written with pens | (s) https://www.natwestgroup.com/heritage/history-100/objects-by-theme/our-people-at-work/clerks-armrest-19th-century.html |
| A Victorian clerk's desk: a sloping hinged lid with a ledge, wells and a pen recess | (s) https://www.christies.com.cn/lot/lot-5280264 |
| In a weaving firm the offices sat in the two- or three-storey block with the warehouse; payroll and paperwork were done by office staff | https://en.wikipedia.org/wiki/Weaving_shed (read) |
| 1950s offices: typing pools, carbon paper, manual typewriters struck hard for several copies, a retyped page for one error, vertical filing cabinets | (s) https://www.thestar.co.uk/heritage-and-retro/retro/workplace-was-very-different-1950s-633871 ; https://community.cipd.co.uk/discussion-forums/community-feedback/f/feedback/15194/i-remember-typing-pools/85802 ; https://www.wilsongunn.com/history/mcaw_reminiscence.html |

Not verified: no source was read for the copying press (common in offices of the period, from general knowledge), a
pay hatch, round wage tins, or the 1950s typing desk height of 0.66 m and filing cabinet height of 1.32 m (common
furniture sizes, not sourced here). No layout plan of a real typing pool was found: the rows facing the front with a
supervisor are drawn from period photographs described in the sources, not measured.

## 3. The market street

Not verified: the market street (a sandstone market hall with arched openings, a grocer's trestle stall with a canvas
awning, brass balance scales, a gas lamp at the kerb, stone setts) is drawn from general knowledge of 1890s northern
English towns; no source was read for its sizes (a stall board about 2.4 by 0.9 m at 0.9 m is a design choice). Food
adulteration and weights-and-measures inspection are named only as lesson moments, not as facts drawn in the set.
