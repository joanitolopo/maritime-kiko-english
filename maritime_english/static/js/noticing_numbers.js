// ========================================
// MODERN NOTICING NUMBERS JAVASCRIPT
// Radio Exchange Practice with Speech Recognition
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📡 Radio Exchange Practice Initialized!');

    // ==================================================
    // SPEECH RECOGNITION SETUP
    // ==================================================
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!window.SpeechRecognition) {
        console.error('❌ Browser tidak mendukung Speech Recognition API');
        showNotification('Your browser does not support speech recognition. Please use Chrome or Edge.', 'error');
        document.querySelectorAll('.mic-btn').forEach(btn => {
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
    const playBtn_sidebar = document.querySelector('.exchange-controls .fa-play');
    const translateBtn_sidebar = document.querySelector('.exchange-controls .fa-language');
    const speechText_sidebar = document.querySelector('.speech-text-exchange');
    const instructionText_activity = document.querySelector('.instruction-text-exchange');

    // Audio Buttons
    const audioPlayBtns = document.querySelectorAll('.audio-play-btn');
    const playFullBtn = document.querySelector('.play-full-btn');
    
    // Microphone Buttons
    const micBtns = document.querySelectorAll('.mic-btn');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_example_caller = new Audio();
    const audio_example_receiver = new Audio();
    const audio_task1_target = new Audio();
    const audio_task2_incoming = new Audio();

    const allAudios = [audio_sidebar, audio_example_caller, audio_example_receiver, audio_task1_target, audio_task2_incoming];
    
    let isTranslated = false;
    let isListening = false;
    let currentMicBtn = null;
    let isPlayingFull = false;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = `"Alright, cadets! This time you'll practice real radio exchanges - sending and receiving messages just like on board! Listen carefully and follow each step with confidence."`;
    const translatedText_sidebar = `"Baiklah, kadet! Kali ini kamu akan berlatih pertukaran radio yang sebenarnya - mengirim dan menerima pesan seperti di kapal! Dengarkan dengan saksama dan ikuti setiap langkah dengan percaya diri."`;

    const originalText_instruction = `Listen to the example, then complete both tasks: <strong>Task 1</strong> - Act as the caller and speak clearly. <strong>Task 2</strong> - Act as the receiver and respond correctly.`;
    const translatedText_instruction = `Dengarkan contohnya, lalu selesaikan kedua tugas: <strong>Tugas 1</strong> - Berperan sebagai pemanggil dan berbicara dengan jelas. <strong>Tugas 2</strong> - Berperan sebagai penerima dan merespons dengan benar.`;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/noticing_numbers_intro.wav';
    const audioPaths = {
        'example-caller': '/static/data/audio/unit1/exchange_example_caller.wav',
        'example-receiver': '/static/data/audio/unit1/exchange_example_receiver.wav',
        'task1-target': '/static/data/audio/unit1/exchange_task1_response.wav',
        'task2-incoming': '/static/data/audio/unit1/exchange_task2_call.wav'
    };

    // Target Phrases for Speech Recognition
    const TARGET_PHRASES = {
        'task1-caller': "This is 635005000 Motor Vessel ADOUR Foxtrot Quebec Echo Papa calling 237002600 Motor Vessel APOLLON Sierra Whisky Foxtrot Papa Channel 16 Over",
        'task2-receiver': "Motor Vessel BAYSTAR this is SUNSHINE receiving you loud and clear Over"
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
            playBtn_sidebar.classList.remove('fa-pause');
            playBtn_sidebar.classList.add('fa-play');
        }

        audioPlayBtns.forEach(btn => {
            btn.classList.remove('playing');
            const icon = btn.querySelector('i');
            const text = btn.querySelector('span');
            if (icon) icon.className = 'fas fa-play';
            if (text) text.textContent = text.textContent.replace('Stop', 'Play').replace('Pause', 'Play');
        });

        micBtns.forEach(btn => btn.classList.remove('listening'));
        
        isPlayingFull = false;
        if (playFullBtn) {
            playFullBtn.innerHTML = '<i class="fas fa-play-circle"></i> Play Full Example';
        }
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
            if (audio_sidebar.paused) {
                stopAllAudioAndSpeech();
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        playBtn_sidebar.classList.remove('fa-play');
                        playBtn_sidebar.classList.add('fa-pause');
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_sidebar.pause();
                playBtn_sidebar.classList.remove('fa-pause');
                playBtn_sidebar.classList.add('fa-play');
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            playBtn_sidebar.classList.remove('fa-pause');
            playBtn_sidebar.classList.add('fa-play');
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
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
    // AUDIO PLAY BUTTONS
    // ==================================================

    audioPlayBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const audioKey = this.dataset.audio;
            const audioPath = audioPaths[audioKey];
            
            if (!audioPath) {
                console.warn(`Audio path not found for: ${audioKey}`);
                return;
            }

            stopAllAudioAndSpeech();

            let audio;
            if (audioKey === 'example-caller') audio = audio_example_caller;
            else if (audioKey === 'example-receiver') audio = audio_example_receiver;
            else if (audioKey === 'task1-target') audio = audio_task1_target;
            else if (audioKey === 'task2-incoming') audio = audio_task2_incoming;

            if (audio) {
                audio.src = audioPath;
                audio.play()
                    .then(() => {
                        this.classList.add('playing');
                        const icon = this.querySelector('i');
                        const text = this.querySelector('span');
                        if (icon) icon.className = 'fas fa-pause';
                        if (text) text.textContent = text.textContent.replace('Play', 'Stop');
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });

                audio.addEventListener('ended', () => {
                    this.classList.remove('playing');
                    const icon = this.querySelector('i');
                    const text = this.querySelector('span');
                    if (icon) icon.className = 'fas fa-play';
                    if (text) text.textContent = text.textContent.replace('Stop', 'Play');
                });
            }
        });
    });

    // ==================================================
    // PLAY FULL EXAMPLE
    // ==================================================

    if (playFullBtn) {
        playFullBtn.addEventListener('click', async function() {
            if (isPlayingFull) {
                stopAllAudioAndSpeech();
                return;
            }

            stopAllAudioAndSpeech();
            isPlayingFull = true;
            this.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Example';

            // Play caller
            audio_example_caller.src = audioPaths['example-caller'];
            await playAudioSequentially(audio_example_caller);
            
            if (!isPlayingFull) return;
            await wait(1000);

            // Play receiver
            audio_example_receiver.src = audioPaths['example-receiver'];
            await playAudioSequentially(audio_example_receiver);

            isPlayingFull = false;
            this.innerHTML = '<i class="fas fa-play-circle"></i> Play Full Example';
        });
    }

    function playAudioSequentially(audio) {
        return new Promise((resolve) => {
            audio.play();
            audio.onended = resolve;
        });
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================================================
    // MICROPHONE CONTROLS
    // ==================================================

    micBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isListening) {
                showNotification('Please wait for the current recording to finish', 'warning');
                return;
            }

            stopAllAudioAndSpeech();
            isListening = true;
            currentMicBtn = this;
            
            const taskKey = this.dataset.task;
            const targetText = TARGET_PHRASES[taskKey];

            if (!targetText) {
                console.warn(`Target phrase not found for: ${taskKey}`);
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
                currentMicBtn.classList.remove('listening');
                const icon = currentMicBtn.querySelector('i');
                const text = currentMicBtn.querySelector('span');
                if (icon) icon.className = 'fas fa-microphone';
                if (text) text.textContent = 'Start Recording';
                currentMicBtn = null;
            };

            recognition.onerror = (event) => {
                console.error('❌ Speech recognition error:', event.error);
                isListening = false;
                currentMicBtn.classList.remove('listening');
                
                const icon = currentMicBtn.querySelector('i');
                const text = currentMicBtn.querySelector('span');
                if (icon) icon.className = 'fas fa-microphone';
                if (text) text.textContent = 'Start Recording';
                
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
        '.practice-section, .exchange-card'
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
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (playFullBtn) playFullBtn.click();
        }

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

    console.log('✅ Radio Exchange Practice Ready!');
    console.log('💡 Tip: Press Space to play full example');
    console.log('💡 Tip: Press T to translate instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('🎯 Practice your radio exchange skills!');
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