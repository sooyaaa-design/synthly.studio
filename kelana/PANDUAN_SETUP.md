# 📖 PANDUAN SETUP KELANA
## Sistem Manajemen Umroh — Langkah demi Langkah
*Untuk pengguna awam, tidak perlu keahlian coding*

---

## ⏱ Estimasi Waktu Setup: 30–45 menit

---

## BAGIAN 1: PERSIAPAN (5 menit)

Sebelum mulai, pastikan Anda punya akun **Google** (Gmail).
Siapkan juga:
- [ ] API Key **Fonnte** (untuk kirim WA) → daftar di fonnte.com
- [ ] No. HP pengirim WA di Fonnte (yang sudah terhubung)
- [ ] (Opsional) API Key **Xendit** jika ingin pembayaran otomatis

---

## BAGIAN 2: BUAT GOOGLE SPREADSHEET (5 menit)

1. Buka **sheets.google.com**
2. Klik tombol **+** (Buat spreadsheet baru)
3. Beri nama: **"Kelana - [Nama Travel Anda]"**  
   Contoh: *"Kelana - Al-Barokah Travel"*
4. Catat link spreadsheet ini (dari address bar browser)

---

## BAGIAN 3: BUKA APPS SCRIPT (2 menit)

1. Di spreadsheet tadi, klik menu: **Extensions** (atau Ekstensi) → **Apps Script**
2. Akan terbuka tab baru → editor Apps Script
3. Di sebelah kiri ada file bernama `Code.gs` — **biarkan dulu**

---

## BAGIAN 4: UPLOAD SEMUA FILE KE APPS SCRIPT (15 menit)

Ini bagian terpenting. Anda perlu membuat file satu per satu dan paste kodenya.

### Cara buat file baru di Apps Script:
> Klik tanda **+** di sebelah "Files" (kiri atas) → pilih **Script** (untuk .gs) atau **HTML**

---

### FILE .GS yang perlu dibuat (7 file):

| Nama File | Isi Konten Dari |
|-----------|----------------|
| `Setup.gs` | File Setup.gs dari folder kelana |
| `Code.gs` | File Code.gs dari folder kelana (GANTI yang sudah ada) |
| `CodeAdditions.gs` | File Code.additions.gs dari folder kelana |
| `Roomlist.gs` | File Roomlist.gs dari folder kelana |
| `Manifest.gs` | File Manifest.gs dari folder kelana |
| `Siskopatuh.gs` | File Siskopatuh.gs dari folder kelana (ekspor SISKOPATUH) |
| `Webhook.gs` | File Webhook.gs dari folder kelana |

**Cara paste:** Buka file di folder `kelana/`, salin semua isi (Ctrl+A → Ctrl+C),  
lalu paste ke file yang sudah dibuat di Apps Script (Ctrl+V).

---

### FILE .HTML yang perlu dibuat (8 file):

Saat membuat file HTML, pilih **HTML** (bukan Script).

| Nama File di Apps Script | Isi Dari File |
|--------------------------|--------------|
| `Index` | Index.html |
| `Dashboard` | Dashboard.html |
| `TambahJamaah` | TambahJamaah.html |
| `DaftarJamaah` | DaftarJamaah.html |
| `Pembayaran` | Pembayaran.html |
| `Roomlist` | Roomlist.html |
| `Manifest` | Manifest.html |
| `Siskopatuh` | Siskopatuh.html |
| `WaBlast` | WaBlast.html |

> ⚠️ **Penting:** Nama file HTML di Apps Script **TANPA** ekstensi `.html`  
> Contoh: buat file bernama `Index` (bukan `Index.html`)

---

## BAGIAN 5: SIMPAN DAN SETUP AWAL (5 menit)

1. Klik **💾 Save** (Ctrl+S) untuk menyimpan semua file
2. Kembali ke **Google Spreadsheet** Anda
3. **Refresh halaman** (F5) — tunggu beberapa detik
4. Akan muncul menu baru di atas: **🕌 Kelana**
5. Klik **🕌 Kelana** → **Setup Awal (pertama kali)**
6. Google akan minta izin → klik **Lanjutkan** → klik **Izinkan**
7. Tunggu hingga muncul notifikasi "Setup berhasil"

> Setelah setup, spreadsheet Anda akan otomatis punya semua sheet:  
> Jamaah, Group, Lead, Pembayaran, Dokumen, Roomlist, Manifest, Paket, AddOn, Petugas,
> Config, Log Aktivitas
>
> **Setup Awal aman dijalankan berulang (idempoten).** Selain membuat sheet, ia juga
> menambah kolom baru bila ada update sistem (mis. **ID Paket** di Group, **Tambahan
> Triple/Double** di Paket, kolom SISKOPATUH/Keluarga di Jamaah, header Petugas) **tanpa
> menghapus data**. Jalankan ulang setiap kali memperbarui kode.

> ⏰ **WAJIB: atur Zona Waktu project.** Buka Apps Script → **⚙️ Project Settings** →
> **Time zone** → pilih **(GMT+07:00) Asia/Jakarta**. Tanpa ini, status kloter
> (Aktif/Berjalan/Selesai) dan tanggal jatuh tempo bisa meleset karena server memakai jam
> default-nya.

---

