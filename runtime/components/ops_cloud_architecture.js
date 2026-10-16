// T-030 ops_cloud_architecture: a provider-neutral cloud architecture (hand-off sheet, Family B). Built on
// _app_kit.js and _dev_kit.js. Nested frames (cloud, region, availability zone, network, subnet), each with its kind's
// line (solid, dashed, a chain line in blueprint) and its name, generic service nodes (Lucide icons) placed inside, and
// links between nodes with an optional label. No provider's icons or names. A zone can fail (its nodes dim and cross)
// and a request can flow along a path of nodes. In the whiteboard and blueprint styles the words are the engine's.
Loom.component("ops_cloud_architecture", {
  version: 1,
  idea: "A cloud architecture: nested frames for the cloud, its regions, availability zones, networks and public or private subnets, generic service nodes inside them, and links between the nodes; the frames reveal from the outside in, a zone fails and its nodes go dark, a request flows along a path.",
  outline: ["nested frames, each with its kind's line style and its name", "service nodes: an icon disc and a label", "links between nodes, a label on a pill", "outage: a failed frame washed and its nodes crossed", "a token that flows along a path"],
  family: "ops",
  tags: ["cloud architecture", "region", "availability zone", "virtual network", "subnet", "high availability", "multi-region", "network boundary", "data residency", "three tier"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-030)",
  styles: ["corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    frames: { type: "obj", content: true },        // {id, kind: cloud|region|zone|network|subnet, label, public?, dir?: "h"|"v", children: [frames]}
    nodes: { type: "list", content: true },        // [{id, frame, icon (Lucide name), label}]
    links: { type: "list", default: [] },          // [[from, to, label?]] (content when given)
    w: { type: "number", default: 1700 }, h: { type: "number", default: 900 },
    at: { type: "number", default: -1 },
    steps: { type: "list", default: [] },          // [{do: "outage", frame, at} | {do: "flow", path: [node ids], at, dur}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["frames{id}", "nodes{id}", "links[]", "reveal(order, t)", "outage(frameId, t)", "flow(path, t)"],
  example: 'ctx.use("ops_cloud_architecture", { frames: { id: "c", kind: "cloud", label: "Cloud", children: [{ id: "r", kind: "region", label: "Europe West", children: [{ id: "z1", kind: "zone", label: "Zone A" }, { id: "z2", kind: "zone", label: "Zone B" }] }] }, nodes: [{ id: "a", frame: "z1", icon: "server", label: "app" }, { id: "b", frame: "z2", icon: "server", label: "app" }], links: [["a", "b", "sync"]], at: ctx.cue("two zones") }, { x: 110, y: 90, name: "arch" })',
  size: (p) => ({ w: p.w, h: Loom.devKit.archLayout(p).h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const { Z } = DK.ui();
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const field = S.c("field"), surface = S.c("surface"), ink = S.c("ink");
    if (!p.frames || !p.frames.id) { Loom.error("component_params", "ops_cloud_architecture: frames must be one frame {id, kind, label, children}"); return {}; }
    const L = DK.archLayout(p), engK = L.engK, { F, NODE, byFrame, nodeW, iconR, padI } = L;
    const headOf = (f) => L.headOf(f.depth);
    const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 600);
    const blueprint = (S.pack && S.pack.id) === "blueprint";
    const KIND = {
      cloud: { icon: "cloud", stroke: "line", sw: 2.5, dash: null, tone: null },
      region: { icon: "map-pin", stroke: "accent", sw: 2.2, dash: blueprint ? "22 6 4 6" : "14 8", tone: null },
      zone: { icon: "layers", stroke: "muted", sw: 2, dash: blueprint ? "22 6 4 6" : "6 6", tone: null },
      network: { icon: "network", stroke: "accent3", sw: 2, dash: null, tone: "accent3" },
      subnet: { icon: "lock", stroke: null, sw: 1.5, dash: null, tone: "accent" },
    };
    // ---- frames, outer to inner; each frame's name sits on a plate of its own fill, above the links, so a link passes
    // behind a name instead of through it
    const frameG = svg("g", {}, g), linkG = svg("g", {}, g), plateG = svg("g", {}, g), nodeG = svg("g", {}, g), wordG = svg("g", {}, g), fxG = svg("g", {}, g);
    const order = Object.values(F).sort((a, b) => a.depth - b.depth);
    order.forEach((f) => {
      const fg = svg("g", {}, frameG), K0 = KIND[f.kind] || KIND.zone, tone = K0.tone ? S.c(f.fr.public && f.kind === "subnet" ? "pos" : K0.tone) : null;
      f.K = K0;
      f.bg = tone ? S.mix(field, tone, f.kind === "subnet" ? 0.12 : 0.05) : f.parent ? F[f.parent].bg : field;
      if (tone) svg("rect", { x: f1(f.x), y: f1(f.y), width: f1(f.w), height: f1(f.h), rx: 14, fill: f.bg }, fg);
      if (K0.stroke) svg("rect", { x: f1(f.x), y: f1(f.y), width: f1(f.w), height: f1(f.h), rx: f.kind === "cloud" ? 22 : 14, fill: "none", stroke: DK.legible(K0.stroke, field, ink, 2.5), "stroke-width": K0.sw, "stroke-dasharray": K0.dash }, fg);
      const size = f.depth <= 1 ? Z.fs : Z.small, text = String(f.fr.label == null ? "" : f.fr.label);
      const tw = Math.min(f.w - 52, AK.measure(text, "caption", size, 700) * engK + 8);
      f.labelW = tw;
      const headH = headOf(f);
      // the plate and the frame's icon: a group of their own above the links, revealed with the frame
      f.pg = svg("g", {}, plateG);
      f.plate = svg("rect", { x: f1(f.x + 8), y: f1(f.y + 5), width: f1(tw + 40), height: f1(headH - 6), rx: 8, fill: f.bg }, f.pg);
      const ic = f.kind === "subnet" && f.fr.public ? "globe" : K0.icon;
      AK.icon(f.pg, ic, f.x + 22, f.y + headH / 2 + 2, 22, f.kind === "subnet" ? (f.fr.public ? "pos" : "accent") : "muted");
      f.label = DK.word(ctx, wordG, text, { x: f.x + 40, y: f.y + 2, w: Math.max(20, f.w - 52), h: headH, size, weight: 700, color: f.depth <= 1 ? "ink" : "muted", at: animated ? p.at + f.depth * 0.3 : -1, eng, pen, name: `frame_${f.fr.id}`, kind: "label" });
      f.g = fg;
    });
    // ---- links under the nodes: the paths first, then each label's pill where no other link crosses it
    const labH = lhS * 2 + 10;
    const nodeBottom = (N0) => N0.cy + iconR + 8 + N0.lines * lhS;
    // the frames holding a node, outermost first
    const chain = (fid) => { const out = []; for (let f = F[fid]; f; f = f.parent ? F[f.parent] : null) out.unshift(f); return out; };
    // a polyline's point at a share t of its length
    const along = (pts) => {
      const seg = pts.slice(1).map((q, k) => Math.hypot(q[0] - pts[k][0], q[1] - pts[k][1])), tot = seg.reduce((a, b) => a + b, 0) || 1;
      return (t) => { let d = t * tot; for (let k = 0; k < seg.length; k++) { if (d <= seg[k] || k === seg.length - 1) { const u = seg[k] ? Math.min(1, d / seg[k]) : 0; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * u, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * u]; } d -= seg[k]; } return pts[pts.length - 1]; };
    };
    const paths = [];
    (p.links || []).forEach((lk, i) => {
      const [a, b, label] = lk;
      let A = NODE[a], B = NODE[b];
      if (!A || !B) { Loom.error("component_params", `ops_cloud_architecture: link ${i} names a node that does not exist (${a} to ${b})`); return; }
      const flip = B.cy < A.cy - 1; if (flip) [A, B] = [B, A];
      let pts, d = "";
      if (B.cy - A.cy > iconR + labH) {
        // a node in a lower row: out under the upper node's label, across in the gap above the frame the lower node
        // sits in (the outermost one the upper node is not in), down onto the lower disc, an elbow with round corners
        const x0 = A.cx, y0 = nodeBottom(A), x1 = B.cx, y1 = B.cy - iconR - 6;
        const outer = chain(B.frame).find((f) => !chain(A.frame).includes(f));
        const T = outer ? outer.y : y1 - 20, ym = T > y0 + 8 ? (y0 + T) / 2 : (y0 + y1) / 2;
        if (Math.abs(x1 - x0) < 4) { pts = [[x0, y0], [x0, y1]]; d = `M${f1(x0)} ${f1(y0)} L${f1(x0)} ${f1(y1)}`; }
        else {
          const r = Math.min(12, Math.abs(x1 - x0) / 2, (ym - y0) / 2, (y1 - ym) / 2), sx = Math.sign(x1 - x0);
          pts = [[x0, y0], [x0, ym], [x1, ym], [x1, y1]];
          d = `M${f1(x0)} ${f1(y0)} L${f1(x0)} ${f1(ym - r)} Q${f1(x0)} ${f1(ym)} ${f1(x0 + sx * r)} ${f1(ym)} L${f1(x1 - sx * r)} ${f1(ym)} Q${f1(x1)} ${f1(ym)} ${f1(x1)} ${f1(ym + r)} L${f1(x1)} ${f1(y1)}`;
        }
      } else {
        // a node in the same row: a straight line between the discs, bowed around any node in its way, to the side
        // that crosses fewer names and lines
        const dx = B.cx - A.cx, dy = B.cy - A.cy, dd = Math.hypot(dx, dy) || 1;
        const x0 = A.cx + dx / dd * (iconR + 6), y0 = A.cy + dy / dd * (iconR + 6), x1 = B.cx - dx / dd * (iconR + 6), y1 = B.cy - dy / dd * (iconR + 6);
        const near = Object.values(NODE).filter((N1) => N1 !== A && N1 !== B).some((N1) => {
          const L2 = (x1 - x0) ** 2 + (y1 - y0) ** 2 || 1, u = Math.max(0, Math.min(1, ((N1.cx - x0) * (x1 - x0) + (N1.cy - y0) * (y1 - y0)) / L2));
          const px = x0 + u * (x1 - x0), py = y0 + u * (y1 - y0);
          return Math.hypot(N1.cx - px, (N1.cy + lhS) - py) < iconR + lhS + 18 && u > 0.02 && u < 0.98;
        });
        if (!near) { pts = [[x0, y0], [x1, y1]]; d = `M${f1(x0)} ${f1(y0)} L${f1(x1)} ${f1(y1)}`; }
        else {
          // the bow just clears the nodes in its way (their discs going over, their labels going under)
          const ll = Math.hypot(x1 - x0, y1 - y0) || 1;
          const amp = (sgn) => Math.max(40, ...Object.values(NODE).filter((N1) => N1 !== A && N1 !== B).map((N1) => {
            const u = ((N1.cx - x0) * (x1 - x0) + (N1.cy - y0) * (y1 - y0)) / (ll * ll);
            if (u <= 0.02 || u >= 0.98) return 0;
            const ly = y0 + u * (y1 - y0), needD = sgn > 0 ? nodeBottom(N1) + 18 - ly : ly - (N1.cy - iconR - 18);
            return Math.abs(N1.cx - (x0 + u * (x1 - x0))) < iconR + 60 && needD > 0 ? needD / (2 * u * (1 - u)) : 0;
          }));
          const curveOf = (bend) => { const qx = (x0 + x1) / 2 - ((y1 - y0) / ll) * bend, qy = (y0 + y1) / 2 + ((x1 - x0) / ll) * bend; return { qx, qy, pts: Array.from({ length: 17 }, (_, k) => { const t = k / 16; return [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * qx + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * qy + t * t * y1]; }) }; };
          const cost = (C) => C.pts.reduce((a, [x, y]) => a + Object.values(F).filter((f) => x > f.x + 8 && x < f.x + 48 + (f.labelW || 0) && y > f.y && y < f.y + headOf(f)).length + Object.values(NODE).filter((N1) => N1 !== A && N1 !== B && Math.abs(x - N1.cx) < iconR + 10 && y > N1.cy - iconR - 6 && y < nodeBottom(N1)).length * 3, 0);
          // the bend's sign turns with the line's direction: a right-to-left line bends down for a negative bend
          const sx = Math.sign(x1 - x0) || 1, up = curveOf(-amp(-1) * sx), dn = curveOf(amp(1) * sx), C = cost(dn) <= cost(up) ? dn : up;
          pts = C.pts; d = `M${f1(x0)} ${f1(y0)} Q${f1(C.qx)} ${f1(C.qy)} ${f1(x1)} ${f1(y1)}`;
        }
      }
      const poly = pts.length > 2 || pts.length < 2 ? pts : Array.from({ length: 9 }, (_, k) => [pts[0][0] + (pts[1][0] - pts[0][0]) * k / 8, pts[0][1] + (pts[1][1] - pts[0][1]) * k / 8]);
      // the hop's whole route from disc centre to disc centre, in the link's own direction (a flow token follows it)
      const route = [[A.cx, A.cy]].concat(pts, [[B.cx, B.cy]]);
      paths.push({ i, a, b, label, d, poly, at: along(pts), route: flip ? route.slice().reverse() : route });
    });
    const segHits = (q, R) => {
      // does the polyline q cross the box R (x0, y0, x1, y1)?
      for (let k = 1; k < q.length; k++) {
        const [ax, ay] = q[k - 1], [bx, by] = q[k];
        for (let s2 = 0; s2 <= 8; s2++) { const x = ax + (bx - ax) * s2 / 8, y = ay + (by - ay) * s2 / 8; if (x > R[0] && x < R[2] && y > R[1] && y < R[3]) return true; }
      }
      return false;
    };
    const links = [];
    paths.forEach((P) => {
      const lg = svg("g", {}, linkG);
      svg("path", { d: P.d, fill: "none", stroke: S.c("line"), "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round" }, lg);
      let lab = null;
      if (P.label) {
        const tw = AK.measure(String(P.label), "caption", Z.small, 600) * engK + 20, ph = lhS + 8;
        // the pill's place along its link: the middle when it is clear, else the nearest place no other link, node or
        // frame edge runs through (the middle had sat a load balancer's line through "replication", 2026-10-16 review)
        let best = null;
        for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          const [mx, my] = P.at(t), R = [mx - tw / 2 - 4, my - ph / 2 - 4, mx + tw / 2 + 4, my + ph / 2 + 4];
          let score = 0;
          paths.forEach((Q) => { if (Q !== P && segHits(Q.poly, R)) score += 10; });
          // a node with its label (and a margin, so a pill never reads as part of a node's name)
          Object.values(NODE).forEach((N1) => { const hw = Math.max(iconR, (AK.measure(N1.n.label, "caption", Z.small, 600) * engK) / Math.max(1, N1.lines || 1) / 2) + 14; if (N1.cx + hw > R[0] && N1.cx - hw < R[2] && nodeBottom(N1) + 10 > R[1] && N1.cy - iconR - 6 < R[3]) score += 10; });
          // a frame's name plate
          Object.values(F).forEach((f) => { if (f.x + 8 < R[2] && f.x + 48 + (f.labelW || 0) > R[0] && f.y + 5 < R[3] && f.y + headOf(f) > R[1]) score += 10; });
          Object.values(F).forEach((f) => {
            const inX = R[0] > f.x && R[2] < f.x + f.w, inY = R[1] > f.y && R[3] < f.y + f.h, over = R[2] > f.x && R[0] < f.x + f.w && R[3] > f.y && R[1] < f.y + f.h;
            if (over && !(inX && inY)) score += 2;
          });
          score += Math.abs(t - 0.5);
          if (!best || score < best.score) best = { score, mx, my };
        }
        const { mx, my } = best;
        svg("rect", { x: f1(mx - tw / 2), y: f1(my - ph / 2), width: f1(tw), height: f1(ph), rx: ph / 2, fill: surface, stroke: S.mix(S.c("line"), surface, 0.4), "stroke-width": 1.5 }, lg);
        lab = DK.word(ctx, wordG, String(P.label), { x: mx - tw / 2, y: my - ph / 2, w: tw, h: ph, size: Z.small, weight: 600, align: "center", at: -1, eng, pen, name: `link_${P.i}`, kind: "label" });
      }
      links.push({ g: lg, from: P.a, to: P.b, label: lab, route: P.route });
    });
    // ---- nodes
    Object.values(NODE).forEach((N0) => {
      const ng = svg("g", {}, nodeG);
      svg("circle", { cx: f1(N0.cx), cy: f1(N0.cy), r: iconR, fill: surface }, ng);
      K.disc(ng, N0.cx, N0.cy, iconR, { fill: "surface", stroke: "ink", sw: 2 });
      AK.icon(ng, N0.n.icon, N0.cx, N0.cy, 30, "ink");
      const fw = F[N0.frame], sw = L.slotW(N0.frame) + 8;
      N0.label = DK.word(ctx, wordG, N0.n.label, { x: N0.cx - sw / 2 + 4, y: N0.cy + iconR + 6, w: sw - 8, h: lhS * (N0.lines || 2) + 2, size: Z.small, weight: 600, align: "center", maxLines: N0.lines || 2, at: -1, eng, pen, name: `node_${N0.n.id}`, kind: "label" });
      const cross = svg("g", { opacity: 0 }, ng);
      const nc = DK.legible("neg", surface, ink, 3);
      svg("path", { d: `M${f1(N0.cx - 16)} ${f1(N0.cy - 16)} L${f1(N0.cx + 16)} ${f1(N0.cy + 16)} M${f1(N0.cx + 16)} ${f1(N0.cy - 16)} L${f1(N0.cx - 16)} ${f1(N0.cy + 16)}`, stroke: nc, "stroke-width": 5, "stroke-linecap": "round" }, cross);
      N0.g = ng; N0.cross = cross;
      if (fw) fw.nodes.push(N0);
    });
    const parts = { frames: F, nodes: NODE, links };
    // ---- state functions
    const labelNode = (w) => (w && w.nodeType ? w : null);
    parts.reveal = function (ordr, t) {
      // outer to inner: each depth a beat later, then the nodes, then the links
      const fs = ordr && ordr.length ? ordr.map((id) => F[id]).filter(Boolean) : order;
      let te = t;
      fs.forEach((f, k) => { const ti = ordr && ordr.length ? t + k * 0.3 : t + f.depth * 0.3; AK.show(f.g, ti, 0.35); AK.show(f.pg, ti, 0.35); if (labelNode(f.label)) AK.show(f.label, ti + 0.1, 0.3); te = Math.max(te, ti + 0.4); });
      Object.values(NODE).forEach((N0, k) => { AK.show(N0.g, te + k * 0.05, 0.25); if (labelNode(N0.label)) AK.show(N0.label, te + k * 0.05, 0.25); });
      te += Object.keys(NODE).length * 0.05 + 0.3;
      links.forEach((L0, k) => { AK.show(L0.g, te + k * 0.08, 0.3); if (labelNode(L0.label)) AK.show(L0.label, te + k * 0.08, 0.3); });
      return te + links.length * 0.08 + 0.3;
    };
    const inside = (id) => { const out = []; const walk = (fr) => { out.push(fr.id); (fr.children || []).forEach(walk); }; if (F[id]) walk(F[id].fr); return out; };
    parts.outage = function (id, t) {
      const f = F[id];
      if (!f) return t;
      const og = svg("g", { opacity: 0 }, fxG), nc = DK.legible("neg", field, ink, 3);
      svg("rect", { x: f1(f.x), y: f1(f.y), width: f1(f.w), height: f1(f.h), rx: 14, fill: S.mix(field, S.c("neg"), 0.1), stroke: nc, "stroke-width": 3, "stroke-dasharray": "10 6", opacity: 0.9 }, og);
      frameG.appendChild(og);
      AK.show(og, t, 0.3);
      const ids = inside(id);
      // the name plates inside take the wash too (they sit above it, and would show as unwashed patches)
      const wash = S.mix(field, S.c("neg"), 0.1);
      ids.forEach((fid) => { const fi = F[fid]; if (fi && fi.plate) Loom.tween(fi.plate, { fill: fi.bg }, { fill: S.mix(fi.bg, wash, 0.9), duration: 0.3 }, t, DK.meta("state", "arch.outage")); });
      Object.values(NODE).filter((N0) => ids.includes(N0.frame)).forEach((N0) => { Loom.tween(N0.g, { opacity: 1 }, { opacity: 0.5, duration: 0.3 }, t + 0.2, DK.meta("state", "arch.outage")); AK.show(N0.cross, t + 0.3, 0.25); });
      return t + 0.6;
    };
    parts.flow = function (path, t, dur) {
      const ids = (path || []).filter((id) => NODE[id]);
      if (ids.length < 2) return t;
      // the token follows each hop's link (its elbow or bow); a hop with no link goes straight between the discs
      let pts = [[NODE[ids[0]].cx, NODE[ids[0]].cy]];
      for (let k = 1; k < ids.length; k++) {
        const Lk = links.find((L0) => L0.from === ids[k - 1] && L0.to === ids[k]) || links.find((L0) => L0.from === ids[k] && L0.to === ids[k - 1]);
        const r = Lk ? (Lk.from === ids[k - 1] ? Lk.route : Lk.route.slice().reverse()) : [[NODE[ids[k - 1]].cx, NODE[ids[k - 1]].cy], [NODE[ids[k]].cx, NODE[ids[k]].cy]];
        pts = pts.concat(r.slice(1));
      }
      const go = along(pts);
      const tok = svg("circle", { r: 11, cx: f1(pts[0][0]), cy: f1(pts[0][1]), fill: S.c("accent"), stroke: surface, "stroke-width": 3, opacity: 0 }, fxG);
      const D = dur || 0.6 * (ids.length - 1);
      Loom.drive((e, raw) => {
        const [x, y] = go(Math.min(1, raw));
        tok.setAttribute("cx", f1(x)); tok.setAttribute("cy", f1(y));
        tok.setAttribute("opacity", raw > 0 && raw < 1 ? 1 : 0);
      }, t, D, "linear", DK.meta("travel", "arch.flow"));
      return t + D;
    };
    if (animated && !pen) parts.reveal(null, p.at);
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "outage") parts.outage(st.frame, st.at);
      else if (st.do === "flow") parts.flow(st.path, st.at, st.dur);
      else if (st.do === "reveal") parts.reveal(st.order, st.at);
      else Loom.error("component_params", `ops_cloud_architecture: step "${st.do}" is not reveal, outage or flow`);
    }
    return parts;
  },
});

