// @design scramble_in_transit: a readable card slides through a key at one end, rides the line as a block of noise, and reads again through the matching key at the other
/* Treatments considered:
 * 1. static: noise packet already on the lane with an arrow to each key (rejected: the change happening AS it passes the key is the idea).
 * 2. split view of plain and noise side by side (rejected: held stage must not change).
 * 3. chosen: ONE packet, continuous travel; it slows on each key and its rows swap one after another there;
 *    blue only on the noise packet, after tile 3 has settled.
 */
Loom.scene("b11", {
  build: function (ctx, props) {
    var kit = ctx.kit, m = ctx.m, BID = ctx.beat.id;
    function meta(n) { return { kind: "state", beat: BID, name: n, content: true }; }
    function take(name) {
      var E = null;
      try { E = ctx.held(name); } catch (e) { E = null; }
      return (E && E.inner) ? E : null;
    }
    var T0 = ctx.start - 1;   // state that is already true when the beat opens

    /* ---- the held stage (drawn identically only if not there) ---- */
    var B = take("browser");
    if (!B) {
      B = ctx.el("browser", { x: 110, y: 150, w: 520, h: 550, kind: "card", exit: "none" });
      Loom.lesson.browser_window(ctx, B.inner, { scheme: "http" });
    }
    var S = take("server");
    if (!S) {
      S = ctx.el("server", { x: 1430, y: 170, w: 380, h: 530, kind: "card", exit: "none" });
      Loom.lesson.server_box(ctx, S.inner, {});
    }
    var PA = take("path");
    if (!PA) {
      PA = ctx.el("path", { x: 650, y: 370, w: 760, h: 120, kind: "connector", exit: "none" });
      Loom.lesson.network_path(ctx, PA.inner, {});
    }
    var W = take("watcher");
    if (!W) {
      W = ctx.el("watcher", { x: 759, y: 28, w: 360, h: 440, kind: "instrument", exit: "none" });
      var hw = Loom.lesson.watcher(ctx, W.inner, { content: "signals" });
      hw.setState("eye_open", T0);
    }
    /* the watcher's panel from b10 retires in the first 0.4 s */
    var WP = take("watcher_panel");
    var tOpen = ctx.cue("Move three");
    if (WP) Loom.tween(WP.inner, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "none" }, ctx.start + 0.05, meta("panel.retire"));

    /* ---- the keys: held ink keys at both ends; positions read from their elements ---- */
    var kbHeld = take("key_browser");
    var ksHeld = take("key_slots");
    var bx = 430, by = 600;
    if (kbHeld) { bx = kbHeld.x; by = kbHeld.y; }
    else if (ksHeld) { bx = ksHeld.x; by = ksHeld.y; }
    if (!kbHeld) {
      // @form key_held_browser: the matching key, ink, at the browser's slot
      var KBE = ctx.el("key_browser", { x: bx, y: by, w: 240, h: 100, kind: "token", exit: "none" });
      var kbh = Loom.lesson.key_exchange(ctx, KBE.inner, { side: "browser", marks: true });
      kbh.setState("key_held", T0);
    }
    var ksv = take("key_server");
    var sx = 1390, sy = 600;
    if (ksv) { sx = ksv.x; sy = ksv.y; }
    else {
      // @form key_held_server: the matching key, ink, at the server's slot
      var KSE = ctx.el("key_server", { x: sx, y: sy, w: 240, h: 100, kind: "token", exit: "none" });
      var ksh = Loom.lesson.key_exchange(ctx, KSE.inner, { side: "server", marks: true });
      ksh.setState("key_held", T0);
    }
    var KEYB = { x: bx + 80, y: by + 50 };    // browser slot centre
    var KEYS = { x: sx + 160, y: sy + 50 };   // server slot centre (mirrored part)

    /* ---- the step bar: tile 3 is named, tile 2 done, tile 3 settles after about a second ---- */
    var SB = take("step_bar");
    if (!SB) SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "list", exit: "none" });
    var sbh = Loom.lesson.step_bar(ctx, SB.inner, {});
    sbh.setTile(1, "done", T0);
    sbh.setTile(2, "named", T0);
    sbh.setTile(3, "shown", T0);
    sbh.setTile(2, "done", tOpen);
    sbh.setTile(3, "named", tOpen);
    sbh.setTile(3, "shown", tOpen + 1.0);

    /* ---- the one packet ---- */
    var KS = 0.68;                       // size on the lane
    var PW = 324 * KS, PH = 180 * KS;    // 201 x 112
    var CXL = 162 * KS, CYL = 96 * KS;   // card centre in local coords
    var start = { x: 340, y: 715 };      // just under the login form, clear of its text
    var bxo = start.x - CXL, byo = start.y - CYL;
    var K = ctx.el("packet", { x: bxo, y: byo, w: PW, h: PH, kind: "token", exit: "recede" });
    // @form login_packet: plain card that scrambles to noise at one key and reads again at the other
    var kh = Loom.lesson.login_packet(ctx, K.inner, { w: PW });
    // @form noise_frame: the one blue ring on the noise packet
    var frame = Loom.svg("rect", { x: 1, y: 9, width: PW - 2, height: PH - 14, rx: 12, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, K.inner);
    function go(cx, cy, r, t, dur) {
      m.travel(K, t, { x: cx - CXL * r - bxo, y: cy - CYL * r - byo, scale: r, dur: dur });
    }
    var rKey = 1.0;                       // a little smaller as it threads the key, still 18 px type
    var hov = 58;                         // it hovers over the key slot, so the key stays in view
    var LY = 330;                         // card centre on the lane, clear of the nodes and the watcher disc

    var tShow = ctx.cue("The browser");
    var tScr = Math.max(ctx.cue("scrambles the login"), tShow + 0.5);
    var tUn = ctx.cue("can unscramble it");

    m.reveal(K, tShow);
    // 1. to the browser's key, slowing on it; the rows swap while it sits on the slot
    go(KEYB.x + 20, KEYB.y - hov, rKey, tScr, 0.8);
    kh.morph("noise", tScr + 0.55, 0.5);
    Loom.tween(frame, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none" }, tScr + 1.15, meta("noise.frame"));
    // 2. up onto the lane
    go(760, LY, 1, tScr + 1.1, 0.8);
    // 3. along the path past the watcher, to the server end
    var tLane = tScr + 2.0;
    var tEnd = Math.max(tLane + 1.2, tUn - 0.7);
    go(1300, LY, 1, tLane, tEnd - tLane);
    // 4. down to the server's key; the rows swap back while it sits on the slot, the ring goes
    // down first at the lane's end (left of the name pill), then across to the key, so it never crosses the pill's text
    go(1300, KEYS.y - hov, rKey, tEnd + 0.05, 0.4);
    go(KEYS.x - 50, KEYS.y - hov, rKey, tEnd + 0.45, 0.4);
    kh.morph("plain", tEnd + 0.7, 0.5);
    Loom.tween(frame, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "none" }, tEnd + 0.65, meta("noise.frame_off"));
    // 5. into the server, readable
    go(1620, 330, 1, tEnd + 1.3, 0.8);
  }
});
