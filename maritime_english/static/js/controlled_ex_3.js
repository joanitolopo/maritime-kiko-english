// static/js/controlled_ex_3.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questionsRaw = SECTION.questions || [];
  const total = Math.max(questionsRaw.length, 10);

  const audioBtn = document.getElementById('ex3-audio-btn');
  const audioEl = document.getElementById('ex3-audio');
  const bigLetter = document.getElementById('big-letter');
  const visualPrompt = document.getElementById('visual-prompt');
  const audioPrompt = document.getElementById('audio-prompt');
  const promptTypeLabel = document.getElementById('prompt-type');
  const answerInput = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-btn');
  const feedback = document.getElementById('ex3-feedback');
  const fbText = document.getElementById('ex3-fb-text');
  const nextBtn = document.getElementById('ex3-next');
  const progressEl = document.getElementById('progress-indicator');
  const langToggle = document.getElementById('ex3-lang-toggle');
  const instructionText = document.getElementById('instruction-text');

  const texts = {
    en: {
      instruction: SECTION.instruction_en || "Listen to the audio and type the correct letter. Sometimes you will also see a letter — type the correct NATO code word for it.",
      correct: "Correct! {word} = {letter}",
      wrong: "Not quite. Replay and try again."
    },
    id: {
      instruction: SECTION.instruction_id || "Dengarkan audio dan ketik huruf yang benar. Kadang kalian juga akan melihat huruf – ketik kata kode NATO yang sesuai.",
      correct: "Benar! {word} = {letter}",
      wrong: "Belum tepat. Putar ulang dan coba lagi."
    }
  };
  let currentLang = 'en';

  // normalize questions to length total
  function normalize() {
    const out = [];
    for (let i=0;i<total;i++) {
      const q = questionsRaw[i] || questionsRaw[i % (questionsRaw.length || 1)] || {};
      // ensure type: 'A' or 'B'
      out.push(Object.assign({
        type: 'A',            // 'A' audio->letter, 'B' letter->codeword
        prompt_audio: '',
        prompt_letter: 'A',
        correct_letter: 'A',
        correct_word: 'Alpha',
      }, q));
    }
    return out;
  }
  const questions = normalize();

  let idx = 0;
  let answered = false;
  let played = false;

  function render() {
    const q = questions[idx];
    progressEl.textContent = `${idx+1}/${total}`;
    answerInput.value = '';
    answerInput.classList.remove('input-correct','input-wrong');
    nextBtn.disabled = true;
    answered = false;
    played = false;
    // show/hide UI based on type
    if (q.type === 'B') {
      visualPrompt.hidden = false;
      audioPrompt.hidden = true;
      bigLetter.textContent = (q.prompt_letter || q.correct_letter || 'A').toUpperCase();
      promptTypeLabel.textContent = 'Type the NATO code word for the letter shown';
    } else {
      visualPrompt.hidden = true;
      audioPrompt.hidden = false;
      if (q.prompt_audio) {
        audioEl.src = q.prompt_audio;
        audioEl.preload = 'auto';
      } else {
        audioEl.removeAttribute('src');
      }
      promptTypeLabel.textContent = 'Listen and type the letter you hear';
    }
    instructionText.textContent = texts[currentLang].instruction;
    answerInput.focus();
    // allow audio play before submit (require at least one play? spec says audio only can be replayed before choosing — we allow play any time but UX encourages play)
  }

  // audio play handling
  if (audioBtn && audioEl) {
    audioBtn.addEventListener('click', async () => {
      if (!audioEl.src) { console.warn('No audio src for question', idx); return; }
      try {
        if (audioEl.paused) {
          await audioEl.play();
          audioBtn.classList.add('playing');
          played = true;
        } else {
          audioEl.pause();
          audioBtn.classList.remove('playing');
        }
      } catch (err) {
        console.error('Audio play failed', err);
        alert('Audio gagal diputar. Cek file audio pada server.');
      }
    });
    audioEl.addEventListener('ended', () => { audioBtn.classList.remove('playing'); });
  }

  // normalization helpers for checking
  function normalizeAnswer(ans) {
    return (ans || '').toString().trim().toLowerCase();
  }

  function checkAnswer(user) {
    const q = questions[idx];
    if (q.type === 'B') {
      // expect code word (e.g., Echo)
      return normalizeAnswer(user) === normalizeAnswer(q.correct_word);
    } else {
      // expect single letter
      return normalizeAnswer(user) === normalizeAnswer(q.correct_letter);
    }
  }

  function showFeedback(isCorrect) {
    const q = questions[idx];
    if (isCorrect) {
      const tpl = texts[currentLang].correct.replace('{word}', q.correct_word || '').replace('{letter}', q.correct_letter || '');
      fbText.textContent = tpl;
      answerInput.classList.add('input-correct');
    } else {
      fbText.textContent = texts[currentLang].wrong;
      answerInput.classList.add('input-wrong');
    }
    feedback.classList.remove('visually-hidden');
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
    }, 2200);
  }

  submitBtn.addEventListener('click', () => {
    if (answered) return;
    const val = answerInput.value || '';
    if (!val.trim()) {
      // nothing typed
      answerInput.classList.add('input-wrong');
      showFeedback(false);
      answered = true;
      nextBtn.disabled = false;
      return;
    }
    const ok = checkAnswer(val);
    showFeedback(ok);
    answered = true;
    nextBtn.disabled = false;
  });

  answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
  });

  // next behavior
  nextBtn.addEventListener('click', () => {
    if (idx < (total - 1)) {
      idx++;
      render();
    } else {
      const nextHref = nextBtn.dataset.next;
      if (nextHref) window.location.href = nextHref;
      else console.warn('Next not configured for controlled_ex_3');
    }
  });

  // language toggle
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      instructionText.textContent = texts[currentLang].instruction;
      // update feedback text if visible
      if (!feedback.classList.contains('visually-hidden')) {
        // no-op: feedback reset on next submit
      }
    });
  }

  // init
  render();

  // cleanup audio on unload
  window.addEventListener('beforeunload', () => { try { if (audioEl) { audioEl.pause(); audioEl.currentTime = 0; } } catch(e){} });
});
