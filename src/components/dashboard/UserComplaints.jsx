import React, { useState, useEffect } from 'react';
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
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import IssueDetailModal from './IssueDetailModal';

const UserComplaints = React.memo(({ userId }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);

  const fetchUserComplaints = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, issues(*, departments(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching user complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserComplaints();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('my_complaints_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComplaints(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setComplaints(prev => prev.filter(c => c.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setComplaints(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleDelete = async () => {
    if (!issueToDelete) return;
    setDeletingId(issueToDelete);
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', issueToDelete);

      if (error) throw error;
      setComplaints(prev => prev.filter(c => c.id !== issueToDelete));
      setShowConfirm(false);
      setIssueToDelete(null);
    } catch (err) {
      console.error('Error deleting complaint:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'processing': return 'Analyzing...';
      case 'completed': return 'Analysis Done';
      case 'failed': return 'Analysis Failed';
      default: return 'In Queue';
    }
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
    <div className="space-y-8">
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
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {complaints.map((issue) => (
              <motion.div
                key={issue.id}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:bg-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row items-center gap-6"
              >
                {/* Thumbnail */}
                <div className="w-full md:w-24 h-24 rounded-2xl bg-slate-950 overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setSelectedIssue(issue.issues || issue)}>
                  {issue.image_url ? (
                    <img 
                      src={`https://ethoqrgqgjpgbwdfwizn.supabase.co/storage/v1/object/public/complaint-images/${issue.image_url}`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-800">
                      <Brain className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0 w-full cursor-pointer" onClick={() => setSelectedIssue(issue.issues || issue)}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-white/5 text-slate-500`}>
                      {issue.issues?.category || issue.category || 'Triage'}
                    </span>
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                       {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                    {(issue.issues?.location_label || issue.location_label) && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <div className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-[150px]">
                            {issue.issues?.location_label || issue.location_label}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <h4 className="text-white font-bold text-lg truncate group-hover:text-blue-400 transition-colors">
                    {issue.title || issue.issues?.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(issue.issues?.analysis_status || issue.analysis_status)}
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {getStatusLabel(issue.issues?.analysis_status || issue.analysis_status)}
                      </span>
                    </div>
                    {(issue.issues?.priority_score || issue.priority_score) && (
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-xs font-black uppercase tracking-tighter">
                          Score: {(issue.issues?.priority_score || issue.priority_score).toFixed(1)}
                        </span>
                      </div>
                    )}
                    {issue.issues?.report_count > 1 && (
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <Users className="w-3 h-3" />
                        <span className="text-xs font-black uppercase tracking-tighter">
                          {issue.issues.report_count} Reports
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       setIssueToDelete(issue.id);
                       setShowConfirm(true);
                    }}
                    className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={() => setSelectedIssue(issue.issues || issue)}
                    className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                   >
                     <ChevronRight className="w-5 h-5 flex-shrink-0" />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default UserComplaints;
