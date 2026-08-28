const express = require('express');
const router = express.Router();
const { allAsync, getAsync } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { autoReconcileUnrecordedDeposits } = require('../utils/reconcile');
const { getCurrentMonthWIB, getCurrentYearWIB } = require('../utils/date');

function getCurrentMonthString() {
  return getCurrentMonthWIB();
}

const MONTH_NAMES = {
  '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
  '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
};

function formatMonthTitle(monthCode) {
  // e.g. '2026-08' -> 'Agustus 2026'
  const [year, month] = monthCode.split('-');
  return `${MONTH_NAMES[month] || month} ${year}`;
}

// 1. GET /api/recap/admin/monthly - Rekap Semua Kantin per Periode Bulan (Admin only)
router.get('/admin/monthly', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await autoReconcileUnrecordedDeposits();
    const month = req.query.month || getCurrentMonthString(); // e.g. '2026-08'

    // Ambil seluruh master kios aktif
    const kiosks = await allAsync(
      `SELECT id, nama_kantin, nama_penyewa, tarif_sewa FROM kiosks WHERE status = 'aktif' ORDER BY id ASC`
    );

    // Ambil seluruh setoran di bulan tersebut
    const deposits = await allAsync(
      `SELECT * FROM deposits WHERE tanggal LIKE ? ORDER BY tanggal ASC`,
      [`${month}%`]
    );

    // Agregasi per kios
    const kioskMap = new Map();
    kiosks.forEach(k => {
      kioskMap.set(k.id, {
        kiosk_id: k.id,
        nama_kantin: k.nama_kantin,
        nama_penyewa: k.nama_penyewa,
        tarif_sewa: k.tarif_sewa,
        total_setor: 0,
        hari_aktif: 0,
        hari_libur: 0
      });
    });

    deposits.forEach(d => {
      const k = kioskMap.get(d.kiosk_id);
      if (k) {
        if (d.status === 'setor') {
          k.total_setor += d.nominal;
          k.hari_aktif++;
        } else if (d.status === 'libur') {
          k.hari_libur++;
        }
      }
    });

    let totalSetoranSemua = 0;
    let totalTargetSewa = 0;
    let countLunasSurplus = 0;
    let countKurang = 0;

    const list = Array.from(kioskMap.values()).map(k => {
      totalSetoranSemua += k.total_setor;
      totalTargetSewa += k.tarif_sewa;

      const selisih = k.total_setor - k.tarif_sewa;
      let status = 'kurang';
      if (selisih > 0) status = 'surplus';
      else if (selisih === 0) status = 'lunas';

      if (status === 'surplus' || status === 'lunas') {
        countLunasSurplus++;
      } else {
        countKurang++;
      }

      return {
        ...k,
        selisih,
        status, // 'surplus' | 'lunas' | 'kurang'
        progress_percent: k.tarif_sewa > 0 ? Math.min(100, Math.round((k.total_setor / k.tarif_sewa) * 100)) : 0
      };
    });

    const progressTotal = totalTargetSewa > 0 ? Math.min(100, Math.round((totalSetoranSemua / totalTargetSewa) * 100)) : 0;

    res.json({
      success: true,
      bulan: month,
      bulan_label: formatMonthTitle(month),
      summary: {
        total_setoran: totalSetoranSemua,
        total_target: totalTargetSewa,
        persentase_tercapai: progressTotal,
        jumlah_lunas_surplus: countLunasSurplus,
        jumlah_kurang: countKurang,
        total_kios: kiosks.length
      },
      data: list
    });
  } catch (error) {
    console.error('Error GET /api/recap/admin/monthly:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil rekap bulanan.' });
  }
});

