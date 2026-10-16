/* Loom hands kit (D-114): hands as presenters, from designed art only.
 *
 * What it is for: many studied films show only HANDS (pointing at a diagram, carrying an object in and leaving it,
 * counting on fingers). Code may not draw figurative content (D-102), so this runtime only STAGES hand art drawn
 * by a designer: it loads a family of pose SVGs (assets/hands/<family>/<pose>.svg, contract in
 * assets/hands/README.md), recolours their skin and sleeve classes from the style pack, brings the hand in from a
 * frame edge so its anchor (fingertip or palm) lands where asked, swaps poses on steps, and takes it out again.
 *
 *   const h = Loom.hands.enter(ctx, "guide", { family, pose: "open", from: "bottom", to: { x: 900, y: 600 }, t: 1.0 });
 *   Loom.hands.pose("guide", "count2", 2.0);                  // stepped swap; the wrist stays where it is
 *   Loom.hands.point("guide", { x: 1200, y: 420 }, 2.6);       // fingertip of the "point" pose travels to the target
 *   Loom.hands.place("guide", cupE, 3.4);                      // carries an element in from the edge and leaves it
 *   Loom.hands.exit("guide", 4.6);                             // back out along the arm
 *   Loom.hands.make(ctx, "carrier", { pose: "hold", from: "right" });   // a hand that waits off screen (for place)
 *   (the handle h has the same methods without the name: h.pose("tap", t), h.point(target, t), ...)
 *
 * Options (enter): family (default: the pack's hands.family, else by look_family: illustrated -> cartoon,
 * editorial -> flat, technical -> line), pose ("open"), from ("bottom" | "top" | "left" | "right"), to {x, y} where
 * the pose's ANCHOR lands, t (start, s), dur (0.6), size (hand art height in px, pack hands.size or 460), skin
 * (index into the pack's characters.skin), sleeve (a colour token, default the pack's characters.cloth or accent),
 * tilt (degrees added to the edge angle). Times are STARTS (Loom convention): a move begins at t and lands at t + dur.
 *
 * Assets reach the runtime as Loom.assets.hands = {"<family>/<pose>": {w, h, body, anchor, wrist, wrist_width,
 * licence, placeholder}}. Until compose and the lab bundle assets/hands (docs/primitives/hands.md, "Wiring"), only the
 * built-in PLACEHOLDER family exists: deliberately abstract mittens and capsules with a visible PLACEHOLDER label.
 * Using it, asked for or as a fallback, raises Loom.warn("hands_placeholder") so a placeholder never reaches a real
 * render unnoticed; a family or pose that is missing is a Loom.error (hands_missing, hands_pose_missing).
 *
 * Determinism: every move and pose is recorded at build time as keys (absolute times); ONE Loom.drive per hand
 * evaluates the wrist position, pose and carried object as a pure function of t from those keys, so any seek order
 * draws the same frame. No randomness at all. Colours come from the pack (skin list and tokens).
 */
