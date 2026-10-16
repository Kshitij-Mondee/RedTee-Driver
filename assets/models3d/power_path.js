// @model {"id": "power_path", "pack": "datacentre", "set": true, "what": "an isometric 2N power chain: two separate paths, A and B, each from its own utility feed through a transformer and switchgear with a transfer switch (its own standby generator wired to that switch), a UPS (the library's ups_cabinet) and an output breaker to its own rack power strip (rack_pdu), ending at one dual-supply server whose two power supplies take one cord from each path; the generators (generator_set) stand outside the lanes", "parts": ["paths", "utility", "transformers", "switchgear", "transfer_switches", "generators", "ups", "breakers", "pdus", "server", "pulses", "labels"], "keys": {"flow": "0..1 energy pulses travel both paths (in each path's colour) and the equipment lights", "utility_fail": "0..1 the utility feed goes dark (opts.utilityFail both | a | b, default both): the UPS carries the load at once on its batteries, the generator cranks and runs, the transfer switch throws to the generator, and the UPS returns to normal; the server never loses power", "path_fail": "\"a\" or \"b\": that path's output breaker trips and everything after it goes dark while the server stays lit on the other path; or a number 0..1 that fails opts.failPath (default b) gradually; \"\" or 0 for none", "t": "seconds; moves the pulses and is forwarded to the generators, UPSs and power strips (call every frame)", "turn": "radians about y"}, "best_for": ["2N power redundancy: two paths that stay separate end to end", "what happens when the utility fails: UPS bridge, generator start, transfer", "why a server has two power supplies", "one path failing while the load stays up"], "not_for": ["inside the UPS or the generator (use ups_cabinet, generator_set)", "a single rack's power strips (use rack_pdu)", "PUE or energy use (a physics recipe)"], "size": [11.6, 3.4, 9.0], "sheet": {"opts": {"failPath": "b", "labels": {"utility": "Utility", "transformer": "Transformer", "switchgear": "Switchgear", "generator": "Generator", "ups": "UPS", "pdu": "PDU", "server": "Server", "a": "A", "b": "B"}}, "mood": "blueprint_iso", "light": "iso", "turn": 0.9, "states": [{"key": "t", "from": 0, "to": 6, "at": 0, "dur": 6}, {"key": "flow", "from": 0, "to": 1, "at": 0.2, "dur": 0.6}, {"key": "utility_fail", "from": 0, "to": 1, "at": 1.6, "dur": 2.2}, {"key": "path_fail", "from": 0, "to": 1, "at": 4.7, "dur": 0.5}]}}
// Flow runs along +x: sources at -x (utility poles; generators outside the lanes), the server at +x. Path A is the -z
// lane in the role opts.roles[0] (default ui), path B the +z lane in opts.roles[1] (default warm), as on rack_pdu. The
// two paths share nothing until the server's two supplies. Words only from opts.labels {utility, transformer,
// switchgear, generator, ups, pdu, server, a, b}; none given, no plates.
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const roles = opts.roles || ["ui", "warm"], labs = opts.labels || {};
  const LZ = 1.9, ZG = LZ + 1.75, YC = 1.9, OX = 0.95;
  const xP = -5.6 + OX, xT = -3.8 + OX, xS = -1.7 + OX, xU = 0.5 + OX, xD = 2.5 + OX, xV = 3.9 + OX, xG = xT - 1.0;
  const dark = K.role(ctx, "screen", opts) === "field";
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const M = (role, kind, extra) => K.mat(ctx, THREE, role, kind, opts, Object.assign({ specularIntensity: 0.35 }, extra || {}));
  const box = (w, h, d, x, y, z, m, parent, r = 0.02) => { const o = K.mesh(THREE, r > 0 ? K.rbox(THREE, X, w, h, d, r, 2) : new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent.add(o); return o; };
  const cyl = (r, h, x, y, z, m, parent, seg = 16) => { const o = K.mesh(THREE, new THREE.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z); parent.add(o); return o; };
  const shell = M("casing", "plastic", { roughness: 0.55 }), shell2 = M("casing2", "plastic", { roughness: 0.6 }), metal = M("metal", "metal", { roughness: 0.4 });
  const cOk = K.col(ctx, "ok", opts), cOff = K.col(ctx, "trim", opts), cBad = K.col(ctx, "bad", opts);
  const lamp = (x, y, z, parent) => { const m = new THREE.MeshStandardMaterial({ color: cOff.clone(), emissive: cOk.clone(), emissiveIntensity: 0 }); const o = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), m); o.position.set(x, y, z); parent.add(o); return m; };
  const setLamp = (m, on, c = cOk) => { m.color.copy(on > 0.5 ? c : cOff); m.emissive.copy(c); m.emissiveIntensity = on > 0.5 ? 1.3 : 0; };
  // a conduit along a polyline with square corners (a tube per straight run)
  const conduit = (pts, r, m, parent) => {
    const cp = new THREE.CurvePath();
    for (let i = 1; i < pts.length; i++) cp.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i - 1]), new THREE.Vector3(...pts[i])));
    const o = K.mesh(THREE, new THREE.TubeGeometry(cp, Math.max(8, pts.length * 6), r, 8, false), m); parent.add(o); return o;
  };
  const paths = new THREE.Group(), utility = new THREE.Group(), transformers = new THREE.Group(), switchgear = new THREE.Group(), transfer_switches = new THREE.Group();
  const generators = new THREE.Group(), ups = new THREE.Group(), breakers = new THREE.Group(), pdus = new THREE.Group(), server = new THREE.Group(), pulses = new THREE.Group(), labels = new THREE.Group();
  pivot.add(paths, utility, transformers, switchgear, transfer_switches, generators, ups, breakers, pdus, server, pulses, labels);
  const ground = box(12.0, 0.04, 9.2, 0, -0.02, 0, M(dark ? "casing2" : "paper", "matte"), pivot, 0);
  ground.receiveShadow = true;

  const lanes = [];
  for (const [li, s] of [[0, -1], [1, 1]]) {
    const zl = s * LZ, role = roles[li], cabM = M("casing2", "rubber");
    const laneM = M(role, "plastic", { roughness: 0.5 }), upM = M(role, "plastic", { roughness: 0.5 }), outM = M(role, "plastic", { roughness: 0.5 });   // whole path, before and after the breaker
    const L = { li, s, zl, role, segs: {}, lamps: {} };
    // the utility feed: a pole with a crossarm and insulators, and a status lamp
    cyl(0.08, 2.7, xP, 1.35, zl, M("trim", "matte"), utility);
    box(0.08, 0.08, 0.9, xP, 2.5, zl, metal, utility, 0.01);
    for (const dz of [-0.35, 0, 0.35]) cyl(0.035, 0.14, xP, 2.6, zl + dz, M("paper2", "plastic"), utility);
    L.lamps.util = lamp(xP + 0.12, 2.25, zl, utility);
    // the transformer: a tank with cooling fins on two sides, three bushings on top, on a pad
    box(1.3, 0.08, 1.2, xT, 0.04, zl, shell2, transformers, 0.01);
    box(0.95, 1.05, 0.8, xT, 0.6, zl, M("metal", "plastic", { roughness: 0.5 }), transformers, 0.04);
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.85, 0.18), metal, 14), mm = new THREE.Matrix4();
    for (let i = 0; i < 14; i++) { const side = i < 7 ? -1 : 1, k = i % 7; mm.makeTranslation(xT - 0.39 + k * 0.13, 0.58, zl + side * 0.49); fins.setMatrixAt(i, mm); }
    transformers.add(fins);
    for (const dx of [-0.25, 0, 0.25]) cyl(0.04, 0.2, xT + dx, 1.22, zl, M("paper2", "plastic"), transformers);
    L.lamps.tx = lamp(xT + 0.49, 0.95, zl + 0.2, transformers);
    // switchgear: a lineup of three sections (incomer, transfer switch, outgoing) facing +z
    for (const dx of [-0.6, 0, 0.6]) box(0.58, 1.6, 0.7, xS + dx, 0.8, zl, shell, switchgear, 0.02);
    const sgf = K.face(ctx, THREE, 128, 200);
    sgf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "shadow", opts); for (let i = 0; i < 6; i++) { K.rr(g, 20, 120 + i * 12, w - 40, 5, 2); g.fill(); } g.fillStyle = K.hexOf(ctx, "trim", opts); K.rr(g, w - 30, 70, 10, 40, 4); g.fill(); });
    const sgM = new THREE.MeshStandardMaterial({ map: sgf.tex, roughness: 0.6 });
    for (const dx of [-0.6, 0.6]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.45), sgM); p.position.set(xS + dx, 0.8, zl + 0.352); switchgear.add(p); }
    // the transfer switch: a mimic with two contacts (utility left, generator right) and a lever that throws between them
    const ats = new THREE.Group(); ats.position.set(xS, 1.05, zl + 0.36); transfer_switches.add(ats);
    box(0.48, 0.62, 0.02, 0, 0, 0, M("screen", "matte"), ats, 0.01);
    L.lamps.atsU = lamp(-0.15, 0.2, 0.03, ats); L.lamps.atsG = lamp(0.15, 0.2, 0.03, ats);
    const lever = new THREE.Group(); lever.position.set(0, -0.2, 0.03); ats.add(lever);
    box(0.05, 0.36, 0.03, 0, 0.18, 0, M(role, "plastic"), lever, 0.01);
    cyl(0.05, 0.04, 0, 0, 0, metal, lever).rotation.x = Math.PI / 2;
    L.lever = lever;
    L.lamps.sg = lamp(xS - 0.6, 1.45, zl + 0.37, switchgear);
    // the generator: the library's generator_set, outside the lane, its control end (and output) towards +x
    const gen = await X.model("generator_set", { colors: opts.colors });
    // its output conduit leaves the control end on the side towards the lane (A turned half round, B as built)
    const gs = 0.55; gen.group.scale.setScalar(gs); gen.group.rotation.y = s < 0 ? Math.PI : 0; gen.group.position.set(xG, 0, s * ZG); generators.add(gen.group);
    L.gen = gen;
    const gOut = [xG - s * 2.8 * gs, 0.05, s * (ZG - 1.4 * gs)];
    // the UPS: the library's ups_cabinet facing +z; its input and output cables end at its back, at the conduit height
    const u = await X.model("ups_cabinet", { colors: opts.colors });
    const us = 0.8; u.group.scale.setScalar(us); u.group.position.set(xU, 0, zl); ups.add(u.group); u.set("charge", 1);
    L.ups = u;
    const uIn = [xU - 0.65 * us, (2.0 + 0.26) * us, zl - 0.75 * us], uOut = [xU - 0.3 * us, (2.0 + 0.26) * us, zl - 0.75 * us];
    // the rack power strip for this path: rack_pdu, single, in the path's colour, beside the server, outlets towards it
    const pd = await X.model("rack_pdu", { roles: [role], label: labs[li ? "b" : "a"], colors: opts.colors });
    const ps = 0.3; pd.group.scale.setScalar(ps); pd.group.rotation.y = s < 0 ? 0 : Math.PI; pd.group.position.set(xD, 0, s * 1.0); pdus.add(pd.group);
    pd.set("load", 0.4);
    L.pdu = pd;
    const plug = [xD, 0.05, s * (1.0 + 1.06 * ps)];
    // the output breaker on the path after the UPS (what trips in path_fail)
    const brM = M(role, "plastic", { emissive: cBad, emissiveIntensity: 0 });
    const zc = zl - 0.6, xBr = xU + 0.85;
    box(0.36, 0.36, 0.3, xBr, YC, zc, brM, breakers, 0.04);
    L.brM = brM; L.brBase = brM.color.clone();
    // conduits: the overhead run sits behind the equipment at YC on posts; the generator's run is on the ground
    const segs = {
      util: [[xP, 2.5, zl + 0.35], [xT - 0.25, 1.32, zl]],
      tx: [[xT + 0.25, 1.32, zl], [xT + 0.25, YC, zl], [xT + 0.25, YC, zc], [xS - 0.6, YC, zc], [xS - 0.6, 1.6, zc], [xS - 0.6, 1.6, zl - 0.2]],
      gen: [gOut, [xS, 0.05, gOut[2]], [xS, 0.05, zl + s * 0.36], [xS, 0.45, zl + s * 0.36]],
      sg: [[xS + 0.6, 1.6, zl - 0.2], [xS + 0.6, 1.6, zc], [xS + 0.6, YC, zc], [uIn[0], YC, zc], [uIn[0], uIn[1], uIn[2]]],
      out: [[uOut[0], uOut[1], uOut[2]], [uOut[0], YC, zc], [xD - 0.6, YC, zc], [xD - 0.6, 0.05, zc], [xD - 0.6, 0.05, plug[2]], plug],
    };
    conduit(segs.util, 0.025, cabM, paths);
    conduit(segs.tx, 0.055, upM, paths); conduit(segs.gen, 0.055, cabM, paths); conduit(segs.sg, 0.055, laneM, paths); conduit(segs.out, 0.055, outM, paths);
    L.upM = upM; L.outM = outM; L.roleC = K.col(ctx, role, opts);
    for (const x of [xT + 0.25, xS - 0.6, xS + 0.6, xBr]) cyl(0.03, YC - 0.06, x, (YC - 0.06) / 2, zc, metal, paths, 8);   // posts under the run
    // the power cord from the strip's outlets to this path's supply on the server
    const cordFrom = [xD, 0.95, s * (1.0 - 0.2 * ps)], psu = [xV - 0.72, 1.0, s * 0.3];
    segs.cord = [cordFrom, [xD + 0.5, 0.95, s * 0.75], [psu[0], psu[1], psu[2]]];
    conduit(segs.cord, 0.03, outM, paths);
    L.segs = segs;
    // pulses on every run, in the path's colour (generator power in the same colour: it feeds this path only)
    const fl = (pts, n) => { const f = K.flow(ctx, THREE, { paths: [pts.map(([x, y, z]) => [x, y, z])], count: n, size: 0.085, from: role }); pulses.add(f.group); return f; };
    L.f = { util: fl(segs.util, 5), tx: fl(segs.tx, 9), gen: fl(segs.gen, 9), sg: fl(segs.sg, 9), out: fl(segs.out, 10), cord: fl(segs.cord, 5) };
    // the path's tag, a nameplate in front of its transformer (where the path's own equipment begins)
    if (labs[li ? "b" : "a"]) { const l = K.label(ctx, THREE, labs[li ? "b" : "a"], { h: 0.6, bg: role, role: "onAccent" }); l.rotation.y = Math.PI / 4; l.position.set(xT + 0.15, 0.62, zl + 0.75); labels.add(l); }
    lanes.push(L);
  }

  // the dual-supply server on a stand: its rear (-x) carries two supplies, one per path; a status light at the front
  box(1.4, 0.06, 1.1, xV, 0.84, 0, metal, server, 0.01);
  for (const dx of [-0.62, 0.62]) for (const dz of [-0.48, 0.48]) box(0.05, 0.84, 0.05, xV + dx, 0.42, dz, metal, server, 0.01);
  box(1.3, 0.3, 1.0, xV, 1.02, 0, shell, server, 0.03);
  const sf = K.face(ctx, THREE, 256, 64);
  sf.draw((g, w, h) => { g.fillStyle = K.hexOf(ctx, "casing2", opts); g.fillRect(0, 0, w, h); g.fillStyle = K.hexOf(ctx, "shadow", opts); for (let i = 0; i < 18; i++) { K.rr(g, 14 + i * 11, 12, 6, h - 24, 3); g.fill(); } });
  const sface = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.24), new THREE.MeshStandardMaterial({ map: sf.tex, roughness: 0.6 })); sface.rotation.y = Math.PI / 2; sface.position.set(xV + 0.652, 1.02, 0); server.add(sface);
  const srvLamp = lamp(xV + 0.66, 1.02, 0.4, server);
  lanes.forEach((L) => { box(0.12, 0.2, 0.3, xV - 0.71, 1.0, L.s * 0.3, M(L.role, "plastic"), server, 0.02); L.lamps.psu = lamp(xV - 0.78, 1.0, L.s * 0.3 + L.s * 0.1, server); });

  // labels above the chain (words only from opts.labels), facing the iso view
  const plate = (text, x, y, z) => { if (!text) return; const l = K.label(ctx, THREE, text, { h: 0.6, bg: dark ? "casing" : "paper", role: "text" }); l.rotation.y = Math.PI / 4; l.position.set(x, y, z); labels.add(l); };
  // one height for the whole row: along +x the iso view steps each plate down and right, so equal heights never overlap
  for (const [k, x] of [["utility", xP], ["transformer", xT], ["switchgear", xS], ["ups", xU], ["pdu", xD], ["server", xV]]) plate(labs[k], x, 2.95, 0);
  plate(labs.generator, xG, 2.3, ZG + 0.2);

  // ------------------------------------------------------------------ state
  const st = { flow: 0, utility_fail: 0, path_fail: 0, failWhich: opts.failPath === "a" ? 0 : 1, t: 0 };
  const uWhich = opts.utilityFail === "a" ? [1, 0] : opts.utilityFail === "b" ? [0, 1] : [1, 1];
  const apply = () => {
    const fl = st.flow, ph = st.t * 0.5;
    let live = 0;
    lanes.forEach((L, li) => {
      const uf = st.utility_fail * uWhich[li], pf = li === st.failWhich ? st.path_fail : 0;
      const dark = K.clamp(uf / 0.08), dis = dark * (1 - K.clamp((uf - 0.75) / 0.1));
      const gstart = K.clamp((uf - 0.12) / 0.25), grun = K.clamp((uf - 0.45) / 0.25), thr = K.easeInOut(K.clamp((uf - 0.7) / 0.08));
      L.f.util.set(ph, fl * (1 - dark)); L.f.tx.set(ph + 0.1, fl * (1 - dark));
      L.upM.color.copy(L.roleC).lerp(cOff, 0.75 * dark); L.outM.color.copy(L.roleC).lerp(cOff, 0.75 * K.clamp(pf * 2));   // dead runs grey out
      L.f.gen.set(ph + 0.2, fl * thr * grun);
      L.f.sg.set(ph + 0.3, fl * Math.max(1 - dark, thr));
      const outLive = 1 - K.clamp(pf * 2);
      L.f.out.set(ph + 0.4, fl * outLive); L.f.cord.set(ph + 0.5, fl * outLive);
      L.gen.set("t", st.t); L.gen.set("start", gstart); L.gen.set("run", grun);
      L.ups.set("t", st.t); L.ups.set("discharge", dis * (fl > 0.01 ? 1 : 0));
      L.pdu.set("t", st.t); L.pdu.set("power", K.clamp(fl * 1.5)); L.pdu.set("fail", K.clamp(pf * 2));
      L.lever.rotation.z = K.lerp(0.6, -0.6, thr);                // left: utility contact; right: generator contact
      setLamp(L.lamps.util, fl * (1 - dark), cOk); if (dark > 0.5) setLamp(L.lamps.util, 1, cBad);
      setLamp(L.lamps.tx, fl * (1 - dark)); setLamp(L.lamps.sg, fl * Math.max(1 - dark, thr));
      setLamp(L.lamps.atsU, fl * (1 - dark)); setLamp(L.lamps.atsG, fl * thr);
      L.brM.color.copy(L.brBase).lerp(cBad, K.clamp(pf * 2)); L.brM.emissiveIntensity = K.clamp(pf * 2) * (0.7 + 0.3 * Math.sin(st.t * 6));
      setLamp(L.lamps.psu, fl * outLive);
      live = Math.max(live, fl * outLive);
    });
    setLamp(srvLamp, live);
  };
  apply();
  return {
    group, size: [11.6, 3.4, 9.0],
    parts: { paths, utility, transformers, switchgear, transfer_switches, generators, ups, breakers, pdus, server, pulses, labels },
    keys: ["flow", "utility_fail", "path_fail", "t", "turn"],
    set(key, v) {
      if (key === "turn") { pivot.rotation.y = v; return; }
      if (key === "t") { st.t = Number(v) || 0; apply(); return; }
      if (key === "path_fail") {
        // "a" | "b" fails that path fully; a number fails opts.failPath by that much; "" / null / 0 for none
        if (v === "a" || v === "b") { st.failWhich = v === "a" ? 0 : 1; st.path_fail = 1; }
        else { st.failWhich = opts.failPath === "a" ? 0 : 1; st.path_fail = K.clamp(Number(v) || 0); }
        apply(); return;
      }
      if (key in st) { st[key] = K.clamp(v); apply(); }
    },
  };
}
