/* ========================================
   MODERN NOTICING JAVASCRIPT
   Interactive & Animated
======================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎙️ Modern Noticing Module Initialized!');

    // ==================================================
    // === 1. DEKLARASI ELEMEN ===
    // ==================================================

    // --- [DIKEMBALIKAN] Kontrol Popup ---
    const openBtn = document.getElementById('open-popup-btn');
    const closeBtn = document.getElementById('close-popup-btn');
    const popupOverlay = document.getElementById('learn-more-popup');

    // --- Kontrol Sidebar ---
    const audioBtn_sidebar = document.querySelector('.captain-instruction-card .audio-btn');
    const audioIcon_sidebar = audioBtn_sidebar ? audioBtn_sidebar.querySelector('i') : null;
    const translateBtn_sidebar = document.querySelector('.captain-instruction-card .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-noticing');
    
    // --- Kontrol Teks Instruksi ---
    const instructionText_activity = document.querySelector('.instruction-banner .instruction-text-noticing');

    // --- Efek Visual ---
    const radioWaves = document.querySelectorAll('.radio-waves span');
    const captainAvatar = document.querySelector('.captain-avatar');
    
    // --- Objek Audio ---
    const audio_sidebar = new Audio();
    const allAudios = [audio_sidebar]; // Hanya 1 audio di halaman ini
    
    let isTranslated = false;
    let currentPlayingAudio = null;

    // ==================================================
    // === 1.A. [DIKEMBALIKAN] LOGIKA POPUP ===
    // ==================================================
    if (openBtn && closeBtn && popupOverlay) {
        // Buka popup
        openBtn.addEventListener('click', () => {
            popupOverlay.style.display = 'flex';
        });
        
        // Tutup popup
        closeBtn.addEventListener('click', () => {
            popupOverlay.style.display = 'none';
        });

        // Tutup popup saat klik di luar area konten
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                popupOverlay.style.display = 'none';
            }
        });
    } else {
        console.warn('Elemen popup (open, close, overlay) tidak ditemukan.');
    }

    // ==================================================
    // === 2. KONTEN & PATH AUDIO (Dari JS Asli Anda) ===
    // ==================================================

    // Teks Sidebar
    const originalText_sidebar = `"Cadet, this time we'll study how radio messages are built! Every call at sea follows a clear order, 1) opening, 2) middle, and 3) closing. Let's read both sides and see how real sailors do it."`;
    const translatedText_sidebar = `"Kadet, kali ini kita akan mempelajari bagaimana pesan radio dibuat! Setiap panggilan di laut mengikuti urutan yang jelas, 1) pembukaan, 2) isi, dan 3) penutup. Mari kita baca kedua sisi dan lihat bagaimana pelaut sejati melakukannya."`;

    // Teks Instruksi
    const originalText_instruction = `"Read both messages carefully. Notice the structure of each radio exchange. Click Learn More to see the Captain's notes."`;
    const translatedText_instruction = `"Baca kedua pesan dengan saksama. Perhatikan struktur dari setiap pertukaran radio. Klik 'Learn More' untuk melihat catatan Kapten."`;

    // Path Audio
    const audioPath_sidebar = '/static/data/audio/unit1/noticing_intro.wav'; // Ganti dengan path audio Anda

    // ==================================================
    // === 3. FUNGSI KONTROL AUDIO (Dari Referensi) ===
    // ==================================================

    function stopAllAudio() {
        allAudios.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        if (audioIcon_sidebar) {
            audioIcon_sidebar.classList.remove('fa-pause');
            audioIcon_sidebar.classList.add('fa-play');
        }
        if (audioBtn_sidebar) {
             removePulseEffect(audioBtn_sidebar);
        }
        
        currentPlayingAudio = null;
    }

    // ==================================================
    // === 4. EVENT LISTENERS (Gabungan) ===
    // ==================================================

    // Cek jika semua elemen penting ada
    if (audioBtn_sidebar && translateBtn_sidebar && speechText_sidebar && instructionText_activity) {
        
        // --- Tombol Play Sidebar (Ditingkatkan) ---
        audioBtn_sidebar.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                stopAllAudio(); // Hentikan audio lain
                
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        audioIcon_sidebar.classList.remove('fa-play');
                        audioIcon_sidebar.classList.add('fa-pause');
                        addPulseEffect(this); // Efek dari referensi
                        animateRadioWaves();  // Efek dari referensi
                        currentPlayingAudio = audio_sidebar;
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this); // Efek dari referensi
                    });
            } else {
                audio_sidebar.pause();
                audioIcon_sidebar.classList.remove('fa-pause');
                audioIcon_sidebar.classList.add('fa-play');
                removePulseEffect(this);
            }
        });

        // --- Audio Sidebar Selesai ---
        audio_sidebar.addEventListener('ended', () => {
            audioIcon_sidebar.classList.remove('fa-pause');
            audioIcon_sidebar.classList.add('fa-play');
            removePulseEffect(audioBtn_sidebar);
            currentPlayingAudio = null;
        });

        // --- Tombol Terjemahan (Ditingkatkan) ---
        translateBtn_sidebar.addEventListener('click', function() {
            stopAllAudio(); // Hentikan audio saat menerjemahkan
            addClickEffect(this); // Efek dari referensi
            
            isTranslated = !isTranslated; // Toggle status
            
            // Terapkan teks baru
            const newSidebarText = isTranslated ? translatedText_sidebar : originalText_sidebar;
            const newInstructionText = isTranslated ? translatedText_instruction : originalText_instruction;

            // Gunakan transisi fade (dari referensi)
            fadeTransition(speechText_sidebar, () => {
                speechText_sidebar.textContent = newSidebarText;
            });
            
            fadeTransition(instructionText_activity, () => {
                instructionText_activity.textContent = newInstructionText;
            });
        });

    } else {
        console.warn('Beberapa elemen UI untuk Noticing (audio, translate, text) tidak ditemukan.');
    }

    // ==================================================
    // === 5. FUNGSI HELPER & EFEK (Dari Referensi) ===
    // ==================================================

    function shakeElement(element) {
        if (!element) return;
        element.style.animation = 'shake 0.5s';
        setTimeout(() => { element.style.animation = ''; }, 500);
    }

    function addPulseEffect(element) {
        if (!element) return;
        element.classList.add('playing');
    }

    function removePulseEffect(element) {
        if (!element) return;
        element.classList.remove('playing');
    }

    function addClickEffect(element) {
        if (!element) return;
        element.style.transform = 'scale(0.95)';
        setTimeout(() => { element.style.transform = ''; }, 150);
    }

    function fadeTransition(element, callback) {
        if (!element) return;
        element.style.opacity = '0.3';
        element.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            callback();
            element.style.opacity = '1';
        }, 300);
    }

    function animateRadioWaves() {
        if (!radioWaves || radioWaves.length === 0) return;
        radioWaves.forEach((wave, index) => {
            wave.style.animation = 'none';
            setTimeout(() => {
                wave.style.animation = `radioWave 2s ease-out infinite`;
                wave.style.animationDelay = `${index * 0.7}s`;
            }, 10);
        });
    }

    // ==================================================
    // === 6. INTERAKSI & ANIMASI HOVER (Dari Referensi) ===
    // ==================================================

    const continueBtn = document.querySelector('.btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('mouseenter', () => {
            continueBtn.style.transform = 'translateY(-3px)';
        });
        continueBtn.addEventListener('mouseleave', () => {
            continueBtn.style.transform = 'translateY(0)';
        });
    }

    if (captainAvatar) {
        captainAvatar.addEventListener('click', () => {
            if (audioBtn_sidebar) audioBtn_sidebar.click();
        });
    }

    // ==================================================
    // === 7. ANIMASI SCROLL-IN (Dari Referensi) ===
    // ==================================================

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.text);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const animatedElements = document.querySelectorAll(
        '.message-card, .instruction-banner, .continue-wrapper, .conversation-arrow, .learn-more-section'
    );
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // ==================================================
    // === 8. TIPS KEYBOARD (Dari Referensi) ===
    // ==================================================
    
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT') return; // Jangan jalankan jika sedang mengetik

        if (e.key.toLowerCase() === 't') {
            e.preventDefault();
            if (translateBtn_sidebar) translateBtn_sidebar.click();
        }
        if (e.key.toLowerCase() === 'c') {
            e.preventDefault();
            if (audioBtn_sidebar) audioBtn_sidebar.click();
        }
        // [BARU] 'L' untuk Learn More
        if (e.key.toLowerCase() === 'l') {
             e.preventDefault();
             if (openBtn) openBtn.click();
        }
        // [BARU] 'Escape' untuk menutup popup
        if (e.key === 'Escape') {
             e.preventDefault();
             if (closeBtn && popupOverlay.style.display === 'flex') {
                closeBtn.click();
             }
        }
    });

    console.log('✅ Modern Noticing Module Ready! (with Popup)');
    console.log('💡 Tips: Tekan C (Audio), T (Translate), L (Learn More), Escape (Close Popup).');
});