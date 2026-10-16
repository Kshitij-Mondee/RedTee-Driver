// @model {"id": "desk_set", "pack": "devices", "what": "a workstation: a desk with a monitor (the monitor model), a keyboard, a mug, a plant and an office chair tucked in", "parts": ["desk", "monitor", "chair", "props"], "keys": {"screen": "the monitor's screen spec (see kit3d drawUI)", "wake": "0..1 the monitor's brightness", "chair": "0 tucked in .. 1 pulled out and turned (someone stepped away)", "turn": "radians about y"}, "best_for": ["a workplace or a role's desk", "an unlocked screen left behind (clear-desk and lock-screen)", "hybrid and office work"], "not_for": ["the person working (use a rig or a character kit)"], "size": [2.6, 2.4, 1.6], "sheet": {"opts": {"screen": {"kind": "lock", "title": "Screen locked", "line": "Press any key"}}, "states": [{"key": "wake", "from": 0, "to": 1, "at": 1.0, "dur": 0.6}, {"key": "chair", "from": 0, "to": 1, "at": 2.6, "dur": 1.2}], "elevation": 20}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const DW = 2.4, DD = 1.1, DH = 1.0, TT = 0.06;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const wood = K.mat(ctx, THREE, opts.top || "paper", "matte", opts, { roughness: 0.6 });
  const frame = K.mat(ctx, THREE, "casing", "metal", opts, { roughness: 0.4, metalness: 0.5 });

  // the desk: a top on two frame legs with a cross bar
  const desk = new THREE.Group();
  const top = K.mesh(THREE, K.rbox(THREE, X, DW, TT, DD, 0.02, 3), wood); top.position.y = DH - TT / 2; desk.add(top);
  for (const s of [-1, 1]) {
    const leg = K.mesh(THREE, K.rbox(THREE, X, 0.07, DH - TT, DD - 0.12, 0.02, 2), frame); leg.position.set(s * (DW / 2 - 0.12), (DH - TT) / 2, 0); desk.add(leg);
  }
  const bar = K.mesh(THREE, K.rbox(THREE, X, DW - 0.24, 0.06, 0.05, 0.015, 2), frame); bar.position.set(0, DH * 0.55, -DD / 2 + 0.14); desk.add(bar);
  pivot.add(desk);

  // the monitor: the library's own monitor model, scaled to sit on the desk
  const mon = await X.model("monitor", { screen: opts.screen, colors: opts.colors });
  K.fitHeight(mon, 0.9); mon.group.position.set(0.1, DH, -DD / 2 + 0.3);
  // the monitor's contact shadow would float above the desk top: it sits at its base, so it lands on the desk
  pivot.add(mon.group);
  // props: a keyboard, a mug, a plant
  const props = new THREE.Group();
  const kb = K.mesh(THREE, K.rbox(THREE, X, 0.62, 0.025, 0.2, 0.01, 2), K.mat(ctx, THREE, "casing2", "plastic", opts)); kb.position.set(0.1, DH + 0.012, 0.18); props.add(kb);
  const mug = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.07, 0], [0.075, 0.01], [0.075, 0.15], [0.068, 0.15], [0.068, 0.012], [0, 0.012]], 40), K.mat(ctx, THREE, "ui", "gloss", opts));
  mug.position.set(0.72, DH, 0.12); props.add(mug);
  const handle = K.mesh(THREE, new THREE.TorusGeometry(0.04, 0.012, 10, 24, Math.PI), K.mat(ctx, THREE, "ui", "gloss", opts)); handle.rotation.z = -Math.PI / 2; handle.position.set(0.79, DH + 0.075, 0.12); props.add(handle);
  const pot = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.08, 0], [0.11, 0.17], [0.0, 0.17]], 32), K.mat(ctx, THREE, "warm", "matte", opts)); pot.position.set(-0.85, DH, -0.2); props.add(pot);
  for (let i = 0; i < 5; i++) {                       // leaves: flattened spheres fanned around (a fixed layout)
    const a = i / 5 * Math.PI * 2, leaf = K.mesh(THREE, new THREE.SphereGeometry(0.09, 16, 12), K.mat(ctx, THREE, "ok", "matte", opts));
    leaf.scale.set(0.5, 1.4, 0.25); leaf.position.set(-0.85 + Math.cos(a) * 0.06, DH + 0.3 + (i % 2) * 0.05, -0.2 + Math.sin(a) * 0.06); leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); props.add(leaf);
  }
  pivot.add(props);

  // the chair: a seat, a back, a gas column and a five-star base; its pivot is the column
  const chair = new THREE.Group();
  const seatMat = K.mat(ctx, THREE, opts.chair || "casing2", "plastic", opts, { roughness: 0.7 });
  const seat = K.mesh(THREE, K.rbox(THREE, X, 0.6, 0.1, 0.56, 0.05, 4), seatMat); seat.position.y = 0.62; chair.add(seat);
  const back = K.mesh(THREE, K.rbox(THREE, X, 0.56, 0.62, 0.08, 0.06, 4), seatMat); back.position.set(0, 1.02, 0.28); back.rotation.x = -0.1; chair.add(back);
  const col = K.mesh(THREE, new THREE.CylinderGeometry(0.035, 0.035, 0.46, 16), frame); col.position.y = 0.36; chair.add(col);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2, arm = K.mesh(THREE, K.rbox(THREE, X, 0.32, 0.04, 0.06, 0.015, 2), frame);
    arm.position.set(Math.cos(a) * 0.16, 0.1, Math.sin(a) * 0.16); arm.rotation.y = -a; chair.add(arm);
    const wheel = K.mesh(THREE, new THREE.SphereGeometry(0.035, 12, 10), K.mat(ctx, THREE, "casing", "rubber", opts)); wheel.position.set(Math.cos(a) * 0.31, 0.035, Math.sin(a) * 0.31); chair.add(wheel);
  }
  chair.position.set(0.1, 0, 0.5); pivot.add(chair);
  group.add(K.contactShadow(ctx, THREE, DW * 1.3, DD * 2.0, 0.4));

  const setChair = (k) => { k = K.easeInOut(K.clamp(k)); chair.position.set(0.1 + 0.35 * k, 0, 0.5 + 0.55 * k); chair.rotation.y = 0.7 * k; };
  setChair(opts.chairOut || 0);
  return {
    group, size: [DW, DH + 0.95, DD + 0.9], parts: { desk, monitor: mon.group, chair, props }, keys: ["screen", "wake", "chair", "turn"],
    set(key, v) {
      if (key === "screen" || key === "wake") mon.set(key, v);
      else if (key === "chair") setChair(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
