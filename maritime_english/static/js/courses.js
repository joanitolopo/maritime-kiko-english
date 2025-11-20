document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Courses page initialized!');

    /**
     * Subunit Data - All 9 subunits with their information
     */
    const subunitsData = [
        {
            letter: 'A',
            title: 'Set Sail for Today\'s Voyage',
            description: 'In this part, you will learn what the unit is about, what you will achieve, and why it matters for your training at sea.',
            icon: 'fas fa-compass'
        },
        {
            letter: 'B',
            title: 'Get Ready to Sail',
            description: 'Here, you will warm up and build the basic vocabulary you need before starting the main activities.',
            icon: 'fas fa-anchor'
        },
        {
            letter: 'C',
            title: 'Sail into Real Communication',
            description: 'You will explore how real sailors communicate by listening to authentic audio, watching videos, and studying real examples.',
            icon: 'fas fa-headphones'
        },
        {
            letter: 'D',
            title: 'Navigate the Language',
            description: 'In this part, you will learn what the unit is about, what you will achieve, and why it matters for your training at sea.',
            icon: 'fas fa-map'
        },
        {
            letter: 'E',
            title: 'Drill It Like a Seafarer',
            description: 'You will practice your accuracy and pronunciation through focused exercises to help you speak more clearly.',
            icon: 'fas fa-users'
        },
        {
            letter: 'F',
            title: 'Practice with the Crew',
            description: 'Here, you will practice speaking with a partner through Captain–Crew role-play scenarios.',
            icon: 'fas fa-pen'
        },
        {
            letter: 'G',
            title: 'Sail Through the Real Challenge',
            description: 'You will use what you have learned to complete realistic maritime communication tasks on your own.',
            icon: 'fas fa-ship'
        },
        {
            letter: 'H',
            title: 'Test Your Sea Skills',
            description: 'This part will check how well you mastered the unit by completing the final performance test.',
            icon: 'fas fa-clipboard-check'
        },
        {
            letter: 'I',
            title: 'Log Your Learning Journey',
            description: 'You will reflect on your learning, think about what you did well, and plan how to improve next time.',
            icon: 'fas fa-book'
        }
    ];

    /**
     * Open Subunit Modal
     * @param {number} unitId - The unit ID
     * @param {string} unitTitle - The unit title
     * @param {number} completedSubunits - Number of completed subunits (0-9)
     * @param {string} introductionUrl - URL for the unit introduction page (from url_for)
     * @param {string} subunitUrlTemplate - URL template for subunits (from url_for, with '999' as placeholder)
     */
    window.openSubunitModal = function(unitId, unitTitle, completedSubunits, introductionUrl, subunitUrlTemplate) {
        // Update modal header
        document.getElementById('modalUnitNumber').textContent = unitId;
        document.getElementById('subunitModalLabel').textContent = unitTitle;
        document.getElementById('completedCount').textContent = completedSubunits;

        // Generate subunit list
        const subunitList = document.getElementById('subunitList');
        subunitList.innerHTML = '';

        subunitsData.forEach((subunit, index) => {
            const isCompleted = index < completedSubunits;
            const isCurrent = index === completedSubunits;
            const isLocked = index > completedSubunits;
            
            // ✅ BAGIAN BARU: Part H (index 7) & Part I (index 8) dikunci setelah complete
            const isPartH = index === 7;
            const isPartI = index === 8;
            const isLockedAssessment = (isPartH || isPartI) && isCompleted;

            let statusClass = 'locked';
            let statusBadgeClass = 'locked';
            let statusText = 'Locked';
            let iconContent = `<i class="fas fa-lock"></i>`;

            if (isLockedAssessment) {
                // Part H & I yang sudah complete = dikunci
                statusClass = 'completed locked-assessment';
                statusBadgeClass = 'completed';
                statusText = 'Completed & Locked';
                iconContent = `<i class="fas fa-lock"></i>`;
            } else if (isCompleted) {
                statusClass = 'completed';
                statusBadgeClass = 'completed';
                statusText = 'Completed';
                iconContent = `<i class="fas fa-check"></i>`;
            } else if (isCurrent) {
                statusClass = 'current';
                statusBadgeClass = 'current';
                statusText = 'Start Here';
                iconContent = `<i class="${subunit.icon}"></i>`;
            }

            const subunitHTML = `
                <div class="subunit-item ${statusClass}" data-subunit-index="${index}">
                    <div class="subunit-icon">
                        ${iconContent}
                    </div>
                    <div class="subunit-content">
                        <div class="subunit-letter">Part ${subunit.letter}</div>
                        <h6 class="subunit-title">${subunit.title}</h6>
                        <p class="subunit-description">${subunit.description}</p>
                        <div class="subunit-status">
                            <span class="status-badge ${statusBadgeClass}">
                                ${isLockedAssessment ? '<i class="fas fa-lock me-1"></i>' : ''}
                                ${(isCompleted && !isLockedAssessment) ? '<i class="fas fa-check-circle me-1"></i>' : ''}
                                ${isCurrent ? '<i class="fas fa-play-circle me-1"></i>' : ''}
                                ${(isLocked && !isLockedAssessment) ? '<i class="fas fa-lock me-1"></i>' : ''}
                                ${statusText}
                            </span>
                        </div>
                    </div>
                </div>
            `;

            subunitList.innerHTML += subunitHTML;
        });

        // Update start button
        const startBtn = document.getElementById('startVoyageBtn');
        if (completedSubunits >= 9) {
            startBtn.innerHTML = '<i class="fas fa-trophy me-2"></i> Unit Completed!';
            startBtn.disabled = true;
        } else {
            if (completedSubunits > 0) {
                startBtn.innerHTML = `<i class="fas fa-ship me-2"></i> Continue Sailing`;
            } else {
                startBtn.innerHTML = `<i class="fas fa-ship me-2"></i> Start Voyage`;
            }
            startBtn.disabled = false;
            
            startBtn.onclick = () => {
                const url = introductionUrl;
                console.log(`Navigating to Unit Introduction: ${url}`);
                window.location.href = url;
            };
        }

        // ✅ TAMBAHKAN TOMBOL RESET (hanya jika ada progress)
        const resetBtnContainer = document.getElementById('resetProgressContainer');
        if (completedSubunits > 0) {
            resetBtnContainer.style.display = 'block';
        } else {
            resetBtnContainer.style.display = 'none';
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('subunitModal'));
        modal.show();

        // Add click handlers for completed/current subunits (KECUALI Part H & I yang locked)
        setTimeout(() => {
            const subunitItems = document.querySelectorAll('.subunit-item');
            subunitItems.forEach(item => {
                const index = parseInt(item.dataset.subunitIndex);
                const isLockedAssessment = item.classList.contains('locked-assessment');
                
                // Hanya yang completed/current DAN BUKAN locked-assessment yang bisa diklik
                if ((item.classList.contains('completed') || item.classList.contains('current')) && !isLockedAssessment) {
                    item.style.cursor = 'pointer';
                    
                    item.addEventListener('click', () => {
                        const url = subunitUrlTemplate.replace('999', index + 1);
                        console.log(`Navigating to Subunit: ${url}`);
                        window.location.href = url;
                    });

                    // Add hover effect
                    item.addEventListener('mouseenter', () => {
                        item.style.transform = 'translateX(8px)';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.transform = 'translateX(0)';
                    });
                } else if (isLockedAssessment) {
                    // Part H & I yang locked: tampilkan pesan
                    item.style.cursor = 'not-allowed';
                    item.addEventListener('click', () => {
                        showNotification('This assessment is locked. Use "Reset Progress" to restart the unit.', 'warning');
                    });
                }
            });
        }, 100);
    };

    /**
     * ✅ FUNGSI RESET PROGRESS
     */
    window.resetUnitProgress = function() {
        const unitId = document.getElementById('modalUnitNumber').textContent;
        const unitTitle = document.getElementById('subunitModalLabel').textContent;
        
        // Tampilkan konfirmasi
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal fade';
        confirmModal.id = 'resetConfirmModal';
        confirmModal.setAttribute('tabindex', '-1');
        confirmModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content" style="border-radius: 20px; overflow: hidden;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none;">
                        <h5 class="modal-title"><i class="fas fa-exclamation-triangle me-2"></i> Reset Progress Confirmation</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="padding: 2rem;">
                        <p style="font-size: 1.1rem; line-height: 1.8; color: #1f2937;">
                            Are you sure you want to reset your progress for <strong>${unitTitle}</strong>?
                        </p>
                        <ul style="color: #ef4444; font-weight: 600; line-height: 2;">
                            <li>All completed activities will be reset</li>
                            <li>All assessment scores will be deleted</li>
                            <li>You will start from Part A again</li>
                        </ul>
                        <p style="color: #6b7280; font-style: italic;">
                            This action cannot be undone.
                        </p>
                    </div>
                    <div class="modal-footer" style="border: none; padding: 1rem 2rem;">
                        <button type="button" class="btn btn-secondary-outline" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i> Cancel
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmResetBtn" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700;">
                            <i class="fas fa-redo me-2"></i> Yes, Reset Progress
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        const confirmModalInstance = new bootstrap.Modal(confirmModal);
        confirmModalInstance.show();
        
        // Handle reset button click
        document.getElementById('confirmResetBtn').addEventListener('click', async () => {
            const btn = document.getElementById('confirmResetBtn');
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Resetting...';
            
            try {
                const response = await fetch(`/learn/unit/${unitId}/reset_progress`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('Progress reset successfully!', 'success');
                    
                    // Close both modals
                    confirmModalInstance.hide();
                    bootstrap.Modal.getInstance(document.getElementById('subunitModal')).hide();
                    
                    // Reload page after animation
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    showNotification(result.message || 'Failed to reset progress', 'error');
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                }
            } catch (error) {
                console.error('Reset error:', error);
                showNotification('Failed to reset progress. Please try again.', 'error');
                btn.disabled = false;
                btn.innerHTML = originalHTML;
            }
        });
        
        // Clean up modal after close
        confirmModal.addEventListener('hidden.bs.modal', () => {
            confirmModal.remove();
        });
    };

    /**
     * ✅ FUNGSI NOTIFIKASI
     */
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

    /**
     * Stagger-load animation for course cards
     */
    const cards = document.querySelectorAll('.fade-in-up');

    if (cards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        cards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 100}ms`;
            observer.observe(card);
        });
    }

    /**
     * Keyboard accessibility for unit cards
     */
    const clickableImages = document.querySelectorAll('.unit-card-image[role="button"]');
    clickableImages.forEach(img => {
        img.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                img.click();
            }
        });
    });
});

// Add notification animations
const styles = document.createElement('style');
styles.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(styles);