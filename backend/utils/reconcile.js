const { allAsync, runAsync, db } = require('../database');
const { getWIBDateParts } = require('./date');

/**
 * Otomatis mendeteksi dan mencatat hari-hari lampau yang tidak diinput admin
 * sebagai 'libur' secara efisien (1 Query Check + 1 Batch Insert).
 */
async function autoReconcileUnrecordedDeposits() {
  try {
    const parts = getWIBDateParts();
    const currentYear = parseInt(parts.year, 10);
    const currentMonth = parseInt(parts.month, 10);
    const currentDay = parseInt(parts.day, 10);

    if (currentDay <= 1) return; // Tanggal 1 tidak ada hari lampau dalam bulan ini

    const startDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

    // 1. Ambil semua kios aktif
    const activeKiosks = await allAsync(`SELECT id FROM kiosks WHERE status = 'aktif'`);
    if (!activeKiosks || activeKiosks.length === 0) return;

    // 2. Ambil seluruh catatan setoran yang sudah ada di bulan ini (1 single query!)
    const existingRows = await allAsync(
      `SELECT kiosk_id, tanggal FROM deposits WHERE tanggal >= ? AND tanggal < ?`,
      [startDateStr, todayStr]
    );

    const existingSet = new Set(existingRows.map(r => `${r.kiosk_id}_${r.tanggal}`));
    const missingInserts = [];

    // 3. Cari tanggal yang belum tercatat
    for (let day = 1; day < currentDay; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${dayStr}`;

      const dateObj = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayName = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'][dayOfWeek];
      const autoCatatan = isWeekend ? `Libur Akhir Pekan (${dayName})` : 'Libur / Tutup';

      for (const kiosk of activeKiosks) {
        const key = `${kiosk.id}_${dateStr}`;
        if (!existingSet.has(key)) {
          missingInserts.push({
            kiosk_id: kiosk.id,
            tanggal: dateStr,
            catatan: autoCatatan
          });
        }
      }
    }

    if (missingInserts.length === 0) return;

    console.log(`🤖 [Auto-Reconcile] Menambahkan ${missingInserts.length} catatan hari libur yang terlewat...`);

    // 4. Batch insert jika ada yang terlewat
    const isTurso = Boolean(process.env.TURSO_DATABASE_URL);
    if (isTurso && typeof db.batch === 'function') {
      const statements = missingInserts.map(item => ({
        sql: `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) VALUES (?, ?, '16:00', 0, 'libur', NULL, ?)`,
        args: [item.kiosk_id, item.tanggal, item.catatan]
      }));
      await db.batch(statements);
    } else {
      for (const item of missingInserts) {
        await runAsync(
          `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) VALUES (?, ?, '16:00', 0, 'libur', NULL, ?)`,
          [item.kiosk_id, item.tanggal, item.catatan]
        );
      }
    }
  } catch (error) {
    console.error('Error autoReconcileUnrecordedDeposits:', error);
  }
}

module.exports = {
  autoReconcileUnrecordedDeposits
};
