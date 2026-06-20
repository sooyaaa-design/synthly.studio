/**
 * KELANA — Code.gs (Main)
 * =======================
 * File INTI sistem Kelana. Upload/paste ini ke Apps Script client.
 *
 * File lain yang harus ada di project yang sama:
 *   Code.additions.gs  → fungsi pembayaran, WA blast, laporan keuangan
 *   Roles.gs           → RBAC (permission check + audit log)
 *   LicenseClient.gs   → cek lisensi ke server
 *   Manifest.gs        → generate manifest penerbangan
 *   Webhook.gs         → handler Xendit callback (opsional)
 *
 * CATATAN: Roles.gs meng-override show functions di sini dengan
 * versi yang sudah ada permission check. JANGAN hapus show functions
 * di sini karena Roles.gs membutuhkan fungsi aslinya.
 *
 * ALUR SIMPAN JAMAAH (html → backend):
 *   TambahJamaah.html → simpanJamaahSecure() [Roles.gs]
 *                         └→ simpanJamaah() [Code.gs] ← fungsi dasar ini
 */

// ─── MENU ─────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🕌 Kelana')
    .addItem('📊 Dashboard',         'showDashboard')
    .addItem('👤 Tambah Jamaah',     'showTambahJamaah')
    .addItem('📋 Daftar Jamaah',     'showDaftarJamaah')
    .addItem('💳 Pembayaran',        'showPembayaran')
    .addSeparator()
    .addItem('🏨 Roomlist',          'showRoomlist')
    .addItem('✈ Manifest',           'showManifest')
    .addItem('🏛 Ekspor SISKOPATUH', 'showSiskopatuh')
    .addSeparator()
    .addItem('📲 WA Blast',          'showWaBlast')
    .addSeparator()
    .addItem('👥 Kelola Pengguna',   'showKelolaUser')
    .addSeparator()
    .addItem('⚙ Setup Awal (pertama kali)', 'setupAwal')
    .addToUi();
}

// ─── SETUP ────────────────────────────────────────────────────────────────────

/**
 * Jalankan sekali saat pertama kali setup.
 * Menu 🕌 Kelana → Setup Awal (pertama kali)
 */
function setupAwal() {
  var ui = SpreadsheetApp.getUi();
  setupSheets_();
  try { setupLicenseTrigger(); } catch(e) {}
  try { setupReminderTrigger(); } catch(e) {}
  ui.alert('✅ Setup Berhasil',
    'Semua sheet sudah dibuat.\n\n' +
    'Langkah selanjutnya:\n' +
    '1. Isi sheet Config (Nama Travel, WA API Key, dst.)\n' +
    '2. Isi LICENSE_KEY dan LICENSE_URL di Config\n' +
    '3. Buat Paket di sheet Paket\n' +
    '4. Buat Group/Kloter di sheet Group\n\n' +
    'Selamat menggunakan Kelana! 🕌',
    ui.ButtonSet.OK);
}

/**
 * Buat semua sheet inti + konfigurasi default, TANPA UI.
 * Aman dipanggil dari Web App (mis. saat setup Owner pertama lewat browser).
 */
function setupSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Jamaah — kolom (0-indexed):
  // 0:IDJamaah 1:NamaLengkap 2:NIK 3:NoPaspor 4:TglLahir 5:JenisKelamin
  // 6:Alamat 7:NoHP 8:Email 9:KontakDarurat 10:HPDarurat 11:HubunganDarurat
  // 12:KondisiKesehatan 13:StatusVaksin 14:Paket 15:IDGroup
  // 16:StatusDokumen 17:StatusPembayaran 18:IDKeluarga 19:SumberLead
  // 20:Catatan 21:TglDaftar 22:DibuatOleh 23:IsPIC 24:TipeKamar 25:KategoriJamaah
  createSheetIfNotExists_(ss, 'Jamaah', [
    'ID Jamaah','Nama Lengkap','NIK','No Paspor','Tgl Lahir','Jenis Kelamin',
    'Alamat','No HP','Email','Kontak Darurat','HP Darurat','Hubungan Darurat',
    'Kondisi Kesehatan','Status Vaksin','Paket','ID Group',
    'Status Dokumen','Status Pembayaran','ID Keluarga','Sumber Lead',
    'Catatan','Tgl Daftar','Dibuat Oleh','Is PIC','Tipe Kamar','Kategori Jamaah',
    // ── Field SISKOPATUH (Kemenag) — index 26..41 ──
    'Tempat Lahir','Nama Ayah','Status Perkawinan','Pekerjaan','Pendidikan',
    'Provinsi','Kabupaten/Kota','Kecamatan','Kelurahan','Kode Pos',
    'Kewarganegaraan','Nama Mahram','Hubungan Mahram','Embarkasi',
    'Golongan Darah','Tempat Terbit Paspor',
    // ── index 42 ──
    'Hubungan Keluarga'
  ]);

  // Group — kolom (0-indexed):
  // 0:IDGroup 1:NamaGroup 2:TglBerangkat 3:TglPulang 4:Maskapai
  // 5:Asal 6:KotaTransitPergi 7:NoFlightPergi1 8:NoFlightPergi2
  // 9:KotaTransitPulang 10:NoFlightPulang1 11:NoFlightPulang2
  // 12:HotelMadinah 13:HotelMakkah 14:HotelTransit
  // 15:HargaQuad 16:TambahanTriple 17:TambahanDouble
  // 18:Kapasitas 19:Terisi 20:StatusGroup 21:Pembimbing 22:Catatan
  createSheetIfNotExists_(ss, 'Group', [
    'ID Group','Nama Group','Tgl Berangkat','Tgl Pulang','Maskapai',
    'Asal','Kota Transit Pergi','No Flight Pergi 1','No Flight Pergi 2',
    'Kota Transit Pulang','No Flight Pulang 1','No Flight Pulang 2',
    'Hotel Madinah','Hotel Makkah','Hotel Transit',
    'Harga Quad','Tambahan Triple','Tambahan Double',
    'Kapasitas','Terisi','Status Group','Pembimbing','Catatan',
    // index 23 — kloter merujuk ke Paket sebagai sumber harga
    'ID Paket'
  ]);

  // Paket — sumber harga utama (Quad base + tambahan upgrade + DP)
  // 0:IDPaket 1:NamaPaket 2:HargaQuad 3:DPMinimal 4:Durasi
  // 5:HotelMadinah 6:HotelMakkah 7:Aktif 8:TambahanTriple 9:TambahanDouble
  createSheetIfNotExists_(ss, 'Paket', [
    'ID Paket','Nama Paket','Harga (Quad)','DP Minimal',
    'Durasi (Hari)','Hotel Madinah','Hotel Makkah','Aktif',
    'Tambahan Triple','Tambahan Double'
  ]);

  // Pembayaran — kolom (0-indexed):
  // 0:IDInvoice 1:IDJamaah 2:NamaJamaah 3:JenisBayar 4:Nominal 5:Metode
  // 6:Status 7:TglInvoice 8:TglBayar 9:TglJatuhTempo 10:IDTrxXendit
  // 11:LinkBayar 12:BuktiBayar 13:DikonfirmasiOleh 14:Catatan
  createSheetIfNotExists_(ss, 'Pembayaran', [
    'ID Invoice','ID Jamaah','Nama Jamaah','Jenis Bayar','Nominal','Metode',
    'Status','Tgl Invoice','Tgl Bayar','Tgl Jatuh Tempo','ID Trx Xendit',
    'Link Bayar','Bukti Bayar','Dikonfirmasi Oleh','Catatan'
  ]);

  // Dokumen — kolom (0-indexed):
  // 0:IDDokumen 1:IDJamaah 2:NamaJamaah 3:NoKTP 4:FotoKTP 5:NoPaspor
  // 6:NoVisa 7:TglTerbitPaspor 8:TglExpiredPaspor 9:TglTerbitVisa
  // 10:TglExpiredVisa 11:FotoPaspor 12:FotoVisa 13:VaksinMeningitis
  // 14:VaksinCovid 15:KartuKuning 16:Catatan 17:StatusDokumenLengkap
  createSheetIfNotExists_(ss, 'Dokumen', [
    'ID Dokumen','ID Jamaah','Nama Jamaah','No KTP','Foto KTP','No Paspor',
    'No Visa','Tgl Terbit Paspor','Tgl Expired Paspor','Tgl Terbit Visa',
    'Tgl Expired Visa','Foto Paspor','Foto Visa','Vaksin Meningitis',
    'Vaksin Covid','Kartu Kuning','Catatan','Status Dokumen Lengkap',
    'Pas Foto 4x6'
  ]);

  // Roomlist — skema 1-jamaah-per-baris (sinkron dengan Roomlist.gs)
  createSheetIfNotExists_(ss, 'Roomlist', [
    'ID Room','ID Group','ID Jamaah','Nama Jamaah',
    'Hotel','Lokasi','Nomor Kamar','Tipe Kamar','Catatan'
  ]);

  // AddOn — item tambahan/upgrade berbayar per jamaah (0-indexed):
  // 0:IDAddOn 1:IDJamaah 2:NamaItem 3:Kategori 4:Harga 5:Catatan 6:TglDibuat 7:DibuatOleh
  createSheetIfNotExists_(ss, 'AddOn', [
    'ID AddOn','ID Jamaah','Nama Item','Kategori','Harga','Catatan','Tgl Dibuat','Dibuat Oleh'
  ]);

  // Manifest — urutan kolom sinkron dengan generateManifest() di Manifest.gs
  createSheetIfNotExists_(ss, 'Manifest', [
    'ID Manifest','ID Group','Nama Group','No Penerbangan',
    'Tgl Berangkat','Asal','Tujuan','ID Jamaah','Nama Jamaah',
    'No Paspor','Tgl Lahir','Jenis Kelamin','No Kursi','No Visa','Catatan'
  ]);

  // Lead
  createSheetIfNotExists_(ss, 'Lead', [
    'ID Lead','Nama','No HP','Email','Sumber',
    'Status','Minat Paket','Catatan','Tgl Masuk','Ditangani Oleh'
  ]);

  // Config
  var shC = createSheetIfNotExists_(ss, 'Config', ['Key','Value','Keterangan']);
  if (shC.getLastRow() < 2) {
    shC.setColumnWidth(1, 200); shC.setColumnWidth(2, 240); shC.setColumnWidth(3, 320);
    [
      ['NAMA_TRAVEL',            '', 'Nama travel Anda, contoh: Al-Barokah Travel'],
      ['ALAMAT_TRAVEL',          '', 'Alamat kantor travel (opsional, muncul di invoice)'],
      ['TELEPON_TRAVEL',         '', 'No HP/WA travel (format 628xxx)'],
      ['EMAIL_TRAVEL',           '', 'Email travel untuk notifikasi'],
      ['WA_API_KEY',             '', 'API Key Fonnte (daftar di fonnte.com)'],
      ['WA_SENDER',              '', 'No HP pengirim WA di Fonnte (628xxx)'],
      ['NAMA_BANK',              '', 'Nama bank rekening travel'],
      ['NO_REKENING',            '', 'Nomor rekening bank'],
      ['ATAS_NAMA',              '', 'Nama pemilik rekening'],
      ['DP_DEFAULT_PERSEN',      '30', 'Persentase DP (angka saja, contoh: 30)'],
      ['BATAS_PELUNASAN_HARI',   '45', 'Pelunasan wajib berapa hari sebelum berangkat'],
      ['BATAS_JATUH_TEMPO_DP_HARI','7','Batas bayar DP sejak invoice dibuat (hari)'],
      ['LICENSE_KEY',            '', 'License key dari Kelana (KLN-XXXX-XXXX-XXXX)'],
      ['LICENSE_URL',            '', 'URL License Server Kelana'],
      ['KELANA_CONTACT',         '', 'No WA developer Kelana untuk bantuan teknis'],
      ['XENDIT_API_KEY',         '', 'API Key Xendit (opsional, untuk pembayaran online)'],
      ['XENDIT_CALLBACK_TOKEN',  '', 'X-CALLBACK-TOKEN Xendit (opsional)'],
      ['HARGA_INFANT_PERSEN',   '10', 'Harga infant sebagai % dari harga dewasa (contoh: 10)'],
      ['BPIU_REFERENSI',        '',   'Biaya referensi umroh Kemenag (angka saja). Peringatan muncul bila harga paket di bawah ini'],
    ].forEach(function(row) { shC.appendRow(row); });
  }

  // Log Aktivitas
  createSheetIfNotExists_(ss, 'Log Aktivitas', [
    'Waktu','Email Pengguna','Aksi','Modul','ID Record','Detail'
  ]);

  // Setup sheet Pengguna (RBAC) — dari Roles.gs
  setupRolesSheet();

  // Migrasi kolom SISKOPATUH ke sheet Jamaah lama (idempoten) — dari Siskopatuh.gs
  try { migrateSiskopatuhSchema_(); } catch(e) {}
  try { migrateDokumenSchema_(); } catch(e) {}
  try { migratePetugasSchema_(); } catch(e) {}
  try { migrateKeluargaSchema_(); } catch(e) {}
}

