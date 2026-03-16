import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const Hero = () => {
  const navigate = useNavigate();

  const handleReportClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      navigate('/report');
    } else {
      navigate('/login', { state: { message: "Please sign in to report a civic issue." } });
    }
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden lg:pt-48 lg:pb-32">
      <div className="container relative z-10 px-6 mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-1 mb-8 text-sm font-medium border rounded-full bg-blue-500/10 border-blue-500/20 text-blue-400"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Civic Response</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-extrabold tracking-tight text-white md:text-7xl lg:text-8xl leading-[1.1]"
          >
            Prioritize what <br />
            <span className="text-gradient">actually matters.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mt-8 text-lg leading-relaxed text-slate-400 md:text-xl"
          >
            Empower your city with an AI agent that triages complaints in real-time. 
            From gas leaks to graffiti, we ensure critical issues get addressed first.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mt-10"
          >
            <button 
              onClick={handleReportClick}
              className="flex items-center gap-2 px-8 py-4 text-lg font-bold text-white transition-all duration-300 bg-blue-600 rounded-2xl hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/40 group"
            >
              Report an Issue
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <Link to="/dashboard" className="px-8 py-4 text-lg font-bold transition-all duration-300 rounded-2xl glass hover:bg-white/10 text-white">
              View Dashboard
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-20 text-sm font-medium text-slate-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span>Multimodal AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span>Real-time Prioritization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <span>Automated Routing</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hero Visual Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 50 }}
        className="relative mx-auto mt-20 max-w-5xl px-6"
      >
        <div className="relative p-2 rounded-3xl glass shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-white/5 aspect-[16/9] flex items-center justify-center">
            {/* Mock UI Elements */}
            <div className="w-[80%] h-[70%] grid grid-cols-3 gap-4">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="rounded-xl bg-white/5 animate-pulse" />
               ))}
            </div>
          </div>
        </div>
        
        {/* Floating Decorative Elements */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -right-8 p-4 glass rounded-2xl shadow-xl hidden lg:block"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 font-bold">!</span>
             </div>
             <div>
                <p className="text-xs text-slate-400">Critical Priority</p>
                <p className="text-sm font-bold text-white">Gas Leak Detected</p>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
