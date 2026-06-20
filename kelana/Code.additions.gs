/**
 * KELANA — Code Additions
 * Tambahkan semua fungsi ini ke Code.gs yang sudah ada,
 * ATAU simpan sebagai file terpisah "CodeAdditions.gs" dalam project yang sama.
 *
 * Berisi: show functions untuk tiap modal + CRUD tambahan +
 *         WA Blast + Laporan Keuangan + helper pembayaran manual
 */

// ─── SHOW MODAL FUNCTIONS ─────────────────────────────────────────────────────

function showDashboard() {
  var html = HtmlService.createHtmlOutputFromFile('Dashboard')
    .setWidth(1060).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '📊 Dashboard Kelana');
}

function showTambahJamaah() {
  var html = HtmlService.createHtmlOutputFromFile('TambahJamaah')
    .setWidth(860).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '👤 Tambah Jamaah Baru');
}

function showDaftarJamaah() {
  var html = HtmlService.createHtmlOutputFromFile('DaftarJamaah')
    .setWidth(1100).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '📋 Daftar Jamaah');
}

function showPembayaran() {
  var html = HtmlService.createHtmlOutputFromFile('Pembayaran')
    .setWidth(1060).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '💳 Manajemen Pembayaran');
}

function showWaBlast() {
  var html = HtmlService.createHtmlOutputFromFile('WaBlast')
    .setWidth(900).setHeight(680);
  SpreadsheetApp.getUi().showModalDialog(html, '📲 WA Blast ke Jamaah');
}

// ─── PEMBAYARAN ───────────────────────────────────────────────────────────────

/**
 * Ambil semua data pembayaran / invoice.
 * Bisa difilter berdasarkan status: 'semua' | 'Pending' | 'Lunas' | 'Jatuh Tempo'
 */
function getPembayaranList(filterStatus) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pembayaran');
  if (!sh || sh.getLastRow() < 2) return [];

  // Kolom (0-indexed): 0:IDInvoice 1:IDJamaah 2:NamaJamaah 3:JenisBayar
  // 4:Nominal 5:Metode 6:Status 7:TglInvoice 8:TglBayar 9:TglJatuhTempo
  // 10:IDTrxXendit 11:LinkBayar 12:BuktiBayar 13:DikonfirmasiOleh 14:Catatan

  var today   = new Date();
  var results = [];

  sh.getDataRange().getValues().slice(1).forEach(function(r) {
    if (!r[0]) return;
    var status   = r[6] || 'Pending';
    var jatuhTempo = r[9] ? new Date(r[9]) : null;

    // Cek jatuh tempo — ubah status display jika sudah lewat
    var statusDisplay = status;
    if (status !== 'Lunas' && jatuhTempo && jatuhTempo < today) {
      statusDisplay = 'Jatuh Tempo';
    }

    if (filterStatus && filterStatus !== 'Semua' && statusDisplay !== filterStatus) return;

    results.push({
      idInvoice:   r[0], idJamaah:    r[1],
      namaJamaah:  r[2], jenisBayar:  r[3],
      nominal:     r[4], metode:      r[5] || '',
      status:      statusDisplay,
      tglInvoice:  formatTanggal_(r[7]),
      tglBayar:    r[8] ? new Date(r[8]).toISOString() : '',
      tglJatuhTempo: formatTanggal_(r[9]),
      linkBayar:   r[11] || '',
      buktiBayar:  r[12] || '', dikonfirmasiOleh: r[13] || '',
      catatan:     r[14] || ''
    });
  });

  // Urutkan: Jatuh Tempo & Pending dulu
  var priority = { 'Jatuh Tempo': 0, 'Pending': 1, 'Lunas': 2 };
  results.sort(function(a, b) {
    return (priority[a.status] || 1) - (priority[b.status] || 1);
  });

  return results;
}

/**
 * Daftar pembayaran dengan PAGINASI + PENCARIAN + FILTER status di sisi server.
 * @param {{search,filterStatus,page,perPage}} opts
 * @returns {{rows:Object[], total:number, page:number, perPage:number, pages:number}}
 */
function getPembayaranPage(opts) {
  opts = opts || {};
  var perPage = Math.min(Math.max(parseInt(opts.perPage) || 20, 1), 100);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pembayaran');
  if (!sh || sh.getLastRow() < 2) return { rows: [], total: 0, page: 1, perPage: perPage, pages: 0 };

  var today = new Date();
  var q = String(opts.search || '').toLowerCase().trim();
  var filterStatus = opts.filterStatus || '';

  var rows = sh.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0]; })
    .map(function(r) {
      var status = r[6] || 'Pending';
      var jt = r[9] ? new Date(r[9]) : null;
      if (status !== 'Lunas' && jt && jt < today) status = 'Jatuh Tempo';
      return {
        idInvoice: r[0], idJamaah: r[1], namaJamaah: r[2], jenisBayar: r[3],
        nominal: r[4], metode: r[5] || '', status: status,
        tglInvoice: formatTanggal_(r[7]),
        // tglBayar dikirim ISO (mengandung jam) agar frontend bisa tampil tanggal + jam
        tglBayar: r[8] ? new Date(r[8]).toISOString() : '',
        tglJatuhTempo: formatTanggal_(r[9]), linkBayar: r[11] || '',
        buktiBayar: r[12] || '', dikonfirmasiOleh: r[13] || '', catatan: r[14] || ''
      };
    })
    .filter(function(p) {
      if (filterStatus && filterStatus !== 'Semua' && p.status !== filterStatus) return false;
      if (q) {
        var blob = (String(p.namaJamaah||'')+' '+String(p.idInvoice||'')+' '+String(p.idJamaah||'')).toLowerCase();
        if (blob.indexOf(q) < 0) return false;
      }
      return true;
    });

  var priority = { 'Jatuh Tempo': 0, 'Pending': 1, 'Lunas': 2 };
  rows.sort(function(a, b) { return (priority[a.status]||1) - (priority[b.status]||1); });

  var total = rows.length;
  var pages = Math.max(1, Math.ceil(total / perPage));
  var page  = Math.min(Math.max(parseInt(opts.page) || 1, 1), pages);
  var start = (page - 1) * perPage;
  return { rows: rows.slice(start, start + perPage), total: total, page: page, perPage: perPage, pages: pages };
}

