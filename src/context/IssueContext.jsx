import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const IssueContext = createContext();

export const IssueProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userReportsLoading, setUserReportsLoading] = useState(false);
  const isFetchedRef = useRef(false);

  const fetchGlobalData = useCallback(async (force = false) => {
    if (isFetchedRef.current && !force) return;
    
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*, departments(name)')
        .order('priority_score', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
      isFetchedRef.current = true;
    } catch (err) {
      console.error('Error fetching global issues:', err);
    }
  }, []);

  const fetchUserReports = useCallback(async (userId) => {
    if (!userId) {
      setUserReports([]);
      return;
    }
    
    setUserReportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, issues(*, departments(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserReports(data || []);
    } catch (err) {
      console.error('Error fetching user reports:', err);
    } finally {
      setUserReportsLoading(false);
    }
  }, []);

  // Combined initialization logic
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Fetch data
        await fetchGlobalData();
        if (currentUser && active) {
          await fetchUserReports(currentUser.id);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    initialize();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      if (active) {
        setUser(newUser);
        if (newUser) {
          fetchUserReports(newUser.id);
        } else {
          setUserReports([]);
        }
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
          if (!active || !user) return;
          const isRelevant = payload.new?.user_id === user.id || payload.old?.user_id === user.id;
          if (isRelevant) {
            if (payload.eventType === 'INSERT') {
              fetchUserReports(user.id);
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
  }, [fetchGlobalData, fetchUserReports, user?.id]);

  const value = {
    user,
    complaints,
    userReports,
    loading,
    userReportsLoading,
    refreshData: () => fetchGlobalData(true),
    refreshUserReports: () => user && fetchUserReports(user.id)
  };

  return <IssueContext.Provider value={value}>{children}</IssueContext.Provider>;
};

export const useIssues = () => {
  const context = useContext(IssueContext);
  if (!context) {
    throw new Error('useIssues must be used within an IssueProvider');
  }
  return context;
};
