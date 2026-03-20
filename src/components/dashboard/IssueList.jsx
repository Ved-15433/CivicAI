import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MapPin, Calendar, ArrowRight, Star, AlertTriangle, Info, Users, Heart } from 'lucide-react';
import { useIssues } from '../../context/IssueContext';
import IssueDetailModal from './IssueDetailModal';

const IssueList = React.memo(({ issues, isAdmin }) => {
  const { user, upvoteIssue, userUpvotes } = useIssues();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [upvotingId, setUpvotingId] = useState(null);

  const hasUpvoted = (issueId) => userUpvotes.some(v => v.issue_id === issueId);

  const handleUpvote = async (e, issueId) => {
    e.stopPropagation();
    if (!user) return alert('Please login to support this issue');
    if (hasUpvoted(issueId)) return;

    setUpvotingId(issueId);
    await upvoteIssue(issueId);
    setUpvotingId(null);
  };

  const getSeverityStyle = (severity) => {
    if (severity >= 5) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (severity >= 4) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (severity >= 3) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if (severity >= 2) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-green-400 bg-green-500/10 border-green-500/20';
  };

  const statusStyles = {
    'Pending': 'bg-slate-800 text-slate-400',
    'Acknowledged': 'bg-blue-500/20 text-blue-400',
    'In Progress': 'bg-indigo-500/20 text-indigo-400',
    'Resolved': 'bg-green-500/20 text-green-400',
    'Rejected': 'bg-red-500/20 text-red-400',
  };

  if (issues.length === 0) {
    return (
      <div className="text-center py-20 rounded-3xl glass border border-white/5 bg-slate-900/20">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info className="text-slate-500 w-8 h-8" />
        </div>
        <h3 className="text-white font-bold text-xl mb-1">No reports found</h3>
        <p className="text-slate-500 text-sm">Be the first to help your city by reporting an issue.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {issues.map((issue) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={() => setSelectedIssue(issue)}
              className="group cursor-pointer p-6 rounded-3xl bg-slate-900/60 border border-white/5 hover:bg-slate-800/80 hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-xl border flex items-center gap-2 ${getSeverityStyle(issue.severity)}`}>
                   <AlertTriangle className="w-3 h-3" />
                   <span className="text-xs font-black">{issue.severity !== null ? `Level ${issue.severity}` : 'Analysis Pending'}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    {user && issue.status !== 'resolved' && (
                      <button 
                        onClick={(e) => handleUpvote(e, issue.id)}
                        disabled={upvotingId === issue.id || hasUpvoted(issue.id)}
                        className={`p-2 rounded-xl border transition-all ${
                          hasUpvoted(issue.id) 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' 
                            : 'bg-white/5 border-white/5 hover:border-rose-500/30 text-slate-500 hover:text-rose-500'
                        }`}
                      >
                         <Heart className={`w-3.5 h-3.5 ${hasUpvoted(issue.id) ? 'fill-current' : ''} ${upvotingId === issue.id ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-lg font-black">{issue.priority_score !== null ? issue.priority_score.toFixed(1) : '—'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Priority</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-grow">
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">{issue.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                  {issue.ai_summary || issue.description}
                </p>
                
                <div className="flex items-center gap-2 mb-4 bg-blue-500/5 px-3 py-2 rounded-2xl border border-blue-500/10 w-fit">
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(issue.unique_user_count || issue.report_count || 1, 3) }).map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                        <Users className="w-3 h-3 text-blue-400" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-blue-400">
                    {issue.unique_user_count || issue.report_count || 1} { (issue.unique_user_count || issue.report_count || 1) === 1 ? 'citizen' : 'citizens' } reported this
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    {issue.category || 'Unclassified'}
                  </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${statusStyles[issue.status] || statusStyles['Pending']}`}>
                      {issue.status === 'Acknowledged' ? 'Acknowledged' : (issue.status === 'In Progress' ? 'In Progress' : (issue.status === 'Pending' || !issue.status ? 'Reported' : issue.status))}
                    </span>
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                  {issue.location_label && (
                    <div className="flex items-center gap-1.5 text-slate-500 max-w-[120px]">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="text-[10px] font-medium truncate">{issue.location_label}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-blue-400 font-bold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                  View Case <ArrowRight className="w-3 h-3" />
                </div>
              </div>
              
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailModal 
            issue={selectedIssue} 
            onClose={() => setSelectedIssue(null)} 
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </>
  );
});

export default IssueList;
