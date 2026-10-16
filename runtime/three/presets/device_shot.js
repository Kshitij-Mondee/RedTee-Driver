// @preset {"id": "device_shot", "what": "one device from the model library, its screen and its moments driven by spoken words; the device, screen and mood are params, so the engine can swap them after the storyboard", "params": {"device": {"choices": ["phone", "tablet", "laptop", "monitor", "desk_set"], "required": true}, "screen": "a screen spec (kind blank, notification, code, lock, chat, login, alert, list, diff, terminal, link_hover, prompt)", "screens": "[{say, screen}]: later screens, each from the spoken words it names", "notify": "{title, line} a banner (phone and tablet)", "arrive_say": "words the device arrives on (default: the clip start)", "wake_say": "words the screen lights on", "notify_say": "words the banner drops on", "lid_say": "words the laptop opens on", "chair_say": "words the desk chair is pushed back on (desk_set)", "mood_say": "words a moving mood (incident) starts on", "mood": {"choices": ["cold_aisle", "hot_aisle", "machine_night", "latent_space", "clean_bench", "warm_office", "incident", "blueprint_iso"]}, "light": {"choices": ["studio", "soft"]}, "place": {"choices": ["centre", "left", "right"]}, "sway": "radians of idle turn (default 0.18)", "opts": "extra options for the device model"}}
// A preset scene (D-140): a storyboard names it instead of writing a file,
//   {"kind": "three", "three": {"preset": "device_shot", "rect": [...], "params": {"device": "laptop", "screen": {...}, "wake_say": "..."}}}
// and `py -m loom device <id> <beat> <device> [--screen JSON] [--mood m]` swaps any of it later. Times are spoken words
// (`*_say`, resolved by the bridge) or, in the lab, seconds (`*_at`). Every word on a screen comes from params.
export async function build(ctx, THREE, X) {
  const K = X.kit, P = ctx.params || {};
  const at = (k, dflt) => (typeof P[k + "_at"] === "number" ? P[k + "_at"] : P[k + "_say"] ? ctx.cue(P[k + "_say"]) : dflt);
  const dev = P.device || "laptop";
  const opts = Object.assign({}, P.opts || {}, { screen: P.screen || { kind: "blank" } });
  if (P.notify) opts.notify = P.notify;
  if (dev === "laptop") opts.lid = P.lid_say || typeof P.lid_at === "number" ? 0 : 1;
  const m = await X.model(dev, opts);
  const has = (k) => (m.keys || []).includes(k);
  const [w, h, d] = m.size;
  const aspect = X.W / X.H;
  // framing per device: a laptop or a desk is seen from above, so its depth needs room below the screen
  const F = { phone: [1.2, 0.5], tablet: [1.55, 0.5], laptop: [1.65, 0.42], monitor: [1.3, 0.48], desk_set: [1.6, 0.36] }[dev] || [1.3, 0.5];
  const fh = Math.max(h, Math.hypot(w, d) * 0.9 / aspect) * F[0];
  const st = K.stage(ctx, THREE, X, { light: P.light || "studio", mood: P.mood, moodAt: at("mood", 0), frame: [0, h * F[1], fh], elevation: dev === "laptop" || dev === "desk_set" ? 18 : 10 });
  const shift = { centre: 0, left: -0.22, right: 0.22 }[P.place || "centre"] * fh * aspect;
  m.group.position.x = shift;
  m.group.rotation.y = (P.place === "left" ? 0.35 : P.place === "right" ? -0.35 : -0.3);
  st.scene.add(m.group);
  const tArrive = at("arrive", 0.05), tWake = at("wake", null), tNotify = at("notify", null), tLid = at("lid", null), tChair = at("chair", null);
  const later = (P.screens || []).map((s) => ({ t: typeof s.at === "number" ? s.at : ctx.cue(s.say), screen: s.screen })).sort((a, b) => a.t - b.t);
  return {
    scene: st.scene, camera: st.camera,
    update(t) {
      st.update(t);
      K.arrive(m.group, t, tArrive, { dur: 1.1, drop: -h * 0.35, turn: -0.9 });
      K.sway(m.group, Math.max(0, t - tArrive), { amp: P.sway == null ? 0.18 : P.sway, speed: 0.35 });
      if (has("t")) m.set("t", t);
      if (has("wake")) m.set("wake", tWake == null ? 1 : K.progress(t, tWake, 0.6));
      if (has("lid") && tLid != null) m.set("lid", K.progress(t, tLid, 1.2));
      if (has("notify") && tNotify != null) m.set("notify", K.progress(t, tNotify, 0.7));
      if (has("chair") && tChair != null) m.set("chair", K.progress(t, tChair, 1.2));
      if (has("screen") && later.length) {
        let cur = opts.screen;
        for (const s of later) if (t >= s.t) cur = s.screen;
        m.set("screen", cur);
      }
    },
  };
}
