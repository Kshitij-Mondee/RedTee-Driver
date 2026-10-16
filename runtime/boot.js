/* Loom boot: manifest -> one paused timeline registered for HyperFrames. */
(function () {
  "use strict";
  const Loom = window.Loom;
  Loom.boot = async function (manifest) {
    const t0 = Date.now(); // diagnostics only; never used for frame state
    Loom.manifest = manifest;
    if (Loom.grid) Loom.grid.install(manifest);   // the timing grid (D-173)
    Loom.assets = manifest.assets || { icons: {}, peeps: {} };
    if (Loom.rigImported) Loom.rigImported.install();   // imported rigs need the embedded data (D-93)
    Loom.style.install(manifest.style, manifest.fontBase || "fonts");
    await Loom.style.ready();
    // lazy: false. GSAP defers a tween's first render until its ticker has ticked once, so whether a rAF came before
    // this build decided what the build measured: a rig's start pose was drawn or not, and the figure check warned
    // or not, on the same page (L-289). Every first render is now written as the build makes it.
    Loom.tl = gsap.timeline({ paused: true, defaults: { lazy: false } });
    const root = document.getElementById("lm-root");
    Loom.world.buildStage(root);
    Loom.world.buildAmbient(manifest.duration);
    Loom.world.addStations(manifest.world.stations);
    if (Loom.layout) Loom.layout.init(manifest);   // the layout guard's plan (D-169); empty: nothing moves
    manifest.scenes.forEach((def, i) => Loom.world.buildScene(def, manifest, i));
    Loom.world.planJoins(manifest);
    Loom.world.planVisibility();
    // a style engine audits what the scenes built with it (the whiteboard engine: the board's lettering, D-179)
    { const EN = Loom.engines && Loom.engines.current(); if (EN && EN.api.audit) EN.api.audit(manifest); }
    Loom.captions.build(manifest);
    Loom.brandLayer.build(manifest);
    Loom.chrome.build(manifest);
    // ending: settle to the bare field in the last 0.8 s
    Loom.tween(Loom.world.cam, { opacity: 1 }, { opacity: 0, duration: 0.7, ease: Loom.ease.exit }, manifest.duration - 0.8, { kind: "outro" });
    Loom.world.installClock(manifest.duration);
    // every scale and rotation takes its origin at its own start, the same way whatever is seeked first (L-289);
    // after the clocks (an element outside its life is not drawn) and before the shader layers (no GL draws here)
    Loom.settleOrigins(Loom.tl);
    // and every later seek arrives moving forward, as a fresh page's does (L-290, L-302)
    Loom.forwardOnly(Loom.tl);
    // the shader layer draws AFTER the camera clock each frame, so it reads this frame's camera (D-52)
    if (Loom.fx) Loom.fx.install(manifest);
    Loom.tl.set({}, {}, manifest.duration);
    window.__timelines = window.__timelines || {};
    window.__timelines["main"] = Loom.tl;
    Loom.report.build_ms = Date.now() - t0;
    Loom.report.ready = true;
    Loom.report.duration = manifest.duration;
    window.__loom_ready = true;
  };
})();
