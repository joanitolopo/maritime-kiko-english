// static/js/assessment_call.js
// Assessment Call Sign Spelling: input -> submit -> instant feedback.
// Expects window.SECTION with questions and total_questions.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) ? SECTION.questions : [];
  const total = SECTION.total_questions || questions.length || 10;
  const nextPath = SECTION.next_path || null;

  // Elements
  const langToggle = document.getElementById('call-lang-toggle');
  const qText = document.getElementById('q-text');
  const qNum = document.getElementById('question-number');
  const screenDisplay = document.getElementById('screen-display');
  const inputEl = document.getElementById('answer-input');
  const submitBtn = document.getElementById('submit-answer');
  const nextBtn = document.getElementById('next-question');
  const feedback = document.getElementById('call-feedback');
  const fbText = document.getElementById('fb-text');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');

  let currentLang = 'en';
  let idx = 0;
  let answered = false;

  function normalize(s) {
    if (!s && s !== '') return '';
    // remove extra whitespace, non-alphanumeric except keep dashes, make single spaces
    return String(s).trim().replace(/\s+/g,' ').toLowerCase();
  }

  function showFeedback(msg, positive=true) {
    fbText.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.toggle('positive', positive);
    feedback.classList.toggle('negative', !positive);
    // auto hide after 3s
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
    }, 3000);
  }

  function markCorrectUI() {
    inputEl.classList.remove('incorrect');
    inputEl.classList.add('correct');
  }
  function markIncorrectUI() {
    inputEl.classList.remove('correct');
    inputEl.classList.add('incorrect');
    inputEl.classList.add('vibrate');
    setTimeout(() => inputEl.classList.remove('vibrate'), 420);
  }

  function renderQuestion() {
    answered = false;
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled','true');
    inputEl.value = '';
    inputEl.classList.remove('correct','incorrect');

    if (idx < 0) idx = 0;
    if (idx >= total) idx = total - 1;

    const q = questions[idx];
    qNum.textContent = `Question ${idx+1} of ${total}`;
    progressText.textContent = `${idx+1}/${total}`;
    progressFill.style.width = `${Math.round((idx/total)*100)}%`;

    // screen display (call sign shown)
    screenDisplay.textContent = q.display || q.call_sign || '';

    const prompt = (currentLang === 'id' && q.prompt_id) ? q.prompt_id : (q.prompt_en || '');
    qText.innerHTML = prompt;
    inputEl.focus();
  }

  function checkAnswer(rawInput) {
    const q = questions[idx];
    const normalized = normalize(rawInput);

    // Accept both spelled-out code words separated by spaces or dashes,
    // Or accept a compact canonical representation (like "alpha bravo charlie wun")
    // We'll compare by normalizing both expected and answer to arrays of tokens.
    const expectedTokens = ((currentLang === 'id' && q.answer_id) ? q.answer_id : q.answer_en || q.answer)
      .split(/[\s,-]+/)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const answerTokens = normalized.split(/[\s,-]+/).filter(Boolean);

    // Some inputs may provide just letters (e.g., ABC1). Allow mapping letters -> codewords if expected is words.
    // For simplicity: compare token by token (case-insensitive).
    if (expectedTokens.length === 0) return false;

    // If user typed single letters/characters like "ABC1", expand into characters tokens.
    // Detect if answerTokens length===1 and it's compact alpha-numeric without spaces and expected tokens >1
    if (answerTokens.length === 1 && answerTokens[0].length > 1 && expectedTokens.length > 1) {
      const chars = answerTokens[0].split('');
      // map digits to their NATO words? We compare to expected tokens directly by letters -> first letters of expected
      // Build candidate tokens: for digits keep digit words if expected contains word forms (like 'wun','fife')
      answerTokens.length = 0;
      chars.forEach(ch => answerTokens.push(ch.toLowerCase()));
    }

    // Now build a simple matching policy:
    // If expectedTokens are NATO words (alpha, bravo, etc.), allow user input either NATO words or corresponding letters
    // Build expectedLetters array from expectedTokens first letters (for letters) and digits preserved.
    const expectedLetters = expectedTokens.map(tok => {
      // if tok is known NATO word for a letter, map to its initial letter
      // We'll take first character (most NATO words start with letter) but digits words like 'wun','fife','niner' are handled separately
      return tok[0];
    });

    // If answerTokens equal expectedTokens exactly -> accept
    const joinExp = expectedTokens.join(' ');
    const joinAns = answerTokens.join(' ');
    if (joinExp === joinAns) return true;

    // If answerTokens correspond to letters and match expected letters
    const ansLetters = answerTokens.map(a => a[0]);
    if (ansLetters.length === expectedLetters.length) {
      const equal = ansLetters.every((c, i) => c === expectedLetters[i]);
      if (equal) return true;
    }

    // Last resort: try matching by normalizing digits words (wun, fife, too, tree, niner) to digits and compare.
    // Build a small map
    const digitMap = { 'wun':'1','one':'1','wun':'1','too':'2','two':'2','tree':'3','three':'3','fower':'4','four':'4','fife':'5','five':'5','six':'6','seven':'7','eight':'8','nine':'9','niner':'9','zero':'0','zeero':'0' };
    const expDigits = expectedTokens.map(t => digitMap[t] || t);
    const ansDigits = answerTokens.map(t => digitMap[t] || t);
    if (expDigits.join(' ') === ansDigits.join(' ')) return true;

    return false;
  }

  submitBtn.addEventListener('click', () => {
    if (answered) return;
    const val = inputEl.value || '';
    if (!val.trim()) {
      inputEl.focus();
      return;
    }
    const ok = checkAnswer(val);
    const q = questions[idx];
    if (ok) {
      markCorrectUI();
      const msg = (currentLang === 'id' ? (q.feedback_id || `Correct! ${q.call_sign} = ${q.answer_en}`) : (q.feedback_en || `Correct! ${q.call_sign} = ${q.answer_en}`));
      showFeedback(msg, true);
    } else {
      markIncorrectUI();
      const msg = (currentLang === 'id' ? (q.feedback_id || `Tidak benar. Jawaban: ${q.answer_en}`) : (q.feedback_en || `Not correct. Answer: ${q.answer_en}`));
      showFeedback(msg, false);
    }
    answered = true;
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
    // update progress fill to show completed percent
    progressFill.style.width = `${Math.round(((idx+1)/total)*100)}%`;
  });

  // Enter key supports submit
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitBtn.click();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!answered) return;
    if (idx < total - 1) {
      idx++;
      renderQuestion();
    } else {
      if (nextPath) window.location.href = nextPath;
      else alert(currentLang === 'id' ? 'Assessment selesai.' : 'Assessment completed.');
    }
  });

  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    renderQuestion();
  });

  // initialize
  if (!questions.length) {
    qText.textContent = currentLang === 'id' ? 'Tidak ada soal panggilan dikonfigurasi.' : 'No call-sign questions configured.';
    inputEl.disabled = true;
    submitBtn.disabled = true;
    return;
  }
  renderQuestion();
});
