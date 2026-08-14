/**
 * useFotoLibrary.js
 * Custom hook — manages the global car photo library in localStorage.
 * Super Admin is the sole writer; Owner/Admin only reads.
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'rentra_foto_library';

/** Helper to extract image source string from various photo object formats */
export function getFotoSrc(foto) {
  if (!foto) return null;
  if (typeof foto === 'string') return foto;
  return foto.base64 || foto.url || foto.foto || foto.fotoUrl || foto.image || foto.imageUrl || null;
}

/** Seed data with high-res car image URLs */
const SEED_DATA = [
  {
    id: 'FOTO-SEED-001',
    judul: 'Toyota Avanza Gen 3',
    keywords: ['avanza', 'toyota', 'mpv', 'veloz'],
    tahun: '2022-2024',
    base64: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-10',
    originalSize: 512000,
    compressedSize: 128000,
  },
  {
    id: 'FOTO-SEED-002',
    judul: 'Toyota Innova Zenix Hybrid',
    keywords: ['innova', 'zenix', 'toyota', 'hybrid', 'mpv'],
    tahun: '2022-2025',
    base64: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-10',
    originalSize: 640000,
    compressedSize: 154000,
  },
  {
    id: 'FOTO-SEED-003',
    judul: 'Mitsubishi Xpander Cross',
    keywords: ['xpander', 'mitsubishi', 'cross', 'mpv'],
    tahun: '2021-2024',
    base64: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-11',
    originalSize: 580000,
    compressedSize: 142000,
  },
  {
    id: 'FOTO-SEED-004',
    judul: 'Honda Brio RS',
    keywords: ['brio', 'honda', 'rs', 'city car', 'hatchback'],
    tahun: '2020-2024',
    base64: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-12',
    originalSize: 490000,
    compressedSize: 118000,
  },
  {
    id: 'FOTO-SEED-005',
    judul: 'Toyota Fortuner VRZ',
    keywords: ['fortuner', 'toyota', 'suv', 'vrz', '4x4'],
    tahun: '2021-2025',
    base64: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-12',
    originalSize: 720000,
    compressedSize: 186000,
  },
  {
    id: 'FOTO-SEED-006',
    judul: 'Honda HR-V Turbo',
    keywords: ['hrv', 'hr-v', 'honda', 'suv', 'turbo', 'crossover'],
    tahun: '2022-2025',
    base64: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-13',
    originalSize: 610000,
    compressedSize: 148000,
  },
  {
    id: 'FOTO-SEED-007',
    judul: 'Suzuki Ertiga Hybrid',
    keywords: ['ertiga', 'suzuki', 'hybrid', 'mpv'],
    tahun: '2022-2024',
    base64: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-14',
    originalSize: 530000,
    compressedSize: 132000,
  },
  {
    id: 'FOTO-SEED-008',
    judul: 'Daihatsu Xenia',
    keywords: ['xenia', 'daihatsu', 'mpv', 'avanza'],
    tahun: '2021-2024',
    base64: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
    url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80',
    uploadedAt: '2026-01-15',
    originalSize: 500000,
    compressedSize: 124000,
  },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Auto-migrate stored entries that had null/empty image URLs
        let updated = false;
        const migrated = parsed.map((item) => {
          const imgSrc = getFotoSrc(item);
          if (!imgSrc) {
            const seedMatch = SEED_DATA.find((s) => s.id === item.id || s.judul.toLowerCase() === item.judul?.toLowerCase());
            if (seedMatch) {
              updated = true;
              return {
                ...item,
                base64: seedMatch.base64,
                url: seedMatch.url,
              };
            }
          }
          return item;
        });

        if (updated) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
        return parsed;
      }
    }
  } catch (_) { /* ignore parse errors */ }
  // First time — seed with initial data containing photo URLs
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
  return SEED_DATA;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('Penyimpanan penuh. Hapus beberapa foto sebelum menambah yang baru.');
    }
    return false;
  }
}

export function useFotoLibrary() {
  const [library, setLibrary] = useState(() => loadFromStorage());

  /** Add a new photo entry */
  const addFoto = useCallback((newFoto) => {
    setLibrary((prev) => {
      const updated = [newFoto, ...prev];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  /** Delete a photo by id */
  const deleteFoto = useCallback((id) => {
    setLibrary((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  /** Update metadata of an existing photo */
  const updateFoto = useCallback((id, patch) => {
    setLibrary((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, ...patch } : f));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  /**
   * Search library by keyword string.
   * Matches against judul and keywords array.
   */
  const searchFoto = useCallback(
    (query = '') => {
      if (!query.trim()) return library;
      const q = query.toLowerCase();
      return library.filter(
        (f) =>
          f.judul.toLowerCase().includes(q) ||
          f.keywords.some((k) => k.toLowerCase().includes(q)),
      );
    },
    [library],
  );

  /**
   * Get photos that match a car name (smart keyword extraction).
   * Splits the car name into words and checks each against keywords.
   */
  const getMatchingPhotos = useCallback(
    (carName = '') => {
      if (!carName.trim()) return library;
      const words = carName.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (words.length === 0) return library;

      return library
        .map((f) => {
          const score = words.reduce((acc, word) => {
            const inJudul = f.judul.toLowerCase().includes(word) ? 2 : 0;
            const inKeywords = f.keywords.some((k) => k.toLowerCase().includes(word)) ? 1 : 0;
            return acc + inJudul + inKeywords;
          }, 0);
          return { ...f, _score: score };
        })
        .filter((f) => f._score > 0)
        .sort((a, b) => b._score - a._score);
    },
    [library],
  );

  return { library, addFoto, deleteFoto, updateFoto, searchFoto, getMatchingPhotos };
}
