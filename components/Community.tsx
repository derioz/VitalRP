import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Star, Twitch, MessageCircle } from 'lucide-react';

const testimonials = [
  {
    name: "Marcus 'King' Lowe",
    role: "Southside Vagos",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
    quote: "The criminal progression is unmatched. You don't just rob stores; you build an empire. The gang turf mechanics are smooth and competitive.",
    platform: "Twitch Partner"
  },
  {
    name: "Sarah Jenkins",
    role: "EMS Chief",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    quote: "I've been RPing as a medic for 3 years, and Vital RP has the most in-depth medical script I've ever seen. It makes saving lives feel intense.",
    platform: "Community Veteran"
  },
  {
    name: "Officer Bradley",
    role: "LSPD Captain",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop",
    quote: "Balanced economy, serious policing, and a dev team that actually listens. This is the home I've been looking for since NoPixel 2.0.",
    platform: "RP Streamer"
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.21, 0.47, 0.32, 0.98]
    }
  }
};

export const Community: React.FC = () => {
  return (
    <section id="community" className="py-24 bg-dark-900 relative border-t border-white/5">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-vital-900/5 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
              PLAYER <span className="text-vital-500">STORIES</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-sans">
              Don't just take our word for it. Hear from the dedicated roleplayers, streamers, and faction leaders who call Vital RP home.
            </p>
          </motion.div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-dark-800 p-8 rounded-2xl border border-white/5 relative group hover:border-vital-500/30 transition-colors"
            >
              <Quote className="absolute top-8 right-8 text-vital-500/20 w-12 h-12" />
              
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-vital-500/50"
                />
                <div>
                  <h4 className="text-white font-bold font-display text-lg">{item.name}</h4>
                  <p className="text-vital-400 text-sm font-tech uppercase tracking-wider">{item.role}</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 italic leading-relaxed font-sans">"{item.quote}"</p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-tech text-gray-500 uppercase tracking-widest">{item.platform}</span>
                {item.platform.includes('Twitch') ? (
                  <Twitch className="w-4 h-4 text-purple-400" />
                ) : (
                  <MessageCircle className="w-4 h-4 text-vital-500" />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};