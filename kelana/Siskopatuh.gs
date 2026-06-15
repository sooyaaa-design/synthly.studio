/**
 * KELANA — Modul SISKOPATUH
 * =========================
 * Membuat data jamaah Kelana SIAP-PAKAI untuk pelaporan di
 * SISKOPATUH (Sistem Komputerisasi Pengelolaan Terpadu Umrah & Haji Khusus, Kemenag).
 *
 * Nilai jual utama untuk owner travel:
 *   - Tidak perlu input ulang data jamaah satu-per-satu di SISKOPATUH.
 *   - Kelana menampung SEMUA field wajib Kemenag (KTP + paspor + mahram + vaksin).
 *   - Sekali klik → unduh rekap CSV/Excel sesuai urutan kolom SISKOPATUH untuk upload massal.
 *   - Cek kelengkapan otomatis: tahu persis jamaah mana yang datanya masih kurang
 *     SEBELUM jadwal pelaporan, jadi tidak ada penolakan saat upload.
 *
 * Dependensi (sudah ada di file lain):
 *   getConfig_, formatTanggal_, getGroupById_, esc_, logActivity_, getCurrentUser_
 *
 * Sheet Jamaah memakai skema diperluas (kolom 0-25 lama + 26-41 baru SISKOPATUH).
 * Migrasi kolom otomatis dijalankan oleh migrateSiskopatuhSchema_() di setupAwal().
 */

// ─── DEFINISI FIELD ──────────────────────────────────────────────────────────

// Index kolom Jamaah (0-based) untuk field SISKOPATUH yang baru.
// HARUS sinkron dengan header di Code.gs (setupAwal) & migrateSiskopatuhSchema_.
var SISKO_COL = {
  tempatLahir:        26,
  namaAyah:           27,
  statusPerkawinan:   28,
  pekerjaan:          29,
  pendidikan:         30,
  provinsi:           31,
  kabupaten:          32,
  kecamatan:          33,
  kelurahan:          34,
  kodePos:            35,
  kewarganegaraan:    36,
  namaMahram:         37,
  hubunganMahram:     38,
  embarkasi:          39,
  golonganDarah:      40,
  tempatTerbitPaspor: 41
};

// Header tambahan (urut sesuai index 26..41 di atas).
var SISKO_HEADERS = [
  'Tempat Lahir','Nama Ayah','Status Perkawinan','Pekerjaan','Pendidikan',
  'Provinsi','Kabupaten/Kota','Kecamatan','Kelurahan','Kode Pos',
  'Kewarganegaraan','Nama Mahram','Hubungan Mahram','Embarkasi',
  'Golongan Darah','Tempat Terbit Paspor'
];

/**
 * Field WAJIB SISKOPATUH untuk tiap jamaah, beserta cara ambil nilainya.
 * `mahramOnly:true` → hanya wajib untuk jamaah Perempuan (di bawah usia/ tanpa suami mahram).
 */
function siskoRequiredFields_() {
  return [
    { key: 'nik',                label: 'NIK',                 validate: function(v){ return /^\d{16}$/.test(String(v||'')); } },
    { key: 'namaLengkap',        label: 'Nama Lengkap' },
    { key: 'tempatLahir',        label: 'Tempat Lahir' },
    { key: 'tglLahir',           label: 'Tanggal Lahir' },
    { key: 'jenisKelamin',       label: 'Jenis Kelamin' },
    { key: 'namaAyah',           label: 'Nama Ayah' },
    { key: 'pekerjaan',          label: 'Pekerjaan' },
    { key: 'alamat',             label: 'Alamat' },
    { key: 'provinsi',           label: 'Provinsi' },
    { key: 'kabupaten',          label: 'Kabupaten/Kota' },
    { key: 'noHp',               label: 'No. HP' },
    { key: 'noPaspor',           label: 'No. Paspor' },
    { key: 'tglExpiredPaspor',   label: 'Masa Berlaku Paspor' },
    { key: 'statusVaksin',       label: 'Vaksin Meningitis',   validate: function(v){ return String(v||'').toLowerCase().indexOf('sudah') === 0; } },
    { key: 'pasFoto',            label: 'Pas Foto 4x6' },
    { key: 'namaMahram',         label: 'Nama Mahram',         mahramOnly: true },
    { key: 'hubunganMahram',     label: 'Hubungan Mahram',     mahramOnly: true }
  ];
}

