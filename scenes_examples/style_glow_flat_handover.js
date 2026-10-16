// @design shift_handover_glow: two lit desk islands on a graded colour field; the open work stacks on one, three facts land on it one per word, then the stack travels to the other desk, whose lamp comes on
// @lab {"title": "glow-flat example: a shift handover (a process as a lit world, one accent, one change per word)", "styles": ["glow-flat"], "dur": 11.0, "times": [0.4, 2.4, 4.2, 5.4, 6.6, 8.6, 10.4], "words": [{"w": "Before", "s": 0.4, "e": 0.7}, {"w": "you", "s": 0.72, "e": 0.85}, {"w": "log", "s": 0.88, "e": 1.1}, {"w": "off", "s": 1.12, "e": 1.4}, {"w": "hand", "s": 1.6, "e": 1.85}, {"w": "the", "s": 1.87, "e": 1.95}, {"w": "work", "s": 1.97, "e": 2.25}, {"w": "over", "s": 2.27, "e": 2.6}, {"w": "Name", "s": 3.0, "e": 3.3}, {"w": "the", "s": 3.32, "e": 3.4}, {"w": "open", "s": 3.6, "e": 3.9}, {"w": "tickets", "s": 3.92, "e": 4.4}, {"w": "the", "s": 4.6, "e": 4.7}, {"w": "owner", "s": 4.9, "e": 5.3}, {"w": "and", "s": 5.5, "e": 5.6}, {"w": "the", "s": 5.62, "e": 5.7}, {"w": "deadline", "s": 6.0, "e": 6.6}, {"w": "Then", "s": 7.2, "e": 7.4}, {"w": "the", "s": 7.42, "e": 7.5}, {"w": "next", "s": 7.8, "e": 8.05}, {"w": "shift", "s": 8.07, "e": 8.4}, {"w": "starts", "s": 8.5, "e": 8.85}, {"w": "with", "s": 8.87, "e": 9.0}, {"w": "everything", "s": 9.3, "e": 9.8}, {"w": "they", "s": 9.82, "e": 9.95}, {"w": "need", "s": 9.97, "e": 10.4}]}
/* A worked example of the glow-flat style on a workplace topic (docs/styles/guides/glow-flat.md, s11).
 * Narration (sample, hypothetical): "Before you log off, hand the work over. Name the open tickets, the owner, and
 * the deadline. Then the next shift starts with everything they need."
 * What it shows, rule by rule:
 *  - the office is abstracted into two lit desk islands on a graded colour field, not a literal room: the place is
 *    real (desks, people, tickets, a calendar, a lamp) but drawn as shapes of light, so a process reads adult;
 *  - ONE accent family (accent4, cyan) carries the meaning: the tickets, their pills and the calendar mark; the rest
 *    is the field family (field, surface, violet, plum), the warm light (core) and neutrals (muted, ink);
 *  - one change per spoken word; background life (dust, a slow bob) is quiet and constant;
 *  - one light source that matters (the receiving desk's lamp), switched on at the payoff;
 *  - labels ride with what they name: the "3 open" pill travels with the tickets;
 *  - people come from the kit (rigs "ava" and "sam", no outline), at desk scale; never drawn here.
 * Deterministic: seeded builders, absolute times from literal cues, tokens only. */