/**
 * Detail satu invoice: data lengkap + jamaah + ringkasan booking + riwayat
 * pembayaran jamaah ybs (untuk drawer detail di halaman Pembayaran).
 */
function getPembayaranDetail(idInvoice) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shP = ss.getSheetByName('Pembayaran');
  if (!shP || shP.getLastRow() < 2) return null;
  var rows = shP.getDataRange().getValues();
  var inv = null, idJamaah = '';
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(idInvoice)) {
      var r = rows[i];
      idJamaah = r[1];
      inv = {
        idInvoice: r[0], idJamaah: r[1], namaJamaah: r[2], jenisBayar: r[3],
        nominal: parseFloat(r[4]) || 0, metode: r[5] || '', status: r[6] || 'Pending',
        tglInvoice: r[7] ? new Date(r[7]).toISOString() : '',
        tglBayar: r[8] ? new Date(r[8]).toISOString() : '',
        tglJatuhTempo: r[9] ? new Date(r[9]).toISOString() : '',
        linkBayar: r[11] || '', buktiBayar: r[12] || '',
        dikonfirmasiOleh: r[13] || '', catatan: r[14] || ''
      };
      break;
    }
  }
  if (!inv) return null;

  // Riwayat semua invoice jamaah ini (timeline pembayaran)
  var riwayat = rows.slice(1).filter(function(x) { return x[0] && String(x[1]) === String(idJamaah); })
    .map(function(x) {
      var st = String(x[6] || 'Pending');
      var jt = x[9] ? new Date(x[9]) : null;
      if (st !== 'Lunas' && jt && jt < new Date()) st = 'Jatuh Tempo';
      return {
        idInvoice: x[0], jenisBayar: x[3], nominal: parseFloat(x[4]) || 0, status: st,
        tglInvoice: x[7] ? new Date(x[7]).toISOString() : '',
        tglBayar: x[8] ? new Date(x[8]).toISOString() : ''
      };
    });

  return { invoice: inv, booking: getBookingSummary_(idJamaah), riwayat: riwayat };
}

/**
 * Konfirmasi pembayaran secara manual (untuk transfer bank / bukti manual).
 */
function konfirmasiPembayaranManual(idInvoice, metodeBayar, catatan, buktiBayarUrl) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Pembayaran');
    if (!sh) return { success: false, error: 'Sheet Pembayaran tidak ditemukan.' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(idInvoice)) continue;

      // Kolom: G(7)=Status I(9)=TglBayar F(6)=Metode M(13)=Bukti N(14)=Dikonfirmasi O(15)=Catatan
      sh.getRange(i + 1, 7).setValue('Lunas');
      sh.getRange(i + 1, 9).setValue(new Date());
      if (metodeBayar) sh.getRange(i + 1, 6).setValue(metodeBayar);
      if (buktiBayarUrl) sh.getRange(i + 1, 13).setValue(buktiBayarUrl);
      sh.getRange(i + 1, 14).setValue(Session.getActiveUser().getEmail() || 'Admin');
      if (catatan) sh.getRange(i + 1, 15).setValue(catatan);

      logActivity_('Admin', 'Konfirmasi Pembayaran Manual', 'Pembayaran', idInvoice,
        'Invoice dikonfirmasi manual oleh ' + Session.getActiveUser().getEmail());

      // Kirim WA konfirmasi
      var idJamaah   = data[i][1];
      var namaJamaah = data[i][2];
      var jenisBayar = data[i][3];
      var nominal    = data[i][4];
      var jamaah     = getJamaahById_(idJamaah);
      if (jamaah && jamaah.noHp) {
        var tgl   = new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });
        var msg   = '✅ *Pembayaran Dikonfirmasi*\n\nHalo *' + namaJamaah + '*,\n' +
          'Pembayaran Anda telah kami konfirmasi.\n\n' +
          '📋 *Detail:*\n• Invoice : ' + idInvoice +
          '\n• Jenis   : ' + jenisBayar +
          '\n• Nominal : Rp ' + formatRupiah_(nominal) +
          '\n• Tanggal : ' + tgl +
          '\n\nSemoga perjalanan umroh Anda penuh berkah. 🕌\n\n_' +
          (getConfig_('NAMA_TRAVEL') || 'Kelana') + '_';
        kirimWA_(jamaah.noHp, msg);
      }

      // Perbarui status pembayaran jamaah (Belum Bayar / DP Lunas / Lunas)
      // berdasarkan total invoice yang sudah Lunas vs total tagihan booking.
      recomputeStatusBayarJamaah_(idJamaah);

      // Setelah DP dikonfirmasi, otomatis buatkan tagihan PELUNASAN beserta
      // jatuh temponya (jika belum ada & jamaah belum lunas).
      var pelunasanInfo = null;
      if (String(jenisBayar).indexOf('DP') !== -1) {
        try {
          var pel = generateInvoicePelunasan(idJamaah);
          if (pel && pel.success) pelunasanInfo = pel;
        } catch (e2) {}
      }

      return { success: true, namaJamaah: namaJamaah, pelunasan: pelunasanInfo };
    }
    return { success: false, error: 'Invoice ' + idInvoice + ' tidak ditemukan.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Set kolom Status Pembayaran (kolom 18 / 0-idx 17) di sheet Jamaah.
 */
function setJamaahStatusBayar_(idJamaah, status) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!sh || sh.getLastRow() < 2) return;
  var ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(idJamaah)) {
      sh.getRange(i + 2, 18).setValue(status);
      return;
    }
  }
}

