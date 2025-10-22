// ================================
// PAYMENT FEATURE - FULL IMPLEMENTATION
// Patch ini akan ditambahkan ke index.ts
// ================================

// PART 1: HTML MODALS (Insert sebelum closing </div> dari Alpine component)

const PAYMENT_MODALS_HTML = `
    <!-- Modal Pembayaran Cepat -->
    <div x-show="paymentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" @click.self="paymentModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4 border-b pb-4">
          <div>
            <h3 class="text-xl font-bold text-gray-800">💳 Proses Pembayaran</h3>
            <p class="text-sm text-gray-600" x-show="selectedSiswaForPayment">
              Siswa: <span class="font-semibold" x-text="selectedSiswaForPayment?.nama_siswa"></span> | 
              Kelas: <span class="font-semibold" x-text="getKelasName(selectedSiswaForPayment?.kelas_id)"></span>
            </p>
          </div>
          <button @click="paymentModal = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Loading State -->
        <div x-show="paymentLoading" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-4">Memuat tagihan...</p>
        </div>

        <!-- Tagihan List -->
        <div x-show="!paymentLoading" class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm font-semibold text-blue-800 mb-2">📋 Tagihan yang Belum Dibayar:</p>
            <p class="text-xs text-blue-600">Pilih tagihan yang akan dibayar. Anda bisa memilih beberapa tagihan sekaligus.</p>
          </div>

          <!-- Tagihan Items -->
          <div class="space-y-3 max-h-96 overflow-y-auto">
            <template x-for="tagihan in tagihanList" :key="tagihan.id">
              <div 
                @click="toggleTagihanSelection(tagihan)"
                class="p-4 rounded-lg border-2 transition-all cursor-pointer"
                :class="selectedTagihan.some(t => t.id === tagihan.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'">
                
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <input 
                        type="checkbox" 
                        :checked="selectedTagihan.some(t => t.id === tagihan.id)"
                        class="w-5 h-5 text-blue-600 rounded"
                        @click.stop
                      />
                      <h4 class="font-semibold text-gray-800" x-text="tagihan.nama_pembayaran"></h4>
                      <span 
                        class="px-2 py-1 text-xs font-semibold rounded-full"
                        :class="{
                          'bg-green-100 text-green-700': tagihan.tipe === 'Berulang',
                          'bg-yellow-100 text-yellow-700': tagihan.tipe === 'Sekali Bayar (Tunai)',
                          'bg-purple-100 text-purple-700': tagihan.tipe === 'Sekali Bayar (Bisa Dicicil)'
                        }"
                        x-text="tagihan.tipe">
                      </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span class="text-gray-600">Nominal Asli:</span>
                        <span class="font-semibold ml-1">Rp <span x-text="formatRupiah(tagihan.nominal_asli)"></span></span>
                      </div>
                      <div x-show="tagihan.potongan_beasiswa > 0">
                        <span class="text-red-600">Potongan Beasiswa:</span>
                        <span class="font-semibold ml-1 text-red-600">- Rp <span x-text="formatRupiah(tagihan.potongan_beasiswa)"></span></span>
                      </div>
                      <div x-show="tagihan.sisa_tagihan" class="col-span-2">
                        <span class="text-orange-600">Sisa Belum Dibayar:</span>
                        <span class="font-semibold ml-1 text-orange-600">Rp <span x-text="formatRupiah(tagihan.sisa_tagihan)"></span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="text-right ml-4">
                    <p class="text-xs text-gray-500 mb-1">Yang Harus Dibayar:</p>
                    <p class="text-2xl font-bold text-green-600">Rp <span x-text="formatRupiah(tagihan.nominal_bayar)"></span></p>
                  </div>
                </div>

                <!-- Input Cicilan untuk Sekali Bayar (Bisa Dicicil) -->
                <div x-show="selectedTagihan.some(t => t.id === tagihan.id) && tagihan.tipe === 'Sekali Bayar (Bisa Dicicil)'" class="mt-3 pt-3 border-t border-dashed">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    💵 Bayar Sebagian (Cicilan):
                  </label>
                  <input 
                    type="number" 
                    :value="cicilanAmounts[tagihan.id] || tagihan.nominal_bayar"
                    @input="updateCicilanAmount(tagihan.id, $event.target.value)"
                    @click.stop
                    :max="tagihan.nominal_bayar"
                    min="1"
                    class="w-full px-4 py-2 border rounded-lg"
                    :placeholder="'Maksimal: Rp ' + formatRupiah(tagihan.nominal_bayar)"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    Anda bisa membayar mulai dari Rp 1 sampai Rp <span x-text="formatRupiah(tagihan.nominal_bayar)"></span>
                  </p>
                </div>
              </div>
            </template>

            <p x-show="tagihanList.length === 0" class="text-center text-gray-500 py-8">
              🎉 Tidak ada tagihan! Semua pembayaran sudah lunas.
            </p>
          </div>

          <!-- Summary & Actions -->
          <div x-show="selectedTagihan.length > 0" class="border-t pt-4 mt-4">
            <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4">
              <div class="flex justify-between items-center">
                <div>
                  <p class="text-sm text-gray-600">Total yang akan dibayar:</p>
                  <p class="text-sm text-gray-500">(<span x-text="selectedTagihan.length"></span> tagihan dipilih)</p>
                </div>
                <p class="text-3xl font-bold text-gray-800">
                  Rp <span x-text="formatRupiah(calculateTotalPayment())"></span>
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button 
                @click="paymentModal = false" 
                type="button"
                class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                ❌ Batal
              </button>
              <button 
                @click="processPayment"
                :disabled="calculateTotalPayment() === 0"
                class="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
                ✅ Proses Pembayaran
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Bukti Pembayaran -->
    <div x-show="buktiModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="buktiModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl m-4">
        <div class="text-center mb-6">
          <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2">✅ Pembayaran Berhasil!</h3>
          <p class="text-gray-600">Bukti pembayaran telah dibuat</p>
        </div>

        <!-- Bukti Content -->
        <div id="bukti-content" class="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 mb-6">
          <div class="text-center mb-4 border-b pb-4">
            <h4 class="text-lg font-bold text-gray-800">BUKTI PEMBAYARAN</h4>
            <p class="text-sm text-gray-600">Pondok Pesantren Bali Bina Insani</p>
          </div>

          <div class="space-y-2 text-sm mb-4">
            <div class="flex justify-between">
              <span class="font-semibold text-gray-700">No. Transaksi:</span>
              <span class="font-mono" x-text="lastTransaksi[0]?.no_transaksi"></span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-gray-700">Tanggal:</span>
              <span x-text="formatDate(lastTransaksi[0]?.tanggal_bayar)"></span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-gray-700">Nama Siswa:</span>
              <span x-text="lastTransaksi[0]?.nama_siswa"></span>
            </div>
            <div class="flex justify-between">
              <span class="font-semibold text-gray-700">Kelas:</span>
              <span x-text="lastTransaksi[0]?.nama_kelas"></span>
            </div>
          </div>

          <table class="w-full text-sm my-4">
            <thead>
              <tr class="border-t border-b border-dashed">
                <th class="text-left py-2">Deskripsi Pembayaran</th>
                <th class="text-right py-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <template x-for="t in lastTransaksi" :key="t.id">
                <tr>
                  <td class="py-1" x-text="t.jenis_pembayaran_nama"></td>
                  <td class="text-right py-1">Rp <span x-text="formatRupiah(t.nominal_dibayar)"></span></td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-dashed font-bold">
                <td class="text-left py-2">TOTAL</td>
                <td class="text-right py-2 text-lg">
                  Rp <span x-text="formatRupiah(lastTransaksi.reduce((sum, t) => sum + t.nominal_dibayar, 0))"></span>
                </td>
              </tr>
            </tfoot>
          </table>

          <div class="text-center mt-4 pt-4 border-t border-dashed">
            <p class="font-bold text-green-600 text-lg">✅ LUNAS</p>
            <p class="text-xs text-gray-500 mt-2">Simpan bukti ini sebagai referensi.</p>
          </div>
        </div>

        <div class="flex justify-center gap-3">
          <button 
            @click="buktiModal = false" 
            class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            Tutup
          </button>
          <button 
            @click="exportBuktiPDF"
            class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
`;

