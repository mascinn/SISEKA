const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAsync } = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.'
      });
    }

    // Cari user di database
    const user = await getAsync('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    // Verifikasi password dengan bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    // Jika tenant, ambil data kios terkait
    let kioskData = null;
    if (user.role === 'tenant') {
      kioskData = await getAsync('SELECT * FROM kiosks WHERE user_id = ?', [user.id]);
    }

    // Buat JWT Token (Berlaku 7 hari)
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      initials: user.initials,
      kiosk_id: kioskData ? kioskData.id : null,
      kios_nama: kioskData ? kioskData.nama_kantin : null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        initials: user.initials,
        kios: kioskData ? kioskData.nama_kantin : null,
        kiosk_id: kioskData ? kioskData.id : null,
        tarif_sewa: kioskData ? kioskData.tarif_sewa : null,
      }
    });
  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

// GET /api/auth/me (Cek info user login aktif)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getAsync(
      'SELECT id, username, role, name, initials, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.'
      });
    }

    let kioskData = null;
    if (user.role === 'tenant') {
      kioskData = await getAsync('SELECT * FROM kiosks WHERE user_id = ?', [user.id]);
    }

    res.json({
      success: true,
      user: {
        ...user,
        kios: kioskData ? kioskData.nama_kantin : null,
        kiosk_id: kioskData ? kioskData.id : null,
        tarif_sewa: kioskData ? kioskData.tarif_sewa : null,
      }
    });
  } catch (error) {
    console.error('Error get /me:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
});

module.exports = router;
