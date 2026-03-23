import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const IssueContext = createContext();

export const IssueProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [userUpvotes, setUserUpvotes] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [citizensCount, setCitizensCount] = useState(0);
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
      console.log('IssueContext: Global issues fetched', (data || []).length);
    } catch (err) {
      console.error('IssueContext: Error fetching global issues:', err);
    }
  }, []);

  const fetchCitizensCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_citizens_engaged_count');
      if (error) throw error;
      setCitizensCount(Number(data) || 0);
    } catch (err) {
      console.error('IssueContext: Error fetching citizens count:', err);
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

  const fetchUserUpvotes = useCallback(async (userId) => {
    if (!userId) {
      setUserUpvotes([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('issue_supports')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setUserUpvotes(data || []);
    } catch (err) {
      console.error('IssueContext: Error fetching user upvotes:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!actor_user_id(username, avatar_url, role, id),
          issue:related_issue_id(*),
          complaint:related_complaint_id(*),
          post:related_post_id(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      console.log('IssueContext: Notifications fetched', (data || []).length);
    } catch (err) {
      console.error('IssueContext: Error fetching notifications:', err);
    }
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      return { success: true };
    } catch (err) {
      console.error('IssueContext: Error marking notification as read:', err);
      return { error: err.message };
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const currentUser = userRef.current;
    if (!currentUser) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true, profile: data };
    } catch (err) {
      console.error('IssueContext: Error updating profile:', err);
      return { error: err.message || 'Failed to update profile' };
    }
  }, []);

  const uploadAvatar = useCallback(async (file) => {
    const currentUser = userRef.current;
    if (!currentUser) return { error: 'Not authenticated' };

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      return { success: true, avatarUrl: publicUrl };
    } catch (err) {
      console.error('IssueContext: Error uploading avatar:', err);
      return { error: err.message || 'Failed to upload avatar' };
    }
  }, []);

  const upvoteIssue = useCallback(async (issueId) => {
    const currentUser = userRef.current;
    if (!currentUser) return { error: 'Must be logged in' };

    try {
      const { data, error } = await supabase
        .from('issue_supports')
        .insert({ issue_id: issueId, user_id: currentUser.id })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') return { error: 'Already upvoted' };
        throw error;
      }

      setUserUpvotes(prev => [...prev, data]);
      return { success: true };
    } catch (err) {
      console.error('IssueContext: Error upvoting issue:', err);
      return { error: err.message };
    }
  }, []);

  const updateIssue = useCallback(async (issueId, updates) => {
    // 1. Optimistic local update
    setComplaints(prev => {
      const updated = prev.map(c => 
        c.id === issueId ? { ...c, ...updates } : c
      );
      // Preserve existing sort by priority score
      return updated.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    });

    try {
      // If status is being updated to Resolved, set resolved_at
      const finalUpdates = { ...updates };
      if (updates.status === 'Resolved') {
        finalUpdates.resolved_at = new Date().toISOString();
      }

      // 2. Remote DB update
      const { error } = await supabase
        .from('issues')
        .update(finalUpdates)
        .eq('id', issueId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('IssueContext: Error updating issue:', err);
      // Revert on error - fetch fresh data to ensure consistency
      fetchGlobalData(true);
      return { error: err.message };
    }
  }, [fetchGlobalData]);

  // Combined initialization logic
  useEffect(() => {
    let active = true;
    let initialFetchAttempted = false;

    const syncFullData = async (currentUser) => {
      console.log('IssueContext: Syncing data for', currentUser?.id || 'guest');
      
      try {
        const fetchPromises = [
          fetchGlobalData(true),
          fetchCitizensCount()
        ];
        
        if (currentUser) {
          fetchPromises.push(fetchProfile(currentUser.id));
          fetchPromises.push(fetchUserReports(currentUser.id));
          fetchPromises.push(fetchUserUpvotes(currentUser.id));
          fetchPromises.push(fetchNotifications(currentUser.id));
        } else {
          // If guest, clear private data
          setProfile(null);
          setUserReports([]);
          setUserUpvotes([]);
          setNotifications([]);
        }
        
        await Promise.all(fetchPromises);
        console.log('IssueContext: Sync completed');
      } catch (err) {
        console.error('IssueContext: Sync failed', err);
      }
    };

    const initialize = async () => {
      if (initialFetchAttempted) return;
      
      console.log('INIT 1/4: Establishing session...');
      setLoading(true);

      // HARD FAILSAFE: Never stay in loading more than 10s
      const timeout = setTimeout(() => {
        if (active) {
          console.warn('INIT TIMEOUT: Emergency breakout');
          setLoading(false);
        }
      }, 10000);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('INIT ERROR: Session restore failure:', sessionError);
          if (sessionError.status === 400 || sessionError.message?.includes('Refresh Token Not Found')) {
            console.warn('STALE STATE DETECTED: Hard clearing Supabase storage keys');
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase.auth.token') || key.startsWith('sb-')) {
                localStorage.removeItem(key);
              }
            });
            localStorage.removeItem('isAdmin');
          }
          throw sessionError;
        }
        
        if (!active) return;

        const currentUser = session?.user ?? null;
        console.log('INIT 2/4: User identification:', currentUser?.id || 'guest');
        
        if (!currentUser) {
          localStorage.removeItem('isAdmin');
        }
        
        setUser(currentUser);
        
        console.log('INIT 3/4: Primary data sync');
        await syncFullData(currentUser);
        
        initialFetchAttempted = true;
        console.log('INIT 4/4: Complete');
      } catch (err) {
        console.error('INIT ERROR:', err);
      } finally {
        if (active) {
          setLoading(false);
          clearTimeout(timeout);
        }
      }
    };
    
    // First-shot initialization
    initialize();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      console.log('IssueContext: Auth event [', event, ']', newUser?.id || 'none');
      
      if (!active) return;

      // Update basic state
      setUser(newUser);

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('isAdmin');
        setProfile(null);
        setUserReports([]);
        setUserUpvotes([]);
        setNotifications([]);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // If we are already logged in and it's a refresh or update, just sync
        // But if we are initializing, the initialize() function handles the first sync
        if (initialFetchAttempted) {
          syncFullData(newUser);
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
            const updatedIssue = payload.new;
            
            // Update global complaints array
            setComplaints(prev => {
              const updated = prev.map(c => 
                c.id === updatedIssue.id ? { ...c, ...updatedIssue } : c
              );
              return updated.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
            });

            // CRITICAL: Also update any relevant issues nested inside userReports (for the User Dashboard)
            setUserReports(prev => prev.map(report => {
              if (report.issues?.id === updatedIssue.id) {
                return {
                  ...report,
                  issues: { ...report.issues, ...updatedIssue }
                };
              }
              // Handle case where issue might be directly on the report object
              if (report.id === updatedIssue.id || report.issue_id === updatedIssue.id) {
                return { ...report, ...updatedIssue };
              }
              return report;
            }));
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          const currentUser = userRef.current;
          if (!active || !currentUser) return;
          const isRelevant = payload.new?.user_id === currentUser.id || payload.old?.user_id === currentUser.id;
          if (isRelevant) {
            if (payload.eventType === 'INSERT') {
              // Fetch again to get the actor profile join correctly?
              // Or just manually fetch notifications on insert
              fetchNotifications(currentUser.id);
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n));
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
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
  }, [fetchProfile, fetchGlobalData, fetchUserReports, fetchUserUpvotes, fetchNotifications]);

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

  const refreshData = useCallback(() => {
    fetchGlobalData(true);
    fetchCitizensCount();
  }, [fetchGlobalData, fetchCitizensCount]);
  
  const refreshUserReports = useCallback(() => {
    if (user) fetchUserReports(user.id);
  }, [user, fetchUserReports]);

  const value = useMemo(() => ({
    user,
    profile,
    isAdmin,
    complaints,
    citizensCount,
    userReports,
    userUpvotes,
    loading,
    userReportsLoading,
    signOut: handleSignOut,
    refreshData,
    refreshUserReports,
    upvoteIssue,
    updateIssue,
    updateProfile,
    uploadAvatar,
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length,
    markNotificationAsRead
  }), [
    user, 
    profile, 
    isAdmin, 
    complaints, 
    citizensCount,
    userReports, 
    userUpvotes,
    loading, 
    userReportsLoading, 
    handleSignOut, 
    refreshData, 
    refreshUserReports,
    upvoteIssue,
    updateIssue,
    updateProfile,
    uploadAvatar,
    notifications
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
