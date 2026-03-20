import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import IssueCharts from './IssueCharts';
import { BarChart3, Activity, CheckCircle2, Users, ShieldAlert } from 'lucide-react';
import { useIssues } from '../../context/IssueContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

const DEPARTMENTS = [
  'Drainage & Flooding',
  'Waste & Sanitation',
  'Roads & Bridges',
  'Water Supply',
  'Electricity',
  'Others'
];

const normalizeDepartment = (issue) => {
  const category = (issue.category || '').toLowerCase();
  const deptName = (issue.departments?.name || '').toLowerCase();
  const combined = `${category} ${deptName}`;

  if (combined.includes('drainage') || combined.includes('flood')) return 'Drainage & Flooding';
  if (combined.includes('waste') || combined.includes('sanitation') || combined.includes('sewage') || combined.includes('garbage') || combined.includes('trash')) return 'Waste & Sanitation';
  if (combined.includes('road') || combined.includes('bridge') || combined.includes('pothole') || combined.includes('street')) return 'Roads & Bridges';
  if (combined.includes('water supply') || combined.includes('water leak') || (combined.includes('water') && !combined.includes('waste'))) return 'Water Supply';
  if (combined.includes('electr') || combined.includes('power') || combined.includes('light')) return 'Electricity';

  return 'Others';
};

const AnalyticsView = React.memo(() => {
  const { complaints, loading } = useIssues();
  const stats = useMemo(() => {
    if (!complaints) return { total: 0, citizens: 0, acknowledged: 0, inProgress: 0, resolved: 0, departmentStats: {} };

    const deptStats = {};
    DEPARTMENTS.forEach(d => {
      deptStats[d] = { total: 0, pending: 0, acknowledged: 0, inProgress: 0, resolved: 0 };
    });

    complaints.forEach(c => {
      const dept = normalizeDepartment(c);
      if (deptStats[dept]) {
        // Reported = Cumulative total reports in this department
        deptStats[dept].total++;
        
        // Acknowledged = Cumulative: reached Acknowledged, In Progress, or Resolved
        if (['Acknowledged', 'In Progress', 'Resolved'].includes(c.status)) {
          deptStats[dept].acknowledged++;
        }
        
        // Ongoing = CURRENTLY In Progress
        if (c.status === 'In Progress') {
          deptStats[dept].inProgress++;
        }
        
        // Done = Reached Resolved stage
        if (c.status === 'Resolved') {
          deptStats[dept].resolved++;
        }
      }
    });

    return {
      total: complaints.length,
      citizens: complaints.reduce((sum, c) => sum + (c.unique_user_count || 1), 0),
      acknowledged: complaints.filter(c => ['Acknowledged', 'In Progress', 'Resolved'].includes(c.status)).length,
      inProgress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length,
      departmentStats: deptStats
    };
  }, [complaints]);

  const chartData = useMemo(() => {
    if (!complaints || complaints.length === 0) {
      return { departmentData: [], categoryData: [], statusData: [], timelineData: [], severityData: [] };
    }

    // 1. Issues per Department (Normalized)
    const deptMap = {};
    DEPARTMENTS.forEach(d => deptMap[d] = 0);
    complaints.forEach(c => {
      const dept = normalizeDepartment(c);
      deptMap[dept]++;
    });
    const departmentData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // 2. Issues by Category (Raw but cleaned)
    const categoryMap = {};
    complaints.forEach(c => {
      let cat = c.category || c.departments?.name || 'Others';
      cat = cat.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    // 3. Severity Distribution
    const severityMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    complaints.forEach(c => {
      const sev = Math.round(c.severity || 1);
      if (severityMap.hasOwnProperty(sev)) severityMap[sev]++;
    });
    const severityData = Object.entries(severityMap).map(([name, value]) => ({ 
      name: `Lvl ${name}`, 
      value,
      level: parseInt(name)
    }));

    // 4. Timeline Data
    const timelineMap = {};
    const sortedComplaints = [...complaints].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    sortedComplaints.forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      timelineMap[date] = (timelineMap[date] || 0) + 1;
    });
    const timelineData = Object.entries(timelineMap).map(([name, value]) => ({ name, value }));

    return { departmentData, categoryData, severityData, timelineData };
  }, [complaints]);

  if (loading && complaints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Analytics...</p>
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
          <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Public Insights</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">System Analytics</h2>
        <p className="text-slate-500 italic mt-2">Comprehensive overview of civic health across all districts.</p>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: 'Total Reports', value: stats.total, color: 'blue', icon: BarChart3 },
          { label: 'Citizens Engaged', value: stats.citizens, color: 'purple', icon: Users },
          { label: 'Acknowledged', value: stats.acknowledged, color: 'amber', icon: Activity },
          { label: 'Ongoing', value: stats.inProgress, color: 'indigo', icon: Activity },
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

      {/* Departmental Breakdown Card Group */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Departmental Status Breakdown</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {DEPARTMENTS.map((dept, idx) => {
            const data = stats.departmentStats[dept] || { total: 0, inProgress: 0, resolved: 0 };
            return (
              <div key={idx} className="glass p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 relative group overflow-hidden transition-all hover:bg-slate-900/60 hover:border-white/10">
                <div className={`absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-xl font-black text-white tracking-tight">{dept}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sector Metrics</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <ShieldAlert size={22} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reported</p>
                      <p className="text-xl font-black text-white">{data.total}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Ack.</p>
                      <p className="text-xl font-black text-blue-400">{data.acknowledged || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Ongoing</p>
                      <p className="text-xl font-black text-indigo-400">{data.inProgress || 0}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Done</p>
                      <p className="text-xl font-black text-green-400">{data.resolved || 0}</p>
                    </div>
                  </div>
                </div>
                
                {/* Subtle progress bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.total > 0 ? (data.resolved / data.total) * 100 : 0}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 opacity-50" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight">System Distribution</h3>
        </div>
        <IssueCharts {...chartData} />
      </section>
    </motion.div>
  );
});

export default AnalyticsView;
