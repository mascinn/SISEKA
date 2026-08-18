const express = require('express');
const router = express.Router();
const { allAsync, getAsync, runAsync } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { autoReconcileUnrecordedDeposits } = require('../utils/reconcile');

// Helper: Format tanggal YYYY-MM-DD lokal
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Format waktu HH:mm lokal
function getCurrentTimeString() {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// GET /api/deposits/today - Ambil rekap & status setoran hari ini (Admin only)
router.get('/today', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await autoReconcileUnrecordedDeposits();
    const today = req.query.date || getTodayDateString();

    // 1. Ambil semua kios aktif
    const kiosks = await allAsync(
      `SELECT id, nama_kantin, nama_penyewa, tarif_sewa, status FROM kiosks WHERE status = 'aktif' ORDER BY id ASC`
    );

    // 2. Ambil semua setoran pada tanggal ini
    const depositsToday = await allAsync(
      `SELECT * FROM deposits WHERE tanggal = ?`,
      [today]
    );

    // Map deposit ke tiap kios
    const depositMap = new Map();
    depositsToday.forEach(d => depositMap.set(d.kiosk_id, d));

    let totalKasHariIni = 0;
    let totalSetor = 0;
    let totalLibur = 0;
    let totalBelum = 0;

    const list = kiosks.map(k => {
      const dep = depositMap.get(k.id);
      if (dep) {
        if (dep.status === 'setor') {
          totalKasHariIni += dep.nominal;
          totalSetor++;
        } else if (dep.status === 'libur') {
          totalLibur++;
        }
        return {
          ...k,
          deposit_id: dep.id,
          deposit_status: dep.status, // 'setor' | 'libur'
          nominal: dep.nominal,
          metode: dep.metode,
          waktu: dep.waktu,
          catatan: dep.catatan,
          tanggal: dep.tanggal
        };
      } else {
        totalBelum++;
        return {
          ...k,
          deposit_id: null,
          deposit_status: 'belum',
          nominal: 0,
          metode: null,
          waktu: null,
          catatan: null,
          tanggal: today
        };
      }
    });

    // Urutkan list:
    // 1. Kios yang "belum" diinput ditaruh paling atas agar mudah dicatat
    // 2. Kios yang "setor" diurutkan dari yang paling baru diinput (deposit_id DESC)
    // 3. Kios yang "libur" ditaruh di bawah
    list.sort((a, b) => {
      if (a.deposit_status === 'belum' && b.deposit_status !== 'belum') return -1;
      if (a.deposit_status !== 'belum' && b.deposit_status === 'belum') return 1;

      if (a.deposit_status === 'setor' && b.deposit_status === 'setor') {
        return (b.deposit_id || 0) - (a.deposit_id || 0);
      }

      if (a.deposit_status === 'libur' && b.deposit_status !== 'libur') return 1;
      if (a.deposit_status !== 'libur' && b.deposit_status === 'libur') return -1;

      return a.id.localeCompare(b.id);
    });

    const totalKios = kiosks.length;
    const totalDicatat = totalSetor + totalLibur;
    const progressPercent = totalKios > 0 ? Math.round((totalDicatat / totalKios) * 100) : 0;

    res.json({
      success: true,
      tanggal: today,
      summary: {
        total_kas_hari_ini: totalKasHariIni,
        total_kios: totalKios,
        total_dicatat: totalDicatat,
        total_setor: totalSetor,
        total_libur: totalLibur,
        total_belum: totalBelum,
        progress_percent: progressPercent,
        is_complete: totalBelum === 0
      },
      data: list
    });
  } catch (error) {
    console.error('Error GET /api/deposits/today:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data penarikan hari ini.' });
  }
});

