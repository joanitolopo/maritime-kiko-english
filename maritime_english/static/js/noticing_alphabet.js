// static/js/noticing_alphabet.js
document.addEventListener('DOMContentLoaded', () => {
  const SECTION = window.SECTION_CONTENT || {};
  const audioEl = document.getElementById('pair-audio');
  const feedback = document.getElementById('alphabet-feedback');
  const fbText = document.getElementById('fb-text');
  const nextBtn = document.getElementById('alphabet-next');
  const langToggle = document.getElementById('alphabet-lang-toggle');
  const instructionEl = document.getElementById('alphabet-instruction');

  // messages from SECTION (fallbacks)
  const msgs = {
    en: {
      feedback: SECTION.feedback_text_en || 'Good listening! See the difference?',
      instruction: SECTION.instruction_en || 'Click each pair to hear the difference.'
    },
    id: {
      feedback: SECTION.feedback_text_id || 'Bagus pendengaranmu! Lihat bedanya?',
      instruction: SECTION.instruction_id || 'Klik setiap pasangan untuk mendengar perbedaannya.'
    }
  };

  let currentLang = 'en';
  let interactionCount = 0;
  let playing = false;

  // initialize UI texts from SECTION
  if (instructionEl) instructionEl.textContent = msgs.en.instruction;
  if (fbText) fbText.textContent = msgs.en.feedback;
  if (langToggle) langToggle.textContent = 'EN';

  // helper: show feedback bubble and reveal Next
  function showFeedback() {
    if (!feedback) return;
    feedback.classList.remove('d-none');
    fbText.textContent = msgs[currentLang].feedback;
    // reveal next button if configured
    if (nextBtn) nextBtn.classList.remove('d-none');
  }

  // play audio with shared element, handle errors
  async function playSrc(src) {
    if (!audioEl || !src) return;
    try {
      // prevent overlapping: pause if playing
      if (!audioEl.paused) {
        try { audioEl.pause(); } catch (e) {}
      }
      audioEl.src = src;
      audioEl.currentTime = 0;
      await audioEl.play();
      playing = true;
      await new Promise(resolve => audioEl.addEventListener('ended', resolve, { once: true }));
    } catch (err) {
      console.warn('Failed to play', src, err);
      // show small inline alert
      alert('Audio gagal diputar. Cek console dan pastikan file ada: ' + src);
    } finally {
      playing = false;
    }
  }

  // add click handlers for dynamically-created pair buttons
  function attachHandlers() {
    const genBtns = document.querySelectorAll('.pair-btn-general');
    const marBtns = document.querySelectorAll('.pair-btn-maritime');

    genBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const src = btn.dataset.src;
        const row = btn.closest('tr');
        if (row) markPlayed(row, 'general');
        interactionCount++;
        await playSrc(src);
        maybeShowFeedback();
      });
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
    });

    marBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const src = btn.dataset.src;
        const row = btn.closest('tr');
        if (row) markPlayed(row, 'maritime');
        interactionCount++;
        await playSrc(src);
        maybeShowFeedback();
      });
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
    });
  }

  // mark UI for played cell, add checkmark if not present
  function markPlayed(row, side) {
    if (!row) return;
    const gen = row.querySelector('.cell-general');
    const mar = row.querySelector('.cell-maritime');
    if (side === 'general' && gen) {
      gen.classList.add('played-general');
      if (!gen.querySelector('.check')) {
        const c = document.createElement('span'); c.className = 'check'; c.textContent = ' ✔'; gen.appendChild(c);
      }
    } else if (side === 'maritime' && mar) {
      mar.classList.add('played-maritime');
      if (!mar.querySelector('.check')) {
        const c = document.createElement('span'); c.className = 'check'; c.textContent = ' ✔'; mar.appendChild(c);
      }
    }
  }

  function maybeShowFeedback() {
    // show feedback after first interaction (or after a configurable threshold)
    const threshold = SECTION.feedback_after_interactions || 1;
    if (interactionCount >= threshold) {
      showFeedback();
    }
  }

  // language toggle: swap instruction & feedback messages only
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      if (instructionEl) instructionEl.textContent = msgs[currentLang].instruction;
      if (interactionCount > 0 && fbText) fbText.textContent = msgs[currentLang].feedback;
    });
  }

  // Next button navigation uses data-next attr (templated server-side)
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextUrl = nextBtn.dataset.next;
      if (nextUrl) window.location.href = nextUrl;
    });
  }

  // attach events now
  attachHandlers();

  // If SECTION provides pairs and we want to lazy preload, we can optionally prefetch audio
  if (SECTION.pairs && SECTION.prefetch_audio) {
    SECTION.pairs.forEach(p => {
      [p.general_audio, p.maritime_audio].forEach(path => {
        if (path) {
          const a = new Audio(path);
          a.preload = 'auto';
        }
      });
    });
  }

});
