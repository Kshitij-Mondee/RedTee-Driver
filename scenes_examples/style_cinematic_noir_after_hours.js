// @design lit_desk_in_dark_office: an establishing night office on a depth stage, one desk lamp as the key light, blind-slatted moonlight as the cool fill, an empty chair, and the screen's glow as the one accent when the message is named
// @lab {"title": "cinematic-noir example: after hours (establishing shot, depth layers, one key light, one accent)", "styles": ["cinematic-noir"], "dur": 10.0, "times": [0.4, 2.2, 4.6, 6.4, 8.2, 9.8], "fx": {}, "cues": {"After hours": 0.9, "a message lands": 4.2, "gone home": 6.0}}
/* An example of the cinematic-noir style done right (docs/styles/guides/cinematic-noir.md, recipes R1 to R4 and R2b).
 * Workplace topic: one message arrives in an empty office after hours. No person is drawn: the kit has no 2.5D lit cast
 * yet (guide section 8), so the beat is framed on what the person would be looking at, with the empty chair as the
 * absence (lnd-character-design s10, "the object the character is about").
 * The rules it shows:
 *   - the value structure is built from light: about two thirds of the frame is unlit field, the lamp pool and the
 *     window are the only bright areas, and the title sits on the dark wall, never over a light cone;
 *   - light is HARD: the pool on the desk and the moonlight bars on the floor are flat lit planes, not wide soft
 *     gradients (a 620 px wall wash at 0.09 opacity banded into visible rings in v2 of this scene);
 *   - the key light is ink (warm white), the fill is accent3 (cool, through the blinds); the ACCENT appears once, on
 *     the thing the narration names (the screen's glow on "a message lands"), and nowhere else;
 *   - depth: back wall, window and floor z 0.1, haze z 0.4, desk, chair, lamp and laptop on the focus plane z 0.55,
 *     the floor bars z 0.62, a chair back in the near foreground z 1.0 (blurred by its distance from the focus plane);
 *     the dolly is one slow push for the whole shot (push 0.06, drift -26 px);
 *   - text lives OUTSIDE the stage (SCENE_API: titles do not ride the dolly) and is set in the pack's roles.
 * Timing: every reveal is on a literal cue. In a lesson, compose resolves them from the narration; the lab renders
 * them at the times in the @lab "cues" map (the lab's own ctx.cue returns 0 for words).
 */
