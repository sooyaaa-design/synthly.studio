# 📋 Evaluasi & Roadmap SaaS — Kelana

*Sistem Manajemen Umroh · Google Apps Script*
*Disusun: 14 Juni 2026 · branch `claude/shared-link-session-jit71g`*

---

## 1. Ringkasan Eksekutif

Kelana sudah jauh lebih matang dari MVP biasa: ada **RBAC** (4 peran), **tulang punggung
SaaS** (License Server + License Client dengan plan/limit/grace period), **dua frontend**
(popup di dalam Google Sheets + Web App SPA penuh), integrasi **WhatsApp (Fonnte)** dan
**pembayaran online (Xendit webhook)**, serta modul lengkap: Jamaah, Kloter, Lead/CRM,
Dokumen, Roomlist, Manifest, Pembayaran, Laporan, Audit Log.

Hambatan terbesar untuk menarik owner travel **bukan** fiturnya — melainkan **kelengkapan
data agar siap dilaporkan ke SISKOPATUH (Kemenag)**. Inilah yang sudah dikerjakan pada
iterasi ini (lihat §4) dan menjadi *killer feature* Kelana: **"input sekali di Kelana,
ekspor langsung untuk unggah massal ke SISKOPATUH — tidak perlu ketik ulang."**

**Skor kesiapan SaaS saat ini: ~6/10** (naik dari ~4.5/10 setelah iterasi ini, karena
data model jadi *compliant* dan beberapa bug data diperbaiki). Sisa pekerjaan terbesar
ada di **keamanan input, skalabilitas (paginasi), dan otomasi onboarding tenant**.

---

## 2. Arsitektur Saat Ini (yang sudah baik)

| Komponen | Status | Catatan |
|---|---|---|
| RBAC (Roles.gs) | ✅ Kuat | Permission map terpusat, dipakai di popup & API dispatcher |
| License Server/Client | ✅ Ada | Plan, limit jamaah/kloter, grace period 7 hari, cache 6 jam, trigger harian |
| Web App SPA (App.html) | ✅ Solid | Router modular, 1 pintu API `api(token,action,payload)`, session token |
| WA (Fonnte) | ✅ Jalan | Notifikasi DP, konfirmasi bayar, reminder, blast per kloter |
| Xendit webhook | ✅ Ada | Idempotent, auto-update status + WA konfirmasi |
| Audit log | ✅ Ada | Semua aksi tulis tercatat (user, aksi, modul, detail) |
| Harga dinamis | ✅ Ada | Per tipe kamar (Quad/Triple/Double) + kategori Infant |

---

## 3. Temuan & Kekurangan

### 3.1 Bug korektif (berisiko data salah)
- **[DIPERBAIKI]** Skema sheet **Roomlist bentrok**: `setupAwal()` membuat 17 kolom
  (multi-jamaah/baris), tapi `Roomlist.gs` membaca/menulis 9 kolom (1 jamaah/baris).
  Akibatnya data roomlist bisa masuk ke kolom yang salah. → diselaraskan ke skema 9 kolom.
- **[DIPERBAIKI]** Header sheet **Manifest tidak sinkron** dengan urutan tulis di
  `generateManifest()` (No Visa vs Tgl Lahir tertukar). → header diselaraskan.
- **[DIPERBAIKI]** **DP default tidak konsisten**: `generateInvoiceDP_` pakai 30%,
  `generateInvoicePelunasan` pakai 15% & mengasumsikan DP dari persentase. → pelunasan kini
  menghitung **sisa = harga final − total yang benar-benar sudah Lunas**.
- **[CATATAN]** Tabrakan nama fungsi lintas-deploy: `doGet`/`doPost`/`onOpen`/`jsonOut`
  ada di file client **dan** `LicenseServer.gs`. Aman selama LicenseServer dideploy di
  project terpisah, tapi rawan jika file tercampur. Sebaiknya `LicenseServer.gs` ditandai
  jelas "JANGAN satukan dengan project client" (sudah ada komentar, pertegas di panduan).

### 3.2 Keamanan (perlu sebelum jual ke publik)
- **Validasi sisi server lemah**: hampir semua validasi (NIK 16 digit, format HP) hanya
  di frontend. Backend menerima apa adanya. → tambahkan validasi di `simpanJamaah`/`updateJamaah`.
- **XSS**: banyak render via `innerHTML` dengan string gabungan. Sebagian sudah pakai
  `esc()`, tapi belum konsisten. Audit menyeluruh diperlukan.