// ─── MIGRASI SKEMA ─────────────────────────────────────────────────────────────

/**
 * Tambahkan kolom SISKOPATUH ke sheet Jamaah jika belum ada.
 * Aman dijalankan berkali-kali (idempoten). Dipanggil dari setupAwal().
 */
function migrateSiskopatuhSchema_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Jamaah');
  if (!sh) return;
  var needFrom  = SISKO_COL.tempatLahir; // 26 (0-based) → kolom ke-27
  var startCol  = needFrom + 1;          // 1-based
  var endCol    = startCol + SISKO_HEADERS.length - 1; // kolom terakhir SISKOPATUH (42)

  // Sudah lengkap? (header sel terakhir sudah terisi label yang benar)
  if (sh.getMaxColumns() >= endCol &&
      String(sh.getRange(1, endCol).getValue()) === SISKO_HEADERS[SISKO_HEADERS.length - 1]) {
    return;
  }

  // Pastikan jumlah kolom fisik cukup (sheet default hanya 26 kolom A–Z).
  if (sh.getMaxColumns() < endCol) {
    sh.insertColumnsAfter(sh.getMaxColumns(), endCol - sh.getMaxColumns());
  }

  sh.getRange(1, startCol, 1, SISKO_HEADERS.length).setValues([SISKO_HEADERS])
    .setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
}

// ─── BACA DATA JAMAAH LENGKAP (Jamaah + Dokumen + Group) ───────────────────────

/**
 * Gabungkan satu baris Jamaah dengan data Dokumen & Group menjadi objek lengkap
 * yang berisi seluruh field SISKOPATUH.
 */
function siskoBuildRecord_(r, dok, group) {
  function g(idx){ return r[idx] != null ? r[idx] : ''; }
  var jk = String(g(5) || '');
  return {
    idJamaah:           g(0),
    namaLengkap:        g(1),
    nik:                String(g(2) || ''),
    noPaspor:           String(g(3) || ''),
    tglLahir:           g(4),
    jenisKelamin:       jk,
    alamat:             g(6),
    noHp:               String(g(7) || ''),
    email:              g(8),
    statusVaksin:       g(13),
    paket:              g(14),
    idGroup:            g(15),
    // field SISKOPATUH baru
    tempatLahir:        g(SISKO_COL.tempatLahir),
    namaAyah:           g(SISKO_COL.namaAyah),
    statusPerkawinan:   g(SISKO_COL.statusPerkawinan),
    pekerjaan:          g(SISKO_COL.pekerjaan),
    pendidikan:         g(SISKO_COL.pendidikan),
    provinsi:           g(SISKO_COL.provinsi),
    kabupaten:          g(SISKO_COL.kabupaten),
    kecamatan:          g(SISKO_COL.kecamatan),
    kelurahan:          g(SISKO_COL.kelurahan),
    kodePos:            String(g(SISKO_COL.kodePos) || ''),
    kewarganegaraan:    g(SISKO_COL.kewarganegaraan) || 'WNI',
    namaMahram:         g(SISKO_COL.namaMahram),
    hubunganMahram:     g(SISKO_COL.hubunganMahram),
    embarkasi:          g(SISKO_COL.embarkasi),
    golonganDarah:      g(SISKO_COL.golonganDarah),
    tempatTerbitPaspor: g(SISKO_COL.tempatTerbitPaspor),
    // dari Dokumen
    tglTerbitPaspor:    dok ? dok[7]  : '',
    tglExpiredPaspor:   dok ? dok[8]  : '',
    noVisa:             dok ? dok[6]  : '',
    fotoKTP:            dok ? dok[4]  : '',
    fotoPaspor:         dok ? dok[11] : '',
    fotoVisa:           dok ? dok[12] : '',
    icv:                dok ? dok[15] : '',
    pasFoto:            dok ? dok[18] : '',
    // dari Group (untuk konteks paket)
    namaGroup:          group ? group.namaGroup    : '',
    tglBerangkat:       group ? group.tglBerangkat : '',
    maskapai:           group ? group.maskapai     : '',
    hotelMadinah:       group ? group.hotelMadinah : '',
    hotelMakkah:        group ? group.hotelMakkah  : ''
  };
}

