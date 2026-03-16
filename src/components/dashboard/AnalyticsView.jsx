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
      return { categoryData: [], severityData: [], timelineData: [] };
    }

    const catMap = {};
    complaints.forEach(c => {
      const cat = c.category || 'Unassigned';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const categoryData = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const severityMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    complaints.forEach(c => {
      if (c.severity) severityMap[c.severity]++;
    });
    const severityData = Object.entries(severityMap).map(([name, value]) => ({ name: parseInt(name), value }));

    const timelineMap = {};
    // Extract last 10 unique dates to keep chart performant
    complaints.slice(0, 50).forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      timelineMap[date] = (timelineMap[date] || 0) + 1;
    });
    const timelineData = Object.entries(timelineMap).map(([name, value]) => ({ name, value })).reverse();

    return { categoryData, severityData, timelineData };
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
