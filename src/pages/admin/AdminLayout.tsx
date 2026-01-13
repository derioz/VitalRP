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
    Home
} from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';

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

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Staff Roster', path: '/admin/staff' },
        { icon: ShieldAlert, label: 'User Management', path: '/admin/users' },
        { icon: Image, label: 'Gallery', path: '/admin/gallery' },
        { icon: ShieldAlert, label: 'Rules & FAQ', path: '/admin/rules' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <div className="min-h-screen bg-dark-950 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-dark-900 border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-vital-500 to-vital-600 rounded-lg flex items-center justify-center font-bold text-white font-display">
                            V
                        </div>
                        <div>
                            <h1 className="text-white font-display font-bold leading-none">VITAL RP</h1>
                            <span className="text-xs text-gray-500 font-medium">Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/admin'} // Only exact match for root
                            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                                    ? 'bg-vital-500/10 text-vital-500 border border-vital-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}
              `}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-2">
                    <NavLink
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                        <Home size={18} />
                        Back to Site
                    </NavLink>

                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <Outlet />
            </main>
        </div>
    );
};
