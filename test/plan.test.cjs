const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePlan, comparePlans } = require('../site/apps/oracle-plan-compare/core.js');
const { sampleBefore, sampleAfter } = require('../site/apps/oracle-plan-compare/examples.js');
test('example compares access paths and reports changed root estimates', () => {
  const rows = comparePlans(parsePlan(sampleBefore), parsePlan(sampleAfter));
  assert.deepEqual(rows.map(r => r.kind), ['Changed','Changed','Added','Added','Removed']);
  assert.deepEqual(rows[0].changes.map(c => [c.label,c.from,c.to]), [['Estimated rows','120','85'],['Cost','230','36']]);
});
test('renumbered operations keep identity and missing hashes work', () => {
  const before = '| Id | Operation | E-Rows | A-Rows | Starts |\n| 1 |  FILTER | 3 | 6 | 2 |';
  const rows = comparePlans(parsePlan(before), parsePlan(before.replace('| 1 |','| 7 |').replace('| 6 |','| 7 |')));
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].changes, [{label:'Actual rows',from:'6',to:'7'}]);
});
test('identical repeated siblings survive, flags and active state are distinct', () => {
  const text = '| Id | Operation | Name |\n| 0 | ROOT | |\n|*1 |  SCAN | X |\n|- 2 |  SCAN | X |';
  const rows = comparePlans(parsePlan(text),parsePlan(text.replace('|- 2','|  2')));
  assert.deepEqual(rows.map(r=>r.kind),['Same','Same','Changed']);
  assert.equal(rows[2].changes[0].label,'State');
});
test('rejects a multi-plan paste and malformed text', () => {
  assert.throws(()=>parsePlan(sampleBefore+'\n'+sampleAfter),/single plan/);
  assert.throws(()=>parsePlan('select 1 from dual;'),/Expected/);
});
