// @lab {"title": "Character rig v1: Ava explains and talks (lip sync from word timings), Sam walks in, waves and points", "styles": ["corporate-clean", "flat-cosmos"], "dur": 5.0, "times": [0.3, 1.1, 1.9, 2.6, 3.4, 4.6], "words": [{"w": "So", "s": 0.4, "e": 0.62}, {"w": "here", "s": 0.64, "e": 0.9}, {"w": "is", "s": 0.92, "e": 1.05}, {"w": "the", "s": 1.07, "e": 1.18}, {"w": "plan", "s": 1.2, "e": 1.6}, {"w": "we", "s": 2.3, "e": 2.45}, {"w": "ship", "s": 2.47, "e": 2.8}, {"w": "on", "s": 2.82, "e": 2.98}, {"w": "Monday", "s": 3.0, "e": 3.6}]}
// A lab scene: absolute times. A flat set (floor, wall panel with a chart) and two rigged characters acting on it.
Loom.scene("lab_characters", {
  build(ctx) {
    const { kit, m } = ctx;
    // the set: a wall, a floor line and a board on the wall; the board is what they talk about
    const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    kit.rect(set.inner, 0, 820, 1920, 260, { fill: "field2", r: 0, flat: true });
    kit.line(set.inner, 0, 820, 1920, 820, { stroke: "line", sw: 3 });
    const board = ctx.el("board", { x: 820, y: 170, w: 620, h: 420, kind: "card" });
    kit.rect(board.inner, 0, 0, 620, 420, { fill: "surface" });
    kit.text(board.inner, "Launch plan", { role: "label", x: 36, y: 24, w: 548, h: 60, weight: 700 });
    [0.45, 0.7, 0.95].forEach((v, i) => {
      const bar = ctx.el(`bar_${i + 1}`, { x: 60 + i * 180, y: 390 - 280 * v, w: 120, h: 280 * v, kind: "shape", parent: board.inner });
      kit.rect(bar.inner, 0, 0, 120, 280 * v, { fill: ["accent2", "accent3", "accent"][i] });
      m.grow(bar, 0.6 + i * 0.18);
    });
    m.settle(board, 0.1, { dy: 30 });

    // Ava: stands left, explains (talks through the words), then presents the board
    const ava = ctx.character("ava", "ava", { x: 480, y: 900, scale: 0.78, skin: 1, top: "accent", bottom: "ink" });
    ava.pose("explain", 0.3, { dur: 0.5 });
    ava.talk(0.35, 3.7);
    ava.gesture("beat", 0.5, 1.7);
    ava.pose("present", 2.2, { dur: 0.5 });
    ava.look(1, 0, 2.2);
    ava.emotion("happy", 3.7);
    ava.pose("cheer", 4.1, { dur: 0.45 });

    // Sam: walks in from the right, waves, then points at the board
    const sam = ctx.character("sam", "sam", { x: 2050, y: 905, scale: 0.8, skin: 2, top: "accent4", bottom: "muted", flip: true });
    sam.walk(0.2, 1.8, -520, 1.7);
    sam.pose("wave", 1.9, { dur: 0.4 });
    sam.gesture("wave", 2.1, 3.0);
    sam.emotion("happy", 2.0);
    sam.pose("point", 3.2, { dur: 0.45 });
    sam.look(-1, -0.5, 3.2);
    sam.gesture("nod", 3.8, 4.8);
  },
});
