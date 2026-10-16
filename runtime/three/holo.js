// holo: the hologram look for Three.js heroes (hologram v2, 2026-10-16; docs/research/2026-10-16-hologram-v2.md).
//
// A hero is a library model (assets/models3d) shown as projected light: an additive material that lights rims more
// than faces (Fresnel), thin scan bands moving through it, a fine interlace, a faint flicker from a seeded hash, depth
// fog, a scan plane that builds it from the pad up and a hot (near-white) state per part; its real edges as lines; a
// projector pad and a beam in 3D with motes; and real bloom plus a slight red and blue fringe as post-processing.
// Everything is a pure function of t (no clock, no Math.random). It renders on black and the bridge turns brightness
// into alpha (light over the HUD), so the clip composites as light on any field.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/** a deterministic hash in [0, 1) */
export const hash = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };

const VERT = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main() {
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p; vW = w.xyz;
  vec4 mv = viewMatrix * w; vV = mv.xyz;
  vN = normalize(normalMatrix * n);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
uniform vec3 uColor; uniform vec3 uHot; uniform float uHotK; uniform float uTime; uniform float uScan; uniform float uScanOn;
uniform float uFogNear; uniform float uFogFar; uniform float uBody; uniform float uRim; uniform float uBand; uniform float uBandK;
uniform float uFlicker; uniform float uLine; uniform float uAlpha; uniform float uInter;
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main() {
  if (uScanOn > 0.5 && vW.y > uScan) discard;
  vec3 V = normalize(-vV);
  float fr = uLine > 0.5 ? 1.0 : pow(1.0 - abs(dot(normalize(vN), V)), 2.2);
  float bands = pow(0.5 + 0.5 * sin(vW.y * uBand - uTime * 1.3), 24.0) * uBandK;
  float inter = mod(floor(gl_FragCoord.y), 3.0) < 1.0 ? 1.0 - uInter : 1.0;
  float fog = smoothstep(uFogNear, uFogFar, -vV.z);
  float edge = uScanOn > 0.5 ? 1.0 - smoothstep(0.0, 0.035, uScan - vW.y) : 0.0;
  float k = (uLine > 0.5 ? 1.0 : uBody + uRim * fr) + bands;
  vec3 c = mix(uColor, uHot, clamp(uHotK * 0.85 + edge, 0.0, 1.0)) * k * (1.0 + 2.0 * edge + 0.5 * uHotK);
  c *= inter * uFlicker * (1.0 - 0.72 * fog) * uAlpha;
  gl_FragColor = vec4(c, 1.0);
}`;

/** the hologram material: additive light, rims brighter than faces. o: {color, hot, body, rim, line, alpha, band, xray}.
 * A face is drawn front to back and writes depth (pushed back a little so its own edges win), so a dense model shows
 * its visible shell and silhouette, not every layer stacked to white; xray: true lets everything show through. */
export function material(ctx, o = {}) {
  const solid = !o.line && !o.xray;
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: o.color || ctx.c("accent") }, uHot: { value: o.hot || ctx.c("ink") }, uHotK: { value: 0 },
      uTime: { value: 0 }, uScan: { value: 1e6 }, uScanOn: { value: 0 }, uFogNear: { value: 4 }, uFogFar: { value: 9 },
      uBody: { value: o.body == null ? 0.035 : o.body }, uRim: { value: o.rim == null ? 0.42 : o.rim }, uBand: { value: o.band == null ? 9 : o.band },
      uBandK: { value: o.bandK == null ? 0.22 : o.bandK }, uFlicker: { value: 1 }, uLine: { value: o.line ? 1 : 0 },
      uAlpha: { value: o.alpha == null ? 1 : o.alpha }, uInter: { value: o.inter == null ? 0.18 : o.inter },
    },
    vertexShader: VERT, fragmentShader: FRAG, transparent: !solid, depthWrite: solid, depthTest: !o.noDepth,
    blending: THREE.AdditiveBlending, side: solid ? THREE.FrontSide : THREE.DoubleSide,
    polygonOffset: solid, polygonOffsetFactor: 1.5, polygonOffsetUnits: 2,
  });
}

/** turn a model handle into a hologram: every mesh takes a part's material (one per named part, so a part can be hot),
 * its real edges become lines; points, sprites and the parts in `hide` are hidden. Returns {mats, parts, all} */
export function hologram(ctx, handle, o = {}) {
  const hide = new Set(o.hide || []), mats = {}, all = [], named = new Map();
  const partsOf = handle.parts || {}, tints = (o.look && o.look.parts) || {};
  for (const [nm, obj] of Object.entries(partsOf)) if (obj && !named.has(obj)) named.set(obj, nm);
  // a mesh belongs to its nearest named ancestor (a pin inside the pins group is that pin, so it can be hot alone)
  const ownerOf = (x) => { for (let q = x; q; q = q.parent) if (named.has(q)) return named.get(q); return "_"; };
  for (const nm of hide) if (partsOf[nm]) partsOf[nm].visible = false;
  const xrayParts = new Set((o.look && o.look.xray) || []);
  const matFor = (nm, line, see) => {
    const key = (nm || "_") + (line ? ":line" : see ? ":xray" : "");
    if (!mats[key]) {
      const tint = tints[nm] ? { color: ctx.c(tints[nm]) } : {};
      const mt = material(ctx, Object.assign({}, o.look || {}, tint, line ? { line: true, alpha: (o.look && o.look.lineAlpha) || 0.8 } : see ? { xray: true, body: 0.012, rim: 0.55 } : {}));
      // a model's set() may write a lit material's colour or glow (an LED); the hologram keeps those as inert fields
      mt.color = new THREE.Color(); mt.emissive = new THREE.Color(); mt.emissiveIntensity = 0; mt.map = null;
      mats[key] = mt; all.push(mt);
    }
    return mats[key];
  };
  const meshes = [];
  const lines = [];
  handle.group.traverse((x) => { if (x.isMesh) meshes.push(x); else if (x.isLine) lines.push(x); else if (x.isPoints || x.isSprite) x.visible = false; });
  for (const l of lines) l.material = matFor(ownerOf(l), true);   // a model's own lines (coastlines, arcs) are light too
  for (const m of meshes) {
    // a contact shadow (a dark plane under the model, drawn last, no depth) is not part of a projection
    const om = Array.isArray(m.material) ? m.material[0] : m.material;
    if (m.renderOrder === -1 && om && om.depthWrite === false) { m.visible = false; continue; }
    const nm = ownerOf(m);
    // glass and other see-through surfaces (an atmosphere, a door's glazing) stay see-through: they never hide what is
    // inside them; look.xray names more parts
    const see = xrayParts.has(nm) || !!(om && (om.transparent || om.transmission > 0 || om.opacity < 1));
    m.material = matFor(nm, false, see); m.castShadow = false; m.receiveShadow = false;
    if (o.edges !== false && !m.isInstancedMesh && m.geometry && m.geometry.attributes.position && m.geometry.attributes.position.count < 60000) {
      const eg = new THREE.EdgesGeometry(m.geometry, o.edgeAngle || 28);
      const ln = new THREE.LineSegments(eg, matFor(nm, true)); ln.renderOrder = 2; m.add(ln);
    }
  }
  // a part's materials, and those of the named parts inside it (the units group lights every unitN)
  const inside = (nm) => { const o0 = partsOf[nm]; if (!o0) return [nm]; const out = []; for (const [k, ob] of Object.entries(partsOf)) { for (let q = ob; q; q = q.parent) if (q === o0) { out.push(k); break; } } return out; };
  return { mats, all, partMats: (nm) => inside(nm).flatMap((k) => [mats[k], mats[k + ":line"], mats[k + ":xray"]]).filter(Boolean) };
}

/** per frame: time, flicker, scan, fog for every hologram material */
export function tick(all, t, o = {}) {
  const fl = 1 - (o.flicker == null ? 0.05 : o.flicker) * hash(Math.floor(t * 24) + 7);
  for (const m of all) {
    const u = m.uniforms;
    u.uTime.value = t; u.uFlicker.value = fl;
    if (o.scan != null) { u.uScan.value = o.scan; u.uScanOn.value = o.scan < 1e5 ? 1 : 0; }
    if (o.fog) { u.uFogNear.value = o.fog[0]; u.uFogFar.value = o.fog[1]; }
  }
}

/** a projector pad on y = 0 with a beam above it and motes in the beam. Returns {group, update(t)} */
export function pad(ctx, o = {}) {
  const r = o.r || 1, g = new THREE.Group(), col = o.color || ctx.c("accent"), add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
  const flat = (geo, k) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial(Object.assign({ color: col.clone().multiplyScalar(k) }, add))); m.rotation.x = -Math.PI / 2; g.add(m); return m; };
  // the pool of light: a radial falloff on the floor
  const pool = new THREE.Mesh(new THREE.CircleGeometry(r * 1.5, 96), new THREE.ShaderMaterial(Object.assign({
    uniforms: { uC: { value: col }, uR: { value: r * 1.5 } },
    vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform vec3 uC; uniform float uR; varying vec2 vP; void main(){ float d = length(vP)/uR; float a = pow(1.0 - clamp(d,0.0,1.0), 2.6) * 0.22; gl_FragColor = vec4(uC * a, 1.0); }",
  }, add)));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.001; g.add(pool);
  flat(new THREE.RingGeometry(r * 0.985, r, 160), 1.5);
  flat(new THREE.RingGeometry(r * 0.62, r * 0.627, 128), 0.45);
  flat(new THREE.RingGeometry(r * 0.3, r * 0.304, 96), 0.3);
  // the dashed ring (turns) and the ticks (turn the other way)
  const dash = new THREE.Group(); g.add(dash);
  for (let i = 0; i < 48; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.86, r * 0.875, 6, 1, i / 48 * Math.PI * 2, Math.PI * 2 / 48 * 0.55), new THREE.MeshBasicMaterial(Object.assign({ color: col.clone().multiplyScalar(0.8) }, add))); m.rotation.x = -Math.PI / 2; dash.add(m); }
  const tp = [];
  for (let i = 0; i < 120; i++) { const a = i / 120 * Math.PI * 2, L = i % 10 === 0 ? 0.09 : 0.04; tp.push(Math.cos(a) * r * 1.03, 0.002, Math.sin(a) * r * 1.03, Math.cos(a) * r * (1.03 + L), 0.002, Math.sin(a) * r * (1.03 + L)); }
  const tg = new THREE.BufferGeometry(); tg.setAttribute("position", new THREE.Float32BufferAttribute(tp, 3));
  const ticks = new THREE.LineSegments(tg, new THREE.LineBasicMaterial(Object.assign({ color: col.clone().multiplyScalar(0.7) }, add))); g.add(ticks);
  // the beam: a cone of faint light, brightest at the pad, visible because of haze
  const hgt = o.beam == null ? r * 2.6 : o.beam;
  if (hgt > 0) {
    const bg = new THREE.CylinderGeometry(r * 0.92, r * 0.98, hgt, 96, 1, true); bg.translate(0, hgt / 2, 0);
    const beam = new THREE.Mesh(bg, new THREE.ShaderMaterial(Object.assign({
      uniforms: { uC: { value: col }, uH: { value: hgt }, uK: { value: o.beamK == null ? 0.07 : o.beamK } },
      vertexShader: "varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vec4 mv = modelViewMatrix*vec4(position,1.0); vV = mv.xyz; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }",
      fragmentShader: "uniform vec3 uC; uniform float uH; uniform float uK; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float h = clamp(vY/uH,0.0,1.0); float side = pow(1.0 - abs(dot(normalize(vN), normalize(-vV))), 1.5); float a = pow(1.0-h, 2.4) * (0.25 + side) * uK; gl_FragColor = vec4(uC*a,1.0); }",
    }, add)));
    g.add(beam);
  }
  // motes: fixed seeds, drifting up the beam
  const N = o.motes == null ? 140 : o.motes, mp = new Float32Array(N * 3), seeds = [];
  for (let i = 0; i < N; i++) { const a = hash(i * 3.1) * Math.PI * 2, rr = Math.sqrt(hash(i * 7.7)) * r * 0.85; seeds.push([Math.cos(a) * rr, Math.sin(a) * rr, hash(i * 1.9), 0.04 + hash(i * 5.3) * 0.08]); }
  const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(mg, new THREE.PointsMaterial(Object.assign({ color: (o.moteColor || ctx.c("accent")).clone().multiplyScalar(0.85), size: o.moteSize || 2.0, sizeAttenuation: false }, add)));
  g.add(motes);
  return {
    group: g, r,
    update(t) {
      dash.rotation.y = t * 0.12; ticks.rotation.y = -t * 0.05;
      seeds.forEach(([x, z, y0, sp], i) => { const y = ((y0 + sp * t / (hgt || 1)) % 1) * (hgt || r * 2); mp[i * 3] = x; mp[i * 3 + 1] = y; mp[i * 3 + 2] = z; });
      mg.attributes.position.needsUpdate = true;
    },
  };
}

const FRINGE = {
  uniforms: { tDiffuse: { value: null }, uAmt: { value: 0.0016 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
  fragmentShader: "uniform sampler2D tDiffuse; uniform float uAmt; varying vec2 vUv; void main(){ vec2 d = (vUv - 0.5) * uAmt * 2.0; vec4 c = texture2D(tDiffuse, vUv); float r = texture2D(tDiffuse, vUv + d).r; float b = texture2D(tDiffuse, vUv - d).b; gl_FragColor = vec4(r, c.g, b, c.a); }",
};

/** bloom (real post-processing) and the fringe; renders on black. o: {bloom: [strength, radius, threshold], fringe} */
export function composer(X, scene, camera, o = {}) {
  const r = X.renderer, W = X.W, H = X.H;
  const C = new EffectComposer(r);
  C.setSize(W, H);
  C.addPass(new RenderPass(scene, camera));
  const [s, rad, thr] = o.bloom || [0.62, 0.32, 0.3];
  C.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), s, rad, thr));
  if (o.fringe !== 0) { const f = new ShaderPass(FRINGE); f.uniforms.uAmt.value = o.fringe == null ? 0.0016 : o.fringe; C.addPass(f); }
  C.addPass(new OutputPass());
  return { render() { r.setClearColor(0x000000, 1); C.render(); } };
}

/** the screen box (px in the clip) of each named object, for the HUD's locks and datums */
export function anchors(camera, named, W, H) {
  const out = {}, b = new THREE.Box3(), v = new THREE.Vector3();
  camera.updateMatrixWorld(true);
  for (const [nm, obj] of Object.entries(named)) {
    if (!obj || !obj.visible) continue;
    obj.updateWorldMatrix(true, true);
    b.setFromObject(obj, true);
    if (b.isEmpty()) continue;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(camera);
      const sx = (v.x + 1) / 2 * W, sy = (1 - v.y) / 2 * H;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    out[nm] = [+x0.toFixed(1), +y0.toFixed(1), +(x1 - x0).toFixed(1), +(y1 - y0).toFixed(1)];
  }
  return out;
}
export { smooth, clamp };
