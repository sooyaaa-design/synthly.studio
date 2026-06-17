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

### Buat Paket Baru (sumber harga)
**Paket adalah tempat mengatur HARGA.** Kloter tinggal memilih paket, dan harga jamaah
otomatis mengikuti paket tersebut.
1. Buka halaman **Paket** di sidebar (grup Utama), klik **+ Tambah Paket**
2. Isi:
   - Nama Paket (contoh: Paket Nyaman Plus)
   - **Harga Quad / orang** (harga dasar kamar berempat)
   - **Tambahan Triple** & **Tambahan Double** (biaya upgrade di atas Quad)
   - DP Minimal, Durasi (hari), Hotel Madinah/Makkah (acuan)
   - Status: Aktif / Nonaktif
3. Preview harga Quad/Triple/Double muncul saat mengisi.

### Buat Kloter / Group
1. Di halaman **Kloter**, klik **+ Tambah Kloter**
2. Isi data: Nama, Tanggal Berangkat/Pulang, Maskapai, Penerbangan, **Hotel**, Kapasitas.
3. **Pilih Paket** — harga kloter & jamaah otomatis mengikuti paket (tidak lagi mengetik
   harga manual di kloter). Preview harga muncul setelah paket dipilih.
4. **Pembimbing** bisa dipilih dari daftar petugas terdaftar (atau ketik manual).
5. Status kloter **otomatis dari tanggal**:
   - **Aktif/Draft** — belum tiba tanggal berangkat
   - **Berjalan** — sudah lewat tanggal berangkat, belum lewat tanggal pulang
   - **Selesai** — sudah lewat tanggal pulang
   > Agar status akurat, pastikan **timezone project = Asia/Jakarta** (Project Settings).
6. Untuk kloter serupa, klik **Duplikasi** pada kloter yang ada.

> 💡 **Kloter lama** yang sudah punya harga sendiri tetap berfungsi; tinggal buka & pilih
> paket bila ingin pindah ke model harga-di-paket.

### Petugas (Tour Leader / Pembimbing / Muthawif)
1. Buka halaman **Petugas** di sidebar (grup Admin)
2. Klik **+ Tambah Petugas**, isi data lengkap (NIK, paspor, peran, dll.)
   - **Peran** sesuai Kemenag: Pembimbing Ibadah (TPIHI), Ketua Kloter, Ketua Rombongan,
     Tour Leader, Muthawif, Handling.
   - Pilih **Kloter** tempat petugas bertugas.
3. Petugas yang sudah dipilihkan kloter akan **muncul di Roomlist** kloter tersebut dan bisa
   ditempatkan di kamar (ditandai 🧑‍✈️).

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
   - **Paket & Kloter**: cukup **pilih Kloter** — **Paket & harga terisi otomatis** dari
     kloter tsb. Harga per jamaah langsung tampil sesuai tipe kamar yang dipilih.
     (Kloter berstatus "Selesai" tidak muncul di pilihan.)
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

## Mendaftarkan Keluarga / Rombongan & Menentukan PIC

Banyak jamaah mendaftar bersama (suami-istri, satu keluarga, rombongan). Agar mudah
ditagih dan disusun roomlist-nya, kelompokkan mereka:

**Cara cepat — Tambah Rombongan (banyak sekaligus):**
1. Di halaman **Jamaah** klik **Tambah rombongan**
2. Pilih **Paket, Kloter, Tipe Kamar** (berlaku untuk semua anggota)
3. Isi tiap anggota: Nama, NIK, JK, No HP, dan **Hubungan** (Suami/Istri/Anak/…)
4. Pilih satu anggota sebagai **PIC** (penanggung jawab — yang dihubungi untuk pembayaran)
5. Klik **Simpan Rombongan**

**Cara per orang — lewat form jamaah:**
- Pada form Tambah/Edit Jamaah ada bagian **Keluarga / Rombongan**:
  - **Keluarga**: pilih keluarga yang sudah ada, atau "+ Buat keluarga/rombongan baru"
  - **Hubungan dalam Keluarga**
  - Centang **PIC** bila orang ini penanggung jawab (otomatis PIC lama digeser)

**Hasilnya:**
- Di tabel jamaah muncul **titik warna** (satu warna = satu keluarga) & label **PIC**
- Detail jamaah menampilkan anggota keluarga, PIC + tombol WA, dan **Pasangan** (suami/istri)
- Di **Roomlist**, pasangan suami-istri ditandai **💑** agar mudah ditempatkan sekamar
- Di **Pembayaran → Per Keluarga**, tagihan seluruh anggota dijumlahkan per keluarga

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
- 💑 = pasangan suami-istri (tempatkan sekamar).
- 🧑‍✈️ = **petugas kloter** (pembimbing/tour leader/muthawif). Petugas yang sudah
  dipilihkan kloter muncul di bagian **"Petugas Kloter"** pada daftar Belum Ditempatkan dan
  bisa di-drag ke kamar seperti jamaah.
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

