import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import BackgroundEffects from '../components/landing/BackgroundEffects';
import Sidebar from '../components/dashboard/Sidebar';
import AnalyticsView from '../components/dashboard/AnalyticsView';
import PrioritizedFeed from '../components/dashboard/PrioritizedFeed';
import UserComplaints from '../components/dashboard/UserComplaints';
import { useLocation, useNavigate, Navigate, Outlet } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/');
    const last = segments.pop();
    // If the path is just /dashboard/, pop() might be empty or 'dashboard'
    if (!last || last === 'dashboard') return 'analytics';
    return last;
  }, [location.pathname]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    checkUser();
    
    let mounted = true;
    const fetchGlobalData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('issues')
          .select('*, departments(name)')
          .order('priority_score', { ascending: false });

        if (error) throw error;
        if (mounted) setComplaints(data || []);
      } catch (err) {
        console.error('Error fetching global dashboard data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGlobalData();
    return () => { mounted = false; };
  }, []);

  // Persistent Tab Rendering
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 flex overflow-hidden">
      <BackgroundEffects />
      
      <Sidebar user={user} />

      <main className="flex-1 ml-72 h-screen overflow-hidden relative">
        {/* Invisible Outlet for React Router consistency */}
        <div className="hidden"><Outlet /></div>

        {/* Analytics Tab */}
        <div 
          className={`absolute inset-0 h-full overflow-y-auto pt-12 pb-20 px-10 transition-[opacity,transform] duration-300 ease-out ${activeTab === 'analytics' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
        >
          <div className="max-w-7xl mx-auto">
            <AnalyticsView complaints={complaints} loading={loading} />
          </div>
        </div>

        {/* Feed Tab */}
        <div 
          className={`absolute inset-0 h-full overflow-y-auto pt-12 pb-20 px-10 transition-[opacity,transform] duration-300 ease-out ${activeTab === 'feed' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
        >
          <div className="max-w-7xl mx-auto">
            <PrioritizedFeed complaints={complaints} loading={loading} />
          </div>
        </div>

        {/* My Complaints Tab */}
        <div 
          className={`absolute inset-0 h-full overflow-y-auto pt-12 pb-20 px-10 transition-[opacity,transform] duration-300 ease-out ${activeTab === 'my-complaints' ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
        >
          <div className="max-w-7xl mx-auto">
            <UserComplaints userId={user?.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
