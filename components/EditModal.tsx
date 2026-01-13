import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: string) => Promise<void>;
    initialValue: string;
    label?: string;
    multiline?: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialValue,
    label = "Edit Content",
    multiline = false
}) => {
    const [value, setValue] = useState(initialValue);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue, isOpen]);

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

                        <div className="mb-6">
                            {multiline ? (
                                <textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-vital-500 transition-colors resize-none"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-vital-500 transition-colors"
                                />
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
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
