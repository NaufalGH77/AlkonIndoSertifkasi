document.addEventListener('DOMContentLoaded', function () {
    const API_CONFIG = window.AIS_API_CONFIG || {};
    const API_BASE_URL = (API_CONFIG.baseUrl || '').toString().trim();
    const ADMIN_TOKEN_KEY = 'ais_admin_token';
    const ADMIN_USER_KEY = 'ais_admin_user';

    const loginForm = document.getElementById('admin-login-form');
    const feedback = document.getElementById('admin-login-feedback');

    function setFeedback(message, isError) {
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

        feedback.textContent = '';
        feedback.classList.add('hidden');
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

    function saveSession(token, adminUser) {
        localStorage.setItem(ADMIN_TOKEN_KEY, token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser || {}));
    }

    function hasValidSession() {
        const token = (localStorage.getItem(ADMIN_TOKEN_KEY) || '').trim();
        return Boolean(token);
    }

    async function handleLoginSubmit(event) {
        event.preventDefault();
        clearFeedback();

        if (!loginForm) return;

        const formData = new FormData(loginForm);
        const email = (formData.get('email') || '').toString().trim();
        const password = (formData.get('password') || '').toString();

        if (!email || !password) {
            setFeedback('Email dan password wajib diisi.', true);
            return;
        }

        const submitButton = loginForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Memproses...';
        }

        try {
            const response = await fetch(buildApiUrl('/api/admin/login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login gagal.');
            }

            const token = result && result.data ? result.data.token : null;
            const adminUser = result && result.data ? result.data.admin : null;

            if (!token) {
                throw new Error('Token login tidak tersedia.');
            }

            saveSession(token, adminUser);
            setFeedback('Login berhasil. Mengarahkan ke dashboard...');

            window.setTimeout(function () {
                window.location.href = 'admin.html';
            }, 450);
        } catch (error) {
            const isNetworkError = error && error.message && error.message.toLowerCase().includes('failed to fetch');
            if (isNetworkError) {
                setFeedback('Tidak bisa terhubung ke backend. Pastikan server API aktif di http://localhost:5001.', true);
            } else {
                setFeedback(error.message || 'Terjadi kesalahan saat login.', true);
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        }
    }

    if (hasValidSession()) {
        window.location.href = 'admin.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
});
