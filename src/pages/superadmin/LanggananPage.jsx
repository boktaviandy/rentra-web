import React, { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { useTenantData } from '../../hooks/useTenantData';
import { CalendarDays, Clock, Building2, MapPin, Phone } from 'lucide-react';

export function LanggananPage() {
  const { tenants } = useTenantData();
  const [filter, setFilter] = useState('Semua');

  const filters = ['Semua', 'Aktif', 'Trial', 'Suspended'];

  const filteredTenants = filter === 'Semua'
    ? tenants
    : tenants.filter((t) => (t.status || 'Trial') === filter);

  const getDaysRemaining = (tglExpired) => {
    if (!tglExpired) return 0;
    const today = new Date();
    const exp = new Date(tglExpired);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const columns = [
    {
      header: 'Tenant / Rental',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>{row.namaRental}</div>
          <div className="subtext">
            Owner: {row.namaOwner} • <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {row.kota || 'Indonesia'}
          </div>
        </div>
      )
    },
    {
      header: 'Paket SaaS',
      cell: (row) => {
        const paket = row.paket || 'Trial';
        const isPro = paket === 'Pro';
        const isEnt = paket === 'Enterprise';
        const isBasic = paket === 'Basic';
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: isPro ? '#EFF6FF' : isEnt ? '#F3E8FF' : isBasic ? '#F0FFF4' : '#FEF2F2',
              color: isPro ? '#1D4ED8' : isEnt ? '#6B21A8' : isBasic ? '#15803D' : '#B91C1C',
              border: `1px solid ${isPro ? '#BFDBFE' : isEnt ? '#E9D5FF' : isBasic ? '#BBF7D0' : '#FECACA'}`
            }}
          >
            {paket}
          </span>
        );
      }
    },
    {
      header: 'Tanggal Mulai',
      accessorKey: 'tglBergabung',
      cell: (row) => (
        <span className="subtext" style={{ fontSize: '13px', fontWeight: '500' }}>
          {row.tglBergabung || '-'}
        </span>
      )
    },
    {
      header: 'Tanggal Berakhir (Expired)',
      cell: (row) => {
        const daysLeft = getDaysRemaining(row.tglExpired);
        const isExpired = daysLeft === 0;
        return (
          <div>
            <div style={{ fontWeight: '700', color: isExpired ? '#EF4444' : 'var(--text-main)', fontSize: '13px' }}>
              {row.tglExpired}
            </div>
            <div className="subtext" style={{ fontSize: '11px', color: isExpired ? '#EF4444' : daysLeft <= 7 ? '#F59E0B' : 'var(--text-muted)' }}>
              {isExpired ? ' expired' : `⏱️ ${daysLeft} hari tersisa`}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status Subskripsi',
      cell: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>{row.status || 'Trial'}</Badge>
      )
    }
  ];

  return (
    <div className="langganan-page">
      <PageHeader
        title="Daftar Subskripsi SaaS"
        description="Pantau siklus tagihan, sisa durasi aktif, dan status langganan seluruh tenant terdaftar secara real-time."
      />

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              border: '1.5px solid var(--border-color)',
              background: filter === f ? 'var(--primary)' : 'var(--bg-card)',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {f} ({f === 'Semua' ? tenants.length : tenants.filter(t => (t.status || 'Trial') === f).length})
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filteredTenants}
        searchKey="namaRental"
        searchPlaceholder="Cari nama rental, owner, atau paket..."
        pageSize={10}
      />
    </div>
  );
}
