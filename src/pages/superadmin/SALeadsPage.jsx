import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useLeadsData } from '../../hooks/useLeadsData';
import { useTenantData } from '../../hooks/useTenantData';
import {
  Users, CheckCircle2, XCircle, Copy, Eye, EyeOff,
  Building2, Phone, MapPin, Mail, CalendarDays, Link2, User, Key
} from 'lucide-react';
import './SALeadsPage.css';

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button className={`leads-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Salin">
      {copied ? '✓' : <Copy size={13} />}
    </button>
  );
}

export function SALeadsPage() {
  const { leads, approveLead, rejectLead, deleteLead } = useLeadsData();
  const { addTenant } = useTenantData();

  const [selectedLead, setSelectedLead] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [confirmReject, setConfirmReject] = useState(null);
  const [filter, setFilter] = useState('Semua');

  const filters = ['Semua', 'Pending', 'Disetujui', 'Ditolak'];

  const filteredLeads = filter === 'Semua'
    ? leads
    : leads.filter((l) => l.status === filter);

  const pending = leads.filter((l) => l.status === 'Pending').length;
  const approved = leads.filter((l) => l.status === 'Disetujui').length;
  const rejected = leads.filter((l) => l.status === 'Ditolak').length;

  const handleApprove = (lead) => {
    // approveLead returns credentials synchronously via state setter
    // We need to capture credentials outside setState, so re-calculate inline
    const slug = lead.namaRental
      .toLowerCase().replace(/[^a-z0-9 -]/g, '').trim()
      .replace(/\s+/g, '-').replace(/-+/g, '-');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const password = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const url = `https://rentra.app/${slug}`;
    const username = lead.email || `${slug}@rentra.app`;

    const creds = { url, username, password, slug };

    // Update lead status + save credentials
    approveLead(lead.id, creds);

    // Create tenant from lead — store password so login verification works
    addTenant({
      namaRental: lead.namaRental,
      namaOwner: lead.namaOwner,
      noHp: lead.wa,
      kota: lead.kota,
      email: username,
      passwordSementara: password,
      paket: 'Trial',
      status: 'Trial',
      tglExpired: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      leadId: lead.id,
    });

    setCredentials(creds);
    setSelectedLead({ ...lead, credentials: creds });
  };

  const handleRejectConfirm = () => {
    if (confirmReject) {
      rejectLead(confirmReject.id);
      setConfirmReject(null);
    }
  };

  const statusBadge = (status) => {
    const map = { Pending: 'warning', Disetujui: 'success', Ditolak: 'danger' };
    return <Badge variant={map[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="leads-page">
      <PageHeader
        title="Leads Pendaftaran"
        description="Calon tenant yang mendaftar melalui halaman publik. Setujui untuk generate kredensial akses."
      />

      {/* Stats */}
      <div className="leads-stats">
        <div className="leads-stat-card leads-stat-pending">
          <span className="leads-stat-num">{pending}</span>
          <span className="leads-stat-label">Menunggu</span>
        </div>
        <div className="leads-stat-card leads-stat-approved">
          <span className="leads-stat-num">{approved}</span>
          <span className="leads-stat-label">Disetujui</span>
        </div>
        <div className="leads-stat-card leads-stat-rejected">
          <span className="leads-stat-num">{rejected}</span>
          <span className="leads-stat-label">Ditolak</span>
        </div>
        <div className="leads-stat-card leads-stat-total">
          <span className="leads-stat-num">{leads.length}</span>
          <span className="leads-stat-label">Total Leads</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="leads-filter-tabs">
        {filters.map((f) => (
          <button
            key={f}
            className={`leads-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === 'Pending' && pending > 0 && (
              <span className="leads-badge-dot">{pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="card leads-empty">
          <Users size={48} className="leads-empty-icon" />
          <p>Belum ada leads {filter !== 'Semua' ? `dengan status "${filter}"` : ''}</p>
        </div>
      ) : (
        <div className="card leads-table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Nama Rental</th>
                <th>Owner</th>
                <th>WhatsApp</th>
                <th>Kota</th>
                <th>Mendaftar</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="leads-rental-name">{lead.namaRental}</div>
                    <div className="leads-id">{lead.id}</div>
                  </td>
                  <td>{lead.namaOwner}</td>
                  <td>
                    <a href={`https://wa.me/${lead.wa?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="leads-wa-link">
                      {lead.wa}
                    </a>
                  </td>
                  <td>{lead.kota}</td>
                  <td>{formatDate(lead.createdAt)}</td>
                  <td>{statusBadge(lead.status)}</td>
                  <td>
                    <div className="leads-actions">
                      {lead.status === 'Pending' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApprove(lead)}
                          >
                            <CheckCircle2 size={14} /> Buat Tenant
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => setConfirmReject(lead)}
                          >
                            <XCircle size={14} /> Tolak
                          </button>
                        </>
                      )}
                      {lead.status === 'Disetujui' && lead.credentials && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => { setSelectedLead(lead); setCredentials(lead.credentials); }}
                        >
                          <Eye size={14} /> Lihat Kredensial
                        </button>
                      )}
                      {lead.status === 'Ditolak' && (
                        <button
                          className="btn btn-ghost btn-sm text-danger"
                          onClick={() => deleteLead(lead.id)}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Credentials Modal ── */}
      {selectedLead && credentials && (
        <Modal
          isOpen
          onClose={() => { setSelectedLead(null); setCredentials(null); setShowPass(false); }}
          title="Kredensial Akses Tenant"
        >
          <div className="leads-cred-modal">
            {/* Lead Info */}
            <div className="leads-cred-info">
              <div className="leads-cred-info-row">
                <Building2 size={15} />
                <span><strong>{selectedLead.namaRental}</strong></span>
              </div>
              <div className="leads-cred-info-row">
                <User size={15} />
                <span>{selectedLead.namaOwner}</span>
              </div>
              <div className="leads-cred-info-row">
                <Phone size={15} />
                <a href={`https://wa.me/${selectedLead.wa?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                  {selectedLead.wa}
                </a>
              </div>
              <div className="leads-cred-info-row">
                <MapPin size={15} />
                <span>{selectedLead.kota}</span>
              </div>
            </div>

            <div className="leads-cred-divider">
              <span>Kredensial Generate</span>
            </div>

            {/* URL */}
            <div className="leads-cred-field">
              <div className="leads-cred-label">
                <Link2 size={14} /> URL Akses
              </div>
              <div className="leads-cred-value">
                <span>{credentials.url}</span>
                <CopyBtn value={credentials.url} />
              </div>
            </div>

            {/* Username */}
            <div className="leads-cred-field">
              <div className="leads-cred-label">
                <Mail size={14} /> Username / Email
              </div>
              <div className="leads-cred-value">
                <span>{credentials.username}</span>
                <CopyBtn value={credentials.username} />
              </div>
            </div>

            {/* Password */}
            <div className="leads-cred-field">
              <div className="leads-cred-label">
                <Key size={14} /> Password Sementara
              </div>
              <div className="leads-cred-value">
                <span className={showPass ? 'leads-pass-visible' : 'leads-pass-hidden'}>
                  {showPass ? credentials.password : '•'.repeat(credentials.password.length)}
                </span>
                <button className="leads-toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <CopyBtn value={credentials.password} />
              </div>
            </div>

            <div className="leads-cred-warning">
              ⚠️ Kirimkan kredensial ini ke owner melalui WhatsApp. Password hanya ditampilkan sekali.
            </div>

            <div className="leads-cred-actions">
              <a
                className="btn btn-success"
                href={`https://wa.me/${selectedLead.wa?.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Halo ${selectedLead.namaOwner}! 👋\n\nAkun Rentra Anda sudah aktif:\n\n🔗 URL: ${credentials.url}\n👤 Username: ${credentials.username}\n🔑 Password: ${credentials.password}\n\nSilakan login dan ubah password Anda segera. Terima kasih!`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Phone size={14} /> Kirim via WhatsApp
              </a>
              <button
                className="btn btn-secondary"
                onClick={() => { setSelectedLead(null); setCredentials(null); setShowPass(false); }}
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Confirm Reject Modal ── */}
      {confirmReject && (
        <Modal
          isOpen
          onClose={() => setConfirmReject(null)}
          title="Tolak Pendaftaran"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p>
              Apakah Anda yakin ingin <strong>menolak</strong> pendaftaran dari{' '}
              <strong>{confirmReject.namaRental}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmReject(null)}>Batal</button>
              <button className="btn btn-danger" onClick={handleRejectConfirm}>Ya, Tolak</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
