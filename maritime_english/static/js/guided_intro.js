// ========================================
// GUIDED INTRO JAVASCRIPT - UPDATED
// Radio Watch Duty with Role Selection
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Radio Watch Duty Initialized!');

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser does not support Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // ==================================================
    // VESSEL DATA
    // ==================================================
    const vesselData = {
        'situation1-caller': {
            name: 'MV CORALIS',
            mmsi: '538209100',
            callSign: 'CLFW2',
            targetPhrase: "This is Motor Vessel Coralis Call Sign Charlie Lima Foxtrot Whisky Two MMSI Five Three Eight Two Zero Nine One Zero Zero Calling Motor Vessel Silverwind Call Sign Sierra Victor November Papa Four Channel One Six Over"
        },
        'situation1-receiver': {
            name: 'MV SILVERWIND',
            mmsi: '312985600',
            callSign: 'SVNP4',
            targetPhrase: "Motor Vessel Coralis this is Silverwind receiving you loud and clear Over"
        },
        'situation2-caller': {
            name: 'MV CRYSTAL WAVE',
            mmsi: '239814900',
            callSign: 'CWTR8',
            targetPhrase: "This is Motor Vessel Crystal Wave Call Sign Charlie Whisky Tango Romeo Eight MMSI Two Three Nine Eight One Four Nine Zero Zero Calling Motor Vessel Emerald Sky Call Sign Echo Mike Sierra Kilo Seven Channel One Six Over"
        },
        'situation2-receiver': {
            name: 'MV EMERALD SKY',
            mmsi: '519402300',
            callSign: 'EMSK7',
            targetPhrase: "Motor Vessel Crystal Wave this is Emerald Sky receiving you loud and clear Over"
        }
    };

    // ==================================================
    // PROGRESS TRACKING
    // ==================================================
    const progressState = {
        situation1: false,
        situation2: false
    };

    // ==================================================
    // ELEMENTS
    // ==================================================
    const playBtn_sidebar = document.querySelector('.play-btn');
    const translateBtn_sidebar = document.querySelector('.translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-guided');
    const instructionText_activity = document.querySelector('.instruction-text-guided');
    const continueWrapper = document.getElementById('continueWrapper');

    const audio_sidebar = new Audio();
    let isTranslated = false;
    let isListening = false;

    // ==================================================
    // TEXT CONTENT
    // ==================================================
    const originalText_sidebar = "Cadet, this time you'll sail through a real-life radio situation. Read each story carefully and imagine what's happening at sea. Then, decide your role — caller or receiver — and practice your radio message. Remember, clear radio communication can save lives!";
    const translatedText_sidebar = "Taruna, kali ini kamu akan berlayar melalui situasi radio yang nyata. Bacalah setiap cerita dengan cermat dan bayangkan apa yang sedang terjadi di laut. Setelah itu, tentukan peranmu — sebagai pemanggil atau penerima — lalu latih pesan radiomu. Ingat, komunikasi radio yang jelas dapat menyelamatkan nyawa!";

    const originalText_instruction = "Read the situation. Choose your role (caller or receiver). Then record your radio message using the correct maritime alphabet and number pronunciation.";
    const translatedText_instruction = "Baca situasinya. Pilih peranmu (pemanggil atau penerima). Lalu rekam pesan radiomu menggunakan alfabet maritim dan pengucapan angka yang benar.";

    const audioPath_sidebar = '/static/data/audio/unit1/guided_intro.wav';

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================
    if (playBtn_sidebar) {
        playBtn_sidebar.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (audio_sidebar.paused) {
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        this.classList.add('playing');
                    })
                    .catch(error => console.error('Audio error:', error));
            } else {
                audio_sidebar.pause();
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                this.classList.remove('playing');
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            const icon = playBtn_sidebar.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            playBtn_sidebar.classList.remove('playing');
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            isTranslated = !isTranslated;
            
            fadeTransition(speechText_sidebar, () => {
                speechText_sidebar.textContent = isTranslated ? translatedText_sidebar : originalText_sidebar;
            });

            fadeTransition(instructionText_activity, () => {
                instructionText_activity.textContent = isTranslated ? translatedText_instruction : originalText_instruction;
            });
        });
    }

    // ==================================================
    // ROLE CARD SELECTION
    // ==================================================
    const roleCards = document.querySelectorAll('.role-practice-card');
    
    roleCards.forEach(card => {
        const selectBtn = card.querySelector('.select-role-btn');
        
        selectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const situation = card.dataset.situation;
            const role = card.dataset.role;
            const key = `situation${situation}-${role}`;
            const data = vesselData[key];
            
            if (!data) return;
            
            // Hide role selection, show recording section
            const roleSelectionSection = card.closest('.role-selection-cards');
            const recordingSection = document.getElementById(`recording-section-${situation}`);
            
            roleSelectionSection.style.display = 'none';
            recordingSection.style.display = 'block';
            
            // Populate vessel info
            const roleNameDisplay = recordingSection.querySelector('.role-name-display');
            const vesselNameVal = recordingSection.querySelector('.vessel-name-val');
            const vesselMmsiVal = recordingSection.querySelector('.vessel-mmsi-val');
            const vesselCallsignVal = recordingSection.querySelector('.vessel-callsign-val');
            const recordBtn = recordingSection.querySelector('.record-message-btn');
            
            roleNameDisplay.textContent = `You are the ${role.toUpperCase()} on ${data.name}`;
            vesselNameVal.textContent = data.name;
            vesselMmsiVal.textContent = data.mmsi;
            vesselCallsignVal.textContent = data.callSign;
            recordBtn.dataset.key = key;
            
            showNotification(`Role selected: ${role.toUpperCase()}. Ready to record!`, 'success');
        });
    });

    // ==================================================
    // CHANGE ROLE BUTTONS
    // ==================================================
    const changeRoleBtns = document.querySelectorAll('.change-role-btn');
    
    changeRoleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const situation = this.dataset.situation;
            const recordingSection = document.getElementById(`recording-section-${situation}`);
            const roleSelectionSection = recordingSection.previousElementSibling;
            
            recordingSection.style.display = 'none';
            roleSelectionSection.style.display = 'block';
            
            showNotification('Role selection reset. Choose again.', 'info');
        });
    });

    // ==================================================
    // RECORD BUTTONS
    // ==================================================
    const recordBtns = document.querySelectorAll('.record-message-btn');
    
    recordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isListening) {
                showNotification('Please wait for current recording to finish', 'warning');
                return;
            }

            const key = this.dataset.key;
            const situation = this.dataset.situation;
            
            if (!key) return;
            
            const data = vesselData[key];
            if (!data) return;

            isListening = true;
            this.classList.add('listening');
            const icon = this.querySelector('i');
            const text = this.querySelector('span');
            icon.className = 'fas fa-circle';
            text.textContent = 'Listening...';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('📝 Transcript:', transcript);
                checkPronunciation(transcript, data.targetPhrase, situation);
            };

            recognition.onend = () => {
                isListening = false;
                this.classList.remove('listening');
                icon.className = 'fas fa-microphone';
                text.textContent = 'Start Recording';
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                isListening = false;
                this.classList.remove('listening');
                icon.className = 'fas fa-microphone';
                text.textContent = 'Start Recording';
                
                let errorMessage = 'Could not recognize speech.';
                if (event.error === 'no-speech') {
                    errorMessage = 'No speech detected. Please try again.';
                } else if (event.error === 'audio-capture') {
                    errorMessage = 'Microphone not found.';
                } else if (event.error === 'not-allowed') {
                    errorMessage = 'Microphone permission denied.';
                }
                
                showNotification(errorMessage, 'error');
            };

            try {
                recognition.start();
                showNotification('Listening... Speak your message!', 'info');
            } catch (e) {
                console.error('Failed to start recognition:', e);
                isListening = false;
                this.classList.remove('listening');
            }
        });
    });

    // ==================================================
    // PRONUNCIATION CHECKING
    // ==================================================
    function checkPronunciation(transcript, targetText, situation) {
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

        // Create feedback modal
        const modal = document.createElement('div');
        modal.className = 'feedback-modal';
        
        let title = '';
        let message = '';

        if (allCorrect) {
            title = '<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Excellent!</h4>';
            message = '<p style="color: #059669;">Perfect! All words correct! 🎉</p>';
        } else if (accuracy >= 50) {
            title = '<h4><i class="fa-solid fa-star" style="color: #f59e0b;"></i> Good Try!</h4>';
            message = `<p style="color: #d97706;">You got ${correctCount}/${totalCount} words (${accuracy}%). Keep practicing!</p>`;
        } else {
            title = '<h4><i class="fa-solid fa-arrows-rotate" style="color: #3b82f6;"></i> Try Again!</h4>';
            message = `<p style="color: #2563eb;">You got ${correctCount}/${totalCount} words (${accuracy}%). Practice more!</p>`;
        }
        
        const transcriptDisplay = `
            <h5>What you said:</h5>
            <p style="font-style: italic; background: #f0f9ff; border: 2px solid #bae6fd; padding: 12px; border-radius: 12px; color: #0c4a6e;">
                "${transcript}"
            </p>
        `;

        const expectedLabel = `<h5>Word comparison (${correctCount}/${totalCount} correct):</h5>`;

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

        const closeBtn = modal.querySelector('.feedback-close');
        const tryAgainBtn = modal.querySelector('.try-again-btn');

        closeBtn.addEventListener('click', () => modal.remove());
        tryAgainBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Update progress if accuracy >= 50%
        if (accuracy >= 50) {
            progressState[`situation${situation}`] = true;
            
            // Mark card as completed
            const situationCard = document.querySelector(`[data-situation="${situation}"]`);
            const roleCards = situationCard.querySelectorAll('.role-practice-card');
            roleCards.forEach(card => card.classList.add('completed'));
            
            checkCompletion();
            
            if (allCorrect) {
                playSuccessSound();
            }
        }
    }

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
        
        return newText.replace(/[.,!?"-]/g, '').replace(/\s+/g, ' ').trim();
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
        } catch (e) {}
    }

    // ==================================================
    // COMPLETION CHECK
    // ==================================================
    function checkCompletion() {
        const allComplete = progressState.situation1 && progressState.situation2;
        
        if (allComplete) {
            showContinueButton();
        }
    }

    function showContinueButton() {
        if (continueWrapper) {
            continueWrapper.style.display = 'block';
            setTimeout(() => {
                continueWrapper.classList.add('show');
            }, 100);
            
            showNotification('🎉 All situations completed! Ready to continue!', 'success');
        }
    }

    // ==================================================
    // HELPER FUNCTIONS
    // ==================================================
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

    console.log('✅ Radio Watch Duty Ready!');
});

// Notification animations
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(styles);