/**
 * Ambil seluruh record jamaah lengkap (opsional filter group).
 * @param {string} [idGroup]
 * @returns {Object[]}
 */
function getSiskopatuhRecords_(idGroup) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var shJ = ss.getSheetByName('Jamaah');
  var shD = ss.getSheetByName('Dokumen');
  if (!shJ || shJ.getLastRow() < 2) return [];

  var dokMap = {};
  if (shD && shD.getLastRow() > 1) {
    shD.getDataRange().getValues().slice(1).forEach(function(d) {
      if (d[1]) dokMap[String(d[1])] = d;
    });
  }

  var groupCache = {};
  function grp(id) {
    if (!id) return null;
    if (!(id in groupCache)) groupCache[id] = siskoGroupRaw_(id);
    return groupCache[id];
  }

  return shJ.getDataRange().getValues().slice(1)
    .filter(function(r){ return r[0] && (!idGroup || String(r[15]) === String(idGroup)); })
    .map(function(r){ return siskoBuildRecord_(r, dokMap[String(r[0])] || null, grp(r[15])); });
}

/**
 * Baca satu baris Group langsung dari sheet dengan index yang benar untuk
 * skema baru (23 kolom) maupun lama (14 kolom). Mengembalikan tglBerangkat
 * sebagai Date mentah (bukan string terformat) agar bisa diformat ulang.
 */
function siskoGroupRaw_(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Group');
  if (!sh || sh.getLastRow() < 2) return null;
  var newSchema = sh.getLastColumn() >= 20;
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== String(idGroup)) continue;
    var r = rows[i];
    return {
      idGroup:      r[0],
      namaGroup:    r[1],
      tglBerangkat: r[2],
      maskapai:     r[4],
      hotelMadinah: newSchema ? (r[12] || '') : (r[7] || ''),
      hotelMakkah:  newSchema ? (r[13] || '') : (r[8] || '')
    };
  }
  return null;
}

// ─── CEK KELENGKAPAN ────────────────────────────────────────────────────────────

/**
 * Apakah jamaah ini butuh mahram? (Perempuan dianggap butuh data mahram.)
 */
function siskoButuhMahram_(rec) {
  return String(rec.jenisKelamin || '').toLowerCase().indexOf('perempuan') === 0;
}

/**
 * Cek kelengkapan data SISKOPATUH per jamaah untuk satu group (atau semua).
 * @param {string} [idGroup]
 * @returns {{
 *   total:number, siap:number, belum:number, pctSiap:number,
 *   jamaah: Array<{idJamaah,nama,jenisKelamin,lengkap:boolean,kurang:string[]}>
 * }}
 */
function cekKelengkapanSiskopatuh(idGroup) {
  var recs   = getSiskopatuhRecords_(idGroup);
  var fields = siskoRequiredFields_();
  var hasil  = [];
  var siap   = 0;

  recs.forEach(function(rec) {
    var butuhMahram = siskoButuhMahram_(rec);
    var kurang = [];
    fields.forEach(function(f) {
      if (f.mahramOnly && !butuhMahram) return;
      var val = rec[f.key];
      var ok  = f.validate ? f.validate(val) : !!(val && String(val).trim());
      if (!ok) kurang.push(f.label);
    });
    var lengkap = kurang.length === 0;
    if (lengkap) siap++;
    hasil.push({
      idJamaah:     rec.idJamaah,
      nama:         rec.namaLengkap,
      jenisKelamin: rec.jenisKelamin,
      namaGroup:    rec.namaGroup,
      lengkap:      lengkap,
      kurang:       kurang
    });
  });

  // Urutkan: yang belum lengkap di atas (paling perlu ditindaklanjuti)
  hasil.sort(function(a,b){ return (a.lengkap?1:0) - (b.lengkap?1:0); });

  var total = recs.length;
  return {
    total:   total,
    siap:    siap,
    belum:   total - siap,
    pctSiap: total > 0 ? Math.round(siap / total * 100) : 0,
    jamaah:  hasil
  };
}

// ─── EXPORT CSV (template upload SISKOPATUH) ──────────────────────────────────

