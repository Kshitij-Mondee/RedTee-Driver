// @design a rejected card leaves the same night office sealed, with the work sign-in and one phone request both denied
Loom.scene("b14", {
  build(ctx) {
    const { m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
    const tReplay = ctx.cue("Replay the night.");
    const tTried = ctx.cue("The leaked password is tried.");
    const tFits = ctx.cue("It fits nothing.");
    const tRequest = ctx.cue("A request arrives: denied, and reported.");
    const tShut = ctx.cue("Every door stays shut.");

    // Treatments considered: a static verdict screen, a corridor of locks, or the b02 office replay with one inset. Chosen: the repeated office proves that the familiar night now ends differently.
    const st = ctx.depth("night_office", { dolly: [tReplay, ctx.end], push: -0.035, drift: 18, focus: 0.55, dof: 5, atmosphere: 0.42, cx: 1080, cy: 570 });
    const far = st.layer(0.12);
    // @form night_office: dark wall, floor and blind-shadowed window repeat the opening room
    svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: st.tone("field2", 0.12) }, far);
    svg("rect", { x: -200, y: 770, width: 2320, height: 710, fill: st.tone("surface2", 0.25) }, far);
    svg("rect", { x: 1160, y: 150, width: 500, height: 370, fill: st.tone("accent3", 0.08), opacity: 0.34 }, far);
    for (let y = 164; y < 510; y += 32) svg("rect", { x: 1160, y, width: 500, height: 15, fill: c("shadow"), opacity: 0.8 }, far);
    st.haze(0.4, 660, "accent3");
    const mid = st.layer(0.55);

    // @form login_screen: the familiar 02:00 monitor now gives the safe verdict
    const login = ctx.el("login_screen", { x: 210, y: 245, w: 1000, h: 640, kind: "device", exit: "recede", parent: mid });
    const loginHandle = Loom.lesson.login_screen(ctx, login.inner, { x: 0, y: 0, w: 1000, state: "empty" });
    loginHandle.setState("typing", tTried);
    loginHandle.setState("denied", tShut);

    // @form keycard: the copied password reaches the field, dims, and unlocks nothing
    const card = ctx.el("keycard", { x: 380, y: 430, w: 220, h: 140, kind: "token", exit: "recede", parent: mid });
    const cardHandle = Loom.lesson.keycard(ctx, card.inner, { x: 0, y: 0, w: 220, seed: "dana-work", state: "copy" });
    m.reveal(card, tTried);
    m.travel(card, tTried + 0.14, { x: 220, y: 140, scale: 1 });
    cardHandle.setState("dim", tFits);
    m.exit(card, tFits, "recede");

    // @form bedroom_inset: one approval request is denied and recorded, without leaving the office
    const phone = ctx.el("bedroom_inset", { x: 1390, y: 565, w: 250, h: 366, kind: "device", exit: "recede" });
    const phoneHandle = Loom.lesson.bedside_phone(ctx, phone.inner, { x: 0, y: 0, w: 250, tilt: -7, state: "dark" });
    m.reveal(phone, tRequest);
    phoneHandle.setState("prompt", tRequest);
    phoneHandle.setState("pressed", tRequest + 0.8);
    phoneHandle.setState("denied", tRequest + 1.5);

    // @form far_door_one: the first far system remains closed
    const d1 = ctx.el("far_door_one", { x: 1170, y: 408, w: 112, h: 174, kind: "prop", exit: "recede", parent: far });
    const h1 = Loom.lesson.door(ctx, d1.inner, { x: 0, y: 0, w: 112, shade: 0.62, state: "shut" });
    // @form far_door_two: the second far system remains closed
    const d2 = ctx.el("far_door_two", { x: 1298, y: 380, w: 130, h: 202, kind: "prop", exit: "recede", parent: far });
    const h2 = Loom.lesson.door(ctx, d2.inner, { x: 0, y: 0, w: 130, shade: 0.54, state: "shut" });
    // @form far_door_three: the third far system remains closed
    const d3 = ctx.el("far_door_three", { x: 1448, y: 346, w: 150, h: 233, kind: "prop", exit: "recede", parent: far });
    const h3 = Loom.lesson.door(ctx, d3.inner, { x: 0, y: 0, w: 150, shade: 0.45, state: "shut" });
    // @form far_door_four: the final far system remains closed
    const d4 = ctx.el("far_door_four", { x: 1620, y: 306, w: 174, h: 270, kind: "prop", exit: "recede", parent: far });
    const h4 = Loom.lesson.door(ctx, d4.inner, { x: 0, y: 0, w: 174, shade: 0.34, state: "shut" });
    [d1, d2, d3, d4].forEach((door) => m.reveal(door, tReplay));
    [h1, h2, h3, h4].forEach((handle) => handle.setState("refused", tFits));
  },
});
