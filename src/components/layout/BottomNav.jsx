import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  FileText,
  Menu,
  X,
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  Settings,
  History,
  ImagePlus,
  LogOut,
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import './BottomNav.css';

export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDrawer, setShowDrawer] = useState(false);

  const mainNav = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/booking', label: t('nav.booking'), icon: FileText },
    { path: '/kalender', label: t('nav.kalender'), icon: CalendarDays },
    { path: '/mobil', label: t('nav.mobil'), icon: Car },
  ];

  const drawerNav = [
    { path: '/galeri-foto', label: 'Galeri Foto', icon: ImagePlus },
    { path: '/customer', label: t('nav.customer'), icon: Users },
    { path: '/driver', label: t('nav.driver'), icon: UserCheck },
    { path: '/pemasukan', label: t('nav.pemasukan'), icon: TrendingUp },
    { path: '/pengeluaran', label: t('nav.pengeluaran'), icon: TrendingDown },
    { path: '/laporan', label: t('nav.laporan'), icon: BarChart3 },
    { path: '/invoice', label: t('nav.invoice'), icon: Receipt },
    { path: '/audit-log', label: 'Audit Log', icon: History },
    { path: '/pengaturan', label: t('nav.pengaturan'), icon: Settings },
  ];


  return (
    <>
      <nav className="bottom-nav">
        {mainNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `bottom-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={22} />
            </NavLink>
          );
        })}

        <button
          className={`bottom-nav-item ${showDrawer ? 'active' : ''}`}
          onClick={() => setShowDrawer(!showDrawer)}
          title="Menu Lainnya"
        >
          {showDrawer ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {showDrawer && (
        <div className="mobile-drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <h3>Menu Rentra</h3>
              <button onClick={() => setShowDrawer(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-grid">
              {drawerNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    className="drawer-grid-item"
                    title={item.label}
                    onClick={() => {
                      navigate(item.path);
                      setShowDrawer(false);
                    }}
                  >
                    <div className="drawer-icon-box">
                      <Icon size={20} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mobile-drawer-footer">
              <button
                className="mobile-drawer-logout-btn"
                title={t('nav.logout')}
                onClick={() => {
                  setShowDrawer(false);
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


