let data = [];

let mediaAgua = 0;
let mediaElec = 0;

const PANEL_BASE = 136;

const festivos = [
  "01-01","06-01","01-05","12-10",
  "01-11","06-12","08-12",

  // 🎄 Navidad (aprox 22 dic → 7 ene)
  "22-12","23-12","24-12","25-12","26-12","27-12","28-12","29-12","30-12","31-12",
  "01-01","02-01","03-01","04-01","05-01","06-01","07-01",

  // ☀️ Verano (aprox 25 jun → 1 sep)
  "25-06","26-06","27-06","28-06","29-06","30-06",
  "01-07","02-07","03-07","04-07","05-07","06-07","07-07","08-07","09-07","10-07","11-07","12-07","13-07","14-07","15-07","16-07","17-07","18-07","19-07","20-07","21-07","22-07","23-07","24-07","25-07","26-07","27-07","28-07","29-07","30-07","31-07",
  "01-08","02-08","03-08","04-08","05-08","06-08","07-08","08-08","09-08","10-08","11-08","12-08","13-08","14-08","15-08","16-08","17-08","18-08","19-08","20-08","21-08","22-08","23-08","24-08","25-08","26-08","27-08","28-08","29-08","30-08","31-08",
  "01-09"
];

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
   LOAD DATA
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
}

loadData();

/* =========================
   UTIL
========================= */
function countWork(start, end) {

  let c = new Date(start);
  let count = 0;

  while (c <= end) {

    let d = c.getDay();

    let ds =
      String(c.getDate()).padStart(2,"0") + "-" +
      String(c.getMonth()+1).padStart(2,"0");

    if (d !== 0 && d !== 6 && !festivos.includes(ds)) {
      count++;
    }

    c.setDate(c.getDate()+1);
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
   💧 AGUA (DETALLADO SIN ESTACIONES)
========================= */
function calcularAgua() {

  const start = new Date(document.getElementById("start").value);
  const end = new Date(document.getElementById("end").value);

  let days = Math.ceil((end-start)/(1000*60*60*24)) + 1;
  let work = countWork(start,end);

  let total = mediaAgua * days;
  let totalWork = mediaAgua * work;

  let out = "";

  out += "💧 CONSUMO DE AGUA\n\n";

  out += `Media diaria base: ${mediaAgua.toFixed(2)} L\n\n`;

  out += "PASO 1: Periodo seleccionado\n";
  out += `${start.toISOString().split("T")[0]} → ${end.toISOString().split("T")[0]}\n`;
  out += `Total días = ${days}\n`;
  out += `Laborables (sin festivos) = ${work}\n\n`;

  out += "PASO 2: Cálculo total\n";
  out += `${mediaAgua.toFixed(2)} × ${days} = ${total.toFixed(2)} L\n`;
  out += `${mediaAgua.toFixed(2)} × ${work} = ${totalWork.toFixed(2)} L\n`;

  document.getElementById("result").textContent = out;
}

/* =========================
   ⚡ ELECTRICIDAD (DETALLADO COMPLETO)
========================= */
function calcularElectricidad() {

  const start = new Date(document.getElementById("start").value);
  const end = new Date(document.getElementById("end").value);

  const panel = parseFloat(document.getElementById("panels").value) || PANEL_BASE;
  const factorPanel = panel / PANEL_BASE;

  let days = Math.ceil((end-start)/(1000*60*60*24)) + 1;
  let work = countWork(start,end);

  let base = mediaElec * factorPanel;

  let seasons = {inv:0,pri:0,ver:0,oto:0};

  let c = new Date(start);

  while (c <= end) {
    seasons[season(c)]++;
    c.setDate(c.getDate()+1);
  }

  let factors = {
    inv: getFactor("inv"),
    pri: getFactor("pri"),
    ver: getFactor("ver"),
    oto: getFactor("oto")
  };

  let total = 0;
  let totalWork = 0;

  let out = "";

  out += "⚡ CONSUMO ELECTRICIDAD\n\n";

  out += `Media diaria base: ${mediaElec.toFixed(2)} kWh\n`;
  out += `Factor paneles: ${factorPanel.toFixed(2)}\n`;
  out += `Media ajustada: ${base.toFixed(2)} kWh\n\n`;

  out += "PASO 1: Periodo\n";
  out += `${start.toISOString().split("T")[0]} → ${end.toISOString().split("T")[0]}\n`;
  out += `Total días = ${days}\n`;
  out += `Laborables = ${work}\n\n`;

  out += "PASO 2: Estaciones\n";

  for (let s in seasons) {
    out += `${s.toUpperCase()}: ${seasons[s]} días × factor ${factors[s]}\n`;
  }

  for (let s in seasons) {

    let val = base * seasons[s] * factors[s];

    total += val;
    totalWork += val * (work/days);
  }

  out += "\nPASO 3: Resultados\n";
  out += `Todos los días: ${total.toFixed(2)} kWh\n`;
  out += `Solo laborables: ${totalWork.toFixed(2)} kWh\n`;

  document.getElementById("result").textContent = out;
}