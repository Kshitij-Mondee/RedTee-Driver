// @design reasoning_drawn_in_speech_order: a board that accumulates, each part drawn by marker as it is named, one accent circle on the line that matters
// @lab {"title": "whiteboard example: a shift handover drawn in speech order (one marker colour on the line that matters)", "styles": ["whiteboard"], "dur": 16.2, "times": [2.0, 4.0, 6.1, 8.1, 10.1, 12.1, 14.2], "words": [{"w": "Say", "s": 0.4, "e": 0.61}, {"w": "you", "s": 0.65, "e": 0.86}, {"w": "hand", "s": 0.9, "e": 1.14}, {"w": "over", "s": 1.18, "e": 1.42}, {"w": "an", "s": 1.46, "e": 1.64}, {"w": "open", "s": 1.68, "e": 1.92}, {"w": "ticket", "s": 1.96, "e": 2.26}, {"w": "at", "s": 2.3, "e": 2.48}, {"w": "six", "s": 2.52, "e": 2.73}, {"w": "Write", "s": 3.02, "e": 3.29}, {"w": "what", "s": 3.33, "e": 3.57}, {"w": "is", "s": 3.61, "e": 3.79}, {"w": "done", "s": 3.83, "e": 4.07}, {"w": "Then", "s": 4.36, "e": 4.6}, {"w": "what", "s": 4.64, "e": 4.88}, {"w": "is", "s": 4.92, "e": 5.1}, {"w": "still", "s": 5.14, "e": 5.41}, {"w": "open", "s": 5.45, "e": 5.69}, {"w": "Then", "s": 5.98, "e": 6.22}, {"w": "who", "s": 6.26, "e": 6.47}, {"w": "owns", "s": 6.51, "e": 6.75}, {"w": "it", "s": 6.79, "e": 6.97}, {"w": "now", "s": 7.01, "e": 7.22}, {"w": "That", "s": 7.51, "e": 7.75}, {"w": "last", "s": 7.79, "e": 8.03}, {"w": "line", "s": 8.07, "e": 8.31}, {"w": "is", "s": 8.35, "e": 8.53}, {"w": "the", "s": 8.57, "e": 8.78}, {"w": "one", "s": 8.82, "e": 9.03}, {"w": "people", "s": 9.07, "e": 9.37}, {"w": "skip", "s": 9.41, "e": 9.65}, {"w": "so", "s": 9.79, "e": 9.97}, {"w": "circle", "s": 10.01, "e": 10.31}, {"w": "it", "s": 10.35, "e": 10.53}, {"w": "Now", "s": 10.82, "e": 11.03}, {"w": "the", "s": 11.07, "e": 11.28}, {"w": "handover", "s": 11.32, "e": 11.68}, {"w": "holds", "s": 11.72, "e": 11.99}, {"w": "overnight", "s": 12.03, "e": 12.42}, {"w": "and", "s": 12.56, "e": 12.77}, {"w": "nobody", "s": 12.81, "e": 13.11}, {"w": "has", "s": 13.15, "e": 13.36}, {"w": "to", "s": 13.4, "e": 13.58}, {"w": "guess", "s": 13.62, "e": 13.89}, {"w": "in", "s": 13.93, "e": 14.11}, {"w": "the", "s": 14.15, "e": 14.36}, {"w": "morning", "s": 14.4, "e": 14.73}], "_timing": "estimated from the narration at about 180 wpm (no TTS run); a composed lesson uses the real word timings"}
/* Example scene for the WHITEBOARD style (docs/styles/guides/whiteboard.md, section 11). Workplace topic: a
 * shift handover. Written for this narration (one beat, about 15 s):
 *
 *   "Say you hand over an open ticket at six. Write what is done. Then what is still open. Then who owns it
 *    now. That last line is the one people skip, so circle it. Now the handover holds overnight, and nobody
 *    has to guess in the morning."
 *
 * What it shows (the style's rules, each one in use):
 *  - the board ACCUMULATES: nothing is replaced or removed; every new part is added beside what is there;
 *  - every part is drawn ON the word that names it, in the order a person would draw it: connector, then the
 *    box, then the words (outline first, never hatch first);
 *  - ink for everything, ONE marker colour (accent) for the one thing the narration stresses, muted for a note;
 *  - single-stroke rough lines (pack shape.sketch), hand arrows with open heads (no crisp kit.arrow);
 *  - draw durations scale with stroke length from the pack's motion.draw, text is written left to right
 *    (m.unmask) at a pace set by its length;
 *  - the person is a designed kit (Open Peeps bust, kit.peep), placed, never built from shapes;
 *  - the last reveal lands before 85 % of the speech, so the board rests while the sentence finishes.
 * Treatments considered: (A) list.steps template (rejected: a slide on a board, rows fade in, no causal link
 * from the ticket to the lines), (B) three cards in a row (rejected: no accumulation, no "circle the one that
 * matters" move), (C) CHOSEN: the reasoning drawn as spoken, with one circle.
 */
