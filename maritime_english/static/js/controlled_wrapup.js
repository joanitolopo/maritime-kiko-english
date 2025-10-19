// static/js/controlled_wrapup.js
document.addEventListener('DOMContentLoaded', () => {
  const langBtn = document.getElementById('wrap-lang-toggle');
  const wrapParagraph = document.getElementById('wrapup-paragraph');
  const audioBtn = document.getElementById('wrap-audio-btn');
  const wrapAudio = document.getElementById('wrapup-audio');
  const notebook = document.getElementById('notebook');
  const goBtn = document.getElementById('go-guided');

  // injected content
  const SECTION = window.SECTION_CONTENT || {};
  const texts = {
    en: SECTION.text_en || "Well done! You’ve practiced spelling with the NATO alphabet and numbers. You can now spell ship names and codes clearly. Next, we’ll try using them in real communication tasks.",
    id: SECTION.text_id || "Kerja bagus! Kalian sudah berlatih mengeja dengan alfabet dan angka NATO. Sekarang kalian bisa mengeja nama kapal dan kode dengan jelas. Selanjutnya, kita akan mencobanya dalam tugas komunikasi nyata."
  };

  let lang = 'en';
  let isPlaying = false;

  // init text
  if (wrapParagraph) wrapParagraph.textContent = texts.en;

  // language toggle: swap text only (audio remains EN)
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      lang = (lang === 'en') ? 'id' : 'en';
      langBtn.textContent = lang.toUpperCase();
      langBtn.setAttribute('aria-pressed', lang === 'id' ? 'true' : 'false');
      if (wrapParagraph) wrapParagraph.textContent = (lang === 'en' ? texts.en : texts.id);
    });
  }

  // audio play/pause with UI sync and notebook animation on end
  if (audioBtn && wrapAudio) {
    audioBtn.addEventListener('click', async () => {
      try {
        if (wrapAudio.paused) {
          await wrapAudio.play();
          isPlaying = true;
          audioBtn.classList.add('playing');
          audioBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          wrapAudio.pause();
          isPlaying = false;
          audioBtn.classList.remove('playing');
          audioBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
      } catch (err) {
        console.error('Audio play failed', err);
        alert('Audio gagal diputar. Periksa file audio pada server atau izin autoplay browser.');
      }
    });

    wrapAudio.addEventListener('ended', () => {
      isPlaying = false;
      audioBtn.classList.remove('playing');
      audioBtn.innerHTML = '<i class="fas fa-play"></i>';
      // show notebook check animation
      if (notebook) {
        notebook.classList.add('show');
        setTimeout(() => { notebook.classList.remove('show'); }, 2800);
      }
    });

    // keyboard support
    audioBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); audioBtn.click(); }
    });
  }

  // Go to Guided Practice: animate button then redirect using data-next
  if (goBtn) {
    // pulse on load to draw attention
    setTimeout(() => goBtn.classList.add('pulse'), 200);
    setTimeout(() => goBtn.classList.remove('pulse'), 1800);

    goBtn.addEventListener('click', () => {
      const href = goBtn.dataset.next;
      if (!href) {
        alert('Next section not configured for this unit.');
        return;
      }
      goBtn.classList.add('pulse');
      setTimeout(() => { window.location.href = href; }, 260);
    });

    goBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBtn.click(); }
    });
  }
});
