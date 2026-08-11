import { useState, useCallback } from 'react';

const LEADS_KEY = 'rentra_leads_v1';

function loadLeads() {
  try {
    const saved = localStorage.getItem(LEADS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load leads', e);
  }
  localStorage.setItem(LEADS_KEY, JSON.stringify([]));
  return [];
}

function saveLeads(leads) {
  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error('Failed to save leads', e);
  }
}

function generatePassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateCredentials(lead, existingLeads) {
  const slug = slugify(lead.namaRental);
  const url = `https://rentra.app/${slug}`;
  const username = lead.email || `${slug}@rentra.app`;
  const password = generatePassword(12);
  return { url, username, password, slug };
}

export function useLeadsData() {
  const [leads, setLeads] = useState(() => loadLeads());

  const addLead = useCallback((leadData) => {
    const newLead = {
      id: `LEAD-${Date.now()}`,
      namaRental: leadData.namaRental,
      namaOwner: leadData.namaOwner,
      wa: leadData.wa || leadData.noWhatsapp || '',
      kota: leadData.kota || '',
      email: leadData.email || '',
      createdAt: new Date().toISOString(),
      status: 'Pending', // Pending | Disetujui | Ditolak
      credentials: null,
    };

    setLeads((prev) => {
      const updated = [newLead, ...prev];
      saveLeads(updated);
      return updated;
    });

    return newLead;
  }, []);

  const approveLead = useCallback((id, creds) => {
    setLeads((prev) => {
      const updated = prev.map((l) =>
        l.id === id
          ? { ...l, status: 'Disetujui', credentials: creds, approvedAt: new Date().toISOString() }
          : l
      );
      saveLeads(updated);
      return updated;
    });
  }, []);

  const rejectLead = useCallback((id) => {
    setLeads((prev) => {
      const updated = prev.map((l) =>
        l.id === id ? { ...l, status: 'Ditolak', rejectedAt: new Date().toISOString() } : l
      );
      saveLeads(updated);
      return updated;
    });
  }, []);

  const deleteLead = useCallback((id) => {
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      saveLeads(updated);
      return updated;
    });
  }, []);

  const pendingCount = leads.filter((l) => l.status === 'Pending').length;

  return {
    leads,
    pendingCount,
    addLead,
    approveLead,
    rejectLead,
    deleteLead,
  };
}
