// ========================================
// VHF RADIO EXCHANGE JAVASCRIPT v4.0
// With Popup Modal System
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎙️ VHF Radio Exchange v4.0 Initialized!');

    // ==================================================
    // VESSEL DATA
    // ==================================================
    const vesselData = {
        '1-caller': {
            name: 'HORIZON',
            mmsi: '248105900',
            callSign: 'Y8ON5',
            audio: '/static/data/audio/unit1/vhf_caller.wav',
            transcript: [
                "This is Motor Vessel Horizon, Call Sign Bravo Hotel Niner Too Fife Wun. MMSI Too Fower Ait Wun Zeero Fife Niner Zeero Zeero. Calling Motor Vessel Antares, Call Sign Yankee Bravo Oscar November Niner. Channel Wun Six. Over"
            ]
        },
        '1-receiver': {
            name: 'ANTARES',
            mmsi: '257689000',
            callSign: 'LAPW5',
            audio: '/static/data/audio/unit1/vhf_receiver.wav',
            transcript: [
                "Motor Vessel Horizon, this is Antares. Receiving you loud and clear. Over."
            ]
        },
        '2-caller': {
            name: 'ANTARES',
            mmsi: '257689000',
            callSign: 'LAPW5',
            audio: '/static/data/audio/unit1/example2-caller.wav',
            transcript: [
                "This is Motor Vessel Antares, Call Sign Lima Alfa Papa Whisky Fife. MMSI too-fife-seven-six-ait-niner-zeero-zeero-zeero. Calling Motor Vessel Horizon, Call Sign Yankee Bravo Oscar November Niner. Channel wun six. Over."
            ]
        },
        '2-receiver': {
            name: 'HORIZON',
            mmsi: '248105900',
            callSign: 'Y8ON5',
            audio: '/static/data/audio/unit1/example2-receiver.wav',
            transcript: [
                "Motor Vessel Antares, this is Horizon. Receiving you loud and clear. Over."
            ]
        }
    };

    // ==================================================
    // ELEMENTS
    // ==================================================
    
    // Sidebar
    const audioBtn_sidebar = document.querySelector('.captain-instruction-card .audio-btn i');
    const translateBtn_sidebar = document.querySelector('.captain-instruction-card .translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-vhf');
    const radioWavesAnim = document.querySelector('.radio-waves');

    const instructionText = document.querySelector('.instruction-text-vhf');

    // Cards
    const allVesselCards = document.querySelectorAll('.vessel-exchange-card');

    // Modal
    const modal = document.getElementById('exchangeModal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const closeModalBtn = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalVesselName = document.getElementById('modalVesselName');
    const modalMMSI = document.getElementById('modalMMSI');
    const modalCallSign = document.getElementById('modalCallSign');
    const modalTranscript = document.getElementById('modalTranscript');

    // Audio
    const audio_sidebar = new Audio();
    let audio_current = new Audio();
    let isAudioPlaying = false;

    // Progress Tracking
    let playedMessages = new Set(); // Track pesan yang sudah di-play
    const totalMessages = 4; // Total: 2 example × 2 role (caller + receiver)

    // ==================================================
    // TEXT CONTENT
    // ==================================================
    const originalText_sidebar = "Cadet, remember! Always start with your vessel's name, Call Sign, and MMSI before you speak on the radio. That's how real sailors make sure every message is clear and safe!";
    const translatedText_sidebar = "Taruna, ingat! Selalu sebutkan nama kapalmu, Call Sign, dan MMSI sebelum berbicara di radio. Itulah cara pelaut sejati memastikan setiap pesan terdengar jelas dan aman!";
    let isTranslated = false;

    const originalText_instruction = "Listen to the radio exchange between two vessels. Notice how each vessel identifies itself and responds. Repeat each line clearly.";
    const translatedText_instruction = "Dengarkan pertukaran radio antara dua kapal. Perhatikan bagaimana setiap kapal mengidentifikasi diri dan merespons. Ulangi setiap baris dengan jelas.";

    // Audio Path
    const audioPath_sidebar = '/static/data/audio/unit1/vhf_intro.wav';

    // ==================================================
    // SIDEBAR CONTROLS
    // ==================================================
    if (audioBtn_sidebar) {
        audioBtn_sidebar.parentElement.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                stopCurrentAudio();
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        audioBtn_sidebar.classList.remove('fa-play');
                        audioBtn_sidebar.classList.add('fa-pause');
                        if (radioWavesAnim) radioWavesAnim.classList.add('active');
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    });
            } else {
                audio_sidebar.pause();
                audioBtn_sidebar.classList.remove('fa-pause');
                audioBtn_sidebar.classList.add('fa-play');
                if (radioWavesAnim) radioWavesAnim.classList.remove('active');
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
            if (radioWavesAnim) radioWavesAnim.classList.remove('active');
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            stopCurrentAudio();
            
            // Toggle state DULU
            isTranslated = !isTranslated;
            
            // Translate captain speech
            fadeTransition(speechText_sidebar, () => {
                speechText_sidebar.textContent = isTranslated ? translatedText_sidebar : originalText_sidebar;
            });

            // Translate instruction banner
            if (instructionText) {
                fadeTransition(instructionText, () => {
                    instructionText.textContent = isTranslated ? translatedText_instruction : originalText_instruction;
                });
            }

            addClickEffect(this);
        });
    }

    // ==================================================
    // VESSEL CARDS - OPEN MODAL
    // ==================================================
    allVesselCards.forEach(card => {
        const playBtn = card.querySelector('.play-exchange-btn');
        
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const example = card.dataset.example;
            const role = card.dataset.role;
            const key = `${example}-${role}`;
            const data = vesselData[key];

            if (data) {
                openModal(data, role);
            }
        });
    });

    // ==================================================
    // CHECK COMPLETION
    // ==================================================
    function checkCompletion() {
        if (playedMessages.size === totalMessages) {
            showContinueButton();
        }
    }

    function showContinueButton() {
        const continueWrapper = document.querySelector('.continue-wrapper');
        if (continueWrapper) {
            continueWrapper.style.display = 'block';
            setTimeout(() => {
                continueWrapper.style.opacity = '1';
                continueWrapper.style.transform = 'translateY(0)';
            }, 100);
            
            console.log('🎉 All radio exchanges completed! Continue button shown.');
        }
    }

    // ==================================================
    // MODAL FUNCTIONS
    // ==================================================
    function openModal(data, role) {
        // Stop any playing audio
        stopCurrentAudio();

        // Populate modal
        modalTitle.textContent = `${role === 'caller' ? 'The Caller' : 'The Receiver'}: ${data.name}`;
        modalVesselName.textContent = data.name;
        modalMMSI.textContent = data.mmsi;
        modalCallSign.textContent = data.callSign;
        
        // Populate transcript
        modalTranscript.innerHTML = '';
        data.transcript.forEach(line => {
            const p = document.createElement('p');
            p.textContent = line;
            modalTranscript.appendChild(p);
        });

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
            });

        // BARU: Track completion saat audio selesai
        audio_current.addEventListener('ended', () => {
            isAudioPlaying = false;
            
            // Track pesan ini sebagai sudah di-play
            const messageId = data.audio; // Gunakan audio path sebagai unique ID
            playedMessages.add(messageId);
            checkCompletion();
        }, { once: true }); // { once: true } agar event listener tidak duplicate
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        stopCurrentAudio();
    }

    function stopCurrentAudio() {
        if (!audio_current.paused) {
            audio_current.pause();
            audio_current.currentTime = 0;
        }
        isAudioPlaying = false;

        // Stop sidebar audio too
        if (!audio_sidebar.paused) {
            audio_sidebar.pause();
            audio_sidebar.currentTime = 0;
        }
        if (audioBtn_sidebar) {
            audioBtn_sidebar.classList.remove('fa-pause');
            audioBtn_sidebar.classList.add('fa-play');
        }
        if (radioWavesAnim) radioWavesAnim.classList.remove('active');
    }

    // Close modal events
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
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

    const captainAvatar = document.querySelector('.captain-avatar');
    if (captainAvatar) {
        captainAvatar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainAvatar.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    // ==================================================
    // ENTRANCE ANIMATIONS
    // ==================================================
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        const animatedElements = document.querySelectorAll('.continue-wrapper');
        animatedElements.forEach((el) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    } else {
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

        const animatedElements = document.querySelectorAll('.activity-card, .continue-wrapper');
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
            observer.observe(el);
        });
    }

    console.log('✅ VHF Radio Exchange Ready!');
    console.log('💡 Click on vessel cards to hear their radio messages');
});