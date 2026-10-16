// kit3d: the shared toolkit of Loom's 3D model library (assets/models3d) and of any Three.js scene (D-138).
//
// A Three.js scene gets it as X.kit, and loads a library model with `await X.model(id, opts)`:
//
//   export async function build(ctx, THREE, X) {
//     const st = X.kit.stage(ctx, THREE, X, { light: "studio" });          // scene, camera, lights, env
//     const phone = await X.model("phone", { screen: { kind: "notification", title: ctx.params.title } });
//     st.scene.add(phone.group);
//     return { scene: st.scene, camera: st.camera, update(t) { phone.set("notify", X.kit.progress(t, ctx.cue("a code arrives"), 0.6)); } };
//   }
//
// The laws are the clip laws: a frame is a pure function of t (no Math.random, Date or timers); every colour comes
// from a style token (ctx.c / ctx.hex), so the style and the brand restyle every model; no words are invented: a
// screen or label shows only text passed in opts (an empty screen draws neutral bars).
//
// A model handle: { id, group, parts: {name: Object3D}, size: [w, h, d], set(key, value), keys: [...] }.
// group is centred on x and z and stands on y = 0 (its base); one unit is about 10 cm; set() is idempotent (the
// same value gives the same pose), so update(t) may call it every frame.

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const progress = (t, t0, dur) => clamp((t - t0) / Math.max(1e-6, dur));
export const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
export const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
// the same closed-form spring as Loom.spring (bounce 0 = critically damped)
export function spring(p, bounce = 0.2) {
  p = clamp(p); const z = Math.max(0.05, 1 - bounce), w = Math.log(1000) / z;
  const f = z >= 1 ? (q) => 1 - Math.exp(-w * q) * (1 + w * q)
    : (q) => { const wd = w * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w * q) * (Math.cos(wd * q) + (z * w / wd) * Math.sin(wd * q)); };
  return f(p) + (1 - f(1)) * p;
}

