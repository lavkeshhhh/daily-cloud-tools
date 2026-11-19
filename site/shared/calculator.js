'use strict';
const resultArea = document.getElementById('metrics');
const calcForm = document.getElementById('calculator');
const calcError = document.getElementById('error');
function recalculate() {
  try {
    const values = Object.fromEntries(dailyTool.inputs.map(field => {
      const control = calcForm.elements.namedItem(field.key);
      if (!control.value.trim()) throw Error('Enter '+field.label.toLowerCase()+'.');
      return [field.key, Number(control.value)];
    }));
    const result = runTool(values);
    resultArea.replaceChildren();
    for (const field of dailyTool.outputs) {
      const box = document.createElement('div'), label = document.createElement('span'), number = document.createElement('strong');
      box.className='stat';label.textContent=field.label;
      number.textContent=result[field.key]===null?'No finite time':new Intl.NumberFormat(undefined,{maximumFractionDigits:4}).format(result[field.key])+' '+field.unit;
      box.append(label,number);resultArea.append(box);
    }
    calcError.hidden=true;
  } catch(error) {
    resultArea.replaceChildren();calcError.textContent=error.message;calcError.hidden=false;
  }
}
calcForm.addEventListener('submit',event=>{event.preventDefault();recalculate();});
calcForm.addEventListener('input',recalculate);
document.getElementById('reset').onclick=()=>{calcForm.reset();recalculate();};
recalculate();
