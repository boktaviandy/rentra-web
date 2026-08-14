import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../hooks/useStore';
import { Moon, Sun, Globe, Search, User, CarFront } from 'lucide-react';
import './Header.css';

export function Header() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { currentLang, toggleLanguage } = useLanguage();
  const { currentUser } = useAuth();
  const { data: rentalSettings } = useStore('settings');

  const activeSettings = Array.isArray(rentalSettings) && rentalSettings[0] ? rentalSettings[0] : {};
  const rentalLogo = activeSettings.logo || null;
  const namaRental = activeSettings.namaRental || 'Rentra';
  const namaOwner = activeSettings.namaOwner || currentUser?.nama || 'Owner';

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
          {/* Version Badge */}
          <span className="version-badge" title="Rentra Release v1.0.0">v1.0.0</span>

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
