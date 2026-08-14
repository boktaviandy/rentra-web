import React, { useState, useRef, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import {
  Upload,
  Trash2,
  Search,
  ImagePlus,
  Car,
  CheckCircle2,
  X,
  RefreshCw,
  Pencil,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useFotoLibrary, getFotoSrc } from '../../hooks/useFotoLibrary';
import { compressImage, formatFileSize } from '../../utils/imageCompressor';
import './GaleriFotoPage.css';

function generateId() {
  return `FOTO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function CarPlaceholderCard({ label }) {
  return (
    <div className="gfp-card-img-placeholder">
      <Car size={28} />
      <span>{label}</span>
    </div>
  );
}

export function GaleriFotoPage() {
  const { library, uploadFoto, deleteFoto, updateFoto, replaceFoto, migrateGalleryPhotosToStorage } = useFotoLibrary();

  const [migrating, setMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');

  const handleMigration = async () => {
    if (migrating) return;
    if (!window.confirm('Jalankan migrasi Base64 ke Supabase Storage (bucket: vehicle-photos/gallery/)?')) return;

    setMigrating(true);
    setMigrationStatus('Memulai migrasi...');

    const res = await migrateGalleryPhotosToStorage((current, total, title) => {
      setMigrationStatus(`Migrating ${current}/${total}... (${title})`);
    });

    setMigrating(false);
    if (res.success) {
      const msg = `${res.successCount ?? res.count} foto berhasil dimigrasikan. ${res.skippedCount ? `(${res.skippedCount} foto terverifikasi di Storage)` : ''}`;
      setMigrationStatus(msg);
      alert(msg);
    } else {
      const errorMsg = res.error ? `Migrasi gagal: ${res.error}` : `Laporan Migrasi: ${res.successCount || 0} berhasil dimigrasikan, ${res.skippedCount || 0} terverifikasi ada di Storage, ${res.missingCount || 0} file hilang/tanpa binary, ${res.failedCount || 0} gagal upload.`;
      setMigrationStatus(errorMsg);
      alert(errorMsg);
    }
  };

  // Modal mode: 'add' | 'replace' | 'edit-meta'
  const [modalMode, setModalMode] = useState('add');
  const [editingFoto, setEditingFoto] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [formData, setFormData] = useState({ judul: '', keywords: '', tahun: '' });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Search query
  const [query, setQuery] = useState('');

  const filteredLibrary = query.trim()
    ? library.filter(
        (f) =>
          f.judul.toLowerCase().includes(query.toLowerCase()) ||
          f.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      )
    : library;

  // File handling & compression
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimum 20 MB.');
      return;
    }

    setError('');
    setCompressing(true);
    try {
      const result = await compressImage(file, { maxWidth: 1200, maxHeight: 900, quality: 0.8 });
      setPreviewData({ ...result, file });
      if (modalMode === 'add' && !formData.judul) {
        const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setFormData((f) => ({ ...f, judul: name }));
      }
    } catch (err) {
      setError(err.message || 'Gagal memproses gambar.');
    } finally {
      setCompressing(false);
    }
  }, [formData.judul, modalMode]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e) => handleFile(e.target.files?.[0]);

  // Open modals
  const openAdd = () => {
    setModalMode('add');
    setEditingFoto(null);
    setPreviewData(null);
    setFormData({ judul: '', keywords: '', tahun: '' });
    setError('');
    setIsModalOpen(true);
  };

  const openReplace = (foto) => {
    setModalMode('replace');
    setEditingFoto(foto);
    setPreviewData(null);
    setFormData({
      judul: foto.judul,
      keywords: foto.keywords.join(', '),
      tahun: foto.tahun === '-' ? '' : foto.tahun,
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditMeta = (foto) => {
    setModalMode('edit-meta');
    setEditingFoto(foto);
    const src = getFotoSrc(foto);
    setPreviewData(
      src
        ? {
            base64: src,
            originalSize: foto.originalSize ?? 0,
            compressedSize: foto.compressedSize ?? 0,
            readOnly: true,
          }
        : null
    );
    setFormData({
      judul: foto.judul,
      keywords: foto.keywords.join(', '),
      tahun: foto.tahun === '-' ? '' : foto.tahun,
    });
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFoto(null);
    setPreviewData(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save changes
  const handleSave = async () => {
    if (!formData.judul.trim()) {
      setError('Nama / Judul mobil wajib diisi.');
      return;
    }

    const keywords = formData.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    try {
      if (modalMode === 'add') {
        if (!previewData || !previewData.file) {
          setError('Pilih file foto terlebih dahulu.');
          return;
        }
        await uploadFoto(previewData.file, null, {
          judul: formData.judul.trim(),
          keywords,
          tahun: formData.tahun.trim() || '-',
        });
      } else if (modalMode === 'replace') {
        if (!previewData || !previewData.file) {
          setError('Pilih gambar pengganti terlebih dahulu.');
          return;
        }
        await replaceFoto(editingFoto.id, previewData.file, {
          judul: formData.judul.trim(),
          keywords,
          tahun: formData.tahun.trim() || '-',
        });
      } else if (modalMode === 'edit-meta') {
        await updateFoto(editingFoto.id, {
          judul: formData.judul.trim(),
          keywords,
          tahun: formData.tahun.trim() || '-',
        });
      }
      closeModal();
    } catch (err) {
      console.error('Save photo error:', err);
      setError(err.message || 'Gagal menyimpan data foto.');
    }
  };

  const handleDeleteFoto = async (id, judul) => {
    if (window.confirm(`Hapus foto "${judul}" dari galeri?`)) {
      try {
        await deleteFoto(id);
      } catch (err) {
        alert(`Gagal menghapus foto: ${err.message}`);
      }
    }
  };

  const modalTitle =
    modalMode === 'add'
      ? 'Upload Foto Mobil Baru'
      : modalMode === 'replace'
      ? `Ganti Foto: ${editingFoto?.judul}`
      : `Edit Info: ${editingFoto?.judul}`;

  const saveLabel = compressing
    ? 'Memproses...'
    : modalMode === 'add'
    ? 'Simpan ke Galeri'
    : modalMode === 'replace'
    ? 'Simpan Foto Baru'
    : 'Simpan Perubahan';

  return (
    <div className="gfp-page">
      <PageHeader
        title="Galeri Foto Mobil"
        description="Kelola dan upload foto mobil untuk digunakan saat menambah atau mengedit unit armada."
        action={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleMigration}
              disabled={migrating}
              title="Memindahkan foto Base64 di database ke Supabase Storage"
            >
              <RefreshCw size={15} className={migrating ? 'spin' : ''} />
              {migrating ? migrationStatus : 'Migrasikan Foto ke Storage'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <ImagePlus size={16} />
              Upload Foto Baru
            </button>
          </div>
        }
      />

      {/* Search & Info Bar */}
      <div className="gfp-toolbar">
        <div className="gfp-search-wrap">
          <Search size={16} className="gfp-search-icon" />
          <input
            className="gfp-search"
            placeholder="Cari foto mobil berdasarkan nama atau tag (avanza, brio, suv...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="gfp-clear" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="gfp-stats-badge">
          <Layers size={14} />
          <span>{filteredLibrary.length} Foto Tersedia</span>
        </div>
      </div>

      {/* Grid of Photos */}
      <div className="gfp-grid">
        {filteredLibrary.length === 0 ? (
          <div className="gfp-empty">
            <Car size={40} className="gfp-empty-icon" />
            <p className="gfp-empty-title">Tidak ada foto ditemukan</p>
            <p className="gfp-empty-desc">
              {query
                ? `Tidak ada foto yang cocok dengan "${query}".`
                : 'Belum ada foto mobil yang diupload.'}
            </p>
            {query ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setQuery('')}>
                Reset Pencarian
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <ImagePlus size={15} /> Upload Foto Pertama
              </button>
            )}
          </div>
        ) : (
          filteredLibrary.map((foto) => (
            <div key={foto.id} className="gfp-card">
              {/* Image Preview */}
              <div className="gfp-card-media">
                {getFotoSrc(foto) ? (
                  <img
                    src={getFotoSrc(foto)}
                    alt={foto.judul}
                    className="gfp-card-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`gfp-placeholder-wrapper ${getFotoSrc(foto) ? 'hidden-fallback' : ''}`}>
                  <CarPlaceholderCard label={foto.judul} />
                </div>
                {foto.compressedSize > 0 && (
                  <span className="gfp-size-badge">
                    {formatFileSize(foto.compressedSize)}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="gfp-card-body">
                <div className="gfp-card-title" title={foto.judul}>
                  {foto.judul}
                </div>
                <div className="gfp-card-year">
                  {foto.tahun !== '-' ? `Tahun ${foto.tahun}` : 'Semua Tahun'}
                </div>

                {/* Keywords */}
                <div className="gfp-card-tags">
                  {foto.keywords.slice(0, 3).map((kw, i) => (
                    <span key={i} className="gfp-tag">
                      {kw}
                    </span>
                  ))}
                  {foto.keywords.length > 3 && (
                    <span className="gfp-tag gfp-tag-more">
                      +{foto.keywords.length - 3}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="gfp-card-actions">
                  <button
                    className="gfp-action-btn"
                    onClick={() => openEditMeta(foto)}
                    title="Edit Judul & Tag"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="gfp-action-btn"
                    onClick={() => openReplace(foto)}
                    title="Ganti Foto"
                  >
                    <RefreshCw size={14} /> Ganti
                  </button>
                  <button
                    className="gfp-action-btn gfp-action-danger"
                    onClick={() => handleDeleteFoto(foto.id, foto.judul)}
                    title="Hapus Foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={modalTitle}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>
              Batal
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={compressing}
            >
              {saveLabel}
            </button>
          </>
        }
      >
        <div className="gfp-modal-body">
          {error && (
            <div className="gfp-alert-danger">
              <X size={16} /> {error}
            </div>
          )}

          {/* Upload Dropzone (for 'add' and 'replace' modes) */}
          {modalMode !== 'edit-meta' && (
            <div
              className={`gfp-dropzone ${dragOver ? 'gfp-dropzone-active' : ''} ${
                previewData ? 'gfp-dropzone-has-file' : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleInputChange}
              />

              {compressing ? (
                <div className="gfp-dropzone-loading">
                  <RefreshCw size={28} className="gfp-spin" />
                  <p>Mengompresi dan memproses gambar...</p>
                </div>
              ) : previewData ? (
                <div className="gfp-preview-wrap">
                  <img
                    src={previewData.base64}
                    alt="Preview"
                    className="gfp-preview-img"
                  />
                  <div className="gfp-preview-stats">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>
                      {formatFileSize(previewData.originalSize)} →{' '}
                      <strong>{formatFileSize(previewData.compressedSize)}</strong>
                    </span>
                    <span className="gfp-change-hint">(Klik untuk mengganti)</span>
                  </div>
                </div>
              ) : (
                <div className="gfp-dropzone-prompt">
                  <Upload size={32} className="gfp-dropzone-icon" />
                  <p className="gfp-dropzone-text">
                    <strong>Klik untuk pilih file</strong> atau seret gambar ke sini
                  </p>
                  <p className="gfp-dropzone-sub">
                    JPG, PNG, WEBP (Otomatis dikompresi kualitas tinggi)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className="form-group">
            <label className="form-label">
              Nama / Model Mobil <span className="text-danger">*</span>
            </label>
            <input
              className="form-input"
              placeholder="Contoh: Toyota Avanza Veloz 2023"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tahun / Generasi</label>
            <input
              className="form-input"
              placeholder="Contoh: 2022-2024"
              value={formData.tahun}
              onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Tag / Kata Kunci Pencarian (Pisahkan dengan koma)
            </label>
            <input
              className="form-input"
              placeholder="avanza, toyota, mpv, veloz, hitam"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
            <span className="subtext" style={{ fontSize: '11px', marginTop: '4px' }}>
              ✨ Tag ini memudahkan foto ditemukan otomatis saat memilih mobil di form booking & armada.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
