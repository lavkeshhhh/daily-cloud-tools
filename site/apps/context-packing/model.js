'use strict';

const dailyTool = {
  "slug": "context-packing",
  "title": "RAG Context Budget",
  "category": "AI engineering",
  "summary": "Find how many equal-sized retrieval chunks fit after reserving room for the prompt, history and answer.",
  "assumption": "Use token counts from the target model tokenizer. Each chunk incurs the same citation and formatting overhead.",
  "inputs": [
    {
      "key": "window",
      "label": "Model context (tokens)",
      "value": 8192,
      "min": 1,
      "integer": true
    },
    {
      "key": "prompt",
      "label": "Prompt and history (tokens)",
      "value": 1200,
      "min": 0,
      "integer": true
    },
    {
      "key": "answer",
      "label": "Answer reserve (tokens)",
      "value": 1500,
      "min": 0,
      "integer": true
    },
    {
      "key": "chunk",
      "label": "Text tokens per chunk",
      "value": 600,
      "min": 1,
      "integer": true
    },
    {
      "key": "overhead",
      "label": "Metadata tokens per chunk",
      "value": 40,
      "min": 0,
      "integer": true
    }
  ],
  "outputs": [
    {
      "key": "chunks",
      "label": "Whole chunks",
      "unit": "chunks"
    },
    {
      "key": "left",
      "label": "Unused context after packing",
      "unit": "tokens"
    },
    {
      "key": "over",
      "label": "Fixed budget overflow",
      "unit": "tokens"
    }
  ]
};

const solve = ({window,prompt,answer,chunk,overhead})=>{const budget=window-prompt-answer;const chunks=Math.max(0,Math.floor(budget/(chunk+overhead)));return {chunks,left:Math.max(0,budget-chunks*(chunk+overhead)),over:Math.max(0,-budget)};};

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
