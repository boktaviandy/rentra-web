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

  // Login handler supporting Username and Email via Supabase Auth
  const login = useCallback(async (identifier, password) => {
    setIsLoading(true);
    setAuthError('');

    const cleanInput = identifier.trim().toLowerCase();
    if (!cleanInput || !password) {
      setAuthError('Username dan password wajib diisi.');
      setIsLoading(false);
      return { success: false };
    }

    try {
      let targetEmail = cleanInput;

      // If input is a username (doesn't contain '@'), resolve email using secure RPC
      if (!cleanInput.includes('@')) {
        const { data: resolved, error: rpcError } = await supabase.rpc('resolve_login_username', {
          p_username: cleanInput,
        });

        if (!rpcError && resolved && resolved.length > 0 && resolved[0]?.email) {
          targetEmail = resolved[0].email;
        } else {
          // Direct query fallback if RPC is not yet created on server
          const { data: userRow } = await supabase
            .from('users')
            .select('email')
            .ilike('username', cleanInput)
            .maybeSingle();

          if (userRow?.email) {
            targetEmail = userRow.email;
          }
        }
      }

      // Authenticate via Supabase Auth GoTrue engine
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (error) {
        setAuthError('Username atau password salah. Silakan periksa kembali.');
        setIsLoading(false);
        return { success: false };
      }

      if (data?.session?.user) {
        const profile = await fetchUserProfile(data.session.user);
        setCurrentUser(profile);
        setIsLoading(false);
        return { success: true, user: profile };
      }

      setAuthError('Username atau password salah.');
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

  // Profile update handler (Sanitized for public.users schema)
  const updateProfile = useCallback(async (profileUpdates) => {
    // Only send fields that actually exist in public.users schema
    const validUserColumns = ['nama', 'noHp', 'avatar', 'username', 'email'];
    const cleanUpdates = {};
    if (profileUpdates && typeof profileUpdates === 'object') {
      Object.keys(profileUpdates).forEach((key) => {
        if (validUserColumns.includes(key)) {
          cleanUpdates[key] = profileUpdates[key];
        }
      });
    }

    setCurrentUser((prev) => {
      const updated = { ...prev, ...profileUpdates };
      return updated;
    });

    if (currentUser?.id && Object.keys(cleanUpdates).length > 0) {
      try {
        const { error } = await supabase
          .from('users')
          .upsert({ id: currentUser.id, ...cleanUpdates });
        if (error) console.error('Failed to update user profile in DB:', error);
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
