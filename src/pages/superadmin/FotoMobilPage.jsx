import React, { useState, useRef, useCallback } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import {
  Upload, Trash2, Search, ImagePlus, Car, AlertCircle,
  CheckCircle2, X, Tag, Info, RefreshCw, Pencil
} from 'lucide-react';
import { useFotoLibrary } from '../../hooks/useFotoLibrary';
import { compressImage, formatFileSize } from '../../utils/imageCompressor';
import './FotoMobilPage.css';

function generateId() {
  return `FOTO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function CarPlaceholderCard({ label }) {
  return (
    <div className="fm-card-img-placeholder">
      <Car size={28} />
      <span>{label}</span>
    </div>
  );
}

export function FotoMobilPage() {
  const { library, addFoto, deleteFoto, updateFoto } = useFotoLibrary();

  // Modal mode: 'add' | 'replace' | 'edit-meta'
  const [modalMode, setModalMode] = useState('add');
  const [editingFoto, setEditingFoto] = useState(null); // the foto being edited/replaced

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [formData, setFormData] = useState({ judul: '', keywords: '', tahun: '' });
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Search
  const [query, setQuery] = useState('');

  const filteredLibrary = query.trim()
    ? library.filter(
        (f) =>
          f.judul.toLowerCase().includes(query.toLowerCase()) ||
          f.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
      )
    : library;

  // ── File handling ──────────────────────────────────────────────────────────
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
      const result = await compressImage(file, { maxWidth: 800, maxHeight: 600, quality: 0.75 });
      setPreviewData(result);
      // Auto-fill judul only when adding new & judul is empty
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

  // ── Open modals ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setModalMode('add');
    setEditingFoto(null);
    setPreviewData(null);
    setFormData({ judul: '', keywords: '', tahun: '' });
    setError('');
    setIsModalOpen(true);
  };

  /** Ganti foto gambarnya saja, metadata tetap bisa diedit */
  const openReplace = (foto) => {
    setModalMode('replace');
    setEditingFoto(foto);
    setPreviewData(null); // will be filled when file chosen
    setFormData({
      judul: foto.judul,
      keywords: foto.keywords.join(', '),
      tahun: foto.tahun === '-' ? '' : foto.tahun,
    });
    setError('');
    setIsModalOpen(true);
  };

  /** Edit metadata only (judul, keywords, tahun) tanpa ganti gambar */
  const openEditMeta = (foto) => {
    setModalMode('edit-meta');
    setEditingFoto(foto);
    // Show existing photo as preview reference (read-only)
    setPreviewData(foto.base64 ? { base64: foto.base64, originalSize: foto.originalSize ?? 0, compressedSize: foto.compressedSize ?? 0, readOnly: true } : null);
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

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!formData.judul.trim()) { setError('Judul wajib diisi.'); return; }

    const keywords = formData.keywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (modalMode === 'add') {
      if (!previewData) { setError('Pilih gambar terlebih dahulu.'); return; }
      addFoto({
        id: generateId(),
        judul: formData.judul.trim(),
        keywords,
        tahun: formData.tahun.trim() || '-',
        base64: previewData.base64,
        originalSize: previewData.originalSize,
        compressedSize: previewData.compressedSize,
        uploadedAt: new Date().toISOString().slice(0, 10),
      });

    } else if (modalMode === 'replace') {
      if (!previewData) { setError('Pilih gambar pengganti terlebih dahulu.'); return; }
      updateFoto(editingFoto.id, {
        judul: formData.judul.trim(),
        keywords,
        tahun: formData.tahun.trim() || '-',
        base64: previewData.base64,
        originalSize: previewData.originalSize,
        compressedSize: previewData.compressedSize,
        uploadedAt: new Date().toISOString().slice(0, 10),
      });

    } else if (modalMode === 'edit-meta') {
      // Only update metadata, keep existing base64
      updateFoto(editingFoto.id, {
        judul: formData.judul.trim(),
        keywords,
        tahun: formData.tahun.trim() || '-',
      });
    }

    closeModal();
  };

  const handleDeleteFoto = (id, judul) => {
    if (window.confirm(`Hapus foto "${judul}" dari library?\nFoto yang sudah dipakai tenant tidak akan terpengaruh.`)) {
      deleteFoto(id);
    }
  };

  // ── Modal title ────────────────────────────────────────────────────────────
  const modalTitle = modalMode === 'add'
    ? 'Upload Foto Mobil Baru'
    : modalMode === 'replace'
    ? `Ganti Foto: ${editingFoto?.judul}`
    : `Edit Info: ${editingFoto?.judul}`;

  const saveLabel = compressing
    ? 'Memproses...'
    : modalMode === 'add'
    ? 'Simpan ke Library'
    : modalMode === 'replace'
    ? 'Ganti Foto'
    : 'Simpan Perubahan';

  const showDropzone = modalMode !== 'edit-meta';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fm-page">
      <PageHeader
        title="Library Foto Mobil"
        description={`${library.length} foto tersedia untuk digunakan oleh semua tenant.`}
        action={
          <button className="btn btn-primary" onClick={openAdd}>
            <ImagePlus size={16} />
            Upload Foto Baru
          </button>
        }
      />

      {/* Info banner */}
      <div className="fm-info-banner">
        <Info size={16} />
        <span>
          Foto yang diupload di sini tersedia untuk <strong>semua tenant</strong>.
          Gunakan keyword yang tepat agar tenant mudah menemukan foto berdasarkan nama mobil.
          Hover kartu untuk melihat pilihan <strong>Ganti Foto</strong> atau <strong>Edit Info</strong>.
        </span>
      </div>

      {/* Search */}
      <div className="fm-search-wrap">
        <Search size={16} className="fm-search-icon" />
        <input
          className="fm-search"
          placeholder="Cari berdasarkan judul atau keyword (avanza, suv, mpv...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="fm-clear" onClick={() => setQuery('')}><X size={14} /></button>
        )}
        <span className="fm-count">{filteredLibrary.length} foto</span>
      </div>

      {/* Photo Grid */}
      {filteredLibrary.length === 0 ? (
        <div className="fm-empty">
          <Car size={48} />
          <h3>{library.length === 0 ? 'Library masih kosong' : 'Tidak ada hasil'}</h3>
          <p>{library.length === 0 ? 'Upload foto pertama untuk mulai mengisi library.' : 'Coba kata kunci lain.'}</p>
          {library.length === 0 && (
            <button className="btn btn-primary" onClick={openAdd}>
              <ImagePlus size={16} /> Upload Foto Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="fm-grid">
          {filteredLibrary.map((foto) => (
            <div key={foto.id} className="fm-card">
              {/* Image / placeholder */}
              {foto.base64 ? (
                <img src={foto.base64} alt={foto.judul} className="fm-card-img" />
              ) : (
                <CarPlaceholderCard label={foto.judul} />
              )}

              {/* Card body */}
              <div className="fm-card-body">
                <div className="fm-card-title">{foto.judul}</div>
                <div className="fm-card-year">{foto.tahun}</div>
                <div className="fm-card-tags">
                  <Tag size={11} />
                  {foto.keywords.slice(0, 4).map((kw) => (
                    <span key={kw} className="fm-tag">{kw}</span>
                  ))}
                  {foto.keywords.length > 4 && (
                    <span className="fm-tag fm-tag-more">+{foto.keywords.length - 4}</span>
                  )}
                </div>
                <div className="fm-card-meta">
                  {foto.compressedSize > 0 && (
                    <span className="fm-card-size">{formatFileSize(foto.compressedSize)}</span>
                  )}
                  <span className="fm-card-date">{foto.uploadedAt}</span>
                </div>
              </div>

              {/* Hover action overlay */}
              <div className="fm-card-overlay">
                <button
                  className="fm-overlay-btn fm-overlay-replace"
                  title="Ganti foto gambar"
                  onClick={() => openReplace(foto)}
                >
                  <RefreshCw size={14} />
                  <span>Ganti Foto</span>
                </button>
                <button
                  className="fm-overlay-btn fm-overlay-edit"
                  title="Edit judul & keyword"
                  onClick={() => openEditMeta(foto)}
                >
                  <Pencil size={14} />
                  <span>Edit Info</span>
                </button>
                <button
                  className="fm-overlay-btn fm-overlay-delete"
                  title="Hapus foto"
                  onClick={() => handleDeleteFoto(foto.id, foto.judul)}
                >
                  <Trash2 size={14} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified Upload / Edit Modal */}
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
              disabled={compressing || (showDropzone && !previewData && modalMode !== 'edit-meta')}
            >
              {saveLabel}
            </button>
          </>
        }
      >
        <div className="fm-upload-form">

          {/* Mode indicator badge */}
          {modalMode !== 'add' && (
            <div className={`fm-mode-badge ${modalMode === 'replace' ? 'fm-mode-replace' : 'fm-mode-edit'}`}>
              {modalMode === 'replace' ? (
                <><RefreshCw size={13} /> Menggantikan foto untuk jenis mobil ini</>
              ) : (
                <><Pencil size={13} /> Mengedit informasi — foto tidak berubah</>
              )}
            </div>
          )}

          {/* Drop Zone — shown for 'add' and 'replace' modes */}
          {showDropzone && (
            <div
              className={`fm-dropzone ${dragOver ? 'fm-dropzone-over' : ''} ${previewData ? 'fm-dropzone-done' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="fm-file-input"
                onChange={handleInputChange}
              />

              {compressing ? (
                <div className="fm-compressing">
                  <div className="fm-spinner" />
                  <span>Mengompres gambar...</span>
                </div>
              ) : previewData ? (
                <div className="fm-preview-wrap">
                  <img src={previewData.base64} alt="Preview" className="fm-preview-img" />
                  <div className="fm-preview-info">
                    <div className="fm-size-compare">
                      <div className="fm-size-badge fm-size-before">
                        Sebelum: {formatFileSize(previewData.originalSize)}
                      </div>
                      <span className="fm-size-arrow">→</span>
                      <div className="fm-size-badge fm-size-after">
                        <CheckCircle2 size={12} />
                        Sesudah: {formatFileSize(previewData.compressedSize)}
                      </div>
                    </div>
                    <span className="fm-preview-change">Klik untuk ganti gambar</span>
                  </div>
                </div>
              ) : (
                <div className="fm-dropzone-idle">
                  {modalMode === 'replace' && editingFoto?.base64 ? (
                    <>
                      {/* Show current photo as reference */}
                      <div className="fm-current-photo-ref">
                        <img src={editingFoto.base64} alt="Foto saat ini" className="fm-current-ref-img" />
                        <span className="fm-current-ref-label">Foto saat ini</span>
                      </div>
                      <div className="fm-dropzone-replace-hint">
                        <RefreshCw size={20} className="fm-upload-icon" />
                        <span className="fm-dropzone-title">Drag & drop foto baru di sini</span>
                        <span className="fm-dropzone-hint">atau klik untuk memilih file pengganti</span>
                        <span className="fm-dropzone-types">JPG • PNG • WEBP • Maks. 20 MB</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={32} className="fm-upload-icon" />
                      <span className="fm-dropzone-title">Drag & drop foto di sini</span>
                      <span className="fm-dropzone-hint">atau klik untuk memilih file</span>
                      <span className="fm-dropzone-types">JPG • PNG • WEBP • Maks. 20 MB</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Edit-meta: show current photo read-only */}
          {modalMode === 'edit-meta' && editingFoto?.base64 && (
            <div className="fm-meta-preview">
              <img src={editingFoto.base64} alt={editingFoto.judul} className="fm-meta-preview-img" />
              <span className="fm-meta-preview-label">Foto tidak berubah</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="fm-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Metadata */}
          <div className="form-group">
            <label className="form-label">
              Judul <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Toyota Avanza Gen 3 2023"
              value={formData.judul}
              onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Keywords
              <span className="fm-label-hint"> (pisahkan dengan koma)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="avanza, toyota, mpv, veloz"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            />
            <p className="form-hint">
              Kata kunci ini digunakan agar tenant mudah menemukan foto saat mengetik nama mobil.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Rentang Tahun</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: 2021-2024"
              value={formData.tahun}
              onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
