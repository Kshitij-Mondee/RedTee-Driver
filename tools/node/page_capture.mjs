// Capture a web page once into an offline, self-contained snapshot for the screencast engine's `page` region.
//   node page_capture.mjs <job.json>
// job: {url, width, height, out_json, out_png, shot_only}
// Driven by tools/page_capture.py, which checks the approval, the URL and robots.txt first. A fresh browser profile:
// no cookies, no stored logins, nothing typed; public pages only. The page's scripts run once while it loads (as a
// visitor's browser runs them); the snapshot keeps the DOM and the CSS that resulted, with every script, frame, video
// and event handler removed, every image, stylesheet and font inlined (data URLs), and the :hover, :focus and :active
// rules rewritten to classes the engine sets on cue. Each element gets data-lm-i and its box, so a scene finds it by
// selector without a layout of its own.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..", "..");
function chromePath() {
  if (process.env.HYPERFRAMES_BROWSER_PATH) return process.env.HYPERFRAMES_BROWSER_PATH;
  const bin = path.join(engine, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
  return execFileSync(process.execPath, [bin, "browser", "path"], { encoding: "utf8" }).trim().split(/\r?\n/).pop();
}
const job = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const W = job.width || 1280, H = job.height || 800;
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "shell", args: ["--no-sandbox", "--disable-gpu", "--incognito"] });
const MAXB = 4 * 1024 * 1024;
const cache = new Map();          // url -> {mime, b64}
const log = [];
try {
  const ctx = browser.createBrowserContext ? await browser.createBrowserContext() : browser;
  const p = await ctx.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await p.setUserAgent("Mozilla/5.0 (LoomCapture; one approved capture for a lesson) Chrome");
  p.on("response", async (r) => {
    try {
      const t = r.request().resourceType();
      if (!["image", "font", "stylesheet"].includes(t) || r.status() >= 400) return;
      const b = await r.buffer();
      if (b.length > MAXB) { log.push(`skipped ${r.url()} (${b.length} bytes)`); return; }
      cache.set(r.url(), { mime: (r.headers()["content-type"] || "").split(";")[0] || "application/octet-stream", b64: b.toString("base64"), text: t === "stylesheet" ? b.toString("utf8") : null });
    } catch (e) { /* a response with no body (a redirect) */ }
  });
  await p.goto(job.url, { waitUntil: "networkidle0", timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  if (job.out_png) await p.screenshot({ path: job.out_png, fullPage: !!job.full_png });
  if (!job.shot_only) {
    const snap = await p.evaluate(() => {
      const abs = (u, base) => { try { return new URL(u, base || document.baseURI).href; } catch (e) { return null; } };
      // ---- CSS: every rule the page has at this width, selectors rewritten for state classes and the wrappers
      const rw = (sel) => sel
        .replace(/:hover/g, ".lm-hover").replace(/:focus-within/g, ".lm-focus-within").replace(/:focus-visible|:focus/g, ".lm-focus").replace(/:active/g, ".lm-active")
        .replace(/(^|[\s,>+~(])(?:html|:root)(?=$|[\s,.:#[>+~)])/g, "$1.lm-html").replace(/(^|[\s,>+~(])body(?=$|[\s,.:#[>+~)])/g, "$1.lm-body");
      const css = [], faces = [];
      const walk = (rules, base, out) => {
        for (const r of rules) {
          if (r.type === 1) out.push(`${rw(r.selectorText)}{${r.style.cssText}}`);
          else if (r.type === 4) { if (window.matchMedia(r.media.mediaText).matches) walk(r.cssRules, base, out); }   // fixed width: resolve media now
          else if (r.type === 12) { if (CSS.supports(r.conditionText)) walk(r.cssRules, base, out); }
          else if (r.type === 5) faces.push({ family: r.style.getPropertyValue("font-family").replace(/["']/g, "").trim(), weight: r.style.getPropertyValue("font-weight") || "400", style: r.style.getPropertyValue("font-style") || "normal", src: r.style.getPropertyValue("src"), base });
          else if (r.type === 7) out.push(r.cssText);   // keyframes (animations are switched off; kept for completeness)
          else if (r.type === 3 && r.styleSheet) { try { walk(r.styleSheet.cssRules, r.styleSheet.href || base, out); } catch (e) { /* cross-origin */ } }
        }
      };
      const sheets = [];
      for (const sh of document.styleSheets) {
        const base = sh.href || document.baseURI;
        try { const out = []; walk(sh.cssRules, base, out); sheets.push({ text: out.join("\n"), base }); }
        catch (e) { sheets.push({ text: null, href: sh.href, base }); }   // cross-origin: the raw text, from the network cache
      }
      // ---- the elements: an index, a parent, what a selector needs, and the box at this width
      const els = [], keepA = ["name", "type", "role", "aria-label", "href", "placeholder", "for", "title", "alt", "value"];
      const all = Array.from(document.body.querySelectorAll("*"));
      const idx = new Map();
      [document.body].concat(all).forEach((e, i) => idx.set(e, i));
      [document.body].concat(all).forEach((e, i) => {
        e.setAttribute("data-lm-i", i);
        const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
        const a = {}; for (const k of keepA) if (e.hasAttribute(k)) a[k] = e.getAttribute(k).slice(0, 120);
        const own = Array.from(e.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" ").replace(/\s+/g, " ").trim().slice(0, 80);
        const rec = { i, p: e === document.body ? -1 : idx.get(e.parentElement), tag: e.tagName.toLowerCase(), id: e.id || undefined, cls: (typeof e.className === "string" && e.className.trim()) || undefined,
          a: Object.keys(a).length ? a : undefined, tx: own || undefined, b: [b.x + scrollX, b.y + scrollY, b.width, b.height].map((v) => Math.round(v * 10) / 10), fs: parseFloat(cs.fontSize) || 16 };
        if (/^(input|textarea|select)$/.test(rec.tag)) { rec.ff = cs.font; rec.pl = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth); rec.v = e.value; if (e.type === "checkbox" || e.type === "radio") rec.on = !!e.checked; }
        els.push(rec);
      });
      // ---- the DOM as it is: values written back, scripts and handlers gone, image sources absolute
      for (const e of all) {
        if (/^(input)$/i.test(e.tagName)) { if (e.type === "checkbox" || e.type === "radio") { if (e.checked) e.setAttribute("checked", ""); else e.removeAttribute("checked"); } else e.setAttribute("value", e.value); }
        if (/^textarea$/i.test(e.tagName)) e.textContent = e.value;
        for (const at of Array.from(e.attributes)) if (/^on/i.test(at.name)) e.removeAttribute(at.name);
        if (e.hasAttribute("href") && /^javascript:/i.test(e.getAttribute("href"))) e.setAttribute("href", "#");
        if (e.tagName === "IMG") { const s = e.currentSrc || e.src; e.removeAttribute("srcset"); e.removeAttribute("loading"); e.setAttribute("src", s); }
        if (e.style && e.style.backgroundImage && /url\(/.test(e.style.backgroundImage)) e.setAttribute("data-lm-bg", "1");
      }
      for (const e of Array.from(document.body.querySelectorAll("script, noscript, iframe, video, audio, object, embed, link, meta, base, template, style"))) {
        if (/^(IFRAME|VIDEO|OBJECT|EMBED)$/.test(e.tagName)) {   // a frame or a video keeps its box as a plain panel
          const d = document.createElement("div"); d.setAttribute("data-lm-i", e.getAttribute("data-lm-i"));
          d.setAttribute("style", `width:${e.offsetWidth}px;height:${e.offsetHeight}px;background:#d9d9d9;border-radius:6px`);
          e.replaceWith(d);
        } else e.remove();
      }
      const attrs = (e) => { const o = {}; for (const at of Array.from(e.attributes)) if (at.name === "class" || at.name === "style" || at.name.startsWith("data-") || at.name === "lang" || at.name === "dir") o[at.name] = at.value; return o; };
      return { url: location.href, title: document.title, w: innerWidth, h: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
        bg: getComputedStyle(document.body).backgroundColor, htmlBg: getComputedStyle(document.documentElement).backgroundColor,
        html: document.body.innerHTML, htmlAttrs: attrs(document.documentElement), bodyAttrs: attrs(document.body), sheets, faces, els };
    });
    // ---- inline what the page loaded; anything not loaded is dropped (the snapshot never reaches the network)
    const dataUrl = (u) => { const c = u && cache.get(u); return c ? `data:${c.mime};base64,${c.b64}` : null; };
    const inlineCss = (text, base) => text.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
      if (/^data:/i.test(u)) return m;
      let a; try { a = new URL(u, base).href; } catch (e) { return "none"; }
      const d = dataUrl(a);
      if (!d) log.push(`not loaded, dropped: ${a}`);
      return d ? `url("${d}")` : "none";
    });
    const rw = (sel) => sel.replace(/:hover/g, ".lm-hover").replace(/:focus-within/g, ".lm-focus-within").replace(/:focus-visible|:focus/g, ".lm-focus").replace(/:active/g, ".lm-active");
    const cssParts = [];
    for (const sh of snap.sheets) {
      if (sh.text != null) cssParts.push(inlineCss(sh.text, sh.base));
      else if (sh.href && cache.get(sh.href) && cache.get(sh.href).text != null) cssParts.push(inlineCss(rw(cache.get(sh.href).text), sh.href));   // cross-origin: raw text
    }
    const fonts = [];
    for (const f of snap.faces) {
      const m = /url\(\s*(['"]?)([^'")]+)\1\s*\)/.exec(f.src || "");
      if (!m) continue;
      let a; try { a = new URL(m[2], f.base).href; } catch (e) { continue; }
      const c = /^data:/.test(m[2]) ? { mime: "font/woff2", b64: m[2].split(",")[1] } : cache.get(a);
      if (!c) { log.push(`font not loaded: ${a}`); continue; }
      fonts.push({ family: f.family, weight: f.weight, style: f.style, mime: c.mime, b64: c.b64 });
    }
    let html = snap.html.replace(/(<img\b[^>]*?\bsrc=")([^"]+)(")/g, (m, a, u, b) => { const d = /^data:/.test(u) ? u : dataUrl(u.replace(/&amp;/g, "&")); if (!d) log.push(`image not loaded, dropped: ${u}`); return a + (d || "") + b; });
    html = html.replace(/style="([^"]*url\([^"]*)"/g, (m, st) => `style="${inlineCss(st.replace(/&quot;/g, '"'), snap.url).replace(/"/g, "&quot;")}"`);
    const out = { v: 1, url: snap.url, title: snap.title, w: snap.w, h: snap.h, bg: snap.bg, htmlBg: snap.htmlBg, htmlAttrs: snap.htmlAttrs, bodyAttrs: snap.bodyAttrs,
      css: cssParts.join("\n"), fonts, html, els: snap.els, log };
    fs.writeFileSync(job.out_json, JSON.stringify(out));
  }
  console.log(JSON.stringify({ ok: true, log }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e).slice(0, 800), log }));
  process.exitCode = 1;
} finally {
  await browser.close();
}
