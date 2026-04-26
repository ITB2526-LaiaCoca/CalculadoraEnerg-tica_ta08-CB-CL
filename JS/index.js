let globalData = {
  water: 0,
  electricity: 0,
  office: 0,
  cleaning: 0
};

let groupedCache = {};
let categoryList = [];
let sortState = {};


let data = [];

let dataLoaded = false;

let activeSection = null;

function hideAllSections() {
  document.querySelectorAll(".calc-section").forEach(el => {
    el.classList.add("hidden");
  });
}


function handle(type) {

  hideAllSections();

  const idMap = {
    elec: "elecSection",
    water: "waterSection",
    office: "officeSection",
    cleaning: "cleaningSection"
  };

  const target = document.getElementById(idMap[type]);

  if (target) target.classList.remove("hidden");

  activeSection = type;

  if (type === "elec") calcularElectricidad();
  if (type === "water") calcularAgua();
  if (type === "office") calcularOffice();
  if (type === "cleaning") calcularCleaning();

  document.getElementById("result").classList.remove("hidden");

  updateResultBox();
}

function hideResult() {
  document.getElementById("result").classList.toggle("hidden");
}


let mediaAgua = 0;
let mediaElec = 0;

function switchTab(tab) {
  document.querySelectorAll(".tab-content").forEach(t => {
    t.classList.remove("active");
  });

  const target = document.getElementById("tab-" + tab);
  if (target) target.classList.add("active");

  if (tab === "data") loadDataTab(); // 👈 NUEVO
}

function getDatesOrError() {
  const start = new Date(document.getElementById("start").value + "T00:00:00");
  const end = new Date(document.getElementById("end").value + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    document.getElementById("result").textContent =
      "Por favor, introduce fecha de inicio y fin.";
    return null;
  }

  if (start > end) {
    document.getElementById("result").textContent =
      "La a de inicio no puede ser mayor que la de fin.";
    return null;
  }

  return { start, end };
}

const PANEL_BASE = 136;

function toggleSelected() {
  if (!selectedDay) {
    alert("Select a day on the calenadar");
    return;
  }


  if (festivosSet.has(selectedDay)) {
    festivosSet.delete(selectedDay);
  } else {
    festivosSet.add(selectedDay);
  }

  renderCalendar();
}

function parseDateDMY(str) {
  const [d, m, y] = str.split("/");
  return new Date(`${y}-${m}-${d}T00:00:00`);
}

/* =========================
   FORMATO FECHAS
========================= */
function formatKey(date) {
  return String(date.getDate()).padStart(2, "0") + "-" +
         String(date.getMonth() + 1).padStart(2, "0");
}

function formatDisplay(date) {
  return String(date.getDate()).padStart(2, "0") + "-" +
         String(date.getMonth() + 1).padStart(2, "0") + "-" +
         date.getFullYear();
}

/* =========================
   SEMANA SANTA
========================= */
function addSemanaSanta(year, set) {
  let d = new Date(year, 2, 31);
  while (d.getDay() !== 0) d.setDate(d.getDate() - 1);

  let end = new Date(year, 3, 7);

  while (d <= end) {
    set.add(formatKey(d));
    d.setDate(d.getDate() + 1);
  }
}

/* =========================
   CALENDARIO
========================= */
let currentDate = new Date();
let selectedDay = null;


function changeMonth(n) {
  currentDate.setMonth(currentDate.getMonth() + n);
  renderCalendar();
}

let festivosSet = new Set([
  "01-01","06-01","01-05","12-10",
  "01-11","06-12","08-12",

  "22-12","23-12","24-12","25-12","26-12",
  "27-12","28-12","29-12","30-12","31-12",

  "02-01","03-01","04-01","05-01","07-01",

  "25-06","26-06","27-06","28-06","29-06","30-06",
  "01-07","02-07","03-07","04-07","05-07","06-07","07-07",
  "08-07","09-07","10-07","11-07","12-07","13-07","14-07",
  "15-07","16-07","17-07","18-07","19-07","20-07","21-07",
  "22-07","23-07","24-07","25-07","26-07","27-07","28-07",
  "29-07","30-07","31-07",
  "01-08","02-08","03-08","04-08","05-08","06-08","07-08",
  "08-08","09-08","10-08","11-08","12-08","13-08","14-08",
  "15-08","16-08","17-08","18-08","19-08","20-08","21-08",
  "22-08","23-08","24-08","25-08","26-08","27-08","28-08",
  "29-08","30-08","31-08",
  "01-09"
]);

