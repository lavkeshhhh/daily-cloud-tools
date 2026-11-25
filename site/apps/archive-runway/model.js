'use strict';

const dailyTool = {
  "slug": "archive-runway",
  "title": "Archive Storage Runway",
  "category": "Database operations",
  "summary": "Estimate when archive storage will reach its reserve threshold using observed generation and reclamation rates.",
  "assumption": "Both rates use GiB per day and must refer to the same destination. Results assume steady rates and the capacity you entered.",
  "inputs": [
    {
      "key": "free",
      "label": "Free capacity (GiB)",
      "value": 980,
      "min": 0,
      "integer": false
    },
    {
      "key": "reserve",
      "label": "Reserve to preserve (GiB)",
      "value": 140,
      "min": 0,
      "integer": false
    },
    {
      "key": "generated",
      "label": "Archive generation (GiB/day)",
      "value": 96,
      "min": 0,
      "integer": false
    },
    {
      "key": "reclaimed",
      "label": "Archive reclamation (GiB/day)",
      "value": 36,
      "min": 0,
      "integer": false
    }
  ],
  "outputs": [
    {
      "key": "days",
      "label": "Time to reserve",
      "unit": "days"
    },
    {
      "key": "net",
      "label": "Net growth",
      "unit": "GiB/day"
    },
    {
      "key": "usable",
      "label": "Capacity above reserve",
      "unit": "GiB"
    }
  ]
};

const solve = ({free,reserve,generated,reclaimed})=>{const usable=Math.max(0,free-reserve),net=generated-reclaimed;return {days:usable===0?0:(net>0?usable/net:null),net,usable};};

const runTool = function runCalculator(values) {
  const inputs = {};
  for (const field of dailyTool.inputs) {
    const value = values[field.key] === undefined ? field.value : values[field.key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < field.min ||
        Math.abs(value) > Number.MAX_SAFE_INTEGER || (field.integer && !Number.isSafeInteger(value))) {
      throw Error('Enter a valid '+(field.integer?'whole number':'number')+' for '+field.label+'.');
    }
    inputs[field.key] = value;
  }
  const result = solve(inputs);
  if (Object.values(result).some(n => n !== null && !Number.isFinite(n))) throw Error('The result exceeds the numeric range.');
  return result;
};

if(typeof module!=='undefined') {
  module.exports={dailyTool,runTool};
  if(require.main===module) {
    try { console.log(JSON.stringify(runTool(JSON.parse(process.argv[2] || '{}')),null,2)); }
    catch(error) { console.error(error.message); process.exitCode=1; }
  }
}
