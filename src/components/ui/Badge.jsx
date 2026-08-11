import React from 'react';

export function Badge({ children, variant = 'secondary', showDot = true }) {
  return (
    <span className={`badge badge-${variant}`}>
      {showDot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function getStatusBadgeVariant(status) {
  switch (status?.toLowerCase()) {
    case 'tersedia':
    case 'selesai':
    case 'aktif':
    case 'lunas':
      return 'success';

    case 'disewa':
    case 'berjalan':
    case 'booking':
    case 'pro':
    case 'dp 50%':
      return 'info';

    case 'servis':
    case 'draft':
    case 'trial':
      return 'warning';

    case 'nonaktif':
    case 'dibatalkan':
    case 'expired':
    case 'suspended':
    case 'belum bayar':
      return 'danger';

    default:
      return 'secondary';
  }
}
