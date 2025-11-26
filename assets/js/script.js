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
    const clientItems = document.querySelectorAll('.client-logo-item');
    const allButton = document.querySelector('.filter-btn[data-category="all"]');

    /**
     * Fungsi utama untuk memfilter klien.
     * Logika: Jika kategori 'all' dipilih, tampilkan HANYA satu logo per jenis kategori unik.
     * Jika kategori spesifik dipilih, tampilkan SEMUA logo yang cocok.
     */
    function filterClients(category) {
        const displayedCategories = {}; 

        clientItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            
            let shouldDisplay = false;

            // Logika 1: Ketika 'Semua Kategori' (all) dipilih
            if (category === 'all') {
                // Pastikan itemCategory memiliki nilai dan belum ditampilkan
                if (itemCategory && !displayedCategories[itemCategory]) {
                    shouldDisplay = true;
                    displayedCategories[itemCategory] = true; // Tandai kategori ini sudah ditampilkan
                }
            } 
            // Logika 2: Ketika Kategori Spesifik dipilih
            else if (itemCategory === category) {
                shouldDisplay = true; // Tampilkan SEMUA item yang cocok
            }

            // Terapkan properti display dan animasi
            if (shouldDisplay) {
                // Tunda sedikit untuk animasi CSS
                setTimeout(() => {
                    item.style.display = 'block';
                    item.classList.add('fade-in'); 
                    item.classList.remove('fade-out'); 
                }, 10); 
            } else {
                item.classList.add('fade-out'); 
                item.classList.remove('fade-in'); 
                // Sembunyikan setelah animasi fade-out selesai
                setTimeout(() => {
                    item.style.display = 'none';
                }, 500); // Harus sinkron dengan durasi transisi di CSS
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
});