Loom.scene("style_glow_flat_handover", {
  build(ctx) {
    const G = Loom.glow, K = Loom.kit, m = Loom.motion;
    const T0 = ctx.start, T1 = ctx.end, DESK_Y = 690;

    // ---- the world: a graded field lit from above, mid-tone colour fields so the frame is not near-black
    G.ground(ctx, "ground", { top: "surface", bottom: "field", bloom: "violet", bx: 0.5, by: 0.3, br: 0.75, bloomOpacity: 0.5,
      fieldTones: ["plum", "surface", "surface2", "plum"], fieldOpacity: 0.55, dust: 50, t0: T0, t1: T1 });

    // ---- soft light from above: atmosphere only, kept faint so the lamp stays the one light that means something
    G.shafts(ctx, "shafts", { n: 3, opacity: 0.08, t0: T0, t1: T1 });

    // ---- two people from the kit, waist-up behind their desks (the desks, drawn after them, hide the legs; feet below the frame)
    const giver = ctx.character("giver", "ava", { x: 300, y: 1000, scale: 0.8, skin: 1 });
    const taker = ctx.character("taker", "sam", { x: 1600, y: 1000, scale: 0.8, skin: 3, flip: true });

    // ---- two desks in the foreground: a lit top edge (violet, the field family) over a dark front that leaves the frame
    const desk = (name, x) => {
      const E = ctx.el(name, { x, y: DESK_Y, w: 700, h: 430, kind: "scenery" });   // true box: the front runs to y 430
      K.rect(E.inner, 30, 30, 640, 400, { fill: "surface2", r: 18 });
      K.rect(E.inner, 70, 76, 560, 110, { fill: "surface", r: 12, flat: true, opacity: 0.7 });   // a recessed front panel
      K.rect(E.inner, 0, 0, 700, 36, { fill: G.token("violet"), r: 14 });
      return E;
    };
    desk("desk_left", 100); desk("desk_right", 1120);

    // ---- the receiving desk's lamp: an object (stem, shade) whose light is the one glow that matters, off until the payoff
    // true boxes (round 2): the lamp spans x -70..34, y -150..2 around its foot at (1800, DESK_Y); the stem is a thin
    // polygon, not a stroke (the guide, s4: strokes only on connectors)
    const lampBody = ctx.el("lamp", { x: 1730, y: DESK_Y - 150, w: 104, h: 152, kind: "object" });
    K.rect(lampBody.inner, 36, 138, 68, 14, { fill: "surface2", r: 6, flat: true });
    K.polygon(lampBody.inner, [[66, 140], [74, 140], [56, 30], [48, 30]], { fill: "muted" });
    K.polygon(lampBody.inner, [[0, 0], [80, 0], [64, 38], [16, 38]], { fill: "muted" });
    const light = ctx.el("lamp_light", { x: 1620, y: DESK_Y - 112, w: 270, h: 112, kind: "shape" });
    K.polygon(light.inner, [[126, 0], [174, 0], [270, 112], [0, 112]], { fill: G.token("core"), opacity: 0.16 });
    G.glowDisc(light.inner, 150, 2, 20, "core", { opacity: 0.3, spread: 3 });
    // the payoff lands on "with everything" (84 % of the speech), not "everything they need" (88 %): nothing after 85 %
    m.reveal(light, ctx.cue("with everything"), { dy: 0 });

    // ---- the handover route: a quiet dashed lead between the desks (line token: a step below the text). It is
    // revealed with unmask, because m.draw rewrites the dash pattern and would draw it solid (the guide, s12 and s15)
    const route = ctx.el("route", { x: 800, y: 420, w: 330, h: 250, kind: "connector" });
    K.path(route.inner, "M 10 240 Q 165 0 320 240", { stroke: "line", sw: 4, dash: "4 14" });
    m.unmask(route, ctx.cue("hand the work over"), { dir: "ltr", dur: 0.6 });

    // ---- the work: three open tickets on the left desk, one accent family (accent4)
    // a carrier holds the work so the hop is ONE travel (x) plus ONE drive (the arc) on different groups: two chained
    // m.travel calls on one element render the second one's start state at load (see the guide, s12)
    const carrier = ctx.el("handover", { x: 410, y: 560, w: 390, h: 130, kind: "group" });
    const work = ctx.el("tickets", { x: 0, y: 0, w: 390, h: 130, kind: "card", parent: carrier.inner });
    [[55, 80, -8], [150, 72, 0], [245, 82, 7]].forEach(([x, y, rot]) => G.ticket(work.inner, x, y, { tone: "accent4", state: "open", rot, w: 110, h: 74 }));
    m.settle(work, ctx.cue("hand the work over"));
    G.idle(work, ctx.cue("Name the open tickets"), T1, { bob: 3, period: 2.4 });
    // the count rides WITH the tickets (a group inside the element, popped on its word)
    const openTag = Loom.svg("g", {}, work.inner);
    G.pill(openTag, 150, -60, "3 open", { tone: "accent4", role: "lead", point: [150, 34] });
    m.pop(openTag, ctx.cue("open tickets"));

    // ---- the owner: a pill on the person who will own it
    const owner = ctx.el("pill_owner", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(owner.inner, 1600, 280, "Owner", { tone: "accent4", role: "lead", point: [1600, 376] });
    m.pop(owner, ctx.cue("the owner"));

    // ---- the deadline: a desk calendar beside the tickets, its day marked; it travels with the work too
    const dueTag = Loom.svg("g", {}, work.inner);
    Loom.obj.shape(dueTag, "calendar", 350, 80, 96, { tone: "accent4", family: "desk", state: { mark: 4 }, key: "due" });
    m.pop(dueTag, ctx.cue("the deadline"));

    // ---- the payoff: the stack travels along the route to the other desk; the taker reacts; the lamp comes on
    // the hop: the carrier travels right while its life group rises and falls on the same eased progress (a parabola)
    const tGo = ctx.cue("next shift");
    m.travel(carrier, tGo, { x: 710, y: 0, dur: 1.1 });
    Loom.drive((e) => carrier.life.setAttribute("transform", `translate(0 ${(-480 * e * (1 - e)).toFixed(1)})`), tGo, 1.1, "editorial",
      { kind: "travel", beat: ctx.beat.id, name: "handover", key: "handover.hop" });
    giver.pose("present", ctx.cue("hand the work over"), { dur: 0.5 });
    taker.gesture("nod", ctx.cue("with everything"), ctx.cue("with everything") + 1.0);
    taker.emotion("happy", ctx.cue("with everything"));
  },
});
