/**
 * KELANA — DummyData.gs
 * =====================
 * Isi semua sheet dengan data contoh untuk testing / demo.
 *
 * CARA PAKAI:
 *   1. Upload file ini ke Apps Script (sama seperti file lain)
 *   2. Buka Apps Script → pilih fungsi "isiDummyData" → klik Run
 *   3. Semua sheet akan terisi data contoh
 *
 * PERINGATAN:
 *   - Fungsi ini akan MENIMPA/MENGHAPUS data yang sudah ada di semua sheet
 *   - Gunakan HANYA untuk testing / demo, bukan di spreadsheet client nyata
 *   - Setelah puas testing, jalankan "hapusSemuaDummyData" untuk reset
 *
 * CATATAN:
 *   - Setiap fungsi _isi* juga memperbaiki header baris-1 (berguna bila header
 *     hilang karena sheet dibuat dengan skema lama)
 */

// ─── MAIN FUNCTION ────────────────────────────────────────────────────────────

function isiDummyData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  var resp = ui.alert('⚠ Konfirmasi',
    'Fungsi ini akan MENGHAPUS semua data yang ada dan mengisinya dengan data dummy.\n\n' +
    'Lanjutkan?', ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  _isiConfig(ss);
  _isiPaket(ss);
  _isiGroup(ss);
  _isiJamaah(ss);
  _isiAddOn(ss);
  _isiPetugas(ss);
  _isiDokumen(ss);
  _isiPembayaran(ss);
  _isiRoomlist(ss);
  _isiManifest(ss);
  _isiLead(ss);
  _isiPengguna(ss);
  _isiLogAktivitas(ss);

  ui.alert('✅ Selesai',
    'Data dummy berhasil diisi ke semua sheet.\n\n' +
    'Silakan buka sidebar Kelana untuk melihat hasilnya.',
    ui.ButtonSet.OK);
}

/**
 * Hapus semua data dummy dan kembalikan sheet ke kondisi kosong (header saja).
 */
function hapusSemuaDummyData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert('⚠ Reset Data',
    'Ini akan menghapus SEMUA data di semua sheet (header tetap ada).\n\nLanjutkan?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  ['Jamaah','Group','Paket','Pembayaran','AddOn','Petugas','Dokumen','Roomlist','Manifest',
   'Lead','Pengguna','Log Aktivitas'].forEach(function(name) {
    var sh = ss.getSheetByName(name);
    if (sh && sh.getLastRow() > 1) {
      sh.deleteRows(2, sh.getLastRow() - 1);
    }
  });
  ui.alert('✅ Semua data dummy sudah dihapus.', '', ui.ButtonSet.OK);
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

