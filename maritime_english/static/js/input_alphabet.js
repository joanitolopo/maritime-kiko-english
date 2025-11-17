// ========================================
// NATO PHONETIC KEYBOARD JAVASCRIPT
// Combined Alphabet & Numbers Interactive
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('⌨️ NATO Phonetic Keyboard Initialized!');

    // ==================================================
    // ELEMENTS
    // ==================================================

    // Sidebar Controls
    const audioBtn_sidebar = document.querySelector('.phonetic-controls .audio-btn i');
    const translateBtn_sidebar = document.querySelector('.phonetic-controls .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-phonetic');

    // Keyboard Elements
    const keyButtons = document.querySelectorAll('.key-btn');
    const currentDisplay = document.getElementById('current-display');
    const displayChar = currentDisplay?.querySelector('.display-char');
    const displayPhonetic = currentDisplay?.querySelector('.display-phonetic');

    // Mode Toggle
    const modeButtons = document.querySelectorAll('.mode-btn');
    const testSection = document.getElementById('test-section');

    // Quick Actions
    const playAllBtn = document.getElementById('play-all-btn');
    const resetBtn = document.getElementById('reset-btn');
    const randomBtn = document.getElementById('random-btn');

    // Progress Tracking
    const totalPlayedEl = document.getElementById('total-played');
    const progressBar = document.getElementById('progress-bar');
    const achievementBadge = document.getElementById('achievement');

    // Test Mode Elements
    const testPhonetic = document.getElementById('test-phonetic');
    const testOptions = document.getElementById('test-options');
    const testScoreEl = document.getElementById('test-score');
    const testTotalEl = document.getElementById('test-total');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_key = new Audio();

    const allAudios = [audio_sidebar, audio_key];

    // State Variables
    let currentPlayingKey = null;
    let playedKeys = new Set();
    let isAutoPlaying = false;
    let autoPlayIndex = 0;
    let currentMode = 'learn';
    let testScore = 0;
    let testTotal = 0;
    let currentTestAnswer = null;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    const originalText_sidebar = "Cadet, it's time to master our code words at sea! In this activity, you'll train your ears and voice to handle both the maritime alphabet and numbers. Shadow each code word and echo each number you hear — keep your radio voice steady and sound like a true mariner!";
    const translatedText_sidebar = "Taruna, saatnya menguasai kata sandi kita di laut! Dalam aktivitas ini, Anda akan melatih pendengaran dan suara Anda untuk menangani alfabet maritim dan angka. Ikuti setiap kata sandi dan ulangi setiap angka yang Anda dengar — jaga suara radio Anda tetap stabil dan terdengar seperti pelaut sejati!";
    let isTranslated_sidebar = false;

    const audioPath_sidebar = '/static/data/audio/unit1/phonetic_intro.wav';
    const natoAudioBasePath = '/static/data/audio/nato/';

    // ==================================================
    // MAIN AUDIO FUNCTIONS
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

        if (currentPlayingKey) {
            currentPlayingKey.classList.remove('playing');
            currentPlayingKey = null;
        }
    }

    function updateProgress() {
        const totalKeys = 36; // 26 letters + 10 numbers
        const played = playedKeys.size;
        const percentage = (played / totalKeys) * 100;

        if (totalPlayedEl) {
            animateNumber(totalPlayedEl, parseInt(totalPlayedEl.textContent), played);
        }

        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }

        // Show achievement when all completed
        if (played === totalKeys && achievementBadge) {
            achievementBadge.style.display = 'flex';
            celebrateCompletion();
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

    function celebrateCompletion() {
        console.log('🎉 Congratulations! All 36 keys mastered!');
        if (progressBar) {
            progressBar.style.background = 'linear-gradient(90deg, #10b981 0%, #34d399 100%)';
        }
        // Add confetti or celebration effect here
    }

    function updateDisplay(key, phonetic) {
        if (displayChar && displayPhonetic) {
            currentDisplay.classList.add('active');
            displayChar.textContent = key;
            displayPhonetic.textContent = phonetic;

            setTimeout(() => {
                currentDisplay.classList.remove('active');
            }, 1500);
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
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                    });
            } else {
                audio_sidebar.pause();
                audioBtn_sidebar.classList.remove('fa-pause');
                audioBtn_sidebar.classList.add('fa-play');
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            stopAllAudio();

            if (speechText_sidebar) {
                speechText_sidebar.style.opacity = '0.3';
                setTimeout(() => {
                    if (isTranslated_sidebar) {
                        speechText_sidebar.textContent = originalText_sidebar;
                        isTranslated_sidebar = false;
                    } else {
                        speechText_sidebar.textContent = translatedText_sidebar;
                        isTranslated_sidebar = true;
                    }
                    speechText_sidebar.style.opacity = '1';
                }, 300);
            }
        });
    }

    // ==================================================
    // KEYBOARD FUNCTIONALITY
    // ==================================================

    keyButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (currentMode === 'test') return; // Don't play in test mode

            const key = this.dataset.key;
            const code = this.dataset.code;
            const phonetic = this.dataset.phonetic;

            if (!code) return;

            stopAllAudio();

            audio_key.src = `${natoAudioBasePath}${code}.wav`;
            audio_key.play()
                .then(() => {
                    this.classList.add('playing');
                    currentPlayingKey = this;

                    // Update display
                    updateDisplay(key, phonetic);

                    // Track progress
                    if (!playedKeys.has(key)) {
                        playedKeys.add(key);
                        updateProgress();
                    }
                })
                .catch(error => {
                    console.error('❌ Key audio error:', error);
                });

            audio_key.onended = () => {
                this.classList.remove('playing');
                this.classList.add('played');
                currentPlayingKey = null;
            };
        });

        // Hover effects
        btn.addEventListener('mouseenter', function() {
            if (!this.classList.contains('playing') && currentMode === 'learn') {
                this.style.transform = 'translateY(-5px) scale(1.08)';
            }
        });

        btn.addEventListener('mouseleave', function() {
            if (!this.classList.contains('playing')) {
                this.style.transform = '';
            }
        });
    });

    // Physical Keyboard Support
    document.addEventListener('keydown', function(e) {
        if (currentMode === 'test') return;

        const key = e.key.toUpperCase();

        // Find matching button
        keyButtons.forEach(btn => {
            if (btn.dataset.key === key || btn.dataset.key === e.key) {
                e.preventDefault();
                btn.click();
                btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    // ==================================================
    // MODE TOGGLE
    // ==================================================

    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;

            // Update active state
            modeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            currentMode = mode;

            if (mode === 'test') {
                stopAllAudio();
                stopAutoPlay();
                if (testSection) {
                    testSection.style.display = 'block';
                    startTestMode();
                }
            } else {
                if (testSection) {
                    testSection.style.display = 'none';
                }
            }
        });
    });

    // ==================================================
    // AUTO-PLAY ALL KEYS
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
        currentMode = 'learn';

        // Reset mode buttons
        modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === 'learn');
        });

        if (testSection) testSection.style.display = 'none';

        playNextKey();
    }

    function playNextKey() {
        if (!isAutoPlaying || autoPlayIndex >= keyButtons.length) {
            stopAutoPlay();
            return;
        }

        const btn = Array.from(keyButtons)[autoPlayIndex];
        btn.click();

        audio_key.onended = () => {
            btn.classList.remove('playing');
            btn.classList.add('played');
            autoPlayIndex++;

            setTimeout(() => {
                playNextKey();
            }, 600);
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
    // RESET PROGRESS
    // ==================================================

    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            if (confirm('Reset all progress? This will clear your mastered keys.')) {
                playedKeys.clear();
                updateProgress();

                // Reset all key states
                keyButtons.forEach(btn => {
                    btn.classList.remove('played');
                });

                // Reset display
                if (displayChar) displayChar.textContent = '-';
                if (displayPhonetic) displayPhonetic.textContent = 'Click a key to start';

                // Hide achievement
                if (achievementBadge) achievementBadge.style.display = 'none';

                console.log('🔄 Progress reset!');
            }
        });
    }

    // ==================================================
    // RANDOM KEY
    // ==================================================

    if (randomBtn) {
        randomBtn.addEventListener('click', function() {
            const randomIndex = Math.floor(Math.random() * keyButtons.length);
            const randomKey = Array.from(keyButtons)[randomIndex];
            randomKey.click();
            randomKey.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // ==================================================
    // TEST MODE
    // ==================================================

    function startTestMode() {
        testScore = 0;
        testTotal = 0;
        updateTestScore();
        generateTestQuestion();
    }

    function generateTestQuestion() {
        // Get all key data
        const keysData = Array.from(keyButtons).map(btn => ({
            key: btn.dataset.key,
            phonetic: btn.dataset.phonetic
        }));

        // Pick random correct answer
        const correctIndex = Math.floor(Math.random() * keysData.length);
        const correctKey = keysData[correctIndex];
        currentTestAnswer = correctKey.key;

        // Display phonetic code
        if (testPhonetic) {
            testPhonetic.textContent = correctKey.phonetic;
        }

        // Generate options (correct + 4 random)
        const options = [correctKey];
        while (options.length < 5) {
            const randomKey = keysData[Math.floor(Math.random() * keysData.length)];
            if (!options.find(o => o.key === randomKey.key)) {
                options.push(randomKey);
            }
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        // Display options
        if (testOptions) {
            testOptions.innerHTML = '';
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'test-option';
                btn.textContent = opt.key;
                btn.addEventListener('click', function() {
                    checkTestAnswer(opt.key, correctKey.key);
                });
                testOptions.appendChild(btn);
            });
        }
    }

    function checkTestAnswer(selected, correct) {
        testTotal++;

        const allOptions = testOptions.querySelectorAll('.test-option');

        allOptions.forEach(opt => {
            opt.disabled = true;
            opt.style.pointerEvents = 'none';

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

        if (selected === correct) {
            testScore++;
        }

        updateTestScore();

        setTimeout(() => {
            generateTestQuestion();
        }, 1500);
    }

    function updateTestScore() {
        if (testScoreEl) testScoreEl.textContent = testScore;
        if (testTotalEl) testTotalEl.textContent = testTotal;
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
        threshold: 0.1
    });

    const animatedElements = document.querySelectorAll('.keyboard-card, .test-section, .continue-wrapper');

    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(el);
    });

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

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ NATO Phonetic Keyboard Ready!');
    console.log('💡 Tip: Press any key on your keyboard to hear its code');
    console.log('💡 Tip: Click "Play All" to auto-play through all keys');
    console.log('💡 Tip: Switch to "Test" mode to quiz yourself');
    console.log('🎯 Progress:', playedKeys.size + '/36 keys');
});