/**
 * Tambahkan kolom "Hubungan Keluarga" (index 42 / kolom-sheet 43) ke sheet
 * Jamaah lama (idempoten). Mengikuti pola migrateDokumenSchema_.
 */
function migrateKeluargaSchema_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh) return;
  var endCol = 43; // 1-based kolom Hubungan Keluarga
  if (sh.getMaxColumns() >= endCol && String(sh.getRange(1, endCol).getValue()) === 'Hubungan Keluarga') return;
  if (sh.getMaxColumns() < endCol) sh.insertColumnsAfter(sh.getMaxColumns(), endCol - sh.getMaxColumns());
  sh.getRange(1, endCol).setValue('Hubungan Keluarga')
    .setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
}

/**
 * Tambahkan kolom "Pas Foto 4x6" ke sheet Dokumen lama (idempoten).
 */
function migrateDokumenSchema_() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dokumen');
  if (!sh) return;
  var endCol = 19; // 1-based kolom Pas Foto 4x6
  if (sh.getMaxColumns() >= endCol && String(sh.getRange(1, endCol).getValue()) === 'Pas Foto 4x6') return;
  if (sh.getMaxColumns() < endCol) sh.insertColumnsAfter(sh.getMaxColumns(), endCol - sh.getMaxColumns());
  sh.getRange(1, endCol).setValue('Pas Foto 4x6')
    .setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
}

// ─── JAMAAH ───────────────────────────────────────────────────────────────────

/**
 * Validasi data jamaah di SISI SERVER (jangan hanya andalkan validasi frontend).
 * @param {Object} data
 * @param {'create'|'update'} mode
 * @returns {string} pesan error, atau '' jika valid.
 */
function validateJamaahData_(data, mode) {
  data = data || {};
  function has(k){ return data[k] !== undefined && data[k] !== null; }
  function str(k){ return String(data[k] == null ? '' : data[k]).trim(); }

  if (mode === 'create') {
    if (!str('namaLengkap')) return 'Nama lengkap wajib diisi.';
    if (!str('nik'))         return 'NIK wajib diisi.';
    if (!str('noHp'))        return 'No. HP wajib diisi.';
  }
  if (has('nik') && str('nik') && !/^\d{16}$/.test(str('nik')))
    return 'NIK harus 16 digit angka.';
  if (has('noHp') && str('noHp')) {
    var hp = str('noHp').replace(/[^0-9]/g, '');
    if (hp.length < 9 || hp.length > 15) return 'No. HP tidak valid (gunakan 08xxx atau 628xxx).';
  }
  if (has('email') && str('email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str('email')))
    return 'Format email tidak valid.';
  if (has('tglLahir') && str('tglLahir')) {
    var d = new Date(data.tglLahir);
    if (isNaN(d.getTime()))      return 'Tanggal lahir tidak valid.';
    if (d.getTime() > Date.now()) return 'Tanggal lahir tidak boleh di masa depan.';
  }
  if (has('kodePos') && str('kodePos') && !/^\d{5}$/.test(str('kodePos')))
    return 'Kode pos harus 5 digit angka.';
  return '';
}

/**
 * Cek apakah NIK sudah dipakai jamaah LAIN.
 * @param {string} nik
 * @param {string} [kecualiIdJamaah] — abaikan baris dengan idJamaah ini (untuk update)
 * @returns {boolean}
 */
function nikSudahDipakai_(nik, kecualiIdJamaah) {
  var norm = String(nik || '').replace(/\D/g, '');
  if (!norm) return false; // NIK kosong tidak diblok di sini
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return false;
  // Kolom A..C → 0:ID Jamaah, 2:NIK
  var vals = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (kecualiIdJamaah && String(vals[i][0]) === String(kecualiIdJamaah)) continue;
    var rowNik = String(vals[i][2] || '').replace(/\D/g, '');
    if (rowNik && rowNik === norm) return true;
  }
  return false;
}

/**
 * Simpan jamaah baru ke sheet Jamaah + buat baris dokumen + generate invoice DP.
 * Dipanggil oleh simpanJamaahSecure() di Roles.gs (sudah ada permission + license check).
 * HTML harus memanggil simpanJamaahSecure(), bukan fungsi ini langsung.
 */
function simpanJamaah(data) {
  try {
    var verr = validateJamaahData_(data, 'create');
    if (verr) return { success: false, error: verr };

    if (data.nik && nikSudahDipakai_(data.nik)) {
      return { success: false, error: 'NIK sudah terdaftar atas nama lain.' };
    }

    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var shJ = ss.getSheetByName('Jamaah');
    if (!shJ) return { success: false, error: 'Sheet Jamaah tidak ditemukan. Jalankan Setup Awal.' };

    // "Buat keluarga baru" dari form individual → generate ID keluarga baru.
    if (data.idKeluarga === '__NEW__') data.idKeluarga = 'KLG-' + new Date().getTime();

    var idJamaah = 'JMH-' + new Date().getTime();

    shJ.appendRow([
      idJamaah,
      data.namaLengkap     || '',
      data.nik             || '',
      data.noPaspor        || '',
      data.tglLahir        ? new Date(data.tglLahir) : '',
      data.jenisKelamin    || '',
      data.alamat          || '',
      data.noHp            || '',
      data.email           || '',
      data.kontakDarurat   || '',
      data.hpDarurat       || '',
      data.hubunganDarurat || '',
      data.kondisiKesehatan|| '',
      data.statusVaksin    || '',
      data.paket           || '',
      data.idGroup         || '',
      'Belum Lengkap',
      'Belum Bayar',
      data.idKeluarga      || '',
      data.sumberLead      || '',
      data.catatan         || '',
      new Date(),
      data.dibuatOleh || Session.getActiveUser().getEmail() || '',
      data.isPIC ? 'Ya' : '',
      data.tipeKamar || 'Quad',
      data.kategoriJamaah || 'Dewasa',
      // ── Field SISKOPATUH (index 26..41) ──
      data.tempatLahir        || '',
      data.namaAyah           || '',
      data.statusPerkawinan   || '',
      data.pekerjaan          || '',
      data.pendidikan         || '',
      data.provinsi           || '',
      data.kabupaten          || '',
      data.kecamatan          || '',
      data.kelurahan          || '',
      data.kodePos            || '',
      data.kewarganegaraan    || 'WNI',
      data.namaMahram         || '',
      data.hubunganMahram     || '',
      data.embarkasi          || '',
      data.golonganDarah      || '',
      data.tempatTerbitPaspor || '',
      data.hubunganKeluarga   || ''
    ]);

    // Buat baris dokumen kosong otomatis
    var shD = ss.getSheetByName('Dokumen');
    if (shD) {
      shD.appendRow([
        'DOK-' + new Date().getTime(), idJamaah, data.namaLengkap || '',
        data.nik || '', '', data.noPaspor || '',
        '', '', '', '', '', '', '', '', '', '', '', 'Belum Lengkap'
      ]);
    }

    // Bila ditandai PIC & menempel ke keluarga existing, pastikan PIC tunggal.
    if (data.isPIC && data.idKeluarga) {
      try { setPicKeluarga_(data.idKeluarga, idJamaah); } catch (e) {}
    }

    // Generate invoice DP otomatis
    var paket = getPaketById_(data.paket);
    if (paket) generateInvoiceDP_(idJamaah, data, paket);

    return { success: true, idJamaah: idJamaah, idKeluarga: data.idKeluarga || '' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Map satu baris sheet Jamaah → objek jamaah (dipakai getJamaahList & getJamaahPage).
 */
function jamaahRowToObj_(r) {
  return {
    idJamaah:        r[0],  namaLengkap:      r[1],
    nik:             r[2],  noPaspor:         r[3],
    tglLahir:        r[4] ? formatTanggal_(r[4]) : '',
    jenisKelamin:    r[5],  alamat:           r[6],
    noHp:            r[7],  email:            r[8],
    kontakDarurat:   r[9],  hpDarurat:        r[10],
    hubunganDarurat: r[11], kondisiKesehatan: r[12],
    statusVaksin:    r[13], paket:            r[14],
    idGroup:         r[15], statusDokumen:    r[16],
    statusPembayaran:r[17], idKeluarga:       r[18] || '',
    sumberLead:      r[19], catatan:          r[20],
    tglDaftar:       r[21] ? formatTanggal_(r[21]) : '',
    dibuatOleh:      r[22] || '',
    isPIC:           r[23] === 'Ya',
    tipeKamar:       r[24] || 'Quad',
    kategoriJamaah:  r[25] || 'Dewasa',
    // ── Field SISKOPATUH ──
    tempatLahir:        r[26] || '', namaAyah:          r[27] || '',
    statusPerkawinan:   r[28] || '', pekerjaan:         r[29] || '',
    pendidikan:         r[30] || '', provinsi:          r[31] || '',
    kabupaten:          r[32] || '', kecamatan:         r[33] || '',
    kelurahan:          r[34] || '', kodePos:           r[35] || '',
    kewarganegaraan:    r[36] || '', namaMahram:        r[37] || '',
    hubunganMahram:     r[38] || '', embarkasi:         r[39] || '',
    golonganDarah:      r[40] || '', tempatTerbitPaspor:r[41] || '',
    hubunganKeluarga:   r[42] || deriveHubunganKeluarga_(r),
    // true bila nilai hubunganKeluarga berasal dari derivasi (placeholder), bukan input asli
    hubunganKeluargaDerived: !r[42] && !!deriveHubunganKeluarga_(r)
  };
}

/**
 * Tebak "Hubungan Keluarga" untuk baris jamaah lama yang kolomnya masih kosong.
 * Read-only (tidak ditulis balik) — hanya jadi placeholder agar operator mengonfirmasi.
 *   - PIC                         → "Kepala Keluarga"
 *   - perempuan, mahram = Suami   → "Istri"
 */
function deriveHubunganKeluarga_(r) {
  if (r[23] === 'Ya') return 'Kepala Keluarga';
  if (r[5] === 'Perempuan' && String(r[38] || '') === 'Suami') return 'Istri';
  return '';
}

/**
 * Ambil SEMUA data jamaah (dipakai modul lain: roomlist, dokumen, manifest, dsb).
 */
function getJamaahList() {
  var shJ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!shJ || shJ.getLastRow() < 2) return [];
  return shJ.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0]; })
    .map(jamaahRowToObj_);
}

