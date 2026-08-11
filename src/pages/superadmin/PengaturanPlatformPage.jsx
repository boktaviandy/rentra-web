import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Save, Settings } from 'lucide-react';

export function PengaturanPlatformPage() {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('rentra_superadmin_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      namaApp: 'Rentra SaaS',
      domain: 'rentra.id',
      noWaSuperAdmin: '081250308099',
      smtpHost: 'smtp.sendgrid.net',
      smtpPort: 587,
      smtpUser: 'apikey',
      waApiKey: 'WA_API_KEY_LIVE_99887766',
      paymentGateway: 'Midtrans Production',
      merchantId: 'M109283'
    };
  });

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('rentra_superadmin_config', JSON.stringify(formData));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="pengaturan-platform-page">
      <PageHeader
        title="Pengaturan Platform SaaS"
        description="Integrasi API gateway, SMTP Email, Payment Gateway, dan Domain master."
      />

      {saved && (
        <div className="card badge-success" style={{ marginBottom: '20px', padding: '12px 16px' }}>
          ✓ Pengaturan platform berhasil disimpan!
        </div>
      )}

      <div className="card" style={{ maxWidth: '720px' }}>
        <form onSubmit={handleSave}>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Nama Aplikasi SaaS</label>
              <input
                type="text"
                className="form-input"
                value={formData.namaApp}
                onChange={(e) => setFormData({ ...formData, namaApp: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Master Domain</label>
              <input
                type="text"
                className="form-input"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label className="form-label">Nomor WhatsApp Super Admin (Penerima Perpanjangan)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: 081250308099"
              value={formData.noWaSuperAdmin || ''}
              onChange={(e) => setFormData({ ...formData, noWaSuperAdmin: e.target.value })}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Nomor WhatsApp ini akan digunakan saat tenant menekan tombol "Perpanjang" di sidebar.
            </small>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />
          <h4>Configuration API Gateway</h4>

          <div className="form-row-2" style={{ marginTop: '12px' }}>
            <div className="form-group">
              <label className="form-label">Payment Gateway Provider</label>
              <input
                type="text"
                className="form-input"
                value={formData.paymentGateway}
                onChange={(e) => setFormData({ ...formData, paymentGateway: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Merchant ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.merchantId}
                onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp API Key (Official Gateway)</label>
            <input
              type="password"
              className="form-input"
              value={formData.waApiKey}
              onChange={(e) => setFormData({ ...formData, waApiKey: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SMTP Email Server</label>
            <input
              type="text"
              className="form-input"
              value={formData.smtpHost}
              onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
            <Save size={16} /> Simpan Pengaturan Platform
          </button>
        </form>
      </div>
    </div>
  );
}
