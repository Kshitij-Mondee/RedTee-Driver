// @lab {"title": "Single-stroke lettering written stroke by stroke (hersheytext EMS fonts)", "dur": 4, "libs": [], "times": [0.3, 0.9, 1.6, 2.3, 3.0, 3.9], "params": {"font": "EMSReadability", "text": "Check the sender"}}
// A capability proof: a single-line font (one pen path per stroke, no outlines) written at an even pen speed.
export async function build(ctx, P) {
  const F = await P.strokeFont(ctx.params.font || "EMSReadability");
  const size = Math.min(110, 110 * 0.86 * P.w / P.strokeText(F, ctx.params.text, { size: 110 }).width);   // fit the frame
  const w = P.strokeText(F, ctx.params.text, { size }).width;
  const strokes = P.strokeText(F, ctx.params.text, { size, x: (P.w - w) / 2, y: P.h / 2 + size / 2 });
  const svg = P.svg();
  return { render(t) { svg.replaceChildren(); P.drawStrokes(svg, strokes, P.seg(t, 0.2, 3.4), { color: "ink", width: 6 }); } };
}