// ---------------------------------------------------------------- colour roles (tokens chosen by the field's tone)
function lum(hex) {
  const h = String(hex || "").replace("#", "").padEnd(6, "8");
  const c = [0, 2, 4].map((i) => { const v = parseInt(h.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
// A role names what a surface IS; the token it gets depends on whether the lesson's field is light or dark, so a
// phone is a dark object on a light page and a lit object on a dark one. opts.colors = {role: "token"} overrides.
export function role(ctx, name, opts) {
  const o = (opts && opts.colors) || {};
  if (o[name]) return o[name];
  const fl = lum(ctx.hex("field")), dark = fl < 0.18;
  const paperTok = lum(ctx.hex("surface")) >= lum(ctx.hex("ink")) ? "surface" : "ink";
  // on a dark field a shell takes the first tone that still separates from the field (cinematic-noir's surface is
  // within 1.25:1 of its field, so a server rack vanished; the reel showed it)
  const sep = (tok) => (Math.max(lum(ctx.hex(tok)), fl) + 0.05) / (Math.min(lum(ctx.hex(tok)), fl) + 0.05);
  const darkShell = ["surface", "line", "muted"].find((t) => sep(t) >= 1.35) || "muted";
  const map = {
    casing: dark ? darkShell : "ink",           // a device's shell
    casing2: dark ? "surface2" : "muted",       // a second shell tone (a base, a bezel)
    paper: paperTok,                            // paper, cards, white goods
    paper2: dark ? "muted" : "surface2",        // a second paper tone (a back sheet, a fold)
    metal: "line",                              // brushed metal, hinges, a shackle
    trim: "muted",                              // small parts: buttons, ports, a lanyard clip
    ink: dark ? "field" : "ink",                // marks printed ON paper (lines on a document)
    text: "ink",                                // words drawn straight on a screen (the screen is field-dark or surface-light)
    screen: dark ? "field" : "surface",         // the lit face of a screen
    ui: "accent", ui2: "accent4", ok: "pos", bad: "neg", warm: "accent2", cool: "accent4",
  };
  return map[name] || name;
}
export const col = (ctx, name, opts) => ctx.c(role(ctx, name, opts));
export const hexOf = (ctx, name, opts) => ctx.hex(role(ctx, name, opts));

// ---------------------------------------------------------------- materials
// kinds: matte, plastic, gloss (clearcoat shell), metal, paper, rubber, glass, glow (emissive)
export function mat(ctx, THREE, name, kind = "matte", opts, extra) {
  const c = col(ctx, name, opts);
  const base = { color: c };
  const K = {
    // diffuse surfaces keep a low specular: at full specular a saturated role colour washes out face-on under the
    // room environment (seen on rack_pdu under clean_bench by the data-centre builder, 2026-10-08)
    matte: { roughness: 0.85, metalness: 0, specularIntensity: 0.3 },
    plastic: { roughness: 0.42, metalness: 0, specularIntensity: 0.55 },
    gloss: { roughness: 0.3, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12 },
    metal: { roughness: 0.32, metalness: 0.85 },
    paper: { roughness: 0.95, metalness: 0, specularIntensity: 0.3 },
    rubber: { roughness: 0.95, metalness: 0, specularIntensity: 0.2 },
    glass: { roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1, clearcoatRoughness: 0.05 },
    glow: { roughness: 0.5, metalness: 0, emissive: c, emissiveIntensity: 0 },
  }[kind] || {};
  return new THREE.MeshPhysicalMaterial(Object.assign(base, K, extra || {}));
}

// ---------------------------------------------------------------- geometry helpers
export function rbox(THREE, X, w, h, d, r = 0.08, seg = 5) {
  return new X.RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
}
export function mesh(THREE, geo, material, cast = true) {
  const m = new THREE.Mesh(geo, material); m.castShadow = cast; m.receiveShadow = true; return m;
}
// a rounded-rectangle THREE.Shape centred on the origin
export function roundRect(THREE, w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
// extrude a shape with a soft bevel, centred on z
export function extrude(THREE, shape, depth, bevel = 0.04, curve = 24) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9,
    bevelSegments: 4, curveSegments: curve });
  g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
}
// a lathe from [[radius, y], ...]
export function lathe(THREE, pts, seg = 48) {
  return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

// ---------------------------------------------------------------- canvas faces (screens, paper, labels)
// A canvas texture redrawn on demand: face.draw((g, W, H) => ...) paints, face.redraw() repaints with the last fn.
export function face(ctx, THREE, W, H) {
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let last = null, lastKey = null;
  return {
    canvas: cv, g, tex, W, H,
    draw(fn, key) {           // key: skip the repaint when nothing changed (draw is the costly part of a frame)
      if (key !== undefined && key === lastKey && last === fn) return;
      last = fn; lastKey = key; g.save(); g.globalAlpha = 1; g.clearRect(0, 0, W, H); fn(g, W, H); g.restore(); tex.needsUpdate = true;
    },
  };
}
export function font(ctx, roleName, px, weight = 600) { return `${weight} ${Math.round(px)}px "${ctx.font(roleName)}"`; }
// fit one line of text into a width (shrinks, never below 60 % of px; then ellipsis)
export function fitText(g, text, maxW, fontFn, px) {
  let s = px; g.font = fontFn(s);
  while (g.measureText(text).width > maxW && s > px * 0.6) { s -= 1; g.font = fontFn(s); }
  if (g.measureText(text).width <= maxW) return text;
  let t = String(text); while (t.length > 1 && g.measureText(t + "...").width > maxW) t = t.slice(0, -1);
  return t + "...";
}
export function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

// Screen UIs drawn from tokens and the words given (never invented). kinds:
//   blank (neutral bars), notification {title, line}, code {title, code}, lock {title}, chat {lines: [[who, text]]},
//   login {title, field1, field2, button}, alert {title, line}, list {title, items: []}, diff {title, lines: [[sign, text]]},
//   terminal {title, lines: [text | [ok|bad, text]]}, link_hover {text, shown, real, alert}, prompt {blocks: [[role, text]]},
//   custom: opts.draw(g, W, H, ui)
// The layouts are designed on a portrait column 100 units wide and at least 92 tall; a landscape screen (laptop,
// monitor) gets that column centred, like a sign-in card on a web page, so nothing runs off the bottom.
export function drawUI(ctx, spec, g, SW, H, opts) {
  spec = spec || {};
  const hx = (n) => hexOf(ctx, n, opts);
  const F = (r, px, w) => font(ctx, r, px, w);
  // code-like kinds use the whole width of a wide screen (a diff or a terminal is read across, not in a card)
  const wide = ["diff", "terminal", "prompt", "link_hover"].includes(spec.kind);
  const u = Math.min(SW, H / 0.92) / 100, W = wide ? SW : 100 * u, X0 = (SW - W) / 2;
  g.fillStyle = hx("screen"); g.fillRect(0, 0, SW, H);
  g.fillStyle = hx("paper2"); g.fillRect(0, 0, SW, 9 * u);                      // status bar, full width
  g.fillStyle = hx("trim"); rr(g, SW / 2 - 9 * u, 3 * u, 18 * u, 2.6 * u, 1.3 * u); g.fill();
  g.save(); g.translate(X0, 0);
  try { drawUIColumn(ctx, spec, g, W, H, u, hx, F); } finally { g.restore(); }
}
function drawUIColumn(ctx, spec, g, W, H, u, hx, F) {
  const k = spec.kind || "blank", pad = 8 * u;
  const text = (s, x, y, px, w, colour, align = "left", maxW = W - 2 * pad, r = "body") => {
    if (!s) return; g.fillStyle = hx(colour); g.textAlign = align; g.textBaseline = "middle";
    g.fillText(fitText(g, String(s), maxW, (q) => F(r, q, w), px), x, y);
  };
  const bars = (y0, n, wk = [0.82, 0.64, 0.74, 0.5]) => { g.fillStyle = hx("paper2"); for (let i = 0; i < n; i++) { rr(g, pad, y0 + i * 9 * u, (W - 2 * pad) * wk[i % wk.length], 4.2 * u, 2 * u); g.fill(); } };
  if (k === "custom" && typeof spec.draw === "function") { spec.draw(g, W, H, { hx, F, text, u }); return; }
  if (k === "blank") { bars(22 * u, 6); return; }
  if (k === "notification" || k === "alert") {
    const c = k === "alert" ? "bad" : "ui";
    bars(H * 0.55, 4);
    g.fillStyle = hx("paper"); rr(g, pad * 0.6, 14 * u, W - 1.2 * pad, 30 * u, 5 * u); g.fill();
    g.fillStyle = hx(c); rr(g, pad * 0.6 + 4 * u, 18 * u, 10 * u, 10 * u, 2.6 * u); g.fill();
    text(spec.title, pad * 0.6 + 18 * u, 22 * u, 6.4 * u, 700, "ink", "left", W - 1.2 * pad - 22 * u, "title");
    text(spec.line, pad * 0.6 + 4 * u, 34 * u, 5 * u, 500, "ink", "left", W - 1.2 * pad - 8 * u);
    return;
  }
  if (k === "code") {
    text(spec.title, W / 2, 26 * u, 6 * u, 600, "text", "center", W - 2 * pad, "title");
    const code = String(spec.code || "");
    const n = Math.max(code.length, 6), cw = (W - 2 * pad) / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = hx("paper2"); rr(g, pad + i * cw + cw * 0.08, 40 * u, cw * 0.84, 22 * u, 3 * u); g.fill();
      if (code[i]) text(code[i], pad + i * cw + cw / 2, 51 * u, Math.min(13 * u, cw * 0.7), 700, "ui", "center", cw, "title");
    }
    bars(H * 0.62, 3);
    return;
  }
  if (k === "lock") {
    g.fillStyle = hx("ui"); g.beginPath(); g.arc(W / 2, H * 0.36, 13 * u, 0, Math.PI * 2); g.fill();
    g.strokeStyle = hx("screen"); g.lineWidth = 2.6 * u; g.beginPath(); g.arc(W / 2, H * 0.345, 4.2 * u, Math.PI, 0); g.stroke();
    g.fillStyle = hx("screen"); rr(g, W / 2 - 6 * u, H * 0.35, 12 * u, 9 * u, 1.6 * u); g.fill();
    text(spec.title, W / 2, H * 0.52, 6.4 * u, 700, "text", "center", W - 2 * pad, "title");
    text(spec.line, W / 2, H * 0.58, 4.8 * u, 500, "text", "center");
    return;
  }
  if (k === "chat") {
    let y = 18 * u;
    for (const [who, s] of (spec.lines || []).slice(0, 5)) {
      const me = who === "me", bw = W * 0.7;
      g.fillStyle = hx(me ? "ui" : "paper2"); rr(g, me ? W - pad * 0.6 - bw : pad * 0.6, y, bw, 16 * u, 4 * u); g.fill();
      text(s, me ? W - pad * 0.6 - bw + 4 * u : pad * 0.6 + 4 * u, y + 8 * u, 4.6 * u, 500, me ? "screen" : "ink", "left", bw - 8 * u);
      y += 20 * u;
    }
    return;
  }
  if (k === "login") {
    text(spec.title, W / 2, 26 * u, 6.6 * u, 700, "text", "center", W - 2 * pad, "title");
    for (const [i, s] of [spec.field1, spec.field2].entries()) {
      g.strokeStyle = hx("trim"); g.lineWidth = 0.8 * u; rr(g, pad, (38 + i * 16) * u, W - 2 * pad, 11 * u, 2.4 * u); g.stroke();
      text(s, pad + 3 * u, (43.5 + i * 16) * u, 4.6 * u, 500, "trim");
    }
    g.fillStyle = hx("ui"); rr(g, pad, 74 * u, W - 2 * pad, 12 * u, 3 * u); g.fill();
    text(spec.button, W / 2, 80 * u, 5 * u, 700, "screen", "center");
    return;
  }
  if (k === "list") {
    text(spec.title, pad, 18 * u, 6.4 * u, 700, "text", "left", W - 2 * pad, "title");
    (spec.items || []).slice(0, 6).forEach((s, i) => {
      g.fillStyle = hx("ui"); g.beginPath(); g.arc(pad + 2 * u, (32 + i * 12) * u, 2 * u, 0, Math.PI * 2); g.fill();
      text(s, pad + 7 * u, (32 + i * 12) * u, 4.8 * u, 500, "text", "left", W - 2 * pad - 7 * u);
    });
    return;
  }
  if (k === "diff") {
    // added and removed lines: [[sign, text]], sign "+" | "-" | " " (words from params; a monospace look in the body face)
    text(spec.title, pad, 16 * u, 5.6 * u, 700, "text", "left", W - 2 * pad, "title");
    (spec.lines || []).slice(0, 9).forEach(([sg, s], i) => {
      const y = (26 + i * 8.4) * u, c = sg === "+" ? "ok" : sg === "-" ? "bad" : null;
      if (c) { g.fillStyle = hx(c); g.globalAlpha = 0.16; g.fillRect(pad * 0.4, y - 3.8 * u, W - pad * 0.8, 7.6 * u); g.globalAlpha = 1; }
      text(sg === " " ? "" : sg, pad * 0.9, y, 4.6 * u, 700, c || "trim", "center", 4 * u);
      text(s, pad + 4 * u, y, 4.2 * u, 500, "text", "left", W - 2 * pad - 4 * u);
    });
    return;
  }
  if (k === "terminal") {
    // a command and its output: lines are strings or [mark, text] with mark "ok" | "bad" (a tick or a cross)
    g.fillStyle = hx("casing"); g.fillRect(-1e4, 9 * u, 2e4, H);
    text(spec.title, pad, 16 * u, 5 * u, 700, "paper", "left", W - 2 * pad, "title");
    (spec.lines || []).slice(0, 10).forEach((ln, i) => {
      const y = (26 + i * 7.6) * u, [mk, s] = Array.isArray(ln) ? ln : [null, ln];
      if (mk === "ok" || mk === "bad") {
        g.strokeStyle = hx(mk); g.lineWidth = 0.9 * u; g.lineCap = "round"; g.beginPath();
        if (mk === "ok") { g.moveTo(pad, y); g.lineTo(pad + 1.3 * u, y + 1.4 * u); g.lineTo(pad + 3.4 * u, y - 1.6 * u); }
        else { g.moveTo(pad, y - 1.5 * u); g.lineTo(pad + 3 * u, y + 1.5 * u); g.moveTo(pad + 3 * u, y - 1.5 * u); g.lineTo(pad, y + 1.5 * u); }
        g.stroke();
      }
      text(s, pad + (mk ? 5 * u : 0), y, 4.1 * u, 500, i === 0 && !mk ? "ui2" : "paper", "left", W - 2 * pad - 5 * u);
    });
    return;
  }
  if (k === "link_hover") {
    // an anchor as shown, and the tooltip with where it really goes (both from params)
    bars(18 * u, 3);
    text(spec.text, pad, 46 * u, 5.4 * u, 600, "ui", "left", W - 2 * pad);
    g.fillStyle = hx("ui"); g.fillRect(pad, 49.5 * u, Math.min(W - 2 * pad, 60 * u), 0.5 * u);
    if (spec.shown) text(spec.shown, pad, 40 * u, 3.6 * u, 500, "trim", "left", W - 2 * pad);
    g.fillStyle = hx("casing"); rr(g, pad + 6 * u, 54 * u, W - 2 * pad - 6 * u, 10 * u, 2 * u); g.fill();
    text(spec.real, pad + 9 * u, 59 * u, 4.2 * u, 600, spec.alert === false ? "paper" : "bad", "left", W - 2 * pad - 12 * u);
    bars(72 * u, 2);
    return;
  }
  if (k === "prompt") {
    // a prompt in blocks: [[role, text]], role "system" | "user" | "context" | "assistant"; labels from params too
    let y = 14 * u;
    for (const [r, s] of (spec.blocks || []).slice(0, 5)) {
      const c = r === "system" ? "ui2" : r === "context" ? "warm" : r === "assistant" ? "ok" : "ui";
      g.fillStyle = hx(c); rr(g, pad * 0.6, y, 1.2 * u, 12 * u, 0.6 * u); g.fill();
      text(r, pad * 0.6 + 3 * u, y + 3 * u, 3.4 * u, 700, c, "left", W - 2 * pad, "title");
      text(s, pad * 0.6 + 3 * u, y + 8.6 * u, 4.2 * u, 500, "text", "left", W - 1.2 * pad - 4 * u);
      y += 16 * u;
    }
    return;
  }
  bars(22 * u, 6);
}

// ---------------------------------------------------------------- shadow, stage, motion
// a soft contact shadow: a radial gradient of the style's shadow token on a plane at y = 0
export function contactShadow(ctx, THREE, w, d, strength = 0.5) {
  const sc = document.createElement("canvas"); sc.width = sc.height = 256;
  const sg = sc.getContext("2d"); const rg = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
  const c = ctx.c("shadow"); const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  rg.addColorStop(0, `rgba(${rgb},${strength})`); rg.addColorStop(0.55, `rgba(${rgb},${strength * 0.35})`); rg.addColorStop(1, `rgba(${rgb},0)`);
  sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(sc);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.002; m.renderOrder = -1; return m;
}

// A lit stage. light: "studio" (key, rim in the cool accent, room env), "soft" (even, for paper and charts),
// "iso" (orthographic true isometric with a sun and soft shadows). frame: [cx, cy, height] the view is fitted to.
export function stage(ctx, THREE, X, o = {}) {
  const scene = new THREE.Scene();
  const light = o.light || "studio";
  const aspect = X.W / X.H;
  const [cx, cy, fh] = o.frame || [0, 1.6, 4.4];
  let camera;
  if (light === "iso") {
    const S = fh / 2;
    camera = new THREE.OrthographicCamera(-S * aspect, S * aspect, S, -S, 0.1, 200);
    const d = 30; camera.position.set(cx + d, cy + d * Math.tan(Math.PI / 180 * 35.264) * Math.SQRT2, d); camera.lookAt(cx, cy, 0);
    X.renderer.shadowMap.enabled = true; X.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.add(new THREE.HemisphereLight(ctx.neutral(), ctx.c(role(ctx, "paper2")), 1.3));
    const sun = new THREE.DirectionalLight(ctx.neutral(), 2.2); sun.position.set(cx + 6, 12, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    Object.assign(sun.shadow.camera, { left: -fh, right: fh, top: fh, bottom: -fh }); sun.shadow.radius = 4; scene.add(sun);
    scene.environment = X.env;
  } else {
    const fov = o.fov || 30;
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    const dist = (fh / 2) / Math.tan((fov / 2) * Math.PI / 180) * (o.pad || 1.08);
    const el = (o.elevation == null ? 12 : o.elevation) * Math.PI / 180;
    camera.position.set(cx, cy + Math.sin(el) * dist, Math.cos(el) * dist); camera.lookAt(cx, cy, 0);
    scene.environment = X.env;
    const key = new THREE.DirectionalLight(ctx.neutral(), light === "soft" ? 1.2 : 1.6); key.position.set(3, 5, 5); scene.add(key);
    if (light === "studio") { const rim = new THREE.DirectionalLight(ctx.c("accent4"), 1.1); rim.position.set(-4, 3, -3); scene.add(rim); }
    scene.add(new THREE.HemisphereLight(ctx.neutral(), ctx.c(role(ctx, "paper2")), light === "soft" ? 0.9 : 0.5));
  }
  const st = { scene, camera, light, mood: null, update() {} };
  if (o.mood) applyMood(ctx, THREE, X, st, o.mood, o);
  return st;
}

// ---------------------------------------------------------------- moods (colour, light and depth presets, D-139)
// A mood re-lights a stage in roles, so it works on light and dark packs alike: the key and rim take tokens (cool,
// warm, bad) mixed with neutral light, and depth haze is fog in the page's own field colour, so far things fade into
// the background rather than into grey. `st.update(t)` animates the moods that move (incident pulses); call it per frame.
export const MOODS = {
  cold_aisle: "cool key from above, cool fill, low haze for depth; warm only on exhaust and alerts (data-centre cold aisle)",
  hot_aisle: "warm key from behind, light haze, a cool rim from the front so silhouettes hold (the hot aisle)",
  machine_night: "very low ambient, a cool rim, deep haze so rows fade into the dark; screens and LEDs carry the light",
  latent_space: "dim ambient, no hard key, haze so far points fade; for spaces that are not places (embeddings, networks)",
  clean_bench: "even neutral key, a neutral rim, no haze: an object examined like a product",
  warm_office: "a warm window key from one side, soft fill, light haze: onboarding, email and everyday work",
  incident: "the key drops by a third and the alert colour pulses as a rim (a failure lands); st.update(t) drives it",
  blueprint_iso: "isometric, flat even light and soft shadows, no haze: systems shown as diagrams",
};
function mixc(THREE, a, b, k) { return a.clone().lerp(b, k); }
function applyMood(ctx, THREE, X, st, mood, o) {
  if (!MOODS[mood]) throw new Error("unknown mood '" + mood + "' (have: " + Object.keys(MOODS).join(", ") + ")");
  const { scene, camera } = st;
  for (const l of scene.children.filter((c) => c.isLight)) scene.remove(l);
  const N = ctx.neutral(), cool = col(ctx, "cool"), warm = col(ctx, "warm"), bad = col(ctx, "bad"), field = ctx.c("field");
  const d = camera.position.length() || 10;
  const add = (light, pos) => { if (pos) light.position.set(...pos); scene.add(light); return light; };
  const hemi = (k) => add(new THREE.HemisphereLight(N, ctx.c(role(ctx, "paper2")), k));
  const fog = (near, far) => { scene.fog = new THREE.Fog(field, d * near, d * far); };
  scene.environmentIntensity = 1;
  if (mood === "cold_aisle") { add(new THREE.DirectionalLight(mixc(THREE, N, cool, 0.45), 1.6), [0, 9, 3]); add(new THREE.DirectionalLight(cool, 0.7), [-5, 2, 4]); hemi(0.45); fog(0.85, 2.4); }
  else if (mood === "hot_aisle") { add(new THREE.DirectionalLight(mixc(THREE, N, warm, 0.55), 1.7), [1, 4, -7]); add(new THREE.DirectionalLight(cool, 0.9), [-4, 3, 5]); hemi(0.4); fog(0.9, 2.6); }
  else if (mood === "machine_night") { add(new THREE.DirectionalLight(N, 0.35), [3, 5, 5]); add(new THREE.DirectionalLight(cool, 1.5), [-5, 3, -4]); hemi(0.12); scene.environmentIntensity = 0.35; fog(0.6, 1.7); }
  else if (mood === "latent_space") { add(new THREE.DirectionalLight(mixc(THREE, N, cool, 0.3), 0.5), [2, 6, 4]); hemi(0.3); scene.environmentIntensity = 0.5; fog(0.75, 1.9); }
  else if (mood === "clean_bench") { add(new THREE.DirectionalLight(N, 1.5), [3, 5, 5]); add(new THREE.DirectionalLight(N, 0.6), [-4, 3, -3]); hemi(0.6); scene.fog = null; }
  else if (mood === "warm_office") { add(new THREE.DirectionalLight(mixc(THREE, N, warm, 0.3), 1.6), [6, 4, 2]); add(new THREE.DirectionalLight(col(ctx, "ui"), 0.5), [-4, 3, -3]); hemi(0.75); fog(1.1, 3.2); }
  else if (mood === "incident") {
    const key = add(new THREE.DirectionalLight(N, 1.05), [3, 5, 5]); const rim = add(new THREE.DirectionalLight(bad, 1.2), [-5, 2.5, 3]); hemi(0.35); fog(0.9, 2.6);
    const at = o.moodAt || 0;
    st.update = (t) => { const k = clamp((t - at) / 0.6); key.intensity = 1.6 - 0.55 * k; rim.intensity = k * (1.6 + 1.0 * (0.5 + 0.5 * Math.cos((t - at) * 4.2))); };
    st.update(0);
  } else if (mood === "blueprint_iso") { add(new THREE.DirectionalLight(N, 0.9), [6, 12, 5]); hemi(1.7); scene.fog = null; }
  st.mood = mood;
}

// ---------------------------------------------------------------- particles, arrows, labels, temperature (D-139)
// cool -> warm along a 0..1 temperature (the colour of air and coolant in data-centre shots)
export function temp(ctx, k) { return col(ctx, "cool").clone().lerp(col(ctx, "warm"), clamp(k)); }

// Particles that travel along polylines (air, coolant, data, energy). A pure function of the phase you pass:
//   const f = flow(ctx, THREE, { paths: [[[x, y, z], ...], ...], count: 40, size: 0.03, from: "cool", to: "warm" });
//   f.set(t * 0.4, 1)    // phase (any real number; it wraps), amount 0..1 (how many particles show)
// `heat: true` colours each particle by how far along its path it is (cool at the start, warm at the end).
export function flow(ctx, THREE, o) {
  const group = new THREE.Group();
  const paths = (o.paths || []).map((p) => p.map((q) => new THREE.Vector3(q[0], q[1], q[2])));
  const lens = paths.map((p) => { const L = [0]; for (let i = 1; i < p.length; i++) L.push(L[i - 1] + p[i].distanceTo(p[i - 1])); return L; });
  const n = o.count == null ? 30 : o.count, geo = new THREE.SphereGeometry(o.size || 0.025, 10, 8), parts = [];
  const from = col(ctx, o.from || "cool"), to = col(ctx, o.to || (o.heat ? "warm" : o.from || "cool"));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: from.clone(), transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false }));
    group.add(m); parts.push(m);
  }
  const at = (pi, u) => {
    const p = paths[pi], L = lens[pi], total = L[L.length - 1], s = u * total;
    let j = 1; while (j < L.length - 1 && L[j] < s) j++;
    const k = (s - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1]);
    return p[j - 1].clone().lerp(p[j], clamp(k));
  };
  return {
    group,
    set(phase, amount = 1) {
      if (!paths.length) { parts.forEach((m) => { m.visible = false; }); return; }
      parts.forEach((m, i) => {
        const pi = i % paths.length, u = ((phase + (i * 0.6180339887) % 1) % 1 + 1) % 1;
        m.position.copy(at(pi, u));
        m.material.color.copy(o.heat ? from.clone().lerp(to, u) : from);
        const show = i < Math.round(n * clamp(amount));
        m.visible = show; m.material.opacity = show ? 0.9 * Math.min(1, u * 8, (1 - u) * 8) : 0;
      });
    },
  };
}

