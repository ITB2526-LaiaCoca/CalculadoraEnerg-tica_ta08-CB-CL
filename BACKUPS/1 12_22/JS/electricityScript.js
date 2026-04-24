let data = [];
let mediaElec = 0;

/* =========================
   PANEL SOLAR CONFIG
========================= */
const PANEL_BASE = 136;
let paneles = PANEL_BASE;

/* =========================
   FESTIVOS ESPAÑA
========================= */
const festivos = [
  "01-01",
  "06-01",
  "01-05",
  "12-10",
  "01-11",
  "06-12",
  "08-12"
];

/* =========================
   FACTORES ESTACIONALES
========================= */
const factoresEstacionales = {
  invierno: 1.35,
  primavera: 1.00,
  verano: 1.20,
  otoño: 1.10
};

async function loadData() {
  const res = await fetch("../dataclean.json");
  data = await res.json();
  calcular();
}

function calcular() {

  let out = "";

  paneles = PANEL_BASE;
  let factorPaneles = paneles / PANEL_BASE;

  let elecByDay = {};

  data.forEach(i => {
    if (i.category === "pv_electricity" && i.consumption !== "") {
      elecByDay[i.date] = (elecByDay[i.date] || 0) + parseFloat(i.consumption);
    }
  });

  mediaElec =
    Object.values(elecByDay).reduce((a, b) => a + b, 0) /
    Object.keys(elecByDay).length;

  let mediaElecAjustada = mediaElec * factorPaneles;

  let semanas = 39;
  let diasLectivos = semanas * 5 - 12;

  out += "CONSUMO ELECTRICIDAD\n";
  out += `Media diaria: ${mediaElecAjustada.toFixed(2)} kWh\n\n`;

  out += "CURSO ESCOLAR AJUSTADO\n";
  out += `Días: ${diasLectivos}\n`;
  out += `Electricidad: ${(diasLectivos * mediaElecAjustada).toFixed(2)} kWh\n`;

  document.getElementById("output").textContent = out;
}


/* =========================
   CONTAR LABORABLES + FESTIVOS
========================= */
function contarLaborables(startDate, endDate) {

  let count = 0;
  let current = new Date(startDate);

  while (current <= endDate) {

    let day = current.getDay();

    let dateStr =
      String(current.getDate()).padStart(2, "0") + "-" +
      String(current.getMonth() + 1).padStart(2, "0");

    let esFestivo = festivos.includes(dateStr);

    if (day !== 0 && day !== 6 && !esFestivo) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}


/* =========================
   ESTACIONES
========================= */
function obtenerEstacion(fecha) {

  let mes = fecha.getMonth() + 1;

  if (mes === 12 || mes === 1 || mes === 2) return "invierno";
  if (mes >= 3 && mes <= 5) return "primavera";
  if (mes >= 6 && mes <= 8) return "verano";
  return "otoño";
}


/* =========================
   CÁLCULO POR FECHAS
========================= */
function calcularElectricidad() {

  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  const panelesInput = parseFloat(document.getElementById("panels").value) || PANEL_BASE;
  const factorPaneles = panelesInput / PANEL_BASE;

  if (!start || !end) {
    document.getElementById("result").textContent =
      "Selecciona fecha inicio y fin.";
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffTime = endDate - startDate;
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let diasLaborables = contarLaborables(startDate, endDate);

  let mediaElecAjustada = mediaElec * factorPaneles;

  /* =========================
     ESTACIONES POR DÍA
  ========================= */
  let estaciones = {
    invierno: 0,
    primavera: 0,
    verano: 0,
    otoño: 0
  };

  let current = new Date(startDate);

  while (current <= endDate) {

    let est = obtenerEstacion(current);
    estaciones[est]++;

    current.setDate(current.getDate() + 1);
  }

  /* =========================
     TOTALES
  ========================= */
  let totalPeriodo = mediaElecAjustada * dias;
  let totalLaborables = mediaElecAjustada * diasLaborables;

  let totalEstacional = 0;
  let totalEstacionalLaborables = 0;

  for (let est in estaciones) {

    let diasEst = estaciones[est];
    let factor = factoresEstacionales[est];

    totalEstacional += mediaElecAjustada * diasEst * factor;

    // SOLO laborables (aproximación proporcional)
    totalEstacionalLaborables +=
      (mediaElecAjustada * diasEst * factor) *
      (diasLaborables / dias);
  }

  /* =========================
     OUTPUT
  ========================= */
  let out = "";

  out += `Media diaria base: ${mediaElec.toFixed(2)} kWh\n`;
  out += `Paneles solares: ${panelesInput} / ${PANEL_BASE} = ${factorPaneles.toFixed(2)}\n`;
  out += `Media diaria ajustada: ${mediaElecAjustada.toFixed(2)} kWh\n\n`;

  out += "PASO 2: Días seleccionados\n";
  out += `${start} → ${end}\n`;
  out += `Total días = ${dias}\n`;
  out += `Días laborables (sin fines de semana ni festivos) = ${diasLaborables}\n\n`;

  out += "PASO 3: Cálculo total del periodo\n";
  out += `Todos los días: ${mediaElecAjustada.toFixed(2)} × ${dias} = ${totalPeriodo.toFixed(2)} kWh\n`;
  out += `Solo laborables: ${mediaElecAjustada.toFixed(2)} × ${diasLaborables} = ${totalLaborables.toFixed(2)} kWh\n\n`;

  out += "=== DESGLOSE ESTACIONAL ===\n";

  for (let est in estaciones) {
    out += `${est.toUpperCase()}: ${estaciones[est]} días × factor ${factoresEstacionales[est]}\n`;
  }

  out += `\nTOTAL AJUSTADO ESTACIONAL: ${totalEstacional.toFixed(2)} kWh\n`;
  out += `TOTAL AJUSTADO ESTACIONAL (laborables): ${totalEstacionalLaborables.toFixed(2)} kWh\n`;

  document.getElementById("result").textContent = out;
}

loadData();