/**
 * Daftar jamaah dengan PAGINASI + PENCARIAN + FILTER di sisi server.
 * @param {{search,idGroup,statusDokumen,statusPembayaran,page,perPage}} opts
 * @returns {{rows:Object[], total:number, page:number, perPage:number, pages:number}}
 */
function getJamaahPage(opts) {
  opts = opts || {};
  var perPage = Math.min(Math.max(parseInt(opts.perPage) || 20, 1), 100);
  var shJ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!shJ || shJ.getLastRow() < 2) return { rows: [], total: 0, page: 1, perPage: perPage, pages: 0 };

  var q   = String(opts.search || '').toLowerCase().trim();
  var grp = opts.idGroup ? String(opts.idGroup) : '';
  var dok = opts.statusDokumen || '';
  var bay = opts.statusPembayaran || '';

  var filtered = shJ.getDataRange().getValues().slice(1).filter(function(r) {
    if (!r[0]) return false;
    if (q) {
      var blob = (String(r[1]||'')+' '+String(r[2]||'')+' '+String(r[3]||'')+' '+String(r[7]||'')).toLowerCase();
      if (blob.indexOf(q) < 0) return false;
    }
    if (grp && String(r[15]) !== grp)      return false;
    if (dok && String(r[16]) !== dok)      return false;
    if (bay && String(r[17]) !== bay)      return false;
    return true;
  });

  // Terbaru di atas
  filtered.sort(function(a, b) { return new Date(b[21] || 0) - new Date(a[21] || 0); });

  var total = filtered.length;
  var pages = Math.max(1, Math.ceil(total / perPage));
  var page  = Math.min(Math.max(parseInt(opts.page) || 1, 1), pages);
  var start = (page - 1) * perPage;
  var rows  = filtered.slice(start, start + perPage).map(jamaahRowToObj_);

  return { rows: rows, total: total, page: page, perPage: perPage, pages: pages };
}

function simpanKeluarga(members) {
  if (!members || !members.length) return { success: false, error: 'Tidak ada data anggota keluarga.' };
  try {
    var idKeluarga = 'KLG-' + new Date().getTime();
    // Tentukan indeks PIC: hormati flag isPIC bila ada, kalau tidak anggota pertama.
    var picIdx = -1;
    for (var k = 0; k < members.length; k++) { if (members[k] && members[k].isPIC) { picIdx = k; break; } }
    if (picIdx === -1) picIdx = 0;
    var count = 0;
    for (var i = 0; i < members.length; i++) {
      var m = members[i];
      m.idKeluarga = idKeluarga;
      m.isPIC = (i === picIdx);
      if (m.isPIC && !m.hubunganKeluarga) m.hubunganKeluarga = 'Kepala Keluarga';
      var r = simpanJamaah(m);
      if (r && r.success) count++;
    }
    logActivity_(getCurrentUser_(), 'Tambah Keluarga', 'Jamaah', idKeluarga, count + ' anggota');
    return { success: true, count: count, idKeluarga: idKeluarga };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Jadikan satu jamaah sebagai PIC keluarganya; kosongkan IsPIC anggota lain di
 * keluarga yang sama agar PIC tetap tunggal. Dipanggil saat operator mencentang
 * "Jadikan PIC" pada form jamaah.
 */
function setPicKeluarga_(idKeluarga, idJamaah) {
  if (!idKeluarga || !idJamaah) return;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return;
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][18] || '') !== String(idKeluarga)) continue;
    var shouldBe = String(rows[i][0]) === String(idJamaah) ? 'Ya' : '';
    if (String(rows[i][23] || '') !== shouldBe) sh.getRange(i + 1, 24).setValue(shouldBe);
  }
}

function getKeluargaTagihan() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var shJ = ss.getSheetByName('Jamaah');
    var shP = ss.getSheetByName('Pembayaran');
    if (!shJ || shP === null) return [];

    var jamaahRows = shJ.getLastRow() > 1 ? shJ.getDataRange().getValues().slice(1) : [];
    var pembayaranRows = shP && shP.getLastRow() > 1 ? shP.getDataRange().getValues().slice(1) : [];

    // Build jamaah map: idJamaah → {namaLengkap, noHp, idKeluarga, isPIC, ...}
    var jamaahMap = {};
    jamaahRows.forEach(function(r) {
      if (!r[0]) return;
      jamaahMap[r[0]] = {
        idJamaah: r[0], namaLengkap: r[1], noHp: r[7],
        idKeluarga: r[18] || '', isPIC: r[23] === 'Ya',
        tipeKamar: r[24] || 'Quad', idGroup: r[15] || '',
        hubunganKeluarga: r[42] || deriveHubunganKeluarga_(r)
      };
    });

    // Build tagihan per idJamaah
    var tagihanMap = {};
    pembayaranRows.forEach(function(r) {
      if (!r[0]) return;
      var idJ = r[1];
      if (!tagihanMap[idJ]) tagihanMap[idJ] = { total: 0, lunas: 0 };
      var nominal = parseFloat(r[4]) || 0;
      tagihanMap[idJ].total += nominal;
      if (r[6] === 'Lunas') tagihanMap[idJ].lunas += nominal;
    });

    // Group by idKeluarga
    var keluargaMap = {};
    Object.keys(jamaahMap).forEach(function(idJ) {
      var j = jamaahMap[idJ];
      if (!j.idKeluarga) return;
      if (!keluargaMap[j.idKeluarga]) {
        keluargaMap[j.idKeluarga] = { idKeluarga: j.idKeluarga, picIdJamaah: '', picNama: '', picHp: '', anggota: [], totalTagihan: 0, totalLunas: 0 };
      }
      var kg = keluargaMap[j.idKeluarga];
      var t = tagihanMap[j.idJamaah] || { total: 0, lunas: 0 };
      kg.anggota.push({
        idJamaah: j.idJamaah, nama: j.namaLengkap, isPIC: j.isPIC,
        tipeKamar: j.tipeKamar, idGroup: j.idGroup, hubunganKeluarga: j.hubunganKeluarga,
        tagihan: t.total, lunas: t.lunas, sisa: t.total - t.lunas
      });
      kg.totalTagihan += t.total;
      kg.totalLunas += t.lunas;
      if (j.isPIC) { kg.picIdJamaah = j.idJamaah; kg.picNama = j.namaLengkap; kg.picHp = j.noHp; }
    });

    return Object.values(keluargaMap).map(function(kg) {
      return {
        idKeluarga: kg.idKeluarga, picIdJamaah: kg.picIdJamaah, picNama: kg.picNama, picHp: kg.picHp,
        anggota: kg.anggota, totalTagihan: kg.totalTagihan, totalLunas: kg.totalLunas,
        totalPending: kg.totalTagihan - kg.totalLunas
      };
    });
  } catch (err) {
    return []; // selalu kembalikan array agar frontend aman
  }
}

// ─── ADD-ON / UPGRADE ────────────────────────────────────────────────────────
// Sheet AddOn (0-idx): 0:IDAddOn 1:IDJamaah 2:NamaItem 3:Kategori 4:Harga
//                      5:Catatan 6:TglDibuat 7:DibuatOleh

function ensureAddOnSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('AddOn');
  if (sh) return sh;
  sh = ss.insertSheet('AddOn');
  var headers = ['ID AddOn','ID Jamaah','Nama Item','Kategori','Harga','Catatan','Tgl Dibuat','Dibuat Oleh'];
  sh.appendRow(headers);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#fff');
  sh.setFrozenRows(1);
  return sh;
}

/** Daftar add-on milik satu jamaah. */
function getAddOnList(idJamaah) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AddOn');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0] && (!idJamaah || String(r[1]) === String(idJamaah)); })
    .map(function(r) {
      return {
        idAddOn: r[0], idJamaah: r[1], namaItem: r[2], kategori: r[3],
        harga: parseFloat(r[4]) || 0, catatan: r[5] || '',
        tglDibuat: r[6] ? formatTanggal_(r[6]) : '', dibuatOleh: r[7] || ''
      };
    });
}

/** Total nilai add-on satu jamaah (untuk integrasi harga booking). */
function sumAddOn_(idJamaah) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AddOn');
  if (!sh || sh.getLastRow() < 2) return 0;
  return sh.getDataRange().getValues().slice(1).reduce(function(sum, r) {
    return (r[0] && String(r[1]) === String(idJamaah)) ? sum + (parseFloat(r[4]) || 0) : sum;
  }, 0);
}

