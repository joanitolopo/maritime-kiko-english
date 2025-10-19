// static/js/controlled_ex_1.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = SECTION.questions || [];
  const total = Math.max(questions.length, 10); // if JSON has <10, still use length
  const audioBtn = document.getElementById('ex1-audio-btn');
  const audioEl = document.getElementById('ex1-audio');
  const langToggle = document.getElementById('ex1-lang-toggle');
  const instructionText = document.getElementById('instruction-text');
  const optionsGrid = document.getElementById('options-grid');
  const qNumEl = document.getElementById('q-num');
  const progressEl = document.getElementById('progress-indicator');
  const feedback = document.getElementById('ex1-feedback');
  const fbText = document.getElementById('fb-text');
  const nextBtn = document.getElementById('ex1-next');

  const texts = {
    en: { instruction: SECTION.instruction_en || "Listen and choose the correct letter.", correct: "Good job! {ans} is {letter}.", wrong: "Not quite. Listen again carefully, you can do it." },
    id: { instruction: SECTION.instruction_id || "Dengarkan dan pilih huruf yang benar.", correct: "Bagus! {ans} adalah {letter}.", wrong: "Belum tepat. Dengarkan lagi dengan saksama, kamu pasti bisa." }
  };
  let currentLang = 'en';

  // state
  let idx = 0;
  let played = false;      // whether audio has been played for current question (plays allowed until selection)
  let answered = false;    // whether user already selected for current Q
  let correctCount = 0;

  // preload question audio path list for reliability
  function loadAudioForQuestion(q) {
    if (!q || !q.prompt_audio) return;
    audioEl.src = q.prompt_audio;
    audioEl.preload = 'auto';
  }

  // render options for current question
  function renderQuestion() {
    optionsGrid.innerHTML = '';
    const q = questions[idx];
    qNumEl.textContent = (idx + 1);
    progressEl.textContent = `${idx+1}/${total}`;
    // set audio src
    if (q && q.prompt_audio) {
      loadAudioForQuestion(q);
    } else {
      audioEl.removeAttribute('src');
    }
    // reset flags
    played = false;
    answered = false;
    // build options
    const opts = q && q.options ? q.options : ['A','B','C'];
    opts.forEach(o => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.type = 'button';
      btn.setAttribute('role','radio');
      btn.setAttribute('aria-checked','false');
      btn.dataset.letter = o;
      btn.innerText = o;
      // click handler
      btn.addEventListener('click', () => handleOptionClick(btn, q));
      // keyboard support
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
      optionsGrid.appendChild(btn);
    });

    // update instruction text language wise
    instructionText.textContent = texts[currentLang].instruction;
    // disable next until feedback shown
    nextBtn.disabled = true;
  }

  // handle option click
  async function handleOptionClick(btn, questionObj) {
    if (answered) return; // ignore double clicks
    // Only allow selection after or during audio? spec: audio can be replayed before selecting, but selection allowed anytime.
    // We'll allow selection anytime, but audio button will be disabled after choosing.
    answered = true;
    const chosen = btn.dataset.letter;
    const correct = questionObj.correct;
    // disable audio replay now
    try { audioEl.pause(); } catch(e){}
    audioBtn.classList.remove('playing');
    audioBtn.disabled = true;

    if (chosen === correct) {
      btn.classList.add('option-correct');
      btn.setAttribute('aria-checked','true');
      showFeedback(true, questionObj, chosen);
      correctCount++;
    } else {
      btn.classList.add('option-wrong');
      btn.setAttribute('aria-checked','false');
      showFeedback(false, questionObj, chosen);
      // also show correct visually after small delay
      setTimeout(() => {
        const allBtns = Array.from(optionsGrid.querySelectorAll('.option-btn'));
        const correctBtn = allBtns.find(b => b.dataset.letter === correct);
        if (correctBtn) {
          correctBtn.classList.add('option-correct');
          correctBtn.setAttribute('aria-checked','true');
        }
      }, 420);
    }

    // enable Next and update progress — per spec Next becomes active after feedback
    nextBtn.disabled = false;
    // increment idx only when user presses Next (so they can review)
  }

  // show feedback bubble
  function showFeedback(isCorrect, questionObj, chosen) {
    if (!feedback) return;
    if (isCorrect) {
      const text = texts[currentLang].correct.replace('{ans}', questionObj.prompt_text || questionObj.correct).replace('{letter}', questionObj.correct);
      fbText.textContent = text;
    } else {
      fbText.textContent = texts[currentLang].wrong;
    }
    feedback.classList.remove('visually-hidden');
    // hide after a bit, but Next remains enabled
    setTimeout(() => {
      if (feedback) feedback.classList.add('visually-hidden');
    }, 2500);
  }

  // audio play controls (only available until selection)
  if (audioBtn && audioEl) {
    audioBtn.addEventListener('click', async () => {
      if (!audioEl.src) {
        console.warn('No audio source for this question');
        return;
      }
      if (audioEl.paused) {
        try {
          await audioEl.play();
          audioBtn.classList.add('playing');
          played = true;
        } catch (err) {
          console.error('Audio play failed', err);
          alert('Audio gagal diputar. Periksa file audio di server.');
        }
      } else {
        audioEl.pause();
        audioBtn.classList.remove('playing');
      }
    });

    audioEl.addEventListener('ended', () => {
      audioBtn.classList.remove('playing');
    });
  }

  // next button: advance to next question or next section when finished
  nextBtn.addEventListener('click', () => {
    // advance index
    if (idx < (total - 1)) {
      idx++;
      renderQuestion();
      // re-enable audio
      audioBtn.disabled = false;
    } else {
      // finished set - navigate to configured next section
      const nextHref = nextBtn.dataset.next;
      if (nextHref) {
        window.location.href = nextHref;
      } else {
        console.warn('Next section not configured for controlled_ex_1');
      }
    }
  });

  // language toggle
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      instructionText.textContent = texts[currentLang].instruction;
    });
  }

  // initialize questions: if SECTION.questions shorter than total, fill with repeats or dummy (prefer provided)
  function normalizeQuestions() {
    const out = [];
    for (let i=0;i<total;i++) {
      const q = questions[i] || questions[i % (questions.length || 1)] || {
        prompt_text: 'Alpha', prompt_audio: '', correct: 'A', options: ['A','B','C']
      };
      out.push(q);
    }
    return out;
  }

  // replace questions array with normalized
  const normalized = normalizeQuestions();
  // replace global questions reference
  SECTION.questions = normalized;

  // initial render
  renderQuestion();

  // accessibility: keyboard Next with Enter on nextBtn
  nextBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
  });

  // cleanup audio on unload
  window.addEventListener('beforeunload', () => {
    try { audioEl.pause(); audioEl.currentTime = 0; } catch(e){}
  });
});
