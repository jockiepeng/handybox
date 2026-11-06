import {t,field,button,escapeHtml,setStatus,showError,languageListener} from './shared.mjs';
import {message} from '../../lib/ui.mjs';
import {parseEntries,pickEntry,wheelTarget,randomUnit} from './wheel-core.mjs';

const fills=['#427BCE','#73B3A5','#F1C46D','#DC8B83','#9C94CE','#79ADCA','#C1CE92','#D59AB4'];
export function mount(root){
  root.innerHTML=`<section class="play-tool"><div class="play-layout"><div class="play-settings">
    ${field('把纠结的选项交给转盘','Let the wheel decide','<textarea name="entries" rows="8" spellcheck="false" maxlength="10000"></textarea>')}
    ${t('每行一个选项，可写「面条 | 3」设置权重。支持 2–50 项，权重 1–100。修改选项或抽取模式会开始新一轮。','One option per line. Use “Pizza | 3” for a weight. Supports 2–50 options, weights 1–100. Editing options or changing the mode starts a new round.','p').replace('<p ','<p class="play-hint" ')}
    <label class="play-check"><input name="no-repeat" type="checkbox">${t('不重复抽取','Draw without repeats')}</label>
    <div class="play-actions">${button('spin','转一下！','Spin the wheel!','class="primary"')}${button('reset','重置本轮','Reset round')}${button('example','晚餐吃什么','Dinner ideas')}</div>
    <p class="play-status" role="status" aria-live="polite"></p>
    <div><h2 class="wheel-history-title">${t('抽取记录（最近 20 次）','Draw history (last 20)')}</h2><ol class="wheel-history"></ol></div>
    <div class="wheel-odds" aria-label="各选项概率" data-label-zh="各选项概率" data-label-en="Option probabilities"></div>
  </div><div class="play-preview">
    <div class="wheel-stage"><span class="wheel-pointer" aria-hidden="true"></span><canvas width="840" height="840" role="img" data-label-zh="决策转盘，结果在下方显示" data-label-en="Decision wheel; result is shown below"></canvas><span class="wheel-center" aria-hidden="true">✦</span></div>
    <div class="wheel-result" aria-live="polite"><span class="wheel-result-label">${t('这次就选','Your pick')}</span><div class="wheel-winner">—</div></div>
    ${t('扇区大小就是抽中概率。开启不重复后，已抽选项会在下次旋转前移除。','Sector size shows the chance of winning. Without repeats, drawn options leave the wheel before the next spin.','p').replace('<p ','<p class="play-hint" ')}
  </div></div></section>`;
  const input=root.querySelector('[name=entries]'),unique=root.querySelector('[name=no-repeat]'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),spin=root.querySelector('[data-action=spin]'),winner=root.querySelector('.wheel-winner'),history=root.querySelector('.wheel-history'),odds=root.querySelector('.wheel-odds');
  let entries=[],used=new Set(),spinning=false,angle=0,animation=null;
  const remaining=()=>entries.filter(entry=>!unique.checked||!used.has(entry.id));
  function draw(list){
    ctx.clearRect(0,0,840,840);
    const total=list.reduce((sum,e)=>sum+e.weight,0);let start=-Math.PI/2;
    if(!total){ctx.beginPath();ctx.arc(420,420,382,0,Math.PI*2);ctx.fillStyle='#dce3ed';ctx.fill();return;}
    for(const entry of list){
      const arc=entry.weight/total*Math.PI*2,end=start+arc;
      ctx.beginPath();ctx.moveTo(420,420);ctx.arc(420,420,382,start,end);ctx.closePath();ctx.fillStyle=fills[entry.id%fills.length];ctx.fill();ctx.strokeStyle='#ffffffb0';ctx.lineWidth=3;ctx.stroke();
      if(arc>.14){
        ctx.save();ctx.translate(420,420);ctx.rotate(start+arc/2);ctx.textAlign='right';ctx.textBaseline='middle';ctx.font=`600 ${arc<.3?19:26}px "Segoe UI", "Microsoft YaHei", sans-serif`;ctx.fillStyle='#152d3c';
        const chars=[...entry.label];let label=chars.slice(0,12).join('')+(chars.length>12?'…':'');
        while(ctx.measureText(label).width>250&&label.length>1)label=[...label].slice(0,-2).join('')+'…';
        ctx.fillText(label,348,0);ctx.restore();
      }
      start=end;
    }
    ctx.beginPath();ctx.arc(420,420,386,0,Math.PI*2);ctx.strokeStyle='#ffffff';ctx.lineWidth=8;ctx.stroke();
  }
  function updateOdds(){const list=remaining(),total=list.reduce((n,e)=>n+e.weight,0);odds.innerHTML=list.map(e=>`<span>${escapeHtml(e.label)} · ${(100*e.weight/total).toFixed(1)}%</span>`).join('');}
  function reset(){
    if(spinning)return;
    used.clear();history.replaceChildren();winner.textContent='—';angle=0;canvas.style.transform='rotate(0deg)';spin.disabled=false;setStatus(root);
    try{entries=parseEntries(input.value);draw(entries);updateOdds();}catch(error){entries=[];draw([]);odds.replaceChildren();showError(root,error);}
  }
  function example(){if(spinning)return;input.value=message('火锅\n寿司\n面条\n披萨\n饺子\n家常菜','Hot pot\nSushi\nNoodles\nPizza\nDumplings\nHome cooking');reset();}
  function busy(value){spinning=value;root.querySelectorAll('input,textarea,button').forEach(node=>node.disabled=value);}
  spin.onclick=async()=>{
    if(spinning)return;
    try{
      // Validate the current text again so programmatic changes cannot leave stale entries.
      const current=parseEntries(input.value);
      if(JSON.stringify(current)!==JSON.stringify(entries)){entries=current;used.clear();history.replaceChildren();}
      const list=remaining();if(!list.length){spin.disabled=true;return;}
      const index=pickEntry(list,randomUnit()),choice=list[index];
      draw(list);angle=0;canvas.style.transform='rotate(0deg)';const target=wheelTarget(list,index,angle,randomUnit());
      busy(true);winner.textContent='…';setStatus(root,'转盘转动中…','Spinning…');
      const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(!reduce){animation=canvas.animate([{transform:'rotate(0deg)'},{transform:`rotate(${target}deg)`}],{duration:3200,easing:'cubic-bezier(.13,.72,.13,1)',fill:'forwards'});await animation.finished;}
      angle=target%360;canvas.style.transform=`rotate(${angle}deg)`;animation?.cancel();animation=null;
      winner.textContent=choice.label;const item=document.createElement('li');item.textContent=choice.label;history.append(item);if(history.children.length>20)history.firstElementChild.remove();
      if(unique.checked)used.add(choice.id);updateOdds();busy(false);
      const left=remaining().length;
      if(!left){spin.disabled=true;setStatus(root,'全部抽完了，重置本轮可以再玩一次。','All options drawn. Reset the round to play again.');}
      else setStatus(root,unique.checked?`还有 ${left} 个选项待抽。`:'选好了！再转一次也可以。',unique.checked?`${left} options remaining.`:'There is your pick! Spin again whenever you like.');
    }catch(error){animation?.cancel();animation=null;busy(false);showError(root,error);}
  };
  input.oninput=reset;unique.onchange=reset;
  root.querySelector('[data-action=reset]').onclick=reset;root.querySelector('[data-action=example]').onclick=example;
  example();languageListener(root);
  window.addEventListener('pagehide',event=>{if(!event.persisted)animation?.cancel();});
}
