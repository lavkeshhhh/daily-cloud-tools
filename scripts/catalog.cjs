'use strict';
const fs = require('node:fs');
const path = require('node:path');

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toolsIn(site) {
  return fs.readdirSync(path.join(site,'apps'), {withFileTypes:true}).filter(entry=>entry.isDirectory()).map(entry=>{
    const directory = path.join(site,'apps',entry.name);
    const meta = JSON.parse(fs.readFileSync(path.join(directory,'tool.json'),'utf8'));
    if (entry.name !== meta.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) throw new Error('Invalid tool folder: '+entry.name);
    for (const file of ['index.html','PROJECT.md']) if (!fs.existsSync(path.join(directory,file))) throw new Error('Missing '+entry.name+'/'+file);
    return meta;
  }).sort((a,b)=>b.released.localeCompare(a.released) || a.title.localeCompare(b.title));
}
function renderCatalog(site) {
  const tools = toolsIn(site);
  const cards = tools.map(tool=>`<article class="panel card"><p class="category">${escapeHtml(tool.category)}</p><h2>${escapeHtml(tool.title)}</h2><p>${escapeHtml(tool.summary)}</p><p class="hint date">Released <time datetime="${escapeHtml(tool.released)}">${escapeHtml(tool.released)}</time></p><a class="button primary" href="apps/${tool.slug}/" aria-label="Open ${escapeHtml(tool.title)}">Open tool →</a></article>`).join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daily Cloud Tools</title><meta name="description" content="Small browser tools for Oracle, cloud operations and software engineering."><link rel="stylesheet" href="style.css"></head>
<body><header><nav class="nav"><a class="brand" href="./">Daily Cloud Tools</a><a href="https://github.com/lavkeshhhh/daily-cloud-tools">GitHub</a></nav></header><main><h1>Daily Cloud Tools</h1><p class="intro">A collection of browser tools for database and cloud engineers. Open a tool to use it with your own inputs.</p><div class="grid">${cards}</div></main><footer>Daily Cloud Tools</footer></body></html>\n`;
  fs.writeFileSync(path.join(site,'index.html'),html);
}
module.exports = { renderCatalog, toolsIn, escapeHtml };
if (require.main === module) renderCatalog(path.resolve(__dirname,'../site'));