- **Token di localStorage**: rawan dicuri jika ada XSS. GAS membatasi opsi cookie HttpOnly,
  jadi mitigasi utama = hilangkan XSS + perpendek masa token.
- **`AUTH_PEPPER` hardcoded** sama untuk semua client (`kelana_pepper_ganti_ini_2025`).
  → wajib unik per tenant; pindahkan ke `ScriptProperties`.
- **`ADMIN_PASS` License Server default** `kelana2025`. → wajib diganti & via ScriptProperties.

### 3.3 Skalabilitas
- **Tanpa paginasi**: `getJamaahList` mengembalikan semua baris; tabel render semua record.
  Berat di >1.000 jamaah. → tambah limit/offset + pencarian sisi server.
- **Banyak `getDataRange().getValues()` berulang** pada operasi tunggal (mis. cek lisensi,
  hitung harga). → caching ringan per-request.

### 3.4 Data model (inti daya tarik)
- **[DIPERBAIKI di §4]** Sebelumnya hanya ~15 field; kurang banyak field wajib SISKOPATUH
  (tempat lahir, nama ayah, alamat berjenjang, pekerjaan, status kawin, mahram, golongan
  darah, embarkasi, tempat terbit paspor).

### 3.5 UX/produk
- Tabel belum responsif penuh di mobile (overflow). 
- Belum ada ekspor PDF resmi (invoice/manifest sudah HTML printable — cukup baik).
- Onboarding tenant masih manual (buat spreadsheet, paste file, isi Config, buat akun owner).

---

## 4. Yang Dikerjakan di Iterasi Ini

### 4.1 Modul SISKOPATUH (file baru `Siskopatuh.gs` + `Siskopatuh.html`)
- **Perluasan data model Jamaah** (kolom 26–41, *backward-compatible*, migrasi otomatis
  via `migrateSiskopatuhSchema_()` di `setupAwal`): Tempat Lahir, Nama Ayah, Status
  Perkawinan, Pekerjaan, Pendidikan, Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan,
  Kode Pos, Kewarganegaraan, Nama Mahram, Hubungan Mahram, Embarkasi, Golongan Darah,
  Tempat Terbit Paspor.
- **Cek kelengkapan otomatis** (`cekKelengkapanSiskopatuh`): per jamaah menampilkan field
  yang masih kurang + skor kesiapan (%). Mahram hanya diwajibkan untuk jamaah perempuan.
- **Ekspor CSV siap-unggah** (`exportSiskopatuhCsv`): urutan kolom rapi, format tanggal
  `DD-MM-YYYY`, JK `LAKI-LAKI/PEREMPUAN`, HP dinormalisasi `08xxx`, UTF-8 BOM (aman di
  Excel). Default hanya jamaah **lengkap** yang diekspor agar tidak ditolak saat unggah.
- **Rekap HTML cetak** (`exportSiskopatuhHtml`): sel kosong disorot merah agar mudah
  ditindaklanjuti.
- **Ringkasan per kloter** (`getSiskopatuhRingkasan`) untuk dashboard kesiapan.
- **UI**: halaman **SISKOPATUH** di SPA (sidebar grup Admin) + popup `Siskopatuh.html`
  (menu 🕌 Kelana → Ekspor SISKOPATUH). Permission baru `siskopatuh` = Owner & Admin.
- **Form pendaftaran** (SPA `openJamaahForm` + popup `TambahJamaah.html`) kini punya
  bagian **"Data SISKOPATUH (Kemenag)"** lengkap. Backend `simpanJamaah`/`updateJamaah`/
  `getJamaahList`/`getJamaahById_` membaca-menulis field baru.

### 4.2 Perbaikan bug
- Roomlist & Manifest header diselaraskan dengan kode.
- Logika invoice pelunasan diperbaiki (hitung sisa nyata).

### 4.3 Iterasi lanjutan (onboarding, roomlist, dokumen)
- **Login/onboarding via UI**: layar "Buat Akun Owner pertama" muncul otomatis saat sistem
  belum punya pengguna (`needsSetup`/`setupOwnerPertama`). Tidak perlu lagi buka editor Apps
  Script untuk `buatAkunOwner`. `setupAwal` dipecah → `setupSheets_()` (tanpa UI) agar bisa
  dipanggil dari web app.
