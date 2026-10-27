'use client';

import React from 'react';

const values = [
  {
    id: "01",
    title: "Narrative over winning",
    description: "We believe the best stories come from conflict, flaws, and failure. We prioritize character development and scene integrity over 'winning' a shootout or chase."
  },
  {
    id: "02",
    title: "Community first",
    description: "Your voice shapes the city. We actively listen to feedback and hold regular town halls."
  },
  {
    id: "03",
    title: "Zero toxicity",
    description: "A strict zero-tolerance policy for harassment. We protect our safe, inclusive environment aggressively."
  },
  {
    id: "04",
    title: "Optimized performance",
    description: "Custom asset management ensuring high FPS even in dense areas."
  },
  {
    id: "05",
    title: "Player-run economy",
    description: "No spawned money. Every dollar in circulation is earned, spent, and circulated by players owning businesses and providing services."
  }
];

export const Values: React.FC = () => {
  return (
    <section id="values" className="py-24 relative overflow-hidden scroll-mt-24">
      <div className="absolute inset-0 bg-dark-900/95"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-10">
          <div className="lg:col-span-4">
            <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-5 tracking-tight">
              What we value
            </h2>
            <p className="text-gray-300 leading-relaxed">
              Vital RP is built around a few commitments that staff and players are held to equally.
            </p>
          </div>

          <ol className="lg:col-span-8 border-t border-white/15">
            {values.map((item) => (
              <li key={item.id} className="grid grid-cols-[3rem_1fr] gap-x-4 py-6 border-b border-white/10">
                <span className="font-tech tabular-nums text-vital-500 pt-1">{item.id}</span>
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
