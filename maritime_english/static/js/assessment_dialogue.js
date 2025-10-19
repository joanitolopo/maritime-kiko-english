// static/js/assessment_dialogue.js
// Short Dialogue Completion assessment (multi-prompt page).
// Normalizes user input and checks against accepted answers (case-insensitive).
// Expects window.SECTION to contain { title, next_path, prompts: [ ... ] }

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const PROMPTS = Array.isArray(SECTION.prompts) ? SECTION.prompts : [];
  const total = PROMPTS.length || 1;
  const playExampleBtn = document.getElementById('play-example');
  const submitBtn = document.getElementById('submit-answer');
  const nextBtn = document.getElementById('next-question');
  const prevBtn = document.getElementById('prev-question');
  const inputEl = document.getElementById('response-input');
  const qText = document.getElementById('q-text');
  const qNumber = document.getElementById('question-number');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');
  const feedback = document.getElementById('dialog-feedback');
  const fbText = document.getElementById('fb-text');
  const langToggle = document.getElementById('dialog-lang-toggle');

  let currentLang = 'en';
  let idx = 0;
  let answered = new Array(total).fill(false);
  let userResponses = new Array(total).fill('');

  // Simple normalization: lowercase, remove punctuation except digits/letters/space, collapse spaces
  function normalize(s) {
    if (!s) return '';
    return s.toString()
      .toLowerCase()
      .replace(/[^\w\s]/g, '')    // remove punctuation (keeps letters, digits, underscore)
      .replace(/_/g, '')          // remove underscore introduced by \w if any
      .replace(/\s+/g, ' ')
      .trim();
  }

  function render() {
    const p = PROMPTS[idx];
    qNumber.textContent = `Question ${idx+1} of ${total}`;
    progressText.textContent = `${idx+1}/${total} Questions`;
    const percent = Math.round(((idx)/total) * 100);
    progressFill.style.width = `${percent}%`;

    const promptText = (currentLang === 'id' && p.prompt_id) ? p.prompt_id : p.prompt_en;
    qText.innerHTML = promptText;

    inputEl.value = userResponses[idx] || '';
    inputEl.disabled = answered[idx];
    submitBtn.disabled = answered[idx];
    // Next button enabled only after submit for this prompt
    nextBtn.disabled = !answered[idx] && (idx < total-1);
    nextBtn.setAttribute('aria-disabled', nextBtn.disabled ? 'true' : 'false');

    prevBtn.disabled = (idx === 0);
    // update Next label (final question change)
    nextBtn.textContent = (idx === total-1) ? (currentLang === 'id' ? 'Finish' : 'Finish') : (currentLang === 'id' ? 'Next' : 'Next');
    // hide feedback if none
    if (!answered[idx]) hideFeedback();
  }

  function showFeedback(msg, positive=true) {
    if (!feedback) return;
    fbText.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.toggle('positive', positive);
    feedback.classList.toggle('negative', !positive);
    // auto-hide after 3s
    setTimeout(() => { try { feedback.classList.add('visually-hidden'); } catch(e){} }, 3000);
  }
  function hideFeedback() {
    if (!feedback) return;
    feedback.classList.add('visually-hidden');
    feedback.classList.remove('positive','negative');
  }

  // Evaluate answer: accepts either exact normalized match to any accepted answer,
  // or matches any listed regex (if prompt.accept_patterns provided)
  function evaluateAnswer(userText, promptObj) {
    const norm = normalize(userText);
    if (!norm) return { ok: false, message_en: (promptObj && promptObj.feedback_wrong_en) ? promptObj.feedback_wrong_en : 'Not correct.' , message_id: (promptObj && promptObj.feedback_wrong_id) ? promptObj.feedback_wrong_id : 'Tidak benar.' };

    // check explicit accepted answers (array of strings)
    const accepted = promptObj.accepted_answers || [];
    for (let a of accepted) {
      if (normalize(a) === norm) {
        return { ok: true, message_en: (promptObj.feedback_correct_en || 'Correct!'), message_id: (promptObj.feedback_correct_id || 'Benar!') };
      }
    }

    // optional: patterns (array of regex strings)
    if (Array.isArray(promptObj.accept_patterns)) {
      for (let pat of promptObj.accept_patterns) {
        try {
          const re = new RegExp(pat, 'i');
          if (re.test(userText)) {
            return { ok: true, message_en: (promptObj.feedback_correct_en || 'Correct!'), message_id: (promptObj.feedback_correct_id || 'Benar!') };
          }
        } catch(e) {
          console.warn('Bad pattern', pat, e);
        }
      }
    }

    // allow some common flexible variants: accept presence of key words
    if (promptObj.accept_keywords && Array.isArray(promptObj.accept_keywords)) {
      const kwMatches = promptObj.accept_keywords.every(k => norm.includes(k.toLowerCase()));
      if (kwMatches) {
        return { ok: true, message_en: (promptObj.feedback_correct_en || 'Correct!'), message_id: (promptObj.feedback_correct_id || 'Benar!') };
      }
    }

    return { ok: false, message_en: (promptObj.feedback_wrong_en || 'Not correct. Try again.'), message_id: (promptObj.feedback_wrong_id || 'Belum tepat. Coba lagi.') };
  }

  // submit handler
  submitBtn.addEventListener('click', () => {
    const p = PROMPTS[idx];
    const text = inputEl.value || '';
    const res = evaluateAnswer(text, p);
    userResponses[idx] = text;
    answered[idx] = true;
    inputEl.disabled = true;
    submitBtn.disabled = true;

    if (res.ok) {
      showFeedback(currentLang === 'id' ? res.message_id : res.message_en, true);
    } else {
      showFeedback(currentLang === 'id' ? res.message_id : res.message_en, false);
      // allow retry: keep answered false? Spec said feedback after submit; Next becomes active automatically after submit.
      // We'll still mark answered true but allow user to click Previous then back to edit; or provide Retry button in future.
    }

    // enable Next (or Finish)
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');

    // if on last question and final, Next text becomes Finish and clicking will navigate
  });

  // play example audio (optional): uses prompt.example_audio if provided
  playExampleBtn.addEventListener('click', async () => {
    const p = PROMPTS[idx];
    const src = p.example_audio || null;
    if (!src) {
      // no audio: gentle info
      showFeedback(currentLang === 'id' ? 'Contoh audio tidak tersedia.' : 'Example audio not available.', false);
      return;
    }
    try {
      const a = new Audio(src);
      a.preload = 'auto';
      await a.play();
    } catch (e) {
      console.warn('Example audio play failed', e);
      showFeedback(currentLang === 'id' ? 'Audio gagal diputar.' : 'Audio failed to play.', false);
    }
  });

  // navigation
  nextBtn.addEventListener('click', () => {
    if (idx < total-1) {
      idx++;
      render();
    } else {
      // Finish action: redirect or show completion
      if (SECTION.next_path) {
        window.location.href = SECTION.next_path;
      } else {
        alert(currentLang === 'id' ? 'Penilaian selesai. Terima kasih!' : 'Assessment complete. Thank you!');
      }
    }
  });
  prevBtn.addEventListener('click', () => {
    if (idx > 0) {
      idx--;
      render();
    }
  });

  // keyboard: Enter inside textarea does not submit by default; support Ctrl+Enter to submit
  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!submitBtn.disabled) submitBtn.click();
    }
  });

  // language toggle
  langToggle.addEventListener('click', () => {
    currentLang = (currentLang === 'en') ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
    render();
  });

  // init: render first
  if (!PROMPTS.length) {
    qText.textContent = 'No prompts configured.';
    submitBtn.disabled = true;
    playExampleBtn.disabled = true;
  } else {
    render();
  }
});
