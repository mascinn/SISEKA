require('dotenv').config();
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const { initDatabase, runAsync, getAsync, allAsync, db } = require('../database');

const TENANTS_CONFIG = [
  {
    kioskId: '01',
    username: 'kantinalwasii',
    passwordRaw: 'kantinalwasii01',
    namaKantin: 'Kantin Al-Wasii',
    namaPenyewa: 'Bude Eni',
    initials: 'BE',
    phone: '082375366631',
    tarifSewa: 1650000,
    sheetName: 'Kantin Al-Wasii(Bude Eni)'
  },
  {
    kioskId: '02',
    username: 'kantinkurnia',
    passwordRaw: 'kantinkurnia02',
    namaKantin: 'Kantin Kurnia',
    namaPenyewa: 'Bude Ghina',
    initials: 'BG',
    phone: '088267104559',
    tarifSewa: 1350000,
    sheetName: 'Kantin Kurnia (Bude Ghina)'
  },
  {
    kioskId: '03',
    username: 'aleafcom',
    passwordRaw: 'aleafcom03',
    namaKantin: 'Fotocopy Aleaf.com',
    namaPenyewa: 'Mas Budi',
    initials: 'MB',
    phone: '085978000592',
    tarifSewa: 1200000,
    sheetName: 'Fotocopy Aleaf.com (Mas Budi)'
  },
  {
    kioskId: '04',
    username: 'biascom',
    passwordRaw: 'biascom04',
    namaKantin: 'Fotocopy Bias.com',
    namaPenyewa: 'Mas Ipul',
    initials: 'MI',
    phone: '081367999075',
    tarifSewa: 600000,
    sheetName: 'Fotocopy Bias.com (Mas Ipul)'
  },
  {
    kioskId: '05',
    username: 'warungferry',
    passwordRaw: 'warungferry',
    namaKantin: 'Warung Om Ferry',
    namaPenyewa: 'Om Ferry',
    initials: 'OF',
    phone: '081379205977',
    tarifSewa: 1200000,
    sheetName: 'Warung Om Ferry'
  }
];

const MONTH_COORDINATES = [
  { name: 'JANUARI', headerRow: 26, startCol: 1, monthNum: 1 },
  { name: 'FEBRUARI', headerRow: 26, startCol: 7, monthNum: 2 },
  { name: 'MARET', headerRow: 26, startCol: 13, monthNum: 3 },
  { name: 'APRIL', headerRow: 58, startCol: 1, monthNum: 4 },
  { name: 'MEI', headerRow: 58, startCol: 7, monthNum: 5 },
  { name: 'JUNI', headerRow: 58, startCol: 13, monthNum: 6 },
  { name: 'JULI', headerRow: 90, startCol: 1, monthNum: 7 },
  { name: 'AGUSTUS', headerRow: 90, startCol: 7, monthNum: 8 }
];

