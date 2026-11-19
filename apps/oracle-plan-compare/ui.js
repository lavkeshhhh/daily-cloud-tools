'use strict';
const byId = id => document.getElementById(id);
const make = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
let comparison = [];
function render() {
  const counts = byId('counts');
  counts.replaceChildren();
  for (const kind of ['Added','Removed','Changed','Same']) {
    const total = comparison.filter(row => row.kind === kind).length;
    counts.append(make('span', total + ' ' + (kind === 'Same' ? 'unchanged' : kind.toLowerCase()), 'tag ' + kind.toLowerCase()));
  }
  const rows = byId('rows');
  rows.replaceChildren();
  for (const row of comparison) {
    if (row.kind === 'Same' && !byId('same').checked) continue;
    const step = row.current || row.prior;
    const tr = make('tr');
    const kind = make('td');
    kind.append(make('span', row.kind, 'tag ' + row.kind.toLowerCase()));
    const operation = make('td');
    operation.append(make('code', step.operation));
    if (step.object) operation.append(make('br'), make('small', step.object));
    const metrics = make('td');
    for (const item of row.changes) metrics.append(make('div', item.label + '  ' + (item.from || 'Unavailable') + ' → ' + (item.to || 'Unavailable')));
    tr.append(kind, make('td', (row.prior?.id ?? '·') + ' / ' + (row.current?.id ?? '·')), operation, metrics);
    rows.append(tr);
  }
  byId('empty').hidden = rows.children.length > 0;
}
function compare() {
  const err = byId('error');
  err.hidden = true;
  let side = 'Baseline';
  try {
    const before = parsePlan(byId('before').value);
    side = 'Candidate';
    const after = parsePlan(byId('after').value);
    comparison = comparePlans(before, after);
    byId('hashes').textContent = 'Plan hash values  ' + (before.hash || 'Unavailable') + ' → ' + (after.hash || 'Unavailable');
    byId('results').hidden = false;
    render();
  } catch (error) {
    err.textContent = side + ' plan. ' + error.message;
    err.hidden = false;
    byId('results').hidden = true;
  }
}
function example() {
  byId('before').value = sampleBefore;
  byId('after').value = sampleAfter;
  compare();
}
byId('compare').onclick = compare;
byId('example').onclick = example;
byId('same').onchange = render;
byId('clear').onclick = () => {
  byId('before').value = byId('after').value = '';
  byId('results').hidden = byId('error').hidden = true;
  byId('before').focus();
};
for (const id of ['before','after']) byId(id).oninput = () => {
  byId('results').hidden = byId('error').hidden = true;
};
example();
