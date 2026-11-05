import {tools,categories,searchTools} from '../data/tools.mjs';
import {applyLanguage,getLanguage,message,readPreference,writePreference} from '../lib/ui.mjs';
const base=document.body.dataset.base||'';
const knownIds=new Set(tools.map(t=>t.id));
const safeList=key=>{const list=readPreference(key,[]);return Array.isArray(list)?[...new Set(list.filter(id=>knownIds.has(id)))]:[];};
let favorites=safeList('favorites');
let recent=safeList('recent');
let language=readPreference('language','zh')==='en'?'en':'zh';
let theme=readPreference('theme','system');if(!['light','dark','system'].includes(theme))theme='system';
const params=new URLSearchParams(location.search);
let category=params.get('view')==='favorites'?'favorites':params.get('category')||'all';
if(!['all','favorites',...categories.map(c=>c.id)].includes(category))category='all';
const search=document.getElementById('tool-search');
if(search)search.value=params.get('q')||'';
const media=matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){document.documentElement.dataset.theme=theme==='system'?(media.matches?'dark':'light'):theme;document.getElementById('theme-select').value=theme;}
function applyLocale(){
 document.documentElement.lang=language==='en'?'en':'zh-CN';applyLanguage();
 document.title=`${document.body.dataset[language==='en'?'pageTitleEn':'pageTitleZh']} · HandyBox`;
 document.getElementById('language-toggle').textContent=language==='en'?'中文':'EN';
 document.getElementById('language-toggle').setAttribute('aria-label',language==='en'?'切换为中文':'Switch to English');
 renderFavorites();renderCatalog();window.dispatchEvent(new CustomEvent('handybox:language',{detail:{language}}));
}
function renderFavorites(){
 document.getElementById('favorites-count').textContent=String(favorites.length);
 document.querySelectorAll('[data-favorite]').forEach(button=>{
  const selected=favorites.includes(button.dataset.favorite);button.setAttribute('aria-pressed',String(selected));
  const tool=tools.find(t=>t.id===button.dataset.favorite);
  const zh=`${selected?'取消收藏':'收藏'}${tool.zh}`,en=`${selected?'Unfavorite':'Favorite'} ${tool.en}`;
  button.dataset.labelZh=zh;button.dataset.labelEn=en;button.setAttribute('aria-label',message(zh,en));
 });
}
function renderCatalog(){
 if(!search)return;
 const query=search.value;const found=searchTools(query,category==='favorites'?'all':category).filter(t=>category!=='favorites'||favorites.includes(t.id));
 const ids=found.map(t=>t.id);
 document.querySelectorAll('#tool-catalog [data-card]').forEach(card=>{card.hidden=!ids.includes(card.dataset.id);card.style.order=String(ids.indexOf(card.dataset.id));});
 document.querySelectorAll('[data-section]').forEach(section=>{const count=found.filter(t=>t.category===section.dataset.section).length;section.hidden=!count;section.querySelector('.section-count').textContent=String(count);});
 document.getElementById('empty-state').hidden=found.length>0;
 document.getElementById('clear-filters').hidden=!query&&category==='all';
 document.getElementById('result-count').textContent=message(`共 ${found.length} 个工具，随时可用`,`${found.length} tools, ready when you are`);
 document.querySelectorAll('[data-category-link]').forEach(a=>{a.classList.toggle('active',a.dataset.categoryLink===category);if(a.dataset.categoryLink===category)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 const showRecent=!query&&category==='all'&&recent.length;
 document.getElementById('recent-section').hidden=!showRecent;
 document.querySelectorAll('#recent-section [data-card]').forEach(card=>{card.hidden=!recent.includes(card.dataset.id);card.style.order=String(recent.indexOf(card.dataset.id));});
}
document.getElementById('language-toggle').addEventListener('click',()=>{language=language==='zh'?'en':'zh';writePreference('language',language);applyLocale();});
document.getElementById('theme-select').addEventListener('change',event=>{theme=event.target.value;writePreference('theme',theme);applyTheme();});
media.addEventListener('change',applyTheme);
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-favorite]');if(!button)return;
 const id=button.dataset.favorite;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];writePreference('favorites',favorites);renderFavorites();renderCatalog();
 document.getElementById('global-status').textContent=message(favorites.includes(id)?'已加入收藏':'已取消收藏',favorites.includes(id)?'Added to favorites':'Removed from favorites');
});
function updateSearchUrl(){const url=new URL(location.href);url.search='';if(search.value)url.searchParams.set('q',search.value);if(category==='favorites')url.searchParams.set('view','favorites');else if(category!=='all')url.searchParams.set('category',category);history.replaceState(null,'',url);}
search?.addEventListener('input',()=>{renderCatalog();updateSearchUrl();});
document.querySelectorAll('[data-category-link]').forEach(a=>a.addEventListener('click',event=>{if(!search||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();category=a.dataset.categoryLink;renderCatalog();updateSearchUrl();}));
document.getElementById('clear-filters')?.addEventListener('click',()=>{search.value='';category='all';renderCatalog();updateSearchUrl();search.focus();});
document.getElementById('clear-recent')?.addEventListener('click',()=>{recent=[];writePreference('recent',recent);renderCatalog();});
document.getElementById('reset-preferences').addEventListener('click',()=>{
 favorites=[];recent=[];language='zh';theme='system';
 for(const key of ['favorites','recent','language','theme']){try{localStorage.removeItem(`handybox-${key}`);}catch{}}
 applyTheme();applyLocale();document.getElementById('global-status').textContent='已清除偏好与使用记录，当前工具输入保持不变。';
});
document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(search){search.focus();search.select();}else location.href=`${base}/?focus=search`;}if(event.key==='Escape'&&document.activeElement===search){search.value='';renderCatalog();updateSearchUrl();}});
const id=document.body.dataset.toolId;if(knownIds.has(id)){recent=[id,...recent.filter(x=>x!==id)].slice(0,6);writePreference('recent',recent);}
document.querySelectorAll('kbd').forEach(kbd=>{if(kbd.textContent.includes('K'))kbd.textContent=/Mac|iPhone|iPad/.test(navigator.platform)?'⌘ K':'Ctrl K';});
applyTheme();applyLocale();
if(search&&params.get('focus')==='search')search.focus();
