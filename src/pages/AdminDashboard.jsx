import React, { useMemo, Suspense, lazy } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useIssues } from '../context/IssueContext';

const AdminAnalyticsView = lazy(() => import('../components/admin/AdminAnalyticsView'));
const AdminDepartmentView = lazy(() => import('../components/admin/AdminDepartmentView'));
import IssueMap from '../components/dashboard/IssueMap';

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

const AdminDashboard = () => {
  const { complaints, loading, isAdmin } = useIssues();
  const location = useLocation();
  const { departmentId } = useParams();

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/');
    const last = segments.pop();
    if (last === 'analytics') return 'analytics';
    if (last === 'map') return 'map';
    if (departmentId) return departmentId;
    return 'analytics';
  }, [location.pathname, departmentId]);

  const viewTitle = useMemo(() => {
    switch (departmentId) {
      case 'drainage-flooding': return 'Drainage & Flooding';
      case 'waste-sanitation': return 'Waste & Sanitation';
      case 'roads-bridges': return 'Roads & Bridges';
      case 'water-supply': return 'Water Supply';
      case 'electricity': return 'Electricity';
      case 'others': return 'Others';
      default: return 'Analytics';
    }
  }, [departmentId]);

  return (
    <>
      <TabContainer active={activeTab === 'analytics'}>
        <Suspense fallback={null}>
          <AdminAnalyticsView complaints={complaints} loading={loading} />
        </Suspense>
      </TabContainer>

      <TabContainer active={activeTab === 'map'}>
        <div className="h-[75vh] w-full mt-4">
          <IssueMap issues={complaints} loading={loading} />
        </div>
      </TabContainer>

      {/* Dynamic Department Views */}
      <TabContainer active={activeTab !== 'analytics' && activeTab !== 'map'}>
        <Suspense fallback={null}>
          <AdminDepartmentView 
            title={viewTitle} 
            complaints={complaints} 
            loading={loading} 
            isAdmin={isAdmin} 
          />
        </Suspense>
      </TabContainer>
    </>
  );
};

export default AdminDashboard;
