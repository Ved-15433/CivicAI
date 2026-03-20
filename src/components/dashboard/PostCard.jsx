import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  UserPlus, 
  UserMinus,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useIssues } from '../../context/IssueContext';

const PostCard = ({ post, currentUserId, onFollowChange, onUserClick }) => {
  const { profile: currentUserProfile } = useIssues();
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);

  const {
    id,
    content,
    post_type,
    created_at,
    user_id,
    profiles, // Joins
    post_media = [],
    issues
  } = post;

  useEffect(() => {
    checkFollowStatus();
  }, [user_id, currentUserId]);

  const checkFollowStatus = async () => {
    if (!currentUserId || user_id === currentUserId) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', user_id)
        .maybeSingle();

      if (data) setIsFollowing(true);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId || user_id === currentUserId) return;
    
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', user_id);
        setIsFollowing(false);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: user_id });
        setIsFollowing(true);
      }
      if (onFollowChange) onFollowChange();
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % post_media.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + post_media.length) % post_media.length);
  };

  const isLongContent = content && content.length > 150;
  const displayContent = showFullContent ? content : content?.slice(0, 150);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm group"
    >
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onUserClick && onUserClick(user_id)}
            className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all cursor-pointer"
          >
            {profiles?.avatar_url ? (
              <img src={profiles.avatar_url} alt={profiles.username} className="w-full h-full object-cover" />
            ) : (
              profiles?.username?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span 
                onClick={() => onUserClick && onUserClick(user_id)}
                className="text-sm font-black text-white hover:text-blue-400 cursor-pointer transition-colors truncate"
              >
                {profiles?.username || 'Civic User'}
              </span>
              {profiles?.role === 'admin' && (
                <div className="p-0.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/40">
                   <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </div>
          </div>
        </div>

        {currentUserId && user_id !== currentUserId && (
          <button
            onClick={handleFollow}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              isFollowing
                ? 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                : 'bg-blue-600 border-blue-500/50 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            }`}
          >
            {isFollowing ? (
              <div className="flex items-center gap-1.5">
                <UserMinus className="w-3 h-3" />
                Unfollow
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-3 h-3" />
                Follow
              </div>
            )}
          </button>
        )}
      </div>

      {/* Media Carousel */}
      {post_media.length > 0 && (
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img
              key={post_media[currentImageIndex].url}
              src={post_media[currentImageIndex].url}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full object-cover"
              alt={`Post media ${currentImageIndex + 1}`}
            />
          </AnimatePresence>

          {/* Before/After Overlay */}
          {post_type === 'before-after' && (
            <div className="absolute top-4 left-4 flex gap-2">
               <div className={`px-3 py-1.5 rounded-full border backdrop-blur-md shadow-lg flex items-center gap-2 ${
                 post_media[currentImageIndex].label === 'before'
                   ? 'bg-orange-500/40 border-orange-500/50 text-white'
                   : 'bg-green-500/40 border-green-500/50 text-white'
               }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {post_media[currentImageIndex].label === 'before' ? 'Before Report' : 'After Resolved'}
                  </span>
               </div>
            </div>
          )}

          {/* Navigation Arrows */}
          {post_media.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Pagination Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {post_media.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex ? 'w-4 bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badge for Linked Issue */}
          {issues && (
            <div className="absolute bottom-4 left-4">
               <div className="px-3 py-1.5 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl flex items-center gap-2 text-white">
                  <TrendingUp className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">
                    {issues.title}
                  </span>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Interaction Buttons (Later functionality) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center gap-2 group/btn ${isLiked ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
            >
              <Heart className={`w-6 h-6 transition-transform group-active/btn:scale-125 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-black uppercase">Support</span>
            </button>
            <button className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors group/btn">
              <MessageCircle className="w-6 h-6 group-active/btn:scale-125 transition-transform" />
              <span className="text-[10px] font-black uppercase">Discuss</span>
            </button>
            <button className="flex items-center gap-2 text-slate-400 hover:text-green-500 transition-colors group/btn">
              <Share2 className="w-6 h-6 group-active/btn:scale-125 transition-transform" />
              <span className="text-[10px] font-black uppercase">Propagate</span>
            </button>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Text Content */}
        {content && (
          <div className="space-y-1">
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              <span 
                onClick={() => onUserClick && onUserClick(user_id)}
                className="font-extrabold mr-2 text-blue-400 cursor-pointer hover:underline decoration-blue-500/50"
              >
                {profiles?.username || 'Civic User'}
              </span>
              {displayContent}
              {isLongContent && !showFullContent && '...'}
            </p>
            {isLongContent && (
              <button 
                onClick={() => setShowFullContent(!showFullContent)}
                className="text-xs font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
              >
                {showFullContent ? 'Show Less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Impact Badge */}
        {post_type === 'before-after' && issues?.status === 'Resolved' && (
           <div className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/10 rounded-2xl group/impact">
              <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center group-hover/impact:scale-110 transition-transform">
                 <Award className="w-4 h-4 text-green-400" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Resolution Verified</p>
                 <p className="text-[11px] text-slate-400 font-bold italic">"Impact of collective civic action."</p>
              </div>
           </div>
        )}
      </div>
    </motion.div>
  );
};

export default PostCard;
