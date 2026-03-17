import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIssues } from '../../context/IssueContext';

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useIssues();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with the message and original path
    return <Navigate to="/login" state={{ message: "Please sign in to report a civic issue.", from: location }} replace />;
  }

  // If user is admin, they should be on /admin routes
  if (profile?.role === 'admin' && !location.pathname.startsWith('/admin')) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
