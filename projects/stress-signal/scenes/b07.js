// @design pressures_close_in: from above, a person at the centre while named pressures orbit and close in
Loom.scene("b07", {
  build(ctx) {
    const G = Loom.glow, k = ctx.kit, m = ctx.m;
    G.vortex(ctx, "vortex", { x: 960, y: 520, t0: ctx.start, t1: ctx.end, core: "accent2" });
    // @form person_disc: a person shown from above as an icon on a gloss disc
    const me = ctx.el("person", { x: 960, y: 520, w: 0, h: 0, kind: "shape" });
    k.disc(me.inner, 0, 0, 76, { fill: "accent4" });
    k.icon(me.inner, "user", { x: 0, y: 0, size: 86, color: G.token("onAccent"), stroke: 2.6 });
    G.idle(me, ctx.start, ctx.end, { bob: 0, breathe: 0.06, period: 0.7, cy: 0, cx: 0 });
    const items = [["calendar", "Deadlines", ctx.cue("deadlines"), "accent2", [300, 230]], ["message-square", "Conflict", ctx.cue("conflict"), "pos", [1620, 230]], ["mail", "A sharp message", ctx.cue("a sharp message"), "accent3", [380, 860]]];
    items.forEach(([icon, label, t, tone, at], i) => {
      const orb = G.orbit(ctx, `orbit_${i}`, { x: 960, y: 520, icons: [icon], tones: [tone], t0: t, t1: ctx.end, r0: 470 - i * 30, pull: 0.4, speed: 0.6 + i * 0.1, size: 66 });
      m.reveal(orb, t, { dy: 0 });
      const L = ctx.el(`pressure_${i}`, { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
      G.pill(L.inner, at[0], at[1], label, { tone, role: "lead" });
      m.pop(L, t);
    });
  },
});
