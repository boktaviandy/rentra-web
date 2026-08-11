import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useTenantStore } from '../../hooks/useTenantStore';
import { useToast } from '../../context/ToastContext';


export function PemasukanPage() {
  const { t } = useTranslation();
  const { toast, confirm } = useToast();

  const { data: pemasukanList, addItem: addPemasukan, deleteItem: deletePemasukan, setData: setPemasukanList, isLoading } = useTenantStore('pemasukan');
  const { data: bookingData } = useTenantStore('booking');
  const { data: driverData } = useTenantStore('driver');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-sinkronisasi sewa mobil ke daftar pemasukan (hanya biaya sewa unit mobil)
  React.useEffect(() => {
    if (!bookingData || bookingData.length === 0) return;

    let hasNew = false;
    const currentList = [...pemasukanList];

    bookingData.forEach((b) => {
      const totalBayar = b.status === 'Selesai'
        ? Number(b.harga || b.totalHarga || 0)
        : Number(b.deposit || 0);

      if (totalBayar > 0) {
        const start = new Date(b.tglMulai || new Date());
        const end = new Date(b.tglSelesai || new Date());
        const diff = Math.max(0, end - start);
        const durasiHari = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

        const driverObj = (driverData || []).find((d) => d.id === b.driverId);
        const hasDriver = Boolean(b.driverId && driverObj && !b.driverNama?.includes('Tanpa Driver'));
        const tarifDriver = hasDriver ? Number(driverObj.tarif || 0) : 0;
        const totalBiayaDriver = hasDriver ? tarifDriver * durasiHari : 0;

        const nominalMobil = hasDriver ? Math.max(0, totalBayar - totalBiayaDriver) : totalBayar;

        if (nominalMobil > 0) {
          const existingIndex = currentList.findIndex((p) => p.bookingId === b.id);
          const labelSewa = `Sewa Unit ${b.mobilNama || 'Mobil'} (${b.customerNama || 'Customer'}) - ${b.status === 'Selesai' ? 'Pelunasan Unit Mobil' : 'DP Sewa'}`;

          if (existingIndex < 0) {
            currentList.unshift({
              id: `INC-BK-${String(b.id).replace(/[^a-zA-Z0-9]/g, '')}`,
              tanggal: b.tglMulai || new Date().toISOString().slice(0, 10),
              kategori: 'Sewa Mobil',
              bookingId: b.id,
              nominal: nominalMobil,
              catatan: labelSewa,
              bukti: ''
            });
            hasNew = true;
          } else if (currentList[existingIndex].nominal !== nominalMobil) {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              nominal: nominalMobil,
              catatan: labelSewa
            };
            hasNew = true;
          }
        }
      }
    });

    if (hasNew) {
      setPemasukanList(currentList);
    }
  }, [bookingData, driverData]);


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
      await deletePemasukan(id);
      toast.success('Pemasukan Dihapus', 'Data transaksi berhasil dihapus.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newInc = {
      ...formData,
      id: `INC-${String(Date.now()).slice(-4)}`,
      nominal: Number(formData.nominal) || 0
    };
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
            <button className="btn btn-primary" onClick={handleSubmit}>
              Simpan Transaksi
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
                {bookingData.map((b) => (
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

