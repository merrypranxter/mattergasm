// MATTERGASM · PHASE 01 · REAL LIVING MINERAL GROWTH
// Pure seeded CPU simulation; no DOM, APIs, shader or hosting dependency.
// Occupancy, genealogy, deposition bands and growth generations persist.
export const MODES = Object.freeze({
  rosette: 'POLARIZED ROSETTES',
  dendrite: 'ELECTRIC DENDRITES',
  strata: 'LIVING AGATE STRATA'
});
export const ARRANGEMENTS = Object.freeze({
  mandala: 'GOLDEN ORBIT',
  scattered: 'CHAOTIC COLONIES',
  ribbons: 'RIBBON SOURCES',
  lattice: 'CRYSTAL ARRAY'
});
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const fract=x=>x-Math.floor(x);
const offsets=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
function hash32(v){
  v=v>>>0;v=Math.imul(v^(v>>>16),0x7feb352d);
  v=Math.imul(v^(v>>>15),0x846ca68b);
  return (v^(v>>>16))>>>0;
}
export class MatterGrowth {
  constructor(options={}){
    this.init(options);
  }
  init(options={}){
    this.seed=((Number(options.seed)>>>0)||1);
    this.state=this.seed;
    this.aspect=options.aspect==='portrait'?'portrait':'square';
    this.w=this.aspect==='portrait'?144:192;
    this.h=this.aspect==='portrait'?256:192;
    this.capacity=this.w*this.h;
    this.law=MODES[options.law]?options.law:'rosette';
    this.arrangement=ARRANGEMENTS[options.arrangement]?options.arrangement:'mandala';
    this.limit=clamp(Number(options.density)||.92,.20,.99);
    this.count=clamp(Math.round(Number(options.seedCount)||18),1,70);
    this.owner=new Uint16Array(this.capacity);
    this.depth=new Uint16Array(this.capacity);
    this.born=new Uint16Array(this.capacity);
    this.ink=new Uint8Array(this.capacity);
    this.frontier=new Set();
    this.nuclei=[];
    this.generation=0;
    this.population=0;
    this.stall=0;
    this.bootstrap();
    return this;
  }
  random(){
    let v=this.state>>>0;
    v^=v<<13;v^=v>>>17;v^=v<<5;
    this.state=v>>>0;
    return this.state/4294967296;
  }
  neighbors(i,visit){
    const x=i%this.w,y=(i/this.w)|0;
    for(const [dx,dy] of offsets){
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=this.w||yy>=this.h)continue;
      visit(xx+yy*this.w,dx,dy);
    }
  }
  addSeed(u,v){
    if(this.nuclei.length>=96)return false;
    let x=clamp(Math.floor(u*this.w),0,this.w-1);
    let y=clamp(Math.floor(v*this.h),0,this.h-1);
    let i=x+y*this.w;
    if(this.owner[i]){
      let found=-1;
      for(let r=1;r<=8&&found<0;r++){
        for(let k=0;k<24;k++){
          const a=TAU*k/24,xx=x+Math.round(r*Math.cos(a)),yy=y+Math.round(r*Math.sin(a));
          if(xx>=0&&yy>=0&&xx<this.w&&yy<this.h&&!this.owner[xx+yy*this.w]){
            found=xx+yy*this.w;break;
          }
        }
      }
      if(found<0)return false;
      i=found;x=i%this.w;y=(i/this.w)|0;
    }
    const id=this.nuclei.length+1;
    const phase=this.random(),angle=this.random()*TAU;
    this.nuclei.push({id,x,y,phase,angle});
    this.owner[i]=id;
    this.depth[i]=0;
    this.born[i]=this.generation;
    this.ink[i]=Math.floor(phase*255);
    this.frontier.add(i);
    this.population++;
    this.stall=0;
    return true;
  }
  bootstrap(){
    const n=this.count;
    const cols=Math.max(1,Math.ceil(Math.sqrt(n)));
    const rows=Math.max(1,Math.ceil(n/cols));
    for(let k=0;k<n;k++){
      let u,v;
      if(this.arrangement==='mandala'){
        const t=(k+.65)/n;
        const a=k*2.399963229728653+.37;
        const r=.43*Math.sqrt(t);
        u=.5+r*Math.cos(a);
        v=.5+r*Math.sin(a);
      }else if(this.arrangement==='ribbons'){
        u=.06+.88*(k+.5)/n;
        v=.5+.28*Math.sin(TAU*2*u)+.08*(this.random()-.5);
      }else if(this.arrangement==='lattice'){
        const col=k%cols,row=Math.floor(k/cols);
        u=.06+.88*(col+.5+.20*(row%2))/cols;
        v=.06+.88*(row+.5)/rows;
      }else{
        u=.035+.93*this.random();v=.035+.93*this.random();
      }
      this.addSeed(clamp(u,0,.999),clamp(v,0,.999));
    }
    // A living composition should already be visible on the first frame.
    for(let j=0;j<9;j++)this.step();
  }
  setLaw(law){if(MODES[law])this.law=law;}
  setDensity(density){this.limit=clamp(Number(density)||this.limit,.20,.99);}
  score(parent,edge,dx,dy){
    const nuc=this.nuclei[this.owner[parent]-1];
    const x=edge%this.w,y=(edge/this.w)|0;
    const ux=(x-nuc.x)/this.w,uy=(y-nuc.y)/this.h;
    const radial=Math.hypot(ux,uy);
    const theta=Math.atan2(uy,ux);
    const a=theta-nuc.angle;
    const n=this.depth[parent];
    let p=0;
    if(this.law==='rosette'){
      const lobes=.5+.5*Math.cos(9*a-7*radial+.17*Math.sin(n*.2));
      const facets=.5+.5*Math.cos(6*a+n*.1);
      p=.26+.52*lobes+.14*facets;
    }else if(this.law==='dendrite'){
      const arms=.5+.5*Math.cos(7*a+radial*11+Math.sin(n*.26));
      const stream=.5+.5*Math.cos(theta*3+radial*24+n*.015);
      p=.075+.78*Math.pow(arms,2.2)+.13*stream;
      // A deterministic mineral-resistance substrate holds negative space.
      const barrier=Math.sin((x/this.w)*27+2.5*Math.sin(y/this.h*15))*
        Math.cos((y/this.h)*26-9*x/this.w);
      if(barrier<-.43)return 0;
    }else{
      const tilt=nuc.angle*.16+.5;
      const e=(x/this.w)*Math.cos(tilt)+(y/this.h)*Math.sin(tilt);
      const ribbon=Math.cos(TAU*(4*e+.15*Math.sin(7*uy)+.09*Math.cos(9*ux)));
      const layer=.5+.5*Math.sin(n*.26+nuc.phase*TAU);
      p=.31+.35*(.5+.5*ribbon)+.18*layer;
    }
    // Only pre-existing occupied sites participate in a generation.
    let crowd=0;
    this.neighbors(edge,j=>{if(this.owner[j])crowd++;});
    if(this.law==='dendrite'&&crowd>=4)p*=.22;
    else if(crowd>=6)p*=.5;
    const forward=(dx*Math.cos(nuc.angle)+dy*Math.sin(nuc.angle))/Math.SQRT2;
    if(this.law==='dendrite')p*=.82+.18*forward;
    return clamp(p,.005,.98);
  }
  step(){
    if(this.population/this.capacity>=this.limit||!this.frontier.size)return false;
    const proposals=new Map();
    for(const parent of this.frontier){
      this.neighbors(parent,(i,dx,dy)=>{
        if(this.owner[i])return;
        const p=this.score(parent,i,dx,dy);
        if(p<=0)return;
        const strength=p*(.75+.5*this.random());
        const existing=proposals.get(i);
        if(!existing||strength>existing.strength)
          proposals.set(i,{family:this.owner[parent],depth:this.depth[parent]+1,p,strength});
      });
      if(proposals.size>14000)break;
    }
    let births=0;
    const next=new Set(this.frontier);
    // Read proposals from the previous generation, then accept births.
    for(const [i,p] of proposals){
      if(this.population+births>=this.capacity*this.limit||births>=1400)break;
      if(this.random()>p.p)continue;
      const nuc=this.nuclei[p.family-1];
      const x=i%this.w,y=(i/this.w)|0;
      const angle=Math.atan2((y-nuc.y)/this.h,(x-nuc.x)/this.w);
      const micro=(hash32(i^Math.imul(p.family,0x9e3779b1))&255)/255;
      const band=this.law==='strata'?.055:this.law==='dendrite'?.039:.069;
      const phase=fract(nuc.phase*.63+p.depth*band+
        .13*Math.sin(p.depth*.21+angle*3)+.06*micro);
      this.owner[i]=p.family;
      this.depth[i]=Math.min(65535,p.depth);
      this.born[i]=Math.min(65535,this.generation+1);
      this.ink[i]=Math.round(phase*255);
      next.add(i);
      births++;
    }
    this.population+=births;
    const active=new Set();
    for(const i of next){
      let free=false;
      this.neighbors(i,j=>{if(!this.owner[j])free=true;});
      if(free)active.add(i);
    }
    this.frontier=active;
    this.generation++;
    this.stall=births?0:this.stall+1;
    if(this.stall>18)this.frontier.clear();
    return births>0;
  }
  snapshot(){
    return {
      schema:'mattergasm/world-v1',
      seed:this.seed,state:this.state,aspect:this.aspect,
      law:this.law,arrangement:this.arrangement,limit:this.limit,count:this.count,
      generation:this.generation,population:this.population,stall:this.stall,
      nuclei:this.nuclei.map(x=>({...x})),
      frontier:Array.from(this.frontier),
      owner:Array.from(this.owner),depth:Array.from(this.depth),
      born:Array.from(this.born),ink:Array.from(this.ink)
    };
  }
  static restore(data){
    if(!data||data.schema!=='mattergasm/world-v1')throw Error('Invalid Mattergasm world');
    if(!['square','portrait'].includes(data.aspect))throw Error('Invalid aspect');
    const w=data.aspect==='portrait'?144:192,h=data.aspect==='portrait'?256:192;
    const n=w*h;
    for(const [k,max] of [['owner',96],['depth',65535],['born',65535],['ink',255]]){
      if(!Array.isArray(data[k])||data[k].length!==n||
        !data[k].every(v=>Number.isInteger(v)&&v>=0&&v<=max))
        throw Error('Invalid '+k+' world array');
    }
    if(!Array.isArray(data.nuclei)||data.nuclei.length>96||
      !Array.isArray(data.frontier)||data.frontier.some(i=>!Number.isInteger(i)||i<0||i>=n))
      throw Error('Invalid growth ancestry');
    const obj=Object.create(MatterGrowth.prototype);
    obj.seed=(data.seed>>>0)||1;obj.state=(data.state>>>0)||1;
    obj.aspect=data.aspect;obj.w=w;obj.h=h;obj.capacity=n;
    obj.law=MODES[data.law]?data.law:'rosette';
    obj.arrangement=ARRANGEMENTS[data.arrangement]?data.arrangement:'mandala';
    obj.limit=clamp(Number(data.limit)||.92,.2,.99);
    obj.count=clamp(Number(data.count)||18,1,70);
    obj.generation=clamp(Number(data.generation)||0,0,65535);
    obj.population=data.owner.reduce((a,b)=>a+(b!==0),0);
    obj.stall=clamp(Number(data.stall)||0,0,10000);
    obj.nuclei=data.nuclei.map((s,i)=>{
      if(s.id!==i+1||!Number.isInteger(s.x)||!Number.isInteger(s.y)||
         s.x<0||s.x>=w||s.y<0||s.y>=h||
         !Number.isFinite(s.phase)||!Number.isFinite(s.angle))
        throw Error('Invalid nucleus');
      return {id:s.id,x:s.x,y:s.y,phase:s.phase,angle:s.angle};
    });
    if(data.owner.some(id=>id>obj.nuclei.length))
      throw Error('Orphaned mineral family');
    obj.owner=Uint16Array.from(data.owner);
    obj.depth=Uint16Array.from(data.depth);
    obj.born=Uint16Array.from(data.born);
    obj.ink=Uint8Array.from(data.ink);
    obj.frontier=new Set(data.frontier);
    return obj;
  }
}