/**
 * Hitung ulang status pembayaran jamaah dari data invoice:
 *  - Lunas       : total invoice Lunas >= total tagihan booking
 *  - DP Lunas    : sudah ada pembayaran Lunas tapi belum penuh
 *  - Belum Bayar : belum ada pembayaran Lunas
 * Mengembalikan status yang ditulis.
 */
function recomputeStatusBayarJamaah_(idJamaah) {
  try {
    var shP = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pembayaran');
    var sumLunas = 0;
    if (shP && shP.getLastRow() > 1) {
      shP.getDataRange().getValues().slice(1).forEach(function(r) {
        if (String(r[1]) !== String(idJamaah)) return;
        if (String(r[6]) === 'Lunas') sumLunas += parseFloat(r[4]) || 0;
      });
    }
    var total  = hitungTotalBookingJamaah_(idJamaah) || 0;
    var status;
    if (total > 0 && sumLunas >= total) status = 'Lunas';
    else if (sumLunas > 0)              status = 'DP Lunas';
    else                                status = 'Belum Bayar';
    setJamaahStatusBayar_(idJamaah, status);
    return status;
  } catch (e) { return ''; }
}

/**
 * Generate invoice pelunasan untuk jamaah.
 */
function generateInvoicePelunasan(idJamaah) {
  try {
    var jamaah = getJamaahById_(idJamaah);
    if (!jamaah) return { success: false, error: 'Jamaah tidak ditemukan.' };

    var paket = getPaketById_(jamaah.idPaket || jamaah.paket);
    if (!paket) return { success: false, error: 'Paket tidak ditemukan. Pastikan jamaah sudah memiliki paket.' };

    // Cek apakah sudah ada invoice pelunasan
    var ss  = SpreadsheetApp.getActiveSpreadsheet();
    var shP = ss.getSheetByName('Pembayaran');
    if (shP && shP.getLastRow() > 1) {
      var existing = shP.getDataRange().getValues().slice(1);
      for (var i = 0; i < existing.length; i++) {
        if (String(existing[i][1]) === String(idJamaah) &&
            String(existing[i][3]).indexOf('Pelunasan') !== -1 &&
            String(existing[i][6]) !== 'Lunas') {
          return { success: false, error: 'Invoice pelunasan sudah ada: ' + existing[i][0] };
        }
      }
    }

    // Total booking = harga kamar (tipe & kategori) + total add-on/upgrade, sehingga
    // add-on otomatis ikut tertagih di pelunasan (sisa = total − total sudah dibayar).
    var totalHarga = hitungTotalBookingJamaah_(idJamaah);
    if (totalHarga <= 0) totalHarga = parseFloat(paket.harga || 0);

    // Sisa = total harga − total yang SUDAH dibayar (Lunas), bukan asumsi persentase DP.
    var totalSudahBayar = 0;
    if (shP && shP.getLastRow() > 1) {
      shP.getDataRange().getValues().slice(1).forEach(function(r) {
        if (String(r[1]) === String(idJamaah) && String(r[6]) === 'Lunas') {
          totalSudahBayar += parseFloat(r[4]) || 0;
        }
      });
    }
    var sisaBayar = Math.max(totalHarga - totalSudahBayar, 0);
    if (sisaBayar <= 0) return { success: false, error: 'Jamaah ini sudah lunas. Tidak ada sisa pembayaran.' };

    var batasHari    = parseInt(getConfig_('BATAS_PELUNASAN_HARI') || 45);
    var group        = jamaah.idGroup ? getGroupById_(jamaah.idGroup) : null;
    var tglJatuhTempo = new Date();
    if (group && group.tglBerangkat) {
      tglJatuhTempo = new Date(group.tglBerangkat);
      tglJatuhTempo.setDate(tglJatuhTempo.getDate() - batasHari);
    }

    var invoice = generateInvoice_(idJamaah, jamaah.namaLengkap || jamaah.nama,
      'Pelunasan', sisaBayar, tglJatuhTempo);

    return { success: true, idInvoice: invoice.idInvoice, nominal: sisaBayar };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Kirim ulang WA reminder ke jamaah untuk invoice tertentu.
 */
/**
 * Buat teks pesan WA reminder tanpa mengirim — untuk preview/edit di frontend.
 */
function getReminderWAText(idInvoice) {
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pembayaran');
    if (!sh) return { success: false, error: 'Sheet tidak ditemukan.' };
    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(idInvoice)) continue;
      var namaJamaah = data[i][2];
      var jenisBayar = data[i][3];
      var nominal    = data[i][4];
      var jatuhTempo = data[i][9] ? formatTanggal_(data[i][9]) : '—';
      var linkBayar  = data[i][11] || '';
      var msg = '🔔 *Reminder Pembayaran*\n\nHalo *' + namaJamaah + '*,\n' +
        'Berikut reminder pembayaran Anda:\n\n' +
        '📋 *Detail Invoice:*\n• Invoice  : ' + idInvoice +
        '\n• Jenis    : ' + jenisBayar +
        '\n• Nominal  : Rp ' + formatRupiah_(nominal) +
        '\n• Jatuh Tempo : ' + jatuhTempo +
        (linkBayar ? '\n\n💳 *Link Bayar:*\n' + linkBayar : '') +
        '\n\nMohon segera lakukan pembayaran sebelum jatuh tempo.\n\n_' +
        (getConfig_('NAMA_TRAVEL') || 'Kelana') + '_';
      return { success: true, text: msg };
    }
    return { success: false, error: 'Invoice tidak ditemukan.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function kirimReminderWA(idInvoice, customMsg) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Pembayaran');
    if (!sh) return { success: false, error: 'Sheet tidak ditemukan.' };

    var data = sh.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) !== String(idInvoice)) continue;
      if (data[i][6] === 'Lunas') return { success: false, error: 'Invoice ini sudah lunas.' };

      var idJamaah   = data[i][1];
      var namaJamaah = data[i][2];
      var jenisBayar = data[i][3];
      var nominal    = data[i][4];
      var jatuhTempo = data[i][9] ? formatTanggal_(data[i][9]) : '—';
      var linkBayar  = data[i][11] || '';

      var jamaah = getJamaahById_(idJamaah);
      if (!jamaah || !jamaah.noHp) return { success: false, error: 'No. HP jamaah tidak ditemukan.' };

      var msg = customMsg || ('🔔 *Reminder Pembayaran*\n\nHalo *' + namaJamaah + '*,\n' +
        'Berikut reminder pembayaran Anda:\n\n' +
        '📋 *Detail Invoice:*\n• Invoice  : ' + idInvoice +
        '\n• Jenis    : ' + jenisBayar +
        '\n• Nominal  : Rp ' + formatRupiah_(nominal) +
        '\n• Jatuh Tempo : ' + jatuhTempo +
        (linkBayar ? '\n\n💳 *Link Bayar:*\n' + linkBayar : '') +
        '\n\nMohon segera lakukan pembayaran sebelum jatuh tempo.\n\n_' +
        (getConfig_('NAMA_TRAVEL') || 'Kelana') + '_');

      kirimWA_(jamaah.noHp, msg);
      logActivity_(getCurrentUser_() || 'Admin', 'Kirim Reminder WA', 'Pembayaran', idInvoice, 'Reminder ke ' + jamaah.noHp);
      return { success: true, noHp: jamaah.noHp };
    }
    return { success: false, error: 'Invoice tidak ditemukan.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── JAMAAH CRUD TAMBAHAN ────────────────────────────────────────────────────

/**
 * Update data jamaah yang sudah ada.
 */
function updateJamaah(data) {
  try {
    var verr = validateJamaahData_(data, 'update');
    if (verr) return { success: false, error: verr };

    if (data.nik && nikSudahDipakai_(data.nik, data.idJamaah)) {
      return { success: false, error: 'NIK sudah terdaftar atas nama lain.' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Jamaah');
    if (!sh) return { success: false, error: 'Sheet Jamaah tidak ditemukan.' };

    // "Buat keluarga baru" dari form individual → generate ID keluarga baru.
    if (data.idKeluarga === '__NEW__') data.idKeluarga = 'KLG-' + new Date().getTime();

    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) !== String(data.idJamaah)) continue;

      var cols = {
        namaLengkap:     2,  nik:              3,  noPaspor:       4,
        tglLahir:        5,  jenisKelamin:     6,  alamat:         7,
        noHp:            8,  email:            9,  kontakDarurat: 10,
        hpDarurat:      11,  hubunganDarurat: 12,  kondisiKesehatan:13,
        statusVaksin:   14,  paket:           15,  idGroup:        16,
        statusDokumen:  17,  statusPembayaran:18,  idKeluarga:     19,
        sumberLead:     20,  catatan:         21,  tipeKamar:      25,
        kategoriJamaah: 26,
        // ── Field SISKOPATUH (1-based kolom sheet) ──
        tempatLahir:     27, namaAyah:         28, statusPerkawinan:29,
        pekerjaan:       30, pendidikan:       31, provinsi:        32,
        kabupaten:       33, kecamatan:        34, kelurahan:       35,
        kodePos:         36, kewarganegaraan:  37, namaMahram:      38,
        hubunganMahram:  39, embarkasi:        40, golonganDarah:   41,
        tempatTerbitPaspor: 42, hubunganKeluarga: 43
      };

      Object.keys(cols).forEach(function(key) {
        if (data[key] !== undefined) {
          var colIdx = cols[key]; // 1-based: +1 for sheet
          sh.getRange(i + 1, colIdx).setValue(
            key === 'tglLahir' && data[key] ? new Date(data[key]) : data[key]
          );
        }
      });

      // PIC ditangani khusus agar tetap tunggal per keluarga.
      if (data.isPIC === true && data.idKeluarga) {
        setPicKeluarga_(data.idKeluarga, data.idJamaah);
      }

      logActivity_('Admin', 'Update Jamaah', 'Jamaah', data.idJamaah,
        'Update data jamaah: ' + data.namaLengkap);
      return { success: true, idKeluarga: data.idKeluarga || '' };
    }
    return { success: false, error: 'Jamaah tidak ditemukan.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Hapus jamaah dan semua data terkait (Dokumen, Roomlist).
 */
function hapusJamaah(idJamaah) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var shJ   = ss.getSheetByName('Jamaah');
    if (!shJ) return { success: false, error: 'Sheet tidak ditemukan.' };

    var nama  = '';
    var rows  = shJ.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === String(idJamaah)) {
        nama = rows[i][1];
        shJ.deleteRow(i + 1);
        break;
      }
    }
    if (!nama) return { success: false, error: 'Jamaah tidak ditemukan.' };

    logActivity_('Admin', 'Hapus Jamaah', 'Jamaah', idJamaah, 'Hapus: ' + nama);
    return { success: true, nama: nama };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── LAPORAN KEUANGAN ────────────────────────────────────────────────────────

/**
 * Ringkasan keuangan per group atau keseluruhan.
 * @param {string} [idGroup] — kosong = semua group
 */
function getLaporanKeuangan(idGroup) {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var shP = ss.getSheetByName('Pembayaran');
  if (!shP || shP.getLastRow() < 2) return { total: 0, lunas: 0, pending: 0, rows: [] };

  var shJ = ss.getSheetByName('Jamaah');
  var jamaahGroupMap = {};
  if (shJ && shJ.getLastRow() > 1) {
    shJ.getDataRange().getValues().slice(1).forEach(function(r) {
      if (r[0]) jamaahGroupMap[String(r[0])] = String(r[15]);
    });
  }

  var today = new Date();
  var bulanIni = today.getMonth(), tahunIni = today.getFullYear();
  var totalTagihan = 0, totalLunas = 0, totalPending = 0, totalJatuhTempo = 0;
  var overdueCount = 0, bulanIniDiterima = 0;
  var rows = [];

  shP.getDataRange().getValues().slice(1).forEach(function(r) {
    if (!r[0]) return;
    var gId = jamaahGroupMap[String(r[1])] || '';
    if (idGroup && gId !== String(idGroup)) return;

    var nominal = parseFloat(r[4]) || 0;
    var status  = String(r[6] || 'Pending');
    var jt      = r[9] ? new Date(r[9]) : null;
    if (status !== 'Lunas' && jt && jt < today) status = 'Jatuh Tempo';

    totalTagihan += nominal;
    if (status === 'Lunas') {
      totalLunas += nominal;
      var tb = r[8] ? new Date(r[8]) : null;
      if (tb && tb.getMonth() === bulanIni && tb.getFullYear() === tahunIni) bulanIniDiterima += nominal;
    } else if (status === 'Jatuh Tempo') {
      totalJatuhTempo += nominal; overdueCount++;
    } else {
      totalPending += nominal;
    }

    rows.push({
      idInvoice:   r[0], namaJamaah:  r[2], jenisBayar:  r[3],
      nominal:     nominal, status:   status,
      tglJatuhTempo: formatTanggal_(r[9])
    });
  });

  return {
    totalTagihan:   totalTagihan,
    totalLunas:     totalLunas,
    totalPending:   totalPending,
    totalJatuhTempo:totalJatuhTempo,
    totalOutstanding: totalPending + totalJatuhTempo,
    overdueCount:   overdueCount,
    bulanIniDiterima: bulanIniDiterima,
    pctLunas:       totalTagihan > 0 ? Math.round(totalLunas / totalTagihan * 100) : 0,
    rows:           rows
  };
}

// ─── WA BLAST ────────────────────────────────────────────────────────────────

var WA_TEMPLATES = {
  manasik: function(namaJamaah, namaGroup, tglBerangkat, namaTravel) {
    return '🕌 *Undangan Manasik Umroh*\n\nAssalamualaikum *' + namaJamaah + '*,\n\n' +
      'Anda terdaftar pada group *' + namaGroup + '* (berangkat ' + tglBerangkat + ').\n\n' +
      'Mohon hadir pada acara *MANASIK UMROH* yang akan segera kami informasikan.\n\n' +
      'Harap siapkan dokumen yang diperlukan.\n\n_' + namaTravel + '_';
  },
  checklist: function(namaJamaah, namaGroup, tglBerangkat, namaTravel) {
    return '✅ *Checklist Persiapan Umroh*\n\nHalo *' + namaJamaah + '*,\n\n' +
      'Keberangkatan Group *' + namaGroup + '* sudah semakin dekat (' + tglBerangkat + ')!\n\n' +
      '📦 *Yang perlu disiapkan:*\n' +
      '□ Paspor & Visa\n□ Buku Vaksin\n□ Koper (max 32kg)\n' +
      '□ Pakaian ihram\n□ Sandal jepit\n□ Obat-obatan pribadi\n' +
      '□ Uang SAR secukupnya\n□ Charger & adapter\n\n' +
      'Info jadwal lengkap akan segera dikirimkan.\n\n_' + namaTravel + '_';
  },
  kumpul: function(namaJamaah, namaGroup, tglBerangkat, noFlight, jamKumpul, lokasiKumpul, pembimbing, namaTravel) {
    return '✈ *Informasi Keberangkatan*\n\nHalo *' + namaJamaah + '*,\n\n' +
      'Besok Anda berangkat umroh! Alhamdulillah 🎉\n\n' +
      '📋 *Detail Keberangkatan:*\n' +
      '• Group   : ' + namaGroup + '\n' +
      '• Tanggal : ' + tglBerangkat + '\n' +
      '• Flight  : ' + (noFlight || '—') + '\n' +
      '• Jam Kumpul : ' + (jamKumpul || '—') + '\n' +
      '• Lokasi  : ' + (lokasiKumpul || '—') + '\n' +
      '• Pembimbing : ' + (pembimbing || '—') + '\n\n' +
      'Mohon hadir tepat waktu. Semoga menjadi umroh yang mabrur! 🕌\n\n' +
      '_' + namaTravel + '_';
  }
};

/**
 * Kirim WA blast ke semua jamaah dalam sebuah group.
 * @param {{
 *   idGroup: string,
 *   template: 'manasik' | 'checklist' | 'kumpul',
 *   jamKumpul?: string,
 *   lokasiKumpul?: string
 * }} params
 */
function kirimWABlast(params) {
  try {
    var ss     = SpreadsheetApp.getActiveSpreadsheet();
    var shJ    = ss.getSheetByName('Jamaah');
    var shG    = ss.getSheetByName('Group');
    if (!shJ || !shG) return { success: false, error: 'Sheet tidak ditemukan.' };

    var group  = getGroupById_(params.idGroup);
    if (!group) return { success: false, error: 'Group tidak ditemukan.' };

    var namaTravel  = getConfig_('NAMA_TRAVEL') || 'Kelana Travel';
    var tglBerangkat = group.tglBerangkat ? formatTanggal_(group.tglBerangkat) : '—';
    var noFlight     = group.noFlightPergi || '';
    var pembimbing   = group.pembimbing    || '';

    var jamaahList = shJ.getDataRange().getValues().slice(1)
      .filter(function(r) { return r[0] && String(r[15]) === String(params.idGroup); });

    if (!jamaahList.length) return { success: false, error: 'Tidak ada jamaah di group ini.' };

    var berhasil = 0, gagal = 0;
    jamaahList.forEach(function(r) {
      var noHp      = String(r[7] || '');
      var namaJamaah = String(r[1] || '');
      if (!noHp) { gagal++; return; }

      var msg;
      if (params.template === 'manasik') {
        msg = WA_TEMPLATES.manasik(namaJamaah, group.namaGroup, tglBerangkat, namaTravel);
      } else if (params.template === 'checklist') {
        msg = WA_TEMPLATES.checklist(namaJamaah, group.namaGroup, tglBerangkat, namaTravel);
      } else {
        msg = WA_TEMPLATES.kumpul(namaJamaah, group.namaGroup, tglBerangkat, noFlight,
          params.jamKumpul, params.lokasiKumpul, pembimbing, namaTravel);
      }

      try { kirimWA_(noHp, msg); berhasil++; }
      catch(e2) { gagal++; }
    });

    logActivity_('Admin', 'WA Blast ' + params.template, 'Jamaah', params.idGroup,
      'Terkirim: ' + berhasil + ' | Gagal: ' + gagal);

    return { success: true, berhasil: berhasil, gagal: gagal, total: jamaahList.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── HELPERS TAMBAHAN ────────────────────────────────────────────────────────

function getGroupById_(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Group');
  if (!sh || sh.getLastRow() < 2) return null;
  var isNewSchema = sh.getLastColumn() >= 20; // skema 23-kolom
  var rows = sh.getDataRange().getValues().slice(1);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === String(idGroup)) {
      var r = rows[i];
      if (isNewSchema) {
        return {
          idGroup:       r[0],  namaGroup:     r[1],
          tglBerangkat:  r[2],  tglPulang:     r[3],
          maskapai:      r[4],  asal:          r[5],
          noFlightPergi: r[7],  noFlightPulang:r[10],
          hotelMadinah:  r[12], hotelMakkah:   r[13], hotelTransit: r[14],
          kapasitas:     r[18], terisi:        r[19], statusGroup:  r[20],
          pembimbing:    r[21], catatan:       r[22]
        };
      }
      // backward compat: skema lama 14-kolom
      return {
        idGroup:       r[0],  namaGroup:     r[1],
        tglBerangkat:  r[2],  tglPulang:     r[3],
        maskapai:      r[4],  noFlightPergi: r[5],
        noFlightPulang:r[6],  hotelMadinah:  r[7],
        hotelMakkah:   r[8],  kapasitas:     r[9],
        terisi:        r[10], statusGroup:   r[11],
        pembimbing:    r[12], catatan:       r[13]
      };
    }
  }
  return null;
}

/**
 * Versi publik (non-private) dari getJamaahById_
 * yang bisa dipanggil dari HTML (nama tanpa underscore).
 */
function getJamaahDetail(idJamaah) {
  return getJamaahById_(idJamaah) || null;
}

// ─── REMINDER OTOMATIS (digest harian ke Owner) ──────────────────────────────

/**
 * Pasang trigger harian untuk reminderHarian_. Jalankan sekali (otomatis di setupAwal).
 */
function setupReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'reminderHarian_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('reminderHarian_').timeBased().everyDays(1).atHour(7).create();
}

/**
 * Susun & kirim email digest harian ke EMAIL_TRAVEL berisi hal yang perlu perhatian:
 * paspor mau/sudah kadaluarsa (≤90 hari), tagihan jatuh tempo (≤3 hari/lewat),
 * dan kloter berangkat ≤30 hari dengan dokumen belum lengkap.
 */
function reminderHarian_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var today = new Date(); var H = 24 * 60 * 60 * 1000;
    var shJ = ss.getSheetByName('Jamaah');
    var shD = ss.getSheetByName('Dokumen');
    var shP = ss.getSheetByName('Pembayaran');
    var shG = ss.getSheetByName('Group');

    var jmap = {};
    if (shJ && shJ.getLastRow() > 1) shJ.getDataRange().getValues().slice(1).forEach(function(r) {
      if (r[0]) jmap[String(r[0])] = { nama: r[1], noHp: r[7], idGroup: String(r[15]) };
    });

    var dokStatus = {};
    var paspor = [];
    if (shD && shD.getLastRow() > 1) shD.getDataRange().getValues().slice(1).forEach(function(d) {
      if (!d[1]) return;
      dokStatus[String(d[1])] = d[17];
      var exp = d[8] ? new Date(d[8]) : null;
      if (exp && !isNaN(exp.getTime())) {
        var days = Math.floor((exp - today) / H);
        if (days <= 90) {
          var j = jmap[String(d[1])] || {};
          paspor.push({ nama: j.nama || d[2] || d[1], days: days, exp: exp });
        }
      }
    });
    paspor.sort(function(a, b) { return a.days - b.days; });

    var tagihan = [];
    if (shP && shP.getLastRow() > 1) shP.getDataRange().getValues().slice(1).forEach(function(r) {
      if (!r[0] || String(r[6]) === 'Lunas') return;
      var jt = r[9] ? new Date(r[9]) : null;
      if (!jt || isNaN(jt.getTime())) return;
      var days = Math.floor((jt - today) / H);
      if (days <= 3) tagihan.push({ nama: r[2], nominal: r[4], jt: jt, days: days, inv: r[0] });
    });
    tagihan.sort(function(a, b) { return a.days - b.days; });

    var kloterKurang = [];
    if (shG && shG.getLastRow() > 1) shG.getDataRange().getValues().slice(1).forEach(function(g) {
      if (!g[0]) return;
      var berangkat = g[2] ? new Date(g[2]) : null;
      if (!berangkat || isNaN(berangkat.getTime())) return;
      var days = Math.floor((berangkat - today) / H);
      if (days < 0 || days > 30) return;
      var total = 0, belum = 0;
      Object.keys(jmap).forEach(function(id) {
        if (jmap[id].idGroup === String(g[0])) { total++; if (String(dokStatus[id] || '') !== 'Lengkap') belum++; }
      });
      if (belum > 0) kloterKurang.push({ nama: g[1], days: days, belum: belum, total: total });
    });

    if (!paspor.length && !tagihan.length && !kloterKurang.length) return;

    var email = getConfig_('EMAIL_TRAVEL');
    if (!email) return;
    var namaTravel = getConfig_('NAMA_TRAVEL') || 'Kelana';

    function sec(title, items) {
      if (!items.length) return '';
      return '<h3 style="margin:16px 0 6px;color:#4f46e5">' + title + ' (' + items.length + ')</h3><ul>' +
        items.map(function(t){ return '<li>' + t + '</li>'; }).join('') + '</ul>';
    }
    var html = '<div style="font-family:Arial,sans-serif;font-size:13px;color:#1a1a2e">'
      + '<h2>🔔 Pengingat Harian — ' + namaTravel + '</h2>'
      + '<p style="color:#6b7280">' + today.toLocaleDateString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}) + '</p>'
      + sec('🛂 Paspor perlu perhatian', paspor.map(function(p){
          return '<b>' + esc_(p.nama) + '</b> — paspor ' + (p.days < 0 ? 'SUDAH kadaluarsa' : 'berlaku ' + p.days + ' hari lagi') +
            ' (' + formatTanggal_(p.exp) + ')';
        }))
      + sec('💳 Tagihan jatuh tempo', tagihan.map(function(t){
          return '<b>' + esc_(t.nama) + '</b> — Rp ' + formatRupiah_(t.nominal) + ' ' +
            (t.days < 0 ? 'LEWAT tempo ' + Math.abs(t.days) + ' hari' : t.days === 0 ? 'jatuh tempo HARI INI' : 'jatuh tempo ' + t.days + ' hari lagi') +
            ' (' + esc_(t.inv) + ')';
        }))
      + sec('📋 Kloter dekat berangkat, dokumen belum lengkap', kloterKurang.map(function(k){
          return '<b>' + esc_(k.nama) + '</b> — berangkat ' + k.days + ' hari lagi, ' + k.belum + '/' + k.total + ' jamaah dokumen belum lengkap';
        }))
      + '<p style="margin-top:18px;color:#9ca3af;font-size:11px">Email otomatis dari Kelana. Buka aplikasi untuk menindaklanjuti.</p></div>';

    var subj = '[Kelana] Pengingat Harian: ' + (paspor.length + tagihan.length + kloterKurang.length) + ' hal perlu perhatian';
    GmailApp.sendEmail(email, subj, 'Buka email versi HTML untuk detail.', { htmlBody: html, name: 'Kelana' });
    logActivity_('System', 'Reminder Harian', 'Sistem', '',
      paspor.length + ' paspor, ' + tagihan.length + ' tagihan, ' + kloterKurang.length + ' kloter');
  } catch (e) {
    Logger.log('reminderHarian_ error: ' + e.message);
  }
}

