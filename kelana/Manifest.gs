/**
 * KELANA — Manifest Module
 * Meng-generate manifest penerbangan dari jamaah yang dokumen sudah lengkap.
 *
 * Depends on (sudah ada di Code.gs / Setup.gs):
 *   getConfig_(key), generateId_(prefix, sheetName),
 *   logActivity_(user, aksi, modul, idRecord, detail),
 *   formatTanggal_(date), formatRupiah_(n), getJamaahById_(id)
 */

// ─── SHOW MODAL ──────────────────────────────────────────────────────────────

function showManifest() {
  var html = HtmlService.createHtmlOutputFromFile('Manifest')
    .setWidth(980)
    .setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, '✈ Generate Manifest Penerbangan');
}

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Ambil semua row manifest yang sudah tersimpan untuk sebuah group.
 * @param {string} idGroup
 * @returns {Object[]}
 */
function getManifestByGroup(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Manifest');
  if (!sh || sh.getLastRow() < 2) return [];

  return sh.getDataRange().getValues().slice(1)
    .filter(function(r) { return String(r[1]) === String(idGroup); })
    .map(function(r) {
      return {
        idManifest:   r[0],
        idGroup:      r[1],
        namaGroup:    r[2],
        noFlight:     r[3],
        tglBerangkat: formatTanggal_(r[4]),
        asal:         r[5],
        tujuan:       r[6],
        idJamaah:     r[7],
        namaJamaah:   r[8],
        noPaspor:     r[9],
        tglLahir:     formatTanggal_(r[10]),
        jenisKelamin: r[11],
        noKursi:      r[12],
        noVisa:       r[13],
        catatan:      r[14]
      };
    });
}

/**
 * Ambil daftar jamaah dalam sebuah group dan klasifikasikan:
 *   eligible   — Status Dokumen = "Lengkap"
 *   tidakLengkap — selain itu
 *
 * @param {string} idGroup
 * @returns {{ eligible: Object[], tidakLengkap: Object[], error?: string }}
 */
function getJamaahEligibleManifest(idGroup) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var shJ = ss.getSheetByName('Jamaah');
  var shD = ss.getSheetByName('Dokumen');

  if (!shJ) return { eligible: [], tidakLengkap: [], error: 'Sheet Jamaah tidak ditemukan.' };

  // Jamaah columns (0-indexed):
  // 0:ID  1:Nama  2:NIK  3:NoPaspor  4:TglLahir  5:JK  6:Alamat  7:NoHP
  // 8:Email  9-11:Darurat  12:Kesehatan  13:Vaksin  14:Paket
  // 15:IDGroup  16:StatusDokumen  17:StatusPembayaran ...

  // Dokumen columns (0-indexed):
  // 0:IDJamaah  1:Nama  2:NoPaspor  3:TglTerbit  4:TglExpired  5:StatusPaspor
  // 6:NoVisa  7:TglPengajuanVisa  8:TglApprovalVisa  9:StatusVisa
  // 10:VaksinMeningitis  11:SuratKesehatan  12:Foto4x6  13:FotoPaspor
  // 14:KTP  15:KK  16:BukuNikah  17:StatusDokumenLengkap  18:Catatan

  var dokMap = {};
  if (shD && shD.getLastRow() > 1) {
    shD.getDataRange().getValues().slice(1).forEach(function(r) {
      if (r[0]) dokMap[String(r[0])] = r;
    });
  }

  var eligible    = [];
  var tidakLengkap = [];

  if (shJ.getLastRow() > 1) {
    shJ.getDataRange().getValues().slice(1).forEach(function(row) {
      if (String(row[15]) !== String(idGroup)) return;

      var dok   = dokMap[String(row[0])] || [];
      var status = dok[17] || '';

      var obj = {
        idJamaah:     row[0],
        namaJamaah:   row[1],
        noPaspor:     row[3],
        tglLahir:     row[4] ? formatTanggal_(row[4]) : '',
        jenisKelamin: row[5],
        noVisa:       dok[6]  || '',
        statusDokumen: status || 'Belum Lengkap'
      };

      if (status === 'Lengkap') eligible.push(obj);
      else                      tidakLengkap.push(obj);
    });
  }

  return { eligible: eligible, tidakLengkap: tidakLengkap };
}

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Generate & simpan manifest ke sheet.
 *
 * @param {{
 *   idGroup:      string,
 *   namaGroup:    string,
 *   noFlight:     string,
 *   tglBerangkat: string,  // ISO date string, misal "2025-03-15"
 *   asal:         string,
 *   tujuan:       string,
 *   jamaahList:   Array<{idJamaah:string, noKursi:string}>
 * }} params
 * @returns {{ success: boolean, count?: number, namaGroup?: string, error?: string }}
 */
