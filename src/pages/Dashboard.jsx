import React from 'react';
import { Outlet } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="absolute inset-0 h-full overflow-y-auto pt-12 pb-20 px-10 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
