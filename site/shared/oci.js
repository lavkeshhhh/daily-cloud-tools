'use strict';
const form = document.getElementById('command-form');
const preview = document.getElementById('preview');
const copy = document.getElementById('copy');
const statusLine = document.getElementById('status');
function updateCommand() {
  const values=Object.fromEntries(new FormData(form));
  try {
    preview.textContent=runTool(values).command;
    copy.disabled=false;
    statusLine.textContent='';
  } catch(error) {
    preview.textContent=dailyTool.command.join(' ');
    copy.disabled=true;
    statusLine.textContent=error.message;
  }
}
form.addEventListener('input',updateCommand);
form.addEventListener('submit',event=>{event.preventDefault();updateCommand();});
document.getElementById('reset').onclick=()=>{form.reset();updateCommand();};
copy.onclick=async()=>{
  try {await navigator.clipboard.writeText(preview.textContent);statusLine.textContent='Command copied.';}
  catch {statusLine.textContent='Select and copy the command shown above.';}
};
updateCommand();
