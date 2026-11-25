'use client';

import React from 'react';

const opportunities = [
  {
    title: 'Law and services',
    items: [
      { name: 'Law enforcement (LSPD and BCSO)', text: 'Police and county sheriff departments with custom faction scripts, dispatch, MDTs, tactical gear, and patrol fleets.' },
      { name: 'Emergency medical services', text: 'Triage systems, dynamic patient treatment, rescue vehicles, and high-standard medical RP.' },
    ],
  },
  {
    title: 'Civilian life',
    items: [
      { name: 'Civilian jobs', text: 'Power washing, garbage routes, construction trades, fishing (with dynamite), and hunting.' },
      { name: 'Player-run businesses', text: 'Own restaurants, nightclubs, strip clubs, mechanic shops, and custom retail storefronts.' },
      { name: 'Housing and decorating', text: 'Customizable homes with furniture, private garages, and interior styling.' },
      { name: 'Social RP', text: 'Golf, skateboarding, street racing, local hangouts, and community events.' },
    ],
  },
  {
    title: 'Criminal life',
    items: [
      { name: 'Illegal factions', text: 'Mafia syndicates, street gangs, outlaw motorcycle clubs, and racing crews with real turf rivalries.' },
      { name: 'Crime and heists', text: 'Petty crime, vehicle boosting, multi-stage bank vaults, and Cayo Perico Extraction loot runs.' },
      { name: 'Black market and crafting', text: 'Material farming, scrapping, mining, drug synthesis, and weapon crafting.' },
    ],
  },
];

const worldFeatures = [
  { title: 'In-house scripts', description: 'Written from scratch as custom code, so every system is ours to fix and extend.' },
  { title: 'Vehicle fleet', description: 'Custom import cars, bikes, and work vehicles with realistic handling and deep tuning.' },
  { title: 'Diamond Casino', description: 'Blackjack, roulette, slots, and the daily Lucky Wheel with exclusive podium rides.' },
  { title: 'Cayo Perico Extraction', description: 'Custom missions on Cayo Perico: complete objectives, survive hostile territory, extract with rare loot.' },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="relative scroll-mt-14 overflow-hidden py-16 md:py-28">
      <div className="absolute inset-0 bg-dark-950/95 z-0"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-white/10 z-20"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-10 max-w-3xl md:mb-12">
          <h2 className="text-balance text-3xl md:text-5xl font-display font-black text-white mb-4 tracking-tight">
            What you can do in Vital RP
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">
            Police, EMS, civilian careers, crime, and a casino, all running on scripts we wrote ourselves.
          </p>
        </div>

        {/* Three ways to live in the city. Below desktop each group spreads its items across. */}
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-3 lg:gap-x-10">
          {opportunities.map((group) => (
            <div key={group.title}>
              <h3 className="mb-5 border-b border-white/15 pb-3 text-xl font-display font-bold text-vital-500">
                {group.title}
              </h3>
              <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-1">
                {group.items.map((item) => (
                  <li key={item.name} className="text-[15px] leading-relaxed text-gray-300">
                    <strong className="mb-1 block text-white font-semibold">{item.name}</strong>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Heading in the first column, features across the other two */}
        <div className="mt-16 grid gap-y-6 border-t border-white/15 pt-10 md:mt-20 lg:grid-cols-3 lg:gap-x-10">
          <h3 className="text-xl font-display font-bold text-white">World and features</h3>
          <dl className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-2">
            {worldFeatures.map((feature) => (
              <div key={feature.title}>
                <dt className="font-display font-bold text-white mb-1.5">{feature.title}</dt>
                <dd className="max-w-[44ch] text-gray-300 text-[15px] leading-relaxed">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
};