function generateManifest(params) {
  try {
    var ss         = SpreadsheetApp.getActiveSpreadsheet();
    var shManifest = ss.getSheetByName('Manifest');
    if (!shManifest) return { success: false, error: 'Sheet Manifest tidak ditemukan. Jalankan Setup terlebih dahulu.' };

    var eligible = getJamaahEligibleManifest(params.idGroup);
    var eligibleMap = {};
    eligible.eligible.forEach(function(j) { eligibleMap[j.idJamaah] = j; });

    hapusManifestGroup_(params.idGroup);

    var rows = [];
    params.jamaahList.forEach(function(item) {
      var j = eligibleMap[item.idJamaah];
      if (!j) return;

      rows.push([
        generateId_('MF', 'Manifest'),
        params.idGroup,
        params.namaGroup  || '',
        params.noFlight   || '',
        params.tglBerangkat ? new Date(params.tglBerangkat) : '',
        params.asal       || '',
        params.tujuan     || '',
        j.idJamaah,
        j.namaJamaah,
        j.noPaspor,
        j.tglLahir ? new Date(j.tglLahir) : '',
        j.jenisKelamin,
        item.noKursi      || '',
        j.noVisa          || '',
        ''
      ]);
    });

    if (rows.length > 0) {
      shManifest.getRange(shManifest.getLastRow() + 1, 1, rows.length, 15).setValues(rows);
    }

    logActivity_('System', 'Generate Manifest', 'Manifest', params.idGroup,
      (params.namaGroup || params.idGroup) + ' — ' + rows.length + ' jamaah');

    return { success: true, count: rows.length, namaGroup: params.namaGroup || params.idGroup };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Generate HTML printable untuk manifest satu group.
 * Client memanggil window.open() dengan html yang dikembalikan.
 *
 * @param {string} idGroup
 * @returns {{ success: boolean, html?: string, count?: number, error?: string }}
 */
function exportManifestHtml(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Manifest');
  if (!sh) return { success: false, error: 'Sheet Manifest tidak ditemukan.' };

  var rows = (sh.getLastRow() > 1 ? sh.getDataRange().getValues().slice(1) : [])
    .filter(function(r) { return String(r[1]) === String(idGroup); });

  if (!rows.length) return { success: false, error: 'Manifest untuk group ini belum di-generate. Generate terlebih dahulu.' };

  var namaTravel  = getConfig_('NAMA_TRAVEL') || 'Kelana Travel';
  var namaGroup   = rows[0][2];
  var noFlight    = rows[0][3];
  var tglBerangkat = formatTanggal_(rows[0][4]);
  var asal        = rows[0][5];
  var tujuan      = rows[0][6];

  var tbody = rows.map(function(r, i) {
    return '<tr>' +
      '<td class="c">' + (i + 1) + '</td>' +
      '<td>' + escHtml_(r[7]) + '</td>' +
      '<td><strong>' + escHtml_(r[8]) + '</strong></td>' +
      '<td>' + escHtml_(r[9]) + '</td>' +
      '<td>' + escHtml_(formatTanggal_(r[10])) + '</td>' +
      '<td class="c">' + escHtml_(r[11]) + '</td>' +
      '<td class="c">' + escHtml_(r[12] || '—') + '</td>' +
      '<td>' + escHtml_(r[13] || '—') + '</td>' +
      '<td>' + escHtml_(r[14] || '') + '</td>' +
      '</tr>';
  }).join('');

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>Manifest — ' + namaGroup + '</title>' +
    '<style>' +
    'body{font-family:Arial,sans-serif;font-size:11px;margin:24px 28px;color:#1e1b4b;}' +
    'h2{font-size:15px;color:#4f46e5;margin-bottom:2px;}' +
    '.meta{font-size:11px;color:#555;margin-bottom:14px;line-height:2;}' +
    '.meta span{margin-right:18px;}' +
    'table{width:100%;border-collapse:collapse;margin-top:4px;}' +
    'th{background:#4f46e5;color:#fff;padding:7px 9px;font-size:10px;' +
    '  text-align:left;letter-spacing:.05em;text-transform:uppercase;}' +
    'td{border:1px solid #d8d5f0;padding:5px 9px;}' +
    '.c{text-align:center;}' +
    'tr:nth-child(even) td{background:#f8f7ff;}' +
    '.ft{margin-top:14px;font-size:10px;color:#aaa;}' +
    '.np{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;}' +
    '.pbtn{padding:8px 16px;background:#4f46e5;color:#fff;border:none;' +
    '  border-radius:6px;cursor:pointer;font-size:12px;}' +
    '@media print{.pbtn{display:none;}}' +
    '</style></head><body>' +
    '<div class="np">' +
    '<div><h2>MANIFEST PENERBANGAN</h2>' +
    '<div class="meta">' +
    '<span><strong>Group:</strong> ' + namaGroup + '</span>' +
    '<span><strong>Travel:</strong> ' + namaTravel + '</span><br>' +
    '<span><strong>Flight:</strong> ' + noFlight + '</span>' +
    '<span><strong>Tanggal:</strong> ' + tglBerangkat + '</span>' +
    '<span><strong>Rute:</strong> ' + asal + ' → ' + tujuan + '</span>' +
    '</div></div>' +
    '<button class="pbtn" onclick="window.print()">🖨 Print</button>' +
    '</div>' +
    '<table><thead><tr>' +
    '<th class="c">#</th><th>ID Jamaah</th><th>Nama Lengkap</th>' +
    '<th>No. Paspor</th><th>Tgl Lahir</th><th>L/P</th>' +
    '<th>Kursi</th><th>No. Visa</th><th>Catatan</th>' +
    '</tr></thead><tbody>' + tbody + '</tbody></table>' +
    '<div class="ft">Total: <strong>' + rows.length + ' jamaah</strong>' +
    ' &nbsp;|&nbsp; Generated by Kelana — ' + new Date().toLocaleString('id-ID') + '</div>' +
    '</body></html>';

  return { success: true, html: html, count: rows.length };
}

// ─── PRIVATE HELPERS ──────────────────────────────────────────────────────────

function hapusManifestGroup_(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Manifest');
  if (!sh || sh.getLastRow() < 2) return;
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(idGroup)) sh.deleteRow(i + 1);
  }
}

function escHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
