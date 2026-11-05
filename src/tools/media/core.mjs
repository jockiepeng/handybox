export const LIMITS = { fileBytes:25*1024*1024, pixels:24_000_000, dimension:8192, batch:10, batchBytes:100*1024*1024, pdfBytes:100*1024*1024, pdfPages:1000 };
export function validateImageSize(width,height,bytes=0) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1) throw new Error('Invalid image dimensions');
  if(bytes>LIMITS.fileBytes||width*height>LIMITS.pixels||Math.max(width,height)>LIMITS.dimension) throw new Error('Image exceeds limit: 25 MiB, 24 MP, 8192 px per side');
}
export function inspectImage(input) {
  const b=input instanceof Uint8Array?input:new Uint8Array(input), v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  const str=(i,n)=>String.fromCharCode(...b.subarray(i,i+n));
  let mime,width,height,alpha=false,animated=false;
  if(b.length>=33&&b[0]===137&&str(1,7)==='PNG\r\n\x1a\n'&&str(12,4)==='IHDR') {
    mime='image/png';width=v.getUint32(16);height=v.getUint32(20);alpha=[4,6].includes(b[25]);
    for(let i=8;i+12<=b.length;) { const n=v.getUint32(i),type=str(i+4,4);if(n>b.length-i-12) throw new Error('Invalid PNG chunk'); if(type==='acTL')animated=true;if(type==='tRNS')alpha=true;i+=12+n; }
  } else if(b.length>=30&&str(0,4)==='RIFF'&&str(8,4)==='WEBP') {
    mime='image/webp';
    for(let i=12;i+8<=b.length;) {const type=str(i,4),n=v.getUint32(i+4,true),p=i+8;if(n>b.length-p)throw new Error('Invalid WebP chunk');
      if(type==='VP8X'&&n>=10){animated=Boolean(b[p]&2);alpha=Boolean(b[p]&16);width=1+b[p+4]+(b[p+5]<<8)+(b[p+6]<<16);height=1+b[p+7]+(b[p+8]<<8)+(b[p+9]<<16);}
      if(type==='ANIM'||type==='ANMF')animated=true;
      if(type==='VP8 '&&n>=10&&!width){width=v.getUint16(p+6,true)&16383;height=v.getUint16(p+8,true)&16383;}
      if(type==='VP8L'&&n>=5&&!width){const bits=v.getUint32(p+1,true);width=(bits&16383)+1;height=((bits>>>14)&16383)+1;alpha=Boolean(bits&0x10000000);}
      i=p+n+(n%2);
    }
  } else if(b.length>=4&&b[0]===255&&b[1]===216) {
    mime='image/jpeg';
    for(let i=2;i+3<b.length;) {if(b[i]!==255){i++;continue;}while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;if(i+2>b.length)break;const n=v.getUint16(i);if(n<2||i+n>b.length)throw new Error('Invalid JPEG segment');if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&n>=8){height=v.getUint16(i+3);width=v.getUint16(i+5);break;}i+=n;}
  } else throw new Error('Unsupported format. Use static JPEG, PNG or WebP');
  if(animated)throw new Error('Animated images are not supported');
  validateImageSize(width,height,b.length);
  return {mime,width,height,animated,alpha};
}
export function fitDimensions(width,height,maxEdge) {
  validateImageSize(width,height); if(!Number.isFinite(maxEdge)||maxEdge<1)throw new Error('Maximum edge must be positive');
  const s=Math.min(1,maxEdge/Math.max(width,height));return {width:Math.max(1,Math.round(width*s)),height:Math.max(1,Math.round(height*s))};
}
export function cropGeometry(sourceWidth,sourceHeight,{x,y,width,height}) {
  if(![x,y,width,height].every(Number.isInteger)||x<0||y<0||width<1||height<1)throw new Error('Crop requires nonnegative coordinates and positive integer dimensions');
  if(x+width>sourceWidth||y+height>sourceHeight)throw new Error('Crop exceeds image bounds');return {x,y,width,height};
}
export function parsePageRanges(text,pageCount) {
  if(!Number.isInteger(pageCount)||pageCount<1||pageCount>LIMITS.pdfPages)throw new Error('PDF page count exceeds limit');
  if(!String(text).trim())throw new Error('Enter page numbers, for example 1-3,5');
  const pages=[];
  for(const token of String(text).split(',')){const m=token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw new Error('Invalid page range');const start=Number(m[1]),end=Number(m[2]??m[1]);if(start<1||end<start||end>pageCount)throw new Error('Page range is outside PDF bounds');if(pages.length+end-start+1>LIMITS.pdfPages)throw new Error('Output exceeds 1000 page limit');for(let p=start;p<=end;p++)pages.push(p-1);}
  return pages;
}
export function watermarkPosition(width,height,markWidth,markHeight,position,padding=20) {
  const x=position.includes('left')?padding:position.includes('right')?width-markWidth-padding:(width-markWidth)/2;
  const y=position.includes('top')?padding:position.includes('bottom')?height-markHeight-padding:(height-markHeight)/2;
  return {x:Math.max(0,x),y:Math.max(0,y)};
}
