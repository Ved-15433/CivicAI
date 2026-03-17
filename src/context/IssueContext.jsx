import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const IssueContext = createContext();

export const IssueProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReportsLoading, setUserReportsLoading] = useState(false);
  const isFetchedRef = useRef(false);
  const userRef = useRef(null);

  // Keep userRef in sync with user state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      console.log('IssueContext: No userId provided to fetchProfile');
      setProfile(null);
      return;
    }
    
    console.log('IssueContext: Fetching profile for', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('IssueContext: Profile not found, using default user role');
          setProfile({ id: userId, role: 'user' });
        } else {
          throw error;
        }
      } else {
        console.log('IssueContext: Profile fetched successfully:', data.role);
        setProfile(data);
      }
    } catch (err) {
      console.error('IssueContext: Error fetching profile:', err);
      // Fallback to avoid infinite loading
      setProfile({ id: userId, role: 'user' });
    }
  }, []);

  const fetchGlobalData = useCallback(async (force = false) => {
    if (isFetchedRef.current && !force) return;
    
    console.log('IssueContext: Fetching global issues');
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*, departments(name)')
        .order('priority_score', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
      isFetchedRef.current = true;
      console.log('IssueContext: Global issues fetched');
    } catch (err) {
      console.error('IssueContext: Error fetching global issues:', err);
    }
  }, []);

  const fetchUserReports = useCallback(async (userId) => {
    if (!userId) {
      setUserReports([]);
      return;
    }
    
    console.log('IssueContext: Fetching user reports for', userId);
    setUserReportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, issues(*, departments(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReports(data || []);
      console.log('IssueContext: User reports fetched');
    } catch (err) {
      console.error('IssueContext: Error fetching user reports:', err);
    } finally {
      setUserReportsLoading(false);
    }
  }, []);

  // Combined initialization logic
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      console.log('INIT 1/4: Establishing session...');
      setLoading(true);

      // HARD FAILSAFE: Never stay in loading more than 2s
      const timeout = setTimeout(() => {
        if (active) {
          console.warn('INIT TIMEOUT: Emergency breakout');
          setLoading(false);
        }
      }, 2000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (!active) return;

        const currentUser = session?.user ?? null;
        console.log('INIT 2/4: User identification:', currentUser?.id || 'guest');
        setUser(currentUser);

        // Start fetches
        console.log('INIT 3/4: Data sync started');
        fetchGlobalData();
        if (currentUser) {
          // IMPORTANT: We must wait for the profile to determine isAdmin status
          // before we stop the loading state, or ProtectedRoutes will redirect.
          await fetchProfile(currentUser.id);
          // Reports can stay backgrounded
          fetchUserReports(currentUser.id);
        }

      } catch (err) {
        console.error('INIT ERROR:', err);
      } finally {
        if (active) {
          console.log('INIT 4/4: Resolving loading state');
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    };
    
    initialize();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      console.log('IssueContext: Auth state change [', event, '], user:', newUser?.id || 'none');
      
      if (!active) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setUserReports([]);
        setLoading(false);
        return;
      }

      // Update user state
      setUser(newUser);

      if (newUser) {
        // Fetch fresh data for the new user
        await Promise.all([
          fetchProfile(newUser.id),
          fetchUserReports(newUser.id)
        ]);
      } else {
        setProfile(null);
        setUserReports([]);
      }
    });

    const channel = supabase
      .channel('global_issues_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        (payload) => {
          if (!active) return;
          if (payload.eventType === 'INSERT') {
            fetchGlobalData(true);
          } else if (payload.eventType === 'DELETE') {
            setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setComplaints(prev => {
              const updated = prev.map(c => 
                c.id === payload.new.id ? { ...c, ...payload.new } : c
              );
              return updated.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          const currentUser = userRef.current;
          if (!active || !currentUser) return;
          const isRelevant = payload.new?.user_id === currentUser.id || payload.old?.user_id === currentUser.id;
          if (isRelevant) {
            if (payload.eventType === 'INSERT') {
              fetchUserReports(currentUser.id);
            } else if (payload.eventType === 'DELETE') {
              setUserReports(prev => prev.filter(r => r.id !== payload.old.id));
            } else if (payload.eventType === 'UPDATE') {
              setUserReports(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
            }
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchProfile, fetchGlobalData, fetchUserReports]);

  const signOut = useCallback(async () => {
    try {
      console.log('IssueContext: Signing out...');
      await supabase.auth.signOut();
      
      // Force clear all state immediately to avoid UI lag
      setUser(null);
      setProfile(null);
      setUserReports([]);
      setLoading(false);
      
      // Force hard redirect to login to clear any cached data/state
      window.location.href = '/login';
    } catch (err) {
      console.error('IssueContext: Sign out error:', err);
      // Even on error, try to redirect
      window.location.href = '/login';
    }
  }, []);

  const isAdmin = useMemo(() => 
    profile?.role === 'admin' || localStorage.getItem('isAdmin') === 'true', 
  [profile]);

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem('isAdmin');
    await signOut();
  }, [signOut]);

  const refreshData = useCallback(() => fetchGlobalData(true), [fetchGlobalData]);
  
  const refreshUserReports = useCallback(() => {
    if (user) fetchUserReports(user.id);
  }, [user, fetchUserReports]);

  const value = useMemo(() => ({
    user,
    profile,
    isAdmin,
    complaints,
    userReports,
    loading,
    userReportsLoading,
    signOut: handleSignOut,
    refreshData,
    refreshUserReports
  }), [
    user, 
    profile, 
    isAdmin, 
    complaints, 
    userReports, 
    loading, 
    userReportsLoading, 
    handleSignOut, 
    refreshData, 
    refreshUserReports
  ]);

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
};

export const useIssues = () => {
  const context = useContext(IssueContext);
  if (!context) {
    throw new Error('useIssues must be used within an IssueProvider');
  }
  return context;
};
