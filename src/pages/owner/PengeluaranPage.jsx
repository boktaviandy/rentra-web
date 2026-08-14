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

  const { data: pengeluaranList, addItem: addPengeluaran, deleteItem: deletePengeluaran, isLoading } = useStore('pengeluaran');
  const { data: mobilData } = useStore('mobil');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      try {
        await deletePengeluaran(id);
        toast.success('Pengeluaran Dihapus', 'Data pengeluaran berhasil dihapus.');
      } catch (err) {
        console.error('Delete Pengeluaran Error:', err);
        toast.error('Gagal Menghapus', 'Terjadi kesalahan saat menghapus transaksi pengeluaran.');
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const mobilObj = mobilData.find((m) => m.id === formData.mobilId);
    const cleanMobilId = (formData.mobilId && formData.mobilId !== '' && formData.mobilId !== 'Umum / Operasional' && formData.mobilId !== 'Tidak ada') ? formData.mobilId : null;
    const newExp = {
      ...formData,
      id: `EXP-${String(Date.now()).slice(-4)}`,
      mobilId: cleanMobilId,
      mobilNama: mobilObj ? mobilObj.nama : 'Umum / Operasional',
      nominal: Number(formData.nominal) || 0
    };

    try {
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
    } catch (err) {
      console.error('Submit Pengeluaran Error:', err);
      toast.error('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan transaksi pengeluaran ke database.');
    } finally {
      setIsSubmitting(false);
    }
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
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
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
                {(mobilData || []).map((m) => (
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
