// Code to coloured tokens with Shiki (D-176, the page kind's code capability). Run by loom/page_bridge.py before a page
// clip renders, so the page itself loads no highlighter: deterministic, offline, one Node call per code block.
// usage: node shiki_tokens.mjs <in.json> <out.json>   in: [{code, lang, theme}]  out: [{lines: [[{t, c, s}]], fg, bg}]
import fs from "node:fs";
import { codeToTokens } from "shiki";

const [, , inp, out] = process.argv;
const jobs = JSON.parse(fs.readFileSync(inp, "utf8"));
const res = [];
for (const j of jobs) {
  const r = await codeToTokens(String(j.code), { lang: j.lang || "text", theme: j.theme || "github-light" });
  res.push({
    fg: r.fg, bg: r.bg,
    lines: r.tokens.map((line) => line.map((tk) => ({ t: tk.content, c: tk.color || r.fg, s: tk.fontStyle || 0 }))),
  });
}
fs.writeFileSync(out, JSON.stringify(res));
