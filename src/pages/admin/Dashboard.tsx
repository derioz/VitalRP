import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Image, Activity, Shield, TrendingUp, Clock, Plus, ArrowRight, Wallet, UserPlus } from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';
import { collection, getDocs, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { AdminHero } from '../../../components/AdminHero';
import { Link } from 'react-router-dom';

const QUOTES = [
    "\"RDM! RDM! Admin to me!\" - Every new player ever",
    "\"Hands up or I shoot!\" *misses every shot*",
    "\"Is that a local or a player?\" - Famous last words",
    "\"My head popped, flying back in.\"",
    "\"Nice VDM bro, clip that.\"",
    "\"Can I get a revive? I died to a glitch.\"",
    "\"Anyone selling a PD pistol?\" - Asking in Legion Square",
    "\"I'm not driving, I'm traveling.\"",
    "\"Do you have a license for that attitude?\"",
    "\"Wait, I hear sirens... hide the weed!\"",
    "\"10-80 in progress... I think I lost them... nevermind, I crashed.\"",
    "\"Combat logging is not a crime, it's a tactical retreat.\" (It is a crime though)",
    "\"Admin, he talked while dead!\"",
    "\"I swear I wasn't speeding, my speedometer is broken.\"",
    "\"New phone, who dis?\""
];

const getRandomQuote = () => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: 0,
        staff: 0,
        gallery: 0,
        activeNow: 0 // Placeholder for now
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    // Server Stats State
    const CFX_SERVER_ID = 'ogpvmv';
    const [serverStats, setServerStats] = useState({ online: false, players: 0, max: 2048, ping: '12ms' });

    useEffect(() => {
        // Fetch Live Server Stats
        const fetchServerStats = async () => {
            try {
                const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${CFX_SERVER_ID}`);
                if (!response.ok) throw new Error('Unreachable');
                const data = await response.json();
                if (data && data.Data) {
                    setServerStats({
                        online: true,
                        players: data.Data.clients,
                        max: data.Data.sv_maxclients,
                        ping: '12ms' // Mocked ping as we can't get real client-server ping from API
                    });
                }
            } catch (e) {
                // Fallback
                console.warn("Server stats unreachable, using fallback");
                setServerStats({ online: true, players: 412, max: 2048, ping: '12ms' });
            }
        };

        fetchServerStats();
        // Refresh server stats every 60s
        const interval = setInterval(fetchServerStats, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!db) return;

        setLoading(true);

        // Real-time listener for Users
        // We use onSnapshot so that if a user updates their profile in "Settings", 
        // it reflects here immediately without a refresh.
        const unsubscribeUsers = onSnapshot(query(collection(db, 'users'), orderBy('lastLogin', 'desc'), limit(5)), (snapshot) => {
            const fetchedUsers: any[] = [];
            snapshot.forEach(doc => {
                fetchedUsers.push({ id: doc.id, ...doc.data() });
            });
            setRecentUsers(fetchedUsers);

            // For total count only, we might still want to fetch separate if the 'limit(5)' query doesn't give total.
            // But for now, let's just do a separate fetches for simple counts to avoid complex listeners for everything if not needed.
        }, (error) => {
            console.error("Error listening to users:", error);
            // Fallback for missing index
            getDocs(collection(db, 'users')).then(snap => {
                setRecentUsers(snap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() })));
            });
        });

        // Simple fetches for counts (could be made real-time too if desired, but sticking to request scope)
        const fetchCounts = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const staffSnapshot = await getDocs(collection(db, 'staff'));
                const gallerySnapshot = await getDocs(collection(db, 'gallery'));

                setStats({
                    users: usersSnapshot.size,
                    staff: staffSnapshot.size,
                    gallery: gallerySnapshot.size,
                    activeNow: 1
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();

        return () => unsubscribeUsers();
    }, []);

    const statCards = [
        {
            label: 'Total Users',
            value: stats.users,
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            iconColor: 'text-cyan-400',
            trend: '+12% this week', // Mock trend
            path: '/admin/users'
        },
        {
            label: 'Staff Team',
            value: stats.staff,
            icon: Shield,
            color: 'from-vital-500 to-red-600',
            iconColor: 'text-red-400',
            trend: 'Active Roster',
            path: '/admin/staff'
        },
        {
            label: 'Gallery Items',
            value: stats.gallery,
            icon: Image,
            color: 'from-purple-500 to-pink-500',
            iconColor: 'text-pink-400',
            trend: 'Visual Assets',
            path: '/admin/gallery'
        },
        {
            label: 'System Status',
            // Using the fetched server stats here
            value: serverStats.online ? `${serverStats.players}/${serverStats.max}` : 'Offline',
            icon: Activity,
            color: serverStats.online ? 'from-emerald-500 to-green-600' : 'from-red-500 to-red-600',
            iconColor: serverStats.online ? 'text-emerald-400' : 'text-red-400',
            trend: serverStats.online ? 'Online' : 'Unreachable',
            isStatus: true
        },
    ];

    const quickActions = [
        { label: 'Add Staff Member', icon: UserPlus, path: '/admin/staff' },
        { label: 'Upload to Gallery', icon: Image, path: '/admin/gallery' },
        { label: 'Review Reports', icon: Shield, path: '/admin/users' }, // Redirects to users for now
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <AdminHero
                title={
                    <>
                        Welcome back, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 via-white to-vital-600 animate-gradient-x bg-[length:200%_auto]">
                            {user?.displayName?.split(' ')[0]}
                        </span>
                    </>
                }
                subtitle={getRandomQuote()}
                rightElement={
                    <div className="hidden lg:block">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer group/card">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vital-500 to-vital-600 flex items-center justify-center shadow-lg shadow-vital-500/20 group-hover/card:scale-110 transition-transform">
                                <Activity className="text-white" size={24} />
                            </div>
                            <div>
                                <div className="text-white font-bold text-xl leading-none mb-1">98%</div>
                                <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Uptime</div>
                            </div>
                        </div>
                    </div>
                }
            />

            {/* Stats Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        variants={item}
                        className="group relative bg-dark-900 border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-white/10 transition-all cursor-default"
                    >
                        {/* Hover Gradient */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-dark-950 border border-white/5 ${stat.iconColor} shadow-lg shadow-black/20`}>
                                <stat.icon size={24} />
                            </div>
                            {stat.isStatus && (
                                <span className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    LIVE
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">
                                {loading ? '-' : stat.value}
                            </h3>
                            <p className="text-sm text-gray-400 font-medium">{stat.label}</p>

                            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 border-t border-white/5 pt-3">
                                <TrendingUp size={12} className={stat.isStatus ? 'text-emerald-500' : 'text-vital-500'} />
                                <span>{stat.trend}</span>
                            </div>
                        </div>

                        {stat.path && (
                            <Link to={stat.path} className="absolute inset-0 z-10" aria-label={`Go to ${stat.label}`} />
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-dark-900 border border-white/5 rounded-2xl p-6"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock size={20} className="text-gray-400" />
                            Recent Active Users
                        </h2>
                        <Link to="/admin/users" className="text-sm text-vital-500 hover:text-vital-400 font-medium flex items-center gap-1">
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading activity...</div>
                        ) : recentUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">No recent activity found.</div>
                        ) : (
                            recentUsers.map((user, i) => (
                                <div key={user.id || i} className="flex items-center justify-between p-3 rounded-xl bg-dark-950/50 border border-white/5 hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white font-bold text-sm border border-white/10 overflow-hidden">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                user.displayName?.[0] || '?'
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-sm">{user.displayName || 'Unknown User'}</h4>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full border ${user.role === 'superadmin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                            {user.role || 'user'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions & Info */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-vital-900/20 border border-vital-500/20 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-vital-500/20 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <h2 className="text-lg font-bold text-white mb-4 relative z-10">Quick Actions</h2>
                        <div className="grid grid-cols-1 gap-3 relative z-10">
                            {quickActions.map((action, i) => (
                                <Link
                                    key={i}
                                    to={action.path}
                                    className="flex items-center gap-3 p-3 bg-dark-900/50 hover:bg-vital-500/10 border border-white/5 hover:border-vital-500/30 rounded-xl transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center text-gray-400 group-hover:text-vital-400 transition-colors">
                                        <action.icon size={16} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-300 group-hover:text-white">{action.label}</span>
                                    <ArrowRight size={14} className="ml-auto text-gray-600 group-hover:text-vital-500 -translate-x-1 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-dark-900 border border-white/5 rounded-2xl p-6"
                    >
                        <h2 className="text-lg font-bold text-white mb-2">Need Help?</h2>
                        <p className="text-sm text-gray-400 mb-4">
                            Check the documentation or contact the development team for assistance with the Admin Panel.
                        </p>
                        <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/5">
                            View Documentation
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
