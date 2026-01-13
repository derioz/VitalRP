import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Upload, Loader2, Minimize, Maximize } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface GalleryItemData {
    id: string;
    title: string;
    location: string;
    category: string;
    src: string;
    size: 'large' | 'tall' | 'wide' | 'small';
}

interface GalleryEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: GalleryItemData) => Promise<void>;
    onDelete?: () => Promise<void>;
    initialData: GalleryItemData;
}

const SIZES = [
    { value: 'small', label: 'Small (1x1)' },
    { value: 'wide', label: 'Wide (2x1)' },
    { value: 'tall', label: 'Tall (1x2)' },
    { value: 'large', label: 'Large (2x2)' },
];

export const GalleryEditModal: React.FC<GalleryEditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData
}) => {
    const [formData, setFormData] = useState<GalleryItemData>(initialData);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error: any) {
            console.error("Failed to save gallery item:", error);
            alert("Failed to save changes: " + (error.message || "Unknown error"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (!window.confirm("Are you sure you want to delete this gallery item? This cannot be undone.")) return;

        setDeleting(true);
        try {
            await onDelete();
            onClose();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete item.");
        } finally {
            setDeleting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !storage) return;

        setUploading(true);
        try {
            // Upload file immediately
            const filename = `gallery/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, filename);

            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Set the uploaded URL as the image source
            setFormData(prev => ({ ...prev, src: downloadURL }));
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert("Image upload failed: " + (error.message || "Unknown error"));
        } finally {
            setUploading(false);
        }
    };

    const getAspect = () => {
        switch (formData.size) {
            case 'wide': return 2 / 1;
            case 'tall': return 1 / 2;
            default: return 1;
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
                            <h2 className="text-xl font-display font-bold text-white">
                                Edit Gallery Item
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-hidden relative">

                            <div className="p-6 pb-20 overflow-y-auto custom-scrollbar h-full">
                                <form id="gallery-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Title</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            required
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors"
                                            placeholder="e.g. Midnight Heat"
                                        />
                                    </div>

                                    {/* Reference size for layout */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Grid Size</label>
                                        <select
                                            value={formData.size}
                                            onChange={e => setFormData({ ...formData, size: e.target.value as any })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors appearance-none"
                                        >
                                            {SIZES.map(s => <option key={s.value} value={s.value} className="bg-dark-900">{s.label}</option>)}
                                        </select>
                                        <p className="text-[10px] text-gray-500">Controls aspect ratio (Small/Large: 1:1, Wide: 2:1, Tall: 1:2).</p>
                                    </div>

                                    {/* Location & Category */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Location</label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                required
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors"
                                                placeholder="e.g. Olympic Fwy"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Category</label>
                                            <input
                                                type="text"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                required
                                                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-vital-500 outline-none transition-colors"
                                                placeholder="e.g. Street Racing"
                                            />
                                        </div>
                                    </div>

                                    {/* Image Upload Area */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-tech font-bold text-gray-400 uppercase tracking-wider">Image Source</label>
                                        <div
                                            className="relative group w-full bg-black/20 border-2 border-dashed border-white/10 rounded-xl overflow-hidden hover:border-vital-500/50 transition-colors mx-auto"
                                            style={{ aspectRatio: getAspect() }}
                                        >
                                            {formData.src ? (
                                                <img src={formData.src} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                                    <Upload size={32} />
                                                </div>
                                            )}

                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                                                <div className="pointer-events-auto flex gap-2">

                                                    <label
                                                        htmlFor="gallery-image-upload"
                                                        className="px-4 py-2 bg-vital-500/20 hover:bg-vital-500 text-vital-500 hover:text-white rounded-lg font-bold border border-vital-500/30 hover:border-vital-500 transition-all backdrop-blur-sm shadow-lg cursor-pointer whitespace-nowrap"
                                                    >
                                                        {formData.src ? 'Change Photo' : 'Select Photo'}
                                                    </label>
                                                </div>
                                                <p className="text-[10px] text-gray-400 bg-black/50 px-2 py-0.5 rounded">
                                                    Aspect Ratio: <span className="text-white">{getAspect() === 1 ? '1:1' : getAspect() === 2 ? '2:1' : '1:2'}</span>
                                                </p>
                                            </div>

                                            <input
                                                id="gallery-image-upload"
                                                type="file"
                                                onChange={handleFileUpload}
                                                accept="image/*"
                                                disabled={!storage}
                                                className="hidden"
                                            />
                                        </div>
                                        {!storage && <p className="text-xs text-red-500">Firebase Storage is not configured.</p>}
                                    </div>
                                </form>
                            </div>

                        </div>

                        {/* Form Footer */}

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
                                    form="gallery-form"
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

