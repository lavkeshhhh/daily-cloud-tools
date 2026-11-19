'use strict';

// Copied into the daily program so it runs without the publisher.
function runCalculator(values) {
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
}

function buildCommand(values) {
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
}

module.exports = {runCalculator,buildCommand};
