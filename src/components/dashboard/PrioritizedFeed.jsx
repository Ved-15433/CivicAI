import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';
import IssueList from './IssueList';

const PrioritizedFeed = React.memo(({ complaints, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [complaints, searchTerm]);

  return (
    <motion.div
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Public Feed</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">Prioritized Feed</h2>
          <p className="text-slate-500 italic mt-2">Real-time status of civic problems ranked by Gemini AI.</p>
        </div>

        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search all reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-11 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all w-full shadow-2xl"
          />
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Reports</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 shadow-inner">
             <Filter className="w-3 h-3 text-slate-500" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ranked by Score</span>
          </div>
        </div>
        
        {loading && complaints.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
             <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching ranked data...</p>
          </div>
        ) : (
          <IssueList issues={filteredComplaints} />
        )}
      </section>
    </motion.div>
  );
});

export default PrioritizedFeed;
