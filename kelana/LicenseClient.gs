/**
 * KELANA — License Client
 * =======================
 * Tambahkan file ini ke Apps Script SETIAP CLIENT (travel).
 *
 * Cara pakai:
 *   1. Paste file ini sebagai "LicenseClient.gs" di project client
 *   2. Di sheet Config, tambahkan key:
 *      - LICENSE_KEY  → key yang Anda berikan (format: KLN-XXXX-XXXX-XXXX)
 *      - LICENSE_URL  → URL deployment License Server Anda
 *   3. Fungsi-fungsi di Code.gs akan otomatis memanggil cekLisensi_()
 *
 * Behavior:
 *   - Aktif & valid  → sistem berjalan normal
 *   - Hampir expired (≤7 hari) → muncul warning banner di sidebar
 *   - Expired (grace 7 hari) → read-only mode: bisa lihat data, tidak bisa input baru
 *   - Expired > 7 hari + Nonaktif → sistem terkunci, tampil pesan upgrade
 *   - Limit jamaah tercapai → tidak bisa tambah jamaah, tampil pesan upgrade
 */

// Cache hasil check agar tidak terlalu sering hit server (berlaku 6 jam)
var LICENSE_CACHE_KEY  = 'kelana_license_cache';
var LICENSE_CACHE_HOUR = 6;

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Cek lisensi saat ini. Return object hasil check.
 * Gunakan ini untuk validasi sebelum aksi penting.
 *
 * @param {boolean} [forceRefresh] — paksa ambil ulang dari server
 * @returns {{
 *   valid: boolean, plan?: string, namaTravel?: string,
 *   daysLeft?: number, limitJamaah?: number, warning?: string,
 *   reason?: string, graceMode?: boolean, limitExceeded?: boolean
 * }}
 */
function cekLisensi_(forceRefresh) {
  // Ambil dari cache jika masih valid
  if (!forceRefresh) {
    var cached = getCachedLicense_();
    if (cached) return cached;
  }

  var key = getConfig_('LICENSE_KEY');
  var url = getConfig_('LICENSE_URL');

  if (!key || !url) {
    return {
      valid:  false,
      reason: 'LICENSE_KEY atau LICENSE_URL belum diisi di Config sheet.',
      noKey:  true
    };
  }

  // Hitung jumlah jamaah sekarang
  var jumlahJamaah = 0;
  try {
    var shJ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
    if (shJ && shJ.getLastRow() > 1) jumlahJamaah = shJ.getLastRow() - 1;
  } catch(e) {}

  try {
    var resp = UrlFetchApp.fetch(
      url + '?action=check&key=' + encodeURIComponent(key) + '&jamaah=' + jumlahJamaah,
      { muteHttpExceptions: true, deadline: 8 }
    );
    var result = JSON.parse(resp.getContentText());
    cacheLicense_(result);
    return result;
  } catch (err) {
    // Jika gagal koneksi, gunakan cache lama (jika ada) atau izinkan sementara
    var oldCache = getCachedLicense_(true); // ambil cache lama walau sudah expired
    if (oldCache) return oldCache;
    return { valid: true, offline: true, warning: 'Tidak bisa cek lisensi — mode offline.' };
  }
}

/**
 * Blokir aksi jika lisensi tidak valid.
 * Panggil di awal fungsi-fungsi penting (simpanJamaah, dsb).
 *
 * @param {'write'|'read'} [mode] — 'write': blokir jika expired/nonaktif | 'read': hanya warning
 * @returns {boolean} true = boleh lanjut, false = harus stop
 */
