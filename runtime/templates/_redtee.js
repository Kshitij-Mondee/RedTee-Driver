/* RedTee bridge runtime: place a RedTee blueprint SVG in a station and re-time its CSS reveal
 * groups onto narration cues (CSS animations off, timeline tweens on - so it is seekable). */
(function () {
  "use strict";
  const Loom = window.Loom;
  const CLASSES = ["reveal", "grow", "growx", "pop", "draw", "stamp", "drop", "settle", "unmask", "unmask-c", "unmask-d", "swirlin", "puffin", "focusin", "rollin", "blurslidel", "flipin", "slitin", "popdown"];
  Loom.redtee = {
    scene(ctx, def) {
      const r = def.rect || [96, 84, 1728, 846];
      const E = ctx.el(def.name || "redtee", { x: r[0], y: r[1], w: r[2], h: r[3], kind: "template", exit: "recede" });
      const doc = new DOMParser().parseFromString(def.svg || "", "image/svg+xml");
      const svgEl = doc.documentElement;
      if (!svgEl || svgEl.nodeName !== "svg") { Loom.error("redtee_bad_svg", ctx.beat.id); return; }
      const node = document.importNode(svgEl, true);
      node.setAttribute("x", 0); node.setAttribute("y", 0); node.setAttribute("width", r[2]); node.setAttribute("height", r[3]);
      E.inner.appendChild(node);
      const groups = Array.from(node.querySelectorAll("[class]")).filter((g) => CLASSES.some((c) => g.classList.contains(c)));
      const ord = (g) => { const m = (g.getAttribute("style") || "").match(/--i\s*:\s*(-?[\d.]+)/); return m ? +m[1] : 0; };
      const maxI = Math.max(0, ...groups.map(ord));
      const cues = def.order_cues || [];
      const asked = {};
      const tFor = (i) => {
        const k = Math.round(i);
        // the first reveal group is the blueprint's structure: on screen by the lead time (D-100), whatever its cue;
        // each cue is asked once (ctx.cue logs every call)
        if (k === 0 && Loom.th && Loom.th.leadAt) return Math.min(tRaw(0), Loom.th.leadAt(ctx));
        return tRaw(i);
      };
      const tRaw = (i) => {
        const k = Math.round(i);
        if (cues[k]) return k in asked ? asked[k] : (asked[k] = ctx.cue(cues[k]));
        if (cues.length) Loom.warn("redtee_unanchored", `${ctx.beat.id}: reveal ${k} has no order_cue`);
        return ctx.speechStart + 0.15 + (ctx.speechEnd - ctx.speechStart) * 0.65 * (maxI ? i / maxI : 0);
      };
      const e = Loom.ease;
      for (const g of groups) {
        g.style.animation = "none";
        const t = tFor(ord(g));
        const cl = CLASSES.find((c) => g.classList.contains(c));
        const meta = { kind: "redtee:" + cl, beat: ctx.beat.id, name: "redtee" };
        if (cl === "draw") {
          const paths = g.matches("path,line,polyline") ? [g] : Array.from(g.querySelectorAll("path,line,polyline"));
          for (const p of paths) { const L = p.getTotalLength ? p.getTotalLength() : 600; p.style.strokeDasharray = `${L} ${L + 24}`; Loom.tween(p, { strokeDashoffset: L + 10 }, { strokeDashoffset: 0, duration: 0.8, ease: e.move }, t, meta); }
          continue;
        }
        const from = { opacity: 0 }, to = { opacity: 1, duration: Loom.style.dur("enter"), ease: e.enter };
        if (cl === "grow") { Object.assign(from, { scaleY: 0, transformOrigin: "50% 100%" }); to.scaleY = 1; to.duration *= 1.3; }
        else if (cl === "growx") { Object.assign(from, { scaleX: 0, transformOrigin: "0% 50%" }); to.scaleX = 1; to.duration *= 1.3; }
        else if (["pop", "popdown", "swirlin", "puffin", "rollin"].includes(cl)) { Object.assign(from, { scale: 0.6, transformOrigin: "50% 50%" }); to.scale = 1; }
        else if (cl === "stamp") { Object.assign(from, { scale: 1.3, transformOrigin: "50% 50%" }); to.scale = 1; }
        else if (cl === "drop") { from.y = -30; to.y = 0; }
        else if (cl.startsWith("unmask") || cl === "blurslidel") { from.x = -14; to.x = 0; }
        else { from.y = 16; to.y = 0; }
        Loom.tween(g, from, to, t, meta);
      }
      E.revealT = tFor(0);
    },
  };
})();
