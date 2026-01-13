import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Search, User, Briefcase, Crown, ShieldAlert, Shield, ShieldCheck, Gavel, Shirt, HeartHandshake, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';

interface StaffMember {
    id: string;
    name: string;
    role: string;
    subRole: string; // Used for "Lead" title
    color: string;
    category: 'Management' | 'Administration' | 'Moderation Team' | 'Support Team';
    image?: string;
}

const ROLES = [
    'Owner',
    'Senior Admin',
    'Admin',
    'Senior Mod',
    'Mod',
    'Senior Support',
    'Support',
    'Clothing Dev'
];

const CATEGORIES = [
    'Management',
    'Administration',
    'Moderation Team',
    'Support Team'
];

const COLORS = [
    { label: 'Amber (Owner)', value: 'amber', bg: 'bg-amber-500' },
    { label: 'Red (Admin)', value: 'red', bg: 'bg-red-500' },
    { label: 'Green (Mod)', value: 'green', bg: 'bg-emerald-500' },
    { label: 'Blue (Support)', value: 'blue', bg: 'bg-blue-500' }, // Added blue support
    { label: 'Purple (Dev)', value: 'purple', bg: 'bg-purple-500' },
    { label: 'Yellow', value: 'yellow', bg: 'bg-yellow-500' },
];

