import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, TrendingDown, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../context/ToastContext';

export function PengeluaranPage() {
  const { t } = useTranslation();
  const { toast, confirm } = useToast();

  const { data: pengeluaranList, addItem: addPengeluaran, deleteItem: deletePengeluaran, setData: setPengeluaranList, isLoading } = useStore('pengeluaran');
  const { data: mobilData } = useStore('mobil');
  const { data: bookingData } = useStore('booking');
  const { data: driverData } = useStore('driver');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-sinkronisasi honor driver dari booking yang berstatus Selesai
  React.useEffect(() => {
    if (!bookingData || bookingData.length === 0) return;

    let hasNew = false;
    const currentList = [...pengeluaranList];

    bookingData.forEach((b) => {
      if (b.status === 'Selesai' && b.driverId && !b.driverNama?.includes('Tanpa Driver')) {
        const start = new Date(b.tglMulai || new Date());
        const end = new Date(b.tglSelesai || new Date());
        const diff = Math.max(0, end - start);
        const durasiHari = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

        const driverObj = (driverData || []).find((d) => d.id === b.driverId);
        const tarifDriver = driverObj ? Number(driverObj.tarif || 0) : 0;
        const totalHonorDriver = tarifDriver * durasiHari;

        if (totalHonorDriver > 0) {
          const existingIndex = currentList.findIndex(
            (p) => p.bookingId === b.id && p.kategori === 'Gaji Driver'
          );
          const labelDriver = `Honor Driver: ${b.driverNama} (${durasiHari} Hari) untuk sewa #${b.id} - ${b.customerNama}`;

          if (existingIndex < 0) {
            currentList.unshift({
              id: `EXP-DRV-${String(b.id).replace(/[^a-zA-Z0-9]/g, '')}`,
              tanggal: b.tglSelesai || new Date().toISOString().slice(0, 10),
              kategori: 'Gaji Driver',
              mobilId: b.mobilId || '',
              mobilNama: b.mobilNama || 'Mobil',
              bookingId: b.id,
              nominal: totalHonorDriver,
              catatan: labelDriver,
              bukti: ''
            });
            hasNew = true;
          } else if (currentList[existingIndex].nominal !== totalHonorDriver) {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              nominal: totalHonorDriver,
              catatan: labelDriver
            };
            hasNew = true;
          }
        }
      }
    });

    if (hasNew) {
      setPengeluaranList(currentList);
    }
  }, [bookingData, driverData]);

  const [formData, setFormData] = useState(() => ({
    tanggal: new Date().toISOString().slice(0, 10),
    mobilId: mobilData[0]?.id || '',
    nominal: '',
    kategori: 'BBM',
    catatan: ''
  }));


  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Hapus Catatan Pengeluaran?',
      message: 'Data pencatatan biaya pengeluaran ini akan dihapus dari sistem.',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    });
    if (ok) {
      await deletePengeluaran(id);
      toast.success('Pengeluaran Dihapus', 'Data pengeluaran berhasil dihapus.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mobilObj = mobilData.find((m) => m.id === formData.mobilId);
    const newExp = {
      ...formData,
      id: `EXP-${String(Date.now()).slice(-4)}`,
      mobilNama: mobilObj ? mobilObj.nama : 'Umum / Operasional',
      nominal: Number(formData.nominal) || 0
    };
    await addPengeluaran(newExp);
    toast.success('Pengeluaran Dicatat', `Biaya Rp ${Number(newExp.nominal).toLocaleString('id-ID')} (${newExp.kategori}) berhasil disimpan.`);
    setIsModalOpen(false);
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      mobilId: mobilData[0]?.id || '',
      nominal: '',
      kategori: 'BBM',
      catatan: ''
    });
  };

  const totalPengeluaran = pengeluaranList.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  const columns = [
    {
      header: 'Tanggal',
      accessorKey: 'tanggal'
    },
    {
      header: 'Kategori',
      cell: (row) => <span className="badge badge-danger">{row.kategori}</span>
    },
    {
      header: 'Mobil Terkait',
      cell: (row) => row.mobilNama || 'Umum / Operasional'
    },
    {
      header: 'Nominal',
      cell: (row) => (
        <span className="font-medium text-danger">
          -Rp {Number(row.nominal || 0).toLocaleString('id-ID')}
        </span>
      )
    },
    {
      header: 'Catatan',
      accessorKey: 'catatan'
    },
    {
      header: 'Aksi',
      cell: (row) => (
        <div className="table-actions">
          <button
            className="btn-icon text-danger"
            title="Hapus"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="pengeluaran-page">
      <PageHeader
        title={t('nav.pengeluaran')}
        description={`Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}`}
        action={
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Catat Pengeluaran
          </button>
        }
      />

      <Table
        columns={columns}
        data={pengeluaranList}
        searchKey="kategori"
        searchPlaceholder="Cari kategori pengeluaran..."
        pageSize={5}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Pengeluaran Operasional"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Simpan Transaksi
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="pengeluaran-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kategori Pengeluaran</label>
              <select
                className="form-select"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              >
                <option value="Servis">Servis</option>
                <option value="Ganti Oli">Ganti Oli</option>
                <option value="BBM">BBM</option>
                <option value="Pajak">Pajak</option>
                <option value="Asuransi">Asuransi</option>
                <option value="Operasional">Operasional</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Nominal (Rp) <span className="text-danger">*</span></label>
              <input
                type="number"
                className="form-input"
                required
                placeholder="Contoh: 350000"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              />
            </div>


            <div className="form-group">
              <label className="form-label">Mobil Terkait (Opsional)</label>
              <select
                className="form-select"
                value={formData.mobilId}
                onChange={(e) => setFormData({ ...formData, mobilId: e.target.value })}
              >
                <option value="">Operasional Umum (Non-mobil)</option>
                {mobilData.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.plat})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Keterangan pengeluaran..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
