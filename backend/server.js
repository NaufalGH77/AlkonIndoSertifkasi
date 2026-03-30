const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const DB_USER = (process.env.DB_USER || '').trim();
const DB_PASS = (process.env.DB_PASS || '').trim();
const DB_HOST = (process.env.DB_HOST || '').trim();
const DB_NAME = (process.env.DB_NAME || '').trim();
const DB_PORT = Number(process.env.DB_PORT || 5432);
const ADMIN_API_KEY = (process.env.ADMIN_API_KEY || '').trim();
const ADMIN_SESSION_HOURS = Number(process.env.ADMIN_SESSION_HOURS || 12);

if (!DB_USER || !DB_PASS || !DB_HOST || !DB_NAME || Number.isNaN(DB_PORT)) {
    throw new Error('Konfigurasi DB belum lengkap. Isi DB_USER, DB_PASS, DB_HOST, DB_NAME, dan DB_PORT di backend/.env.');
}

const pool = new Pool({
    user: DB_USER,
    password: DB_PASS,
    host: DB_HOST,
    database: DB_NAME,
    port: DB_PORT
});

app.use(cors());
app.use(express.json());

const projectRoot = path.resolve(__dirname, '..');
app.use(express.static(projectRoot));

async function initDatabase() {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schemaSql);
}

function sanitizeString(value) {
    if (typeof value !== 'string') return null;
    const cleaned = value.trim();
    return cleaned.length ? cleaned : null;
}

