/* Loom footage layer (D-114, SPIKE): a real video clip as a layer inside a scene, seeked, never played.
 *
 * What it is for: the TED-Ed study found films that freeze, grade and annotate real footage (a duotone clip with a
 * drawn label over it). This places a clip in a scene like any element (the camera carries it), trims it, fits it,
 * grades it from palette tokens and lays overlays on it.
 *
 *   Loom.footage(ctx, "street", { src: "media/street.webm", x: 160, y: 150, w: 960, h: 540, trim: [2, 6], at: 1.0,
 *                                 fit: "cover", grade: { duotone: ["ink", "accent2"] }, overlays: [{ text: "Bus lane", x: 40, y: 40 }] })
 *   -> the element E (kind "footage"); E.video is the <video>
 *
 *   src      project-relative path (or a data: URI); resolved against Loom.footage.base (default "")
 *   trim     [in, out] seconds of the clip to show (default [0, 4])
 *   at       timeline time (s) at which clip time `in` is shown; before it the in-frame holds, after `out` the out-frame
 *   fit      "cover" (default) or "contain"
 *   grade    {duotone: [darkToken, lightToken]} | {mono: true} | null: an SVG filter built from palette tokens
 *   overlays [{text, x, y, w?, role? ("label"), color? (token), fill? (token, default "surface")}] in element coordinates
 *   reveal   entrance time (default at - 0.05), or false for none
 *
 * Determinism (how a <video> becomes a pure function of t): the clip is NEVER played. One Loom.drive spanning
 * [at, at + out - in] sets video.currentTime = in + (t - at) on every frame the timeline is seeked to, so the shown
 * frame depends only on t. A seek is asynchronous, so a frame must not be captured until the video has decoded it:
 * Loom.footage.settled() resolves when every footage video is loaded and not seeking (its `seeked` has fired). The
 * lab harness's window.__show is wrapped to return that promise (puppeteer then waits before the screenshot).
 * What is SEEN is a <canvas> painted with drawImage from the decoded frame after each seek, not the <video> itself:
 * a paused video that loaded while hidden kept presenting its old frame after a later seek in the lab (2026-10-06),
 * which the canvas avoids. tests/suites/primitives_material_footage_hands.py checks the shown frame against ffmpeg's decode.
 *
 * Inside a HyperFrames lesson render, HyperFrames itself owns <video data-start> elements: it discovers them in the
 * STATIC html, pre-extracts their frames with ffmpeg and seeks them per frame (data-media-start is the trim in). If
 * compose writes <video id="footage-<beat>-<name>" data-start data-duration data-media-start> into index.html (it
 * does this already for media scenes), this layer reparents that element instead of making its own, and does not
 * seek it. Compose writes those static videos for a storyboard scene's `footage` list and for a hologram beat's
 * `hero3d` heroes (D-188); VERIFIED for the hero path on 2026-10-16: a composed throwaway lesson with a transparent
 * VP9 hero clip rendered through HyperFrames showed the clip seeked frame by frame, with its alpha, behind the HUD
 * (docs/research/2026-10-16-style-stress/hologram_v2_composed.py; tests/suites/hologram_engine.py). Without a static
 * element a lesson falls back to the self-seeking video, which is still UNVERIFIED inside a HyperFrames render.
 *
 * Consent, licences and downloads: real footage of people needs their consent and a licence on file; no clip is
 * downloaded without Kshitij's approval. Use VP9 WebM (Chromium without proprietary codecs cannot play H.264) and
 * keep a keyframe every second or so: seeking decodes from the previous keyframe.
 */
