// @model {"id": "bicycle", "pack": "workplace", "what": "a road bicycle at real proportions (metres): a diamond frame of tubes (top, down and seat tubes, chain and seat stays), a raked fork, two 700c wheels with rims, tyres, hubs and 32 spokes each, a drivetrain (chainring with teeth, cranks, pedals, a rear cassette and the chain), a saddle on its post, a stem and a flat bar", "parts": ["frame", "fork", "front_wheel", "rear_wheel", "drivetrain", "saddle", "handlebar"], "keys": {"spin": "radians the wheels have turned", "pedal": "radians the cranks have turned", "turn": "radians about y"}, "best_for": ["cycling to work, commuting and travel policy", "a product explainer of a mechanical system (how parts connect)", "an exploded view of an assembly", "sustainability and transport"], "not_for": ["a motorbike or a car", "a person riding (people come from character kits)"], "size": [1.72, 1.05, 0.64], "sheet": {"states": [{"key": "spin", "from": 0, "to": 12, "at": 0, "dur": 6}, {"key": "pedal", "from": 0, "to": 6, "at": 0, "dur": 6}]}}
// Geometry in metres: wheelbase 1.0, wheel diameter 0.68, bottom bracket 0.27 high, seat tube 73.5 degrees, head tube
// 72 degrees. The bike faces +x; z is across it (the drive side is +z). Words: none.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot);
  const metal = K.mat(ctx, THREE, "metal", "metal", opts), frameM = K.mat(ctx, THREE, "casing", "gloss", opts);
  const rubber = K.mat(ctx, THREE, "trim", "rubber", opts), dark = K.mat(ctx, THREE, "casing2", "plastic", opts);
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const tubeBetween = (a, b, r, m, parent) => {
    const d = b.clone().sub(a), L = d.length(), o = K.mesh(THREE, new THREE.CylinderGeometry(r, r, L, 18, 1), m);
    o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); parent.add(o); return o;
  };
  const curve = (pts, r, m, parent, seg = 32) => { const c = new THREE.CatmullRomCurve3(pts, false, "centripetal"); const o = K.mesh(THREE, new THREE.TubeGeometry(c, seg, r, 10, false), m); parent.add(o); return o; };
  const RA = V(-0.5, 0.34), FA = V(0.5, 0.34), BB = V(-0.08, 0.27);
  const ST = V(-0.228, 0.769), HTt = V(0.36, 0.8), HTb = V(0.406, 0.657);

  // the frame: a diamond of tubes, the stays in pairs either side of the rear wheel
  const frame = new THREE.Group(); pivot.add(frame);
  tubeBetween(BB, ST, 0.016, frameM, frame);
  tubeBetween(ST, HTt, 0.015, frameM, frame);
  tubeBetween(BB, HTb, 0.02, frameM, frame);
  tubeBetween(HTb, HTt.clone().add(V(-0.008, 0.03)), 0.022, frameM, frame);
  for (const s of [-1, 1]) {
    tubeBetween(BB.clone().add(V(0, 0, s * 0.03)), RA.clone().add(V(0, 0, s * 0.062)), 0.009, frameM, frame);
    tubeBetween(V(-0.215, 0.725, s * 0.02), RA.clone().add(V(0, 0, s * 0.062)), 0.008, frameM, frame);
  }
  const bbShell = K.mesh(THREE, new THREE.CylinderGeometry(0.024, 0.024, 0.075, 20), frameM); bbShell.rotation.x = Math.PI / 2; bbShell.position.copy(BB); frame.add(bbShell);

  // the fork: two raked blades from the crown to the front axle
  const fork = new THREE.Group(); pivot.add(fork);
  for (const s of [-1, 1]) curve([HTb.clone().add(V(0, -0.01, s * 0.03)), V(0.452, 0.5, s * 0.05), V(0.49, 0.4, s * 0.054), FA.clone().add(V(0, 0, s * 0.055))], 0.011, frameM, fork);
  const crown = K.mesh(THREE, new THREE.BoxGeometry(0.05, 0.03, 0.13), frameM); crown.position.copy(HTb).add(V(0.004, -0.015)); fork.add(crown);

  // a wheel: tyre and rim (tori), a hub with two flanges, 32 spokes laced between flange and rim
  const wheel = (at) => {
    const g = new THREE.Group(); g.position.copy(at);
    const spin = new THREE.Group(); g.add(spin);
    spin.add(K.mesh(THREE, new THREE.TorusGeometry(0.33, 0.016, 14, 96), rubber));
    spin.add(K.mesh(THREE, new THREE.TorusGeometry(0.31, 0.011, 10, 96), metal));
    const hub = K.mesh(THREE, new THREE.CylinderGeometry(0.018, 0.018, 0.1, 18), metal); hub.rotation.x = Math.PI / 2; spin.add(hub);
    for (const s of [-1, 1]) { const fl = K.mesh(THREE, new THREE.CylinderGeometry(0.03, 0.03, 0.004, 24), metal); fl.rotation.x = Math.PI / 2; fl.position.z = s * 0.03; spin.add(fl); }
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * Math.PI * 2, s = i % 2 ? 1 : -1, lead = s * 0.18;
      const p0 = V(Math.cos(a + lead) * 0.028, Math.sin(a + lead) * 0.028, s * 0.03), p1 = V(Math.cos(a) * 0.305, Math.sin(a) * 0.305, 0);
      tubeBetween(p0, p1, 0.0016, metal, spin);
    }
    pivot.add(g);
    return { g, spin };
  };
  const rear = wheel(RA), front = wheel(FA);

  // the drivetrain: a toothed chainring and cranks at the bottom bracket, a cassette at the rear hub, the chain loop
  const drive = new THREE.Group(); pivot.add(drive);
  const ring = new THREE.Shape(), NT = 44, R0 = 0.098, R1 = 0.106;
  for (let i = 0; i < NT * 2; i++) { const a = i / (NT * 2) * Math.PI * 2, r = i % 2 ? R1 : R0; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) ring.moveTo(x, y); else ring.lineTo(x, y); }
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.07, 0, Math.PI * 2, true); ring.holes.push(hole);
  const cr = K.mesh(THREE, new THREE.ExtrudeGeometry(ring, { depth: 0.004, bevelEnabled: false }), metal); cr.position.copy(BB).add(V(0, 0, 0.055)); drive.add(cr);
  const cranks = new THREE.Group(); cranks.position.copy(BB); drive.add(cranks);
  for (const s of [-1, 1]) {
    const arm = K.mesh(THREE, new THREE.BoxGeometry(0.03, 0.17, 0.012), metal); arm.position.set(0, -s * 0.085, s * 0.07); cranks.add(arm);
    const ped = K.mesh(THREE, new THREE.BoxGeometry(0.09, 0.02, 0.07), dark); ped.position.set(0, -s * 0.17, s * 0.11); cranks.add(ped);
  }
  const cas = new THREE.Group(); cas.position.copy(RA).add(V(0, 0, 0.045)); drive.add(cas);
  for (let k = 0; k < 9; k++) { const cg = K.mesh(THREE, new THREE.TorusGeometry(0.06 - k * 0.0035, 0.0018, 6, 48), metal); cg.position.z = -k * 0.004; cas.add(cg); }
  const cpts = [];
  for (let i = 0; i <= 18; i++) { const a = Math.PI / 2 - i / 18 * Math.PI; cpts.push(V(BB.x + Math.cos(a) * 0.102, BB.y + Math.sin(a) * 0.102, 0.057)); }
  for (let i = 0; i <= 18; i++) { const a = -Math.PI / 2 - i / 18 * Math.PI; cpts.push(V(RA.x + Math.cos(a) * 0.06, RA.y + Math.sin(a) * 0.06, 0.05)); }
  const chain = new THREE.CatmullRomCurve3(cpts, true, "centripetal");
  drive.add(K.mesh(THREE, new THREE.TubeGeometry(chain, 160, 0.0045, 6, true), dark));

  // the saddle on its post; the stem and a flat bar with grips
  const saddle = new THREE.Group(); pivot.add(saddle);
  const top = V(-0.262, 0.884);
  tubeBetween(ST, top, 0.0135, metal, saddle);
  const sad = new THREE.Shape(); sad.moveTo(-0.14, -0.035); sad.quadraticCurveTo(-0.15, 0.075, -0.07, 0.07); sad.lineTo(0.1, 0.022); sad.quadraticCurveTo(0.13, 0, 0.1, -0.022); sad.lineTo(-0.07, -0.07); sad.quadraticCurveTo(-0.15, -0.075, -0.14, -0.035);
  const sg = new THREE.ExtrudeGeometry(sad, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3 });
  sg.rotateX(Math.PI / 2); const sm = K.mesh(THREE, sg, dark); sm.position.set(top.x + 0.01, top.y + 0.045, 0); saddle.add(sm);
  const bar = new THREE.Group(); pivot.add(bar);
  const stemEnd = V(0.455, 0.85);
  tubeBetween(HTt.clone().add(V(-0.008, 0.03)), stemEnd, 0.014, metal, bar);
  curve([V(stemEnd.x - 0.02, stemEnd.y + 0.01, -0.31), V(stemEnd.x, stemEnd.y, -0.12), V(stemEnd.x, stemEnd.y, 0.12), V(stemEnd.x - 0.02, stemEnd.y + 0.01, 0.31)], 0.011, metal, bar);
  for (const s of [-1, 1]) { const gr = K.mesh(THREE, new THREE.CylinderGeometry(0.016, 0.016, 0.12, 14), rubber); gr.rotation.x = Math.PI / 2; gr.position.set(stemEnd.x - 0.022, stemEnd.y + 0.012, s * 0.27); bar.add(gr); }

  const st = { spin: 0, pedal: 0 };
  const apply = () => {
    rear.spin.rotation.z = -st.spin; front.spin.rotation.z = -st.spin;
    cranks.rotation.z = -st.pedal; cas.rotation.z = -st.pedal * 2.6;
  };
  apply();
  return {
    group, size: [1.72, 1.05, 0.64],
    parts: { frame, fork, front_wheel: front.g, rear_wheel: rear.g, drivetrain: drive, saddle, handlebar: bar },
    keys: ["spin", "pedal", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "spin" || key === "pedal") { st[key] = Number(v) || 0; apply(); }
    },
  };
}
