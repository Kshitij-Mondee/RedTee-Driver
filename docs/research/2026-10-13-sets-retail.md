# Set references: real-world facts for the retail world (2026-10-13)

STATUS: DONE 2026-10-15 (four scenes directed and plan-checked). Research for `packs/worlds/retail.json` (brief 2, D-156),
following `docs/assets/WORLD_DIRECTING_BRIEF.md`. Web search and page reads only: nothing downloaded or installed, page
text treated as data. (s) = from a search-result summary, the page itself not read; (r) = the page was read. Sizes from
makers' pages are used for size only; no brand appears in the world.

## 1. The sales floor

| Fact used in the brief | Source |
|---|---|
| Self-service access aisles about 1.8 to 2.4 m (two trolleys passing); main aisles wider, 2.5 m and more | (s) https://stockagile.com/en/blog/do-aisles-affect-shopping-speed/ (a trade blog: a rule of thumb, not a standard) |
| Gondola sections from about 1.2 to 2.3 m high; low-profile convenience gondolas at 54 and 66 inches (about 1.37 and 1.68 m) and 1.2 to 1.5 m lines sold to keep sightlines open across the store; base shelves 22 to 28 inches (0.56 to 0.71 m) deep | (s) https://prod.commissaries.com/sites/default/files/2016-11/2G14%20Shelving%20gondola.docx ; https://www.laneind.com.au/product/qshelf ; https://www.creativedisplayworks.com/custom-gondola-displays/ |
| The brief's 1.6 m mid-floor gondolas are a design choice inside that range: staff see across the floor, and a low camera sees heads against the wall above them | design choice |
| Slips and trips are the single most common cause of major injury in retail; spills not cleaned up quickly are a main cause; clean spills up at once and leave the floor dry; signs and cones only warn, they do not stop people entering, so use barriers or clean in sections | (r) https://www.hse.gov.uk/retail/slips-and-trips.htm (read 2026-10-15) |

## 2. Checkouts and the service desk

| Fact used in the brief | Source |
|---|---|
| Belted checkouts about 0.96 to 0.97 m high and 1.1 to 4 m long (express to full lanes) | (s) https://itab.com/products-and-services/products/checkouts-self-service-systems/express-checkout-solutions/checkmate-compact ; https://itab.com/products-and-services/products/retail-technology/belted-checkout-solutions/checkmate-tandem (sizes only) |
| Seated checkout work: adjustable seating and footrests, task rotation; seated and standing checkstands both exist (seated common in Europe) | (s) https://www.hse.gov.uk/pubns/indg269.htm ; https://www.socsci.ru.nl/meulenbroek/Publications/Lehman%20et%20al%202001.pdf |
| Card terminals on swivel stands turn toward the customer for the PIN | (s) https://www.discountcreditcardsupply.com/products/pax-a35-pos-swivel-and-tilt-stand |
| Age-restricted sales (Challenge 25): staff ask anyone who looks under 25 for photo ID; the till prompts on restricted items; refusals are logged | (s) https://democracy.manchester.gov.uk/documents/s18876/Appendix%204.pdf and other licensing conditions |
| Service counters: standing users 0.95 to 1.1 m; seated users about 0.75 m with a knee recess; where there is one counter, a lowered section at least 0.9 m wide | (s) https://www.labss.org/sites/default/files/stas/20210319/ALTERNATIVE%20COMPLIANCE%20DECISIONS%20STAS%20Approval%20for%20SO140%20Building%20Type%20300818.pdf |
| Security (EAS) pedestals about 1.5 to 1.8 m high and about 0.4 m wide, either side of the doorway | (s) https://www.vitag.com.au/wp-content/uploads/2026/03/XSENSE-AM45-Brochure-v3.pdf ; https://patents.justia.com/patent/20030001739 (sizes only) |

## 3. The stockroom

| Fact used in the brief | Source |
|---|---|
| Roll cages are supplied from 1,550 to 1,830 mm high (most operators cannot see over 1,400 mm), loaded weights 500 kg or more, 100 and 125 mm wheels; push rather than pull, one cage at a time, walking speed, heavy items low, never above the load line or eye level; handles at about 1,000 mm | (r) https://www.hse.gov.uk/food/safety-hazards/roll-cages-wheeled-racks.htm (read 2026-10-15) |
| Common roll container 720 x 800 x 1800 mm, 400 kg load | (s) https://www.ajproducts.co.uk/p/3-sided-roll-cage-246786-246784 (sizes only) |
| Longspan shelving in 1.5 to 3.0 m heights, 2.0 m bays, about 0.4 to 0.6 m deep, posts punched at 50 mm pitch | (s) https://www.esedirect.co.uk/p-2089-longspan-shelving-bays-3-galvanised-steel-shelves.aspx ; https://uk.rs-online.com/web/p/shelving-systems/2686916 (sizes only) |
| Exits must open without a key (a push bar where the door can be locked from outside); stockrooms kept free of loose packaging; exits never blocked by stock, delivery obstructions cleared at once | (s) https://www.FireProtectionOnline.co.uk/emergency-exit-and-panic-hardware/push-bar-panic-bolts/ ; https://www.churchesfire.com/?p=2468 ; https://www.gov.scot/publications/practical-fire-safety-guidance-existing-non-residential-premises-9781788511322/pages/7/ |

Carried over from the office research (docs/research/2026-10-09-set-references.md): exit signs 2.0 to 2.5 m up above the
door; extinguisher handle about 1.0 m.

## 4. Choosing the scenes (D-156)

Lesson moments imagined first: a complaint at the till; an age check and a refused sale; a declined card or a
counterfeit note; a refund without a receipt; a complaint that escalates to a manager; a click and collect handover; the
security alarm at the exit and a shoplifting response; a customer concealing items in an aisle; a spill on the shop
floor; helping a customer reach or find something; pushing a roll cage and lifting from a pallet in the stockroom; a
delivery checked with a driver; the cardboard baler; a blocked fire exit; lone working late.

`py -m loom sets demand` (run 2026-10-15, after directing) finds one hit, `retail/till` in `blameless-postmortem`, through
the new alias "checkout": that lesson's "failed checkout" is an online checkout system, not a till, so it is a false
positive and no retail place is evidenced by past lessons. `shop_floor`, `till` and `stockroom` keep their version 1 ids
anyway.

The identity is one specific place: a neighbourhood supermarket of about 1,000 m2 in a 1990s single-storey building on a
suburban high street, with tills and a service desk at the front, low gondolas, chillers on the back wall and a stockroom
behind it.

Kept (4): shop_floor (high), till (high), service_desk (medium, new), stockroom (medium). Dropped or merged:
- fitting_rooms: a supermarket has none, and clothing returns happen at the service desk; low reuse.
- online_order (a phone and a parcel at a door): not a place in this shop; the phone is a prop with a screen slot, and
  the in-store click and collect handover is at service_desk.
- loading_bay: deliveries are received through the stockroom's goods-in shutter (stockroom, with a delivery variant);
  the warehouse world already owns loading docks.

Plan checks: `docs/assets/plan_checks/retail/<scene>.json` for all four.

What is still unverified: no Claude Design set has been drawn from these prompts yet; the gondola height (1.6 m) and the
camera height in the aisle (1.15 m) are chosen so heads sit against the plain wall above the chillers, which needs a first
delivery to confirm; aisle widths and checkout sizes come from a trade blog and makers' pages, not a standard; the HSE
checkout guide (INDG269) and the BS 8300 counter figures were read only through summaries.
