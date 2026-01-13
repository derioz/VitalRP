import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../components/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminHero } from '../../../components/AdminHero';
import { Trash2, Edit2, Save, X, Shield, Crown, ShieldCheck, FileEdit, User } from 'lucide-react';

interface UserData {
    id: string; // Document ID (usually email or uid)
    email: string;
    role: 'superadmin' | 'admin' | 'editor' | 'user'; // Updated role
    displayName?: string;
    createdAt?: any;
    lastLogin?: any;
    photoURL?: string; // Added photoURL
}

const ROLES = [
    {
        value: 'superadmin',
        label: 'Super Admin',
        description: 'Full access to all settings and user management.',
        color: 'amber',
        icon: Crown
    },
    {
        value: 'admin',
        label: 'Administrator',
        description: 'Manage content, staff, and moderate the site.',
        color: 'red',
        icon: ShieldCheck
    },
    {
        value: 'editor',
        label: 'Editor',
        description: 'Can edit existing content but cannot manage users.',
        color: 'blue',
        icon: FileEdit
    },
    {
        value: 'user',
        label: 'User',
        description: 'Standard access. No admin panel permissions.',
        color: 'gray',
        icon: User
    },
];

export const UsersPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    const [formData, setFormData] = useState({
        role: 'user',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!db) return;
        try {
            const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'));
            const snapshot = await getDocs(q);
            const fetched: UserData[] = [];
            snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() } as UserData));
            setUsers(fetched);
        } catch (error) {
            console.error("Error fetching users with orderBy:", error);
            // Fallback if index missing
            try {
                const q2 = query(collection(db, 'users'));
                const snapshot2 = await getDocs(q2);
                const fetched2: UserData[] = [];
                snapshot2.forEach(doc => fetched2.push({ id: doc.id, ...doc.data() } as UserData));
                setUsers(fetched2);
            } catch (err2) {
                console.error("Retry failed", err2);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        setFormData({
            role: user.role || 'user',
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!db || !editingUser) return;

        try {
            await setDoc(doc(db, 'users', editingUser.id), {
                role: formData.role
            }, { merge: true });

            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Error saving user:", error);
            alert("Failed to save user.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!db || !window.confirm("Are you sure you want to delete this user? They will lose all data and access.")) return;
        try {
            await deleteDoc(doc(db, 'users', id));
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <AdminHero
                title="User Management"
                subtitle="Manage permissions for registered users."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => {
                    // Map old 'owner' role to 'superadmin' visually if needed
                    let roleValue = user.role;
                    if (roleValue === 'owner' as any) roleValue = 'superadmin';

                    const roleConfig = ROLES.find(r => r.value === roleValue) || ROLES[3];

                    return (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-dark-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 group hover:border-vital-500/30 hover:bg-dark-900/60 transition-all relative overflow-hidden shadow-xl"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-dark-800/50 border border-white/10 flex items-center justify-center text-white font-bold overflow-hidden shadow-lg relative group-hover:border-vital-500/20 transition-colors">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl">{user.displayName?.[0] || user.email[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-lg font-bold text-white truncate leading-tight">{user.displayName || 'User'}</h3>
                                        <p className="text-xs text-gray-500 truncate mt-0.5 font-mono opacity-70">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/5"
                                        title="Edit Role"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="p-2 rounded-lg bg-red-500/5 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/10"
                                        title="Delete User"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5 border-dashed">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Current Role</span>
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-${roleConfig.color}-500/10 text-${roleConfig.color}-400 border border-${roleConfig.color}-500/20 shadow-sm`}>
                                    <roleConfig.icon size={12} />
                                    {roleConfig.label}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {loading && <div className="text-center text-gray-500 py-12">Loading users...</div>}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-dark-900 border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Edit Permissions</h2>
                                    <p className="text-sm text-gray-400">Assign a role to determine access level.</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center text-white font-bold overflow-hidden text-lg">
                                        {editingUser.photoURL ? (
                                            <img src={editingUser.photoURL} alt={editingUser.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            editingUser.displayName?.[0] || editingUser.email[0].toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{editingUser.displayName || 'Unknown User'}</h3>
                                        <p className="text-sm text-gray-400">{editingUser.email}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-3">Select Role</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {ROLES.map(role => (
                                            <label
                                                key={role.value}
                                                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.role === role.value
                                                    ? `bg-${role.color}-500/10 border-${role.color}-500/50 shadow-[0_0_15px_rgba(0,0,0,0.2)]`
                                                    : 'bg-dark-950 border-white/5 hover:border-white/10 hover:bg-white/5'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.value}
                                                    checked={formData.role === role.value}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                    className="hidden"
                                                />
                                                <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${formData.role === role.value ? `border-${role.color}-500` : 'border-gray-600'}`}>
                                                    {formData.role === role.value && <div className={`w-2.5 h-2.5 bg-${role.color}-500 rounded-full`} />}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <role.icon size={16} className={formData.role === role.value ? `text-${role.color}-400` : 'text-gray-400'} />
                                                        <span className={`text-sm font-bold ${formData.role === role.value ? 'text-white' : 'text-gray-300'}`}>{role.label}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{role.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8 pt-6 border-t border-white/5">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-2.5 bg-vital-500 text-white rounded-xl font-bold hover:bg-vital-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-vital-500/20"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
