// @design checklist_lights_then_draft: a checklist lights line by line as each item is named while an open box stays empty, then a thought types the line that is about to go wrong
// b28 holds b26's room (the reply and the calendar leave; the update, report, card and Maya stay).
Loom.scene("b28", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat, C = Loom.cam, S = ctx.style;
    const f = (v) => Math.round(v * 10) / 10;
    const tSit = ctx.cue("Situation");
    const tBeh = ctx.cue("behaviour");
    const tImp = ctx.cue("impact");
    const tTicks = ctx.cue("Three ticks");
    const tDraft = ctx.cue("her draft for the close");
    const tLine = ctx.cue("So just be more careful next time");

    const room = ctx.held("room"), mayaE = ctx.held("maya"), card = ctx.held("card");
    ["update", "report", "tick_impact"].forEach((n) => ctx.held(n));
    const R = room && room.__R, maya = mayaE && mayaE.actor;
    if (!R || !maya || !card || !card.rows) return;

    // the camera eases back out of the report's shoulder so the whole room, and the thought above Maya, are in frame
    C.pull(R, { t0: ctx.start + 0.2, t1: ctx.start + 1.8 });

    // the first three lines brighten in turn on their words; the fourth box stays empty
    [tSit, tBeh, tImp].forEach((t, i) => {
      const hl = card.rows[i].hl;
      Loom.tween(hl, { opacity: 0 }, { opacity: 0.16, duration: 0.45, ease: Loom.ease.enter }, t, { kind: "highlight", beat: ctx.beat.id, name: "card.row" + i, content: true });
    });
    m.emphasis(card, tTicks, { amount: 0.04 });

    // Maya drafts her close in a thought above her head
    maya.pose("chin", tDraft, { dur: 0.6 });
    maya.emotion("thinking", tDraft);
    const line = "So, just be more careful next time.";
    // @form speech_bubble: a rounded bubble with a tail carrying one spoken or recalled line
    const bub = T.bubble(ctx, "draft", { x: 900, y: 170, w: 840, text: line, kind: "thought", fill: "surface", tail: [885, 292], role: "body", maxLines: 2, t: tDraft + 0.2 });
    // the line types in along the words (a character count that is a pure function of time)
    const tn = bub.inner.querySelector("text"), spans = Array.from(tn.querySelectorAll("tspan")), full = spans.map((s) => s.textContent);
    const total = full.reduce((a, s) => a + s.length, 0), dur = Math.min(2.2, Math.max(1.2, ctx.speechEnd - tLine - 0.7));
    Loom.drive((e) => {
      let n = Math.round(total * e);
      spans.forEach((s, i) => { const k = Math.max(0, Math.min(full[i].length, n)); s.textContent = full[i].slice(0, k); n -= full[i].length; });
    }, tLine, dur, "linear", { kind: "typewriter", beat: ctx.beat.id, name: "draft", content: true });
    void S; void f;
  },
});
