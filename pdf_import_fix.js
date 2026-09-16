(function(){
'use strict';
const KEY='abc_upbp2_data_v2';let selected=null,activities=[];const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
function status(msg,type){const e=$('flowPdfStatus');if(e){e.className='pdf-status'+(type?' '+type:'');e.textContent=msg||''}}
function fileUI(){const box=$('flowPdfFiles');if(!box)return;if(!selected){box.innerHTML='';return}box.innerHTML='<div class="pdf-file-item"><div class="pdf-file-icon"><i class="fa-solid fa-file-pdf"></i></div><div class="pdf-file-info"><b>'+esc(selected.name)+'</b><small>PDF · '+(selected.size/1024).toFixed(1)+' KB · Archivo cargado y listo para analizar</small></div></div>'}
function preview(){const box=$('flowPdfPreview');if(!box)return;if(!activities.length){box.innerHTML='';return}box.innerHTML='<div class="pdf-preview-title"><b>Actividades detectadas</b><span>'+activities.length+' encontradas</span></div><div class="table-scroll"><table><thead><tr><th>Orden</th><th>Actividad</th><th>Encargado</th><th>Descripción</th></tr></thead><tbody>'+activities.map((a,i)=>'<tr><td><input class="pdf-edit order" type="number" min="1" value="'+(Number(a.order)||i+1)+'" data-i="'+i+'" data-k="order"></td><td><input class="pdf-edit" value="'+esc(a.name||'')+'" data-i="'+i+'" data-k="name"></td><td><input class="pdf-edit" value="'+esc(a.owner||'')+'" data-i="'+i+'" data-k="owner"></td><td><textarea class="pdf-edit" rows="2" data-i="'+i+'" data-k="description">'+esc(a.description||'')+'</textarea></td></tr>').join('')+'</tbody></table></div><div class="pdf-preview-actions"><button type="button" class="btn" id="pdfFixImport"><i class="fa-solid fa-file-import"></i> Importar al flujograma</button><button type="button" class="ghost" id="pdfFixCancel">Cancelar</button></div>';box.querySelectorAll('[data-i]').forEach(el=>el.addEventListener('change',()=>{const i=Number(el.dataset.i),k=el.dataset.k;activities[i][k]=k==='order'?(Number(el.value)||1):el.value.trim()}));$('pdfFixImport').onclick=importActivities;$('pdfFixCancel').onclick=()=>{activities=[];preview();status('')};}
async function analyze(){
 if(!selected){status('Primero selecciona un PDF con “Importar PDF”.','error');return}
 const btn=$('btnAnalyzeFlowPdf'),fd=new FormData();
 fd.append('pdf',selected,selected.name);
 if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Analizando...'}
 status('Analizando el PDF con Python y PyMuPDF...','loading');
 try{
  const res=await fetch('api/importar_flujo.php?v12=1',{
   method:'POST',body:fd,cache:'no-store',
   headers:{'Accept':'application/json'}
  });
  const raw=await res.text();
  let data=null;
  try{data=JSON.parse(raw)}catch(parseErr){
   throw new Error('El servidor devolvió una respuesta que no es JSON (HTTP '+res.status+'). Respuesta: '+raw.slice(0,1500));
  }
  if(!res.ok||!data.success){
   let msg=data.message||('El servidor respondió con HTTP '+res.status+'.');
   if(data.python_stderr)msg+=' | Python: '+data.python_stderr.trim();
   if(data.python_stdout && !data.success)msg+=' | Salida: '+data.python_stdout.trim().slice(0,800);
   throw new Error(msg);
  }
  activities=Array.isArray(data.activities)?data.activities:[];
  if(!activities.length)throw new Error(data.message||'Python no encontró actividades en el PDF.');
  status(data.message||('Se detectaron '+activities.length+' actividades.'),'success');
  preview();
 }catch(e){
  activities=[];preview();
  status(e.message||'No se pudo analizar el PDF.','error');
 }finally{
  if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-magnifying-glass"></i> Analizar PDF'}
 }
}
function importActivities(){if(!activities.length){status('Primero analiza el PDF.','error');return}let state={processes:[],months:[],cifs:[],pools:[]};try{state=JSON.parse(localStorage.getItem(KEY))||state}catch(e){}const max=state.processes.reduce((m,p)=>Math.max(m,Number(p.order)||0),0);activities.forEach((a,i)=>state.processes.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),name:String(a.name||'').trim(),owner:String(a.owner||'').trim(),description:String(a.description||'').trim(),order:Number(a.order)||max+i+1}));localStorage.setItem(KEY,JSON.stringify(state));activities=[];preview();status('Actividades importadas correctamente al flujograma.','success');setTimeout(()=>location.reload(),500)}
function boot(){const input=$('flowPdfInput'),choose=$('btnChooseFlowPdf'),btn=$('btnAnalyzeFlowPdf');if(!input||!btn)return;btn.disabled=false;if(choose)choose.onclick=function(e){e.preventDefault();input.click()};input.onchange=function(){selected=input.files&&input.files[0]?input.files[0]:null;activities=[];fileUI();preview();if(selected)status('Archivo cargado: '+selected.name+'. Presiona “Analizar PDF”.','success');else status('')};btn.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();analyze()};fileUI()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
