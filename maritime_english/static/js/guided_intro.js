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
        word = word.toLowerCase();
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
            callSignReceiver: 'SVNP4',
            targetPhrase: "this is motor vessel coralis call sign charlie lima foxtrot whisky 2 mmsi 538209100 calling motor vessel silverwind call sign sierra victor november papa 4 channel 16 over",
            reminder: "Say your vessel's name, MMSI, Call Sign, and call the other vessel clearly."
        },
        'situation1-receiver': {
            name: 'MV SILVERWIND',
            mmsi: '312985600',
            callSign: 'SVNP4',
            callSignReceiver: 'CLFW2',
            targetPhrase: "motor vessel coralis this is silverwind receiving you loud and clear over",
            reminder: "Respond clearly using the correct format."
        },
        'situation2-caller': {
            name: 'MV CRYSTAL WAVE',
            mmsi: '239814900',
            callSign: 'CWTR8',
            callSignReceiver: 'EMSK7',
            targetPhrase: "this is motor vessel crystal wave call sign charlie whisky tango romeo 8 mmsi 239814900 calling motor vessel emerald sky call sign echo mike sierra kilo 7 channel 16 over",
            reminder: "Say your vessel's name, MMSI, Call Sign, and call the other vessel clearly."
        },
        'situation2-receiver': {
            name: 'MV EMERALD SKY',
            mmsi: '519402300',
            callSign: 'EMSK7',
            callSignReceiver: 'CWTR8',
            targetPhrase: "motor vessel crystal wave this is emerald sky receiving you loud and clear over",
            reminder: "Respond clearly using the correct format."
        }
    };

    // ==================================================
    // PROGRESS TRACKING (✅ UPDATED: Per Role)
    // ==================================================
    const progressState = {
        'situation1-caller': false,
        'situation1-receiver': false,
        'situation2-caller': false,
        'situation2-receiver': false
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
    const modalCallSignReceiver = document.getElementById('modalCallSignReceiver');
    const modalActionContainer = document.getElementById('modalActionContainer');

    const audio_sidebar = new Audio();
    let isTranslated = false;
    let isListening = false;
    let currentSituation = null;
    let currentRole = null;
    let currentButton = null;

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
            currentButton = btn;
            
            openRecordModal(data, role);
        });
    });

    // ==================================================
    // OPEN RECORD MODAL
    // ==================================================
    function openRecordModal(data, role) {
        modalTitle.textContent = `You are the ${role.toUpperCase()}: ${data.name}`;
        modalVesselName.textContent = data.name;
        modalMMSI.textContent = data.mmsi;
        modalCallSign.textContent = data.callSign;
        modalCallSignReceiver.textContent = data.callSignReceiver;
        
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

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

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
    // PRONUNCIATION CHECKING (✅ UPDATED: 20% Threshold)
    // ==================================================
    function checkPronunciation(transcript, targetText) {
        const userWords = cleanAndStemText(transcript);
        const targetWords = cleanAndStemText(targetText);
        
        console.log('🔍 User words:', userWords);
        console.log('🎯 Target words:', targetWords);
        
        let resultHTML = '';
        let correctCount = 0;
        let totalCount = targetWords.length;
        const userWordsSet = new Set(userWords);

        targetWords.forEach((targetWord) => {
            if (userWordsSet.has(targetWord)) {
                resultHTML += `<span class="correct">${targetWord}</span> `;
                correctCount++;
            } else {
                resultHTML += `<span class="missing">${targetWord}</span> `;
            }
        });

        const accuracy = Math.round((correctCount / totalCount) * 100);
        const allCorrect = correctCount === totalCount;
        const passedThreshold = accuracy >= 20; // ✅ UBAH: 20% minimum (sama seperti noticing_alphabet)

        // Create feedback modal
        const feedbackModal = document.createElement('div');
        feedbackModal.className = 'feedback-modal active';
        
        let title = '';
        let message = '';
        let actionButton = '';

        // ✅ UPDATED: Sama seperti noticing_alphabet
        if (allCorrect) {
            title = '<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Excellent Work!</h4>';
            message = '<p style="color: #059669;">Perfect! You pronounced all the key words correctly. Keep up the great work! 🎉</p>';
            actionButton = '<button class="continue-task-btn"><i class="fa-solid fa-check"></i> Mark as Complete</button>';
        } else if (passedThreshold) {
            title = '<h4><i class="fa-solid fa-star" style="color: #f59e0b;"></i> Good Job!</h4>';
            message = `<p style="color: #d97706;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). That's good enough to continue! You can retry for a perfect score or move on.</p>`;
            actionButton = `
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="try-again-btn"><i class="fa-solid fa-microphone"></i> Try Again</button>
                    <button class="continue-task-btn"><i class="fa-solid fa-check"></i> Mark as Complete</button>
                </div>
            `;
        } else {
            title = '<h4><i class="fa-solid fa-exclamation-triangle" style="color: #ef4444;"></i> Keep Practicing!</h4>';
            message = `<p style="color: #dc2626;">You got ${correctCount} out of ${totalCount} words (${accuracy}%). You need at least 20% to continue. Don't worry! Listen to the example again and try once more.</p>`;
            actionButton = '<button class="try-again-btn"><i class="fa-solid fa-microphone"></i> Try Again</button>';
        }
        
        const transcriptDisplay = `
            <h5>What you said:</h5>
            <p style="font-style: italic; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; padding: 12px; border-radius: 12px; color: #0c4a6e; word-wrap: break-word;">
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

        const closeBtn = feedbackModal.querySelector('.feedback-close');
        const tryAgainBtn = feedbackModal.querySelector('.try-again-btn');
        const continueTaskBtn = feedbackModal.querySelector('.continue-task-btn');

        closeBtn.addEventListener('click', () => {
            feedbackModal.classList.remove('active');
            setTimeout(() => feedbackModal.remove(), 300);
        });

        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
                feedbackModal.classList.remove('active');
                setTimeout(() => {
                    feedbackModal.remove();
                    const key = `situation${currentSituation}-${currentRole}`;
                    const data = vesselData[key];
                    openRecordModal(data, currentRole);
                }, 300);
            });
        }

        // ✅ MARK AS COMPLETE BUTTON
        if (continueTaskBtn) {
            continueTaskBtn.addEventListener('click', () => {
                feedbackModal.classList.remove('active');
                setTimeout(() => {
                    feedbackModal.remove();
                    markTaskAsCompleted();
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
    // ✅ MARK TASK AS COMPLETED (UPDATED)
    // ==================================================
    function markTaskAsCompleted() {
        const taskKey = `situation${currentSituation}-${currentRole}`;
        
        // ✅ PREVENT DOUBLE COMPLETION
        if (progressState[taskKey]) {
            console.log(`${taskKey} already completed`);
            return;
        }
        
        // ✅ MARK AS COMPLETED
        progressState[taskKey] = true;
        
        // ✅ ADD COMPLETED CLASS TO BUTTON
        if (currentButton) {
            currentButton.classList.add('completed');
        }
        
        showNotification(`✔ ${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} completed! ✓`, 'success');
        console.log(`✅ ${taskKey} marked as completed`);
        console.log('📊 Current Progress:', progressState);
        
        // ✅ CHECK COMPLETION
        checkCompletion();
    }

    // ==================================================
    // CLEAN AND STEM TEXT
    // ==================================================
    function cleanAndStemText(text) {
        text = text.toLowerCase();
        text = text.replace(/[.,!?"-]/g, '');
        let words = text.split(/\s+/).filter(word => word.length > 0);
        
        words = words.map(word => {
            if (/^\d+$/.test(word)) return word;
            if (/\d/.test(word)) return word;
            
            const numMap = {
                'zero': '0', 'one': '1', 'two': '2', 'three': '3',
                'four': '4', 'five': '5', 'six': '6', 'seven': '7',
                'eight': '8', 'nine': '9'
            };
            
            if (numMap[word]) return numMap[word];
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
    // ✅ COMPLETION CHECK (UPDATED)
    // ==================================================
    function checkCompletion() {
        // ✅ CEK: Semua 4 role sudah completed
        const allComplete = 
            progressState['situation1-caller'] &&
            progressState['situation1-receiver'] &&
            progressState['situation2-caller'] &&
            progressState['situation2-receiver'];
        
        console.log('🔍 Checking completion:', {
            'situation1-caller': progressState['situation1-caller'],
            'situation1-receiver': progressState['situation1-receiver'],
            'situation2-caller': progressState['situation2-caller'],
            'situation2-receiver': progressState['situation2-receiver'],
            allComplete: allComplete
        });
        
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
            console.log('✅ Continue button shown!');
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

// Notification animations + Button Styling (SAMA SEPERTI SEBELUMNYA)
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
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .modal-record-btn {
        width: 100%;
        padding: 18px 30px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
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

    .try-again-btn,
    .continue-task-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 14px 28px;
        border: none;
        border-radius: 12px;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .try-again-btn {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .try-again-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .continue-task-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .continue-task-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .try-again-btn i,
    .continue-task-btn i {
        transition: transform 0.3s ease;
    }

    .continue-task-btn:hover i {
        transform: scale(1.2);
    }

    .try-again-btn:hover i {
        transform: rotate(360deg);
    }

    .record-role-btn.completed {
        position: relative;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
        color: white !important;
        border-color: #059669 !important;
        cursor: default;
        pointer-events: none;
    }

    .record-role-btn.completed::after {
        content: '\\f00c';
        font-family: 'Font Awesome 5 Free';
        font-weight: 900;
        position: absolute;
        top: -8px;
        right: -8px;
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        animation: checkmarkPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    @keyframes checkmarkPop {
        0% {
            transform: scale(0);
            opacity: 0;
        }
        50% {
            transform: scale(1.2);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    .diff-output {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        text-align: left;
        line-height: 2;
        font-family: 'Roboto Mono', monospace;
        font-size: 1rem;
    }

    .diff-output .correct {
        color: #10b981;
        background: #d1fae5;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 600;
        margin-right: 5px;
    }

    .diff-output .missing {
        color: #ef4444;
        background: #fee2e2;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 600;
        margin-right: 5px;
        text-decoration: line-through;
    }

    @media (max-width: 768px) {
        .try-again-btn,
        .continue-task-btn {
            width: 100%;
            padding: 12px 20px;
            font-size: 0.95rem;
        }
        
        .record-role-btn.completed::after {
            width: 24px;
            height: 24px;
            font-size: 0.7rem;
            top: -6px;
            right: -6px;
        }
    }
`;
document.head.appendChild(styles);