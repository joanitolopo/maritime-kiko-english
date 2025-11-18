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

    const popupTranslateBtn = document.getElementById('popup-translate-btn');
    const popupTitleText = document.querySelector('.popup-title-text');
    let isPopupTranslated = false;

    // --- Kontrol Sidebar ---
    const audioBtn_sidebar = document.querySelector('.captain-instruction-card .audio-btn');
    const audioIcon_sidebar = audioBtn_sidebar ? audioBtn_sidebar.querySelector('i') : null;
    const translateBtn_sidebar = document.querySelector('.captain-instruction-card .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-noticing');

    // Popup Content - English
    const popupContent_EN = {
        title: "Radio Message Structure & Function",
        sections: [
            {
                title: "Opening",
                desc: "Used by both caller and receiver to start the communication clearly.",
                caller: '"This is [Ship Name], Call Sign..., MMSI..."',
                receiver: '"[Ship Name], this is [Your Ship]."',
                function: "Identify yourself and the ship you are contacting."
            },
            {
                title: "Middle",
                desc: "The core part of the message – giving or confirming information.",
                caller: '"Calling Motor Vessel [Name]."',
                receiver: '"Receiving you loud and clear."',
                function: "Deliver or acknowledge the main content."
            },
            {
                title: "Closing",
                desc: "Marks the end of your turn in radio communication.",
                caller: '"Channel one-six. Over."',
                receiver: '"Over."',
                function: "End your turn and signal readiness for response."
            }
        ]
    };

    // Popup Content - Indonesian
    const popupContent_ID = {
        title: "Struktur & Fungsi Pesan Radio",
        sections: [
            {
                title: "Pembuka (Opening)",
                desc: "Dipakai oleh pemanggil maupun penerima untuk memulai komunikasi dengan jelas.",
                caller: '"This is [Nama Kapal], Call Sign …, MMSI …."',
                receiver: '"[Nama Kapal Pemanggil], this is [Nama Kapalmu]."',
                function: "Menyebutkan identitas kapal sendiri dan kapal yang dihubungi."
            },
            {
                title: "Inti Pesan (Middle)",
                desc: "Bagian utama pesan — menyampaikan atau mengonfirmasi informasi.",
                caller: '"Calling Motor Vessel [Nama]."',
                receiver: '"Receiving you loud and clear."',
                function: "Menyampaikan atau menegaskan isi pesan utama."
            },
            {
                title: "Penutup (Closing)",
                desc: "Menandai akhir giliran berbicara dalam komunikasi radio.",
                caller: '"Channel one-six. Over."',
                receiver: '"Over."',
                function: "Menutup giliran dan memberi sinyal siap menerima balasan."
            }
        ]
    };
    
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

        // Toggle terjemahan popup
        if (popupTranslateBtn) {
            popupTranslateBtn.addEventListener('click', function() {
                isPopupTranslated = !isPopupTranslated;
                const btnText = this.querySelector('span');
                
                if (isPopupTranslated) {
                    updatePopupContent(popupContent_ID);
                    if (btnText) btnText.textContent = 'EN';
                } else {
                    updatePopupContent(popupContent_EN);
                    if (btnText) btnText.textContent = 'ID';
                }
                
                addClickEffect(this);
            });
        }
    } else {
        console.warn('Elemen popup (open, close, overlay) tidak ditemukan.');
    }

    // ==================================================
    // === 2. KONTEN & PATH AUDIO (Dari JS Asli Anda) ===
    // ==================================================

    // Teks Sidebar
    const originalText_sidebar = "Cadet, this time we’ll study how radio messages are built! Every call at sea follows a clear order, opening, middle, and closing. Let’s read both sides and see how real sailors do it.";
    const translatedText_sidebar = "Taruna, kali ini kita akan mempelajari bagaimana pesan radio disusun! Setiap panggilan di laut mengikuti urutan yang jelas: pembuka, isi, dan penutup. Mari kita baca kedua sisi percakapan dan lihat bagaimana para pelaut melakukannya di dunia nyata!";

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


    function updatePopupContent(content) {
        if (popupTitleText) {
            popupTitleText.textContent = content.title;
        }
        
        const sectionTitles = document.querySelectorAll('.popup-section-title');
        const sectionDescs = document.querySelectorAll('.popup-section-desc');
        const sectionLists = document.querySelectorAll('.popup-section-list');
        
        content.sections.forEach((section, index) => {
            if (sectionTitles[index]) {
                sectionTitles[index].textContent = section.title;
            }
            if (sectionDescs[index]) {
                sectionDescs[index].textContent = section.desc;
            }
            if (sectionLists[index]) {
                const items = sectionLists[index].querySelectorAll('li');
                if (items[0]) items[0].innerHTML = `<strong>Caller:</strong> <span class="popup-example">${section.caller}</span>`;
                if (items[1]) items[1].innerHTML = `<strong>Receiver:</strong> <span class="popup-example">${section.receiver}</span>`;
                if (items[2]) items[2].innerHTML = `<strong>Function:</strong> <span class="popup-function">${section.function}</span>`;
            }
        });
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

    const continueBtn = document.querySelector('.continue-button');
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
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        // Di mobile, langsung tampilkan semua tanpa animasi scroll
        const animatedElements = document.querySelectorAll(
            '.continue-wrapper'
        );
        
        animatedElements.forEach((el) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    } else {
        // Di desktop, gunakan Intersection Observer seperti biasa
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
    }

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