-- Seed Data (Initial Mock Data dari Prototipe)

-- Insert Roles (Pimpinan & Bendahara)
INSERT INTO roles (id, kode_akses, role, nama_pengguna, aktif, dibuat_oleh) VALUES
('role-pimp', 'PIMP2025', 'pimpinan', 'Pimpinan Utama', 1, 'system'),
('role-bend', 'BEND2025', 'bendahara', 'Bendahara Utama', 1, 'system');

-- Insert Kelas
INSERT INTO kelas (id, jenjang, nama_kelas, dibuat_oleh) VALUES
('k1', 'MTs', 'VII A', 'system'),
('k2', 'MTs', 'VIII B', 'system'),
('k3', 'MA', 'X IPA', 'system'),
('k4', 'MA', 'XI IPS', 'system');

-- Insert Jenis Pembayaran
INSERT INTO jenis_pembayaran (id, nama_pembayaran, nominal, berlaku_untuk, jenjang, tipe_pembayaran, dibuat_oleh) VALUES
('p1', 'SPP', 150000, '["k1","k2","k3"]', 'MTs', 'Berulang', 'system'),
('p2', 'Ujian Semester', 250000, '["k2","k3"]', 'MA', 'Sekali Bayar (Tunai)', 'system'),
('p3', 'PSB (Penerimaan Siswa Baru)', 1500000, '["k1"]', 'MTs', 'Sekali Bayar (Bisa Dicicil)', 'system');

-- Insert Siswa
INSERT INTO siswa (id, nis, nama_siswa, jenjang, kelas_id, tanggal_masuk, status, beasiswa_jenis, beasiswa_potongan, dibuat_oleh) VALUES
('s1', 'MTS-001', 'Ahmad Subagja', 'MTs', 'k1', '2023-07-04', 'Aktif', NULL, NULL, 'system'),
('s2', 'MTS-002', 'Budi Santoso', 'MTs', 'k2', '2023-07-15', 'Aktif', 'Prestasi', '["p1"]', 'system'),
('s3', 'MA-001', 'Citra Lestari', 'MA', 'k3', '2025-07-15', 'Aktif', NULL, NULL, 'system'),
('s4', 'MA-002', 'Dian Permata', 'MA', 'k3', '2025-07-15', 'Lulus', NULL, NULL, 'system'),
('s5', 'MTS-003', 'Eko Prasetyo', 'MTs', 'k1', '2025-09-01', 'Aktif', NULL, NULL, 'system');

-- Insert Transaksi
INSERT INTO transaksi (id, siswa_id, nama_siswa, kelas_id, nama_kelas, jenjang, jenis_pembayaran_id, jenis_pembayaran_nama, nominal_asli, potongan_beasiswa, nominal_dibayar, tanggal_bayar, dibuat_oleh, no_transaksi) VALUES
('t-budi-1', 's2', 'Budi Santoso', 'k2', 'VIII B', 'MTs', 'p1', 'SPP Juli 2023', 150000, 0, 150000, '2023-07-20', 'Bendahara Utama', 'INV-20230720-001'),
('t5', 's1', 'Ahmad Subagja', 'k1', 'VII A', 'MTs', 'p3', 'PSB (Penerimaan Siswa Baru)', 1500000, 0, 500000, '2023-07-15', 'Bendahara Utama', 'INV-20230715-001'),
('t3', 's3', 'Citra Lestari', 'k3', 'X IPA', 'MA', 'p2', 'Ujian Semester', 250000, 0, 250000, '2025-08-01', 'Bendahara Utama', 'INV-20250801-003');
