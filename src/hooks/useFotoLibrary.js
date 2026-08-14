/**
 * useFotoLibrary.js
 * Supabase-backed Car Photo Library Hook.
 * Single Source of Truth: Supabase PostgreSQL (`vehicle_photos`) + Supabase Storage (`vehicle-photos` bucket).
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageCompressor';

const BUCKET_NAME = 'vehicle-photos';
const LEGACY_STORAGE_KEY = 'rentra_foto_library';
const MIGRATION_FLAG_KEY = 'rentra_foto_library_migrated_v1';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/** Helper to extract image source string from various photo object formats */
export function getFotoSrc(foto) {
  if (!foto) return null;
  if (typeof foto === 'string') return foto;
  return foto.public_url || foto.url || foto.fotoUrl || foto.base64 || foto.foto || foto.image || foto.imageUrl || null;
}

const SUPABASE_STORAGE_BASE = 'https://rgkaopbkbhsikjdkemgy.supabase.co/storage/v1/object/public/vehicle-photos';

/** Seed data for initial library initialization if database is clean */
const SEED_DATA = [
  {
    id: 'FOTO-SEED-001',
    vehicle_id: 'MOB-001',
    title: 'Toyota Avanza Gen 3',
    tags: ['avanza', 'toyota', 'mpv', 'veloz'],
    tahun: '2022-2024',
    storage_path: 'vehicles/MOB-001/FOTO-SEED-001.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-001/FOTO-SEED-001.webp`,
    originalSize: 512000,
    compressedSize: 128000,
  },
  {
    id: 'FOTO-SEED-002',
    vehicle_id: 'MOB-002',
    title: 'Toyota Innova Zenix Hybrid',
    tags: ['innova', 'zenix', 'toyota', 'hybrid', 'mpv'],
    tahun: '2022-2025',
    storage_path: 'vehicles/MOB-002/FOTO-SEED-002.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-002/FOTO-SEED-002.webp`,
    originalSize: 640000,
    compressedSize: 154000,
  },
  {
    id: 'FOTO-SEED-003',
    vehicle_id: 'MOB-003',
    title: 'Mitsubishi Xpander Cross',
    tags: ['xpander', 'mitsubishi', 'cross', 'mpv'],
    tahun: '2021-2024',
    storage_path: 'vehicles/MOB-003/FOTO-SEED-003.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-003/FOTO-SEED-003.webp`,
    originalSize: 580000,
    compressedSize: 142000,
  },
  {
    id: 'FOTO-SEED-004',
    vehicle_id: 'MOB-004',
    title: 'Honda Brio RS',
    tags: ['brio', 'honda', 'rs', 'city car', 'hatchback'],
    tahun: '2020-2024',
    storage_path: 'vehicles/MOB-004/FOTO-SEED-004.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-004/FOTO-SEED-004.webp`,
    originalSize: 490000,
    compressedSize: 118000,
  },
  {
    id: 'FOTO-SEED-005',
    vehicle_id: 'MOB-005',
    title: 'Toyota Fortuner VRZ',
    tags: ['fortuner', 'toyota', 'suv', 'vrz', '4x4'],
    tahun: '2021-2025',
    storage_path: 'vehicles/MOB-005/FOTO-SEED-005.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-005/FOTO-SEED-005.webp`,
    originalSize: 720000,
    compressedSize: 186000,
  },
  {
    id: 'FOTO-SEED-006',
    vehicle_id: 'MOB-006',
    title: 'Honda HR-V Turbo',
    tags: ['hrv', 'hr-v', 'honda', 'suv', 'turbo', 'crossover'],
    tahun: '2022-2025',
    storage_path: 'vehicles/MOB-006/FOTO-SEED-006.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-006/FOTO-SEED-006.webp`,
    originalSize: 610000,
    compressedSize: 148000,
  },
  {
    id: 'FOTO-SEED-007',
    vehicle_id: 'MOB-007',
    title: 'Suzuki Ertiga Hybrid',
    tags: ['ertiga', 'suzuki', 'hybrid', 'mpv'],
    tahun: '2022-2024',
    storage_path: 'vehicles/MOB-007/FOTO-SEED-007.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-007/FOTO-SEED-007.webp`,
    originalSize: 530000,
    compressedSize: 132000,
  },
  {
    id: 'FOTO-SEED-008',
    vehicle_id: 'MOB-008',
    title: 'Daihatsu Xenia',
    tags: ['xenia', 'daihatsu', 'mpv', 'avanza'],
    tahun: '2021-2024',
    storage_path: 'vehicles/MOB-008/FOTO-SEED-008.webp',
    public_url: `${SUPABASE_STORAGE_BASE}/vehicles/MOB-008/FOTO-SEED-008.webp`,
    originalSize: 500000,
    compressedSize: 124000,
  },
];

