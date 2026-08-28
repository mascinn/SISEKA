# SISEKA WASI'I
> **Sistem Informasi Setoran Sewa Kantin • BPH Masjid Al-Wasi'i**

Aplikasi web manajemen sewa kantin & pencatatan setoran harian modern berbasis **React 19 SPA**, **TailwindCSS**, **Node.js Express Serverless**, dan **Turso Cloud Database (LibSQL)**.

---

## 🏛️ Arsitektur & Teknologi

- **Frontend**: React 19, Vite, TailwindCSS Modern, Lucide Icons, Framer Motion.
- **Backend**: Express.js Serverless Function di Vercel (`/api/*`).
- **Database**: Turso Cloud (LibSQL over HTTPS) — Terdistribusi di AWS Tokyo, aman, cepat, dan stateless.
- **Integrasi**: Google Sheets Webhook API (sinkronisasi rekap tabel bulanan otomatis).
- **Design System**: *Ultra-Rounded Modern UI* — Emerald Green (`#064E3B`), Floating Island Docks, Skeleton Shimmer Waves.

---

## 🚀 Fitur Utama

1. **Dashboard Penarikan Kas Harian (Admin)**:
   - Pencatatan nominal setoran, metode Tunai/Transfer, status libur/tutup, dan koreksi data instan.
2. **Rekapitulasi Dwifungsi (Admin)**:
   - **Mode Per Bulan**: Akumulasi seluruh unit usaha pada bulan terpilih.
   - **Mode Per Kantin**: Histori lengkap kepatuhan sewa sepanjang tahun untuk tiap pedagang.
3. **Manajemen Master Unit Usaha (Admin)**:
   - Edit profil penyewa, no HP WhatsApp, tarif akad sewa, dan reset sandi pedagang.
4. **Portal Mitra Tenant / Pedagang**:
   - Pemantauan akumulasi sewa bulan berjalan, status setoran hari ini, dan rekap tahunan.
5. **Sinkronisasi Otomatis Google Spreadsheet**:
   - Background auto-sync dan jadwal harian jam 00:01 WIB ke Google Spreadsheet resmi.

---

## 👨‍💻 Pengembang

Dikembangkan oleh **Makhasin Muhammad** ([@mascinnn](https://github.com/mascinn)).
