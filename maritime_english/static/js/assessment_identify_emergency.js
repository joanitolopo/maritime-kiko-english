// static/js/assessment_identify_emergency.js
// Multi-question assessment (10 Qs) for Identify Emergency.
// Handles language toggle, render questions, instant feedback, progress and final redirect.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const QUESTIONS = Array.isArray(SECTION.questions) ? SECTION.questions : [];
  const total = QUESTIONS.length || 10;
  const next_path = SECTION.next_path || null;

  // Elements
  const langToggle = document.getElementById('em-lang-toggle');
  const qText = document.getElementById('q-text');
  const optionsWrap = document.getElementById('options-wrap');
  const feedback = document.getElementById('em-feedback');
  const fbText = document.getElementById('fb-text');
  const nextBtn = document.getElementById('next-question');
  const prevBtn = document.getElementById('prev-question');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const qNumber = document.getElementById('question-number');
  const redLight = document.querySelector('.red-light');

  let currentLang = 'en';
  let currentIndex = 0; // 0-based
  let answeredMap = new Array(total).fill(false);

  if (!QUESTIONS.length) {
    qText.textContent = currentLang === 'id' ? 'Soal belum dikonfigurasi.' : 'No questions configured.';
    return;
  }

  function renderCurrent() {
    const q = QUESTIONS[currentIndex];
    // header
    qNumber.textContent = `Question ${currentIndex+1} of ${total}`;
    progressText.textContent = `${currentIndex+1}/${total} Questions`;
    const percent = Math.round(((currentIndex)/total) * 100);
    progressFill.style.width = `${percent}%`;

    // red light subtle pulse on "distress" context (if q.emergency_flag true)
    if (redLight) {
      if (q.emergency_flag) { redLight.classList.add('pulse'); }
      else redLight.classList.remove('pulse');
    }

    // prompt
    const prompt = (currentLang === 'id' && q.prompt_id) ? q.prompt_id : q.prompt_en;
    qText.innerHTML = prompt;

    // options
    optionsWrap.innerHTML = '';
    (q.options || []).forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.dataset.value = opt.value;
      btn.innerHTML = `<span class="opt-label">${String.fromCharCode(65+i)}.</span> <span class="opt-text">${(currentLang==='id' && opt.label_id) ? opt.label_id : opt.label_en}</span>`;
      btn.addEventListener('click', () => handleChoice(btn, opt));
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
      optionsWrap.appendChild(btn);
    });

    // restore selected UI if previously answered
    if (answeredMap[currentIndex]) {
      // disable options (preserve UI)
      document.querySelectorAll('.option-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
      nextBtn.disabled = false;
      nextBtn.setAttribute('aria-disabled','false');
    } else {
      nextBtn.disabled = true;
      nextBtn.setAttribute('aria-disabled','true');
    }

    prevBtn.disabled = (currentIndex === 0);
    // hide feedback until someone answers
    feedback.classList.add('visually-hidden');
  }

  function handleChoice(btn, opt) {
    if (answeredMap[currentIndex]) return;
    const q = QUESTIONS[currentIndex];
    const correct = q.correct;
    const isCorrect = (opt.value === correct);

    // visual updates
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    if (isCorrect) {
      btn.classList.add('correct');
      const msg = (currentLang === 'id' ? (opt.feedback_id || q.feedback_correct_id) : (opt.feedback_en || q.feedback_correct_en));
      showFeedback(msg, true);
    } else {
      btn.classList.add('incorrect','vibrate');
      setTimeout(()=>btn.classList.remove('vibrate'),420);
      // highlight correct
      const correctBtn = Array.from(document.querySelectorAll('.option-btn')).find(b => b.dataset.value === correct);
      if (correctBtn) correctBtn.classList.add('correct');
      const msg = (currentLang === 'id' ? (q.feedback_wrong_id) : (q.feedback_wrong_en));
      showFeedback(msg, false);
    }

    answeredMap[currentIndex] = true;
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
  }

  function showFeedback(msg, positive=true) {
    if (!feedback) return;
    fbText.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.toggle('positive', positive);
    feedback.classList.toggle('negative', !positive);
    // auto-hide after some time (but leave visual marks)
    setTimeout(() => { if (feedback) feedback.classList.add('visually-hidden'); }, 3500);
  }

  // navigation
  nextBtn.addEventListener('click', () => {
    if (currentIndex < total - 1) {
      currentIndex++;
      renderCurrent();
    } else {
      // finish assessment: go to next_path or show completion
      if (next_path) window.location.href = next_path;
      else alert(currentLang === 'id' ? 'Selesai. Terima kasih!' : 'Assessment complete. Thank you!');
    }
  });
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    }
  });

  // keyboard shortcuts 1/2/3
  document.addEventListener('keydown', (e) => {
    if (['1','2','3'].includes(e.key)) {
      const idx = parseInt(e.key,10)-1;
      const btn = document.querySelectorAll('.option-btn')[idx];
      if (btn && !btn.disabled) btn.click();
    }
  });

  // language toggle
  langToggle.addEventListener('click', () => {
    currentLang = (currentLang === 'en') ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
    renderCurrent();
  });

  // init
  renderCurrent();
});
