// @model {"id": "lightbulb", "pack": "workplace", "what": "a classic glass light bulb on a ridged screw base; its filament glows and a halo blooms when it turns on", "parts": ["glass", "filament", "base"], "keys": {"on": "0..1 the filament glows and the bulb fills with light", "turn": "radians about y"}, "best_for": ["an idea or an insight", "the moment it clicks", "a tip"], "not_for": ["energy use or electricity in earnest"], "size": [0.8, 1.45, 0.8], "sheet": {"opts": {}, "states": [{"key": "on", "from": 0, "to": 1, "at": 2.0, "dur": 0.8}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const tone = opts.colour || "warm";
  // the base: a ridged screw (a lathe whose radius ripples) and a dark contact tip
  const sp = [[0, 0], [0.07, 0], [0.1, 0.03]];
  for (let i = 0; i <= 10; i++) sp.push([0.15 + (i % 2 ? 0.018 : 0), 0.05 + i * 0.03]);
  sp.push([0.17, 0.38], [0, 0.38]);
  const base = new THREE.Group();
  const screw = K.mesh(THREE, K.lathe(THREE, sp, 64), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.25 })); base.add(screw);
  const tip = K.mesh(THREE, K.lathe(THREE, [[0, 0], [0.06, 0], [0.075, 0.04], [0, 0.04]], 32), K.mat(ctx, THREE, "casing", "plastic", opts)); tip.position.y = -0.03; base.add(tip);
  base.position.y = 0.03; pivot.add(base);
  // the glass: a lathe of the bulb profile
  const gp = [];
  for (let i = 0; i <= 40; i++) {
    const a = i / 40;           // 0 at the neck, 1 at the top
    const y = 0.4 + a * 0.95;
    const r = a < 0.35 ? 0.17 + (0.36 - 0.17) * Math.sin((a / 0.35) * Math.PI / 2) ** 1.5 : 0.36 * Math.sqrt(Math.max(0, 1 - ((a - 0.35) / 0.65 * 1.0) ** 2.2));
    gp.push([Math.max(0.0005, r), y]);
  }
  const glassMat = new THREE.MeshPhysicalMaterial({ color: K.col(ctx, "paper", opts), roughness: 0.04, metalness: 0, transparent: true, opacity: 0.28,
    clearcoat: 1, clearcoatRoughness: 0.03, emissive: K.col(ctx, tone, opts), emissiveIntensity: 0, side: THREE.DoubleSide, depthWrite: false });
  const glass = new THREE.Mesh(K.lathe(THREE, gp, 96), glassMat); pivot.add(glass);
  // the filament: a stem and a coil arc, glowing in the warm accent
  const filMat = new THREE.MeshStandardMaterial({ color: K.col(ctx, "trim", opts), emissive: K.col(ctx, tone, opts), emissiveIntensity: 0 });
  const pts = [];
  for (let i = 0; i <= 80; i++) { const a = i / 80, x = -0.12 + 0.24 * a, y = 0.86 + 0.06 * Math.sin(a * Math.PI) + 0.012 * Math.sin(a * Math.PI * 14); pts.push(new THREE.Vector3(x, y, 0.012 * Math.cos(a * Math.PI * 14))); }
  const filament = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.008, 8), filMat); pivot.add(filament);
  for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.46, 8), filMat); st.position.set(s * 0.12, 0.64, 0); pivot.add(st); }
  // the halo: a soft additive sprite that blooms when the bulb is on
  const hc = document.createElement("canvas"); hc.width = hc.height = 256;
  const hg = hc.getContext("2d"), rg = hg.createRadialGradient(128, 128, 0, 128, 128, 128);
  const c = K.col(ctx, tone, opts), rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  rg.addColorStop(0, `rgba(${rgb},0.9)`); rg.addColorStop(0.4, `rgba(${rgb},0.35)`); rg.addColorStop(1, `rgba(${rgb},0)`); hg.fillStyle = rg; hg.fillRect(0, 0, 256, 256);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  halo.scale.set(1.6, 1.6, 1); halo.position.y = 0.92; pivot.add(halo);
  group.add(K.contactShadow(ctx, THREE, 0.9, 0.9, 0.4));

  const setOn = (k) => { k = K.clamp(k); filMat.emissiveIntensity = 3 * k; glassMat.emissiveIntensity = 0.55 * k; glassMat.opacity = 0.28 + 0.4 * k; halo.material.opacity = 0.85 * k; };
  setOn(opts.on || 0);
  return {
    group, size: [0.8, 1.42, 0.8], parts: { glass, filament, base }, keys: ["on", "turn"],
    set(key, v) {
      if (key === "on") setOn(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