/**
 * Duplikasi kloter: salin baris Group dengan ID baru, reset tanggal & terisi.
 */
function duplikasiGroup(idGroup) {
  if (!idGroup) return { success: false, error: 'ID group wajib diisi.' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Group');
  if (!sh || sh.getLastRow() < 2) return { success: false, error: 'Sheet Group tidak ditemukan.' };
  var rows = sh.getDataRange().getValues();
  var idx = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idGroup) { idx = i; break; }
  }
  if (idx === -1) return { success: false, error: 'Group tidak ditemukan.' };
  var src = rows[idx].slice();
  src[0] = Utilities.getUuid();                     // idGroup baru
  src[1] = (src[1] || '') + ' (Salinan)';           // namaGroup
  src[2] = '';                                        // tglBerangkat
  src[3] = '';                                        // tglPulang
  src[19] = 0;                                        // terisi
  src[20] = 'Draft';                                  // statusGroup
  sh.appendRow(src);
  return { success: true, idGroup: src[0], namaGroup: src[1] };
}

// Field petugas (urutan kolom, 0-indexed) — dipakai getPetugasList & simpanPetugas.
// Pembacaan/penulisan berbasis INDEKS, tidak tergantung teks header, agar header
// boleh memakai label ramah ("Nama Lengkap") tanpa merusak logika.
var PETUGAS_FIELDS_ = [
  'idPetugas', 'idGroup', 'namaLengkap', 'peran',
  'noTelepon', 'email', 'noKTP', 'noPaspor',
  'masaBerlakuPaspor', 'tempatLahir', 'tanggalLahir', 'jenisKelamin',
  'alamat', 'catatan', 'createdAt', 'updatedAt',
  'kewarganegaraan', 'tglTerbitPaspor'
];
// Header tampilan (Title Case) sesuai urutan PETUGAS_FIELDS_.
var PETUGAS_HEADERS_ = [
  'ID Petugas', 'ID Group', 'Nama Lengkap', 'Peran',
  'No Telepon', 'Email', 'No KTP', 'No Paspor',
  'Masa Berlaku Paspor', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin',
  'Alamat', 'Catatan', 'Tgl Dibuat', 'Tgl Update',
  'Kewarganegaraan', 'Tgl Terbit Paspor'
];

