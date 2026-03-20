import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Flag, ChevronRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useIssues } from '../../context/IssueContext';
import IssueList from './IssueList';

const MOCK_AUTHORITIES = [
  {
    id: 'admin-leader',
    name: 'Hon. Rajesh Kumar',
    photo: 'https://images.unsplash.com/photo-1519085195481-4c3a195357b0?auto=format&fit=crop&q=80&w=200&h=200',
    area: 'Ward 42 - Central District',
    email: 'rajesh.kumar@civic-authority.gov.in',
    party: 'People\'s Progress Party',
    designation: 'Ward Councilor / Chief Administrator'
  }
];

const AuthoritiesView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { complaints, loading } = useIssues();

  if (id) {
    const authority = MOCK_AUTHORITIES.find(a => a.id === id);
    if (!authority) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold text-white mb-4">Authority not found</h2>
                <button 
                    onClick={() => navigate('/dashboard/responsible-authorities')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 rounded-2xl text-white font-bold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Authorities
                </button>
            </div>
        );
    }

    return (
      <div className="space-y-8 pb-20">
        <button 
            onClick={() => navigate('/dashboard/responsible-authorities')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
        >
            <ArrowLeft className="w-4 h-4" />
            Back to List
        </button>

        {/* Detail Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/5 backdrop-blur-xl"
        >
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            {/* Profile Photo */}
            <div className="w-32 h-32 rounded-3xl border-2 border-blue-500/20 p-1.5 bg-blue-500/5">
              <img 
                src={authority.photo} 
                alt={authority.name}
                className="w-full h-full object-cover rounded-[1.25rem] shadow-2xl shadow-blue-500/20"
              />
            </div>

            <div className="flex-grow text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h2 className="text-3xl font-black text-white">{authority.name}</h2>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
                  {authority.party}
                </div>
              </div>
              <p className="text-xl font-bold text-slate-400 mb-6">{authority.designation}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-300 bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">{authority.area}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">{authority.email}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32 rounded-full" />
        </motion.div>

        {/* Complaints Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="text-2xl font-black text-white mb-1">Ward Reports</h3>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Real-time Public Infrastructure Issues</p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 font-bold text-sm">
              {complaints.length} Total Complaints
            </div>
          </div>

          <IssueList issues={complaints} isAdmin={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-white tracking-tight">Responsible Authorities</h2>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Know your area leaders & their progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_AUTHORITIES.map((auth) => (
          <motion.div
            key={auth.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            onClick={() => navigate(`/dashboard/responsible-authorities/${auth.id}`)}
            className="group cursor-pointer p-6 rounded-[2rem] bg-slate-900/60 border border-white/5 hover:bg-slate-800/80 hover:border-blue-500/30 transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-blue-500/50 transition-colors">
                <img src={auth.photo} alt={auth.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{auth.name}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{auth.designation}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin className="w-4 h-4 text-blue-500/50" />
                <span className="font-medium">{auth.area}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Flag className="w-4 h-4 text-blue-500/50" />
                <span className="font-medium">{auth.party}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-blue-400 font-bold text-xs uppercase tracking-widest pt-4 border-t border-white/5">
              <span>View Profile & Progress</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
            
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AuthoritiesView;
