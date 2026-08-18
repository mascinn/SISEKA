/* ============================================================
   SISEKA WASI'I — App Core JS
   Auth, utilities, route guard
   ============================================================ */

// ---- Dummy Users ----
const USERS = [
  { username: 'admin', password: '1234', role: 'admin', name: 'Admin BPH', initials: 'AD' },
  { username: 'aminah', password: '1234', role: 'tenant', name: 'Bu Aminah', initials: 'BA', kios: 'Kantin Berkah' },
  { username: 'eni', password: '1234', role: 'tenant', name: 'Bude Eni', initials: 'BE', kios: 'Warung Bude Eni' },
];

// ---- Dummy Data: Kios ----
const KIOS_LIST = [
  { id: 'K01', nama: 'Kantin Berkah', penyewa: 'Bu Aminah', hp: '0812-3456-7890', sewa: 1000000, status: 'aktif', sejak: '2024' },
  { id: 'K02', nama: null, penyewa: null, hp: null, sewa: 1000000, status: 'kosong', sejak: null },
  { id: 'K03', nama: 'Warung Sehat', penyewa: 'Siti Aminah', hp: '0856-7890-1234', sewa: 1000000, status: 'aktif', sejak: '2025' },
  { id: 'K04', nama: 'Bude Eni', penyewa: 'Bude Eni', hp: '0813-1234-5678', sewa: 500000, status: 'aktif', sejak: '2024' },
  { id: 'K05', nama: 'Bude Ghina', penyewa: 'Bude Ghina', hp: '0857-2345-6789', sewa: 500000, status: 'aktif', sejak: '2025' },
  { id: 'K06', nama: 'Warung Tegal', penyewa: 'Pak Tegal', hp: '0821-3456-7890', sewa: 500000, status: 'aktif', sejak: '2024' },
  { id: 'K07', nama: 'Minuman Segar', penyewa: 'Mas Dika', hp: '0878-4567-8901', sewa: 500000, status: 'aktif', sejak: '2025' },
  { id: 'K08', nama: 'Kantin Bu Siti', penyewa: 'Bu Siti', hp: '0812-5678-9012', sewa: 1000000, status: 'aktif', sejak: '2024' },
  { id: 'K09', nama: 'Snack Corner', penyewa: 'Mbak Rina', hp: '0856-6789-0123', sewa: 500000, status: 'aktif', sejak: '2025' },
  { id: 'K10', nama: 'Warung Pak Joko', penyewa: 'Pak Joko', hp: '0813-7890-1234', sewa: 1000000, status: 'aktif', sejak: '2024' },
  { id: 'K11', nama: 'Es Campur Mak Ijah', penyewa: 'Mak Ijah', hp: '0821-8901-2345', sewa: 500000, status: 'aktif', sejak: '2024' },
  { id: 'K12', nama: 'Nasi Goreng Spesial', penyewa: 'Pak Agus', hp: '0878-9012-3456', sewa: 500000, status: 'aktif', sejak: '2025' },
];

// ---- Dummy Data: Setoran Hari Ini ----
const SETORAN_HARI_INI = [
  { kiosId: 'K01', nama: 'Kantin Berkah', nominal: 50000, metode: 'Tunai', waktu: '08:30', status: 'setor' },
  { kiosId: 'K04', nama: 'Bude Eni', nominal: 50000, metode: 'Tunai', waktu: '08:45', status: 'setor' },
  { kiosId: 'K05', nama: 'Bude Ghina', nominal: 50000, metode: 'Tunai', waktu: '09:00', status: 'setor' },
  { kiosId: 'K03', nama: 'Warung Sehat', nominal: 50000, metode: 'Transfer', waktu: '09:15', status: 'setor' },
  { kiosId: 'K07', nama: 'Minuman Segar', nominal: 25000, metode: 'Tunai', waktu: '09:30', status: 'setor' },
  { kiosId: 'K09', nama: 'Snack Corner', nominal: 25000, metode: 'Tunai', waktu: '09:45', status: 'setor' },
  { kiosId: 'K10', nama: 'Warung Pak Joko', nominal: 50000, metode: 'Tunai', waktu: '10:00', status: 'setor' },
  { kiosId: 'K11', nama: 'Es Campur Mak Ijah', nominal: 50000, metode: 'Tunai', waktu: '10:15', status: 'setor' },
  { kiosId: 'K12', nama: 'Nasi Goreng Spesial', nominal: 50000, metode: 'Tunai', waktu: '10:30', status: 'setor' },
  { kiosId: 'K08', nama: 'Kantin Bu Siti', nominal: 50000, metode: 'Tunai', waktu: '10:45', status: 'setor' },
  { kiosId: 'K06', nama: 'Warung Tegal', nominal: 0, metode: null, waktu: null, status: 'libur' },
  { kiosId: 'K02', nama: 'Kios K02', nominal: 0, metode: null, waktu: null, status: 'libur' },
];

// ---- Dummy Data: Rekap Bulanan (Admin) ----
const REKAP_KIOS_BULANAN = [
  { kiosId: 'K01', nama: 'Kantin Berkah', setor: 1100000, sewa: 1000000, status: 'surplus' },
  { kiosId: 'K08', nama: 'Kantin Bu Siti', setor: 850000, sewa: 1000000, status: 'kurang' },
  { kiosId: 'K10', nama: 'Warung Pak Joko', setor: 1000000, sewa: 1000000, status: 'lunas' },
  { kiosId: 'K07', nama: 'Minuman Segar', setor: 500000, sewa: 500000, status: 'lunas' },
  { kiosId: 'K03', nama: 'Warung Sehat', setor: 1050000, sewa: 1000000, status: 'surplus' },
  { kiosId: 'K04', nama: 'Bude Eni', setor: 500000, sewa: 500000, status: 'lunas' },
  { kiosId: 'K05', nama: 'Bude Ghina', setor: 500000, sewa: 500000, status: 'lunas' },
  { kiosId: 'K06', nama: 'Warung Tegal', setor: 450000, sewa: 500000, status: 'kurang' },
  { kiosId: 'K09', nama: 'Snack Corner', setor: 500000, sewa: 500000, status: 'lunas' },
  { kiosId: 'K11', nama: 'Es Campur Mak Ijah', setor: 500000, sewa: 500000, status: 'lunas' },
  { kiosId: 'K12', nama: 'Nasi Goreng Spesial', setor: 500000, sewa: 500000, status: 'lunas' },
];