addSemanaSanta(2026, festivosSet);

/* =========================
   FACTORES
========================= */
function getFactor(prefix) {
  let ilum = parseFloat(document.getElementById(prefix + "_ilum")?.value) || 0;
  let heat = parseFloat(document.getElementById(prefix + "_heat")?.value) || 0;
  let ac = parseFloat(document.getElementById(prefix + "_ac")?.value) || 0;
  return 1 + ilum + heat + ac;
}

/* =========================
   DATOS
========================= */
async function loadData() {
  const res = await fetch("./dataclean.json");
  data = await res.json();

  buildOfficeSupplies(); // 👈 IMPORTANTE
  buildCleaningSupplies();

  let agua = {};
  let elec = {};

  data.forEach(i => {
    if (i.category === "water" && i.consumption !== "") {
      agua[i.date] = (agua[i.date] || 0) + parseFloat(i.consumption);
    }

    if (i.category === "pv_electricity" && i.consumption !== "") {
      elec[i.date] = (elec[i.date] || 0) + parseFloat(i.consumption);
    }
  });

  mediaAgua =
    Object.values(agua).reduce((a,b)=>a+b,0) /
    Object.keys(agua).length;

  mediaElec =
    Object.values(elec).reduce((a,b)=>a+b,0) /
    Object.keys(elec).length;

  renderCalendar();
}

loadData();

async function loadData() {
  const res = await fetch("./dataclean.json");
  data = await res.json();

  buildOfficeSupplies();
  buildCleaningSupplies();

  let agua = {};
  let elec = {};

  data.forEach(i => {
    if (i.category === "water" && i.consumption !== "") {
      agua[i.date] = (agua[i.date] || 0) + parseFloat(i.consumption);
    }

    if (i.category === "pv_electricity" && i.consumption !== "") {
      elec[i.date] = (elec[i.date] || 0) + parseFloat(i.consumption);
    }
  });

  mediaAgua =
    Object.values(agua).reduce((a,b)=>a+b,0) /
    Object.keys(agua).length;

  mediaElec =
    Object.values(elec).reduce((a,b)=>a+b,0) /
    Object.keys(elec).length;

  dataLoaded = true; // 🔥 CLAVE

  renderCalendar();
}

/* =========================
   CALENDARIO
========================= */
function renderCalendar() {

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  let year = currentDate.getFullYear();
  let month = currentDate.getMonth();

  document.getElementById("monthLabel").textContent =
    currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });

  let first = new Date(year, month, 1);
  let startDay = (first.getDay() + 6) % 7;

  let daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= daysInMonth; d++) {

    let date = new Date(year, month, d);
    let key = formatKey(date);

    let div = document.createElement("div");
    div.className = "day";

    if (festivosSet.has(key)) {
      div.classList.add("festivo");
    }

    if (selectedDay === key) {
      div.classList.add("selected");
    }

    div.textContent = d;

    div.onclick = () => {
      selectedDay = key;
      renderCalendar(); // 🔥 refresca visual
      console.log("Seleccionado:", key);
    };

    grid.appendChild(div);
  }
}

/* =========================
   ESTACIONES
========================= */
function season(date) {
  let m = date.getMonth() + 1;
  if (m === 12 || m <= 2) return "winter";
  if (m <= 5) return "spring";
  if (m <= 8) return "summer";
  return "autumn";
}

function buildEstacionesLaborables(start, end) {

  let estacionesLab = { winter: 0, spring: 0, summer: 0, autumn: 0 };

  let c = new Date(start);

  while (c <= end) {

    let key = formatKey(c);
    let d = c.getDay();

    let est = season(c);

    let esLaborable = d !== 0 && d !== 6 && !festivosSet.has(key);

    if (esLaborable) {
      estacionesLab[est]++;
    }

    c.setDate(c.getDate() + 1);
  }

  return estacionesLab;
}

/* =========================
   LABORABLES
========================= */
function countWork(start, end) {
  let c = new Date(start);
  let count = 0;

  while (c <= end) {
    let key = formatKey(c);
    let d = c.getDay();

    if (d !== 0 && d !== 6 && !festivosSet.has(key)) {
      count++;
    }

    c.setDate(c.getDate() + 1);
  }

  return count;
}

