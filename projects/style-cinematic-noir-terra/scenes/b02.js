// @design password_becomes_a_lit_card_heading_for_closed_doors: a successful night login turns into one tangible amber card that draws the camera toward a dark row of doors
Loom.scene("b02", {
  build(ctx) {
    const { m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    const tStart = ctx.cue("Nobody broke in.");
    const tFollow = ctx.cue("Follow that one password through the night,");
    const tHabits = ctx.cue("and the two habits that stop it.");

    // Treatments considered: static desk evidence, a card travelling to a corridor, or a slow dolly through a depth office. Chosen: the dolly makes the password a thing to follow.
    const st = ctx.depth("night_office", { dolly: [tHabits, ctx.end], push: 0.06, drift: -26, focus: 0.55, dof: 5, atmosphere: 0.42, cx: 1080, cy: 570 });
    const far = st.layer(0.12);
    // @form night_office: dark wall and floor establish the empty office
    svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: st.tone("field2", 0.12) }, far);
    svg("rect", { x: -200, y: 770, width: 2320, height: 710, fill: st.tone("surface2", 0.25) }, far);
    svg("rect", { x: 1160, y: 150, width: 500, height: 370, fill: st.tone("accent3", 0.08), opacity: 0.34 }, far);
    for (let y = 164; y < 510; y += 32) svg("rect", { x: 1160, y, width: 500, height: 15, fill: c("shadow"), opacity: 0.8 }, far);
    st.haze(0.4, 660, "accent3");
    const mid = st.layer(0.55);

    // @form login_screen: the kit monitor is the sole warm evidence source at 02:00
    const login = ctx.el("login_screen", { x: 210, y: 245, w: 1000, h: 640, kind: "device", exit: "recede", parent: mid });
    const loginHandle = Loom.lesson.login_screen(ctx, login.inner, { x: 0, y: 0, w: 1000, state: "success" });
    loginHandle.setState("success", tStart);

    // @form keycard: the password begins in its own field before it can be followed
    const card = ctx.el("keycard", { x: 734, y: 510, w: 220, h: 140, kind: "device", exit: "recede", parent: mid });
    const cardHandle = Loom.lesson.keycard(ctx, card.inner, { x: 0, y: 0, w: 220, seed: "dana-work", state: "lit" });
    m.reveal(card, tFollow);
    m.travel(card, tFollow + 0.18, { x: 380, y: -80, scale: 1 });
    m.emphasis(card, tFollow + 0.65);

    // @form far_door_one: a small shut door recedes into the coming corridor
    const d1 = ctx.el("far_door_one", { x: 1170, y: 408, w: 112, h: 174, kind: "prop", exit: "recede", parent: far });
    Loom.lesson.door(ctx, d1.inner, { x: 0, y: 0, w: 112, shade: 0.62, state: "shut" });
    // @form far_door_two: a small shut door recedes into the coming corridor
    const d2 = ctx.el("far_door_two", { x: 1298, y: 380, w: 130, h: 202, kind: "prop", exit: "recede", parent: far });
    Loom.lesson.door(ctx, d2.inner, { x: 0, y: 0, w: 130, shade: 0.54, state: "shut" });
    // @form far_door_three: a small shut door recedes into the coming corridor
    const d3 = ctx.el("far_door_three", { x: 1448, y: 346, w: 150, h: 233, kind: "prop", exit: "recede", parent: far });
    Loom.lesson.door(ctx, d3.inner, { x: 0, y: 0, w: 150, shade: 0.45, state: "shut" });
    // @form far_door_four: a small shut door recedes into the coming corridor
    const d4 = ctx.el("far_door_four", { x: 1620, y: 306, w: 174, h: 270, kind: "prop", exit: "recede", parent: far });
    Loom.lesson.door(ctx, d4.inner, { x: 0, y: 0, w: 174, shade: 0.34, state: "shut" });
    [d1, d2, d3, d4].forEach((door, i) => m.reveal(door, tHabits + i * 0.12));
  },
});
