document.addEventListener('DOMContentLoaded', function () {
    const API_CONFIG = window.AIS_API_CONFIG || {};
    const API_BASE_URL = (API_CONFIG.baseUrl || '').toString().trim();
    const ADMIN_TOKEN_KEY = 'ais_admin_token';
    const ADMIN_USER_KEY = 'ais_admin_user';

    const typeSelect = document.getElementById('submission-type');
    const refreshButton = document.getElementById('refresh-button');
    const logoutButton = document.getElementById('logout-button');
    const sessionLabel = document.getElementById('admin-session');
    const feedback = document.getElementById('admin-feedback');
    const tableBody = document.getElementById('submission-body');

    function getAdminToken() {
        return (localStorage.getItem(ADMIN_TOKEN_KEY) || '').trim();
    }

    function getAdminUser() {
        const raw = localStorage.getItem(ADMIN_USER_KEY);
        if (!raw) return null;

        try {
            return JSON.parse(raw);
        } catch (_error) {
            return null;
        }
    }

    function clearAdminSession() {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
    }

    function redirectToLogin() {
        window.location.href = 'admin-login.html';
    }

    function ensureAuthenticated() {
        const token = getAdminToken();
        if (!token) {
            redirectToLogin();
            return false;
        }
        return true;
    }

    function updateSessionLabel() {
        if (!sessionLabel) return;

        const adminUser = getAdminUser();
        if (adminUser && (adminUser.full_name || adminUser.email)) {
            sessionLabel.textContent = `Login: ${adminUser.full_name || adminUser.email}`;
            return;
        }

        sessionLabel.textContent = 'Login: Admin';
    }

    function setFeedback(message, isError = false) {
        if (!feedback) return;

        feedback.textContent = message;
        feedback.classList.remove('hidden');

        if (isError) {
            feedback.classList.add('is-error');
        } else {
            feedback.classList.remove('is-error');
        }
    }

    function clearFeedback() {
        if (!feedback) return;
        feedback.classList.add('hidden');
        feedback.textContent = '';
        feedback.classList.remove('is-error');
    }

    function buildApiUrl(endpoint) {
        if (!endpoint) return '';
        if (/^https?:\/\//i.test(endpoint)) return endpoint;

        if (!API_BASE_URL) return endpoint;

        const cleanBase = API_BASE_URL.replace(/\/$/, '');
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${cleanBase}${cleanEndpoint}`;
    }

    function renderRows(items) {
        if (!tableBody) return;

        if (!items.length) {
            tableBody.innerHTML = '<tr><td colspan="10" class="admin-empty">Belum ada data submission.</td></tr>';
            return;
        }

        tableBody.innerHTML = items.map(function (item) {
            const waktu = new Date(item.created_at).toLocaleString('id-ID');
            return `
                <tr>
                    <td>${item.id}</td>
                    <td>${waktu}</td>
                    <td>${item.form_type || '-'}</td>
                    <td>${item.nama_perusahaan || '-'}</td>
                    <td>${item.nama || '-'}</td>
                    <td>${item.email || '-'}</td>
                    <td>${item.telepon || '-'}</td>
                    <td>${item.layanan || '-'}</td>
                    <td>${item.subjek || '-'}</td>
                    <td>${item.pesan || '-'}</td>
                </tr>
            `;
        }).join('');
    }

    async function loadSubmissions() {
        if (!tableBody) return;

        if (!ensureAuthenticated()) return;

        const selectedType = (typeSelect && typeSelect.value) || 'all';
        const params = new URLSearchParams();

        if (selectedType !== 'all') {
            params.set('type', selectedType);
        }

        const endpoint = `/api/admin/submissions${params.toString() ? `?${params.toString()}` : ''}`;
        const url = buildApiUrl(endpoint);
        const token = getAdminToken();
        const headers = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        tableBody.innerHTML = '<tr><td colspan="10" class="admin-empty">Memuat data...</td></tr>';
        clearFeedback();

        try {
            const response = await fetch(url, { headers });
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    clearAdminSession();
                    redirectToLogin();
                    return;
                }

                throw new Error(result.message || 'Gagal memuat data admin.');
            }

            renderRows(Array.isArray(result.data) ? result.data : []);
            setFeedback('Data berhasil dimuat.');
        } catch (error) {
            renderRows([]);
            setFeedback(error.message || 'Terjadi kesalahan saat mengambil data.', true);
        }
    }

    async function logoutAdmin() {
        const token = getAdminToken();
        if (!token) {
            redirectToLogin();
            return;
        }

        const url = buildApiUrl('/api/admin/logout');
        try {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (_error) {
            // Tetap lanjut clear session agar user bisa keluar meskipun request logout gagal.
        }

        clearAdminSession();
        redirectToLogin();
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', loadSubmissions);
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', loadSubmissions);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', logoutAdmin);
    }

    if (!ensureAuthenticated()) return;

    updateSessionLabel();
    loadSubmissions();
});
