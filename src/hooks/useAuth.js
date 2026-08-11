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

    const cleanEmail = email.trim().toLowerCase();

    try {
      let foundUser = null;

      // 1. Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('authenticate_user', {
        p_email: cleanEmail,
        p_password: password
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        foundUser = rpcData[0];
      } else {
        // 2. Fallback to direct table query
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (dbUser) {
          const storedPassword = dbUser.passwordHash ?? dbUser['passwordHash'] ?? dbUser.password_hash ?? '';
          if (storedPassword === password) {
            foundUser = dbUser;
          }
        }
      }

      // 3. Fallback default admin credentials (ensures zero lockout)
      if (!foundUser && cleanEmail === 'admin@rentra.com' && password === 'admin123') {
        foundUser = {
          id: 'admin-default-id',
          nama: 'Admin Rentra',
          email: 'admin@rentra.com',
          role: 'owner',
          noHp: '0812-9900-1122',
          avatar: ''
        };
      }

      if (!foundUser) {
        setAuthError('Email atau kata sandi salah. Silakan periksa kembali.');
        return { success: false };
      }

      // Store session
      const sessionData = {
        id: foundUser.id,
        nama: foundUser.nama,
        email: foundUser.email,
        role: foundUser.role || 'owner',
        noHp: foundUser.noHp || '',
        avatar: foundUser.avatar || '',
        namaRental: 'Rentra',
        namaOwner: foundUser.nama,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setCurrentUser(sessionData);
      window.dispatchEvent(new Event('rentra_auth_change'));
      return { success: true, user: sessionData };
    } catch (e) {
      console.error('Login error:', e);

      // Fallback check on unexpected exception
      if (cleanEmail === 'admin@rentra.com' && password === 'admin123') {
        const sessionData = {
          id: 'admin-default-id',
          nama: 'Admin Rentra',
          email: 'admin@rentra.com',
          role: 'owner',
          noHp: '0812-9900-1122',
          avatar: '',
          namaRental: 'Rentra',
          namaOwner: 'Admin Rentra'
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        setCurrentUser(sessionData);
        window.dispatchEvent(new Event('rentra_auth_change'));
        return { success: true, user: sessionData };
      }

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
