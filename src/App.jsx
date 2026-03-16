import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
                <Route path="feed" element={null} />
                <Route path="my-complaints" element={null} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </RootLayout>
      </IssueProvider>
    </Router>
  );
}

export default App;
