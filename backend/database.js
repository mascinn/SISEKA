const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'siseka.db');
let db = new sqlite3.Database(dbPath, (err) => {
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

// Inisialisasi Tabel & Seed Data: 1 Admin & 2 Tenant (Hari ini belum dicatat agar bisa ditest input)
async function initDatabase(forceReset = false) {
  try {
    if (forceReset) {
      console.log('🧹 Mereset seluruh tabel database...');
      await runAsync('DROP TABLE IF EXISTS deposits');
      await runAsync('DROP TABLE IF EXISTS kiosks');
      await runAsync('DROP TABLE IF EXISTS users');
    }

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

    // 2. Tabel Kiosks / Unit Usaha
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

    // Cek apakah data sudah ada
    const userCount = await getAsync('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('🌱 Melakukan inisialisasi akun tunggal Admin BPH...');

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash('barengbareng', salt);

      // 1. SEED SINGLE ADMIN: bph / barengbareng
      await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        ['bph', hashPassword, 'admin', "Pengurus BPH Masjid Al-Wasi'i", 'BP']
      );

      console.log("✅ Inisialisasi database bersih selesai: Akun Admin 'bph' siap digunakan.");
    }
  } catch (error) {
    console.error('❌ Error saat inisialisasi database:', error);
  }
}

module.exports = {
  db,
  initDatabase,
  runAsync,
  allAsync,
  getAsync,
};
