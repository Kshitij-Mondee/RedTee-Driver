// @design one_key_per_lock: a vault hands out a different card for each door, so a copy of one card turns only its own lock
/* Three treatments considered: (1) static: vault with two cards laid out and a caption; (2) cards fly in a line to the
 * doors; (3) chosen: the vault below the gap issues one fresh card to each door, the doors turn, then the first card is
 * copied and the copy is refused at the other door (the proof is the refusal). */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);

    // ---- times (cues are spoken words of this beat)
    const tV = ctx.cue("First");
    const tA = ctx.cue("unique password for every account");
    const tC = ctx.cue("Then a leak");
    const tR = ctx.cue("opens only that site");
    const tM = ctx.cue("password manager");

    // ---- door_wall: the dark wall and the floor (held by the next beat)
    const WALL = ctx.el("door_wall", { x: 0, y: 84, w: 1920, h: 996, kind: "scenery", exit: "none" });
    const wy = (y) => y - 84;
    // @form wall_and_floor: a dark wall behind the doors, a lit-edged floor under them
    svg("rect", { x: 380, y: wy(84), width: 1160, height: 595, fill: c("field2") }, WALL.inner);
    svg("rect", { x: 0, y: wy(679), width: 1920, height: 420, fill: Loom.style.mix(c("field"), c("surface2"), 0.7) }, WALL.inner);
    svg("rect", { x: 0, y: wy(679), width: 1920, height: 3, fill: c("ink"), opacity: 0.22 }, WALL.inner);

    // ---- the two doors, side by side (Shop left, Work right)
    const DW = 380, DY = 90, SX = 440, WX = 1100;
    const dS = ctx.el("door_shop", { x: SX, y: DY, w: DW, h: 589, kind: "scenery", exit: "recede" });
    const doorShop = Loom.lesson.door(ctx, dS.inner, { w: DW, name: "Shop" });
    const dW = ctx.el("door_work", { x: WX, y: DY, w: DW, h: 589, kind: "scenery", exit: "none" });
    const doorWork = Loom.lesson.door(ctx, dW.inner, { w: DW, name: "Work" });
    const lockS = { x: SX + doorShop.lockAt.x, y: DY + doorShop.lockAt.y };
    const lockW = { x: WX + doorWork.lockAt.x, y: DY + doorWork.lockAt.y };

    // ---- cards (drawn before the vault so they slide out from behind it)
    const CW = 150, CH = Math.round(140 * CW / 220);
    const start = { x: 885, y: 815 - CH / 2 };
    const endS = { x: lockS.x + 4 - CW, y: lockS.y - CH / 2 };
    const endW = { x: lockW.x + 4 - CW, y: lockW.y - CH / 2 };
    // @form fresh_key_card: one new card per door, its own notch pattern
    const cS = ctx.el("card_shop", { x: start.x, y: start.y, w: CW, h: CH, kind: "token", exit: "recede" });
    Loom.lesson.keycard(ctx, cS.inner, { w: CW, state: "fresh", seed: "shop" });
    const cW = ctx.el("card_work", { x: start.x, y: start.y, w: CW, h: CH, kind: "token", exit: "recede" });
    Loom.lesson.keycard(ctx, cW.inner, { w: CW, state: "fresh", seed: "work" });
    // @form copied_card: a duller copy of the Shop card, same notches
    const cC = ctx.el("card_copy", { x: endS.x, y: endS.y, w: CW, h: CH, kind: "token", exit: "recede" });
    const copyCard = Loom.lesson.keycard(ctx, cC.inner, { w: CW, state: "copy", seed: "shop-fresh" });

    // ---- the vault, with the one accent as a small warm glow behind it (<= 460 px)
    const VS = 0.727 /* vault scale */, VW = 440 * VS;
    const V = ctx.el("vault", { x: 740, y: 705, w: 440, h: 220, kind: "instrument", exit: "recede" });
    const glow = svg("g", { opacity: 0 }, V.inner);
    const gid = Loom.uid("vg");
    const rg = svg("radialGradient", { id: gid, cx: "50%", cy: "50%", r: "50%" }, svg("defs", {}, glow));
    svg("stop", { offset: "0", "stop-color": c("accent"), "stop-opacity": 0.5 }, rg);
    svg("stop", { offset: "1", "stop-color": c("accent"), "stop-opacity": 0 }, rg);
    svg("ellipse", { cx: 220, cy: 110, rx: 220, ry: 110, fill: `url(#${gid})` }, glow);
    svg("ellipse", { cx: 220, cy: 187, rx: 100, ry: 9, fill: c("shadow"), opacity: 0.6 }, V.inner);
    const vault = Loom.lesson.password_vault(ctx, V.inner, { x: 129, y: 15, scale: VS, seed: "vault" });
    m.settle(V, tV);
    Loom.tween(glow, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, tV, { kind: "reveal", beat: ctx.beat.id, name: "vault_glow", content: true });

    // ---- phase 1: a different card to each door
    const d1 = 1.0;
    m.reveal(cS, tA, { dur: 0.2 });
    m.travel(cS, tA, { x: endS.x - start.x, y: endS.y - start.y, dur: d1 });
    doorShop.setState("turning", tA + d1);
    m.reveal(cW, tA + 0.5, { dur: 0.2 });
    m.travel(cW, tA + 0.5, { x: endW.x - start.x, y: endW.y - start.y, dur: d1 });
    doorWork.setState("turning", tA + 0.5 + d1);

    const tagU = Loom.data.tag(ctx, "label_unique", { x: 470, y: 790, text: "unique password", color: "accent4", t: tA + 1.1 });
    Loom.ui.wire(ctx, "lead_unique", { x: 470 + tagU.w, y: 790 + tagU.h / 2 }, { x: 866, y: 815 }, tA + 1.3, { tone: "accent4" });

    // ---- phase 2: the Work card goes back, the Shop card is copied and tried at Work
    m.travel(cW, tC, { x: 0, y: 0, dur: 0.7 });
    doorWork.setState("shut", tC);
    const cs = tC + 0.3;
    m.reveal(cC, cs, { dur: 0.2 });
    m.travel(cC, cs, { x: endW.x - endS.x, y: 0, dur: Math.max(0.8, tR - cs) });
    doorWork.setState("refused", tR);
    copyCard.setState("dim", tR + 0.3);

    // ---- phase 3: the label for the vault
    const lab = Loom.data.tag(ctx, "label_manager", { x: 1130, y: 790, text: "password manager", color: "accent", t: tM });
    Loom.ui.wire(ctx, "lead_manager", { x: 1130, y: 790 + lab.h / 2 }, { x: 1054, y: 815 }, tM + 0.2, { tone: "accent" });
  },
});
