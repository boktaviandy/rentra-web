import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { ArrowLeft, Receipt, User, Car, UserCheck, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { useStore } from '../../hooks/useStore';

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: bookingData } = useStore('booking');
  const { data: customerData } = useStore('customer');
  const { data: mobilData } = useStore('mobil');

  const booking = bookingData.find((b) => b.id === id);

  if (!booking) {
    return (
      <div className="booking-detail-page">
        <div className="back-link" onClick={() => navigate('/booking')}>
          <ArrowLeft size={16} /> Kembali ke Daftar Booking
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3>Data Booking Tidak Ditemukan</h3>
          <p className="subtext" style={{ margin: '8px 0 16px' }}>Transaksi booking dengan ID ini tidak ditemukan atau telah dihapus.</p>
          <button className="btn btn-primary" onClick={() => navigate('/booking')}>
            Ke Halaman Booking
          </button>
        </div>
      </div>
    );
  }

  const customer = customerData.find((c) => c.id === booking.customerId);
  const mobil = mobilData.find((m) => m.id === booking.mobilId);

  const sisaPembayaran = (booking.harga || booking.totalHarga || 0) - (booking.deposit || 0);


  return (
    <div className="booking-detail-page">
      <div className="back-link" onClick={() => navigate('/booking')}>
        <ArrowLeft size={16} /> Kembali ke Daftar Booking
      </div>

      <PageHeader
        title={`Detail Booking #${booking.id}`}
        description={`Dibuat pada ${booking.createdAt}`}
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
            <button className="btn btn-secondary" onClick={() => navigate(`/invoice/${booking.id}`)}>
              <Receipt size={16} /> Cetak Invoice
            </button>
          </div>
        }
      />

      <div className="dashboard-two-col">
        {/* Info Pelanggan & Unit */}
        <div className="col-stack">
          {/* Mobil */}
          <div className="card">
            <div className="card-header-flex">
              <h3><Car size={18} /> Unit Mobil</h3>
            </div>
            {mobil && (
              <div className="mobil-info-cell" style={{ marginBottom: '12px' }}>
                <img src={mobil.foto} alt={mobil.nama} className="mobil-thumb" style={{ width: '80px', height: '60px' }} />
                <div>
                  <div className="mobil-title" style={{ fontSize: '16px' }}>{mobil.nama}</div>
                  <div className="mobil-sub">{mobil.merk} • {mobil.tahun}</div>
                  <span className="plat-badge">{mobil.plat}</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="card">
            <div className="card-header-flex">
              <h3><User size={18} /> Informasi Penyewa</h3>
            </div>
            {customer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div><strong>Nama:</strong> {customer.nama}</div>
                <div><strong>No HP:</strong> {customer.noHp}</div>
                <div><strong>No KTP:</strong> {customer.noKtp}</div>
                <div><strong>Alamat:</strong> {customer.alamat}</div>
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Biaya & Pembayaran */}
        <div className="card">
          <div className="card-header-flex">
            <h3><DollarSign size={18} /> Ringkasan Pembayaran</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div className="price-item">
              <span className="price-label">Metode Pembayaran</span>
              <span className="font-medium" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} /> {booking.metodePembayaran}
              </span>
            </div>

            <div className="price-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Harga Sewa Total:</span>
                <strong>Rp {booking.harga.toLocaleString('id-ID')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Deposit / DP:</span>
                <strong>- Rp {booking.deposit.toLocaleString('id-ID')}</strong>
              </div>
              <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                <span>Sisa Pelunasan:</span>
                <strong style={{ color: 'var(--primary)' }}>
                  Rp {sisaPembayaran.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <div className="catatan-box">
              <h4>Catatan Tambahan</h4>
              <p>{booking.catatan || 'Tidak ada catatan'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
