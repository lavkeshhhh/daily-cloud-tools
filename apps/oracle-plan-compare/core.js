'use strict';

function parsePlan(text) {
  if (text.length > 500000) throw new Error('Use a plan smaller than 500,000 characters.');
  const lines = text.split(/\r?\n/);
  const hashes = lines.map(line => line.match(/^\s*Plan hash value:\s*(\d+)/i)).filter(Boolean);
  if (hashes.length > 1) throw new Error('Paste a single plan on each side.');
  const steps = [];
  let header;
  let previousId = -1;
  const path = [];
  const occurrences = new Map();

  for (const line of lines) {
    if (!/^\s*\|/.test(line) || !line.trimEnd().endsWith('|')) continue;
    const cells = line.trim().slice(1, -1).split('|');
    const labels = cells.map(value => value.trim().toLowerCase());
    if (labels.includes('id') && labels.includes('operation')) {
      header = labels;
      continue;
    }
    if (!header) continue;
    const value = key => (cells[header.indexOf(key)] || '').trim();
    const idText = value('id');
    if (!/^[*\s-]*\d+$/.test(idText)) continue;
    const id = Number(idText.match(/\d+$/)[0]);
    if (id === 0 && previousId >= 0) throw new Error('Multiple plan tables found. Paste one plan at a time.');
    previousId = id;
    const operationCell = cells[header.indexOf('operation')] || '';
    const operation = operationCell.trim();
    if (!operation) throw new Error('An operation is missing. Paste the complete plan table.');
    const depth = operationCell.length - operationCell.trimStart().length;
    while (path.length && path[path.length - 1].depth >= depth) path.pop();
    const object = value('name');
    const parent = path.length ? path[path.length - 1].key : '';
    const identity = JSON.stringify([parent, operation, object]);
    const ordinal = (occurrences.get(identity) || 0) + 1;
    occurrences.set(identity, ordinal);
    // Length-prefix the path component so identifiers can contain separators.
    const component = JSON.stringify([operation, object, ordinal]);
    const key = parent + component.length + ':' + component;
    path.push({ depth, key });
    const costHeading = header.find(label => /^cost(?:\s|$)/.test(label));
    const costValue = value(costHeading);
    const metrics = {
      rows: value('e-rows') || value('rows'), cost: costValue.replace(/\s*\([^)]*\)\s*$/, '').trim(),
      actual: value('a-rows'), starts: value('starts'), buffers: value('buffers'),
      active: idText.includes('-') ? 'inactive' : 'active'
    };
    steps.push({ key, id, operation, object, metrics });
  }
  if (!steps.length) throw new Error('Expected an Oracle text plan with | Id | Operation | column headings and at least one operation.');
  return { hash: hashes[0]?.[1] || '', steps };
}

const metricLabels = { rows: 'Estimated rows', cost: 'Cost', actual: 'Actual rows', starts: 'Starts', buffers: 'Buffers', active: 'State' };

function comparePlans(before, after) {
  const old = new Map(before.steps.map(step => [step.key, step]));
  const rows = [];
  for (const current of after.steps) {
    const prior = old.get(current.key);
    if (!prior) {
      rows.push({ kind: 'Added', current, changes: [] });
      continue;
    }
    old.delete(current.key);
    const changes = [];
    for (const [metric, label] of Object.entries(metricLabels)) {
      const from = prior.metrics[metric], to = current.metrics[metric];
      if (from !== to) changes.push({ label, from, to });
    }
    rows.push({ kind: changes.length ? 'Changed' : 'Same', prior, current, changes });
  }
  for (const prior of old.values()) rows.push({ kind: 'Removed', prior, changes: [] });
  return rows;
}

if (typeof module !== 'undefined') module.exports = { parsePlan, comparePlans };
