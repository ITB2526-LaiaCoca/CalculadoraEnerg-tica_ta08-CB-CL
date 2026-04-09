//Cargar los datos (JSON)
fetch("dataclean.json")
  .then(response => response.json())
  .then(data => {
    runCalculator(data);
  });


function runCalculator(data) {
  //Funciones base (filtrar)
  function filterByCategory(data, category) {
    return data.filter(item => item.category === category);
  }

  function filterByDateRange(data, start, end) {
    return data.filter(item => {
      const d = new Date(item.date);
      return d >= new Date(start) && d <= new Date(end);
    });
  }


  //Funciones de cálculo
  function totalConsumption(data) {
    return data.reduce((sum, item) => {
      return sum + (parseFloat(item.consumption) || 0);
    }, 0);
  }

  function totalQuantity(data) {
    return data.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0);
    }, 0);
  }

  function predictionNextYear(data) {
    const total = totalConsumption(data);
    const days = new Set(data.map(d => d.date).filter(Boolean)).size;
    const avgPerDay = total / days;
    return avgPerDay * 365;
  }


  //LOS 8 RESULTADOS

  const electricity = filterByCategory(data, "pv_electricity");
  // próximo año
  const nextYearElectricity = predictionNextYear(electricity);
  // septiembre - junio
  const elecPeriod = filterByDateRange(electricity, "2024-09-01", "2025-06-30");
  const totalElecPeriod = totalConsumption(elecPeriod);

  const water = filterByCategory(data, "water");
  // próximo año
  const nextYearWater = predictionNextYear(water);
  // periodo
  const waterPeriod = filterByDateRange(water, "2024-09-01", "2025-06-30");
  const totalWaterPeriod = totalConsumption(waterPeriod);

  const office = filterByCategory(data, "office_supply");
  // próximo año
  function predictionNextYearQuantity(data) {
    const months = new Set(data.map(d => d.date.slice(0,7))).size;
    const total = totalQuantity(data);
    const avgPerMonth = total / months;
    return avgPerMonth * 12;
  }
  // periodo
  const officePeriod = filterByDateRange(office, "2024-09-01", "2025-06-30");
  const totalOfficePeriod = totalQuantity(officePeriod);

  const cleaning = filterByCategory(data, "cleaning_product");
  // próximo año
  const nextYearCleaning = totalQuantity(cleaning) * 12;
  // periodo
  const cleaningPeriod = filterByDateRange(cleaning, "2024-09-01", "2025-06-30");
  const totalCleaningPeriod = totalQuantity(cleaningPeriod);


  //Mostrar resultados
  console.log("Electricidad próximo año:", nextYearElectricity);
  console.log("Electricidad periodo:", totalElecPeriod);

  console.log("Agua próximo año:", nextYearWater);
  console.log("Agua periodo:", totalWaterPeriod);

  console.log("Oficina próximo año:", nextYearOffice);
  console.log("Oficina periodo:", totalOfficePeriod);

  console.log("Limpieza próximo año:", nextYearCleaning);
  console.log("Limpieza periodo:", totalCleaningPeriod);
}