/** Simpan (create/update) satu item add-on. */
function simpanAddOn(data) {
  try {
    if (!data || !data.idJamaah) return { success: false, error: 'ID jamaah wajib diisi.' };
    if (!data.namaItem) return { success: false, error: 'Nama item wajib diisi.' };
    var sh = ensureAddOnSheet_();
    var harga = parseFloat(data.harga) || 0;
    if (data.idAddOn) {
      var rows = sh.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === data.idAddOn) {
          sh.getRange(i + 1, 3, 1, 3).setValues([[data.namaItem, data.kategori || 'Lainnya', harga]]);
          sh.getRange(i + 1, 6).setValue(data.catatan || '');
          logActivity_(getCurrentUser_(), 'Update AddOn', 'AddOn', data.idAddOn, data.namaItem + ' (' + harga + ')');
          return { success: true, idAddOn: data.idAddOn };
        }
      }
    }
    var idAddOn = 'ADD-' + new Date().getTime();
    sh.appendRow([idAddOn, data.idJamaah, data.namaItem, data.kategori || 'Lainnya',
      harga, data.catatan || '', new Date(), getCurrentUser_()]);
    logActivity_(getCurrentUser_(), 'Tambah AddOn', 'AddOn', idAddOn, data.namaItem + ' (' + harga + ')');
    return { success: true, idAddOn: idAddOn };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Hapus satu item add-on. */
function hapusAddOn(idAddOn) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AddOn');
  if (!sh) return { success: false, error: 'Sheet AddOn tidak ditemukan.' };
  var rows = sh.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === idAddOn) {
      var nama = rows[i][2];
      sh.deleteRow(i + 1);
      logActivity_(getCurrentUser_(), 'Hapus AddOn', 'AddOn', idAddOn, nama);
      return { success: true };
    }
  }
  return { success: false, error: 'Item tidak ditemukan.' };
}

/**
 * Total harga booking satu jamaah = harga kamar (sesuai tipe & kategori) + total add-on.
 * Dipakai generateInvoicePelunasan agar add-on otomatis tertagih di pelunasan.
 */
function hitungTotalBookingJamaah_(idJamaah) {
  var j = getJamaahById_(idJamaah);
  if (!j) return 0;
  var hargaKamar = hitungHargaJamaah_(j.idGroup || '', j.tipeKamar || 'Quad', j.kategoriJamaah || 'Dewasa');
  if (hargaKamar <= 0) {
    var paket = getPaketById_(j.idPaket || j.paket);
    hargaKamar = paket ? (parseFloat(paket.harga) || 0) : 0;
  }
  return hargaKamar + sumAddOn_(idJamaah);
}

/**
 * Ringkasan booking (per keluarga bila ada, kalau tidak per jamaah) untuk
 * ditampilkan di drawer pembayaran & invoice HTML.
 */
function getBookingSummary_(idJamaah) {
  var j = getJamaahById_(idJamaah);
  if (!j) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shJ = ss.getSheetByName('Jamaah');
  var shP = ss.getSheetByName('Pembayaran');
  var jamaahRows = shJ && shJ.getLastRow() > 1 ? shJ.getDataRange().getValues().slice(1) : [];
  var bayarRows  = shP && shP.getLastRow() > 1 ? shP.getDataRange().getValues().slice(1) : [];

  // Anggota: satu keluarga bila idKeluarga ada, kalau tidak hanya jamaah ini.
  var anggotaRows = j.idKeluarga
    ? jamaahRows.filter(function(r) { return r[0] && String(r[18] || '') === String(j.idKeluarga); })
    : jamaahRows.filter(function(r) { return String(r[0]) === String(idJamaah); });

  var totalHarga = 0, totalDibayar = 0, picNama = '', picHp = '';
  var anggota = anggotaRows.map(function(r) {
    var aid = r[0];
    var hargaKamar = hitungHargaJamaah_(r[15] || '', r[24] || 'Quad', r[25] || 'Dewasa');
    var hargaBase  = hitungHargaJamaah_(r[15] || '', 'Quad', r[25] || 'Dewasa');
    var addOns = getAddOnList(aid);
    var addOnTotal = addOns.reduce(function(s, a) { return s + a.harga; }, 0);
    var hargaUnit = hargaKamar + addOnTotal;
    totalHarga += hargaUnit;
    bayarRows.forEach(function(p) {
      if (String(p[1]) === String(aid) && String(p[6]) === 'Lunas') totalDibayar += parseFloat(p[4]) || 0;
    });
    if (r[23] === 'Ya') { picNama = r[1]; picHp = r[7]; }
    return {
      idJamaah: aid, nama: r[1], jenisKelamin: r[5] || '',
      relasi: r[42] || deriveHubunganKeluarga_(r), isPIC: r[23] === 'Ya',
      paket: r[14] || '', tipeKamar: r[24] || 'Quad', kategori: r[25] || 'Dewasa',
      hargaKamar: hargaKamar, upgradeDelta: Math.max(hargaKamar - hargaBase, 0),
      addOns: addOns, hargaUnit: hargaUnit
    };
  });

  return {
    idKeluarga: j.idKeluarga || '', pax: anggota.length,
    picNama: picNama, picHp: picHp,
    anggota: anggota, totalHarga: totalHarga, totalDibayar: totalDibayar,
    sisa: Math.max(totalHarga - totalDibayar, 0)
  };
}

/**
 * Stats ringkas untuk sidebar Index.html.
 */
function getDashboardStats() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var shJ   = ss.getSheetByName('Jamaah');
  var shG   = ss.getSheetByName('Group');
  var shP   = ss.getSheetByName('Pembayaran');

  var totalJamaah = 0, dokLengkap = 0, kloterAktif = 0, pendapatanBulan = 0;
  var today = new Date();
  var bulanIni = today.getMonth(), tahunIni = today.getFullYear();

  if (shJ && shJ.getLastRow() > 1) {
    var jRows = shJ.getDataRange().getValues().slice(1).filter(function(r){ return r[0]; });
    totalJamaah = jRows.length;
    dokLengkap  = jRows.filter(function(r){ return String(r[16]) === 'Lengkap'; }).length;
  }

  if (shG && shG.getLastRow() > 1) {
    kloterAktif = shG.getDataRange().getValues().slice(1)
      .filter(function(r){ return r[0] && String(r[20]) !== 'Selesai'; }).length;
  }

  if (shP && shP.getLastRow() > 1) {
    shP.getDataRange().getValues().slice(1).forEach(function(r) {
      if (!r[0] || String(r[6]) !== 'Lunas' || !r[8]) return;
      var tgl = new Date(r[8]);
      if (tgl.getMonth() === bulanIni && tgl.getFullYear() === tahunIni) {
        pendapatanBulan += parseFloat(r[4]) || 0;
      }
    });
  }

  return {
    totalJamaah:     totalJamaah,
    dokLengkap:      dokLengkap,
    pctDok:          totalJamaah > 0 ? Math.round(dokLengkap / totalJamaah * 100) : 0,
    kloterAktif:     kloterAktif,
    pendapatanBulan: pendapatanBulan
  };
}

/**
 * Daftar semua group/kloter (untuk dropdown di form).
 */
function getGroupList() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Group');
  if (!sh || sh.getLastRow() < 2) return [];
  var today = new Date(); today.setHours(0,0,0,0);
  var terisiMap = hitungTerisiPerGroup_(); // jumlah jamaah aktual per kloter
  // Peta harga paket (sumber harga utama) — dipakai mengisi harga efektif kloter.
  var paketMap = {};
  try { getPaketList(true).forEach(function(p){ paketMap[p.idPaket] = p; }); } catch(e) {}
  return sh.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0]; })
    .map(function(r) {
      var isNewSchema = sh.getLastColumn() >= 20; // 23-col schema
      var obj;
      if (isNewSchema) {
        obj = {
          idGroup:       r[0],  namaGroup:   r[1],
          tglBerangkat:  r[2] ? formatTanggal_(r[2]) : '',
          tglPulang:     r[3] ? formatTanggal_(r[3]) : '',
          maskapai: r[4], asal: r[5] || 'CGK',
          kotaTransitPergi:  r[6]  || '', noFlightPergi1:  r[7]  || '', noFlightPergi2:  r[8]  || '',
          kotaTransitPulang: r[9]  || '', noFlightPulang1: r[10] || '', noFlightPulang2: r[11] || '',
          hotelMadinah: r[12] || '', hotelMakkah: r[13] || '', hotelTransit: r[14] || '',
          hargaQuad:      parseFloat(r[15]) || 0,
          tambahanTriple: parseFloat(r[16]) || 0,
          tambahanDouble: parseFloat(r[17]) || 0,
          kapasitas: r[18], terisi: (terisiMap[r[0]] || 0), statusGroup: r[20],
          pembimbing: r[21], catatan: r[22] || '', idPaket: r[23] || ''
        };
      } else {
        // backward compat: old 14-col schema
        obj = {
          idGroup: r[0], namaGroup: r[1],
          tglBerangkat: r[2] ? formatTanggal_(r[2]) : '',
          tglPulang: r[3] ? formatTanggal_(r[3]) : '',
          maskapai: r[4], asal: 'CGK',
          noFlightPergi1: r[5] || '', noFlightPulang1: r[6] || '',
          hotelMadinah: r[7] || '', hotelMakkah: r[8] || '',
          hargaQuad: 0, tambahanTriple: 0, tambahanDouble: 0,
          kapasitas: r[9], terisi: (terisiMap[r[0]] || 0), statusGroup: r[11],
          pembimbing: r[12], catatan: r[13] || ''
        };
      }
      obj.statusGroup = autoStatusGroup_(obj, today, r[2], r[3]);
      // Harga efektif: bila kloter merujuk paket, harga mengikuti paket.
      if (obj.idPaket && paketMap[obj.idPaket]) {
        var pk = paketMap[obj.idPaket];
        obj.namaPaket      = pk.namaPaket;
        obj.hargaQuad      = parseFloat(pk.harga) || 0;
        obj.tambahanTriple = parseFloat(pk.tambahanTriple) || 0;
        obj.tambahanDouble = parseFloat(pk.tambahanDouble) || 0;
      }
      return obj;
    });
}

/**
 * Hitung jumlah jamaah aktual per kloter (IDGroup) dari sheet Jamaah.
 * Mengembalikan map { idGroup: jumlah }. Dipakai agar "Terisi" pada kartu
 * kloter selalu sinkron dengan data, bukan angka manual yang bisa basi.
 */
