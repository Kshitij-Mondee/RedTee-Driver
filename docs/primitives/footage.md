# Footage layer (D-114, SPIKE): a real clip as a layer in a scene

Runtime: `runtime/footage.js` (`Loom.footage`). Built by prim_c, 2026-10-06. Status: works and is proven in the
LAB; the lesson render path is designed but NOT wired and NOT verified.

## API

```js
const E = Loom.footage(ctx, "street", {
  src: "media/street.webm",          // project-relative (resolved against Loom.footage.base, default ""), or a data: URI
  x: 160, y: 150, w: 960, h: 540,    // the element box in scene coordinates (the camera carries it)
  trim: [2, 6],                      // clip seconds shown (default [0, 4])
  at: ctx.cue("look at the street"), // timeline time at which clip time trim[0] shows (default ctx.start)
  fit: "cover",                      // or "contain"
  grade: { duotone: ["ink", "accent2"] },   // or { mono: true } or null
  overlays: [{ text: "Bus lane", x: 40, y: 40, w: 300 }],   // label chips: fill token (surface), color token (ink), role (label)
  reveal: undefined,                 // entrance time (default at - 0.05), or false
});
// E.video: the <video>; E.canvas: what is shown (self-seeking mode). Loom.footage.settled(): a promise, see below.
```

Before `at` the in-frame holds; after `at + (out - in)` the out-frame holds. The grade is an SVG filter built from
palette tokens: duotone maps luminance (feColorMatrix) onto dark..light per channel (feComponentTransfer tables);
mono desaturates.

## How a video becomes a pure function of t

The clip is never played. One `Loom.drive` over `[at, at + out - in]` sets `video.currentTime = in + (t - at)` on
every frame the timeline is seeked to. A seek is asynchronous, so:

- `Loom.footage.settled()` resolves when every footage video is loaded and not seeking (after `seeked`), has
  painted its frame, and two animation frames have passed (capture timing only, never frame content).
- What is SEEN is a `<canvas>` painted with `drawImage` from the decoded frame after every seek. Showing the
  `<video>` itself failed in the lab: a paused video that loaded while hidden (its reveal at opacity 0) kept
  presenting its OLD frame after a later seek, although `currentTime`, `readyState` and `seeking` were all right.
  The canvas reads the frame the seek decoded.
- The lab harness screenshots right after `window.__show(i, t)` returns. footage.js wraps `window.__show` (only
  when a footage layer exists) so it returns `settled()`, and puppeteer waits for it.

## Wiring needed (not done: outside prim_c's edit scope)

1. **Lab (`loom/lab.py`)**: copy `scenes_examples/lab/media/` into the lab page's temp dir (`tmp/media/`), and end
   `window.__show` with `return Loom.footage ? Loom.footage.settled() : null;`. Then `lab_footage.js` can use
   `src: "media/synthetic_bars.webm"` instead of the embedded data URI, and the `__show` wrapper in footage.js can
   go. (Today the clip's bytes ride in `lab_footage.js` as a data URI, written by
   `python3 tests/suites/primitives_material_footage_hands.py --sync-footage`, because the lab page cannot reach that folder.)
2. **Lessons (`loom/compose.py`)**: HyperFrames has built-in video: it discovers `<video data-start>` in the STATIC
   html, pre-extracts frames with ffmpeg (`--video-frame-format`), seeks them per frame (`data-media-start` is the
   trim in) and waits for `seeked` before capture. Compose already writes such tags for media scenes (`_html`).
   For footage: declare it in the storyboard scene (a new `footage: [{name, src, trim, at_cue}]` field, a schema
   change), resolve `at_cue` to an absolute time, copy the file to `build/assets/footage/`, and write
   `<video id="footage-<beat>-<name>" src="assets/footage/<file>" muted playsinline data-start="<abs at>"
   data-duration="<out - in>" data-media-start="<in>">`. footage.js already looks for that id first: it reparents
   the element, does NOT seek it, and leaves the frames to HyperFrames.

Without (2), a lesson falls back to the self-seeking canvas. **That is unverified inside a HyperFrames render**:
HyperFrames' capture does not call `Loom.footage.settled()`, so a frame could be captured before a seek lands.

## When to use, when not

- Real places, real processes, real equipment where a drawing would lie (a safety procedure, a machine, a site).
  Freeze, grade and annotate it: a duotone in the pack's tokens keeps it inside the lesson's palette.
- Not for decoration, not as a background loop, not for people without their recorded consent.
- **Consent and licence:** footage of identifiable people needs their signed consent; every clip needs a licence on
  file (own footage, or CC0 or licensed stock from a source on the approved list). **No clip is downloaded
  without Kshitij's approval** (Video-Engine rule 11).
- **Codec:** VP9 WebM. The sandbox Chromium (and other Chromium builds without proprietary codecs) cannot play
  H.264 MP4 in a page. Put a keyframe every second or so (`-g 12` at 12 fps): a seek decodes from the previous
  keyframe, so long GOPs make every frame slow.
- **Size:** a 4 s 480x270 test clip at VP9 crf 52 is 48 KB. Real footage at 1080p is megabytes per second; trim it
  to what is shown and scale it to the box it fills before it enters a project.
- Pack behaviour: none beyond the grade tokens; the layer works in every look family.

## Proven (tests/suites/primitives_material_footage_hands.py)

- `primitive_footage_clip_small_and_in_sync`: the clip is WebM, under 1 MB, and the lab scene carries exactly its
  bytes.
- `primitive_footage_seek_deterministic` (browser): two lab renders that seek the same times in opposite orders
  give identical pixels (mean abs diff 0.00); the clip changes between t = 0.8 and 2.2 (2.8); and the frame shown
  at t = 2.2 matches the frame ffmpeg decodes independently (frame 26 at 12 fps; mean abs diff 1.0).
- Lab strips looked at: `docs/styles/demos/lab/lab_footage__story-cartoon.jpg`, `__corporate-clean.jpg` (duotone
  ink to accent2, mono, ungraded with a trim, label chips).

## Unverified

- Everything in a lesson render (both the HyperFrames-native path and the fallback).
- Long or high-resolution clips (seek time, memory), audio (the layer is muted by design), and `contain` fit
  (written, not looked at).
