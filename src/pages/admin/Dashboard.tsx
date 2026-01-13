import React from 'react';
import { motion } from 'framer-motion';
import { Users, Image, Activity } from 'lucide-react';
import { useAuth } from '../../../components/AuthProvider';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();

    // Placeholder stats
    const stats = [
        { label: 'Active Staff', value: '12', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Gallery Images', value: '24', icon: Image, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'System Status', value: 'Online', icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-display font-bold text-white mb-2">
                    Welcome back, {user?.displayName}
                </h1>
                <p className="text-gray-400">Here's what's happening on Vital RP today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-dark-900 border border-white/5 rounded-xl p-6 flex items-center gap-4"
                    >
                        <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-sm text-gray-400">{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-dark-900 border border-white/5 rounded-xl p-8 text-center text-gray-500">
                <h3 className="text-lg font-medium text-white mb-2">Quick Actions</h3>
                <p>Select a module from the sidebar to start managing content.</p>
            </div>
        </div>
    );
};
