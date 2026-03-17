import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2, FileText, Users } from 'lucide-react';

const COLOR_MAPPING = {
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  green: 'text-green-400 bg-green-500/10 border-green-500/20',
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

const StatsCards = React.memo(({ stats }) => {
  const cards = useMemo(() => [
    { 
      label: 'Total Reports', 
      value: stats.total, 
      icon: FileText, 
      color: 'blue',
      description: 'Reports submitted by citizens'
    },
    { 
      label: 'Critical Issues', 
      value: stats.critical, 
      icon: AlertCircle, 
      color: 'red',
      description: 'Severity level 4 and 5'
    },
    { 
      label: 'Pending', 
      value: stats.pending, 
      icon: Clock, 
      color: 'amber',
      description: 'Waiting for AI/Admin review'
    },
    { 
      label: 'Citizens Engaged', 
      value: stats.citizens, 
      icon: Users, 
      color: 'indigo',
      description: 'Unique users helping the city'
    },
  ], [stats]);

  const getColorClasses = (color) => COLOR_MAPPING[color] || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-6 rounded-3xl glass border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-2xl ${getColorClasses(card.color).split(' ')[1]}`}>
              <card.icon className={`w-6 h-6 ${getColorClasses(card.color).split(' ')[0]}`} />
            </div>
            {/* Subtle pulse for critical */}
            {card.color === 'red' && card.value > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
          <h3 className="text-4xl font-black text-white mb-1">{card.value}</h3>
          <p className="text-slate-400 font-bold text-sm tracking-wide uppercase">{card.label}</p>
          <p className="text-[10px] text-slate-500 mt-2 italic">{card.description}</p>
          
          {/* Background decoration */}
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <card.icon className="w-24 h-24 text-white" />
          </div>
        </motion.div>
      ))}
    </div>
  );
});

export default StatsCards;
