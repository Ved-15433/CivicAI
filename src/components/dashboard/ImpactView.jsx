import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Shield,
  Heart
} from 'lucide-react';
import { useIssues } from '../../context/IssueContext';

const ProgressRing = ({ progress, size = 60, stroke = 4 }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-white/5"
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-blue-500 transition-all duration-1000 ease-out"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
        {Math.round(progress)}%
      </div>
    </div>
  );
};

const ImpactView = () => {
  const { userReports, userUpvotes, loading } = useIssues();

  const stats = useMemo(() => {
    if (!userReports) return { xp: 0, level: 1, impactScore: 0, resolved: 0, total: 0, citizens: 0 };
    
    const total = userReports.length;
    const upvotes = userUpvotes?.length || 0;
    const resolved = userReports.filter(r => r.issues?.status === 'resolved').length;
    
    // XP: 100 per report, 500 per resolved, 5 per upvote
    const xp = (total * 100) + (resolved * 500) + (upvotes * 5);
    
    // Level: Every 1500 XP is a level
    const level = Math.floor(xp / 1500) + 1;
    const xpInCurrentLevel = xp % 1500;
    const xpProgress = (xpInCurrentLevel / 1500) * 100;
    
    // Impact Score: Sum of public_impact * unique_user_count for each unique issue
    const uniqueIssues = new Set();
    let impactScore = 0;
    let citizens = 0;
    
    userReports.forEach(r => {
      const issue = r.issues;
      if (issue && !uniqueIssues.has(issue.id)) {
        uniqueIssues.add(issue.id);
        const pImpact = issue.public_impact || 1;
        const uUsers = issue.unique_user_count || 1;
        impactScore += pImpact * uUsers * 10;
        citizens += uUsers;
      }
    });

    return { 
      xp, 
      level, 
      xpProgress,
      xpNext: 1500,
      xpCurrent: xpInCurrentLevel,
      impactScore, 
      resolved, 
      total, 
      upvotes,
      citizens 
    };
  }, [userReports, userUpvotes]);

  const levels = [
    "Civic Beginner",
    "Active Citizen",
    "Community Guardian",
    "Urban Sentinel",
    "Civic Hero",
    "City Legend"
  ];
  const currentLevelName = levels[Math.min(stats.level - 1, levels.length - 1)];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <div className="flex items-center gap-2 mb-2">
           <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
           <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Civic Achievement</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">Civic Impact</h2>
        <p className="text-slate-500 italic mt-2">Track your personal contribution to the city's health.</p>
      </header>
      {/* Header / Profile Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 p-8 bg-slate-900/50 border border-white/10 rounded-3xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
          
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center p-1">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="w-16 h-16 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-white/10 px-3 py-1 rounded-full text-xs font-black text-blue-400 shadow-xl">
              LVL {stats.level}
            </div>
          </div>

          <div className="flex-grow space-y-4 text-center md:text-left">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">{currentLevelName}</h2>
              <p className="text-slate-400 font-medium">Your civic contribution status</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                <span className="text-blue-400">{stats.xpCurrent} XP</span>
                <span className="text-slate-500">{stats.xpNext} XP</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.xpProgress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl flex flex-col justify-center items-center text-center shadow-xl shadow-blue-900/20"
        >
          <Zap className="w-12 h-12 text-white mb-4 animate-pulse" />
          <p className="text-blue-100 text-sm font-black uppercase tracking-widest mb-1">Impact Score</p>
          <h3 className="text-5xl font-black text-white">{stats.impactScore}</h3>
          <div className="mt-4 px-4 py-2 bg-white/10 rounded-full text-xs font-bold text-white backdrop-blur-md">
            Top 15% in your area
          </div>
        </motion.div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Complaints Sent', value: stats.total, icon: Clock, color: 'text-blue-400' },
          { label: 'Issues Supported', value: stats.upvotes, icon: Heart, color: 'text-rose-400' },
          { label: 'Issues Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Citizens Impacted', value: stats.citizens, icon: Users, color: 'text-purple-400' }
        ].map((item, i) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (i * 0.1) }}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5"
          >
            <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center ${item.color}`}>
              <item.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{item.label}</p>
              <h4 className="text-2xl font-black text-white">{item.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Contributions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Recent Contributions
          </h3>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {userReports.slice(0, 5).map((report, i) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + (i * 0.05) }}
              className="group p-4 bg-slate-900/30 border border-white/10 rounded-2xl hover:bg-white/5 transition-all flex items-center gap-4"
            >
              <div className={`w-2 h-10 rounded-full ${
                report.issues?.status === 'resolved' ? 'bg-emerald-500' : 
                report.issues?.status === 'in-progress' ? 'bg-blue-500' : 'bg-amber-500'
              }`} />
              
              <div className="flex-grow min-w-0">
                <h4 className="text-sm font-bold text-white truncate">{report.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">{new Date(report.created_at).toLocaleDateString()}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className={`text-[10px] font-black uppercase ${
                    report.issues?.status === 'resolved' ? 'text-emerald-400' : 
                    report.issues?.status === 'in-progress' ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {report.issues?.status || 'Processing'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pr-2">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Gain</p>
                  <p className="text-xs font-black text-blue-400">+100 XP</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
          {userReports.length === 0 && (
            <div className="text-center py-10 bg-white/5 border border-dashed border-white/10 rounded-2xl">
              <p className="text-slate-500 text-sm font-bold">No contributions yet. Start by reporting an issue!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactView;
