/**
 * KELANA — Roomlist.gs
 * ====================
 * Manajemen penempatan kamar jamaah di Hotel Madinah & Makkah.
 *
 * Sheet Roomlist kolom (0-idx):
 *   0:IDRoom  1:IDGroup  2:IDJamaah  3:NamaJamaah
 *   4:Hotel  5:Lokasi  6:NomorKamar  7:TipeKamar  8:Catatan
 */

function getRoomlist(idGroup) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Roomlist');
  if (!sh || sh.getLastRow() < 2) return { rows: [] };
  return {
    rows: sh.getDataRange().getValues().slice(1)
      .filter(function(r) { return r[0] && (!idGroup || r[1] === idGroup); })
      .map(function(r) {
        return {
          idRoom: r[0], idGroup: r[1], idJamaah: r[2], namaJamaah: r[3],
          hotel: r[4], lokasi: r[5], nomorKamar: r[6],
          tipeKamar: r[7], catatan: r[8] || ''
        };
      })
  };
}

function saveRoomAssignment(data) {
  var sh = ensureRoomlistSheet_();
  var idRoom = data.idRoom || '';

  if (idRoom) {
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === idRoom) {
        sh.getRange(i + 1, 2, 1, 8).setValues([[
          data.idGroup     || rows[i][1],
          data.idJamaah    || rows[i][2],
          data.namaJamaah  || rows[i][3],
          data.hotel       || rows[i][4],
          data.lokasi      || rows[i][5],
          data.nomorKamar  || rows[i][6],
          data.tipeKamar   || rows[i][7],
          data.catatan !== undefined ? data.catatan : rows[i][8]
        ]]);
        logActivity_(getCurrentUser_(), 'Update Roomlist', 'Roomlist', idRoom,
          (data.namaJamaah || '') + ' → Kamar ' + (data.nomorKamar || ''));
        return { success: true, idRoom: idRoom };
      }
    }
  }

  idRoom = 'RM-' + new Date().getTime();
  sh.appendRow([
    idRoom, data.idGroup || '', data.idJamaah || '',
    data.namaJamaah || '', data.hotel || '', data.lokasi || 'Madinah',
    data.nomorKamar || '', data.tipeKamar || 'Triple', data.catatan || ''
  ]);
  logActivity_(getCurrentUser_(), 'Tambah Roomlist', 'Roomlist', idRoom,
    (data.namaJamaah || '') + ' → Kamar ' + (data.nomorKamar || ''));
  return { success: true, idRoom: idRoom };
}

function deleteRoomAssignment(idRoom) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Roomlist');
  if (!sh) return { success: false, error: 'Sheet tidak ditemukan.' };
  var rows = sh.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === idRoom) {
      var nama = rows[i][3];
      sh.deleteRow(i + 1);
      logActivity_(getCurrentUser_(), 'Hapus Roomlist', 'Roomlist', idRoom, nama);
      return { success: true };
    }
  }
  return { success: false, error: 'Data tidak ditemukan.' };
}

/**
 * Auto-assign jamaah ke kamar berdasarkan gender.
 * Menghasilkan 2 set kamar per lokasi (Madinah & Makkah).
 */
function autoAssignRooms(idGroup, kapasitas) {
  kapasitas = parseInt(kapasitas) || 3;
  var shJ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jamaah');
  if (!shJ || shJ.getLastRow() < 2) return { success: false, error: 'Tidak ada jamaah.' };

  var jamaah = shJ.getDataRange().getValues().slice(1)
    .filter(function(r) { return r[0] && r[15] === idGroup; })
    .map(function(r) { return { idJamaah: r[0], nama: r[1], jk: r[5] || 'Laki-laki' }; });

  if (!jamaah.length) return { success: false, error: 'Tidak ada jamaah di kloter ini.' };

  // Ambil info hotel dari sheet Group (schema-aware: 23-kolom vs 14-kolom lama)
  var shG = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Group');
  var hotelMadinah = 'Hotel Madinah', hotelMakkah = 'Hotel Makkah';
  if (shG && shG.getLastRow() > 1) {
    var isNewSchema = shG.getLastColumn() >= 20;
    var madCol = isNewSchema ? 12 : 7;
    var makCol = isNewSchema ? 13 : 8;
    var gRows = shG.getDataRange().getValues();
    for (var gi = 1; gi < gRows.length; gi++) {
      if (gRows[gi][0] === idGroup) {
        hotelMadinah = gRows[gi][madCol] || hotelMadinah;
        hotelMakkah  = gRows[gi][makCol] || hotelMakkah;
        break;
      }
    }
  }

  // Hapus assignment lama untuk group ini
  var shR = ensureRoomlistSheet_();
  var existing = shR.getDataRange().getValues();
  for (var i = existing.length - 1; i >= 1; i--) {
    if (existing[i][1] === idGroup) shR.deleteRow(i + 1);
  }

  var pria   = jamaah.filter(function(j) { return j.jk !== 'Perempuan'; });
  var wanita = jamaah.filter(function(j) { return j.jk === 'Perempuan'; });
  var count  = 0;
  var tipe   = kapasitas === 2 ? 'Double' : kapasitas === 3 ? 'Triple' : 'Quad';

  [
    { lokasi: 'Madinah', hotel: hotelMadinah },
    { lokasi: 'Makkah',  hotel: hotelMakkah  }
  ].forEach(function(loc) {
    [
      { list: pria,   prefix: 'P' },
      { list: wanita, prefix: 'W' }
    ].forEach(function(grp) {
      var roomNo = 0;
      grp.list.forEach(function(j, idx) {
        if (idx % kapasitas === 0) roomNo++;
        var idRoom = 'RM-' + new Date().getTime() + String(count);
        shR.appendRow([idRoom, idGroup, j.idJamaah, j.nama,
                       loc.hotel, loc.lokasi, grp.prefix + String(roomNo), tipe, '']);
        count++;
      });
    });
  });

  logActivity_(getCurrentUser_(), 'Auto-assign Roomlist', 'Roomlist', idGroup,
    count + ' entri untuk ' + jamaah.length + ' jamaah');
  return { success: true, count: count, jamaah: jamaah.length };
}

