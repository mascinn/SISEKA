# SISEKA WASI'I
> **Sistem Informasi Setoran Sewa Kantin • BPH Masjid Al-Wasi'i**

Aplikasi manajemen sewa kantin & pencatatan setoran harian berbasis web yang super ringan, cepat, dan modern. Dibangun menggunakan arsitektur **Vanilla HTML/CSS/JS** pada sisi Frontend dan **Node.js (Express.js) + SQLite** pada sisi Backend.

---

## 🏛️ Arsitektur & Tech Stack

- **Frontend**: Vanilla HTML5, Modern CSS (Design System Tokens + Glassmorphism), Vanilla JavaScript (No heavy frameworks / 0KB bundle overhead).
- **Backend**: Node.js, Express.js, CORS, JSON Web Token (JWT), BcryptJS.
- **Database**: SQLite3 (`backend/siseka.db`) — Serverless, portable, 0-configuration, & lightweight.
- **Design System**: *Clean Islamic Modern • Institutional FinTech* (Deep Emerald Green `#003820`, Mint `#ECFDF5`, Warm Gold `#FE932C`).

---

## 📂 Struktur Project

```
UI-SISEKA/
├── backend/
│   ├── database.js               # Inisialisasi tabel SQLite & Seeding data awal
│   ├── server.js                 # Express server & API routes mount
│   ├── package.json              # Backend dependencies (express, sqlite3, bcrypt, jwt)
│   ├── middleware/
│   │   └── auth.js               # JWT authentication & role-based authorization
│   └── routes/
│       ├── auth.js               # Endpoint login & session user aktif
│       ├── kiosks.js             # CRUD master data kios & reset PIN
│       ├── deposits.js           # Pencatatan setoran harian & status hari ini
│       └── recap.js              # Perhitungan rekapitulasi bulanan & status sewa
│
├── frontend/
│   ├── index.html                # Auto-redirect ke login/dashboard
│   ├── login.html                # Halaman login modern dengan demo selector
│   ├── css/
│   │   └── styles.css            # Complete design system tokens & glass panels
│   ├── js/
│   │   ├── app.js                # Core auth, API caller, formatters, utilities
│   │   └── components.js         # Bottom sheets, filter chips, modal animators
│   ├── admin/
│   │   ├── penarikan.html        # Dashboard penarikan harian & WA broadcast
│   │   ├── rekap.html            # Rekap semua kantin bulanan (Surplus/Kurang)
│   │   ├── rekap-detail.html     # Rincian setoran harian per kios
│   │   └── kantin.html           # Kelola master kios (Tambah/Edit/Reset PIN)
│   └── tenant/
│       ├── beranda.html          # Dashboard penyewa (Akumulasi & status hari ini)
│       ├── rekap.html            # Histori kartu performa bulanan
│       ├── rekap-detail.html     # Rincian harian kalender sewa bulanan
│       └── profil.html           # Informasi akad sewa & pusat bantuan BPH
│
└── README.md
```

---

## 🚀 Cara Menjalankan Aplikasi

### 1. Menjalankan Backend API
1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Jalankan server:
   ```bash
   node server.js
   ```
   *Server akan berjalan di `http://localhost:5000` dan otomatis membuat database `siseka.db`.*

### 2. Membuka Frontend
Cukup buka file `frontend/login.html` langsung di browser Anda (atau gunakan Live Server di VS Code):
```
d:\Project\me\UI-SISEKA\frontend\login.html
```

---

## 👥 Akun Login Demo

| Role | Username | Password | Akses Halaman |
|---|---|---|---|
| **Admin BPH (Kolektor)** | `admin` | `1234` | Penarikan Harian, Rekap Semua, Kelola Kantin |
| **Tenant (Bu Aminah)** | `aminah` | `1234` | Beranda Kios, Rekap Bulanan, Profil & Akad |
| **Tenant (Bude Eni)** | `eni` | `1234` | Beranda Kios, Rekap Bulanan, Profil & Akad |

---

## 📡 Daftar Endpoint REST API

### Autentikasi (`/api/auth`)
- `POST /api/auth/login` — Login username & password (menghasilkan JWT token).
- `GET /api/auth/me` — Cek data user dan kios aktif dari session token.

### Master Kios (`/api/kiosks`)
- `GET /api/kiosks` — Mengambil seluruh daftar kios (support pencarian `?q=...`).
- `GET /api/kiosks/:id` — Mengambil detail 1 kios.
- `POST /api/kiosks` — Menambah kios baru (*Admin only*).
- `PUT /api/kiosks/:id` — Mengubah info kios & penyewa (*Admin only*).
- `POST /api/kiosks/:id/reset-pin` — Mereset PIN login akun kios (*Admin only*).

### Setoran Harian (`/api/deposits`)
- `GET /api/deposits/today` — Rekap setoran hari ini (kios setor, libur, belum dicatat).
- `POST /api/deposits` — Mencatat setoran baru / libur (*Admin only*).
- `PUT /api/deposits/:id` — Mengoreksi nominal setoran (*Admin only*).
- `GET /api/deposits/tenant/current` — Dashboard akumulasi bulan ini khusus tenant login.

### Rekapitulasi Keuangan (`/api/recap`)
- `GET /api/recap/admin/monthly?month=YYYY-MM` — Rekap bulanan seluruh kios (*Admin only*).
- `GET /api/recap/admin/kiosk/:id?month=YYYY-MM` — Detail harian 1 kios (*Admin only*).
- `GET /api/recap/tenant/monthly-history?year=YYYY` — Histori rekap tahunan tenant.
- `GET /api/recap/tenant/month-detail?month=YYYY-MM` — Rincian 1 bulan penuh tenant.
