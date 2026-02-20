import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Drama, Heart, RefreshCw, Eye, Zap, Crosshair, ShieldAlert, BookOpen } from 'lucide-react';

const rules = [
  {
    title: "18+ Community",
    description: "This is strictly an 18+ server. Mature themes and conversations are present. No exceptions.",
    icon: ShieldAlert
  },
  {
    title: "Serious Roleplay",
    description: "Stay in character at all times. Prioritize the story and realism over winning or mechanics. Drive the narrative forward.",
    icon: Drama
  },
  {
    title: "Value of Life (Fear RP)",
    description: "You must prioritize your character's life at all times. Act realistically when threatened with grievous harm.",
    icon: Heart
  },
  {
    title: "New Life Rule (NLR)",
    description: "If you are downed and respawn, you forget the events leading to your death. You cannot return to the scene for 30 minutes.",
    icon: RefreshCw
  },
  {
    title: "No Metagaming",
    description: "Using Out-Of-Character (OOC) information in-game is strictly prohibited. Keep discord/stream info separate.",
    icon: Eye
  },
  {
    title: "No Powergaming",
    description: "Do not force outcomes on other players. Give everyone a fair chance to react and roleplay their side of the story.",
    icon: Zap
  },
  {
    title: "No RDM / VDM",
    description: "Random Deathmatch (killing without reason) and Vehicle Deathmatch (using cars as weapons) are forbidden.",
    icon: Crosshair
  },
  {
    title: "Respect & No Toxicity",
    description: "Zero tolerance for toxicity, racism, slurs, or harassment. We are here to tell stories together.",
    icon: BookOpen
  }
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05
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

export const Rules: React.FC = () => {
  return (
    <section id="rules" className="py-24 bg-dark-800 relative overflow-hidden">
      {/* Background noise texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 uppercase tracking-tight">
              SERVER <span className="text-vital-500">RULES</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-sans">
              To ensure a high-quality immersive experience for everyone, all citizens must adhere to our core constitution.
            </p>
          </motion.div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {rules.map((rule, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-dark-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-xl hover:border-vital-500/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-vital-500/10 flex items-center justify-center mb-4 group-hover:bg-vital-500/20 transition-colors">
                <rule.icon className="w-6 h-6 text-vital-500" />
              </div>
              <h3 className="text-white font-display font-bold text-lg mb-2 group-hover:text-vital-400 transition-colors">
                {rule.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {rule.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <a
            href="https://docs.google.com/document/d/1ZhxNk5zCsZy9eE1Xlo8ALanxtjsFV6TclpAoNHUZHpo/edit?tab=t.0"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-vital-500 text-sm mb-6 inline-flex items-center gap-2 underline underline-offset-4 decoration-white/20 hover:decoration-vital-500 transition-all"
          >
            This is a summary. Click here to read the full legislation document.
          </a>
        </div>
      </div>
    </section>
  );
};