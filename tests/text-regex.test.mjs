import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRegex} from '../src/workers/regex.mjs';
test('regex captures groups, named groups and replacement', () => {
  const r=evaluateRegex({pattern:'(?<letter>[a-z])(\\d)',flags:'g',input:'a1 b2',replacement:'$2$1'});
  assert.equal(r.matches[0].index,0);assert.deepEqual(r.matches[0].groups,['a','1']);
  assert.equal(r.matches[0].named.letter,'a');assert.equal(r.replaced,'1a 2b');
});
test('zero-width Unicode regex terminates and invalid flags are rejected', () => {
  assert.equal(evaluateRegex({pattern:'(?:)',flags:'gu',input:'😀'}).matches.length,2);
  assert.throws(()=>evaluateRegex({pattern:'a',flags:'gg',input:'a'}));
});
test('regex replacement implements dollar tokens and bounds expansion',()=>{
  assert.equal(evaluateRegex({pattern:'(?<a>a)(b)',flags:'g',input:'xabz',replacement:'$$-$&-$2-$<a>-$`-$\''}).replaced,'x$-ab-b-a-x-zz');
  assert.throws(()=>evaluateRegex({pattern:'(?:)',flags:'g',input:'a'.repeat(10000),replacement:'x'.repeat(1000)}),/输出|output/i);
});
test('Unicode Sets zero-width matches advance across surrogate pairs',()=>{
  const result=evaluateRegex({pattern:'(?:)',flags:'gv',input:'😀',replacement:'-'});
  assert.deepEqual(result.matches.map(match=>match.index),[0,2]);
  assert.equal(result.truncated,false);assert.equal(result.replaced,'-😀-');
});
