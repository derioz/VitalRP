'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
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
  },
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reducedMotion = useReducedMotion();

  return (
    <section id="faq" className="relative scroll-mt-14 bg-dark-800 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="text-balance text-3xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
              Common questions
            </h2>
            <p className="text-gray-300">Answers to what new players ask most.</p>
          </div>

          <div className="border-t border-white/15 lg:col-span-8">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex min-h-16 w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-vital-400"
                >
                  <span className="text-lg font-bold text-white font-display">{faq.question}</span>
                  <span className={`shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-vital-500' : 'text-gray-400'}`}>
                    {openIndex === index ? <Minus size={20} aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
                  </span>
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[65ch] pb-6 leading-relaxed text-gray-300">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};