function hitungTerisiPerGroup_() {
  var map = {};
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return map;
  // Kolom 15 (0-indexed) = ID Group
  var vals = sh.getRange(2, 16, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    var g = vals[i][0];
    if (g) map[g] = (map[g] || 0) + 1;
  }
  return map;
}

/**
 * Hitung status kloter otomatis berdasarkan tanggal.
 */
function autoStatusGroup_(g, today, rawBerangkat, rawPulang) {
  var manual = g.statusGroup || '';
  if (manual === 'Draft') return 'Draft';
  // Pakai tanggal MENTAH (objek Date dari sheet) bila tersedia — jangan
  // mengandalkan g.tglBerangkat yang sudah diformat ke teks "14 Juni 2026"
  // karena new Date() tidak bisa mem-parse nama bulan Bahasa Indonesia.
  var srcBerangkat = rawBerangkat || g.tglBerangkat;
  var srcPulang    = rawPulang || g.tglPulang;
  if (!srcBerangkat) return manual || 'Aktif';
  var tglBerangkat = new Date(srcBerangkat); tglBerangkat.setHours(0,0,0,0);
  if (isNaN(tglBerangkat.getTime())) return manual || 'Aktif';
  var tglPulang = srcPulang ? new Date(srcPulang) : null;
  if (tglPulang && !isNaN(tglPulang.getTime())) tglPulang.setHours(0,0,0,0); else tglPulang = null;
  if (tglPulang && today > tglPulang) return 'Selesai';
  if (today >= tglBerangkat) return 'Berjalan';
  // Jika manual masih "Selesai" atau "Berjalan" tapi tanggal belum sesuai, reset ke Aktif
  if (manual === 'Selesai' || manual === 'Berjalan') return 'Aktif';
  return manual || 'Aktif';
}

function getGroupById(idGroup) {
  var list = getGroupList();
  for (var i = 0; i < list.length; i++) {
    if (list[i].idGroup === idGroup) return list[i];
  }
  return null;
}

function hitungHargaJamaah_(idGroup, tipeKamar, kategori) {
  if (!idGroup) return 0;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Group');
  if (!sh || sh.getLastRow() < 2) return 0;
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idGroup) {
      // Sumber harga UTAMA: Paket yang dirujuk kloter (kolom 23). Bila kloter
      // belum punya paket (data lama), fallback ke harga inline kloter (15-17).
      var base, triple, dbl;
      var idPaket = rows[i][23] || '';
      var paket = idPaket ? getPaketById_(idPaket) : null;
      if (paket && parseFloat(paket.harga) > 0) {
        base   = parseFloat(paket.harga) || 0;
        triple = parseFloat(paket.tambahanTriple) || 0;
        dbl    = parseFloat(paket.tambahanDouble) || 0;
      } else {
        base   = parseFloat(rows[i][15]) || 0;
        triple = parseFloat(rows[i][16]) || 0;
        dbl    = parseFloat(rows[i][17]) || 0;
      }
      // Infant: persen dari harga base Quad, tidak pilih tipe kamar
      if (kategori === 'Infant') {
        var persen = parseFloat(getConfig_('HARGA_INFANT_PERSEN') || '10') / 100;
        return Math.round(base * persen);
      }
      if (tipeKamar === 'Triple') return base + triple;
      if (tipeKamar === 'Double') return base + dbl;
      return base;
    }
  }
  return 0;
}

function simpanGroup(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Group');
    if (!sh) return { success: false, error: 'Sheet Group tidak ditemukan.' };

    var idGroup = data.idGroup || '';
    var bpiuWarning = cekBpiu_(parseFloat(data.hargaQuad) || 0);
    var row = [
      idGroup || ('GRP-' + new Date().getTime()),
      data.namaGroup || '',
      data.tglBerangkat ? new Date(data.tglBerangkat) : '',
      data.tglPulang    ? new Date(data.tglPulang)    : '',
      data.maskapai || '', data.asal || 'CGK',
      data.kotaTransitPergi  || '', data.noFlightPergi1  || '', data.noFlightPergi2  || '',
      data.kotaTransitPulang || '', data.noFlightPulang1 || '', data.noFlightPulang2 || '',
      data.hotelMadinah || '', data.hotelMakkah || '', data.hotelTransit || '',
      parseFloat(data.hargaQuad)      || 0,
      parseFloat(data.tambahanTriple) || 0,
      parseFloat(data.tambahanDouble) || 0,
      parseInt(data.kapasitas)        || 0,
      0,
      data.statusGroup || 'Aktif',
      data.pembimbing  || '',
      data.catatan     || '',
      data.idPaket     || ''
    ];

    if (idGroup) {
      var rows = sh.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === idGroup) {
          row[19] = rows[i][19]; // preserve Terisi
          sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
          logActivity_(getCurrentUser_(), 'Update Kloter', 'Group', idGroup, data.namaGroup || '');
          return { success: true, idGroup: idGroup, action: 'updated', warning: bpiuWarning };
        }
      }
    }

    row[0] = 'GRP-' + new Date().getTime();
    row[19] = 0;
    sh.appendRow(row);
    logActivity_(getCurrentUser_(), 'Tambah Kloter', 'Group', row[0], data.namaGroup || '');
    return { success: true, idGroup: row[0], action: 'created', warning: bpiuWarning };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Cek harga paket terhadap acuan BPIU Kemenag (Config: BPIU_REFERENSI).
 * @returns {string} pesan peringatan, atau '' bila tidak ada/aman.
 */
function cekBpiu_(hargaQuad) {
  var ref = parseFloat(String(getConfig_('BPIU_REFERENSI') || '').replace(/[^0-9]/g, ''));
  if (!ref || !hargaQuad) return '';
  if (hargaQuad < ref) {
    return 'Harga paket (Rp ' + formatRupiah_(hargaQuad) + ') di bawah acuan BPIU Kemenag (Rp ' +
      formatRupiah_(ref) + '). Pastikan sesuai ketentuan agar tidak bermasalah saat pelaporan.';
  }
  return '';
}

function hapusGroup(idGroup) {
  try {
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var shJ = ss.getSheetByName('Jamaah');
    if (shJ && shJ.getLastRow() > 1) {
      var jRows = shJ.getDataRange().getValues().slice(1);
      var ada = jRows.some(function(r) { return r[0] && r[15] === idGroup; });
      if (ada) return { success: false, error: 'Tidak bisa hapus kloter yang masih memiliki jamaah.' };
    }
    var sh = ss.getSheetByName('Group');
    if (!sh) return { success: false, error: 'Sheet Group tidak ditemukan.' };
    var rows = sh.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (rows[i][0] === idGroup) {
        var nama = rows[i][1];
        sh.deleteRow(i + 1);
        logActivity_(getCurrentUser_(), 'Hapus Kloter', 'Group', idGroup, nama);
        return { success: true, namaGroup: nama };
      }
    }
    return { success: false, error: 'Kloter tidak ditemukan.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Daftar semua paket (untuk dropdown di form).
 */
function getPaketList(includeNonaktif) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Paket');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0] && (includeNonaktif || r[7] !== false); })
    .map(function(r) {
      return {
        idPaket:      r[0], namaPaket:    r[1],
        harga:        r[2], dpMinimal:    r[3],
        durasi:       r[4], hotelMadinah: r[5],
        hotelMakkah:  r[6], aktif:        r[7] !== false,
        tambahanTriple: parseFloat(r[8]) || 0,
        tambahanDouble: parseFloat(r[9]) || 0
      };
    });
}

/**
 * Simpan (create/update) paket.
 */
function simpanPaket(data) {
  try {
    if (!data || !String(data.namaPaket || '').trim()) return { success: false, error: 'Nama paket wajib diisi.' };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Paket');
    if (!sh) return { success: false, error: 'Sheet Paket tidak ditemukan.' };
    var bpiuWarning = cekBpiu_(parseFloat(data.harga) || 0);
    var row = [
      data.idPaket || ('PKT-' + new Date().getTime()),
      String(data.namaPaket).trim(),
      parseFloat(data.harga) || 0,
      parseFloat(data.dpMinimal) || 0,
      parseInt(data.durasi) || 0,
      data.hotelMadinah || '',
      data.hotelMakkah || '',
      data.aktif === false ? false : true,
      parseFloat(data.tambahanTriple) || 0,
      parseFloat(data.tambahanDouble) || 0
    ];
    if (data.idPaket) {
      var rows = sh.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(data.idPaket)) {
          sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
          logActivity_(getCurrentUser_(), 'Update Paket', 'Paket', data.idPaket, data.namaPaket);
          return { success: true, idPaket: data.idPaket, action: 'updated', warning: bpiuWarning };
        }
      }
    }
    sh.appendRow(row);
    logActivity_(getCurrentUser_(), 'Tambah Paket', 'Paket', row[0], data.namaPaket);
    return { success: true, idPaket: row[0], action: 'created', warning: bpiuWarning };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Hapus paket. Tolak bila masih dipakai kloter.
 */
function hapusPaket(idPaket) {
  try {
    if (!idPaket) return { success: false, error: 'ID paket wajib diisi.' };
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var shG = ss.getSheetByName('Group');
    if (shG && shG.getLastRow() > 1) {
      var dipakai = shG.getDataRange().getValues().slice(1).some(function(r) { return r[0] && r[23] === idPaket; });
      if (dipakai) return { success: false, error: 'Paket masih dipakai oleh kloter. Ubah kloter dulu.' };
    }
    var sh = ss.getSheetByName('Paket');
    if (!sh) return { success: false, error: 'Sheet Paket tidak ditemukan.' };
    var rows = sh.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === String(idPaket)) {
        var nama = rows[i][1];
        sh.deleteRow(i + 1);
        logActivity_(getCurrentUser_(), 'Hapus Paket', 'Paket', idPaket, nama);
        return { success: true, namaPaket: nama };
      }
    }
    return { success: false, error: 'Paket tidak ditemukan.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── PRIVATE HELPERS ─────────────────────────────────────────────────────────

function getJamaahById_(idJamaah) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return null;
  var rows = sh.getDataRange().getValues().slice(1);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(idJamaah)) {
      return {
        idJamaah:         rows[i][0],
        namaLengkap:      rows[i][1], nama:  rows[i][1],
        nik:              rows[i][2],
        noPaspor:         rows[i][3],
        noHp:             rows[i][7],
        email:            rows[i][8],
        jenisKelamin:     rows[i][5],
        paket:            rows[i][14], idPaket: rows[i][14],
        idGroup:          rows[i][15],
        statusDokumen:    rows[i][16],
        statusPembayaran: rows[i][17],
        idKeluarga:       rows[i][18] || '',
        isPIC:            rows[i][23] === 'Ya',
        tipeKamar:        rows[i][24] || 'Quad',
        kategoriJamaah:   rows[i][25] || 'Dewasa',
        tempatLahir:        rows[i][26] || '', namaAyah:          rows[i][27] || '',
        statusPerkawinan:   rows[i][28] || '', pekerjaan:         rows[i][29] || '',
        pendidikan:         rows[i][30] || '', provinsi:          rows[i][31] || '',
        kabupaten:          rows[i][32] || '', kecamatan:         rows[i][33] || '',
        kelurahan:          rows[i][34] || '', kodePos:           rows[i][35] || '',
        kewarganegaraan:    rows[i][36] || '', namaMahram:        rows[i][37] || '',
        hubunganMahram:     rows[i][38] || '', embarkasi:         rows[i][39] || '',
        golonganDarah:      rows[i][40] || '', tempatTerbitPaspor:rows[i][41] || '',
        hubunganKeluarga:   rows[i][42] || deriveHubunganKeluarga_(rows[i])
      };
    }
  }
  return null;
}

