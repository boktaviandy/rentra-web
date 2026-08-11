import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SESSION_KEY = 'rentra_user_session';

export function getStoredUser() {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getStoredUser());
    };

    window.addEventListener('rentra_auth_change', handleAuthChange);
    return () => window.removeEventListener('rentra_auth_change', handleAuthChange);
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError('');

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('"passwordHash"', password)
        .maybeSingle();

      // Fallback: try without quoting (different Supabase configs)
      let user = data;
      if (!user && !error) {
        const { data: data2 } = await supabase
          .from('users')
          .select('*')
          .ilike('email', email.trim())
          .maybeSingle();

        if (data2 && data2.passwordHash === password) {
          user = data2;
        }
      }

      if (error) {
        setAuthError('Terjadi kesalahan saat menghubungi server. Coba lagi.');
        return { success: false };
      }

      if (!user) {
        setAuthError('Email atau kata sandi salah. Silakan periksa kembali.');
        return { success: false };
      }

      // Store session
      const sessionData = {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        noHp: user.noHp || user['noHp'] || '',
        avatar: user.avatar || '',
        namaRental: user.namaRental || 'Rentra',
        namaOwner: user.nama,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      window.dispatchEvent(new Event('rentra_auth_change'));
      return { success: true, user: sessionData };
    } catch (e) {
      console.error('Login error:', e);
      setAuthError('Terjadi kesalahan tak terduga. Coba lagi.');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    window.dispatchEvent(new Event('rentra_auth_change'));
  }, []);

  const updateProfile = useCallback((profileUpdates) => {
    const current = getStoredUser();
    const updated = { ...current, ...profileUpdates };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    setCurrentUser(updated);
    window.dispatchEvent(new Event('rentra_auth_change'));
    return updated;
  }, []);

  return {
    currentUser,
    currentTenant: currentUser, // Backwards compatibility
    isLoading,
    authError,
    login,
    loginTenant: login, // Backwards compatibility
    logout,
    updateProfile,
  };
}
