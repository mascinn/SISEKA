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

    // 2. UPDATE SHEET PER UNIT USAHA (TABEL TERPISAH PER BULAN)
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
 * Update Sheet 1: Ringkasan Semua Unit
 */
function updateSummarySheet(ss, payload) {
  let sheet = ss.getSheetByName('Ringkasan Semua Unit');
  if (!sheet) {
    sheet = ss.insertSheet('Ringkasan Semua Unit', 0);
  }
  sheet.clear();
  sheet.setTabColor('#003820');

  const rows = [];
  rows.push(padRow(['SISTEM INFORMASI SETORAN SEWA KANTIN (SISEKA WASI\'I)'], 10));
  rows.push(padRow(['BPH MASJID AL-WASI\'I • REKAPITULASI KEUANGAN TAHUN ' + (payload.tahun || '2026')], 10));
  rows.push(padRow(['Terakhir Diperbarui: ' + Utilities.formatDate(new Date(), 'GMT+7', 'dd MMMM yyyy HH:mm:ss') + ' WIB'], 10));
  rows.push(padRow([], 10));
  rows.push(padRow(['No', 'ID Unit', 'Nama Kantin / Unit Usaha', 'Penyewa', 'No HP', 'Tarif Sewa/Bln', 'Total Setor', 'Target Sewa', 'Saldo Keuangan', 'Status'], 10));

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
      ], 10));
    });
  }

  // Baris Total
  rows.push(padRow([], 10));
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
  ], 10));

  // Tulis ke sheet
  sheet.getRange(1, 1, rows.length, 10).setValues(rows);

  // STYLING SHEET RINGKASAN
  // Header Judul Banner
  sheet.getRange('A1:J1').merge().setBackground('#003820').setFontColor('#ffffff').setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  sheet.getRange('A2:J2').merge().setBackground('#004D2C').setFontColor('#e2e8f0').setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');
  sheet.getRange('A3:J3').merge().setBackground('#f8fafc').setFontColor('#64748b').setFontSize(9).setHorizontalAlignment('center');

  // Header Tabel Kolom
  sheet.getRange('A5:J5').setBackground('#0A5C36').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center');

  // Format Angka & Border Data
  const dataStart = 6;
  const dataCount = (payload.ringkasan_semua || []).length;
  if (dataCount > 0) {
    const dataRange = sheet.getRange(dataStart, 1, dataCount, 10);
    dataRange.setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
    dataRange.setFontSize(10);

    // Format Currency Rupiah
    sheet.getRange(dataStart, 6, dataCount, 4).setNumberFormat('"Rp"#,##0');
    // Alignments
    sheet.getRange(dataStart, 1, dataCount, 2).setHorizontalAlignment('center');
    sheet.getRange(dataStart, 5, dataCount, 1).setHorizontalAlignment('center');
    sheet.getRange(dataStart, 10, dataCount, 1).setHorizontalAlignment('center').setFontWeight('bold');
  }

  // Styling Baris Total
  const totalRowIndex = dataStart + dataCount + 1;
  const totalRange = sheet.getRange(totalRowIndex, 1, 1, 10);
  sheet.getRange(totalRowIndex, 1, 1, 6).merge();
  totalRange.setBackground('#E8F5E9').setFontWeight('bold').setFontColor('#003820').setBorder(true, true, true, true, true, true, '#003820', SpreadsheetApp.BorderStyle.DOUBLE);
  sheet.getRange(totalRowIndex, 7, 1, 3).setNumberFormat('"Rp"#,##0');
  sheet.getRange(totalRowIndex, 10).setHorizontalAlignment('center');

  // Auto-fit kolom
  for (let c = 1; c <= 10; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * Update Sheet Per Kios dengan Format Tabel Terpisah Per Bulan
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
  rows.push(padRow(['UNIT USAHA: ' + kiosk.nama_kantin.toUpperCase()], 6));
  rows.push(padRow(['Penyewa: ' + kiosk.nama_penyewa, '', 'No HP: ' + (kiosk.nomor_hp || '-'), '', 'Tarif Sewa: Rp ' + Number(kiosk.tarif_sewa || 0).toLocaleString('id-ID') + ' / Bulan'], 6));
  rows.push(padRow(['Tahun Buku: ' + tahun, '', 'Terakhir Diperbarui: ' + Utilities.formatDate(new Date(), 'GMT+7', 'dd MMMM yyyy HH:mm:ss') + ' WIB'], 6));
  rows.push(padRow([], 6));

  // Loop setiap tabel bulanan
  const monthlyTables = kiosk.monthly_tables || [];
  const stylingMeta = [];

  monthlyTables.forEach(function(mTable) {
    const startRow = rows.length + 1;

    // Header Bulan
    rows.push(padRow(['TABEL SETORAN: ' + mTable.bulan_nama.toUpperCase()], 6));
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

    stylingMeta.push({
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

  // STYLING
  // Banner Info Kios
  sheet.getRange('A1:F1').merge().setBackground('#003820').setFontColor('#ffffff').setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
  sheet.getRange('A2:F2').setBackground('#f1f5f9').setFontSize(10).setFontWeight('bold');
  sheet.getRange('A3:F3').setBackground('#f8fafc').setFontSize(9).setFontColor('#64748b');

  // Styling tiap tabel bulan
  stylingMeta.forEach(function(meta) {
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

  // Auto resize kolom
  for (let c = 1; c <= 6; c++) {
    sheet.autoResizeColumn(c);
  }
}
