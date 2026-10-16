// @preset {"id": "model_shot", "what": "one library model or set (assets/models3d) on a lit stage, its keys driven by spoken words; the model, its options, its states and the mood are params, so nothing is written and everything stays swappable", "params": {"model": {"required": true, "library": true}, "opts": "the model's options (its card lists them)", "states": "[{key, from, to, say, dur} | {key, before, value, say}]: each key moves on the words it names", "run": "keys driven by time itself from the clip start, e.g. [\"t\"] for particles and fans (default: \"t\" when the model has it)", "arrive_say": "words the model arrives on (default: the clip start)", "mood": {"choices": ["cold_aisle", "hot_aisle", "machine_night", "latent_space", "clean_bench", "warm_office", "incident", "blueprint_iso"]}, "mood_say": "words a moving mood (incident) starts on", "light": {"choices": ["studio", "soft", "iso"]}, "elevation": "camera elevation in degrees (default 14)", "zoom": "how much of the frame the model fills (default 1 = 88 %; 0.8 fills more, 1.2 less)", "turn": "radians the model turns over the clip (default 0.5)", "yaw": "starting angle in radians (default -0.5)"}}
// A preset scene (D-140): the storyboard names it and gives params; no file is written.
//   {"kind": "three", "three": {"preset": "model_shot", "rect": [...], "params": {"model": "server_rack",
//     "states": [{"key": "airflow", "from": 0, "to": 1, "say": "cool air in at the front", "dur": 1}], "mood": "cold_aisle"}}}
// In the lab the times may be seconds (`at` instead of `say`, `arrive_at`).
export async function build(ctx, THREE, X) {
  const K = X.kit, P = ctx.params || {};
  const when = (s) => (typeof s.at === "number" ? s.at : s.say ? ctx.cue(s.say) : 0);
  const m = await X.model(P.model, P.opts || {});
  const [w, h, d] = m.size;
  const aspect = X.W / X.H;
  // framing: the model's bounding sphere fits the frame whatever its turn, elevation or opened parts (a flat server
  // or an aisle set cropped under the old height-only fit); zoom < 1 comes closer
  const r = 0.5 * Math.hypot(w, h, d);
  const fh = Math.max(2 * r, (2 * r) / aspect) * 1.02 * (P.zoom || 1);
  const st = K.stage(ctx, THREE, X, { light: P.light || "studio", mood: P.mood, moodAt: typeof P.mood_at === "number" ? P.mood_at : P.mood_say ? ctx.cue(P.mood_say) : 0,
    frame: [0, h * 0.5, fh], elevation: P.elevation == null ? 14 : P.elevation });
  st.scene.add(m.group);
  m.group.rotation.y = P.yaw == null ? -0.5 : P.yaw;
  // fit: measure what the camera really sees (the model's box at the start, middle and end of its turn, projected),
  // aim at its centre and move the camera so it fills 88 % of the frame; contact shadows do not count
  {
    const cam = st.camera, yaw0 = m.group.rotation.y, tn = P.turn == null ? 0.5 : P.turn;
    const solid = (o) => o.isMesh && o.visible && !(o.renderOrder === -1 && o.material && o.material.depthWrite === false);
    // the model's own vertices (sampled), at the start, middle and end of its turn: what the camera will really see
    const ptsAt = (a) => {
      m.group.rotation.y = a; m.group.updateMatrixWorld(true);
      const out = [];
      m.group.traverse((o) => {
        if (!solid(o) || !o.geometry.attributes.position) return;
        const pa = o.geometry.attributes.position, step = Math.max(1, Math.floor(pa.count / 400));
        const mats = [];
        if (o.isInstancedMesh) { for (let j = 0; j < o.count; j++) { const im = new THREE.Matrix4(); o.getMatrixAt(j, im); mats.push(o.matrixWorld.clone().multiply(im)); } }
        else mats.push(o.matrixWorld);
        for (const mw of mats) for (let i = 0; i < pa.count; i += step) out.push(new THREE.Vector3().fromBufferAttribute(pa, i).applyMatrix4(mw));
      });
      return out;
    };
    const sets = [yaw0, yaw0 + tn * 0.5, yaw0 + tn].map(ptsAt);
    m.group.rotation.y = yaw0; m.group.updateMatrixWorld(true);
    const all = new THREE.Box3(); sets.forEach((ps) => ps.forEach((q) => all.expandByPoint(q)));
    const target = all.getCenter(new THREE.Vector3());
    const extent = () => {
      cam.updateMatrixWorld(true); let e = 0;
      for (const ps of sets) for (const q of ps) { const v = q.clone().project(cam); e = Math.max(e, Math.abs(v.x), Math.abs(v.y)); }
      return e;
    };
    const dir = cam.position.clone().sub(new THREE.Vector3(0, h * 0.5, 0));
    if (cam.isPerspectiveCamera && !all.isEmpty()) {
      cam.position.copy(target).add(dir); cam.lookAt(target);
      for (let k = 0; k < 3; k++) {
        const s = extent() / (0.88 / (P.zoom || 1));
        dir.multiplyScalar(s); cam.position.copy(target).add(dir); cam.lookAt(target);
      }
    }
  }
  const states = (P.states || []).map((s) => Object.assign({}, s, { t: when(s) }));
  const run = P.run || ((m.keys || []).includes("t") ? ["t"] : []);
  const tArrive = typeof P.arrive_at === "number" ? P.arrive_at : P.arrive_say ? ctx.cue(P.arrive_say) : 0.05;
  const turn = P.turn == null ? 0.5 : P.turn;
  return {
    scene: st.scene, camera: st.camera,
    update(t) {
      st.update(t);
      K.arrive(m.group, t, tArrive, { dur: 1.1, drop: -h * 0.35, turn: -0.9 });
      m.group.rotation.y += turn * K.easeInOut(t / ctx.duration);
      for (const k of run) m.set(k, t);
      // keys in order; a key that appears twice takes the latest state that has started (any seek order, one frame)
      const byKey = {};
      for (const s of states) (byKey[s.key] = byKey[s.key] || []).push(s);
      for (const [key, list] of Object.entries(byKey)) {
        list.sort((a, b) => a.t - b.t);
        let cur = list[0];
        for (const s of list) if (t >= s.t) cur = s;
        if (cur.value !== undefined) { m.set(key, t >= cur.t ? cur.value : cur.before); continue; }
        const from = cur.from == null ? 0 : cur.from, to = cur.to == null ? 1 : cur.to;
        m.set(key, K.lerp(from, to, K.easeInOut(K.progress(t, cur.t, cur.dur || 1))));
      }
    },
  };
}
