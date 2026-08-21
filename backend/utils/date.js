/**
 * Utility Penanganan Tanggal & Waktu Terstandarisasi WIB (Asia/Jakarta / UTC+7)
 * Memastikan jam dan tanggal selalu akurat di WIB meskipun server cloud berjalan di UTC (GMT+0).
 */

function getWIBDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  parts.forEach(p => { map[p.type] = p.value; });
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
    dateStr: `${map.year}-${map.month}-${map.day}`,
    monthStr: `${map.year}-${map.month}`,
    timeStr: `${map.hour}:${map.minute}`
  };
}

function getTodayWIB() {
  return getWIBDateParts().dateStr;
}

function getCurrentTimeWIB() {
  return getWIBDateParts().timeStr;
}

function getCurrentMonthWIB() {
  return getWIBDateParts().monthStr;
}

function getCurrentYearWIB() {
  return getWIBDateParts().year;
}

module.exports = {
  getWIBDateParts,
  getTodayWIB,
  getCurrentTimeWIB,
  getCurrentMonthWIB,
  getCurrentYearWIB
};
