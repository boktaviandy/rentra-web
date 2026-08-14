import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  FileText,
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  Settings,
  LogOut,
  CarFront,
  History,
  ImagePlus,
} from 'lucide-react';

import { useStore } from '../../hooks/useStore';
import './Sidebar.css';

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { data: rentalSettings } = useStore('settings');
  const activeSettings = Array.isArray(rentalSettings) && rentalSettings[0] ? rentalSettings[0] : {};
  const rentalLogo = activeSettings.logo || null;
  const namaRental = activeSettings.namaRental || 'Rentra';

  const navItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/mobil', label: t('nav.mobil'), icon: Car },
    { path: '/galeri-foto', label: 'Galeri Foto Mobil', icon: ImagePlus },
    { path: '/booking', label: t('nav.booking'), icon: FileText },
    { path: '/kalender', label: t('nav.kalender'), icon: CalendarDays },
    { path: '/customer', label: t('nav.customer'), icon: Users },
    { path: '/driver', label: t('nav.driver'), icon: UserCheck },
    { path: '/pemasukan', label: t('nav.pemasukan'), icon: TrendingUp },
    { path: '/pengeluaran', label: t('nav.pengeluaran'), icon: TrendingDown },
    { path: '/laporan', label: t('nav.laporan'), icon: BarChart3 },
    { path: '/invoice', label: t('nav.invoice'), icon: Receipt },
    { path: '/audit-log', label: 'Audit Log', icon: History },
    { path: '/pengaturan', label: t('nav.pengaturan'), icon: Settings },
  ];


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand Header: Logo Only */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          {rentalLogo ? (
            <img
              src={rentalLogo}
              alt={namaRental}
              className="brand-logo-img"
            />
          ) : (
            <CarFront size={26} className="brand-icon" />
          )}
        </div>
      </div>

      {/* Nav Menu: Icons Only */}
      <nav className="sidebar-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} className="sidebar-icon" />
              <span className="sidebar-floating-tooltip">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer: Logout Icon Only */}
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span className="sidebar-floating-tooltip">{t('nav.logout')}</span>
        </button>
      </div>

    </aside>
  );
}




