// static/js/guided_task_2.js
// Behavior: replay example, letter grid -> play NATO audio + append NATO word to output with typing effect,
// enable Next when student completes target name. Uses SECTION_CONTENT to get example name/spelling.

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const UNIT = window.UNIT_CONTENT || {};
  const exampleName = (SECTION.example_name || 'PACIFIC STAR').replace(/^MV\s*/i, '').trim().toUpperCase();
  const exampleSequence = SECTION.example_sequence || (SECTION.example_spelling || '').split(/\s*[,–\-–]\s*|\s+/).filter(Boolean);
  const audioExample = document.getElementById('audio-example');
  const btnReplayExample = document.getElementById('replay-example');
  const letterGrid = document.getElementById('letter-grid');
  const spellingOutput = document.getElementById('spelling-output');
  const replayOutputBtn = document.getElementById('replay-output');
  const feedback = document.getElementById('gt2-feedback');
  const fbContent = feedback ? feedback.querySelector('.fb-content') : null;
  const nextBtn = document.getElementById('gt2-next');
  const langToggle = document.getElementById('gt2-lang-toggle');
  const instructionEl = document.getElementById('gt2-instruction');

  // NATO word map (audio filenames follow project's pattern)
  const NATO_WORDS = {
    A: {word:'Alpha', audio:'/static/data/audio/alphabet/a_alpha.wav'},
    B: {word:'Bravo', audio:'/static/data/audio/alphabet/b_bravo.wav'},
    C: {word:'Charlie', audio:'/static/data/audio/alphabet/c_charlie.wav'},
    D: {word:'Delta', audio:'/static/data/audio/alphabet/d_delta.wav'},
    E: {word:'Echo', audio:'/static/data/audio/alphabet/e_echo.wav'},
    F: {word:'Foxtrot', audio:'/static/data/audio/alphabet/f_foxtrot.wav'},
    G: {word:'Golf', audio:'/static/data/audio/alphabet/g_golf.wav'},
    H: {word:'Hotel', audio:'/static/data/audio/alphabet/h_hotel.wav'},
    I: {word:'India', audio:'/static/data/audio/alphabet/i_india.wav'},
    J: {word:'Juliett', audio:'/static/data/audio/alphabet/j_juliett.wav'},
    K: {word:'Kilo', audio:'/static/data/audio/alphabet/k_kilo.wav'},
    L: {word:'Lima', audio:'/static/data/audio/alphabet/l_lima.wav'},
    M: {word:'Mike', audio:'/static/data/audio/alphabet/m_mike.wav'},
    N: {word:'November', audio:'/static/data/audio/alphabet/n_november.wav'},
    O: {word:'Oscar', audio:'/static/data/audio/alphabet/o_oscar.wav'},
    P: {word:'Papa', audio:'/static/data/audio/alphabet/p_papa.wav'},
    Q: {word:'Quebec', audio:'/static/data/audio/alphabet/q_quebec.wav'},
    R: {word:'Romeo', audio:'/static/data/audio/alphabet/r_romeo.wav'},
    S: {word:'Sierra', audio:'/static/data/audio/alphabet/s_sierra.wav'},
    T: {word:'Tango', audio:'/static/data/audio/alphabet/t_tango.wav'},
    U: {word:'Uniform', audio:'/static/data/audio/alphabet/u_uniform.wav'},
    V: {word:'Victor', audio:'/static/data/audio/alphabet/v_victor.wav'},
    W: {word:'Whiskey', audio:'/static/data/audio/alphabet/w_whiskey.wav'},
    X: {word:'X-ray', audio:'/static/data/audio/alphabet/x_xray.wav'},
    Y: {word:'Yankee', audio:'/static/data/audio/alphabet/y_yankee.wav'},
    Z: {word:'Zulu', audio:'/static/data/audio/alphabet/z_zulu.wav'}
  };

  // preload letter audio objects for responsiveness
  const audioCache = {};
  Object.keys(NATO_WORDS).forEach(letter => {
    try {
      const src = NATO_WORDS[letter].audio;
      const a = new Audio(src);
      a.preload = 'auto';
      audioCache[letter] = a;
    } catch(e) { console.warn('preload failed for', letter, e); }
  });

  // util: create span element for NATO word in output
  function appendOutputWord(word) {
    const span = document.createElement('span');
    span.className = 'output-word';
    span.textContent = word;
    spellingOutput.appendChild(span);
  }

  // typing animation for adding word (very small)
  function typeAppend(word) {
    // append quickly character by character into a temporary element, then replace with full word to keep simple
    const temp = document.createElement('span');
    temp.className = 'output-word';
    temp.textContent = '';
    spellingOutput.appendChild(temp);
    let i = 0;
    const step = () => {
      if (i >= word.length) return;
      temp.textContent += word[i++];
      setTimeout(step, 22);
    };
    step();
  }

  // Reset output and enable visual states
  function clearOutput() {
    spellingOutput.innerHTML = '';
  }

  // Check completion: compare spelled NATO sequence to expected for exampleName
  function checkCompletion(targetName) {
    // derive letters from current output
    const words = Array.from(spellingOutput.querySelectorAll('.output-word')).map(n => n.textContent.trim());
    // if no expected sequence provided, derive from targetName letters mapping to NATO_WORDS
    let expected = [];
    if (Array.isArray(exampleSequence) && exampleSequence.length) {
      expected = exampleSequence.map(s => (''+s).trim());
    } else {
      expected = targetName.split('').map(ch => {
        if (ch === ' ') return null;
        const L = ch.toUpperCase();
        return NATO_WORDS[L] ? NATO_WORDS[L].word : L;
      }).filter(Boolean);
    }
    // compare lengths and items (case-insensitive)
    if (words.length !== expected.length) return false;
    for (let i=0;i<expected.length;i++){
      if (!words[i]) return false;
      if (words[i].toLowerCase() !== expected[i].toLowerCase()) return false;
    }
    return true;
  }

  // Play letter: flash button, play audio, append NATO word
  function handleLetterPress(letterBtn) {
    const letter = (letterBtn.dataset.letter || '').toUpperCase();
    if (!letter) return;
    const nato = NATO_WORDS[letter];
    if (!nato) return;
    // visual flash
    letterBtn.classList.add('active');
    setTimeout(()=> letterBtn.classList.remove('active'), 420);

    // play audio if cached
    const aud = audioCache[letter];
    if (aud) {
      aud.currentTime = 0;
      aud.play().catch(err => { /* ignore play error */ });
    }

    // append NATO word with tiny typing
    typeAppend(nato.word);

    // after appending, check if completed
    setTimeout(() => {
      if (checkCompletion(exampleName)) {
        // show feedback, enable Next
        showFeedback(SECTION.feedback_good || 'Well done! You spelled it clearly.');
        if (nextBtn) { nextBtn.disabled = false; nextBtn.classList.add('ready'); }
      }
    }, 450);
  }

  // attach grid handlers
  if (letterGrid) {
    letterGrid.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.letter-btn');
      if (!btn) return;
      handleLetterPress(btn);
    });

    // keyboard support
    letterGrid.querySelectorAll('.letter-btn').forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });
  }

  // Replay example spelled audio
  if (btnReplayExample && audioExample) {
    btnReplayExample.addEventListener('click', async () => {
      try {
        audioExample.currentTime = 0;
        await audioExample.play();
      } catch (err) {
        console.warn('example audio play failed', err);
        // fall back: play example sequence via letter audio if example_sequence present
        if (Array.isArray(exampleSequence) && exampleSequence.length) {
          // exampleSequence may contain letters or NATO words; attempt to map letters to audio
          (async () => {
            for (let i=0;i<exampleSequence.length;i++){
              const token = exampleSequence[i];
              const letter = (token || '').toString().trim().charAt(0).toUpperCase();
              const a = audioCache[letter];
              if (a) {
                a.currentTime = 0;
                try { await a.play(); await new Promise(res => a.addEventListener('ended', res, {once:true})); } catch(e){}
              } else {
                await new Promise(r => setTimeout(r, 180));
              }
            }
          })();
        }
      }
    });
  }

  // Replay output: replay the sequence just produced (sequentially)
  if (replayOutputBtn) {
    replayOutputBtn.addEventListener('click', async () => {
      const spans = Array.from(spellingOutput.querySelectorAll('.output-word'));
      if (!spans.length) return;
      for (let i=0;i<spans.length;i++){
        const word = spans[i].textContent.trim();
        // find letter by matching NATO_WORDS
        const letter = Object.keys(NATO_WORDS).find(L => NATO_WORDS[L].word.toLowerCase() === word.toLowerCase());
        if (letter) {
          const aud = audioCache[letter];
          if (aud) {
            try {
              aud.currentTime = 0;
              await aud.play();
              await new Promise(res => aud.addEventListener('ended', res, {once:true}));
            } catch(e){ /* ignore */ }
          }
        } else {
          await new Promise(r => setTimeout(r, 160));
        }
      }
    });
  }

  // Next button navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (nextBtn.disabled) {
        alert('Please finish spelling the example name correctly to continue.');
        return;
      }
      const href = nextBtn.dataset.next;
      if (href) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(()=> window.location.href = href, 180);
      }
    });
  }

  // feedback helper
  function showFeedback(msg) {
    if (!feedback) return;
    const content = feedback.querySelector('.fb-content');
    if (content) content.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(() => { feedback.classList.add('visually-hidden'); feedback.classList.remove('pop-visible'); }, 3200);
  }

  // language toggle: swap instruction and example spelling text
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const isEn = langToggle.textContent.trim().toUpperCase() === 'EN';
      const next = isEn ? 'ID' : 'EN';
      langToggle.textContent = next;
      // swap instruction text
      if (instructionEl) instructionEl.textContent = (next === 'EN') ? (SECTION.instruction_en || instructionEl.textContent) : (SECTION.instruction_id || instructionEl.textContent);
      // swap example spelling display if provided translations
      const exampleSpellingText = next === 'EN' ? (SECTION.example_spelling || SECTION.example_spelling_en || '') : (SECTION.example_spelling_id || '');
      if (document.getElementById('ship-spelling-example')) {
        document.getElementById('ship-spelling-example').textContent = exampleSpellingText || document.getElementById('ship-spelling-example').textContent;
      }
    });
  }

  // initial reset
  clearOutput();

});
