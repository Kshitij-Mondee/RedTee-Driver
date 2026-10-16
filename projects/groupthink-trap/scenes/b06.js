// @design alone_with_the_doubt: on a held row of people with open private thoughts, each one glances around, sees only calm faces, and folds their thought shut in turn under narrowing light
/* b06 - "Each one looks around. Calm faces. And decides, I must be the only one." The slowdown (the lesson's hinge,
 * F9 and F16), on the held close frame of b05.
 * Treatments considered (lnd-motion-choreography-loop):
 *  (A) static + signalling: the four bubbles already shut and a caption-like tag "I'm the only one" over the row.
 *      Rejected: the hinge is a decision each person makes ALONE and IN TURN (look, see calm, fold the doubt away);
 *      a still frame loses the sequence, and the pedagogy asks for one slowdown here.
 *  (B) a slow camera pan along the row, one face at a time. Rejected: the storyboard locks the camera (the seed's
 *      habit is "cut"; the room is reframed only by cuts) and a pan would read as the viewer looking, not the people.
 *  (C) CHOSEN: on "Each one looks around" each colleague's eyes go left, then right, held between drawings, one
 *      person after another (what each one sees is calm faces and the backs of bubbles). On "Calm faces" the faces
 *      settle neutral and the light narrows: a soft veil darkens the wall about 25 percent, leaving one pool of
 *      light on each person (veil behind the people, so faces and bubbles keep their colour). On "I must be the only
 *      one" the four bubbles fold shut right to left: each tag lifts away, its object shrinks into the fold and the
 *      outline morphs from open back to folded, leaving only the red seam. A paper tag "the only one?" hangs from the
 *      last bubble to fold, the fast yes's, and is written on as it is said.
 * Rules from the references (TED-Ed s7; colour_and_tone: one accent placed, not sized; style_guide:
 * externalised_inner_state, radial_wedge_spotlight, minimal_face_posture_acting): a still camera on a moving drawing;
 * slow stepped glances are the slowdown; emotion from posture and eyes only.
 * Continuity: leaves four folded bubbles (as in b01) for b07; the veil and the tag are not held by b07, so they lift
 * at the cut.
 */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const svg = Loom.svg;
    const STEP = 1 / 6;

    const set = ctx.held("set");
    ["window_cloud", "board", "clock", "table", "board_slot", "stamp", "sheet"].forEach((n) => ctx.held(n));
    const NAMES = ["dana", "p_date", "p_test", "p_support", "p_client"];
    const P = {}; NAMES.forEach((n) => { P[n] = ctx.held(n).__api; });
    const KEYS = ["date", "test", "support", "client"];
    const OWNER_X = { date: 790, test: 1020, support: 1250, client: 1480 };
    const B = {}, O = {}, TAG = {};
    KEYS.forEach((k) => { B[k] = ctx.held("bub_" + k); O[k] = ctx.held("obj_" + k); TAG[k] = ctx.held("tag_" + k); });

    const tLooks = ctx.cue("Each one looks around");
    const tCalm = ctx.cue("Calm faces");
    const tMust = ctx.cue("I must be the only one");
    const tOnly = ctx.cue("the only one");

    // the outlines boil through the hold, until each one has folded (then until the end, folded)
    KEYS.forEach((k) => Loom.stepped.boil(B[k], ctx.start, ctx.end, { hz: 8, amp: 1.1 }));

    /* ---- "Each one looks around": eyes left, then right, held between drawings, one person after another ---- */
    const ORDER = ["p_date", "p_test", "p_support", "p_client"];
    ORDER.forEach((n, i) => {
      const t = tLooks + i * 0.42;
      P[n].look(-1, 0.05, t);
      P[n].look(1, 0.05, t + 2 * STEP);
      P[n].look(0.15, 0.35, t + 4 * STEP);
    });

    /* ---- "Calm faces": every face settles neutral, eyes down; the light narrows to four pools ---- */
    ORDER.forEach((n, i) => { P[n].emotion("neutral", tCalm + i * 0.04); P[n].look(0, 0.7, tCalm + 0.3 + i * STEP); });
    // the veil lives INSIDE the set (behind board, people, table and bubbles): only the wall and floor dim. A mask
    // with four soft holes leaves one pool of light on each colleague.
    // @form light_pools_veil: a dark veil over the back wall with soft round holes, one pool of light per person
    const veil = ctx.el("wall_pools", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede", parent: set.inner });
    {
      const id = Loom.uid("gtpool"), defs = svg("defs", {}, veil.inner);
      const blur = svg("filter", { id: id + "b", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
      svg("feGaussianBlur", { stdDeviation: 34 }, blur);
      const mask = svg("mask", { id: id + "m", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 1920, height: 1080 }, defs);
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("surface") }, mask);
      const holes = svg("g", { filter: `url(#${id}b)` }, mask);
      KEYS.forEach((k) => svg("ellipse", { cx: OWNER_X[k] + 10, cy: 420, rx: 118, ry: 230, fill: ctx.c("ink") }, holes));
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("ink"), mask: `url(#${id}m)` }, veil.inner);
    }
    Loom.tween(veil.life, { opacity: 0 }, { opacity: 0.27, duration: 0.9, ease: Loom.ease.editorial }, tCalm, { kind: "fade", beat: ctx.beat.id, name: "wall_pools" });

    /* ---- "I must be the only one": the bubbles fold shut in turn, right to left, each swallowing its object ---- */
    const FOLD = ["client", "support", "test", "date"];
    FOLD.forEach((k, i) => {
      const E = B[k], bb = E.__bub, sh = bb.shapes, t = tMust + i * 0.24;
      // the word lifts away first (a word is never folded or stepped)
      m.exit(TAG[k], t - 0.12, "recede", { dur: 0.2 });
      // the object shrinks into the fold: towards the folded bubble's centre, in drawings
      const ox = OWNER_X[k] - 95, oy = 205, fx = OWNER_X[k] + 40 - ox, fy = 330 - oy;   // folded centre, bubble-local
      Loom.stepped.wrap(() => m.travel(O[k], t, { x: fx - O[k].x, y: fy - O[k].y, scale: 0.001, dur: 3 * STEP }), { hz: 6 });
      // one outline morphing from open back to folded; the crease comes back; the seam returns to the fold
      Loom.morph.to(bb.body, sh.folded, t, { dur: 0.45, hz: 6 });
      Loom.morph.to(bb.seam, sh.seamFolded, t, { dur: 0.45, hz: 6 });
      Loom.morph.to(bb.crease, sh.crease, t, { dur: 0.45, hz: 6 });
      Loom.tween(bb.crease, { opacity: 0 }, { opacity: 1, duration: 2 * STEP, ease: "none" }, t + 0.3, { kind: "state", beat: ctx.beat.id, name: E.name + ".crease" });
      Loom.sfx("card", t + 0.4);
    });

    /* ---- "the only one": a paper tag hangs from the fast yes's folded bubble and is written on ---- */
    // measured like the set's own tag helper (b01), so it can sit with its right end just left of the clock's column
    const text = "the only one?";
    const F = kit.fit(text, { role: "label", w: 420, maxLines: 1 });
    const ins = Math.max(12, Math.round(F.size * 0.32)), notch = Math.round((F.height + 2 * ins) * 0.42);
    const w = Math.ceil(F.width + 2 * ins + notch), RIGHT = 968;
    // y: its lower edge clears the fast yes's OPEN bubble top (228), which is still folding when the pin lands
    set.__tag(ctx, "tag_only_one", { x: RIGHT - w / 2, y: 216, text, to: [862, 312], side: "right", t: tOnly });
  },
});
