import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Eye, Edit, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../../hooks/useTenantStore';
import { useToast } from '../../context/ToastContext';

export function CustomerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast, confirm } = useToast();

  const { data: customerList, addItem: addCustomer, updateItem: updateCustomer, deleteItem: deleteCustomer, isLoading } = useTenantStore('customer');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    noHp: '',
    alamat: '',
    noKtp: '',
    noSim: '',
    fotoKtp: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    fotoSim: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    catatan: ''
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      nama: '',
      noHp: '',
      alamat: '',
      noKtp: '',
      noSim: '',
      fotoKtp: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
      fotoSim: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setFormData({ ...c });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const cust = customerList.find((c) => c.id === id);
    const ok = await confirm({
      title: 'Hapus Data Pelanggan?',
      message: `Profil pelanggan ${cust?.nama || ''} (${cust?.noHp || ''}) akan dihapus.`,
      confirmText: 'Ya, Hapus Pelanggan',
      variant: 'danger'
    });
    if (ok) {
      await deleteCustomer(id);
      toast.success('Pelanggan Dihapus', `Data pelanggan ${cust?.nama || ''} berhasil dihapus.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, { ...formData, id: editingCustomer.id });
      toast.success('Customer Diperbarui', `Data ${formData.nama} berhasil diperbarui.`);
    } else {
      const newCust = {
        ...formData,
        id: `CUST-${String(Date.now()).slice(-4)}`,
        totalBooking: 0
      };
      await addCustomer(newCust);
      toast.success('Customer Ditambahkan', `Pelanggan ${newCust.nama} berhasil didaftarkan.`);
    }
    setIsModalOpen(false);
  };


  const columns = [
    {
      header: 'Nama Pelanggan',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-avatar">
            <User size={16} />
          </div>
          <div>
            <div className="font-medium">{row.nama}</div>
            <div className="subtext">{row.noHp}</div>
          </div>
        </div>
      )
    },
    {
      header: 'No KTP & SIM',
      cell: (row) => (
        <div>
          <div>KTP: {row.noKtp}</div>
          <div className="subtext">SIM: {row.noSim}</div>
        </div>
      )
    },
    {
      header: 'Alamat',
      accessorKey: 'alamat'
    },
    {
      header: 'Total Booking',
      cell: (row) => (
        <span className="id-tag">{row.totalBooking || 0} Kali</span>
      )
    },
    {
      header: 'Aksi',
      cell: (row) => (
        <div className="table-actions">
          <button
            className="btn-icon"
            title="Detail"
            onClick={() => navigate(`/customer/${row.id}`)}
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
    <div className="customer-page">
      <PageHeader
        title={t('nav.customer')}
        description="Kelola basis data penyewa beserta dokumen identitas (KTP & SIM)."
        action={
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            Tambah Customer
          </button>
        }
      />

      <Table
        columns={columns}
        data={customerList}
        searchKey="nama"
        searchPlaceholder="Cari nama atau nomor HP customer..."
        pageSize={5}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Data Customer' : 'Tambah Customer Baru'}
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
        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-group">
            <label className="form-label">Nama Lengkap</label>
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
              <label className="form-label">Nomor HP / WhatsApp</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.noHp}
                onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nomor KTP</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.noKtp}
                onChange={(e) => setFormData({ ...formData, noKtp: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nomor SIM A</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.noSim}
              onChange={(e) => setFormData({ ...formData, noSim: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Lengkap</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Pelanggan</label>
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
