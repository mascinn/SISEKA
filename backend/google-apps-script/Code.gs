/**
 * =========================================================================
 * SISEKA - GOOGLE APPS SCRIPT WEBHOOK ENGINE
 * Sistem Informasi Setoran Sewa Kantin - Masjid Al-Wasi'i
 * =========================================================================
 */

const TARGET_SPREADSHEET_ID = '1gn-bMpqieiROnOWAGpxl8EZKjvtQxILDmpts9Ue8idw';

function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  return SpreadsheetApp.openById(TARGET_SPREADSHEET_ID);
}

function padRow(arr, len) {
  const res = arr ? arr.slice() : [];
  while (res.length < len) {
    res.push('');
  }
  return res;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    let payload;
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Tidak ada data payload yang diterima.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = getSpreadsheet();
    const tahun = payload.tahun || '2026';

    // 1. UPDATE SHEET RINGKASAN EKSEKUTIF SEMUA UNIT
    updateSummarySheet(ss, payload);

    // 2. UPDATE SHEET PER UNIT USAHA (RINGKASAN BULANAN DI ATAS + TABEL TERPISAH PER BULAN DI BAWAH)
    if (payload.kiosks && Array.isArray(payload.kiosks)) {
      payload.kiosks.forEach(function(kiosk) {
        updateKioskSheet(ss, kiosk, tahun);
      });
    }

    // Pastikan Sheet Ringkasan ada di urutan pertama dan aktif
    const summarySheet = ss.getSheetByName('Ringkasan Semua Unit');
    if (summarySheet) {
      ss.setActiveSheet(summarySheet);
      ss.moveActiveSheet(1);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Sinkronisasi Berhasil!',
      updatedAt: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    system: 'SISEKA Google Sheets Auto-Sync Webhook',
    spreadsheetId: TARGET_SPREADSHEET_ID
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Update Sheet 1: Ringkasan Semua Unit (Akumulasi Tahunan + Matriks Bulanan Semua Unit)
 */
function updateSummarySheet(ss, payload) {
  let sheet = ss.getSheetByName('Ringkasan Semua Unit');
  if (!sheet) {
    sheet = ss.insertSheet('Ringkasan Semua Unit', 0);
  }
  sheet.clear();
  sheet.setTabColor('#003820');

  const tahun = payload.tahun || '2026';
  const kiosks = payload.kiosks || [];
  const sampleKiosk = kiosks[0];
  const monthList = (sampleKiosk && sampleKiosk.monthly_tables) ? sampleKiosk.monthly_tables.map(function(m) { return m.bulan_nama; }) : [];
  const monthAbbrs = monthList.map(function(mName) {
    return mName.split(' ')[0].substring(0, 3);
  });
  const matrixColCount = Math.max(10, 3 + monthAbbrs.length + 2);
  const rows = [];

  // 1. Header Judul
  rows.push(padRow(['SISTEM INFORMASI SETORAN SEWA KANTIN (SISEKA WASI\'I)'], matrixColCount));
  rows.push(padRow(['BPH MASJID AL-WASI\'I • REKAPITULASI KEUANGAN TAHUN ' + tahun], matrixColCount));
  rows.push(padRow(['Terakhir Diperbarui: ' + Utilities.formatDate(new Date(), 'GMT+7', 'dd MMMM yyyy HH:mm:ss') + ' WIB'], matrixColCount));
  rows.push(padRow([], matrixColCount));

  // 2. Tabel 1: Ringkasan Akumulasi Tahunan Semua Unit
  rows.push(padRow(['No', 'ID Unit', 'Nama Kantin / Unit Usaha', 'Penyewa', 'No HP', 'Tarif Sewa/Bln', 'Total Setor', 'Target Sewa', 'Saldo Keuangan', 'Status'], matrixColCount));

  if (payload.ringkasan_semua && Array.isArray(payload.ringkasan_semua)) {
    payload.ringkasan_semua.forEach(function(item, idx) {
      rows.push(padRow([
        idx + 1,
        item.kiosk_id,
        item.nama_kantin,
        item.nama_penyewa,
        item.nomor_hp || '-',
        item.tarif_sewa,
        item.total_setor,
        item.target_sewa,
        item.saldo,
        item.status
      ], matrixColCount));
    });
  }

  // Baris Total Akumulasi
  const totalSetor = payload.total_semua_setor || 0;
  const totalTarget = payload.total_semua_target || 0;
  const totalSaldo = totalSetor - totalTarget;
  rows.push(padRow([
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    totalSetor,
    totalTarget,
    totalSaldo,
    totalSaldo >= 0 ? (totalSaldo === 0 ? 'LUNAS' : 'SURPLUS') : 'KURANG BAYAR'
  ], matrixColCount));

  // Spasi Pemisah
  rows.push(padRow([], matrixColCount));
  rows.push(padRow([], matrixColCount));

  // 3. Tabel 2: Matriks Setoran Bulanan Semua Kantin (Januari s.d. Bulan Berjalan)
  const matrixStartRow = rows.length + 1;

  // Banner Judul Matriks
  rows.push(padRow(['MATRIKS SETORAN BULANAN SELURUH UNIT USAHA (TAHUN ' + tahun + ')'], matrixColCount));

  // Header Kolom Matriks
  const matrixHeader = ['No', 'Nama Kantin / Unit Usaha', 'Tarif/Bln'].concat(monthAbbrs).concat(['Total Setor', 'Kekurangan']);
  rows.push(padRow(matrixHeader, matrixColCount));

  const monthlyTotals = new Array(monthAbbrs.length).fill(0);
  let matrixTotalTarif = 0;
  let matrixTotalSetor = 0;
  let matrixTotalKurang = 0;

  kiosks.forEach(function(k, idx) {
    const kTables = k.monthly_tables || [];
    const kTarif = k.tarif_sewa || 0;
    let kTotalSetor = 0;
    let kTargetYtd = 0;

    const rowData = [idx + 1, k.nama_kantin, kTarif];

    monthAbbrs.forEach(function(_, mIdx) {
      const mData = kTables[mIdx];
      const mSetor = mData ? (mData.total_setor || 0) : 0;
      rowData.push(mSetor);
      monthlyTotals[mIdx] += mSetor;
      kTotalSetor += mSetor;
      kTargetYtd += kTarif;
    });

    const kSaldo = kTotalSetor - kTargetYtd;
    const kKurang = kSaldo < 0 ? Math.abs(kSaldo) : 0;

    rowData.push(kTotalSetor);
    rowData.push(kKurang > 0 ? -kKurang : 0);

    matrixTotalTarif += kTarif;
    matrixTotalSetor += kTotalSetor;
    matrixTotalKurang += kKurang;

    rows.push(padRow(rowData, matrixColCount));
  });

  // Baris Total Matriks
  const matrixTotalRow = ['TOTAL SETORAN MASJID', '', matrixTotalTarif].concat(monthlyTotals).concat([matrixTotalSetor, matrixTotalKurang > 0 ? -matrixTotalKurang : 0]);
  rows.push(padRow(matrixTotalRow, matrixColCount));

  // Tulis ke sheet
  sheet.getRange(1, 1, rows.length, matrixColCount).setValues(rows);

  // --- STYLING SHEET RINGKASAN ---
  // Header Judul Banner
  sheet.getRange(1, 1, 1, matrixColCount).merge().setBackground('#003820').setFontColor('#ffffff').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  sheet.getRange(2, 1, 1, matrixColCount).merge().setBackground('#004D2C').setFontColor('#e2e8f0').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');
  sheet.getRange(3, 1, 1, matrixColCount).merge().setBackground('#f8fafc').setFontColor('#64748b').setFontSize(9).setHorizontalAlignment('center');

  // Header Tabel 1
  sheet.getRange('A5:J5').setBackground('#0A5C36').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');

  // Format Angka & Border Data Tabel 1
  const dataStart = 6;
  const dataCount = (payload.ringkasan_semua || []).length;
  if (dataCount > 0) {
    const dataRange = sheet.getRange(dataStart, 1, dataCount, 10);
    dataRange.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
    dataRange.setFontSize(9.5);

    // Format Currency Rupiah kolom 6..9
    sheet.getRange(dataStart, 6, dataCount, 4).setNumberFormat('"Rp"#,##0');
    // Alignments
    sheet.getRange(dataStart, 1, dataCount, 2).setHorizontalAlignment('center');
    sheet.getRange(dataStart, 5, dataCount, 1).setHorizontalAlignment('center');
    sheet.getRange(dataStart, 10, dataCount, 1).setHorizontalAlignment('center').setFontWeight('bold');
  }

  // Styling Baris Total Tabel 1
  const totalRowIndex = dataStart + dataCount;
  const totalRange = sheet.getRange(totalRowIndex, 1, 1, 10);
  sheet.getRange(totalRowIndex, 1, 1, 6).merge();
  totalRange.setBackground('#E8F5E9').setFontWeight('bold').setFontColor('#003820').setBorder(true, true, true, true, true, true, '#003820', SpreadsheetApp.BorderStyle.DOUBLE);
  sheet.getRange(totalRowIndex, 7, 1, 3).setNumberFormat('"Rp"#,##0');
  sheet.getRange(totalRowIndex, 10).setHorizontalAlignment('center');

  // Styling Tabel 2: Matriks Bulanan
  sheet.getRange(matrixStartRow, 1, 1, matrixColCount).merge().setBackground('#003820').setFontColor('#ffffff').setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');
  sheet.getRange(matrixStartRow + 1, 1, 1, matrixColCount).setBackground('#0A5C36').setFontColor('#ffffff').setFontWeight('bold').setFontSize(9.5).setHorizontalAlignment('center');

  const matrixDataCount = kiosks.length;
  if (matrixDataCount > 0) {
    const mDataRange = sheet.getRange(matrixStartRow + 2, 1, matrixDataCount, matrixColCount);
    mDataRange.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
    mDataRange.setFontSize(9);

    // Format Currency untuk tarif, bulan-bulan, total setor, dan kurang
    sheet.getRange(matrixStartRow + 2, 3, matrixDataCount, matrixColCount - 2).setNumberFormat('"Rp"#,##0');
    sheet.getRange(matrixStartRow + 2, 1, matrixDataCount, 1).setHorizontalAlignment('center');
  }

  // Styling Baris Total Matriks
  const matrixTotalRowIndex = matrixStartRow + 2 + matrixDataCount;
  const mTotalRange = sheet.getRange(matrixTotalRowIndex, 1, 1, matrixColCount);
  sheet.getRange(matrixTotalRowIndex, 1, 1, 2).merge();
  mTotalRange.setBackground('#E8F5E9').setFontWeight('bold').setFontColor('#003820').setBorder(true, true, true, true, true, true, '#003820', SpreadsheetApp.BorderStyle.DOUBLE);
  sheet.getRange(matrixTotalRowIndex, 3, 1, matrixColCount - 2).setNumberFormat('"Rp"#,##0');

  // Auto-fit kolom
  for (let c = 1; c <= matrixColCount; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * Update Sheet Per Kios dengan Tabel Ringkasan Bulanan di Atas + Tabel Terpisah Per Bulan di Bawah
 */
function updateKioskSheet(ss, kiosk, tahun) {
  const safeTitle = (kiosk.nama_kantin || 'Kantin').replace(/[\/\\\?\*\[\]]/g, '').substring(0, 30);
  let sheet = ss.getSheetByName(safeTitle);
  if (!sheet) {
    sheet = ss.insertSheet(safeTitle);
  }
  sheet.clear();
  sheet.setTabColor('#0A5C36');

  const rows = [];
  // 1. Profil Info Kios (Baris 1 - 3)
  rows.push(padRow(['UNIT USAHA: ' + kiosk.nama_kantin.toUpperCase()], 6));
  rows.push(padRow(['Penyewa: ' + kiosk.nama_penyewa, '', 'No HP: ' + (kiosk.nomor_hp || '-'), '', 'Tarif Sewa: Rp ' + Number(kiosk.tarif_sewa || 0).toLocaleString('id-ID') + ' / Bulan'], 6));
  rows.push(padRow(['Tahun Buku: ' + tahun, '', 'Terakhir Diperbarui: ' + Utilities.formatDate(new Date(), 'GMT+7', 'dd MMMM yyyy HH:mm:ss') + ' WIB'], 6));
  rows.push(padRow([], 6));

  const monthlyTables = kiosk.monthly_tables || [];

  // 2. TABEL RINGKASAN SETORAN PER BULAN (Baris 5 s.d. N)
  const summaryStartRow = rows.length + 1; // Baris 5
  rows.push(padRow(['RINGKASAN SETORAN PER BULAN (TAHUN ' + tahun + ')'], 6)); // Baris 5
  rows.push(padRow(['No', 'Periode Bulan', 'Target Sewa', 'Total Setor', 'Kurang / Surplus', 'Status'], 6)); // Baris 6

  let sumTargetYtd = 0;
  let sumSetorYtd = 0;

  monthlyTables.forEach(function(mTable, idx) {
    const mTarget = mTable.target_sewa || 0;
    const mSetor = mTable.total_setor || 0;
    const mSaldo = mTable.saldo !== undefined ? mTable.saldo : (mSetor - mTarget);
    sumTargetYtd += mTarget;
    sumSetorYtd += mSetor;

    let mStatus = 'KURANG';
    if (mSaldo > 0) mStatus = 'SURPLUS';
    else if (mSaldo === 0) mStatus = 'LUNAS';

    rows.push(padRow([
      idx + 1,
      mTable.bulan_nama,
      mTarget,
      mSetor,
      mSaldo,
      mStatus
    ], 6));
  });

  const sumSaldoYtd = sumSetorYtd - sumTargetYtd;
  let statusYtd = 'KURANG BAYAR';
  if (sumSaldoYtd > 0) statusYtd = 'SURPLUS';
  else if (sumSaldoYtd === 0) statusYtd = 'LUNAS';

  const summaryDataCount = monthlyTables.length;
  const summaryTotalRowIndex = summaryStartRow + 2 + summaryDataCount;

  // Baris Total Ringkasan
  rows.push(padRow([
    'TOTAL AKUMULASI (YTD)',
    '',
    sumTargetYtd,
    sumSetorYtd,
    sumSaldoYtd,
    statusYtd
  ], 6));
  rows.push(padRow([], 6)); // Spasi baris kosong pemisah

  // 3. TABEL RINCIAN HARIAN PER BULAN
  const dailyTablesMeta = [];

  monthlyTables.forEach(function(mTable) {
    const startRow = rows.length + 1;

    // Header Bulan
    rows.push(padRow(['TABEL RINCIAN HARIAN: ' + mTable.bulan_nama.toUpperCase()], 6));
    // Header Kolom
    rows.push(padRow(['No', 'Hari / Tanggal', 'Jam', 'Status', 'Nominal (Rp)', 'Keterangan'], 6));

    const dailyRows = mTable.rows || [];
    dailyRows.forEach(function(dRow) {
      rows.push(padRow([
        dRow.no,
        dRow.hari + ', ' + dRow.tanggal,
        dRow.jam,
        dRow.status,
        dRow.nominal,
        dRow.keterangan
      ], 6));
    });

    // Baris Total Bulan
    const totalRow = padRow([
      'TOTAL ' + mTable.bulan_nama.toUpperCase(),
      mTable.hari_setor + ' Hari Setor | ' + mTable.hari_libur + ' Hari Libur',
      '',
      'TOTAL:',
      mTable.total_setor,
      'Target: Rp ' + Number(mTable.target_sewa).toLocaleString('id-ID') + ' | ' + mTable.status_keuangan
    ], 6);
    rows.push(totalRow);
    rows.push(padRow([], 6)); // Spasi baris kosong pemisah

    dailyTablesMeta.push({
      startRow: startRow,
      headerRow: startRow + 1,
      dataStartRow: startRow + 2,
      dataCount: dailyRows.length,
      totalRow: startRow + 2 + dailyRows.length
    });
  });

  // Tulis ke Sheet
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, 6).setValues(rows);
  }

  // --- STYLING ---
  // 1. Banner Info Kios
  sheet.getRange('A1:F1').merge().setBackground('#003820').setFontColor('#ffffff').setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
  sheet.getRange('A2:F2').setBackground('#f1f5f9').setFontSize(10).setFontWeight('bold');
  sheet.getRange('A3:F3').setBackground('#f8fafc').setFontSize(9).setFontColor('#64748b');

  // 2. Styling Tabel Ringkasan Bulanan (Di Atas)
  // Judul Ringkasan
  sheet.getRange(summaryStartRow, 1, 1, 6).merge().setBackground('#004D2C').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
  // Header Kolom Ringkasan
  sheet.getRange(summaryStartRow + 1, 1, 1, 6).setBackground('#0A5C36').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

  if (summaryDataCount > 0) {
    const sDataRange = sheet.getRange(summaryStartRow + 2, 1, summaryDataCount, 6);
    sDataRange.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
    sDataRange.setFontSize(9.5);

    // Format Rupiah kolom C (Target), D (Total Setor), E (Kurang/Surplus)
    sheet.getRange(summaryStartRow + 2, 3, summaryDataCount, 3).setNumberFormat('"Rp"#,##0');
    // Alignments
    sheet.getRange(summaryStartRow + 2, 1, summaryDataCount, 1).setHorizontalAlignment('center');
    sheet.getRange(summaryStartRow + 2, 2, summaryDataCount, 1).setFontWeight('bold');
    sheet.getRange(summaryStartRow + 2, 6, summaryDataCount, 1).setHorizontalAlignment('center').setFontWeight('bold');
  }

  // Baris Total Ringkasan (Total Akumulasi YTD)
  const sTotalRange = sheet.getRange(summaryTotalRowIndex, 1, 1, 6);
  sheet.getRange(summaryTotalRowIndex, 1, 1, 2).merge();
  sTotalRange.setBackground('#E8F5E9').setFontWeight('bold').setFontColor('#003820').setBorder(true, true, true, true, true, true, '#003820', SpreadsheetApp.BorderStyle.DOUBLE);
  sheet.getRange(summaryTotalRowIndex, 3, 1, 3).setNumberFormat('"Rp"#,##0');
  sheet.getRange(summaryTotalRowIndex, 6).setHorizontalAlignment('center');

  // 3. Styling Rincian Harian Per Bulan
  dailyTablesMeta.forEach(function(meta) {
    // Judul Bulan
    sheet.getRange(meta.startRow, 1, 1, 6).merge().setBackground('#004D2C').setFontColor('#ffffff').setFontWeight('bold').setFontSize(11).setHorizontalAlignment('left');
    
    // Header Kolom
    sheet.getRange(meta.headerRow, 1, 1, 6).setBackground('#0A5C36').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

    // Data Harian
    if (meta.dataCount > 0) {
      const dRange = sheet.getRange(meta.dataStartRow, 1, meta.dataCount, 6);
      dRange.setBorder(true, true, true, true, true, true, '#e2e8f0', SpreadsheetApp.BorderStyle.SOLID);
      dRange.setFontSize(9);

      // Alignment & format
      sheet.getRange(meta.dataStartRow, 1, meta.dataCount, 1).setHorizontalAlignment('center');
      sheet.getRange(meta.dataStartRow, 3, meta.dataCount, 2).setHorizontalAlignment('center');
      sheet.getRange(meta.dataStartRow, 5, meta.dataCount, 1).setNumberFormat('"Rp"#,##0');
    }

    // Baris Total Bulan
    const tRange = sheet.getRange(meta.totalRow, 1, 1, 6);
    tRange.setBackground('#E8F5E9').setFontWeight('bold').setFontColor('#003820').setBorder(true, true, true, true, true, true, '#003820', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    sheet.getRange(meta.totalRow, 5).setNumberFormat('"Rp"#,##0');
  });

  // Auto resize kolom A - F
  for (let c = 1; c <= 6; c++) {
    sheet.autoResizeColumn(c);
  }
}
