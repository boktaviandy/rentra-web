import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));

// Rental Management Pages
const DashboardPage = lazy(() => import('../pages/owner/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MobilPage = lazy(() => import('../pages/owner/MobilPage').then(m => ({ default: m.MobilPage })));
const MobilDetailPage = lazy(() => import('../pages/owner/MobilDetailPage').then(m => ({ default: m.MobilDetailPage })));
const BookingPage = lazy(() => import('../pages/owner/BookingPage').then(m => ({ default: m.BookingPage })));
const BookingDetailPage = lazy(() => import('../pages/owner/BookingDetailPage').then(m => ({ default: m.BookingDetailPage })));
const KalenderPage = lazy(() => import('../pages/owner/KalenderPage').then(m => ({ default: m.KalenderPage })));
const CustomerPage = lazy(() => import('../pages/owner/CustomerPage').then(m => ({ default: m.CustomerPage })));
const CustomerDetailPage = lazy(() => import('../pages/owner/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })));
const DriverPage = lazy(() => import('../pages/owner/DriverPage').then(m => ({ default: m.DriverPage })));
const PemasukanPage = lazy(() => import('../pages/owner/PemasukanPage').then(m => ({ default: m.PemasukanPage })));
const PengeluaranPage = lazy(() => import('../pages/owner/PengeluaranPage').then(m => ({ default: m.PengeluaranPage })));
const LaporanPage = lazy(() => import('../pages/owner/LaporanPage').then(m => ({ default: m.LaporanPage })));
const InvoicePage = lazy(() => import('../pages/owner/InvoicePage').then(m => ({ default: m.InvoicePage })));
const InvoiceDetailPage = lazy(() => import('../pages/owner/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const PengaturanPage = lazy(() => import('../pages/owner/PengaturanPage').then(m => ({ default: m.PengaturanPage })));
const AuditLogPage = lazy(() => import('../pages/owner/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const GaleriFotoPage = lazy(() => import('../pages/owner/GaleriFotoPage').then(m => ({ default: m.GaleriFotoPage })));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '8px', color: 'var(--text-muted)' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      <span>Memuat halaman...</span>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rental App Layout Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Mobil */}
            <Route path="/mobil" element={<MobilPage />} />
            <Route path="/mobil/:id" element={<MobilDetailPage />} />

            {/* Galeri Foto Mobil */}
            <Route path="/galeri-foto" element={<GaleriFotoPage />} />

            {/* Booking */}
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/:id" element={<BookingDetailPage />} />

            {/* Kalender */}
            <Route path="/kalender" element={<KalenderPage />} />

            {/* Customer */}
            <Route path="/customer" element={<CustomerPage />} />
            <Route path="/customer/:id" element={<CustomerDetailPage />} />

            {/* Driver */}
            <Route path="/driver" element={<DriverPage />} />

            {/* Pemasukan & Pengeluaran */}
            <Route path="/pemasukan" element={<PemasukanPage />} />
            <Route path="/pengeluaran" element={<PengeluaranPage />} />

            {/* Laporan & Invoice */}
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/invoice" element={<InvoicePage />} />
            <Route path="/invoice/:id" element={<InvoiceDetailPage />} />

            {/* Pengaturan & Audit */}
            <Route path="/pengaturan" element={<PengaturanPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
