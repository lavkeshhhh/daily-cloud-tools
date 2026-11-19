'use strict';

const dailyTool = {
  "slug": "queue-recovery",
  "title": "Queue Recovery Calculator",
  "category": "Service operations",
  "summary": "Estimate when a worker pool will clear its backlog while new jobs continue to arrive.",
  "assumption": "Assumes steady arrival and processing rates. With no spare processing capacity, a nonempty backlog has no finite drain time.",
  "inputs": [
    {
      "key": "backlog",
      "label": "Queued jobs",
      "value": 18000,
      "min": 0,
      "integer": true
    },
    {
      "key": "incoming",
      "label": "New jobs per second",
      "value": 40,
      "min": 0,
      "integer": false
    },
    {
      "key": "workers",
      "label": "Active workers",
      "value": 6,
      "min": 1,
      "integer": true
    },
    {
      "key": "rate",
      "label": "Jobs per worker per second",
      "value": 10,
      "min": 0.000001,
      "integer": false
    },
    {
      "key": "target",
      "label": "Target drain time (minutes)",
      "value": 10,
      "min": 0.000001,
      "integer": false
    }
  ],
  "outputs": [
    {
      "key": "minutes",
      "label": "Time to clear",
      "unit": "min"
    },
    {
      "key": "spare",
      "label": "Net processing capacity",
      "unit": "jobs/s"
    },
    {
      "key": "needed",
      "label": "Workers for target",
      "unit": "workers"
    }
  ]
};

const solve = ({backlog,incoming,workers,rate,target})=>{
      const spare=workers*rate-incoming;
      return {minutes:backlog===0?0:(spare>0?backlog/spare/60:null),spare,needed:Math.ceil((incoming+backlog/(target*60))/rate)};
    };

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
