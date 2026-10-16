/* Shared helpers for templates and blueprints. */
(function () {
  "use strict";
  const Loom = window.Loom;
  const H = (Loom.th = {});
  /** an anchor's time, asked of ctx.cue ONCE per build: every ctx.cue call is logged in Loom.report.cues, so a template
   *  that asked twice double-logged the anchor (calendar.plan, hero.character_moment; fix_tpl 2026-10-07). */
  const CUES = new WeakMap();
  H.cue = function (ctx, say) {
    let m = CUES.get(ctx);
    if (!m) CUES.set(ctx, (m = new Map()));
    const k = String(say);
    if (!m.has(k)) m.set(k, ctx.cue(say));
    return m.get(k);
  };
  /** time for a reveal: the spoken anchor if given (reveal ON the word), else a fraction of the beat. */
  H.when = function (ctx, say, frac, label) {
    if (say) return H.cue(ctx, say);
    Loom.warn("unanchored_reveal", `${ctx.beat.id}: "${label || "element"}" has no 'say' anchor; placed at ${Math.round((frac || 0) * 100)}% of the speech`, { beat: ctx.beat.id });
    return ctx.at(frac || 0);
  };
  /** D-100: the frame is never empty while the voice runs. The FIRST structural element of a template (its title,
   *  term, quote or first item) is on screen by the lead time (pack `pace.lead_s`, default 0.6 s after speech
   *  starts) even when its own words come later; the words still land on it, as a highlight. Phishing b04 and nine
   *  feedback cards showed only a kicker for 3 to 6 s (L-172). Returns {at, word}: reveal at `at`, mark at `word`. */
  H.leadAt = function (ctx) {
    const pace = (Loom.style.pack && Loom.style.pack.pace) || {};
    const lead = Math.max(ctx.start + 0.15, ctx.speechStart + (pace.lead_s == null ? 0.6 : pace.lead_s));
    // after a cut or a screen cover the new frame is on screen at once (a cut) or as the cover lifts: its first element
    // must be there too, or the frame is bare paper until the lead time, about 0.9 s after a cut (feedback-relay-v3 b07,
    // R-51). A camera join brings the station in, so the lead time stands; `continue` keeps the frame before.
    const def = ctx.def || {}, j = (def.join_in || {}).type, jw = def.join_window;
    if (j && !["camera", "travel", "zoom", "continue", "canvas"].includes(j)) {
      const shown = (jw && jw[1] > jw[0]) ? (jw[0] + jw[1]) / 2 + 0.05 : ctx.start + 0.1;
      return Math.max(ctx.start + 0.1, Math.min(lead, shown));
    }
    return lead;
  };
  H.lead = function (ctx, t) {
    const L = H.leadAt(ctx);
    return { at: Math.min(t, L), word: t, early: t - L > 0.4 };
  };
  /** when a template's STRUCTURE (its panels, page, spine, instrument, hub) must be on screen: 0.3 s after its title
   *  when H.header drew one, else the lead time. The structure may come earlier (its own words spoken first), never
   *  later: compare.two held 4 s of title alone and document.page 3 to 7.7 s of nothing (fix_tpl, 2026-10-07). */
  const TITLE_AT = new WeakMap();
  H.structAt = function (ctx) { return TITLE_AT.has(ctx) ? TITLE_AT.get(ctx) + 0.3 : H.leadAt(ctx); };
  /** reveal structure by H.structAt; returns {at, word, early}: when early, mark its words at `word` (H.mark). */
  H.leadStruct = function (ctx, t) {
    const L = H.structAt(ctx);
    return { at: Math.min(t, L), word: t, early: t - L > 0.4 };
  };
  /** A person a template draws ({member, skin, cloth, name}). When the props name a cast member (`cast: "Priya"`, or a
   *  `name` that is one), the look comes from the storyboard's story.cast (manifest.cast) and nothing else: one person,
   *  one look. Before, scenario.dialogue coloured people by the side they stood on and the heroes used fixed defaults,
   *  so one colleague changed skin and shirt between beats (bench gemini-balanced, budget's Jordan in five forms,
   *  2026-10-07). Without a cast entry the props and the template's defaults apply as before. */
  const PEEPS = ["woman", "man", "girl", "boy", "elder_woman", "elder_man"];
  const first = (s) => String(s || "").toLowerCase().split(/[\s_\-]+/)[0];
  H.castOf = function (ref) {
    if (!ref) return null;
    const cast = (Loom.manifest && Loom.manifest.cast) || [];
    return cast.find((c) => c && c.name && first(c.name) === first(ref)) || null;
  };
  H.person = function (ctx, spec, dflt) {
    spec = spec || {}; dflt = dflt || {};
    // the pack's person_cloth, per slot (`dflt.slot`: a dialogue's left 0, right 1): one token for everyone, or a list
    // so two people stay told apart (one token put both dialogue sides in the same clothes, A4 proof 2026-10-08)
    const pc = Loom.style.roleList("person_cloth", null), slotCloth = pc ? pc[(dflt.slot || 0) % pc.length] : null;
    const c = H.castOf(spec.cast) || H.castOf(spec.name);
    if (spec.cast && !c) Loom.error("cast_unknown", `${ctx.beat.id}: cast "${spec.cast}" is not in the storyboard's story.cast`, { beat: ctx.beat.id });
    if (c) {
      const member = c.member || (PEEPS.includes(c.rig) ? c.rig : null);
      if (!member) Loom.error("cast_not_drawable", `${ctx.beat.id}: ${c.name} ${c.rig ? `is a rig (${c.rig})` : "has no look in story.cast"}; templates draw peep members: give story.cast a member (with skin and cloth), or draw this beat with ctx.character`, { beat: ctx.beat.id });
      if (spec.member && member && spec.member !== member) Loom.warn("cast_overrides_props", `${ctx.beat.id}: ${c.name} is drawn as story.cast says (${member}), not as the props' member ${spec.member}`, { beat: ctx.beat.id });
      return { member: member || spec.member || dflt.member || "woman", skin: c.skin != null ? +c.skin : 0, cloth: c.cloth || slotCloth || dflt.cloth || "accent", name: spec.name || c.name, cast: c.name };
    }
    // a pack's person_cloth is the default a template person wears in its slot (props still win), WS6 2026-10-08
    return { member: spec.member || dflt.member || "woman", skin: spec.skin != null ? +spec.skin : (dflt.skin || 0), cloth: spec.cloth || slotCloth || dflt.cloth || "accent", name: spec.name, cast: null };
  };
  /** A stance tag ("Myth" or "Fact") at the right end of a header band, and the header struck through for a myth.
   *  A myth listed under "Objective facts" with nothing marking it read as a fact (bench gemini-balanced b21,
   *  2026-10-07). Returns the width the tag takes from the band (0 without a stance). The struck line is the text's own
   *  decoration (no shape over the words). */
  H.stanceTag = function (ctx, parent, stance, bandW, bandH, right) {
    if (stance !== "myth" && stance !== "fact") return 0;
    const kit = ctx.kit, label = stance === "myth" ? "MYTH" : "FACT", fill = stance === "myth" ? "neg" : "pos";
    const f = kit.fit(label, { role: "label", w: 400, maxLines: 1, weight: 800 });
    const th = Math.max(44, Math.ceil(f.height) + 16), tw = Math.ceil(f.width) + 44;
    const x = bandW - (right == null ? 30 : right) - tw, y = (bandH - th) / 2;
    kit.pill(parent, x, y, tw, th, { fill, shadow: false });
    kit.text(parent, label, { role: "label", x: x + 22, y, w: tw - 44, h: th, maxLines: 1, align: "center", valign: "middle", weight: 800, color: Loom.style.pickTokenOn(fill) });
    return tw + 20;
  };
  H.strike = function (textEl) {
    if (!textEl || !textEl.setAttribute) return;
    textEl.setAttribute("text-decoration", "line-through");
    textEl.style.textDecoration = "line-through";
    textEl.style.textDecorationThickness = "0.08em";
  };
  /** the words of an element that arrived before they were spoken still land ON the word: a highlight sweep. */
  H.mark = function (ctx, textEl, LT) { if (LT && LT.early && textEl) ctx.m.highlight(textEl, LT.word, { opacity: 0.22 }); };
  /** narration order check: reveal times must be non-decreasing in declared order. */
  H.ordered = function (ctx, times, what) {
    for (let i = 1; i < times.length; i++) if (times[i] + 0.001 < times[i - 1]) {
      Loom.warn("reveal_order", `${ctx.beat.id}: ${what} item ${i + 1} is spoken before item ${i}; screen order and speech order disagree`, { beat: ctx.beat.id });
      return false;
    }
    return true;
  };
  /** late-arrival gate: nothing arrives after ~70% of the beat's speech (lnd-visual-design s7). */
  H.lateCheck = function (ctx, t, label) {
    const f = (t - ctx.speechStart) / Math.max(0.1, ctx.speechEnd - ctx.speechStart);
    if (f > 0.85) Loom.warn("late_reveal", `${ctx.beat.id}: "${label}" arrives at ${(f * 100).toFixed(0)}% of the beat's speech`, { beat: ctx.beat.id });
  };
  /** optional kicker + title block at the top of the safe area. returns the y where content may start. */
  H.header = function (ctx, p, o) {
    o = o || {};
    const box = ctx.box;
    let y = box.y + (o.top || 10);
    const LT = p.title ? H.lead(ctx, H.when(ctx, p.say_title, 0.02, "title")) : null;
    if (p.kicker) {
      const k = ctx.el("kicker", { x: box.x, y, w: box.w, h: 40, kind: "text", exit: "sink" });
      ctx.kit.kicker(k.inner, p.kicker, { x: 0, y: 0, w: box.w, h: 36, align: o.align || "left" });
      const tk = p.say_kicker ? H.cue(ctx, p.say_kicker) : (LT ? LT.at : H.when(ctx, null, 0.0, "kicker"));
      ctx.m.drop(k, Math.max(ctx.start + 0.05, Math.min(tk, LT ? LT.at : tk) - 0.15));
      y += 54;
    }
    if (p.title) {
      const tEl = ctx.el("title", { x: box.x, y, w: box.w, h: o.titleH || 110, kind: "text", exit: "wipe" });
      const tt = ctx.kit.text(tEl.inner, p.title, { role: "title", x: 0, y: 0, w: box.w, h: o.titleH || 110, maxLines: o.titleLines || 1, align: o.align || "left", size: o.titleSize });
      ctx.m.unmask(tEl, LT.at);
      TITLE_AT.set(ctx, LT.at);
      if (LT.early) ctx.m.highlight(tt, LT.word, { opacity: 0.22 });
      y += tt.__fit.height + 36;
      H.titleText = tt;
    }
    return y;
  };
  H.iconDisc = function (ctx, parent, cx, cy, r, icon, fill, iconColor) {
    // a seeded lesson (D-82, D-83): a hero icon that stands for an object is the drawn object; any other icon takes
    // the seed's icon treatment. No seed: the classic disc, exactly as before.
    if (Loom.treat && Loom.treat.seed()) {
      const kind = Loom.obj && Loom.obj.forIcon(icon);
      // one icon family unless the lesson opts in (storyboard icon_objects, L-174)
      if (kind && r * 2 >= 100 && Loom.treat.iconObjects()) { Loom.obj.shape(parent, kind, cx, cy, r * 2.1, { key: "tpl:" + icon, detail: r > 90 ? 3 : 2, tone: fill && fill !== "surface" ? fill : undefined }); return; }
      Loom.treat.badgeShape(parent, cx, cy, r * 2, icon, fill && fill !== "surface" ? fill : "accent", { name: "tpl:" + icon });
      return;
    }
    ctx.kit.disc(parent, cx, cy, r, { fill: fill || "surface" });
    if (icon) ctx.kit.icon(parent, icon, { x: cx, y: cy, size: r * 1.05, color: iconColor || Loom.style.pickTokenOn(fill || "surface") });
  };
  /** token name whose colour reads best on a fill token (for icons/text on accent fills). */
  Loom.style.pickTokenOn = function (fillToken) {
    const P = Loom.style.pack.palette;
    // sketch fills are sparse hachure over the field: the field shows through, so ink reads best
    if (Loom.style.outlined()) return "ink";
    const fill = Loom.style.c(fillToken);
    let best = "ink", bc = 0;
    for (const t of ["ink", "field", "onAccent"]) if (t in P) { const c = Loom.style.contrast(fill, P[t]); if (c > bc) { bc = c; best = t; } }
    return best;
  };
})();
