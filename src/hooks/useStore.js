import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Map entityKey to actual Supabase table name
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

// Sanitize payload for Supabase compatibility
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

export function useStore(entityKey) {
  const tableName = TABLE_MAP[entityKey] || entityKey;
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data directly from Supabase (Source of Truth)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: dbData, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Supabase Fetch Error (${tableName}):`, error);
        setIsLoading(false);
        return;
      }

      if (dbData) {
        // Sort items logically based on table type
        if (tableName === 'bookings' || tableName === 'pemasukan' || tableName === 'pengeluaran') {
          dbData.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        } else if (tableName === 'audit_logs') {
          dbData.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        }

        setData(dbData);
      }
    } catch (e) {
      console.error(`Failed to load ${entityKey}`, e);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, entityKey]);

  useEffect(() => {
    fetchData();

    const handleDataReset = () => {
      fetchData();
    };

    window.addEventListener('rentra_data_reset', handleDataReset);
    return () => {
      window.removeEventListener('rentra_data_reset', handleDataReset);
    };
  }, [fetchData]);

  // Bulk save & sync to Supabase
  const saveData = useCallback(
    async (newData) => {
      setData(newData);

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
    [tableName]
  );

  const addItem = useCallback(
    async (item) => {
      // Optimistically update React UI
      setData((prev) => [item, ...prev]);

      try {
        const payload = sanitizePayload(tableName, item);
        const { error } = await supabase.from(tableName).insert([payload]);

        if (error) {
          console.error(`Supabase Insert Warning (${tableName}):`, error);
          const fallbackPayload = { id: item.id, nama: item.nama || item.kategori || '' };
          await supabase.from(tableName).upsert([fallbackPayload]).catch(() => {});
        } else {
          fetchData();
        }
      } catch (e) {
        console.error(`Insert failed for ${tableName}:`, e);
      }
    },
    [tableName, fetchData]
  );

  const updateItem = useCallback(
    async (id, updatedFields) => {
      setData((prev) => {
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
        else fetchData();
      } catch (e) {
        console.error(e);
      }
    },
    [tableName, fetchData]
  );

  const deleteItem = useCallback(
    async (id) => {
      setData((prev) => prev.filter((d) => String(d.id) !== String(id)));

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
    [tableName]
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
