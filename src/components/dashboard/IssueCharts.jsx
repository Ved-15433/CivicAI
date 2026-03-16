import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

const IssueCharts = React.memo(({ categoryData, severityData, timelineData }) => {
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl">
          <p className="text-white text-xs font-bold mb-1 uppercase tracking-widest">{label || payload[0].name}</p>
          <p className="text-blue-400 font-bold text-lg">{payload[0].value} <span className="text-[10px] text-slate-500">issues</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Category Pie Chart */}
      <div className="p-6 rounded-3xl glass border border-white/10 bg-slate-900/40">
        <h4 className="text-slate-300 text-xs font-black uppercase tracking-[0.2em] mb-6">Issues by Category</h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                isAnimationActive={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
           {categoryData.slice(0, 4).map((entry, index) => (
             <div key={entry.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                <span className="text-[10px] text-slate-400 font-medium truncate">{entry.name}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Severity Bar Chart */}
      <div className="p-6 rounded-3xl glass border border-white/10 bg-slate-900/40">
        <h4 className="text-slate-300 text-xs font-black uppercase tracking-[0.2em] mb-6">Severity Distribution</h4>
        <div className="h-[250px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={severityData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
               <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {severityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name >= 4 ? '#ef4444' : entry.name >= 3 ? '#f59e0b' : '#3b82f6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Timeline Line Chart */}
      <div className="p-6 rounded-3xl glass border border-white/10 bg-slate-900/40">
        <h4 className="text-slate-300 text-xs font-black uppercase tracking-[0.2em] mb-6">Reporting Volume</h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
               <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

export default IssueCharts;
