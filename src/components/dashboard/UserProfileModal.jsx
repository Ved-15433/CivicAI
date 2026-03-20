import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Award, 
  UserPlus, 
  UserMinus, 
  Users, 
  Zap, 
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useIssues } from '../../context/IssueContext';
import { getUnlockedBadges } from '../../lib/badges';

const UserProfileModal = ({ isOpen, onClose, userId, currentUserId }) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    if (userId && isOpen) {
      fetchData();
      checkFollowStatus();
      fetchFollowCounts();
    }
  }, [userId, isOpen, currentUserId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(profileData);

      // Stats from view
      const { data: statsData } = await supabase
        .from('user_stats_view')
        .select('*')
        .eq('id', userId)
        .single();
      setStats(statsData);

      // Recent Posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*, post_media(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6);
      setPosts(postData || []);

    } catch (err) {
      console.error('Error fetching user modal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUserId || userId === currentUserId) return;
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const fetchFollowCounts = async () => {
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    setFollowCounts({ followers: followers || 0, following: following || 0 });
  };

  const handleFollow = async () => {
    if (!currentUserId || userId === currentUserId) return;
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', userId);
        setIsFollowing(false);
      } else {
        await supabase.from('follows').insert({ follower_id: currentUserId, following_id: userId });
        setIsFollowing(true);
      }
      fetchFollowCounts();
    } catch (err) {
      console.error('Error in user modal follow:', err);
    }
  };

  const unlockedBadges = stats ? getUnlockedBadges(stats) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg h-full bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto"
          >
            {/* Close Button Mobile */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-all z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {loading ? (
              <div className="h-full flex flex-col items-center justify-center p-12">
                 <div className="relative">
                   <Users className="w-16 h-16 text-blue-500/20 animate-pulse" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                   </div>
                 </div>
                 <p className="mt-6 text-slate-500 font-black uppercase tracking-widest text-xs">Accessing User Files...</p>
              </div>
            ) : (
              <div className="p-8 space-y-10">
                {/* Profile Header */}
                <header className="space-y-6 pt-12">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-800 border-2 border-white/10 overflow-hidden shrink-0 shadow-2xl">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-600">
                          {profile?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-2xl font-black text-white truncate">{profile?.username || 'Civic User'}</h3>
                          {profile?.role === 'admin' && (
                             <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          )}
                       </div>
                       <p className="text-sm text-slate-500 font-medium truncate">{profile?.full_name}</p>
                       <div className="mt-4 flex items-center gap-4">
                          <div className="text-center">
                             <p className="text-sm font-black text-white">{followCounts.followers}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Followers</p>
                          </div>
                          <div className="text-center">
                             <p className="text-sm font-black text-white">{followCounts.following}</p>
                             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Following</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  {profile?.bio && (
                    <p className="text-sm text-slate-400 bg-white/5 p-4 rounded-2xl border border-white/5 italic">
                      "{profile.bio}"
                    </p>
                  )}

                  <div className="flex gap-4">
                    {userId === currentUserId ? (
                      <button className="flex-1 py-3 px-6 bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/5 hover:bg-slate-700">
                        This is You
                      </button>
                    ) : (
                      <button 
                        onClick={handleFollow}
                        className={`flex-1 py-3 px-6 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${
                          isFollowing 
                            ? 'bg-slate-800 border-white/10 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' 
                            : 'bg-blue-600 border-blue-500/50 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500'
                        }`}
                      >
                        {isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                      </button>
                    )}
                  </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/50 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                       <Zap className="w-3.5 h-3.5 text-orange-400" />
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reputation XP</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">{stats?.xp || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-950/50 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                       <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Rank</span>
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">#{stats?.rank || '?'}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Award className="w-3.5 h-3.5" />
                         Earned Distinctions
                      </h4>
                      <span className="text-[10px] font-bold text-blue-400">{unlockedBadges.length} Active</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {unlockedBadges.map(badge => (
                        <div key={badge.id} className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group relative">
                           <badge.icon className="w-5 h-5" />
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-[8px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                             {badge.title}
                           </div>
                        </div>
                      ))}
                      {unlockedBadges.length === 0 && (
                        <p className="text-[10px] text-slate-600 italic">No public distinctions yet.</p>
                      )}
                   </div>
                </div>

                {/* Recent Updates Grid */}
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      Recent Civic Updates
                   </h4>
                   <div className="grid grid-cols-2 gap-3">
                      {posts.map(post => {
                        const firstImage = post.post_media?.[0]?.url;
                        return (
                          <div key={post.id} className="aspect-square bg-slate-800 rounded-2xl overflow-hidden border border-white/5 relative group cursor-pointer">
                             {firstImage ? (
                               <img src={firstImage} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             ) : (
                               <div className="w-full h-full p-4 flex items-center justify-center text-[8px] text-slate-500 text-center font-bold">
                                  {post.content?.slice(0, 40)}...
                               </div>
                             )}
                             <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">View Post</span>
                             </div>
                          </div>
                        );
                      })}
                      {posts.length === 0 && (
                        <div className="col-span-2 py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                           <p className="text-[10px] text-slate-600 font-black uppercase">No public updates shared yet.</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;
