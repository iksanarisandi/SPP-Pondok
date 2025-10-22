// Jenis Pembayaran Routes
import { Hono } from 'hono';
import { Env, JenisPembayaran, AuthUser } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateUUID } from '../utils/helpers';

const pembayaran = new Hono<{ Bindings: Env }>();

pembayaran.use('*', authMiddleware);

// GET all jenis pembayaran
pembayaran.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM jenis_pembayaran ORDER BY jenjang, nama_pembayaran'
    ).all<JenisPembayaran>();

    return c.json(results || []);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data pembayaran' }, 500);
  }
});

// GET jenis pembayaran by ID
pembayaran.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(
      'SELECT * FROM jenis_pembayaran WHERE id = ?'
    ).bind(id).first<JenisPembayaran>();

    if (!result) {
      return c.json({ error: 'Jenis pembayaran tidak ditemukan' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data pembayaran' }, 500);
  }
});

// POST create jenis pembayaran
pembayaran.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { nama_pembayaran, nominal, berlaku_untuk, jenjang, tipe_pembayaran } = await c.req.json();

    if (!nama_pembayaran || !nominal || !jenjang || !tipe_pembayaran) {
      return c.json({ error: 'Data wajib tidak lengkap' }, 400);
    }

    const id = generateUUID();
    const berlakuUntukStr = JSON.stringify(berlaku_untuk || []);

    await c.env.DB.prepare(`
      INSERT INTO jenis_pembayaran (id, nama_pembayaran, nominal, berlaku_untuk, jenjang, tipe_pembayaran, dibuat_oleh)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, nama_pembayaran, nominal, berlakuUntukStr, jenjang, tipe_pembayaran, user.nama_pengguna).run();

    return c.json({ success: true, id }, 201);
  } catch (error) {
    return c.json({ error: 'Gagal membuat jenis pembayaran' }, 500);
  }
});

// PUT update jenis pembayaran
pembayaran.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { nama_pembayaran, nominal, berlaku_untuk, jenjang, tipe_pembayaran } = await c.req.json();

    const berlakuUntukStr = JSON.stringify(berlaku_untuk || []);

    await c.env.DB.prepare(`
      UPDATE jenis_pembayaran 
      SET nama_pembayaran = ?, nominal = ?, berlaku_untuk = ?, jenjang = ?, tipe_pembayaran = ?
      WHERE id = ?
    `).bind(nama_pembayaran, nominal, berlakuUntukStr, jenjang, tipe_pembayaran, id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Gagal mengupdate jenis pembayaran' }, 500);
  }
});

export default pembayaran;
