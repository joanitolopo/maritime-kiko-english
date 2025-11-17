/*
 * Global Learning Timer (Versi Debug)
 *
 * File ini dimuat di base.html dan berjalan di semua halaman.
 * Ia akan otomatis mencari tombol dengan kelas '.continue-button'
 * dan melacak waktu yang dihabiskan di halaman tersebut, lalu
 * mengirimkannya ke server saat tombol diklik.
 */

// 1. Catat waktu mulai halaman ini dimuat
const pageLoadTime = Date.now();
console.log("[Learning Timer] Halaman dimuat, timer dimulai.");

// 2. Tunggu sampai seluruh halaman (termasuk konten) dimuat
document.addEventListener('DOMContentLoaded', (event) => {
    
    // 3. Cari tombol "Continue" berdasarkan kelasnya.
    const continueButton = document.querySelector('.continue-button');

    // 4. Jika tombolnya ada di halaman ini...
    if (continueButton) {
        
        console.log("[Learning Timer] Tombol .continue-button DITEMUKAN! Menambahkan listener...");
        
        // 5. Tambahkan 'event listener' untuk klik
        continueButton.addEventListener('click', function(clickEvent) {
            
            console.log("[Learning Timer] CLICK event terdeteksi!");

            // 6. Hentikan navigasi standar
            clickEvent.preventDefault();
            
            // 7. Hitung durasi
            const timeSpentMs = Date.now() - pageLoadTime;
            const timeSpentSeconds = Math.round(timeSpentMs / 1000);
            
            console.log(`[Learning Timer] Menghitung durasi: ${timeSpentSeconds} detik`);

            // 9. Dapatkan URL asli
            const originalUrl = clickEvent.currentTarget.href;
            
            // 10. Buat URL baru
            const separator = originalUrl.includes('?') ? '&' : '?';
            const newUrl = originalUrl + separator + 'duration_sec=' + timeSpentSeconds;

            console.log(`[Learning Timer] Mengarahkan ke URL: ${newUrl}`);

            // 11. Arahkan pengguna ke URL baru tersebut
            window.location.href = newUrl;
        });
    } else {
        console.log("[Learning Timer] Tidak ada tombol .continue-button di halaman ini.");
    }
});