// @capability footage | media | Loom.footage(ctx, name, {src, trim, at, grade}) | Primitives from the TED-Ed study | consented real video graded in tokens, frozen and annotated (needs consent; downloads need approval)
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const videos = [];
  let hooked = false;

  /** wait until every self-seeking footage video shows its current frame */
  function readyOf(v) {
    return new Promise((res) => {
      const ok = () => v.__lmFailed || (v.readyState >= 2 && !v.seeking);
      if (ok()) return res();
      const f = () => { if (!ok()) return; for (const e of ["seeked", "loadeddata", "canplay", "error"]) v.removeEventListener(e, f); res(); };
      for (const e of ["seeked", "loadeddata", "canplay", "error"]) v.addEventListener(e, f);
    });
  }
  function hookHarness() {
    // the lab (loom/lab.py) defines window.__show(i, t) after the scene builds and screenshots right after it returns;
    // returning a promise makes puppeteer wait for the seek. One line in lab.py would replace this (see docs).
    if (hooked || typeof window === "undefined") return;
    hooked = true;
    let inner = window.__show;
    Object.defineProperty(window, "__show", { configurable: true,
      get() { return inner && ((i, t) => { const r = inner(i, t); return FT.settled().then(() => r); }); },
      set(fn) { inner = fn; } });
  }

  /** draw the video's current frame into the canvas with object-fit cover/contain maths */
  function paint(v, cv, fit) {
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh || v.readyState < 2) return;
    const g = cv.getContext("2d"), k = (fit === "contain" ? Math.min : Math.max)(cv.width / vw, cv.height / vh);
    const dw = vw * k, dh = vh * k;
    g.clearRect(0, 0, cv.width, cv.height);
    g.drawImage(v, (cv.width - dw) / 2, (cv.height - dh) / 2, dw, dh);
  }

  /* ---------------- grade: an SVG filter from tokens ---------------- */
  const rgb = (h) => { h = String(h).replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
  const made = new Set();
  function gradeFilter(grade) {
    if (!grade) return null;
    let key, build;
    if (grade.duotone) {
      const [dk, lt] = grade.duotone, a = rgb(S().c(dk || "ink")), b = rgb(S().c(lt || "surface"));
      key = "lmfoot_duo_" + Loom.hash(a.concat(b).join(",")).toString(36);
      build = (f) => {
        // luminance into every channel, then map 0..1 onto dark..light per channel
        Loom.svg("feColorMatrix", { type: "matrix", values: "0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0" }, f);
        const ct = Loom.svg("feComponentTransfer", {}, f);
        ["R", "G", "B"].forEach((ch, i) => Loom.svg("feFunc" + ch, { type: "table", tableValues: `${a[i].toFixed(4)} ${b[i].toFixed(4)}` }, ct));
      };
    } else if (grade.mono) {
      key = "lmfoot_mono";
      build = (f) => Loom.svg("feColorMatrix", { type: "saturate", values: "0" }, f);
    } else { Loom.warn("footage_grade", "grade must be {duotone: [dark, light]} or {mono: true}"); return null; }
    if (!made.has(key)) {
      made.add(key);
      let host = document.getElementById("lm-footage-defs");
      if (!host) { host = Loom.svg("svg", { id: "lm-footage-defs", width: 0, height: 0, style: "position:absolute;width:0;height:0;overflow:hidden" }, document.body); Loom.svg("defs", {}, host); }
      build(Loom.svg("filter", { id: key, "color-interpolation-filters": "sRGB", x: 0, y: 0, width: 1, height: 1 }, host.firstChild));
    }
    return key;
  }

  const FT = (Loom.footage = function (ctx, name, o) {
    o = o || {};
    const x = o.x || 0, y = o.y || 0, w = o.w || 960, h = o.h || 540;
    const trim = Array.isArray(o.trim) && o.trim.length === 2 ? o.trim : [0, 4];
    const at = o.at == null ? (ctx.start || 0) : o.at, len = Math.max(0.001, trim[1] - trim[0]);
    const beat = ctx.beat && ctx.beat.id;
    if (!o.src) { Loom.error("footage_missing_src", `${beat || ""}: footage "${name}" has no src`); return null; }
    const E = ctx.el(name, { x, y, w, h, kind: "footage", exit: o.exit || "recede" });
    const fo = Loom.svg("foreignObject", { x: 0, y: 0, width: w, height: h }, E.inner);
    const holder = document.createElement("div");
    holder.style.cssText = `position:relative;width:${w}px;height:${h}px;overflow:hidden`;
    fo.appendChild(holder);
    // a compose-written static <video> (HyperFrames drives it) wins; else make one and seek it ourselves
    let v = document.getElementById(`footage-${beat}-${name}`), own = false;
    if (!v) {
      own = true;
      v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
      v.src = /^(data:|blob:|https?:|file:)/.test(o.src) ? o.src : (FT.base || "") + o.src;
      v.addEventListener("error", () => { v.__lmFailed = true; Loom.error("footage_load_failed", `${name}: could not load ${String(o.src).slice(0, 80)} (codec? path?)`); });
    }
    const fit = o.fit === "contain" ? "contain" : "cover", fid = gradeFilter(o.grade);
    holder.appendChild(v);
    v.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;object-fit:${fit}`;
    if (fid) v.style.filter = `url(#${fid})`;
    E.video = v;
    if (own) {
      // what is SEEN is a canvas painted from the decoded frame after each seek: a paused <video> that was hidden
      // when it loaded can keep presenting a stale frame after a later seek (measured in the lab, 2026-10-06), while
      // drawImage reads the frame the seek decoded. The <video> stays in the DOM, invisible, as the decoder.
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      cv.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px`;
      if (fid) cv.style.filter = `url(#${fid})`;
      v.style.visibility = "hidden";
      holder.appendChild(cv);
      v.__lmPaint = () => paint(v, cv, fit);
      for (const ev of ["seeked", "loadeddata"]) v.addEventListener(ev, v.__lmPaint);
      E.canvas = cv;
      videos.push(v);
      hookHarness();
      const seek = (ct) => { if (Math.abs((v.__lmT == null ? -1 : v.__lmT) - ct) > 1e-4) { v.__lmT = ct; v.currentTime = ct; } };
      // one progress over the clip's span: clip time = in + (t - at); outside the span the end frames hold
      Loom.drive((e, p) => seek(trim[0] + p * len), at, len, "linear", { kind: "footage", beat, name: name + ".footage" });
    }
    for (const ov of o.overlays || []) {
      const ow = ov.w || 360, g = Loom.svg("g", { transform: `translate(${ov.x || 24} ${ov.y || 24})` }, E.inner);
      const pad = 14, role = ov.role || "label";
      ctx.kit.rect(g, 0, 0, ow, 64, { fill: ov.fill || "surface", r: 12 });
      ctx.kit.text(g, ov.text, { x: pad, y: 0, w: ow - 2 * pad, h: 64, role, align: "left", valign: "middle", weight: 700, color: ov.color || "ink", maxLines: 1 });
    }
    (Loom.report.footage = Loom.report.footage || []).push({ beat, name, src: String(o.src).slice(0, 120), trim, at, static: !own, grade: o.grade ? Object.keys(o.grade)[0] : null });
    if (o.reveal !== false) ctx.m.reveal(E, o.reveal != null ? o.reveal : Math.max(0, at - 0.05), { dy: 0, dur: 0.25 });
    return E;
  });
  FT.base = "";
  FT.videos = videos;
  /** resolves when every self-seeking footage video shows the frame for the current time */
  FT.settled = function () {
    // capture timing only (never frame content): after the seeks land, let the compositor present the new frames.
    // A video whose seek lands while it is being revealed can otherwise be captured on its previous frame.
    const raf = () => new Promise((r) => (typeof requestAnimationFrame === "function" ? requestAnimationFrame(() => r()) : r()));
    return Promise.all(videos.map(readyOf)).then(() => videos.forEach((v) => v.__lmPaint && v.__lmPaint())).then(raf).then(raf);
  };
})();
