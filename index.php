<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sistema ABC - UPB P2</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<link rel="stylesheet" href="style.css?v=5">
</head>
<body>
<div class="app">
<aside class="sidebar">
  <div class="brand"><div class="brand-mark">UPB</div><div><strong>Sistema ABC</strong><small>Proyecto P2</small></div></div>
  <nav>
    <button class="nav active" data-section="inicio"><i class="fa-solid fa-house"></i> Inicio</button>
    <button class="nav" data-section="flujograma"><i class="fa-solid fa-diagram-project"></i> Flujograma</button>
    <button class="nav" data-section="ventas"><i class="fa-solid fa-chart-column"></i> Ventas</button>
    <button class="nav" data-section="inventarios"><i class="fa-solid fa-boxes-stacked"></i> Inventarios</button>
    <button class="nav" data-section="produccion"><i class="fa-solid fa-industry"></i> Producción</button>
    <button class="nav" data-section="material"><i class="fa-solid fa-box-open"></i> Material Directo</button>
    <button class="nav" data-section="labor"><i class="fa-solid fa-user-gear"></i> Mano de Obra Directa</button>
    <button class="nav" data-section="cif"><i class="fa-solid fa-money-check-dollar"></i> Trabajo y cálculo CIF</button>
    <button class="nav" data-section="presupuestos"><i class="fa-solid fa-file-invoice-dollar"></i> Presupuestos</button>
    <button class="nav" data-section="final"><i class="fa-solid fa-chart-line"></i> Estado y Caja</button>
    <button class="nav" data-section="flujoCaja"><i class="fa-solid fa-money-bill-transfer"></i> Flujo de Caja</button>
    <button class="nav" data-section="pools"><i class="fa-solid fa-layer-group"></i> Pools</button>
    <button class="nav" data-section="asignacion"><i class="fa-solid fa-share-nodes"></i> Asignación CIF</button>
    <button class="nav" data-section="resultado"><i class="fa-solid fa-calculator"></i> CIF unitario</button>
  </nav>
  <div class="side-note">Costeo Basado en Actividades</div>
</aside>
<main class="main">
<header class="topbar"><div><span class="eyebrow">COSTEO BASADO EN ACTIVIDADES</span><h1 id="pageTitle">Sistema ABC - Proyecto P2</h1></div><div class="top-actions"><button class="ghost" id="btnReset"><i class="fa-solid fa-rotate-left"></i> Restablecer</button><span class="period">Gestión 2026</span></div></header>

<section id="inicio" class="section active">
 <div class="hero"><div><span class="tag">MODELO MANUAL + CÁLCULO AUTOMÁTICO</span><h2>Construye tu costeo ABC paso a paso.</h2><p>Todos los datos se ingresan desde la interfaz. El sistema calcula inventarios, producción requerida, CIF fijo/variable, pools, asignación por horas y CIF unitario.</p><button class="btn" data-go="flujograma">Comenzar <i class="fa-solid fa-arrow-right"></i></button></div><div class="hero-number">ABC</div></div>
 <div class="stats"><div class="stat"><span>Ventas pronosticadas</span><b id="statSales">0</b><small>unidades</small></div><div class="stat"><span>Producción requerida</span><b id="statProduction">0</b><small>unidades</small></div><div class="stat"><span>CIF total</span><b id="statCif">Bs. 0.00</b><small>mes seleccionado</small></div><div class="stat"><span>Pools creados</span><b id="statPools">0</b><small>configurados</small></div></div>
 <div class="grid2"><div class="card home-production-card"><h3>Producción requerida</h3><canvas id="productionChart"></canvas></div><div class="card home-surplus-card"><div class="dashboard-card-head"><div><h3>Superávit / déficit de producción</h3><span>Producción histórica − ventas históricas</span></div></div><canvas id="surplusChart"></canvas><div class="surplus-summary">Saldo acumulado: <b id="surplusTotal">0</b> unidades</div></div></div>
 <div class="dashboard-heading"><div><h3>Dashboard de consumo de CIF</h3><p class="muted">Visualiza qué conceptos y pools concentran el mayor consumo de CIF en el mes seleccionado.</p></div><label>Mes del dashboard<select id="homeCifMonth"></select></label></div>
 <div class="dashboard-grid">
  <div class="card dashboard-card"><div class="dashboard-card-head"><div><h3>Top de conceptos CIF</h3><span>Mayor consumo de CIF</span></div></div><canvas id="homeCifChart"></canvas></div>
  <div class="card dashboard-card"><div class="dashboard-card-head"><div><h3>Consumo de CIF por pool</h3><span>Distribución del mes seleccionado</span></div></div><canvas id="homePoolChart"></canvas></div>
  <div class="card dashboard-card dashboard-wide"><div class="dashboard-card-head"><div><h3>Evolución del CIF total</h3><span>Comparación entre los meses registrados</span></div></div><canvas id="homeMonthlyCifChart"></canvas></div>
 </div>
 <div class="note"><b>Importante:</b> no se precargan pools, actividades ni horas. Tú decides qué procesos pertenecen a cada pool y cuánto tiempo requiere cada actividad.</div>
