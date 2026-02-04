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
});