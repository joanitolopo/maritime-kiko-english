document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Courses page initialized!');

    /**
     * Stagger-load animation for course cards
     * Ini akan membuat setiap card fade-in satu per satu
     */
    const cards = document.querySelectorAll('.unit-card.fade-in-up');

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
            // Ini yang menciptakan efek stagger (satu per satu)
            card.style.transitionDelay = `${index * 100}ms`;
            observer.observe(card);
        });
    }

    // Panggil fungsi-fungsi dari home.js jika ada
    // (Misalnya, jika Anda memindahkan fungsi header scroll ke file global)
    // Jika tidak, home.js yang di-load di HTML akan menanganinya.
});