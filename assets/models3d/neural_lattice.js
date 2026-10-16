// @model {"id": "neural_lattice", "pack": "ai_ml", "what": "a toy neural network: three to five layers of nodes (each layer a faint glass pane on a base) with every node linked to every node of the next layer; link thickness is the weight; a pulse runs forward and nodes light by their computed activation, a second pulse runs back and links change (learning), or only a marked few change (fine-tuning)", "parts": ["base", "panes", "nodes", "links", "pulses", "layer_labels", "caption"], "keys": {"forward": "0..1 a pulse travels input to output; each layer's nodes light by the activation computed from the weights shown", "backward": "0..1 a pulse returns output to input and, as it passes, some links change thickness (learning)", "tune": "0..1 only a small marked subset of links changes (fine-tuning or adapters); the rest stay frozen", "spin": "radians the lattice turns on its base", "turn": "radians about y"}, "best_for": ["what a neural network is: layers, links, weights", "training as adjusting link strengths", "fine-tuning or adapters changing a small part"], "not_for": ["a real network's size or architecture (this is a toy; the caption should say so)", "transformer internals (use transformer_stack)"], "size": [2.96, 2.17, 1.0], "sheet": {"opts": {"layers": [3, 5, 5, 2], "labels": ["input", "hidden", "hidden", "output"], "caption": "A toy network: real ones have billions of links"}, "states": [{"key": "forward", "from": 0, "to": 1, "at": 0.8, "dur": 1.6}, {"key": "backward", "from": 0, "to": 1, "at": 2.7, "dur": 1.4}, {"key": "tune", "from": 0, "to": 1, "at": 4.4, "dur": 1.0}], "elevation": 12, "turn": 1.2, "mood": "latent_space"}}
// Accuracy (topic-asset-needs 8.10): links are dense (every node of a layer to every node of the next); learning changes
// link strengths, never the number of nodes or links; node light is a real forward pass, a = sigmoid(W a_prev), on the
// weights drawn at that moment, so a thicker link really carries more. Weights come from index hashes (deterministic).
// It is a toy, and says so only through opts.caption. Layer words come only from opts.labels.
const hash = (n) => { const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const sizes = (opts.layers || [3, 5, 5, 2]).slice(0, 5).map((n) => Math.max(1, Math.min(8, n | 0)));
  while (sizes.length < 3) sizes.push(2);
  const L = sizes.length, DX = 0.72, DY = 0.3, NR = 0.07, PH = 0.1;
  const maxN = Math.max(...sizes), paneH = maxN * DY + 0.2, Y0 = PH + 0.12 + paneH / 2;   // the middle of the layers
  const BW = (L - 1) * DX + 0.7, BD = 0.7;
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const dark = K.role(ctx, "ink", opts) === "field";
  const base = K.mesh(THREE, K.rbox(THREE, X, BW, PH, BD, 0.03, 3), K.mat(ctx, THREE, dark ? "casing2" : "paper", "matte", opts)); base.position.y = PH / 2; pivot.add(base);
  const lattice = new THREE.Group(); pivot.add(lattice);
  const node = (l, i) => new THREE.Vector3(-(L - 1) * DX / 2 + l * DX, Y0 + ((sizes[l] - 1) / 2 - i) * DY, 0);

  // panes: one faint glass sheet per layer standing on the base
  const glass = K.mat(ctx, THREE, "paper2", "matte", opts, { transparent: true, opacity: dark ? 0.12 : 0.28, depthWrite: false, side: THREE.DoubleSide });
  const panes = new THREE.Group(); lattice.add(panes);
  for (let l = 0; l < L; l++) {
    const h = sizes[l] * DY + 0.16;
    const slab = K.mesh(THREE, K.rbox(THREE, X, 0.02, h, 0.34, 0.008, 2), glass, false); slab.position.set(node(l, 0).x, Y0, 0); panes.add(slab);
    const foot = K.mesh(THREE, K.rbox(THREE, X, 0.06, 0.04, 0.38, 0.01, 2), K.mat(ctx, THREE, "metal", "metal", opts)); foot.position.set(node(l, 0).x, PH + 0.02, 0); panes.add(foot);
    const stem = K.mesh(THREE, new THREE.CylinderGeometry(0.008, 0.008, Y0 - h / 2 - PH, 8), K.mat(ctx, THREE, "metal", "metal", opts)); stem.position.set(node(l, 0).x, PH + (Y0 - h / 2 - PH) / 2, 0); panes.add(stem);
  }

  // nodes, with a forward pass on the weights
  const nodes = [], cOff = K.col(ctx, "paper2", opts), cOn = K.col(ctx, "ui", opts);
  for (let l = 0; l < L; l++) { nodes.push([]); for (let i = 0; i < sizes[l]; i++) {
    const m = K.mesh(THREE, new THREE.SphereGeometry(NR, 24, 16), new THREE.MeshStandardMaterial({ color: cOff.clone(), emissive: cOn.clone(), emissiveIntensity: 0, roughness: 0.35, metalness: 0.1 }));
    m.position.copy(node(l, i)); lattice.add(m); nodes[l].push(m);
  } }
  const inputs = sizes[0] && Array.from({ length: sizes[0] }, (_, i) => (opts.inputs && opts.inputs[i] != null ? K.clamp(opts.inputs[i]) : 0.35 + 0.65 * hash(i + 3)));

  // links: dense between consecutive layers; w0 drawn, w_learn after training, w_tune after fine-tuning (a marked few)
  const links = [], linksG = new THREE.Group(); lattice.add(linksG);
  const unit = new THREE.CylinderGeometry(1, 1, 1, 8); unit.translate(0, 0.5, 0);
  const lineC = K.col(ctx, "line", opts), tuneC = K.col(ctx, "ui2", opts), up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (let l = 0; l + 1 < L; l++) for (let i = 0; i < sizes[l]; i++) for (let j = 0; j < sizes[l + 1]; j++, n++) {
    const a = node(l, i), b = node(l + 1, j), d = b.clone().sub(a);
    const w0 = hash(n * 7 + 1) * 2 - 1, learns = hash(n * 13 + 5) < 0.45, tuned = l === L - 2 ? hash(n * 17 + 9) < 0.3 : hash(n * 17 + 9) < 0.06;
    const wL = K.clamp(w0 + (hash(n * 19 + 2) * 2 - 1) * 0.9, -1, 1), wT = K.clamp(w0 + (hash(n * 23 + 4) > 0.5 ? 0.8 : -0.8), -1, 1);
    const m = new THREE.Mesh(unit, new THREE.MeshStandardMaterial({ color: lineC.clone(), roughness: 0.6, transparent: true, opacity: 0.85 }));
    m.position.copy(a); m.quaternion.setFromUnitVectors(up, d.clone().normalize()); m.userData.len = d.length(); linksG.add(m);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), new THREE.MeshBasicMaterial({ color: cOn, toneMapped: false })); pulse.visible = false; lattice.add(pulse);
    links.push({ l, i, j, a, b, m, w0, wL, wT, learns, tuned, pulse });
  }
  // labels above each layer and a caption on the base front (words only from opts)
  const billboard = (m) => { m.onBeforeRender = (r, s, cam) => { m.parent.getWorldQuaternion(m.quaternion).invert().multiply(cam.quaternion); m.updateMatrix(); m.matrixWorld.multiplyMatrices(m.parent.matrixWorld, m.matrix); }; return m; };
  const labelsG = new THREE.Group(); lattice.add(labelsG);
  (opts.labels || []).slice(0, L).forEach((s, l) => { if (!s) return; const t = billboard(K.label(ctx, THREE, s, { h: 0.13, colors: opts.colors })); t.position.set(node(l, 0).x, Y0 + paneH / 2 + 0.1, 0); labelsG.add(t); });
  let caption = null;
  if (opts.caption) {
    const cap = K.face(ctx, THREE, 2048, Math.round(2048 * (PH - 0.03) / (BW - 0.06)));
    cap.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, dark ? "casing2" : "paper", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "text", opts); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(K.fitText(g, opts.caption, w * 0.96, (q) => K.font(ctx, "body", q, 600), h * 0.72), w / 2, h / 2 + 2); });
    caption = new THREE.Mesh(new THREE.PlaneGeometry(BW - 0.06, PH - 0.03), new THREE.MeshBasicMaterial({ map: cap.tex, toneMapped: false })); caption.position.set(0, PH / 2, BD / 2 + 0.002); pivot.add(caption);
  }
  group.add(K.contactShadow(ctx, THREE, BW + 0.8, BD + 0.9, 0.4));

  const st = { forward: 0, backward: 0, tune: 0, spin: 0 };
  const sig = (x) => 1 / (1 + Math.exp(-x));
  const apply = () => {
    lattice.rotation.y = st.spin;
    const segB = (l) => K.easeInOut(K.clamp(st.backward * (L - 1) - (L - 2 - l)));    // the backward pulse has passed segment l
    const tk = K.easeInOut(st.tune);
    links.forEach((k) => { k.w = k.w0 + (k.learns ? (k.wL - k.w0) * segB(k.l) : 0) + (k.tuned ? (k.wT - k.w0) * tk : 0); });
    // the forward pass on the weights now shown
    const act = [inputs];
    for (let l = 0; l + 1 < L; l++) {
      const s = new Array(sizes[l + 1]).fill(0);
      links.forEach((k) => { if (k.l === l) s[k.j] += k.w * act[l][k.i]; });
      act.push(s.map((x) => sig(2.2 * x)));
    }
    const fx = st.forward * (L - 1);
    nodes.forEach((layer, l) => layer.forEach((m, i) => {
      const lit = st.forward > 0 ? K.clamp((fx - l) * 5 + 1) : 0, a = act[l][i];   // lights as the pulse arrives
      const e = lit * (0.2 + 0.8 * a); m.material.color.copy(cOff).lerp(cOn, e); m.material.emissiveIntensity = 0.7 * e;
    }));
    links.forEach((k) => {
      const r = 0.003 + 0.016 * Math.abs(k.w); k.m.scale.set(r, k.m.userData.len, r);
      k.m.material.color.copy(lineC).lerp(tuneC, k.tuned ? K.clamp(st.tune * 4) : 0);
      const pf = K.clamp(fx - k.l), pb = K.clamp(st.backward * (L - 1) - (L - 2 - k.l));
      if (pf > 0 && pf < 1) { k.pulse.visible = true; k.pulse.position.copy(k.a).lerp(k.b, pf); k.pulse.material.color.copy(cOn); }
      else if (pb > 0 && pb < 1 && k.learns) { k.pulse.visible = true; k.pulse.position.copy(k.b).lerp(k.a, pb); k.pulse.material.color.copy(K.col(ctx, "warm", opts)); }
      else k.pulse.visible = false;
    });
  };
  apply();
  return {
    group, size: [BW + 0.1, Y0 + paneH / 2 + 0.25, BD + 0.3], parts: { base, panes, nodes: nodes[0][0].parent, links: linksG, pulses: links[0] && links[0].pulse, layer_labels: labelsG, caption },
    keys: ["forward", "backward", "tune", "spin", "turn"],
    set(key, v) {
      if (key === "forward") { st.forward = K.clamp(v); apply(); }
      else if (key === "backward") { st.backward = K.clamp(v); apply(); }
      else if (key === "tune") { st.tune = K.clamp(v); apply(); }
      else if (key === "spin") { st.spin = v; apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