## Halaman Pembayaran (tampilan keuangan)

Di bagian atas ada **ringkasan KPI**: Total Tagihan, Diterima, Outstanding (belum lunas),
Jatuh Tempo (jumlah tagihan + nominal), dan Diterima Bulan Ini.

Ada dua tab:
- **Per Invoice** — daftar semua invoice. Kolom: Invoice, Jamaah, Jenis, Nominal, Status,
  **Metode**, **Tgl & Jam Bayar**, **Bukti**. Klik baris mana pun untuk membuka **detail**.
- **Per Keluarga** — tagihan dijumlahkan per keluarga/rombongan, lengkap dengan PIC dan
  tombol **Hubungi PIC** (WA berisi sisa tagihan keluarga).

Status invoice:
- 🟡 **Pending** — belum bayar · 🔴 **Jatuh Tempo** — lewat tanggal · 🟢 **Lunas** — sudah dikonfirmasi

**Detail pembayaran (klik baris):** menampilkan timeline (dibuat → jatuh tempo → dibayar
dengan jam), metode, **bukti pembayaran**, siapa yang mengonfirmasi, catatan, **rincian
pemesanan** (pax, anggota, paket, tipe kamar, add-on, total vs dibayar vs sisa), dan riwayat
pembayaran jamaah tersebut.

---

## Konfirmasi Pembayaran Manual (dengan bukti)

Ketika jamaah sudah transfer dan kirim bukti ke WA/email:

1. Temukan invoice di daftar (cari nama/ID jamaah)
2. Klik tombol **Konfirm** (hijau) di baris invoice tersebut
3. Isi form konfirmasi:
   - **Metode Bayar**: Transfer Bank / QRIS / Tunai / Xendit
   - **Bukti Pembayaran**: unggah foto/scan bukti transfer (maks 5MB) — opsional tapi sangat
     dianjurkan; tersimpan aman di Google Drive dan bisa dibuka kembali dari detail/invoice
   - **Catatan** (opsional): nomor referensi transfer, dsb.
4. Klik **Konfirmasi**
5. Sistem otomatis:
   - Update status invoice menjadi **Lunas**
   - Perbarui **status pembayaran jamaah**: **Belum Bayar → DP Lunas → Lunas**
     (yang baru bayar DP berstatus **DP Lunas**, bukan langsung Lunas)
   - **Jika yang dikonfirmasi adalah DP**, otomatis **membuat invoice Pelunasan** lengkap
     dengan tanggal jatuh tempo (= tanggal berangkat − batas pelunasan, default 45 hari)
   - Catat **tanggal + jam** konfirmasi & nama Finance yang konfirmasi
   - Simpan tautan bukti, kirim notifikasi WA ke jamaah

---

## Add-on / Upgrade (biaya tambahan)

Untuk biaya tambahan di luar paket (tambah malam hotel, extra bagasi, kursi roda, upgrade
maskapai, dll):

1. Buka **detail pembayaran** salah satu invoice jamaah ybs → klik **Kelola Add-on / Upgrade**
2. Tambah item: Nama, Kategori, Harga, Catatan
3. Add-on akan **otomatis ikut tertagih saat Generate Pelunasan** (total = harga kamar +
   semua add-on − yang sudah dibayar)

> Catatan: tambahkan add-on **sebelum** membuat invoice pelunasan. Bila pelunasan sudah dibuat,
> regenerasi invoice atau buat tagihan tambahan terpisah.

---

## Mengirim Reminder Pembayaran

Untuk jamaah yang belum bayar atau sudah jatuh tempo:

1. Temukan invoice di daftar
2. Klik tombol **📲 WA** di baris invoice — tombol ini **hanya muncul pada invoice yang
   belum lunas** (tidak bisa mengirim reminder ke invoice yang sudah Lunas)
3. Pesan reminder otomatis terkirim ke nomor HP jamaah

---

## Invoice Pelunasan

**Otomatis:** begitu **DP dikonfirmasi**, invoice Pelunasan langsung dibuat beserta jatuh
temponya — Finance tidak perlu membuat manual untuk kasus normal.

**Manual (bila perlu):** untuk kasus khusus (mis. pelunasan dibuat ulang setelah tambah
add-on), tetap tersedia tombol **Generate Pelunasan**:
1. Klik **Generate Pelunasan** → cari & pilih jamaah → **Generate Invoice Pelunasan**
2. Nominal = (harga kamar + semua add-on) − total yang sudah dibayar.

> Tambahkan **add-on sebelum** DP dikonfirmasi agar langsung ikut tertagih di pelunasan
> otomatis. Bila ditambah setelahnya, buat ulang invoice pelunasan.

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
   - **Kloter**: pilih kloter keberangkatan — **Paket & harga otomatis mengikuti** kloter
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
