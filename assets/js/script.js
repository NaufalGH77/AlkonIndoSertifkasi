document.addEventListener('DOMContentLoaded', function() {
    // Fungsionalitas Dropdown Menu pada Navbar
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    // Menggunakan event mouseenter/mouseleave untuk hover (lebih disukai di desktop)
    dropdown.addEventListener('mouseenter', function() {
        if (window.innerWidth > 768) {
            dropdownMenu.style.display = 'block';
        }
    });

    dropdown.addEventListener('mouseleave', function() {
        if (window.innerWidth > 768) {
            dropdownMenu.style.display = 'none';
        }
    });

    // Fungsionalitas untuk perangkat mobile (jika diklik)
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    dropdownToggle.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
             e.preventDefault(); 
             // Toggle display
             if (dropdownMenu.style.display === 'block') {
                dropdownMenu.style.display = 'none';
            } else {
                dropdownMenu.style.display = 'block';
            }
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clientItems = document.querySelectorAll('.client-logo-item');
    const allButton = document.querySelector('.filter-btn[data-category="all"]');

    // Fungsi utama untuk memfilter klien
    function filterClients(category) {
        // Objek untuk melacak kategori mana yang sudah ditampilkan (hanya dipakai saat category === 'all')
        const displayedCategories = {}; 

        clientItems.forEach(item => {
            const itemCategory = item.getAttribute('data-category');
            
            // Atur default display menjadi 'none'
            let shouldDisplay = false;

            // --- Logika 1: Ketika 'Semua Kategori' (all) dipilih ---
            if (category === 'all') {
                // Tampilkan HANYA logo pertama yang ditemui untuk setiap kategori
                if (!displayedCategories[itemCategory]) {
                    shouldDisplay = true;
                    displayedCategories[itemCategory] = true; // Tandai kategori ini sudah ditampilkan
                }
            } 
            // --- Logika 2: Ketika Kategori Spesifik dipilih ---
            else if (itemCategory === category) {
                // Tampilkan SEMUA item yang cocok dengan kategori yang diklik
                shouldDisplay = true;
            }

            // Terapkan properti display dan animasi
            if (shouldDisplay) {
                item.style.display = 'block';
                item.classList.add('fade-in'); 
                item.classList.remove('fade-out'); 
            } else {
                item.style.display = 'none';
                item.classList.add('fade-out'); 
                item.classList.remove('fade-in'); 
            }
        });
    }

    // Fungsi untuk mengelola tampilan tombol aktif (TIDAK BERUBAH)
    function setActiveButton(activeButton) {
        filterButtons.forEach(btn => {
            btn.classList.remove('primary-bg');
            btn.classList.remove('active-filter');
        });
        activeButton.classList.add('primary-bg');
        activeButton.classList.add('active-filter');
    }

    // Event Listener untuk setiap tombol filter (TIDAK BERUBAH)
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            setActiveButton(this);
            filterClients(category);
        });
    });

    // Panggil fungsi filter saat halaman dimuat (default: 'all')
    filterClients('all');
    setActiveButton(allButton);
});