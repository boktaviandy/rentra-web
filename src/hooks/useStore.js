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

// Strict schema whitelists matching production Supabase PostgreSQL tables
const TABLE_SCHEMAS = {
  settings: [
    'id', 'namaRental', 'namaOwner', 'noHp', 'email', 'alamat',
    'zonaWaktu', 'mataUang', 'logo', 'namaBank', 'nomorRekening',
    'atasNamaRekening', 'instruksiPembayaran', 'syaratKetentuan'
  ],
  mobil: [
    'id', 'nama', 'plat', 'merk', 'tahun', 'hargaHarian',
    'hargaMingguan', 'hargaBulanan', 'status', 'foto', 'fotoId',
    'catatan', 'totalHariDisewa', 'totalPendapatan'
  ],
  customers: [
    'id', 'nama', 'noHp', 'email', 'alamat', 'noKtp',
    'noSim', 'fotoKtp', 'fotoSim', 'catatan', 'status', 'totalBooking'
  ],
  drivers: [
    'id', 'nama', 'noHp', 'sim', 'tarif', 'status', 'foto', 'catatan'
  ],
  bookings: [
    'id', 'customerId', 'customerNama', 'mobilId', 'mobilNama', 'mobilPlat',
    'driverId', 'driverNama', 'tglMulai', 'tglSelesai', 'harga', 'deposit',
    'metodePembayaran', 'status', 'statusPembayaran', 'catatan', 'createdAt'
  ],
  pemasukan: [
    'id', 'tanggal', 'kategori', 'bookingId', 'nominal', 'catatan', 'bukti'
  ],
  pengeluaran: [
    'id', 'tanggal', 'kategori', 'mobilId', 'mobilNama', 'bookingId', 'nominal', 'catatan', 'bukti'
  ],
  audit_logs: [
    'id', 'timestamp', 'user', 'action', 'entity', 'entityId', 'details'
  ]
};

// Sanitize payload using strict schema whitelists
function sanitizePayload(tableName, payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const validColumns = TABLE_SCHEMAS[tableName];
  if (!validColumns) return { ...payload };

  const clean = {};
  validColumns.forEach((col) => {
    if (payload[col] !== undefined) {
      clean[col] = payload[col];
    }
  });

  if (tableName === 'settings') {
    clean.id = 1;
  } else if (tableName === 'mobil') {
    clean.hargaHarian = clean.hargaHarian ?? 0;
    clean.hargaMingguan = clean.hargaMingguan ?? 0;
    clean.hargaBulanan = clean.hargaBulanan ?? 0;
    clean.totalHariDisewa = clean.totalHariDisewa ?? 0;
    clean.totalPendapatan = clean.totalPendapatan ?? 0;
  } else if (tableName === 'bookings') {
    clean.harga = clean.harga ?? 0;
    clean.deposit = clean.deposit ?? 0;
    clean.customerId = (clean.customerId && String(clean.customerId).trim() !== '') ? String(clean.customerId) : null;
    clean.mobilId = (clean.mobilId && String(clean.mobilId).trim() !== '') ? String(clean.mobilId) : null;
    clean.driverId = (clean.driverId && String(clean.driverId).trim() !== '') ? String(clean.driverId) : null;
  } else if (tableName === 'pemasukan') {
    clean.nominal = clean.nominal ? Number(clean.nominal) : 0;
    clean.bookingId = (clean.bookingId && String(clean.bookingId).trim() !== '' && clean.bookingId !== 'Tidak ada' && clean.bookingId !== 'Tanpa Booking') ? String(clean.bookingId) : null;
    clean.catatan = clean.catatan || null;
    clean.bukti = clean.bukti || null;
  } else if (tableName === 'pengeluaran') {
    clean.nominal = clean.nominal ? Number(clean.nominal) : 0;
    clean.bookingId = (clean.bookingId && String(clean.bookingId).trim() !== '' && clean.bookingId !== 'Tidak ada' && clean.bookingId !== 'Tanpa Booking') ? String(clean.bookingId) : null;
    clean.mobilId = (clean.mobilId && String(clean.mobilId).trim() !== '' && clean.mobilId !== 'Umum / Operasional') ? String(clean.mobilId) : null;
    clean.catatan = clean.catatan || null;
    clean.bukti = clean.bukti || null;
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
        console.error(`[Supabase Fetch Error] ${tableName}:`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
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
      try {
        if (Array.isArray(newData) && newData.length > 0) {
          const sanitized = newData.map((item) => sanitizePayload(tableName, item));
          const { error: upsertErr } = await supabase
            .from(tableName)
            .upsert(sanitized);

          if (upsertErr) {
            console.error(`[Supabase Upsert Error] ${tableName}:`, {
              message: upsertErr.message,
              code: upsertErr.code,
              details: upsertErr.details,
              hint: upsertErr.hint
            });
            throw upsertErr;
          }
          await fetchData();
          return { success: true };
        }
        return { success: true };
      } catch (e) {
        console.error(`Failed to sync ${tableName} with Supabase:`, e);
        throw e;
      }
    },
    [tableName, fetchData]
  );

  const addItem = useCallback(
    async (item) => {
      try {
        const payload = sanitizePayload(tableName, item);
        const { data: inserted, error } = await supabase
          .from(tableName)
          .insert([payload])
          .select('*');

        if (error) {
          console.error(`[Supabase Insert Error] ${tableName}:`, {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        await fetchData();
        return { success: true, data: inserted };
      } catch (e) {
        console.error(`Insert failed for ${tableName}:`, e);
        throw e;
      }
    },
    [tableName, fetchData]
  );

  const updateItem = useCallback(
    async (id, updatedFields) => {
      try {
        const payload = sanitizePayload(tableName, { id, ...updatedFields });
        const { error } = await supabase
          .from(tableName)
          .upsert([payload]);

        if (error) {
          console.error(`[Supabase Update Error] ${tableName}:`, {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        await fetchData();
        return { success: true };
      } catch (e) {
        console.error(`Update failed for ${tableName}:`, e);
        throw e;
      }
    },
    [tableName, fetchData]
  );

  const deleteItem = useCallback(
    async (id) => {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);

        if (error) {
          console.error(`[Supabase Delete Error] ${tableName}:`, {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        await fetchData();
        return { success: true };
      } catch (e) {
        console.error(`Delete failed for ${tableName}:`, e);
        throw e;
      }
    },
    [tableName, fetchData]
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