function _isiConfig(ss) {
  var sh = ss.getSheetByName('Config');
  if (!sh) return;
  var HEADERS = ['Key','Value','Keterangan'];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  var rows = [
    ['NAMA_TRAVEL',            'Al-Barokah Travel',         'Nama travel Anda'],
    ['ALAMAT_TRAVEL',          'Jl. Masjid No. 12, Jakarta Selatan', 'Alamat kantor travel'],
    ['TELEPON_TRAVEL',         '6281234567890',             'No HP/WA travel'],
    ['EMAIL_TRAVEL',           'albarokah@gmail.com',       'Email travel'],
    ['WA_API_KEY',             'demo_api_key_fonnte_xxxx',  'API Key Fonnte'],
    ['WA_SENDER',              '6281234567890',             'No HP pengirim WA'],
    ['NAMA_BANK',              'Bank Syariah Indonesia',    'Nama bank'],
    ['NO_REKENING',            '7123456789',                'Nomor rekening'],
    ['ATAS_NAMA',              'Al-Barokah Travel',         'Nama pemilik rekening'],
    ['DP_DEFAULT_PERSEN',      '30',                        'Persentase DP'],
    ['BATAS_PELUNASAN_HARI',   '45',                        'Hari sebelum berangkat'],
    ['BATAS_JATUH_TEMPO_DP_HARI','7',                       'Batas bayar DP'],
    ['LICENSE_KEY',            'KLN-DEMO-TEST-0001',        'License key Kelana'],
    ['LICENSE_URL',            'https://script.google.com/macros/s/DEMO/exec', 'URL License Server'],
    ['KELANA_CONTACT',         '6281999888777',             'No WA developer Kelana'],
    ['XENDIT_API_KEY',         '',                          'API Key Xendit (opsional)'],
    ['XENDIT_CALLBACK_TOKEN',  '',                          'Callback token Xendit (opsional)'],
    ['HARGA_INFANT_PERSEN',   '10',                        'Harga infant sebagai % dari harga dewasa'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── PAKET ────────────────────────────────────────────────────────────────────

function _isiPaket(ss) {
  var sh = ss.getSheetByName('Paket');
  if (!sh) return;
  var HEADERS = ['ID Paket','Nama Paket','Harga (Quad)','DP Minimal','Durasi (Hari)','Hotel Madinah','Hotel Makkah','Aktif','Tambahan Triple','Tambahan Double'];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // ID | Nama | HargaQuad | DPMinimal | Durasi | HotelMadinah | HotelMakkah | Aktif | +Triple | +Double
  var rows = [
    ['PKT-001', 'Paket Hemat Reguler',       22000000, 6600000,  9,  'Movenpick Hajar Tower', 'Hilton Suites Makkah',    true,  1500000, 3000000],
    ['PKT-002', 'Paket Nyaman Plus',          28500000, 8550000,  12, 'Pullman Zamzam Madinah','Swissotel Makkah',        true,  2000000, 4000000],
    ['PKT-003', 'Paket Premium Ramadhan',     35000000, 10500000, 14, 'Dar Al Iman Royal',     'Sheraton Makkah Jabal',   true,  2500000, 5000000],
    ['PKT-004', 'Paket VIP Eksklusif',        55000000, 16500000, 14, 'Anwar Al Madinah',      'Raffles Makkah Palace',   true,  5000000, 10000000],
    ['PKT-005', 'Paket Backpacker Budget',    18500000, 5550000,  9,  'Al Haram Hotel',        'Ajyad Makkah Hotel',      false, 1000000, 2000000],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── GROUP ────────────────────────────────────────────────────────────────────

function _isiGroup(ss) {
  var sh = ss.getSheetByName('Group');
  if (!sh) return;
  var HEADERS = [
    'ID Group','Nama Group','Tgl Berangkat','Tgl Pulang','Maskapai',
    'Asal','Kota Transit Pergi','No Flight Pergi 1','No Flight Pergi 2',
    'Kota Transit Pulang','No Flight Pulang 1','No Flight Pulang 2',
    'Hotel Madinah','Hotel Makkah','Hotel Transit',
    'Harga Quad','Tambahan Triple','Tambahan Double',
    'Kapasitas','Terisi','Status Group','Pembimbing','Catatan','ID Paket'
  ];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // 0:IDGroup  1:NamaGroup  2:TglBerangkat  3:TglPulang  4:Maskapai  5:Asal
  // 6:KotaTransitPergi  7:NoFlightPergi1  8:NoFlightPergi2
  // 9:KotaTransitPulang  10:NoFlightPulang1  11:NoFlightPulang2
  // 12:HotelMadinah  13:HotelMakkah  14:HotelTransit
  // 15:HargaQuad  16:TambahanTriple  17:TambahanDouble
  // 18:Kapasitas  19:Terisi  20:StatusGroup  21:Pembimbing  22:Catatan
  var rows = [
    // Direct flight — Saudi Arabian Airlines CGK→JED
    ['GRP-2025-01','Kloter Januari 2025 — Hemat',
      new Date('2025-01-15'), new Date('2025-01-24'),
      'Saudi Arabian Airlines', 'CGK',
      '', 'SV816', '',
      '', 'SV815', '',
      'Movenpick Hajar Tower', 'Hilton Suites Makkah', '',
      22000000, 1500000, 3000000,
      45, 42, 'Selesai', 'Ust. Ahmad Fauzi', 'Sudah berangkat, semua berjalan lancar', 'PKT-001'],

    // Direct flight — Garuda Indonesia CGK→JED
    ['GRP-2025-02','Kloter Maret 2025 — Nyaman Plus',
      new Date('2025-03-10'), new Date('2025-03-22'),
      'Garuda Indonesia', 'CGK',
      '', 'GA981', '',
      '', 'GA980', '',
      'Pullman Zamzam Madinah', 'Swissotel Makkah', '',
      28500000, 2000000, 4000000,
      40, 38, 'Selesai', 'Ust. Hasan Basri', 'Sudah selesai', 'PKT-002'],

    // Direct flight — Saudi Airlines, Ramadhan premium
    ['GRP-2025-03','Kloter Ramadhan 2025 — Premium',
      new Date('2025-03-01'), new Date('2025-03-15'),
      'Saudi Arabian Airlines', 'CGK',
      '', 'SV822', '',
      '', 'SV821', '',
      'Dar Al Iman Royal', 'Sheraton Makkah Jabal', '',
      35000000, 2500000, 5000000,
      35, 35, 'Selesai', 'Ust. Yusuf Mansur Jr.', 'Full capacity', 'PKT-003'],

    // Transit via KUL — Batik Air BDO→KUL + AirAsia KUL→JED
    ['GRP-2025-04','Kloter Juli 2025 — Nyaman Plus',
      new Date('2025-07-05'), new Date('2025-07-17'),
      'Batik Air', 'BDO',
      'KUL', 'ID7081', 'QZ3701',
      'KUL', 'QZ3702', 'ID7082',
      'Pullman Zamzam Madinah', 'Swissotel Makkah', 'Berjaya Times Square KL',
      28500000, 2000000, 4000000,
      42, 30, 'Aktif', 'Ust. Ridwan Al-Habsyi', 'Proses dokumen jamaah', 'PKT-002'],

    // Transit via KUL — Lion Air CGK→KUL + Malaysia Airlines KUL→JED
    ['GRP-2025-05','Kloter September 2025 — Hemat',
      new Date('2025-09-20'), new Date('2025-09-29'),
      'Lion Air', 'CGK',
      'KUL', 'JT211', 'MH371',
      'KUL', 'MH370', 'JT210',
      'Movenpick Hajar Tower', 'Hilton Suites Makkah', 'Tune Hotel KL',
      22000000, 1500000, 3000000,
      50, 18, 'Aktif', 'Ust. Fuad Ibrahim', 'Masih open booking', 'PKT-001'],

    // Direct flight — Garuda VIP
    ['GRP-2026-01','Kloter Januari 2026 — VIP',
      new Date('2026-01-10'), new Date('2026-01-24'),
      'Garuda Indonesia', 'CGK',
      '', 'GA981', '',
      '', 'GA980', '',
      'Anwar Al Madinah', 'Raffles Makkah Palace', '',
      55000000, 5000000, 10000000,
      20, 5, 'Aktif', 'Belum ditentukan', 'Pre-booking VIP', 'PKT-004'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── JAMAAH ───────────────────────────────────────────────────────────────────

function _isiJamaah(ss) {
  var sh = ss.getSheetByName('Jamaah');
  if (!sh) return;
  var HEADERS = [
    'ID Jamaah','Nama Lengkap','NIK','No Paspor','Tgl Lahir','Jenis Kelamin',
    'Alamat','No HP','Email','Kontak Darurat','HP Darurat','Hubungan Darurat',
    'Kondisi Kesehatan','Status Vaksin','Paket','ID Group',
    'Status Dokumen','Status Pembayaran','ID Keluarga','Sumber Lead',
    'Catatan','Tgl Daftar','Dibuat Oleh','Is PIC','Tipe Kamar','Kategori Jamaah',
    'Tempat Lahir','Nama Ayah','Status Perkawinan','Pekerjaan','Pendidikan',
    'Provinsi','Kabupaten/Kota','Kecamatan','Kelurahan','Kode Pos',
    'Kewarganegaraan','Nama Mahram','Hubungan Mahram','Embarkasi',
    'Golongan Darah','Tempat Terbit Paspor',
    'Hubungan Keluarga'
  ];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // Kolom 0–25 : data jamaah inti
  // Kolom 26–41: SISKOPATUH (TempatLahir,NamaAyah,StatusPerkawinan,Pekerjaan,Pendidikan,
  //              Provinsi,Kab/Kota,Kecamatan,Kelurahan,KodePos,Kewarganegaraan,
  //              NamaMahram,HubunganMahram,Embarkasi,GolonganDarah,TempatTerbitPaspor)
  // Kolom 42   : HubunganKeluarga
  var rows = [
    // ── Kloter GRP-2025-04 (Aktif, Juli 2025) ─────────────────────────────
    // KLG-001: Ahmad Ridwan (PIC/Suami) + Siti Nurhaliza (Istri)
    ['JMH-1001','Ahmad Ridwan Santoso','3271011504850001','B1234567',
      new Date('1985-04-15'),'Laki-laki',
      'Jl. Sudirman No. 45, Bandung','6281234100001','ahmad.ridwan@email.com',
      'Siti Aminah','6281234100099','Istri',
      'Sehat','Sudah','PKT-002','GRP-2025-04',
      'Lengkap','Lunas','KLG-001','Referral','','2025-03-01','admin@albarokah.com','Ya','Quad','Dewasa',
      'Bandung','Santoso Bin Hasan','Kawin','Karyawan Swasta','S1',
      'Jawa Barat','Kota Bandung','Sukasari','Sukarasa','40152',
      'WNI','','','Bandung','A','Bandung',
      'Suami'],

    ['JMH-1002','Siti Nurhaliza Binti Ahmad','3271015507900002','B2345678',
      new Date('1990-07-15'),'Perempuan',
      'Jl. Asia Afrika No. 12, Bandung','6281234100002','siti.nur@email.com',
      'Ahmad Ridwan','6281234100001','Suami',
      'Asma ringan','Sudah','PKT-002','GRP-2025-04',
      'Lengkap','Lunas','KLG-001','Referral','Istri JMH-1001','2025-03-01','admin@albarokah.com','','Quad','Dewasa',
      'Jakarta','Ahmad Bin Hasan','Kawin','Ibu Rumah Tangga','D3',
      'Jawa Barat','Kota Bandung','Lengkong','Cigateung','40262',
      'WNI','Ahmad Ridwan Santoso','Suami','Bandung','B','Jakarta',
      'Istri'],

    ['JMH-1003','Budi Hartono Kusuma','3273020309780003','C3456789',
      new Date('1978-09-03'),'Laki-laki',
      'Jl. Cihampelas No. 77, Bandung','6281234100003','budi.hartono@email.com',
      'Maya Sari','6281234100103','Istri',
      'Diabetes terkontrol','Sudah','PKT-002','GRP-2025-04',
      'Lengkap','Lunas','','Instagram','Bawa obat rutin','2025-03-05','admin@albarokah.com','Ya','Triple','Dewasa',
      'Bandung','Kusuma Bin Wijaya','Kawin','Wiraswasta','S1',
      'Jawa Barat','Kota Bandung','Coblong','Dago','40135',
      'WNI','','','Bandung','O','Bandung',
      ''],

    ['JMH-1004','Dewi Rahayu Putri','3274044512820004','D4567890',
      new Date('1982-12-05'),'Perempuan',
      'Jl. Riau No. 88, Bandung','6281234100004','dewi.rahayu@email.com',
      'Bambang Susilo','6281234100104','Suami',
      'Sehat','Sudah','PKT-002','GRP-2025-04',
      'Lengkap','DP Lunas','','Website','','2025-03-10','admin@albarokah.com','Ya','Triple','Dewasa',
      'Bandung','Rahayu Bin Ahmad','Kawin','Guru','S1',
      'Jawa Barat','Kota Bandung','Cibeunying Kaler','Neglasari','40124',
      'WNI','Bambang Susilo','Suami','Bandung','AB','Bandung',
      ''],

    ['JMH-1005','Hasan Maulana Akbar','3271051507750005','E5678901',
      new Date('1975-07-15'),'Laki-laki',
      'Jl. Braga No. 33, Bandung','6281234100005','hasan.maulana@email.com',
      'Aminah Wati','6281234100105','Istri',
      'Sehat','Sudah','PKT-002','GRP-2025-04',
      'Proses','DP Lunas','','Referral','Paspor dalam proses perpanjangan','2025-03-12','marketing@albarokah.com','Ya','Quad','Dewasa',
      'Bandung','Akbar Bin Umar','Kawin','Pedagang','SMA',
      'Jawa Barat','Kota Bandung','Astanaanyar','Panjunan','40241',
      'WNI','','','Bandung','A','Bandung',
      ''],

    // KLG-002: Umar Al-Anshari (PIC/Kepala Keluarga) + Fatimah Zahra (Anak)
    ['JMH-1006','Fatimah Zahra Al-Anshari','3271064508920006','F6789012',
      new Date('1992-08-05'),'Perempuan',
      'Jl. Diponegoro No. 21, Bandung','6281234100006','fatimah.zahra@email.com',
      'Umar Al-Anshari','6281234100106','Ayah',
      'Sehat','Sudah','PKT-002','GRP-2025-04',
      'Lengkap','Pending','KLG-002','Pameran','Mahramnya Ayah (JMH-1007)','2025-03-15','marketing@albarokah.com','','Quad','Dewasa',
      'Bandung','Umar Al-Anshari','Belum Kawin','Karyawan Swasta','S1',
      'Jawa Barat','Kota Bandung','Coblong','Cipaganti','40131',
      'WNI','Umar Al-Anshari','Ayah','Bandung','O','Bandung',
      'Anak'],

    ['JMH-1007','Umar Al-Anshari','3271072208680007','G7890123',
      new Date('1968-08-22'),'Laki-laki',
      'Jl. Diponegoro No. 21, Bandung','6281234100007','umar.anshari@email.com',
      'Khadijah','6281234100107','Istri',
      'Hipertensi terkontrol','Sudah','PKT-002','GRP-2025-04',
      'Lengkap','Pending','KLG-002','Pameran','Mahram untuk Fatimah (JMH-1006)','2025-03-15','marketing@albarokah.com','Ya','Quad','Dewasa',
      'Bandung','Ali Bin Anshari','Kawin','Pengusaha','S1',
      'Jawa Barat','Kota Bandung','Coblong','Cipaganti','40131',
      'WNI','','','Bandung','A','Bandung',
      'Kepala Keluarga'],

    ['JMH-1008','Rizky Pratama Putra','3271081201950008','H8901234',
      new Date('1995-01-12'),'Laki-laki',
      'Jl. Pasirkaliki No. 55, Bandung','6281234100008','rizky.pratama@email.com',
      'Indah Pratama','6281234100108','Ibu',
      'Sehat','Belum','PKT-002','GRP-2025-04',
      'Belum Lengkap','Belum Bayar','','WhatsApp','Belum vaksin meningitis','2025-04-01','marketing@albarokah.com','Ya','Double','Dewasa',
      'Bandung','Pratama Bin Haris','Belum Kawin','Mahasiswa','S1',
      'Jawa Barat','Kota Bandung','Cicendo','Husein Sastranegara','40173',
      'WNI','','','Bandung','B','Bandung',
      ''],

    // ── Kloter GRP-2025-05 (Aktif, September 2025) ────────────────────────
    ['JMH-1009','Supriyadi Wibowo','3502092608700009','I9012345',
      new Date('1970-06-26'),'Laki-laki',
      'Jl. Gatot Subroto No. 100, Surabaya','6281234100009','supriyadi.w@email.com',
      'Sri Wibowo','6281234100109','Istri',
      'Sehat','Sudah','PKT-001','GRP-2025-05',
      'Lengkap','DP Lunas','','Referral','','2025-04-10','admin@albarokah.com','Ya','Quad','Dewasa',
      'Surabaya','Wibowo Bin Joko','Kawin','PNS','S1',
      'Jawa Timur','Kota Surabaya','Wonokromo','Wonokromo','60243',
      'WNI','','','Surabaya','O','Surabaya',
      ''],

    ['JMH-1010','Nurul Hidayah Binti Salam','3502105509850010','J0123456',
      new Date('1985-09-15'),'Perempuan',
      'Jl. Ahmad Yani No. 67, Surabaya','6281234100010','nurul.hidayah@email.com',
      'Salam Bin Ahmad','6281234100110','Ayah',
      'Sehat','Sudah','PKT-001','GRP-2025-05',
      'Proses','Pending','','Instagram','Visa dalam proses','2025-04-12','marketing@albarokah.com','Ya','Triple','Dewasa',
      'Surabaya','Salam Bin Ahmad','Belum Kawin','Karyawan Swasta','D3',
      'Jawa Timur','Kota Surabaya','Gayungan','Menanggal','60234',
      'WNI','Salam Bin Ahmad','Ayah','Surabaya','A','Surabaya',
      ''],

    ['JMH-1011','Agus Setiawan','3578110806650011','K1234567',
      new Date('1965-06-08'),'Laki-laki',
      'Jl. Pemuda No. 45, Surabaya','6281234100011','agus.setiawan@email.com',
      'Nining Setiawan','6281234100111','Istri',
      'Kolesterol','Sudah','PKT-001','GRP-2025-05',
      'Belum Lengkap','Belum Bayar','','Facebook','Paspor expired, sedang diperpanjang','2025-04-15','marketing@albarokah.com','Ya','Quad','Dewasa',
      'Surabaya','Setiawan Bin Slamet','Kawin','Buruh','SMA',
      'Jawa Timur','Kota Surabaya','Tambaksari','Pacarkeling','60131',
      'WNI','','','Surabaya','B','Surabaya',
      ''],

    // ── Kloter GRP-2026-01 (Aktif, Januari 2026) ──────────────────────────
    ['JMH-1012','Dr. Irfan Hakim Lubis','1271122901730012','L2345678',
      new Date('1973-01-29'),'Laki-laki',
      'Jl. Imam Bonjol No. 88, Medan','6281234100012','irfan.hakim@email.com',
      'dr. Rina Lubis','6281234100112','Istri',
      'Sehat','Sudah','PKT-004','GRP-2026-01',
      'Lengkap','DP Lunas','','Referral VIP','Dokter spesialis, perlu kamar di lantai rendah','2025-05-01','admin@albarokah.com','Ya','Double','Dewasa',
      'Medan','Lubis Bin Hakim','Kawin','Dokter','S2',
      'Sumatera Utara','Kota Medan','Medan Baru','Merdeka','20153',
      'WNI','','','Medan','O','Medan',
      ''],

    ['JMH-1013','Hj. Ratna Dewi Kurniawan','3171133006580013','M3456789',
      new Date('1958-06-30'),'Perempuan',
      'Jl. Kemang Raya No. 12, Jakarta Selatan','6281234100013','ratna.kurniawan@email.com',
      'H. Kurniawan','6281234100113','Suami',
      'Sehat','Sudah','PKT-004','GRP-2026-01',
      'Lengkap','Lunas','','Referral VIP','Sudah umroh ke-3','2025-05-05','admin@albarokah.com','Ya','Triple','Dewasa',
      'Jakarta','Suryana Bin Hasan','Kawin','Ibu Rumah Tangga','S1',
      'DKI Jakarta','Jakarta Selatan','Mampang Prapatan','Bangka','12720',
      'WNI','H. Kurniawan','Suami','Jakarta','A','Jakarta',
      ''],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── ADD-ON / UPGRADE ─────────────────────────────────────────────────────────

function _isiAddOn(ss) {
  var sh = ss.getSheetByName('AddOn');
  if (!sh) return;
  var HEADERS = ['ID AddOn','ID Jamaah','Nama Item','Kategori','Harga','Catatan','Tgl Dibuat','Dibuat Oleh'];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // 0:IDAddOn 1:IDJamaah 2:NamaItem 3:Kategori 4:Harga 5:Catatan 6:TglDibuat 7:DibuatOleh
  var rows = [
    ['ADO-001','JMH-1008','Kursi Roda Airport & Hotel','Layanan',
      150000,'Perlu kursi roda di bandara dan hotel selama trip',
      new Date('2025-04-02'),'admin@albarokah.com'],
    ['ADO-002','JMH-1012','Upgrade Kamar Double ke Single','Kamar',
      2500000,'Request khusus dokter spesialis — butuh privasi & kamar lantai rendah',
      new Date('2025-05-03'),'admin@albarokah.com'],
    ['ADO-003','JMH-1013','Extra Bagasi +10 kg','Bagasi',
      500000,'Tambah bagasi karena bawa oleh-oleh banyak',
      new Date('2025-05-06'),'admin@albarokah.com'],
    ['ADO-004','JMH-1007','Handling Bagasi VIP','Layanan',
      300000,'Jasa porter & handling bagasi prioritas di bandara',
      new Date('2025-03-16'),'admin@albarokah.com'],
    ['ADO-005','JMH-1012','Upgrade Maskapai ke Business Class','Maskapai',
      5000000,'Upgrade dari Economy ke Business Class (Garuda GA981)',
      new Date('2025-05-03'),'admin@albarokah.com'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── PETUGAS ──────────────────────────────────────────────────────────────────

function _isiPetugas(ss) {
  var sh = ss.getSheetByName('Petugas');
  if (!sh) { try { migratePetugasSchema_(); } catch(e){} sh = ss.getSheetByName('Petugas'); }
  if (!sh) return;
  var HEADERS = [
    'ID Petugas','ID Group','Nama Lengkap','Peran',
    'No Telepon','Email','No KTP','No Paspor',
    'Masa Berlaku Paspor','Tempat Lahir','Tanggal Lahir','Jenis Kelamin',
    'Alamat','Catatan','Tgl Dibuat','Tgl Update',
    'Kewarganegaraan','Tgl Terbit Paspor'
  ];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // 0:idPetugas 1:idGroup 2:namaLengkap 3:peran 4:noTelepon 5:email 6:noKTP
  // 7:noPaspor 8:masaBerlakuPaspor 9:tempatLahir 10:tanggalLahir 11:jenisKelamin
  // 12:alamat 13:catatan 14:createdAt 15:updatedAt 16:kewarganegaraan 17:tglTerbitPaspor
  var now = new Date('2025-06-01');
  var rows = [
    ['PTG-001','GRP-2025-04','Ust. Ridwan Al-Habsyi','Pembimbing Ibadah (TPIHI)',
      '6281234200001','ridwan.habsyi@email.com','3271015003700001','P1234567',
      new Date('2030-05-10'),'Bandung',new Date('1970-03-15'),'Laki-laki',
      'Jl. Cibaduyut No. 10, Bandung','Pembimbing utama kloter Juli',now,now,'WNI',new Date('2020-05-11')],
    ['PTG-002','GRP-2025-04','H. Fauzan Akmal','Ketua Kloter',
      '6281234200002','fauzan.akmal@email.com','3271012504800002','P2345678',
      new Date('2029-08-20'),'Garut',new Date('1980-04-25'),'Laki-laki',
      'Jl. Buah Batu No. 22, Bandung','Koordinator lapangan',now,now,'WNI',new Date('2019-08-21')],
    ['PTG-003','GRP-2025-04','Hj. Salma Nuraini','Tour Leader',
      '6281234200003','salma.nuraini@email.com','3271016012850003','P3456789',
      new Date('2031-01-15'),'Cimahi',new Date('1985-12-20'),'Perempuan',
      'Jl. Sukajadi No. 5, Bandung','Pendamping jamaah perempuan',now,now,'WNI',new Date('2021-01-16')],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── DOKUMEN ─────────────────────────────────────────────────────────────────

function _isiDokumen(ss) {
  var sh = ss.getSheetByName('Dokumen');
  if (!sh) return;
  var HEADERS = [
    'ID Dokumen','ID Jamaah','Nama Jamaah','No KTP','Foto KTP','No Paspor',
    'No Visa','Tgl Terbit Paspor','Tgl Expired Paspor','Tgl Terbit Visa',
    'Tgl Expired Visa','Foto Paspor','Foto Visa','Vaksin Meningitis',
    'Vaksin Covid','Kartu Kuning','Catatan','Status Dokumen Lengkap','Pas Foto 4x6'
  ];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // 0:IDDokumen 1:IDJamaah 2:NamaJamaah 3:NoKTP 4:FotoKTP 5:NoPaspor
  // 6:NoVisa 7:TglTerbitPaspor 8:TglExpiredPaspor 9:TglTerbitVisa
  // 10:TglExpiredVisa 11:FotoPaspor 12:FotoVisa 13:VaksinMeningitis
  // 14:VaksinCovid 15:KartuKuning 16:Catatan 17:StatusDokumenLengkap 18:PasFoto
  var rows = [
    ['DOK-1001','JMH-1001','Ahmad Ridwan Santoso',
      '3271011504850001','✓','B1234567',
      'V-9876543',new Date('2020-03-15'),new Date('2030-03-14'),
      new Date('2025-02-01'),new Date('2026-01-31'),
      '✓','✓','✓','✓','✓','','Lengkap','✓'],

    ['DOK-1002','JMH-1002','Siti Nurhaliza Binti Ahmad',
      '3271015507900002','✓','B2345678',
      'V-9876544',new Date('2021-06-20'),new Date('2031-06-19'),
      new Date('2025-02-01'),new Date('2026-01-31'),
      '✓','✓','✓','✓','✓','','Lengkap','✓'],

    ['DOK-1003','JMH-1003','Budi Hartono Kusuma',
      '3273020309780003','✓','C3456789',
      'V-9876545',new Date('2019-11-10'),new Date('2029-11-09'),
      new Date('2025-02-05'),new Date('2026-02-04'),
      '✓','✓','✓','✓','✓','Bawa surat keterangan dokter (diabetes)','Lengkap','✓'],

    ['DOK-1004','JMH-1004','Dewi Rahayu Putri',
      '3274044512820004','✓','D4567890',
      'V-9876546',new Date('2022-01-05'),new Date('2032-01-04'),
      new Date('2025-02-10'),new Date('2026-02-09'),
      '✓','✓','✓','✓','✓','','Lengkap','✓'],

    ['DOK-1005','JMH-1005','Hasan Maulana Akbar',
      '3271051507750005','✓','E5678901',
      '',new Date('2024-09-01'),new Date('2034-08-31'),
      '','',
      '✓','','✓','✓','✓','Paspor sudah diperpanjang, visa masih proses','Proses','✓'],

    ['DOK-1006','JMH-1006','Fatimah Zahra Al-Anshari',
      '3271064508920006','✓','F6789012',
      'V-9876548',new Date('2022-08-15'),new Date('2032-08-14'),
      new Date('2025-03-01'),new Date('2026-02-28'),
      '✓','✓','✓','✓','✓','Mahram: Umar Al-Anshari (JMH-1007)','Lengkap','✓'],

    ['DOK-1007','JMH-1007','Umar Al-Anshari',
      '3271072208680007','✓','G7890123',
      'V-9876549',new Date('2021-03-20'),new Date('2031-03-19'),
      new Date('2025-03-01'),new Date('2026-02-28'),
      '✓','✓','✓','✓','✓','','Lengkap','✓'],

    ['DOK-1008','JMH-1008','Rizky Pratama Putra',
      '3271081201950008','✓','H8901234',
      '',new Date('2024-12-01'),new Date('2034-11-30'),
      '','',
      '✓','','','','','Belum vaksin meningitis & covid. Visa belum diajukan.','Belum Lengkap',''],

    ['DOK-1009','JMH-1009','Supriyadi Wibowo',
      '3502092608700009','✓','I9012345',
      'V-9876551',new Date('2020-07-15'),new Date('2030-07-14'),
      new Date('2025-04-05'),new Date('2026-04-04'),
      '✓','✓','✓','✓','✓','','Lengkap','✓'],

    ['DOK-1010','JMH-1010','Nurul Hidayah Binti Salam',
      '3502105509850010','✓','J0123456',
      '',new Date('2023-09-10'),new Date('2033-09-09'),
      '','',
      '✓','✓','','','','Visa dalam proses pengajuan','Proses','✓'],

    ['DOK-1011','JMH-1011','Agus Setiawan',
      '3578110806650011','✓','K1234567',
      '',new Date('2016-01-10'),new Date('2026-01-09'),
      '','',
      '','','','','','Paspor expired Jan 2026, sedang proses perpanjangan. Vaksin belum.','Belum Lengkap',''],

    ['DOK-1012','JMH-1012','Dr. Irfan Hakim Lubis',
      '1271122901730012','✓','L2345678',
      'V-9876554',new Date('2023-05-20'),new Date('2033-05-19'),
      new Date('2025-04-20'),new Date('2026-04-19'),
      '✓','✓','✓','✓','✓','','Lengkap','✓'],

    ['DOK-1013','JMH-1013','Hj. Ratna Dewi Kurniawan',
      '3171133006580013','✓','M3456789',
      'V-9876555',new Date('2022-10-01'),new Date('2032-09-30'),
      new Date('2025-04-25'),new Date('2026-04-24'),
      '✓','✓','✓','✓','✓','Umroh ke-3, sudah berpengalaman','Lengkap','✓'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── PEMBAYARAN ───────────────────────────────────────────────────────────────

function _isiPembayaran(ss) {
  var sh = ss.getSheetByName('Pembayaran');
  if (!sh) return;
  var HEADERS = [
    'ID Invoice','ID Jamaah','Nama Jamaah','Jenis Bayar','Nominal','Metode',
    'Status','Tgl Invoice','Tgl Bayar','Tgl Jatuh Tempo','ID Trx Xendit',
    'Link Bayar','Bukti Bayar','Dikonfirmasi Oleh','Catatan'
  ];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // 0:IDInvoice 1:IDJamaah 2:NamaJamaah 3:JenisBayar 4:Nominal 5:Metode
  // 6:Status 7:TglInvoice 8:TglBayar 9:TglJatuhTempo
  // 10:IDTrxXendit 11:LinkBayar 12:BuktiBayar 13:DikonfirmasiOleh 14:Catatan
  var rows = [
    // JMH-1001 — Lunas semua
    ['INV-1001','JMH-1001','Ahmad Ridwan Santoso','DP',8550000,'Transfer Bank',
      'Lunas',new Date('2025-03-01'),new Date('2025-03-03'),new Date('2025-03-08'),
      '','','','finance@albarokah.com','DP 30% PKT-002'],
    ['INV-1002','JMH-1001','Ahmad Ridwan Santoso','Pelunasan',19950000,'Transfer Bank',
      'Lunas',new Date('2025-04-01'),new Date('2025-04-05'),new Date('2025-05-21'),
      '','','','finance@albarokah.com','Pelunasan PKT-002'],

    // JMH-1002 — Lunas semua
    ['INV-1003','JMH-1002','Siti Nurhaliza Binti Ahmad','DP',8550000,'QRIS',
      'Lunas',new Date('2025-03-01'),new Date('2025-03-02'),new Date('2025-03-08'),
      'XND-20250302-001','','','finance@albarokah.com','DP via QRIS'],
    ['INV-1004','JMH-1002','Siti Nurhaliza Binti Ahmad','Pelunasan',19950000,'Transfer Bank',
      'Lunas',new Date('2025-04-01'),new Date('2025-04-08'),new Date('2025-05-21'),
      '','','','finance@albarokah.com',''],

    // JMH-1003 — Lunas semua
    ['INV-1005','JMH-1003','Budi Hartono Kusuma','DP',8550000,'Transfer Bank',
      'Lunas',new Date('2025-03-05'),new Date('2025-03-06'),new Date('2025-03-12'),
      '','','','finance@albarokah.com',''],
    ['INV-1006','JMH-1003','Budi Hartono Kusuma','Pelunasan',19950000,'Tunai',
      'Lunas',new Date('2025-04-05'),new Date('2025-04-10'),new Date('2025-05-21'),
      '','','','finance@albarokah.com','Bayar tunai di kantor'],

    // JMH-1004 — DP Lunas, Pelunasan Pending
    ['INV-1007','JMH-1004','Dewi Rahayu Putri','DP',8550000,'Transfer Bank',
      'Lunas',new Date('2025-03-10'),new Date('2025-03-11'),new Date('2025-03-17'),
      '','','','finance@albarokah.com',''],
    ['INV-1008','JMH-1004','Dewi Rahayu Putri','Pelunasan',19950000,'',
      'Pending',new Date('2025-04-10'),'',new Date('2025-05-21'),
      '','','','','Menunggu pembayaran pelunasan'],

    // JMH-1005 — DP Lunas, Pelunasan Pending (hampir jatuh tempo)
    ['INV-1009','JMH-1005','Hasan Maulana Akbar','DP',8550000,'Transfer Bank',
      'Lunas',new Date('2025-03-12'),new Date('2025-03-13'),new Date('2025-03-19'),
      '','','','finance@albarokah.com',''],
    ['INV-1010','JMH-1005','Hasan Maulana Akbar','Pelunasan',19950000,'',
      'Pending',new Date('2025-04-12'),'',new Date('2025-05-21'),
      '','','','',''],

    // JMH-1006 & JMH-1007 — Pending DP
    ['INV-1011','JMH-1006','Fatimah Zahra Al-Anshari','DP',8550000,'',
      'Pending',new Date('2025-03-15'),'',new Date('2025-03-22'),
      '','','','',''],
    ['INV-1012','JMH-1007','Umar Al-Anshari','DP',8550000,'',
      'Pending',new Date('2025-03-15'),'',new Date('2025-03-22'),
      '','','','',''],

    // JMH-1008 — Belum bayar (jatuh tempo lewat) + ada add-on
    ['INV-1013','JMH-1008','Rizky Pratama Putra','DP',8550000,'',
      'Pending',new Date('2025-04-01'),'',new Date('2025-04-08'),
      '','','','','Sudah diingatkan 2x via WA'],

    // JMH-1009 — DP Lunas, Pelunasan Pending
    ['INV-1014','JMH-1009','Supriyadi Wibowo','DP',6600000,'Transfer Bank',
      'Lunas',new Date('2025-04-10'),new Date('2025-04-11'),new Date('2025-04-17'),
      '','','','finance@albarokah.com','DP 30% PKT-001'],
    ['INV-1015','JMH-1009','Supriyadi Wibowo','Pelunasan',15400000,'',
      'Pending',new Date('2025-05-01'),'',new Date('2025-08-06'),
      '','','','',''],

    // JMH-1010 — Belum bayar
    ['INV-1016','JMH-1010','Nurul Hidayah Binti Salam','DP',6600000,'',
      'Pending',new Date('2025-04-12'),'',new Date('2025-04-19'),
      '','','','',''],

    // JMH-1011 — Belum bayar
    ['INV-1017','JMH-1011','Agus Setiawan','DP',6600000,'',
      'Pending',new Date('2025-04-15'),'',new Date('2025-04-22'),
      '','','','',''],

    // JMH-1012 — DP Lunas (+ 2 add-on: kamar & bisnis class)
    ['INV-1018','JMH-1012','Dr. Irfan Hakim Lubis','DP',16500000,'Transfer Bank',
      'Lunas',new Date('2025-05-01'),new Date('2025-05-02'),new Date('2025-05-08'),
      '','','','finance@albarokah.com','DP 30% PKT-004'],

    // JMH-1013 — Lunas penuh (+ add-on bagasi)
    ['INV-1019','JMH-1013','Hj. Ratna Dewi Kurniawan','DP',16500000,'Transfer Bank',
      'Lunas',new Date('2025-05-05'),new Date('2025-05-05'),new Date('2025-05-12'),
      '','','','finance@albarokah.com','Bayar langsung lunas'],
    ['INV-1020','JMH-1013','Hj. Ratna Dewi Kurniawan','Pelunasan',38500000,'Transfer Bank',
      'Lunas',new Date('2025-05-05'),new Date('2025-05-06'),new Date('2025-11-26'),
      '','','','finance@albarokah.com','Pelunasan langsung'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── ROOMLIST ─────────────────────────────────────────────────────────────────

function _isiRoomlist(ss) {
  var sh = ensureRoomlistSheet_();
  if (!sh) return;
  var HEADERS = ['ID Room','ID Group','ID Jamaah','Nama Jamaah','Hotel','Lokasi','Nomor Kamar','Tipe Kamar','Catatan'];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // Schema: IDRoom | IDGroup | IDJamaah | NamaJamaah | Hotel | Lokasi | NomorKamar | TipeKamar | Catatan
  var grp = 'GRP-2025-04';
  var madinah = [
    ['RM-M01',grp,'JMH-1001','Ahmad Ridwan Santoso','Pullman Zamzam Madinah','Madinah','P-1','Quad',''],
    ['RM-M02',grp,'JMH-1003','Budi Hartono Kusuma','Pullman Zamzam Madinah','Madinah','P-1','Quad',''],
    ['RM-M03',grp,'JMH-1005','Hasan Maulana Akbar','Pullman Zamzam Madinah','Madinah','P-1','Quad',''],
    ['RM-M04',grp,'JMH-1007','Umar Al-Anshari','Pullman Zamzam Madinah','Madinah','P-1','Quad',''],
    ['RM-M05',grp,'JMH-1002','Siti Nurhaliza Binti Ahmad','Pullman Zamzam Madinah','Madinah','W-1','Triple',''],
    ['RM-M06',grp,'JMH-1004','Dewi Rahayu Putri','Pullman Zamzam Madinah','Madinah','W-1','Triple',''],
    ['RM-M07',grp,'JMH-1006','Fatimah Zahra Al-Anshari','Pullman Zamzam Madinah','Madinah','W-1','Triple',''],
    ['RM-M08',grp,'JMH-1008','Rizky Pratama Putra','Pullman Zamzam Madinah','Madinah','P-2','Double',''],
  ];
  var makkah = [
    ['RM-K01',grp,'JMH-1001','Ahmad Ridwan Santoso','Swissotel Makkah','Makkah','P-1','Quad',''],
    ['RM-K02',grp,'JMH-1003','Budi Hartono Kusuma','Swissotel Makkah','Makkah','P-1','Quad',''],
    ['RM-K03',grp,'JMH-1005','Hasan Maulana Akbar','Swissotel Makkah','Makkah','P-1','Quad',''],
    ['RM-K04',grp,'JMH-1007','Umar Al-Anshari','Swissotel Makkah','Makkah','P-1','Quad',''],
    ['RM-K05',grp,'JMH-1002','Siti Nurhaliza Binti Ahmad','Swissotel Makkah','Makkah','W-1','Triple',''],
    ['RM-K06',grp,'JMH-1004','Dewi Rahayu Putri','Swissotel Makkah','Makkah','W-1','Triple',''],
    ['RM-K07',grp,'JMH-1006','Fatimah Zahra Al-Anshari','Swissotel Makkah','Makkah','W-1','Triple',''],
    ['RM-K08',grp,'JMH-1008','Rizky Pratama Putra','Swissotel Makkah','Makkah','P-2','Double',''],
  ];
  madinah.concat(makkah).forEach(function(r) { sh.appendRow(r); });
}

// ─── MANIFEST ────────────────────────────────────────────────────────────────

function _isiManifest(ss) {
  var sh = ss.getSheetByName('Manifest');
  if (!sh) return;
  var HEADERS = [
    'ID Manifest','ID Group','Nama Group','No Penerbangan',
    'Tgl Berangkat','Asal','Tujuan','ID Jamaah','Nama Jamaah',
    'No Paspor','Tgl Lahir','Jenis Kelamin','No Kursi','No Visa','Catatan'
  ];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  var grp = 'GRP-2025-04';
  var namaGrp = 'Kloter Juli 2025 — Nyaman Plus';
  var tglBrkt = new Date('2025-07-05');
  var tglBuat = new Date('2025-06-01');

  var penumpang = [
    ['JMH-1001','Ahmad Ridwan Santoso','B1234567','V-9876543',new Date('1985-04-15'),'MALE','23A'],
    ['JMH-1002','Siti Nurhaliza Binti Ahmad','B2345678','V-9876544',new Date('1990-07-15'),'FEMALE','23B'],
    ['JMH-1003','Budi Hartono Kusuma','C3456789','V-9876545',new Date('1978-09-03'),'MALE','24A'],
    ['JMH-1004','Dewi Rahayu Putri','D4567890','V-9876546',new Date('1982-12-05'),'FEMALE','24B'],
    ['JMH-1006','Fatimah Zahra Al-Anshari','F6789012','V-9876548',new Date('1992-08-05'),'FEMALE','25A'],
    ['JMH-1007','Umar Al-Anshari','G7890123','V-9876549',new Date('1968-08-22'),'MALE','25B'],
  ];

  penumpang.forEach(function(p, i) {
    sh.appendRow([
      'MNF-' + (1001 + i), grp, namaGrp, 'ID7081', tglBrkt,
      'Bandung (BDO)', 'Jeddah (JED)',
      p[0], p[1], p[2], p[3], p[4], p[5], p[6], tglBuat
    ]);
  });
}

// ─── LEAD ─────────────────────────────────────────────────────────────────────

function _isiLead(ss) {
  var sh = ss.getSheetByName('Lead');
  if (!sh) return;
  var HEADERS = ['ID Lead','Nama','No HP','Email','Sumber','Status','Minat Paket','Catatan','Tgl Masuk','Ditangani Oleh'];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  var rows = [
    ['LDR-001','Wahyu Hidayat','6281344100001','wahyu@email.com','Instagram',
      'Follow Up','PKT-001','Tanya harga dan jadwal Sept 2025',new Date('2025-05-10'),'marketing@albarokah.com'],
    ['LDR-002','Yanti Kusumawati','6281344100002','','Facebook',
      'Baru','PKT-002','Chat WA, minta brosur',new Date('2025-05-12'),'marketing@albarokah.com'],
    ['LDR-003','Darmawan Harahap','6281344100003','darmawan@email.com','Referral',
      'Follow Up','PKT-003','Direferral dari JMH-1001, minat kloter Ramadhan',new Date('2025-05-15'),'marketing@albarokah.com'],
    ['LDR-004','Lestari Ningrum','6281344100004','','Pameran Haji & Umroh',
      'Booking','PKT-001','Sudah DP, menunggu data lengkap untuk diinput ke jamaah',new Date('2025-05-18'),'marketing@albarokah.com'],
    ['LDR-005','Bambang Sutrisno','6281344100005','bambang.s@email.com','Website',
      'Tidak Jadi','PKT-002','Cancel karena budget tidak cukup',new Date('2025-04-20'),'marketing@albarokah.com'],
    ['LDR-006','Meirani Safitri','6281344100006','mei.safitri@email.com','WhatsApp',
      'Baru','PKT-004','Tanya paket VIP untuk keluarga (4 orang)',new Date('2025-05-20'),'marketing@albarokah.com'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── PENGGUNA ─────────────────────────────────────────────────────────────────

function _isiPengguna(ss) {
  var sh = ensurePenggunaSheet_();
  if (!sh) return;
  var HEADERS = ['Email','Nama','Role','Status','Tgl Dibuat','Password Hash','Tgl Login','Nama Akun'];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  // Semua akun demo password-nya: "kelana123"  (login web app)
  var pw = 'kelana123';
  function h(email) { return hashPassword_(pw, String(email).toLowerCase()); }

  var rows = [
    ['owner@albarokah.com',     'Haji Mahmud (Owner)', 'Owner',     'Aktif',    new Date('2025-01-01'), h('owner@albarokah.com'),     '', ''],
    ['admin@albarokah.com',     'Budi Admin',          'Admin',     'Aktif',    new Date('2025-01-05'), h('admin@albarokah.com'),     '', 'budi.admin'],
    ['finance@albarokah.com',   'Siti Finance',        'Finance',   'Aktif',    new Date('2025-01-05'), h('finance@albarokah.com'),   '', 'siti.finance'],
    ['marketing@albarokah.com', 'Rizki Marketing',     'Marketing', 'Aktif',    new Date('2025-01-05'), h('marketing@albarokah.com'), '', 'rizki'],
    ['marketing2@albarokah.com','Dina Marketing 2',    'Marketing', 'Aktif',    new Date('2025-02-01'), h('marketing2@albarokah.com'),'', 'dina.m2'],
    ['admin2@albarokah.com',    'Eko Admin Cabang',    'Admin',     'Nonaktif', new Date('2025-03-01'), h('admin2@albarokah.com'),    '', 'eko.admin'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}

// ─── LOG AKTIVITAS ────────────────────────────────────────────────────────────

function _isiLogAktivitas(ss) {
  var sh = ss.getSheetByName('Log Aktivitas');
  if (!sh) return;
  var HEADERS = ['Waktu','Email Pengguna','Aksi','Modul','ID Record','Detail'];
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);

  var rows = [
    [new Date('2025-03-01 09:15:00'),'admin@albarokah.com','Tambah Jamaah','Jamaah','JMH-1001','Nama: Ahmad Ridwan Santoso'],
    [new Date('2025-03-01 09:22:00'),'admin@albarokah.com','Tambah Jamaah','Jamaah','JMH-1002','Nama: Siti Nurhaliza Binti Ahmad'],
    [new Date('2025-03-03 10:00:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1001','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-03-03 10:05:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1003','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-03-05 08:30:00'),'admin@albarokah.com','Tambah Jamaah','Jamaah','JMH-1003','Nama: Budi Hartono Kusuma'],
    [new Date('2025-03-10 11:00:00'),'marketing@albarokah.com','Tambah Jamaah','Jamaah','JMH-1004','Nama: Dewi Rahayu Putri'],
    [new Date('2025-03-11 09:45:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1007','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-03-12 10:30:00'),'marketing@albarokah.com','Tambah Jamaah','Jamaah','JMH-1005','Nama: Hasan Maulana Akbar'],
    [new Date('2025-03-13 09:00:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1009','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-03-15 14:00:00'),'marketing@albarokah.com','Tambah Jamaah','Jamaah','JMH-1006','Nama: Fatimah Zahra Al-Anshari'],
    [new Date('2025-03-15 14:05:00'),'marketing@albarokah.com','Tambah Jamaah','Jamaah','JMH-1007','Nama: Umar Al-Anshari'],
    [new Date('2025-03-16 10:00:00'),'admin@albarokah.com','Tambah Add-On','AddOn','ADO-004','Add-on: Handling Bagasi VIP untuk JMH-1007'],
    [new Date('2025-03-20 16:00:00'),'admin@albarokah.com','Kirim Reminder WA','Pembayaran','INV-1011','Reminder ke 6281234100006'],
    [new Date('2025-03-20 16:01:00'),'admin@albarokah.com','Kirim Reminder WA','Pembayaran','INV-1012','Reminder ke 6281234100007'],
    [new Date('2025-04-01 09:00:00'),'marketing@albarokah.com','Tambah Jamaah','Jamaah','JMH-1008','Nama: Rizky Pratama Putra'],
    [new Date('2025-04-02 10:30:00'),'admin@albarokah.com','Tambah Add-On','AddOn','ADO-001','Add-on: Kursi Roda Airport untuk JMH-1008'],
    [new Date('2025-04-05 11:30:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1005','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-04-08 09:00:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1004','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-04-10 10:15:00'),'admin@albarokah.com','Tambah Jamaah','Jamaah','JMH-1009','Nama: Supriyadi Wibowo'],
    [new Date('2025-04-10 14:00:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1010','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-04-10 14:15:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1006','Bayar tunai di kantor'],
    [new Date('2025-04-11 09:00:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1014','Invoice dikonfirmasi manual oleh finance@albarokah.com'],
    [new Date('2025-04-12 10:00:00'),'marketing@albarokah.com','Tambah Jamaah','Jamaah','JMH-1010','Nama: Nurul Hidayah Binti Salam'],
    [new Date('2025-04-15 11:00:00'),'marketing@albarokah.com','Tambah Jamaah','Jamaah','JMH-1011','Nama: Agus Setiawan'],
    [new Date('2025-04-20 09:00:00'),'admin@albarokah.com','Kirim Reminder WA','Pembayaran','INV-1013','Reminder ke 6281234100008'],
    [new Date('2025-05-01 09:30:00'),'admin@albarokah.com','Tambah Jamaah','Jamaah','JMH-1012','Nama: Dr. Irfan Hakim Lubis'],
    [new Date('2025-05-02 10:00:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1018','DP VIP dikonfirmasi'],
    [new Date('2025-05-03 11:00:00'),'admin@albarokah.com','Tambah Add-On','AddOn','ADO-002','Add-on: Upgrade Kamar Single untuk JMH-1012'],
    [new Date('2025-05-03 11:05:00'),'admin@albarokah.com','Tambah Add-On','AddOn','ADO-005','Add-on: Upgrade Business Class untuk JMH-1012'],
    [new Date('2025-05-05 10:00:00'),'admin@albarokah.com','Tambah Jamaah','Jamaah','JMH-1013','Nama: Hj. Ratna Dewi Kurniawan'],
    [new Date('2025-05-05 10:30:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1019','Bayar langsung lunas'],
    [new Date('2025-05-06 09:00:00'),'finance@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1020','Pelunasan langsung'],
    [new Date('2025-05-06 09:15:00'),'admin@albarokah.com','Tambah Add-On','AddOn','ADO-003','Add-on: Extra Bagasi +10kg untuk JMH-1013'],
    [new Date('2025-05-08 10:00:00'),'admin@albarokah.com','Konfirmasi Pembayaran Manual','Pembayaran','INV-1002','Pelunasan PKT-002 Ahmad Ridwan'],
    [new Date('2025-06-01 09:00:00'),'admin@albarokah.com','Generate Manifest','Manifest','GRP-2025-04','Kloter Juli 2025 — Nyaman Plus — 6 jamaah'],
    [new Date('2025-06-01 09:10:00'),'admin@albarokah.com','WA Blast checklist','Jamaah','GRP-2025-04','Terkirim: 6 | Gagal: 0'],
    [new Date('2025-06-10 14:00:00'),'owner@albarokah.com','Tambah Pengguna','Pengguna','marketing2@albarokah.com','Role: Marketing'],
    [new Date('2025-06-12 11:30:00'),'admin@albarokah.com','Kirim Reminder WA','Pembayaran','INV-1013','Reminder ke-2 ke 6281234100008'],
  ];
  rows.forEach(function(r) { sh.appendRow(r); });
}
