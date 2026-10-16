// @lab {"title": "Screen joins (D-90, CINEMA_PLAN B7): iris (into this), wipe (time), dip (era), fade (meanwhile); the change happens under the cover", "styles": ["glow-flat", "editorial-paper"], "dur": 4.0, "times": [0.6, 1.4, 2.0, 2.6, 3.4]}
// A lab scene for the screen joins. Each quadrant is a small film: an OLD shot (a disc on the left) becomes a NEW
// shot (a block on the right) at the middle of the join, under the cover Loom.world.coverAt draws for real joins.
// Progress runs over the whole lab beat (p = t / 4), so the strip reads left to right as one join.
Loom.scene("lab_joins", {
  build(ctx) {
    const { kit } = ctx;
    const Wd = Loom.world, W = Loom.W, H = Loom.H, s = 0.44;
    const kinds = [["iris", { at: [1340, 540], from: [560, 520] }, "iris: into this"], ["wipe", { dir: "right" }, "wipe: time passes"],
      ["dip", {}, "dip: a new era"], ["fade", {}, "fade: meanwhile"]];
    kinds.forEach(([kind, def, label], i) => {
      const ox = 40 + (i % 2) * 940, oy = 24 + Math.floor(i / 2) * 530;
      const E = ctx.el("join_" + kind, { x: ox, y: oy, w: W * s, h: H * s + 76, kind: "group" });
      // the cover is a full-frame shape (its iris circle reaches past the frame); clip it to this little screen
      const cid = "lj_clip_" + kind, defs = Loom.svg("defs", {}, E.inner);
      Loom.svg("rect", { x: 0, y: 0, width: W, height: H }, Loom.svg("clipPath", { id: cid }, defs));
      const g = Loom.svg("g", { transform: `scale(${s})`, "clip-path": `url(#${cid})` }, E.inner);
      kit.rect(g, 0, 0, W, H, { fill: "field2", flat: true });
      const oldShot = Loom.svg("g", {}, g), newShot = Loom.svg("g", {}, g);
      kit.disc(oldShot, 560, 520, 220, { fill: "accent" });
      kit.rect(newShot, 1120, 330, 440, 420, { fill: "accent3", r: 40 });
      const cover = Loom.svg("path", { "fill-rule": "evenodd" }, g);
      kit.text(E.inner, label, { x: 12, y: H * s + 14, w: W * s - 24, role: "label", align: "left" });
      Loom.drive((p) => {
        oldShot.setAttribute("visibility", p < 0.5 ? "visible" : "hidden");
        newShot.setAttribute("visibility", p < 0.5 ? "hidden" : "visible");
        const C = Wd.coverAt(kind, p, def, Loom.style.pack.palette);
        cover.setAttribute("d", C.d); cover.setAttribute("fill", C.fill); cover.setAttribute("opacity", Number(C.opacity).toFixed(3));
      }, 0, 4.0, "linear", { kind: "ambient", beat: ctx.beat && ctx.beat.id, name: "join_" + kind });
    });
  },
});
