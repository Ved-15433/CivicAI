import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  CheckCircle2, 
  AtSign, 
  Info,
  Award,
  Star,
  Settings,
  X
} from 'lucide-react';
import { useIssues } from '../../context/IssueContext';
import { ALL_BADGES, getUnlockedBadges } from '../../lib/badges';
import { supabase } from '../../lib/supabase';

const ProfileView = () => {
  const { profile, user, updateProfile, uploadAvatar } = useIssues();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    featured_badges: []
  });

  const fetchUserStats = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('user_stats_view')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!error && data) {
      setUserStats(data);
    }
  };

  // Fetch initial stats
  useEffect(() => {
    fetchUserStats();
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        featured_badges: profile.featured_badges || []
      });
    }
  }, [profile]);

  const unlockedBadges = useMemo(() => {
    return getUnlockedBadges(userStats);
  }, [userStats]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleBadge = (badgeId) => {
    setFormData(prev => {
      const current = prev.featured_badges || [];
      if (current.includes(badgeId)) {
        return { ...prev, featured_badges: current.filter(id => id !== badgeId) };
      } else {
        if (current.length >= 3) return prev;
        return { ...prev, featured_badges: [...current, badgeId] };
      }
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const result = await uploadAvatar(file);
    setLoading(false);

    if (result.success) {
      setSaveStatus({ type: 'success', message: 'Avatar updated!' });
      fetchUserStats();
    } else {
      setSaveStatus({ type: 'error', message: result.error });
    }
    
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);

    const result = await updateProfile({
      full_name: formData.full_name,
      username: formData.username,
      bio: formData.bio,
      featured_badges: formData.featured_badges
    });

    setLoading(false);
    if (result.success) {
      setSaveStatus({ type: 'success', message: 'Profile updated successfully!' });
      fetchUserStats(); // Re-fetch stats to sync UI
    } else {
      setSaveStatus({ type: 'error', message: result.error });
    }

    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">User Settings</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Personal Profile</h2>
          <p className="text-slate-500 italic mt-2">Manage how you appear to the community and officials.</p>
        </div>
        
        {saveStatus && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
              saveStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {saveStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            {saveStatus.message}
          </motion.div>
        )}
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl flex flex-col items-center">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-40 h-40 rounded-[2.5rem] bg-slate-800 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500/50">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-600" />
                )}
                
                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-slate-900">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            
            <div className="mt-6 text-center">
              <h3 className="text-xl font-black text-white">{profile?.full_name || 'Volunteer'}</h3>
              <p className="text-sm text-slate-500 font-medium">{user?.email}</p>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">XP</p>
                <p className="text-lg font-black text-white">{userStats?.xp || 0}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rank</p>
                <p className="text-lg font-black text-blue-400">#{userStats?.rank || '?'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Earned Badges ({unlockedBadges.length})</h4>
            <div className="flex flex-wrap gap-3">
              {unlockedBadges.map(badge => (
                <div 
                  key={badge.id} 
                  title={badge.title}
                  className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400"
                >
                  <badge.icon className="w-6 h-6" />
                </div>
              ))}
              {unlockedBadges.length === 0 && (
                <p className="text-xs text-slate-500 italic">Complete your first report to earn a badge!</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 text-sm font-medium transition-all text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="unique_username"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 text-sm font-medium transition-all text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bio</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                placeholder="Tell the community a bit about yourself..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-blue-500/50 text-sm font-medium transition-all text-white placeholder:text-slate-600 resize-none"
              />
            </div>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
             <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Featured Badges (Max 3)</h4>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md uppercase tracking-tighter">
                  {formData.featured_badges?.length || 0} / 3 Selected
                </span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unlockedBadges.length > 0 ? (
                  unlockedBadges.map(badge => {
                    const isSelected = formData.featured_badges?.includes(badge.id);
                    return (
                      <div 
                        key={badge.id}
                        onClick={() => toggleBadge(badge.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-center gap-4 ${
                          isSelected 
                            ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/5' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-white'
                        }`}>
                          <badge.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-grow">
                          <p className={`text-xs font-black uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {badge.title}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium truncate w-40">
                            {badge.description}
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <Award className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-20" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Unlock badges to feature them</p>
                  </div>
                )}
             </div>
          </div>

          <div className="flex items-center justify-end gap-4 p-4">
             <button 
               type="button"
               disabled={loading}
               onClick={() => window.history.back()}
               className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
             >
               Cancel
             </button>
             <button 
               type="submit"
               disabled={loading}
               className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 min-w-[200px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? (
                 <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               ) : (
                 <>
                   <Save className="w-4 h-4" />
                   Save Changes
                 </>
               )}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileView;
