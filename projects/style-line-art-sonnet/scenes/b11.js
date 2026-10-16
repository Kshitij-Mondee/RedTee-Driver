// @design carried_outline: one outline keeps its colour while its form changes and moves on, leaving faint ghosts with labels
// Treatments considered: (1) static row of three forms with a colour legend; (2) three separate items each classified in turn;
// (3) CHOSEN: one live outline that morphs page -> folder -> screen across the sheet, earlier forms left as faint ghosts.
Loom.scene("b11", {
  build(ctx, props) {
    var kit = ctx.kit, m = ctx.m;
    var NS = "http://www.w3.org/2000/svg";
    var SC = 1.25;                   // item scale
    var CX = [420, 960, 1480];       // slot centres (stage coords)
    var CY = 450;                    // form centre
    var LABY = 725;                  // label top
    var TOP = 200;                   // element top offset (stage)
    var cyL = CY - TOP;

    var tDraw = ctx.cue("The class travels with the information");
    var tPaper = ctx.cue("on paper");
    var tFolder = ctx.cue("in a folder");
    var tScreen = ctx.cue("on a screen");
    var MORPH = 0.6;

    // path helpers: same 8-point structure, so numbers interpolate one to one
    function tf(d, sx, sy, dx, dy) {
      var i = 0;
      return d.replace(/-?\d+(\.\d+)?/g, function (s) {
        var v = parseFloat(s), k = i++;
        return ((k % 2 === 0) ? v * sx + dx : v * sy + dy).toFixed(1);
      });
    }
    function lerpD(a, b, e) {
      var nb = b.match(/-?\d+(\.\d+)?/g), j = 0;
      return a.replace(/-?\d+(\.\d+)?/g, function (s) { var v = parseFloat(s), w = parseFloat(nb[j++]); return (v + (w - v) * e).toFixed(2); });
    }
    function mk(p, tag, a) {
      var e = document.createElementNS(NS, tag);
      for (var k in a) e.setAttribute(k, a[k]);
      p.appendChild(e);
      return e;
    }

    // ---- ghosts (drawn first so they sit under the live outline) ----
    function ghostEl(name, cx, d, rowsToo) {
      var E = ctx.el(name, { x: cx - 260, y: TOP, w: 520, h: 520, kind: "scenery", exit: "recede" });
      var g = mk(E.inner, "g", { opacity: 0 });
      var inner = mk(g, "g", { transform: "translate(" + (260 - 140 * SC) + " " + (cyL - 180 * SC) + ") scale(" + SC + ")" });
      mk(inner, "path", { d: d, fill: "none", stroke: ctx.c("accent3"), "stroke-width": 3, "stroke-linejoin": "round" });
      if (rowsToo) {
        for (var i = 0; i < 6; i++) mk(inner, "path", { d: "M24 " + (60 + i * 34) + "H" + (i % 3 === 2 ? 170 : 256), fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-linecap": "round" });
      }
      return { E: E, g: g };
    }

    // The live item: built once to learn its path strings
    var EM = ctx.el("morph_item", { x: 0, y: TOP, w: 1920, h: 520, kind: "node", exit: "recede" });
    var item = Loom.lesson.item(ctx, EM.inner, { variant: "plain", cls: "none", label: false, scale: SC });
    var D0 = item.pageOutline;
    var D1 = tf(item.folderOutline, 1.2, 0.9, 140 - 0.6 * 280, 180 - 0.45 * 360);
    var D2 = tf(item.screenOutline, 1.4, 0.9, 140 - 0.7 * 280, 180 - 0.45 * 360);

    var gP = ghostEl("paper_ghost", CX[0], D0, true);
    var gF = ghostEl("folder_ghost", CX[1], D1, false);

    // live item transform: a pure function of travel progress
    function place(cx) {
      item.g.setAttribute("transform", "translate(" + (cx - 140 * SC).toFixed(1) + " " + (cyL - 180 * SC).toFixed(1) + ") scale(" + SC + ")");
    }
    place(CX[0]);

    // a miniature of the same page, shown on the screen
    var mini = mk(item.g, "g", { opacity: 0 });
    mk(mini, "path", { d: "M90 60H190V222H90Z", fill: ctx.c("surface"), stroke: ctx.c("accent3"), "stroke-width": 3, "stroke-linejoin": "round" });
    for (var r = 0; r < 5; r++) mk(mini, "path", { d: "M104 " + (84 + r * 26) + "H" + (r % 3 === 2 ? 150 : 176), fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-linecap": "round" });

    // ---- labels ----
    function labelEl(name, cx, str) {
      var E = ctx.el(name, { x: cx - 220, y: LABY, w: 440, h: 70, kind: "text", exit: "recede" });
      var g = mk(E.inner, "g", {});
      kit.text(g, str, { role: "lead", x: 0, y: 0, w: 440, h: 70, align: "center", valign: "middle", color: "ink" });
      return { E: E, g: g };
    }
    var lP = labelEl("paper_label", CX[0], "Paper");
    var lF = labelEl("folder_label", CX[1], "Folder");
    var lS = labelEl("screen_label", CX[2], "Screen");

    // ---- 1. the page draws, then takes the class colour ----
    item.drawIn(tDraw, 0.9);
    item.setClass("confidential", tDraw + 0.45, 0.7);

    // ---- 2. Paper prints ----
    m.unmask(lP.E, tPaper, { dir: "ltr", dur: 0.5 });

    // ---- 3. page -> folder, moving right; the page is left as a ghost ----
    function morph(t, fromD, toD, fromX, toX, ghost, lab, rowsOut, miniIn, miniOut) {
      Loom.drive(function (e) {
        var d = lerpD(fromD, toD, e);
        item.outline.setAttribute("d", d);
        item.page.setAttribute("d", d);
        place(fromX + (toX - fromX) * e);
        if (rowsOut) item.rows.forEach(function (r) { r.setAttribute("opacity", Math.max(0, 1 - e * 2.5)); });
        if (miniIn) mini.setAttribute("opacity", Math.max(0, (e - 0.5) / 0.5));
        if (miniOut) mini.setAttribute("opacity", 0);
      }, t, MORPH, "move");
      Loom.drive(function (e) { ghost.g.setAttribute("opacity", 0.3 * e); lab.g.setAttribute("opacity", 1 - 0.55 * e); }, t, 0.4, "enter");
    }
    morph(tFolder, D0, D1, CX[0], CX[1], gP, lP, true, false, false);
    m.unmask(lF.E, tFolder + MORPH - 0.1, { dir: "ltr", dur: 0.5 });

    // ---- 4. folder -> screen showing the same page ----
    morph(tScreen, D1, D2, CX[1], CX[2], gF, lF, false, true, false);
    m.unmask(lS.E, tScreen + MORPH - 0.1, { dir: "ltr", dur: 0.5 });
  }
});
