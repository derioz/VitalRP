import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Shield, Stethoscope, Skull, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from './Button';

const factions = [
  {
    id: 'lspd',
    title: 'Los Santos Police',
    subtitle: 'Protect & Serve',
    description: 'Join the ranks of the LSPD. Utilize advanced evidence scripts, a custom fleet, and specialized units like S.W.A.T and Air Support to keep the streets safe.',
    icon: Shield,
    color: 'text-blue-400',
    borderColor: 'group-hover:border-blue-500/50',
    bgGradient: 'from-blue-500/10',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop'
  },
  {
    id: 'ems',
    title: 'Emergency Services',
    subtitle: 'Save Lives',
    description: 'Master a complex medical system. Treat gunshot wounds, perform surgeries, and manage trauma in high-stakes situations across the city.',
    icon: Stethoscope,
    color: 'text-red-400',
    borderColor: 'group-hover:border-red-500/50',
    bgGradient: 'from-red-500/10',
    image: 'https://images.unsplash.com/photo-1587815256586-25805c6d369c?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: 'crim',
    title: 'Underground',
    subtitle: 'Rule the Streets',
    description: 'Form a gang, claim turf, manufacture narcotics, or pull off complex bank heists. The criminal underworld is vast, dangerous, and lucrative.',
    icon: Skull,
    color: 'text-vital-500',
    borderColor: 'group-hover:border-vital-500/50',
    bgGradient: 'from-vital-500/10',
    image: 'https://images.unsplash.com/photo-1563604018-86c0e9eb8944?q=80&w=2071&auto=format&fit=crop'
  },
  {
    id: 'civ',
    title: 'Enterprise',
    subtitle: 'Build an Empire',
    description: 'Own nightclubs, mechanic shops, restaurants, or dealerships. The economy is player-run, meaning your business acumen determines your success.',
    icon: Briefcase,
    color: 'text-emerald-400',
    borderColor: 'group-hover:border-emerald-500/50',
    bgGradient: 'from-emerald-500/10',
    image: 'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?q=80&w=2128&auto=format&fit=crop'
  }
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
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

export const Factions: React.FC = () => {
  return (
    <section className="py-24 bg-dark-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
              CHOOSE YOUR <span className="text-vital-500">PATH</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-sans">
              Los Santos is a city of opportunity. Whether you enforce the law, break it, or build a business empire, your story is yours to write.
            </p>
          </motion.div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {factions.map((faction, index) => (
            <motion.div
              key={faction.id}
              variants={itemVariants}
              className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-dark-800 h-80 md:h-96 transition-all duration-500 ${faction.borderColor}`}
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0">
                <img 
                  src={faction.image} 
                  alt={faction.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-20"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${faction.bgGradient} via-dark-900/80 to-dark-900/90`}></div>
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-lg bg-dark-950/50 backdrop-blur border border-white/10 ${faction.color}`}>
                    <faction.icon size={24} />
                  </div>
                  <span className={`text-xs font-tech font-bold uppercase tracking-widest ${faction.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0`}>
                    {faction.subtitle}
                  </span>
                </div>

                <div className="transform transition-transform duration-300 translate-y-4 group-hover:translate-y-0">
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                    {faction.title}
                  </h3>
                  <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {faction.description}
                  </p>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <button className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider hover:text-vital-400 transition-colors">
                      Learn More <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};