# 🌐 PANDUAN DEPLOY KELANA SEBAGAI WEB APP

Mengubah Kelana menjadi **aplikasi web** yang dibuka lewat URL di browser
(seperti website biasa), lengkap dengan **sidebar + login email & password** —
bukan lagi popup di dalam Google Sheets.

> Google Sheets tetap menjadi "database". Tapi pengguna (Owner/Admin/Finance/
> Marketing) cukup buka URL dan login — mereka tidak pernah melihat Google Sheet.

---

## ⏱ Estimasi waktu: 15 menit

---

## BAGIAN 1: PASTIKAN SEMUA FILE SUDAH ADA

Di Apps Script project client, pastikan file berikut sudah di-paste:

**File .gs:**
- `Code.gs`
- `Code.additions.gs` (nama: `CodeAdditions`)
- `Roles.gs`
- `Roomlist.gs`
- `Siskopatuh.gs`
- `LicenseClient.gs`
- `Manifest.gs`
- `Webhook.gs`
- `FormIntegration.gs` (opsional, untuk integrasi Google Form)
- `WebApp.gs`  ← **file baru untuk web app**
- `DummyData.gs` (opsional, untuk demo)

**File .html** (nama tanpa `.html`):
- `App`  ← **file baru, ini tampilan web app-nya**
- (file HTML popup lama seperti Dashboard, TambahJamaah, dll. boleh tetap ada —
  tidak mengganggu, tapi web app hanya memakai `App`)

---

## BAGIAN 2: GANTI PEPPER PASSWORD (PENTING untuk keamanan)

1. Buka file `WebApp.gs`
2. Cari baris paling atas:
   ```
   var AUTH_PEPPER = 'kelana_pepper_ganti_ini_2025';
   ```
3. Ganti teks di dalam tanda kutip dengan teks acak Anda sendiri, contoh:
   ```
   var AUTH_PEPPER = 'albarokah_x9k2mP7qZ_2025';
   ```
4. **Catat & simpan** nilai ini. Jika diubah setelah ada password tersimpan,
   semua password lama jadi tidak valid (harus di-reset).
5. Simpan (Ctrl+S)

> Pepper berbeda untuk tiap client = lebih aman.

---

## BAGIAN 3: SETUP SHEET + AKUN OWNER

### Cara BARU (paling mudah) — lewat halaman web, tanpa buka kode

Sejak versi ini, akun Owner pertama bisa dibuat **langsung dari browser**:

1. Deploy web app dulu (lihat Bagian 4), buka URL-nya.
2. Karena belum ada pengguna, sistem otomatis menampilkan layar **"Selamat Datang —
   Buat akun Owner pertama"**.
3. Isi **Nama Travel, Nama Owner, Email, Password** (min. 6 karakter) → **Buat Akun & Masuk**.
4. Sistem otomatis menyiapkan semua sheet + langsung masuk sebagai Owner. Selesai. ✅

> Layar setup ini **hanya muncul sekali** (saat belum ada pengguna sama sekali).
> Setelah ada Owner, yang muncul adalah layar login biasa.

### Cara lama (alternatif) — lewat editor Apps Script

1. Jalankan **Setup Awal**: Editor → pilih `setupAwal` → **Run**
   (atau dari Sheet: menu 🕌 Kelana → Setup Awal).
2. Buat Owner: tambahkan fungsi sementara di `WebApp.gs`, lalu Run:
   ```javascript
   function setupLoginSaya() {
     buatAkunOwner('owner@travelanda.com', 'PasswordKuatAnda123');
   }
   ```
   (Setelah berhasil, fungsi sementara ini boleh dihapus.)

---

## BAGIAN 4: DEPLOY SEBAGAI WEB APP

1. Di Apps Script, klik **Deploy** (kanan atas) → **New deployment**
2. Klik ikon ⚙ → pilih **Web app**
3. Isi:
   - **Description**: `Kelana Web App v1`
   - **Execute as**: **Me** (akun Google Anda)
   - **Who has access**: **Anyone**
