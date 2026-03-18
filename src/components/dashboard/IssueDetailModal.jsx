import React from 'react';
import { motion } from 'framer-motion';
import { X, Shield, MapPin, Calendar, AlertCircle, Clock, Users, Sparkles, Building2, Heart, CheckCircle2 } from 'lucide-react';
import { useIssues } from '../../context/IssueContext';

import { supabase } from '../../lib/supabase';

const IssueDetailModal = React.memo(({ issue, onClose, isAdmin }) => {
  const { user, upvoteIssue, userUpvotes } = useIssues();
  const [updating, setUpdating] = React.useState(false);
  const [upvoting, setUpvoting] = React.useState(false);

  const hasUpvoted = React.useMemo(() => {
    return userUpvotes.some(v => v.issue_id === issue.id);
  }, [userUpvotes, issue.id]);

  const handleUpvote = async () => {
    if (!user) return alert('Please login to support this issue');
    if (hasUpvoted) return;

    setUpvoting(true);
    const result = await upvoteIssue(issue.id);
    setUpvoting(false);

    if (result.error) {
      alert(result.error);
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issue.id);

      if (error) throw error;
      onClose();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusActionButtons = () => {
    if (!isAdmin) return null;

    const buttons = [
      { label: 'Acknowledge', status: 'approved', color: 'bg-blue-600 hover:bg-blue-500' },
      { label: 'In Progress', status: 'in-progress', color: 'bg-indigo-600 hover:bg-indigo-500' },
      { label: 'Resolve', status: 'resolved', color: 'bg-green-600 hover:bg-green-500' },
    ];

    return (
      <div className="pt-6 border-t border-white/10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Admin Actions</p>
        <div className="flex flex-wrap gap-3">
          {buttons.filter(b => b.status !== issue.status).map((btn) => (
            <button
              key={btn.status}
              disabled={updating}
              onClick={() => updateStatus(btn.status)}
              className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black text-white uppercase tracking-widest transition-all ${btn.color} disabled:opacity-50`}
            >
              {updating ? 'Updating...' : btn.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 500 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] glass border border-white/10 bg-slate-900 shadow-2xl flex flex-col md:flex-row"
      >
        {/* Left Side: Image & Key Info */}
        <div className="w-full md:w-[45%] bg-slate-950/50 border-r border-white/5 overflow-y-auto">
          <div className="relative h-64 md:h-full min-h-[300px]">
            {issue.image_url ? (
              <img 
                src={issue.image_url.startsWith('http') ? issue.image_url : `https://ethoqrgqgjpgbwdfwizn.supabase.co/storage/v1/object/public/complaint-images/${issue.image_url}`} 
                alt={issue.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-700 gap-4">
                 <Shield className="w-20 h-20 opacity-20" />
                 <p className="text-sm font-bold uppercase tracking-widest">No Image Provided</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2 bg-slate-950/50 hover:bg-slate-950 rounded-full text-white backdrop-blur-md transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
                Case Report
              </span>
              <span className="text-slate-500 text-sm font-medium">#{issue.id.slice(0, 8)}</span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest ml-auto">
                 <Users className="w-3 h-3" />
                 {issue.unique_user_count || issue.report_count || 1} { (issue.unique_user_count || issue.report_count || 1) === 1 ? 'Citizen' : 'Citizens' } Reported
              </div>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight mb-2">{issue.title}</h2>
            <div className="flex items-center gap-4 text-slate-500 text-sm">
               <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(issue.created_at).toLocaleDateString()}
               </div>
               <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {issue.location_label || (issue.latitude ? `Lat: ${issue.latitude.toFixed(4)}, Lng: ${issue.longitude.toFixed(4)}` : 'Location N/A')}
                  </span>
                  {issue.location_label && issue.latitude && (
                    <span className="text-[10px] opacity-50 ml-1 block md:inline font-mono">
                      ({issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)})
                    </span>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Description</h4>
            <p className="text-slate-300 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
              {issue.description}
            </p>
          </div>

          {/* AI Prioritization Stats */}
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Gemini AI Analysis</h4>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                   <div className="flex items-center gap-2 mb-1.5 opacity-60">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Severity</span>
                   </div>
                   <p className="text-xl font-bold text-white">
                     {issue.severity !== null ? `${issue.severity}/5` : '—'}
                   </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                   <div className="flex items-center gap-2 mb-1.5 opacity-60">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Urgency</span>
                   </div>
                   <p className="text-xl font-bold text-white">
                     {issue.urgency !== null ? `${issue.urgency}/5` : '—'}
                   </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                   <div className="flex items-center gap-2 mb-1.5 opacity-60">
                      <Users className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Impact</span>
                   </div>
                   <p className="text-xl font-bold text-white">
                     {issue.public_impact !== null ? `${issue.public_impact}/5` : '—'}
                   </p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                   <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Priority</span>
                   </div>
                   <p className="text-xl font-black text-blue-400">
                     {issue.priority_score !== null ? issue.priority_score.toFixed(1) : 'PENDING'}
                   </p>
                </div>
             </div>

              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <p className="text-xs font-black text-blue-400/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Sparkles className="w-3 h-3" /> AI Analysis Report
                </p>
                {issue.analysis_status === 'failed' ? (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Analysis Failed: {issue.error_message || "Unknown error"}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-blue-100/80 text-sm leading-relaxed italic">
                       {issue.ai_summary ? `"${issue.ai_summary}"` : (issue.analysis_status === 'processing' ? "AI is currently analyzing this report..." : "AI Analysis queued.")}
                    </p>
                    {issue.resolution_prediction && (
                      <div className="flex items-center gap-2 pt-2 border-t border-blue-500/10">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AI Prediction:</span>
                        <span className="text-xs font-bold text-blue-300">{issue.resolution_prediction}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-white/5">
             <button
               disabled={upvoting || hasUpvoted || !user || issue.status === 'resolved'}
               onClick={handleUpvote}
               className={`flex-1 p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                 hasUpvoted 
                   ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 group cursor-default' 
                   : (issue.status === 'resolved' 
                      ? 'bg-slate-800 border-white/5 text-slate-500 cursor-not-allowed'
                      : 'bg-white/5 border-white/5 hover:border-rose-500/30 text-slate-400 hover:text-rose-400')
               }`}
             >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  hasUpvoted ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-800 text-slate-500 group-hover:text-rose-500'
                }`}>
                   <Heart className={`w-5 h-5 ${hasUpvoted ? 'fill-current' : ''}`} />
                </div>
                <div className="text-left">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                     {hasUpvoted ? 'Thank you' : (issue.status === 'resolved' ? 'Resolution' : 'Community Support')}
                   </p>
                   <p className="text-sm font-bold uppercase">
                     {hasUpvoted ? 'Already Supported' : (issue.status === 'resolved' ? 'Issue Resolved' : "I'm also affected")}
                   </p>
                </div>
                {hasUpvoted && (
                  <CheckCircle2 className="w-5 h-5 ml-auto text-rose-500" />
                )}
             </button>

             <div className="flex-1 p-4 rounded-2xl bg-slate-950/50 border border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                   <Building2 className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Assigned Unit</p>
                   <p className="text-sm font-bold text-white truncate">{issue.departments?.name || 'In Triage'}</p>
                </div>
             </div>
          </div>

          {getStatusActionButtons()}
        </div>
      </motion.div>
    </div>
  );
});

export default IssueDetailModal;
