/**
 * KELANA — License Server
 * ======================
 * File ini di-deploy di Google Apps Script MILIK ANDA SENDIRI (bukan milik client).
 * Satu server untuk semua client travel yang berlangganan.
 *
 * CARA DEPLOY:
 *   1. Buat Google Spreadsheet baru (milik Anda) → beri nama "Kelana License Server"
 *   2. Buka Extensions → Apps Script
 *   3. Paste file ini
 *   4. Deploy → New Deployment → Web App
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Salin URL deployment → simpan sebagai LICENSE_SERVER_URL
 *
 * STRUKTUR SHEET "Lisensi":
 *   LicenseKey | NamaTravel | Email | Plan | Status | TglMulai | TglExpiry |
 *   LimitJamaah | LimitKloter | Catatan | TglDibuat | TglUpdate
 */

// ─── KONFIGURASI ─────────────────────────────────────────────────────────────

var SHEET_ID    = SpreadsheetApp.getActiveSpreadsheet().getId();
var SHEET_NAME  = 'Lisensi';
var LOG_SHEET   = 'Log Akses';

/**
 * Password admin License Server — WAJIB diset di Script Properties (tidak ada default
 * hardcoded demi keamanan). Set sekali lewat editor: setAdminPass('passwordKuatAnda').
 */
function getAdminPass_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASS') || '';
}

/**
 * Set password admin License Server. Jalankan SEKALI di editor Apps Script.
 * Contoh: setAdminPass('R4has!aKuat2026')
 */
function setAdminPass(pass) {
  if (!pass || String(pass).length < 8) throw new Error('Password minimal 8 karakter.');
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASS', String(pass));
  Logger.log('ADMIN_PASS berhasil disimpan ke Script Properties.');
  return 'OK — ADMIN_PASS tersimpan.';
}

// Batas per plan
var PLAN_LIMITS = {
  'Trial':      { jamaah: 30,  kloter: 1,   label: 'Trial (30 hari)' },
  'Starter':    { jamaah: 200, kloter: 4,   label: 'Starter' },
  'Growth':     { jamaah: 500, kloter: 11,  label: 'Growth' },
  'Pro':        { jamaah: 99999, kloter: 99, label: 'Pro' },
  'Enterprise': { jamaah: 99999, kloter: 99, label: 'Enterprise' }
};

// ─── ENDPOINT UTAMA ──────────────────────────────────────────────────────────

/**
 * GET endpoint — dipanggil oleh client untuk cek lisensi.
 * URL: [server_url]?action=check&key=LICENSE_KEY&jamaah=N
 */
