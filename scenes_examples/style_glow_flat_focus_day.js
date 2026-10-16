// @design day_rail_batching: one working day as a lit rail; scattered meeting chips are named, then travel together, and the freed stretch fills with one glowing focus block
// @lab {"title": "glow-flat example: protect focus time (data as a lit object, hold and transform, one accent)", "styles": ["glow-flat"], "dur": 11.4, "times": [0.6, 2.6, 4.4, 6.4, 7.6, 9.0, 11.0], "words": [{"w": "Say", "s": 0.4, "e": 0.6}, {"w": "your", "s": 0.62, "e": 0.75}, {"w": "day", "s": 0.77, "e": 1.0}, {"w": "has", "s": 1.02, "e": 1.2}, {"w": "six", "s": 1.4, "e": 1.65}, {"w": "meetings", "s": 1.67, "e": 2.1}, {"w": "scattered", "s": 2.3, "e": 2.9}, {"w": "No", "s": 3.4, "e": 3.6}, {"w": "gap", "s": 3.62, "e": 3.9}, {"w": "is", "s": 3.92, "e": 4.0}, {"w": "long", "s": 4.02, "e": 4.3}, {"w": "enough", "s": 4.32, "e": 4.6}, {"w": "to", "s": 4.62, "e": 4.7}, {"w": "think", "s": 4.72, "e": 5.2}, {"w": "Move", "s": 5.8, "e": 6.1}, {"w": "the", "s": 6.12, "e": 6.2}, {"w": "same", "s": 6.22, "e": 6.5}, {"w": "meetings", "s": 6.52, "e": 7.0}, {"w": "together", "s": 7.02, "e": 7.6}, {"w": "and", "s": 7.9, "e": 8.0}, {"w": "a", "s": 8.02, "e": 8.1}, {"w": "three", "s": 8.12, "e": 8.4}, {"w": "hour", "s": 8.42, "e": 8.65}, {"w": "block", "s": 8.67, "e": 9.0}, {"w": "opens", "s": 9.1, "e": 9.4}, {"w": "up", "s": 9.42, "e": 9.6}, {"w": "for", "s": 9.7, "e": 9.8}, {"w": "focused", "s": 9.82, "e": 10.3}, {"w": "work", "s": 10.32, "e": 10.7}]}
/* A worked example of the glow-flat style for a number-and-time idea at work (docs/styles/guides/glow-flat.md, s11).
 * Narration (sample, hypothetical: "Say"): "Say your day has six meetings, scattered. No gap is long enough to think.
 * Move the same meetings together, and a three hour block opens up for focused work."
 * What it shows:
 *  - data drawn as a lit OBJECT (a day rail with chips), not a chart on a card; few words, all large;
 *  - neutral things are neutral (meetings are muted chips, a neutral pill on the problem); ONE accent (accent4) lands
 *    only on the payoff, the focus block and its pill, and the one glow sits under it;
 *  - hold and transform: the same six chips travel to their new place, so the change is visible, not asserted;
 *  - every chip, label and time is its own element with an entrance on its word (nothing is visible before its cue).
 * Deterministic: seeded builders, literal cues, tokens only. */
