import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Mail, ArrowRight } from 'lucide-react';
import { useIssues } from '../context/IssueContext';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const { user, profile, loading } = useIssues();
  const location = useLocation();
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const message = location.state?.message;

  // If already logged in, redirect appropriately
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Verifying Session...</p>
        </div>
      </div>
    );
  }

  // Check for local storage admin as well
  const isLocalStorageAdmin = localStorage.getItem('isAdmin') === 'true';

  if (user || isLocalStorageAdmin) {
    // If we have a profile and it's admin, go to admin
    if (profile?.role === 'admin' || isLocalStorageAdmin) {
      return <Navigate to="/admin" replace />;
    }
    // Otherwise, or if profile is still fetching/missing, default to user dashboard
    return <Navigate to="/dashboard/analytics" replace />;
  }

  const handleGoogleLogin = async () => {
    setError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message);
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setError(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard',
        }
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'CivicAdmin123';

    if (adminUsername === ADMIN_USER && adminPassword === ADMIN_PASS) {
      localStorage.setItem('isAdmin', 'true');
      window.location.href = '/admin'; // Force reload to pick up status
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8 rounded-[2rem] glass border border-white/10 shadow-2xl bg-slate-900/40 backdrop-blur-xl"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-blue-600/20 text-blue-500"
          >
            <Shield className="w-8 h-8" />
          </motion.div>
          
          <h1 className="mb-2 text-3xl font-bold text-white">Welcome</h1>
          <p className="mb-8 text-slate-400">
            {message || "Sign in to report and track civic issues"}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400"
            >
              <p className="font-bold text-lg mb-2">Check your inbox</p>
              <p className="text-sm opacity-80 leading-relaxed">
                We've sent a secure login link to <br/>
                <span className="text-white font-medium">{email}</span>
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {!showAdminLogin ? (
                <>
                  <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                          type="email"
                          placeholder="name@example.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-5 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-medium"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading || loading}
                      className="w-full py-4 text-lg font-bold text-white transition-all duration-300 bg-blue-600 rounded-2xl hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {authLoading ? "Sending..." : <>Continue with Email <ArrowRight className="w-5 h-5" /></>}
                    </button>
                  </form>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
                      <span className="bg-[#0f172a] px-4 text-slate-500">Secure Gateway</span>
                    </div>
                  </div>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={authLoading || loading}
                    className="flex items-center justify-center w-full gap-3 px-6 py-4 font-bold text-white transition-all duration-300 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 group transform active:scale-[0.98]"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 8.7-2.6 3.3-4.53 12-4.53z" />
                    </svg>
                    Sign in with Google
                  </button>

                  <div className="pt-4 text-center">
                    <button 
                      onClick={() => setShowAdminLogin(true)}
                      className="text-[10px] text-slate-500 hover:text-blue-400 font-bold uppercase tracking-[0.2em] transition-colors"
                    >
                      Admin Access
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Admin Username</label>
                    <input
                      type="text"
                      placeholder="Username"
                      required
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Admin Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 text-lg font-bold text-white transition-all duration-300 bg-slate-800 rounded-2xl hover:bg-slate-700 hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Login as Admin <Shield className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setShowAdminLogin(false)}
                      className="text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-[0.2em] transition-colors pt-2"
                    >
                      Back to User Login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          
          <div className="mt-8 text-[10px] text-slate-600 uppercase tracking-widest leading-relaxed">
            Personal data is encrypted <br/> 
            secured by Supabase Auth
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
