import { applyLanguage, downloadBlob, escapeHtml } from '../../lib/ui.mjs';
import { LIMITS, inspectImage, fitDimensions, cropGeometry, watermarkPosition, validateImageSize } from './core.mjs';

const t=(zh,en,tag='span')=>`<${tag} data-zh="${escapeHtml(zh)}" data-en="${escapeHtml(en)}">${escapeHtml(zh)}</${tag}>`;
const field=(name,zh,en,control)=>`<label class="media-field">${t(zh,en)}${control}</label>`;
const num=(name,value,min=1,max=8192)=>`<input name="${name}" type="number" value="${value}" min="${min}" max="${max}" step="1">`;
const option=(value,zh,en)=>`<option value="${value}" data-zh="${zh}" data-en="${en}">${zh}</option>`;
const button=(action,zh,en,extra='')=>`<button type="button" data-action="${action}" ${extra}>${t(zh,en)}</button>`;
const bytes=n=>n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KiB`:`${(n/1048576).toFixed(2)} MiB`;
const ext=mime=>({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[mime]||'bin');
const basename=name=>name.replace(/\.[^.]*$/,'');

const errorTranslations=[
  [/animated/i,'暂不支持动画图片，请使用静态 JPEG、PNG 或 WebP。'],
  [/unsupported format/i,'格式不支持，请使用静态 JPEG、PNG 或 WebP。'],
  [/exceeds limit|Image exceeds/i,'图片超过限制：单张 25 MiB、2400 万像素、单边 8192 像素。'],
  [/encoder/i,'当前浏览器不支持所选输出编码，请选择其他格式。'],
  [/bounds/i,'裁剪范围或 PDF 页码超出文件范围。'],
  [/positive|dimensions|Crop requires/i,'请输入有效的正整数尺寸和非负裁剪坐标。'],
  [/Encrypted/i,'不支持加密 PDF，请先移除密码保护。'],
  [/Cannot read PDF|Invalid PDF/i,'无法读取 PDF，请使用有效且未加密的 PDF 文件。'],
  [/page range|page numbers/i,'页码格式无效，例如 1-3,5；拆分组之间使用分号。'],
  [/1000|page count|1–1000/i,'PDF 输入和总输出最多 1000 页。'],
  [/Cancelled/i,'已取消处理。'],
  [/20 output/i,'一次最多拆分为 20 个文件。'],
  [/100 MiB/i,'所选 PDF 总大小不可超过 100 MiB。'],
  [/watermark/i,'请选择有效的水印图片或输入水印文字。'],
  [/decode/i,'图片无法解码，文件可能损坏或浏览器不支持。'],
];
function errorText(error){const en=error?.message||String(error);return [errorTranslations.find(([re])=>re.test(en))?.[1]||'处理失败，请检查文件和选项。',en];}

export async function decodeImage(file){
  if(file.size>LIMITS.fileBytes)throw new Error('Image exceeds limit: 25 MiB');
  const header=inspectImage(await file.arrayBuffer());
  let image;
  try {image=await createImageBitmap(file,{imageOrientation:'from-image'});}catch {
    const url=URL.createObjectURL(file);
    try {image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Cannot decode image'));img.src=url;});}finally{URL.revokeObjectURL(url);}
  }
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  try {validateImageSize(width,height,file.size);}catch(e){image.close?.();throw e;}
  return {image,width,height,header,file,close(){image.close?.();}};
}
async function encodeCanvas(canvas,mime,quality){
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,mime,quality));
  if(!blob||blob.type!==mime)throw new Error('Selected encoder is not supported by this browser');
  return blob;
}
function canvasFor(width,height,mime,background){
  validateImageSize(width,height);const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas is not supported');
  if(mime==='image/jpeg'){ctx.fillStyle=background;ctx.fillRect(0,0,width,height);}
  return {canvas,ctx};
}

export function mountMediaTool(root,id){
  root.innerHTML=`<style>
    .media-workbench{display:grid;gap:1rem}.media-options{display:flex;gap:1rem;flex-wrap:wrap;align-items:end}.media-field{display:flex;flex-direction:column;gap:.4rem;min-width:130px;max-width:100%}.media-field input:not([type=checkbox]):not([type=file]),.media-field select{width:100%;max-width:240px}.media-field input[type=file]{max-width:100%}.media-drop{border:2px dashed var(--border,#dde4ed);border-radius:10px;padding:1.5rem;display:grid;gap:.75rem}.media-drop[data-over]{border-color:#2267d5;background:#2267d50a}.media-actions{display:flex;gap:.6rem;flex-wrap:wrap}.media-preview{margin:0;display:grid;gap:.5rem}.media-preview canvas,.media-result img{max-width:100%;height:auto;max-height:420px;object-fit:contain;border:1px solid var(--border,#dde4ed);background:repeating-conic-gradient(#ddd 0% 25%,#fff 0% 50%) 0/16px 16px}.media-status{min-height:1.5em;overflow-wrap:anywhere}.media-status[data-kind=error]{color:var(--error,#b42318)}.media-results{display:grid;gap:1rem}.media-result{border:1px solid var(--border,#dde4ed);padding:1rem;border-radius:8px;display:grid;gap:.6rem;min-width:0;overflow-wrap:anywhere}.media-hint{color:var(--muted,#64748b);font-size:.9rem;margin:0}.media-files{display:grid;gap:.5rem;padding-left:1.25rem}.media-files li{overflow-wrap:anywhere}.media-metadata{width:100%;min-height:260px;box-sizing:border-box}.media-crop-fields{display:flex;gap:.6rem;flex-wrap:wrap}.media-crop-fields .media-field{min-width:80px;max-width:125px}
  </style><section class="media-workbench"></section>`;
  const host=root.querySelector('.media-workbench');
  if(id==='F02')mountPdf(host);else mountImage(host,id);
  applyLanguage(root);
  window.addEventListener('handybox:language',()=>applyLanguage(host));
}

function createStatus(host){
  const node=host.querySelector('.media-status');
  return (zh,en,kind='info')=>{node.dataset.zh=zh;node.dataset.en=en;node.dataset.kind=kind;applyLanguage(node);};
}
function attachDrop(zone,input,onFiles){
  input.addEventListener('change',()=>onFiles([...input.files]));
  zone.addEventListener('dragover',event=>{event.preventDefault();zone.dataset.over='';});
  zone.addEventListener('dragleave',()=>delete zone.dataset.over);
  zone.addEventListener('drop',event=>{event.preventDefault();delete zone.dataset.over;onFiles([...event.dataTransfer.files]);});
}
function mountImage(host,id){
  const isBatch=id==='I01',isResize=id==='I02',isWatermark=id==='I04',isMetadata=id==='I05';
  host.innerHTML=`<div class="media-drop">${t(isBatch?'选择或拖入图片（最多 10 张）':'选择或拖入一张图片',isBatch?'Choose or drop images (up to 10)':'Choose or drop one image')}
    <input name="images" type="file" accept="image/jpeg,image/png,image/webp" ${isBatch?'multiple':''} aria-label="JPEG PNG WebP">
    ${t('静态 JPEG / PNG / WebP；每张最多 25 MiB、2400 万像素、单边 8192 px。','Static JPEG / PNG / WebP; up to 25 MiB, 24 MP and 8192 px per side.','p')}
  </div><p class="media-status" role="status" aria-live="polite"></p>
    <figure class="media-preview" hidden><canvas aria-label="图片预览" data-label-zh="图片预览" data-label-en="Image preview"></canvas><figcaption></figcaption></figure>
  ${isMetadata?'':`<div class="media-options">${field('format','输出格式','Output format',`<select name="format">${option('image/webp','WebP','WebP')}${option('image/jpeg','JPEG','JPEG')}${option('image/png','PNG','PNG')}</select>`)}
    ${field('quality','质量（JPEG / WebP）','Quality (JPEG / WebP)',`<input name="quality" type="range" min="1" max="100" value="80"><output name="qualityValue">80%</output>`)}
    ${field('background','JPEG 底色','JPEG background',`<input type="color" name="background" value="#ffffff">`)}
    ${isBatch?field('maxEdge','最大边长（不放大）','Maximum edge (no upscaling)',num('maxEdge',1920)):''}
  </div>`}
  ${isResize?`<fieldset><legend>${t('裁剪区域（原图像素）','Crop region (source pixels)')}</legend><div class="media-options">${field('ratio','裁剪比例','Crop ratio',`<select name="ratio">${option('free','自由','Free')}${option('1','1:1','1:1')}${option('1.3333333333333333','4:3','4:3')}${option('1.7777777777777777','16:9','16:9')}${option('.75','3:4','3:4')}${option('.5625','9:16','9:16')}</select>`)}</div><div class="media-crop-fields">${field('cropX','X','X',num('cropX',0,0))}${field('cropY','Y','Y',num('cropY',0,0))}${field('cropWidth','裁剪宽','Crop width',num('cropWidth',1))}${field('cropHeight','裁剪高','Crop height',num('cropHeight',1))}</div></fieldset>
    <div class="media-options">${field('width','输出宽度','Output width',num('width',1))}${field('height','输出高度','Output height',num('height',1))}${field('lock','保持裁剪区域比例','Keep crop aspect ratio','<input name="lock" type="checkbox" checked>')}</div>`:''}
  ${isWatermark?`<div class="media-options">${field('markType','水印类型','Watermark type',`<select name="markType">${option('text','文字','Text')}${option('image','图片','Image')}</select>`)}
    ${field('markText','水印文字','Watermark text','<input name="markText" type="text" value="HandyBox" maxlength="300">')}
    ${field('markFile','水印图片','Watermark image','<input name="markFile" type="file" accept="image/jpeg,image/png,image/webp">')}
    ${field('markColor','文字颜色','Text color','<input name="markColor" type="color" value="#ffffff">')}
    ${field('markSize','水印宽度（图宽 %）','Watermark width (% of image)',num('markSize',30,1,100))}
    ${field('opacity','不透明度（%）','Opacity (%)',num('opacity',60,0,100))}
    ${field('position','位置','Position',`<select name="position">${option('bottom-right','右下','Bottom right')}${option('bottom-left','左下','Bottom left')}${option('top-right','右上','Top right')}${option('top-left','左上','Top left')}${option('center','居中','Center')}</select>`)}
  </div>`:''}
  <p class="media-hint">${t(isMetadata?'EXIF 可能包含拍摄位置。仅在此页面读取。':'PNG 输出为无损编码，质量滑块不影响 PNG；结果可能更大，可保留原图。重新编码通常不会保留 EXIF 等元数据。',isMetadata?'EXIF may contain location data. It is read only on this page.':'PNG encoding is lossless and ignores the quality slider. Output may be larger; original download remains available. Re-encoding usually removes EXIF and other metadata.')}</p>
  <div class="media-actions">${button('run',isMetadata?'读取信息':'处理图片',isMetadata?'Read metadata':'Process images','class="primary"')}${button('cancel','取消','Cancel','disabled')}${button('clear','清空','Clear')}${button('example','载入示例','Load example')}</div>
  <div class="media-results" aria-live="polite"></div>`;
  const input=host.querySelector('[name=images]'),preview=host.querySelector('.media-preview'),canvas=preview.querySelector('canvas'),caption=preview.querySelector('figcaption'),results=host.querySelector('.media-results'),status=createStatus(host);
  const q=name=>host.querySelector(`[name=${name}]`),value=name=>q(name).value,number=name=>Number(value(name));
  let files=[],source=null,cancelled=false,busy=false,selectionVersion=0,urls=[];
  const cleanResults=()=>{urls.forEach(URL.revokeObjectURL);urls=[];results.replaceChildren();};
  const setBusy=value=>{busy=value;for(const node of host.querySelectorAll('input,select,[data-action=run],[data-action=example]'))node.disabled=value;host.querySelector('[data-action=cancel]').disabled=!value;};
  function drawPreview(){
    if(!source)return;
    const scale=Math.min(1,800/source.width,500/source.height);canvas.width=Math.round(source.width*scale);canvas.height=Math.round(source.height*scale);
    const ctx=canvas.getContext('2d');ctx.drawImage(source.image,0,0,canvas.width,canvas.height);
    if(isResize){try{const crop=getCrop();ctx.fillStyle='#0007';ctx.beginPath();ctx.rect(0,0,canvas.width,canvas.height);ctx.rect(crop.x*scale,crop.y*scale,crop.width*scale,crop.height*scale);ctx.fill('evenodd');ctx.strokeStyle='#2267d5';ctx.lineWidth=2;ctx.strokeRect(crop.x*scale,crop.y*scale,crop.width*scale,crop.height*scale);}catch{}}
    caption.textContent=`${source.file.name} · ${source.width} × ${source.height} · ${bytes(source.file.size)}`;
  }
  const getCrop=()=>cropGeometry(source.width,source.height,{x:number('cropX'),y:number('cropY'),width:number('cropWidth'),height:number('cropHeight')});
  async function selectFiles(incoming){
    if(busy)return;
    const version=++selectionVersion;source?.close();source=null;files=[];preview.hidden=true;cleanResults();
    if(!incoming.length){status('请选择图片。','Choose an image.');return;}
    if(incoming.length>(isBatch?LIMITS.batch:1)||incoming.reduce((sum,f)=>sum+f.size,0)>LIMITS.batchBytes){status('最多 10 张、总计 100 MiB；当前工具仅接受规定数量的图片。','Too many images or total size above 100 MiB. This tool accepts '+(isBatch?'up to 10 images.':'one image.'),'error');return;}
    try {
      const loaded=await decodeImage(incoming[0]);if(version!==selectionVersion){loaded.close();return;}source=loaded;files=incoming;preview.hidden=false;
      if(isResize){for(const [name,n] of Object.entries({cropX:0,cropY:0,cropWidth:source.width,cropHeight:source.height,width:source.width,height:source.height}))q(name).value=n;q('ratio').value='free';}
      drawPreview();status(`已选择 ${files.length} 张图片。`,`Selected ${files.length} image(s).`);if(isMetadata)await run();
    }catch(error){if(version===selectionVersion)status(...errorText(error),'error');}
  }
  attachDrop(host.querySelector('.media-drop'),input,selectFiles);
  function resultCard(file,blob,width,height){
    const url=URL.createObjectURL(blob);urls.push(url);const article=document.createElement('article');article.className='media-result';
    const name=`${basename(file.name)}-${id==='I02'?'resized':id==='I04'?'watermark':'converted'}.${ext(blob.type)}`;
    article.innerHTML=`<strong></strong><div>${t('原图','Original')}: ${bytes(file.size)} → ${t('结果','Output')}: ${bytes(blob.size)} (${((blob.size/file.size-1)*100).toFixed(1)}%) · ${width} × ${height}</div><div class="media-actions">${button('download','下载结果','Download result')}${button('original','下载原图','Download original')}</div><img loading="lazy" alt="" src="${url}">`;
    article.querySelector('strong').textContent=file.name;article.querySelector('[data-action=download]').onclick=()=>downloadBlob(blob,name);article.querySelector('[data-action=original]').onclick=()=>downloadBlob(file,file.name);results.append(article);applyLanguage(article);
  }
  async function metadata(){
    const {default:exifr}=await import('exifr');
    let metadata=null,metadataError=false;
    try {metadata=await exifr.parse(source.file);}catch{metadataError=true;}
    if(cancelled)return;
    const basic={name:source.file.name,mime:source.header.mime,bytes:source.file.size,width:source.width,height:source.height,exif:metadata||null};
    const pre=document.createElement('article');pre.className='media-result';pre.innerHTML=`${t('图片信息 / EXIF','Image information / EXIF','strong')}<dl><dt>${t('名称','Name')}</dt><dd data-info="name"></dd><dt>${t('类型','Type')}</dt><dd>${basic.mime}</dd><dt>${t('尺寸','Dimensions')}</dt><dd>${basic.width} × ${basic.height} px</dd><dt>${t('文件大小','File size')}</dt><dd>${bytes(basic.bytes)}</dd></dl><p>${t(metadataError?'EXIF 无法解析；基本图片信息仍可用。':metadata?'读取到以下元数据。':'没有可读取的 EXIF。',metadataError?'EXIF could not be parsed; basic image information is available.':metadata?'Readable metadata is shown below.':'No readable EXIF found.')}</p><textarea class="media-metadata" readonly aria-label="Metadata JSON"></textarea>${button('download','下载 JSON','Download JSON')}`;
    pre.querySelector('[data-info=name]').textContent=basic.name;const json=JSON.stringify(basic,(_,v)=>typeof v==='bigint'?v.toString():v,2);pre.querySelector('textarea').value=json;pre.querySelector('button').onclick=()=>downloadBlob(new Blob([json],{type:'application/json'}),`${basename(basic.name)}-metadata.json`);results.append(pre);applyLanguage(pre);
  }
  async function render(loaded){
    const mime=value('format'),quality=number('quality')/100;
    let crop={x:0,y:0,width:loaded.width,height:loaded.height},dimensions={width:loaded.width,height:loaded.height};
    if(isBatch)dimensions=fitDimensions(loaded.width,loaded.height,number('maxEdge'));
    if(isResize){crop=getCrop();dimensions={width:number('width'),height:number('height')};}
    validateImageSize(dimensions.width,dimensions.height);
    const {canvas:output,ctx}=canvasFor(dimensions.width,dimensions.height,mime,value('background'));
    try{
      ctx.drawImage(loaded.image,crop.x,crop.y,crop.width,crop.height,0,0,output.width,output.height);
      if(isWatermark){
        const opacity=number('opacity')/100,percentage=number('markSize')/100;if(!Number.isFinite(opacity)||opacity<0||opacity>1||!Number.isFinite(percentage)||percentage<=0||percentage>1)throw new Error('Invalid watermark size or opacity');
        const padding=Math.round(Math.min(output.width,output.height)*.025),maxWidth=Math.min(output.width*percentage,output.width-2*padding);ctx.globalAlpha=opacity;
        if(value('markType')==='image'){
          const markFile=q('markFile').files[0];if(!markFile)throw new Error('Choose a watermark image');const mark=await decodeImage(markFile);
          try {const factor=Math.min(maxWidth/mark.width,(output.height-2*padding)/mark.height),w=mark.width*factor,h=mark.height*factor,pos=watermarkPosition(output.width,output.height,w,h,value('position'),padding);ctx.drawImage(mark.image,pos.x,pos.y,w,h);}finally{mark.close();}
        }else{
          const text=value('markText').trim();if(!text)throw new Error('Enter watermark text');ctx.font='100px system-ui, sans-serif';const size=Math.max(1,Math.min(100*maxWidth/ctx.measureText(text).width,output.height*.8));ctx.font=`${size}px system-ui, sans-serif`;ctx.textBaseline='top';const w=ctx.measureText(text).width,pos=watermarkPosition(output.width,output.height,w,size,value('position'),padding);ctx.fillStyle=value('markColor');ctx.shadowColor='#0009';ctx.shadowBlur=Math.max(1,size*.06);ctx.fillText(text,pos.x,pos.y);
        }
        ctx.globalAlpha=1;
      }
      if(cancelled)return null;return {blob:await encodeCanvas(output,mime,quality),...dimensions};
    }finally {output.width=output.height=1;}
  }
  async function run(){
    if(busy)return;if(!files.length||!source){status('请先选择有效图片。','Choose a valid image first.','error');return;}
    cancelled=false;setBusy(true);cleanResults();let succeeded=0,totalBytes=0,failures=0;
    try{
      if(isMetadata){status('正在读取元数据…','Reading metadata…');await metadata();if(!cancelled)status('信息已读取。','Metadata read.');return;}
      for(let i=0;i<files.length;i++){
        if(cancelled)break;status(`正在处理 ${i+1} / ${files.length}…`,`Processing ${i+1} / ${files.length}…`);await new Promise(resolve=>setTimeout(resolve,0));
        let loaded;
        try{loaded=i===0?source:await decodeImage(files[i]);const output=await render(loaded);if(cancelled||!output)break;totalBytes+=output.blob.size;if(totalBytes>LIMITS.batchBytes)throw new Error('Output exceeds 100 MiB limit');resultCard(files[i],output.blob,output.width,output.height);succeeded++;}
        catch(error){failures++;const article=document.createElement('article');article.className='media-result';const name=document.createElement('strong');name.textContent=files[i].name;article.append(name);const text=document.createElement('p');[text.dataset.zh,text.dataset.en]=errorText(error);article.append(text);results.append(article);applyLanguage(article);}
        finally{if(loaded&&loaded!==source)loaded.close();}
      }
      status(cancelled?`已取消，已完成 ${succeeded} 张。`:`完成 ${succeeded} 张，失败 ${failures} 张。`,cancelled?`Cancelled; ${succeeded} completed.`:`Completed ${succeeded}; failed ${failures}.`,failures?'error':'info');
    }catch(error){status(...errorText(error),'error');}finally{setBusy(false);}
  }
  host.querySelector('[data-action=run]').onclick=run;
  host.querySelector('[data-action=cancel]').onclick=()=>{cancelled=true;status('正在取消；当前编码结束后停止。','Cancelling; stops after the current encode.');};
  host.querySelector('[data-action=clear]').onclick=()=>{if(busy){cancelled=true;status('正在取消，请处理结束后清空。','Cancelling; clear after processing stops.');return;}selectionVersion++;files=[];source?.close();source=null;input.value='';if(q('markFile'))q('markFile').value='';preview.hidden=true;canvas.width=canvas.height=1;cleanResults();status('已清空。','Cleared.');};
  host.querySelector('[data-action=example]').onclick=async()=>{const c=document.createElement('canvas');c.width=640;c.height=400;const ctx=c.getContext('2d');ctx.fillStyle='#2267d5';ctx.fillRect(30,30,580,340);ctx.fillStyle='#fff';ctx.font='48px sans-serif';ctx.fillText('HandyBox',80,220);const blob=await encodeCanvas(c,'image/png',1);await selectFiles([new File([blob],'handybox-example.png',{type:'image/png'})]);};
  q('quality')?.addEventListener('input',()=>q('qualityValue').textContent=`${value('quality')}%`);
  if(isResize){
    q('ratio').addEventListener('change',()=>{if(!source)return;const ratio=Number(value('ratio'));if(!ratio)return;let width=source.width,height=Math.round(width/ratio);if(height>source.height){height=source.height;width=Math.round(height*ratio);}q('cropWidth').value=width;q('cropHeight').value=height;q('cropX').value=Math.floor((source.width-width)/2);q('cropY').value=Math.floor((source.height-height)/2);q('width').value=width;q('height').value=height;drawPreview();});
    for(const name of ['cropX','cropY','cropWidth','cropHeight'])q(name).addEventListener('input',()=>{if(source){q('ratio').value='free';if(q('lock').checked){q('width').value=number('cropWidth');q('height').value=number('cropHeight');}drawPreview();}});
    q('width').addEventListener('input',()=>{if(source&&q('lock').checked&&number('cropWidth')>0)q('height').value=Math.max(1,Math.round(number('width')*number('cropHeight')/number('cropWidth')));});
    q('height').addEventListener('input',()=>{if(source&&q('lock').checked&&number('cropHeight')>0)q('width').value=Math.max(1,Math.round(number('height')*number('cropWidth')/number('cropHeight')));});
  }
}

function mountPdf(host){
  host.innerHTML=`<div class="media-drop">${t('选择或拖入 PDF（最多 10 个，总计 100 MiB）','Choose or drop PDFs (up to 10, 100 MiB total)')}<input name="pdfs" type="file" accept="application/pdf,.pdf" multiple aria-label="PDF files"></div>
    <p class="media-hint">${t('仅支持未加密的普通 PDF，最多 1000 页。输出会重新生成文件，数字签名不再有效，表单或书签等文档结构不保证保留。','Unencrypted PDFs only, up to 1000 pages. Output is rebuilt; digital signatures become invalid and document structures such as forms and bookmarks may not be retained.')}</p>
    <p class="media-status" role="status" aria-live="polite"></p><ol class="media-files"></ol>
    <div class="media-options">${field('mode','操作','Operation',`<select name="mode">${option('merge','按列表顺序合并','Merge in list order')}${option('reorder','选页 / 调整页序（单个 PDF）','Extract / reorder (one PDF)')}${option('split','按分组拆分（单个 PDF）','Split into groups (one PDF)')}</select>`)}</div>
    ${field('ranges','页码 / 拆分分组','Page ranges / split groups','<input name="ranges" type="text" value="1" data-placeholder-zh="例如 3,1-2 或 1-2;3-4" data-placeholder-en="e.g. 3,1-2 or 1-2;3-4">')}
    <p class="media-hint">${t('页码从 1 开始。选页允许重复，例如 3,1,1。拆分用分号分组，例如 1-2;3-4（最多 20 组）。合并忽略页码框；用上移 / 下移调整文件顺序。','Page numbers start at 1. Repeated pages are allowed, e.g. 3,1,1. Separate split groups with semicolons, e.g. 1-2;3-4 (up to 20 groups). Merge ignores the ranges field; use Up / Down to change file order.')}</p>
    <div class="media-actions">${button('run','生成 PDF','Create PDF','class="primary"')}${button('cancel','取消','Cancel','disabled')}${button('clear','清空','Clear')}${button('example','载入示例','Load example')}</div><div class="media-results" aria-live="polite"></div>`;
  const input=host.querySelector('[name=pdfs]'),list=host.querySelector('.media-files'),results=host.querySelector('.media-results'),status=createStatus(host),q=name=>host.querySelector(`[name=${name}]`);
  let files=[],busy=false,cancelled=false,loaded=[];
  const setBusy=value=>{busy=value;for(const b of host.querySelectorAll('button,input,select'))b.disabled=value;host.querySelector('[data-action=cancel]').disabled=!value;};
  function renderList(){list.replaceChildren();files.forEach((file,i)=>{const li=document.createElement('li'),label=document.createElement('span');label.textContent=`${file.name} · ${bytes(file.size)}${loaded[i]?` · ${loaded[i].getPageCount()} p.`:''} `;li.append(label);const controls=document.createElement('span');controls.className='media-actions';controls.innerHTML=button('up','上移','Up',i===0?'disabled':'')+button('down','下移','Down',i===files.length-1?'disabled':'')+button('remove','移除','Remove');controls.querySelector('[data-action=up]').onclick=()=>move(i,i-1);controls.querySelector('[data-action=down]').onclick=()=>move(i,i+1);controls.querySelector('[data-action=remove]').onclick=()=>{files.splice(i,1);loaded=[];results.replaceChildren();renderList();};li.append(controls);list.append(li);});applyLanguage(list);}
  function move(from,to){if(busy||to<0||to>=files.length)return;[files[from],files[to]]=[files[to],files[from]];loaded=[];results.replaceChildren();renderList();}
  function selectFiles(incoming){if(busy)return;results.replaceChildren();loaded=[];if(incoming.length>10||incoming.reduce((sum,f)=>sum+f.size,0)>LIMITS.pdfBytes){files=[];renderList();status('最多选择 10 个 PDF，总计不可超过 100 MiB。','Select up to 10 PDFs, no more than 100 MiB total.','error');return;}files=incoming;renderList();status(`已选择 ${files.length} 个 PDF。`,`Selected ${files.length} PDF(s).`);}
  attachDrop(host.querySelector('.media-drop'),input,selectFiles);
  function addOutput(outputBytes,name){const blob=new Blob([outputBytes],{type:'application/pdf'}),article=document.createElement('article');article.className='media-result';article.innerHTML=`<strong></strong><span>${t('文件大小','File size')}: ${bytes(blob.size)}</span>${button('download','下载 PDF','Download PDF')}`;article.querySelector('strong').textContent=name;article.querySelector('button').onclick=()=>downloadBlob(blob,name);results.append(article);applyLanguage(article);}
  host.querySelector('[data-action=run]').onclick=async()=>{
    if(busy)return;if(!files.length){status('请先选择 PDF。','Choose PDF files first.','error');return;}
    const mode=q('mode').value;if(mode!=='merge'&&files.length!==1){status('选页和拆分每次需要一个 PDF。','Extraction and splitting require exactly one PDF.','error');return;}
    setBusy(true);cancelled=false;loaded=[];results.replaceChildren();
    try {
      const {loadPdf,assemblePdf,splitPdf}=await import('./pdf.mjs');
      let totalPages=0;
      for(let i=0;i<files.length;i++){if(cancelled)throw new Error('Cancelled');status(`正在读取 ${i+1} / ${files.length}…`,`Reading ${i+1} / ${files.length}…`);const doc=await loadPdf(await files[i].arrayBuffer());totalPages+=doc.getPageCount();if(totalPages>LIMITS.pdfPages)throw new Error('Input exceeds 1000 page limit');loaded.push(doc);await new Promise(resolve=>setTimeout(resolve,0));}
      renderList();for(const b of list.querySelectorAll('button'))b.disabled=true;status('正在生成 PDF…','Creating PDF…');
      const outputs=mode==='split'?await splitPdf(loaded[0],q('ranges').value,()=>cancelled):[await assemblePdf(loaded,mode==='reorder'?[q('ranges').value]:undefined,()=>cancelled)];
      if(cancelled)throw new Error('Cancelled');
      outputs.forEach((output,i)=>addOutput(output,mode==='merge'?'merged.pdf':`${basename(files[0].name)}-${mode==='split'?`part-${i+1}`:'pages'}.pdf`));status(`已生成 ${outputs.length} 个 PDF。`,`Created ${outputs.length} PDF(s).`);
    }catch(error){status(...errorText(error),'error');}finally{setBusy(false);renderList();loaded=[];}
  };
  host.querySelector('[data-action=cancel]').onclick=()=>{cancelled=true;status('正在取消，当前 PDF 操作完成后停止。','Cancelling after the current PDF operation.');};
  host.querySelector('[data-action=clear]').onclick=()=>{files=[];loaded=[];input.value='';results.replaceChildren();renderList();status('已清空。','Cleared.');};
  host.querySelector('[data-action=example]').onclick=async()=>{try{const {pdfLibrary}=await import('./pdf.mjs'),{PDFDocument,StandardFonts,rgb}=await pdfLibrary(),doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica);for(let i=1;i<=3;i++){const page=doc.addPage([400,300]);page.drawText(`HandyBox - Page ${i}`,{x:45,y:150,size:25,font,color:rgb(.13,.4,.83)});}selectFiles([new File([await doc.save()],'handybox-example.pdf',{type:'application/pdf'})]);q('ranges').value='3,1-2';}catch(error){status(...errorText(error),'error');}};
}
