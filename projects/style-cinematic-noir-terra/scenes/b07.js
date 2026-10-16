// @design ordinary_signin_log: a dark security desk frames a lit sign-in record whose identical successful rows make the late entry visually ordinary
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (token) => ctx.c(token);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    // Treatment A: a slide-like table, rejected because the log must live in a room.
    // Treatment B: a monitor close-up, rejected because it loses the security desk's scale.
    // Treatment C: chosen, a lit evidence pane on a desk in a dark interior, with one slow push.
    const st = ctx.depth("inside_log", { dolly: [ctx.start, ctx.end], push: 0.045, drift: -20, focus: 0.55, dof: 5, atmosphere: 0.4, cx: 1040, cy: 585 });

    // @form back_wall: the unlit interior makes the pane a physical source of evidence
    const far = st.layer(0.1);
    svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: st.tone("surface2", 0.1) }, far);
    svg("rect", { x: -200, y: 760, width: 2320, height: 520, fill: st.tone("field2", 0.1) }, far);
    svg("rect", { x: 1420, y: 120, width: 340, height: 430, fill: st.tone("accent3", 0.1), opacity: 0.18 }, far);
    for (let y = 140; y < 540; y += 30) svg("rect", { x: 1420, y, width: 340, height: 17, fill: c("shadow"), opacity: 0.8 }, far);
    st.haze(0.38, 670, "accent3");

    // @form security_desk: a hard-lit physical desk grounds the digital log in the room
    const mid = st.layer(0.55);
    svg("ellipse", { cx: 960, cy: 824, rx: 650, ry: 42, fill: c("shadow"), opacity: 0.52 }, mid);
    svg("polygon", { points: "260,690 1610,690 1710,814 180,814", fill: c("surface") }, mid);
    svg("rect", { x: 180, y: 814, width: 1530, height: 34, fill: c("surface2") }, mid);
    svg("rect", { x: 220, y: 848, width: 60, height: 170, fill: c("surface2") }, mid);
    svg("rect", { x: 1600, y: 848, width: 60, height: 170, fill: c("surface2") }, mid);
    svg("polygon", { points: "390,700 1270,700 1340,774 330,774", fill: Loom.style.mix(c("surface"), c("ink"), 0.15) }, mid);

    // @form desk_lamp: the warm key light is visible and lands on the evidence plane
    const lamp = st.layer(0.56, "screen");
    svg("ellipse", { cx: 390, cy: 694, rx: 42, ry: 11, fill: c("shadow"), opacity: 0.6 }, lamp);
    kit.path(lamp, "M390 688 L438 548 L505 490", { stroke: "line", sw: 7 });
    svg("polygon", { points: "474,466 526,484 544,524 458,512", fill: c("surface") }, lamp);
    svg("circle", { cx: 505, cy: 510, r: 9, fill: c("ink"), opacity: 0.95 }, lamp);
    svg("polygon", { points: "490,520 520,520 790,694 276,694", fill: c("ink"), opacity: 0.11 }, lamp);

    // @form log_plane: the hard pool behind the pane keeps the evidence from floating in the void
    const plane = st.layer(0.54);
    svg("polygon", { points: "470,380 1430,380 1510,750 390,750", fill: Loom.style.mix(c("field"), c("ink"), 0.07) }, plane);

    // @form log_pane: a wide sign-in log, sharp and outside the depth stage for readable evidence
    const P = ctx.el("log_pane", { x: 390, y: 274, w: 1140, h: 438, kind: "card", exit: "displace" });
    svg("rect", { x: 0, y: 0, width: 1140, height: 438, rx: 12, fill: c("surface") }, P.inner);
    svg("rect", { x: 2, y: 2, width: 1136, height: 434, rx: 10, fill: c("surface2") }, P.inner);
    svg("rect", { x: 2, y: 2, width: 1136, height: 74, rx: 10, fill: c("surface") }, P.inner);
    kit.text(P.inner, "Sign-in log", { role: "lead", x: 48, y: 18, w: 400, h: 48, maxLines: 1, weight: 700, color: "ink" });
    kit.text(P.inner, "Time", { role: "label", x: 72, y: 100, w: 160, h: 42, maxLines: 1, weight: 700, color: "muted" });
    kit.text(P.inner, "User", { role: "label", x: 370, y: 100, w: 160, h: 42, maxLines: 1, weight: 700, color: "muted" });
    kit.text(P.inner, "Login", { role: "label", x: 762, y: 100, w: 190, h: 42, maxLines: 1, weight: 700, color: "muted" });
    const rows = [["08:57", "dana", "success"], ["12:14", "dana", "success"], ["17:40", "dana", "success"], ["02:00", "dana", "success"]];
    const rowEls = [];
    rows.forEach((row, i) => {
      // @form signin_row: each record is deliberately identical in treatment and result
      const R = ctx.el(`signin_row_${i + 1}`, { x: 40, y: 142 + i * 70, w: 1060, h: 58, kind: "text", exit: "displace", parent: P });
      svg("rect", { x: 0, y: 0, width: 1060, height: 58, rx: 4, fill: c("surface"), opacity: 0.64 }, R.inner);
      svg("rect", { x: 0, y: 57, width: 1060, height: 1, fill: c("line"), opacity: 0.35 }, R.inner);
      kit.text(R.inner, row[0], { role: "body", x: 22, y: 8, w: 200, h: 44, maxLines: 1, weight: 700, color: "ink" });
      kit.text(R.inner, row[1], { role: "body", x: 320, y: 8, w: 200, h: 44, maxLines: 1, weight: 700, color: "ink" });
      kit.text(R.inner, row[2], { role: "body", x: 712, y: 8, w: 270, h: 44, maxLines: 1, weight: 700, color: "ink" });
      rowEls.push(R);
    });
    m.reveal(P, ctx.cue("Inside, the attacker looks like Dana."));
    rowEls.forEach((R, i) => m.settle(R, ctx.cue("Inside, the attacker looks like Dana.") + 0.24 + i * 0.3));

    // @form row_0200: an amber attention mark appears only when the late row is named, then leaves no warning behind
    const M = ctx.el("row_0200", { x: 14, y: 352, w: 18, h: 58, kind: "mark", exit: "wipe", parent: P });
    svg("rect", { x: 0, y: 0, width: 7, height: 58, rx: 3, fill: c("accent"), opacity: 0 }, M.inner);
    const mark = M.inner.children[0];
    const tMark = ctx.cue("harder to notice");
    Loom.tween(mark, { opacity: 0 }, { opacity: 0.92, duration: ctx.style.dur("enter") }, tMark, { kind: "reveal", beat: ctx.beat.id, name: "row_0200_mark", content: true });
    Loom.tween(mark, { opacity: 0.92 }, { opacity: 0, duration: ctx.style.dur("exit") }, tMark + 0.65, { kind: "exit", beat: ctx.beat.id, name: "row_0200_mark_fade", content: true });
  },
});
