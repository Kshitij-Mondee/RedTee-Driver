/* Loom fx (D-52): a WebGL shader layer, the part of a "high-end" look that SVG cannot draw.
 *
 * Two screen-space canvases sit in the stage: BACKGROUND (under the world: a living field of light, drawn
 * from the palette) and TOP (over the world, under captions and chrome: film grain, vignette, light
 * leaks, and timed MOMENTS - a light sweep across a payoff, a spotlight that dims everything except the
 * thing being taught). Everything is a pure function of (time, camera, palette):
 *   - drawn from Loom.clock, which the timeline drives on every seek; no rAF, no wall clock;
 *   - grain is a hash of the FRAME INDEX, so it animates like film and is identical on every render;
 *   - colours are the style's tokens (a brand re-colours the shader too);
 *   - the background stays within a small luminance band around the field token, so the contrast the
 *     style lint proved for text on "field" still holds (and HyperFrames' pixel contrast check backs it).
 * Config: style pack `fx` merged with storyboard `fx` (per lesson) and scene `fx` moments.
 */
// @capability fx_moments | fx | ctx.fxMoment("light" or "spotlight", t0, t1, rect); storyboard scene fx | Expressive motion | a light sweep across a payoff, or a spotlight that dims everything but one region; the pack's grain, vignette and paper
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const FX = (Loom.fx = { layers: [], moments: [], enabled: false });

  const VS = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
  // shared GLSL: deterministic hash / value noise / fbm (no textures, no randomness)
  const LIB = `
precision highp float;
uniform float u_t; uniform vec2 u_res; uniform vec3 u_cam; uniform float u_frame; uniform float u_k; uniform float u_drift;
uniform vec3 c_field; uniform vec3 c_field2; uniform vec3 c_a; uniform vec3 c_b; uniform vec3 c_c; uniform vec3 c_ink;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return v; }
float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
// keep a colour near the field's luminance: text contrast proven on the field token must still hold
vec3 band(vec3 c, float maxd){ float d = lum(c) - lum(c_field); return c - clamp(d - clamp(d, -maxd, maxd), -1.0, 1.0) * vec3(1.0); }
vec2 world(vec2 frag){ vec2 px = vec2(frag.x, u_res.y - frag.y) * (1920.0 / u_res.x); return (px - u_cam.xy) / max(u_cam.z, 0.0001); }
`;
  const BG = {
    // flowing ribbons of light (aurora): fbm-warped bands between field, accent and accent2
    aurora: `void main(){ vec2 w = world(gl_FragCoord.xy) * 0.0009; vec2 uv = gl_FragCoord.xy / u_res;
      float t = u_t * 0.05; vec2 q = vec2(fbm(w + t), fbm(w + vec2(5.2, 1.3) - t));
      float n = fbm(w * 1.6 + 2.0 * q + t);
      vec3 col = mix(c_field, c_field2, smoothstep(0.2, 0.9, uv.y + 0.25 * q.x));
      col = mix(col, c_a, 0.5 * u_k * smoothstep(0.45, 0.85, n));
      col = mix(col, c_b, 0.4 * u_k * smoothstep(0.5, 0.95, q.y));
      gl_FragColor = vec4(band(col, 0.07), 1.0); }`,
    // an animated mesh gradient: four colour points drifting on slow orbits, inverse-distance blended
    mesh: `void main(){ vec2 uv = gl_FragCoord.xy / u_res; uv.x *= u_res.x / u_res.y; float t = u_t * 0.06;
      vec2 P0 = vec2(0.3 + 0.12 * sin(t), 0.3 + 0.1 * cos(t * 1.3)), P1 = vec2(1.45 + 0.1 * cos(t * 0.8), 0.25 + 0.12 * sin(t * 1.1));
      vec2 P2 = vec2(0.45 + 0.15 * cos(t * 1.2), 0.85 + 0.08 * sin(t)), P3 = vec2(1.35 + 0.12 * sin(t * 0.7), 0.8 + 0.1 * cos(t * 0.9));
      float w0 = 1.0 / pow(distance(uv, P0) + 0.05, 2.2), w1 = 1.0 / pow(distance(uv, P1) + 0.05, 2.2);
      float w2 = 1.0 / pow(distance(uv, P2) + 0.05, 2.2), w3 = 1.0 / pow(distance(uv, P3) + 0.05, 2.2);
      vec3 a = mix(c_field, c_a, 0.6 * u_k), b = mix(c_field2, c_b, 0.5 * u_k), c = c_field, d = mix(c_field2, c_c, 0.45 * u_k);
      vec3 col = (a * w0 + b * w1 + c * w2 + d * w3) / (w0 + w1 + w2 + w3);
      gl_FragColor = vec4(band(col, 0.08), 1.0); }`,
    // nebula: deep fbm clouds that parallax with the camera (space styles)
    nebula: `void main(){ vec2 w = world(gl_FragCoord.xy) * 0.0006; float t = u_t * 0.02 * u_drift;   // fx.drift: 1 by default; a calm field is lower (gps-position, L-412)
      float n = fbm(w * 1.3 + vec2(t, -t)); float m = fbm(w * 3.1 - vec2(t * 1.7, 0.0) + n);
      vec3 col = mix(c_field, c_field2, u_k * smoothstep(0.35, 0.8, n));   // scaled by intensity too (noir guide s15: blotches after H.264)
      col = mix(col, c_a, 0.45 * u_k * smoothstep(0.5, 0.9, m));
      col = mix(col, c_b, 0.38 * u_k * smoothstep(0.55, 0.95, n * m * 1.8));
      gl_FragColor = vec4(band(col, 0.07), 1.0); }`,
    // paper: fibre texture and a soft desk-lamp falloff (sketch, editorial, line art)
    paper: `void main(){ vec2 w = world(gl_FragCoord.xy); vec2 uv = gl_FragCoord.xy / u_res;
      float fib = fbm(w * vec2(0.02, 0.35)) * 0.6 + fbm(w * 0.08) * 0.4;
      float lamp = 1.0 - 0.5 * distance(uv, vec2(0.42, 0.62));
      vec3 col = c_field * (0.965 + 0.05 * fib) * (0.97 + 0.04 * lamp);
      gl_FragColor = vec4(band(col, 0.035), 1.0); }`,
    // drafting (the blueprint pack, D-178): a still drafting grid on a dark sheet, minor lines every 40 world px and major
    // every 200, drawn toward the ink colour, no moving light (calm backgrounds); it follows the camera like the sheet it is
    drafting: `void main(){ vec2 w = world(gl_FragCoord.xy); vec2 uv = gl_FragCoord.xy / u_res;
      vec2 f1 = (0.5 - abs(fract(w / 40.0) - 0.5)) * 40.0, f2 = (0.5 - abs(fract(w / 200.0) - 0.5)) * 200.0;
      float m1 = 1.0 - smoothstep(0.35, 1.15, min(f1.x, f1.y)), m2 = 1.0 - smoothstep(0.55, 1.55, min(f2.x, f2.y));
      vec3 col = mix(c_field2, c_field, 0.35 + 0.65 * uv.y);
      col = mix(col, c_ink, u_k * (0.055 * m1 + 0.11 * m2));
      gl_FragColor = vec4(band(col, 0.04), 1.0); }`,
    // cyanotype (2026-10-16, Kshitij: the blueprint lost its "wow" next to lemo-opuscar's sheet): a sheet of exposed paper
    // that follows the camera like the drawing on it. Two Prussian blues mottled by noise (the coating's uneven
    // exposure), fibres and specks, two fold creases with a bright and a dark edge, edges bleached by the light, and a
    // faint major grid. Still (no moving light: calm backgrounds); kept within the field's luminance band.
    cyanotype: `void main(){ vec2 w = world(gl_FragCoord.xy); vec2 uv = gl_FragCoord.xy / u_res;
      float blot = fbm(w * 0.0032 + vec2(3.1, 7.7)), mott = fbm(w * 0.011 + vec2(11.0, 2.0));
      vec3 deep = c_field2, pale = mix(c_field, c_ink, 0.06);
      vec3 col = mix(deep, pale, smoothstep(0.25, 0.85, 0.65 * blot + 0.35 * mott));
      float fib = fbm(w * vec2(0.004, 0.09) + vec2(0.0, blot * 3.0));
      col = mix(col, c_ink, 0.025 * u_k * smoothstep(0.55, 0.9, fib));
      float sp = h21(floor(w / 3.0)); col = mix(col, c_ink, 0.10 * u_k * step(0.9985, sp)); col *= 1.0 - 0.10 * u_k * step(0.9992, h21(floor(w / 4.0) + 7.0));
      float cx = w.x - 960.0, cy = w.y - 540.0;
      float fv = exp(-pow(cx / 2.2, 2.0)) - 0.8 * exp(-pow((cx - 3.5) / 3.0, 2.0)), fh = exp(-pow(cy / 2.2, 2.0)) - 0.8 * exp(-pow((cy + 3.5) / 3.0, 2.0));
      col = mix(col, c_ink, 0.07 * u_k * max(fv, 0.0) + 0.07 * u_k * max(fh, 0.0)); col *= 1.0 - 0.06 * u_k * (max(-fv, 0.0) + max(-fh, 0.0));
      vec2 e = min(uv, 1.0 - uv); float bleach = 1.0 - smoothstep(0.0, 0.09, min(e.x, e.y * 1.6));
      col = mix(col, mix(c_field, c_ink, 0.18), 0.55 * u_k * bleach * (0.6 + 0.4 * blot));
      vec2 g2 = abs(fract(w / 200.0) - 0.5); col = mix(col, c_ink, 0.03 * u_k * (1.0 - smoothstep(0.0, 0.006, min(g2.x, g2.y))));
      gl_FragColor = vec4(band(col, 0.06), 1.0); }`,
    // blueprint: a faint engineering grid that follows the world, with a slow scanning light
    blueprint: `void main(){ vec2 w = world(gl_FragCoord.xy); vec2 uv = gl_FragCoord.xy / u_res;
      vec2 g1 = abs(fract(w / 40.0) - 0.5), g2 = abs(fract(w / 200.0) - 0.5);
      float line = max(1.0 - smoothstep(0.0, 0.03, min(g1.x, g1.y)) * 1.0, 0.0) * 0.35 + (1.0 - smoothstep(0.0, 0.012, min(g2.x, g2.y))) * 0.65;
      float scan = exp(-pow((uv.x + uv.y * 0.3) - fract(u_t * 0.035) * 1.6 + 0.2, 2.0) * 18.0);
      vec3 col = mix(c_field, c_field2, 0.5 + 0.5 * uv.y);
      col = mix(col, c_ink, 0.05 * u_k * line) + c_a * 0.05 * u_k * scan;
      gl_FragColor = vec4(band(col, 0.05), 1.0); }`,
  };
  // the TOP layer: grain + vignette + a warm light leak, premultiplied over the picture
  // paper (D-90, CINEMA_PLAN B6): a multiplicative print texture over the WHOLE picture, objects included, as
  // the reference films do. Multiplying by a near-white texture m equals black "over" at alpha (1 - m), so it lives
  // in the same premultiplied layer: blotches (large fbm) + fibres (stretched fbm) + fine tooth, screen-locked.
  const TOP = `uniform float u_grain; uniform float u_vig; uniform float u_leak; uniform float u_paper;
    void main(){ vec2 uv = gl_FragCoord.xy / u_res;
      float g = h21(gl_FragCoord.xy + vec2(u_frame * 37.0, u_frame * 11.0)) - 0.5;
      vec2 sp = gl_FragCoord.xy * (1920.0 / u_res.x);
      float tex = 0.55 * fbm(sp * 0.004) + 0.3 * fbm(sp * vec2(0.012, 0.09)) + 0.15 * h21(floor(sp * 0.5));
      float av = u_vig * smoothstep(0.35, 1.05, distance(uv, vec2(0.5)) * 1.25);
      av = av + u_paper * tex * (1.0 - av);
      float ag = u_grain * abs(g) * 2.0; vec3 cg = g > 0.0 ? vec3(1.0) : vec3(0.0);
      float al = u_leak * 0.3 * smoothstep(0.9, 0.0, distance(uv, vec2(0.08 + 0.05 * sin(u_t * 0.13), 0.92))) * (0.6 + 0.4 * sin(u_t * 0.21));
      // premultiplied "over": vignette (black), then grain (white or black), then a warm leak
      vec3 C = vec3(0.0); float A = av;
      C = cg * ag + C * (1.0 - ag); A = ag + A * (1.0 - ag);
      C = c_a * al + C * (1.0 - al); A = al + A * (1.0 - al);
      gl_FragColor = vec4(C, A); }`;
  // MOMENTS: timed screen-space signalling. light: a soft band sweeps across a rect. spotlight: dim the rest.
  // fx.spotlight {strength, tint} (style guides s15, WS6 2026-10-08): the dim outside the rect, per pack; default
  // strength 0.55 and black, exactly as before
  const MOMENT = `uniform vec4 u_rect; uniform float u_p; uniform float u_kind; uniform float u_dim; uniform vec3 c_tint;
    void main(){ vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) * (1920.0 / u_res.x);
      vec2 r0 = u_rect.xy, r1 = u_rect.xy + u_rect.zw;
      vec2 d = max(max(r0 - px, px - r1), 0.0); float inside = 1.0 - smoothstep(0.0, u_kind < 0.5 ? 6.0 : 40.0, length(d));
      if (u_kind < 0.5) { // light sweep
        float x = (px.x - r0.x) / max(u_rect.z, 1.0) + (px.y - r0.y) / max(u_rect.w, 1.0) * 0.35;
        float band = exp(-pow((x - (u_p * 1.6 - 0.3)) * 9.0, 2.0));
        float env = sin(3.14159 * clamp(u_p, 0.0, 1.0));
        // additive light (premultiplied, alpha 0): brightens what is there, never covers it
        gl_FragColor = vec4(vec3(1.0) * band * inside * env * 0.34, 0.0);
      } else {           // spotlight: dim outside the rect, eased in and out
        float env = smoothstep(0.0, 0.18, u_p) * (1.0 - smoothstep(0.82, 1.0, u_p));
        float a = (1.0 - inside) * u_dim * env;
        gl_FragColor = vec4(c_tint * a, a);
      } }`;

  function hex(c) { const h = String(c).replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h.slice(0, 6), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

  // Overlay layers (grain, vignette, leak, moments) are TRANSLUCENT: their alpha never exceeds about 0.55. A
  // layout checker that treats every canvas as opaque (HyperFrames' text_occluded counts any CANVAS whose opacity
  // chain is >= 0.6) then reports every word on screen as hidden (L-104). So an overlay is drawn at a gain of
  // 1/OVERLAY_OPACITY and shown at CSS opacity OVERLAY_OPACITY: the same pixels, and a canvas that says what it is.
  const OVERLAY_OPACITY = 0.58;
  function layer(id, zBefore, scale, frag, blend) {
    const W = Math.round(1920 * scale), H = Math.round(1080 * scale);
    if (blend) frag = frag.replace("void main(){", "void main0(){") + `\n    void main(){ main0(); gl_FragColor = min(gl_FragColor * ${(1 / OVERLAY_OPACITY).toFixed(5)}, vec4(1.0)); }`;
    const cv = Loom.html("canvas", { id, width: W, height: H, "data-loom-overlay": blend ? "translucent" : null,
      style: "position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none" + (blend ? `;opacity:${OVERLAY_OPACITY}` : "") });
    if (zBefore && zBefore.parentNode) zBefore.parentNode.insertBefore(cv, zBefore); else FX.root.appendChild(cv);
    const gl = cv.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: true, alpha: blend, antialias: false });
    if (!gl) { Loom.warn("fx_unavailable", `${id}: WebGL is not available here; the fx layer is skipped`); cv.remove(); return null; }
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) Loom.error("fx_shader", `${id}: ${gl.getShaderInfoLog(s)}`); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, LIB + frag)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { Loom.error("fx_link", `${id}: ${gl.getProgramInfoLog(pr)}`); return null; }
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const U = {}; const u = (n) => (n in U ? U[n] : (U[n] = gl.getUniformLocation(pr, n)));
    return { cv, gl, pr, buf, u, W, H };
  }
  function bind(L, t, extra) {
    const { gl, pr, u } = L;
    gl.viewport(0, 0, L.W, L.H); gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, L.buf); const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const P = S().pack.palette, cam = (Loom.world && Loom.world.__cam) || { tx: 0, ty: 0, s: 1 };
    gl.uniform1f(u("u_t"), t); gl.uniform2f(u("u_res"), L.W, L.H); gl.uniform3f(u("u_cam"), cam.tx, cam.ty, cam.s);
    gl.uniform1f(u("u_frame"), Math.round(t * 30)); gl.uniform1f(u("u_k"), FX.cfg.intensity == null ? 1 : FX.cfg.intensity); gl.uniform1f(u("u_drift"), FX.cfg.drift == null ? 1 : FX.cfg.drift);
    const tok = (n, fb) => hex(P[n] || P[fb] || "#000");
    gl.uniform3fv(u("c_field"), tok("field")); gl.uniform3fv(u("c_field2"), tok("field2", "field")); gl.uniform3fv(u("c_ink"), tok("ink"));
    const cols = FX.cfg.colors || ["accent", "accent2", "accent4"];
    gl.uniform3fv(u("c_a"), tok(cols[0], "accent")); gl.uniform3fv(u("c_b"), tok(cols[1], "accent2")); gl.uniform3fv(u("c_c"), tok(cols[2], "accent"));
    for (const k in extra || {}) { const v = extra[k]; if (Array.isArray(v)) gl["uniform" + v.length + "f"](u(k), ...v); else gl.uniform1f(u(k), v); }
  }

  /** Loom.fx.install(manifest): called by boot after the stage and ambient exist. */
  FX.install = function (manifest, opts) {
    opts = opts || {};
    const cfg = Object.assign({}, S().pack.fx || {}, manifest.fx || {});
    FX.root = opts.root || (Loom.world && Loom.world.root) || document.body;
    FX.cfg = cfg;
    if (!cfg || cfg.enabled === false || (!cfg.background && !cfg.grain && !cfg.vignette && !cfg.leak && !cfg.paper && !(manifest.fx_moments || []).length)) return;
    const Wd = Object.assign({}, Loom.world || {}, opts.anchors || {});
    FX.enabled = true;
    if (cfg.background && BG[cfg.background]) {
      const L = layer("lm-fx-bg", Wd.ambient, cfg.bg_scale || 0.5, BG[cfg.background], false);
      if (L) { FX.layers.push(L); Loom.clock((t) => { bind(L, t); L.gl.drawArrays(L.gl.TRIANGLE_STRIP, 0, 4); }); }
    } else if (cfg.background) Loom.error("fx_unknown", `background shader "${cfg.background}" (have: ${Object.keys(BG).join(", ")})`);
    const moments = manifest.fx_moments || [];
    // fx.vignette_under (style guides s15, WS6 2026-10-08): the vignette sits UNDER the world (above the field, the
    // background shader and the ambient layer), so it darkens the field and never a card, a word or a pill
    const vigUnder = !!(cfg.vignette_under && cfg.vignette);
    if (vigUnder) {
      const V = layer("lm-fx-vig", Wd.cam, 1, TOP, true);
      if (V) {
        FX.layers.push(V);
        Loom.clock((t) => {
          const gl = V.gl; gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
          bind(V, t, { u_grain: 0, u_vig: cfg.vignette, u_leak: 0, u_paper: 0 });
          gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        });
      }
    }
    if (cfg.grain || (cfg.vignette && !vigUnder) || cfg.leak || cfg.paper || moments.length) {
      const L = layer("lm-fx-top", Wd.overlay, 1, TOP, true);
      const M = moments.length ? layer("lm-fx-moment", Wd.overlay, 0.5, MOMENT, true) : null;
      const sp = cfg.spotlight || {};
      const spot = { strength: sp.strength == null ? 0.55 : +sp.strength, tint: sp.tint ? hex(S().c(sp.tint)) : [0, 0, 0] };
      if (L) {
        FX.layers.push(L);
        Loom.clock((t) => {
          const gl = L.gl; gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
          bind(L, t, { u_grain: cfg.grain || 0, u_vig: vigUnder ? 0 : (cfg.vignette || 0), u_leak: cfg.leak || 0, u_paper: cfg.paper || 0 });
          gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        });
      }
      if (M) {
        FX.layers.push(M);
        Loom.clock((t) => {
          const gl = M.gl; gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
          for (const mo of moments) {
            if (t < mo.t0 || t > mo.t1) continue;
            const p = (t - mo.t0) / Math.max(0.001, mo.t1 - mo.t0);
            const r = mo.rect || [96, 84, 1728, 846];
            bind(M, t, { u_rect: r, u_p: p, u_kind: mo.kind === "spotlight" ? 1 : 0, u_dim: spot.strength, c_tint: spot.tint });
            gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
        });
      }
    }
    Loom.report.fx = { background: cfg.background || null, grain: cfg.grain || 0, vignette: cfg.vignette || 0, vignette_under: vigUnder, paper: cfg.paper || 0,
      spotlight: cfg.spotlight || null, moments: moments.length, layers: FX.layers.length };
  };

  /** A scene can ask for a timed moment in its own station coordinates: ctx.fxMoment("light"|"spotlight", t0, t1, rect).
   *  That one (world.js) keeps the world rect and resolves the SCREEN rect when the layer reads it, with the camera at
   *  t0 (the moment is short). This direct form takes a rect already in screen coordinates. */
  FX.moment = function (kind, t0, t1, rectScreen) {
    (Loom.manifest.fx_moments = Loom.manifest.fx_moments || []).push({ kind, t0, t1, rect: rectScreen });
  };
  FX.shaders = () => ({ background: Object.keys(BG), top: ["grain", "vignette", "leak", "paper"], moments: ["light", "spotlight"] });
})();
