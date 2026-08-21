const { syncRecapToGoogleSheets } = require('./googleSheets');
const { getWIBDateParts } = require('../utils/date');

/**
 * Service Cron Job Harian Otomatis Jam 00:01 WIB
 */
function scheduleMidnightSync() {
  function getMsUntilMidnight01WIB() {
    const now = new Date();
    const parts = getWIBDateParts(now);
    
    // Target: hari ini jam 00:01:00 WIB (offset +07:00)
    let target = new Date(`${parts.dateStr}T00:01:00+07:00`);
    
    // Jika jam 00:01 WIB hari ini sudah lewat, jadwalkan untuk besok di WIB
    if (now.getTime() >= target.getTime()) {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowParts = getWIBDateParts(tomorrow);
      target = new Date(`${tomorrowParts.dateStr}T00:01:00+07:00`);
    }

    return target.getTime() - now.getTime();
  }

  function runAndReschedule() {
    const delay = getMsUntilMidnight01WIB();
    const hours = (delay / (1000 * 60 * 60)).toFixed(2);
    console.log(`⏰ [CRON] Jadwal sinkronisasi otomatis berikutnya di jam 00:01 WIB (${hours} jam lagi).`);

    setTimeout(async () => {
      console.log('⏰ [CRON 00:01 WIB] Menjalankan sinkronisasi harian otomatis ke Google Sheets...');
      try {
        await syncRecapToGoogleSheets();
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
