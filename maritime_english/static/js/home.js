document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard initialized!');

    // 1. DYNAMIC GREETING
    const greetingElement = document.getElementById('greeting-time');
    if (greetingElement) {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        greetingElement.textContent = greeting;
    }

    // 2. ANIMATE PROGRESS BARS
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const targetWidth = bar.getAttribute('data-target-width');
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 300);
    });

    // 3. HEADER SCROLL EFFECT
    const header = document.querySelector('.main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 4. INITIALIZE TOOLTIPS (Bootstrap 5)
    // Penting untuk peta baru agar info node muncul saat di-hover/tap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});