/**
 * Export roomlist satu kloter sebagai HTML siap cetak.
 */
function exportRoomlistHtml(idGroup) {
  var data = getRoomlist(idGroup);
  var rows = data.rows || [];
  if (!rows.length) return { html: '', count: 0 };

  var namaTravel = getConfig_('NAMA_TRAVEL') || 'Kelana';
  var shG = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Group');
  var namaGroup = idGroup;
  if (shG && shG.getLastRow() > 1) {
    var gd = shG.getDataRange().getValues();
    for (var i = 1; i < gd.length; i++) {
      if (gd[i][0] === idGroup) { namaGroup = gd[i][1]; break; }
    }
  }

  // Group by lokasi → kamar
  var byKey = {};
  rows.forEach(function(r) {
    var key = r.lokasi + '|||' + r.nomorKamar + '|||' + r.tipeKamar + '|||' + r.hotel;
    if (!byKey[key]) byKey[key] = { lokasi: r.lokasi, kamar: r.nomorKamar, tipe: r.tipeKamar, hotel: r.hotel, anggota: [] };
    byKey[key].anggota.push(r.namaJamaah);
  });

  var html = '<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Roomlist</title>'
    + '<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;padding:20px;max-width:900px;margin:0 auto}'
    + 'h2{font-size:17px;margin-bottom:4px}p.meta{color:#6b7280;margin-bottom:18px}'
    + '.lokasi-title{font-size:14px;font-weight:800;color:#4F46E5;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.05em}'
    + '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}'
    + '.room-card{border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px}'
    + '.room-no{font-size:13px;font-weight:800;color:#4F46E5}.room-tipe{font-size:10px;color:#6b7280;font-weight:600;margin-bottom:6px}'
    + '.anggota{font-size:12px;padding:3px 0;border-bottom:1px solid #f3f4f6}.anggota:last-child{border-bottom:0}'
    + '@media print{.no-print{display:none!important}@page{margin:15mm}}'
    + '</style></head><body>'
    + '<div class="no-print" style="margin-bottom:16px;display:flex;gap:10px">'
    + '<button onclick="window.print()" style="background:#4F46E5;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">🖨 Cetak</button>'
    + '<button onclick="window.close()" style="background:#f5f5f7;border:0.5px solid #ddd;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer">Tutup</button></div>'
    + '<h2>Roomlist — ' + esc_(namaGroup) + '</h2>'
    + '<p class="meta">' + esc_(namaTravel) + ' · ' + rows.length + ' jamaah</p>';

  ['Madinah','Makkah'].forEach(function(lok) {
    var lokRows = Object.values(byKey).filter(function(x) { return x.lokasi === lok; });
    if (!lokRows.length) return;
    html += '<div class="lokasi-title">🏨 ' + lok + ' — ' + esc_(lokRows[0].hotel) + '</div><div class="grid">';
    lokRows.sort(function(a,b){ return a.kamar.localeCompare(b.kamar); }).forEach(function(r) {
      html += '<div class="room-card"><div class="room-no">Kamar ' + esc_(r.kamar) + '</div>'
        + '<div class="room-tipe">' + esc_(r.tipe) + '</div>';
      r.anggota.forEach(function(n) { html += '<div class="anggota">• ' + esc_(n) + '</div>'; });
      html += '</div>';
    });
    html += '</div>';
  });

  html += '</body></html>';
  return { html: html, count: rows.length };
}

function ensureRoomlistSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Roomlist');
  if (sh) return sh;
  sh = ss.insertSheet('Roomlist');
  var headers = ['IDRoom','IDGroup','IDJamaah','NamaJamaah','Hotel','Lokasi','NomorKamar','TipeKamar','Catatan'];
  sh.appendRow(headers);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#fff');
  sh.setFrozenRows(1);
  return sh;
}

/**
 * Simpan banyak penempatan kamar sekaligus (batch).
 * @param {Array} assignments - array of room assignment objects
 * @returns {{success, count}}
 */
function saveRoomBatch(assignments) {
  try {
    if (!assignments || !assignments.length) return { success: false, error: 'Data kosong.' };
    var count = 0;
    for (var i = 0; i < assignments.length; i++) {
      var r = saveRoomAssignment(assignments[i]);
      if (r && r.success) count++;
    }
    logActivity_(getCurrentUser_(), 'Simpan Roomlist Batch', 'Roomlist', '', count + ' entri disimpan');
    return { success: true, count: count };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
