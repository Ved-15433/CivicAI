import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/report');
    } else {
      navigate('/login', { state: { message: "Please sign in to report a civic issue." } });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 mx-auto max-w-7xl"
    >
      <Link to="/" className="flex items-center gap-2 group cursor-pointer">
        <div className="p-2 transition-transform duration-300 rounded-lg bg-blue-600/20 group-hover:scale-110">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">CivicAI</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
        <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button 
              onClick={handleSignOut}
              className="px-5 py-2 text-sm font-semibold transition-all duration-300 rounded-full glass hover:bg-white/10 text-white"
            >
              Sign Out
            </button>
            <button 
              onClick={() => navigate('/report')}
              className="px-5 py-2 text-sm font-semibold text-white transition-all duration-300 bg-blue-600 rounded-full hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Report New
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="px-5 py-2 text-sm font-semibold transition-all duration-300 rounded-full glass hover:bg-white/10 text-white">
              Sign In
            </Link>
            <button 
              onClick={handleGetStarted}
              className="px-5 py-2 text-sm font-semibold text-white transition-all duration-300 bg-blue-600 rounded-full hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
