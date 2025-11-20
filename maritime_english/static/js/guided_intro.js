// ========================================
// GUIDED INTRO JAVASCRIPT - UPDATED WITH STEMMING & NUMBER HANDLING
// Radio Watch Duty with Popup Modal
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
    // SIMPLE STEMMER - Remove common suffixes
    // ==================================================
    function simpleStem(word) {
        // Convert to lowercase
        word = word.toLowerCase();
        
        // Remove common suffixes
        const suffixes = ['ed', 'ing', 's', 'es', 'd'];
        
        for (const suffix of suffixes) {
            if (word.endsWith(suffix) && word.length > suffix.length + 2) {
                return word.slice(0, -suffix.length);
            }
        }
        
        return word;
    }

    // ==================================================
    // VESSEL DATA
    // ==================================================
    const vesselData = {
        'situation1-caller': {
            name: 'MV CORALIS',
            mmsi: '538209100',
            callSign: 'CLFW2',
            // Target phrase HANYA pakai huruf phonetic, bukan convert
            targetPhrase: "this is motor vessel coralis call sign charlie lima foxtrot whisky 2 mmsi 538209100 calling motor vessel silverwind call sign sierra victor november papa 4 channel 16 over",
            reminder: "Say your vessel's name, MMSI, Call Sign, and call the other vessel clearly."
        },
        'situation1-receiver': {
            name: 'MV SILVERWIND',
            mmsi: '312985600',
            callSign: 'SVNP4',
            targetPhrase: "motor vessel coralis this is silverwind receiving you loud and clear over",
            reminder: "Respond clearly using the correct format."
        },
        'situation2-caller': {
            name: 'MV CRYSTAL WAVE',
            mmsi: '239814900',
            callSign: 'CWTR8',
            targetPhrase: "this is motor vessel crystal wave call sign charlie whisky tango romeo 8 mmsi 239814900 calling motor vessel emerald sky call sign echo mike sierra kilo 7 channel 16 over",
            reminder: "Say your vessel's name, MMSI, Call Sign, and call the other vessel clearly."
        },
        'situation2-receiver': {
            name: 'MV EMERALD SKY',
            mmsi: '519402300',
            callSign: 'EMSK7',
            targetPhrase: "motor vessel crystal wave this is emerald sky receiving you loud and clear over",
            reminder: "Respond clearly using the correct format."
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

    // Modal elements
    const modal = document.getElementById('exchangeModal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const closeModalBtn = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalVesselName = document.getElementById('modalVesselName');
    const modalMMSI = document.getElementById('modalMMSI');
    const modalCallSign = document.getElementById('modalCallSign');
    const modalActionContainer = document.getElementById('modalActionContainer');

    const audio_sidebar = new Audio();
    let isTranslated = false;
    let isListening = false;
    let currentSituation = null;
    let currentRole = null;

    // ==================================================
    // TEXT CONTENT
    // ==================================================
    const originalText_sidebar = "Cadet, this time you'll sail through a real-life radio situation. Read each story carefully and imagine what's happening at sea. Then, decide your role — caller or receiver — and practice your radio message. Remember, clear radio communication can save lives!";
    const translatedText_sidebar = "Taruna, kali ini kamu akan berlayar melalui situasi radio yang nyata. Bacalah setiap cerita dengan cermat dan bayangkan apa yang sedang terjadi di laut. Setelah itu, tentukan peranmu — sebagai pemanggil atau penerima — lalu latih pesan radiomu. Ingat, komunikasi radio yang jelas dapat menyelamatkan nyawa!";

    const originalText_instruction = "Read the situation carefully. Choose your role — caller or receiver — and perform the message aloud using the correct maritime alphabet and number pronunciation. You may switch roles to practice both sides.";
    const translatedText_instruction = "Bacalah situasi dengan cermat. Pilih peranmu — sebagai pemanggil (caller) atau penerima (receiver) — lalu ucapkan pesan tersebut dengan lantang menggunakan pengucapan alfabet dan angka maritim yang benar. Kamu dapat berganti peran untuk berlatih keduanya.";

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
    // RECORD ROLE BUTTONS - OPEN POPUP
    // ==================================================
    const recordRoleBtns = document.querySelectorAll('.record-role-btn');
    
    recordRoleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const card = btn.closest('.role-practice-card');
            const situation = card.dataset.situation;
            const role = card.dataset.role;
            const key = `situation${situation}-${role}`;
            const data = vesselData[key];
            
            if (!data) return;
            
            currentSituation = situation;
            currentRole = role;
            
            openRecordModal(data, role);
        });
    });

    // ==================================================
    // OPEN RECORD MODAL
    // ==================================================
    function openRecordModal(data, role) {
        // Populate modal
        modalTitle.textContent = `You are the ${role.toUpperCase()}: ${data.name}`;
        modalVesselName.textContent = data.name;
        modalMMSI.textContent = data.mmsi;
        modalCallSign.textContent = data.callSign;
        
        // Create reminder + record button
        modalActionContainer.innerHTML = `
            <div class="modal-reminder">
                <i class="fas fa-lightbulb"></i>
                <p>${data.reminder}</p>
            </div>
            <button class="modal-record-btn" id="modalRecordBtn">
                <i class="fas fa-microphone"></i>
                <span>Start Recording</span>
            </button>
        `;

        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add event listener to record button
        const modalRecordBtn = document.getElementById('modalRecordBtn');
        modalRecordBtn.addEventListener('click', function() {
            startRecording(data, this);
        });
    }

    // ==================================================
    // START RECORDING
    // ==================================================
    function startRecording(data, button) {
        if (isListening) {
            showNotification('Please wait for current recording to finish', 'warning');
            return;
        }

        isListening = true;
        button.classList.add('recording');
        const icon = button.querySelector('i');
        const text = button.querySelector('span');
        icon.className = 'fas fa-circle';
        text.textContent = 'Listening...';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('📝 Transcript:', transcript);
            closeModal();
            checkPronunciation(transcript, data.targetPhrase);
        };

        recognition.onend = () => {
            isListening = false;
            button.classList.remove('recording');
            icon.className = 'fas fa-microphone';
            text.textContent = 'Start Recording';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            button.classList.remove('recording');
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
            button.classList.remove('recording');
        }
    }

    // ==================================================
    // PRONUNCIATION CHECKING WITH STEMMING
    // ==================================================
    function checkPronunciation(transcript, targetText) {
        // Clean dan stem kedua text
        const userWords = cleanAndStemText(transcript);
        const targetWords = cleanAndStemText(targetText);
        
        console.log('🔍 User words:', userWords);
        console.log('🎯 Target words:', targetWords);
        
        let resultHTML = '';
        let correctCount = 0;
        let totalCount = targetWords.length;

        // Buat Set dari user words untuk quick lookup
        const userWordsSet = new Set(userWords);

        targetWords.forEach((targetWord, index) => {
            if (userWordsSet.has(targetWord)) {
                resultHTML += `<span class="correct">${targetWord}</span> `;
                correctCount++;
            } else {
                resultHTML += `<span class="missing">${targetWord}</span> `;
            }
        });

        const accuracy = Math.round((correctCount / totalCount) * 100);
        const allCorrect = correctCount === totalCount;

        // Create feedback modal
        const feedbackModal = document.createElement('div');
        feedbackModal.className = 'feedback-modal';
        
        let title = '';
        let message = '';

        if (allCorrect) {
            title = '<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Excellent!</h4>';
            message = '<p style="color: #059669;">Perfect! All words correct! 🎉</p>';
        } else if (accuracy >= 10) {
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

        feedbackModal.innerHTML = `
            <div class="feedback-modal-content">
                <button class="feedback-close">&times;</button>
                <div class="mic-result-box">
                    ${title}
                    ${message}
                    ${transcriptDisplay}
                    ${expectedLabel}
                    <div class="diff-output">${resultHTML}</div>

                    <div class="feedback-btn-row">
                        <button class="try-again-btn">
                            <i class="fa-solid fa-rotate-left"></i> Try Again
                        </button>

                        <button class="mark-complete-btn">
                            <i class="fa-solid fa-check"></i> Mark as Completed
                        </button>
                    </div>
                </div>
            </div>
        `;

        
        document.body.appendChild(feedbackModal);

        const closeBtn = feedbackModal.querySelector('.feedback-close');
        const tryAgainBtn = feedbackModal.querySelector('.try-again-btn');

        const markCompleteBtn = feedbackModal.querySelector('.mark-complete-btn');

        markCompleteBtn.addEventListener('click', () => {
            feedbackModal.remove();

            // Mark situation as completed
            progressState[`situation${currentSituation}`] = true;

            showNotification(`✔ Situation ${currentSituation} marked as completed!`, 'success');

            checkCompletion();
        });


        closeBtn.addEventListener('click', () => feedbackModal.remove());
        tryAgainBtn.addEventListener('click', () => {
            feedbackModal.remove();
            // Re-open modal
            const key = `situation${currentSituation}-${currentRole}`;
            const data = vesselData[key];
            openRecordModal(data, currentRole);
        });
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) feedbackModal.remove();
        });

        // Update progress if accuracy >= 10%
        if (accuracy >= 10) {
            progressState[`situation${currentSituation}`] = true;
            
            // Mark cards as completed
            const situationCard = document.querySelector(`[data-situation="${currentSituation}"]`);
            if (situationCard) {
                const roleCards = situationCard.closest('.situation-card').querySelectorAll('.role-practice-card');
                roleCards.forEach(card => card.classList.add('completed'));
            }
            
            checkCompletion();
            
            if (allCorrect) {
                playSuccessSound();
            }
        }
    }

    // ==================================================
    // CLEAN AND STEM TEXT - NEW FUNCTION
    // ==================================================
    function cleanAndStemText(text) {
        // Lowercase
        text = text.toLowerCase();
        
        // Remove punctuation
        text = text.replace(/[.,!?"-]/g, '');
        
        // Split into words
        let words = text.split(/\s+/).filter(word => word.length > 0);
        
        // Process each word
        words = words.map(word => {
            // Jika kata adalah angka (pure number), keep as is
            if (/^\d+$/.test(word)) {
                return word;
            }
            
            // Jika kata mengandung angka dan huruf (misal: 2a, b4), keep as is
            if (/\d/.test(word)) {
                return word;
            }
            
            // Convert number words to digits (optional, tapi biasanya speech recog langsung angka)
            const numMap = {
                'zero': '0', 'one': '1', 'two': '2', 'three': '3',
                'four': '4', 'five': '5', 'six': '6', 'seven': '7',
                'eight': '8', 'nine': '9'
            };
            
            if (numMap[word]) {
                return numMap[word];
            }
            
            // Stem the word (remove common suffixes)
            return simpleStem(word);
        });
        
        return words;
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
    // MODAL CLOSE
    // ==================================================
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Stop recognition if active
        if (isListening) {
            try {
                recognition.stop();
            } catch (e) {}
            isListening = false;
        }
    }

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

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
                continueWrapper.style.opacity = '1';
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
    
    .modal-record-btn {
        width: 100%;
        padding: 18px 30px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: var(--white);
        border: none;
        border-radius: 16px;
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3);
    }
    
    .modal-record-btn:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        transform: translateY(-3px);
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
    }
    
    .modal-record-btn.recording {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        animation: recordPulse 1.5s ease infinite;
    }
    
    .modal-record-btn i {
        font-size: 1.4rem;
    }
    
    @keyframes recordPulse {
        0%, 100% {
            box-shadow: 0 6px 20px rgba(239, 68, 68, 0.3), 0 0 0 0 rgba(239, 68, 68, 0.4);
        }
        50% {
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4), 0 0 0 20px rgba(239, 68, 68, 0);
        }
    }
`;

styles.textContent += `
    .feedback-btn-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 18px;
    }

    .mark-complete-btn {
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: 0.2s;
    }

    .mark-complete-btn:hover {
        background: #059669;
    }
`;

document.head.appendChild(styles);