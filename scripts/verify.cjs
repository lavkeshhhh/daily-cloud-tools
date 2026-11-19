'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {toolsIn}=require('./catalog.cjs');
const {assertSpec}=require('./publish.cjs');

function checkCases(dailyTool,runTool,type,cases) {
  for(const example of cases) {
    const actual=runTool(example.values);
    if(type==='calculator') {
      assert.deepEqual(Object.keys(actual).sort(),Object.keys(example.expect).sort());
      for(const [key,expected] of Object.entries(example.expect)) {
        if(expected===null) assert.equal(actual[key],null,key);
        else assert.ok(typeof actual[key]==='number' && Math.abs(actual[key]-expected)<=1e-8*Math.max(1,Math.abs(expected)),dailyTool.slug+' '+key);
      }
    } else {
      assert.deepEqual(actual.argv,[...example.command,...example.required.map(flag=>flag+'='+example.values[flag])]);
      assert.throws(()=>runTool({}),/Enter a value/);
      assert.ok(actual.command.startsWith(example.command.join(' ')+' '));
    }
  }
}
function verify(site=path.resolve(__dirname,'../site')) {
  const tools=toolsIn(site);
  const days=new Set();
  const index=fs.readFileSync(path.join(site,'index.html'),'utf8');
  for(const meta of tools) {
    assert.ok(index.includes('href="apps/'+meta.slug+'/"'),meta.slug+' is missing from the catalog');
    const dir=path.join(site,'apps',meta.slug);
    const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target=match[1];
      if(target.startsWith('https://')||target.startsWith('#')) continue;
      assert.ok(fs.existsSync(path.resolve(dir,target)),meta.slug+' broken asset '+target);
    }
    if(meta.edition==='daily') {
      assert.ok(!days.has(meta.released),'Multiple daily releases for '+meta.released);
      days.add(meta.released);
    }
    if(!['calculator','oci'].includes(meta.type)) continue;
    const {dailyTool,runTool}=require(path.join(dir,'model.js'));
    assert.equal(dailyTool.slug,meta.slug);
    assertSpec(meta.type,dailyTool);
    const cases=JSON.parse(fs.readFileSync(path.join(dir,'cases.json'),'utf8'));
    assert.ok(cases.length>0);checkCases(dailyTool,runTool,meta.type,cases);
  }
  return tools.length;
}
module.exports={checkCases,verify};
if(require.main===module) console.log('Verified '+verify()+' applications and their catalog links.');
