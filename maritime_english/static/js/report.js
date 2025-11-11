document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Report page initialized!');

    /**
     * Stagger-load animation for report cards
     * Ini akan membuat setiap card fade-in satu per satu
     */
    const cards = document.querySelectorAll('.report-card.fade-in-up');

    if (cards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Tambahkan kelas .is-visible untuk memicu animasi CSS
                    entry.target.classList.add('is-visible');
                    // Hentikan pengamatan setelah animasi dipicu
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1 // Picu saat 10% card terlihat
        });

        cards.forEach((card, index) => {
            // Tambahkan delay yang berbeda untuk setiap card
            card.style.transitionDelay = `${index * 100}ms`;
            observer.observe(card);
        });
    }

    /**
     * Animate Donut Chart
     * Kita akan menganimasikan custom property '--value' yang kita set di CSS
     */
    const chart = document.querySelector('.summary-chart');
    if (chart) {
        // Ambil nilai target dari atribut aria-valuenow
        const targetValue = chart.getAttribute('aria-valuenow');
        
        // Set nilai setelah delay singkat agar animasi CSS (progress-anim) bisa berjalan
        setTimeout(() => {
            chart.style.setProperty('--progress-value', targetValue);

            // Animasikan teks angka di dalam chart
            const chartValueText = chart.querySelector('.chart-value');
            if (chartValueText) {
                let start = 0;
                const duration = 1000; // 1 detik
                const stepTime = 20; // update setiap 20ms
                const steps = duration / stepTime;
                const increment = targetValue / steps;

                const counter = setInterval(() => {
                    start += increment;
                    if (start >= targetValue) {
                        chartValueText.textContent = `${targetValue}%`;
                        clearInterval(counter);
                    } else {
                        chartValueText.textContent = `${Math.floor(start)}%`;
                    }
                }, stepTime);
            }
        }, 500); // Mulai setelah 0.5 detik
    }
});