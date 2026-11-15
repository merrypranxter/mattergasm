import { MatterGrowth,MODES,ARRANGEMENTS } from './growth.js';
import { PALETTE_CATALOG,filteredPalettes } from './palettes.js';

// MATTERGASM · PHASE 01 · CLIENT-SIDE VISUAL INSTRUMENT
const $=id=>document.getElementById(id);
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fract=v=>v-Math.floor(v);
const deepCopy=value=>JSON.parse(JSON.stringify(value));
const canvas=$('art'),stage=$('stage'),board=$('artboard');
const ctx=canvas.getContext('2d',{alpha:false});
const tiny=document.createElement('canvas'),tinyCtx=tiny.getContext('2d',{alpha:false});
let imageData;
let lastFrame=0,lastPaint=0,accum=0,lightClock=0,paused=false,activePointer=null;
let paintNeeded=true,previous=null;
let noticeTimer=0;
const cfg={
  seed:1771601,aspect:'square',law:'rosette',arrangement:'mandala',
  seedCount:18,density:.92,speed:2,
  palette:'vault:itsamoire/pinkViolence',stopOverride:null,
  neon:64,shift:0,bg:'#080612',
  finish:'mineral',detail:72,borders:54,glow:38,stageSize:60
};
let world=new MatterGrowth(cfg);
const paletteById=new Map(PALETTE_CATALOG.map(p=>[p.id,p]));
const palettesOriginalCount=PALETTE_CATALOG.length;
let lookup=new Uint8ClampedArray(256*3),lastLookupKey='';
function rgb(hex){
  const s=/^#[0-9a-f]{6}$/i.test(hex)?hex:'#080612';
  return [parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)];
}
function hexFor(rgbValues){
  return '#'+rgbValues.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
}
function stops(){
  return cfg.stopOverride||paletteById.get(cfg.palette)?.colors||
    PALETTE_CATALOG[0]?.colors||['#ff37c7','#00eaff','#e3ff30'];
}
function paletteTable(){
  const colors=stops();
  const key=JSON.stringify([colors,cfg.neon,cfg.shift]);
  if(key===lastLookupKey)return;
  lastLookupKey=key;
  const steps=colors.map(rgb);
  const n=steps.length,extra=cfg.neon/100,shift=cfg.shift/100;
  for(let i=0;i<256;i++){
    const t=fract(i/256+shift)*n;
    const a=Math.floor(t)%n,b=(a+1)%n,f=t-Math.floor(t);
    let r=steps[a][0]+(steps[b][0]-steps[a][0])*f;
    let g=steps[a][1]+(steps[b][1]-steps[a][1])*f;
    let bl=steps[a][2]+(steps[b][2]-steps[a][2])*f;
    const l=r*.213+g*.715+bl*.072;
    const sat=1+.92*extra;
    r=clamp((r-l)*sat+l+5*extra,0,255);
    g=clamp((g-l)*sat+l+5*extra,0,255);
    bl=clamp((bl-l)*sat+l+5*extra,0,255);
    lookup[i*3]=r;lookup[i*3+1]=g;lookup[i*3+2]=bl;
  }
  paintNeeded=true;
}
function notice(message){
  $('notice').textContent=message;
  clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>{$('notice').textContent='';},5600);
}
function resizeStage(){
  document.documentElement.style.setProperty('--stage',cfg.stageSize+'svh');
  $('stage-size').value=cfg.stageSize;
  $('stage-size-v').textContent=cfg.stageSize+'%';
  board.style.aspectRatio=world.w+'/'+world.h;
  const rect=board.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const dpr=Math.min(devicePixelRatio||1,1.65);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){
    canvas.width=w;canvas.height=h;
    paintNeeded=true;
  }
  if(tiny.width!==world.w||tiny.height!==world.h){
    tiny.width=world.w;tiny.height=world.h;
    imageData=tinyCtx.createImageData(world.w,world.h);
    paintNeeded=true;
  }
}
function paint(now){
  resizeStage();paletteTable();
  if(!imageData)return;
  const bytes=imageData.data;
  const w=world.w,h=world.h;
  const own=world.owner,depth=world.depth,ink=world.ink;
  const back=rgb(cfg.bg),borderLevel=cfg.borders/100;
  const detail=cfg.detail/100,glow=cfg.glow/100;
  const phase=lightClock*.25;
  const finish=cfg.finish;
  const lightX=Math.cos(phase),lightY=Math.sin(phase);
  for(let i=0;i<world.capacity;i++){
    const p=i*4,id=own[i],x=i%w,y=(i/w)|0;
    if(!id){
      const ambient=2*Math.sin(x*.041+y*.036);
      bytes[p]=back[0]+ambient;bytes[p+1]=back[1]+ambient;
      bytes[p+2]=back[2]+ambient;bytes[p+3]=255;continue;
    }
    const z=depth[i],nuc=world.nuclei[id-1],s=ink[i]*3;
    const angle=Math.atan2((y-nuc.y)/h,(x-nuc.x)/w);
    let nx=0,ny=0,foreign=0,open=0;
    const left=x>0?i-1:i,right=x<w-1?i+1:i;
    const up=y>0?i-w:i,down=y<h-1?i+w:i;
    for(const j of [left,right,up,down]){
      if(!own[j])open++;
      else if(own[j]!==id)foreign++;
    }
    if(own[right]===id)nx+=(depth[right]-z);
    if(own[left]===id)nx-=(depth[left]-z);
    if(own[down]===id)ny+=(depth[down]-z);
    if(own[up]===id)ny-=(depth[up]-z);
    const oblique=(nx*lightX+ny*lightY)*.17;
    const band=Math.sin(z*.65+3.5*angle+nuc.phase*TAU);
    const ribs=Math.cos(z*.43-7*angle+nuc.angle);
    const glint=Math.sin(z*.12+lightClock*.75+angle*5);
    let value=.71+Math.max(-.23,Math.min(.23,oblique));
    if(finish==='enamel')value=.83+.12*Math.cos(z*.15+nuc.phase*TAU)+glint*.13;
    else if(finish==='velvet')value=.67+.10*band;
    else value+=detail*(band*.135+ribs*.095)+glint*.11;
    value+=detail*.11*Math.sin(z*.24+angle*8);
    if(open)value+=.22+.15*glow;
    if(foreign)value-=borderLevel*.38;
    value=clamp(value,.15,1.55);
    const base=finish==='enamel'?18:finish==='velvet'?2:10;
    const shimmer=finish==='velvet'?0:Math.max(0,glint)*12;
    bytes[p]=clamp(lookup[s]*value+base+shimmer,0,255);
    bytes[p+1]=clamp(lookup[s+1]*value+base+shimmer,0,255);
    bytes[p+2]=clamp(lookup[s+2]*value+base+shimmer,0,255);
    bytes[p+3]=255;
  }
  tinyCtx.putImageData(imageData,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.fillStyle=cfg.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if(glow>.02){
    ctx.save();
    ctx.globalAlpha=glow*.40;
    ctx.globalCompositeOperation='screen';
    ctx.filter='blur('+Math.round(6+glow*15)+'px) saturate(1.5)';
    ctx.drawImage(tiny,0,0,canvas.width,canvas.height);
    ctx.restore();
  }
  ctx.drawImage(tiny,0,0,canvas.width,canvas.height);
  if(!paused&&world.frontier.size){
    ctx.save();
    const sx=canvas.width/w,sy=canvas.height/h;
    ctx.fillStyle='rgba(247,255,211,.62)';
    const f=Array.from(world.frontier);
    const skip=Math.max(1,Math.ceil(f.length/380));
    for(let k=0;k<f.length;k+=skip){
      const i=f[k],x=i%w,y=(i/w)|0;
      ctx.fillRect((x+.2)*sx,(y+.2)*sy,Math.max(1,sx*.48),Math.max(1,sy*.48));
    }
    ctx.restore();
  }
  $('hud-stats').textContent=Math.round(100*world.population/world.capacity)+'% · '+world.nuclei.length+' FAMILIES';
  $('hud-mode').textContent='◉ '+MODES[world.law];
  $('generation').textContent='GEN '+String(world.generation).padStart(3,'0');
  paintNeeded=false;
}
function updateControls(){
  for(const id of ['law','arrangement','aspect','seed-count','density','speed','neon','color-shift','bg','finish','detail','borders','glow']){
    const values={
      law:cfg.law,arrangement:cfg.arrangement,aspect:cfg.aspect,
      'seed-count':cfg.seedCount,density:Math.round(cfg.density*100),
      speed:cfg.speed,neon:cfg.neon,'color-shift':cfg.shift,bg:cfg.bg,
      finish:cfg.finish,detail:cfg.detail,borders:cfg.borders,glow:cfg.glow
    };
    if($(id))$(id).value=values[id];
  }
  for(const [id,display] of [
    ['seed-count',cfg.seedCount],['density',Math.round(cfg.density*100)+'%'],
    ['speed',cfg.speed+'×'],['neon',cfg.neon+'%'],
    ['detail',cfg.detail+'%'],['borders',cfg.borders+'%'],['glow',cfg.glow+'%']
  ])$(id+'-v').textContent=display;
  $('pause').textContent=paused?'▶ PLAY':'Ⅱ PAUSE';
  $('undo').disabled=!previous;
  showPalettes();
  resizeStage();
}
function showPalettes(){
  const list=filteredPalettes($('palette-search').value);
  const active=paletteById.get(cfg.palette);
  const choices=list.some(p=>p.id===cfg.palette)?list:[active,...list].filter(Boolean);
  const picker=$('palette'),fragment=document.createDocumentFragment();
  for(const p of choices){
    const opt=document.createElement('option');
    opt.value=p.id;opt.textContent=p.name+' · '+p.source;
    fragment.appendChild(opt);
  }
  picker.replaceChildren(fragment);
  picker.value=cfg.palette;
  $('palette-count').textContent=palettesOriginalCount+' PALETTES';
  $('swatches').replaceChildren(...stops().map(color=>{
    const span=document.createElement('span');span.className='swatch';
    span.style.background=color;span.title=color;return span;
  }));
  $('palette-label').textContent=(active?.name||'Custom')+' · '+(active?.source||'MATTERGASM')+
    (cfg.stopOverride?' · SHUFFLED STOPS':' · SOURCE STOPS');
}
function remember(){
  previous={cfg:deepCopy(cfg),world:world.snapshot(),paused};
  $('undo').disabled=false;
}
function buildNew(seed,mode='new'){
  world=new MatterGrowth({...cfg,seed});
  cfg.seed=world.seed;
  accum=0;lightClock=0;paused=false;
  updateControls();
  paintNeeded=true;
  notice(mode==='surprise'?'A brand new mathematical mutation. Every control is yours to tweak.':'New universe planted. Tap to add your own crystal families.');
}
function chooseAny(items){return items[Math.floor(Math.random()*items.length)];}
function random32(){return (Math.floor(Math.random()*4294967295)>>>0)||1;}
$('surprise').addEventListener('click',()=>{
  remember();
  cfg.aspect=Math.random()<.48?'portrait':'square';
  cfg.law=chooseAny(Object.keys(MODES));
  cfg.arrangement=chooseAny(Object.keys(ARRANGEMENTS));
  cfg.seedCount=7+Math.floor(Math.random()*43);
  cfg.density=.66+Math.random()*.33;
  cfg.speed=1+Math.round(Math.random()*9)/4;
  cfg.palette=chooseAny(PALETTE_CATALOG).id;
  cfg.stopOverride=null;
  cfg.neon=30+Math.floor(Math.random()*71);
  cfg.shift=Math.floor(Math.random()*101);
  cfg.bg=chooseAny(['#04000b','#0c0a27','#12061d','#081a2b','#030f19','#23061c','#050b0a']);
  cfg.finish=chooseAny(['mineral','enamel','velvet']);
  cfg.detail=35+Math.floor(Math.random()*66);
  cfg.borders=25+Math.floor(Math.random()*76);
  cfg.glow=18+Math.floor(Math.random()*69);
  buildNew(random32(),'surprise');
});
$('new-design').addEventListener('click',()=>{
  if(!confirm('Create a NEW living design? Your current world will be replaced. Save the world first if you want to keep it.'))return;
  remember();buildNew(random32());
});
$('undo').addEventListener('click',()=>{
  if(!previous)return;
  const old=previous;
  const backup={cfg:deepCopy(cfg),world:world.snapshot(),paused};
  try{
    const restored=MatterGrowth.restore(old.world);
    Object.assign(cfg,deepCopy(old.cfg));
    world=restored;paused=old.paused;
    previous=backup;
    updateControls();paintNeeded=true;
    notice('Previous design restored. You can undo again to toggle.');
  }catch(e){notice('Could not restore: '+e.message);}
});
$('pause').addEventListener('click',()=>{paused=!paused;updateControls();notice(paused?'Growth paused; light continues to shimmer.':'Growth resumed.');});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
  for(const button of document.querySelectorAll('.tab')){
    const selected=button===b;
    button.setAttribute('aria-selected',String(selected));
  }
  document.querySelectorAll('[data-panel]').forEach(p=>{p.hidden=p.dataset.panel!==b.dataset.tab;});
}));
$('stage-size').addEventListener('input',e=>{
  cfg.stageSize=+e.target.value;
  resizeStage();paintNeeded=true;
});
$('law').addEventListener('change',e=>{
  cfg.law=e.target.value;world.setLaw(cfg.law);
  notice('New growth law active for FUTURE mineral births. Existing families remain untouched.');
  paintNeeded=true;
});
$('arrangement').addEventListener('change',e=>{cfg.arrangement=e.target.value;notice('Seed arrangement saved for the next NEW design.');});
$('aspect').addEventListener('change',e=>{
  const requested=e.target.value;
  if(requested===cfg.aspect)return;
  if(!confirm('Switching canvas architecture rebuilds the living simulation at the new native aspect ratio. Save this design before switching if you want to keep it. Continue?')){
    e.target.value=cfg.aspect;return;
  }
  remember();cfg.aspect=requested;buildNew(random32());
});
$('seed-count').addEventListener('input',e=>{
  cfg.seedCount=+e.target.value;$('seed-count-v').textContent=cfg.seedCount;
});
$('density').addEventListener('input',e=>{
  cfg.density=+e.target.value/100;
  world.setDensity(cfg.density);$('density-v').textContent=e.target.value+'%';
});
$('speed').addEventListener('input',e=>{cfg.speed=+e.target.value;$('speed-v').textContent=cfg.speed+'×';});
$('palette-search').addEventListener('input',showPalettes);
$('palette').addEventListener('change',e=>{
  cfg.palette=e.target.value;cfg.stopOverride=null;lastLookupKey='';
  showPalettes();paintNeeded=true;
});
$('random-palette').addEventListener('click',()=>{
  cfg.palette=chooseAny(PALETTE_CATALOG).id;cfg.stopOverride=null;
  lastLookupKey='';showPalettes();paintNeeded=true;
});
$('shuffle-stops').addEventListener('click',()=>{
  const arr=[...stops()];
  for(let i=arr.length-1;i>0;i--){
    const k=Math.floor(Math.random()*(i+1));[arr[i],arr[k]]=[arr[k],arr[i]];
  }
  cfg.stopOverride=arr;lastLookupKey='';
  showPalettes();paintNeeded=true;
});
for(const [id,key] of [['neon','neon'],['color-shift','shift'],['detail','detail'],['borders','borders'],['glow','glow']]){
  $(id).addEventListener('input',e=>{
    cfg[key]=+e.target.value;
    if($(id+'-v'))$(id+'-v').textContent=e.target.value+'%';
    if(key==='neon'||key==='shift')lastLookupKey='';
    paintNeeded=true;
  });
}
$('bg').addEventListener('input',e=>{cfg.bg=e.target.value;paintNeeded=true;});
$('finish').addEventListener('change',e=>{cfg.finish=e.target.value;paintNeeded=true;});
let lastPlant={x:-1,y:-1};
const activeTouches=new Set();
function plant(e,force=false){
  if(activeTouches.size>1)return;
  const rect=canvas.getBoundingClientRect();
  const u=clamp((e.clientX-rect.left)/rect.width,0,.9999);
  const v=clamp((e.clientY-rect.top)/rect.height,0,.9999);
  if(!force&&Math.hypot(u-lastPlant.x,v-lastPlant.y)<.060)return;
  lastPlant={x:u,y:v};
  if(world.addSeed(u,v)){
    world.frontier.add(world.nuclei.at(-1).x+world.nuclei.at(-1).y*world.w);
    paintNeeded=true;
    notice('New family planted. It will grow according to the active mathematical law.');
  }else notice('No open ground nearby or 96-family limit reached. Try a new seed.');
}
canvas.addEventListener('pointerdown',e=>{
  if(e.button!==0&&e.pointerType==='mouse')return;
  activeTouches.add(e.pointerId);
  if(activeTouches.size===1){
    activePointer=e.pointerId;lastPlant={x:-1,y:-1};
    canvas.setPointerCapture(e.pointerId);
    plant(e,true);
  }else activePointer=null;
  e.preventDefault();
});
canvas.addEventListener('pointermove',e=>{
  if(activePointer!==e.pointerId||!activeTouches.has(e.pointerId))return;
  plant(e,false);e.preventDefault();
});
const finishPointer=e=>{
  activeTouches.delete(e.pointerId);
  if(activePointer===e.pointerId)activePointer=null;
  if(!activeTouches.size)lastPlant={x:-1,y:-1};
};
for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,finishPointer);
window.addEventListener('blur',()=>{activeTouches.clear();activePointer=null;});
function download(name,blob){
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),20000);
}
$('save-png').addEventListener('click',()=>{
  paint(performance.now());
  canvas.toBlob(blob=>{
    if(!blob){notice('PNG failed; try again.');return;}
    download('mattergasm-'+world.seed+'-'+cfg.aspect+'.png',blob);
    notice('PNG saved at current device canvas resolution. High-resolution export arrives in Phase 06.');
  },'image/png');
});
$('save-world').addEventListener('click',()=>{
  const data={format:'mattergasm/project-v1',config:cfg,world:world.snapshot()};
  download('mattergasm-world-'+world.seed+'.json',new Blob([JSON.stringify(data)],{type:'application/json'}));
  notice('Complete living world saved with exact growth history and editable appearance.');
});
$('load-world').addEventListener('click',()=>$('world-file').click());
$('world-file').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
    if(f.size>6500000)throw Error('World file too large');
    const data=JSON.parse(await f.text());
    if(data.format!=='mattergasm/project-v1'||!data.config)throw Error('Unknown file format');
    const restored=MatterGrowth.restore(data.world);
    const selection=paletteById.has(data.config.palette)?data.config.palette:null;
    if(!selection)throw Error('Saved palette ID is not available');
    remember();
    for(const k of Object.keys(cfg))if(Object.hasOwn(data.config,k))cfg[k]=data.config[k];
    cfg.aspect=restored.aspect;cfg.law=restored.law;cfg.density=restored.limit;
    cfg.seed=restored.seed;cfg.arrangement=restored.arrangement;
    cfg.stopOverride=Array.isArray(cfg.stopOverride)&&cfg.stopOverride.length>=2&&
      cfg.stopOverride.length<=12&&cfg.stopOverride.every(s=>/^#[0-9a-f]{6}$/i.test(s))?
      cfg.stopOverride:null;
    world=restored;paused=true;accum=0;lastLookupKey='';
    updateControls();paintNeeded=true;
    notice('World restored intact. Press PLAY to continue its growth.');
  }catch(error){notice('World import rejected: '+error.message);}
  finally{e.target.value='';}
});
function tick(now){
  const dt=lastFrame?Math.min(100,now-lastFrame):0;
  lastFrame=now;
  lightClock+=dt/1000;
  if(!paused&&cfg.speed>0&&world.frontier.size){
    accum+=dt/1000*cfg.speed*8;
    let n=0;
    while(accum>=1&&n<5){
      world.step();
      accum-=1;n++;paintNeeded=true;
    }
    if(n>=5)accum=0;
  }
  if(paintNeeded||now-lastPaint>80){
    paint(now);lastPaint=now;
  }
  requestAnimationFrame(tick);
}
if(!ctx){notice('2D canvas is unavailable in this browser.');}
else{
  if(palettesOriginalCount!==199)
    notice('Palette integrity warning: expected 199 source records, got '+palettesOriginalCount);
  updateControls();resizeStage();requestAnimationFrame(tick);
}
new ResizeObserver(()=>{resizeStage();paintNeeded=true;}).observe(board);
window.addEventListener('resize',()=>{resizeStage();paintNeeded=true;});
