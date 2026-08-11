import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  History, Search, X, Filter, Download,
  Plus, Pencil, Trash2, LogIn, Settings,
  Car, FileText, Users, UserCheck, TrendingUp,
  TrendingDown, ChevronDown, ChevronUp, Shield
} from 'lucide-react';
import { useTenantStore } from '../../hooks/useTenantStore';
import './AuditLogPage.css';

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  CREATE: { label: 'Tambah',       color: 'action-create',  Icon: Plus      },
  UPDATE: { label: 'Ubah',         color: 'action-update',  Icon: Pencil    },
  DELETE: { label: 'Hapus',        color: 'action-delete',  Icon: Trash2    },
  LOGIN:  { label: 'Login',        color: 'action-login',   Icon: LogIn     },
};

const MODULE_CONFIG = {
  Booking:     { Icon: FileText,    color: 'mod-booking'  },
  Mobil:       { Icon: Car,         color: 'mod-mobil'    },
  Customer:    { Icon: Users,       color: 'mod-customer' },
  Driver:      { Icon: UserCheck,   color: 'mod-driver'   },
  Pemasukan:   { Icon: TrendingUp,  color: 'mod-income'   },
  Pengeluaran: { Icon: TrendingDown,color: 'mod-expense'  },
  Pengaturan:  { Icon: Settings,    color: 'mod-setting'  },
  Sistem:      { Icon: Shield,      color: 'mod-system'   },
};

