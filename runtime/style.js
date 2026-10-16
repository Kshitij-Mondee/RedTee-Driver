/* Loom style layer: a style pack is DATA (palette, type ranges, shape language, motion
 * personality, ambient field). Scenes never hard-code a hex value or a duration; they ask here.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = (Loom.style = {});

  /* ---------- colour maths (sRGB relative luminance, WCAG) ---------- */
  function hexToRgb(h) {
    h = String(h).trim();
    if (h.startsWith("rgb")) { const m = h.match(/[\d.]+/g).map(Number); return m.slice(0, 3); }
    h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  // "no colour" (S.c("none")) in the arithmetic: a contrast is judged against the field that shows through, and a mix,
  // shade or tint of nothing stays nothing (it used to read as #NaNNaNNaN, L-346)
  const isNone = (h) => h === "none" || h === "transparent";
  function lum(hex) {
    if (isNone(hex)) hex = (S.pack && S.pack.palette && S.pack.palette.field) || "#ffffff";
    const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  S.contrast = function (a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  S.mix = function (a, b, p) {
    if (isNone(a) || isNone(b)) return "none";
    const x = hexToRgb(a), y = hexToRgb(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * p).toString(16).padStart(2, "0")).join("");
  };
  S.darken = function (h, p) { return S.mix(h, "#000000", p); };
  /** Shade a fill for gloss shading: toward the pack's `shape.gloss_toward` token (glow-flat: a deep or plum), else
   *  toward black as before. Black greyed every warm accent (glow-flat guide s15, 2026-10-08). */
  S.shadeTo = function (h, p) {
    const t = S.pack && S.pack.shape && S.pack.shape.gloss_toward;
    return S.mix(h, t && S.pack.palette[t] ? S.pack.palette[t] : "#000000", p);
  };
  S.lighten = function (h, p) { return S.mix(h, "#ffffff", p); };

  /* ---------- token access ---------- */
  S.c = function (token) {
    const p = S.pack.palette;
    if (token == null) return p.ink;
    // "no colour" is SVG's own word, not a token: it used to raise unknown_token and paint the shape ink (a kit's
    // `fill: "none"` drew solid ink, 36 errors in R-35, L-326)
    if (token === "none" || token === "transparent") return "none";
    if (token.startsWith("#") || token.startsWith("rgb")) {
      Loom.warn("literal_colour", "scene used a literal colour instead of a token: " + token);
      return token;
    }
    if (!(token in p)) { Loom.error("unknown_token", "unknown colour token " + token); return p.ink; }
    return p[token];
  };
  /** The foreground to use ON a given fill: whichever of ink/field wins contrast, per element. */
  S.on = function (fillToken, opts) {
    if (S.outlined()) return S.pack.palette.ink; // hachure / line art: the field shows through
    const c0 = S.c(fillToken);
    const fill = c0 === "none" ? S.pack.palette.field : c0;   // no fill: the field shows through
    const cands = (opts && opts.candidates) || ["ink", "field", "onAccent"];
    let best = null, bestC = 0;
    for (const t of cands) {
      if (!(t in S.pack.palette)) continue;
      const cc = S.contrast(fill, S.pack.palette[t]);
      if (cc > bestC) { bestC = cc; best = t; }
    }
    if (bestC < 4.5) Loom.warn("low_contrast_on_fill", `best text contrast on ${fillToken} is ${bestC.toFixed(2)}:1`);
    return S.pack.palette[best];
  };
  S.shade = function (token) { const c = S.c(token); return c === "none" ? c : S.darken(c, S.pack.shape.shade_amount || 0.18); };
  /** A pack's colour for a ROLE (style guides, s15; WS6 2026-10-08): `roles: {kicker, term, verdict, date,
   *  quiz_letter, recap_rule, stat_value, chapter_kicker, ui_mark, link, button, me_bubble, person_cloth}` name the
   *  token templates, kit and Loom.ui use by default. A pack without the role keeps `fallback`, today's token, so packs
   *  that set nothing draw exactly as before. */
  S.role = function (name, fallback) { return packToken("roles", name, fallback); };
  /** A pack's furniture token: `materials: {wood, chair, screen, monitor, plant, pot}`, and the set decorations
   *  `window_lights`, `vessel`, `safety_line` (places.js, scenery.js), default `fallback`. */
  S.material = function (name, fallback) { return packToken("materials", name, fallback); };
  /** A pack's furniture token LIST (`materials.books`, and the set decorations `cells`, `leds`, `cables`, `chart`: a
   *  token or a list of tokens), else `fallback` as it was. The shelves drew their books in every accent whatever the
   *  pack (corporate and noir guides, A4 proof 2026-10-08); the places' set decorations did too (L-276). */
  S.materialList = function (name, fallback) { return packList("materials", name, fallback); };
  /** A pack's role LIST (`roles.avatar`: the tones UI avatars cycle through by name), else `fallback` as it was. */
  S.roleList = function (name, fallback) { return packList("roles", name, fallback); };
  function packList(group, name, fallback) {
    const v = ((S.pack && S.pack[group]) || {})[name];
    if (v == null) return fallback;
    const arr = (Array.isArray(v) ? v : [v]).filter((t) => {
      const ok = t in S.pack.palette;
      if (!ok) Loom.error("unknown_role_token", `pack ${group}.${name} has "${t}", which is not a palette token`);
      return ok;
    });
    return arr.length ? arr : fallback;
  }
  function packToken(group, name, fallback) {
    const v = ((S.pack && S.pack[group]) || {})[name];
    if (v == null) return fallback;
    if (!(v in S.pack.palette)) { Loom.error("unknown_role_token", `pack ${group}.${name} = "${v}" is not a palette token`); return fallback; }
    return v;
  }
  /** The weight a family really has loaded nearest to `want` (a tie goes up): no synthetic bold or thin. A template
   *  asking 800 of Patrick Hand (400 only) got a smeared fake bold and was MEASURED at 800 but drawn at 400 (style
   *  guides s15 "font weight clamp", 2026-10-08). */
  S.loadedWeight = function (family, want) {
    const ws = (S.pack.fonts.faces || []).filter((f) => f.family === family).map((f) => +f.weight);
    if (!ws.length || want == null) return want;
    let best = ws[0];
    for (const w of ws) { const d = Math.abs(w - want), bd = Math.abs(best - want); if (d < bd || (d === bd && w > best)) best = w; }
    return best;
  };

  /** Type size for a role, fitted inside the pack's [min, max] range for that role. */
  S.size = function (role, want) {
    const r = S.pack.type[role];
    if (!r) { Loom.error("unknown_type_role", role); return 32; }
    if (want == null) return r[1];
    return Math.max(r[0], Math.min(r[1], want));
  };
  /** True when fills are drawn as outlines over the field (sketch hachure, line art): text on a "filled" shape
   *  then sits on the field, so knockout colours must become ink. */
  S.outlined = function () { const s = S.pack.shape.shading; return s === "sketch" || s === "line"; };
  S.font = function (role) {
    const f = S.pack.fonts;
    // a pack may map a role to another face, e.g. engineering sets labels and captions in the mono face
    const mapped = (f.roles || {})[role];
    if (mapped && f[mapped]) return f[mapped];
    if (role === "display" || role === "title" || role === "hero") return f.display;
    if (role === "mono") return f.mono || f.body;
    return f.body;
  };
  S.dur = function (kind) {
    const m = S.pack.motion;
    const v = m[kind];
    if (v == null) { Loom.error("unknown_motion_setting", kind); return 0.5; }
    return v * (S.intensity || 1) ;
  };

  /* ---------- install: fonts, CSS variables, base field ---------- */
  S.install = function (pack, fontBase) {
    S.pack = pack;
    S.intensity = 1;
    const css = [];
    const faces = pack.fonts.faces || [];
    for (const face of faces) {
      css.push(`@font-face{font-family:"${face.family}";src:url(${fontBase}/${face.file}) format("woff2");font-weight:${face.weight};font-style:normal;font-display:block}`);
    }
    const p = pack.palette;
    css.push(`:root{${Object.keys(p).map((k) => `--c-${k}:${p[k]}`).join(";")}}`);
    css.push(`html,body{background:${p.field}}`);
    const st = document.createElement("style");
    st.textContent = css.join("\n");
    document.head.appendChild(st);
  };
  /** Resolve once every face declared by the pack is actually loaded (fit maths needs real metrics). */
  S.ready = async function () {
    const faces = S.pack.fonts.faces || [];
    await Promise.all(faces.map((f) => document.fonts.load(`${f.weight} 40px "${f.family}"`).catch(() => null)));
    await document.fonts.ready;
    for (const f of faces) {
      if (!document.fonts.check(`${f.weight} 40px "${f.family}"`)) Loom.error("font_not_loaded", `${f.family} ${f.weight}`);
    }
  };
})();
