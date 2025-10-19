// static/js/assessment_distress_multi.js
// Assessment: Distress / Emergency questions (MCQ). Instant feedback, Next enabled after choice.
// Expects window.SECTION with questions array and total_questions.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) ? SECTION.questions : [];
  const total = SECTION.total_questions || questions.length || 10;
  const nextPath = SECTION.next_path || null;

  // Elements
  const langToggle = document.getElementById('distress-lang-toggle');
  const qText = document.getElementById('q-text');
  const qNum = document.getElementById('question-number');
  const optionsWrap = document.getElementById('options-wrap');
  const nextBtn = document.getElementById('next-question');
  const feedback = document.getElementById('distress-feedback');
  const fbText = document.getElementById('fb-text');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const redIndicator = document.getElementById('red-indicator');

  let currentLang = 'en';
  let idx = 0;
  let answered = false;

  const msgs = {
    en: {
      correct: (text) => `✔ Correct! ${text}`,
      incorrect: (text) => `✖ Not correct. ${text}`
    },
    id: {
      correct: (text) => `✔ Benar! ${text}`,
      incorrect: (text) => `✖ Tidak benar. ${text}`
    }
  };

  function showFeedback(msg, positive=true) {
    fbText.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.toggle('positive', positive);
    feedback.classList.toggle('negative', !positive);
    setTimeout(() => feedback.classList.add('visually-hidden'), 3000);
  }

  function renderOptions(opts, correctIndex) {
    optionsWrap.innerHTML = '';
    opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.type = 'button';
      btn.dataset.index = i;
      btn.dataset.correct = (i === correctIndex) ? '1' : '0';
      btn.innerHTML = `<span class="opt-label">${String.fromCharCode(65 + i)}.</span> <span class="opt-text">${opt}</span>`;
      btn.addEventListener('click', () => handleChoice(btn, i));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
      optionsWrap.appendChild(btn);
    });
  }

  function pulseRedIndicator(duration = 1200) {
    if (!redIndicator) return;
    redIndicator.classList.add('pulse');
    setTimeout(() => redIndicator.classList.remove('pulse'), duration);
  }

  function handleChoice(btn, choiceIndex) {
    if (answered) return;
    answered = true;
    Array.from(optionsWrap.querySelectorAll('.option-btn')).forEach(b => b.disabled = true);

    const correct = btn.dataset.correct === '1';
    const q = questions[idx];
    if (correct) {
      btn.classList.add('correct');
      showFeedback((currentLang === 'en' ? msgs.en.correct(q.feedback_en || 'Correct!') : msgs.id.correct(q.feedback_id || 'Benar!')), true);
    } else {
      btn.classList.add('incorrect');
      btn.classList.add('vibrate');
      setTimeout(() => btn.classList.remove('vibrate'), 360);
      const correctBtn = optionsWrap.querySelector('.option-btn[data-correct="1"]');
      if (correctBtn) correctBtn.classList.add('correct');
      showFeedback((currentLang === 'en' ? msgs.en.incorrect(q.feedback_en || 'Not correct') : msgs.id.incorrect(q.feedback_id || 'Tidak benar')), false);
    }

    // visual cue (if question is distress opening, pulse red)
    if (q.highlight_red) {
      pulseRedIndicator(1200);
    }

    // update progress
    progressFill.style.width = `${Math.round(((idx+1)/total)*100)}%`;
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
  }

  function renderQuestion() {
    answered = false;
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled','true');

    if (idx < 0) idx = 0;
    if (idx >= total) idx = total - 1;

    const q = questions[idx];
    qNum.textContent = `Question ${idx+1} of ${total}`;
    progressText.textContent = `${idx+1}/${total}`;
    progressFill.style.width = `${Math.round((idx/total)*100)}%`;

    // set red indicator text if requested
    if (q && q.highlight_text) {
      redIndicator.textContent = q.highlight_text;
    } else {
      redIndicator.textContent = '';
    }

    const prompt = (currentLang === 'id' && q.prompt_id) ? q.prompt_id : (q.prompt_en || '');
    qText.innerHTML = prompt;

    // render options
    const opts = q.options || [];
    const correctIndex = (typeof q.correct_index === 'number') ? q.correct_index : 0;
    renderOptions(opts, correctIndex);
  }

  nextBtn.addEventListener('click', () => {
    if (!answered) return;
    if (idx < total - 1) {
      idx++;
      renderQuestion();
    } else {
      if (nextPath) {
        window.location.href = nextPath;
      } else {
        alert(currentLang === 'id' ? 'Assessment selesai.' : 'Distress assessment completed.');
      }
    }
  });

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    renderQuestion();
  });

  nextBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
  });

  // init
  if (!questions.length) {
    qText.textContent = currentLang === 'id' ? 'Tidak ada soal darurat dikonfigurasi.' : 'No distress questions configured.';
    return;
  }
  renderQuestion();
});
