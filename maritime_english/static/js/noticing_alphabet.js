// ========================================
// MODERN NOTICING ALPHABET JAVASCRIPT
// Radio Spelling Practice with Speech Recognition
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎤 Radio Spelling Practice Initialized!');

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser tidak mendukung Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
        document.querySelectorAll('.mic-turn-box').forEach(box => {
            box.style.opacity = '0.5';
            box.style.cursor = 'not-allowed';
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
    const playBtn_sidebar = document.querySelector('.drill-controls .fa-play');
    const translateBtn_sidebar = document.querySelector('.drill-controls .fa-language');
    const speechText_sidebar = document.querySelector('.speech-text-drill');
    const instructionText_activity = document.querySelector('.instruction-text-drill');

    // Example Controls
    const playBtn_example = document.getElementById('play-example-audio');
    const playBtn_example_text = playBtn_example?.querySelector('.btn-text');

    // Microphone Buttons
    const micButtons = document.querySelectorAll('.mic-turn-box');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_example = new Audio();
    const allAudios = [audio_sidebar, audio_example];
    
    let isTranslated = false;
    let isListening = false;
    let currentMicBox = null;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = `"Cadets, it's time to drill your pronunciation! Listen carefully to OS Lina's example, then spell and say each vessel's identification clearly - just like a real seafarer!"`;
    const translatedText_sidebar = `"Kadet, saatnya melatih pengucapanmu! Dengarkan baik-baik contoh OS Lina, lalu eja dan ucapkan identifikasi setiap kapal dengan jelas - seperti pelaut sejati!"`;

    const originalText_instruction = `Listen to the example carefully. Then, read each card and say the ship's name, MMSI, and Call Sign clearly into your microphone.`;
    const translatedText_instruction = `Dengarkan contohnya dengan saksama. Lalu, baca setiap kartu dan ucapkan nama kapal, MMSI, dan Call Sign dengan jelas ke mikrofon Anda.`;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/noticing_alphabet_intro.wav';
    const audioPath_example = '/static/data/audio/unit1/mmsi_example.wav';

    // Target Phrases for Speech Recognition
    const TARGET_PHRASES = [
        // Card 0 (APOLLON)
        "This is 237002600 Motor Vessel APOLLON Alfa Papa Oscar Lima Lima Oscar November Call Sign Sierra Whisky Foxtrot Papa",
        // Card 1 (BAYSTAR)
        "This is 440983000 Motor Vessel BAYSTAR Bravo Alfa Yankee Sierra Tango Alfa Romeo Call Sign Delta Sierra Oscar November 9"
    ];

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

        if (playBtn_sidebar) {
            playBtn_sidebar.classList.remove('fa-pause');
            playBtn_sidebar.classList.add('fa-play');
        }

        if (playBtn_example) {
            playBtn_example.classList.remove('playing');
            if (playBtn_example_text) {
                playBtn_example_text.textContent = 'PLAY NOW';
            }
        }

        micButtons.forEach(btn => btn.classList.remove('listening'));
    }

    // ==================================================
    // TEXT CLEANING & NORMALIZATION
    // ==================================================

    function cleanText(text) {
        const numMap = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3',
            'four': '4', 'five': '5', 'six': '6', 'seven': '7',
            'eight': '8', 'nine': '9'
        };
        
        let newText = text.toLowerCase();
        
        // Replace number words with digits
        for (const word in numMap) {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            newText = newText.replace(regex, numMap[word]);
        }
        
        // Remove punctuation and normalize spaces
        return newText.replace(/[.,!?"-]/g, '')
                      .replace(/\s+/g, ' ')
                      .trim();
    }

    // ==================================================
    // PRONUNCIATION CHECKING
    // ==================================================

    function checkPronunciation(transcript, targetText, micBox) {
        const userWords = new Set(cleanText(transcript).split(' '));
        const targetWords = cleanText(targetText).split(' ');
        
        let resultHTML = '';
        let correctCount = 0;
        let totalCount = targetWords.length;

        // Compare each word
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

        // Create modal instead of inline result
        const modal = document.createElement('div');
        modal.className = 'feedback-modal';
        
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
        const modalOverlay = modal;

        closeBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        });

        tryAgainBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                modal.remove();
                // Auto-trigger mic again if user wants
                micBox.click();
            }, 300);
        });

        // Click outside to close
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => modal.remove(), 300);
            }
        });

        // Play success sound if perfect
        if (allCorrect) {
            playSuccessSound();
        }
    }

    function playSuccessSound() {
        // Simple success feedback
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
    }

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================

    if (playBtn_sidebar) {
        playBtn_sidebar.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                stopAllAudioAndSpeech();
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        playBtn_sidebar.classList.remove('fa-play');
                        playBtn_sidebar.classList.add('fa-pause');
                        addPulseEffect(this);
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_sidebar.pause();
                playBtn_sidebar.classList.remove('fa-pause');
                playBtn_sidebar.classList.add('fa-play');
                removePulseEffect(this);
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            playBtn_sidebar.classList.remove('fa-pause');
            playBtn_sidebar.classList.add('fa-play');
            removePulseEffect(playBtn_sidebar);
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            stopAllAudioAndSpeech();
            
            fadeTransition(speechText_sidebar, () => {
                if (isTranslated) {
                    speechText_sidebar.textContent = originalText_sidebar;
                    instructionText_activity.textContent = originalText_instruction;
                    isTranslated = false;
                } else {
                    speechText_sidebar.textContent = translatedText_sidebar;
                    instructionText_activity.textContent = translatedText_instruction;
                    isTranslated = true;
                }
            });
            
            fadeTransition(instructionText_activity, () => {});
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // EXAMPLE AUDIO CONTROLS
    // ==================================================

    if (playBtn_example) {
        playBtn_example.addEventListener('click', function() {
            if (audio_example.paused) {
                stopAllAudioAndSpeech();
                audio_example.src = audioPath_example;
                audio_example.play()
                    .then(() => {
                        this.classList.add('playing');
                        if (playBtn_example_text) {
                            playBtn_example_text.textContent = 'PLAYING...';
                        }
                    })
                    .catch(error => {
                        console.error('❌ Example audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_example.pause();
                this.classList.remove('playing');
                if (playBtn_example_text) {
                    playBtn_example_text.textContent = 'PLAY NOW';
                }
            }
        });

        audio_example.addEventListener('ended', () => {
            playBtn_example.classList.remove('playing');
            if (playBtn_example_text) {
                playBtn_example_text.textContent = 'PLAY NOW';
            }
        });
    }

    // ==================================================
    // MICROPHONE CONTROLS
    // ==================================================

    micButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isListening) {
                showNotification('Please wait for the current recording to finish', 'warning');
                return;
            }

            stopAllAudioAndSpeech();
            isListening = true;
            currentMicBox = this;
            
            // Remove old result
            const oldResult = this.querySelector('.mic-result-box');
            if (oldResult) oldResult.remove();
            
            // Get target phrase
            const cardIndex = this.closest('.practice-card-group').dataset.cardIndex;
            const targetText = TARGET_PHRASES[cardIndex];

            // Add listening state
            this.classList.add('listening');

            // Setup recognition handlers
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('📝 Transcript:', transcript);
                checkPronunciation(transcript, targetText, currentMicBox);
            };

            recognition.onend = () => {
                isListening = false;
                currentMicBox.classList.remove('listening');
                currentMicBox = null;
            };

            recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                isListening = false;
                currentMicBox.classList.remove('listening');
                
                let errorMessage = 'Could not recognize speech.';
                if (event.error === 'no-speech') {
                    errorMessage = 'No speech detected. Please try again and speak clearly.';
                } else if (event.error === 'audio-capture') {
                    errorMessage = 'Microphone not found. Please check your microphone connection.';
                } else if (event.error === 'not-allowed') {
                    errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
                }
                
                showNotification(errorMessage, 'error');
                
                const errorBox = document.createElement('div');
                errorBox.className = 'mic-result-box';
                errorBox.innerHTML = `
                    <h4 style="color: #ef4444;"><i class="fa-solid fa-exclamation-triangle"></i> Error</h4>
                    <p>${errorMessage}</p>
                    <button class="try-again-btn">Close</button>
                `;
                currentMicBox.appendChild(errorBox);
                errorBox.querySelector('.try-again-btn').addEventListener('click', () => {
                    errorBox.remove();
                });
                
                currentMicBox = null;
            };

            // Start recognition
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

    function addPulseEffect(element) {
        if (!element) return;
        element.style.animation = 'playPulse 1s ease infinite';
    }

    function removePulseEffect(element) {
        if (!element) return;
        element.style.animation = '';
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

    const continueBtn = document.querySelector('.continue-button');
    if (continueBtn) {
        continueBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        continueBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }

    const captainImage = document.querySelector('.captain-image');
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
        '.example-window, .practice-card-group, .transcript-bubble'
    );
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(el);
    });

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        // Space to play example
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (playBtn_example) playBtn_example.click();
        }

        // T for translate
        if (e.key.toLowerCase() === 't') {
            if (translateBtn_sidebar) translateBtn_sidebar.click();
        }

        // C for captain audio
        if (e.key.toLowerCase() === 'c') {
            if (playBtn_sidebar) playBtn_sidebar.click();
        }

        // 1 or 2 for practice cards
        if (e.key === '1' && micButtons[0]) {
            micButtons[0].click();
        }
        if (e.key === '2' && micButtons[1]) {
            micButtons[1].click();
        }
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ Radio Spelling Practice Ready!');
    console.log('💡 Tip: Press Space to play example audio');
    console.log('💡 Tip: Press 1 or 2 to activate practice cards');
    console.log('💡 Tip: Press T to translate instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('🎯 Practice your radio pronunciation skills!');
});

// Add CSS for notifications
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