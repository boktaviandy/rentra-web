import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Fetch profile for the authenticated user from users or settings table
  const fetchUserProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    try {
      // Query users profile table by Supabase Auth User ID
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userProfile) {
        return {
          id: userProfile.id,
          nama: userProfile.nama || authUser.user_metadata?.nama || authUser.email?.split('@')[0] || 'User',
          email: userProfile.email || authUser.email,
          role: userProfile.role || 'owner',
          noHp: userProfile.noHp || '',
          avatar: userProfile.avatar || '',
        };
      }
    } catch (e) {
      console.warn('User profile query error:', e);
    }

    // Fallback profile from Supabase Auth metadata
    return {
      id: authUser.id,
      nama: authUser.user_metadata?.nama || authUser.email?.split('@')[0] || 'Admin',
      email: authUser.email,
      role: 'owner',
      noHp: '',
      avatar: '',
    };
  }, []);

  // Initialize and listen to Supabase Auth State
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            const profile = await fetchUserProfile(currentSession.user);
            if (isMounted) setCurrentUser(profile);
          } else {
            setCurrentUser(null);
          }
        }
      } catch (e) {
        console.error('Error initializing auth session:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);

      if (newSession?.user) {
        const profile = await fetchUserProfile(newSession.user);
        if (isMounted) setCurrentUser(profile);
      } else {
        if (isMounted) setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Login handler strictly using Supabase Auth
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        setAuthError(error.message || 'Email atau kata sandi salah. Silakan periksa kembali.');
        setIsLoading(false);
        return { success: false };
      }

      if (data?.session?.user) {
        const profile = await fetchUserProfile(data.session.user);
        setCurrentUser(profile);
        setIsLoading(false);
        return { success: true, user: profile };
      }

      setAuthError('Email atau kata sandi salah.');
      setIsLoading(false);
      return { success: false };
    } catch (e) {
      console.error('Login error:', e);
      setAuthError('Terjadi kesalahan tak terduga. Coba lagi.');
      setIsLoading(false);
      return { success: false };
    }
  }, [fetchUserProfile]);

  // Logout handler
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setCurrentUser(null);
      setSession(null);
      setIsLoading(false);
    }
  }, []);

  // Profile update handler
  const updateProfile = useCallback(async (profileUpdates) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...profileUpdates };
      return updated;
    });

    if (currentUser?.id) {
      try {
        await supabase
          .from('users')
          .upsert({ id: currentUser.id, ...profileUpdates });
      } catch (e) {
        console.error('Failed to update user profile in DB:', e);
      }
    }
  }, [currentUser?.id]);

  return {
    currentUser,
    session,
    isLoading,
    authError,
    login,
    logout,
    updateProfile,
  };
}