function doGet(e) {
  var params = e.parameter;
  var action = params.action || 'check';

  try {
    if (action === 'check') {
      return jsonOut(checkLicense_(params.key, parseInt(params.jamaah) || 0));
    }
    if (action === 'ping') {
      return jsonOut({ ok: true, ts: new Date().toISOString() });
    }
    return jsonOut({ valid: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOut({ valid: false, error: err.message });
  }
}

/**
 * POST endpoint — admin operations (perlu password).
 */
function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    var pass   = body.adminPass;

    var adminPass = getAdminPass_();
    if (!adminPass) {
      return jsonOut({ success: false, error: 'ADMIN_PASS belum diset. Jalankan setAdminPass("passwordKuat") di editor License Server.' });
    }
    if (pass !== adminPass) {
      return jsonOut({ success: false, error: 'Akses ditolak.' });
    }

    if (action === 'create')     return jsonOut(createLicense_(body));
    if (action === 'update')     return jsonOut(updateLicense_(body));
    if (action === 'deactivate') return jsonOut(setStatus_(body.key, 'Nonaktif', body.alasan));
    if (action === 'activate')   return jsonOut(setStatus_(body.key, 'Aktif',    ''));
    if (action === 'upgrade')    return jsonOut(upgradePlan_(body));
    if (action === 'list')       return jsonOut({ success: true, data: getAllLicenses_() });
    if (action === 'delete')     return jsonOut(deleteLicense_(body.key));

    return jsonOut({ success: false, error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return jsonOut({ success: false, error: err.message });
  }
}

/**
 * Bridge untuk LicenseAdmin.html yang memanggil `google.script.run.adminAction(...)`.
 * Memproses payload sama seperti doPost (cek ADMIN_PASS + dispatch), lalu
 * mengembalikan OBJEK (bukan ContentService) agar bisa dibaca callback klien.
 * WAJIB ada di project License Server (LicenseAdmin.html bergantung padanya).
 */
function adminAction(bodyStr) {
  var resp = doPost({ postData: { contents: bodyStr } });
  return JSON.parse(resp.getContent());
}

// ─── CORE CHECK ──────────────────────────────────────────────────────────────

function checkLicense_(key, currentJamaah) {
  if (!key) return { valid: false, reason: 'License key tidak ditemukan.' };

  var sh   = getOrCreateSheet_();
  var data = sh.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(key)) continue;

    var row = {
      key:        data[i][0],
      namaTravel: data[i][1],
      email:      data[i][2],
      plan:       data[i][3],
      status:     data[i][4],
      tglMulai:   data[i][5],
      tglExpiry:  data[i][6],
      limitJamaah:parseInt(data[i][7]) || 200,
      limitKloter:parseInt(data[i][8]) || 4
    };

    // Cek status
    if (row.status === 'Nonaktif') {
      logAkses_(key, row.namaTravel, 'DENIED_INACTIVE');
      return {
        valid:      false,
        reason:     'Langganan tidak aktif. Hubungi Kelana untuk perpanjangan.',
        namaTravel: row.namaTravel,
        plan:       row.plan,
        status:     'Nonaktif'
      };
    }

    // Cek expiry
    var today   = new Date();
    var expiry  = new Date(row.tglExpiry);
    var daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      // Sudah expired — masuk grace period 7 hari (read-only mode)
      var graceLeft = daysLeft + 7;
      logAkses_(key, row.namaTravel, 'EXPIRED');
      return {
        valid:      false,
        reason:     'Langganan sudah berakhir sejak ' + formatDate_(expiry) + '.',
        graceMode:  graceLeft > 0,
        graceLeft:  Math.max(graceLeft, 0),
        namaTravel: row.namaTravel,
        plan:       row.plan,
        status:     'Expired'
      };
    }

    // Cek jamaah limit
    var jamaahOk = currentJamaah <= row.limitJamaah;
    if (!jamaahOk) {
      logAkses_(key, row.namaTravel, 'LIMIT_EXCEEDED');
      return {
        valid:        false,
        reason:       'Batas jamaah paket ' + row.plan + ' sudah tercapai (' + row.limitJamaah + ' jamaah). Upgrade untuk lanjutkan.',
        limitExceeded:true,
        limitJamaah:  row.limitJamaah,
        currentJamaah:currentJamaah,
        namaTravel:   row.namaTravel,
        plan:         row.plan,
        status:       'Aktif'
      };
    }

    // Update kolom terakhir akses
    sh.getRange(i + 1, 12).setValue(new Date());
    logAkses_(key, row.namaTravel, 'OK');

    return {
      valid:        true,
      namaTravel:   row.namaTravel,
      email:        row.email,
      plan:         row.plan,
      status:       'Aktif',
      tglExpiry:    formatDate_(expiry),
      daysLeft:     daysLeft,
      limitJamaah:  row.limitJamaah,
      limitKloter:  row.limitKloter,
      currentJamaah:currentJamaah,
      warning:      daysLeft <= 7 ? 'Langganan berakhir ' + daysLeft + ' hari lagi!' : null
    };
  }

  logAkses_(key, '?', 'KEY_NOT_FOUND');
  return { valid: false, reason: 'License key tidak valid.' };
}

