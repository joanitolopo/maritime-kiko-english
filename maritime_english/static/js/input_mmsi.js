// ========================================
// MODERN MMSI PAGE JAVASCRIPT
// Ship Identity & Radio Communication
// (Refactored for multiple players)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚢 MMSI & Call Sign Page Initialized!');

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const audioBtn_sidebar = document.querySelector('.mmsi-controls .audio-btn i');
    const translateBtn_sidebar = document.querySelector('.mmsi-controls .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-mmsi');
    const instructionTexts = document.querySelectorAll('.instruction-text-mmsi p'); // Sekarang ada lebih dari satu

    // Radio Players (BARU: Menggunakan querySelectorAll)
    const playButtons = document.querySelectorAll('.play-example-btn');
    const allRadioCards = document.querySelectorAll('.radio-card');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_examples = []; // (BARU: Array untuk menampung audio player dinamis)
    
    let activeExampleAudio = null; // (BARU: Melacak audio yang sedang aktif)

    const allAudios = [audio_sidebar]; // (MODIFIKASI: Hanya berisi audio sidebar)
    
    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = "Cadet, every ship at sea has its own identity! We use a Call Sign — a special code made of letters and numbers — and an MMSI number — a digital ID for radio communication. Let's listen to how sailors use them when spelling names and sending messages!";
    const translatedText_sidebar = "Taruna, setiap kapal di laut memiliki identitasnya sendiri! Kami menggunakan Call Sign — kode khusus yang terdiri dari huruf dan angka — serta MMSI number — ID digital untuk komunikasi radio. Sekarang, mari dengarkan bagaimana para pelaut menggunakannya saat mengeja nama dan mengirim pesan!";

    const originalText_instruction = `Listen to the example of radio communication. Pay attention to how the Call Sign and MMSI are spelled and spoken. Then, repeat each one clearly in your own voice.`;
    const translatedText_instruction = `Dengarkan contoh komunikasi radio. Perhatikan bagaimana Call Sign dan MMSI dieja dan diucapkan. Lalu, ulangi masing-masing dengan jelas menggunakan suaramu sendiri.`;

    let isTranslated = false;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/mmsi_intro.wav';
    // (MODIFIKASI: audioPath_example sekarang ada di atribut data-audio-src HTML)

    // ==================================================
    // MAIN AUDIO CONTROL FUNCTIONS
    // ==================================================

    function stopAllAudio() {
        // (MODIFIKASI: Menggabungkan sidebar audio dan semua example audio)
        [...allAudios, ...audio_examples].forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        // Reset sidebar button
        if (audioBtn_sidebar) {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
        }

        // (MODIFIKASI: Reset semua play button)
        playButtons.forEach(btn => {
            btn.classList.remove('playing');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
            if (text) {
                // Teks kembali ke 'Play Example' atau 'Play Again' tergantung state sebelumnya
                if (text.textContent === 'Stop') {
                    text.textContent = 'Play Example';
                }
            }
        });

        // (MODIFIKASI: Reset status semua card)
        allRadioCards.forEach(card => {
            updateStatus('ready', card);
        });
        
        activeExampleAudio = null;
    }

    // (MODIFIKASI: Sekarang menerima elemen card sebagai parameter)
    function updateStatus(state, cardElement) {
        if (!cardElement) return;
        const statusDot = cardElement.querySelector('.status-dot');
        const statusText = cardElement.querySelector('.status-indicator span:last-child');
        
        if (!statusDot || !statusText) return;

        switch(state) {
            case 'ready':
                statusDot.style.background = '#10b981';
                statusText.textContent = 'Ready to Listen';
                break;
            case 'playing':
                statusDot.style.background = '#f59e0b';
                statusText.textContent = 'Playing';
                break;
            case 'completed':
                statusDot.style.background = '#10b981';
                statusText.textContent = 'Completed';
                break;
        }
    }

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================

    if (audioBtn_sidebar) {
        audioBtn_sidebar.parentElement.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                stopAllAudio(); // Ini akan menghentikan audio example jika sedang play
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        audioBtn_sidebar.classList.remove('fa-play');
                        audioBtn_sidebar.classList.add('fa-pause');
                        addPulseEffect(this);
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_sidebar.pause();
                audioBtn_sidebar.classList.remove('fa-pause');
                audioBtn_sidebar.classList.add('fa-play');
                removePulseEffect(this);
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
            removePulseEffect(audioBtn_sidebar.parentElement);
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            stopAllAudio();
            
            // Fade transition untuk sidebar
            fadeTransition(speechText_sidebar, () => {
                if (isTranslated) {
                    speechText_sidebar.textContent = originalText_sidebar;
                } else {
                    speechText_sidebar.textContent = translatedText_sidebar;
                }
            });

            // (MODIFIKASI: Update semua teks instruksi)
            instructionTexts.forEach(instructionText => {
                if(instructionText) {
                    fadeTransition(instructionText, () => {
                        if (isTranslated) {
                            instructionText.textContent = originalText_instruction;
                        } else {
                            instructionText.textContent = translatedText_instruction;
                        }
                    });
                }
            });

            isTranslated = !isTranslated; // Toggle status
            addClickEffect(this);
        });
    }

    // ==================================================
    // RADIO COMMUNICATION PLAYER (REFAKTORED)
    // ==================================================

    playButtons.forEach(button => {
        const audio = new Audio();
        audio_examples.push(audio); // Tambahkan ke daftar untuk dikelola
        const audioSrc = button.dataset.audioSrc;
        
        // (BARU: Cari elemen relatif terhadap tombol)
        const card = button.closest('.radio-card'); 
        const buttonIcon = button.querySelector('i');
        const buttonText = button.querySelector('span');

        button.addEventListener('click', function() {
            if (activeExampleAudio === audio) {
                // Audio ini sedang diputar, jadi hentikan
                audio.pause();
                audio.currentTime = 0;
                button.classList.remove('playing');
                
                if (buttonIcon) {
                    buttonIcon.classList.remove('fa-pause');
                    buttonIcon.classList.add('fa-play');
                }
                if (buttonText) {
                    buttonText.textContent = 'Play Example';
                }
                
                activeExampleAudio = null;
                updateStatus('ready', card);
            } else {
                // Audio lain (atau tidak ada) yang diputar. Hentikan semua dulu.
                stopAllAudio();
                
                // Mulai putar audio ini
                audio.src = audioSrc;
                audio.play()
                    .then(() => {
                        button.classList.add('playing');
                        
                        if (buttonIcon) {
                            buttonIcon.classList.remove('fa-play');
                            buttonIcon.classList.add('fa-pause');
                        }
                        if (buttonText) {
                            buttonText.textContent = 'Stop';
                        }
                        
                        activeExampleAudio = audio; // Set sebagai audio aktif
                        updateStatus('playing', card);
                        
                        // (MODIFIKASI: Kirim card ke fungsi animasi)
                        animateTranscript(card);
                    })
                    .catch(error => {
                        console.error('❌ Playback error:', error);
                        shakeElement(this);
                        updateStatus('ready', card); // Reset status card ini jika error
                    });
            }
        });

        audio.addEventListener('ended', () => {
            button.classList.remove('playing');
            
            if (buttonIcon) {
                buttonIcon.classList.remove('fa-pause');
                buttonIcon.classList.add('fa-play');
            }
            if (buttonText) {
                buttonText.textContent = 'Play Again';
            }
            
            activeExampleAudio = null;
            updateStatus('completed', card);
        });
    });

    // ==================================================
    // TRANSCRIPT ANIMATION
    // ==================================================

    // (MODIFIKASI: Menerima cardElement agar hanya menganimasi transcript di card yang benar)
    function animateTranscript(cardElement) {
        if (!cardElement) return;
        
        // (MODIFIKASI: Hanya mencari .transcript-line di dalam cardElement)
        const transcriptLines = cardElement.querySelectorAll('.transcript-line');
        
        transcriptLines.forEach((line, index) => {
            setTimeout(() => {
                line.style.opacity = '0.3';
                line.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    line.style.opacity = '1';
                    line.style.background = '#fef3c7';
                    
                    setTimeout(() => {
                        line.style.background = '#f9fafb';
                    }, 500);
                }, 100);
            }, index * 2000); // 2 seconds between each line
        });
    }

    // ==================================================
    // INFO CARD INTERACTIONS (REFAKTORED)
    // ==================================================

    const infoRows = document.querySelectorAll('.info-row');
    
    // Ini sudah benar karena menggunakan querySelectorAll
    infoRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
            this.style.transition = 'transform 0.3s ease';
        });

        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Copy to clipboard functionality (MODIFIKASI: Di-loop)
    const mmsiNumbers = document.querySelectorAll('.mmsi-number');
    const callSigns = document.querySelectorAll('.call-sign');

    mmsiNumbers.forEach(mmsiNumber => {
        mmsiNumber.style.cursor = 'pointer';
        mmsiNumber.title = 'Click to copy';
        
        mmsiNumber.addEventListener('click', function() {
            copyToClipboard(this.textContent);
            showCopyFeedback(this, 'MMSI copied!');
        });
    });

    callSigns.forEach(callSign => {
        callSign.style.cursor = 'pointer';
        callSign.title = 'Click to copy';
        
        callSign.addEventListener('click', function() {
            copyToClipboard(this.textContent);
            showCopyFeedback(this, 'Call sign copied!');
        });
    });

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            console.log('📋 Copied to clipboard:', text);
        }).catch(err => {
            console.error('❌ Failed to copy:', err);
        });
    }

    function showCopyFeedback(element, message) {
        const originalBg = element.style.background;
        element.style.background = '#10b981';
        element.style.color = '#fff';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.style.background = originalBg;
            element.style.color = '';
        }, 500);
    }

    // ==================================================
    // HELPER FUNCTIONS (Tidak berubah)
    // ==================================================

    function shakeElement(element) {
        if (!element) return;
        element.style.animation = 'shake 0.5s';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
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
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
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

    // ==================================================
    // SMOOTH INTERACTIONS (Tidak berubah)
    // ==================================================

    const continueBtn = document.querySelector('.continue-button');
    if (continueBtn) {
        continueBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        continueBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }

    const captainAvatar = document.querySelector('.captain-avatar');
    if (captainAvatar) {
        captainAvatar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainAvatar.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    // ==================================================
    // ENTRANCE ANIMATIONS (Tidak berubah)
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
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // (MODIFIKASI: .radio-card sekarang ada 2, animasi akan jalan berurutan)
        const animatedElements = document.querySelectorAll('.radio-card, .continue-wrapper');
        
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
            observer.observe(el);
        });
    }

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        // Space to play/pause
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            // (MODIFIKASI: Klik tombol pertama jika ada)
            if (playButtons.length > 0) playButtons[0].click();
        }
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ MMSI Page Ready! (Refactored for multiple players)');
    console.log('💡 Tip: Press Space to play/pause the first example');
    console.log('💡 Tip: Click on MMSI or Call Sign to copy');
    console.log('📻 Radio communication examples loaded');
});