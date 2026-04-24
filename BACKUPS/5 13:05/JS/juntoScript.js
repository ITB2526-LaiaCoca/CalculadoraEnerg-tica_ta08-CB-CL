let data = [];

let mediaAgua = 0;
let mediaElec = 0;

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
      "La fecha de inicio no puede ser mayor que la de fin.";
    return null;
  }

  return { start, end };
}

const PANEL_BASE = 136;

function toggleSelected() {
  if (!selectedDay) {
    alert("Selecciona un día primero");
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
  const res = await fetch("../dataclean.json");
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

/* =========================
   CALENDARIO
========================= */
function renderCalendar() {

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  let year = currentDate.getFullYear();
  let month = currentDate.getMonth();

  document.getElementById("monthLabel").textContent =
    currentDate.toLocaleString("es", { month: "long", year: "numeric" });

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
  if (m === 12 || m <= 2) return "inv";
  if (m <= 5) return "pri";
  if (m <= 8) return "ver";
  return "oto";
}

function buildEstacionesLaborables(start, end) {

  let estacionesLab = { inv: 0, pri: 0, ver: 0, oto: 0 };

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

  out += `Media diaria base: ${mediaAgua.toFixed(2)} L\n\n`;
  out += `${formatDisplay(start)} → ${formatDisplay(end)}\n`;
  out += `Total días = ${days}\n`;
  out += `Laborables = ${work}\n\n`;
  out += `Todos los días: ${mediaAgua.toFixed(2)} × ${days} = ${total.toFixed(2)} L\n`;
  out += `Solo laborables: ${mediaAgua.toFixed(2)} × ${work} = ${totalWork.toFixed(2)} L\n`;

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

  let estaciones = { inv: 0, pri: 0, ver: 0, oto: 0 };

  let c = new Date(start);
  while (c <= end) {
    estaciones[season(c)]++;
    c.setDate(c.getDate() + 1);
  }

  let factores = {
    inv: getFactor("inv"),
    pri: getFactor("pri"),
    ver: getFactor("ver"),
    oto: getFactor("oto")
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

  out += `Media diaria base: ${mediaElec.toFixed(2)} kWh\n`;
  out += `Media ajustada: ${base.toFixed(2)} kWh\n\n`;

  out += `${formatDisplay(start)} → ${formatDisplay(end)}\n`;
  out += `Total días = ${days}\n`;
  out += `Laborables = ${work}\n\n`;

  out += `Todos los días: ${base.toFixed(2)} × ${days} = ${total.toFixed(2)} kWh\n`;
  out += `Solo laborables: ${base.toFixed(2)} × ${work} = ${totalWork.toFixed(2)} kWh\n\n`;

  out += `=== ESTACIONAL ===\n`;
  out += `INVIERNO: ${estaciones.inv} días × ${factores.inv}\n`;
  out += `PRIMAVERA: ${estaciones.pri} días × ${factores.pri}\n`;
  out += `VERANO: ${estaciones.ver} días × ${factores.ver}\n`;
  out += `OTOÑO: ${estaciones.oto} días × ${factores.oto}\n\n`;

  out += `TOTAL ESTACIONAL: ${totalEst.toFixed(2)} kWh\n`;

  out += `\n=== ESTACIONAL (LABORABLES) ===\n`;

for (let k in estacionesLab) {
  let diasLab = estacionesLab[k];
  let factor = factores[k];

  let val = base * diasLab * factor;

  out += `${k.toUpperCase()}: ${diasLab} días × ${factor}\n`;
}

let totalEstLabReal = 0;

for (let k in estacionesLab) {
  totalEstLabReal += base * estacionesLab[k] * factores[k];
}

  out += `TOTAL ESTACIONAL LABORABLES: ${totalEstWork.toFixed(2)} kWh\n`;

  document.getElementById("result").textContent = out;
}

/* =========================
   OFFICE SUPPLIES (NUEVO)
========================= */

let officeSum = 0;

data.forEach(i => {

  if (i.category === "office_supply") {

    let qty = parseFloat(i.quantity || 0);
    let net = parseFloat(i.net_import || 0);

    if (qty > 0) {

      let unit = net / qty;     // precio sin IVA
      let unitFinal = unit * 1.21;

      officeSum += unitFinal * qty;
    }
  }
});




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
${item.description}
(${netImport.toFixed(2)} / ${baseQty}) x 1.21 x ${qtyInput} = ${subtotal.toFixed(2)} €
----------------
`;
  });

  // 🔥 CAMBIO IMPORTANTE: TRIMESTRE = 90 días
  const daily = totalTrimestral / 90;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const result = daily * days;

  document.getElementById("result").textContent =
`${steps}

============================
TOTAL TRIMESTRE (90 días): ${totalTrimestral.toFixed(2)} €
MEDIA DIARIA: ${daily.toFixed(2)} €

DÍAS SELECCIONADOS: ${days}

RESULTADO FINAL: ${daily.toFixed(2)} × ${days} = ${result.toFixed(2)} €`;
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
${item.description}
(${netImport.toFixed(2)} / ${baseQty}) x 1.21 x ${qtyInput} = ${subtotal.toFixed(2)} €
----------------
`;
  });

  const daily = totalTrimestral / 90;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  const result = daily * days;

  document.getElementById("result").textContent =
`${steps}

============================
TOTAL TRIMESTRE (90 días): ${totalTrimestral.toFixed(2)} €
MEDIA DIARIA: ${daily.toFixed(2)} €

DÍAS SELECCIONADOS: ${days}

RESULTADO FINAL: ${daily.toFixed(2)} × ${days} = ${result.toFixed(2)} €`;
}
