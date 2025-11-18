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

            let statusClass = 'locked';
            let statusBadgeClass = 'locked';
            let statusText = 'Locked';
            let iconContent = `<i class="fas fa-lock"></i>`;

            if (isCompleted) {
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
                                ${isCompleted ? '<i class="fas fa-check-circle me-1"></i>' : ''}
                                ${isCurrent ? '<i class="fas fa-play-circle me-1"></i>' : ''}
                                ${isLocked ? '<i class="fas fa-lock me-1"></i>' : ''}
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
            // --- PERUBAHAN DI SINI ---
            // Mengganti teks tombol berdasarkan progres
            if (completedSubunits > 0) {
                startBtn.innerHTML = `<i class="fas fa-ship me-2"></i> Continue Sailing`;
            } else {
                startBtn.innerHTML = `<i class="fas fa-ship me-2"></i> Start Voyage`;
            }
            startBtn.disabled = false;
            
            // Menggunakan URL yang benar (introductionUrl)
            startBtn.onclick = () => {
                const url = introductionUrl; // <-- URL yang Anda inginkan
                console.log(`Navigating to Unit Introduction: ${url}`);
                window.location.href = url; // <-- Navigasi sebenarnya
            };
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('subunitModal'));
        modal.show();

        // Add click handlers for completed/current subunits
        setTimeout(() => {
            const subunitItems = document.querySelectorAll('.subunit-item.completed, .subunit-item.current');
            subunitItems.forEach(item => {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    const index = parseInt(item.dataset.subunitIndex);
                    const subunit = subunitsData[index];
                    
                    // --- PERUBAHAN DI SINI ---
                    // Menggunakan subunitUrlTemplate untuk membuat URL yang benar
                    const url = subunitUrlTemplate.replace('999', index + 1);
                    
                    console.log(`Navigating to Subunit: ${url}`);
                    window.location.href = url; // <-- Navigasi sebenarnya
                });

                // Add hover effect
                item.addEventListener('mouseenter', () => {
                    if (!item.classList.contains('locked')) {
                        item.style.transform = 'translateX(8px)';
                    }
                });
                item.addEventListener('mouseleave', () => {
                    item.style.transform = 'translateX(0)';
                });
            });
        }, 100);
    };

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