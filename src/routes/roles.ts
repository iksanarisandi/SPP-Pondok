// Roles Routes (untuk Pimpinan kelola Bendahara)
import { Hono } from 'hono';
import { Env, Role, AuthUser } from '../types';
import { authMiddleware, pimpinanOnly } from '../middleware/auth';
import { generateUUID, toSQLiteBoolean, parseBoolean } from '../utils/helpers';

const roles = new Hono<{ Bindings: Env }>();

// Hanya pimpinan yang bisa akses routes ini
roles.use('*', authMiddleware, pimpinanOnly);

// GET all bendahara
roles.get('/bendahara', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, kode_akses, role, nama_pengguna, aktif, dibuat_oleh, created_at FROM roles WHERE role = 'bendahara' ORDER BY created_at DESC"
    ).all<Role>();

    return c.json((results || []).map(r => ({
      ...r,
      aktif: parseBoolean(r.aktif as unknown as number)
    })));
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data bendahara' }, 500);
  }
});

// POST create bendahara baru
roles.post('/bendahara', async (c) => {
  try {
    const { nama_pengguna } = await c.req.json();

    if (!nama_pengguna) {
      return c.json({ error: 'Nama bendahara wajib diisi' }, 400);
    }

    // Generate kode akses unik
    const kode_akses = `BEND-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const id = generateUUID();

    await c.env.DB.prepare(`
      INSERT INTO roles (id, kode_akses, role, nama_pengguna, aktif, dibuat_oleh)
      VALUES (?, ?, 'bendahara', ?, 1, 'pimpinan')
    `).bind(id, kode_akses, nama_pengguna).run();

    return c.json({ 
      success: true, 
      id, 
      kode_akses,
      nama_pengguna
    }, 201);
  } catch (error) {
    return c.json({ error: 'Gagal membuat bendahara baru' }, 500);
  }
});

// PUT toggle status bendahara (aktif/non-aktif)
roles.put('/bendahara/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');

    // Get current status
    const current = await c.env.DB.prepare(
      'SELECT aktif FROM roles WHERE id = ?'
    ).bind(id).first<{ aktif: number }>();

    if (!current) {
      return c.json({ error: 'Bendahara tidak ditemukan' }, 404);
    }

    const newStatus = current.aktif === 1 ? 0 : 1;

    await c.env.DB.prepare(
      'UPDATE roles SET aktif = ? WHERE id = ?'
    ).bind(newStatus, id).run();

    return c.json({ success: true, aktif: newStatus === 1 });
  } catch (error) {
    return c.json({ error: 'Gagal mengubah status bendahara' }, 500);
  }
});

export default roles;
