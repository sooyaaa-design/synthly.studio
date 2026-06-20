/**
 * KELANA — WebApp.gs
 * ==================
 * Mengubah Kelana menjadi WEB APP penuh (dibuka via URL di browser,
 * bukan popup di Google Sheets).
 *
 * Berisi:
 *   - doGet()           → serve aplikasi (App.html)
 *   - Sistem LOGIN      → email + password (password di-hash SHA-256 + salt)
 *   - Session token     → disimpan di ScriptProperties, berlaku 12 jam
 *   - api()             → satu pintu untuk semua request dari frontend.
 *                         Otomatis cek session → RBAC (izin role) → lisensi → jalankan.
 *
 * CARA DEPLOY:
 *   1. Apps Script → Deploy → New Deployment → Web app
 *   2. Execute as: Me  |  Who has access: Anyone
 *   3. Salin URL → itulah alamat aplikasi travel
 *
 * SETUP LOGIN PERTAMA (jalankan sekali di editor Apps Script):
 *   buatAkunOwner('owner@travel.com', 'passwordRahasia')
 *
 * Pengguna lain dibuat oleh Owner lewat menu "Kelola Pengguna" di dalam app.
 */

// Pepper LEGACY (untuk instalasi lama yang hash-nya dibuat dengan nilai ini).
// Pepper aktif disimpan di ScriptProperties — unik per tenant — lihat getPepper_().
var AUTH_PEPPER_LEGACY = 'kelana_pepper_ganti_ini_2025';
var SESSION_HOURS   = 12;
var SESSION_PREFIX  = 'sess_';

/**
 * Ambil pepper aktif dari ScriptProperties (unik per tenant).
 * - Sudah tersimpan       → pakai itu.
 * - Belum ada & ada user   → pakai pepper legacy (agar hash lama tetap valid) lalu simpan.
 * - Belum ada & belum ada user (instalasi baru) → generate acak & simpan.
 */
function getPepper_() {
  var props = PropertiesService.getScriptProperties();
  var p = props.getProperty('AUTH_PEPPER');
  if (p) return p;
  var adaUserBerpassword = false;
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');
    adaUserBerpassword = sh && sh.getLastRow() >= 2 &&
      sh.getDataRange().getValues().slice(1).some(function(r){ return r[0] && r[5]; });
  } catch (e) {}
  var pepper = adaUserBerpassword ? AUTH_PEPPER_LEGACY : (Utilities.getUuid() + Utilities.getUuid());
  props.setProperty('AUTH_PEPPER', pepper);
  return pepper;
}

// Variabel per-request: diisi oleh api() setelah validasi token.
// Karena tiap google.script.run = 1 eksekusi terpisah, ini aman.
var _CURRENT_SESSION = null;

// ─── ENTRY POINT ───────────────────────────────────────────────────────────────

