import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MatterGrowth, MODES, ARRANGEMENTS } from '../src/growth.js';
import { PALETTE_CATALOG } from '../src/palettes.js';

test('the entire source-authored 199-palette vault is available',()=>{
  assert.equal(PALETTE_CATALOG.length,199);
  assert.equal(new Set(PALETTE_CATALOG.map(p=>p.id)).size,199);
  for(const p of PALETTE_CATALOG){
    assert.ok(p.colors.length>=2&&p.colors.length<=12,p.name);
    for(const stop of p.colors)assert.match(stop,/^#[0-9a-f]{6}$/i);
  }
});
test('the new native portrait domain is not a stretched square',()=>{
  const portrait=new MatterGrowth({aspect:'portrait',seed:17});
  const square=new MatterGrowth({aspect:'square',seed:17});
  assert.deepEqual([portrait.w,portrait.h],[144,256]);
  assert.deepEqual([square.w,square.h],[192,192]);
  assert.equal(portrait.owner.length,144*256);
});
test('three true growth species have differing occupancy histories',()=>{
  function signature(law){
    const w=new MatterGrowth({seed:3921,law,seedCount:19,density:.88});
    for(let i=0;i<42;i++)w.step();
    return Array.from(w.owner).reduce((a,v,i)=>a+Math.imul(v,i+1),0);
  }
  const signatures=Object.keys(MODES).map(signature);
  assert.equal(new Set(signatures).size,3,JSON.stringify(signatures));
});
test('same seed and parameters reproduce the exact living world',()=>{
  const opts={seed:123456,law:'dendrite',arrangement:'ribbons',aspect:'portrait',seedCount:25};
  const a=new MatterGrowth(opts),b=new MatterGrowth(opts);
  for(let i=0;i<25;i++){a.step();b.step();}
  assert.deepEqual(a.snapshot(),b.snapshot());
});
test('full history can be restored and evolved identically',()=>{
  const a=new MatterGrowth({seed:33,law:'strata',aspect:'portrait',seedCount:28});
  for(let i=0;i<25;i++)a.step();
  const b=MatterGrowth.restore(a.snapshot());
  for(let i=0;i<15;i++){a.step();b.step();}
  assert.deepEqual(b.snapshot(),a.snapshot());
});
test('touch seeding creates an actual new founder',()=>{
  const w=new MatterGrowth({seed:14,law:'rosette'});
  const old=w.nuclei.length;
  assert.equal(w.addSeed(.97,.03),true);
  assert.equal(w.nuclei.length,old+1);
  assert.ok(w.owner.some(id=>id===old+1));
});
test('malformed checkpoints are rejected before they replace artwork',()=>{
  const w=new MatterGrowth({seed:7});
  const bad=w.snapshot();
  bad.owner[0]=999;
  assert.throws(()=>MatterGrowth.restore(bad),/Invalid owner|Orphaned/);
});
test('source markup wires visible phase-one actions',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['art','surprise','new-design','pause','undo','aspect','law','palette',
    'save-png','save-world','load-world','stage-size'])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/type="module" src="\.\/src\/main\.js"/);
  assert.ok(Object.keys(ARRANGEMENTS).length>=4);
});
