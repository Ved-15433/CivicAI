import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import StatsCards from './StatsCards';
import IssueCharts from './IssueCharts';
import { Sparkles } from 'lucide-react';

const AnalyticsView = React.memo(({ complaints, loading }) => {
  const stats = useMemo(() => {
    if (!complaints) return { total: 0, critical: 0, pending: 0, citizens: 0 };
    
    const total = complaints.length;
    const critical = complaints.filter(c => (c.severity || 0) >= 4).length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const citizens = complaints.reduce((sum, c) => sum + (c.unique_user_count || 1), 0);
    return { total, critical, pending, citizens };
  }, [complaints]);

  const chartData = useMemo(() => {
    if (!complaints || complaints.length === 0) {
      return { departmentData: [], categoryData: [], severityData: [], timelineData: [] };
    }

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
    sortedComplaints.slice(-50).forEach(c => {
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
      className="space-y-12"
    >
      <header>
        <div className="flex items-center gap-2 mb-2">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Global Insights</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">System Analytics</h2>
        <p className="text-slate-500 italic mt-2">Comprehensive overview of civic health across all districts.</p>
      </header>

      <StatsCards stats={stats} />

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Distribution & Trends</h3>
        </div>
        <IssueCharts {...chartData} />
      </section>
    </motion.div>
  );
});

export default AnalyticsView;