</section>

<section id="flujograma" class="section">
 <div class="heading"><h2>1. Flujograma</h2><p>Registra cada proceso del flujo y el encargado responsable de la actividad.</p></div>
 <div class="card form-card"><div class="form-grid"><label>Nombre del proceso<input id="procName" placeholder="Ej. Preparación de materia prima"></label><label>Encargado<input id="procOwner" placeholder="Ej. Operador de producción"></label><label>Orden<input id="procOrder" type="number" min="1" placeholder="1"></label><label class="full-field">Descripción de la actividad<textarea id="procDescription" rows="2" placeholder="Descripción de la actividad"></textarea></label><button class="btn" id="addProcess"><i class="fa-solid fa-plus"></i> Agregar proceso</button></div></div>
 <div class="card pdf-import-card"><div class="pdf-import-head"><div><h3><i class="fa-solid fa-file-pdf"></i> Importar actividades desde PDF</h3><p class="muted">Selecciona un flujograma en PDF. El sistema lo enviará a Python para identificar automáticamente las actividades, encargados y descripciones.</p></div></div><div class="pdf-actions"><label class="btn pdf-upload-btn" for="flowPdfInput"><i class="fa-solid fa-file-import"></i> Importar PDF</label><button type="button" class="btn secondary" id="btnAnalyzeFlowPdf"><i class="fa-solid fa-magnifying-glass"></i> Analizar PDF</button><input id="flowPdfInput" class="pdf-file-input" type="file" accept="application/pdf,.pdf"></div><div id="flowPdfFiles" class="pdf-files"></div><div id="flowPdfStatus" class="pdf-status"></div><div id="flowPdfPreview"></div></div>
 <div class="flow-list" id="flowList"></div>
</section>

<section id="ventas" class="section">
 <div class="heading"><h2>2. Ventas pronosticadas, ventas históricas y producción histórica</h2><p>Ingresa el inventario inicial con el que empieza el primer mes. Los meses siguientes toman automáticamente el inventario final del mes anterior.</p></div>
 <div class="card form-card"><div class="form-grid"><label>Mes<input id="monthName" placeholder="Ej. Enero"></label><label>Ventas históricas<input id="histSales" type="number" min="0" step="0.01"></label><label>Producción histórica<input id="histProduction" type="number" min="0" step="0.01"></label><label>Ventas pronosticadas<input id="forecastSales" type="number" min="0" step="0.01"></label><label>Inventario inicial del primer mes<input id="firstInventory" type="number" min="0" step="0.01" placeholder="Solo se usa para el primer mes"></label><button class="btn" id="addMonth"><i class="fa-solid fa-plus"></i> Agregar mes</button><button type="button" class="btn secondary" id="cancelMonthEdit" style="display:none"><i class="fa-solid fa-xmark"></i> Cancelar edición</button></div></div>
 <div class="card"><table><thead><tr><th>Mes</th><th>Ventas históricas</th><th>Producción histórica</th><th>Ventas pronosticadas</th><th>Inventario inicial</th><th>Inventario final</th><th>Acción</th></tr></thead><tbody id="salesTable"></tbody></table></div>
 <div class="formula"><span>Inventario final</span><strong>=</strong><span>Inventario inicial</span><strong>+</strong><span>Producción histórica</span><strong>−</strong><span>Ventas históricas</span></div>