function getPaketById_(idPaket) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Paket');
  if (!sh || sh.getLastRow() < 2) return null;
  var rows = sh.getDataRange().getValues().slice(1);
  for (var i = 0; i < rows.length; i++) {
    // Cocokkan by ID atau by nama paket
    if (String(rows[i][0]) === String(idPaket) || String(rows[i][1]) === String(idPaket)) {
      return {
        idPaket:    rows[i][0], namaPaket:   rows[i][1],
        harga:      rows[i][2], dpMinimal:   rows[i][3],
        durasi:     rows[i][4], hotelMadinah: rows[i][5], hotelMakkah: rows[i][6],
        tambahanTriple: parseFloat(rows[i][8]) || 0,
        tambahanDouble: parseFloat(rows[i][9]) || 0
      };
    }
  }
  return null;
}

/**
 * Buat baris invoice baru di sheet Pembayaran.
 */
function generateInvoice_(idJamaah, namaJamaah, jenisBayar, nominal, tglJatuhTempo) {
  var shP = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pembayaran');
  if (!shP) return null;
  var idInvoice = 'INV-' + new Date().getTime();
  shP.appendRow([
    idInvoice, idJamaah, namaJamaah, jenisBayar,
    nominal, '', 'Pending', new Date(), '', tglJatuhTempo || '',
    '', '', '', '', ''
  ]);
  return { idInvoice: idInvoice, nominal: nominal };
}

/**
 * Generate invoice DP dan kirim WA notifikasi ke jamaah.
 */
function generateInvoiceDP_(idJamaah, jamaahData, paket) {
  try {
    var dpPersen  = parseFloat(getConfig_('DP_DEFAULT_PERSEN') || '30') / 100;
    var tipeKamar = jamaahData.tipeKamar || 'Quad';
    var hargaKloter = hitungHargaJamaah_(jamaahData.idGroup || '', tipeKamar);
    var hargaFinal  = hargaKloter > 0 ? hargaKloter : parseFloat((paket && paket.harga) || 0);
    var nominalDP   = Math.round(hargaFinal * dpPersen);
    var batasHari   = parseInt(getConfig_('BATAS_JATUH_TEMPO_DP_HARI') || '7');
    var tglJT       = new Date();
    tglJT.setDate(tglJT.getDate() + batasHari);

    var invoice = generateInvoice_(idJamaah, jamaahData.namaLengkap || jamaahData.nama || '',
      'DP', nominalDP, tglJT);
    if (!invoice) return;

    var noHp = String(jamaahData.noHp || '');
    if (!noHp) return;

    var namaTravel = getConfig_('NAMA_TRAVEL') || 'Kelana';
    var namaBank   = getConfig_('NAMA_BANK')    || '';
    var noRek      = getConfig_('NO_REKENING')  || '';
    var atasNama   = getConfig_('ATAS_NAMA')    || '';
    var tglStr     = tglJT.toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'});

    kirimWA_(noHp,
      '🕌 *Pendaftaran Umroh Diterima!*\n\n' +
      'Assalamualaikum *' + (jamaahData.namaLengkap || '') + '*,\n\n' +
      'Terima kasih telah mendaftar umroh bersama *' + namaTravel + '*.\n\n' +
      '📋 *Detail Paket:*\n• Paket : ' + (paket.namaPaket || jamaahData.paket || '') +
      '\n• Tipe Kamar : ' + tipeKamar +
      '\n• Harga : Rp ' + formatRupiah_(hargaFinal) +
      '\n\n💳 *Invoice DP:*\n• No. Invoice : ' + invoice.idInvoice +
      '\n• Nominal DP : Rp ' + formatRupiah_(nominalDP) +
      '\n• Batas Bayar : ' + tglStr +
      '\n\n🏦 *Transfer ke:*\n• Bank     : ' + namaBank +
      '\n• No. Rek : ' + noRek +
      '\n• A/N     : ' + atasNama +
      '\n\nSilakan transfer dan kirimkan bukti pembayaran ke kami.\n' +
      'Semoga menjadi ibadah yang mabrur! 🤲\n\n_' + namaTravel + '_'
    );
  } catch(e) {
    Logger.log('generateInvoiceDP_ error: ' + e.message);
  }
}

/**
 * Kirim pesan WhatsApp via Fonnte API.
 * Docs: https://documenter.getpostman.com/view/1658341/Tz5i4bD
 */
function kirimWA_(noHp, pesan) {
  var apiKey = getConfig_('WA_API_KEY');
  var sender = getConfig_('WA_SENDER');
  if (!apiKey || !sender) return;

  // Normalisasi nomor: 08xxx → 628xxx, strip karakter non-angka
  noHp = String(noHp).trim().replace(/^0/, '62').replace(/[^0-9]/g, '');
  if (!noHp) return;

  UrlFetchApp.fetch('https://api.fonnte.com/send', {
    method:           'post',
    headers:          { 'Authorization': apiKey },
    payload:          { target: noHp, message: pesan, sender: sender },
    muteHttpExceptions: true
  });
}

/**
 * Ambil nilai konfigurasi dari sheet Config.
 */
function getConfig_(key) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Config');
  if (!sh || sh.getLastRow() < 2) return '';
  var data = sh.getDataRange().getValues().slice(1);
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === key) return String(data[i][1] || '');
  }
  return '';
}

/**
 * Set / update satu nilai konfigurasi di sheet Config (buat sheet bila belum ada).
 */
function setConfig_(key, value) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Config');
  if (!sh) {
    sh = ss.insertSheet('Config');
    sh.appendRow(['Key','Value','Keterangan']);
    sh.getRange(1,1,1,3).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#fff');
    sh.setFrozenRows(1);
  }
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) { sh.getRange(i + 1, 2).setValue(value); return; }
  }
  sh.appendRow([key, value, '']);
}

/**
 * Tulis satu baris ke sheet "Log Aktivitas".
 * Dipanggil dari seluruh file .gs setiap ada aksi penting.
 */
function logActivity_(user, aksi, modul, idRecord, detail) {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log Aktivitas');
    if (!sh) return;
    sh.appendRow([new Date(), user || '', aksi || '', modul || '', idRecord || '', detail || '']);
  } catch(e) {}
}

/**
 * Format angka ke Rupiah (tanpa "Rp", pakai titik sebagai pemisah ribuan).
 * Contoh: 5000000 → "5.000.000"
 */
function formatRupiah_(angka) {
  if (!angka && angka !== 0) return '0';
  return parseInt(angka).toLocaleString('id-ID');
}

/**
 * Format tanggal ke "DD MMMM YYYY" dalam Bahasa Indonesia.
 */
function formatTanggal_(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'});
  } catch(e) { return String(date).substring(0, 10); }
}

// ─── LEAD CRUD ───────────────────────────────────────────────────────────────

function simpanLead(data) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Lead');
  if (!sh) {
    sh = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Lead');
    sh.appendRow(['IDLead','Nama','NoHP','Email','Sumber','Status','MinatPaket','Catatan','TglMasuk','DitanganiOleh']);
    sh.getRange(1,1,1,10).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#fff');
    sh.setFrozenRows(1);
  }
  var idLead = data.idLead || '';
  if (idLead) {
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idLead) {
        sh.getRange(i+1, 2, 1, 8).setValues([[
          data.nama        != null ? data.nama        : rows[i][1],
          data.noHp        != null ? data.noHp        : rows[i][2],
          data.email       != null ? data.email       : rows[i][3],
          data.sumber      != null ? data.sumber      : rows[i][4],
          data.status      != null ? data.status      : rows[i][5],
          data.minatPaket  != null ? data.minatPaket  : rows[i][6],
          data.catatan     != null ? data.catatan     : rows[i][7],
          rows[i][8]
        ]]);
        sh.getRange(i+1, 10).setValue(getCurrentUser_());
        return { success: true, idLead: idLead };
      }
    }
  }
  idLead = 'LD-' + new Date().getTime();
  sh.appendRow([idLead, data.nama||'', data.noHp||'', data.email||'',
    data.sumber||'', data.status||'Baru', data.minatPaket||'',
    data.catatan||'', new Date(), getCurrentUser_()]);
  return { success: true, idLead: idLead };
}

function hapusLead(idLead) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Lead');
  if (!sh) return { success: false, error: 'Sheet tidak ditemukan.' };
  var rows = sh.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === idLead) { sh.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false, error: 'Lead tidak ditemukan.' };
}

function updateLead(data) {
  return simpanLead(data);
}

function deleteLead(idLead) {
  return hapusLead(idLead);
}

/** Ubah status lead → Booking dan kembalikan data-nya agar UI bisa pre-fill form jamaah. */
function konversiLeadKeJamaah(idLead) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Lead');
  if (!sh) return { success: false, error: 'Sheet tidak ditemukan.' };
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idLead) {
      sh.getRange(i+1, 6).setValue('Booking');
      return { success: true, lead: {
        idLead: rows[i][0], nama: rows[i][1], noHp: rows[i][2],
        email: rows[i][3], minatPaket: rows[i][6]
      }};
    }
  }
  return { success: false, error: 'Lead tidak ditemukan.' };
}

// ─── INVOICE HTML ────────────────────────────────────────────────────────────

