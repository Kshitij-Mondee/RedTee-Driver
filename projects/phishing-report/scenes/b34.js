// @design split_futures: one moment divides down a seam into two panels of the same room, one lit and one waiting
/* b34 - the fork. From the click the frame splits down the middle (one vertical seam, drawn top to bottom) into two
 * panels of the SAME corridor: the same glass wall and meeting, the same bench, laptop and Ravi. Left: Ravi quietly
 * deletes the notice (it drops into a bin), the small report light on his laptop flickers and goes out, and the dashed
 * path to the security desk (pip and tess, a lamp) carries nothing, so the lamp stays dark. The right panel is built
 * here, dim and waiting, with everything b35 needs (button, light, path, lamp), so b35 lights it without a re-layout.
 * The held thought bubble from b33 dissolves as the seam is drawn. The right panel is the element "ravi_set".
 * Treatments weighed: (A) two separate cards side by side (rejected: no sameness to compare), (B) a branching diagram of
 * arrows (rejected: it is a story about a person), (C) CHOSEN: one room, split, so the only difference is what he does.
 */
Loom.scene("b34", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (...a) => Loom.svg(...a);
    const col = (t) => S.c(t);
    const tint = (t, p) => (p >= 0 ? S.lighten(S.c(t), p) : S.darken(S.c(t), -p));
    const keep = (E) => { E.exit = "none"; return E; };
    const flat = (g, x, y, w, h, fill, o) => kit.rect(g, x, y, w, h, Object.assign({ fill, r: 0, flat: true, shadow: false }, o || {}));
    const poly = (g, pts, fill, op) => svg("polygon", { points: pts.map((q) => q.join(",")).join(" "), fill, opacity: op }, g);
    const R0 = Loom.__ravi;
    if (!R0) { Loom.error("b34_needs_b33", "b34 follows the room that b32 and b33 build"); return; }
    const ctxF = Object.assign({}, ctx, { end: ctx.end + 30 });                  // the two Ravis keep living through b36 and b37

    // ---- the words this beat lands on
    const tClick = ctx.cue("From the click"), tTwo = ctx.cue("two paths"), tQuiet = ctx.cue("quietly deletes it");
    const tDeletes = ctx.cue("deletes it"), tLearns = ctx.cue("The team learns nothing");

    // ---- b33's room, thought and key light are held, then dissolve as the seam is drawn
    ["corridor_set", "thought_bubble", "key_glow"].forEach((n, i) => {
      const E = ctx.held(n);
      if (E) Loom.tween(E.mover, { opacity: 1 }, { opacity: 0, duration: i === 1 ? 0.7 : 1.0, ease: Loom.ease.exit, immediateRender: false }, tClick + (i === 1 ? 0 : 0.1), { kind: "exit", beat: ctx.beat.id, name: n });
    });

    // ---- one panel of the room (same drawing, two states): wall, meeting behind glass, floor, bench, laptop, Ravi, security desk
    function panel(side) {
      const left = side === "left", x0 = left ? 0 : 960, xc = x0 + 480;
      const E = ctx.el(left ? "fork_left" : "ravi_set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
      const cid = Loom.uid("clip");
      const clip = svg("rect", { x: x0, y: -100, width: 960, height: 1300 }, svg("clipPath", { id: cid, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, E.inner)));
      const wg = svg("g", {}, svg("g", { "clip-path": `url(#${cid})` }, E.inner));
      const kid = (nm, o) => keep(ctx.el(nm + "_" + side, Object.assign({ parent: wg, kind: "scenery" }, o)));
      const H = { side, E, clip, wg, xc, x0 };

      // the wall and windows behind the glass
      const back = kid("wall", { x: 0, y: 0, w: 1920, h: 1080 }), B = back.inner;
      flat(B, xc - 1100, -100, 2200, 800, "surface");
      flat(B, xc - 1100, 80, 2200, 14, "surface2");
      [xc + 640, xc - 930].forEach((x, i) => {
        flat(B, x, 150, 280, 330, "field", { r: 3 });
        const rg = Loom.rng("fork_sky_" + i);
        for (let k = 0; k < 5; k++) { const bh = 60 + rng(rg) * 150; flat(B, x + 8 + k * 54, 150 + 330 - bh - 8, 46, bh, "surface2", { opacity: 0.9 }); }
        flat(B, x + 138, 150, 6, 330, "surface");
      });
      function rng(r) { return r(); }

      // the meeting: grey extras seated at the table, cut at the frosted panel
      const cid2 = Loom.uid("clip");
      svg("rect", { x: xc - 1200, y: -300, width: 2400, height: 990 }, svg("clipPath", { id: cid2, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, wg)));
      const seats = svg("g", { "clip-path": `url(#${cid2})` }, wg);
      const n = left ? 6 : 11, poses = ["explain", "idle", "think", "idle", "present", "idle", "idle", "think", "idle", "idle", "explain"];
      H.seats = seats; H.exApis = [];
      H.extras = Loom.array(ctxF, "meeting_extras_" + side, { x: xc - (n - 1) * 90, y: 0, cols: n, rows: 1, dx: 180, dy: 0, parent: seats, kind: "scenery", exit: "none",
        draw: (g, i, r, c, rnd) => {
          const ex = Loom.rig.place(ctxF, `extra_${side}_${i + 1}`, "extra", { x: 0, y: 800, scale: 0.37 + rnd() * 0.03, parent: g, top: i === 4 ? "muted" : "line", exit: "none", flip: rnd() > 0.5 });
          H.exApis.push(ex);
          ex.pose(poses[i % poses.length], ctx.start + 0.1, { dur: 0.6 });
          const a = ctx.start + 0.8 + rnd() * 3.5, b = ctx.start + 8 + rnd() * 5;
          ex.gesture(i % 2 ? "nod" : "beat", a, a + 1.6);
          ex.gesture(i % 2 ? "beat" : "nod", b, b + 1.6);
        } });

      // the glass, the frosted panel, the floor, the bench with its pool of light
      const front = kid("glass", { x: 0, y: 0, w: 1920, h: 1080 }), G = front.inner;
      flat(G, xc - 1100, 100, 2200, 750, "field", { opacity: 0.45 });
      flat(G, xc - 1100, 690, 2200, 150, "field2", { opacity: 0.93 });
      flat(G, xc - 1100, 688, 2200, 3, "line", { opacity: 0.5 });
      for (let i = 0; i < 7; i++) flat(G, xc - 1110 + i * 370, 96, 16, 770, "surface");
      flat(G, xc - 1100, 90, 2200, 20, "surface");
      flat(G, xc - 1100, 836, 2200, 34, "field2");
      flat(G, xc - 1100, 870, 2200, 400, "field");
      flat(G, xc - 1100, 868, 2200, 4, "line", { opacity: 0.5 });
      poly(G, [[xc - 270, -60], [xc - 90, -60], [xc + 260, 930], [xc - 330, 930]], col("accent"), 0.05);
      [[xc - 60, 930, 520, 60, 0.07], [xc - 60, 930, 340, 40, 0.09], [xc - 60, 930, 190, 24, 0.1]].forEach(([cx, cy, rx, ry, op]) => svg("ellipse", { cx, cy, rx, ry, fill: col("accent"), opacity: op }, G));
      svg("ellipse", { cx: xc + 120, cy: 930, rx: 270, ry: 18, fill: col("shadow"), opacity: 0.55 }, G);
      [xc - 90, xc + 320].forEach((x) => flat(G, x, 752, 28, 166, "surface2"));
      flat(G, xc - 110, 735, 460, 12, tint("accent", -0.45), { r: 3 });
      flat(G, xc - 110, 747, 460, 18, tint("accent", -0.7), { r: 3 });
      flat(G, xc - 110, 735, 460, 3, tint("accent", -0.1), { opacity: 0.75 });

      // the laptop: the mail window with the notice, the report button, a status strip that is the alert colour until it is handled
      const LX = xc - 60, LY = 465, LW = 380, LH = 270;
      const lap = kid("laptop", { x: LX, y: LY, w: LW + 60, h: LH, kind: "instrument" }), L = lap.inner;
      kit.polygon(L, [[-24, LH - 22], [LW + 24, LH - 22], [LW + 6, LH], [-6, LH]], { fill: "surface" });
      kit.rect(L, 0, 0, LW, LH - 22, { fill: "surface2", r: 12, shade: "recipe" });
      flat(L, 14, 14, LW - 28, LH - 50, "surface", { r: 3 });
      flat(L, 14, 14, LW - 28, 26, "surface2");
      [["neg", 32], ["accent", 48], ["pos", 64]].forEach(([tk, x]) => svg("circle", { cx: x, cy: 27, r: 4.5, fill: col(tk), opacity: 0.85 }, L));
      [0, 1].forEach((i) => { kit.disc(L, 34, 62 + i * 30, 8, { fill: i ? "accent4" : "accent3", flat: true, shadow: false }); flat(L, 54, 54 + i * 30, 120 + i * 40, 8, "muted", { r: 4, opacity: 0.7 }); flat(L, 54, 68 + i * 30, 200 - i * 30, 7, "line", { r: 3.5, opacity: 0.8 }); });
      flat(L, 14, LH - 52, LW - 28, 14, "accent2", { opacity: 0.9 });          // the status strip (heats to calm in b35)
      const note = kid("notice", { x: LX + 28, y: LY + 112, w: 190, h: 86, kind: "card" });
      kit.rect(note.inner, 0, 0, 190, 86, { fill: "ink", r: 10, shade: "recipe" });
      flat(note.inner, 16, 20, 44, 38, "accent2", { r: 5 });                    // a parcel, drawn plainly so it can heat
      flat(note.inner, 36, 20, 6, 38, "field", { opacity: 0.35 });
      flat(note.inner, 16, 34, 44, 6, "field", { opacity: 0.35 });
      flat(note.inner, 74, 18, 96, 9, "line", { r: 4.5, opacity: 0.9 });
      flat(note.inner, 74, 36, 70, 8, "line", { r: 4, opacity: 0.6 });
      kit.pill(note.inner, 74, 54, 76, 18, { fill: "accent2", flat: true, shadow: false });
      // the report button: it is on his screen in both futures
      const btnE = kid("report_button", { x: LX + 236, y: LY + 150, w: 120, h: 52, kind: "node" });
      kit.pill(btnE.inner, 0, 0, 120, 52, { fill: "accent3", flat: true, shadow: false });
      kit.text(btnE.inner, "Report", { role: "label", x: 0, y: 0, w: 120, h: 52, align: "center", valign: "middle", maxLines: 1, weight: 700, color: S.pickTokenOn("accent3") });
      // the report light: a small lamp on the lid
      const lightE = kid("report_light", { x: 0, y: 0, w: 10, h: 10, kind: "token" });
      [[26, 0.1], [18, 0.18]].forEach(([r, op]) => svg("circle", { cx: 0, cy: 0, r, fill: col("accent"), opacity: op }, lightE.inner));
      kit.disc(lightE.inner, 0, 0, 10, { fill: "accent", flat: true, shadow: false });
      const sx = xc + 290, sy = 446;
      lightE.mover.setAttribute("transform", `translate(${sx} ${sy})`);

      // the security desk upstairs: two ordinary figures at a desk, a lamp
      const room = kid("security_room", { x: 0, y: 0, w: 1920, h: 1080 }), Rm = room.inner;
      const IX = xc - 440, IY = 110, IW = 320, IH = 225;
      flat(Rm, IX - 5, IY - 5, IW + 10, IH + 10, "line", { r: 4 });
      flat(Rm, IX, IY, IW, IH, "field2", { r: 2 });
      flat(Rm, IX, IY + 150, IW, 75, "field");
      flat(Rm, IX + 200, IY + 30, 96, 74, "surface", { r: 2 });                   // a window in their room
      H.roomGlow = kid("security_light", { x: 0, y: 0, w: 1920, h: 1080 });
      flat(H.roomGlow.inner, IX, IY, IW, IH, "accent", { opacity: 0.1, r: 2 });
      Loom.set(H.roomGlow.inner, { opacity: 0 }, 0);
      const pip = Loom.rig.place(ctxF, "pip_" + side, "pip", { x: xc - 380, y: 335, scale: 0.2, skin: 0, top: "accent4", parent: wg, exit: "none" });
      const tess = Loom.rig.place(ctxF, "tess_" + side, "tess", { x: xc - 290, y: 335, scale: 0.2, skin: 1, top: "accent3", parent: wg, exit: "none" });
      pip.look(0.5, 0.2, ctx.start); tess.look(-0.4, 0.2, ctx.start);
      const desk = kid("security_desk", { x: 0, y: 0, w: 1920, h: 1080 }), Dk = desk.inner;
      flat(Dk, IX + 4, IY + 158, IW - 8, 62, "surface", { r: 2 });
      flat(Dk, IX + 4, IY + 156, IW - 8, 5, "muted", { opacity: 0.8 });
      flat(Dk, xc - 176, 262, 32, 8, "muted", { r: 3 });                         // the desk lamp, off: base, arm, shade
      svg("line", { x1: xc - 160, y1: 262, x2: xc - 172, y2: 232, stroke: col("muted"), "stroke-width": 4, "stroke-linecap": "round" }, Dk);
      poly(Dk, [[xc - 188, 222], [xc - 156, 222], [xc - 146, 244], [xc - 198, 244]], col("line"), 1);
      const lampOn = kid("security_lamp_on", { x: 0, y: 0, w: 1920, h: 1080 });
      poly(lampOn.inner, [[xc - 198, 244], [xc - 146, 244], [xc - 118, 306], [xc - 232, 306]], col("accent"), 0.3);
      poly(lampOn.inner, [[xc - 188, 222], [xc - 156, 222], [xc - 146, 244], [xc - 198, 244]], col("accent"), 1);
      svg("circle", { cx: xc - 172, cy: 244, r: 30, fill: col("accent"), opacity: 0.18 }, lampOn.inner);
      Loom.set(lampOn.inner, { opacity: 0 }, 0);
      H.lampOn = lampOn; H.pip = pip; H.tess = tess;

      // the route the light would take: a dashed path from the lid, up the right side, left to the security desk
      const pathD = `M${sx} ${sy - 12} C${sx + 12} 320 ${sx - 20} 238 ${xc + 90} 236 L${xc - 120} 238`;
      const route = kid("report_path", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
      H.path = svg("path", { d: pathD, fill: "none", stroke: col("line"), "stroke-width": 3.5, "stroke-dasharray": "3 12", "stroke-linecap": "round", opacity: 0.9 }, route.inner);

      if (left) {                                                             // the bin the notice will drop into
        const binX = xc + 400;
        const bin = kid("bin", { x: binX - 52, y: 812, w: 104, h: 108, kind: "node" });
        poly(bin.inner, [[8, 20], [96, 20], [86, 106], [18, 106]], col("line"), 1);
        flat(bin.inner, 0, 8, 104, 14, "muted", { r: 3 });
        [30, 52, 74].forEach((x) => flat(bin.inner, x, 34, 4, 60, "field", { opacity: 0.35 }));
        H.bin = bin; H.binX = binX;
      }
      // Ravi: the same man, the same bench, either side of the fork
      const ravi = Loom.rig.place(ctxF, "ravi_" + side, "sam", { x: xc - 200, y: 915, scale: 0.5, skin: 2, top: "accent3", bottom: "line", shoe: "field", parent: wg, exit: "none" });
      ravi.look(0.7, 0.4, ctx.start);
      // the dim: the left is night, the right waits
      const dim = kid("dim", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
      flat(dim.inner, xc - 1100, -100, 2200, 1300, "field", { opacity: 1 });
      Loom.set(dim.inner, { opacity: left ? 0.28 : 0.6 }, 0);

      Object.assign(H, { ravi, lap, note, btnE, lightE, dim, lamp: lampOn, LX, LY, sx, sy, pathD });
      return H;
    }
    const PL = panel("left"), PR = panel("right");
    // Ravi's panel needs the dim above everything but the people, so the order of creation is: scenery, people, then dim

    // ---- the seam and the opening of the two panels from it
    // @form split_seam: one vertical line drawn top to bottom that divides the frame into two panels of the same set
    const seam = ctx.el("fork_seam", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    svg("line", { x1: 960, y1: -10, x2: 960, y2: 1090, stroke: col("accent"), "stroke-width": 16, opacity: 0.12 }, seam.inner);
    svg("line", { x1: 960, y1: -10, x2: 960, y2: 1090, stroke: col("ink"), "stroke-width": 3 }, seam.inner);
    m.draw(seam, tClick + 0.15, { dur: 1.1 });
    [PL, PR].forEach((P) => Loom.tween(P.clip, { attr: { x: 960, width: 0 } }, { attr: { x: P.x0, width: 960 }, duration: 0.95, ease: Loom.ease.editorial }, tTwo - 0.25, { kind: "reveal", beat: ctx.beat.id, name: P.E.name, content: true }));

    // ---- left: Ravi deletes the notice, it drops into a bin
    const binX = PL.binX, bin = PL.bin;
    const nE = PL.note, nx0 = PL.LX + 28 + 95, ny0 = PL.LY + 112 + 43;
    PL.ravi.look(0.9, 0.55, tDeletes - 0.6);
    PL.ravi.gesture("nod", tDeletes, tDeletes + 1.1);
    const dx = binX - nx0, dy = 850 - ny0;
    Loom.drive((e) => {
      const lift = -110 * Math.sin(Math.PI * e), s = 1 - 0.55 * e;
      nE.mover.setAttribute("transform", `translate(${(dx * e).toFixed(2)} ${(dy * e * e + lift).toFixed(2)}) translate(95 43) scale(${s.toFixed(3)}) translate(-95 -43)`);
    }, tDeletes - 0.1, 0.95, "editorial", { kind: "travel", beat: ctx.beat.id, name: "notice_left", content: true });
    Loom.tween(nE.inner, { opacity: 1 }, { opacity: 0, duration: 0.18, ease: Loom.ease.exit, immediateRender: false }, tDeletes + 0.78, { kind: "fade_out", beat: ctx.beat.id, name: "notice_left", content: true });
    Loom.sfx("land", tDeletes + 0.8);
    m.press(bin, tDeletes + 0.82);
    Loom.data.tag(ctx, "tag_deletes", { x: PL.xc - 120, y: 800, text: "QUIETLY DELETES IT", color: "accent4", textColor: "onAccent", t: tQuiet });

    // ---- left: the light flickers and goes out, the path carries nothing, the lamp stays dark
    const lf = PL.lightE;
    Loom.drive((e, raw) => {
      const now = tLearns + raw * 1.25;
      const on = now < tLearns + 0.15 ? 1 : now < tLearns + 1.0 ? ((Loom.hash("flick" + Math.floor(now * 13)) % 3) ? 0.9 : 0.15) : 0.4;
      lf.inner.setAttribute("opacity", String(on));
    }, tLearns, 1.25, "linear", { kind: "ambient", beat: ctx.beat.id, name: "report_light_left" });
    Loom.tween(lf.life, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: Loom.ease.exit, immediateRender: false }, tLearns + 1.2, { kind: "fade_out", beat: ctx.beat.id, name: "report_light_left", content: true });
    Loom.data.tag(ctx, "tag_nothing", { x: PL.xc - 100, y: 142, text: "THE TEAM LEARNS NOTHING", color: "accent2", textColor: "onAccent", t: tLearns });

    // ---- right: waiting. Only the people breathe; b35 lights it
    Loom.__ravi.fork = { L: PL, R: PR, seam };
  },
});