// Urutan & label kolom rekap untuk diunggah / disalin ke SISKOPATUH.
var SISKO_EXPORT_COLS = [
  { h: 'NIK',                     f: function(r){ return r.nik; } },
  { h: 'Nama Lengkap',            f: function(r){ return r.namaLengkap; } },
  { h: 'Tempat Lahir',           f: function(r){ return r.tempatLahir; } },
  { h: 'Tanggal Lahir',          f: function(r){ return siskoDate_(r.tglLahir); } },
  { h: 'Jenis Kelamin',          f: function(r){ return siskoJK_(r.jenisKelamin); } },
  { h: 'Status Perkawinan',      f: function(r){ return r.statusPerkawinan; } },
  { h: 'Pendidikan',             f: function(r){ return r.pendidikan; } },
  { h: 'Pekerjaan',              f: function(r){ return r.pekerjaan; } },
  { h: 'Kewarganegaraan',        f: function(r){ return r.kewarganegaraan || 'WNI'; } },
  { h: 'Nama Ayah',              f: function(r){ return r.namaAyah; } },
  { h: 'Alamat',                 f: function(r){ return r.alamat; } },
  { h: 'Provinsi',               f: function(r){ return r.provinsi; } },
  { h: 'Kabupaten/Kota',         f: function(r){ return r.kabupaten; } },
  { h: 'Kecamatan',              f: function(r){ return r.kecamatan; } },
  { h: 'Kelurahan',              f: function(r){ return r.kelurahan; } },
  { h: 'Kode Pos',               f: function(r){ return r.kodePos; } },
  { h: 'No. HP',                 f: function(r){ return siskoHp_(r.noHp); } },
  { h: 'Email',                  f: function(r){ return r.email; } },
  { h: 'No. Paspor',             f: function(r){ return r.noPaspor; } },
  { h: 'Tempat Terbit Paspor',   f: function(r){ return r.tempatTerbitPaspor; } },
  { h: 'Tanggal Terbit Paspor',  f: function(r){ return siskoDate_(r.tglTerbitPaspor); } },
  { h: 'Masa Berlaku Paspor',    f: function(r){ return siskoDate_(r.tglExpiredPaspor); } },
  { h: 'Nama Mahram',            f: function(r){ return r.namaMahram; } },
  { h: 'Hubungan Mahram',        f: function(r){ return r.hubunganMahram; } },
  { h: 'Golongan Darah',         f: function(r){ return r.golonganDarah; } },
  { h: 'Status Vaksin Meningitis', f: function(r){ return r.statusVaksin; } },
  { h: 'Embarkasi',              f: function(r){ return r.embarkasi; } },
  { h: 'Nama Paket',             f: function(r){ return r.paket; } },
  { h: 'Tgl Keberangkatan',      f: function(r){ return siskoDate_(r.tglBerangkat); } },
  { h: 'Maskapai',               f: function(r){ return r.maskapai; } },
  { h: 'Hotel Makkah',           f: function(r){ return r.hotelMakkah; } },
  { h: 'Hotel Madinah',          f: function(r){ return r.hotelMadinah; } },
  // Tautan berkas (referensi internal travel; SISKOPATUH unggah foto terpisah)
  { h: 'Pas Foto (URL)',         f: function(r){ return r.pasFoto; } },
  { h: 'Foto KTP (URL)',         f: function(r){ return r.fotoKTP; } },
  { h: 'Foto Paspor (URL)',      f: function(r){ return r.fotoPaspor; } },
  { h: 'Foto Visa (URL)',        f: function(r){ return r.fotoVisa; } },
  { h: 'ICV/Kartu Kuning (URL)', f: function(r){ return r.icv; } }
];

/**
 * Bangun baris ekspor (header + data) sebagai array string.
 * Dipakai bersama oleh CSV & XLSX. onlyComplete=true → hanya jamaah lengkap.
 * @returns {{ rows: Array<Array<string>>, count:number, skipped:number }}
 */
function siskoExportRows_(idGroup, onlyComplete) {
  var recs   = getSiskopatuhRecords_(idGroup);
  var fields = siskoRequiredFields_();
  function isLengkap(rec) {
    var butuhMahram = siskoButuhMahram_(rec);
    return fields.every(function(f) {
      if (f.mahramOnly && !butuhMahram) return true;
      var val = rec[f.key];
      return f.validate ? f.validate(val) : !!(val && String(val).trim());
    });
  }
  var rows = [SISKO_EXPORT_COLS.map(function(c){ return c.h; })];
  var count = 0, skipped = 0;
  recs.forEach(function(rec) {
    if (onlyComplete && !isLengkap(rec)) { skipped++; return; }
    rows.push(SISKO_EXPORT_COLS.map(function(c){ var v = c.f(rec); return v == null ? '' : String(v); }));
    count++;
  });
  return { rows: rows, count: count, skipped: skipped };
}

