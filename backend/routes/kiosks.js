const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { allAsync, getAsync, runAsync } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/kiosks - Ambil semua daftar kios (Bisa dengan search query ?q=...)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT k.*, u.username 
      FROM kiosks k 
      LEFT JOIN users u ON k.user_id = u.id
    `;
    const params = [];

    if (q) {
      sql += ` WHERE k.id LIKE ? OR k.nama_kantin LIKE ? OR k.nama_penyewa LIKE ?`;
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY k.id ASC`;

    const kiosks = await allAsync(sql, params);

    res.json({
      success: true,
      total: kiosks.length,
      data: kiosks
    });
  } catch (error) {
    console.error('Error GET /api/kiosks:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kios.' });
  }
});

// GET /api/kiosks/:id - Ambil detail 1 kios
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const kiosk = await getAsync(
      `SELECT k.*, u.username FROM kiosks k LEFT JOIN users u ON k.user_id = u.id WHERE k.id = ?`,
      [id]
    );

    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Kios tidak ditemukan.' });
    }

    res.json({ success: true, data: kiosk });
  } catch (error) {
    console.error('Error GET /api/kiosks/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail kios.' });
  }
});

// POST /api/kiosks - Tambah kios baru (Admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id, nama_kantin, nama_penyewa, nomor_hp, tarif_sewa } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Nomor/ID Kios wajib diisi (contoh: K-13).' });
    }

    // Cek apakah ID kios sudah ada
    const existing = await getAsync('SELECT id FROM kiosks WHERE id = ?', [id]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Nomor kios ${id} sudah terdaftar.` });
    }

    const tarif = parseInt(tarif_sewa) || 1000000;
    const status = nama_kantin || nama_penyewa ? 'aktif' : 'kosong';
    const tahunSekarang = new Date().getFullYear().toString();

    await runAsync(
      `INSERT INTO kiosks (id, nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status, sejak) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, nama_kantin || null, nama_penyewa || null, nomor_hp || null, tarif, status, status === 'aktif' ? tahunSekarang : null]
    );

    const newKiosk = await getAsync('SELECT * FROM kiosks WHERE id = ?', [id]);

    res.status(201).json({
      success: true,
      message: 'Kios baru berhasil ditambahkan!',
      data: newKiosk
    });
  } catch (error) {
    console.error('Error POST /api/kiosks:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kios baru.' });
  }
});

// PUT /api/kiosks/:id - Update info kios (Admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status } = req.body;

    const existing = await getAsync('SELECT * FROM kiosks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kios tidak ditemukan.' });
    }

    const newStatus = status || (nama_kantin || nama_penyewa ? 'aktif' : 'kosong');
    const tarif = tarif_sewa !== undefined ? parseInt(tarif_sewa) : existing.tarif_sewa;

    await runAsync(
      `UPDATE kiosks 
       SET nama_kantin = ?, nama_penyewa = ?, nomor_hp = ?, tarif_sewa = ?, status = ?
       WHERE id = ?`,
      [
        nama_kantin !== undefined ? nama_kantin : existing.nama_kantin,
        nama_penyewa !== undefined ? nama_penyewa : existing.nama_penyewa,
        nomor_hp !== undefined ? nomor_hp : existing.nomor_hp,
        tarif,
        newStatus,
        id
      ]
    );

    const updated = await getAsync('SELECT * FROM kiosks WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Informasi kios berhasil diperbarui!',
      data: updated
    });
  } catch (error) {
    console.error('Error PUT /api/kiosks/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kios.' });
  }
});

// POST /api/kiosks/:id/reset-pin - Reset PIN akun penyewa kios (Admin only)
router.post('/:id/reset-pin', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin || pin.length < 4) {
      return res.status(400).json({ success: false, message: 'PIN minimal 4 digit angka.' });
    }

    const kiosk = await getAsync('SELECT * FROM kiosks WHERE id = ?', [id]);
    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Kios tidak ditemukan.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    if (kiosk.user_id) {
      // Update password user yang sudah ada
      await runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPin, kiosk.user_id]);
    } else {
      // Jika belum ada user_id, buat user baru untuk kios ini
      const defaultUsername = id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const initials = (kiosk.nama_penyewa || kiosk.nama_kantin || 'K')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const userRes = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        [defaultUsername, hashedPin, 'tenant', kiosk.nama_penyewa || kiosk.nama_kantin || `Kios ${id}`, initials]
      );

      await runAsync('UPDATE kiosks SET user_id = ? WHERE id = ?', [userRes.lastID, id]);
    }

    res.json({
      success: true,
      message: `PIN untuk ${kiosk.nama_kantin || id} berhasil direset!`
    });
  } catch (error) {
    console.error('Error reset-pin:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset PIN kios.' });
  }
});

module.exports = router;
