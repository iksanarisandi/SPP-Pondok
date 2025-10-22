# ⚡ Quick Start Guide - 15 Menit Deploy

Panduan cepat dari zero sampai aplikasi live di internet.

---

## ⏱️ Timeline

- **5 menit**: Setup Cloudflare & Create Resources
- **5 menit**: Install Dependencies & Configure
- **5 menit**: Deploy & Test

---

## 🚀 Let's Go!

### Step 1: Install Dependencies (1 menit)

\`\`\`bash
cd spp-pondok-worker
npm install
\`\`\`

**✅ Checkpoint**: Folder `node_modules` muncul

---

### Step 2: Login Cloudflare (1 menit)

\`\`\`bash
npx wrangler login
\`\`\`

Browser akan terbuka → Klik **"Allow"**

**✅ Checkpoint**: Terminal menampilkan "Successfully logged in"

---

### Step 3: Create D1 Database (2 menit)

\`\`\`bash
npx wrangler d1 create spp-db
\`\`\`

**Output akan menampilkan:**
\`\`\`
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
\`\`\`

**COPY database_id tersebut!**

Buka file `wrangler.toml`, cari baris:
\`\`\`toml
database_id = "YOUR_DATABASE_ID"
\`\`\`

Ganti dengan ID yang kamu copy:
\`\`\`toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
\`\`\`

**✅ Checkpoint**: wrangler.toml sudah di-update

---

### Step 4: Create R2 Bucket (1 menit)

\`\`\`bash
npx wrangler r2 bucket create spp-bukti-transfer
\`\`\`

**✅ Checkpoint**: Muncul pesan "Created bucket"

---

### Step 5: Setup Database (2 menit)

\`\`\`bash
npx wrangler d1 execute spp-db --file=./schema.sql
npx wrangler d1 execute spp-db --file=./seed.sql
\`\`\`

**✅ Checkpoint**: Kedua command success tanpa error

---

### Step 6: Test Local (2 menit)

\`\`\`bash
npm run dev
\`\`\`

Buka browser: **http://localhost:8787**

**Test Login:**
- Ketik: `PIMP2025` → Klik Masuk
- Atau: `BEND2025`

**✅ Checkpoint**: Login berhasil, muncul dashboard

Tekan `Ctrl+C` untuk stop local server

---

### Step 7: Deploy Production (1 menit)

\`\`\`bash
npm run deploy
\`\`\`

**Output akan menampilkan URL:**
\`\`\`
✨ Success! Uploaded to https://spp-pondok-worker.YOUR-NAME.workers.dev
\`\`\`

**COPY URL tersebut!**

---

### Step 8: Test Production (1 menit)

Buka URL production di browser.

**Test Login:**
- Kode Akses: `PIMP2025` (Pimpinan)
- Kode Akses: `BEND2025` (Bendahara)

**✅ Checkpoint**: Aplikasi live dan bisa login!

---

## 🎉 DONE! Aplikasi Sudah Live!

Your app is now deployed at:
\`\`\`
https://spp-pondok-worker.YOUR-NAME.workers.dev
\`\`\`

---

## 🔐 Login Credentials

**Default accounts (HARUS DIGANTI SETELAH DEPLOY!):**

| Role | Kode Akses | Nama |
|------|------------|------|
| Pimpinan | `PIMP2025` | Pimpinan Utama |
| Bendahara | `BEND2025` | Bendahara Utama |

---

## 📱 Share dengan Team

Kirim URL dan credentials ke team:

> **Sistem Pembayaran SPP sudah live!**
> 
> URL: https://spp-pondok-worker.YOUR-NAME.workers.dev
> 
> Login Bendahara: `BEND2025`
> 
> Simpan URL ini di bookmark!

---

## ⚠️ PENTING - Setelah Deploy

### 1. Ubah Kode Akses Default

Login sebagai Pimpinan (`PIMP2025`), lalu:
1. Buat bendahara baru dengan kode unik
2. Non-aktifkan bendahara default

Untuk ubah kode pimpinan:
\`\`\`bash
npx wrangler d1 execute spp-db --command="UPDATE roles SET kode_akses='PIMP-BARU-2025' WHERE id='role-pimp'"
\`\`\`

### 2. Backup Database (Recommended)

\`\`\`bash
npx wrangler d1 export spp-db --output=backup.sql
\`\`\`

---

## 🐛 Troubleshooting

### "Error: No such module"
\`\`\`bash
npm install
\`\`\`

### "D1 database not found"
Check `wrangler.toml` → database_id sudah benar?

### "Login gagal"
\`\`\`bash
# Reset database
npx wrangler d1 execute spp-db --file=./seed.sql
\`\`\`

### "Command not found: wrangler"
\`\`\`bash
npm install
# Lalu gunakan: npx wrangler ...
\`\`\`

---

## 📊 Check Status

### View Logs
\`\`\`bash
npx wrangler tail
\`\`\`

### Check Database
\`\`\`bash
npx wrangler d1 execute spp-db --command="SELECT * FROM roles"
\`\`\`

### Check API
\`\`\`bash
curl https://YOUR-URL.workers.dev/api/health
\`\`\`

---

## 🎯 Next Steps

1. ✅ Aplikasi sudah deploy
2. ⬜ Ubah kode akses default
3. ⬜ Test semua fitur dashboard
4. ⬜ Train team cara pakai sistem
5. ⬜ Setup custom domain (optional)

---

## 💬 Need Help?

- 📖 Baca: [README.md](./README.md) untuk detail lengkap
- 📋 Baca: [DEPLOYMENT.md](./DEPLOYMENT.md) untuk troubleshooting
- 📊 Baca: [SUMMARY.md](./SUMMARY.md) untuk overview

---

**🎊 Selamat! Aplikasi SPP Anda sudah online!**

Total waktu: ~15 menit
Status: ✅ Production Ready
