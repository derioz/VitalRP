import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "Is Vital RP a whitelist server?",
    answer: "Yes, we are a whitelist community. However, our application process is straightforward. We want to ensure that players understand our rules and are committed to serious roleplay before joining."
  },
  {
    question: "What is the age requirement?",
    answer: "You must be 18 years or older to join Vital RP. We cover mature themes and expect a level of maturity from our player base that aligns with an adult community."
  },
  {
    question: "Do I need a high-end PC?",
    answer: "We optimize our assets heavily. If you can run base GTA V at 60 FPS, you should have a smooth experience on Vital RP. We recommend 16GB of RAM for the best texture loading."
  },
  {
    question: "Is voice chat required?",
    answer: "Yes, a working microphone is mandatory. We use a custom high-quality voice plugin (pma-voice) that is built into the server, so no external TeamSpeak downloads are required."
  },
  {
    question: "Is controller support enabled?",
    answer: "Yes! Driving and flying work perfectly with controllers. Some complex menu interactions may still require a mouse and keyboard, but daily gameplay is very controller-friendly."
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.21, 0.47, 0.32, 0.98]
    }
  }
};

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-dark-800 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-vital-500/10 text-vital-500 mb-4">
            <HelpCircle size={24} />
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            COMMON <span className="text-vital-500">QUESTIONS</span>
          </h2>
          <p className="text-gray-400">Everything you need to know before flying in.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="border border-white/10 rounded-lg bg-dark-900 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-lg font-bold text-white font-display">{faq.question}</span>
                <span className={`transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-vital-500' : 'text-gray-500'}`}>
                  {openIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                </span>
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};