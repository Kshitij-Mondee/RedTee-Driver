// @design over_shoulder_question: one person asks an open question across a table while the other is seen only from behind, then a held silence
// st_room_c: the quiet meeting room again (the same Loom.place.meeting "room" and the same Maya, report, update and card as
// st_room_b), drawn present at once. This beat builds EVERYTHING b33 to b36 reuse and stashes the handles on the elements:
//   room.__R (the place and its camera), maya.__api (the character), report.__post(u) (the posture 0..1).
// A fourth layer "hi" (same depth as the table) sits above the near layer: speech and the dim of b36 live there, so the whole
// room can be dimmed underneath the one bubble that must stay at full strength. The place, Maya and the camera span b32 to b36.
Loom.scene("b32", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat, O = Loom.obj, S = ctx.style, svg = Loom.svg, f = (v) => Math.round(v * 10) / 10;
    const b36 = ((Loom.manifest && Loom.manifest.beats) || []).find((b) => b.id === "b36");
    const spanEnd = b36 ? b36.end : ctx.end + 44;
    const span = Object.assign({}, ctx, { end: spanEnd });
    const SPAN = spanEnd - ctx.start;

    // ---- the room: same call and options as every meeting beat ----
    const R = Loom.place.meeting(span, "room", {});
    const mid = R.layers.mid.g, near = R.layers.near.g, far = R.layers.far.g;
    R.E.__R = R;
    // a quiet table: the default laptop and two sheets would clash with the one update that matters
    Array.from(mid.children).forEach((n) => {
      const k = n.getAttribute && n.getAttribute("data-object");
      if (k === "laptop" || k === "document") mid.removeChild(n);
    });
    // the hi layer: above the near layer, moving with the table's depth
    const hiCam = svg("g", { class: "lm-cam", "data-layer": "hi" }, R.E.inner);
    R.layers.hi = { cam: hiCam, g: svg("g", {}, hiCam), depth: 0.7 };
    const hi = R.layers.hi.g;

    // window light: one pale shaft across the wall and floor, breathing very slowly (period-locked), and dust turning in it
    const shaft = svg("path", { d: "M120 120 L480 120 L1010 668 L560 668 Z", fill: S.c("surface"), opacity: 0.16 }, far);
    Loom.drive((e, raw) => { shaft.setAttribute("opacity", f(0.13 + 0.05 * Math.sin(raw * Math.PI * 2 * 3))); },
      ctx.start, SPAN, "linear", { kind: "ambient", beat: ctx.beat.id, name: "room.light" });
    const rng = Loom.rng("room-c:motes"), motes = [];
    for (let i = 0; i < 14; i++) motes.push({ c: svg("circle", { r: 1.6 + rng() * 2.2, fill: S.c("surface"), opacity: 0.7 }, far), x: 190 + rng() * 420, y: 160 + rng() * 380, ph: rng(), per: 6 + rng() * 4 });
    Loom.drive((e, raw) => { const t = raw * SPAN; motes.forEach((o) => { const a = 2 * Math.PI * (t / o.per + o.ph); o.c.setAttribute("cx", f(o.x + 16 * Math.sin(a))); o.c.setAttribute("cy", f(o.y - 10 * Math.cos(a * 0.7))); }); },
      ctx.start, SPAN, "linear", { kind: "ambient", beat: ctx.beat.id, name: "room.motes" });

    // ---- Maya, behind the table: the near face of the table, drawn again over her, hides her below the waist ----
    const maya = Loom.rig.place(span, "maya", "maya", { x: 960, y: 1140, scale: 0.45, pose: "listen", emotion: "listening", parent: mid });
    maya.E.__api = maya;
    const fy = R.floorY, tt = fy + 110, tb = fy + 300;
    // @form table_front_occluder: the near face of a table redrawn over a figure behind it so the figure reads as seated
    const occ = svg("g", { class: "lm-table-front" }, mid);
    T.body(occ, `M600 ${tt} H1320 L1560 ${tb} H360 Z`, "surface", { x: 360, y: tt, w: 1200, h: tb - tt });
    svg("rect", { x: 360, y: tb, width: 1200, height: 22, fill: S.darken(S.c("surface"), 0.25) }, occ);
    svg("rect", { x: 384, y: tb + 22, width: 1152, height: 260, fill: S.mix(S.c("surface2"), S.c("shadow"), 0.3) }, occ);

    // ---- the update, lying on the table between them ----
    O.draw(ctx, "update", "document", { x: 930, y: 848, size: 130, family: "sheet", detail: 2, parent: mid });

    // ---- the report, from behind, in the near layer (over the shoulder), cropped by the frame: muted, never the lead ----
    const CXr = 1640, YS = 892, YH = 770;
    const rep = ctx.el("report", { x: 0, y: 0, w: 1920, h: 1080, kind: "character", parent: near });
    const skin = S.darken(S.pack.characters.skin[1], 0.1), hair = S.darken(S.c("muted"), 0.28), jacket = S.darken(S.c("line"), 0.04), shirt = S.c("surface2");
    const breath = svg("g", {}, rep.inner), lean = svg("g", {}, breath);
    const torso = svg("g", {}, lean), head = svg("g", {}, lean);
    // @form seated_back_figure: a seated person seen from behind as a head, neck and jacket in muted tokens, no face
    svg("path", { d: `M${CXr - 310} 1110 C${CXr - 312} 980 ${CXr - 280} ${YS + 36} ${CXr - 175} ${YS + 10} Q${CXr - 95} ${YS - 8} ${CXr - 56} ${YS - 24} L${CXr + 56} ${YS - 24} Q${CXr + 95} ${YS - 8} ${CXr + 175} ${YS + 10} C${CXr + 280} ${YS + 36} ${CXr + 312} 980 ${CXr + 310} 1110 Z`, fill: jacket }, torso);
    svg("path", { d: `M${CXr} ${YS - 8} V1110`, stroke: S.darken(jacket, 0.18), "stroke-width": 3, opacity: 0.7 }, torso);
    svg("path", { d: `M${CXr - 210} ${YS + 40} Q${CXr - 150} ${YS + 90} ${CXr - 130} 1080 M${CXr + 210} ${YS + 40} Q${CXr + 150} ${YS + 90} ${CXr + 130} 1080`, fill: "none", stroke: S.darken(jacket, 0.14), "stroke-width": 3, opacity: 0.55 }, torso);
    svg("path", { d: `M${CXr - 66} ${YS - 30} Q${CXr} ${YS + 26} ${CXr + 66} ${YS - 30} L${CXr + 54} ${YS - 36} Q${CXr} ${YS + 4} ${CXr - 54} ${YS - 36} Z`, fill: shirt }, torso);
    svg("rect", { x: CXr - 38, y: YH + 60, width: 76, height: 78, rx: 20, fill: skin }, head);
    svg("ellipse", { cx: CXr - 80, cy: YH + 6, rx: 13, ry: 24, fill: skin }, head);
    svg("ellipse", { cx: CXr + 80, cy: YH + 6, rx: 13, ry: 24, fill: skin }, head);
    svg("path", { d: `M${CXr - 80} ${YH - 8} C${CXr - 84} ${YH - 108} ${CXr + 84} ${YH - 108} ${CXr + 80} ${YH - 8} C${CXr + 80} ${YH + 40} ${CXr + 54} ${YH + 76} ${CXr} ${YH + 70} C${CXr - 54} ${YH + 76} ${CXr - 80} ${YH + 40} ${CXr - 80} ${YH - 8} Z`, fill: hair }, head);
    svg("path", { d: `M${CXr - 50} ${YH - 70} Q${CXr} ${YH - 96} ${CXr + 50} ${YH - 70}`, fill: "none", stroke: S.lighten(hair, 0.22), "stroke-width": 5, "stroke-linecap": "round", opacity: 0.6 }, head);
    svg("path", { d: `M${CXr - 44} ${YH + 52} Q${CXr} ${YH + 84} ${CXr + 44} ${YH + 52}`, fill: "none", stroke: S.darken(hair, 0.2), "stroke-width": 3, opacity: 0.7 }, head);
    // posture: u = 0 braced (shoulders up, head sunk), 1 leaning in (shoulders down, head up, torso tipped toward the table)
    const post = (u) => {
      lean.setAttribute("transform", `translate(0 ${f(-10 * u)}) rotate(${f(-3.5 * u)} ${CXr} 1100) translate(${CXr} 1100) scale(${f(1 - 0.03 * u)}) translate(${-CXr} -1100)`);
      torso.setAttribute("transform", `translate(${CXr} ${YS}) scale(${f(0.95 + 0.05 * u)} 1) translate(${-CXr} ${-YS}) translate(0 ${f(-22 * (1 - u))})`);
      head.setAttribute("transform", `translate(0 ${f(16 * (1 - u) - 8 * u)}) rotate(${f(-2 * u)} ${CXr} ${YH + 70})`);
    };
    post(0.3);
    rep.__post = post;
    Loom.drive((e, raw) => { const s = 1 + 0.004 * Math.sin(raw * Math.PI * 2 * 5); breath.setAttribute("transform", `translate(${CXr} 1100) scale(1 ${f(s * 1000) / 1000}) translate(${-CXr} -1100)`); },
      ctx.start, SPAN, "linear", { kind: "ambient", beat: ctx.beat.id, name: "report.breath" });

    // ---- the four-move card, top right: three moves ticked, the fourth waits ----
    const CX = 1464, CY = 96, CW = 360, CHt = 312, fold = 44;
    const card = ctx.el("card", { x: CX, y: CY, w: CW, h: CHt, kind: "card", parent: far });
    const LD = T.lightDark();
    const sheetD = `M0 0 H${CW - fold} L${CW} ${fold} V${CHt} H0 Z`;
    svg("path", { d: sheetD, fill: S.c("shadow"), opacity: 0.14, transform: "translate(5 8)" }, card.inner);
    svg("path", { d: sheetD, fill: S.mix(LD.light, LD.dark, 0.04) }, card.inner);
    svg("path", { d: `M${CW - fold} 0 V${fold} H${CW} Z`, fill: S.mix(LD.light, LD.dark, 0.2) }, card.inner);
    // @form checklist_card: a paper card of ruled lines, each with a checkbox at its left that a tick lands in
    const rows = [];
    ["Situation", "Behaviour", "Impact", "Ask, then agree"].forEach((label, i) => {
      const y0 = 30 + i * 64, cy = y0 + 24;
      svg("line", { x1: 28, y1: y0 + 54, x2: CW - 28, y2: y0 + 54, stroke: S.c("line"), "stroke-width": 1.5, opacity: 0.3 }, card.inner);
      if (i < 3) T.markShape(card.inner, true, 44, cy, 44, "pos", { as: "box" });
      else svg("rect", { x: 44 - 15.84, y: cy - 15.84, width: 31.68, height: 31.68, rx: 4, fill: "none", stroke: S.c("ink"), "stroke-width": 3.5 }, card.inner);
      kit.text(card.inner, label, { role: "label", x: 84, y: y0, w: CW - 84 - 26, h: 48, valign: "middle", maxLines: 1, color: "ink", weight: 700 });
      rows.push(cy);
    });

    // ---- the beats ----
    const tAsk = ctx.cue("asks a real question");
    const tQ = ctx.cue("What happened with the date");
    const tWait = ctx.cue("then she waits");

    // the fourth move gets its tick as she asks
    // @form outcome_tick: a box mark ticked on its line the moment the move is named
    T.mark(ctx, "tick_ask", { x: CX + 44, y: CY + rows[3], size: 44, kind: "yes", t: tAsk, parent: far });

    // her question, in a chat bubble from the speaker's side, typed as she says it (held through b36)
    // @form speech_bubble: a chat bubble carrying one spoken line, typed in on the words
    const question = T.bubble(ctx, "question", { x: 610, y: 400, w: 560, text: "What happened with the date on this one?", tail: [915, 520], tone: "accent4", parent: hi });
    m.reveal(question, tQ, { content: true });
    m.typewriter(question.inner.querySelector("text"), tQ, { dur: 2.0 });

    // she asks with an open hand (palm up), then waits: the stillness is the move
    maya.pose("present", tQ - 0.3, { dur: 0.55 });
    maya.hold("hand_r", "palm_up_offer", tQ - 0.2, tWait + 0.15);
    maya.emotion("listening", tQ - 0.3);
    maya.talk(tQ, tWait - 0.12);
    maya.pose("listen", tWait - 0.05, { dur: 0.7 });
    maya.emotion("listening", tWait);
  },
});
