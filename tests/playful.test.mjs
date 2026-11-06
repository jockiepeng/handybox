import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPalette, paletteCSS} from '../src/tools/play/palette-core.mjs';
import {parseEntries, pickEntry, wheelTarget} from '../src/tools/play/wheel-core.mjs';
import {prepareCode, highlightCode, wrapTokens} from '../src/tools/play/code-core.mjs';

test('palette retains exact solid colors, ignores invisible pixels and estimates visible proportions',()=>{
  const colors=extractPalette(new Uint8ClampedArray([
    255,0,0,255, 255,0,0,255, 255,0,0,255, 0,0,255,255, 0,255,0,0,
  ]),5);
  assert.deepEqual(colors,[{hex:'#FF0000',rgb:[255,0,0],ratio:.75},{hex:'#0000FF',rgb:[0,0,255],ratio:.25}]);
  assert.equal(paletteCSS(colors),':root {\n  --color-1: #FF0000;\n  --color-2: #0000FF;\n}');
});
test('palette does not invent extra colors in a flat image and rejects empty visible samples',()=>{
  assert.deepEqual(extractPalette(new Uint8ClampedArray([17,34,51,255,17,34,51,255]),8),[{hex:'#112233',rgb:[17,34,51],ratio:1}]);
  assert.throws(()=>extractPalette(new Uint8ClampedArray([255,0,0,0]),5),/visible/i);
  assert.throws(()=>extractPalette(new Uint8ClampedArray([255,0]),5),/RGBA/);
  assert.throws(()=>extractPalette(new Uint8ClampedArray([255,0,0,255]),0),/color count/i);
});
test('palette clusters similar pixels and accounts for every visible sample',()=>{
  const colors=extractPalette(new Uint8ClampedArray([250,0,0,255,255,1,0,255,0,250,0,255,0,255,1,255,0,0,255,255]),3);
  assert.equal(colors.length,3);
  assert.ok(Math.abs(colors.reduce((n,c)=>n+c.ratio,0)-1)<1e-10);
  assert.ok(colors.some(c=>c.rgb[0]>240&&c.rgb[1]<5&&c.ratio===.4));
});
test('wheel parses Unicode labels and integer weights without merging duplicate choices',()=>{
  assert.deepEqual(parseEntries('面条 | 3\r\n\nPizza\nPizza | 2'),[
    {id:0,label:'面条',weight:3},{id:1,label:'Pizza',weight:1},{id:2,label:'Pizza',weight:2},
  ]);
  for(const text of ['only one','A | 0\nB','A | -1\nB','A | 1.5\nB','A | 101\nB','A | x\nB',' | 2\nB',`${'😀'.repeat(61)}\nB`,Array(51).fill('A').join('\n')])assert.throws(()=>parseEntries(text));
});
test('weighted selection follows exact interval boundaries and permits one remaining entry',()=>{
  const entries=parseEntries('A | 1\nB | 3');
  assert.equal(pickEntry(entries,0),0);
  assert.equal(pickEntry(entries,.249999),0);
  assert.equal(pickEntry(entries,.25),1);
  assert.equal(pickEntry(entries,.999999),1);
  assert.equal(pickEntry([entries[1]],.99),0);
  assert.throws(()=>pickEntry([],0));
  for(const random of [-.1,1,NaN])assert.throws(()=>pickEntry(entries,random));
});
test('wheel landing stays within the chosen weighted sector after several turns',()=>{
  const entries=parseEntries('A | 1\nB | 3');
  for(const current of [0,355,1842])for(const index of [0,1])for(const random of [0,.5,.999]){
    const target=wheelTarget(entries,index,current,random);
    assert.ok(target-current>=360*5);
    const local=((360-target%360)%360);
    assert.ok(index===0?local>0&&local<90:local>90&&local<360,`${index}: ${local}`);
  }
});
test('code preparation normalizes line endings and tabs and rejects oversized input',()=>{
  assert.equal(prepareCode('const x = 1;\r\n\t你好😀\rnext'),'const x = 1;\n  你好😀\nnext');
  assert.throws(()=>prepareCode('a'.repeat(12001)),/12,000/);
  assert.throws(()=>prepareCode(Array(201).fill('x').join('\n')),/200/);
});
test('highlighting preserves literal HTML and Unicode and identifies code tokens',()=>{
  const source='const x = "<img src=x onerror=alert(1)>你好😀";';
  const tokens=highlightCode(source,'javascript');
  assert.equal(tokens.map(t=>t.text).join(''),source);
  assert.ok(tokens.some(t=>t.type==='keyword'&&t.text==='const'));
  assert.ok(tokens.some(t=>t.type==='string'&&t.text.includes('<img')));
  assert.equal(highlightCode('a\n中😀','plain').map(t=>t.text).join(''),'a\n中😀');
});
test('wrapping preserves all text, complete emoji graphemes and logical line numbers',()=>{
  const measure=text=>[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(text)].length;
  const rows=wrapTokens([{text:'ab👨‍👩‍👧‍👦cd\n中😀\n',type:'plain'}],3,measure);
  assert.deepEqual(rows.map(row=>row.tokens.map(t=>t.text).join('')),['ab👨‍👩‍👧‍👦','cd','中😀','']);
  assert.deepEqual(rows.map(row=>row.number),[1,null,2,3]);
});
