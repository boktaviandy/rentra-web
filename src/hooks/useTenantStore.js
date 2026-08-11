import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Map entityKey to actual Supabase table name if different
const TABLE_MAP = {
  mobil: 'mobil',
  booking: 'bookings',
  customer: 'customers',
  driver: 'drivers',
  pemasukan: 'pemasukan',
  pengeluaran: 'pengeluaran',
  auditlog: 'audit_logs',
  settings: 'settings',
};

function getLocalCache(key) {
  try {
    const item = localStorage.getItem(`rentra_local_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

function setLocalCache(key, data) {
  try {
    localStorage.setItem(`rentra_local_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to set local cache', e);
  }
}

// Sanitize payload for Supabase compatibility with both old and new schema
function sanitizePayload(tableName, payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const clean = { ...payload };

  if (tableName === 'mobil') {
    const val = clean.hargaHarian ?? clean.hargaSewa ?? 0;
    clean.hargaHarian = val;
    clean.hargaSewa = val;
    clean.hargaMingguan = clean.hargaMingguan ?? 0;
    clean.hargaBulanan = clean.hargaBulanan ?? 0;
  } else if (tableName === 'bookings') {
    clean.harga = clean.harga ?? clean.totalHarga ?? 0;
    clean.totalHarga = clean.harga ?? clean.totalHarga ?? 0;
    clean.metodePembayaran = clean.metodePembayaran ?? clean.metodeBayar ?? 'Transfer Bank';
    clean.metodeBayar = clean.metodePembayaran ?? clean.metodeBayar ?? 'Transfer Bank';
  }
  return clean;
}

export function clearAllRentraData() {
  window.dispatchEvent(new Event('rentra_data_reset'));
}

export function useTenantStore(entityKey) {
  const tableName = TABLE_MAP[entityKey] || entityKey;
  const [data, setData] = useState(() => getLocalCache(entityKey) || []);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state to local storage cache on change
  const updateDataState = useCallback((newDataOrUpdater) => {
    setData((prev) => {
      const updated = typeof newDataOrUpdater === 'function' ? newDataOrUpdater(prev) : newDataOrUpdater;
      setLocalCache(entityKey, updated);
      return updated;
    });
  }, [entityKey]);

  // Fetch data from Supabase and merge with local cache
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: dbData, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Supabase Fetch Warning (${tableName}):`, error);
        setIsLoading(false);
        return;
      }

      if (dbData) {
        // Special sort depending on entity
        if (tableName === 'bookings' || tableName === 'pemasukan' || tableName === 'pengeluaran') {
          dbData.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        } else if (tableName === 'audit_logs') {
          dbData.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        }

        // Merge DB data with local cache items
        const local = getLocalCache(entityKey) || [];

        if (entityKey === 'settings' && local.length > 0 && local[0]?.namaRental) {
          const localSetting = local[0];
          const dbSetting = dbData[0] || {};
          const mergedSetting = { ...dbSetting, ...localSetting };
          updateDataState([mergedSetting]);
        } else {
          const dbIds = new Set(dbData.map((d) => d.id));
          const pendingLocal = local.filter((l) => l.id && !dbIds.has(l.id));
          const merged = [...dbData, ...pendingLocal];
          updateDataState(merged);
        }
      }
    } catch (e) {
      console.error(`Failed to load ${entityKey}`, e);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityKey, updateDataState]);

  useEffect(() => {
    fetchData();

    const handleDataReset = () => {
      localStorage.removeItem(`rentra_local_${entityKey}`);
      fetchData();
    };

    window.addEventListener('rentra_data_reset', handleDataReset);
    return () => {
      window.removeEventListener('rentra_data_reset', handleDataReset);
    };
  }, [fetchData, entityKey]);

  // Bulk set & auto-sync to Supabase
  const saveData = useCallback(
    async (newData) => {
      updateDataState(newData);

      try {
        if (Array.isArray(newData) && newData.length > 0) {
          const sanitized = newData.map((item) => sanitizePayload(tableName, item));
          const { error: upsertErr } = await supabase
            .from(tableName)
            .upsert(sanitized);
          if (upsertErr) console.error(`Supabase Upsert Error (${tableName}):`, upsertErr);
        }
      } catch (e) {
        console.error(`Failed to sync ${tableName} with Supabase:`, e);
      }
    },
    [tableName, updateDataState]
  );

  const addItem = useCallback(
    async (item) => {
      // Optimistic update local state + localStorage immediately
      updateDataState((prev) => [item, ...prev]);

      try {
        const payload = sanitizePayload(tableName, item);
        const { error } = await supabase.from(tableName).insert([payload]);

        if (error) {
          console.error(`Supabase Insert Warning (${tableName}):`, error);
          // Retry with minimal payload if unknown columns exist
          const fallbackPayload = { id: item.id, nama: item.nama || item.kategori || '' };
          await supabase.from(tableName).upsert([fallbackPayload]).catch(() => {});
        }
      } catch (e) {
        console.error(`Insert failed for ${tableName}:`, e);
      }
    },
    [tableName, updateDataState]
  );

  const updateItem = useCallback(
    async (id, updatedFields) => {
      updateDataState((prev) => {
        const exists = prev.some((d) => String(d.id) === String(id));
        if (exists) {
          return prev.map((d) => (String(d.id) === String(id) ? { ...d, ...updatedFields } : d));
        }
        return [{ id, ...updatedFields }, ...prev];
      });

      try {
        const payload = sanitizePayload(tableName, { id, ...updatedFields });
        const { error } = await supabase
          .from(tableName)
          .upsert([payload]);

        if (error) console.error(`Supabase Upsert Error (${tableName}):`, error);
      } catch (e) {
        console.error(e);
      }
    },
    [tableName, updateDataState]
  );

  const deleteItem = useCallback(
    async (id) => {
      updateDataState((prev) => prev.filter((d) => d.id !== id));

      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) console.error(`Supabase Delete Error (${tableName}):`, error);
      } catch (e) {
        console.error(e);
      }
    },
    [tableName, updateDataState]
  );

  return {
    data,
    isLoading,
    setData: saveData,
    addItem,
    updateItem,
    deleteItem,
    refetch: fetchData
  };
}

export const useStore = useTenantStore;
