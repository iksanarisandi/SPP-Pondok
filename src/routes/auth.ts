// Auth Routes
import { Hono } from 'hono';
import { Env, AuthUser } from '../types';

const auth = new Hono<{ Bindings: Env }>();

// Login dengan kode akses
auth.post('/login', async (c) => {
  try {
    const { kode_akses } = await c.req.json();

    if (!kode_akses) {
      return c.json({ error: 'Kode akses tidak boleh kosong' }, 400);
    }

    const result = await c.env.DB.prepare(
      'SELECT id, kode_akses, role, nama_pengguna, aktif FROM roles WHERE kode_akses = ?'
    ).bind(kode_akses).first();

    if (!result || !result.aktif) {
      return c.json({ error: 'Kode salah atau tidak aktif' }, 401);
    }

    return c.json({
      success: true,
      user: {
        id: result.id,
        role: result.role,
        nama_pengguna: result.nama_pengguna,
        kode_akses: result.kode_akses
      }
    });
  } catch (error) {
    return c.json({ error: 'Kesalahan server' }, 500);
  }
});

export default auth;
