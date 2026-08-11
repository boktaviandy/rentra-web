/**
 * useFotoLibrary.js
 * Custom hook — manages the global car photo library in localStorage.
 * Super Admin is the sole writer; Owner/Admin only reads.
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'rentra_foto_library';

/** Seed data so the library is not empty on first load */
const SEED_DATA = [
  {
    id: 'FOTO-SEED-001',
    judul: 'Toyota Avanza Gen 3',
    keywords: ['avanza', 'toyota', 'mpv', 'veloz'],
    tahun: '2022-2024',
    base64: null, // null = use placeholder SVG
    uploadedAt: '2026-01-10',
    originalSize: 0,
    compressedSize: 0,
  },
  {
    id: 'FOTO-SEED-002',
    judul: 'Toyota Innova Zenix Hybrid',
    keywords: ['innova', 'zenix', 'toyota', 'hybrid', 'mpv'],
    tahun: '2022-2025',
    base64: null,
    uploadedAt: '2026-01-10',
    originalSize: 0,
    compressedSize: 0,
  },
  {
    id: 'FOTO-SEED-003',
    judul: 'Mitsubishi Xpander Cross',
    keywords: ['xpander', 'mitsubishi', 'cross', 'mpv'],
    tahun: '2021-2024',
    base64: null,
    uploadedAt: '2026-01-11',
    originalSize: 0,
    compressedSize: 0,
  },
  {
    id: 'FOTO-SEED-004',
    judul: 'Honda Brio RS',
    keywords: ['brio', 'honda', 'rs', 'city car', 'hatchback'],
    tahun: '2020-2024',
    base64: null,
    uploadedAt: '2026-01-12',
    originalSize: 0,
    compressedSize: 0,
  },
  {
    id: 'FOTO-SEED-005',
    judul: 'Toyota Fortuner VRZ',
    keywords: ['fortuner', 'toyota', 'suv', 'vrz', '4x4'],
    tahun: '2021-2025',
    base64: null,
    uploadedAt: '2026-01-12',
    originalSize: 0,
    compressedSize: 0,
  },
  {
    id: 'FOTO-SEED-006',
    judul: 'Honda HR-V Turbo',
    keywords: ['hrv', 'hr-v', 'honda', 'suv', 'turbo', 'crossover'],
    tahun: '2022-2025',
    base64: null,
    uploadedAt: '2026-01-13',
    originalSize: 0,
    compressedSize: 0,
  },
  {
    id: 'FOTO-SEED-007',
    judul: 'Suzuki Ertiga Hybrid',
    keywords: ['ertiga', 'suzuki', 'hybrid', 'mpv'],
    tahun: '2022-2024',
    base64: null,
    uploadedAt: '2026-01-14',
    originalSize: 0,
    compressedSize: 0,
  },
  {
    id: 'FOTO-SEED-008',
    judul: 'Daihatsu Xenia',
    keywords: ['xenia', 'daihatsu', 'mpv', 'avanza'],
    tahun: '2021-2024',
    base64: null,
    uploadedAt: '2026-01-15',
    originalSize: 0,
    compressedSize: 0,
  },
];

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore parse errors */ }
  // First time — seed with placeholder entries
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
