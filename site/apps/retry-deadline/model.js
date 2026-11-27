'use strict';

const dailyTool = {
  "slug": "retry-deadline",
  "title": "Retry Deadline Planner",
  "category": "API engineering",
  "summary": "Add up attempt timeouts and capped exponential backoff to check whether a retry policy fits its deadline.",
  "assumption": "The first request has no backoff. Every attempt takes its full timeout, including the last. Random jitter and Retry-After are excluded.",
  "inputs": [
    {
      "key": "attempts",
      "label": "Total attempts (1 to 30)",
      "value": 4,
      "min": 1,
      "integer": true
    },
    {
      "key": "timeout",
      "label": "Timeout per attempt (ms)",
      "value": 800,
      "min": 1,
      "integer": false
    },
    {
      "key": "initial",
      "label": "First backoff (ms)",
      "value": 200,
      "min": 0,
      "integer": false
    },
    {
      "key": "cap",
      "label": "Backoff cap (ms)",
      "value": 1000,
      "min": 0,
      "integer": false
    },
    {
      "key": "deadline",
      "label": "Caller deadline (ms)",
      "value": 5000,
      "min": 1,
      "integer": false
    }
  ],
  "outputs": [
    {
      "key": "total",
      "label": "Worst-case duration",
      "unit": "ms"
    },
    {
      "key": "wait",
      "label": "Total backoff",
      "unit": "ms"
    },
    {
      "key": "slack",
      "label": "Deadline margin",
      "unit": "ms"
    }
  ]
};

const solve = ({attempts,timeout,initial,cap,deadline})=>{if(attempts>30)throw Error('Use at most 30 attempts.');let wait=0;for(let i=0;i<attempts-1;i++)wait+=Math.min(initial*2**i,cap);const total=attempts*timeout+wait;return {total,wait,slack:deadline-total};};

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
