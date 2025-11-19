// ========================================
// MODERN WARMUP PAGE JAVASCRIPT
// Enhanced with smooth interactions
// == UPDATED FOR GRID GAME LOGIC ==
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Warmup Activity Initialized!');

    // ==================================================
    // ELEMENTS & AUDIO PLAYERS
    // ==================================================

    // Sidebar Controls
    const audioBtn_warmup = document.querySelector('.warmup-controls .audio-btn i');
    const translateBtn_warmup = document.querySelector('.warmup-controls .translate-btn');
    const speechText_warmup = document.querySelector('.speech-text-warmup');
    const radioWavesAnim = document.querySelector('.radio-waves');

    // Activity 1: Grid
    const playBtn_grid = document.getElementById('play-grid-audio');
    const codeButtons = document.querySelectorAll('.code-btn');
    // BARU: Menangkap feedback box untuk Activity 1
    const gridFeedbackBox = document.getElementById('grid-feedback'); 

    // Activity 2: MCQ
    const playBtn_mcq = document.getElementById('play-mcq-audio');
    const mcqForm = document.querySelector('.mcq-form');
    const mcqOptions = document.querySelectorAll('.mcq-option');
    const radioButtons = document.querySelectorAll('.mcq-form input[name="shipname"]');
    const feedbackBox_mcq = document.getElementById('mcq-feedback'); // Mengganti nama agar lebih spesifik

    const continueWrapper = document.getElementById('continue-wrapper');

    // Audio Players
    const audio_warmup = new Audio();
    const audio_grid_main = new Audio(); // Ini tidak akan kita pakai lagi untuk game
    const audio_mcq_main = new Audio();
    const audio_code_item = new Audio(); // Ini akan jadi audio player utama untuk game grid

    const allAudios = [audio_warmup, audio_grid_main, audio_mcq_main, audio_code_item];
        
    let currentActiveButton = null;
    let mcqAudioPlayed = false;

    // ==================================================
    // BARU: STATE UNTUK GAME GRID (ACTIVITY 1)
    // ==================================================
    let allGridCodes = [];      // Menyimpan semua kode: ['oscar', 'charlie', ...]
    let remainingCodes = [];    // Menyimpan kode yang belum ditebak
    let currentChallengeCode = null; // Kode yang sedang diputar/ditanyakan
    let isGridGameActive = false;    // Status apakah game sedang menunggu tebakan
    // ==================================================

    // ==================================================
    // CONTENT & AUDIO PATHS
    // ==================================================

    // Text Content
    const originalText_warmup = "Cadet, tune your ears to the radio! Identify each code word you hear — let's see if your radio ears are sharp!";
    const translatedText_warmup = "Taruna, arahkan pendengaranmu ke radio! Kenali setiap kode kata yang kamu dengar — mari kita lihat seberapa tajam pendengaran radionya!";
    let isTranslated_warmup = false;

    const instructionTextPart1 = document.querySelector('.activity-part:nth-child(1) .instruction-text p');
    const originalTextPart1 = 'Listen carefully and click the correct letter or number you hear.';
    const translatedTextPart1 = 'Dengarkan baik-baik dan klik huruf atau angka yang benar yang kamu dengar.';

    const instructionTextPart2 = document.querySelector('.activity-part:nth-child(3) .instruction-text p');
    const originalTextPart2 = 'Listen and choose the ship name spelled by the Captain.';
    const translatedTextPart2 = 'Dengarkan dan pilih nama kapal yang dieja oleh Kapten.';

    // Audio Paths
    const audioPath_warmup = '/static/data/audio/unit1/warmup_intro.wav';
    // const audioPath_grid_main = '/static/data/audio/unit1/warmup_radio_check_1.wav'; // Tidak dipakai lagi
    const audioPath_mcq_main = '/static/data/audio/unit1/warmup_spell_ship_name.wav';
    const natoAudioBasePath = '/static/data/audio/nato/';

    // Correct Answer
    const correctAnswerMCQ = 'SAILEX';

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
        
        // Reset sidebar button
        if (audioBtn_warmup) {
            audioBtn_warmup.classList.remove('fa-pause');
            audioBtn_warmup.classList.add('fa-play');
            
            // BARU: Matikan animasi radio waves jika stopAllAudio dipanggil
            if (radioWavesAnim) radioWavesAnim.classList.remove('active');
        }

        // Reset play button MCQ
        if (playBtn_mcq) {
            playBtn_mcq.classList.remove('playing');
            playBtn_mcq.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
        }
        
        // JANGAN RESET playBtn_grid di sini, karena state-nya diatur oleh game
        
        // Reset code buttons
        // Kita tidak reset visual code-btn di sini agar status .completed tetap ada
        
        currentActiveButton = null;
        // currentPlayingCode dihapus karena diganti game logic
    }

    function playMainAudio(button, audioPlayer, audioSrc) {
        if (currentActiveButton === button && !audioPlayer.paused) {
            // Pause
            audioPlayer.pause();
            button.classList.remove('playing');
            button.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
            currentActiveButton = null;
        } else {
            // Play
            stopAllAudio();
            audioPlayer.src = audioSrc;
            audioPlayer.play()
                .then(() => {
                    button.classList.add('playing');
                    button.innerHTML = '<i class="fas fa-pause"></i><span>Playing...</span>';
                    currentActiveButton = button;
                })
                .catch(error => {
                    console.error('❌ Audio playback error:', error);
                    shakeElement(button);
                });
        }
    }

    function resetMCQForm() {
        if (mcqForm) {
            mcqForm.reset();
            mcqForm.classList.remove('answered');
        }
        mcqOptions.forEach(option => {
            option.classList.remove('correct', 'incorrect', 'selected');
        });
        radioButtons.forEach(radio => {
            radio.disabled = false;
        });
        if (feedbackBox_mcq) {
            feedbackBox_mcq.style.display = 'none';
        }
        mcqAudioPlayed = false; // TAMBAHKAN BARIS INI - Reset flag saat form direset
    }

    // BARU: Fungsi feedback yang lebih generik
    function showActivityFeedback(boxElement, isCorrect, message) {
        if (!boxElement) return;
        
        const icon = boxElement.querySelector('.feedback-icon');
        const text = boxElement.querySelector('.feedback-text');
        
        boxElement.className = 'feedback-box'; // Reset classes
        boxElement.classList.add(isCorrect ? 'success' : 'error');
        
        icon.className = 'feedback-icon fas ' + (isCorrect ? 'fa-check-circle' : 'fa-times-circle');
        text.textContent = message;
        
        boxElement.style.display = 'flex';
    }

    // ==================================================
    // SIDEBAR WARMUP CONTROLS
    // ==================================================

    if (audioBtn_warmup) {
        // ... (Logika ini tetap sama, tidak perlu diubah)
        audioBtn_warmup.parentElement.addEventListener('click', function() {
            if (audio_warmup.paused) {
                stopAllAudio();
                audio_warmup.src = audioPath_warmup;
                audio_warmup.play()
                    .then(() => {
                        audioBtn_warmup.classList.remove('fa-play');
                        audioBtn_warmup.classList.add('fa-pause');
                        addPulseEffect(this);

                        // BARU: Nyalakan animasi radio waves
                        if (radioWavesAnim) radioWavesAnim.classList.add('active');
                    })
                    .catch(error => {
                        console.error('❌ Audio error:', error);
                        shakeElement(this);
                    })
            } else {
                audio_warmup.pause();
                audioBtn_warmup.classList.remove('fa-pause');
                audioBtn_warmup.classList.add('fa-play');
                removePulseEffect(this);

                // BARU: Matikan animasi radio waves saat pause
                if (radioWavesAnim) radioWavesAnim.classList.remove('active');
            }
        });

        audio_warmup.addEventListener('ended', () => {
            audioBtn_warmup.classList.remove('fa-pause');
            audioBtn_warmup.classList.add('fa-play');
            removePulseEffect(audioBtn_warmup.parentElement);
            // BARU: Matikan animasi radio waves saat audio selesai
            if (radioWavesAnim) radioWavesAnim.classList.remove('active');
        });
    }

    if (translateBtn_warmup) {
        // ... (Logika ini tetap sama, tidak perlu diubah)
        translateBtn_warmup.addEventListener('click', function() {
            stopAllAudio();
            
            fadeTransition(speechText_warmup, () => {
                if (isTranslated_warmup) {
                    speechText_warmup.textContent = originalText_warmup;
                    isTranslated_warmup = false;
                } else {
                    speechText_warmup.textContent = translatedText_warmup;
                    isTranslated_warmup = true;
                }

                // BARU: Update teks instruksi aktivitas
                if (instructionTextPart1 && instructionTextPart2) {
                    instructionTextPart1.textContent = isTranslated_warmup ? translatedTextPart1 : originalTextPart1;
                    instructionTextPart2.textContent = isTranslated_warmup ? translatedTextPart2 : originalTextPart2;
                }
            });
            
            addClickEffect(this);
        });
    }

    // ==================================================
    // ACTIVITY 1: CODE GRID (LOGIKA GAME BARU)
    // ==================================================

    function initializeGridGame() {
        console.log('🔄 Initializing Grid Game...');
        allGridCodes = [];
        remainingCodes = [];

        codeButtons.forEach(btn => {
            const code = btn.dataset.code;
            allGridCodes.push(code);
            btn.classList.remove('correct', 'incorrect', 'completed');
            btn.disabled = true; // Mulai dengan tombol nonaktif
        });

        remainingCodes = [...allGridCodes]; // Salin semua kode ke daftar yang tersisa
        currentChallengeCode = null;
        isGridGameActive = false;
        
        if (playBtn_grid) {
            playBtn_grid.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
            playBtn_grid.disabled = false;
        }
        if (gridFeedbackBox) gridFeedbackBox.style.display = 'none';
    }

    function playChallengeAudio() {
        if (!currentChallengeCode) return;

        audio_code_item.src = `${natoAudioBasePath}${currentChallengeCode}.wav`;
        audio_code_item.play()
            .then(() => {
                playBtn_grid.innerHTML = '<i class="fas fa-pause"></i><span>Playing...</span>';
                playBtn_grid.disabled = true;
            })
            .catch(error => {
                console.error('❌ Code audio error:', error);
                shakeElement(playBtn_grid);
                playBtn_grid.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Audio Error</span>';
                playBtn_grid.disabled = false;
            });
    }

    // Ganti listener playBtn_grid
    if (playBtn_grid) {
        playBtn_grid.addEventListener('click', function() {
            stopAllAudio(); // Hentikan audio lain
            if (gridFeedbackBox) gridFeedbackBox.style.display = 'none';
            codeButtons.forEach(btn => btn.classList.remove('incorrect')); // Hapus feedback salah sebelumnya

            if (isGridGameActive && currentChallengeCode) {
                // Jika game aktif, tombol ini berfungsi sebagai "Listen Again"
                playChallengeAudio();
                return;
            }

            // Cek apakah game selesai
            if (remainingCodes.length === 0) {
                showActivityFeedback(gridFeedbackBox, true, '🎉 All done! Resetting game...');
                setTimeout(initializeGridGame, 1500); // Reset game setelah 1.5 detik
                return;
            }

            // Memulai ronde baru
            isGridGameActive = true;
            
            // Pilih kode acak dari yang tersisa
            currentChallengeCode = remainingCodes[Math.floor(Math.random() * remainingCodes.length)];
            console.log(`New challenge: ${currentChallengeCode}`);

            playChallengeAudio();
        });

        // Saat audio tantangan selesai diputar
        audio_code_item.addEventListener('ended', () => {
            if (isGridGameActive) {
                playBtn_grid.innerHTML = '<i class="fas fa-volume-up"></i><span>Listen Again</span>';
                playBtn_grid.disabled = false;

                // Aktifkan tombol-tombol yang belum selesai
                codeButtons.forEach(btn => {
                    if (!btn.classList.contains('completed')) {
                        btn.disabled = false;
                    }
                });
            }
        });
    }

    // Ganti listener codeButtons
    codeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Hanya jalankan jika game aktif dan tombol bisa diklik
            if (!isGridGameActive || !currentChallengeCode || this.disabled) {
                return;
            }

            const guessedCode = this.dataset.code;

            // Nonaktifkan semua tombol sementara untuk mencegah klik ganda
            codeButtons.forEach(btn => btn.disabled = true);

            if (guessedCode === currentChallengeCode) {
                // --- JAWABAN BENAR ---
                this.classList.add('correct', 'completed');
                showActivityFeedback(gridFeedbackBox, true, `🎯 Correct! That was "${guessedCode.charAt(0).toUpperCase() + guessedCode.slice(1)}".`);

                // Hapus dari daftar yang tersisa
                remainingCodes = remainingCodes.filter(c => c !== currentChallengeCode);

                currentChallengeCode = null;
                isGridGameActive = false;

                // Update tombol play untuk ronde berikutnya
                if (remainingCodes.length === 0) {
                    playBtn_grid.innerHTML = '<i class="fas fa-redo"></i><span>All Done! Play Again?</span>';
                } else {
                    playBtn_grid.innerHTML = '<i class="fas fa-play"></i><span>Play Next Code</span>';
                }
                playBtn_grid.disabled = false;

            } else {
                // --- JAWABAN SALAH ---
                this.classList.add('incorrect');
                showActivityFeedback(gridFeedbackBox, false, `❌ Not quite. Try again!`);
                shakeElement(this);

                // Aktifkan kembali tombol setelah 1 detik
                setTimeout(() => {
                    this.classList.remove('incorrect');
                    codeButtons.forEach(btn => {
                        if (!btn.classList.contains('completed')) {
                            btn.disabled = false; // Aktifkan lagi yang belum ditebak
                        }
                    });
                    playBtn_grid.disabled = false; // Aktifkan lagi tombol "Listen Again"
                }, 1000);
            }
        });
    });

    // Inisialisasi game grid saat halaman dimuat
    initializeGridGame();

    // ==================================================
    // ACTIVITY 2: MCQ (Logika ini tetap sama)
    // ==================================================

    if (playBtn_mcq) {
        playBtn_mcq.addEventListener('click', function() {
            resetMCQForm();
            playMainAudio(this, audio_mcq_main, audioPath_mcq_main);
            mcqAudioPlayed = true; // Tandai bahwa audio sudah diputar
        });

        audio_mcq_main.addEventListener('ended', () => {
            playBtn_mcq.classList.remove('playing');
            playBtn_mcq.innerHTML = '<i class="fas fa-play"></i><span>Play Audio</span>';
            currentActiveButton = null;
        });
    }

    // MCQ Answer Checking
    if (mcqForm) {
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function() {
                // Validasi: user harus mendengar audio dulu
                if (!mcqAudioPlayed) {
                    // Prevent selection
                    this.checked = false;
                    
                    // Show warning
                    showActivityFeedback(
                        feedbackBox_mcq, 
                        false, 
                        '⚠️ Please listen to the audio first before answering!'
                    );
                    
                    // Shake the play button
                    shakeElement(playBtn_mcq);
                    
                    // Hide feedback after 3 seconds
                    setTimeout(() => {
                        if (feedbackBox_mcq) feedbackBox_mcq.style.display = 'none';
                    }, 3000);
                    
                    return;
                }
                
                stopAllAudio();

                const selectedValue = this.value;
                const selectedOption = this.closest('.mcq-option');

                // Disable all options
                radioButtons.forEach(btn => btn.disabled = true);
                mcqForm.classList.add('answered');
                selectedOption.classList.add('selected');

                if (selectedValue === correctAnswerMCQ) {
                    // Correct Answer
                    selectedOption.classList.add('correct');
                    // Menggunakan fungsi feedback yang baru
                    showActivityFeedback(feedbackBox_mcq, true, '🎉 Excellent! That\'s the correct ship name!');
                    if (continueWrapper) {
                            continueWrapper.style.display = 'block'; // Tampilkan elemen
                            // Terapkan animasi masuk/fade in
                            setTimeout(() => {
                                continueWrapper.style.opacity = '1';
                                continueWrapper.style.transform = 'translateY(0)';
                            }, 50);
                        }
                } else {
                    // Incorrect Answer
                    selectedOption.classList.add('incorrect');
                    // Menggunakan fungsi feedback yang baru
                    showActivityFeedback(feedbackBox_mcq, false, '❌ Not quite right. Listen again and try!');
                    
                    // Show correct answer
                    setTimeout(() => {
                        mcqOptions.forEach(option => {
                            const radio = option.querySelector('input[type="radio"]');
                            if (radio.value === correctAnswerMCQ) {
                                option.classList.add('correct');
                            }
                        });
                    }, 500);
                }
            });
        });
    }

    // ==================================================
    // HELPER FUNCTIONS (Tetap sama)
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
    // SMOOTH INTERACTIONS (Tetap sama)
    // ==================================================

    // Continue button hover
    const continueBtn = document.querySelector('.btn-continue');
    if (continueBtn) {
        continueBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
        });
        
        continueBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }

    // Character hover effects
    const captainAvatar = document.querySelector('.captain-avatar');
    const captainSpeaking = document.querySelector('.captain-speaking');

    if (captainAvatar) {
        captainAvatar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainAvatar.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    if (captainSpeaking) {
        captainSpeaking.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        captainSpeaking.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }

    // ==================================================
    // ENTRANCE ANIMATIONS (Tetap sama)
    // ==================================================

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Di mobile, langsung tampilkan semua tanpa animasi scroll
        const animatedElements = document.querySelectorAll(
            '.continue-wrapper'
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

    console.log('✅ All warmup features ready!');
    console.log('🎵 Audio systems initialized');
    console.log('🎯 Interactive activities loaded');
});