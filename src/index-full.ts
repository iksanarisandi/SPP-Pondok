// Main Hono Application - FULL FRONTEND VERSION
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';

// Import routes
import auth from './routes/auth';
import kelas from './routes/kelas';
import siswa from './routes/siswa';
import pembayaran from './routes/pembayaran';
import transaksi from './routes/transaksi';
import roles from './routes/roles';

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('*', cors());

// API Routes
app.route('/api/auth', auth);
app.route('/api/kelas', kelas);
app.route('/api/siswa', siswa);
app.route('/api/pembayaran', pembayaran);
app.route('/api/transaksi', transaksi);
app.route('/api/roles', roles);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static HTML (frontend) - FULL VERSION
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sistem Pembayaran SPP - Pondok Pesantren Bali Bina Insani</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <style>
    [x-cloak] { display: none !important; }
    .toast { position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .toast-item { animation: slideIn 0.3s ease; }
  </style>
</head>
<body class="bg-gray-50">
  <div x-data="sppApp()" x-init="init()" x-cloak>
    
    <!-- Toast Notifications -->
    <div class="toast">
      <template x-for="toast in toasts" :key="toast.id">
        <div class="toast-item mb-2 p-4 rounded-lg shadow-lg" 
          :class="{
            'bg-green-500 text-white': toast.type === 'success',
            'bg-red-500 text-white': toast.type === 'error',
            'bg-blue-500 text-white': toast.type === 'info'
          }">
          <p x-text="toast.message"></p>
        </div>
      </template>
    </div>

    <!-- Login Page -->
    <div x-show="!user" class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="w-full max-w-md p-8 space-y-6 bg-white shadow-2xl rounded-2xl">
        <div class="text-center">
          <div class="mx-auto mb-4 w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <span class="text-white text-4xl font-bold">BBI</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Sistem Pembayaran SPP</h1>
          <p class="text-gray-600 mt-2">Pondok Pesantren Bali Bina Insani</p>
        </div>
        <form @submit.prevent="login" class="space-y-4">
          <div>
            <input 
              type="text" 
              x-model="loginForm.kode_akses"
              placeholder="Masukkan Kode Akses Unik"
              class="w-full px-4 py-3 text-center border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <p x-show="loginError" x-text="loginError" class="text-sm text-red-600 text-center font-medium"></p>
          <button 
            type="submit" 
            :disabled="loginLoading"
            class="w-full px-4 py-3 text-white font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
          >
            <span x-show="!loginLoading">🔐 Masuk</span>
            <span x-show="loginLoading">⏳ Loading...</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Main Dashboard (Bendahara) -->
    <div x-show="user && user.role === 'bendahara'" class="flex h-screen">
      <aside class="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col shadow-xl">
        <div class="h-16 flex items-center justify-center border-b border-slate-700">
          <h2 class="font-bold text-lg">📊 Dashboard Bendahara</h2>
        </div>
        <nav class="flex-1 p-4 space-y-2">
          <button @click="currentView = 'dashboard'; loadDashboardData()" 
            :class="currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'"
            class="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <span>🏠</span> Dashboard
          </button>
          <button @click="currentView = 'kelas'; loadKelas()" 
            :class="currentView === 'kelas' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'"
            class="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <span>🏫</span> Manajemen Kelas
          </button>
          <button @click="currentView = 'siswa'; loadSiswa()" 
            :class="currentView === 'siswa' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'"
            class="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <span>👥</span> Manajemen Siswa
          </button>
          <button @click="currentView = 'pembayaran'; loadPembayaran()" 
            :class="currentView === 'pembayaran' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'"
            class="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <span>💰</span> Jenis Pembayaran
          </button>
          <button @click="currentView = 'laporan'; loadKelas()" 
            :class="currentView === 'laporan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'"
            class="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <span>📄</span> Laporan
          </button>
        </nav>
        <div class="p-4 border-t border-slate-700">
          <p class="text-xs text-slate-400 text-center">v1.0.0 | Cloudflare Workers</p>
        </div>
      </aside>
      
      <main class="flex-1 flex flex-col bg-gray-50">
        <header class="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 class="text-lg font-semibold text-gray-800">Selamat Datang, <span x-text="user.nama_pengguna" class="text-blue-600"></span></h1>
            <p class="text-xs text-gray-500" x-text="new Date().toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})"></p>
          </div>
          <button @click="logout" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            🚪 Logout
          </button>
        </header>
        <div class="flex-1 p-6 overflow-y-auto">
          <!-- Dashboard Bendahara Home -->
          <div x-show="currentView === 'dashboard'">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">📊 Dashboard Bendahara</h2>
            
            <!-- Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">Siswa Aktif</p>
                    <p class="text-3xl font-bold mt-2" x-text="metrics.siswaAktif || 0"></p>
                  </div>
                  <div class="text-5xl opacity-50">👥</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">Transaksi Bulan Ini</p>
                    <p class="text-3xl font-bold mt-2" x-text="metrics.transaksiBulanIni || 0"></p>
                  </div>
                  <div class="text-5xl opacity-50">📝</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">Pendapatan Bulan Ini</p>
                    <p class="text-xl font-bold mt-2">Rp <span x-text="formatRupiah(metrics.pendapatanBulanIni || 0)"></span></p>
                  </div>
                  <div class="text-5xl opacity-50">💰</div>
                </div>
              </div>
            </div>

            <!-- Quick Search Siswa -->
            <div class="bg-white p-6 rounded-xl shadow-md">
              <h3 class="text-lg font-semibold mb-4">🔍 Pencarian Cepat Siswa</h3>
              <input 
                type="text" 
                x-model="searchSiswaQuery"
                @input="searchSiswa"
                placeholder="Ketik nama siswa untuk mencari..."
                class="w-full px-4 py-2 border rounded-lg mb-4"
              />
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <template x-for="s in filteredSiswaSearch" :key="s.id">
                  <button @click="selectSiswaForPayment(s)" 
                    class="p-4 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all">
                    <p class="font-semibold text-gray-800 text-sm" x-text="s.nama_siswa"></p>
                    <p class="text-xs text-gray-500" x-text="getKelasName(s.kelas_id)"></p>
                  </button>
                </template>
              </div>
              <p x-show="searchSiswaQuery && filteredSiswaSearch.length === 0" class="text-center text-gray-500 py-4">
                Tidak ada siswa ditemukan
              </p>
            </div>
          </div>

          <!-- Manajemen Kelas -->
          <div x-show="currentView === 'kelas'">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-800">🏫 Manajemen Kelas</h2>
              <div class="flex gap-2">
                <button @click="openNaikKelasModal" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  ⬆️ Naik Kelas
                </button>
                <button @click="openKelasModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  ➕ Tambah Kelas
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- MTs -->
              <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-lg mb-4 text-blue-700 border-b pb-2">Jenjang MTs</h3>
                <div class="space-y-2">
                  <template x-for="k in kelasList.filter(x => x.jenjang === 'MTs')" :key="k.id">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span class="font-medium" x-text="k.nama_kelas"></span>
                      <div class="flex gap-2">
                        <button @click="editKelas(k)" class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                          ✏️ Edit
                        </button>
                        <button @click="deleteKelas(k.id)" class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  </template>
                  <p x-show="kelasList.filter(x => x.jenjang === 'MTs').length === 0" class="text-gray-500 text-center py-4">
                    Belum ada kelas MTs
                  </p>
                </div>
              </div>

              <!-- MA -->
              <div class="bg-white p-6 rounded-xl shadow-md">
                <h3 class="font-semibold text-lg mb-4 text-green-700 border-b pb-2">Jenjang MA</h3>
                <div class="space-y-2">
                  <template x-for="k in kelasList.filter(x => x.jenjang === 'MA')" :key="k.id">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span class="font-medium" x-text="k.nama_kelas"></span>
                      <div class="flex gap-2">
                        <button @click="editKelas(k)" class="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                          ✏️ Edit
                        </button>
                        <button @click="deleteKelas(k.id)" class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  </template>
                  <p x-show="kelasList.filter(x => x.jenjang === 'MA').length === 0" class="text-gray-500 text-center py-4">
                    Belum ada kelas MA
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Manajemen Siswa -->
          <div x-show="currentView === 'siswa'">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-800">👥 Manajemen Siswa</h2>
              <div class="flex gap-2">
                <select x-model="siswaFilter" @change="loadSiswa" class="px-4 py-2 border rounded-lg">
                  <option value="Aktif">Siswa Aktif</option>
                  <option value="Lulus">Siswa Lulus</option>
                  <option value="Pindah">Siswa Pindah</option>
                </select>
                <button @click="openSiswaModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  ➕ Tambah Siswa
                </button>
              </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-md overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Siswa</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Masuk</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <template x-for="s in siswaList" :key="s.id">
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm font-mono" x-text="s.nis"></td>
                        <td class="px-6 py-4 text-sm font-medium" x-text="s.nama_siswa"></td>
                        <td class="px-6 py-4 text-sm">
                          <span x-text="getKelasName(s.kelas_id)"></span>
                          <span class="text-gray-400 text-xs" x-text="'(' + s.jenjang + ')'"></span>
                        </td>
                        <td class="px-6 py-4 text-sm" x-text="formatDate(s.tanggal_masuk)"></td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-1 text-xs font-semibold rounded-full" 
                            :class="{
                              'bg-green-100 text-green-800': s.status === 'Aktif',
                              'bg-blue-100 text-blue-800': s.status === 'Lulus',
                              'bg-yellow-100 text-yellow-800': s.status === 'Pindah'
                            }"
                            x-text="s.status">
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <button @click="editSiswa(s)" class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <p x-show="siswaList.length === 0" class="text-center text-gray-500 py-8">
                Tidak ada data siswa
              </p>
            </div>
          </div>

          <!-- Manajemen Pembayaran -->
          <div x-show="currentView === 'pembayaran'">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-800">💰 Manajemen Jenis Pembayaran</h2>
              <button @click="openPembayaranModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                ➕ Tambah Jenis Pembayaran
              </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-md overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Pembayaran</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenjang</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <template x-for="p in pembayaranList" :key="p.id">
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm font-medium" x-text="p.nama_pembayaran"></td>
                        <td class="px-6 py-4 text-sm font-semibold text-green-600">Rp <span x-text="formatRupiah(p.nominal)"></span></td>
                        <td class="px-6 py-4 text-sm" x-text="p.jenjang"></td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800" x-text="p.tipe_pembayaran"></span>
                        </td>
                        <td class="px-6 py-4">
                          <button @click="editPembayaran(p)" class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                            ✏️ Edit
                          </button>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <p x-show="pembayaranList.length === 0" class="text-center text-gray-500 py-8">
                Tidak ada data pembayaran
              </p>
            </div>
          </div>

          <!-- Laporan -->
          <div x-show="currentView === 'laporan'">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">📄 Laporan Pembayaran & Tunggakan</h2>
            
            <div class="bg-white p-6 rounded-xl shadow-md">
              <h3 class="text-lg font-semibold mb-4">Generate Laporan Per Kelas</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">Pilih Kelas</label>
                  <select x-model="laporanKelasId" class="w-full px-4 py-2 border rounded-lg">
                    <option value="">-- Pilih Kelas --</option>
                    <template x-for="k in kelasList" :key="k.id">
                      <option :value="k.id" x-text="k.nama_kelas + ' (' + k.jenjang + ')'"></option>
                    </template>
                  </select>
                </div>
                <div class="flex items-end">
                  <button @click="exportLaporanPDF" :disabled="!laporanKelasId" 
                    class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    📄 Export PDF
                  </button>
                </div>
                <div class="flex items-end">
                  <button @click="exportLaporanExcel" :disabled="!laporanKelasId"
                    class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    📊 Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Main Dashboard (Pimpinan) -->
    <div x-show="user && user.role === 'pimpinan'" class="flex h-screen">
      <aside class="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col shadow-xl">
        <div class="h-16 flex items-center justify-center border-b border-slate-700">
          <h2 class="font-bold text-lg">👔 Dashboard Pimpinan</h2>
        </div>
        <nav class="flex-1 p-4 space-y-2">
          <button @click="currentView = 'ringkasan'; loadRingkasan()" 
            :class="currentView === 'ringkasan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'"
            class="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <span>📊</span> Dashboard Ringkasan
          </button>
          <button @click="currentView = 'bendahara'; loadBendahara()" 
            :class="currentView === 'bendahara' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700'"
            class="w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-all flex items-center gap-2">
            <span>👥</span> Manajemen Bendahara
          </button>
        </nav>
        <div class="p-4 border-t border-slate-700">
          <p class="text-xs text-slate-400 text-center">v1.0.0 | Cloudflare Workers</p>
        </div>
      </aside>
      
      <main class="flex-1 flex flex-col bg-gray-50">
        <header class="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 class="text-lg font-semibold text-gray-800">Selamat Datang, <span x-text="user.nama_pengguna" class="text-blue-600"></span></h1>
            <p class="text-xs text-gray-500" x-text="new Date().toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})"></p>
          </div>
          <button @click="logout" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            🚪 Logout
          </button>
        </header>
        <div class="flex-1 p-6 overflow-y-auto">
          <!-- Dashboard Ringkasan -->
          <div x-show="currentView === 'ringkasan'">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">📊 Dashboard Ringkasan</h2>
            
            <!-- Metrics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div class="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">Total Pemasukan</p>
                    <p class="text-xl font-bold mt-2">Rp <span x-text="formatRupiah(pimpinanMetrics.totalPemasukan || 0)"></span></p>
                  </div>
                  <div class="text-4xl opacity-50">💰</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-green-500 to-teal-600 text-white p-6 rounded-xl shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">Siswa Aktif</p>
                    <p class="text-3xl font-bold mt-2" x-text="pimpinanMetrics.siswaAktif || 0"></p>
                  </div>
                  <div class="text-4xl opacity-50">👥</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-xl shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">Penerima Beasiswa</p>
                    <p class="text-3xl font-bold mt-2" x-text="pimpinanMetrics.beasiswa || 0"></p>
                  </div>
                  <div class="text-4xl opacity-50">🎓</div>
                </div>
              </div>
              <div class="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm opacity-90">Total Transaksi</p>
                    <p class="text-3xl font-bold mt-2" x-text="pimpinanMetrics.totalTransaksi || 0"></p>
                  </div>
                  <div class="text-4xl opacity-50">📝</div>
                </div>
              </div>
            </div>

            <!-- Chart -->
            <div class="bg-white p-6 rounded-xl shadow-md">
              <h3 class="text-lg font-semibold mb-4">Tren Pembayaran Bulanan</h3>
              <canvas id="monthlyChart" width="400" height="100"></canvas>
            </div>
          </div>

          <!-- Manajemen Bendahara -->
          <div x-show="currentView === 'bendahara'">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-2xl font-bold text-gray-800">👥 Manajemen Akun Bendahara</h2>
              <button @click="openBendaharaModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                ➕ Tambah Bendahara
              </button>
            </div>
            
            <div class="bg-white rounded-xl shadow-md overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Bendahara</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Akses</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <template x-for="b in bendaharaList" :key="b.id">
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm font-medium" x-text="b.nama_pengguna"></td>
                        <td class="px-6 py-4 text-sm font-mono font-semibold text-blue-600" x-text="b.kode_akses"></td>
                        <td class="px-6 py-4">
                          <span class="px-2 py-1 text-xs font-semibold rounded-full" 
                            :class="b.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                            x-text="b.aktif ? 'Aktif' : 'Non-Aktif'">
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <button @click="toggleBendahara(b)" 
                            :class="b.aktif ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'"
                            class="px-3 py-1 text-sm rounded">
                            <span x-text="b.aktif ? '🚫 Non-Aktifkan' : '✅ Aktifkan'"></span>
                          </button>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              <p x-show="bendaharaList.length === 0" class="text-center text-gray-500 py-8">
                Tidak ada data bendahara
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal Kelas -->
    <div x-show="kelasModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="kelasModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4" x-text="kelasForm.id ? 'Edit Kelas' : 'Tambah Kelas Baru'"></h3>
        <form @submit.prevent="saveKelas" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Jenjang</label>
            <select x-model="kelasForm.jenjang" class="w-full px-4 py-2 border rounded-lg" required>
              <option value="MTs">MTs</option>
              <option value="MA">MA</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Nama Kelas</label>
            <input type="text" x-model="kelasForm.nama_kelas" class="w-full px-4 py-2 border rounded-lg" required placeholder="Contoh: VII A">
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="kelasModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Naik Kelas -->
    <div x-show="naikKelasModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="naikKelasModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">⬆️ Proses Kenaikan Kelas</h3>
        <p class="text-sm text-gray-600 mb-4">Fitur ini akan memindahkan SEMUA siswa aktif dari kelas asal ke kelas tujuan.</p>
        <form @submit.prevent="prosesNaikKelas" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Dari Kelas</label>
            <select x-model="naikKelasForm.dari" class="w-full px-4 py-2 border rounded-lg" required>
              <option value="">-- Pilih Kelas Asal --</option>
              <template x-for="k in kelasList" :key="k.id">
                <option :value="k.id" x-text="k.nama_kelas + ' (' + k.jenjang + ')'"></option>
              </template>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Ke Kelas</label>
            <select x-model="naikKelasForm.ke" class="w-full px-4 py-2 border rounded-lg" required>
              <option value="">-- Pilih Kelas Tujuan --</option>
              <template x-for="k in kelasList" :key="k.id">
                <option :value="k.id" x-text="k.nama_kelas + ' (' + k.jenjang + ')'"></option>
              </template>
            </select>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" @click="naikKelasModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Promosikan Siswa</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Siswa -->
    <div x-show="siswaModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" @click.self="siswaModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl m-4">
        <h3 class="text-lg font-bold mb-4" x-text="siswaForm.id ? 'Edit Data Siswa' : 'Tambah Siswa Baru'"></h3>
        <form @submit.prevent="saveSiswa" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">NIS</label>
              <input type="text" x-model="siswaForm.nis" class="w-full px-4 py-2 border rounded-lg" required placeholder="MTS-001">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Nama Siswa</label>
              <input type="text" x-model="siswaForm.nama_siswa" class="w-full px-4 py-2 border rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Jenjang</label>
              <select x-model="siswaForm.jenjang" @change="siswaForm.kelas_id = ''" class="w-full px-4 py-2 border rounded-lg" required>
                <option value="MTs">MTs</option>
                <option value="MA">MA</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Kelas</label>
              <select x-model="siswaForm.kelas_id" class="w-full px-4 py-2 border rounded-lg" required>
                <option value="">-- Pilih Kelas --</option>
                <template x-for="k in kelasList.filter(x => x.jenjang === siswaForm.jenjang)" :key="k.id">
                  <option :value="k.id" x-text="k.nama_kelas"></option>
                </template>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Tanggal Masuk</label>
              <input type="date" x-model="siswaForm.tanggal_masuk" class="w-full px-4 py-2 border rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Status</label>
              <select x-model="siswaForm.status" class="w-full px-4 py-2 border rounded-lg" required>
                <option value="Aktif">Aktif</option>
                <option value="Lulus">Lulus</option>
                <option value="Pindah">Pindah</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" @click="siswaModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Pembayaran -->
    <div x-show="pembayaranModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" @click.self="pembayaranModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl m-4">
        <h3 class="text-lg font-bold mb-4" x-text="pembayaranForm.id ? 'Edit Jenis Pembayaran' : 'Tambah Jenis Pembayaran'"></h3>
        <form @submit.prevent="savePembayaran" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nama Pembayaran</label>
              <input type="text" x-model="pembayaranForm.nama_pembayaran" class="w-full px-4 py-2 border rounded-lg" required placeholder="Contoh: SPP">
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Nominal</label>
              <input type="number" x-model="pembayaranForm.nominal" class="w-full px-4 py-2 border rounded-lg" required>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Jenjang</label>
              <select x-model="pembayaranForm.jenjang" class="w-full px-4 py-2 border rounded-lg" required>
                <option value="MTs">MTs</option>
                <option value="MA">MA</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Tipe Pembayaran</label>
              <select x-model="pembayaranForm.tipe_pembayaran" class="w-full px-4 py-2 border rounded-lg" required>
                <option value="Berulang">Berulang</option>
                <option value="Sekali Bayar (Tunai)">Sekali Bayar (Tunai)</option>
                <option value="Sekali Bayar (Bisa Dicicil)">Sekali Bayar (Bisa Dicicil)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Berlaku untuk Kelas:</label>
            <div class="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              <template x-for="k in kelasList.filter(x => x.jenjang === pembayaranForm.jenjang)" :key="k.id">
                <label class="flex items-center gap-2">
                  <input type="checkbox" :value="k.id" 
                    :checked="pembayaranForm.berlaku_untuk.includes(k.id)"
                    @change="toggleKelasSelection(k.id)"
                    class="rounded">
                  <span class="text-sm" x-text="k.nama_kelas"></span>
                </label>
              </template>
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-4 border-t">
            <button type="button" @click="pembayaranModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Simpan</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Bendahara (Pimpinan) -->
    <div x-show="bendaharaModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="bendaharaModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">➕ Daftarkan Bendahara Baru</h3>
        <div x-show="!newBendaharaResult">
          <form @submit.prevent="saveBendahara" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Nama Bendahara</label>
              <input type="text" x-model="bendaharaForm.nama_pengguna" class="w-full px-4 py-2 border rounded-lg" required placeholder="Nama Lengkap">
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" @click="bendaharaModal = false" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Batal</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Daftarkan & Buat Kode</button>
            </div>
          </form>
        </div>
        <div x-show="newBendaharaResult" class="text-center space-y-4">
          <h3 class="text-lg font-semibold text-green-600">✅ Pendaftaran Berhasil!</h3>
          <p class="text-sm">Silakan berikan informasi berikut kepada bendahara baru:</p>
          <div class="p-4 bg-gray-100 rounded-lg">
            <p class="text-sm">Nama: <span class="font-bold" x-text="newBendaharaResult?.nama_pengguna"></span></p>
            <p class="text-sm mt-2">Kode Akses:</p>
            <p class="text-2xl font-bold text-blue-600 font-mono" x-text="newBendaharaResult?.kode_akses"></p>
          </div>
          <button @click="bendaharaModal = false; newBendaharaResult = null" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Selesai</button>
        </div>
      </div>
    </div>

  </div>

  <script>
    const API_BASE = '';
    
    function sppApp() {
      return {
        user: null,
        currentView: 'dashboard',
        loginForm: { kode_akses: '' },
        loginError: '',
        loginLoading: false,
        toasts: [],
        
        // Data
        kelasList: [],
        siswaList: [],
        pembayaranList: [],
        transaksiList: [],
        bendaharaList: [],
        
        // Metrics
        metrics: {
          siswaAktif: 0,
          transaksiBulanIni: 0,
          pendapatanBulanIni: 0
        },
        pimpinanMetrics: {
          totalPemasukan: 0,
          siswaAktif: 0,
          beasiswa: 0,
          totalTransaksi: 0
        },
        
        // Search & Filters
        searchSiswaQuery: '',
        filteredSiswaSearch: [],
        siswaFilter: 'Aktif',
        
        // Modals
        kelasModal: false,
        naikKelasModal: false,
        siswaModal: false,
        pembayaranModal: false,
        bendaharaModal: false,
        
        // Forms
        kelasForm: { id: null, jenjang: 'MTs', nama_kelas: '' },
        naikKelasForm: { dari: '', ke: '' },
        siswaForm: { id: null, nis: '', nama_siswa: '', jenjang: 'MTs', kelas_id: '', tanggal_masuk: '', status: 'Aktif' },
        pembayaranForm: { id: null, nama_pembayaran: '', nominal: 0, jenjang: 'MTs', tipe_pembayaran: 'Berulang', berlaku_untuk: [] },
        bendaharaForm: { nama_pengguna: '' },
        newBendaharaResult: null,
        
        // Laporan
        laporanKelasId: '',
        monthlyChart: null,
        
        async init() {
          const savedUser = localStorage.getItem('spp_user');
          if (savedUser) {
            this.user = JSON.parse(savedUser);
            this.currentView = this.user.role === 'bendahara' ? 'dashboard' : 'ringkasan';
            if (this.user.role === 'bendahara') {
              this.loadDashboardData();
            } else {
              this.loadRingkasan();
            }
          }
        },
        
        async login() {
          this.loginLoading = true;
          this.loginError = '';
          
          try {
            const response = await fetch(API_BASE + '/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.loginForm)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
              this.user = data.user;
              localStorage.setItem('spp_user', JSON.stringify(data.user));
              this.currentView = this.user.role === 'bendahara' ? 'dashboard' : 'ringkasan';
              this.showToast('Login berhasil! Selamat datang, ' + this.user.nama_pengguna, 'success');
              
              setTimeout(() => {
                if (this.user.role === 'bendahara') {
                  this.loadDashboardData();
                } else {
                  this.loadRingkasan();
                }
              }, 100);
            } else {
              this.loginError = data.error || 'Login gagal';
            }
          } catch (error) {
            this.loginError = 'Kesalahan koneksi ke server';
          } finally {
            this.loginLoading = false;
          }
        },
        
        logout() {
          this.user = null;
          this.loginForm.kode_akses = '';
          localStorage.removeItem('spp_user');
          this.currentView = 'dashboard';
          this.showToast('Berhasil logout', 'info');
        },
        
        showToast(message, type = 'info') {
          const id = Date.now();
          this.toasts.push({ id, message, type });
          setTimeout(() => {
            this.toasts = this.toasts.filter(t => t.id !== id);
          }, 3000);
        },
        
        async apiCall(endpoint, method = 'GET', body = null) {
          const options = {
            method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + this.user.kode_akses
            }
          };
          if (body) options.body = JSON.stringify(body);
          
          const response = await fetch(API_BASE + endpoint, options);
          return await response.json();
        },
        
        async loadDashboardData() {
          try {
            await Promise.all([
              this.loadKelas(),
              this.loadSiswa(),
              this.loadPembayaran()
            ]);
            
            const stats = await this.apiCall('/api/transaksi/stats/dashboard');
            this.metrics.transaksiBulanIni = stats.bulan_ini?.jumlah_transaksi || 0;
            this.metrics.pendapatanBulanIni = stats.bulan_ini?.total_pendapatan || 0;
            this.metrics.siswaAktif = this.siswaList.filter(s => s.status === 'Aktif').length;
            
            this.searchSiswa();
          } catch (error) {
            console.error('Error loading dashboard:', error);
          }
        },
        
        async loadKelas() {
          try {
            this.kelasList = await this.apiCall('/api/kelas');
          } catch (error) {
            this.showToast('Gagal memuat data kelas', 'error');
          }
        },
        
        async loadSiswa() {
          try {
            this.siswaList = await this.apiCall('/api/siswa?status=' + this.siswaFilter);
          } catch (error) {
            this.showToast('Gagal memuat data siswa', 'error');
          }
        },
        
        async loadPembayaran() {
          try {
            this.pembayaranList = await this.apiCall('/api/pembayaran');
            // Parse JSON strings
            this.pembayaranList = this.pembayaranList.map(p => ({
              ...p,
              berlaku_untuk: typeof p.berlaku_untuk === 'string' ? JSON.parse(p.berlaku_untuk) : p.berlaku_untuk
            }));
          } catch (error) {
            this.showToast('Gagal memuat data pembayaran', 'error');
          }
        },
        
        searchSiswa() {
          if (!this.searchSiswaQuery) {
            this.filteredSiswaSearch = this.siswaList.filter(s => s.status === 'Aktif').slice(0, 20);
          } else {
            const query = this.searchSiswaQuery.toLowerCase();
            this.filteredSiswaSearch = this.siswaList.filter(s => 
              s.status === 'Aktif' && s.nama_siswa.toLowerCase().includes(query)
            ).slice(0, 20);
          }
        },
        
        selectSiswaForPayment(siswa) {
          this.showToast('Fitur pembayaran cepat akan segera ditambahkan!', 'info');
        },
        
        getKelasName(kelasId) {
          const kelas = this.kelasList.find(k => k.id === kelasId);
          return kelas ? kelas.nama_kelas : 'N/A';
        },
        
        formatDate(dateString) {
          return new Date(dateString).toLocaleDateString('id-ID');
        },
        
        formatRupiah(amount) {
          return new Intl.NumberFormat('id-ID').format(amount);
        },
        
        // Kelas CRUD
        openKelasModal(kelas = null) {
          if (kelas) {
            this.kelasForm = { ...kelas };
          } else {
            this.kelasForm = { id: null, jenjang: 'MTs', nama_kelas: '' };
          }
          this.kelasModal = true;
        },
        
        editKelas(kelas) {
          this.openKelasModal(kelas);
        },
        
        async saveKelas() {
          try {
            const method = this.kelasForm.id ? 'PUT' : 'POST';
            const endpoint = this.kelasForm.id ? \`/api/kelas/\${this.kelasForm.id}\` : '/api/kelas';
            
            await this.apiCall(endpoint, method, {
              jenjang: this.kelasForm.jenjang,
              nama_kelas: this.kelasForm.nama_kelas
            });
            
            this.showToast('Kelas berhasil disimpan!', 'success');
            this.kelasModal = false;
            this.loadKelas();
          } catch (error) {
            this.showToast('Gagal menyimpan kelas', 'error');
          }
        },
        
        async deleteKelas(id) {
          if (!confirm('Apakah Anda yakin ingin menghapus kelas ini?')) return;
          
          try {
            await this.apiCall(\`/api/kelas/\${id}\`, 'DELETE');
            this.showToast('Kelas berhasil dihapus!', 'success');
            this.loadKelas();
          } catch (error) {
            this.showToast('Gagal menghapus kelas. Mungkin masih ada siswa di kelas ini.', 'error');
          }
        },
        
        openNaikKelasModal() {
          this.naikKelasForm = { dari: '', ke: '' };
          this.naikKelasModal = true;
        },
        
        async prosesNaikKelas() {
          try {
            const result = await this.apiCall('/api/siswa/naik-kelas', 'POST', {
              dari_kelas_id: this.naikKelasForm.dari,
              ke_kelas_id: this.naikKelasForm.ke
            });
            
            this.showToast(\`Berhasil memindahkan \${result.updated} siswa!\`, 'success');
            this.naikKelasModal = false;
            this.loadSiswa();
          } catch (error) {
            this.showToast('Gagal proses naik kelas', 'error');
          }
        },
        
        // Siswa CRUD
        openSiswaModal(siswa = null) {
          if (siswa) {
            this.siswaForm = { ...siswa };
          } else {
            this.siswaForm = {
              id: null, nis: '', nama_siswa: '', jenjang: 'MTs', 
              kelas_id: '', tanggal_masuk: new Date().toISOString().split('T')[0], status: 'Aktif'
            };
          }
          this.siswaModal = true;
        },
        
        editSiswa(siswa) {
          this.openSiswaModal(siswa);
        },
        
        async saveSiswa() {
          try {
            const method = this.siswaForm.id ? 'PUT' : 'POST';
            const endpoint = this.siswaForm.id ? \`/api/siswa/\${this.siswaForm.id}\` : '/api/siswa';
            
            await this.apiCall(endpoint, method, this.siswaForm);
            
            this.showToast('Data siswa berhasil disimpan!', 'success');
            this.siswaModal = false;
            this.loadSiswa();
            this.loadDashboardData();
          } catch (error) {
            this.showToast('Gagal menyimpan data siswa', 'error');
          }
        },
        
        // Pembayaran CRUD
        openPembayaranModal(pembayaran = null) {
          if (pembayaran) {
            this.pembayaranForm = { ...pembayaran };
          } else {
            this.pembayaranForm = {
              id: null, nama_pembayaran: '', nominal: 0, jenjang: 'MTs', 
              tipe_pembayaran: 'Berulang', berlaku_untuk: []
            };
          }
          this.pembayaranModal = true;
        },
        
        editPembayaran(pembayaran) {
          this.openPembayaranModal(pembayaran);
        },
        
        toggleKelasSelection(kelasId) {
          const index = this.pembayaranForm.berlaku_untuk.indexOf(kelasId);
          if (index > -1) {
            this.pembayaranForm.berlaku_untuk.splice(index, 1);
          } else {
            this.pembayaranForm.berlaku_untuk.push(kelasId);
          }
        },
        
        async savePembayaran() {
          try {
            const method = this.pembayaranForm.id ? 'PUT' : 'POST';
            const endpoint = this.pembayaranForm.id ? \`/api/pembayaran/\${this.pembayaranForm.id}\` : '/api/pembayaran';
            
            await this.apiCall(endpoint, method, this.pembayaranForm);
            
            this.showToast('Jenis pembayaran berhasil disimpan!', 'success');
            this.pembayaranModal = false;
            this.loadPembayaran();
          } catch (error) {
            this.showToast('Gagal menyimpan jenis pembayaran', 'error');
          }
        },
        
        // Export Laporan
        async exportLaporanPDF() {
          if (!this.laporanKelasId) return;
          
          try {
            const kelas = this.kelasList.find(k => k.id === this.laporanKelasId);
            const transaksi = await this.apiCall(\`/api/transaksi?kelas_id=\${this.laporanKelasId}\`);
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(16);
            doc.text(\`Laporan Pembayaran - Kelas \${kelas.nama_kelas} (\${kelas.jenjang})\`, 14, 22);
            doc.setFontSize(10);
            doc.text(\`Tanggal Cetak: \${new Date().toLocaleDateString('id-ID')}\`, 14, 28);
            
            const tableData = transaksi.map(t => [
              this.formatDate(t.tanggal_bayar),
              t.nama_siswa,
              t.jenis_pembayaran_nama,
              \`Rp \${this.formatRupiah(t.nominal_dibayar)}\`
            ]);
            
            const total = transaksi.reduce((sum, t) => sum + t.nominal_dibayar, 0);
            
            doc.autoTable({
              startY: 35,
              head: [['Tanggal', 'Nama Siswa', 'Jenis Pembayaran', 'Nominal']],
              body: tableData,
              foot: [['Total Pemasukan', '', '', \`Rp \${this.formatRupiah(total)}\`]],
              theme: 'grid'
            });
            
            doc.save(\`laporan_pembayaran_\${kelas.nama_kelas}.pdf\`);
            this.showToast('Laporan PDF berhasil di-download!', 'success');
          } catch (error) {
            this.showToast('Gagal export PDF', 'error');
          }
        },
        
        async exportLaporanExcel() {
          if (!this.laporanKelasId) return;
          
          try {
            const kelas = this.kelasList.find(k => k.id === this.laporanKelasId);
            const transaksi = await this.apiCall(\`/api/transaksi?kelas_id=\${this.laporanKelasId}\`);
            
            const data = transaksi.map(t => ({
              'Tanggal': this.formatDate(t.tanggal_bayar),
              'Nama Siswa': t.nama_siswa,
              'Jenis Pembayaran': t.jenis_pembayaran_nama,
              'Nominal': t.nominal_dibayar
            }));
            
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan");
            XLSX.writeFile(wb, \`laporan_pembayaran_\${kelas.nama_kelas}.xlsx\`);
            
            this.showToast('Laporan Excel berhasil di-download!', 'success');
          } catch (error) {
            this.showToast('Gagal export Excel', 'error');
          }
        },
        
        // Pimpinan Functions
        async loadRingkasan() {
          try {
            await Promise.all([
              this.loadKelas(),
              this.loadSiswa()
            ]);
            
            const stats = await this.apiCall('/api/transaksi/stats/dashboard');
            const monthly = await this.apiCall('/api/transaksi/stats/monthly?limit=6');
            
            this.pimpinanMetrics.totalPemasukan = stats.total_keseluruhan || 0;
            this.pimpinanMetrics.siswaAktif = this.siswaList.filter(s => s.status === 'Aktif').length;
            this.pimpinanMetrics.beasiswa = this.siswaList.filter(s => s.beasiswa_jenis).length;
            this.pimpinanMetrics.totalTransaksi = stats.bulan_ini?.jumlah_transaksi || 0;
            
            this.$nextTick(() => {
              this.renderChart(monthly.reverse());
            });
          } catch (error) {
            console.error('Error loading ringkasan:', error);
          }
        },
        
        renderChart(monthlyData) {
          const canvas = document.getElementById('monthlyChart');
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          
          if (this.monthlyChart) {
            this.monthlyChart.destroy();
          }
          
          this.monthlyChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: monthlyData.map(d => d.month),
              datasets: [{
                label: 'Pendapatan (Rp)',
                data: monthlyData.map(d => d.total),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { display: true },
                tooltip: {
                  callbacks: {
                    label: (context) => 'Rp ' + this.formatRupiah(context.parsed.y)
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => 'Rp' + (value/1000000).toFixed(1) + 'Jt'
                  }
                }
              }
            }
          });
        },
        
        async loadBendahara() {
          try {
            this.bendaharaList = await this.apiCall('/api/roles/bendahara');
          } catch (error) {
            this.showToast('Gagal memuat data bendahara', 'error');
          }
        },
        
        openBendaharaModal() {
          this.bendaharaForm = { nama_pengguna: '' };
          this.newBendaharaResult = null;
          this.bendaharaModal = true;
        },
        
        async saveBendahara() {
          try {
            const result = await this.apiCall('/api/roles/bendahara', 'POST', this.bendaharaForm);
            this.newBendaharaResult = result;
            this.showToast('Bendahara baru berhasil dibuat!', 'success');
            this.loadBendahara();
          } catch (error) {
            this.showToast('Gagal membuat bendahara baru', 'error');
          }
        },
        
        async toggleBendahara(bendahara) {
          try {
            await this.apiCall(\`/api/roles/bendahara/\${bendahara.id}/toggle\`, 'PUT');
            this.showToast(\`Status bendahara \${bendahara.nama_pengguna} berhasil diubah!\`, 'success');
            this.loadBendahara();
          } catch (error) {
            this.showToast('Gagal mengubah status bendahara', 'error');
          }
        }
      }
    }
  </script>
</body>
</html>`);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;