// the architecture's geometry, shared by size() and build(): every frame as tall as its content needs (siblings side by
// side share the tallest one's height), h the most the whole may take; a frame's own nodes spread across it (a leaf) or
// centred above its frames. It had split a fixed h by weight, zones twice the height of their nodes (2026-10-16 review).
Loom.devKit.archLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.6; else if (e && e.id === "blueprint") engK = 1.35; } catch (e) { engK = 1; }
  const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 600);
  const nodes = (p.nodes || []).map((n, i) => Object.assign({ id: "n" + i, icon: "server" }, n, { label: String(n.label == null ? "" : n.label) }));
  const byFrame = {}; nodes.forEach((n) => (byFrame[n.frame] = byFrame[n.frame] || []).push(n));
  const F = {}, NODE = {}, innerW = {};   // innerW: each frame's inner width (the params are never written to)
  const nodeW = 150, iconR = 30;
  const padI = 14, gapI = 16, busGap = 26;
  // the outer two frames name themselves in the caption size, the inner ones in the small size
  const headOf = (depth) => (depth <= 1 ? lh : lhS) + 12;
  // a node's label takes one line or two at its slot's width; a frame's row is as tall as its tallest node
  // a node's label width: its slot, up to 170 px in a leaf frame, up to 260 px in a row above frames (that row has the
  // frame's whole width: "web application firewall" had been cut to "web application..." at 170)
  const slotW = (fid) => { const fr = findFrame(p.frames, fid), n = (byFrame[fid] || []).length || 1; return fr ? Math.min((fr.children || []).length ? 260 : nodeW + 20, (innerW[fid] || p.w) / n) - 8 : nodeW; };
  const linesOf = (n, w) => (AK.measure(n.label, "caption", Z.small, 600) * engK > w - 4 ? 2 : 1);
  const rowH = (fid) => iconR * 2 + 8 + Math.max(1, ...(byFrame[fid] || []).map((n) => n.__lines || 2)) * lhS + 4;
  if (!p.frames || !p.frames.id) return { engK, F, NODE, byFrame, nodeW, iconR, headOf, padI, h: p.h || 400 };
  function findFrame(fr, id) { if (!fr) return null; if (fr.id === id) return fr; for (const c of fr.children || []) { const r = findFrame(c, id); if (r) return r; } return null; }
  const weight = (fr) => Math.max(1, (byFrame[fr.id] || []).length, (fr.children || []).reduce((a, c) => a + weight(c), 0));
  const dirOf = (fr) => fr.dir || (fr.kind === "zone" ? "v" : "h");
  // a row of nodes above frames keeps a gap under it, where the links down to the frames run across
  const ownH = (fr) => ((byFrame[fr.id] || []).length ? rowH(fr.id) + 8 + ((fr.children || []).length ? busGap : 0) : 0);
  // the height a frame's content needs
  const nat = (fr, depth) => {
    const kids = fr.children || [], headH = headOf(depth || 0);
    if (!kids.length) return headH + ((byFrame[fr.id] || []).length ? rowH(fr.id) : 24) + padI;
    const hs = kids.map((c) => nat(c, (depth || 0) + 1));
    return headH + ownH(fr) + (dirOf(fr) === "h" ? Math.max(...hs) : hs.reduce((a, b) => a + b, 0) + (kids.length - 1) * gapI) + padI;
  };
  function place(fr, x, y, w, h, depth, parent) {
    F[fr.id] = { fr, x, y, w, h, depth, kind: fr.kind, nodes: [], parent };
    const own = byFrame[fr.id] || [], kids = fr.children || [], headH = headOf(depth);
    let iy = y + headH, ih = h - headH - padI;
    if (own.length) {
      const nodeH = rowH(fr.id);
      if (!kids.length) {
        // a leaf: its nodes spread across it, centred in its height
        const slot = (w - 2 * padI) / own.length, ny = iy + Math.max(0, (ih - nodeH) / 2);
        own.forEach((n, i) => { NODE[n.id] = { n, cx: x + padI + slot * (i + 0.5), cy: ny + iconR + 4, frame: fr.id, lines: n.__lines }; });
      } else {
        // above its frames: a row centred on the frame
        const sw = Math.min(270, (w - 2 * padI) / own.length), x0 = x + w / 2 - (sw * own.length) / 2;
        own.forEach((n, i) => { NODE[n.id] = { n, cx: x0 + sw * (i + 0.5), cy: iy + iconR + 4, frame: fr.id, lines: n.__lines }; });
      }
      iy += ownH(fr); ih -= ownH(fr);
    }
    if (!kids.length) return;
    const tot = kids.reduce((a, c) => a + weight(c), 0);
    if (dirOf(fr) === "h") {
      let cx = x + padI;
      const aw = w - 2 * padI - (kids.length - 1) * gapI;
      kids.forEach((c) => { const cw = aw * weight(c) / tot; place(c, cx, iy, cw, ih, depth + 1, fr.id); cx += cw + gapI; });
    } else {
      // stacked: each its natural height, the room left over shared out in proportion
      const hs = kids.map((c) => nat(c, depth + 1)), need = hs.reduce((a, b) => a + b, 0) + (kids.length - 1) * gapI, k = need > 0 ? Math.max(1, ih / need) : 1;
      let cy = iy;
      kids.forEach((c, j) => { const ch = hs[j] * k; place(c, x + padI, cy, w - 2 * padI, ch, depth + 1, fr.id); cy += ch + gapI * k; });
    }
  }
  // widths first (they decide each label's lines), then heights
  (function widths(fr, w) {
    innerW[fr.id] = w - 2 * padI;
    const kids = fr.children || [];
    if (!kids.length) return;
    if (dirOf(fr) === "h") { const tot = kids.reduce((a, c) => a + weight(c), 0), aw = w - 2 * padI - (kids.length - 1) * gapI; kids.forEach((c) => widths(c, aw * weight(c) / tot)); }
    else kids.forEach((c) => widths(c, w - 2 * padI));
  })(p.frames, p.w);
  nodes.forEach((n) => { n.__lines = linesOf(n, slotW(n.frame)); });
  const need = nat(p.frames, 0);
  if (p.h && need > p.h) Loom.warn("dev_arch_tall", `ops_cloud_architecture: the frames need ${Math.round(need)} px but h is ${p.h} (drawn at ${Math.round(need)})`);
  const H = Math.ceil(need);
  place(p.frames, 0, 0, p.w, H, 0, null);
  // in a frame of several nodes, each node takes the slot nearest the nodes it links to in other frames (two passes of
  // the barycentre rule): a replication link then runs between neighbours instead of bowing over a node between them
  const partners = (id) => (p.links || []).filter((l) => l && (l[0] === id || l[1] === id)).map((l) => (l[0] === id ? l[1] : l[0])).filter((q) => NODE[q] && NODE[q].frame !== NODE[id].frame);
  for (let pass = 0; pass < 2; pass++) {
    Object.keys(byFrame).forEach((fid) => {
      const own = byFrame[fid];
      if (!own || own.length < 2 || !F[fid]) return;
      const slots = own.map((n) => NODE[n.id].cx).sort((a, b) => a - b);
      const key = own.map((n) => { const q = partners(n.id); return q.length ? q.reduce((a, id) => a + NODE[id].cx, 0) / q.length : NODE[n.id].cx; });
      const ord = own.map((n, k) => k).sort((u, v) => key[u] - key[v] || u - v);
      ord.forEach((k, j) => { NODE[own[k].id].cx = slots[j]; });
    });
  }
  return { engK, F, NODE, byFrame, nodeW, iconR, headOf, padI, h: H, slotW };
};
