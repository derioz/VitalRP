import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Image,
    Settings,
    LogOut,
    ShieldAlert,
    Home,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';
import { AnimatePresence } from 'framer-motion';

export const AdminLayout: React.FC = () => {
    const { user, isAdmin, loading, logout } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-vital-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // If user is not logged in, redirect to home
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // If user is logged in but not an admin, show Access Denied
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4">
                <div className="bg-dark-900 border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center">
                    <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-6">
                        You do not have permission to view the Admin Panel.
                    </p>
                    <div className="bg-black/30 rounded-lg p-3 mb-6 font-mono text-sm text-gray-300 break-all select-all">
                        {user.email}
                    </div>
                    <p className="text-xs text-gray-500 mb-6">
                        Please provide the email above to an administrator to request access.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <NavLink
                            to="/"
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Go Back
                        </NavLink>
                        <button
                            onClick={() => logout()}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Staff Roster', path: '/admin/staff' },
        { icon: ShieldAlert, label: 'User Management', path: '/admin/users' },
        { icon: Image, label: 'Gallery', path: '/admin/gallery' },
        { icon: ShieldAlert, label: 'Rules & FAQ', path: '/admin/rules' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col lg:flex-row font-sans">
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between p-4 bg-dark-900 border-b border-white/5 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-vital-500 to-vital-600 rounded-lg flex items-center justify-center font-bold text-white font-display">
                        V
                    </div>
                    <span className="font-display font-bold text-white">VITAL RP</span>
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
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-dark-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col
                transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 shadow-2xl shadow-black/50
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Section */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-vital-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="flex items-center gap-4 relative z-10 w-full">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-vital-500 blur-xl opacity-20 animate-pulse" />
                            <img src="/src/assets/vital-logo.png" alt="Vital RP" className="w-12 h-12 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-white font-display font-black text-xl leading-none tracking-wide bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                VITAL RP
                            </h1>
                            <span className="text-[10px] text-vital-500 font-bold tracking-[0.2em] uppercase mt-1">
                                Command Center
                            </span>
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
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <div className="px-2 mb-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] text-gray-500">
                        Menu
                    </div>

                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `
                                relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                                ${isActive
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'}
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active Background */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-gradient-to-r from-vital-500 to-vital-600 shadow-lg shadow-vital-500/25"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            style={{ borderRadius: '0.75rem' }}
                                        />
                                    )}

                                    {/* Hover Background (Inactive) */}
                                    {!isActive && (
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                    )}

                                    {/* Icon */}
                                    <item.icon
                                        size={20}
                                        className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}
                                    />

                                    {/* Label */}
                                    <span className={`relative z-10 text-sm font-medium transition-colors duration-200 ${isActive ? 'text-white font-bold' : ''}`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-white/5 bg-dark-950/30">
                    <div className="bg-dark-800/50 rounded-2xl p-4 border border-white/5 backdrop-blur-sm group hover:border-vital-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white border border-white/10 overflow-hidden relative">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-sm">{user?.displayName?.[0]}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-white truncate group-hover:text-vital-400 transition-colors">
                                    {user?.displayName || 'Admin User'}
                                </h3>
                                <p className="text-xs text-gray-500 role-badge truncate">
                                    System Administrator
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <NavLink to="/" className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-300 transition-all font-medium">
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
            <main className="flex-1 lg:ml-72 p-6 lg:p-10 w-full overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};