// a solid arrow from a to b (shaft and head), in a role
export function arrow3d(ctx, THREE, a, b, o = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), dir = B.clone().sub(A), len = dir.length();
  const r = o.r || 0.03, head = Math.min(len * 0.35, r * 5), g = new THREE.Group();
  const m = mat(ctx, THREE, o.role || "ui", "plastic", o);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len - head, 16), m); shaft.position.y = (len - head) / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 2.4, head, 20), m); tip.position.y = len - head / 2;
  g.add(shaft, tip); g.position.copy(A); g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return g;
}

// A word plate: text drawn on a plane in the style's face (words only from the caller). h = plate height in units.
// o.bg: a role for the plate (omit for a transparent plate), o.role: the text role, o.billboard: face the camera.
export function label(ctx, THREE, text, o = {}) {
  const px = 96, padX = o.bg ? 36 : 6;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = font(ctx, o.font || "body", px, o.weight || 700);
  const W = Math.ceil(probe.measureText(String(text || "")).width + padX * 2), H = Math.round(px * 1.5);
  const f = face(ctx, THREE, Math.max(8, W), H);
  f.draw((g, w, h) => {
    if (o.bg) { g.fillStyle = hexOf(ctx, o.bg, o); rr(g, 0, 0, w, h, h * 0.28); g.fill(); }
    if (!text) return;
    // on a plate the words take the role that reads on that plate ("ink" is the role printed on paper); bare, "text"
    g.fillStyle = hexOf(ctx, o.role || (o.bg ? (o.bg === "paper" || o.bg === "paper2" ? "ink" : "paper") : "text"), o); g.textBaseline = "middle"; g.textAlign = "center";
    g.font = font(ctx, o.font || "body", px, o.weight || 700); g.fillText(String(text), w / 2, h / 2 + 4);
  });
  const h = o.h || 0.18, w = h * f.W / f.H;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: f.tex, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
  m.userData.width = w; m.renderOrder = 2;
  if (o.billboard) m.onBeforeRender = (r, sc, cam) => { m.quaternion.copy(cam.quaternion); if (m.parent) m.quaternion.premultiply(m.parent.getWorldQuaternion(new THREE.Quaternion()).invert()); };
  return m;
}
// true on a dark page (the lesson's field is dark): pick floors, walls and plates that read on it
export function isDark(ctx) { return lum(ctx.hex("field")) < 0.18; }