function requireLicense_(mode) {
  var lic = cekLisensi_();
  mode = mode || 'write';

  if (!lic.valid) {
    if (lic.noKey) {
      SpreadsheetApp.getUi().alert(
        '⚙ Setup Belum Lengkap',
        'LICENSE_KEY dan LICENSE_URL belum diisi di sheet Config.\n\n' +
        'Hubungi Kelana Travel untuk mendapatkan license key Anda.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return false;
    }

    if (lic.graceMode) {
      // Grace period: boleh baca, tidak bisa tulis baru
      if (mode === 'write') {
        SpreadsheetApp.getUi().alert(
          '⏰ Masa Tenggang Berakhir Segera',
          'Langganan Anda sudah berakhir.\n' +
          'Sisa masa tenggang: ' + (lic.graceLeft || 0) + ' hari.\n\n' +
          'Anda masih bisa melihat data, tetapi tidak bisa menambah data baru.\n\n' +
          'Hubungi Kelana untuk perpanjangan:\n' + (getConfig_('KELANA_CONTACT') || 'wa.me/xxxxxxx'),
          SpreadsheetApp.getUi().ButtonSet.OK
        );
        return false;
      }
      return true; // read mode boleh
    }

    if (lic.limitExceeded) {
      SpreadsheetApp.getUi().alert(
        '📊 Batas Jamaah Tercapai',
        'Paket ' + (lic.plan||'') + ' Anda sudah mencapai batas ' + lic.limitJamaah + ' jamaah.\n\n' +
        'Upgrade ke paket yang lebih tinggi untuk menambah jamaah.\n\n' +
        'Hubungi Kelana: ' + (getConfig_('KELANA_CONTACT') || 'wa.me/xxxxxxx'),
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return false;
    }

    // Expired / Nonaktif total
    SpreadsheetApp.getUi().alert(
      '🔒 Akses Terbatas',
      (lic.reason || 'Langganan tidak aktif.') + '\n\n' +
      'Hubungi Kelana untuk mengaktifkan kembali:\n' +
      (getConfig_('KELANA_CONTACT') || 'wa.me/xxxxxxx'),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return false;
  }

  // Valid tapi ada warning (hampir expired)
  if (lic.warning && mode === 'write') {
    // Hanya tampilkan 1x per hari
    var warnShown = PropertiesService.getScriptProperties().getProperty('warn_shown_' + new Date().toDateString());
    if (!warnShown) {
      SpreadsheetApp.getUi().alert(
        '⚠ Peringatan Lisensi',
        lic.warning + '\n\nHubungi Kelana sekarang untuk perpanjangan:\n' +
        (getConfig_('KELANA_CONTACT') || 'wa.me/xxxxxxx'),
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      PropertiesService.getScriptProperties().setProperty('warn_shown_' + new Date().toDateString(), '1');
    }
  }

  return true;
}

/**
 * Ambil info lisensi untuk ditampilkan di sidebar (Index.html).
 * Tidak throw error — selalu return object.
 */
function getLicenseInfo() {
  var lic = cekLisensi_();
  if (!lic) return { valid: false, reason: 'Tidak bisa cek lisensi.' };

  var jumlahJamaah = 0;
  try {
    var shJ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
    if (shJ && shJ.getLastRow() > 1) jumlahJamaah = shJ.getLastRow() - 1;
  } catch(e) {}

  return {
    valid:        lic.valid,
    plan:         lic.plan         || '—',
    namaTravel:   lic.namaTravel   || getConfig_('NAMA_TRAVEL') || '—',
    daysLeft:     lic.daysLeft,
    tglExpiry:    lic.tglExpiry    || '—',
    limitJamaah:  lic.limitJamaah  || 0,
    currentJamaah:jumlahJamaah,
    warning:      lic.warning      || null,
    graceMode:    lic.graceMode    || false,
    reason:       lic.reason       || null,
    offline:      lic.offline      || false
  };
}

/**
 * Setup trigger harian untuk cek lisensi otomatis.
 * Jalankan 1x saat setup awal.
 */
function setupLicenseTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'cekLisensiHarian_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('cekLisensiHarian_')
    .timeBased().everyDays(1).atHour(8).create();
}

function cekLisensiHarian_() {
  invalidateLicenseCache_();
  var lic = cekLisensi_(true);
  if (!lic.valid && !lic.graceMode) {
    // Kirim notif ke owner via email jika ada
    var email = getConfig_('EMAIL_TRAVEL');
    if (email && !lic.offline) {
      try {
        GmailApp.sendEmail(email,
          '[Kelana] Langganan Perlu Diperpanjang',
          'Halo ' + (getConfig_('NAMA_TRAVEL') || '') + ',\n\n' +
          (lic.reason || 'Langganan Anda tidak aktif.') + '\n\n' +
          'Hubungi kami untuk perpanjangan.\n\n_Kelana_'
        );
      } catch(e) {}
    }
  }
}

// ─── CACHE HELPERS ───────────────────────────────────────────────────────────

function cacheLicense_(result) {
  var store = PropertiesService.getScriptProperties();
  store.setProperty(LICENSE_CACHE_KEY, JSON.stringify({
    data:    result,
    time:    Date.now(),
    expires: Date.now() + LICENSE_CACHE_HOUR * 60 * 60 * 1000
  }));
}

function getCachedLicense_(allowExpired) {
  try {
    var raw   = PropertiesService.getScriptProperties().getProperty(LICENSE_CACHE_KEY);
    if (!raw) return null;
    var cache = JSON.parse(raw);
    if (!allowExpired && Date.now() > cache.expires) return null;
    return cache.data;
  } catch(e) { return null; }
}

function invalidateLicenseCache_() {
  PropertiesService.getScriptProperties().deleteProperty(LICENSE_CACHE_KEY);
}
