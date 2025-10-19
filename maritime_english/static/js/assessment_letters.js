// static/js/assessment_q1.js
// Quiz runner: iterate an array of questions (letters). Show progress, instant feedback,
// enable Next after answer. After last question, navigate to SECTION.start_next_section.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) && SECTION.questions.length ? SECTION.questions : [];
  const total = questions.length || 10;

  // DOM
  const langToggle = document.getElementById('q-lang-toggle');
  const qNumberEl = document.getElementById('question-number');
  const qText = document.getElementById('q-text');
  const optionsList = document.getElementById('options-list');
  const nextBtn = document.getElementById('next-question');
  const feedbackBubble = document.getElementById('quiz-feedback');
  const fbText = document.getElementById('fb-text');

  let currentIndex = 0;
  let answered = false;
  let currentLang = 'en';
  let score = 0;

  // Defensive default questions when none provided
  if (!questions.length) {
    console.warn('No questions found in SECTION.questions — using fallback demo questions.');
    // create simple fallback letter questions (A..J)
    const alpha = "ABCDEFGHIJ".split('');
    alpha.forEach((ch, i) => {
      questions.push({
        letter: ch,
        text_en: `What is the correct NATO code word for the letter ${ch}?`,
        text_id: `Apa kode NATO yang benar untuk huruf ${ch}?`,
        options: [
          { text_en: ch === 'A' ? 'Alpha' : 'Option1_'+i, text_id: ch === 'A' ? 'Alpha' : 'Opsi1_'+i, correct: ch==='A' },
          { text_en: 'Distractor2_'+i, text_id: 'Distr2_'+i, correct: false },
          { text_en: 'Distractor3_'+i, text_id: 'Distr3_'+i, correct: false }
        ]
      });
    });
  }

  function renderQuestion() {
    const q = questions[currentIndex];
    qNumberEl.textContent = `Question ${currentIndex+1} of ${total}`;
    qText.textContent = currentLang === 'id' ? (q.text_id || q.text_en) : (q.text_en || q.text_id);
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
    // set focus to first option for accessibility
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
    }, 3200);
  }

  // click handler (event delegation)
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
      // feedback text from SECTION (if provided) else default
      const correctMsg = currentLang === 'id' ? (SECTION.feedback_correct_id || '✔ Benar!') : (SECTION.feedback_correct_en || '✔ Correct!');
      showFeedback(correctMsg);
    } else {
      btn.classList.add('incorrect');
      // mark the correct one
      const correctBtn = items.find(it => it.dataset.correct === '1' || it.dataset.correct === 'true');
      if (correctBtn) correctBtn.classList.add('correct');
      const correctText = correctBtn ? correctBtn.querySelector('.opt-text').textContent : '';
      const incorrectMsg = currentLang === 'id' ? (SECTION.feedback_incorrect_id || `Tidak benar. Jawaban yang benar adalah ${correctText}.`) :
                                                 (SECTION.feedback_incorrect_en || `Not correct. The right answer is ${correctText}.`);
      showFeedback(incorrectMsg);
    }

    // enable Next
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
  });

  // keyboard support for radio-like controls
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

  // Next button: advance question or finish
  nextBtn.addEventListener('click', () => {
    if (!answered) {
      alert(currentLang === 'id' ? 'Silakan pilih jawaban sebelum melanjutkan.' : 'Please select an answer before continuing.');
      return;
    }
    currentIndex++;
    if (currentIndex >= total) {
      // quiz finished: navigate to next section if provided, else show score summary
      const nextSection = SECTION.start_next_section;
      if (nextSection) {
        // redirect to next section route
        // you may prefer a different route; by default follow earlier pattern:
        const href = SECTION.next_href || null;
        if (href) {
          window.location.href = href;
        } else {
          // try using learning.learning_unit pattern: build path
          // we don't have unit id here reliably in all contexts; try SECTION.start_next_section route path
          // fallback: show a simple summary then redirect after 1.2s to start_next_section URL built from data attribute
          const redirectUrl = SECTION.start_next_section_path || null;
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }
          // fallback: show summary then attempt to use window.location.pathname replace
          alert( currentLang === 'id' ? `Selesai! Skor Anda: ${score}/${total}` : `Finished! Your score: ${score}/${total}` );
        }
      } else {
        alert( currentLang === 'id' ? `Selesai! Skor Anda: ${score}/${total}` : `Finished! Your score: ${score}/${total}` );
      }
      return;
    }
    // render next
    renderQuestion();
  });

  // language toggle
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      // re-render question texts in chosen lang
      renderQuestion();
    });
  }

  // initial render
  renderQuestion();
});
