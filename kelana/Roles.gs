/**
 * KELANA — Role-Based Access Control (RBAC)
 * ==========================================
 * Tambahkan file ini ke setiap client Apps Script.
 *
 * ROLE YANG TERSEDIA:
 *   Owner     — akses semua fitur + kelola pengguna + lihat log
 *   Admin     — jamaah, dokumen, roomlist, manifest (tidak bisa lihat finance)
 *   Finance   — pembayaran, invoice, laporan keuangan (tidak bisa edit jamaah)
 *   Marketing — tambah jamaah, daftar jamaah, lead (tidak bisa lihat finance/settings)
 *
 * CARA SETUP:
 *   1. Jalankan setupRolesSheet() dari menu Kelana → Setup Awal (sudah otomatis)
 *   2. Sheet "Pengguna" akan terbuat
 *   3. Owner isi email pengguna + role di sheet tersebut
 *   4. Atau gunakan Kelana → Kelola Pengguna untuk UI yang lebih mudah
 *
 * AKSES MATRIX:
 * ┌──────────────────────────┬───────┬───────┬─────────┬───────────┐
 * │ Fitur                    │ Owner │ Admin │ Finance │ Marketing │
 * ├──────────────────────────┼───────┼───────┼─────────┼───────────┤
 * │ Dashboard (stats)        │  ✅  │  ✅   │   ✅    │    ✅     │
 * │ Daftar Jamaah            │  ✅  │  ✅   │   ✅    │    ✅     │
 * │ Tambah Jamaah            │  ✅  │  ✅   │   ❌    │    ✅     │
 * │ Edit / Hapus Jamaah      │  ✅  │  ✅   │   ❌    │    ❌     │
 * │ Roomlist                 │  ✅  │  ✅   │   ❌    │    ❌     │
 * │ Manifest                 │  ✅  │  ✅   │   ❌    │    ❌     │
 * │ WA Blast                 │  ✅  │  ✅   │   ❌    │    ✅     │
 * │ Lihat Pembayaran         │  ✅  │  ❌   │   ✅    │    ❌     │
 * │ Konfirm Pembayaran       │  ✅  │  ❌   │   ✅    │    ❌     │
 * │ Laporan Keuangan         │  ✅  │  ❌   │   ✅    │    ❌     │
 * │ Kelola Pengguna          │  ✅  │  ❌   │   ❌    │    ❌     │
 * │ Pengaturan (Config)      │  ✅  │  ❌   │   ❌    │    ❌     │
 * └──────────────────────────┴───────┴───────┴─────────┴───────────┘
 */

// ─── PERMISSION MAP ──────────────────────────────────────────────────────────

var PERMISSIONS = {
  'dashboard':         ['Owner', 'Admin', 'Finance', 'Marketing', 'Pembimbing'],
  'daftarJamaah':      ['Owner', 'Admin', 'Finance', 'Marketing', 'Pembimbing'],
  'tambahJamaah':      ['Owner', 'Admin', 'Marketing'],
  'editJamaah':        ['Owner', 'Admin'],
  'hapusJamaah':       ['Owner'],
  'roomlist':          ['Owner', 'Admin', 'Pembimbing'],   // lihat/cetak
  'roomlistEdit':      ['Owner', 'Admin'],                  // ubah/simpan
  'manifest':          ['Owner', 'Admin', 'Pembimbing'],   // lihat/cetak
  'manifestGenerate':  ['Owner', 'Admin'],                  // generate
  'waBlast':           ['Owner', 'Admin', 'Marketing'],
  'pembayaran':        ['Owner', 'Finance'],
  'konfirmasiPembayaran': ['Owner', 'Finance'],
  'laporanKeuangan':   ['Owner', 'Finance'],
  'kelolaGroup':       ['Owner', 'Admin'],
  'kelolaPacket':      ['Owner'],
  'kelolaUser':        ['Owner'],
  'siskopatuh':        ['Owner', 'Admin'],
  'pengaturan':        ['Owner']
};

// ─── CORE FUNCTIONS ───────────────────────────────────────────────────────────

