import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ReportIssue from './pages/ReportIssue';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/report" 
          element={
            <ProtectedRoute>
              <ReportIssue />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        >
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="analytics" element={null} />
          <Route path="feed" element={null} />
          <Route path="my-complaints" element={null} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