- **Roomlist**:
  - "Belum Ditempatkan" kini dihitung **per-lokasi** (Madinah/Makkah terpisah) — memperbaiki
    bug klik (✕) yang tidak mengembalikan jamaah ke daftar sampai dihapus di kedua lokasi.
  - **Legend** ditambahkan: titik berwarna = satu keluarga, ♂/♀ = jenis kelamin.
  - **Simpan kini otoritatif**: baris yatim (akibat hapus/pindah) ikut dihapus dari sheet.
- **Dokumen (SISKOPATUH)**:
  - Modul Dokumen kini bisa **input** No KTP, No Paspor, Tgl Terbit/Berlaku Paspor, No Visa,
    Tgl Berlaku Visa (sebelumnya hanya upload foto) → `updateDokumenData` + `dokumen.save`.
  - Diperbaiki **bug kolom**: `getDokumenJamaah` dulu membaca kolom *terbit* sebagai *berlaku*.
  - Tambah berkas **Pas Foto 4×6** (kolom baru + migrasi `migrateDokumenSchema_`).
  - **Status dokumen dihitung ulang otomatis** (Lengkap/Proses/Belum) & disinkron ke Daftar
    Jamaah + dipakai kelayakan Manifest.

---

### 4.4 Hardening keamanan (P0)
- **Validasi server-side** semua input jamaah (tidak lagi hanya mengandalkan frontend).
- **Tidak ada lagi rahasia hardcoded**: pepper hashing & password admin server kini di
  `ScriptProperties`, unik per tenant.
