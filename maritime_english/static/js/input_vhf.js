// ========================================
// MODERN VHF EXCHANGE JAVASCRIPT
// Interactive Radio Communication Interface
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎙️ VHF Radio Exchange Initialized!');

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const audioBtn_sidebar = document.querySelector('.captain-instruction-card .audio-btn i');
    const translateBtn_sidebar = document.querySelector('.captain-instruction-card .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-vhf');

    // Message Controls
    const playCallerBtn = document.getElementById('play-caller-audio');
    const playReceiverBtn = document.getElementById('play-receiver-audio');
    const playAllBtn = document.getElementById('play-all-btn');

    // Message Elements
    const callerMessage = document.querySelector('.caller-message');
    const receiverMessage = document.querySelector('.receiver-message');
    const callerText = document.querySelector('.caller-message .message-text');
    const receiverText = document.querySelector('.receiver-message .message-text');

    // Visual Effects
    const radioWaves = document.querySelectorAll('.radio-waves span');
    const protocolSteps = document.querySelectorAll('.protocol-step');
    const conversationArrow = document.querySelector('.arrow-icon');

    // Audio Players
    const audio_sidebar = new Audio();
    const audio_caller = new Audio();
    const audio_receiver = new Audio();

    const allAudios = [audio_sidebar, audio_caller, audio_receiver];
    
    let currentPlayingAudio = null;
    let isAutoPlaying = false;
    let autoPlayStep = 0;

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_sidebar = `"Cadet, remember! Always start with your vessel's name, Call Sign, and MMSI before you speak on the radio. That's how real sailors make sure every message is clear and safe!"`;
    const translatedText_sidebar = `"Kadet, ingat! Selalu mulai dengan nama kapal, Call Sign, dan MMSI sebelum berbicara di radio. Begitulah pelaut sejati memastikan setiap pesan jelas dan aman!"`;
    let isTranslated_sidebar = false;

    // Audio Paths
    const audioPath_sidebar = '/static/data/audio/unit1/vhf_intro.wav';
    const audioPath_caller = '/static/data/audio/unit1/vhf_caller.wav';
    const audioPath_receiver = '/static/data/audio/unit1/vhf_receiver.wav';

    // ==================================================
    // MAIN AUDIO CONTROL FUNCTIONS
    // ==================================================

    function stopAllAudio() {
        allAudios.forEach(audio => {
            if (!audio.paused) {
                audio.pause();
                audio.currentTime = 0;
            }
        });
        
        if (audioBtn_sidebar) {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
        }

        if (playCallerBtn) {
            playCallerBtn.classList.remove('playing');
            const callerIcon = playCallerBtn.querySelector('i');
            if (callerIcon) {
                callerIcon.classList.remove('fa-pause');
                callerIcon.classList.add('fa-play');
            }
        }

        if (playReceiverBtn) {
            playReceiverBtn.classList.remove('playing');
            const receiverIcon = playReceiverBtn.querySelector('i');
            if (receiverIcon) {
                receiverIcon.classList.remove('fa-pause');
                receiverIcon.classList.add('fa-play');
            }
        }

        if (callerMessage) callerMessage.classList.remove('highlighted');
        if (receiverMessage) receiverMessage.classList.remove('highlighted');

        currentPlayingAudio = null;
    }

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================

    if (audioBtn_sidebar) {
        audioBtn_sidebar.parentElement.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                stopAllAudio();
                stopAutoPlay();
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        audioBtn_sidebar.classList.remove('fa-play');
                        audioBtn_sidebar.classList.add('fa-pause');
                        addPulseEffect(this);
                        animateRadioWaves();
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_sidebar.pause();
                audioBtn_sidebar.classList.remove('fa-pause');
                audioBtn_sidebar.classList.add('fa-play');
                removePulseEffect(this);
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
            removePulseEffect(audioBtn_sidebar.parentElement);
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            stopAllAudio();
            
            fadeTransition(speechText_sidebar, () => {
                if (isTranslated_sidebar) {
                    speechText_sidebar.textContent = originalText_sidebar;
                    isTranslated_sidebar = false;
                } else {
                    speechText_sidebar.textContent = translatedText_sidebar;
                    isTranslated_sidebar = true;
                }
            });
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // CALLER MESSAGE CONTROLS
    // ==================================================

    if (playCallerBtn) {
        playCallerBtn.addEventListener('click', function() {
            if (audio_caller.paused) {
                stopAllAudio();
                stopAutoPlay();
                
                audio_caller.src = audioPath_caller;
                audio_caller.play()
                    .then(() => {
                        this.classList.add('playing');
                        currentPlayingAudio = audio_caller;
                        highlightMessage('caller');
                        animateRadioWaves();
                        
                        const icon = this.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-play');
                            icon.classList.add('fa-pause');
                        }
                    })
                    .catch(error => {
                        console.error('❌ Caller audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_caller.pause();
                audio_caller.currentTime = 0;
                this.classList.remove('playing');
                
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            }
        });

        audio_caller.addEventListener('ended', () => {
            playCallerBtn.classList.remove('playing');
            const icon = playCallerBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
            if (callerMessage) callerMessage.classList.remove('highlighted');
        });
    }

    // ==================================================
    // RECEIVER MESSAGE CONTROLS
    // ==================================================

    if (playReceiverBtn) {
        playReceiverBtn.addEventListener('click', function() {
            if (audio_receiver.paused) {
                stopAllAudio();
                stopAutoPlay();
                
                audio_receiver.src = audioPath_receiver;
                audio_receiver.play()
                    .then(() => {
                        this.classList.add('playing');
                        currentPlayingAudio = audio_receiver;
                        highlightMessage('receiver');
                        animateRadioWaves();
                        
                        const icon = this.querySelector('i');
                        if (icon) {
                            icon.classList.remove('fa-play');
                            icon.classList.add('fa-pause');
                        }
                    })
                    .catch(error => {
                        console.error('❌ Receiver audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_receiver.pause();
                audio_receiver.currentTime = 0;
                this.classList.remove('playing');
                
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            }
        });

        audio_receiver.addEventListener('ended', () => {
            playReceiverBtn.classList.remove('playing');
            const icon = playReceiverBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
            if (receiverMessage) receiverMessage.classList.remove('highlighted');
        });
    }

    // ==================================================
    // AUTO-PLAY FULL CONVERSATION
    // ==================================================

    if (playAllBtn) {
        playAllBtn.addEventListener('click', function() {
            if (isAutoPlaying) {
                stopAutoPlay();
                this.innerHTML = '<i class="fas fa-play-circle"></i><span>Play Full Conversation</span>';
            } else {
                startAutoPlay();
                this.innerHTML = '<i class="fas fa-stop-circle"></i><span>Stop Conversation</span>';
            }
        });
    }

    function startAutoPlay() {
        if (isAutoPlaying) return;
        
        isAutoPlaying = true;
        autoPlayStep = 0;
        
        if (playAllBtn) {
            playAllBtn.classList.add('playing');
        }

        playNextMessage();
    }

    function playNextMessage() {
        if (!isAutoPlaying) return;

        if (autoPlayStep === 0) {
            // Play caller
            if (playCallerBtn) {
                playCallerBtn.click();
                
                audio_caller.onended = () => {
                    playCallerBtn.classList.remove('playing');
                    const icon = playCallerBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-pause');
                        icon.classList.add('fa-play');
                    }
                    if (callerMessage) callerMessage.classList.remove('highlighted');
                    
                    autoPlayStep++;
                    setTimeout(() => {
                        playNextMessage();
                    }, 1000); // 1 second pause
                };
            }
        } else if (autoPlayStep === 1) {
            // Play receiver
            if (playReceiverBtn) {
                playReceiverBtn.click();
                
                audio_receiver.onended = () => {
                    playReceiverBtn.classList.remove('playing');
                    const icon = playReceiverBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-pause');
                        icon.classList.add('fa-play');
                    }
                    if (receiverMessage) receiverMessage.classList.remove('highlighted');
                    
                    autoPlayStep++;
                    stopAutoPlay();
                };
            }
        }
    }

    function stopAutoPlay() {
        isAutoPlaying = false;
        autoPlayStep = 0;
        
        if (playAllBtn) {
            playAllBtn.classList.remove('playing');
            playAllBtn.innerHTML = '<i class="fas fa-play-circle"></i><span>Play Full Conversation</span>';
        }
    }

    // ==================================================
    // VISUAL EFFECTS & ANIMATIONS
    // ==================================================

    function highlightMessage(type) {
        // Remove all highlights first
        if (callerMessage) callerMessage.classList.remove('highlighted');
        if (receiverMessage) receiverMessage.classList.remove('highlighted');

        // Add highlight to current
        if (type === 'caller' && callerMessage) {
            callerMessage.classList.add('highlighted');
            callerMessage.style.transform = 'scale(1.02)';
            callerMessage.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.3)';
            callerMessage.style.transition = 'all 0.3s ease';
        } else if (type === 'receiver' && receiverMessage) {
            receiverMessage.classList.add('highlighted');
            receiverMessage.style.transform = 'scale(1.02)';
            receiverMessage.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.3)';
            receiverMessage.style.transition = 'all 0.3s ease';
        }

        // Scroll into view
        const targetMessage = type === 'caller' ? callerMessage : receiverMessage;
        if (targetMessage) {
            targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Reset after audio ends
        setTimeout(() => {
            if (callerMessage) {
                callerMessage.style.transform = 'scale(1)';
                callerMessage.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.08)';
            }
            if (receiverMessage) {
                receiverMessage.style.transform = 'scale(1)';
                receiverMessage.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.08)';
            }
        }, 2000);
    }

    function animateRadioWaves() {
        if (!radioWaves || radioWaves.length === 0) return;

        radioWaves.forEach((wave, index) => {
            wave.style.animation = 'none';
            setTimeout(() => {
                wave.style.animation = `radioWave 2s ease-out infinite`;
                wave.style.animationDelay = `${index * 0.7}s`;
            }, 10);
        });

        // Also animate conversation arrow
        if (conversationArrow) {
            conversationArrow.style.animation = 'none';
            setTimeout(() => {
                conversationArrow.style.animation = 'arrowPulse 2s ease infinite';
            }, 10);
        }
    }

    // ==================================================
    // PROTOCOL STEPS INTERACTION
    // ==================================================

    protocolSteps.forEach((step, index) => {
        step.addEventListener('click', function() {
            highlightProtocolStep(index);
        });

        // Hover effects
        step.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px) scale(1.02)';
        });

        step.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    function highlightProtocolStep(index) {
        // Reset all steps
        protocolSteps.forEach(step => {
            step.style.borderLeftWidth = '4px';
        });

        // Highlight selected
        const step = protocolSteps[index];
        step.style.borderLeftWidth = '6px';
        step.style.transition = 'all 0.3s ease';

        // Highlight corresponding data in messages
        const dataRows = document.querySelectorAll('.vessel-data-card .data-row');
        dataRows.forEach((row, rowIndex) => {
            if (rowIndex % 3 === index) {
                row.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                row.style.transition = 'background 0.3s ease';
                
                setTimeout(() => {
                    row.style.background = '#f9fafb';
                }, 2000);
            }
        });
    }

    // ==================================================
    // KEYBOARD SHORTCUTS
    // ==================================================

    document.addEventListener('keydown', function(e) {
        // Space to start/stop full conversation
        if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (playAllBtn) playAllBtn.click();
        }

        // 1 to play caller
        if (e.key === '1') {
            if (playCallerBtn) playCallerBtn.click();
        }

        // 2 to play receiver
        if (e.key === '2') {
            if (playReceiverBtn) playReceiverBtn.click();
        }

        // T for translate
        if (e.key.toLowerCase() === 't') {
            if (translateBtn_sidebar) translateBtn_sidebar.click();
        }

        // C for captain audio
        if (e.key.toLowerCase() === 'c') {
            if (audioBtn_sidebar) audioBtn_sidebar.parentElement.click();
        }
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
        element.classList.add('playing');
    }

    function removePulseEffect(element) {
        if (!element) return;
        element.classList.remove('playing');
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

    // ==================================================
    // SMOOTH INTERACTIONS
    // ==================================================

    const continueBtn = document.querySelector('.btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        continueBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }

    const captainAvatar = document.querySelector('.captain-avatar');
    if (captainAvatar) {
        captainAvatar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainAvatar.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    // Message cards hover
    const messageCards = document.querySelectorAll('.message-card');
    messageCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.parentElement.classList.contains('highlighted')) {
                this.style.transform = 'scale(1.01)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.parentElement.classList.contains('highlighted')) {
                this.style.transform = '';
            }
        });
    });

    // Data rows hover effects
    const dataRows = document.querySelectorAll('.data-row');
    dataRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

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
        '.message-card, .protocol-card, .instruction-banner, .continue-wrapper'
    );
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
        observer.observe(el);
    });

    // ==================================================
    // CONSOLE TIPS
    // ==================================================

    console.log('✅ VHF Radio Exchange Ready!');
    console.log('💡 Tip: Press Space to play full conversation');
    console.log('💡 Tip: Press 1 to play caller message');
    console.log('💡 Tip: Press 2 to play receiver message');
    console.log('💡 Tip: Press T to translate captain\'s instructions');
    console.log('💡 Tip: Press C to hear captain\'s voice');
    console.log('🎯 Master VHF radio protocol for safe maritime communication!');
});