// @design request_path_sheet: a system drawn as one drafting sheet: wide lines for the parts, narrow lines for a dimension, dashes for the path not taken yet; cyan only on the part the narration names
// @lab {"title": "blueprint example: a request's path through a load balancer, drawn as a sheet", "styles": ["blueprint"], "dur": 17.0, "fx": {}, "times": [2.4, 4.6, 7.4, 9.6, 12.8, 16.2], "words": [{"w": "Say", "s": 0.5, "e": 0.87}, {"w": "a", "s": 0.91, "e": 1.22}, {"w": "request", "s": 1.26, "e": 1.75}, {"w": "reaches", "s": 1.79, "e": 2.28}, {"w": "the", "s": 2.32, "e": 2.69}, {"w": "load", "s": 2.73, "e": 3.13}, {"w": "balancer", "s": 3.17, "e": 3.69}, {"w": "It", "s": 4.03, "e": 4.37}, {"w": "sends", "s": 4.41, "e": 4.84}, {"w": "it", "s": 4.88, "e": 5.22}, {"w": "to", "s": 5.26, "e": 5.6}, {"w": "server", "s": 5.64, "e": 6.1}, {"w": "A", "s": 6.14, "e": 6.45}, {"w": "which", "s": 6.79, "e": 7.22}, {"w": "answers", "s": 7.26, "e": 7.75}, {"w": "in", "s": 7.79, "e": 8.13}, {"w": "about", "s": 8.17, "e": 8.6}, {"w": "120", "s": 8.64, "e": 9.01}, {"w": "milliseconds", "s": 9.05, "e": 9.69}, {"w": "If", "s": 10.03, "e": 10.37}, {"w": "A", "s": 10.41, "e": 10.72}, {"w": "stops", "s": 10.76, "e": 11.19}, {"w": "answering", "s": 11.23, "e": 11.78}, {"w": "the", "s": 12.12, "e": 12.49}, {"w": "balancer", "s": 12.53, "e": 13.05}, {"w": "sends", "s": 13.09, "e": 13.52}, {"w": "the", "s": 13.56, "e": 13.93}, {"w": "next", "s": 13.97, "e": 14.37}, {"w": "request", "s": 14.41, "e": 14.9}, {"w": "to", "s": 14.94, "e": 15.28}, {"w": "B", "s": 15.32, "e": 15.63}, {"w": "instead", "s": 15.67, "e": 16.16}], "_timing": "estimated from the narration at about 180 wpm (no TTS run); a composed lesson uses the real word timings"}
/* Style example for blueprint (docs/styles/guides/blueprint.md, recipe R1). Not a lesson beat: a model of the register
 * for scene authors and API scene workers. Written for this narration (a hypothetical case, so no facts to ground):
 *   "Say a request reaches the load balancer. It sends it to server A, which answers in about 120 milliseconds. If A
 *    stops answering, the balancer sends the next request to B instead."
 * What it shows, per the guide:
 *   - the drafting hierarchy: parts are wide outlines (kit.rect on surface, the pack's 2.5 px), the dimension and its
 *     extension lines are narrow (1.25 px), the path not taken is dashed (s4);
 *   - one cyan, placed: the part the narration names is the only cyan outline at a time (s2);
 *   - amber is for measures only (the dimension's figure) (s2);
 *   - labels are annotations: mono, inside the part they name or on a leader (s3, s4);
 *   - motion: lines draw on, a part's outline before its words; the request is a token that travels (s7).
 * Real APIs only: ctx.el, kit.rect, kit.text, kit.line, kit.arrow, kit.disc, m.draw, m.reveal, m.travel, ctx.cue,
 * Loom.treat.label (docs/SCENE_API.md; runtime/kit.js, motion.js, treat.js).
 */