## BAGIAN 6: ISI KONFIGURASI (5 menit)

1. Di spreadsheet, klik tab **Config** (di bawah)
2. Isi nilai di kolom **Value** untuk baris-baris berikut:

| Key | Isi Dengan |
|-----|-----------|
| `NAMA_TRAVEL` | Nama travel Anda, contoh: *Al-Barokah Travel* |
| `TELEPON_TRAVEL` | No HP/WA travel, contoh: *6281234567890* |
| `EMAIL_TRAVEL` | Email travel Anda |
| `WA_API_KEY` | API Key dari fonnte.com |
| `WA_SENDER` | No HP pengirim WA di Fonnte (format: 628xxx) |
| `NAMA_BANK` | Nama bank rekening travel |
| `NO_REKENING` | Nomor rekening |
| `ATAS_NAMA` | Nama pemilik rekening |

---

## BAGIAN 7: BUAT PAKET DAN GROUP (5 menit)

### Buat Paket Umroh:
1. Klik tab sheet **Paket**
2. Isi baris baru dengan data paket Anda:
   - ID Paket: bisa pakai kode singkat (contoh: `PKT-001`)
   - Nama Paket, Harga, DP Minimal, Durasi, Hotel Madinah, Hotel Makkah
   - Kolom Aktif: isi `TRUE`

### Buat Group / Kloter:
1. Klik tab sheet **Group**
2. Isi baris baru:
   - ID Group (contoh: `GRP-2025-01`)
   - Nama Group, Tgl Berangkat, Tgl Pulang, Maskapai, Kapasitas
   - Status Group: isi `Aktif`

---

## BAGIAN 8: CARA MENGGUNAKAN SISTEM

Setelah setup selesai, cara pakai sehari-hari:

### Buka Kelana:
- Di Google Spreadsheet → klik **🕌 Kelana** → **Dashboard**
- Panel navigasi akan muncul di sisi kanan

### Tambah Jamaah Baru:
1. Klik tombol **👤 Tambah Jamaah** di sidebar
2. Isi semua data jamaah
3. Pilih Paket dan Group
4. Klik **Simpan** → Invoice DP otomatis dikirim via WA ke jamaah

### Lihat Daftar Jamaah:
- Klik **📋 Daftar Jamaah** → bisa search, filter per group/status

### Kelola Pembayaran:
- Klik **💳 Pembayaran** → lihat semua invoice
- Klik **✓ Konfirm** untuk konfirmasi pembayaran manual
- Klik **📲 WA** untuk kirim reminder ke jamaah

### Buat Roomlist:
- Klik **🏨 Roomlist** → pilih group → auto-assign atau drag & drop manual

### Generate Manifest:
- Klik **✈ Manifest** → pilih group → isi data penerbangan → Generate → Export/Print

### WA Blast ke Semua Jamaah:
- Klik menu **🕌 Kelana** → **WA Blast**
- Pilih group + template pesan (Manasik / Checklist / Kumpul)
- Klik **Kirim**

---

## BAGIAN 9: SETUP WEBHOOK XENDIT (Opsional — untuk pembayaran otomatis)

Jika ingin konfirmasi pembayaran otomatis dari Xendit:

1. Di Apps Script, klik **Deploy** (kanan atas) → **New Deployment**
2. Pilih **Web App**
3. Setting:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik **Deploy** → salin URL yang muncul
5. Masuk ke **Dashboard Xendit** → Settings → Webhooks
6. Paste URL tadi sebagai webhook endpoint
7. Aktifkan event: `invoice.paid`

---

## BAGIAN 10: UNTUK DIJUAL KE TRAVEL LAIN

Untuk setiap client travel baru:
1. Buat Google Spreadsheet baru
2. Copy semua file Apps Script ke project baru
3. Jalankan Setup Awal
4. Isi Config dengan data travel tersebut
5. Selesai! Setiap travel punya spreadsheet terpisah

### Harga Langganan yang Disarankan:

| Paket | Harga/Bulan | Untuk |
|-------|-------------|-------|
| Starter | Rp 199.000 | Travel baru, 1-4 kloter/tahun |
| Growth | Rp 449.000 | Travel aktif, 5-11 kloter/tahun |
| Pro | Rp 849.000 | Travel besar, unlimited kloter |

---

## ❓ TROUBLESHOOTING

**Q: Menu 🕌 Kelana tidak muncul setelah refresh**  
A: Buka Apps Script → klik Run → pilih fungsi `onOpen` → klik Run

**Q: Muncul error "Izin diperlukan" saat Setup Awal**  
A: Klik "Izinkan", pilih akun Google Anda, lanjutkan — ini normal untuk pertama kali

**Q: WA tidak terkirim**  
A: Periksa API Key dan WA_SENDER di sheet Config. Pastikan format no HP 628xxx

**Q: Invoice tidak ter-generate**  
A: Pastikan data Paket dan Group sudah diisi di sheet-nya masing-masing

**Q: Error "Sheet tidak ditemukan"**  
A: Jalankan ulang Setup Awal dari menu 🕌 Kelana

---

## 📞 BUTUH BANTUAN?

Simpan dokumen ini dan hubungi developer jika ada kendala teknis.

*Kelana v1.0 — Google Apps Script Edition*
