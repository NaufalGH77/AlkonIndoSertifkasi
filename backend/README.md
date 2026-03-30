# Backend Setup (Express + PostgreSQL)

Backend ini menyimpan data dari form `penawaran` dan `kontak` ke PostgreSQL, serta menyediakan endpoint admin untuk melihat submission.

## 1) Prasyarat

- Node.js 18+
- PostgreSQL 14+

## 2) Buat database PostgreSQL

Contoh (psql):

```sql
CREATE DATABASE ais_db;
```

## 3) Konfigurasi environment

1. Duplikat file:

```bash
cp .env.example .env
```

2. Isi konfigurasi PostgreSQL terpisah di `.env`.

Contoh:

```env
PORT=3000
DB_USER=postgres
DB_PASS=postgres
DB_HOST=localhost
DB_NAME=ais_db
DB_PORT=5432
ADMIN_API_KEY=isi-kunci-admin-opsional
```

## 4) Install dependency dan jalankan server

```bash
npm install
npm run dev
```

Server akan berjalan di:

- `http://localhost:3000`

Frontend static juga diserve oleh backend ini, jadi halaman web dan API berada dalam origin yang sama.

## 5) Endpoint API

- `POST /api/penawaran` → simpan form penawaran
- `POST /api/kontak` → simpan form kontak
- `POST /api/admin/login` → login admin (email + password)
- `POST /api/admin/logout` → logout admin
- `GET /api/admin/submissions?type=penawaran|kontak` → baca data untuk admin
- `GET /api/health` → health check

Autentikasi admin bisa pakai salah satu metode:

- `Authorization: Bearer <token_dari_login>`
- `x-admin-key: <nilai ADMIN_API_KEY>` (opsional fallback)

## 6) Menambahkan Admin (Tanpa Halaman Publik)

Tidak perlu halaman register publik. Tambahkan admin via terminal server:

```bash
npm run create-admin -- --name="Admin Utama" --email="admin@contoh.com" --password="PasswordKuat123"
```

Script ini aman untuk internal karena hanya bisa dijalankan di server/repo, bukan dari browser user umum.

Skema tabel admin yang dipakai:

- `admin_users` (akun admin)
- `admin_sessions` (token sesi login admin)

## 7) Halaman admin

Akses:

- `http://localhost:3000/admin.html`

Fitur:

- Filter jenis form (`all`, `penawaran`, `kontak`)
- Refresh data
- Input API key admin (opsional, jika server diset)
