// @design backup_triplet: one document becomes three separate copies, and two remain after one is struck
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: static row with count badge, sequential document travel, or a failure test with refill. Chosen: sequential travel then failure test, because copying and survival are the argument.
    const tStart = ctx.cue("Start with three");
    const tBackups = ctx.cue("plus two backups");
    const tFailure = ctx.cue("One failure");
    const tZero = ctx.cue("leaves you with zero");

    // These are the continuing board objects from b04. They are never redrawn here.
    const laptop = ctx.held("laptop");
    const main = ctx.held("report_main");
    const rail = ctx.held("rail");
    laptop.handle.setState("on", tStart);
    main.handle.setState("whole", tStart);

    // The two backups start over the laptop file, then physically separate into a readable row to its right.
    // @form copy_a: first small report file travelling from the laptop to its backup position
    const copyA = ctx.el("copy_a", { x: 590, y: 340, w: 143, h: 190, kind: "document", exit: "none" });
    const copyAHandle = Loom.lesson.report_file(ctx, copyA.inner, { size: 190, state: "whole" });
    // @form copy_b: second small report file travelling from the laptop to the end of the backup row
    const copyB = ctx.el("copy_b", { x: 590, y: 340, w: 143, h: 190, kind: "document", exit: "none" });
    const copyBHandle = Loom.lesson.report_file(ctx, copyB.inner, { size: 190, state: "whole" });

    m.reveal(copyA, tStart + 0.12, { dy: 0 });
    m.travel(copyA, tStart + 0.28, { x: 420, y: 120, dur: 0.82 });
    m.reveal(copyB, tBackups + 0.08, { dy: 0 });
    m.travel(copyB, tBackups + 0.18, { x: 660, y: 120, dur: 0.82 });

    // @form mark_struck: small red failure cross over the original laptop report
    const struck = ctx.el("mark_struck", { x: 680, y: 358, w: 72, h: 72, kind: "mark", exit: "recede" });
    kit.mark(struck.inner, "no", 36, 36, 64);
    main.handle.setState("empty", tFailure, { dur: ctx.style.dur("move") });
    m.pop(struck, tFailure + 0.1);

    // The count is named only after the failure has shown why it matters.
    rail.handle.setState(0, "named", tZero, { dur: ctx.style.dur("move") });
    rail.handle.showLabel(0, tZero + 0.08);

    // A ghost of the surviving first backup refills the original, leaving three whole reports for b06.
    // @form refill_ghost: a temporary document that travels back from the first backup to the laptop
    const refill = ctx.el("refill_ghost", { x: 1010, y: 570, w: 102, h: 136, kind: "document", exit: "recede" });
    Loom.lesson.report_file(ctx, refill.inner, { size: 136, state: "whole" });
    m.reveal(refill, tZero + 0.2, { dy: 0, dur: 0.18 });
    m.travel(refill, tZero + 0.3, { x: -416, y: -224, dur: 0.58 });
    m.exit(refill, tZero + 0.92, "recede");
    main.handle.setState("restored", tZero + 0.88, { dur: ctx.style.dur("move") });
  },
});
