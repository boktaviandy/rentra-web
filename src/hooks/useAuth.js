import { useState, useEffect, useCallback } from 'react';

const CURRENT_USER_KEY = 'rentra_user_session';

const DEFAULT_PROFILE = {
  id: 'USR-001',
  username: 'admin',
  password: 'password123',
  namaRental: 'Garuda Rent Car',
  namaOwner: 'Budi Pratama',
  email: 'owner@garudarent.com',
  noHp: '0812-9900-1122',
  role: 'Owner',
  kota: 'Jakarta',
};

export function getStoredUser() {
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    let user = saved ? JSON.parse(saved) : DEFAULT_PROFILE;

    // Check if settings has custom username/password
    const settingsRaw = localStorage.getItem('rentra_v2_settings');
    if (settingsRaw) {
      const parsedSettings = JSON.parse(settingsRaw);
      if (Array.isArray(parsedSettings) && parsedSettings[0]) {
        const s = parsedSettings[0];
        user = {
          ...user,
          username: s.username || user.username || 'admin',
          password: s.password || user.password || 'password123',
          namaRental: s.namaRental || user.namaRental,
          namaOwner: s.namaOwner || user.namaOwner,
          logo: s.logo || user.logo,
        };
      }
    }
    return user;
  } catch (e) {
    console.error('Failed to parse user session', e);
  }
  return DEFAULT_PROFILE;
}


export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getStoredUser());
    };

    window.addEventListener('rentra_auth_change', handleAuthChange);
    return () => window.removeEventListener('rentra_auth_change', handleAuthChange);
  }, []);

  const login = useCallback((userData) => {
    let user = DEFAULT_PROFILE;
    if (typeof userData === 'object' && userData !== null) {
      user = { ...DEFAULT_PROFILE, ...userData };
    } else if (typeof userData === 'string') {
      user = { ...DEFAULT_PROFILE, email: userData };
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    setCurrentUser(user);
    window.dispatchEvent(new Event('rentra_auth_change'));
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('rentra_current_tenant');
    setCurrentUser(null);
    window.dispatchEvent(new Event('rentra_auth_change'));
  }, []);

  const updateProfile = useCallback((profileUpdates) => {
    const current = getStoredUser();
    const updated = { ...current, ...profileUpdates };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    setCurrentUser(updated);
    window.dispatchEvent(new Event('rentra_auth_change'));
    return updated;
  }, []);

  return {
    currentUser,
    currentTenant: currentUser, // Backwards compatibility for existing components
    login,
    loginTenant: login, // Backwards compatibility
    logout,
    updateProfile,
  };
}