Loom.scene("style_blueprint_request_path", {
  build(ctx) {
    const { kit, m } = ctx;
    const tReach = ctx.cue("reaches the load balancer");
    const tA = ctx.cue("sends it to server A");
    const tMs = ctx.cue("about 120 milliseconds");
    const tStop = ctx.cue("stops answering");
    const tB = ctx.cue("to B instead");
    const draw = ctx.style.dur("draw");

    // a part: a wide outline on the sheet, its name inside in mono (the label role), outline first, words after
    const part = (name, x, y, w, h, words, t, fill) => {
      const E = ctx.el(name, { x, y, w, h, kind: "card" });
      E.box = kit.rect(E.inner, 0, 0, w, h, { fill: fill || "surface", r: 4 });
      E.words = kit.text(E.inner, words, { role: "label", x: 18, y: 0, w: w - 36, h, align: "center", valign: "middle", maxLines: 2 });
      m.draw(E.box, t, { dur: draw });
      Loom.tween(E.words, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t + draw * 0.7, { kind: "reveal", beat: ctx.beat.id, name });
      m.reveal(E, t, { dy: 0, dur: 0.01 });
      // its highlight: a second outline in a colour, over the part's own, faded in and out (a colour tween on the part's
      // shape changes its group, not the outline: seen in this example's first strip)
      E.mark = (tone) => Loom.svg("rect", { x: -3, y: -3, width: w + 6, height: h + 6, rx: 6, fill: "none", stroke: Loom.style.c(tone), "stroke-width": 3, opacity: 0 }, E.inner);
      return E;
    };
    const client = part("client", 160, 420, 240, 120, "client", tReach - 0.9);
    const lb = part("balancer", 620, 400, 300, 160, "load balancer", tReach);
    const srvA = part("server_a", 1220, 250, 300, 140, "server A", tA - 0.3);
    const srvB = part("server_b", 1220, 600, 300, 140, "server B", tA - 0.1);

    // connectors: wide enough to read, drawn into what follows; the path to B is dashed (not taken yet)
    const link = (name, x1, y1, x2, y2, t, dash) => {
      const E = ctx.el(name, { x: Math.min(x1, x2) - 20, y: Math.min(y1, y2) - 20, w: Math.abs(x2 - x1) + 40, h: Math.abs(y2 - y1) + 40, kind: "connector" });
      const ox = Math.min(x1, x2) - 20, oy = Math.min(y1, y2) - 20;
      if (dash) { const L = kit.line(E.inner, x1 - ox, y1 - oy, x2 - ox, y2 - oy, { stroke: "muted", sw: 2, dash: "12 9" }); m.draw(L, t, { dur: draw }); }
      else m.draw(kit.arrow(E.inner, x1 - ox, y1 - oy, x2 - ox, y2 - oy, { stroke: "line", sw: 2.5 }), t, { dur: draw });
      m.reveal(E, t, { dy: 0, dur: 0.01 });
      return E;
    };
    link("link_client_lb", 400, 480, 612, 480, tReach + 0.2);
    link("link_lb_a", 920, 450, 1212, 330, tA);
    const toB = link("link_lb_b", 920, 510, 1212, 660, tA + 0.2, true);

    // the named part is the one cyan outline at a time: the balancer when it is named, then server A
    const on = (H, t, name) => Loom.tween(H, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t, { kind: "emphasis", beat: ctx.beat.id, name });
    const off = (H, t, name) => Loom.tween(H, { opacity: 1 }, { opacity: 0, duration: 0.3 }, t, { kind: "emphasis", beat: ctx.beat.id, name });
    const lbC = lb.mark("accent"), aC = srvA.mark("accent"), aR = srvA.mark("accent3"), bC = srvB.mark("accent");
    on(lbC, tReach + 0.4, "balancer"); off(lbC, tA, "balancer"); on(aC, tA + 0.1, "server_a");

    // a dimension: extension lines, a narrow dimension line with ticks, the figure in amber (a measure)
    const dim = ctx.el("dim_latency", { x: 1220, y: 150, w: 300, h: 90, kind: "label" });
    const ext = [kit.line(dim.inner, 0, 40, 0, 96, { stroke: "muted", sw: 1.25 }), kit.line(dim.inner, 300, 40, 300, 96, { stroke: "muted", sw: 1.25 })];
    const dl = kit.line(dim.inner, 0, 52, 300, 52, { stroke: "muted", sw: 1.25 });
    const ticks = [kit.line(dim.inner, -7, 59, 7, 45, { stroke: "muted", sw: 1.25 }), kit.line(dim.inner, 293, 59, 307, 45, { stroke: "muted", sw: 1.25 })];
    const fig = kit.text(dim.inner, "120 ms", { role: "label", x: 60, y: 0, w: 180, h: 40, align: "center", valign: "middle", color: "accent2", maxLines: 1 });
    m.reveal(dim, tMs - 0.2, { dy: 0, dur: 0.01 });
    [...ext, dl, ...ticks].forEach((L, i) => m.draw(L, tMs - 0.2 + i * 0.05, { dur: 0.5 }));
    Loom.tween(fig, { opacity: 0 }, { opacity: 1, duration: 0.3 }, tMs + 0.3, { kind: "reveal", beat: ctx.beat.id, name: "dim_latency" });

    // the request: a small token that travels the path (the change over time is the point)
    const tok = ctx.el("request", { x: 380, y: 466, w: 28, h: 28, kind: "token" });
    kit.disc(tok.inner, 14, 14, 11, { fill: "accent2" });
    m.reveal(tok, tReach - 0.3, { dy: 0 });
    m.travel(tok, tReach + 0.3, { x: 220, y: 0, dur: 0.9 });
    Loom.tween(tok.inner, { opacity: 1 }, { opacity: 0, duration: 0.25 }, tReach + 1.15, { kind: "exit", beat: ctx.beat.id, name: "request" });   // it arrives, then it is gone: never parked on the balancer's name

    // A stops: its outline goes coral and a note on a leader says so; the dashed path to B becomes the path
    off(aC, tStop, "server_a"); on(aR, tStop, "server_a");
    Loom.treat.label(ctx, "note_no_answer", { x: 1370, y: 450, text: "no answer", to: [1370, 392], tone: "accent3", t: tStop + 0.2 });
    const bPath = ctx.el("link_lb_b_live", { x: 900, y: 490, w: 332, h: 190, kind: "connector" });
    m.draw(kit.arrow(bPath.inner, 20, 20, 312, 170, { stroke: "accent", sw: 2.5 }), tB - 0.2, { dur: draw });
    m.reveal(bPath, tB - 0.2, { dy: 0, dur: 0.01 });
    Loom.tween(toB.inner, { opacity: 1 }, { opacity: 0, duration: 0.3 }, tB, { kind: "exit", beat: ctx.beat.id, name: "link_lb_b" });
    on(bC, tB + 0.3, "server_b");
  },
});
