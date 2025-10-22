// Transaksi Routes
import { Hono } from 'hono';
import { Env, Transaksi, AuthUser } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateUUID, generateNoTransaksi } from '../utils/helpers';

const transaksi = new Hono<{ Bindings: Env }>();

transaksi.use('*', authMiddleware);

// GET all transaksi (with optional filters)
transaksi.get('/', async (c) => {
  try {
    const siswa_id = c.req.query('siswa_id');
    const kelas_id = c.req.query('kelas_id');
    const start_date = c.req.query('start_date');
    const end_date = c.req.query('end_date');

    let query = 'SELECT * FROM transaksi WHERE 1=1';
    const params: any[] = [];

    if (siswa_id) {
      query += ' AND siswa_id = ?';
      params.push(siswa_id);
    }

    if (kelas_id) {
      query += ' AND kelas_id = ?';
      params.push(kelas_id);
    }

    if (start_date) {
      query += ' AND tanggal_bayar >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND tanggal_bayar <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY tanggal_bayar DESC, created_at DESC';

    const stmt = c.env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all<Transaksi>();

    return c.json(results || []);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data transaksi' }, 500);
  }
});

// GET transaksi by ID
transaksi.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(
      'SELECT * FROM transaksi WHERE id = ?'
    ).bind(id).first<Transaksi>();

    if (!result) {
      return c.json({ error: 'Transaksi tidak ditemukan' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data transaksi' }, 500);
  }
});

// POST create transaksi (batch)
transaksi.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { transaksi_list } = await c.req.json();

    if (!Array.isArray(transaksi_list) || transaksi_list.length === 0) {
      return c.json({ error: 'Data transaksi tidak valid' }, 400);
    }

    const statements = [];
    const createdIds: string[] = [];

    for (const t of transaksi_list) {
      const id = generateUUID();
      const no_transaksi = generateNoTransaksi();
      
      statements.push(c.env.DB.prepare(`
        INSERT INTO transaksi (
          id, siswa_id, nama_siswa, kelas_id, nama_kelas, jenjang,
          jenis_pembayaran_id, jenis_pembayaran_nama, nominal_asli, 
          potongan_beasiswa, nominal_dibayar, tanggal_bayar, dibuat_oleh, no_transaksi, bukti_transfer_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, t.siswa_id, t.nama_siswa, t.kelas_id, t.nama_kelas, t.jenjang,
        t.jenis_pembayaran_id, t.jenis_pembayaran_nama, t.nominal_asli,
        t.potongan_beasiswa || 0, t.nominal_dibayar, t.tanggal_bayar || new Date().toISOString(),
        user.nama_pengguna, no_transaksi, t.bukti_transfer_url || null
      ));

      createdIds.push(id);
    }

    await c.env.DB.batch(statements);

    return c.json({ success: true, ids: createdIds }, 201);
  } catch (error) {
    console.error('Error creating transaksi:', error);
    return c.json({ error: 'Gagal membuat transaksi', details: error.message }, 500);
  }
});

// GET statistics/metrics
transaksi.get('/stats/dashboard', async (c) => {
  try {
    // Total pendapatan bulan ini
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const monthlyStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(nominal_dibayar) as total
      FROM transaksi
      WHERE tanggal_bayar BETWEEN ? AND ?
    `).bind(startOfMonth, endOfMonth).first<{ count: number; total: number }>();

    // Total pendapatan keseluruhan
    const totalStats = await c.env.DB.prepare(`
      SELECT SUM(nominal_dibayar) as total FROM transaksi
    `).first<{ total: number }>();

    return c.json({
      bulan_ini: {
        jumlah_transaksi: monthlyStats?.count || 0,
        total_pendapatan: monthlyStats?.total || 0
      },
      total_keseluruhan: totalStats?.total || 0
    });
  } catch (error) {
    return c.json({ error: 'Gagal mengambil statistik' }, 500);
  }
});

// GET pendapatan per bulan (untuk chart)
transaksi.get('/stats/monthly', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '12');

    const { results } = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', tanggal_bayar) as month,
        SUM(nominal_dibayar) as total
      FROM transaksi
      GROUP BY strftime('%Y-%m', tanggal_bayar)
      ORDER BY month DESC
      LIMIT ?
    `).bind(limit).all<{ month: string; total: number }>();

    return c.json(results || []);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data bulanan' }, 500);
  }
});

// POST upload bukti transfer ke R2
transaksi.post('/upload-bukti', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'File tidak ditemukan' }, 400);
    }

    const fileName = `${generateUUID()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    await c.env.STORAGE.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type
      }
    });

    // Generate public URL (requires R2 public bucket or custom domain)
    const url = `https://storage.yourdomain.com/${fileName}`;

    return c.json({ success: true, url });
  } catch (error) {
    return c.json({ error: 'Gagal upload file' }, 500);
  }
});

export default transaksi;
