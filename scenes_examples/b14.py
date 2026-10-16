"""b14 - each self-test resets the curve, and each new drop is gentler (F8). Illustrative shape."""
from loom_manim import *

CUES = ["Now, timing", "tests herself", "jumps back up", "next drop", "is slower"]
TESTS = [1.0, 3.0, 6.0]
RATES = [1.3, 0.6, 0.3, 0.14]


def seg(ax, t0, t1, k, **kw):
    return ax.plot(lambda x: 100 * np.exp(-k * (x - t0)), x_range=[t0, t1], **kw)


class Main(LoomScene):
    def construct(self):
        ax = Axes(x_range=[0, 8, 1], y_range=[0, 100, 25], x_length=13.2, y_length=5.6, tips=True,
                  axis_config={"color": C.line, "stroke_width": 4, "include_ticks": False}).shift(DOWN * 0.45 + RIGHT * 0.3)
        xl = self.text("time since training", "label", C.muted).next_to(ax.x_axis, DOWN, buff=0.25).align_to(ax.x_axis, RIGHT)
        yl = self.text("what you can recall", "label", C.muted).rotate(PI / 2).next_to(ax.y_axis, LEFT, buff=0.25).align_to(ax.y_axis, UP)
        self.play(Create(ax), FadeIn(xl), FadeIn(yl), run_time=0.9)

        # the old curve, as a ghost: what happens with no tests
        ghost = DashedVMobject(seg(ax, 0, 8, RATES[0], color=C.muted, stroke_width=4, stroke_opacity=0.6), num_dashes=70)
        first = seg(ax, 0, TESTS[0], RATES[0], color=C.accent, stroke_width=9)
        self.wait_until("Now, timing")
        self.play(Create(ghost), run_time=1.0)
        self.play(Create(first), run_time=0.9, rate_func=rate_functions.ease_out_cubic)

        anchors = CUES[1:4]
        bounds = TESTS + [8.0]
        for i, t in enumerate(TESTS):
            self.wait_until(anchors[i])
            low = 100 * np.exp(-RATES[i] * (t - (bounds[i - 1] if i else 0)))
            jump = Line(ax.c2p(t, low), ax.c2p(t, 100), color=C.accent2, stroke_width=7)
            dot = Dot(ax.c2p(t, 100), radius=0.14, color=C.accent2)
            tag = self.text("test", "label", C.accent2).next_to(dot, UP, buff=0.18)
            self.play(Create(jump), FadeIn(dot, scale=0.5), FadeIn(tag, shift=DOWN * 0.1), run_time=0.45)
            nxt = seg(ax, t, bounds[i + 1], RATES[i + 1], color=C.accent, stroke_width=9)
            self.play(Create(nxt), run_time=1.1 if i < 2 else 1.4, rate_func=rate_functions.ease_in_out_sine)

        self.wait_until("is slower")
        note = self.text("gentler after each test", "lead", C.ink).next_to(ax.c2p(7.9, 72), LEFT, buff=0.1)
        self.play(FadeIn(note, shift=UP * 0.12), run_time=0.45)
        self.hold_to_end()
