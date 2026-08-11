import { useState, useCallback } from 'react';

const PAYMENTS_KEY = 'rentra_payments_v1';

const INITIAL_PAYMENTS = [
  { id: 'PAY-001', tenant: 'Garuda Rent Car', paket: 'Pro Plan', nominal: 599000, tgl: '2026-07-10', metode: 'Midtrans QRIS', status: 'Lunas' },
  { id: 'PAY-002', tenant: 'Nusantara Trans', paket: 'Basic Plan', nominal: 299000, tgl: '2026-07-15', metode: 'BCA Virtual Account', status: 'Lunas' },
  { id: 'PAY-003', tenant: 'Bali Auto Rental', paket: 'Pro Plan', nominal: 599000, tgl: '2026-07-20', metode: 'Mandiri VA', status: 'Lunas' },
];

function loadPayments() {
  try {
    const saved = localStorage.getItem(PAYMENTS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load payments', e);
  }
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(INITIAL_PAYMENTS));
  return INITIAL_PAYMENTS;
}

function savePayments(payments) {
  try {
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
  } catch (e) {
    console.error('Failed to save payments', e);
  }
}

export function usePaymentsData() {
  const [payments, setPayments] = useState(() => loadPayments());

  const addPaymentLog = useCallback((data) => {
    const newLog = {
      id: `PAY-${String(Date.now()).slice(-6)}`,
      tenant: data.tenant || data.namaRental,
      paket: data.paket || 'Trial',
      nominal: data.nominal ?? (data.paket === 'Pro' ? 599000 : data.paket === 'Basic' ? 299000 : data.paket === 'Enterprise' ? 1299000 : 0),
      tgl: data.tgl || new Date().toISOString().slice(0, 10),
      metode: data.metode || 'Pendaftaran Lead',
      status: data.status || 'Lunas',
    };

    setPayments((prev) => {
      const updated = [newLog, ...prev];
      savePayments(updated);
      return updated;
    });

    return newLog;
  }, []);

  return {
    payments,
    addPaymentLog,
  };
}
