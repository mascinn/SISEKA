const { allAsync, getAsync, runAsync } = require('../database');

/**
 * Otomatis mendeteksi dan mencatat hari-hari lampau yang tidak diinput admin
 * sebagai 'libur' di database SQLite:
 * - Jika hari Sabtu / Minggu -> Catatan: 'Libur Akhir Pekan'
 * - Jika hari kerja (Senin - Jumat) -> Catatan: 'Libur / Tutup'
 */
async function autoReconcileUnrecordedDeposits() {
  try {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Ambil semua kios aktif
    const activeKiosks = await allAsync(`SELECT id FROM kiosks WHERE status = 'aktif'`);
    if (!activeKiosks || activeKiosks.length === 0) return;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1 - 12
    const currentDay = today.getDate();

    // Loop dari tanggal 1 bulan ini sampai kemarin (hari-hari yang sudah selesai)
    for (let day = 1; day < currentDay; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(currentMonth).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const dateObj = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      const autoCatatan = isWeekend ? 'Libur Akhir Pekan' : 'Libur / Tutup';

      for (const kiosk of activeKiosks) {
        // Cek apakah sudah ada baris di database untuk tanggal ini
        const existing = await getAsync(
          `SELECT id FROM deposits WHERE kiosk_id = ? AND tanggal = ?`,
          [kiosk.id, dateStr]
        );

        if (!existing) {
          // Belum ada baris -> Otomatis buat baris libur di SQLite
          await runAsync(
            `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan)
             VALUES (?, ?, NULL, 0, 'libur', NULL, ?)`,
            [kiosk.id, dateStr, autoCatatan]
          );
          console.log(`🤖 [Auto-Reconcile] Dicatat otomatis: Kios ${kiosk.id} pada ${dateStr} sebagai ${autoCatatan}`);
        }
      }
    }
  } catch (error) {
    console.error('Error autoReconcileUnrecordedDeposits:', error);
  }
}

module.exports = {
  autoReconcileUnrecordedDeposits
};