function siskoDate_(d) {
  if (!d) return '';
  try {
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d).substring(0, 10);
    var dd = ('0' + dt.getDate()).slice(-2);
    var mm = ('0' + (dt.getMonth() + 1)).slice(-2);
    return dd + '-' + mm + '-' + dt.getFullYear(); // DD-MM-YYYY (format umum SISKOPATUH)
  } catch (e) { return String(d).substring(0, 10); }
}

function siskoJK_(jk) {
  var s = String(jk || '').toLowerCase();
  if (s.indexOf('perempuan') === 0 || s === 'p' || s === 'wanita') return 'PEREMPUAN';
  if (s.indexOf('laki') === 0 || s === 'l' || s === 'pria') return 'LAKI-LAKI';
  return String(jk || '');
}

// Normalisasi ke format 08xxxxxxxxxx (mudah dibaca operator SISKOPATUH).
function siskoHp_(hp) {
  var s = String(hp || '').replace(/[^0-9]/g, '');
  if (s.indexOf('62') === 0) s = '0' + s.substring(2);
  return s;
}

/**
 * Export rekap jamaah dalam format CSV siap-unggah ke SISKOPATUH.
 * Hanya jamaah dengan data LENGKAP yang diekspor secara default (onlyComplete=true)
 * supaya upload tidak ditolak. Set onlyComplete=false untuk ekspor semua.
 *
 * @param {string} [idGroup]
 * @param {boolean} [onlyComplete=true]
 * @returns {{ csv:string, count:number, skipped:number, filename:string }}
 */
function exportSiskopatuhCsv(idGroup, onlyComplete) {
  if (onlyComplete === undefined) onlyComplete = true;
  var built = siskoExportRows_(idGroup, onlyComplete);

  function cell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
  var csvLines = built.rows.map(function(row){ return row.map(cell).join(','); });

  // BOM agar Excel membaca UTF-8 (karakter Indonesia) dengan benar.
  var csv = '﻿' + csvLines.join('\r\n');
  var fname = siskoFilename_(idGroup, 'csv');

  logActivity_(getCurrentUser_(), 'Export SISKOPATUH (CSV)', 'Jamaah', idGroup || 'semua',
    built.count + ' jamaah diekspor, ' + built.skipped + ' dilewati (data belum lengkap)');

  return { csv: csv, count: built.count, skipped: built.skipped, filename: fname };
}

/**
 * Export rekap SISKOPATUH sebagai file Excel (.xlsx) asli.
 * Membuat spreadsheet sementara, menulis data, lalu mengekspornya sebagai xlsx
 * (base64) dan menghapus file sementara.
 * @returns {{ base64:string, count:number, skipped:number, filename:string, mimeType:string }}
 */
