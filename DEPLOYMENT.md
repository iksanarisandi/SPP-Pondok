# 🚀 Panduan Deployment Step-by-Step

## Pre-Deployment Checklist

- [ ] Node.js v16+ installed
- [ ] npm installed
- [ ] Akun Cloudflare sudah dibuat
- [ ] Sudah login Cloudflare CLI

---

## Step 1: Setup Cloudflare Account

### 1.1. Login ke Cloudflare
\`\`\`bash
npx wrangler login
\`\`\`
Browser akan terbuka, login dengan akun Cloudflare Anda.

---

## Step 2: Install Dependencies

\`\`\`bash
cd spp-pondok-worker
npm install
\`\`\`

**Expected Output:**
\`\`\`
added 50 packages in 10s
\`\`\`

---

## Step 3: Create D1 Database

### 3.1. Buat Database
\`\`\`bash
npx wrangler d1 create spp-db
\`\`\`

**Expected Output:**
\`\`\`
✅ Successfully created DB 'spp-db'

[[d1_databases]]
binding = "DB"
database_name = "spp-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
\`\`\`

### 3.2. Update wrangler.toml

Copy `database_id` dari output di atas, lalu buka `wrangler.toml` dan update:

\`\`\`toml
[[d1_databases]]
binding = "DB"
database_name = "spp-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # <-- PASTE DI SINI
\`\`\`

---

## Step 4: Create R2 Bucket

\`\`\`bash
npx wrangler r2 bucket create spp-bukti-transfer
\`\`\`

**Expected Output:**
\`\`\`
✅ Created bucket 'spp-bukti-transfer'
\`\`\`

---

## Step 5: Run Database Migrations

### 5.1. Create Schema
\`\`\`bash
npx wrangler d1 execute spp-db --file=./schema.sql
\`\`\`

**Expected Output:**
\`\`\`
🌀 Executing on remote database spp-db (xxxxxx):
✅ Ran 8 commands in 0.123s
\`\`\`

### 5.2. Seed Initial Data
\`\`\`bash
npx wrangler d1 execute spp-db --file=./seed.sql
\`\`\`

**Expected Output:**
\`\`\`
🌀 Executing on remote database spp-db (xxxxxx):
✅ Ran 12 commands in 0.234s
\`\`\`

---

## Step 6: Test Local Development

\`\`\`bash
npm run dev
\`\`\`

**Expected Output:**
\`\`\`
⛅️ wrangler 3.x.x
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
\`\`\`

### 6.1. Test di Browser

Buka: http://localhost:8787

**Tes Login:**
- Kode Akses Pimpinan: `PIMP2025`
- Kode Akses Bendahara: `BEND2025`

---

## Step 7: Deploy ke Production

### 7.1. Deploy
\`\`\`bash
npm run deploy
\`\`\`

**Expected Output:**
\`\`\`
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Worker Startup Time: xx ms
✨ Success! Uploaded to https://spp-pondok-worker.YOUR_SUBDOMAIN.workers.dev
\`\`\`

### 7.2. Test Production URL

Buka URL yang diberikan di output, misalnya:
\`\`\`
https://spp-pondok-worker.YOUR_SUBDOMAIN.workers.dev
\`\`\`

Login dengan:
- Pimpinan: `PIMP2025`
- Bendahara: `BEND2025`

---

## Step 8: (Optional) Custom Domain

### 8.1. Tambah Custom Domain di Cloudflare Dashboard

1. Buka: https://dash.cloudflare.com
2. Pilih Workers & Pages > spp-pondok-worker
3. Klik **"Triggers"** tab
4. Klik **"Add Custom Domain"**
5. Masukkan domain: `spp.yourdomain.com`
6. Klik **"Add Custom Domain"**

### 8.2. Update DNS

Cloudflare akan auto-update DNS records jika domain di Cloudflare.

---

## Verification Checklist

Setelah deployment, verifikasi:

- [ ] Login page muncul dengan benar
- [ ] Login dengan PIMP2025 berhasil (Dashboard Pimpinan)
- [ ] Login dengan BEND2025 berhasil (Dashboard Bendahara)
- [ ] API `/api/health` return status ok
- [ ] Database memiliki data seed (roles, kelas, siswa)

**Test API Health:**
\`\`\`bash
curl https://spp-pondok-worker.YOUR_SUBDOMAIN.workers.dev/api/health
\`\`\`

**Expected Response:**
\`\`\`json
{"status":"ok","timestamp":"2025-01-22T10:00:00.000Z"}
\`\`\`

---

## Post-Deployment Tasks

### Ubah Kode Akses Default

**PENTING!** Ubah kode akses default untuk keamanan:

1. Login sebagai Pimpinan
2. Buka menu "Manajemen Bendahara"
3. Generate kode baru untuk bendahara
4. Nonaktifkan akun bendahara default (BEND2025)

Untuk mengubah kode pimpinan, akses database via Wrangler:

\`\`\`bash
npx wrangler d1 execute spp-db --command="UPDATE roles SET kode_akses='PIMP-NEW-CODE' WHERE id='role-pimp'"
\`\`\`

---

## Troubleshooting Common Issues

### Issue: "Error: No such module"
**Solution:** Jalankan `npm install` lagi

### Issue: "D1 database not found"
**Solution:** Pastikan database_id di wrangler.toml sudah benar

### Issue: "R2 bucket not found"
**Solution:** Jalankan `npx wrangler r2 bucket create spp-bukti-transfer`

### Issue: "Table doesn't exist"
**Solution:** Jalankan migration: `npm run db:init && npm run db:seed`

### Issue: "401 Unauthorized" saat login
**Solution:** Pastikan seed.sql sudah dijalankan

---

## Monitoring & Maintenance

### View Logs
\`\`\`bash
npx wrangler tail
\`\`\`

### Query Database
\`\`\`bash
# Lihat semua users
npx wrangler d1 execute spp-db --command="SELECT * FROM roles"

# Lihat semua siswa
npx wrangler d1 execute spp-db --command="SELECT * FROM siswa"

# Lihat total transaksi
npx wrangler d1 execute spp-db --command="SELECT COUNT(*), SUM(nominal_dibayar) FROM transaksi"
\`\`\`

### Backup Database
\`\`\`bash
# Export semua data
npx wrangler d1 export spp-db --output=backup.sql
\`\`\`

### Restore Database
\`\`\`bash
npx wrangler d1 execute spp-db --file=backup.sql
\`\`\`

---

## Support

Jika ada masalah deployment, hubungi:
- Email: admin@balibinsani.com
- WhatsApp: +62-xxx-xxxx-xxxx

---

✅ **Deployment Complete!** Aplikasi sudah live dan siap digunakan.