// POST /api/deposits - Catat Setoran Baru (Admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { kiosk_id, tanggal, nominal, status, metode, catatan } = req.body;

    if (!kiosk_id) {
      return res.status(400).json({ success: false, message: 'ID Kios wajib diisi.' });
    }

    const tgl = tanggal || getTodayDateString();
    const wkt = getCurrentTimeString();
    const stat = status || 'setor';
    const nom = stat === 'libur' ? 0 : (parseInt(nominal) || 0);

    // Cek apakah kios ini sudah pernah dicatat di tanggal tersebut
    const existing = await getAsync(
      `SELECT id FROM deposits WHERE kiosk_id = ? AND tanggal = ?`,
      [kiosk_id, tgl]
    );

    if (existing) {
      // Update jika sudah ada
      await runAsync(
        `UPDATE deposits SET nominal = ?, status = ?, metode = ?, catatan = ?, waktu = ? WHERE id = ?`,
        [nom, stat, stat === 'libur' ? null : (metode || 'Tunai'), catatan || null, wkt, existing.id]
      );

      const updated = await getAsync(`SELECT * FROM deposits WHERE id = ?`, [existing.id]);
      return res.json({
        success: true,
        message: 'Setoran berhasil diperbarui!',
        data: updated
      });
    }

    // Insert data baru
    const insertRes = await runAsync(
      `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kiosk_id, tgl, wkt, nom, stat, stat === 'libur' ? null : (metode || 'Tunai'), catatan || null]
    );

    const newDeposit = await getAsync(`SELECT * FROM deposits WHERE id = ?`, [insertRes.lastID]);

    res.status(201).json({
      success: true,
      message: 'Setoran berhasil dicatat!',
      data: newDeposit
    });
  } catch (error) {
    console.error('Error POST /api/deposits:', error);
    res.status(500).json({ success: false, message: 'Gagal mencatat setoran.' });
  }
});

// PUT /api/deposits/:id - Koreksi / Edit Setoran (Admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nominal, status, metode, catatan } = req.body;

    const existing = await getAsync(`SELECT * FROM deposits WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data setoran tidak ditemukan.' });
    }

    const stat = status || existing.status;
    const nom = stat === 'libur' ? 0 : (nominal !== undefined ? parseInt(nominal) : existing.nominal);

    await runAsync(
      `UPDATE deposits SET nominal = ?, status = ?, metode = ?, catatan = ? WHERE id = ?`,
      [
        nom,
        stat,
        stat === 'libur' ? null : (metode !== undefined ? metode : existing.metode),
        catatan !== undefined ? catatan : existing.catatan,
        id
      ]
    );

    const updated = await getAsync(`SELECT * FROM deposits WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'Setoran berhasil dikoreksi!',
      data: updated
    });
  } catch (error) {
    console.error('Error PUT /api/deposits/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal mengoreksi setoran.' });
  }
});

// DELETE /api/deposits/:id - Batalkan / Hapus Setoran Hari Ini (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getAsync(`SELECT * FROM deposits WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Data setoran tidak ditemukan.' });
    }

    await runAsync(`DELETE FROM deposits WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: 'Setoran berhasil dibatalkan.'
    });
  } catch (error) {
    console.error('Error DELETE /api/deposits/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal membatalkan setoran.' });
  }
});

// GET /api/deposits/tenant/current - Ambil Dashboard & Riwayat Setoran Tenant Aktif
router.get('/tenant/current', authenticateToken, requireRole('tenant'), async (req, res) => {
  try {
    // 1. Cari kios milik tenant
    const kiosk = await getAsync(`SELECT * FROM kiosks WHERE user_id = ?`, [req.user.id]);
    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Kios untuk tenant ini tidak ditemukan.' });
    }

    const today = getTodayDateString();
    const currentMonthPrefix = today.slice(0, 7); // 'YYYY-MM'

    // 2. Ambil semua setoran bulan ini
    const monthlyDeposits = await allAsync(
      `SELECT * FROM deposits WHERE kiosk_id = ? AND tanggal LIKE ? ORDER BY tanggal DESC, id DESC`,
      [kiosk.id, `${currentMonthPrefix}%`]
    );

    // 3. Hitung akumulasi
    let totalAkumulasi = 0;
    let hariAktif = 0;
    let hariLibur = 0;

    monthlyDeposits.forEach(d => {
      if (d.status === 'setor') {
        totalAkumulasi += d.nominal;
        hariAktif++;
      } else if (d.status === 'libur') {
        hariLibur++;
      }
    });

    const tarifSewa = kiosk.tarif_sewa || 1000000;
    const progressPercent = tarifSewa > 0 ? Math.min(100, Math.round((totalAkumulasi / tarifSewa) * 100)) : 0;
    const kekurangan = Math.max(0, tarifSewa - totalAkumulasi);
    const surplus = Math.max(0, totalAkumulasi - tarifSewa);

    // Setoran hari ini
    const depositToday = monthlyDeposits.find(d => d.tanggal === today) || null;

    res.json({
      success: true,
      kiosk: {
        id: kiosk.id,
        nama_kantin: kiosk.nama_kantin,
        nama_penyewa: kiosk.nama_penyewa,
        tarif_sewa: tarifSewa
      },
      summary: {
        bulan: currentMonthPrefix,
        total_akumulasi: totalAkumulasi,
        tarif_sewa: tarifSewa,
        progress_percent: progressPercent,
        kekurangan: kekurangan,
        surplus: surplus,
        hari_aktif: hariAktif,
        hari_libur: hariLibur
      },
      deposit_today: depositToday,
      riwayat: monthlyDeposits
    });
  } catch (error) {
    console.error('Error GET /api/deposits/tenant/current:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data setoran tenant.' });
  }
});

module.exports = router;
