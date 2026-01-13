import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Upload, Trash2 } from 'lucide-react';

interface StaffMemberData {
    name: string;
    role: string;
    subRole?: string;
    image?: string;
    color: string;
    category: string;
}

interface StaffEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: StaffMemberData) => Promise<void>;
    onDelete?: () => Promise<void>;
    initialData: StaffMemberData;
}

const COLORS = [
    { value: 'vital', label: 'Orange (Vital)' },
    { value: 'amber', label: 'Amber (Gold)' },
    { value: 'red', label: 'Red (Admin)' },
    { value: 'green', label: 'Green (Mod)' },
    { value: 'purple', label: 'Purple' },
    { value: 'yellow', label: 'Yellow' },
];

const CATEGORIES = [
    'Management',
    'Administration',
    'Moderation Team'
];

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData
}) => {
    const [formData, setFormData] = useState<StaffMemberData>(initialData);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Update form data when initialData changes or modal opens
    React.useEffect(() => {
        setFormData(initialData);
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error("Failed to save staff member:", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (!window.confirm("Are you sure you want to delete this staff member? This cannot be undone.")) return;

        setDeleting(true);
        try {
            await onDelete();
            onClose();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete member.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-dark-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-dark-800/50">
                            <h2 className="text-xl font-display font-bold text-white">Edit Staff Member</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Form Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <form id="staff-form" onSubmit={handleSubmit} className="space-y-6">

                                {/* Name & Role Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors"
                                            placeholder="e.g. Damon"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Role Title</label>
                                        <input
                                            type="text"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors"
                                            placeholder="e.g. Owner"
                                        />
                                    </div>
                                </div>

                                {/* SubRole */}
                                <div className="space-y-2">
                                    <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Sub-Role / Tags (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.subRole || ''}
                                        onChange={e => setFormData({ ...formData, subRole: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors"
                                        placeholder="e.g. Development, Marketing"
                                    />
                                </div>

                                {/* Image URL */}
                                <div className="space-y-2">
                                    <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Avatar URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="url"
                                            value={formData.image || ''}
                                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Leave empty to use the default role icon.</p>

                                    {/* Preview */}
                                    {formData.image && (
                                        <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Color & Category Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Color Theme</label>
                                        <select
                                            value={formData.color}
                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors appearance-none"
                                        >
                                            {COLORS.map(c => <option key={c.value} value={c.value} className="bg-dark-900">{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors appearance-none"
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c} className="bg-dark-900">{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* Footer actions */}
                        <div className="p-6 border-t border-white/5 bg-dark-800/30 flex justify-between gap-4">
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            )}

                            <div className="flex gap-3 ml-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="staff-form"
                                    disabled={saving}
                                    className="px-8 py-2.5 bg-vital-500 text-white rounded-xl font-bold hover:bg-vital-600 transition-colors flex items-center gap-2 shadow-lg shadow-vital-500/20 disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
