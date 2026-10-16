// @design repeated_approval_prompts_on_nightstand: a dark bedside phone receives three approval prompts, then a denial resolves to a reported verdict
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    // Treatment A: static phone hero with state changes. Treatment B: prompt cards drawn separately. Treatment C: a phone hero within a quiet bedroom set. Chosen C, because the repeated kit states make the attack legible without inventing UI.
    const tFirst = ctx.cue("But an attacker may send approval requests,");
    const tAgain = ctx.cue("again and again.");
    const tUnknown = ctx.cue("One you did not start?");
    const tMove = ctx.cue("Deny it, and report it.");

    // @form bedroom_set: restrained night bedroom framing around the phone
    const room = ctx.el("bedroom_set", { x: 0, y: 0, w: 1920, h: 930, kind: "scenery", exit: "fade" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 930, fill: c("field") }, room.inner);
    svg("rect", { x: 0, y: 0, width: 1920, height: 540, fill: c("field2"), opacity: 0.34 }, room.inner);
    // @form window_fill: cool night plane, kept away from readable phone screen
    svg("polygon", { points: "80,130 620,80 700,500 120,570", fill: c("accent3"), opacity: 0.10 }, room.inner);
    // @form blind_bars: hard shadow bars on the distant wall
    for (let y = 140; y < 520; y += 44) svg("polygon", { points: `0,${y} 650,${y - 66} 660,${y - 45} 0,${y + 24}`, fill: c("shadow"), opacity: 0.60 }, room.inner);
    // @form pillow_edge: a dark pillow edge only, no sleeping figure
    svg("path", { d: "M-80 760 Q280 600 700 730 L800 930 L-80 930 Z", fill: c("surface2"), opacity: 0.72 }, room.inner);
    // @form nightstand_plane: hard-edged bedside surface beneath the phone
    svg("polygon", { points: "680,690 1920,610 1920,930 560,930", fill: c("surface"), opacity: 0.70 }, room.inner);
    svg("path", { d: "M650 694 L1920 614", stroke: c("ink"), "stroke-width": 3, opacity: 0.18 }, room.inner);
    // @form lamp_off: lamp silhouette, visibly unlit
    svg("ellipse", { cx: 1650, cy: 715, rx: 125, ry: 20, fill: c("shadow"), opacity: 0.60 }, room.inner);
    svg("path", { d: "M1650 685 L1650 485", stroke: c("line"), "stroke-width": 7 }, room.inner);
    svg("path", { d: "M1578 485 L1722 485 L1682 405 L1618 405 Z", fill: c("surface2"), stroke: c("line"), "stroke-width": 2 }, room.inner);

    // @form phone: bedside phone, a real kit artefact occupying the lit focus plane
    const phone = ctx.el("phone", { x: 915, y: 4, w: 620, h: 907, kind: "object", exit: "fade" });
    const handset = Loom.lesson.bedside_phone(ctx, phone.inner, { x: 0, y: 0, w: 620, tilt: -4, state: "dark" });
    handset.setState("dark", ctx.start);
    handset.setState("prompt", tFirst + 0.10);
    handset.setState("prompt2", tAgain + 0.16);
    handset.setState("prompt3", tAgain + 0.62);
    handset.setState("pressed", tMove + 0.05);
    handset.setState("denied", tMove + 0.52);
    // @form prompt_stack: the kit's three stacked prompt states, timed to each spoken repetition
    // @form deny_button: the kit's amber deny control becomes the sole emphasis at the move
    // @form reported: the kit's green reported verdict clears the prompts at the move
    m.emphasis(phone, tMove + 0.05);
  },
});
