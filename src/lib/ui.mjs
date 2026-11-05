export function getLanguage(){return typeof document!=='undefined'&&document.documentElement.lang==='en'?'en':'zh';}
export function message(zh,en){return getLanguage()==='en'?en:zh;}
export function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function applyLanguage(root=document){
  const lang=getLanguage();
  const elements=[...(root.matches?.('[data-zh]')?[root]:[]),...root.querySelectorAll('[data-zh][data-en]')];
  for(const el of elements) if(!['INPUT','TEXTAREA'].includes(el.tagName)) el.textContent=el.dataset[lang];
  for(const el of root.querySelectorAll('[data-placeholder-zh]'))el.placeholder=el.dataset[lang==='en'?'placeholderEn':'placeholderZh'];
  for(const el of root.querySelectorAll('[data-label-zh]'))el.setAttribute('aria-label',el.dataset[lang==='en'?'labelEn':'labelZh']);
  for(const el of root.querySelectorAll('[data-title-zh]'))el.title=el.dataset[lang==='en'?'titleEn':'titleZh'];
}
export function downloadBlob(blob,name){
  const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export async function copyText(text){
  if(navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(text);return;}catch{}}
  const input=document.createElement('textarea');input.value=text;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();if(!copied)throw new Error(message('请手动选择结果并复制。','Select the result and copy it manually.'));
}
export function notify(root,zh,en,kind='info'){
  let area=root.querySelector('[data-notification]');
  if(!area){area=document.createElement('div');area.dataset.notification='';root.prepend(area);}
  area.className=`notice ${kind}`;area.setAttribute('role',kind==='error'?'alert':'status');area.dataset.zh=zh;area.dataset.en=en;area.textContent=message(zh,en);area.hidden=false;
}
export function readPreference(key,fallback){try{const v=localStorage.getItem(`handybox-${key}`);return v===null?fallback:JSON.parse(v);}catch{return fallback;}}
export function writePreference(key,value){try{localStorage.setItem(`handybox-${key}`,JSON.stringify(value));}catch{}}
