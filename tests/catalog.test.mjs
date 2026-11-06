import test from 'node:test';
import assert from 'node:assert/strict';
import { tools, searchTools } from '../src/data/tools.mjs';

test('catalog exposes all selected tools as unique deep links', () => {
  assert.equal(tools.length, 33);
  assert.equal(new Set(tools.map(t => t.slug)).size, 33);
  for (const id of ['D01','D16','D17','I01','I05','I06','T01','T07','T08','F01','F02']) assert.ok(tools.some(t => t.id === id));
});
test('search matches bilingual names and aliases irrespective of case', () => {
  assert.equal(searchTools('unicode')[0].id, 'D02');
  assert.equal(searchTools('图片压缩')[0].id, 'I01');
  assert.equal(searchTools('COMPRESS image')[0].id, 'I01');
  assert.equal(searchTools('\\u')[0].id, 'D02');
  assert.equal(searchTools('json')[0].id, 'D01');
  assert.equal(searchTools('配色提取')[0].id, 'I06');
  assert.equal(searchTools('wheel')[0].id, 'T08');
  assert.equal(searchTools('代码截图')[0].id, 'D17');
  assert.deepEqual(searchTools('doesnotexist'), []);
});
test('category filtering combines with search without dropping empty queries', () => {
  assert.equal(searchTools('', 'image').length, 6);
  assert.equal(searchTools('json','file')[0].id,'F01');
  assert.equal(searchTools('json','image').length,0);
});