// An object arrives on a spring: from below and turned, settling at its home transform. Call every frame.
export function arrive(obj, t, at, o = {}) {
  const k = spring((t - at) / (o.dur || 1.2), o.bounce == null ? 0.18 : o.bounce);
  obj.userData.home = obj.userData.home || { y: obj.position.y, ry: obj.rotation.y, s: obj.scale.x };
  const h = obj.userData.home;
  obj.position.y = h.y + (1 - k) * (o.drop == null ? -1.2 : o.drop);
  obj.rotation.y = h.ry + (1 - k) * (o.turn == null ? -1.4 : o.turn);
  const s = h.s * (0.8 + 0.2 * k) * (t < at ? 0 : 1); obj.scale.set(s, s, s);
  return k;
}
// a slow idle sway (a pure function of t), so a held object still reads as 3D
// With arrive(): call arrive first, then sway; sway then ADDS to the pose arrive set this frame. Alone, sway keeps its
// own base (the rotation before its first call), so a frame never depends on which time was rendered first.
export function sway(obj, t, o = {}) {
  const off = (o.amp == null ? 0.22 : o.amp) * Math.sin(t * (o.speed || 0.5) + (o.phase || 0));
  if (obj.userData.home) { obj.rotation.y += off; return; }
  obj.userData.swayHome = obj.userData.swayHome == null ? obj.rotation.y : obj.userData.swayHome;
  obj.rotation.y = obj.userData.swayHome + off;
}
// a model scaled so its height is h units (returns the scale)
export function fitHeight(handle, h) { const s = h / handle.size[1]; handle.group.scale.setScalar(s); return s; }
