// ========================================
// MODERN GUIDED TASK 2 JAVASCRIPT
// Logbook Reflection
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Logbook Reflection Initialized!');

    // ==================================================
    // ELEMENTS & STATE
    // ==================================================
    const playBtn_sidebar = document.querySelector('#captain-audio-btn');
    const playIcon_sidebar = playBtn_sidebar ? playBtn_sidebar.querySelector('i') : null;
    const translateBtn_sidebar = document.querySelector('#translate-btn');
    const speechText_sidebar = document.querySelector('.speech-text-drill');
    const instructionText_activity = document.querySelector('.instruction-text-task');

    const likertInputs = document.querySelectorAll('.likert-scale input[type="radio"]');
    const textInputs = document.querySelectorAll('.item-input');
    const saveButton = document.querySelector('.save-logbook-button');

    // ✅ Ambil elemen radio waves
    const radioWavesAnim = document.querySelector('.radio-waves');

    const audio_sidebar = new Audio();
    let isTranslated = false;

    // Ambil konten dari window object (didefinisikan di HTML)
    const originalText_sidebar = window.SIDEBAR_CONTENT?.original || '"Error: Teks tidak dimuat"';
    const translatedText_sidebar = window.SIDEBAR_CONTENT?.translated || '"Error: Teks tidak dimuat"';
    const audioPath_sidebar = window.SIDEBAR_CONTENT?.audioPath || '';

    // ✅ DATA TRANSLATE: Activity Instruction
    const instructionContent = {
        original: `Your reflection will appear in your Report Page. <strong>1)</strong> Rate yourself honestly. <strong>2)</strong> Write down your reflection notes. <strong>3)</strong> Click 'Save to Logbook' when you finish.`,
        translated: `Refleksi Anda akan muncul di Halaman Laporan. <strong>1)</strong> Nilai diri Anda dengan jujur. <strong>2)</strong> Tuliskan catatan refleksi Anda. <strong>3)</strong> Klik 'Simpan ke Buku Catatan' saat selesai.`
    };

    // ✅ DATA TRANSLATE: Part A Title
    const partATitleContent = {
        original: 'Part A: Self-Assessment',
        translated: 'Bagian A: Penilaian Diri'
    };

    // ✅ DATA TRANSLATE: Part A Questions
    const assessmentQuestions = {
        q1: {
            original: 'I can spell names and numbers clearly using the Maritime Alphabet.',
            translated: 'Saya dapat mengeja nama dan angka dengan jelas menggunakan Alfabet Maritim.'
        },
        q2: {
            original: 'I can understand vessel identification messages on the radio.',
            translated: 'Saya dapat memahami pesan identifikasi kapal di radio.'
        },
        q3: {
            original: 'I feel more confident speaking on the radio after this unit.',
            translated: 'Saya merasa lebih percaya diri berbicara di radio setelah unit ini.'
        }
    };

    // ✅ DATA TRANSLATE: Part B Title
    const partBTitleContent = {
        original: 'Part B: Reflection Notes',
        translated: 'Bagian B: Catatan Refleksi'
    };

    // ✅ DATA TRANSLATE: Part B Questions
    const reflectionQuestions = {
        r1: {
            original: '1. What did you find easiest during this unit?',
            translated: '1. Bagian apa yang paling mudah bagimu selama unit ini?',
            placeholder_original: 'Type your answer here...',
            placeholder_translated: 'Ketik jawaban Anda di sini...'
        },
        r2: {
            original: '2. What part did you struggle with, and why?',
            translated: '2. Bagian mana yang paling kamu rasa sulit, dan mengapa?',
            placeholder_original: 'Type your answer here...',
            placeholder_translated: 'Ketik jawaban Anda di sini...'
        },
        r3: {
            original: '3. What will you do differently next time to improve?',
            translated: '3. Apa yang akan kamu lakukan secara berbeda lain kali untuk meningkatkan kemampuan komunikasimu?',
            placeholder_original: 'Type your answer here...',
            placeholder_translated: 'Ketik jawaban Anda di sini...'
        }
    };

    // ✅ DATA TRANSLATE: Save Button
    const saveButtonContent = {
        original: '<i class="fas fa-paper-plane"></i><span>Save to Logbook</span>',
        translated: '<i class="fas fa-paper-plane"></i><span>Simpan ke Buku Catatan</span>'
    };

    // ==================================================
    // ✅ SIDEBAR AUDIO CONTROL (UPDATED)
    // ==================================================
    if (playBtn_sidebar && playIcon_sidebar) {
        playBtn_sidebar.addEventListener('click', function() {
            // Cek path audio dulu
            if (!audioPath_sidebar) {
                console.error('Audio path tidak tersedia!');
                showNotification('Audio file path not configured.', 'error');
                return;
            }

            if (audio_sidebar.paused) {
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        playIcon_sidebar.classList.remove('fa-play');
                        playIcon_sidebar.classList.add('fa-pause');
                        playBtn_sidebar.classList.add('playing');
                        
                        // ✅ TAMPILKAN radio waves saat audio DIPUTAR
                        if (radioWavesAnim) radioWavesAnim.classList.add('active');
                    })
                    .catch(error => {
                        console.error('Audio error:', error);
                        console.log('Attempted audio path:', audioPath_sidebar);
                        showNotification('Audio file not found: ' + audioPath_sidebar, 'error');
                    });
            } else {
                audio_sidebar.pause();
                playIcon_sidebar.classList.remove('fa-pause');
                playIcon_sidebar.classList.add('fa-play');
                playBtn_sidebar.classList.remove('playing');
                
                // ✅ SEMBUNYIKAN radio waves saat audio DIPAUSE
                if (radioWavesAnim) radioWavesAnim.classList.remove('active');
            }
        });

        // ✅ SEMBUNYIKAN radio waves saat audio SELESAI
        audio_sidebar.addEventListener('ended', () => {
            playIcon_sidebar.classList.remove('fa-pause');
            playIcon_sidebar.classList.add('fa-play');
            playBtn_sidebar.classList.remove('playing');
            
            if (radioWavesAnim) radioWavesAnim.classList.remove('active');
        });
    }

    // ==================================================
    // ✅ TRANSLATE BUTTON - TRANSLATE SEMUA KONTEN
    // ==================================================
    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            isTranslated = !isTranslated;
            
            if (isTranslated) {
                // ===== BAHASA INDONESIA =====
                
                // 1. Sidebar Speech
                speechText_sidebar.textContent = translatedText_sidebar;
                
                // 2. Activity Instruction
                instructionText_activity.innerHTML = instructionContent.translated;
                
                // 3. Part A Title
                const partATitle = document.querySelector('.part-title');
                if (partATitle) partATitle.textContent = partATitleContent.translated;
                
                // 4. Part A Questions (Assessment Items)
                document.querySelectorAll('.assessment-item').forEach(item => {
                    const questionKey = item.getAttribute('data-question');
                    const itemText = item.querySelector('.item-text');
                    const itemNumber = itemText.querySelector('.item-number');
                    const numberText = itemNumber ? itemNumber.textContent : '';
                    
                    if (assessmentQuestions[questionKey]) {
                        itemText.innerHTML = `<span class="item-number">${numberText}</span> ${assessmentQuestions[questionKey].translated}`;
                    }
                });
                
                // 5. Part B Title
                const partBTitle = document.querySelectorAll('.part-title')[1];
                if (partBTitle) partBTitle.textContent = partBTitleContent.translated;
                
                // 6. Part B Questions (Reflection Items)
                document.querySelectorAll('.reflection-item').forEach(item => {
                    const questionKey = item.getAttribute('data-question');
                    const label = item.querySelector('.item-label');
                    const textarea = item.querySelector('.item-input');
                    
                    if (reflectionQuestions[questionKey]) {
                        label.textContent = reflectionQuestions[questionKey].translated;
                        textarea.placeholder = reflectionQuestions[questionKey].placeholder_translated;
                    }
                });
                
                // 7. Save Button
                saveButton.innerHTML = saveButtonContent.translated;
                
                // 8. Translate Button Text
                const btnSpan = translateBtn_sidebar.querySelector('span');
                if (btnSpan) btnSpan.textContent = 'English';
                
            } else {
                // ===== BAHASA INGGRIS (ORIGINAL) =====
                
                // 1. Sidebar Speech
                speechText_sidebar.textContent = originalText_sidebar;
                
                // 2. Activity Instruction
                instructionText_activity.innerHTML = instructionContent.original;
                
                // 3. Part A Title
                const partATitle = document.querySelector('.part-title');
                if (partATitle) partATitle.textContent = partATitleContent.original;
                
                // 4. Part A Questions (Assessment Items)
                document.querySelectorAll('.assessment-item').forEach(item => {
                    const questionKey = item.getAttribute('data-question');
                    const itemText = item.querySelector('.item-text');
                    const itemNumber = itemText.querySelector('.item-number');
                    const numberText = itemNumber ? itemNumber.textContent : '';
                    
                    if (assessmentQuestions[questionKey]) {
                        itemText.innerHTML = `<span class="item-number">${numberText}</span> ${assessmentQuestions[questionKey].original}`;
                    }
                });
                
                // 5. Part B Title
                const partBTitle = document.querySelectorAll('.part-title')[1];
                if (partBTitle) partBTitle.textContent = partBTitleContent.original;
                
                // 6. Part B Questions (Reflection Items)
                document.querySelectorAll('.reflection-item').forEach(item => {
                    const questionKey = item.getAttribute('data-question');
                    const label = item.querySelector('.item-label');
                    const textarea = item.querySelector('.item-input');
                    
                    if (reflectionQuestions[questionKey]) {
                        label.textContent = reflectionQuestions[questionKey].original;
                        textarea.placeholder = reflectionQuestions[questionKey].placeholder_original;
                    }
                });
                
                // 7. Save Button
                saveButton.innerHTML = saveButtonContent.original;
                
                // 8. Translate Button Text
                const btnSpan = translateBtn_sidebar.querySelector('span');
                if (btnSpan) btnSpan.textContent = 'Translate';
            }
        });
    }

    // ==================================================
    // FORM INTERACTIVITY
    // ==================================================

    // 1. Umpan balik Skala Likert
    likertInputs.forEach(input => {
        input.addEventListener('change', () => {
            const item = input.closest('.assessment-item');
            if (item) {
                item.classList.add('completed');
                playSuccessSound();
            }
        });
    });

    // 2. Umpan balik Textarea
    textInputs.forEach(input => {
        input.addEventListener('input', () => {
            const item = input.closest('.reflection-item');
            if (item) {
                if (input.value.trim() !== '') {
                    item.classList.add('completed');
                } else {
                    item.classList.remove('completed');
                }
            }
        });
    });

    // ==================================================
    // SAVE LOGBOOK TO SERVER
    // ==================================================
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            if (!validateForm()) {
                showNotification('Please complete all fields before saving.', 'error');
                shakeElement(saveButton);
                return;
            }

            // Kumpulkan data dari form
            const reflectionData = {
                q1: document.querySelector('input[name="q1"]:checked').value,
                q2: document.querySelector('input[name="q2"]:checked').value,
                q3: document.querySelector('input[name="q3"]:checked').value,
                r1: document.getElementById('r1').value.trim(),
                r2: document.getElementById('r2').value.trim(),
                r3: document.getElementById('r3').value.trim()
            };

            // Disable tombol dan tampilkan loading
            saveButton.disabled = true;
            const originalHTML = saveButton.innerHTML;
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Saving...</span>';

            try {
                const response = await fetch(`/learn/unit/${window.UNIT_ID}/save_reflection`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(reflectionData)
                });

                const result = await response.json();

                if (result.success) {
                    showNotification('Logbook saved successfully! ⚓', 'success');
                    saveButton.innerHTML = '<i class="fas fa-check"></i> <span>Saved!</span>';
                    saveButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

                    // ✅ TAMPILKAN TOMBOL FINISH
                    const finishSection = document.getElementById('finish-section');
                    if (finishSection) {
                        finishSection.classList.remove('hidden');
                        finishSection.classList.add('visible');
                    }

                    // Scroll ke tombol finish
                    setTimeout(() => {
                        finishSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 500);

                    // Kembalikan tombol save ke semula setelah 3 detik
                    setTimeout(() => {
                        saveButton.innerHTML = originalHTML;
                        saveButton.style.background = '';
                    }, 3000);
                } else {
                    throw new Error(result.message || 'Unknown error');
                }
            } catch (error) {
                console.error('Save error:', error);
                showNotification('Failed to save logbook. Please try again.', 'error');
                saveButton.innerHTML = originalHTML;
                saveButton.disabled = false;
            }
        });
    }

    function validateForm() {
        let isValid = true;

        // Validasi Part A (Likert)
        const q1 = document.querySelector('input[name="q1"]:checked');
        const q2 = document.querySelector('input[name="q2"]:checked');
        const q3 = document.querySelector('input[name="q3"]:checked');

        if (!q1) {
            document.querySelector('.assessment-item[data-question="q1"]').classList.add('error-shake');
            isValid = false;
        }
        if (!q2) {
             document.querySelector('.assessment-item[data-question="q2"]').classList.add('error-shake');
            isValid = false;
        }
        if (!q3) {
             document.querySelector('.assessment-item[data-question="q3"]').classList.add('error-shake');
            isValid = false;
        }
        
        // Validasi Part B (Textarea)
        const r1 = document.getElementById('r1').value.trim();
        const r2 = document.getElementById('r2').value.trim();
        const r3 = document.getElementById('r3').value.trim();

        if (r1 === '') {
            document.querySelector('.reflection-item[data-question="r1"]').classList.add('error-shake');
            isValid = false;
        }
        if (r2 === '') {
            document.querySelector('.reflection-item[data-question="r2"]').classList.add('error-shake');
            isValid = false;
        }
        if (r3 === '') {
            document.querySelector('.reflection-item[data-question="r3"]').classList.add('error-shake');
            isValid = false;
        }
        
        // Hapus animasi shake setelah selesai
        setTimeout(() => {
            document.querySelectorAll('.error-shake').forEach(el => el.classList.remove('error-shake'));
        }, 500);

        return isValid;
    }


    // ==================================================
    // HELPER FUNCTIONS
    // ==================================================
    
    function shakeElement(element) {
        if (!element) return;
        element.style.animation = 'shake 0.5s';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    function playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        } catch (e) {
            console.log('Success sound not available');
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${colors[type]};
            color: ${colors[type]};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    console.log('✅ Logbook Reflection Ready!');
});

// Tambahkan animasi notifikasi
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }

    .error-shake {
        animation: shake 0.5s;
    }
`;
document.head.appendChild(styles);