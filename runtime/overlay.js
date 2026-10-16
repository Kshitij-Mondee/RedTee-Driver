/* Overlay layers: captions, section chrome, the code-drawn presenter, placed media.
 * All clock-driven (pure functions of t).
 */
// @capability presenter_and_captions | people | storyboard kind avatar (props title, kicker, card); captions | Layering and joins | the code-drawn presenter beside a title, or with a card of up to 3 short lines; burnt-in captions
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;

  /* ---------------- captions (1-2 lines, active word by COLOUR only: no reflow) ---------------- */
  // the pill's colour as seen: its rgba composited over the pack's field (a hex string)
  const opaque = (bg, field) => {
    const m = String(bg).trim().match(/^rgba?\(([^)]+)\)$/);
    if (!m) return bg;
    const v = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    const a = v.length > 3 ? v[3] : 1;
    const f = S().mix(field, field, 0).slice(1);
    const fr = [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
    return "#" + [0, 1, 2].map((i) => Math.round(a * v[i] + (1 - a) * fr[i]).toString(16).padStart(2, "0")).join("");
  };
  Loom.captions = {
    /** the caption colours a pack gives (pure: the pack in, colours out). The active word must read on the pill at
     *  4.5:1 (WCAG AA). Six light packs drew it in accent2 at about 2:1 on their dark pill (story-cartoon #87570F on
     *  rgba(42,34,28,0.92)); below 4.5 the active word takes the lightest-needed tint of its own colour (hue kept),
     *  else the field colour, and `fallback` says so (fix_tpl 2026-10-07; the packs' own fix is the style lint's). */
    colours(pack) {
      const pal = (pack && pack.palette) || {};
      const sk = (pack && pack.captions) || {};
      const tok = (t) => pal[t] || t;
      const field = tok("field"), want = tok(sk.active || "accent2"), base = tok(sk.fg || "ink");
      const pill = opaque(sk.bg || "rgba(0,0,0,.7)", field);
      const ratio = S().contrast(want, pill);
      if (ratio >= 4.5) return { active: want, base, pill, ratio, ratioBefore: ratio, fallback: false };
      let active = null;
      for (let k = 1; k <= 20 && !active; k++) { const c = S().mix(want, "#ffffff", k * 0.05); if (S().contrast(c, pill) >= 4.5) active = c; }
      if (!active) active = field;
      return { active, base, pill, ratio: S().contrast(active, pill), ratioBefore: ratio, fallback: true };
    },
    build(manifest) {
      const cap = manifest.captions;
      if (!cap || !cap.enabled) return;
      const sk = S().pack.captions || {};
      const f = S().font(sk.font || "body");
      const host = Loom.html("div", { id: "lm-captions", style: "position:absolute;left:0;top:0;width:1920px;height:1080px" }, Loom.world.overlay);
      const nodes = cap.groups.map((g, gi) => {
        const line = Loom.html("div", { style: `position:absolute;left:0;width:1920px;top:${sk.top || 948}px;display:flex;justify-content:center;visibility:hidden` }, host);
        const box = Loom.html("div", { style: `background:${sk.bg || "rgba(0,0,0,.7)"};border-radius:${sk.radius || 18}px;padding:10px 26px;font-family:"${f.family}";font-weight:${S().loadedWeight(f.family, sk.weight || 800)};font-size:${sk.size || 38}px;line-height:1.25;max-width:1500px;text-align:center;color:${S().c(sk.fg || "ink")}` }, line);
        const spans = g.words.map((w) => { const s = Loom.html("span", { style: "margin:0 5px" }, box, w.w); return { s, w }; });
        return { line, spans, g };
      });
      const col = Loom.captions.colours(S().pack);
      const act = col.active, base = S().c(sk.fg || "ink");
      if (col.fallback) Loom.warn("caption_active_contrast", `the pack's active caption colour ${S().c(sk.active || "accent2")} is ${col.ratioBefore.toFixed(2)}:1 on its pill (${col.pill}); the active word uses ${col.active} (${col.ratio.toFixed(2)}:1). Fix the pack's captions.active`);
      let cur = -1;
      Loom.clock((t) => {
        let idx = -1;
        for (let i = 0; i < nodes.length; i++) { if (t >= nodes[i].g.t0 && t < nodes[i].g.t1) { idx = i; break; } }
        if (idx !== cur) { if (cur >= 0) nodes[cur].line.style.visibility = "hidden"; if (idx >= 0) nodes[idx].line.style.visibility = "visible"; cur = idx; }
        if (idx >= 0) for (const sp of nodes[idx].spans) { const on = t >= sp.w.s - 0.04 && t < sp.w.e + 0.02; const col = on ? act : base; if (sp.s.style.color !== col) sp.s.style.color = col; }
      });
    },
  };

  /* ---------------- brand layer: the organisation's logo (brand on any style) ----------------
   * Static and deterministic: placed in a corner clear of the captions band, shown always or only at the
   * start and end. A top-left logo pushes the section label below it. */
  Loom.brandLayer = {
    build(manifest) {
      const lg = manifest.brand && manifest.brand.logo;
      if (!lg) return;
      // the logo sits in the band OUTSIDE the content safe box (y < 84 or y > 930), in a corner clear of captions
      const h = lg.height, w = Math.round(h * (lg.aspect || 3));
      const pos = { "top-right": `right:96px;top:${Math.round((84 - h) / 2)}px`, "top-left": `left:96px;top:${Math.round((84 - h) / 2)}px`,
                    "bottom-right": `right:64px;bottom:28px`, "bottom-left": `left:64px;bottom:28px` }[lg.placement] || `right:96px;top:14px`;
      // on a dark field without a dark-background logo, the logo sits on a light plate (never invisible)
      const ih = lg.plate ? h - 10 : h, iw = Math.round(ih * (lg.aspect || 3));
      const plate = lg.plate ? "background:#FFFFFF;padding:5px 9px;border-radius:8px;box-sizing:content-box;" : "";
      const img = Loom.html("img", { id: "lm-brand-logo", src: lg.src, alt: "", style: `position:absolute;${pos};height:${ih}px;width:${iw}px;${plate}opacity:1` }, Loom.world.overlay);
      // a top-left logo moves the section label to its right, on the same line (never into the content)
      Loom.brandLayer.leftShift = lg.placement === "top-left" ? w + 24 : 0;
      if (lg.show === "intro_outro") {
        const D = manifest.duration;
        Loom.clock((t) => {
          const a = Math.min(1, Math.max(0, (3.5 - t) / 0.4)), b = Math.min(1, Math.max(0, (t - (D - 4)) / 0.4));
          img.style.opacity = Math.max(a, b).toFixed(3);
        });
      }
    },
  };

  /* ---------------- section chrome (orientation: where am I) ---------------- */
  // its colour is the pack's roles.section_label (muted when unset): it sits in the frame's top-left corner, where a
  // pack's vignette is darkest (story-cartoon: muted at 2.7:1 there, D-154; the style lint measures it)
  Loom.chrome = {
    build(manifest) {
      const secs = manifest.sections || [];
      if (!secs.length || !(manifest.chrome || {}).section_labels) return;
      const f = S().font("label");
      const host = Loom.html("div", { style: `position:absolute;left:${96 + ((Loom.brandLayer && Loom.brandLayer.leftShift) || 0)}px;top:44px;font-family:"${f.family}";font-weight:${S().loadedWeight(f.family, 800)};font-size:24px;letter-spacing:.18em;color:${S().c(S().role("section_label", "muted"))};text-transform:uppercase` }, Loom.world.overlay);
      const items = secs.map((s, i) => ({ s, el: Loom.html("div", { style: "position:absolute;left:0;top:0;white-space:nowrap;opacity:0" }, host, `${String(i + 1).padStart(2, "0")}  ${s.title}`) }));
      Loom.clock((t) => {
        for (let i = 0; i < items.length; i++) {
          const a = items[i].s.t0, b = items[i].s.t1;
          const fin = Math.min(1, Math.max(0, (t - a) / 0.4)), fout = Math.min(1, Math.max(0, (b - t) / 0.3));
          const op = t >= a && t < b ? Math.min(fin, fout) : 0;
          items[i].el.style.opacity = op.toFixed(3);
        }
      });
    },
  };

  /* ---------------- the code-drawn presenter (default avatar) ---------------- */
  // The avatar beat's props (fix_tpl, 2026-10-07). It drew a 600 px disc and an optional title only, and storyboards
  // passed keys it never read (layout, case_labels, labels, rule): two thirds of the frame stayed empty. A key outside
  // this spec is now the avatar_props_unknown error, and a `card` fills the empty side.
  const AVATAR_PROPS = {
    member: { type: "enum", choices: ["woman", "man", "girl", "boy", "elder_woman", "elder_man"], default: "woman" },
    cast: { type: "str", max_words: 3 },
    side: { type: "enum", choices: ["left", "right"], default: "left" },
    // title: 12 words fill the three lines it gets without a card (feedback-that-lands b46 shows 10 in three clean
    // lines; 9 refused that reviewed beat). With a card it gets two lines, and the layout check measures the overflow
    kicker: { type: "str", max_words: 4 }, title: { type: "str", max_words: 12 }, say_title: { type: "anchor" },
    title_cue: { type: "anchor", deprecated: "say_title" },
    card: { type: "obj", of: {
      title: { type: "str", max_words: 6 },
      lines: { type: "list", max: 3, of: { text: { type: "str", required: true, max_words: 9 }, say: { type: "anchor" } } },
      rule: { type: "str", max_words: 12 }, say: { type: "anchor" },
    } },
    name: { type: "str", max_words: 3 }, role_label: { type: "str", max_words: 5 },
    cloth: { type: "token" }, talk_emotion: { type: "enum", choices: ["neutral", "happy", "surprised", "explaining"] },
    frame_r: { type: "number" }, frame_fill: { type: "token" },
  };
  Loom.presenter = {
    props: AVATAR_PROPS,
    /** A presenter scene: an illustrated character that talks (mouth from the narration's
     *  amplitude envelope), blinks on a deterministic schedule, and sits INSIDE the world.
     *  Beside it: kicker + title, and an optional card (up to 3 lines, or one rule line) on the empty side. */
    scene(ctx, props) {
      props = props || {};
      const unknown = Object.keys(props).filter((k) => !(k in AVATAR_PROPS));
      const cardUnknown = props.card && typeof props.card === "object" ? Object.keys(props.card).filter((k) => !(k in AVATAR_PROPS.card.of)) : [];
      if (unknown.length || cardUnknown.length) {
        Loom.error("avatar_props_unknown", `${ctx.beat.id}: the avatar does not read ${unknown.concat(cardUnknown.map((k) => "card." + k)).join(", ")} (it reads ${Object.keys(AVATAR_PROPS).join(", ")}; card: ${Object.keys(AVATAR_PROPS.card.of).join(", ")})`, { beat: ctx.beat.id });
      }
      const card = props.card && ((props.card.lines || []).length || props.card.rule) ? props.card : null;
      const env = (ctx.def.presenter_env) || ((window.LOOM_MANIFEST || {}).presenter || {}).envelope || [];
      const fps = ((window.LOOM_MANIFEST || {}).presenter || {}).fps || 30;
      // a presenter that is a cast member wears the cast's look; otherwise the pack's own character cloth, as before
      const who0 = Loom.th && Loom.th.person ? Loom.th.person(ctx, props, { member: "woman" }) : null;
      const who = who0 && who0.cast ? who0 : { member: props.member || "woman", cloth: props.cloth, skin: undefined };
      const member = who.member;
      const side = props.side || "left";
      // with a card the disc steps back (smaller, nearer its edge) so the card can hold the frame's other side
      const R = props.frame_r || (card ? 230 : 300);
      const cx = card ? (side === "left" ? 96 + R + 30 : 1824 - R - 30) : (side === "left" ? 560 : 1360), cy = card ? 500 : 520;
      const frame = ctx.el("presenter_frame", { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R, kind: "presenter", exit: "iris" });
      ctx.kit.disc(frame.inner, R, R, R, { fill: props.frame_fill || "surface" });
      const peepBox = ctx.el("presenter", { x: cx - R, y: cy - R, w: 2 * R, h: 2 * R, kind: "presenter", exit: "iris" });
      const cid = Loom.uid("pc");
      const cp = Loom.svg("clipPath", { id: cid }, peepBox.inner);
      Loom.svg("circle", { cx: R, cy: R, r: R - 6 }, cp);
      const wrap = Loom.svg("g", { "clip-path": `url(#${cid})` }, peepBox.inner);
      const closed = ctx.kit.peep(wrap, member, "neutral", { x: R, y: R * 1.08, size: R * 1.95, cloth: who.cloth, skin: who.skin });
      const open = ctx.kit.peep(wrap, member, props.talk_emotion || "explaining", { x: R, y: R * 1.08, size: R * 1.95, cloth: who.cloth, skin: who.skin });
      open.style.visibility = "hidden";
      const t0 = ctx.speechStart, t1 = ctx.speechEnd;
      Loom.clock((t) => {
        if (t < t0 - 0.1 || t > t1 + 0.1) { if (open.style.visibility !== "hidden") { open.style.visibility = "hidden"; closed.style.visibility = "visible"; } return; }
        const a = env[Math.floor(t * fps)] || 0;
        const talk = a > 0.18;
        open.style.visibility = talk ? "visible" : "hidden";
        closed.style.visibility = talk ? "hidden" : "visible";
        const bob = Math.sin(t * 5.1) * 3 * Math.min(1, a * 2);
        wrap.setAttribute("transform", `translate(0 ${bob.toFixed(2)})`);
      });
      const tIn = ctx.start + 0.05;
      ctx.m.iris(frame, tIn);
      ctx.m.iris(peepBox, tIn + 0.08);
      const H = Loom.th;
      const cueOf = (a) => (H && H.cue ? H.cue(ctx, a) : ctx.cue(a));
      // the column beside the presenter (name / role / title are REQUESTER-supplied, never invented)
      const nx = card ? (side === "left" ? cx + R + 80 : 96) : (side === "left" ? cx + R + 70 : 160);
      const nw = card ? 1728 - 2 * R - 110 : 700;
      const say_title = props.say_title || props.title_cue;
      let y = card ? 110 : 300;
      if (props.title) {
        const th = card ? 150 : 220;
        const tt = ctx.el("presenter_title", { x: nx, y, w: nw, h: (props.kicker ? 52 : 0) + th, kind: "text", exit: "wipe" });
        if (props.kicker) ctx.kit.kicker(tt.inner, props.kicker, { x: 0, y: 0, w: nw, h: 40 });
        const tx = ctx.kit.text(tt.inner, props.title, { role: "title", x: 0, y: props.kicker ? 52 : 0, w: nw, h: th, maxLines: card ? 2 : 3 });
        const LT = H && H.lead ? H.lead(ctx, say_title ? cueOf(say_title) : tIn + 0.35) : { at: say_title ? cueOf(say_title) : tIn + 0.35 };
        ctx.m.unmask(tt, LT.at);
        if (H && H.mark) H.mark(ctx, tx, LT);
        y += (props.kicker ? 52 : 0) + tx.__fit.height + 40;
      } else if (props.kicker) {
        const kk = ctx.el("presenter_kicker", { x: nx, y, w: nw, h: 40, kind: "text", exit: "sink" });
        ctx.kit.kicker(kk.inner, props.kicker, { x: 0, y: 0, w: nw, h: 40 });
        ctx.m.drop(kk, tIn + 0.3);
        y += 70;
      }
      if (card) {
        // a card on the empty side: up to three short lines, or one rule line, each revealed ON its words
        const cy0 = Math.max(y, 300), ch = 860 - cy0;
        const ls = (card.lines || []).slice(0, 3).map((l) => (typeof l === "string" ? { text: l } : l));
        // short lines (each well inside the card at the lead size): set them at the lead size and centre their block in
        // the card. Three two-word lines sat at body size on the left of a 1200 px card, the rest of it empty, and no
        // storyboard could change that (feedback-relay-v2 b18, two fixes, L-347). The card keeps its width, so the frame
        // stays balanced; longer lines keep the body size and the left edge, as before.
        const sizeOf = (r) => ((Loom.style.pack && Loom.style.pack.type) || {})[r] || [28, 36];
        const wide = (t, r) => ctx.kit.measure(String(t || ""), r, sizeOf(r)[1]);
        const shortLines = ls.length > 0 && ls.every((l) => wide(l.text, "lead") <= 0.6 * (nw - 128));
        const lineRole = shortLines ? "lead" : "body";
        const cw = nw;
        const blockW = shortLines ? Math.ceil(Math.max(...ls.map((l) => wide(l.text, "lead"))) + 48 + 24) : cw - 80;
        const lx = shortLines ? Math.max(40, Math.round((cw - blockW) / 2)) : 40;
        const C = ctx.el("presenter_card", { x: nx, y: cy0, w: cw, h: ch, kind: "card", exit: "displace" });
        ctx.kit.card(C.inner, 0, 0, cw, ch, { fill: "surface" });
        let iy = 36;
        if (card.title) { ctx.kit.text(C.inner, card.title, { role: "lead", x: 40, y: iy, w: cw - 80, h: 60, maxLines: 1, weight: 800, color: "accent2" }); iy += 84; }
        const tCard = H && H.structAt ? Math.min(H.structAt(ctx), ctx.speechEnd) : tIn + 0.4;
        ctx.m.settle(C, tCard);
        const parts = [];
        if (ls.length) {
          if (card.lines.length > 3) Loom.warn("avatar_card_too_long", `${ctx.beat.id}: an avatar card shows at most 3 lines`, { beat: ctx.beat.id });
          const lh = Math.min(150, (ch - iy - 30) / ls.length);
          ls.forEach((l, i) => {
            const E = ctx.el("presenter_card_" + (i + 1), { x: nx + lx, y: cy0 + iy + i * lh, w: cw - 40 - lx, h: lh - 16, kind: "row", exit: "displace" });
            ctx.kit.disc(E.inner, 14, (lh - 16) / 2, 10, { fill: "accent", shadow: false, flat: true });
            ctx.kit.text(E.inner, l.text, { role: lineRole, x: 48, y: 0, w: cw - 88 - lx, h: lh - 16, maxLines: 2, valign: "middle" });
            const t = l.say ? cueOf(l.say) : tCard + 0.3 + 0.4 * i;
            ctx.m.reveal(E, Math.max(tCard + 0.15, t));
            parts.push(E);
          });
        } else {
          const E = ctx.el("presenter_card_rule", { x: nx + 40, y: cy0 + iy, w: nw - 80, h: ch - iy - 36, kind: "text", exit: "displace" });
          ctx.kit.text(E.inner, card.rule, { role: "title", x: 0, y: 0, w: nw - 80, h: ch - iy - 36, maxLines: 3, valign: "middle", color: "accent" });
          ctx.m.stamp(E, Math.max(tCard + 0.15, card.say ? cueOf(card.say) : tCard + 0.4));
          parts.push(E);
        }
        C.followers = parts;   // the card's lines leave with it
      }
      if (props.name) {
        const nm = card ? ctx.el("presenter_name", { x: cx - R, y: cy + R + 24, w: 2 * R, h: 90, kind: "text" })
                        : ctx.el("presenter_name", { x: nx, y: 620, w: nw, h: 90, kind: "text" });
        const nmw = card ? 2 * R : nw, al = card ? "center" : "left";
        ctx.kit.text(nm.inner, props.name, { role: "lead", x: 0, y: 0, w: nmw, h: 44, maxLines: 1, color: "accent2", align: al });
        if (props.role_label) ctx.kit.text(nm.inner, props.role_label, { role: "label", x: 0, y: 50, w: nmw, h: 36, maxLines: 1, color: "muted", align: al });
        ctx.m.reveal(nm, tIn + 0.6);
      }
    },
  };

  /* ---------------- placed media (Manim clips, avatar clips) ---------------- */
  Loom.media = {
    scene(ctx, def) {
      const m = def.media;
      if (!m || !m.src) { Loom.error("media_missing_src", ctx.beat.id); return; }
      const r = m.rect || [96, 84, 1728, 846];
      // media lives in the station as a foreignObject so the camera carries it like any element
      const E = ctx.el(def.media.name || "media", { x: r[0], y: r[1], w: r[2], h: r[3], kind: "media", exit: m.exit || "recede" });
      const fo = Loom.svg("foreignObject", { x: 0, y: 0, width: r[2], height: r[3] }, E.inner);
      // the <video> is written into the static HTML by compose (so HyperFrames can pre-extract its
      // frames); here it is moved into the station so the camera carries it like any element
      const v = document.getElementById("media-" + ctx.beat.id);
      if (!v && Loom.manifest && Loom.manifest.trailer) return;   // a trailer keeps only the clips it shows
      if (!v) { Loom.error("media_element_missing", `media-${ctx.beat.id} is not in the composed HTML`); return; }
      const holder = document.createElement("div");
      holder.style.cssText = `position:relative;width:${r[2]}px;height:${r[3]}px`;
      fo.appendChild(holder);
      holder.appendChild(v);
      v.style.position = "absolute"; v.style.left = "0px"; v.style.top = "0px";
      v.style.width = r[2] + "px"; v.style.height = r[3] + "px"; v.style.objectFit = "contain";
      Loom.media.videos = Loom.media.videos || [];
      Loom.media.videos.push(v);
      // never before the film starts: a clip on the first beat would otherwise reveal at -0.05 s (bad_time)
      ctx.m.reveal(E, Math.max(0, (m.start != null ? m.start : ctx.start) - 0.05), { dy: 0, dur: 0.25 });
    },
  };
})();
