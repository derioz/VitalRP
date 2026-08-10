import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '../lib/fivemanage';

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: string) => Promise<void>;
    initialValue: string;
    label?: string;
    multiline?: boolean;
    isImage?: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialValue,
    label = "Edit Content",
    multiline = false,
    isImage
}) => {
    const [value, setValue] = useState(initialValue);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const isImageField = isImage || label.toLowerCase().includes('image');

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue, isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, 'page-assets');
            setValue(url);
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert("Image upload failed: " + (error.message || "Unknown error"));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(value);
            onClose();
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
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
                        className="relative bg-dark-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">{label}</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6 space-y-3">
                            {multiline ? (
                                <textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-vital-500 transition-colors resize-none"
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-vital-500 transition-colors"
                                    />
                                    {isImageField && (
                                        <label className="flex items-center gap-2 px-4 py-2 bg-vital-500/10 hover:bg-vital-500/20 border border-vital-500/30 text-vital-400 font-bold rounded-xl cursor-pointer transition-all whitespace-nowrap">
                                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                            <span>{uploading ? 'Uploading...' : 'Browse'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                        </label>
                                    )}
                                </div>
                            )}

                            {isImageField && value && (
                                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30 h-32 flex items-center justify-center">
                                    <img src={value} alt="Preview" className="max-h-full max-w-full object-contain" />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                                disabled={saving || uploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || uploading}
                                className="flex-1 py-2.5 bg-vital-500 text-white rounded-xl font-bold hover:bg-vital-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-vital-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

