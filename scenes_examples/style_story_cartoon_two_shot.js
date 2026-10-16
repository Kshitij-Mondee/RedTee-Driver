// @design two_shot_number_on_prop: two named colleagues face each other across a table; the figure they discuss lands on the wall board between them
// @lab {"title": "story-cartoon two-shot: Rina and Joel across a table, the number on the board between them", "styles": ["story-cartoon"], "dur": 7.5, "times": [0.3, 1.4, 2.6, 3.7, 4.7, 6.8], "words": [{"w": "Rina", "s": 0.6, "e": 0.9}, {"w": "asks", "s": 0.92, "e": 1.2}, {"w": "Joel", "s": 1.22, "e": 1.5}, {"w": "how", "s": 1.52, "e": 1.7}, {"w": "the", "s": 1.72, "e": 1.8}, {"w": "handovers", "s": 1.82, "e": 2.4}, {"w": "went.", "s": 2.42, "e": 2.7}, {"w": "Three", "s": 3.2, "e": 3.45}, {"w": "of", "s": 3.47, "e": 3.58}, {"w": "five", "s": 3.6, "e": 3.95}, {"w": "arrived", "s": 3.97, "e": 4.35}, {"w": "on", "s": 4.37, "e": 4.5}, {"w": "time,", "s": 4.52, "e": 4.85}, {"w": "he", "s": 4.9, "e": 5.05}, {"w": "says.", "s": 5.07, "e": 5.4}]}
/* Style example for story-cartoon (docs/styles/guides/story-cartoon.md, recipe R2). Hypothetical content.
 * A two-person conversation the way this register stages it (Rina and Joel are example names on purpose: a cast
 * name never reuses a designed kit's id such as maya, daniel or priya, ASSET_WISHLIST A0):
 *  - a PLACE first (a room that fills the frame), never people on an empty field;
 *  - the 180-degree line: Rina stays screen left facing right, Joel screen right facing left, for the whole lesson;
 *  - both heads in the same eye band (the busts share one box height and centre, y 620; the board takes the top
 *    third), so a cut between them never jumps;
 *  - the people are a DESIGNED kit (Open Peeps busts, kit.peep) dressed from the pack's cloth tokens, the same
 *    look the templates draw for these cast members (story.cast gives member, skin and cloth); no figure is built
 *    from primitives here. Each kit.peep call names its element, member, cloth and skin as LITERALS: the cast gate
 *    (loom/checks/story.py appearances_scene) reads people from the source text, and a loop over variables hides
 *    them from it (the first version of this file did that);
 *  - nameplates on the table say who is who (the Crayon Capital device), in the hand-lettered label face;
 *  - the number lives on a prop (the wall board), it is the ONE accent in the frame, and it lands on its word;
 *  - the speaker's mouth moves only inside their own speech act ("Rina asks...", "...he says"); the listener reacts
 *    on the number. Faces are switched by ONE drive per person (one owner of each face's visibility, so every seek
 *    order gives the same frame; the first version had a drive and a Loom.tl.set both writing Rina's faces).
 * Treatments considered: (A) a compare card "planned 5 / on time 3" (rejected: a slide, no people);
 * (B) a chart on a floating card (rejected: the number would float beside the story);
 * (C) CHOSEN: the room, the two of them, the board between them.
 * Not yet seen in a Chrome frame: whether the board's lower corners clear both heads (estimated, check the strip).
 */
