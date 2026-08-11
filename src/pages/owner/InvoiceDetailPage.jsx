import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CarFront, QrCode } from 'lucide-react';
import { useTenantStore } from '../../hooks/useTenantStore';
import { useAuth } from '../../hooks/useAuth';
import './InvoiceDetailPage.css';

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: bookingData } = useTenantStore('booking');
  const { data: customerData } = useTenantStore('customer');
  const { data: mobilData } = useTenantStore('mobil');
  const { data: settingsData } = useTenantStore('settings');
  const { currentUser } = useAuth();

  const settings = (Array.isArray(settingsData) && settingsData[0]) ? settingsData[0] : (currentUser || {});

  const namaRental = settings.namaRental || currentUser?.namaRental || 'Rentra';
  const logo = settings.logo || currentUser?.logo || '';
  const alamat = settings.alamat || currentUser?.alamat || 'Garasi Utama';
  const noHp = settings.noHp || currentUser?.noHp || '';

  const namaBank = settings.namaBank || 'BCA';
  const nomorRekening = settings.nomorRekening || '123-456-7890';
  const atasNamaRekening = settings.atasNamaRekening || namaRental;
  const instruksiPembayaran = settings.instruksiPembayaran || 'Mendukung BCA, Mandiri, GoPay, OVO, Dana & Tunai';

  const booking = bookingData.find((b) => b.id === id);

  if (!booking) {
    return (
      <div className="invoice-detail-page">
        <div className="back-link" onClick={() => navigate('/invoice')}>
          <ArrowLeft size={16} /> Kembali ke Daftar Invoice
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3>Data Invoice Tidak Ditemukan</h3>
          <p className="subtext" style={{ margin: '8px 0 16px' }}>Invoice transaksi ini tidak ditemukan atau telah dihapus.</p>
          <button className="btn btn-primary" onClick={() => navigate('/invoice')}>
            Ke Halaman Invoice
          </button>
        </div>
      </div>
    );
  }

  const customer = customerData.find((c) => c.id === booking.customerId);
  const mobil = mobilData.find((m) => m.id === booking.mobilId);

  const sisa = (booking.harga || booking.totalHarga || 0) - (booking.deposit || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-detail-page">
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="back-link" onClick={() => navigate('/invoice')}>
          <ArrowLeft size={16} /> Kembali ke Daftar Invoice
        </div>

        <button className="btn btn-primary" onClick={handlePrint}>
          <Printer size={16} /> Cetak Invoice / Download PDF
        </button>
      </div>

      {/* Printable Paper Card */}
      <div className="invoice-paper card">
        {/* Invoice Header */}
        <div className="invoice-header">
          <div className="brand-header" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {logo ? (
              <img
                src={logo}
                alt={namaRental}
                style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            ) : (
              <div className="brand-logo">
                <CarFront size={24} />
              </div>
            )}
            <div>
              <h2 className="company-name">{namaRental}</h2>
              <p className="company-sub">{alamat} {noHp ? `• ${noHp}` : ''}</p>
            </div>
          </div>

          <div className="invoice-title-block">
            <h1 className="inv-title">INVOICE</h1>
            <div className="inv-num">INV/{booking.id}</div>
            <div className="inv-date">Tanggal: {booking.createdAt || booking.tglMulai}</div>
          </div>
        </div>

        <hr className="inv-divider" />

        {/* Invoice Info Row */}
        <div className="invoice-info-grid">
          <div className="inv-box">
            <span className="inv-label">DITAGIHKAN KEPADA:</span>
            <div className="inv-val-title">{booking.customerNama}</div>
            {customer && (
              <div className="inv-val-sub">
                No HP: {customer.noHp}<br />
                KTP: {customer.noKtp}<br />
                Alamat: {customer.alamat}
              </div>
            )}
          </div>

          <div className="inv-box text-right">
            <span className="inv-label">DETAIL PEMBAYARAN:</span>
            <div className="inv-val-title">{booking.metodePembayaran}</div>
            <div className="inv-val-sub">
              Status: <strong>{booking.statusPembayaran || 'Lunas'}</strong><br />
              Rek {namaBank}: <strong>{nomorRekening}</strong><br />
              (a.n {atasNamaRekening})
            </div>
          </div>
        </div>

        {/* Item Table */}
        <div className="table-container margin-top-lg">
          <table className="table">
            <thead>
              <tr>
                <th>Deskripsi Sewa</th>
                <th>Mobil / Plat</th>
                <th>Periode Sewa</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Sewa Mobil {booking.driverNama && !booking.driverNama.includes('Tanpa Driver') ? '+ Driver' : '(Lepas Kunci)'}</strong><br />
                  <span className="subtext">{booking.driverNama}</span>
                </td>
                <td>{booking.mobilNama} ({booking.mobilPlat})</td>
                <td>{booking.tglMulai} s/d {booking.tglSelesai}</td>
                <td className="text-right font-medium">
                  Rp {(booking.harga || booking.totalHarga || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Invoice Summary */}
        <div className="invoice-summary-grid margin-top-lg">
          <div className="qris-box">
            <QrCode size={64} className="qris-icon" />
            <div>
              <strong>Scan QRIS / Info Pembayaran</strong>
              <p className="subtext">{instruksiPembayaran}</p>
            </div>
          </div>

          <div className="summary-calculations">
            <div className="summary-row">
              <span>Total Sewa:</span>
              <strong>Rp {(booking.harga || booking.totalHarga || 0).toLocaleString('id-ID')}</strong>
            </div>
            <div className="summary-row text-success">
              <span>Deposit (DP):</span>
              <strong>- Rp {(booking.deposit || 0).toLocaleString('id-ID')}</strong>
            </div>
            <hr className="inv-divider" />
            <div className="summary-row total-row">
              <span>Sisa Pembayaran:</span>
              <strong className="text-primary">
                Rp {sisa.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="invoice-footer-note">
          <p>Terima kasih telah mempercayakan perjalanan Anda kepada <strong>{namaRental}</strong>.</p>
          <p className="subtext">{settings.syaratKetentuan ? settings.syaratKetentuan.split('\n')[0] : 'Syarat & Ketentuan pengembalian mobil berlaku sesuai perjanjian sewa.'}</p>
        </div>
      </div>
    </div>
  );
}