/* =========================
   AGUA
========================= */
function calcularAgua() {

const start = new Date(document.getElementById("start").value + "T00:00:00");
const end = new Date(document.getElementById("end").value + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    document.getElementById("result").textContent =
      "Por favor, introduce fecha de inicio y fin.";
    return;
  }

  if (start > end) {
    document.getElementById("result").textContent =
      "La fecha de inicio no puede ser mayor que la de fin.";
    return;
  }

  let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  let work = countWork(start, end);

  let total = mediaAgua * days;
  let totalWork = mediaAgua * work;

  let out = "";

  out += `
Daily average: ${mediaAgua.toFixed(2)} L\n\n`;
  out += `Total days = ${days}\n`;
  out += `Total days: ${mediaAgua.toFixed(2)} × ${days} = ${total.toFixed(2)} L\n`;
  out += `
Total working days = ${work}\n`;
  out += `Total working days: ${mediaAgua.toFixed(2)} × ${work} = ${totalWork.toFixed(2)} L\n\n`;



globalData.water = totalWork;
  updateResultBox();

document.getElementById("result").textContent = out;

}

/* =========================
   ELECTRICIDAD
========================= */
function calcularElectricidad() {

  const start = new Date(document.getElementById("start").value + "T00:00:00");
  const end = new Date(document.getElementById("end").value + "T00:00:00");

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    document.getElementById("result").textContent =
      "Por favor, introduce fecha de inicio y fin.";
    return;
  }

  if (start > end) {
    document.getElementById("result").textContent =
      "La fecha de inicio no puede ser mayor que la de fin.";
    return;
  }

  const panel = parseFloat(document.getElementById("panels").value) || PANEL_BASE;
  const factorPanel = panel / PANEL_BASE;

  let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  let work = countWork(start, end);

  let base = mediaElec * factorPanel;

  let estaciones = { winter: 0, spring: 0, summer: 0, autumn: 0 };

  let c = new Date(start);
  while (c <= end) {
    estaciones[season(c)]++;
    c.setDate(c.getDate() + 1);
  }

  let factores = {
    winter: getFactor("winter"),
    spring: getFactor("spring"),
    summer: getFactor("summer"),
    autumn: getFactor("autumn")
  };

  let total = base * days;
  let totalWork = base * work;

let estacionesLab = buildEstacionesLaborables(start, end);

let totalEst = 0;
let totalEstWork = 0;

for (let k in estaciones) {

  let diasTotales = estaciones[k];
  let diasLab = estacionesLab[k];

  let valTotal = base * diasTotales * factores[k];
  let valLab = base * diasLab * factores[k];

  totalEst += valTotal;
  totalEstWork += valLab;
}

  let out = "";
  out += `
Daily average: ${base.toFixed(2)} kWh\n\n`;

  out +=`Total working days: ${work} × ${base.toFixed(2)}= ${totalWork.toFixed(2)} kWh\n\n`;
for (let k in estacionesLab) {
  let diasLab = estacionesLab[k];
  let factor = factores[k];

  let val = base * diasLab * factor;

  out += `${k.toUpperCase()}: ${diasLab} days × ${factor}\n`;
}

let totalEstLabReal = 0;

for (let k in estacionesLab) {
  totalEstLabReal += base * estacionesLab[k] * factores[k];
}

  out += `
TOTAL WORKING DAYS (season adjusted): ${totalEstWork.toFixed(2)} kWh\n\n`;


globalData.electricity = totalEstWork;
document.getElementById("result").textContent = out;
updateResultBox();

}


