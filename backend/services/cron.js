const { syncRecapToGoogleSheets } = require('./googleSheets');

/**
 * Service Cron Job Harian Otomatis Jam 00:01 WIB
 */
function scheduleMidnightSync() {
  function getMsUntilMidnight01() {
    const now = new Date();
    // Hitung waktu berikutnya pada jam 00:01:00
    const nextTarget = new Date(now);
    nextTarget.setHours(0, 1, 0, 0);

    // Jika waktu 00:01 hari ini sudah lewat, jadwalkan untuk besok
    if (now.getTime() >= nextTarget.getTime()) {
      nextTarget.setDate(nextTarget.getDate() + 1);
    }

    return nextTarget.getTime() - now.getTime();
  }

  function runAndReschedule() {
    const delay = getMsUntilMidnight01();
    const hours = (delay / (1000 * 60 * 60)).toFixed(2);
    console.log(`⏰ [CRON] Jadwal sinkronisasi otomatis berikutnya di jam 00:01 WIB (${hours} jam lagi).`);

    setTimeout(async () => {
      console.log('⏰ [CRON 00:01 WIB] Menjalankan sinkronisasi harian otomatis ke Google Sheets...');
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const monthCode = `${y}-${m}`;

        await syncRecapToGoogleSheets(monthCode);
        console.log('✅ [CRON 00:01 WIB] Sinkronisasi harian otomatis selesai.');
      } catch (err) {
        console.error('❌ [CRON 00:01 WIB] Gagal menjalankan sinkronisasi:', err);
      }

      // Jadwalkan kembali untuk hari berikutnya
      runAndReschedule();
    }, delay);
  }

  runAndReschedule();
}

module.exports = {
  scheduleMidnightSync
};
