// @design reused_card_opens_work_door: the same amber card turns Work's lock and one hard crack of light makes the consequence visible
/* Treatments: 1) static open door. 2) lock turns and opens. 3) a bright interior. Chosen: one controlled crack, because the turn is the consequence. */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const tReason = ctx.cue("It worked for one reason.");
    const tReuse = ctx.cue("The password was reused.");
    const wall = ctx.held("door_wall");
    const work = ctx.held("door_work");
    const card = ctx.held("keycard");
    const stream = ctx.held("card_stream");
    const workDoor = work.handle;
    const cardPart = card.handle;
    // @form reused_tag: danger label leads from the card to the cause
    const tag = ctx.el("reused_tag", { x: 180, y: 280, w: 270, h: 80, kind: "text", exit: "wipe" });
    kit.rect(tag.inner, 0, 0, 200, 76, { fill: "neg", r: 6 });
    kit.text(tag.inner, "reused", { role: "body", x: 18, y: 16, w: 165, h: 52, maxLines: 1, color: "onAccent" });
    kit.line(tag.inner, 200, 38, 510, 205, { stroke: "neg", sw: 3 });
    m.travel(card, tReason, { x: 400, y: 15, scale: 0.72 });
    workDoor.setState("turning", tReason + 0.45);
    cardPart.setState("lit", tReason);
    workDoor.setState("cracked", tReuse + 0.2);
    m.unmask(tag, tReuse + 0.35);
  },
});
