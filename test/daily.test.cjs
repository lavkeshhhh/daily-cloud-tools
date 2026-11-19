const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {publish,localDate,modelSource,assertSpec}=require('../scripts/publish.cjs');
const {verify,checkCases}=require('../scripts/verify.cjs');
const recipes=require('../recipes/calculators.cjs');
const seed= require('../queue/oci/01-oci-os-bucket-list.json');
const tempDir=()=>fs.mkdtempSync(path.join(os.tmpdir(),'daily-cloud-test-'));

test('releases are keyed to India midnight',()=>{
  assert.equal(localDate(new Date('2026-11-20T18:29:59Z')),'2026-11-20');
  assert.equal(localDate(new Date('2026-11-20T18:30:00Z')),'2026-11-21');
});
test('consecutive dates produce distinct complete programs and repeats repair the catalog',t=>{
  const temp=tempDir();t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  fs.mkdirSync(path.join(temp,'apps'));
  for(const name of ['shared','style.css'])fs.cpSync(path.join(__dirname,'../site',name),path.join(temp,name),{recursive:true});
  const first=publish(temp,'2050-04-01');
  fs.writeFileSync(path.join(temp,'index.html'),'interrupted build');
  assert.equal(publish(temp,'2050-04-01').created,false);
  const second=publish(temp,'2050-04-02');
  assert.equal(first.slug,'queue-recovery');assert.equal(second.slug,seed.slug);assert.equal(verify(temp),2);
});
test('every authored calculator passes its independent normal and edge examples',t=>{
  const temp=tempDir();t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  for(const recipe of recipes) {
    const file=path.join(temp,recipe.slug+'.cjs');fs.writeFileSync(file,modelSource('calculator',recipe));
    const {dailyTool,runTool}=require(file);
    checkCases(dailyTool,runTool,'calculator',recipe.cases);
    assert.throws(()=>runTool({[recipe.inputs[0].key]:-1}));
  }
});
test('cached Oracle tools have documented signatures and quote single quotes as literal data',t=>{
  const temp=tempDir();t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const queue=path.join(__dirname,'../queue/oci');
  for(const file of fs.readdirSync(queue)) {
    const spec=JSON.parse(fs.readFileSync(path.join(queue,file)));
    assertSpec('oci',spec);
  }
  const file=path.join(temp,'bucket.cjs');fs.writeFileSync(file,modelSource('oci',seed));
  const {runTool}=require(file);
  const output=runTool({'--compartment-id':"team's scope",'--limit':10});
  assert.deepEqual(output.argv,['oci','os','bucket','list',"--compartment-id=team's scope",'--limit=10']);
  assert.equal(output.command,"oci os bucket list --compartment-id='team'\"'\"'s scope' --limit='10'");
  assert.throws(()=>runTool({'--compartment-id':'example','--limit':'-1'}),/positive integer/);
});
