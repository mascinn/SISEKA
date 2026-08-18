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
      console.log('🌱 Melakukan seeding data: 1 Admin, 2 Tenant (Setoran s/d 17 Agustus, 18 Agustus kosong)...');

      const salt = await bcrypt.genSalt(10);
      const hash1234 = await bcrypt.hash('1234', salt);

      // 1. SEED USERS: 1 Admin + 2 Tenant
      const adminRes = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        ['admin', hash1234, 'admin', 'Admin BPH', 'AD']
      );

      const tenant1Res = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        ['aminah', hash1234, 'tenant', 'Bu Aminah', 'BA']
      );

      const tenant2Res = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        ['hidayat', hash1234, 'tenant', 'Pak Hidayat', 'PH']
      );

      // 2. SEED UNIT USAHA
      // Unit 1: Kantin Berkah (Bu Aminah)
      await runAsync(
        `INSERT INTO kiosks (id, user_id, nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status, sejak) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['1', tenant1Res.lastID, 'Kantin Berkah', 'Bu Aminah', '0812-3456-7890', 1000000, 'aktif', '2024']
      );

      // Unit 2: Fotocopy & Percetakan Al-Wasi'i (Pak Hidayat)
      await runAsync(
        `INSERT INTO kiosks (id, user_id, nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status, sejak) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['2', tenant2Res.lastID, 'Fotocopy & Percetakan Al-Wasi\'i', 'Pak Hidayat', '0813-7890-1234', 1000000, 'aktif', '2025']
      );

      // 3. SEED SETORAN 2 BULAN UNTUK KEDUA UNIT USAHA (Unit 1 & Unit 2):
      const unitIds = ['1', '2'];

      for (const uid of unitIds) {
        // 📅 BULAN 1: JULI 2026 (22 Hari Setor x 50.000 = Rp 1.100.000 + 9 Hari Libur -> SURPLUS +Rp 100.000)
        const juliLibur = [5, 6, 12, 13, 19, 20, 26, 27, 31];
        for (let day = 1; day <= 31; day++) {
          const dayStr = String(day).padStart(2, '0');
          const dateStr = `2026-07-${dayStr}`;

          if (juliLibur.includes(day)) {
            await runAsync(
              `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [uid, dateStr, null, 0, 'libur', null, 'Libur Akhir Pekan']
            );
          } else {
            await runAsync(
              `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [uid, dateStr, '14:30', 50000, 'setor', 'Tunai', 'Setoran harian lancar']
            );
          }
        }

        // 📅 BULAN 2: AGUSTUS 2026 (Tanggal 1 s/d 17 Agustus: 15 Hari Setor x 50.000 = Rp 750.000 + 2 Hari Libur)
        // Tanggal 18 Agustus (HARI INI) SENGAJA KOSONG agar admin bisa input setoran baru!
        const agustusLibur = [9, 16];
        for (let day = 1; day <= 17; day++) {
          const dayStr = String(day).padStart(2, '0');
          const dateStr = `2026-08-${dayStr}`;

          if (agustusLibur.includes(day)) {
            await runAsync(
              `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [uid, dateStr, null, 0, 'libur', null, 'Libur Akhir Pekan']
            );
          } else {
            await runAsync(
              `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [uid, dateStr, '10:15', 50000, 'setor', 'Tunai', 'Setoran harian']
            );
          }
        }
      }

      console.log('✅ Seeding database 1 Admin & 2 Tenant (Hari ini siap diinput) selesai!');
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
