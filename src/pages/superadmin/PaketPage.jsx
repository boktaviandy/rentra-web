import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Package, Check, Edit3, Trash2, Shield, Layers, CheckSquare, Square } from 'lucide-react';
import './PaketPage.css';

const DEFAULT_PAKETS = [
  {
    id: 1,
    nama: 'Trial 14 Hari',
    harga: 0,
    durasi: '14 Hari',
    maxMobil: 3,
    maxUser: 1,
    maxBooking: 10,
    modules: ['mobil', 'booking', 'kalender', 'customer'],
    fiturText: 'Dashboard basic, Manajemen 3 mobil, Kalender Booking',
    status: 'Aktif'
  },
  {
    id: 2,
    nama: 'Basic Plan',
    harga: 299000,
    durasi: '1 Bulan',
    maxMobil: 15,
    maxUser: 3,
    maxBooking: 100,
    modules: ['mobil', 'booking', 'kalender', 'customer', 'driver', 'keuangan', 'invoice'],
    fiturText: 'Semua fitur Trial, Modul Driver, Laporan Keuangan & Invoice PDF',
    status: 'Aktif'
  },
  {
    id: 3,
    nama: 'Pro Plan',
    harga: 599000,
    durasi: '1 Bulan',
    maxMobil: 50,
    maxUser: 10,
    maxBooking: 1000,
    modules: ['mobil', 'booking', 'kalender', 'customer', 'driver', 'keuangan', 'invoice', 'auditlog'],
    fiturText: 'Manajemen 50 mobil, Audit Log Aktivitas, Export PDF & Laporan Lengkap',
    status: 'Aktif'
  },
  {
    id: 4,
    nama: 'Enterprise Plan',
    harga: 1299000,
    durasi: '1 Bulan',
    maxMobil: 999,
    maxUser: 50,
    maxBooking: 99999,
    modules: ['mobil', 'booking', 'kalender', 'customer', 'driver', 'keuangan', 'invoice', 'auditlog', 'custom_logo'],
    fiturText: 'Unlimited mobil & user, Custom Logo Rental, Dedicated Server & Priority Support 24/7',
    status: 'Aktif'
  }
];

const AVAILABLE_MODULES = [
  { id: 'mobil', label: '🚗 Manajemen Unit Mobil' },
  { id: 'booking', label: '📋 Booking & Reservasi' },
  { id: 'kalender', label: '📅 Kalender Booking Interactive' },
  { id: 'customer', label: '👥 Manajemen Customer' },
  { id: 'driver', label: '🧑‍✈️ Manajemen Driver' },
  { id: 'keuangan', label: '📈 Laporan Keuangan (Pemasukan & Pengeluaran)' },
  { id: 'invoice', label: '🧾 Invoice & Export PDF' },
  { id: 'auditlog', label: '📜 Audit Log Aktivitas' },
  { id: 'custom_logo', label: '🖼️ Custom Logo Rental per Tenant' },
];

const STORAGE_KEY = 'rentra_saas_pakets_v1';

function loadPakets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) { console.error(e); }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAKETS));
  return DEFAULT_PAKETS;
}

function savePakets(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { console.error(e); }
}

