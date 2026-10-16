// @lab {"title": "Three.js with library models: a sign-in prompt arrives on the phone, the security key is touched, the padlock opens", "dur": 7.0, "times": [0.6, 1.8, 2.8, 3.8, 5.0, 6.6], "params": {"title": "Sign-in request", "line": "Was this you? Touch your key", "t_phone": 0.2, "t_notify": 1.4, "t_key": 2.6, "t_touch": 3.6, "t_lock": 4.4}}
// Three library models composed into one shot (assets/models3d): phone, security_key, padlock. Each is loaded with
// `await X.model(id, opts)`, placed on a shared lit stage, and driven only by its keys from time. In a lesson the
// times are spoken words: `ctx.cue("touch your key")` instead of P.t_touch. Words on the phone come from params.
export async function build(ctx, THREE, X) {
  const K = X.kit, P = ctx.params;
  const st = K.stage(ctx, THREE, X, { light: "studio", frame: [0, 0.85, 2.5], elevation: 10 });
  const phone = await X.model("phone", { screen: { kind: "blank" }, notify: { title: P.title, line: P.line } });
  const key = await X.model("security_key", {});
  const lock = await X.model("padlock", {});
  phone.group.position.set(-1.25, 0, 0); phone.group.rotation.y = 0.35;
  K.fitHeight(lock, 1.15); lock.group.position.set(1.35, 0, -0.2); lock.group.rotation.y = -0.4;
  key.group.position.set(0.1, 0.1, 0.35); key.group.rotation.y = -0.25;
  st.scene.add(phone.group, key.group, lock.group);
  return {
    scene: st.scene, camera: st.camera,
    update(t) {
      K.arrive(phone.group, t, P.t_phone, { drop: -0.6, turn: -0.8 });
      phone.set("notify", K.progress(t, P.t_notify, 0.7));
      K.arrive(key.group, t, P.t_key, { drop: -0.4, turn: 0.9 });
      key.set("touch", K.progress(t, P.t_touch, 0.4));
      K.arrive(lock.group, t, P.t_phone + 0.25, { drop: -0.5, turn: 0.8 });
      lock.set("open", K.progress(t, P.t_lock, 0.9));
      lock.set("glow", K.progress(t, P.t_lock + 0.4, 0.5));
    },
  };
}
