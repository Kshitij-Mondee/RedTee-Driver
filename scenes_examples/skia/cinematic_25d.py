# @lab {"title": "2.5D cinematic: parallax layers, a moon with bloom, a light cone, haze, depth of field and grain (Skia)", "dur": 6.0, "times": [0.3, 1.6, 3.0, 4.4, 5.9], "motion_blur": [1, 0.5]}
"""A Loom Skia scene (lab example of the 2.5D cinematic register). Everything is from the style's tokens:
a lonely lighthouse on a ridge, lit from above, while the camera pushes in slowly and the layers part.

Techniques (each reusable):
- LAYERS with a depth z (0 = far, 1 = near). A camera push scales each layer by 1 + push * z and drifts it
  by drift * z, so near layers move more: the parallax that reads as depth.
- ATMOSPHERE: far layers are lighter and softer (aerial perspective), with a haze band between layers.
- BLOOM: the moon is drawn three times (sharp core, a medium blur, a wide faint blur).
- LIGHT CONE: a gradient wedge with a noisy SkSL falloff, blended additively.
- DEPTH OF FIELD: the nearest layer is blurred (a mask filter) so the eye rests on the middle ground.
- GRAIN: an SkSL hash of the frame index, so it moves like film and never changes between renders.
"""
from loom_skia import *

GRAIN = """
uniform float f; uniform float k;
float h(float2 p) { p = fract(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
half4 main(float2 p) { float g = h(p + f * 13.7) - 0.5; return half4(half3(g > 0.0 ? 1.0 : 0.0) * abs(g) * k, abs(g) * k); }
"""
CONE = """
uniform float2 apex; uniform float spread; uniform float len; uniform float t; uniform float3 col;
float h(float2 p) { p = fract(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(float2 q) { float2 i = floor(q), u = fract(q); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(h(i), h(i + float2(1, 0)), u.x), mix(h(i + float2(0, 1)), h(i + float2(1, 1)), u.x), u.y); }
half4 main(float2 p) {
  float2 d = p - apex; float y = d.y / len; if (y < 0.0 || y > 1.0) return half4(0);
  float w = spread * (0.08 + y); float x = abs(d.x) / max(w, 1.0);
  float edge = 1.0 - smoothstep(0.55, 1.0, x);
  float dust = 0.75 + 0.25 * vn(float2(p.x * 0.012, p.y * 0.01 - t * 0.25));
  float a = edge * smoothstep(0.0, 0.18, y) * (1.0 - y) * 0.30 * dust;
  return half4(half3(col) * a, a);
}
"""


def ridge(c, pts, baseline, token, alpha=1.0, blur=0.0, rim=None):
    """a filled silhouette from a polyline of (x, y) points down to the baseline, with an optional lit rim"""
    path = skia.Path(); path.moveTo(pts[0][0], baseline)
    for i, (x, y) in enumerate(pts):
        if i == 0:
            path.lineTo(x, y)
        else:
            px, py = pts[i - 1]
            path.quadTo(px, py, (px + x) / 2, (py + y) / 2)
    path.lineTo(pts[-1][0], pts[-1][1]); path.lineTo(pts[-1][0], baseline); path.close()
    p = paint(token, alpha)
    if blur > 0.3:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    c.drawPath(path, p)
    if rim:
        top = skia.Path(); top.moveTo(*pts[0])
        for i in range(1, len(pts)):
            px, py = pts[i - 1]; x, y = pts[i]; top.quadTo(px, py, (px + x) / 2, (py + y) / 2)
        c.drawPath(top, paint(rim[0], rim[1], Style=skia.Paint.kStroke_Style, StrokeWidth=rim[2]))


def layer(c, z, t, fn):
    """draw fn in a layer at depth z under the camera: push-in and a slow lateral drift, stronger when near"""
    push = 0.10 * ease_in_out(progress(t, 0.0, ctx.duration))
    drift = -38 * ease_in_out(progress(t, 0.0, ctx.duration))
    s = 1 + push * (0.25 + z)
    c.save(); c.translate(W / 2 + drift * z, H * 0.62); c.scale(s, s); c.translate(-W / 2, -H * 0.62); fn(c); c.restore()


