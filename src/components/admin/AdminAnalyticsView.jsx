import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import StatsCards from '../dashboard/StatsCards';
import IssueCharts from '../dashboard/IssueCharts';
import { BarChart3, PieChart, Activity, CheckCircle2 } from 'lucide-react';

const AdminAnalyticsView = React.memo(({ complaints, loading }) => {
  const stats = useMemo(() => {
    if (!complaints) return { total: 0, acknowledged: 0, inProgress: 0, resolved: 0 };
    
    return {
      total: complaints.length,
      acknowledged: complaints.filter(c => c.status === 'approved').length,
      inProgress: complaints.filter(c => c.status === 'in-progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
    };
  }, [complaints]);

  const chartData = useMemo(() => {
    if (!complaints || complaints.length === 0) {
      return { departmentData: [], statusData: [], timelineData: [] };
    }

    // Complaints by Department
    const deptMap = {};
    complaints.forEach(c => {
      const dept = c.departments?.name || 'Others';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const departmentData = Object.entries(deptMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Complaints by Status
    const statusMap = {
      'pending': 0,
      'approved': 0,
      'in-progress': 0,
      'resolved': 0,
      'rejected': 0
    };
    complaints.forEach(c => {
      if (statusMap.hasOwnProperty(c.status)) {
        statusMap[c.status]++;
      }
    });
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '), 
      value 
    }));

    // Timeline Data
    const timelineMap = {};
    const sortedComplaints = [...complaints].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    sortedComplaints.forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      timelineMap[date] = (timelineMap[date] || 0) + 1;
    });
    const timelineData = Object.entries(timelineMap).map(([name, value]) => ({ name, value }));

    return { departmentData, statusData, timelineData };
  }, [complaints]);

  if (loading && complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Admin Analytics...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 pb-20"
    >
      <header>
        <div className="flex items-center gap-2 mb-2">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Admin Control</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">Executive Dashboard</h2>
        <p className="text-slate-500 italic mt-2">Internal monitoring and resource allocation overview.</p>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Complaints', value: stats.total, color: 'blue', icon: BarChart3 },
          { label: 'Acknowledged', value: stats.acknowledged, color: 'amber', icon: Activity },
          { label: 'In Progress', value: stats.inProgress, color: 'indigo', icon: Activity },
          { label: 'Resolved', value: stats.resolved, color: 'green', icon: CheckCircle2 },
        ].map((item, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/5 relative group overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${item.color}-500/10 blur-3xl rounded-full group-hover:bg-${item.color}-500/20 transition-colors`} />
            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-400 mb-4`}>
                <item.icon size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
              <h4 className="text-3xl font-black text-white">{item.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight">System Distribution</h3>
        </div>
        <IssueCharts 
          categoryData={chartData.departmentData} 
          severityData={chartData.statusData} 
          timelineData={chartData.timelineData} 
        />
      </section>
    </motion.div>
  );
});


export default AdminAnalyticsView;