</section>

<section id="inventarios" class="section">
 <div class="heading"><h2>3. Cálculo automático de inventarios</h2><p>El sistema calcula el inventario final de cada mes y lo usa como inventario inicial del siguiente.</p></div>
 <div class="card"><table><thead><tr><th>Mes</th><th>Inventario inicial</th><th>Producción histórica</th><th>Ventas históricas</th><th>Inventario final calculado</th><th>Fórmula</th></tr></thead><tbody id="inventoryTable"></tbody></table></div>
</section>

<section id="produccion" class="section">
 <div class="heading"><h2>4. Análisis de la producción</h2><p>El inventario final deseado se obtiene automáticamente del inventario final calculado para cada mes. El sistema calcula las unidades requeridas de producción.</p></div>
 <div class="card"><table><thead><tr><th>Mes</th><th>Ventas pronosticadas</th><th>Inventario final deseado</th><th>Subtotal</th><th>Inventario inicial</th><th>Unidades requeridas</th></tr></thead><tbody id="productionTable"></tbody></table></div>
 <div class="formula"><span>Unidades requeridas</span><strong>=</strong><span>Ventas pronosticadas</span><strong>+</strong><span>Inv. final deseado</span><strong>−</strong><span>Inv. inicial</span></div>
 <div class="note"><b>Automático:</b> el inventario final deseado corresponde al inventario final calculado en la sección de Inventarios. No se ingresa manualmente.</div>
</section>

<section id="material" class="section">
 <div class="heading"><h2>5. Costo de Material Directo</h2><p>Calcula las compras requeridas de material directo a partir de las unidades requeridas de producción, el inventario final deseado y el inventario inicial. El porcentaje de inventario final se obtiene mediante el Lead Time.</p></div>
 <div class="card form-card"><div class="form-grid"><label>Mes<select id="mdMonth"></select></label><label>Costo unitario de material directo (Bs.)<input id="mdUnitCost" type="number" min="0" step="0.01" placeholder="Ej. 44"></label><label>Días incurridos en el pedido (Lead Time)<input id="mdLeadDays" type="number" min="0" step="0.01" placeholder="Ej. 16.5"></label><label class="full-field">Unidades requeridas del mes siguiente (solo si ese mes aún no está registrado)<input id="mdNextRequired" type="number" min="0" step="0.01" placeholder="Ej. producción requerida de julio"></label><button class="btn" id="saveMaterialParams"><i class="fa-solid fa-floppy-disk"></i> Guardar / actualizar parámetros</button></div></div>
 <div class="note"><b>Edición:</b> selecciona cualquier mes para cargar sus parámetros guardados. Puedes modificar el costo unitario y los días de Lead Time y volver a guardar; los cálculos se actualizarán automáticamente.</div>
 <div class="card"><div class="toolbar"><label>Mes a consultar<select id="mdViewMonth"></select></label><div class="totals"><span>Lead Time: <b id="mdLeadPercent">0.00%</b></span><span>Producción siguiente: <b id="mdNextProduction">0</b> unidades</span><span>Costo total: <b id="mdTotalCost">Bs. 0.00</b></span></div></div></div>
 <div class="card"><div class="table-scroll"><table><thead id="materialHead"></thead><tbody id="materialTable"></tbody></table></div></div>
 <div class="card material-consumption-card"><div class="table-scroll"><table class="material-consumption-table"><thead><tr><th colspan="100%">PRESUPUESTO DE CONSUMO DE MATERIAL DIRECTO</th></tr><tr id="materialConsumptionHead"><th>Concepto</th></tr></thead><tbody id="materialConsumptionTable"></tbody></table></div></div>
 <div class="note"><b>Lead Time:</b> el sistema calcula automáticamente <b>(días del pedido / 30) × 100</b>. El porcentaje se aplica a las unidades requeridas del mes actual para calcular el inventario inicial y a las unidades requeridas del mes siguiente para calcular el inventario final deseado.</div>
 <div class="formula"><span>Inventario final deseado de material directo</span><strong>=</strong><span>Producción requerida del mes siguiente</span><strong>×</strong><span>Lead Time %</span></div>
 <div class="formula"><span>Compras requeridas</span><strong>=</strong><span>Unidades requeridas de producción</span><strong>+</strong><span>Inv. final material directo</span><strong>−</strong><span>Inv. inicial material directo</span></div>
 </section>

