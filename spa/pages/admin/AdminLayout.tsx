import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShieldCheck,
  History,
  ShoppingBag,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';
import { VitalLogo } from '../../../components/VitalLogo';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isSuperAdmin, loading, logout, hasPermission } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-vital-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is not logged in or not an admin, redirect to home
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const allNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/admin',
      end: true,
      allowed: hasPermission('admin.access'),
    },
    {
      icon: BookOpen,
      label: 'Rules CMS',
      path: '/admin/rules',
      badge: 'CMS',
      allowed: hasPermission('rules.view') || hasPermission('rules.edit'),
    },
    {
      icon: Users,
      label: 'Staff Management',
      path: '/admin/staff',
      allowed: hasPermission('staff.view') || hasPermission('staff.manage'),
    },
    {
      icon: ShieldCheck,
      label: 'Discord Permissions',
      path: '/admin/permissions',
      badge: 'Discord',
      allowed: hasPermission('permissions.manage'),
    },
    {
      icon: History,
      label: 'Audit History',
      path: '/admin/audit',
      allowed: hasPermission('audit.view'),
    },
    {
      icon: ShoppingBag,
      label: 'Merch Store',
      path: '/admin/merch',
      badge: 'Printify',
      allowed: hasPermission('merch.view') || hasPermission('merch.manage') || isAdmin || isSuperAdmin || user?.role === 'admin' || user?.role === 'owner',
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/admin/settings',
      allowed: hasPermission('settings.manage'),
    },
  ];

  const navItems = allNavItems.filter((i) => i.allowed);
  const roleName = isSuperAdmin ? 'Super Admin' : user?.matchedRoleNames?.[0] || 'Administrator';

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col lg:flex-row font-sans selection:bg-vital-500 selection:text-white">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-dark-900 border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <VitalLogo className="w-8 h-8 filter drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="font-display font-bold text-white tracking-wider">VITAL RP</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-gray-400 hover:text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 shadow-2xl shadow-black/50 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-7 border-b border-white/5 flex justify-between items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-vital-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="flex items-center gap-4 relative z-10 w-full">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-vital-500 blur-xl opacity-20 animate-pulse" />
              <VitalLogo className="w-12 h-12 relative z-10 drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white font-display font-black text-xl leading-none tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                VITAL RP
              </h1>
              <span className="text-[10px] text-vital-500 font-bold tracking-[0.2em] uppercase font-tech mt-1">
                Command Center
              </span>
              <div className="flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-tech font-bold uppercase tracking-wider w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Discord Role Sync</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors relative z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-3 mb-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            Administration
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                relative group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200
                ${isActive ? 'text-white bg-vital-500/15 border border-vital-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}
              `}
            >
              <div className="flex items-center gap-3 relative z-10">
                <item.icon
                  size={18}
                  className="transition-colors duration-200"
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="relative z-10 text-[9px] font-bold px-1.5 py-0.5 rounded bg-vital-500/20 text-vital-400 border border-vital-500/30 uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-white/5 bg-dark-950/40">
          <div className="bg-dark-800/50 rounded-2xl p-4 border border-white/5 backdrop-blur-sm group hover:border-vital-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative shrink-0">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.displayName || 'User'}`}
                  alt="User"
                  className={`w-10 h-10 rounded-full object-cover border ${
                    isSuperAdmin ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]' : 'border-vital-500/40'
                  }`}
                />
                {isSuperAdmin && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-dark-950">
                    <Crown size={10} className="stroke-[3]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate group-hover:text-vital-400 transition-colors">
                  {user?.displayName || 'Admin User'}
                </h3>
                <p className={`text-[10px] font-tech uppercase tracking-wider font-bold truncate ${
                  isSuperAdmin ? 'text-amber-400' : 'text-vital-400'
                }`}>
                  {roleName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NavLink
                to="/"
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-300 transition-all font-medium"
              >
                <Home size={14} />
                Site
              </NavLink>
              <button
                onClick={() => logout()}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 text-xs text-red-400 transition-all font-medium"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 p-6 lg:p-10 w-full overflow-x-hidden min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
