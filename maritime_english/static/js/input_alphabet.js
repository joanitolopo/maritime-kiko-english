// ========================================
// MODERN ALPHABET CHART JAVASCRIPT
// Interactive NATO Phonetic Alphabet
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔤 Alphabet Chart Initialized!');

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const audioBtn_sidebar = document.querySelector('.activity2-controls .audio-btn i');
    const translateBtn_sidebar = document.querySelector('.activity2-controls .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-activity2');

    // Alphabet Grid
    const letterBoxes = document.querySelectorAll('.letter-box');
    const searchInput = document.getElementById('search-input');

    // Progress Tracking
    const lettersPlayedEl = document.getElementById('letters-played');
    const progressBar = document.getElementById('progress-bar');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_letter = new Audio();

    const allAudios = [audio_sidebar, audio_letter];
    
    let currentPlayingLetter = null;
    let playedLetters = new Set();

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = `"Cadet, it's time to master our code words at sea! Shadow each code word you hear, let's hear you sound like a true mariner!"`;
    const translatedText_sidebar = `"Kadet, saatnya menguasai kata sandi kita di laut! Tiru setiap kata sandi yang kamu dengar, mari kita dengar kamu bersuara seperti pelaut sejati!"`;
    let isTranslated_sidebar = false;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/activity2_intro.wav';
    const natoAudioBasePath = '/static/data/audio/nato/';

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

        // Reset letter boxes
        if (currentPlayingLetter) {
            currentPlayingLetter.classList.remove('playing');
            currentPlayingLetter = null;
        }
    }

    function updateProgress() {
        const totalLetters = 26;
        const played = playedLetters.size;
        const percentage = (played / totalLetters) * 100;

        if (lettersPlayedEl) {
            // Animate number change
            animateNumber(lettersPlayedEl, parseInt(lettersPlayedEl.textContent), played);
        }

        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }

    function animateNumber(element, from, to) {
        const duration = 500;
        const steps = 20;
        const stepValue = (to - from) / steps;
        const stepDuration = duration / steps;
        let current = from;
        
        const timer = setInterval(() => {
            current += stepValue;
            if ((stepValue > 0 && current >= to) || (stepValue < 0 && current <= to)) {
                element.textContent = to;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, stepDuration);
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
    // ALPHABET GRID FUNCTIONALITY
    // ==================================================

    letterBoxes.forEach(box => {
        box.addEventListener('click', function() {
            const code = this.dataset.code;
            const letter = this.dataset.letter;
            
            if (!code) return;

            // Stop other audio
            stopAllAudio();

            // Play letter audio
            audio_letter.src = `${natoAudioBasePath}${code}.wav`;
            audio_letter.play()
                .then(() => {
                    this.classList.add('playing');
                    currentPlayingLetter = this;

                    // Track played letter
                    if (!playedLetters.has(letter)) {
                        playedLetters.add(letter);
                        updateProgress();
                    }
                })
                .catch(error => {
                    console.error('❌ Letter audio error:', error);
                    shakeElement(this);
                });

            audio_letter.onended = () => {
                this.classList.remove('playing');
                this.classList.add('played');
                currentPlayingLetter = null;
            };
        });

        // Hover sound effect
        box.addEventListener('mouseenter', function() {
            if (!this.classList.contains('playing')) {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            }
        });

        box.addEventListener('mouseleave', function() {
            if (!this.classList.contains('playing')) {
                this.style.transform = '';
            }
        });
    });

    // ==================================================
    // SEARCH FUNCTIONALITY
    // ==================================================

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();

            letterBoxes.forEach(box => {
                const letter = box.dataset.letter.toLowerCase();
                const code = box.querySelector('.letter-code').textContent.toLowerCase();

                if (searchTerm === '' || letter.includes(searchTerm) || code.includes(searchTerm)) {
                    box.classList.remove('hidden');
                    // Add entrance animation
                    box.style.animation = 'fadeInUp 0.3s ease';
                } else {
                    box.classList.add('hidden');
                }
            });
        });

        // Clear search on Escape
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                this.dispatchEvent(new Event('input'));
            }
        });
    }

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        // Don't trigger if typing in search box
        if (document.activeElement === searchInput) return;

        const key = e.key.toUpperCase();
        
        // Check if pressed key matches a letter
        letterBoxes.forEach(box => {
            if (box.dataset.letter === key) {
                box.click();
                box.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
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
    // AUTO-PLAY ALPHABET (OPTIONAL FEATURE)
    // ==================================================

    let autoPlayInterval = null;
    let autoPlayIndex = 0;

    function startAutoPlay() {
        if (autoPlayInterval) return;

        const boxes = Array.from(letterBoxes);
        autoPlayIndex = 0;

        autoPlayInterval = setInterval(() => {
            if (autoPlayIndex >= boxes.length) {
                stopAutoPlay();
                return;
            }

            boxes[autoPlayIndex].click();
            autoPlayIndex++;
        }, 2000); // 2 seconds between each letter
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
            autoPlayIndex = 0;
        }
    }

    // Add auto-play button (optional - can be triggered by special key)
    document.addEventListener('keydown', function(e) {
        // Press 'A' key while holding Shift to start auto-play
        if (e.shiftKey && e.key.toUpperCase() === 'P') {
            if (autoPlayInterval) {
                stopAutoPlay();
                console.log('⏹️ Auto-play stopped');
            } else {
                startAutoPlay();
                console.log('▶️ Auto-play started');
            }
        }
    });

    // ==================================================
    // SMOOTH INTERACTIONS
    // ==================================================

    // Continue button hover
    const continueBtn = document.querySelector('.btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        continueBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }

    // Captain avatar hover
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

    const animatedElements = document.querySelectorAll('.alphabet-card, .continue-wrapper');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(el);
    });

    // ==================================================
    // COMPLETION CELEBRATION
    // ==================================================

    function checkCompletion() {
        if (playedLetters.size === 26) {
            setTimeout(() => {
                showCompletionMessage();
            }, 500);
        }
    }

    function showCompletionMessage() {
        // Create confetti effect or celebration message
        console.log('🎉 Congratulations! You\'ve completed all 26 letters!');
        
        // You can add a modal or toast notification here
        if (progressBar) {
            progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
        }
    }

    // Check completion after each letter is played
    audio_letter.addEventListener('ended', () => {
        checkCompletion();
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ Alphabet Chart Ready!');
    console.log('💡 Tip: Press any letter key (A-Z) to hear its phonetic code');
    console.log('💡 Tip: Press Shift+P to auto-play all letters');
    console.log('💡 Tip: Use the search box to find specific letters');
    console.log('🎯 Progress:', playedLetters.size + '/26 letters');
});