Loom.scene("style_glow_flat_focus_day", {
  build(ctx) {
    const G = Loom.glow, K = Loom.kit, m = Loom.motion;
    const T0 = ctx.start, T1 = ctx.end;
    const X0 = 260, PX = 175, Y = 290, H = 104;           // the rail: 09:00 at x 260, 175 px an hour, to 17:00 at 1660
    const at = (hour) => X0 + (hour - 9) * PX;

    // ---- the world: a graded field with its light low and centred, under the rail
    G.ground(ctx, "ground", { top: "surface2", bottom: "field", bloom: "violet", bx: 0.5, by: 0.5, br: 0.6, bloomOpacity: 0.45,
      fieldTones: ["plum", "surface", "field2", "plum"], fieldOpacity: 0.5, floor: false, dust: 60, t0: T0, t1: T1 });

    // ---- the person whose day it is: from the kit (rig "ava"), at her desk, feet below the frame
    const ava = ctx.character("worker", "ava", { x: 960, y: 1180, scale: 0.86, skin: 2 });
    const desk = ctx.el("desk", { x: 560, y: 820, w: 800, h: 330, kind: "scenery" });   // true box: the front runs to y 330
    K.rect(desk.inner, 30, 30, 740, 300, { fill: "surface2", r: 18 });
    K.rect(desk.inner, 0, 0, 800, 36, { fill: G.token("violet"), r: 14 });
    Loom.obj.draw(ctx, "laptop", "laptop", { x: 1180, y: 790, size: 150, tone: "muted", state: { facing: "away" }, t: T0 });

    // ---- the day: one lit rail with three hour marks under it (muted, small, never the accent)
    const RX = X0 - 90;   // the element is wider than the rail so the hour labels stay inside it
    const rail = ctx.el("day_rail", { x: RX, y: Y - 20, w: 8 * PX + 180, h: H + 120, kind: "instrument" });
    K.rect(rail.inner, 70, 0, 8 * PX + 40, H + 40, { fill: "surface2", r: (H + 40) / 2 });
    [["9:00", 9], ["12:00", 12], ["17:00", 17]].forEach(([label, hr]) => {
      K.line(rail.inner, at(hr) - RX, H + 44, at(hr) - RX, H + 62, { stroke: "line", sw: 3, crisp: true });
      K.text(rail.inner, label, { role: "caption", x: at(hr) - RX - 70, y: H + 66, w: 140, h: 40, align: "center", color: "muted", maxLines: 1 });
    });
    m.settle(rail, ctx.cue("Say your day"));

    // ---- six meetings, scattered: muted chips (neutral things stay neutral)
    const before = [[9.5, 0.5], [10.75, 0.5], [11.75, 1], [13.5, 0.5], [14.5, 0.5], [15.75, 0.5]];
    const after = [[13, 0.5], [13.5, 0.5], [14, 1], [15, 0.5], [15.5, 0.5], [16, 0.5]];
    const chips = before.map(([hr, len], i) => {
      const E = ctx.el(`meeting_${i + 1}`, { x: at(hr) + 4, y: Y, w: len * PX - 8, h: H, kind: "token" });
      K.rect(E.inner, 0, 0, len * PX - 8, H, { fill: "muted", r: 22 });
      K.icon(E.inner, "users", { x: (len * PX - 8) / 2, y: H / 2, size: 40, color: G.token("onAccent") });   // falls back in other packs
      return E;
    });
    m.group(chips, ctx.cue("six meetings"), { enter: "pop", stagger: 0.07 });

    // ---- the problem, named on its word: a neutral pill on one of the short gaps
    const gap = ctx.el("gap_label", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(gap.inner, at(10.4), Y - 110, "too short to think", { tone: G.token("violet"), role: "lead", point: [at(10.4), Y + 10] });
    m.pop(gap, ctx.cue("No gap"));
    ava.emotion("concerned", ctx.cue("No gap")); ava.look(0, -0.7, ctx.cue("No gap"));

    // ---- hold and transform: the same chips travel to the afternoon, one after another
    const tMove = ctx.cue("Move the same meetings");
    m.exit(gap, tMove, "recede");
    chips.forEach((E, i) => m.travel(E, tMove + i * 0.07, { x: at(after[i][0]) - at(before[i][0]), y: 0, dur: 0.8 }));

    // ---- the payoff: one accent, one glow. The focus block grows into the freed morning
    const focus = ctx.el("focus_block", { x: at(9) + 4, y: Y, w: 3 * PX - 8, h: H, kind: "value" });
    G.glowDisc(focus.inner, (3 * PX - 8) / 2, H / 2, 70, "accent4", { core: false, rings: 14, opacity: 0.1, spread: 3.2 });   // many faint rings: fewer visible steps
    K.rect(focus.inner, 0, 0, 3 * PX - 8, H, { fill: "accent4", r: 22 });
    m.grow(focus, ctx.cue("three hour block"), { axis: "x" });
    // sparkles are built BEFORE the label, so they sit under it in the stacking order and never cross its words
    G.sparkles(ctx.g, { x: at(9), y: Y - 60, w: 3 * PX, h: 60, n: 4, size: 16, color: "core", seed: "focus", t0: ctx.cue("opens up"), t1: T1 });
    const tag = ctx.el("focus_tag", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
    G.pill(tag.inner, at(10.5), Y - 110, "3 h focus", { tone: "accent4", role: "lead", point: [at(10.5), Y + 6] });
    m.pop(tag, ctx.cue("opens up"));
    ava.emotion("happy", ctx.cue("opens up")); ava.pose("explain", ctx.cue("opens up"), { dur: 0.5 });
  },
});
