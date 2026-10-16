// @lab {"title": "Material and motif joins (D-114): torn, page, scroll, motif, handoff, fill; the camera jumps under each cover at p = 0.5", "styles": ["story-cartoon", "corporate-clean"], "dur": 4.0, "times": [0.6, 1.2, 1.5, 1.8, 2.0, 2.4, 2.8, 3.4]}
// A lab scene for the material joins. Each little screen is a film: an OLD shot (a disc, or a card for the fill join)
// becomes a NEW shot (a block) at the middle of the join, under the cover Loom.world.coverAt draws for real joins
// (it delegates these kinds to Loom.material). Progress runs over the whole lab beat (p = t / 4), so the strip reads
// left to right as one join. The shading layers (page flap, roll shadow) are drawn with Loom.material.drawLayers.
Loom.scene("lab_material", {
  build(ctx) {
    const { kit } = ctx;
    const Wd = Loom.world, W = Loom.W, H = Loom.H, s = 0.3;
    const kinds = [
      ["torn", { dir: "right", seed: 7 }, "torn: paper matte, seeded edge"],
      ["page", { corner: "br" }, "page: lands, then peels from a corner"],
      ["scroll", { dir: "right" }, "scroll: a band with a rolled edge"],
      ["motif", { shape: "heart", from: [560, 520], at: [1340, 540] }, "motif: the topic's shape (heart)"],
      ["handoff", { to: "accent2", from: "left" }, "handoff: the next field colour grows in"],
      ["fill", { box: [300, 330, 520, 380], token: "accent" }, "fill: the old card grows into the new ground"],
    ];
    kinds.forEach(([kind, def, label], i) => {
      const ox = 60 + (i % 3) * 610, oy = 70 + Math.floor(i / 3) * 470;
      const E = ctx.el("join_" + kind, { x: ox, y: oy, w: W * s, h: H * s + 70, kind: "group" });
      const cid = "lm_clip_" + kind, defs = Loom.svg("defs", {}, E.inner);
      Loom.svg("rect", { x: 0, y: 0, width: W, height: H }, Loom.svg("clipPath", { id: cid }, defs));
      const g = Loom.svg("g", { transform: `scale(${s})`, "clip-path": `url(#${cid})` }, E.inner);
      kit.rect(g, 0, 0, W, H, { fill: "field", flat: true });
      const oldShot = Loom.svg("g", {}, g), newShot = Loom.svg("g", {}, g);
      if (kind === "fill") kit.rect(oldShot, def.box[0], def.box[1], def.box[2], def.box[3], { fill: def.token, r: 0, flat: true });
      else kit.disc(oldShot, 560, 520, 220, { fill: "accent" });
      // the new shot sits on the colour a handoff or fill join hands it
      if (kind === "handoff") kit.rect(newShot, 0, 0, W, H, { fill: def.to, flat: true });
      if (kind === "fill") kit.rect(newShot, 0, 0, W, H, { fill: def.token, flat: true });
      kit.rect(newShot, 1120, 330, 440, 420, { fill: kind === "fill" || kind === "handoff" ? "surface" : "accent3", r: 40 });
      const cover = Loom.svg("path", { "fill-rule": "evenodd" }, g);
      const layers = Loom.material.layerGroup(g);
      Loom.svg("rect", { x: 0, y: 0, width: W, height: H, fill: "none", stroke: ctx.c("line"), "stroke-width": 4 }, g);
      kit.text(E.inner, label, { x: 10, y: H * s + 10, w: W * s - 20, h: 44, role: "label", align: "left", maxLines: 1 });
      Loom.drive((p) => {
        oldShot.setAttribute("visibility", p < 0.5 ? "visible" : "hidden");
        newShot.setAttribute("visibility", p < 0.5 ? "hidden" : "visible");
        const C = Wd.coverAt(kind, p, def, Loom.style.pack.palette);
        cover.setAttribute("d", C.d); cover.setAttribute("fill", C.fill); cover.setAttribute("opacity", Number(C.opacity).toFixed(3));
        Loom.material.drawLayers(layers, C.layers);
      }, 0, 4.0, "linear", { kind: "ambient", beat: ctx.beat && ctx.beat.id, name: "join_" + kind });
    });
  },
});
