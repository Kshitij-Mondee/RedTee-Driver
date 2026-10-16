// @model {"id": "coin_stack", "pack": "workplace", "what": "stacks of milled coins that build up coin by coin (or drain away), up to three stacks", "parts": ["stacks"], "keys": {"fill": "0..1 how full the stacks are (coins drop in from above, in order)", "turn": "radians about y"}, "best_for": ["money, cost and savings", "budget used up", "the price of a mistake"], "not_for": ["exact amounts (put the number on screen)"], "size": [1.4, 1.4, 0.8], "sheet": {"opts": {"stacks": [8, 12, 5]}, "states": [{"key": "fill", "from": 0, "to": 1, "at": 0.6, "dur": 2.6}], "elevation": 16}}
export async function make(ctx, THREE, X, opts = {}) {
  const K = X.kit;
  const R = 0.22, CT = 0.07;
  const counts = (opts.stacks || [6, 10]).slice(0, 3).map((n) => Math.max(1, Math.min(18, n)));
  const group = new THREE.Group();
  const pivot = new THREE.Group(); group.add(pivot);
  // one coin geometry: a lathe with a raised rim and a recessed face, plus a milled edge
  // bottom centre to top centre (a lathe profile in this order faces outwards)
  const prof = [[0, 0], [R * 0.97, 0], [R, CT * 0.1], [R, CT * 0.9], [R * 0.97, CT], [R * 0.84, CT * 0.96], [R * 0.8, CT * 0.86], [0, CT * 0.86]];
  const coinGeo = K.lathe(THREE, prof, 64);
  const coinMat = K.mat(ctx, THREE, opts.colour || "warm", "metal", opts, { roughness: 0.28, metalness: 0.75 });
  const stacks = new THREE.Group(); pivot.add(stacks);
  const total = counts.reduce((a, b) => a + b, 0), coins = [];
  const xs = counts.length === 1 ? [0] : counts.length === 2 ? [-0.27, 0.27] : [-0.52, 0, 0.52];
  counts.forEach((n, s) => {
    for (let i = 0; i < n; i++) {
      const c = K.mesh(THREE, coinGeo, coinMat);
      // a fixed small jitter per coin (a hash of its index), so a stack looks hand-stacked but never random
      const j = ((s * 31 + i * 17) % 7 - 3) / 3 * 0.012, jz = ((s * 13 + i * 29) % 5 - 2) / 2 * 0.01;
      c.userData.home = new THREE.Vector3(xs[s] + j, i * CT, (s === 1 ? -0.12 : 0.04) + jz);
      c.position.copy(c.userData.home); c.rotation.y = i * 0.37;
      stacks.add(c); coins.push(c);
    }
  });
  // drop order: the stacks fill together, bottom up
  const order = coins.map((c, i) => [c, c.userData.home.y, i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);
  group.add(K.contactShadow(ctx, THREE, 1.8, 1.0, 0.4));

  const setFill = (k) => {
    k = K.clamp(k);
    order.forEach((c, i) => {
      const q = K.clamp(k * total - i);                     // this coin's own 0..1
      c.visible = q > 0;
      const d = 1 - K.spring(q, 0.25);
      c.position.y = c.userData.home.y + d * 0.9;
    });
  };
  setFill(opts.fill == null ? 1 : opts.fill);
  const maxH = Math.max(...counts) * CT;
  return {
    group, size: [1.4, Math.max(0.6, maxH + 0.1), 0.8], parts: { stacks }, keys: ["fill", "turn"],
    set(key, v) {
      if (key === "fill") setFill(v);
      else if (key === "turn") pivot.rotation.y = v;
    },
  };
}
