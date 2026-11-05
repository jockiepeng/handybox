import {applyLanguage,notify} from '../lib/ui.mjs';
const root=document.getElementById('workbench');
async function start(){
 try{
   const id=root.dataset.tool;
   if(id.startsWith('I')||id==='F02'){const {mountMediaTool}=await import('../tools/media/index.mjs');await mountMediaTool(root,id);}
   else {const {mountTextTool}=await import('../tools/text/index.mjs');await mountTextTool(root,id);}
   applyLanguage(root);
 }catch(error){console.error(error);root.replaceChildren();notify(root,'工具加载失败，请刷新页面后重试。','Could not load this tool. Reload the page and try again.','error');}
 finally{root.setAttribute('aria-busy','false');}
}
if(root)start();
