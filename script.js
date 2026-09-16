const KEY='abc_upbp2_data_v2';
let state=loadState();
let productionChart=null, surplusChart=null, allocationChart=null, homeCifChart=null, homePoolChart=null, homeMonthlyCifChart=null;
let expandedPools=new Set();
let editingProcessId=null, editingMonthId=null, editingCifId=null, editingPoolId=null, editingExpenseBudgetId=null, editingExpenseItemId=null;

const titles={inicio:'Sistema ABC - Proyecto P2',flujograma:'Flujograma',ventas:'Ventas',inventarios:'Inventarios',produccion:'Análisis de producción',material:'Costo de Material Directo',labor:'Costo de Mano de Obra Directa',cif:'Trabajo y cálculo de CIF',pools:'Pools de CIF',asignacion:'Asignación CIF',resultado:'CIF por unidad',presupuestos:'Presupuestos',final:'Estado de Ingresos y Presupuesto de Caja',flujoCaja:'Flujo de Caja'};
function loadState(){try{const s=JSON.parse(localStorage.getItem(KEY))||defaultState();(s.pools||[]).forEach(p=>{if(!Object.prototype.hasOwnProperty.call(p,'monthId'))p.monthId=s.months?.[0]?.id||''});return s}catch{return defaultState()}}
function defaultState(){return{processes:[],months:[],cifs:[],pools:[],materialDirect:{},directLabor:{},budget:{initialFinishedGoods:0},expenseBudgets:[],finalBudget:{salePrice:0,initialCash:0},flowCash:{investment:0,loan:0,interestRate:0,loanTerm:4,taxRate:25,ivaSales:13,ivaPurchases:13,itRate:3,depreciation:0,deferredAmort:0,residual:0,assetSaleGain:0}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function money(n){return Number(n||0).toLocaleString('es-BO',{style:'currency',currency:'BOB',maximumFractionDigits:2})}
function num(n){return Number(n||0).toLocaleString('es-BO',{maximumFractionDigits:2})}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function showSection(id){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.section===id));document.getElementById('pageTitle').textContent=titles[id]||'Sistema ABC';window.scrollTo({top:0,behavior:'smooth'});renderAll()}
function monthCalc(){let carry=0;return state.months.map((m,i)=>{let ini=i===0?Number(m.firstInventory||0):carry;let final=ini+Number(m.histProduction||0)-Number(m.histSales||0);carry=final;let desired=final;let required=Number(m.forecastSales||0)+desired-ini;return{...m,initial:ini,final,desired,required}})}
function monthOptions(id,selected){const el=document.getElementById(id);if(!el)return;el.innerHTML=state.months.map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${esc(m.name)}</option>`).join('');}

function refreshCifReuseOptions(selectedMonthId){
 const el=document.getElementById('cifReuse');
 if(!el)return;
 const concepts=[];
 const seen=new Set();
 state.cifs.filter(c=>c.monthId!==selectedMonthId).forEach(c=>{
   const key=String(c.item||'').trim().toLowerCase();
   if(!key||seen.has(key))return;
   seen.add(key);
   const month=state.months.find(m=>m.id===c.monthId);
   concepts.push({item:c.item,month:month?.name||'Otro mes'});
 });
 el.innerHTML='<option value="">— Seleccionar concepto existente —</option>'+
   concepts.map(c=>`<option value="${esc(c.item)}">${esc(c.item)} · ${esc(c.month)}</option>`).join('');
}

function resetCifForm(){
 editingCifId=null;
 const monthEl=document.getElementById('cifMonth');if(monthEl)monthEl.disabled=false;
 const month=document.getElementById('cifMonth')?.value||state.months[0]?.id||'';
 const item=document.getElementById('cifItem'); if(item)item.value='';
 const fixed=document.getElementById('cifFixed'); if(fixed)fixed.value='';
 const rate=document.getElementById('cifRate'); if(rate)rate.value='';
 const reuse=document.getElementById('cifReuse'); if(reuse)reuse.value='';
 const btn=document.getElementById('addCif'); if(btn)btn.innerHTML='<i class="fa-solid fa-plus"></i> Agregar CIF'; const cancel=document.getElementById('cancelCifEdit'); if(cancel)cancel.style.display='none';
 refreshCifReuseOptions(month);
}

function loadCifReuseConcept(item){
 const source=state.cifs.find(c=>c.item===item);
 if(!source)return;
 const input=document.getElementById('cifItem'); if(input)input.value=source.item||'';
 // Copy only the concept name. Fixed cost and rate stay independent for the new month.
 const fixed=document.getElementById('cifFixed'); if(fixed)fixed.value='';
 const rate=document.getElementById('cifRate'); if(rate)rate.value='';
}

function renderAll(){
 const ms=monthCalc();
 ['cifMonth','cifViewMonth','allocationMonth','unitMonth','homeCifMonth','poolMonth','poolViewMonth','mdMonth','mdViewMonth','laborMonth','laborViewMonth'].forEach((id)=>monthOptions(id,document.getElementById(id)?.value||ms[0]?.id));
 renderFlow();renderSales(ms);renderInventory(ms);renderProduction(ms);renderMaterial(ms);renderLabor(ms);renderCif();refreshCifReuseOptions(document.getElementById('cifMonth')?.value||ms[0]?.id||'');renderBudget(ms);renderExpenseBudgets(ms);renderPools();renderAllocation();renderResult();renderHome(ms);renderFinal(ms);renderFlowCash(ms);renderCharts(ms);
}
function renderHome(ms){document.getElementById('statSales').textContent=num(ms.reduce((a,m)=>a+Number(m.forecastSales||0),0));document.getElementById('statProduction').textContent=num(ms.reduce((a,m)=>a+m.required,0));let mid=document.getElementById('cifViewMonth')?.value||ms[0]?.id;document.getElementById('statCif').textContent=money(totalCif(mid));document.getElementById('statPools').textContent=state.pools.length}
function renderFlow(){const el=document.getElementById('flowList');if(!state.processes.length){el.innerHTML='<div class="empty">Aún no hay procesos. Agrega el primero arriba.</div>';return}el.innerHTML=state.processes.slice().sort((a,b)=>(a.order||0)-(b.order||0)).map((p,i)=>`<div class="flow-card"><div class="flow-index">${p.order||i+1}</div><div><b>${esc(p.name)}</b><span><i class="fa-solid fa-user"></i> Encargado: ${esc(p.owner||'Sin asignar')}</span>${p.description?`<small class="flow-description"><i class="fa-solid fa-align-left"></i> ${esc(p.description)}</small>`:''}</div><button class="icon" title="Editar proceso" onclick="startEditProcess('${p.id}')"><i class="fa-solid fa-pen"></i></button><button class="icon danger" title="Eliminar proceso" onclick="deleteProcess('${p.id}')"><i class="fa-solid fa-trash"></i></button></div>`).join('')}
function renderSales(ms){const el=document.getElementById('salesTable');el.innerHTML=ms.map(m=>`<tr><td>${esc(m.name)}</td><td>${num(m.histSales)}</td><td>${num(m.histProduction)}</td><td>${num(m.forecastSales)}</td><td>${num(m.initial)}</td><td class="strong">${num(m.final)}</td><td class="row-actions"><button type="button" class="btn small edit-month-btn" title="Editar datos de este mes" onclick="startEditMonth('${m.id}')"><i class="fa-solid fa-pen"></i> Editar</button><button type="button" class="icon danger" title="Eliminar mes" onclick="deleteMonth('${m.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">Agrega al menos un mes.</td></tr>'}
function renderInventory(ms){document.getElementById('inventoryTable').innerHTML=ms.map(m=>`<tr><td>${esc(m.name)}</td><td>${num(m.initial)}</td><td>${num(m.histProduction)}</td><td>${num(m.histSales)}</td><td class="strong">${num(m.final)}</td><td> ${num(m.initial)} + ${num(m.histProduction)} − ${num(m.histSales)} = <b>${num(m.final)}</b></td></tr>`).join('')||'<tr><td colspan="6" class="empty">Sin datos.</td></tr>'}
function renderProduction(ms){document.getElementById('productionTable').innerHTML=ms.map(m=>`<tr><td>${esc(m.name)}</td><td>${num(m.forecastSales)}</td><td>${num(m.desired)}</td><td>${num(Number(m.forecastSales||0)+m.desired)}</td><td>${num(m.initial)}</td><td class="strong">${num(m.required)}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">Sin datos.</td></tr>'}
function getMaterialParams(monthId){
 state.materialDirect=state.materialDirect||{};
 if(!state.materialDirect[monthId])state.materialDirect[monthId]={unitCost:0,leadDays:0,firstInventory:0,nextRequiredOverride:0};
 return state.materialDirect[monthId];
}
function materialCalc(){
 const ms=monthCalc();
 state.materialDirect=state.materialDirect||{};
 return ms.map((m,i)=>{
  const p=getMaterialParams(m.id);
  const required=Number(m.required||0);
  const nextMonth=ms[i+1];
  const nextRequired=nextMonth?Number(nextMonth.required||0):Number(p.nextRequiredOverride||0);
  const leadDays=Number(p.leadDays||0);
  const leadPercent=(leadDays/30)*100;
  // Inventario inicial: Lead Time % × unidades requeridas del mes actual.
  const initial=required*(leadPercent/100);
  // Inventario final: Lead Time % × unidades requeridas del mes siguiente.
  const final=nextRequired*(leadPercent/100);
  const subtotal=required+final;
  const purchases=subtotal-initial;
  const unitCost=Number(p.unitCost||0);
  const totalCost=purchases*unitCost;
  return{...m,mdInitial:initial,mdNextRequired:nextRequired,mdLeadDays:leadDays,mdLeadPercent:leadPercent,mdFinal:final,mdSubtotal:subtotal,mdPurchases:purchases,mdUnitCost:unitCost,mdTotalCost:totalCost};
 });
}
let materialCalcCache=[];
function renderMaterial(ms){
 const head=document.getElementById('materialHead'), body=document.getElementById('materialTable');
 const monthId=document.getElementById('mdViewMonth')?.value||ms[0]?.id||'';
 if(!body||!head)return;
 if(!ms.length){head.innerHTML='<tr><th>Concepto</th><th>TOTAL</th></tr>';body.innerHTML='<tr><td colspan="2" class="empty">Primero agrega meses en Ventas.</td></tr>';return;}
 materialCalcCache=materialCalc();
 head.innerHTML='<tr><th>Concepto</th>'+materialCalcCache.map(m=>`<th>${esc(m.name)}</th>`).join('')+'<th>TOTAL</th></tr>';
 const rows=[
  ['(+) UNIDADES REQ. PROD.',m=>m.required,(arr)=>arr.reduce((a,m)=>a+Number(m.required||0),0),false],
  ['(+) INV. FINAL MAT. DIRECTO',m=>m.mdFinal,(arr)=>arr[arr.length-1]?.mdFinal||0,false],
  ['SUB TOTAL',m=>m.mdSubtotal,(arr)=>arr.reduce((a,m)=>a+Number(m.required||0),0)+(arr[arr.length-1]?.mdFinal||0),false],
  ['(-) INV. INICIAL MAT. DIRECTO',m=>m.mdInitial,(arr)=>arr[0]?.mdInitial||0,false],
  ['COMPRAS REQUERIDAS',m=>m.mdPurchases,(arr)=>{const subtotal=arr.reduce((a,m)=>a+Number(m.required||0),0)+(arr[arr.length-1]?.mdFinal||0);return subtotal-(arr[0]?.mdInitial||0)},false],
  ['COSTO UNITARIO DE MAT. DIRECTO',m=>m.mdUnitCost,(arr)=>{const purchases=arr.reduce((a,m)=>a+Number(m.mdPurchases||0),0);const cost=arr.reduce((a,m)=>a+Number(m.mdTotalCost||0),0);return purchases?cost/purchases:0},true],
  ['COSTO TOTAL DE MATERIAL DIRECTO',m=>m.mdTotalCost,(arr)=>arr.reduce((a,m)=>a+Number(m.mdTotalCost||0),0),true]
 ];
 body.innerHTML=rows.map((r,idx)=>{
  const cells=materialCalcCache.map(m=>idx===5?money(r[1](m)):idx===6?money(r[1](m)):num(r[1](m)));
  const total=r[2](materialCalcCache);
  return `<tr class="${idx===4?'material-highlight':''}"><td class="strong">${r[0]}</td>${cells.map((v)=>`<td>${v}</td>`).join('')}<td class="strong">${idx>=5?money(total):num(total)}</td></tr>`;
 }).join('');
 // Presupuesto de consumo de material directo: unidades requeridas × costo unitario.
 const consumptionHead=document.getElementById('materialConsumptionHead');
 const consumptionBody=document.getElementById('materialConsumptionTable');
 if(consumptionHead&&consumptionBody){
   consumptionHead.innerHTML='<th>Concepto</th>'+materialCalcCache.map(m=>`<th>${esc(m.name)}</th>`).join('')+'<th>TOTAL</th>';
   const totalUnits=materialCalcCache.reduce((a,m)=>a+Number(m.required||0),0);
   const totalConsumption=materialCalcCache.reduce((a,m)=>a+Number(m.required||0)*Number(m.mdUnitCost||0),0);
   consumptionBody.innerHTML=`<tr><td class="strong">(+) UNIDADES REQUERIDAS DE PRODUCCIÓN</td>${materialCalcCache.map(m=>`<td>${num(m.required)}</td>`).join('')}<td class="strong">${num(totalUnits)}</td></tr>
   <tr><td class="strong">(×) COSTO POR UNIDAD DE MAT. DIRECTO</td>${materialCalcCache.map(m=>`<td>${money(m.mdUnitCost)}</td>`).join('')}<td class="strong">${money(totalUnits?totalConsumption/totalUnits:0)}</td></tr>
   <tr class="material-consumption-total"><td class="strong">COSTO DE CONSUMO DE MATERIAL DIRECTO</td>${materialCalcCache.map(m=>`<td>${money(Number(m.required||0)*Number(m.mdUnitCost||0))}</td>`).join('')}<td class="strong">${money(totalConsumption)}</td></tr>`;
 }
 const selected=materialCalcCache.find(m=>m.id===monthId)||materialCalcCache[0];
 const param=getMaterialParams(selected.id);
 const fields={mdUnitCost:param.unitCost??'',mdLeadDays:param.leadDays??'',mdNextRequired:param.nextRequiredOverride??''};
 Object.entries(fields).forEach(([id,val])=>{const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=val});
 const leadEl=document.getElementById('mdLeadPercent');if(leadEl)leadEl.textContent=Number(selected.mdLeadPercent||0).toFixed(2)+'%';
 const nextEl=document.getElementById('mdNextProduction');if(nextEl)nextEl.textContent=num(selected.mdNextRequired);
 const costEl=document.getElementById('mdTotalCost');if(costEl)costEl.textContent=money(selected.mdTotalCost);
}
function getLaborParams(monthId){
 state.directLabor=state.directLabor||{};
 if(!state.directLabor[monthId])state.directLabor[monthId]={hoursPerUnit:0,costPerHour:0};
 return state.directLabor[monthId];
}
function laborCalc(){
 const ms=monthCalc();
 state.directLabor=state.directLabor||{};
 return ms.map(m=>{
  const p=getLaborParams(m.id);
  const required=Number(m.required||0);
  const hoursPerUnit=Number(p.hoursPerUnit||0);
  const totalHours=hoursPerUnit*required;
  const costPerHour=Number(p.costPerHour||0);
  const totalCost=totalHours*costPerHour;
  return {...m,laborHoursPerUnit:hoursPerUnit,laborTotalHours:totalHours,laborCostPerHour:costPerHour,laborTotalCost:totalCost};
 });
}
let laborCalcCache=[];
function renderLabor(ms){
 const head=document.getElementById('laborHead'),body=document.getElementById('laborTable');
 const monthId=document.getElementById('laborViewMonth')?.value||ms[0]?.id||'';
 if(!body||!head)return;
 if(!ms.length){head.innerHTML='<tr><th>Concepto</th><th>TOTAL</th></tr>';body.innerHTML='<tr><td colspan="2" class="empty">Primero agrega meses en Ventas.</td></tr>';return;}
 laborCalcCache=laborCalc();
 head.innerHTML='<tr><th>CONCEPTO</th>'+laborCalcCache.map(m=>`<th>${esc(m.name)}</th>`).join('')+'<th>TOTAL</th></tr>';
 const rows=[
  ['UNIDADES REQ. PROD.',m=>m.required,arr=>arr.reduce((a,m)=>a+Number(m.required||0),0),false],
  ['HORAS POR UNIDAD',m=>m.laborHoursPerUnit,arr=>{const h=arr.reduce((a,m)=>a+Number(m.laborTotalHours||0),0);const u=arr.reduce((a,m)=>a+Number(m.required||0),0);return u?h/u:0},false],
  ['HORAS TOTALES MOD (HORAS/UNIDAD × UNID. REQ. PROD.)',m=>m.laborTotalHours,arr=>arr.reduce((a,m)=>a+Number(m.laborTotalHours||0),0),false],
  ['COSTO POR HORA',m=>m.laborCostPerHour,arr=>{const h=arr.reduce((a,m)=>a+Number(m.laborTotalHours||0),0);const c=arr.reduce((a,m)=>a+Number(m.laborTotalCost||0),0);return h?c/h:0},true],
  ['COSTO DE LA MANO DE OBRA DIRECTA',m=>m.laborTotalCost,arr=>arr.reduce((a,m)=>a+Number(m.laborTotalCost||0),0),true]
 ];
 body.innerHTML=rows.map((r,idx)=>{const cells=laborCalcCache.map(m=>idx===1?Number(r[1](m)).toFixed(6):idx>=3?money(r[1](m)):num(r[1](m)));const total=r[2](laborCalcCache);return `<tr class="${idx===4?'material-highlight':''}"><td class="strong">${r[0]}</td>${cells.map(v=>`<td>${v}</td>`).join('')}<td class="strong">${idx===1?Number(total).toFixed(6):idx>=3?money(total):num(total)}</td></tr>`}).join('');
 const selected=laborCalcCache.find(m=>m.id===monthId)||laborCalcCache[0];
 const p=getLaborParams(selected.id);
 const hEl=document.getElementById('laborHoursUnit'),cEl=document.getElementById('laborCostHour');
 if(hEl&&document.activeElement!==hEl)hEl.value=p.hoursPerUnit??'';
 if(cEl&&document.activeElement!==cEl)cEl.value=p.costPerHour??'';
 const th=document.getElementById('laborTotalHours');if(th)th.textContent=num(selected.laborTotalHours);
 const tc=document.getElementById('laborTotalCost');if(tc)tc.textContent=money(selected.laborTotalCost);
}
function getBudgetParams(){state.budget=state.budget||{initialFinishedGoods:0};state.expenseBudgets=Array.isArray(state.expenseBudgets)?state.expenseBudgets:[];return state.budget}
function budgetCalc(ms){
 const material=materialCalc();
 const labor=laborCalc();
 const initialParam=Number(getBudgetParams().initialFinishedGoods||0);
 let prevFinal=initialParam;
 return ms.map((m,i)=>{
  const md=material.find(x=>x.id===m.id)||{};
  const mo=labor.find(x=>x.id===m.id)||{};
  const required=Number(m.required||0);
  const materialConsumption=required*Number(md.mdUnitCost||0);
  const directLabor=Number(mo.laborTotalCost||0);
  const cif=Number(totalCif(m.id)||0);
  const manufacturing=materialConsumption+directLabor+cif;
  const initialFinishedGoods=i===0?initialParam:prevFinal;
  const desiredUnits=Number(m.desired||0);
  const finalFinishedGoods=required?manufacturing/required*desiredUnits:0;
  const available=manufacturing+initialFinishedGoods;
  const cogs=available-finalFinishedGoods;
  prevFinal=finalFinishedGoods;
  return {...m,budgetMaterialConsumption:materialConsumption,budgetLabor:directLabor,budgetCif:cif,budgetManufacturing:manufacturing,budgetInitialFinishedGoods:initialFinishedGoods,budgetAvailable:available,budgetFinalFinishedGoods:finalFinishedGoods,budgetCogs:cogs};
 });
}
function renderBudget(ms){
 const head=document.getElementById('budgetHeadRow'),body=document.getElementById('budgetTable'),detail=document.getElementById('budgetInventoryDetail');
 if(!head||!body)return;
 const input=document.getElementById('budgetInitialFinishedGoods');
 const p=getBudgetParams();
 if(input&&document.activeElement!==input)input.value=p.initialFinishedGoods??'';
 if(!ms.length){head.textContent='';body.innerHTML='<tr><td colspan="2" class="empty">Primero agrega meses en Ventas.</td></tr>';if(detail)detail.innerHTML='';return;}
 const rows=budgetCalc(ms);
 head.innerHTML='<th>Información</th>'+rows.map(m=>`<th>${esc(m.name)}</th>`).join('')+'<th>TOTAL</th>';
 const sum=r=>rows.reduce((a,m)=>a+Number(r(m)||0),0);
 const data=[
  ['(+) Costo de consumo de material directo',m=>m.budgetMaterialConsumption],
  ['(+) Costo de Mano de Obra Directa',m=>m.budgetLabor],
  ['(+) Costo Indirecto de Fabricación',m=>m.budgetCif],
  ['(+) Costo total de manufactura',m=>m.budgetManufacturing,'highlight'],
  ['(+) Inventario inicial de artículos terminados',m=>m.budgetInitialFinishedGoods],
  ['(+) Artículos disponibles para la venta',m=>m.budgetAvailable,'highlight2'],
  ['(-) Inventario final de artículos terminados',m=>m.budgetFinalFinishedGoods],
  ['Costo de artículos vendidos',m=>m.budgetCogs,'total']
 ];
 body.innerHTML=data.map((r,idx)=>{
   const cls=r[2]||'';
   let total;
   if(idx===4) total=rows[0]?.budgetInitialFinishedGoods||0;
   else if(idx===6) total=rows[rows.length-1]?.budgetFinalFinishedGoods||0;
   else total=sum(r[1]);
   return `<tr class="budget-${cls}"><td>${idx===7?'<b>'+r[0]+'</b>':r[0]}</td>${rows.map(m=>`<td>${money(r[1](m))}</td>`).join('')}<td>${idx===7?'<b>':''}${money(total)}${idx===7?'</b>':''}</td></tr>`;
 }).join('');
}
function expenseBudgetAmount(item,m){
 const raw=Number((item.values||{})[m.id]||0);
 if(item.method==='salesPct')return Number(m.forecastSales||0)*(raw/100);
 return raw;
}
function renderExpenseBudgets(ms){
 const root=document.getElementById('expenseBudgets'); if(!root)return;
 state.expenseBudgets=Array.isArray(state.expenseBudgets)?state.expenseBudgets:[];
 if(!state.expenseBudgets.length){root.innerHTML='<div class="card"><div class="empty">Aún no hay presupuestos de gastos. Crea uno arriba, por ejemplo “Gastos de venta” o “Gastos administrativos”.</div></div>';return;}
 root.innerHTML=state.expenseBudgets.map(b=>{
   const rows=b.items||[];
   const totalByMonth=ms.map(m=>rows.reduce((a,it)=>a+expenseBudgetAmount(it,m),0));
   const grand=totalByMonth.reduce((a,v)=>a+v,0);
   const isSales=/venta/i.test(b.name||'');
   const isAdmin=/administr/i.test(b.name||'');
   const variableItems=rows.filter(it=>it.method==='salesPct');
   const fixedItems=rows.filter(it=>it.method!=='salesPct');
   const editItem=(editingExpenseBudgetId===b.id&&editingExpenseItemId)?rows.find(x=>x.id===editingExpenseItemId):null;

   const infoHtml=rows.length
     ? `<div class="expense-info-list">${rows.map(it=>`<div>• ${esc(it.concept)} <span>${it.method==='salesPct'?'Variable':'Fijo'}</span></div>`).join('')}</div>`
     : '<div class="expense-info-list muted">Aún no hay conceptos registrados.</div>';

   const variableHtml=variableItems.length
     ? `<table class="mini-expense-table"><thead><tr><th>Concepto</th>${ms.map(m=>`<th>${esc(m.name)}</th>`).join('')}</tr></thead><tbody>${variableItems.map(it=>`<tr><td>${esc(it.concept)}</td>${ms.map(m=>`<td>${Number((it.values||{})[m.id]||0).toFixed(2)}%</td>`).join('')}</tr>`).join('')}</tbody></table>`
     : '<div class="mini-empty">No hay conceptos calculados como porcentaje de ventas.</div>';

   const fixedHtml=fixedItems.length
     ? `<table class="mini-expense-table"><thead><tr><th>Concepto</th>${ms.map(m=>`<th>${esc(m.name)}</th>`).join('')}</tr></thead><tbody>${fixedItems.map(it=>`<tr><td>${esc(it.concept)}</td>${ms.map(m=>`<td>${money((it.values||{})[m.id]||0)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
     : '<div class="mini-empty">No hay conceptos con monto fijo.</div>';

   const monthTables=ms.map(m=>{
     const forecast=Number(m.forecastSales||0);
     const detail=rows.map(it=>{
       const raw=Number((it.values||{})[m.id]||0);
       const variable=it.method==='salesPct'?forecast*(raw/100):0;
       const fixed=it.method==='salesPct'?0:raw;
       return {it,fixed,variable,total:fixed+variable,raw};
     });
     const fixedTotal=detail.reduce((a,x)=>a+x.fixed,0);
     const variableTotal=detail.reduce((a,x)=>a+x.variable,0);
     const monthTotal=fixedTotal+variableTotal;
     const body=detail.map(x=>`<tr><td>(+) ${esc(x.it.concept)}<small class="expense-method">${x.it.method==='salesPct'?`${x.raw.toFixed(2)}% de ventas`:'Monto fijo'}</small></td><td>${x.fixed?money(x.fixed):''}</td><td>${x.variable?money(x.variable):''}</td><td>${money(x.total)}</td><td><button class="icon" title="Editar concepto" onclick="editExpenseItem('${b.id}','${x.it.id}')"><i class="fa-solid fa-pen"></i></button><button class="icon danger" title="Eliminar concepto" onclick="deleteExpenseItem('${b.id}','${x.it.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
     return `<div class="expense-month-block"><h4>Presupuesto de ${esc(b.name)} <span>(${esc(m.name)}: ${num(forecast)} unidades)</span></h4><div class="table-scroll"><table class="expense-month-table"><thead><tr><th>Concepto</th><th>Gasto fijo</th><th>Gasto variable</th><th>Total</th><th>Acción</th></tr></thead><tbody>${body||`<tr><td colspan="5" class="empty">Agrega conceptos al presupuesto.</td></tr>`}</tbody><tfoot><tr><td><b>Gasto total correspondiente al mes de ${esc(m.name)}</b></td><td><b>${money(fixedTotal)}</b></td><td><b>${money(variableTotal)}</b></td><td><b>${money(monthTotal)}</b></td><td></td></tr></tfoot></table></div></div>`;
   }).join('');

   return `<div class="card expense-budget-card">
     <div class="expense-budget-head"><div><h3>${esc(b.name)}</h3><span>Presupuesto de gastos</span></div><div class="row-actions"><button class="icon" title="Editar presupuesto" onclick="editExpenseBudget('${b.id}')"><i class="fa-solid fa-pen"></i></button><button class="icon danger" title="Eliminar presupuesto" onclick="deleteExpenseBudget('${b.id}')"><i class="fa-solid fa-trash"></i></button></div></div>
     <div class="expense-reference-grid">
       <div class="expense-reference-card"><h4>Información necesaria</h4><p>Conceptos que forman parte de este presupuesto.</p>${infoHtml}</div>
       <div class="expense-reference-card"><h4>${isSales?'Gastos variables como porcentaje de las ventas':'Gastos variables (% de ventas)'}</h4>${variableHtml}</div>
     </div>
     <div class="expense-reference-card expense-fixed-reference"><h4>${isAdmin?'Gastos administrativos fijos':'Costos y gastos fijos por mes'}</h4>${fixedHtml}</div>
     <div class="card expense-add-card"><div class="form-grid expense-line-grid"><label>Concepto<input id="expConcept-${b.id}" value="${esc(editItem?.concept||'')}" placeholder="Ej. Comisiones"></label><label>Método<select id="expMethod-${b.id}"><option value="fixed" ${editItem?.method!=='salesPct'?'selected':''}>Monto fijo</option><option value="salesPct" ${editItem?.method==='salesPct'?'selected':''}>% de ventas</option></select></label>${ms.map(m=>`<label>${esc(m.name)}<input id="expVal-${b.id}-${m.id}" type="number" min="0" step="0.01" value="${editItem?Number((editItem.values||{})[m.id]||0):''}" placeholder="0"></label>`).join('')}<button class="btn" onclick="${editItem?`updateExpenseItem('${b.id}')`:`addExpenseItem('${b.id}')`}"><i class="fa-solid ${editItem?'fa-floppy-disk':'fa-plus'}"></i> ${editItem?'Actualizar concepto':'Agregar concepto'}</button>${editItem?`<button type="button" class="btn secondary" onclick="cancelExpenseItemEdit()"><i class="fa-solid fa-xmark"></i> Cancelar</button>`:''}</div><div class="note"><b>Edición en interfaz:</b> pulsa el lápiz del concepto para cargar sus datos aquí y corregirlos. Los cambios se guardan únicamente en ese concepto y recalculan automáticamente los meses y apartados posteriores.</div></div>
     ${monthTables}
     <div class="expense-grand-total"><span>Total ${esc(b.name)}</span>${ms.map((m,i)=>`<b>${esc(m.name)}: ${money(totalByMonth[i])}</b>`).join('')}<strong>${money(grand)}</strong></div>
   </div>`;
 }).join('');
}
function addExpenseBudget(){
 const input=document.getElementById('expenseBudgetName'); const name=input?.value.trim();
 if(!name)return alert('Ingresa el nombre del presupuesto.');
 state.expenseBudgets=Array.isArray(state.expenseBudgets)?state.expenseBudgets:[];
 state.expenseBudgets.push({id:uid(),name,items:[]}); input.value=''; save();
}
function addExpenseItem(bid){
 const b=state.expenseBudgets.find(x=>x.id===bid); if(!b)return;
 const concept=document.getElementById(`expConcept-${bid}`)?.value.trim(); const method=document.getElementById(`expMethod-${bid}`)?.value||'fixed';
 if(!concept)return alert('Ingresa el concepto del gasto.');
 const values={}; state.months.forEach(m=>{values[m.id]=Number(document.getElementById(`expVal-${bid}-${m.id}`)?.value||0)});
 b.items=b.items||[]; b.items.push({id:uid(),concept,method,values}); save();
}
function editExpenseItem(bid,iid){
 const b=(state.expenseBudgets||[]).find(x=>x.id===bid);const it=b?.items?.find(x=>x.id===iid);if(!it)return;
 editingExpenseBudgetId=bid;editingExpenseItemId=iid;renderExpenseBudgets(monthCalc());
 const card=document.querySelector(`.expense-budget-card`); if(card)card.scrollIntoView({behavior:'smooth',block:'center'});
}
function updateExpenseItem(bid){
 const b=(state.expenseBudgets||[]).find(x=>x.id===bid);const it=b?.items?.find(x=>x.id===editingExpenseItemId);if(!it)return;
 const concept=document.getElementById(`expConcept-${bid}`)?.value.trim();const method=document.getElementById(`expMethod-${bid}`)?.value||'fixed';
 if(!concept)return alert('Ingresa el concepto del gasto.');
 const values={};for(const m of state.months){const raw=Number(document.getElementById(`expVal-${bid}-${m.id}`)?.value||0);if(!Number.isFinite(raw)||raw<0)return alert('Ingresa valores numéricos no negativos.');values[m.id]=raw;}
 it.concept=concept;it.method=method;it.values=values;editingExpenseBudgetId=null;editingExpenseItemId=null;save();
}
function cancelExpenseItemEdit(){editingExpenseBudgetId=null;editingExpenseItemId=null;renderExpenseBudgets(monthCalc());}
function deleteExpenseItem(bid,iid){const b=state.expenseBudgets.find(x=>x.id===bid);if(!b)return;b.items=(b.items||[]).filter(x=>x.id!==iid);save()}
function deleteExpenseBudget(bid){if(!confirm('¿Eliminar este presupuesto de gastos y todos sus conceptos?'))return;state.expenseBudgets=(state.expenseBudgets||[]).filter(x=>x.id!==bid);save()}

function getFlowCashParams(){
 state.flowCash=state.flowCash||{};
 const p=state.flowCash;
 const defaults={investment:0,loan:0,interestRate:0,loanTerm:4,taxRate:25,ivaSales:13,ivaPurchases:13,itRate:3,deferredAmount:0,deferredPeriods:1,monthly:{},assets:[],vanRate:0};
 Object.keys(defaults).forEach(k=>{if(p[k]===undefined||p[k]===null)p[k]=defaults[k]});
 p.monthly=p.monthly||{};p.assets=Array.isArray(p.assets)?p.assets:[];
 // Compatibilidad con V35: conserva los datos antiguos como activos si existían.
 if(!p.assets.length && (p.depreciationMachinery||p.depreciationEquipment||p.depreciationBuilding)){
   const legacy=[['Maquinaria',0,1,0,p.depreciationMachinery||0],['Equipo',0,1,0,p.depreciationEquipment||0],['Galpón',0,1,0,p.depreciationBuilding||0]];
   legacy.forEach(a=>{if(a[4]>0)p.assets.push({id:uid(),name:a[0],cost:a[1],life:a[2],residual:a[3],saleGain:0,legacyDep:a[4]})});
 }
 if(p.deferredAmount===0 && p.deferredAmort) p.deferredAmount=Number(p.deferredAmort)*Math.max(1,Number(p.loanTerm||1));
 return p;
}
function flowMonthlyData(ms){
 const p=getFlowCashParams();
 return ms.map(m=>{
   const old=p.monthly[m.id]||{};
   return {income:Number(old.income||0),operatingCost:Number(old.operatingCost||0)};
 });
}
function loanSchedule(ms){
 const p=getFlowCashParams(); const principal=Number(p.loan||0), rate=Number(p.interestRate||0)/100, term=Math.max(1,Number(p.loanTerm||1));
 let balance=principal;
 const payment=principal>0?(rate===0?principal/term:principal*(rate*Math.pow(1+rate,term))/(Math.pow(1+rate,term)-1)):0;
 return ms.map((m,i)=>{
   const opening=balance;
   if(i>=term)return {period:i+1,opening:0,interest:0,principalPay:0,payment:0,closing:0};
   const interest=opening*rate;
   const principalPay=Math.min(opening,Math.max(0,payment-interest));
   const closing=Math.max(0,opening-principalPay);
   balance=closing;
   return {period:i+1,opening,interest,principalPay,payment:principalPay+interest,closing};
 });
}
function assetRows(){
 const p=getFlowCashParams();
 return p.assets.map(a=>{
   const cost=Number(a.cost||0),res=Number(a.residual||0),life=Math.max(1,Number(a.life||1));
   const dep=Number(a.legacyDep||0)>0?Number(a.legacyDep):Math.max(0,(cost-res)/life);
   return {...a,cost,residual:res,life,dep,saleGain:Number(a.saleGain||0)};
 });
}
function deferredAmortization(){
 const p=getFlowCashParams(); const amount=Number(p.deferredAmount||0), periods=Math.max(1,Number(p.deferredPeriods||1));
 return amount/periods;
}
function flowCashCalc(ms){
 const p=getFlowCashParams(), monthly=flowMonthlyData(ms), loans=loanSchedule(ms), assets=assetRows();
 return ms.map((m,i)=>{
  const md=monthly[i]||{income:0,operatingCost:0};
  const revenue=Number(md.income||0), operatingCost=Number(md.operatingCost||0);
  const ivaSales=revenue*Number(p.ivaSales||0)/100;
  const ivaPurchases=operatingCost*Number(p.ivaPurchases||0)/100;
  const it=revenue*Number(p.itRate||0)/100;
  const loan=loans[i]||{opening:0,interest:0,principalPay:0,payment:0,closing:0};
  const depMachinery=assets.filter(a=>/maquin/i.test(a.name||'')).reduce((x,a)=>x+a.dep,0);
  const depEquipment=assets.filter(a=>/equip/i.test(a.name||'')).reduce((x,a)=>x+a.dep,0);
  const depBuilding=assets.filter(a=>/galp|edific|constru/i.test(a.name||'')).reduce((x,a)=>x+a.dep,0);
  const depreciation=assets.reduce((x,a)=>x+a.dep,0);
  const deferred=i<Number(p.deferredPeriods||1)?deferredAmortization():0;
  const grossResult=revenue+ivaSales-operatingCost-ivaPurchases-it-loan.interest-depreciation-deferred;
  const tax=Math.max(0,grossResult*Number(p.taxRate||0)/100);
  const netIncome=grossResult-tax;
  const last=i===ms.length-1;
  const residual=last?assets.reduce((x,a)=>x+Number(a.residual||0),0):0;
  const saleGain=last?assets.reduce((x,a)=>x+Number(a.saleGain||0),0):0;
  const liquidityAdjustment=depreciation+deferred-loan.principalPay+residual+saleGain;
  const operatingFlow=netIncome+liquidityAdjustment;
  return {...m,revenue,operatingCost,ivaSales,ivaPurchases,it,loanInterest:loan.interest,loanPrincipal:loan.principalPay,loanPayment:loan.payment,loanClosing:loan.closing,depreciation,depMachinery,depEquipment,depBuilding,deferred,grossResult,tax,netIncome,residual,saleGain,liquidityAdjustment,operatingFlow};
 });
}
function renderFlowCashInputs(ms){
 const p=getFlowCashParams();
 const head=document.getElementById('flowInputHead'),table=document.getElementById('flowInputTable');
 if(!head||!table)return;
 head.innerHTML='<th>Concepto</th>'+ms.map(m=>`<th>${esc(m.name)}</th>`).join('');
 const row=(label,key)=>`<tr><td>${label}</td>${ms.map(m=>`<td><input class="flow-inline-input" id="fcMonthly-${key}-${m.id}" type="number" min="0" step="0.01" value="${Number(p.monthly[m.id]?.[key]||0)}"></td>`).join('')}</tr>`;
 table.innerHTML=row('Ingresos','income')+row('Costos de operación','operatingCost');
}
function renderFlowFinance(ms){
 const p=getFlowCashParams();
 ['fcLoan','fcInterestRate','fcLoanTerm'].forEach((id,key)=>{const map=['loan','interestRate','loanTerm'];const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=p[map[key]]??''});
 const head=document.getElementById('loanInputHead'),table=document.getElementById('loanInputTable'); if(!head||!table)return;
 const rows=loanSchedule(ms); head.innerHTML='<th>Concepto</th>'+ms.map(m=>`<th>${esc(m.name)}</th>`).join('')+'<th>TOTAL</th>';
 const make=(label,key)=>`<tr><td>${label}</td>${rows.map(r=>`<td>${money(r[key])}</td>`).join('')}<td class="strong">${money(rows.reduce((a,r)=>a+Number(r[key]||0),0))}</td></tr>`;
 table.innerHTML=make('Saldo inicial del préstamo','opening')+make('Costo financiero / interés','interest')+make('Amortización de capital','principalPay')+make('Cuota','payment')+make('Saldo final del préstamo','closing');
}
function renderFlowAssets(){
 const p=getFlowCashParams(), table=document.getElementById('flowAssetsTable');if(!table)return;
 table.innerHTML=p.assets.map(a=>{const cost=Number(a.cost||0),res=Number(a.residual||0),life=Math.max(1,Number(a.life||1)),dep=Number(a.legacyDep||0)>0?Number(a.legacyDep):(Math.max(0,cost-res)/life);return `<tr><td>${esc(a.name||'')}</td><td>${money(cost)}</td><td>${num(life)}</td><td>${money(res)}</td><td>${money(dep)}</td><td>${money(a.saleGain||0)}</td><td class="row-actions"><button class="icon" title="Editar activo" onclick="editFlowAsset('${a.id}')"><i class="fa-solid fa-pen"></i></button><button class="icon danger" title="Eliminar activo" onclick="deleteFlowAsset('${a.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`}).join('')||'<tr><td colspan="7" class="empty">Aún no hay activos depreciables.</td></tr>';
 const amount=document.getElementById('fcDeferredAmount'),periods=document.getElementById('fcDeferredPeriods');if(amount&&document.activeElement!==amount)amount.value=p.deferredAmount||0;if(periods&&document.activeElement!==periods)periods.value=p.deferredPeriods||1;
 const sm=document.getElementById('flowDeferredSummary');if(sm)sm.innerHTML=`Amortización por periodo: <b>${money(deferredAmortization())}</b>`;
}
function vanCalc(rows){
 const p=getFlowCashParams();
 const rate=Number(p.vanRate||0)/100;
 const initialInvestment=Number(p.investment||0);
 const discounted=rows.map((m,i)=>{
  const period=i+1;
  const flow=Number(m.operatingFlow||0);
  const presentValue=flow/Math.pow(1+rate,period);
  return {...m,period,vanFlow:flow,presentValue};
 });
 const van=-initialInvestment+discounted.reduce((a,m)=>a+m.presentValue,0);
 return {rate,initialInvestment,rows:discounted,van};
}
function renderFlowVan(ms, rows){
 const p=getFlowCashParams();
 const rateEl=document.getElementById('fcVanRate');
 if(rateEl&&document.activeElement!==rateEl)rateEl.value=p.vanRate??0;
 const head=document.getElementById('vanHeadPeriods'),table=document.getElementById('vanTable'),result=document.getElementById('flowVanResult');
 if(!head||!table||!result)return;
 if(!rows.length){head.innerHTML='<th>Concepto</th>';table.innerHTML='<tr><td colspan="2" class="empty">Primero agrega meses en Ventas.</td></tr>';result.innerHTML='';return;}
 const calc=vanCalc(rows);
 const periods=calc.rows.map(m=>`<th>${esc(m.name)}</th>`).join('');
 head.innerHTML='<th>Concepto</th><th>Periodo 0</th>'+periods+'<th>TOTAL</th>';
 const pvTotal=calc.rows.reduce((a,m)=>a+m.presentValue,0);
 const flows=calc.rows.reduce((a,m)=>a+m.vanFlow,0);
 table.innerHTML=`<tr><td>(−) INVERSIÓN INICIAL</td><td>${money(-calc.initialInvestment)}</td>${calc.rows.map(()=>'<td>'+money(0)+'</td>').join('')}<td class="strong">${money(-calc.initialInvestment)}</td></tr>`+
  `<tr><td>FLUJO DE CAJA (Ft)</td><td>${money(0)}</td>${calc.rows.map(m=>`<td>${money(m.vanFlow)}</td>`).join('')}<td class="strong">${money(flows)}</td></tr>`+
  `<tr><td>VALOR PRESENTE DE Ft</td><td>${money(0)}</td>${calc.rows.map(m=>`<td>${money(m.presentValue)}</td>`).join('')}<td class="strong">${money(pvTotal)}</td></tr>`+
  `<tr class="flow-highlight"><td>VAN</td><td colspan="${calc.rows.length+1}"></td><td class="strong">${money(calc.van)}</td></tr>`;
 const interpretation=calc.van>0?'VAN positivo: el proyecto genera valor con la tasa de descuento ingresada.':calc.van<0?'VAN negativo: el proyecto no recupera la inversión a la tasa de descuento ingresada.':'VAN igual a cero: el proyecto recupera exactamente la inversión a la tasa de descuento ingresada.';
 result.innerHTML=`<div><span>VAN</span><b>${money(calc.van)}</b></div><small>Tasa de descuento: ${Number(p.vanRate||0).toFixed(2)}% · ${esc(interpretation)}</small>`;
}
function saveFlowVan(){
 const p=getFlowCashParams();
 const value=Number(document.getElementById('fcVanRate')?.value||0);
 if(!Number.isFinite(value)||value<0)return alert('Ingresa una tasa de descuento válida.');
 p.vanRate=value;state.flowCash=p;save();
 renderFlowCash(monthCalc());
 alert('VAN calculado y guardado correctamente.');
}

function renderFlowCash(ms){
 const p=getFlowCashParams();
 ['fcInvestment','fcTaxRate','fcIvaSales','fcIvaPurchases','fcItRate'].forEach((id,i)=>{const key=['investment','taxRate','ivaSales','ivaPurchases','itRate'][i];const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=p[key]??''});
 renderFlowCashInputs(ms);renderFlowFinance(ms);renderFlowAssets();
 const fh=document.getElementById('flowCashHeadPeriods'),ft=document.getElementById('flowCashTable'),qh=document.getElementById('liquidityHeadPeriods'),qt=document.getElementById('liquidityTable');
 if(!fh||!ft||!qh||!qt)return;
 if(!ms.length){fh.innerHTML=qh.innerHTML='';ft.innerHTML=qt.innerHTML='<tr><td colspan="2" class="empty">Primero agrega meses en Ventas.</td></tr>';return;}
 const rows=flowCashCalc(ms);const periods=rows.map(m=>`<th>${esc(m.name)}</th>`).join('');
 fh.innerHTML='<th>Concepto</th><th>Periodo 0</th>'+periods+'<th>TOTAL</th>';qh.innerHTML=periods+'<th>TOTAL</th>';
 const p0=(label,val)=>`<tr><td>${label}</td><td>${money(val)}</td>${rows.map(()=>'<td>'+money(0)+'</td>').join('')}<td class="strong">${money(val)}</td></tr>`;
 const r=(label,key,cls='')=>`<tr class="${cls}"><td>${label}</td><td>${money(0)}</td>${rows.map(m=>`<td>${money(m[key])}</td>`).join('')}<td class="strong">${money(rows.reduce((a,m)=>a+Number(m[key]||0),0))}</td></tr>`;
 const fc=p0('(-) INVERSIÓN',-Number(p.investment||0))+p0('(+) PRÉSTAMO',Number(p.loan||0))+
  r('(+) INGRESO','revenue')+r('(-) COSTO DE OPERACIÓN','operatingCost')+r('(+) IVA VENTAS','ivaSales')+r('(-) IVA COMPRAS','ivaPurchases')+r('(-) IT','it')+r('(-) COSTO FINANCIERO','loanInterest')+r('(-) DEPRECIACIÓN','depreciation')+r('(-) AMORTIZACIÓN ACTIVO DIFERIDO','deferred')+r('UTILIDAD BRUTA','grossResult','flow-highlight')+r('(-) IUE','tax')+r('UTILIDAD NETA','netIncome','flow-highlight')+`<tr class="flow-section"><td colspan="${rows.length+3}">AJUSTE DE LIQUIDEZ</td></tr>`+r('(+) DEPRECIACIÓN','depreciation')+r('(+) AMORTIZACIÓN ACTIVO DIFERIDO','deferred')+r('(-) AMORTIZACIÓN DE CAPITAL','loanPrincipal')+r('(+) VALOR RESIDUAL','residual')+r('(+) UTILIDAD DE LA VENTA DE ACTIVOS','saleGain')+r('FLUJO DE CAJA','operatingFlow','flow-highlight');
 ft.innerHTML=fc;
 const sum=k=>rows.reduce((a,m)=>a+Number(m[k]||0),0); const liq=[['Utilidad neta','netIncome'],['(+) Depreciación','depreciation'],['(+) Amortización activo diferido','deferred'],['(-) Amortización de capital','loanPrincipal'],['(+) Valor residual','residual'],['(+) Utilidad venta de activos','saleGain'],['AJUSTE DE LIQUIDEZ','liquidityAdjustment']];
 qt.innerHTML=liq.map(x=>`<tr class="${x[0].includes('AJUSTE')?'flow-highlight':''}"><td>${x[0]}</td>${rows.map(m=>`<td>${money(m[x[1]])}</td>`).join('')}<td class="strong">${money(sum(x[1]))}</td></tr>`).join('');
 renderFlowVan(ms,rows);
}
function saveFlowMonthly(){
 const p=getFlowCashParams();p.monthly=p.monthly||{};
 for(const m of state.months){p.monthly[m.id]={income:Number(document.getElementById(`fcMonthly-income-${m.id}`)?.value||0),operatingCost:Number(document.getElementById(`fcMonthly-operatingCost-${m.id}`)?.value||0)};}
 state.flowCash=p;save();alert('Datos mensuales del flujo guardados correctamente.');
}
function saveFlowGeneral(){const p=getFlowCashParams();const read=id=>Number(document.getElementById(id)?.value||0);p.investment=read('fcInvestment');p.taxRate=read('fcTaxRate');p.ivaSales=read('fcIvaSales');p.ivaPurchases=read('fcIvaPurchases');p.itRate=read('fcItRate');state.flowCash=p;save();alert('Parámetros generales guardados correctamente.');}
function saveFlowFinance(){const p=getFlowCashParams();p.loan=Number(document.getElementById('fcLoan')?.value||0);p.interestRate=Number(document.getElementById('fcInterestRate')?.value||0);p.loanTerm=Math.max(1,Number(document.getElementById('fcLoanTerm')?.value||1));state.flowCash=p;save();alert('Costo financiero calculado y guardado correctamente.');}
let editingFlowAssetId=null;
function clearFlowAssetForm(){editingFlowAssetId=null;['fcAssetName','fcAssetCost','fcAssetLife','fcAssetResidual','fcAssetGain'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});const b=document.getElementById('addFlowAsset');if(b)b.innerHTML='<i class="fa-solid fa-plus"></i> Agregar activo';}
function addFlowAsset(){const p=getFlowCashParams();const name=document.getElementById('fcAssetName')?.value.trim();const cost=Number(document.getElementById('fcAssetCost')?.value||0);const life=Math.max(1,Number(document.getElementById('fcAssetLife')?.value||0));const residual=Number(document.getElementById('fcAssetResidual')?.value||0);const saleGain=Number(document.getElementById('fcAssetGain')?.value||0);if(!name||cost<=0||life<=0)return alert('Completa activo, costo inicial y vida útil.');if(residual>cost)return alert('El valor residual no puede ser mayor al costo inicial.');if(editingFlowAssetId){const a=p.assets.find(x=>x.id===editingFlowAssetId);if(a){a.name=name;a.cost=cost;a.life=life;a.residual=residual;a.saleGain=saleGain;delete a.legacyDep;}}else p.assets.push({id:uid(),name,cost,life,residual,saleGain});state.flowCash=p;clearFlowAssetForm();save();}
function editFlowAsset(id){const a=getFlowCashParams().assets.find(x=>x.id===id);if(!a)return;editingFlowAssetId=id;document.getElementById('fcAssetName').value=a.name||'';document.getElementById('fcAssetCost').value=a.cost||0;document.getElementById('fcAssetLife').value=a.life||1;document.getElementById('fcAssetResidual').value=a.residual||0;document.getElementById('fcAssetGain').value=a.saleGain||0;document.getElementById('addFlowAsset').innerHTML='<i class="fa-solid fa-save"></i> Actualizar activo';document.getElementById('fcAssetName').scrollIntoView({behavior:'smooth',block:'center'});}
function deleteFlowAsset(id){const p=getFlowCashParams();p.assets=p.assets.filter(a=>a.id!==id);state.flowCash=p;save();}
function saveFlowDeferred(){const p=getFlowCashParams();p.deferredAmount=Number(document.getElementById('fcDeferredAmount')?.value||0);p.deferredPeriods=Math.max(1,Number(document.getElementById('fcDeferredPeriods')?.value||1));state.flowCash=p;save();alert('Activo diferido guardado y amortización calculada.');}

function getFinalParams(){state.finalBudget=state.finalBudget||{salePrice:0,initialCash:0};return state.finalBudget}
function expenseTotalsByType(ms){
 const sales=ms.map(m=>0), admin=ms.map(m=>0), other=ms.map(m=>0);
 (state.expenseBudgets||[]).forEach(b=>{
  const name=(b.name||'').toLowerCase();
  const target=name.includes('venta')?sales:name.includes('administr')?admin:other;
  ms.forEach((m,i)=>target[i]+=Number((b.items||[]).reduce((a,it)=>a+expenseBudgetAmount(it,m),0)||0));
 });
 return {sales,admin,other};
}
function finalCalc(ms){
 const p=getFinalParams();
 const budgets=budgetCalc(ms); const expenses=expenseTotalsByType(ms);
 let prevCash=Number(p.initialCash||0);
 return budgets.map((b,i)=>{
  const salesRevenue=Number(b.forecastSales||0)*Number(p.salePrice||0);
  const grossProfit=salesRevenue-Number(b.budgetCogs||0);
  const operatingExpenses=expenses.sales[i]+expenses.admin[i];
  const operatingIncome=grossProfit-operatingExpenses;
  const tax=Math.max(0,operatingIncome*0.25);
  const netIncome=operatingIncome-tax;
  const beginningCash=i===0?Number(p.initialCash||0):prevCash;
  const available=beginningCash+salesRevenue;
  const md=Number(b.budgetMaterialConsumption||0);
  const labor=Number(b.budgetLabor||0);
  const cif=Number(b.budgetCif||0);
  const totalDisb=md+labor+cif+expenses.sales[i]+expenses.admin[i]+tax;
  const surplus=available-totalDisb;
  prevCash=surplus;
  return {...b,incomeRevenue:salesRevenue,incomeCogs:Number(b.budgetCogs||0),incomeGrossProfit:grossProfit,incomeSalesExpense:expenses.sales[i],incomeAdminExpense:expenses.admin[i],incomeOperatingExpenses:operatingExpenses,incomeOperatingIncome:operatingIncome,incomeTax:tax,incomeNetIncome:netIncome,cashBeginning:beginningCash,cashRevenue:salesRevenue,cashAvailable:available,cashMaterial:md,cashLabor:labor,cashCif:cif,cashSalesExpense:expenses.sales[i],cashAdminExpense:expenses.admin[i],cashTax:tax,cashDisbursement:totalDisb,cashSurplus:surplus};
 });
}
function renderFinal(ms){
 const ih=document.getElementById('incomeHeadRow'),it=document.getElementById('incomeTable'),ch=document.getElementById('cashHeadRow'),ct=document.getElementById('cashTable');
 if(!ih||!it||!ch||!ct)return;
 const p=getFinalParams(); const price=document.getElementById('finalSalePrice'), cash=document.getElementById('finalInitialCash');
 if(price&&document.activeElement!==price)price.value=p.salePrice??'';
 if(cash&&document.activeElement!==cash)cash.value=p.initialCash??'';
 if(!ms.length){ih.innerHTML='';it.innerHTML='<tr><td colspan="2" class="empty">Primero agrega meses en Ventas.</td></tr>';ch.innerHTML='';ct.innerHTML='';return;}
 const rows=finalCalc(ms); const head=rows.map(m=>`<th>${esc(m.name)}</th>`).join(''); ih.innerHTML='<th>Información</th>'+head+'<th>TOTAL</th>'; ch.innerHTML='<th>Información</th>'+head+'<th>TOTAL</th>';
 const sum=k=>rows.reduce((a,m)=>a+Number(m[k]||0),0);
 const income=[
  ['(+) Ingresos totales','incomeRevenue'],['(-) Costo de artículos vendidos','incomeCogs'],['(+) Utilidad Bruta','incomeGrossProfit','budget-highlight2'],
  ['(-) Gastos de ventas','incomeSalesExpense'],['(-) Gastos administrativos','incomeAdminExpense'],['(-) Total de gastos operacionales','incomeOperatingExpenses','budget-highlight2'],
  ['(+) Utilidad operacional','incomeOperatingIncome','budget-highlight2'],['(-) Impuesto sobre utilidades 25%','incomeTax'],['Utilidad neta total','incomeNetIncome','budget-total']
 ];
 it.innerHTML=income.map(r=>`<tr class="budget-${r[2]||''}"><td>${r[0]}</td>${rows.map(m=>`<td>${money(m[r[1]])}</td>`).join('')}<td class="strong">${money(sum(r[1]))}</td></tr>`).join('');
 const cashRows=[
  ['(+) Saldo inicial','cashBeginning'],['(+) Entrada de caja','cashRevenue'],['(+) Total disponible en caja','cashAvailable','budget-highlight'],
  ['(-) Costo de Material Directo','cashMaterial'],['(-) Costo de Mano de Obra Directa','cashLabor'],['(-) Costo Indirecto de Fabricación','cashCif'],['(-) Gasto de ventas','cashSalesExpense'],['(-) Gasto administrativo','cashAdminExpense'],['(-) Impuesto sobre las utilidades','cashTax'],
  ['(-) Total desembolsado','cashDisbursement','budget-highlight'],['Superávit / (Déficit)','cashSurplus','budget-total']
 ];
 ct.innerHTML=cashRows.map(r=>`<tr class="budget-${r[2]||''}"><td>${r[0]}</td>${rows.map(m=>`<td>${money(m[r[1]])}</td>`).join('')}<td class="strong">${money(sum(r[1]))}</td></tr>`).join('');
}
function saveFinalParams(){const p=getFinalParams();p.salePrice=Number(document.getElementById('finalSalePrice')?.value||0);p.initialCash=Number(document.getElementById('finalInitialCash')?.value||0);save()}

function cifForMonth(id){const m=monthCalc().find(x=>x.id===id);const requiredUnits=Number(m?.required||0);return state.cifs.filter(c=>c.monthId===id).map(c=>{const fixed=Number(c.fixed||0);const rate=Number(c.rate||0);const variable=rate*requiredUnits;return{...c,fixed,rate,units:requiredUnits,variable,total:fixed+variable}})}
function totalCif(id){return cifForMonth(id).reduce((a,c)=>a+c.total,0)}
function renderCif(){const id=document.getElementById('cifViewMonth')?.value||state.months[0]?.id;const rows=cifForMonth(id);const t=rows.reduce((a,c)=>a+c.fixed,0),v=rows.reduce((a,c)=>a+c.variable,0);document.getElementById('cifFixedTotal').textContent=money(t);document.getElementById('cifVariableTotal').textContent=money(v);document.getElementById('cifTotal').textContent=money(t+v);document.getElementById('cifTable').innerHTML=rows.map(c=>`<tr><td>${esc(c.item)}</td><td>${money(c.fixed)}</td><td>${Number(c.rate).toFixed(6)}</td><td>${num(c.units)}</td><td>${money(c.variable)}</td><td class="strong">${money(c.total)}</td><td><button class="icon" title="Editar CIF" onclick="startEditCif('${c.id}')"><i class="fa-solid fa-pen"></i></button><button class="icon danger" title="Eliminar CIF" onclick="deleteCif('${c.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No hay CIF para este mes.</td></tr>'}
function poolCost(pool,monthId){if((pool.monthId||'')!==monthId)return 0;const selected=new Set(pool.cifIds||[]);return cifForMonth(monthId).filter(c=>selected.has(c.id)).reduce((a,c)=>a+c.total,0)}
function renderPools(){
 const el=document.getElementById('poolBuilder');
 const viewMonth=document.getElementById('poolViewMonth')?.value||state.months[0]?.id||'';
 const monthPools=state.pools.filter(p=>(p.monthId||state.months[0]?.id||'')===viewMonth);
 if(!state.months.length){el.innerHTML='<div class="empty">Primero agrega al menos un mes en Ventas para crear pools.</div>';return}
 if(!monthPools.length){el.innerHTML='<div class="empty">No hay pools creados para este mes. Selecciona el mes arriba y crea el primer pool.</div>';return}
 el.innerHTML=monthPools.map(p=>{
  const selected=new Set(p.processHours?Object.keys(p.processHours):[]);
  const cifSelected=new Set(p.cifIds||[]);
  const cifMonth=p.monthId||viewMonth;
  const cifs=cifForMonth(cifMonth);
  const entries=[...selected].map(id=>({id,hours:Number(p.processHours?.[id]||0)})).filter(x=>x.hours>0);
  const totalActivityHours=entries.reduce((a,x)=>a+x.hours,0);
  const poolCif=poolCost(p,cifMonth);
  const totalDriver=Number(p.totalDriver||0);
  const open=expandedPools.has(p.id);
  return `<div class="pool-card">
   <div class="pool-head">
    <div><h3>${esc(p.name)}</h3><span>Mes: ${esc(state.months.find(m=>m.id===cifMonth)?.name||'Sin mes')} · Driver: ${esc(p.driver||'Sin definir')} · Total driver (mes): ${num(totalDriver)} · Horas de actividades: ${totalActivityHours.toFixed(2)} · CIF ${money(poolCif)}</span></div>
    <div class="pool-head-actions">
     <button class="icon pool-toggle" title="${open?'Ocultar desglose':'Mostrar desglose'}" aria-expanded="${open}" onclick="togglePool('${p.id}')"><i class="fa-solid fa-chevron-${open?'up':'down'}"></i></button>
     <button class="icon" title="Editar pool" onclick="startEditPool('${p.id}')"><i class="fa-solid fa-pen"></i></button><button class="icon danger" title="Eliminar pool" onclick="deletePool('${p.id}')"><i class="fa-solid fa-trash"></i></button>
    </div>
   </div>
   <div class="pool-details" style="display:${open?'block':'none'}">
    <div class="pool-section"><div class="form-grid"><label>Driver<input value="${esc(p.driver||'')}" placeholder="Ej. Horas-equipo" onchange="setPoolDriver('${p.id}',this.value)"></label><label>Total driver (mes)<input type="number" min="0" step="0.01" value="${totalDriver}" onchange="setPoolTotalDriver('${p.id}',this.value)"></label></div><div class="note"><b>Distribución:</b> el porcentaje de cada actividad se calcula como <b>horas de la actividad ÷ total de horas de las actividades seleccionadas</b>. Luego, la asignación de costos es <b>CIF del pool × % de actividad</b>. El total driver se conserva como dato de referencia del mes.</div></div>
    <div class="pool-section"><h4>Procesos del flujograma</h4>${state.processes.length?state.processes.map(pr=>`<label class="check-row"><input type="checkbox" ${selected.has(pr.id)?'checked':''} onchange="toggleProcess('${p.id}','${pr.id}',this.checked)"><span><b>${esc(pr.name)}</b><small>Encargado: ${esc(pr.owner||'Sin asignar')}</small></span><input class="hours" type="number" min="0" step="0.01" value="${Number(p.processHours?.[pr.id]||0)}" ${selected.has(pr.id)?'':'disabled'} onchange="setHours('${p.id}','${pr.id}',this.value)"><em>horas</em></label>`).join(''):'<div class="mini-empty">Primero registra procesos en Flujograma.</div>'}</div>
    <div class="pool-section"><h4>Cálculo del pool por actividad</h4>${entries.length?`<div class="card"><table><thead><tr><th>Actividad</th><th>Horas</th><th>Unidad</th><th>% / actividad</th><th>Asignación de costos</th></tr></thead><tbody>${entries.map(e=>{const pr=state.processes.find(x=>x.id===e.id);const pct=totalActivityHours?e.hours/totalActivityHours:0;const assigned=poolCif*pct;return `<tr><td><b>${esc(pr?.name||'Proceso eliminado')}</b></td><td>${e.hours.toFixed(2)}</td><td>horas</td><td>${(pct*100).toFixed(0)}%</td><td class="strong">${money(assigned)}</td></tr>`}).join('')}<tr><td class="strong">Total</td><td class="strong">${totalActivityHours.toFixed(2)}</td><td>horas</td><td class="strong">${totalActivityHours?'100%':'0%'}</td><td class="strong">${money(entries.length?poolCif:0)}</td></tr></tbody></table></div>`:'<div class="mini-empty">Selecciona actividades y registra sus horas para generar el cálculo.</div>'}</div>
    <div class="pool-section"><h4>Conceptos CIF que pertenecen al pool</h4>${cifs.length?cifs.map(c=>`<label class="check-row"><input type="checkbox" ${cifSelected.has(c.id)?'checked':''} onchange="toggleCif('${p.id}','${c.id}',this.checked)"><span><b>${esc(c.item)}</b><small>${esc(state.months.find(m=>m.id===c.monthId)?.name||'')} · ${money(c.total)}</small></span></label>`).join(''):'<div class="mini-empty">Registra primero los CIF para este mes.</div>'}</div>
   </div>
  </div>`
 }).join('')
}
function allocationData(pool,monthId){if((pool.monthId||'')!==monthId)return [];const entries=Object.entries(pool.processHours||{}).filter(([,h])=>Number(h)>0);const totalHours=entries.reduce((a,[,h])=>a+Number(h),0);const cost=poolCost(pool,monthId);return entries.map(([pid,h])=>{const p=state.processes.find(x=>x.id===pid);const pct=totalHours?Number(h)/totalHours:0;return{pool:pool.name,poolId:pool.id,processId:pid,process:p, hours:Number(h),pct,cost,assigned:cost*pct}})}
function renderAllocation(){const filter=document.getElementById('allocationPoolFilter');const old=filter.value;const month=document.getElementById('allocationMonth')?.value||state.months[0]?.id;const monthPools=state.pools.filter(p=>(p.monthId||'')===month);filter.innerHTML='<option value="all">Todos los pools</option>'+monthPools.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');if([...filter.options].some(o=>o.value===old))filter.value=old;else filter.value='all';const pools=filter.value==='all'?monthPools:monthPools.filter(p=>p.id===filter.value);let rows=[];pools.forEach(p=>rows=rows.concat(allocationData(p,month)));document.getElementById('allocationTable').innerHTML=rows.map(r=>`<tr><td>${esc(r.pool)}</td><td>${esc(r.process?.name||'Proceso eliminado')}</td><td>${esc(r.process?.owner||'Sin asignar')}</td><td>${r.hours.toFixed(2)}</td><td>${(r.pct*100).toFixed(2)}%</td><td>${money(r.cost)}</td><td class="strong">${money(r.assigned)}</td></tr>`).join('')||'<tr><td colspan="7" class="empty">No hay actividades seleccionadas para este filtro.</td></tr>';const sums=pools.map(p=>({name:p.name,cost:poolCost(p,month),rows:allocationData(p,month)}));document.getElementById('allocationSummary').innerHTML=sums.map(s=>`<div class="summary-card"><span>${esc(s.name)}</span><b>${money(s.cost)}</b><small>${s.rows.reduce((a,r)=>a+r.assigned,0).toLocaleString('es-BO',{style:'currency',currency:'BOB'})} asignado</small></div>`).join('')}
function aggregateActivityCosts(monthId){const grouped=new Map();state.pools.forEach(p=>allocationData(p,monthId).forEach(r=>{const key=r.processId;if(!grouped.has(key))grouped.set(key,{processId:key,process:r.process,cost:0});grouped.get(key).cost+=Number(r.assigned||0)}));return [...grouped.values()]}
function renderResult(){const month=document.getElementById('unitMonth')?.value||state.months[0]?.id;const ms=monthCalc();const m=ms.find(x=>x.id===month);const required=Number(m?.required||0);const rows=aggregateActivityCosts(month);const total=rows.reduce((a,r)=>a+r.cost,0);const table=document.getElementById('unitTable');table.innerHTML=rows.map(r=>{const pct=total?r.cost/total:0;return `<tr><td>${esc(r.process?.order||'')}</td><td>${esc(r.process?.name||'')}</td><td>${money(r.cost)}</td><td>${(pct*100).toFixed(2)}%</td><td></td></tr>`}).join('')||'<tr><td colspan="5" class="empty">No hay asignaciones.</td></tr>';const detail=document.getElementById('unitDetailTable');detail.innerHTML=rows.map(r=>{const unit=required?r.cost/required:0;return `<tr><td>${esc(r.process?.order||'')}</td><td>${esc(r.process?.name||'')}</td><td class="strong">${unit.toFixed(5)}</td><td></td><td>${required?`Bs. ${unit.toFixed(5)} por unidad`:''}</td></tr>`}).join('')||'<tr><td colspan="5" class="empty">No hay asignaciones.</td></tr>';document.getElementById('unitTotal').textContent=required?(total/required).toFixed(5):'0.00000';const verification=required?(total/required)*required:0;const verifyEl=document.getElementById('unitVerification');if(verifyEl)verifyEl.textContent=money(verification);const unitsEl=document.getElementById('unitRequired');if(unitsEl)unitsEl.textContent=num(required);const totalCifEl=document.getElementById('unitTotalCif');if(totalCifEl)totalCifEl.textContent=money(total)}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function simpleMarkdown(text){let safe=escapeHtml(text);safe=safe.replace(/^### (.+)$/gm,'<h3>$1</h3>').replace(/^## (.+)$/gm,'<h2>$1</h2>').replace(/^# (.+)$/gm,'<h1>$1</h1>');safe=safe.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');safe=safe.replace(/^[-•] (.+)$/gm,'<li>$1</li>');safe=safe.replace(/(<li>.*<\/li>\n?)+/g,m=>'<ul>'+m+'</ul>');safe=safe.replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>');return '<p>'+safe+'</p>'}
function buildAiPayload(monthId){
 const ms=monthCalc();
 const m=ms.find(x=>x.id===monthId);
 const cifs=cifForMonth(monthId);
 const pools=state.pools.filter(p=>(p.monthId||'')===monthId).map(p=>({name:p.name,driver:p.driver||'',totalDriver:Number(p.totalDriver||0),cif:poolCost(p,monthId),activities:Object.entries(p.processHours||{}).filter(([,h])=>Number(h)>0).map(([pid,h])=>{const pr=state.processes.find(x=>x.id===pid);return{activity:pr?.name||'Proceso eliminado',order:pr?.order||'',hours:Number(h)}})}));
 const activities=aggregateActivityCosts(monthId).map(r=>({activity:r.process?.name||'Proceso eliminado',order:r.process?.order||'',cost:Number(r.cost||0),percent:totalActivityCostForAi(monthId)?Number(r.cost||0)/totalActivityCostForAi(monthId)*100:0,unitCost:m?.required?Number(r.cost||0)/Number(m.required):0}));
 const total=activities.reduce((a,r)=>a+r.cost,0);
 return {month:m?.name||'',unitsRequired:Number(m?.required||0),cif:{fixed:cifs.reduce((a,c)=>a+c.fixed,0),variable:cifs.reduce((a,c)=>a+c.variable,0),total:cifs.reduce((a,c)=>a+c.total,0)},pools,activities,totalAssignedCif:total,unitCif:m?.required?total/m.required:0,verification:m?.required?total:0};
}
function totalActivityCostForAi(monthId){return aggregateActivityCosts(monthId).reduce((a,r)=>a+Number(r.cost||0),0)}
async function analyzeWithAi(){
 const month=document.getElementById('unitMonth')?.value||state.months[0]?.id;
 const status=document.getElementById('aiStatus'), result=document.getElementById('aiResult'), btn=document.getElementById('btnAiAnalysis');
 if(!month){status.className='ai-status error';status.textContent='Primero agrega y selecciona un mes.';return}
 const payload=buildAiPayload(month);
 btn.disabled=true;status.className='ai-status loading';status.textContent='Analizando los datos del costeo ABC...';result.innerHTML='<div class="mini-empty">La IA está revisando pools, actividades, drivers, costos y verificación.</div>';
 try{
  const res=await fetch('api/ia.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({success:false,message:'La respuesta del servidor no es válida.'}));
  if(!res.ok||!data.success)throw new Error(data.message||'No se pudo completar el análisis.');
  result.innerHTML=simpleMarkdown(data.analysis||'La IA no devolvió un análisis.');
  status.className='ai-status';status.textContent='Análisis generado con los datos calculados del mes seleccionado.';
 }catch(err){
  status.className='ai-status error';status.textContent=err.message||'Error al conectar con la IA.';
  result.innerHTML='<div class="mini-empty">Revisa la configuración de la API en <b>api/config.php</b> y vuelve a intentarlo.</div>';
 }finally{btn.disabled=false}
}
let flowPdfActivities=[];
let selectedFlowPdf=null;
let flowPdfInput=null;
function setFlowPdfStatus(message,type=''){const el=document.getElementById('flowPdfStatus');if(!el)return;el.className='pdf-status'+(type?' '+type:'');el.textContent=message||''}
function formatPdfSize(bytes){return bytes<1024*1024?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1024/1024).toFixed(2)} MB`}
function renderFlowPdfFile(){const el=document.getElementById('flowPdfFiles');const analyze=document.getElementById('btnAnalyzeFlowPdf');if(!el)return;if(!selectedFlowPdf){el.innerHTML='';if(analyze)analyze.disabled=false;return}const file=selectedFlowPdf;el.innerHTML=`<div class="pdf-file-item"><div class="pdf-file-icon"><i class="fa-solid fa-file-pdf"></i></div><div class="pdf-file-info"><b>${esc(file.name)}</b><small>PDF · ${formatPdfSize(file.size)} · Archivo cargado y listo para analizar</small></div><button type="button" class="icon danger" id="btnRemoveFlowPdf" title="Quitar archivo"><i class="fa-solid fa-xmark"></i></button></div>`;if(analyze)analyze.disabled=false;document.getElementById('btnRemoveFlowPdf').onclick=clearFlowPdf}
function clearFlowPdf(){selectedFlowPdf=null;flowPdfActivities=[];const input=document.getElementById('flowPdfInput');if(input)input.value='';flowPdfInput=input||null;const files=document.getElementById('flowPdfFiles');if(files)files.innerHTML='';const preview=document.getElementById('flowPdfPreview');if(preview)preview.innerHTML='';const analyze=document.getElementById('btnAnalyzeFlowPdf');if(analyze)analyze.disabled=false;setFlowPdfStatus('')}
function renderFlowPdfPreview(){const el=document.getElementById('flowPdfPreview');if(!el)return;if(!flowPdfActivities.length){el.innerHTML='';return}el.innerHTML=`<div class="pdf-preview-title"><b>Actividades detectadas</b><span>${flowPdfActivities.length} encontradas</span></div><div class="table-scroll"><table><thead><tr><th>Orden</th><th>Actividad</th><th>Encargado</th><th>Descripción</th></tr></thead><tbody>${flowPdfActivities.map((a,i)=>`<tr><td><input class="pdf-edit order" type="number" min="1" value="${Number(a.order)||i+1}" onchange="editFlowPdf(${i},'order',this.value)"></td><td><input class="pdf-edit" value="${esc(a.name||'')}" onchange="editFlowPdf(${i},'name',this.value)"></td><td><input class="pdf-edit" value="${esc(a.owner||'')}" onchange="editFlowPdf(${i},'owner',this.value)"></td><td><textarea class="pdf-edit" rows="2" onchange="editFlowPdf(${i},'description',this.value)">${esc(a.description||'')}</textarea></td></tr>`).join('')}</tbody></table></div><div class="pdf-preview-actions"><button class="btn" id="btnImportFlowPdf"><i class="fa-solid fa-file-import"></i> Importar al flujograma</button><button class="ghost" id="btnClearFlowPdf">Cancelar</button></div>`;document.getElementById('btnImportFlowPdf').onclick=importFlowPdfActivities;document.getElementById('btnClearFlowPdf').onclick=clearFlowPdf}
function editFlowPdf(index,key,value){if(!flowPdfActivities[index])return;flowPdfActivities[index][key]=key==='order'?Number(value)||1:String(value||'').trim()}
async function analyzeFlowPdf(){const file=selectedFlowPdf;const trigger=document.getElementById('btnAnalyzeFlowPdf');if(!file){setFlowPdfStatus('Primero presiona “Importar PDF” y selecciona un archivo.','error');return}if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){setFlowPdfStatus('El archivo seleccionado debe ser PDF.','error');return}const form=new FormData();form.append('pdf',file,file.name);if(trigger)trigger.disabled=true;setFlowPdfStatus('Analizando el flujograma con Python y PyMuPDF...','loading');const preview=document.getElementById('flowPdfPreview');if(preview)preview.innerHTML='';try{const res=await fetch('api/importar_flujo.php',{method:'POST',body:form,cache:'no-store',headers:{'Accept':'application/json'}});const raw=await res.text();let data;try{data=JSON.parse(raw)}catch{throw new Error(`El servidor no devolvió JSON válido (HTTP ${res.status}). ${raw.slice(0,700)}`)}if(!res.ok||!data.success)throw new Error(data.message||`El servidor respondió con HTTP ${res.status}.`);flowPdfActivities=Array.isArray(data.activities)?data.activities:[];if(!flowPdfActivities.length)throw new Error('Python no encontró actividades numeradas en el PDF.');setFlowPdfStatus(data.message||`Se detectaron ${flowPdfActivities.length} actividades.`,'success');renderFlowPdfPreview()}catch(err){flowPdfActivities=[];setFlowPdfStatus(err.message||'No se pudo analizar el PDF.','error')}finally{if(trigger)trigger.disabled=!selectedFlowPdf}}
function importFlowPdfActivities(){if(!flowPdfActivities.length){setFlowPdfStatus('Primero analiza el PDF y revisa las actividades detectadas.','error');return}const maxExisting=state.processes.reduce((m,p)=>Math.max(m,Number(p.order)||0),0);let imported=0;flowPdfActivities.forEach((a,i)=>{const order=Number(a.order)||maxExisting+i+1;state.processes.push({id:uid(),name:String(a.name||'').trim(),owner:String(a.owner||'').trim(),description:String(a.description||'').trim(),order});imported++});clearFlowPdf();save();setFlowPdfStatus(`${imported} actividades importadas al flujograma.`,'success')}
function openFlowPdfPicker(){const input=document.getElementById('flowPdfInput');if(!input)return;flowPdfInput=input;input.value='';input.click()}
function renderCharts(ms){
 const ctx=document.getElementById('productionChart');
 if(ctx){if(productionChart)productionChart.destroy();productionChart=new Chart(ctx,{type:'bar',data:{labels:ms.map(m=>m.name),datasets:[{label:'Unidades requeridas',data:ms.map(m=>m.required)}]},options:{responsive:true,plugins:{legend:{display:false}}}})}
 const surplusCtx=document.getElementById('surplusChart');
 if(surplusCtx){
  const surplusRows=ms.map(m=>({name:m.name,surplus:Number(m.histProduction||0)-Number(m.histSales||0)}));
  if(surplusChart)surplusChart.destroy();
  surplusChart=new Chart(surplusCtx,{type:'bar',data:{labels:surplusRows.map(x=>x.name),datasets:[{label:'Superávit / déficit',data:surplusRows.map(x=>x.surplus)}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${num(ctx.raw)} unidades`}}},scales:{y:{beginAtZero:true}}}});
  const totalSurplus=surplusRows.reduce((a,x)=>a+x.surplus,0);
  const surplusEl=document.getElementById('surplusTotal');
  if(surplusEl)surplusEl.textContent=num(totalSurplus);
 }
 const ac=document.getElementById('allocationChart');
 if(ac){const month=document.getElementById('allocationMonth')?.value||ms[0]?.id;const data=state.pools.map(p=>poolCost(p,month));if(allocationChart)allocationChart.destroy();allocationChart=new Chart(ac,{type:'doughnut',data:{labels:state.pools.map(p=>p.name),datasets:[{data}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}})}
 const homeMonth=document.getElementById('homeCifMonth')?.value||ms[0]?.id;
 const cifRows=cifForMonth(homeMonth).sort((a,b)=>b.total-a.total);
 const cifCtx=document.getElementById('homeCifChart');
 if(cifCtx){if(homeCifChart)homeCifChart.destroy();homeCifChart=new Chart(cifCtx,{type:'bar',data:{labels:cifRows.map(c=>c.item),datasets:[{label:'CIF total',data:cifRows.map(c=>c.total)}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}})}
 const poolRows=state.pools.filter(p=>(p.monthId||'')===homeMonth).map(p=>({name:p.name,total:poolCost(p,homeMonth)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
 const poolCtx=document.getElementById('homePoolChart');
 if(poolCtx){if(homePoolChart)homePoolChart.destroy();homePoolChart=new Chart(poolCtx,{type:'doughnut',data:{labels:poolRows.map(x=>x.name),datasets:[{data:poolRows.map(x=>x.total)}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}}}})}
 const monthlyCtx=document.getElementById('homeMonthlyCifChart');
 if(monthlyCtx){if(homeMonthlyCifChart)homeMonthlyCifChart.destroy();homeMonthlyCifChart=new Chart(monthlyCtx,{type:'line',data:{labels:ms.map(m=>m.name),datasets:[{label:'CIF total',data:ms.map(m=>totalCif(m.id)),tension:.25,fill:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}})}
}
function resetProcessForm(){
 const ids=['procName','procOwner','procDescription','procOrder'];ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
 editingProcessId=null;const btn=document.getElementById('addProcess');if(btn)btn.innerHTML='<i class="fa-solid fa-plus"></i> Agregar proceso';
}
function startEditProcess(id){
 const p=state.processes.find(x=>x.id===id);if(!p)return;
 editingProcessId=id;
 document.getElementById('procName').value=p.name||'';document.getElementById('procOwner').value=p.owner||'';document.getElementById('procDescription').value=p.description||'';document.getElementById('procOrder').value=p.order||'';
 const btn=document.getElementById('addProcess');if(btn)btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Actualizar proceso';showSection('flujograma');
}
function resetMonthForm(){['monthName','histSales','histProduction','forecastSales','firstInventory'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});editingMonthId=null;const btn=document.getElementById('addMonth');if(btn)btn.innerHTML='<i class="fa-solid fa-plus"></i> Agregar mes';const cancel=document.getElementById('cancelMonthEdit');if(cancel)cancel.style.display='none';}
function startEditMonth(id){
 const m=state.months.find(x=>x.id===id);if(!m)return;
 editingMonthId=id;
 document.getElementById('monthName').value=m.name??'';
 document.getElementById('histSales').value=m.histSales??0;
 document.getElementById('histProduction').value=m.histProduction??0;
 document.getElementById('forecastSales').value=m.forecastSales??0;
 document.getElementById('firstInventory').value=(state.months[0]?.id===m.id)?(m.firstInventory??0):'';
 const btn=document.getElementById('addMonth');
 if(btn)btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Actualizar mes';
 const cancel=document.getElementById('cancelMonthEdit');
 if(cancel)cancel.style.display='inline-flex';
 showSection('ventas');
 setTimeout(()=>document.getElementById('monthName')?.focus(),100);
}
function startEditCif(id){
 const c=state.cifs.find(x=>x.id===id);if(!c)return;
 editingCifId=id;
 const monthEl=document.getElementById('cifMonth');if(monthEl){monthEl.value=c.monthId;monthEl.disabled=true;}document.getElementById('cifItem').value=c.item||'';document.getElementById('cifFixed').value=c.fixed??0;document.getElementById('cifRate').value=c.rate??0;
 const reuse=document.getElementById('cifReuse');if(reuse)reuse.value='';
 refreshCifReuseOptions(c.monthId);
 const btn=document.getElementById('addCif');if(btn)btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Actualizar CIF'; const cancel=document.getElementById('cancelCifEdit');if(cancel)cancel.style.display='inline-flex';
 showSection('cif');
}
function startEditPool(id){
 const pool=state.pools.find(x=>x.id===id);if(!pool)return;
 editingPoolId=id;
 document.getElementById('poolMonth').value=pool.monthId||state.months[0]?.id||'';document.getElementById('poolName').value=pool.name||'';document.getElementById('poolDriver').value=pool.driver||'';document.getElementById('poolTotalDriver').value=pool.totalDriver??0;
 const btn=document.getElementById('addPool');if(btn)btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Actualizar pool';showSection('pools');
}
function editExpenseBudget(id){
 const b=(state.expenseBudgets||[]).find(x=>x.id===id);if(!b)return;
 const name=prompt('Nombre del presupuesto:',b.name||'');if(name===null)return;const clean=name.trim();if(!clean)return alert('El nombre no puede estar vacío.');b.name=clean;save();
}
function deleteProcess(id){state.processes=state.processes.filter(p=>p.id!==id);state.pools.forEach(p=>{if(p.processHours)delete p.processHours[id]});save()}
function deleteMonth(id){state.months=state.months.filter(m=>m.id!==id);state.cifs=state.cifs.filter(c=>c.monthId!==id);state.pools=state.pools.filter(p=>p.monthId!==id);expandedPools.forEach(pid=>{if(!state.pools.some(p=>p.id===pid))expandedPools.delete(pid)});save()}
function deleteCif(id){state.cifs=state.cifs.filter(c=>c.id!==id);state.pools.forEach(p=>p.cifIds=(p.cifIds||[]).filter(x=>x!==id));save()}
function deletePool(id){state.pools=state.pools.filter(p=>p.id!==id);expandedPools.delete(id);save()}
function togglePool(id){if(expandedPools.has(id))expandedPools.delete(id);else expandedPools.add(id);renderPools()}
function toggleProcess(pid,prid,on){const p=state.pools.find(x=>x.id===pid);p.processHours=p.processHours||{};if(on)p.processHours[prid]=Number(p.processHours[prid]||0);else delete p.processHours[prid];save()}
function setHours(pid,prid,v){const p=state.pools.find(x=>x.id===pid);p.processHours=p.processHours||{};p.processHours[prid]=Number(v||0);save()}
function setPoolDriver(pid,v){const p=state.pools.find(x=>x.id===pid);if(!p)return;p.driver=String(v||'').trim();save()}
function setPoolTotalDriver(pid,v){const p=state.pools.find(x=>x.id===pid);if(!p)return;p.totalDriver=Number(v||0);save()}
function toggleCif(pid,cid,on){const p=state.pools.find(x=>x.id===pid);p.cifIds=p.cifIds||[];if(on&&!p.cifIds.includes(cid))p.cifIds.push(cid);if(!on)p.cifIds=p.cifIds.filter(x=>x!==cid);save()}
document.addEventListener('DOMContentLoaded',()=>{
 const cifMonthEl=document.getElementById('cifMonth');
 const cifReuseEl=document.getElementById('cifReuse');
 if(cifMonthEl)cifMonthEl.addEventListener('change',()=>refreshCifReuseOptions(cifMonthEl.value));
 if(cifReuseEl)cifReuseEl.addEventListener('change',e=>loadCifReuseConcept(e.target.value));
 const cancelCif=document.getElementById('cancelCifEdit');if(cancelCif)cancelCif.addEventListener('click',resetCifForm);

 document.querySelectorAll('.nav').forEach(n=>n.onclick=()=>showSection(n.dataset.section));document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showSection(b.dataset.go));
 const analyzeFlowPdfBtn=document.getElementById('btnAnalyzeFlowPdf');const flowInput=document.getElementById('flowPdfInput');if(flowInput){flowPdfInput=flowInput;flowInput.addEventListener('change',()=>{const file=flowInput.files&&flowInput.files[0];if(!file){selectedFlowPdf=null;renderFlowPdfFile();return}selectedFlowPdf=file;flowPdfActivities=[];renderFlowPdfFile();setFlowPdfStatus(`Archivo cargado: ${file.name}. Presiona “Analizar PDF”.`,'success');const preview=document.getElementById('flowPdfPreview');if(preview)preview.innerHTML=''})}if(analyzeFlowPdfBtn){analyzeFlowPdfBtn.type='button';analyzeFlowPdfBtn.onclick=e=>{e.preventDefault();e.stopPropagation();analyzeFlowPdf()}}
  document.getElementById('addProcess').onclick=()=>{const name=document.getElementById('procName').value.trim();if(!name)return alert('Ingresa el nombre del proceso.');if(editingProcessId){const p=state.processes.find(x=>x.id===editingProcessId);if(p){p.name=name;p.owner=document.getElementById('procOwner').value.trim();p.description=document.getElementById('procDescription')?.value.trim()||'';p.order=Number(document.getElementById('procOrder').value)||p.order||1;}}else{state.processes.push({id:uid(),name,owner:document.getElementById('procOwner').value.trim(),description:document.getElementById('procDescription')?.value.trim()||'',order:Number(document.getElementById('procOrder').value)||state.processes.length+1});}resetProcessForm();save()};
 document.getElementById('addMonth').onclick=()=>{const name=document.getElementById('monthName').value.trim();if(!name)return alert('Ingresa el mes.');const duplicate=state.months.some(m=>m.id!==editingMonthId&&m.name.toLowerCase()===name.toLowerCase());if(duplicate)return alert('Ese mes ya existe.');if(editingMonthId){const m=state.months.find(x=>x.id===editingMonthId);if(m){m.name=name;m.histSales=Number(document.getElementById('histSales').value)||0;m.histProduction=Number(document.getElementById('histProduction').value)||0;m.forecastSales=Number(document.getElementById('forecastSales').value)||0;m.firstInventory=state.months[0]?.id===m.id?Number(document.getElementById('firstInventory').value)||0:0;}}else{state.months.push({id:uid(),name,histSales:Number(document.getElementById('histSales').value)||0,histProduction:Number(document.getElementById('histProduction').value)||0,forecastSales:Number(document.getElementById('forecastSales').value)||0,firstInventory:state.months.length?0:Number(document.getElementById('firstInventory').value)||0});}resetMonthForm();save()};
 document.getElementById('cancelMonthEdit')?.addEventListener('click',resetMonthForm);
 document.getElementById('saveFinalParams')?.addEventListener('click',()=>{
  const priceEl=document.getElementById('finalSalePrice');
  const cashEl=document.getElementById('finalInitialCash');
  const price=Number(priceEl?.value||0);
  const cash=Number(cashEl?.value||0);
  if(!Number.isFinite(price)||price<0){alert('Ingresa un precio de venta unitario válido.');return;}
  if(!Number.isFinite(cash)||cash<0){alert('Ingresa un saldo inicial de caja válido.');return;}
  state.finalBudget=state.finalBudget||{};
  state.finalBudget.salePrice=price;
  state.finalBudget.initialCash=cash;
  save();
 });
 document.getElementById('saveBudgetParams').onclick=()=>{
  const first=state.months[0];
  if(!first)return alert('Primero agrega meses en Ventas.');
  const value=Number(document.getElementById('budgetInitialFinishedGoods').value);
  if(!Number.isFinite(value)||value<0)return alert('Ingresa un inventario inicial válido.');
  state.budget=state.budget||{};
  state.budget.initialFinishedGoods=value;
  save();
 };
 document.getElementById('saveFlowMonthly')?.addEventListener('click',saveFlowMonthly);
 document.getElementById('saveFlowGeneral')?.addEventListener('click',saveFlowGeneral);
 document.getElementById('saveFlowFinance')?.addEventListener('click',saveFlowFinance);
 document.getElementById('addFlowAsset')?.addEventListener('click',addFlowAsset);
 document.getElementById('saveFlowDeferred')?.addEventListener('click',saveFlowDeferred);
 document.getElementById('saveFlowVan')?.addEventListener('click',saveFlowVan);
 document.getElementById('addExpenseBudget').onclick=addExpenseBudget;
 document.getElementById('saveMaterialParams').onclick=()=>{
  const monthId=document.getElementById('mdMonth').value;
  if(!monthId)return alert('Primero agrega meses en Ventas.');
  const p=getMaterialParams(monthId);
  p.unitCost=Number(document.getElementById('mdUnitCost').value)||0;
  p.leadDays=Number(document.getElementById('mdLeadDays').value)||0;
  // El inventario inicial ya no se ingresa manualmente: se calcula con Lead Time % × producción requerida del mes.
  p.nextRequiredOverride=Number(document.getElementById('mdNextRequired').value)||0;
  state.materialDirect[monthId]=p;
  document.getElementById('mdViewMonth').value=monthId;
  save();
};
 document.getElementById('saveLaborParams').onclick=()=>{
  const monthId=document.getElementById('laborMonth').value;
  if(!monthId)return alert('Primero agrega meses en Ventas.');
  const p=getLaborParams(monthId);
  p.hoursPerUnit=Number(document.getElementById('laborHoursUnit').value)||0;
  p.costPerHour=Number(document.getElementById('laborCostHour').value)||0;
  state.directLabor[monthId]=p;
  document.getElementById('laborViewMonth').value=monthId;
  save();
 };
 document.getElementById('addCif').onclick=()=>{const monthId=document.getElementById('cifMonth').value;if(!monthId)return alert('Primero agrega meses.');const item=document.getElementById('cifItem').value.trim();if(!item)return alert('Ingresa el ítem CIF.');const fixed=Number(document.getElementById('cifFixed').value)||0;const rate=Number(document.getElementById('cifRate').value)||0;if(editingCifId){const c=state.cifs.find(x=>x.id===editingCifId);if(c){const oldMonth=c.monthId;c.monthId=monthId;c.item=item;c.fixed=fixed;c.rate=rate;if(oldMonth!==monthId)state.pools.forEach(p=>{p.cifIds=(p.cifIds||[]).filter(cid=>cid!==c.id)});}}else{state.cifs.push({id:uid(),monthId,item,fixed,rate});}resetCifForm();save()};
 document.getElementById('addPool').onclick=()=>{const monthId=document.getElementById('poolMonth').value;if(!monthId)return alert('Primero agrega meses y selecciona el mes del pool.');const name=document.getElementById('poolName').value.trim();if(!name)return alert('Ingresa el nombre del pool.');const driver=document.getElementById('poolDriver').value.trim(),totalDriver=Number(document.getElementById('poolTotalDriver').value)||0;if(editingPoolId){const pool=state.pools.find(x=>x.id===editingPoolId);if(pool){const oldMonth=pool.monthId;pool.monthId=monthId;pool.name=name;pool.driver=driver;pool.totalDriver=totalDriver;if(oldMonth!==monthId)pool.cifIds=[];expandedPools.add(pool.id);}}else{const pool={id:uid(),monthId,name,driver,totalDriver,processHours:{},cifIds:[]};state.pools.push(pool);expandedPools.add(pool.id);}editingPoolId=null;document.getElementById('poolName').value='';document.getElementById('poolDriver').value='';document.getElementById('poolTotalDriver').value='';document.getElementById('addPool').innerHTML='<i class="fa-solid fa-plus"></i> Crear pool';document.getElementById('poolViewMonth').value=monthId;save()};
 ['cifViewMonth','allocationPoolFilter','allocationMonth','unitMonth','homeCifMonth','poolViewMonth','mdMonth','mdViewMonth','laborMonth','laborViewMonth'].forEach(id=>document.getElementById(id)?.addEventListener('change',renderAll));
 document.getElementById('btnReset').onclick=()=>{if(confirm('¿Eliminar todos los datos ingresados?')){state=defaultState();localStorage.removeItem(KEY);renderAll()}};
 document.getElementById('btnAiAnalysis')?.addEventListener('click',analyzeWithAi);
 renderAll();
});
