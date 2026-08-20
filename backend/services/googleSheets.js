const { allAsync } = require('../database');

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqAIzZNRAAUC1Y4logwJKg4ZuwcOoN7s7diMMkPg543MSUsPhmaYP6mzm7VHU3bLtR/exec';
const GOOGLE_SHEETS_VIEW_URL = 'https://docs.google.com/spreadsheets/d/1gn-bMpqieiROnOWAGpxl8EZKjvtQxILDmpts9Ue8idw/edit?usp=sharing';

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

let syncTimeout = null;

/**
 * Trigger background auto-sync dengan debouncing agar tidak membebani server/Google Apps Script
 */
function triggerAutoSync(delayMs = 3000) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(async () => {
    try {
      console.log('🔄 [GoogleSheets Auto-Sync] Memperbarui seluruh data ke Google Sheets...');
      await syncRecapToGoogleSheets();
    } catch (err) {
      console.error('⚠️ [GoogleSheets Auto-Sync] Gagal update otomatis:', err.message);
    }
  }, delayMs);
}

/**
 * Sinkronkan seluruh rekap unit usaha ke Google Sheets per tab dengan format tabel per bulan & total
 */
async function syncRecapToGoogleSheets(targetParam = '2026') {
  try {
    const year = String(targetParam).split('-')[0] || '2026';
    const now = new Date();
    // Tentukan bulan berjalan (1-12)
    const currentMonthNum = parseInt(year, 10) === now.getFullYear() 
      ? Math.min(12, Math.max(1, now.getMonth() + 1))
      : 8; // Default 8 (Agustus) untuk periode aktif SISEKA 2026

    const kiosks = await allAsync(`SELECT * FROM kiosks ORDER BY id ASC`);
    const allDeposits = await allAsync(
      `SELECT * FROM deposits WHERE tanggal LIKE ? ORDER BY tanggal ASC, id ASC`,
      [`${year}-%`]
    );

    // 1. Susun Data Ringkasan Eksekutif Semua Unit
    let totalSemuaSetor = 0;
    let totalSemuaTarget = 0;

    const ringkasanSemuaUnit = kiosks.map((k, idx) => {
      const kDeposits = allDeposits.filter(d => d.kiosk_id === k.id);
      const sumNominal = kDeposits.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
      const targetTahunan = (k.tarif_sewa || 0) * currentMonthNum;
      const saldo = sumNominal - targetTahunan;

      totalSemuaSetor += sumNominal;
      totalSemuaTarget += targetTahunan;

      return {
        no: idx + 1,
        kiosk_id: k.id,
        nama_kantin: k.nama_kantin,
        nama_penyewa: k.nama_penyewa,
        nomor_hp: k.nomor_hp || '-',
        tarif_sewa: k.tarif_sewa || 0,
        total_setor: sumNominal,
        target_sewa: targetTahunan,
        saldo: saldo,
        status: saldo >= 0 ? (saldo === 0 ? 'Lunas' : 'Surplus') : 'Kurang Bayar'
      };
    });

    // 2. Susun Data Per Kios (Tabel Terpisah Per Bulan + Total)
    const kioskTabs = kiosks.map(k => {
      const kDeposits = allDeposits.filter(d => d.kiosk_id === k.id);
      const monthlyTables = [];

      for (let m = 1; m <= currentMonthNum; m++) {
        const mStr = String(m).padStart(2, '0');
        const monthCode = `${year}-${mStr}`;
        const monthLabel = `${MONTHS_ID[m - 1]} ${year}`;
        const daysInMonth = getDaysInMonth(parseInt(year, 10), m);

        const mDeposits = kDeposits.filter(d => d.tanggal.startsWith(monthCode));
        const depositMap = new Map();
        mDeposits.forEach(d => depositMap.set(d.tanggal, d));

        let mTotalSetor = 0;
        let mHariSetor = 0;
        let mHariLibur = 0;
        const dailyRows = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const dStr = `${year}-${mStr}-${String(day).padStart(2, '0')}`;
          const dObj = new Date(`${dStr}T00:00:00`);
          const dayName = DAYS_ID[dObj.getDay()];
          const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

          const record = depositMap.get(dStr);
          let status = 'libur';
          let nominal = 0;
          let keterangan = '';

          if (record) {
            status = record.status;
            nominal = record.nominal || 0;
            keterangan = record.catatan || (status === 'libur' ? 'Libur / Tutup' : `Setoran ${dayName}`);
          } else {
            status = 'libur';
            nominal = 0;
            keterangan = isWeekend ? `Libur Akhir Pekan (${dayName})` : 'Libur Operasional';
          }

          if (status === 'setor') {
            mTotalSetor += nominal;
            mHariSetor++;
          } else {
            mHariLibur++;
          }

          dailyRows.push({
            no: day,
            tanggal: dStr,
            hari: dayName,
            jam: record?.waktu || '16:00',
            status: status.toUpperCase(),
            nominal: nominal,
            keterangan: keterangan
          });
        }

        const mSaldo = mTotalSetor - (k.tarif_sewa || 0);
        const mStatus = mSaldo >= 0 
          ? (mSaldo === 0 ? 'LUNAS' : `SURPLUS (+Rp ${mSaldo.toLocaleString('id-ID')})`) 
          : `KURANG (-Rp ${Math.abs(mSaldo).toLocaleString('id-ID')})`;

        monthlyTables.push({
          bulan_code: monthCode,
          bulan_nama: monthLabel,
          target_sewa: k.tarif_sewa || 0,
          total_setor: mTotalSetor,
          saldo: mSaldo,
          status_keuangan: mStatus,
          hari_setor: mHariSetor,
          hari_libur: mHariLibur,
          rows: dailyRows
        });
      }

      return {
        id: k.id,
        nama_kantin: k.nama_kantin,
        nama_penyewa: k.nama_penyewa,
        nomor_hp: k.nomor_hp || '-',
        tarif_sewa: k.tarif_sewa || 0,
        monthly_tables: monthlyTables
      };
    });

    const payload = {
      tahun: year,
      total_semua_setor: totalSemuaSetor,
      total_semua_target: totalSemuaTarget,
      ringkasan_semua: ringkasanSemuaUnit,
      kiosks: kioskTabs
    };

    console.log(`📡 [GoogleSheets] Mengirim data ${kiosks.length} unit usaha lengkap dengan format Tabel Per Bulan...`);

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
  triggerAutoSync,
  GOOGLE_APPS_SCRIPT_URL,
  GOOGLE_SHEETS_VIEW_URL
};
