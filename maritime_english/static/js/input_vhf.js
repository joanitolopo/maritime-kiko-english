// input_vhf.js
// Data-driven VHF mini-dialogue behavior. Uses window.SECTION_CONTENT & window.UNIT_CONTENT
document.addEventListener('DOMContentLoaded', function() {
  const SECTION = window.SECTION_CONTENT || {};
  const UNIT = window.UNIT_CONTENT || {};
  const UNIT_ID = window.UNIT_ID || 1;

  const playFullBtn = document.getElementById('play-full');
  const playBBtn = document.getElementById('play-b');
  const repeatBtn = document.getElementById('repeat-response');
  const audioFull = document.getElementById('audio-full');
  const audioB = document.getElementById('audio-b');
  const micRay = document.getElementById('mic-ray');
  const micLina = document.getElementById('mic-lina');
  const feedback = document.getElementById('feedback-bubble');
  const feedbackContent = feedback ? feedback.querySelector('.fb-content') : null;
  const langToggle = document.getElementById('lang-toggle-btn');
  const dialogueText = document.getElementById('dialogue-text');
  const instructionText = document.getElementById('instruction-text');
  const nextBtn = document.getElementById('next-btn');
  const continueLink = document.getElementById('continue-link');
  const vhfQuiz = document.getElementById('vhf-quiz');
  const vhfQuizForm = document.getElementById('vhf-quiz-form');
  const vhfQuizFeedback = document.getElementById('vhf-quiz-feedback');

  // Use section content with sensible fallbacks
  const texts = {
    en: {
      dialogue: SECTION.dialogue_en || SECTION.dialogue || 'Operator A: ... Operator B: ...',
      instruction: SECTION.instruction_en || SECTION.instruction || "Listen to the dialogue carefully. Then, repeat Operator B's response aloud.",
      feedback_good: SECTION.default_feedback || "Good job! Keep practicing to sound like a real sailor.",
      feedback_try: "Try again. Listen carefully and repeat."
    },
    id: {
      dialogue: SECTION.dialogue_id || SECTION.dialogue || 'Operator A: ... Operator B: ...',
      instruction: SECTION.instruction_id || SECTION.instruction || "Dengarkan dialog dengan saksama. Lalu, ulangi jawaban Operator B dengan suara keras.",
      feedback_good: SECTION.default_feedback_id || "Bagus! Terus latih agar terdengar seperti pelaut sejati.",
      feedback_try: "Coba lagi. Dengarkan dengan teliti dan ulangi."
    }
  };

  let currentLang = 'en';
  let playedOnce = false;
  let playingAudio = null;

  // disable Next until user plays at least once
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.setAttribute('aria-disabled', 'true');
    nextBtn.style.opacity = '0.6';
  }

  function showFeedback(msg) {
    if (!feedback || !feedbackContent) { console.log('FEEDBACK:', msg); return; }
    feedbackContent.textContent = msg;
    feedback.classList.remove('visually-hidden');
    feedback.classList.add('pop-visible');
    setTimeout(() => {
      feedback.classList.add('visually-hidden');
      feedback.classList.remove('pop-visible');
    }, 3000);
  }

  function enableNext() {
    if (!nextBtn) return;
    playedOnce = true;
    nextBtn.disabled = false;
    nextBtn.setAttribute('aria-disabled', 'false');
    nextBtn.style.opacity = '1';
  }

  function micOn(target) { if (target) target.classList.add('on'); }
  function micOff(target) { if (target) target.classList.remove('on'); }

  async function playAudio(audioEl, micTarget) {
    if (!audioEl) return;
    try {
      if (playingAudio && playingAudio !== audioEl) {
        try { playingAudio.pause(); } catch(e) {}
      }
      playingAudio = audioEl;
      audioEl.muted = false;
      if (micTarget) micOn(micTarget);
      await audioEl.play();
      enableNext();
    } catch (err) {
      console.error('Play failed:', err);
      showFeedback('Audio failed to play. Please check your sound or reload the page.');
      if (micTarget) micOff(micTarget);
    }
  }

  // wire buttons -> audio
  if (playFullBtn && audioFull) {
    playFullBtn.addEventListener('click', () => {
      micOn(micRay);
      micOn(micLina);
      playAudio(audioFull, micLina); // show Lina as primary responder
    });
    playFullBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playFullBtn.click(); }});
    audioFull.addEventListener('ended', () => { micOff(micRay); micOff(micLina); playingAudio = null; showFeedback(texts[currentLang].feedback_good); });
    audioFull.addEventListener('error', () => { micOff(micRay); micOff(micLina); showFeedback('Audio file not available.'); });
  }

  if (playBBtn && audioB) {
    playBBtn.addEventListener('click', () => { micOn(micLina); playAudio(audioB, micLina); });
    playBBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playBBtn.click(); }});
    audioB.addEventListener('ended', () => { micOff(micLina); playingAudio = null; showFeedback(texts[currentLang].feedback_good); });
    audioB.addEventListener('error', () => { micOff(micLina); showFeedback('Audio file not available.'); });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      // friendly prompt only
      showFeedback(currentLang === 'en' ? texts.en.feedback_good : texts.id.feedback_good);
      if (!playedOnce) {
        showFeedback(currentLang === 'en' ? 'Play the dialogue first, then repeat aloud.' : 'Putar dialog terlebih dahulu, lalu ulangi dengan suara.');
      }
    });
    repeatBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); repeatBtn.click(); }});
  }

  // Language toggle: swap visible text
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      currentLang = (currentLang === 'en') ? 'id' : 'en';
      langToggle.textContent = currentLang.toUpperCase();
      langToggle.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
      // set dialogue (innerHTML because we may include <strong>)
      if (dialogueText) dialogueText.innerHTML = (currentLang === 'en' ? texts.en.dialogue : texts.id.dialogue);
      if (instructionText) instructionText.textContent = (currentLang === 'en' ? texts.en.instruction : texts.id.instruction);
    });
  }

  // Optional quiz wiring (if present in template)
  if (vhfQuiz && vhfQuizForm && vhfQuizFeedback) {
    vhfQuizForm.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) return;
      if ((SECTION.correct_answer && val === SECTION.correct_answer) || (val === 'lina')) {
        vhfQuizFeedback.className = 'alert alert-success mt-2';
        vhfQuizFeedback.textContent = SECTION.quiz_feedback_correct || '✅ Correct — Operator B (Lina) responded.';
        vhfQuizFeedback.classList.remove('d-none');
        showFeedback(texts[currentLang].feedback_good);
      } else {
        vhfQuizFeedback.className = 'alert alert-danger mt-2';
        vhfQuizFeedback.textContent = SECTION.quiz_feedback_wrong || '❌ Not correct. Listen again and try.';
        vhfQuizFeedback.classList.remove('d-none');
        showFeedback(texts[currentLang].feedback_try);
      }
    });
  }

  // Next navigation - prefer continueLink (injected by template)
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const nextHref = continueLink && continueLink.href;
      if (nextHref) {
        nextBtn.classList.add('glow-redirect');
        setTimeout(()=> { window.location.href = nextHref; }, 200);
      } else {
        const fallback = window.location.pathname.replace('vhf','wrap_up');
        window.location.href = fallback;
      }
    });
    nextBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextBtn.click(); }});
  }

  // make sure audio element sources come from SECTION if provided
  if (SECTION.audio_full && audioFull) audioFull.src = SECTION.audio_full;
  if (SECTION.audio_b && audioB) audioB.src = SECTION.audio_b;

  // load initial dialogue text from SECTION (or default)
  if (dialogueText) {
    dialogueText.innerHTML = SECTION.dialogue_en || texts.en.dialogue;
  }
  if (instructionText) {
    instructionText.textContent = SECTION.instruction_en || texts.en.instruction;
  }

  // small CSS injection for mic indicator (if not in CSS)
  const style = document.createElement('style');
  style.innerHTML = `
    .mic-indicator { width:10px; height:10px; border-radius:50%; background:#6b7280; box-shadow: none; transition: box-shadow 0.12s, transform 0.12s; }
    .mic-indicator.on { box-shadow: 0 0 12px rgba(16,185,129,0.95); transform: translateY(-2px); background: #34D399; }
    .pop-visible { animation: popIn 0.36s ease; }
    @keyframes popIn { from {opacity:0; transform:translateY(6px)} to {opacity:1; transform:none} }
  `;
  document.head.appendChild(style);

  // cleanup on unload
  window.addEventListener('beforeunload', () => {
    try { if (audioFull) audioFull.pause(); if (audioB) audioB.pause(); } catch(e){}
  });
});