/** Generate HTML invoice siap cetak/print untuk satu idInvoice. */
function getInvoiceHtml(idInvoice) {
  var shP = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pembayaran');
  if (!shP || shP.getLastRow() < 2) return null;
  var rows = shP.getDataRange().getValues();
  var inv = null;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idInvoice) {
      inv = { idInvoice:rows[i][0], idJamaah:rows[i][1], namaJamaah:rows[i][2],
              jenisBayar:rows[i][3], nominal:rows[i][4], metode:rows[i][5],
              status:rows[i][6], tglInvoice:rows[i][7], tglBayar:rows[i][8],
              tglJatuhTempo:rows[i][9], buktiBayar:rows[i][12]||'',
              dikonfirmasiOleh:rows[i][13]||'' };
      break;
    }
  }
  if (!inv) return null;

  var namaTravel  = getConfig_('NAMA_TRAVEL')   || 'Travel Umroh';
  var telTravel   = getConfig_('TELEPON_TRAVEL') || '';
  var namaBank    = getConfig_('NAMA_BANK')      || '';
  var noRek       = getConfig_('NO_REKENING')    || '';
  var atasNama    = getConfig_('ATAS_NAMA')      || '';
  var jamaah      = getJamaahById_(inv.idJamaah) || {};

  function fmt(d) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}); }
    catch(e) { return String(d).substring(0,10); }
  }
  function fmtDt(d) {
    if (!d) return '-';
    try { return new Date(d).toLocaleString('id-ID',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
    catch(e) { return String(d).substring(0,16); }
  }
  var badgeClass = inv.status==='Lunas' ? 'lunas' : inv.status==='Jatuh Tempo' ? 'jatuh' : 'pending';
  var booking = getBookingSummary_(inv.idJamaah);

  var html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">'
    + '<title>Invoice '+esc_(inv.idInvoice)+'</title>'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}'
    + 'body{font-family:Arial,sans-serif;font-size:13px;color:#1a1a2e;padding:32px;max-width:780px;margin:0 auto}'
    + '.hd{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2.5px solid #4F46E5;margin-bottom:22px}'
    + '.co-name{font-size:22px;font-weight:800;color:#4F46E5}.co-info{font-size:11px;color:#6b7280;margin-top:3px}'
    + '.inv-r{text-align:right}.inv-r h2{font-size:26px;font-weight:800;color:#4F46E5;letter-spacing:1px}'
    + '.inv-r .no{font-size:12px;color:#6b7280;margin-top:3px}.inv-r .no b{color:#1a1a2e}'
    + '.sec{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:18px}'
    + '.lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;margin-bottom:3px}'
    + '.val{font-size:13px;font-weight:700}'
    + '.amount-box{background:#eef2ff;border-radius:10px;padding:16px 20px;margin:18px 0}'
    + '.amount-box .lbl{font-size:11px}.amount-box .amt{font-size:30px;font-weight:900;color:#4F46E5;margin-top:5px}'
    + '.badge{display:inline-block;padding:4px 13px;border-radius:99px;font-size:12px;font-weight:700}'
    + '.lunas{background:#dcfce7;color:#14532d}.pending{background:#fef9c3;color:#713f12}.jatuh{background:#fee2e2;color:#7f1d1d}'
    + '.bank-box{border:1.5px solid #e0e7ff;border-radius:10px;padding:14px 18px;margin-top:14px}'
    + '.bank-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;margin-bottom:10px}'
    + '.brow{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid #f3f4f6}'
    + '.brow:last-child{border-bottom:0}.brow .k{color:#6b7280;font-size:12px}.brow .v{font-weight:800}'
    + '.foot{margin-top:28px;padding-top:18px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af}'
    + '@media print{.no-print{display:none!important}@page{margin:18mm}}</style></head><body>'
    + '<div class="no-print" style="margin-bottom:18px;display:flex;gap:10px">'
    + '<button onclick="window.print()" style="background:#4F46E5;color:#fff;border:0;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer">🖨 Cetak / Simpan PDF</button>'
    + '<button onclick="window.close()" style="background:#f5f5f7;border:1px solid #e5e7eb;padding:10px 20px;border-radius:8px;cursor:pointer">Tutup</button></div>'
    + '<div class="hd"><div><div class="co-name">'+esc_(namaTravel)+'</div>'
    + (telTravel?'<div class="co-info">Telp/WA: '+esc_(telTravel)+'</div>':'')+'</div>'
    + '<div class="inv-r"><h2>INVOICE</h2><div class="no">No: <b>'+esc_(inv.idInvoice)+'</b></div>'
    + '<div class="no">Tanggal: <b>'+fmt(inv.tglInvoice)+'</b></div></div></div>'
    + '<div class="sec"><div><div class="lbl">Tagihan Kepada</div><div class="val">'+esc_(inv.namaJamaah||'-')+'</div>'
    + (jamaah.noHp?'<div style="font-size:12px;color:#6b7280;margin-top:2px">'+esc_(jamaah.noHp)+'</div>':'')+'</div>'
    + '<div style="text-align:right"><div class="lbl">Status</div><span class="badge '+badgeClass+'">'+esc_(inv.status||'Pending')+'</span>'
    + (inv.tglJatuhTempo?'<div class="lbl" style="margin-top:10px">Jatuh Tempo</div><div class="val">'+fmt(inv.tglJatuhTempo)+'</div>':'')+'</div></div>'
    + '<div class="lbl">Keterangan</div><div style="font-size:14px;font-weight:700;margin:4px 0 16px">'+esc_(inv.jenisBayar||'Pembayaran')+' — Paket Umroh</div>'
    + '<div class="amount-box"><div class="lbl">Total '+esc_(inv.jenisBayar||'Pembayaran')+'</div>'
    + '<div class="amt">Rp '+formatRupiah_(inv.nominal||0)+'</div>'
    + (inv.metode?'<div style="font-size:11px;color:#6b7280;margin-top:6px">Metode: '+esc_(inv.metode)+'</div>':'')
    + (inv.tglBayar?'<div style="font-size:11px;color:#16a34a;margin-top:2px;font-weight:700">Dibayar: '+fmtDt(inv.tglBayar)+'</div>':'')
    + (inv.dikonfirmasiOleh?'<div style="font-size:11px;color:#6b7280;margin-top:2px">Dikonfirmasi oleh: '+esc_(inv.dikonfirmasiOleh)+'</div>':'')
    + (inv.buktiBayar?'<div style="font-size:11px;margin-top:2px"><a href="'+esc_(inv.buktiBayar)+'" target="_blank">Lihat bukti pembayaran</a></div>':'')
    + '</div>';

  // Detail pemesanan (pax, anggota, paket, kamar, add-on)
  if (booking && booking.anggota && booking.anggota.length) {
    html += '<div class="bank-box"><div class="bank-title">Detail Pemesanan ('+booking.pax+' pax)</div>';
    booking.anggota.forEach(function(a) {
      var extra = a.tipeKamar + (a.kategori && a.kategori!=='Dewasa' ? ' · '+a.kategori : '');
      var addonStr = (a.addOns && a.addOns.length) ? ' · +'+a.addOns.length+' add-on' : '';
      html += '<div class="brow"><span class="k">'+esc_(a.nama)+' <span style="color:#9ca3af">('+esc_(extra)+addonStr+')</span></span>'
        + '<span class="v">Rp '+formatRupiah_(a.hargaUnit)+'</span></div>';
    });
    html += '<div class="brow"><span class="k"><b>Total Booking</b></span><span class="v">Rp '+formatRupiah_(booking.totalHarga)+'</span></div>'
      + '<div class="brow"><span class="k">Sudah Dibayar</span><span class="v">Rp '+formatRupiah_(booking.totalDibayar)+'</span></div>'
      + '<div class="brow"><span class="k">Sisa</span><span class="v">Rp '+formatRupiah_(booking.sisa)+'</span></div>'
      + '</div>';
  }

  if (inv.status !== 'Lunas' && noRek) {
    html += '<div class="bank-box"><div class="bank-title">Informasi Transfer</div>'
      + '<div class="brow"><span class="k">Bank</span><span class="v">'+esc_(namaBank)+'</span></div>'
      + '<div class="brow"><span class="k">No. Rekening</span><span class="v">'+esc_(noRek)+'</span></div>'
      + '<div class="brow"><span class="k">Atas Nama</span><span class="v">'+esc_(atasNama)+'</span></div>'
      + '</div>';
  }

  html += '<div class="foot">'+esc_(namaTravel)+' · Jazakumullah khairan atas kepercayaan Anda.</div></body></html>';
  return { html: html, idInvoice: inv.idInvoice };
}

function getInvoicePreview(idInvoice) {
  return getInvoiceHtml(idInvoice);
}

// ─── EXPORT JAMAAH ───────────────────────────────────────────────────────────

function exportJamaahCsv(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return { csv: '', count: 0, filename: 'jamaah.csv' };
  var headers = ['IDJamaah','Nama','NIK','NoPaspor','TglLahir','JenisKelamin','NoHP','Email','Paket','Kloter','StatusDokumen','StatusPembayaran','TglDaftar'];
  var colIdx  = [0, 1, 2, 3, 4, 5, 7, 8, 14, 15, 16, 17, 21];
  var csv = headers.map(function(h){ return '"'+h+'"'; }).join(',') + '\n';
  var rows = sh.getDataRange().getValues().slice(1);
  var count = 0;
  rows.forEach(function(r) {
    if (!r[0]) return;
    if (idGroup && r[15] !== idGroup) return;
    csv += colIdx.map(function(ci) {
      var v = r[ci] instanceof Date ? r[ci].toLocaleDateString('id-ID') : String(r[ci] || '');
      return '"' + v.replace(/"/g, '""') + '"';
    }).join(',') + '\n';
    count++;
  });
  var filename = 'jamaah' + (idGroup ? '-' + idGroup : '') + '.csv';
  return { csv: csv, count: count, filename: filename };
}

function exportJamaahHtml() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return { html: '', count: 0 };
  var data = sh.getDataRange().getValues();
  var namaTravel = getConfig_('NAMA_TRAVEL') || 'Kelana';
  var cols = [0,1,2,3,4,5,7,14,15,16,17];
  var labels = ['ID','Nama','NIK','No Paspor','Tgl Lahir','JK','No HP','Paket','Kloter','Dok','Bayar'];
  var html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Daftar Jamaah</title>'
    + '<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;padding:20px}'
    + 'h2{font-size:15px;margin-bottom:4px}p.meta{color:#6b7280;font-size:11px;margin-bottom:14px}'
    + 'table{width:100%;border-collapse:collapse}th{background:#4F46E5;color:#fff;text-align:left;padding:7px 8px;font-size:10px;font-weight:700}'
    + 'td{padding:6px 8px;border-bottom:1px solid #e5e7eb}tr:nth-child(even){background:#f8f9ff}'
    + '@media print{.no-print{display:none!important}@page{size:A4 landscape;margin:12mm}}</style></head><body>'
    + '<div class="no-print" style="margin-bottom:14px;display:flex;gap:10px">'
    + '<button onclick="window.print()" style="background:#4F46E5;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-weight:700;cursor:pointer">🖨 Cetak / Simpan PDF</button>'
    + '<button onclick="window.close()" style="background:#f5f5f7;border:1px solid #ddd;padding:9px 18px;border-radius:8px;cursor:pointer">Tutup</button></div>'
    + '<h2>Daftar Jamaah — '+esc_(namaTravel)+'</h2>'
    + '<p class="meta">Dicetak: '+new Date().toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})+' · '+(data.length-1)+' jamaah</p>'
    + '<table><thead><tr>'+labels.map(function(l){ return '<th>'+l+'</th>'; }).join('')+'</tr></thead><tbody>';
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    html += '<tr>'+cols.map(function(ci){
      var v = data[i][ci];
      if (v instanceof Date) v = v.toLocaleDateString('id-ID');
      return '<td>'+esc_(String(v||'-'))+'</td>';
    }).join('')+'</tr>';
    count++;
  }
  html += '</tbody></table></body></html>';
  return { html: html, count: count };
}

