// @design breach_becomes_traveling_list: a fault elsewhere forces one door while the card is copied onto a long sheet that slides away, duplicated, the other door untouched
Loom.scene("b04", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const DW = 360, DH = Math.round(620 * 360 / 400);
    const SHOP = { x: 533, y: 270 }, WORK = { x: 1160, y: 130 };
    const CARD = { x: 866, y: 500, w: 178 };

    const tryHeld = (n) => { let h = null; try { h = ctx.held(n); } catch (e) { h = null; } return h && h.handle ? h : null; };

    // held from b03 (same names, same boxes); created only if nothing is held
    let wall = null; try { wall = ctx.held("door_wall"); } catch (e) { wall = null; }
    if (!wall) {
      const W = ctx.el("door_wall", { x: 0, y: 60, w: 1920, h: 760, kind: "scenery", exit: "none" });
      kit.rect(W.inner, 0, 0, 1920, 760, { fill: ctx.c("field2") });
    }
    let shop = tryHeld("door_shop");
    if (!shop) {
      const E = ctx.el("door_shop", { x: SHOP.x, y: SHOP.y, w: DW, h: DH, kind: "scenery", exit: "none" });
      const h = Loom.lesson.door(ctx, E.inner, { w: DW, name: "Shop" });
      shop = { handle: h };
    }
    let work = tryHeld("door_work");
    if (!work) {
      const E = ctx.el("door_work", { x: WORK.x, y: WORK.y, w: DW, h: DH, kind: "scenery", exit: "none" });
      const h = Loom.lesson.door(ctx, E.inner, { w: DW, name: "Work" });
      work = { handle: h };
    }
    let key = tryHeld("keycard");
    if (!key) {
      const E = ctx.el("keycard", { x: CARD.x, y: CARD.y, w: CARD.w, h: 140, kind: "token", exit: "none" });
      const h = Loom.lesson.keycard(ctx, E.inner, { w: CARD.w, seed: "dana" });
      key = { handle: h };
    }

    const tShop = ctx.cue("shopping site is breached");
    const tWork = ctx.cue("never controlled it");
    const tSheet = ctx.cue("The password lands");
    const tDrop = ctx.cue("lands in a list");
    const tShare = ctx.cue("Lists get shared");

    // 1. Shop door forced, neg tag with a lead line
    shop.handle.setState("forced", tShop);
    const TG = { x: 96, y: 260, w: 380, h: 64 };
    const tag = ctx.el("breach_tag", { x: TG.x, y: TG.y, w: TG.w, h: TG.h, kind: "text" });
    kit.text(tag.inner, "Shop: breached", { role: "lead", x: 0, y: 0, w: TG.w, h: TG.h, align: "left", valign: "middle", color: "neg", weight: 700 });
    m.reveal(tag, tShop + 0.15);
    const lead = ctx.el("breach_lead", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const ln = kit.line(lead.inner, TG.x + 365, TG.y + 32 + 2, SHOP.x + 30, TG.y + 32 + 2, { stroke: ctx.c("neg"), sw: 3 });
    m.draw(ln, tShop + 0.5, { dur: 0.5 });
    tag.followers = [lead];

    // 2. Work stays shut: hold (no change), nothing drawn

    // 3. the list sheet and the copy card
    const SH = { x: 330, y: 772, w: 1260, h: 146 };
    const CW = 84, CH = Math.round(140 * 84 / 220);
    const cols = 10, gapX = (SH.w - 40 - cols * CW) / (cols - 1);
    const slot = (i) => ({ x: 20 + (i % cols) * (CW + gapX), y: 14 + Math.floor(i / cols) * (CH + 12) });
    const buildSheet = (name, seedBase) => {
      const S = ctx.el(name, { x: SH.x, y: SH.y, w: SH.w, h: SH.h, kind: "card", exit: "none" });
      const G = document.createElementNS("http://www.w3.org/2000/svg", "g");
      S.inner.appendChild(G);
      S.G = G;
      kit.rect(G, 0, 0, SH.w, SH.h, { fill: ctx.c("surface"), r: 10, stroke: ctx.c("line") });
      for (let i = 1; i < 20; i++) {
        const p = slot(i);
        Loom.lesson.keycard(ctx, G, { x: p.x, y: p.y, w: CW, seed: seedBase + i, state: "copy" });
      }
      const p0 = slot(0);
      const k0 = Loom.lesson.keycard(ctx, G, { x: p0.x, y: p0.y, w: CW, seed: "dana", state: "copy" });
      S.k0 = k0;
      return S;
    };
    const sheet = buildSheet("list_sheet", "n");
    m.grow(sheet, tSheet, { axis: "x" });

    const first = slot(0);
    const cp = ctx.el("list_copy", { x: CARD.x + 60, y: CARD.y - 90, w: CARD.w, h: 114, kind: "token" });
    Loom.lesson.keycard(ctx, cp.inner, { w: CARD.w, seed: "dana", state: "copy" });
    m.reveal(cp, tDrop - 0.1);
    m.travel(cp, tDrop, { x: SH.x + first.x, y: SH.y + first.y, scale: CW / CARD.w, dur: 0.8 });
    Loom.tl.set(sheet.k0.g, { autoAlpha: 0 }, 0);
    Loom.tl.set(sheet.k0.g, { autoAlpha: 1 }, tDrop + 0.82);
    Loom.tl.set(cp.outer, { autoAlpha: 0 }, tDrop + 0.84);

    // 4. share: the sheet slides right and out, duplicated twice as it goes
    const d1 = buildSheet("list_sheet_b", "p");
    const d2 = buildSheet("list_sheet_c", "q");
    [d1, d2].forEach((d) => { Loom.tl.set(d.outer, { autoAlpha: 0 }, 0); Loom.tl.set(d.outer, { autoAlpha: 1 }, tShare - 0.02); });
    const out = 2000; // share slide
    const slide = (S, t0) => { Loom.drive((e) => { S.G.setAttribute("transform", "translate(" + Math.round(1700 * e) + ",0)"); }, t0, 0.9, "linear"); Loom.tl.set(S.outer, { autoAlpha: 0 }, t0 + 0.91); };
    slide(sheet, tShare); slide(d1, tShare + 0.15); slide(d2, tShare + 0.3);
  }
});
