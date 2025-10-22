-- Schema Database untuk Sistem Pembayaran SPP
-- Cloudflare D1 (SQLite)

-- Table: roles (untuk auth: pimpinan & bendahara)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  kode_akses TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('pimpinan', 'bendahara')),
  nama_pengguna TEXT NOT NULL,
  aktif INTEGER DEFAULT 1 CHECK(aktif IN (0, 1)),
  dibuat_oleh TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Table: kelas
CREATE TABLE IF NOT EXISTS kelas (
  id TEXT PRIMARY KEY,
  jenjang TEXT NOT NULL CHECK(jenjang IN ('MTs', 'MA')),
  nama_kelas TEXT NOT NULL,
  dibuat_oleh TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Table: siswa
CREATE TABLE IF NOT EXISTS siswa (
  id TEXT PRIMARY KEY,
  nis TEXT UNIQUE NOT NULL,
  nama_siswa TEXT NOT NULL,
  jenjang TEXT NOT NULL CHECK(jenjang IN ('MTs', 'MA')),
  kelas_id TEXT NOT NULL,
  tanggal_masuk TEXT NOT NULL,
  status TEXT DEFAULT 'Aktif' CHECK(status IN ('Aktif', 'Lulus', 'Pindah', 'Non-Aktif')),
  beasiswa_jenis TEXT,
  beasiswa_potongan TEXT, -- JSON array of payment IDs
  beasiswa_tanggal TEXT,
  dibuat_oleh TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kelas_id) REFERENCES kelas(id)
);

-- Table: jenis_pembayaran
CREATE TABLE IF NOT EXISTS jenis_pembayaran (
  id TEXT PRIMARY KEY,
  nama_pembayaran TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  berlaku_untuk TEXT NOT NULL, -- JSON array of class IDs
  jenjang TEXT NOT NULL CHECK(jenjang IN ('MTs', 'MA')),
  tipe_pembayaran TEXT NOT NULL CHECK(tipe_pembayaran IN ('Berulang', 'Sekali Bayar (Tunai)', 'Sekali Bayar (Bisa Dicicil)')),
  dibuat_oleh TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Table: transaksi
CREATE TABLE IF NOT EXISTS transaksi (
  id TEXT PRIMARY KEY,
  siswa_id TEXT NOT NULL,
  nama_siswa TEXT NOT NULL,
  kelas_id TEXT NOT NULL,
  nama_kelas TEXT NOT NULL,
  jenjang TEXT NOT NULL,
  jenis_pembayaran_id TEXT NOT NULL,
  jenis_pembayaran_nama TEXT NOT NULL,
  nominal_asli INTEGER NOT NULL,
  potongan_beasiswa INTEGER DEFAULT 0,
  nominal_dibayar INTEGER NOT NULL,
  tanggal_bayar TEXT NOT NULL,
  dibuat_oleh TEXT NOT NULL,
  no_transaksi TEXT UNIQUE NOT NULL,
  bukti_transfer_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (siswa_id) REFERENCES siswa(id),
  FOREIGN KEY (kelas_id) REFERENCES kelas(id)
);

-- Indexes untuk performance
CREATE INDEX idx_siswa_kelas ON siswa(kelas_id);
CREATE INDEX idx_siswa_status ON siswa(status);
CREATE INDEX idx_siswa_nis ON siswa(nis);
CREATE INDEX idx_transaksi_siswa ON transaksi(siswa_id);
CREATE INDEX idx_transaksi_tanggal ON transaksi(tanggal_bayar);
CREATE INDEX idx_transaksi_no ON transaksi(no_transaksi);
CREATE INDEX idx_roles_kode ON roles(kode_akses);