def frame(c, t):
    # sky: the field darkening upward, a vignette of night
    sky = skia.GradientShader.MakeLinear([skia.Point(0, 0), skia.Point(0, H)], [C.field, C.field2])
    c.drawRect(skia.Rect.MakeWH(W, H), skia.Paint(Shader=sky))
    moon = (W * 0.5, H * 0.2)

    # 1. the moon, with bloom (sharp core, medium blur, wide faint blur)
    def sky_layer(c):
        for r, a, bl in ((170, 0.10, 90), (95, 0.35, 30), (62, 1.0, 1.5)):
            p = paint("ink", a); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, bl)); c.drawCircle(*moon, r, p)
        # two thin clouds crossing slowly
        for (x0, y, wd, sp) in ((W * 0.28, H * 0.16, 150, 9), (W * 0.66, H * 0.24, 130, -7)):
            x = x0 + sp * t
            p = paint("ink", 0.55); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 3))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, wd, 9), 5, 5), p)
    layer(c, 0.0, t, sky_layer)

    # 2. far hills: light and soft (aerial perspective), a thin lit rim
    def far(c):
        pts = [(-60, H * 0.60), (W * 0.18, H * 0.47), (W * 0.36, H * 0.56), (W * 0.62, H * 0.50), (W * 0.84, H * 0.44), (W + 60, H * 0.53)]
        ridge(c, pts, H, "surface", 0.9, blur=2.5, rim=("ink", 0.45, 2))
    layer(c, 0.2, t, far)

    # 3. the light cone from the moon, additive, with drifting dust
    cone = shader(CONE, apex=moon, spread=H * 0.55, len=H * 0.62, t=t, col=C.rgb("ink"))
    c.drawRect(skia.Rect.MakeWH(W, H), skia.Paint(Shader=cone, BlendMode=skia.BlendMode.kPlus))

    # 4. the middle ground: the ridge and the lighthouse, where the eye rests (sharp)
    def mid(c):
        pts = [(-60, H * 0.72), (W * 0.30, H * 0.66), (W * 0.47, H * 0.585), (W * 0.56, H * 0.60), (W * 0.74, H * 0.67), (W + 60, H * 0.70)]
        ridge(c, pts, H, "field", 1.0)
        bx, by = W * 0.5, H * 0.59
        tower = skia.Path(); tower.moveTo(bx - 26, by); tower.lineTo(bx - 14, by - 150); tower.lineTo(bx + 14, by - 150); tower.lineTo(bx + 26, by); tower.close()
        c.drawPath(tower, paint("field"))
        c.drawRect(skia.Rect.MakeXYWH(bx - 22, by - 176, 44, 26), paint("field"))
        # the lamp: it pulses, and a thin beam sweeps (the signal nobody is watching)
        k = 0.5 + 0.5 * math.sin(t * 2.2)
        lp = paint("accent2", 0.35 + 0.5 * k); lp.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 10)); c.drawCircle(bx, by - 163, 16, lp)
        c.drawCircle(bx, by - 163, 6, paint("accent2", 0.95))
        ang = math.sin(t * 0.9) * 0.9
        beam = skia.Path(); beam.moveTo(bx, by - 163)
        beam.lineTo(bx + math.cos(ang) * 900, by - 163 + math.sin(ang) * 120 - 40); beam.lineTo(bx + math.cos(ang) * 900, by - 163 + math.sin(ang) * 120 + 40); beam.close()
        bs = skia.GradientShader.MakeLinear([skia.Point(bx, by - 163), skia.Point(bx + math.cos(ang) * 900, by - 163)], [C.alpha("accent2", 0.35), C.alpha("accent2", 0.0)])
        c.drawPath(beam, skia.Paint(Shader=bs, BlendMode=skia.BlendMode.kPlus, AntiAlias=True))
    layer(c, 0.55, t, mid)

    # 5. haze between the middle ground and the foreground
    haze = skia.GradientShader.MakeLinear([skia.Point(0, H * 0.70), skia.Point(0, H)], [C.alpha("ink", 0.0), C.alpha("ink", 0.16)])
    c.drawRect(skia.Rect.MakeXYWH(0, H * 0.70, W, H * 0.3), skia.Paint(Shader=haze))

    # 6. the foreground, out of focus (depth of field): dark, blurred, moving the most
    def near(c):
        pts = [(-80, H * 0.86), (W * 0.2, H * 0.80), (W * 0.42, H * 0.88), (W * 0.7, H * 0.82), (W + 80, H * 0.9)]
        ridge(c, pts, H + 40, "field2", 1.0, blur=7)
    layer(c, 1.0, t, near)

    # 7. film grain, hashed from the frame index
    g = shader(GRAIN, f=float(round(t * 30)), k=0.10)
    c.drawRect(skia.Rect.MakeWH(W, H), skia.Paint(Shader=g))
