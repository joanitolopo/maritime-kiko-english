// ========================================
// MODERN WARMUP PAGE JAVASCRIPT
// Enhanced with smooth interactions
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Warmup Activity Initialized!');

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const audioBtn_warmup = document.querySelector('.warmup-controls .audio-btn i');
    const translateBtn_warmup = document.querySelector('.warmup-controls .translate-btn');
    const speechText_warmup = document.querySelector('.speech-text-warmup');

    // Activity 1: Grid
    const playBtn_grid = document.getElementById('play-grid-audio');
    const codeButtons = document.querySelectorAll('.code-btn');

    // Activity 2: MCQ
    const playBtn_mcq = document.getElementById('play-mcq-audio');
    const mcqForm = document.querySelector('.mcq-form');
    const mcqOptions = document.querySelectorAll('.mcq-option');
    const radioButtons = document.querySelectorAll('.mcq-form input[name="shipname"]');
    const feedbackBox = document.getElementById('mcq-feedback');

    // Audio Players
    const audio_warmup = new Audio();
    const audio_grid_main = new Audio();
    const audio_mcq_main = new Audio();
    const audio_code_item = new Audio();

    const allAudios = [audio_warmup, audio_grid_main, audio_mcq_main, audio_code_item];
    
    let currentActiveButton = null;
    let currentPlayingCode = null;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_warmup = `"Cadet, tune your ears to the radio! Identify each code word you hear, let's see if your radio ears are sharp!"`;
    const translatedText_warmup = `"Taruna, arahkan pendengaranmu ke radio! Kenali setiap kode kata yang kamu dengar — mari kita lihat seberapa tajam pendengaran radionya!"`;
    let isTranslated_warmup = false;

    // Audio Paths
    const audioPath_warmup = '/static/data/audio/unit1/warmup_intro.wav';
    const audioPath_grid_main = '/static/data/audio/unit1/warmup_radio_check_1.wav';
    const audioPath_mcq_main = '/static/data/audio/unit1/warmup_spell_ship_name.wav';
    const natoAudioBasePath = '/static/data/audio/nato/';

    // Correct Answer
    const correctAnswerMCQ = 'SAILEX';

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
        if (audioBtn_warmup) {
            audioBtn_warmup.classList.remove('fa-pause');
            audioBtn_warmup.classList.add('fa-play');
        }

        // Reset play buttons
        if (playBtn_grid) {
            playBtn_grid.classList.remove('playing');
            playBtn_grid.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
        }
        if (playBtn_mcq) {
            playBtn_mcq.classList.remove('playing');
            playBtn_mcq.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
        }
        
        // Reset code buttons
        codeButtons.forEach(btn => btn.classList.remove('playing'));
        
        currentActiveButton = null;
        currentPlayingCode = null;
    }

    function playMainAudio(button, audioPlayer, audioSrc) {
        if (currentActiveButton === button && !audioPlayer.paused) {
            // Pause
            audioPlayer.pause();
            button.classList.remove('playing');
            button.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
            currentActiveButton = null;
        } else {
            // Play
            stopAllAudio();
            audioPlayer.src = audioSrc;
            audioPlayer.play()
                .then(() => {
                    button.classList.add('playing');
                    button.innerHTML = '<i class="fas fa-pause"></i><span>Playing...</span>';
                    currentActiveButton = button;
                })
                .catch(error => {
                    console.error('❌ Audio playback error:', error);
                    shakeElement(button);
                });
        }
    }

    function resetMCQForm() {
        if (mcqForm) {
            mcqForm.reset();
            mcqForm.classList.remove('answered');
        }
        mcqOptions.forEach(option => {
            option.classList.remove('correct', 'incorrect', 'selected');
        });
        radioButtons.forEach(radio => {
            radio.disabled = false;
        });
        if (feedbackBox) {
            feedbackBox.style.display = 'none';
        }
    }

    function showFeedback(isCorrect, message) {
        if (!feedbackBox) return;
        
        const icon = feedbackBox.querySelector('.feedback-icon');
        const text = feedbackBox.querySelector('.feedback-text');
        
        feedbackBox.className = 'feedback-box';
        feedbackBox.classList.add(isCorrect ? 'success' : 'error');
        
        icon.className = 'feedback-icon fas ' + (isCorrect ? 'fa-check-circle' : 'fa-times-circle');
        text.textContent = message;
        
        feedbackBox.style.display = 'flex';
    }

    // ==================================================
    // SIDEBAR WARMUP CONTROLS
    // ==================================================

    if (audioBtn_warmup) {
        audioBtn_warmup.parentElement.addEventListener('click', function() {
            if (audio_warmup.paused) {
                stopAllAudio();
                audio_warmup.src = audioPath_warmup;
                audio_warmup.play()
                    .then(() => {
                        audioBtn_warmup.classList.remove('fa-play');
                        audioBtn_warmup.classList.add('fa-pause');
                        addPulseEffect(this);
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_warmup.pause();
                audioBtn_warmup.classList.remove('fa-pause');
                audioBtn_warmup.classList.add('fa-play');
                removePulseEffect(this);
            }
        });

        audio_warmup.addEventListener('ended', () => {
            audioBtn_warmup.classList.remove('fa-pause');
            audioBtn_warmup.classList.add('fa-play');
            removePulseEffect(audioBtn_warmup.parentElement);
        });
    }

    if (translateBtn_warmup) {
        translateBtn_warmup.addEventListener('click', function() {
            stopAllAudio();
            
            fadeTransition(speechText_warmup, () => {
                if (isTranslated_warmup) {
                    speechText_warmup.textContent = originalText_warmup;
                    isTranslated_warmup = false;
                } else {
                    speechText_warmup.textContent = translatedText_warmup;
                    isTranslated_warmup = true;
                }
            });
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // ACTIVITY 1: CODE GRID
    // ==================================================

    if (playBtn_grid) {
        playBtn_grid.addEventListener('click', function() {
            playMainAudio(this, audio_grid_main, audioPath_grid_main);
        });

        audio_grid_main.addEventListener('ended', () => {
            playBtn_grid.classList.remove('playing');
            playBtn_grid.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
            currentActiveButton = null;
        });
    }

    // Code Button Clicks
    codeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const code = this.dataset.code;
            if (!code) return;

            // Stop other audio but allow this to play
            if (currentPlayingCode !== this) {
                codeButtons.forEach(btn => btn.classList.remove('playing'));
            }

            audio_code_item.src = `${natoAudioBasePath}${code}.wav`;
            audio_code_item.play()
                .then(() => {
                    this.classList.add('playing');
                    currentPlayingCode = this;
                })
                .catch(error => {
                    console.error('❌ Code audio error:', error);
                    shakeElement(this);
                });

            audio_code_item.onended = () => {
                this.classList.remove('playing');
                currentPlayingCode = null;
            };
        });
    });

    // ==================================================
    // ACTIVITY 2: MCQ
    // ==================================================

    if (playBtn_mcq) {
        playBtn_mcq.addEventListener('click', function() {
            resetMCQForm();
            playMainAudio(this, audio_mcq_main, audioPath_mcq_main);
        });

        audio_mcq_main.addEventListener('ended', () => {
            playBtn_mcq.classList.remove('playing');
            playBtn_mcq.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
            currentActiveButton = null;
        });
    }

    // MCQ Answer Checking
    if (mcqForm) {
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                stopAllAudio();

                const selectedValue = this.value;
                const selectedOption = this.closest('.mcq-option');

                // Disable all options
                radioButtons.forEach(btn => btn.disabled = true);
                mcqForm.classList.add('answered');
                selectedOption.classList.add('selected');

                if (selectedValue === correctAnswerMCQ) {
                    // Correct Answer
                    selectedOption.classList.add('correct');
                    showFeedback(true, '🎉 Excellent! That\'s the correct ship name!');
                } else {
                    // Incorrect Answer
                    selectedOption.classList.add('incorrect');
                    showFeedback(false, '❌ Not quite right. Listen again and try!');
                    
                    // Show correct answer
                    setTimeout(() => {
                        mcqOptions.forEach(option => {
                            const radio = option.querySelector('input[type="radio"]');
                            if (radio.value === correctAnswerMCQ) {
                                option.classList.add('correct');
                            }
                        });
                    }, 500);
                }
            });
        });
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

    // Character hover effects
    const captainAvatar = document.querySelector('.captain-avatar');
    const captainSpeaking = document.querySelector('.captain-speaking');

    if (captainAvatar) {
        captainAvatar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainAvatar.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    if (captainSpeaking) {
        captainSpeaking.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainSpeaking.addEventListener('mouseleave', function() {
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

    const animatedElements = document.querySelectorAll('.activity-card, .continue-wrapper');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(el);
    });

    console.log('✅ All warmup features ready!');
    console.log('🎵 Audio systems initialized');
    console.log('🎯 Interactive activities loaded');
});