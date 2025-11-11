document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Welcome page initialized!');

    /**
     * Stagger-load animation for hero content
     * Menerapkan kelas 'is-visible' dengan delay berbeda.
     */
    const animatedElements = document.querySelectorAll('.fade-in-up');

    if (animatedElements.length > 0) {
        animatedElements.forEach(el => {
            // Ambil delay dari 'data-delay' atau set default 0
            const delay = el.dataset.delay || 0;
            
            setTimeout(() => {
                el.classList.add('is-visible');
            }, parseInt(delay)); // Pastikan delay adalah angka
        });
    }
});