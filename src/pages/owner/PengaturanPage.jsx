import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Save, Upload, X, ImageIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../hooks/useStore';
import { useToast } from '../../context/ToastContext';

/**
 * Compress an image File to a base64 data-URL at the given max width/height.
 */
function compressImage(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (ev) => {
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;

      if (w > h) {
        if (w > maxSize) { h = Math.round((h * maxSize) / w); w = maxSize; }
      } else {
        if (h > maxSize) { w = Math.round((w * maxSize) / h); h = maxSize; }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/webp', 0.82));
    };
    img.onerror = reject;
  });
}

export function PengaturanPage() {
  const { t } = useTranslation();
  const { currentUser, updateProfile } = useAuth();
  const { data: storedSettings, setData: setStoredSettings } = useStore('settings');
  const { toast, confirm } = useToast();

  const fileRef = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const [settings, setSettings] = useState(() => {
    const fromStore = Array.isArray(storedSettings) && storedSettings[0] ? storedSettings[0] : {};
    return {
      namaRental: fromStore.namaRental || currentUser?.namaRental || 'Garuda Rent Car',
      namaOwner: fromStore.namaOwner || currentUser?.namaOwner || 'Budi Pratama',
      noHp: fromStore.noHp || currentUser?.noHp || '0812-9900-1122',
      email: fromStore.email || currentUser?.email || 'admin@rentra.com',
      alamat: fromStore.alamat || currentUser?.alamat || 'Jl. Sudirman No. 100, Jakarta Selatan',
      zonaWaktu: fromStore.zonaWaktu || 'Asia/Jakarta (WIB)',
      mataUang: fromStore.mataUang || 'IDR (Rp)',
      logo: fromStore.logo || currentUser?.logo || '',
      namaBank: fromStore.namaBank || 'BCA',
      nomorRekening: fromStore.nomorRekening || '123-456-7890',
      atasNamaRekening: fromStore.atasNamaRekening || fromStore.namaRental || currentUser?.namaRental || 'Garuda Rent',
      instruksiPembayaran: fromStore.instruksiPembayaran || 'Mendukung Transfer Bank BCA, Mandiri, QRIS & Tunai',
      syaratKetentuan: fromStore.syaratKetentuan || '1. Penyewa wajib memiliki KTP & SIM A aktif.\n2. Pembayaran sewa wajib lunas di awal sebelum serah terima unit.\n3. Keterlambatan pengembalian unit dikenakan denda Rp 50.000 / jam.',
      ...fromStore
    };
  });

  useEffect(() => {
    if (storedSettings && storedSettings.length > 0 && storedSettings[0]?.namaRental) {
      setSettings((prev) => ({
        ...prev,
        ...storedSettings[0],
      }));
    }
  }, [storedSettings]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Gagal', 'File harus berupa gambar (JPG, PNG, WEBP, SVG).');
      return;
    }
    setLogoUploading(true);
    try {
      const base64 = await compressImage(file, 256);
      setSettings((prev) => ({ ...prev, logo: base64 }));
      toast.success('Logo Dipilih', 'Klik Simpan Pengaturan untuk menerapkan logo.');
    } catch (err) {
      console.error('Gagal kompresi logo:', err);
      toast.error('Gagal', 'Gagal memproses gambar. Coba file lain.');
    } finally {
      setLogoUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, logo: '' }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const updatedSettings = { ...settings, id: 1 };
    
    // Save to local cache + Supabase table settings
    if (setStoredSettings) {
      await setStoredSettings([updatedSettings]);
    }

    updateProfile({
      namaRental: settings.namaRental,
      namaOwner: settings.namaOwner,
      noHp: settings.noHp,
      email: settings.email,
      alamat: settings.alamat,
      logo: settings.logo,
      namaBank: settings.namaBank,
      nomorRekening: settings.nomorRekening,
      atasNamaRekening: settings.atasNamaRekening,
      instruksiPembayaran: settings.instruksiPembayaran,
    });

    toast.success('Pengaturan Disimpan', 'Identitas rental dan rincian rekening invoice berhasil diperbarui!');
  };


  return (
    <div className="pengaturan-page">
      <PageHeader
        title={t('nav.pengaturan')}
        description="Konfigurasi identitas rental, kontak, rekening, dan profil bisnis."
      />

      <div className="card" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSave} className="pengaturan-form">


          <div className="form-group">
            <label className="form-label">Nama Rental</label>
            <input
              type="text"
              className="form-input"
              required
              value={settings.namaRental}
              onChange={(e) => setSettings({ ...settings, namaRental: e.target.value })}
            />
          </div>


          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Nama Owner / Pengelola</label>
              <input
                type="text"
                className="form-input"
                required
                value={settings.namaOwner}
                onChange={(e) => setSettings({ ...settings, namaOwner: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp / HP</label>
              <input
                type="text"
                className="form-input"
                required
                value={settings.noHp}
                onChange={(e) => setSettings({ ...settings, noHp: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Email Operasional</label>
              <input
                type="email"
                className="form-input"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mata Uang Default</label>
              <select
                className="form-select"
                value={settings.mataUang}
                onChange={(e) => setSettings({ ...settings, mataUang: e.target.value })}
              >
                <option value="IDR (Rp)">Rupiah Indonesia (IDR)</option>
                <option value="USD ($)">US Dollar (USD)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Garasi / Kantor</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={settings.alamat}
              onChange={(e) => setSettings({ ...settings, alamat: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Zona Waktu</label>
            <select
              className="form-select"
              value={settings.zonaWaktu}
              onChange={(e) => setSettings({ ...settings, zonaWaktu: e.target.value })}
            >
              <option value="Asia/Jakarta (WIB)">WIB (Asia/Jakarta)</option>
              <option value="Asia/Makassar (WITA)">WITA (Asia/Makassar)</option>
              <option value="Asia/Jayapura (WIT)">WIT (Asia/Jayapura)</option>
            </select>
          </div>

          {/* Logo Upload */}
          <div className="form-group">
            <label className="form-label">Logo Rental</label>
            <div className="logo-upload-wrap">
              {settings.logo ? (
                <div className="logo-preview-box">
                  <img
                    src={settings.logo}
                    alt="Logo Rental"
                    className="logo-preview-img"
                  />
                  <div className="logo-preview-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={14} /> Ganti Logo
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-danger"
                      onClick={handleRemoveLogo}
                    >
                      <X size={14} /> Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="logo-upload-btn"
                  onClick={() => fileRef.current?.click()}
                  disabled={logoUploading}
                >
                  <ImageIcon size={28} className="logo-upload-icon" />
                  <span className="logo-upload-label">
                    {logoUploading ? 'Memproses...' : 'Klik untuk upload logo'}
                  </span>
                  <span className="logo-upload-hint">PNG, JPG, WEBP — Max 2 MB — Dikompres otomatis</span>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          {/* Rincian Rekening Pembayaran Invoice */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 Rekening & Detail Pembayaran Invoice
            </h4>
            <p className="subtext" style={{ marginBottom: '16px', fontSize: '12px' }}>
              Informasi rekening bank dan metode pembayaran ini akan otomatis tercetak pada lembar faktur / invoice pelanggan.
            </p>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Nama Bank / Metode Pembayaran</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: BCA / Mandiri / BRI / QRIS"
                  value={settings.namaBank || ''}
                  onChange={(e) => setSettings({ ...settings, namaBank: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Rekening / No. HP E-Wallet</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 123-456-7890"
                  value={settings.nomorRekening || ''}
                  onChange={(e) => setSettings({ ...settings, nomorRekening: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Atas Nama Rekening</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: I-Trans Rent Car"
                  value={settings.atasNamaRekening || ''}
                  onChange={(e) => setSettings({ ...settings, atasNamaRekening: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Instruksi / Dukungan Pembayaran (QRIS)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Mendukung BCA, Mandiri, GoPay, OVO, Dana"
                  value={settings.instruksiPembayaran || ''}
                  onChange={(e) => setSettings({ ...settings, instruksiPembayaran: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
            <Save size={16} /> Simpan Pengaturan
          </button>

        </form>
      </div>

    </div>
  );
}




