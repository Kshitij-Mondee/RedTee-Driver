// @design higher_class_owner: an uncertain document climbs a colour ladder, then reaches its decision owner
Loom.scene("b12", {
  build(ctx) {
    const kit = ctx.kit;
    const m = ctx.m;
    const T = Loom.treat;
    const unsure = ctx.cue("Not sure?");
    const higher = ctx.cue("Treat it as the higher class,");
    const ask = ctx.cue("and ask its owner.");
    const policy = ctx.cue("Our own policy decides each case.");

    // Treatment options: a static rule card, a colour staircase, or a person-led handoff. Chosen: staircase and handoff, because the rule has two visible actions.

    // @form unsure_item: an unclassified document waiting below the classification steps
    const itemE = ctx.el("unsure_item", { x: 650, y: 505, w: 220, h: 282, kind: "instrument", exit: "recede" });
    const item = Loom.lesson.item(ctx, itemE.inner, { x: 10, y: 10, w: 200, h: 257, variant: "plain", cls: "none", label: false, tick: false });
    item.drawIn(unsure, 0.55);

    // @form qmark: the harm question hovering over the unsure document
    const qmarkE = ctx.el("qmark", { x: 690, y: 185, w: 145, h: 270, kind: "icon", exit: "recede" });
    const qmark = Loom.lesson.harm_mark(ctx, qmarkE.inner, { x: 0, y: 0, w: 145, h: 270, label: true });
    qmark.drawOn(unsure, 0.48);
    qmark.showLabel(unsure + 0.38);
    qmark.hoverFor(unsure + 0.5, higher, 5);
    qmark.fadeOut(higher, 0.3);

    // @form steps: two outlined levels showing the safer direction of classification
    const stepsE = ctx.el("steps", { x: 590, y: 410, w: 455, h: 350, kind: "scenery", exit: "recede" });
    const amberStep = kit.path(stepsE.inner, "M 0 300 H 190 V 190 H 340", { stroke: ctx.c("accent2"), sw: 4, fill: "none" });
    const magentaStep = kit.path(stepsE.inner, "M 190 190 H 340 V 80 H 440", { stroke: ctx.c("accent3"), sw: 4, fill: "none" });
    m.draw(amberStep, higher, { dur: 0.35 });
    m.draw(magentaStep, higher + 0.3, { dur: 0.4 });

    // @form go_higher: a measured rule label beside the top step
    const goHigher = T.label(ctx, "go_higher", { x: 1120, y: 350, text: "Go higher", to: [1080, 480], tone: "accent3", role: "label", t: higher + 0.45 });

    item.setClass("internal", higher, 0.22);
    m.travel(itemE, higher + 0.22, { x: 150, y: -120, scale: 1 });
    item.setClass("confidential", higher + 0.48, 0.55);
    m.emphasis(itemE, higher + 0.72);

    // @form owner: the named decision owner, large enough to receive the question
    const owner = ctx.character("Owner", "tess", { x: 1450, y: 785, scale: 0.82, skin: 1, top: "accent" });
    m.settle(owner.E, ask, { dur: 0.45 });
    owner.pose("present", ask + 0.25, { dur: 0.35 });
    owner.look(-0.7, -0.1, ask + 0.2);

    // @form owner_arrow: a connector that leads into the owner, never across the document
    const arrowE = ctx.el("owner_arrow", { x: 1015, y: 492, w: 370, h: 180, kind: "connector", exit: "recede" });
    const arrow = kit.arrow(arrowE.inner, 0, 72, 330, 112, { bend: 0.15, stroke: ctx.c("accent") });
    m.draw(arrow, ask + 0.12, { dur: 0.55, headAt: 0.85, headDur: 0.14 });
    T.label(ctx, "ask_owner", { x: 920, y: 520, text: "Ask the owner", to: [1100, 585], tone: "accent", role: "label", t: ask + 0.35 });

    // @form policy_note: a small page note, separated below the owner
    const policyE = ctx.el("policy_note", { x: 1530, y: 835, w: 260, h: 112, kind: "card", exit: "recede" });
    const policyPage = kit.rect(policyE.inner, 8, 8, 244, 94, { fill: "none", r: 12, stroke: ctx.c("line") });
    m.draw(policyPage, policy, { dur: 0.45 });
    T.label(ctx, "policy_label", { x: 1470, y: 880, text: "Our policy", to: [1570, 900], tone: "ink", role: "label", t: policy + 0.32 });
  },
});
