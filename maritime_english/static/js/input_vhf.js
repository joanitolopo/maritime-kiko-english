// ========================================
// MODERN VHF EXCHANGE JAVASCRIPT
// Interactive Radio Communication Interface
// Versi 3.0 (Updated to match MMSI behavior)
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎙️ VHF Radio Exchange Initialized (v3.0)!');

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const audioBtn_sidebar = document.querySelector('.captain-instruction-card .audio-btn i');
    const translateBtn_sidebar = document.querySelector('.captain-instruction-card .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-vhf');

    // Message Controls
    const allPlayButtons = document.querySelectorAll('.play-message-btn');

    // Visual Effects
    const radioWaves = document.querySelectorAll('.radio-waves span');
    const exchangeArrows = document.querySelectorAll('.exchange-arrow i');
    const captainAvatar = document.querySelector('.captain-avatar');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_examples = []; // Array untuk menampung audio player dinamis
    
    let activeExampleAudio = null; // Melacak audio yang sedang aktif
    let activeButton = null; // Melacak tombol yang sedang aktif

    const allAudios = [audio_sidebar];

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = "Cadet, remember! Always start with your vessel's name, Call Sign, and MMSI before you speak on the radio. That's how real sailors make sure every message is clear and safe!";
    const translatedText_sidebar = "Taruna, ingat! Selalu sebutkan nama kapalmu, Call Sign, dan MMSI sebelum berbicara di radio. Itulah cara pelaut sejati memastikan setiap pesan terdengar jelas dan aman!";
    let isTranslated_sidebar = false;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/vhf_intro.wav';

    // ==================================================
    // MAIN AUDIO CONTROL FUNCTIONS
    // ==================================================

    function stopAllAudio() {
        [...allAudios, ...audio_examples].forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        // Reset tombol sidebar
        if (audioBtn_sidebar) {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
            removePulseEffect(audioBtn_sidebar.parentElement);
        }

        // Reset semua tombol play di main content
        allPlayButtons.forEach(btn => {
            btn.classList.remove('playing');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
            if (text) {
                if (text.textContent === 'Stop') {
                    text.textContent = 'Play';
                }
            }
        });

        // Hapus highlight dari semua message box
        document.querySelectorAll('.message-box.highlighted').forEach(box => {
            box.classList.remove('highlighted');
        });

        activeExampleAudio = null;
        activeButton = null;
    }

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================

    if (audioBtn_sidebar) {
        audioBtn_sidebar.parentElement.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                stopAllAudio();
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        audioBtn_sidebar.classList.remove('fa-play');
                        audioBtn_sidebar.classList.add('fa-pause');
                        addPulseEffect(this);
                        animateRadioWaves();
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

            fadeTransition(speechText_sidebar, () => {
                if (isTranslated_sidebar) {
                    speechText_sidebar.textContent = originalText_sidebar;
                    isTranslated_sidebar = false;
                } else {
                    speechText_sidebar.textContent = translatedText_sidebar;
                    isTranslated_sidebar = true;
                }
            });

            addClickEffect(this);
        });
    }

    // ==================================================
    // EXAMPLE MESSAGE CONTROLS (Updated to match MMSI)
    // ==================================================

    allPlayButtons.forEach(button => {
        const audio = new Audio();
        audio_examples.push(audio);
        const audioName = button.dataset.audio;
        const audioPath = `/static/data/audio/unit1/${audioName}.wav`;
        
        const messageBox = button.previousElementSibling;
        const buttonIcon = button.querySelector('i');
        
        // Tambahkan span untuk teks jika belum ada
        let buttonText = button.querySelector('span');
        if (!buttonText) {
            buttonText = document.createElement('span');
            buttonText.textContent = 'Play';
            button.appendChild(buttonText);
        }

        button.addEventListener('click', function() {
            if (activeExampleAudio === audio && !audio.paused) {
                // Audio ini sedang diputar, jadi hentikan
                audio.pause();
                audio.currentTime = 0;
                button.classList.remove('playing');
                
                if (buttonIcon) {
                    buttonIcon.classList.remove('fa-pause');
                    buttonIcon.classList.add('fa-play');
                }
                if (buttonText) {
                    buttonText.textContent = 'Play';
                }
                if (messageBox) {
                    messageBox.classList.remove('highlighted');
                }
                
                activeExampleAudio = null;
                activeButton = null;
            } else {
                // Audio lain (atau tidak ada) yang diputar. Hentikan semua dulu.
                stopAllAudio();
                
                // Mulai putar audio ini
                audio.src = audioPath;
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
                        if (messageBox) {
                            messageBox.classList.add('highlighted');
                            messageBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        
                        activeExampleAudio = audio;
                        activeButton = button;
                        animateRadioWaves();
                    })
                    .catch(error => {
                        console.error(`❌ Error playing ${audioPath}:`, error);
                        shakeElement(button);
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
            if (messageBox) {
                messageBox.classList.remove('highlighted');
            }
            
            activeExampleAudio = null;
            activeButton = null;
        });
    });

    // ==================================================
    // VISUAL EFFECTS & ANIMATIONS
    // ==================================================

    function animateRadioWaves() {
        if (radioWaves.length > 0) {
            radioWaves.forEach((wave, index) => {
                wave.style.animation = 'none';
                setTimeout(() => {
                    wave.style.animation = `radioWave 2s ease-out infinite`;
                    wave.style.animationDelay = `${index * 0.7}s`;
                }, 10);
            });
        }

        if (exchangeArrows.length > 0) {
            exchangeArrows.forEach(arrow => {
                arrow.style.animation = 'none';
                setTimeout(() => {
                    arrow.style.animation = 'arrowPulse 2s ease infinite';
                }, 10);
            });
        }
    }

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // T for translate
        if (e.key.toLowerCase() === 't') {
            e.preventDefault();
            if (translateBtn_sidebar) translateBtn_sidebar.click();
        }

        // C for captain audio
        if (e.key.toLowerCase() === 'c') {
            e.preventDefault();
            if (audioBtn_sidebar) audioBtn_sidebar.parentElement.click();
        }

        // Space to play/pause first example
        if (e.code === 'Space') {
            e.preventDefault();
            if (allPlayButtons.length > 0) allPlayButtons[0].click();
        }
    });

    // ==================================================
    // HELPER FUNCTIONS
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
    // SMOOTH INTERACTIONS
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

    if (captainAvatar) {
        captainAvatar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainAvatar.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    // Message boxes hover
    const messageBoxes = document.querySelectorAll('.message-box');
    messageBoxes.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('highlighted')) {
                this.style.transform = 'scale(1.01)';
                this.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('highlighted')) {
                this.style.transform = '';
            }
        });
    });

    // ==================================================
    // ENTRANCE ANIMATIONS
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

        const animatedElements = document.querySelectorAll(
            '.activity-badge, .captain-instruction-card, .instruction-banner, .example-container, .continue-wrapper'
        );

        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(el);
        });
    }

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ VHF Radio Exchange Ready!');
    console.log('💡 Tip: Press T to translate captain\'s instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('💡 Tip: Press Space to play/pause the first example');
    console.log('🎯 Master VHF radio protocol for safe maritime communication!');
});