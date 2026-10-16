// @design sequential_operation: three retained rows signal an ordered calculation before a length begins
// Treatments: static signalling; travelling operand; separate equation cards. Choose a travelling operand in the existing instrument, preserving the world and the calculation order.
Loom.scene("b12", {
  build(ctx) {
    const arrival = ctx.cue("takes the arrival time");
    const sending = ctx.cue("subtracts the sending time");
    const product = ctx.cue("multiplies by the speed of light");
    const enter = ctx.style.dur("enter"), move = ctx.style.dur("move"), exit = ctx.style.dur("exit");
    const ground = ctx.held("ground"), point = ctx.held("phone_pt"), sats = ctx.held("sats");
    const readout = ctx.held("readout"), timer = ctx.held("timer");
    const link = ctx.held("readout_link"), chip = ctx.held("stamp_chip");
    const phone = readout.handle;
    // @form retained_rows: continuity owner for the existing kit rows, not a second drawing
    const rows = ctx.el("rows", {x:1318,y:624,w:464,h:132,kind:"instrument",exit:"recede"});
    rows.handle = phone;
    ctx.kit.fit("arrival time",{role:"label",w:380,h:40,maxLines:1});
    ctx.kit.fit("sending time",{role:"label",w:380,h:40,maxLines:1});
    ctx.kit.fit("x speed of light",{role:"label",w:380,h:40,maxLines:1});
    phone.rows.forEach(function(row){
      [row.t1,row.t2].forEach(function(txt){txt.setAttribute("font-family","sans-serif");txt.setAttribute("font-size","30");});
    });
    phone.rows[2].t1.textContent = "x speed of light";
    phone.rows[2].t2.textContent = "x speed of light";
    function showRow(i,t) {
      Loom.drive(function(e){phone.rows[i].g.setAttribute("opacity",e);},t,enter,"enter");
      phone.setState("readout_rows",t,{row:i,dur:move});
    }
    showRow(0,arrival);
    phone.lightRow(0,sending,false);
    showRow(1,sending);
    // @form operand_into_row: the received stamp moves into the sending-time row without crossing its label
    Loom.drive(function(e){
      chip.inner.setAttribute("transform","translate("+(170*e)+" "+(-23*e)+") scale("+(1-0.25*e)+")");
    },sending,move,"move");
    phone.lightRow(1,product,false);
    showRow(2,product);
    // @form emerging_length: a thin unheaded line grows from the instrument towards the established source
    const line = ctx.el("product_line",{x:430,y:230,w:872,h:350,kind:"connector",exit:"recede"});
    const path = ctx.kit.path(line.inner,"M870 348 L0 0",{stroke:"line",sw:3,fill:"none"});
    ctx.m.draw(path,product,{dur:ctx.style.dur("draw")});
    const retire = ctx.speechEnd - exit;
    ctx.m.exit(timer,retire,"recede");
    ctx.m.exit(link,retire,"recede");
    ctx.m.exit(chip,retire,"recede");
    ctx.m.exit(rows,retire,"recede");
    ctx.m.exit(readout,retire,"recede");
    ctx.m.exit(line,retire,"recede");
  }
});
