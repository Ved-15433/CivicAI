import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  TrendingUp, 
  Globe, 
  Flame, 
  Loader2,
  AlertCircle,
  Clock,
  LayoutGrid,
  Filter,
  UserCheck,
  Zap,
  Award,
  User,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useIssues } from '../../context/IssueContext';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import UserProfileModal from './UserProfileModal';
import ProfileView from './ProfileView';


const CommunityView = () => {
  const { user, profile } = useIssues();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'following', 'before-after'
  const [userFollows, setUserFollows] = useState([]);
  const [activeTab, setActiveTab] = useState('community');
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get('user');

  const fetchPosts = useCallback(async () => {
    if (filter === 'profile') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url, role, full_name),
          post_media (*),
          issues:issue_id (id, title, status, location_label)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'before-after') {
        query = query.eq('post_type', 'before-after');
      }

      const { data, error: postError } = await query;

      if (postError) throw postError;

      // Filtering for 'following' in-memory for simpler initial implementation
      let filteredData = data || [];
      if (filter === 'following' && user) {
        filteredData = filteredData.filter(post => 
          userFollows.some(f => f.following_id === post.user_id) || post.user_id === user.id
        );
      }

      setPosts(filteredData);
    } catch (err) {
      console.error('Error fetching community posts:', err);
      setError('Unable to load feed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [filter, userFollows, user]);

  const fetchFollows = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id);

      if (error) throw error;
      setUserFollows(data || []);
    } catch (err) {
      console.error('Error fetching follows:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchFollows();
  }, [fetchFollows]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (userIdFromUrl) {
      setSelectedUserId(userIdFromUrl);
      setIsUserModalOpen(true);
      // Clean up the URL after opening the modal
      setSearchParams({});
    }
  }, [userIdFromUrl, setSearchParams]);

  const handleUserClick = (userId) => {
    setSelectedUserId(userId);
    setIsUserModalOpen(true);
  };

  const handlePostSuccess = () => {
    fetchPosts();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Network</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            Civic Community
            <div className="p-2 bg-blue-600/20 border border-blue-500/20 rounded-xl">
               <Users className="w-8 h-8 text-blue-400" />
            </div>
          </h2>
          <p className="text-slate-500 italic mt-3 max-w-lg leading-relaxed font-medium">
             Connect with citizens, share resolution stories, and witness real-world impact in real-time.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20 flex items-center gap-3 transition-all border border-blue-400/20"
        >
          <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-4 h-4" />
          </div>
          Create Community Update
        </motion.button>
      </header>

      {/* Main Grid: Feed + Side Discovery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Feed Section */}
        <div className="lg:col-span-12 space-y-8">
          
          {/* Feed Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-2 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl shadow-xl">
            <div className="flex items-center gap-2 p-1 bg-slate-950/50 rounded-2xl border border-white/5 w-full sm:w-auto">
              {[
                { id: 'all', icon: Globe, label: 'Global Feed' },
                { id: 'following', icon: UserCheck, label: 'My Circle' },
                { id: 'before-after', icon: Flame, label: 'Impact Stories' },
                { id: 'profile', icon: User, label: 'My Profile' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 sm:flex-none flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filter === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 shadow-[0_0_15px_#3b82f644]' 
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {filter !== 'profile' && (
              <div className="flex items-center gap-4 px-4 w-full sm:w-auto">
                 <div className="flex items-center gap-2 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Latest Updates</span>
                 </div>
              </div>
            )}
            {filter === 'profile' && (
              <div className="flex items-center gap-4 px-4 w-full sm:w-auto">
                 <div className="flex items-center gap-2 text-blue-400">
                    <User className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Your Account</span>
                 </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          {filter === 'profile' ? (
            <ProfileView hideHeader={true} />
          ) : loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
               <div className="relative">
                 <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                 <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse" />
               </div>
               <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Local Network...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-12 max-w-2xl mx-auto">
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={user?.id}
                  onFollowChange={fetchFollows}
                  onUserClick={handleUserClick}
                />
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center space-y-8 bg-slate-900/20 border border-dashed border-white/10 rounded-[3rem]"
            >
              <div className="w-24 h-24 bg-blue-600/5 rounded-full flex items-center justify-center p-4">
                 <div className="w-full h-full bg-blue-600/10 rounded-full flex items-center justify-center border border-dashed border-blue-500/30">
                    <TrendingUp className="w-10 h-10 text-slate-700" />
                 </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Quiet on the frontlines</h3>
                <p className="text-slate-500 italic max-w-sm">
                  {filter === 'following' 
                    ? "Nobody you follow has posted yet. Start following people from the Global Feed!" 
                    : "Be the first to share an update with the civic community."}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-400/50 rounded-2xl transition-all"
              >
                <Plus className="w-4 h-4 text-blue-400 group-hover:text-white" />
                <span className="text-xs font-black text-white hover:text-white uppercase tracking-widest">Share Your Update</span>
              </button>
            </motion.div>
          )}

          {/* End of Feed Badge */}
          {filter !== 'profile' && !loading && posts.length > 0 && (
            <div className="py-20 flex flex-col items-center space-y-6">
               <div className="w-px h-16 bg-gradient-to-b from-blue-500/50 to-transparent" />
               <div className="p-4 bg-slate-900 border border-white/10 rounded-3xl flex items-center gap-3 shadow-2xl">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                     <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Synchronized & Verified</span>
               </div>
            </div>
          )}
        </div>

        {/* Floating Stats / Meta Info (Could be a sidebar later) */}
        {/* <div className="hidden lg:block lg:col-span-4 space-y-8 h-fit sticky top-24">
          <div className="p-8 bg-slate-900/50 border border-white/5 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <Globe className="w-32 h-32 text-blue-500" />
             </div>
             
             <div className="space-y-2 relative">
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Network Stats</h4>
                <div className="h-px w-12 bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
             </div>

             <div className="grid grid-cols-2 gap-4 relative">
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                   <p className="text-2xl font-black text-white">4.2k</p>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Peers</p>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                   <p className="text-2xl font-black text-white">890</p>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Impact Stories</p>
                </div>
             </div>

             <div className="space-y-4 pt-4 relative">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Trending Tags</p>
                <div className="flex flex-wrap gap-2">
                   {['#PotholeFixed', '#GreenPark', '#CleanCivic', '#WaterUnity'].map(tag => (
                     <span key={tag} className="px-3 py-1.5 bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-lg text-[9px] font-bold text-slate-400 hover:text-blue-400 transition-all cursor-pointer">
                        {tag}
                     </span>
                   ))}
                </div>
             </div>
          </div>
        </div> */}
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handlePostSuccess}
      />

      <UserProfileModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userId={selectedUserId}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default CommunityView;
