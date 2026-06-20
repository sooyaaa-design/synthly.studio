/**
 * KELANA — Xendit Webhook Handler
 *
 * Setup:
 *   1. Di Apps Script editor, pilih Deploy → New Deployment → Web App
 *   2. "Execute as" = Me,  "Who has access" = Anyone
 *   3. Salin URL Web App → daftarkan ke Xendit Dashboard sebagai webhook endpoint
 *   4. Aktifkan event: invoice.paid, payment_request.ui.completed
 *
 * Depends on (sudah ada di Code.gs / Setup.gs):
 *   getJamaahById_(idJamaah), kirimWA_(noHp, pesan),
 *   logActivity_(user, aksi, modul, id, detail),
 *   formatRupiah_(n), getConfig_(key)
 */

// ─── KEAMANAN WEBHOOK ────────────────────────────────────────────────────────

/** Token webhook tersimpan di ScriptProperties (tidak ada default — fail-closed). */
function getWebhookToken_() {
  return PropertiesService.getScriptProperties().getProperty('XENDIT_WEBHOOK_TOKEN') || '';
}

/**
 * Set token webhook. Jalankan SEKALI di editor: setWebhookToken_('tokenAcakPanjang...').
 * Minimal 16 karakter. Daftarkan URL webhook ke Xendit dengan query: ...?token=TOKEN
 */
function setWebhookToken_(t) {
  if (!t || String(t).length < 16) throw new Error('Token minimal 16 karakter.');
  PropertiesService.getScriptProperties().setProperty('XENDIT_WEBHOOK_TOKEN', String(t));
  Logger.log('XENDIT_WEBHOOK_TOKEN tersimpan.');
  return 'OK — XENDIT_WEBHOOK_TOKEN tersimpan.';
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    // ── Gate keamanan (FAIL-CLOSED): tolak jika token belum diset atau tidak cocok ──
    var expectedToken = getWebhookToken_();
    var gotToken = (e && e.parameter && e.parameter.token) || '';
    if (!expectedToken || gotToken !== expectedToken) {
      try {
        logActivity_('System', 'Webhook Ditolak', 'Pembayaran', '-', 'token invalid/absen');
      } catch (e2) {}
      return jsonResponse_({ received: false, reason: 'unauthorized' });
    }

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ received: false, reason: 'empty body' });
    }

    var payload = JSON.parse(e.postData.contents);

    logActivity_('Xendit', 'Webhook Diterima', 'Pembayaran', '-',
      'status=' + (payload.status || '?') +
      ' | external_id=' + (payload.external_id || payload.id || '?'));

    // Xendit mengirim event dengan field berbeda tergantung metode:
    //   Invoice / VA / QRIS:  { status, external_id, id, amount, paid_at, ... }
    //   Payment Request:      { status, reference_id, ... }
    var status     = payload.status;
    var externalId = payload.external_id || payload.reference_id || payload.id;

    if ((status === 'PAID' || status === 'SETTLED') && externalId) {
      updatePembayaranByXendit_(externalId, payload);
    }

    return jsonResponse_({ received: true });

  } catch (err) {
    try {
      logActivity_('System', 'Webhook Error', 'Pembayaran', '-', err.message);
    } catch(e2) {}
    return jsonResponse_({ received: false, error: err.message });
  }
}

// ─── UPDATE SHEET PEMBAYARAN ─────────────────────────────────────────────────

/**
 * Cari row di sheet Pembayaran yang cocok dengan externalId (ID Invoice atau ID Transaksi),
 * update status menjadi Lunas, catat tanggal bayar, lalu kirim WA konfirmasi ke jamaah.
 *
 * @param {string} externalId  — external_id dari Xendit (= ID Invoice Kelana atau ID Transaksi)
 * @param {Object} payload     — full Xendit webhook payload
 */
function updatePembayaranByXendit_(externalId, payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Pembayaran');
  if (!sh || sh.getLastRow() < 2) return;

  // Sheet Pembayaran columns (0-indexed):
  // 0:ID Invoice        1:ID Jamaah       2:Nama Jamaah    3:Jenis Bayar
  // 4:Nominal           5:Metode          6:Status         7:Tgl Invoice
  // 8:Tgl Bayar         9:Tgl Jatuh Tempo 10:ID Transaksi  11:Link Bayar
  // 12:Bukti Bayar      13:Dikonfirmasi Oleh               14:Catatan

  var COL_STATUS   = 7;   // 1-based: kolom G
  var COL_TGL_BAYAR= 9;   // kolom I
  var COL_TRX_ID   = 11;  // kolom K
  var COL_KONFIRM  = 14;  // kolom N

  var data = sh.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var rowInvoiceId = String(data[i][0] || '');
    var rowTrxId     = String(data[i][10] || '');

    var matched = (rowInvoiceId === externalId || rowTrxId === externalId);
    if (!matched) continue;

    // Sudah lunas sebelumnya — skip (idempotent)
    if (String(data[i][6]).toLowerCase() === 'lunas') break;

    var tglBayar = payload.paid_at ? new Date(payload.paid_at) : new Date();
    var txId     = payload.id || externalId;

    sh.getRange(i + 1, COL_STATUS).setValue('Lunas');
    sh.getRange(i + 1, COL_TGL_BAYAR).setValue(tglBayar);
    sh.getRange(i + 1, COL_TRX_ID).setValue(txId);
    sh.getRange(i + 1, COL_KONFIRM).setValue('Xendit Auto');

    var nominal = data[i][4] || payload.amount || payload.paid_amount || 0;
    logActivity_('Xendit', 'Pembayaran Lunas', 'Pembayaran', rowInvoiceId,
      'Rp ' + formatRupiah_(nominal) + ' | trx=' + txId);

    kirimWAKonfirmasiBayar_(
      data[i][1],   // idJamaah
      data[i][2],   // namaJamaah
      data[i][3],   // jenisBayar
      nominal,
      rowInvoiceId
    );
    break;
  }
}

// ─── WA KONFIRMASI ────────────────────────────────────────────────────────────

function kirimWAKonfirmasiBayar_(idJamaah, namaJamaah, jenisBayar, nominal, idInvoice) {
  if (!idJamaah) return;
  var jamaah = getJamaahById_(idJamaah);
  if (!jamaah || !jamaah.noHp) return;

  var tgl   = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  var travel = getConfig_('NAMA_TRAVEL') || 'Kelana Travel';

  var msg = [
    '✅ *Pembayaran Diterima*',
    '',
    'Halo *' + namaJamaah + '*,',
    'Kami telah menerima pembayaran Anda. Jazakallah khair 🙏',
    '',
    '📋 *Detail Pembayaran:*',
    '• Invoice : ' + idInvoice,
    '• Jenis   : ' + (jenisBayar || '—'),
    '• Nominal : Rp ' + formatRupiah_(nominal),
    '• Tanggal : ' + tgl,
    '',
    'Semoga perjalanan umroh Anda penuh berkah & kemudahan. 🕌',
    '',
    '_' + travel + '_'
  ].join('\n');

  kirimWA_(jamaah.noHp, msg);
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
