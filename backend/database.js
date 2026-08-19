require('dotenv').config();
const path = require('path');
const bcrypt = require('bcryptjs');

const isTurso = Boolean(process.env.TURSO_DATABASE_URL);
let runAsync, allAsync, getAsync, db;

if (isTurso) {
  const { createClient } = require('@libsql/client');
  const tursoUrl = process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, 'https://');
  const client = createClient({
    url: tursoUrl,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  console.log('✅ Terhubung ke database Cloud Turso (LibSQL):', tursoUrl);

  runAsync = async function (sql, params = []) {
    const res = await client.execute({ sql, args: params });
    return {
      lastID: res.lastInsertRowid !== undefined && res.lastInsertRowid !== null ? Number(res.lastInsertRowid) : undefined,
      changes: res.rowsAffected
    };
  };

  allAsync = async function (sql, params = []) {
    const res = await client.execute({ sql, args: params });
    return res.rows;
  };

  getAsync = async function (sql, params = []) {
    const res = await client.execute({ sql, args: params });
    return res.rows[0] || undefined;
  };

  db = client;
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'siseka.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Gagal membuka database SQLite lokal:', err.message);
    } else {
      console.log('✅ Terhubung ke database SQLite lokal:', dbPath);
    }
  });

  // Helper run SQL with Promise
  runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  // Helper query all with Promise
  allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  // Helper query single with Promise
  getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };
}

// Inisialisasi Tabel & Seed Data
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
    if (!userCount || userCount.count === 0) {
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
