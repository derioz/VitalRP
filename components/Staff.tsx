import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StaffEditModal } from './StaffEditModal';
import { GlassStaffCard } from './ui/glass-staff-card';

interface StaffMember {
  id?: string;
  name: string;
  role: string;
  subRole?: string;
  color: string;
  category: string;
  image?: string;
  order?: number;
}

interface StaffGroup {
  title: string;
  items: StaffMember[];
}

export const Staff: React.FC = () => {
  const { editMode } = useAuth();
  const [staffGroups, setStaffGroups] = useState<StaffGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // Realtime listener
    const q = query(collection(db, 'staff'), orderBy('role'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allStaff: StaffMember[] = [];
      snapshot.forEach(doc => allStaff.push({ id: doc.id, ...doc.data() } as StaffMember));

      // Sort by the `order` field manually so we don't exclude old docs that don't have it yet
      allStaff.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        return orderA - orderB;
      });

      // Grouping logic
      const groups: StaffGroup[] = [
        {
          title: "Management",
          items: allStaff.filter(s => s.category === 'Management')
        },
        {
          title: "Administration",
          items: allStaff.filter(s => s.category === 'Administration')
        },
        {
          title: "Moderation Team",
          items: allStaff.filter(s => s.category === 'Moderation Team')
        }
      ].filter(g => g.items.length > 0);

      setStaffGroups(groups);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching staff:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveMember = async (data: any) => {
    if (!editingMember?.id || !db) return;

    const docRef = doc(db, 'staff', editingMember.id);
    await setDoc(docRef, {
      name: data.name,
      role: data.role,
      subRole: data.subRole || '',
      image: data.image || '',
      color: data.color,
      category: data.category
    }, { merge: true });
  };

  const handleDeleteMember = async () => {
    if (!editingMember?.id || !db) return;
    await deleteDoc(doc(db, 'staff', editingMember.id));
  };

  const handleReorder = async (groupIndex: number, newItems: StaffMember[]) => {
    // Optimistically update UI
    const newGroups = [...staffGroups];
    newGroups[groupIndex].items = newItems;
    setStaffGroups(newGroups);

    // Save new order to Firebase
    if (!db) return;

    try {
      const batch = writeBatch(db);
      newItems.forEach((item, index) => {
        if (item.id) {
          const docRef = doc(db, 'staff', item.id);
          batch.update(docRef, { order: index });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to save new order:", error);
      // Let the snapshot listener revert the UI if it failed
    }
  };

  return (
    <section id="staff" className="py-16 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-dark-950 md:bg-dark-900/80 md:backdrop-blur-sm z-0"></div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vital-900/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">

        {/* Header */}
        <div className="text-center mb-16 pt-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-bold text-white mb-6 uppercase tracking-tight"
          >
            Meet The <span className="text-vital-500">Staff</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="h-1 w-24 bg-dark-800 mx-auto rounded-full overflow-hidden"
          >
            <div className="h-full w-full bg-vital-500/50 -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </motion.div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 font-tech uppercase tracking-widest animate-pulse py-20">Loading roster...</div>
        ) : staffGroups.length === 0 ? (
          <div className="text-center text-gray-500 py-20 font-tech">
            <p>No staff members listed yet.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {staffGroups.map((group, groupIdx) => (
              <div key={group.title} className="relative">
                {/* Group Label */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-6 mb-8"
                >
                  <h3 className="text-xl md:text-2xl font-display font-bold text-white/80 tracking-tight">{group.title}</h3>
                  <div className="h-px bg-gradient-to-r from-white/20 to-transparent flex-grow"></div>
                </motion.div>

                {/* Grid / Reorder Group */}
                {editMode ? (
                  <Reorder.Group
                    axis="y"
                    values={group.items}
                    onReorder={(newItems) => handleReorder(groupIdx, newItems)}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {group.items.map((member) => (
                      <Reorder.Item key={member.id} value={member} className="h-full w-full cursor-grab active:cursor-grabbing">
                        <GlassStaffCard
                          member={member}
                          editMode={editMode}
                          onEdit={setEditingMember}
                        />
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((member) => (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        className="h-full w-full"
                      >
                        <GlassStaffCard
                          member={member}
                          editMode={editMode}
                          onEdit={setEditingMember}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {editingMember && (
        <StaffEditModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveMember}
          onDelete={handleDeleteMember}
          initialData={editingMember}
        />
      )}
    </section>
  );
};