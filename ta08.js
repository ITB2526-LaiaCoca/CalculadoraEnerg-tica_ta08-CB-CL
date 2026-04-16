document.addEventListener('DOMContentLoaded', () => {

    // Intersection Observer para animaciones
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Scroll al simulador
    document.getElementById('launch-btn').addEventListener('click', () => {
        document.getElementById('calculator-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Función de cálculo (Lógica intacta)
    window.calculate = function() {
        const timeframe = parseFloat(document.getElementById('timeframe').value);
        const cpi = 1 + (parseFloat(document.getElementById('cpi').value) / 100 || 0);
        const elecSeason = document.getElementById('elec-season').value;
        const solarPanels = parseInt(document.getElementById('solar-panels').value) || 0;
        const waterMode = document.getElementById('water-season').value;
        const maintMod = parseFloat(document.getElementById('maintenance-level').value);

        // Variables base (Inventadas para el simulador)
        let baseWater = waterMode === 'high' ? 70 : 45;
        let baseElec = elecSeason === 'winter' ? 160 : (elecSeason === 'summer' ? 130 : 90);
        let solarSavings = solarPanels * 2.1;

        // Cálculos finales
        let totalWater = baseWater * timeframe * cpi;
        let totalElec = Math.max(0, (baseElec - solarSavings) * timeframe * cpi);
        let totalMat = 40 * maintMod * timeframe * cpi;
        let totalClean = 50 * maintMod * timeframe * cpi;
        let finalTotal = totalWater + totalElec + totalMat + totalClean;

        // Mostrar resultados
        const screen = document.getElementById('results-display');
        screen.style.display = 'block';

        // Animación de números
        countTo("res-water", totalWater);
        countTo("res-elec", totalElec);
        countTo("res-mat", totalMat);
        countTo("res-clean", totalClean);
        countTo("res-total", finalTotal);
    };

    function countTo(id, value) {
        const el = document.getElementById(id);
        let start = 0;
        const end = value;
        const duration = 1000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentVal = (progress * (end - start) + start).toFixed(2);
            el.innerHTML = $${Number(currentVal).toLocaleString()};
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
});