// ─── ADMIN CRUD ───────────────────────────────────────────────────────────────

function createLicense_(body) {
  var sh   = getOrCreateSheet_();
  var key  = generateKey_();
  var plan = body.plan || 'Starter';
  var lim  = PLAN_LIMITS[plan] || PLAN_LIMITS['Starter'];
  var now  = new Date();

  // Default: 30 hari trial, atau 1 bulan dari sekarang
  var durasi  = parseInt(body.durasi) || 30;
  var expiry  = new Date(now);
  expiry.setDate(expiry.getDate() + durasi);

  sh.appendRow([
    key,
    body.namaTravel   || '',
    body.email        || '',
    plan,
    'Aktif',
    now,
    expiry,
    body.limitJamaah  || lim.jamaah,
    body.limitKloter  || lim.kloter,
    body.catatan      || '',
    now,
    now
  ]);

  return {
    success:    true,
    key:        key,
    namaTravel: body.namaTravel,
    plan:       plan,
    expiry:     formatDate_(expiry),
    limitJamaah: body.limitJamaah || lim.jamaah
  };
}

function updateLicense_(body) {
  var sh   = getOrCreateSheet_();
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(body.key)) continue;

    if (body.namaTravel)  sh.getRange(i+1, 2).setValue(body.namaTravel);
    if (body.email)       sh.getRange(i+1, 3).setValue(body.email);
    if (body.catatan !== undefined) sh.getRange(i+1, 10).setValue(body.catatan);
    sh.getRange(i+1, 12).setValue(new Date());
    return { success: true };
  }
  return { success: false, error: 'Key tidak ditemukan.' };
}

function upgradePlan_(body) {
  var sh   = getOrCreateSheet_();
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(body.key)) continue;

    var plan    = body.plan;
    var lim     = PLAN_LIMITS[plan] || PLAN_LIMITS['Starter'];
    var expiry  = new Date(data[i][6]);

    // Perpanjang jika ada tambahan hari
    if (body.tambahHari) {
      expiry = new Date(Math.max(expiry.getTime(), Date.now()));
      expiry.setDate(expiry.getDate() + parseInt(body.tambahHari));
      sh.getRange(i+1, 7).setValue(expiry);
    }

    sh.getRange(i+1, 4).setValue(plan);
    sh.getRange(i+1, 5).setValue('Aktif');
    sh.getRange(i+1, 8).setValue(body.limitJamaah || lim.jamaah);
    sh.getRange(i+1, 9).setValue(body.limitKloter || lim.kloter);
    sh.getRange(i+1, 12).setValue(new Date());

    return {
      success:    true,
      plan:       plan,
      limitJamaah:body.limitJamaah || lim.jamaah,
      expiry:     formatDate_(expiry)
    };
  }
  return { success: false, error: 'Key tidak ditemukan.' };
}

function setStatus_(key, status, alasan) {
  var sh   = getOrCreateSheet_();
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) !== String(key)) continue;
    sh.getRange(i+1, 5).setValue(status);
    if (alasan) sh.getRange(i+1, 10).setValue(alasan);
    sh.getRange(i+1, 12).setValue(new Date());
    return { success: true, status: status };
  }
  return { success: false, error: 'Key tidak ditemukan.' };
}

function deleteLicense_(key) {
  var sh   = getOrCreateSheet_();
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) !== String(key)) continue;
    sh.deleteRow(i + 1);
    return { success: true };
  }
  return { success: false, error: 'Key tidak ditemukan.' };
}

