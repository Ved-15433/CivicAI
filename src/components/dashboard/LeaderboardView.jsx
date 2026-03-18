import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useIssues } from '../../context/IssueContext';

const LeaderboardRow = ({ rank, user, isCurrentUser, delay }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`group p-4 bg-slate-900/30 border border-white/10 rounded-2xl flex items-center gap-6 transition-all duration-300 hover:bg-white/5 ${
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
      <div className={`w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center font-black ${isCurrentUser ? 'border-blue-500/50 text-blue-400 shadow-xl shadow-blue-500/20' : 'text-slate-500'}`}>
        {user?.full_name?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h4 className={`text-sm font-bold truncate ${isCurrentUser ? 'text-white' : 'text-slate-300'}`}>
          {user?.full_name || user?.email?.split('@')[0] || 'Unknown User'}
          {isCurrentUser && <span className="ml-2 py-0.5 px-2 bg-blue-500 text-[8px] font-black uppercase rounded-full">YOU</span>}
        </h4>
        <div className="flex items-center gap-3 mt-1">
           <div className="flex items-center gap-1">
             <MapPin className="w-2.5 h-2.5 text-slate-500" />
             <span className="text-[10px] font-black uppercase text-slate-500">Local Area</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-slate-700" />
           <span className="text-[10px] font-black uppercase text-slate-500">{user.reportCount} reports</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-8 pr-2">
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impact</p>
          <div className="flex items-center justify-end gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            <p className="text-sm font-black text-blue-400">{user.impactScore}</p>
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
  const { user: currentUser } = useIssues();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Fetch all reports joined with issues and profiles
        const { data: reports, error } = await supabase
          .from('reports')
          .select('*, issues(*), profiles(*)');

        if (error) throw error;

        // Group by user_id
        const userMap = {};
        reports.forEach(r => {
          const uid = r.user_id;
          if (!uid) return;
          
          if (!userMap[uid]) {
            userMap[uid] = {
              id: uid,
              full_name: r.profiles?.full_name || `Volunteer ${uid.slice(0, 4)}`,
              avatar_url: r.profiles?.avatar_url,
              reportCount: 0,
              resolvedCount: 0,
              impactScore: 0,
              xp: 0,
              uniqueIssues: new Set()
            };
          }

          const userStat = userMap[uid];
          userStat.reportCount += 1;
          
          if (r.issues?.status === 'resolved') {
            userStat.resolvedCount += 1;
          }

          if (r.issues && !userStat.uniqueIssues.has(r.issues.id)) {
            userStat.uniqueIssues.add(r.issues.id);
            const pImpact = r.issues.public_impact || 1;
            const uUsers = r.issues.unique_user_count || 1;
            userStat.impactScore += pImpact * uUsers * 10;
          }
          
          // XP: 100 per report, 500 per resolved
          userStat.xp = (userStat.reportCount * 100) + (userStat.resolvedCount * 500);
        });

        const sortedData = Object.values(userMap)
          .sort((a, b) => b.xp - a.xp);

        setLeaderboardData(sortedData);
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/40 p-6 rounded-[32px] border border-white/5 backdrop-blur-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search volunteers..." 
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 text-sm font-medium transition-all"
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
            isCurrentUser={user.id === currentUser?.id}
            delay={i * 0.05}
          />
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[32px]">
            <Users className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-20" />
            <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No volunteers found</p>
          </div>
        )}
      </div>

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
