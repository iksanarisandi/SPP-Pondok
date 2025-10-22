# Sistem Pembayaran SPP - Pondok Pesantren Bali Bina Insani

Full-stack aplikasi pembayaran SPP dengan Cloudflare Workers + Hono + D1 + R2 + Alpine.js

## 🚀 Stack Teknologi

- **Backend**: Cloudflare Workers + Hono.js + TypeScript
- **Database**: Cloudflare D1 (SQLite at edge)
- **Storage**: Cloudflare R2 (untuk bukti transfer)
- **Frontend**: HTML + Alpine.js + Tailwind CSS
- **Charts**: Chart.js
- **Export**: jsPDF + SheetJS (Excel)

## 📋 Fitur

### Akses Bendahara:
- ✅ Dashboard pembayaran cepat
- ✅ Manajemen siswa (CRUD, import Excel, naik kelas)
- ✅ Manajemen kelas (CRUD)
- ✅ Manajemen jenis pembayaran
- ✅ Transaksi pembayaran (tunai & cicilan)
- ✅ Sistem beasiswa otomatis
- ✅ Upload bukti transfer
- ✅ Export laporan PDF & Excel
- ✅ Riwayat transaksi

### Akses Pimpinan:
- ✅ Dashboard ringkasan (metrics & charts)
- ✅ Laporan keuangan detail
- ✅ Visualisasi tren pembayaran bulanan
- ✅ Manajemen akun bendahara
- ✅ Generate kode akses bendahara baru
- ✅ Aktivasi/nonaktifasi bendahara

## 🛠️ Setup & Instalasi

### 1. Prerequisites

- Node.js v16 atau lebih baru
- npm atau pnpm
- Akun Cloudflare (gratis)
- Wrangler CLI

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Login ke Cloudflare

\`\`\`bash
npx wrangler login
\`\`\`

### 4. Buat D1 Database

\`\`\`bash
npx wrangler d1 create spp-db
\`\`\`

**Output:**
\`\`\`
✅ Successfully created DB 'spp-db'
database_id = "xxxxx-xxxxx-xxxxx"
\`\`\`

Copy `database_id` dan update di `wrangler.toml`:

\`\`\`toml
[[d1_databases]]
binding = "DB"
database_name = "spp-db"
database_id = "xxxxx-xxxxx-xxxxx"  # <-- Paste ID di sini
\`\`\`

### 5. Buat R2 Bucket

\`\`\`bash
npx wrangler r2 bucket create spp-bukti-transfer
\`\`\`

### 6. Jalankan Database Migration

\`\`\`bash
# Buat schema
npx wrangler d1 execute spp-db --file=./schema.sql

# Seed data awal (roles, kelas, siswa, dll)
npx wrangler d1 execute spp-db --file=./seed.sql
\`\`\`

### 7. Test Local Development

\`\`\`bash
npm run dev
\`\`\`

Buka browser: http://localhost:8787

### 8. Deploy ke Production

\`\`\`bash
npm run deploy
\`\`\`

Aplikasi akan live di: `https://spp-pondok-worker.YOUR_SUBDOMAIN.workers.dev`

## 🔐 Login Credentials (Default)

Setelah seed data:

**Pimpinan:**
- Kode Akses: `PIMP2025`
- Nama: Pimpinan Utama

**Bendahara:**
- Kode Akses: `BEND2025`
- Nama: Bendahara Utama

⚠️ **PENTING:** Ubah kode akses default setelah deployment pertama!

## 📊 Database Schema

### Tables:
- `roles` - User accounts (pimpinan & bendahara)
- `kelas` - Daftar kelas (MTs & MA)
- `siswa` - Data siswa lengkap
- `jenis_pembayaran` - Jenis pembayaran (SPP, PSB, dll)
- `transaksi` - Riwayat pembayaran

## 🌐 API Endpoints

### Auth
- `POST /api/auth/login` - Login dengan kode akses

### Kelas (Auth Required)
- `GET /api/kelas` - Get all kelas
- `POST /api/kelas` - Create kelas
- `PUT /api/kelas/:id` - Update kelas
- `DELETE /api/kelas/:id` - Delete kelas

### Siswa (Auth Required)
- `GET /api/siswa` - Get all siswa
- `GET /api/siswa/:id` - Get siswa by ID
- `POST /api/siswa` - Create siswa
- `PUT /api/siswa/:id` - Update siswa
- `POST /api/siswa/naik-kelas` - Bulk naik kelas
- `POST /api/siswa/import` - Import from Excel

### Jenis Pembayaran (Auth Required)
- `GET /api/pembayaran` - Get all jenis pembayaran
- `POST /api/pembayaran` - Create jenis pembayaran
- `PUT /api/pembayaran/:id` - Update jenis pembayaran

### Transaksi (Auth Required)
- `GET /api/transaksi` - Get all transaksi
- `POST /api/transaksi` - Create transaksi (batch)
- `GET /api/transaksi/stats/dashboard` - Dashboard metrics
- `GET /api/transaksi/stats/monthly` - Monthly stats untuk chart
- `POST /api/transaksi/upload-bukti` - Upload bukti transfer

### Roles (Pimpinan Only)
- `GET /api/roles/bendahara` - Get all bendahara
- `POST /api/roles/bendahara` - Create bendahara baru
- `PUT /api/roles/bendahara/:id/toggle` - Toggle status aktif

## 🔧 Development Commands

\`\`\`bash
# Local development
npm run dev

# Deploy production
npm run deploy

# Reset database (re-run migrations)
npm run db:init
npm run db:seed

# View D1 database
npx wrangler d1 execute spp-db --command="SELECT * FROM roles"

# View R2 buckets
npx wrangler r2 bucket list
\`\`\`

## 📦 Project Structure

\`\`\`
spp-pondok-worker/
├── src/
│   ├── index.ts           # Main Hono app
│   ├── types.ts           # TypeScript types
│   ├── middleware/
│   │   └── auth.ts        # Auth middleware
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── kelas.ts
│   │   ├── siswa.ts
│   │   ├── pembayaran.ts
│   │   ├── transaksi.ts
│   │   └── roles.ts
│   └── utils/
│       └── helpers.ts
├── schema.sql             # Database schema
├── seed.sql               # Initial data
├── wrangler.toml          # Cloudflare config
├── package.json
└── tsconfig.json
\`\`\`

## 🚨 Troubleshooting

### Error: "D1 database not found"
Pastikan sudah create D1 database dan update `database_id` di wrangler.toml

### Error: "R2 bucket not found"
Jalankan: `npx wrangler r2 bucket create spp-bukti-transfer`

### Error: "Table doesn't exist"
Jalankan migration: `npm run db:init && npm run db:seed`

### Login tidak berhasil
Pastikan seed.sql sudah dijalankan dengan benar

## 📝 TODO / Future Enhancements

- [ ] Implementasi view lengkap untuk semua dashboard
- [ ] Real-time notifications
- [ ] Export backup database otomatis
- [ ] Custom domain untuk R2 public URL
- [ ] Email notification untuk transaksi
- [ ] Multi-tenant support (multiple pondok)

## 📄 License

MIT

## 👨‍💻 Author

Sistem Pembayaran SPP - Pondok Pesantren Bali Bina Insani
