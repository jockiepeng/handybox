import test from 'node:test';
import assert from 'node:assert/strict';
import * as t from '../src/tools/text/core.mjs';

test('Unicode escapes preserve Chinese, surrogate pairs and literal backslashes', () => {
  assert.equal(t.unicodeEncode('中😀\\n'), '\\u4e2d\\ud83d\\ude00\\\\n');
  assert.equal(t.unicodeDecode('\\u4e2d\\ud83d\\ude00\\\\n'), '中😀\\n');
  assert.throws(() => t.unicodeDecode('\\uXYZ1'));
});
test('JSON keeps every large integer digit and rejects syntax errors', async () => {
  assert.equal(await t.formatJson('{"n":900719925474099312345}', true), '{"n":900719925474099312345}');
  await assert.rejects(t.formatJson('{bad}'));
});
test('UTF-8 Base64 and URL-safe decoding', () => {
  assert.equal(t.base64Encode('你好😀'), '5L2g5aW98J+YgA==');
  assert.equal(t.base64Decode('5L2g5aW98J-YgA', true), '你好😀');
  assert.throws(() => t.base64Decode('a'));
});
test('URL parsing keeps duplicate parameters in order', () => {
  assert.deepEqual(t.urlParameters('https://a.test/?x=1&x=2&name=%E4%B8%AD#z'), [['x','1'],['x','2'],['name','中']]);
});
test('timestamps use explicit units and zoned ISO output', async () => {
  const value = await t.timestamp('0', 'seconds', 'Asia/Shanghai');
  assert.equal(value.utc, '1970-01-01T00:00:00.000Z');
  assert.equal(value.zoned, '1970-01-01T08:00:00.000+08:00');
});
test('UUID has random v4 and RFC variant bits', () => {
  const ids = t.uuids(4); assert.equal(new Set(ids).size,4);
  assert.match(ids[0], /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});
test('SHA-256 uses UTF-8 digest bytes', async () => assert.equal(await t.digest('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
test('diff marks removed and added lines', async () => {
  const result = await t.lineDiff('a\nb\n','a\nc\n');
  assert.ok(result.some(x => x.removed && x.value === 'b\n'));
  assert.ok(result.some(x => x.added && x.value === 'c\n'));
});
test('JWT decodes data and makes no signature claim', () => {
  const token = t.base64Encode('{"alg":"none"}',true)+'.'+t.base64Encode('{"sub":"中","exp":0}',true)+'.';
  assert.deepEqual(t.jwtDecode(token).payload, {sub:'中',exp:0});
});
test('radix conversion never rounds large integers', () => {
  assert.equal(t.convertRadix('20000000000001',16,10),'9007199254740993');
  assert.equal(t.convertRadix('-10',2,16),'-2');
  assert.throws(() => t.convertRadix('102',2,10));
});
test('colors and WCAG contrast match published black/white ratio', () => {
  assert.deepEqual(t.parseColor('hsl(0, 100%, 50%)').rgb,[255,0,0]);
  assert.equal(t.parseColor('#abc').hex,'#aabbcc');
  assert.equal(t.contrast('#000','#fff'),21);
});
test('YAML conversion preserves large JSON integers', async () => {
  const yaml = await t.convertYaml('{"n":9007199254740993}', 'json-yaml');
  assert.match(yaml,/9007199254740993/);
  assert.equal(await t.convertYaml('n: 9007199254740993\n','yaml-json'),'{\n  "n": 9007199254740993\n}');
});
test('SQL formatting is dialect aware', async () => assert.match(await t.formatSql('select a from t where id=1','sql'), /SELECT\s+a\s+FROM\s+t/));
test('five-field Cron produces timezone-aware next dates', async () => {
  const r = await t.explainCron('0 9 * * *','Asia/Shanghai','en','2026-01-01T00:00:00Z');
  assert.equal(r.dates[0],'2026-01-01T09:00:00.000+08:00');
  await assert.rejects(t.explainCron('* * * * * *','UTC'));
});
test('HTML entity codec treats markup only as data', async () => {
  assert.equal(await t.htmlEntities('<script>&"',true),'&lt;script&gt;&amp;&quot;');
  assert.equal(await t.htmlEntities('&lt;img onerror=x&gt;',false),'<img onerror=x>');
});
test('counts use codepoints and UTF8 bytes', () => assert.deepEqual(t.textCounts('Hi 中😀\n'), {characters:6,graphemes:6,words:1,lines:2,bytes:11}));
test('text cleanup sorts, deduplicates and removes blank lines', () => assert.equal(t.transformText(' b \na\nb\n\n','unique'),' b \na\nb\n'));
test('QR produces a real PNG data URL', async () => assert.match(await t.qrDataUrl('hello',128,'M'),/^data:image\/png;base64,iVBOR/));
test('password generation satisfies every selected character group', () => {
  const p=t.password({length:40,upper:true,lower:true,digits:true,symbols:true,exclude:true});
  assert.equal(p.length,40); assert.match(p,/[A-Z]/); assert.match(p,/[a-z]/); assert.match(p,/[0-9]/); assert.match(p,/[^A-Za-z0-9]/); assert.doesNotMatch(p,/[O0Il1]/);
  assert.throws(()=>t.password({length:3,upper:false,lower:false,digits:false,symbols:false}));
});
test('unit conversion distinguishes decimal and binary storage', () => {
  assert.equal(t.convertUnit(1,'MB','MiB'),0.95367431640625);
  assert.equal(t.convertUnit(32,'°F','°C'),0);
  assert.equal(t.convertUnit(1,'km','m'),1000);
});
test('date arithmetic distinguishes natural days and elapsed hours', async () => {
  const r = await t.dateCalculate('2026-03-07T12:00','2026-03-09T12:00',1,'America/New_York');
  assert.equal(r.days,2); assert.equal(r.hours,47); assert.match(r.added,/2026-03-08T12:00/);
});
test('CSV handles commas, quotes, newlines, duplicate headers and formulas', async () => {
  const json=await t.csvConvert('name,note\n中,"a,b"\nJane,"line1\nline2"','csv-json');
  assert.deepEqual(JSON.parse(json),[{name:'中',note:'a,b'},{name:'Jane',note:'line1\nline2'}]);
  const csv=await t.csvConvert('[{"name":"=1+1","note":"a,b"}]','json-csv',{safe:true});
  assert.match(csv,/'=1\+1/); assert.match(csv,/"a,b"/);
  await assert.rejects(t.csvConvert('a,a\n1,2','csv-json'));
});
test('units reject empty input rather than treating it as zero',()=>assert.throws(()=>t.convertUnit('','m','km')));
test('colors reject malformed numeric HSL values',()=>assert.throws(()=>t.parseColor('hsl(., 10%, 20%)')));
test('JWT keeps large integer claims without changing their digits',()=>{
  const token=t.base64Encode('{"alg":"none"}',true)+'.'+t.base64Encode('{"id":9007199254740993}',true)+'.';
  assert.equal(t.jwtDecode(token).payload.id.toString(),'9007199254740993');
});
test('CSV JSON export keeps large integer cells exact',async()=>assert.match(await t.csvConvert('[{"id":9007199254740993}]','json-csv'),/9007199254740993/));
test('CSV export includes keys appearing in later objects',async()=>assert.equal(await t.csvConvert('[{"a":"1"},{"b":"2"}]','json-csv'),'a,b\r\n1,\r\n,2'));
test('YAML cycles fail with an actionable error',async()=>await assert.rejects(t.convertYaml('a: &a [*a]','yaml-json'),/循环|cyclic/i));
test('date calculations reject nonexistent DST local times',async()=>await assert.rejects(t.dateCalculate('2026-03-08T02:30','2026-03-09T12:00',0,'America/New_York'),/不存在|does not exist/i));

test('queryless full URLs have no parameters while raw queries retain duplicates',()=>{
  for(const input of ['https://example.com/path','https://example.com/path#foo','//example.com/path#foo','https://example.com/path#foo?bar'])assert.deepEqual(t.urlParameters(input),[]);
  assert.deepEqual(t.urlParameters('a=1&a=2'),[['a','1'],['a','2']]);
  assert.deepEqual(t.urlParameters('?a=1&a=2#fragment'),[['a','1'],['a','2']]);
  assert.deepEqual(t.urlParameters('a= '),[['a',' ']]);
});
test('CSV retains empty fields, quoted empties and whitespace records',async()=>{
  assert.deepEqual(JSON.parse(await t.csvConvert('a,b\n,\n1,2','csv-json')),[{a:'',b:''},{a:'1',b:'2'}]);
  assert.deepEqual(JSON.parse(await t.csvConvert('a\n""\n"  "\n \nb','csv-json')),[{a:''},{a:'  '},{a:' '},{a:'b'}]);
  assert.deepEqual(JSON.parse(await t.csvConvert('""\n \n,','csv-json',{header:false})),[[''],[' '],['','']]);
});
test('CSV ignores only empty physical lines outside quoted cells',async()=>{
  assert.deepEqual(JSON.parse(await t.csvConvert('\r\na,b\r\n\r\n1,"x\r\n\r\ny"\r\n\r\n,\r\n','csv-json')),[{a:'1',b:'x\r\n\r\ny'},{a:'',b:''}]);
  assert.equal(await t.csvConvert('','csv-json'),'[]');
});
test('JSON to YAML rejects decimal or exponent values that would lose precision',async()=>{
  for(const n of ['9007199254740993e0','9007199254740993.0','1.00000000000000001','1e400','1e-400'])await assert.rejects(t.convertYaml(`{"n":${n}}`,'json-yaml'),/数值.*精度.*\|.*number.*precision/i);
  assert.equal(await t.convertYaml('{"n":1.25e2}','json-yaml'),'n: 125\n');
});
test('YAML to JSON rejects rounded, overflowing and nonfinite numeric scalars',async()=>{
  for(const n of ['9007199254740993e0','9007199254740993.0','1.00000000000000001','1e400','1e-400','.inf','-.inf','.nan'])await assert.rejects(t.convertYaml(`n: ${n}`,'yaml-json'),/数值.*精度.*\|.*number.*precision/i);
  assert.equal(await t.convertYaml('n: +1.25e2\na: .5\nb: 1.','yaml-json'),'{\n  "n": 125,\n  "a": 0.5,\n  "b": 1\n}');
  assert.equal(await t.convertYaml('n: "1e400"','yaml-json'),'{\n  "n": "1e400"\n}');
});
