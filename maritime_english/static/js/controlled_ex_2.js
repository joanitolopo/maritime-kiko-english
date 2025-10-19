// static/js/controlled_ex_2.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = SECTION.questions || [];
  const total = Math.max(questions.length, 10);
  const audioBtn = document.getElementById('ex2-audio-btn');
  const audioEl = document.getElementById('ex2-audio');
  const langToggle = document.getElementById('ex2-lang-toggle');
  const instructionText = document.getElementById('instruction-text');
  const optionsGrid = document.getElementById('options-grid');
  const qNumEl = document.getElementById('q-num');
  const progressEl = document.getElementById('progress-indicator');
  const feedback = document.getElementById('ex2-feedback');
  const fbText = document.getElementById('fb-text');
  const nextBtn = document.getElementById('ex2-next');

  const texts = {
    en: { instruction: SECTION.instruction_en || "Listen and choose the correct number.", correct: "Yes! {word} is {num}.", wrong: "Not quite. Listen again carefully." },
    id: { instruction: SECTION.instruction_id || "Dengarkan dan pilih angka yang benar.", correct: "Ya! {word} adalah {num}.", wrong: "Belum tepat. Dengarkan lagi dengan saksama." }
  };
  let currentLang = 'en';

  // state
  let idx = 0;
  let played = false;
  let answered = false;
  let correctCount = 0;

  function loadAudioForQuestion(q) {
    if (!q || !q.prompt_audio) return;
    audioEl.src = q.prompt_audio;
    audioEl.preload = 'auto';
  }

  function renderQuestion() {
    optionsGrid.innerHTML = '';
    const q = questions[idx];
    qNumEl.textContent = (idx + 1);
    progressEl.textContent = `${idx+1}/${total}`;
    if (q && q.prompt_audio) loadAudioForQuestion(q); else audioEl.removeAttribute('src');
    played = false; answered = false;
    const opts = q && q.options ? q.options : ['1','2','3'];
    opts.forEach(o => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.type = 'button';
      btn.setAttribute('role','radio');
      btn.setAttribute('aria-checked','false');
      btn.dataset.value = o;
      btn.innerText = o;
      btn.addEventListener('click', () => handleOptionClick(btn, q));
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
      optionsGrid.appendChild(btn);
    });
    instructionText.textContent = texts[currentLang].instruction;
    nextBtn.disabled = true;
    audioBtn.disabled = false;
  }

  async function handleOptionClick(btn, questionObj) {
    if (answered) return;
    answered = true;
    const chosen = btn.dataset.value;
    const correct = String(questionObj.correct);
    try { audioEl.pause(); } catch(e){}
    audioBtn.classList.remove('playing');
    audioBtn.disabled = true;

    if (chosen === correct) {
      btn.classList.add('option-correct');
      btn.setAttribute('aria-checked','true');
      showFeedback(true, questionObj);
      correctCount++;
    } else {
      btn.classList.add('option-wrong');
      btn.setAttribute('aria-checked','false');
      showFeedback(false, questionObj);
      setTimeout(() => {
        const allBtns = Array.from(optionsGrid.querySelectorAll('.option-btn'));
        const correctBtn = allBtns.find(b => b.dataset.value === correct);
        if (correctBtn) { correctBtn.classList.add('option-correct'); correctBtn.setAttribute('aria-checked','true'); }
      }, 420);
    }

    nextBtn.disabled = false;
  }

  function showFeedback(isCorrect, q) {
    if (!feedback) return;
    if (isCorrect) {
      const text = texts[currentLang].correct.replace('{word}', q.prompt_text || '').replace('{num}', q.correct);
      fbText.textContent = text;
    } else {
      fbText.textContent = texts[currentLang].wrong;
    }
    feedback.classList.remove('visually-hidden');
    setTimeout(() => { if (feedback) feedback.classList.add('visually-hidden'); }, 2600);
  }

  if (audioBtn && audioEl) {
    audioBtn.addEventListener('click', async () => {
      if (!audioEl.src) { console.warn('No audio source for this question'); return; }
      if (audioEl.paused) {
        try { await audioEl.play(); audioBtn.classList.add('playing'); played = true; } 
        catch (err) { console.error('Audio play failed', err); alert('Audio gagal diputar. Periksa file audio di server.'); }
      } else {
        audioEl.pause(); audioBtn.classList.remove('playing');
      }
    });
    audioEl.addEventListener('ended', () => { audioBtn.classList.remove('playing'); });
  }

  nextBtn.addEventListener('click', () => {
    if (idx < (total - 1)) {
      idx++;
      renderQuestion();
    } else {
      const nextHref = nextBtn.dataset.next;
      if (nextHref) window.location.href = nextHref;
      else console.warn('Next section not configured for controlled_ex_2');
    }
  });

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      instructionText.textContent = texts[currentLang].instruction;
    });
  }

  // normalize questions if needed
  function normalizeQuestions() {
    const out = [];
    for (let i=0;i<total;i++) {
      const q = questions[i] || questions[i % (questions.length || 1)] || { prompt_text: 'Niner', prompt_audio: '', correct: '9', options: ['9','5','4'] };
      out.push(q);
    }
    return out;
  }
  const normalized = normalizeQuestions();
  SECTION.questions = normalized;

  renderQuestion();

  nextBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); } });

  window.addEventListener('beforeunload', () => { try { audioEl.pause(); audioEl.currentTime = 0; } catch(e){} });
});