export const StaffRoster: React.FC = () => {
    const [members, setMembers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    // Default Form State
    const defaultForm = {
        name: '',
        role: ROLES[0],
        subRole: '',
        color: 'amber',
        category: 'Management' as const,
        image: ''
    };

    const [formData, setFormData] = useState<Partial<StaffMember>>(defaultForm);

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            if (!db) return;
            // Remove orderBy to avoid missing index issues for now
            const q = query(collection(db, 'staff'));
            const querySnapshot = await getDocs(q);
            const fetched: StaffMember[] = [];
            querySnapshot.forEach((doc) => {
                fetched.push({ id: doc.id, ...doc.data() } as StaffMember);
            });

            // Manual Sort
            fetched.sort((a, b) => {
                // Sort by Category order
                const catOrder = { 'Management': 1, 'Administration': 2, 'Moderation Team': 3, 'Support Team': 4 };
                const rankA = catOrder[a.category] || 99;
                const rankB = catOrder[b.category] || 99;
                if (rankA !== rankB) return rankA - rankB;

                // Then by Role (using ROLES array index)
                const roleRankA = ROLES.indexOf(a.role);
                const roleRankB = ROLES.indexOf(b.role);
                return (roleRankA === -1 ? 99 : roleRankA) - (roleRankB === -1 ? 99 : roleRankB);
            });

            setMembers(fetched);
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (member?: StaffMember) => {
        if (member) {
            setEditingId(member.id);
            setFormData(member);
        } else {
            setEditingId(null);
            setFormData(defaultForm);
        }
        setIsModalOpen(true);
    };

    const handleRoleChange = (role: string) => {
        let newColor = formData.color;
        let newCategory = formData.category;

        if (role === 'Owner') { newColor = 'amber'; newCategory = 'Management'; }
        else if (role.includes('Admin')) { newColor = 'red'; newCategory = 'Administration'; }
        else if (role.includes('Mod')) { newColor = 'green'; newCategory = 'Moderation Team'; }
        else if (role.includes('Support')) { newColor = 'blue'; newCategory = 'Support Team'; }
        else if (role === 'Clothing Dev') { newColor = 'purple'; newCategory = 'Moderation Team'; }

        setFormData({ ...formData, role, color: newColor, category: newCategory });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;

        setUploading(true);
        try {
            // Create a unique filename
            const filename = `staff-images/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setFormData(prev => ({ ...prev, image: downloadURL }));
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!db) return;
        try {
            if (editingId) {
                await updateDoc(doc(db, 'staff', editingId), formData);
            } else {
                await addDoc(collection(db, 'staff'), formData);
            }
            setIsModalOpen(false);
            fetchStaff();
        } catch (error) {
            console.error("Error saving staff:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!db || !window.confirm("Are you sure you want to delete this staff member?")) return;
        try {
            await deleteDoc(doc(db, 'staff', id));
            fetchStaff();
        } catch (error) {
            console.error("Error deleting staff:", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Staff Roster</h1>
                    <p className="text-gray-400">Manage your team structure and permissions.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-vital-500 text-white rounded-xl hover:bg-vital-600 transition-colors shadow-lg shadow-vital-500/20 font-bold"
                >
                    <Plus size={20} />
                    Add Staff Member
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-dark-900 border border-white/5 rounded-2xl p-6 group hover:border-vital-500/30 transition-all relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${member.color === 'green' ? 'emerald' : member.color}-500/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2`}></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center text-${member.color === 'green' ? 'emerald' : member.color}-400 overflow-hidden relative group`}>
                                    {member.image ? (
                                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            {member.role === 'Owner' && <Crown size={24} />}
                                            {member.role.includes('Admin') && <ShieldAlert size={24} />}
                                            {member.role.includes('Mod') && <ShieldCheck size={24} />}
                                            {member.role.includes('Support') && <HeartHandshake size={24} />}
                                            {member.role === 'Clothing Dev' && <Shirt size={24} />}
                                        </>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-none">{member.name}</h3>
                                    <span className="text-xs text-vital-500 font-medium">{member.role}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenModal(member)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-2 relative z-10">
                            <div className="flex items-center justify-between text-sm bg-black/20 p-2 rounded-lg">
                                <span className="text-gray-500">Category</span>
                                <span className="text-gray-300">{member.category}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm bg-black/20 p-2 rounded-lg">
                                <span className="text-gray-500">Sub-Role / Lead</span>
                                <span className="text-gray-300">{member.subRole || '-'}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {loading && <div className="text-center text-gray-500 py-12">Loading staff roster...</div>}
            {!loading && members.length === 0 && (
                <div className="text-center text-gray-500 py-12 bg-dark-900/50 rounded-2xl border border-white/5 border-dashed">
                    No staff members found. Click "Add Staff Member" to get started.
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
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
                            className="relative bg-dark-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">
                                    {editingId ? 'Edit Staff Member' : 'Add New Staff Member'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:border-vital-500 focus:outline-none transition-colors"
                                            placeholder="Username"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Role */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Role</label>
                                        <select
                                            className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 px-3 text-white focus:border-vital-500 focus:outline-none transition-colors appearance-none"
                                            value={formData.role}
                                            onChange={e => handleRoleChange(e.target.value)}
                                        >
                                            {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Category</label>
                                        <select
                                            className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 px-3 text-white focus:border-vital-500 focus:outline-none transition-colors appearance-none"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        >
                                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Sub Role */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Sub-Role / Lead Title</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input
                                            className="w-full bg-dark-950 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:border-vital-500 focus:outline-none transition-colors"
                                            placeholder="e.g. IFM Lead, Clothing Dev, Rules Team"
                                            value={formData.subRole}
                                            onChange={e => setFormData({ ...formData, subRole: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">Leave empty if not a lead or specialized role.</p>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Profile Image</label>

                                    <div className="flex items-center gap-4">
                                        {/* Preview */}
                                        <div className="w-16 h-16 rounded-xl bg-dark-950 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                            {formData.image ? (
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-gray-600" size={24} />
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            {/* File Input */}
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    accept="image/*"
                                                    disabled={uploading}
                                                    className="hidden"
                                                    id="image-upload"
                                                />
                                                <label
                                                    htmlFor="image-upload"
                                                    className={`flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg cursor-pointer transition-all ${uploading ? 'opacity-50 cursor-wait' : ''}`}
                                                >
                                                    {uploading ? <Loader2 size={16} className="animate-spin text-vital-500" /> : <Upload size={16} className="text-vital-500" />}
                                                    <span className="text-sm text-gray-300">{uploading ? 'Uploading...' : 'Browse File'}</span>
                                                </label>
                                            </div>

                                            {/* URL Input */}
                                            <input
                                                className="w-full bg-dark-950 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-gray-400 focus:text-white focus:border-vital-500 focus:outline-none transition-colors"
                                                placeholder="Or paste image URL..."
                                                value={formData.image || ''}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Card Accent Color</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => setFormData({ ...formData, color: color.value })}
                                                className={`h-8 px-3 rounded-lg border text-xs font-medium transition-all ${formData.color === color.value
                                                    ? 'border-white bg-white/10 text-white'
                                                    : 'border-transparent bg-dark-950 text-gray-500 hover:text-white'
                                                    }`}
                                            >
                                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${color.bg}`}></span>
                                                {color.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-2.5 bg-vital-500 text-white rounded-xl font-bold hover:bg-vital-600 transition-colors flex items-center justify-center gap-2"
                                    disabled={uploading}
                                >
                                    <Save size={18} />
                                    Save Staff Member
                                </button>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
