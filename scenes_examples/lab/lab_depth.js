// @lab {"title": "Depth stage (2.5D in the page): layered depth, aerial perspective, depth of field, bloom, light cone and a slow push-in", "styles": ["cinematic-noir", "cinematic-dawn"], "dur": 5.0, "times": [0.2, 1.6, 3.0, 4.8]}
// A lab scene: absolute times. The same stage code reads as night in noir and as sunrise in dawn: every colour is a token.
Loom.scene("lab_depth", {
  build(ctx) {
    const { kit, m } = ctx;
    const night = ctx.style.pack.id === "cinematic-noir";
    const st = ctx.depth("stage", { dolly: [0, 5], push: 0.12, drift: -60, focus: 0.62, cy: 700 });
    st.sky(night ? "field" : "surface", night ? "field2" : "field2");
    const sun = night ? [1380, 240, 58] : [1060, 470, 84];
    st.glow(sun[0], sun[1], sun[2], night ? "ink" : "surface");
    // far: a city skyline (noir) or far hills (dawn), toned toward the field by distance
    const far = st.layer(0.15);
    if (night) {
      let x = -120;
      const rng = Loom.rng("skyline");
      while (x < 2100) {
        const w = 60 + rng() * 110, h = 140 + rng() * 300;
        Loom.svg("rect", { x, y: 720 - h, width: w, height: h + 400, fill: st.tone("surface", 0.15) }, far);
        for (let wy = 720 - h + 18; wy < 700; wy += 34) for (let wx = x + 12; wx < x + w - 16; wx += 26)
          if (rng() > 0.72) Loom.svg("rect", { x: wx, y: wy, width: 10, height: 14, fill: ctx.c("accent"), opacity: 0.55 }, far);
        x += w + 8;
      }
    } else {
      st.ridge(0.12, [[-100, 640], [300, 560], [700, 610], [1100, 540], [1500, 600], [2000, 560]], "accent3");
    }
    st.ridge(0.35, [[-100, 760], [400, 660], [800, 720], [1300, 650], [1800, 720], [2100, 690]], night ? "surface2" : "accent", { rim: night ? "accent3" : "surface", rimOpacity: 0.5 });
    st.haze(0.45, 620, night ? "accent3" : "surface");
    // the focus plane: a hill with a figure on it (a rigged character inside a depth layer)
    const mid = st.ridge(0.62, [[-100, 880], [500, 820], [900, 850], [1300, 800], [2100, 860]], night ? "field" : "accent3");
    if (night) st.cone(760, 470, 520, 420, "accent");
    if (night) { Loom.svg("rect", { x: 752, y: 470, width: 10, height: 380, fill: ctx.c("shadow") }, mid); Loom.svg("rect", { x: 730, y: 462, width: 58, height: 14, rx: 7, fill: ctx.c("accent") }, mid); }
    const who = ctx.character("figure", night ? "sam" : "ava", { x: night ? 900 : 1240, y: night ? 848 : 808, scale: 0.34, skin: night ? 2 : 1, top: night ? "surface" : "accent", bottom: "shadow", parent: mid, flip: !night });
    who.pose(night ? "think" : "present", 0.8, { dur: 0.8 });
    // near: a dark foreground edge, out of focus
    st.ridge(1.0, [[-200, 1000], [300, 930], [700, 1010], [1200, 1060], [1700, 960], [2200, 1000]], night ? "shadow" : "ink");
    // the title is outside the stage: it does not move with the dolly
    const T = ctx.el("title", { x: 120, y: 120, w: 900, h: 220, kind: "text" });
    kit.text(T.inner, night ? "Nobody saw it coming" : "Where we are headed", { role: "title", x: 0, y: 0, w: 900, h: 120, color: night ? "ink" : "ink", weight: 800 });
    kit.text(T.inner, night ? "Case file, part one" : "The next twelve months", { role: "lead", x: 0, y: 118, w: 900, h: 60, color: "muted" });
    m.reveal(T, 0.9);
  },
});
