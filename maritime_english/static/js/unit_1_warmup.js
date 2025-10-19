// =========================
// Activity 1: Quick Pick Game
// =========================
document.addEventListener('DOMContentLoaded', function() {
    const intro = document.getElementById('warmup-intro');
    const game = document.getElementById('warmup-game');
    const startBtn = document.getElementById('start-game-btn');
    const playBtn = document.getElementById('play-audio');
    const feedback = document.getElementById('feedback');
    const roundSpan = document.getElementById('round');
    const nextBtn = document.getElementById('to-activity-2');
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const dialogueTextEl = document.getElementById('dialogue-text');

    const dialogueSentences = [
        {
            en: "Hi friends! I just joined this ship as an Ordinary Seaman. I’m still learning, just like you. Let’s play a quick game before we learn the full alphabet and numbers. You’ll hear a sound — like ‘Sierra’ or ‘Niner’ — and you need to click the correct letter or number. Don’t worry, it’s just for fun. Ready? Let’s go!",
            id: "Hai teman-teman! Saya baru saja bergabung dengan kapal ini sebagai Pelaut Biasa. Aku masih belajar, sama seperti kalian. Mari kita mainkan permainan singkat sebelum kita mempelajari alfabet dan angka lengkap. Anda akan mendengar suara - seperti 'Sierra' atau 'Niner' - dan Anda harus mengklik huruf atau angka yang benar. Jangan khawatir, ini hanya untuk bersenang-senang. Siap? Ayo mulai!",
            audio: "/static/data/audio/tts-audio01.wav"
        }
    ];

    const questions = [
        { term: "Sierra", answer: "S" },
        { term: "Oscar", answer: "O" },
        { term: "Alpha", answer: "A" },
        { term: "Charlie", answer: "C" },
        { term: "ZEE-ro", answer: "0" },
        { term: "WUN", answer: "1" },
        { term: "FIFE", answer: "5" },
        { term: "NIN-er", answer: "9" }
    ];

    const audioFiles = {
        "Sierra": "sierra.wav",
        "Oscar": "oscar.wav",
        "Alpha": "alpha.wav",
        "Charlie": "charlie.wav",
        "ZEE-ro": "zero.wav",
        "WUN": "one.wav",
        "FIFE": "five.wav",
        "NIN-er": "niner.wav"
    };

    let currentRound = 0;
    let currentAnswer = null;
    let currentLang = 'en';
    let gameActive = false;

    // 🚀 Start Activity 1
    startBtn.addEventListener('click', () => {
        intro.classList.add('d-none');
        game.classList.remove('d-none');
        roundSpan.textContent = "1";
        feedback.classList.add('d-none');
        gameActive = true;
    });

    // 🌐 Toggle Language
    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'id' : 'en';
        langToggleBtn.textContent = currentLang.toUpperCase();
        dialogueTextEl.textContent = dialogueSentences[0][currentLang];
    });

    // 🎧 Play sound untuk soal aktif
    playBtn.addEventListener('click', () => {
        if (!gameActive || currentRound >= questions.length) return;

        const q = questions[currentRound];
        currentAnswer = q.answer;

        const audioPath = `/static/data/audio/warmup/${audioFiles[q.term]}`;
        const audio = new Audio(audioPath);
        audio.play().catch(err => console.error("Audio play failed:", err));

        // Reset feedback dan warna tombol
        feedback.classList.add('d-none');
        document.querySelectorAll('.letter-btn').forEach(b => {
            b.classList.remove('btn-correct', 'btn-wrong');
        });
    });

    // 🎯 User menjawab
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!gameActive || !currentAnswer) return;

            document.querySelectorAll('.letter-btn').forEach(b => {
                b.classList.remove('btn-correct', 'btn-wrong');
            });

            if (btn.dataset.value === currentAnswer) {
                // ✅ Benar
                btn.classList.add('btn-correct');
                feedback.className = "alert alert-success mt-3";
                feedback.textContent = "✅ Correct! Well done, Cadet.";
                feedback.classList.remove("d-none");

                // Lanjut ke ronde berikut
                currentRound++;
                if (currentRound < questions.length) {
                    roundSpan.textContent = currentRound + 1;
                    currentAnswer = null; // supaya harus tekan Play lagi
                } else {
                    // 🎉 Semua selesai
                    roundSpan.textContent = questions.length;
                    feedback.textContent = "🏁 Great job! You've completed the warm-up!";
                    playBtn.disabled = true;
                    nextBtn.classList.remove('d-none');
                    gameActive = false;
                }
            } else {
                // ❌ Salah
                btn.classList.add('btn-wrong');
                feedback.className = "alert alert-danger mt-3";
                feedback.textContent = "❌ Not quite. Try again.";
                feedback.classList.remove("d-none");
                setTimeout(() => btn.classList.remove('btn-wrong'), 400);
            }
        });
    });

    // ⏩ Next ke Activity 2
    nextBtn.addEventListener('click', () => {
        document.getElementById('activity-1').classList.add('d-none');
        document.getElementById('activity-2').classList.remove('d-none');
    });

    // =========================
    // Activity 2: Video + Quiz
    // =========================
    const quizForm = document.getElementById('quiz-form');
    const quizFeedback = document.getElementById('quiz-feedback');
    const toActivity3Btn = document.getElementById('to-activity-3');
    let wrongCount = 0;

    quizForm.addEventListener('change', (e) => {
    const selected = e.target.value;
    if (!selected) return;

    if (selected === "SAILEX") {
        quizFeedback.className = "alert alert-success mt-3 animate-pop";
        quizFeedback.textContent = "✅ Excellent! You caught it.";
        quizFeedback.classList.remove("d-none");
        toActivity3Btn.classList.remove('d-none');
    } else {
        wrongCount++;
        quizFeedback.className = "alert alert-danger mt-3 animate-pop";
        quizFeedback.textContent = "❌ Not quite. Watch again carefully.";
        quizFeedback.classList.remove("d-none");

        if (wrongCount >= 2) {
        quizFeedback.innerHTML += `<br><button id="retry-video" class="btn btn-outline-primary mt-2">Retry Video</button>`;
        document.getElementById('retry-video').addEventListener('click', () => {
            const iframe = document.querySelector('iframe');
            iframe.src = iframe.src; // reload video
            wrongCount = 0;
            quizFeedback.classList.add('d-none');
        });
        }
    }
    });

    // 🚀 Move ke Activity 3
    toActivity3Btn.addEventListener('click', () => {
        console.log("➡️ Moving to Wrap-up..."); // optional untuk debugging
        document.getElementById('activity-2').classList.add('d-none');
        document.getElementById('activity-3').classList.remove('d-none');
    });

    // =========================
    // Activity 3: Wrap-up
    // =========================
    const wrapupTextEl = document.getElementById('wrapup-text');
    const wrapupLangToggle = document.getElementById('wrapup-lang-toggle');
    const wrapupPlayBtn = document.getElementById('wrapup-play');
    const goInputBtn = document.getElementById('go-input-btn');

    const wrapupAudio = new Audio("/static/data/audio/wrapup_lina_en.wav");

    const wrapupTexts = {
        en: "Great job! You’ve just tried the special alphabet and numbers used on ships. Next, Captain Ray will show you the full version so you can use it like real sailors.",
        id: "Kerja bagus! Kalian baru saja mencoba alfabet dan angka khusus yang digunakan di kapal. Selanjutnya, Kapten Ray akan menunjukkan versi lengkapnya supaya kalian bisa menggunakannya seperti pelaut sungguhan."
    };

    let currentWrapLang = 'en';
    let isPlaying = false;

    // 🎧 Audio play/pause
    wrapupPlayBtn.addEventListener('click', () => {
    if (!isPlaying) {
        wrapupAudio.play();
        isPlaying = true;
        wrapupPlayBtn.classList.add('pulse');
        wrapupPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        wrapupAudio.pause();
        isPlaying = false;
        wrapupPlayBtn.classList.remove('pulse');
        wrapupPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    });

    // reset when audio ends
    wrapupAudio.addEventListener('ended', () => {
    isPlaying = false;
    wrapupPlayBtn.classList.remove('pulse');
    wrapupPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    });

    // 🌐 Toggle Language
    wrapupLangToggle.addEventListener('click', () => {
    currentWrapLang = currentWrapLang === 'en' ? 'id' : 'en';
    wrapupLangToggle.textContent = currentWrapLang.toUpperCase();
    wrapupTextEl.classList.remove('fade-in');
    void wrapupTextEl.offsetWidth; // reflow for animation
    wrapupTextEl.textContent = wrapupTexts[currentWrapLang];
    wrapupTextEl.classList.add('fade-in');
    });

});