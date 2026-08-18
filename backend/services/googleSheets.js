const { allAsync } = require('../database');

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqAIzZNRAAUC1Y4logwJKg4ZuwcOoN7s7diMMkPg543MSUsPhmaYP6mzm7VHU3bLtR/exec';
const GOOGLE_SHEETS_VIEW_URL = 'https://docs.google.com/spreadsheets/d/1gn-bMpqieiROnOWAGpxl8EZKjvtQxILDmpts9Ue8idw/edit?usp=sharing';

// Indonesian day and month names
const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatMonthLabel(monthCode) {
  const [y, m] = monthCode.split('-');
  const mIndex = parseInt(m, 10) - 1;
  return `${MONTHS_ID[mIndex]} ${y}`;
}

function formatDateIndo(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = DAYS_ID[d.getDay()];
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthAbbr = MONTHS_ID[d.getMonth()].substring(0, 3);
  const year = d.getFullYear();
  return `${dayName}, ${dayNum} ${monthAbbr} ${year}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Sinkronkan seluruh rekap unit usaha ke Google Sheets per tab / sheet
 * @param {string} monthCode - Format 'YYYY-MM', misal '2026-08'
 */
async function syncRecapToGoogleSheets(monthCode) {
  try {
    if (!monthCode) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      monthCode = `${y}-${m}`;
    }

    const [yearStr, monthStr] = monthCode.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalDays = getDaysInMonth(year, month);

    const kiosks = await allAsync(`SELECT * FROM kiosks ORDER BY id ASC`);
    const allDeposits = await allAsync(
      `SELECT * FROM deposits WHERE tanggal LIKE ? ORDER BY tanggal ASC, id ASC`,
      [`${monthCode}-%`]
    );

    const kioskPayloads = kiosks.map(k => {
      const kioskDeposits = allDeposits.filter(d => d.kiosk_id === k.id);
      const depositMap = new Map();
      kioskDeposits.forEach(d => depositMap.set(d.tanggal, d));

      let totalSetor = 0;
      const dailyRows = [];

      for (let day = 1; day <= totalDays; day++) {
        const dStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
        const dObj = new Date(`${dStr}T00:00:00`);
        const dayName = DAYS_ID[dObj.getDay()];
        const isSunday = dObj.getDay() === 0;

        const record = depositMap.get(dStr);
        let status = 'belum';
        let nominal = 0;
        let keterangan = '';

        if (record) {
          status = record.status;
          nominal = record.status === 'setor' ? record.nominal : 0;
          keterangan = record.catatan || (record.status === 'libur' ? 'Libur / Tutup' : `Setoran ${dayName}`);
        } else {
          if (isSunday) {
            status = 'libur';
            nominal = 0;
            keterangan = 'Libur Akhir Pekan (Minggu)';
          } else {
            status = 'belum';
            nominal = 0;
            keterangan = `Belum Dicatat (${dayName})`;
          }
        }

        if (status === 'setor') {
          totalSetor += nominal;
        }

        dailyRows.push({
          tanggal: dStr,
          hari: dayName,
          hari_tanggal_label: formatDateIndo(dStr),
          status: status,
          nominal: nominal,
          keterangan: keterangan
        });
      }

      const displayName = k.nama_kantin 
        ? `${k.nama_kantin} (${k.nama_penyewa || 'Stan'})`
        : `Unit Usaha ${k.id}`;

      return {
        id: k.id,
        nama_kantin: displayName,
        penyewa: k.nama_penyewa,
        tarif_sewa: k.tarif_sewa || 1000000,
        total_setor: totalSetor,
        deposits: dailyRows
      };
    });

    const payload = {
      bulan_code: monthCode,
      bulan_label: formatMonthLabel(monthCode),
      kiosks: kioskPayloads
    };

    console.log(`📡 [GoogleSheets] Mengirim ${kiosks.length} unit usaha untuk periode ${payload.bulan_label}...`);

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();
    let resultJson;
    try {
      resultJson = JSON.parse(resultText);
    } catch {
      resultJson = { raw: resultText };
    }

    console.log('✅ [GoogleSheets] Respons Webhook:', resultJson);
    return {
      success: true,
      sheetsUrl: GOOGLE_SHEETS_VIEW_URL,
      response: resultJson
    };
  } catch (error) {
    console.error('❌ [GoogleSheets] Gagal sinkronisasi:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  syncRecapToGoogleSheets,
  GOOGLE_APPS_SCRIPT_URL,
  GOOGLE_SHEETS_VIEW_URL
};
