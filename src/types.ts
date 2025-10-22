// TypeScript Types untuk Aplikasi SPP

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  APP_NAME: string;
}

export interface Role {
  id: string;
  kode_akses: string;
  role: 'pimpinan' | 'bendahara';
  nama_pengguna: string;
  aktif: boolean;
  dibuat_oleh?: string;
  created_at?: string;
}

export interface Kelas {
  id: string;
  jenjang: 'MTs' | 'MA';
  nama_kelas: string;
  dibuat_oleh?: string;
  created_at?: string;
}

export interface Siswa {
  id: string;
  nis: string;
  nama_siswa: string;
  jenjang: 'MTs' | 'MA';
  kelas_id: string;
  tanggal_masuk: string;
  status: 'Aktif' | 'Lulus' | 'Pindah' | 'Non-Aktif';
  beasiswa_jenis?: string;
  beasiswa_potongan?: string; // JSON array
  beasiswa_tanggal?: string;
  dibuat_oleh?: string;
  created_at?: string;
}

export interface JenisPembayaran {
  id: string;
  nama_pembayaran: string;
  nominal: number;
  berlaku_untuk: string; // JSON array
  jenjang: 'MTs' | 'MA';
  tipe_pembayaran: 'Berulang' | 'Sekali Bayar (Tunai)' | 'Sekali Bayar (Bisa Dicicil)';
  dibuat_oleh?: string;
  created_at?: string;
}

export interface Transaksi {
  id: string;
  siswa_id: string;
  nama_siswa: string;
  kelas_id: string;
  nama_kelas: string;
  jenjang: 'MTs' | 'MA';
  jenis_pembayaran_id: string;
  jenis_pembayaran_nama: string;
  nominal_asli: number;
  potongan_beasiswa: number;
  nominal_dibayar: number;
  tanggal_bayar: string;
  dibuat_oleh: string;
  no_transaksi: string;
  bukti_transfer_url?: string;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  role: 'pimpinan' | 'bendahara';
  nama_pengguna: string;
}
