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

export function clearAllRentraData() {
  window.dispatchEvent(new Event('rentra_data_reset'));
}

export function useTenantStore(entityKey) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const tableName = TABLE_MAP[entityKey] || entityKey;

  // Fetch initial data from Supabase
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // For some tables we might want order, but simple select is fine for all generally
      const { data: dbData, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Supabase Fetch Error (${tableName}):`, error);
        return;
      }
      
      if (dbData) {
        // Special sort depending on entity
        if (tableName === 'bookings' || tableName === 'pemasukan' || tableName === 'pengeluaran') {
          dbData.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
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

    // Event listener for cross-component re-fetch
    const handleStoreChange = () => {
      fetchData();
    };

    window.addEventListener(`rentra_store_update_${entityKey}`, handleStoreChange);
    window.addEventListener('rentra_data_reset', handleStoreChange);

    return () => {
      window.removeEventListener(`rentra_store_update_${entityKey}`, handleStoreChange);
      window.removeEventListener('rentra_data_reset', handleStoreChange);
    };
  }, [fetchData, entityKey]);

  // Bulk set (optimistic local update)
  const saveData = useCallback(
    async (newData) => {
      setData(newData);
      window.dispatchEvent(new CustomEvent(`rentra_store_update_${entityKey}`));
    },
    [entityKey]
  );

  const addItem = useCallback(
    async (item) => {
      // Optimistic update
      setData((prev) => [item, ...prev]);

      try {
        const { error } = await supabase.from(tableName).insert([item]);
        if (error) {
          console.error(`Supabase Insert Error (${tableName}):`, error);
          fetchData(); // revert on error
        }
      } catch (e) {
        console.error(e);
      }
      window.dispatchEvent(new CustomEvent(`rentra_store_update_${entityKey}`));
    },
    [tableName, fetchData, entityKey]
  );

  const updateItem = useCallback(
    async (id, updatedFields) => {
      // Optimistic update
      setData((prev) => prev.map((d) => (d.id === id ? { ...d, ...updatedFields } : d)));

      try {
        const { error } = await supabase
          .from(tableName)
          .update(updatedFields)
          .eq('id', id);

        if (error) {
          console.error(`Supabase Update Error (${tableName}):`, error);
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
      window.dispatchEvent(new CustomEvent(`rentra_store_update_${entityKey}`));
    },
    [tableName, fetchData, entityKey]
  );

  const deleteItem = useCallback(
    async (id) => {
      // Optimistic update
      setData((prev) => prev.filter((d) => d.id !== id));

      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`Supabase Delete Error (${tableName}):`, error);
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
      window.dispatchEvent(new CustomEvent(`rentra_store_update_${entityKey}`));
    },
    [tableName, fetchData, entityKey]
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
