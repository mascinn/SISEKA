const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'siseka.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Gagal membuka database SQLite:', err.message);
  } else {
    console.log('✅ Terhubung ke database SQLite:', dbPath);
  }
});

// Helper run SQL with Promise
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Helper query all with Promise
function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper query single with Promise
function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Inisialisasi Tabel & Seed Data Awal
async function initDatabase() {
  try {
    // 1. Tabel Users
    await runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'tenant')),
        name TEXT NOT NULL,
        initials TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabel Kiosks (Master Data Kios)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS kiosks (
        id TEXT PRIMARY KEY,
        user_id INTEGER NULL,
        nama_kantin TEXT NULL,
        nama_penyewa TEXT NULL,
        nomor_hp TEXT NULL,
        tarif_sewa INTEGER NOT NULL DEFAULT 1000000,
        status TEXT NOT NULL DEFAULT 'aktif' CHECK(status IN ('aktif', 'kosong')),
        sejak TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // 3. Tabel Deposits (Setoran Harian)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS deposits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kiosk_id TEXT NOT NULL,
        tanggal TEXT NOT NULL,
        waktu TEXT NULL,
        nominal INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL CHECK(status IN ('setor', 'libur')),
        metode TEXT NULL,
        catatan TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kiosk_id) REFERENCES kiosks(id) ON DELETE CASCADE
      )
    `);

    // Cek apakah data awal sudah ada
    const userCount = await getAsync('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('🌱 Melakukan seeding data awal...');

      const salt = await bcrypt.genSalt(10);
      const hash1234 = await bcrypt.hash('1234', salt);

      // Seed Users
      const adminRes = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        ['admin', hash1234, 'admin', 'Admin BPH', 'AD']
      );

      const aminahRes = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        ['aminah', hash1234, 'tenant', 'Bu Aminah', 'BA']
      );

      const eniRes = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        ['eni', hash1234, 'tenant', 'Bude Eni', 'BE']
      );

      // Seed Kiosks (12 Kios)
      const kiosksData = [
        ['K-01', aminahRes.lastID, 'Kantin Berkah', 'Bu Aminah', '0812-3456-7890', 1000000, 'aktif', '2024'],
        ['K-02', null, null, null, null, 1000000, 'kosong', null],
        ['K-03', null, 'Warung Sehat', 'Siti Aminah', '0856-7890-1234', 1000000, 'aktif', '2025'],
        ['K-04', eniRes.lastID, 'Bude Eni', 'Bude Eni', '0813-1234-5678', 500000, 'aktif', '2024'],
        ['K-05', null, 'Bude Ghina', 'Bude Ghina', '0857-2345-6789', 500000, 'aktif', '2025'],
        ['K-06', null, 'Warung Tegal', 'Pak Tegal', '0821-3456-7890', 500000, 'aktif', '2024'],
        ['K-07', null, 'Minuman Segar', 'Mas Dika', '0878-4567-8901', 500000, 'aktif', '2025'],
        ['K-08', null, 'Kantin Bu Siti', 'Bu Siti', '0812-5678-9012', 1000000, 'aktif', '2024'],
        ['K-09', null, 'Snack Corner', 'Mbak Rina', '0856-6789-0123', 500000, 'aktif', '2025'],
        ['K-10', null, 'Warung Pak Joko', 'Pak Joko', '0813-7890-1234', 1000000, 'aktif', '2024'],
        ['K-11', null, 'Es Campur Mak Ijah', 'Mak Ijah', '0821-8901-2345', 500000, 'aktif', '2024'],
        ['K-12', null, 'Nasi Goreng Spesial', 'Pak Agus', '0878-9012-3456', 500000, 'aktif', '2025'],
      ];

      for (const k of kiosksData) {
        await runAsync(
          'INSERT INTO kiosks (id, user_id, nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status, sejak) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          k
        );
      }

      // Seed Setoran Hari Ini (Sample 17 Agustus 2026)
      const sampleDeposits = [
        ['K-01', '2026-08-17', '08:30', 50000, 'setor', 'Tunai', 'Setoran harian lancar'],
        ['K-04', '2026-08-17', '08:45', 50000, 'setor', 'Tunai', ''],
        ['K-05', '2026-08-17', '09:00', 50000, 'setor', 'Tunai', ''],
        ['K-03', '2026-08-17', '09:15', 50000, 'setor', 'Transfer', 'Transfer via BCA'],
        ['K-07', '2026-08-17', '09:30', 25000, 'setor', 'Tunai', ''],
        ['K-09', '2026-08-17', '09:45', 25000, 'setor', 'Tunai', ''],
        ['K-10', '2026-08-17', '10:00', 50000, 'setor', 'Tunai', ''],
        ['K-11', '2026-08-17', '10:15', 50000, 'setor', 'Tunai', ''],
        ['K-12', '2026-08-17', '10:30', 50000, 'setor', 'Tunai', ''],
        ['K-08', '2026-08-17', '10:45', 50000, 'setor', 'Tunai', ''],
        ['K-06', '2026-08-17', null, 0, 'libur', null, 'Izin ada acara keluarga'],
      ];

      for (const d of sampleDeposits) {
        await runAsync(
          'INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) VALUES (?, ?, ?, ?, ?, ?, ?)',
          d
        );
      }

      console.log('✅ Seeding data selesai!');
    }
  } catch (error) {
    console.error('❌ Error inisialisasi database:', error);
  }
}

module.exports = {
  db,
  initDatabase,
  runAsync,
  allAsync,
  getAsync,
};
