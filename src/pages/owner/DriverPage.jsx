import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit, Trash2, UserCheck } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../context/ToastContext';

export function DriverPage() {
  const { t } = useTranslation();
  const { toast, confirm } = useToast();

  const { data: driverList, addItem: addDriver, updateItem: updateDriver, deleteItem: deleteDriver, isLoading } = useStore('driver');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    noHp: '',
    tarif: '',
    status: 'Tersedia',
    catatan: ''
  });

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      nama: '',
      noHp: '',
      tarif: '',
      status: 'Tersedia',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDriver(d);
    setFormData({ ...d });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const driver = driverList.find((d) => d.id === id);
    const ok = await confirm({
      title: 'Hapus Data Driver?',
      message: `Driver ${driver?.nama || ''} (${driver?.noHp || ''}) akan dihapus dari daftar pengemudi.`,
      confirmText: 'Ya, Hapus Driver',
      variant: 'danger'
    });
    if (ok) {
      try {
        await deleteDriver(id);
        toast.success('Driver Dihapus', `Data driver ${driver?.nama || ''} berhasil dihapus.`);
      } catch (err) {
        console.error('Delete Driver Error:', err);
        toast.error('Gagal Menghapus', 'Terjadi kesalahan saat menghapus data driver dari database.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      tarif: Number(formData.tarif) || 0
    };

    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, { ...payload, id: editingDriver.id });
        toast.success('Driver Diperbarui', `Informasi driver ${formData.nama} berhasil diperbarui.`);
      } else {
        const newDriver = {
          ...payload,
          id: `DRV-${String(Date.now()).slice(-4)}`
        };
        await addDriver(newDriver);
        toast.success('Driver Ditambahkan', `Driver ${newDriver.nama} siap bertugas.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Submit Driver Error:', err);
      toast.error('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data driver ke database.');
    }
  };



  const columns = [
    {
      header: 'Nama Driver',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-avatar">
            <UserCheck size={16} />
          </div>
          <div>
            <div className="font-medium">{row.nama}</div>
            <div className="subtext">{row.noHp}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Tarif Per Hari',
      cell: (row) => `Rp ${Number(row.tarif).toLocaleString('id-ID')}`
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
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
          <button className="btn-icon" onClick={() => handleOpenEdit(row)}>
            <Edit size={16} />
          </button>
          <button className="btn-icon text-danger" onClick={() => handleDelete(row.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="driver-page">
      <PageHeader
        title={t('nav.driver')}
        description="Kelola pengemudi rental dan tarif per hari."
        action={
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            Tambah Driver
          </button>
        }
      />

      <Table
        columns={columns}
        data={driverList}
        searchKey="nama"
        searchPlaceholder="Cari nama driver..."
        pageSize={5}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? 'Edit Driver' : 'Tambah Driver Baru'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Simpan Data
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="driver-form">
          <div className="form-group">
            <label className="form-label">Nama Driver</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Nomor HP</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.noHp}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tarif Harian (Rp)</label>
              <input
                type="number"
                className="form-input"
                required
                placeholder="Contoh: 150000"
                value={formData.tarif}
                onChange={(e) => setFormData({ ...formData, tarif: e.target.value })}
              />
            </div>

          </div>

          <div className="form-group">
            <label className="form-label">Status Driver</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Tersedia">Tersedia</option>
              <option value="Disewa">Disewa</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Driver</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