export function PaketPage() {
  const [paketList, setPaketList] = useState(() => loadPakets());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    harga: 199000,
    durasi: '1 Bulan',
    maxMobil: 10,
    maxUser: 2,
    maxBooking: 50,
    modules: ['mobil', 'booking', 'kalender', 'customer'],
    fiturText: '',
    status: 'Aktif'
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      harga: 299000,
      durasi: '1 Bulan',
      maxMobil: 15,
      maxUser: 3,
      maxBooking: 100,
      modules: ['mobil', 'booking', 'kalender', 'customer', 'driver', 'keuangan', 'invoice'],
      fiturText: '',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (paket) => {
    setEditingId(paket.id);
    setFormData({
      nama: paket.nama,
      harga: paket.harga,
      durasi: paket.durasi,
      maxMobil: paket.maxMobil,
      maxUser: paket.maxUser,
      maxBooking: paket.maxBooking,
      modules: paket.modules || [],
      fiturText: paket.fiturText || '',
      status: paket.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus paket "${nama}"?`)) {
      const updated = paketList.filter(p => p.id !== id);
      setPaketList(updated);
      savePakets(updated);
    }
  };

  const handleToggleModule = (modId) => {
    setFormData((prev) => {
      const current = prev.modules || [];
      const updated = current.includes(modId)
        ? current.filter(m => m !== modId)
        : [...current, modId];
      return { ...prev, modules: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama) return;

    // Clean numeric parsing for harga (handles numbers and text inputs)
    const numericHarga = typeof formData.harga === 'number'
      ? formData.harga
      : Number(String(formData.harga).replace(/[^\d]/g, '')) || 0;

    const updatedForm = {
      ...formData,
      harga: numericHarga,
    };

    let updatedList;
    if (editingId) {
      updatedList = paketList.map(p => (String(p.id) === String(editingId) ? { ...p, ...updatedForm } : p));
    } else {
      const newPaket = {
        ...updatedForm,
        id: Date.now(),
      };
      updatedList = [...paketList, newPaket];
    }

    setPaketList(updatedList);
    savePakets(updatedList);
    setIsModalOpen(false);
  };

  const handleResetDefault = () => {
    if (window.confirm('Reset daftar paket ke 4 paket bawaan (Trial, Basic, Pro, Enterprise)?')) {
      setPaketList(DEFAULT_PAKETS);
      savePakets(DEFAULT_PAKETS);
    }
  };

  return (
    <div className="paket-page">
      <PageHeader
        title="Paket Langganan SaaS"
        description="Kelola varian paket, harga, batasan kuota, dan batasan akses fitur (modul) untuk tenant."
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleResetDefault}>
              Reset Ke Standar Bawaan
            </button>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Buat Paket Baru
            </button>
          </div>
        }
      />

      {paketList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', fontWeight: '600' }}>Belum ada paket langganan tersimpan.</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Klik tombol "Buat Paket Baru" untuk menambahkan paket SaaS.</p>
        </div>
      ) : (
        <div className="paket-cards-grid">
          {paketList.map((p) => (
            <div key={p.id} className="card paket-card">
              <div className="paket-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="paket-name">{p.nama}</span>
                  <Badge variant={getStatusBadgeVariant(p.status)}>{p.status}</Badge>
                </div>
                <div className="paket-card-actions">
                  <button
                    className="btn-icon"
                    title="Edit Paket"
                    onClick={() => handleOpenEdit(p)}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    className="btn-icon text-danger"
                    title="Hapus Paket"
                    onClick={() => handleDelete(p.id, p.nama)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="paket-price">
                <span className="price-num">
                  {p.harga === 0 ? 'GRATIS' : `Rp ${p.harga.toLocaleString('id-ID')}`}
                </span>
                <span className="price-period">/ {p.durasi}</span>
              </div>

              <div className="paket-limits">
                <div className="limit-item">Maks. Mobil: <strong>{p.maxMobil} Unit</strong></div>
                <div className="limit-item">Maks. User: <strong>{p.maxUser} Akun</strong></div>
                <div className="limit-item">Maks. Booking: <strong>{p.maxBooking} / Bln</strong></div>
              </div>

              <div className="paket-fitur">
                <span className="fitur-title">Modul Fitur Diizinkan:</span>
                <div className="modules-list" style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {AVAILABLE_MODULES.map((mod) => {
                    const isAllowed = p.modules?.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: isAllowed ? 'var(--text-main)' : 'var(--text-muted)',
                          opacity: isAllowed ? 1 : 0.45,
                          textDecoration: isAllowed ? 'none' : 'line-through'
                        }}
                      >
                        {isAllowed ? (
                          <Check size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#EF4444', color: '#fff', fontSize: '9px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</span>
                        )}
                        <span>{mod.label}</span>
                      </div>
                    );
                  })}
                </div>

                {p.fiturText && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <strong>Catatan Tambahan:</strong> {p.fiturText}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form Buat / Edit Paket */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Paket Langganan' : 'Buat Paket Langganan Baru'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editingId ? 'Simpan Perubahan' : 'Buat Paket'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Paket <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="Contoh: Professional Plan"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Harga (Rp) <span className="text-danger">*</span></label>
              <input
                type="number"
                className="form-input"
                required
                placeholder="0 untuk gratis"
                value={formData.harga}
                onChange={(e) => setFormData({ ...formData, harga: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Durasi Periodik</label>
              <select
                className="form-select"
                value={formData.durasi}
                onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}
              >
                <option value="14 Hari">14 Hari</option>
                <option value="1 Bulan">1 Bulan</option>
                <option value="3 Bulan">3 Bulan</option>
                <option value="6 Bulan">6 Bulan</option>
                <option value="1 Tahun">1 Tahun</option>
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Maks. Mobil</label>
              <input
                type="number"
                className="form-input"
                value={formData.maxMobil}
                onChange={(e) => setFormData({ ...formData, maxMobil: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maks. User</label>
              <input
                type="number"
                className="form-input"
                value={formData.maxUser}
                onChange={(e) => setFormData({ ...formData, maxUser: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maks. Booking/Bln</label>
              <input
                type="number"
                className="form-input"
                value={formData.maxBooking}
                onChange={(e) => setFormData({ ...formData, maxBooking: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Module Restrictions Checklist */}
          <div className="form-group" style={{ marginTop: '14px' }}>
            <label className="form-label" style={{ marginBottom: '8px', fontWeight: '700' }}>
              Akses Modul Fitur (Centang yang diizinkan):
            </label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              background: 'var(--bg-app)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              maxHeight: '220px',
              overflowY: 'auto'
            }}>
              {AVAILABLE_MODULES.map((mod) => {
                const checked = formData.modules?.includes(mod.id);
                return (
                  <label
                    key={mod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontWeight: checked ? '600' : '400',
                      color: checked ? 'var(--text-main)' : 'var(--text-muted)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleModule(mod.id)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span>{mod.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan / Ringkasan Fitur</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Catatan tambahan paket ini..."
              value={formData.fiturText}
              onChange={(e) => setFormData({ ...formData, fiturText: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
