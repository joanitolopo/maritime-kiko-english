document.addEventListener('DOMContentLoaded', function() {
    // === LOGIKA INDIKATOR SCROLL ===
    
    const indicator = document.getElementById('scroll-indicator');

    // 1. Cek dulu apakah elemen indikatornya ada
    if (indicator) {
        
        // 2. Cek apakah tinggi total dokumen lebih besar dari tinggi layar
        //    Artinya, halaman BISA di-scroll
        const isScrollable = document.documentElement.scrollHeight > window.innerHeight;

        if (isScrollable) {
            // 3. Jika bisa di-scroll, tampilkan indikatornya
            indicator.classList.add('visible');
        }

        // 4. Buat fungsi untuk menyembunyikan indikator
        const hideOnScroll = () => {
            // Cek apakah user sudah scroll lebih dari 50px
            if (window.scrollY > 50) { 
                indicator.classList.add('hidden');
                
                // 5. Hapus listener ini agar tidak memberatkan browser
                window.removeEventListener('scroll', hideOnScroll); 
            }
        };

        // 6. Pasang 'event listener' untuk mendeteksi scroll
        window.addEventListener('scroll', hideOnScroll);
    }

});