import {t,field,option,button,applyLanguage,downloadBlob,setStatus,showError,copy,saveCanvas,languageListener} from './shared.mjs';
import {extractPalette,paletteCSS} from './palette-core.mjs';
import {decodeImage} from '../media/index.mjs';

export function mount(root){
  root.innerHTML=`<section class="play-tool"><div class="play-layout"><div class="play-settings">
    <div class="play-drop">${t('从一张图片，找到一组好颜色。','A whole palette, hidden in a picture.','strong')}
      ${field('选择或拖入图片','Choose or drop an image','<input name="palette-image" type="file" accept="image/jpeg,image/png,image/webp">')}
      ${t('静态 JPG / PNG / WebP，最多 25 MiB、2400 万像素、单边 8192 px。','Static JPG / PNG / WebP, up to 25 MiB, 24 MP and 8192 px per side.','p')}</div>
    ${field('提取颜色数','Number of colors',`<select name="color-count">${[3,4,5,6,7,8,9,10].map(n=>option(n,String(n))).join('')}</select>`)}
    ${t('点击色块复制 HEX。占比根据可见像素采样估计；透明区域不参与，颜色单一时结果会少于设定数量。','Click a swatch to copy its HEX. Shares estimate sampled visible pixels; transparent areas are excluded, and simple images may yield fewer colors.','p').replace('<p ','<p class="play-hint" ')}
    <div class="play-actions">${button('example','试试日落配色','Try a sunset')}${button('clear','清空','Clear')}</div>
    <p class="play-status" role="status" aria-live="polite"></p>
  </div><div class="play-preview"><div class="play-preview-title"><h2>${t('图片与色卡','Image & palette')}</h2><small>${t('颜色都在这里','Find your colors')}</small></div>
    <div class="palette-photo"><div class="palette-empty"><span aria-hidden="true">◐</span>${t('放入一张喜欢的图片，或试试示例。','Drop in a favorite picture, or try the example.','p')}</div><canvas hidden data-label-zh="图片预览" data-label-en="Image preview" role="img"></canvas></div>
    <div class="palette-strip" aria-hidden="true"></div><div class="palette-swatches"></div>
    <div class="play-actions palette-downloads">${button('download-palette','下载色卡 PNG','Download palette PNG','class="primary" disabled')}${button('copy-css','复制 CSS','Copy CSS','disabled')}${button('download-css','下载 CSS','Download CSS','disabled')}</div>
  </div></div></section>`;
  const input=root.querySelector('[name=palette-image]'),count=root.querySelector('[name=color-count]'),canvas=root.querySelector('canvas'),empty=root.querySelector('.palette-empty'),swatches=root.querySelector('.palette-swatches'),strip=root.querySelector('.palette-strip');
  count.value='5';let source=null,colors=[],version=0;
  const enable=value=>root.querySelectorAll('[data-action=download-palette],[data-action=copy-css],[data-action=download-css]').forEach(b=>b.disabled=!value);
  function clear(){version++;source?.close?.();source=null;colors=[];input.value='';canvas.hidden=true;canvas.width=1;canvas.height=1;empty.hidden=false;swatches.replaceChildren();strip.replaceChildren();enable(false);setStatus(root);}
  function render(){
    if(!source)return;
    try{
      const sample=document.createElement('canvas'),scale=Math.min(1,160/Math.max(source.width,source.height));
      sample.width=Math.max(1,Math.round(source.width*scale));sample.height=Math.max(1,Math.round(source.height*scale));
      const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(source.image,0,0,sample.width,sample.height);
      colors=extractPalette(ctx.getImageData(0,0,sample.width,sample.height).data,Number(count.value));
      const previewScale=Math.min(1,900/source.width,500/source.height);canvas.width=Math.max(1,Math.round(source.width*previewScale));canvas.height=Math.max(1,Math.round(source.height*previewScale));
      canvas.getContext('2d').drawImage(source.image,0,0,canvas.width,canvas.height);canvas.hidden=false;empty.hidden=true;
      swatches.replaceChildren();strip.replaceChildren();
      for(const color of colors){
        const node=document.createElement('button');node.type='button';node.className='palette-swatch';
        node.dataset.labelZh=`复制 ${color.hex}`;node.dataset.labelEn=`Copy ${color.hex}`;
        node.innerHTML=`<span class="palette-chip" style="background:${color.hex}"></span><span class="palette-swatch-copy"><span class="palette-hex">${color.hex}</span><span class="palette-rgb">${color.rgb.join(', ')}</span><span class="palette-ratio">≈ ${(color.ratio*100).toFixed(1)}%</span></span>`;
        node.onclick=()=>copy(root,color.hex);swatches.append(node);
        const segment=document.createElement('span');segment.style.background=color.hex;segment.style.flex=String(color.ratio);strip.append(segment);
      }
      enable(true);setStatus(root,`找到 ${colors.length} 种颜色。`,`Found ${colors.length} colors.`);applyLanguage(root);
    }catch(error){colors=[];enable(false);swatches.replaceChildren();strip.replaceChildren();showError(root,error);}
  }
  async function select(files){
    if(!files.length)return;
    clear();const selected=version;setStatus(root,'正在读取图片…','Reading image…');
    let decoded;
    try{
      if(files.length!==1)throw new Error('Choose one image at a time');
      decoded=await decodeImage(files[0]);
      if(selected!==version){decoded.close();return;}
      source=decoded;render();
    }catch(error){decoded?.close();if(selected===version)showError(root,error);}
  }
  input.onchange=()=>select([...input.files]);
  const drop=root.querySelector('.play-drop');drop.ondragover=e=>{e.preventDefault();drop.dataset.over='';};drop.ondragleave=()=>delete drop.dataset.over;
  drop.ondrop=e=>{e.preventDefault();delete drop.dataset.over;select([...e.dataTransfer.files]);};
  count.onchange=render;
  root.querySelector('[data-action=clear]').onclick=clear;
  root.querySelector('[data-action=example]').onclick=()=>{
    clear();const image=document.createElement('canvas');image.width=900;image.height=560;const ctx=image.getContext('2d');
    ctx.fillStyle='#F6B886';ctx.fillRect(0,0,900,560);ctx.fillStyle='#F9DFA6';ctx.beginPath();ctx.arc(620,200,110,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#D97664';ctx.beginPath();ctx.moveTo(0,390);ctx.bezierCurveTo(180,130,310,420,540,300);ctx.bezierCurveTo(720,200,800,350,900,250);ctx.lineTo(900,560);ctx.lineTo(0,560);ctx.fill();
    ctx.fillStyle='#566D77';ctx.beginPath();ctx.moveTo(0,450);ctx.bezierCurveTo(300,310,360,550,680,400);ctx.lineTo(900,440);ctx.lineTo(900,560);ctx.lineTo(0,560);ctx.fill();
    ctx.fillStyle='#2E4656';ctx.beginPath();ctx.moveTo(0,510);ctx.bezierCurveTo(300,400,600,590,900,470);ctx.lineTo(900,560);ctx.lineTo(0,560);ctx.fill();
    source={image,width:900,height:560};render();
  };
  root.querySelector('[data-action=copy-css]').onclick=()=>copy(root,paletteCSS(colors));
  root.querySelector('[data-action=download-css]').onclick=()=>downloadBlob(new Blob([paletteCSS(colors)],{type:'text/css;charset=utf-8'}),'handybox-palette.css');
  root.querySelector('[data-action=download-palette]').onclick=async()=>{
    try{
      if(!colors.length||!source)return;
      const out=document.createElement('canvas');out.width=1200;out.height=920;const ctx=out.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,1200,920);
      const s=Math.min(1200/source.width,650/source.height),w=source.width*s,h=source.height*s;
      ctx.fillStyle='#f1f3f5';ctx.fillRect(0,0,1200,650);ctx.drawImage(source.image,(1200-w)/2,(650-h)/2,w,h);
      colors.forEach((color,i)=>{const width=1200/colors.length,x=i*width;ctx.fillStyle=color.hex;ctx.fillRect(x,650,width,130);ctx.fillStyle='#172235';ctx.font=`600 ${colors.length>7?15:20}px Consolas, monospace`;ctx.fillText(color.hex,x+12,815);ctx.font='16px sans-serif';ctx.fillStyle='#64748b';ctx.fillText(`≈ ${(color.ratio*100).toFixed(1)}%`,x+12,846);});
      ctx.fillStyle='#64748b';ctx.font='16px sans-serif';ctx.fillText('HandyBox / Color palette',24,895);await saveCanvas(out,'handybox-palette.png');
    }catch(error){showError(root,error);}
  };
  languageListener(root);window.addEventListener('pagehide',event=>{if(!event.persisted){version++;source?.close?.();}});
}
