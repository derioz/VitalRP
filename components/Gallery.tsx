import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { MapPin, ArrowUpRight, Camera, Edit2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { GalleryEditModal } from './GalleryEditModal';

interface GalleryItem {
  id: string;
  src: string;
  title: string;
  location: string;
  category: string;
  size: 'large' | 'tall' | 'wide' | 'small';
}

// Fallback data for when Firebase is not connected or empty
const initialGalleryItems: GalleryItem[] = [
  {
    id: "1",
    src: "https://r2.fivemanage.com/image/X8BG7CABWS9D.png",
    title: "Midnight Heat",
    location: "Olympic Fwy",
    category: "Street Racing",
    size: "large"
  },
  {
    id: "2",
    src: "https://r2.fivemanage.com/image/iZgFHW4jrwjA.png",
    title: "Criminal Enterprise",
    location: "Unknown",
    category: "Organized Crime",
    size: "wide"
  },
  {
    id: "3",
    src: "https://r2.fivemanage.com/image/uLGSJHTfUwpW.png",
    title: "The Underworld",
    location: "Cypress Flats",
    category: "Gangs",
    size: "small"
  },
  {
    id: "4",
    src: "https://r2.fivemanage.com/image/N7XhYJH9lVxU.png",
    title: "Neon Nights",
    location: "West Vinewood",
    category: "Nightlife",
    size: "wide"
  },
  {
    id: "5",
    src: "https://r2.fivemanage.com/image/rHwmMCLaftBM.png",
    title: "City Wide Events",
    location: "Paleto Bay",
    category: "Community",
    size: "wide"
  }
];

const getSizeClasses = (size: string) => {
  switch (size) {
    case 'large': return 'md:col-span-2 md:row-span-2';
    case 'tall': return 'md:col-span-1 md:row-span-2';
    case 'wide': return 'md:col-span-2 md:row-span-1';
    default: return 'md:col-span-1 md:row-span-1';
  }
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.21, 0.47, 0.32, 0.98] as const
    }
  }
};

export const Gallery: React.FC = () => {
  const { editMode } = useAuth();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(initialGalleryItems);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Fetch initial data from Firebase with real-time updates
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "gallery"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: GalleryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as GalleryItem);
      });

      if (items.length > 0) {
        items.sort((a, b) => {
          const numA = parseInt(a.id);
          const numB = parseInt(b.id);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.id.localeCompare(b.id);
        });
        setGalleryItems(items);
      }
      setLoading(false);
    }, (error) => {
      console.warn('Could not fetch gallery from Firebase, using fallback data.', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveItem = async (data: any) => {
    if (!editingItem?.id || !db) return;

    try {
      const docRef = doc(db, 'gallery', editingItem.id);
      await setDoc(docRef, {
        title: data.title || '',
        location: data.location || '',
        category: data.category || '',
        src: data.src || '',
        size: data.size || 'small'
      }, { merge: true });
    } catch (error) {
      console.error("Error saving gallery item:", error);
      throw error; // Re-throw so modal can catch it
    }
  };

  const handleDeleteItem = async () => {
    if (!editingItem?.id || !db) return;
    try {
      await deleteDoc(doc(db, 'gallery', editingItem.id));
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <section className="py-32 flex justify-center items-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-vital-500"></div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-32 relative overflow-hidden">
      {/* Background Overlay - Optimized for Mobile */}
      <div className="absolute inset-0 bg-dark-950 md:bg-dark-900/80 md:backdrop-blur-sm z-0"></div>

      {/* Ambient Background Localized */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-vital-500/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl text-center md:text-left"
          >
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 uppercase tracking-tight">
              CAPTURED <span className="text-vital-500">IN CITY</span>
            </h2>
            <p className="text-lg text-gray-400 font-sans font-light leading-relaxed">
              Every street corner in Los Santos holds a story. From high-stakes criminal operations to the vibrant nightlife of Vinewood, witness the moments that define our community.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <a href="https://discord.gg/vitalrp" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-3 group text-white font-display font-bold uppercase tracking-wider text-sm hover:text-vital-400 transition-colors">
              <span>Join The Community</span>
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-vital-500 group-hover:bg-vital-500/10 transition-all">
                <ArrowUpRight size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          </motion.div>
        </div>

        {/* Cinematic Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-4 auto-rows-[280px] gap-6 grid-flow-dense"
        >
          {galleryItems.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className={`group relative rounded-xl overflow-hidden bg-dark-800 ${getSizeClasses(item.size)} shadow-2xl shadow-black/50`}
            >
              {/* Edit Button (Admin Only) */}
              {editMode && (
                <button
                  onClick={() => setEditingItem(item)}
                  className="absolute top-3 right-3 z-50 p-2 bg-dark-900/80 backdrop-blur text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-vital-500 hover:scale-110 shadow-lg border border-white/10"
                  title="Edit Gallery Item"
                >
                  <Edit2 size={14} />
                </button>
              )}

              {/* Image */}
              <div className="absolute inset-0 w-full h-full overflow-hidden">
                <div className="absolute inset-0 bg-dark-900 z-0"></div>
                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover transform transition-transform duration-1000 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 transition-opacity duration-500 pointer-events-none"></div>

              {/* Content Overlay */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">

                {/* Top Badge */}
                <div className="self-start pointer-events-auto">
                  <div className="inline-block px-3 py-1 rounded-full bg-black/40 md:backdrop-blur-md border border-white/10 text-[10px] font-tech font-bold text-white uppercase tracking-widest opacity-0 transform -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    {item.category}
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-auto">
                  <h3 className="text-2xl font-display font-bold text-white mb-2 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <MapPin size={14} className="text-vital-500 drop-shadow-md" />
                    <span className="text-sm font-sans text-gray-200 drop-shadow-md">
                      {item.location}
                    </span>
                  </div>

                  {/* Decorative line */}
                  <div className="h-0.5 w-0 group-hover:w-12 bg-vital-500 mt-4 transition-all duration-500 ease-out delay-75 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Social CTA Card */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-1 md:row-span-1 rounded-xl bg-gradient-to-br from-dark-800 to-dark-900 border border-white/5 p-8 flex flex-col justify-center items-center text-center group hover:border-vital-500/30 transition-colors relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-vital-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-dark-950 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-vital-500/50 transition-all duration-300 shadow-xl">
                <Camera className="text-white w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-white text-xl mb-2">Share Your Story</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Taken a great shot in the city? Post it in our media channel.
              </p>
              <a href="https://discord.gg/vitalrp" target="_blank" rel="noreferrer" className="text-xs font-bold font-tech uppercase tracking-widest text-vital-500 border-b border-vital-500/30 pb-1 hover:border-vital-500 transition-all">
                Join Discord
              </a>
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <GalleryEditModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveItem}
          onDelete={handleDeleteItem}
          initialData={editingItem}
        />
      )}
    </section>
  );
};