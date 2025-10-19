// static/js/assessment_open_ended_multi.js
// Multi-question open-ended assessment (10 questions).
// Expects window.SECTION with keys:
// - title, next_path, questions: [{ id, prompt_en, prompt_id, example_audio(optional), expected_fields: ["ship","callsign","mmsi","position","emergency"] }, ...]

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const questions = Array.isArray(SECTION.questions) ? SECTION.questions : [];
  const total = Math.max(questions.length, 10); // default to 10 if fewer provided

  // DOM
  const progressCounter = document.getElementById('progress-counter');
  const langToggle = document.getElementById('open-lang-toggle');
  const qTitle = document.getElementById('question-title');
  const qPrompt = document.getElementById('question-prompt');
  const inputEl = document.getElementById('open-input');
  const submitBtn = document.getElementById('submit-answer');
  const nextBtn = document.getElementById('next-question');
  const playBtn = document.getElementById('play-example');
  const exampleAudio = document.getElementById('example-audio');
  const fb = document.getElementById('answer-feedback');
  const fbText = document.getElementById('fb-text');
  const finishBtn = document.getElementById('finish-assessment');

  let idx = 0;
  let currentLang = 'en';
  let answers = new Array(total).fill(null);
  let submitted = new Array(total).fill(false);

  // Simple detection helpers (same heuristics as before)
  function hasShipName(text) {
    const t = text.toLowerCase();
    if (/\bmv\s+[a-z0-9]/.test(t)) return true;
    if (/\bm\/v\s+[a-z0-9]/.test(t)) return true;
    if (t.includes('motor vessel')) return true;
    if (/\bthis is\s+[a-z0-9]/.test(t)) return true;
    return false;
  }
  function hasCallSign(text) {
    const t = text.toLowerCase();
    if (t.includes('call sign')) return true;
    const nato = ['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliett','kilo','lima','mike','november','oscar','papa','quebec','romeo','sierra','tango','uniform','victor','whiskey','xray','yankee','zulu'];
    let count = 0;
    for (let w of nato) if (t.includes(w)) count++;
    return count >= 2;
  }
  function hasMMSI(text) {
    if (/\b\d{9}\b/.test(text)) return true;
    return false;
  }
  function hasPosition(text) {
    const t = text.toLowerCase();
    if (/\d+\s*°\s*(north|south|east|west)/.test(t)) return true;
    if (/\d+\s*degrees?\s*(north|south|east|west)/.test(t)) return true;
    if (/\b-?\d{1,2}\.\d+,\s*-?\d{1,3}\.\d+\b/.test(t)) return true;
    return false;
  }
  function hasEmergency(text) {
    const t = text.toLowerCase();
    const keywords = ['fire','flood','flooding','collision','man overboard','medical','abandon','taking on water','leak','engine room','sinking','grounding','piracy'];
    return keywords.some(k => t.includes(k));
  }

  function checkFields(text, expected=[]) {
    const res = {};
    expected.forEach(f => {
      if (f === 'ship') res.ship = hasShipName(text);
      if (f === 'callsign') res.callsign = hasCallSign(text);
      if (f === 'mmsi') res.mmsi = hasMMSI(text);
      if (f === 'position') res.position = hasPosition(text);
      if (f === 'emergency') res.emergency = hasEmergency(text);
    });
    return res;
  }

  function showFeedback(messages=[], positive=false) {
    fbText.innerHTML = messages.join('<br>');
    fb.classList.remove('visually-hidden');
    fb.classList.toggle('positive', positive);
    fb.classList.toggle('negative', !positive);
  }
  function hideFeedback() {
    fb.classList.add('visually-hidden');
    fb.classList.remove('positive','negative');
    fbText.innerHTML = '';
  }

  function renderQuestion(i) {
    const q = questions[i] || { prompt_en: `Question ${i+1}`, prompt_id: `Soal ${i+1}`, expected_fields: ['ship','callsign','mmsi','position','emergency'] };
    progressCounter.textContent = `${i+1} / ${total}`;
    qTitle.textContent = SECTION.title || 'Assessment: Open-ended';
    qPrompt.innerHTML = (currentLang === 'id' && q.prompt_id) ? q.prompt_id : q.prompt_en;
    inputEl.value = answers[i] || '';
    // example audio
    if (q.example_audio) {
      exampleAudio.src = q.example_audio;
      playBtn.disabled = false;
    } else {
      exampleAudio.src = '';
      playBtn.disabled = true;
    }
    // buttons state
    nextBtn.disabled = !submitted[i];
    nextBtn.setAttribute('aria-disabled', (!submitted[i]).toString());
    // show finish button only on last index
    if (i === total - 1) {
      finishBtn.classList.remove('d-none');
      finishBtn.disabled = !submitted[i];
      finishBtn.setAttribute('aria-disabled', (!submitted[i]).toString());
    } else {
      finishBtn.classList.add('d-none');
    }
    hideFeedback();
  }

  submitBtn.addEventListener('click', () => {
    hideFeedback();
    const text = (inputEl.value || '').trim();
    if (!text) {
      showFeedback([currentLang === 'id' ? 'Tolong masukkan jawaban sebelum submit.' : 'Please enter your answer before submitting.'], false);
      return;
    }
    const q = questions[idx] || {};
    const expected = Array.isArray(q.expected_fields) && q.expected_fields.length ? q.expected_fields : ['ship','callsign','mmsi','position','emergency'];
    const checks = checkFields(text, expected);
    const missing = [];
    expected.forEach(f => {
      if (!checks[f]) {
        const label = (f === 'ship') ? (currentLang === 'id' ? 'Nama Kapal' : 'Ship Name')
                    : (f === 'callsign') ? (currentLang === 'id' ? 'Tanda Panggilan' : 'Call Sign')
                    : (f === 'mmsi') ? 'MMSI'
                    : (f === 'position') ? (currentLang === 'id' ? 'Posisi' : 'Position')
                    : (f === 'emergency') ? (currentLang === 'id' ? 'Jenis Darurat' : 'Emergency type') : f;
        missing.push(label);
      }
    });

    if (missing.length === 0) {
      showFeedback([currentLang === 'id' ? '✅ Bagus! Semua detail utama ada.' : '✅ Good! All key details are present.'], true);
      submitted[idx] = true;
      answers[idx] = text;
      nextBtn.disabled = false;
      nextBtn.setAttribute('aria-disabled','false');
      // auto-enable finish if last
      if (idx === total - 1) {
        finishBtn.disabled = false;
        finishBtn.setAttribute('aria-disabled','false');
        finishBtn.classList.add('ready');
      }
    } else {
      const base = currentLang === 'id' ? '⚠ Beberapa informasi hilang:' : '⚠ Some information is missing:';
      showFeedback([base, '<strong>' + missing.join(', ') + '</strong>'], false);
      submitted[idx] = false;
      answers[idx] = text;
      nextBtn.disabled = true;
      nextBtn.setAttribute('aria-disabled','true');
      if (idx === total - 1) {
        finishBtn.disabled = true;
        finishBtn.setAttribute('aria-disabled','true');
        finishBtn.classList.remove('ready');
      }
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!submitted[idx]) return;
    if (idx < total - 1) idx++;
    renderQuestion(idx);
  });

  playBtn.addEventListener('click', async () => {
    if (!exampleAudio.src) {
      showFeedback([currentLang === 'id' ? 'Audio contoh tidak tersedia.' : 'Example audio not available.'], false);
      return;
    }
    try {
      await exampleAudio.play();
    } catch (e) {
      console.warn('example play failed', e);
      showFeedback([currentLang === 'id' ? 'Audio gagal diputar.' : 'Audio failed to play.'], false);
    }
  });

  finishBtn.addEventListener('click', () => {
    if (finishBtn.disabled) return;
    // collect results and optionally POST to server (not implemented)
    const payload = { answers, submitted, section: SECTION.id || 'assessment_open_ended' };
    // visual pulse then navigate
    finishBtn.classList.add('pulsing');
    setTimeout(() => {
      if (SECTION.next_path) window.location.href = SECTION.next_path;
      else {
        // fallback: show a short summary then reload
        alert(currentLang === 'id' ? 'Asesmen selesai. Terima kasih!' : 'Assessment complete. Thank you!');
      }
    }, 260);
    // optionally: send payload via fetch to save results (left to backend)
  });

  langToggle.addEventListener('click', () => {
    currentLang = (currentLang === 'en') ? 'id' : 'en';
    langToggle.textContent = currentLang.toUpperCase();
    langToggle.setAttribute('aria-pressed', (currentLang === 'id').toString());
    // update prompt
    const q = questions[idx] || {};
    qPrompt.innerHTML = (currentLang === 'id' && q.prompt_id) ? q.prompt_id : q.prompt_en || `Question ${idx+1}`;
    hideFeedback();
  });

  // keyboard support
  inputEl.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault(); submitBtn.click();
    }
  });

  // initialize default questions if not enough provided (simple placeholders)
  if (!questions.length) {
    for (let i=0;i<total;i++) {
      questions[i] = {
        id: `q${i+1}`,
        prompt_en: `Write a short distress message (scenario ${i+1}). Include Ship Name, Call Sign, MMSI, Position, and Emergency.`,
        prompt_id: `Tulis pesan darurat singkat (skenario ${i+1}). Sertakan Nama Kapal, Tanda Panggilan, MMSI, Posisi, dan Jenis Darurat.`,
        expected_fields: ['ship','callsign','mmsi','position','emergency']
      };
    }
  }

  // make sure questions length == total
  while (questions.length < total) {
    questions.push(questions[questions.length-1]);
  }

  // render first question
  renderQuestion(idx);
});
