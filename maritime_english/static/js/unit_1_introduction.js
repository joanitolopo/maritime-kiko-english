// Improved introduction.js
document.addEventListener('DOMContentLoaded', () => {
  const dialogueTextEl = document.getElementById('dialogue-text');
  const nextBtn = document.getElementById('next-btn');
  const continueLink = document.getElementById('continue-btn');
  const introAudio = document.getElementById('intro-audio');
  const langToggleBtn = document.getElementById('lang-toggle-btn');
  const audioBtn = document.getElementById('audio-btn');

  const dialogueSentences = [
    { en: "Ahoy, cadets! Welcome aboard.", id: "Halo, kadet! Selamat datang di kapal.", audio: "/static/data/audio/tts-audio01.wav" },
    { en: "This unit is about the alphabet and numbers we use at sea.", id: "Unit ini tentang alfabet dan angka yang digunakan di laut.", audio: "/static/data/audio/tts-audio02.wav" },
    { en: "On ships, we don’t just say A, B, C… or one, two, three.", id: "Di kapal, kami tidak hanya mengatakan A, B, C... atau satu, dua, tiga.", audio: "/static/data/audio/tts-audio03.wav" },
    { en: "We use a special system to keep our messages clear, even in storms or noisy conditions.", id: "Kami menggunakan sistem khusus agar pesan tetap jelas, bahkan saat badai atau kondisi bising.", audio: "/static/data/audio/tts-audio04.wav" },
    { en: "It’s called the NATO Phonetic Alphabet.", id: "Sistem ini disebut Alfabet Fonetik NATO.", audio: "/static/data/audio/tts-audio05.wav" },
    { en: "Let’s start with a quick warm-up!", id: "Mari mulai dengan pemanasan singkat!", audio: "/static/data/audio/tts-audio06.wav" }
  ];

  let index = 0;
  let typing = false;
  let currentLang = 'en';
  let playedOnce = false;

  // Accessibility init
  if (continueLink) {
    continueLink.classList.add('btn-disabled');
    continueLink.setAttribute('aria-disabled','true');
  }

  // Typing function (adds/removes .typing class)
  function typeText(text, callback) {
    typing = true;
    dialogueTextEl.classList.remove('no-cursor');
    dialogueTextEl.classList.add('typing');
    dialogueTextEl.textContent = '';
    let i = 0;
    const speed = 28; // ms per char (adjust)
    const timer = setInterval(() => {
      if (i < text.length) {
        dialogueTextEl.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        typing = false;
        dialogueTextEl.classList.remove('typing');
        dialogueTextEl.classList.add('no-cursor');
        if (typeof callback === 'function') callback();
      }
    }, speed);
  }

  // show a sentence (play audio + type)
  async function showSentence(i) {
    if (i < 0 || i >= dialogueSentences.length) return;
    const s = dialogueSentences[i];
    const text = s[currentLang];
    // set audio src and attempt to play
    if (introAudio) {
      introAudio.src = s.audio;
      introAudio.muted = false;
      try {
        // try to play (user click required in some browsers). we catch errors.
        await introAudio.play();
        playedOnce = true;
      } catch (err) {
        console.warn('Audio play blocked or missing:', err);
      }
    }
    // show typed text
    typeText(text, () => {
      // after typing completes: if last sentence -> enable continue else show next
      if (i === dialogueSentences.length - 1) {
        // enable continue link
        if (continueLink) {
          continueLink.classList.remove('btn-disabled');
          continueLink.setAttribute('aria-disabled','false');
        }
        nextBtn.textContent = 'Done';
      }
      nextBtn.disabled = false;
    });
  }

  // initial show after small delay
  setTimeout(() => {
    nextBtn.disabled = true;
    showSentence(index);
    index++;
  }, 600);

  // Next handler
  nextBtn.addEventListener('click', () => {
    if (typing) return;
    if (index >= dialogueSentences.length) {
      // already at end - navigate to warmup
      if (continueLink && continueLink.href && continueLink.getAttribute('aria-disabled') !== 'true') {
        window.location.href = continueLink.href;
      }
      return;
    }
    nextBtn.disabled = true;
    showSentence(index);
    index++;
  });

  // Play / Pause audio button
  audioBtn.addEventListener('click', async () => {
    if (!introAudio.src) return;
    if (!introAudio.paused) {
      introAudio.pause();
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
      try {
        await introAudio.play();
        audioBtn.classList.add('playing');
        audioBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playedOnce = true;
        // if last sentence already typed, enable continue
        if (index >= dialogueSentences.length && continueLink) {
          continueLink.classList.remove('btn-disabled');
          continueLink.setAttribute('aria-disabled','false');
        }
      } catch (err) {
        console.warn('Audio play failed:', err);
        // friendly UI hint
        alert('Cannot play audio now. Please check your sound or play once on the page.');
      }
    }
  });

  introAudio.addEventListener('ended', () => {
    audioBtn.classList.remove('playing');
    audioBtn.innerHTML = '<i class="fas fa-play"></i>';
    // show positive toast (non-blocking)
  });

  // Language toggle: switch on-screen text only (audio remains EN)
  langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    langToggleBtn.textContent = currentLang.toUpperCase();
    // update currently visible sentence immediately
    const visibleIndex = Math.max(0, index - 1);
    if (visibleIndex < dialogueSentences.length) {
      const txt = dialogueSentences[visibleIndex][currentLang];
      // if typing in progress, abort typing and show translation
      if (typing) {
        // fast stop typing
        dialogueTextEl.classList.remove('typing');
        dialogueTextEl.classList.add('no-cursor');
        typing = false;
      }
      dialogueTextEl.textContent = txt;
    }
  });

  // keyboard support for Next (Enter)
  nextBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
  });

});