<section id="labor" class="section">
 <div class="heading"><h2>6. Costo de Mano de Obra Directa</h2><p>Calcula el costo de mano de obra directa a partir de las unidades requeridas de producción. Las horas por unidad y el costo por hora se ingresan de forma independiente para cada mes.</p></div>
 <div class="card form-card"><div class="form-grid"><label>Mes<select id="laborMonth"></select></label><label>Horas por unidad<input id="laborHoursUnit" type="number" min="0" step="0.000001" placeholder="Ej. 0.834409"></label><label>Costo por hora (Bs.)<input id="laborCostHour" type="number" min="0" step="0.000001" placeholder="Ej. 3.595359"></label><button class="btn" id="saveLaborParams"><i class="fa-solid fa-floppy-disk"></i> Guardar / actualizar parámetros</button></div></div>
 <div class="note"><b>Edición:</b> selecciona cualquier mes para cargar sus valores guardados. Puedes modificarlos y volver a guardar; las horas totales y el costo de mano de obra se recalculan automáticamente.</div>
 <div class="card"><div class="toolbar"><label>Mes a consultar<select id="laborViewMonth"></select></label><div class="totals"><span>Horas totales: <b id="laborTotalHours">0.00</b></span><span>Costo MOD: <b id="laborTotalCost">Bs. 0.00</b></span></div></div></div>
 <div class="card"><div class="table-scroll"><table><thead id="laborHead"></thead><tbody id="laborTable"></tbody></table></div></div>
 <div class="formula"><span>Horas totales de MOD</span><strong>=</strong><span>Horas por unidad</span><strong>×</strong><span>Unidades requeridas de producción</span></div>
 <div class="formula"><span>Costo de MOD</span><strong>=</strong><span>Horas totales de MOD</span><strong>×</strong><span>Costo por hora</span></div>
</section>

<section id="cif" class="section">
 <div class="heading"><h2>7. Trabajo y cálculo de CIF</h2><p>Registra cada concepto de CIF. El costo variable se calcula con la tasa que tú ingreses multiplicada por las unidades requeridas de producción del mes.</p></div>
 <div class="card form-card"><div class="form-grid"><label>Mes<select id="cifMonth"></select></label><label>Ítem CIF<input id="cifItem" placeholder="Ej. Energía eléctrica"></label>
<label>Reutilizar concepto de otro mes<select id="cifReuse"><option value="">— Seleccionar concepto existente —</option></select></label><label>Costo fijo (Bs.)<input id="cifFixed" type="number" min="0" step="0.01"></label><label>Tasa variable (Bs./unidad)<input id="cifRate" type="number" min="0" step="0.000001" placeholder="Ej. 0.20"></label><button class="btn" id="addCif"><i class="fa-solid fa-plus"></i> Agregar CIF</button><button type="button" class="btn secondary" id="cancelCifEdit" style="display:none"><i class="fa-solid fa-xmark"></i> Cancelar edición</button></div></div>
 <div class="card"><div class="toolbar"><label>Mes a consultar<select id="cifViewMonth"></select></label><div class="totals"><span>Fijo: <b id="cifFixedTotal">Bs. 0.00</b></span><span>Variable: <b id="cifVariableTotal">Bs. 0.00</b></span><span>Total: <b id="cifTotal">Bs. 0.00</b></span></div></div><table><thead><tr><th>Ítem</th><th>Costo fijo</th><th>Tasa variable</th><th>Unidades requeridas</th><th>Costo variable</th><th>Total</th><th>Acción</th></tr></thead><tbody id="cifTable"></tbody></table></div>
 <div class="formula"><span>Costo variable</span><strong>=</strong><span>Tasa CIF variable</span><strong>×</strong><span>Unidades requeridas del mes</span></div>
 </section>


