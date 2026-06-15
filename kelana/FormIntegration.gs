/**
 * KELANA — FormIntegration.gs
 * ===========================
 * Integrasi Google Form → otomatis isi data jamaah.
 *
 * CARA SETUP:
 * 1. Buat Google Form → klik "Link to spreadsheet" → pilih spreadsheet Kelana ini
 *    (akan otomatis buat tab "Form Responses 1")
 * 2. Di Apps Script: Triggers (jam) → Add Trigger → pilih fungsi onFormSubmit
 *    → Event source: From spreadsheet → Event type: On form submit
 * 3. Authorize → selesai
 *
 * NAMA PERTANYAAN DI FORM (harus persis):
 *   "Nama Lengkap" → namaLengkap
 *   "NIK" → nik
 *   "No HP" → noHp
 *   "Email" (opsional) → email
 *   "Tanggal Lahir" (Date question) → tglLahir
 *   "Jenis Kelamin" (Multiple choice: Laki-laki / Perempuan) → jenisKelamin
 *   "Alamat" (Paragraph) → alamat
 *   "No Paspor" (opsional) → noPaspor
 *   "Paket yang Diminati" (Dropdown) → paket
 *   "Sumber Informasi" (Multiple choice) → sumberLead
 *   "Catatan" (Paragraph, opsional) → catatan
 */

var FORM_FIELD_MAP = {
  'Nama Lengkap': 'namaLengkap',
  'NIK': 'nik',
  'No HP': 'noHp',
  'No. HP': 'noHp',
  'Nomor HP': 'noHp',
  'Email': 'email',
  'Tanggal Lahir': 'tglLahir',
  'Jenis Kelamin': 'jenisKelamin',
  'Alamat': 'alamat',
  'No Paspor': 'noPaspor',
  'Nomor Paspor': 'noPaspor',
  'Paket': 'paket',
  'Paket yang Diminati': 'paket',
  'Sumber Informasi': 'sumberLead',
  'Catatan': 'catatan',
  'Kontak Darurat': 'kontakDarurat',
  'HP Darurat': 'hpDarurat',
  'Hubungan Darurat': 'hubunganDarurat'
};

function onFormSubmit(e) {
  try {
    var responses = e.namedValues; // {fieldName: [value]}
    var data = { sumberLead: 'Google Form', dibuatOleh: 'Form Otomatis' };

    Object.keys(FORM_FIELD_MAP).forEach(function(fieldName) {
      var key = FORM_FIELD_MAP[fieldName];
      if (responses[fieldName] && responses[fieldName][0]) {
        data[key] = responses[fieldName][0];
      }
    });

    if (!data.namaLengkap || !data.noHp) {
      Logger.log('Form submit: Nama atau No HP kosong, skip. Data: ' + JSON.stringify(data));
      return;
    }

    // Validasi NIK: harus 16 digit, jika bukan isi '0000000000000000' sebagai placeholder
    if (!data.nik || !/^\d{16}$/.test(data.nik)) {
      data.nik = '0000000000000000'; // placeholder, Admin perlu mengisi
    }

    var result = simpanJamaah(data);
    if (result && result.success) {
      logActivity_('Form Otomatis', 'Tambah Jamaah (Form)', 'Jamaah', result.idJamaah, 'Via Google Form: ' + data.namaLengkap);
      Logger.log('Form submit berhasil: ' + result.idJamaah + ' - ' + data.namaLengkap);
    } else {
      Logger.log('Form submit gagal: ' + (result ? result.error : 'null result'));
    }
  } catch(err) {
    Logger.log('onFormSubmit error: ' + err.message);
  }
}

/**
 * Test fungsi form submit secara manual (jalankan di editor untuk test).
 */
function testFormSubmit() {
  var testData = {
    namedValues: {
      'Nama Lengkap': ['Ahmad Fauzi Test'],
      'NIK': ['3201234567890001'],
      'No HP': ['081234567890'],
      'Email': ['ahmad@test.com'],
      'Jenis Kelamin': ['Laki-laki'],
      'Paket yang Diminati': ['Paket Hemat']
    }
  };
  onFormSubmit(testData);
  Logger.log('Test selesai. Cek sheet Jamaah.');
}
