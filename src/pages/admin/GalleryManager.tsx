import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2, MapPin, Image as ImageIcon } from 'lucide-react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { GalleryEditModal } from '../../../components/GalleryEditModal';

interface GalleryItem {
    id: string;
    title: string;
    location: string;
    category: string;
    src: string;
    size: 'large' | 'tall' | 'wide' | 'small';
}

export const GalleryManager: React.FC = () => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!db) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'gallery'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedItems: GalleryItem[] = [];
            snapshot.forEach((doc) => {
                fetchedItems.push({ id: doc.id, ...doc.data() } as GalleryItem);
            });
            // Sort by ID (numeric if possible)
            fetchedItems.sort((a, b) => {
                const numA = parseInt(a.id);
                const numB = parseInt(b.id);
                if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                return a.id.localeCompare(b.id);
            });
            setItems(fetchedItems);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSave = async (data: any) => {
        if (!db) return;

        // If creating a new item, generate an ID if not provided (or use a timestamp/random generic one)
        // Since the current logic relies on ID for sort, let's try to find the max ID and increment, or just use UUIDs.
        // For simplicity with the existing "1", "2" pattern, let's try to stick to numeric if possible, or fall back to string.

        let targetId = editingItem?.id;

        if (isCreating) {
            // Find max numeric ID
            const maxId = items.reduce((max, item) => {
                const num = parseInt(item.id);
                return !isNaN(num) && num > max ? num : max;
            }, 0);
            targetId = (maxId + 1).toString();
        }

        if (!targetId) return;

        const docRef = doc(db, 'gallery', targetId);
        await setDoc(docRef, {
            title: data.title || '',
            location: data.location || '',
            category: data.category || '',
            src: data.src || '',
            size: data.size || 'small'
        }, { merge: true });

        setIsCreating(false);
    };

    const handleDelete = async () => {
        if (!db || !editingItem?.id) return;
        await deleteDoc(doc(db, 'gallery', editingItem.id));
        setEditingItem(null);
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setEditingItem({
            id: '', // Will be assigned on save
            title: '',
            location: '',
            category: '',
            src: '',
            size: 'small'
        });
    };

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">Gallery Manager</h1>
                    <p className="text-gray-400">Manage photos, screenshots, and artwork displayed in the gallery.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-vital-500 hover:bg-vital-600 text-white rounded-lg font-bold transition-colors shadow-lg shadow-vital-500/20"
                >
                    <Plus size={18} />
                    Add New Photo
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-dark-900/50 p-4 rounded-xl border border-white/5">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search gallery..."
                        className="w-full bg-dark-950 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-vital-500 outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="py-20 text-center text-gray-500">Loading gallery...</div>
            ) : filteredItems.length === 0 ? (
                <div className="py-20 text-center text-gray-500 bg-dark-900/50 rounded-xl border border-white/5 border-dashed">
                    <ImageIcon className="mx-auto mb-4 opacity-50" size={48} />
                    <p>No gallery items found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-dark-900 rounded-xl overflow-hidden border border-white/5 hover:border-vital-500/50 transition-all"
                        >
                            {/* Image Aspect */}
                            <div className="aspect-video relative overflow-hidden bg-dark-950">
                                {item.src ? (
                                    <img src={item.src} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        <ImageIcon size={32} />
                                    </div>
                                )}

                                {/* Overlay Controls */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => { setIsCreating(false); setEditingItem(item); }}
                                        className="p-2 bg-black/50 text-white rounded-lg border border-white/20 hover:bg-vital-500 hover:border-vital-500 transition-all backdrop-blur-sm"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>

                                {/* Badges */}
                                <div className="absolute top-2 left-2 flex gap-2">
                                    <span className="px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] uppercase font-bold text-white border border-white/10">
                                        {item.size}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-white truncate pr-2" title={item.title}>{item.title || 'Untitled'}</h3>
                                        <p className="text-vital-500 text-xs font-bold uppercase tracking-wider">{item.category}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-3">
                                    <MapPin size={14} />
                                    <span className="truncate">{item.location || 'Unknown Location'}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {editingItem && (
                <GalleryEditModal
                    isOpen={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    onSave={handleSave}
                    onDelete={!isCreating ? handleDelete : undefined}
                    initialData={editingItem}
                />
            )}
        </div>
    );
};