/**
 * Ambil email user yang sedang login.
 * Mode web app  → dari sesi login (_CURRENT_SESSION, diisi oleh api() di WebApp.gs).
 * Mode popup     → dari akun Google yang membuka spreadsheet.
 */
function getCurrentUser_() {
  if (typeof _CURRENT_SESSION !== 'undefined' && _CURRENT_SESSION && _CURRENT_SESSION.email) {
    return _CURRENT_SESSION.email;
  }
  return Session.getActiveUser().getEmail() || '';
}

/**
 * Ambil role user yang sedang login.
 * Mode web app  → langsung dari sesi login.
 * Mode popup     → dilookup dari sheet Pengguna berdasarkan email akun Google.
 * Jika email tidak ditemukan di sheet Pengguna → default 'Marketing' (paling terbatas)
 * Jika sheet Pengguna kosong (belum setup) → default 'Owner' (agar tidak terkunci saat setup awal)
 */
function getCurrentRole_() {
  if (typeof _CURRENT_SESSION !== 'undefined' && _CURRENT_SESSION && _CURRENT_SESSION.role) {
    return _CURRENT_SESSION.role;
  }
  var email = getCurrentUser_().toLowerCase();
  var sh    = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');

  // Sheet belum ada atau kosong → anggap Owner (setup awal)
  if (!sh || sh.getLastRow() < 2) return 'Owner';

  var data = sh.getDataRange().getValues().slice(1);
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0] || '').toLowerCase() === email &&
        String(data[i][3] || '').toLowerCase() === 'aktif') {
      return String(data[i][2] || 'Marketing');
    }
  }

  // Email tidak ditemukan → jika tidak ada pengguna sama sekali, beri Owner
  var hasAny = data.some(function(r){ return r[0]; });
  return hasAny ? 'Marketing' : 'Owner';
}

/**
 * Cek apakah user punya izin untuk fitur tertentu.
 * @param {string} fitur — nama fitur dari PERMISSIONS map
 * @returns {boolean}
 */
function hasPermission_(fitur) {
  var role  = getCurrentRole_();
  var perms = PERMISSIONS[fitur];
  if (!perms) return role === 'Owner'; // fitur tidak terdaftar → hanya Owner
  return perms.indexOf(role) !== -1;
}

/**
 * Throw error jika tidak punya izin.
 * Gunakan ini di awal show functions.
 */
function requirePermission_(fitur) {
  if (!hasPermission_(fitur)) {
    var role = getCurrentRole_();
    throw new Error(
      'Akses ditolak. Role Anda (' + role + ') tidak memiliki izin untuk fitur ini.\n' +
      'Hubungi Owner untuk mengubah hak akses Anda.'
    );
  }
}

/**
 * Ambil info role + permissions untuk ditampilkan di sidebar.
 */
function getUserRoleInfo() {
  var email = getCurrentUser_();
  var role  = getCurrentRole_();

  // Daftar fitur yang boleh diakses
  var canAccess = Object.keys(PERMISSIONS).filter(function(f) {
    return PERMISSIONS[f].indexOf(role) !== -1;
  });

  return {
    email:     email,
    role:      role,
    canAccess: canAccess
  };
}

// ─── SHOW FUNCTIONS — DENGAN PERMISSION CHECK ────────────────────────────────

// Override show functions dari Code.additions.gs untuk tambah permission check.
// Karena semua .gs share namespace, functions ini akan menggantikan yang di Code.additions.gs.
// CATATAN: HAPUS showDashboard dll dari Code.additions.gs jika menggunakan file ini.

function showDashboard() {
  requirePermission_('dashboard');
  var html = HtmlService.createHtmlOutputFromFile('Dashboard').setWidth(1060).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '📊 Dashboard Kelana');
}

function showTambahJamaah() {
  requirePermission_('tambahJamaah');
  if (!requireLicense_('write')) return;
  var html = HtmlService.createHtmlOutputFromFile('TambahJamaah').setWidth(860).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '👤 Tambah Jamaah Baru');
}

function showDaftarJamaah() {
  requirePermission_('daftarJamaah');
  var html = HtmlService.createHtmlOutputFromFile('DaftarJamaah').setWidth(1100).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '📋 Daftar Jamaah');
}

