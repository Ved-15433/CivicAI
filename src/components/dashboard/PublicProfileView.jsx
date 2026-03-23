import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  Clock,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useIssues } from '../../context/IssueContext';
import { getUnlockedBadges } from '../../lib/badges';
import PostCard from './PostCard';

const PublicProfileView = ({ userId, onBack }) => {
  const { user: currentUserId } = useIssues();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileErr) throw profileErr;
      setProfile(profileData);

      // 2. Stats from view
      const { data: statsData } = await supabase
        .from('user_stats_view')
        .select('*')
        .eq('id', userId)
        .single();
      setStats(statsData);

      // 3. All Posts (not limited)
      const { data: postData, error: postsErr } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles!user_id (id, username, avatar_url, role, full_name),
          post_media (*),
          issues:issues!issue_id (id, title, status, location_label)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsErr) throw postsErr;
      setPosts(postData || []);

      // 4. Follow Status
      if (currentUserId?.id && userId !== currentUserId.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUserId.id)
          .eq('following_id', userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      // 5. Follow Counts
      await fetchFollowCounts();

    } catch (err) {
      console.error('Error fetching public profile:', err);
      setError('Unable to load user profile. They might not exist or the network is unstable.');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUserId?.id]);

  const fetchFollowCounts = async () => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
    ]);

    setFollowCounts({ followers: followers || 0, following: following || 0 });
  };

  const handleFollow = async () => {
    if (!currentUserId?.id || userId === currentUserId.id) return;
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUserId.id).eq('following_id', userId);
        setIsFollowing(false);
      } else {
        await supabase.from('follows').insert({ follower_id: currentUserId.id, following_id: userId });
        setIsFollowing(true);
      }
      fetchFollowCounts();
    } catch (err) {
      console.error('Error in public profile follow:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unlockedBadges = stats ? getUnlockedBadges(stats) : [];

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse" />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Accessing Local Network...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-24 text-center space-y-6">
        <X className="w-16 h-16 text-slate-800 mx-auto opacity-20" />
        <h3 className="text-xl font-black text-white uppercase tracking-tight">{error || 'User Not Found'}</h3>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-slate-400 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
        >
          Return to Community
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 group text-slate-500 hover:text-white transition-colors"
      >
        <div className="p-2 bg-white/5 rounded-xl group-hover:bg-blue-600 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">Back to Community</span>
      </button>

      {/* Profile Header Card */}
      <div className="bg-slate-900/40 p-8 md:p-12 rounded-[3rem] border border-white/5 backdrop-blur-xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full -mr-32 -mt-32" />
        
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 border-2 border-white/10 overflow-hidden shrink-0 shadow-2xl relative group">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-600">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
            {profile.role === 'admin' && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center border-4 border-slate-900 text-white shadow-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-grow text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-1">
                <h2 className="text-3xl font-black text-white tracking-tight">{profile.full_name || profile.username}</h2>
                {userId !== currentUserId?.id && (
                  <button 
                    onClick={handleFollow}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isFollowing 
                        ? 'bg-slate-800 border-white/10 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' 
                        : 'bg-blue-600 border-blue-500/20 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow User'}
                  </button>
                )}
              </div>
              <p className="text-blue-400 font-black tracking-widest text-xs uppercase opacity-80">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="text-slate-400 italic leading-relaxed max-w-xl text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                "{profile.bio}"
              </p>
            )}

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-400" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-white">{stats?.xp || 0}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">XP Reputation</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-white">#{stats?.rank || '?'}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">City Rank</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-white">{followCounts.followers}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Followers</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-purple-400" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-white">{followCounts.following}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Following</p>
                 </div>
              </div>
            </div>

            {/* Badges */}
            {unlockedBadges.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-4">
                {unlockedBadges.map(badge => (
                  <div 
                    key={badge.id} 
                    title={badge.title}
                    className="group relative"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 transition-all hover:bg-blue-600 hover:text-white cursor-help">
                      <badge.icon className="w-5 h-5" />
                    </div>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-2xl">
                      {badge.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-px flex-grow bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
             <Clock className="w-4 h-4" />
             Civic Contributions
          </h3>
          <div className="h-px flex-grow bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-12 max-w-2xl mx-auto">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUserId={currentUserId?.id}
                onFollowChange={fetchFollowCounts}
                onUserClick={null} // Already on their profile
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6 bg-slate-900/20 border border-dashed border-white/10 rounded-[3rem]">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto opacity-20">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold italic">No community posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfileView;
