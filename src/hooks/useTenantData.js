import { useState, useCallback } from 'react';
import initialTenantData from '../data/tenant.json';

const STORAGE_KEY = 'rentra_tenants_v1';

function loadTenants() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load tenants', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTenantData));
  return initialTenantData;
}

function saveTenants(tenants) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
  } catch (e) {
    console.error('Failed to save tenants', e);
  }
}

// Sync the active owner session if the updated tenant matches the logged-in tenant
const CURRENT_TENANT_KEY = 'rentra_current_tenant';
function syncCurrentTenantSession(updatedId, changedFields) {
  try {
    const raw = localStorage.getItem(CURRENT_TENANT_KEY);
    if (!raw) return;
    const current = JSON.parse(raw);
    if (current?.id === updatedId) {
      const merged = { ...current, ...changedFields };
      localStorage.setItem(CURRENT_TENANT_KEY, JSON.stringify(merged));
      // Notify useAuth listeners so Header/Sidebar re-render immediately
      window.dispatchEvent(new Event('rentra_auth_change'));
    }
  } catch (e) {
    console.error('Failed to sync current tenant session', e);
  }
}

// Default duration per plan (in days)
const PLAN_DURATIONS = {
  'Trial':      14,
  'Basic':      30,
  'Pro':        30,
  'Enterprise': 365,
};

export function useTenantData() {
  const [tenants, setTenants] = useState(() => loadTenants());

  const addTenant = useCallback((tenantData) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const expDate = new Date();

    // If durasiHari explicitly passed, use it. Otherwise derive from plan.
    const plan = tenantData.paket || 'Trial';
    const durasiHari = tenantData.durasiHari
      ? Number(tenantData.durasiHari)
      : (PLAN_DURATIONS[plan] ?? 14);

    expDate.setDate(expDate.getDate() + durasiHari);

    const newTenant = {
      id: `TNT-${String(Date.now()).slice(-6)}`,   // unique ID berbasis timestamp
      namaRental: tenantData.namaRental,
      namaOwner: tenantData.namaOwner,
      email: tenantData.email || `${tenantData.namaRental.toLowerCase().replace(/[^a-z0-9]/g, '')}@rental.com`,
      noHp: tenantData.noHp || tenantData.wa || '081234567890',
      kota: tenantData.kota || 'Jakarta',
      paket: tenantData.paket || 'Trial',
      status: tenantData.status || 'Trial',
      tglBergabung: todayStr,
      tglExpired: expDate.toISOString().slice(0, 10),
      // ⬇ spread sisanya: passwordSementara, leadId, dll.
      ...tenantData,
    };


    setTenants((prev) => {
      const updated = [newTenant, ...prev];
      saveTenants(updated);
      return updated;
    });

    // Record automatic payment log entry
    try {
      const PAYMENTS_KEY = 'rentra_payments_v1';
      const existingPayments = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
      const nominalMap = { 'Trial': 0, 'Basic': 299000, 'Pro': 599000, 'Enterprise': 1299000 };
      const newPayLog = {
        id: `PAY-${String(Date.now()).slice(-6)}`,
        tenant: newTenant.namaRental,
        paket: `${newTenant.paket} Plan`,
        nominal: nominalMap[newTenant.paket] ?? 0,
        tgl: todayStr,
        metode: newTenant.paket === 'Trial' ? 'Pendaftaran Trial' : 'Transfer Bank / Gateway',
        status: 'Lunas',
      };
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([newPayLog, ...existingPayments]));
    } catch (e) {
      console.error('Failed to log payment entry for new tenant', e);
    }

    return newTenant;
  }, [tenants.length]);

  const updateStatus = useCallback((id, newStatus) => {
    setTenants((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
      saveTenants(updated);
      syncCurrentTenantSession(id, { status: newStatus });
      return updated;
    });
  }, []);

  const extendSubscription = useCallback((id, days = 365) => {
    setTenants((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const currentExp = new Date(t.tglExpired > new Date().toISOString().slice(0, 10) ? t.tglExpired : new Date());
          currentExp.setDate(currentExp.getDate() + days);
          const fields = {
            status: 'Aktif',
            tglExpired: currentExp.toISOString().slice(0, 10),
          };
          syncCurrentTenantSession(id, fields);

          // Record extension payment log
          try {
            const PAYMENTS_KEY = 'rentra_payments_v1';
            const existingPayments = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
            const nominalMap = { 'Trial': 0, 'Basic': 299000, 'Pro': 599000, 'Enterprise': 1299000 };
            const extLog = {
              id: `PAY-${String(Date.now()).slice(-6)}`,
              tenant: t.namaRental,
              paket: `Perpanjangan ${t.paket}`,
              nominal: nominalMap[t.paket] ?? 299000,
              tgl: new Date().toISOString().slice(0, 10),
              metode: 'Manual Super Admin',
              status: 'Lunas',
            };
            localStorage.setItem(PAYMENTS_KEY, JSON.stringify([extLog, ...existingPayments]));
          } catch (e) {}

          return { ...t, ...fields };
        }
        return t;
      });
      saveTenants(updated);
      return updated;
    });
  }, []);

  const deleteTenant = useCallback((id) => {
    setTenants((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTenants(updated);
      return updated;
    });
  }, []);

  const updatePaket = useCallback((id, newPaket) => {
    setTenants((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, paket: newPaket } : t));
      saveTenants(updated);
      syncCurrentTenantSession(id, { paket: newPaket });
      return updated;
    });
  }, []);

  const updateTenant = useCallback((id, fields) => {
    setTenants((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...fields } : t));
      saveTenants(updated);
      syncCurrentTenantSession(id, fields);
      return updated;
    });
  }, []);

  const resetPassword = useCallback((id, newPassword) => {
    setTenants((prev) => {
      const updated = prev.map((t) =>
        t.id === id
          ? { ...t, passwordSementara: newPassword, password: newPassword }
          : t
      );
      saveTenants(updated);
      syncCurrentTenantSession(id, { passwordSementara: newPassword, password: newPassword });
      return updated;
    });
  }, []);

  return {
    tenants,
    addTenant,
    updateStatus,
    updatePaket,
    updateTenant,
    extendSubscription,
    deleteTenant,
    resetPassword,
  };
}
