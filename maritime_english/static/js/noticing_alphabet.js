// ========================================
// NOTICING ALPHABET JAVASCRIPT - ROLEPLAY VERSION
// Radio Communication Role-Play with Caller/Receiver
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎤 Radio Role-Play Practice Initialized!');

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser tidak mendukung Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
        document.querySelectorAll('.speak-btn').forEach(btn => {
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
    // ELEMENTS
    // ==================================================
    const captainAudioBtn = document.getElementById('captain-audio-btn');
    const translateBtn = document.getElementById('translate-btn');
    const speechTextDrill = document.querySelector('.speech-text-drill');
    const instructionTextDrill = document.querySelector('.instruction-text-drill');
    
    const speakButtons = document.querySelectorAll('.speak-btn');
    const playButtons = document.querySelectorAll('.play-btn');

    // Audio Players
    const audioCaptain = new Audio();
    const audioExample = new Audio();
    const audioTranscript = new Audio();
    const allAudios = [audioCaptain, audioExample, audioTranscript];
    
    let isTranslated = false;
    let isListening = false;
    let currentSpeakBtn = null;
    let currentPlayBtn = null;
    let currentTranscriptBtn = null;

    // ==================================================
    // TEXT CONTENT
    // ==================================================
    const originalText_captain = `"Cadets, it's time to practice real radio communication! You'll take turns being the Caller and the Receiver. Listen to the other ship, then respond clearly!"`;
    const translatedText_captain = `"Kadet, saatnya berlatih komunikasi radio yang sesungguhnya! Kamu akan bergantian menjadi Pemanggil dan Penerima. Dengarkan kapal lain, lalu jawab dengan jelas!"`;

    const originalText_instruction = `Practice radio communication by taking turns as Caller and Receiver. Listen to "Play Now" examples, then speak your part clearly.`;
    const translatedText_instruction = `Berlatih komunikasi radio dengan bergantian sebagai Pemanggil dan Penerima. Dengarkan contoh "Play Now", lalu ucapkan bagianmu dengan jelas.`;

    // Audio Paths
    const audioPath_captain = '/static/data/audio/unit1/noticing_alphabet_intro.wav';

    // Target Phrases for Speech Recognition
    const TARGET_PHRASES = {
        // Card 0: User is CALLER (calling APOLLON)
        caller_0: "This is Motor Vessel ADOUR 635005000 Foxtrot Quebec Echo Papa calling Motor Vessel APOLLON call sign Sierra Whisky Foxtrot Papa channel one six over",
        // Card 1: User is RECEIVER (responding to BAYSTAR)
        receiver_1: "Motor Vessel BAYSTAR this is SUNSHINE. Receiving you loud and clear over"
    };
    

    // ==================================================
    // AUDIO CONTROL FUNCTIONS
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

        // Reset captain button
        if (captainAudioBtn) {
            const icon = captainAudioBtn.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            captainAudioBtn.classList.remove('playing');
        }

        // Reset all play buttons
        playButtons.forEach(btn => {
            btn.classList.remove('playing');
            btn.querySelector('span').textContent = 'Play Now';
            const icon = btn.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
        });

        // Reset all speak buttons
        speakButtons.forEach(btn => {
            btn.classList.remove('listening');
            btn.querySelector('span').textContent = 'Speak Now';
        });

        // Reset all example play buttons
        const exampleBtns = document.querySelectorAll('.example-play-btn');
        exampleBtns.forEach(btn => {
            btn.classList.remove('playing');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            text.textContent = 'Play Now';
        });

        // Hide transcript popup
        const popup = document.getElementById('transcript-popup');
        if (popup) {
            popup.classList.remove('show');
        }
    }

    // ==================================================
    // TEXT CLEANING
    // ==================================================

    function cleanText(text) {
        const numMap = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3',
            'four': '4', 'five': '5', 'six': '6', 'seven': '7',
            'eight': '8', 'nine': '9'
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
        modal.className = 'feedback-modal';
        modal.style.display = 'flex';
        
        let title = '';
        let message = '';
        const role = speakBtn.dataset.role === 'caller' ? 'Caller' : 'Receiver';

        if (allCorrect) {
            title = `<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Excellent ${role}!</h4>`;
            message = `<p style="color: #059669;">Perfect radio communication! You pronounced all key words correctly. 🎉</p>`;
        } else if (accuracy >= 70) {
            title = `<h4><i class="fa-solid fa-star" style="color: #f59e0b;"></i> Good ${role}!</h4>`;
            message = `<p style="color: #d97706;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). Review the missing words!</p>`;
        } else {
            title = `<h4><i class="fa-solid fa-arrows-rotate" style="color: #3b82f6;"></i> Keep Practicing!</h4>`;
            message = `<p style="color: #2563eb;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). Listen to the example again!</p>`;
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

        // Event listeners
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
    // CAPTAIN AUDIO CONTROL
    // ==================================================

    if (captainAudioBtn) {
        captainAudioBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (audioCaptain.paused) {
                stopAllAudioAndSpeech();
                audioCaptain.src = audioPath_captain;
                audioCaptain.play()
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
                audioCaptain.pause();
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                this.classList.remove('playing');
            }
        });

        audioCaptain.addEventListener('ended', () => {
            const icon = captainAudioBtn.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            captainAudioBtn.classList.remove('playing');
        });
    }

    // ==================================================
    // TRANSLATE BUTTON
    // ==================================================

    if (translateBtn) {
        translateBtn.addEventListener('click', function() {
            stopAllAudioAndSpeech();
            
            fadeTransition(speechTextDrill, () => {
                if (isTranslated) {
                    speechTextDrill.textContent = originalText_captain;
                    instructionTextDrill.textContent = originalText_instruction;
                    isTranslated = false;
                } else {
                    speechTextDrill.textContent = translatedText_captain;
                    instructionTextDrill.textContent = translatedText_instruction;
                    isTranslated = true;
                }
            });
            
            fadeTransition(instructionTextDrill, () => {});
            addClickEffect(this);
        });
    }

    // ==================================================
    // PLAY BUTTONS (Example Audio)
    // ==================================================

    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const audioSrc = this.dataset.audioSrc;
            const icon = this.querySelector('i');
            const text = this.querySelector('span');
            
            if (audioExample.paused || currentPlayBtn !== this) {
                stopAllAudioAndSpeech();
                currentPlayBtn = this;
                
                audioExample.src = audioSrc;
                audioExample.play()
                    .then(() => {
                        this.classList.add('playing');
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        text.textContent = 'Playing...';
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        showNotification('Could not play audio. File may not exist.', 'error');
                        shakeElement(this);
                    });
            } else {
                audioExample.pause();
                this.classList.remove('playing');
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                text.textContent = 'Play Now';
            }
        });
    });

    audioExample.addEventListener('ended', () => {
        if (currentPlayBtn) {
            currentPlayBtn.classList.remove('playing');
            const icon = currentPlayBtn.querySelector('i');
            const text = currentPlayBtn.querySelector('span');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            text.textContent = 'Play Now';
            currentPlayBtn = null;
        }
    });

    // ==================================================
    // TRANSCRIPT PLAY BUTTONS (Example Audio)
    // ==================================================

    const examplePlayBtns = document.querySelectorAll('.example-play-btn');
    const transcriptPopup = document.getElementById('transcript-popup');
    const transcriptRoleTitle = document.getElementById('transcript-role-title');
    const transcriptTextContent = document.getElementById('transcript-text-content');
    let currentExampleBtn = null;
    
    examplePlayBtns.forEach(button => {
        button.addEventListener('click', function() {
            const audioSrc = this.dataset.audioSrc;
            const transcript = this.dataset.transcript;
            const role = this.dataset.role;
            const icon = this.querySelector('i');
            const text = this.querySelector('span');
            
            if (audioTranscript.paused || currentExampleBtn !== this) {
                stopAllAudioAndSpeech();
                currentExampleBtn = this;
                
                // Update popup content
                transcriptRoleTitle.textContent = `${role}'s Message`;
                transcriptTextContent.textContent = transcript;
                
                audioTranscript.src = audioSrc;
                audioTranscript.play()
                    .then(() => {
                        this.classList.add('playing');
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        text.textContent = 'Playing...';
                        
                        // Show popup
                        transcriptPopup.classList.add('show');
                    })
                    .catch(error => {
                        console.error('❌ Example audio error:', error);
                        showNotification('Could not play audio. File may not exist.', 'error');
                        shakeElement(this);
                    });
            } else {
                audioTranscript.pause();
                this.classList.remove('playing');
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                text.textContent = 'Play Now';
                
                // Hide popup
                transcriptPopup.classList.remove('show');
            }
        });
    });

    audioTranscript.addEventListener('ended', () => {
        if (currentExampleBtn) {
            currentExampleBtn.classList.remove('playing');
            const icon = currentExampleBtn.querySelector('i');
            const text = currentExampleBtn.querySelector('span');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            text.textContent = 'Play Now';
            currentExampleBtn = null;
            
            // Auto-hide popup after audio ends
            setTimeout(() => {
                transcriptPopup.classList.remove('show');
            }, 500);
        }
    });

    // Close popup on click outside
    if (transcriptPopup) {
        transcriptPopup.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
                if (currentExampleBtn && !audioTranscript.paused) {
                    audioTranscript.pause();
                    currentExampleBtn.classList.remove('playing');
                    const icon = currentExampleBtn.querySelector('i');
                    const text = currentExampleBtn.querySelector('span');
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                    text.textContent = 'Play Now';
                    currentExampleBtn = null;
                }
            }
        });
    }

    // ==================================================
    // SPEAK BUTTONS (Speech Recognition)
    // ==================================================

    speakButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (isListening) {
                showNotification('Please wait for the current recording to finish', 'warning');
                return;
            }

            stopAllAudioAndSpeech();
            isListening = true;
            currentSpeakBtn = this;
            
            // Get target phrase based on role and card index
            const cardIndex = this.closest('.roleplay-card').dataset.cardIndex;
            const role = this.dataset.role;
            const targetKey = `${role}_${cardIndex}`;
            const targetText = TARGET_PHRASES[targetKey];

            // Add listening state
            this.classList.add('listening');
            this.querySelector('span').textContent = 'Listening...';

            // Setup recognition handlers
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('📝 Transcript:', transcript);
                checkPronunciation(transcript, targetText, currentSpeakBtn);
            };

            recognition.onend = () => {
                isListening = false;
                currentSpeakBtn.classList.remove('listening');
                currentSpeakBtn.querySelector('span').textContent = 'Speak Now';
                currentSpeakBtn = null;
            };

            recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                isListening = false;
                currentSpeakBtn.classList.remove('listening');
                currentSpeakBtn.querySelector('span').textContent = 'Speak Now';
                
                let errorMessage = 'Could not recognize speech.';
                if (event.error === 'no-speech') {
                    errorMessage = 'No speech detected. Please try again.';
                } else if (event.error === 'audio-capture') {
                    errorMessage = 'Microphone not found.';
                } else if (event.error === 'not-allowed') {
                    errorMessage = 'Microphone permission denied.';
                }
                
                showNotification(errorMessage, 'error');
                currentSpeakBtn = null;
            };

            // Start recognition
            try {
                recognition.start();
                showNotification('Listening... Speak your radio message!', 'info');
            } catch (e) {
                console.error('Failed to start recognition:', e);
                isListening = false;
                this.classList.remove('listening');
                this.querySelector('span').textContent = 'Speak Now';
            }
        });
    });

    // ==================================================
    // HELPER FUNCTIONS
    // ==================================================

    function shakeElement(element) {
        if (!element) return;
        element.style.animation = 'shake 0.5s';
        setTimeout(() => element.style.animation = '', 500);
    }

    function addClickEffect(element) {
        if (!element) return;
        element.style.transform = 'scale(0.95)';
        setTimeout(() => element.style.transform = '', 150);
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
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 't') {
            if (translateBtn) translateBtn.click();
        }

        if (e.key.toLowerCase() === 'c') {
            if (captainAudioBtn) captainAudioBtn.click();
        }
    });

    // ==================================================
    // CONSOLE INFO
    // ==================================================

    console.log('✅ Radio Role-Play Practice Ready!');
    console.log('💡 Tip: Press T to translate instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('🎯 Practice both Caller and Receiver roles!');
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
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