// @capability hands | people | Loom.hands.enter, pose, point, place, exit | Primitives from the TED-Ed study | hands as presenters (pointing at a diagram, carrying an object in); designed art only, a placeholder set today
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const W = Loom.W, H = Loom.H;
  const HK = (Loom.hands = { live: {} });
  const POSES = ["point", "hold", "pinch", "place", "open", "tap", "grab", "thumbs", "count1", "count2", "count3", "count4", "count5"];
  HK.POSES = POSES;
  const ANGLE = { bottom: 0, top: 180, left: 90, right: -90 };
  const f2 = (v) => Math.round(v * 100) / 100;

  /* ---------------- the placeholder set (a copy of assets/hands/placeholder/*.svg; tests keep them in sync) ---------------- */
  /* @placeholder-begin */
  const PLACEHOLDER = {"count1": {"anchor": [200.0, 410.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(0 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">count1</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 410H216M200 394V426\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "count2": {"anchor": [200.0, 410.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(-10 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(10 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">count2</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 410H216M200 394V426\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "count3": {"anchor": [200.0, 410.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(-16 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(0 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(16 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">count3</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 410H216M200 394V426\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "count4": {"anchor": [200.0, 410.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(-21 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(-7 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(7 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(21 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">count4</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 410H216M200 394V426\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "count5": {"anchor": [200.0, 410.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(-26 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(-13 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(0 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(13 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"182\" y=\"90\" width=\"36\" height=\"240\" rx=\"18.0\" transform=\"rotate(40 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">count5</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 410H216M200 394V426\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "grab": {"anchor": [200.0, 400.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"250\" width=\"160\" height=\"80\" rx=\"40\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">grab</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 400H216M200 384V416\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "hold": {"anchor": [200.0, 130.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"110\" y=\"200\" width=\"180\" height=\"320\" rx=\"86\"/><ellipse class=\"hand-skin\" cx=\"102\" cy=\"390\" rx=\"36\" ry=\"78\" transform=\"rotate(-24 102 390)\"/>\n  <circle class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" cx=\"200\" cy=\"130\" r=\"64\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">hold</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 130H216M200 114V146\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "open": {"anchor": [200.0, 360.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"110\" y=\"200\" width=\"180\" height=\"320\" rx=\"86\"/><ellipse class=\"hand-skin\" cx=\"102\" cy=\"390\" rx=\"36\" ry=\"78\" transform=\"rotate(-24 102 390)\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">open</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 360H216M200 344V376\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "pinch": {"anchor": [238.0, 152.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"200\" y=\"140\" width=\"36\" height=\"200\" rx=\"18.0\" transform=\"rotate(14 218 320)\"/>\n  <rect class=\"hand-skin\" x=\"150\" y=\"170\" width=\"36\" height=\"230\" rx=\"18.0\" transform=\"rotate(28 168 390)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">pinch</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M222 152H254M238 136V168\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "place": {"anchor": [200.0, 125.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"110\" y=\"200\" width=\"180\" height=\"320\" rx=\"86\"/><ellipse class=\"hand-skin\" cx=\"102\" cy=\"390\" rx=\"36\" ry=\"78\" transform=\"rotate(-24 102 390)\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"140\" y=\"70\" width=\"120\" height=\"110\" rx=\"10\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">place</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 125H216M200 109V141\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "point": {"anchor": [200.0, 52.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"180\" y=\"40\" width=\"40\" height=\"300\" rx=\"20.0\" transform=\"rotate(0 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">point</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 52H216M200 36V68\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "tap": {"anchor": [154.7, 106.8], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"180\" y=\"90\" width=\"40\" height=\"250\" rx=\"20.0\" transform=\"rotate(-12 200 320)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">tap</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M138.7 106.8H170.7M154.7 90.8V122.8\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}, "thumbs": {"anchor": [200.0, 410.0], "body": "<rect class=\"hand-sleeve\" x=\"125\" y=\"500\" width=\"150\" height=\"140\" rx=\"12\"/>\n  <rect class=\"hand-sleeve-shade\" x=\"125\" y=\"500\" width=\"150\" height=\"22\" rx=\"8\"/>\n  <rect class=\"hand-skin\" x=\"104\" y=\"160\" width=\"44\" height=\"230\" rx=\"22.0\" transform=\"rotate(-8 126 380)\"/>\n  <rect class=\"hand-skin\" x=\"120\" y=\"300\" width=\"160\" height=\"220\" rx=\"70\"/>\n  <rect class=\"hand-line\" fill=\"none\" stroke-width=\"6\" stroke-dasharray=\"14 9\" x=\"110\" y=\"190\" width=\"180\" height=\"440\" rx=\"40\"/>\n  <text class=\"hand-label\" x=\"200\" y=\"455\" font-family=\"sans-serif\" font-size=\"27\" font-weight=\"700\" text-anchor=\"middle\">PLACEHOLDER</text>\n  <text class=\"hand-label\" x=\"200\" y=\"488\" font-family=\"sans-serif\" font-size=\"24\" text-anchor=\"middle\">thumbs</text>\n  <path class=\"hand-line\" fill=\"none\" stroke-width=\"4\" d=\"M184 410H216M200 394V426\"/>", "h": 640.0, "licence": "CC0-1.0", "placeholder": true, "w": 400.0, "wrist": [200.0, 640.0], "wrist_width": 150.0}};
  /* @placeholder-end */
  HK.PLACEHOLDER = PLACEHOLDER;

  function famDefault() {
    const pk = S().pack || {};
    if (pk.hands && pk.hands.family) return pk.hands.family;
    return { illustrated: "cartoon", editorial: "flat", technical: "line" }[pk.look_family] || "flat";
  }
  /** the art for (family, pose): {art, family, placeholder}; falls back to the placeholder with an error/warning */
  function artFor(family, pose, who) {
    const A = (Loom.assets && Loom.assets.hands) || {};
    const has = (fam) => Object.keys(A).some((k) => k.startsWith(fam + "/"));
    let fam = family, src = A;
    if (fam === "placeholder" || !has(fam)) {
      if (fam !== "placeholder") Loom.error("hands_missing", `${who}: no hand art for family "${fam}" in this build (assets/hands/${fam}/); drawing the PLACEHOLDER set`);
      fam = "placeholder"; src = has("placeholder") ? A : Object.fromEntries(Object.entries(PLACEHOLDER).map(([k, v]) => ["placeholder/" + k, v]));
    }
    let a = src[fam + "/" + pose];
    if (!a) {
      const alt = src[fam + "/open"] || src[Object.keys(src).find((k) => k.startsWith(fam + "/"))];
      Loom.error("hands_pose_missing", `${who}: family "${fam}" has no pose "${pose}"${alt ? "; using " + (src[fam + "/open"] ? "open" : "another pose") : ""}`);
      a = alt;
    }
    if (!a) return null;
    if (fam === "placeholder" || a.placeholder) Loom.warn("hands_placeholder", `${who}: the PLACEHOLDER hand "${pose}" is on screen; commission the art (docs/ASSET_WISHLIST.md, Hands kit) before a real render`);
    return { art: a, family: fam };
  }

  function colours(o) {
    const ch = S().pack.characters || {};
    const skins = ch.skin && ch.skin.length ? ch.skin : [S().c("surface2")];
    const skin = skins[(o.skin || 0) % skins.length];
    const sleeve = S().c(o.sleeve || ch.cloth || "accent");
    return { skin, skin2: S().darken(skin, 0.12), sleeve, sleeve2: S().darken(sleeve, 0.14), line: S().c(ch.ink || "ink"), nail: S().lighten(skin, 0.3), label: S().c("ink") };
  }
  const CLASS_FILL = { "hand-skin": "skin", "hand-skin-shade": "skin2", "hand-sleeve": "sleeve", "hand-sleeve-shade": "sleeve2", "hand-nail": "nail", "hand-label": "label" };
  function recolour(g, col) {
    for (const cls in CLASS_FILL) g.querySelectorAll("." + cls).forEach((n) => n.setAttribute("fill", col[CLASS_FILL[cls]]));
    g.querySelectorAll(".hand-line").forEach((n) => n.setAttribute("stroke", col.line));
  }

  /* ---------------- geometry: wrist position + angle -> anchor on screen ---------------- */
  const rot = (a, x, y) => { const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return [c * x - s * y, s * x + c * y]; };
  function anchorAt(Hd, pose, wx, wy) {
    const a = Hd.arts[pose].art, k = Hd.k;
    const [dx, dy] = rot(Hd.angle, (a.anchor[0] - a.wrist[0]) * k, (a.anchor[1] - a.wrist[1]) * k);
    return [wx + dx, wy + dy];
  }
  function wristFor(Hd, pose, x, y) { const [ax, ay] = anchorAt(Hd, pose, 0, 0); return [x - ax, y - ay]; }
  /** where the wrist waits outside the frame, on the arm's axis through (wx, wy) */
  function offscreen(Hd, wx, wy, extra) {
    const L = Hd.k * Hd.maxH + 40 + (extra || 0);
    return Hd.from === "top" ? [wx, -L] : Hd.from === "left" ? [-L, wy] : Hd.from === "right" ? [W + L, wy] : [wx, H + L];
  }

  function ensurePose(Hd, pose) {
    if (Hd.arts[pose]) return pose;
    const r = artFor(Hd.family, pose, Hd.name);
    if (!r) return Hd.firstPose;
    const a = r.art, g = Loom.svg("g", { "data-pose": pose, transform: `translate(${-a.wrist[0]} ${-a.wrist[1]})`, display: "none" }, Hd.rig);
    // the sleeve continues past the art's wrist edge to beyond the frame, so a hand never floats
    Loom.svg("rect", { class: "hand-sleeve", x: a.wrist[0] - a.wrist_width / 2, y: a.wrist[1] - 2, width: a.wrist_width, height: (Math.max(W, H) * 1.5) / Hd.k }, g);
    const body = Loom.svg("g", {}, g);
    const uid = Loom.uid("hand") + "_";
    body.innerHTML = String(a.body).replace(/id="([^"]+)"/g, (m, id) => `id="${uid}${id}"`).replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${uid}${id})`);
    recolour(g, Hd.col);
    Hd.arts[pose] = { art: a, g };
    Hd.maxH = Math.max(Hd.maxH, a.h);
    (Loom.report.hands = Loom.report.hands || []).push({ beat: Hd.beat, name: Hd.name, family: r.family, pose, placeholder: r.family === "placeholder" || !!a.placeholder });
    return pose;
  }

  /* ---------------- the clock: state at t from the keys ---------------- */
  function stateAt(Hd, t) {
    let pos = Hd.moves[0].from;
    for (const m of Hd.moves) {
      if (t >= m.t1) { pos = m.to; continue; }
      if (t > m.t0) { const e = m.ease(Math.max(0, Math.min(1, (t - m.t0) / Math.max(1e-6, m.t1 - m.t0)))); pos = [m.from[0] + (m.to[0] - m.from[0]) * e, m.from[1] + (m.to[1] - m.from[1]) * e]; }
      break;
    }
    let pose = Hd.poses[0].pose;
    for (const p of Hd.poses) if (t >= p.t) pose = p.pose;
    return { pos, pose };
  }
  function render(Hd, t) {
    const { pos, pose } = stateAt(Hd, t);
    Hd.rig.setAttribute("transform", `translate(${f2(pos[0])} ${f2(pos[1])}) rotate(${f2(Hd.angle)}) scale(${f2(Hd.k)})`);
    for (const p in Hd.arts) { const v = p === pose ? "inline" : "none"; if (Hd.arts[p].g.getAttribute("display") !== v) Hd.arts[p].g.setAttribute("display", v); }
    for (const c of Hd.carries) {
      // a carried element rides the hand's anchor until it is released, then stays where it was put
      let dx = 0, dy = 0;
      const vis = t >= c.t0 ? "visible" : "hidden";   // before its carry the object waits unseen, wherever the hand is
      if (c.E.outer.getAttribute("visibility") !== vis) c.E.outer.setAttribute("visibility", vis);
      if (t < c.release) { const st = stateAt(Hd, t), [ax, ay] = anchorAt(Hd, c.pose, st.pos[0], st.pos[1]); dx = ax - c.rest[0]; dy = ay - c.rest[1]; }
      c.E.mover.setAttribute("transform", `translate(${f2(dx)} ${f2(dy)})`);
    }
  }

  function addMove(Hd, t0, dur, to, ease) {
    const from = stateAt(Hd, t0).pos;
    Hd.moves.push({ t0, t1: t0 + dur, from, to, ease: Loom.ease[ease] || Loom.ease.move });
    Hd.moves.sort((a, b) => a.t0 - b.t0);
  }
  function addPose(Hd, pose, t) { Hd.poses.push({ t, pose: ensurePose(Hd, pose) }); Hd.poses.sort((a, b) => a.t - b.t); }
  const onScreen = (Hd, t) => { const [x, y] = stateAt(Hd, t).pos, m = Hd.k * Hd.maxH * 0.5; return x > -m && x < W + m && y > -m && y < H + m; };

  /* ---------------- API ---------------- */
  /** a hand waiting off screen at its edge (no move yet): for a hand whose first act is place() */
  HK.make = function (ctx, name, o) { return HK.enter(ctx, name, Object.assign({}, o, { _wait: true })); };
  HK.enter = function (ctx, name, o) {
    o = o || {};
    const from = ANGLE[o.from] != null ? o.from : "bottom";
    if (o.from && ANGLE[o.from] == null) Loom.warn("hands_bad_edge", `${name}: from "${o.from}" is not an edge (bottom, top, left, right); using bottom`);
    const hs = (S().pack.hands || {});
    const size = o.size || hs.size || 460;
    const E = ctx.el(name, { x: 0, y: 0, w: size, h: size, kind: "hand" });
    const rig = Loom.svg("g", { class: "lm-hand" }, E.inner);
    const Hd = { name, E, rig, from, angle: ANGLE[from] + (o.tilt || 0), family: o.family || famDefault(), col: colours(o), arts: {}, moves: [], poses: [], carries: [],
      beat: ctx.beat && ctx.beat.id, maxH: 0, k: 1, size };
    HK.live[name] = Hd;
    const pose = o.pose || "open";
    const first = ensurePose(Hd, pose);
    if (!Hd.arts[first]) { Loom.error("hands_missing", `${name}: no hand art at all`); return null; }
    Hd.firstPose = first;
    Hd.k = size / Hd.arts[first].art.h;
    const t = o.t == null ? ctx.start || 0 : o.t, dur = o.dur || 0.6;
    const to = o.to || { x: W / 2, y: H * 0.55 };
    const end = wristFor(Hd, first, to.x, to.y);
    const start = offscreen(Hd, end[0], end[1]);
    Hd.moves.push({ t0: t, t1: t, from: start, to: start, ease: Loom.ease.linear });
    Hd.poses.push({ t: -1, pose: first });
    if (!o._wait) { addMove(Hd, t, dur, end, "enter"); E.revealT = t; }
    const T1 = Math.max(t + dur, (ctx.end || t + dur) + 0.001);
    // one driver for the whole life of the hand: wrist, pose and carried objects are a pure function of t
    Loom.drive((e, p) => render(Hd, t + p * (T1 - t)), t, T1 - t, "linear", { kind: "hand", beat: Hd.beat, name: name + ".hand" });
    const h = { name, E, pose: (ps, tt) => HK.pose(name, ps, tt), point: (tg, tt, oo) => HK.point(name, tg, tt, oo), place: (ob, tt, oo) => HK.place(name, ob, tt, oo), exit: (tt, oo) => HK.exit(name, tt, oo) };
    return h;
  };
  const get = (name) => { const Hd = HK.live[name]; if (!Hd) Loom.error("hands_unknown", `no hand "${name}" (enter it first)`); return Hd; };

  /** swap the pose at t (stepped); the wrist stays, so the anchor moves with the new pose */
  HK.pose = function (name, pose, t) { const Hd = get(name); if (Hd) addPose(Hd, pose, t); return t; };

  /** the "point" pose's fingertip travels to target over [t, t + dur]; returns when it lands */
  HK.point = function (name, target, t, o) {
    const Hd = get(name); if (!Hd) return t;
    o = o || {};
    const pose = o.pose || "point", dur = o.dur || 0.45;
    addPose(Hd, pose, t);
    addMove(Hd, t, dur, wristFor(Hd, Hd.arts[pose] ? pose : Hd.firstPose, target.x, target.y), "move");
    return t + dur;
  };

  /** carry element E in from the hand's edge (pose "hold"), put it at its own place at t + dur, release ("open"),
   *  and leave. E must not have its own entrance: this IS its entrance. Returns when the hand has gone. */
  HK.place = function (name, E, t, o) {
    const Hd = get(name); if (!Hd || !E) return t;
    o = o || {};
    const dur = o.dur || 0.8, hold = o.pose || "hold", release = o.release || "open", leave = o.leave == null ? 0.3 : o.leave;
    if (onScreen(Hd, t)) Loom.warn("hands_place_onscreen", `${name}: place() at ${t.toFixed(2)}s starts with the hand on screen; the object appears in its hand (exit it first)`);
    const rest = [E.x + E.w / 2, E.y + E.h / 2];
    addPose(Hd, hold, t);
    const pose = Hd.arts[hold] ? hold : Hd.firstPose;
    const end = wristFor(Hd, pose, rest[0], rest[1]);
    if (!onScreen(Hd, t)) {
      const off = offscreen(Hd, end[0], end[1], Math.hypot(E.w, E.h) / 2);   // far enough that the carried object starts unseen
      Hd.moves.push({ t0: t, t1: t, from: off, to: off, ease: Loom.ease.linear });
      Hd.moves.sort((a, b) => a.t0 - b.t0);
    }
    addMove(Hd, t + 1e-4, dur, end, "move");
    Hd.carries.push({ E, rest, pose, t0: t, release: t + dur });
    E.revealT = t;
    addPose(Hd, release, t + dur + 0.1);
    return HK.exit(name, t + dur + 0.1 + leave);
  };

  /** back out along the arm over [t, t + dur] */
  HK.exit = function (name, t, o) {
    const Hd = get(name); if (!Hd) return t;
    const dur = (o && o.dur) || 0.5;
    const at = stateAt(Hd, t).pos;
    addMove(Hd, t, dur, offscreen(Hd, at[0], at[1]), "exit");
    Hd.E.exitT = t; Hd.E.exitKind = "hand";
    return t + dur;
  };
})();
