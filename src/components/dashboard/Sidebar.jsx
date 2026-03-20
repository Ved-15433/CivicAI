import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  LayoutList, 
  UserCircle, 
  LogOut, 
  ChevronRight,
  Zap,
  Trophy,
  Award,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { useIssues } from '../../context/IssueContext';

const Sidebar = React.memo(({ user, isAdmin }) => {
  const navigate = useNavigate();
  const { signOut, profile } = useIssues();

  const userMenuItems = [
    { name: 'System Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { name: 'Live Map', icon: MapPin, path: '/dashboard/map' },
    { name: 'Responsible Authorities', icon: ShieldCheck, path: '/dashboard/responsible-authorities' },
    { name: 'Prioritized Feed', icon: LayoutList, path: '/dashboard/feed' },
    { name: 'My Complaints', icon: UserCircle, path: '/dashboard/my-complaints' },
    { name: 'Civic Impact', icon: Zap, path: '/dashboard/impact' },
    { name: 'Achievements', icon: Award, path: '/dashboard/achievements' },
    { name: 'Leaderboard', icon: Trophy, path: '/dashboard/leaderboard' },
  ];

  const adminMenuItems = [
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { name: 'Live Map', icon: MapPin, path: '/admin/map' },
    { name: 'Drainage & Flooding', icon: LayoutList, path: '/admin/drainage-flooding' },
    { name: 'Waste & Sanitation', icon: LayoutList, path: '/admin/waste-sanitation' },
    { name: 'Roads & Bridges', icon: LayoutList, path: '/admin/roads-bridges' },
    { name: 'Water Supply', icon: LayoutList, path: '/admin/water-supply' },
    { name: 'Electricity', icon: LayoutList, path: '/admin/electricity' },
    { name: 'Others', icon: LayoutList, path: '/admin/others' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 bg-slate-900/50 border-r border-white/5 backdrop-blur-xl z-50 flex flex-col pt-8 pb-6 px-4">
      {/* Branding */}
      <div className="flex items-center gap-3 px-4 mb-12 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
          C
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">CivicAI</h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Dash Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow space-y-2">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />
                  <span className="text-sm font-bold">{item.name}</span>
                </div>
                {isActive && (
                  <motion.div layoutId="sidebar-active" className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                )}
                {!isActive && (
                   <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t border-white/5 pt-6 space-y-4">
        <div 
          onClick={() => navigate('/dashboard/profile')}
          className="flex items-center gap-3 px-4 group/user cursor-pointer hover:bg-white/5 py-3 rounded-2xl transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 font-bold overflow-hidden transition-transform group-hover/user:scale-110">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              (profile?.full_name || user?.email)?.[0].toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-bold text-white truncate transition-colors group-hover/user:text-blue-400">
              {profile?.username || profile?.full_name || user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
