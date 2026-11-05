const fail = (zh, en) => { throw new Error(`${zh} | ${en}`); };
export const MAX_TEXT = 2_000_000;
export function checkText(value, max=MAX_TEXT) { if (value.length>max) fail('输入内容过大', `Input exceeds ${max.toLocaleString()} characters`); return value; }
export function unicodeEncode(input) {
  checkText(input); let out='';
  for(let i=0;i<input.length;i++) { const c=input.charCodeAt(i); out+=c===92?'\\\\':c<32||c>126?'\\u'+c.toString(16).padStart(4,'0'):input[i]; }
  return out;
}
export function unicodeDecode(input) {
  checkText(input); let out='';
  for(let i=0;i<input.length;i++) {
    if(input[i]!=='\\') {out+=input[i];continue;}
    const next=input[++i];
    if(next==='\\') out+='\\';
    else if(next==='u'&&/^[\da-f]{4}$/i.test(input.slice(i+1,i+5))) { out+=String.fromCharCode(parseInt(input.slice(i+1,i+5),16));i+=4; }
    else fail('无效 Unicode 转义：请使用 \\uXXXX 或 \\\\', 'Invalid Unicode escape; use \\uXXXX or \\\\');
  }
  return out;
}
export async function formatJson(input,minify=false) { checkText(input);const j=await import('lossless-json');return j.stringify(j.parse(input),null,minify?0:2); }
export function base64Encode(input,url=false) {
  checkText(input);const bytes=new TextEncoder().encode(input);let binary='';
  for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  let s=btoa(binary);return url?s.replaceAll('+','-').replaceAll('/','_').replace(/=+$/,''):s;
}
export function base64Decode(input,url=false) {
  checkText(input);let s=input.replace(/\s/g,'');
  if(url) s=s.replaceAll('-','+').replaceAll('_','/');
  if(!/^[A-Za-z0-9+/]*={0,2}$/.test(s)||s.length%4===1||(/=/.test(s)&&s.length%4!==0)) fail('无效 Base64', 'Invalid Base64');
  s=s.padEnd(Math.ceil(s.length/4)*4,'=');
  return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)));
}
export function urlParameters(input) {
  checkText(input);const text=input.trim();
  if(/^[a-z][a-z\d+.-]*:/i.test(text)||text.startsWith('//'))return [...new URL(text,'https://handybox.invalid').searchParams];
  const beforeFragment=input.split('#')[0],q=beforeFragment.includes('?')?beforeFragment.slice(beforeFragment.indexOf('?')+1):beforeFragment;
  return [...new URLSearchParams(q)];
}
export async function timestamp(input,mode='seconds',zone='UTC') {
  const {DateTime}=await import('luxon');let d;
  if(mode==='seconds'||mode==='milliseconds') { if(!/^-?\d+(\.\d+)?$/.test(input.trim())) fail('请输入有效数字','Enter a valid number');const n=Number(input);d=DateTime.fromMillis(mode==='seconds'?n*1000:n,{zone:'utc'}); }
  else d=DateTime.fromISO(input.trim(),{zone,setZone:true});
  if(!d.isValid||!d.setZone(zone).isValid) fail('无效日期或时区','Invalid date or time zone');
  // DateTime rejects invalid spring-forward times by shifting; detect that case for zone-local ISO input.
  if(mode==='date'&&!/([zZ]|[+-]\d\d:\d\d)$/.test(input)&&input.includes('T')&&d.toFormat("yyyy-MM-dd'T'HH:mm")!==input.slice(0,16)) fail('该本地时间不存在（夏令时切换）','This local time does not exist (DST transition)');
  return {seconds:d.toMillis()/1000,milliseconds:d.toMillis(),utc:d.toUTC().toISO(),beijing:d.setZone('Asia/Shanghai').toISO(),zoned:d.setZone(zone).toISO()};
}
export function uuids(count=1) { if(!Number.isInteger(+count)||count<1||count>1000) fail('数量应为 1–1000','Count must be 1–1000');return Array.from({length:+count},()=>crypto.randomUUID()); }
export async function digest(input,algorithm='SHA-256') {const bytes=typeof input==='string'?new TextEncoder().encode(checkText(input)):input;return Array.from(new Uint8Array(await crypto.subtle.digest(algorithm,bytes)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function lineDiff(a,b,ignoreWhitespace=false) {checkText(a,200000);checkText(b,200000);const {diffLines}=await import('diff');return diffLines(a,b,{ignoreWhitespace,timeout:2000});}
export function jwtDecode(token) {
  checkText(token,100000);const p=token.trim().split('.');if(p.length!==3) fail('JWT 应包含三段','JWT must contain three segments');
  const parse=text=>JSON.parse(text,(_key,value,context)=>typeof value==='number'&&Number.isInteger(value)&&!Number.isSafeInteger(value)?context?.source||fail('此浏览器无法精确保留该 JWT 数字','This browser cannot preserve this JWT number exactly'):value);
  const header=parse(base64Decode(p[0],true)),payload=parse(base64Decode(p[1],true));
  if(!header||typeof header!=='object'||Array.isArray(header)||!payload||typeof payload!=='object'||Array.isArray(payload)) fail('Header 和 Payload 必须是对象','Header and payload must be objects');
  const times={};for(const key of ['iat','exp','nbf']) if(typeof payload[key]==='number') { const d=new Date(payload[key]*1000);times[key]=Number.isFinite(d.getTime())?d.toISOString():'Invalid timestamp'; }
  return {header,payload,times};
}
export function convertRadix(input,from=10,to=16) {
  if(![2,8,10,16].includes(+from)||![2,8,10,16].includes(+to)) fail('不支持的进制','Unsupported radix');
  let s=input.trim().toLowerCase(),negative=s.startsWith('-');if(/^[+-]/.test(s))s=s.slice(1);
  if((from==16&&s.startsWith('0x'))||(from==2&&s.startsWith('0b'))||(from==8&&s.startsWith('0o')))s=s.slice(2);
  if(!s||s.length>10000) fail('请输入整数（最多 10000 位）','Enter an integer (up to 10000 digits)');
  let n=0n;for(const c of s) {const v=parseInt(c,36);if(!Number.isFinite(v)||v>=from)fail('输入包含无效数字','Input contains an invalid digit');n=n*BigInt(from)+BigInt(v);}
  return (negative?-n:n).toString(+to);
}
export function parseColor(input) {
  let rgb;const s=input.trim().toLowerCase();
  if(/^#([\da-f]{3}|[\da-f]{6})$/.test(s)) {let h=s.slice(1);if(h.length===3)h=[...h].map(c=>c+c).join('');rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
  else if(/^rgb\(/.test(s)) {const m=s.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);if(m)rgb=m.slice(1).map(Number);if(rgb?.some(n=>n<0||n>255))rgb=null;}
  else {const m=s.match(/^hsl\(\s*([+-]?[\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/);if(m&&+m[2]<=100&&+m[3]<=100){const h=((+m[1]%360)+360)%360/60,sat=+m[2]/100,l=+m[3]/100,c=(1-Math.abs(2*l-1))*sat,x=c*(1-Math.abs(h%2-1)),a=l-c/2;rgb=([[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][Math.floor(h)]).map(v=>Math.round((v+a)*255));}}
  if(!rgb||rgb.some(n=>!Number.isFinite(n)))fail('请输入 HEX、RGB 或 HSL 颜色','Enter a HEX, RGB or HSL color');rgb=rgb.map(Math.round);
  const [r,g,b]=rgb.map(n=>n/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
  let h=0;if(d)h=(max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60;
  const sat=d===0?0:d/(1-Math.abs(2*l-1));
  return {rgb,hex:'#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join(''),hsl:`hsl(${+h.toFixed(2)}, ${+(sat*100).toFixed(2)}%, ${+(l*100).toFixed(2)}%)`};
}
export function contrast(a,b) {const lum=c=>parseColor(c).rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export async function convertYaml(input,direction) {
  checkText(input);const y=await import('yaml'),j=await import('lossless-json');
  const safeFloat=source=>{
    // Normalize the extra spellings accepted by YAML before checking the original
    // scalar, rather than checking an already rounded JavaScript Number.
    const normalized=source.replace(/^\+/,'').replace(/^(-?)\./,(_match,sign)=>`${sign}0.`).replace(/\.(?=[eE]|$)/,'.0');
    if(!Number.isFinite(Number(normalized))||!j.isSafeNumber(normalized))fail('该数值无法在当前转换中保留精度；请改用带引号的字符串或普通整数','This number cannot retain precision in this conversion; use a quoted string or a plain integer');
    return Number(normalized);
  };
  if(direction==='json-yaml') {const convert=v=>j.isLosslessNumber(v)?(/^-?\d+$/.test(v.value)?BigInt(v.value):safeFloat(v.value)):Array.isArray(v)?v.map(convert):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,n])=>[k,convert(n)])):v;return y.stringify(convert(j.parse(input)));}
  const doc=y.parseDocument(input,{intAsBigInt:true,uniqueKeys:true});if(doc.errors.length)throw doc.errors[0];
  y.visit(doc,(_key,node)=>{if(y.isScalar(node)&&typeof node.value==='number')safeFloat(node.source);});
  const ancestors=new WeakSet();
  const convert=v=>{if(typeof v==='bigint')return new j.LosslessNumber(v.toString());if(!v||typeof v!=='object')return v;if(ancestors.has(v))fail('YAML 包含循环引用，无法转换为 JSON','YAML contains a cyclic reference that JSON cannot represent');ancestors.add(v);const result=Array.isArray(v)?v.map(convert):Object.fromEntries(Object.entries(v).map(([k,n])=>[k,convert(n)]));ancestors.delete(v);return result;};
  const value=doc.toJS({maxAliasCount:100});return j.stringify(convert(value),null,2);
}
export async function formatSql(input,dialect='sql') {checkText(input,200000);const {format}=await import('sql-formatter');return format(input,{language:dialect,keywordCase:'upper',tabWidth:2});}
export async function explainCron(input,zone='UTC',locale='en',currentDate=new Date().toISOString()) {
  if(input.trim().split(/\s+/).length!==5)fail('仅支持五段 Cron','Only five-field Cron is supported');
  const [{CronExpressionParser},{default:cronstrue},{DateTime}]=await Promise.all([import('cron-parser'),import('cronstrue/i18n.js'),import('luxon')]);
  const expression=CronExpressionParser.parse(input,{tz:zone,currentDate});const dates=Array.from({length:5},()=>DateTime.fromJSDate(expression.next().toDate()).setZone(zone).toISO());
  return {description:cronstrue.toString(input,{locale:locale==='zh'?'zh_CN':'en',use24HourTimeFormat:true}),dates};
}
export async function htmlEntities(input,encode=true) {checkText(input);const module=await import('he'),he=module.default||module;return encode?he.encode(input,{useNamedReferences:true,allowUnsafeSymbols:false,encodeEverything:false}).replaceAll('&#x22;','&quot;'):he.decode(input);}
export function textCounts(input) {checkText(input);return {characters:[...input].length,graphemes:[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(input)].length,words:(input.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[]).length,lines:input?input.split(/\r\n|\r|\n/).length:0,bytes:new TextEncoder().encode(input).length};}
export function transformText(input,mode) {checkText(input);const lines=input.split(/\r\n|\r|\n/);switch(mode){case 'upper':return input.toUpperCase();case 'lower':return input.toLowerCase();case 'unique':return [...new Set(lines)].join('\n');case 'sort':return lines.sort((a,b)=>a.localeCompare(b)).join('\n');case 'trim':return lines.map(s=>s.trim()).join('\n');case 'blank':return lines.filter(s=>s.trim()).join('\n');default:fail('无效操作','Invalid operation');}}
export async function qrDataUrl(input,width=256,level='M') {checkText(input,2900);if(!input)fail('请输入二维码内容','Enter QR content');if(!Number.isInteger(+width)||width<64||width>2048)fail('尺寸应为 64–2048','Size must be 64–2048');const {default:qr}=await import('qrcode');return qr.toDataURL(input,{width:+width,errorCorrectionLevel:level,margin:4});}
const GROUPS={upper:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',lower:'abcdefghijklmnopqrstuvwxyz',digits:'0123456789',symbols:'!@#$%^&*()-_=+[]{};:,.?'};
function randomInt(max){const a=new Uint32Array(1),limit=Math.floor(4294967296/max)*max;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%max;}
export function password({length=20,upper=true,lower=true,digits=true,symbols=true,exclude=true}={}) {
  const groups=Object.entries({upper,lower,digits,symbols}).filter(([,on])=>on).map(([k])=>exclude?GROUPS[k].replace(/[O0Il1]/g,''):GROUPS[k]);
  if(!groups.length||!Number.isInteger(+length)||length<groups.length||length>256)fail('选择字符集，长度应在字符集数量和 256 之间','Select character sets; length must be between the group count and 256');
  const all=groups.join(''),chars=groups.map(g=>g[randomInt(g.length)]);while(chars.length<length)chars.push(all[randomInt(all.length)]);for(let i=chars.length-1;i>0;i--){const j=randomInt(i+1);[chars[i],chars[j]]=[chars[j],chars[i]];}return chars.join('');
}
export const UNIT_GROUPS={length:{m:1,km:1000,cm:.01,mm:.001,in:.0254,ft:.3048,yd:.9144,mi:1609.344},weight:{kg:1,g:.001,mg:.000001,lb:.45359237,oz:.028349523125},temperature:{'°C':1,'°F':1,K:1},area:{'m²':1,'km²':1e6,ha:10000,'ft²':.09290304,acre:4046.8564224},volume:{L:1,mL:.001,'m³':1000,'US gal':3.785411784},storage:{B:1,kB:1000,MB:1e6,GB:1e9,TB:1e12,KiB:1024,MiB:1048576,GiB:1073741824,TiB:1099511627776}};
export function convertUnit(value,from,to) {
  const n=Number(value);if(String(value).trim()===''||!Number.isFinite(n))fail('请输入有限数值','Enter a finite number');const group=Object.values(UNIT_GROUPS).find(g=>Object.hasOwn(g,from)&&Object.hasOwn(g,to));if(!group)fail('单位类型不匹配','Unit categories do not match');
  if(group===UNIT_GROUPS.temperature) {const c=from==='°F'?(n-32)*5/9:from==='K'?n-273.15:n;return to==='°F'?c*9/5+32:to==='K'?c+273.15:c;}return n*group[from]/group[to];
}
export async function dateCalculate(start,end,add=0,zone='UTC') {
  const {DateTime}=await import('luxon');const a=DateTime.fromISO(start,{zone}),b=DateTime.fromISO(end,{zone});if(!a.isValid||!b.isValid||!Number.isInteger(+add)||Math.abs(add)>365000)fail('无效日期、时区或天数','Invalid date, time zone or day count');
  for(const [input,date]of [[start,a],[end,b]])if(input.includes('T')&&!/([zZ]|[+-]\d\d:\d\d)$/.test(input)&&date.toFormat("yyyy-MM-dd'T'HH:mm")!==input.slice(0,16))fail('该本地时间不存在（夏令时切换）','This local time does not exist (DST transition)');
  const natural=d=>DateTime.utc(d.year,d.month,d.day);return {days:natural(b).diff(natural(a),'days').days,hours:b.diff(a,'hours').hours,seconds:b.diff(a,'seconds').seconds,added:a.plus({days:+add}).toISO(),countdownSeconds:Math.floor(b.diffNow('seconds').seconds)};
}
export async function csvConvert(input,direction,{delimiter=',',header=true,safe=true}={}) {
  checkText(input);if(delimiter==='\\t')delimiter='\t';if(delimiter.length!==1||/["\r\n]/.test(delimiter))fail('分隔符必须是一个字符','Delimiter must be one character');const {default:Papa}=await import('papaparse');
  if(direction==='csv-json') {
    const source=input.replace(/^\uFEFF/,''),rows=[];let previous=0;
    // Keep records such as comma-only rows, quoted empties and spaces. Only an
    // empty physical line outside quoted fields is ignored, including EOF.
    Papa.parse(source,{delimiter,skipEmptyLines:false,step:({data,errors,meta})=>{
      if(errors.length)throw new Error(errors[0].message);
      const record=source.slice(previous,meta.cursor);previous=meta.cursor;
      if(!/^(?:\r\n|\r|\n)?$/.test(record))rows.push(data);
    }});
    if(!header)return JSON.stringify(rows,null,2);const keys=rows.shift()||[];if(new Set(keys).size!==keys.length||keys.some(k=>!k))fail('表头必须非空且唯一','Headers must be nonempty and unique');
    if(rows.some(r=>r.length!==keys.length))fail('数据行列数与表头不一致','Row width does not match headers');return JSON.stringify(rows.map(row=>Object.fromEntries(keys.map((key,i)=>[key,row[i]]))),null,2);
  }
  const j=await import('lossless-json');const parsed=j.parse(input);
  const cell=v=>j.isLosslessNumber(v)?v.value:v;
  const data=Array.isArray(parsed)?parsed.map(row=>Array.isArray(row)?row.map(cell):row&&typeof row==='object'?Object.fromEntries(Object.entries(row).map(([k,v])=>[k,cell(v)])):row):parsed;
  if(!Array.isArray(data)||data.some(r=>!r||typeof r!=='object'))fail('请输入对象数组或二维数组','Enter an array of objects or rows');
  if(data.some(r=>Object.values(r).some(v=>v!==null&&typeof v==='object')))fail('CSV 不支持嵌套对象；请先展开','CSV cannot represent nested objects; flatten them first');
  if(data.length&&data.some(row=>Array.isArray(row)!==Array.isArray(data[0])))fail('对象和数组行不能混用','Object rows and array rows cannot be mixed');
  const fields=data.length&&!Array.isArray(data[0])?[...new Set(data.flatMap(row=>Object.keys(row)))]:null;
  return Papa.unparse(fields?{fields,data}:data,{delimiter,header,escapeFormulae:safe,newline:'\r\n'});
}