- **XSS**: gap input tak ter-escape ditutup (lihat P0 #4).

> ⚠️ **Aksi setelah deploy**: di **License Server**, jalankan sekali `setAdminPass('passwordKuat')`
> di editor — endpoint admin kini menolak request bila `ADMIN_PASS` belum diset (tidak ada
> default `kelana2025` lagi).

### 4.5 Paginasi + pencarian server-side (P1 #5)
- Backend: `getJamaahPage()` & `getPembayaranPage()` — filter, cari, sort & potong halaman
  di server; hanya 1 halaman (default 20 baris) yang dikirim ke browser, bukan seluruh data.
- API: `jamaah.page` & `pembayaran.page`.
- Frontend: view Jamaah & Pembayaran kini server-paged — rangka (filterbar) dibangun sekali
  & hanya tabel yang dimuat ulang (input pencarian tidak kehilangan fokus); pencarian
  di-*debounce* 350ms. `cache.jamaah` penuh tetap dipakai modul lain (roomlist/manifest/dll).

### 4.6 P1+P2 lanjutan (foto, BPIU, dashboard, reminder, role, XLSX)
- **Foto → SISKOPATUH**: pas foto/KTP/paspor/visa/ICV ikut di ekspor (kolom URL) & pas foto
  jadi syarat kelengkapan.
- **BPIU**: Config `BPIU_REFERENSI`; `simpanGroup` mengembalikan `warning` bila harga < acuan.
- **Dashboard kesiapan SISKOPATUH** di overview (Owner/Admin) via `getDashboardFull`.
- **Reminder harian** ke email Owner (`reminderHarian_` + trigger 07:00).
- **Role Pembimbing** read-only; izin `manifest`/`roomlist` dipecah view vs `manifestGenerate`/
  `roomlistEdit` agar aman di server.
- **Ekspor XLSX** asli (`exportSiskopatuhXlsx`) via spreadsheet sementara + export.

> ⚠️ **Aksi setelah deploy**: jalankan **Setup Awal** sekali agar trigger reminder harian
> terpasang & Config `BPIU_REFERENSI` muncul (isi nilainya agar validasi aktif). Pastikan
> `EMAIL_TRAVEL` terisi agar digest reminder terkirim.

## 5. Roadmap SaaS (prioritas)

### P0 — wajib sebelum dijual
1. ✅ **[SELESAI]** Validasi server-side (NIK, HP, email, tanggal, kode pos) via
   `validateJamaahData_` di `simpanJamaah`/`updateJamaah`.
2. ✅ **[SELESAI]** Rahasia hardcoded dipindah ke `ScriptProperties`:
   - `AUTH_PEPPER` → `getPepper_()` (instalasi baru dapat pepper acak unik; instalasi lama
     tetap pakai pepper legacy agar hash lama valid).
   - `ADMIN_PASS` (License Server) → `getAdminPass_()` tanpa default hardcoded; set via
     `setAdminPass('...')`.
3. ✅ **[SELESAI]** Input masa berlaku & terbit paspor + visa di modul Dokumen.
4. ✅ **[SELESAI]** Audit XSS: SPA (App.html) konsisten `esc()`; popup memakai `esc()`/
   `det()`/`dbRow()` & toast `textContent`; celah `noPaspor` di Manifest diperbaiki.

### P1 — penguat retensi
5. ✅ **[SELESAI]** Paginasi + pencarian server-side untuk Jamaah & Pembayaran.
6. ⏳ **[SEBAGIAN]** Onboarding tenant: setup Owner via UI + auto-buat sheet sudah ada.
   Sisa "salin template spreadsheet" = langkah operator (tidak bisa tombol in-app untuk
   bound script) — lihat §7.
7. ✅ **[SELESAI]** Foto jamaah (pas foto/KTP/paspor/visa/ICV) masuk ekspor SISKOPATUH +
   pas foto jadi syarat kelengkapan.
8. ✅ **[SELESAI]** Validasi BPIU: Config `BPIU_REFERENSI`; peringatan saat simpan kloter
   bila harga di bawah acuan.

### P2 — diferensiasi
9.  ✅ **[SELESAI]** Dashboard kesiapan SISKOPATUH di overview (Owner/Admin).
10. ✅ **[SELESAI]** Reminder otomatis: `reminderHarian_()` + `setupReminderTrigger()` kirim
    digest harian ke EMAIL_TRAVEL (paspor ≤90 hari, tagihan jatuh tempo ≤3 hari, kloter
    berangkat ≤30 hari dengan dokumen kurang).
11. ✅ **[SELESAI]** Role **Pembimbing** read-only (lihat jamaah/manifest/roomlist). Izin
    manifest & roomlist dipecah view vs edit di server.
12. ✅ **[SELESAI]** Ekspor **XLSX** asli (`exportSiskopatuhXlsx`) selain CSV.

### P3 — UX & Fitur Lanjutan
13. ✅ **[SELESAI]** Status kloter **otomatis dari tanggal** (Berjalan/Selesai) — tidak perlu
    ubah manual. `autoStatusGroup_()` di `getGroupList()`.
14. ✅ **[SELESAI]** **Duplikasi kloter** (`duplikasiGroup`) — salin kloter + edit sedikit.
15. ✅ **[SELESAI]** **Petugas** (Tour Leader/Pembimbing/Muthawif) — sheet baru, CRUD lengkap,
    data sesuai SISKOPATUH (NIK, paspor, dll). Sidebar "Petugas" di grup Admin.
16. ✅ **[SELESAI]** **Tombol WhatsApp** di halaman Lead & CRM — langsung follow up via WA.
17. ✅ **[SELESAI]** **Dashboard**: kloter Selesai otomatis tersembunyi; panah navigasi "→"
    di kartu Kloter, Keuangan, Jamaah Terbaru menuju halaman masing-masing.
18. ✅ **[SELESAI]** **Badge status berwarna**: Berjalan (indigo), Selesai (gray), Draft (amber).
    Tab kloter menampilkan jumlah per tab.
19. ✅ **[SELESAI]** **Salin roomlist dari kloter lain**: tombol "Salin dari Kloter" menyalin
    struktur kamar (hotel/nomor/tipe) sebagai kamar kosong, lalu jamaah tinggal diisi. Kamar
    kosong kini ikut tersimpan (baris placeholder) agar template tidak hilang saat Simpan.

### P3 — Bug korektif lanjutan
- **[DIPERBAIKI]** `getGroupById_()` (dipakai WA Blast & invoice) membaca **skema lama 14-kolom**
  pada instalasi skema 23-kolom → `pembimbing`/`hotel`/`noFlight` salah kolom. Kini schema-aware.
- **[DIPERBAIKI]** `autoAssignRooms()` membaca kolom hotel `Group[7]/[8]` (skema lama = nomor
  penerbangan di skema baru) → label hotel salah. Kini schema-aware (`12/13`).

### P4 — Keluarga/PIC, Relasi, Finance Profesional, Konteks Booking
20. ✅ **[SELESAI]** **Keluarga/PIC tampil di UI.** Backend `simpanKeluarga`/`getKeluargaTagihan`
    yang sebelumnya *dead-wired* kini terhubung: form **"Tambah Rombongan"** (banyak anggota
    sekaligus, pilih PIC), field **Keluarga + Hubungan + PIC** di form jamaah individual,
    badge **fam-dot + PIC** di tabel jamaah, blok **Keluarga** di detail jamaah (anggota,
    PIC, link WA), dan tab **"Per Keluarga"** di halaman Pembayaran (tagihan agregat keluarga
    + tombol Hubungi PIC). `setPicKeluarga_` menjaga PIC tunggal per keluarga.
21. ✅ **[SELESAI]** **Hubungan dalam Keluarga** — kolom baru Jamaah index 42 (`Hubungan
    Keluarga`), migrasi idempoten `migrateKeluargaSchema_`. Nilai: Kepala Keluarga/Suami/
    Istri/Anak/Orang Tua/Saudara/Mertua/Cucu/Lainnya. Derivasi read-only untuk data lama
    (PIC→Kepala Keluarga; mahram Suami→Istri). Roomlist menampilkan petunjuk **💑 pasangan**
    pada chip "Belum Ditempatkan" agar suami-istri mudah disekamarkan.
22. ✅ **[SELESAI]** **Halaman Finance profesional.** KPI header (Total Tagihan, Diterima,
    Outstanding, Jatuh Tempo + jumlah, Diterima Bulan Ini). Tabel diperkaya: **Metode**,
    **Tgl & Jam Bayar** (timestamp, bukan tanggal saja), **Bukti** (link), klik baris →
    **drawer detail** (timeline dibuat/jatuh tempo/dibayar, metode, bukti, dikonfirmasi oleh,
    catatan, riwayat). Konfirmasi pembayaran kini bisa **upload bukti ke Google Drive**
    (`uploadBuktiBayar`, pola `uploadFotoJamaah`). `konfirmasiPembayaranManual` menerima param
    bukti; `getPembayaranList/Page` mengembalikan `buktiBayar`/`dikonfirmasiOleh` + tglBayar ISO.
23. ✅ **[SELESAI]** **Konteks booking + sistem Add-on/Upgrade.** Sheet baru **`AddOn`**
    (`ensureAddOnSheet_`) + CRUD (`getAddOnList`/`simpanAddOn`/`hapusAddOn`). Helper
    `hitungTotalBookingJamaah_` = harga kamar + total add-on → dipakai
    `generateInvoicePelunasan` sehingga **add-on otomatis tertagih di pelunasan**.
    `getBookingSummary_` (pax, anggota+relasi, paket, tipe kamar, upgrade delta, add-on, total
    vs dibayar vs sisa) tampil di drawer detail Finance & **invoice HTML cetak**. Manajemen
    add-on lewat tombol "Kelola Add-on / Upgrade" di drawer.

### Berikutnya (P5 — opsional)
- Pisah read/write lebih halus untuk semua modul; tombol UI per-aksi.
- Paginasi modul Dokumen & "Jamaah Terbaru" dashboard (saat ini masih muat semua).
- Cron WA reminder otomatis ke jamaah (saat ini digest hanya ke owner, by design).
- Embarkasi level kloter (saat ini per-jamaah).
- Add-on yang ditambahkan setelah invoice pelunasan terbit perlu regenerasi/invoice tambahan.
- Multi-tenant nyata (1 server, banyak travel) bila ingin lepas dari model 1-spreadsheet-1-travel.

> ⚠️ **Aksi setelah deploy P4**: jalankan **Setup Awal** sekali agar sheet **AddOn** dibuat &
> kolom **Hubungan Keluarga** (43) termigrasi ke sheet Jamaah lama.

---

## 5b. Iterasi P5 — Audit Alur, Paket sebagai Sumber Harga, Perbaikan Finance

Iterasi ini menindaklanjuti audit alur kerja (daftar → bayar → kepulangan) dan menemukan
beberapa cacat fungsional. Semua perubahan **tidak menyentuh field/ekspor SISKOPATUH**.

**Perbaikan bug:**
1. ✅ **Status kloter by-tanggal.** `autoStatusGroup_` dulu mem-parse string tanggal yang
   sudah diformat ("14 Juni 2026") → `Invalid Date` → status tak pernah pindah. Sekarang
   memakai tanggal mentah (objek Date). Status **Berjalan/Selesai otomatis** dari tanggal.
2. ✅ **"Terisi" kartu kloter.** Dihitung live dari jumlah jamaah per `IDGroup`
   (`hitungTerisiPerGroup_`), bukan angka manual yang basi.
3. ✅ **Modul Petugas tadinya rusak total** (nama field frontend ≠ backend → simpan/edit
   selalu gagal). Disamakan, header sheet jadi label rapi, baca/tulis **berbasis indeks** +
   toleran alias (`normalizePetugas_`). Tambah kolom `Kewarganegaraan` & `Tgl Terbit Paspor`.
4. ✅ **Reminder WA** hanya muncul untuk invoice **belum lunas** (tidak lagi bisa kirim ke
   yang sudah lunas).
5. ✅ **Header sheet hilang** diperbaiki: `ensureSheetHeaders_` dipanggil
   `createSheetIfNotExists_` untuk mengisi kolom header yang kosong pada sheet lama.
6. ✅ **DummyData** disinkron penuh dengan skema terbaru (Jamaah 43 kolom + SISKOPATUH,
   sheet AddOn, Petugas, Paket dgn harga upgrade, tiap Group tertaut paket).

**Fitur baru:**
7. ✅ **Petugas di Roomlist.** Petugas kloter bisa ditempatkan di kamar (drag & drop),
   ditandai 🧑‍✈️ + peran, disimpan via kolom `IDJamaah` (tanpa ubah skema Roomlist).
8. ✅ **Peran Petugas sesuai Kemenag** (Pembimbing Ibadah/TPIHI, Ketua Kloter, Ketua
   Rombongan, Tour Leader, Muthawif, Handling).
9. ✅ **Pembimbing kloter ↔ Petugas.** Field Pembimbing di form Kloter jadi datalist dari
   petugas terdaftar (tetap bisa manual).
10. ✅ **Alur DP → Pelunasan otomatis.** `konfirmasiPembayaranManual` kini:
    (a) memperbarui status jamaah via `recomputeStatusBayarJamaah_` (**Belum Bayar → DP
    Lunas → Lunas**), dan (b) setelah DP, **otomatis membuat invoice Pelunasan** + jatuh
    tempo (tglBerangkat − `BATAS_PELUNASAN_HARI`).
11. ✅ **Filter kloter** "Selesai" disembunyikan dari pilihan tambah jamaah.

**Perubahan model harga (besar):**
12. ✅ **Harga pindah dari Kloter ke Paket.** Sheet **Paket** kini sumber harga:
    `Harga (Quad)` + `Tambahan Triple` + `Tambahan Double` + `DP Minimal`. Sheet **Group**
    dapat kolom **`ID Paket`** (index 23). `hitungHargaJamaah_` resolusi via paket kloter,
    **fallback ke harga inline kloter** untuk data lama (kompatibel mundur).
13. ✅ **Halaman Paket** (sidebar, grup Utama) dengan CRUD penuh (`simpanPaket`/`hapusPaket`,
    route `paket.save`/`paket.delete`, izin `kelolaGroup`). `getGroupList` mengembalikan
    `idPaket`, `namaPaket`, dan harga efektif.
14. ✅ **Form Kloter**: input harga manual diganti **pemilih Paket** + preview.
    **Form Tambah Jamaah**: cukup pilih Kloter → Paket & harga **terisi otomatis**.

### Berikutnya (P6 — opsional)
- DP memakai `DP Minimal` paket (saat ini DP = % dari `DP_DEFAULT_PERSEN`).
- Satu kloter = satu paket (bila perlu multi-paket per kloter, perlu desain tambahan).
- Add-on yang ditambahkan setelah invoice pelunasan terbit perlu regenerasi.
- Paginasi modul Dokumen & "Jamaah Terbaru" dashboard.

> ⚠️ **Aksi setelah deploy P5**: jalankan **Setup Awal** sekali → tambah kolom **ID Paket**
> (Group), **Tambahan Triple/Double** (Paket), dan normalkan header **Petugas**. Set juga
> **timezone project ke Asia/Jakarta** (Project Settings) agar status by-tanggal akurat.
> Untuk data lama: isi harga tiap **Paket**, lalu buka tiap **Kloter** → pilih Paket.

---

## 6. Catatan Teknis SISKOPATUH

- **Sumber data resmi**: template & alur unggah jamaah ada di manual Kemenag
  (`siskopatuh.kemenag.go.id`). Karena urutan kolom template bisa berubah sewaktu-waktu,
  `SISKO_EXPORT_COLS` di `Siskopatuh.gs` sengaja dibuat **satu titik ubah** — sesuaikan
  label/urutan kolom di sana bila template resmi diperbarui.
- **Field wajib** didefinisikan di `siskoRequiredFields_()`. Tambah/kurangi sesuai
  kebijakan terbaru tanpa menyentuh logika lain.
- **Paspor**: `Masa Berlaku Paspor` & `Tgl Terbit Paspor` diambil dari sheet **Dokumen**
  (kolom 8 & 7). Pastikan modul Dokumen mengisinya (lihat P0 #3).
- **Mahram**: hanya diwajibkan untuk jenis kelamin Perempuan (`siskoButuhMahram_`).
