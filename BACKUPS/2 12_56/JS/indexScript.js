let data = [];
let mediaElec = 0;

/* =========================
   PANEL SOLAR CONFIG
========================= */
const PANEL_BASE = 136;
let paneles = PANEL_BASE;

async function loadData() {
  const res = await fetch("dataclean.json");
  data = await res.json();
  calcular();
}

function calcular() {

  let out = "";

  // leer paneles desde input
paneles = PANEL_BASE;
  let factorPaneles = paneles / PANEL_BASE;

  let agua = {};
  let elec = {};
  let horas = [];

  data.forEach(i => {

    if (i.category === "water" && i.consumption !== "") {
      agua[i.date] = (agua[i.date] || 0) + parseFloat(i.consumption);
      if (i.hour !== "") horas.push(parseFloat(i.consumption));
    }

    if (i.category === "pv_electricity" && i.consumption !== "") {
      elec[i.date] = (elec[i.date] || 0) + parseFloat(i.consumption);
    }
  });

  let mediaAgua =
    Object.values(agua).reduce((a,b)=>a+b,0)
    / Object.keys(agua).length;

  mediaElec =
    Object.values(elec).reduce((a,b)=>a+b,0)
    / Object.keys(elec).length;

  let mediaHora =
    horas.reduce((a,b)=>a+b,0) / horas.length;

  let semanas = 39;
  let diasLectivos = semanas * 5 - 12;

  // =========================
  // AGUA
  // =========================
  let aguaText = "";
  for (let d in agua) aguaText += `${d}: ${agua[d]} L\n`;

  out += "CONSUMO DE AGUA\n";
  out += aguaText;
  out += `Media diaria: ${mediaAgua.toFixed(2)} L\n\n`;

  out += "MEDIA POR HORA AGUA\n";
  out += `Media: ${mediaHora.toFixed(2)} L/h\n\n`;

  out += "MEDIA SEMANAL AGUA\n";
  out += `5 días: ${(mediaAgua*5).toFixed(2)} L\n`;
  out += `7 días: ${(mediaAgua*7).toFixed(2)} L\n\n`;

  // =========================
  // ELECTRICIDAD (CON PANEL SOLAR)
  // =========================
  let mediaElecAjustada = mediaElec * factorPaneles;

  out += "CONSUMO ELECTRICIDAD\n";
  out += `Media diaria: ${mediaElecAjustada.toFixed(2)} kWh\n\n`;

  out += "MEDIA SEMANAL ELECTRICIDAD\n";
  out += `5 días: ${(mediaElecAjustada*5).toFixed(2)} kWh\n`;
  out += `7 días: ${(mediaElecAjustada*7).toFixed(2)} kWh\n\n`;

  out += "CURSO ESCOLAR AJUSTADO\n";
  out += `Días: ${diasLectivos}\n`;
  out += `Agua: ${(diasLectivos*mediaAgua).toFixed(2)} L\n`;
  out += `Electricidad: ${(diasLectivos*mediaElecAjustada).toFixed(2)} kWh\n`;

  // =========================
  // OFFICE + CLEANING
  // =========================
  let office = {};
  let clean = {};

  data.forEach(i => {

    let q = parseFloat(i.quantity || 0);
    let c = parseFloat(i.net_import || 0);

    if (i.category === "office_supply") {
      let p = i.description;
      if (!office[p]) office[p] = {qty:0,cost:0,count:0};
      office[p].qty += q;
      office[p].cost += c;
      office[p].count++;
    }

    if (i.category === "cleaning_product") {
      let p = i.description;
      if (!clean[p]) clean[p] = {qty:0,cost:0,count:0};
      clean[p].qty += q;
      clean[p].cost += c;
      clean[p].count++;
    }
  });

  out += "\nOFFICE SUPPLY (TRIMESTRE)\n";
  for (let p in office) {
    let d = office[p];
    let media = d.qty / d.count;

    out += `${p}\n`;
    out += `Media: ${media.toFixed(2)} | ${d.cost.toFixed(2)} €\n`;
    out += `Curso: ${(media*3).toFixed(2)} | ${(d.cost*3).toFixed(2)} €\n\n`;
  }

  out += "CLEANING PRODUCT (TRIMESTRE)\n";
  for (let p in clean) {
    let d = clean[p];
    let media = d.qty / d.count;

    out += `${p}\n`;
    out += `Media: ${media.toFixed(2)} | ${d.cost.toFixed(2)} €\n`;
    out += `Curso: ${(media*3).toFixed(2)} | ${(d.cost*3).toFixed(2)} €\n\n`;
  }

  document.getElementById("output").textContent = out;
}


loadData();