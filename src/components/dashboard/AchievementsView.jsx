import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Flame,
  Star,
  Zap,
  ShieldAlert,
  Award,
  Heart
} from 'lucide-react';
import { useIssues } from '../../context/IssueContext';

const Badge = ({ icon: Icon, title, description, isUnlocked, delay }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: 'spring' }}
      className={`relative group p-6 border-2 flex flex-col items-center text-center gap-4 transition-all duration-300 rounded-3xl ${
        isUnlocked 
          ? 'bg-blue-600/15 border-blue-500/40 shadow-xl shadow-blue-500/10' 
          : 'bg-slate-900/40 border-white/5 opacity-80 grayscale overflow-hidden grayscale-[80%]'
      }`}
    >
      {!isUnlocked && (
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] z-10 select-none cursor-not-allowed group-hover:bg-slate-950/0 transition-all duration-700" />
      )}
      
      {/* Icon Area */}
      <div className={`p-4 rounded-3xl transition-transform duration-500 ${
        isUnlocked 
          ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30 group-hover:scale-110' 
          : 'bg-slate-800 text-slate-500'
      }`}>
        <Icon className="w-8 h-8 font-black" />
      </div>

      {/* Logic */}
      <div className="space-y-1 relative z-20">
        <h4 className={`text-sm font-black uppercase tracking-widest ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
          {title}
        </h4>
        <p className={`text-[10px] font-bold leading-relaxed px-4 ${isUnlocked ? 'text-blue-200' : 'text-slate-600'}`}>
          {description}
        </p>
      </div>

      {/* Unlocked status */}
      {isUnlocked && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-400/20 rounded-full text-[8px] font-black text-blue-400 uppercase tracking-tighter">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Unlocked
        </div>
      )}
    </motion.div>
  );
};

const AchievementsView = () => {
  const { userReports, userUpvotes, loading } = useIssues();

  const achievements = useMemo(() => {
    if (!userReports) return [];
    
    const count = userReports.length;
    const resolvedCount = userReports.filter(r => r.issues?.status === 'resolved').length;
    const highSeverityCount = userReports.filter(r => (r.issues?.severity || 0) >= 4).length;
    
    const uniqueIssues = new Set();
    let totalCitizens = 0;
    userReports.forEach(r => {
      if (r.issues && !uniqueIssues.has(r.issues.id)) {
        uniqueIssues.add(r.issues.id);
        totalCitizens += r.issues.unique_user_count || 0;
      }
    });

    return [
      {
        id: 'first_report',
        title: 'First Report',
        description: 'Submit your very first civic complaint.',
        icon: MapPin,
        condition: count >= 1
      },
      {
        id: 'civic_starter',
        title: 'Civic Starter',
        description: 'Complete 5 reports to help your neighborhood.',
        icon: Award,
        condition: count >= 5
      },
      {
        id: 'power_reporter',
        title: 'Power Reporter',
        description: 'Submit 10 detailed complaints in the system.',
        icon: Zap,
        condition: count >= 10
      },
      {
        id: 'resolved_1',
        title: 'Problem Solver',
        description: 'Have your first reported issue marked as resolved.',
        icon: CheckCircle2,
        condition: resolvedCount >= 1
      },
      {
        id: 'impact_10',
        title: 'Voice of Ten',
        description: 'Impact 10 or more citizens through your reports.',
        icon: Users,
        condition: totalCitizens >= 10
      },
      {
        id: 'high_priority',
        title: 'Critical Scout',
        description: 'Report 3 or more high-severity issues correctly.',
        icon: ShieldAlert,
        condition: highSeverityCount >= 3
      },
      {
        id: 'top_tier',
        title: 'Community Pillar',
        description: 'Achieve a total of 100+ citizen impacts.',
        icon: Star,
        condition: totalCitizens >= 100
      },
      {
        id: 'pro_resolver',
        title: 'Action Specialist',
        description: 'Achieve 5 resolved reports in the system.',
        icon: Trophy,
        condition: resolvedCount >= 5
      },
      {
        id: 'civic_supporter',
        title: 'Civic Supporter',
        description: 'Support 5 existing issues to help prioritize them.',
        icon: Heart,
        condition: (userUpvotes?.length || 0) >= 5
      }
    ];
  }, [userReports, userUpvotes]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="text-center space-y-3 relative py-8 overflow-hidden rounded-[40px] border border-white/5 bg-slate-900/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/5 blur-[120px] -z-10" />
        <Trophy className="w-16 h-16 text-blue-500 mx-auto animate-pulse" />
        <h2 className="text-4xl font-black text-white tracking-tight">Your Achievements</h2>
        <p className="text-slate-400 font-bold max-w-lg mx-auto uppercase text-xs tracking-widest leading-loose">
          Unlock badges by actively participating in making your city better.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {achievements.map((item, i) => (
          <Badge 
            key={item.id}
            icon={item.icon}
            title={item.title}
            description={item.description}
            isUnlocked={item.condition}
            delay={i * 0.05}
          />
        ))}
      </div>
      
      {/* Progress Footer */}
      <div className="max-w-xl mx-auto p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
         <span>Total Badges Unlocked</span>
         <span className="text-blue-400 text-lg">{achievements.filter(a => a.condition).length} / {achievements.length}</span>
      </div>
    </div>
  );
};

export default AchievementsView;