// PART 2: JavaScript State & Functions (Add to Alpine component)

const PAYMENT_FUNCTIONS = {
  // Add to state variables
  state: {
    paymentModal: false,
    buktiModal: false,
    paymentLoading: false,
    selectedSiswaForPayment: null,
    tagihanList: [],
    selectedTagihan: [],
    cicilanAmounts: {},
    lastTransaksi: [],
  },

  // Main function: Select siswa untuk pembayaran
  selectSiswaForPayment: async function(siswa) {
    this.selectedSiswaForPayment = siswa;
    this.paymentModal = true;
    this.paymentLoading = true;
    this.tagihanList = [];
    this.selectedTagihan = [];
    this.cicilanAmounts = {};

    try {
      // Generate tagihan otomatis
      await this.generateTagihan(siswa);
    } catch (error) {
      this.showToast('Gagal memuat tagihan', 'error');
      console.error(error);
    } finally {
      this.paymentLoading = false;
    }
  },

  // Generate tagihan otomatis berdasarkan jenis pembayaran
  generateTagihan: async function(siswa) {
    const tagihan = [];
    const pembayaranBerlaku = this.pembayaranList.filter(p => 
      p.berlaku_untuk.includes(siswa.kelas_id)
    );

    // Load transaksi siswa
    const transaksi = await this.apiCall(`/api/transaksi?siswa_id=${siswa.id}`);

    const today = new Date();
    const siswaEntryDate = new Date(siswa.tanggal_masuk);

    for (const p of pembayaranBerlaku) {
      if (p.tipe_pembayaran === 'Berulang') {
        // SPP Berulang - generate dari tanggal masuk sampai sekarang
        let currentDate = new Date(siswaEntryDate.getFullYear(), siswaEntryDate.getMonth(), 1);
        
        while (currentDate <= today) {
          const monthName = currentDate.toLocaleString('id-ID', { month: 'long' });
          const year = currentDate.getFullYear();
          const billName = `${p.nama_pembayaran} ${monthName} ${year}`;

          // Check apakah sudah dibayar
          const sudahBayar = transaksi.some(t => 
            t.jenis_pembayaran_id === p.id && 
            t.jenis_pembayaran_nama === billName
          );

          if (!sudahBayar) {
            // Check beasiswa
            let potongan = 0;
            if (siswa.beasiswa_jenis && siswa.beasiswa_potongan) {
              const beasiswaPotongan = JSON.parse(siswa.beasiswa_potongan);
              if (beasiswaPotongan.includes(p.id)) {
                potongan = p.nominal; // Full scholarship for this payment
              }
            }

            tagihan.push({
              id: `${p.id}-${currentDate.getTime()}`,
              jenis_pembayaran_id: p.id,
              nama_pembayaran: billName,
              tipe: p.tipe_pembayaran,
              nominal_asli: p.nominal,
              potongan_beasiswa: potongan,
              nominal_bayar: p.nominal - potongan,
              sisa_tagihan: null
            });
          }

          currentDate.setMonth(currentDate.getMonth() + 1);
        }

      } else if (p.tipe_pembayaran === 'Sekali Bayar (Tunai)') {
        // Sekali Bayar Tunai - check sudah dibayar atau belum
        const sudahBayar = transaksi.some(t => t.jenis_pembayaran_id === p.id);

        if (!sudahBayar) {
          // Check beasiswa
          let potongan = 0;
          if (siswa.beasiswa_jenis && siswa.beasiswa_potongan) {
            const beasiswaPotongan = JSON.parse(siswa.beasiswa_potongan);
            if (beasiswaPotongan.includes(p.id)) {
              potongan = p.nominal;
            }
          }

          tagihan.push({
            id: p.id,
            jenis_pembayaran_id: p.id,
            nama_pembayaran: p.nama_pembayaran,
            tipe: p.tipe_pembayaran,
            nominal_asli: p.nominal,
            potongan_beasiswa: potongan,
            nominal_bayar: p.nominal - potongan,
            sisa_tagihan: null
          });
        }

      } else if (p.tipe_pembayaran === 'Sekali Bayar (Bisa Dicicil)') {
        // Sekali Bayar Cicilan - hitung sisa
        const totalTerbayar = transaksi
          .filter(t => t.jenis_pembayaran_id === p.id)
          .reduce((sum, t) => sum + t.nominal_dibayar, 0);

        const sisaTagihan = p.nominal - totalTerbayar;

        if (sisaTagihan > 0) {
          tagihan.push({
            id: p.id,
            jenis_pembayaran_id: p.id,
            nama_pembayaran: p.nama_pembayaran,
            tipe: p.tipe_pembayaran,
            nominal_asli: p.nominal,
            potongan_beasiswa: 0, // Beasiswa tidak berlaku untuk cicilan
            nominal_bayar: sisaTagihan,
            sisa_tagihan: sisaTagihan
          });
        }
      }
    }

    this.tagihanList = tagihan;
  },

  // Toggle tagihan selection
  toggleTagihanSelection: function(tagihan) {
    const index = this.selectedTagihan.findIndex(t => t.id === tagihan.id);
    if (index > -1) {
      this.selectedTagihan.splice(index, 1);
      delete this.cicilanAmounts[tagihan.id];
    } else {
      this.selectedTagihan.push(tagihan);
      // Set default cicilan amount
      if (tagihan.tipe === 'Sekali Bayar (Bisa Dicicil)') {
        this.cicilanAmounts[tagihan.id] = tagihan.nominal_bayar;
      }
    }
  },

  // Update cicilan amount
  updateCicilanAmount: function(tagihanId, value) {
    const tagihan = this.tagihanList.find(t => t.id === tagihanId);
    if (!tagihan) return;

    const amount = Math.max(1, Math.min(Number(value), tagihan.nominal_bayar));
    this.cicilanAmounts[tagihanId] = amount;
  },

  // Calculate total payment
  calculateTotalPayment: function() {
    return this.selectedTagihan.reduce((sum, t) => {
      if (t.tipe === 'Sekali Bayar (Bisa Dicicil)') {
        return sum + (this.cicilanAmounts[t.id] || 0);
      }
      return sum + t.nominal_bayar;
    }, 0);
  },

  // Process payment
  processPayment: async function() {
    if (this.selectedTagihan.length === 0) {
      this.showToast('Pilih minimal satu tagihan', 'error');
      return;
    }

    const totalPayment = this.calculateTotalPayment();
    if (totalPayment === 0) {
      this.showToast('Total pembayaran tidak boleh 0', 'error');
      return;
    }

    this.paymentLoading = true;

    try {
      const transaksiList = this.selectedTagihan.map(t => {
        const nominalDibayar = t.tipe === 'Sekali Bayar (Bisa Dicicil)'
          ? (this.cicilanAmounts[t.id] || t.nominal_bayar)
          : t.nominal_bayar;

        return {
          siswa_id: this.selectedSiswaForPayment.id,
          nama_siswa: this.selectedSiswaForPayment.nama_siswa,
          kelas_id: this.selectedSiswaForPayment.kelas_id,
          nama_kelas: this.getKelasName(this.selectedSiswaForPayment.kelas_id),
          jenjang: this.selectedSiswaForPayment.jenjang,
          jenis_pembayaran_id: t.jenis_pembayaran_id,
          jenis_pembayaran_nama: t.nama_pembayaran,
          nominal_asli: t.nominal_asli,
          potongan_beasiswa: t.potongan_beasiswa,
          nominal_dibayar: nominalDibayar,
          tanggal_bayar: new Date().toISOString()
        };
      });

      const result = await this.apiCall('/api/transaksi', 'POST', {
        transaksi_list: transaksiList
      });

      // Load transaksi yang baru dibuat untuk bukti
      const newTransaksiIds = result.ids;
      this.lastTransaksi = [];
      
      for (const id of newTransaksiIds) {
        const t = await this.apiCall(`/api/transaksi/${id}`);
        this.lastTransaksi.push(t);
      }

      this.showToast(`✅ Berhasil memproses ${transaksiList.length} pembayaran!`, 'success');
      
      // Close payment modal, open bukti modal
      this.paymentModal = false;
      this.buktiModal = true;

      // Reload dashboard data
      this.loadDashboardData();

    } catch (error) {
      this.showToast('Gagal memproses pembayaran', 'error');
      console.error(error);
    } finally {
      this.paymentLoading = false;
    }
  },

  // Export bukti PDF
  exportBuktiPDF: function() {
    if (!window.jspdf || this.lastTransaksi.length === 0) {
      this.showToast('Tidak dapat generate PDF', 'error');
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const t = this.lastTransaksi[0];

      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BUKTI PEMBAYARAN', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Pondok Pesantren Bali Bina Insani', doc.internal.pageSize.getWidth() / 2, 26, { align: 'center' });
      
      doc.line(15, 28, 195, 28);

      // Info
      doc.autoTable({
        startY: 35,
        body: [
          ['No. Transaksi', ':', t.no_transaksi],
          ['Tanggal', ':', this.formatDate(t.tanggal_bayar)],
          ['Nama Siswa', ':', t.nama_siswa],
          ['Kelas', ':', t.nama_kelas],
          ['Petugas', ':', t.dibuat_oleh],
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: { 
          0: { fontStyle: 'bold', cellWidth: 40 }, 
          1: { cellWidth: 5 } 
        },
      });

      // Detail Pembayaran
      const tableData = this.lastTransaksi.map(item => [
        item.jenis_pembayaran_nama,
        `Rp ${this.formatRupiah(item.nominal_dibayar)}`
      ]);

      const totalBayar = this.lastTransaksi.reduce((sum, item) => sum + item.nominal_dibayar, 0);

      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 10,
        head: [['Deskripsi Pembayaran', 'Nominal']],
        body: tableData,
        foot: [['TOTAL', `Rp ${this.formatRupiah(totalBayar)}`]],
        theme: 'grid',
        headStyles: { 
          fillColor: [22, 160, 133], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold' 
        },
        footStyles: { 
          fontStyle: 'bold', 
          fontSize: 12,
          fillColor: [240, 240, 240]
        },
      });

      // Footer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Status: LUNAS ✓', 15, doc.autoTable.previous.finalY + 15);
      doc.setFont('helvetica', 'normal');
      doc.text('Terima kasih atas pembayarannya.', 15, doc.autoTable.previous.finalY + 25);

      // Save
      doc.save(`bukti_pembayaran_${t.nama_siswa}_${t.no_transaksi}.pdf`);
      this.showToast('✅ PDF berhasil di-download!', 'success');

    } catch (error) {
      this.showToast('Gagal generate PDF', 'error');
      console.error(error);
    }
  }
};
