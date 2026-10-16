// @model {"id": "balance_scale", "pack": "workplace", "what": "a two-pan beam balance (a lab balance, not a courtroom symbol): a base and pillar, a beam with a pointer over a tick arc, two pans hanging level on strings; labelled blocks drop into the pans and the beam settles to the side the caller states", "parts": ["base", "pillar", "beam", "pointer", "pans", "items"], "keys": {"load_left": "0..1 the left items (opts.left) drop into the left pan, one by one", "load_right": "0..1 the right items (opts.right) drop into the right pan", "tilt": "-1 the left pan goes down .. 0 level .. 1 the right pan goes down; the caller's statement, settling with a small overshoot, never computed from the items", "level": "0..1 the beam returns to level (a balanced judgement)", "turn": "radians about y"}, "best_for": ["weighing two options or trade-offs", "bias: one side favoured", "precision against recall", "compliance: risk against benefit"], "not_for": ["a court or legal judgement (unless the lesson is legal; this is a lab balance)", "a measured weight (the tilt is the caller's statement)"], "size": [2.2, 1.46, 0.7], "sheet": {"opts": {"left": ["Speed", "Cost"], "right": ["Quality"]}, "states": [{"key": "load_left", "from": 0, "to": 1, "at": 0.5, "dur": 1.0}, {"key": "load_right", "from": 0, "to": 1, "at": 1.4, "dur": 0.8}, {"key": "tilt", "from": 0, "to": 1, "at": 2.4, "dur": 1.2}, {"key": "level", "from": 0, "to": 1, "at": 4.4, "dur": 1.0}], "elevation": 10, "turn": 1.0, "mood": "clean_bench"}}
// Accuracy (topic-asset-needs 8.14): the tilt is the caller's value (opts.tilt or the key), never derived from item counts
// or hidden weights, so a lesson cannot "weigh" two things without saying which is heavier. Item words come only from
// opts.left and opts.right (lists); a number in their place draws that many blank blocks.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const side = (v) => (Array.isArray(v) ? v.slice(0, 3) : Array.from({ length: Math.max(0, Math.min(3, v == null ? 2 : v | 0)) }, () => ""));
  const items = [side(opts.left), side(opts.right)];
  const HALF = 0.8, PIV = 1.38, HANG = 0.62, PR = 0.27, MAXA = 0.27;
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const metal = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.28 }), shell = K.mat(ctx, THREE, "casing", "plastic", opts, { roughness: 0.45 });

  // base, pillar and the pivot head
  const base = K.mesh(THREE, K.rbox(THREE, X, 1.1, 0.1, 0.56, 0.04, 4), shell); base.position.y = 0.05; pivot.add(base);
  const foot = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.16, 0], [0.16, 0.03], [0.07, 0.08], [0, 0.08]], 40), shell); foot.position.y = 0.1; pivot.add(foot);
  const pillar = K.mesh(THREE, new THREE.CylinderGeometry(0.035, 0.045, PIV - 0.12, 24), metal); pillar.position.y = 0.1 + (PIV - 0.12) / 2; pivot.add(pillar);
  const head = K.mesh(THREE, K.rbox(THREE, X, 0.12, 0.1, 0.1, 0.02, 2), shell); head.position.y = PIV - 0.02; pivot.add(head);
  // the tick arc the pointer reads against (no numbers), on the pillar's front
  // the tick arc the pointer reads against (no numbers): ticks on the circle the pointer's tip sweeps about the pivot
  const PL = 0.6, YC = -0.58, PX = 1280;                                    // pointer length, plate centre below the pivot, px per unit
  const arc = K.face(ctx, THREE, 512, 256);
  arc.draw((g, w, h) => { g.strokeStyle = K.hexOf(ctx, "ink", opts); g.lineCap = "round";
    for (let i = -6; i <= 6; i++) { const a = i * MAXA / 6, r0 = i === 0 ? PL - 0.09 : PL - 0.06, r1 = PL - 0.01; g.lineWidth = i === 0 ? 8 : 5;
      const pt = (r) => [w / 2 + Math.sin(a) * r * PX, h / 2 - (-Math.cos(a) * r - YC) * PX];
      g.beginPath(); g.moveTo(...pt(r0)); g.lineTo(...pt(r1)); g.stroke(); } });
  const plate = K.mesh(THREE, K.rbox(THREE, X, 0.42, 0.2, 0.02, 0.01, 2), K.mat(ctx, THREE, "paper", "matte", opts)); plate.position.set(0, PIV + YC, 0.045); pivot.add(plate);
  const arcM = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: arc.tex, transparent: true, toneMapped: false })); arcM.position.set(0, PIV + YC, 0.0565); pivot.add(arcM);

  // the beam (rotates about the pivot) with a pointer hanging down in front of the pillar
  const beam = new THREE.Group(); beam.position.y = PIV; pivot.add(beam);
  const bar = K.mesh(THREE, K.rbox(THREE, X, 2 * HALF + 0.08, 0.05, 0.05, 0.02, 3), metal); beam.add(bar);
  const hub = K.mesh(THREE, new THREE.CylinderGeometry(0.045, 0.045, 0.12, 24), shell); hub.rotation.x = Math.PI / 2; beam.add(hub);
  const pointer = K.mesh(THREE, new THREE.ConeGeometry(0.014, PL - 0.04, 12), K.mat(ctx, THREE, "ui", "plastic", opts)); pointer.rotation.z = Math.PI; pointer.position.set(0, -0.04 - (PL - 0.04) / 2, 0.075); beam.add(pointer);
  // hangers: hook point at each beam end; the hanger counter-rotates so the pan stays level
  const hangers = [-1, 1].map((s) => {
    const h = new THREE.Group(); h.position.x = s * HALF; beam.add(h);
    const hook = K.mesh(THREE, new THREE.TorusGeometry(0.03, 0.009, 8, 20), metal); hook.position.y = -0.03; h.add(hook);
    const pan = new THREE.Group(); pan.position.y = -HANG; h.add(pan);
    const dish = K.mesh(THREE, K.lathe(THREE, [[0, 0], [PR * 0.75, 0], [PR, 0.05], [PR + 0.01, 0.06], [PR - 0.01, 0.06], [PR * 0.74, 0.012], [0, 0.012]], 48), metal); pan.add(dish);
    for (let k = 0; k < 3; k++) {                                           // three strings from the hook to the rim
      const a = Math.PI / 2 + k * 2 * Math.PI / 3, rim = new THREE.Vector3(Math.cos(a) * (PR - 0.01), -HANG + 0.06, Math.sin(a) * (PR - 0.01)), top = new THREE.Vector3(0, -0.055, 0);
      const d = rim.clone().sub(top), str = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, d.length(), 6), metal);
      str.position.copy(top).lerp(rim, 0.5); str.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); h.add(str);
    }
    return { h, pan, s };
  });
  // items: blocks in the side's colour with a word on the front, sitting in the pan (the third rides on top)
  const IW = 0.2, IH = 0.16, blocks = [];
  items.forEach((list, si) => list.forEach((word, i) => {
    const b = new THREE.Group(), body = K.mesh(THREE, K.rbox(THREE, X, IW, IH, IW, 0.03, 3), K.mat(ctx, THREE, si ? "cool" : "ui", "plastic", opts)); b.add(body);
    if (word) { const f = K.face(ctx, THREE, 320, 128); f.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 0, 0, w, h, h * 0.2); g.fill(); g.fillStyle = K.hexOf(ctx, "ink", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, word, w * 0.9, (q) => K.font(ctx, "body", q, 700), h * 0.5), w / 2, h / 2 + 2); });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(IW * 1.25, IW * 0.5), new THREE.MeshBasicMaterial({ map: f.tex, transparent: true, toneMapped: false })); m.position.set(0, 0, IW / 2 + 0.002); b.add(m); }
    const home = i < 2 ? new THREE.Vector3((list.length > 1 ? (i ? 1 : -1) * 0.11 : 0), 0.012 + IH / 2, 0) : new THREE.Vector3(0, 0.012 + IH * 1.5 + 0.005, 0);
    b.userData = { si, i, home }; hangers[si].pan.add(b); blocks.push(b);
  }));
  group.add(K.contactShadow(ctx, THREE, 2.4, 1.0, 0.4));

  const st = { load_left: opts.load_left == null ? 0 : K.clamp(opts.load_left), load_right: opts.load_right == null ? 0 : K.clamp(opts.load_right), tilt: K.clamp(opts.tilt || 0, -1, 1), level: 0 };
  const apply = () => {
    const t = st.tilt, a = Math.sign(t) * MAXA * K.spring(Math.abs(t), 0.3) * (1 - K.easeInOut(st.level));
    beam.rotation.z = -a;                                                    // tilt > 0: the right end goes down
    hangers.forEach((o) => { o.h.rotation.z = a; });
    blocks.forEach((b) => {
      const { si, i, home } = b.userData, n = items[si].length, ld = si ? st.load_right : st.load_left;
      const k = K.clamp(ld * (n * 0.5 + 0.5) - i * 0.5), drop = 1 - K.easeOut(k);
      b.visible = k > 0; b.position.copy(home).add(new THREE.Vector3(0, drop * 0.9, 0)); b.rotation.y = drop * 0.6 * (i % 2 ? 1 : -1);
    });
  };
  apply();
  return {
    group, size: [2 * HALF + 2 * PR + 0.06, PIV + 0.08, 0.7], parts: { base, pillar, beam, pointer, pans: hangers[0].pan, items: blocks[0] || null },
    keys: ["load_left", "load_right", "tilt", "level", "turn"],
    set(key, v) {
      if (key === "load_left") { st.load_left = K.clamp(v); apply(); }
      else if (key === "load_right") { st.load_right = K.clamp(v); apply(); }
      else if (key === "tilt") { st.tilt = K.clamp(v, -1, 1); apply(); }
      else if (key === "level") { st.level = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
