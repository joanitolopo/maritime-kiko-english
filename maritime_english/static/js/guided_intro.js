// ========================================
// MODERN GUIDED INTRO JAVASCRIPT
// Radio Watch Duty with Role Selection
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Radio Watch Duty Initialized!');

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser tidak mendukung Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
        document.querySelectorAll('.mic-btn-task').forEach(btn => {
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
    const playBtn_sidebar = document.querySelector('.play-btn');
    const translateBtn_sidebar = document.querySelector('.translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-guided');
    const instructionText_activity = document.querySelector('.instruction-text-guided');

    // Role Selection Buttons
    const roleSelectBtns = document.querySelectorAll('.role-select-btn');
    const changeRoleBtns = document.querySelectorAll('.change-role-btn');

    // Audio Players
    const audio_sidebar = new Audio();
    const allAudios = [audio_sidebar];
    
    let isTranslated = false;
    let isListening = false;
    let currentMicBtn = null;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = "Cadet, this time you’ll sail through a real-life radio situation. Read each story carefully and imagine what’s happening at sea. Then, decide your role — caller or receiver — and practice your radio message. Remember, clear radio communication can save lives!"
    const translatedText_sidebar = "Taruna, kali ini kamu akan berlayar melalui situasi radio yang nyata. Bacalah setiap cerita dengan cermat dan bayangkan apa yang sedang terjadi di laut. Setelah itu, tentukan peranmu — sebagai pemanggil (caller) atau penerima (receiver) — lalu latih pesan radiomu. Ingat, komunikasi radio yang jelas dapat menyelamatkan nyawa!";

    const originalText_instruction = `Read the situation. Choose your role (caller or receiver). Then record your radio message using the correct maritime alphabet and number pronunciation.`;
    const translatedText_instruction = `Baca situasinya. Pilih peranmu (pemanggil atau penerima). Lalu rekam pesan radiomu menggunakan alfabet maritim dan pengucapan angka yang benar.`;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/guided_intro.wav';

    // Target Phrases for Speech Recognition
    const TARGET_PHRASES = {
        // Situation 1
        'situation1-caller': "This is Motor Vessel Coralis, Call Sign Charlie Lima Foxtrot Whisky 2. MMSI 538209100. Calling Motor Vessel Silverwind, Call Sign Sierra Victor November Papa 4. Channel 16. Over.",
        'situation1-receiver': "Motor Vessel CORALIS this is SILVERWIND receiving you loud and clear Over",
        
        // Situation 2
        'situation2-caller': "This is Motor Vessel Crystal Wave, Call Sign Charlie Whisky Tango Romeo 8. MMSI 519402300. Calling Motor Vessel Emerald Sky, Call Sign Echo Mike Sierra Kilo 7. Channel 16. Over.",
        'situation2-receiver': "Motor Vessel CRYSTAL WAVE this is EMERALD SKY receiving you loud and clear Over"
    };

    // Role Info Messages
    const ROLE_INFO = {
        'situation1-caller': 'You are the CALLER on MV CORALIS. Initiate contact with MV SILVERWIND.',
        'situation1-receiver': 'You are the RECEIVER on MV SILVERWIND. Respond to MV CORALIS.',
        'situation2-caller': 'You are the CALLER on MV CRYSTAL WAVE. Initiate contact with MV EMERALD SKY.',
        'situation2-receiver': 'You are the RECEIVER on MV EMERALD SKY. Respond to MV CRYSTAL WAVE.'
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

        if (playBtn_sidebar) {
            const icon = playBtn_sidebar.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        }

        document.querySelectorAll('.mic-btn-task').forEach(btn => {
            btn.classList.remove('listening');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            if (icon) icon.className = 'fas fa-microphone';
            if (text) text.textContent = 'Record Your Message';
        });
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

    function checkPronunciation(transcript, targetText, micBtn) {
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
        
        let title = '';
        let message = '';

        if (allCorrect) {
            title = '<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Excellent Work!</h4>';
            message = `<p style="color: #059669;">Perfect! You pronounced all the key words correctly. You're ready for real radio watch duty! 🎉</p>`;
        } else if (accuracy >= 70) {
            title = '<h4><i class="fa-solid fa-star" style="color: #f59e0b;"></i> Good Try!</h4>';
            message = `<p style="color: #d97706;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). Review the missing words and try again!</p>`;
        } else {
            title = '<h4><i class="fa-solid fa-arrows-rotate" style="color: #3b82f6;"></i> Keep Practicing!</h4>';
            message = `<p style="color: #2563eb;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). Read the situation again and practice the correct format.</p>`;
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
                micBtn.click();
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

    if (playBtn_sidebar) {
        playBtn_sidebar.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (audio_sidebar.paused) {
                stopAllAudioAndSpeech();
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        addPulseEffect(this);
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_sidebar.pause();
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                removePulseEffect(this);
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            const icon = playBtn_sidebar.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
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
    // ROLE SELECTION CONTROLS
    // ==================================================

    roleSelectBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const role = this.dataset.role;
            const situationNum = this.dataset.situation;
            const taskKey = `situation${situationNum}-${role}`;
            
            // Hide role selection, show recording section
            const roleSelectionSection = this.closest('.role-selection-section');
            const recordingSection = document.getElementById(`recording-section-${situationNum}`);
            
            roleSelectionSection.style.display = 'none';
            recordingSection.style.display = 'block';
            
            // Update recording section info
            const roleInfoText = recordingSection.querySelector('.selected-role-text');
            const micBtn = recordingSection.querySelector('.mic-btn-task');
            
            roleInfoText.textContent = ROLE_INFO[taskKey];
            micBtn.dataset.task = taskKey;
            
            // Animate the recording section
            recordingSection.style.animation = 'fadeInUp 0.5s ease';
            
            showNotification(`You selected: ${role.toUpperCase()}. Ready to record!`, 'success');
        });
    });

    changeRoleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const situationNum = this.dataset.situation;
            const recordingSection = document.getElementById(`recording-section-${situationNum}`);
            const roleSelectionSection = recordingSection.previousElementSibling;
            
            // Hide recording section, show role selection
            recordingSection.style.display = 'none';
            roleSelectionSection.style.display = 'block';
            
            // Reset mic button
            const micBtn = recordingSection.querySelector('.mic-btn-task');
            micBtn.dataset.task = '';
            
            showNotification('Role selection reset. Choose your role again.', 'info');
        });
    });

    // ==================================================
    // MICROPHONE CONTROLS
    // ==================================================

    document.querySelectorAll('.mic-btn-task').forEach(btn => {
        btn.addEventListener('click', function() {
            if (isListening) {
                showNotification('Please wait for the current recording to finish', 'warning');
                return;
            }

            const taskKey = this.dataset.task;
            if (!taskKey) {
                showNotification('Please select a role first', 'warning');
                return;
            }

            stopAllAudioAndSpeech();
            isListening = true;
            currentMicBtn = this;
            
            const targetText = TARGET_PHRASES[taskKey];

            if (!targetText) {
                console.warn(`Target phrase not found for: ${taskKey}`);
                showNotification('Target phrase not configured for this task', 'error');
                return;
            }

            this.classList.add('listening');
            const icon = this.querySelector('i');
            const text = this.querySelector('span');
            if (icon) icon.className = 'fas fa-stop';
            if (text) text.textContent = 'Listening...';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('📝 Transcript:', transcript);
                checkPronunciation(transcript, targetText, currentMicBtn);
            };

            recognition.onend = () => {
                isListening = false;
                if (currentMicBtn) {
                    currentMicBtn.classList.remove('listening');
                    const icon = currentMicBtn.querySelector('i');
                    const text = currentMicBtn.querySelector('span');
                    if (icon) icon.className = 'fas fa-microphone';
                    if (text) text.textContent = 'Record Your Message';
                }
                currentMicBtn = null;
            };

            recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                isListening = false;
                
                if (currentMicBtn) {
                    currentMicBtn.classList.remove('listening');
                    const icon = currentMicBtn.querySelector('i');
                    const text = currentMicBtn.querySelector('span');
                    if (icon) icon.className = 'fas fa-microphone';
                    if (text) text.textContent = 'Record Your Message';
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
                currentMicBtn = null;
            };

            try {
                recognition.start();
                showNotification('Listening... Speak your radio message now!', 'info');
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

    // Situation cards hover effect
    const situationCards = document.querySelectorAll('.situation-card');
    situationCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.borderWidth = '3px';
        });
        card.addEventListener('mouseleave', function() {
            this.style.borderWidth = '2px';
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
            '.situation-card'
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
            if (translateBtn_sidebar) translateBtn_sidebar.click();
        }

        if (e.key.toLowerCase() === 'c') {
            if (playBtn_sidebar) playBtn_sidebar.click();
        }
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ Radio Watch Duty Ready!');
    console.log('💡 Tip: Select your role (Caller or Receiver) for each situation');
    console.log('💡 Tip: Press T to translate instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('🎯 Read each situation carefully and practice realistic radio exchanges!');
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
    
    @keyframes playPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(notificationStyles);