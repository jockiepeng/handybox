import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, stat, mkdir, access} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {deflateSync} from 'node:zlib';
import {chromium} from 'playwright';
import {PDFDocument} from 'pdf-lib';
import {tools} from '../src/data/tools.mjs';

// Run after `npm run build`. No dev server, network service, or test fixture download is needed.
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),dist=resolve(root,'dist');
const base='/'+(process.env.BASE_PATH??'/handybox/').split('/').filter(Boolean).join('/')+'/';
const basePath=base==='//'?'/':base;
const screenshots=resolve(root,'.tools/screenshots');
await access(resolve(dist,'index.html')).catch(()=>{throw new Error('dist/index.html is missing. Run npm run build before npm run test:browser.');});
await mkdir(screenshots,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!pathname.startsWith(basePath)){res.writeHead(404).end();return;}
    let file=resolve(dist,pathname.slice(basePath.length));
    if(file!==dist&&!file.startsWith(dist+sep)){res.writeHead(403).end();return;}
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(body);
  }catch{res.writeHead(404).end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin=`http://127.0.0.1:${server.address().port}`,home=origin+basePath;
const errors=[],consoleErrors=[],externalRequests=[],failedResponses=[];
let browser;
const step=async(name,fn)=>{if(process.env.TEST_FILTER&&!name.includes(process.env.TEST_FILTER))return;try{await fn();console.log(`PASS ${name}`);}catch(error){errors.push({name,error});console.error(`FAIL ${name}: ${error.stack||error}`);}};

// A tiny independently encoded RGBA PNG: left half red, right half blue, with a transparent corner.
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function pngChunk(type,data){const tag=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([tag,data])));return Buffer.concat([length,tag,data,crc]);}
function makePng(width=16,height=10){const head=Buffer.alloc(13);head.writeUInt32BE(width);head.writeUInt32BE(height,4);head[8]=8;head[9]=6;const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const n=y*(width*4+1)+1+x*4;raw[n+(x<width/2?0:2)]=255;raw[n+3]=x===0&&y===0?0:255;}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',head),pngChunk('IDAT',deflateSync(raw)),pngChunk('IEND',Buffer.alloc(0))]);}
const png=makePng(),imageFile={name:'browser-fixture.png',mimeType:'image/png',buffer:png};
const pdfDoc=await PDFDocument.create();for(const size of [[111,201],[222,202],[333,203]])pdfDoc.addPage(size);
const pdfFile={name:'browser-fixture.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdfDoc.save())};
const pdfDoc2=await PDFDocument.create();pdfDoc2.addPage([444,204]);
const pdfFile2={name:'second.pdf',mimeType:'application/pdf',buffer:Buffer.from(await pdfDoc2.save())};

try{
  const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const executablePath=process.env.BROWSER_PATH||(process.platform==='win32'&&await access(edge).then(()=>true,()=>false)?edge:undefined);
  browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--disable-background-networking']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,locale:'en-US',timezoneId:'Asia/Shanghai'});
  const watch=async ctx=>{
    await ctx.route('**/*',route=>{const url=route.request().url();if(/^https?:/.test(url)&&new URL(url).origin!==origin){externalRequests.push(url);return route.abort();}return route.continue();});
    ctx.on('page',page=>{
      page.on('pageerror',error=>consoleErrors.push(`pageerror ${page.url()}: ${error.message}`));
      page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(`console ${page.url()}: ${msg.text()}`);});
      page.on('response',response=>{if(response.url().startsWith(origin)&&response.status()>=400)failedResponses.push(`${response.status()} ${response.url()}`);});
    });
  };
  await watch(context);
  const page=await context.newPage();page.setDefaultTimeout(10000);
  const field=key=>page.locator(`#workbench [data-field="${key}"]`);
  const action=key=>page.locator(`#workbench [data-action="${key}"]`).first();
  const output=()=>page.locator('.text-result').textContent();
  const openTool=async id=>{const tool=tools.find(t=>t.id===id);const response=await page.goto(`${home}tools/${tool.slug}/`);assert.equal(response.status(),200);await page.locator('#workbench[aria-busy="false"]').waitFor();assert.equal(await page.locator('#workbench').getAttribute('data-tool'),id);};
  const run=async(expectedError=false)=>{
    await page.locator('#workbench form [type=submit]').click();
    await page.waitForFunction(()=>{const s=document.querySelector('.text-status');return s&&s.dataset.en!=='Processing…'&&document.querySelector('#workbench [type=submit]')?.disabled===false;});
    const status=page.locator('.text-status');assert.equal(await status.getAttribute('data-kind'),expectedError?'error':'info',await status.textContent());
    if(!expectedError)assert.equal(await status.getAttribute('data-en'),'Done');
    return output();
  };
  const download=async locator=>{const pending=page.waitForEvent('download');await locator.click();const item=await pending;assert.equal(await item.failure(),null);const bytes=await readFile(await item.path());assert.ok(bytes.length>0,'Downloaded file is empty');return {bytes,name:item.suggestedFilename()};};
  const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Horizontal overflow at ${page.url()}`);

  await step('tool principles: all tools, bilingual dialog, keyboard, preserved input and mobile',async()=>{
    for(const tool of tools){
      await openTool(tool.id);
      const opener=page.locator('#principles-open'),dialog=page.locator('#principles-dialog');
      assert.equal(await opener.count(),1,`${tool.id}: missing explanation button`);
      assert.equal(await opener.textContent().then(t=>t.trim()),'实现原理');
      assert.equal(await dialog.isVisible(),false);
      const editable=page.locator('#workbench textarea[data-field="input"]');
      if(await editable.count())await editable.fill('keep 你好 😀');
      await opener.click();
      assert.ok(await dialog.isVisible());
      assert.equal(await dialog.getAttribute('aria-labelledby'),'principles-title');
      assert.ok((await dialog.locator('#principles-title').textContent()).includes(tool.zh));
      assert.equal(await dialog.locator('.principle-steps li').count(),3);
      assert.ok((await dialog.locator('.principle-implementation').textContent()).trim().length>20);
      assert.ok(await dialog.locator('.principle-detail').count()>0,`${tool.id}: missing technical explanation`);
      for(const part of ['input','output','explanation'])assert.ok((await dialog.locator(`.principle-example-${part}`).textContent()).trim(),`${tool.id}: missing worked example ${part}`);
      assert.ok(await dialog.locator('pre code').evaluateAll(nodes=>nodes.every(n=>n.childElementCount===0&&n.textContent===n.dataset.zh)),`${tool.id}: code and examples render literally, including markup and escapes`);
      await dialog.locator('[data-principle-jump="principle-example-heading"]').click();
      assert.ok(await dialog.locator('#principle-example-heading').evaluate(n=>n===document.activeElement));
      assert.ok(await dialog.evaluate(n=>n.scrollTop>0),'Example shortcut scrolls the long explanation');
      assert.ok(await page.evaluate(()=>document.querySelector('#principles-dialog').contains(document.activeElement)));
      for(let i=0;i<4;i++)await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(()=>document.querySelector('#principles-dialog').contains(document.activeElement)));
      await page.keyboard.press('Escape');
      assert.equal(await dialog.isVisible(),false);
      assert.ok(await opener.evaluate(n=>n===document.activeElement));
      if(await editable.count())assert.equal(await editable.inputValue(),'keep 你好 😀');
      await page.locator('#language-toggle').click();
      await opener.click();
      assert.equal(await opener.textContent().then(t=>t.trim()),'How it works');
      assert.ok((await dialog.locator('#principles-title').textContent()).includes(tool.en));
      assert.doesNotMatch(await dialog.locator('.principle-summary,.principle-steps,.principle-implementation,.principle-limits').allTextContents().then(t=>t.join(' ')),/[\u4e00-\u9fff]/);
      assert.ok(await dialog.locator('[data-en]').evaluateAll(nodes=>nodes.every(n=>n.textContent===n.dataset.en)),`${tool.id}: all explanation text switches to English, including examples`);
      await page.locator('#principles-close').click();
      if(await editable.count())assert.equal(await editable.inputValue(),'keep 你好 😀');
      await page.locator('#language-toggle').click();
    }
    await openTool('D01');
    await page.locator('#principles-open').click();
    await page.screenshot({path:resolve(screenshots,'principles-desktop.png'),fullPage:true});
    await page.locator('[data-principle-jump="principle-details-heading"]').click();
    await page.screenshot({path:resolve(screenshots,'principles-technical-desktop.png'),fullPage:true});
    await page.mouse.click(4,4);
    assert.equal(await page.locator('#principles-dialog').isVisible(),false,'Backdrop closes the dialog');
    await page.locator('#theme-select').selectOption('dark');
    await page.setViewportSize({width:390,height:844});
    for(const id of ['D01','I01','F02']){
      await openTool(id);await page.locator('#principles-open').click();await noOverflow();
      assert.ok(await page.locator('#principles-dialog').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
      assert.ok(await page.locator('#principles-close').isVisible());
      await page.locator('[data-principle-jump="principle-example-heading"]').click();
      assert.ok(await page.locator('#principle-example-heading').evaluate(n=>{
        const box=n.getBoundingClientRect(),header=document.querySelector('.principles-header').getBoundingClientRect();
        return box.top>=header.bottom&&box.bottom<innerHeight;
      }),'Example shortcut leaves its heading below the sticky header');
      if(id==='I01')await page.screenshot({path:resolve(screenshots,'principles-example-mobile-dark.png'),fullPage:true});
      await page.locator('#principles-dialog').evaluate(n=>n.scrollTop=n.scrollHeight);
      assert.ok(await page.locator('.principle-limits').isVisible());
      if(id==='I01')await page.screenshot({path:resolve(screenshots,'principles-mobile-dark.png'),fullPage:true});
      await page.locator('#principles-close').click();
      await page.locator('#principles-open').click();
      assert.equal(await page.locator('#principles-dialog').evaluate(n=>n.scrollTop),0,'Reopening starts at the overview');
      await page.keyboard.press('Shift+Tab');
      assert.ok(await page.locator('[data-principle-jump="principle-limits-heading"]').evaluate(n=>n===document.activeElement),'Reverse Tab stays inside the dialog');
      await page.keyboard.press('Tab');
      assert.ok(await page.locator('#principles-close').evaluate(n=>n===document.activeElement));
      await page.keyboard.press('Escape');
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#theme-select').selectOption('light');
  });

  await step('catalog, cross-language search, keyboard shortcut and favorites',async()=>{
    await page.goto(home);assert.equal(await page.locator('#tool-catalog [data-card]').count(),30);
    assert.equal(new Set(await page.locator('#tool-catalog .card-link').evaluateAll(nodes=>nodes.map(n=>n.href))).size,30);
    await page.screenshot({path:resolve(screenshots,'desktop-home.png'),fullPage:true});
    await page.locator('#language-toggle').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');
    for(const [query,id] of [['图片压缩','I01'],['BASE64','D03'],['二维码','T04'],['metadata','I05']]){
      await page.locator('#tool-search').fill(query);assert.ok(await page.locator(`#tool-catalog [data-id=${id}]`).isVisible(),query);
    }
    await page.locator('#tool-search').fill('no-such-tool-923');assert.ok(await page.locator('#empty-state').isVisible());
    await page.keyboard.press('Control+k');assert.equal(await page.locator('#tool-search').evaluate(n=>n===document.activeElement),true);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#tool-catalog [data-card]:visible').count(),30);
    await page.locator('#tool-catalog [data-favorite=D01]').click();
    await page.locator('[data-category-link=favorites]').click();assert.equal(await page.locator('#tool-catalog [data-card]:visible').count(),1);
    await page.reload();assert.equal(await page.locator('#tool-catalog [data-favorite=D01]').getAttribute('aria-pressed'),'true');
    await page.locator('[data-category-link=all]').click();
    await page.locator('#theme-select').selectOption('dark');await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.locator('#theme-select').selectOption('light');
  });

  const cases={
    D01:async()=>{await field('input').fill('{"n":9007199254740993,"text":"你好😀"}');const text=await run();assert.match(text,/9007199254740993/);assert.match(text,/你好😀/);await field('input').fill('{bad');await run(true);},
    D02:async()=>{await field('input').fill('中😀\\');assert.equal(await run(),'\\u4e2d\\ud83d\\ude00\\\\');await field('mode').selectOption('decode');await field('input').fill('\\u4e2d\\ud83d\\ude00\\\\');assert.equal(await run(),'中😀\\');await field('input').fill('\\uZZZZ');await run(true);},
    D03:async()=>{await field('input').fill('你好😀');assert.equal(await run(),'5L2g5aW98J+YgA==');await field('mode').selectOption('decode');await field('input').fill('%%%');await run(true);},
    D04:async()=>{await field('input').fill('https://example.com/?tag=a&tag=b&q=%E4%B8%AD+%E6%96%87');assert.deepEqual(JSON.parse(await run()),[['tag','a'],['tag','b'],['q','中 文']]);await field('mode').selectOption('decode');await field('input').fill('%ZZ');await run(true);},
    D05:async()=>{await field('input').fill('0');await field('zone').fill('UTC');assert.match(await run(),/1970-01-01T00:00:00/);await field('input').fill('no-date');await run(true);},
    D06:async()=>{await field('count').fill('3');const values=(await run()).split('\n');assert.equal(values.length,3);assert.equal(new Set(values).size,3);values.forEach(x=>assert.match(x,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));await field('count').fill('0');await run(true);},
    D07:async()=>{await field('input').fill('abc');assert.equal(await run(),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');await field('file').setInputFiles({name:'abc.txt',mimeType:'text/plain',buffer:Buffer.from('abc')});await field('input').fill('different');assert.equal(await run(),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');},
    D08:async()=>{await field('input').fill('same\nold\n');await field('second').fill('same\nnew\n');const text=await run();assert.match(text,/- old/);assert.match(text,/\+ new/);},
    D09:async()=>{await field('input').fill('A12 B34');assert.match(await run(),/A-12 B-34/);await field('pattern').fill('[');await run(true);},
    D10:async()=>{const token='eyJhbGciOiJub25lIn0.eyJzdWIiOiJhYmMifQ.';await field('input').fill(token);assert.match(await run(),/"sub": "abc"/);await field('input').fill('bad');await run(true);},
    D11:async()=>{await field('input').fill('9007199254740993');assert.equal(await run(),'20000000000001');await field('input').fill('1.5');await run(true);},
    D12:async()=>{await field('input').fill('#000000');await field('background').fill('#ffffff');const text=await run();assert.match(text,/rgb\(0, 0, 0\)/);assert.match(text,/21\.00:1/);await field('input').fill('nonsense');await run(true);},
    D13:async()=>{await field('input').fill('{"n":9007199254740993,"enabled":true}');assert.match(await run(),/n: 9007199254740993/);await field('mode').selectOption('yaml-json');await field('input').fill('n: 9007199254740993\nenabled: true');assert.match(await run(),/9007199254740993/);await field('input').fill('a: [');await run(true);},
    D14:async()=>{await field('input').fill('select id from users where id=1');const text=await run();assert.match(text,/SELECT/);assert.match(text,/FROM\s+users/);assert.match(text,/WHERE/);},
    D15:async()=>{await field('input').fill('0 9 * * 1-5');await field('zone').fill('UTC');const text=await run(),dates=text.match(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[^"\s,]*/g);assert.equal(dates.length,5);for(const value of dates){const d=new Date(value);assert.equal(d.getUTCHours(),9);assert.equal(d.getUTCMinutes(),0);assert.ok(d.getUTCDay()>0&&d.getUTCDay()<6);}await field('input').fill('bad');await run(true);},
    D16:async()=>{await field('input').fill('<img src=x onerror="window.__xss=1"> &');const text=await run();assert.match(text,/&lt;img/);assert.match(text,/&amp;/);assert.equal(await page.evaluate(()=>window.__xss),undefined);await field('mode').selectOption('decode');await field('input').fill('&lt;b&gt;x&lt;/b&gt;');assert.equal(await run(),'<b>x</b>');assert.equal(await page.locator('.text-result b').count(),0);},
    T01:async()=>{await field('input').fill('Hi 中😀\n');const text=await run();assert.match(text,/Unicode code points: 6\b/);assert.match(text,/English words: 1\b/);assert.match(text,/Lines: 2\b/);assert.match(text,/UTF-8 bytes: 11\b/);},
    T02:async()=>{await field('mode').selectOption('unique');await field('input').fill('a\nb\na');assert.equal(await run(),'a\nb');await field('mode').selectOption('upper');await field('input').fill('Hello 中');assert.equal(await run(),'HELLO 中');},
    T03:async()=>{await field('input').fill('# Safe heading\n\n<script>window.__xss=1</script>\n<img src="https://evil.invalid/x" onerror="window.__xss=2">\n[unsafe](javascript:window.__xss=3)\n![remote](https://evil.invalid/image.png)');await run();assert.equal(await page.locator('.text-preview h1').textContent(),'Safe heading');assert.equal(await page.locator('.text-preview script,.text-preview img,.text-preview [onerror],.text-preview a[href^="javascript:"]').count(),0);assert.equal(await page.evaluate(()=>window.__xss),undefined);const exported=await download(action('html'));assert.match(exported.bytes.toString(),/Safe heading/);assert.doesNotMatch(exported.bytes.toString(),/<script>|<img\s|href="javascript:/i);},
    T04:async()=>{await field('input').fill('Hello HandyBox');await run();const {bytes,name}=await download(action('download'));assert.match(name,/\.png$/);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),256);await field('input').fill('');await run(true);},
    T05:async()=>{await field('length').fill('24');const text=await run();assert.equal(text.length,24);for(const re of [/[A-Z]/,/[a-z]/,/[2-9]/,/[^a-zA-Z0-9]/])assert.match(text,re);assert.doesNotMatch(text,/[O0Il1]/);await field('length').fill('1');await run(true);},
    T06:async()=>{await field('category').selectOption('temperature');await field('from').selectOption('°C');await field('to').selectOption('°F');await field('input').fill('100');assert.match(await run(),/= 212 °F/);await field('category').selectOption('storage');await field('from').selectOption('MiB');await field('to').selectOption('B');await field('input').fill('1');assert.match(await run(),/= 1048576 B/);await field('input').fill('');await run(true);},
    T07:async()=>{await field('zone').fill('UTC');await field('input').fill('2026-01-01T12:00');await field('end').fill('2026-01-03T12:00');await field('days').fill('7');const text=await run();assert.match(text,/Calendar day difference: 2\b/);assert.match(text,/Elapsed hours: 48\b/);assert.match(text,/Elapsed seconds: 172800\b/);assert.match(text,/2026-01-08T12:00/);await field('zone').fill('Bad/Zone');await run(true);},
    F01:async()=>{await field('input').fill('name,note\n中,"Hello, world"\nB,"two\nlines"');assert.deepEqual(JSON.parse(await run()),[{name:'中',note:'Hello, world'},{name:'B',note:'two\nlines'}]);await field('input').fill('a,a\n1,2');await run(true);},
  };
  for(const tool of tools.filter(t=>!t.id.startsWith('I')&&t.id!=='F02'))await step(`${tool.id} ${tool.en}: example and independent result`,async()=>{
    await openTool(tool.id);await action('example').click();await run();
    assert.ok((await output()).length>0||await page.locator('.text-preview>*').count()>0,'Example produced no result');
    await cases[tool.id]();
  });

  await step('language switch preserves current text and recalculates result labels',async()=>{
    await openTool('T01');await field('input').fill('preserve 你好😀');await run();await page.locator('#language-toggle').click();assert.equal(await field('input').inputValue(),'preserve 你好😀');assert.match(await output(),/Unicode 码点数/);await page.locator('#language-toggle').click();assert.match(await output(),/Unicode code points/);await page.screenshot({path:resolve(screenshots,'desktop-tool.png'),fullPage:true});
  });
  await step('regex timeout and cancellation leave tool usable',async()=>{
    await openTool('D09');await field('pattern').fill('(a+)+$');await field('input').fill('a'.repeat(80)+'!');await run(true);assert.match(await page.locator('.text-status').textContent(),/2 seconds/);
    await page.locator('#workbench [type=submit]').click();await action('cancel').waitFor({state:'visible'});await action('cancel').click();assert.equal(await page.locator('#workbench [type=submit]').isEnabled(),true);
    await field('pattern').fill('a');await field('input').fill('abc');assert.match(await run(),/abc|matches|Matches/);
  });

  const mediaRun=async()=>{await action('run').click();await page.waitForFunction(()=>!document.querySelector('#workbench [data-action=run]')?.disabled);assert.notEqual(await page.locator('.media-status').getAttribute('data-kind'),'error',await page.locator('.media-status').textContent());};
  const waitImage=async()=>{await page.locator('.media-preview:not([hidden])').waitFor();await page.waitForFunction(()=>!document.querySelector('#workbench [data-action=run]')?.disabled);};
  const imagePixels=async bytes=>page.evaluate(async base64=>{const blob=await(await fetch('data:image/png;base64,'+base64)).blob(),img=await createImageBitmap(blob),c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const result={width:c.width,height:c.height,corner:[...ctx.getImageData(0,0,1,1).data],center:[...ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data],pixels:[...ctx.getImageData(0,0,c.width,c.height).data]};img.close();return result;},bytes.toString('base64'));
  for(const tool of tools.filter(t=>t.id.startsWith('I')))await step(`${tool.id} ${tool.en}: example, real upload and download`,async()=>{
    await openTool(tool.id);await action('example').click();await waitImage();await mediaRun();assert.ok(await page.locator('.media-result').count()>0);
    await page.locator('[name=images]').setInputFiles(imageFile);await waitImage();
    if(tool.id==='I05'){
      await page.locator('.media-metadata').waitFor();const metadata=JSON.parse(await page.locator('.media-metadata').inputValue());assert.equal(metadata.width,16);assert.equal(metadata.height,10);assert.equal(metadata.mime,'image/png');const saved=await download(page.locator('.media-result [data-action=download]'));assert.equal(JSON.parse(saved.bytes.toString()).bytes,png.length);
    }else{
      await page.locator('[name=format]').selectOption('image/png');
      if(tool.id==='I01')await page.locator('[name=maxEdge]').fill('8');
      if(tool.id==='I02'){await page.locator('[name=lock]').uncheck();for(const [key,value] of Object.entries({cropX:8,cropY:0,cropWidth:8,cropHeight:10,width:4,height:5}))await page.locator(`[name=${key}]`).fill(String(value));}
      if(tool.id==='I04'){await page.locator('[name=markText]').fill('X');await page.locator('[name=opacity]').fill('100');await page.locator('[name=markSize]').fill('100');await page.locator('[name=position]').selectOption('center');}
      await mediaRun();const saved=await download(page.locator('.media-result [data-action=download]'));assert.equal(saved.bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');const decoded=await imagePixels(saved.bytes);
      assert.equal(decoded.width,tool.id==='I01'?8:tool.id==='I02'?4:16);assert.equal(decoded.height,tool.id==='I01'?5:tool.id==='I02'?5:10);
      if(tool.id==='I02')assert.deepEqual(decoded.center,[0,0,255,255]);
      if(tool.id==='I03')assert.equal(decoded.corner[3],0,'PNG transparency was lost');
      if(tool.id==='I04'){const original=await imagePixels(png);assert.notDeepEqual(decoded.pixels,original.pixels,'Watermark did not alter image pixels');}
      const original=await download(page.locator('.media-result [data-action=original]'));assert.deepEqual(original.bytes,png);
    }
    await page.locator('[name=images]').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});await page.waitForFunction(()=>document.querySelector('.media-status')?.dataset.kind==='error');
  });
  await step('F02 PDF example, actual merge, reordered duplicate pages, split and invalid ranges',async()=>{
    await openTool('F02');await action('example').click();await page.locator('.media-files li').waitFor();await mediaRun();let saved=await download(page.locator('.media-result [data-action=download]').first());assert.equal((await PDFDocument.load(saved.bytes)).getPageCount(),3);
    await page.locator('[name=pdfs]').setInputFiles([pdfFile,pdfFile2]);await page.locator('[name=mode]').selectOption('merge');await mediaRun();saved=await download(page.locator('.media-result [data-action=download]'));assert.equal(saved.bytes.subarray(0,5).toString(),'%PDF-');assert.deepEqual((await PDFDocument.load(saved.bytes)).getPages().map(p=>p.getWidth()),[111,222,333,444]);
    await page.locator('[name=pdfs]').setInputFiles(pdfFile);await page.locator('[name=mode]').selectOption('reorder');await page.locator('[name=ranges]').fill('3,1,1');await mediaRun();saved=await download(page.locator('.media-result [data-action=download]'));assert.deepEqual((await PDFDocument.load(saved.bytes)).getPages().map(p=>p.getWidth()),[333,111,111]);
    await page.locator('[name=mode]').selectOption('split');await page.locator('[name=ranges]').fill('1-2;3');await mediaRun();assert.equal(await page.locator('.media-result').count(),2);for(const [i,count] of [2,1].entries()){saved=await download(page.locator('.media-result [data-action=download]').nth(i));assert.equal((await PDFDocument.load(saved.bytes)).getPageCount(),count);}
    await page.locator('[name=ranges]').fill('99');await action('run').click();await page.waitForFunction(()=>document.querySelector('.media-status')?.dataset.kind==='error');assert.equal(await page.locator('.media-result').count(),0);
  });
  await step('recent history, stored metadata only and reset',async()=>{
    await page.goto(home);await page.locator('#recent-section:not([hidden])').waitFor();assert.ok(await page.locator('#recent-section [data-id=F02]').isVisible());assert.ok(await page.locator('#recent-section [data-card]:visible').count()<=6);
    const stored=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key.startsWith('handybox-'))));assert.ok(Object.keys(stored).every(key=>['handybox-language','handybox-theme','handybox-favorites','handybox-recent'].includes(key)));assert.doesNotMatch(JSON.stringify(stored),/preserve|9007199254740993|browser-fixture/);
    await page.locator('#reset-preferences').click();assert.equal(await page.locator('#favorites-count').textContent(),'0');assert.equal(await page.locator('#recent-section').isHidden(),true);
  });
  await step('mobile homepage and every tool have no horizontal overflow',async()=>{
    await page.setViewportSize({width:390,height:844});await page.goto(home);await noOverflow();await page.screenshot({path:resolve(screenshots,'mobile-home.png'),fullPage:true});
    for(const tool of tools){await openTool(tool.id);await noOverflow();}
    await page.setViewportSize({width:1440,height:1000});
  });
  await step('storage denied: shell, preferences and a real conversion remain usable',async()=>{
    const denied=await browser.newContext({viewport:{width:390,height:844}});await watch(denied);
    await denied.addInitScript(()=>{for(const name of ['getItem','setItem','removeItem','clear'])Storage.prototype[name]=()=>{throw new DOMException('Storage is disabled','SecurityError');};});
    const p=await denied.newPage();await p.goto(home);await p.locator('#language-toggle').click();assert.equal(await p.locator('html').getAttribute('lang'),'en');await p.locator('#theme-select').selectOption('dark');assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');await p.locator('#tool-catalog [data-favorite=D01]').click();assert.equal(await p.locator('#favorites-count').textContent(),'1');await p.locator('#tool-search').fill('JSON');assert.ok(await p.locator('#tool-catalog [data-id=D01]').isVisible());
    await p.goto(`${home}tools/base64/`);await p.locator('#workbench[aria-busy=false]').waitFor();await p.locator('[data-field=input]').fill('abc');await p.locator('#workbench [type=submit]').click();await p.waitForFunction(()=>document.querySelector('.text-status')?.dataset.en==='Done');assert.equal(await p.locator('.text-result').textContent(),'YWJj');await denied.close();
  });
  await context.close();
  await step('no unexpected remote requests, browser errors or broken assets',async()=>{assert.deepEqual(externalRequests,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(failedResponses,[]);});
}finally{
  await browser?.close();await new Promise(done=>server.close(done));
}
if(errors.length)throw new AggregateError(errors.map(item=>item.error),`${errors.length} browser check(s) failed: ${errors.map(item=>item.name).join('; ')}`);
console.log(`${process.env.TEST_FILTER?'Selected browser checks passed':'Browser integration passed for all '+tools.length+' tools'} at ${basePath}. Screenshots: ${screenshots}`);
