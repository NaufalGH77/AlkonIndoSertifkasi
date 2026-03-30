document.addEventListener('DOMContentLoaded', function() {
    
    /* ========================================================= */
    /* === 1. Fungsionalitas NAVBAR (Dropdown & Hamburger) === */
    /* ========================================================= */

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const mobileBreakpoint = 900; // Sesuaikan dengan media query CSS untuk hamburger/mobile

    // --- A. Hamburger Menu Toggle ---
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Tutup dropdown saat menu utama ditutup
            if (!navLinks.classList.contains('active') && dropdownMenu) {
                 dropdownMenu.style.display = 'none';
            }
        });
    }

    // --- B. Dropdown Menu (Desktop Hover) ---
    if (dropdown && dropdownMenu) {
        // Menggunakan event mouseenter/mouseleave untuk hover (desktop)
        dropdown.addEventListener('mouseenter', function() {
            if (window.innerWidth > mobileBreakpoint) {
                dropdownMenu.style.display = 'block';
            }
        });

        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > mobileBreakpoint) {
                dropdownMenu.style.display = 'none';
            }
        });

        // --- C. Dropdown Menu (Mobile Click/Tap) ---
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', function(e) {
                if (window.innerWidth <= mobileBreakpoint) {
                     e.preventDefault(); 
                     // Toggle display
                     if (dropdownMenu.style.display === 'block') {
                         dropdownMenu.style.display = 'none';
                     } else {
                         dropdownMenu.style.display = 'block';
                     }
                }
            });
        }
    }


    /* ========================================================= */
    /* === 2. Fungsionalitas Filter Klien (Halaman Clients) === */
    /* ========================================================= */
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clientCategories = document.querySelectorAll('.client-category');
    const allButton = document.querySelector('.filter-btn[data-category="all"]');

    /**
     * Fungsi utama untuk memfilter klien.
     */
    function filterClients(category) {
        clientCategories.forEach(categoryDiv => {
            const categoryName = categoryDiv.getAttribute('data-category');
            
            let shouldDisplay = false;

            if (category === 'all') {
                shouldDisplay = true;
            } else if (categoryName === category) {
                shouldDisplay = true;
            }

            if (shouldDisplay) {
                setTimeout(() => {
                    categoryDiv.classList.add('active');
                    categoryDiv.classList.remove('fade-out'); 
                }, 10);
            } else {
                categoryDiv.classList.remove('active');
                categoryDiv.classList.add('fade-out');
            }
        });
    }

    // Fungsi untuk mengelola tampilan tombol aktif
    function setActiveButton(activeButton) {
        filterButtons.forEach(btn => {
            btn.classList.remove('primary-bg');
            btn.classList.remove('active-filter');
        });
        activeButton.classList.add('primary-bg');
        activeButton.classList.add('active-filter');
    }

    // Event Listener untuk setiap tombol filter
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            setActiveButton(this);
            filterClients(category);
        });
    });

    // Panggil fungsi filter saat halaman dimuat (default: 'all')
    if (allButton) {
        filterClients('all');
        setActiveButton(allButton);
    }

    /* ========================================================= */
    /* === 3. Certificate Modal Functionality === */
    /* ========================================================= */
    
    const certificateModal = document.getElementById('certificateModal');
    const closeModalBtn = document.querySelector('.close-modal');
    
    // Function to open certificate modal
    window.openCertificateModal = function(element) {
        const img = element.querySelector('img');
        const caption = element.querySelector('p');
        const modalImage = document.getElementById('modalCertificateImage');
        const modalCaption = document.getElementById('modalCertificateCaption');
        
        if (img && caption) {
            modalImage.src = img.src;
            modalImage.alt = img.alt;
            modalCaption.textContent = caption.textContent;
            certificateModal.style.display = 'block';
        }
    };
    
    // Close modal when X button is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            certificateModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside the modal content
    if (certificateModal) {
        certificateModal.addEventListener('click', function(event) {
            if (event.target === certificateModal) {
                certificateModal.style.display = 'none';
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && certificateModal) {
            certificateModal.style.display = 'none';
        }
    });

    /* ========================================================= */
    /* === 4. Integrasi Form ke Backend API ==================== */
    /* ========================================================= */

    const API_CONFIG = window.AIS_API_CONFIG || {};
    const API_BASE_URL = (API_CONFIG.baseUrl || '').toString().trim();

    function buildApiUrl(endpoint) {
        if (!endpoint) return '';
        if (/^https?:\/\//i.test(endpoint)) return endpoint;

        if (!API_BASE_URL) return endpoint;

        const cleanBase = API_BASE_URL.replace(/\/$/, '');
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${cleanBase}${cleanEndpoint}`;
    }

    function ensureFeedbackElement(form) {
        let feedbackElement = form.querySelector('.form-success');
        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'form-success hidden';
            form.appendChild(feedbackElement);
        }
        return feedbackElement;
    }

    function showFormFeedback(form, message, type = 'success') {
        const feedbackElement = ensureFeedbackElement(form);
        feedbackElement.textContent = message;
        feedbackElement.classList.remove('hidden');

        if (type === 'error') {
            feedbackElement.classList.add('is-error');
        } else {
            feedbackElement.classList.remove('is-error');
        }
    }

    async function submitFormToBackend(form, payload, options = {}) {
        const endpoint =
            (form.getAttribute('data-endpoint') || '').trim() ||
            options.defaultEndpoint ||
            (form.getAttribute('action') || '').trim();

        if (!endpoint) {
            throw new Error('Endpoint backend belum dikonfigurasi untuk form ini.');
        }

        const submitButton = form.querySelector('button[type="submit"]');
        const initialButtonLabel = submitButton ? submitButton.textContent : '';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Mengirim...';
        }

        try {
            let response;
            try {
                response = await fetch(buildApiUrl(endpoint), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
            } catch (_networkError) {
                throw new Error('Tidak bisa terhubung ke backend. Pastikan server API aktif di http://localhost:5001.');
            }

            let responseData = null;
            try {
                responseData = await response.json();
            } catch (_error) {
                responseData = null;
            }

            if (!response.ok) {
                const errorMessage =
                    (responseData && responseData.message) ||
                    `Gagal mengirim data (${response.status})`;
                throw new Error(errorMessage);
            }

            showFormFeedback(form, options.successMessage || 'Data berhasil dikirim.', 'success');
            form.reset();
            return responseData;
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = initialButtonLabel;
            }
        }
    }

    /* ========================================================= */
    /* === 5. Submit Form Penawaran ke Backend ================= */
    /* ========================================================= */

    const penawaranForm = document.getElementById('penawaran-form');

    if (penawaranForm) {
        penawaranForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const formData = new FormData(penawaranForm);
            const payload = Object.fromEntries(formData.entries());

            payload.formType = 'penawaran';
            payload.sourcePage = 'penawaran';

            try {
                await submitFormToBackend(penawaranForm, payload, {
                    defaultEndpoint: '/api/penawaran',
                    successMessage: 'Terima kasih! Kami akan menghubungi Anda segera.'
                });
            } catch (error) {
                showFormFeedback(
                    penawaranForm,
                    (error && error.message) || 'Terjadi kesalahan saat mengirim penawaran.',
                    'error'
                );
            }
        });
    }

    /* ========================================================= */
    /* === 6. Submit Form Kontak ke Backend ==================== */
    /* ========================================================= */

    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const formData = new FormData(contactForm);
            const payload = Object.fromEntries(formData.entries());

            payload.formType = 'kontak';
            payload.sourcePage = 'kontak';

            try {
                await submitFormToBackend(contactForm, payload, {
                    defaultEndpoint: '/api/kontak',
                    successMessage: 'Pesan berhasil dikirim. Tim kami akan segera merespons.'
                });
            } catch (error) {
                showFormFeedback(
                    contactForm,
                    (error && error.message) || 'Terjadi kesalahan saat mengirim pesan.',
                    'error'
                );
            }
        });
    }
});