// @lab {"title": "A real terminal (xterm.js)", "dur": 5, "libs": ["xterm"], "times": [0.4, 1.3, 2.2, 3.1, 4.0, 4.9]}
// A capability proof: a session typed and answered; each frame is the terminal after the text up to t, from empty.
export async function build(ctx, P) {
  const term = P.terminal({ cols: 72, rows: 14, size: 30 });
  const lines = [["$ git status", 0.3, 1.2], ["\r\nOn branch main\r\nnothing to commit, working tree clean\r\n", 1.4, 1.5],
    ["$ git log --oneline -2", 2.0, 3.0], ["\r\n\x1b[33ma1b2c3d\x1b[0m Fix the caption hold\r\n\x1b[33m9f8e7d6\x1b[0m Add the timing grid\r\n$ ", 3.2, 3.3]];
  return {
    async render(t) {
      let txt = "";
      for (const [s, a, b] of lines) { const k = P.seg(t, a, b); txt += s.slice(0, Math.round(k * s.length)); }
      await term.show(txt);
    },
  };
}
