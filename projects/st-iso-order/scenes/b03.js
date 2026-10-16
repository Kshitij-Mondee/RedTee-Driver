// @design relay_reveal: a single signal crosses a connected landscape after the view widens
// Treatments: static wide board with signalling; separate station cuts; retained scale reveal and a road pulse.
// Choose the retained reveal: travel makes the hand-offs one continuous system.
Loom.scene("b03", {
  build(ctx) {
    const board=ctx.held('board');
    const world=board.handle, B=world.B;
    const reveal=ctx.cue("Follow the lamp");
    const relay=ctx.cue("Each station hands it");
    world.setState('day',reveal);
    world.frame('wide',reveal,{dur:ctx.style.dur('move')*4,fly:true});
    // @form relay_pulse: the subject follows the existing road and waits at each hand-off
    const signal=B.put('cylinder',{name:'pulse',x:4,y:13,z:0.08,r:0.25,h:0.08,tok:'accent',subject:true,at:relay,enter:'drop'});
    const legs=[
      [[4,13,0.08],[6.5,13,0.08],[6.5,11.3,0.08]],
      [[6.5,11.3,0.08],[12,11.3,0.08],[12,10,0.08],[14,10,0.08]],
      [[14,10,0.08],[18.3,10,0.08],[18.3,5.7,0.08],[20,5.7,0.08]],
      [[20,5.7,0.08],[22.8,5.7,0.08],[22.8,3.3,0.08],[24,3.3,0.08]]
    ];
    const travel=ctx.style.dur('move'), pause=ctx.style.dur('stagger')*1.5;
    legs.forEach(function(points,i){
      const t=relay+pause+i*(travel+pause);
      const route=B.route('relay_leg_'+i,points,{tok:'road',width:2,at:relay,dur:ctx.style.dur('stagger')});
      signal.travel(route,t,{dur:travel});
    });
    signal.exit(relay+4*(travel+pause),{kind:'sink'});
    // The board remains in day and wide for b04; the pulse has sunk before the join.
  }
});
