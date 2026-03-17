import React, { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';

import AnalyticsView from '../components/dashboard/AnalyticsView';
import PrioritizedFeed from '../components/dashboard/PrioritizedFeed';
import UserComplaints from '../components/dashboard/UserComplaints';

const TabContainer = React.memo(({ active, children }) => {
  return (
    <div 
      className={`absolute inset-0 h-full overflow-y-auto pt-12 pb-20 px-10 transition-all duration-300 ${
        active 
          ? 'opacity-100 translate-y-0 pointer-events-auto z-10' 
          : 'opacity-0 translate-y-4 pointer-events-none z-0'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
});

const Dashboard = () => {
  const { user, complaints, loading } = useIssues();
  const location = useLocation();

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/');
    const last = segments.pop();
    if (!last || last === 'dashboard') return 'analytics';
    return last;
  }, [location.pathname]);

  return (
    <>
      <TabContainer active={activeTab === 'analytics'}>
        <AnalyticsView complaints={complaints} loading={loading} />
      </TabContainer>

      <TabContainer active={activeTab === 'feed'}>
        <PrioritizedFeed complaints={complaints} loading={loading} />
      </TabContainer>

      <TabContainer active={activeTab === 'my-complaints'}>
        <UserComplaints userId={user?.id} />
      </TabContainer>

      <div className="hidden"><Outlet /></div>
    </>
  );
};

export default Dashboard;
