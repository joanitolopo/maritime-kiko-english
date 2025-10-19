// static/js/assessment_q2.js
// Numbers quiz runner (10 questions). Instant feedback, Next enabled after answer.
// Highlights special numbers (3,5,9) with yellow glow in the radio display.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) && SECTION.questions.length ? SECTION.questions : [];
  const total = questions.length || 10;

  // DOM refs
  const langToggle = document.getElementById('q-lang-toggle');
  const qNumberEl = document.getElementById('question-number');
  const qText = document.getElementById('q-text');
  const optionsList = document.getElementById('options-list');
  const nextBtn = document.getElementById('next-question');
  const feedbackBubble = document.getElementById('quiz-feedback');
  const fbText = document.getElementById('fb-text');
  const bigDigit = document.getElementById('big-digit');
  const radioDisplay = document.getElementById('radio-display');

  let currentIndex = 0;
  let answered = false;
  let currentLang = 'en';
  let score = 0;

  // fallback numeric questions (0-9 repeated) if none supplied
  if (!questions.length) {
    console.warn('No SECTION.questions found for assessment_q2 — using fallback number questions.');
    const base = ["0","1","2","3","4","5","6","7","8","9"];
    for (let i=0;i<10;i++) {
      const n = base[i % base.length];
      const correctPron = ({'0':'Zero','1':'Wun','2':'Too','3':'Tree','4':'Fower','5':'Fife','6':'Six','7':'Seven','8':'Eight','9':'Niner'})[n];
      const opts = [
        { text_en: correctPron, text_id: correctPron, correct: true },
        { text_en: 'Distractor A', text_id: 'Distraktor A', correct: false },
        { text_en: 'Distractor B', text_id: 'Distraktor B', correct: false }
      ];
      questions.push({
        number: n,
        text_en: `What is the correct pronunciation for the number ${n} in Maritime English?`,
        text_id: `Apa pengucapan yang benar untuk angka ${n} dalam Bahasa Inggris Maritim?`,
        options: opts
      });
    }
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    const numDisplay = q.number || (q.prompt_number || q.value || '');
    qNumberEl.textContent = `Question ${currentIndex+1} of ${total}`;
    qText.textContent = currentLang === 'id' ? (q.text_id || q.text_en) : (q.text_en || q.text_id);

    // show big digit in radio display for visual emphasis
    bigDigit.textContent = numDisplay || '—';
    radioDisplay.classList.remove('glow-9','glow-3','glow-5');
    if (['3','5','9'].includes(String(numDisplay))) {
      radioDisplay.classList.add({
        '3':'glow-3',
        '5':'glow-5',
        '9':'glow-9'
      }[String(numDisplay)]);
    }

    // build options
    optionsList.innerHTML = '';
    (q.options || []).forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-item';
      btn.setAttribute('data-index', idx);
      btn.setAttribute('data-correct', opt.correct ? '1' : '0');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.innerHTML = `<span class="opt-label">${String.fromCharCode(65+idx)}.</span>
                       <span class="opt-text">${ currentLang === 'id' ? (opt.text_id || opt.text_en) : (opt.text_en || opt.text_id) }</span>`;
      optionsList.appendChild(btn);
    });

    // reset state
    answered = false;
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled', 'true');
    feedbackBubble.classList.add('visually-hidden');

    // focus first option for accessibility
    const first = optionsList.querySelector('.option-item');
    if (first) first.focus();
  }

  function showFeedback(msg) {
    if (!feedbackBubble || !fbText) return;
    fbText.textContent = msg;
    feedbackBubble.classList.remove('visually-hidden');
    // auto-hide after 3s
    setTimeout(() => {
      try { feedbackBubble.classList.add('visually-hidden'); } catch(e){}
    }, 3000);
  }

  // handle option click
  optionsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.option-item');
    if (!btn || answered) return;

    const items = Array.from(optionsList.querySelectorAll('.option-item'));
    items.forEach(it => { it.setAttribute('aria-checked','false'); it.classList.remove('correct','incorrect'); });

    btn.setAttribute('aria-checked','true');
    answered = true;
    const isCorrect = btn.dataset.correct === '1' || btn.dataset.correct === 'true';

    if (isCorrect) {
      btn.classList.add('correct');
      score++;
      const correctMsg = currentLang === 'id' ? (SECTION.feedback_correct_id || '✔ Benar!') : (SECTION.feedback_correct_en || '✔ Correct!');
      showFeedback(correctMsg + (currentLang==='en' ? ` (${score}/${total})` : ` (${score}/${total})`));
    } else {
      btn.classList.add('incorrect');
      const correctBtn = items.find(it => it.dataset.correct === '1' || it.dataset.correct === 'true');
      if (correctBtn) correctBtn.classList.add('correct');
      const correctText = correctBtn ? correctBtn.querySelector('.opt-text').textContent : '';
      const incorrectMsg = currentLang === 'id' ? (SECTION.feedback_incorrect_id || `Tidak benar. Jawaban yang benar adalah ${correctText}.`) :
                                                 (SECTION.feedback_incorrect_en || `Not quite. The correct answer is ${correctText}.`);
      showFeedback(incorrectMsg);
    }

    // enable Next
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
  });

  // keyboard navigation
  optionsList.addEventListener('keydown', (e) => {
    const items = Array.from(optionsList.querySelectorAll('.option-item'));
    if (!items.length) return;
    let idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      idx = (idx + 1 + items.length) % items.length;
      items[idx].focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      idx = (idx - 1 + items.length) % items.length;
      items[idx].focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement.classList.contains('option-item')) {
      e.preventDefault();
      document.activeElement.click();
    }
  });

  // Next: advance or finish
  nextBtn.addEventListener('click', () => {
    if (!answered) {
      alert(currentLang === 'id' ? 'Silakan pilih jawaban sebelum melanjutkan.' : 'Please select an answer before continuing.');
      return;
    }
    currentIndex++;
    if (currentIndex >= total) {
      // finished
      const nextPath = SECTION.start_next_section_path || SECTION.start_next_section || null;
      const summaryMsg = currentLang === 'id' ? `Selesai! Skormu: ${score}/${total}` : `Finished! Your score: ${score}/${total}`;
      if (nextPath) {
        // brief summary then redirect (200ms)
        setTimeout(() => { window.location.href = nextPath; }, 200);
        alert(summaryMsg);
      } else {
        alert(summaryMsg);
      }
      return;
    }
    renderQuestion();
  });

  // language toggle
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      renderQuestion();
    });
  }

  // initial render
  renderQuestion();
});