/**
 * Migrasi sheet "Petugas": buat bila belum ada, normalkan header ke label ramah,
 * dan pastikan 18 kolom. Idempoten — aman dipanggil berulang.
 */
function migratePetugasSchema_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var n = PETUGAS_HEADERS_.length;
  var sh = ss.getSheetByName('Petugas');
  if (!sh) {
    sh = ss.insertSheet('Petugas');
    sh.getRange(1, 1, 1, n).setValues([PETUGAS_HEADERS_]);
    sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    return;
  }
  // Pastikan jumlah kolom cukup, lalu tulis ulang header ke label ramah
  // (urutan kolom konsisten dengan skema lama camelCase → aman di-overwrite).
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
  sh.getRange(1, 1, 1, n).setValues([PETUGAS_HEADERS_])
    .setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
  sh.setFrozenRows(1);
}

// Normalisasi alias field (toleran terhadap frontend lama / penamaan berbeda).
function normalizePetugas_(data) {
  data = data || {};
  var alias = {
    nama: 'namaLengkap', jabatan: 'peran', noHp: 'noTelepon',
    nik: 'noKTP', jk: 'jenisKelamin', tglLahir: 'tanggalLahir',
    tglExpiredPaspor: 'masaBerlakuPaspor'
  };
  Object.keys(alias).forEach(function(k) {
    if (data[alias[k]] === undefined && data[k] !== undefined) data[alias[k]] = data[k];
  });
  return data;
}

