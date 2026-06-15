# 📖 PANDUAN PENGGUNA KELANA
## Sistem Manajemen Umroh — Panduan per Peran
*Versi 1.0 — Bahasa Indonesia*

---

> **Panduan ini dibagi berdasarkan peran. Cari bagian sesuai peran Anda:**
> - [OWNER TRAVEL](#-panduan-owner-travel) — Bos / Pemilik travel
> - [ADMIN](#-panduan-admin) — Staff administrasi
> - [FINANCE](#-panduan-finance) — Staff keuangan
> - [MARKETING](#-panduan-marketing) — Staff marketing / agen

---

---

# 👑 PANDUAN OWNER TRAVEL

**Anda bisa mengakses: semua fitur tanpa terkecuali.**

---

## Apa yang Bisa Dilakukan Owner

| Fitur | Keterangan |
|-------|-----------|
| ✅ Dashboard | Lihat statistik lengkap bisnis |
| ✅ Tambah Jamaah | Input pendaftar baru |
| ✅ Daftar Jamaah | Lihat, cari, hapus data jamaah |
| ✅ Pembayaran | Kelola invoice, konfirmasi, laporan keuangan |
| ✅ Roomlist | Atur penempatan kamar |
| ✅ Manifest | Buat manifest penerbangan |
| ✅ SISKOPATUH | Cek kelengkapan & ekspor data siap-unggah ke Kemenag |
| ✅ WA Blast | Kirim pesan massal ke jamaah |
| ✅ Kelola Pengguna | Tambah / hapus staff, atur peran |

---

## Cara Membuka Sistem

1. Buka **Google Spreadsheet** Kelana milik travel Anda
2. Klik menu **🕌 Kelana** di bar menu atas
3. Klik **Dashboard** — panel akan terbuka di sisi kanan

---

## Memantau Kesehatan Bisnis (Dashboard)

Dashboard menampilkan:
- **Total Jamaah** — semua pendaftar aktif
- **Kloter Aktif** — grup keberangkatan yang sedang berjalan
- **Pendapatan Bulan Ini** — total pembayaran yang sudah lunas
- **Invoice Jatuh Tempo** — pembayaran yang harus segera ditindaklanjuti
- **Grafik pendapatan** per kloter
- **Daftar jamaah yang belum lunas** — bisa langsung klik kirim WA reminder

**Cara buka:** Menu 🕌 Kelana → Dashboard

---

## Mengelola Staff (Tambah / Ubah / Hapus Akses)

### Tambah Pengguna Baru
1. Menu 🕌 Kelana → **Kelola Pengguna**
2. Klik tombol **Tambah Pengguna**
3. Isi:
   - **Email**: email Google akun staff (harus email Gmail)
   - **Nama**: nama lengkap staff
   - **Peran**: pilih salah satu (lihat penjelasan di bawah)
4. Klik **Simpan**

### Peran yang Tersedia

| Peran | Bisa Apa Saja |
|-------|--------------|
| **Owner** | Semua fitur |
| **Admin** | Kelola jamaah, roomlist, manifest, dokumen, SISKOPATUH. Tidak bisa lihat keuangan |
| **Finance** | Lihat pembayaran dan laporan. Tidak bisa hapus jamaah |
| **Marketing** | Tambah jamaah dan WA blast saja |
| **Pembimbing** | Hanya **lihat** (read-only): daftar jamaah, manifest, roomlist. Tidak bisa ubah apa pun |

> ⚠️ Hanya email yang sudah ditambahkan yang bisa mengakses sistem. Staff yang belum didaftarkan akan melihat pesan "Akses Ditolak".

### Hapus Akses Staff
1. Menu 🕌 Kelana → **Kelola Pengguna**
2. Cari nama staff di daftar
3. Klik tombol **Hapus** di baris staff tersebut
4. Konfirmasi → akses langsung dicabut

---

## Melihat Riwayat Perubahan Data (Audit Trail)

Setiap perubahan data dicatat otomatis: siapa yang input, jam berapa, apa yang diubah.

**Cara lihat:**
1. Buka sheet **Log Aktivitas** di spreadsheet (tab paling bawah)
2. Kolom yang tersedia: Waktu, Email Pengguna, Aksi, Detail
3. Bisa difilter/cari dengan Ctrl+F

**Contoh log yang tercatat:**
- `Admin@email.com menambah jamaah: Ahmad Fauzi (NIK: 3271...)`
- `Finance@email.com konfirmasi pembayaran INV-001 — Rp 5.000.000`
- `Marketing@email.com menghapus jamaah: (diblokir — tidak ada izin)`

> Jika ada data yang berubah tidak wajar, cek Log Aktivitas untuk mengetahui siapa yang mengubahnya.

---

## Mengelola Paket dan Kloter

### Buat Paket Baru
1. Buka tab sheet **Paket** di spreadsheet
2. Tambah baris baru, isi kolom:
   - ID Paket (contoh: PKT-2025-01)
   - Nama Paket (contoh: Paket Hemat Ramadhan)
   - Harga, DP Minimal, Durasi (hari)
   - Hotel Madinah, Hotel Makkah
   - Kolom Aktif: isi `TRUE`

### Buat Kloter / Group
1. Di halaman **Kloter**, klik **+ Tambah Kloter**
2. Isi data: Nama, Tanggal Berangkat/Pulang, Maskapai, Harga, dst.
3. Status kloter **otomatis ditentukan dari tanggal**:
   - **Aktif/Draft** — tanggal berangkat belum tiba
   - **Berjalan** — sudah melewati tanggal berangkat, belum lewat tanggal pulang
   - **Selesai** — sudah melewati tanggal pulang
4. Untuk membuat kloter serupa, klik **Duplikasi** pada kloter yang sudah ada — data tersalin
   (kecuali tanggal & jamaah), tinggal edit sedikit.

### Petugas (Tour Leader / Pembimbing / Muthawif)
1. Buka halaman **Petugas** di sidebar (grup Admin)
2. Klik **+ Tambah Petugas**, isi data lengkap (NIK, paspor, jabatan, dll.)
3. Data petugas sesuai format SISKOPATUH — bisa dilaporkan ke Kemenag.

### Pengaturan Penting (sheet Config)
- **`BPIU_REFERENSI`** — isi biaya referensi umroh Kemenag (angka saja). Bila harga kloter
  yang Anda simpan di bawah nilai ini, sistem menampilkan **peringatan** (tidak memblokir).
- **`EMAIL_TRAVEL`** — wajib diisi agar Anda menerima **email pengingat harian** otomatis
  (paspor mau kadaluarsa, tagihan jatuh tempo, kloter dekat berangkat dengan dokumen kurang).
  Pengingat berjalan otomatis tiap pagi setelah **Setup Awal** dijalankan sekali.

> 💡 **Onboarding travel baru**: akun Owner pertama dibuat langsung dari halaman web (layar
> "Buat Akun Owner" muncul otomatis saat belum ada pengguna). Untuk membuat instance travel
> baru, salin spreadsheet template Kelana lalu buka URL web app-nya — sisanya otomatis.

---

## Laporan Keuangan

**Cara lihat:**
1. Menu 🕌 Kelana → **Pembayaran**
2. Scroll ke bawah → lihat tabel **Laporan Keuangan per Kloter**
3. Informasi yang ditampilkan:
   - Total tagihan per kloter
   - Total sudah lunas
   - Total masih pending
   - Total jatuh tempo (perlu tindak lanjut)
   - Persentase pelunasan

---

---

# 🗂 PANDUAN ADMIN

**Anda bisa mengakses: Jamaah, Roomlist, Manifest, Dashboard.**  
**Anda tidak bisa mengakses: Pembayaran, Laporan Keuangan, Kelola Pengguna.**

---

## Cara Membuka Sistem

1. Buka **Google Spreadsheet** Kelana dari link yang diberikan Owner
2. Klik menu **🕌 Kelana** di bar menu atas
3. Sistem akan otomatis mengenali peran Anda

> ⚠️ Jika muncul pesan "Akses Ditolak", hubungi Owner untuk ditambahkan ke sistem.

---

## Menambah Jamaah Baru

1. Menu 🕌 Kelana → **Tambah Jamaah**
2. Isi semua data wajib (ditandai *):
   - **Data Pribadi**: Nama lengkap, NIK (16 digit), No. HP (format: 628xxx), Email
   - **Alamat**: Jalan, Kota, Provinsi
   - **Paket & Kloter**: pilih dari dropdown (diisi Owner sebelumnya)
   - **Kesehatan**: isi jika ada kondisi khusus
3. Klik **Simpan Jamaah**
4. Sistem otomatis:
   - Simpan data ke sheet Jamaah
   - Generate invoice DP
   - Kirim notifikasi WA ke jamaah (jika WA API sudah dikonfigurasi)

**Tips:**
- NIK harus tepat 16 digit, tidak boleh salah
- No. HP harus format 628xxx (tanpa +, tanpa 0 di depan)
- Pilih paket dulu baru pilih group/kloter

---

## Melihat dan Mencari Daftar Jamaah

1. Menu 🕌 Kelana → **Daftar Jamaah**
2. Gunakan kotak pencarian di atas untuk cari berdasarkan nama atau NIK
3. Filter tersedia:
   - **Per Kloter/Group**: lihat jamaah satu kloter saja
   - **Status Dokumen**: filter yang sudah/belum lengkap dokumennya
   - **Status Pembayaran**: filter yang sudah/belum lunas

### Lihat Detail Jamaah
- Klik nama jamaah → popup detail muncul
- Bisa lihat semua data: pribadi, paket, dokumen, status bayar

### Edit Data Jamaah
- Klik ikon edit di baris jamaah
- Ubah data yang perlu dikoreksi
- Klik **Simpan Perubahan**

### Hapus Jamaah
> ⚠️ Admin **tidak bisa** menghapus jamaah. Jika ada data yang perlu dihapus, minta Owner.

---

## Membuat Roomlist

Roomlist adalah pengaturan kamar hotel untuk jamaah di Madinah dan Makkah.

1. Menu 🕌 Kelana → **Roomlist**
2. Pilih **Group/Kloter** dari dropdown
3. Pilih tab lokasi: **Madinah** atau **Makkah** (penempatan keduanya **terpisah**)
4. Klik **Auto-Assign** → sistem otomatis atur kamar berdasarkan jenis kelamin
5. Atau atur manual: **drag & drop** nama jamaah dari panel "Belum Ditempatkan" ke kamar
6. Klik **Simpan**

**Membaca tanda di kartu jamaah:**
- 🟣 **Titik berwarna** = penanda **satu keluarga**. Jamaah dengan `ID Keluarga` sama
  mendapat **warna yang sama**, supaya mudah ditempatkan sekamar/berdekatan.
- **♂ / ♀** = jenis kelamin (laki-laki / perempuan).
- Keterangan tanda ini juga ditampilkan di atas daftar "Belum Ditempatkan".

**Catatan penting:**
- Penempatan **Madinah dan Makkah dibuat terpisah**. Daftar "Belum Ditempatkan" hanya
  menampilkan jamaah yang belum punya kamar **di lokasi/tab yang sedang dibuka**.
- Klik tombol **(✕)** pada nama di sebuah kamar → jamaah **langsung kembali** ke daftar
  "Belum Ditempatkan" untuk lokasi tersebut.
- Jangan lupa klik **Simpan** — penghapusan/pemindahan baru tersimpan permanen setelah disimpan.
- Jamaah laki-laki dan perempuan dipisah otomatis saat Auto-Assign.
- Kapasitas kamar: Double 2, Triple 3, Quad 4 orang.

---

## Membuat Manifest

Manifest adalah daftar penumpang untuk keperluan penerbangan.

1. Menu 🕌 Kelana → **Manifest**
2. Pilih **Group/Kloter**
3. Isi data penerbangan:
   - No. Penerbangan (contoh: GA-401)
   - Tanggal Berangkat
   - Kota Asal & Tujuan
4. Di tab **Jamaah Eligible**: centang jamaah yang dokumennya lengkap
5. Isi **No. Kursi** untuk setiap jamaah
6. Tab **Belum Lengkap**: cek siapa yang masih kurang dokumen
7. Klik **Generate Manifest**
8. Klik **Export/Print** untuk cetak atau simpan PDF

> Jamaah akan muncul di tab "Belum Lengkap" jika passport/visa belum diinput di modul Dokumen.

---

## Mengelola Dokumen Jamaah (untuk SISKOPATUH)

Menu **Dokumen** dipakai untuk melengkapi data paspor/visa & berkas jamaah —
inilah data yang nantinya dipakai untuk SISKOPATUH dan Manifest.

1. Menu 🕌 Kelana → **Dokumen** (atau menu Dokumen di web app)
2. Klik nama jamaah di daftar → panel detail muncul di kanan
3. Isi **Data Paspor & Visa**:
   - No KTP (NIK), No Paspor
   - Tgl Terbit Paspor, **Tgl Berlaku Paspor** (wajib SISKOPATUH — paspor minimal berlaku
     6 bulan sebelum keberangkatan)
   - No Visa, Tgl Berlaku Visa
4. Klik **Simpan Data Dokumen**
5. **Upload berkas**: Pas Foto 4×6 (background putih), Foto KTP, Foto Paspor, Foto Visa,
   serta Kartu Kuning/ICV (vaksin meningitis)

> Status dokumen (**Lengkap / Proses / Belum Lengkap**) dihitung otomatis dari kelengkapan
> No Paspor, Tgl Berlaku Paspor, Foto KTP, dan Foto Paspor. Status ini muncul di Daftar
> Jamaah dan menentukan apakah jamaah bisa masuk Manifest.

---

## Ekspor Data ke SISKOPATUH

Fitur ini membuat data jamaah **siap diunggah ke SISKOPATUH (Kemenag)** tanpa input ulang.

1. Menu 🕌 Kelana → **Ekspor SISKOPATUH** (atau menu SISKOPATUH di web app)
2. Pilih **Kloter** (atau Semua Kloter)
3. Lihat ringkasan **kesiapan**: berapa jamaah yang **Siap** dan berapa yang **Belum**
4. Tabel menampilkan, per jamaah, **field apa saja yang masih kurang** → lengkapi dulu
   lewat menu Tambah/Edit Jamaah dan Dokumen
5. Klik:
   - **CSV Siap-Unggah** → hanya jamaah yang datanya lengkap (anti-ditolak saat unggah)
   - **CSV Semua** → semua jamaah (termasuk yang belum lengkap)
   - **Excel** → file `.xlsx` asli (langsung dibuka di Excel/Spreadsheet)
   - **Cetak Rekap** → tampilan cetak; sel kosong disorot merah
6. Buka file di Excel → salin ke template unggah massal SISKOPATUH

> File CSV sudah memakai format Kemenag (tanggal DD-MM-YYYY, jenis kelamin LAKI-LAKI/PEREMPUAN,
> no HP 08xxx). Field wajib SISKOPATUH yang dicek: NIK, nama, tempat & tgl lahir, nama ayah,
> pekerjaan, alamat + provinsi/kabupaten, no HP, paspor + masa berlaku, vaksin meningitis,
> serta mahram (untuk jamaah perempuan).

---

---

# 💰 PANDUAN FINANCE

**Anda bisa mengakses: Pembayaran, Laporan Keuangan, Dashboard, Daftar Jamaah (lihat saja).**  
**Anda tidak bisa: Tambah/hapus jamaah, Roomlist, Manifest, Kelola Pengguna.**

---

## Cara Membuka Sistem

1. Buka **Google Spreadsheet** Kelana dari link yang diberikan Owner
2. Klik menu **🕌 Kelana** di bar menu atas
3. Klik **Pembayaran** untuk mulai bekerja

---

## Melihat Daftar Invoice

1. Menu 🕌 Kelana → **Pembayaran**
2. Tampil semua invoice dengan status:
   - 🟡 **Pending** — belum bayar
   - 🔴 **Jatuh Tempo** — sudah lewat tanggal jatuh tempo
   - 🟢 **Lunas** — sudah bayar dan dikonfirmasi
3. Filter tersedia:
   - Filter by **Status** (Pending/Lunas/Jatuh Tempo)
   - Filter by **Jenis** (DP/Pelunasan)

---

## Konfirmasi Pembayaran Manual

Ketika jamaah sudah transfer dan kirim bukti ke WA/email:

1. Temukan invoice di daftar (cari nama/ID jamaah)
2. Klik tombol **Konfirm** (hijau) di baris invoice tersebut
3. Isi form konfirmasi:
   - **Metode Bayar**: Transfer Bank / QRIS / Tunai / Xendit
   - **Catatan** (opsional): nomor referensi transfer, dsb.
4. Klik **Konfirmasi Pembayaran**
5. Sistem otomatis:
   - Update status invoice menjadi **Lunas**
   - Catat tanggal konfirmasi + nama Finance yang konfirmasi
   - Kirim notifikasi WA ke jamaah

---

## Mengirim Reminder Pembayaran

Untuk jamaah yang belum bayar atau sudah jatuh tempo:

1. Temukan invoice di daftar
2. Klik tombol **📲 WA** (kuning) di baris invoice
3. Pesan reminder otomatis terkirim ke nomor HP jamaah

---

## Generate Invoice Pelunasan

Setelah jamaah lunas DP dan siap bayar pelunasan:

1. Di halaman Pembayaran → klik tombol **Generate Pelunasan**
2. Cari nama atau ID jamaah di kotak pencarian
3. Pilih jamaah dari hasil pencarian
4. Klik **Generate Invoice Pelunasan**
5. Invoice pelunasan otomatis dibuat dan dikirim via WA

> Pastikan jamaah sudah lunas DP sebelum generate pelunasan.

---

## Laporan Keuangan

1. Di halaman Pembayaran → scroll ke bawah
2. Lihat tabel laporan per kloter:
   - **Total Tagihan**: semua yang harus dibayar
   - **Total Lunas**: yang sudah masuk rekening
   - **Total Pending**: yang masih belum bayar
   - **Total Jatuh Tempo**: yang perlu ditindaklanjuti segera
   - **% Lunas**: progress pelunasan kloter

---

---

# 📣 PANDUAN MARKETING

**Anda bisa mengakses: Tambah Jamaah, Daftar Jamaah (lihat saja), WA Blast.**  
**Anda tidak bisa: Pembayaran, Laporan Keuangan, Roomlist, Manifest, Hapus Jamaah, Kelola Pengguna.**

---

## Cara Membuka Sistem

1. Buka **Google Spreadsheet** Kelana dari link yang diberikan Owner
2. Klik menu **🕌 Kelana** di bar menu atas

---

## Mendaftarkan Jamaah Baru

1. Menu 🕌 Kelana → **Tambah Jamaah**
2. Isi data jamaah:
   - **Nama Lengkap**: sesuai KTP/Paspor
   - **NIK**: 16 digit nomor KTP
   - **No. HP**: format 628xxx (contoh: 6281234567890)
   - **Email**: opsional, jika punya
   - **Alamat**: lengkap
   - **Paket**: pilih paket yang dibeli jamaah
   - **Group/Kloter**: pilih kloter keberangkatan
3. Klik **Simpan Jamaah**
4. WhatsApp otomatis terkirim ke jamaah berisi:
   - Konfirmasi pendaftaran
   - Nominal DP yang harus dibayar
   - Nomor rekening travel
   - Batas waktu pembayaran DP

**Tips Marketing:**
- Pastikan nomor HP jamaah sudah benar sebelum simpan
- Tanyakan kloter yang diinginkan sebelum input
- Jika jamaah ragu dengan paket, konsultasikan ke Owner dulu

---

## Melihat Daftar Jamaah

1. Menu 🕌 Kelana → **Daftar Jamaah**
2. Bisa lihat semua jamaah yang sudah terdaftar
3. Bisa filter per kloter untuk lihat siapa saja yang daftar di kloter tertentu

> ℹ️ Marketing hanya bisa **melihat** data jamaah, tidak bisa mengedit atau menghapus.

---

## Kirim WA Blast ke Jamaah

Untuk mengirim pesan massal ke semua jamaah di satu kloter:

1. Menu 🕌 Kelana → **WA Blast**
2. Pilih **Group/Kloter** yang dituju
3. Pilih **Template Pesan**:

   | Template | Untuk Kapan |
   |----------|------------|
   | **Manasik** | Undangan acara manasik |
   | **Checklist Dokumen** | Reminder dokumen yang harus disiapkan |
   | **Kumpul/Gathering** | Info titik kumpul sebelum berangkat |

4. Untuk template **Kumpul**, isi tambahan:
   - Jam kumpul
   - Lokasi kumpul
5. Lihat **Preview Pesan** di sebelah kanan untuk pastikan isi pesan sudah benar
6. Klik **Kirim ke Semua Jamaah**
7. Konfirmasi → pesan terkirim satu per satu

> ⚠️ Kirim WA Blast hanya saat ada keperluan nyata. Terlalu sering blast bisa membuat jamaah unsubscribe.

---

---

# ❓ PERTANYAAN UMUM

**Q: Saya tidak bisa login / akses ditolak**  
A: Pastikan Anda membuka spreadsheet dengan email yang sudah didaftarkan oleh Owner. Hubungi Owner untuk mendaftarkan email Anda.

**Q: Tombol/menu tidak muncul**  
A: Klik menu 🕌 Kelana di bar atas → pilih fitur yang diinginkan. Jika menu tidak muncul, refresh halaman (F5).

**Q: WA tidak terkirim ke jamaah**  
A: Hubungi Owner atau Admin untuk cek konfigurasi WA API di sheet Config.

**Q: Data yang saya input hilang / berubah**  
A: Hubungi Owner untuk cek Log Aktivitas — akan terlihat siapa yang mengubah data tersebut.

**Q: Saya tidak bisa akses fitur tertentu**  
A: Mungkin peran Anda tidak memiliki izin untuk fitur itu. Lihat tabel hak akses di bagian peran Anda, atau hubungi Owner untuk perubahan peran.

---

*Kelana v1.0 — Panduan Pengguna*  
*Hubungi Owner travel Anda untuk bantuan teknis*
