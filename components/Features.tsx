import React from 'react';
import { motion } from 'framer-motion';
import { Car, Briefcase, Skull, DollarSign, Home, Shield } from 'lucide-react';

const features = [
  {
    icon: Car,
    title: "Custom Vehicles",
    description: "Over 400+ custom imported vehicles with realistic handling files, custom sounds, and extensive tuning options."
  },
  {
    icon: Briefcase,
    title: "Player Economy",
    description: "A dynamic, player-driven economy. Own businesses, manage supply chains, and influence the market prices."
  },
  {
    icon: Skull,
    title: "Gangs & Cartels",
    description: "Deep criminal progression systems. Claim territory, manufacture illicit goods, and war for control of the city."
  },
  {
    icon: Shield,
    title: "Emergency Services",
    description: "Advanced PD and EMS scripts including evidence systems, custom medical treatments, and realistic dispatch."
  },
  {
    icon: Home,
    title: "Housing & Interiors",
    description: "Buy any house on the map. Custom furnish your home with thousands of props or buy a pre-furnished mansion."
  },
  {
    icon: DollarSign,
    title: "Legal Jobs",
    description: "From trucking to fishing, garbage collection to mechanic work - earn an honest living with interactive jobs."
  }
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-dark-900 relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-vital-900 to-transparent opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            IMMERSIVE <span className="text-vital-500">FEATURES</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            We've customized every aspect of Vital RP to ensure a unique, lag-free, and engaging experience for every type of roleplayer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-8 rounded-xl bg-dark-800 border border-white/5 hover:border-vital-500/30 transition-all duration-300 hover:bg-dark-700/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-vital-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg bg-dark-900 border border-white/10 flex items-center justify-center mb-6 group-hover:border-vital-500/50 group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-vital-500" />
                </div>
                
                <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-vital-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 leading-relaxed font-sans text-sm">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};