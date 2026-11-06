const distance=(a,b)=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);

// A compact histogram bounds work; bucket means keep the actual sampled RGB values.
export function extractPalette(rgba,count=5){
  if(!Number.isInteger(count)||count<1||count>10)throw new Error('Invalid color count (1–10)');
  if(!rgba?.length||rgba.length%4)throw new Error('Invalid RGBA pixels');
  const buckets=new Map();
  for(let i=0;i<rgba.length;i+=4){
    if(rgba[i+3]<128)continue;
    const key=(rgba[i]>>3)*1024+(rgba[i+1]>>3)*32+(rgba[i+2]>>3);
    const bucket=buckets.get(key)||{sum:[0,0,0],weight:0};
    for(let c=0;c<3;c++)bucket.sum[c]+=rgba[i+c];
    bucket.weight++;buckets.set(key,bucket);
  }
  const points=[...buckets.values()].map(b=>({rgb:b.sum.map(v=>v/b.weight),weight:b.weight})).sort((a,b)=>b.weight-a.weight);
  if(!points.length)throw new Error('No visible pixels');
  const centers=[points[0].rgb];
  while(centers.length<Math.min(count,points.length)){
    let best=null,bestScore=-1;
    for(const p of points){const score=Math.min(...centers.map(c=>distance(p.rgb,c)))*Math.sqrt(p.weight);if(score>bestScore){best=p;bestScore=score;}}
    if(bestScore<=0)break;
    centers.push(best.rgb);
  }
  let groups;
  for(let pass=0;pass<12;pass++){
    groups=centers.map(()=>({sum:[0,0,0],weight:0}));
    for(const p of points){
      let index=0,min=Infinity;
      centers.forEach((c,i)=>{const d=distance(p.rgb,c);if(d<min){min=d;index=i;}});
      const group=groups[index];group.weight+=p.weight;
      for(let c=0;c<3;c++)group.sum[c]+=p.rgb[c]*p.weight;
    }
    let moved=0;
    groups.forEach((g,i)=>{if(!g.weight)return;const next=g.sum.map(v=>v/g.weight);moved+=distance(next,centers[i]);centers[i]=next;});
    if(moved<.01)break;
  }
  const total=points.reduce((sum,p)=>sum+p.weight,0),merged=new Map();
  for(const g of groups){
    if(!g.weight)continue;
    const rgb=g.sum.map(v=>Math.round(v/g.weight)),hex='#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
    const item=merged.get(hex)||{hex,rgb,ratio:0};item.ratio+=g.weight/total;merged.set(hex,item);
  }
  return [...merged.values()].sort((a,b)=>b.ratio-a.ratio);
}

export function paletteCSS(colors){return `:root {\n${colors.map((c,i)=>`  --color-${i+1}: ${c.hex};`).join('\n')}\n}`;}
