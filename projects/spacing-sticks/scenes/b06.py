# @design staged_curve: an illustrative curve on plain axes with no values is drawn in narrated stages, with faint dashed variants alongside
"""b06 - the forgetting curve, drawn as it is described: steep first, then level; then it varies.

The clip is 1600x780 px, transparent; the canvas shows through. Timing is injected: every
wait_until() is a word the narrator says. Shapes are ILLUSTRATIVE (no data values are shown):
the knowledge sheet states the shape (F2) and that the rate varies (F3), not numbers.
"""
from loom_manim import *


def recall(k):
    return lambda x: 100 * np.exp(-k * x)


class Main(LoomScene):
    def construct(self):
        # @form labelled_axes: plain-language axes with titles and no tick values
        ax = Axes(x_range=[0, 7, 1], y_range=[0, 100, 25], x_length=13.2, y_length=5.6, tips=True,
                  axis_config={"color": C.line, "stroke_width": 4, "include_ticks": False}).shift(DOWN * 0.45 + RIGHT * 0.3)
        xl = self.text("time since training", "label", C.muted).next_to(ax.x_axis, DOWN, buff=0.25).align_to(ax.x_axis, RIGHT)
        yl = self.text("what you can recall", "label", C.muted).rotate(PI / 2).next_to(ax.y_axis, LEFT, buff=0.25).align_to(ax.y_axis, UP)
        self.play(Create(ax), run_time=0.9)
        self.play(FadeIn(xl, shift=UP * 0.1), FadeIn(yl, shift=RIGHT * 0.1), run_time=0.5)

        self.wait_until("the forgetting curve")
        title = self.text("The forgetting curve", "title", C.accent2).move_to(ax.c2p(4.6, 92))
        self.play(FadeIn(title, shift=DOWN * 0.15), run_time=0.5)

        f = recall(0.9)
        # @form decay_curve: an illustrative curve that drops steeply then levels off
        steep = ax.plot(f, x_range=[0, 1.6], color=C.accent, stroke_width=9)
        level = ax.plot(f, x_range=[1.6, 7], color=C.accent, stroke_width=9)
        start = Dot(ax.c2p(0, 100), radius=0.13, color=C.accent2)
        self.wait_until("drops steeply")
        self.play(FadeIn(start, scale=0.5), run_time=0.25)
        self.play(Create(steep), run_time=1.3, rate_func=rate_functions.ease_out_cubic)
        fast = self.text("fast at first", "body", C.ink).next_to(ax.c2p(0.9, f(0.9)), RIGHT, buff=0.35)
        self.play(FadeIn(fast, shift=LEFT * 0.15), run_time=0.4)

        self.wait_until("levels off")
        self.play(Create(level), run_time=1.8, rate_func=rate_functions.ease_in_out_sine)
        slow = self.text("then slower", "body", C.ink).next_to(ax.c2p(5.2, f(5.2)), UP, buff=0.35)
        self.play(FadeIn(slow, shift=DOWN * 0.15), run_time=0.4)

        # it varies: two ghost curves, one gentler, one steeper (shape only, no values)
        self.wait_until("depends on you")
        # @form ghost_curve: a faint dashed curve drawn alongside the main one as a baseline or variant
        g1 = ax.plot(recall(0.45), x_range=[0, 7], color=C.accent4, stroke_width=5, stroke_opacity=0.8)
        g2 = ax.plot(recall(1.6), x_range=[0, 7], color=C.accent3, stroke_width=5, stroke_opacity=0.8)
        g1 = DashedVMobject(g1, num_dashes=60); g2 = DashedVMobject(g2, num_dashes=60)
        self.play(Create(g1), Create(g2), run_time=1.2)
        note = self.text("no single number", "lead", C.accent2).next_to(ax.c2p(6.8, 60), LEFT, buff=0.1)
        self.wait_until("magic percentage")
        self.play(FadeIn(note, shift=UP * 0.12), run_time=0.45)
        self.hold_to_end()