function doGet(e) {
  return HtmlService.createTemplateFromFile('App')
    .evaluate()
    .setTitle('Kelana — Manajemen Umroh')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk include file HTML lain di dalam App.html (jika dipecah).
 * Pakai: <?!= include('NamaFile') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── AUTH: LOGIN / LOGOUT / SESSION ─────────────────────────────────────────────

/**
 * Login dengan email atau nama akun + password.
 * Dipanggil dari frontend: google.script.run.login(emailOrUsername, password)
 * @returns {{success, token?, user?, error?}}
 */
function login(emailOrUsername, password) {
  try {
    var input = String(emailOrUsername || '').trim();
    if (!input || !password) return { success: false, error: 'Email/nama akun dan password wajib diisi.' };

    // Coba cari by email dulu, lalu by nama akun
    var u = cariPengguna_(input.toLowerCase());
    if (!u) u = cariPenggunaByUsername_(input);
    if (!u) return { success: false, error: 'Email atau nama akun tidak terdaftar.' };
    if (u.status !== 'Aktif')     return { success: false, error: 'Akun Anda nonaktif. Hubungi Owner.' };
    if (!u.passwordHash)          return { success: false, error: 'Password belum diset. Hubungi Owner.' };

    // Hash selalu menggunakan email (bukan username) sebagai salt
    var email = String(u.email).toLowerCase();
    if (u.passwordHash !== hashPassword_(password, email)) {
      return { success: false, error: 'Password salah.' };
    }

    var token = createSession_(email, u.role, u.nama);
    catatLoginTerakhir_(email);
    logActivity_(email, 'Login', 'Auth', '', 'Login berhasil (' + u.role + ')');

    return { success: true, token: token, user: { email: email, nama: u.nama, role: u.role } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function logout(token) {
  try { destroySession_(token); } catch (e) {}
  return { success: true };
}

/**
 * Apakah sistem belum punya pengguna sama sekali? (untuk layar setup pertama).
 * Dipanggil tanpa login dari App.html.
 */
function needsSetup() {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');
    if (!sh || sh.getLastRow() < 2) return { needsSetup: true };
    var ada = sh.getDataRange().getValues().slice(1).some(function(r){ return r[0]; });
    return { needsSetup: !ada };
  } catch (e) {
    return { needsSetup: true };
  }
}

/**
 * Buat akun Owner PERTAMA langsung dari UI (tanpa perlu buka editor Apps Script).
 * Hanya berhasil jika belum ada pengguna sama sekali (mencegah penyalahgunaan).
 * Sekaligus menyiapkan semua sheet & menyimpan Nama Travel.
 * @returns {{success, token?, user?, error?}}
 */
function setupOwnerPertama(data) {
  try {
    data = data || {};
    var sh = ensurePenggunaSheet_();
    var sudahAda = sh.getLastRow() >= 2 &&
      sh.getDataRange().getValues().slice(1).some(function(r){ return r[0]; });
    if (sudahAda) {
      return { success: false, error: 'Akun sudah ada. Hubungi Owner untuk dibuatkan akun.' };
    }

    var email    = String(data.email || '').toLowerCase().trim();
    var password = String(data.password || '');
    if (!email || email.indexOf('@') < 0) return { success: false, error: 'Email tidak valid.' };
    var perr = validatePasswordStrength_(password);
    if (perr)                              return { success: false, error: perr };

    // Buat akun owner DULU agar setupSheets_ → setupRolesSheet tidak menambah
    // akun Google pelaksana sebagai owner kedua.
    var nama = data.nama || 'Owner';
    var res = simpanPenggunaInternal_({
      email: email, nama: nama, role: 'Owner', status: 'Aktif', password: password
    });
    if (!res || !res.success) return res || { success: false, error: 'Gagal membuat akun.' };

    // Siapkan seluruh sheet (tanpa UI) agar sistem langsung siap dipakai.
    try { setupSheets_(); } catch (e) {}

    if (data.namaTravel) { try { setConfig_('NAMA_TRAVEL', data.namaTravel); } catch (e) {} }

    var token = createSession_(email, 'Owner', nama);
    catatLoginTerakhir_(email);
    logActivity_(email, 'Setup Owner', 'Auth', '', 'Akun Owner pertama dibuat via UI');
    return { success: true, token: token, user: { email: email, nama: nama, role: 'Owner' } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Cek apakah token masih valid (dipanggil saat app dibuka / refresh).
 */
function validateSession(token) {
  var s = resolveSession_(token);
  if (!s) return { success: false, error: 'SESSION_EXPIRED' };
  return { success: true, user: { email: s.email, nama: s.nama, role: s.role } };
}

function createSession_(email, role, nama) {
  var token = Utilities.getUuid();
  var data  = {
    email: email, role: role, nama: nama,
    exp:   Date.now() + SESSION_HOURS * 60 * 60 * 1000
  };
  PropertiesService.getScriptProperties()
    .setProperty(SESSION_PREFIX + token, JSON.stringify(data));
  return token;
}

function resolveSession_(token) {
  if (!token) return null;
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(SESSION_PREFIX + token);
    if (!raw) return null;
    var data = JSON.parse(raw);
    if (Date.now() > data.exp) { destroySession_(token); return null; }
    return data;
  } catch (e) { return null; }
}

function destroySession_(token) {
  if (token) PropertiesService.getScriptProperties().deleteProperty(SESSION_PREFIX + token);
}

// ─── PASSWORD ───────────────────────────────────────────────────────────────────

/** Validasi kekuatan password saat DI-SET (bukan saat login). '' = lolos. */
function validatePasswordStrength_(pw) {
  if (String(pw || '').length < 8) return 'Password minimal 8 karakter.';
  return '';
}

function hashPassword_(password, salt) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password) + '|' + String(salt) + '|' + getPepper_(),
    Utilities.Charset.UTF_8
  );
  return raw.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/**
 * Jalankan SEKALI di editor Apps Script untuk membuat akun Owner pertama.
 * Contoh: buatAkunOwner('owner@travel.com', 'rahasia123')
 */
function buatAkunOwner(email, password) {
  if (!email || !password) throw new Error('Isi email dan password. Contoh: buatAkunOwner("owner@travel.com","rahasia123")');
  ensurePenggunaSheet_();
  var hasil = simpanPenggunaInternal_({
    email: email, nama: 'Owner', role: 'Owner', status: 'Aktif', password: password
  });
  Logger.log('Akun Owner dibuat: ' + email);
  return hasil;
}

// ─── API DISPATCHER ──────────────────────────────────────────────────────────────
//
// Frontend memanggil: google.script.run.api(token, action, payload)
// Semua aksi melewati satu pintu ini: cek sesi → cek izin role → cek lisensi → jalankan.

// Aksi yang butuh izin tulis (akan diblok jika lisensi expired / limit tercapai).
var WRITE_ACTIONS = {
  'jamaah.create': 1, 'jamaah.update': 1, 'jamaah.delete': 1,
  'pembayaran.konfirmasi': 1, 'pembayaran.pelunasan': 1,
  'manifest.generate': 1, 'waBlast.send': 1,
  'roomlist.save': 1, 'roomlist.delete': 1, 'roomlist.autoAssign': 1,
  'lead.create': 1, 'lead.update': 1, 'lead.delete': 1, 'lead.konversi': 1,
  'dokumen.uploadFoto': 1, 'dokumen.save': 1,
  'keluarga.tambah': 1, 'roomlist.saveBatch': 1,
  'group.save': 1, 'group.delete': 1,
  'group.duplikasi': 1, 'petugas.save': 1, 'petugas.delete': 1,
  'pembayaran.uploadBukti': 1, 'addon.save': 1, 'addon.delete': 1,
  'paket.save': 1, 'paket.delete': 1
};

// Aksi → fitur (untuk cek PERMISSIONS di Roles.gs). null = boleh semua user login.
var ACTION_PERMISSION = {
  'auth.me':                null,
  'dashboard':              'dashboard',
  'group.list':             null,
  'paket.list':             null,
  'license.info':           null,
  'jamaah.list':            'daftarJamaah',
  'jamaah.page':            'daftarJamaah',
  'jamaah.get':             'daftarJamaah',
  'jamaah.create':          'tambahJamaah',
  'jamaah.update':          'editJamaah',
  'jamaah.delete':          'hapusJamaah',
  'lead.list':              'daftarJamaah',
  'pembayaran.list':        'pembayaran',
  'pembayaran.page':        'pembayaran',
  'pembayaran.detail':      'pembayaran',
  'pembayaran.konfirmasi':  'konfirmasiPembayaran',
  'pembayaran.uploadBukti': 'konfirmasiPembayaran',
  'pembayaran.pelunasan':   'konfirmasiPembayaran',
  'addon.list':             'pembayaran',
  'addon.save':             'konfirmasiPembayaran',
  'addon.delete':           'konfirmasiPembayaran',
  'pembayaran.reminder':    'pembayaran',
  'pembayaran.reminderText':'pembayaran',
  'laporan':                'laporanKeuangan',
  'manifest.eligible':      'manifest',
  'manifest.generate':      'manifestGenerate',
  'manifest.export':        'manifest',
  'waBlast.send':           'waBlast',
  'user.list':              'kelolaUser',
  'user.save':              'kelolaUser',
  'user.delete':            'kelolaUser',
  'user.resetPassword':     'kelolaUser',
  'log.list':               'dashboard', // dibatasi lagi di dalam getLogAktivitas (Owner/Admin)
  'invoice.preview':        'pembayaran',
  'export.jamaahCsv':       'daftarJamaah',
  'export.jamaahHtml':      'daftarJamaah',
  'roomlist.list':          'roomlist',
  'roomlist.save':          'roomlistEdit',
  'roomlist.delete':        'roomlistEdit',
  'roomlist.autoAssign':    'roomlistEdit',
  'roomlist.export':        'roomlist',
  'lead.create':            'tambahJamaah',
  'lead.update':            'tambahJamaah',
  'lead.delete':            'editJamaah',
  'lead.konversi':          'tambahJamaah',
  'dokumen.get':            'daftarJamaah',
  'dokumen.uploadFoto':     'editJamaah',
  'dokumen.save':           'editJamaah',
  'keluarga.tambah':        'tambahJamaah',
  'keluarga.tagihan':       'pembayaran',
  'roomlist.saveBatch':     'roomlistEdit',
  'export.jamaah':          'daftarJamaah',
  'group.save':             'kelolaGroup',
  'group.delete':           'kelolaGroup',
  'group.get':              null,
  'group.harga':            null,
  'group.duplikasi':        'kelolaGroup',
  'paket.save':             'kelolaGroup',
  'paket.delete':           'kelolaGroup',
  'petugas.list':           'daftarJamaah',
  'petugas.save':           'kelolaGroup',
  'petugas.delete':         'kelolaGroup',
  'siskopatuh.ringkasan':   'siskopatuh',
  'siskopatuh.kelengkapan': 'siskopatuh',
  'siskopatuh.exportCsv':   'siskopatuh',
  'siskopatuh.exportXlsx':  'siskopatuh',
  'siskopatuh.exportHtml':  'siskopatuh'
};

function api(token, action, payload) {
  try {
    var sess = resolveSession_(token);
    if (!sess) return { success: false, error: 'SESSION_EXPIRED' };
    _CURRENT_SESSION = sess;             // dipakai getCurrentUser_/getCurrentRole_ di Roles.gs
    payload = payload || {};

    // 1) Cek izin role
    if (!(action in ACTION_PERMISSION)) {
      return { success: false, error: 'Aksi tidak dikenal: ' + action };
    }
    var fitur = ACTION_PERMISSION[action];
    if (fitur && !hasPermission_(fitur)) {
      return { success: false, error: 'AKSES_DITOLAK', message: 'Role ' + sess.role + ' tidak punya izin untuk aksi ini.' };
    }

    // 2) Cek lisensi untuk aksi tulis (versi data, bukan popup UI)
    if (WRITE_ACTIONS[action]) {
      var lic = cekLisensiWebSafe_();
      if (lic.blocked) return { success: false, error: 'LISENSI', message: lic.message };
    }

    // 3) Jalankan
    var data = dispatchAction_(action, payload, sess);
    return { success: true, data: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function dispatchAction_(action, p, sess) {
  switch (action) {
    case 'auth.me':       return { email: sess.email, nama: sess.nama, role: sess.role };
    case 'dashboard':     return getDashboardFull();
    case 'group.list':    return getGroupList();
    case 'paket.list':    return getPaketList(p.includeNonaktif);
    case 'paket.save':    return logKalauSukses_(simpanPaket(p), 'Simpan Paket', 'Paket', p.namaPaket);
    case 'paket.delete':  return hapusPaket(p.idPaket);
    case 'license.info':  return getLicenseInfo();

    case 'jamaah.list':   return getJamaahList();
    case 'jamaah.page':   return getJamaahPage(p);
    case 'jamaah.get':    return getJamaahDetail(p.idJamaah);
    case 'jamaah.create': return logKalauSukses_(simpanJamaah(p), 'Tambah Jamaah', 'Jamaah', p.namaLengkap);
    case 'jamaah.update': return logKalauSukses_(updateJamaah(p), 'Update Jamaah', 'Jamaah', p.namaLengkap);
    case 'jamaah.delete': return hapusJamaah(p.idJamaah);

    case 'lead.list':     return getLeadList();

    case 'pembayaran.list':       return getPembayaranList(p.filterStatus);
    case 'pembayaran.page':       return getPembayaranPage(p);
    case 'pembayaran.detail':     return getPembayaranDetail(p.idInvoice);
    case 'pembayaran.konfirmasi': return konfirmasiPembayaranManual(p.idInvoice, p.metode, p.catatan, p.buktiBayar);
    case 'pembayaran.uploadBukti':return uploadBuktiBayar(p.idInvoice, p.base64, p.mimeType, p.fileName);
    case 'pembayaran.pelunasan':  return generateInvoicePelunasan(p.idJamaah);
    case 'pembayaran.reminder':     return kirimReminderWA(p.idInvoice, p.customMsg);
    case 'pembayaran.reminderText': return getReminderWAText(p.idInvoice);
    case 'laporan':               return getLaporanKeuangan(p.idGroup);

    case 'addon.list':   return getAddOnList(p.idJamaah);
    case 'addon.save':   return logKalauSukses_(simpanAddOn(p), 'Simpan AddOn', 'AddOn', p.namaItem);
    case 'addon.delete': return hapusAddOn(p.idAddOn);

    case 'manifest.eligible': return getJamaahEligibleManifest(p.idGroup);
    case 'manifest.generate': return generateManifest(p);
    case 'manifest.export':   return exportManifestHtml(p.idGroup);

    case 'waBlast.send':  return kirimWABlast(p);

    case 'user.list':          return getDaftarPengguna();
    case 'user.save':          return simpanPenggunaInternal_(p);
    case 'user.delete':        return hapusPengguna(p.email);
    case 'user.resetPassword': return setPasswordPengguna_(p.email, p.password);

    case 'log.list':           return getLogAktivitas(p.limit || 200);

    case 'invoice.preview':    return getInvoiceHtml(p.idInvoice);
    case 'export.jamaahCsv':   return exportJamaahCsv(p.idGroup);
    case 'export.jamaahHtml':  return exportJamaahHtml();

    case 'roomlist.list':       return getRoomlist(p.idGroup);
    case 'roomlist.save':       return saveRoomAssignment(p);
    case 'roomlist.delete':     return deleteRoomAssignment(p.idRoom);
    case 'roomlist.autoAssign': return autoAssignRooms(p.idGroup, p.kapasitas);
    case 'roomlist.export':     return exportRoomlistHtml(p.idGroup);

    case 'lead.create':         return logKalauSukses_(simpanLead(p), 'Tambah Lead', 'Lead', p.nama);
    case 'lead.update':         return logKalauSukses_(simpanLead(p), 'Update Lead', 'Lead', p.nama);
    case 'lead.delete':         return hapusLead(p.idLead);
    case 'lead.konversi':       return konversiLeadKeJamaah(p.idLead);

    case 'dokumen.get':         return getDokumenJamaah(p.idJamaah);
    case 'dokumen.uploadFoto':  return uploadFotoJamaah(p.idJamaah, p.jenisFile, p.base64, p.mimeType, p.fileName);
    case 'dokumen.save':        return updateDokumenData(p.idJamaah, p);

    case 'keluarga.tambah':     return logKalauSukses_(simpanKeluarga(p.members), 'Tambah Keluarga', 'Jamaah', p.members&&p.members[0]?p.members[0].namaLengkap:'');
    case 'keluarga.tagihan':    return getKeluargaTagihan();
    case 'roomlist.saveBatch':  return saveRoomBatch(p.assignments);
    case 'export.jamaah':       return exportJamaahCsv(p.idGroup);

    case 'group.save':   return logKalauSukses_(simpanGroup(p), 'Simpan Kloter', 'Group', p.namaGroup);
    case 'group.delete': return hapusGroup(p.idGroup);
    case 'group.get':    return getGroupById(p.idGroup);
    case 'group.harga':     return { harga: hitungHargaJamaah_(p.idGroup, p.tipeKamar, p.kategori) };
    case 'group.duplikasi': return duplikasiGroup(p.idGroup);
    case 'petugas.list':    return getPetugasList(p.idGroup);
    case 'petugas.save':    return logKalauSukses_(simpanPetugas(p), 'Simpan Petugas', 'Petugas', p.namaLengkap);
    case 'petugas.delete':  return hapusPetugas(p.idPetugas);

    case 'siskopatuh.ringkasan':   return getSiskopatuhRingkasan();
    case 'siskopatuh.kelengkapan': return cekKelengkapanSiskopatuh(p.idGroup);
    case 'siskopatuh.exportCsv':   return exportSiskopatuhCsv(p.idGroup, p.onlyComplete);
    case 'siskopatuh.exportXlsx':  return exportSiskopatuhXlsx(p.idGroup, p.onlyComplete);
    case 'siskopatuh.exportHtml':  return exportSiskopatuhHtml(p.idGroup);
  }
  throw new Error('Aksi belum diimplementasi: ' + action);
}

// Tulis log hanya jika hasil sukses, lalu kembalikan hasil apa adanya.
function logKalauSukses_(result, aksi, modul, detail) {
  if (result && result.success) {
    logActivity_(getCurrentUser_(), aksi, modul, result.idJamaah || '', String(detail || ''));
  }
  return result;
}

// ─── LISENSI: VERSI WEB-SAFE (tanpa popup UI) ────────────────────────────────────

function cekLisensiWebSafe_() {
  try {
    var lic = cekLisensi_();
    if (!lic) return { blocked: false };
    if (lic.valid) return { blocked: false, warning: lic.warning || null };

    if (lic.noKey)        return { blocked: true,  message: 'Lisensi belum diatur. Hubungi Kelana.' };
    if (lic.graceMode)    return { blocked: true,  message: 'Masa langganan berakhir. Data hanya bisa dilihat. Hubungi Kelana untuk perpanjangan.' };
    if (lic.limitExceeded)return { blocked: true,  message: 'Batas jamaah paket Anda tercapai. Upgrade paket untuk menambah data.' };
    return { blocked: true, message: lic.reason || 'Langganan tidak aktif.' };
  } catch (e) {
    return { blocked: false }; // jika gagal cek, jangan blokir (offline tolerance)
  }
}

// ─── PENGGUNA + PASSWORD (sheet Pengguna 8 kolom) ────────────────────────────────
//
// Sheet Pengguna kolom (0-idx):
//   0:Email 1:Nama 2:Role 3:Status 4:TglDibuat 5:PasswordHash 6:TglLogin 7:NamaAkun

function ensurePenggunaSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pengguna');
  if (!sh) {
    sh = ss.insertSheet('Pengguna');
    sh.appendRow(['Email','Nama','Role','Status','TglDibuat','PasswordHash','TglLogin','Nama Akun']);
    sh.getRange(1,1,1,8).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#fff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 160);
    return sh;
  }
  if (sh.getLastColumn() < 7) {
    sh.getRange(1, 6).setValue('PasswordHash');
    sh.getRange(1, 7).setValue('TglLogin');
  }
  if (sh.getLastColumn() < 8) {
    sh.getRange(1, 8).setValue('Nama Akun');
    sh.getRange(1,1,1,8).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#fff');
  }
  return sh;
}

function cariPengguna_(email) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');
  if (!sh || sh.getLastRow() < 2) return null;
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).toLowerCase() === email) {
      return {
        email: rows[i][0], nama: rows[i][1], role: rows[i][2],
        status: rows[i][3] || 'Aktif', passwordHash: rows[i][5] || '',
        namaAkun: rows[i][7] || '', rowIndex: i + 1
      };
    }
  }
  return null;
}

function cariPenggunaByUsername_(username) {
  if (!username) return null;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');
  if (!sh || sh.getLastRow() < 2) return null;
  var rows = sh.getDataRange().getValues();
  var u = String(username).toLowerCase();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][7] && String(rows[i][7]).toLowerCase() === u) {
      return {
        email: rows[i][0], nama: rows[i][1], role: rows[i][2],
        status: rows[i][3] || 'Aktif', passwordHash: rows[i][5] || '',
        namaAkun: rows[i][7] || '', rowIndex: i + 1
      };
    }
  }
  return null;
}

