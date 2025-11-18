// ========================================
// MODERN NOTICING NUMBERS JAVASCRIPT
// Radio Spelling Practice - Updated Version
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📡 Radio Spelling Practice Initialized!');

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser tidak mendukung Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
        document.querySelectorAll('.speak-now-btn').forEach(btn => {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const captainAudioBtn = document.getElementById('captain-audio-btn');
    const translateBtn = document.getElementById('translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-drill');
    const instructionText_activity = document.querySelector('.instruction-text-drill');

    // Transcript Play Button
    const transcriptPlayBtn = document.querySelector('.transcript-play-btn');

    // Speak Now Buttons
    const speakNowBtns = document.querySelectorAll('.speak-now-btn');

    // Audio Players
    const audio_captain = new Audio();
    const audio_example = new Audio();

    const allAudios = [audio_captain, audio_example];
    
    let isTranslated = false;
    let isListening = false;
    let currentSpeakBtn = null;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = "Cadets, it’s time to drill your pronunciation! Listen carefully to the example, then spell and say each vessel’s identification clearly — just like a real seafarer!";
    const translatedText_sidebar = "Taruna, saatnya melatih pengucapan! Dengarkan contoh dengan baik, lalu eja dan ucapkan identitas setiap kapal dengan jelas — seperti pelaut sejati!";

    const originalText_instruction = "Listen to the example, then read your vessel card and say the name, MMSI, and Call Sign using the same format. Speak clearly."
    const translatedText_instruction = "Dengarkan contohnya, lalu ucapkan nama kapal, MMSI, dan Call Sign dari kartu kapalmu dengan format yang sama. Ucapkan dengan jelas.";

    // Audio Paths
    const audioPath_captain = '/static/data/audio/unit1/noticing_numbers_intro.wav';

    // Target Phrases for Speech Recognition
    const TARGET_PHRASES = {
        'task1': "This is too-tree-seven-zeero-zeero-too-six-zeero-zeero Motor Vessel APOLLON Sierra Whisky Foxtrot Papa Over",
        'task2': "This is fower-fower-zeero-niner-ait-tree-zeero-zeero-zeero Motor Vessel BAYSTAR Delta Sierra Oscar November Niner Over"
    };

    // ==================================================
    // MAIN AUDIO CONTROL FUNCTIONS
    // ==================================================

    function stopAllAudioAndSpeech() {
        allAudios.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        if (isListening && recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.warn('Recognition already stopped');
            }
            isListening = false;
        }

        // Reset captain audio button
        if (captainAudioBtn) {
            const icon = captainAudioBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
            captainAudioBtn.classList.remove('playing');
        }

        // Reset transcript play button
        if (transcriptPlayBtn) {
            transcriptPlayBtn.classList.remove('playing');
            const icon = transcriptPlayBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        }

        // Reset speak now buttons
        speakNowBtns.forEach(btn => {
            btn.classList.remove('listening');
            const text = btn.querySelector('span');
            if (text) text.textContent = 'Speak Now';
        });
    }

    // ==================================================
    // TEXT CLEANING & NORMALIZATION
    // ==================================================

    function cleanText(text) {
        const numMap = {
            'zero': '0', 'zeero': '0', 
            'one': '1', 'wun': '1',
            'two': '2', 'too': '2',
            'three': '3', 'tree': '3',
            'four': '4', 'fower': '4',
            'five': '5', 'fife': '5',
            'six': '6',
            'seven': '7',
            'eight': '8', 'ait': '8',
            'nine': '9', 'niner': '9'
        };
        
        let newText = text.toLowerCase();
        
        for (const word in numMap) {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            newText = newText.replace(regex, numMap[word]);
        }
        
        return newText.replace(/[.,!?"-]/g, '')
                      .replace(/\s+/g, ' ')
                      .trim();
    }

    // ==================================================
    // PRONUNCIATION CHECKING
    // ==================================================

    function checkPronunciation(transcript, targetText, speakBtn) {
        const userWords = new Set(cleanText(transcript).split(' '));
        const targetWords = cleanText(targetText).split(' ');
        
        let resultHTML = '';
        let correctCount = 0;
        let totalCount = targetWords.length;

        targetWords.forEach(targetWord => {
            if (userWords.has(targetWord)) {
                resultHTML += `<span class="correct">${targetWord}</span> `;
                correctCount++;
            } else {
                resultHTML += `<span class="missing">${targetWord}</span> `;
            }
        });

        const accuracy = Math.round((correctCount / totalCount) * 100);
        const allCorrect = correctCount === totalCount;

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'feedback-modal show';
        
        let title = '';
        let message = '';

        if (allCorrect) {
            title = '<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Excellent Work!</h4>';
            message = `<p style="color: #059669;">Perfect! You pronounced all the key words correctly. Keep up the great work! 🎉</p>`;
        } else if (accuracy >= 70) {
            title = '<h4><i class="fa-solid fa-star" style="color: #f59e0b;"></i> Good Try!</h4>';
            message = `<p style="color: #d97706;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). Review the missing words and try again!</p>`;
        } else {
            title = '<h4><i class="fa-solid fa-arrows-rotate" style="color: #3b82f6;"></i> Keep Practicing!</h4>';
            message = `<p style="color: #2563eb;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). Don't worry! Listen to the example again and practice more.</p>`;
        }
        
        const transcriptDisplay = `
            <h5>What you said:</h5>
            <p style="font-style: italic; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; padding: 12px; border-radius: 12px; word-wrap: break-word; color: #0c4a6e;">
                "${transcript}"
            </p>
        `;

        const expectedLabel = `<h5>Word-by-word comparison (${correctCount}/${totalCount} correct):</h5>`;

        modal.innerHTML = `
            <div class="feedback-modal-content">
                <button class="feedback-close">&times;</button>
                <div class="mic-result-box">
                    ${title}
                    ${message}
                    ${transcriptDisplay}
                    ${expectedLabel}
                    <div class="diff-output">${resultHTML}</div>
                    <button class="try-again-btn"><i class="fa-solid fa-microphone"></i> Try Again</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

        // Close button functionality
        const closeBtn = modal.querySelector('.feedback-close');
        const tryAgainBtn = modal.querySelector('.try-again-btn');

        closeBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        });

        tryAgainBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                modal.remove();
                speakBtn.click();
            }, 300);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => modal.remove(), 300);
            }
        });

        if (allCorrect) {
            playSuccessSound();
        }
    }

    function playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        } catch (e) {
            console.log('Success sound not available');
        }
    }

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================

    if (captainAudioBtn) {
        captainAudioBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (audio_captain.paused) {
                stopAllAudioAndSpeech();
                audio_captain.src = audioPath_captain;
                audio_captain.play()
                    .then(() => {
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        this.classList.add('playing');
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_captain.pause();
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                this.classList.remove('playing');
            }
        });

        audio_captain.addEventListener('ended', () => {
            const icon = captainAudioBtn.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            captainAudioBtn.classList.remove('playing');
        });
    }

    if (translateBtn) {
        translateBtn.addEventListener('click', function() {
            stopAllAudioAndSpeech();
            
            fadeTransition(speechText_sidebar, () => {
                if (isTranslated) {
                    speechText_sidebar.textContent = originalText_sidebar;
                    instructionText_activity.innerHTML = originalText_instruction;
                    isTranslated = false;
                } else {
                    speechText_sidebar.textContent = translatedText_sidebar;
                    instructionText_activity.innerHTML = translatedText_instruction;
                    isTranslated = true;
                }
            });
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // TRANSCRIPT PLAY BUTTON
    // ==================================================

    if (transcriptPlayBtn) {
        transcriptPlayBtn.addEventListener('click', function() {
            const audioSrc = this.dataset.audioSrc;
            const icon = this.querySelector('i');

            if (!audioSrc) {
                console.warn('Audio source not found');
                return;
            }

            if (audio_example.paused || audio_example.src !== audioSrc) {
                stopAllAudioAndSpeech();

                audio_example.src = audioSrc;
                audio_example.play()
                    .then(() => {
                        this.classList.add('playing');
                        if (icon) {
                            icon.classList.remove('fa-play');
                            icon.classList.add('fa-pause');
                        }
                        showNotification('Playing example audio...', 'info');
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_example.pause();
                this.classList.remove('playing');
                if (icon) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            }
        });

        audio_example.addEventListener('ended', () => {
            transcriptPlayBtn.classList.remove('playing');
            const icon = transcriptPlayBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
    }

    // ==================================================
    // SPEAK NOW BUTTONS
    // ==================================================

    speakNowBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isListening) {
                showNotification('Please wait for the current recording to finish', 'warning');
                return;
            }

            stopAllAudioAndSpeech();
            isListening = true;
            currentSpeakBtn = this;
            
            const taskKey = this.dataset.task;
            const targetText = TARGET_PHRASES[taskKey];

            if (!targetText) {
                console.warn(`Target phrase not found for: ${taskKey}`);
                showNotification('Target phrase not configured for this task', 'error');
                isListening = false;
                return;
            }

            this.classList.add('listening');
            const text = this.querySelector('span');
            if (text) text.textContent = 'Listening...';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('📝 Transcript:', transcript);
                checkPronunciation(transcript, targetText, currentSpeakBtn);
            };

            recognition.onend = () => {
                isListening = false;
                if (currentSpeakBtn) {
                    currentSpeakBtn.classList.remove('listening');
                    const text = currentSpeakBtn.querySelector('span');
                    if (text) text.textContent = 'Speak Now';
                }
                currentSpeakBtn = null;
            };

            recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                isListening = false;
                
                if (currentSpeakBtn) {
                    currentSpeakBtn.classList.remove('listening');
                    const text = currentSpeakBtn.querySelector('span');
                    if (text) text.textContent = 'Speak Now';
                }
                
                let errorMessage = 'Could not recognize speech.';
                if (event.error === 'no-speech') {
                    errorMessage = 'No speech detected. Please try again and speak clearly.';
                } else if (event.error === 'audio-capture') {
                    errorMessage = 'Microphone not found. Please check your microphone connection.';
                } else if (event.error === 'not-allowed') {
                    errorMessage = 'Microphone permission denied. Please allow microphone access.';
                }
                
                showNotification(errorMessage, 'error');
                currentSpeakBtn = null;
            };

            try {
                recognition.start();
                showNotification('Listening... Speak now!', 'info');
            } catch (e) {
                console.error('Failed to start recognition:', e);
                isListening = false;
                this.classList.remove('listening');
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

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${colors[type]};
            color: ${colors[type]};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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

    const captainImage = document.querySelector('.captain-avatar');
    if (captainImage) {
        captainImage.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainImage.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

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
            '.speak-card, .example-radio-card'
        );
        
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
            observer.observe(el);
        });
    }

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 't') {
            if (translateBtn) translateBtn.click();
        }

        if (e.key.toLowerCase() === 'c') {
            if (captainAudioBtn) captainAudioBtn.click();
        }

        if (e.key.toLowerCase() === 'e') {
            if (transcriptPlayBtn) transcriptPlayBtn.click();
        }

        // Number keys 1-2 for speak tasks
        if (e.key === '1' || e.key === '2') {
            const index = parseInt(e.key) - 1;
            if (speakNowBtns[index]) speakNowBtns[index].click();
        }
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ Radio Spelling Practice Ready!');
    console.log('💡 Tip: Press E to play example audio');
    console.log('💡 Tip: Press 1 or 2 to start speaking for each task');
    console.log('💡 Tip: Press T to translate instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('🎯 Practice your radio spelling skills!');
});

// Add CSS for notifications and animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);