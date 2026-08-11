import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, CheckCircle2, ImageOff, Car } from 'lucide-react';
import { useFotoLibrary } from '../../hooks/useFotoLibrary';
import './PhotoPicker.css';

/** Placeholder SVG for seed photos without a real base64 */
function CarPlaceholder({ label }) {
  return (
    <div className="pp-placeholder">
      <Car size={32} className="pp-placeholder-icon" />
      <span className="pp-placeholder-label">{label}</span>
    </div>
  );
}

/**
 * PhotoPicker — modal for Owner/Admin to pick a car photo from the library.
 * @param {object}   props
 * @param {boolean}  props.isOpen      - whether modal is visible
 * @param {function} props.onClose     - called when modal dismissed
 * @param {function} props.onSelect    - called with the base64 string of chosen photo
 * @param {string}   props.carName     - current car name from form (used for smart filter)
 * @param {string}   props.currentFoto - currently selected foto (highlight indicator)
 */
export function PhotoPicker({ isOpen, onClose, onSelect, carName = '', currentFoto = '' }) {
  const { library, getMatchingPhotos, searchFoto } = useFotoLibrary();
  const [query, setQuery] = useState('');

  const displayList = useMemo(() => {
    if (query.trim()) return searchFoto(query);
    if (carName.trim()) return getMatchingPhotos(carName);
    return library;
  }, [query, carName, library, searchFoto, getMatchingPhotos]);

  const hasResults = displayList.length > 0;
  const isFiltered = query.trim() !== '' || carName.trim() !== '';

  if (!isOpen) return null;

  return createPortal(
    <div className="pp-overlay" onClick={onClose}>
      <div className="pp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pp-header">
          <div>
            <h3 className="pp-title">Pilih Foto Mobil</h3>
            {carName && (
              <p className="pp-subtitle">
                Menampilkan hasil relevan untuk: <strong>"{carName}"</strong>
              </p>
            )}
          </div>
          <button className="pp-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="pp-search-wrap">
          <Search size={16} className="pp-search-icon" />
          <input
            className="pp-search"
            placeholder="Cari berdasarkan nama atau keyword (avanza, suv, mpv...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="pp-clear" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Info bar */}
        <div className="pp-info-bar">
          <span>{displayList.length} foto{isFiltered ? ' ditemukan' : ' tersedia'}</span>
          {carName && !query && (
            <span className="pp-auto-tag">
              ✨ Auto-filter dari nama mobil
            </span>
          )}
        </div>

        {/* Grid */}
        <div className="pp-grid">
          {hasResults ? (
            displayList.map((foto) => {
              const isSelected = currentFoto === foto.base64 || currentFoto === foto.id;
              return (
                <button
                  key={foto.id}
                  className={`pp-card ${isSelected ? 'pp-card-selected' : ''}`}
                  onClick={() => {
                    onSelect(foto.base64, foto.id);
                    onClose();
                  }}
                  title={foto.judul}
                >
                  {foto.base64 ? (
                    <img src={foto.base64} alt={foto.judul} className="pp-card-img" />
                  ) : (
                    <CarPlaceholder label={foto.judul} />
                  )}
                  {isSelected && (
                    <div className="pp-selected-badge">
                      <CheckCircle2 size={18} />
                    </div>
                  )}
                  <div className="pp-card-meta">
                    <span className="pp-card-title">{foto.judul}</span>
                    <span className="pp-card-year">{foto.tahun}</span>
                  </div>
                  <div className="pp-card-tags">
                    {foto.keywords.slice(0, 3).map((kw) => (
                      <span key={kw} className="pp-tag">{kw}</span>
                    ))}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="pp-empty">
              <ImageOff size={40} />
              <p>
                {library.length === 0
                  ? 'Library foto masih kosong. Minta Super Admin untuk menambahkan foto.'
                  : 'Tidak ada foto yang cocok. Coba kata kunci lain.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pp-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          {library.length === 0 && (
            <span className="pp-footer-hint">
              Hubungi Super Admin untuk mengisi library foto
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