/**
 * Simpan / update pengguna (termasuk password jika diisi).
 * Dipakai oleh api('user.save') dan buatAkunOwner().
 * Tidak pernah mengembalikan passwordHash ke frontend.
 */
function simpanPenggunaInternal_(data) {
  // Izin: dipanggil dari api() yang sudah cek kelolaUser; buatAkunOwner dipanggil dari editor.
  try {
    var sh    = ensurePenggunaSheet_();
    var email = String(data.email || '').toLowerCase().trim();
    if (!email) return { success: false, error: 'Email wajib diisi.' };
    if (data.password) {
      var perr = validatePasswordStrength_(data.password);
      if (perr) return { success: false, error: perr };
    }

    var existing = cariPengguna_(email);
    if (existing) {
      sh.getRange(existing.rowIndex, 2).setValue(data.nama   || existing.nama);
      sh.getRange(existing.rowIndex, 3).setValue(data.role   || existing.role);
      sh.getRange(existing.rowIndex, 4).setValue(data.status || 'Aktif');
      if (data.password) sh.getRange(existing.rowIndex, 6).setValue(hashPassword_(data.password, email));
      if (data.namaAkun !== undefined) sh.getRange(existing.rowIndex, 8).setValue(data.namaAkun || '');
      logActivity_(getCurrentUser_() || email, 'Update Pengguna', 'Pengguna', email, 'Role: ' + (data.role||existing.role));
      return { success: true, action: 'updated' };
    }

    var hash = data.password ? hashPassword_(data.password, email) : '';
    sh.appendRow([email, data.nama || '', data.role || 'Marketing', data.status || 'Aktif', new Date(), hash, '', data.namaAkun || '']);
    logActivity_(getCurrentUser_() || email, 'Tambah Pengguna', 'Pengguna', email, 'Role: ' + (data.role||'Marketing'));
    return { success: true, action: 'created' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function setPasswordPengguna_(email, password) {
  if (!email || !password) return { success: false, error: 'Email dan password wajib diisi.' };
  var perr = validatePasswordStrength_(password);
  if (perr) return { success: false, error: perr };
  var u = cariPengguna_(String(email).toLowerCase());
  if (!u) return { success: false, error: 'Pengguna tidak ditemukan.' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna');
  sh.getRange(u.rowIndex, 6).setValue(hashPassword_(password, u.email.toLowerCase()));
  logActivity_(getCurrentUser_(), 'Reset Password', 'Pengguna', u.email, '');
  return { success: true };
}

function catatLoginTerakhir_(email) {
  try {
    var u = cariPengguna_(email);
    if (!u) return;
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pengguna')
      .getRange(u.rowIndex, 7).setValue(new Date());
  } catch (e) {}
}

// ─── LEAD ─────────────────────────────────────────────────────────────────────

function getLeadList() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Lead');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0]; })
    .map(function(r) {
      return {
        idLead: r[0], nama: r[1], noHp: r[2], email: r[3],
        sumber: r[4], status: r[5], minatPaket: r[6], catatan: r[7],
        tglMasuk: r[8] ? formatTanggal_(r[8]) : '', ditangani: r[9] || ''
      };
    });
}
