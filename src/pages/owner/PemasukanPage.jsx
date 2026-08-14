import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../context/ToastContext';


export function PemasukanPage() {
  const { t } = useTranslation();
  const { toast, confirm } = useToast();

  const { data: pemasukanList, addItem: addPemasukan, deleteItem: deletePemasukan, isLoading } = useStore('pemasukan');
  const { data: bookingData } = useStore('booking');
  const [isModalOpen, setIsModalOpen] = useState(false);


  const [formData, setFormData] = useState(() => ({
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: '',
    kategori: 'Denda',
    bookingId: '',
    catatan: ''
  }));

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Hapus Catatan Pemasukan?',
      message: 'Data pencatatan pemasukan ini akan dihapus dari laporan keuangan.',
      confirmText: 'Ya, Hapus',
      variant: 'danger'
    });
    if (ok) {
      try {
        await deletePemasukan(id);
        toast.success('Pemasukan Dihapus', 'Data transaksi berhasil dihapus.');
      } catch (err) {
        console.error('Delete Pemasukan Error:', err);
        toast.error('Gagal Menghapus', 'Terjadi kesalahan saat menghapus transaksi pemasukan.');
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const newInc = {
      ...formData,
      id: `INC-${String(Date.now()).slice(-4)}`,
      nominal: Number(formData.nominal) || 0,
      bookingId: (formData.bookingId && String(formData.bookingId).trim() !== '' && formData.bookingId !== 'Tidak ada' && formData.bookingId !== 'Tanpa Booking') ? String(formData.bookingId) : null
    };

    console.log('[PEMASUKAN] RAW FORM:', formData);
    console.log('[PEMASUKAN] SANITIZED PAYLOAD:', newInc);

    try {
      await addPemasukan(newInc);
      toast.success('Pemasukan Dicatat', `Pemasukan Rp ${Number(newInc.nominal).toLocaleString('id-ID')} (${newInc.kategori}) berhasil disimpan.`);
      setIsModalOpen(false);
      setFormData({
        tanggal: new Date().toISOString().slice(0, 10),
        nominal: '',
        kategori: 'Denda',
        bookingId: '',
        catatan: ''
      });
    } catch (err) {
      console.error('[PEMASUKAN] Supabase INSERT ERROR:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      });
      toast.error('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan transaksi pemasukan ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPemasukan = pemasukanList.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);

  const columns = [
    {
      header: 'Tanggal',
      accessorKey: 'tanggal'
    },
    {
      header: 'Kategori',
      cell: (row) => <span className="id-tag">{row.kategori}</span>
    },
    {
      header: 'Booking ID',
      cell: (row) => row.bookingId || '-'
    },
    {
      header: 'Nominal',
      cell: (row) => (
        <span className="font-medium text-success">
          +Rp {Number(row.nominal || 0).toLocaleString('id-ID')}
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
    <div className="pemasukan-page">
      <PageHeader
        title={t('nav.pemasukan')}
        description={`Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}`}
        action={
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Catat Pemasukan
          </button>
        }
      />

      <Table
        columns={columns}
        data={pemasukanList}
        searchKey="kategori"
        searchPlaceholder="Cari kategori atau catatan..."
        pageSize={5}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Pemasukan Lainnya"
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
        <form onSubmit={handleSubmit} className="pemasukan-form">
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
              <label className="form-label">Kategori Pemasukan</label>
              <select
                className="form-select"
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              >
                <option value="Denda">Denda / Keterlambatan</option>
                <option value="Overtime">Overtime / Kelebihan Jam</option>
                <option value="Kebersihan / Kerusakan">Biaya Kebersihan / Kerusakan</option>
                <option value="Lainnya">Pemasukan Lainnya</option>
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
                placeholder="Contoh: 500000"
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Booking Terkait (Opsional)</label>
              <select
                className="form-select"
                value={formData.bookingId}
                onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
              >
                <option value="">Tidak ada</option>
                {(bookingData || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} - {b.customerNama}
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
              placeholder="Keterangan transaksi pemasukan..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

