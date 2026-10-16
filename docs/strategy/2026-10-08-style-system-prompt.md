# Prompt: the style system (workstream 6) and the engine items the bench fix left open (for Claude Code)

STATUS: PROMPT (written 2026-10-08 after reviewing `docs/research/2026-10-07-bench-fix-report.md`). Run it before
`docs/strategy/2026-10-07-claude-code-provider-run-prompt.md`.

---

```
You are working in the Loom Video-Engine folder. Read CLAUDE.md (Rule 0 and its addendum), docs/AGENT_LEARNINGS.md
(L-249 to L-266 at least), docs/research/2026-10-07-bench-fix-report.md (what the last session fixed and left), and
WORKSTREAM 6 of docs/strategy/2026-10-07-fix-prompt.md, which the last session did not start. Do workstream 6 in
full, exactly as written there, plus the items below. Same rules as that prompt: backup first, every fix with a test
that is red on the old code, ratchet new checks, no paid model calls, never edit generated files, logs append-only,
no em or en dashes. Windows, Git Bash: `py`, forward slashes.

A. WORKSTREAM 6 (style system), from docs/strategy/2026-10-07-fix-prompt.md, all four parts:
   1. the shared runtime changes (pack `materials`, pack `roles`, `fx.spotlight`, `fx.vignette_under`,
      `characters.bottom`, M.travel drive key, m.draw stroke-first, font weight clamp, `loom lab --file`);
   2. the S-sized style-specific requests from each guide's section 15 (docs/styles/guides/*.md);
   3. pipeline wiring (pack `guide` key read by the API agents and Cowork task files; context_check compares each
      guide's palette table with its pack);
   4. proof per style on Chrome: render the listed lab scenes and both example scenes of each of the five styles
      (corporate-clean, story-cartoon, glow-flat, cinematic-noir, whiteboard) to docs/styles/demos/guides/<id>/,
      LOOK at every strip, run the guide's section 13 checklist on it, fix and re-render until each item passes or
      is a listed gap, encode one example per style to H.264 crf 18 and judge darks, gradients and grain; update
      each guide's "not verified" notes with what you saw. Leave every pack value that a guide marks as a decision
      for Kshitij unchanged (noir accent2 equals neg, noir and glow extras, noir tone reference and ambient wash,
      story-cartoon vignette).

B. Engine items the bench fix report left open (section 6 and section 3 of the report):
   1. A template that keeps something from a previous template gets no backplate, so a kept dark card shows
      unveiled under the next template's words (openai fork b10, b11, b12, b49). Decide the right behaviour (veil the
      kept part, or refuse keeping a whole template container in the runtime as well as the gate) and implement it.
   2. Blank moments at joins between template beats (openai fork: 3.4 % of speaking time): the outgoing beat has
      left and the incoming beat's first element has not arrived. Overlap them so a speaking frame is never empty.
   3. Words on screen before they are said. Corrected 2026-10-08: claude fork b12's "to whom" label on the black
      card at 90 s is the scene's own doing, not a join layering bug: scenes/b12.js draws its own full-frame card,
      then draws "to whom" with no entrance (only its arrow is drawn on its cue), so the word shows from the start
      of the beat over the card. Nothing flagged it. Add a check (ratchet for old lessons): a text whose element is
      visible more than 0.5 s before the cue that names it, or before the beat's speech starts when no cue names
      it, and a text painted over another element of the same beat that is not its container. Route it to the
      scene. (If Claude Code has already started its own items 1 to 4 below, skip what they cover.)
   8. Character fit (Claude Code's proposal of 2026-10-08): a helper that sizes and places a rig or kit person to a
      shot size (wide, medium, close) inside the frame, so a scene never computes scale by hand (claude b01 placed a
      900-unit rig at scale 1.5 with its feet at floor + 120); `submit_scene` refuses a `figure_cropped` error now
      that workers snapshot first. Document it in docs/SCENE_API.md and the style guides' people sections.
   9. Text over characters: a film check that errors when words sit on a character's painted area (claude b02, b03:
      the echo line over Dev's body), routed to the scene.
   4. The film check's "empty" measure missed gemini's blank nested beats (report section 2): make it see a beat
      whose own elements are off frame or absent while the voice speaks.
   5. The audit's "lingering" counts names case-sensitively and ignores ctx.held (claude fork shows 10, all valid):
      fix the audit, keep a red test.
   6. Pre-existing failing tests: `vendor_art_comes_only_from_approved_sets_and_builds_clean` (the e2kit licence
      string "CC0 1.0 (Loom's own)": decide whether the test or the SOURCES entry is wrong), and
      `mock_llm_client_disconnect_is_quiet`. Fix or explain each; the vision_lab and cairo ones may stay named skips
      if they are environment-only.

   7. Skill sync: on 2026-10-08, 15 of 16 Cowork account skill copies had drifted from `skills/` (account copies
      said primitives were "coming" that shipped in D-114; lnd-character-design was a 129-line condensed copy; reference
      files missing). Write `tools/skill_sync.py`: compares each `skills/*/*/` with the account copy (path given as
      an argument, e.g. the Claude app's skills folder), reports drift ignoring frontmatter quoting and blank lines,
      and builds `.skill` packages (the repo directory plus the Video-Engine location line) into a folder for
      install. Add `--check` to context_check when the account path is set (env LOOM_ACCOUNT_SKILLS); skip with a
      named reason when it is not. Test: a changed line is reported, a quoting-only change is not.

PROOF
- The five style folders under docs/styles/demos/guides/ with a short README per style: which checklist items pass,
  which are gaps, image paths.
- Re-render the claude-balanced fork (render --force --reason "post-style proof"), extract one frame every 2 s, and
  show B1 to B3 gone where they occurred; write qa/post_style_review.md.
- Full suite with and without --browser; context_check.

LOGS
CHANGELOG, L- and D- entries (the style system as one D-), the guides' "not verified" notes, STATE.md, and
docs/research/2026-10-08-style-system-report.md: per item the fix (file:line), the test, before/after, what is still
unverified. Final message: per style, the checklist result and the strip paths; per B item, fixed or not; suite
totals. Do not start the claude_code provider or any paid run.
```
