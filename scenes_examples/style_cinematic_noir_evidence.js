// @design message_under_the_lamp: a real message pane lit like a document under a desk lamp on a dark stage; the danger signs are marked in the danger colour with tags on the words, and the one accent is kept for the move (Report), singled out by a spotlight at the end
// @lab {"title": "cinematic-noir example: the evidence on the message (UI artefact lit in a dark world, danger in neg, the accent kept for the move)", "styles": ["cinematic-noir"], "dur": 11.0, "times": [0.5, 2.0, 3.9, 6.2, 8.9, 10.6], "fx": {}, "cues": {"Look at the sender": 2.6, "within 2 hours": 5.0, "report it": 8.2}}
/* An example of the cinematic-noir style done right (docs/styles/guides/cinematic-noir.md, recipes R4 to R6).
 * Workplace topic: reading a suspicious message for its signs, then reporting it. Every word on screen is the
 * caller's (Loom.ui draws no sample text); the sender is fictional and on a reserved .example domain.
 * The rules it shows:
 *   - a UI artefact in noir is a LIT object, not a slide on a void: a hard-edged lit plane behind the pane (on the
 *     stage, z 0.2), cool light from the window side as a few slanted bars on the right (z 0.15), the rest unlit;
 *   - the pane is big enough to read at 1080p (w 1180 at display 0.85: subject 44 px, body 36 px, meta 30 px, the pack's
 *     role maxima) and fills about 60 % of the safe area;
 *   - colour carries ONE meaning each: danger signs are `neg` (marks and tags), the link is `accent3` (the blue a real
 *     mail client gives a link), and the amber `accent` is kept for the move the lesson teaches (Report), which the
 *     sender's avatar never shares (the avatar tone is a hash of the name: "Payroll Services" gives accent3);
 *   - tags sit on the dark field to the right of the pane, joined to their words by a lead, never over the pane's text;
 *   - a spotlight (ctx.fxMoment) narrows the light to the move on its cue, the Report button with its lead and tag:
 *     everything read during the moment sits inside the lit rect ("this, not that").
 */
Loom.scene("style_cinematic_noir_evidence", {
  build(ctx) {
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const c = (t) => ctx.c(t);

    // ---- the dark world the pane sits in (no text in here: titles and panes never ride the dolly)
    const st = ctx.depth("desk_light", { dolly: [ctx.start, ctx.end], push: 0.035, drift: -14, focus: 0.5, dof: 4, cx: 700, cy: 520 });
    const wall = st.layer(0.05);
    svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: c("field") }, wall);
    // the lamp's light on the desk the pane lies on: a HARD-edged lit plane (noir light is hard, and a flat fill
    // cannot band the way a wide low-opacity gradient does, guide section 5), its edge broken by the lamp's shade
    const pool = st.layer(0.2);
    svg("path", { d: "M-40 1120 L120 60 Q700 -10 1300 60 L1500 1120 Z", fill: Loom.style.mix(c("field"), c("ink"), 0.06) }, pool);
    // cool fill from the window side: slanted bars on the right third, faint
    const bars = st.layer(0.15, "screen");
    for (let i = 0; i < 5; i++) {
      const x0 = 1420 + i * 70;
      svg("polygon", { points: `${x0},-40 ${x0 + 34},-40 ${x0 - 160},1120 ${x0 - 194},1120`, fill: c("accent3"), opacity: 0.05 }, bars);
    }

    // ---- the message: real words, sized for 1080p
    const A = Loom.ui.mail(ctx, "message", {
      x: 120, y: 150, w: 1180, display: 0.85,
      subject: "Action needed: confirm your details",
      from: { name: "Payroll Services", address: "payroll@pay-roll-update.example" },
      to: "you", time: "23:47",
      paragraphs: ["Your payment is on hold until you confirm your bank details.", "Please confirm within 2 hours to avoid a delay."],
      link: { text: "Confirm my details", tone: "accent3" },
      attachment: { name: "Payment_form.html", size: "14 KB" },
      report: true,
    });
    const paneRight = A.E.x + A.E.w;   // leads start at the pane's edge, level with their words, never across the words after them
    Loom.ui.build(ctx, A, ctx.start + 0.3);

    // ---- sign 1: the sender's address (danger in neg: a mark on the words, a tag on the field, a lead between)
    const tSender = ctx.cue("Look at the sender");
    const r1 = Loom.ui.mark(ctx, A, "address", "pay-roll-update.example", tSender, { tone: "neg", opacity: 0.22 });   // 0.22 behind muted text keeps 4.7:1; 0.34 only behind ink
    const tag1 = Loom.data.tag(ctx, "sign_domain", { x: 1370, y: r1.y - 8, text: "Not our domain", color: "neg", t: tSender + 0.5 });
    Loom.ui.wire(ctx, "lead_domain", { x: paneRight, y: r1.cy }, { x: 1366, y: r1.y - 8 + tag1.h / 2 }, tSender + 0.25, { tone: "neg" });

    // ---- sign 2: the pressure
    const tPress = ctx.cue("within 2 hours");
    const r2 = Loom.ui.mark(ctx, A, "body_1", "within 2 hours", tPress, { tone: "neg", opacity: 0.34 });
    const tag2 = Loom.data.tag(ctx, "sign_pressure", { x: 1370, y: r2.y - 8, text: "Pressure", color: "neg", t: tPress + 0.5 });
    Loom.ui.wire(ctx, "lead_pressure", { x: paneRight, y: r2.cy }, { x: 1366, y: r2.y - 8 + tag2.h / 2 }, tPress + 0.25, { tone: "neg" });

    // ---- the move: the accent's only appearance in the scene, singled out by the light
    const tMove = ctx.cue("report it");
    const rp = Loom.ui.at(A, "report");
    const tag3 = Loom.data.tag(ctx, "the_move", { x: 1370, y: rp.cy - 26, text: "Your move: report it", color: "accent", t: tMove + 0.55 });
    Loom.ui.wire(ctx, "lead_move", { x: paneRight, y: rp.cy }, { x: 1366, y: rp.cy - 26 + tag3.h / 2 }, tMove + 0.3, { tone: "accent" });
    // the light holds the pill, the lead AND the tag: round 1 lit the pill only, and the move's own tag wiped in under
    // the 0.55 dim (guide R6, section 12)
    const sx0 = rp.x - 40, sx1 = 1370 + tag3.w + 30;
    ctx.fxMoment("spotlight", tMove, Math.min(ctx.end, tMove + 2.6), [sx0, rp.y - 30, sx1 - sx0, rp.h + 60]);
  },
});
