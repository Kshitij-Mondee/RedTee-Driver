/* MFA-LIB-START */
/* Loom.mfa: the drawings this lesson's story is made of (shared by every beat; defined here because b01 loads first).
 *  M.signin(ctx, name, o)   a real-looking sign-in page in a browser window: address bar, states swapped by hard cuts
 *  M.phone(ctx, name, o)    a phone with screens: dark, code, prompt, passkey, signed
 *  M.laptop / M.monitor     the device frames around a screen rect
 *  M.thief(ctx, name, o)    an ordinary person seen from behind (never a hooded hacker; brief must_avoid)
 *  M.split(ctx, sfx)        the split frame: Maya's side (warm) and the other desk (cool), with their name labels
 * Every state change is a hard cut with a 0.16 s crossfade (a page changing is a cut, not a slide). Text sizes stay at
 * or above the pack floors (label 24, body 30, lead 34) so a phone viewer can read the screens.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  if (Loom.mfa) return;
  const M = (Loom.mfa = {});
  const svg = (...a) => Loom.svg(...a);
  const S = () => Loom.style;
  const c = (t) => S().c(t);
  const mix = (a, b, k) => S().mix(c(a), c(b), k);
  const B = () => (Loom.ctxBeat && Loom.ctxBeat.id) || "mfa";
  M.REAL = "login.yourwork.example";
  M.FAKE = ["login.yourwork", "-help", ".example"];   // the look-alike: one inserted word
  M.CODE = "482913";
  const XF = 0.16;   // the crossfade of a hard cut

  /** show one child group of a set at t (hard cut with a short crossfade); returns t */
  function stateMachine(groups, first) {
    let cur = first;
    // hidden states are visibility:hidden as well as transparent (autoAlpha), so layout and overlap checks do not read
    // the stacked states as text printed over text (check, 2026-10-06)
    for (const k in groups) { groups[k].setAttribute("opacity", k === first ? 1 : 0); groups[k].style.visibility = k === first ? "inherit" : "hidden"; }
    return function (name, t) {
      if (!groups[name]) { Loom.error("mfa_state", `unknown state ${name}`); return t; }
      if (name === cur) return t;
      const a = groups[cur], b = groups[name];
      Loom.tween(a, { autoAlpha: 1 }, { autoAlpha: 0, duration: XF, ease: "none" }, t, { kind: "state", beat: B(), name: "state.out", content: true });
      Loom.tween(b, { autoAlpha: 0 }, { autoAlpha: 1, duration: XF, ease: "none" }, t, { kind: "state", beat: B(), name: "state.in", content: true });
      cur = name;
      return t + XF;
    };
  }
  const on = (node, t) => { node.setAttribute("opacity", 0); Loom.set(node, { opacity: 1 }, t); };
  const off = (node, t) => Loom.set(node, { opacity: 0 }, t);

  /** text segments laid end to end at one size (the address bar): returns [{x, w, node}] */
  function segments(kit, g, parts, o) {
    let x = o.x;
    const out = [];
    for (const p of parts) {
      const F = kit.fit(p.text, { role: o.role || "label", w: 2000, h: o.h, maxLines: 1, size: o.size, weight: p.weight || o.weight });
      const node = kit.text(g, p.text, { role: o.role || "label", size: o.size, x, y: o.y, w: F.width + 4, h: o.h, valign: "middle", maxLines: 1, weight: p.weight || o.weight, color: p.color || "ink" });
      out.push({ x, w: F.width, node });
      x += F.width;
    }
    return out;
  }

  /* ------------------------------------------------------------------ the sign-in page */
  M.signin = function (ctx, name, o) {
    const { kit } = ctx;
    const W = o.w || 840, H = o.h || 520, BAR = 66;
    const E = ctx.el(name, { x: o.x, y: o.y, w: W, h: H, kind: "ui", exit: o.exit || "recede", parent: o.parent });
    const g = E.inner;
    // @form browser_signin: a browser window with an address bar over a plain sign-in page whose states cut
    svg("rect", { x: 0, y: 0, width: W, height: H, rx: 14, fill: c("surface"), stroke: mix("surface2", "line", 0.3), "stroke-width": 2 }, g);
    svg("path", { d: `M0 14 Q0 0 14 0 H${W - 14} Q${W} 0 ${W} 14 V${BAR} H0 Z`, fill: c("surface2") }, g);
    ["neg", "accent2", "pos"].forEach((tk, i) => svg("circle", { cx: 26 + i * 22, cy: BAR / 2, r: 7, fill: mix(tk, "surface2", 0.35) }, g));
    const pill = { x: 104, y: 12, w: W - 128, h: BAR - 24 };
    svg("rect", { x: pill.x, y: pill.y, width: pill.w, height: pill.h, rx: pill.h / 2, fill: c("surface"), stroke: mix("surface2", "line", 0.35), "stroke-width": 1.5 }, g);
    kit.icon(g, "lock", { x: pill.x + 26, y: pill.y + pill.h / 2, size: 22, color: "muted" });
    const parts = o.fake ? [{ text: M.FAKE[0] }, { text: M.FAKE[1], color: o.markFake ? "neg" : "ink" }, { text: M.FAKE[2] }] : [{ text: M.REAL }];
    const seg = segments(kit, g, parts, { x: pill.x + 50, y: pill.y, h: pill.h, size: 24 });
    E.addr = { x: pill.x, y: pill.y, w: pill.w, h: pill.h, seg, fake: !!o.fake };

    const body = svg("g", {}, g);
    const P = 64, FW = W - 2 * P;
    // the site's own name (an invented, generic service)
    const brand = svg("g", {}, body);
    svg("rect", { x: P, y: BAR + 26, width: 34, height: 34, rx: 9, fill: c("accent") }, brand);
    kit.text(brand, "YourWork", { role: "label", size: 26, x: P + 46, y: BAR + 22, w: 260, h: 42, valign: "middle", maxLines: 1, weight: 700, color: "ink" });

    const groups = {};
    const field = (gg, y, label, h) => {
      svg("rect", { x: P, y, width: FW, height: h || 62, rx: 10, fill: c("field"), stroke: mix("surface2", "line", 0.45), "stroke-width": 2 }, gg);
      if (label) kit.text(gg, label, { role: "label", size: 24, x: P + 20, y, w: FW - 40, h: h || 62, valign: "middle", maxLines: 1, color: "muted" });
    };
    const button = (gg, y, label, w, tone) => {
      const bw = w || 260;
      const b = svg("g", {}, gg);
      svg("rect", { x: P, y, width: bw, height: 62, rx: 12, fill: c(tone || "accent") }, b);
      kit.text(b, label, { role: "label", size: 26, x: P, y, w: bw, h: 62, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
      return b;
    };
    const Y0 = BAR + 92;

    // password state: title, email, password dots, button
    const pw = (groups.password = svg("g", {}, body));
    kit.text(pw, "Sign in", { role: "lead", size: 40, x: P, y: Y0, w: FW, h: 52, maxLines: 1, weight: 700, color: "ink" });
    field(pw, Y0 + 66);
    kit.text(pw, "maya@yourwork.example", { role: "body", size: 30, x: P + 20, y: Y0 + 66, w: FW - 40, h: 62, valign: "middle", maxLines: 1, color: "ink" });
    field(pw, Y0 + 144);
    const dots = [];
    for (let i = 0; i < 10; i++) { const d = svg("circle", { cx: P + 34 + i * 26, cy: Y0 + 144 + 31, r: 8, fill: c("ink"), opacity: 0 }, pw); dots.push(d); }
    const pwBtn = button(pw, Y0 + 230, "Sign in");
    E.pwBtn = pwBtn;

    // code state: six boxes
    const cd = (groups.code = svg("g", {}, body));
    kit.text(cd, "Enter the code", { role: "lead", size: 40, x: P, y: Y0, w: FW, h: 52, maxLines: 1, weight: 700, color: "ink" });
    kit.text(cd, "We sent a code to your phone", { role: "body", size: 30, x: P, y: Y0 + 56, w: FW, h: 44, maxLines: 1, color: "muted" });
    const bw = 84, gap = 16, digits = [];
    const caret = svg("rect", { x: P + 18, y: Y0 + 136, width: 4, height: 50, fill: c("accent"), opacity: 0 }, cd);
    for (let i = 0; i < 6; i++) {
      const x = P + i * (bw + gap) + (i >= 3 ? 18 : 0);
      svg("rect", { x, y: Y0 + 122, width: bw, height: 78, rx: 10, fill: c("field"), stroke: mix("surface2", "line", 0.45), "stroke-width": 2 }, cd);
      const dg = kit.text(cd, M.CODE[i], { role: "lead", size: 42, x, y: Y0 + 122, w: bw, h: 78, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      dg.setAttribute("opacity", 0);
      digits.push(dg);
    }
    E.codeCaret = caret;
    const cdBtn = button(cd, Y0 + 232, "Verify");

    // welcome state
    const wl = (groups.welcome = svg("g", {}, body));
    svg("circle", { cx: W / 2, cy: Y0 + 70, r: 46, fill: c("pos") }, wl);
    kit.path(wl, `M${W / 2 - 20} ${Y0 + 70} l14 15 l28 -30`, { stroke: "surface", sw: 9 });
    kit.text(wl, "Welcome, Maya", { role: "title", size: 62, x: P, y: Y0 + 130, w: FW, h: 84, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    kit.text(wl, "Your work account", { role: "body", size: 30, x: P, y: Y0 + 214, w: FW, h: 44, align: "center", maxLines: 1, color: "muted" });

    // passkey state: a single button, then a wait line
    const pk = (groups.passkey = svg("g", {}, body));
    kit.text(pk, "Sign in", { role: "lead", size: 40, x: P, y: Y0, w: FW, h: 52, maxLines: 1, weight: 700, color: "ink" });
    field(pk, Y0 + 66);
    kit.text(pk, "maya@yourwork.example", { role: "body", size: 30, x: P + 20, y: Y0 + 66, w: FW - 40, h: 62, valign: "middle", maxLines: 1, color: "ink" });
    const pkBtn = button(pk, Y0 + 156, "Sign in with a passkey", 420);
    kit.icon(pkBtn, "key-round", { x: P + 40, y: Y0 + 156 + 31, size: 26, color: "onAccent" });
    E.pkBtn = pkBtn;

    // waiting state: the page waits on something (the phone, or the person)
    const wt = (groups.wait = svg("g", {}, body));
    kit.icon(wt, "smartphone", { x: W / 2, y: Y0 + 66, size: 76, color: "accent" });
    const waitT = kit.text(wt, o.waitText || "Check your phone", { role: "lead", size: 40, x: P, y: Y0 + 128, w: FW, h: 56, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    void waitT;
    const wdots = [0, 1, 2].map((i) => svg("circle", { cx: W / 2 - 30 + i * 30, cy: Y0 + 222, r: 9, fill: c("muted") }, wt));

    // denied state
    const dn = (groups.denied = svg("g", {}, body));
    svg("circle", { cx: W / 2, cy: Y0 + 70, r: 46, fill: c("neg") }, dn);
    kit.path(dn, `M${W / 2 - 18} ${Y0 + 52} l36 36 M${W / 2 + 18} ${Y0 + 52} l-36 36`, { stroke: "surface", sw: 9 });
    kit.text(dn, "Sign-in denied", { role: "title", size: 62, x: P, y: Y0 + 130, w: FW, h: 84, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });

    const go = stateMachine(groups, o.state || "password");
    E.state = go;
    E.H = H; E.W = W; E.Y0 = Y0; E.P = P;
    /** password dots typed one by one from t0 (about 11 a second); returns the end */
    E.typePw = (t0, rate) => { const r = rate || 0.09; dots.forEach((d, i) => Loom.set(d, { opacity: 1 }, t0 + i * r)); Loom.sfx("click", t0); return t0 + dots.length * r; };
    E.clearPw = (t) => dots.forEach((d) => off(d, t));
    /** code digits typed one by one; returns the end */
    E.typeCode = (t0, rate) => { const r = rate || 0.16; on(caret, t0 - 0.3); off(caret, t0); digits.forEach((d, i) => Loom.set(d, { opacity: 1 }, t0 + i * r)); return t0 + 6 * r; };
    E.caretOn = (t) => { Loom.set(caret, { opacity: 1 }, t); };
    E.clearCode = (t) => digits.forEach((d) => off(d, t));
    /** the code boxes wait with a blinking caret from t0 to t1 (period-locked, 1 Hz) */
    E.codeWait = (t0, t1) => { for (let t = t0; t < t1; t += 1) { Loom.set(caret, { opacity: 1 }, t); Loom.set(caret, { opacity: 0 }, Math.min(t + 0.5, t1)); } };
    /** a button press: a short dip in scale */
    E.press = (btn, t) => {
      Loom.tween(btn, { scale: 1, transformOrigin: "50% 50%" }, { scale: 0.95, duration: 0.08, ease: "power2.out" }, t, { kind: "press", beat: B(), name: name + ".press" });
      Loom.tween(btn, { scale: 0.95, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.16, ease: "power2.out" }, t + 0.08, { kind: "press", beat: B(), name: name + ".press" });
      Loom.sfx("click", t);
    };
    /** the wait dots pulse in turn from t0 to t1 (period-locked) */
    E.waitDots = (t0, t1) => Loom.drive((e, raw) => { const T = raw * (t1 - t0); wdots.forEach((d, i) => d.setAttribute("opacity", (0.3 + 0.7 * Math.max(0, Math.sin(6.283 * (T / 1.2 - i / 3)))).toFixed(2))); }, t0, Math.max(0.1, t1 - t0), "linear", { kind: "ambient", beat: B(), name: name + ".wait" });
    E.groups = groups; E.dots = dots; E.digits = digits; E.pwBtnY = Y0 + 230; E.cdBtn = cdBtn;
    return E;
  };

  /* ------------------------------------------------------------------ device frames */
  /** a laptop: screen rect (sx, sy, sw, sh) in the parent's coords; the frame sits around it */
  M.laptop = function (ctx, name, s, o) {
    o = o || {};
    const pad = 22, base = 34;
    const E = ctx.el(name, { x: s.x - pad, y: s.y - pad, w: s.w + 2 * pad, h: s.h + 2 * pad + base, kind: "scenery", exit: o.exit || "recede", parent: o.parent });
    // @form laptop_frame: a laptop seen straight on, a dark bezel round the screen and a thin base below
    svg("rect", { x: 0, y: 0, width: s.w + 2 * pad, height: s.h + 2 * pad, rx: 22, fill: c("ink") }, E.inner);
    svg("rect", { x: pad - 6, y: pad - 6, width: s.w + 12, height: s.h + 12, rx: 10, fill: mix("ink", "line", 0.25) }, E.inner);
    svg("path", { d: `M-40 ${s.h + 2 * pad} H${s.w + 2 * pad + 40} L${s.w + 2 * pad + 18} ${s.h + 2 * pad + base} H-18 Z`, fill: mix("surface2", "line", 0.35) }, E.inner);
    svg("rect", { x: (s.w + 2 * pad) / 2 - 70, y: s.h + 2 * pad, width: 140, height: 9, rx: 4, fill: c("line"), opacity: 0.6 }, E.inner);
    return E;
  };
  /** a desktop monitor on a stand */
  M.monitor = function (ctx, name, s, o) {
    o = o || {};
    const pad = 18, stand = 70;
    const E = ctx.el(name, { x: s.x - pad, y: s.y - pad, w: s.w + 2 * pad, h: s.h + 2 * pad + stand, kind: "scenery", exit: o.exit || "recede", parent: o.parent });
    // @form monitor_frame: a desktop monitor seen straight on, bezel, neck and foot
    const W = s.w + 2 * pad;
    svg("rect", { x: W / 2 - 34, y: s.h + 2 * pad - 4, width: 68, height: stand - 10, fill: mix("ink", "line", 0.35) }, E.inner);
    svg("rect", { x: W / 2 - 150, y: s.h + 2 * pad + stand - 18, width: 300, height: 18, rx: 6, fill: mix("ink", "line", 0.35) }, E.inner);
    svg("rect", { x: 0, y: 0, width: W, height: s.h + 2 * pad, rx: 14, fill: c("ink") }, E.inner);
    svg("rect", { x: pad - 5, y: pad - 5, width: s.w + 10, height: s.h + 10, rx: 8, fill: mix("ink", "line", 0.25) }, E.inner);
    return E;
  };

  /* ------------------------------------------------------------------ the phone */
  M.phone = function (ctx, name, o) {
    const { kit } = ctx;
    const W = o.w || 300, H = o.h || 600, R = W * 0.15, IN = W * 0.045;
    const E = ctx.el(name, { x: o.x, y: o.y, w: W, h: H, kind: "object", exit: o.exit || "recede", parent: o.parent });
    // @form phone_screens: a phone seen straight on whose screen cuts between a few real states
    const wrap = svg("g", {}, E.inner);
    E.wrap = wrap;
    svg("rect", { x: 0, y: 0, width: W, height: H, rx: R, fill: c("ink") }, wrap);
    const sx = IN, sy = IN, sw = W - 2 * IN, sh = H - 2 * IN;
    svg("rect", { x: sx, y: sy, width: sw, height: sh, rx: R - IN, fill: mix("ink", "line", 0.18) }, wrap);
    const k = W / 300;   // everything inside scales with the phone
    const scr = svg("g", { transform: `translate(${sx} ${sy}) scale(${k.toFixed(4)})` }, wrap);
    const SW = sw / k, SH = sh / k;
    svg("rect", { x: SW / 2 - 40, y: 14, width: 80, height: 18, rx: 9, fill: c("ink") }, scr);   // the notch
    const groups = {};
    groups.dark = svg("g", {}, scr);
    const lit = (gg) => svg("rect", { x: 0, y: 0, width: SW, height: SH, rx: (R - IN) / k, fill: mix("accent", "surface", 0.82) }, gg);
    const card = (gg, y, h) => svg("rect", { x: 14, y, width: SW - 28, height: h, rx: 18, fill: c("surface") }, gg);

    const cd = (groups.code = svg("g", {}, scr));
    lit(cd);
    if (k < 0.8) {
      // a small phone: only the code, large enough to read at its size (the labels were 14 px on screen)
      card(cd, 170, 150);
      kit.text(cd, "482 913", { role: "lead", size: 42, x: 34, y: 190, w: SW - 68, h: 110, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    } else {
      card(cd, 150, 210);
      kit.text(cd, "YourWork", { role: "label", size: 26, x: 30, y: 162, w: SW - 60, h: 34, maxLines: 1, weight: 700, color: "muted" });
      kit.text(cd, "Your sign-in code", { role: "label", size: 26, x: 30, y: 198, w: SW - 60, h: 34, maxLines: 1, color: "ink" });
      kit.text(cd, "482 913", { role: "lead", size: 42, x: 30, y: 250, w: SW - 60, h: 70, valign: "middle", maxLines: 1, weight: 700, color: "ink", tracking: 2 });
    }

    const pr = (groups.prompt = svg("g", {}, scr));
    lit(pr); card(pr, 120, 316);
    kit.text(pr, "YourWork", { role: "label", size: 24, x: 30, y: 136, w: SW - 60, h: 34, maxLines: 1, weight: 700, color: "muted" });
    kit.text(pr, "Is this you signing in?", { role: "body", size: 30, x: 30, y: 172, w: SW - 60, h: 96, maxLines: 2, weight: 700, color: "ink" });
    const deny = svg("g", {}, pr), appr = svg("g", {}, pr), BW = SW - 60;
    svg("rect", { x: 30, y: 290, width: BW, height: 58, rx: 12, fill: c("accent") }, appr);
    kit.text(appr, "Approve", { role: "label", size: 26, x: 30, y: 290, w: BW, h: 58, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
    svg("rect", { x: 30, y: 358, width: BW, height: 58, rx: 12, fill: c("surface"), stroke: c("neg"), "stroke-width": 3 }, deny);
    kit.text(deny, "Deny", { role: "label", size: 26, x: 30, y: 358, w: BW, h: 58, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "neg" });
    E.deny = deny; E.approve = appr;

    const pk = (groups.passkey = svg("g", {}, scr));
    lit(pk); card(pk, 110, 330);
    kit.icon(pk, "fingerprint", { x: SW / 2, y: 200, size: 96, color: "accent" });
    kit.text(pk, "Use your passkey", { role: "label", size: 28, x: 22, y: 262, w: SW - 44, h: 44, align: "center", maxLines: 1, weight: 700, color: "ink" });
    kit.text(pk, "for YourWork", { role: "label", size: 24, x: 22, y: 310, w: SW - 44, h: 36, align: "center", maxLines: 1, color: "muted" });
    E.fpY = 200;

    const sg = (groups.signed = svg("g", {}, scr));
    lit(sg); card(sg, 150, 230);
    svg("circle", { cx: SW / 2, cy: 230, r: 40, fill: c("pos") }, sg);
    kit.path(sg, `M${SW / 2 - 17} 230 l12 13 l24 -26`, { stroke: "surface", sw: 8 });
    kit.text(sg, "Signed in", { role: "body", size: 30, x: 30, y: 290, w: SW - 60, h: 44, align: "center", maxLines: 1, weight: 700, color: "ink" });

    E.state = stateMachine(groups, o.state || "dark");
    E.SW = SW; E.SH = SH; E.k = k; E.scr = scr; E.sx = sx; E.sy = sy;
    /** a buzz: three small rotations of the phone, 0.45 s */
    E.buzz = (t) => {
      Loom.drive((e, raw) => wrap.setAttribute("transform", `rotate(${(3 * Math.sin(raw * 6.283 * 4) * (1 - raw)).toFixed(2)} ${W / 2} ${H / 2})`), t, 0.45, "linear", { kind: "buzz", beat: B(), name: name + ".buzz" });
      Loom.sfx("tick", t);
    };
    return E;
  };

  /* ------------------------------------------------------------------ the other person, from behind */
  M.thief = function (ctx, name, o) {
    const s = o.scale || 1;
    const E = ctx.el(name, { x: o.x, y: o.y, w: 260 * s, h: 330 * s, kind: "character", exit: o.exit || "recede", parent: o.parent });
    // @form figure_from_behind: an unnamed person drawn from behind in muted tokens (back of head, neck, shoulders)
    const g = svg("g", { transform: `scale(${s})` }, E.inner);
    const jacket = mix("ink", "line", 0.35), hair = mix("ink", "muted", 0.15);
    const skin = S().mix(S().pack.characters.skin[2], c("field"), 0.25);
    svg("path", { d: "M8 206 C8 136 42 116 90 108 L170 108 C218 116 252 136 252 206 L240 330 L20 330 Z", fill: jacket }, g);
    svg("path", { d: "M92 108 Q130 140 168 108 L160 100 Q130 118 100 100 Z", fill: mix("ink", "line", 0.55) }, g);
    svg("rect", { x: 108, y: 80, width: 44, height: 34, rx: 12, fill: skin }, g);
    svg("ellipse", { cx: 130, cy: 50, rx: 50, ry: 56, fill: hair }, g);
    svg("ellipse", { cx: 80, cy: 58, rx: 8, ry: 13, fill: skin }, g);
    svg("ellipse", { cx: 180, cy: 58, rx: 8, ry: 13, fill: skin }, g);
    svg("path", { d: "M84 80 Q130 100 176 80 Q170 104 130 106 Q90 104 84 80 Z", fill: c("ink"), opacity: 0.25 }, g);
    return E;
  };

  /** Maya's face in a round frame (the rig, cropped): the story's lead is present wherever her screen is */
  M.portrait = function (ctx, name, o) {
    const r = o.r || 46;
    const E = ctx.el(name, { x: o.x - r, y: o.y - r, w: 2 * r, h: 2 * r, kind: "character", exit: o.exit || "recede", parent: o.parent });
    // @form round_portrait: a character's head and shoulders cropped into a circle, a name tag for a screen
    const id = Loom.uid("mfapt");
    const defs = svg("defs", {}, E.inner);
    svg("circle", { cx: r, cy: r, r }, svg("clipPath", { id }, defs));
    svg("circle", { cx: r, cy: r, r, fill: mix("accent", "surface", 0.8) }, E.inner);
    const holder = svg("g", { "clip-path": `url(#${id})` }, E.inner);
    const sc = (o.scale || 0.2) * r / 46;
    // the literal below tells compose to embed the rig: ctx.character("maya", "maya")
    const ch = ctx.character(name + "_rig", "maya", { x: r, y: r + 1430 * sc, scale: sc, pose: "idle", parent: holder });
    svg("circle", { cx: r, cy: r, r, fill: "none", stroke: c("accent"), "stroke-width": 4 }, E.inner);
    E.rig = ch;
    return E;
  };

  /* ------------------------------------------------------------------ the split frame */
  /** two panels with their labels; returns {L, R, E: [elements]} with each side's screen rect */
  M.split = function (ctx, sfx, o) {
    o = o || {};
    const { kit } = ctx;
    const els = [];
    const bg = ctx.el("split_bg" + sfx, { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    // @form split_desks: the frame cut in two, a warm side for Maya and a cooler side for the other desk
    svg("rect", { x: 0, y: 0, width: 960, height: 1080, fill: c("field") }, bg.inner);
    svg("rect", { x: 960, y: 0, width: 960, height: 1080, fill: mix("field", "line", 0.2) }, bg.inner);
    svg("rect", { x: 0, y: 760, width: 960, height: 320, fill: mix("field", "accent2", 0.1) }, bg.inner);     // Maya's desk top
    svg("rect", { x: 960, y: 760, width: 960, height: 320, fill: mix("field", "ink", 0.22) }, bg.inner);      // the other desk
    svg("rect", { x: 956, y: 0, width: 8, height: 1080, fill: c("surface") }, bg.inner);
    els.push(bg);
    const lab = (nm, x, text, tone) => {
      const E = ctx.el(nm + sfx, { x, y: 30, w: 760, h: 50, kind: "label", exit: "recede" });
      if (tone !== "none") svg("circle", { cx: 14, cy: 25, r: 9, fill: c(tone) }, E.inner);
      kit.text(E.inner, text, { role: "label", size: 28, x: 34, y: 0, w: 700, h: 50, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
      els.push(E);
      return E;
    };
    const L = lab("label_maya", 92, "Maya", "none");
    const pt = M.portrait(ctx, "portrait_maya" + sfx, { x: 66, y: 58, r: 46 });
    els.push(pt);
    const R = lab("label_other", 1030, o.rightLabel || "Someone else, far away", "line");
    return { bg, labL: L, labR: R, L: { x: 70, y: 150, w: 820, h: 520 }, R: { x: 1030, y: 130, w: 820, h: 520 } };
  };


  /** Maya's office: the place washed back, Maya behind her desk (laptop lid toward us), her screen as a large inset.
   *  Builds elements named office, wash, maya, desk, laptop_back, link_line, tag_maya, screen_maya_office. */
  M.officeShot = function (ctx, sfx, o) {
    const { kit, m } = ctx;
    o = o || {};
    Loom.place.office(ctx, "office" + sfx, { side: "right" });
    const wash = ctx.el("wash" + sfx, { x: -200, y: -200, w: 2320, h: 1480, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 2320, height: 1480, fill: c("field"), opacity: 0.55 }, wash.inner);
    // ctx.character("maya", "maya")
    const maya = ctx.character("maya" + sfx, "maya", { x: 470, y: 1030, scale: 0.47, pose: "type" });
    maya.emotion("focus", 0);
    if (o.tMaya != null) maya.gesture("nod", o.tMaya + 0.1, o.tMaya + 1.1);
    // @form desk_front: a plain desk seen from the front, its panel hiding the person behind it below the chest
    const desk = ctx.el("desk" + sfx, { x: 90, y: 760, w: 780, h: 320, kind: "object", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 780, height: 30, rx: 6, fill: mix("surface2", "line", 0.25) }, desk.inner);
    svg("rect", { x: 20, y: 30, width: 740, height: 290, fill: mix("surface2", "line", 0.12) }, desk.inner);
    svg("rect", { x: 20, y: 30, width: 740, height: 12, fill: c("shadow"), opacity: 0.1 }, desk.inner);
    // @form laptop_back: the back of an open laptop lid on a desk, seen from the front
    const lap = ctx.el("laptop_back" + sfx, { x: 330, y: 600, w: 290, h: 170, kind: "object", exit: "recede" });
    svg("path", { d: "M10 0 H280 L290 160 H0 Z", fill: mix("line", "surface2", 0.35) }, lap.inner);
    svg("rect", { x: -14, y: 158, width: 318, height: 12, rx: 4, fill: c("line") }, lap.inner);
    svg("circle", { cx: 145, cy: 78, r: 16, fill: c("surface"), opacity: 0.55 }, lap.inner);
    // her screen, large beside her, joined to the laptop
    const S0 = o.screen || { x: 1010, y: 190, w: 840, h: 520 };
    const ln = ctx.el("link_line" + sfx, { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
    const lp = kit.path(ln.inner, `M630 640 C 800 640 860 ${S0.y + S0.h / 2} ${S0.x - 8} ${S0.y + S0.h / 2}`, { stroke: "line", sw: 3 });
    lp.setAttribute("stroke-dasharray", "2 10");
    const si = M.signin(ctx, "screen_maya_office" + sfx, Object.assign({}, S0, { state: o.state || "password" }));
    if (o.tScreen != null) { m.reveal(si, o.tScreen, { dy: 16 }); m.reveal(ln, o.tScreen, { dy: 0 }); }
    if (o.tMaya != null) Loom.data.tag(ctx, "tag_maya" + sfx, { x: 380, y: 210, text: "Maya", color: "accent", t: o.tMaya + 0.2 });
    return { maya, si };
  };

  /* ------------------------------------------------------------------ small shared pieces */
  /** hold every named element from earlier beats on this station: {name: E} */
  M.hold = function (ctx, names) { const H = {}; for (const n of names) H[n] = ctx.held(n); return H; };
  /** a pill chip that can travel (a thing passed from one desk to another) */
  M.chip = function (ctx, name, text, o) {
    const { kit } = ctx;
    o = o || {};
    const role = (o.size || 30) > 30 ? "lead" : "label";
    const F = kit.fit(text, { role, w: 600, maxLines: 1, weight: 700, size: o.size || 30 });
    const w = Math.ceil(F.width) + 48, h = Math.round(F.height) + 26;
    const E = ctx.el(name, { x: 0, y: 0, w, h, kind: "token", exit: o.exit || "recede" });
    // @form travel_chip: a pill carrying one thing (a password, a code) from one screen to another
    svg("rect", { x: 3, y: 5, width: w, height: h, rx: h / 2, fill: c("shadow"), opacity: 0.12 }, E.inner);
    svg("rect", { x: 0, y: 0, width: w, height: h, rx: h / 2, fill: c(o.fill || "surface"), stroke: c(o.stroke || "accent"), "stroke-width": 3 }, E.inner);
    kit.text(E.inner, text, { role, size: o.size || 30, x: 0, y: 0, w, h, align: "center", valign: "middle", maxLines: 1, weight: 700, color: o.color || "ink", tracking: o.tracking });
    E.cw = w; E.ch = h;
    E.mover.setAttribute("opacity", 0);
    return E;
  };
  /** move a chip along an arc from a to b (centres), visible from t to arrival + hold; returns the arrival time */
  M.fly = function (E, t, dur, a, b, o) {
    o = o || {};
    const lift = o.lift == null ? 160 : o.lift, keep = o.keep || 0.35, B0 = B();
    const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - lift;
    const at = (u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * mx + u * u * b[0], v * v * a[1] + 2 * v * u * my + u * u * b[1]]; };
    Loom.set(E.mover, { opacity: 1 }, t);
    Loom.drive((e) => { const p = at(e); E.mover.setAttribute("transform", `translate(${(p[0] - E.cw / 2).toFixed(1)} ${(p[1] - E.ch / 2).toFixed(1)})`); },
      t, dur, "move", { kind: "travel", beat: B0, name: E.name, content: true });
    // a hard cut out on landing: a fromTo here would be the first opacity tween on the mover and GSAP would render its
    // from-state (visible) at load, which put both relay chips on screen from b08 on (seen 2026-10-06)
    Loom.set(E.mover, { opacity: 0 }, t + dur + keep);
    Loom.sfx("whoosh", t);
    return t + dur;
  };
  /** a soft veil over one half of the split (the side that is not the subject right now) */
  M.veil = function (ctx, name, side) {
    const E = ctx.el(name, { x: side === "R" ? 964 : 0, y: 0, w: 956, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: E.w, height: 1080, fill: c("field"), opacity: 0.62 }, E.inner);
    E.mover.setAttribute("opacity", 0);
    E.on = (t) => Loom.tween(E.mover, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: Loom.ease.move }, t, { kind: "recolour", beat: B(), name, key: name + ".v" });
    E.off = (t) => Loom.tween(E.mover, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: Loom.ease.move }, t, { kind: "recolour", beat: B(), name, key: name + ".v" });
    return E;
  };
  /** an outline drawn round a box (a ring that points at something) */
  M.ring = function (ctx, name, box, t, o) {
    o = o || {};
    const pad = o.pad == null ? 12 : o.pad;
    const E = ctx.el(name, { x: box.x - pad, y: box.y - pad, w: box.w + 2 * pad, h: box.h + 2 * pad, kind: "mark", exit: "recede", parent: o.parent });
    const p = ctx.kit.path(E.inner, `M${o.r || 14} 0 H${E.w - (o.r || 14)} Q${E.w} 0 ${E.w} ${o.r || 14} V${E.h - (o.r || 14)} Q${E.w} ${E.h} ${E.w - (o.r || 14)} ${E.h} H${o.r || 14} Q0 ${E.h} 0 ${E.h - (o.r || 14)} V${o.r || 14} Q0 0 ${o.r || 14} 0 Z`, { stroke: o.tone || "accent2", sw: o.sw || 5 });
    Loom.motion.draw(p, t, { dur: o.dur || 0.6 });
    return E;
  };
  /** the names every split beat holds */
  M.splitNames = (sfx) => ["split_bg" + sfx, "label_maya" + sfx, "portrait_maya" + sfx, "portrait_maya" + sfx + "_rig", "label_other" + sfx];
})();
/* MFA-LIB-END */

// @design screen_beside_person: a person at her desk in a real place, and what she sees shown large beside her
/* b01 - Say this is Maya. Her everyday sign-in, on her screen, large.
 * Treatments considered: (A) a title card "MFA" (rejected: a definition before a picture); (B) the screen alone, full
 * frame (rejected: no person, no stakes); (C) CHOSEN: Maya at her desk in the office, the laptop lid toward us, and her
 * screen beside her as a large inset joined to the laptop by a line, so the viewer reads what she reads. The inset is
 * the same page that becomes the left half of the split in b02.
 * Beat sheet: "Say this is Maya" Maya and her tag; the inset settles | "she types her password" the dots type, the
 * button is pressed | "her work account opens" the page cuts to Welcome, Maya; she smiles.
 */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, M = Loom.mfa, svg = Loom.svg;
    const tMaya = ctx.cue("Say this is Maya");
    const tTypes = ctx.cue("she types her password");
    const tOpens = ctx.cue("her work account opens");
    const O = M.officeShot(ctx, "", { tMaya, tScreen: tMaya + 0.7 });
    const si = O.si;
    const t1 = si.typePw(tTypes + 0.5, 0.1);
    si.press(si.pwBtn, t1 + 0.2);
    si.state("welcome", tOpens + 0.25);
    Loom.sfx("tick", tOpens + 0.3);
    O.maya.emotion("smile", tOpens + 0.4);
  },
});
