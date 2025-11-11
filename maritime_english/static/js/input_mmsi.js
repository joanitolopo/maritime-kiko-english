// ========================================
// MODERN MMSI PAGE JAVASCRIPT
// Ship Identity & Radio Communication
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
    const instructionText = document.querySelector('.instruction-text-mmsi p');

    // Radio Player
    const playButton = document.getElementById('play-mmsi-example');
    const playButtonIcon = playButton ? playButton.querySelector('i') : null;
    const playButtonText = playButton ? playButton.querySelector('span') : null;
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-indicator span:last-child');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_example = new Audio();

    const allAudios = [audio_sidebar, audio_example];
    
    let isPlayingExample = false;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = `"Cadet, every ship at sea has its own identity! We use a Call Sign (a special code made of letters and numbers) and an MMSI number (a digital ID for radio communication). Let's listen to how sailors use them when spelling names and sending messages!"`;
    const translatedText_sidebar = `"Kadet, setiap kapal di laut punya identitas sendiri! Kita menggunakan Call Sign (kode khusus dari huruf dan angka) dan nomor MMSI (ID digital untuk komunikasi radio). Mari dengarkan bagaimana pelaut menggunakannya saat mengeja nama dan mengirim pesan!"`;

    const originalText_instruction = `Listen to the example of radio communication. Pay attention to how the Call Sign and MMSI are spelled and spoken. Then, repeat each one clearly in your own voice.`;
    const translatedText_instruction = `Dengarkan contoh komunikasi radio. Perhatikan bagaimana Call Sign dan MMSI dieja dan diucapkan. Lalu, ulangi masing-masing dengan jelas menggunakan suaramu sendiri.`;

    let isTranslated = false;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/mmsi_intro.wav';
    const audioPath_example = '/static/data/audio/unit1/mmsi_example.wav';

    // ==================================================
    // MAIN AUDIO CONTROL FUNCTIONS
    // ==================================================

    function stopAllAudio() {
        allAudios.forEach(audio => {
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

        // Reset play button
        if (playButton) {
            playButton.classList.remove('playing');
            if (playButtonIcon) {
                playButtonIcon.classList.remove('fa-pause');
                playButtonIcon.classList.add('fa-play');
            }
            if (playButtonText) {
                playButtonText.textContent = 'Play Example';
            }
        }

        isPlayingExample = false;
        updateStatus('ready');
    }

    function updateStatus(state) {
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
                stopAllAudio();
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
            
            // Fade transition for both texts
            fadeTransition(speechText_sidebar, () => {
                if (isTranslated) {
                    speechText_sidebar.textContent = originalText_sidebar;
                    if (instructionText) {
                        instructionText.textContent = originalText_instruction;
                    }
                    isTranslated = false;
                } else {
                    speechText_sidebar.textContent = translatedText_sidebar;
                    if (instructionText) {
                        instructionText.textContent = translatedText_instruction;
                    }
                    isTranslated = true;
                }
            });
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // RADIO COMMUNICATION PLAYER
    // ==================================================

    if (playButton) {
        playButton.addEventListener('click', function() {
            if (isPlayingExample) {
                // Stop playing
                audio_example.pause();
                audio_example.currentTime = 0;
                this.classList.remove('playing');
                
                if (playButtonIcon) {
                    playButtonIcon.classList.remove('fa-pause');
                    playButtonIcon.classList.add('fa-play');
                }
                if (playButtonText) {
                    playButtonText.textContent = 'Play Example';
                }
                
                isPlayingExample = false;
                updateStatus('ready');
            } else {
                // Start playing
                stopAllAudio();
                audio_example.src = audioPath_example;
                audio_example.play()
                    .then(() => {
                        this.classList.add('playing');
                        
                        if (playButtonIcon) {
                            playButtonIcon.classList.remove('fa-play');
                            playButtonIcon.classList.add('fa-pause');
                        }
                        if (playButtonText) {
                            playButtonText.textContent = 'Stop';
                        }
                        
                        isPlayingExample = true;
                        updateStatus('playing');
                        
                        // Animate transcript lines
                        animateTranscript();
                    })
                    .catch(error => {
                        console.error('❌ Playback error:', error);
                        shakeElement(this);
                    });
            }
        });

        audio_example.addEventListener('ended', () => {
            playButton.classList.remove('playing');
            
            if (playButtonIcon) {
                playButtonIcon.classList.remove('fa-pause');
                playButtonIcon.classList.add('fa-play');
            }
            if (playButtonText) {
                playButtonText.textContent = 'Play Again';
            }
            
            isPlayingExample = false;
            updateStatus('completed');
        });
    }

    // ==================================================
    // TRANSCRIPT ANIMATION
    // ==================================================

    function animateTranscript() {
        const transcriptLines = document.querySelectorAll('.transcript-line');
        
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
    // INFO CARD INTERACTIONS
    // ==================================================

    const infoRows = document.querySelectorAll('.info-row');
    
    infoRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
            this.style.transition = 'transform 0.3s ease';
        });

        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Copy to clipboard functionality
    const mmsiNumber = document.querySelector('.mmsi-number');
    const callSign = document.querySelector('.call-sign');

    if (mmsiNumber) {
        mmsiNumber.style.cursor = 'pointer';
        mmsiNumber.title = 'Click to copy';
        
        mmsiNumber.addEventListener('click', function() {
            copyToClipboard(this.textContent);
            showCopyFeedback(this, 'MMSI copied!');
        });
    }

    if (callSign) {
        callSign.style.cursor = 'pointer';
        callSign.title = 'Click to copy';
        
        callSign.addEventListener('click', function() {
            copyToClipboard(this.textContent);
            showCopyFeedback(this, 'Call sign copied!');
        });
    }

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

    const continueBtn = document.querySelector('.btn-continue');
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
    // ENTRANCE ANIMATIONS
    // ==================================================

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

    const animatedElements = document.querySelectorAll('.radio-card, .continue-wrapper');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(el);
    });

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        // Space to play/pause
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (playButton) playButton.click();
        }
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ MMSI Page Ready!');
    console.log('💡 Tip: Press Space to play/pause the example');
    console.log('💡 Tip: Click on MMSI or Call Sign to copy');
    console.log('📻 Radio communication example loaded');
});