// 2. GET /api/recap/admin/kiosk/:id - Detail Rekap 1 Kios untuk Admin (Admin only)
router.get('/admin/kiosk/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const month = req.query.month || getCurrentMonthString();

    const kiosk = await getAsync(`SELECT * FROM kiosks WHERE id = ?`, [id]);
    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Kios tidak ditemukan.' });
    }

    const deposits = await allAsync(
      `SELECT * FROM deposits WHERE kiosk_id = ? AND tanggal LIKE ? ORDER BY tanggal DESC, id DESC`,
      [id, `${month}%`]
    );

    let totalSetor = 0;
    let hariAktif = 0;
    let hariLibur = 0;

    deposits.forEach(d => {
      if (d.status === 'setor') {
        totalSetor += d.nominal;
        hariAktif++;
      } else if (d.status === 'libur') {
        hariLibur++;
      }
    });

    const tarifSewa = kiosk.tarif_sewa || 1000000;
    const selisih = totalSetor - tarifSewa;
    let status = 'kurang';
    if (selisih > 0) status = 'surplus';
    else if (selisih === 0) status = 'lunas';

    res.json({
      success: true,
      kiosk: {
        id: kiosk.id,
        nama_kantin: kiosk.nama_kantin,
        nama_penyewa: kiosk.nama_penyewa,
        nomor_hp: kiosk.nomor_hp,
        tarif_sewa: tarifSewa
      },
      bulan: month,
      bulan_label: formatMonthTitle(month),
      summary: {
        total_setor: totalSetor,
        tarif_sewa: tarifSewa,
        selisih: selisih,
        status: status,
        hari_aktif: hariAktif,
        hari_libur: hariLibur,
        progress_percent: tarifSewa > 0 ? Math.min(100, Math.round((totalSetor / tarifSewa) * 100)) : 0
      },
      riwayat: deposits
    });
  } catch (error) {
    console.error('Error GET /api/recap/admin/kiosk/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail rekap kios.' });
  }
});

