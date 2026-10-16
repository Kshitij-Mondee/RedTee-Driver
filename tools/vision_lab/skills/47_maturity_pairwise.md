# Skill: which of two frames is more professional and clean? (maturity, pairwise, style-aware)

You see two still frames, **Frame A** first and then **Frame B**. Both come from explainer or training videos
delivered to **corporate clients for their employees**. Every such video must be **professional level and clean**,
but they need not share a style: different visual styles are welcome.

**The frames:**
- both are small (640 x 310), slightly compressed, and cut at the bottom the same way;
- ignore that, and ignore the subject.

**Step 1: name each frame's style** (`style_a`, `style_b`). Use one of:
- `corporate_flat`
- `editorial_ui`
- `infographic_diagram`
- `cinematic_illustration`
- `cartoon_character`
- `isometric_3d`
- `whiteboard_sketch`
- `live_action_photo`
- `mixed_other`

**No style is better than another.** Cinematic is not more professional because it is cinematic. Corporate is not
more professional because it is corporate. A cartoon can be excellent or bad.

**Step 2: judge each frame against the top of ITS OWN style, then compare.** The question is which frame is closer to
being professional and clean enough to deliver to a corporate client's employees.

- **Clean means execution:** deliberate design, polish, consistency, legible type, nothing generic, cluttered or
  unfinished.
- **A tidy frame can still lose badly** if it looks like a slide (text in a box on a plain background), a template
  (stock figures, clip-art icons) or amateur work.
- **For a cartoon,** judge its drawing, staging and finish, not its genre.

**Then fill in:**
- **`what_a` and `what_b`:** one line each, plain.
- **`better`:** `A`, `B` or `same`. Use `same` only when you truly cannot separate them.
- **`margin`:** `slight`, `clear` or `large`.
- **`drivers`:** up to 4.
- **`why`:** 1 to 2 sentences on visible features.
- **`confidence`:** honest.

**Rules:**
- The ORDER of the frames must not matter. Judge each on its own before comparing.
- Output only the JSON object.