// Helper: Generate array of dates YYYY-MM-DD from startDate to endDate
function generateDateRange(startDateStr, endDateStr) {
  const dates = [];
  let curr = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    const dayOfWeek = curr.getDay(); // 0: Minggu, 6: Sabtu
    dates.push({
      dateStr: `${y}-${m}-${d}`,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayName: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'][dayOfWeek]
    });
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

// Helper run batch statements
async function executeBatch(statements) {
  const isTurso = Boolean(process.env.TURSO_DATABASE_URL);
  if (isTurso && typeof db.batch === 'function') {
    // Chunking 100 statements
    const chunkSize = 100;
    for (let i = 0; i < statements.length; i += chunkSize) {
      const chunk = statements.slice(i, i + chunkSize);
      await db.batch(chunk);
    }
  } else {
    for (const stmt of statements) {
      await runAsync(stmt.sql, stmt.args);
    }
  }
}

async function runImport() {
  console.log('🚀 Memulai proses Import Lengkap (Termasuk Libur Akhir Pekan) ke Database SISEKA...');

  // 1. Inisialisasi Database (Reset bersih)
  await initDatabase(true);

  // Pastikan Admin BPH ada
  const adminCheck = await getAsync("SELECT * FROM users WHERE username = 'bph'");
  if (!adminCheck) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('barengbareng', salt);
    await runAsync(
      'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
      ['bph', hash, 'admin', "Pengurus BPH Masjid Al-Wasi'i", 'BP']
    );
  }

  // 2. Baca file Excel
  const excelPath = path.join(__dirname, '../../KEUANGAN KANTIN MASJID AL WASII 2026.xlsx');
  console.log('📂 Membaca file Excel:', excelPath);
  const wb = xlsx.readFile(excelPath);

  const salt = await bcrypt.genSalt(10);
  const fullCalendar = generateDateRange('2026-01-01', '2026-08-19');
  console.log(`📅 Total rentang kalender: ${fullCalendar.length} hari (01 Jan 2026 - 19 Agt 2026).`);

  let totalDepositsInserted = 0;
  let totalSetorCount = 0;
  let totalLiburCount = 0;

  // 3. Proses tiap tenant
  for (const tenant of TENANTS_CONFIG) {
    console.log(`\n🏢 Memproses Unit ${tenant.kioskId}: ${tenant.namaKantin} (${tenant.namaPenyewa})...`);

    // A. Buat Akun User Tenant
    const hashPass = await bcrypt.hash(tenant.passwordRaw, salt);
    const userRes = await runAsync(
      'INSERT INTO users (username, password, role, name, initials) VALUES (?, ?, ?, ?, ?)',
      [tenant.username, hashPass, 'tenant', tenant.namaPenyewa, tenant.initials]
    );

    const userId = userRes.lastID;

    // B. Buat Data Kios
    await runAsync(
      `INSERT INTO kiosks (id, user_id, nama_kantin, nama_penyewa, nomor_hp, tarif_sewa, status, sejak) 
       VALUES (?, ?, ?, ?, ?, ?, 'aktif', '01 Jan 2026')`,
      [tenant.kioskId, userId, tenant.namaKantin, tenant.namaPenyewa, tenant.phone, tenant.tarifSewa]
    );
    console.log(`   ✅ Akun User [${tenant.username}] & Kios [Unit ${tenant.kioskId}] berhasil didaftarkan.`);

    // C. Baca Riwayat Excel ke Map
    const sheet = wb.Sheets[tenant.sheetName];
    const excelDataMap = new Map(); // dateStr -> { nominal, ket }

    if (sheet) {
      const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      for (const m of MONTH_COORDINATES) {
        const dataStartRow = m.headerRow + 2;
        const dataEndRow = dataStartRow + 31;

        for (let r = dataStartRow; r < dataEndRow && r < sheetData.length; r++) {
          const row = sheetData[r];
          if (!row) continue;

          const dateSerial = row[m.startCol + 1];
          if (dateSerial === undefined || dateSerial === null || dateSerial === '') continue;

          let dateStr = '';
          if (typeof dateSerial === 'number') {
            const parsed = xlsx.SSF.parse_date_code(dateSerial);
            dateStr = `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
          } else {
            continue;
          }

          const ketVal = row[m.startCol + 2] ? String(row[m.startCol + 2]).trim() : '';
          const setoranVal = Number(row[m.startCol + 3]) || 0;

          excelDataMap.set(dateStr, {
            nominal: setoranVal,
            ket: ketVal
          });
        }
      }
    }

    // D. Susun Batch Insert untuk setiap hari kalender penuh (termasuk Sabtu & Minggu)
    const depositStatements = [];
    let tenantNominalSum = 0;
    let tenantSetor = 0;
    let tenantLibur = 0;

    for (const cal of fullCalendar) {
      const excelEntry = excelDataMap.get(cal.dateStr);

      let nominal = 0;
      let status = 'libur';
      let catatan = '';
      let metode = null;

      if (excelEntry) {
        nominal = excelEntry.nominal;
        status = nominal > 0 ? 'setor' : 'libur';
        metode = status === 'setor' ? 'Tunai' : null;
        catatan = excelEntry.ket || (status === 'libur' ? 'Libur / Tutup' : `Setoran ${cal.dayName}`);
      } else {
        // Tidak ada di sheet (Sabtu, Minggu, atau hari libur lainnya)
        nominal = 0;
        status = 'libur';
        metode = null;
        catatan = cal.isWeekend ? `Libur Akhir Pekan (${cal.dayName})` : 'Libur Operasional';
      }

      if (status === 'setor') {
        tenantSetor++;
        totalSetorCount++;
        tenantNominalSum += nominal;
      } else {
        tenantLibur++;
        totalLiburCount++;
      }

      depositStatements.push({
        sql: `INSERT INTO deposits (kiosk_id, tanggal, waktu, nominal, status, metode, catatan) VALUES (?, ?, '16:00', ?, ?, ?, ?)`,
        args: [tenant.kioskId, cal.dateStr, nominal, status, metode, catatan]
      });
    }

    // Eksekusi Batch Insert ke Database
    await executeBatch(depositStatements);
    totalDepositsInserted += depositStatements.length;

    console.log(`   📊 ${depositStatements.length} total hari tercatat: ${tenantSetor} hari Setor, ${tenantLibur} hari Libur (Total: Rp ${tenantNominalSum.toLocaleString('id-ID')}).`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 IMPORT LENGKAP SELESAI DENGAN SUKSES!`);
  console.log(`Total Unit Usaha: ${TENANTS_CONFIG.length}`);
  console.log(`Total Catatan Setoran Diimpor: ${totalDepositsInserted} data`);
  console.log(`  - Total Hari Setor : ${totalSetorCount} record`);
  console.log(`  - Total Hari Libur : ${totalLiburCount} record (termasuk Sabtu & Minggu)`);
  console.log(`======================================================\n`);
}

runImport().then(() => {
  console.log('✅ Selesai.');
  process.exit(0);
}).catch(err => {
  console.error('❌ Terjadi kesalahan saat import:', err);
  process.exit(1);
});
