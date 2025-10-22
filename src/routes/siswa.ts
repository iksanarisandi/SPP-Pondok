// Siswa Routes
import { Hono } from 'hono';
import { Env, Siswa, AuthUser } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateUUID } from '../utils/helpers';

const siswa = new Hono<{ Bindings: Env }>();

siswa.use('*', authMiddleware);

// GET all siswa (with optional filter)
siswa.get('/', async (c) => {
  try {
    const status = c.req.query('status');
    const kelas_id = c.req.query('kelas_id');

    let query = 'SELECT * FROM siswa WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (kelas_id) {
      query += ' AND kelas_id = ?';
      params.push(kelas_id);
    }

    query += ' ORDER BY nama_siswa';

    const stmt = c.env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all<Siswa>();

    return c.json(results || []);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data siswa' }, 500);
  }
});

// GET siswa by ID
siswa.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(
      'SELECT * FROM siswa WHERE id = ?'
    ).bind(id).first<Siswa>();

    if (!result) {
      return c.json({ error: 'Siswa tidak ditemukan' }, 404);
    }

    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Gagal mengambil data siswa' }, 500);
  }
});

// POST create siswa
siswa.post('/', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { 
      nis, nama_siswa, jenjang, kelas_id, tanggal_masuk, status,
      beasiswa_jenis, beasiswa_potongan 
    } = await c.req.json();

    if (!nis || !nama_siswa || !jenjang || !kelas_id || !tanggal_masuk) {
      return c.json({ error: 'Data wajib tidak lengkap' }, 400);
    }

    // Check NIS unique
    const existingNIS = await c.env.DB.prepare(
      'SELECT id FROM siswa WHERE nis = ?'
    ).bind(nis).first();

    if (existingNIS) {
      return c.json({ error: 'NIS sudah terdaftar' }, 400);
    }

    const id = generateUUID();
    const beasiswaPotonganStr = beasiswa_potongan ? JSON.stringify(beasiswa_potongan) : null;

    await c.env.DB.prepare(`
      INSERT INTO siswa (id, nis, nama_siswa, jenjang, kelas_id, tanggal_masuk, status, 
        beasiswa_jenis, beasiswa_potongan, beasiswa_tanggal, dibuat_oleh)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, nis, nama_siswa, jenjang, kelas_id, tanggal_masuk, status || 'Aktif',
      beasiswa_jenis || null, beasiswaPotonganStr, 
      beasiswa_jenis ? new Date().toISOString() : null,
      user.nama_pengguna
    ).run();

    return c.json({ success: true, id }, 201);
  } catch (error) {
    return c.json({ error: 'Gagal membuat data siswa' }, 500);
  }
});

// PUT update siswa
siswa.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { 
      nis, nama_siswa, jenjang, kelas_id, tanggal_masuk, status,
      beasiswa_jenis, beasiswa_potongan 
    } = await c.req.json();

    // Check NIS unique (exclude current siswa)
    const existingNIS = await c.env.DB.prepare(
      'SELECT id FROM siswa WHERE nis = ? AND id != ?'
    ).bind(nis, id).first();

    if (existingNIS) {
      return c.json({ error: 'NIS sudah terdaftar' }, 400);
    }

    const beasiswaPotonganStr = beasiswa_potongan ? JSON.stringify(beasiswa_potongan) : null;

    await c.env.DB.prepare(`
      UPDATE siswa SET nis = ?, nama_siswa = ?, jenjang = ?, kelas_id = ?, 
        tanggal_masuk = ?, status = ?, beasiswa_jenis = ?, beasiswa_potongan = ?
      WHERE id = ?
    `).bind(
      nis, nama_siswa, jenjang, kelas_id, tanggal_masuk, status,
      beasiswa_jenis || null, beasiswaPotonganStr, id
    ).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Gagal mengupdate data siswa' }, 500);
  }
});

// POST bulk naik kelas
siswa.post('/naik-kelas', async (c) => {
  try {
    const { dari_kelas_id, ke_kelas_id } = await c.req.json();

    if (!dari_kelas_id || !ke_kelas_id) {
      return c.json({ error: 'Kelas asal dan tujuan wajib diisi' }, 400);
    }

    const result = await c.env.DB.prepare(
      "UPDATE siswa SET kelas_id = ? WHERE kelas_id = ? AND status = 'Aktif'"
    ).bind(ke_kelas_id, dari_kelas_id).run();

    return c.json({ success: true, updated: result.meta.changes });
  } catch (error) {
    return c.json({ error: 'Gagal proses naik kelas' }, 500);
  }
});

// POST bulk import siswa
siswa.post('/import', async (c) => {
  try {
    const user = c.get('user') as AuthUser;
    const { siswa_list } = await c.req.json();

    if (!Array.isArray(siswa_list) || siswa_list.length === 0) {
      return c.json({ error: 'Data siswa tidak valid' }, 400);
    }

    const batch = c.env.DB.batch();
    
    for (const s of siswa_list) {
      const id = generateUUID();
      batch.push(c.env.DB.prepare(`
        INSERT INTO siswa (id, nis, nama_siswa, jenjang, kelas_id, tanggal_masuk, status, dibuat_oleh)
        VALUES (?, ?, ?, ?, ?, ?, 'Aktif', ?)
      `).bind(id, s.nis, s.nama_siswa, s.jenjang, s.kelas_id, s.tanggal_masuk, user.nama_pengguna));
    }

    await batch;

    return c.json({ success: true, imported: siswa_list.length }, 201);
  } catch (error) {
    return c.json({ error: 'Gagal import data siswa' }, 500);
  }
});

export default siswa;
