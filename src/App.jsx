import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';
import { IssueProvider } from './context/IssueContext';
import DashboardLayout from './components/layout/DashboardLayout';
import RootLayout from './components/layout/RootLayout';

// View Components
import AnalyticsView from './components/dashboard/AnalyticsView';
import IssueMap from './components/dashboard/IssueMap';
import PrioritizedFeed from './components/dashboard/PrioritizedFeed';
import UserComplaints from './components/dashboard/UserComplaints';

// Lazy Components
const ImpactView = React.lazy(() => import('./components/dashboard/ImpactView'));
const AchievementsView = React.lazy(() => import('./components/dashboard/AchievementsView'));
const LeaderboardView = React.lazy(() => import('./components/dashboard/LeaderboardView'));
const ProfileView = React.lazy(() => import('./components/dashboard/ProfileView'));
const CommunityView = React.lazy(() => import('./components/dashboard/CommunityView'));
const AuthoritiesView = React.lazy(() => import('./components/dashboard/AuthoritiesView'));

function AppContent() {
  const location = useLocation();
  
  return (
    <IssueProvider>
      <RootLayout>
        <Routes key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes with Persistent Shell */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="report" element={<ReportIssue />} />
            <Route path="dashboard" element={<Dashboard />}>
              <Route index element={<Navigate to="analytics" replace />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="map" element={
                <div className="h-[75vh] w-full mt-4">
                  <IssueMap />
                </div>
              } />
              <Route path="feed" element={<PrioritizedFeed />} />
              <Route path="community" element={
                <React.Suspense fallback={null}>
                  <CommunityView />
                </React.Suspense>
              } />
              <Route path="community/profile/:userId" element={
                <React.Suspense fallback={null}>
                  <CommunityView />
                </React.Suspense>
              } />
              <Route path="my-complaints" element={<UserComplaints />} />
              <Route path="impact" element={
                <React.Suspense fallback={null}>
                  <ImpactView />
                </React.Suspense>
              } />
              <Route path="achievements" element={
                <React.Suspense fallback={null}>
                  <AchievementsView />
                </React.Suspense>
              } />
              <Route path="leaderboard" element={
                <React.Suspense fallback={null}>
                  <LeaderboardView isActive={true} />
                </React.Suspense>
              } />
              <Route path="profile" element={
                <React.Suspense fallback={null}>
                  <ProfileView />
                </React.Suspense>
              } />
              <Route path="responsible-authorities" element={
                <React.Suspense fallback={null}>
                  <AuthoritiesView />
                </React.Suspense>
              } />
              <Route path="responsible-authorities/:id" element={
                <React.Suspense fallback={null}>
                  <AuthoritiesView />
                </React.Suspense>
              } />
            </Route>
          </Route>

          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <DashboardLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="analytics" replace />} />
            <Route path="analytics" element={<AdminDashboard />} />
            <Route path="map" element={<AdminDashboard />} />
            <Route path=":departmentId" element={<AdminDashboard />} />
            <Route path="community" element={
              <React.Suspense fallback={null}>
                <CommunityView />
              </React.Suspense>
            } />
            <Route path="community/profile/:userId" element={
              <React.Suspense fallback={null}>
                <CommunityView />
              </React.Suspense>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RootLayout>
    </IssueProvider>
  );
}

function App() {
  // SELF-HEALING: Clear stale service workers and recover from broken states
  React.useEffect(() => {
    // 1. Force unregister any legacy service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('App: Unregistered stale service worker');
        }
      });
    }

    // 2. Clear stale state keys
    if (window.location.pathname === '/login' || window.location.pathname === '/') {
       // Optional: more aggressive clearing could go here
    }
  }, []);

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
