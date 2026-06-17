# 🛠 PANDUAN SERVER ADMIN — KELANA
## Panduan Pengelola Produk (Anda sebagai pemilik Kelana)
*Dokumen Internal — Jangan dibagikan ke client*

---

## GAMBARAN ARSITEKTUR

```
[License Server GAS]  ←→  [Client Spreadsheet 1]
                      ←→  [Client Spreadsheet 2]
                      ←→  [Client Spreadsheet N]
```

- **License Server**: 1 Google Apps Script Web App yang Anda deploy sendiri
- **Client**: Setiap travel umroh punya 1 Google Spreadsheet berisi Apps Script
- **Komunikasi**: Client memanggil License Server via `UrlFetchApp.fetch()` setiap 6 jam (cache)

---

## BAGIAN 1: SETUP LICENSE SERVER (Sekali saja)

### 1.1 Buat Spreadsheet License Server
1. Buka [sheets.google.com](https://sheets.google.com) dengan akun Google Anda
2. Buat spreadsheet baru: **"Kelana — License Server"**
3. **Tidak perlu membuat sheet manual.** Sheet `Lisensi` (database) dan `Log Akses` (log)
   dibuat **otomatis** saat pertama kali server dipakai.

### 1.2 Upload File ke Apps Script (WAJIB dua file)
1. Di spreadsheet → **Extensions → Apps Script**
2. Hapus isi `Code.gs` yang ada
3. Buat/isi file **`LicenseServer.gs`** → paste isi file `kelana/LicenseServer.gs`
4. Buat file HTML baru bernama **`LicenseAdmin`** (File → + → HTML) → paste isi
   `kelana/LicenseAdmin.html`
   > ⚠️ **Tanpa file `LicenseAdmin` ini, panel admin tidak akan terbuka** dan tombol
   > "Buat Lisensi Baru" gagal. Cukup dua file ini saja — **jangan** menyalin file client
   > (Roles.gs, WebApp.gs, dll.) ke project server.
5. Simpan (Ctrl+S)

### 1.3 Set Password Admin Server (WAJIB)
**Tidak ada password default lagi** — endpoint admin akan menolak semua request sampai
`ADMIN_PASS` diset. Pilih salah satu cara:

**Cara A — Script Properties (UI):**
1. Di Apps Script → klik **Project Settings** (ikon gear ⚙ di kiri)
2. Scroll ke **Script Properties** → klik **Edit Script Properties**
3. Tambah property: Key `ADMIN_PASS`, Value password kuat Anda → **Save**

**Cara B — lewat editor (1 baris):**
1. Di editor License Server, pilih fungsi **`setAdminPass`**
2. Edit sementara argumennya, mis. buat fungsi: `function setMyPass(){ setAdminPass('R4has!aKuat2026'); }`
3. Run → selesai (password min. 8 karakter).

> ⚠️ Jangan share password ini ke siapapun. Ini adalah akses penuh ke semua lisensi client.
> Jika sebelumnya Anda memakai default lama `kelana2025`, **wajib** set ulang dengan cara di atas.

### 1.4 Deploy sebagai Web App
1. Klik tombol **Deploy** (kanan atas) → **New Deployment**
2. Klik ikon ⚙ di sebelah "Select type" → pilih **Web app**
3. Setting:
   - **Description**: `Kelana License Server v1`
   - **Execute as**: `Me` (akun Anda)
   - **Who has access**: `Anyone`
4. Klik **Deploy**
5. **SALIN URL yang muncul** — ini `LICENSE_SERVER_URL` yang akan diberikan ke setiap client

Contoh URL: `https://script.google.com/macros/s/AKfycb.../exec`

> ⚠️ Setiap kali Anda update kode LicenseServer.gs, buat deployment baru (bukan edit yang lama) agar URL tidak berubah.

### 1.5 Buka License Admin Panel
1. **Refresh** spreadsheet License Server (tutup-buka / F5). Akan muncul menu baru di atas:
   **🔑 License Manager**.
2. Klik **🔑 License Manager → Buka Admin Panel**.
   - (Pertama kali Google minta izin → Lanjutkan → Izinkan.)
3. Masukkan **ADMIN_PASS** yang sudah di-set di langkah 1.3.

> Jika menu belum muncul, jalankan fungsi `onOpen` sekali dari editor, lalu refresh.
> Membuka panel **harus lewat menu ini** (bukan tombol Run di editor), karena panel berupa
> dialog di dalam spreadsheet.

---

## BAGIAN 2: ONBOARDING CLIENT BARU

### Langkah per client:

#### Step 1: Buat Spreadsheet Client
1. Buat Google Spreadsheet baru: `"Kelana — [Nama Travel]"`
2. Share spreadsheet ke email Owner travel (editor access)

#### Step 2: Upload Semua File Apps Script
Upload file-file berikut ke Apps Script spreadsheet client:

**File .gs:**
- `Code.gs`
- `Code.additions.gs` (paste sebagai CodeAdditions.gs)
- `Roomlist.gs`
- `Manifest.gs`
- `Siskopatuh.gs`
- `Webhook.gs`
- `LicenseClient.gs`
- `Roles.gs`
- `WebApp.gs` (untuk versi Web App + login)

**File .html** (nama tanpa .html di Apps Script):
- `App` (untuk versi Web App)
- `Index`
- `Dashboard`
- `TambahJamaah`
- `DaftarJamaah`
- `Pembayaran`
- `Roomlist`
- `Manifest`
- `Siskopatuh`
- `WaBlast`
- `KelolaUser`

#### Step 3: Generate License Key
1. Buka **License Admin Panel** Anda (menu 🔑 License Manager → Buka Admin Panel)
2. Klik **+ Buat Lisensi Baru** (kanan atas)
3. Isi form:
   - Nama Travel (contoh: Al-Barokah Travel) — **wajib**
   - Email PIC / Owner travel
   - Paket: Trial / Starter / Growth / Pro / Enterprise
   - Durasi (hari) & Limit Jamaah (terisi otomatis sesuai paket, bisa diubah)
4. Klik **✨ Buat & Salin Key** → key otomatis terbuat (format `KLN-XXXX-XXXX-XXXX`) dan
   **otomatis tersalin** ke clipboard.
5. **Catat license key ini.**

> Jika muncul **"ADMIN_PASS belum diset"** → ulangi langkah 1.3. Jika muncul **"Akses
> ditolak"** → password yang Anda masukkan salah (tutup & buka panel lagi).

#### Step 4: Isi Config Client
Di spreadsheet client, buka sheet **Config** dan isi:

| Key | Value |
|-----|-------|
| `LICENSE_KEY` | KLN-XXXX-XXXX-XXXX (dari step 3) |
| `LICENSE_URL` | URL License Server Anda |
| `NAMA_TRAVEL` | Nama travel client |
| `TELEPON_TRAVEL` | No HP travel |
| `EMAIL_TRAVEL` | Email Owner travel |
| `WA_API_KEY` | API Key Fonnte milik client |
| `WA_SENDER` | No HP pengirim WA di Fonnte |
| `KELANA_CONTACT` | No WA Anda (untuk client hubungi Anda) |

#### Step 5: Setup Awal
1. Di spreadsheet client → refresh halaman
2. Menu 🕌 Kelana → **Setup Awal (pertama kali)**
3. Google akan minta izin → klik Lanjutkan → Izinkan
4. Tunggu notifikasi "Setup berhasil"

#### Step 6: Tambah Owner Travel sebagai Pengguna
1. Menu 🕌 Kelana → **Kelola Pengguna**
2. Tambah email Owner travel dengan peran **Owner**

#### Step 7: Setup Trigger Lisensi
1. Di Apps Script client → klik Run → jalankan fungsi `setupLicenseTrigger`
2. Ini akan membuat trigger harian yang otomatis cek dan notif jika lisensi hampir expired

#### Step 8: Selesai — Kirim ke Client
Kirimkan ke Owner travel:
- Link spreadsheet
- License key mereka
- Panduan Setup (PANDUAN_SETUP.md) — untuk info awal
- Panduan Pengguna (PANDUAN_PENGGUNA.md) — untuk operasional

---

## BAGIAN 3: KELOLA LISENSI CLIENT

### Buka License Admin
- Dari spreadsheet License Server → menu **🔑 License Manager → Buka Admin Panel**
- Masukkan ADMIN_PASS

### Statistik di License Admin
- **Total**: semua client yang pernah dibuat
- **Aktif**: sedang aktif langganan
- **Hampir Expired**: ≤7 hari lagi habis (perlu follow-up)
- **Nonaktif/Expired**: sudah habis atau dinonaktifkan

### Perpanjang Langganan
1. Klik nama client di tabel
2. Panel kanan → klik **Upgrade/Perpanjang**
3. Isi:
   - Paket baru (atau biarkan sama)
   - **Tambah hari**: jumlah hari yang ditambahkan dari HARI INI
   - Limit jamaah baru (opsional)
4. Klik **Simpan**

Contoh: client bayar 3 bulan → isi "90 hari"

### Upgrade Paket
1. Sama seperti perpanjang, tapi ubah dropdown **Paket**
2. Pilih paket baru (Starter/Growth/Pro/Enterprise)
3. Limit jamaah otomatis mengikuti plan, atau bisa diisi manual
4. Klik **Simpan**

### Nonaktifkan Client (pause langganan)
1. Klik nama client
2. Panel kanan → klik **Nonaktifkan**
3. Client masuk grace period 7 hari (read-only)
4. Setelah 7 hari → sistem terkunci total

### Reaktifkan Client
1. Klik nama client yang Nonaktif
2. Panel kanan → klik **Aktifkan**
3. Client langsung aktif kembali

### Hapus Client Permanen
1. Klik nama client
2. Panel kanan → klik **Hapus** (merah)
3. Konfirmasi → data lisensi terhapus

> ⚠️ Hapus hanya jika client benar-benar tidak akan pakai lagi. Spreadsheet mereka tidak terpengaruh, hanya lisensi yang dihapus (sistem mereka akan locked).

---

## BAGIAN 4: STRUKTUR DATA LICENSE SERVER

### Sheet `Lisensi` (dibuat otomatis)

| Kolom | Isi |
|-------|-----|
| A | License Key (KLN-XXXX-XXXX-XXXX) |
| B | Nama Travel |
| C | Email Owner |
| D | Plan (Trial/Starter/Growth/Pro/Enterprise) |
| E | Status (Aktif/Nonaktif) |
| F | Tanggal Mulai |
| G | Tanggal Expired |
| H | Limit Jamaah |
| I | Limit Kloter |
| J | Catatan |
| K | Tgl Dibuat |
| L | Tgl Update (terakhir diakses/diubah) |

### Sheet `Log Akses` (dibuat otomatis)
Mencatat setiap pengecekan lisensi dari client & hasilnya
(OK / EXPIRED / DENIED_INACTIVE / LIMIT_EXCEEDED / KEY_NOT_FOUND).

---

## BAGIAN 5: HARGA DAN PAKET

### Rekomendasi Harga Jual ke Client

| Paket | Harga/Bulan | Limit Jamaah | Untuk |
|-------|-------------|--------------|-------|
| **Trial** | Gratis (30 hari) | 30 jamaah | Coba-coba |
| **Starter** | Rp 199.000 | 200 jamaah | Travel kecil, 1-4 kloter/tahun |
| **Growth** | Rp 449.000 | 500 jamaah | Travel menengah, 5-11 kloter/tahun |
| **Pro** | Rp 849.000 | Unlimited | Travel besar |
| **Enterprise** | Nego | Unlimited | Jaringan / franchise |

### Paket Tahunan (hemat untuk client, cashflow untuk Anda)
- Starter Tahunan: Rp 1.990.000 (hemat ~Rp 400rb)
- Growth Tahunan: Rp 4.490.000 (hemat ~Rp 900rb)
- Pro Tahunan: Rp 8.490.000 (hemat ~Rp 1.7jt)

---

## BAGIAN 6: ALUR PEMBAYARAN LANGGANAN

### Client Bayar → Anda Aktifkan Lisensi
Karena ini masih manual (Phase 1), alurnya:

1. Client transfer ke rekening Anda
2. Client kirim bukti transfer via WA
3. Anda verifikasi di mutasi rekening
4. Buka License Admin → Perpanjang / Aktifkan lisensi client
5. Konfirmasi ke client via WA

### Otomatiskan di Masa Depan (Phase 2)
Bisa diintegrasikan dengan Xendit untuk pembayaran otomatis lisensi — tapi untuk sekarang manual sudah cukup.

---

## BAGIAN 7: MONITORING DAN MAINTENANCE

### Cek Rutin (Setiap Minggu)
1. Buka License Admin → lihat tab **Hampir Expired**
2. Client dengan ≤7 hari → follow up via WA untuk perpanjangan
3. Client **Nonaktif** sudah lebih dari 7 hari → bisa dihapus atau di-follow up

### Update Sistem
Jika ada bug fix atau fitur baru di file .gs / .html:
1. Edit file di folder `kelana/`
2. Deploy ulang License Server jika yang diupdate adalah `LicenseServer.gs`
   - Deploy → **Manage Deployments** → buat versi baru dari deployment yang ada
3. Untuk update client: kirimkan file yang diupdate ke client, minta mereka paste di Apps Script mereka
   > Fase berikutnya bisa buat sistem update otomatis via trigger

### Backup
- Google Sheets otomatis ada version history
- Untuk backup manual: File → Download → .xlsx
- License Server data ada di sheet Licenses — bisa export jika diperlukan

---

## BAGIAN 8: TROUBLESHOOTING SERVER

**Q: Gagal "Buat Lisensi Baru" / panel admin tidak terbuka / "Error: ... is not a function"**  
A: Hampir selalu karena file di project License Server kurang. Pastikan project **hanya**
berisi **dua** file: `LicenseServer.gs` dan file HTML `LicenseAdmin` (lihat 1.2). File
`LicenseAdmin` wajib ada, dan fungsi `adminAction` sudah termasuk di `LicenseServer.gs`
versi terbaru. Setelah memperbarui kode, **simpan ulang & refresh** spreadsheet.

**Q: Saat buat lisensi muncul "ADMIN_PASS belum diset"**  
A: Jalankan `setAdminPass('passwordKuat')` sekali di editor (lihat 1.3), lalu coba lagi.

**Q: Menu "🔑 License Manager" tidak muncul**  
A: Refresh spreadsheet. Jika masih belum, jalankan fungsi `onOpen` sekali dari editor lalu
refresh. Buka panel lewat menu ini (bukan tombol Run editor).

**Q: Client lapor "Lisensi tidak valid" padahal sudah bayar**  
A: Cek di License Admin, status client. Kemungkinan:
- Key salah diisi → minta client cek sheet Config kolom LICENSE_KEY
- Status Nonaktif → klik Aktifkan
- Expired → klik Perpanjang

**Q: Client lapor sistem tidak bisa kirim WA**  
A: Ini masalah Fonnte API mereka, bukan lisensi. Minta client:
- Cek WA_API_KEY di sheet Config
- Pastikan device WA di Fonnte masih terhubung (scan QR ulang jika perlu)
- Cek saldo Fonnte (jika sistem prepaid)

**Q: License Server tidak bisa diakses (HTTP error)**  
A: Buka Apps Script License Server → Deploy → Manage Deployments
- Pastikan Who has access: Anyone
- Coba buat deployment baru jika perlu

**Q: Client tidak bisa buka menu Kelana**  
A: Instruksikan:
1. Refresh spreadsheet
2. Jika belum muncul: Apps Script → Run → `onOpen`
3. Jika ada error di Apps Script: kirimkan screenshot error untuk diagnosa

**Q: Data client hilang / sheet kosong**  
A: Google Sheets punya version history.
- Di spreadsheet client: File → Version History → See version history
- Pilih versi sebelum kejadian
- Restore

**Q: Client ingin pindah ke akun Google baru**  
A: 
1. Share spreadsheet lama ke akun baru (owner)
2. Pindah ownership di Google Drive
3. Update email di License Admin (klik client → Edit → ubah email)
4. Update sheet Config di spreadsheet client (EMAIL_TRAVEL)
5. Jalankan ulang Setup Awal dari akun baru

---

## BAGIAN 9: SCALING (Saat Client Banyak)

Saat Anda sudah punya 20+ client aktif:

- **Buat template spreadsheet**: 1 spreadsheet "master" yang sudah ada semua file Apps Script-nya. Untuk client baru, cukup **Make a Copy** dari master → share ke client
- **Otomatisasi onboarding**: Bisa buat form Google Forms untuk data client baru → Apps Script auto-generate lisensi dan kirim email instruksi
- **Dashboard owner**: Bisa buat spreadsheet internal Anda sendiri yang merangkum semua client, status lisensi, dan pendapatan

---

## CATATAN PENTING

- **Jangan hapus sheet Licenses** di License Server — ini adalah database utama Anda
- **Backup ADMIN_PASS** di tempat aman (password manager)
- **Jangan share spreadsheet License Server** ke siapapun — ini data sensitif semua client
- License Server berjalan di infrastruktur Google — selama akun Google Anda aktif, server berjalan
- Quota Google Apps Script: 20.000 UrlFetch/hari per akun (lebih dari cukup untuk ratusan client)

---

*Kelana v1.0 — Panduan Server Admin (Internal)*  
*Dokumen ini hanya untuk Anda sebagai pengelola produk*
