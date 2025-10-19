// static/js/guided_task_3.js
// Behavior:
// - replay example audio
// - on MMSI / Channel input: validate, generate NATO pronunciation text, type it into output
// - replay outputs by sequentially playing digit audios
// - radio screen blink when valid input is present
// - show feedback and enable Next when both outputs valid

document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const exampleAudio = document.getElementById('gt3-example-audio');
  const replayExampleBtn = document.getElementById('replay-example');

  const mmsiInput = document.getElementById('mmsi-input');
  const channelInput = document.getElementById('channel-input');
  const mmsiOutput = document.getElementById('mmsi-output');
  const channelOutput = document.getElementById('channel-output');
  const mmsiReplay = document.getElementById('mmsi-replay');
  const channelReplay = document.getElementById('channel-replay');

  const screenMmsi = document.getElementById('screen-mmsi');
  const screenChannel = document.getElementById('screen-channel');
  const radioScreen = document.getElementById('radio-screen');

  const feedback = document.getElementById('gt3-feedback');
  const fbContent = feedback ? feedback.querySelector('.fb-content') : null;
  const nextBtn = document.getElementById('gt3-next');
  const langToggle = document.getElementById('gt3-lang-toggle');
  const instructionEl = document.getElementById('gt3-instruction');

  // Digit map: text + audio path (consistent with numbers mapping in project)
  const DIGIT_MAP = {
    "0": {text: "Zero", audio: "/static/data/audio/numbers/0_zeero.wav"},
    "1": {text: "Wun", audio: "/static/data/audio/numbers/1_wun.wav"},
    "2": {text: "Too", audio: "/static/data/audio/numbers/2_too.wav"},
    "3": {text: "Tree", audio: "/static/data/audio/numbers/3_tree.wav"},
    "4": {text: "Fower", audio: "/static/data/audio/numbers/4_fower.wav"},
    "5": {text: "Fife", audio: "/static/data/audio/numbers/5_fife.wav"},
    "6": {text: "Six", audio: "/static/data/audio/numbers/6_six.wav"},
    "7": {text: "Seven", audio: "/static/data/audio/numbers/7_seven.wav"},
    "8": {text: "Eight", audio: "/static/data/audio/numbers/8_eight.wav"},
    "9": {text: "Niner", audio: "/static/data/audio/numbers/9_niner.wav"}
  };

  // preload audios
  const audioCache = {};
  Object.keys(DIGIT_MAP).forEach(d => {
    try {
      const a = new Audio(DIGIT_MAP[d].audio);
      a.preload = 'auto';
      audioCache[d] = a;
    } catch (e) { console.warn('preload digit audio failed', d, e); }
  });

  // helper: sanitize input digits
  function digitsOnly(s) { return (s || '').replace(/\D+/g,''); }

  // helper: generate pronunciation string array from numeric string
  function pronForDigits(digits) {
    return digits.split('').map(ch => DIGIT_MAP[ch] ? DIGIT_MAP[ch].text : ch);
  }

  // type out array into output element
  function typeOutArray(targetEl, arr) {
    if (!targetEl) return;
    targetEl.innerHTML = '';
    arr.forEach((w, idx) => {
      const span = document.createElement('span');
      span.className = 'out-word';
      span.textContent = w;
      span.style.opacity = '0';
      targetEl.appendChild(span);
      // simple stagger fade
      setTimeout(()=> { span.style.transition='opacity .18s ease'; span.style.opacity = '1'; }, idx*120);
    });
  }

  // radio screen visual blink while audio playing
  function startRadioVisual() {
    if (!radioScreen) return;
    radioScreen.classList.add('active');
  }
  function stopRadioVisual() {
    if (!radioScreen) return;
    radioScreen.classList.remove('active');
  }

  // validate MMSI (9 digits)
  function isValidMMSI(s) { const d = digitsOnly(s); return d.length === 9; }
  function isValidChannel(s) { const d = digitsOnly(s); return d.length >= 1 && d.length <= 3; }

  // update screen displays
  function updateScreens() {
    if (screenMmsi) screenMmsi.textContent = digitsOnly(mmsiInput.value) || (SECTION.example_mmsi || '—');
    if (screenChannel) screenChannel.textContent = digitsOnly(channelInput.value) || (SECTION.example_channel || '—');
  }

  // generate outputs when user types (debounce small)
  let mmsiTimer = null, chanTimer = null;
  mmsiInput && mmsiInput.addEventListener('input', (e) => {
    clearTimeout(mmsiTimer);
    mmsiTimer = setTimeout(() => {
      const d = digitsOnly(mmsiInput.value);
      updateScreens();
      if (d.length === 0) { mmsiOutput.innerHTML = ''; checkEnableNext(); return; }
      const pron = pronForDigits(d);
      typeOutArray(mmsiOutput, pron);
      if (isValidMMSI(d)) {
        startRadioVisual();
        setTimeout(stopRadioVisual, 1000);
      }
      checkEnableNext();
    }, 220);
  });

  channelInput && channelInput.addEventListener('input', (e) => {
    clearTimeout(chanTimer);
    chanTimer = setTimeout(() => {
      const d = digitsOnly(channelInput.value);
      updateScreens();
      if (d.length === 0) { channelOutput.innerHTML = ''; checkEnableNext(); return; }
      const pron = pronForDigits(d);
      typeOutArray(channelOutput, pron);
      if (isValidChannel(d)) {
        startRadioVisual();
        setTimeout(stopRadioVisual, 800);
      }
      checkEnableNext();
    }, 200);
  });

  // replay sequence helper: plays audios sequentially for a digit string
  async function playDigitsSequential(digitString) {
    const digits = digitString.split('');
    if (!digits.length) return;
    startRadioVisual();
    for (let i=0;i<digits.length;i++){
      const ch = digits[i];
      const a = audioCache[ch];
      if (a) {
        try {
          a.currentTime = 0;
          await a.play();
          await new Promise(res => a.addEventListener('ended', res, {once:true}));
        } catch (err) {
          console.warn('play digit error', ch, err);
        }
      } else {
        // small pause if missing
        await new Promise(r => setTimeout(r, 180));
      }
    }
    stopRadioVisual();
  }

  // replay click handlers
  mmsiReplay && mmsiReplay.addEventListener('click', () => {
    const d = digitsOnly(mmsiInput.value || (SECTION.example_mmsi || ''));
    if (!d) { alert('No MMSI provided.'); return; }
    playDigitsSequential(d);
  });

  channelReplay && channelReplay.addEventListener('click', () => {
    const d = digitsOnly(channelInput.value || (SECTION.example_channel || ''));
    if (!d) { alert('No channel provided.'); return; }
    playDigitsSequential(d);
  });

  // replay example audio
  replayExampleBtn && replayExampleBtn.addEventListener('click', async () => {
    if (!exampleAudio) return;
    try {
      exampleAudio.currentTime = 0;
      await exampleAudio.play();
    } catch (err) {
      console.warn('example audio play failed', err);
    }
  });

  // enable Next when both valid
  function checkEnableNext() {
    const ok = isValidMMSI(mmsiInput.value) && isValidChannel(channelInput.value);
    if (ok) {
      nextBtn.disabled = false;
      // show positive feedback and small visual
      showFeedback(SECTION.default_feedback || 'Excellent! Clear MMSI and channel.');
    } else {
      nextBtn.disabled = true;
    }
  }

  // feedback helper
  function showFeedback(msg) {
    if (!feedback) return;
    const el = feedback.querySelector('.fb-content');
    if (el) el.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(()=> { feedback.classList.add('visually-hidden'); feedback.classList.remove('pop-visible'); }, 3000);
  }

  // Next navigation
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (nextBtn.disabled) { alert('Please enter valid MMSI (9 digits) and channel (1–3 digits) to continue.'); return; }
      const href = nextBtn.dataset.next;
      if (href) { nextBtn.classList.add('glow-redirect'); setTimeout(()=> window.location.href = href, 180); }
    });
  }

  // language toggle swap text only
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const next = (langToggle.textContent.trim().toUpperCase() === 'EN') ? 'ID' : 'EN';
      langToggle.textContent = next;
      if (instructionEl) instructionEl.textContent = (next === 'EN') ? (SECTION.instruction_en || instructionEl.textContent) : (SECTION.instruction_id || instructionEl.textContent);
      // swap dialogue too if provided
      const dialogEl = document.getElementById('dialogue-text');
      if (dialogEl) dialogEl.innerHTML = (next === 'EN') ? (SECTION.dialogue_en || dialogEl.innerHTML) : (SECTION.dialogue_id || dialogEl.innerHTML);
    });
  }

  // initial prefills from SECTION_CONTENT
  if (SECTION.example_mmsi && screenMmsi) screenMmsi.textContent = SECTION.example_mmsi;
  if (SECTION.example_channel && screenChannel) screenChannel.textContent = SECTION.example_channel;

  // clean up on unload
  window.addEventListener('beforeunload', () => {
    Object.values(audioCache).forEach(a => { try { a.pause(); a.currentTime = 0; } catch(e){} });
    try { if (exampleAudio) exampleAudio.pause(); } catch(e){}
  });

});
