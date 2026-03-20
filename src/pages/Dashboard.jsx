import React, { useMemo } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';

import AnalyticsView from '../components/dashboard/AnalyticsView';
import PrioritizedFeed from '../components/dashboard/PrioritizedFeed';
import UserComplaints from '../components/dashboard/UserComplaints';
import IssueMap from '../components/dashboard/IssueMap';

// Gamification Early Views
const ImpactView = React.lazy(() => import('../components/dashboard/ImpactView'));
const AchievementsView = React.lazy(() => import('../components/dashboard/AchievementsView'));
const LeaderboardView = React.lazy(() => import('../components/dashboard/LeaderboardView'));
const ProfileView = React.lazy(() => import('../components/dashboard/ProfileView'));

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
    const segments = location.pathname.split('/').filter(Boolean);
    const dashboardIndex = segments.indexOf('dashboard');
    if (dashboardIndex === -1 || dashboardIndex === segments.length - 1) return 'analytics';
    return segments[dashboardIndex + 1];
  }, [location.pathname]);

  const AuthoritiesView = React.lazy(() => import('../components/dashboard/AuthoritiesView'));

  return (
    <>
      <TabContainer active={activeTab === 'analytics'}>
        <AnalyticsView complaints={complaints} loading={loading} />
      </TabContainer>

      <TabContainer active={activeTab === 'map'}>
        <div className="h-[75vh] w-full mt-4">
          <IssueMap issues={complaints} loading={loading} />
        </div>
      </TabContainer>

      <TabContainer active={activeTab === 'feed'}>
        <PrioritizedFeed complaints={complaints} loading={loading} />
      </TabContainer>

      <TabContainer active={activeTab === 'my-complaints'}>
        <UserComplaints userId={user?.id} />
      </TabContainer>

      <TabContainer active={activeTab === 'impact'}>
        <React.Suspense fallback={null}>
          <ImpactView />
        </React.Suspense>
      </TabContainer>

      <TabContainer active={activeTab === 'achievements'}>
        <React.Suspense fallback={null}>
          <AchievementsView />
        </React.Suspense>
      </TabContainer>

      <TabContainer active={activeTab === 'leaderboard'}>
        <React.Suspense fallback={null}>
          <LeaderboardView isActive={activeTab === 'leaderboard'} />
        </React.Suspense>
      </TabContainer>

      <TabContainer active={activeTab === 'profile'}>
        <React.Suspense fallback={null}>
          <ProfileView />
        </React.Suspense>
      </TabContainer>
      
      <TabContainer active={activeTab === 'responsible-authorities'}>
        <React.Suspense fallback={null}>
          <AuthoritiesView />
        </React.Suspense>
      </TabContainer>

      <div className="hidden"><Outlet /></div>
    </>
  );
};

export default Dashboard;
