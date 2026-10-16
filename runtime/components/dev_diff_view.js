// T-003 dev_diff_view: a code diff, unified or split (hand-off sheet, Family A). Built on _app_kit.js and _dev_kit.js.
// Meaning is never carried by hue alone: a removed line has a minus and a failure band, an added line a plus and a
// success band. In the screencast style with its engine, a unified diff IS the engine's code editor with its diff
// markers (no second editor is drawn); a split diff draws itself there too.
Loom.component("dev_diff_view", {
  version: 1,
  idea: "A code diff: the file's changed hunks with old and new line numbers, removed lines on a faint failure band with a minus, added lines on a faint success band with a plus and context lines plain, unified or side by side; removals then additions reveal on cue and a review comment can open on a row.",
  outline: ["file header with the file name", "per hunk: a muted hunk header", "rows: old line number, new line number, a plus or minus, the code", "split mode: old on the left, new on the right", "review comment balloons on a leader"],
  family: "dev",
  kind: "screen",
  tags: ["diff", "code review", "pull request", "change", "patch", "what changed", "security fix", "config drift", "version control", "git"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-003)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    hunks: { type: "list", content: true },        // [{header, lines: [{op: " " | "+" | "-", text}]}]
    file: { type: "str", content: true },
    mode: { type: "enum", choices: ["unified", "split"], default: "unified" },
    w: { type: "number", default: 1300 }, rows: { type: "int", default: 18 },
    at: { type: "number", default: -1 },           // when the diff reveals (context, then removals, then additions); -1: still
    lang: { type: "enum", choices: ["js", "ts", "py", "go", "java", "sql", "yaml", "json", "bash", "html", "css", "text"], default: "text" },
    wrap: { type: "enum", choices: ["wrap", "cut"], default: "wrap" },
    steps: { type: "list", default: [] },          // [{do: "reveal", op, at} | {do: "comment", row, text, at}]
    size: { type: "number", default: 22 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["frame", "header", "rows[] ({g, op, hunk, old, new})", "comments[]", "app (the engine app, in the screencast style)", "reveal(op, t)", "comment(row, text, t)"],
  example: 'ctx.use("dev_diff_view", { file: "config/session.js", lang: "js", hunks: [{ header: "@@ -8,3 +8,3 @@", lines: [{ op: " ", text: "const session = {" }, { op: "-", text: "  maxAgeDays: 365," }, { op: "+", text: "  maxAgeDays: 14," }, { op: " ", text: "};" }] }], at: ctx.cue("one line changed") }, { x: 300, y: 200, name: "diff" })',
  size: (p) => {
    const DK = Loom.devKit, CS = DK.codeSize(p.size);
    return { w: p.w, h: DK.barH() + 2 * 10 + Math.max(1, p.rows) * DK.codeLH(CS) };
  },
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const { Z } = DK.ui();
    const CS = DK.codeSize(p.size), LH = DK.codeLH(CS), ROWS = Math.max(1, p.rows | 0), cw = AK.monoW(CS);
    const barH = DK.barH(), W = p.w, H = barH + 2 * 10 + ROWS * LH, top = barH + 10;
    const animated = p.at != null && p.at >= 0;
    const hunks = (p.hunks || []).map((h, hi) => {
      const m = String(h.header || "").match(/-(\d+)(?:,\d+)?\s+\+(\d+)/);
      const lines = (h.lines || []).map((l, i) => {
        const L = typeof l === "string" ? { op: /^[+-]/.test(l) ? l[0] : " ", text: /^[+\- ]/.test(l) ? l.slice(1) : l } : Object.assign({}, l);
        if (![" ", "+", "-"].includes(L.op)) { Loom.error("component_params", `dev_diff_view: hunks[${hi}].lines[${i}].op "${L.op}" is not " ", "+" or "-"`); L.op = " "; }
        L.text = String(L.text == null ? "" : L.text).replace(/\t/g, "    ");
        return L;
      });
      return { header: h.header == null ? "" : String(h.header), old0: m ? +m[1] : 1, new0: m ? +m[2] : 1, lines };
    });
    const eng = DK.engine(ctx, g, p);

    // ================================================================ the screencast engine: a unified diff in its editor
    if (eng && eng.id === "screencast" && eng.W.app && p.mode === "unified") {
      const E = eng.E, elang = { py: "python", sh: "bash", js: "js", ts: "ts", yaml: "yaml", json: "json", bash: "bash" }[p.lang] || "text";
      const lines = [], diff = {}, ops = [];
      hunks.forEach((h) => { if (h.header) { lines.push(h.header); ops.push("h"); } h.lines.forEach((L) => { lines.push(L.text); ops.push(L.op); if (L.op !== " ") diff[lines.length] = L.op; }); });
      const A = eng.W.app(ctx, E.name + "_app", { chrome: "window", title: p.file, frame: { x: E.x, y: E.y, w: W, h: H },
        content: [{ id: "diff", kind: "code", lang: elang, lines, diff: animated ? {} : diff, start: 1, size: CS }] }, { at: animated ? p.at : 0 });
      const reveal = (op, t) => { let k = 0; Object.entries(diff).forEach(([n, o]) => { if (o === op) A.codeMark("diff", +n, o, t + 0.06 * k++); }); return t + 0.06 * k + 0.2; };
      if (animated) reveal("+", reveal("-", p.at + 0.6) + 0.3);
      const parts = { app: A, frame: A, rows: lines.map((_, i) => `diff.line.${i + 1}`), reveal,
        // the engine's callout holds 2 to 6 words (sc_callout_long past 8): a longer comment is cut at a word, and said so
        comment(row, text, t) {
          const ws = String(text).split(/\s+/).filter(Boolean);
          if (ws.length > 8) Loom.warn("dev_diff_comment_long", `dev_diff_view: a review comment of ${ws.length} words is cut to 8 for the screencast callout (2 to 6 words read best)`);
          const s = ws.length > 8 ? ws.slice(0, 8).join(" ").replace(/[,;:.]+$/, "") + "…" : ws.join(" ");
          return A.callout(`diff.line.${row + 1}`, s, { at: t, until: t + 3, side: "below" });
        } };
      for (const st of p.steps || []) { if (st && st.do === "reveal") parts.reveal(st.op, st.at); else if (st && st.do === "comment") parts.comment(st.row, st.text, st.at); }
      return parts;
    }

    // ================================================================ the diff drawn by the kit
    const SC = DK.scheme("light");
    const SYN = DK.syntax({}, SC.bg, SC.text);
    const F = DK.frame(ctx, g, W, H, { dots: false, bodyFill: SC.bg, at: p.at, eng, name: "diff" });
    const hg = svg("g", {}, g);
    AK.icon(hg, "file-diff", 30, barH / 2, 24, "muted");
    const fileT = AK.T(hg, p.file, { x: 52, y: 0, w: W - 80, h: barH, size: Z.fs, weight: 600 });
    if (animated) AK.show(hg, F.end - 0.1, 0.25);
    const parts = { frame: F.g, header: { g: hg, file: fileT }, rows: [], comments: [] };
    const clipId = Loom.uid ? Loom.uid("diffclip") : "diffclip" + Loom.hash(p.file);
    const cp = svg("clipPath", { id: clipId }, g);
    svg("rect", { x: 2, y: top - 2, width: W - 4, height: ROWS * LH + 4 }, cp);
    const area = svg("g", { "clip-path": `url(#${clipId})` }, g), over = svg("g", {}, g);
    const lnC = DK.legible(S.mix(SC.text, SC.bg, 0.5), SC.bg, SC.text, 3.2);
    const band = { "+": SC.band("pos", 0.16), "-": SC.band("neg", 0.13), h: SC.band("line", 0.08) };
    const glyphC = { "+": SC.ok, "-": SC.err, " ": lnC };
    const maxN = Math.max(1, ...hunks.map((h) => Math.max(h.old0, h.new0) + h.lines.length));
    const dg = String(maxN).length, numW = dg * cw + 16;
    const rowsOut = [];
    let r = 0;
    // each row sits in a wrapper the comments push down (the row itself keeps its own reveal transform)
    const rowG = () => svg("g", {}, svg("g", {}, area));
    const rowY = (k) => top + k * LH;

    // one side of a row: [old number] [new number] [glyph] [code, wrapped or cut]; returns the rows used
    function cell(gg, x, w, L, nums, k0) {
      let cx = x + 10;
      for (const n of nums) { if (n != null) AK.mono(gg, [[String(n).padStart(dg, " "), lnC]], { x: cx, y: rowY(k0), h: LH, size: CS }); cx += numW; }
      if (L.op !== " " || nums.length) AK.mono(gg, [[L.op === " " ? " " : L.op, glyphC[L.op], 700]], { x: cx, y: rowY(k0), h: LH, size: CS });
      const codeX = cx + cw * 2, room = x + w - codeX - 12;
      if (p.wrap === "cut") { DK.code(gg, L.text, { x: codeX, y: rowY(k0), lh: LH, size: CS, lang: p.lang, SYN, w: room }); return 1; }
      const rows = DK.wrapRuns(L.text, p.lang, SYN, DK.cols(room, CS));
      rows.forEach((segs, j) => { if (segs.some((q) => q[0].trim())) AK.mono(gg, segs, { x: codeX, y: rowY(k0 + j), h: LH, size: CS }); });
      return rows.length;
    }
    function bandRect(gg, x, w, op, k0, n) {
      if (op === " ") return null;
      const b = svg("rect", { x: f1(x), y: f1(rowY(k0)), width: f1(w), height: f1(n * LH), fill: band[op] }, gg);
      svg("rect", { x: f1(x), y: f1(rowY(k0)), width: 4, height: f1(n * LH), fill: glyphC[op] }, gg);
      return b;
    }
    const nRowsOf = (L, w, nums) => (p.wrap === "cut" ? 1 : DK.wrapCols(L.text, DK.cols(w - 10 - nums * numW - cw * 2 - 12, CS)).length);
    hunks.forEach((h, hi) => {
      if (h.header) {
        const gg = rowG();
        svg("rect", { x: 2, y: f1(rowY(r)), width: W - 4, height: LH, fill: band.h }, gg);
        AK.mono(gg, [[h.header, SC.muted]], { x: 18, y: rowY(r), h: LH, size: CS, w: W - 40 });
        rowsOut.push({ g: gg, op: "h", hunk: hi, r0: r, n: 1 });
        r += 1;
      }
      let o = h.old0, nw = h.new0;
      if (p.mode === "unified") {
        h.lines.forEach((L) => {
          const gg = rowG(), n = nRowsOf(L, W - 4, 2);
          bandRect(gg, 2, W - 4, L.op, r, n);
          cell(gg, 2, W - 4, L, [L.op === "+" ? null : o, L.op === "-" ? null : nw], r);
          rowsOut.push({ g: gg, op: L.op, hunk: hi, r0: r, n, old: L.op === "+" ? null : o, new: L.op === "-" ? null : nw, text: L.text });
          if (L.op !== "+") o++;
          if (L.op !== "-") nw++;
          r += n;
        });
      } else {
        // side by side: context on both sides; a run of removals faces the run of additions after it
        const half = (W - 4) / 2;
        let i = 0;
        while (i < h.lines.length) {
          const L = h.lines[i];
          if (L.op === " ") {
            const gg = rowG(), n = Math.max(nRowsOf(L, half, 1), 1);
            cell(gg, 2, half, L, [o], r); cell(gg, 2 + half, half, L, [nw], r);
            rowsOut.push({ g: gg, op: " ", hunk: hi, r0: r, n, old: o, new: nw, text: L.text });
            o++; nw++; r += n; i++;
            continue;
          }
          const dels = [], adds = [];
          while (i < h.lines.length && h.lines[i].op === "-") dels.push(h.lines[i++]);
          while (i < h.lines.length && h.lines[i].op === "+") adds.push(h.lines[i++]);
          for (let k = 0; k < Math.max(dels.length, adds.length); k++) {
            const D = dels[k], A2 = adds[k];
            const n = Math.max(D ? nRowsOf(D, half, 1) : 1, A2 ? nRowsOf(A2, half, 1) : 1);
            if (D) { const gg = rowG(); bandRect(gg, 2, half - 2, "-", r, n); cell(gg, 2, half, D, [o], r); rowsOut.push({ g: gg, op: "-", hunk: hi, r0: r, n, old: o, new: null, text: D.text }); o++; }
            if (A2) { const gg = rowG(); bandRect(gg, 2 + half + 2, half - 2, "+", r, n); cell(gg, 2 + half, half, A2, [nw], r); rowsOut.push({ g: gg, op: "+", hunk: hi, r0: r, n, old: null, new: nw, text: A2.text }); nw++; }
            r += n;
          }
        }
        svg("rect", { x: f1(2 + half - 0.75), y: top, width: 1.5, height: f1(ROWS * LH), fill: SC.rule }, area);
      }
    });
    parts.rows = rowsOut;
    if (r > ROWS) Loom.warn("dev_diff_rows", `dev_diff_view "${p.file}": ${r} rows of diff, ${ROWS} visible; the rest is below the fold (raise rows)`);

    // ---- motion: context first, then removals fade to their band, then additions grow in
    const textOf = (R) => Array.from(R.g.querySelectorAll("text"));
    parts.reveal = function (op, t) {
      let k = 0;
      for (const R of rowsOut) {
        if (R.op !== op) continue;
        const ti = t + 0.07 * k++;
        if (op === "-") {
          Loom.tween(R.g, { opacity: 0 }, { opacity: 1, duration: 0.2 }, ti, DK.meta("reveal", "diff.remove"));
          for (const tx of textOf(R)) Loom.tween(tx, { opacity: 1 }, { opacity: 0.62, duration: 0.35 }, ti + 0.45, DK.meta("state", "diff.remove"));
        } else {
          Loom.drive((e) => R.g.setAttribute("transform", `translate(0 ${f1(rowY(R.r0) * (1 - e))}) scale(1 ${f1(Math.max(0.001, e))})`), ti, 0.3, "enter", DK.meta("reveal", "diff.add"));
          Loom.tween(R.g, { opacity: 0 }, { opacity: 1, duration: 0.2 }, ti, DK.meta("reveal", "diff.add"));
        }
      }
      return t + 0.07 * k + 0.4;
    };
    if (animated) {
      const t0 = F.end;
      for (const R of rowsOut) if (R.op === " " || R.op === "h") AK.show(R.g, t0, 0.25);
      parts.reveal("+", parts.reveal("-", t0 + 0.4) + 0.2);
    }
    parts.comment = function (row, text, t) {
      const R = rowsOut[row];
      if (!R) return t;
      // the comment opens inline under its row, as review tools show it; the rows below move down to make room
      const bx = 2 + Math.min(W * 0.12, 120), bw = Math.min(W - bx - 24, 980), padI = 16, sz = Z.fs;
      const c = AK.clampText(String(text), { role: "caption", size: sz, w: bw - 2 * padI - 40, maxLines: 4 });
      const bh = c.h + 2 * padI, push = Math.ceil((bh + 20) / LH) * LH, gap = (push - bh) / 2;
      const shiftOf = (Q) => (Q.dy || 0);
      const by = rowY(R.r0 + R.n) + gap + shiftOf(R);
      const cg = svg("g", { opacity: 0 }, svg("g", {}, area));
      svg("rect", { x: f1(bx), y: f1(by), width: f1(bw), height: f1(bh), rx: 12, fill: SC.bg }, cg);
      Loom.kit.rect(cg, bx, by, bw, bh, { fill: "surface", r: 12, stroke: "accent", sw: 2 });
      svg("rect", { x: f1(bx), y: f1(by + 10), width: 5, height: f1(bh - 20), rx: 2.5, fill: S.c("accent") }, cg);
      AK.icon(cg, "message-square", bx + 30, by + padI + 14, 24, "accent");
      AK.P(cg, c.text, { x: bx + padI + 40, y: by + padI, w: bw - 2 * padI - 40, size: sz, maxLines: 4 });
      const C = { g: cg, row, r0: R.r0 + R.n, dy: 0 };
      const still = t == null || t < 0;
      for (const Q of rowsOut.concat(parts.comments)) {
        if (Q.r0 < R.r0 + R.n || Q === R) continue;
        Q.dy = (Q.dy || 0) + push;
        const wrap = Q.g.parentNode;
        if (still) { wrap.setAttribute("transform", `translate(0 ${f1(Q.dy)})`); AK.setShift(wrap, 0, Q.dy); }
        else AK.shift(wrap, 0, Q.dy, t, 0.35);
      }
      parts.comments.push(C);
      if (still) { cg.setAttribute("opacity", 1); return t; }
      return AK.show(cg, t + 0.25, 0.3);
    };
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "reveal") parts.reveal(st.op, st.at);
      else if (st.do === "comment") parts.comment(st.row, st.text, st.at);
      else Loom.error("component_params", `dev_diff_view: step "${st.do}" is not reveal or comment`);
    }
    return parts;
  },
});
