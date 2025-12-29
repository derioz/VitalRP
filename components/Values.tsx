import React from 'react';
import { motion, Variants } from 'framer-motion';
import { BookOpen, Users, ShieldCheck, Zap, Scale, Crown } from 'lucide-react';

const values = [
  {
    id: "01",
    title: "Narrative Over Winning",
    description: "We believe the best stories come from conflict, flaws, and failure. We prioritize character development and scene integrity over 'winning' a shootout or chase.",
    icon: BookOpen,
    className: "md:col-span-2 md:row-span-1",
    gradient: "from-vital-600/20 to-transparent"
  },
  {
    id: "02",
    title: "Community First",
    description: "Your voice shapes the city. We actively listen to feedback and hold regular town halls.",
    icon: Users,
    className: "md:col-span-1 md:row-span-1",
    gradient: "from-blue-500/20 to-transparent"
  },
  {
    id: "03",
    title: "Zero Toxicity",
    description: "A strict zero-tolerance policy for harassment. We protect our safe, inclusive environment aggressively.",
    icon: ShieldCheck,
    className: "md:col-span-1 md:row-span-1",
    gradient: "from-red-500/20 to-transparent"
  },
  {
    id: "04",
    title: "Optimized Performance",
    description: "Custom asset management ensuring high FPS even in dense areas.",
    icon: Zap,
    className: "md:col-span-1 md:row-span-1",
    gradient: "from-yellow-500/20 to-transparent"
  },
  {
    id: "05",
    title: "Player-Run Economy",
    description: "No spawned money. Every dollar in circulation is earned, spent, and circulated by players owning businesses and providing services.",
    icon: Scale,
    className: "md:col-span-1 md:row-span-1",
    gradient: "from-emerald-500/20 to-transparent"
  }
];

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
      duration: 0.6,
      ease: [0.21, 0.47, 0.32, 0.98] as const
    }
  }
};

export const Values: React.FC = () => {
  return (
    <section id="values" className="py-24 relative overflow-hidden">
       {/* Transparent BG to let parallax show through gaps, Solid dark on mobile for FPS */}
       <div className="absolute inset-0 bg-dark-950 md:bg-dark-900/70 md:backdrop-blur-md"></div>
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl text-center md:text-left"
          >
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <Crown size={16} className="text-vital-500" />
              <span className="text-vital-500 font-tech uppercase tracking-widest text-xs font-bold">Our Philosophy</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white">
              WHAT WE <span className="text-transparent bg-clip-text bg-gradient-to-r from-vital-400 to-vital-600">VALUE</span>
            </h2>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-gray-400 max-w-sm text-sm text-center md:text-right font-sans leading-relaxed"
          >
            Vital RP isn't just a server; it's a standard. We are dedicated to providing the highest quality roleplay environment on FiveM.
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]"
        >
          {values.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className={`relative group p-8 rounded-2xl border border-white/5 bg-dark-800 md:bg-dark-800/80 md:backdrop-blur hover:border-vital-500/30 transition-all duration-500 overflow-hidden ${item.className}`}
            >
              {/* Hover Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Background ID Number */}
              <div className="absolute top-4 right-6 text-6xl font-display font-black text-white/5 group-hover:text-white/10 transition-colors duration-500 select-none">
                {item.id}
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-dark-900/50 border border-white/10 flex items-center justify-center mb-4 text-vital-500 group-hover:scale-110 group-hover:bg-vital-500 group-hover:text-white transition-all duration-300">
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3 group-hover:text-vital-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                    {item.description}
                  </p>
                </div>
                
                {/* Decorative Line */}
                <div className="w-8 h-1 bg-vital-500/30 rounded-full group-hover:w-full group-hover:bg-vital-500 transition-all duration-500"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};