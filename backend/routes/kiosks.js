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

// POST /api/kiosks - Tambah Unit Usaha baru (Admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, password, pin } = req.body;

    if (!nama_kantin && !nama_penyewa) {
      return res.status(400).json({ success: false, message: 'Nama unit usaha atau nama penyewa wajib diisi.' });
    }

    // Cari ID numerik berikutnya
    const lastKiosk = await getAsync('SELECT id FROM kiosks ORDER BY CAST(id AS INTEGER) DESC LIMIT 1');
    const nextId = lastKiosk && !isNaN(lastKiosk.id) ? (parseInt(lastKiosk.id) + 1).toString() : '1';

    const tarif = parseInt(tarif_sewa) || 1000000;
    const status = 'aktif';
    const tahunSekarang = new Date().getFullYear().toString();

    // Buat akun user tenant otomatis
    const baseUsername = (nama_penyewa || nama_kantin || `unit${nextId}`)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const existingUser = await getAsync('SELECT id FROM users WHERE username = ?', [baseUsername]);
    const finalUsername = existingUser ? `${baseUsername}${nextId}` : baseUsername;

    const initialPassword = password || pin || '1234';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(initialPassword, salt);

    const initials = (nama_penyewa || nama_kantin || 'U')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const userRes = await runAsync(
      'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
      [finalUsername, hashedPassword, 'tenant', nama_penyewa || nama_kantin, initials]
    );

    await runAsync(
      `INSERT INTO kiosks (id, user_id, nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status, sejak) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nextId, userRes.lastID, nama_kantin || null, nama_penyewa || null, nomor_hp || null, tarif, status, tahunSekarang]
    );

    const newKiosk = await getAsync(
      `SELECT k.*, u.username FROM kiosks k LEFT JOIN users u ON k.user_id = u.id WHERE k.id = ?`,
      [nextId]
    );

    res.status(201).json({
      success: true,
      message: `Unit usaha berhasil ditambahkan! Username Login: '${finalUsername}' (Password: ${initialPassword})`,
      data: newKiosk,
      credentials: {
        username: finalUsername,
        password: initialPassword
      }
    });
  } catch (error) {
    console.error('Error POST /api/kiosks:', error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan unit usaha baru.' });
  }
});

// PUT /api/kiosks/:id - Update info Unit Usaha (Admin only)
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status } = req.body;

    const existing = await getAsync('SELECT * FROM kiosks WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Unit usaha tidak ditemukan.' });
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
      message: 'Informasi unit usaha berhasil diperbarui!',
      data: updated
    });
  } catch (error) {
    console.error('Error PUT /api/kiosks/:id:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui unit usaha.' });
  }
});

// POST /api/kiosks/:id/reset-password - Reset Password akun penyewa unit usaha (Admin only)
const handleResetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, pin } = req.body;
    const newPass = password || pin;

    if (!newPass || newPass.length < 4) {
      return res.status(400).json({ success: false, message: 'Password minimal 4 karakter.' });
    }

    const kiosk = await getAsync('SELECT * FROM kiosks WHERE id = ?', [id]);
    if (!kiosk) {
      return res.status(404).json({ success: false, message: 'Unit usaha tidak ditemukan.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPass, salt);

    if (kiosk.user_id) {
      // Update password user yang sudah ada
      await runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, kiosk.user_id]);
    } else {
      // Jika belum ada user_id, buat user baru untuk unit usaha ini
      const defaultUsername = (kiosk.nama_penyewa || kiosk.nama_kantin || `unit${id}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      const initials = (kiosk.nama_penyewa || kiosk.nama_kantin || 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const userRes = await runAsync(
        'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
        [defaultUsername, hashedPassword, 'tenant', kiosk.nama_penyewa || kiosk.nama_kantin || `Unit Usaha ${id}`, initials]
      );

      await runAsync('UPDATE kiosks SET user_id = ? WHERE id = ?', [userRes.lastID, id]);
    }

    res.json({
      success: true,
      message: `Password untuk ${kiosk.nama_kantin || 'Unit Usaha ' + id} berhasil direset!`
    });
  } catch (error) {
    console.error('Error reset-password:', error);
    res.status(500).json({ success: false, message: 'Gagal mereset password unit usaha.' });
  }
};

router.post('/:id/reset-password', authenticateToken, requireRole('admin'), handleResetPassword);
router.post('/:id/reset-pin', authenticateToken, requireRole('admin'), handleResetPassword);

module.exports = router;

