// ========================================
// MODERN NUMBERS CHART JAVASCRIPT
// Interactive NATO Numbers 0-9
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🔢 Numbers Chart Initialized!');

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const audioBtn_sidebar = document.querySelector('.numbers-controls .audio-btn i');
    const translateBtn_sidebar = document.querySelector('.numbers-controls .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-numbers');

    // Numbers Grid
    const numberBoxes = document.querySelectorAll('.number-box');
    const playAllBtn = document.getElementById('play-all-btn');
    const testModeBtn = document.getElementById('test-mode-btn');

    // Progress Tracking
    const numbersPlayedEl = document.getElementById('numbers-played');
    const progressBar = document.getElementById('progress-bar');
    const achievementBadge = document.getElementById('achievement');

    // Practice Section
    const practiceSection = document.getElementById('practice-section');
    const practiceCode = document.getElementById('practice-code');
    const practiceOptions = document.getElementById('practice-options');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_number = new Audio();

    const allAudios = [audio_sidebar, audio_number];
    
    let currentPlayingNumber = null;
    let playedNumbers = new Set();
    let isAutoPlaying = false;
    let autoPlayIndex = 0;
    let practiceMode = false;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = `"Cadet, you've mastered the alphabet — well done! Now, let's train your ears for numbers at sea! Echo each number you hear and keep your radio voice steady!"`;
    const translatedText_sidebar = `"Kadet, kamu sudah menguasai alfabet — bagus sekali! Sekarang, mari latih telingamu untuk angka di laut! Tiru setiap angka yang kamu dengar dan jaga suaramu tetap stabil!"`;
    let isTranslated_sidebar = false;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/numbers_intro.wav';
    const natoAudioBasePath = '/static/data/audio/nato/';

    // Number Data
    const numbersData = [
        { code: 'zeero', number: '0', phonetic: 'ZE-RO' },
        { code: 'wun', number: '1', phonetic: 'WUN' },
        { code: 'too', number: '2', phonetic: 'TOO' },
        { code: 'tree', number: '3', phonetic: 'TREE' },
        { code: 'fower', number: '4', phonetic: 'FOWER' },
        { code: 'fife', number: '5', phonetic: 'FIFE' },
        { code: 'six', number: '6', phonetic: 'SIX' },
        { code: 'seven', number: '7', phonetic: 'SEVEN' },
        { code: 'eight', number: '8', phonetic: 'AIT' },
        { code: 'niner', number: '9', phonetic: 'NINER' }
    ];

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
        
        if (audioBtn_sidebar) {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
        }

        if (currentPlayingNumber) {
            currentPlayingNumber.classList.remove('playing');
            currentPlayingNumber = null;
        }
    }

    function updateProgress() {
        const totalNumbers = 10;
        const played = playedNumbers.size;
        const percentage = (played / totalNumbers) * 100;

        if (numbersPlayedEl) {
            animateNumber(numbersPlayedEl, parseInt(numbersPlayedEl.textContent), played);
        }

        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }

        // Show achievement when all completed
        if (played === totalNumbers && achievementBadge) {
            achievementBadge.style.display = 'flex';
            confettiEffect();
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

    function confettiEffect() {
        console.log('🎉 Congratulations! All numbers mastered!');
        // You can add actual confetti library here
        if (progressBar) {
            progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
        }
    }

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================

    if (audioBtn_sidebar) {
        audioBtn_sidebar.parentElement.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                stopAllAudio();
                stopAutoPlay();
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
    // NUMBERS GRID FUNCTIONALITY
    // ==================================================

    numberBoxes.forEach(box => {
        box.addEventListener('click', function() {
            if (practiceMode) return; // Don't play in practice mode
            
            const code = this.dataset.code;
            const number = this.dataset.number;
            
            if (!code) return;

            stopAllAudio();

            audio_number.src = `${natoAudioBasePath}${code}.wav`;
            audio_number.play()
                .then(() => {
                    this.classList.add('playing');
                    currentPlayingNumber = this;

                    if (!playedNumbers.has(number)) {
                        playedNumbers.add(number);
                        updateProgress();
                    }
                })
                .catch(error => {
                    console.error('❌ Number audio error:', error);
                    shakeElement(this);
                });

            audio_number.onended = () => {
                this.classList.remove('playing');
                this.classList.add('played');
                currentPlayingNumber = null;
            };
        });

        // Hover effects
        box.addEventListener('mouseenter', function() {
            if (!this.classList.contains('playing') && !practiceMode) {
                this.style.transform = 'translateY(-10px) scale(1.05)';
            }
        });

        box.addEventListener('mouseleave', function() {
            if (!this.classList.contains('playing')) {
                this.style.transform = '';
            }
        });
    });

    // ==================================================
    // AUTO-PLAY ALL NUMBERS
    // ==================================================

    if (playAllBtn) {
        playAllBtn.addEventListener('click', function() {
            if (isAutoPlaying) {
                stopAutoPlay();
                this.innerHTML = '<i class="fas fa-play-circle"></i><span>Play All</span>';
            } else {
                startAutoPlay();
                this.innerHTML = '<i class="fas fa-stop-circle"></i><span>Stop</span>';
            }
        });
    }

    function startAutoPlay() {
        if (isAutoPlaying) return;
        
        isAutoPlaying = true;
        autoPlayIndex = 0;
        practiceMode = false;
        hidePractice();

        playNextNumber();
    }

    function playNextNumber() {
        if (!isAutoPlaying || autoPlayIndex >= numberBoxes.length) {
            stopAutoPlay();
            return;
        }

        const box = Array.from(numberBoxes)[autoPlayIndex];
        box.click();

        audio_number.onended = () => {
            box.classList.remove('playing');
            box.classList.add('played');
            autoPlayIndex++;
            
            setTimeout(() => {
                playNextNumber();
            }, 800); // 800ms pause between numbers
        };
    }

    function stopAutoPlay() {
        isAutoPlaying = false;
        autoPlayIndex = 0;
        
        if (playAllBtn) {
            playAllBtn.innerHTML = '<i class="fas fa-play-circle"></i><span>Play All</span>';
        }
    }

    // ==================================================
    // TEST MODE / PRACTICE
    // ==================================================

    if (testModeBtn) {
        testModeBtn.addEventListener('click', function() {
            practiceMode = !practiceMode;
            
            if (practiceMode) {
                stopAllAudio();
                stopAutoPlay();
                showPractice();
                this.innerHTML = '<i class="fas fa-times-circle"></i><span>Exit Test</span>';
            } else {
                hidePractice();
                this.innerHTML = '<i class="fas fa-clipboard-check"></i><span>Test Mode</span>';
            }
        });
    }

    function showPractice() {
        if (!practiceSection) return;
        
        practiceSection.style.display = 'block';
        generatePracticeQuestion();
    }

    function hidePractice() {
        if (!practiceSection) return;
        practiceSection.style.display = 'none';
    }

    function generatePracticeQuestion() {
        // Pick random number
        const randomIndex = Math.floor(Math.random() * numbersData.length);
        const correctNumber = numbersData[randomIndex];
        
        if (practiceCode) {
            practiceCode.textContent = correctNumber.phonetic;
        }

        // Generate options (correct + 4 random)
        const options = [correctNumber];
        while (options.length < 5) {
            const randomNum = numbersData[Math.floor(Math.random() * numbersData.length)];
            if (!options.includes(randomNum)) {
                options.push(randomNum);
            }
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        // Display options
        if (practiceOptions) {
            practiceOptions.innerHTML = '';
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'practice-option';
                btn.textContent = opt.number;
                btn.addEventListener('click', function() {
                    checkAnswer(opt.number, correctNumber.number);
                });
                practiceOptions.appendChild(btn);
            });
        }
    }

    function checkAnswer(selected, correct) {
        const allOptions = practiceOptions.querySelectorAll('.practice-option');
        
        allOptions.forEach(opt => {
            opt.disabled = true;
            if (opt.textContent === correct) {
                opt.style.background = '#10b981';
                opt.style.color = '#fff';
                opt.style.borderColor = '#10b981';
            }
            if (opt.textContent === selected && selected !== correct) {
                opt.style.background = '#ef4444';
                opt.style.color = '#fff';
                opt.style.borderColor = '#ef4444';
            }
        });

        setTimeout(() => {
            generatePracticeQuestion();
        }, 1500);
    }

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        // Number keys 0-9
        if (e.key >= '0' && e.key <= '9' && !practiceMode) {
            numberBoxes.forEach(box => {
                if (box.dataset.number === e.key) {
                    box.click();
                    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }

        // Space to start/stop auto-play
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (playAllBtn) playAllBtn.click();
        }

        // T for test mode
        if (e.key.toLowerCase() === 't' && !practiceMode) {
            if (testModeBtn) testModeBtn.click();
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

    const animatedElements = document.querySelectorAll('.numbers-card, .continue-wrapper');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(el);
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ Numbers Chart Ready!');
    console.log('💡 Tip: Press number keys (0-9) to hear pronunciations');
    console.log('💡 Tip: Press Space to auto-play all numbers');
    console.log('💡 Tip: Press T to enter test mode');
    console.log('🎯 Progress:', playedNumbers.size + '/10 numbers');
});