'use strict';

const dailyTool = {
  "slug": "oci-os-bucket-list",
  "title": "List Object Storage Buckets",
  "category": "Oracle Cloud",
  "summary": "Build the oci os bucket list command with its documented scope and filters.",
  "command": [
    "oci",
    "os",
    "bucket",
    "list"
  ],
  "fields": [
    {
      "name": "--compartment-id",
      "kind": "text",
      "required": true
    },
    {
      "name": "--limit",
      "kind": "integer",
      "required": false
    },
    {
      "name": "--namespace-name",
      "kind": "text",
      "required": false
    },
    {
      "name": "--page",
      "kind": "text",
      "required": false
    }
  ],
  "source": "https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/os/bucket/list.html"
};

const runTool = function buildCommand(values) {
  const args = dailyTool.command.slice(), words = args.slice();
  for (const field of dailyTool.fields) {
    const value = String(values[field.name] ?? '').trim();
    if (!value) {
      if (field.required) throw Error('Enter a value for '+field.name+'.');
      continue;
    }
    if (value.length>1024 || /[\u0000-\u001f\u007f]/.test(value)) throw Error('Use a single short line for '+field.name+'.');
    if (field.kind==='integer' && !/^[1-9]\d*$/.test(value)) throw Error(field.name+' needs a positive integer.');
    args.push(field.name+'='+value);
    words.push(field.name+"='"+value.split("'").join("'\"'\"'")+"'");
  }
  return {argv:args,command:words.join(' ')};
};

if(typeof module!=='undefined') {
  module.exports={dailyTool,runTool};
  if(require.main===module) {
    try { console.log(JSON.stringify(runTool(JSON.parse(process.argv[2] || '{}')),null,2)); }
    catch(error) { console.error(error.message); process.exitCode=1; }
  }
}
