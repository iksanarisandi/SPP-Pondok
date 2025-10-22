// Helper Functions

// Generate UUID v4
export function generateUUID(): string {
  return crypto.randomUUID();
}

// Generate No Transaksi
export function generateNoTransaksi(): string {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(100 + Math.random() * 900);
  return `INV-${yyyymmdd}-${random}`;
}

// Format tanggal ke ISO string
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Parse boolean dari SQLite integer
export function parseBoolean(value: number): boolean {
  return value === 1;
}

// Convert boolean ke SQLite integer
export function toSQLiteBoolean(value: boolean): number {
  return value ? 1 : 0;
}

// Validate Jenjang
export function isValidJenjang(jenjang: string): jenjang is 'MTs' | 'MA' {
  return jenjang === 'MTs' || jenjang === 'MA';
}

// Validate Status Siswa
export function isValidStatus(status: string): status is 'Aktif' | 'Lulus' | 'Pindah' | 'Non-Aktif' {
  return ['Aktif', 'Lulus', 'Pindah', 'Non-Aktif'].includes(status);
}

// Validate Tipe Pembayaran
export function isValidTipePembayaran(tipe: string): boolean {
  return ['Berulang', 'Sekali Bayar (Tunai)', 'Sekali Bayar (Bisa Dicicil)'].includes(tipe);
}