/** Convert base64 Data URL to Blob helper */
function dataURLtoBlob(dataurl) {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) return null;
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function useFotoLibrary() {
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Map Supabase DB row to standard photo object */
  const mapDbRow = (row) => {
    const seedMatch = SEED_DATA.find((s) => s.id === row.id || s.title?.toLowerCase() === row.title?.toLowerCase());
    const finalVehicleId = row.vehicle_id || seedMatch?.vehicle_id || null;
    const finalStoragePath = (row.storage_path && !row.storage_path.startsWith('unassigned/'))
      ? row.storage_path
      : (seedMatch?.storage_path || `vehicles/${finalVehicleId || 'unassigned'}/${row.id}.webp`);
    const finalPublicUrl = (row.public_url && !row.public_url.startsWith('data:image'))
      ? row.public_url
      : (seedMatch?.public_url || `${SUPABASE_STORAGE_BASE}/${finalStoragePath}`);

    return {
      id: row.id,
      vehicle_id: finalVehicleId,
      judul: row.title || seedMatch?.title || 'Foto Mobil',
      title: row.title || seedMatch?.title || 'Foto Mobil',
      keywords: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : (seedMatch?.tags || []),
      tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : (seedMatch?.tags || []),
      tahun: row.tahun || seedMatch?.tahun || '-',
      public_url: finalPublicUrl,
      url: finalPublicUrl,
      storage_path: finalStoragePath,
      is_primary: !!row.is_primary,
      originalSize: row.originalSize || seedMatch?.originalSize || 0,
      compressedSize: row.compressedSize || seedMatch?.compressedSize || 0,
      created_at: row.created_at,
      uploadedAt: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    };
  };

  /** Load photos from Supabase PostgreSQL */
  const loadFotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: dbRows, error: fetchErr } = await supabase
        .from('vehicle_photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) {
        console.error('[Supabase vehicle_photos Fetch Error]:', fetchErr);
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      if (dbRows && dbRows.length > 0) {
        const processedRows = dbRows.map((row) => {
          const match = SEED_DATA.find((s) => s.id === row.id || s.title?.toLowerCase() === row.title?.toLowerCase());
          if (match) {
            return {
              ...row,
              vehicle_id: row.vehicle_id || match.vehicle_id,
              storage_path: (row.storage_path && !row.storage_path.startsWith('unassigned/')) ? row.storage_path : match.storage_path,
              public_url: (row.public_url && !row.public_url.startsWith('data:image')) ? row.public_url : match.public_url,
            };
          }
          return row;
        });
        setFotos(processedRows.map(mapDbRow));
        setLoading(false);
        return;
      }

      // If database is clean/empty, insert initial seed records into Supabase PostgreSQL
      const seedInsertPayload = SEED_DATA.map((seed) => ({
        id: seed.id,
        title: seed.title,
        tags: seed.tags,
        tahun: seed.tahun,
        public_url: seed.public_url,
        storage_path: seed.storage_path,
        originalSize: seed.originalSize,
        compressedSize: seed.compressedSize,
        is_primary: false,
      }));

      const { data: insertedSeeds, error: seedErr } = await supabase
        .from('vehicle_photos')
        .upsert(seedInsertPayload)
        .select('*');

      if (!seedErr && insertedSeeds) {
        setFotos(insertedSeeds.map(mapDbRow));
      } else {
        setFotos(SEED_DATA.map(mapDbRow));
      }
    } catch (err) {
      console.error('Failed to load vehicle_photos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Migration from legacy localStorage to Supabase Storage + PostgreSQL */
  useEffect(() => {
    async function runMigration() {
      await loadFotos();

      const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
      if (isMigrated === 'true') return;

      try {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (!legacyRaw) {
          localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
          return;
        }

        const legacyItems = JSON.parse(legacyRaw);
        if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
          localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
          return;
        }

        // Fetch current DB entries to avoid duplicate uploads
        const { data: existingRows } = await supabase
          .from('vehicle_photos')
          .select('id, title, storage_path');

        const existingIds = new Set((existingRows || []).map((r) => r.id));
        const existingTitles = new Set((existingRows || []).map((r) => r.title?.toLowerCase()));

        for (const item of legacyItems) {
          if (existingIds.has(item.id) || existingTitles.has(item.judul?.toLowerCase())) {
            continue;
          }

          const imgSrc = getFotoSrc(item);
          if (!imgSrc) continue;

          let publicUrl = imgSrc;
          let storagePath = `legacy/${item.id || Date.now()}.webp`;

          if (imgSrc.startsWith('data:')) {
            const blob = dataURLtoBlob(imgSrc);
            if (blob) {
              const { data: stData, error: stErr } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, blob, { contentType: blob.type || 'image/webp', upsert: true });

              if (!stErr && stData) {
                const { data: pUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
                if (pUrl?.publicUrl) publicUrl = pUrl.publicUrl;
              }
            }
          }

          const record = {
            id: item.id || `FOTO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            title: item.judul || 'Foto Mobil',
            tags: item.keywords || [],
            tahun: item.tahun || '-',
            public_url: publicUrl,
            storage_path: storagePath,
            originalSize: item.originalSize || 0,
            compressedSize: item.compressedSize || 0,
            is_primary: false,
          };

          await supabase.from('vehicle_photos').upsert([record]);
        }

        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
        await loadFotos();
      } catch (err) {
        console.error('[Legacy Migration Error]:', err);
      }
    }

    runMigration();
  }, [loadFotos]);

  /** Validate File before upload */
  const validateFile = (file) => {
    if (!file) throw new Error('File tidak ditemukan.');
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`Tipe file "${file.type}" tidak didukung. Harap upload gambar JPEG, PNG, WebP, atau AVIF.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Ukuran file "${(file.size / (1024 * 1024)).toFixed(1)} MB" melebihi batas maksimum 5 MB.`);
    }
  };

  /** Upload photo to Supabase Storage and insert row into vehicle_photos PostgreSQL table */
  const uploadFoto = useCallback(async (file, vehicleId = null, metadata = {}) => {
    validateFile(file);

    // 1. Compress image to WebP/JPEG
    const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 900, quality: 0.8 });
    const blob = dataURLtoBlob(compressed.base64) || file;

    const uniqueId = `FOTO-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
    const storagePath = vehicleId ? `vehicles/${vehicleId}/${filename}` : `unassigned/${filename}`;

    // 2. Upload to Supabase Storage
    const { data: stData, error: stErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, blob, { contentType: 'image/webp', upsert: true });

    let publicUrl = compressed.base64;
    if (!stErr) {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
    } else {
      console.warn('[Supabase Storage Upload Warning]:', stErr.message);
    }

    // 3. Insert metadata into vehicle_photos PostgreSQL table
    const tags = Array.isArray(metadata.keywords)
      ? metadata.keywords
      : typeof metadata.keywords === 'string'
      ? metadata.keywords.split(',').map((s) => s.trim()).filter(Boolean)
      : Array.isArray(metadata.tags)
      ? metadata.tags
      : [];

    const record = {
      id: uniqueId,
      vehicle_id: vehicleId || null,
      storage_path: storagePath,
      public_url: publicUrl,
      title: metadata.judul || metadata.title || file.name.replace(/\.[^.]+$/, ''),
      tags,
      tahun: metadata.tahun || '-',
      is_primary: !!metadata.is_primary,
      originalSize: file.size,
      compressedSize: compressed.compressedSize,
    };

    const { data: inserted, error: dbErr } = await supabase
      .from('vehicle_photos')
      .insert([record])
      .select('*');

    if (dbErr) {
      console.error('[Supabase DB Insert Error]:', dbErr);
      // Cleanup storage file on DB error to avoid orphan files
      if (!stErr) {
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
      }
      throw new Error(`Gagal menyimpan data foto ke database: ${dbErr.message}`);
    }

    await loadFotos();
    return inserted?.[0] ? mapDbRow(inserted[0]) : mapDbRow(record);
  }, [loadFotos]);

  /** Delete a photo record and its corresponding Supabase Storage object */
  const deleteFoto = useCallback(async (id) => {
    const target = fotos.find((f) => f.id === id);
    if (!target) return;

    // 1. Delete object from Supabase Storage if storage_path is present
    if (target.storage_path && !target.storage_path.startsWith('seed/')) {
      const { error: stErr } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([target.storage_path]);

      if (stErr) {
        console.warn('[Supabase Storage Delete Warning]:', stErr.message);
      }
    }

    // 2. Delete metadata row from PostgreSQL vehicle_photos
    const { error: dbErr } = await supabase
      .from('vehicle_photos')
      .delete()
      .eq('id', id);

    if (dbErr) {
      console.error('[Supabase DB Delete Error]:', dbErr);
      throw new Error(`Gagal menghapus foto dari database: ${dbErr.message}`);
    }

    await loadFotos();
  }, [fotos, loadFotos]);

  /** Update photo metadata (title, tags, vehicle_id, is_primary) */
  const updateFoto = useCallback(async (id, patch) => {
    const payload = {};
    if (patch.judul !== undefined || patch.title !== undefined) {
      payload.title = patch.judul ?? patch.title;
    }
    if (patch.keywords !== undefined || patch.tags !== undefined) {
      payload.tags = Array.isArray(patch.keywords)
        ? patch.keywords
        : Array.isArray(patch.tags)
        ? patch.tags
        : typeof patch.keywords === 'string'
        ? patch.keywords.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (patch.tahun !== undefined) payload.tahun = patch.tahun;
    if (patch.vehicle_id !== undefined) payload.vehicle_id = patch.vehicle_id;
    if (patch.is_primary !== undefined) payload.is_primary = !!patch.is_primary;

    const { error: dbErr } = await supabase
      .from('vehicle_photos')
      .update(payload)
      .eq('id', id);

    if (dbErr) {
      console.error('[Supabase DB Update Error]:', dbErr);
      throw new Error(`Gagal memperbarui info foto: ${dbErr.message}`);
    }

    await loadFotos();
  }, [loadFotos]);

  /** Replace an existing photo file with a new image file */
  const replaceFoto = useCallback(async (id, newFile, metadata = {}) => {
    validateFile(newFile);
    const target = fotos.find((f) => f.id === id);
    if (!target) throw new Error('Foto yang akan diganti tidak ditemukan.');

    // 1. Upload new image
    const compressed = await compressImage(newFile, { maxWidth: 1200, maxHeight: 900, quality: 0.8 });
    const blob = dataURLtoBlob(compressed.base64) || newFile;

    const cleanVehicleId = target.vehicle_id || 'unassigned';
    const newFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
    const newStoragePath = `${cleanVehicleId}/${newFilename}`;

    const { error: stErr } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(newStoragePath, blob, { contentType: 'image/webp', upsert: true });

    let newPublicUrl = compressed.base64;
    if (!stErr) {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(newStoragePath);
      if (urlData?.publicUrl) newPublicUrl = urlData.publicUrl;
    }

    // 2. Update DB row
    const oldStoragePath = target.storage_path;
    const payload = {
      storage_path: newStoragePath,
      public_url: newPublicUrl,
      originalSize: newFile.size,
      compressedSize: compressed.compressedSize,
    };

    if (metadata.judul || metadata.title) payload.title = metadata.judul || metadata.title;
    if (metadata.keywords || metadata.tags) {
      payload.tags = Array.isArray(metadata.keywords)
        ? metadata.keywords
        : typeof metadata.keywords === 'string'
        ? metadata.keywords.split(',').map((s) => s.trim()).filter(Boolean)
        : metadata.tags || [];
    }

    const { error: dbErr } = await supabase
      .from('vehicle_photos')
      .update(payload)
      .eq('id', id);

    if (dbErr) {
      // Cleanup new storage file if DB update fails
      if (!stErr) await supabase.storage.from(BUCKET_NAME).remove([newStoragePath]);
      throw new Error(`Gagal mengganti foto di database: ${dbErr.message}`);
    }

    // 3. Remove old storage file if upload and DB update succeeded
    if (oldStoragePath && oldStoragePath !== newStoragePath && !oldStoragePath.startsWith('seed/')) {
      await supabase.storage.from(BUCKET_NAME).remove([oldStoragePath]);
    }

    await loadFotos();
  }, [fotos, loadFotos]);

  /** Set primary photo for a vehicle */
  const setPrimaryPhoto = useCallback(async (id, vehicleId) => {
    if (!vehicleId) return;

    // Reset all photos for this vehicle to is_primary = false
    await supabase
      .from('vehicle_photos')
      .update({ is_primary: false })
      .eq('vehicle_id', vehicleId);

    // Set target photo is_primary = true
    await supabase
      .from('vehicle_photos')
      .update({ is_primary: true })
      .eq('id', id);

    await loadFotos();
  }, [loadFotos]);

  /** Helper to find photo by ID */
  const getFotoById = useCallback((id) => fotos.find((f) => f.id === id) || null, [fotos]);

  /** Helper to get photos by vehicle ID */
  const getFotosByVehicleId = useCallback(
    (vehicleId) => fotos.filter((f) => f.vehicle_id === vehicleId),
    [fotos]
  );

  /** Search library by query string */
  const searchFoto = useCallback(
    (query = '') => {
      if (!query.trim()) return fotos;
      const q = query.toLowerCase();
      return fotos.filter(
        (f) =>
          f.judul.toLowerCase().includes(q) ||
          f.keywords.some((k) => k.toLowerCase().includes(q))
      );
    },
    [fotos]
  );

  /** Get photos matching a vehicle name */
  const getMatchingPhotos = useCallback(
    (carName = '') => {
      if (!carName.trim()) return fotos;
      const words = carName.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (words.length === 0) return fotos;

      return fotos
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
    [fotos]
  );

  return {
    library: fotos, // Backward compatibility alias
    fotos,
    loading,
    error,
    loadFotos,
    uploadFoto,
    updateFoto,
    replaceFoto,
    deleteFoto,
    setPrimaryPhoto,
    getFotoById,
    getFotosByVehicleId,
    searchFoto,
    getMatchingPhotos,
  };
}
