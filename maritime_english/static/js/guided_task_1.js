// ========================================
// MODERN GUIDED TASK 1 JAVASCRIPT
// Radio Readiness Check - Quiz Interface
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Radio Readiness Check Initialized!');

    // ========== WARNING MODAL ==========
    const warningModal = document.getElementById('warningModal');
    const proceedBtn = document.getElementById('proceedAssessment');
    const cancelBtn = document.getElementById('cancelAssessment');
    
    // Show warning modal on load
    if (warningModal) {
        // Hide main content initially
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.opacity = '0';
            mainContent.style.pointerEvents = 'none';
        }
        
        proceedBtn.addEventListener('click', () => {
            warningModal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                warningModal.remove();
                if (mainContent) {
                    mainContent.style.opacity = '1';
                    mainContent.style.pointerEvents = 'auto';
                }
            }, 300);
        });
        
        cancelBtn.addEventListener('click', () => {
            window.location.href = `/learn/unit/${window.UNIT_ID}/guided_intro`;
        });
    }

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser tidak mendukung Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
    }

    const recognition = window.SpeechRecognition ? new SpeechRecognition() : null;
    if (recognition) {
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    }

    // ==================================================
    // ELEMENTS & STATE
    // ==================================================
    const playBtn_sidebar = document.getElementById('captain-audio-btn');
    const translateBtn_sidebar = document.getElementById('translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-drill');
    const instructionText_activity = document.querySelector('.instruction-text-vhf');

    const taskNavButtons = document.querySelectorAll('.task-nav-button');
    const taskPanels = document.querySelectorAll('.task-panel');
    
    const vesselOptions = document.querySelectorAll('.vessel-option');
    const mmsiInputs = document.querySelectorAll('.mmsi-input');
    const checkBtns = document.querySelectorAll('.check-btn');
    const callsignMicBtns = document.querySelectorAll('.mic-btn-callsign');
    
    const audioPlayBtns = document.querySelectorAll('.audio-play-btn');
    const nextTaskBtns = document.querySelectorAll('.next-task-btn');
    const sendReportBtn = document.querySelector('.send-report-btn');

    const audio_sidebar = new Audio();
    const audio_task = new Audio();
    const allAudios = [audio_sidebar, audio_task];
    
    let currentLang = 'en';
    let isListening = false;
    let currentMicBtn = null;
    let isAssessmentLocked = false;

    // Progress tracking
    let progress = {
        task1: 0,
        task2: 0,
        task3: 0
    };

    // Tasks completion tracking
    let tasksCompleted = {
        task1: false,
        task2: false,
        task3: false
    };

    // Answers tracking untuk disimpan ke database
    let userAnswers = {
        task1: [], // [{questionIndex: 0, answer: 'SEAFLARE', isCorrect: true}, ...]
        task2: [], // [{questionIndex: 0, answer: '440983000', isCorrect: false}, ...]
        task3: []  // [{questionIndex: 0, transcript: '...', isCorrect: true}, ...]
    };

    // Audio played tracking
    let audioPlayed = {
        task1: [false, false, false, false, false],
        task2: [false, false, false, false, false],
        task3: [false, false, false, false, false]
    };

    // Answers locked tracking
    let answersLocked = {
        task1: [false, false, false, false, false],
        task2: [false, false, false, false, false],
        task3: [false, false, false, false, false]
    };

    // ==================================================
    // CONTENT & TRANSLATIONS
    // ==================================================
    const translations = {
        'sidebar-speech': {
            en: "Cadet, this is your final radio test before taking the watch! You'll listen once to each radio message. Each includes a vessel's name, MMSI number, and call sign. Identify the correct vessel's name, type the MMSI you hear, then spell the call sign aloud. Remember — one clear message can save a ship!",
            id: "Taruna, ini adalah tes radio terakhir sebelum kamu bertugas jaga! Kamu akan mendengarkan setiap pesan radio satu kali. Setiap pesan berisi nama kapal, nomor MMSI, dan call sign. Pilih nama kapal yang benar, ketik MMSI yang kamu dengar, lalu eja call sign dengan lantang. Ingat — satu pesan yang jelas dapat menyelamatkan kapal!"
        },
        'activity-instruction': {
            en: `Listen carefully to each radio message. For each transmission: <strong>1)</strong> Click the correct vessel name, <strong>2)</strong> Type the MMSI number, <strong>3)</strong> Spell the Call Sign aloud. You will only hear each message once.`,
            id: `Dengarkan dengan saksama setiap pesan radio. Untuk setiap transmisi: <strong>1)</strong> Klik nama kapal yang benar, <strong>2)</strong> Ketik nomor MMSI, <strong>3)</strong> Eja Call Sign dengan lantang. Kamu hanya akan mendengar setiap pesan sekali.`
        },
        'task1-instruction': {
            en: 'Click the correct vessel name',
            id: 'Klik nama kapal yang benar'
        },
        'task2-instruction': {
            en: 'Type the 9-digit MMSI number you hear. Listen carefully to each digit!',
            id: 'Ketik nomor MMSI 9 digit yang kamu dengar. Dengarkan setiap digit dengan saksama!'
        },
        'task3-instruction': {
            en: 'Spell each call sign aloud using the phonetic alphabet. Click the microphone to record!',
            id: 'Eja setiap call sign dengan lantang menggunakan alfabet fonetik. Klik mikrofon untuk merekam!'
        }
    };

    const audioPath_sidebar = '/static/data/audio/unit1/guided_task1_intro.wav';

    // ==================================================
    // INITIAL SETUP - DISABLE TASK 2 & 3 BUTTONS
    // ==================================================
    taskNavButtons.forEach((btn, index) => {
        if (index > 0) {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.style.pointerEvents = 'none';
        }
    });

    // ==================================================
    // TAB NAVIGATION
    // ==================================================
    taskNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPanel = btn.dataset.panel;
            switchPanel(targetPanel);
        });
    });

    function switchPanel(panelId) {
        // Check if assessment is locked
        if (isAssessmentLocked) {
            showNotification('Assessment already submitted. You cannot make changes.', 'warning');
            return;
        }
        
        // Check sequential access
        if (panelId === 'task2' && !tasksCompleted.task1) {
            showNotification('Please complete Task 1 first!', 'warning');
            return;
        }
        if (panelId === 'task3' && !tasksCompleted.task2) {
            showNotification('Please complete Task 2 first!', 'warning');
            return;
        }
        
        taskNavButtons.forEach(btn => btn.classList.remove('active'));
        taskPanels.forEach(panel => panel.classList.remove('active'));

        const activeBtn = document.querySelector(`[data-panel="${panelId}"]`);
        const activePanel = document.getElementById(panelId);

        if (activeBtn) activeBtn.classList.add('active');
        if (activePanel) activePanel.classList.add('active');
    }

    // ==================================================
    // NEXT TASK BUTTONS
    // ==================================================
    nextTaskBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (index === 0) {
                // Check if task1 completed (all 5 answered)
                if (progress.task1 === 5) {
                    tasksCompleted.task1 = true;
                    // Enable task2 button
                    taskNavButtons[1].style.opacity = '1';
                    taskNavButtons[1].style.cursor = 'pointer';
                    taskNavButtons[1].style.pointerEvents = 'auto';
                    switchPanel('task2');
                } else {
                    showNotification('Please complete all 5 questions first!', 'warning');
                }
            } else if (index === 1) {
                if (progress.task2 === 5) {
                    tasksCompleted.task2 = true;
                    // Enable task3 button
                    taskNavButtons[2].style.opacity = '1';
                    taskNavButtons[2].style.cursor = 'pointer';
                    taskNavButtons[2].style.pointerEvents = 'auto';
                    switchPanel('task3');
                } else {
                    showNotification('Please complete all 5 MMSI numbers first!', 'warning');
                }
            }
        });
    });

    // ==================================================
    // AUDIO CONTROLS
    // ==================================================
    audioPlayBtns.forEach((btn) => {
        btn.addEventListener('click', function() {
            const audioKey = this.dataset.audio;
            const audioPath = `/static/data/audio/unit1/${audioKey}.wav`;

            // Determine task and question index
            const question = this.closest('.task-question');
            const questionIndex = question ? parseInt(question.dataset.question) - 1 : -1;
            const taskPanel = this.closest('.task-panel');
            const taskId = taskPanel ? taskPanel.id : null;

            // Mark audio as played
            if (taskId && questionIndex >= 0) {
                audioPlayed[taskId][questionIndex] = true;
            }

            // Check if this audio is currently playing
            const isPlayingThis = !audio_task.paused && audio_task.src.includes(audioPath);

            stopAllAudio();

            if (isPlayingThis) {
                // Audio stopped
            } else {
                // Play audio
                audio_task.src = audioPath;
                audio_task.play().catch(error => {
                    console.error('Audio error:', error);
                    shakeElement(this);
                });

                // Update UI
                this.classList.add('playing');
                const icon = this.querySelector('i');
                const text = this.querySelector('span');
                if (icon) icon.className = 'fas fa-pause';
                if (text) text.textContent = 'Playing...';
            }
        });
    });

    // Audio ended listener
    audio_task.addEventListener('ended', () => {
        stopAllAudio();
    });

    function stopAllAudio() {
        // Stop all audio objects
        allAudios.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        // Reset all task audio buttons
        audioPlayBtns.forEach(btn => {
            btn.classList.remove('playing');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            if (icon) icon.className = 'fas fa-play';
            if (text) text.textContent = 'Play Audio';
        });

        // Reset sidebar audio button
        if (playBtn_sidebar) {
            const icon = playBtn_sidebar.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        }
    }

    // ==================================================
    // TASK 1: VESSEL NAMES
    // ==================================================
    vesselOptions.forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.closest('.task-question');
            const questionIndex = parseInt(question.dataset.question) - 1;
            
            // Check if audio played
            if (!audioPlayed.task1[questionIndex]) {
                showNotification('Please play the audio first!', 'warning');
                shakeElement(question.querySelector('.audio-play-btn'));
                return;
            }
            
            // Check if already answered
            if (answersLocked.task1[questionIndex]) {
                showNotification('You can only answer once!', 'warning');
                return;
            }
            
            const options = question.querySelectorAll('.vessel-option');
            
            options.forEach(opt => {
                opt.classList.remove('selected');
            });

            this.classList.add('selected');
            
            // Lock this question
            answersLocked.task1[questionIndex] = true;
            
            // Disable all options for this question
            options.forEach(opt => {
                opt.style.pointerEvents = 'none';
                opt.style.opacity = '0.7';
            });

            // CEK BENAR/SALAH DI BACKGROUND (USER GAK TAHU)
            const isCorrect = this.classList.contains('correct');
            const userAnswer = this.dataset.answer || this.textContent.trim();
            
            // Simpan ke array untuk dikirim ke backend
            userAnswers.task1.push({
                questionIndex: questionIndex + 1,
                answer: userAnswer,
                isCorrect: isCorrect
            });
            
            // Update progress (semua jawaban dihitung)
            updateProgress('task1', 1);

            // Mark as completed tanpa indikasi benar/salah
            question.classList.add('completed');
            
            // Feedback netral
            showNotification('Answer recorded', 'info');
        });
    });

    // ==================================================
    // TASK 2: MMSI NUMBERS
    // ==================================================
    checkBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const question = btn.closest('.task-question');
            const questionIndex = parseInt(question.dataset.question) - 1;
            const input = question.querySelector('.mmsi-input');
            
            // Check if audio played
            if (!audioPlayed.task2[questionIndex]) {
                showNotification('Please play the audio first!', 'warning');
                shakeElement(question.querySelector('.audio-play-btn'));
                return;
            }
            
            // Check if already answered
            if (answersLocked.task2[questionIndex]) {
                showNotification('You can only answer once!', 'warning');
                return;
            }
            
            const correct = input.dataset.correct;
            const value = input.value.trim();
            
            // CEK BENAR/SALAH DI BACKGROUND (USER GAK TAHU)
            const isCorrect = (value === correct);
            
            // Simpan ke array untuk dikirim ke backend
            userAnswers.task2.push({
                questionIndex: questionIndex + 1,
                answer: value,
                correctAnswer: correct,
                isCorrect: isCorrect
            });
            
            // Mark as completed
            question.classList.add('completed');
            updateProgress('task2', 1);
            
            // Lock answer
            answersLocked.task2[questionIndex] = true;
            input.disabled = true;
            btn.disabled = true;
            btn.style.opacity = '0.5';
            
            // Feedback netral
            showNotification('Answer recorded', 'info');
        });
    });

    // Enter key for MMSI inputs
    mmsiInputs.forEach((input, index) => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkBtns[index].click();
            }
        });

        // Allow numbers only (9 digits)
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    });

    // ==================================================
    // TASK 3: CALL SIGNS WITH SPEECH RECOGNITION
    // ==================================================
    if (recognition) {
        callsignMicBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const question = this.closest('.task-question');
                const questionIndex = parseInt(question.dataset.question) - 1;
                
                // Check if audio played
                if (!audioPlayed.task3[questionIndex]) {
                    showNotification('Please play the audio first!', 'warning');
                    shakeElement(question.querySelector('.audio-play-btn'));
                    return;
                }
                
                // Check if already answered
                if (answersLocked.task3[questionIndex]) {
                    showNotification('You can only answer once!', 'warning');
                    return;
                }
                
                if (isListening) {
                    showNotification('Please wait for the current recording to finish', 'warning');
                    return;
                }

                stopAllAudio();
                isListening = true;
                currentMicBtn = this;
                
                const targetCallsign = this.dataset.callsign;

                this.classList.add('listening');
                const icon = this.querySelector('i');
                const text = this.querySelector('span');
                if (icon) icon.className = 'fas fa-stop';
                if (text) text.textContent = 'Listening...';

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    console.log('📝 Transcript:', transcript);
                    checkCallsignPronunciation(transcript, targetCallsign, currentMicBtn);
                };

                recognition.onend = () => {
                    isListening = false;
                    if (currentMicBtn) {
                        currentMicBtn.classList.remove('listening');
                        const icon = currentMicBtn.querySelector('i');
                        const text = currentMicBtn.querySelector('span');
                        if (icon) icon.className = 'fas fa-microphone';
                        if (text) text.textContent = 'Spell It';
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
                        if (text) text.textContent = 'Spell It';
                    }
                    
                    let errorMessage = 'Could not recognize speech.';
                    if (event.error === 'no-speech') {
                        errorMessage = 'No speech detected. Please try again.';
                    } else if (event.error === 'audio-capture') {
                        errorMessage = 'Microphone not found.';
                    } else if (event.error === 'not-allowed') {
                        errorMessage = 'Microphone permission denied.';
                    }
                    
                    showNotification(errorMessage, 'error');
                    currentMicBtn = null;
                };

                try {
                    recognition.start();
                    showNotification('Listening... Spell the call sign!', 'info');
                } catch (e) {
                    console.error('Failed to start recognition:', e);
                    isListening = false;
                    this.classList.remove('listening');
                }
            });
        });
    }

    function checkCallsignPronunciation(transcript, targetText, micBtn) {
        const question = micBtn.closest('.task-question');
        const questionIndex = parseInt(question.dataset.question) - 1;
        
        // Lock answer
        answersLocked.task3[questionIndex] = true;
        micBtn.disabled = true;
        micBtn.style.opacity = '0.5';
        micBtn.style.cursor = 'not-allowed';
        
        // MATCHING DI BACKGROUND (USER GAK TAHU)
        const userWords = new Set(cleanText(transcript).split(' '));
        const targetWords = cleanText(targetText).split(' ');
        
        let correctCount = 0;
        let totalCount = targetWords.length;

        targetWords.forEach(targetWord => {
            if (userWords.has(targetWord)) {
                correctCount++;
            }
        });

        const allCorrect = correctCount === totalCount;
        const accuracy = Math.round((correctCount / totalCount) * 100);
        
        // Simpan ke array untuk dikirim ke backend
        userAnswers.task3.push({
            questionIndex: questionIndex + 1,
            callsign: targetText,
            transcript: transcript,
            correctCount: correctCount,
            totalCount: totalCount,
            accuracy: accuracy,
            isCorrect: allCorrect
        });
        
        // Mark as completed
        question.classList.add('completed');
        updateProgress('task3', 1);
        
        // Feedback netral (user tidak tahu benar/salah)
        showNotification('Answer recorded', 'success');
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

    // ==================================================
    // PROGRESS TRACKING
    // ==================================================
    function updateProgress(task, increment) {
        if (progress[task] < 5) {
            progress[task] += increment;
        }
    }

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================
    if (playBtn_sidebar) {
        const icon = playBtn_sidebar.querySelector('i');

        playBtn_sidebar.addEventListener('click', function() {
            const isPlayingThis = !audio_sidebar.paused;

            stopAllAudio();

            if (isPlayingThis) {
                audio_sidebar.pause();
                audio_sidebar.currentTime = 0;
            } else {
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        if (icon) {
                            icon.classList.remove('fa-play');
                            icon.classList.add('fa-pause');
                        }
                    })
                    .catch(error => console.error('Audio error:', error));
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            stopAllAudio();
            
            currentLang = currentLang === 'en' ? 'id' : 'en';
            
            // Translate sidebar speech
            if (speechText_sidebar) {
                speechText_sidebar.textContent = translations['sidebar-speech'][currentLang];
            }
            
            // Translate activity instruction
            if (instructionText_activity) {
                instructionText_activity.innerHTML = translations['activity-instruction'][currentLang];
            }
            
            // Translate panel instructions
            document.querySelectorAll('[data-translate]').forEach(el => {
                const key = el.getAttribute('data-translate');
                if (translations[key]) {
                    el.innerHTML = translations[key][currentLang];
                }
            });
        });
    }

    // ==================================================
    // SEND REPORT - SAVE TO DATABASE
    // ==================================================
    if (sendReportBtn) {
        sendReportBtn.addEventListener('click', async () => {
            // Hitung score ASLI (di background)
            const task1Score = userAnswers.task1.filter(a => a.isCorrect).length;
            const task2Score = userAnswers.task2.filter(a => a.isCorrect).length;
            const task3Score = userAnswers.task3.filter(a => a.isCorrect).length;
            
            const totalScore = task1Score + task2Score + task3Score;
            const percentage = Math.round((totalScore / 15) * 100);
            
            // Disable button and show loading
            sendReportBtn.disabled = true;
            const originalHTML = sendReportBtn.innerHTML;
            sendReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Submitting...</span>';
            
            try {
                const response = await fetch(`/learn/unit/${window.UNIT_ID}/save_assessment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        // Kirim semua data jawaban ke backend
                        task1_answers: userAnswers.task1,
                        task2_answers: userAnswers.task2,
                        task3_answers: userAnswers.task3,
                        
                        // Kirim score asli
                        task1: task1Score,
                        task2: task2Score,
                        task3: task3Score,
                        total: totalScore,
                        percentage: percentage
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Lock assessment
                    isAssessmentLocked = true;
                    
                    // Disable all interactions
                    vesselOptions.forEach(opt => opt.disabled = true);
                    mmsiInputs.forEach(input => input.disabled = true);
                    checkBtns.forEach(btn => btn.disabled = true);
                    callsignMicBtns.forEach(btn => btn.disabled = true);
                    audioPlayBtns.forEach(btn => btn.disabled = true);
                    taskNavButtons.forEach(btn => btn.style.pointerEvents = 'none');
                    
                    // Show success modal (TANPA LINK)
                    showScoreModal();
                    
                    sendReportBtn.innerHTML = '<i class="fas fa-check"></i> <span>Submitted!</span>';
                    sendReportBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    
                    // Show continue button
                    const continueSection = document.getElementById('continue-section');
                    if (continueSection) {
                        continueSection.classList.remove('hidden');
                        continueSection.classList.add('visible');
                    }

                    // Scroll to continue button
                    setTimeout(() => {
                        continueSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 500);
                }
            } catch (error) {
                console.error('Save error:', error);
                showNotification('Failed to save assessment. Please try again.', 'error');
                sendReportBtn.innerHTML = originalHTML;
                sendReportBtn.disabled = false;
            }
        });
    }

    // Score Modal Function
    function showScoreModal() {
        const modal = document.createElement('div');
        modal.className = 'feedback-modal';
        
        modal.innerHTML = `
            <div class="feedback-modal-content" style="max-width: 500px;">
                <button class="feedback-close">&times;</button>
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 4rem; margin-bottom: 15px;">✅</div>
                    <h3 style="color: var(--ocean-blue); font-size: 2rem; margin-bottom: 10px;">Assessment Submitted!</h3>
                    <p style="font-size: 1.1rem; color: #4b5563; margin-bottom: 25px; line-height: 1.8;">
                        Your assessment has been recorded successfully.<br>
                        Results will be available in your <strong>Progress Report</strong>.
                    </p>
                    
                    <p style="font-size: 1rem; color: var(--indigo); font-weight: 700; margin-bottom: 30px;">
                        Click "Continue Sailing" below to proceed to the next section.
                    </p>
                    
                    <button class="try-again-btn" onclick="this.closest('.feedback-modal').remove()" style="background: linear-gradient(135deg, var(--coral) 0%, var(--coral-dark) 100%);">
                        <i class="fas fa-check"></i> Got It!
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.feedback-close');
        closeBtn.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => modal.remove(), 300);
            }
        });
        
        playSuccessSound();
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

    console.log('✅ Radio Readiness Check Ready!');
    console.log('🎯 Complete all tasks to submit your final report!');
});

// Add notification animations
const styles = document.createElement('style');
styles.textContent = `
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
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(styles);