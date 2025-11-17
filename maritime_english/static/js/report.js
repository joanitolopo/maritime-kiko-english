document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Report page initialized!');

    /**
     * Stagger-load animation for report cards
     * Ini akan membuat setiap card fade-in satu per satu
     */
    const cards = document.querySelectorAll('.fade-in-up');

    if (cards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Tambahkan kelas .is-visible untuk memicu animasi CSS
                    entry.target.classList.add('is-visible');
                    // Hentikan pengamatan setelah animasi dipicu
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1 // Picu saat 10% card terlihat
        });

        cards.forEach((card, index) => {
            // Tambahkan delay yang berbeda untuk setiap card
            card.style.transitionDelay = `${index * 100}ms`;
            observer.observe(card);
        });
    }

    /**
     * Animate Donut Chart
     * Kita akan menganimasikan custom property '--value' yang kita set di CSS
     */
    const chart = document.querySelector('.summary-chart');
    if (chart) {
        const targetValue = parseInt(chart.getAttribute('aria-valuenow')) || 0;
        
        // Set nilai langsung
        chart.style.setProperty('--progress-value', targetValue);

        // Animasikan teks angka
        const chartValueText = chart.querySelector('.chart-value');
        if (chartValueText) {
            let start = 0;
            const duration = 1000;
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = targetValue / steps;

            const counter = setInterval(() => {
                start += increment;
                if (start >= targetValue) {
                    chartValueText.textContent = `${targetValue}%`;
                    clearInterval(counter);
                } else {
                    chartValueText.textContent = `${Math.floor(start)}%`;
                }
            }, stepTime);
        }
    }
});

// Handle View Details Modal
const detailModal = document.getElementById('detailModal');
if (detailModal) {
    detailModal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        const unitId = button.getAttribute('data-unit-id');
        const unitTitle = button.getAttribute('data-unit-title');
        const reflections = JSON.parse(button.getAttribute('data-reflections') || '{}');
        const selfAssessment = JSON.parse(button.getAttribute('data-self-assessment') || '{}');
        const captainFeedback = button.getAttribute('data-captain-feedback') || '';
        const assessment = JSON.parse(button.getAttribute('data-assessment') || '{}'); // <-- TAMBAHKAN INI
    
        
        const modalTitle = detailModal.querySelector('.modal-title');
        const modalContent = detailModal.querySelector('#modal-content-area');
        
        modalTitle.innerHTML = `<i class="fas fa-clipboard-list me-2"></i> Unit ${unitId}: ${unitTitle}`;
        
        let contentHTML = '<div class="detail-sections">';

        // Assessment Section (tambahkan sebelum Reflections Section)
        if (assessment.total) {
            contentHTML += `
                <div class="detail-section assessment-section">
                    <h6><i class="fas fa-clipboard-check me-2"></i>Final Assessment Score</h6>
                    <div class="assessment-summary">
                        <div class="total-score-display">
                            <span class="score-label">Total Score</span>
                            <span class="score-value">${assessment.total}/15</span>
                            <span class="score-percentage">${assessment.percentage}%</span>
                        </div>
                    </div>
                    <div class="assessment-breakdown">
                        <div class="breakdown-item">
                            <i class="fas fa-ship"></i>
                            <span>Vessel Names</span>
                            <strong>${assessment.task1 || 0}/5</strong>
                        </div>
                        <div class="breakdown-item">
                            <i class="fas fa-keyboard"></i>
                            <span>Call Sign Input</span>
                            <strong>${assessment.task2 || 0}/5</strong>
                        </div>
                        <div class="breakdown-item">
                            <i class="fas fa-microphone"></i>
                            <span>Call Sign Speech</span>
                            <strong>${assessment.task3 || 0}/5</strong>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Self Assessment Section
        const levelClass = selfAssessment.level_label ? selfAssessment.level_label.toLowerCase().replace(' ', '-') : '';
        contentHTML += `
            <div class="detail-section">
                <h6><i class="fas fa-star me-2"></i>Self Assessment</h6>
                <div class="assessment-summary">
                    <div class="avg-score-display">
                        <span class="avg-label">Average Score</span>
                        <span class="avg-value">${selfAssessment.avg_score || '-'}/4</span>
                        ${selfAssessment.level_label ? `<span class="level-tag level-${levelClass}">${selfAssessment.level_label}</span>` : ''}
                    </div>
                </div>
                <div class="assessment-scores">
                    <div class="score-item">
                        <span>Spelling Confidence</span>
                        <strong>${selfAssessment.q1 || '-'}/4</strong>
                    </div>
                    <div class="score-item">
                        <span>Listening Comprehension</span>
                        <strong>${selfAssessment.q2 || '-'}/4</strong>
                    </div>
                    <div class="score-item">
                        <span>Radio Confidence</span>
                        <strong>${selfAssessment.q3 || '-'}/4</strong>
                    </div>
                </div>
            </div>
        `;
        
        // Reflections Section
        contentHTML += `
            <div class="detail-section">
                <h6><i class="fas fa-pen me-2"></i>Reflection Notes</h6>
                <div class="reflection-notes">
                    <div class="note-item">
                        <label>What was easiest:</label>
                        <p>${reflections.easiest || 'No reflection recorded'}</p>
                    </div>
                    <div class="note-item">
                        <label>What was challenging:</label>
                        <p>${reflections.struggle || 'No reflection recorded'}</p>
                    </div>
                    <div class="note-item">
                        <label>Plans for improvement:</label>
                        <p>${reflections.improvement || 'No reflection recorded'}</p>
                    </div>
                </div>
            </div>
        `;

        // Captain's Feedback Section (NEW)
        if (captainFeedback) {
            contentHTML += `
                <div class="detail-section captain-feedback-section">
                    <h6><i class="fas fa-user-tie me-2"></i>Captain's Feedback</h6>
                    <div class="captain-feedback-box">
                        <div class="captain-avatar-small">
                            <i class="fas fa-anchor"></i>
                        </div>
                        <div class="feedback-text">
                            <p>${captainFeedback}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        contentHTML += '</div>';
        modalContent.innerHTML = contentHTML;
    });
}

// Initialize Bootstrap tooltips
document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});