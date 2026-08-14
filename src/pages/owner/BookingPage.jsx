import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Eye, Receipt, Trash2, Edit, CheckCircle2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../context/ToastContext';
import './BookingPage.css';

export function BookingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast, confirm } = useToast();

  const { data: bookingList, setData: setBookingList, isLoading } = useStore('booking');
  const { data: mobilData, setData: setMobilData } = useStore('mobil');
  const { data: customerData } = useStore('customer');
  const { data: driverData } = useStore('driver');
  const { data: pemasukanList, setData: setPemasukanList } = useStore('pemasukan');
  const { data: pengeluaranList, setData: setPengeluaranList } = useStore('pengeluaran');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // Hanya tampilkan mobil yang statusnya 'Tersedia' (tidak sedang disewa oleh booking aktif lain)
  const availableMobilList = mobilData.filter((m) => {
    if (m.status === 'Servis' || m.status === 'Nonaktif') return false;
    const isBooked = (bookingList || []).some(
      (b) => b.mobilId === m.id &&
             b.id !== editingBooking?.id &&
             (b.status === 'Berjalan' || b.status === 'Booking')
    );
    return !isBooked;
  });

  // Helper untuk mencatat/memperbarui keuangan otomatis dari booking:
  // - Biaya Sewa Mobil -> Masuk ke PEMASUKAN
  // - Honor / Biaya Driver -> Masuk ke PENGELUARAN (saat booking Selesai)
  const syncBookingFinances = (bookingObj, isDelete = false) => {
    if (isDelete) {
      setPemasukanList(pemasukanList.filter((p) => p.bookingId !== bookingObj.id));
      setPengeluaranList(pengeluaranList.filter((p) => p.bookingId !== bookingObj.id));
      return;
    }

    const totalBayar = bookingObj.status === 'Selesai'
      ? Number(bookingObj.harga || bookingObj.totalHarga || 0)
      : Number(bookingObj.deposit || 0);

    if (totalBayar <= 0) {
      setPemasukanList(pemasukanList.filter((p) => p.bookingId !== bookingObj.id));
      setPengeluaranList(pengeluaranList.filter((p) => p.bookingId !== bookingObj.id));
      return;
    }

    // Hitung durasi sewa hari
    const start = new Date(bookingObj.tglMulai || new Date());
    const end = new Date(bookingObj.tglSelesai || new Date());
    const diff = Math.max(0, end - start);
    const durasiHari = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

    // Cek jasa driver
    const driverObj = driverData.find((d) => d.id === bookingObj.driverId);
    const hasDriver = Boolean(bookingObj.driverId && driverObj && !bookingObj.driverNama?.includes('Tanpa Driver'));
    const tarifDriverHarian = hasDriver ? Number(driverObj.tarif || 0) : 0;
    const totalBiayaDriver = hasDriver ? tarifDriverHarian * durasiHari : 0;

    // Nominal Pemasukan HANYA BIAYA SEWA MOBIL
    const nominalPemasukanMobil = hasDriver
      ? Math.max(0, totalBayar - totalBiayaDriver)
      : totalBayar;

    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. SINKRONISASI KE PEMASUKAN (Hanya Biaya Sewa Unit Mobil)
    const existingIncIndex = pemasukanList.findIndex((p) => p.bookingId === bookingObj.id);
    const labelSewa = `Sewa Unit ${bookingObj.mobilNama || 'Mobil'} (${bookingObj.customerNama || 'Customer'}) - ${bookingObj.status === 'Selesai' ? 'Pelunasan Sewa Mobil' : 'DP Sewa Mobil'}`;

    if (existingIncIndex >= 0) {
      const updatedInc = [...pemasukanList];
      updatedInc[existingIncIndex] = {
        ...updatedInc[existingIncIndex],
        nominal: nominalPemasukanMobil,
        catatan: labelSewa,
        tanggal: bookingObj.tglMulai || todayStr
      };
      setPemasukanList(updatedInc);
    } else if (nominalPemasukanMobil > 0) {
      const newInc = {
        id: `INC-BK-${String(Date.now()).slice(-4)}`,
        tanggal: bookingObj.tglMulai || todayStr,
        kategori: 'Sewa Mobil',
        bookingId: bookingObj.id,
        nominal: nominalPemasukanMobil,
        catatan: labelSewa,
        bukti: ''
      };
      setPemasukanList([newInc, ...pemasukanList]);
    }

    // 2. SINKRONISASI KE PENGELUARAN (Honor Jasa Driver saat Selesai)
    const existingExpIndex = pengeluaranList.findIndex(
      (p) => p.bookingId === bookingObj.id && p.kategori === 'Gaji Driver'
    );

    if (hasDriver && totalBiayaDriver > 0 && bookingObj.status === 'Selesai') {
      const labelDriver = `Honor Driver: ${bookingObj.driverNama} (${durasiHari} Hari) untuk sewa #${bookingObj.id} - ${bookingObj.customerNama}`;

      if (existingExpIndex >= 0) {
        const updatedExp = [...pengeluaranList];
        updatedExp[existingExpIndex] = {
          ...updatedExp[existingExpIndex],
          nominal: totalBiayaDriver,
          catatan: labelDriver,
          mobilNama: bookingObj.mobilNama || 'Mobil',
          tanggal: bookingObj.tglSelesai || todayStr
        };
        setPengeluaranList(updatedExp);
      } else {
        const newExp = {
          id: `EXP-DRV-${String(Date.now()).slice(-4)}`,
          tanggal: bookingObj.tglSelesai || todayStr,
          kategori: 'Gaji Driver',
          mobilId: bookingObj.mobilId || '',
          mobilNama: bookingObj.mobilNama || 'Mobil',
          bookingId: bookingObj.id,
          nominal: totalBiayaDriver,
          catatan: labelDriver,
          bukti: ''
        };
        setPengeluaranList([newExp, ...pengeluaranList]);
      }
    } else if (!hasDriver || bookingObj.status !== 'Selesai') {
      if (existingExpIndex >= 0) {
        setPengeluaranList(pengeluaranList.filter((p) => !(p.bookingId === bookingObj.id && p.kategori === 'Gaji Driver')));
      }
    }
  };


  const getTodayDates = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      startStr: today.toISOString().slice(0, 10),
      endStr: tomorrow.toISOString().slice(0, 10)
    };
  };

  const [formData, setFormData] = useState(() => {
    const { startStr, endStr } = getTodayDates();
    return {
      customerId: '',
      mobilId: '',
      driverId: '',
      tglMulai: startStr,
      tglSelesai: endStr,
      harga: 0,
      deposit: 0,
      metodePembayaran: 'Transfer Bank',
      status: 'Booking',
      catatan: ''
    };
  });

  // Calculate duration & auto price
  const calculateAutoPrice = (mobilId, driverId, startStr, endStr) => {
    const start = new Date(startStr || new Date());
    const end = new Date(endStr || new Date());
    const diffTime = Math.max(0, end - start);
    const durasiHari = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const mobilObj = mobilData.find((m) => m.id === mobilId);
    const driverObj = driverData.find((d) => d.id === driverId);

    const hargaHarianMobil = mobilObj ? Number(mobilObj.hargaHarian || mobilObj.hargaSewa || 0) : 0;
    const tarifDriver = driverObj ? Number(driverObj.tarif) || 0 : 0;

    return {
      durasiHari,
      totalHarga: durasiHari * (hargaHarianMobil + tarifDriver)
    };
  };

  const handleOpenAdd = async () => {
    if (mobilData.length === 0) {
      const ok = await confirm({
        title: 'Armada Mobil Belum Ada',
        message: 'Belum ada data unit mobil. Buka menu Mobil untuk menambahkan mobil terlebih dahulu?',
        confirmText: 'Tambah Mobil Sekarang',
        variant: 'primary'
      });
      if (ok) navigate('/mobil');
      return;
    }
    if (customerData.length === 0) {
      const ok = await confirm({
        title: 'Customer Belum Ada',
        message: 'Belum ada data pelanggan/customer. Buka menu Customer untuk menambahkan pelanggan terlebih dahulu?',
        confirmText: 'Tambah Customer Sekarang',
        variant: 'primary'
      });
      if (ok) navigate('/customer');
      return;
    }

    if (availableMobilList.length === 0) {
      toast.warning(
        'Semua Mobil Sedang Disewa!',
        'Saat ini seluruh armada mobil sedang dalam masa sewa aktif. Tidak ada unit yang berstatus Tersedia.'
      );
      return;
    }

    setEditingBooking(null);
    const { startStr, endStr } = getTodayDates();
    const firstMobilId = availableMobilList[0]?.id || mobilData[0]?.id || '';
    const firstCustId = customerData[0]?.id || '';
    const auto = calculateAutoPrice(firstMobilId, '', startStr, endStr);

    setFormData({
      customerId: firstCustId,
      mobilId: firstMobilId,
      driverId: '',
      tglMulai: startStr,
      tglSelesai: endStr,
      harga: auto.totalHarga,
      deposit: 0,
      metodePembayaran: 'Transfer Bank',
      status: 'Booking',
      catatan: ''
    });
    setIsModalOpen(true);
  };


  const handleOpenEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({ ...booking });
    setIsModalOpen(true);
  };

  const handleDateOrUnitChange = (field, val) => {
    const updatedForm = { ...formData, [field]: val };
    const auto = calculateAutoPrice(
      updatedForm.mobilId,
      updatedForm.driverId,
      updatedForm.tglMulai,
      updatedForm.tglSelesai
    );
    updatedForm.harga = auto.totalHarga;
    setFormData(updatedForm);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Hapus Transaksi Booking?',
      message: `Data transaksi sewa #${id} akan dihapus secara permanen dari sistem.`,
      confirmText: 'Ya, Hapus Transaksi',
      variant: 'danger'
    });
    if (ok) {
      setBookingList(bookingList.filter((b) => b.id !== id));
      syncBookingFinances({ id }, true);
      toast.success('Booking Dihapus', `Transaksi #${id} dan riwayat keuangannya berhasil dihapus.`);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const booking = bookingList.find((b) => b.id === id);
    if (!booking) return;

    if (newStatus === 'Selesai') {
      const harga = Number(booking.harga || booking.totalHarga) || 0;
      const deposit = Number(booking.deposit) || 0;
      const sisa = harga - deposit;

      if (sisa > 0) {
        const ok = await confirm({
          title: 'Sisa Pembayaran Belum Lunas!',
          message: `Booking #${id} masih memiliki sisa tagihan sebesar Rp ${sisa.toLocaleString('id-ID')}. Apakah penyewa sudah melunasi seluruh sisa pembayaran sekarang dan menyelesaikan masa sewa?`,
          confirmText: 'Ya, Lunasi & Selesaikan',
          cancelText: 'Batal',
          variant: 'primary'
        });

        if (!ok) return;

        // Auto mark as fully paid & Selesai
        const updatedBooking = { ...booking, status: 'Selesai', deposit: harga, statusPembayaran: 'Lunas' };
        setBookingList(bookingList.map((b) => (b.id === id ? updatedBooking : b)));
        syncBookingFinances(updatedBooking);

        toast.success(
          'Sewa Selesai & Lunas',
          `Booking #${id} berhasil diselesaikan. Biaya sewa dicatat ke Pemasukan dan honor driver masuk ke Pengeluaran.`
        );
        return;
      } else {
        const updatedBooking = { ...booking, status: 'Selesai', statusPembayaran: 'Lunas' };
        setBookingList(bookingList.map((b) => (b.id === id ? updatedBooking : b)));
        syncBookingFinances(updatedBooking);
        toast.success(
          'Sewa Selesai',
          `Booking #${id} diselesaikan. Pembukuan sewa mobil & driver telah disinkronkan ke Keuangan.`
        );
        return;
      }
    }

    const updatedBooking = { ...booking, status: newStatus };
    setBookingList(bookingList.map((b) => (b.id === id ? updatedBooking : b)));
    syncBookingFinances(updatedBooking);
    toast.info('Status Diperbarui', `Status booking #${id} diubah menjadi ${newStatus}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const customerObj = customerData.find((c) => c.id === formData.customerId);
    const mobilObj = mobilData.find((m) => m.id === formData.mobilId);
    const driverObj = driverData.find((d) => d.id === formData.driverId);

    const totalHarga = Number(formData.harga) || 0;
    const totalDeposit = Number(formData.deposit) || 0;

    // VALIDASI: Jika status diubah ke 'Selesai', pembayaran WAJIB LUNAS (deposit == harga)
    if (formData.status === 'Selesai' && totalDeposit < totalHarga) {
      const sisa = totalHarga - totalDeposit;
      toast.error(
        'Pembayaran Belum Lunas!',
        `Status tidak dapat diubah ke "Selesai" karena masih ada sisa tagihan sebesar Rp ${sisa.toLocaleString('id-ID')}. Silakan lunasi nilai Deposit / Pembayaran terlebih dahulu.`
      );
      return;
    }

    const statusPembayaran = totalDeposit >= totalHarga ? 'Lunas' : totalDeposit > 0 ? 'DP / Sebagian' : 'Belum Bayar';

    const rawDriverId = formData.driverId;
    const cleanDriverId = (rawDriverId && rawDriverId !== '' && !String(rawDriverId).includes('Tanpa Driver') && rawDriverId !== 'Tidak ada') ? String(rawDriverId) : null;

    try {
      if (editingBooking) {
        // Edit / Extension mode
        const updatedBooking = {
          ...editingBooking,
          customerId: formData.customerId,
          customerNama: customerObj?.nama || editingBooking.customerNama,
          mobilId: formData.mobilId,
          mobilNama: mobilObj?.nama || editingBooking.mobilNama,
          mobilPlat: mobilObj?.plat || editingBooking.mobilPlat,
          driverId: cleanDriverId,
          driverNama: driverObj ? driverObj.nama : 'Tanpa Driver (Lepas Kunci)',
          tglMulai: formData.tglMulai,
          tglSelesai: formData.tglSelesai,
          harga: totalHarga,
          deposit: totalDeposit,
          metodePembayaran: formData.metodePembayaran,
          status: formData.status,
          statusPembayaran,
          catatan: formData.catatan
        };

        console.log("[BOOKING] RAW FORM DATA:", formData);
        console.log("[BOOKING] SANITIZED PAYLOAD:", updatedBooking);

        await updateBooking(editingBooking.id, updatedBooking);
        syncBookingFinances(updatedBooking);
        toast.success(
          'Booking Diperbarui',
          `Rincian booking #${editingBooking.id} berhasil disimpan & disinkronkan ke Keuangan!`
        );
      } else {
        // New booking mode
        const now = new Date();
        const yr = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const uniqueCode = String(Date.now()).slice(-4);
        const newBooking = {
          id: `BK-${yr}${mo}-${uniqueCode}`,
          customerId: formData.customerId,
          customerNama: customerObj?.nama || 'Customer',
          mobilId: formData.mobilId,
          mobilNama: mobilObj?.nama || 'Mobil',
          mobilPlat: mobilObj?.plat || 'Plat',
          driverId: cleanDriverId,
          driverNama: driverObj ? driverObj.nama : 'Tanpa Driver (Lepas Kunci)',
          tglMulai: formData.tglMulai,
          tglSelesai: formData.tglSelesai,
          harga: totalHarga,
          deposit: totalDeposit,
          metodePembayaran: formData.metodePembayaran,
          status: formData.status,
          statusPembayaran,
          catatan: formData.catatan,
          createdAt: now.toISOString().slice(0, 10)
        };

        console.log("[BOOKING] RAW FORM DATA:", formData);
        console.log("[BOOKING] SANITIZED PAYLOAD:", newBooking);

        await addBooking(newBooking);
        syncBookingFinances(newBooking);
        toast.success('Booking Dibuat', `Transaksi #${newBooking.id} berhasil ditambahkan dan disinkronkan ke Keuangan.`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("[BOOKING] SUPABASE ERROR:", {
        code: err?.code,
        message: err?.message,
        details: err?.details,
        hint: err?.hint
      });
      toast.error('Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan transaksi booking ke database.');
    }
  };




  const filterOptions = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Booking', value: 'Booking' },
    { label: 'Berjalan', value: 'Berjalan' },
    { label: 'Selesai', value: 'Selesai' },
    { label: 'Dibatalkan', value: 'Dibatalkan' },
  ];

  const currentAuto = calculateAutoPrice(formData.mobilId, formData.driverId, formData.tglMulai, formData.tglSelesai);

  const columns = [
    {
      header: 'ID Booking',
      accessorKey: 'id',
      cell: (row) => <span className="id-tag">{row.id}</span>
    },
    {
      header: 'Customer',
      accessorKey: 'customerNama',
      cell: (row) => <span className="font-medium">{row.customerNama}</span>
    },
    {
      header: 'Mobil & Driver',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.mobilNama}</div>
          <div className="subtext">{row.driverNama}</div>
        </div>
      )
    },
    {
      header: 'Periode Sewa',
      cell: (row) => (
        <div>
          <div className="font-medium">{row.tglMulai} s/d {row.tglSelesai}</div>
        </div>
      )
    },
    {
      header: 'Total Biaya',
      cell: (row) => (
        <span className="font-medium">Rp {Number(row.harga).toLocaleString('id-ID')}</span>
      )
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge>
      )
    },
    {
      header: 'Aksi',
      cell: (row) => (
        <div className="table-actions">
          <button
            className="btn-icon"
            title="Lihat Detail"
            onClick={() => navigate(`/booking/${row.id}`)}
          >
            <Eye size={16} />
          </button>

          <button
            className="btn-icon"
            title="Edit / Perpanjang Sewa"
            onClick={() => handleOpenEdit(row)}
          >
            <Edit size={16} />
          </button>

          <button
            className="btn-icon"
            title="Lihat Invoice"
            onClick={() => navigate(`/invoice/${row.id}`)}
          >
            <Receipt size={16} />
          </button>

          {row.status === 'Berjalan' && (
            <button
              className="btn-icon text-success"
              title="Tandai Selesai"
              onClick={() => handleStatusChange(row.id, 'Selesai')}
            >
              <CheckCircle2 size={16} />
            </button>
          )}

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
    <div className="booking-page">
      <PageHeader
        title={t('nav.booking')}
        description="Kelola transaksi sewa, perpanjangan tanggal sewa, dan kalkulasi harga otomatis."
        action={
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            Buat Booking Baru
          </button>
        }
      />

      <Table
        columns={columns}
        data={bookingList}
        searchKey="customerNama"
        searchPlaceholder="Cari nama customer atau id..."
        filterOptions={filterOptions}
        filterKey="status"
        pageSize={5}
        isLoading={isLoading}
      />

      {/* Modal Form Booking / Perpanjang */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBooking ? `Edit / Perpanjang Sewa #${editingBooking.id}` : 'Buat Transaksi Booking Baru'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingBooking ? 'Simpan Perubahan & Update Harga' : 'Simpan & Generate Invoice'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="booking-form">
          {/* Extension Notice */}
          <div className="card badge-info" style={{ marginBottom: '16px', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={18} />
            <div>
              <strong>Durasi Sewa: {currentAuto.durasiHari} Hari</strong>. Harga otomatis dihitung Rp {currentAuto.totalHarga.toLocaleString('id-ID')}.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pilih Customer</label>
            <select
              className="form-select"
              value={formData.customerId}
              onChange={(e) => handleDateOrUnitChange('customerId', e.target.value)}
            >
              {customerData.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama} ({c.noHp})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Pilih Mobil (Unit Tersedia)</label>
              <select
                className="form-select"
                value={formData.mobilId}
                onChange={(e) => handleDateOrUnitChange('mobilId', e.target.value)}
              >
                {availableMobilList.length === 0 && !editingBooking && (
                  <option value="" disabled>-- Tidak Ada Unit Tersedia --</option>
                )}
                {(editingBooking
                  ? mobilData.filter((m) => availableMobilList.some((av) => av.id === m.id) || m.id === editingBooking.mobilId)
                  : availableMobilList
                ).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama} ({m.plat}) - Rp {Number(m.hargaHarian || m.hargaSewa || 0).toLocaleString('id-ID')}/hr
                  </option>
                ))}
              </select>
            </div>


            <div className="form-group">
              <label className="form-label">Pilih Driver (Opsional)</label>
              <select
                className="form-select"
                value={formData.driverId}
                onChange={(e) => handleDateOrUnitChange('driverId', e.target.value)}
              >
                <option value="">Tanpa Driver (Lepas Kunci)</option>
                {driverData.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama} (+Rp {d.tarif.toLocaleString('id-ID')}/hr)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Tanggal Mulai Sewa</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.tglMulai}
                onChange={(e) => handleDateOrUnitChange('tglMulai', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal Selesai (Ubah untuk Perpanjang)</label>
              <input
                type="date"
                className="form-input"
                required
                value={formData.tglSelesai}
                onChange={(e) => handleDateOrUnitChange('tglSelesai', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Total Biaya Sewa (Rp)</label>
              <input
                type="number"
                className="form-input"
                required
                placeholder="0"
                value={formData.harga}
                onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deposit / DP (Rp)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0 (Opsional)"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
              />
            </div>


            <div className="form-group">
              <label className="form-label">Pembayaran</label>
              <select
                className="form-select"
                value={formData.metodePembayaran}
                onChange={(e) => setFormData({ ...formData, metodePembayaran: e.target.value })}
              >
                <option value="Transfer BCA">Transfer BCA</option>
                <option value="Transfer Mandiri">Transfer Mandiri</option>
                <option value="QRIS">QRIS</option>
                <option value="Tunai">Tunai / Cash</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status Booking</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Booking">Booking</option>
              <option value="Berjalan">Berjalan</option>
              <option value="Selesai">Selesai (Wajib Lunas)</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Sisa Tagihan Warning when Selesai is selected */}
          {formData.status === 'Selesai' && Number(formData.deposit || 0) < Number(formData.harga || 0) && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Belum Lunas:</strong> Masih ada sisa tagihan <strong>Rp {(Number(formData.harga || 0) - Number(formData.deposit || 0)).toLocaleString('id-ID')}</strong>.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                style={{ fontSize: '11.5px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                onClick={() => setFormData({ ...formData, deposit: formData.harga })}
              >
                Set Lunas (Rp {Number(formData.harga || 0).toLocaleString('id-ID')})
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Catatan Tambahan / Perpanjangan</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Misal: Penyewa memperpanjang sewa 2 hari via WhatsApp"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
