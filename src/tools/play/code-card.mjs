import {t,field,option,button,setStatus,showError,saveCanvas,languageListener} from './shared.mjs';
import {prepareCode,highlightCode,wrapTokens} from './code-core.mjs';

const themes={
  midnight:{bg:'#20283D',text:'#EDF2FC',muted:'#8A9AB7',keyword:'#CEADFF',string:'#A8DFBA',number:'#F5BF86',comment:'#8293AF',function:'#98CFFF',operator:'#F4B6CC',punctuation:'#C9D3E6'},
  paper:{bg:'#FFFFFF',text:'#23344B',muted:'#778497',keyword:'#7742A5',string:'#20754E',number:'#AB560D',comment:'#708093',function:'#2565A2',operator:'#9F3A60',punctuation:'#4E6077'},
  forest:{bg:'#173C37',text:'#E4F4E9',muted:'#82ACA0',keyword:'#E7C48B',string:'#ABE1AC',number:'#F3AE97',comment:'#82A99B',function:'#A5DADB',operator:'#F3C6B5',punctuation:'#C2D9CF'},
};
const backgrounds={iris:['#BDB6E9','#839EC6'],peach:['#F1C2A6','#D88A9E'],mint:['#B2DFCF','#7FADB8'],solid:['#DCE5EF','#DCE5EF']};
const demo=`// Small things, made a little easier.\nconst colors = ["#427BCE", "#73B3A5", "#F1C46D"];\n\nfunction makeSomethingNice(name) {\n  return {\n    message: \`Hello, \${name}! 👋\`,\n    palette: colors,\n    madeWith: "HandyBox"\n  };\n}\n\nconsole.log(makeSomethingNice("世界"));`;

