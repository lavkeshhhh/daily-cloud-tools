'use strict';

const dailyTool = {
  "slug": "oracle-session-budget",
  "title": "Oracle Session Budget",
  "category": "Oracle Database",
  "summary": "Size an application pool against a database session budget, including replicas that overlap during rollout.",
  "assumption": "Supply the usable session limit for this service after accounting for other workloads. Each live application replica can open its entire pool.",
  "inputs": [
    {
      "key": "limit",
      "label": "Session budget",
      "value": 480,
      "min": 1,
      "integer": true
    },
    {
      "key": "reserve",
      "label": "Sessions reserved elsewhere",
      "value": 80,
      "min": 0,
      "integer": true
    },
    {
      "key": "replicas",
      "label": "Steady replicas",
      "value": 8,
      "min": 1,
      "integer": true
    },
    {
      "key": "surge",
      "label": "Extra rollout replicas",
      "value": 2,
      "min": 0,
      "integer": true
    },
    {
      "key": "pool",
      "label": "Current pool maximum per replica",
      "value": 45,
      "min": 1,
      "integer": true
    }
  ],
  "outputs": [
    {
      "key": "maximum",
      "label": "Suggested maximum per replica",
      "unit": "sessions"
    },
    {
      "key": "peak",
      "label": "Peak pool demand",
      "unit": "sessions"
    },
    {
      "key": "headroom",
      "label": "Remaining session budget",
      "unit": "sessions"
    }
  ]
};

const solve = ({limit,reserve,replicas,surge,pool})=>{const count=replicas+surge; const peak=count*pool; return {maximum:Math.max(0,Math.floor((limit-reserve)/count)),peak,headroom:limit-reserve-peak};};

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
