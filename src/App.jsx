import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <IssueProvider>
        <RootLayout>
          <Routes>
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
                <Route path="analytics" element={null} />
                <Route path="map" element={null} />
                <Route path="feed" element={null} />
                <Route path="community" element={null} />
                <Route path="my-complaints" element={null} />
                <Route path="impact" element={null} />
                <Route path="achievements" element={null} />
                <Route path="leaderboard" element={null} />
                <Route path="profile" element={null} />
                <Route path="responsible-authorities" element={null} />
                <Route path="responsible-authorities/:id" element={null} />
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
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RootLayout>
      </IssueProvider>
    </Router>
  );
}

export default App;
