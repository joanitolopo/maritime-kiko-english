// static/js/assessment_mmsi_multi.js
// Multi-question MMSI assessment (10 questions): render, validate (digits or NATO words),
// feedback, progress, next navigation. Expects window.SECTION shape described in JSON example.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) ? SECTION.questions : [];
  const total = SECTION.total_questions || questions.length || 10;
  const nextSectionPath = SECTION.next_path || SECTION.start_next_section_path || null;

  // Elements
  const langToggle = document.getElementById('mmsi-lang-toggle');
  const qText = document.getElementById('q-text');
  const qNum = document.getElementById('question-number');
  const mmsiDisplay = null; // not used; we show in qText
  const inputEl = document.getElementById('mmsi-input');
  const submitBtn = document.getElementById('submit-answer');
  const playBtn = document.getElementById('play-example');
  const feedback = document.getElementById('mmsi-feedback');
  const fbText = document.getElementById('fb-text');
  const nextBtn = document.getElementById('next-question');
  const mmsiAudio = document.getElementById('mmsi-audio');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');

  let currentLang = 'en';
  let idx = 0; // zero-based index of current question
  let submitted = false;

  // mapping digit -> canonical maritime code (primary) & accepted variants
  const DIGIT_WORD = {
    '0': ['zero','zeero','zero'],
    '1': ['wun','one','wun'],
    '2': ['too','two','too'],
    '3': ['tree','three','tree'],
    '4': ['fower','four','fower'],
    '5': ['fife','five','fife'],
    '6': ['six','six'],
    '7': ['seven','seven'],
    '8': ['eight','eight'],
    '9': ['niner','nine','niner']
  };

  const texts = {
    en: {
      correct: (m, seq) => `✔ Correct! ${m} = ${seq.join(' – ')}.`,
      incorrect: (seq) => `Not correct. Review: ${seq.join(' – ')}.`,
      playMissing: 'Example audio not provided.',
      submitFirst: 'Please submit your answer first.'
    },
    id: {
      correct: (m, seq) => `✔ Benar! ${m} = ${seq.join(' – ')}.`,
      incorrect: (seq) => `Belum benar. Periksa pengucapan: ${seq.join(' – ')}.`,
      playMissing: 'Audio contoh tidak tersedia.',
      submitFirst: 'Silakan kirim jawaban terlebih dahulu.'
    }
  };

  // Helpers: normalize & tokenize
  function normalizeText(s) {
    if (!s) return '';
    return s.replace(/[,–—\-]/g,' ').replace(/[^\w\s]/g,'').trim();
  }
  function tokenizeInput(raw) {
    const s = normalizeText(raw).toLowerCase();
    if (!s) return [];
    if (/^[\d\s]+$/.test(s)) {
      return s.replace(/\s+/g,'').split('');
    }
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1 && /^[0-9]+$/.test(parts[0])) return parts[0].split('');
    return parts;
  }
  function expectedSequence(mmsi) {
    const digits = String(mmsi || '').replace(/\s+/g,'').split('');
    const words = digits.map(d => (DIGIT_WORD[d] && DIGIT_WORD[d][0]) || d);
    return { digits, words };
  }
  function compareTokens(userTokens, expected) {
    if (!userTokens || userTokens.length === 0) return false;
    const allDigits = userTokens.every(t => /^[0-9]$/.test(t));
    if (allDigits) return userTokens.join('') === expected.digits.join('');
    if (userTokens.length === expected.digits.length) {
      for (let i=0;i<userTokens.length;i++) {
        const ut = userTokens[i].toLowerCase();
        const digit = expected.digits[i];
        const variants = DIGIT_WORD[digit] || [digit];
        if (!variants.some(v => v === ut)) {
          if (ut !== digit) return false;
        }
      }
      return true;
    }
    return false;
  }

  function showFeedback(msg, positive=true) {
    fbText.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.toggle('positive', positive);
    feedback.classList.toggle('negative', !positive);
    setTimeout(() => feedback.classList.add('visually-hidden'), 3200);
  }

  function renderQuestion() {
    submitted = false;
    inputEl.value = '';
    inputEl.classList.remove('input-correct','input-incorrect');
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled','true');

    if (idx < 0) idx = 0;
    if (idx >= total) idx = total - 1;

    const q = questions[idx];
    const numberText = `Question ${idx+1} of ${total}`;
    qNum.textContent = numberText;
    progressText.textContent = `${idx+1}/${total}`;
    progressFill.style.width = `${Math.round((idx/total)*100)}%`;

    const mmsi = q && q.mmsi ? q.mmsi : '—';
    const prompt = (currentLang === 'id' && q.prompt_id) ? q.prompt_id : (q.prompt_en || `Spell the MMSI number ${mmsi} using Maritime English.`);
    // show prompt + value
    qText.innerHTML = prompt.replace('{mmsi}', `<strong>${mmsi}</strong>`);
    // set audio src if present
    if (q && q.example_audio) {
      mmsiAudio.src = q.example_audio;
      mmsiAudio.load();
    } else {
      mmsiAudio.removeAttribute('src');
    }
    // focus input
    setTimeout(() => inputEl.focus(), 120);
  }

  submitBtn.addEventListener('click', () => {
    if (submitted) return;
    const raw = inputEl.value || '';
    const tokens = tokenizeInput(raw);
    const q = questions[idx];
    const exp = expectedSequence(String(q.mmsi || ''));
    const ok = compareTokens(tokens, exp);

    if (ok) {
      inputEl.classList.add('input-correct');
      showFeedback((currentLang === 'id' ? texts.id.correct(q.mmsi, exp.words) : texts.en.correct(q.mmsi, exp.words)), true);
    } else {
      inputEl.classList.add('input-incorrect');
      showFeedback((currentLang === 'id' ? texts.id.incorrect(exp.words) : texts.en.incorrect(exp.words)), false);
    }
    submitted = true;
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
    // update progress to include this completed question
    progressFill.style.width = `${Math.round(((idx+1)/total)*100)}%`;
  });

  playBtn.addEventListener('click', async () => {
    if (!mmsiAudio || !mmsiAudio.src) {
      showFeedback((currentLang === 'id' ? texts.id.playMissing : texts.en.playMissing), false);
      return;
    }
    try {
      mmsiAudio.currentTime = 0;
      await mmsiAudio.play();
    } catch (err) {
      console.warn('Audio play failed', err);
      showFeedback((currentLang === 'id' ? texts.id.playMissing : texts.en.playMissing), false);
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!submitted) {
      alert(currentLang === 'id' ? texts.id.submitFirst : texts.en.submitFirst);
      return;
    }
    if (idx < total - 1) {
      idx++;
      renderQuestion();
    } else {
      // finished assessment; navigate to next_path if provided
      if (nextSectionPath) {
        window.location.href = nextSectionPath;
      } else {
        // fallback: show a simple completion message
        alert(currentLang === 'id' ? 'Assesment selesai. Terima kasih!' : 'Assessment complete. Thank you!');
      }
    }
  });

  // keyboard support
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
  });

  // language toggle
  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    renderQuestion();
  });

  // initialize
  if (!questions || questions.length === 0) {
    qText.textContent = 'No questions configured for this assessment.';
    submitBtn.disabled = true;
    playBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  renderQuestion();
});
