'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const recipes=require('../recipes/calculators.cjs');
const {toolsIn,renderCatalog,escapeHtml:h}=require('./catalog.cjs');
const {runCalculator,buildCommand}=require('./models.cjs');
const root=path.resolve(__dirname,'..');
const siteRoot=path.join(root,'site');
const referenceRoot='https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/';

function localDate(now=new Date()) {
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const fields=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return [fields.year,fields.month,fields.day].join('-');
}
function nextTool(site,released) {
  const used=new Set(released.map(t=>t.slug));
  const calculator=recipes.find(r=>!used.has(r.slug));
  const count=released.filter(t=>t.edition==='daily').length;
  if(calculator && count%2===0) return {type:'calculator',spec:calculator};
  const queue=path.join(root,'queue/oci');
  for(const file of fs.readdirSync(queue).filter(f=>f.endsWith('.json')).sort()) {
    const spec=JSON.parse(fs.readFileSync(path.join(queue,file),'utf8'));
    if(!used.has(spec.slug)) return {type:'oci',spec};
  }
  if(calculator) return {type:'calculator',spec:calculator};
  const data=execFileSync('python3',[path.join(root,'scripts/oci_reference.py'),'next','--site',site],{encoding:'utf8',timeout:120000,maxBuffer:131072,stdio:['ignore','pipe','inherit']});
  return {type:'oci',spec:JSON.parse(data)};
}
function assertSpec(type,spec) {
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(spec.slug) || !spec.title || !spec.summary) throw Error('Invalid application metadata');
  if(type!=='oci') return;
  const cmd=spec.command;
  if(!Array.isArray(cmd)||cmd.length<4||cmd[0]!=='oci'||cmd.at(-1)!=='list'||!cmd.every(s=>/^[a-z0-9-]+$/.test(s))) throw Error('Invalid list operation');
  if(spec.slug!==cmd.join('-')||spec.source!==referenceRoot+cmd.slice(1).join('/')+'.html') throw Error('Command source mismatch');
  if(!spec.fields?.length||!spec.fields.some(f=>f.required)||new Set(spec.fields.map(f=>f.name)).size!==spec.fields.length||
     !spec.fields.every(f=>/^--[a-z0-9-]+$/.test(f.name)&&['text','integer'].includes(f.kind)&&typeof f.required==='boolean')) throw Error('Invalid command fields');
}
function modelSource(type,spec) {
  const {solve,cases,...meta}=spec;
  const fn=type==='calculator'?runCalculator:buildCommand;
  const parts=["'use strict';",'const dailyTool = '+JSON.stringify(meta,null,2)+';'];
  if(solve) parts.push('const solve = '+solve.toString()+';');
  parts.push('const runTool = '+fn.toString()+';');
  parts.push(`if(typeof module!=='undefined') {
  module.exports={dailyTool,runTool};
  if(require.main===module) {
    try { console.log(JSON.stringify(runTool(JSON.parse(process.argv[2] || '{}')),null,2)); }
    catch(error) { console.error(error.message); process.exitCode=1; }
  }
}`);
  return parts.join('\n\n')+'\n';
}
function formBody(type,spec) {
  if(type==='calculator') {
    const fields=spec.inputs.map(f=>`<label class="field"><span>${h(f.label)}</span><input type="number" name="${h(f.key)}" value="${h(f.value)}" min="${h(f.min)}" step="${f.integer?'1':'any'}" required></label>`).join('\n');
    return `<section class="panel"><h2>Inputs</h2><form id="calculator"><div class="specs">${fields}</div><div class="controls"><button type="button" id="reset">Reset example</button></div></form></section>
<section class="panel" aria-labelledby="result-heading"><h2 id="result-heading">Results</h2><p id="error" class="error" role="alert" hidden></p><div class="metrics" id="metrics" aria-live="polite"></div></section><p class="hint spacer">${h(spec.assumption)}</p>`;
  }
  const fields=spec.fields.map(f=>`<label class="field"><span>${h(f.name.slice(2).split('-').join(' '))}${f.required?' (required)':''}</span><input name="${h(f.name)}" type="${f.kind==='integer'?'number':'text'}" ${f.kind==='integer'?'min="1" step="1"':''} ${f.required?'required':''} maxlength="1024" autocomplete="off" spellcheck="false"><small><code>${h(f.name)}</code></small></label>`).join('\n');
  return `<section class="panel"><h2>Command options</h2><form id="command-form"><div class="specs">${fields}</div><div class="controls"><button type="button" id="reset">Clear fields</button></div></form></section>
<section class="panel"><h2>Shell command</h2><pre id="preview"></pre><div class="controls"><button class="primary" id="copy" type="button">Copy command</button><span id="status" role="status"></span></div></section>
<p class="hint spacer">Copy the POSIX shell command to your own configured OCI CLI to run it. This page processes the options locally. <a href="${h(spec.source)}">Oracle command reference</a></p>`;
}
function appPage(type,spec) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(spec.title)} | Daily Cloud Tools</title><meta name="description" content="${h(spec.summary)}"><link rel="stylesheet" href="../../style.css"><script src="model.js" defer></script><script src="../../shared/${type}.js" defer></script></head>
<body><header><nav class="nav"><a class="brand" href="../../">Daily Cloud Tools</a><a href="https://github.com/lavkeshhhh/daily-cloud-tools/tree/main/site/apps/${spec.slug}">Source</a></nav></header><main><p class="category">${h(spec.category)}</p><h1>${h(spec.title)}</h1><p class="intro">${h(spec.summary)}</p>
${formBody(type,spec)}</main><footer>Daily Cloud Tools</footer></body></html>\n`;
}
function programNotes(type,spec,date) {
  const describe=type==='calculator'?spec.assumption:'Enter the required scope and any desired supported filters. Copy the generated command into a configured OCI CLI. The helper does not access an Oracle account. For additional parameters see the [official command reference]('+spec.source+').';
  const example=type==='calculator'?Object.fromEntries(spec.inputs.map(f=>[f.key,f.value])):Object.fromEntries(spec.fields.filter(f=>f.required).map(f=>[f.name,f.kind==='integer'?'1':'example-value']));
  return ['# '+spec.title,'Released '+date+'. '+spec.summary,describe,'## Run','Open index.html through the [portfolio](https://lavkeshhhh.github.io/daily-cloud-tools/apps/'+spec.slug+'/). The browser interface uses the shared stylesheet and '+type+' UI in site/shared. The standalone Node program in this directory requires no packages.','```sh\nnode model.js '+"'"+JSON.stringify(example)+"'"+'\n```','## Verification','From the repository root run `node --test test/*.test.cjs` and `node scripts/verify.cjs`. The project metadata and expected examples are in tool.json and cases.json. The generator is scripts/publish.cjs.'].join('\n\n')+'\n';
}
function publish(site=siteRoot,date=localDate()) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Use a date in YYYY-MM-DD format');
  const released=toolsIn(site);
  const today=released.filter(t=>t.released===date && t.edition==='daily');
  if(today.length>1) throw Error('Multiple daily releases exist for '+date);
  if(today.length) {renderCatalog(site);return {created:false,slug:today[0].slug,date};}
  const {type,spec}=nextTool(site,released);
  assertSpec(type,spec);
  const tmp=fs.mkdtempSync(path.join(site,'.build-'));
  try {
    const meta={slug:spec.slug,title:spec.title,category:spec.category,summary:spec.summary,released:date,edition:'daily',type};
    const files={'model.js':modelSource(type,spec),'index.html':appPage(type,spec),'PROJECT.md':programNotes(type,spec,date),'tool.json':JSON.stringify(meta,null,2)+'\n'};
    const examples=type==='calculator'?spec.cases:[{values:Object.fromEntries(spec.fields.filter(f=>f.required).map(f=>[f.name,f.kind==='integer'?'1':'example-value'])),command:spec.command,required:spec.fields.filter(f=>f.required).map(f=>f.name)}];
    files['cases.json']=JSON.stringify(examples,null,2)+'\n';
    for(const [name,body] of Object.entries(files)) fs.writeFileSync(path.join(tmp,name),body);
    fs.renameSync(tmp,path.join(site,'apps',spec.slug));
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
  renderCatalog(site);
  return {created:true,slug:spec.slug,date};
}
module.exports={localDate,publish,modelSource,assertSpec};
if(require.main===module) console.log(JSON.stringify(publish(),null,2));