function exportSiskopatuhXlsx(idGroup, onlyComplete) {
  if (onlyComplete === undefined) onlyComplete = true;
  var built = siskoExportRows_(idGroup, onlyComplete);

  var tmp = SpreadsheetApp.create('KelanaSiskopatuhTmp-' + new Date().getTime());
  var fileId = tmp.getId();
  try {
    var sh = tmp.getSheets()[0];
    sh.setName('SISKOPATUH');
    sh.getRange(1, 1, built.rows.length, built.rows[0].length).setValues(built.rows);
    sh.getRange(1, 1, 1, built.rows[0].length).setFontWeight('bold');
    sh.setFrozenRows(1);
    SpreadsheetApp.flush();

    var url  = 'https://docs.google.com/spreadsheets/d/' + fileId + '/export?format=xlsx';
    var resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    var b64 = Utilities.base64Encode(resp.getBlob().getBytes());

    logActivity_(getCurrentUser_(), 'Export SISKOPATUH (XLSX)', 'Jamaah', idGroup || 'semua',
      built.count + ' jamaah diekspor, ' + built.skipped + ' dilewati');

    return {
      base64: b64, count: built.count, skipped: built.skipped,
      filename: siskoFilename_(idGroup, 'xlsx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } finally {
    try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}
  }
}

function siskoFilename_(idGroup, ext) {
  var s = new Date();
  return 'SISKOPATUH-' + (idGroup || 'semua') + '-' +
    s.getFullYear() + ('0'+(s.getMonth()+1)).slice(-2) + ('0'+s.getDate()).slice(-2) + '.' + ext;
}

/**
 * Versi HTML rekap SISKOPATUH (untuk dilihat / dicetak / disalin manual).
 * Menyorot sel kosong agar operator mudah melihat data yang masih kurang.
 * @param {string} [idGroup]
 * @returns {{ html:string, count:number }}
 */
function exportSiskopatuhHtml(idGroup) {
  var recs = getSiskopatuhRecords_(idGroup);
  var namaTravel = getConfig_('NAMA_TRAVEL') || 'Kelana';
  var judulGroup = idGroup ? (recs.length ? recs[0].namaGroup : idGroup) : 'Semua Kloter';

  var head = SISKO_EXPORT_COLS.map(function(c){ return '<th>' + esc_(c.h) + '</th>'; }).join('');
  var body = recs.map(function(rec, i) {
    var tds = SISKO_EXPORT_COLS.map(function(c) {
      var v = c.f(rec);
      var empty = !(v && String(v).trim());
      return '<td' + (empty ? ' class="kosong"' : '') + '>' + esc_(empty ? '—' : v) + '</td>';
    }).join('');
    return '<tr><td class="c">' + (i + 1) + '</td>' + tds + '</tr>';
  }).join('');

  var html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Rekap SISKOPATUH</title>'
    + '<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10px;padding:18px;color:#0f172a}'
    + 'h2{font-size:15px;margin-bottom:2px;color:#0f766e}p.meta{color:#64748b;font-size:11px;margin-bottom:12px}'
    + 'table{width:100%;border-collapse:collapse}th{background:#0f766e;color:#fff;padding:6px 7px;text-align:left;'
    + 'font-size:9px;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap}'
    + 'td{border:1px solid #e2e8f0;padding:4px 7px;white-space:nowrap}.c{text-align:center}'
    + 'tr:nth-child(even) td{background:#f0fdfa}.kosong{background:#fef2f2!important;color:#dc2626;font-weight:700;text-align:center}'
    + '.wrap{overflow-x:auto}'
    + '@media print{.no-print{display:none!important}@page{size:A3 landscape;margin:10mm}}</style></head><body>'
    + '<div class="no-print" style="margin-bottom:12px;display:flex;gap:10px">'
    + '<button onclick="window.print()" style="background:#0f766e;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-weight:700;cursor:pointer">🖨 Cetak / PDF</button>'
    + '<button onclick="window.close()" style="background:#f1f5f9;border:1px solid #cbd5e1;padding:9px 18px;border-radius:8px;cursor:pointer">Tutup</button></div>'
    + '<h2>Rekap Data SISKOPATUH — ' + esc_(judulGroup) + '</h2>'
    + '<p class="meta">' + esc_(namaTravel) + ' · ' + recs.length + ' jamaah · Dicetak '
    + new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})
    + ' · <span style="color:#dc2626">Sel merah = data belum diisi</span></p>'
    + '<div class="wrap"><table><thead><tr><th class="c">#</th>' + head + '</tr></thead><tbody>'
    + body + '</tbody></table></div></body></html>';

  return { html: html, count: recs.length };
}

/**
 * Ringkasan kesiapan SISKOPATUH untuk dashboard (per kloter + total).
 * @returns {{ total:number, siap:number, belum:number, pctSiap:number,
 *             perGroup: Array<{idGroup,namaGroup,total,siap,belum,pctSiap}> }}
 */
function getSiskopatuhRingkasan() {
  var all = cekKelengkapanSiskopatuh('');
  var groups = getGroupList();
  var perGroup = groups.map(function(g) {
    var k = cekKelengkapanSiskopatuh(g.idGroup);
    return {
      idGroup: g.idGroup, namaGroup: g.namaGroup,
      total: k.total, siap: k.siap, belum: k.belum, pctSiap: k.pctSiap
    };
  }).filter(function(g){ return g.total > 0; });
  return {
    total: all.total, siap: all.siap, belum: all.belum, pctSiap: all.pctSiap,
    perGroup: perGroup
  };
}