const ALL_MODULES  = ['Semua', ...Object.keys(MODULE_CONFIG)];
const ALL_ACTIONS  = ['Semua', ...Object.keys(ACTION_CONFIG)];
const ALL_USERS    = ['Semua', 'Owner', 'Admin', 'System'];

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || { label: action, color: 'action-create', Icon: Plus };
  const { label, color, Icon } = cfg;
  return (
    <span className={`al-badge ${color}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

function ModuleBadge({ module: mod }) {
  const cfg = MODULE_CONFIG[mod] || { Icon: Shield, color: 'mod-system' };
  const { Icon, color } = cfg;
  return (
    <span className={`al-module-badge ${color}`}>
      <Icon size={11} />
      {mod}
    </span>
  );
}

function UserBadge({ user }) {
  const colors = {
    Owner:  'user-owner',
    Admin:  'user-admin',
    System: 'user-system',
  };
  return (
    <span className={`al-user-badge ${colors[user] || 'user-system'}`}>
      {user}
    </span>
  );
}

function LogRow({ log, isExpanded, onToggle }) {
  return (
    <>
      <tr className={`al-row ${isExpanded ? 'al-row-expanded' : ''}`} onClick={onToggle}>
        {/* Timestamp */}
        <td className="al-td al-td-time">
          <div className="al-time-main">{formatTimestamp(log.timestamp)}</div>
        </td>
        {/* Action */}
        <td className="al-td"><ActionBadge action={log.action} /></td>
        {/* Module */}
        <td className="al-td"><ModuleBadge module={log.module} /></td>
        {/* Description */}
        <td className="al-td al-td-desc">
          <span className="al-desc">{log.deskripsi}</span>
        </td>
        {/* User */}
        <td className="al-td">
          <div className="al-user-cell">
            <UserBadge user={log.user} />
            <span className="al-username">{log.userName}</span>
          </div>
        </td>
        {/* Expand chevron */}
        <td className="al-td al-td-expand">
          {isExpanded
            ? <ChevronUp size={15} className="al-chevron" />
            : <ChevronDown size={15} className="al-chevron" />}
        </td>
      </tr>
      {/* Detail row */}
      {isExpanded && (
        <tr className="al-detail-row">
          <td colSpan={6} className="al-detail-td">
            <div className="al-detail-box">
              <span className="al-detail-label">Detail Perubahan</span>
              <p className="al-detail-text">{log.detail}</p>
              <div className="al-detail-meta">
                <span>ID Log: {log.id}</span>
                <span>Waktu tepat: {log.timestamp}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AuditLogPage() {
  const { data: logs } = useTenantStore('auditlog');
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [filterModule, setFilterModule] = useState('Semua');
  const [filterAction, setFilterAction] = useState('Semua');
  const [filterUser, setFilterUser]   = useState('Semua');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      if (q && !log.deskripsi.toLowerCase().includes(q) &&
               !log.detail.toLowerCase().includes(q) &&
               !log.userName.toLowerCase().includes(q)) return false;
      if (filterModule !== 'Semua' && log.module !== filterModule) return false;
      if (filterAction !== 'Semua' && log.action !== filterAction) return false;
      if (filterUser   !== 'Semua' && log.user   !== filterUser)   return false;
      if (dateFrom && log.timestamp.slice(0, 10) < dateFrom) return false;
      if (dateTo   && log.timestamp.slice(0, 10) > dateTo)   return false;
      return true;
    });
  }, [logs, search, filterModule, filterAction, filterUser, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Group by date for section headers
  const grouped = useMemo(() => {
    const groups = [];
    let lastDate = null;
    paginated.forEach((log) => {
      const d = log.timestamp.slice(0, 10);
      if (d !== lastDate) {
        groups.push({ type: 'date', date: d, label: formatDate(log.timestamp) });
        lastDate = d;
      }
      groups.push({ type: 'log', log });
    });
    return groups;
  }, [paginated]);

  const isFiltered = filterModule !== 'Semua' || filterAction !== 'Semua' ||
                     filterUser !== 'Semua' || dateFrom || dateTo;

  const resetFilters = () => {
    setFilterModule('Semua');
    setFilterAction('Semua');
    setFilterUser('Semua');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleExportCSV = () => {
    const header = 'ID,Waktu,Aksi,Modul,Deskripsi,User,Detail\n';
    const rows = filtered.map((l) =>
      `${l.id},${l.timestamp},${l.action},${l.module},"${l.deskripsi}",${l.userName},"${l.detail}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="al-page">
      <PageHeader
        title="Audit Log"
        description="Riwayat seluruh aktivitas dan perubahan data pada sistem rental."
        action={
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      {/* Stats strip */}
      <div className="al-stats">
        {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
          const count = logs.filter((l) => l.action === key).length;
          const { label, color, Icon } = cfg;
          return (
            <button
              key={key}
              className={`al-stat-card ${filterAction === key ? 'al-stat-active' : ''}`}
              onClick={() => { setFilterAction(filterAction === key ? 'Semua' : key); setPage(1); }}
            >
              <span className={`al-stat-icon ${color}`}><Icon size={16} /></span>
              <div>
                <div className="al-stat-num">{count}</div>
                <div className="al-stat-label">{label}</div>
              </div>
            </button>
          );
        })}
        <div className="al-stat-card al-stat-total">
          <span className="al-stat-icon mod-system"><History size={16} /></span>
          <div>
            <div className="al-stat-num">{logs.length}</div>
            <div className="al-stat-label">Total Log</div>
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="al-toolbar">
        <div className="al-search-wrap">
          <Search size={15} className="al-search-icon" />
          <input
            className="al-search"
            placeholder="Cari deskripsi, detail, atau nama user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && <button className="al-clear" onClick={() => setSearch('')}><X size={13} /></button>}
        </div>

        <button
          className={`btn btn-secondary al-filter-toggle ${showFilters ? 'al-filter-active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={15} />
          Filter
          {isFiltered && <span className="al-filter-dot" />}
        </button>

        {isFiltered && (
          <button className="btn btn-ghost al-reset" onClick={resetFilters}>
            <X size={13} /> Reset
          </button>
        )}

        <span className="al-result-count">{filtered.length} aktivitas</span>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="al-filter-panel">
          <div className="al-filter-group">
            <label className="al-filter-label">Modul</label>
            <div className="al-chip-group">
              {ALL_MODULES.map((m) => (
                <button
                  key={m}
                  className={`al-chip ${filterModule === m ? 'al-chip-active' : ''}`}
                  onClick={() => { setFilterModule(m); setPage(1); }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="al-filter-group">
            <label className="al-filter-label">Jenis Aksi</label>
            <div className="al-chip-group">
              {ALL_ACTIONS.map((a) => (
                <button
                  key={a}
                  className={`al-chip ${filterAction === a ? 'al-chip-active' : ''}`}
                  onClick={() => { setFilterAction(a); setPage(1); }}
                >
                  {a === 'Semua' ? 'Semua' : ACTION_CONFIG[a]?.label || a}
                </button>
              ))}
            </div>
          </div>

          <div className="al-filter-row">
            <div className="al-filter-group">
              <label className="al-filter-label">User</label>
              <div className="al-chip-group">
                {ALL_USERS.map((u) => (
                  <button
                    key={u}
                    className={`al-chip ${filterUser === u ? 'al-chip-active' : ''}`}
                    onClick={() => { setFilterUser(u); setPage(1); }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="al-filter-group al-date-group">
              <label className="al-filter-label">Rentang Tanggal</label>
              <div className="al-date-inputs">
                <input
                  type="date"
                  className="form-input al-date-input"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                />
                <span className="al-date-sep">s/d</span>
                <input
                  type="date"
                  className="form-input al-date-input"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Table */}
      <div className="al-table-wrap">
        {filtered.length === 0 ? (
          <div className="al-empty">
            <History size={40} />
            <p>Tidak ada log yang cocok dengan filter yang dipilih.</p>
            <button className="btn btn-secondary" onClick={resetFilters}>Reset Filter</button>
          </div>
        ) : (
          <table className="al-table">
            <thead>
              <tr>
                <th className="al-th">Waktu</th>
                <th className="al-th">Aksi</th>
                <th className="al-th">Modul</th>
                <th className="al-th">Deskripsi</th>
                <th className="al-th">User</th>
                <th className="al-th" />
              </tr>
            </thead>
            <tbody>
              {grouped.map((item, idx) =>
                item.type === 'date' ? (
                  <tr key={`date-${idx}`} className="al-date-header-row">
                    <td colSpan={6} className="al-date-header">
                      <span>{item.label}</span>
                    </td>
                  </tr>
                ) : (
                  <LogRow
                    key={item.log.id}
                    log={item.log}
                    isExpanded={expandedId === item.log.id}
                    onToggle={() => setExpandedId(expandedId === item.log.id ? null : item.log.id)}
                  />
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="al-pagination">
          <button
            className="al-page-btn"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ← Sebelumnya
          </button>
          <div className="al-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`al-page-num ${p === page ? 'al-page-current' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            className="al-page-btn"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  );
}