// ---- Dummy Data: Tenant Rekap Bulanan ----
const TENANT_REKAP = [
  { bulan: 'Agustus 2026', setor: 850000, sewa: 1000000, status: 'berjalan', hariAktif: 17, hariLibur: 0, progress: 85 },
  { bulan: 'Juli 2026', setor: 1100000, sewa: 1000000, status: 'lunas', hariAktif: 22, hariLibur: 9, saldo: 100000 },
  { bulan: 'Juni 2026', setor: 950000, sewa: 1000000, status: 'kurang', hariAktif: 19, hariLibur: 11, selisih: -50000 },
  { bulan: 'Mei 2026', setor: 1000000, sewa: 1000000, status: 'lunas', hariAktif: 21, hariLibur: 10, saldo: 0 },
];

// ---- Dummy Data: Riwayat Setoran Tenant ----
const TENANT_RIWAYAT = [
  { tanggal: '17 Agu', hari: 'Senin', waktu: '14:30 WIB', nominal: 50000, tipe: 'setor' },
  { tanggal: '16 Agu', hari: 'Minggu', waktu: null, nominal: 0, tipe: 'libur', keterangan: 'Libur Akhir Pekan' },
  { tanggal: '15 Agu', hari: 'Sabtu', waktu: '13:15 WIB', nominal: 50000, tipe: 'setor' },
  { tanggal: '14 Agu', hari: 'Jumat', waktu: '10:15 WIB', nominal: 50000, tipe: 'setor' },
  { tanggal: '13 Agu', hari: 'Kamis', waktu: '11:00 WIB', nominal: 50000, tipe: 'setor' },
  { tanggal: '12 Agu', hari: 'Rabu', waktu: '09:30 WIB', nominal: 50000, tipe: 'setor' },
  { tanggal: '11 Agu', hari: 'Selasa', waktu: '10:00 WIB', nominal: 50000, tipe: 'setor' },
  { tanggal: '10 Agu', hari: 'Senin', waktu: '08:45 WIB', nominal: 50000, tipe: 'setor' },
  { tanggal: '9 Agu', hari: 'Minggu', waktu: null, nominal: 0, tipe: 'libur', keterangan: 'Libur Akhir Pekan' },
];

// ---- Backend API Configuration ----
const API_BASE_URL = 'http://localhost:5000/api';

// ---- Auth Functions (Connected to Backend API with fallback) ----
async function login(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('siseka_token', data.token);
      localStorage.setItem('siseka_user', JSON.stringify(data.user));
      return data.user;
    } else {
      console.warn('Login gagal:', data.message);
      return null;
    }
  } catch (err) {
    console.warn('Backend offline / fetch error, menggunakan fallback lokal:', err);
    // Fallback jika backend belum dinyalakan
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('siseka_user', JSON.stringify(user));
      return user;
    }
    return null;
  }
}

function getAuthToken() {
  return localStorage.getItem('siseka_token');
}

function logout() {
  localStorage.removeItem('siseka_token');
  localStorage.removeItem('siseka_user');
  window.location.href = getBasePath() + 'login.html';
}

function getCurrentUser() {
  const data = localStorage.getItem('siseka_user');
  return data ? JSON.parse(data) : null;
}

function requireAuth(requiredRole) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = getBasePath() + 'login.html';
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    window.location.href = getBasePath() + (user.role === 'admin' ? 'admin/penarikan.html' : 'tenant/beranda.html');
    return null;
  }
  return user;
}


// ---- Utility Functions ----
function formatRupiah(angka) {
  if (angka === 0) return 'Rp 0';
  return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatRupiahShort(angka) {
  if (angka >= 1000000) return 'Rp ' + (angka / 1000000).toFixed(angka % 1000000 === 0 ? 0 : 1) + ' Jt';
  if (angka >= 1000) return 'Rp ' + Math.round(angka / 1000) + 'k';
  return formatRupiah(angka);
}

function getTodayString() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getTodayShort() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
}

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/admin/') || path.includes('/tenant/')) {
    return '../';
  }
  return './';
}

// ---- WhatsApp Share ----
function generateWAReport() {
  const today = getTodayString();
  const setoranList = SETORAN_HARI_INI.filter(s => s.status === 'setor');
  const total = setoranList.reduce((sum, s) => sum + s.nominal, 0);

  let msg = `Assalamu'alaikum...\n${today}\n\nLaporan Setoran Harian:\n`;
  setoranList.forEach((s, i) => {
    msg += `${i + 1}. ${s.nama}: ${formatRupiah(s.nominal)}\n`;
  });
  msg += `\nTotal: ${formatRupiah(total)}`;
  msg += `\n\nSISEKA WASI'I • BPH Masjid Al-Wasi'i`;

  return msg;
}

function shareToWhatsApp() {
  const msg = encodeURIComponent(generateWAReport());
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

// ---- SVG Icons ----
function getWhatsAppSVG(size = 16) {
  return `<svg width="${size}" height="${size}" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"></path></svg>`;
}
