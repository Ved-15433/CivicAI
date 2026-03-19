import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  ChevronRight, 
  Zap, 
  MapPin, 
  Users, 
  Clock,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  X,
  Shield,
  Award,
  Star,
  Flame,
  ShieldAlert,
  Heart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useIssues } from '../../context/IssueContext';

const UserStatsModal = ({ user, onClose, rank }) => {
  if (!user) return null;

  const badges = [
    { id: 'first_report', title: 'First Report', icon: MapPin, condition: user.report_count >= 1 },
    { id: 'civic_starter', title: 'Civic Starter', icon: Award, condition: user.report_count >= 5 },
    { id: 'power_reporter', title: 'Power Reporter', icon: Zap, condition: user.report_count >= 10 },
    { id: 'resolved_1', title: 'Problem Solver', icon: CheckCircle2, condition: user.resolved_count >= 1 },
    { id: 'impact_10', title: 'Voice of Ten', icon: Users, condition: (user.citizens_impacted || 0) >= 10 },
    { id: 'high_priority', title: 'Critical Scout', icon: ShieldAlert, condition: user.high_severity_count >= 3 },
    { id: 'civic_supporter', title: 'Civic Supporter', icon: Heart, condition: user.support_count >= 5 }
  ];

  const unlockedBadges = badges.filter(b => b.condition);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center overflow-hidden">
               {user.avatar_url ? (
                 <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-2xl font-black text-blue-400">
                   {user.full_name?.[0].toUpperCase() || 'U'}
                 </span>
               )}
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{user.full_name || 'Volunteer'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                  Rank #{rank}
                </span>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  {user.role === 'admin' ? 'Official' : 'Volunteer'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="px-8 py-4 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">XP Points</p>
             <div className="flex items-center gap-2">
               <Zap className="w-4 h-4 text-blue-400" />
               <p className="text-xl font-black text-white">{user.xp}</p>
             </div>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20">
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Impact Score</p>
             <div className="flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-blue-400" />
               <p className="text-xl font-black text-white">{user.impact_score}</p>
             </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reports Sent</p>
             <p className="text-xl font-black text-white">{user.report_count}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resolved</p>
             <p className="text-xl font-black text-emerald-400">{user.resolved_count}</p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="px-8 py-6 border-t border-white/5">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Badges Earned ({unlockedBadges.length})</h4>
           <div className="flex flex-wrap gap-3">
              {unlockedBadges.length > 0 ? (
                unlockedBadges.map(badge => (
                  <div key={badge.id} title={badge.title} className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <badge.icon className="w-5 h-5" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 font-bold italic">No badges earned yet.</p>
              )}
           </div>
        </div>

        {/* Action */}
        <div className="p-8 pt-4">
           <button 
             onClick={onClose}
             className="w-full py-4 rounded-[20px] bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
           >
             Close Explorer
           </button>
        </div>
      </motion.div>
    </div>
  );
};

const LeaderboardRow = ({ rank, user, isCurrentUser, delay, onClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`group p-4 bg-slate-900/30 border border-white/10 rounded-2xl flex items-center gap-6 transition-all duration-300 hover:bg-white/5 cursor-pointer ${
        isCurrentUser ? 'bg-blue-600/15 border-blue-500/30 shadow-lg shadow-blue-500/10 scale-[1.02]' : ''
      }`}
    >
      {/* Rank */}
      <div className="w-10 h-10 flex items-center justify-center relative">
        {rank === 1 ? <Trophy className="w-8 h-8 text-yellow-500" /> : 
         rank === 2 ? <Trophy className="w-8 h-8 text-slate-300" /> : 
         rank === 3 ? <Trophy className="w-8 h-8 text-amber-600" /> : 
         <span className={`text-lg font-black ${isCurrentUser ? 'text-blue-400' : 'text-slate-500'}`}>{rank}</span>}
      </div>

      {/* Avatar */}
      <div className={`w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center font-black overflow-hidden ${isCurrentUser ? 'border-blue-500/50 text-blue-400 shadow-xl shadow-blue-500/20' : 'text-slate-500'}`}>
        {user?.avatar_url ? (
          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
        ) : (
          user?.full_name?.[0].toUpperCase() || 'U'
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h4 className={`text-sm font-bold truncate ${isCurrentUser ? 'text-white' : 'text-slate-300'}`}>
          {user?.full_name || 'Volunteer'}
          {isCurrentUser && <span className="ml-2 py-0.5 px-2 bg-blue-500 text-[8px] font-black uppercase rounded-full tracking-tighter">YOU</span>}
        </h4>
        <div className="flex items-center gap-3 mt-1">
           <div className="flex items-center gap-1">
             <MapPin className="w-2.5 h-2.5 text-slate-500" />
             <span className="text-[10px] font-black uppercase text-slate-500">Local Area</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-slate-700" />
           <span className="text-[10px] font-black uppercase text-slate-500">{user.report_count} reports</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8 pr-2">
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impact</p>
          <div className="flex items-center justify-end gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            <p className="text-sm font-black text-blue-400">{user.impact_score}</p>
          </div>
        </div>
        
        <div className="text-right w-20">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">XP</p>
          <p className="text-sm font-black text-white">{user.xp}</p>
        </div>
        
        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${isCurrentUser ? 'text-blue-400' : 'text-slate-600'}`} />
      </div>
    </motion.div>
  );
};

const LeaderboardView = () => {
  const { user: currentUserProfile } = useIssues();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_stats_view')
          .select('*')
          .order('xp', { ascending: false });

        if (error) throw error;
        setLeaderboardData(data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filteredData = useMemo(() => {
    return leaderboardData.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.includes(searchTerm)
    );
  }, [leaderboardData, searchTerm]);

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
           <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Global Rankings</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tight">Leaderboard</h2>
        <p className="text-slate-500 italic mt-2">Top contributors making a difference in the community.</p>
      </header>
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/40 p-6 rounded-[32px] border border-white/5 backdrop-blur-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search volunteers..." 
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 text-sm font-medium transition-all text-white placeholder:text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap">
            <TrendingUp className="w-3.5 h-3.5" />
            Global
          </button>
          <button className="px-4 py-2 bg-white/5 text-slate-400 border border-white/5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5" />
            Local
          </button>
          <button className="px-4 py-2 bg-white/5 text-slate-400 border border-white/5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            Monthly
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="grid grid-cols-1 gap-3 px-2">
        {filteredData.map((user, i) => (
          <LeaderboardRow 
            key={user.id}
            rank={i + 1}
            user={user}
            isCurrentUser={user.id === currentUserProfile?.id}
            delay={i * 0.05}
            onClick={() => setSelectedUser({ ...user, rank: i + 1 })}
          />
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[32px]">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-20" />
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No volunteers found</p>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <UserStatsModal 
            user={selectedUser} 
            rank={selectedUser.rank}
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </AnimatePresence>

      {/* Pro Tip */}
      <div className="p-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-[32px] flex items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 animate-bounce">
           <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h4 className="text-white font-black text-sm uppercase tracking-tight">Pro Tip: Resolve Issues</h4>
          <p className="text-slate-400 text-xs font-medium leading-relaxed mt-1">
            Confirmed resolutions grant <span className="text-blue-400 font-black">+500 XP</span>! Keep your reports detailed to help authorities resolve them faster.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;

