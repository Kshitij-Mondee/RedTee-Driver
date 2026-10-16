// @design lit_screen_in_dark_room: a dark room where one cool screen asks the same question again and again, and one amber button is the only answer
/* Treatments: (1) static: phone on nightstand with a lit prompt; (2) stacking: prompts pile up, screen pulsing (chosen);
 * (3) camera push onto the Deny button. Chosen 2 with the accent held to Deny alone. */
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx; // bedroom b12
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);

    const tPrompt = ctx.cue("approval requests");
    const tAgain = ctx.cue("again and again");
    const tAgain2 = tAgain + 0.7;
    const tStart = ctx.cue("did not start");
    const tPress = ctx.cue("Deny it");
    const tReport = ctx.cue("and report it");

    // ---- the bedroom: dark field, a cool window wedge on the wall, a dark pillow edge, haze
    const BG = ctx.el("bedroom_set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const gid = Loom.uid("b12bg");
    const defs = svg("defs", {}, BG.inner);
    const lg = svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svg("stop", { offset: 0, "stop-color": c("field") }, lg);
    svg("stop", { offset: 1, "stop-color": c("field2") }, lg);
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: `url(#${gid})` }, BG.inner);
    // @form window_light: a hard cool wedge from an unseen window, the room's only fill
    svg("polygon", { points: "1240,0 1920,0 1920,760 1500,1080 1180,1080", fill: Loom.style.mix(c("field"), c("accent3"), 0.07) }, BG.inner);
    svg("polygon", { points: "1480,0 1920,0 1920,560 1700,1080 1560,1080", fill: Loom.style.mix(c("field"), c("accent3"), 0.05) }, BG.inner);
    // @form pillow_edge: a dark pillow corner at the lower left, the only hint of a bed
    svg("path", { d: "M0 700 Q150 660 330 720 Q420 780 400 1080 L0 1080 Z", fill: c("shadow") }, BG.inner);
    svg("path", { d: "M0 700 Q150 660 330 720", fill: "none", stroke: c("accent3"), "stroke-width": 3, opacity: 0.25 }, BG.inner);
    svg("rect", { x: 0, y: 930, width: 1920, height: 150, fill: c("shadow"), opacity: 0.5 }, BG.inner);

    // ---- the screen's spill on the room: cool light that pulses with each prompt
    const PW = 580, PX = (1920 - PW) / 2, PY = 66;
    const L = ctx.el("screen_light", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const sid = Loom.uid("b12sp");
    const sdefs = svg("defs", {}, L.inner);
    const rg = svg("radialGradient", { id: sid, cx: "50%", cy: "50%", r: "50%" }, sdefs);
    svg("stop", { offset: 0, "stop-color": c("accent3"), "stop-opacity": 0.5 }, rg);
    svg("stop", { offset: 1, "stop-color": c("accent3"), "stop-opacity": 0 }, rg);
    const spill = svg("ellipse", { cx: 960, cy: 430, rx: 520, ry: 440, fill: `url(#${sid})`, opacity: 0 }, L.inner);

    // ---- the phone on the nightstand (kit), one element
    const P = ctx.el("phone", { x: PX, y: PY, w: PW, h: 820 * (PW / 560), kind: "instrument", exit: "recede" });
    const ph = Loom.lesson.bedside_phone(ctx, P.inner, { w: PW, state: "dark" });
    const s = PW / 560;
    ph.setState("dark", ctx.start);
    ph.setState("prompt", tPrompt);
    ph.setState("prompt2", tAgain);
    ph.setState("prompt3", tAgain2);
    ph.setState("pressed", tPress);
    ph.setState("denied", tReport + 0.3);

    // ---- the accent: Deny, ringed and glowing on "did not start" (same tilt as the phone)
    const D = ctx.el("deny_button", { x: PX, y: PY, w: PW, h: 820 * s, kind: "icon", exit: "recede" });
    const dg = svg("g", { transform: `scale(${s}) translate(100 40) rotate(-5 180 330)`, opacity: 0 }, D.inner);
    const did = Loom.uid("b12dg");
    const ddefs = svg("defs", {}, dg);
    const drg = svg("radialGradient", { id: did, cx: "50%", cy: "50%", r: "50%" }, ddefs);
    svg("stop", { offset: 0, "stop-color": c("accent"), "stop-opacity": 0.55 }, drg);
    svg("stop", { offset: 1, "stop-color": c("accent"), "stop-opacity": 0 }, drg);
    svg("ellipse", { cx: 180, cy: 446, rx: 150, ry: 70, fill: `url(#${did})` }, dg);
    svg("rect", { x: 58, y: 404, width: 244, height: 84, rx: 14, fill: "none", stroke: c("accent"), "stroke-width": 4 }, dg);
    Loom.tween(dg, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, tStart, { kind: "reveal", beat: ctx.beat.id, name: "deny_glow", content: true });
    Loom.tween(dg, { opacity: 1 }, { opacity: 0, duration: 0.25 }, tPress + 0.15, { kind: "exit", beat: ctx.beat.id, name: "deny_glow_off", content: true });

    // ---- deterministic pulse of the screen's spill: rise on the first prompt, a bump on each new one, settle when denied
    const t0 = tPrompt, span = ctx.end - t0;
    Loom.drive((e, raw) => {
      const T = t0 + raw * span;
      const bump = (tb) => (T >= tb ? Math.exp(-(T - tb) * 3.2) * (0.5 + 0.5 * Math.cos((T - tb) * 12)) : 0);
      let o = Math.min(1, (T - t0) / 0.5) * 0.5;
      o += 0.45 * (bump(tAgain) + bump(tAgain2)) + 0.12 * Math.sin((T - t0) * 5);
      if (T > tReport) o *= Math.max(0.35, 1 - (T - tReport) * 0.8);
      spill.setAttribute("opacity", Math.max(0, Math.min(1, o)).toFixed(3));
    }, t0, span, "linear");
  },
});
