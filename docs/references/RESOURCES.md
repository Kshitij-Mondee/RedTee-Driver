# Every resource Loom draws on (index; D-87, D-88)

STATUS: LIVING, updated 2026-10-02. This is the one place to find every resource: what it is, its licence, how
it is used, and where it lives. Detail stays in the linked documents. When you add a resource, add a row here in
the same change (rule 10).

## 1. Asset sets we may USE (approved: free, no paid licence, no attribution, no share-alike)
| set | licence (verified at) | how it arrives | status | used through |
|---|---|---|---|---|
| Microsoft Fluent Emoji Flat, 3,174 objects and symbols (SVG) | MIT (`node_modules/@iconify-json/fluent-emoji-flat/info.json`; github.com/microsoft/fluentui-emoji) | `npm install` (in `package.json`) | **installed** | `Loom.art.place / shape(…, "fluent:<name>")`; `py -m loom art <words>` to search |
| Open Doodles (Pablo Stanley), 31 people (SVG) | CC0 1.0 (opendoodles.com footer: "No need to credit, license, or anything") | `py tools/fetch_assets.py doodles` | **to fetch on the PC** (the sandbox blocks the host) | `Loom.art` (`doodles:<name>`) |
| Lukasz Adam free illustrations, 77 scenes and people (SVG; "premium" items excluded) | CC0 1.0 (lukaszadam.com/illustrations: "CC0 license (MIT license). No attribution required.") | `py tools/fetch_assets.py lukasz` | **to fetch on the PC** | `Loom.art` (`lukasz:<name>`) |
| Kenney Furniture Kit, isometric renders (PNG) | CC0 1.0, credit optional (opengameart.org/content/furniture-kit) | `py tools/fetch_assets.py kenney` | **to fetch on the PC** | `Loom.art` (`kenney:<name>`); raster, so it keeps its colours |
| Natural Earth 1:110m (countries, cities) | public domain (naturalearthdata.com) | bundled (`assets/geo/world110m.json`) | installed | `Loom.geo.map`, `Loom.geo.globe` (D-90) |
| Open Peeps (Pablo Stanley), busts | CC0 | bundled (`assets/peeps/peeps.json`) | installed | `kit.peep` |
| Lucide icons, 1,993 | ISC | bundled (`assets/icons/lucide.json`) | installed | `kit.icon`, `Loom.treat.badge` (small marks) |

- **The approved list, machine-readable:** `assets/vendor/SOURCES.json`. Each set records its licence, where the
  licence was read, the attribution rule and how it is fetched. `py tools/fetch_assets.py --check` shows what is
  present.
- **Every fetched set carries** a `LICENSE.txt` and a `SOURCE.json` with the URL and sha256 of every file.

## 2. Sets we only LOOK at (not used as assets)
| set | why reference only |
|---|---|
| Illlustrations.co (Vijay Verma) | only the older packs are CC0; the site now mixes premium assets under a no-redistribution licence |
| Humaaans (Pablo Stanley) | "free for personal and commercial use", but no formal licence |
| unDraw | its licence forbids compiling the art into a library or pack |
| Storyset, Blush | attribution or subscription |
| Twemoji, OpenMoji, Streamline free | CC BY / CC BY-SA: they need credit (and share-alike) |
| Free Gophers Pack | CC0, but Go-themed; a composition reference for full scenes |

## 3. Where to look for references (ideas, never drawings; links only)
- **Dribbble** (dribbble.com/search/<subject>-illustration), **Behance**, **ArtStation**: search pages, looked at
  in the browser.
- **Our measured reference channels**, studied frame by frame from Kshitij's own files and never republished:

  | study | channel |
  |---|---|
  | `docs/research/kurz/2026-10-01-kurzgesagt-study.md` | Kurzgesagt |
  | `docs/research/teded/2026-10-01-teded-study.md` | TED-Ed |
  | `docs/research/crayon/2026-10-01-crayon-capital-study.md` | Crayon Capital |
  | `docs/research/cleo/2026-10-01-cleo-abram-study.md` | Cleo Abram |
  | `docs/research/lucas/2026-10-01-lucas-lab-study.md` | Lucas's Lab |

  - Cross-channel: `docs/research/2026-10-01-channels-compared.md`, `docs/research/2026-10-01-visual-study.md` and
    `docs/research/2026-09-30-reference-channels.md`.
  - The videos themselves are in Kshitij's folders (Documents: Kurzgesagt-In a Nutshell, Ted-Ed, Crayon Capital,
    Cleo Abram, Lucas's Lab).
- **Learning research:** `docs/research/2026-10-01-attention-learning-recall.md`.
- **Craft notes on depth in flat illustration:** the CreativeLive Illustrator lesson on foreground, middle and
  background layers (linked in `SOURCES.md`).

## 4. Reference boards (what was taken from where)
- `docs/references/places/office.md` gave the office (D-87). Before/after: `office_before_after.jpg`.
- Still to write: the other places (inside, server, meeting, warehouse) and the 12 objects.
  `py tools/ref_board.py check` lists them.

## 5. Software and libraries
- Every library and tool, with its version and licence, is in **`docs/STACK.md`**. That covers HyperFrames, GSAP,
  Rough.js, Three.js, lottie-web, puppeteer, skia-python, Manim, FFmpeg, Kokoro, fonts and the asset sets above.
- **Loom's own tools for resources:**
  - `tools/ref_board.py`: reference boards and their ratchet;
  - `tools/fetch_assets.py`: fetches the approved sets;
  - `loom/vendor_art.py` and `py -m loom art`: search and embed vendor art;
  - `tools/asset_intake.py`: Claude Design deliveries;
  - `tools/rig_review.py`: character reviews;
  - `tools/style_fingerprint.py`: measures a look;
  - `tools/video_study.py` and `tools/explain_study.py`: study reference videos.

## 6. Commissioned assets
- **Claude Design** (characters, sets, props): Prompts 0, A0, A1 and R in `docs/ASSET_WISHLIST.md`.
- **Reviews:** `docs/assets/reviews/`. Maya v2 is in `assets/incoming/maya-v2/`.

## 7. Adding a resource (the licence check, every time)
1. Read the licence on the creator's own page, not on a third-party list.
2. Copy the exact sentence into `assets/vendor/SOURCES.json` (`verified_from`).
3. Approve it only if it is free, needs no purchased licence, no attribution and no share-alike, and has no
   no-redistribution clause. Otherwise it goes in section 2 as reference only.
4. Downloads need Kshitij's approval. Fetch with `tools/fetch_assets.py`, so every file gets its licence and
   checksum.
5. Add rows here and in `docs/STACK.md`, and log it in `CHANGELOG.md`.