function calcularOffice() {

  const dates = getDatesOrError();
  if (!dates) return;

  const { start, end } = dates;

  const office = data.filter(d => d.category === "office_supply");

  let totalTrimestral = 0;

  let steps = "";

  office.forEach((item, index) => {

    const input = document.getElementById(`os_${index}`);
    if (!input) return;

    const qtyInput = parseFloat(input.value || 0);

    const baseQty = parseFloat(item.quantity || 0);
    const netImport = parseFloat(item.net_import || 0);

    if (baseQty === 0) return;

    const unit = netImport / baseQty;
    const unitIVA = unit * 1.21;
    const subtotal = unitIVA * qtyInput;

    totalTrimestral += subtotal;

    steps += `
${item.description} (${netImport.toFixed(2)} / ${baseQty}) x 1.21 x ${qtyInput} = ${subtotal.toFixed(2)} €`;
  });

  // 🔥 CAMBIO IMPORTANTE: TRIMESTRE = 90 días
  const daily = totalTrimestral / 90;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const result = daily * days;


  globalData.office = result;

  document.getElementById("result").textContent =
`${steps}

============================

QUARTER TOTAL (90 days): ${totalTrimestral.toFixed(2)} €
DAILY AVERAGE: ${daily.toFixed(2)} €

SELECTED DAYS: ${days}

FINAL RESULT: ${daily.toFixed(2)} × ${days} = ${result.toFixed(2)} €`;



updateResultBox();

}

function buildOfficeSupplies() {

  const container = document.getElementById("officeContainer");
  container.innerHTML = "";

  const office = data.filter(d => d.category === "office_supply");

  office.forEach((item, index) => {

    const div = document.createElement("div");
    div.className = "office-item";

    div.innerHTML = `
      <label title="${item.net_import}">
        ${item.description}
      </label>

      <input
        type="number"
        id="os_${index}"
        value="${item.quantity}"
        min="0"
      >
    `;

    container.appendChild(div);
  });
}


function buildCleaningSupplies() {

  const container = document.getElementById("cleaningContainer");
  container.innerHTML = "";

  const cleaning = data.filter(d => d.category === "cleaning_product");

  cleaning.forEach((item, index) => {

    const div = document.createElement("div");
    div.className = "cleaning-item";

    div.innerHTML = `
      <label title="${item.net_import}">
        ${item.description}
      </label>

      <input
        type="number"
        id="cs_${index}"
        value="${item.quantity}"
        min="0"
      >
    `;

    container.appendChild(div);
  });
}
function calcularCleaning() {

  const dates = getDatesOrError();
  if (!dates) return;

  const { start, end } = dates;

  const cleaning = data.filter(d => d.category === "cleaning_product");

  let totalTrimestral = 0;
  let steps = "";

  cleaning.forEach((item, index) => {

    const input = document.getElementById(`cs_${index}`);
    if (!input) return;

    const qtyInput = parseFloat(input.value || 0);

    const baseQty = parseFloat(item.quantity || 0);
    const netImport = parseFloat(item.net_import || 0);

    if (baseQty === 0) return;

    const unit = netImport / baseQty;
    const unitIVA = unit * 1.21;
    const subtotal = unitIVA * qtyInput;

    totalTrimestral += subtotal;

    steps += `
${item.description} (${netImport.toFixed(2)} / ${baseQty}) x 1.21 x ${qtyInput} = ${subtotal.toFixed(2)} €`;
  });

  const daily = totalTrimestral / 90;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const result = daily * days;

  document.getElementById("result").textContent =
`${steps}

============================

QUARTER TOTAL (90 days): ${totalTrimestral.toFixed(2)} €
DAILY AVERAGE : ${daily.toFixed(2)} €

SELECTED DAYS: ${days}

FINAL RESULT: ${daily.toFixed(2)} × ${days} = ${result.toFixed(2)} €`;

  globalData.cleaning = result;

updateResultBox();

}
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("calculateAllBtn");

  btn.addEventListener("click", () => {
    calculateAll();
  });
});

function calculateAll() {

  // 🔥 ejecutar todo usando TU sistema real
  handle("water");
  handle("elec");
  handle("office");
  handle("cleaning");

  // 🔥 forzar actualización de summary
  updateResultBox();

  // 🔥 abrir summary
  const summarySection = document.getElementById("summarySection");
  if (summarySection) {
    summarySection.classList.remove("hidden");
    summarySection.scrollIntoView({ behavior: "smooth" });
  }
}