// ─── DOKUMEN / FOTO UPLOAD ───────────────────────────────────────────────────

/**
 * Upload file base64 ke Google Drive, simpan link ke sheet Dokumen.
 * Folder: "Kelana — {namaTravel} / {idJamaah}"
 */
function uploadFotoJamaah(idJamaah, jenisFile, base64Data, mimeType, fileName) {
  try {
    var namaTravel = getConfig_('NAMA_TRAVEL') || 'Kelana';
    var rootName = 'Kelana — ' + namaTravel;
    var it = DriveApp.getFoldersByName(rootName);
    var root = it.hasNext() ? it.next() : DriveApp.createFolder(rootName);
    var sub = root.getFoldersByName(idJamaah);
    var folder = sub.hasNext() ? sub.next() : root.createFolder(idJamaah);

    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    var ex = folder.getFilesByName(fileName);
    if (ex.hasNext()) ex.next().setTrashed(true);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var viewUrl = 'https://drive.google.com/file/d/' + file.getId() + '/view';

    updateDokumenField_(idJamaah, jenisFile, viewUrl);
    try { recomputeStatusDokumen_(idJamaah); } catch (e) {}
    logActivity_(getCurrentUser_(), 'Upload Foto', 'Dokumen', idJamaah, jenisFile + ': ' + fileName);
    return { success: true, url: viewUrl };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Upload bukti pembayaran ke Google Drive (pola sama dengan uploadFotoJamaah).
 * Disimpan di folder "Kelana — {travel}/Bukti Bayar". Mengembalikan URL /view.
 */
function uploadBuktiBayar(idInvoice, base64Data, mimeType, fileName) {
  try {
    var namaTravel = getConfig_('NAMA_TRAVEL') || 'Kelana';
    var rootName = 'Kelana — ' + namaTravel;
    var it = DriveApp.getFoldersByName(rootName);
    var root = it.hasNext() ? it.next() : DriveApp.createFolder(rootName);
    var sub = root.getFoldersByName('Bukti Bayar');
    var folder = sub.hasNext() ? sub.next() : root.createFolder('Bukti Bayar');

    var safeName = (idInvoice || 'INV') + '-' + fileName;
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, safeName);
    var ex = folder.getFilesByName(safeName);
    if (ex.hasNext()) ex.next().setTrashed(true);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var viewUrl = 'https://drive.google.com/file/d/' + file.getId() + '/view';
    logActivity_(getCurrentUser_(), 'Upload Bukti Bayar', 'Pembayaran', idInvoice, safeName);
    return { success: true, url: viewUrl };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Format Date → "YYYY-MM-DD" untuk <input type=date>. Kosong jika tidak valid.
function isoDate_(d) {
  if (!d) return '';
  try {
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d).substring(0, 10);
    return dt.getFullYear() + '-' + ('0'+(dt.getMonth()+1)).slice(-2) + '-' + ('0'+dt.getDate()).slice(-2);
  } catch (e) { return ''; }
}

function getDokumenJamaah(idJamaah) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dokumen');
  if (!sh || sh.getLastRow() < 2) return null;
  var rows = sh.getDataRange().getValues();
  // Dokumen (0-idx): 0:ID 1:IDJamaah 2:Nama 3:NoKTP 4:FotoKTP 5:NoPaspor 6:NoVisa
  // 7:TglTerbitPaspor 8:TglExpiredPaspor 9:TglTerbitVisa 10:TglExpiredVisa
  // 11:FotoPaspor 12:FotoVisa 13:VaksinMeningitis 14:VaksinCovid 15:KartuKuning
  // 16:Catatan 17:StatusDokumenLengkap
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === idJamaah) {
      var r = rows[i];
      return {
        idDokumen: r[0], idJamaah: r[1], namaJamaah: r[2],
        noKTP: r[3],  fotoKTP: r[4],
        noPaspor: r[5], noVisa: r[6],
        tglTerbitPaspor:  isoDate_(r[7]),
        tglExpiredPaspor: isoDate_(r[8]),
        tglTerbitVisa:    isoDate_(r[9]),
        tglExpiredVisa:   isoDate_(r[10]),
        fotoPaspor:       r[11], fotoVisa: r[12],
        vaksinMeningitis: r[13], vaksinCovid: r[14],
        kartuKuning:      r[15], catatan: r[16] || '',
        statusDokumenLengkap: r[17] || '',
        pasFoto:          r[18] || ''
      };
    }
  }
  return null;
}

/**
 * Simpan data dokumen (nomor & tanggal) dari modul Dokumen.
 * Field tanggal pakai string "YYYY-MM-DD". Sinkron No Paspor ke sheet Jamaah,
 * lalu hitung ulang status kelengkapan dokumen.
 */
function updateDokumenData(idJamaah, d) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Dokumen');
    if (!sh) return { success: false, error: 'Sheet Dokumen tidak ditemukan.' };
    d = d || {};

    var rows = sh.getDataRange().getValues();
    var r1 = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === String(idJamaah)) { r1 = i + 1; break; }
    }
    if (r1 < 0) {
      var nama = (getJamaahById_(idJamaah) || {}).namaLengkap || '';
      sh.appendRow(['DOK-' + new Date().getTime(), idJamaah, nama,
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Belum Lengkap']);
      r1 = sh.getLastRow();
    }

    function setCell(col, val, isDate) {
      if (val === undefined) return;
      sh.getRange(r1, col).setValue(isDate ? (val ? new Date(val) : '') : val);
    }
    setCell(4,  d.noKTP);            // NoKTP
    setCell(6,  d.noPaspor);         // NoPaspor
    setCell(7,  d.noVisa);           // NoVisa
    setCell(8,  d.tglTerbitPaspor,  true);
    setCell(9,  d.tglExpiredPaspor, true);
    setCell(10, d.tglTerbitVisa,    true);
    setCell(11, d.tglExpiredVisa,   true);
    setCell(17, d.catatan);

    // Sinkron No Paspor ke sheet Jamaah (kolom 4) agar ekspor SISKOPATUH konsisten.
    if (d.noPaspor !== undefined) updateJamaahField_(idJamaah, 4, d.noPaspor);

    var status = recomputeStatusDokumen_(idJamaah);
    logActivity_(getCurrentUser_(), 'Update Dokumen', 'Dokumen', idJamaah, 'Status: ' + status);
    return { success: true, status: status };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Set satu sel di sheet Jamaah berdasarkan ID jamaah (col = 1-based).
 */
function updateJamaahField_(idJamaah, col, val) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return;
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(idJamaah)) { sh.getRange(i + 1, col).setValue(val); return; }
  }
}

/**
 * Hitung ulang status kelengkapan dokumen (Lengkap/Proses/Belum Lengkap) dan
 * tulis ke Dokumen kol 18 + sinkron ke Jamaah kol 17 (Status Dokumen).
 */
function recomputeStatusDokumen_(idJamaah) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dokumen');
  if (!sh || sh.getLastRow() < 2) return '';
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) !== String(idJamaah)) continue;
    var r = rows[i];
    var wajib = [r[5] /*NoPaspor*/, r[8] /*TglExpiredPaspor*/, r[4] /*FotoKTP*/, r[11] /*FotoPaspor*/];
    var terisi = wajib.filter(function(x){ return x && String(x).trim(); }).length;
    var status = terisi === wajib.length ? 'Lengkap' : terisi === 0 ? 'Belum Lengkap' : 'Proses';
    sh.getRange(i + 1, 18).setValue(status);
    updateJamaahField_(idJamaah, 17, status); // Jamaah kol 17 = Status Dokumen
    return status;
  }
  return '';
}

// Mapping jenisFile → kolom (1-indexed untuk setRange) di sheet Dokumen
var DOKUMEN_COL_MAP_ = {
  fotoKTP: 5, fotoPaspor: 12, fotoVisa: 13,
  vaksinMeningitis: 14, vaksinCovid: 15, kartuKuning: 16, pasFoto: 19
};

function updateDokumenField_(idJamaah, jenisFile, nilai) {
  var col = DOKUMEN_COL_MAP_[jenisFile];
  if (!col) return false;
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dokumen');
  if (!sh || sh.getLastRow() < 2) return false;
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === idJamaah) { sh.getRange(i + 1, col).setValue(nilai); return true; }
  }
  return false;
}

// HTML escape helper untuk template yang dirender di backend
function esc_(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

// ─── PRIVATE SETUP HELPER ────────────────────────────────────────────────────

function createSheetIfNotExists_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (sh) {
    ensureSheetHeaders_(sh, headers);
    return sh;
  }
  sh = ss.insertSheet(name);
  if (headers && headers.length) {
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4f46e5')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

/**
 * Pastikan semua header yang diharapkan sudah ada di baris pertama sheet.
 * Kolom baru ditambahkan jika belum ada; sel header kosong diisi ulang.
 * Idempoten — aman dipanggil berulang.
 */
function ensureSheetHeaders_(sh, headers) {
  if (!headers || !headers.length) return;
  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }
  var existing = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    if (!existing[i]) {
      sh.getRange(1, i + 1)
        .setValue(headers[i])
        .setFontWeight('bold')
        .setBackground('#4f46e5')
        .setFontColor('#ffffff');
    }
  }
}