// Shared Helper: Menghitung Rekapitulasi Tahunan Lengkap + Kompensasi Silang Antar-Bulan
async function calculateKioskYearlyRecap(kiosk, year) {
  const currentMonth = getCurrentMonthString();
  const allDeposits = await allAsync(
    `SELECT * FROM deposits WHERE kiosk_id = ? AND tanggal LIKE ? ORDER BY tanggal DESC`,
    [kiosk.id, `${year}-%`]
  );

  const currentMonthNum = parseInt(currentMonth.split('-')[1]);
  const startMonthNum = 1; // Perekapan resmi dimulai Januari 2026
  const monthsInYear = [];
  for (let m = currentMonthNum; m >= startMonthNum; m--) {
    const mStr = String(m).padStart(2, '0');
    monthsInYear.push(`${year}-${mStr}`);
  }

  const tarifSewa = kiosk.tarif_sewa || 1000000;

  // 1. Hitung data dasar tiap bulan
  const rawMonths = monthsInYear.map(mCode => {
    const depositsInMonth = allDeposits.filter(d => d.tanggal.startsWith(mCode));
    let totalSetor = 0;
    let hariAktif = 0;
    let hariLibur = 0;

    depositsInMonth.forEach(d => {
      if (d.status === 'setor') {
        totalSetor += d.nominal;
        hariAktif++;
      } else if (d.status === 'libur') {
        hariLibur++;
      }
    });

    const isCurrent = mCode === currentMonth;
    const rawSelisih = totalSetor - tarifSewa;
    let status = 'kurang';
    if (rawSelisih > 0) {
      status = 'surplus';
    } else if (rawSelisih === 0) {
      status = 'lunas';
    } else {
      status = isCurrent ? 'berjalan' : 'kurang';
    }

    const surplusVal = Math.max(0, rawSelisih);
    const kekuranganVal = Math.max(0, -rawSelisih);

    return {
      bulan_code: mCode,
      bulan_label: formatMonthTitle(mCode),
      is_current: isCurrent,
      total_setor: totalSetor,
      tarif_sewa: tarifSewa,
      selisih: rawSelisih,
      status: status, // 'surplus' | 'lunas' | 'berjalan' | 'kurang'
      progress_percent: tarifSewa > 0 ? Math.min(100, Math.round((totalSetor / tarifSewa) * 100)) : 0,
      kekurangan: kekuranganVal,
      surplus: surplusVal,
      kompensasi_surplus_diterima: 0,
      sisa_kewajiban_setelah_kompensasi: kekuranganVal,
      status_kompensasi: status === 'surplus' ? 'surplus' : (status === 'lunas' ? 'lunas' : 'belum'),
      hari_aktif: hariAktif,
      hari_libur: hariLibur
    };
  });

  // 2. Kumpulkan total pool surplus dari seluruh bulan yang surplus (termasuk bulan berjalan jika surplus)
  let totalSurplusPool = 0;
  rawMonths.forEach(m => {
    if (m.surplus > 0) {
      totalSurplusPool += m.surplus;
    }
  });

  const initialSurplusPool = totalSurplusPool;

  // 3. Alokasikan surplus untuk menutup kekurangan bulan-bulan yang minus (mulai dari bulan paling lama: kronologis)
  const deficitMonthsChronological = rawMonths
    .filter(m => m.kekurangan > 0)
    .sort((a, b) => a.bulan_code.localeCompare(b.bulan_code));

  deficitMonthsChronological.forEach(m => {
    if (totalSurplusPool > 0) {
      const comp = Math.min(totalSurplusPool, m.kekurangan);
      m.kompensasi_surplus_diterima = comp;
      m.sisa_kewajiban_setelah_kompensasi = m.kekurangan - comp;
      totalSurplusPool -= comp;

      if (m.sisa_kewajiban_setelah_kompensasi === 0) {
        m.status_kompensasi = 'lunas_kompensasi';
      }
    }
  });

  // 4. Hitung ringkasan akumulasi tahunan & saldo bersih
  let totalTahunanSetor = 0;
  let totalTahunanTarget = 0;
  let totalTahunanSurplus = 0;
  let totalTahunanKekurangan = 0;
  let countLunas = 0;
  let countKurang = 0;

  rawMonths.forEach(m => {
    totalTahunanSetor += m.total_setor;
    totalTahunanTarget += m.tarif_sewa;
    if (m.surplus > 0) totalTahunanSurplus += m.surplus;
    if (m.kekurangan > 0) totalTahunanKekurangan += m.kekurangan;

    // Jika lunas murni atau lunas terkompensasi surplus
    if (m.status === 'surplus' || m.status === 'lunas' || m.status_kompensasi === 'lunas_kompensasi') {
      countLunas++;
    } else {
      countKurang++;
    }
  });

  const saldoBersih = totalTahunanSetor - totalTahunanTarget;
  const progressTahunan = totalTahunanTarget > 0 ? Math.min(100, Math.round((totalTahunanSetor / totalTahunanTarget) * 100)) : 0;

  return {
    success: true,
    tahun: year,
    year: year,
    kiosk: {
      id: kiosk.id,
      nama_kantin: kiosk.nama_kantin,
      nama_penyewa: kiosk.nama_penyewa,
      nomor_hp: kiosk.nomor_hp,
      tarif_sewa: tarifSewa
    },
    summary_akumulasi: {
      total_setor: totalTahunanSetor,
      total_target: totalTahunanTarget,
      total_surplus: totalTahunanSurplus,
      total_kekurangan: totalTahunanKekurangan,
      saldo_bersih: saldoBersih,
      is_surplus: saldoBersih > 0,
      is_lunas: saldoBersih === 0,
      is_kurang: saldoBersih < 0,
      surplus_tersedia_saat_ini: totalSurplusPool,
      persentase_tercapai: progressTahunan,
      bulan_lunas: countLunas,
      bulan_belum: countKurang
    },
    data: rawMonths
  };
}

// 2b. GET /api/recap/admin/kiosk/:id/yearly - Rekap Tahunan Seluruh Bulan 1 Kios (Admin only)
router.get('/admin/kiosk/:id/yearly', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const kiosk = await getAsync(`SELECT * FROM kiosks WHERE id = ?`, [id]);
    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Kios tidak ditemukan.' });
    }

    const year = req.query.year || new Date().getFullYear().toString();
    const result = await calculateKioskYearlyRecap(kiosk, year);
    res.json(result);
  } catch (error) {
    console.error('Error GET /api/recap/admin/kiosk/:id/yearly:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil rekap tahunan unit usaha.' });
  }
});

