import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusCircle, 
  Trash2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Brain,
  MapPin,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import IssueDetailModal from './IssueDetailModal';
import { useIssues } from '../../context/IssueContext';

const UserComplaints = React.memo(() => {
  const { user, userReports: complaints, userReportsLoading: loading, isAdmin } = useIssues();
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);

  const handleDelete = async () => {
    if (!issueToDelete) return;
    setDeletingId(issueToDelete);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', issueToDelete);

      if (error) throw error;
      setShowConfirm(false);
      setIssueToDelete(null);
    } catch (err) {
      console.error('Error deleting complaint:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const statusIcons = {
    processing: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    failed: <XCircle className="w-4 h-4 text-red-400" />,
    pending: <Clock className="w-4 h-4 text-slate-500" />
  };

  const statusLabels = {
    processing: 'Analyzing...',
    completed: 'Analysis Done',
    failed: 'Analysis Failed',
    pending: 'In Queue'
  };

  const resolutionStyles = {
    'Pending': 'bg-slate-800 text-slate-400',
    'Acknowledged': 'bg-blue-500/20 text-blue-400',
    'In Progress': 'bg-indigo-500/20 text-indigo-400',
    'Resolved': 'bg-green-500/20 text-green-400 border border-green-500/30'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing your reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Personal Workspace</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">My Complaints</h2>
          <p className="text-slate-500 italic mt-2">Manage and track your reported civic issues.</p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          Report New
        </Link>
      </header>

      <div className="pb-10">
        {complaints.length === 0 ? (
          <div className="text-center py-20 rounded-[2.5rem] glass border border-white/5 bg-slate-900/20">
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-slate-700 w-10 h-10" />
            </div>
            <h3 className="text-white font-black text-2xl mb-2">No Reports Yet</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
              You haven't submitted any civic issues. Your reports help make the city better for everyone.
            </p>
            <Link to="/report" className="text-blue-400 font-black uppercase tracking-widest text-sm hover:underline">
              Submit your first report
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {complaints.map((report) => {
                const issue = report.issues || report;
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    onClick={() => setSelectedIssue(issue)}
                    className="group cursor-pointer p-6 rounded-3xl bg-slate-900/60 border border-white/5 hover:bg-slate-800/80 hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-white/5 text-slate-500`}>
                        {issue.category || 'Triage'}
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation();
                             setIssueToDelete(report.id);
                             setShowConfirm(true);
                          }}
                          className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {report.title || issue.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                        {issue.ai_summary || issue.description || report.description}
                      </p>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5">
                          {statusIcons[issue.analysis_status] || statusIcons.pending}
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {statusLabels[issue.analysis_status] || statusLabels.pending}
                          </span>
                        </div>
                        {issue.priority_score && (
                          <div className="flex items-center gap-1.5 text-blue-400">
                             <Sparkles className="w-3 h-3" />
                             <span className="text-[10px] font-black uppercase tracking-tighter">
                                Score: {issue.priority_score.toFixed(1)}
                             </span>
                          </div>
                        )}
                        <div className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${resolutionStyles[issue.status] || resolutionStyles['Pending']}`}>
                           {issue.status === 'Acknowledged' ? 'Acknowledged' : (issue.status === 'In Progress' ? 'In Progress' : (issue.status === 'Pending' || !issue.status ? 'Reported' : issue.status))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-blue-400 font-bold text-xs uppercase tracking-widest group-hover:gap-2 transition-all">
                        View <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm p-8 rounded-[2rem] glass border border-red-500/20 bg-slate-900 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Report?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                This action cannot be undone. All data associate with this report will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={!!deletingId}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center"
                >
                  {deletingId ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Delete Case"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIssue && (
          <IssueDetailModal 
            issue={selectedIssue} 
            onClose={() => setSelectedIssue(null)} 
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default UserComplaints;
