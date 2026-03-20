import React from 'react';
import { motion } from 'framer-motion';
import { X, Shield, MapPin, Calendar, AlertCircle, Clock, Users, Sparkles, Building2, Heart, CheckCircle2, ClipboardCheck, Loader2, ClipboardList } from 'lucide-react';
import { useIssues } from '../../context/IssueContext';

import { supabase } from '../../lib/supabase';

const IssueDetailModal = React.memo(({ issue: initialIssue, onClose, isAdmin }) => {
  const { user, upvoteIssue, userUpvotes, complaints, updateIssue } = useIssues();
  
  // Track this issue live from the global state to react to real-time status updates
  const issue = React.useMemo(() => 
    complaints.find(c => c.id === initialIssue.id) || initialIssue, 
  [complaints, initialIssue]);

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
      // Use the context-level updateIssue which handles optimistic local state update 
      // + remote DB update. This ensures the progress bar reacts INSTANTLY.
      const result = await updateIssue(issue.id, { status: newStatus });
      
      if (result.error) throw new Error(result.error);
      
      // Do not close the modal on status change to allow viewing of the progress tracker update
      // onClose(); 
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
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

  const StatusTracker = ({ status }) => {
    const stages = [
      { label: 'Reported', status: 'pending', icon: ClipboardList },
      { label: 'Acknowledged', status: 'approved', icon: ClipboardCheck },
      { label: 'In Progress', status: 'in-progress', icon: Loader2 },
      { label: 'Resolved', status: 'resolved', icon: CheckCircle2 },
    ];

    const currentStageIndex = stages.findIndex(s => s.status === status);
    // If status is not found (e.g. pending isn't exactly 'pending'?), default to index 0
    const activeIndex = currentStageIndex === -1 ? 0 : currentStageIndex;

    return (
      <div className="w-full pt-4 pb-4">
        <div className="relative flex justify-between items-center px-4">
          {/* Background Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-white/5 -translate-y-1/2 rounded-full" />
          
          {/* Progress Line */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(activeIndex / (stages.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className={`absolute top-1/2 left-0 h-1 bg-gradient-to-r ${status === 'resolved' ? 'from-green-500 to-emerald-500' : 'from-blue-600 to-indigo-600'} -translate-y-1/2 rounded-full`}
          />

          {stages.map((stage, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.label} className="relative flex flex-col items-center z-10">
                <motion.div 
                  initial={false}
                  animate={isCurrent ? { scale: 1.15 } : { scale: 1 }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                    status === 'resolved' && index === 3
                      ? 'bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                      : isCompleted 
                        ? 'bg-blue-500 border-blue-400 text-white' 
                        : isCurrent 
                          ? 'bg-slate-900 border-blue-500 text-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.3)]' 
                          : 'bg-slate-950 border-white/10 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5px]" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isCurrent ? (stage.status === 'in-progress' ? 'animate-spin' : 'animate-pulse') : ''}`} />
                  )}
                </motion.div>
                <div className="absolute top-12 whitespace-nowrap text-center">
                  <p className={`text-[9px] font-black uppercase tracking-[0.15em] ${
                    isCurrent ? 'text-blue-400' : isCompleted ? 'text-slate-300' : 'text-slate-600 font-bold'
                  }`}>
                    {stage.label}
                  </p>
                </div>
              </div>
            );
          })}
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

          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Progress</h4>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border shadow-sm ${
                issue.status === 'resolved' 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : (issue.status === 'in-progress' 
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : (issue.status === 'approved' 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-slate-500/10 border-slate-500/30 text-slate-400'))
              }`}>
                {issue.status === 'approved' ? 'Acknowledged' : (issue.status === 'in-progress' ? 'In Progress' : (issue.status === 'pending' || !issue.status ? 'Reported' : issue.status))}
              </span>
            </div>
            
            <StatusTracker status={issue.status} />

            <div className="pt-8 opacity-60">
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Detailed Report</h4>
               <p className="text-slate-400 text-sm leading-relaxed italic line-clamp-3 bg-white/5 p-4 rounded-xl border border-white/5">
                 {issue.description}
               </p>
            </div>
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
