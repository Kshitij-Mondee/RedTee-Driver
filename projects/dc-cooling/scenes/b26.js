// @design one_flow_split_into_bins: one stream of units pours from a pipe and lands in named bins; the fullest overhead bin takes the accent
/* b26, the energy pour: one flow splits into the IT bin and three overhead bins; cooling is the fullest overhead bin.
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. a stacked bar of IT and overhead shares (rejected: it needs a figure, and the knowledge sheet carries none);
 *   B. three icon cards "IT, overhead, cooling" (rejected: words standing in for the flow; nothing changes over time);
 *   C. WINNER: Loom.physics.puePour. Energy beads pour from a pipe and split into the IT bin and three overhead bins
 *      (Cooling, Power losses, Lighting). The bead counts are a PICTURE of the claim (cooling is the biggest slice of
 *      the overhead), not a measurement: no counts, no shares and no ratio are printed (showShares false, no ratioText).
 *      An Overhead bracket groups the three overhead bins; the Cooling label and its bin rim take the accent as the
 *      beads come to rest.
 * The bracket sits UNDER the bin labels (not over the bins, as the storyboard sketched): the beads fall through the
 * space above the bins, and a bracket there would be crossed by every overhead bead.
 */
Loom.scene("b26", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const S = Loom.style;
    const tPour = ctx.cue("On top");
    const tCool = ctx.cue("Cooling is usually the biggest slice");

    // the recipe draws its own elements through ctx.el; keep the handles so the Cooling label and bin can take the accent
    const made = {};
    const elOrig = ctx.el;
    ctx.el = function (name, o) { const e = elOrig.call(ctx, name, o); made[name] = e; return e; };
    const BX = 210, BY = 100, BW = 1500, BH = 728;
    const res = Loom.physics.puePour(ctx, "pue", {
      itShare: 0.62, itLabel: "IT energy",
      overheads: [["Cooling", 0.26], ["Power losses", 0.08], ["Lighting", 0.04]],
      beads: 20, showShares: false,
      colors: { it: "accent3", overhead: "accent2", bead: "muted" },
      t: tPour, x: BX, y: BY, w: BW, h: BH,
    });
    ctx.el = elOrig;

    // ---- geometry of the recipe's bins (same arithmetic as the recipe: 4 bins, 12 px walls, 160 px inside)
    const nb = 4, binW = 160, wallW = 12;
    const gapB = Math.max(60, Math.min(240, (BW - nb * (binW + 2 * wallW)) / (nb + 1)));
    const mg = (BW - nb * (binW + 2 * wallW) - (nb - 1) * gapB) / 2;
    const span = (i) => { const a = mg + wallW + i * (binW + 2 * wallW + gapB); return { a, b: a + binW }; };
    const binsE = made["pue_bins"], labE = (i) => made["pue_bin_label_" + i];

    // ---- "Total facility energy" on the pipe (words from the narration's own term for the feed)
    const pipeX = BX + BW / 2;
    const tot = ctx.el("label_total_energy", { x: pipeX - 24 - 14 - 470, y: BY + 14, w: 470, h: 56, kind: "text", exit: "recede" });
    kit.text(tot.inner, "Total facility energy", { role: "lead", weight: 700, x: 0, y: 0, w: 470, h: 56, align: "right", valign: "middle", maxLines: 1, color: "ink" });
    m.reveal(tot, tPour, { dy: 8 });

    // ---- the Overhead bracket under the three overhead bins and their labels
    // @form group_bracket: a thin bracket under a run of neighbours with one word that names the group
    const x0 = BX + span(1).a - wallW, x1 = BX + span(3).b + wallW, yb = BY + BH + 12;
    const br = ctx.el("overhead_bracket", { x: x0, y: yb, w: x1 - x0, h: 74, kind: "connector", exit: "recede" });
    const brPath = kit.path(br.inner, `M 0 0 V 16 H ${x1 - x0} V 0`, { stroke: "line", sw: 4 });
    kit.text(br.inner, "Overhead", { role: "label", weight: 700, x: 0, y: 22, w: x1 - x0, h: 48, align: "center", valign: "middle", maxLines: 1, color: "ink" });

    // ---- the Cooling bin's rim: a U in the accent over its walls and floor, hidden until its word
    const sp = span(1);
    const rimE = ctx.el("cooling_rim", { x: BX + sp.a - wallW, y: binsE.y, w: binW + 2 * wallW, h: binsE.h, kind: "connector", exit: "recede" });
    const rimTop = -4, rimBot = binsE.h - 10;
    kit.path(rimE.inner, `M ${wallW / 2} ${rimTop} V ${rimBot} H ${binW + wallW * 1.5} V ${rimTop}`, { stroke: "accent", sw: 8 });

    // the Cooling label's word takes the accent
    const cooling = labE(1).inner.querySelector("text");
    const inkC = c("ink"), accC = c("accent");
    const key = Loom.uid("b26t");
    const setCool = (v) => { if (cooling) cooling.setAttribute("fill", S.mix(inkC, accC, v)); };
    setCool(0);

    // ================================================================ the timeline
    // "On top, IT plus overhead": the pour is baked and replays from tPour; the bracket settles after the first beads land
    const tBr = tPour + 2.0;
    m.reveal(br, tBr, { dy: 0, dur: 0.01 });
    m.draw(brPath, tBr, { dur: 0.5 });
    // "Cooling is usually the biggest slice": its label and bin rim take the accent as the beads come to rest
    Loom.drive((e) => setCool(e), tCool, 0.5, "move", { key, kind: "kit", content: true });
    m.reveal(rimE, tCool, { dy: 0, dur: 0.5 });
  },
});
