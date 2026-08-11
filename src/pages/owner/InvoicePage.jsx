import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table } from '../../components/ui/Table';
import { Badge, getStatusBadgeVariant } from '../../components/ui/Badge';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenantStore } from '../../hooks/useTenantStore';

export function InvoicePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: bookingList } = useTenantStore('booking');

  const columns = [
    {
      header: 'No Invoice',
      cell: (row) => <span className="id-tag">INV/{row.id}</span>
    },
    {
      header: 'Pelanggan',
      accessorKey: 'customerNama'
    },
    {
      header: 'Mobil',
      accessorKey: 'mobilNama'
    },
    {
      header: 'Total Biaya',
      cell: (row) => `Rp ${(row.harga || row.totalHarga || 0).toLocaleString('id-ID')}`
    },
    {
      header: 'Status Pembayaran',
      cell: (row) => (
        <Badge variant={getStatusBadgeVariant(row.statusPembayaran || 'Lunas')}>
          {row.statusPembayaran || 'Lunas'}
        </Badge>
      )
    },
    {
      header: 'Aksi',
      cell: (row) => (
        <div className="table-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/invoice/${row.id}`)}
          >
            <Eye size={14} /> Preview & Cetak
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="invoice-page">
      <PageHeader
        title={t('nav.invoice')}
        description="Faktur penagihan dan bukti pembayaran resmi rental mobil."
      />

      <Table
        columns={columns}
        data={bookingList}
        searchKey="customerNama"
        searchPlaceholder="Cari nomor invoice atau pelanggan..."
        pageSize={10}
      />
    </div>
  );
}
