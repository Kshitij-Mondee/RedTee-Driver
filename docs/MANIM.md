# Manim in Loom: how clips are made, reused and kept honest

Manim draws scenes that the canvas cannot draw well: curves, functions and geometry. Loom runs ManimCE
as a subprocess and places the transparent clip in the world. Everything below is engine code
(`loom/manim_bridge.py`, `runtime/manim/loom_manim.py`, `loom/checks/manim_colours.py`). No model is
involved.

## What a scene may depend on
- **Timing** (duration, cue times, the spoken span) and **params** come from the storyboard and the
  narration.
- **The look** comes from the lesson's style with its brand layered on: `C.<token>` for colours, and
  `ctx.fonts` or `self.text()` for type.
- **Nothing else.**
  - Never a fixed colour. The scenes gate and the bridge refuse `WHITE`, `"#FF0000"`,
    `color="red"`, `ManimColor("#..")` and the like.
  - A line where a literal colour is the point takes `# loom: literal-colour <reason>`.

## Why a new look used to be slow
Manim bakes colour into pixels, so a new colour means drawing every frame again. In the sandbox (2
cores), a 10.5 s clip took about 27 s. The old cache reused a clip only when the WHOLE look was
identical, so a brand change that touched one colour redrew every Manim scene.

## What happens now
1. **Reuse by what was read.**
   - While a scene renders, `loom_manim` records every `C.<token>`, every `ctx.fonts` key and any use
     of `ctx.raw`.
   - A stored clip is reused for any look whose values for exactly those reads are unchanged.
   - Changing a colour a scene never reads costs nothing.
   - A scene that touches `ctx.raw` is matched only on the whole context: correct, with less reuse.
   - The record is made at run time, so `getattr(C, name)` is caught too. A static scan would miss it.
2. **One shared store.**
   - Clips live in `cache/manim/` (or `$LOOM_CACHE_DIR`). The key is the scene source, the timing, the
     runtime version, the Manim version and the quality.
   - Copies of a lesson, brand previews and going back to an earlier look all reuse it.
   - Project `media/<beat>.webm` is a copy of the clip in use, and `media/<beat>.hash` names it.
   - The store is a cache: deleting it only costs time. It is local to each machine and is not synced.
   - Clips made before the store existed are **adopted**, not redrawn, when their old stamp proves they
     were made from the same context by a runtime with identical frames.
3. **Drafts for previews.**
   - `loom restyle` and `py -m loom manim <id> --draft` make 6 fps, half-size clips, about 5x faster.
   - A draft request uses a full-quality clip instead when the store has one.
   - Drafts never reach a video:
     - the check and render stages re-make them at full quality first;
     - `render` refuses a build whose manifest lists `draft_media`.
4. **Parallel.**
   - Scenes render at the same time: `$LOOM_MANIM_JOBS` sets how many, otherwise up to 4 by CPU count.
   - On 2 cores the gain was small (59 s to 55 s), because ffmpeg's encoding already uses the second
     core.
   - Expect more on a machine with more cores. That is still to be measured on the owner's machine.

## Commands
```
py -m loom manim <id> [--draft] [--force] [--jobs N]   # make or reuse this lesson's clips; prints how each was satisfied
py -m loom cache status                                # clips, size, what each read, which lessons use them
py -m loom cache prune [--days 30] [--all]             # remove clips no lesson uses
```

## Measured (sandbox, spacing-sticks, 2026-09-30)
| step | result |
|---|---|
| Adopt the two existing clips | 0 redraws; clips and build byte-identical to before |
| Restyle to line-art + Harbor Labs (drafts) | 23 s end to end (drafts 5.9 s and 4.6 s) |
| Same look, another lesson copy | 17 s end to end, 0 redraws (store) |
| Full-quality clips, 2 jobs vs 1 | 55 s vs 59 s |
| Recorded reads | b14: accent, accent2, ink, line, muted. b06: all seven accents and neutrals. These match the source |

Re-rendering the same clip gives identical **pixels** (framemd5) but not identical file bytes: the WebM
container differs from run to run. The store keeps the first clip made.
