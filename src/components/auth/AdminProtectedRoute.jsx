import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIssues } from '../../context/IssueContext';

const AdminProtectedRoute = ({ children }) => {
  const { user, profile, isAdmin, loading } = useIssues();
  const location = useLocation();

  console.log('AdminProtectedRoute:', { 
    userId: user?.id, 
    role: profile?.role, 
    isAdmin, 
    loading,
    path: location.pathname 
  });

  const isLocalStorageAdmin = localStorage.getItem('isAdmin') === 'true';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Verifying Admin Session...</p>
        </div>
      </div>
    );
  }

  if (!user && !isLocalStorageAdmin) {
    console.log('AdminProtectedRoute: No user or local admin, redirecting to login');
    return <Navigate to="/login" state={{ message: "Please sign in as an admin.", from: location }} replace />;
  }

  if (!isAdmin && !isLocalStorageAdmin) {
    console.log('AdminProtectedRoute: Not admin (role:', profile?.role, '), redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('AdminProtectedRoute: Access granted');
  return children;
};

export default AdminProtectedRoute;