<section id="presupuestos" class="section">
 <div class="heading"><h2>Presupuestos</h2><p>Integra el costo de material directo, mano de obra directa y CIF para determinar el costo de manufactura, los artículos disponibles para la venta y el costo de artículos vendidos.</p></div>
 <div class="card form-card">
  <div class="form-grid">
   <label>Inventario inicial de artículos terminados (Bs.) — primer mes<input id="budgetInitialFinishedGoods" type="number" min="0" step="0.01" placeholder="Ej. 9618550"></label>
   <button class="btn" id="saveBudgetParams"><i class="fa-solid fa-floppy-disk"></i> Guardar inventario inicial</button>
  </div>
  <div class="note"><b>Importante:</b> este valor se ingresa únicamente para el primer mes. El inventario inicial de los meses siguientes se calcula automáticamente con el inventario final monetario del mes anterior.</div>
 </div>
 <div class="card">
  <div class="table-scroll"><table class="budget-table"><thead><tr id="budgetHeadRow"><th>Información</th></tr></thead><tbody id="budgetTable"></tbody></table></div>
 </div>
 <div class="card expense-budget-card">
  <div class="section-subtitle"><b>Otros presupuestos de gastos</b></div>
  <p class="muted">Crea presupuestos como gastos de venta, gastos administrativos u otros. Cada concepto puede calcularse como un monto fijo mensual o como un porcentaje de las ventas pronosticadas.</p>
  <div class="form-grid expense-form-grid">
   <label>Nombre del presupuesto<input id="expenseBudgetName" placeholder="Ej. Gastos de venta"></label>
   <button class="btn" id="addExpenseBudget"><i class="fa-solid fa-plus"></i> Crear presupuesto</button>
  </div>
 </div>
 <div id="expenseBudgets"></div>
</section>


<section id="final" class="section">
 <div class="heading"><h2>Estado de Ingresos y Presupuesto de Caja</h2><p>Integra los presupuestos calculados anteriormente para determinar la utilidad y el movimiento de efectivo de cada mes.</p></div>
 <div class="card form-card">
  <div class="section-subtitle"><b>Parámetros necesarios</b></div>
  <div class="form-grid final-params-grid">
   <label>Precio de venta unitario (Bs.)<input id="finalSalePrice" type="number" min="0" step="0.01" placeholder="Ej. 50"></label>
   <label>Saldo inicial de caja del primer mes (Bs.)<input id="finalInitialCash" type="number" min="0" step="0.01" placeholder="Ej. 5000000"></label>
   <button class="btn" id="saveFinalParams"><i class="fa-solid fa-floppy-disk"></i> Guardar parámetros</button>
  </div>
  <div class="note"><b>Edición:</b> puedes modificar estos valores cuando exista un error. El precio de venta se aplica a las unidades de ventas pronosticadas de cada mes. El saldo inicial de caja se ingresa únicamente para el primer mes; los siguientes se calculan automáticamente con el saldo final anterior.</div>
 </div>
 <div class="card">
  <div class="section-subtitle"><b>Estado de ingresos</b></div>
  <div class="table-scroll"><table class="budget-table final-table"><thead><tr id="incomeHeadRow"><th>Información</th></tr></thead><tbody id="incomeTable"></tbody></table></div>
 </div>
 <div class="card">
  <div class="section-subtitle"><b>Presupuesto de caja</b></div>
  <div class="table-scroll"><table class="budget-table final-table"><thead><tr id="cashHeadRow"><th>Información</th></tr></thead><tbody id="cashTable"></tbody></table></div>
 </div>
</section>

