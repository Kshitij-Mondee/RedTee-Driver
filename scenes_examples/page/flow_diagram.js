// @lab {"title": "Laid-out process diagram (dagre)", "dur": 5, "libs": ["dagre"], "times": [0.4, 1.2, 2.0, 2.8, 3.6, 4.8]}
// A capability proof: the layout is computed (no hand-placed boxes), then revealed node by node with its arrows.
export async function build(ctx, P) {
  const L = P.layout({ rankdir: "LR", nodes: [{ id: "req", label: "Request" }, { id: "triage", label: "Triage" }, { id: "fix", label: "Fix" },
    { id: "review", label: "Review" }, { id: "ship", label: "Ship" }, { id: "back", label: "Send back" }],
    edges: [{ from: "req", to: "triage" }, { from: "triage", to: "fix" }, { from: "fix", to: "review" }, { from: "review", to: "ship" }, { from: "review", to: "back" }] });
  const svg = P.svg();
  return { render(t) { P.drawGraph(svg, L, P.seg(t, 0.2, 4.4), { fill: "surface", stroke: "ink", edge: "accent" }); } };
}
