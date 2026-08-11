import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { useTenantStore } from '../../hooks/useTenantStore';
import { Moon, Sun, Globe, Search, User, CarFront } from 'lucide-react';
import './Header.css';

export function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { currentLang, toggleLanguage } = useLanguage();
  const { currentUser } = useAuth();
  const { data: tenantSettings } = useTenantStore('settings');

  const activeSettings = Array.isArray(tenantSettings) && tenantSettings[0] ? tenantSettings[0] : (currentUser || {});
  const rentalLogo = activeSettings.logo || currentUser?.logo || null;
  const namaRental = activeSettings.namaRental || currentUser?.namaRental || 'Garuda Rent Car';
  const namaOwner = activeSettings.namaOwner || currentUser?.namaOwner || 'Budi Pratama';

  return (
    <div className="header-wrapper">
      <header className="app-header">
        {/* Mobile Brand on left (visible only <= 768px) */}
        <div className="mobile-header-brand">
          <div className="mobile-brand-icon-box">
            {rentalLogo ? (
              <img src={rentalLogo} alt={namaRental} className="mobile-brand-logo-img" />
            ) : (
              <CarFront size={18} />
            )}
          </div>
          <span className="mobile-brand-name">{namaRental}</span>
        </div>

        {/* Desktop Search Bar */}
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari mobil, customer, booking..."
            className="header-search-input"
          />
        </div>

        <div className="header-actions">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="header-action-btn"
            title="Ganti Bahasa / Change Language"
          >
            <Globe size={17} />
            <span className="lang-code">{currentLang.toUpperCase()}</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="header-action-btn"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* User Profile */}
          <div className="header-user">
            <div className="user-avatar" title={namaOwner}>
              <User size={16} />
            </div>
            <div className="user-info">
              <span className="user-name">{namaOwner}</span>
              <span className="user-role">{namaRental}</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