function normalizeEmail(value) {
    const cleaned = sanitizeString(value);
    return cleaned ? cleaned.toLowerCase() : null;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const key = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${key}`;
}

function verifyPassword(password, passwordHash) {
    if (!passwordHash || typeof passwordHash !== 'string') return false;

    const parts = passwordHash.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

    const salt = parts[1];
    const expectedKeyHex = parts[2];
    const actualKeyHex = crypto.scryptSync(password, salt, 64).toString('hex');

    const expectedBuffer = Buffer.from(expectedKeyHex, 'hex');
    const actualBuffer = Buffer.from(actualKeyHex, 'hex');

    if (expectedBuffer.length !== actualBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function getBearerToken(req) {
    const authHeader = (req.header('authorization') || '').trim();
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
        return null;
    }
    return authHeader.slice(7).trim() || null;
}

async function findActiveAdminSession(token) {
    const tokenHash = hashToken(token);
    const query = `
        SELECT
            s.id AS session_id,
            u.id AS admin_id,
            u.full_name,
            u.email,
            u.role
        FROM admin_sessions s
        JOIN admin_users u ON u.id = s.admin_user_id
        WHERE s.token_hash = $1
          AND s.revoked_at IS NULL
          AND s.expires_at > NOW()
          AND u.is_active = TRUE
        LIMIT 1
    `;

    const result = await pool.query(query, [tokenHash]);
    return result.rows[0] || null;
}

async function adminAuthMiddleware(req, res, next) {
    try {
        const providedKey = (req.header('x-admin-key') || '').trim();

        if (ADMIN_API_KEY && providedKey && providedKey === ADMIN_API_KEY) {
            req.admin = {
                admin_id: 0,
                full_name: 'API Key Admin',
                email: null,
                role: 'admin'
            };
            return next();
        }

        const bearerToken = getBearerToken(req);
        if (!bearerToken) {
            return res.status(401).json({
                success: false,
                message: 'Silakan login admin terlebih dahulu.'
            });
        }

        const session = await findActiveAdminSession(bearerToken);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Sesi admin tidak valid atau sudah kedaluwarsa.'
            });
        }

        req.admin = session;
        req.adminSessionId = session.session_id;
        return next();
    } catch (error) {
        console.error('Error validasi auth admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat validasi admin.'
        });
    }
}

app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'API berjalan dengan baik.'
    });
});

app.post('/api/penawaran', async (req, res) => {
    const namaPerusahaan = sanitizeString(req.body['nama-perusahaan']) || sanitizeString(req.body.namaPerusahaan);
    const email = sanitizeString(req.body.email);
    const telepon = sanitizeString(req.body.telepon);
    const layanan = sanitizeString(req.body.layanan);
    const pesan = sanitizeString(req.body.pesan);

    if (!namaPerusahaan || !email || !telepon || !layanan) {
        return res.status(400).json({
            success: false,
            message: 'Field wajib penawaran belum lengkap.'
        });
    }

    try {
        const query = `
            INSERT INTO form_submissions (
                form_type,
                nama_perusahaan,
                email,
                telepon,
                layanan,
                pesan,
                source_page,
                metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, created_at
        `;

        const values = [
            'penawaran',
            namaPerusahaan,
            email,
            telepon,
            layanan,
            pesan,
            'penawaran',
            {}
        ];

        const result = await pool.query(query, values);

        return res.status(201).json({
            success: true,
            message: 'Penawaran berhasil disimpan.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error menyimpan penawaran:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menyimpan penawaran.'
        });
    }
});

app.post('/api/kontak', async (req, res) => {
    const nama = sanitizeString(req.body.nama);
    const email = sanitizeString(req.body.email);
    const telepon = sanitizeString(req.body.telepon);
    const subjek = sanitizeString(req.body.subjek);
    const pesan = sanitizeString(req.body.pesan);

    if (!nama || !email || !subjek || !pesan) {
        return res.status(400).json({
            success: false,
            message: 'Field wajib kontak belum lengkap.'
        });
    }

    try {
        const query = `
            INSERT INTO form_submissions (
                form_type,
                nama,
                email,
                telepon,
                subjek,
                pesan,
                source_page,
                metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, created_at
        `;

        const values = ['kontak', nama, email, telepon, subjek, pesan, 'kontak', {}];
        const result = await pool.query(query, values);

        return res.status(201).json({
            success: true,
            message: 'Pesan kontak berhasil disimpan.',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error menyimpan kontak:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat menyimpan pesan kontak.'
        });
    }
});

app.post('/api/admin/login', async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const password = sanitizeString(req.body.password);

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email dan password wajib diisi.'
        });
    }

    try {
        const userResult = await pool.query(
            `
                SELECT id, full_name, email, password_hash, role, is_active
                FROM admin_users
                WHERE email = $1
                LIMIT 1
            `,
            [email]
        );

        const adminUser = userResult.rows[0];
        if (!adminUser || !adminUser.is_active || !verifyPassword(password, adminUser.password_hash)) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah.'
            });
        }

        const rawToken = crypto.randomBytes(48).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + ADMIN_SESSION_HOURS * 60 * 60 * 1000);

        const sessionResult = await pool.query(
            `
                INSERT INTO admin_sessions (
                    admin_user_id,
                    token_hash,
                    user_agent,
                    created_ip,
                    expires_at
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, expires_at
            `,
            [
                adminUser.id,
                tokenHash,
                sanitizeString(req.header('user-agent')),
                sanitizeString(req.ip),
                expiresAt
            ]
        );

        await pool.query(
            `
                UPDATE admin_users
                SET last_login_at = NOW(), updated_at = NOW()
                WHERE id = $1
            `,
            [adminUser.id]
        );

        return res.json({
            success: true,
            message: 'Login admin berhasil.',
            data: {
                token: rawToken,
                expires_at: sessionResult.rows[0].expires_at,
                admin: {
                    id: adminUser.id,
                    full_name: adminUser.full_name,
                    email: adminUser.email,
                    role: adminUser.role
                }
            }
        });
    } catch (error) {
        console.error('Error login admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat login admin.'
        });
    }
});

app.post('/api/admin/logout', adminAuthMiddleware, async (req, res) => {
    if (!req.adminSessionId) {
        return res.json({
            success: true,
            message: 'Logout selesai.'
        });
    }

    try {
        await pool.query(
            `
                UPDATE admin_sessions
                SET revoked_at = NOW()
                WHERE id = $1
            `,
            [req.adminSessionId]
        );

        return res.json({
            success: true,
            message: 'Logout admin berhasil.'
        });
    } catch (error) {
        console.error('Error logout admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat logout admin.'
        });
    }
});

app.get('/api/admin/submissions', adminAuthMiddleware, async (req, res) => {
    const allowedTypes = ['penawaran', 'kontak'];
    const type = sanitizeString(req.query.type);

    let query = `
        SELECT
            id,
            form_type,
            nama_perusahaan,
            nama,
            email,
            telepon,
            layanan,
            subjek,
            pesan,
            source_page,
            created_at
        FROM form_submissions
    `;

    const values = [];

    if (type && allowedTypes.includes(type)) {
        values.push(type);
        query += ' WHERE form_type = $1';
    }

    query += ' ORDER BY created_at DESC LIMIT 200';

    try {
        const result = await pool.query(query, values);
        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error mengambil data admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat mengambil data.'
        });
    }
});

app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: 'Endpoint API tidak ditemukan.'
        });
    }

    return res.sendFile(path.join(projectRoot, 'index.html'));
});

initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server berjalan di http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Gagal inisialisasi database:', error);
        process.exit(1);
    });
