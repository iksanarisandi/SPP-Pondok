// Auth Middleware untuk Kode Akses
import { Context } from 'hono';
import { Env, AuthUser } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Function) {
  const kodeAkses = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!kodeAkses) {
    return c.json({ error: 'Kode akses tidak ditemukan' }, 401);
  }

  try {
    const result = await c.env.DB.prepare(
      'SELECT id, role, nama_pengguna FROM roles WHERE kode_akses = ? AND aktif = 1'
    ).bind(kodeAkses).first<AuthUser>();

    if (!result) {
      return c.json({ error: 'Kode akses tidak valid atau tidak aktif' }, 401);
    }

    // Set user data di context
    c.set('user', result);
    await next();
  } catch (error) {
    return c.json({ error: 'Kesalahan autentikasi' }, 500);
  }
}

// Middleware untuk role pimpinan only
export async function pimpinanOnly(c: Context<{ Bindings: Env }>, next: Function) {
  const user = c.get('user') as AuthUser;
  
  if (!user || user.role !== 'pimpinan') {
    return c.json({ error: 'Akses ditolak. Hanya untuk pimpinan.' }, 403);
  }
  
  await next();
}

// Middleware untuk role bendahara only
export async function bendaharaOnly(c: Context<{ Bindings: Env }>, next: Function) {
  const user = c.get('user') as AuthUser;
  
  if (!user || user.role !== 'bendahara') {
    return c.json({ error: 'Akses ditolak. Hanya untuk bendahara.' }, 403);
  }
  
  await next();
}