// 3. GET /api/recap/tenant/monthly-history - Histori Rekap Bulanan Tenant (Tenant only)
router.get('/tenant/monthly-history', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const kiosk = await getAsync(`SELECT * FROM kiosks WHERE user_id = ?`, [req.user.id]);
    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Kios tenant tidak ditemukan.' });
    }

    const year = req.query.year || new Date().getFullYear().toString();
    const result = await calculateKioskYearlyRecap(kiosk, year);
    res.json(result);
  } catch (error) {
    console.error('Error GET /api/recap/tenant/monthly-history:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil histori rekap bulanan.' });
  }
});

// 4. GET /api/recap/tenant/month-detail - Detail Rekap 1 Bulan Khusus Tenant (Tenant only)
router.get('/tenant/month-detail', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    const kiosk = await getAsync(`SELECT * FROM kiosks WHERE user_id = ?`, [req.user.id]);
    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Kios tenant tidak ditemukan.' });
    }

    const month = req.query.month || getCurrentMonthString();
    const deposits = await allAsync(
      `SELECT * FROM deposits WHERE kiosk_id = ? AND tanggal LIKE ? ORDER BY tanggal DESC, id DESC`,
      [kiosk.id, `${month}%`]
    );

    let totalSetor = 0;
    let hariAktif = 0;
    let hariLibur = 0;

    deposits.forEach(d => {
      if (d.status === 'setor') {
        totalSetor += d.nominal;
        hariAktif++;
      } else if (d.status === 'libur') {
        hariLibur++;
      }
    });

    const tarifSewa = kiosk.tarif_sewa || 1000000;
    const selisih = totalSetor - tarifSewa;
    const isCurrent = month === getCurrentMonthString();
    let status = 'kurang';
    if (isCurrent) status = 'berjalan';
    else if (selisih > 0) status = 'surplus';
    else if (selisih === 0) status = 'lunas';

    res.json({
      success: true,
      kiosk: {
        id: kiosk.id,
        nama_kantin: kiosk.nama_kantin,
        nama_penyewa: kiosk.nama_penyewa,
        tarif_sewa: tarifSewa
      },
      bulan: month,
      bulan_label: formatMonthTitle(month),
      summary: {
        total_setor: totalSetor,
        tarif_sewa: tarifSewa,
        selisih: selisih,
        status: status,
        hari_aktif: hariAktif,
        hari_libur: hariLibur,
        progress_percent: tarifSewa > 0 ? Math.min(100, Math.round((totalSetor / tarifSewa) * 100)) : 0,
        kekurangan: Math.max(0, tarifSewa - totalSetor)
      },
      riwayat: deposits
    });
  } catch (error) {
    console.error('Error GET /api/recap/tenant/month-detail:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail rekap tenant.' });
  }
});

// 5. POST /api/recap/sync-sheets - Trigger sinkronisasi data ke Google Sheets (Admin only)
router.post('/sync-sheets', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const month = req.query.month || getCurrentMonthString();
    const { syncRecapToGoogleSheets, GOOGLE_SHEETS_VIEW_URL } = require('../services/googleSheets');
    const result = await syncRecapToGoogleSheets(month);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Data berhasil disinkronkan ke Google Sheets!',
        sheetsUrl: GOOGLE_SHEETS_VIEW_URL
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal menyinkronkan data: ' + result.error
      });
    }
  } catch (error) {
    console.error('Error POST /api/recap/sync-sheets:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat sinkronisasi.' });
  }
});

// 6. GET /api/recap/sheets-url - Ambil URL Google Sheets
router.get('/sheets-url', authenticateToken, (req, res) => {
  const { GOOGLE_SHEETS_VIEW_URL } = require('../services/googleSheets');
  res.json({
    success: true,
    sheetsUrl: GOOGLE_SHEETS_VIEW_URL
  });
});

module.exports = router;

