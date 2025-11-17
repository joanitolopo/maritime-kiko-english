// ========================================
// MODERN GUIDED TASK 1 JAVASCRIPT
// Radio Readiness Check - Quiz Interface
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Radio Readiness Check Initialized!');

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
    const speechText_sidebar = document.querySelector('.speech-text-task');
    const instructionText_activity = document.querySelector('.instruction-text-task');

    const taskNavButtons = document.querySelectorAll('.task-nav-button');
    const taskPanels = document.querySelectorAll('.task-panel');
    
    const vesselOptions = document.querySelectorAll('.vessel-option');
    const callsignInputs = document.querySelectorAll('.callsign-input');
    const checkBtns = document.querySelectorAll('.check-btn');
    const callsignMicBtns = document.querySelectorAll('.mic-btn-callsign');
    
    const audioPlayBtns = document.querySelectorAll('.audio-play-btn');
    const nextTaskBtns = document.querySelectorAll('.next-task-btn');
    const sendReportBtn = document.querySelector('.send-report-btn');

    const audio_sidebar = new Audio();
    const audio_task = new Audio(); // <-- TAMBAHKAN INI
    const allAudios = [audio_sidebar, audio_task]; // <-- UBAH INI
    
    let isTranslated = false;
    let isListening = false;
    let currentMicBtn = null;

    // Progress tracking
    let progress = {
        task1: 0, // Vessel names
        task2: 0, // MMSI numbers  
        task3: 0  // Call signs
    };

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================
    const originalText_sidebar = "Cadet, this is your final radio test before taking the watch! You'll listen once to each radio message. Each includes a vessel's name, MMSI number, and call sign. Identify the correct vessel's name, type the MMSI you hear, then spell the call sign aloud. Remember — one clear message can save a ship!";
    const translatedText_sidebar = "Taruna, ini adalah tes radio terakhir sebelum kamu bertugas jaga! Kamu akan mendengarkan setiap pesan radio satu kali. Setiap pesan berisi nama kapal, nomor MMSI, dan call sign. Pilih nama kapal yang benar, ketik MMSI yang kamu dengar, lalu eja call sign dengan lantang. Ingat — satu pesan yang jelas dapat menyelamatkan kapal!";

    const originalText_instruction = `Listen carefully to each radio message. For each transmission: <strong>1)</strong> Click the correct vessel name, <strong>2)</strong> Type the MMSI number, <strong>3)</strong> Spell the Call Sign aloud. You will only hear each message once.`;
    const translatedText_instruction = `Dengarkan dengan saksama setiap pesan radio. Untuk setiap transmisi: <strong>1)</strong> Klik nama kapal yang benar, <strong>2)</strong> Ketik nomor MMSI, <strong>3)</strong> Eja Call Sign dengan lantang. Kamu hanya akan mendengar setiap pesan sekali.`;

    const audioPath_sidebar = '/static/data/audio/unit1/guided_task1_intro.wav';

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
            if (index === 0) switchPanel('task2');
            else if (index === 1) switchPanel('task3');
        });
    });

    // ==================================================
    // TASK 1: VESSEL NAMES
    // ==================================================
    vesselOptions.forEach(btn => {
        btn.addEventListener('click', function() {
            const question = this.closest('.task-question');
            const options = question.querySelectorAll('.vessel-option');
            
            options.forEach(opt => {
                opt.classList.remove('selected', 'correct-answer', 'wrong-answer');
            });

            this.classList.add('selected');

            if (this.classList.contains('correct')) {
                this.classList.add('correct-answer');
                question.classList.add('completed');
                updateProgress('task1', 1);
                playSuccessSound();
                showNotification('Correct! Well done!', 'success');
            } else {
                this.classList.add('wrong-answer');
                shakeElement(this);
                showNotification('Try again!', 'error');
            }
        });
    });

    // ==================================================
    // TASK 2: CALL SIGNS (Letters & Numbers)
    // ==================================================
    checkBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const question = btn.closest('.task-question');
            const input = question.querySelector('.callsign-input');
            const correct = input.dataset.correct;
            const value = input.value.trim().toUpperCase();

            if (value === correct) {
                input.classList.remove('incorrect');
                input.classList.add('correct');
                question.classList.add('completed');
                updateProgress('task2', 1);
                playSuccessSound();
                showNotification('Correct Call Sign!', 'success');
            } else {
                input.classList.remove('correct');
                input.classList.add('incorrect');
                shakeElement(input);
                showNotification('Incorrect. Try again!', 'error');
            }
        });
    });

    // Enter key for Call Sign inputs
    callsignInputs.forEach((input, index) => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkBtns[index].click();
            }
        });

        // Allow letters and numbers only, auto uppercase
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        });
    });

    // ==================================================
    // TASK 3: CALL SIGNS WITH SPEECH RECOGNITION
    // ==================================================
    if (recognition) {
        callsignMicBtns.forEach(btn => {
            btn.addEventListener('click', function() {
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

        const modal = document.createElement('div');
        modal.className = 'feedback-modal';
        
        let title = '';
        let message = '';

        if (allCorrect) {
            title = '<h4><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Perfect!</h4>';
            message = `<p style="color: #059669;">You spelled the call sign correctly! 🎉</p>`;
            const question = micBtn.closest('.task-question');
            question.classList.add('completed');
            updateProgress('task3', 1);
        } else if (accuracy >= 60) {
            title = '<h4><i class="fa-solid fa-star" style="color: #f59e0b;"></i> Good Try!</h4>';
            message = `<p style="color: #d97706;">${correctCount}/${totalCount} correct (${accuracy}%). Try again!</p>`;
        } else {
            title = '<h4><i class="fa-solid fa-arrows-rotate" style="color: #3b82f6;"></i> Keep Practicing!</h4>';
            message = `<p style="color: #2563eb;">${correctCount}/${totalCount} correct (${accuracy}%). Practice more!</p>`;
        }
        
        const transcriptDisplay = `
            <h5>What you said:</h5>
            <p style="font-style: italic; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #bae6fd; padding: 12px; border-radius: 12px; word-wrap: break-word; color: #0c4a6e;">
                "${transcript}"
            </p>
        `;

        modal.innerHTML = `
            <div class="feedback-modal-content">
                <button class="feedback-close">&times;</button>
                <div class="mic-result-box">
                    ${title}
                    ${message}
                    ${transcriptDisplay}
                    <h5>Comparison (${correctCount}/${totalCount}):</h5>
                    <div class="diff-output">${resultHTML}</div>
                    <button class="try-again-btn"><i class="fa-solid fa-microphone"></i> Try Again</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);

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
            const progressItem = document.querySelector(`.progress-item[data-task="${task.slice(-1)}"]`);
            if (progressItem) {
                const scoreSpan = progressItem.querySelector('.progress-score');
                if (scoreSpan) {
                    scoreSpan.textContent = `${progress[task]}/5`;
                }
            }
        }
    }

    // ==================================================
    // AUDIO CONTROLS
    // ==================================================
    audioPlayBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const audioKey = this.dataset.audio;
            const audioPath = `/static/data/audio/unit1/${audioKey}.wav`;

            // Cek apakah audio ini sedang diputar
            const isPlayingThis = !audio_task.paused && audio_task.src.includes(audioPath);

            stopAllAudio(); // Hentikan semua audio & reset UI

            if (isPlayingThis) {
                // Jika audio ini tadi diputar, stopAllAudio sudah menghentikannya.
                // Klik tombol yang sama lagi akan berfungsi sebagai "stop".
            } else {
                // Jika audio lain diputar (atau tidak ada), putar yang ini.
                audio_task.src = audioPath;
                audio_task.play().catch(error => {
                    console.error('Audio error:', error);
                    shakeElement(this);
                });

                // Update UI tombol *ini*
                this.classList.add('playing');
                const icon = this.querySelector('i');
                const text = this.querySelector('span');
                if (icon) icon.className = 'fas fa-pause';
                if (text) text.textContent = 'Playing...';
            }
        });
    });

// Tambahkan listener 'ended' untuk audio_task
audio_task.addEventListener('ended', () => {
    stopAllAudio(); // Reset UI saat audio selesai
});

    function stopAllAudio() {
        // 1. Hentikan semua objek audio
        allAudios.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });

        // 2. Reset semua tombol audio di dalam task
        audioPlayBtns.forEach(btn => {
            btn.classList.remove('playing');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            if (icon) icon.className = 'fas fa-play';
            if (text) text.textContent = 'Play Audio';
        });

        // 3. Reset tombol audio sidebar
        if (playBtn_sidebar) {
            const icon = playBtn_sidebar.querySelector('i');
            if(icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        }
}

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================
    if (playBtn_sidebar) {
        const icon = playBtn_sidebar.querySelector('i'); // Dapatkan icon di dalam tombol

        playBtn_sidebar.addEventListener('click', function() {
            const isPlayingThis = !audio_sidebar.paused;

            stopAllAudio(); // Hentikan audio task jika sedang main

            if (isPlayingThis) {
                audio_sidebar.pause();
                audio_sidebar.currentTime = 0;
                // Icon akan di-reset oleh stopAllAudio()
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
                if(icon) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            });
        }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            stopAllAudio(); // Hentikan audio saat menerjemahkan
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
    }

    // ==================================================
    // SEND REPORT
    // ==================================================
    if (sendReportBtn) {
        sendReportBtn.addEventListener('click', () => {
            const totalScore = progress.task1 + progress.task2 + progress.task3;
            const percentage = Math.round((totalScore / 15) * 100);
            
            let message = `Your Score: ${totalScore}/15 (${percentage}%)\n\n`;
            message += `Vessel Names: ${progress.task1}/5\n`;
            message += `MMSI Numbers: ${progress.task2}/5\n`;
            message += `Call Signs: ${progress.task3}/5`;
            
            alert(message);
            showNotification('Report submitted! Good job!', 'success');
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
`;
document.head.appendChild(styles);