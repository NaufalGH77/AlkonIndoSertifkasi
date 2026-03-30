const crypto = require('crypto');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const DB_USER = (process.env.DB_USER || '').trim();
const DB_PASS = (process.env.DB_PASS || '').trim();
const DB_HOST = (process.env.DB_HOST || '').trim();
const DB_NAME = (process.env.DB_NAME || '').trim();
const DB_PORT = Number(process.env.DB_PORT || 5432);

if (!DB_USER || !DB_PASS || !DB_HOST || !DB_NAME || Number.isNaN(DB_PORT)) {
    console.error('Konfigurasi DB belum lengkap di .env');
    process.exit(1);
}

const pool = new Pool({
    user: DB_USER,
    password: DB_PASS,
    host: DB_HOST,
    database: DB_NAME,
    port: DB_PORT
});

function getArg(name) {
    const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
    if (!arg) return null;
    return arg.slice(name.length + 3).trim() || null;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const key = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${key}`;
}

async function createAdmin() {
    const fullName = getArg('name');
    const emailArg = getArg('email');
    const password = getArg('password');

    const email = emailArg ? emailArg.toLowerCase() : null;

    if (!fullName || !email || !password) {
        console.error('Pemakaian: npm run create-admin -- --name="Nama Admin" --email="admin@mail.com" --password="PasswordKuat"');
        process.exit(1);
    }

    const passwordHash = hashPassword(password);

    const query = `
        INSERT INTO admin_users (full_name, email, password_hash)
        VALUES ($1, $2, $3)
        ON CONFLICT (email)
        DO UPDATE SET
            full_name = EXCLUDED.full_name,
            password_hash = EXCLUDED.password_hash,
            is_active = TRUE,
            updated_at = NOW()
        RETURNING id, full_name, email, role, is_active
    `;

    const result = await pool.query(query, [fullName, email, passwordHash]);
    console.log('Admin berhasil dibuat/diupdate:');
    console.log(result.rows[0]);
}

createAdmin()
    .catch((error) => {
        console.error('Gagal membuat admin:', error.message);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
    });