<section id="flujoCaja" class="section">
 <div class="heading"><h2>Flujo de Caja</h2><p>Primero ingresa y revisa los datos que alimentan el flujo de caja. Una vez guardados, el sistema calcula automáticamente el costo financiero, la depreciación de los activos y los demás resultados.</p></div>

 <div class="card form-card">
  <div class="section-subtitle"><b>1. Datos mensuales que alimentan el flujo</b></div>
  <p class="muted flowcash-help">Los ingresos y costos de operación se ingresan directamente para cada mes. Estos valores son independientes de los presupuestos anteriores para que puedas corregirlos sin alterar los demás apartados.</p>
  <div class="table-scroll"><table class="budget-table flow-input-table"><thead><tr id="flowInputHead"><th>Concepto</th></tr></thead><tbody id="flowInputTable"></tbody></table></div>
  <button class="btn" id="saveFlowMonthly"><i class="fa-solid fa-floppy-disk"></i> Guardar datos mensuales</button>
 </div>

 <div class="card form-card">
  <div class="section-subtitle"><b>2. Inversión, impuestos y otros parámetros</b></div>
  <div class="form-grid flowcash-params-grid">
   <label>Inversión inicial (Bs.)<input id="fcInvestment" type="number" min="0" step="0.01" placeholder="Ej. 30000"></label>
   <label>Tasa IUE (%)<input id="fcTaxRate" type="number" min="0" step="0.01" placeholder="25"></label>
   <label>IVA ventas (%)<input id="fcIvaSales" type="number" min="0" step="0.01" placeholder="13"></label>
   <label>IVA compras (%)<input id="fcIvaPurchases" type="number" min="0" step="0.01" placeholder="13"></label>
   <label>IT (%)<input id="fcItRate" type="number" min="0" step="0.01" placeholder="3"></label>
   <button class="btn" id="saveFlowGeneral"><i class="fa-solid fa-floppy-disk"></i> Guardar parámetros</button>
  </div>
 </div>

 <div class="card form-card">
  <div class="section-subtitle"><b>3. Costo financiero</b></div>
  <p class="muted flowcash-help">Ingresa el préstamo, la tasa y el plazo. El sistema calcula el saldo, el interés (costo financiero), la amortización de capital y la cuota de cada periodo.</p>
  <div class="form-grid flowcash-finance-grid">
   <label>Préstamo inicial (Bs.)<input id="fcLoan" type="number" min="0" step="0.01" placeholder="Ej. 10000"></label>
   <label>Tasa de interés por periodo (%)<input id="fcInterestRate" type="number" min="0" step="0.01" placeholder="Ej. 20"></label>
   <label>Plazo del préstamo (periodos)<input id="fcLoanTerm" type="number" min="1" step="1" placeholder="Ej. 4"></label>
   <button class="btn" id="saveFlowFinance"><i class="fa-solid fa-calculator"></i> Calcular costo financiero</button>
  </div>
  <div class="table-scroll"><table class="budget-table flowcash-table"><thead><tr id="loanInputHead"><th>Concepto</th></tr></thead><tbody id="loanInputTable"></tbody></table></div>
 </div>

 <div class="card form-card">
  <div class="section-subtitle"><b>4. Activos depreciables</b></div>
  <p class="muted flowcash-help">Añade cada activo con su costo inicial, vida útil y valor residual. La depreciación por periodo se calcula automáticamente con depreciación lineal: (costo inicial − valor residual) ÷ vida útil.</p>
  <div class="form-grid flowcash-asset-grid">
   <label>Activo<input id="fcAssetName" placeholder="Ej. Maquinaria"></label>
   <label>Costo inicial (Bs.)<input id="fcAssetCost" type="number" min="0" step="0.01"></label>
   <label>Vida útil (periodos)<input id="fcAssetLife" type="number" min="1" step="1"></label>
   <label>Valor residual (Bs.)<input id="fcAssetResidual" type="number" min="0" step="0.01"></label>
   <label>Utilidad venta último periodo (Bs.)<input id="fcAssetGain" type="number" min="0" step="0.01" placeholder="Opcional"></label>
   <button class="btn" id="addFlowAsset"><i class="fa-solid fa-plus"></i> Agregar activo</button>
  </div>
  <div class="table-scroll"><table class="budget-table flowcash-table"><thead><tr><th>Activo</th><th>Costo inicial</th><th>Vida útil</th><th>Valor residual</th><th>Depreciación / periodo</th><th>Venta último periodo</th><th>Acción</th></tr></thead><tbody id="flowAssetsTable"></tbody></table></div>
 </div>

 <div class="card form-card">
  <div class="section-subtitle"><b>5. Activo diferido y amortización</b></div>
  <div class="form-grid flowcash-deferred-grid">
   <label>Valor del activo diferido (Bs.)<input id="fcDeferredAmount" type="number" min="0" step="0.01" placeholder="Ej. 25000"></label>
   <label>Periodo de amortización<input id="fcDeferredPeriods" type="number" min="1" step="1" placeholder="Ej. 4"></label>
   <button class="btn" id="saveFlowDeferred"><i class="fa-solid fa-calculator"></i> Guardar y calcular amortización</button>
  </div>
  <div id="flowDeferredSummary" class="flowcash-mini-summary"></div>
 </div>

 <div class="card">
  <div class="section-subtitle"><b>6. Flujo de Caja proyectado</b></div>
  <p class="muted flowcash-help">El flujo se muestra únicamente con los datos ingresados en los apartados anteriores y con los cálculos derivados de ellos.</p>
  <div class="table-scroll"><table class="budget-table flowcash-table"><thead><tr id="flowCashHeadPeriods"><th>Concepto</th></tr></thead><tbody id="flowCashTable"></tbody></table></div>
 </div>

 <div class="card">
  <div class="section-subtitle"><b>7. Ajuste de liquidez</b></div>
  <div class="table-scroll"><table class="budget-table flowcash-table"><thead><tr id="liquidityHeadPeriods"><th>Concepto</th></tr></thead><tbody id="liquidityTable"></tbody></table></div>
 </div>

 <div class="formula"><span>Flujo de caja</span><strong>=</strong><span>Utilidad neta</span><strong>+</strong><span>Depreciación</span><strong>+</strong><span>Amortización diferida</span><strong>−</strong><span>Amortización de capital</span><strong>+</strong><span>Valor residual</span><strong>+</strong><span>Utilidad venta de activos</span></div>

 <div class="card form-card">
  <div class="section-subtitle"><b>8. Cálculo del VAN</b></div>
  <p class="muted flowcash-help">El VAN se calcula con la inversión inicial y los flujos de caja de cada periodo. Ingresa la tasa de descuento para actualizar los flujos futuros.</p>
  <div class="form-grid flowcash-van-grid">
   <label>Tasa de descuento / interés (%)<input id="fcVanRate" type="number" step="0.01" min="0" placeholder="Ej. 10"></label>
   <button class="btn" id="saveFlowVan"><i class="fa-solid fa-calculator"></i> Calcular VAN</button>
  </div>
  <div class="flowcash-van-result" id="flowVanResult"></div>
  <div class="table-scroll"><table class="budget-table flowcash-table"><thead><tr id="vanHeadPeriods"><th>Concepto</th></tr></thead><tbody id="vanTable"></tbody></table></div>
  <div class="formula"><span>VAN</span><strong>=</strong><span>− Inversión inicial</span><strong>+</strong><span>Σ Flujo de caja del periodo t / (1 + r)<sup>t</sup></span></div>
 </div>
