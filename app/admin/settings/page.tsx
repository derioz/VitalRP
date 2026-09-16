'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Save, Camera, Mail, Globe, ShieldAlert, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { uploadImage } from '@/lib/upload';
import { AdminHero } from '@/components/AdminHero';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'system'>('profile');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Profile State
    const [profileData, setProfileData] = useState({
        displayName: user?.displayName || '',
        email: user?.email || '',
        photoURL: user?.photoURL || user?.avatar || ''
    });

    // System State
    const [systemData, setSystemData] = useState({
        siteName: 'Vital RP',
        maintenanceMode: false
    });

    const [siteConfigLoading, setSiteConfigLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setProfileData({
                displayName: user.displayName || '',
                email: user.email || '',
                photoURL: user.photoURL || user.avatar || ''
            });
        }
        fetchSystemConfig();
    }, [user]);

    const fetchSystemConfig = async () => {
        if (!db) return;
        try {
            const docRef = doc(db, 'config', 'site');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSystemData(docSnap.data() as any);
            }
        } catch (error) {
            console.error("Error fetching site config:", error);
        } finally {
            setSiteConfigLoading(false);
        }
    };

    const handleProfileUpdate = async () => {
        if (!user || !db) return;
        setLoading(true);
        try {
            await setDoc(doc(db, 'users', user.discordId), {
                displayName: profileData.displayName,
                photoURL: profileData.photoURL,
                avatar: profileData.photoURL,
                email: profileData.email || user.email || '',
                updatedAt: new Date().toISOString()
            }, { merge: true });

            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        try {
            const downloadURL = await uploadImage(file, 'avatars');

            setProfileData(prev => ({ ...prev, photoURL: downloadURL }));

            if (db) {
                await updateDoc(doc(db, 'users', user.discordId), {
                    photoURL: downloadURL,
                    avatar: downloadURL
                });
            }

            setSuccessMsg('Avatar updated!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            alert(`Failed to upload avatar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSystemUpdate = async () => {
        if (!db) return;
        setLoading(true);
        try {
            await setDoc(doc(db, 'config', 'site'), systemData, { merge: true });
            setSuccessMsg('System configuration saved!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Error saving system config:", error);
            alert("Failed to save configuration.");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'system', label: 'System Settings', icon: Globe },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <AdminHero
                title="Settings"
                subtitle="Manage your account preferences and system configurations."
            />

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 space-y-2 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all relative overflow-hidden ${activeTab === tab.id
                                ? 'text-white shadow-lg shadow-vital-500/20'
                                : 'bg-dark-900 text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                }`}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeSettingsTab"
                                    className="absolute inset-0 bg-vital-500/10 border border-vital-500/20 shadow-[0_0_15px_rgba(251,146,60,0.05)]"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <tab.icon size={18} className="relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-dark-900 border border-white/5 rounded-2xl p-6 lg:p-8 min-h-[500px]">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        {activeTab === 'profile' && (
                            <>
                                <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/5">Profile Settings</h2>

                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-dark-800 border-2 border-white/10 overflow-hidden flex items-center justify-center text-white">
                                            {profileData.photoURL ? (
                                                <img src={profileData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={32} className="text-gray-500" />
                                            )}
                                        </div>
                                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full cursor-pointer transition-opacity backdrop-blur-[2px]">
                                            <Camera size={24} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Profile Photo</h3>
                                        <p className="text-sm text-gray-500 mb-2">Click the image to upload a new one via FiveManage.</p>
                                        <p className="text-xs text-vital-500 uppercase font-bold tracking-wider">
                                            Role: {user?.role || 'User'}
                                        </p>
                                    </div>
                                </div>

                                {/* Form */}
                                <div className="space-y-4 max-w-xl">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Display Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="text"
                                                value={profileData.displayName}
                                                onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                                                className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:border-vital-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full bg-dark-950/50 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-gray-400 cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Managed via your Discord account.</p>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={handleProfileUpdate}
                                            disabled={loading}
                                            className="px-6 py-3 bg-vital-500/10 text-vital-400 rounded-xl border border-vital-500/20 hover:bg-vital-500/20 hover:border-vital-500/30 transition-all shadow-lg shadow-vital-500/5 font-bold hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                                        >
                                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                            Save Profile
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'security' && (
                            <>
                                <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/5">Security Settings</h2>

                                <div className="space-y-6 max-w-xl">
                                    <div className="bg-dark-950/50 border border-white/5 rounded-xl p-6">
                                        <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                                            <Lock size={18} className="text-vital-500" />
                                            Discord Authentication
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-2">
                                            Vital RP authentication is strictly handled through Discord OAuth 2.0. Account passwords, Multi-Factor Authentication, and login sessions are protected directly through Discord.
                                        </p>
                                        <p className="text-xs text-gray-500 font-mono">
                                            Canonical Discord ID: {user?.discordId}
                                        </p>
                                    </div>

                                    <div className="bg-dark-950/50 border border-white/5 rounded-xl p-6">
                                        <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                                            <ShieldAlert size={18} className="text-emerald-500" />
                                            Role & Session Security
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-2">
                                            Your assigned role is <span className="text-vital-400 font-bold uppercase">{user?.role}</span>.
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            All administrative routes and API mutations are verified server-side with HMAC-SHA256 session signatures and centralized role-based access control (RBAC).
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'system' && (
                            <>
                                <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/5">System Configuration</h2>

                                {siteConfigLoading ? (
                                    <div className="text-gray-500">Loading config...</div>
                                ) : (
                                    <div className="space-y-6 max-w-xl">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Site Name</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                <input
                                                    type="text"
                                                    value={systemData.siteName}
                                                    onChange={e => setSystemData({ ...systemData, siteName: e.target.value })}
                                                    className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:border-vital-500 focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-dark-950/50 border border-white/10 rounded-xl p-5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-white font-bold flex items-center gap-2">
                                                        <Globe size={18} className="text-vital-500" />
                                                        FiveManage Media Service
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Image uploads for gallery items, staff portraits, and avatars route securely through <code className="bg-black/40 px-1 py-0.5 rounded text-vital-400">/api/upload</code>.
                                                    </p>
                                                </div>
                                                <span className="text-xs font-mono px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                    Server-Side Endpoint Active
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-white font-bold flex items-center gap-2">
                                                        <ShieldAlert size={18} className="text-amber-500" />
                                                        Maintenance Mode
                                                    </h3>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        If enabled, non-admin users will see a maintenance notice.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setSystemData({ ...systemData, maintenanceMode: !systemData.maintenanceMode })}
                                                    className={`relative w-12 h-6 rounded-full transition-colors ${systemData.maintenanceMode ? 'bg-amber-500' : 'bg-gray-700'
                                                        }`}
                                                >
                                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${systemData.maintenanceMode ? 'translate-x-6' : 'translate-x-0'
                                                        }`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleSystemUpdate}
                                                disabled={loading}
                                                className="px-6 py-3 bg-vital-500/10 text-vital-400 rounded-xl border border-vital-500/20 hover:bg-vital-500/20 hover:border-vital-500/30 transition-all shadow-lg shadow-vital-500/5 font-bold hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                                            >
                                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                                Save Configuration
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Success Message Toast */}
                        <div className={`fixed bottom-8 right-8 bg-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 transition-all duration-300 ${successMsg ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                            <ShieldAlert size={18} />
                            <span className="font-bold">{successMsg}</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