Loom.scene("style_story_cartoon_two_shot", {
  build(ctx) {
    const { kit, m } = ctx;

    // 1. the place: a room that fills the frame (wall surface2, floor field2, a window on the far side). The floor line
    //    sits behind the table, never at chin or eye height behind a head (a tangent reads as a stripe through the neck)
    const room = ctx.scenery("room", "set", { window: true, windowX: 1530, floor: 0.86 });
    m.reveal(room.E, ctx.start + 0.05, { dy: 0 });

    // 2. the prop that carries the number: a wall board between the two heads, high enough to clear them
    const board = ctx.el("board", { x: 690, y: 64, w: 540, h: 300, kind: "card", exit: "recede" });
    kit.rect(board.inner, 0, 0, 540, 300, { fill: "surface", r: 8 });
    kit.rect(board.inner, 228, 300, 84, 14, { fill: "muted", r: 4, flat: true });   // the tray under the board
    kit.text(board.inner, "Handovers on time", { role: "label", x: 30, y: 24, w: 480, h: 56, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    const num = ctx.el("board_number", { x: 30, y: 92, w: 480, h: 180, kind: "value", parent: board.inner, exit: "recede" });
    kit.text(num.inner, "3 of 5", { role: "display", x: 0, y: 0, w: 480, h: 180, maxLines: 1, align: "center", valign: "middle", color: "accent" });
    m.settle(board, ctx.start + 0.2, { dy: 24 });
    m.stamp(num, ctx.cue("Three of five"));

    // 3. the people: a designed bust kit, one look per name. In a lesson these values are story.cast's
    //    (Rina: woman, skin 1, cloth; Joel: man, skin 3, cloth2), written as literals so the cast gate can check them
    const SIZE = 640, Y = 620;   // the bust box: both heads in one eye band, the shoulders above the table edge
    const X = { rina: 560, joel: 1360 };
    const EMOS = ["neutral", "explaining", "surprised"];
    const rina = ctx.el("rina", { x: X.rina - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const joel = ctx.el("joel", { x: X.joel - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const faces = { rina: {}, joel: {} };
    for (const em of EMOS) {
      // the 180-degree line: Rina (screen left) faces right; Joel (screen right) is flipped to face left
      faces.rina[em] = kit.peep(rina.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 1 });
      faces.joel[em] = kit.peep(joel.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 3 });
      faces.rina[em].style.visibility = em === "neutral" ? "visible" : "hidden";
      faces.joel[em].style.visibility = em === "neutral" ? "visible" : "hidden";
    }
    m.settle(rina, ctx.start + 0.15, { dy: 30 });
    m.settle(joel, ctx.start + 0.25, { dy: 30 });

    // 4. the table in front hides where the busts end (the near layer: drawn after the people)
    const table = ctx.el("table", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    kit.rect(table.inner, 160, 900, 1600, 40, { fill: "surface", r: 10 });
    // the front in field2, one value step below the wall (surface2): in surface2 it read as more wall (preview, round 2)
    kit.rect(table.inner, 210, 940, 1500, 180, { fill: "field2", r: 0 });
    // nameplates: who is who, in the label face, on the table edge in front of each person
    for (const [name, label] of [["rina", "Rina"], ["joel", "Joel"]]) {
      const x = X[name];
      kit.polygon(table.inner, [[x - 110, 900], [x + 110, 900], [x + 94, 822], [x - 94, 822]], { fill: "surface" });   // 78 px tall: a 38 px label needs 7.6 px around its font box
      kit.text(table.inner, label, { role: "label", x: x - 84, y: 826, w: 168, h: 70, maxLines: 1, align: "center", valign: "middle", color: "ink" });   // inset inside the plate (tight_inset, A4 proof)
    }
    m.reveal(table, ctx.start + 0.05, { dy: 0 });

    // 5. who shows which face: ONE drive per person over the whole beat, a pure function of time. The speaker's mouth
    //    opens on the narration's words inside their own speech act; Rina reacts on the number and holds it
    const words = [];
    for (const ph of (ctx.beat && ctx.beat.phrases) || []) for (const w of ph.words || []) words.push(w);
    const flap = (t) => { const w = words.find((x) => t >= x.s && t < x.e); return !!w && Math.floor((t - w.s) / 0.12) % 2 === 0; };
    const tAsk = ctx.cue("Rina asks"), tNum = ctx.cue("Three of five");
    const faceAt = {
      rina: (t) => (t >= tNum + 0.25 ? "surprised" : t >= tAsk && t < tNum - 0.3 && flap(t) ? "explaining" : "neutral"),
      joel: (t) => (t >= tNum && t < ctx.speechEnd && flap(t) ? "explaining" : "neutral"),
    };
    for (const who of ["rina", "joel"]) {
      const F = faces[who], T0 = ctx.start, T1 = ctx.end;
      Loom.drive((e, raw) => {
        const want = faceAt[who](T0 + raw * (T1 - T0));
        for (const em of EMOS) F[em].style.visibility = em === want ? "visible" : "hidden";
      }, T0, Math.max(0.1, T1 - T0), "linear", { kind: "character", beat: ctx.beat.id, name: who, content: true });
    }
  },
});