/**
 * Ambil daftar petugas. Jika idGroup kosong, kembalikan semua.
 * Pembacaan berbasis indeks kolom (tidak tergantung teks header).
 */
function getPetugasList(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Petugas');
  if (!sh || sh.getLastRow() < 2) return [];
  var rows = sh.getDataRange().getValues();
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    if (idGroup && rows[i][1] !== idGroup) continue;
    var obj = {};
    for (var c = 0; c < PETUGAS_FIELDS_.length; c++) {
      obj[PETUGAS_FIELDS_[c]] = rows[i][c] !== undefined ? rows[i][c] : '';
    }
    // Tanggal dikirim ISO (yyyy-MM-dd) agar bisa mengisi <input type="date">.
    if (obj.masaBerlakuPaspor) obj.masaBerlakuPaspor = isoDate_(obj.masaBerlakuPaspor);
    if (obj.tanggalLahir) obj.tanggalLahir = isoDate_(obj.tanggalLahir);
    if (obj.tglTerbitPaspor) obj.tglTerbitPaspor = isoDate_(obj.tglTerbitPaspor);
    result.push(obj);
  }
  return result;
}

/**
 * Simpan (create/update) petugas — 18 field, penulisan berbasis indeks.
 */
function simpanPetugas(data) {
  data = normalizePetugas_(data);
  if (!data || !data.namaLengkap) return { success: false, error: 'Nama lengkap wajib diisi.' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Petugas');
  if (!sh) { migratePetugasSchema_(); sh = ss.getSheetByName('Petugas'); }
  var now = new Date();
  var isEdit = !!data.idPetugas;
  var fields = PETUGAS_FIELDS_;
  if (isEdit) {
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === data.idPetugas) {
        var updated = fields.map(function(f, idx) {
          if (f === 'updatedAt') return now;
          if (f === 'createdAt') return rows[i][14] || now;
          return data[f] !== undefined ? data[f] : (rows[i][idx] || '');
        });
        sh.getRange(i + 1, 1, 1, fields.length).setValues([updated]);
        return { success: true, idPetugas: data.idPetugas };
      }
    }
    return { success: false, error: 'Petugas tidak ditemukan.' };
  }
  // Create
  data.idPetugas = Utilities.getUuid();
  data.createdAt = now;
  data.updatedAt = now;
  var row = fields.map(function(f) { return data[f] !== undefined ? data[f] : ''; });
  sh.appendRow(row);
  return { success: true, idPetugas: data.idPetugas };
}

