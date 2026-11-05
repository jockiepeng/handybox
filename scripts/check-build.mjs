import {readFile,stat} from 'node:fs/promises';
import {tools} from '../src/data/tools.mjs';
const repo=process.env.GITHUB_REPOSITORY?.split('/')[1]||'handybox';
const base=(process.env.BASE_PATH??(repo.endsWith('.github.io')?'/':`/${repo}/`)).replace(/\/$/,'');
for(const path of ['index.html','404.html',...tools.map(t=>`tools/${t.slug}/index.html`)]){
 const html=await readFile(`dist/${path}`,'utf8');
 for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  const url=match[1].split(/[?#]/)[0];if(!url||!url.startsWith('/'))continue;
  if(base&&!url.startsWith(base+'/'))throw new Error(`Wrong base in ${path}: ${url}`);
  let local=url.slice(base.length).replace(/^\//,'');if(!local||local.endsWith('/'))local+='index.html';
  await stat(`dist/${local}`).catch(()=>{throw new Error(`Broken resource in ${path}: ${url}`);});
 }
}
console.log(`Checked ${tools.length+2} static pages and their local links (${base||'/'}).`);
