export function parseEntries(text){
  const lines=String(text).split(/\r\n|\r|\n/).map(s=>s.trim()).filter(Boolean);
  if(lines.length<2||lines.length>50)throw new Error('Enter 2–50 options');
  return lines.map((line,id)=>{
    const parts=line.split('|'),label=parts[0].trim(),raw=parts[1]?.trim(),weight=raw===undefined?1:Number(raw);
    if(parts.length>2||!label||[...label].length>60)throw new Error('Each option needs a label of 1–60 characters');
    if(raw!==undefined&&!/^\d+$/.test(raw)||!Number.isInteger(weight)||weight<1||weight>100)throw new Error('Weights must be integers from 1 to 100');
    return {id,label,weight};
  });
}

export function pickEntry(entries,unitRandom){
  if(!entries.length)throw new Error('No options remaining');
  if(!Number.isFinite(unitRandom)||unitRandom<0||unitRandom>=1)throw new Error('Invalid random value');
  const total=entries.reduce((n,e)=>n+e.weight,0),target=unitRandom*total;
  let cursor=0;
  for(let i=0;i<entries.length;i++){cursor+=entries[i].weight;if(target<cursor)return i;}
  return entries.length-1;
}

// Sectors start at twelve o'clock and proceed clockwise. The pointer stays at twelve.
export function wheelTarget(entries,index,currentAngle,unitRandom){
  const total=entries.reduce((n,e)=>n+e.weight,0);
  const start=entries.slice(0,index).reduce((n,e)=>n+e.weight,0)/total*360;
  const inside=start+(entries[index].weight/total*360)*(.2+unitRandom*.6);
  const desired=(360-inside)%360,current=((currentAngle%360)+360)%360;
  return currentAngle+5*360+(desired-current+360)%360;
}

export function randomUnit(){const value=new Uint32Array(1);crypto.getRandomValues(value);return value[0]/4294967296;}
