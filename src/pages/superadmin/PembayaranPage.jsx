import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { usePaymentsData } from '../../hooks/usePaymentsData';

export function PembayaranPage() {
  const { payments } = usePaymentsData();

  const columns = [
    { header: 'ID Transaksi', accessorKey: 'id', cell: (r) => <span className="id-tag">{r.id}</span> },
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Paket', accessorKey: 'paket' },
    { header: 'Nominal', cell: (r) => `Rp ${Number(r.nominal || 0).toLocaleString('id-ID')}` },
    { header: 'Metode', accessorKey: 'metode' },
    { header: 'Tanggal', accessorKey: 'tgl' },
    { header: 'Status', cell: (r) => <Badge variant={r.status === 'Lunas' ? 'success' : 'warning'}>{r.status}</Badge> }
  ];

  return (
    <div className="pembayaran-page">
      <PageHeader
        title="Riwayat Pembayaran Tenant"
        description="Log gateway pembayaran otomatis dan billing langganan SaaS."
      />
      <Table columns={columns} data={payments} searchKey="tenant" pageSize={10} />
    </div>
  );
}
