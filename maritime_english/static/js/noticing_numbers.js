// static/js/noticing_numbers.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const audioEl = document.getElementById('number-audio');
  const genBtns = document.querySelectorAll('.num-btn-general');
  const marBtns = document.querySelectorAll('.num-btn-maritime');
  const feedback = document.getElementById('numbers-feedback');
  const fbText = document.getElementById('numbers-fb-text');
  const nextBtn = document.getElementById('numbers-next');
  const langToggle = document.getElementById('numbers-lang-toggle');
  const instructionEl = document.getElementById('numbers-instruction');

  const msgs = {
    en: {
      instruction: SECTION.instruction_en || 'Click each pair to hear the difference. Pay special attention to 3, 5, and 9.',
      feedback: SECTION.feedback_text_en || 'Excellent! You caught the differences.',
      captain_tip: SECTION.captain_tip_en || "We change the pronunciation to avoid mistakes. For example, 'Nine' sounds like 'Five' on the radio, so we say 'Niner'."
    },
    id: {
      instruction: SECTION.instruction_id || 'Klik setiap pasangan untuk mendengar perbedaannya. Perhatikan secara khusus angka 3, 5, dan 9.',
      feedback: SECTION.feedback_text_id || 'Bagus sekali! Kamu sudah memperhatikan perbedaannya.',
      captain_tip: SECTION.captain_tip_id || "Kita mengubah pengucapan untuk menghindari kesalahan. Misalnya, 'Nine' terdengar mirip dengan 'Five' di radio, jadi kita mengatakan 'Niner'."
    }
  };

  let currentLang = 'en';
  let interactionCount = 0;
  let playing = false;

  // init texts
  if (instructionEl) instructionEl.textContent = msgs.en.instruction;
  if (fbText) fbText.textContent = msgs.en.feedback;
  if (langToggle) langToggle.textContent = 'EN';

  // helper to highlight special numbers while playing (3,5,9)
  function setRowPlaying(row, on = true) {
    if (!row) return;
    if (on) row.classList.add('playing');
    else row.classList.remove('playing');
  }

  // shared play function
  async function playSource(src, row) {
    if (!audioEl || !src) return;
    try {
      if (!audioEl.paused) {
        try { audioEl.pause(); } catch(e) {}
      }
      audioEl.src = src;
      audioEl.currentTime = 0;
      // mark playing UI for highlighted rows
      if (row && row.classList.contains('highlight-number')) setRowPlaying(row, true);
      await audioEl.play();
      playing = true;
      await new Promise(resolve => audioEl.addEventListener('ended', resolve, { once: true }));
    } catch (err) {
      console.warn('Audio play failed', src, err);
      alert('Audio gagal diputar. Periksa path audio: ' + src);
    } finally {
      playing = false;
      if (row && row.classList.contains('highlight-number')) setRowPlaying(row, false);
    }
  }

  // mark cell as played and attach check
  function markPlayed(row, side) {
    if (!row) return;
    const gen = row.querySelector('.cell-general');
    const mar = row.querySelector('.cell-maritime');

    if (side === 'general' && gen) {
      gen.classList.add('played-general');
      if (!gen.querySelector('.check')) {
        const c = document.createElement('span'); c.className='check'; c.textContent=' ✔'; gen.appendChild(c);
      }
    } else if (side === 'maritime' && mar) {
      mar.classList.add('played-maritime');
      if (!mar.querySelector('.check')) {
        const c = document.createElement('span'); c.className='check'; c.textContent=' ✔'; mar.appendChild(c);
      }
    }
  }

  // when to show feedback (after N interactions) - configurable
  const feedbackAfter = SECTION.feedback_after_interactions || 3;
  function maybeShowFeedback() {
    if (interactionCount >= feedbackAfter && feedback) {
      feedback.classList.remove('d-none');
      fbText.textContent = msgs[currentLang].feedback;
      // reveal next button
      if (nextBtn) nextBtn.classList.remove('d-none');
    }
  }

  // attach handlers
  function attach() {
    genBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (playing) return;
        const src = btn.dataset.src;
        const row = btn.closest('tr');
        markPlayed(row, 'general');
        interactionCount++;
        maybeShowFeedback();
        await playSource(src, row);
      });
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
    });

    marBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (playing) return;
        const src = btn.dataset.src;
        const row = btn.closest('tr');
        markPlayed(row, 'maritime');
        interactionCount++;
        maybeShowFeedback();
        await playSource(src, row);
      });
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
    });
  }

  // language toggle behavior (text only)
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (instructionEl) instructionEl.textContent = msgs[currentLang].instruction;
      if (interactionCount >= feedbackAfter && fbText) fbText.textContent = msgs[currentLang].feedback;
      // optional: show captain tip in console (or future UI)
      console.debug('Captain tip:', msgs[currentLang].captain_tip);
    });
  }

  // next button uses data-next attribute
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextUrl = nextBtn.dataset.next;
      if (nextUrl) window.location.href = nextUrl;
    });
  }

  attach();

  // optional: prefetch audio
  if (SECTION.prefetch_audio && SECTION.pairs) {
    SECTION.pairs.forEach(p => {
      [p.general_audio, p.maritime_audio].forEach(path => {
        if (path) { const a = new Audio(path); a.preload = 'auto'; }
      });
    });
  }

});
