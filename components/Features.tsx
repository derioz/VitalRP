import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Users, Shield, Gavel, Hammer, DollarSign, Calendar, Home, Store, Coffee, Crosshair, Skull, MapPin, Sword, Car, Dices } from 'lucide-react';

const offers = [
  { icon: Users, title: "18+ Semi-Serious RP", description: "Focused on story, character development, and immersive scenes rather than simple shootouts." },
  { icon: Shield, title: "Whitelisted Community", description: "Keeping quality high and reducing trolls to protect the integrity of everyone's storylines." },
  { icon: Gavel, title: "Diverse Staff Team", description: "Active staff made up of legal, criminal, lawyer, and LEO players for balanced city insight." },
  { icon: Hammer, title: "Ongoing Development", description: "A living world with regular content updates, script enhancements, and bug fixes." },
  { icon: DollarSign, title: "Balanced Economy", description: "Plenty of ways to make money legally and illegally, ensuring every hustle feels rewarding." },
  { icon: Calendar, title: "Dynamic Events", description: "Player-organized events, server-wide holidays, and community-driven overarching story arcs." }
];

const worldFeatures = [
  { icon: MapPin, title: "Expanded Map", description: "Explore new zones including Roxwood, opening up entirely new RP environments." },
  { icon: Sword, title: "Unique Melee", description: "A wide array of custom melee weapons for varied and intense close-quarters encounters." },
  { icon: Car, title: "Rotating Vehicles", description: "An exclusive, regularly rotating vehicle lineup available through the Vit Coin store." },
  { icon: Dices, title: "Casino Podium", description: "Test your luck. The Casino Podium Car changes regularly with the daily prize wheel." }
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] } }
};

// Reusable sub-section label
const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <span className="text-xs font-tech font-bold text-vital-500 uppercase tracking-[0.25em]">{label}</span>
    <div className="h-px bg-gradient-to-r from-vital-500/40 to-transparent flex-grow"></div>
  </div>
);

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-md z-0"></div>

      {/* Ambient glows for visual depth */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-vital-500/[0.03] blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-blue-500/[0.03] blur-[120px] rounded-full pointer-events-none"></div>

      {/* Top separator */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-vital-900 to-transparent opacity-50 z-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── MAIN HEADER ── */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 uppercase tracking-tight">
            IMMERSIVE <span className="text-vital-500">FEATURES</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            We've customized every aspect of Vital RP to ensure a unique, lag-free, and engaging experience for every type of roleplayer.
          </p>
        </div>

        {/* ── WHAT WE OFFER ── */}
        <SectionLabel label="What We Offer" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16"
        >
          {offers.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative p-6 rounded-2xl bg-dark-800/40 backdrop-blur border border-white/[0.06] hover:border-vital-500/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-vital-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="relative z-10 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-dark-900/80 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-vital-500/40 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.15)] transition-all duration-300">
                  <feature.icon className="w-[18px] h-[18px] text-vital-500" />
                </div>
                <div>
                  <h4 className="text-[15px] font-display font-bold text-white mb-1 group-hover:text-vital-400 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-gray-500 text-[13px] leading-relaxed font-sans">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── IN-GAME OPPORTUNITIES ── */}
        <SectionLabel label="In-Game Opportunities" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-16"
        >
          {/* Law & Services */}
          <motion.div variants={itemVariants} className="md:col-span-5 lg:col-span-4 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-blue-950/20 to-dark-900/40 p-6 backdrop-blur group hover:border-blue-500/25 transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15 group-hover:bg-blue-500/15 transition-colors">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="text-base font-display font-bold text-white leading-tight">Law & Services</h4>
                <span className="text-[9px] uppercase tracking-[0.2em] text-blue-500/60 font-tech font-bold">Public Service</span>
              </div>
            </div>
            <ul className="space-y-3 text-[13px] text-gray-400">
              <li className="flex gap-2.5">
                <div className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-blue-500"></div>
                <p><strong className="text-gray-300">Law Enforcement & DOJ:</strong> Robust LEO departments and an active DOJ community for fighting charges and handling court cases.</p>
              </li>
              <li className="flex gap-2.5">
                <div className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-blue-500"></div>
                <p><strong className="text-gray-300">Emergency Services:</strong> Fire/EMS and supporting roles for those who enjoy medical and rescue RP.</p>
              </li>
            </ul>
          </motion.div>

          {/* Civilian Life */}
          <motion.div variants={itemVariants} className="md:col-span-7 lg:col-span-8 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-emerald-950/20 to-dark-900/40 p-6 backdrop-blur group hover:border-emerald-500/25 transition-all duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/15 group-hover:bg-emerald-500/15 transition-colors">
                <Home size={20} />
              </div>
              <div>
                <h4 className="text-base font-display font-bold text-white leading-tight">Civilian Life</h4>
                <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-500/60 font-tech font-bold">Daily Life</span>
              </div>
            </div>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[13px] text-gray-400">
              <li className="flex gap-2.5">
                <div className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-emerald-500"></div>
                <p>Housing system with full decoration support, plus optional professional decorators.</p>
              </li>
              <li className="flex gap-2.5">
                <div className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-emerald-500"></div>
                <p>Player-owned and operated businesses, restaurants, nightclubs, and strip clubs.</p>
              </li>
              <li className="flex gap-2.5">
                <div className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-emerald-500"></div>
                <p>Golf, skateboarding, street racing, hunting, treasure hunting, and a water park for social RP.</p>
              </li>
              <li className="flex gap-2.5">
                <div className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-emerald-500"></div>
                <p>Pets system featuring rideable horses and donkeys, plus pigs, cows, chickens, rats, and more.</p>
              </li>
            </ul>
          </motion.div>

          {/* Criminal Life */}
          <motion.div variants={itemVariants} className="md:col-span-12 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-red-950/15 via-dark-900/40 to-dark-900/40 p-6 backdrop-blur group hover:border-red-500/25 transition-all duration-300 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-red-900/[0.04] to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl border border-red-500/15 group-hover:bg-red-500/15 transition-colors">
                <Skull size={20} />
              </div>
              <div>
                <h4 className="text-base font-display font-bold text-white leading-tight">Criminal Life</h4>
                <span className="text-[9px] uppercase tracking-[0.2em] text-red-500/60 font-tech font-bold">The Underworld</span>
              </div>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px] text-gray-400 relative z-10">
              <li className="flex gap-2.5 bg-dark-900/40 p-3.5 rounded-xl border border-white/[0.04]">
                <Crosshair size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p>Criminal activities ranging from petty crime to large-scale heists.</p>
              </li>
              <li className="flex gap-2.5 bg-dark-900/40 p-3.5 rounded-xl border border-white/[0.04]">
                <Store size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p>Multiple material farming paths, including illegal scrapping and legal mining.</p>
              </li>
              <li className="flex gap-2.5 bg-dark-900/40 p-3.5 rounded-xl border border-white/[0.04]">
                <Coffee size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p>Multiple drug crafting methods and gun crafting systems for deeper progression.</p>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* ── WORLD & FEATURES ── */}
        <SectionLabel label="World & Features" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {worldFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group p-5 rounded-2xl bg-dark-900/60 backdrop-blur border border-white/[0.06] hover:border-vital-500/40 hover:shadow-[0_0_25px_rgba(249,115,22,0.08)] transition-all duration-500 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <feature.icon className="w-5 h-5 text-vital-500 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-display font-bold text-white leading-tight">
                  {feature.title}
                </h4>
              </div>
              <p className="text-gray-500 text-[13px] leading-relaxed font-sans">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};