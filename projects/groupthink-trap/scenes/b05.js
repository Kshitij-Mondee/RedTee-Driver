// @design private_doubts_opened: held thought bubbles over a row of quiet people open one at a time, each turning into the object its owner privately worries about, with a one-word tag
/* b05 - "Inside each head, a doubt." The close frame along the table: the four colleagues and their bubbles (Dana is
 * out of frame: the leader cannot see them either). This is the lesson's central picture and the poster frame.
 * Treatments considered (lnd-motion-choreography-loop):
 *  (A) static + signalling: all four bubbles already open with their objects, a highlight travelling across them.
 *      Rejected: the doubts must arrive one at a time ON their words; the order is the narration's, not the seats'.
 *  (B) a magnifier on each head in turn (Loom.magnify). Rejected: it would say "look inside the person", but the set
 *      bible already gives each doubt a folded bubble that the viewer has watched since b01; opening THAT bubble is
 *      the payoff of the device (doubt_bubbles: folded, open, folded, lid are one outline).
 *  (C) CHOSEN: on "Inside each head" the four folded bubbles swell together (two drawings, 1.06); then each one opens
 *      on its own words: the outline MORPHS from folded to the open wobble (Loom.morph.to, stepped), the object draws
 *      in (ink outline first, its colours after) and its one-word tag is lettered under it. Order: testing, support,
 *      client, and last the fast yes on the far left ("even"). Each object carries one small red mark (the empty
 *      boxes, the mic tip, the wax seal, the question mark). Nobody looks up.
 * The four objects are the SAME drawings as b08 (the same Loom.obj families, tones and red marks, drawn here at the
 * bubble's scale), so the viewer recognises them when they fail.
 * Rules from the references (TED-Ed s7; style_guide: bubble_with_changing_content, externalised_inner_state,
 * morph_chain_in_place, draw_on_as_named, single_accent_on_muted_field): a still camera on a moving drawing; hand-made
 * time (stepped drawings, a boiling outline in the hold); the accent only on the red marks and seams; tags are words,
 * so they are never stepped or boiled.
 */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const svg = Loom.svg, S = ctx.style;
    const STEP = 1 / 6;
    const f1 = (v) => Math.round(v * 10) / 10;

    // everything is held through the cut (Dana, the board and the sheet are out of frame but b07 needs them)
    ["set", "window_cloud", "board", "clock", "table", "board_slot", "stamp", "sheet"].forEach((n) => ctx.held(n));
    const NAMES = ["dana", "p_date", "p_test", "p_support", "p_client"];
    const P = {}; NAMES.forEach((n) => { P[n] = ctx.held(n).__api; });
    const KEYS = ["date", "test", "support", "client"];
    const OWNER_X = { date: 790, test: 1020, support: 1250, client: 1480 };
    const B = {}; KEYS.forEach((k) => { B[k] = ctx.held("bub_" + k); });

    const tInside = ctx.cue("Inside each head");
    const tOpen = {
      test: ctx.cue("Testing"),
      support: ctx.cue("Support"),
      client: ctx.cue("The client"),
      date: ctx.cue("Even the fast yes"),
    };

    /* ---- nobody looks up: each person looks at the table or towards the board, never at a bubble ---- */
    P.p_date.look(0.2, 0.8, ctx.start);
    P.p_test.look(-0.3, 0.85, ctx.start);
    P.p_support.look(-1, -0.25, ctx.start);
    P.p_client.look(-0.4, 0.8, ctx.start);
    // the fast yes stops smiling as his own doubt opens (the only face that changes)
    P.p_date.emotion("neutral", tOpen.date + 0.3);

    // the outlines boil through the whole hold
    KEYS.forEach((k) => Loom.stepped.boil(B[k], ctx.start, ctx.end, { hz: 8, amp: 1.1 }));

    /* ---- "Inside each head, a doubt": the four folded bubbles swell together, two drawings ---- */
    KEYS.forEach((k) => {
      const bb = B[k].__bub, sh = bb.shapes, ox = OWNER_X[k] - 95, oy = 205;   // element origin (b01's BX, BY)
      const cx = OWNER_X[k] + 40 - ox, cy = 330 - oy, s = 1.06;                // folded centre, element-local
      const M = { a: s, b: 0, c: 0, d: s, e: cx * (1 - s), f: cy * (1 - s) };
      Loom.morph.to(bb.body, Loom.morph.transform(sh.folded, M), tInside, { dur: 2 * STEP, ease: "linear" });
      Loom.morph.to(bb.seam, Loom.morph.transform(sh.seamFolded, M), tInside, { dur: 2 * STEP, ease: "linear" });
      Loom.morph.to(bb.crease, Loom.morph.transform(sh.crease, M), tInside, { dur: 2 * STEP, ease: "linear" });
    });

    /* ---- the four objects, drawn as b08 draws them (design size 300, centred on 0,0), at the bubble's scale ---- */
    const DROP = 10;                        // the open bubbles sit 10 px lower than b01's shape (clear of the clock)
    const SZ = 300, K = 66 / SZ;           // about 66 px inside a 174 x 140 open bubble
    const W = 1.9;                          // thin marks are thickened so they still read at this scale
    const DRAW = {
      // @form tearoff_pad_pages: a tear-off pad whose top page carries a mark
      date(fill, line) {
        Loom.obj.shape(fill, "calendar", 0, 0, SZ, { family: "tearoff", tone: "muted", detail: 2, shadow: false, key: "obj_date" });
        const cw = SZ * 0.86, ch = SZ * 0.9, cx0 = -cw / 2, cy0 = -ch / 2 + SZ * 0.04;
        const pageTop = cy0 + ch * 0.24 + SZ * 0.06, pageH = cy0 + ch - pageTop;
        const day = { x: cx0 + cw * 0.2, y: cy0 + ch * 0.24 + SZ * 0.16, w: cw * 0.6, h: ch * 0.42 };
        kit.rect(fill, cx0, pageTop, cw, pageH, { fill: "surface", r: 6, shadow: false });
        svg("rect", { x: day.x + day.w * 0.2, y: day.y + day.h * 0.2, width: day.w * 0.6, height: day.h * 0.6, rx: 6, fill: S.c("surface2") }, fill);
        const qx = day.x + day.w / 2, qy = day.y + day.h * 0.48;
        svg("path", { d: `M${qx - 26} ${qy - 30} q0 -34 28 -34 q30 0 30 28 q0 20 -26 30 q-6 4 -6 18`, fill: "none", stroke: S.c("accent"), "stroke-width": 12 * W, "stroke-linecap": "round", "stroke-linejoin": "round" }, fill);
        svg("circle", { cx: qx, cy: qy + 46, r: 8 * W, fill: S.c("accent") }, fill);
        line(`M${f1(cx0 + 18)} ${f1(cy0)} H${f1(cx0 + cw - 18)} Q${f1(cx0 + cw)} ${f1(cy0)} ${f1(cx0 + cw)} ${f1(cy0 + 18)} V${f1(cy0 + ch - 18)} Q${f1(cx0 + cw)} ${f1(cy0 + ch)} ${f1(cx0 + cw - 18)} ${f1(cy0 + ch)} H${f1(cx0 + 18)} Q${f1(cx0)} ${f1(cy0 + ch)} ${f1(cx0)} ${f1(cy0 + ch - 18)} V${f1(cy0 + 18)} Q${f1(cx0)} ${f1(cy0)} ${f1(cx0 + 18)} ${f1(cy0)} Z`);
      },
      // @form checklist_rows: a clipboard of tick rows where the empty rows are the open risk
      test(fill, line) {
        Loom.obj.shape(fill, "document", 0, 0, SZ, { family: "clipboard", tone: "field2", detail: 1, shadow: false, key: "obj_test" });
        const rows = [-80, -14, 52, 118], bx = -80, bs = 40;
        rows.forEach((ry, i) => {
          const done = i < 2;
          svg("rect", { x: bx, y: ry - bs / 2, width: bs, height: bs, rx: 6, fill: S.c("surface"), stroke: S.c(done ? "ink" : "accent"), "stroke-width": (done ? 4 : 5) * W }, fill);
          svg("path", { d: `M${bx + bs + 22} ${ry} H${bx + bs + 22 + (i % 2 ? 92 : 118)}`, fill: "none", stroke: S.c("muted"), "stroke-width": 7 * W, "stroke-linecap": "round" }, fill);
          if (done) svg("path", { d: `M${bx + 8} ${ry + 1} l10 11 l18 -22`, fill: "none", stroke: S.c("ink"), "stroke-width": 6 * W, "stroke-linecap": "round", "stroke-linejoin": "round" }, fill);
        });
        line(`M-108 -147 H108 Q126 -147 126 -129 V129 Q126 147 108 147 H-108 Q-126 147 -126 129 V-129 Q-126 -147 -108 -147 Z`);
      },
      // @form headset_prop: a headset drawn as an object (band arc, two cups, a boom mic)
      support(fill, line) {
        const HX = 0, HY = -20;
        svg("path", { d: `M${HX - 112} ${HY + 10} A112 112 0 0 1 ${HX + 112} ${HY + 10}`, fill: "none", stroke: S.c("field2"), "stroke-width": 26, "stroke-linecap": "round" }, fill);
        svg("path", { d: `M${HX - 112} ${HY + 10} A112 112 0 0 1 ${HX + 112} ${HY + 10}`, fill: "none", stroke: S.c("surface2"), "stroke-width": 10, "stroke-linecap": "round" }, fill);
        [-1, 1].forEach((sd) => {
          const ex = HX + sd * 118;
          kit.rect(fill, ex - 34, HY - 10, 68, 112, { fill: "surface2", r: 26, shadow: false });
          kit.rect(fill, ex - 22 + sd * -4, HY + 4, 44, 84, { fill: "field2", r: 18, shadow: false, flat: true });
        });
        svg("path", { d: `M${HX - 112} ${HY + 92} q8 58 92 64`, fill: "none", stroke: S.c("surface2"), "stroke-width": 11 * W, "stroke-linecap": "round" }, fill);
        svg("circle", { cx: HX - 14, cy: HY + 156, r: 15 * W, fill: S.c("accent") }, fill);
        line(`M${HX - 125} ${HY + 10} A125 125 0 0 1 ${HX + 125} ${HY + 10}`);
        [-1, 1].forEach((sd) => { const ex = HX + sd * 118; line(`M${ex - 8} ${HY - 10} H${ex + 8} Q${ex + 34} ${HY - 10} ${ex + 34} ${HY + 16} V${HY + 76} Q${ex + 34} ${HY + 102} ${ex + 8} ${HY + 102} H${ex - 8} Q${ex - 34} ${HY + 102} ${ex - 34} ${HY + 76} V${HY + 16} Q${ex - 34} ${HY - 10} ${ex - 8} ${HY - 10} Z`); });
      },
      // @form sealed_envelope: a closed envelope with a red wax seal on its flap
      client(fill, line) {
        Loom.obj.shape(fill, "envelope", 0, 0, SZ, { family: "flap", tone: "surface2", detail: 2, shadow: false, key: "obj_client" });
        const sealY = (-SZ * 0.32 + SZ * 0.06) + SZ * 0.64 * 0.56;
        svg("circle", { cx: 0, cy: sealY, r: 24 * 1.4, fill: S.c("accent") }, fill);
        svg("circle", { cx: 0, cy: sealY, r: 14 * 1.4, fill: "none", stroke: S.darken(S.c("accent"), 0.3), "stroke-width": 3 * W }, fill);
        const x = -150, y = -SZ * 0.32 + SZ * 0.06, w = 300, ht = SZ * 0.64;
        line(`M${x + 14} ${f1(y)} H${x + w - 14} Q${x + w} ${f1(y)} ${x + w} ${f1(y + 14)} V${f1(y + ht - 14)} Q${x + w} ${f1(y + ht)} ${x + w - 14} ${f1(y + ht)} H${x + 14} Q${x} ${f1(y + ht)} ${x} ${f1(y + ht - 14)} V${f1(y + 14)} Q${x} ${f1(y)} ${x + 14} ${f1(y)} Z`);
        line(`M${x + 8} ${f1(y + 8)} L0 ${f1(y + ht * 0.56)} L${x + w - 8} ${f1(y + 8)}`);
      },
    };
    const WORD = { date: "the date", test: "testing", support: "support", client: "client" };

    KEYS.forEach((k) => {
      const E = B[k], bb = E.__bub, sh = bb.shapes, t = tOpen[k];
      const ox = OWNER_X[k] - 95, oy = 205;              // element origin in station coords (b01: BX = -95, BY = 205)
      const ocx = OWNER_X[k] + 30 - ox;                    // open bubble centre x, element-local
      const objCy = 288 + DROP - 28 - oy;                  // the object sits in the upper part of the open bubble

      /* the bubble opens: one outline morphing from folded to open (stepped drawings), the crease lets go.
       * b01's open shape sits 3 px under the wall clock (a tangency over the testing bubble, seen at 37.0 s), so every
       * open shape is drawn DROP px lower; its first tail dot then just meets its edge, as a thought chain does. */
      const Md = { a: 1, b: 0, c: 0, d: 1, e: 0, f: DROP };
      bb.openD = Loom.morph.transform(sh.open, Md);
      bb.seamOpenD = Loom.morph.transform(sh.seamOpen, Md);
      Loom.morph.to(bb.body, bb.openD, t, { dur: 0.75, hz: 8 });
      Loom.morph.to(bb.seam, bb.seamOpenD, t, { dur: 0.75, hz: 8 });
      Loom.tween(bb.crease, { opacity: 1 }, { opacity: 0, duration: 2 * STEP, ease: "none" }, t, { kind: "state", beat: ctx.beat.id, name: E.name + ".crease" });
      Loom.sfx("pop", t + 0.05);

      /* the object draws in: ink outline first, its colours after (it lives inside the bubble: it boils with it) */
      const O = ctx.el("obj_" + k, { x: ocx - 45, y: objCy - 45, w: 90, h: 90, kind: "icon", exit: "recede", parent: E.inner });
      const g = svg("g", { transform: `translate(45 45) scale(${K})` }, O.inner);
      const fill = svg("g", {}, g), outline = svg("g", {}, g);
      const line = (d) => svg("path", { d, fill: "none", stroke: S.c("ink"), "stroke-width": 3.4 / K, "stroke-linecap": "round", "stroke-linejoin": "round" }, outline);
      DRAW[k](fill, line);
      O.__draw = { fill, outline, scale: K };
      m.draw(outline, t + 0.45, { dur: 0.4 });
      Loom.tween(fill, { opacity: 0 }, { opacity: 1, duration: 2 * STEP, ease: "none" }, t + 0.8, { kind: "reveal", beat: ctx.beat.id, name: O.name, content: true });

      /* its one-word tag is lettered under it (words: a separate element, never stepped or boiled) */
      // @form lettered_word_tag: one hand-lettered word written on under a drawn object
      const word = WORD[k];
      const Ft = kit.fit(word, { role: "label", w: 140, h: 40, maxLines: 1 });
      const tw = Math.ceil(Ft.width) + 8, th = Math.ceil(Ft.height) + 4;
      const TE = ctx.el("tag_" + k, { x: OWNER_X[k] + 30 - tw / 2, y: 288 + DROP + 32 - th / 2, w: tw, h: th, kind: "label", exit: "recede" });
      const txt = svg("g", {}, TE.inner);
      kit.text(txt, word, { role: "label", x: 0, y: 0, w: tw, h: th, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      const id = Loom.uid("gtword"), cp = svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, TE.inner));
      const r = svg("rect", { x: -4, y: -6, width: 0, height: th + 12 }, cp);
      txt.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: tw + 8 }, duration: Math.max(0.35, word.length * 0.05), ease: Loom.ease.move }, t + 0.95, { kind: "reveal", beat: ctx.beat.id, name: TE.name, content: true, nostep: true });
      TE.revealT = t + 0.95;
    });
  },
});