Loom.scene("style_cinematic_noir_after_hours", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const st = ctx.depth("office", { dolly: [ctx.start, ctx.end], push: 0.06, drift: -26, focus: 0.55, dof: 6, atmosphere: 0.45, cx: 1060, cy: 620 });

    // ---- far (z 0.1): the back wall, darkest at the top, the window on the right third
    const wall = st.layer(0.1);
    svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: st.tone("surface2", 0.1) }, wall);
    const WX = 1190, WY = 150, WW = 520, WH = 440;
    svg("rect", { x: WX - 14, y: WY - 14, width: WW + 28, height: WH + 28, fill: st.tone("surface", 0.1) }, wall);   // the frame
    svg("rect", { x: WX, y: WY, width: WW, height: WH, fill: st.tone("accent3", 0.02), opacity: 0.5 }, wall);         // moonlit sky: the cool fill's source, kept below the accent's pull
    const city = Loom.rng("after_hours_city");
    for (let x = WX - 10; x < WX + WW; ) {   // far towers seen through the glass: dark shapes against the sky
      const w = 40 + city() * 70, h = 110 + city() * 200;
      svg("rect", { x, y: WY + WH - h, width: w, height: h, fill: c("field2") }, wall);
      for (let wy = WY + WH - h + 16; wy < WY + WH - 16; wy += 30) for (let wx = x + 8; wx < x + w - 10; wx += 18)
        if (city() > 0.82) svg("rect", { x: wx, y: wy, width: 6, height: 9, fill: c("muted"), opacity: 0.5 }, wall);   // lit windows: muted, never the accent
      x += w + 6;
    }
    for (let y = WY + 6; y < WY + WH; y += 28) svg("rect", { x: WX, y, width: WW, height: 15, fill: c("shadow"), opacity: 0.82 }, wall);   // blind slats, dark against the light
    // (no wide wall wash: a 0.09-opacity radial gradient 620 px wide banded into visible rings on this field in v2 of
    // this scene; the lamp's light lives in its cone and its pool instead, guide section 5)
    // the floor: one step lighter than the wall where the room meets it, so the desk stands on something
    svg("rect", { x: -200, y: 850, width: 2320, height: 500, fill: st.tone("surface2", 0.3) }, wall);
    st.haze(0.4, 600, "accent3");

    // ---- the focus plane (z 0.55): desk, lamp, laptop; a laptop is 0.36 m on a 1.5 m desk (O.REAL), so 24 % of its width
    const mid = st.layer(0.55);
    const DX0 = 470, DX1 = 1400, DY = 660;
    // the chair behind the desk, empty: whoever reads this message has gone home. Its window side catches the cool fill.
    svg("rect", { x: 1190, y: DY - 190, width: 170, height: 190, rx: 30, fill: st.tone("surface2", 0.55) }, mid);
    kit.path(mid, `M${1190 + 150} ${DY - 182} Q${1190 + 168} ${DY - 150} ${1190 + 168} ${DY - 40}`, { stroke: "accent3", sw: 3, opacity: 0.45 });
    svg("polygon", { points: `${DX0 + 46},${DY - 54} ${DX1 - 46},${DY - 54} ${DX1},${DY} ${DX0},${DY}`, fill: st.tone("surface", 0.55) }, mid);   // the top, in perspective
    svg("rect", { x: DX0, y: DY, width: DX1 - DX0, height: 24, fill: st.tone("surface2", 0.55) }, mid);                                         // its front edge
    svg("rect", { x: DX0, y: DY, width: DX1 - DX0, height: 2, fill: c("ink"), opacity: 0.25 }, mid);                                            // lit by the lamp
    svg("rect", { x: DX0 + 30, y: DY + 24, width: 40, height: 196, fill: st.tone("surface2", 0.55) }, mid);                                     // legs
    svg("rect", { x: DX1 - 70, y: DY + 24, width: 40, height: 196, fill: st.tone("surface2", 0.55) }, mid);
    svg("rect", { x: DX0 + 70, y: DY + 24, width: DX1 - DX0 - 140, height: 110, fill: c("shadow"), opacity: 0.6 }, mid);                     // the modesty panel, in shadow
    svg("ellipse", { cx: (DX0 + DX1) / 2, cy: DY + 222, rx: (DX1 - DX0) * 0.55, ry: 16, fill: c("shadow"), opacity: 0.5 }, mid);           // contact shadow
    // the laptop, lid towards us ("away": the user would sit across the desk)
    const laptopAt = [1110, DY - 92], laptopSize = Math.round((DX1 - DX0) * 0.24);
    const glow = svg("g", { opacity: 0 }, mid);   // the screen's spill behind the lid, drawn first so the lid cuts it
    const gid = Loom.uid("ah");
    const rg = svg("radialGradient", { id: gid, cx: "50%", cy: "50%", r: "50%" }, glow);
    svg("stop", { offset: "0", "stop-color": c("accent"), "stop-opacity": 0.55 }, rg);
    svg("stop", { offset: "1", "stop-color": c("accent"), "stop-opacity": 0 }, rg);
    svg("ellipse", { cx: laptopAt[0], cy: laptopAt[1] - 30, rx: 230, ry: 120, fill: `url(#${gid})` }, glow);
    Loom.obj.shape(mid, "laptop", laptopAt[0], laptopAt[1], laptopSize, { state: { facing: "away" }, shadow: false, key: "laptop" });
    // the lamp: base, two arms, a shade; its bulb is the key light
    const L = { bx: 690, by: DY - 34, jx: 640, jy: 520, hx: 760, hy: 440 };
    svg("ellipse", { cx: L.bx, cy: L.by + 6, rx: 46, ry: 10, fill: c("shadow") }, mid);
    kit.path(mid, `M${L.bx} ${L.by} L${L.jx} ${L.jy} L${L.hx} ${L.hy}`, { stroke: "line", sw: 7 });
    // the shade: a cone opening downward, its outer edge catching a little of its own light
    kit.path(mid, `M${L.hx - 30} ${L.hy - 26} L${L.hx + 18} ${L.hy - 34} L${L.hx + 62} ${L.hy + 20} L${L.hx - 22} ${L.hy + 34} Z`, { fill: "surface", stroke: "line", sw: 2 });
    // the key light rides the lamp's own depth (guide R2b). st.cone and st.glow draw at fixed depths (z 0.3 and z 0.05),
    // so during this dolly the bulb slid about 19 px off the shade (round 1 frames at 0.4 s and 9.8 s); the same cone and
    // bloom (depth.js numbers) are drawn here in a screen-blended layer at z 0.55 until the depth stage takes a z option
    const kl = st.layer(0.55, "screen"), kid = Loom.uid("ahk"), kd = svg("defs", {}, kl);
    const blur = (id, sd, box) => { const fl = svg("filter", Object.assign({ id: kid + id }, box), kd); svg("feGaussianBlur", { stdDeviation: sd }, fl); return `url(#${kid}${id})`; };
    const cg = svg("linearGradient", { id: kid + "c", x1: 0, y1: 0, x2: 0, y2: 1 }, kd);
    [[0, 0], [0.08, 0.34], [0.7, 0.12], [1, 0]].forEach(([off, a]) => svg("stop", { offset: off, "stop-color": c("ink"), "stop-opacity": a }, cg));
    const kx = L.hx + 20, ky = L.hy + 28, kw = 520, klen = DY - 54 - ky;   // warm white light falls on the desk top
    svg("path", { d: `M${kx - kw * 0.06} ${ky} L${kx + kw * 0.06} ${ky} L${kx + kw / 2} ${ky + klen} L${kx - kw / 2} ${ky + klen} Z`, fill: `url(#${kid}c)`, filter: blur("cb", 14, { x: "-20%", y: "-5%", width: "140%", height: "110%" }) }, kl);
    const halo = { x: "-100%", y: "-100%", width: "300%", height: "300%" }, br = 8, bx = L.hx + 20, by = L.hy + 26;   // the bulb, bloomed
    svg("circle", { cx: bx, cy: by, r: br * 2.8, fill: c("ink"), opacity: 0.12, filter: blur("g1", Math.round(br * 0.9), halo) }, kl);
    svg("circle", { cx: bx, cy: by, r: br * 1.5, fill: c("ink"), opacity: 0.35, filter: blur("g2", Math.round(br * 0.35), halo) }, kl);
    svg("circle", { cx: bx, cy: by, r: br, fill: c("ink") }, kl);
    // the pool on the desk top: HARD light, so a flat lit plane clipped to the desk top (a lifted value, no gradient to band)
    const pool = st.layer(0.56);
    const cid = Loom.uid("ahc");
    const cp = svg("clipPath", { id: cid }, pool);
    svg("polygon", { points: `${DX0 + 46},${DY - 54} ${DX1 - 46},${DY - 54} ${DX1},${DY} ${DX0},${DY}` }, cp);
    const lit = svg("g", { "clip-path": `url(#${cid})` }, pool);
    svg("ellipse", { cx: L.hx + 30, cy: DY - 26, rx: 300, ry: 40, fill: Loom.style.mix(c("surface"), c("ink"), 0.16) }, lit);
    svg("ellipse", { cx: L.hx + 30, cy: DY - 26, rx: 190, ry: 26, fill: Loom.style.mix(c("surface"), c("ink"), 0.28) }, lit);
    // the moonlight through the blinds lands on the floor as hard bars (flat fills, slanted away from the window)
    const floorBars = st.layer(0.62);
    for (let i = 0; i < 4; i++) {
      const y0 = 868 + i * 17;
      svg("polygon", { points: `${1240 - i * 60},${y0} ${1700 - i * 40},${y0} ${1690 - i * 40},${y0 + 9} ${1226 - i * 60},${y0 + 9}`, fill: Loom.style.mix(c("field"), c("accent3"), 0.16) }, floorBars);
    }

    // ---- near (z 1.0): the back of a chair at another desk, bottom left, out of focus: foreground depth with no seam
    const near = st.layer(1.0);
    svg("rect", { x: -80, y: 800, width: 420, height: 420, rx: 90, fill: c("shadow") }, near);
    kit.path(near, `M${-60} ${830} Q${150} ${790} ${320} ${840}`, { stroke: "accent3", sw: 4, opacity: 0.35 });   // its top edge, rim-lit by the cool fill (guide s4: rims are accent3 or ink)

    // ---- text: outside the stage, on the dark wall (top left), clear of the cone and the window
    const T = ctx.el("title", { x: 230, y: 104, w: 860, h: 240, kind: "text", exit: "wipe" });
    kit.kicker(T.inner, "After hours", { x: 0, y: 0, w: 600, h: 40, color: "accent4" });   // never the default accent2 (it means danger here)
    const tt = kit.text(T.inner, "One message, one choice", { role: "title", x: 0, y: 52, w: 860, h: 110, maxLines: 1, weight: 800 });
    m.unmask(T, ctx.cue("After hours"));

    // ---- the change: the screen lights on the words that name it; the accent appears for the first time here
    const tLands = ctx.cue("a message lands");
    Loom.tween(glow, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, tLands, { kind: "reveal", beat: ctx.beat.id, name: "screen_glow", content: true });
    const S2 = ctx.el("sub", { x: 230, y: 104 + 52 + tt.__fit.height + 24, w: 860, h: 60, kind: "text", exit: "sink" });
    kit.text(S2.inner, "Everyone else has gone home", { role: "lead", x: 0, y: 0, w: 860, h: 60, maxLines: 1, color: "muted" });
    m.settle(S2, ctx.cue("gone home"));
  },
});
