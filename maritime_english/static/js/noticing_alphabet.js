// ========================================
// VHF ROLEPLAY PRACTICE JAVASCRIPT
// With Record/Play buttons and Progress Tracking
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎙️ VHF Roleplay Practice Initialized!');

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser does not support Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
        document.querySelectorAll('.record-exchange-btn').forEach(btn => {
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
    // VESSEL DATA
    // ==================================================
    const vesselData = {
        'example-caller': {
            name: 'HORIZON',
            mmsi: '248105900',
            callSign: 'YBON9',
            callSignReceiver: 'LAPW5',
            audio: '/static/data/audio/unit1/vhf_caller.wav',
            targetPhrase: null,
            transcript: ["This is Motor Vessel Horizon, Call Sign Yankee Bravo Oscar November Niner. MMSI Too Fower Ait Wun Zeero Fife Niner Zeero Zeero. Calling Motor Vessel Antares. Call sign Lima Alfa Papa Whisky Fife. Channel Wun Six. Over"]
        },
        'example-receiver': {
            name: 'ANTARES',
            mmsi: '257689000',
            callSign: 'LAPW5',
            callSignReceiver: 'YBON9',
            audio: '/static/data/audio/unit1/vhf_receiver.wav',
            targetPhrase: null,
            transcript: ["Motor Vessel Horizon, this is Antares. Receiving you loud and clear. Over."]
        },
        'part1-caller': {
            name: 'ADOUR',
            mmsi: '635005000',
            callSign: 'FQEP',
            callSignReceiver: 'SWFP',
            audio: null,
            targetPhrase: "This is Motor Vessel ADOUR 635005000 Foxtrot Quebec Echo Papa calling Motor Vessel APOLLON call sign Sierra Whisky Foxtrot Papa channel one six over",
        },
        'part1-receiver': {
            name: 'APOLLON',
            mmsi: '237002600',
            callSign: 'SWFP',
            callSignReceiver: 'FQEP',
            audio: '/static/data/audio/unit1/receiver_response_1.wav',
            targetPhrase: null,
        },
        'part2-caller': {
            name: 'BAYSTAR',
            mmsi: '440983000',
            callSign: 'DSON9',
            callSignReceiver: 'NSAC',
            audio: '/static/data/audio/unit1/caller_message_2.wav',
            targetPhrase: null
        },
        'part2-receiver': {
            name: 'SUNSHINE',
            mmsi: '369855000',
            callSign: 'NSAC',
            callSignReceiver: 'DSON9',
            audio: null,
            targetPhrase: "Motor Vessel BAYSTAR this is SUNSHINE. Receiving you loud and clear over"
        }
    };

    // ==================================================
    // PROGRESS TRACKING
    // ==================================================
    const progressState = {
        examplePlayed: false,
        part1CallerRecorded: false,
        part1ReceiverPlayed: false,
        part2CallerPlayed: false,
        part2ReceiverRecorded: false
    };

    // ==================================================
    // ELEMENTS
    // ==================================================
    
    // Sidebar
    const captainAudioBtn = document.getElementById('captain-audio-btn');
    const translateBtn = document.getElementById('translate-btn');
    const speechTextDrill = document.querySelector('.speech-text-drill');
    const instructionTextVhf = document.querySelector('.instruction-text-vhf');
    const radioWavesAnim = document.querySelector('.radio-waves');

    // Cards
    const allVesselCards = document.querySelectorAll('.vessel-exchange-card');
    const playButtons = document.querySelectorAll('.play-exchange-btn');
    const recordButtons = document.querySelectorAll('.record-exchange-btn');

    // Modal
    const modal = document.getElementById('exchangeModal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const closeModalBtn = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalVesselName = document.getElementById('modalVesselName');
    const modalMMSI = document.getElementById('modalMMSI');
    const modalCallSign = document.getElementById('modalCallSign');
    const modalCallSignReceiver = document.getElementById('modalCallSignReceiver');
    const modalActionContainer = document.getElementById('modalActionContainer');

    // Continue Button
    const continueWrapper = document.getElementById('continueWrapper');

    // Audio
    const audio_sidebar = new Audio();
    let audio_current = new Audio();
    let isAudioPlaying = false;
    let isListening = false;
    let currentRecordingKey = null;
    let currentRecordButton = null; // ✅ TAMBAHAN: Track button yang sedang digunakan

    // ==================================================
    // TEXT CONTENT
    // ==================================================
    const originalText_captain = `Alright, cadets! This time you will practice real radio exchanges, sending and receiving messages just like on board! Listen carefully and follow each step with confidence.`;
    const translatedText_captain = `Baik, kadet! Kali ini kalian akan berlatih pertukaran radio yang sesungguhnya, mengirim dan menerima pesan seperti di kapal! Dengarkan baik-baik dan ikuti setiap langkah dengan percaya diri.`;

    const originalText_instruction = `Listen to the radio exchange between two vessels. Notice how each vessel identifies itself and responds. Then practice your role!`;
    const translatedText_instruction = `Dengarkan pertukaran radio antara dua kapal. Perhatikan bagaimana setiap kapal mengidentifikasi diri dan merespons. Lalu praktikkan peranmu!`;

    let isTranslated = false;

    // Audio Path
    const audioPath_captain = '/static/data/audio/unit1/input_alphabet_intro.wav';

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================
    if (captainAudioBtn) {
        captainAudioBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (audio_sidebar.paused) {
                stopAllAudioAndSpeech();
                audio_sidebar.src = audioPath_captain;
                audio_sidebar.play()
                    .then(() => {
                        icon.classList.remove('fa-play');
                        icon.classList.add('fa-pause');
                        this.classList.add('playing');
                        if (radioWavesAnim) radioWavesAnim.classList.add('active');
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_sidebar.pause();
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                this.classList.remove('playing');
                if (radioWavesAnim) radioWavesAnim.classList.remove('active');
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            const icon = captainAudioBtn.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            captainAudioBtn.classList.remove('playing');
            if (radioWavesAnim) radioWavesAnim.classList.remove('active');
        });
    }

    if (translateBtn) {
        translateBtn.addEventListener('click', function() {
            stopAllAudioAndSpeech();
            
            isTranslated = !isTranslated;
            
            fadeTransition(speechTextDrill, () => {
                speechTextDrill.textContent = isTranslated ? translatedText_captain : originalText_captain;
            });

            if (instructionTextVhf) {
                fadeTransition(instructionTextVhf, () => {
                    instructionTextVhf.textContent = isTranslated ? translatedText_instruction : originalText_instruction;
                });
            }

            addClickEffect(this);
        });
    }

    // ==================================================
    // PLAY BUTTONS - OPEN MODAL WITH PLAY FUNCTION
    // ==================================================
    playButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = button.closest('.vessel-exchange-card');
            const example = card.dataset.example;
            const role = card.dataset.role;
            const key = `${example}-${role}`;
            const data = vesselData[key];

            if (data && data.audio) {
                openModalForPlay(data, role, example, button); // ✅ Pass button
            }
        });
    });

    // ==================================================
    // RECORD BUTTONS - OPEN MODAL WITH RECORD FUNCTION
    // ==================================================
    recordButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = button.closest('.vessel-exchange-card');
            const example = card.dataset.example;
            const role = card.dataset.role;
            const key = `${example}-${role}`;
            const data = vesselData[key];

            if (data) {
                openModalForRecord(data, role, example, key, button); // ✅ Pass button
            }
        });
    });

    // ==================================================
    // MODAL FUNCTIONS - PLAY
    // ==================================================
    function openModalForPlay(data, role, example, button) { // ✅ Accept button
        stopAllAudioAndSpeech();
        currentRecordButton = button; // ✅ Store button reference

        // Populate modal
        modalTitle.textContent = `${role === 'caller' ? 'The Caller' : 'The Receiver'}: ${data.name}`;
        modalVesselName.textContent = data.name;
        modalMMSI.textContent = data.mmsi;
        modalCallSign.textContent = data.callSign;
        modalCallSignReceiver.textContent = data.callSignReceiver;
        
        // Clear action container
        modalActionContainer.innerHTML = '';
        
        // Tampilkan transcript HANYA untuk example
        if (example === 'example' && data.transcript) {
            const transcriptHTML = `
                <div class="transcript-box">
                    <div class="transcript-box-header">
                        <i class="fas fa-file-alt"></i>
                        <span>Message Transcript</span>
                    </div>
                    <div class="transcript-box-content">
                        ${data.transcript.map(line => `<p>${line}</p>`).join('')}
                    </div>
                </div>
            `;
            modalActionContainer.innerHTML = transcriptHTML;
        }

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Play audio
        audio_current.src = data.audio;
        audio_current.play()
            .then(() => {
                isAudioPlaying = true;
            })
            .catch(error => {
                console.error('❌ Audio playback error:', error);
                showNotification('Could not play audio. File may not exist.', 'error');
            });

        // Track completion
        audio_current.addEventListener('ended', () => {
            isAudioPlaying = false;
            
            // ✅ MARK BUTTON AS COMPLETED
            if (button) {
                button.classList.add('completed');
            }
            
            // Update progress
            if (example === 'example') {
                progressState.examplePlayed = true;
            } else if (example === 'part1' && role === 'receiver') {
                progressState.part1ReceiverPlayed = true;
            } else if (example === 'part2' && role === 'caller') {
                progressState.part2CallerPlayed = true;
            }
            
            updateProgress();
            checkCompletion();
        }, { once: true });
    }

    // ==================================================
    // MODAL FUNCTIONS - RECORD
    // ==================================================
    function openModalForRecord(data, role, example, key, button) { // ✅ Accept button
        stopAllAudioAndSpeech();
        currentRecordingKey = key;
        currentRecordButton = button; // ✅ Store button reference

        // Populate modal
        modalTitle.textContent = `You are ${role === 'caller' ? 'the Caller' : 'the Receiver'}: ${data.name}`;
        modalVesselName.textContent = data.name;
        modalMMSI.textContent = data.mmsi;
        modalCallSign.textContent = data.callSign;
        modalCallSignReceiver.textContent = data.callSignReceiver;
        
        // Create record button section
        modalActionContainer.innerHTML = `
            <div class="modal-record-section">
                <p class="modal-record-instruction">
                    <i class="fas fa-info-circle"></i>
                    Read the vessel information above and prepare your radio message. When ready, press the button below to record your message.
                </p>
                <button class="modal-record-btn" id="modalRecordBtn">
                    <i class="fas fa-microphone"></i>
                    <span>Start Recording</span>
                </button>
            </div>
        `;

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add event listener to modal record button
        const modalRecordBtn = document.getElementById('modalRecordBtn');
        modalRecordBtn.addEventListener('click', function() {
            startRecording(data, role, example, this);
        });
    }

    // ==================================================
    // SPEECH RECOGNITION
    // ==================================================
    function startRecording(data, role, example, button) {
        if (isListening) {
            showNotification('Please wait for the current recording to finish', 'warning');
            return;
        }

        isListening = true;
        
        // Update button state
        button.classList.add('recording');
        const icon = button.querySelector('i');
        const text = button.querySelector('span');
        icon.classList.remove('fa-microphone');
        icon.classList.add('fa-circle');
        text.textContent = 'Listening...';

        // Setup recognition handlers
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('📝 Transcript:', transcript);
            checkPronunciation(transcript, data.targetPhrase, example, role);
        };

        recognition.onend = () => {
            isListening = false;
            button.classList.remove('recording');
            icon.classList.remove('fa-circle');
            icon.classList.add('fa-microphone');
            text.textContent = 'Start Recording';
        };

        recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            isListening = false;
            button.classList.remove('recording');
            icon.classList.remove('fa-circle');
            icon.classList.add('fa-microphone');
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

        // Start recognition
        try {
            recognition.start();
            showNotification('Listening... Speak your radio message!', 'info');
        } catch (e) {
            console.error('Failed to start recognition:', e);
            isListening = false;
            button.classList.remove('recording');
            icon.classList.remove('fa-circle');
            icon.classList.add('fa-microphone');
            text.textContent = 'Start Recording';
        }
    }

    // ==================================================
    // PRONUNCIATION CHECKING (✅ UPDATED)
    // ==================================================
    function checkPronunciation(transcript, targetText, example, role) {
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
        const passedThreshold = accuracy >= 20; // ✅ 20% MINIMUM

        // Close main modal first
        closeModal();

        // Create feedback modal
        const feedbackModal = document.createElement('div');
        feedbackModal.className = 'feedback-modal active';
        
        let title = '';
        let message = '';
        let actionButton = '';
        const roleLabel = role === 'caller' ? 'Caller' : 'Receiver';

        // ✅ UPDATED: Dengan Mark as Complete
        if (allCorrect) {
            title = `<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Excellent ${roleLabel}!</h4>`;
            message = `<p style="color: #059669;">Perfect radio communication! You pronounced all key words correctly. 🎉</p>`;
            actionButton = '<button class="continue-task-btn"><i class="fa-solid fa-check"></i> Mark as Complete</button>';
        } else if (passedThreshold) {
            title = `<h4><i class="fa-solid fa-star" style="color: #f59e0b;"></i> Good ${roleLabel}!</h4>`;
            message = `<p style="color: #d97706;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). That's good enough to continue! You can retry for a perfect score or move on.</p>`;
            actionButton = `
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="try-again-btn"><i class="fa-solid fa-microphone"></i> Try Again</button>
                    <button class="continue-task-btn"><i class="fa-solid fa-check"></i> Mark as Complete</button>
                </div>
            `;
        } else {
            title = `<h4><i class="fa-solid fa-exclamation-triangle" style="color: #ef4444;"></i> Keep Practicing!</h4>`;
            message = `<p style="color: #dc2626;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). You need at least 20% to continue. Don't worry! Try again!</p>`;
            actionButton = '<button class="try-again-btn"><i class="fa-solid fa-microphone"></i> Try Again</button>';
        }
        
        const transcriptDisplay = `
            <h5>What you said:</h5>
            <p style="font-style: italic; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; padding: 12px; border-radius: 12px; word-wrap: break-word; color: #0c4a6e;">
                "${transcript}"
            </p>
        `;

        const expectedLabel = `<h5>Word-by-word comparison (${correctCount}/${totalCount} correct - ${accuracy}%):</h5>`;

        feedbackModal.innerHTML = `
            <div class="feedback-modal-content">
                <button class="feedback-close">&times;</button>
                <div class="mic-result-box">
                    ${title}
                    ${message}
                    ${transcriptDisplay}
                    ${expectedLabel}
                    <div class="diff-output">${resultHTML}</div>
                    ${actionButton}
                </div>
            </div>
        `;
        
        document.body.appendChild(feedbackModal);

        // Event listeners
        const closeBtn = feedbackModal.querySelector('.feedback-close');
        const tryAgainBtn = feedbackModal.querySelector('.try-again-btn');

        closeBtn.addEventListener('click', () => {
            feedbackModal.classList.remove('active');
            setTimeout(() => feedbackModal.remove(), 300);
        });

        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
                feedbackModal.classList.remove('active');
                setTimeout(() => {
                    feedbackModal.remove();
                    // Re-open recording modal
                    const data = vesselData[currentRecordingKey];
                    const [ex, r] = currentRecordingKey.split('-');
                    openModalForRecord(data, r, ex, currentRecordingKey, currentRecordButton);
                }, 300);
            });
        }

        // ✅ MARK AS COMPLETE BUTTON
        const continueTaskBtn = feedbackModal.querySelector('.continue-task-btn');
        if (continueTaskBtn) {
            continueTaskBtn.addEventListener('click', () => {
                feedbackModal.classList.remove('active');
                setTimeout(() => {
                    feedbackModal.remove();
                    markTaskAsCompleted(example, role); // ✅ Mark task
                }, 300);
            });
        }

        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                feedbackModal.classList.remove('active');
                setTimeout(() => feedbackModal.remove(), 300);
            }
        });

        if (allCorrect) {
            playSuccessSound();
        }
    }

    // ==================================================
    // ✅ MARK TASK AS COMPLETED (NEW)
    // ==================================================
    function markTaskAsCompleted(example, role) {
        // ✅ PREVENT DOUBLE COMPLETION
        if (example === 'part1' && role === 'caller' && progressState.part1CallerRecorded) {
            console.log('Part1 Caller already completed');
            return;
        }
        if (example === 'part2' && role === 'receiver' && progressState.part2ReceiverRecorded) {
            console.log('Part2 Receiver already completed');
            return;
        }
        
        // ✅ MARK AS COMPLETED
        if (example === 'part1' && role === 'caller') {
            progressState.part1CallerRecorded = true;
            if (currentRecordButton) currentRecordButton.classList.add('completed');
            showNotification('Part 1 Caller completed! ✓', 'success');
            console.log('✅ Part 1 Caller marked as completed');
        } else if (example === 'part2' && role === 'receiver') {
            progressState.part2ReceiverRecorded = true;
            if (currentRecordButton) currentRecordButton.classList.add('completed');
            showNotification('Part 2 Receiver completed! ✓', 'success');
            console.log('✅ Part 2 Receiver marked as completed');
        }
        
        // ✅ CHECK IF ALL DONE
        updateProgress();
        checkCompletion();
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
        
        return newText.replace(/[.,!?"-]/g, '')
                      .replace(/\s+/g, ' ')
                      .trim();
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
    // PROGRESS TRACKING
    // ==================================================
    function updateProgress() {
        console.log('📊 Progress:', progressState);
    }

    function checkCompletion() {
        const allComplete = 
            progressState.examplePlayed &&
            progressState.part1CallerRecorded &&
            progressState.part1ReceiverPlayed &&
            progressState.part2CallerPlayed &&
            progressState.part2ReceiverRecorded;

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
            
            showNotification('🎉 Excellent work! You completed all radio exchanges!', 'success');
            console.log('✅ All tasks completed! Continue button shown.');
        }
    }

    // ==================================================
    // MODAL CLOSE
    // ==================================================
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        stopAllAudioAndSpeech();
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // ==================================================
    // STOP ALL AUDIO AND SPEECH
    // ==================================================
    function stopAllAudioAndSpeech() {
        // Stop all audio
        if (!audio_current.paused) {
            audio_current.pause();
            audio_current.currentTime = 0;
        }
        isAudioPlaying = false;

        if (!audio_sidebar.paused) {
            audio_sidebar.pause();
            audio_sidebar.currentTime = 0;
        }
        
        if (captainAudioBtn) {
            const icon = captainAudioBtn.querySelector('i');
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            captainAudioBtn.classList.remove('playing');
        }
        
        if (radioWavesAnim) radioWavesAnim.classList.remove('active');

        // Stop speech recognition
        if (isListening && recognition) {
            try {
                recognition.stop();
            } catch (e) {
                console.warn('Recognition already stopped');
            }
            isListening = false;
        }
    }

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
    console.log('✅ VHF Roleplay Practice Ready!');
    console.log('💡 Tip: Press T to translate instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('🎯 Complete all exchanges to continue!');
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