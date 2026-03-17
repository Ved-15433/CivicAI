import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import IssueList from '../dashboard/IssueList';
import { LayoutList, Search, Filter } from 'lucide-react';

const AdminDepartmentView = React.memo(({ title, complaints, loading, isAdmin }) => {
  // Sorting is handled here: sort by citizen count (unique_user_count) descending
  const filteredIssues = useMemo(() => {
    if (!complaints) return [];
    
    // Filter by department name or category based on the title
    const filtered = complaints.filter(issue => {
      const deptName = issue.departments?.name?.toLowerCase() || '';
      const category = issue.category?.toLowerCase() || '';
      const searchTitle = title.toLowerCase();

      // Mapping logic
      if (searchTitle.includes('drainage') || searchTitle.includes('flooding')) {
        return category.includes('drainage') || category.includes('flooding') || deptName.includes('drainage') || deptName.includes('flooding');
      }
      if (searchTitle.includes('waste') || searchTitle.includes('sanitation')) {
        return category.includes('waste') || category.includes('sanitation') || deptName.includes('sanitation') || deptName.includes('waste') || deptName.includes('sewage');
      }
      if (searchTitle.includes('road') || searchTitle.includes('bridge')) {
        return category.includes('road') || category.includes('bridge') || deptName.includes('road') || deptName.includes('bridge');
      }
      if (searchTitle.includes('water')) {
        return deptName.includes('water') || category.includes('water');
      }
      if (searchTitle.includes('electr')) {
        return deptName.includes('electr') || category.includes('electr');
      }
      if (searchTitle.includes('other')) {
        // For 'Others', we show issues that didn't match the specific departments above
        const isSpecific = (
          category.includes('drainage') || category.includes('flooding') || deptName.includes('drainage') || deptName.includes('flooding') ||
          category.includes('waste') || category.includes('sanitation') || deptName.includes('sanitation') || deptName.includes('waste') || deptName.includes('sewage') ||
          category.includes('road') || category.includes('bridge') || deptName.includes('road') || deptName.includes('bridge') ||
          deptName.includes('water') || category.includes('water') ||
          deptName.includes('electr') || category.includes('electr')
        );
        return !isSpecific || deptName.includes('other');
      }
      
      return false;
    });

    // Sort by unique_user_count (Citizen count) descending
    return filtered.sort((a, b) => (b.unique_user_count || 1) - (a.unique_user_count || 1));
  }, [complaints, title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 pb-20"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LayoutList className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Departmental Queue</span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">{title}</h2>
          <p className="text-slate-500 italic mt-2">Managing {filteredIssues.length} active complaints in this sector.</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search issues..."
                className="pl-11 pr-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all min-w-[240px]"
              />
           </div>
           <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all">
              <Filter className="w-5 h-5" />
           </button>
        </div>
      </header>

      <IssueList issues={filteredIssues} isAdmin={isAdmin} />
    </motion.div>
  );
});

export default AdminDepartmentView;
