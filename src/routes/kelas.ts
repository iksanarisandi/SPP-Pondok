// Kelas Routes
import { Hono } from 'hono';
import { Env, Kelas, AuthUser } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateUUID } from '../utils/helpers';

const kelas = new Hono<{ Bindings: Env }>();

// Semua routes membutuhkan auth
kelas.use('*', authMiddleware);

// GET all kelas
kelas.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM kelas ORDER BY jenjang, nama_kelas'
    ).all<Kelas>();

    return c.json(results || []);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data kelas' }, 500);
  }
});

// GET kelas by ID
kelas.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(
      'SELECT * FROM kelas WHERE id = ?'
    ).bind(id).first<Kelas>();

    if (!result) {
      return c.json({ error: 'Kelas tidak ditemukan' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data kelas' }, 500);
  }
});

// POST create kelas
kelas.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { jenjang, nama_kelas } = await c.req.json();

    if (!jenjang || !nama_kelas) {
      return c.json({ error: 'Jenjang dan nama kelas wajib diisi' }, 400);
    }

    const id = generateUUID();
    await c.env.DB.prepare(
      'INSERT INTO kelas (id, jenjang, nama_kelas, dibuat_oleh) VALUES (?, ?, ?, ?)'
    ).bind(id, jenjang, nama_kelas, user.nama_pengguna).run();

    return c.json({ success: true, id }, 201);
  } catch (error) {
    return c.json({ error: 'Gagal membuat kelas' }, 500);
  }
});

// PUT update kelas
kelas.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { jenjang, nama_kelas } = await c.req.json();

    await c.env.DB.prepare(
      'UPDATE kelas SET jenjang = ?, nama_kelas = ? WHERE id = ?'
    ).bind(jenjang, nama_kelas, id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Gagal mengupdate kelas' }, 500);
  }
});

// DELETE kelas
kelas.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Check if ada siswa di kelas ini
    const siswaCheck = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM siswa WHERE kelas_id = ?'
    ).bind(id).first<{ count: number }>();

    if (siswaCheck && siswaCheck.count > 0) {
      return c.json({ error: 'Tidak dapat menghapus kelas karena masih ada siswa' }, 400);
    }

    await c.env.DB.prepare('DELETE FROM kelas WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Gagal menghapus kelas' }, 500);
  }
});

export default kelas;
