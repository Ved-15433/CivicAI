import React from 'react';
import Navbar from '../components/landing/Navbar';
import BackgroundEffects from '../components/landing/BackgroundEffects';
import { ClipboardList } from 'lucide-react';

const MyComplaints = () => {
  return (
    <div className="relative min-h-screen bg-slate-950 px-6">
      <BackgroundEffects />
      <Navbar />
      
      <main className="relative z-10 pt-32 pb-20 mx-auto max-w-7xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">My Reported Issues</h1>
            <p className="text-slate-400">Track the status of cases you've submitted</p>
          </div>
        </div>

        <div className="p-12 text-center rounded-3xl glass border border-white/10">
          <p className="text-xl text-slate-400 mb-6">No issues reported yet.</p>
          <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors">
            Report Your First Issue
          </button>
        </div>
      </main>
    </div>
  );
};

export default MyComplaints;
