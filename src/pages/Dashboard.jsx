import React, { useMemo, Suspense, lazy } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';

// Lazy load heavy dashboard views
const AnalyticsView = lazy(() => import('../components/dashboard/AnalyticsView'));
const PrioritizedFeed = lazy(() => import('../components/dashboard/PrioritizedFeed'));
const UserComplaints = lazy(() => import('../components/dashboard/UserComplaints'));

// Memoized Tab Container to prevent re-renders of the content when other tabs change
const TabContainer = React.memo(({ active, children }) => {
  return (
    <div 
      className={`absolute inset-0 h-full overflow-y-auto pt-12 pb-20 px-10 transition-[opacity,transform] duration-300 ease-out will-change-[opacity,transform] ${
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

  // Pre-calculate memoized views to avoid re-creating them on every render
  // These only update if global complaints data or loading state changes
  const analyticsContent = useMemo(() => (
    <Suspense fallback={null}>
      <AnalyticsView complaints={complaints} loading={loading} />
    </Suspense>
  ), [complaints, loading]);

  const feedContent = useMemo(() => (
    <Suspense fallback={null}>
      <PrioritizedFeed complaints={complaints} loading={loading} />
    </Suspense>
  ), [complaints, loading]);

  const userRoutesContent = useMemo(() => (
    <Suspense fallback={null}>
      <UserComplaints userId={user?.id} />
    </Suspense>
  ), [user?.id]);

  return (
    <>
      <TabContainer active={activeTab === 'analytics'}>
        {analyticsContent}
      </TabContainer>

      <TabContainer active={activeTab === 'feed'}>
        {feedContent}
      </TabContainer>

      <TabContainer active={activeTab === 'my-complaints'}>
        {userRoutesContent}
      </TabContainer>

      {/* Hidden Outlet for React Router consistency */}
      <div className="hidden"><Outlet /></div>
    </>
  );
};

export default Dashboard;
