// @model {"id": "rack_pdu", "pack": "datacentre", "what": "a vertical zero-U rack power strip: a tall housing in its feed's colour, a column of equipment outlets in groups with a light by each, breakers, a small load meter, a feed tag and an input cord with an industrial plug; optionally the A and B pair side by side", "parts": ["body", "outlets", "meter", "cord", "feed_tag"], "keys": {"power": "0..1 the outlet lights come on from top to bottom", "load": "0..1 the meter bar fills (in a pair, each strip's share; when one strip fails the other carries it all)", "fail": "0..1 the strip (in a pair, the second strip, B) goes dark and its tag turns to the alert role", "t": "seconds; the failed tag pulses (optional, call every frame)", "turn": "radians about y"}, "best_for": ["A and B power feeds and redundancy (2N)", "a power strip failing while the servers stay up", "load on a rack's power"], "not_for": ["household plugs or wall sockets (never)", "the whole power chain (use the power_path set)"], "size": [1.5, 6.4, 0.5], "sheet": {"opts": {"pair": true, "labels": ["A", "B"], "mark": 0.5}, "mood": "clean_bench", "elevation": 8, "turn": 1.2, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "power", "from": 0, "to": 1, "at": 0.3, "dur": 1.2}, {"key": "load", "from": 0, "to": 0.42, "at": 1.5, "dur": 0.8}, {"key": "fail", "from": 0, "to": 1, "at": 3.0, "dur": 0.5}]}}
// One strip (default) or opts.pair: true for A and B side by side. Feed colours: opts.roles (default ["ui", "warm"]),
// words only from opts.labels (or opts.label for one strip); none given: plain coloured tags. opts.mark (0..1) draws a
// tick on each meter (for example the half-load line of a 2N pair); no mark unless the caller gives one.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 0.5, H = 6.0, D = 0.38, NO = Math.max(6, Math.min(30, opts.outlets || 24)), GROUP = 8;
  const pair = !!opts.pair, roles = opts.roles || ["ui", "warm"];
  const labels = opts.labels || (opts.label ? [opts.label] : []);
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const shadowTok = () => K.hexOf(ctx, "shadow", opts);
  const plateMat = K.mat(ctx, THREE, "casing2", "plastic", opts, { roughness: 0.6 });
  const cOk = K.col(ctx, "ok", opts), cOff = K.col(ctx, "trim", opts), cBad = K.col(ctx, "bad", opts), cDead = K.col(ctx, "casing2", opts);

  // the outlet face, shared by both strips: generic locking equipment outlets (three slots), breakers between groups
  const Y0 = 0.35, Y1 = H - 0.75, gaps = Math.ceil(NO / GROUP) - 1, pitch = (Y1 - Y0) / (NO + gaps * 0.8);
  const outY = []; { let y = Y1 - pitch / 2; for (let i = 0; i < NO; i++) { outY.push(y); y -= pitch; if ((i + 1) % GROUP === 0) y -= pitch * 0.8; } }
  const PXU = 240, ff = K.face(ctx, THREE, Math.round(W * 0.84 * PXU), Math.round(H * PXU));
  ff.draw((g, w, h) => {
    const py = (y) => (H - y) * PXU;
    g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = shadowTok(); g.globalAlpha = 0.5; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    const ow = w * 0.56, oh = pitch * PXU * 0.72, ox = w * 0.1;
    outY.forEach((y) => {
      const yy = py(y) - oh / 2;
      g.fillStyle = K.hexOf(ctx, "trim", opts); K.rr(g, ox, yy, ow, oh, oh * 0.18); g.fill();
      g.fillStyle = shadowTok(); K.rr(g, ox + ow * 0.08, yy + oh * 0.12, ow * 0.84, oh * 0.76, oh * 0.12); g.fill();
      g.fillStyle = K.hexOf(ctx, "metal", opts);
      for (const [sx, sy] of [[0.3, 0.42], [0.7, 0.42], [0.5, 0.7]]) { K.rr(g, ox + ow * sx - ow * 0.05, yy + oh * sy - oh * 0.14, ow * 0.1, oh * 0.28, 2); g.fill(); }
    });
    for (let k = 1; k <= gaps; k++) {                 // a breaker between groups
      const y = (outY[k * GROUP - 1] + outY[k * GROUP]) / 2;
      g.fillStyle = K.hexOf(ctx, "trim", opts); K.rr(g, w * 0.2, py(y) - pitch * PXU * 0.3, w * 0.6, pitch * PXU * 0.6, 6); g.fill();
      g.fillStyle = shadowTok(); K.rr(g, w * 0.32, py(y) - pitch * PXU * 0.18, w * 0.36, pitch * PXU * 0.36, 4); g.fill();
    }
  });
  const faceMat = new THREE.MeshPhysicalMaterial({ map: ff.tex, roughness: 0.7, specularIntensity: 0.15, envMapIntensity: 0.5 });

  const strip = (si, x) => {
    const g = new THREE.Group(); g.position.x = x; pivot.add(g);
    const roleName = roles[si] || roles[0], roleCol = K.col(ctx, roleName, opts);
    const bodyMat = K.mat(ctx, THREE, roleName, "matte", opts, { roughness: 0.8, specularIntensity: 0.15, envMapIntensity: 0.5 });
    const body = K.mesh(THREE, K.rbox(THREE, X, W, H, D, 0.05, 3), bodyMat); body.position.y = H / 2; g.add(body);
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.84, H - 0.1), faceMat); fp.position.set(0, H / 2, D / 2 + 0.002); g.add(fp);
    // outlet lights: one instanced mesh, a light to the right of each outlet
    const leds = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.06, 0.02), new THREE.MeshBasicMaterial({ toneMapped: false }), NO);
    const dm = new THREE.Object3D();
    outY.forEach((y, i) => { dm.position.set(W * 0.84 * 0.3, y, D / 2 + 0.01); dm.updateMatrix(); leds.setMatrixAt(i, dm.matrix); leds.setColorAt(i, cOff); });
    g.add(leds);
    // the meter: a small screen at the top with a bar (and an optional tick); redrawn only when its value changes
    const mf = K.face(ctx, THREE, 200, 120);
    const meterMat = new THREE.MeshBasicMaterial({ map: mf.tex, toneMapped: false });
    const meter = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7, W * 0.42), meterMat); meter.position.set(0, H - 0.42, D / 2 + 0.004); g.add(meter);
    const drawMeter = (v, dead) => mf.draw((c, w, h) => {
      c.fillStyle = K.hexOf(ctx, dead ? "casing2" : "screen", opts); c.fillRect(0, 0, w, h);
      if (dead) return;
      c.fillStyle = K.hexOf(ctx, "paper2", opts); K.rr(c, 16, h * 0.42, w - 32, h * 0.3, 6); c.fill();
      c.fillStyle = K.hexOf(ctx, v > 0.9 ? "bad" : v > 0.75 ? "warm" : "ok", opts); K.rr(c, 16, h * 0.42, Math.max(0, (w - 32) * Math.min(1, v)), h * 0.3, 6); c.fill();
      if (opts.mark != null) { c.fillStyle = K.hexOf(ctx, "text", opts); c.fillRect(16 + (w - 32) * K.clamp(opts.mark) - 2, h * 0.3, 4, h * 0.54); }
    }, (dead ? "x" : "") + Math.round(v * 200));
    // the feed tag at the top end, with the caller's word on it
    const tagMat = K.mat(ctx, THREE, roleName, "matte", opts, { emissive: cBad, emissiveIntensity: 0, specularIntensity: 0.15 });
    const tag = K.mesh(THREE, K.rbox(THREE, X, W * 0.9, 0.34, 0.06, 0.03, 2), tagMat); tag.position.set(0, H + 0.2, 0); g.add(tag);
    const cap = K.mesh(THREE, K.rbox(THREE, X, W * 0.6, 0.06, D * 0.6, 0.02, 2), plateMat); cap.position.set(0, H + 0.02, 0); g.add(cap);
    if (labels[si]) { const l = K.label(ctx, THREE, labels[si], { h: 0.26, role: "onAccent" }); l.position.set(0, H + 0.2, 0.035); g.add(l); const l2 = l.clone(); l2.rotation.y = Math.PI; l2.position.z = -0.035; g.add(l2); }
    // the input cord leaves the bottom end and runs to an industrial plug on the floor
    const cordMat = K.mat(ctx, THREE, roleName, "rubber", opts);
    const sx = si ? 1 : -1;
    const curve = new THREE.CatmullRomCurve3([[0, 0.32, -D / 2 + 0.02], [0, 0.16, -D / 2 - 0.1], [0, 0.05, -0.55], [0.06 * sx, 0.05, -0.92]].map((p) => new THREE.Vector3(...p)));
    const cord = K.mesh(THREE, new THREE.TubeGeometry(curve, 24, 0.045, 10, false), cordMat); g.add(cord);
    const plug = K.mesh(THREE, new THREE.CylinderGeometry(0.11, 0.11, 0.32, 24), K.mat(ctx, THREE, "trim", "plastic", opts)); plug.rotation.x = Math.PI / 2; plug.position.set(0.06 * sx, 0.11, -1.06); g.add(plug);
    for (const y of [0.8, H - 0.8]) { const b = K.mesh(THREE, new THREE.CylinderGeometry(0.07, 0.07, 0.06, 16), plateMat); b.rotation.x = Math.PI / 2; b.position.set(0, y, -D / 2 - 0.03); g.add(b); }
    return { g, body, bodyMat, roleCol, leds, meter, drawMeter, tagMat, tag, cord, cordMat };
  };
  const strips = pair ? [strip(0, -0.42), strip(1, 0.42)] : [strip(0, 0)];
  group.add(K.contactShadow(ctx, THREE, pair ? 2.4 : 1.4, 1.6, 0.45));

  const st = { power: 0, load: 0, fail: 0, t: 0 };
  const apply = () => {
    const lit = Math.round(st.power * NO);
    strips.forEach((s, si) => {
      const f = si === strips.length - 1 ? st.fail : 0;   // a single strip fails itself; in a pair, B fails
      for (let i = 0; i < NO; i++) s.leds.setColorAt(i, i < lit && f < 0.5 ? cOk : cOff);
      s.leds.instanceColor.needsUpdate = true;
      s.bodyMat.color.copy(s.roleCol).lerp(cDead, f * 0.85); s.cordMat.color.copy(s.roleCol).lerp(cDead, f * 0.85);
      s.tagMat.color.copy(s.roleCol).lerp(cBad, f); s.tagMat.emissiveIntensity = f * (0.6 + 0.4 * Math.sin(st.t * 7));
      const share = pair && si === 0 ? st.load * (1 + st.fail) : st.load * (1 - f);
      s.drawMeter(st.power > 0 ? share : 0, f >= 0.5);
    });
  };
  apply();
  const one = strips[0];
  return {
    group, size: [pair ? 1.5 : W + 0.2, H + 0.4, D + 0.12], parts: { body: one.body, outlets: one.leds, meter: one.meter, cord: one.cord, feed_tag: one.tag },
    keys: ["power", "load", "fail", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