document.getElementById("calculateAllBtn").addEventListener("click", () => {

  // 🔥 ejecuta todos los cálculos
  calculateWater();
  calculateElectricity();
  calculateOffice();
  calculateCleaning();

  // 🔥 abre summary directamente
  const summary = document.getElementById("summarySection");
  if (summary) {
    summary.classList.remove("hidden");
  }

  // 🔥 opcional: hacer scroll al resultado
  document.getElementById("summarySection")?.scrollIntoView({
    behavior: "smooth"
  });

});
function updateResultBox() {

  const summarySection = document.getElementById("summarySection");
  const summary = document.getElementById("summary");
  const btn = document.getElementById("openSavingBtn");

  if (!summarySection || !summary || !btn) return;

  const hasData =
    globalData.water > 0 ||
    globalData.electricity > 0 ||
    globalData.office > 0 ||
    globalData.cleaning > 0;

  if (!hasData) {
    summarySection.classList.add("hidden");
    summary.textContent = "";
    btn.classList.add("hidden");
    return;
  }

  // 👉 mostrar bloque
  summarySection.classList.remove("hidden");

  const totalMoney = globalData.office + globalData.cleaning;

  summary.textContent = `WATER: ${globalData.water.toFixed(2)} L
ELECTRICITY: ${globalData.electricity.toFixed(2)} kWh
OFFICE COSTS: ${globalData.office.toFixed(2)} €
CLEANING COSTS: ${globalData.cleaning.toFixed(2)} €

TOTAL MONEY: ${totalMoney.toFixed(2)} €
`;

  btn.classList.remove("hidden");
}


document.addEventListener("DOMContentLoaded", () => {
  const summarySection = document.getElementById("summarySection");
  const btn = document.getElementById("openSavingBtn");
  const summary = document.getElementById("summary");

  // 🔥 FORZAR estado inicial SIEMPRE oculto
  summarySection.classList.add("hidden");
  btn.classList.add("hidden");
  summary.textContent = "";
});



function resetAll() {

  // 🔥 reset datos internos
  globalData.water = 0;
  globalData.electricity = 0;
  globalData.office = 0;
  globalData.cleaning = 0;

  // =========================
  // 🧾 RESULTADOS EXE → A 0
  // =========================

  document.getElementById("result").textContent = "0";

  document.getElementById("summary").textContent = `
WATER: 0 L
ELECTRICITY: 0 kWh
OFFICE COSTS: 0 €
CLEANING COSTS: 0 €

TOTAL MONEY: 0 €
`;

  document.getElementById("savingResult").innerHTML = `
<strong>WITHOUT MEASURES (1 year):</strong><br>
Water: 0 L<br>
Electricity: 0 kWh<br>
Costs: 0 €<br><br>

<strong>OPTIMIZED (1 year):</strong><br>
Water: 0 L<br>
Electricity: 0 kWh<br>
Costs: 0 €<br><br>

<strong>SAVINGS (1 year):</strong><br>
Water: 0 L<br>
Electricity: 0 kWh<br>
Costs: 0 €<br><br>

<strong>TOTAL SAVINGS PERCENTAGE:</strong> 0%
`;

  // 🔥 cerrar panel de saving measures
  document.getElementById("savingPanel").classList.add("hidden");

  // 🔥 limpiar checks visuales
  document.querySelectorAll("#savingPanel input[type='checkbox']").forEach(c => {
    c.checked = false;
  });

  // 🔥 reset charts
  if (window.waterChart instanceof Chart) window.waterChart.destroy();
  if (window.elecChart instanceof Chart) window.elecChart.destroy();
  if (window.savingsChart instanceof Chart) window.savingsChart.destroy();

  document.getElementById("chartsWrapper").classList.add("hidden");

  console.log("RESET completo + panel cerrado ✔");
}

