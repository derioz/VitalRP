'use client';

import React from 'react';

const values = [
  {
    title: "Narrative over winning",
    description: "We believe the best stories come from conflict, flaws, and failure. We prioritize character development and scene integrity over 'winning' a shootout or chase."
  },
  {
    title: "Community first",
    description: "Your voice shapes the city. We actively listen to feedback and hold regular town halls."
  },
  {
    title: "Player-run economy",
    description: "No spawned money. Every dollar in circulation is earned, spent, and circulated by players owning businesses and providing services."
  },
];

export const Values: React.FC = () => {
  return (
    <section id="values" className="relative scroll-mt-14 overflow-hidden pb-8 pt-16 md:pb-12 md:pt-24">
      <div className="absolute inset-0 bg-dark-900/95"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
          <div className="lg:col-span-4">
            <h2 className="text-balance text-3xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
              What we value
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Vital RP is built around a few commitments that staff and players are held to equally.
            </p>
          </div>

          <ul className="lg:col-span-8 border-t border-white/15">
            {values.map((item) => (
              <li key={item.title} className="border-b border-white/10 py-6">
                <h3 className="text-xl font-display font-bold text-white mb-2">{item.title}</h3>
                <p className="max-w-[65ch] text-gray-300 leading-relaxed">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
