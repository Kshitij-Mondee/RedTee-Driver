// @lab {"title": "Three.js: one library model (assets/models3d) arrives on a spring, turns to show its sides, and runs through its states", "dur": 6.0, "times": [0.4, 1.4, 2.4, 3.4, 4.4, 5.6], "params": {"model": "phone", "opts": {"screen": {"kind": "blank"}}, "states": [{"key": "notify", "from": 0, "to": 1, "at": 2.0, "dur": 1.2}]}}
// The model library's own example: how a scene loads a model (await X.model), places it on a lit stage
// (X.kit.stage), frames it by its size, and drives its keys from time. In a lesson, `at` is ctx.cue("spoken words").
// params: model (a library id), opts (the model's options), states [{key, from, to, at, dur} | {key, before, value, at}],
// turn (radians of turn over the clip, default 1.8: a three-quarter view each side), light (studio | soft | iso),
// mood (a K.MOODS preset: cold_aisle, hot_aisle, machine_night, latent_space, clean_bench, warm_office, incident, blueprint_iso).
export async function build(ctx, THREE, X) {
  const K = X.kit, P = ctx.params;
  const m = await X.model(P.model || "phone", P.opts || {});
  const [w, h, d] = m.size;
  const aspect = X.W / X.H;
  const fh = Math.max(h, Math.hypot(w, d) / aspect) * 1.25;   // the footprint's diagonal, so a turn never crops
  const st = K.stage(ctx, THREE, X, { light: P.light || "studio", mood: P.mood, frame: [0, h * 0.5, fh], elevation: P.elevation == null ? 14 : P.elevation });
  st.scene.add(m.group);
  const states = P.states || [];
  const turn = P.turn == null ? 1.8 : P.turn;
  return {
    scene: st.scene, camera: st.camera,
    update(t) {
      st.update(t);
      K.arrive(m.group, t, 0.05, { dur: 1.1, drop: -h * 0.4, turn: -1.2 });
      m.group.rotation.y += -0.9 + turn * K.easeInOut(t / ctx.duration);
      for (const s of states) {
        // a discrete state sets `value` from `at` and `before` until then (both, so any seek order gives one frame)
        if (s.value !== undefined) { m.set(s.key, t >= (s.at || 0) ? s.value : s.before); continue; }
        m.set(s.key, K.lerp(s.from == null ? 0 : s.from, s.to == null ? 1 : s.to, K.easeInOut(K.progress(t, s.at || 0, s.dur || 1))));
      }
    },
  };
}
