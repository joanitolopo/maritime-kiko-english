// static/js/assessment_channel_multi.js
// Multi-question Channel Number assessment (MCQ). Instant feedback, Next enabled after choice,
// progress update. Expects window.SECTION with questions array.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) ? SECTION.questions : [];
  const total = SECTION.total_questions || questions.length || 10;
  const nextPath = SECTION.next_path || null;

  // Elements
  const langToggle = document.getElementById('channel-lang-toggle');
  const qText = document.getElementById('q-text');
  const qNum = document.getElementById('question-number');
  const optionsWrap = document.getElementById('options-wrap');
  const nextBtn = document.getElementById('next-question');
  const feedback = document.getElementById('channel-feedback');
  const fbText = document.getElementById('fb-text');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const radioScreen = document.getElementById('radio-screen');

  let currentLang = 'en';
  let idx = 0;
  let answered = false;

  const texts = {
    en: {
      correct: (ch) => `✔ Correct! Emergency channel is ${ch}.`,
      incorrect: (ch) => `✖ Not correct. The correct answer is Channel ${ch}.`
    },
    id: {
      correct: (ch) => `✔ Benar! Saluran darurat adalah ${ch}.`,
      incorrect: (ch) => `✖ Tidak benar. Jawaban yang benar adalah Saluran ${ch}.`
    }
  };

  function showFeedback(msg, positive=true) {
    fbText.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.toggle('positive', positive);
    feedback.classList.toggle('negative', !positive);
    // hide after a moment
    setTimeout(() => feedback.classList.add('visually-hidden'), 2800);
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

  function handleChoice(btn, choiceIndex) {
    if (answered) return;
    answered = true;
    // disable all buttons
    Array.from(optionsWrap.querySelectorAll('.option-btn')).forEach(b => b.disabled = true);

    const correct = btn.dataset.correct === '1';
    // apply UI
    if (correct) {
      btn.classList.add('correct');
      showFeedback(texts[currentLang].correct(SECTION.correct_channel), true);
    } else {
      btn.classList.add('incorrect');
      // add vibrate animation
      btn.classList.add('vibrate');
      setTimeout(() => btn.classList.remove('vibrate'), 360);
      showFeedback(texts[currentLang].incorrect(SECTION.correct_channel), false);
      // highlight correct button
      const corr = optionsWrap.querySelector('.option-btn[data-correct="1"]');
      if (corr) corr.classList.add('correct');
    }

    // update progress visuals
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

    // set radio screen glow if suggested by question (e.g., show CH 16)
    if (q && q.highlight_screen) {
      radioScreen.textContent = q.highlight_screen;
      radioScreen.classList.add('glow-red');
      setTimeout(()=> radioScreen.classList.remove('glow-red'), 1200);
    } else {
      radioScreen.textContent = q.example_display || 'CH 16';
    }

    // prompt (pick language)
    const prompt = (currentLang === 'id' && q.prompt_id) ? q.prompt_id : (q.prompt_en || `What is the emergency channel number in Maritime Radio?`);
    qText.innerHTML = (prompt.indexOf('{channel}') !== -1) ? prompt.replace('{channel}', `<strong>${q.example_display || ''}</strong>`) : prompt;

    // render options
    const opts = q.options || [];
    const correctIndex = q.correct_index || 0;
    renderOptions(opts, correctIndex);
  }

  nextBtn.addEventListener('click', () => {
    if (!answered) {
      // protect: should not happen because Next disabled until answered
      return;
    }
    if (idx < total - 1) {
      idx++;
      renderQuestion();
    } else {
      if (nextPath) {
        window.location.href = nextPath;
      } else {
        alert(currentLang === 'id' ? 'Assesment kanal selesai.' : 'Channel assessment completed.');
      }
    }
  });

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    renderQuestion();
  });

  // keyboard next (Enter on Next)
  nextBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }
  });

  // init
  if (!questions.length) {
    qText.textContent = 'No channel questions configured.';
    return;
  }
  renderQuestion();
});
