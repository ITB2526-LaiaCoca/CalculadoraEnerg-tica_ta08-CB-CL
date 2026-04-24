let data = [];
let mediaAgua = 0;

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
  invierno: 1.20,
  primavera: 1.00,
  verano: 1.15,
  otoño: 1.05
};

async function loadData() {
  const res = await fetch("../dataclean.json");
  data = await res.json();
  calcular();
}

loadData();

/* =========================
   MEDIA BASE
========================= */
function calcular() {

  let agua = {};

  data.forEach(i => {

    if (i.category === "water" && i.consumption !== "") {
      agua[i.date] = (agua[i.date] || 0) + parseFloat(i.consumption);
    }
  });

  mediaAgua =
    Object.values(agua).reduce((a, b) => a + b, 0) /
    Object.keys(agua).length;

  let out = "";

  document.getElementById("output").textContent = out;
}


/* =========================
   FESTIVOS + LABORABLES
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
   CALCULADORA AGUA
========================= */
function calcularAgua() {

  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!start || !end) {
    document.getElementById("result").textContent =
      "Selecciona fechas.";
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const diffTime = endDate - startDate;
  const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let diasLaborables = contarLaborables(startDate, endDate);

  /* =========================
     ESTACIONES
  ========================= */
  let estaciones = {
    invierno: 0,
    primavera: 0,
    verano: 0,
    otoño: 0
  };

  let estacionesLaborables = {
    invierno: 0,
    primavera: 0,
    verano: 0,
    otoño: 0
  };

  let current = new Date(startDate);

  while (current <= endDate) {

    let est = obtenerEstacion(current);
    let day = current.getDay();

    let dateStr =
      String(current.getDate()).padStart(2, "0") + "-" +
      String(current.getMonth() + 1).padStart(2, "0");

    let esFestivo = festivos.includes(dateStr);

    estaciones[est]++;

    if (day !== 0 && day !== 6 && !esFestivo) {
      estacionesLaborables[est]++;
    }

    current.setDate(current.getDate() + 1);
  }

  /* =========================
     TOTALES
  ========================= */
  let total = mediaAgua * dias;
  let totalLaborables = mediaAgua * diasLaborables;

  let totalEstacional = 0;
  let totalEstacionalLaborables = 0;

  for (let est in estaciones) {

    let diasEst = estaciones[est];
    let factor = factoresEstacionales[est];

    totalEstacional += mediaAgua * diasEst * factor;
  }

  for (let est in estacionesLaborables) {

    let diasEst = estacionesLaborables[est];
    let factor = factoresEstacionales[est];

    totalEstacionalLaborables += mediaAgua * diasEst * factor;
  }

  /* =========================
     OUTPUT
  ========================= */
  let out = "";

  out += `Media diaria agua: ${mediaAgua.toFixed(2)} L\n\n`;

  out += `${start} → ${end}\n`;
  out += `Total días: ${dias}\n`;
  out += `Laborables (sin festivos): ${diasLaborables}\n\n`;

  out += `Todos los días: ${total.toFixed(2)} L\n`;
  out += `Solo laborables: ${totalLaborables.toFixed(2)} L\n\n`;

  out += "=== ESTACIONES ===\n";

  for (let est in estaciones) {
    out += `${est.toUpperCase()}: ${estaciones[est]} días × factor ${factoresEstacionales[est]}\n`;
  }

  out += `\nTOTAL ESTACIONAL: ${totalEstacional.toFixed(2)} L\n`;
  out += `TOTAL ESTACIONAL (laborables): ${totalEstacionalLaborables.toFixed(2)} L\n`;

  document.getElementById("result").textContent = out;
}