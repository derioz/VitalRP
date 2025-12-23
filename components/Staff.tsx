import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ShieldAlert, Shield, Star } from 'lucide-react';

const staffGroups = [
  {
    title: "Management",
    items: [
      { name: "Grumpy", role: "Owner", color: "amber" },
      { name: "Nez", role: "Owner", color: "amber" },
      { name: "Soup", role: "Owner", color: "amber" },
      { name: "Bug", role: "Senior Admin", color: "red" },
    ]
  },
  {
    title: "Administration",
    items: [
      { name: "Rue", role: "Admin", color: "orange" },
      { name: "Damon", role: "Admin", color: "orange" },
      { name: "Peaches", role: "Admin", color: "orange" },
      { name: "Parzival", role: "Admin", color: "orange" },
      { name: "Artemis", role: "Admin", color: "orange" },
    ]
  }
];

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

const RoleIcon = ({ role, className, size }: { role: string, className?: string, size?: number }) => {
  if (role === 'Owner') return <Crown className={className} size={size} />;
  if (role === 'Senior Admin') return <ShieldAlert className={className} size={size} />;
  return <Shield className={className} size={size} />;
};

export const Staff: React.FC = () => {
  return (
    <section id="staff" className="py-16 bg-dark-900 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-vital-900/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
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

        {staffGroups.map((group, groupIndex) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.items.map((member, index) => {
                const colors = getColorClasses(member.color);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`group relative h-40 bg-dark-800 rounded-xl overflow-hidden border border-white/5 ${colors.border} transition-all duration-300 ${colors.glow}`}
                  >
                    {/* Large Background Initial */}
                    <div className="absolute -right-2 -bottom-4 font-display font-black text-[120px] leading-none text-white/[0.03] group-hover:text-white/[0.07] transition-colors select-none pointer-events-none">
                      {member.name.charAt(0)}
                    </div>

                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                    {/* Content */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                      
                      {/* Top Bar */}
                      <div className="flex justify-between items-start">
                         <div className={`w-8 h-8 rounded-lg bg-dark-900/80 backdrop-blur border border-white/10 flex items-center justify-center ${colors.text} group-hover:scale-110 transition-transform duration-300`}>
                           <RoleIcon role={member.role} size={16} />
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <Star size={10} className={colors.text} fill="currentColor" />
                         </div>
                      </div>

                      {/* Bottom Info */}
                      <div>
                        <div className={`text-[9px] font-tech font-bold uppercase tracking-widest mb-1 ${colors.text} opacity-80`}>
                          {member.role}
                        </div>
                        <h4 className="text-xl font-display font-bold text-white group-hover:translate-x-1 transition-transform duration-300">
                          {member.name}
                        </h4>
                        
                        {/* Decorative Line */}
                        <div className={`h-0.5 w-6 mt-3 rounded-full ${colors.bg} group-hover:w-full transition-all duration-500 ease-out`}></div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

      </div>
    </section>
  );
};