function showPembayaran() {
  requirePermission_('pembayaran');
  var html = HtmlService.createHtmlOutputFromFile('Pembayaran').setWidth(1060).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '💳 Manajemen Pembayaran');
}

function showRoomlist() {
  requirePermission_('roomlist');
  if (!requireLicense_('write')) return;
  var html = HtmlService.createHtmlOutputFromFile('Roomlist').setWidth(1000).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '🏨 Roomlist Builder');
}

function showManifest() {
  requirePermission_('manifest');
  var html = HtmlService.createHtmlOutputFromFile('Manifest').setWidth(980).setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, '✈ Generate Manifest Penerbangan');
}

function showWaBlast() {
  requirePermission_('waBlast');
  var html = HtmlService.createHtmlOutputFromFile('WaBlast').setWidth(900).setHeight(680);
  SpreadsheetApp.getUi().showModalDialog(html, '📲 WA Blast ke Jamaah');
}

function showSiskopatuh() {
  requirePermission_('siskopatuh');
  var html = HtmlService.createHtmlOutputFromFile('Siskopatuh').setWidth(1040).setHeight(720);
  SpreadsheetApp.getUi().showModalDialog(html, '🏛 Ekspor Data SISKOPATUH');
}

function showKelolaUser() {
  requirePermission_('kelolaUser');
  var html = HtmlService.createHtmlOutputFromFile('KelolaUser').setWidth(800).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '👥 Kelola Pengguna & Hak Akses');
}

function showPengaturan() {
  requirePermission_('pengaturan');
  var html = HtmlService.createHtmlOutputFromFile('Pengaturan').setWidth(700).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, '⚙ Pengaturan Kelana');
}

// ─── WRITE WRAPPERS — LOG + PERMISSION ──────────────────────────────────────

/**
 * Override simpanJamaah untuk tambah permission + license check + logging.
 * Ini akan override versi di Code.gs — pastikan tidak ada konflik nama.
 */
function simpanJamaahSecure(data) {
  if (!hasPermission_('tambahJamaah')) return { success: false, error: 'Akses ditolak.' };
  if (!requireLicense_('write'))       return { success: false, error: 'Lisensi tidak valid.' };

  // Tambah info user yang simpan
  data.dibuatOleh = getCurrentUser_();
  var result = simpanJamaah(data);

  if (result && result.success) {
    logActivity_(getCurrentUser_(), 'Tambah Jamaah', 'Jamaah',
      result.idJamaah || '—', 'Nama: ' + data.namaLengkap);
  }
  return result;
}

function hapusJamaahSecure(idJamaah) {
  if (!hasPermission_('hapusJamaah')) return { success: false, error: 'Hanya Owner yang bisa menghapus jamaah.' };
  var result = hapusJamaah(idJamaah);
  if (result && result.success) {
    logActivity_(getCurrentUser_(), 'Hapus Jamaah', 'Jamaah', idJamaah, 'Nama: ' + result.nama);
  }
  return result;
}

function konfirmasiPembayaranSecure(idInvoice, metode, catatan) {
  if (!hasPermission_('konfirmasiPembayaran')) return { success: false, error: 'Akses ditolak.' };
  return konfirmasiPembayaranManual(idInvoice, metode, catatan);
}

function generateManifestSecure(params) {
  if (!hasPermission_('manifest')) return { success: false, error: 'Akses ditolak.' };
  var result = generateManifest(params);
  if (result && result.success) {
    logActivity_(getCurrentUser_(), 'Generate Manifest', 'Manifest',
      params.idGroup, params.namaGroup + ' — ' + result.count + ' jamaah');
  }
  return result;
}

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * Ambil daftar pengguna (hanya Owner).
 */