</section>

<section id="pools" class="section">
 <div class="heading"><h2>8. Pools de CIF</h2><p>Crea los pools que quieras para cada mes. Dentro de cada pool selecciona por checklist los procesos del flujograma y registra las horas requeridas. También puedes seleccionar qué conceptos de CIF pertenecen al pool.</p></div>
 <div class="card form-card"><div class="form-grid"><label>Mes del pool<select id="poolMonth"></select></label><label>Nombre del pool<input id="poolName" placeholder="Ej. Energía"></label><label>Driver<input id="poolDriver" placeholder="Ej. Horas-equipo"></label><label>Total driver (mes)<input id="poolTotalDriver" type="number" min="0" step="0.01" placeholder="Ej. 1200"></label><button class="btn" id="addPool"><i class="fa-solid fa-plus"></i> Crear pool</button></div></div>
 <div class="card toolbar pool-toolbar"><label>Mes a consultar<select id="poolViewMonth"></select></label><span class="muted">Los pools mostrados corresponden únicamente al mes seleccionado.</span></div>
 <div id="poolBuilder"></div>
</section>

<section id="asignacion" class="section">
 <div class="heading"><h2>9. Asignación de CIF a actividades</h2><p>Filtra por pool y consulta cómo se distribuye su CIF entre las actividades seleccionadas según las horas registradas.</p></div>
 <div class="card toolbar"><label>Filtrar por pool<select id="allocationPoolFilter"></select></label><label>Mes<select id="allocationMonth"></select></label></div>
 <div id="allocationSummary"></div>
 <div class="card"><table><thead><tr><th>Pool</th><th>Actividad / proceso</th><th>Encargado</th><th>Horas</th><th>% del pool</th><th>CIF del pool</th><th>CIF asignado</th></tr></thead><tbody id="allocationTable"></tbody></table></div>
 <div class="card"><canvas id="allocationChart"></canvas></div>
 <div class="formula"><span>CIF actividad</span><strong>=</strong><span>CIF del pool</span><strong>×</strong><span>Horas actividad / Horas totales del pool</span></div>
