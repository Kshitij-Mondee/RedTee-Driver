# Visual brief + beat sheet - <visual name>

**Kind** diagram / animated template / Manim scene / transition / icon / illustration
**Tool** (After Effects, PowerPoint, Vyond, HTML/SVG, Manim, ...)
**Outcome** learner can ...
**Cognitive job** orient / define / distinguish / sequence / relate / quantify / demonstrate / check / consolidate / transition
**Scene duration** __ s   **Register** __   **Motion is** content / staging
**Narration** "..."

## Treatments considered
| # | visual argument | form | why it lost / won |
|---|---|---|---|
| A | | | |
| B | | | |
| C (static + signalling) | | | |

## Choreography
| t (ms) | element | action | duration | easing | narration anchor |
|---|---|---|---|---|---|
| 0 | | | | | |

## Contract
| setting | type | default | range / choices | what changing it does to the learner |
|---|---|---|---|---|
| | | | | |

**Theme values used** ink, muted, accent, ...   **Motion settings honoured** entrance, stagger, ...
**Fixed (not settings)** layout geometry, grid, safe margins, reading order, semantic grammar
**Manim only** params injected? palette injected? `scale_to_fit_*` called? `rate_func` explicit?
`lag_ratio` computed from run_time? seed declared? `next_section` per scene? `-t` alpha?

## Stress test
| # | test | verdict |
|---|---|---|
| 1 | apprehensible at 1x, first viewing | |
| 2 | <=5-6 elements, one focal point | |
| 3 | dwell >= chars/12 + 0.5 s for every text element | |
| 4 | nothing arrives after 70% of the scene | |
| 5 | no moving element crosses a resting one | |
| 6 | no empty sibling at any moment | |
| 7 | nothing reflows after it is revealed | |
| 8 | survives reduced motion | |
| 9 | <3 flashes/s, no vestibular triggers, pausable if >5 s | |
| 10 | body run >= 2.6% frame height, label >= 2.22% | |
| 11 | contrast computed, meaning not colour-only | |
| 12 | seductive detail zoned correctly | |
| 13 | render cost acceptable for this kind of scene | |

## Converged
**Treatment** · **Why it won** · **Deliberately not doing** · **Remaining risk**

## Proof
| layer | how | result |
|---|---|---|
| source | read / lint the file | |
| timeline | sample the animation across time (browser or player) | |
| pixels | contrast and ink checks on rendered frames | |
| eyes | first / mid-build / settle / last | |
| end states + determinism | render twice, compare | |
| **still unverified** | | |
