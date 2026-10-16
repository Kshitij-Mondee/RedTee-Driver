// @design warning_arrives_with_room_to_act: the same desk and the same pair, but this time the warning lands early and there is time to spare
// Treatments: (A) avatar-style talking heads in discs (rejected: no desk world, no callback to the opening two-shot);
// (B) a fresh wide shot of the whole office (rejected: breaks the b02 callback, the frame must read as the same place);
// (C) CHOSEN: the exact b02 two-shot framing (set, busts, planner, laptop at the new shared boxes), the planner's
// pages turned to show two weeks on, the Tuesday pin and its alert as the one accent, both faces lifting from
// explaining to happy once the laptop's early heads-up lands with time still to spare. Every element gets a real
// exit into the cut to the presenter that follows.
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    function dur(key, fallback) {
      try { const v = ctx.style.dur(key); return v || fallback; } catch (e) { return fallback; }
    }
    const EMOS = ["neutral", "explaining", "surprised", "happy"];

    // 1. scaffold: the shared office set, exact two_shot framing, no nameplates (both already introduced)
    const setEl = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const set = Loom.lesson.desk_set(ctx, setEl.inner, { w: 1920, h: 1080 });
    set.setState("two_shot", ctx.start);
    m.reveal(setEl, ctx.start + 0.02, { dy: 0 });

    // 2. people: busts at the shared boxes; all four kit.peep emotions drawn, one shown via E.ui.face(name,t)
    // @form you_bust: You, neutral, then explaining, then happy as the warning lands early with time to spare
    const youEl = ctx.el("you", { x: 260, y: 320, w: 600, h: 600, kind: "character", parent: set.peepLayer });
    const youPose = Loom.svg("g", {}, youEl.inner);
    const youFaces = {};
    EMOS.forEach(function (emo) {
      const g = Loom.svg("g", { style: emo === "neutral" ? "" : "display:none;opacity:0" }, youPose);
      kit.peep(g, "woman", emo, { x: 300, y: 300, size: 600, flip: false, cloth: "cloth", skin: 3 });
      youFaces[emo] = g;
    });
    youEl.ui = {
      face: function (name, t) {
        EMOS.forEach(function (k) {
          if (k === name) Loom.tl.set(youFaces[k], { display: "inline", opacity: 1 }, t);
          else Loom.tl.set(youFaces[k], { display: "none", opacity: 0 }, t);
        });
      },
    };
    m.pop(youEl, ctx.start + 0.05);
    m.drift(youEl, ctx.start + 0.3, ctx.end, { amp: 3, period: 3.0 });

    // @form leo_bust: Leo, neutral, then explaining, then happy, leaning in over the planner with her
    const leoEl = ctx.el("leo", { x: 1060, y: 320, w: 600, h: 600, kind: "character", parent: set.peepLayer });
    const leoPose = Loom.svg("g", {}, leoEl.inner);
    const leoFaces = {};
    EMOS.forEach(function (emo) {
      const g = Loom.svg("g", { style: emo === "neutral" ? "" : "display:none;opacity:0" }, leoPose);
      kit.peep(g, "man", emo, { x: 300, y: 300, size: 600, flip: true, cloth: "cloth2", skin: 1 });
      leoFaces[emo] = g;
    });
    leoEl.ui = {
      face: function (name, t) {
        EMOS.forEach(function (k) {
          if (k === name) Loom.tl.set(leoFaces[k], { display: "inline", opacity: 1 }, t);
          else Loom.tl.set(leoFaces[k], { display: "none", opacity: 0 }, t);
        });
      },
    };
    m.pop(leoEl, ctx.start + 0.1);
    m.drift(leoEl, ctx.start + 0.3, ctx.end, { amp: 3, period: 3.2 });

    // 3. the planner: reference, above and between the heads, the shared new box
    const plannerBox = { x: 640, y: 20, w: 640, h: 297 };
    const plannerEl = ctx.el("planner", { x: plannerBox.x, y: plannerBox.y, w: plannerBox.w, h: plannerBox.h, kind: "card" });
    const planner = Loom.lesson.week_planner(ctx, plannerEl.inner, { w: plannerBox.w, h: plannerBox.h });
    m.reveal(plannerEl, ctx.start + 0.15, { dy: -10 });
    const slots = planner.slots(plannerBox.x, plannerBox.y, plannerBox.w, plannerBox.h);

    // 4. the laptop: on the table between the two of them, clear of both faces (matches b02 exactly)
    const laptopEl = ctx.el("laptop", { x: 780, y: 640, w: 420, h: 300, kind: "instrument" });
    const laptop = Loom.lesson.leo_laptop_message(ctx, laptopEl.inner, { w: 420, h: 300 });
    m.reveal(laptopEl, ctx.start + 0.2, { dy: 0 });

    // 5. the Tuesday pin, lifted well clear of the planner's bottom border (critic: label was
    // bisected by it at slots.tue.y). tueAnchorY replaces slots.tue.y as the shared anchor for
    // BOTH the pin and the message below, so the two stay in the same beside relationship,
    // just moved up together, inside the Tuesday column.
    const tuePinLift = 88;
    const tueAnchorY = slots.tue.y - tuePinLift;
    const tuePinEl = ctx.el("tue_pin", { x: slots.tue.x - 80, y: tueAnchorY - 80, w: 160, h: 160, kind: "token", exit: "iris" });
    const tuePin = Loom.lesson.tue_pin(ctx, tuePinEl.inner, { w: 160, h: 160, label: "Tuesday" });

    // 6. the Tuesday alert: the one saturated accent of this beat, landing beside the (now higher) pin
    // @form tue_alert: the one accent, the alert that lands at the Tuesday pin
    const msgCx = slots.tue.x + 46, msgCy = tueAnchorY - 46;
    const tueMsgEl = ctx.el("tue_message", { x: msgCx - 60, y: msgCy - 60, w: 120, h: 120, kind: "token", exit: "iris" });
    const tueMsgRing = Loom.svg("g", { style: "opacity:0" }, tueMsgEl.inner);
    kit.disc(tueMsgRing, 60, 60, 24, { fill: "accent" });
    let tueIconTok = "ink";
    try { if (Loom.style && Loom.style.pickTokenOn) tueIconTok = Loom.style.pickTokenOn("accent") || "ink"; } catch (e) {}
    kit.icon(tueMsgRing, "mail", { x: 60, y: 60, size: 26, color: tueIconTok });

    // 7. the small sign, measured before drawn, on the wall LEFT of the planner (the Tuesday
    // side), mirroring where b10 put its "Next step" sign: clear of the planner (x 640-1280)
    // and clear of You's hair (You's bust box starts at y 320).
    const signText = "Tuesday: heads up";
    const signW = 300, signInset = 20;
    const fit = kit.fit(signText, { role: "label", w: signW - 2 * signInset, maxLines: 2 });
    const signH = fit.height + 2 * signInset;
    // @form heads_up_sign: a small paper sign naming the day the warning now comes on
    const signEl = ctx.el("heads_up_sign", { x: 300, y: 60, w: signW, h: signH, kind: "card" });
    kit.rect(signEl.inner, 0, 0, signW, signH, { fill: "surface", r: 10 });
    kit.text(signEl.inner, signText, { role: "label", x: signInset, y: signInset, w: signW - 2 * signInset, h: signH - 2 * signInset, align: "center", valign: "middle", maxLines: 2, color: "ink" });

    // --- choreography on the words (narration: "Back to Leo. Two weeks on. Tuesday, the midpoint,
    //     his message comes early. There's time to fix it.") ---
    const tFlip = ctx.cue("Two weeks on");
    planner.setState("flip", tFlip);
    const flipDur = 2 * dur("move", 0.34);

    const tPin = Math.max(ctx.cue("Tuesday"), tFlip + flipDur + 0.05);
    tuePin.setState("drop", tPin);

    const tMid = Math.max(ctx.cue("the midpoint"), tPin + 0.2);
    Loom.tween(tueMsgRing, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: dur("enter", 0.42), ease: "overshoot" }, tMid, { kind: "mark", beat: "b14", name: "tue_alert" });

    const tMsg = Math.max(ctx.cue("his message comes early"), tMid + 0.1);
    laptop.setState("message_tue", tMsg);
    youEl.ui.face("explaining", tMsg);
    leoEl.ui.face("explaining", tMsg);
    m.pop(signEl, tMsg + 0.15);

    const tFix = ctx.cue("time to fix it");
    youEl.ui.face("happy", tFix);
    leoEl.ui.face("happy", tFix);
    Loom.tween(youPose, { x: 0 }, { x: 20, duration: dur("move", 0.34), ease: "move" }, tFix, { kind: "gesture", beat: "b14", name: "you_lean" });
    Loom.tween(leoPose, { x: 0 }, { x: -20, duration: dur("move", 0.34), ease: "move" }, tFix, { kind: "gesture", beat: "b14", name: "leo_lean" });
  },
});