Loom.scene("style_whiteboard_handover", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");                                   // the pack's base draw time (whiteboard: 0.9 s)
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);   // longer strokes take longer, within limits
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    // a hand arrow in its OWN element whose box is the arrow's true bounds (end points, control point and head, plus
    // 12 px for the rough wobble; a quadratic stays inside its hull): one shaft and an OPEN head of two strokes, drawn
    // shaft first, then the head. A full-frame connector box misleads every layout and camera check (guide s11d).
    const arrowEl = (name, x1, y1, x2, y2, bend, o) => {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
      const a = Math.atan2(y2 - cy, x2 - cx), hs = 22;
      const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)], h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
      const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], P = 12;
      const bx = Math.floor(Math.min(...xs) - P), by = Math.floor(Math.min(...ys) - P);
      const E = ctx.el(name, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + P) - bx, h: Math.ceil(Math.max(...ys) + P) - by, kind: "connector", exit: "recede" });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`, o);
      hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`, o);
      return { E, len: L * 1.1 };
    };

    // ---- 1. the title is written first, as the speech starts (the board's heading)
    const T0 = ctx.speechStart + 0.1;
    const title = ctx.el("title", { x: 120, y: 96, w: 1100, h: 116, kind: "text", exit: "wipe" });
    kit.text(title.inner, "A handover that holds", { role: "title", x: 0, y: 0, w: 1100, h: 116, maxLines: 1 });
    m.unmask(title, T0, { dur: writeDur("A handover that holds") });

    // ---- 2. the person handing over: a designed bust over a drawn desk line
    const desk = ctx.el("desk", { x: 110, y: 560, w: 420, h: 20, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M0 10 L420 8");
    m.draw(desk, T0 + 0.3, { dur: drawDur(420) });
    // the bust is 340 px tall (y 0..340 in its box), so the box ends at y 570: ON the desk line, not below it
    const person = ctx.el("person", { x: 140, y: 230, w: 360, h: 340, kind: "character", exit: "recede" });
    kit.peep(person.inner, "woman", "explaining", { x: 180, y: 170, size: 340 });
    m.reveal(person, T0 + 0.45, { dy: 0 });

    // ---- 3. "an open ticket": the ticket is drawn under her (outline, then its icon, then its words)
    const tTicket = ctx.cue("open ticket");
    // one element per stroke group: m.draw splits its time by path LENGTH, and an icon's lengths are in its own
    // 24-unit grid, so an icon drawn in the same call as a box would get almost no time
    const ticket = ctx.el("ticket", { x: 140, y: 650, w: 380, h: 150, kind: "card", exit: "recede" });
    kit.sketch(ticket.inner, "rectangle", [0, 0, 380, 150], { fill: "none" });
    const dTicket = Math.min(0.6, drawDur(1060)), tBoxAt = tTicket - 0.35;   // the container leads its words
    m.draw(ticket, tBoxAt, { dur: dTicket });
    const tIcon = ctx.el("ticket_icon", { x: 140, y: 650, w: 124, h: 150, kind: "icon", exit: "recede" });
    kit.icon(tIcon.inner, "ticket", { x: 62, y: 75, size: 64, stroke: 24 * 3.6 / 64 });   // icon line = the pack's 3.6 px marker
    const tIconAt = tBoxAt + dTicket;
    m.draw(tIcon, tIconAt, { dur: drawDur(220) });
    const tWords = ctx.el("ticket_words", { x: 250, y: 666, w: 250, h: 120, kind: "text", exit: "wipe" });
    kit.text(tWords.inner, "Open at 6 pm", { role: "lead", x: 0, y: 0, w: 250, h: 120, maxLines: 2, valign: "middle" });
    m.unmask(tWords, tIconAt + drawDur(220) * 0.7, { dur: writeDur("Open at 6 pm") });

    // ---- 4. the three lines, each drawn ON its words: connector from the ticket, then the box, then the words
    const rows = [
      { key: "done", text: "What is done", y: 290, t: ctx.cue("what is done"), tick: true },
      { key: "open", text: "What is still open", y: 465, t: ctx.cue("still open") },
      { key: "owner", text: "Who owns it now", y: 640, t: ctx.cue("who owns it now") },
    ];
    const RX = 790, RW = 700, RH = 130, BOX = 76;
    // timing: the connector LEADS its words (starts 0.35 s before the cue) so the words are being written within
    // about 0.4 s of being spoken; a reveal that trails its word by a second reads as the board lagging the voice
    rows.forEach((r) => {
      const A = arrowEl("link_" + r.key, 530, 725, RX - 18, r.y + RH / 2, r.key === "open" ? 0 : (r.key === "done" ? -40 : 30));
      const dA = Math.min(0.45, drawDur(A.len)), tA = r.t - 0.35;
      m.draw(A.E, tA, { dur: dA });
      // the row element holds the box and its tick only (its true box); the words are their own element beside it
      const row = ctx.el("row_" + r.key, { x: RX, y: r.y, w: BOX + 20, h: RH, kind: "row", exit: "recede" });
      kit.sketch(row.inner, "rectangle", [0, (RH - BOX) / 2, BOX, BOX], { fill: "none" });
      if (r.tick) hand(row.inner, `M16 ${RH / 2} L32 ${RH / 2 + 18} L62 ${RH / 2 - 22}`, { sw: 5 });   // box first, tick last
      const dB = drawDur(r.tick ? 420 : 304);
      m.draw(row, tA + dA, { dur: dB });
      const words = ctx.el("row_" + r.key + "_words", { x: RX + 112, y: r.y, w: RW - 112, h: RH, kind: "text", exit: "wipe" });
      kit.text(words.inner, r.text, { role: "lead", x: 0, y: 0, w: RW - 112, h: RH, maxLines: 1, valign: "middle" });
      m.unmask(words, tA + dA + dB * 0.6, { dur: writeDur(r.text) });
    });

    // ---- 5. "the one people skip": a muted note, written under the third line
    const tSkip = ctx.cue("people skip");
    const note = ctx.el("skip_note", { x: RX + 112, y: 800, w: 520, h: 56, kind: "label", exit: "wipe" });
    kit.text(note.inner, "the line people skip", { role: "label", x: 0, y: 0, w: 520, h: 56, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(note, tSkip, { dur: writeDur("the line people skip") });

    // ---- 6. "circle it": the ONE accent of the scene, a marker loop that overshoots its start like a hand
    const tCircle = ctx.cue("circle it");
    const cx = RX + 330, cy = 640 + RH / 2, rx = 400, ry = 92, k = 0.5523;   // station coordinates of the loop's centre
    // the element's box is the loop's true bounds (it rises to 1.16 ry at the overshoot) plus 12 px; the path is drawn
    // in the element's local coordinates (lx, ly = the centre inside the box)
    const cbx = cx - rx - 12, cby = Math.floor(cy - ry * 1.16 - 12);
    const lx = cx - cbx, ly = cy - cby;
    // starts at the top and overshoots past its start along the top edge, away from the arrows that come in on the
    // left and go out on the right (an overshoot that crosses a connector reads as a scribble)
    const loop = `M${lx} ${ly - ry}` +
      ` C${lx + k * rx} ${ly - ry} ${lx + rx} ${ly - k * ry} ${lx + rx} ${ly}` +
      ` C${lx + rx} ${ly + k * ry} ${lx + k * rx} ${ly + ry} ${lx} ${ly + ry}` +
      ` C${lx - k * rx} ${ly + ry} ${lx - rx} ${ly + k * ry} ${lx - rx} ${ly}` +
      ` C${lx - rx} ${ly - k * ry} ${lx - k * rx} ${ly - ry * 1.06} ${lx} ${ly - ry * 1.06}` +
      ` C${lx + rx * 0.2} ${ly - ry * 1.06} ${lx + rx * 0.4} ${ly - ry * 1.12} ${lx + rx * 0.5} ${ly - ry * 1.16}`;
    const circle = ctx.el("owner_circle", { x: cbx, y: cby, w: 2 * rx + 24, h: Math.ceil(cy + ry + 12) - cby, kind: "mark", exit: "recede" });
    hand(circle.inner, loop, { stroke: "accent", sw: 5 });
    m.draw(circle, tCircle, { dur: drawDur(2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) });

    // ---- 7. "holds overnight": the consequence, drawn out of the circle (arrow, then the moon, then the words)
    const tHolds = ctx.cue("holds overnight");
    const O = arrowEl("holds_link", cx + rx + 16, cy - 20, 1690, 500, -30);
    const dOut = Math.min(0.45, drawDur(O.len)), tOut = tHolds - 0.35;
    m.draw(O.E, tOut, { dur: dOut });
    // 1520 + 300 = 1820: inside the safe box's right edge (x 1824); it was 1530 + 320 = 1850
    const holds = ctx.el("holds_words", { x: 1520, y: 410, w: 300, h: 70, kind: "text", exit: "wipe" });
    kit.text(holds.inner, "Holds overnight", { role: "lead", x: 0, y: 0, w: 300, h: 70, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(holds, tOut + dOut, { dur: writeDur("Holds overnight") });
    const moon = ctx.el("moon", { x: 1600, y: 290, w: 180, h: 120, kind: "icon", exit: "recede" });
    kit.icon(moon.inner, "moon", { x: 90, y: 60, size: 96, stroke: 24 * 3.6 / 96 });
    m.draw(moon, tOut + dOut + writeDur("Holds overnight") * 0.8, { dur: drawDur(300) });   // the picture after the words: the words carry it
  },
});
