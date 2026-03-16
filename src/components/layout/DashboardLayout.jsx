import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import { useIssues } from '../../context/IssueContext';

const DashboardLayout = () => {
  const { user } = useIssues();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30 flex overflow-hidden">
      <Sidebar user={user} />

      <main className="flex-1 ml-72 h-screen overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default React.memo(DashboardLayout);
