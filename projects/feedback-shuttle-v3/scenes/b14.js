// @design plain_praise_vs_tied_note: two notes at one desk, the empty polite one goes quiet while the one tied to an action by a line takes the accent
/* Treatments considered:
 * (A) a static two-note composition with a legend (rejected: no moment, the link has no cause);
 * (B) a close-up of the monitor only (rejected: loses the desk the next beat continues from);
 * (C) CHOSEN: the bare desk holds; the plain Great job bubble pops on the monitor, its empty inside shows and it
 *     settles to muted; the specific note drops beside it in the accent and a line draws to the agenda thumb.
 * Layers: bare desk (held by b15) < bubble < specific note (with its thumb) < link. The notes are clipped
 * overlays of the same part so they can leave while the desk stays; the link is its own element (a window onto
 * the same part, cut out of the note) so b15 can hold it.
 */
Loom.scene("b14", {
  build(ctx) {
    const { m } = ctx;
    const L = Loom.lesson;
    let uid = 0;

    // the clipped overlay: the same desk_set, only the window around one note shows, so the note is its own element.
    // hole {x,y,w,h} (absolute canvas px) is cut out of the window (even-odd).
    function overlay(name, box, kind, hole) {
      const E = ctx.el(name, { x: box.x, y: box.y, w: box.w, h: box.h, kind, exit: "recede" });
      const id = "b14clip" + (++uid);
      const defs = Loom.svg("defs", {}, E.inner);
      const cp = Loom.svg("clipPath", { id }, defs);
      if (hole) {
        const hx = hole.x - box.x, hy = hole.y - box.y;
        Loom.svg("path", {
          d: "M0 0 H" + box.w + " V" + box.h + " H0 Z M" + hx + " " + hy + " h" + hole.w + " v" + hole.h + " h" + (-hole.w) + " Z",
          "clip-rule": "evenodd",
        }, cp);
      } else {
        Loom.svg("rect", { x: 0, y: 0, width: box.w, height: box.h }, cp);
      }
      const cg = Loom.svg("g", { "clip-path": "url(#" + id + ")" }, E.inner);
      const sh = Loom.svg("g", { transform: "translate(" + (-box.x) + " " + (-box.y) + ")" }, cg);
      const part = L.desk_set(ctx, sh, {});
      // kit bug: the agenda thumb inside desk_set opens full size (opts.state ignored); rebuild it as a real thumb
      while (part.thumb.firstChild) part.thumb.removeChild(part.thumb.firstChild);
      const ag = L.timed_agenda(ctx, part.thumb, {});
      ag.setState("thumb", ctx.start, 0);
      return { E, part };
    }

    // the window the link lives in (canvas px): from under the note text to the agenda thumb
    const LINK = { x: 740, y: 260, w: 330, h: 160 };

    // 1. the bare desk, nobody at it: held by the next beat
    const desk = ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.desk_set(ctx, desk.inner, { state: "card_space" });
    m.reveal(desk, ctx.start + 0.02, { dy: 0 });

    // 2. cues
    const tPraise = ctx.cue("Praise isn't just being nice");
    const tEmpty = ctx.cue("names nothing to repeat");
    const tSpecific = ctx.cue("specific praise");
    const tKeep = ctx.cue("what to keep");

    // 3. the plain bubble: pops on the monitor, then its empty inside settles it to muted
    const bub = overlay("great_bubble", { x: 170, y: 235, w: 400, h: 270 }, "bubble");
    bub.part.setState("great_bubble", tPraise, 0.8);
    bub.part.setState("specific_note", tEmpty, 0.8);
    m.reveal(bub.E, tPraise, { dy: 0, dur: 0.1 });

    // 4. the specific note: drops beside it in the accent (the link window is cut out of it)
    const note = overlay("specific_note", { x: 680, y: 90, w: 620, h: 420 }, "card", LINK);
    const D = Math.max(1.6, Math.min(3.0, (tKeep - tSpecific) / 0.55));
    note.part.setState("specific_note", tSpecific, D);
    m.reveal(note.E, tSpecific, { dy: 0, dur: 0.1 });

    // 5. the link: its own element, the same part windowed to the line; it is cut out of the note above and
    //    shows with it, and its line draws to the agenda thumb as "what to keep" is said
    const link = overlay("link", LINK, "line");
    link.part.setState("specific_note", tSpecific, D);
    m.reveal(link.E, tSpecific, { dy: 0, dur: 0.1 });
  },
});
