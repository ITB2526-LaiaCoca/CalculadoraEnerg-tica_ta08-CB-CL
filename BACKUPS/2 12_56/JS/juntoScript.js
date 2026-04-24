let data = [];

let mediaAgua = 0;
let mediaElec = 0;

const PANEL_BASE = 136;

function addSemanaSanta(year, set) {

  // buscar último domingo de marzo
  let d = new Date(year, 2, 31); // 31 marzo
  while (d.getDay() !== 0) {
    d.setDate(d.getDate() - 1);
  }

  let end = new Date(year, 3, 7); // primera semana abril aprox

  while (d <= end) {

    let day = String(d.getDate()).padStart(2, "0");
    let month = String(d.getMonth() + 1).padStart(2, "0");

    set.add(`${day}-${month}`);

    d.setDate(d.getDate() + 1);
  }
}


/* =========================
   CALENDARIO
========================= */
let currentDate = new Date();
let selectedDay = null;
let festivosSet = new Set([
  "01-01","06-01","01-05","12-10",
  "01-11","06-12","08-12",

  // Navidad
  "22-12","23-12","24-12","25-12","26-12","27-12","28-12","29-12","30-12","31-12",
  "01-01","02-01","03-01","04-01","05-01","06-01","07-01",

  // Verano
  "25-06","26-06","27-06","28-06","29-06","30-06",
  "01-07","02-07","03-07","04-07","05-07","06-07","07-07","08-07","09-07","10-07","11-07","12-07","13-07","14-07","15-07","16-07","17-07","18-07","19-07","20-07","21-07","22-07","23-07","24-07","25-07","26-07","27-07","28-07","29-07","30-07","31-07",
  "01-08","02-08","03-08","04-08","05-08","06-08","07-08","08-08","09-08","10-08","11-08","12-08","13-08","14-08","15-08","16-08","17-08","18-08","19-08","20-08","21-08","22-08","23-08","24-08","25-08","26-08","27-08","28-08","29-08","30-08","31-08",
  "01-09"
]);

addSemanaSanta(2026, festivosSet);

/* =========================
   FACTORES ELECTRICIDAD
========================= */
function getFactor(prefix) {
  let ilum = parseFloat(document.getElementById(prefix + "_ilum")?.value) || 0;
  let heat = parseFloat(document.getElementById(prefix + "_heat")?.value) || 0;
  let ac = parseFloat(document.getElementById(prefix + "_ac")?.value) || 0;
  return 1 + ilum + heat + ac;
}

/* =========================
   CARGA DATOS
========================= */
async function loadData() {

  const res = await fetch("../dataclean.json");
  data = await res.json();

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
    grid.innerHTML += `<div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {

    let date = new Date(year, month, d);
    let key = format(date);

    let isFestivo = festivosSet.has(key);

    let div = document.createElement("div");
    div.className = "day" + (isFestivo ? " festivo" : "");

    div.textContent = d;

    div.onclick = () => {
      selectedDay = key;
      document.querySelectorAll(".day").forEach(x => x.classList.remove("selected"));
      div.classList.add("selected");
    };

    grid.appendChild(div);
  }

  syncFestivos();
}

function changeMonth(n) {
  currentDate.setMonth(currentDate.getMonth() + n);
  renderCalendar();
}

function format(d) {
  return String(d.getDate()).padStart(2,"0") + "-" +
         String(d.getMonth()+1).padStart(2,"0");
}

function toggleSelected() {
  if (!selectedDay) return;

  if (festivosSet.has(selectedDay)) {
    festivosSet.delete(selectedDay);
  } else {
    festivosSet.add(selectedDay);
  }

  renderCalendar();
}

function syncFestivos() {
  document.getElementById("festivos_input").value =
    Array.from(festivosSet).join(",");
}

/* =========================
   FESTIVOS CHECK
========================= */
function getFestivos() {
  return Array.from(festivosSet);
}

/* =========================
   UTIL
========================= */
function countWork(start, end) {

  let c = new Date(start);
  let count = 0;
  let festivos = getFestivos();

  while (c <= end) {

    let d = c.getDay();
    let ds = format(c);

    if (d !== 0 && d !== 6 && !festivos.includes(ds)) {
      count++;
    }

    c.setDate(c.getDate() + 1);
  }

  return count;
}

function season(date) {

  let m = date.getMonth() + 1;

  if (m === 12 || m <= 2) return "inv";
  if (m <= 5) return "pri";
  if (m <= 8) return "ver";
  return "oto";
}

/* =========================
   AGUA
========================= */
function calcularAgua() {

  const start = new Date(document.getElementById("start").value);
  const end = new Date(document.getElementById("end").value);

  let days = Math.ceil((end-start)/(1000*60*60*24)) + 1;
  let work = countWork(start,end);

  let total = mediaAgua * days;
  let totalWork = mediaAgua * work;

  document.getElementById("result").textContent =
`AGUA

Media diaria: ${mediaAgua.toFixed(2)} L

${start.toISOString().split("T")[0]} → ${end.toISOString().split("T")[0]}
Días: ${days}
Laborables: ${work}

Total: ${total.toFixed(2)} L
Laborables: ${totalWork.toFixed(2)} L`;
}

/* =========================
   ELECTRICIDAD
========================= */
function calcularElectricidad() {

  const start = new Date(document.getElementById("start").value);
  const end = new Date(document.getElementById("end").value);

  const panel = parseFloat(document.getElementById("panels").value) || PANEL_BASE;
  const factorPanel = panel / PANEL_BASE;

  let days = Math.ceil((end-start)/(1000*60*60*24)) + 1;
  let work = countWork(start,end);

  let base = mediaElec * factorPanel;

  let total = base * days;
  let totalWork = base * work;

  document.getElementById("result").textContent =
`ELECTRICIDAD

Media: ${mediaElec.toFixed(2)} kWh
Factor paneles: ${factorPanel.toFixed(2)}

${start.toISOString().split("T")[0]} → ${end.toISOString().split("T")[0]}
Días: ${days}
Laborables: ${work}

Total: ${total.toFixed(2)} kWh
Laborables: ${totalWork.toFixed(2)} kWh`;
}