export function mount(root){
  root.innerHTML=`<section class="play-tool"><div class="play-layout"><div class="play-settings">
    ${field('把代码变成一张好看的卡片','Turn your code into a keepsake','<textarea class="code-editor" name="code" rows="10" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>')}
    <div class="play-options">${field('代码语言','Language',`<select name="code-language">${[['javascript','JavaScript'],['typescript','TypeScript'],['json','JSON'],['python','Python'],['css','CSS'],['markup','HTML'],['plain','纯文本','Plain text']].map(v=>option(...v)).join('')}</select>`)}
    ${field('代码主题','Code theme',`<select name="code-theme">${option('midnight','午夜蓝','Midnight')}${option('paper','白纸','Paper')}${option('forest','深森林','Forest')}</select>`)}
    ${field('背景','Backdrop',`<select name="card-background">${option('iris','鸢尾紫','Iris')}${option('peach','蜜桃','Peach')}${option('mint','薄荷','Mint')}${option('solid','雾蓝纯色','Solid mist')}</select>`)}
    ${field('窗口样式','Window style',`<select name="window-style">${option('mac','圆点窗口','Window dots')}${option('minimal','极简','Minimal')}</select>`)}
    ${field('卡片宽度','Card width',`<select name="card-width">${[640,800,960,1200].map(n=>option(n,`${n} px`)).join('')}</select>`)}
    ${field('字号','Font size',`<select name="font-size">${[14,16,18,20,24].map(n=>option(n,`${n} px`)).join('')}</select>`)}
    ${field('外侧留白','Outer padding',`<select name="card-padding">${[24,40,56,72].map(n=>option(n,`${n} px`)).join('')}</select>`)}
    ${field('标题','Title','<input name="card-title" type="text" maxlength="80" value="hello-world.js">')}</div>
    <label class="play-check"><input name="line-numbers" type="checkbox" checked>${t('显示行号','Show line numbers')}</label>
    <div class="play-actions">${button('example','载入示例','Load example')}${button('clear','清空','Clear')}</div>
    ${t('长行自动换行，最多 12,000 字符、200 行。下载为 2 倍清晰度 PNG；高亮仅用于展示，代码不会执行。','Long lines wrap. Up to 12,000 characters and 200 lines. Downloads are 2× PNGs; highlighting is for display and code is never executed.','p').replace('<p ','<p class="play-hint" ')}
    <p class="play-status" role="status" aria-live="polite"></p>
  </div><div class="play-preview"><div class="play-preview-title"><h2>${t('成品预览','Your card')}</h2><small>${t('写好，就分享','Ready to share')}</small></div>
    <div class="code-stage"><canvas role="img" data-label-zh="代码卡片预览" data-label-en="Code card preview"></canvas><div class="code-empty" hidden>${t('在左侧输入代码，预览会出现在这里。','Enter code to see your card here.')}</div></div>
    <div class="code-caption"><span class="code-size"></span>${button('download-code','下载 PNG','Download PNG','class="primary"')}</div>
  </div></div></section>`;
  const q=name=>root.querySelector(`[name=${name}]`),canvas=root.querySelector('canvas'),download=root.querySelector('[data-action=download-code]'),size=root.querySelector('.code-size'),empty=root.querySelector('.code-empty');
  q('code').value=demo;q('card-width').value='800';q('font-size').value='18';q('card-padding').value='40';let timer;
  function render(){
    clearTimeout(timer);
    try{
      const text=prepareCode(q('code').value);if(!text.trim()){canvas.hidden=true;empty.hidden=false;download.disabled=true;size.textContent='';setStatus(root);return;}
      const width=Number(q('card-width').value),padding=Number(q('card-padding').value),fontSize=Number(q('font-size').value),lineHeight=fontSize*1.65,lineNumbers=q('line-numbers').checked;
      const theme=themes[q('code-theme').value],font=`${fontSize}px Consolas, "Microsoft YaHei", monospace`;
      const measureCanvas=document.createElement('canvas'),measure=measureCanvas.getContext('2d');measure.font=font;
      const gutter=lineNumbers?Math.max(34,measure.measureText(String(text.split('\n').length)).width+18):0;
      const innerWidth=width-2*padding,bodyX=padding+24+gutter,maxWidth=innerWidth-48-gutter;
      const rows=wrapTokens(highlightCode(text,q('code-language').value),maxWidth,value=>measure.measureText(value).width);
      const header=52,bodyPadding=24,height=Math.ceil(2*padding+header+bodyPadding*2+rows.length*lineHeight);
      if(width*height*4>16_000_000||height*2>8192)throw new Error('Card is too tall or too large');
      canvas.width=width*2;canvas.height=height*2;const ctx=canvas.getContext('2d');ctx.scale(2,2);
      const bg=backgrounds[q('card-background').value],gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,bg[0]);gradient.addColorStop(1,bg[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
      ctx.save();ctx.shadowColor='#18253838';ctx.shadowBlur=24;ctx.shadowOffsetY=12;ctx.fillStyle=theme.bg;ctx.beginPath();ctx.roundRect(padding,padding,innerWidth,height-2*padding,12);ctx.fill();ctx.restore();
      if(q('window-style').value==='mac'){
        ['#F17F79','#E8C16D','#86C49D'].forEach((color,i)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(padding+24+i*19,padding+25,5.5,0,Math.PI*2);ctx.fill();});
      }
      ctx.fillStyle=theme.muted;ctx.font='13px "Segoe UI", "Microsoft YaHei", sans-serif';ctx.textAlign='center';
      const titleWidth=innerWidth-180;let title=q('card-title').value.replace(/[\r\n]/g,' ');const titleChars=[...title];
      while(ctx.measureText(title).width>titleWidth&&titleChars.length){titleChars.pop();title=titleChars.join('')+'…';}ctx.fillText(title,padding+innerWidth/2,padding+30);
      ctx.textAlign='left';ctx.textBaseline='top';ctx.font=font;
      rows.forEach((row,i)=>{
        const y=padding+header+bodyPadding+i*lineHeight;
        if(lineNumbers&&row.number!==null){ctx.fillStyle=theme.muted;ctx.textAlign='right';ctx.fillText(String(row.number),bodyX-18,y);ctx.textAlign='left';}
        let x=bodyX;
        for(const token of row.tokens){ctx.fillStyle=theme[token.type]||(['boolean','constant'].includes(token.type)?theme.number:['tag','attr-name','class-name','builtin'].includes(token.type)?theme.keyword:theme.text);ctx.fillText(token.text,x,y);x+=ctx.measureText(token.text).width;}
      });
      canvas.hidden=false;empty.hidden=true;download.disabled=false;size.textContent=`${canvas.width} × ${canvas.height} px · PNG`;setStatus(root);
    }catch(error){canvas.hidden=true;empty.hidden=true;download.disabled=true;size.textContent='';showError(root,error);}
  }
  for(const node of root.querySelectorAll('input,select,textarea'))node.addEventListener('input',()=>{clearTimeout(timer);download.disabled=true;timer=setTimeout(render,120);});
  root.querySelector('[data-action=example]').onclick=()=>{q('code').value=demo;q('code').scrollTop=0;render();};root.querySelector('[data-action=clear]').onclick=()=>{q('code').value='';render();};
  download.onclick=async()=>{try{render();if(!download.disabled)await saveCanvas(canvas,'handybox-code.png');}catch(error){showError(root,error);}};
  render();languageListener(root);window.addEventListener('pagehide',event=>{if(!event.persisted)clearTimeout(timer);});
}
