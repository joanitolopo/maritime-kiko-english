// ========================================
// MODERN GUIDED TASK 2 JAVASCRIPT
// Logbook Reflection
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Logbook Reflection Initialized!');

    // ==================================================
    // ELEMENTS & STATE (DIUPDATE)
    // ==================================================
    const playBtn_sidebar = document.querySelector('#captain-audio-btn'); // DIUBAH: Target #id
    const playIcon_sidebar = playBtn_sidebar ? playBtn_sidebar.querySelector('i') : null; // DITAMBAHKAN: Target <i> di dalam tombol
    const translateBtn_sidebar = document.querySelector('#translate-btn'); // DIUBAH: Target #id
    const speechText_sidebar = document.querySelector('.speech-text-drill'); // DIUBAH: .speech-text-drill
    const instructionText_activity = document.querySelector('.instruction-text-task');

    const likertInputs = document.querySelectorAll('.likert-scale input[type="radio"]');
    const textInputs = document.querySelectorAll('.item-input');
    const saveButton = document.querySelector('.save-logbook-button');

    const audio_sidebar = new Audio();
    let isTranslated = false;

    // Ambil konten dari window object (didefinisikan di HTML)
    const originalText_sidebar = window.SIDEBAR_CONTENT?.original || '"Error: Teks tidak dimuat"';
    const translatedText_sidebar = window.SIDEBAR_CONTENT?.translated || '"Error: Teks tidak dimuat"';
    const audioPath_sidebar = window.SIDEBAR_CONTENT?.audioPath || '';

    // ==================================================
    // SIDEBAR CONTROLS (DIUPDATE)
    // ==================================================
    if (playBtn_sidebar && playIcon_sidebar) { // DIUBAH: Cek kedua elemen
        playBtn_sidebar.addEventListener('click', function() {
            if (audio_sidebar.paused) {
                audio_sidebar.src = audioPath_sidebar;
                audio_sidebar.play()
                    .then(() => {
                        playIcon_sidebar.classList.remove('fa-play'); // DIUBAH: Target ikon
                        playIcon_sidebar.classList.add('fa-pause');
                        playBtn_sidebar.classList.add('playing'); // DIUBAH: Target tombol
                    })
                    .catch(error => {
                        console.error('Audio error:', error);
                        showNotification('Audio file not found or failed to play.', 'error');
                    });
            } else {
                audio_sidebar.pause();
                playIcon_sidebar.classList.remove('fa-pause'); // DIUBAH: Target ikon
                playIcon_sidebar.classList.add('fa-play');
                playBtn_sidebar.classList.remove('playing'); // DIUBAH: Target tombol
            }
        });

        audio_sidebar.addEventListener('ended', () => {
            playIcon_sidebar.classList.remove('fa-pause'); // DIUBAH: Target ikon
            playIcon_sidebar.classList.add('fa-play');
            playBtn_sidebar.classList.remove('playing'); // DIUBAH: Target tombol
        });
    }

    if (translateBtn_sidebar) {
        translateBtn_sidebar.addEventListener('click', function() {
            if (isTranslated) {
                speechText_sidebar.textContent = originalText_sidebar;
                isTranslated = false;
            } else {
                speechText_sidebar.textContent = translatedText_sidebar;
                isTranslated = true;
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

                    // Kembalikan ke semula setelah 3 detik
                    setTimeout(() => {
                        saveButton.innerHTML = originalHTML;
                        saveButton.disabled = false;
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
    // HELPER FUNCTIONS (Salin dari Task 1)
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

// Tambahkan animasi notifikasi (Salin dari Task 1)
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