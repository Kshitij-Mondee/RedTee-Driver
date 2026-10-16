# @lab {"title": "Skia hero: a lit orb, frosted glass, a phrase from blur to sharp, a motion-blurred light streak", "dur": 3.6, "times": [0.5, 1.0, 1.4, 1.9, 2.75, 3.4], "params": {"phrase": "What made it easy?"}, "motion_blur": [4, 0.5]}
"""A Loom Skia scene (lab example): a living orb of light behind a frosted card; the key phrase arrives
letter by letter from blur to sharp; a light streak crosses with real motion blur.
Colours come only from C.<token>; times from ctx.cue() in a lesson (params in the lab)."""
from loom_skia import *

ORB = """
uniform float t; uniform float2 c; uniform float r; uniform float3 a; uniform float3 b; uniform float3 f;
float h21(float2 q) { q = fract(q * float2(123.34, 456.21)); q += dot(q, q + 45.32); return fract(q.x * q.y); }
float vn(float2 q) { float2 i = floor(q), u = fract(q); u = u * u * (3.0 - 2.0 * u);
  return mix(mix(h21(i), h21(i + float2(1, 0)), u.x), mix(h21(i + float2(0, 1)), h21(i + float2(1, 1)), u.x), u.y); }
float fbm(float2 q) { float v = 0.0, w = 0.5; for (int k = 0; k < 5; k++) { v += w * vn(q); q = q * 2.03 + float2(17.1, 9.2); w *= 0.5; } return v; }
half4 main(float2 p) {
  float2 d = (p - c) / r; float rr = length(d);
  // a sphere of mist: domain-warped noise swirling slowly, lit from the upper left
  float2 q = d * 1.6; float2 wv = float2(fbm(q + t * 0.12), fbm(q + float2(5.2, 1.3) - t * 0.1));
  float n = fbm(q * 1.4 + 2.2 * wv + float2(t * 0.08, 0.0));
  float3 col = mix(b, a, smoothstep(0.42, 0.58, n));
  float light = clamp(1.1 - length(d - float2(-0.35, -0.4)) * 0.8, 0.0, 1.0);
  col = mix(f, col, exp(-rr * rr * 1.6)) + (a + b) * 0.16 * light * exp(-rr * rr * 2.5);
  float alpha = clamp(exp(-rr * rr * 1.3) * 1.2, 0.0, 1.0);
  return half4(half3(col) * alpha, alpha);
}
"""
P = ctx.params


def frame(c, t):
    # in a lesson the times are spoken words (word_say, streak_say); in the lab they are seconds
    t_in = float(P.get("t_in", 0.3))
    t_word = ctx.cue(P["word_say"]) if P.get("word_say") else float(P.get("t_word", 1.2))
    t_streak = ctx.cue(P["streak_say"]) if P.get("streak_say") else float(P.get("t_streak", 2.6))
    # 1. the orb grows in on a gentle spring and breathes
    k = spring(progress(t, t_in, 1.2), 0.0)
    r = 330 * k * (1 + 0.03 * math.sin(t * 2.1))
    if r > 1:
        sh = shader(ORB, t=t, c=(W * 0.5, H * 0.46), r=r, a=C.rgb("accent4"), b=C.rgb("accent3"), f=C.rgb("field"))
        glow = skia.Paint(Shader=sh, AntiAlias=True)
        c.drawRect(skia.Rect.MakeWH(W, H), glow)
    # 2. a frosted glass card over it: blur what is behind (backdrop filter), then a soft white film
    card = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(W * 0.2, H * 0.58, W * 0.6, H * 0.26), 36, 36)
    kc = ease_out(progress(t, t_in + 0.4, 0.8))
    if kc > 0:
        c.save()
        c.translate(0, 40 * (1 - kc))
        c.clipRRect(card, doAntiAlias=True)
        backdrop_blur(c, card.rect(), 28)
        c.restore()
        c.drawRRect(card, paint("surface", 0.35 * kc))
        c.restore()
        edge = paint("ink", 0.18 * kc, Style=skia.Paint.kStroke_Style, StrokeWidth=2)
        c.save(); c.translate(0, 40 * (1 - kc)); c.drawRRect(card, edge); c.restore()
    # 3. the phrase: letter by letter, each from blurred + low to sharp + home
    text = str(P.get("phrase", ""))
    # the phrase is fitted to the glass: measured, never overflowing it (72 px at most)
    size = 72.0
    f = font("title", size)
    room = card.rect().width() * 0.86
    if text and f.measureText(text) > room:
        size = max(34.0, size * room / f.measureText(text)); f = font("title", size)
    x0 = W * 0.5 - f.measureText(text) / 2
    x = x0
    for i, ch in enumerate(text):
        kk = ease_out(progress(t, t_word + i * 0.035, 0.5))
        if kk > 0:
            p = paint("ink", kk)
            blur = 10 * (1 - kk)
            if blur > 0.3:
                p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
            c.drawString(ch, x, H * 0.71 + size * 0.36 + 26 * (1 - kk), f, p)
        x += f.measureText(ch)
    # 4. a light streak: fast, so the motion blur is what makes it read as movement
    ks = progress(t, t_streak, 0.45)
    if 0 < ks < 1:
        sx = lerp(-200, W + 200, ease_in_out(ks))
        streak = skia.GradientShader.MakeLinear([skia.Point(sx - 180, 0), skia.Point(sx + 180, 0)],
                                                [C.alpha("ink", 0.0), C.alpha("ink", 0.55), C.alpha("ink", 0.0)])
        c.save(); c.clipRRect(card, doAntiAlias=True)
        c.drawRect(card.rect(), skia.Paint(Shader=streak, BlendMode=skia.BlendMode.kPlus))
        c.restore()
