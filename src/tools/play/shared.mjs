import '../../styles/playful.css';
import {applyLanguage,escapeHtml,copyText,downloadBlob} from '../../lib/ui.mjs';
export {applyLanguage,escapeHtml,downloadBlob};
export const t=(zh,en,tag='span')=>`<${tag} data-zh="${escapeHtml(zh)}" data-en="${escapeHtml(en)}">${escapeHtml(zh)}</${tag}>`;
export const field=(zh,en,control)=>`<label class="play-field">${t(zh,en)}${control}</label>`;
export const option=(value,zh,en=zh)=>`<option value="${value}" data-zh="${escapeHtml(zh)}" data-en="${escapeHtml(en)}">${escapeHtml(zh)}</option>`;
export const button=(action,zh,en,extra='')=>`<button type="button" data-action="${action}" ${extra}>${t(zh,en)}</button>`;
export function setStatus(root,zh='',en='',kind='info'){
  const node=root.querySelector('.play-status');node.dataset.zh=zh;node.dataset.en=en;node.dataset.kind=kind;applyLanguage(node);
}
const errors=[
  [/No visible/,'图片没有足够可见的像素，请换一张图片。'],
  [/animated/i,'请使用静态图片，暂不支持动画。'],
  [/exceeds limit/i,'图片超过限制：25 MiB、2400 万像素、单边 8192 px。'],
  [/Unsupported|Invalid PNG|Invalid JPEG|Invalid WebP|dimensions|decode/i,'无法读取图片，请使用有效的静态 JPEG、PNG 或 WebP。'],
  [/2–50/,'请填写 2–50 个选项，每行一个。'],
  [/1–60/,'每个选项需要 1–60 个字符，最多一个 | 分隔符。'],
  [/Weights/,'权重必须是 1–100 的整数，例如：面条 | 3。'],
  [/12,000/,'代码最多 12,000 个字符（Tab 按两个空格计）。'],
  [/200 lines/,'代码最多 200 行，请减少内容。'],
  [/too tall|too large/,'图片过大，请减少代码、降低字号或增大卡片宽度。'],
  [/clipboard|copy|Select the result/i,'复制失败，请手动选择内容复制。'],
];
export function showError(root,error){const en=error?.message||String(error);setStatus(root,errors.find(([re])=>re.test(en))?.[1]||'处理失败，请检查输入后重试。',en,'error');}
export async function copy(root,text){try{await copyText(text);setStatus(root,'已复制。','Copied.');}catch(error){showError(root,error);}}
export async function saveCanvas(canvas,name){
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('Could not encode PNG');downloadBlob(blob,name);
}
export function languageListener(root,render){window.addEventListener('handybox:language',()=>{applyLanguage(root);render?.();});applyLanguage(root);}