function getAllLicenses_() {
  var sh   = getOrCreateSheet_();
  if (sh.getLastRow() < 2) return [];
  var data = sh.getDataRange().getValues();
  var today = new Date();
  return data.slice(1).map(function(r) {
    var expiry   = r[6] ? new Date(r[6]) : null;
    var daysLeft = expiry ? Math.floor((expiry - today) / (1000*60*60*24)) : null;
    return {
      key:         r[0], namaTravel:  r[1],
      email:       r[2], plan:        r[3],
      status:      r[4],
      tglMulai:    formatDate_(r[5]),
      tglExpiry:   formatDate_(r[6]),
      limitJamaah: r[7], limitKloter: r[8],
      catatan:     r[9],
      daysLeft:    daysLeft,
      tglUpdate:   formatDate_(r[11])
    };
  });
}

// ─── TRIGGER: Cek expired harian ─────────────────────────────────────────────

/**
 * Jalankan setiap hari untuk auto-nonaktifkan yang sudah melewati grace period.
 * Setup: Apps Script → Triggers → setupExpiredTrigger → Time-driven → Day timer
 */
function setupExpiredTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'cekExpiredHarian') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('cekExpiredHarian')
    .timeBased().everyDays(1).atHour(7).create();
  Logger.log('Trigger harian berhasil di-setup.');
}

function cekExpiredHarian() {
  var sh    = getOrCreateSheet_();
  var data  = sh.getDataRange().getValues();
  var today = new Date();

  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    var status = String(data[i][4]);
    if (status === 'Nonaktif') continue;

    var expiry   = data[i][6] ? new Date(data[i][6]) : null;
    if (!expiry) continue;
    var daysLeft = Math.floor((expiry - today) / (1000*60*60*24));

    // Grace period 7 hari sudah habis → otomatis nonaktif
    if (daysLeft < -7 && status !== 'Nonaktif') {
      sh.getRange(i+1, 5).setValue('Nonaktif');
      sh.getRange(i+1, 10).setValue('Auto-expired ' + formatDate_(today));
      sh.getRange(i+1, 12).setValue(today);
    }
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (sh) return sh;

  sh = ss.insertSheet(SHEET_NAME);
  sh.appendRow([
    'LicenseKey','NamaTravel','Email','Plan','Status',
    'TglMulai','TglExpiry','LimitJamaah','LimitKloter',
    'Catatan','TglDibuat','TglUpdate'
  ]);
  sh.getRange(1, 1, 1, 12).setFontWeight('bold')
    .setBackground('#4f46e5').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.setColumnWidth(1, 180);
  sh.setColumnWidth(2, 180);
  return sh;
}

function logAkses_(key, namaTravel, result) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var shL = ss.getSheetByName(LOG_SHEET);
  if (!shL) {
    shL = ss.insertSheet(LOG_SHEET);
    shL.appendRow(['Timestamp','Key','NamaTravel','Hasil']);
    shL.getRange(1,1,1,4).setFontWeight('bold').setBackground('#1e1b4b').setFontColor('#fff');
    shL.setFrozenRows(1);
  }
  // Batasi log max 5000 baris
  if (shL.getLastRow() > 5000) shL.deleteRow(2);
  shL.appendRow([new Date(), key, namaTravel, result]);
}

function generateKey_() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var key   = 'KLN-';
  for (var g = 0; g < 3; g++) {
    for (var c = 0; c < 4; c++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    if (g < 2) key += '-';
  }
  return key; // Contoh: KLN-A2B3-C4D5-E6F7
}

function formatDate_(d) {
  if (!d) return '';
  try {
    var dt = new Date(d);
    return dt.toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'});
  } catch(e) { return String(d); }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── ADMIN UI ────────────────────────────────────────────────────────────────

function showAdminPanel() {
  var html = HtmlService.createHtmlOutputFromFile('LicenseAdmin')
    .setWidth(1100).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '🔑 Kelana License Manager');
}

// Alias agar pemanggilan `showLicenseAdmin` (mis. dari menu/dokumentasi) tetap jalan.
function showLicenseAdmin() { showAdminPanel(); }

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🔑 License Manager')
    .addItem('Buka Admin Panel', 'showAdminPanel')
    .addItem('Setup Trigger Harian', 'setupExpiredTrigger')
    .addToUi();
}
