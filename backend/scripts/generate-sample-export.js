const path = require('path');
const xlsx = require('xlsx');
const { allAsync } = require('../database');

const MONTHS_NAMES = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL',
  'MEI', 'JUNI', 'JULI', 'AGUSTUS',
  'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

async function generateMonthlyBlocksSpreadsheet() {
  console.log('📊 Membuat file Excel dengan format TABEL PER BULAN...');

  const wb = xlsx.utils.book_new();

  const kiosks = await allAsync(`SELECT * FROM kiosks ORDER BY id ASC`);
  const allDeposits = await allAsync(`SELECT * FROM deposits ORDER BY tanggal ASC, id ASC`);

  // ==========================================
  // SHEET 1: REKAP EKSEKUTIF SEMUA UNIT (JAN - AGT)
  // ==========================================
  const summaryRows = [
    ['SISTEM INFORMASI SETORAN SEWA KANTIN (SISEKA WASI\'I)'],
    ['BPH MASJID AL-WASI\'I • REKAPITULASI KEUANGAN TAHUN 2026'],
    [],
    ['No', 'ID Unit', 'Nama Kantin / Unit Usaha', 'Penyewa', 'Tarif Sewa/Bln', 'Total Setor (Jan-Agt)', 'Target Sewa (Jan-Agt)', 'Saldo (Jan-Agt)', 'Status']
  ];

  let totalSemuaSetor = 0;
  let totalSemuaTarget = 0;

  kiosks.forEach((k, idx) => {
    const kDeposits = allDeposits.filter(d => d.kiosk_id === k.id);
    const sumNominal = kDeposits.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
    const targetJanAgt = (k.tarif_sewa || 0) * 8;
    const saldo = sumNominal - targetJanAgt;
    const status = saldo >= 0 ? (saldo === 0 ? 'Lunas' : 'Surplus') : 'Kurang Bayar';

    totalSemuaSetor += sumNominal;
    totalSemuaTarget += targetJanAgt;

    summaryRows.push([
      idx + 1,
      k.id,
      k.nama_kantin,
      k.nama_penyewa,
      k.tarif_sewa,
      sumNominal,
      targetJanAgt,
      saldo,
      status
    ]);
  });

  summaryRows.push([]);
  summaryRows.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    totalSemuaSetor,
    totalSemuaTarget,
    totalSemuaSetor - totalSemuaTarget,
    totalSemuaSetor >= totalSemuaTarget ? 'Surplus' : 'Defisit'
  ]);

  const wsSummary = xlsx.utils.aoa_to_sheet(summaryRows);
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Semua Unit');

  // ==========================================
  // SHEET 2-6: TAB PER UNIT USAHA (DENGAN TABEL KHUSUS PER BULAN)
  // ==========================================
  for (const k of kiosks) {
    const kDeposits = allDeposits.filter(d => d.kiosk_id === k.id);
    const kRows = [];

    // Header Unit
    kRows.push([`KANTIN / UNIT USAHA: ${k.nama_kantin.toUpperCase()}`]);
    kRows.push([`Nama Penyewa: ${k.nama_penyewa}`, '', `Nomor HP: ${k.nomor_hp || '-'}`]);
    kRows.push([`Tarif Sewa: Rp ${(k.tarif_sewa || 0).toLocaleString('id-ID')} / Bulan`, '', `Tahun Buku: 2026`]);
    kRows.push([]);

    // Loop Bulan 1 (Januari) sampai 8 (Agustus)
    for (let m = 1; m <= 8; m++) {
      const mStr = String(m).padStart(2, '0');
      const mCode = `2026-${mStr}`;
      const monthName = MONTHS_NAMES[m - 1];

      const mDeposits = kDeposits.filter(d => d.tanggal.startsWith(mCode));
      const mTotalSetoran = mDeposits.reduce((acc, curr) => acc + (curr.nominal || 0), 0);
      const mHariSetor = mDeposits.filter(d => d.status === 'setor').length;
      const mHariLibur = mDeposits.filter(d => d.status === 'libur').length;
      const mSaldo = mTotalSetoran - k.tarif_sewa;
      const mStatus = mSaldo >= 0 ? (mSaldo === 0 ? 'LUNAS' : `SURPLUS (+Rp ${mSaldo.toLocaleString('id-ID')})`) : `KURANG (-Rp ${Math.abs(mSaldo).toLocaleString('id-ID')})`;

      // Judul Tabel Bulan
      kRows.push([`==================== TABEL SETORAN: ${monthName} 2026 ====================`]);
      kRows.push(['No', 'Hari/Tanggal', 'Jam', 'Status', 'Nominal Setor (Rp)', 'Keterangan']);

      mDeposits.forEach((d, idx) => {
        const dObj = new Date(`${d.tanggal}T00:00:00`);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
        const dayName = days[dObj.getDay()];

        kRows.push([
          idx + 1,
          `${dayName}, ${d.tanggal}`,
          d.waktu || '16:00',
          d.status.toUpperCase(),
          d.nominal,
          d.catatan || (d.status === 'libur' ? 'Libur' : 'Setor')
        ]);
      });

      // Baris Total & Rekap di Bawah Setiap Tabel Bulan
      kRows.push([
        `TOTAL ${monthName}`,
        `${mHariSetor} Hari Setor, ${mHariLibur} Hari Libur`,
        '',
        'TOTAL:',
        mTotalSetoran,
        `Target: Rp ${(k.tarif_sewa).toLocaleString('id-ID')} | Saldo: ${mStatus}`
      ]);
      kRows.push([]); // Spasi pemisah antar bulan
    }

    const safeSheetTitle = k.nama_kantin.replace(/[\/\\\?\*\[\]]/g, '').substring(0, 30);
    const wsKiosk = xlsx.utils.aoa_to_sheet(kRows);
    xlsx.utils.book_append_sheet(wb, wsKiosk, safeSheetTitle);
  }

  const outputPath = path.join(__dirname, '../../HASIL_EXPORT_SPREADSHEET_SISEKA_2026_TABEL_BULANAN.xlsx');
  xlsx.writeFile(wb, outputPath);
  console.log('✅ File Excel tabel-per-bulan berhasil dibuat:', outputPath);
}

generateMonthlyBlocksSpreadsheet().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
