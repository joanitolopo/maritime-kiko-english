// ========================================
// MODERN MARITIME LEARNING JAVASCRIPT
// Enhanced with smooth interactions
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Maritime Learning System Initialized!');

    // ==================================================
    // === CAPTAIN'S WELCOME (LEFT SECTION)
    // ==================================================
    
    const playBtn_captain = document.querySelector('.welcome-bubble .play-btn i');
    const translateBtn_captain = document.querySelector('.welcome-bubble .translate-btn');
    const speechText_captain = document.querySelector('.speech-text');
    const audio_captain = new Audio('/static/data/audio/unit1/introduction_intro.wav');
    const indicator = document.getElementById('scroll-indicator');
    
    const originalText_captain = "Ahoy, cadets! Welcome aboard. This unit is about the alphabet and numbers we use at sea. On ships, we don’t just say A, B, C… or one, two, three. We use a special system so our messages are always clear, even in storms or noisy conditions. It’s called the IMO Standard Phonetic Alphabet and Numbers, developed by the International Maritime Organization to make sure every word and number is understood correctly in radio communication at sea."
    
    const translatedText_captain = "Ahoy, taruna! Selamat datang di atas kapal. Unit ini membahas tentang alfabet dan angka yang kita gunakan di laut. Di kapal, kita tidak hanya menyebut A, B, C… atau satu, dua, tiga. Kita menggunakan sistem khusus agar pesan kita selalu jelas, bahkan saat badai atau kondisi bising. Sistem ini disebut IMO Standard Phonetic Alphabet and Numbers, yang dikembangkan oleh International Maritime Organization untuk memastikan setiap huruf dan angka dapat dipahami dengan benar dalam komunikasi radio di laut."

    let isTranslated_captain = false;
    let isPlaying_captain = false;

    // ==================================================
    // === OFFICER'S LEARNING JOURNEY (RIGHT SECTION)
    // ==================================================

    const playBtn_officer = document.querySelector('.audio-controls-objectives .play-btn i');
    const translateBtn_officer = document.querySelector('.audio-controls-objectives .translate-btn');
    const speechText_officer = document.querySelector('.translatable-text-officer');
    const audio_officer = new Audio('/static/data/audio/unit1/introduction_guide.wav');

    const originalText_officer_HTML = `
        <div class="intro-paragraph">
            <p>During this voyage, you'll learn how sailors around the world spell ship names, call signs, and numbers clearly over the radio. You'll practice saying them the maritime way - just like real officers on the bridge.</p>
        </div>

        <div class="objectives-section">
            <p>By the end of this unit, you'll be able to:</p>
            <ol class="objectives-list">
                <li>
                    <span class="list-number">1</span>
                    <span>Identify and pronounce the Maritime Alphabet and numbers correctly in radio communication.</span>
                </li>
                <li>
                    <span class="list-number">2</span>
                    <span>Exchange vessel identification (call sign and MMSI) confidently and accurately through short radio simulations.</span>
                </li>
            </ol>
        </div>

        <div class="cta-section">
            <p><strong>Now, get ready to tune your ears and voice - it's time to spell the sea!</strong></p>
        </div>`;
    
    const translatedText_officer_HTML = `
        <div class="intro-paragraph">
            <p>Dalam pelayaran ini, kamu akan belajar bagaimana para pelaut di seluruh dunia mengeja nama kapal, kode panggilan, dan angka dengan jelas melalui radio. Kamu juga akan berlatih mengucapkannya dengan cara maritim — seperti perwira sejati di anjungan kapal.</p>
        </div>

        <div class="objectives-section">
            <p>Di akhir unit ini, kamu akan mampu untuk:</p>
            <ol class="objectives-list">
                <li>
                    <span class="list-number">1</span>
                    <span>Mengidentifikasi dan mengucapkan IMO Standard Phonetic Alphabet and Numbers dengan benar dalam komunikasi radio.</span>
                </li>
                <li>
                    <span class="list-number">2</span>
                    <span>Melakukan pertukaran identitas kapal (call sign dan MMSI) dengan percaya diri dan akurat melalui simulasi radio singkat.</span>
                </li>
            </ol>
        </div>

        <div class="cta-section">
            <p><strong>Sekarang, siapkan telinga dan suaramu — saatnya mengeja lautan!</strong></p>
        </div>`;
    
    let isTranslated_officer = false;
    let isPlaying_officer = false;

    // ==================================================
    // === AUDIO CONTROL (PREVENT OVERLAP)
    // ==================================================
    
    audio_captain.addEventListener('play', () => {
        if (!audio_officer.paused) {
            audio_officer.pause();
            audio_officer.currentTime = 0;
            updatePlayButton(playBtn_officer, false);
            isPlaying_officer = false;
        }
    });

    audio_officer.addEventListener('play', () => {
        if (!audio_captain.paused) {
            audio_captain.pause();
            audio_captain.currentTime = 0;
            updatePlayButton(playBtn_captain, false);
            isPlaying_captain = false;
        }
    });

    // ==================================================
    // === CAPTAIN'S CONTROLS
    // ==================================================

    if (playBtn_captain) {
        playBtn_captain.parentElement.addEventListener('click', function() {
            if (audio_captain.paused) {
                audio_captain.play();
                updatePlayButton(playBtn_captain, true);
                addPulseEffect(this);
                isPlaying_captain = true;
            } else {
                audio_captain.pause();
                updatePlayButton(playBtn_captain, false);
                removePulseEffect(this);
                isPlaying_captain = false;
            }
        });
    }

    audio_captain.addEventListener('ended', () => {
        updatePlayButton(playBtn_captain, false);
        removePulseEffect(playBtn_captain?.parentElement);
        isPlaying_captain = false;
    });

    if (translateBtn_captain) {
        translateBtn_captain.addEventListener('click', function() {
            if (!audio_captain.paused) {
                audio_captain.pause();
                audio_captain.currentTime = 0;
                updatePlayButton(playBtn_captain, false);
                isPlaying_captain = false;
            }
            
            fadeTransition(speechText_captain, () => {
                if (isTranslated_captain) {
                    speechText_captain.textContent = originalText_captain;
                    isTranslated_captain = false;
                } else {
                    speechText_captain.textContent = translatedText_captain;
                    isTranslated_captain = true;
                }
            });
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // === OFFICER'S CONTROLS
    // ==================================================

    if (playBtn_officer) {
        playBtn_officer.parentElement.addEventListener('click', function() {
            if (audio_officer.paused) {
                audio_officer.play();
                updatePlayButton(playBtn_officer, true);
                addPulseEffect(this);
                isPlaying_officer = true;
            } else {
                audio_officer.pause();
                updatePlayButton(playBtn_officer, false);
                removePulseEffect(this);
                isPlaying_officer = false;
            }
        });
    }

    audio_officer.addEventListener('ended', () => {
        updatePlayButton(playBtn_officer, false);
        removePulseEffect(playBtn_officer?.parentElement);
        isPlaying_officer = false;
    });

    if (translateBtn_officer) {
        translateBtn_officer.addEventListener('click', function() {
            if (!audio_officer.paused) {
                audio_officer.pause();
                audio_officer.currentTime = 0;
                updatePlayButton(playBtn_officer, false);
                isPlaying_officer = false;
            }
            
            fadeTransition(speechText_officer, () => {
                if (isTranslated_officer) {
                    speechText_officer.innerHTML = originalText_officer_HTML;
                    isTranslated_officer = false;
                } else {
                    speechText_officer.innerHTML = translatedText_officer_HTML;
                    isTranslated_officer = true;
                }
            });
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // === HELPER FUNCTIONS
    // ==================================================

    function updatePlayButton(iconElement, isPlaying) {
        if (!iconElement) return;
        
        if (isPlaying) {
            iconElement.classList.remove('fa-play');
            iconElement.classList.add('fa-pause');
        } else {
            iconElement.classList.remove('fa-pause');
            iconElement.classList.add('fa-play');
        }
    }

    function addPulseEffect(button) {
        if (!button) return;
        button.classList.add('playing');
    }

    function removePulseEffect(button) {
        if (!button) return;
        button.classList.remove('playing');
    }

    function addClickEffect(button) {
        if (!button) return;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
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
    // === DYNAMIC STYLES
    // ==================================================

    const style = document.createElement('style');
    style.textContent = `
        .control-btn.playing {
            animation: buttonPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes buttonPulse {
            0%, 100% {
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
                transform: scale(1.02);
            }
        }
    `;
    document.head.appendChild(style);

    // ==================================================
    // === SMOOTH INTERACTIONS
    // ==================================================

    // Continue button hover
    const continueBtn = document.querySelector('.continue-button');
    if (continueBtn) {
        continueBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.02)';
        });
        
        continueBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    }

    // Character hover effects
    const captainImg = document.querySelector('.captain-img');
    const officerImg = document.querySelector('.officer-img');

    if (captainImg) {
        captainImg.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        captainImg.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    if (officerImg) {
        officerImg.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.05)';
        });
        officerImg.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    // ==================================================
    // === Scroll Down Indicator
    // ==================================================

    if (indicator) {
        const isScrollable = document.documentElement.scrollHeight > window.innerHeight;

        if (isScrollable) {
            indicator.classList.add('visible');
        }

        const hideOnScroll = () => {
            if (window.scrollY > 50) { 
                indicator.classList.add('hidden');
                window.removeEventListener('scroll', hideOnScroll); 
            }
        };
        
        window.addEventListener('scroll', hideOnScroll);
    }

    // ==================================================
    // === ENTRANCE ANIMATIONS
    // ==================================================

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Di mobile, langsung tampilkan semua tanpa animasi scroll
        const animatedElements = document.querySelectorAll(
            '.unit-hero-card, .learning-journey-card, .continue-section'
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
            rootMargin: '0px 0px 100px 0px' // Trigger lebih awal
        });

        const animatedElements = document.querySelectorAll(
            '.unit-hero-card, .learning-journey-card, .continue-section'
        );
        
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
            observer.observe(el);
        });
    }
});