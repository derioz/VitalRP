import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { Crown, ShieldAlert, Shield, Star, Rat, ShieldCheck, Gavel, Shirt, Edit2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { collection, getDocs, query, orderBy, doc, deleteDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StaffEditModal } from './StaffEditModal';

interface StaffMember {
  id?: string;
  name: string;
  role: string;
  subRole?: string;
  color: string;
  category: string;
  image?: string;
}

interface StaffGroup {
  title: string;
  items: StaffMember[];
}

const getColorClasses = (color: string) => {
  switch (color) {
    case 'amber':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500',
        border: 'group-hover:border-amber-500/50',
        glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]',
        gradient: 'from-amber-500/20 to-transparent'
      };
    case 'red':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500',
        border: 'group-hover:border-red-500/50',
        glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
        gradient: 'from-red-500/20 to-transparent'
      };
    case 'green':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500',
        border: 'group-hover:border-emerald-500/50',
        glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)]',
        gradient: 'from-emerald-500/20 to-transparent'
      };
    case 'yellow':
      return {
        text: 'text-yellow-400',
        bg: 'bg-yellow-500',
        border: 'group-hover:border-yellow-500/50',
        glow: 'group-hover:shadow-[0_0_30px_rgba(250,204,21,0.2)]',
        gradient: 'from-yellow-500/20 to-transparent'
      };
    case 'purple':
      return {
        text: 'text-purple-400',
        bg: 'bg-purple-500',
        border: 'group-hover:border-purple-500/50',
        glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]',
        gradient: 'from-purple-500/20 to-transparent'
      };
    default:
      return {
        text: 'text-vital-400',
        bg: 'bg-vital-500',
        border: 'group-hover:border-vital-500/50',
        glow: 'group-hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]',
        gradient: 'from-vital-500/20 to-transparent'
      };
  }
};

const RoleIcon = ({ role, subRole, className, size }: { role: string, subRole?: string, className?: string, size?: number }) => {
  if (role === 'Owner') return <Crown className={className} size={size} />;
  if (role === 'Senior Admin') return <ShieldAlert className={className} size={size} />;
  if (role === 'Clothing Dev' || subRole === 'Clothing Dev') return <Shirt className={className} size={size} />;
  if (role === 'Senior Mod') return <ShieldCheck className={className} size={size} />;
  if (role === 'Mod' || role === 'Moderator') return <Gavel className={className} size={size} />;
  return <Shield className={className} size={size} />;
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
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98] as const
    }
  }
};

interface StaffCardProps {
  member: StaffMember;
  index: number;
  onEdit?: (member: StaffMember) => void;
}

const StaffCard: React.FC<StaffCardProps> = ({ member, onEdit }) => {
  const { editMode } = useAuth();
  const [isRatMode, setIsRatMode] = useState(false);
  const colors = getColorClasses(member.color);
  const isSoup = member.name === 'Soup';

  const handleClick = (e: React.MouseEvent) => {
    if (isSoup && !editMode) {
      setIsRatMode(!isRatMode);
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      onClick={handleClick}
      className={`group relative h-40 bg-dark-800 md:bg-dark-800/80 md:backdrop-blur rounded-xl overflow-hidden border border-white/5 ${colors.border} transition-all duration-300 ${colors.glow} ${isSoup && !editMode ? 'cursor-pointer' : ''}`}
    >
      {/* Edit Button (Admin Only) */}
      {editMode && onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(member);
          }}
          className="absolute top-2 right-2 z-50 p-2 bg-dark-900/80 backdrop-blur text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-vital-500 hover:scale-110 shadow-lg border border-white/10"
          title="Edit Card"
        >
          <Edit2 size={14} />
        </button>
      )}

      {/* Large Background Initial */}
      <div className="absolute -right-2 -bottom-4 font-display font-black text-[120px] leading-none text-white/[0.03] group-hover:text-white/[0.07] transition-colors select-none pointer-events-none">
        {isRatMode ? '🐀' : member.name.charAt(0)}
      </div>

      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-b ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">

        {/* Top Bar */}
        <div className="flex justify-between items-start">
          <div className={`w-10 h-10 rounded-lg bg-dark-900/80 md:backdrop-blur border border-white/10 flex items-center justify-center ${colors.text} group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
            {isRatMode ? (
              <motion.div
                initial={{ rotate: -20, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <Rat size={20} />
              </motion.div>
            ) : member.image ? (
              <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <RoleIcon role={member.role} subRole={member.subRole} size={20} />
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Star size={10} className={colors.text} fill="currentColor" />
          </div>
        </div>

        {/* Bottom Info */}
        <div>
          <div className={`text-[9px] font-tech font-bold uppercase tracking-widest mb-1 ${colors.text} opacity-80 flex flex-col`}>
            {isRatMode ? (
              <span>Fashion Icon</span>
            ) : (
              <>
                <span>{member.role}</span>
                {member.subRole && (
                  <span className="text-white/60 text-[8px] mt-0.5 border-l-2 border-current pl-1.5 leading-none py-0.5">
                    {member.subRole}
                  </span>
                )}
              </>
            )}
          </div>
          <motion.h4
            key={isRatMode ? 'rat' : 'normal'}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-display font-bold text-white group-hover:translate-x-1 transition-transform duration-300 truncate"
          >
            {isRatMode ? '"I look like a rat"' : member.name}
          </motion.h4>

          {/* Decorative Line */}
          <div className={`h-0.5 w-6 mt-3 rounded-full ${colors.bg} group-hover:w-full transition-all duration-500 ease-out`}></div>
        </div>
      </div>
    </motion.div>
  );
};

export const Staff: React.FC = () => {
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
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-display font-black text-white mb-4 uppercase tracking-tight"
          >
            Meet The <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600">Staff</span>
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
          <div className="text-center text-gray-500">Loading roster...</div>
        ) : staffGroups.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p>No staff members listed yet.</p>
          </div>
        ) : (
          staffGroups.map((group) => (
            <div key={group.title} className="mb-10 last:mb-0">
              {/* Group Label */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 mb-5"
              >
                <h3 className="text-lg font-display font-bold text-gray-500 uppercase tracking-widest">{group.title}</h3>
                <div className="h-px bg-white/10 flex-grow"></div>
              </motion.div>

              {/* Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {group.items.map((member, index) => (
                  <StaffCard
                    key={member.id || index}
                    member={member}
                    index={index}
                    onEdit={setEditingMember}
                  />
                ))}
              </motion.div>
            </div>
          ))
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