</section>

<section id="resultado" class="section">
 <div class="heading"><h2>10. CIF por unidad</h2><p>Se suman los costos asignados de una misma actividad provenientes de todos los pools. Luego se calcula el CIF por unidad y se verifica el CIF total del mes.</p></div>
 <div class="card toolbar"><label>Mes<select id="unitMonth"></select></label></div>
 <div class="card">
  <div class="section-subtitle"><b>Paso 2: Asignación de costos indirectos a cada actividad considerando todos los pools</b></div>
  <table><thead><tr><th>Actividad</th><th>Descripción</th><th>Costo indirecto asignado CIF</th><th>% CIF asignado</th><th></th></tr></thead><tbody id="unitTable"></tbody></table>
 </div>
 <div class="card">
  <div class="section-subtitle"><b>Paso 3: Determinación del costo indirecto por unidad</b></div>
  <div class="note">Unidades requeridas de producción en el mes: <b id="unitRequired">0</b> unidades</div>
  <table><thead><tr><th>Actividad</th><th>Descripción</th><th>Bs. / unidad</th><th></th><th>Interpretación</th></tr></thead><tbody id="unitDetailTable"></tbody></table>
  <div class="total-box"><span>CIF unitario total</span><strong id="unitTotal">0.00000</strong></div>
  <div class="note"><b>Verificación del CIF total:</b> CIF unitario total × unidades requeridas = <b id="unitVerification">Bs. 0.00</b>. El resultado debe concordar con el CIF total asignado de la tabla superior: <b id="unitTotalCif">Bs. 0.00</b>.</div>
 </div>
 <div class="card ai-card">
  <div class="ai-head"><div><h3><i class="fa-solid fa-robot"></i> Análisis inteligente del costeo ABC</h3><p class="muted">La IA interpreta los resultados calculados por el sistema y señala observaciones, posibles inconsistencias y recomendaciones. No reemplaza las fórmulas del sistema.</p></div><button class="btn" id="btnAiAnalysis"><i class="fa-solid fa-wand-magic-sparkles"></i> Analizar con IA</button></div>
  <div id="aiStatus" class="ai-status"></div>
  <div id="aiResult" class="ai-result"><div class="mini-empty">Presiona “Analizar con IA” para generar un análisis del mes seleccionado.</div></div>
 </div>
</section>
</main></div>
<script src="script.js?v=28"></script>
<script src="pdf_import_fix.js?v=14"></script>
</body></html>
