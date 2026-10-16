// @model {"id": "holo_building", "pack": "workplace", "what": "a generic ten-storey office building over a double-height lobby, built as a hologram hero (T-146): a concrete core with its lift overrun, ten floor slabs (floor1 at the bottom to floor10 at the top, each a named part inside floors), perimeter columns, a curtain-wall facade on the two long sides (mullions on a 4 m module, a spandrel band at every floor) and solid end walls with a glazed stair strip, a colonnade lobby with an entrance canopy and a revolving-door drum, and the roof plant (parapet, a louvred plant screen, two cooling towers, two air-handling units and ducts); the glass stays see-through, so the floors and the core read inside it", "parts": ["core", "floors", "structure", "facade", "lobby", "roof_plant"], "opts": {"plates": "true (default): each floor a full plate; false: its two edge bands only, for the hologram (ten plates seen through glass wash a hologram white; a see-through sheet did too)"}, "keys": {"explode": "0 assembled .. 1 exploded: the floors spread up the core, each a little above the last, the roof plant rises above them, and the facade's four sides move out from the building", "turn": "radians about y"}, "subparts": "floors holds floor1 .. floor10 (hot or anchor one floor: workplace security on floor 7, a fire floor; in the hologram a hot floor is its bright rim, so pair it with a lock or a datum on the floor's anchor); facade holds facade_front, facade_back, facade_left and facade_right", "explode_note": "use the explode key (it spreads the floors one by one); the vectors below move whole parts, for a scene that drives the preset's explode instead", "explode": {"roof_plant": [0, 18, 0]}, "hero": {"opts": {"plates": false}, "zoom": 0.66, "elevation": 18, "yaw": -0.65, "why": "a tall object that grows when it explodes: zoom 0.66 keeps the risen roof plant in the frame; a higher elevation shows the plant"}, "best_for": ["facilities and workplace security (which floor, which entrance)", "an office as the organisation: floors as teams or levels", "fire safety and evacuation (floors, the core's stairs, the lobby)", "an exploded view of how a building is put together (core, slabs, envelope, plant)"], "not_for": ["an inside view of one office floor (use office_floor)", "a meeting room (use meeting_room)", "a simple building icon (use building)"], "size": [2.12, 2.37, 1.62], "sheet": {"states": [{"key": "explode", "from": 0, "to": 1, "at": 3.2, "dur": 1.6}], "elevation": 18}}
// Geometry in metres, from typical commercial office proportions: a 40 x 28 m floor plate, a 5.5 m lobby, 3.8 m from
// floor to floor, a 12 x 8 m core, columns on an 8 m grid, a 4 m facade module, a 1.1 m parapet, the roof plant inside a
// 3 m screen. The building faces +z (its entrance), x is its length. It is drawn at 1:20. Words: none (no signs, no logo).
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const S = 0.05;
  const BW = 40, BD = 28, LOB = 5.5, FF = 3.8, NF = 10, TOP = LOB + NF * FF, SLAB = 0.35;
  const group = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group(); group.add(pivot); body.scale.setScalar(S); pivot.add(body);
  const concrete = K.mat(ctx, THREE, "casing2", "matte", opts), slabM = K.mat(ctx, THREE, "paper2", "matte", opts);
  const frameM = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.4 }), panelM = K.mat(ctx, THREE, "casing", "matte", opts);
  const glass = K.mat(ctx, THREE, "cool", "glass", opts), plantM = K.mat(ctx, THREE, "metal", "metal", opts, { roughness: 0.55 });
  const darkM = K.mat(ctx, THREE, "trim", "matte", opts);

  const merge = (geos) => {
    const gs = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    let n = 0; for (const g of gs) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
    let o = 0;
    for (const g of gs) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    return out;
  };
  const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
  const col = (r, h, x, y, z, seg = 16) => new THREE.CylinderGeometry(r, r, h, seg).translate(x, y + h / 2, z);

  // ---- the plinth the building stands on, and the core rising through every floor to its lift overrun
  const core = new THREE.Group(); body.add(core);
  core.add(K.mesh(THREE, box(BW + 2.4, 0.45, BD + 2.4, 0, 0.225, 0), concrete));
  const CW = 12, CD = 8, CH = TOP + 3.6;
  core.add(K.mesh(THREE, box(CW, CH, CD, 0, CH / 2, -1), concrete));
  // the shaft walls show as two shallow joints down the core's long faces, and the overrun has its own cap
  const joints = [];
  for (const x of [-2, 2]) for (const z of [-1 - CD / 2 - 0.03, -1 + CD / 2 + 0.03]) joints.push(box(0.12, CH - 1, 0.06, x, CH / 2, z));
  core.add(K.mesh(THREE, merge(joints), darkM, false));
  core.add(K.mesh(THREE, box(CW + 0.6, 0.4, CD + 0.6, 0, CH + 0.2, -1), concrete));

  // ---- the floors: ten slabs, each its own named part (floor1 at the bottom), the slab edge a little proud
  const floors = new THREE.Group(); body.add(floors);
  const floorParts = {};
  for (let i = 0; i < NF; i++) {
    const f = new THREE.Group(); f.position.y = LOB + i * FF; floors.add(f);
    // a floor: its slab edge (a 1.6 m band at the facade), the band round the core, and the plate between them
    const ring = (w, d, cz, path) => { const s0 = path || new THREE.Shape(); s0.moveTo(-w / 2, cz - d / 2); s0.lineTo(w / 2, cz - d / 2); s0.lineTo(w / 2, cz + d / 2); s0.lineTo(-w / 2, cz + d / 2); s0.closePath(); return s0; };
    const edge = ring(BW, BD, 0); edge.holes.push(ring(BW - 3.2, BD - 3.2, 0, new THREE.Path()));
    const coreBand = ring(CW + 1.8, CD + 1.8, -1); coreBand.holes.push(ring(CW + 0.1, CD + 0.1, -1, new THREE.Path()));
    const slabGeo = (shape) => { const g = new THREE.ExtrudeGeometry(shape, { depth: SLAB, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g; };
    f.add(K.mesh(THREE, merge([slabGeo(edge), slabGeo(coreBand)]), slabM));
    // the plate between the two bands (opts.plates, on by default): a lit style shows a floor as a plate; the hologram
    // leaves it out (its hero settings pass plates: false), as ten plates seen edge-on through the glass wash it white
    if (opts.plates !== false) {
      const plateS = ring(BW - 3.2, BD - 3.2, 0); plateS.holes.push(ring(CW + 1.8, CD + 1.8, -1, new THREE.Path()));
      f.add(K.mesh(THREE, slabGeo(plateS).translate(0, -0.06, 0), slabM, false));
    }
    floorParts["floor" + (i + 1)] = f;
  }
  // the roof slab belongs to the roof plant (it carries it); the lobby has its own floor in the plinth

  // ---- the structure: perimeter columns on the 8 m grid, a metre inside the glass
  const structure = new THREE.Group(); body.add(structure);
  const cols = [];
  for (const x of [-16, -8, 0, 8, 16]) for (const z of [-BD / 2 + 1.2, BD / 2 - 1.2]) cols.push(box(0.6, TOP - LOB, 0.6, x, LOB + (TOP - LOB) / 2, z));
  for (const z of [-6, 2]) for (const x of [-BW / 2 + 1.2, BW / 2 - 1.2]) cols.push(box(0.6, TOP - LOB, 0.6, x, LOB + (TOP - LOB) / 2, z));
  structure.add(K.mesh(THREE, merge(cols), concrete, false));

  // ---- the facade: the long sides a curtain wall (glass, mullions on a 4 m module, a spandrel band at each floor),
  // the ends solid panels with one glazed strip where the stair is
  const facade = new THREE.Group(); body.add(facade);
  const sides = {};
  const H0 = LOB, H1 = TOP + 1.1;
  const curtain = (name, sz) => {
    const g = new THREE.Group(); g.position.z = sz * BD / 2; facade.add(g); sides[name] = g;
    // glass is one plane, not a thin box: a see-through box is four faces of light where the glass is one
    g.add(K.mesh(THREE, new THREE.PlaneGeometry(BW, H1 - H0).translate(0, (H0 + H1) / 2, 0), glass, false));
    // mullions on a 4 m module (two of the 2 m planning grid), shallow, so their sides do not stack into a white sheet
    // when the face is seen at an angle
    const ms = [], N = 10;
    for (let i = 0; i <= N; i++) ms.push(box(i === 0 || i === N ? 0.3 : 0.12, H1 - H0, 0.16, -BW / 2 + i * BW / N, (H0 + H1) / 2, sz * 0.08));
    g.add(K.mesh(THREE, merge(ms), frameM, false));
    const bands = [];
    // the spandrel covers the slab edge only (0.6 m), so each floor's edge band shows through the vision glass above it
    for (let i = 0; i <= NF; i++) bands.push(box(BW, 0.6, 0.1, 0, LOB + i * FF - 0.42, sz * 0.05));
    g.add(K.mesh(THREE, merge(bands), panelM, false));
  };
  curtain("facade_front", 1); curtain("facade_back", -1);
  const endWall = (name, sx) => {
    const g = new THREE.Group(); g.position.x = sx * BW / 2; facade.add(g); sides[name] = g;
    // the wall in two panels either side of the stair strip, the strip glazed with a mullion each side
    const stripZ = -1, stripW = 3;
    const a = -BD / 2, b = stripZ - stripW / 2, c = stripZ + stripW / 2, d = BD / 2;
    g.add(K.mesh(THREE, merge([box(0.3, H1 - H0, b - a, sx * 0.05, (H0 + H1) / 2, (a + b) / 2), box(0.3, H1 - H0, d - c, sx * 0.05, (H0 + H1) / 2, (c + d) / 2)]), panelM));
    g.add(K.mesh(THREE, new THREE.PlaneGeometry(stripW, H1 - H0).rotateY(Math.PI / 2).translate(0, (H0 + H1) / 2, stripZ), glass, false));
    g.add(K.mesh(THREE, merge([box(0.36, H1 - H0, 0.14, sx * 0.08, (H0 + H1) / 2, b), box(0.36, H1 - H0, 0.14, sx * 0.08, (H0 + H1) / 2, c)]), frameM, false));
    // a shadow joint at every floor on the panels, quieter than the glass sides
    const js = [];
    for (let i = 1; i <= NF; i++) for (const [z0, z1] of [[a, b], [c, d]]) js.push(box(0.04, 0.06, z1 - z0, sx * 0.22, LOB + i * FF - 0.2, (z0 + z1) / 2));
    g.add(K.mesh(THREE, merge(js), darkM, false));
  };
  endWall("facade_left", -1); endWall("facade_right", 1);

  // ---- the lobby: the glazing set back behind a colonnade on the entrance side, the entrance canopy, a revolving-door
  // drum, glass round the other sides at the slab edge
  const lobby = new THREE.Group(); body.add(lobby);
  const SB = 2.2;
  const LG = LOB - 0.45, LY = 0.45 + (LOB - 0.45) / 2;
  lobby.add(K.mesh(THREE, merge([new THREE.PlaneGeometry(BW - 0.6, LG).translate(0, LY, BD / 2 - SB), new THREE.PlaneGeometry(BW - 0.6, LG).translate(0, LY, -BD / 2 + 0.3),
    new THREE.PlaneGeometry(BD - SB - 0.3, LG).rotateY(Math.PI / 2).translate(-BW / 2 + 0.3, LY, -SB / 2 + 0.15), new THREE.PlaneGeometry(BD - SB - 0.3, LG).rotateY(Math.PI / 2).translate(BW / 2 - 0.3, LY, -SB / 2 + 0.15)]), glass, false));
  const lm = [];
  for (let i = 0; i <= 10; i++) lm.push(box(0.12, LOB - 0.45, 0.2, -BW / 2 + 0.3 + i * (BW - 0.6) / 10, 0.45 + (LOB - 0.45) / 2, BD / 2 - SB));
  lobby.add(K.mesh(THREE, merge(lm), frameM, false));
  const colonnade = [];
  for (const x of [-16, -8, 0, 8, 16]) colonnade.push(col(0.4, LOB - 0.45, x, 0.45, BD / 2 - 0.6, 24));
  lobby.add(K.mesh(THREE, merge(colonnade), concrete, false));
  lobby.add(K.mesh(THREE, box(14, 0.5, 4.2, 0, 4.1, BD / 2 + 1.0), panelM));
  const drum = K.mesh(THREE, new THREE.CylinderGeometry(1.5, 1.5, 2.6, 40, 1, true).translate(0, 0.45 + 1.3, BD / 2 - SB + 0.2), glass, false); lobby.add(drum);
  lobby.add(K.mesh(THREE, merge([new THREE.CylinderGeometry(1.6, 1.6, 0.2, 40).translate(0, 0.45 + 2.7, BD / 2 - SB + 0.2), new THREE.BoxGeometry(2.9, 2.5, 0.06).translate(0, 0.45 + 1.3, BD / 2 - SB + 0.2), new THREE.BoxGeometry(0.06, 2.5, 2.9).translate(0, 0.45 + 1.3, BD / 2 - SB + 0.2)]), frameM, false));

  // ---- the roof plant: the roof slab, its parapet, a louvred screen round the plant, two cooling towers with their
  // fan rings, two air-handling units and the ducts down into the core
  const roof_plant = new THREE.Group(); roof_plant.position.y = TOP; body.add(roof_plant);
  roof_plant.add(K.mesh(THREE, box(BW, SLAB, BD, 0, -SLAB / 2, 0), slabM));
  const par = [box(BW, 1.1, 0.25, 0, 0.55, BD / 2 - 0.125), box(BW, 1.1, 0.25, 0, 0.55, -BD / 2 + 0.125), box(0.25, 1.1, BD - 0.5, BW / 2 - 0.125, 0.55, 0), box(0.25, 1.1, BD - 0.5, -BW / 2 + 0.125, 0.55, 0)];
  roof_plant.add(K.mesh(THREE, merge(par), panelM, false));
  const PX0 = 3, PW = 15, PZ0 = -BD / 2 + 2.5, PD = 11, SH = 3.2;
  const lv = [];
  // the screen: louvre blades on a frame, along its two long sides and its two ends
  // (blades a metre apart: at 0.6 m they merged into one bright block in the projection)
  for (let x = PX0; x <= PX0 + PW + 1e-6; x += 1.0) for (const z of [PZ0, PZ0 + PD]) lv.push(box(0.08, SH, 0.32, x, SH / 2, z));
  for (let z = PZ0; z <= PZ0 + PD + 1e-6; z += 1.0) for (const x of [PX0, PX0 + PW]) lv.push(box(0.32, SH, 0.08, x, SH / 2, z));
  roof_plant.add(K.mesh(THREE, merge(lv), plantM, false));
  roof_plant.add(K.mesh(THREE, merge([box(PW, 0.2, 0.3, PX0 + PW / 2, SH, PZ0), box(PW, 0.2, 0.3, PX0 + PW / 2, SH, PZ0 + PD), box(0.3, 0.2, PD, PX0, SH, PZ0 + PD / 2), box(0.3, 0.2, PD, PX0 + PW, SH, PZ0 + PD / 2)]), frameM, false));
  const plant = [];
  for (const x of [PX0 + 3.5, PX0 + 8.5]) plant.push(box(4, 3, 4, x, 1.5, PZ0 + 3));
  for (const z of [PZ0 + 7, PZ0 + 9.4]) plant.push(box(9, 1.8, 1.8, PX0 + 7.5, 0.9, z));
  roof_plant.add(K.mesh(THREE, merge(plant), plantM));
  for (const x of [PX0 + 3.5, PX0 + 8.5]) {
    roof_plant.add(K.mesh(THREE, new THREE.CylinderGeometry(1.5, 1.5, 0.5, 40, 1, true).translate(x, 3.25, PZ0 + 3), plantM, false));
    const fr = K.mesh(THREE, new THREE.TorusGeometry(1.5, 0.06, 8, 48), frameM, false); fr.rotation.x = Math.PI / 2; fr.position.set(x, 3.5, PZ0 + 3); roof_plant.add(fr);
    const blades = [];
    for (let k = 0; k < 6; k++) blades.push(new THREE.BoxGeometry(1.35, 0.04, 0.32).translate(0.68, 0, 0).rotateY(k / 6 * Math.PI * 2).translate(x, 3.35, PZ0 + 3));
    roof_plant.add(K.mesh(THREE, merge(blades), darkM, false));
  }
  const duct = new THREE.CatmullRomCurve3([new THREE.Vector3(PX0 + 12, 0.9, PZ0 + 7), new THREE.Vector3(PX0 + 13.5, 0.9, PZ0 + 7), new THREE.Vector3(CW / 2 + 0.5, 0.9, -1), new THREE.Vector3(CW / 2 - 0.5, 0.2, -1)], false, "centripetal");
  roof_plant.add(K.mesh(THREE, new THREE.TubeGeometry(duct, 40, 0.45, 12, false), plantM, false));

  group.add(K.contactShadow(ctx, THREE, BW * S * 1.4, BD * S * 1.4, 0.35));

  // ---- the explode: the floors spread up the core (each a step above the last), the roof plant rises above them, the
  // facade's four sides move out from the building
  const parts = Object.assign({ core, floors, structure, facade, lobby, roof_plant }, floorParts, sides);
  const home = new Map(); for (const o of [roof_plant, ...Object.values(floorParts), ...Object.values(sides)]) home.set(o, o.position.clone());
  const out = { facade_front: [0, 0, 10], facade_back: [0, 0, -10], facade_left: [-10, 0, 0], facade_right: [10, 0, 0] };
  const st = { explode: opts.explode || 0 };
  const apply = () => {
    const e = K.clamp(st.explode);
    Object.values(floorParts).forEach((f, i) => { const h = home.get(f); f.position.set(h.x, h.y + e * 1.5 * (i + 1), h.z); });
    const hr = home.get(roof_plant); roof_plant.position.set(hr.x, hr.y + e * (1.5 * NF + 3.5), hr.z);
    for (const [k, o] of Object.entries(out)) { const h = home.get(sides[k]); sides[k].position.set(h.x + o[0] * e, h.y, h.z + o[2] * e); }
  };
  apply();
  return {
    group, size: [(BW + 2.4) * S, (CH + 0.4) * S, (BD + 2.4 + 2) * S], parts, keys: ["explode", "turn"],
    set(k, v) {
      if (k === "turn") { pivot.rotation.y = v; return; }
      if (k === "explode") { st.explode = Number(v) || 0; apply(); }
    },
  };
}
