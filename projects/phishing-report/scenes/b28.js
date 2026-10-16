// @design one_becomes_three: one piece of content is carried into three different containers while its signs stay put and line up across all of them
/* b28 - the same ask as an email, a text, a chat message. Only the channel changes, so your move does not.
 * Treatments considered: (A) three cards that fade in side by side (rejected: nothing is carried, so "the same ask"
 * is only said); (B) the message splits into three copies in place (rejected: the containers are the point and
 * must be drawn as things); (C) CHOSEN: hold and transform. The held message shrinks left onto a laptop, a copy
 * lifts off and flies to a phone where it re-forms as a text, another flies on to a chat window and re-forms as a
 * chat bubble. The three signs of the ask (pressure, request, attachment) rise out of each container and settle on
 * one line at the same height under all three: the container changed, the signs did not.
 * Layering: the devices live in one element, "channels" (b29 and b30 hold it), drawn in a layer BELOW the held
 * message so the message can land on the laptop's screen. The message was panned by b27; st.__panEnd tells us how.
 */
Loom.scene("b28", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, st = ctx.station, D = Loom.data, E_ = Loom.ease;
    const DUR = { fly: 1.25, copy: 0.95, copyChat: 1.0, settle: 0.9, fade: 0.35, out: 0.35, short: 0.2 };   // the durations this scene owns (seconds)
    const tags = (props && props.tags) || ["email", "text", "chat"];
    const msg = ctx.held("supplier_msg"), av = ctx.held("contact_avatar");
    const pan = st.__panEnd || { s: 1, tx: 0, ty: 0 };
    const beat = ctx.beat.id;

    const tAsk = ctx.cue("The same ask"), tMail = ctx.cue("as an email"), tText = ctx.cue("a text"), tChat = ctx.cue("a chat message");
    const tOnly = ctx.cue("Only the channel changes"), tMove = ctx.cue("your move does not");

    // ---- a layer under the held message, so the message can land ON the laptop's screen
    const under = Loom.svg("g", { class: "lm-under" }, st.svg);
    let anchor = msg && msg.outer;
    while (anchor && anchor.parentNode && anchor.parentNode !== st.svg) anchor = anchor.parentNode;
    if (anchor && anchor.parentNode === st.svg) st.svg.insertBefore(under, anchor);

    // ---- geometry: three devices on one centre line, the signs row and the tags under them
    const CY = 300, LX = 470, PX = 960, CX = 1450, ROW = 590, TAGY = 650;
    const LS = 460, lw = LS * 0.9, lh = LS * 0.56;                   // laptop (family "laptop"): body and screen from objects.js
    const Sx = LX - lw / 2 + LS * 0.035, Sy = CY - LS * 0.4 + LS * 0.035, Sw = lw - LS * 0.07, Sh = lh - LS * 0.07;
    const PS = 400, pw = PS * 0.52, ph = PS * 0.96;                   // phone (family "slab")
    const Px = PX - pw / 2 + pw * 0.08, Py = CY - ph / 2 + ph * 0.05, Pw = pw * 0.84, Ph = ph * 0.9;
    const CW = 430, CH = 320, Cx0 = CX - CW / 2, Cy0 = CY - CH / 2;  // chat window

    // @form ask_card: a small card standing for one message, an avatar, a name bar, text bars and an attachment chip (no words)
    const askCard = (g, x, y, w, h, fill) => {
      const pad = h * 0.1, r = h * 0.09, bh = Math.max(5, h * 0.05), iw = w - 2 * pad;
      kit.rect(g, x, y, w, h, { fill: fill || "surface", r: Math.min(10, h * 0.12), flat: true, shadow: false });
      kit.disc(g, x + pad + r, y + pad + r, r, { fill: "accent4", flat: true, shadow: false });
      kit.rect(g, x + pad + 2 * r + pad * 0.6, y + pad + r - bh / 2, w * 0.32, bh, { fill: "ink", r: bh / 2, flat: true });
      [1, 0.86, 0.5].forEach((f, i) => kit.rect(g, x + pad, y + pad + 2 * r + pad + i * bh * 2.1, iw * f, bh, { fill: "muted", r: bh / 2, flat: true }));
      kit.rect(g, x + pad, y + h - pad - h * 0.12, w * 0.34, h * 0.12, { fill: "line", r: h * 0.04, flat: true });
    };

    // ---- the three devices, one element ("channels")
    const ch = ctx.el("channels", { x: 0, y: 0, w: 1920, h: 520, kind: "group", parent: under, exit: "recede" });
    Loom.obj.draw(ctx, "channel_laptop", "laptop", { x: LX, y: CY, size: LS, family: "laptop", detail: 1, shadow: false, t: tAsk, parent: ch.inner });
    const mail = ctx.el("laptop_mail", { x: 0, y: 0, w: 1920, h: 520, kind: "card", parent: ch.inner });
    askCard(mail.inner, Sx + 6, Sy + 6, Sw - 12, Sh - 12);
    m.reveal(mail, tMail - 0.35, { dy: 0, dur: DUR.fade });
    Loom.obj.draw(ctx, "channel_phone", "phone", { x: PX, y: CY, size: PS, family: "slab", detail: 1, t: tText, parent: ch.inner });
    const pb = ctx.el("phone_bubble", { x: 0, y: 0, w: 1920, h: 520, kind: "bubble", parent: ch.inner });
    askCard(pb.inner, Px + 12, Py + 60, Pw - 24, 112, "surface");
    m.reveal(pb, tText + 0.8, { dy: 0, dur: DUR.fade });
    const chat = ctx.el("channel_chat", { x: Cx0, y: Cy0, w: CW, h: CH, kind: "card", parent: ch.inner });
    kit.rect(chat.inner, 0, 0, CW, CH, { fill: "surface", stroke: "ink", sw: 5, r: 12, crisp: true });
    kit.rect(chat.inner, 0, 0, CW, 54, { fill: "surface2", r: 12, crisp: true, shadow: false });
    ["neg", "accent4", "pos"].forEach((tok, i) => Loom.svg("circle", { cx: 28 + i * 24, cy: 27, r: 7, fill: S.c(tok), opacity: 0.9 }, chat.inner));
    kit.rect(chat.inner, CW / 2 - 70, 22, 140, 10, { fill: "muted", r: 5, flat: true });
    kit.rect(chat.inner, 20, CH - 62, CW - 40, 42, { fill: "none", stroke: "line", sw: 3, r: 21, crisp: true, shadow: false });
    m.settle(chat, tChat, { dy: 24 });
    const cb = ctx.el("chat_bubble", { x: 0, y: 0, w: CW, h: CH, kind: "bubble", parent: chat.inner });
    askCard(cb.inner, 24, 78, CW - 48, 150, "surface2");
    m.reveal(cb, tChat + 0.85, { dy: 0, dur: DUR.fade });

    // ---- the held message shrinks left onto the laptop's screen (it is panned: map the target back through b27's transform).
    // Everything the message carries (flags, rings, tags) travels with it, so the target is fitted to its whole extent;
    // its avatar is a separate element in the same group and is moved by the same map.
    if (msg && msg.w > 0) {
      let bb = null;
      try { bb = msg.inner.getBBox(); } catch (e) { bb = null; }
      if (!bb || !(bb.width > 50 && bb.height > 50)) bb = { x: 0, y: 0, width: msg.w, height: msg.h };
      const k = Math.min((Sw - 16) / bb.width, (Sh - 16) / bb.height);                 // visual scale on the screen
      const ls = k / pan.s;                                                            // the same scale in the message's own group
      const tlx = Sx + (Sw - bb.width * k) / 2, tly = Sy + (Sh - bb.height * k) / 2;   // where the extent's top left lands on screen
      const lx = (tlx - pan.tx) / pan.s - msg.x - ls * bb.x, ly = (tly - pan.ty) / pan.s - msg.y - ls * bb.y;
      Loom.tween(msg.mover, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" }, { x: lx, y: ly, scale: ls, duration: DUR.fly, ease: E_.editorial }, tAsk + 0.1, { kind: "travel", beat, name: "supplier_msg", content: true });
      Loom.tween(msg.life, { opacity: 1 }, { opacity: 0, duration: DUR.fade, ease: E_.exit }, tMail - 0.3, { kind: "fade_out", beat, name: "supplier_msg" });
      if (av) {
        const p = av.__pos || { x: 0, y: 0, s: 1 };
        const gx = av.x + p.x - msg.x, gyy = av.y + p.y - msg.y;                       // its top left, in the message's own frame
        Loom.tween(av.mover, { x: p.x, y: p.y, scale: p.s, transformOrigin: "0 0" }, { x: msg.x + lx + ls * gx - av.x, y: msg.y + ly + ls * gyy - av.y, scale: p.s * ls, duration: DUR.fly, ease: E_.editorial }, tAsk + 0.1, { kind: "travel", beat, name: "contact_avatar", content: true });
        Loom.tween(av.life, { opacity: 1 }, { opacity: 0, duration: DUR.fade, ease: E_.exit }, tMail - 0.3, { kind: "fade_out", beat, name: "contact_avatar" });
      }
    }

    // ---- a copy lifts off the laptop and flies to its container, then fades into the re-formed message there
    // @form copy_flight: a small copy of one thing flies in an arc from where it was to where it will be re-formed
    const flight = (name, w, h, dest, s0, t0, dur) => {
      const E = ctx.el(name, { x: dest.x - w / 2, y: dest.y - h / 2, w, h, kind: "token", exit: "none" });
      askCard(E.inner, 0, 0, w, h, "surface");
      m.reveal(E, t0, { dy: 0, dur: DUR.short });
      Loom.tween(E.mover, { x: LX - dest.x, y: CY - dest.y, scale: s0, transformOrigin: "50% 50%" }, { x: 0, y: 0, scale: 1, duration: dur, ease: E_.editorial }, t0, { kind: "travel", beat, name, content: true });
      Loom.tween(E.life, { y: 0 }, { y: -80, duration: dur * 0.5, ease: "power2.out" }, t0, { kind: "travel", beat, name, content: true });
      Loom.tween(E.life, { y: -80 }, { y: 0, duration: dur * 0.5, ease: "power2.in" }, t0 + dur * 0.5, { kind: "travel", beat, name, content: true });
      Loom.tween(E.inner, { opacity: 1 }, { opacity: 0, duration: DUR.fade, ease: E_.exit }, t0 + dur, { kind: "fade_out", beat, name });
      return E;
    };
    flight("ask_copy_text", Pw - 24, 112, { x: Px + 12 + (Pw - 24) / 2, y: Py + 60 + 56 }, 1.1, tText - 0.1, DUR.copy);
    flight("ask_copy_chat", CW - 48, 150, { x: Cx0 + 24 + (CW - 48) / 2, y: Cy0 + 78 + 75 }, 0.5, tChat - 0.1, DUR.copyChat);

    // ---- the three signs: they rise out of each container and line up on one row at the same height
    // @form sign_marks_row: three small round marks (pressure, request, attachment) that stay the same while their container changes
    const SIGNS = [["accent", "timer"], ["accent3", "banknote"], ["accent4", "paperclip"]];
    const signs = (name, devX, from, tIn, tSet) => {
      const E = ctx.el(name, { x: devX - 110, y: ROW - 32, w: 220, h: 64, kind: "group", exit: "recede" });
      SIGNS.forEach(([tok, ic], i) => { kit.disc(E.inner, 32 + i * 78, 32, 28, { fill: tok }); kit.icon(E.inner, ic, { x: 32 + i * 78, y: 32, size: 30, color: S.pickTokenOn(tok) }); });
      m.reveal(E, tIn, { dy: 0, dur: DUR.fade });
      Loom.tween(E.mover, { x: from.x - devX, y: from.y - ROW, scale: from.s, transformOrigin: "50% 50%" }, { x: 0, y: 0, scale: 1, duration: DUR.settle, ease: E_.editorial }, tSet, { kind: "settle", beat, name, content: true });
      return E;
    };
    const sE = signs("signs_email", LX, { x: LX, y: Sy + Sh - 40, s: 0.4 }, tMail + 0.35, tOnly);
    const sT = signs("signs_text", PX, { x: PX, y: Py + 60 + 112 - 18, s: 0.3 }, tText + 1.0, tOnly + 0.3);
    const sC = signs("signs_chat", CX, { x: CX, y: Cy0 + 78 + 150 - 22, s: 0.45 }, tChat + 1.0, tOnly + 0.6);
    // the line they settle on: the same height across all three
    const guide = ctx.el("signs_guide", { x: 250, y: ROW - 4, w: 1500, h: 8, kind: "connector", exit: "recede" });
    kit.path(guide.inner, dashed(0, 4, 1500, 4, 16, 12), { stroke: "line", sw: 3 });
    m.draw(guide, tOnly + 0.2, { dur: 1.3 });
    guide.outer.parentNode.insertBefore(guide.outer, sE.outer);   // under the signs
    // one emphasis: the three rows pulse together on "does not"
    [sE, sT, sC].forEach((E) => m.emphasis(E, tMove, { amount: 0.08 }));

    // ---- tags name what is drawn, centred under each container
    [[tags[0], LX, tMail], [tags[1], PX, tText + 0.3], [tags[2], CX, tChat + 0.3]].forEach(([text, cx, t], i) => {
      const T = D.tag(ctx, "tag_" + ["email", "text", "chat"][i], { x: 0, y: TAGY, text, color: "accent4", textColor: "onAccent", t });
      kit.place(T, cx - T.w / 2, TAGY);
    });

    // ---- leave together: this scene's own layer fades as one; the devices (channels) stay for b29 and b30
    const tOut = ctx.speechEnd + 0.1;
    Loom.ctxScene.els.forEach((e) => { if (e.scene === Loom.ctxScene && e !== ch) e.exit = "none"; });
    Loom.tween(ctx.g, { opacity: 1 }, { opacity: 0, duration: DUR.out, ease: E_.exit }, tOut, { kind: "exit", beat, name: "b28 layer" });

    // dashed strokes are built from short segments so m.draw can still reveal them along their length
    function dashed(x1, y1, x2, y2, on, off) {
      const L = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(L / (on + off));
      let d = "";
      for (let i = 0; i <= n; i++) {
        const a = (i * (on + off)) / L, b = Math.min(1, (i * (on + off) + on) / L);
        d += `M${(x1 + (x2 - x1) * a).toFixed(1)} ${(y1 + (y2 - y1) * a).toFixed(1)}L${(x1 + (x2 - x1) * b).toFixed(1)} ${(y1 + (y2 - y1) * b).toFixed(1)}`;
      }
      return d;
    }
  },
});