function getDaftarPengguna() {
  if (!hasPermission_('kelolaUser')) return { success: false, error: 'Akses ditolak.' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');
  if (!sh || sh.getLastRow() < 2) return { success: true, data: [] };
  return {
    success: true,
    data: sh.getDataRange().getValues().slice(1).map(function(r) {
      return {
        email: r[0], nama: r[1], role: r[2], status: r[3],
        tglDibuat:   r[4] ? String(r[4]).substring(0,10) : '',
        hasPassword: !!r[5],
        tglLogin:    r[6] ? String(r[6]).substring(0,16) : '',
        namaAkun:    r[7] || ''
      };
    }).filter(function(r){ return r.email; })
  };
}

/**
 * Simpan / update pengguna.
 */
function simpanPengguna(data) {
  if (!hasPermission_('kelolaUser')) return { success: false, error: 'Akses ditolak.' };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Pengguna');
    if (!sh) {
      sh = ss.insertSheet('Pengguna');
      sh.appendRow(['Email','Nama','Role','Status','TglDibuat']);
      sh.getRange(1,1,1,5).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#fff');
      sh.setFrozenRows(1);
    }

    var email = String(data.email || '').toLowerCase().trim();
    if (!email) return { success: false, error: 'Email wajib diisi.' };

    // Cek apakah sudah ada
    var rows = sh.getLastRow() > 1 ? sh.getDataRange().getValues() : [];
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase() === email) {
        sh.getRange(i+1, 2).setValue(data.nama  || rows[i][1]);
        sh.getRange(i+1, 3).setValue(data.role  || rows[i][2]);
        sh.getRange(i+1, 4).setValue(data.status || 'Aktif');
        logActivity_(getCurrentUser_(), 'Update Pengguna', 'Pengguna', email,
          'Role: ' + data.role);
        return { success: true, action: 'updated' };
      }
    }

    // Tambah baru
    sh.appendRow([email, data.nama || '', data.role || 'Marketing', data.status || 'Aktif', new Date()]);
    logActivity_(getCurrentUser_(), 'Tambah Pengguna', 'Pengguna', email, 'Role: ' + data.role);
    return { success: true, action: 'created' };
  } catch(err) {
    return { success: false, error: err.message };
  }
}

/**
 * Hapus pengguna.
 */
function hapusPengguna(email) {
  if (!hasPermission_('kelolaUser')) return { success: false, error: 'Akses ditolak.' };
  var sh   = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');
  if (!sh) return { success: false, error: 'Sheet tidak ditemukan.' };
  var data = sh.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]).toLowerCase() === email.toLowerCase()) {
      sh.deleteRow(i + 1);
      logActivity_(getCurrentUser_(), 'Hapus Pengguna', 'Pengguna', email, '');
      return { success: true };
    }
  }
  return { success: false, error: 'Pengguna tidak ditemukan.' };
}

// ─── LOG ACTIVITY (enhanced) ─────────────────────────────────────────────────

/**
 * Ambil log aktivitas (untuk Owner dan Admin).
 */
function getLogAktivitas(limit) {
  if (getCurrentRole_() === 'Marketing' || getCurrentRole_() === 'Finance') {
    return { success: false, error: 'Akses log hanya untuk Owner dan Admin.' };
  }
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log Aktivitas');
  if (!sh || sh.getLastRow() < 2) return { success: true, data: [] };

  limit = limit || 200;
  var data = sh.getDataRange().getValues();
  var rows = data.slice(1).reverse().slice(0, limit);

  return {
    success: true,
    data: rows.map(function(r) {
      return {
        timestamp: r[0] ? new Date(r[0]).toLocaleString('id-ID') : '—',
        user:    r[1] || '—',
        aksi:    r[2] || '—',
        modul:   r[3] || '—',
        idRecord:r[4] || '—',
        detail:  r[5] || ''
      };
    })
  };
}

// ─── SETUP ───────────────────────────────────────────────────────────────────

function setupRolesSheet() {
  // ensurePenggunaSheet_ (WebApp.gs) membuat sheet 7 kolom + migrasi otomatis.
  var sh = ensurePenggunaSheet_();

  // Tambah owner pertama dari email yang menjalankan setup (mode popup).
  // Untuk mode web app, gunakan buatAkunOwner('email','password') agar bisa login.
  if (sh.getLastRow() < 2) {
    var ownerEmail = getCurrentUser_();
    if (ownerEmail) {
      sh.appendRow([ownerEmail, 'Owner', 'Owner', 'Aktif', new Date(), '', '']);
    }
  }
}

// Catatan: fungsi bridge `adminAction` untuk License Admin kini berada di
// LicenseServer.gs (project License Server), bukan di sini (project client).
