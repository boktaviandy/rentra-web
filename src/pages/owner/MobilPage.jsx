import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { PhotoPicker } from '../../components/ui/PhotoPicker';
import { Plus, Eye, Edit, Trash2, Car, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../context/ToastContext';
import './MobilPage.css';


export function MobilPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: mobilList, addItem: addMobil, updateItem: updateMobil, deleteItem: deleteMobil } = useStore('mobil');
  const { data: bookingList } = useStore('booking');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMobil, setEditingMobil] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Status mobil dihitung secara dinamis dari transaksi sewa/booking aktif
  const displayMobilList = mobilList.map((m) => {
    if (m.status === 'Servis' || m.status === 'Nonaktif') {
      return m;
    }
    const activeBooking = (bookingList || []).find(
      (b) => b.mobilId === m.id && (b.status === 'Berjalan' || b.status === 'Booking')
    );
    if (activeBooking) {
      return {
        ...m,
        status: 'Disewa',
        activePenyewa: activeBooking.customerNama,
        activeSelesai: activeBooking.tglSelesai
      };
    }
    return {
      ...m,
      status: 'Tersedia'
    };
  });


  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    merk: '',
    plat: '',
    tahun: new Date().getFullYear(),
    hargaHarian: '',
    hargaMingguan: '',
    hargaBulanan: '',
    status: 'Tersedia',
    foto: '',     // base64 from library
    fotoId: '',   // library foto ID reference
    catatan: ''
  });

  const handleOpenAdd = () => {
    setEditingMobil(null);
    setFormData({
      nama: '',
      merk: '',
      plat: '',
      tahun: new Date().getFullYear(),
      hargaHarian: '',
      hargaMingguan: '',
      hargaBulanan: '',
      status: 'Tersedia',
      foto: '',
      fotoId: '',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const { toast, confirm } = useToast();

  const handleOpenEdit = (mobil) => {
    setEditingMobil(mobil);
    setFormData({ ...mobil });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const mobil = mobilList.find((m) => m.id === id);
    const ok = await confirm({
      title: 'Hapus Unit Mobil?',
      message: `Unit ${mobil?.nama || 'ini'} (${mobil?.plat || ''}) akan dihapus dari armada.`,
      confirmText: 'Ya, Hapus Mobil',
      variant: 'danger'
    });
    if (ok) {
      try {
        await deleteMobil(id);
        toast.success('Mobil Dihapus', `Data mobil ${mobil?.nama || ''} berhasil dihapus.`);
      } catch (err) {
        console.error('Delete Mobil Error:', err);
        toast.error('Gagal Menghapus', 'Terjadi kesalahan saat menghapus data mobil dari database.');
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const payload = {
      ...formData,
      tahun: Number(formData.tahun) || new Date().getFullYear(),
      hargaHarian: formData.hargaHarian === '' ? 0 : Number(formData.hargaHarian),
      hargaMingguan: formData.hargaMingguan === '' ? 0 : Number(formData.hargaMingguan),
      hargaBulanan: formData.hargaBulanan === '' ? 0 : Number(formData.hargaBulanan),
    };

    try {
      if (editingMobil) {
        await updateMobil(editingMobil.id, { ...payload, id: editingMobil.id });
        toast.success('Data Diperbarui', `Informasi ${formData.nama} berhasil diperbarui.`);
      } else {
        const newMobil = {
          ...payload,
          id: `MOB-${String(Date.now()).slice(-4)}`,
          totalHariDisewa: 0,
          totalPendapatan: 0
        };
        await addMobil(newMobil);
        toast.success('Mobil Ditambahkan', `Unit ${newMobil.nama} (${newMobil.plat}) berhasil masuk ke garasi.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Submit Mobil Error:', err);
      toast.error('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data mobil ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const filterOptions = [
    { label: 'Tersedia', value: 'Tersedia' },
    { label: 'Disewa', value: 'Disewa' },
    { label: 'Servis', value: 'Servis' },
    { label: 'Nonaktif', value: 'Nonaktif' },
  ];

  const columns = [
    {
      header: 'Mobil',
      cell: (row) => (
        <div className="mobil-info-cell">
          {row.foto ? (
            <img
              src={row.foto}
              alt={row.nama}
              className="mobil-thumb"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div className={`mobil-thumb-placeholder ${row.foto ? 'hidden' : ''}`}>
            <Car size={18} />
          </div>
          <div>
            <div className="mobil-title">{row.nama}</div>
            <div className="mobil-sub">{row.merk} • {row.tahun}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Plat Nomor',
      accessorKey: 'plat',
      cell: (row) => <span className="plat-badge">{row.plat}</span>
    },
    {
      header: 'Harga Harian',
      cell: (row) => `Rp ${Number(row.hargaHarian || row.hargaSewa || 0).toLocaleString('id-ID')}`
    },
    {
      header: 'Status',
      cell: (row) => (
        <div>
          <Badge variant={getStatusBadgeVariant(row.status)}>
            {row.status}
          </Badge>
          {row.status === 'Disewa' && row.activePenyewa && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
              👤 {row.activePenyewa}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Aksi',
      cell: (row) => (
        <div className="table-actions">
          <button
            className="btn-icon"
            title="Detail"
            onClick={() => navigate(`/mobil/${row.id}`)}
          >
            <Eye size={16} />
          </button>
          <button
            className="btn-icon"
            title="Edit"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit size={16} />
          </button>
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
    <div className="mobil-page">
      <PageHeader
        title={t('nav.mobil')}
        description="Kelola armada kendaraan rental Anda secara lengkap."
        action={
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            Tambah Mobil
          </button>
        }
      />

      <Table
        columns={columns}
        data={displayMobilList}
        searchKey="nama"
        searchPlaceholder="Cari nama atau merk mobil..."
        filterOptions={filterOptions}
        filterKey="status"
        pageSize={5}
      />


      {/* Modal Form Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMobil ? 'Edit Data Mobil' : 'Tambah Mobil Baru'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="mobil-form">
          <div className="form-group">
            <label className="form-label">Nama Mobil</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Toyota Avanza Veloz"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Merk</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.merk}
                onChange={(e) => setFormData({ ...formData, merk: e.target.value })}
                placeholder="Contoh: Toyota"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Plat Nomor</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.plat}
                onChange={(e) => setFormData({ ...formData, plat: e.target.value })}
                placeholder="Contoh: B 1234 RNT"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Tahun</label>
              <input
                type="number"
                className="form-input"
                required
                value={formData.tahun}
                onChange={(e) => setFormData({ ...formData, tahun: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Tersedia">Tersedia</option>
                <option value="Disewa">Disewa</option>
                <option value="Servis">Servis</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Harga Harian (Rp) <span className="text-danger">*</span></label>
              <input
                type="number"
                className="form-input"
                required
                placeholder="Contoh: 350000"
                value={formData.hargaHarian}
                onChange={(e) => setFormData({ ...formData, hargaHarian: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Harga Mingguan (Rp)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Opsional"
                value={formData.hargaMingguan}
                onChange={(e) => setFormData({ ...formData, hargaMingguan: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Harga Bulanan (Rp)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Opsional"
                value={formData.hargaBulanan}
                onChange={(e) => setFormData({ ...formData, hargaBulanan: e.target.value })}
              />
            </div>
          </div>


          {/* Foto Mobil — Photo Picker */}
          <div className="form-group">
            <label className="form-label">Foto Mobil</label>

            {formData.foto ? (
              <div className="mobil-foto-preview">
                <img src={formData.foto} alt="Preview" className="mobil-foto-preview-img" />
                <div className="mobil-foto-preview-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsPickerOpen(true)}
                  >
                    <ImageIcon size={14} /> Ganti Foto
                  </button>
                  <button
                    type="button"
                    className="btn-icon text-danger"
                    title="Hapus foto"
                    onClick={() => setFormData({ ...formData, foto: '', fotoId: '' })}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="mobil-foto-picker-btn"
                onClick={() => setIsPickerOpen(true)}
              >
                <Car size={24} className="mobil-foto-picker-icon" />
                <span className="mobil-foto-picker-label">Pilih Foto dari Library</span>
                <span className="mobil-foto-picker-hint">
                  {formData.nama
                    ? `Foto akan difilter berdasarkan: "${formData.nama}"`
                    : 'Isi nama mobil terlebih dahulu untuk saran foto otomatis'}
                </span>
              </button>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Catatan / Spesifikasi</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Catatan kondisi mobil, fitur pendukung, dll."
            />
          </div>
        </form>
      </Modal>

      {/* Photo Picker Modal */}
      <PhotoPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        carName={formData.nama}
        currentFoto={formData.foto}
        onSelect={(base64, fotoId) => {
          setFormData({ ...formData, foto: base64 || '', fotoId: fotoId || '' });
        }}
      />
    </div>
  );
}
