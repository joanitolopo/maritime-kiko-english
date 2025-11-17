document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Auth pages (Login/Register) initialized!');

    // --- BARU: Logika Animasi Fade-in untuk SEMUA kartu auth ---
    const authCards = document.querySelectorAll('.fade-in-up');
    if (authCards.length > 0) {
        // Gunakan Intersection Observer jika ada (lebih modern)
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            authCards.forEach(card => {
                observer.observe(card);
            });
        } else {
            // Fallback jika Observer tidak didukung
            authCards.forEach(card => {
                card.classList.add('is-visible');
            });
        }
    }

    // --- Logika Toggle (Hanya akan berjalan di halaman Login) ---
    const loginContainer = document.getElementById('login-container');
    const forgotContainer = document.getElementById('forgot-password-container');
    
    const showForgotLink = document.getElementById('show-forgot-box');
    const showLoginLink = document.getElementById('show-login-box');
    
    const transitionTime = 300; // 300ms (harus sama dengan CSS transition)

    // Fungsi untuk beralih form dengan animasi fade
    function toggleForms(show, hide) {
        // Hanya berjalan jika kedua elemen ada (di halaman login)
        if (!show || !hide) return;

        // 1. Mulai fade-out form yang disembunyikan
        hide.classList.add('fading-out');

        // 2. Setelah animasi fade-out selesai
        setTimeout(() => {
            // 3. Sembunyikan total
            hide.style.display = 'none';
            hide.classList.remove('fading-out');

            // 4. Tampilkan form baru (masih transparan)
            show.style.opacity = '0';
            show.style.display = 'block';
            show.classList.remove('hidden');

            // 5. Trigger fade-in
            setTimeout(() => {
                show.style.opacity = '1';
            }, 20); // Delay singkat

        }, transitionTime);
    }

    // Event Listener untuk "Forgot Password?"
    if (showForgotLink) {
        showForgotLink.addEventListener('click', function(e) {
            e.preventDefault(); 
            toggleForms(forgotContainer, loginContainer);
        });
    }

    // Event Listener untuk "Back to Log In"
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault(); 
            toggleForms(loginContainer, forgotContainer);
        });
    }

    // --- BARU: Logika untuk Modal Registrasi ---
    const registerForm = document.getElementById('register-form');
    const openModalBtnSm = document.getElementById('open-modal-btn-sm');
    const openModalBtnLg = document.getElementById('open-modal-btn-lg');
    const registerModalEl = document.getElementById('registerDetailModal');

    // Pastikan kita berada di halaman register
    if (registerForm && openModalBtnSm && openModalBtnLg && registerModalEl) {
        
        // Buat instance modal Bootstrap
        const registerModal = new bootstrap.Modal(registerModalEl);
 
        // Fungsi untuk menangani klik tombol "Create My Account"
        const handleOpenModalClick = (event) => {
            event.preventDefault(); // Hentikan aksi default

            // 1. Validasi form utama (Nama, Email, Password)
            if (!registerForm.checkValidity()) {
                // 2. Jika tidak valid, tampilkan pesan error bawaan browser
                registerForm.reportValidity();
            } else {
                // 3. Jika valid, tampilkan modal
                registerModal.show();
            }
        };

        // Terapkan listener ke kedua tombol (mobile dan desktop)
        openModalBtnSm.addEventListener('click', handleOpenModalClick);
        openModalBtnLg.addEventListener('click', handleOpenModalClick);
    }
});