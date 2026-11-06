import assert from 'node:assert/strict';

export async function checkPlayful({step,page,openTool,action,download,imageFile,imagePixels,noOverflow,screenshots,resolve}){
  await step('playful lifecycle: cached palette can re-render and export after pagehide',async()=>{
    await openTool('I06');await page.locator('[name=palette-image]').setInputFiles(imageFile);await page.locator('.palette-swatch').first().waitFor();
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
    await page.locator('[name=color-count]').selectOption('3');
    assert.equal(await page.locator('.palette-swatch').count(),2,'Cached image should stay usable');
    assert.notEqual(await page.locator('.play-status').getAttribute('data-kind'),'error');
    const saved=await download(action('download-palette'));assert.equal(saved.bytes.readUInt32BE(16),1200);
  });
  await step('playful lifecycle: cached wheel completes an in-flight draw',async()=>{
    await openTool('T08');await page.emulateMedia({reducedMotion:'no-preference'});await action('spin').click();
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
    await page.waitForFunction(()=>!document.querySelector('[data-action=spin]').disabled);
    assert.equal(await page.locator('.wheel-history li').count(),1,'Cached animation should finish its draw');
    assert.notEqual(await page.locator('.play-status').getAttribute('data-kind'),'error');
  });
  await step('playful lifecycle: cached code card completes a pending edit',async()=>{
    await openTool('D17');
    await page.evaluate(()=>{const input=document.querySelector('[name=code]');input.value='const cached = "你好";';input.dispatchEvent(new Event('input',{bubbles:true}));window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));});
    await page.waitForFunction(()=>!document.querySelector('[data-action=download-code]').disabled);
    const saved=await download(action('download-code'));assert.equal(saved.bytes.readUInt32BE(16),1600);
  });
  await step('I06 palette: visible pixels, actual CSS/PNG downloads, clear and invalid files',async()=>{
    await openTool('I06');
    await page.locator('[name=palette-image]').setInputFiles(imageFile);
    await page.locator('.palette-swatch').first().waitFor();
    assert.equal(await page.locator('.palette-swatch').count(),2);
    const colors=await page.locator('.palette-hex').allTextContents();
    assert.deepEqual(new Set(colors),new Set(['#FF0000','#0000FF']));
    const css=await download(action('download-css'));
    assert.match(css.bytes.toString(),/--color-1: #0000FF/);
    const png=await download(action('download-palette'));
    assert.equal(png.bytes.readUInt32BE(16),1200);
    const before=await page.locator('.palette-hex').allTextContents();
    await page.locator('#language-toggle').click();
    assert.deepEqual(await page.locator('.palette-hex').allTextContents(),before);
    await page.locator('#language-toggle').click();
    await action('clear').click();assert.equal(await page.locator('.palette-swatch').count(),0);
    assert.ok(await action('download-palette').isDisabled());
    await page.locator('[name=palette-image]').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('invalid')});
    await page.locator('.play-status[data-kind=error]').waitFor();
    await action('example').click();await page.locator('.palette-swatch').first().waitFor();
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(screenshots,'palette-desktop.png'),fullPage:true});
  });
  await step('T08 wheel: no-repeat exhaustion, animated landing, preserved history, validation and reset',async()=>{
    await openTool('T08');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('[name=entries]').fill('面条 | 1\nPizza | 3');
    await page.locator('[name=no-repeat]').check();
    await action('spin').click();await page.waitForFunction(()=>document.querySelector('[data-action=spin]').disabled===false);
    const first=await page.locator('.wheel-winner').textContent();
    await action('spin').click();await page.waitForFunction(()=>document.querySelector('.wheel-history').children.length===2);
    const second=await page.locator('.wheel-winner').textContent();assert.notEqual(first,second);
    assert.deepEqual(new Set([first,second]),new Set(['面条','Pizza']));
    assert.ok(await action('spin').isDisabled());
    await page.locator('#language-toggle').click();assert.equal(await page.locator('.wheel-history li').count(),2);
    assert.equal(await page.locator('[name=entries]').inputValue(),'面条 | 1\nPizza | 3');
    await page.locator('#language-toggle').click();
    await action('reset').click();assert.equal(await page.locator('.wheel-history li').count(),0);assert.ok(await action('spin').isEnabled());
    await page.locator('[name=entries]').fill('bad | 0\nvalid');await action('spin').click();
    await page.locator('.play-status[data-kind=error]').waitFor();
    await action('example').click();
    await page.emulateMedia({reducedMotion:'no-preference'});
    await action('spin').click();assert.ok(await action('spin').isDisabled());
    await page.waitForFunction(()=>document.querySelector('[data-action=spin]').disabled===false);
    assert.equal(await page.locator('.wheel-history li').count(),1);
    assert.ok((await page.locator('.wheel-winner').textContent()).length>0);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(screenshots,'wheel-desktop.png'),fullPage:true});
  });
  await step('D17 code card: real highlighted PNG, literal unsafe text, Unicode and invalid limits',async()=>{
    await openTool('D17');
    const source='const message = "你好 😀";\n// <img src=x onerror="window.__cardXss=1">\nconsole.log(message);';
    await page.locator('[name=code]').fill(source);await page.locator('[name=card-width]').selectOption('640');
    await page.waitForFunction(()=>document.querySelector('.code-size').textContent.includes('1280'));
    const saved=await download(action('download-code'));
    assert.equal(saved.bytes.readUInt32BE(16),1280);assert.ok(saved.bytes.readUInt32BE(20)>300);
    const decoded=await imagePixels(saved.bytes);
    let keywordPixels=0;
    for(let i=0;i<decoded.pixels.length;i+=4)if(decoded.pixels[i]===206&&decoded.pixels[i+1]===173&&decoded.pixels[i+2]===255)keywordPixels++;
    assert.ok(keywordPixels>10,'Downloaded PNG should contain highlighted keyword text');
    assert.equal(await page.evaluate(()=>window.__cardXss),undefined);
    assert.equal(await page.locator('#workbench img').count(),0);
    await page.locator('#language-toggle').click();assert.equal(await page.locator('[name=code]').inputValue(),source);
    await page.locator('#language-toggle').click();
    await page.locator('[name=code]').fill('x'.repeat(12001));await page.locator('.play-status[data-kind=error]').waitFor();
    assert.ok(await action('download-code').isDisabled());
    await action('example').click();await page.waitForFunction(()=>!document.querySelector('[data-action=download-code]').disabled);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(screenshots,'code-card-desktop.png'),fullPage:true});
  });
  await step('playful tools: mobile filled previews, dark theme and no horizontal overflow',async()=>{
    await page.setViewportSize({width:390,height:844});
    for(const id of ['I06','T08','D17']){
      await openTool(id);await action('example').click();
      if(id==='I06')await page.locator('.palette-swatch').first().waitFor();
      await page.locator('#theme-select').selectOption('dark');await noOverflow();
      await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:resolve(screenshots,`${id}-mobile.png`),fullPage:true});
    }
    await page.setViewportSize({width:1440,height:1000});await page.locator('#theme-select').selectOption('light');
  });
}
