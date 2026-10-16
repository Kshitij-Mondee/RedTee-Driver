// @preset {"id": "holo_hero", "what": "a hologram hero (hologram v2): one library model shown as projected light on a projector pad (Fresnel rims, its real edges, scan bands, a scan plane that builds it, a hot part, depth fog, bloom and a slight fringe), turning on a turntable, its parts exploding on the word; it exports its parts' screen boxes so the hologram HUD's locks and datums point at them", "params": {"model": {"required": true, "library": true}, "opts": "the model's options (its card lists them)", "states": "[{key, from, to, at|say, dur}]: the model's own keys on the words", "yaw": "starting angle in radians (default -0.6)", "turn": "[t0, t1, radians]: the turntable (default none)", "elevation": "camera elevation in degrees (default 16)", "zoom": "the share of the frame's height the model fills (default 0.72)", "build": "[t0, dur]: the scan plane builds it from the pad up (default [0, 2.4]; false: built at once)", "explode": "{at, dur, parts: {part: [dx, dy, dz]}} in model units", "hot": "[{part, t0, t1}]: a part lit near-white", "hide": "parts left out (default the model's air and particles)", "pad": "false for no pad (default on)", "padR": "the pad radius in model units (default: fits the footprint)", "beam": "beam height in model heights (default 1.25; 0 for none)", "look": "{color, bloom: [strength, radius, threshold], fringe, flicker, body, rim, bandK}", "anchors": "part names to export (default every part)", "x": "where the model stands across the clip, -1..1 of the half width (default 0)"}}
// The hologram engine places this clip behind its HUD (H.hero3d) and reads the anchors the bridge exports.
export async function build(ctx, THREE, X) {
  const K = X.kit, HO = X.holo, P = ctx.params || {};
  const when = (s) => (typeof s.at === "number" ? s.at : s.say ? ctx.cue(s.say) : 0);
  const m = await X.model(P.model, Object.assign({}, P.opts || {}));
  const [w, h, d] = m.size;
  const look = Object.assign({ color: null }, P.look || {});
  const tint = look.color ? ctx.c(look.color) : ctx.c("accent");
  const H_ = HO.hologram(ctx, m, { hide: P.hide || ["airflow", "recirc", "air"], look: Object.assign({ color: tint }, look) });
  const scene = new THREE.Scene();
  const root = new THREE.Group(); scene.add(root);
  root.add(m.group);
  root.position.x = (P.x || 0) * 0.0;            // framing below moves the camera, not the model
  m.group.rotation.y = P.yaw == null ? -0.6 : P.yaw;
  // the pad and its beam, sized to the model's footprint
  // the pad fits the footprint: its diagonal for a squarish model, its length for a long one (a bicycle); P.padR overrides
  const pr = P.padR || (Math.max(w, d) / Math.max(1e-6, Math.min(w, d)) > 1.8 ? 0.46 * Math.max(w, d) : 0.62 * Math.hypot(w, d) + 0.08);
  const PAD = P.pad === false ? null : HO.pad(ctx, { r: pr, beam: (P.beam == null ? 1.25 : P.beam) * h, color: tint, motes: look.motes });
  if (PAD) root.add(PAD.group);
  // the camera: a slow, slightly elevated look; the model and its pad fill `zoom` of the frame's height
  const aspect = X.W / X.H, fov = 28, el = (P.elevation == null ? 16 : P.elevation) * Math.PI / 180;
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.05, 200);
  const fillH = Math.max(h * 1.12, (2 * pr) / aspect * 1.1) / (P.zoom || 0.72);
  const dist = (fillH / 2) / Math.tan(fov / 2 * Math.PI / 180);
  const look_at = new THREE.Vector3(0, h * 0.48, 0);
  camera.position.set(-(P.x || 0) * dist * Math.tan(fov / 2 * Math.PI / 180) * aspect, look_at.y + Math.sin(el) * dist, Math.cos(el) * dist);
  camera.lookAt(look_at.x - (P.x || 0) * dist * Math.tan(fov / 2 * Math.PI / 180) * aspect, look_at.y, 0);
  const fogN = dist - Math.max(w, d) * 0.6, fogF = dist + Math.max(w, d) * 1.4;
  const comp = HO.composer(X, scene, camera, { bloom: look.bloom, fringe: look.fringe });
  // timelines
  const states = (P.states || []).map((s) => Object.assign({}, s, { t: when(s) }));
  const build = P.build === false ? null : (P.build || [0, 2.4]);
  const turn = P.turn || null;
  const ex = P.explode || null, home = {};
  if (ex) for (const nm of Object.keys(ex.parts || {})) if (m.parts[nm]) home[nm] = m.parts[nm].position.clone();
  const hots = (P.hot || []).map((x) => Object.assign({ t1: 1e9 }, x));
  const named = {};
  for (const nm of (P.anchors || Object.keys(m.parts))) if (m.parts[nm]) named[nm] = m.parts[nm];
  const update = (t) => {
    // the model's own keys first (a door, a slide, a spin), then the turntable, the explode, the build
    // a pure function of t: every key takes the value of its latest state at t, or its first state's starting value
    // before that (the anchors are sampled first, then frames in any order, so nothing may carry over)
    const vals = {};
    for (const s of states.slice().sort((p, q) => p.t - q.t)) {
      if (t >= s.t) vals[s.key] = s.from != null ? K.lerp(s.from, s.to, K.easeInOut(K.progress(t, s.t, s.dur || 0.8))) : s.value;
      else if (!(s.key in vals)) vals[s.key] = s.from != null ? s.from : (s.before != null ? s.before : 0);
    }
    for (const k of Object.keys(vals)) m.set(k, vals[k]);
    if ((m.keys || []).includes("t")) m.set("t", t);
    m.group.rotation.y = (P.yaw == null ? -0.6 : P.yaw) + (turn ? turn[2] * K.easeInOut(K.progress(t, turn[0], turn[1] - turn[0])) : 0);
    if (ex) { const k = K.easeInOut(K.progress(t, ex.at, ex.dur || 1.4)); for (const nm of Object.keys(home)) { const o = ex.parts[nm]; m.parts[nm].position.set(home[nm].x + o[0] * k, home[nm].y + o[1] * k, home[nm].z + o[2] * k); } }
    const scan = build ? (t < build[0] ? -1 : t >= build[0] + build[1] ? 1e6 : K.lerp(-0.02, h * 1.04, HO.smooth((t - build[0]) / build[1]))) : 1e6;
    HO.tick(H_.all, t, { scan, fog: [fogN, fogF], flicker: look.flicker });
    for (const mt of H_.all) mt.uniforms.uHotK.value = 0;
    for (const x of hots) if (t >= x.t0 && t < x.t1) for (const mt of H_.partMats(x.part)) mt.uniforms.uHotK.value = Math.min(1, (t - x.t0) / 0.3);
    if (PAD) PAD.update(t);
    m.group.updateMatrixWorld(true);
  };
  return { scene, camera, update, render: () => comp.render(), lightAlpha: true, anchors: () => HO.anchors(camera, named, X.W, X.H) };
}
