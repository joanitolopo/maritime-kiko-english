// static/js/assessment_spelling.js
// Assessment: Spelling Ship Name (10 questions)
// - Loads SECTION content from window.SECTION_CONTENT
// - Supports codeword answers or letter answers (case-insensitive)
// - Progress, feedback, Next enable after submit; Skip available.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) && SECTION.questions.length ? SECTION.questions : [
    // fallback sample questions if SECTION not provided
    { name: 'LIMA', codewords: ['Lima','India','Mike','Alpha'] },
    { name: 'ANTARA', codewords: ['Alpha','November','Tango','Alpha','Romeo','Alpha'] },
    { name: 'SELAMAT', codewords: ['Sierra','Echo','Lima','Alpha','Mike','Alpha','Tango'] },
    { name: 'PACIFIC', codewords: ['Papa','Alpha','Charlie','India','Foxtrot','India','Charlie'] },
    { name: 'OCEAN', codewords: ['Oscar','Charlie','Echo','Alpha','November'] },
    { name: 'STAR', codewords: ['Sierra','Tango','Alpha','Romeo'] },
    { name: 'VICTOR', codewords: ['Victor','India','Charlie','Tango','Oscar','Romeo'] },
    { name: 'NOVA', codewords: ['November','Oscar','Victor','Alpha'] },
    { name: 'ORION', codewords: ['Oscar','Romeo','India','Oscar','November'] },
    { name: 'MIRAGE', codewords: ['Mike','India','Romeo','Alpha','Golf','Echo'] }
  ];

  // DOM refs
  const langToggle = document.getElementById('assess-lang-toggle');
  const qNumberEl = document.getElementById('question-number');
  const qText = document.getElementById('q-text');
  const inputEl = document.getElementById('spelling-input');
  const submitBtn = document.getElementById('submit-answer');
  const skipBtn = document.getElementById('skip-btn');
  const feedbackBubble = document.getElementById('quiz-feedback');
  const fbText = document.getElementById('fb-text');
  const nextBtn = document.getElementById('next-question');
  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');

  let currentLang = 'en';
  let index = 0;
  let submitted = false;

  // NATO map for fallback mapping letters -> codeword
  const NATO = {
    A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliett',
    K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',
    U:'Uniform',V:'Victor',W:'Whiskey',X:'Xray',Y:'Yankee',Z:'Zulu'
  };

  function renderQuestion() {
    const q = questions[index];
    qNumberEl.textContent = `Question ${index+1} of ${questions.length}`;
    qText.textContent = currentLang === 'id'
      ? (`Eja nama kapal "${q.name}" dengan alfabet NATO.`)
      : (`Spell the ship name "${q.name}" using the NATO alphabet.`);
    progressText.textContent = `${index+1}/${questions.length}`;
    progressFill.style.width = `${Math.round(((index)/questions.length)*100)}%`;
    // reset UI
    inputEl.value = '';
    inputEl.classList.remove('input-correct','input-incorrect');
    submitted = false;
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled','true');
    inputEl.focus();
  }

  function normalizeInput(raw) {
    if (!raw) return '';
    let s = raw.replace(/[-–—,]/g,' ').replace(/[^\w\s]/g,'').trim();
    s = s.replace(/\s+/g,' ');
    return s;
  }

  function tokenize(input) {
    const s = normalizeInput(input);
    if (!s) return [];
    const parts = s.split(' ').filter(Boolean);
    const allSingleLetter = parts.every(p => p.length === 1);
    if (allSingleLetter) return parts.map(p => p.toUpperCase());
    // if user entered continuous letters without spaces like "LIMA"
    if (parts.length === 1 && /^[A-Za-z]+$/.test(parts[0]) && parts[0].length > 1) {
      // check if likely letters: return array of letters
      if (/^[A-Za-z]+$/.test(parts[0])) {
        return parts[0].toUpperCase().split('');
      }
    }
    // otherwise assume codewords (normalize to Capitalized)
    return parts.map(p => (p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()));
  }

  function checkAnswer(userTokens, targetName, targetCodewords) {
    if (!userTokens || userTokens.length === 0) return false;
    const targetLetters = targetName.toUpperCase().split('');
    // if tokens are letters
    const lettersOK = userTokens.every(t => /^[A-Z]$/.test(t));
    if (lettersOK) {
      const userLetters = userTokens.join('').toUpperCase();
      return userLetters === targetLetters.join('');
    }
    // if tokens are words: compare full codewords or compare first letters
    const userWords = userTokens.map(t => t.toLowerCase());
    const targetWords = targetCodewords.map(w => w.toLowerCase());

    // full word match
    if (userWords.length === targetWords.length) {
      let allMatch = true;
      for (let i=0;i<userWords.length;i++){
        if (userWords[i] !== targetWords[i]) { allMatch = false; break; }
      }
      if (allMatch) return true;
      // first-letter match
      let flMatch = true;
      for (let i=0;i<userWords.length;i++){
        if (userWords[i].charAt(0) !== targetWords[i].charAt(0)) { flMatch = false; break; }
      }
      if (flMatch) return true;
    }

    // last attempt: map user tokens' first letters to letters and compare
    const userFirstLetters = userTokens.map(t => t.charAt(0).toUpperCase()).join('');
    if (userFirstLetters === targetLetters.join('')) return true;

    return false;
  }

  function showFeedback(msg, positive=true) {
    if (!feedbackBubble || !fbText) return;
    fbText.textContent = msg;
    feedbackBubble.classList.remove('visually-hidden');
    feedbackBubble.classList.toggle('positive', positive);
    feedbackBubble.classList.toggle('negative', !positive);
    // auto hide after 3s
    setTimeout(() => {
      feedbackBubble.classList.add('visually-hidden');
    }, 3000);
  }

  // submit handler
  submitBtn.addEventListener('click', () => {
    if (submitted) return;
    const raw = inputEl.value || '';
    const tokens = tokenize(raw);
    const q = questions[index];
    const ok = checkAnswer(tokens, q.name, q.codewords || q.target_codewords || q.codewords_list || (q.name.toUpperCase().split('').map(l => NATO[l] || l)));

    if (ok) {
      inputEl.classList.remove('input-incorrect');
      inputEl.classList.add('input-correct');
      showFeedback(currentLang === 'id' ? (q.feedback_correct_id || `✔ Benar! ${q.name} = ${ (q.codewords || []).join(' – ') }`) : (q.feedback_correct_en || `✔ Correct! ${q.name} = ${ (q.codewords || []).join(' – ') }`), true);
    } else {
      inputEl.classList.remove('input-correct');
      inputEl.classList.add('input-incorrect');
      showFeedback(currentLang === 'id' ? (q.feedback_incorrect_id || `Tidak benar. Ejaan yang benar adalah ${ (q.codewords || []).join(' – ') }`) : (q.feedback_incorrect_en || `Not correct. The correct spelling is ${ (q.codewords || []).join(' – ') }`), false);
    }

    submitted = true;
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
    // advance progress fill to reflect answer completed for current question
    progressFill.style.width = `${Math.round(((index+1)/questions.length)*100)}%`;
  });

  // skip handler (counts as attempted)
  skipBtn.addEventListener('click', () => {
    submitted = true;
    inputEl.classList.remove('input-correct','input-incorrect');
    showFeedback(currentLang === 'id' ? 'Soal dilewati.' : 'Question skipped.', true);
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled','false');
    progressFill.style.width = `${Math.round(((index+1)/questions.length)*100)}%`;
  });

  // Enter submits
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
  });

  // Next question / finish
  nextBtn.addEventListener('click', () => {
    if (!submitted) {
      alert(currentLang === 'id' ? 'Silakan kirim jawaban terlebih dahulu.' : 'Please submit your answer first.');
      return;
    }
    // if last question, navigate to next section (if provided) else show completion message
    if (index >= questions.length - 1) {
      const nextPath = SECTION.start_next_section_path || SECTION.start_next_section || null;
      if (nextPath) {
        window.location.href = nextPath;
      } else {
        alert(currentLang === 'id' ? 'Assessment selesai. Terima kasih!' : 'Assessment complete. Thank you!');
      }
      return;
    }
    // else increment index and render next
    index++;
    renderQuestion();
    // mark submitted false for next question
    submitted = false;
  });

  // language toggle
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      // re-render question text in chosen language
      const q = questions[index];
      qText.textContent = currentLang === 'id' ? (q.prompt_id || `Eja nama kapal "${q.name}" dengan alfabet NATO.`) : (q.prompt_en || `Spell the ship name "${q.name}" using the NATO alphabet.`);
    });
  }

  // initial render
  // Ensure each question has codewords array (generate from name if not provided)
  questions.forEach(q => {
    if (!Array.isArray(q.codewords) || q.codewords.length === 0) {
      q.codewords = (q.name || '').toUpperCase().split('').map(ch => NATO[ch] || ch);
    }
  });
  renderQuestion();
});
