// @design key_gate_transit: a readable card is swept to noise over one key, carried across, and swept back to readable over the matching key
// Treatments sketched: (1) static: card above each key with labels, no motion; (2) card flies through a key drawn on the path (rejected: the key never sits on the path);
// (3) CHOSEN: the card rests above each end's key; a scan sweeps it to noise at the browser, it travels below the path, a scan sweeps it back at the server.
Loom.scene("b11", { build(ctx, props) {
  const svg = (...a) => Loom.svg(...a);
  const c = (t) => ctx.c(t);
  const tMove = ctx.cue("Move three");
  const tScr = ctx.cue("scrambles the login");
  const tGo = ctx.cue("Only the two ends");
  const tUn = ctx.cue("can unscramble");

  // held system: browser, server, path, watcher and step bar carry over untouched
  ["browser", "server", "path", "watcher"].forEach((n) => ctx.held(n));
  const hs = ctx.held("step_bar");

  // step bar: tile 2 done, tile 3 named (a mirror of the held tiles, laid exactly over them)
  const plate = svg("rect", { x: -14, y: -12, width: 1228, height: 114, rx: 26, fill: c("field"), opacity: 0 }, hs.inner);
  const sb = Loom.lesson.step_bar(ctx, hs.inner);
  const tS = ctx.start - 1.2;
  sb.setState("done", tS, 0); sb.setState("named", tS, 1); sb.setState("shown", tS, 2);
  sb.setState("done", tMove, 1); sb.setState("named", tMove, 2);

  // the login packet
  const ORG = [340, 440];
  const S = { x: 530, y: 572 }, EN = { x: 1262, y: 572 };
  const PK = ctx.el("packet", { x: ORG[0], y: ORG[1], w: 1370, h: 290, kind: "token", exit: "recede" });
  // @form login_packet: the one login that crosses, readable then noise then readable
  const pk = Loom.lesson.login_packet(ctx, PK.inner, { origin: ORG, x: S.x - 200 - ORG[0], y: S.y - 119 - ORG[1] });
  const outline = svg("rect", { x: 27, y: 36, width: 346, height: 166, rx: 18, fill: "none", stroke: c("accent"), "stroke-width": 5, opacity: 0 }, pk.root);
  const scan = svg("rect", { x: 31, y: 40, width: 8, height: 158, rx: 4, fill: c("accent"), opacity: 0 }, pk.root);
  const tArr = tUn - 0.1;
  pk.travel(S, EN, tGo, tArr);
  pk.setState("noise", tScr + 0.2);
  pk.setState("plain", tUn + 0.2);
  ctx.m.pop(PK, tMove + 0.45);

  // a halo round each end's held key, lit while the key does its work
  const KL = ctx.el("key_light", { x: 440, y: 630, w: 1170, h: 90, kind: "token", exit: "recede" });
  // @form key_halo: the ring that says this key is working now
  const mkHalo = (x) => svg("rect", { x: x - 10, y: 17 - 10 + 0, width: 144, height: 66, rx: 14, fill: "none", stroke: c("ink"), "stroke-width": 4, opacity: 0 }, KL.inner);
  const haloB = mkHalo(28), haloS = mkHalo(1018);

  const cl = (v) => Math.max(0, Math.min(1, v));
  const sm = (T, a, d) => { const p = cl((T - a) / d); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const T0 = ctx.start, DUR = ctx.end - ctx.start;
  Loom.drive((e) => {
    const T = T0 + e * DUR;
    plate.setAttribute("opacity", sm(T, T0, 0.15).toFixed(3));
    // scramble sweep, then unscramble sweep back
    const p1 = cl((T - tScr) / 0.6), p2 = cl((T - tUn) / 0.6);
    let sx = 0, so = 0;
    if (p1 > 0 && p1 < 1) { sx = 35 + 322 * p1; so = 1; }
    if (p2 > 0 && p2 < 1) { sx = 365 - 330 * p2 - 4; so = 1; }
    scan.setAttribute("x", (sx - 4).toFixed(1)); scan.setAttribute("opacity", so);
    outline.setAttribute("opacity", (sm(T, tScr + 0.3, 0.3) * (1 - sm(T, tUn + 0.2, 0.4))).toFixed(3));
    haloB.setAttribute("opacity", (sm(T, tScr, 0.25) * (1 - sm(T, tGo + 0.4, 0.4))).toFixed(3));
    haloS.setAttribute("opacity", sm(T, tArr, 0.25).toFixed(3));
  }, T0, DUR, "linear");
}});
