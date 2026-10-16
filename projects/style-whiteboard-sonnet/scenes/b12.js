// @design written_summary_unifies: one written line is sealed, sent to each seat, and four different bubbles become one
/* Treatments: (A) static envelope + four identical bubbles (rejected: no sending); (B) the envelope flies to each seat
 * (rejected: the arrows read the same and keep the table clear); (C) CHOSEN: the line is written, folded into an envelope,
 * four hand arrows fan out to the seats, then the same line appears in all four bubbles; one accent: Sent today. */
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (s) => DRAW * clamp(String(s).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // ---- cues
    const tThen = ctx.cue("Then send it");
    const tWriting = ctx.cue("in writing");
    const tDay = ctx.cue("the same day");
    const tEvery = ctx.cue("everyone there");
    const tOne = ctx.cue("One version of the meeting");

    // ---- the checklist (top right): Before and During ticked, Close in ink
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    Loom.lesson.step_list(ctx, steps.inner, { name: "steps", current: 2, ticked: [true, true, false] }).appear();

    // ---- the table, drawn, then the team seated
    const table = ctx.el("table", { x: 90, y: 240, w: 1400, h: 690, kind: "scenery", exit: "recede" });
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team" });   // @form team_at_table: the same table as the hook
    team.draw(Math.max(ctx.start + 0.3, tThen - 0.1));
    team.arrive(tThen + 1.2);

    // ---- the email: wrapper in station coords x 90..1420, y 30..290 (local = station - (90, 30))
    const email = ctx.el("email", { x: 90, y: 30, w: 1330, h: 260, kind: "scenery", exit: "recede" });
    const note = ctx.el("email_note", { x: 500, y: 40, w: 700, h: 150, kind: "text", exit: "recede", parent: email.inner });
    const dec = Loom.lesson.decision_line(ctx, note.inner, { w: 700, name: "decision" });   // @form decision_line: the written decision
    dec.write(tWriting - 0.3);

    // envelope body then flap (a hand envelope, 260 x 150, centre station x 760)
    const env = ctx.el("email_envelope", { x: 720, y: 15, w: 260, h: 150, kind: "icon", exit: "recede", parent: email.inner });   // @form hand_envelope: the written summary, sent
    kit.sketch(env.inner, "rectangle", [4, 4, 252, 142], { fill: "none" });
    const flap = ctx.el("email_flap", { x: 720, y: 15, w: 260, h: 150, kind: "icon", exit: "recede", parent: email.inner });
    hand(flap.inner, "M4 4 L130 84 L256 4");
    const tFold = tDay + 0.45;
    m.draw(env, tFold + 0.1, { dur: 0.5 });
    // the line shrinks into the envelope (note-local origin), then the flap closes over it and it fades
    dec.fold(tFold, { x: 193, y: 33, scale: 0.45 });
    m.draw(flap, tFold + 0.75, { dur: 0.35 });
    Loom.tween(dec.el.line.life, { opacity: 1 }, { opacity: 0 }, tFold + 0.85, { dur: 0.3 });

    // four hand arrows from the envelope to each seat (fan, the outer ones highest)
    const SX = [850, 910, 970, 1030], EX = [250, 590, 930, 1270], SY = 198, EY = 284;
    EX.forEach((ex, i) => {
      const sx = SX[i];
      const xs = [sx, ex, ex - 11, ex + 11], ys = [SY, EY, EY - 20, EY - 20];
      const bx = Math.floor(Math.min.apply(null, xs) - 12), by = SY - 12;
      const w = Math.ceil(Math.max.apply(null, xs) + 12) - bx, h = EY + 12 - by;
      const A = ctx.el("email_arrow_" + i, { x: bx - 90, y: by - 30, w: w, h: h, kind: "connector", exit: "recede", parent: email.inner });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(A.inner, "M" + X(sx) + " " + Y(SY) + " Q" + X(ex) + " " + Y(SY) + " " + X(ex) + " " + Y(EY));
      hand(A.inner, "M" + X(ex - 11) + " " + Y(EY - 20) + " L" + X(ex) + " " + Y(EY) + " L" + X(ex + 11) + " " + Y(EY - 20));
      m.draw(A, tEvery + 0.25 + i * 0.3, { dur: 0.55 });
    });

    // ---- "Sent today" beside the envelope, one accent underline
    const sf = kit.fit("Sent today", { role: "lead", w: 320, h: 70, maxLines: 1 });
    const sw = Math.ceil(sf.width) + 16;
    const sent = ctx.el("sent_today", { x: 1105, y: 70, w: sw + 20, h: 110, kind: "text", exit: "wipe" });
    kit.text(sent.inner, "Sent today", { role: "lead", x: 0, y: 0, w: sw, h: 70, maxLines: 1, valign: "middle" });
    const tSent = tFold + 1.1;
    m.unmask(sent, tSent, { dur: writeDur("Sent today") });
    const ulW = Math.ceil(sf.width) + 12;
    const ul = ctx.el("sent_today_underline", { x: 0, y: 74, w: ulW, h: 26, kind: "mark", exit: "recede", parent: sent.inner });   // @form accent_underline: the one marker colour
    hand(ul.inner, "M2 12 C " + (ulW * 0.3).toFixed(0) + " 6, " + (ulW * 0.65).toFixed(0) + " 17, " + (ulW - 2) + " 9", { stroke: "accent", sw: 5 });
    m.draw(ul, tSent + 0.5, { dur: drawDur(ulW * 1.05) });

    // ---- four bubbles, one line each, collected in "bubbles"
    const bubbles = ctx.el("bubbles", { x: 90, y: 240, w: 1400, h: 690, kind: "bubble", exit: "recede" });
    [0, 1, 2, 3].forEach((i) => {
      const b = team.bubble(i, "June. Priya. Friday.", tOne + i * 0.3);
      [b.E, b.words].forEach((E) => { if (E) bubbles.inner.appendChild(E.outer); });
    });
  },
});