4. Klik **Deploy** → **Authorize access** → pilih akun → Izinkan
5. **Salin Web app URL** (contoh: `https://script.google.com/macros/s/AKfy.../exec`)
6. URL inilah yang dibagikan ke staff travel untuk login

> ⚠️ "Who has access: Anyone" aman karena tetap dikunci login email+password.
> Tanpa akun yang valid, tidak ada yang bisa masuk.

> 🔄 Setiap kali update kode, buka **Deploy → Manage deployments → Edit (ikon pensil)
> → Version: New version → Deploy**. URL tetap sama.

---

## BAGIAN 5: TAMBAH PENGGUNA LAIN

Setelah Owner login ke web app:

1. Sidebar → **Kelola Pengguna**
2. Klik **Tambah Pengguna**
3. Isi Email, Nama, pilih **Role** (Admin/Finance/Marketing), dan **Password**
4. Klik Simpan
5. Beri tahu staff: URL web app + email + password mereka

Staff bisa langsung login. Hak akses otomatis menyesuaikan role:
- **Owner** → semua menu
- **Admin** → jamaah, dokumen, manifest, roomlist (tanpa keuangan)
- **Finance** → invoice, laporan keuangan (tanpa edit jamaah)
- **Marketing** → tambah jamaah, lead, WA blast

---

## BAGIAN 6: COBA DENGAN DATA DEMO (Opsional)

Untuk melihat tampilan dengan data:
1. Editor Apps Script → pilih `isiDummyData` → **Run**
2. Buka URL web app
3. Login dengan salah satu akun demo (password semua: **`kelana123`**):

   | Email | Role |
   |-------|------|
   | owner@albarokah.com | Owner |
   | admin@albarokah.com | Admin |
   | finance@albarokah.com | Finance |
   | marketing@albarokah.com | Marketing |

4. Coba login bergantian untuk melihat perbedaan akses tiap role
5. Untuk reset data demo: jalankan `hapusSemuaDummyData`

> ⚠️ Jangan pakai data demo di spreadsheet client asli.

---

## CARA KERJA KEAMANAN (ringkas)

- Password disimpan sebagai **hash SHA-256 + salt + pepper** (tidak pernah
  disimpan sebagai teks asli)
- Login menghasilkan **session token** yang berlaku 12 jam
- Setiap aksi mengirim token → server cek: token valid? role boleh? lisensi aktif?
- Semua perubahan data tetap tercatat di **Log Aktivitas** (siapa, kapan, apa)

---

## TROUBLESHOOTING

**Q: Buka URL muncul halaman error / "Script function not found: doGet"**
A: Pastikan file `WebApp.gs` sudah ada dan ter-deploy versi terbaru.

**Q: Login selalu "Password salah" padahal benar**
A: Kemungkinan `AUTH_PEPPER` diubah setelah password dibuat. Reset password
lewat Kelola Pengguna, atau buat ulang akun Owner dengan `buatAkunOwner`.

**Q: Setelah update kode, perubahan tidak muncul**
A: Deploy → Manage deployments → Edit → New version → Deploy. Selain itu, **jalankan ulang
"Setup Awal"** sekali agar kolom baru tersisip otomatis (mis. ID Paket di Group, Tambahan
Triple/Double di Paket, header Petugas) — idempoten, tidak menghapus data.

**Q: Status kloter tidak berpindah ke Berjalan/Selesai padahal tanggal sudah lewat**
A: Atur **Zona Waktu** project: Apps Script → ⚙️ Project Settings → Time zone →
(GMT+07:00) Asia/Jakarta.

**Q: Staff tidak bisa akses menu tertentu**
A: Itu normal — menu disembunyikan sesuai role. Ubah role lewat Kelola Pengguna.

**Q: Muncul "Sesi berakhir, silakan login lagi"**
A: Token kedaluwarsa setelah 12 jam. Login ulang saja.

**Q: Tampil pesan lisensi memblokir input data**
A: Langganan client perlu diperpanjang. Lihat PANDUAN_SERVER_ADMIN.md.

---

*Kelana v1.0 — Web App Edition*
