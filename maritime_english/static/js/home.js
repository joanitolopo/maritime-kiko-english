document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard initialized!');

    // 1. DYNAMIC GREETING (VERSI BARU)
    const greetingElement = document.getElementById('greeting-time');
    
    if (greetingElement) {
        // Ambil data yang kita kirim dari server (HTML)
        const isNewUser = greetingElement.dataset.isNew; // Ini akan bernilai "true" atau "false"

        // Tentukan sapaan berdasarkan status user
        if (isNewUser === 'true') {
            greetingElement.textContent = 'Welcome aboard'; // Untuk user baru
        } else {
            greetingElement.textContent = 'Welcome back'; // Untuk user lama
        }
    }

    // 2. ANIMATE PROGRESS BARS (Tetap sama)
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const targetWidth = bar.getAttribute('data-target-width');
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 300);
    });

    // 3. HEADER SCROLL EFFECT (Tetap sama)
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

    // 4. INITIALIZE TOOLTIPS (Bootstrap 5) (Tetap sama)
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });


    // ==========================================================
    // ===== ⬇️ KODE JAVASCRIPT PETA BARU DIMASUKKAN KE SINI ⬇️ =====
    // ==========================================================

    console.log('🚀 Interactive Voyage Map initialized!');

    const ship = document.getElementById('userShip');
    const tooltip = document.getElementById('tooltip');
    const map = document.getElementById('voyageMap'); // Kontainer Peta
    const canvas = document.getElementById('voyageCanvas'); // Kanvas BARU
    const islands = document.querySelectorAll('.island'); // Semua pulau

    // Cek jika elemen peta ada sebelum menjalankan logikanya
    if (map && ship && islands.length > 0 && canvas) {
        
        const ctx = canvas.getContext('2d'); // Dapatkan konteks 2D kanvas

        /**
         * Fungsi utama untuk menggambar garis path
         */
        function drawVoyagePath() {
            // 1. Dapatkan ukuran kontainer peta (yang selalu berubah saat resize)
            const mapWidth = map.clientWidth;
            const mapHeight = map.clientHeight;

            // 2. Sesuaikan resolusi internal kanvas (penting untuk layar HiDPI/Retina)
            const scale = window.devicePixelRatio || 1;
            canvas.width = mapWidth * scale;
            canvas.height = mapHeight * scale;
            
            // 3. Terapkan skala ke konteks (agar gambar tidak blur)
            ctx.scale(scale, scale);

            // 4. Bersihkan kanvas sebelum menggambar ulang
            ctx.clearRect(0, 0, mapWidth, mapHeight);

            // 5. Kumpulkan semua titik tengah pulau (x, y)
            const points = [];
            // Kita urutkan berdasarkan data-unit agar selalu benar
            for (let i = 1; i <= islands.length; i++) {
                const island = document.getElementById(`unit${i}`);
                if (island) {
                    // Hitung titik tengah (x, y) pulau relatif terhadap kontainer peta
                    const x = island.offsetLeft + (island.offsetWidth / 2);
                    const y = island.offsetTop + (island.offsetHeight / 2);
                    points.push({ x, y });
                }
            }
            
            if (points.length < 2) return; // Butuh minimal 2 pulau

            // 6. Atur style garis (sama seperti CSS SVG Anda)
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 4;
            ctx.setLineDash([15, 10]);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            // 7. Mulai menggambar garis
            ctx.moveTo(points[0].x, points[0].y); // Pindah ke Unit 1

            // 8. Gambar kurva ke setiap pulau berikutnya
            for (let i = 0; i < points.length - 1; i++) {
                // Buat kurva 'S' yang mulus
                // Titik kontrol X: di tengah antara pulau
                // Titik kontrol Y: sama dengan Y pulau berikutnya (membuat lengkungan)
                const cp_x = (points[i].x + points[i+1].x) / 2;
                
                // Gunakan Bezier Curve untuk kontrol lengkungan yang lebih baik
                ctx.bezierCurveTo(
                    cp_x, points[i].y,   // Titik kontrol 1 (keluar dari pulau lama)
                    cp_x, points[i+1].y, // Titik kontrol 2 (masuk ke pulau baru)
                    points[i+1].x, points[i+1].y // Titik akhir (pulau baru)
                );
            }

            // 9. Tampilkan garisnya
            ctx.stroke();
        }

        // --- Panggil Fungsi ---
        
        // Panggil sekali saat halaman dimuat
        // Kita beri sedikit delay agar CSS layout (left/bottom %) selesai dihitung
        setTimeout(drawVoyagePath, 100); 

        // Panggil lagi setiap kali ukuran jendela diubah
        window.addEventListener('resize', drawVoyagePath);
        
        // Island click handler
        islands.forEach(island => {
            island.addEventListener('click', () => {
                const unitNum = parseInt(island.dataset.unit);
                const unitTitle = island.dataset.title;

                if (island.classList.contains('active')) {
                    // Navigate to unit
                    alert(`🚀 Starting ${unitTitle}!`);
                    // Nanti ganti dengan: window.location.href = '/learning/unit/' + unitNum;
                } else if (island.classList.contains('locked')) {
                    // Show locked message
                    const requiredUnit = unitNum - 1;
                    alert(`🔒 Complete Unit ${requiredUnit} to unlock this unit!`);
                } else if (island.classList.contains('goal')) {
                    alert('🏆 This is your final destination! Complete all units to reach here.');
                }
            });

            // Hover tooltip
            island.addEventListener('mouseenter', (e) => {
                const title = island.dataset.title;
                const unitNum = island.dataset.unit;
                let status = 'Locked';
                
                if (island.classList.contains('active')) {
                    status = 'In Progress';
                } else if (island.classList.contains('completed')) {
                    status = 'Completed';
                } else if (island.classList.contains('goal')) {
                    status = 'Final Goal';
                }

                tooltip.innerHTML = `<strong>Unit ${unitNum}:</strong> ${title}<br><small>${status}</small>`;
                tooltip.style.opacity = '1';
            });

            island.addEventListener('mousemove', (e) => {
                const rect = map.getBoundingClientRect();
                tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                tooltip.style.top = (e.clientY - rect.top - 30) + 'px';
            });

            island.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        });

        // Animate ship to current unit position
        function moveShipToUnit(unitElement) {
            const leftPercent = parseFloat(unitElement.style.left);
            const bottomPercent = parseFloat(unitElement.style.bottom);

            // Sesuaikan posisi kapal agar di sebelah pulau
            ship.style.left = (leftPercent - 4) + '%'; 
            ship.style.bottom = (bottomPercent + 3) + '%';
        }

        // Initial ship position (Mencari pulau .active yang diatur oleh Jinja2)
        const activeIsland = document.querySelector('.island.active');
        if (activeIsland) {
            setTimeout(() => moveShipToUnit(activeIsland), 500); // Delay 500ms untuk efek
        }

        // Add some interactivity - click anywhere on water to show ripple
        map.addEventListener('click', (e) => {
            if (e.target === map || e.target.classList.contains('ocean-layer') || e.target.classList.contains('wave')) {
                const ripple = document.createElement('div');
                ripple.style.cssText = `
                    position: absolute;
                    left: ${e.offsetX}px;
                    top: ${e.offsetY}px;
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.8);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 100;
                    animation: ripple-effect 1s ease-out forwards;
                `;
                map.appendChild(ripple);
                setTimeout(() => ripple.remove(), 1000);
            }
        });

        // Add ripple keyframes dynamically
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple-effect {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});