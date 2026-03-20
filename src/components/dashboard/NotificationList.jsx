import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  User, 
  ArrowRight,
  Inbox,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useIssues } from '../../context/IssueContext';

const NotificationList = ({ isOpen, onClose, onUserClick }) => {
  const { notifications, unreadCount, markNotificationAsRead } = useIssues();

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
    
    // If it's an upvote, we can open the actor's profile
    if (notification.type === 'issue_upvote' && notification.actor_user_id) {
      onUserClick(notification.actor_user_id);
      onClose();
    }
    // For status changes, maybe just closing the panel is enough or we could navigate to the issue
    // but the requirement says "if possible, tie to relevant complaint so user can open/view it"
    // For now, let's just mark it read. 
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await markNotificationAsRead(n.id);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile or just to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] lg:hidden bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/5 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Post Box</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {unreadCount} Unread Notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="Mark all as read"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Inbox className="w-10 h-10 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Quiet in here...</h3>
                    <p className="text-sm text-slate-500">You're all caught up with your civic alerts.</p>
                  </div>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                      notification.is_read
                        ? 'bg-slate-950/30 border-white/5 opacity-60'
                        : 'bg-white/5 border-white/10 hover:border-blue-500/30 ring-1 ring-transparent hover:ring-blue-500/20'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Icon based on type */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notification.type === 'status_change'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {notification.type === 'status_change' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <TrendingUp className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            notification.is_read ? 'text-slate-600' : 'text-blue-400'
                          }`}>
                            {notification.type === 'status_change' ? 'Status Update' : 'Support Received'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold mb-1 ${notification.is_read ? 'text-slate-400' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${notification.is_read ? 'text-slate-500' : 'text-slate-400'}`}>
                          {notification.message}
                        </p>
                        
                        {!notification.is_read && (
                          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-slate-900/50">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] text-center">
                CivicAI Notification Engine v1.0
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationList;