/**
 * Hapus petugas berdasarkan idPetugas.
 */
function hapusPetugas(idPetugas) {
  if (!idPetugas) return { success: false, error: 'ID petugas wajib diisi.' };
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Petugas');
  if (!sh || sh.getLastRow() < 2) return { success: false, error: 'Petugas tidak ditemukan.' };
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === idPetugas) {
      sh.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Petugas tidak ditemukan.' };
}

function getDashboardFull() {
  var stats   = getDashboardStats();
  var groups  = getGroupList();
  var laporan = getLaporanKeuangan();

  // Ringkasan kesiapan SISKOPATUH (hanya untuk role yang berhak melihat).
  var sisko = null;
  try {
    if (hasPermission_('siskopatuh')) {
      var k = cekKelengkapanSiskopatuh('');
      sisko = { total: k.total, siap: k.siap, belum: k.belum, pctSiap: k.pctSiap };
    }
  } catch (e) {}

  var activeGroups = groups.filter(function(g) { return g.statusGroup !== 'Selesai'; });
  return {
    stats:   stats,
    groups:  activeGroups.slice(0, 6),
    allGroupCount: groups.length,
    laporan: {
      totalTagihan:   laporan.totalTagihan,
      totalLunas:     laporan.totalLunas,
      totalPending:   laporan.totalPending,
      totalJatuhTempo:laporan.totalJatuhTempo,
      pctLunas:       laporan.pctLunas
    },
    siskopatuh: sisko
  };
}
