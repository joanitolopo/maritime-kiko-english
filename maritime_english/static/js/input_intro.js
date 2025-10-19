document.addEventListener('DOMContentLoaded', function() {
    const dialogueText = document.getElementById('dialogue-text');
    const audioBtn = document.getElementById('audio-btn');
    const introAudio = document.getElementById('intro-audio');
    const langBtn = document.getElementById('lang-toggle-btn');
    const startBtn = document.getElementById('start-input-btn');
    const continueLink = document.getElementById('continue-link');

    const data = window.SECTION_CONTENT || {};
    const texts = { en: data.intro_en, id: data.intro_id };

    if (!texts.en) {
        console.error('Missing intro_en in SECTION_CONTENT');
        // Optional: show UI error message 
    }

    // safe guards
    if (dialogueText && texts.en) dialogueText.textContent = texts.en;
    let currentLang = 'en';

    if (langBtn) {
        langBtn.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'id' : 'en';
            langBtn.textContent = currentLang.toUpperCase();
            if (dialogueText) {
                dialogueText.classList.remove('fade-text');
                void dialogueText.offsetWidth;
                dialogueText.textContent = texts[currentLang] || texts.en;
                dialogueText.classList.add('fade-text');
            }
        });
    }

    if (audioBtn && introAudio) {
        audioBtn.addEventListener('click', async () => {
            if (!introAudio.src) {
                alert('Audio tidak tersedia. Periksa file audio di server.');
                return;
            }
            try {
                if (introAudio.paused) {
                    await introAudio.play();
                    audioBtn.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    introAudio.pause();
                    audioBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            } catch (err) {
                console.error('Audio play failed', err);
                alert('Audio gagal diputar. Periksa file audio pada server.');
            }
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // gunakan data-next terlebih dahulu, kalau nggak ada pake hidden continue-link
            const next = startBtn.dataset.next || (continueLink && continueLink.href);
            if (next) {
                startBtn.classList.add('glow-redirect');
                setTimeout(() => { window.location.href = next; }, 200);
            } else {
                console.warn('No next target available for Start Input button.');
                alert('Target navigasi belum tersedia. Hubungi developer.');
            }
        });
    }

    // keyboard accessibility small snippet (optional)
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === startBtn) {
            e.preventDefault();
            startBtn && startBtn.click();
        }
    });

    // inject small helper CSS for fade-text/glow (optional)
    const style = document.createElement('style');
    style.innerHTML = `
    .fade-text { animation: fadeInText 0.45s ease; }
    @keyframes fadeInText { from { opacity: 0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
    .glow-redirect { box-shadow: 0 8px 26px rgba(37,99,235,0.45); transform: translateY(-4px); }
    `;
    document.head.appendChild(style);
});
