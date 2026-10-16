# Set references: the space world (2026-10-13 brief, done 2026-10-15)

STATUS: DONE 2026-10-15. Used in `packs/worlds/space.json` (brief 2). Web search and page reads only; nothing
downloaded; page text treated as data. (s) = from a search summary, the page itself not read; (read) = page read.

## The setting chosen

Earth's neighbourhood as one fictional international crewed space programme of the early 2030s sees it: its flight
control room on the ground, a laboratory module on its crewed station in low Earth orbit, the satellite navigation
constellation around Earth, and the Sun and planets at their real sizes and colours. No real agency, mission,
spacecraft or logo is drawn.

## Choosing the scenes (D-156)

Lesson moments imagined first:
1. How a phone finds its position from four satellites (a past lesson, gps-position, is exactly this).
2. Why satellite clocks must match ground time (timing for networks and payments; the same lesson).
3. Space as everyday infrastructure; space debris and shared responsibility for low orbit.
4. Putting a big number in proportion (planet sizes); an honest-chart lesson (sizes versus distances).
5. A crew works through a checklist; a malfunction handled by the book.
6. Months of isolation and routines (remote work and wellbeing).
7. Incident response in a control room: work the problem, clear roles (leadership and IT incident lessons).
8. A shift handover; a post-incident review.

Places kept (four, one high and three medium): earth_orbit (1 to 3), solar_system (4), station_module (5, 6),
mission_control (7, 8; new: the cast already named mission-control staff, and incident-response lessons happen there).

Dropped: **surface** ("a planet or Moon surface with a base": speculative, and "moonshot" lessons use the word, not
the place) and **deep_field** (a backdrop of galaxies where nothing happens; the star field lives in the other space
scenes). Renamed, because the old ids are plain words that other scenes must use ("orbit", "station") and the gate
refuses a scene id inside another scene's text; no lesson or library file used them: orbit to **earth_orbit**,
station to **station_module**. Evidence from `python3 -m loom sets demand` (2026-10-15): no lesson named a space scene
by its id (gps-position talks about orbits and satellites throughout).

## Facts used

| Fact used in the brief | Source |
|---|---|
| GPS: nearly circular orbits, semi-major axis 26,560 km (altitude about 20,200 km), period 12 sidereal hours, six planes with at least four slots each; inclination about 55 degrees; baseline 24 satellites plus spares (31 or so in orbit) | (s) https://gssc.esa.int/navipedia/index.php/GPS_Space_Segment ; (s) https://satnow.com/gnss-constellation-details/GPS/navstar-53 |
| Planet and Moon diameters, distances from the Sun, the Moon's distance (0.384 million km) | (read) https://nssdc.gsfc.nasa.gov/planetary/factsheet/ |
| The US laboratory module: about 8.5 m long and 4.3 m across, 24 racks (13 science, 11 systems), a 51 cm window, hatches at both ends normally open, fabric rack-front closeouts | (s) https://en.wikipedia.org/wiki/Destiny_(ISS_module) ; (s) https://www.nasa.gov/international-space-station/destiny-laboratory-module |
| Flight control rooms: consoles in rows facing a front wall of displays; four rows in Houston, the flight director near the centre; tiered floors once, flat floors since a 2006 remodel | (s) https://www.nasaspaceflight.com/2006/10/nasas-newest-flight-control-room/ ; (s) https://socks-studio.com/2011/07/21/evolution-of-space-mission-control-rooms/ ; (s) https://ntrs.nasa.gov/api/citations/20110014997/downloads/20110014997.pdf |

## Not verified (general knowledge or design choices)

- The Sun's diameter (1,392,700 km) and Saturn's main ring diameter (about 273,000 km): general knowledge, not read.
- The crewed station's altitude (about 420 km) and geostationary altitude (35,786 km): general knowledge.
- The station module's square aisle (about 2.1 m), rack width (1.05 m), hatch (1.27 m square): general knowledge and
  design choices; the module is fictional and its window is set in the deck by design.
- The control room's size (20 by 16 m), the screens' size and height (5.2 by 2.6 m, bottoms at 2.6 m) and the desk
  sizes: design choices; no room's drawings were read.
- The orbit scene's ring ellipses were computed from the stated geometry (six rings at 55 degrees, turned 60 degrees
  apart, viewed from 18 degrees above the equator); the satellites' positions on the rings are illustrative, not an
  ephemeris.
- The planets' colours are described from general knowledge of NASA imagery, not from a colour standard.