function toggleSavingPanel() {
  const panel = document.getElementById("savingPanel");
  panel.classList.toggle("hidden");

  const total = globalData.office + globalData.cleaning;


}
function resetAll() {

  // 🔥 reset datos globales
  globalData.water = 0;
  globalData.electricity = 0;
  globalData.office = 0;
  globalData.cleaning = 0;

  // 🔥 limpiar RESULTADOS.EXE
  const result = document.getElementById("result");
  result.textContent = "";
  result.classList.add("hidden");

  // 🔥 limpiar SUMMARY.EXE
  const summary = document.getElementById("summary");
  summary.textContent = "";

  const summarySection = document.getElementById("summarySection");
  summarySection.classList.add("hidden");

  document.getElementById("openSavingBtn").classList.add("hidden");

  // 🔥 cerrar saving panel
  const panel = document.getElementById("savingPanel");
  panel.classList.add("hidden");

  // 🔥 limpiar saving result
  document.getElementById("savingResult").innerHTML = "";

  // 🔥 cerrar charts
  document.getElementById("chartsWrapper").classList.add("hidden");

  if (window.waterChart) window.waterChart.destroy();
  if (window.elecChart) window.elecChart.destroy();
  if (window.savingsChart) window.savingsChart.destroy();

  // 🔥 actualizar UI
  updateResultBox();
}
function simulateSavings() {

  document.getElementById("chartsWrapper").classList.remove("hidden");

  const checks = document.querySelectorAll("#savingPanel input[type='checkbox']:checked");

  let elecRed = 0;
  let waterRed = 0;
  let matRed = 0;

  checks.forEach(c => {
    const type = c.value;
    const val = parseFloat(c.dataset.value);

    if (type === "elec") elecRed += val;
    if (type === "water") waterRed += val;
    if (type === "materials") matRed += val;
  });

  elecRed = Math.min(elecRed, 0.6);
  waterRed = Math.min(waterRed, 0.6);
  matRed = Math.min(matRed, 0.6);

  // =========================
  // 📅 AÑO FIJO REAL
  // =========================
  const start = new Date("2025-01-01T00:00:00");
  const end = new Date("2026-01-01T00:00:00");

  const workDays = countWork(start, end);
  const estacionesLab = buildEstacionesLaborables(start, end);

  // =========================
  // 💧 WATER (igual que tu sistema)
  // =========================
  const waterBase = mediaAgua * workDays;

  // =========================
  // ⚡ ELECTRICIDAD (igual que calcularElectricidad)
  // =========================
  const panel = parseFloat(document.getElementById("panels").value) || PANEL_BASE;
  const factorPanel = panel / PANEL_BASE;

  let baseElec = mediaElec * factorPanel;

  let factores = {
    winter: getFactor("winter"),
    spring: getFactor("spring"),
    summer: getFactor("summer"),
    autumn: getFactor("autumn")
  };

  let elecBase = 0;

  for (let k in estacionesLab) {
    elecBase += baseElec * estacionesLab[k] * factores[k];
  }

  // =========================
  // 💰 COSTES (ANUALIZAR DESDE LO QUE HA PUESTO EL USUARIO)
  // =========================
  const dates = getDatesOrError();
  if (!dates) return;

  const { start: userStart, end: userEnd } = dates;

  const userDays = Math.ceil((userEnd - userStart) / (1000 * 60 * 60 * 24)) + 1;

  const userTotalCost = globalData.office + globalData.cleaning;

  const dailyCost = userTotalCost / Math.max(1, userDays);

  const matBase = dailyCost * 365; // 🔥 AQUÍ LA CLAVE

  // =========================
  // 📉 OPTIMIZED
  // =========================
  const elecOpt = elecBase * (1 - elecRed);
  const waterOpt = waterBase * (1 - waterRed);
  const matOpt = matBase * (1 - matRed);

   const elecSavings = elecBase - elecOpt;
  const waterSavings = waterBase - waterOpt;
  const costSavings = matBase - matOpt;

  const totalBase = waterBase + elecBase + matBase;
const totalSaved = elecSavings + waterSavings + costSavings;

const totalSavingsPercent = totalBase > 0
  ? (totalSaved / totalBase) * 100
  : 0;


  document.getElementById("savingResult").innerHTML = `
<strong>WITHOUT MEASURES (1 year):</strong><br>
Water: ${waterBase.toFixed(2)} L<br>
Electricity: ${elecBase.toFixed(2)} kWh<br>
Costs: ${matBase.toFixed(2)} €<br><br>

<strong>OPTIMIZED (1 year):</strong><br>
Water: ${waterOpt.toFixed(2)} L<br>
Electricity: ${elecOpt.toFixed(2)} kWh<br>
Costs: ${matOpt.toFixed(2)} €<br><br>

<strong>SAVINGS (1 year):</strong><br>
Water: ${(waterBase - waterOpt).toFixed(2)} L<br>
Electricity: ${(elecBase - elecOpt).toFixed(2)} kWh<br>
Costs: ${(matBase - matOpt).toFixed(2)} €<br><br>

<strong>TOTAL SAVINGS PERCENTAGE:</strong> ${totalSavingsPercent.toFixed(2)}%
`;


  // =========================
  // 📊 CHARTS
  // =========================


if (window.elecChart instanceof Chart) window.elecChart.destroy();
if (window.savingsChart instanceof Chart) window.savingsChart.destroy();
if (window.waterChart instanceof Chart) window.waterChart.destroy();



Chart.defaults.font.family = "VT323, monospace";
Chart.defaults.font.size = 14;
Chart.defaults.color = "#1e2b2b";

requestAnimationFrame(() => {

  const canvases = ["savingsChartWater","savingsChartElec","savingsChart"];
  canvases.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.height = "260px";
      el.style.width = "100%";
    }
  });


    const ctxW = document.getElementById("savingsChartWater").getContext("2d");

    window.waterChart = new Chart(ctxW, {
      type: "line",
      data: {
        labels: ["Actual", "Year 1", "Year 2", "Year 3"],
        datasets: [{
          label: "Water savings (L)",
          data: [0, waterSavings, waterSavings * 2, waterSavings * 3],
          borderWidth: 2,
          borderColor: "#3498db",
          tension: 0.3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    const ctx1 = document.getElementById("savingsChartElec").getContext("2d");

    window.elecChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Actual", "Year 1", "Year 2", "Year 3"],
        datasets: [{
          label: "Electricity savings (kWh)",
          data: [0, elecSavings, elecSavings * 2, elecSavings * 3],
          borderWidth: 2,
          borderColor: "#ffd72f",
          tension: 0.3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    const ctx2 = document.getElementById("savingsChart").getContext("2d");

    window.savingsChart = new Chart(ctx2, {
      type: "line",
      data: {
        labels: ["Actual", "Year 1", "Year 2", "Year 3"],
        datasets: [{
          label: "Cost savings (€)",
          data: [0, costSavings, costSavings * 2, costSavings * 3],
          borderWidth: 2,
          borderColor: "orange",
          tension: 0.3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

});
}


async function loadDataTab() {

originalData = [...data]; // 👈 copia base

  const container = document.getElementById("dataContainer");
  if (!container) return;

  container.innerHTML = "";

  const grouped = {};

  data.forEach(item => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  categoryList = Object.keys(grouped);

  if (categoryList.length === 0) return;

  renderCategory(grouped);
}

function renderCategory(grouped) {

  const container = document.getElementById("dataContainer");
  container.innerHTML = "";

  categoryList.forEach(category => {

const rows = groupedCache[category] || grouped[category];
    if (!rows) return;

    const section = document.createElement("div");
    section.className = "data-section";

    // título
    const title = document.createElement("div");
    title.className = "data-title";
    title.innerHTML = `<span>${category.toUpperCase()}</span>`;
    section.appendChild(title);

    const table = document.createElement("table");
    table.className = "data-table";

    const columns = new Set();

    rows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (row[key] !== "" && row[key] !== null && row[key] !== undefined) {
          columns.add(key);
        }
      });
    });

    const cols = Array.from(columns);

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");

    cols.forEach(col => {

      const th = document.createElement("th");
      th.textContent = col.toUpperCase();

      th.onclick = () => {
        sortTable(category, col);
        loadDataTab();
      };

      trHead.appendChild(th);
    });

    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    rows.forEach(row => {
      const tr = document.createElement("tr");

      cols.forEach(col => {
        const td = document.createElement("td");
        td.textContent = row[col] ?? "";
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    section.appendChild(table);
    container.appendChild(section);
  });
}


function sortTable(category, column) {

  if (!sortState[category]) {
    sortState[category] = {};
  }
const current = sortState[category][column] || "asc";

const direction = current === "asc" ? "desc" : "asc";

sortState[category][column] = direction;


  // reset visual si no hay orden
  if (direction === "none") {
    groupedCache[category] = originalData.filter(d => d.category === category);
    loadDataTab();
    return;
  }

  const base = originalData.filter(d => d.category === category);

  const sorted = [...base].sort((a, b) => {

    const valA = String(a[column] ?? "").toLowerCase().trim();
    const valB = String(b[column] ?? "").toLowerCase().trim();

    return direction === "asc"
      ? valA.localeCompare(valB, "es")
      : valB.localeCompare(valA, "es");
  });

  groupedCache[category] = sorted;

  loadDataTab();
}

document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".main-menu a");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();

      const type = link.dataset.type; // elec / water / office / cleaning
      const tab = link.dataset.tab;   // data (si usas tabs)

      if (type) handle(type);
      if (tab) switchTab(tab);
    });
  });
});