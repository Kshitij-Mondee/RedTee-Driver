// @model {"id": "envelope", "pack": "workplace", "what": "a paper envelope standing up, back towards us: the flap opens and a letter rises out; with opts.attachment a paper clip holds a file tag to the letter", "parts": ["pocket", "flap", "letter", "attachment"], "keys": {"open": "0 sealed .. 1 flap open", "letter": "0 inside .. 1 risen out (open the flap first)", "attachment": "0..1 the paper clip and the file tag (opts.attachment.name) come out with the letter (raise the letter first)", "reveal": "0..1 the tag turns over on its clip to show its real type (opts.attachment.real) in the alert role", "turn": "radians about y"}, "best_for": ["an email or message arriving", "a phishing message opened", "a letter or notice", "sending and receiving", "an unexpected or disguised attachment"], "not_for": ["an inbox list (use a UI artefact or the phone/laptop screen)"], "size": [1.6, 1.9, 0.08], "sheet": {"opts": {"letter": {"title": "Invoice overdue", "lines": 5}, "seal": "bad", "attachment": {"name": "Invoice_0427.pdf", "real": "Invoice_0427.pdf.exe"}}, "states": [{"key": "open", "from": 0, "to": 1, "at": 1.0, "dur": 0.7}, {"key": "letter", "from": 0, "to": 1, "at": 1.7, "dur": 1.0}, {"key": "attachment", "from": 0, "to": 1, "at": 2.7, "dur": 0.7}, {"key": "reveal", "from": 0, "to": 1, "at": 4.0, "dur": 0.9}]}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const W = 1.6, H = 1.0, T = 0.03;
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  const paper = K.mat(ctx, THREE, "paper", "paper", opts, { side: THREE.DoubleSide });
  const paper2 = K.mat(ctx, THREE, "paper2", "paper", opts, { side: THREE.DoubleSide });

  // the pocket: a back panel, the front panel (towards us) cut to a V with side triangles
  const backPanel = K.mesh(THREE, K.rbox(THREE, X, W, H, T * 0.5, 0.012, 2), paper2);
  backPanel.position.set(0, H / 2, -0.03); pivot.add(backPanel);
  const front = new THREE.Shape();
  front.moveTo(-W / 2, 0); front.lineTo(W / 2, 0); front.lineTo(W / 2, H); front.lineTo(0, H * 0.42); front.lineTo(-W / 2, H); front.lineTo(-W / 2, 0);
  const pocket = K.mesh(THREE, K.extrude(THREE, front, 0.006, 0.004, 4), paper2);
  pocket.position.z = 0.02; pivot.add(pocket);
  // fold lines: thin darker slivers along the V
  const fold = K.mat(ctx, THREE, "trim", "matte", opts, { transparent: true, opacity: 0.35 });
  for (const s of [-1, 1]) {
    const len = Math.hypot(W / 2, H * 0.58), m = K.mesh(THREE, new THREE.BoxGeometry(len, 0.006, 0.004), fold, false);
    m.position.set(s * W / 4, H * 0.71, 0.029); m.rotation.z = s * Math.atan2(H * 0.58, W / 2); pivot.add(m);
  }

  // the letter: a sheet with a title and line bars (words only from opts.letter)
  const L = opts.letter || {};
  const lf = K.face(ctx, THREE, 900, 760);
  lf.draw((g, w, h) => {
    g.fillStyle = K.hexOf(ctx, "paper", opts); g.fillRect(0, 0, w, h);
    g.fillStyle = K.hexOf(ctx, opts.seal || "ui", opts); g.fillRect(0, 0, w, 26);
    let y = 110;
    if (L.title) { g.fillStyle = K.hexOf(ctx, "ink", opts); g.textBaseline = "middle"; g.font = K.font(ctx, "title", 64, 700);
      g.fillText(K.fitText(g, L.title, w - 120, (q) => K.font(ctx, "title", q, 700), 64), 60, y); y += 100; }
    g.fillStyle = K.hexOf(ctx, "ink", opts); g.globalAlpha = 0.16;
    for (let i = 0; i < (L.lines || 5); i++) { K.rr(g, 60, y + i * 74, (w - 120) * [0.95, 0.8, 0.9, 0.6, 0.85, 0.7][i % 6], 30, 15); g.fill(); }
  });
  const letter = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, H * 0.9), new THREE.MeshStandardMaterial({ map: lf.tex, roughness: 0.9, side: THREE.DoubleSide }));
  const LH0 = H * 0.9 / 2 + 0.04;
  letter.position.set(0, LH0, 0.0); pivot.add(letter);

  // the flap: a triangle hinged at the top edge; closed it folds down over the pocket, open it stands up behind
  const flapShape = new THREE.Shape(); flapShape.moveTo(-W / 2, 0); flapShape.lineTo(W / 2, 0); flapShape.lineTo(0, -H * 0.62); flapShape.lineTo(-W / 2, 0);
  const flapMesh = K.mesh(THREE, K.extrude(THREE, flapShape, 0.006, 0.004, 4), paper);
  const flap = new THREE.Group(); flap.position.set(0, H, 0.03); flap.add(flapMesh); pivot.add(flap);
  // the seal: a small disc on the flap's tip in the seal colour
  const seal = K.mesh(THREE, new THREE.CylinderGeometry(0.075, 0.075, 0.016, 32), K.mat(ctx, THREE, opts.seal || "ui", "plastic", opts));
  seal.rotation.x = Math.PI / 2; seal.position.set(0, -H * 0.5, 0.01); flapMesh.add(seal);
  group.add(K.contactShadow(ctx, THREE, W * 1.5, 0.5, 0.4));

  // the attachment (only with opts.attachment): a paper clip on the letter's right edge holding the end of a file tag; the tag
  // shows the name it was sent as on its front and its real type, in the alert role, on its back (words from opts)
  const A = opts.attachment || null;
  let tag = null, clip = null, attach = null;
  const TW = 1.0, TH = 0.3, LW = W * 0.86, TY = H * 0.9 / 2 - 0.4;   // the tag lies over the line bars, under the title
  if (A) {
    attach = new THREE.Group(); letter.add(attach);
    const tagFace = (name, alert) => {
      const f = K.face(ctx, THREE, 1440, 432);
      f.draw((g, w, h) => {
        const c = alert ? "bad" : "ui";
        g.fillStyle = K.hexOf(ctx, "paper", opts); K.rr(g, 0, 0, w, h, 60); g.fill();
        g.strokeStyle = K.hexOf(ctx, alert ? "bad" : "trim", opts); g.lineWidth = alert ? 22 : 8; K.rr(g, 12, 12, w - 24, h - 24, 52); g.stroke();
        // a file glyph: a sheet with a folded corner, in the tag's colour
        const x = 64, y = 96, fw = 160, fh = 240, fc = 56;
        g.fillStyle = K.hexOf(ctx, c, opts); g.beginPath(); g.moveTo(x, y); g.lineTo(x + fw - fc, y); g.lineTo(x + fw, y + fc);
        g.lineTo(x + fw, y + fh); g.lineTo(x, y + fh); g.closePath(); g.fill();
        g.fillStyle = K.hexOf(ctx, "paper", opts); g.globalAlpha = 0.55; g.beginPath(); g.moveTo(x + fw - fc, y); g.lineTo(x + fw - fc, y + fc); g.lineTo(x + fw, y + fc); g.closePath(); g.fill();
        g.globalAlpha = 1;
        if (name) {
          g.fillStyle = K.hexOf(ctx, alert ? "bad" : "ink", opts); g.textBaseline = "middle"; g.textAlign = "left";
          g.fillText(K.fitText(g, String(name), w - 540, (q) => K.font(ctx, "body", q, 700), 108), 260, h / 2 + 6);   // the right end is the clip's
        }
      });
      return new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshBasicMaterial({ map: f.tex, toneMapped: false }));
    };
    // the tag turns about its own long axis, which runs through the clip, so it stays held while it turns over
    tag = new THREE.Group(); tag.position.set(0.06 - TW / 2, 0, 0.016); attach.add(tag);
    const card = K.mesh(THREE, K.rbox(THREE, X, TW, TH, 0.008, 0.02, 2), paper2); tag.add(card);
    const front = tagFace(A.name, false); front.position.z = 0.0045; tag.add(front);
    const back = tagFace(A.real, true); back.rotation.x = Math.PI; back.position.z = -0.0045; tag.add(back);
    // the clip: a wire bent as a gem clip (two nested loops), lying across the letter's edge and the tag's end
    const P = [], arc = (cx, cy, r, a0, a1, n = 10) => { for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; P.push(new THREE.Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a), 0)); } };
    P.push(new THREE.Vector3(-0.016, 0.07, 0), new THREE.Vector3(-0.016, -0.06, 0));
    arc(0, -0.06, 0.016, Math.PI, 2 * Math.PI);
    P.push(new THREE.Vector3(0.016, 0.1, 0));
    arc(-0.01, 0.1, 0.026, 0, Math.PI);
    P.push(new THREE.Vector3(-0.036, -0.1, 0));
    arc(0, -0.1, 0.036, Math.PI, 2 * Math.PI);
    P.push(new THREE.Vector3(0.036, 0.04, 0));
    const wire = new THREE.CurvePath(); for (let i = 1; i < P.length; i++) wire.add(new THREE.LineCurve3(P[i - 1], P[i]));
    clip = K.mesh(THREE, new THREE.TubeGeometry(wire, 160, 0.0065, 8, false), K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.25 }), false);
    clip.rotation.z = Math.PI / 2; clip.position.set(0.0, 0, 0.032); attach.add(clip);
  }

  const st = { open: 0, letter: 0, attachment: 0, reveal: 0 };
  const apply = () => {
    const ko = K.easeInOut(st.open);
    flap.rotation.x = Math.PI * ko;                       // swings up and back over the top edge
    flap.position.z = 0.03 - 0.05 * ko;
    const kl = K.spring(st.letter, 0.12) * Math.min(1, st.open * 1.5);
    letter.position.y = LH0 + kl * H * 0.82;
    letter.position.z = 0.0 + kl * 0.04;
    if (attach) {
      // it comes out with the letter: while the letter is still in the pocket the tag stays tucked away
      const ka = K.spring(st.attachment, 0.18) * K.clamp(kl * 1.2);
      attach.visible = ka > 0.001;
      const s = Math.max(0.001, ka); attach.scale.set(s, s, s);
      attach.position.set(LW / 2 - 0.3 * (1 - ka), TY, 0);   // grows out from the clip at the page's edge
      tag.rotation.x = Math.PI * K.easeInOut(st.reveal);
      tag.position.z = 0.016 + 0.05 * Math.sin(Math.PI * K.clamp(st.reveal));   // lifts off the page as it turns
    }
  };
  apply();
  return {
    group, size: [W, H + H * 0.82 + 0.1, 0.1], parts: { pocket, flap, letter, attachment: attach },
    keys: ["open", "letter", "attachment", "reveal", "turn"],
    set(key, v) {
      if (key === "open") { st.open = K.clamp(v); apply(); }
      else if (key === "letter") { st.letter = K.clamp(v); apply(); }
      else if (key === "attachment") { st.attachment = K.clamp(v); apply(); }
      else if (key === "reveal") { st.reveal = K.clamp(v); apply(); }
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
