// @design request_and_check_back: two clauses each land beside a calendar marker so the ask and its follow-up read as two objects
/* Treatments: (A) static bubble with text and two icons (rejected: no motion argument); (B) text only prints (rejected: markers are the device); (C) CHOSEN: marker drops, request prints, second marker drops, check-back prints. */
Loom.scene("b49", {
  build(ctx) {
    const { kit, m } = ctx;
    let bub = null;
    try { bub = ctx.held("speech_bubble"); } catch (e) { bub = null; }
    const BX = 360, BY = 250, BW = 1200, BH = 470;
    if (!bub) {
      const B = ctx.el("speech_bubble", { x: BX, y: BY, w: BW, h: BH, kind: "bubble", exit: "recede" });
      kit.rect(B.inner, 0, 0, BW, BH, { fill: "surface", r: 40 });
    }

    // marker 1: next meeting
    const MW = 250, MH = 110;
    const m1 = ctx.el("next_meeting_marker", { x: BX + 40, y: BY + 70, w: MW, h: MH, kind: "icon", exit: "recede" });
    // @form calendar_marker: a dated tag on the wall calendar
    kit.rect(m1.inner, 0, 0, MW, MH, { fill: "accent4", r: 16 });
    kit.text(m1.inner, "Next meeting", { role: "label", x: 10, y: 6, w: MW - 20, h: MH - 12, maxLines: 2, align: "center", valign: "middle", color: Loom.style.pickTokenOn("accent4") });
    m.drop(m1, ctx.cue("Next meeting"));

    // request clause
    const RW = 800, RH = 130;
    const rq = ctx.el("request_clause", { x: BX + 330, y: BY + 60, w: RW, h: RH, kind: "text", exit: "wipe" });
    kit.text(rq.inner, "please let her finish before you respond", { role: "lead", x: 0, y: 0, w: RW, h: RH, maxLines: 2, valign: "middle" });
    m.unmask(rq, ctx.cue("please let her finish before you respond"), { dir: "ltr" });

    // connector line between markers (draws into the second)
    const lx = BX + 40 + MW / 2;
    const ln = ctx.el("marker_link", { x: lx - 3, y: BY + 70 + MH, w: 6, h: 130, kind: "connector", exit: "recede" });
    kit.line(ln.inner, 3, 0, 3, 130, { stroke: "muted", sw: 4 });
    m.draw(ln, ctx.cue("and let's talk after it") - 0.1);

    // marker 2: talk after it (the accent)
    const m2 = ctx.el("talk_after_marker", { x: BX + 40, y: BY + 70 + MH + 130, w: MW, h: MH, kind: "icon", exit: "recede" });
    // @form calendar_marker: second dated tag, the check-back
    kit.rect(m2.inner, 0, 0, MW, MH, { fill: "accent", r: 16 });
    kit.text(m2.inner, "Talk after it", { role: "label", x: 10, y: 6, w: MW - 20, h: MH - 12, maxLines: 2, align: "center", valign: "middle", color: Loom.style.pickTokenOn("accent") });
    m.drop(m2, ctx.cue("and let's talk after it"));

    const CW = 800, CH = 130;
    const cb = ctx.el("check_back_clause", { x: BX + 330, y: BY + 70 + MH + 130, w: CW, h: CH, kind: "text", exit: "wipe" });
    kit.text(cb.inner, "and let's talk after it", { role: "lead", x: 0, y: 0, w: CW, h: CH, maxLines: 2, valign: "middle" });
    m.unmask(cb, ctx.cue("and let's talk after it") + 0.35, { dir: "ltr" });
  },
});
